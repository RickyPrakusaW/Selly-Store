"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Award,
  Gift,
  MessageCircle,
  Palette,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  X,
} from "lucide-react";
import Image from "next/image";
import { useDeferredValue, useEffect, useState } from "react";
import { fetchProducts } from "@/lib/api";
import { subscribeToCatalogChanges } from "@/lib/catalog-events";
import { useSeliStore } from "@/lib/store";
import type { Category, Product } from "@/lib/types";
import { ProductCard } from "./product-card";

const OCCASIONS = [
  { label: "Semua Momen", query: "" },
  { label: "🎓 Wisuda", query: "wisuda" },
  { label: "🎂 Ulang Tahun", query: "ulang tahun" },
  { label: "💍 Pernikahan", query: "pernikahan" },
  { label: "🏢 Grand Opening", query: "opening" },
  { label: "💖 Anniversary", query: "anniversary" },
  { label: "🕊️ Duka Cita", query: "duka" },
];

export function Storefront({
  initialProducts,
  categories,
}: Readonly<{ initialProducts: Product[]; categories: Category[] }>) {
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const queryClient = useQueryClient();
  const searchOpen = useSeliStore((state) => state.searchOpen);
  const setSearchOpen = useSeliStore((state) => state.setSearchOpen);

  const { data = initialProducts, isFetching } = useQuery({
    queryKey: ["products", deferredSearch, category],
    queryFn: () => fetchProducts(deferredSearch, category),
    initialData: !deferredSearch && !category ? initialProducts : undefined,
    staleTime: 0,
    refetchInterval: 3000,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
  });

  useEffect(
    () =>
      subscribeToCatalogChanges(() => {
        void queryClient.invalidateQueries({
          queryKey: ["products"],
          refetchType: "active",
        });
      }),
    [queryClient],
  );

  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "6289517880077";
  const waHeroLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    "Halo Seli Florist, saya ingin konsultasi pemesanan buket bunga / kado / papan ucapan.",
  )}`;

  const handleCategoryCardClick = (slug: string) => {
    setCategory(slug);
    setSearch("");
    document.getElementById("koleksi")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleOccasionClick = (query: string) => {
    setSearch(query);
    document.getElementById("koleksi")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {searchOpen && (
        <div className="search-overlay">
          <div className="search-panel">
            <Search />
            <input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari buket, kado, atau papan ucapan…"
              aria-label="Pencarian produk"
            />
            <button
              onClick={() => setSearchOpen(false)}
              aria-label="Tutup pencarian"
            >
              <X />
            </button>
          </div>
        </div>
      )}

      {/* Top Announcement Ribbon */}
      <div className="announcement-ribbon" role="region" aria-label="Pengumuman">
        <div className="announcement-inner shell">
          <span>✨ Pengiriman Same-Day Tersedia</span>
          <span className="dot" aria-hidden="true">•</span>
          <span>🌸 100% Bunga Segar Pilihan</span>
          <span className="dot" aria-hidden="true">•</span>
          <span>💌 Gratis Kartu Ucapan Eksklusif</span>
          <span className="dot" aria-hidden="true">•</span>
          <span>🌿 Garansi Kesegaran Terjamin</span>
        </div>
      </div>

      <main>
        {/* ─── Hero Section ─── */}
        <section className="hero shell">
          <div className="hero-copy">
            <h1>
              Bunga Segar untuk Setiap <em>Cerita Indah.</em>
            </h1>
            <p className="hero-subtitle">
              Rangkaian buket bunga segar grade-A, hampers kado eksklusif, dan
              sewa papan ucapan estetik. Dibuat dengan penuh cinta untuk
              menyempurnakan setiap momen berharga Anda.
            </p>
            <div className="hero-actions-wrap">
              <a href="#koleksi" className="primary-button">
                Jelajahi Koleksi <ArrowRight size={17} />
              </a>
              <a
                href={waHeroLink}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-wa-btn"
              >
                <MessageCircle size={18} />
                Konsultasi WhatsApp
              </a>
            </div>
            <div className="hero-trust-bar">
              <div className="trust-item">
                <div className="trust-icon-box">
                  <Star size={14} />
                </div>
                <span>
                  <strong>4.9/5</strong> (1.200+ Ulasan)
                </span>
              </div>
              <div className="trust-item">
                <div className="trust-icon-box">
                  <Truck size={14} />
                </div>
                <span>
                  <strong>Same-Day</strong> Pengiriman Cepat
                </span>
              </div>
              <div className="trust-item">
                <div className="trust-icon-box">
                  <ShieldCheck size={14} />
                </div>
                <span>
                  <strong>100% Segar</strong> Alami
                </span>
              </div>
            </div>
          </div>

          <div className="hero-visual-container">
            <div className="hero-visual-frame">
              <Image
                src="/images/hero-bouquet.jpg"
                alt="Buket Bunga Segar Eksklusif Seli Florist"
                width={500}
                height={560}
                priority
                className="hero-visual-img"
              />
            </div>

            {/* Floating Glass Badges */}
            <div className="hero-floating-badge badge-top-right">
              <div className="badge-icon">
                <Sparkles size={18} />
              </div>
              <div className="badge-text">
                <strong>Handcrafted with Love</strong>
                <small>Dirangkai Florist Ahli</small>
              </div>
            </div>

            <div className="hero-floating-badge badge-bottom-left">
              <div className="badge-icon">
                <Award size={18} />
              </div>
              <div className="badge-text">
                <strong>Fresh Daily Guarantee</strong>
                <small>Dipetik & Dirangkai Hari Ini</small>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Curated Category Visual Showcase ─── */}
        <section
          className="categories-showcase-section shell"
          aria-label="Kategori Pilihan"
        >
          <div className="categories-showcase-header">
            <h2>Temukan Inspirasi Terbaik Anda</h2>
            <p>
              Pilih kategori yang tepat untuk hadiah kelulusan, ucapan selamat,
              pernikahan, maupun ungkapan kasih sayang.
            </p>
          </div>

          <div className="category-cards-grid">
            {/* Card 1: Buket Bunga */}
            <div
              className="category-feature-card"
              role="button"
              tabIndex={0}
              onClick={() => handleCategoryCardClick("bunga")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleCategoryCardClick("bunga");
              }}
            >
              <Image
                src="/images/hero-bouquet.jpg"
                alt="Buket Bunga Segar"
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="category-feature-img"
              />
              <div className="category-card-overlay">
                <h3>Buket Bunga Segar</h3>
                <p>
                  Mawar, tulip, lili, dan baby breath mekar sempurna dengan
                  wrapping elegan.
                </p>
                <span className="category-card-explore">
                  Lihat Koleksi <ArrowRight size={13} />
                </span>
              </div>
            </div>

            {/* Card 2: Kado & Hampers */}
            <div
              className="category-feature-card"
              role="button"
              tabIndex={0}
              onClick={() => handleCategoryCardClick("kado")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleCategoryCardClick("kado");
              }}
            >
              <Image
                src="/images/category-hampers.jpg"
                alt="Kado & Hampers Eksklusif"
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="category-feature-img"
              />
              <div className="category-card-overlay">
                <h3>Kado & Hampers Eksklusif</h3>
                <p>
                  Paket bingkisan mewah dengan cokelat, boneka, dan scented
                  candle istimewa.
                </p>
                <span className="category-card-explore">
                  Lihat Koleksi <ArrowRight size={13} />
                </span>
              </div>
            </div>

            {/* Card 3: Papan Ucapan */}
            <div
              className="category-feature-card"
              role="button"
              tabIndex={0}
              onClick={() => handleCategoryCardClick("papan_ucapan")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  handleCategoryCardClick("papan_ucapan");
              }}
            >
              <Image
                src="/images/category-board.jpg"
                alt="Sewa Papan Ucapan & Standing Flower"
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="category-feature-img"
              />
              <div className="category-card-overlay">
                <h3>Papan Ucapan Modern</h3>
                <p>
                  Sewa papan akrilik estetik & standing flower untuk grand
                  opening, wisuda, dan duka cita.
                </p>
                <span className="category-card-explore">
                  Lihat Koleksi <ArrowRight size={13} />
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Product Catalog Section (Card Preserved) ─── */}
        <section className="collection shell" id="koleksi">
          <div className="section-heading">
            <div>
              <h2>
                {category
                  ? categories.find((c) => c.slug === category)?.name ??
                    "Katalog Produk"
                  : search
                  ? `Koleksi Momen "${search}"`
                  : "Semua Rangkaian Bunga & Kado"}
              </h2>
            </div>
            <span>{isFetching ? "Memuat…" : `${data.length} produk`}</span>
          </div>

          {/* Unified Luxury Filter Card */}
          <div className="catalog-filter-card" role="search" aria-label="Filter Katalog Produk">
            {/* Primary Category Segmented Bar */}
            <div className="category-segmented-bar" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={!category}
                className={`segment-btn ${!category ? "active" : ""}`}
                onClick={() => setCategory("")}
              >
                Semua
              </button>
              {categories.map((item) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={category === item.slug}
                  className={`segment-btn ${category === item.slug ? "active" : ""}`}
                  key={item.id}
                  onClick={() => setCategory(item.slug)}
                >
                  {item.name}
                </button>
              ))}
            </div>

            {/* Occasion Quick Chips */}
            <div className="occasions-sub-bar">
              <div className="occasions-sub-header">
                <span>
                  <Sparkles size={12} /> Pilih Momen Spesial:
                </span>
                {(search || category) && (
                  <button
                    type="button"
                    className="reset-search-btn"
                    onClick={() => {
                      setSearch("");
                      setCategory("");
                    }}
                  >
                    Reset Filter <X size={11} />
                  </button>
                )}
              </div>
              <div className="occasions-scroll-wrap">
                {OCCASIONS.map((item) => {
                  const isActive = search.toLowerCase() === item.query.toLowerCase();
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className={`occasion-chip ${isActive ? "active" : ""}`}
                      onClick={() => handleOccasionClick(item.query)}
                      aria-pressed={isActive}
                    >
                      {item.label}
                      {isActive && <X size={11} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {data.length ? (
            <div className="product-grid">
              {data.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={idx < 4}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Search />
              <h3>Belum ada produk yang cocok</h3>
              <p>
                Coba gunakan kata kunci lain atau pilih kategori & momen
                tersedia di atas.
              </p>
              <button
                type="button"
                className="secondary-button"
                style={{ marginTop: 12 }}
                onClick={() => {
                  setCategory("");
                  setSearch("");
                }}
              >
                Reset Filter
              </button>
            </div>
          )}
        </section>

        {/* ─── The Boutique Difference (Features) ─── */}
        <section className="features-section shell" aria-label="Keunggulan Kami">
          <div className="features-header">
            <h2>Mengapa Memilih Selly Florist?</h2>
            <p>
              Kami berkomitmen menghadirkan kualitas terbaik pada setiap tangkai
              bunga dan kemasan hadiah yang Anda percayakan.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-box">
              <div className="feature-box-head">
                <div className="feature-icon-wrap">
                  <Sparkles size={20} />
                </div>
                <h3>100% Bunga Segar Pilihan</h3>
              </div>
              <p>
                Bunga dipetik langsung dari perkebunan terbaik setiap pagi,
                menjamin keharuman dan kesegaran lebih lama.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-box-head">
                <div className="feature-icon-wrap">
                  <Palette size={20} />
                </div>
                <h3>Desain Custom & Personal</h3>
              </div>
              <p>
                Bebas memilih tema warna bunga, jenis wrapping kertas premium,
                hingga pita sesuai konsep yang Anda inginkan.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-box-head">
                <div className="feature-icon-wrap">
                  <Gift size={20} />
                </div>
                <h3>Gratis Kartu Ucapan Eksklusif</h3>
              </div>
              <p>
                Setiap pembelian disertai greeting card elegan dengan pesan
                pribadi yang dicetak rapi dan dimasukkan amplop segel.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-box-head">
                <div className="feature-icon-wrap">
                  <Truck size={20} />
                </div>
                <h3>Pengiriman Aman & Tepat Waktu</h3>
              </div>
              <p>
                Kurir berpengalaman dengan kotak pelindung khusus memastikan
                bunga tiba dalam kondisi segar tanpa cacat.
              </p>
            </div>
          </div>
        </section>

        {/* ─── Custom Order WhatsApp Banner ─── */}
        <section className="shell" aria-label="Pesanan Khusus">
          <div className="custom-order-banner">
            <div className="custom-banner-text">
              <h3>Punya Rangkaian Impian atau Konsep Khusus?</h3>
              <p>
                Konsultasikan budget, preferensi bunga favorit, atau kebutuhan
                dekorasi acara Anda langsung bersama tim florist ahli kami. Kami
                siap mewujudkan buket impian Anda.
              </p>
            </div>
            <a
              href={waHeroLink}
              target="_blank"
              rel="noopener noreferrer"
              className="custom-banner-btn"
            >
              <MessageCircle size={20} />
              Chat WhatsApp Florist
            </a>
          </div>
        </section>

        {/* ─── Customer Testimonials ─── */}
        <section className="testimonials-section shell" aria-label="Ulasan Pelanggan">
          <div className="testimonials-header">
            <h2>Apa Kata Pelanggan Kami</h2>
            <p>
              Kepuasan Anda dan senyum penerima adalah kebahagiaan terbesar kami.
            </p>
          </div>

          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testi-stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} fill="currentColor" />
                ))}
              </div>
              <p className="testi-text">
                &ldquo;Buket bunganya beneran wangi dan segerr banget!
                Wrapping-nya rapi dan keliatan mewah. Teman-teman wisuda pada
                muji buketnya. Pengiriman pagi-pagi sampai tepat waktu!&rdquo;
              </p>
              <div className="testi-author">
                <div className="testi-avatar">CS</div>
                <div className="testi-author-info">
                  <strong>Clarissa S.</strong>
                  <small>Wisuda UI • Buket Mawar Segar</small>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testi-stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} fill="currentColor" />
                ))}
              </div>
              <p className="testi-text">
                &ldquo;Sewa papan ucapan akriliknya modern banget, beda sama papan
                biasa yang jadul. Tulisan rapi dan standing flower-nya megah.
                Klien kantor kami sangat terkesan.&rdquo;
              </p>
              <div className="testi-author">
                <div className="testi-avatar">DP</div>
                <div className="testi-author-info">
                  <strong>Dimas Pratama</strong>
                  <small>Grand Opening Cafe • Sewa Papan Ucapan</small>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testi-stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} fill="currentColor" />
                ))}
              </div>
              <p className="testi-text">
                &ldquo;Pelayanan ramah banget dan floristnya sabar kasih
                rekomendasi paduan warna yang cocok buat anniversary. Pasanganku
                suka banget hampersnya. Makasih Selly Florist!&rdquo;
              </p>
              <div className="testi-author">
                <div className="testi-avatar">JN</div>
                <div className="testi-author-info">
                  <strong>Jessica N.</strong>
                  <small>Anniversary • Hampers & Buket Lili</small>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
