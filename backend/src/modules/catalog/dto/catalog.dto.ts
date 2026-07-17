import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { StockType } from '@prisma/client';
import { IsEnum } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CatalogQueryDto extends PaginationDto {
  @IsOptional()
  @Matches(/^[a-z0-9_-]{2,64}$/)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

export class CreateCategoryDto {
  @Matches(/^[a-z0-9_-]{2,64}$/)
  slug!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class VariantDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  variantName!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  priceDelta!: number;
}

export class CreateProductDto {
  @IsUUID()
  categoryId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(180)
  name!: string;

  @IsString()
  @MaxLength(5000)
  description!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  basePrice!: number;

  @IsEnum(StockType)
  stockType!: StockType;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockQty!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  poDays?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantDto)
  variants?: VariantDto[];
}

export class UpdateProductDto {
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(180) name?: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  basePrice?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateStockDto {
  @IsEnum(StockType)
  stockType!: StockType;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockQty!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  poDays?: number;
}

export class ImageMetadataDto {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPrimary = false;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder = 0;
}
