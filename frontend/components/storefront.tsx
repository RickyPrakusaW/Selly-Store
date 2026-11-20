import {
  ArrowRight,
  CalendarDays,
  Camera,
  Clock3,
  CreditCard,
  Leaf,
  LockKeyhole,
  Mail,
  MapPin,
  MessageCircle,
  PackageCheck,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Category, Product } from "@/lib/types";
import { normalizeWhatsAppNumber } from "@/lib/phone-number";
import { CopyVoucherButton } from "./copy-voucher-button";
import { HomeCatalog } from "./home-catalog";

const categoryCards = [
  {
    eyebrow: "Terpopuler",
    title: "Buket Bunga",
    detail: "Rangkaian eksklusif untuk momen manis",
    price: "Mulai dari Rp 180.000",
    image: "/images/stitch/category-bouquet.jpg",
    href: "#koleksi",
  },
  {
    eyebrow: "Rental Butik",
    title: "Papan Ucapan Akrilik",
    detail: "Papan elegan, modern, dan bebas repot",
    price: "Mulai dari Rp 450.000 / hari",
    image: "/images/stitch/category-board.jpg",
    href: "#rental",
  },
  {
    eyebrow: "Gift Set",
    title: "Hampers Eksklusif",
    detail: "Koleksi kado terkurasi siap dikirim",
    price: "Mulai dari Rp 320.000",
    image: "/images/stitch/category-hampers.jpg",
    href: "#koleksi",
  },
] as const;

const servicePoints = [
  { icon: Leaf, label: "Garansi bunga segar" },
  { icon: Clock3, label: "Pengerjaan terjadwal" },
  { icon: ShieldCheck, label: "Bebas double-booking" },
  { icon: CreditCard, label: "Fleksibel DP 50%" },
] as const;

const orderSteps = [
  {
    title: "Pilih & kustomisasi pesanan",
    description:
      "Tentukan buket atau papan, tulis kartu ucapan, lalu pilih detail yang tersedia.",
    note: "Kustomisasi gratis",
    icon: Sparkles,
  },
  {
    title: "Bayar DP 50%",
    description:
      "Bayar setengah dari total pesanan melalui metode pembayaran yang tersedia.",
    note: "Slot pesanan diamankan",
    icon: CreditCard,
  },
  {
    title: "Perangkaian & foto hasil",
    description:
      "Florist merangkai dengan teliti dan mengirim pratinjau sebelum pengiriman.",
    note: "Konfirmasi pratinjau",
    icon: Camera,
  },
  {
    title: "Pelunasan & pengiriman",
    description:
      "Selesaikan pembayaran, lalu pesanan diantar atau disiapkan untuk pengambilan.",
    note: "Pengiriman terjadwal",
    icon: Truck,
  },
] as const;

const testimonials = [
  {
    quote:
      "Bunganya segar dan rangkaiannya rapi. Sistem DP 50% juga sangat membantu saat persiapan acara kami.",
    name: "Annisa Pratista",
    product: "Pembeli buket bunga",
    image: "/images/stitch/review-annisa.jpg",
  },
  {
    quote:
      "Papan akriliknya elegan dan berbeda dari papan bunga biasa. Banyak tamu berhenti untuk berfoto.",
    name: "Dimas Bagaskara",
    product: "Penyewa papan ucapan",
    image: "/images/stitch/review-dimas.jpg",
  },
  {
    quote:
      "Pesanan datang tepat waktu dan kondisinya tetap segar. Komunikasi adminnya jelas dari awal.",
    name: "Clarissa Wijaya",
    product: "Pembeli rangkaian wisuda",
    image: "/images/stitch/review-clarissa.jpg",
  },
] as const;

