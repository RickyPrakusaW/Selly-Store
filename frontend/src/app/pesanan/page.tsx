export default function CustomerOrdersPage() {
  return (
    <main className="simple-page shell">
      <header className="section-heading"><div><p className="eyebrow">Order history scaffold</p><h1>Pesanan Saya</h1></div></header>
      <section className="product-card">
        <div className="product-copy">
          <p className="eyebrow">#ORDER-PLACEHOLDER</p>
          <h2>Status Pesanan</h2>
          <p>Timeline, item, total, DP, dan tenggat pembayaran akan ditampilkan di sini.</p>
          <label>Unggah bukti DP<input type="file" accept="image/jpeg,image/png,image/webp" /></label>
          <button className="primary-button" type="button">Kirim Bukti</button>
        </div>
      </section>
    </main>
  );
}
