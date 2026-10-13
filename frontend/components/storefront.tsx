"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Award,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Edit3,
  Gift,
  Info,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Palette,
  Phone,
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

  // ─── Interactive Section States (No AI Slop) ───
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0] ?? "2025-05-18";
  });
  const [selectedBoardType, setSelectedBoardType] = useState(
    "Akrilik Transparan Elegan (Ukuran 120x80)"
  );
  const [simulatorResult, setSimulatorResult] = useState<{
    date: string;
    type: string;
  } | null>(null);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [legalModal, setLegalModal] = useState<"privacy" | "terms" | "faq" | null>(null);

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

  const formatIndoDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr + "T00:00:00");
      return d.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const handleCopyCoupon = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText("SELIBLOOM");
      }
    } catch {
      // ignore fallback
    }
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2500);
  };

  const handleLockSimulator = (e: React.FormEvent) => {
    e.preventDefault();
    setSimulatorResult({
      date: selectedDate,
      type: selectedBoardType,
    });
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

        {/* ─── SECTION 4: INOVASI KHUSUS RENTAL PAPAN UCAPAN MODERN ─── */}
        <section
          className="rental-showcase-section"
          id="rental-board-showcase"
          aria-label="Rental Papan Ucapan Modern"
        >
          <div className="rental-ambient-glow" aria-hidden="true" />
          <div className="shell">
            <div className="rental-showcase-card">
              <div className="rental-grid">
                {/* Left Column: Rental Feature Overview & Simulator */}
                <div>
                  <div className="rental-pill-badge">
                    <ShieldCheck size={16} />
                    <span>Solusi Papan Bunga Estetik Tanpa Limbah Gabus</span>
                  </div>

                  <h2 className="rental-title">
                    Sewa Papan Ucapan Elegan Tanpa Khawatir{" "}
                    <span className="accent-italic">Bentrok Tanggal</span>
                  </h2>

                  <p className="rental-desc">
                    Teknologi <strong>Soft-Locking 2 Jam</strong> kami menjamin
                    unit papan akrilik mewah yang Anda pilih tidak akan direbut
                    pelanggan lain selama proses pembayaran DP berlangsung.
                  </p>

                  {/* Interactive Date Checker Simulator Card */}
                  <div className="simulator-box">
                    <div className="simulator-header">
                      <h3>Cek Ketersediaan Soft-Lock</h3>
                      <span className="avail-badge">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        Tersedia 8 Unit untuk Akhir Pekan Ini
                      </span>
                    </div>

                    <form
                      onSubmit={handleLockSimulator}
                      className="simulator-form-grid"
                    >
                      <div className="form-field-group">
                        <label htmlFor="sim-event-date">Pilih Tanggal Acara</label>
                        <input
                          id="sim-event-date"
                          type="date"
                          value={selectedDate}
                          onChange={(e) => {
                            setSelectedDate(e.target.value);
                            setSimulatorResult(null);
                          }}
                          className="simulator-input"
                          required
                        />
                      </div>

                      <div className="form-field-group">
                        <label htmlFor="sim-board-type">Tipe Desain</label>
                        <select
                          id="sim-board-type"
                          value={selectedBoardType}
                          onChange={(e) => {
                            setSelectedBoardType(e.target.value);
                            setSimulatorResult(null);
                          }}
                          className="simulator-select"
                        >
                          <option value="Akrilik Transparan Elegan (Ukuran 120x80)">
                            Akrilik Transparan Elegan (Ukuran 120x80)
                          </option>
                          <option value="Arch Modern Wooden Frame (Ukuran 180x90)">
                            Arch Modern Wooden Frame (Ukuran 180x90)
                          </option>
                          <option value="Velvet Stand Kembar (VIP Dual Board)">
                            Velvet Stand Kembar (VIP Dual Board)
                          </option>
                        </select>
                      </div>

                      <button type="submit" className="btn-lock-unit">
                        <CheckCircle2 size={16} />
                        <span>Amankan Unit</span>
                      </button>
                    </form>

                    {/* Interactive Feedback State */}
                    {simulatorResult && (
                      <div className="simulator-feedback">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontWeight: 750,
                          }}
                        >
                          <CheckCircle2 size={18} className="text-emerald-600" />
                          <span>
                            Slot Siap Diamankan untuk{" "}
                            {formatIndoDate(simulatorResult.date)}!
                          </span>
                        </div>
                        <p
                          style={{
                            margin: "4px 0 10px",
                            fontSize: 12.5,
                            color: "#166534",
                          }}
                        >
                          Unit: <strong>{simulatorResult.type}</strong>. Sistem
                          soft-lock 2 jam akan otomatis mengunci slot begitu
                          checkout dikonfirmasi.
                        </p>
                        <div className="simulator-feedback-actions">
                          <a
                            href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                              `Halo Seli Florist, saya ingin amankan rental ${simulatorResult.type} untuk tanggal acara ${simulatorResult.date} (${formatIndoDate(simulatorResult.date)}). Mohon info prosedur soft-lock 2 jam & DP 50%-nya ya.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-fb-wa"
                          >
                            <MessageCircle size={14} /> Amankan via WhatsApp Florist
                          </a>
                          <button
                            type="button"
                            className="btn-fb-catalog"
                            onClick={() => {
                              setCategory("papan-ucapan");
                              document
                                .getElementById("koleksi")
                                ?.scrollIntoView({ behavior: "smooth" });
                            }}
                          >
                            Lihat Katalog Papan
                          </button>
                        </div>
                      </div>
                    )}

                    <p className="simulator-footer-note">
                      <Info size={14} className="text-[#a94065] shrink-0" />
                      Harga sewa sudah termasuk kustom nama/tulisan, standing
                      kayu kokoh, dan bongkar-pasang tim Seli Florist.
                    </p>
                  </div>

                  {/* 3 Langkah Sewa */}
                  <div className="rental-steps-row">
                    <div className="rental-step-col">
                      <span className="step-num-big">01</span>
                      <span className="step-heading">Pilih Jadwal</span>
                      <span className="step-subtext">
                        Tentukan tipe standing &amp; tanggal resepsi / acara.
                      </span>
                    </div>
                    <div className="rental-step-col">
                      <span className="step-num-big">02</span>
                      <span className="step-heading">Kunci DP 50%</span>
                      <span className="step-subtext">
                        Sistem mengunci unit otomatis bebas double booking.
                      </span>
                    </div>
                    <div className="rental-step-col">
                      <span className="step-num-big">03</span>
                      <span className="step-heading">Bebas Repot</span>
                      <span className="step-subtext">
                        Pelunasan H-1. Tim kami antar, pasang, dan jemput kembali.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Visual Demonstration & Floating Soft-Lock Badge */}
                <div>
                  <div className="visual-showcase-box">
                    <Image
                      src="/images/products/papan-ucapan-akrilik.jpg"
                      alt="Chic transparent wedding welcome board with white calligraphy and blooming pastel garden roses, stood on an art easel at an indoor luxury hotel foyer"
                      fill
                      sizes="(max-width: 1024px) 100vw, 40vw"
                      className="object-cover"
                    />

                    {/* Floating Soft-Lock Status Badge UI */}
                    <div className="floating-softlock-badge">
                      <div className="badge-top-row">
                        <div className="badge-status-title">
                          <Lock size={16} className="text-emerald-600" />
                          <span>Slot Terkunci Aman</span>
                        </div>
                        <span className="badge-tag-pill">Unit Terproteksi</span>
                      </div>
                      <div className="softlock-progress-track">
                        <div className="softlock-progress-bar" />
                      </div>
                      <p>
                        Soft-lock aktif selama 2 jam setelah checkout untuk
                        menyelesaikan transfer DP.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 5: CARA KERJA & SISTEM PEMBAYARAN 2 TAHAP ─── */}
        <section
          className="workflow-section"
          aria-label="Cara Kerja dan Sistem Pembayaran"
        >
          <div className="shell">
            <div className="workflow-header">
              <span className="workflow-eyebrow">Transparansi Layanan</span>
              <h2>Cara Kerja &amp; Sistem Pembayaran 2 Tahap</h2>
              <p>
                Pesan bunga dan rental tanpa cemas. Transaksi transparan dengan
                bukti foto sebelum pesanan diberangkatkan.
              </p>
            </div>

            {/* 4 Stepper Cards */}
            <div className="workflow-grid">
              {/* Step 1 */}
              <div className="workflow-card">
                <div>
                  <div className="step-num-circle">1</div>
                  <h3>Pilih Bunga &amp; Kustomisasi Pesan</h3>
                  <p>
                    Tentukan buket atau jenis papan. Tulis kartu ucapan khusus dan
                    pilih warna pita satin sesuai selera Anda.
                  </p>
                </div>
                <div className="workflow-card-tag">
                  <Edit3 size={15} />
                  <span>Kustomisasi Gratis</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="workflow-card">
                <div>
                  <div className="step-num-circle">2</div>
                  <h3>Bayar DP 50% (Batas Waktu 2 Jam)</h3>
                  <p>
                    Cukup bayar setengahnya via Virtual Account (BCA/Mandiri)
                    atau QRIS DOKU terverifikasi otomatis.
                  </p>
                </div>
                <div className="workflow-card-tag">
                  <Clock size={15} />
                  <span>Batas Waktu 2 Jam</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="workflow-card">
                <div>
                  <div className="step-num-circle">3</div>
                  <h3>Proses Perangkaian &amp; Foto Hasil</h3>
                  <p>
                    Florist merangkai dengan teliti. Sebelum dikirim, admin
                    mengirimkan foto pratinjau melalui WhatsApp.
                  </p>
                </div>
                <div className="workflow-card-tag success">
                  <Camera size={15} />
                  <span>Konfirmasi Pratinjau</span>
                </div>
              </div>

              {/* Step 4 */}
              <div className="workflow-card">
                <div>
                  <div className="step-num-circle">4</div>
                  <h3>Pelunasan 50% &amp; Pengiriman</h3>
                  <p>
                    Selesaikan sisa pembayaran, lalu kurir khusus florist mobil
                    ber-AC mengantar aman sampai di tujuan.
                  </p>
                </div>
                <div className="workflow-card-tag">
                  <Truck size={15} />
                  <span>Kurir Berpendingin</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 6: BANNER PROMO & TESTIMONI PELANGGAN ─── */}
        <section
          className="promo-testimonials-section"
          aria-label="Promo dan Ulasan Pelanggan"
        >
          <div className="shell">
            {/* Interactive Voucher Promo Banner */}
            <div className="promo-banner-card">
              {/* Petals SVG backdrop */}
              <svg
                className="promo-petals-svg"
                fill="currentColor"
                height="320"
                viewBox="0 0 200 200"
                width="320"
                aria-hidden="true"
              >
                <circle cx="100" cy="40" r="35" />
                <circle cx="160" cy="100" r="35" />
                <circle cx="100" cy="160" r="35" />
                <circle cx="40" cy="100" r="35" />
                <circle cx="100" cy="100" r="25" />
              </svg>

              <div className="promo-banner-inner">
                <div className="promo-text-content">
                  <span className="promo-pill-label">
                    Penawaran Musim Wisuda &amp; Hari Spesial
                  </span>
                  <h2>Diskon 10% untuk Pre-Order Wisuda &amp; Hari Ibu</h2>
                  <p>
                    Pesan lebih awal untuk mengamankan slot perangkai utama kami
                    serta menjamin kesegaran bunga mawar pilihan.
                  </p>
                </div>

                {/* Promo Code Card */}
                <div className="promo-code-card">
                  <small>Gunakan Kode Kupon</small>
                  <div className="coupon-display-code">SELIBLOOM</div>
                  <button
                    type="button"
                    onClick={handleCopyCoupon}
                    className={`btn-copy-code ${copiedCoupon ? "copied" : ""}`}
                  >
                    {copiedCoupon ? (
                      <>
                        <Check size={16} />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span>Salin Kode</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Testimoni Pelanggan */}
            <div>
              <div className="testimonials-luxury-header">
                <span className="testi-eyebrow">Ulasan Terverifikasi</span>
                <h2>Kisah Manis Pelanggan Seli</h2>
              </div>

              <div className="testimonials-luxury-grid">
                {/* Review 1 */}
                <div className="testimonial-luxury-card">
                  <div>
                    <div className="testi-stars-row">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={15} fill="currentColor" />
                      ))}
                    </div>
                    <p className="testi-quote-body">
                      &ldquo;Bunganya wangi dan segarnya awet sampai 5 hari di vas!
                      Sistem DP 50%-nya sangat meringankan saat persiapan
                      tunangan saya. Foto preview via WA juga sangat jelas.&rdquo;
                    </p>
                  </div>
                  <div className="testi-author-row">
                    <div className="testi-monogram-avatar avatar-ap">AP</div>
                    <div className="testi-author-meta">
                      <strong>Annisa Pratista</strong>
                      <small>Pembeli Blush Serenade Bouquet</small>
                    </div>
                  </div>
                </div>

                {/* Review 2 */}
                <div className="testimonial-luxury-card">
                  <div>
                    <div className="testi-stars-row">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={15} fill="currentColor" />
                      ))}
                    </div>
                    <p className="testi-quote-body">
                      &ldquo;Rental papan akriliknya aesthetic parah! Beda jauh
                      sama papan bunga gabus biasa. Tamu-tamu kafe saya saat grand
                      opening pada foto di depan papannya.&rdquo;
                    </p>
                  </div>
                  <div className="testi-author-row">
                    <div className="testi-monogram-avatar avatar-db">DB</div>
                    <div className="testi-author-meta">
                      <strong>Dimas Bagaskara</strong>
                      <small>Penyewa Royal Grand Celebration</small>
                    </div>
                  </div>
                </div>

                {/* Review 3 */}
                <div className="testimonial-luxury-card">
                  <div>
                    <div className="testi-stars-row">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={15} fill="currentColor" />
                      ))}
                    </div>
                    <p className="testi-quote-body">
                      &ldquo;Pengiriman tepat waktu ke gedung wisuda UI Salemba.
                      Kurirnya ramah dan mobil ber-AC jadi bunganya sama sekali
                      nggak layu terkena panas terik siang.&rdquo;
                    </p>
                  </div>
                  <div className="testi-author-row">
                    <div className="testi-monogram-avatar avatar-cw">CW</div>
                    <div className="testi-author-meta">
                      <strong>Clarissa Wijaya</strong>
                      <small>Pembeli Pastel Dream Deluxe</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── QUICK FLOATING CONSULTATION PILL ─── */}
        <a
          href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
            "Halo Seli Florist, saya ingin konsultasi rangkaian bunga & ketersediaan rental papan."
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="floating-wa-pill"
          aria-label="Konsultasi Desain Florist via WhatsApp"
        >
          <MessageCircle size={18} />
          <span className="hidden sm:inline">Konsultasi Desain Florist</span>
          <span className="sm:hidden">Chat Florist</span>
        </a>
      </main>

      {/* ─── BOUTIQUE FOOTER ─── */}
      <footer className="boutique-footer">
        <div className="shell">
          <div className="footer-top-grid">
            {/* Col 1: Brand Info */}
            <div className="footer-col">
              <h3 className="footer-brand-title">Seli Florist</h3>
              <p>
                Bespoke floral design studio untuk buket mewah, bridal styling, dan
                rental papan ucapan akrilik elegan di setiap perayaan berharga Anda.
              </p>
              <div className="footer-hours-box">
                <strong>Jam Operasional:</strong>
                <span>Setiap Hari, 08.00 - 21.00 WIB</span>
              </div>
            </div>

            {/* Col 2: Layanan Pelanggan */}
            <div className="footer-col">
              <h4 className="footer-col-heading">Layanan Pelanggan</h4>
              <div className="footer-contact-item">
                <MessageCircle size={18} />
                <div className="contact-meta-wrap">
                  <small>WhatsApp CS Resmi</small>
                  <a
                    href={`https://wa.me/${waNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    +62 895-1788-0077
                  </a>
                </div>
              </div>
              <div className="footer-contact-item">
                <Mail size={18} />
                <div className="contact-meta-wrap">
                  <small>Email Pertanyaan</small>
                  <span>halo@seliflorist.com</span>
                </div>
              </div>
            </div>

            {/* Col 3: Studio & Alamat */}
            <div className="footer-col">
              <h4 className="footer-col-heading">Studio &amp; Alamat</h4>
              <div className="footer-contact-item">
                <MapPin size={18} />
                <div className="contact-meta-wrap">
                  <span>
                    Jl. Melati Indah No. 42, Senopati, Kebayoran Baru, Jakarta Selatan 12190
                  </span>
                </div>
              </div>
              <div>
                <small
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    color: "#776a70",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Opsi Pengiriman Cepat
                </small>
                <div className="footer-delivery-pills">
                  <span className="footer-pill-tag">
                    Instant Courier (Grab / Gojek)
                  </span>
                  <span className="footer-pill-tag">
                    Kurir Khusus Florist (Mobil Ber-AC)
                  </span>
                </div>
              </div>
            </div>

            {/* Col 4: Metode Pembayaran & Garansi */}
            <div className="footer-col">
              <h4 className="footer-col-heading">Metode Pembayaran</h4>
              <p style={{ fontSize: 12.5, margin: 0 }}>
                Transaksi terverifikasi instan dengan gerbang pembayaran terpercaya:
              </p>
              <div className="footer-payment-badges">
                <span className="payment-badge">BCA Virtual Account</span>
                <span className="payment-badge">Mandiri Livin</span>
                <span className="payment-badge qris">QRIS DOKU</span>
              </div>
              <div className="fresh-guarantee-box">
                <strong>Garansi Bunga Segar</strong>
                <p>
                  100% bunga berkualitas segar dari perkebunan pilihan dengan
                  pendingin suhu khusus.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Bottom Bar */}
          <div className="footer-bottom-bar">
            <p style={{ margin: 0 }}>
              © {new Date().getFullYear()} Seli Florist. Hak Cipta Dilindungi.
              Crafting delicate moments with grace.
            </p>
            <div className="footer-bottom-links">
              <button type="button" onClick={() => setLegalModal("privacy")}>
                Kebijakan Privasi
              </button>
              <button type="button" onClick={() => setLegalModal("terms")}>
                Syarat &amp; Ketentuan
              </button>
              <button type="button" onClick={() => setLegalModal("faq")}>
                FAQ &amp; Bantuan
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── INTERACTIVE LEGAL & FAQ MODALS ─── */}
      {legalModal && (
        <div
          className="legal-modal-backdrop"
          onClick={() => setLegalModal(null)}
          role="presentation"
        >
          <div
            className="legal-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="legal-modal-close"
              onClick={() => setLegalModal(null)}
              aria-label="Tutup dialog"
            >
              <X size={16} />
            </button>

            {legalModal === "privacy" && (
              <>
                <h3>Kebijakan Privasi Seli Florist</h3>
                <div className="legal-modal-content">
                  <p>
                    Privasi dan kerahasiaan Anda adalah prioritas utama kami. Kami
                    menghormati pesan personal dan data sensitif yang Anda
                    percayakan.
                  </p>
                  <h4>1. Penggunaan Data Pemesanan</h4>
                  <p>
                    Informasi nama, alamat pengiriman, dan nomor telepon penerima
                    hanya digunakan untuk keperluan pengiriman pesanan dan
                    konfirmasi pratinjau hasil rangkaian bunga via WhatsApp.
                  </p>
                  <h4>2. Keamanan Pembayaran Digital</h4>
                  <p>
                    Kami tidak menyimpan data perbankan sensitif. Seluruh transaksi
                    digital diproses secara aman melalui Virtual Account resmi
                    BCA, Mandiri, dan QRIS DOKU bersertifikasi Bank Indonesia.
                  </p>
                </div>
              </>
            )}

            {legalModal === "terms" && (
              <>
                <h3>Syarat &amp; Ketentuan Rental &amp; Bunga</h3>
                <div className="legal-modal-content">
                  <p>
                    Harap membaca ringkasan ketentuan sewa papan ucapan dan pesanan
                    bunga di Seli Florist:
                  </p>
                  <h4>1. Sistem DP 50% &amp; Soft-Locking 2 Jam</h4>
                  <p>
                    Slot tanggal dan unit papan akrilik dikunci eksklusif selama 2
                    jam setelah pesanan dibuat untuk memberi waktu penyelesaian
                    transfer DP 50%.
                  </p>
                  <h4>2. Konfirmasi Pratinjau Foto</h4>
                  <p>
                    Florist akan mengirimkan foto dokumentasi hasil rangkaian via
                    WhatsApp sebelum kurir berangkat menuju lokasi acara.
                  </p>
                  <h4>3. Durasi Rental &amp; Pengambilan Unit</h4>
                  <p>
                    Waktu sewa standar papan akrilik adalah 24 jam. Tim kami
                    bertanggung jawab penuh atas pengantaran, instalasi, dan
                    penjemputan unit tanpa limbah gabus.
                  </p>
                </div>
              </>
            )}

            {legalModal === "faq" && (
              <>
                <h3>FAQ &amp; Bantuan</h3>
                <div className="legal-modal-content">
                  <h4>Berapa lama bunga segar Seli Florist bertahan?</h4>
                  <p>
                    Dengan pemotongan batang diagonal dan pemberian air dingin
                    bersih setiap hari, buket mawar segar kami mampu bertahan
                    hingga 4-6 hari di suhu ruangan.
                  </p>
                  <h4>Bisa pesan dadakan di hari yang sama (Same-day)?</h4>
                  <p>
                    Bisa! Kami menyediakan opsi pengiriman Instant Courier (Grab /
                    Gojek) untuk katalog ready-stock dengan batas order pukul 15.00
                    WIB.
                  </p>
                  <h4>Bagaimana proses kustom tulisan papan akrilik?</h4>
                  <p>
                    Setelah DP dikonfirmasi, desainer grafis kami akan membuatkan
                    layout mockup tulisan nama &amp; logo ucapan untuk Anda setujui
                    terlebih dahulu sebelum dicetak.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
