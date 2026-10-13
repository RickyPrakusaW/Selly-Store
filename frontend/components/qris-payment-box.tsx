"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  Info,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wallet,
} from "lucide-react";
import {
  ApiError,
  generateQrisPayment,
  fetchQrisPaymentStatus,
  simulateQrisPaymentSuccess,
  type QrisPaymentData,
} from "@/lib/api";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

interface QrisPaymentBoxProps {
  orderId: string;
  orderNumber: string;
  paymentType: "DP" | "FINAL";
  amount: number;
  onPaymentSuccess?: () => void;
}

/**
 * Official Vector SVG for QRIS Logo (Bank Indonesia Standard)
 */
function QrisOfficialLogo() {
  return (
    <svg
      height={28}
      viewBox="0 0 135 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="qris-brand-svg"
      aria-label="QRIS Logo"
    >
      {/* Q icon with inner finder pattern */}
      <rect x="2" y="2" width="20" height="20" rx="4" fill="white" />
      <rect x="5.5" y="5.5" width="13" height="13" rx="2" fill="#E11D48" />
      <rect x="8.5" y="8.5" width="7" height="7" fill="white" />
      <path
        d="M16 16L21 21"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* R */}
      <path
        d="M29 3H37C40.2 3 42.5 5 42.5 8C42.5 10.4 40.8 12 38.5 12.4L43 21H38.5L34.5 13.2H33V21H29V3ZM33 10.4H36.8C38.2 10.4 39.2 9.5 39.2 8.1C39.2 6.7 38.2 5.8 36.8 5.8H33V10.4Z"
        fill="white"
      />

      {/* I */}
      <rect x="47.5" y="3" width="4" height="18" rx="1" fill="white" />

      {/* S */}
      <path
        d="M58 17.5C59.3 18.3 61.2 19 63.3 19C65.8 19 67.2 17.8 67.2 16.1C67.2 13.2 58.4 13.5 58.4 8C58.4 5 61 3 65 3C67 3 69 3.6 70 4.5L68.8 7C67.7 6.3 66.2 5.8 64.8 5.8C62.6 5.8 61.6 6.8 61.6 8.1C61.6 10.8 70.4 10.6 70.4 16.2C70.4 19.4 67.6 21.4 63.2 21.4C61 21.4 58.8 20.6 57.2 19.4L58 17.5Z"
        fill="white"
      />

      {/* Tagline */}
      <text
        x="2"
        y="30"
        fill="white"
        fontSize="5.8"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="800"
        letterSpacing="0.04em"
      >
        QUICK RESPONSE CODE INDONESIAN STANDARD
      </text>
    </svg>
  );
}

/**
 * Official Vector SVG for GPN (Gerbang Pembayaran Nasional) Logo
 */
function GpnLogoSvg() {
  return (
    <svg
      height={24}
      viewBox="0 0 62 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="gpn-brand-svg"
      aria-label="GPN Logo"
    >
      <rect width="62" height="26" rx="5" fill="white" />
      <circle cx="12" cy="13" r="8" fill="#003D79" />
      <path d="M12 5C16.4 5 20 8.6 20 13L12 13V5Z" fill="#E11D48" />
      <text
        x="24"
        y="15"
        fill="#003D79"
        fontSize="10"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        letterSpacing="0.03em"
      >
        GPN
      </text>
      <text
        x="24"
        y="21"
        fill="#E11D48"
        fontSize="3.8"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="800"
      >
        NASIONAL
      </text>
    </svg>
  );
}

