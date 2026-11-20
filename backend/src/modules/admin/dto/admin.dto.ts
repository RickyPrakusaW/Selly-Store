import { UserRole } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { normalizeWhatsAppNumber } from '../../../common/utils/phone-number.util';

const STAFF_ROLES = [
  UserRole.OWNER,
  UserRole.FINANCE,
  UserRole.STAFF_VERIFICATION,
] as const;

export class StaffQueryDto extends PaginationDto {}

export class CreateStaffDto {
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @IsEmail()
  email!: string;
  @IsString()
  @MinLength(10)
  @MaxLength(72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).+$/)
  password!: string;
  @IsString() @Length(2, 150) fullName!: string;
  @IsIn(STAFF_ROLES) role!: UserRole;
}

export class UpdateStaffDto {
  @IsOptional() @IsString() @Length(2, 150) fullName?: string;
  @IsOptional() @IsIn(STAFF_ROLES) role?: UserRole;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateAdminProfileDto {
  @IsOptional() @IsString() @Length(2, 150) fullName?: string;
  @IsOptional()
  @Transform(({ value }) => normalizeWhatsAppNumber(value))
  @Matches(/^[1-9]\d{7,14}$/, {
    message: 'Nomor WhatsApp harus menggunakan format internasional yang valid',
  })
  phoneNumber?: string;
}
