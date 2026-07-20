import { Controller, Delete, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiConsumes, ApiCreatedResponse, ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { VerifiedOnly } from '../../common/decorators/verified-only.decorator';
import { STUB_ID } from '../../common/dto/api-contract.dto';
import { PaymentProofStubDto } from './dto/payment-proof.dto';

@ApiTags('payments')
@VerifiedOnly()
@Controller('orders/:orderId/payment-proof')
export class PaymentsController {
  @Post('dp')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload DP payment proof scaffold' })
  @ApiCreatedResponse({ type: PaymentProofStubDto })
  uploadDp(@Param('orderId', ParseUUIDPipe) _orderId: string): PaymentProofStubDto {
    return { id: STUB_ID, proofType: 'dp', status: 'pending' };
  }

  @Delete('dp')
  @HttpCode(204)
  @ApiOperation({ summary: 'Retract DP payment proof scaffold' })
  @ApiNoContentResponse()
  retractDp(@Param('orderId', ParseUUIDPipe) _orderId: string): void {}

  @Post('final')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload final payment proof scaffold' })
  @ApiCreatedResponse({ type: PaymentProofStubDto })
  uploadFinal(@Param('orderId', ParseUUIDPipe) _orderId: string): PaymentProofStubDto {
    return { id: STUB_ID, proofType: 'final', status: 'pending' };
  }
}
