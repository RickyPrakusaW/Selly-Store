import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  PaymentStatus,
  Prisma,
  ProofType,
  VerificationStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadedImage } from '../../common/storage/image-upload.pipe';
import { StorageService } from '../../common/storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentProofService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
  ) {}

  async upload(
    userId: string,
    orderId: string,
    type: ProofType,
    file: UploadedImage,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });
    if (!order) throw new NotFoundException('Order not found');
    const validStatus =
      type === ProofType.DP
        ? order.status === OrderStatus.PENDING_PAYMENT
        : order.status === OrderStatus.PENDING_FINAL_PAYMENT;
    if (!validStatus)
      throw new ConflictException('Order is not accepting this payment proof');
    const active = await this.prisma.paymentProof.findFirst({
      where: {
        orderId,
        proofType: type,
        retractedAt: null,
        verificationStatus: {
          in: [VerificationStatus.PENDING, VerificationStatus.APPROVED],
        },
      },
    });
    if (active)
      throw new ConflictException(
        'An active proof already exists for this payment stage',
      );

    const stored = await this.storage.store(file, 'payment-proofs');
    try {
      const proof = await this.prisma.$transaction(async (tx) => {
        const created = await tx.paymentProof.create({
          data: {
            orderId,
            proofType: type,
            fileUrl: stored.url,
            storageKey: stored.key,
            originalFilename: file.originalname
              .replace(/[^\p{L}\p{N}._ -]/gu, '_')
              .slice(0, 255),
            fileSize: file.size,
            mimeType:
              file.mimetype === 'image/png' ? 'image/png' : 'image/jpeg',
          },
          select: {
            id: true,
            orderId: true,
            proofType: true,
            uploadedAt: true,
            verificationStatus: true,
          },
        });
        if (type === ProofType.DP)
          await tx.downPayment.update({
            where: { orderId },
            data: { status: PaymentStatus.PROOF_PENDING },
          });
        return created;
      });
      this.notifications.admin('payment_proof_submitted', {
        orderId,
        proofId: proof.id,
        proofType: type,
      });
      return proof;
    } catch (error) {
      await this.storage.remove(stored.key);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ConflictException('An active proof already exists');
      throw error;
    }
  }

  async retract(userId: string, orderId: string, type: ProofType) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });
    if (!order) throw new NotFoundException('Order not found');
    const proof = await this.prisma.paymentProof.findFirst({
      where: { orderId, proofType: type, retractedAt: null },
      orderBy: { uploadedAt: 'desc' },
    });
    if (!proof) throw new NotFoundException('Payment proof not found');
    if (proof.verificationStatus !== VerificationStatus.PENDING)
      throw new ForbiddenException('Only pending proofs can be retracted');
    await this.prisma.$transaction(async (tx) => {
      await tx.paymentProof.update({
        where: { id: proof.id },
        data: { retractedAt: new Date() },
      });
      if (type === ProofType.DP)
        await tx.downPayment.update({
          where: { orderId },
          data: { status: PaymentStatus.WAITING_PROOF },
        });
    });
    await this.storage.remove(proof.storageKey);
    this.notifications.admin('proof_retracted', {
      orderId,
      proofId: proof.id,
      proofType: type,
    });
    return { message: 'Payment proof retracted', data: null };
  }
}
