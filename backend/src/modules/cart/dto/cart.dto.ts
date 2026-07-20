import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID() productId!: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional() @IsUUID() variantId?: string;
  @ApiProperty({ minimum: 1, example: 1 })
  @Type(() => Number) @IsInt() @Min(1) qty!: number;
  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional() @IsString() @MaxLength(1000) customNote?: string;
  @ApiPropertyOptional({ format: 'date' })
  @IsOptional() @IsDateString({ strict: true }) bookingDate?: string;
  @ApiPropertyOptional({ format: 'date' })
  @IsOptional() @IsDateString({ strict: true }) bookingEndDate?: string;
}

export class UpdateCartItemDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) qty?: number;
  @IsOptional() @IsString() @MaxLength(1000) customNote?: string;
  @IsOptional() @IsDateString({ strict: true }) bookingDate?: string;
  @IsOptional() @IsDateString({ strict: true }) bookingEndDate?: string;
}

export class SyncCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddCartItemDto)
  items!: AddCartItemDto[];
}
