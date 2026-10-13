"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowSquareOut,
  CalendarBlank,
  ChartBar,
  List,
  Receipt,
  SignOut,
  SquaresFour,
  Tag,
  User,
  Wallet,
  X,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { adminListOrders } from "@/lib/api";
import { useSeliStore } from "@/lib/store";
import type { Order } from "@/lib/types";

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const mounted = useMounted();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  /* Live counter for unverified / pending payment proof orders */
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["admin-pending-counter"],
    queryFn: () => adminListOrders(1),
    enabled: Boolean(currentUser && isAdminPage),
    refetchInterval: 12000,
  });

  const pendingVerificationCount = orders.filter(
    (o) =>
      o.paymentProofs?.some((p) => p.verificationStatus === "PENDING") ||
      (o.status === "PENDING_PAYMENT" && (o.paymentProofs?.length ?? 0) > 0),
  ).length;

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const roleLabels: Record<string, string> = {
    OWNER: "Pemilik (Owner)",
    FINANCE: "Staf Keuangan",
    STAFF_VERIFICATION: "Staf Verifikasi",
    CUSTOMER: "Pelanggan",
  };

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <div className="admin-dashboard-container">
      {/* Mobile Top Bar */}
      <header className="admin-mobile-topbar">
        <div className="mobile-brand">
          <Image
            src="/logo.jpeg"
            alt="Logo Seli Florist"
            width={32}
            height={32}
            className="brand-logo-img"
          />
          <div>
            <strong>Seli Florist</strong>
            <small>Atelier Operations</small>
          </div>
        </div>
        <button
          type="button"
          className="admin-mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Tutup Menu" : "Buka Menu"}
        >
          {mobileMenuOpen ? (
            <X size={20} weight="bold" />
          ) : (
            <List size={20} weight="bold" />
          )}
        </button>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="admin-mobile-backdrop"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Atelier Sidebar Navigation */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <Image
            src="/logo.jpeg"
            alt="Logo Seli Florist"
            width={38}
            height={38}
            className="brand-logo-img"
          />
          <div className="sidebar-title-group">
            <strong>Seli Florist</strong>
            <small>Atelier Management</small>
          </div>
        </div>

        {/* Staff Identity Pill */}
        <div className="user-profile-badge">
          <div className="admin-avatar-wrap">
            <User size={18} weight="bold" />
          </div>
          <div className="admin-user-info">
            <strong>{currentUser?.fullName ?? "Admin Seli"}</strong>
            <span className="role-chip">
              {roleLabels[currentUser?.role ?? ""] ?? currentUser?.role}
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="sidebar-nav">
          <Link
            href="/admin"
            className={pathname === "/admin" ? "active" : ""}
            onClick={closeMobile}
          >
            <SquaresFour size={18} weight="regular" />
            <span>Ringkasan Toko</span>
          </Link>

          <Link
            href="/admin/orders"
            className={pathname.startsWith("/admin/orders") ? "active" : ""}
            onClick={closeMobile}
          >
            <Receipt size={18} weight="regular" />
            <span>Antrean Pesanan</span>
            {pendingVerificationCount > 0 && (
              <span
                className="sidebar-badge-count"
                title={`${pendingVerificationCount} pesanan butuh verifikasi`}
              >
                {pendingVerificationCount}
              </span>
            )}
          </Link>

          <Link
            href="/admin/catalog"
            className={pathname.startsWith("/admin/catalog") ? "active" : ""}
            onClick={closeMobile}
          >
            <Tag size={18} weight="regular" />
            <span>Katalog &amp; Stok</span>
          </Link>

          <Link
            href="/admin/boards"
            className={pathname.startsWith("/admin/boards") ? "active" : ""}
            onClick={closeMobile}
          >
            <CalendarBlank size={18} weight="regular" />
            <span>Papan Ucapan</span>
          </Link>

          {(currentUser?.role === "OWNER" ||
            currentUser?.role === "FINANCE") && (
            <>
              <div className="nav-divider" />
              <Link
                href="/admin/reports"
                className={
                  pathname.startsWith("/admin/reports") ? "active" : ""
                }
                onClick={closeMobile}
              >
                <ChartBar size={18} weight="regular" />
                <span>Laporan Penjualan</span>
              </Link>

              <Link
                href="/admin/finance"
                className={
                  pathname.startsWith("/admin/finance") ? "active" : ""
                }
                onClick={closeMobile}
              >
                <Wallet size={18} weight="regular" />
                <span>Buku Kas &amp; HPP</span>
              </Link>
            </>
          )}

          <div className="nav-divider" />

          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-store-link"
            onClick={closeMobile}
          >
            <ArrowSquareOut size={18} weight="regular" />
            <span>Kunjungi Toko</span>
          </Link>

          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={() => {
              closeMobile();
              logoutUser();
              router.push("/admin/login");
            }}
          >
            <SignOut size={18} weight="regular" />
            <span>Keluar Akun</span>
          </button>
        </nav>
      </aside>

      {/* Main Workspace Area */}
      <main className="admin-main-content">{children}</main>
    </div>
  );
}
