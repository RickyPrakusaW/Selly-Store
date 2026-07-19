'use client';

import { Home, PackageCheck, ShieldCheck, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useSeliStore } from '@/lib/store';

export function BottomNav() {
  const user = useSeliStore((state) => state.user);
  const setAuthOpen = useSeliStore((state) => state.setAuthOpen);
  return <nav className="bottom-nav" aria-label="Navigasi mobile">
    <Link href="/"><Home /><span>Beranda</span></Link>
    <Link href="/pesanan"><PackageCheck /><span>Pesanan Saya</span></Link>
    <button onClick={() => !user && setAuthOpen(true)}>{user?.role === 'OWNER' ? <ShieldCheck /> : <UserRound />}<span>{user?.role === 'OWNER' ? 'Admin' : 'Akun'}</span></button>
  </nav>;
}
