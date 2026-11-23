"use client";

import {
  ChevronDown,
  CircleHelp,
  Heart,
  LogOut,
  MapPin,
  MessageCircle,
  PackageCheck,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Truck,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useSeliStore } from "@/lib/store";
import { normalizeWhatsAppNumber } from "@/lib/phone-number";

const emptySubscribe = () => () => {};

function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const mounted = useMounted();
  const user = useSeliStore((state) => state.user);
  const cartCount = useSeliStore((state) => state.cartCount);
  const wishlistCount = useSeliStore((state) => state.wishlistCount);
  const setWishlistOpen = useSeliStore((state) => state.setWishlistOpen);
  const logoutUser = useSeliStore((state) => state.logoutUser);
  const setAuthOpen = useSeliStore((state) => state.setAuthOpen);
  const setSearchOpen = useSeliStore((state) => state.setSearchOpen);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeNav, setActiveNav] = useState<string>("beranda");

  useEffect(() => {
    if (pathname !== "/") return;

    const updateActiveByScroll = () => {
      const scrollY = window.scrollY;
      const rental = document.getElementById("rental");
      const koleksi = document.getElementById("koleksi");

      const threshold = 180;

      if (rental && scrollY >= rental.offsetTop - threshold) {
        setActiveNav("rental");
      } else if (koleksi && scrollY >= koleksi.offsetTop - threshold) {
        setActiveNav("katalog");
      } else {
        setActiveNav("beranda");
      }
    };

    const timer = setTimeout(updateActiveByScroll, 100);
    window.addEventListener("scroll", updateActiveByScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", updateActiveByScroll);
    };
  }, [pathname]);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    sectionId: string,
    href: string,
  ) => {
    setActiveNav(sectionId);
    if (pathname === "/") {
      e.preventDefault();
      if (sectionId === "beranda") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        window.history.replaceState(null, "", "/");
      } else {
        const targetId =
          sectionId === "katalog"
            ? "koleksi"
            : sectionId === "rental"
            ? "rental"
            : sectionId === "kontak"
            ? "kontak"
            : "cara-pesan";
        const element = document.getElementById(targetId);
        if (element) {
          const headerHeight = 75;
          const targetY =
            element.getBoundingClientRect().top + window.pageYOffset - headerHeight;
          window.scrollTo({
            top: targetY,
            behavior: "smooth",
          });
          window.history.replaceState(null, "", href);
        }
      }
    }
  };

  useEffect(() => {
    const openSearch = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", openSearch);
    return () => window.removeEventListener("keydown", openSearch);
  }, [setSearchOpen]);

  if (pathname?.startsWith("/admin")) return null;

  const currentUser = mounted ? user : null;
  const isPartnerPage = pathname === "/partner-with-us";
  const displayedActiveNav = pathname === "/" ? activeNav : isPartnerPage ? "partner" : "";
  const currentCartCount = mounted ? cartCount : 0;
  const currentWishlistCount = mounted && currentUser ? wishlistCount : 0;
  const firstName = currentUser?.fullName?.trim().split(/\s+/)[0];
  const waNumber = normalizeWhatsAppNumber(
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "6289517880077",
  );
  const whatsappUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    "Halo LICHARY Florist, saya ingin bertanya tentang produk.",
  )}`;

  return (
    <header className="site-header" suppressHydrationWarning>
      <div className="header-announcement">
        <div className="announcement-shell">
          <div className="announcement-left">
            <span className="announcement-item">
              <Truck size={13} /> Gratis Ongkir minimal belanja Rp150.000
            </span>
            <span className="announcement-sep">|</span>
            <span className="announcement-item">
              Pengiriman Cepat, Kualitas Bunga Terjamin
            </span>
          </div>
          <div className="announcement-right">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="announcement-item">
              <CircleHelp size={13} /> Pusat Bantuan
            </a>
            <span className="announcement-sep">|</span>
            <span className="announcement-item">
              <MapPin size={13} /> Surabaya
            </span>
          </div>
        </div>
      </div>

      <div className="header-inner">
        <Link href="/" className="brand" aria-label="LICHARY — Beranda">
          <Image
            src="/logo.jpeg"
            alt="Logo LICHARY Florist"
            width={44}
            height={44}
            className="brand-logo-img"
            priority
          />
          <span className="brand-text">
            <span className="brand-name">LICHARY</span>
            <small className="brand-sub">FLORAL STUDIO</small>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="Navigasi utama">
          <div className="header-links">
            <Link
              href="/"
              className={displayedActiveNav === "beranda" ? "active" : ""}
              onClick={(e) => handleNavClick(e, "beranda", "/")}
            >
              Beranda
            </Link>
            <Link
              href="/#koleksi"
              className={displayedActiveNav === "katalog" ? "active" : ""}
              onClick={(e) => handleNavClick(e, "katalog", "/#koleksi")}
            >
              Katalog
            </Link>
            <Link
              href="/#rental"
              className={displayedActiveNav === "rental" ? "active" : ""}
              onClick={(e) => handleNavClick(e, "rental", "/#rental")}
            >
              Sewa Papan
            </Link>
            <Link
              href="/partner-with-us"
              className={isPartnerPage ? "active" : ""}
            >
              Partner With Us
            </Link>
          </div>

          <div className="header-icon-actions">
            <button
              type="button"
              className="icon-button"
              onClick={() => setSearchOpen(true)}
              aria-label="Cari produk"
              title="Cari Produk"
            >
              <Search size={18} />
            </button>

            <button
              type="button"
              className="icon-button badge-button"
              onClick={() => {
                if (!currentUser) {
                  setAuthOpen(true);
                  return;
                }
                setWishlistOpen(true);
              }}
              aria-label={`Wishlist, ${currentWishlistCount} produk`}
              title="Wishlist"
              suppressHydrationWarning
            >
              <Heart size={18} />
              {currentWishlistCount > 0 && (
                <b className="wishlist-badge">{currentWishlistCount}</b>
              )}
            </button>

            <Link
              href="/keranjang"
              className="icon-button badge-button"
              aria-label={`Keranjang, ${currentCartCount} item`}
              title="Keranjang Belanja"
              suppressHydrationWarning
            >
              <ShoppingBag size={18} />
              {currentCartCount > 0 && (
                <b className="cart-badge">{currentCartCount}</b>
              )}
            </Link>
          </div>

          <span className="header-nav-divider" aria-hidden="true" />

          {currentUser ? (
            <div className="profile-dropdown-wrap" suppressHydrationWarning>
              <button
                className="profile-pill"
                onClick={() => setProfileOpen(!profileOpen)}
                aria-expanded={profileOpen}
                aria-label="Menu akun"
                suppressHydrationWarning
              >
                <div className="avatar-circle">
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.fullName}
                      className="avatar-img"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <UserRound size={15} />
                  )}
                </div>
                <span className="profile-name">{firstName}</span>
                <ChevronDown size={13} className="chevron" />
              </button>
              {profileOpen && (
                <div className="profile-popover" onMouseLeave={() => setProfileOpen(false)}>
                  <div className="profile-popover-greeting">
                    {currentUser.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.fullName}
                        className="popover-avatar-img"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="avatar-circle" style={{ width: 34, height: 34 }}>
                        <UserRound size={17} />
                      </div>
                    )}
                    <div>
                      <small>Masuk sebagai</small>
                      <b>{currentUser.fullName}</b>
                    </div>
                  </div>
                  <Link href="/profil" onClick={() => setProfileOpen(false)}>
                    <UserRound size={16} /> Profil Saya
                  </Link>
                  <Link href="/pesanan" onClick={() => setProfileOpen(false)}>
                    <PackageCheck size={16} /> Pesanan Saya
                  </Link>
                  {(currentUser.role === "OWNER" ||
                    currentUser.role === "FINANCE" ||
                    currentUser.role === "STAFF_VERIFICATION") && (
                    <Link href="/admin/orders" onClick={() => setProfileOpen(false)}>
                      <Settings size={16} /> Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      void logoutUser();
                    }}
                  >
                    <LogOut size={16} /> Keluar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="header-auth-pill"
              onClick={() => setAuthOpen(true)}
              suppressHydrationWarning
            >
              <UserRound size={15} /> Masuk / Daftar
            </button>
          )}
        </nav>

        <div className="mobile-header-actions">
          <button onClick={() => setSearchOpen(true)} aria-label="Buka pencarian">
            <Search size={19} />
          </button>
          <Link
            href="/pesanan"
            aria-label="Pesanan Saya"
            className={pathname.startsWith("/pesanan") ? "active" : ""}
          >
            <PackageCheck size={19} />
          </Link>
          <Link href="/keranjang" aria-label={`Keranjang, ${currentCartCount} item`}>
            <ShoppingBag size={19} />
            {currentCartCount > 0 && <b>{currentCartCount}</b>}
          </Link>
        </div>
      </div>
    </header>
  );
}
