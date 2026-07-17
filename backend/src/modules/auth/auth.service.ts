import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { BlacklistType, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { MailService } from '../../common/mail/mail.service';
import { JwtPayload } from '../../common/guards/jwt-user.interface';
import {
  EmailDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  UpdateProfileDto,
} from './dto/auth.dto';

const ACCESS_SECONDS = 60 * 60;
const REFRESH_SECONDS = 30 * 24 * 60 * 60;
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  randomBytes(32).toString('hex'),
  12,
);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly mail: MailService,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private publicUser(user: {
    id: string;
    email: string;
    fullName: string;
    phoneNumber: string | null;
    role: UserRole;
    isVerified: boolean;
  }) {
    return user;
  }

  async register(dto: RegisterDto) {
    const blocked = await this.prisma.blacklist.findUnique({
      where: { type_value: { type: BlacklistType.EMAIL, value: dto.email } },
    });
    if (blocked)
      throw new ForbiddenException('This email cannot create an account');
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email is already registered');

    const token = randomBytes(32).toString('hex');
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: await bcrypt.hash(dto.password, 12),
        fullName: dto.fullName,
        phoneNumber: dto.phoneNumber,
        role: UserRole.CUSTOMER,
        verificationTokenHash: this.hashToken(token),
        tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        role: true,
        isVerified: true,
      },
    });
    await this.sendVerification(user.email, token);
    return {
      message:
        'Registration successful; check your email to verify the account',
      data: this.publicUser(user),
    };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        verificationTokenHash: this.hashToken(token),
        tokenExpiresAt: { gt: new Date() },
        deletedAt: null,
      },
    });
    if (!user)
      throw new BadRequestException('Verification token is invalid or expired');
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationTokenHash: null,
        tokenExpiresAt: null,
      },
    });
    return { message: 'Email verified successfully', data: null };
  }

  async resendVerification(dto: EmailDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null, isActive: true },
    });
    if (!user || user.isVerified)
      return {
        message: 'If eligible, a verification email has been sent',
        data: null,
      };
    const token = randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationTokenHash: this.hashToken(token),
        tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    await this.sendVerification(user.email, token);
    return {
      message: 'If eligible, a verification email has been sent',
      data: null,
    };
  }

  async login(dto: LoginDto, adminOnly = false) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null, isActive: true },
    });
    const valid = user
      ? await bcrypt.compare(dto.password, user.passwordHash)
      : await bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH);
    if (!user || !valid)
      throw new UnauthorizedException('Invalid email or password');
    if (adminOnly && user.role === UserRole.CUSTOMER)
      throw new UnauthorizedException('Invalid admin credentials');
    if (!adminOnly && user.role !== UserRole.CUSTOMER)
      throw new UnauthorizedException('Use the admin login endpoint');
    const blocked = await this.prisma.blacklist.findUnique({
      where: { type_value: { type: BlacklistType.EMAIL, value: user.email } },
    });
    if (blocked) throw new ForbiddenException('Account access is blocked');
    return { user: this.publicUser(user), ...(await this.issueTokens(user)) };
  }

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken)
      throw new UnauthorizedException('Refresh token cookie is missing');
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }
    if (
      payload.tokenType !== 'refresh' ||
      (await this.redis.exists(`revoked:refresh:${payload.jti}`))
    ) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }
    await this.revoke(payload);
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null, isActive: true },
    });
    if (!user) throw new UnauthorizedException('Account is unavailable');
    return this.issueTokens(user);
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        ignoreExpiration: true,
      });
      if (payload.jti) await this.revoke(payload);
    } catch {
      return;
    }
  }

  async me(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const data: {
      fullName?: string;
      phoneNumber?: string;
      passwordHash?: string;
    } = {};
    if (dto.fullName) data.fullName = dto.fullName;
    if (dto.phoneNumber) data.phoneNumber = dto.phoneNumber;
    if (dto.newPassword) {
      if (
        !dto.currentPassword ||
        !(await bcrypt.compare(dto.currentPassword, user.passwordHash))
      ) {
        throw new UnauthorizedException('Current password is incorrect');
      }
      data.passwordHash = await bcrypt.hash(dto.newPassword, 12);
    }
    await this.prisma.user.update({ where: { id: userId }, data });
    return this.me(userId);
  }

  async forgotPassword(dto: EmailDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, isActive: true, deletedAt: null },
    });
    if (user) {
      const token = randomBytes(32).toString('hex');
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetTokenHash: this.hashToken(token),
          resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
      const base = this.config.get<string>(
        'FRONTEND_URL',
        this.config.get<string>('BASE_URL', ''),
      );
      await this.mail.send(
        user.email,
        'Seli Florist password reset',
        `Reset your password: ${base}/reset-password?token=${encodeURIComponent(token)}`,
      );
    }
    return {
      message:
        'If the account exists, password reset instructions have been sent',
      data: null,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetTokenHash: this.hashToken(dto.token),
        resetTokenExpiresAt: { gt: new Date() },
        deletedAt: null,
      },
    });
    if (!user)
      throw new BadRequestException('Reset token is invalid or expired');
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(dto.newPassword, 12),
        resetTokenHash: null,
        resetTokenExpiresAt: null,
      },
    });
    return { message: 'Password has been reset', data: null };
  }

  private async issueTokens(user: {
    id: string;
    email: string;
    role: UserRole;
    isVerified: boolean;
  }) {
    const base = {
      sub: user.id,
      email: user.email,
      role: user.role,
      verified: user.isVerified,
    };
    const accessToken = await this.jwt.signAsync(
      { ...base, tokenType: 'access', jti: randomUUID() },
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: ACCESS_SECONDS,
      },
    );
    const refreshToken = await this.jwt.signAsync(
      { ...base, tokenType: 'refresh', jti: randomUUID() },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: REFRESH_SECONDS,
      },
    );
    return { accessToken, refreshToken, expiresIn: ACCESS_SECONDS };
  }

  private async revoke(payload: JwtPayload): Promise<void> {
    const ttl = payload.exp
      ? payload.exp - Math.floor(Date.now() / 1000)
      : REFRESH_SECONDS;
    await this.redis.setWithTtl(`revoked:refresh:${payload.jti}`, '1', ttl);
  }

  private async sendVerification(email: string, token: string): Promise<void> {
    const base = this.config.get<string>('BASE_URL', 'http://localhost:3000');
    await this.mail.send(
      email,
      'Verify your Seli Florist account',
      `Verify your email: ${base}/api/auth/verify?token=${encodeURIComponent(token)}`,
    );
  }
}