export function QrisPaymentBox({
  orderId,
  orderNumber,
  paymentType,
  amount,
  onPaymentSuccess,
}: QrisPaymentBoxProps) {
  const [qrisData, setQrisData] = useState<QrisPaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600); // 60 menit
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedInvoice, setCopiedInvoice] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<"banking" | "ewallet">(
    "banking",
  );
  const qrRef = useRef<HTMLDivElement>(null);

  // 0. Load DOKU Checkout JS script for Pop-up Modal Overlay Mode
  useEffect(() => {
    const scriptSrc = "https://sandbox.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js";
    if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
      const script = document.createElement("script");
      script.src = scriptSrc;
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  // Buka DOKU Checkout dalam Pop-up Modal (Jokul Checkout Overlay)
  const handleOpenDokuCheckout = () => {
    if (!qrisData?.paymentUrl) {
      alert("URL pembayaran DOKU Checkout sedang disiapkan. Silakan coba sebentar lagi.");
      return;
    }

    const win = window as unknown as { loadJokulCheckout?: (url: string) => void };
    if (typeof win.loadJokulCheckout === "function") {
      win.loadJokulCheckout(qrisData.paymentUrl);
    } else {
      window.open(qrisData.paymentUrl, "_blank");
    }
  };

  // 1. Generate QRIS saat komponen di-mount
  useEffect(() => {
    let isCancelled = false;
    const fetchQris = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await generateQrisPayment(orderId, paymentType);
        if (!isCancelled) {
          setQrisData(res);
          if (res.expiresAt) {
            const expSec = Math.floor(
              (new Date(res.expiresAt).getTime() - Date.now()) / 1000,
            );
            if (expSec > 0) setTimeLeft(expSec);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setError(
            err instanceof ApiError ? err.message : "Gagal memuat QRIS DOKU.",
          );
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    void fetchQris();

    return () => {
      isCancelled = true;
    };
  }, [orderId, paymentType]);

  // 2. Countdown Timer
  useEffect(() => {
    if (isPaid || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaid, timeLeft]);

  // 3. Polling Status Pembayaran otomatis setiap 3.5 detik
  useEffect(() => {
    if (isPaid) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetchQrisPaymentStatus(orderId);
        if (paymentType === "DP" && res.isDpPaid) {
          setIsPaid(true);
          if (onPaymentSuccess) onPaymentSuccess();
        } else if (paymentType === "FINAL" && res.isFullyPaid) {
          setIsPaid(true);
          if (onPaymentSuccess) onPaymentSuccess();
        }
      } catch {
        // Abaikan error polling
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [orderId, paymentType, isPaid, onPaymentSuccess]);

  // Manual Check Button
  const handleManualCheck = async () => {
    setChecking(true);
    try {
      const res = await fetchQrisPaymentStatus(orderId);
      if (
        (paymentType === "DP" && res.isDpPaid) ||
        (paymentType === "FINAL" && res.isFullyPaid)
      ) {
        setIsPaid(true);
        if (onPaymentSuccess) onPaymentSuccess();
      } else {
        alert(
          "Pembayaran belum terdeteksi. Silakan selesaikan pembayaran di aplikasi m-Banking atau E-Wallet Anda.",
        );
      }
    } catch {
      alert("Gagal memeriksa status pembayaran. Coba beberapa saat lagi.");
    } finally {
      setChecking(false);
    }
  };

  // Salin Nominal ke Clipboard
  const handleCopyAmount = () => {
    navigator.clipboard.writeText(String(Math.round(amount)));
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  // Salin Invoice ke Clipboard
  const handleCopyInvoice = () => {
    if (!qrisData?.invoiceNumber) return;
    navigator.clipboard.writeText(qrisData.invoiceNumber);
    setCopiedInvoice(true);
    setTimeout(() => setCopiedInvoice(false), 2000);
  };

  // Unduh Poster QRIS Resmi Lengkap (Header, Merchant, QR, Footer)
  const handleDownloadQr = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector("svg.qris-barcode-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = 640;
      const height = 880;
      canvas.width = width;
      canvas.height = height;

      // 1. Background putih halus
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);

      // 2. Header Merah QRIS
      const headerGrad = ctx.createLinearGradient(0, 0, width, 0);
      headerGrad.addColorStop(0, "#E11D48");
      headerGrad.addColorStop(1, "#BE123C");
      ctx.fillStyle = headerGrad;
      ctx.fillRect(0, 0, width, 110);

      // QRIS Text di Header
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 38px sans-serif";
      ctx.fillText("QRIS", 40, 62);
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("QUICK RESPONSE CODE INDONESIAN STANDARD", 40, 86);

      // GPN Badge di Header
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.roundRect(width - 130, 32, 90, 46, 8);
      ctx.fill();
      ctx.fillStyle = "#003D79";
      ctx.font = "900 18px sans-serif";
      ctx.fillText("GPN", width - 110, 56);
      ctx.fillStyle = "#E11D48";
      ctx.font = "bold 8px sans-serif";
      ctx.fillText("NASIONAL", width - 114, 69);

      // 3. Nama Merchant
      ctx.fillStyle = "#111827";
      ctx.font = "900 26px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("SELI FLORIST", width / 2, 160);

      ctx.fillStyle = "#4B5563";
      ctx.font = "600 13px sans-serif";
      ctx.fillText(
        "NMID: ID1020021617913 • Dicetak oleh: DOKU",
        width / 2,
        185,
      );

      // 4. Draw QR Code di tengah (380x380)
      const qrSize = 380;
      const qrX = (width - qrSize) / 2;
      const qrY = 215;
      ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

      // 5. Total Pembayaran
      ctx.fillStyle = "#FFF1F2";
      ctx.beginPath();
      ctx.roundRect(50, 625, width - 100, 72, 12);
      ctx.fill();

      ctx.fillStyle = "#BE123C";
      ctx.font = "700 12px sans-serif";
      ctx.fillText(
        `TOTAL PEMBAYARAN ${paymentType === "DP" ? "DP 50%" : "PELUNASAN"}`,
        width / 2,
        650,
      );
      ctx.font = "900 24px sans-serif";
      ctx.fillText(rupiah.format(amount), width / 2, 680);

      // 6. Footer Hitam Standar Pembayaran Nasional
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(0, height - 90, width, 90);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 15px sans-serif";
      ctx.fillText("STANDAR PEMBAYARAN NASIONAL", width / 2, height - 52);
      ctx.fillStyle = "#94A3B8";
      ctx.font = "600 11px sans-serif";
      ctx.fillText(
        "Satu QRIS untuk seluruh Bank & E-Wallet di Indonesia",
        width / 2,
        height - 30,
      );

      // Download trigger
      const pngUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = `QRIS-SELI-FLORIST-${orderNumber.replace(/[^A-Za-z0-9]/g, "")}-${paymentType}.png`;
      a.click();
      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  // Simulasi Bayar Berhasil (untuk kemudahan testing dev/sandbox)
  const handleSimulatePayment = async () => {
    setSimulating(true);
    try {
      await simulateQrisPaymentSuccess(orderId, paymentType);
      setIsPaid(true);
      if (onPaymentSuccess) onPaymentSuccess();
    } catch (err) {
      alert(
        err instanceof ApiError ? err.message : "Gagal simulasi pembayaran.",
      );
    } finally {
      setSimulating(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // Tampilan ketika SUKSES
  if (isPaid) {
    return (
      <div className="qris-paid-success-card" role="status">
        <div className="success-icon-bubble">
          <CheckCircle2 size={46} className="text-emerald-600" />
        </div>
        <div className="success-content">
          <span className="success-tag">Pembayaran Berhasil Terverifikasi</span>
          <h3>
            {paymentType === "DP"
              ? "Down Payment (DP 50%) Lunas!"
              : "Pelunasan Final Berhasil!"}
          </h3>
          <p>
            Terima kasih! Notifikasi pembayaran otomatis diterima dari jaringan
            QRIS DOKU. Pesanan Anda segera dirangkai oleh tim florist ahli Seli
            Florist.
          </p>
          <div className="success-meta-row">
            <div>
              <small>Nominal Diterima</small>
              <strong>{rupiah.format(amount)}</strong>
            </div>
            <div>
              <small>Waktu Verifikasi</small>
              <strong>Baru Saja</strong>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="qris-premium-container" aria-label="Pembayaran QRIS DOKU">
      {/* 1. Header Informasi & Countdown */}
      <div className="qris-top-banner">
        <div className="qris-title-cluster">
          <div className="qris-stage-pill">
            <span className="pulse-dot" />
            <span>
              {paymentType === "DP"
                ? "Tahap 1: Pembayaran DP 50%"
                : "Tahap 2: Pelunasan Final"}
            </span>
          </div>
          <h2>Bayar Cepat via QRIS</h2>
          <p className="qris-subtitle">
            Scan langsung menggunakan aplikasi m-Banking atau E-Wallet apa saja
          </p>
        </div>

        <div className="qris-timer-widget" title="Sisa batas waktu pembayaran">
          <Clock size={16} className="text-amber-600 animate-pulse" />
          <div className="timer-text-group">
            <small>Sisa Waktu</small>
            <strong className="timer-digits">{timeFormatted}</strong>
          </div>
        </div>
      </div>

      {/* 2. Nominal & Invoice Bar */}
      <div className="qris-amount-card">
        <div className="amount-info-col">
          <span className="amount-label">Total Tagihan QRIS</span>
          <div className="amount-figure-row">
            <strong className="amount-figure">{rupiah.format(amount)}</strong>
            <button
              type="button"
              onClick={handleCopyAmount}
              className="copy-chip"
              title="Salin nominal tagihan"
            >
              {copiedAmount ? (
                <>
                  <Check size={13} className="text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Salin</span>
                </>
              )}
            </button>
          </div>
        </div>

        {qrisData?.invoiceNumber && (
          <div className="invoice-info-col">
            <span className="invoice-label">Nomor Invoice</span>
            <div className="invoice-chip-group">
              <code className="invoice-code">
                {qrisData.invoiceNumber.slice(0, 22)}…
              </code>
              <button
                type="button"
                onClick={handleCopyInvoice}
                className="copy-mini-btn"
                title="Salin nomor invoice"
              >
                {copiedInvoice ? (
                  <Check size={12} className="text-emerald-600" />
                ) : (
                  <Copy size={12} />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. The Official QRIS Standee Frame */}
      <div className="qris-standee-wrapper">
        <div className="qris-standee-card" ref={qrRef}>
          {/* Header Merah QRIS Resmi */}
          <div className="standee-red-header">
            <QrisOfficialLogo />
            <GpnLogoSvg />
          </div>

          {/* Info Merchant */}
          <div className="standee-merchant-info">
            <span className="merchant-title">SELI FLORIST</span>
            <div className="merchant-subdetails">
              <span>NMID: ID1020021617913</span>
              <span className="bullet-sep">•</span>
              <span>A01</span>
              <span className="bullet-sep">•</span>
              <span className="acquirer-pill">DOKU</span>
            </div>
          </div>

          {/* QR Code Canvas */}
          <div className="standee-qr-viewport">
            {loading ? (
              <div className="standee-loading-state">
                <RefreshCw size={32} className="animate-spin text-rose-600" />
                <p>Menghubungkan ke DOKU Gateway…</p>
              </div>
            ) : error ? (
              <div className="standee-error-state">
                <AlertCircle size={32} className="text-red-500" />
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="retry-btn"
                >
                  Muat Ulang
                </button>
              </div>
            ) : qrisData ? (
              <div className="qr-reticle-box">
                {/* 4 Reticle Corner Accents */}
                <span className="reticle reticle-tl" />
                <span className="reticle reticle-tr" />
                <span className="reticle reticle-bl" />
                <span className="reticle reticle-br" />

                <QRCodeSVG
                  value={qrisData.qrContent}
                  size={236}
                  level="Q"
                  includeMargin={false}
                  className="qris-barcode-svg"
                />
              </div>
            ) : null}
          </div>

          {/* Footer Hitam Standar Nasional */}
          <div className="standee-national-footer">
            <div className="footer-national-content">
              <span className="footer-title">STANDAR PEMBAYARAN NASIONAL</span>
              <span className="footer-subtitle">
                SATU QRIS UNTUK SELURUH PEMBAYARAN
              </span>
            </div>
            <div className="aspi-micro-badge">ASPI</div>
          </div>
        </div>

        {/* Supported Channels Strip with Authentic Brand Colors */}
        <div className="qris-supported-logos-grid">
          <span className="channel-badge bca">BCA</span>
          <span className="channel-badge mandiri">Livin&apos;</span>
          <span className="channel-badge bri">BRImo</span>
          <span className="channel-badge bni">BNI</span>
          <span className="channel-badge gopay">GoPay</span>
          <span className="channel-badge ovo">OVO</span>
          <span className="channel-badge shopeepay">ShopeePay</span>
          <span className="channel-badge dana">DANA</span>
          <span className="channel-badge linkaja">LinkAja</span>
        </div>
        <p className="qris-bank-note">
          <ShieldCheck size={13} className="text-emerald-600" />
          Mendukung semua m-Banking &amp; E-Wallet resmi berlogo QRIS di Indonesia
        </p>
      </div>

      {/* 4. Action Buttons */}
      <div className="qris-actions-panel">
        {/* Tombol Pop-up DOKU Checkout Modal Overlay */}
        {qrisData?.paymentUrl && (
          <button
            type="button"
            onClick={handleOpenDokuCheckout}
            disabled={loading}
            className="btn-open-doku-popup"
            title="Buka form pembayaran resmi DOKU di dalam pop-up modal"
          >
            <CreditCard size={18} />
            <span>Bayar via DOKU Checkout (Pop-up Modal)</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleManualCheck}
          disabled={checking || loading}
          className="btn-check-qris-status"
        >
          <RefreshCw size={17} className={checking ? "animate-spin" : ""} />
          <span>
            {checking
              ? "Memeriksa Status ke DOKU…"
              : "Saya Sudah Membayar (Cek Status)"}
          </span>
        </button>

        <div className="qris-secondary-buttons-row">
          <button
            type="button"
            onClick={handleDownloadQr}
            disabled={!qrisData || loading}
            className="btn-download-qris"
            title="Unduh gambar QRIS resmi ke galeri untuk bayar dari aplikasi bank"
          >
            <Download size={16} />
            <span>Unduh QR Lengkap</span>
          </button>

          {qrisData?.paymentUrl && (
            <a
              href={qrisData.paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-open-doku-link"
            >
              <ExternalLink size={16} />
              <span>Buka Web DOKU</span>
            </a>
          )}
        </div>

        {/* 5. Sandbox Developer Helper (Discreet & Elegant) */}
        <div className="qris-dev-sandbox-card">
          <div className="sandbox-header">
            <div className="sandbox-title">
              <Sparkles size={14} className="text-amber-600" />
              <span>Mode Sandbox DOKU (Pengujian)</span>
            </div>
            <span className="sandbox-badge">Development</span>
          </div>
          <p className="sandbox-desc">
            Kamu sedang menguji coba sistem. Klik tombol di bawah untuk
            menyimulasikan pembayaran sukses tanpa perlu transfer uang sungguhan.
          </p>
          <button
            type="button"
            onClick={handleSimulatePayment}
            disabled={simulating || loading}
            className="btn-simulate-sandbox"
          >
            <Sparkles size={14} />
            <span>
              {simulating
                ? "Mengirim Callback DOKU…"
                : "⚡ Simulasi Bayar Berhasil (Instant Callback)"}
            </span>
          </button>
        </div>
      </div>

      {/* 6. Panduan Pembayaran Tabbed */}
      <div className="qris-instructions-card">
        <div className="instructions-header">
          <Info size={16} className="text-rose-600" />
          <h4>Cara Mudah Membayar QRIS:</h4>
        </div>

        {/* Tab Switcher */}
        <div className="guide-tab-nav" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeGuideTab === "banking"}
            onClick={() => setActiveGuideTab("banking")}
            className={`guide-tab-btn ${activeGuideTab === "banking" ? "active" : ""}`}
          >
            <Smartphone size={14} />
            <span>Mobile Banking (BCA, Mandiri, BRI, BNI)</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeGuideTab === "ewallet"}
            onClick={() => setActiveGuideTab("ewallet")}
            className={`guide-tab-btn ${activeGuideTab === "ewallet" ? "active" : ""}`}
          >
            <Wallet size={14} />
            <span>E-Wallet (GoPay, OVO, ShopeePay, DANA)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="guide-tab-content">
          {activeGuideTab === "banking" ? (
            <ol className="step-numbered-list">
              <li>
                Buka aplikasi m-Banking Anda (BCA Mobile, Livin&apos; Mandiri,
                BRImo, BNI Mobile, dll.).
              </li>
              <li>
                Pilih menu <strong>QRIS</strong> atau icon <strong>Scan QR</strong> di
                halaman utama aplikasi bank.
              </li>
              <li>
                Arahkan kamera ke kode QR di atas, atau klik ikon galeri jika
                sudah mengunduh QR code.
              </li>
              <li>
                Periksa detail: Nama merchant tertera <strong>SELI FLORIST</strong>{" "}
                dengan nominal <strong>{rupiah.format(amount)}</strong>.
              </li>
              <li>
                Masukkan <strong>PIN Transaksi</strong> Anda. Status pesanan di
                halaman ini akan otomatis ter-update menjadi <strong>LUNAS</strong>!
              </li>
            </ol>
          ) : (
            <ol className="step-numbered-list">
              <li>
                Buka aplikasi e-Wallet favorit Anda (GoPay, OVO, ShopeePay, DANA,
                atau LinkAja).
              </li>
              <li>
                Pilih menu <strong>Scan / Bayar</strong>.
              </li>
              <li>
                Scan langsung kode QR di atas (atau unggah foto QR hasil unduhan).
              </li>
              <li>
                Pastikan nama merchant penerima adalah <strong>SELI FLORIST</strong>.
              </li>
              <li>
                Konfirmasi pembayaran dan masukkan <strong>PIN E-Wallet</strong> Anda.
              </li>
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
