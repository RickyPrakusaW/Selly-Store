import type {
  AddCartItemPayload,
  ApiEnvelope,
  BoardInventory,
  CalendarDay,
  CapitalInjection,
  Cart,
  CartItem,
  Category,
  ChartDataPoint,
  CheckoutPayload,
  EstimateOngkirPayload,
  EstimateOngkirResult,
  Expense,
  LoginResult,
  Order,
  OrderListItem,
  Product,
  ProductCost,
  ReportSummary,
  SyncCartPayload,
  UpdateCartItemPayload,
  User,
} from "./types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

/** Resolve image URL to ensure relative paths resolve against backend host */
export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const backendHost = API_URL.replace(/\/api\/?$/, "");
  return `${backendHost}${url.startsWith("/") ? "" : "/"}${url}`;
}

let accessToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data?: any,
  ) {
    super(message);
  }
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("access_token", token);
    } else {
      localStorage.removeItem("access_token");
    }
  }
}

export function getAccessToken(): string | null {
  if (!accessToken && typeof window !== "undefined") {
    accessToken = localStorage.getItem("access_token");
  }
  return accessToken;
}

async function read<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as
    | ApiEnvelope<T>
    | { message?: string; [key: string]: any }
    | null;
  if (!response.ok) {
    const msg =
      response.status === 429
        ? "Terlalu banyak permintaan. Silakan tunggu beberapa saat."
        : (body?.message ?? "Permintaan tidak dapat diproses.");
    throw new ApiError(msg, response.status, body);
  }
  return (body as ApiEnvelope<T>).data;
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "X-CSRF-Token": "refresh" },
    })
      .then(async (response) => {
        if (!response.ok) return false;
        const data = await read<{ accessToken: string }>(response);
        setAccessToken(data.accessToken);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      credentials: "include",
    });
    if (response.status === 401 && retry && (await refreshAccessToken())) {
      return apiRequest<T>(path, init, false);
    }
    return await read<T>(response);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      "Tidak dapat terhubung ke server backend (http://localhost:3000/api). Pastikan backend sedang berjalan.",
      0,
    );
  }
}

/** Upload file via multipart/form-data */
export async function apiUpload<T>(
  path: string,
  file: File,
  fieldName = "file",
  extraFields?: Record<string, string>,
): Promise<T> {
  const formData = new FormData();
  formData.append(fieldName, file);
  if (extraFields) {
    for (const [key, value] of Object.entries(extraFields)) {
      formData.append(key, value);
    }
  }
  return apiRequest<T>(path, { method: "POST", body: formData });
}

/* ═══════════════════════════════════════════
   CATALOG (PUBLIC)
   ═══════════════════════════════════════════ */

export async function fetchProducts(
  search = "",
  category = "",
): Promise<Product[]> {
  const params = new URLSearchParams({ page: "1", limit: "24" });
  if (search) params.set("search", search);
  if (category) params.set("category", category);
  return apiRequest<Product[]>(`/products?${params.toString()}`);
}

export const fetchCategories = () => apiRequest<Category[]>("/categories");

export function fetchProduct(id: string): Promise<Product> {
  return apiRequest<Product>(`/products/${id}`);
}

/* ═══════════════════════════════════════════
   AUTH
   ═══════════════════════════════════════════ */

export const fetchMe = () => apiRequest<User>("/auth/me");

