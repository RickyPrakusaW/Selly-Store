import type { Metadata } from 'next';
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import { AuthDialog } from '@/components/auth-dialog';
import { BottomNav } from '@/components/bottom-nav';
import { Providers } from '@/components/providers';
import { SiteHeader } from '@/components/site-header';
import { WishlistDrawer } from '@/components/wishlist-drawer';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Seli Florist — Bunga untuk Setiap Cerita', template: '%s | Seli Florist' },
  description: 'Buket bunga, kado, dan papan ucapan yang dirangkai sepenuh hati untuk momen istimewa Anda.',
  icons: {
    icon: '/logo.jpeg',
    apple: '/logo.jpeg',
  },
  alternates: { canonical: '/' },
  openGraph: { type: 'website', locale: 'id_ID', url: '/', siteName: 'Seli Florist', title: 'Seli Florist — Bunga untuk Setiap Cerita', description: 'Buket segar, hadiah penuh makna, dan papan ucapan untuk setiap momen.', images: [{ url: '/logo.jpeg', width: 512, height: 512, alt: 'Seli Florist' }] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" data-scroll-behavior="smooth" suppressHydrationWarning>

      <body className={`${jakarta.variable} ${playfair.variable}`} suppressHydrationWarning>
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
