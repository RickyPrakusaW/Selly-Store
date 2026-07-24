'use client';

import { ArrowRight, Calendar, Flower2, Info, LockKeyhole, Minus, Package, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { resolveImageUrl } from '@/lib/api';
import { useSeliStore } from '@/lib/store';

import { formatBookingDate } from '@/lib/types';


const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  // Client-only persisted cart data is intentionally revealed after hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const user = useSeliStore((state) => state.user);
  const cartItems = useSeliStore((state) => state.cartItems);
  const guestCart = useSeliStore((state) => state.guestCart);
  const updateQuantity = useSeliStore((state) => state.updateQuantity);
  const removeFromCart = useSeliStore((state) => state.removeFromCart);
  const clearCart = useSeliStore((state) => state.clearCart);
  const setAuthOpen = useSeliStore((state) => state.setAuthOpen);

  if (!mounted) {
    return (
      <main className="simple-page shell">
        <div className="empty-state">
          <p>Memuat keranjang…</p>
        </div>
      </main>
    );
  }

  const isGuest = !user;

  const rawItems = isGuest ? guestCart : cartItems;

  // Normalized items for rendering
  const items = rawItems.map((item, index) => {
    if ('product' in item && 'qty' in item && !('productId' in item)) {
      // GuestCartLine
      const price = Number(item.product.basePrice);
      return {
        id: String(index),
        name: item.product.name,
        category: item.product.category?.name,
        price,
        qty: item.qty,
        image: item.product.images?.find((i) => i.isPrimary)?.imageUrl ?? item.product.images?.[0]?.imageUrl,
        customNote: item.customNote ?? '',
        bookingDate: item.bookingDate ?? '',
        bookingEndDate: item.bookingEndDate ?? '',
        isRental: item.product.stockType?.toString().toLowerCase().includes('rental'),
      };
    } else {
      // CartItem from backend
      const cItem = item as typeof cartItems[0];
      const basePrice = Number(cItem.product.basePrice);
      const deltaPrice = cItem.variant ? Number(cItem.variant.priceDelta) : 0;
      const price = basePrice + deltaPrice;
      return {
        id: cItem.id,
        name: cItem.product.name,
        variantName: cItem.variant?.variantName,
        category: cItem.product.category?.name,
        price,
        qty: cItem.qty,
        image: cItem.product.images?.find((i) => i.isPrimary)?.imageUrl ?? cItem.product.images?.[0]?.imageUrl,
        customNote: cItem.customNote ?? '',
        bookingDate: cItem.bookingDate ?? '',
        bookingEndDate: cItem.bookingEndDate ?? '',
        isRental: cItem.product.stockType?.toString().toLowerCase().includes('rental'),
      };
    }
  });

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  if (items.length === 0) {
    return (
      <main className="simple-page shell">
        <div className="empty-state">
          <ShoppingBag size={50} />
          <h2>Keranjang Belanja Kosong</h2>
          <p>Anda belum menambahkan rangkaian bunga atau kado ke keranjang.</p>
          <Link href="/" className="primary-button" style={{ marginTop: '16px' }}>
            Jelajahi Koleksi <ArrowRight size={18} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="cart-page shell">
      <header className="section-heading">
        <div>
          <p className="eyebrow">Pilihan Anda</p>
          <h1>Keranjang Belanja</h1>
        </div>
        <button className="clear-cart-btn" onClick={() => void clearCart()}>
          Bersihkan Keranjang
        </button>
      </header>

      {isGuest && (
        <div className="guest-notice-banner">
          <Info size={20} />
          <div>
            <strong>Anda berbelanja sebagai Tamu</strong>
            <p>Silakan masuk agar keranjang Anda tersimpan dan dapat dilanjutkan ke checkout.</p>
          </div>
          <button className="primary-button compact" onClick={() => setAuthOpen(true)}>
            Masuk / Daftar
          </button>
        </div>
      )}

      <div className="cart-grid">
        <section className="cart-items-list">
          {items.map((item) => (
            <article key={item.id} className="cart-item-card">
              <div className="cart-item-image">
                {item.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={resolveImageUrl(item.image)} alt={item.name} className="cart-product-image" />
                ) : (
                  <div className="product-placeholder"><Package aria-hidden="true" /></div>
                )}
              </div>
              <div className="cart-item-info">
                {item.category && <span className="cart-item-category">{item.category}</span>}
                <h3>{item.name}</h3>
                {item.variantName && <p className="cart-item-variant">Varian: {item.variantName}</p>}
                <strong className="cart-item-price">{rupiah.format(item.price)}</strong>

                {item.customNote && (
                  <p className="cart-item-note">Catatan: &quot;{item.customNote}&quot;</p>
                )}

                {item.isRental && (item.bookingDate || item.bookingEndDate) && (
                  <div className="cart-item-booking">
                    <Calendar size={14} />
                    <span>
                      Sewa: {formatBookingDate(item.bookingDate)} {item.bookingEndDate ? `s/d ${formatBookingDate(item.bookingEndDate)}` : ''}
                    </span>
                  </div>
                )}

              </div>

              <div className="cart-item-actions">
                <div className="qty-controls">
                  <button
                    onClick={() => void updateQuantity(item.id, Math.max(1, item.qty - 1))}
                    disabled={item.qty <= 1}
                    aria-label="Kurangi kuantitas"
                  >
                    <Minus size={14} />
                  </button>
                  <span>{item.qty}</span>
                  <button
                    onClick={() => void updateQuantity(item.id, item.qty + 1)}
                    aria-label="Tambah kuantitas"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <strong className="cart-item-total">{rupiah.format(item.price * item.qty)}</strong>
                <button
                  className="remove-item-btn"
                  onClick={() => void removeFromCart(item.id)}
                  aria-label="Hapus item"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </article>
          ))}
        </section>

        <aside className="cart-summary-card">
          <h2>Ringkasan Pesanan</h2>
          <div className="summary-row">
            <span>Total Item</span>
            <span>{items.reduce((s, i) => s + i.qty, 0)} item</span>
          </div>
          <div className="summary-row">
            <span>Subtotal</span>
            <strong>{rupiah.format(subtotal)}</strong>
          </div>
          <div className="summary-row hint">
            <span>Ongkos Kirim</span>
            <small>Dihitung di Checkout</small>
          </div>
          <div className="summary-divider" />
          <div className="summary-row total-row">
            <span>Perkiraan Total</span>
            <strong>{rupiah.format(subtotal)}</strong>
          </div>

          {isGuest ? (
            <button className="primary-button full-width" onClick={() => setAuthOpen(true)}>
              Masuk untuk Checkout <ArrowRight size={18} />
            </button>
          ) : (
            <Link href="/checkout" className="primary-button full-width">
              Lanjut ke Checkout <ArrowRight size={18} />
            </Link>
          )}

          <div className="security-badges">
            <span><LockKeyhole size={15} /> Pembayaran Terenkripsi &amp; Aman</span>
            <span><Flower2 size={15} /> Jaminan Bunga Segar</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
