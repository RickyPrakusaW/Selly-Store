"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import {
  ApiError,
  createDokuCheckout,
  fetchDokuPaymentStatus,
  type DokuCheckoutData,
} from "@/lib/api";

declare global {
  interface Window {
    loadJokulCheckout?: (paymentUrl: string) => void;
  }
}

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

function formatDokuExpiry(value: string): string {
  if (!/^\d{14}$/.test(value)) return value;
  const year = value.slice(0, 4);
  const month = value.slice(4, 6);
  const day = value.slice(6, 8);
  const hour = value.slice(8, 10);
  const minute = value.slice(10, 12);
  return `${day}/${month}/${year} ${hour}:${minute} WIB`;
}

export function QrisPaymentBox({
  orderId,
  orderNumber,
  paymentType,
  amount,
  onPaymentSuccess,
}: QrisPaymentBoxProps) {
  const [checkout, setCheckout] = useState<DokuCheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [error, setError] = useState("");

  const loadCheckout = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCheckout(await createDokuCheckout(orderId, paymentType));
    } catch (caught) {
      setCheckout(null);
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Gagal membuat transaksi DOKU.",
      );
    } finally {
      setLoading(false);
    }
  }, [orderId, paymentType]);

  /* eslint-disable react-hooks/set-state-in-effect -- create the remote DOKU checkout session when the payable order changes */
  useEffect(() => {
    void loadCheckout();
  }, [loadCheckout]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!checkout) return;
    const scriptId = "doku-checkout-script";
    const source =
      checkout.environment === "production"
        ? "https://jokul.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js"
        : "https://sandbox.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js";
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existing?.src === source) return;
    existing?.remove();
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = source;
    script.async = true;
    document.body.appendChild(script);
  }, [checkout]);

  useEffect(() => {
    if (isPaid) return;
    const checkStatus = async () => {
      try {
        const status = await fetchDokuPaymentStatus(
          orderId,
          checkout?.invoiceNumber,
        );
        const paid =
          paymentType === "DP" ? status.isDpPaid : status.isFullyPaid;
        if (paid) {
          setIsPaid(true);
          onPaymentSuccess?.();
        }
      } catch {
        // Polling berikutnya akan mencoba kembali.
      }
    };
    void checkStatus();
    const interval = window.setInterval(() => void checkStatus(), 5_000);
    return () => window.clearInterval(interval);
  }, [checkout?.invoiceNumber, isPaid, onPaymentSuccess, orderId, paymentType]);

  const openDokuCheckout = () => {
    if (!checkout?.paymentUrl) return;
    setOpening(true);
    if (window.loadJokulCheckout) {
      window.loadJokulCheckout(checkout.paymentUrl);
    } else {
      window.open(checkout.paymentUrl, "_blank", "noopener,noreferrer");
    }
    window.setTimeout(() => setOpening(false), 1_000);
  };

  if (isPaid) {
    return (
      <div className="qris-paid-success-card" role="status">
        <div className="success-icon-bubble">
          <CheckCircle2 size={46} />
        </div>
        <div className="success-content">
          <span className="success-tag">Pembayaran DOKU Terverifikasi</span>
          <h3>
            {paymentType === "DP"
              ? "Down Payment (DP 50%) Lunas"
              : "Pelunasan Final Berhasil"}
          </h3>
          <p>
            Status diperbarui otomatis dari notifikasi atau rekonsiliasi resmi
            DOKU.
          </p>
          <strong>{rupiah.format(amount)}</strong>
        </div>
      </div>
    );
  }

  return (
    <section
      className="qris-premium-container"
      aria-label="Pembayaran resmi DOKU Checkout"
    >
      <div className="qris-top-banner">
        <div className="qris-title-cluster">
          <div className="qris-stage-pill">
            <ShieldCheck size={14} />
            <span>
              {checkout?.environment === "sandbox"
                ? "DOKU Sandbox"
                : "DOKU Production"}
            </span>
          </div>
          <h2>Pembayaran Aman via DOKU</h2>
          <p className="qris-subtitle">
            Pilih metode pembayaran yang tersedia pada halaman resmi DOKU.
          </p>
        </div>
        <CreditCard size={34} aria-hidden="true" />
      </div>

      <div className="qris-amount-card">
        <div className="amount-info-col">
          <span className="amount-label">
            {paymentType === "DP" ? "Tagihan DP 50%" : "Tagihan Pelunasan"}
          </span>
          <strong className="amount-figure">{rupiah.format(amount)}</strong>
        </div>
        <div className="invoice-info-col">
          <span className="invoice-label">Pesanan</span>
          <strong>{orderNumber}</strong>
        </div>
      </div>

      {error && (
        <div className="inline-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {checkout && (
        <div className="qris-instructions-card">
          <div className="instructions-header">
            <ShieldCheck size={17} />
            <h4>Transaksi resmi DOKU</h4>
          </div>
          <p>
            Invoice: <strong>{checkout.invoiceNumber}</strong>
          </p>
          <p>
            Berlaku hingga: <strong>{formatDokuExpiry(checkout.expiresAt)}</strong>
          </p>
          <p>
            Setelah pembayaran berhasil, halaman ini akan memperbarui status
            secara otomatis dari webhook atau pemeriksaan status resmi DOKU.
          </p>
        </div>
      )}

      <div className="qris-actions-panel">
        <button
          type="button"
          className="btn-open-doku-popup"
          onClick={openDokuCheckout}
          disabled={!checkout || loading || opening}
        >
          {loading || opening ? (
            <RefreshCw size={18} className="animate-spin" />
          ) : (
            <CreditCard size={18} />
          )}
          <span>
            {loading
              ? "Menghubungkan ke DOKU..."
              : opening
                ? "Membuka DOKU..."
                : "Bayar Sekarang di DOKU"}
          </span>
        </button>

        {error && (
          <button
            type="button"
            className="btn-check-qris-status"
            onClick={() => void loadCheckout()}
            disabled={loading}
          >
            <RefreshCw size={17} /> Coba Lagi
          </button>
        )}

        {checkout && (
          <a
            href={checkout.paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-open-doku-link"
          >
            <ExternalLink size={16} /> Buka DOKU di tab baru
          </a>
        )}
      </div>
    </section>
  );
}
