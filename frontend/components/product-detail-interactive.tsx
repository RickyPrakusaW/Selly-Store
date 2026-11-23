"use client";

import {
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Facebook,
  Flower2,
  Heart,
  Link as LinkIcon,
  MessageCircle,
  Minus,
  Play,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { resolveImageUrl } from "@/lib/api";
import { useRealtimeTodayWIB } from "@/lib/dates";
import { normalizeWhatsAppNumber } from "@/lib/phone-number";
import { useSeliStore } from "@/lib/store";
import type { Product } from "@/lib/types";
import { useMounted } from "@/lib/use-mounted";
import { RentalDatePicker } from "@/components/rental-date-picker";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

type MediaSlide = {
  id: string;
  type: "video" | "image";
  url: string;
  thumbUrl: string;
  title: string;
};

export function ProductDetailInteractive({
  product,
}: Readonly<{ product: Product }>) {
  const addToCart = useSeliStore((state) => state.addToCart);
  const showToast = useSeliStore((state) => state.showToast);

  const primaryDbImg = resolveImageUrl(product.images?.[0]?.imageUrl || "");
  const mediaItems: MediaSlide[] = product.images?.length
    ? product.images.map((image, index) => {
        const url = resolveImageUrl(image.imageUrl);
        const isVideo = url.endsWith(".webm") || url.endsWith(".mp4");
        return {
          id: image.id || `product-media-${index}`,
          type: isVideo ? "video" : "image",
          url,
          thumbUrl: url,
          title: `${product.name} — tampilan ${index + 1}`,
        };
      })
    : [
        {
          id: "product-media-fallback",
          type: "image",
          url: "/images/hero-bouquet.jpg",
          thumbUrl: "/images/hero-bouquet.jpg",
          title: product.name,
        },
      ];

  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const user = useSeliStore((state) => state.user);
  const wishlist = useSeliStore((state) => state.wishlist);
  const toggleWishlist = useSeliStore((state) => state.toggleWishlist);
  const mounted = useMounted();

  const isFavorited =
    mounted && Boolean(user) && wishlist.some((p) => p.id === product.id);
  const [copiedLink, setCopiedLink] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const thumbnailsRef = useRef<HTMLDivElement | null>(null);

  // Zoom lightbox state
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initialPanX: number;
    initialPanY: number;
    moved: boolean;
  } | null>(null);

  const fallbackSlide: MediaSlide = {
    id: "fallback-slide",
    type: "image",
    url: primaryDbImg || "/images/hero-bouquet.jpg",
    thumbUrl: primaryDbImg || "/images/hero-bouquet.jpg",
    title: "Foto Produk",
  };

  const currentSlide: MediaSlide =
    mediaItems[activeSlideIdx] ?? mediaItems[0] ?? fallbackSlide;

  const handleSelectSlide = useCallback(
    (idx: number) => {
      if (videoRef.current && idx !== activeSlideIdx) {
        videoRef.current.pause();
        setIsPlayingVideo(false);
      }
      setActiveSlideIdx(idx);
      setZoomScale(1);
      setPanOffset({ x: 0, y: 0 });
      const row = thumbnailsRef.current;
      if (row && row.children[idx]) {
        (row.children[idx] as HTMLElement).scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    },
    [activeSlideIdx],
  );

  const handlePrevSlide = useCallback(() => {
    const nextIdx =
      (activeSlideIdx - 1 + mediaItems.length) % mediaItems.length;
    handleSelectSlide(nextIdx);
  }, [activeSlideIdx, mediaItems.length, handleSelectSlide]);

  const handleNextSlide = useCallback(() => {
    const nextIdx = (activeSlideIdx + 1) % mediaItems.length;
    handleSelectSlide(nextIdx);
  }, [activeSlideIdx, mediaItems.length, handleSelectSlide]);

  const handleOpenZoom = () => {
    if (currentSlide.type === "video") return;
    setIsZoomOpen(true);
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleCloseZoom = useCallback(() => {
    setIsZoomOpen(false);
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
    dragStartRef.current = null;
  }, []);

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(3, +(prev + 0.5).toFixed(1)));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => {
      const next = Math.max(1, +(prev - 0.5).toFixed(1));
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleToggleClickZoom = () => {
    if (dragStartRef.current?.moved) return;
    if (zoomScale === 1) {
      setZoomScale(2);
    } else {
      setZoomScale(1);
      setPanOffset({ x: 0, y: 0 });
    }
  };

  // Keyboard navigation & body scroll lock for zoom modal
  useEffect(() => {
    if (!isZoomOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseZoom();
      } else if (e.key === "ArrowLeft") {
        handlePrevSlide();
      } else if (e.key === "ArrowRight") {
        handleNextSlide();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isZoomOpen, handleCloseZoom, handlePrevSlide, handleNextSlide]);

  // Mouse pan handlers when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale <= 1) return;
    e.preventDefault();
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPanX: panOffset.x,
      initialPanY: panOffset.y,
      moved: false,
    };
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragStartRef.current.moved = true;
    }
    setPanOffset({
      x: dragStartRef.current.initialPanX + dx,
      y: dragStartRef.current.initialPanY + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch pan handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoomScale <= 1 || e.touches.length !== 1) return;
    const touch = e.touches[0];
    if (!touch) return;
    dragStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initialPanX: panOffset.x,
      initialPanY: panOffset.y,
      moved: false,
    };
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragStartRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    if (!touch) return;
    const dx = touch.clientX - dragStartRef.current.startX;
    const dy = touch.clientY - dragStartRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragStartRef.current.moved = true;
    }
    setPanOffset({
      x: dragStartRef.current.initialPanX + dx,
      y: dragStartRef.current.initialPanY + dy,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleScrollThumbs = (direction: "left" | "right") => {
    if (thumbnailsRef.current) {
      thumbnailsRef.current.scrollBy({
        left: direction === "left" ? -150 : 150,
        behavior: "smooth",
      });
    }
  };

  const handleTogglePlayVideo = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .then(() => setIsPlayingVideo(true))
        .catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlayingVideo(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedLink(true);
      showToast("Tautan produk berhasil disalin!", "success");
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleToggleFavorite = () => {
    toggleWishlist(product);
  };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";
  const pageUrl = `${siteUrl.replace(/\/$/, "")}/produk/${product.id}`;

  const shareText = encodeURIComponent(
    `Lihat ${product.name} di LICHARY Florist: ${pageUrl}`,
  );
  const waShareUrl = `https://api.whatsapp.com/send?text=${shareText}`;
  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    pageUrl,
  )}`;

  const handleShareClick =
    (platform: "wa" | "fb") => (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const currentUrl =
        typeof window !== "undefined" ? window.location.href : pageUrl;
      const text = `Lihat ${product.name} di LICHARY Florist: ${currentUrl}`;
      const targetUrl =
        platform === "wa"
          ? `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
          : `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    };

  // Form states
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants?.[0]?.id ?? "",
  );
  const [qty, setQty] = useState(1);
  const [customNote, setCustomNote] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingEndDate, setBookingEndDate] = useState("");
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("15:00");
  const [loading, setLoading] = useState(false);

  const today = useRealtimeTodayWIB();
  const minDate = today.dateStr;

  const selectedVariant = product.variants?.find(
    (v) => v.id === selectedVariantId,
  );
  const basePrice = Number(product.basePrice);
  const deltaPrice = selectedVariant ? Number(selectedVariant.priceDelta) : 0;
  const totalPrice = (basePrice + deltaPrice) * qty;

  const isRental =
    product.stockType?.toString().toLowerCase().includes("rental") ||
    product.category?.slug === "papan_ucapan";

  const isPo = product.stockType?.toString().toLowerCase().includes("pre");

  const handleAddToCart = async () => {
    if (isRental && !bookingDate) {
      showToast("Silakan pilih Tanggal Mulai Sewa terlebih dahulu.", "error");
      return;
    }

    const effectiveEndDate = bookingEndDate || bookingDate;
    if (isRental && bookingDate && effectiveEndDate < bookingDate) {
      showToast(
        "Tanggal Selesai Sewa tidak boleh sebelum Tanggal Mulai.",
        "error",
      );
      return;
    }

    let finalNote = customNote.trim();
    if (isRental && (startTime || endTime)) {
      const timeInfo = `[Waktu Sewa: ${startTime || "12:00"} s/d ${
        endTime || "15:00"
      } WIB]`;
      finalNote = finalNote ? `${timeInfo} ${finalNote}` : timeInfo;
    }

    setLoading(true);
    await addToCart(product, selectedVariantId || undefined, qty, {
      ...(finalNote ? { customNote: finalNote } : {}),
      ...(bookingDate ? { bookingDate } : {}),
      ...(effectiveEndDate ? { bookingEndDate: effectiveEndDate } : {}),
    });
    setLoading(false);
    showToast(`${product.name} berhasil ditambahkan ke keranjang!`, "success");
  };

  const waNumber = normalizeWhatsAppNumber(
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "6289517880077",
  );
  const waText = encodeURIComponent(
    `Halo LICHARY Florist, saya tertarik dengan ${product.name}${
      selectedVariant ? ` (${selectedVariant.variantName})` : ""
    }. Total Rp ${totalPrice.toLocaleString("id-ID")}`,
  );
  const waLink = `https://wa.me/${waNumber}?text=${waText}`;

  return (
    <div className="product-detail-layout">
      {/* ─── Left Column: Gallery Showcase ─── */}
      <div className="detail-gallery-column">
        {/* Main Media Viewport */}
        <div className="detail-main-image-wrap">
          {/* Floating Stock Badge */}
          <span
            className={`detail-stock-badge ${
              isRental ? "rental" : isPo ? "po" : "ready"
            }`}
          >
            {isRental
              ? "Sewa Papan Acara"
              : isPo
                ? `Pre-Order (${product.poDays ?? 3} Hari)`
                : "Ready Stock"}
          </span>

          {/* Slide Counter Badge */}
          <span className="detail-slide-counter">
            {activeSlideIdx + 1} / {mediaItems.length}
          </span>

          {/* Main Content: Video or Image */}
          {currentSlide.type === "video" ? (
            <div
              className="detail-video-container"
              onClick={handleTogglePlayVideo}
            >
              <video
                ref={videoRef}
                src={currentSlide.url}
                poster={currentSlide.thumbUrl}
                className="detail-main-video"
                playsInline
                loop
                onPlay={() => setIsPlayingVideo(true)}
                onPause={() => setIsPlayingVideo(false)}
                onEnded={() => setIsPlayingVideo(false)}
              />
              {!isPlayingVideo && (
                <div className="video-play-overlay">
                  <div className="video-play-btn-circle">
                    <Play
                      size={28}
                      fill="white"
                      color="white"
                      style={{ marginLeft: 3 }}
                    />
                  </div>
                  <span className="video-play-label">Putar Video Demo</span>
                </div>
              )}
            </div>
          ) : currentSlide.url ? (
            <div
              className="detail-image-interactive-box"
              onClick={handleOpenZoom}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleOpenZoom();
                }
              }}
              aria-label="Klik untuk memperbesar foto"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentSlide.url}
                alt={currentSlide.title}
                className="detail-main-image"
              />
              <button
                type="button"
                className="detail-zoom-trigger-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenZoom();
                }}
                aria-label="Perbesar foto"
                title="Perbesar foto"
              >
                <ZoomIn size={15} />
                <span>Perbesar</span>
              </button>
            </div>
          ) : (
            <div className="detail-placeholder">
              <Flower2 size={64} />
              <span>LICHARY Florist</span>
            </div>
          )}

          {/* Previous & Next Slide Navigation Arrows */}
          <button
            type="button"
            className="slider-nav-arrow prev"
            onClick={handlePrevSlide}
            aria-label="Slide sebelumnya"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            className="slider-nav-arrow next"
            onClick={handleNextSlide}
            aria-label="Slide berikutnya"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Thumbnail Carousel with Navigation Arrows */}
        <div className="detail-thumbnails-wrapper">
          <button
            type="button"
            className="thumb-nav-btn left"
            onClick={() => handleScrollThumbs("left")}
            aria-label="Geser thumbnail ke kiri"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="detail-thumbnails-row" ref={thumbnailsRef}>
            {mediaItems.map((item, idx) => {
              const isActive = activeSlideIdx === idx;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`detail-thumb-btn ${isActive ? "active" : ""}`}
                  onClick={() => handleSelectSlide(idx)}
                  aria-label={`Lihat ${item.title}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.thumbUrl}
                    alt={item.title}
                    className="thumb-img"
                  />
                  {item.type === "video" && (
                    <div className="thumb-video-badge">
                      <div className="thumb-video-icon">
                        <Play size={10} fill="white" color="white" />
                      </div>
                      <span>VIDEO</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="thumb-nav-btn right"
            onClick={() => handleScrollThumbs("right")}
            aria-label="Geser thumbnail ke kanan"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Media Footer: Share Options & Wishlist/Favorit Counter */}
        <div className="detail-media-footer-bar">
          <div className="share-actions-group">
            <span className="share-title-text">Share:</span>
            <a
              href={waShareUrl}
              onClick={handleShareClick("wa")}
              target="_blank"
              rel="noreferrer"
              className="share-icon-btn wa"
              aria-label="Bagikan ke WhatsApp"
              title="Bagikan ke WhatsApp"
            >
              <MessageCircle size={15} />
            </a>
            <a
              href={fbShareUrl}
              onClick={handleShareClick("fb")}
              target="_blank"
              rel="noreferrer"
              className="share-icon-btn fb"
              aria-label="Bagikan ke Facebook"
              title="Bagikan ke Facebook"
            >
              <Facebook size={15} />
            </a>
            <button
              type="button"
              className={`share-icon-btn copy ${copiedLink ? "copied" : ""}`}
              onClick={handleCopyLink}
              aria-label="Salin tautan produk"
              title={copiedLink ? "Tersalin!" : "Salin tautan"}
            >
              {copiedLink ? <CheckCheck size={15} /> : <LinkIcon size={15} />}
            </button>
          </div>

          <button
            type="button"
            className={`favorite-action-btn ${isFavorited ? "active" : ""}`}
            onClick={handleToggleFavorite}
            aria-label="Tambah ke Favorit"
          >
            <Heart
              size={17}
              fill={isFavorited ? "#e11d48" : "none"}
              color={isFavorited ? "#e11d48" : "#881337"}
              className="favorite-heart-icon"
            />
            <span>
              {isFavorited ? "Tersimpan di favorit" : "Simpan ke favorit"}
            </span>
          </button>
        </div>
      </div>

      {/* ─── Right Column: Product Info & Order Configurator ─── */}
      <div className="detail-content-column">
        {/* Category & Title */}
        <div className="detail-header-block">
          <h1 className="detail-title">{product.name}</h1>

          {/* Social Proof & Rating */}
        </div>

        {/* Price Card */}
        <div className="detail-price-card">
          <div className="price-main-row">
            <strong className="detail-price-amount">
              {rupiah.format(totalPrice)}
            </strong>
            {qty > 1 && (
              <span className="unit-price-hint">
                ({rupiah.format(basePrice + deltaPrice)} / unit)
              </span>
            )}
          </div>
          <div className="stock-availability-pill">
            {product.availableQty > 0 ? (
              <span className="in-stock">
                <span className="status-dot green" />
                Stok Siap: <strong>{product.availableQty} unit</strong>
              </span>
            ) : (
              <span className="pre-order">
                <span className="status-dot amber" />
                Dibuat sesuai pesanan
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="detail-desc-box">
          <h3>Deskripsi Rangkaian</h3>
          <p>{product.description}</p>
        </div>

        {/* Variant Selector */}
        {product.variants && product.variants.length > 0 && (
          <div className="detail-form-group">
            <label className="form-group-label">Pilih Varian / Ukuran:</label>
            <div className="variant-options-grid">
              {product.variants.map((variant) => {
                const delta = Number(variant.priceDelta);
                const isSelected = selectedVariantId === variant.id;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    className={`variant-option-chip ${
                      isSelected ? "active" : ""
                    }`}
                    onClick={() => setSelectedVariantId(variant.id)}
                  >
                    <span className="variant-name">{variant.variantName}</span>
                    {delta !== 0 && (
                      <span className="variant-delta">
                        {delta > 0 ? "+" : ""}
                        {rupiah.format(delta)}
                      </span>
                    )}
                    {isSelected && <Check size={14} className="check-icon" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quantity Stepper */}
        <div className="detail-form-group">
          <label className="form-group-label">Jumlah Unit:</label>
          <div className="qty-stepper-wrap">
            <button
              type="button"
              className="stepper-btn"
              onClick={() => setQty(Math.max(1, qty - 1))}
              disabled={qty <= 1}
              aria-label="Kurangi jumlah"
            >
              <Minus size={16} />
            </button>
            <span className="stepper-value">{qty}</span>
            <button
              type="button"
              className="stepper-btn"
              onClick={() => setQty(qty + 1)}
              aria-label="Tambah jumlah"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Rental Schedule & Time (For Board Rental) */}
        {isRental && (
          <RentalDatePicker
            selectedDate={bookingDate}
            onSelectDate={(date) => {
              setBookingDate(date);
              if (!bookingEndDate || bookingEndDate < date) {
                setBookingEndDate(date);
              }
            }}
            selectedEndDate={bookingEndDate}
            onSelectEndDate={setBookingEndDate}
            startTime={startTime}
            onStartTimeChange={setStartTime}
            endTime={endTime}
            onEndTimeChange={setEndTime}
            minDate={minDate}
            productName={product.name}
          />
        )}

        {/* Custom Greeting Note */}
        <div className="detail-form-group">
          <label className="form-group-label">
            Pesan / Tulisan Khusus (Papan / Kartu Ucapan):
          </label>
          <textarea
            rows={3}
            placeholder="Tulis pesan Anda disini (Contoh: Happy Birthday Sarah tersayang! Semoga selalu bahagia & sukses — from Kevin)"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            maxLength={1000}
            className="custom-note-textarea"
          />
          <small className="char-counter">
            {customNote.length} / 1000 karakter
          </small>
        </div>

        {/* Reassurance Checklist */}
        <div className="detail-guarantee-list">
          <div className="guarantee-item">
            <Check size={16} />
            <span>Dirangkai segar & rapi oleh florist profesional</span>
          </div>
          <div className="guarantee-item">
            <ShieldCheck size={16} />
            <span>Foto pesanan dikirim via WhatsApp sebelum diantar</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="detail-action-bar">
          <button
            type="button"
            className="detail-add-cart-btn"
            disabled={loading}
            onClick={() => void handleAddToCart()}
          >
            <ShoppingBag size={19} />
            {loading ? "Menambahkan…" : "Tambah ke Keranjang"}
          </button>

          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="detail-wa-btn"
          >
            <MessageCircle size={19} />
            Konsultasi WhatsApp
          </a>
        </div>
      </div>

      {/* ─── Fullscreen Image Zoom / Lightbox Modal ─── */}
      {isZoomOpen && currentSlide.type === "image" && (
        <div
          className="image-zoom-lightbox-backdrop"
          onClick={handleCloseZoom}
          role="dialog"
          aria-modal="true"
          aria-label="Tampilan perbesar gambar"
        >
          {/* Top Bar Controls */}
          <div
            className="lightbox-top-bar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lightbox-title-wrap">
              <span className="lightbox-title">{currentSlide.title}</span>
              <span className="lightbox-counter">
                ({activeSlideIdx + 1} / {mediaItems.length})
              </span>
            </div>

            <div className="lightbox-zoom-controls">
              <button
                type="button"
                className="lightbox-ctrl-btn"
                onClick={handleZoomOut}
                disabled={zoomScale <= 1}
                aria-label="Perkecil foto"
                title="Perkecil (-)"
              >
                <ZoomOut size={18} />
              </button>

              <span className="lightbox-scale-badge">
                {Math.round(zoomScale * 100)}%
              </span>

              <button
                type="button"
                className="lightbox-ctrl-btn"
                onClick={handleZoomIn}
                disabled={zoomScale >= 3}
                aria-label="Perbesar foto"
                title="Perbesar (+)"
              >
                <ZoomIn size={18} />
              </button>

              <button
                type="button"
                className="lightbox-ctrl-btn reset"
                onClick={handleResetZoom}
                aria-label="Reset ukuran normal"
                title="Kembalikan ukuran normal (1x)"
              >
                <RotateCcw size={15} />
                <span>1x</span>
              </button>

              <button
                type="button"
                className="lightbox-ctrl-btn close"
                onClick={handleCloseZoom}
                aria-label="Tutup tampilan perbesar"
                title="Tutup (Esc)"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Central Zoomable Canvas */}
          <div
            className="lightbox-canvas-area"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCloseZoom();
              }
            }}
          >
            <div
              className={`lightbox-img-wrapper ${zoomScale > 1 ? "is-zoomed" : ""}`}
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
                cursor:
                  zoomScale > 1
                    ? isDragging
                      ? "grabbing"
                      : "grab"
                    : "zoom-in",
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleClickZoom();
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentSlide.url}
                alt={currentSlide.title}
                className="lightbox-img"
                draggable={false}
              />
            </div>
          </div>

          {/* Bottom Zoom Hint */}
          <div
            className="lightbox-bottom-hint"
            onClick={(e) => e.stopPropagation()}
          >
            <span>
              💡 Klik gambar untuk{" "}
              {zoomScale > 1 ? "memperkecil (1x)" : "memperbesar (2x)"}
              {zoomScale > 1 && " • Geser untuk melihat sudut lainnya"}
            </span>
          </div>

          {/* Previous & Next Lightbox Nav Arrows */}
          <button
            type="button"
            className="lightbox-nav-btn prev"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevSlide();
            }}
            aria-label="Foto sebelumnya"
            title="Foto sebelumnya (Panah Kiri)"
          >
            <ChevronLeft size={28} />
          </button>

          <button
            type="button"
            className="lightbox-nav-btn next"
            onClick={(e) => {
              e.stopPropagation();
              handleNextSlide();
            }}
            aria-label="Foto berikutnya"
            title="Foto berikutnya (Panah Kanan)"
          >
            <ChevronRight size={28} />
          </button>
        </div>
      )}
    </div>
  );
}
