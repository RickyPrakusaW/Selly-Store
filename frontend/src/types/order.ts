import type { PaymentProof } from './payment-proof';

export type DeliveryType = 'delivery' | 'pickup';
export type OrderStatus =
  | 'pending_dp'
  | 'pending_dp_review'
  | 'pending_final_payment'
  | 'pending_final_review'
  | 'fully_paid'
  | 'processing'
  | 'ready'
  | 'out_for_delivery'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export interface OrderItem {
  id: string;
  productId: string;
  productNameSnapshot: string;
  variantNameSnapshot: string | null;
  quantity: number;
  unitPriceSnapshot: string;
  rentalStartAt: string | null;
  rentalEndAt: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  deliveryType: DeliveryType;
  subtotal: string;
  deliveryFee: string;
  total: string;
  dpAmount: string;
  remainingAmount: string;
  dpDeadline: string;
  items: OrderItem[];
  paymentProofs: PaymentProof[];
  createdAt: string;
}
