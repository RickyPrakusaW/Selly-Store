"use client";

import {
  Heart,
  Home,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSeliStore } from "@/lib/store";

export function BottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  // Persisted Zustand state is client-only and is revealed after hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const user = useSeliStore((state) => state.user);
  const cartCount = useSeliStore((state) => state.cartCount);
  const wishlistCount = useSeliStore((state) => state.wishlistCount);
  const setWishlistOpen = useSeliStore((state) => state.setWishlistOpen);
  const setAuthOpen = useSeliStore((state) => state.setAuthOpen);

  // Hide BottomNav on all admin portal routes
  if (pathname.startsWith("/admin")) {
    return null;
  }

  const currentUser = mounted ? user : null;
  const currentCartCount = mounted ? cartCount : 0;
  const currentWishlistCount = mounted && currentUser ? wishlistCount : 0;
  const isAdmin =
    currentUser &&
    (currentUser.role === "OWNER" ||
      currentUser.role === "FINANCE" ||
      currentUser.role === "STAFF_VERIFICATION");

  return (
    <nav className="bottom-nav" aria-label="Navigasi mobile" suppressHydrationWarning>
      <Link href="/" className={pathname === "/" ? "active" : ""} aria-current={pathname === "/" ? "page" : undefined}>
        <Home />
        <span>Beranda</span>
      </Link>
      <button
        type="button"
        className="badge-button"
        onClick={() => {
          if (!currentUser) {
            setAuthOpen(true);
            return;
          }
          setWishlistOpen(true);
        }}
        aria-label={`Favorit, ${currentWishlistCount} produk`}
        suppressHydrationWarning
      >
        <Heart />
        {currentWishlistCount > 0 && <b>{currentWishlistCount}</b>}
        <span>Favorit</span>
      </button>
      <Link href="/keranjang" className={`badge-button ${pathname === "/keranjang" ? "active" : ""}`} suppressHydrationWarning>
        <ShoppingBag />
        {currentCartCount > 0 && <b>{currentCartCount}</b>}
        <span>Keranjang</span>
      </Link>
      <Link href="/pesanan" className={pathname.startsWith("/pesanan") ? "active" : ""}>
        <PackageCheck />
        <span>Pesanan</span>
      </Link>
      {isAdmin ? (
        <Link href="/admin/orders" className="active">
          <ShieldCheck />
          <span>Admin</span>
        </Link>
      ) : (
        currentUser ? (
          <Link href="/profil" className={pathname === "/profil" ? "active" : ""}>
            <UserRound />
            <span>Akun</span>
          </Link>
        ) : (
          <button onClick={() => setAuthOpen(true)} suppressHydrationWarning>
            <UserRound />
            <span>Akun</span>
          </button>
        )
      )}
    </nav>
  );
}
