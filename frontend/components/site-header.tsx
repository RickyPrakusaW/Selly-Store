'use client';

import { ChevronDown, Heart, Search, ShoppingBag, UserRound } from 'lucide-react';
import Link from 'next/link';
import type { Category } from '@/lib/types';
import { useSeliStore } from '@/lib/store';

export function SiteHeader({ categories }: Readonly<{ categories: Category[] }>) {
  const user = useSeliStore((state) => state.user);
  const cartCount = useSeliStore((state) => state.cart.reduce((total, line) => total + line.quantity, 0));
  const setAuthOpen = useSeliStore((state) => state.setAuthOpen);
  const setSearchOpen = useSeliStore((state) => state.setSearchOpen);
  const firstName = user?.fullName.trim().split(/\s+/)[0];

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="Seli Florist — Beranda">
          <span className="brand-mark">S</span><span>Seli Florist<small>Flowers & Gifts</small></span>
        </Link>
        <nav className="desktop-nav" aria-label="Navigasi utama">
          <div className="category-menu"><button>Kategori <ChevronDown size={15} /></button><div className="category-popover">{categories.map((category) => <a href={`/#${category.slug}`} key={category.id}>{category.name}</a>)}</div></div>
          <label className="header-search"><Search size={18} /><input aria-label="Cari bunga" placeholder="Cari bunga, hadiah, papan…" onFocus={() => setSearchOpen(true)} /></label>
          <button className="icon-button" aria-label="Wishlist"><Heart size={20} /></button>
          <button className="icon-button badge-button" aria-label={`Keranjang, ${cartCount} item`}><ShoppingBag size={20} />{cartCount > 0 && <b>{cartCount}</b>}</button>
          <button className="profile-pill" onClick={() => !user && setAuthOpen(true)}><UserRound size={18} /><span>{firstName ?? 'Masuk'}</span></button>
        </nav>
        <button className="mobile-search-trigger" onClick={() => setSearchOpen(true)} aria-label="Buka pencarian"><Search size={21} /></button>
      </div>
    </header>
  );
}
