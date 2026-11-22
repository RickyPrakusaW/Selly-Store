import {
  ArrowRight,
  Award,
  CalendarDays,
  Camera,
  Clock3,
  CreditCard,
  Flower2,
  Gift,
  Headphones,
  Heart,
  Leaf,
  LockKeyhole,
  Mail,
  MapPin,
  MessageCircle,
  PackageCheck,
  PhoneCall,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
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
import { ProductCard } from "./product-card";

const FLOATING_CATEGORIES = [
  { label: "Buket Bunga", icon: Flower2, href: "#koleksi", slug: "bunga" },
  { label: "Papan Ucapan", icon: ShieldCheck, href: "#rental", slug: "papan_ucapan" },
  { label: "Hampers", icon: Gift, href: "#koleksi", slug: "kado" },
  { label: "Bunga Artificial", icon: Sparkles, href: "#koleksi", slug: "bunga" },
  { label: "Bunga Segar", icon: Leaf, href: "#koleksi", slug: "bunga" },
  { label: "Dekorasi Acara", icon: CalendarDays, href: "#koleksi", slug: "papan_ucapan" },
  { label: "Lainnya", icon: Heart, href: "#koleksi", slug: "" },
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

const fallbackProducts: Product[] = [
  {
    id: "fb-1",
    name: "Classic Lilac Blossom Bouquet",
    slug: "classic-lilac-blossom-bouquet",
    basePrice: "385000",
    stockType: "READY_STOCK",
    stockQty: 10,
    availableQty: 10,
    reservedQty: 0,
    description: "Buket bunga bernuansa ungu pastel eksklusif",
    category: { id: "c-1", slug: "bunga", name: "Buket Bunga" },
    variants: [],
    images: [{ id: "img-1", imageUrl: "/images/stitch/hero-banner.jpg", isPrimary: true, sortOrder: 0 }],
  },
  {
    id: "fb-2",
    name: "Crimson Red Roses Luxury",
    slug: "crimson-red-roses-luxury",
    basePrice: "450000",
    stockType: "READY_STOCK",
    stockQty: 15,
    availableQty: 15,
    reservedQty: 0,
    description: "Mawar merah premium pilihan istimewa",
    category: { id: "c-1", slug: "bunga", name: "Buket Bunga" },
    variants: [],
    images: [{ id: "img-2", imageUrl: "/images/stitch/product-pastel.jpg", isPrimary: true, sortOrder: 0 }],
  },
  {
    id: "fb-3",
    name: "Sweet Pastel Lily Cascade",
    slug: "sweet-pastel-lily-cascade",
    basePrice: "420000",
    stockType: "READY_STOCK",
    stockQty: 8,
    availableQty: 8,
    reservedQty: 0,
    description: "Rangkaian bunga lily pastel menawan",
    category: { id: "c-1", slug: "bunga", name: "Buket Bunga" },
    variants: [],
    images: [{ id: "img-3", imageUrl: "/images/stitch/product-blush.jpg", isPrimary: true, sortOrder: 0 }],
  },
  {
    id: "fb-4",
    name: "Ethereal Blue Hydrangea Symphony",
    slug: "ethereal-blue-hydrangea-symphony",
    basePrice: "490000",
    stockType: "READY_STOCK",
    stockQty: 12,
    availableQty: 12,
    reservedQty: 0,
    description: "Kombinasi mawar biru dan putih elegan",
    category: { id: "c-1", slug: "bunga", name: "Buket Bunga" },
    variants: [],
    images: [{ id: "img-4", imageUrl: "/images/stitch/product-board.jpg", isPrimary: true, sortOrder: 0 }],
  },
  {
    id: "fb-5",
    name: "Golden Sunflower Sunshine",
    slug: "golden-sunflower-sunshine",
    basePrice: "360000",
    stockType: "READY_STOCK",
    stockQty: 20,
    availableQty: 20,
    reservedQty: 0,
    description: "Buket bunga matahari cerah penuh sukacita",
    category: { id: "c-1", slug: "bunga", name: "Buket Bunga" },
    variants: [],
    images: [{ id: "img-5", imageUrl: "/images/stitch/product-hamper.jpg", isPrimary: true, sortOrder: 0 }],
  },
];

export function Storefront({
  initialProducts,
  categories,
}: Readonly<{ initialProducts: Product[]; categories: Category[] }>) {
  const waNumber = normalizeWhatsAppNumber(
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "6289517880077",
  );
  const consultationUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    "Halo LICHARY Florist, saya ingin konsultasi rangkaian buket bunga custom.",
  )}`;
  const promoCode = process.env.NEXT_PUBLIC_PROMO_CODE ?? "LICHARYBLOOM";

  const bestSellerProducts =
    initialProducts.length >= 5
      ? initialProducts.slice(0, 5)
      : [
          ...initialProducts,
          ...fallbackProducts.slice(0, 5 - initialProducts.length),
        ];

  return (
    <>
      <main className="home-main">
        {/* HERO SECTION MATCHING DESIGN & IMAGE 2 */}
        <section className="home-hero-custom" aria-labelledby="home-title">
          <div className="home-hero-bg-layer">
            <Image
              src="/images/stitch/hero-banner.jpg"
              alt="LICHARY Florist Studio & Bouquet"
              fill
              priority
              className="home-hero-bg-img"
              sizes="100vw"
            />
            <div className="home-hero-bg-scrim" />
          </div>

          <div className="home-shell home-hero-content-wrap">
            <div className="home-hero-left-box">
              <div className="hero-kicker-row">
                <span className="hero-kicker-text">BUKET BUNGA PREMIUM</span>
                <span className="hero-kicker-line" aria-hidden="true" />
              </div>

              <h1 id="home-title" className="hero-custom-heading">
                Rangkai Momen Berharga<br />
                dengan Sentuhan <em>Bunga Butik</em>
              </h1>

              <p className="hero-custom-lead">
                Buket bunga segar, rapi, dan elegan untuk berbagai momen spesial.
                Pilihan desain eksklusif, bisa custom sesuai keinginanmu.
              </p>

              <div className="hero-custom-actions">
                <a className="hero-btn-primary" href="#koleksi">
                  <ShoppingBag size={18} />
                  <span>Belanja Sekarang</span>
                  <ArrowRight size={17} />
                </a>
                <a
                  className="hero-btn-secondary"
                  href={consultationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <SlidersHorizontal size={17} />
                  <span>Custom Buket</span>
                </a>
              </div>

              <div className="hero-trust-grid">
                <div className="trust-item">
                  <div className="trust-icon-box"><Truck size={20} /></div>
                  <div className="trust-item-copy">
                    <b>Pengiriman Cepat</b>
                    <small>Area Surabaya</small>
                  </div>
                </div>
                <div className="trust-item">
                  <div className="trust-icon-box"><Award size={20} /></div>
                  <div className="trust-item-copy">
                    <b>Bunga Segar</b>
                    <small>Berkualitas</small>
                  </div>
                </div>
                <div className="trust-item">
                  <div className="trust-icon-box"><ShieldCheck size={20} /></div>
                  <div className="trust-item-copy">
                    <b>Bisa Custom</b>
                    <small>Sesuai Keinginan</small>
                  </div>
                </div>
                <div className="trust-item">
                  <div className="trust-icon-box"><Headphones size={20} /></div>
                  <div className="trust-item-copy">
                    <b>Layanan Ramah</b>
                    <small>&amp; Responsif</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Right overlay: Handwritten annotation with doodle curved arrow & pagination dots */}
            <div className="home-hero-right-overlay">
              <div className="hero-doodle-annotation">
                <div className="hero-doodle-text">
                  <span>Buket Bunga</span>
                  <span>Eksklusif ♡</span>
                </div>
                <svg
                  className="hero-doodle-arrow-svg"
                  width="76"
                  height="48"
                  viewBox="0 0 76 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M70 10 C 50 4, 25 14, 8 36"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M6 26 L 8 37 L 18 35"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div className="hero-dots-indicator" aria-hidden="true">
                <span className="hero-dot active" />
                <span className="hero-dot" />
                <span className="hero-dot" />
                <span className="hero-dot" />
              </div>
            </div>
          </div>
        </section>

        {/* FLOATING CATEGORY BAR */}
        <section className="home-floating-category-bar" aria-label="Kategori Pilihan">
          <div className="home-shell">
            <div className="category-bar-inner">
              <div className="category-bar-brand">
                <span className="category-flower-icon" aria-hidden="true">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M16 6C17.5 9 17.5 13 16 16C14.5 13 14.5 9 16 6Z" fill="#b5005d" />
                    <path d="M16 26C17.5 23 17.5 19 16 16C14.5 19 14.5 23 16 26Z" fill="#b5005d" />
                    <path d="M6 16C9 17.5 13 17.5 16 16C13 14.5 9 14.5 6 16Z" fill="#b5005d" />
                    <path d="M26 16C23 17.5 19 17.5 16 16C19 14.5 23 14.5 26 16Z" fill="#b5005d" />
                    <path d="M8.9 8.9C11.5 11 14 13.5 16 16C13.5 14 11 11.5 8.9 8.9Z" fill="#db2777" />
                    <path d="M23.1 23.1C20.5 21 18 18.5 16 16C18.5 18 21 20.5 23.1 23.1Z" fill="#db2777" />
                    <path d="M8.9 23.1C11 20.5 13.5 18 16 16C14 18.5 11.5 21 8.9 23.1Z" fill="#db2777" />
                    <path d="M23.1 8.9C21 11.5 18.5 14 16 16C18 13.5 20.5 11 23.1 8.9Z" fill="#db2777" />
                    <circle cx="16" cy="16" r="3.2" fill="#ffffff" />
                  </svg>
                </span>
                <div className="category-bar-label">
                  <strong>Kategori</strong>
                  <span>Pilihan</span>
                </div>
                <div className="category-bar-sep" aria-hidden="true" />
              </div>

              <div className="category-bar-items">
                {FLOATING_CATEGORIES.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      className="category-pill-card"
                    >
                      <div className="category-avatar-circle">
                        <Icon size={22} className="category-avatar-icon" />
                      </div>
                      <span className="category-pill-name">{item.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* BEST SELLER SECTION */}
        <section className="home-section home-bestseller" aria-labelledby="bestseller-title">
          <div className="home-shell">
            <div className="bestseller-header">
              <div className="bestseller-title-group">
                <span className="bestseller-badge-icon" aria-hidden="true">
                  <Award size={24} />
                </span>
                <h2 id="bestseller-title" className="bestseller-heading">
                  Best Seller
                </h2>
                <span className="bestseller-divider" aria-hidden="true">|</span>
                <span className="bestseller-sub">Produk favorit pelanggan</span>
              </div>
              <a href="#koleksi" className="bestseller-link-all">
                Lihat Semua <ArrowRight size={15} />
              </a>
            </div>

            <div className="bestseller-grid">
              {bestSellerProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  badge="Terlaris"
                  priority
                />
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
