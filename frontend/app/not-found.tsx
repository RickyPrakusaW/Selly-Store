import Link from 'next/link';

export default function NotFound() {
  return <main className="simple-page shell"><section className="empty-state"><span className="not-found-flower">✿</span><h1>Halaman belum berbunga</h1><p>Produk atau halaman yang Anda cari tidak tersedia.</p><Link href="/" className="primary-button">Kembali ke Beranda</Link></section></main>;
}
