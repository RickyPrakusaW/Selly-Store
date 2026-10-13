"use client";

import {
  Calendar,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Facebook,
  Flower2,
  Gift,
  Heart,
  Link as LinkIcon,
  MessageCircle,
  Minus,
  Play,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { resolveImageUrl } from "@/lib/api";
import { useSeliStore } from "@/lib/store";
import type { Product } from "@/lib/types";

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

  // Gallery multi-media slides
  const primaryDbImg = resolveImageUrl(product.images?.[0]?.imageUrl || "");

  const mediaItems: MediaSlide[] = [
    {
      id: "media-video-demo",
      type: "video",
      url: "/videos/flower-timelapse.webm",
      thumbUrl: primaryDbImg || "/images/hero-bouquet.jpg",
      title: "Video Dokumentasi & Rangkaian Florist",
    },
    {
      id: "media-photo-main",
      type: "image",
      url: primaryDbImg || "/images/hero-bouquet.jpg",
      thumbUrl: primaryDbImg || "/images/hero-bouquet.jpg",
      title: "Tampak Depan Utama",
    },
    ...(product.images && product.images.length > 1
      ? product.images.slice(1).map((img, i) => {
          const u = resolveImageUrl(img.imageUrl);
          const isVid = u.endsWith(".webm") || u.endsWith(".mp4");
          return {
            id: img.id || `img-extra-${i}`,
            type: (isVid ? "video" : "image") as "video" | "image",
            url: u,
            thumbUrl: u,
            title: `Foto Tambahan ${i + 1}`,
          };
        })
      : [
          {
            id: "media-photo-detail",
            type: "image" as const,
            url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=85",
            thumbUrl:
              "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&auto=format&fit=crop&q=80",
            title: "Detail Kualitas & Kesegaran Bunga",
          },
          {
            id: "media-photo-angle",
            type: "image" as const,
            url: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=900&auto=format&fit=crop&q=85",
            thumbUrl:
              "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=200&auto=format&fit=crop&q=80",
            title: "Tampak Samping & Proporsi Ukuran",
          },
          {
            id: "media-photo-gift",
            type: "image" as const,
            url: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=900&auto=format&fit=crop&q=85",
            thumbUrl:
              "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=200&auto=format&fit=crop&q=80",
            title: "Packaging Eksklusif & Kartu Ucapan",
          },
        ]),
  ];

  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const user = useSeliStore((state) => state.user);
  const wishlist = useSeliStore((state) => state.wishlist);
  const toggleWishlist = useSeliStore((state) => state.toggleWishlist);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isFavorited = mounted && Boolean(user) && wishlist.some((p) => p.id === product.id);
  const favoriteCount = 1280 + (isFavorited ? 1 : 0);
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

  const formattedFavoriteCount =
    favoriteCount >= 1000
      ? `${(favoriteCount / 1000).toFixed(1).replace(".", ",")}RB`
      : favoriteCount.toString();

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = encodeURIComponent(
    `Lihat koleksi indah "${product.name}" di Seli Florist: ${pageUrl}`,
  );
  const waShareUrl = `https://api.whatsapp.com/send?text=${shareText}`;
  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    pageUrl,
  )}`;

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

  const [minDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

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

  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "6289517880077";
  const waText = encodeURIComponent(
    `Halo Seli Florist, saya tertarik dengan ${product.name}${
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
              <span>Seli Florist</span>
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
            <span>Favorit ({formattedFavoriteCount})</span>
          </button>
        </div>
      </div>

      {/* ─── Right Column: Product Info & Order Configurator ─── */}
      <div className="detail-content-column">
        {/* Category & Title */}
        <div className="detail-header-block">
          <span className="detail-category-eyebrow">
            {product.category?.name ?? "Koleksi Eksklusif"}
          </span>
          <h1 className="detail-title">{product.name}</h1>

          {/* Social Proof & Rating */}
          <div className="detail-social-proof">
            <div className="star-rating">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />
              ))}
              <span>4.9</span>
            </div>
            <span className="dot-divider">•</span>
            <span className="sales-hint">120+ Terjual</span>
            <span className="dot-divider">•</span>
            <span className="reviews-hint">48 Ulasan Pembeli</span>
          </div>
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
            <label className="form-group-label">
              Pilih Varian / Ukuran:
            </label>
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
          <div className="detail-form-group rental-schedule-card">
            <div className="schedule-card-header">
              <Calendar size={18} />
              <h4>Jadwal & Waktu Sewa Papan Ucapan</h4>
            </div>

            <div className="schedule-grid">
              <div className="schedule-input-box">
                <label>Tanggal Mulai / Acara *</label>
                <input
                  type="date"
                  min={minDate || undefined}
                  value={bookingDate}
                  onChange={(e) => {
                    setBookingDate(e.target.value);
                    if (!bookingEndDate || bookingEndDate < e.target.value) {
                      setBookingEndDate(e.target.value);
                    }
                  }}
                  required
                />
              </div>

              <div className="schedule-input-box">
                <label>Tanggal Selesai (Bongkar)</label>
                <input
                  type="date"
                  min={bookingDate || minDate || undefined}
                  value={bookingEndDate}
                  onChange={(e) => setBookingEndDate(e.target.value)}
                />
              </div>

              <div className="schedule-input-box">
                <label>
                  <Clock size={12} /> Jam Pasang di Lokasi
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <div className="schedule-input-box">
                <label>
                  <Clock size={12} /> Jam Selesai Acara (Maks 18:00)
                </label>
                <input
                  type="time"
                  value={endTime}
                  max="18:00"
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="schedule-helper-note">
              💡 <span>Sewa papan ucapan sudah termasuk pengantaran ke lokasi acara, pemasangan rapi, serta penarikan kembali setelah acara selesai.</span>
            </div>
          </div>
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

        {/* Trust Value Badges */}
        <div className="detail-trust-pills">
          <div className="trust-pill">
            <Sparkles size={16} />
            <div>
              <strong>100% Bunga Segar Alami</strong>
              <small>Dipetik langsung tiap pagi</small>
            </div>
          </div>
          <div className="trust-pill">
            <Truck size={16} />
            <div>
              <strong>Pengiriman Tepat Waktu</strong>
              <small>Armada aman berpendingin</small>
            </div>
          </div>
          <div className="trust-pill">
            <Gift size={16} />
            <div>
              <strong>Gratis Kartu Ucapan</strong>
              <small>Cetak rapi dengan amplop segel</small>
            </div>
          </div>
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
                  zoomScale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
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
              💡 Klik gambar untuk {zoomScale > 1 ? "memperkecil (1x)" : "memperbesar (2x)"}
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
