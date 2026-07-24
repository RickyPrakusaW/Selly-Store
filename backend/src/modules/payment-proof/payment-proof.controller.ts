import {
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProofType } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { VerifiedOnly } from '../../common/decorators/verified-only.decorator';
import type { JwtUser } from '../../common/guards/jwt-user.interface';
import { ImageUploadPipe } from '../../common/storage/image-upload.pipe';
import type { UploadedImage } from '../../common/storage/image-upload.pipe';
import { PaymentProofService } from './payment-proof.service';

@VerifiedOnly()
@Controller('orders/:orderId/payment-proof')
export class PaymentProofController {
  constructor(private readonly proofs: PaymentProofService) {}

  @Post('dp')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 + 1, files: 1 },
    }),
  )
  uploadDp(
    @CurrentUser() user: JwtUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @UploadedFile(ImageUploadPipe) file: UploadedImage,
  ) {
    return this.proofs.upload(user.id, orderId, ProofType.DP, file);
  }

  @Delete('dp')
  retractDp(
    @CurrentUser() user: JwtUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.proofs.retract(user.id, orderId, ProofType.DP);
  }

  @Post('final')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 + 1, files: 1 },
    }),
  )
  uploadFinal(
    @CurrentUser() user: JwtUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @UploadedFile(ImageUploadPipe) file: UploadedImage,
  ) {
    return this.proofs.upload(user.id, orderId, ProofType.FINAL, file);
  }

  @Delete('final')
  retractFinal(
    @CurrentUser() user: JwtUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.proofs.retract(user.id, orderId, ProofType.FINAL);
  }
}
