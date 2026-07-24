'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Clock, PackageCheck, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { fetchMyOrders } from '@/lib/api';
import { useSeliStore } from '@/lib/store';
import type { OrderListItem, OrderStatus } from '@/lib/types';

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case 'PENDING_PAYMENT':
      return { label: 'Menunggu DP 50%', className: 'badge-orange' };
    case 'DP_VERIFIED':
      return { label: 'DP Diverifikasi', className: 'badge-blue' };
    case 'PENDING_FINAL_PAYMENT':
      return { label: 'Menunggu Pelunasan', className: 'badge-orange' };
    case 'FULLY_PAID':
      return { label: 'Lunas', className: 'badge-green' };
    case 'PROCESSING':
      return { label: 'Diproses', className: 'badge-green' };
    case 'COMPLETED':
      return { label: 'Selesai', className: 'badge-green' };
    case 'CANCELLED':
      return { label: 'Dibatalkan', className: 'badge-gray' };
    case 'REJECTED':
      return { label: 'Ditolak', className: 'badge-red' };
    default:
      return { label: status, className: 'badge-gray' };
  }
}

export default function CustomerOrdersPage() {
  const user = useSeliStore((state) => state.user);
  const setAuthOpen = useSeliStore((state) => state.setAuthOpen);
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const { data: orders = [], isLoading } = useQuery<OrderListItem[]>({
    queryKey: ['my-orders', selectedStatus],
    queryFn: () => fetchMyOrders(1, selectedStatus || undefined),
    enabled: !!user,
  });

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

      {isLoading ? (
        <div className="empty-state"><p>Memuat daftar pesanan Anda…</p></div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <ShoppingBag size={45} />
          <h3>Belum Ada Pesanan</h3>
          <p>Anda belum memiliki transaksi pesanan pada status ini.</p>
          <Link href="/" className="primary-button">Mulai Belanja</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const badge = getStatusBadge(order.status);
            const createdDate = new Date(order.createdAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <article key={order.id} className="order-history-card">
                <div className="order-card-header">
                  <div>
                    <span className="order-id-code">#ORDER-{order.id.slice(0, 8).toUpperCase()}</span>
                    <span className="order-date-text" suppressHydrationWarning><Clock size={13} /> {createdDate}</span>
                  </div>
                  <span className={`status-badge-pill ${badge.className}`}>{badge.label}</span>
                </div>

                <div className="order-card-body">
                  <div className="order-items-preview">
                    {order.items.map((item, idx) => (
                      <p key={idx}>
                        <strong>{item.qty}x</strong> {item.productNameSnapshot}
                      </p>
                    ))}
                  </div>

                  <div className="order-card-financials">
                    <div>
                      <small>Total Pesanan:</small>
                      <strong>{rupiah.format(Number(order.total))}</strong>
                    </div>
                    <div>
                      <small>DP 50%:</small>
                      <span>{rupiah.format(Number(order.dpAmount))}</span>
                    </div>
                    {Number(order.remainingAmount) > 0 && (
                      <div>
                        <small>Sisa Pelunasan:</small>
                        <span className="text-orange">{rupiah.format(Number(order.remainingAmount))}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="order-card-footer">
                  <Link href={`/pesanan/${order.id}`} className="primary-button compact">
                    Detail &amp; Upload Bukti <ArrowRight size={16} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
