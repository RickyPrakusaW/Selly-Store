import { OrderStatus } from '@prisma/client';
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
  @IsOptional() @IsString() @MaxLength(1000) reason?: string;
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
