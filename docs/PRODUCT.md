# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Pelanggan (Customer):** Individu yang mencari buket bunga segar, kado/hampers, atau menyewa papan ucapan untuk momen istimewa (pernikahan, wisuda, duka cita, perayaan bisnis). Mengakses mayoritas melalui perangkat mobile (mobile-first).
- **Staff Verifikasi & Operasional:** Tim toko yang memverifikasi bukti transfer pembayaran (DP & pelunasan), memperbarui status pengerjaan, dan mengatur pengiriman/pickup.
- **Finance & Owner:** Pengelola keuangan yang memantau omzet, laba bersih, kas masuk/keluar, dan laporan bisnis.

## Product Purpose

Menyediakan platform e-commerce dan rental florist modern dengan sentuhan butik premium yang memudahkan pelanggan memesan rangkaian bunga personal, hampers eksklusif, serta menyewa papan ucapan elegan dengan sistem pemesanan terjadwal dan pembayaran dua tahap (DP 50% dan pelunasan 50%).

## Positioning

Selly Florist adalah butik bunga kurasi premium dengan sentuhan personal, bukan sekadar agregator atau toko bunga massal. Desain dan antarmuka mengedepankan keindahan estetika, kejelasan informasi, dan kenyamanan bertransaksi tanpa jargon atau visual yang bising/generik.

## Operating Context

- **Akses Pengguna:** Pengunjung dapat menjelajah katalog, detail produk, dan simulasi secara publik tanpa login. Autentikasi diperlukan saat checkout dan tracking pesanan.
- **Alur Transaksi:** Pembayaran transfer bank manual dua tahap (DP 50% dalam batas waktu 2 jam, sisa 50% saat siap kirim). Bukti pembayaran dapat diunggah, ditinjau, dan diganti jika status masih pending.
- **Opsi Pemenuhan:** Pengiriman ke alamat penerima (*delivery*) atau ambil di toko (*pickup*).

## Capabilities and Constraints

- **Teknologi:** Next.js 16 (React 19, Tailwind CSS, TanStack Query, Zustand) di frontend, NestJS + PostgreSQL di backend.
- **Rental Papan Ucapan:** Sistem pemesanan rental dengan perlindungan *soft-lock* untuk mencegah *double booking* unit papan pada rentang tanggal yang sama.
- **Refund Bertingkat:** Aturan pembatalan berjenjang berbasis waktu untuk customer, dan 100% jika pembatalan toko.
- **Tanpa AI Slop:** Menghindari elemen generik AI seperti kicker text berlebih di atas heading, shadow blur 50px yang kabur, animasi marquee tak berujung, kontras teks buram, dan copy template kosong.

## Brand Commitments

- **Identitas Nama:** Selly Florist (Seli Florist).
- **Nuansa & Estetika:** Boutique luxury, warm, romantic, trustworthy. Palet dominan soft pink, rose blush, warm neutral cream, dan deep berry text.
- **Tipografi:** Playfair Display untuk display/heading yang berkarakter anggun, dipadukan dengan sans-serif modern yang nyaman dibaca untuk body UI.

## Evidence on Hand

- Desain sistem lengkap: `docs/design.md`
- Dokumen spesifikasi bisnis & endpoint: `docs/note.md`, `docs/ENDPOINTS.md`, `docs/SCENARIOS.md`
- API specification: `docs/MCP_SPEC.md`
- Frontend implementation: `frontend/`

## Product Principles

1. **Craft over Template:** Setiap tampilan merefleksikan keahlian florist butik, bukan template AI generik.
2. **Kenyamanan & Kejelasan:** Informasi harga, DP, jadwal pengerjaan, dan status order harus transparan tanpa ambiguitas.
3. **Mobile-First Experience:** Lebih dari 80% customer berbelanja dari smartphone; ukuran touch-target, teks, dan alur form dirancang ergonomis.
4. **Respek terhadap Konten:** Foto bunga asli dan karya kado menjadi fokus utama visual, sementara elemen UI melayani dan membingkai produk dengan anggun.

## Accessibility & Inclusion

- Rasio kontras teks minimum 4.5:1 (WCAG AA).
- Ukuran teks fungsional interaktif minimal 11px (tidak ada micro-text yang tidak terbaca).
- Target sentuh tombol dan elemen navigasi minimal 44×44px.
- Loading states (skeleton) dan empty states informatif untuk semua kondisi jaringan.
