import Link from 'next/link';

export default function CartPage() {
  return (
    <main className="simple-page shell">
      <header className="section-heading"><div><p className="eyebrow">Cart scaffold</p><h1>Keranjang</h1></div></header>
      <section className="product-card">
        <div className="product-copy">
          <h2>Item keranjang</h2>
          <p>Produk, varian, kuantitas, catatan, dan periode sewa akan ditampilkan di sini.</p>
          <label>Jumlah <input type="number" min="1" defaultValue="1" /></label>
        </div>
      </section>
      <aside className="promise">
        <div><span>01</span><h3>Ringkasan</h3><p>Subtotal dihitung ulang oleh backend saat checkout.</p></div>
      </aside>
      <Link className="primary-button" href="/checkout">Lanjut Checkout</Link>
    </main>
  );
}
