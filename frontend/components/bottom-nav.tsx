"use client";

import {
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
  const setAuthOpen = useSeliStore((state) => state.setAuthOpen);

  // Hide BottomNav on all admin portal routes
  if (pathname.startsWith("/admin")) {
    return null;
  }

  const currentUser = mounted ? user : null;
  const currentCartCount = mounted ? cartCount : 0;
  const isAdmin =
    currentUser &&
    (currentUser.role === "OWNER" ||
      currentUser.role === "FINANCE" ||
      currentUser.role === "STAFF_VERIFICATION");

  return (
    <nav className="bottom-nav" aria-label="Navigasi mobile" suppressHydrationWarning>
      <Link href="/">
        <Home />
        <span>Beranda</span>
      </Link>
      <Link href="/keranjang" className="badge-button" suppressHydrationWarning>
        <ShoppingBag />
        {currentCartCount > 0 && <b>{currentCartCount}</b>}
        <span>Keranjang</span>
      </Link>
      <Link href="/pesanan">
        <PackageCheck />
        <span>Pesanan</span>
      </Link>
      {isAdmin ? (
        <Link href="/admin/orders">
          <ShieldCheck />
          <span>Admin</span>
        </Link>
      ) : (
        <button onClick={() => !currentUser && setAuthOpen(true)} suppressHydrationWarning>
          <UserRound />
          <span>
            {currentUser ? currentUser.fullName.split(" ")[0] : "Akun"}
          </span>
        </button>
      )}
    </nav>
  );
}
