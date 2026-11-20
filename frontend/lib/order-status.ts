import type { OrderStatus } from "@/lib/types";

export function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case "PENDING_PAYMENT":
      return { label: "Menunggu DP 50%", className: "badge-pending-dp" };
    case "DP_VERIFIED":
      return { label: "DP Terverifikasi", className: "badge-verified" };
    case "PENDING_FINAL_PAYMENT":
      return { label: "Menunggu Pelunasan", className: "badge-pending-final" };
    case "FULLY_PAID":
      return { label: "Lunas", className: "badge-paid" };
    case "PROCESSING":
      return { label: "Sedang Dirangkai", className: "badge-processing" };
    case "COMPLETED":
      return { label: "Selesai & Terkirim", className: "badge-completed" };
    case "CANCELLED":
      return { label: "Dibatalkan", className: "badge-cancelled" };
    case "REJECTED":
      return { label: "Ditolak", className: "badge-rejected" };
    default:
      return { label: status, className: "badge-neutral" };
  }
}
