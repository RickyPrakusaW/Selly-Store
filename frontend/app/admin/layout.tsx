"use client";

import {
  Calendar,
  CheckSquare,
  DollarSign,
  FileSpreadsheet,
  Home,
  LogOut,
  Package,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSeliStore } from "@/lib/store";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  // Persisted Zustand state is client-only and is revealed after hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const user = useSeliStore((state) => state.user);
  const logoutUser = useSeliStore((state) => state.logoutUser);

  const currentUser = mounted ? user : null;
  const isAdminPage =
    pathname.startsWith("/admin") && pathname !== "/admin/login";

  useEffect(() => {
    if (isAdminPage && currentUser) {
      const allowedRoles = ["OWNER", "FINANCE", "STAFF_VERIFICATION"];
      if (!allowedRoles.includes(currentUser.role)) {
        router.push("/");
      }
    }
  }, [isAdminPage, currentUser, router]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const roleLabels: Record<string, string> = {
    OWNER: "Pemilik (Owner)",
    FINANCE: "Staf Keuangan",
    STAFF_VERIFICATION: "Staf Verifikasi",
    CUSTOMER: "Pelanggan",
  };

  return (
    <div className="admin-dashboard-container">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <span className="brand-mark">S</span>
          <div>
            <strong>Seli Florist</strong>
            <small>Admin Portal</small>
          </div>
        </div>

        <div className="user-profile-badge">
          <UserRound size={20} />
          <div>
            <strong>{currentUser?.fullName ?? "Admin User"}</strong>
            <span className="role-chip">
              {roleLabels[currentUser?.role ?? ""] ?? currentUser?.role}
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link
            href="/admin/orders"
            className={pathname === "/admin/orders" ? "active" : ""}
          >
            <CheckSquare size={18} /> Antrean Verifikasi
          </Link>
          <Link
            href="/admin/catalog"
            className={pathname === "/admin/catalog" ? "active" : ""}
          >
            <Package size={18} /> Kelola Produk &amp; Stok
          </Link>
          <Link
            href="/admin/boards"
            className={pathname === "/admin/boards" ? "active" : ""}
          >
            <Calendar size={18} /> Unit Papan Ucapan
          </Link>

          {(currentUser?.role === "OWNER" ||
            currentUser?.role === "FINANCE") && (
            <>
              <div className="nav-divider" />
              <Link
                href="/admin/finance"
                className={pathname === "/admin/finance" ? "active" : ""}
              >
                <DollarSign size={18} /> Kas &amp; Pengeluaran
              </Link>
              <Link
                href="/admin/reports"
                className={pathname === "/admin/reports" ? "active" : ""}
              >
                <FileSpreadsheet size={18} /> Laporan Laba Rugi
              </Link>
            </>
          )}

          <div className="nav-divider" />
          <Link href="/">
            <Home size={18} /> Kembali ke Toko
          </Link>
          <button
            onClick={() => {
              void logoutUser();
              router.push("/admin/login");
            }}
            className="sidebar-logout-btn"
          >
            <LogOut size={18} /> Keluar
          </button>
        </nav>
      </aside>

      <main className="admin-main-content">{children}</main>
    </div>
  );
}
