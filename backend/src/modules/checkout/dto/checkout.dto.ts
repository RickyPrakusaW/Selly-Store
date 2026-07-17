import { Type } from 'class-transformer';
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
  @IsString() @Length(10, 1000) fullAddress!: string;
  @IsLatitude() latitude!: string;
  @IsLongitude() longitude!: string;
}

export class CheckoutItemDto {
  @IsUUID() productId!: string;
  @IsOptional() @IsUUID() variantId?: string;
  @Type(() => Number) @IsInt() @Min(1) qty!: number;
  @IsOptional() @IsString() @MaxLength(1000) customNote?: string;
  @IsOptional() @IsDateString({ strict: true }) bookingDate?: string;
}

export class EstimateShippingDto {
  @IsEnum(DeliveryType) deliveryType!: DeliveryType;

  @ValidateIf(
    (value: EstimateShippingDto) =>
      value.deliveryType === DeliveryType.DELIVERY,
  )
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;
}

export class CheckoutDto extends EstimateShippingDto {
  @Matches(/^\+?[1-9]\d{7,14}$/) waNumber!: string;
  @IsString() @Length(2, 150) customerName!: string;
  @IsString() @Length(2, 150) recipientName!: string;
  @Matches(/^\+?[1-9]\d{7,14}$/) recipientPhone!: string;
  @IsOptional() @IsString() @MaxLength(3000) customTextRequest?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items?: CheckoutItemDto[];
}
