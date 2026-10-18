import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
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
  GoogleAuthDto,
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
export class AuthService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly notificationQueue: NotificationQueueService,
  ) {}

  async onModuleInit() {
    await this.ensureDefaultOwner();
  }

  private async ensureDefaultOwner() {
    try {
      const existingOwner = await this.prisma.user.findFirst({
        where: { role: UserRole.OWNER, deletedAt: null },
      });
      if (!existingOwner) {
        const passwordHash = await bcrypt.hash('PasswordKuat123!', 12);
        await this.prisma.user.upsert({
          where: { email: 'owner@seliflorist.com' },
          update: {
            role: UserRole.OWNER,
            isVerified: true,
            isActive: true,
            deletedAt: null,
          },
          create: {
            email: 'owner@seliflorist.com',
            passwordHash,
            fullName: 'Seli Florist Owner',
            phoneNumber: '+6281111111101',
            role: UserRole.OWNER,
            isVerified: true,
            isActive: true,
          },
        });
      }
    } catch {
      /* ignore initial migration boot phase */
    }
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private publicUser(user: Record<string, unknown>) {
    const copy = { ...user };
    delete copy.passwordHash;
    delete copy.verificationTokenHash;
    delete copy.resetTokenHash;
    return copy;
  }

  async register(dto: RegisterDto) {
    const blocked = await this.prisma.blacklist.findUnique({
      where: { type_value: { type: BlacklistType.EMAIL, value: dto.email } },
    });
    if (blocked)
      throw new ForbiddenException(
        'Email ini tidak diizinkan untuk mendaftar akun',
      );
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email ini sudah terdaftar');

    const token = randomBytes(32).toString('hex');
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: await bcrypt.hash(dto.password, 12),
        fullName: dto.fullName,
        phoneNumber: dto.phoneNumber,
        role: UserRole.CUSTOMER,
        isVerified: true,
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

    try {
      await this.sendVerification(user.email, token);
    } catch {
      /* ignore background email dispatch errors */
    }

    const tokens = await this.issueTokens(user);
    return {
      message: 'Pendaftaran berhasil! Akun Anda aktif dan dapat langsung bertransaksi.',
      user: this.publicUser(user),
      ...tokens,
    };
  }

  async googleLogin(dto: GoogleAuthDto) {
    let email = dto.email;
    let name = dto.name;

    if (dto.credential) {
      try {
        const parts = dto.credential.split('.');
        if (parts.length >= 2 && parts[1]) {
          const payload = JSON.parse(
            Buffer.from(parts[1], 'base64').toString('utf8'),
          );
          if (payload.email) email = String(payload.email).toLowerCase();
          if (payload.name) name = String(payload.name);
        }
      } catch {
        /* fallback to dto values */
      }
    }

    if (!email) {
      throw new BadRequestException('Email Google tidak valid');
    }

    const blocked = await this.prisma.blacklist.findUnique({
      where: { type_value: { type: BlacklistType.EMAIL, value: email } },
    });
    if (blocked) {
      throw new ForbiddenException('Akses akun Anda telah diblokir');
    }

    let user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    if (user) {
      if (!user.isActive) {
        throw new ForbiddenException('Akun Anda telah dinonaktifkan');
      }
      if (!user.isVerified) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { isVerified: true },
        });
      }
    } else {
      const dummyPassword = await bcrypt.hash(randomUUID(), 10);
      user = await this.prisma.user.create({
        data: {
          email,
          fullName: name || 'Pelanggan Google',
          passwordHash: dummyPassword,
          role: UserRole.CUSTOMER,
          isVerified: true,
          isActive: true,
        },
      });
    }

    const tokens = await this.issueTokens(user);
    return {
      message: 'Login Google berhasil!',
      user: this.publicUser(user),
      ...tokens,
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
      return {
        message:
          'Akun Anda sudah aktif dan terverifikasi. Silakan masuk (login).',
        data: null,
      };
    }

    if (user.tokenExpiresAt && user.tokenExpiresAt < new Date()) {
      throw new BadRequestException(
        'Tautan verifikasi sudah kadaluarsa. Silakan minta kirim ulang email verifikasi.',
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationTokenHash: null,
        tokenExpiresAt: null,
      },
    });

    return {
      message:
        'Email berhasil diverifikasi! Akun Anda kini sudah aktif dan siap digunakan.',
      data: null,
    };
  }

  async resendVerification(dto: EmailDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null, isActive: true },
    });
    if (!user) throw new NotFoundException('Akun tidak ditemukan');
    if (user.isVerified)
      return {
        message: 'Akun Anda sudah terverifikasi sebelumnya',
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
      message:
        'Email verifikasi telah dikirim ulang. Silakan periksa inbox Anda.',
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
      throw new UnauthorizedException(
        'Email atau password yang Anda masukkan salah',
      );
    if (adminOnly && user.role === UserRole.CUSTOMER)
      throw new UnauthorizedException('Kredensial login admin tidak valid');
    if (!adminOnly && user.role !== UserRole.CUSTOMER)
      throw new UnauthorizedException(
        'Silakan gunakan portal login khusus admin',
      );
    const blocked = await this.prisma.blacklist.findUnique({
      where: { type_value: { type: BlacklistType.EMAIL, value: user.email } },
    });
    if (blocked) throw new ForbiddenException('Akses akun Anda telah diblokir');
    if (!user.isVerified)
      throw new ForbiddenException(
        'Email Anda belum diverifikasi. Silakan periksa email Anda.',
      );
    return { user: this.publicUser(user), ...(await this.issueTokens(user)) };
  }

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken)
      throw new UnauthorizedException('Cookie refresh token tidak ditemukan');
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException(
        'Refresh token tidak valid atau sudah kadaluwarsa',
      );
    }
    if (payload.tokenType !== 'refresh') {
      throw new UnauthorizedException('Token bukan refresh token');
    }

    const redisConnected = await this.redis.isConnected();
    if (redisConnected) {
      const isRevoked = await this.redis.exists(`revoked:refresh:${payload.jti}`);
      const sessionExists = await this.redis.exists(`session:refresh:${payload.jti}`);
      if (isRevoked || !sessionExists) {
        throw new UnauthorizedException(
          'Refresh token sudah tidak berlaku (revoked)',
        );
      }
      await this.revoke(payload);
    }
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null, isActive: true },
    });
    if (!user)
      throw new UnauthorizedException(
        'Akun tidak tersedia atau telah nonaktif',
      );
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
    if (!user) throw new NotFoundException('Pengguna tidak ditemukan');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Pengguna tidak ditemukan');
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
        throw new UnauthorizedException('Password saat ini tidak sesuai');
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
        subject: 'Seli Florist reset password',
        text: `Reset password Anda: ${base}/reset-password?token=${encodeURIComponent(token)}`,
        idempotencyKey: `password-reset:${user.id}:${this.hashToken(token)}`,
      });
    }
    return {
      message:
        'Jika email terdaftar, instruksi reset password telah dikirim ke email Anda',
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
      throw new BadRequestException(
        'Token reset password tidak valid atau sudah kadaluwarsa',
      );
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(dto.newPassword, 12),
        resetTokenHash: null,
        resetTokenExpiresAt: null,
      },
    });
    return { message: 'Password Anda berhasil diperbarui', data: null };
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
