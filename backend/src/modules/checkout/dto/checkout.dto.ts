import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeliveryType } from '@prisma/client';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  ValidateIf,
  ValidateNested,
  IsInt,
  Min,
} from 'class-validator';

export class AddressDto {
  @ApiProperty({ example: 'Jl. Melati No. 10, Bandung' })
  @IsString() @Length(10, 1000) fullAddress!: string;
  @ApiProperty({ example: '-6.9175' })
  @IsLatitude() latitude!: string;
  @ApiProperty({ example: '107.6191' })
  @IsLongitude() longitude!: string;
}

export class CheckoutItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID() productId!: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional() @IsUUID() variantId?: string;
  @ApiProperty({ minimum: 1, example: 1 })
  @Type(() => Number) @IsInt() @Min(1) qty!: number;
  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(1000) customNote?: string;
  @ApiPropertyOptional({ format: 'date' })
  @IsOptional() @IsDateString({ strict: true }) bookingDate?: string;
  @ApiPropertyOptional({ format: 'date' })
  @IsOptional() @IsDateString({ strict: true }) bookingEndDate?: string;
}

export class EstimateShippingDto {
  @ApiProperty({ enum: DeliveryType })
  @IsEnum(DeliveryType) deliveryType!: DeliveryType;

  @ValidateIf(
    (value: EstimateShippingDto) =>
      value.deliveryType === DeliveryType.DELIVERY,
  )
  @ApiPropertyOptional({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;
}

export class CheckoutDto extends EstimateShippingDto {
  @ApiProperty({ example: '6281234567890' })
  @Matches(/^\+?[1-9]\d{7,14}$/) waNumber!: string;
  @ApiProperty()
  @IsString() @Length(2, 150) customerName!: string;
  @ApiProperty()
  @IsString() @Length(2, 150) recipientName!: string;
  @ApiProperty({ example: '6281234567890' })
  @Matches(/^\+?[1-9]\d{7,14}$/) recipientPhone!: string;
  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(3000) customTextRequest?: string;

  @ApiPropertyOptional({ type: [CheckoutItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items?: CheckoutItemDto[];
}
