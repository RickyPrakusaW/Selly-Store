import Link from 'next/link';

type ProductDetailPageProps = { params: Promise<{ id: string }> };

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  return (
    <main className="product-page shell">
      <Link href="/">← Kembali ke katalog</Link>
      <div className="product-detail">
        <div className="detail-image" aria-label="Product image placeholder"><span>✿</span></div>
        <section className="detail-copy">
          <p className="eyebrow">Product scaffold · {id}</p>
          <h1>Nama Produk</h1>
          <p>Deskripsi, varian, harga, dan ketersediaan produk akan dimuat dari kontrak katalog.</p>
          <fieldset>
            <legend>Periode sewa</legend>
            <label>Tanggal mulai <input type="date" name="rentalStartAt" /></label>
            <label>Tanggal selesai <input type="date" name="rentalEndAt" /></label>
          </fieldset>
          <button className="primary-button" type="button">Tambah ke Keranjang</button>
        </section>
      </div>
    </main>
  );
}