export function login(email: string, password: string) {
  return apiRequest<LoginResult>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(data: {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
}) {
  return apiRequest<{ id: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function resendVerification(email: string) {
  return apiRequest("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function logout() {
  return apiRequest("/auth/logout", { method: "POST" });
}

export function updateProfile(data: {
  fullName?: string;
  phoneNumber?: string;
}) {
  return apiRequest<User>("/auth/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function adminLogin(email: string, password: string) {
  return apiRequest<LoginResult>("/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/* ═══════════════════════════════════════════
   CART
   ═══════════════════════════════════════════ */

export function fetchCart(): Promise<Cart> {
  return apiRequest<Cart>("/cart");
}

export function addCartItem(data: AddCartItemPayload): Promise<CartItem> {
  return apiRequest<CartItem>("/cart/items", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCartItem(
  id: string,
  data: UpdateCartItemPayload,
): Promise<CartItem> {
  return apiRequest<CartItem>(`/cart/items/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function removeCartItem(id: string): Promise<void> {
  return apiRequest(`/cart/items/${id}`, { method: "DELETE" });
}

export function clearCart(): Promise<void> {
  return apiRequest("/cart", { method: "DELETE" });
}

export function syncCart(data: SyncCartPayload): Promise<Cart> {
  return apiRequest<Cart>("/cart/sync", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/* ═══════════════════════════════════════════
   CHECKOUT
   ═══════════════════════════════════════════ */

export function estimateOngkir(
  data: EstimateOngkirPayload,
): Promise<EstimateOngkirResult> {
  return apiRequest<EstimateOngkirResult>("/checkout/estimate-ongkir", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function checkout(
  data: CheckoutPayload,
  idempotencyKey: string,
): Promise<Order> {
  return apiRequest<Order>("/checkout", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Idempotency-Key": idempotencyKey },
  });
}

/* ═══════════════════════════════════════════
   ORDERS (CUSTOMER)
   ═══════════════════════════════════════════ */

export function fetchMyOrders(
  page = 1,
  status?: string,
): Promise<OrderListItem[]> {
  const params = new URLSearchParams({ page: String(page), limit: "10" });
  if (status) params.set("status", status);
  return apiRequest<OrderListItem[]>(`/orders/my?${params.toString()}`);
}

export function fetchOrderDetail(id: string): Promise<Order> {
  return apiRequest<Order>(`/orders/my/${id}`);
}

export function fetchRemainingAmount(
  id: string,
): Promise<{ remainingAmount: number }> {
  return apiRequest(`/orders/${id}/remaining-amount`);
}

export function cancelOrder(id: string, reason: string): Promise<Order> {
  return apiRequest<Order>(`/orders/my/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

/* ═══════════════════════════════════════════
   PAYMENT PROOF
   ═══════════════════════════════════════════ */

export function uploadDpProof(orderId: string, file: File) {
  return apiUpload(`/orders/${orderId}/payment-proof/dp`, file);
}

export function retractDpProof(orderId: string) {
  return apiRequest(`/orders/${orderId}/payment-proof/dp`, {
    method: "DELETE",
  });
}

export function uploadFinalProof(orderId: string, file: File) {
  return apiUpload(`/orders/${orderId}/payment-proof/final`, file);
}

export function retractFinalProof(orderId: string) {
  return apiRequest(`/orders/${orderId}/payment-proof/final`, {
    method: "DELETE",
  });
}

/* ═══════════════════════════════════════════
   ADMIN ORDERS
   ═══════════════════════════════════════════ */

export function adminListOrders(page = 1, status?: string): Promise<Order[]> {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (status) params.set("status", status);
  return apiRequest<Order[]>(`/admin/orders?${params.toString()}`);
}

export function adminGetOrder(id: string): Promise<Order> {
  return apiRequest<Order>(`/admin/orders/${id}`);
}

export function adminVerifyDp(id: string) {
  return apiRequest(`/admin/orders/${id}/verify-dp`, { method: "POST" });
}

export function adminVerifyFinal(id: string) {
  return apiRequest(`/admin/orders/${id}/verify-final`, { method: "POST" });
}

export function adminReject(id: string, reason: string) {
  return apiRequest(`/admin/orders/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function adminComplete(id: string) {
  return apiRequest(`/admin/orders/${id}/complete`, { method: "POST" });
}

export function adminProcess(id: string) {
  return apiRequest(`/admin/orders/${id}/process`, { method: "POST" });
}

export function adminForceCancel(id: string, adminCancelNote: string) {
  return apiRequest(`/admin/orders/${id}/force-cancel`, {
    method: "POST",
    body: JSON.stringify({ adminCancelNote }),
  });
}

export function adminRefundDone(id: string, refundNote: string) {
  return apiRequest(`/admin/orders/${id}/refund-done`, {
    method: "PUT",
    body: JSON.stringify({ refundNote }),
  });
}

export function adminReassignBoard(id: string, boardId: string) {
  return apiRequest(`/admin/orders/${id}/reassign-board`, {
    method: "PUT",
    body: JSON.stringify({ boardId }),
  });
}

export function adminUpdateStatus(id: string, status: string, note?: string) {
  return apiRequest(`/admin/orders/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status, note }),
  });
}

/* ═══════════════════════════════════════════
   BOOKING
   ═══════════════════════════════════════════ */

export function fetchCalendar(month: string): Promise<CalendarDay[]> {
  return apiRequest<CalendarDay[]>(`/booking/calendar?month=${month}`);
}

export function checkAvailability(date: string) {
  return apiRequest(`/booking/check-availability?date=${date}`);
}

/* ═══════════════════════════════════════════
   ADMIN BOARDS
   ═══════════════════════════════════════════ */

export function fetchBoards(): Promise<BoardInventory[]> {
  return apiRequest<BoardInventory[]>("/admin/boards");
}

export function createBoard(data: { boardName: string; boardType?: string }) {
  return apiRequest("/admin/boards", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateBoard(
  id: string,
  data: { boardName?: string; boardType?: string; isActive?: boolean },
) {
  return apiRequest(`/admin/boards/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteBoard(id: string) {
  return apiRequest(`/admin/boards/${id}`, { method: "DELETE" });
}

/* ═══════════════════════════════════════════
   FINANCE
   ═══════════════════════════════════════════ */

export function fetchProductCosts(page = 1): Promise<ProductCost[]> {
  return apiRequest<ProductCost[]>(
    `/admin/finance/product-costs?page=${page}&limit=20`,
  );
}

export function setProductCost(data: {
  productId: string;
  costPrice: number;
  effectiveDate: string;
}) {
  return apiRequest("/admin/finance/product-costs", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function fetchCapital(page = 1): Promise<CapitalInjection[]> {
  return apiRequest<CapitalInjection[]>(
    `/admin/finance/capital?page=${page}&limit=20`,
  );
}

export function addCapital(data: {
  amount: number;
  source: string;
  note?: string;
  injectedAt: string;
}) {
  return apiRequest("/admin/finance/capital", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function fetchExpenses(page = 1): Promise<Expense[]> {
  return apiRequest<Expense[]>(`/admin/finance/expenses?page=${page}&limit=20`);
}

export function addExpense(data: {
  category: string;
  amount: number;
  description: string;
  expenseDate: string;
}) {
  return apiRequest("/admin/finance/expenses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteExpense(id: string) {
  return apiRequest(`/admin/finance/expenses/${id}`, { method: "DELETE" });
}

/* ═══════════════════════════════════════════
   REPORTS
   ═══════════════════════════════════════════ */

export function fetchReportSummary(
  from: string,
  to: string,
): Promise<ReportSummary> {
  return apiRequest<ReportSummary>(
    `/admin/reports/summary?from=${from}&to=${to}`,
  );
}

export function fetchChartData(
  from: string,
  to: string,
): Promise<ChartDataPoint[]> {
  return apiRequest<ChartDataPoint[]>(
    `/admin/reports/chart-data?from=${from}&to=${to}`,
  );
}

export function exportReport(from: string, to: string): string {
  return `${API_URL}/admin/reports/export?from=${from}&to=${to}`;
}

/* ═══════════════════════════════════════════
   ADMIN CATALOG
   ═══════════════════════════════════════════ */

export function adminCreateCategory(data: {
  name: string;
  slug: string;
  description?: string;
}) {
  return apiRequest("/admin/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function adminUpdateCategory(
  id: string,
  data: { name?: string; slug?: string; description?: string },
) {
  return apiRequest(`/admin/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function adminDeleteCategory(id: string) {
  return apiRequest(`/admin/categories/${id}`, { method: "DELETE" });
}

export function adminCreateProduct<T = Product>(data: Record<string, unknown>) {
  return apiRequest<T>("/admin/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function adminUpdateProduct(id: string, data: Record<string, unknown>) {
  return apiRequest(`/admin/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function adminUpdateStock(id: string, data: { stockQty: number }) {
  return apiRequest(`/admin/products/${id}/stock`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function adminDeleteProduct(id: string) {
  return apiRequest<{ mode: "deleted" | "archived"; message: string }>(
    `/admin/products/${id}`,
    { method: "DELETE" },
  );
}

export function adminUploadProductImage(
  productId: string,
  file: File,
  isPrimary = false,
) {
  return apiUpload(`/admin/products/${productId}/images`, file, "file", {
    isPrimary: String(isPrimary),
  });
}

export function adminDeleteProductImage(productId: string, imageId: string) {
  return apiRequest(`/admin/products/${productId}/images/${imageId}`, {
    method: "DELETE",
  });
}

export interface QrisPaymentData {
  orderId: string;
  orderNumber: string;
  invoiceNumber: string;
  amount: number;
  qrContent: string;
  paymentUrl?: string;
  expiresAt: string;
  isSimulation: boolean;
  paymentType: "DP" | "FINAL";
}

export interface QrisStatusData {
  orderId: string;
  orderStatus: string;
  dpStatus?: string;
  isDpPaid: boolean;
  isFullyPaid: boolean;
  remainingAmount: number;
}

export function generateQrisPayment(
  orderId: string,
  paymentType?: "DP" | "FINAL",
) {
  return apiRequest<QrisPaymentData>("/payments/qris/generate", {
    method: "POST",
    body: JSON.stringify({ orderId, paymentType }),
  });
}

export function fetchQrisPaymentStatus(orderId: string) {
  return apiRequest<QrisStatusData>(`/payments/qris/status/${orderId}`, {
    method: "GET",
  });
}

export function simulateQrisPaymentSuccess(
  orderId: string,
  paymentType?: "DP" | "FINAL",
) {
  return apiRequest<{ status: string; message: string; transactionId: string }>(
    "/payments/qris/simulate-success",
    {
      method: "POST",
      body: JSON.stringify({ orderId, paymentType }),
    },
  );
}

