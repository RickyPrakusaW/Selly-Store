import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { normalizeWhatsAppNumber } from '../../../common/utils/phone-number.util';

export class RegisterDto {
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MinLength(10, { message: 'Password minimal 10 karakter' })
  @MaxLength(72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).+$/, {
    message:
      'Password harus mengandung huruf besar, huruf kecil, angka, dan simbol',
  })
  password!: string;

  @IsString()
  @Length(2, 150)
  fullName!: string;

  @IsOptional()
  @Transform(({ value }) => normalizeWhatsAppNumber(value))
  @Matches(/^[1-9]\d{7,14}$/, {
    message: 'Nomor WhatsApp harus menggunakan format internasional yang valid',
  })
  phoneNumber?: string;
}

export class GoogleAuthDto {
  @IsString()
  @IsNotEmpty()
  credential!: string;
}

export class LoginDto {
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @IsEmail()
  email!: string;

  @IsString()
  @MaxLength(72)
  password!: string;
}

export class EmailDto {
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @IsEmail()
  email!: string;
}

export class TokenDto {
  @IsString()
  @Length(32, 256)
  token!: string;
}

export class ResetPasswordDto extends TokenDto {
  @IsString()
  @MinLength(10)
  @MaxLength(72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).+$/)
  newPassword!: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 150)
  fullName?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeWhatsAppNumber(value))
  @Matches(/^[1-9]\d{7,14}$/, {
    message: 'Nomor WhatsApp harus menggunakan format internasional yang valid',
  })
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(72)
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).+$/)
  newPassword?: string;
}
