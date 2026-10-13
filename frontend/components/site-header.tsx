'use client';

import { ChevronDown, Heart, LogOut, PackageCheck, Search, Settings, ShoppingBag, UserRound } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';
import type { Category } from '@/lib/types';
import { useSeliStore } from '@/lib/store';

const defaultCategories: Category[] = [
  { id: 'cat-1', name: 'Bunga Segar', slug: 'bunga', description: '' },
  { id: 'cat-2', name: 'Hampers & Kado', slug: 'kado', description: '' },
  { id: 'cat-3', name: 'Sewa Papan Ucapan', slug: 'papan_ucapan', description: '' },
];

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function SiteHeader({ categories }: Readonly<{ categories?: Category[] }>) {
  const pathname = usePathname();
  const mounted = useMounted();

  const user = useSeliStore((state) => state.user);
  const cartCount = useSeliStore((state) => state.cartCount);
  const wishlistCount = useSeliStore((state) => state.wishlistCount);
  const setWishlistOpen = useSeliStore((state) => state.setWishlistOpen);
  const logoutUser = useSeliStore((state) => state.logoutUser);
  const setAuthOpen = useSeliStore((state) => state.setAuthOpen);
  const setSearchOpen = useSeliStore((state) => state.setSearchOpen);
  const [profileOpen, setProfileOpen] = useState(false);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const currentUser = mounted ? user : null;
  const currentCartCount = mounted ? cartCount : 0;
  const currentWishlistCount = mounted && currentUser ? wishlistCount : 0;
  const firstName = currentUser?.fullName?.trim().split(/\s+/)[0];
  const catList = categories && categories.length > 0 ? categories : defaultCategories;

  return (
    <header className="site-header" suppressHydrationWarning>
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="Seli Florist — Beranda">
          <Image
            src="/logo.jpeg"
            alt="Logo Seli Florist"
            width={44}
            height={44}
            className="brand-logo-img"
            priority
          />
          <span className="brand-text">
            Seli Florist
            <small>Flowers &amp; Gifts</small>
          </span>
        </Link>

        <label className="header-search">
          <Search size={17} className="search-icon" />
          <input
            aria-label="Cari bunga"
            placeholder="Cari buket bunga, hampers, papan ucapan…"
            onFocus={() => setSearchOpen(true)}
          />
        </label>

        <nav className="desktop-nav" aria-label="Navigasi utama">
          <div className="category-menu">
            <button className="category-btn">
              <span>Kategori</span>
              <ChevronDown size={14} />
            </button>
            <div className="category-popover">
              {catList.map((category) => (
                <a href={`/#${category.slug}`} key={category.id}>
                  {category.name}
                </a>
              ))}
            </div>
          </div>

          <button
            className="icon-button badge-button"
            onClick={() => {
              if (!currentUser) {
                setAuthOpen(true);
                return;
              }
              setWishlistOpen(true);
            }}
            aria-label={`Wishlist, ${currentWishlistCount} produk`}
            title="Wishlist & Favorit Saya"
            suppressHydrationWarning
          >
            <Heart size={19} />
            {currentWishlistCount > 0 && (
              <b className="wishlist-badge">{currentWishlistCount}</b>
            )}
          </button>

          <Link
            href="/keranjang"
            className="icon-button badge-button"
            aria-label={`Keranjang, ${currentCartCount} item`}
            title="Keranjang Belanja"
            suppressHydrationWarning
          >
            <ShoppingBag size={19} />
            {currentCartCount > 0 && <b className="cart-badge">{currentCartCount}</b>}
          </Link>

          {currentUser ? (
            <div className="profile-dropdown-wrap" suppressHydrationWarning>
              <button
                className="profile-pill"
                onClick={() => setProfileOpen(!profileOpen)}
                aria-label="Menu akun"
                suppressHydrationWarning
              >
                <div className="avatar-circle">
                  <UserRound size={15} />
                </div>
                <span className="profile-name">{firstName}</span>
                <ChevronDown size={13} className="chevron" />
              </button>
              {profileOpen && (
                <div className="profile-popover" onMouseLeave={() => setProfileOpen(false)}>
                  <Link href="/pesanan" onClick={() => setProfileOpen(false)}>
                    <PackageCheck size={16} /> Pesanan Saya
                  </Link>
                  {(currentUser.role === 'OWNER' ||
                    currentUser.role === 'FINANCE' ||
                    currentUser.role === 'STAFF_VERIFICATION') && (
                    <Link href="/admin/orders" onClick={() => setProfileOpen(false)}>
                      <Settings size={16} /> Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      void logoutUser();
                    }}
                  >
                    <LogOut size={16} /> Keluar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="profile-pill login-pill" onClick={() => setAuthOpen(true)} suppressHydrationWarning>
              <div className="avatar-circle">
                <UserRound size={15} />
              </div>
              <span>Masuk</span>
            </button>
          )}
        </nav>

        <button
          className="mobile-search-trigger"
          onClick={() => setSearchOpen(true)}
          aria-label="Buka pencarian"
        >
          <Search size={20} />
        </button>
      </div>
    </header>
  );
}
