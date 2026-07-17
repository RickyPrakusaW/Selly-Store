import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CalendarQueryDto {
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  month!: string;
}

export class AvailabilityQueryDto {
  @IsDateString({ strict: true })
  date!: string;
}

export class CreateBoardDto {
  @IsString() @MinLength(2) @MaxLength(100) boardName!: string;
  @IsOptional() @IsString() @MaxLength(80) boardType?: string;
}

export class UpdateBoardDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100) boardName?: string;
  @IsOptional() @IsString() @MaxLength(80) boardType?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
