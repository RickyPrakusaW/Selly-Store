import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ReassignRentalUnitDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  rentalUnitId!: string;
}

export class AdminOrderActionStubDto {
  @ApiProperty({ format: 'uuid' }) orderId!: string;
  @ApiProperty({ example: 'scaffold' }) status!: string;
}
