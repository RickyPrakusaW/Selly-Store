export default function AdminOrdersPage() {
  return (
    <main className="simple-page shell">
      <header className="section-heading"><div><p className="eyebrow">Admin scaffold</p><h1>Antrean Verifikasi</h1></div></header>
      <section className="promise">
        <div><span>01</span><h3>Menunggu DP</h3><p>Order dan bukti DP pending akan tampil di kolom ini.</p></div>
        <div><span>02</span><h3>Menunggu Pelunasan</h3><p>Bukti pembayaran final akan tampil di kolom ini.</p></div>
        <div><span>03</span><h3>Unit Rental</h3><p>Admin dapat membuka dialog reassign unit fisik.</p></div>
      </section>
      <article className="product-card"><div className="product-copy"><h2>Order placeholder</h2><p>Customer, nominal, proof preview, dan audit context.</p><button className="primary-button" type="button">Verifikasi</button></div></article>
    </main>
  );
}
