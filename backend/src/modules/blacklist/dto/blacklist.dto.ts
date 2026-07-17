import { BlacklistType } from '@prisma/client';
import { IsEnum, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class BlacklistQueryDto extends PaginationDto {}

export class CreateBlacklistDto {
  @IsEnum(BlacklistType) type!: BlacklistType;
  @IsString() @MaxLength(320) value!: string;
  @IsString() @MaxLength(1000) reason!: string;
}
