"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowSquareOut,
  CalendarBlank,
  ChartBar,
  GearSix,
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
import type { Order, UserRole } from "@/lib/types";

const emptySubscribe = () => () => {};
const ALLOWED_ADMIN_ROLES: readonly UserRole[] = [
  "OWNER",
  "FINANCE",
  "STAFF_VERIFICATION",
];

function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

function canAccessAdminRoute(pathname: string, role: UserRole): boolean {
  if (pathname.startsWith("/admin/finance") || pathname.startsWith("/admin/reports")) {
    return role === "OWNER" || role === "FINANCE";
  }
  if (pathname.startsWith("/admin/boards")) return role === "OWNER";
  return true;
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
    if (!mounted) return;
    if (isAdminPage) {
      if (!currentUser) {
        router.replace("/admin/login");
        return;
      }
      if (!ALLOWED_ADMIN_ROLES.includes(currentUser.role)) {
        router.replace("/");
        return;
      }
      if (!canAccessAdminRoute(pathname, currentUser.role)) {
        router.replace("/admin");
      }
    }
  }, [mounted, isAdminPage, currentUser, pathname, router]);

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

  if (
    isAdminPage &&
    (!mounted ||
      !currentUser ||
      !ALLOWED_ADMIN_ROLES.includes(currentUser.role) ||
      !canAccessAdminRoute(pathname, currentUser.role))
  ) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "var(--admin-bg, #faf6f8)",
          padding: "24px 16px",
        }}
      >
        <div
          className="atelier-panel"
          style={{
            padding: "36px 32px",
            textAlign: "center",
            borderRadius: "18px",
            maxWidth: "380px",
            boxShadow: "0 12px 32px rgba(43, 29, 35, 0.06)",
          }}
        >
          <p
            style={{
              margin: 0,
              fontWeight: 600,
              color: "var(--admin-rose, #701a35)",
              fontSize: "15px",
            }}
          >
            Memeriksa autentikasi admin…
          </p>
        </div>
      </main>
    );
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
            alt="Logo LICHARY Florist"
            width={32}
            height={32}
            className="brand-logo-img"
          />
          <div>
            <strong>LICHARY Florist</strong>
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
            alt="Logo LICHARY Florist"
            width={38}
            height={38}
            className="brand-logo-img"
          />
          <div className="sidebar-title-group">
            <strong>LICHARY Florist</strong>
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

          {currentUser?.role === "OWNER" && (
            <Link
              href="/admin/boards"
              className={pathname.startsWith("/admin/boards") ? "active" : ""}
              onClick={closeMobile}
            >
              <CalendarBlank size={18} weight="regular" />
              <span>Papan Ucapan</span>
            </Link>
          )}

          <Link
            href="/admin/settings"
            className={pathname.startsWith("/admin/settings") ? "active" : ""}
            onClick={closeMobile}
          >
            <GearSix size={18} weight="regular" />
            <span>Profil &amp; Keamanan</span>
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
            onClick={async () => {
              closeMobile();
              await logoutUser();
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
