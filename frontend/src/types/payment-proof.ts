export type PaymentProofType = 'dp' | 'final';
export type PaymentProofStatus = 'pending' | 'approved' | 'rejected';

export interface PaymentProof {
  id: string;
  orderId: string;
  proofType: PaymentProofType;
  storageKey: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  verificationStatus: PaymentProofStatus;
  rejectedReason: string | null;
  verifiedAt: string | null;
  retractedAt: string | null;
  createdAt: string;
}
