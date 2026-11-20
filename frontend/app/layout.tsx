import type { Metadata } from "next";
import localFont from "next/font/local";
import { AuthDialog } from "@/components/auth-dialog";
import { BottomNav } from "@/components/bottom-nav";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import { WishlistDrawer } from "@/components/wishlist-drawer";
import "react-phone-number-input/style.css";
import "./globals.css";

const jakarta = localFont({
  src: [
    { path: "./fonts/plus-jakarta-sans-400.ttf", weight: "400" },
    { path: "./fonts/plus-jakarta-sans-700.ttf", weight: "700" },
  ],
  variable: "--font-jakarta",
  display: "swap",
});
const playfair = localFont({
  src: "./fonts/playfair-display-600.ttf",
  weight: "600",
  variable: "--font-playfair",
  display: "swap",
});
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LICHARY — Buket, Hampers & Rental Papan",
    template: "%s | LICHARY Florist",
  },
  description:
    "Katalog buket, hampers, dan papan ucapan sewa dengan informasi harga, stok, serta jadwal pemesanan.",
  icons: {
    icon: "/logo.jpeg",
    apple: "/logo.jpeg",
  },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "LICHARY Florist",
    title: "LICHARY — Buket, Hampers & Rental Papan",
    description:
      "Lihat katalog, harga, pilihan varian, dan jadwal pemesanan LICHARY Florist.",
    images: [
      { url: "/logo.jpeg", width: 512, height: 512, alt: "LICHARY Florist" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${jakarta.variable} ${playfair.variable}`}
        suppressHydrationWarning
      >
        <Providers>
          <SiteHeader />
          {children}
          <AuthDialog />
          <WishlistDrawer />
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
