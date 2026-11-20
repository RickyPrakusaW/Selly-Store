"use client";

import {
  ChevronDown,
  Heart,
  LogOut,
  MessageCircle,
  PackageCheck,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
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
      const caraPesan = document.getElementById("cara-pesan");
      const rental = document.getElementById("rental");
      const koleksi = document.getElementById("koleksi");

      const threshold = 180;

      if (caraPesan && scrollY >= caraPesan.offsetTop - threshold) {
        setActiveNav("cara-pesan");
      } else if (rental && scrollY >= rental.offsetTop - threshold) {
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
  const displayedActiveNav = pathname === "/" ? activeNav : "";
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
        <div>
          <p><ShieldCheck size={13} /> DP 50% untuk mengamankan pesanan</p>
          <span>Pengiriman dan pengambilan terjadwal setiap hari</span>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle size={13} /> Tanya florist
          </a>
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
            LICHARY
            <small>Bespoke Floral Studio</small>
          </span>
        </Link>

        <label className="header-search">
          <Search size={17} className="search-icon" />
          <input
            aria-label="Cari produk"
            placeholder="Cari buket, hampers, atau papan ucapan…"
            onFocus={() => setSearchOpen(true)}
          />
          <kbd>Ctrl K</kbd>
        </label>

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
              Rental
            </Link>
            <Link
              href="/#cara-pesan"
              className={displayedActiveNav === "cara-pesan" ? "active" : ""}
              onClick={(e) => handleNavClick(e, "cara-pesan", "/#cara-pesan")}
            >
              Cara Pesan
            </Link>
            <Link
              href="/pesanan"
              className={pathname.startsWith("/pesanan") ? "active" : ""}
            >
              Pesanan Saya
            </Link>
          </div>

          <button
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
            className="header-cart-pill badge-button"
            aria-label={`Keranjang, ${currentCartCount} item`}
            suppressHydrationWarning
          >
            <span className="header-cart-icon"><ShoppingBag size={17} /></span>
            <span className="header-cart-copy">
              <small>Keranjang</small>
              <b>{currentCartCount} item</b>
            </span>
            {currentCartCount > 0 && <i>{currentCartCount}</i>}
          </Link>

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
              className="profile-pill login-pill"
              onClick={() => setAuthOpen(true)}
              suppressHydrationWarning
            >
              <div className="avatar-circle"><UserRound size={15} /></div>
              <span>Masuk</span>
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
