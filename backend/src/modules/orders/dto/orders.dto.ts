import { OrderStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class OrderListQueryDto extends PaginationDto {
  @IsOptional() @IsEnum(OrderStatus) status?: OrderStatus;
}

export class CancelOrderDto {
  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

export class AdminReasonDto {
  @IsString() @MaxLength(2000) reason!: string;
}

export class ForceCancelDto {
  @IsString() @MaxLength(2000) adminCancelNote!: string;
}

export class RefundDoneDto {
  @IsString() @MaxLength(3000) refundNote!: string;
}

export class ReassignBoardDto {
  @IsUUID() boardId!: string;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus) status!: OrderStatus;
  @IsOptional() @IsString() @MaxLength(2000) note?: string;
}
