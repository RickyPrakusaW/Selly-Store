/* ─── Generic API Envelope ─── */
export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
  meta?: { page: number; limit: number; total: number; totalPages: number };
};

/** Format ISO date string like "2026-07-25T00:00:00.000Z" to clean Indonesian date "25 Jul 2026" */
export function formatBookingDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const clean = dateStr.slice(0, 10);
  const [year, month, day] = clean.split('-');
  if (!year || !month || !day) return dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthIdx = parseInt(month, 10) - 1;
  const monthName = months[monthIdx] ?? month;
  return `${day} ${monthName} ${year}`;
}


/* ─── Auth / User ─── */
export type UserRole = 'CUSTOMER' | 'OWNER' | 'FINANCE' | 'STAFF_VERIFICATION';

export type User = {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  role: UserRole;
  isVerified: boolean;
};

export type LoginResult = {
  user: User;
  accessToken: string;
  expiresIn: number;
};

/* ─── Catalog ─── */
export type Category = { id: string; slug: string; name: string; description?: string };

export type ProductImage = { id: string; imageUrl: string; isPrimary: boolean; sortOrder: number };

export type ProductVariant = { id: string; variantName: string; priceDelta: string | number };

export type StockType = 'READY_STOCK' | 'PRE_ORDER' | 'RENTAL_UNIT' | 'ready_stock' | 'pre_order' | 'rental_unit';

export type Product = {
  id: string;
  name: string;
  slug?: string;
  description: string;
  basePrice: string | number;
  stockType: StockType;
  productMode?: 'SALE' | 'RENTAL';
  availableQty: number;
  stockQty?: number;
  reservedQty?: number;
  poDays?: number;
  category: Category;
  images: ProductImage[];
  variants: ProductVariant[];
};

/* ─── Cart ─── */
export type CartItem = {
  id: string;
  productId: string;
  variantId: string | null;
  qty: number;
  customNote: string | null;
  bookingDate: string | null;
  bookingEndDate: string | null;
  product: Product;
  variant: ProductVariant | null;
};

export type Cart = {
  items: CartItem[];
};

export type AddCartItemPayload = {
  productId: string;
  variantId?: string;
  qty: number;
  customNote?: string;
  bookingDate?: string;
  bookingEndDate?: string;
};

export type UpdateCartItemPayload = {
  qty?: number;
  customNote?: string;
  bookingDate?: string;
  bookingEndDate?: string;
};

export type SyncCartPayload = {
  items: AddCartItemPayload[];
};

/* ─── Checkout ─── */
export type DeliveryType = 'DELIVERY' | 'PICKUP';

export type CheckoutItemPayload = {
  productId: string;
  variantId?: string;
  qty: number;
  customNote?: string;
  bookingDate?: string;
  bookingEndDate?: string;
};

export type EstimateOngkirPayload = {
  deliveryType: DeliveryType;
  address?: {
    fullAddress: string;
    latitude: string;
    longitude: string;
  };
};

export type CheckoutPayload = EstimateOngkirPayload & {
  waNumber: string;
  customerName: string;
  recipientName: string;
  recipientPhone: string;
  customTextRequest?: string;
  items?: CheckoutItemPayload[];
  replacePending?: boolean;
};

export type EstimateOngkirResult = {
  ongkirFee: number | string;
  distanceKm?: number | string;
};

/* ─── Orders ─── */
export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'DP_VERIFIED'
  | 'PENDING_FINAL_PAYMENT'
  | 'FULLY_PAID'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export type CancelledBy = 'CUSTOMER' | 'ADMIN' | 'SYSTEM';
export type RefundStatus = 'PENDING_REFUND' | 'REFUNDED';
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ProofType = 'DP' | 'FINAL';

export type OrderItem = {
  id: string;
  productId: string;
  variantId: string | null;
  qty: number;
  productNameSnapshot: string;
  variantNameSnapshot: string | null;
  customNoteSnapshot: string | null;
  priceSnapshot: string | number;
  costPriceSnapshot?: string | number;
  bookingDate: string | null;
  bookingEndDate: string | null;
  estimatedReadyDate: string | null;
};

export type PaymentProof = {
  id: string;
  orderId: string;
  proofType: ProofType;
  fileUrl: string;
  originalFilename: string;
  uploadedAt: string;
  fileSize: number;
  mimeType: string;
  verificationStatus: VerificationStatus;
  rejectedReason: string | null;
  verifiedAt: string | null;
};

export type DeliveryAddress = {
  id: string;
  fullAddress: string;
  latitude: string | number;
  longitude: string | number;
  distanceKm: string | number;
  ongkirCalculated: string | number;
};

export type DownPayment = {
  id: string;
  amount: string | number;
  status: string;
  deadline: string;
  verifiedAt: string | null;
};

export type Order = {
  id: string;
  userId: string;
  waNumber: string;
  customerName: string;
  recipientName: string;
  recipientPhone: string;
  deliveryType: DeliveryType;
  status: OrderStatus;
  subtotal: string | number;
  ongkirFee: string | number;
  dpAmount: string | number;
  remainingAmount: string | number;
  total: string | number;
  customTextRequest: string | null;
  estimatedReadyDate: string | null;
  dpDeadline: string;
  dpVerifiedAt: string | null;
  finalPaymentDeadline: string | null;
  cancelledAt: string | null;
  cancelledBy: CancelledBy | null;
  cancelReason: string | null;
  refundAmount: string | number | null;
  refundStatus: RefundStatus | null;
  refundNote: string | null;
  adminCancelNote: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  paymentProofs: PaymentProof[];
  deliveryAddress: DeliveryAddress | null;
  downPayment: DownPayment | null;
  user?: User;
};

export type OrderListItem = Pick<
  Order,
  'id' | 'status' | 'customerName' | 'total' | 'dpAmount' | 'remainingAmount' | 'createdAt' | 'dpDeadline'
> & {
  items: Pick<OrderItem, 'productNameSnapshot' | 'qty'>[];
};

/* ─── Booking ─── */
export type BoardInventory = {
  id: string;
  boardName: string;
  boardType: string | null;
  isActive: boolean;
};

export type BoardBooking = {
  id: string;
  boardId: string;
  bookingStart: string;
  bookingEnd: string;
  status: 'SOFT_LOCKED' | 'CONFIRMED' | 'CANCELLED';
};

export type CalendarDay = {
  date: string;
  totalBoards: number;
  bookedBoards: number;
  available: number;
};

/* ─── Finance ─── */
export type ProductCost = {
  id: string;
  productId: string;
  costPrice: string | number;
  effectiveDate: string;
  product?: Pick<Product, 'id' | 'name'>;
};

export type CapitalInjection = {
  id: string;
  amount: string | number;
  source: string;
  note: string | null;
  injectedAt: string;
  createdAt: string;
};

export type ExpenseCategory = 'RAW_MATERIAL' | 'OPERATIONAL' | 'SALARY' | 'TRANSPORT' | 'MARKETING' | 'OTHER';

export type Expense = {
  id: string;
  category: ExpenseCategory;
  amount: string | number;
  description: string;
  expenseDate: string;
  attachmentUrl: string | null;
  createdAt: string;
};

/* ─── Reports ─── */
export type ReportSummary = {
  totalRevenue: number;
  totalHpp: number;
  grossProfit: number;
  totalOrders: number;
  totalOngkir: number;
  avgOrderValue: number;
};

export type ChartDataPoint = {
  date?: string;
  period?: string;
  revenue: number;
  cost?: number;
  hpp?: number;
  profit?: number;
  grossProfit?: number;
  orders: number;
};
