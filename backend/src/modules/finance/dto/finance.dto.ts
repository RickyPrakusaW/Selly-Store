import { ExpenseCategory } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FinanceQueryDto extends PaginationDto {}

export class ProductCostDto {
  @IsUUID() productId!: string;
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costPrice!: number;
  @IsDateString({ strict: true }) effectiveDate!: string;
}

export class CapitalInjectionDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;
  @IsString() @MaxLength(160) source!: string;
  @IsOptional() @IsString() @MaxLength(2000) note?: string;
  @IsDateString({ strict: true }) injectedAt!: string;
}

export class ExpenseDto {
  @IsEnum(ExpenseCategory) category!: ExpenseCategory;
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;
  @IsString() @MaxLength(2000) description!: string;
  @IsDateString({ strict: true }) expenseDate!: string;
  @IsOptional() @IsString() @MaxLength(2000) attachmentUrl?: string;
}
