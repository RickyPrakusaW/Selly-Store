'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  Package,
  PackageCheck,
  QrCode,
  ShoppingBag,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';
import { fetchMyOrders } from '@/lib/api';
import { getStatusBadge } from '@/lib/order-status';
import { useSeliStore } from '@/lib/store';
import type { OrderListItem } from '@/lib/types';

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export default function CustomerOrdersPage() {
  const mounted = useMounted();
  const user = useSeliStore((state) => state.user);
  const setAuthOpen = useSeliStore((state) => state.setAuthOpen);
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const currentUser = mounted ? user : null;

  const { data: orders = [], isLoading } = useQuery<OrderListItem[]>({
    queryKey: ['my-orders', selectedStatus],
    queryFn: () => fetchMyOrders(1, selectedStatus || undefined),
    enabled: !!currentUser,
  });

  if (!mounted) {
    return (
      <main className="simple-page shell">
        <div className="empty-state">
          <p>Memuat riwayat pesanan...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="simple-page shell">
        <div className="empty-state">
          <PackageCheck size={50} />
          <h2>Silakan Masuk Terlebih Dahulu</h2>
          <p>Masuk ke akun Anda untuk melihat riwayat dan status pesanan.</p>
          <button className="primary-button" onClick={() => setAuthOpen(true)}>
            Masuk ke Akun
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="orders-page shell">
      <header className="section-heading">
        <div>
          <p className="eyebrow">Riwayat Transaksi</p>
          <h1>Pesanan Saya</h1>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="category-strip filter-tabs">
        <button className={!selectedStatus ? 'active' : ''} onClick={() => setSelectedStatus('')}>
          Semua Status
        </button>
        <button className={selectedStatus === 'PENDING_PAYMENT' ? 'active' : ''} onClick={() => setSelectedStatus('PENDING_PAYMENT')}>
          Menunggu DP
        </button>
        <button className={selectedStatus === 'PENDING_FINAL_PAYMENT' ? 'active' : ''} onClick={() => setSelectedStatus('PENDING_FINAL_PAYMENT')}>
          Menunggu Pelunasan
        </button>
        <button className={selectedStatus === 'COMPLETED' ? 'active' : ''} onClick={() => setSelectedStatus('COMPLETED')}>
          Selesai
        </button>
        <button className={selectedStatus === 'CANCELLED' ? 'active' : ''} onClick={() => setSelectedStatus('CANCELLED')}>
          Dibatalkan
        </button>
      </div>

      {orders.some((o) => o.status === "PENDING_PAYMENT") && (
        <div className="pending-notice-banner">
          <QrCode size={22} />
          <div>
            <strong>Pembayaran DP 50% Siap Diproses</strong>
            <p>
              Anda memiliki pesanan yang menunggu pembayaran DP. Klik tombol{" "}
              <strong>Bayar DP via QRIS</strong> di bawah untuk scan dan bayar
              otomatis tanpa unggah bukti manual.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="empty-state">
          <p>Memuat daftar pesanan Anda…</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <ShoppingBag size={45} />
          <h3>Belum Ada Pesanan</h3>
          <p>Anda belum memiliki transaksi pesanan pada status ini.</p>
          <Link href="/" className="primary-button">
            Mulai Belanja
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const badge = getStatusBadge(order.status);
            const createdDate = new Date(order.createdAt).toLocaleDateString(
              "id-ID",
              {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              },
            );

            return (
              <article key={order.id} className="order-history-card">
                <div className="order-card-header">
                  <div className="order-header-identity">
                    <div className="order-header-badge-icon">
                      <Package size={18} />
                    </div>
                    <div className="order-header-text">
                      <h3 className="order-id-code">
                        #ORDER-{order.id.slice(0, 8).toUpperCase()}
                      </h3>
                      <span className="order-date-text" suppressHydrationWarning>
                        <Clock size={12} /> {createdDate}
                      </span>
                    </div>
                  </div>
                  <span className={`status-badge-pill ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>

                <div className="order-card-body">
                  <div className="order-items-preview">
                    <span className="items-preview-label">Produk Dipesan</span>
                    <div className="order-items-chips-list">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="order-item-chip">
                          <span className="order-item-qty">{item.qty}×</span>
                          <span className="order-item-name">{item.productNameSnapshot}</span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <span className="order-items-more">
                          +{order.items.length - 3} produk lainnya
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="order-finance-box">
                    <div className="order-finance-row main-total">
                      <span className="finance-label">Total Pesanan</span>
                      <strong className="finance-total-val">
                        {rupiah.format(Number(order.total))}
                      </strong>
                    </div>
                    <div className="order-finance-divider" />
                    <div className="order-finance-breakdown">
                      <div className="finance-sub-row">
                        <span>DP 50%</span>
                        <b>{rupiah.format(Number(order.dpAmount))}</b>
                      </div>
                      {Number(order.remainingAmount) > 0 ? (
                        <div className="finance-sub-row remaining">
                          <span>Sisa Pelunasan</span>
                          <b>{rupiah.format(Number(order.remainingAmount))}</b>
                        </div>
                      ) : (
                        <div className="finance-sub-row paid">
                          <span>Pelunasan</span>
                          <b>Lunas</b>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="order-card-footer">
                  <div className="order-footer-hint">
                    {order.status === "PENDING_PAYMENT" ? (
                      <span className="hint-pill warning">
                        <Clock size={13} /> Selesaikan pembayaran DP via DOKU QRIS
                      </span>
                    ) : order.status === "PENDING_FINAL_PAYMENT" ? (
                      <span className="hint-pill warning">
                        <Clock size={13} /> Menunggu pelunasan sebelum pengiriman
                      </span>
                    ) : order.status === "COMPLETED" || order.status === "FULLY_PAID" ? (
                      <span className="hint-pill success">
                        <CheckCircle2 size={13} /> Pembayaran telah diverifikasi
                      </span>
                    ) : order.status === "CANCELLED" ? (
                      <span className="hint-pill neutral">
                        Pesanan telah dibatalkan
                      </span>
                    ) : (
                      <span className="hint-pill neutral">
                        Pesanan tercatat di sistem
                      </span>
                    )}
                  </div>

                  <div className="order-footer-actions">
                    <Link
                      href={`/pesanan/${order.id}`}
                      className="order-btn-detail"
                    >
                      Lihat Detail
                    </Link>

                    {order.status === "PENDING_PAYMENT" && (
                      <Link
                        href={`/pesanan/${order.id}`}
                        className="order-btn-pay"
                      >
                        <CreditCard size={15} /> Bayar DP via QRIS
                        <ArrowRight size={14} />
                      </Link>
                    )}

                    {order.status === "PENDING_FINAL_PAYMENT" && (
                      <Link
                        href={`/pesanan/${order.id}`}
                        className="order-btn-pay"
                      >
                        <CreditCard size={15} /> Bayar Pelunasan
                        <ArrowRight size={14} />
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
