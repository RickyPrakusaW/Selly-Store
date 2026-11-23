import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarCheck,
  CheckCircle2,
  Handshake,
  HeartHandshake,
  MessageCircle,
  Sparkles,
  Store,
} from "lucide-react";
import { normalizeWhatsAppNumber } from "@/lib/phone-number";

export const metadata: Metadata = {
  title: "Partner With Us | Kemitraan & B2B Florist Surabaya",
  description:
    "Kolaborasi kemitraan eksklusif LICHARY Florist bersama Wedding Organizer, Event Planner, Venue Acara, dan Korporasi dengan harga khusus dan layanan prioritas di Surabaya.",
  alternates: {
    canonical: "/partner-with-us",
  },
};

export default function PartnerWithUsPage() {
  const waNumber = normalizeWhatsAppNumber(
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "6289517880077",
  );

  const whatsappMessage = encodeURIComponent(
    "Halo Tim Kemitraan LICHARY Florist, saya tertarik untuk mendiskusikan peluang kerja sama / kolaborasi kemitraan (Wedding Organizer / Corporate / Venue). Boleh minta informasi penawaran dan katalog kerja samanya?",
  );

  const whatsappUrl = `https://wa.me/${waNumber}?text=${whatsappMessage}`;

  return (
    <main className="partner-page">
      <div className="partner-shell">
        {/* Breadcrumbs */}
        <nav className="partner-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">
            <ArrowLeft size={14} /> Beranda
          </Link>
          <span className="sep">/</span>
          <span className="current">Partner With Us</span>
        </nav>

        {/* Hero Section */}
        <section className="partner-hero">
          <div className="partner-badge">
            <Sparkles size={14} /> Partnership & B2B Collaboration
          </div>
          <h1 className="partner-title">
            Tumbuh Bersama <span>LICHARY Florist</span>
          </h1>
          <p className="partner-desc">
            Kami membuka pintu kolaborasi strategis bagi Wedding Organizer,
            Event Planner, pengelola venue, dan korporasi untuk menghadirkan
            sentuhan floral premium di setiap momen istimewa.
          </p>
          <div className="partner-status-tag">
            <span className="partner-status-dot" />
            <span>Pendaftaran Kemitraan Aktif Dibuka</span>
          </div>
        </section>

        {/* Feature / Program Cards */}
        <section className="partner-grid">
          {/* Card 1: Wedding & Event Organizer */}
          <article className="partner-card">
            <div className="partner-card-icon">
              <HeartHandshake size={26} />
            </div>
            <h2 className="partner-card-title">Wedding & Event Organizer</h2>
            <p className="partner-card-desc">
              Solusi florist terpercaya untuk melengkapi acara pernikahan,
              tunangan, dan perayaan klien Anda dengan standar estetika tinggi.
            </p>
            <ul className="partner-card-benefits">
              <li>
                <CheckCircle2 size={16} />
                <span>Harga khusus B2B (Special Partner Rate)</span>
              </li>
              <li>
                <CheckCircle2 size={16} />
                <span>Prioritas kuota papan sewa & tanggal acara</span>
              </li>
              <li>
                <CheckCircle2 size={16} />
                <span>Jadwal antar & bongkar fleksibel di venue</span>
              </li>
            </ul>
          </article>

          {/* Card 2: Corporate & Business */}
          <article className="partner-card">
            <div className="partner-card-icon">
              <Building2 size={26} />
            </div>
            <h2 className="partner-card-title">Corporate & Bisnis</h2>
            <p className="partner-card-desc">
              Layanan apresiasi bisnis profesional untuk peresmian kantor,
              serah terima jabatan, hingga hampers eksklusif relasi perusahaan.
            </p>
            <ul className="partner-card-benefits">
              <li>
                <CheckCircle2 size={16} />
                <span>Faktur & invoice resmi untuk pelaporan instansi</span>
              </li>
              <li>
                <CheckCircle2 size={16} />
                <span>Custom logo perusahaan pada pita & papan ucapan</span>
              </li>
              <li>
                <CheckCircle2 size={16} />
                <span>Pemesanan berkala dengan dedicated account support</span>
              </li>
            </ul>
          </article>

          {/* Card 3: Venue, Hotel & Cafe */}
          <article className="partner-card">
            <div className="partner-card-icon">
              <Store size={26} />
            </div>
            <h2 className="partner-card-title">Venue & Hotel Partner</h2>
            <p className="partner-card-desc">
              Hadirkan keindahan floral di ballroom, restoran, atau lounge hotel
              Anda dengan program kolaborasi saling menguntungkan.
            </p>
            <ul className="partner-card-benefits">
              <li>
                <CheckCircle2 size={16} />
                <span>Komisi referensi menarik untuk setiap booking</span>
              </li>
              <li>
                <CheckCircle2 size={16} />
                <span>Paket bundel dekorasi floral & venue terpadu</span>
              </li>
              <li>
                <CheckCircle2 size={16} />
                <span>Maintenance & rotasi bunga segar berkala</span>
              </li>
            </ul>
          </article>
        </section>

        {/* CTA Banner */}
        <section className="partner-cta-box">
          <h2 className="partner-cta-title">
            Mari Wujudkan Kolaborasi Indah Bersama Kami
          </h2>
          <p className="partner-cta-subtitle">
            Halaman portal mitra interaktif sedang kami persiapkan. Saat ini, tim
            kemitraan kami siap berdiskusi langsung melalui WhatsApp untuk
            memberikan penawaran terbaik bagi bisnis Anda.
          </p>
          <div className="partner-cta-actions">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="partner-wa-btn"
            >
              <MessageCircle size={18} /> Hubungi Tim Kemitraan (WhatsApp)
            </a>
            <Link href="/" className="partner-secondary-btn">
              Kembali ke Beranda
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