export function Storefront({
  initialProducts,
  categories,
}: Readonly<{ initialProducts: Product[]; categories: Category[] }>) {
  const waNumber = normalizeWhatsAppNumber(
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "6289517880077",
  );
  const consultationUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    "Halo LICHARY Florist, saya ingin konsultasi rangkaian bunga.",
  )}`;
  const promoCode = process.env.NEXT_PUBLIC_PROMO_CODE ?? "LICHARYBLOOM";

  return (
    <>
      <main className="home-main">
        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-hero-glow home-hero-glow-left" />
          <div className="home-hero-glow home-hero-glow-right" />
          <div className="home-shell home-hero-grid">
            <div className="home-hero-copy">
              <p className="home-kicker">
                <span /> Atelier bunga & papan akrilik
              </p>
              <h1 id="home-title">
                Rangkai Momen Berharga dengan Sentuhan{" "}
                <em>Bunga Butik</em>
              </h1>
              <p className="home-hero-lead">
                Buket bunga segar terkurasi, hampers eksklusif, dan rental
                papan ucapan akrilik elegan dengan sistem pembayaran bertahap
                DP 50%.
              </p>
              <div className="home-hero-actions">
                <a className="home-button home-button-primary" href="#koleksi">
                  Belanja Sekarang <ArrowRight size={17} />
                </a>
                <a className="home-button home-button-light" href="#rental">
                  <CalendarDays size={17} /> Sewa Papan Ucapan
                </a>
              </div>
              <div className="home-service-wrap">
                <p>Standar pelayanan butik LICHARY</p>
                <ul>
                  {servicePoints.map(({ icon: Icon, label }) => (
                    <li key={label}>
                      <Icon size={14} aria-hidden="true" /> {label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="home-hero-visual" aria-label="Rangkaian unggulan LICHARY Florist">
              <div className="home-hero-image">
                <Image
                  src="/images/stitch/hero.jpg"
                  alt="Buket bunga pastel mewah di studio florist"
                  fill
                  priority
                  sizes="(max-width: 860px) 92vw, 42vw"
                />
              </div>
              <div className="home-hero-card home-hero-card-top">
                <Sparkles size={18} />
                <span><b>Dirangkai personal</b> sesuai detail pesanan</span>
              </div>
              <div className="home-hero-card home-hero-card-bottom">
                <ShieldCheck size={19} />
                <span><b>DP 50%</b> untuk amankan jadwal</span>
              </div>
            </div>
          </div>
        </section>

        <section className="home-section home-categories" aria-labelledby="category-title">
          <div className="home-shell">
            <div className="home-heading home-heading-centered">
              <p>Kurasi koleksi</p>
              <h2 id="category-title">Kategori Rangkaian Pilihan</h2>
            </div>
            <div className="home-category-grid">
              {categoryCards.map((card) => (
                <a className="home-category-card" href={card.href} key={card.title}>
                  <Image src={card.image} alt="" fill sizes="(max-width: 760px) 92vw, 31vw" />
                  <span className="home-category-overlay" />
                  <span className="home-category-content">
                    <small>{card.eyebrow}</small>
                    <strong>{card.title}</strong>
                    <span>{card.detail}</span>
                    <b>{card.price}</b>
                    <i><ArrowRight size={16} /></i>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <HomeCatalog initialProducts={initialProducts} categories={categories} />

        <section className="home-section home-rental" id="rental" aria-labelledby="rental-title">
          <div className="home-shell home-rental-grid">
            <div className="home-rental-media">
              <Image
                src="/images/stitch/rental-board.jpg"
                alt="Papan ucapan akrilik dengan dekorasi bunga pastel"
                fill
                sizes="(max-width: 860px) 92vw, 46vw"
              />
              <span className="home-rental-lock">
                <LockKeyhole size={17} /> Slot terkunci aman
              </span>
            </div>
            <div className="home-rental-copy">
              <p className="home-eyebrow"><ShieldCheck size={15} /> Rental terjadwal</p>
              <h2 id="rental-title">
                Sewa Papan Ucapan Elegan Tanpa Khawatir Bentrok Tanggal
              </h2>
              <p>
                Papan akrilik modern dengan bunga asli yang dapat disesuaikan.
                Sistem memeriksa ketersediaan unit berdasarkan tanggal acara.
              </p>
              <ol className="home-rental-steps">
                <li><span>01</span><div><b>Pilih jadwal</b><small>Tentukan tipe papan dan tanggal acara.</small></div></li>
                <li><span>02</span><div><b>Kunci dengan DP 50%</b><small>Unit diamankan setelah pembayaran terverifikasi.</small></div></li>
                <li><span>03</span><div><b>Bebas repot</b><small>Tim kami mengantar, memasang, dan menjemput.</small></div></li>
              </ol>
              <a className="home-button home-button-primary" href="#koleksi">
                Cek Ketersediaan <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </section>

        <section className="home-section home-process" id="cara-pesan" aria-labelledby="process-title">
          <div className="home-shell">
            <div className="home-heading home-heading-centered">
              <p>Mudah & transparan</p>
              <h2 id="process-title">Cara Pesan & Sistem Pembayaran</h2>
              <span>Empat langkah sederhana dari pilihan pertama hingga pesanan tiba.</span>
            </div>
            <ol className="home-process-grid">
              {orderSteps.map(({ title, description, note, icon: Icon }, index) => (
                <li key={title}>
                  <span className="home-step-number">{index + 1}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <small><Icon size={15} /> {note}</small>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="home-section home-social-proof" aria-labelledby="testimonial-title">
          <div className="home-shell">
            <div className="home-promo">
              <div>
                <p>Penawaran momen spesial</p>
                <h2>Diskon 10% untuk Pre-Order Pilihan</h2>
                <span>Pesan lebih awal untuk mengamankan slot perangkai utama kami.</span>
              </div>
              <div className="home-promo-code">
                <small>Gunakan kode kupon</small>
                <strong>{promoCode}</strong>
                <CopyVoucherButton code={promoCode} />
              </div>
            </div>

            <div className="home-heading home-heading-centered home-testimonial-heading">
              <p>Ulasan terverifikasi</p>
              <h2 id="testimonial-title">Kisah Manis Pelanggan Seli</h2>
            </div>
            <div className="home-testimonial-grid">
              {testimonials.map((testimonial) => (
                <article key={testimonial.name}>
                  <div className="home-stars" aria-label="5 dari 5 bintang">
                    {Array.from({ length: 5 }, (_, index) => <Star key={index} size={15} fill="currentColor" />)}
                  </div>
                  <blockquote>“{testimonial.quote}”</blockquote>
                  <footer>
                    <Image src={testimonial.image} alt="" width={48} height={48} />
                    <span><b>{testimonial.name}</b><small>{testimonial.product}</small></span>
                  </footer>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="home-footer" id="kontak">
        <div className="home-shell home-footer-assist">
          <div>
            <span className="home-footer-assist-icon"><MessageCircle size={21} /></span>
            <div>
              <small>Butuh rekomendasi?</small>
              <h2>Ceritakan momen dan anggaran Anda.</h2>
              <p>Florist kami membantu memilih rangkaian yang paling sesuai.</p>
            </div>
          </div>
          <a href={consultationUrl} target="_blank" rel="noopener noreferrer">
            Mulai konsultasi <ArrowRight size={16} />
          </a>
        </div>

        <div className="home-footer-trust">
          <div className="home-shell">
            <span><Leaf size={17} /><b>Garansi segar</b><small>Bunga dipilih setiap hari</small></span>
            <span><ShieldCheck size={17} /><b>Pembayaran aman</b><small>DP dan pelunasan tercatat</small></span>
            <span><Truck size={17} /><b>Pengiriman terjadwal</b><small>Diantar sesuai detail pesanan</small></span>
          </div>
        </div>

        <div className="home-shell home-footer-grid">
          <div className="home-footer-brand">
            <div className="home-footer-logo">
              <Image src="/logo.jpeg" alt="" width={46} height={46} />
              <span><strong>LICHARY Florist</strong><small>Bespoke Floral Studio</small></span>
            </div>
            <p>Bespoke floral studio untuk buket, hampers, dan rental papan ucapan di setiap perayaan berharga.</p>
            <span className="home-footer-hours"><Clock3 size={14} /> Setiap hari, 08.00–21.00 WIB</span>
          </div>
          <div>
            <b>Jelajahi</b>
            <Link href="/#koleksi">Katalog produk</Link>
            <Link href="/#rental">Rental papan</Link>
            <Link href="/#cara-pesan">Cara memesan</Link>
            <Link href="/keranjang">Keranjang</Link>
            <Link href="/pesanan"><PackageCheck size={12} /> Lacak pesanan</Link>
          </div>
          <div>
            <b>Layanan pelanggan</b>
            <a href={consultationUrl} target="_blank" rel="noopener noreferrer"><PhoneCall size={12} /> WhatsApp florist</a>
            <a href="mailto:halo@licharyflorist.com"><Mail size={12} /> halo@licharyflorist.com</a>
            <span><MapPin size={12} /> Jakarta, Indonesia</span>
          </div>
          <div className="home-footer-payment">
            <b>Pembayaran</b>
            <p>Transaksi terverifikasi dengan metode pembayaran yang praktis.</p>
            <div><span>BCA VA</span><span>Mandiri</span><span>QRIS</span></div>
            <small><ShieldCheck size={13} /> DP 50% & pelunasan tercatat</small>
          </div>
        </div>
        <div className="home-shell home-footer-bottom">
          <span>© {new Date().getFullYear()} LICHARY Florist. Hak cipta dilindungi.</span>
          <nav aria-label="Tautan footer">
            <Link href="/#koleksi">Belanja</Link>
            <Link href="/#cara-pesan">Panduan</Link>
            <a href={consultationUrl} target="_blank" rel="noopener noreferrer">Bantuan</a>
          </nav>
        </div>
      </footer>

      <a className="home-floating-chat" href={consultationUrl} target="_blank" rel="noopener noreferrer">
        <MessageCircle size={19} /> <span>Konsultasi Florist</span>
      </a>
    </>
  );
}
