export default function CheckoutPage() {
  return (
    <main className="simple-page shell">
      <header className="section-heading"><div><p className="eyebrow">Checkout scaffold</p><h1>Selesaikan Pesanan</h1></div></header>
      <form className="auth-card">
        <fieldset>
          <legend>Metode penerimaan</legend>
          <label><input type="radio" name="deliveryType" value="delivery" defaultChecked /> Delivery</label>
          <label><input type="radio" name="deliveryType" value="pickup" /> Pickup</label>
        </fieldset>
        <label>Nama pelanggan<input name="customerName" /></label>
        <label>Nomor WhatsApp<input name="customerPhone" inputMode="tel" /></label>
        <label>Nama penerima<input name="recipientName" /></label>
        <label>Alamat pengiriman<textarea name="fullAddress" rows={4} /></label>
        <section><h2>Ringkasan Pembayaran</h2><p>Subtotal, ongkir, DP, dan sisa pembayaran berasal dari respons checkout.</p></section>
        <button className="primary-button" type="button">Buat Pesanan</button>
      </form>
    </main>
  );
}
