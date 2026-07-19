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
import { NotificationQueueService } from '../../common/notification-queue/notification-queue.service';
import { JwtPayload } from '../../common/guards/jwt-user.interface';
import {
  EmailDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  UpdateProfileDto,
} from './dto/auth.dto';

const ACCESS_SECONDS = 15 * 60;
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
    private readonly notificationQueue: NotificationQueueService,
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
    if (!token) {
      throw new BadRequestException('Token verifikasi tidak boleh kosong');
    }
    const tokenHash = this.hashToken(token);
    const user = await this.prisma.user.findFirst({
      where: {
        verificationTokenHash: tokenHash,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new BadRequestException(
        'Akun Anda sudah terverifikasi sebelumnya atau token tidak valid.',
      );
    }

    if (user.isVerified) {
      return { message: 'Akun Anda sudah aktif dan terverifikasi. Silakan masuk (login).', data: null };
    }

    if (user.tokenExpiresAt && user.tokenExpiresAt < new Date()) {
      throw new BadRequestException('Tautan verifikasi sudah kadaluarsa. Silakan minta kirim ulang email verifikasi.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationTokenHash: null,
        tokenExpiresAt: null,
      },
    });

    return { message: 'Email berhasil diverifikasi! Akun Anda kini sudah aktif dan siap digunakan.', data: null };
  }

  async resendVerification(dto: EmailDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null, isActive: true },
    });
    if (!user) throw new NotFoundException('Account not found');
    if (user.isVerified)
      return {
        message: 'Account is already verified',
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
      message: 'Verification email has been sent',
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
    if (!user.isVerified) throw new ForbiddenException('Email is not verified');
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
      (await this.redis.exists(`revoked:refresh:${payload.jti}`)) ||
      !(await this.redis.exists(`session:refresh:${payload.jti}`))
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
      await this.notificationQueue.enqueue({
        kind: 'mail',
        to: user.email,
        subject: 'Seli Florist password reset',
        text: `Reset your password: ${base}/reset-password?token=${encodeURIComponent(token)}`,
        idempotencyKey: `password-reset:${user.id}:${this.hashToken(token)}`,
      });
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
    const refreshJti = randomUUID();
    const refreshToken = await this.jwt.signAsync(
      { ...base, tokenType: 'refresh', jti: refreshJti },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: REFRESH_SECONDS,
      },
    );
    await this.redis.setWithTtl(
      `session:refresh:${refreshJti}`,
      user.id,
      REFRESH_SECONDS,
    );
    return { accessToken, refreshToken, expiresIn: ACCESS_SECONDS };
  }

  private async revoke(payload: JwtPayload): Promise<void> {
    const ttl = payload.exp
      ? payload.exp - Math.floor(Date.now() / 1000)
      : REFRESH_SECONDS;
    await this.redis.setWithTtl(`revoked:refresh:${payload.jti}`, '1', ttl);
    await this.redis.delete(`session:refresh:${payload.jti}`);
  }

  private async sendVerification(email: string, token: string): Promise<void> {
    await this.notificationQueue.enqueue({
      kind: 'verification_email',
      to: email,
      token,
      idempotencyKey: `verify:${email}:${this.hashToken(token)}`,
    });
  }
}
