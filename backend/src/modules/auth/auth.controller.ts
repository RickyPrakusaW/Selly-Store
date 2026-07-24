import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { JwtUser } from '../../common/guards/jwt-user.interface';
import { AuthService } from './auth.service';
import {
  EmailDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  TokenDto,
  UpdateProfileDto,
} from './dto/auth.dto';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/auth',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Get('verify')
  async verify(@Query() dto: TokenDto, @Res() res: Response) {
    try {
      const result = await this.auth.verifyEmail(dto.token);
      return res.type('text/html').send(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verifikasi Akun - Seli Florist</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #fff7f9; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(169,64,101,0.1); text-align: center; max-width: 420px; border: 1px solid #f2d7df; }
            h1 { color: #880e4f; margin-bottom: 12px; font-size: 24px; font-family: Georgia, serif; }
            p { color: #555; line-height: 1.6; margin-bottom: 25px; font-size: 15px; }
            .btn { display: inline-block; background: #a94065; color: white; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 15px; box-shadow: 0 6px 16px rgba(169,64,101,0.25); }
            .btn:hover { background: #880e4f; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Status Akun Seli Florist</h1>
            <p>${result.message}</p>
            <a href="${process.env.FRONTEND_URL ?? 'http://localhost:3001'}" class="btn">Masuk ke Seli Florist</a>
          </div>
        </body>
        </html>
      `);
    } catch (err: any) {
      return res.type('text/html').send(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verifikasi Akun - Seli Florist</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #fff7f9; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(169,64,101,0.1); text-align: center; max-width: 420px; border: 1px solid #f2d7df; }
            h1 { color: #880e4f; margin-bottom: 12px; font-size: 22px; font-family: Georgia, serif; }
            p { color: #555; line-height: 1.6; margin-bottom: 25px; font-size: 15px; }
            .btn { display: inline-block; background: #a94065; color: white; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 15px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Informasi Verifikasi</h1>
            <p>${err.message || 'Akun Anda sudah aktif atau tautan tidak dapat digunakan lagi.'}</p>
            <a href="${process.env.FRONTEND_URL ?? 'http://localhost:3001'}" class="btn">Kembali ke Seli Florist</a>
          </div>
        </body>
        </html>
      `);
    }
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('resend-verification')
  resend(@Body() dto: EmailDto) {
    return this.auth.resendVerification(dto);
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.login(dto);
    response.cookie('refresh_token', result.refreshToken, cookieOptions);
    return {
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post(['refresh', 'refresh-token'])
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokens = await this.auth.refresh(
      request.cookies?.refresh_token as string | undefined,
    );
    response.cookie('refresh_token', tokens.refreshToken, cookieOptions);
    return { accessToken: tokens.accessToken, expiresIn: tokens.expiresIn };
  }

  @Public()
  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.logout(
      request.cookies?.refresh_token as string | undefined,
    );
    response.clearCookie('refresh_token', cookieOptions);
    return { message: 'Logged out', data: null };
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 120_000 } })
  @Post('forgot-password')
  forgot(@Body() dto: EmailDto) {
    return this.auth.forgotPassword(dto);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 120_000 } })
  @Post('reset-password')
  reset(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @Get('me')
  me(@CurrentUser() user: JwtUser) {
    return this.auth.me(user.id);
  }

  @Put('me')
  update(@CurrentUser() user: JwtUser, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(user.id, dto);
  }
}

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.login(dto, true);
    response.cookie('refresh_token', result.refreshToken, cookieOptions);
    return {
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    };
  }
}
