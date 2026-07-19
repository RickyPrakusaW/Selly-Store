import { Type } from 'class-transformer';
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
  @IsUUID() productId!: string;
  @IsOptional() @IsUUID() variantId?: string;
  @Type(() => Number) @IsInt() @Min(1) qty!: number;
  @IsOptional() @IsString() @MaxLength(1000) customNote?: string;
  @IsOptional() @IsDateString({ strict: true }) bookingDate?: string;
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
