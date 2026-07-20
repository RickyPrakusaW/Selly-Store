import { ApiProperty } from '@nestjs/swagger';

export class PaymentProofStubDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000000' }) id!: string;
  @ApiProperty({ enum: ['dp', 'final'], example: 'dp' }) proofType!: 'dp' | 'final';
  @ApiProperty({ enum: ['pending'], example: 'pending' }) status!: 'pending';
}
