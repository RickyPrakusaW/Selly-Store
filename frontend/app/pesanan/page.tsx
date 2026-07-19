'use client';

import { PackageCheck } from 'lucide-react';
import Link from 'next/link';
import { useSeliStore } from '@/lib/store';

export default function OrdersPage() {
  const user = useSeliStore((state) => state.user);
  const setAuthOpen = useSeliStore((state) => state.setAuthOpen);
  return <main className="simple-page shell"><Link href="/" className="brand"><span className="brand-mark">S</span><span>Seli Florist</span></Link><section className="empty-state"><PackageCheck /><h1>Pesanan Saya</h1><p>{user ? `Halo ${user.fullName.split(' ')[0]}, riwayat pesananmu akan tampil di sini.` : 'Masuk untuk melihat status dan riwayat pesananmu.'}</p>{user ? <Link className="primary-button" href="/">Mulai Belanja</Link> : <button className="primary-button" onClick={() => setAuthOpen(true)}>Masuk ke Akun</button>}</section></main>;
}
