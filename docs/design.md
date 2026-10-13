# DESIGN.md — Panduan Desain UI/UX Florist App

> Dokumen ini adalah **single source of truth** untuk seluruh keputusan desain UI/UX platform florist. Setiap komponen, warna, font, animasi, dan layout WAJIB mengacu ke panduan ini agar tampilan konsisten di semua halaman.

---

## 1. Filosofi Desain

### Tiga Prinsip Utama

| Prinsip | Makna |
|---|---|
| **Soft & Feminine** | Warna, bentuk, dan ilustrasi mencerminkan estetika bunga — lembut, elegan, tidak lebay |
| **Millennial-Friendly** | Bersih, minimal clutter, intuitif, mirip Tokopedia/Shopee tapi lebih boutique |
| **Ringan & Cepat** | Tidak ada gambar besar yang tidak perlu, animasi efisien, asset dioptimasi — loading harus terasa instan |

### Target Feel
Bayangkan menggabungkan **Pinterest** (estetika) + **Shopee** (kemudahan transaksi) + **aesthetic Instagram florist** — dengan sentuhan toko bunga premium yang terasa personal dan hangat.

---

## 2. Palet Warna

### Warna Utama (Brand Colors)

```
Primary Pink     : #F472B6   → Aksen utama, CTA button, highlight aktif
Soft Pink        : #FBB6CE   → Background card, badge, chip
Blush Rose       : #FCE7F3   → Background section, hover state ringan
Deep Rose        : #DB2777   → Text tombol, active state, link hover
```

### Warna Netral

```
Pure White       : #FFFFFF   → Background utama halaman
Off White        : #FFF5F7   → Background section alternatif (cream pink)
Light Gray       : #F3F4F6   → Border card, divider, input background
Medium Gray      : #9CA3AF   → Placeholder text, icon non-aktif
Dark Gray        : #374151   → Body text utama
Charcoal         : #1F2937   → Heading, title utama
```

### Warna Aksen (Bunga & Alam)

```
Petal Peach      : #FDBA74   → Badge "Pre-Order", warning ringan
Leaf Green       : #86EFAC   → Badge "Ready Stock", status sukses
Lavender Mist    : #DDD6FE   → Dekorasi, highlight spesial papan ucapan
Cream Gold       : #FDE68A   → Badge promo, highlight harga diskon
```

### Warna Sistem

```
Success          : #10B981   → Konfirmasi, verifikasi berhasil
Warning          : #F59E0B   → Deadline pembayaran, peringatan
Error            : #EF4444   → Validasi gagal, error form
Info             : #60A5FA   → Info tooltip, panduan
```

### Panduan Penggunaan Warna

```
Background halaman     → #FFFFFF atau #FFF5F7
Card/Container         → #FFFFFF dengan border #F3F4F6
Primary button         → Background #F472B6, text #FFFFFF
Secondary button       → Background transparan, border #F472B6, text #DB2777
Input field            → Background #F9FAFB, border #FBB6CE (focus: #F472B6)
Heading utama          → #1F2937
Body text              → #374151
Text sekunder/helper   → #9CA3AF
```

---

## 3. Tipografi

### Font Family

```
Heading & Display  : 'Playfair Display' — Google Fonts (elegan, feminin, berkarakter)
Body & UI          : 'Plus Jakarta Sans' — Google Fonts (modern, bersih, mudah dibaca)
Aksen dekoratif    : 'Dancing Script' — Google Fonts (HANYA untuk slogan/tagline, jangan berlebihan)
```

> **Import di Flutter `pubspec.yaml`:**
> ```yaml
> fonts:
>   - family: PlayfairDisplay
>     fonts:
>       - asset: fonts/PlayfairDisplay-Regular.ttf
>       - asset: fonts/PlayfairDisplay-SemiBold.ttf
>         weight: 600
>       - asset: fonts/PlayfairDisplay-Bold.ttf
>         weight: 700
>   - family: PlusJakartaSans
>     fonts:
>       - asset: fonts/PlusJakartaSans-Regular.ttf
>       - asset: fonts/PlusJakartaSans-Medium.ttf
>         weight: 500
>       - asset: fonts/PlusJakartaSans-SemiBold.ttf
>         weight: 600
>       - asset: fonts/PlusJakartaSans-Bold.ttf
>         weight: 700
> ```

### Skala Tipografi

```
Display XL  : Playfair Display, 36px / 44px line-height, weight 700
              → Hero section, nama toko
Display L   : Playfair Display, 28px / 36px, weight 600
              → Section title utama
Heading 1   : Plus Jakarta Sans, 24px / 32px, weight 700
              → Judul halaman, nama produk besar
Heading 2   : Plus Jakarta Sans, 20px / 28px, weight 600
              → Sub-heading, nama kategori
Heading 3   : Plus Jakarta Sans, 16px / 24px, weight 600
              → Label form, judul card
Body L      : Plus Jakarta Sans, 16px / 26px, weight 400
              → Deskripsi produk, konten panjang
Body M      : Plus Jakarta Sans, 14px / 22px, weight 400  ← Ukuran body utama
              → UI label, deskripsi singkat
Body S      : Plus Jakarta Sans, 12px / 18px, weight 400
              → Caption, timestamp, helper text
Label       : Plus Jakarta Sans, 12px / 16px, weight 600, uppercase, letter-spacing 0.5px
              → Badge, kategori tag, status chip
```

---

## 4. Sistem Spacing & Layout

### Spacing Scale (Multiple of 4px)

```
4px   → xs  : margin antar elemen sangat kecil (icon + text)
8px   → sm  : padding internal chip, badge
12px  → md  : gap antar baris teks
16px  → lg  : padding card internal, gap antar input  ← Paling sering dipakai
20px  → xl  : gap antar section kecil
24px  → 2xl : margin antar card
32px  → 3xl : padding section
40px  → 4xl : margin antar section besar
48px  → 5xl : padding hero section
```

### Border Radius (Rounded — Feminine & Friendly)

```
4px    → Tag/chip kecil
8px    → Input field, button kecil
12px   → Card produk, dialog kecil
16px   → Card besar, bottom sheet konten
24px   → Modal, overlay card
9999px → Pill button, avatar, chip kategori
```

### Grid Layout

```
Mobile (< 640px)   : 1 kolom, padding horizontal 16px
Tablet (640-1024px): 2 kolom, padding horizontal 24px
Desktop (> 1024px) : Max-width 1280px, centered, padding horizontal 32px

Grid produk:
  Mobile  : 2 kolom (card mini)
  Tablet  : 3 kolom
  Desktop : 4 kolom
```

---

## 5. Sistem Komponen

### A. Tombol (Button)

**Primary Button**
```
Background    : #F472B6
Text          : #FFFFFF, Plus Jakarta Sans, 14px, weight 600
Padding       : 14px 28px
Border Radius : 9999px (pill)
Shadow        : 0 4px 15px rgba(244, 114, 182, 0.35)
Hover         : Background #DB2777, shadow lebih kuat, scale 1.02
Active/klik   : Scale 0.97
Disabled      : Opacity 0.5, cursor not-allowed
Animasi       : transition all 200ms ease
```

**Secondary Button**
```
Background    : transparent
Border        : 1.5px solid #F472B6
Text          : #DB2777, 14px, weight 600
Padding       : 14px 28px
Border Radius : 9999px
Hover         : Background #FCE7F3
```

**Ghost / Text Button**
```
Background    : transparent
Text          : #F472B6, 14px, weight 600
Underline     : on hover
Cocok untuk   : "Lihat Semua →", link navigasi
```

**Danger Button** (Cancel, Hapus)
```
Background    : #FEF2F2
Text          : #EF4444, weight 600
Border        : 1px solid #FCA5A5
Hover         : Background #FEE2E2
```

**Small Button** (ukuran compact untuk card)
```
Padding       : 8px 16px
Font-size     : 13px
Border Radius : 9999px
```

---

### B. Input Field

```
Background    : #F9FAFB
Border        : 1.5px solid #FBB6CE
Border Radius : 12px
Padding       : 14px 16px
Font          : Plus Jakarta Sans, 14px, #374151
Placeholder   : #9CA3AF

Focus state:
  Border      : 2px solid #F472B6
  Background  : #FFFFFF
  Shadow      : 0 0 0 3px rgba(244, 114, 182, 0.15)

Error state:
  Border      : 2px solid #EF4444
  Helper text : #EF4444, 12px, di bawah input

Success state:
  Border      : 2px solid #10B981
  Icon        : ✓ hijau di kanan input

Icon prefix/suffix  : warna #F472B6
Animasi border/shadow: transition 200ms ease
```

**Floating Label Pattern:**
- Default: label ada di dalam input sebagai placeholder
- Focus / terisi: label naik ke atas, 12px, warna #F472B6

---

### C. Card Produk

```
Background      : #FFFFFF
Border          : 1px solid #F3F4F6
Border Radius   : 16px
Shadow          : 0 2px 8px rgba(0, 0, 0, 0.06)
Hover shadow    : 0 8px 24px rgba(244, 114, 182, 0.15)
Hover transform : translateY(-4px)
Animasi hover   : transition all 250ms ease

Layout:
  ┌─────────────────────┐
  │  [Foto Produk 1:1]  │  ← aspect ratio 1:1, object-fit: cover, lazy-loaded
  │  [Badge stock]      │  ← top-left, posisi absolute
  │  [Tombol ❤]        │  ← top-right, posisi absolute
  ├─────────────────────┤
  │  Nama Produk        │  ← Heading 3, max 2 baris, ellipsis
  │  Chip Kategori      │  ← Label tag kecil
  │  Harga              │  ← 16px, weight 700, #DB2777
  │  [Tombol Tambah]    │  ← Primary button small, full-width
  └─────────────────────┘
```

**Badge Stok:**
```
Ready Stock  : bg #DCFCE7, text #16A34A, "● Ready"
Pre-Order    : bg #FEF3C7, text #D97706, "⏱ Pre-Order"
Habis        : bg #F3F4F6, text #6B7280, "Habis"
```

---

### D. Chip / Tag Kategori

```
Background    : #FCE7F3
Text          : #DB2777, 12px, weight 600
Padding       : 8px 16px
Border Radius : 9999px
Gap antar chip: 8px
Animasi       : transition background 150ms ease

Selected state:
  Background  : #F472B6
  Text        : #FFFFFF
  Shadow      : 0 2px 8px rgba(244, 114, 182, 0.3)
```

---

### E. Bottom Navigation Bar (Mobile)

```
Background    : #FFFFFF
Border-top    : 1px solid #F3F4F6
Shadow        : 0 -4px 20px rgba(0, 0, 0, 0.06)
Height        : 64px
Padding-bottom: 8px (safe area)

Tab aktif:
  Icon        : 20px, warna #F472B6
  Label       : 10px, warna #F472B6, weight 600
  Indicator   : dot 4px bulat di bawah icon, warna #F472B6

Tab tidak aktif:
  Icon        : 20px, warna #9CA3AF
  Label       : 10px, warna #9CA3AF

Animasi tab switch: icon scale 1.0 → 1.2 → 1.0, 250ms spring
```

**Tab Menu:**
```
🏠 Beranda | 🔍 Katalog | 🛒 Keranjang | 📦 Pesanan | 👤 Profil
```

---

### F. App Bar / Top Navigation

```
Background    : #FFFFFF
Shadow        : 0 1px 0 #F3F4F6
Height        : 56px (mobile), 64px (desktop)
Logo          : Playfair Display, #DB2777, atau gambar logo SVG
Aksi kanan    : icon search + icon cart (dengan badge counter)
Back button   : ← icon, warna #374151
```

---

### G. Badge & Counter

```
Background    : #F472B6
Text          : #FFFFFF, 10px, weight 700
Min-size      : 18x18px, border-radius 9999px
Posisi        : absolute, top-right dari icon parent
Max value     : tampilkan "99+" jika > 99
Animasi naik  : scale 1.0 → 1.4 → 1.0 saat angka berubah, 200ms spring
```

---

### H. Toast / Snackbar Notification

```
Sukses  : bg #F0FDF4, border-left 4px solid #10B981, icon ✓
Warning : bg #FFFBEB, border-left 4px solid #F59E0B, icon ⚠
Error   : bg #FEF2F2, border-left 4px solid #EF4444, icon ✕
Info    : bg #EFF6FF, border-left 4px solid #60A5FA, icon ℹ

Border Radius : 12px
Padding       : 14px 16px
Shadow        : 0 4px 16px rgba(0,0,0,0.10)
Animasi masuk : slide-down + fade-in, 300ms ease-out
Posisi        : top-center (mobile), top-right (desktop)
Auto-dismiss  : 3 detik (sukses/info), 5 detik (warning), manual dismiss (error)
```

---

### I. Modal & Bottom Sheet

```
Overlay             : rgba(0, 0, 0, 0.4) + blur(2px)

Bottom Sheet (mobile):
  Background        : #FFFFFF
  Border Radius     : 24px 24px 0 0
  Handle bar        : 4px × 40px, #E5E7EB, centered, margin-top 12px
  Max height        : 90vh, scrollable jika konten panjang
  Animasi           : slide-up 300ms ease-out

Dialog/Modal (desktop & konfirmasi penting):
  Background        : #FFFFFF
  Border Radius     : 20px
  Max-width         : 480px
  Padding           : 32px
  Animasi           : scale 0.92 → 1.0 + fade-in, 250ms ease-out
```

---

### J. Loading State

**Skeleton Loader:**
```
Background  : linear-gradient(90deg, #FCE7F3 25%, #f9d0e3 50%, #FCE7F3 75%)
              background-size: 200% 100%
Animation   : shimmer (background-position 200% → -200%), 1.5s infinite linear
Border Radius: sesuai komponen aslinya
```

**Spinner:**
```
Warna       : #F472B6
Ukuran      : 20px (inline), 40px (halaman penuh)
Animasi     : rotate 360deg, 1s linear infinite
```

**Full-page loading (saat pertama buka app):**
```
Background  : #FFFFFF
Konten      : Logo toko tengah + pulse animation ringan
Durasi max  : tidak boleh > 2 detik
```

---

### K. Empty State

```
Ilustrasi   : SVG bunga layu / pot kosong (warna pink pastel)
Heading     : Playfair Display, "Belum ada apa-apa di sini 🌸"
Subtext     : Plus Jakarta Sans 14px, #9CA3AF
CTA Button  : Primary button
Padding     : 48px vertikal, centered
```

**Contoh empty state per halaman:**
```
Keranjang kosong  : "Keranjang kamu masih kosong — yuk mulai belanja! 🛒"
Riwayat order     : "Belum ada pesanan — buat pesanan pertamamu sekarang!"
Hasil pencarian   : "Tidak ditemukan — coba kata kunci lain 🔍"
```

---

### L. Status Badge Order

```
pending_payment       : bg #FEF3C7, text #D97706, "Menunggu DP"
dp_verified           : bg #DBEAFE, text #1D4ED8, "DP Diterima"
pending_final_payment : bg #EDE9FE, text #6D28D9, "Menunggu Pelunasan"
fully_paid            : bg #D1FAE5, text #065F46, "Lunas"
processing            : bg #E0F2FE, text #0369A1, "Sedang Diproses"
completed             : bg #F0FDF4, text #16A34A, "✓ Selesai"
cancelled             : bg #F3F4F6, text #6B7280, "Dibatalkan"
rejected              : bg #FEF2F2, text #DC2626, "Ditolak"
```

---

## 6. Animasi & Micro-interaction

> **Prinsip**: Animasi harus terasa **natural dan membantu** — bukan flashy. Gunakan untuk membantu orientasi user, bukan sebagai hiasan belaka.

### Timing Reference

```
0ms    → Instan   : perubahan warna teks/bg saat hover (CSS only)
150ms  → Kilat    : hover scale, shadow ringan
200ms  → Cepat    : tombol press, tab switch
250ms  → Normal   : card hover, modal dialog
300ms  → Smooth   : bottom sheet, page fade
150ms  → Keluar   : elemen yang meninggalkan layar (lebih cepat dari masuk)
```

### Easing Functions

```
ease-out       → Elemen masuk ke layar (terasa jatuh lembut)
ease-in        → Elemen keluar dari layar
ease-in-out    → State transition (tab, toggle)
Curves.elasticOut (Flutter) → Feedback interaktif (like button, badge bounce)
```

### Daftar Micro-interaction

| Elemen | Animasi | Durasi |
|---|---|---|
| Card produk hover | translateY(-4px) + shadow intensify | 250ms ease-out |
| Tombol primary hover | scale(1.02) + shadow kuat | 200ms ease-out |
| Tombol klik / press | scale(0.97) | 100ms ease-out |
| Tombol ❤ wishlist | scale(1.4) → 1.0, merah | 300ms elasticOut |
| Tambah ke keranjang | icon keranjang bounce + badge naik | 400ms elasticOut |
| Badge counter naik | scale(1.4) → 1.0 | 200ms elasticOut |
| Bottom sheet masuk | slide-up + fade | 300ms ease-out |
| Modal masuk | scale(0.92→1) + fade | 250ms ease-out |
| Toast notification | slide-down + fade-in | 300ms ease-out |
| Skeleton loading | shimmer gradient | 1500ms infinite |
| Page transition | fade-through (fade out 150ms, fade in 150ms) | 300ms |
| Tab aktif indicator | slide + scale | 200ms ease-in-out |
| Countdown timer DP | flip angka (per detik) | 200ms ease |
| Chip kategori selected | scale(1.05) + warna berubah | 150ms ease |
| Input field focus | border glow muncul | 200ms ease |
| Foto produk swipe | slide horizontal | 300ms ease-out |

### Yang TIDAK Boleh Dilakukan
```
❌ Parallax scroll berat
❌ Video background autoplay
❌ Particle / confetti effect berulang terus-menerus
❌ Animasi loop yang tidak bisa dihentikan saat tidak di-focus
❌ Durasi animasi > 500ms untuk elemen UI interaktif
❌ Banyak elemen animasi bersamaan (jika perlu, gunakan stagger 50ms per item)
❌ Animasi yang pakai height/top/margin (gunakan transform saja)
```

---

## 7. Ikonografi

### Library
Gunakan **Lucide Icons** (`lucide_flutter` package) — line-style, konsisten, ringan.

### Ukuran

```
12px → Di dalam badge / chip kecil
16px → Icon inline teks, helper
20px → Bottom navigation bar  ← Standar nav
24px → Tombol, action utama   ← Standar UI
28px → Header action besar
32px → Ilustrasi kecil / fitur icon
```

### Warna

```
Primary / aktif  : #F472B6
Normal / default : #9CA3AF
Danger           : #EF4444
Sukses           : #10B981
Info             : #60A5FA
```

### Icon Identitas Toko

Gunakan SVG bunga custom sebagai brand icon. Minimal dipakai di:
- Loading splash screen
- App bar / logo area
- Empty state illustration
- Footer

---

## 8. Ilustrasi & Foto

### Foto Produk

```
Format upload  : JPG/PNG (dikonversi ke WebP oleh backend/CDN)
Display format : WebP (30-50% lebih kecil)
Resolusi upload: min 800×800px, max 2000×2000px
Aspect ratio   : 1:1 (wajib square — konsisten di semua card)
Object-fit     : cover (tidak pernah distort)
Lazy loading   : wajib untuk semua gambar di bawah fold
Placeholder    : skeleton shimmer pink saat loading
Background foto: disarankan putih atau #FFF5F7 agar produk tampil bersih
```

### Ilustrasi UI

```
Style     : Flat illustration, pastel pink-based, outline tipis
Format    : SVG (tidak pecah di semua resolusi, file sangat kecil)
Gunakan di: empty state, halaman sukses/gagal, onboarding
Sumber    : undraw.co (filter warna #F472B6), atau buat custom SVG
```

### Hero Section

```
JANGAN gunakan foto berat sebagai background hero.
Alternatif yang ringan:
  → CSS gradient pink + ilustrasi SVG buket kecil
  → Pola bunga berbasis CSS (box-shadow trick atau SVG pattern)
  → Warna solid Blush Rose (#FCE7F3) + tipografi besar
```

---

## 9. Desain Per Halaman

### A. Beranda (Home)

```
Struktur:
  ┌──────────────────────────────────┐
  │ AppBar: Logo | Search | Cart 🛒  │
  ├──────────────────────────────────┤
  │ HERO: Gradient pink + tagline    │
  │       + ilustrasi buket SVG      │
  │       + CTA "Belanja Sekarang"   │
  ├──────────────────────────────────┤
  │ KATEGORI: chip horizontal scroll │
  │ Semua | Bunga | Kado | Papan     │
  ├──────────────────────────────────┤
  │ PRODUK UNGGULAN                  │
  │ [Grid 2 kolom, card produk]      │
  ├──────────────────────────────────┤
  │ BANNER PROMO (opsional)          │
  │ card full-width, bg Blush Rose   │
  ├──────────────────────────────────┤
  │ PRODUK TERBARU                   │
  │ [Grid 2 kolom]                   │
  ├──────────────────────────────────┤
  │ FOOTER: WA admin, sosmed, info   │
  └──────────────────────────────────┘
```

### B. Katalog Produk

```
  [Search bar sticky] — ikon filter kanan
  [Chip kategori] — horizontal scroll
  [Grid produk] — 2 col (mobile), infinite scroll atau "Muat Lebih"
  [Filter bottom sheet]:
    Sort: Terbaru | Harga Naik | Harga Turun
    Kategori, Tipe Stok (Ready / Pre-Order)
```

### C. Detail Produk

```
  [Galeri foto] — swiper horizontal, indicator dot pink
  [Chip kategori] — kecil, di bawah galeri
  [Nama produk] — Display L, Playfair Display
  [Harga] — 20px, bold, #DB2777
  [Badge stok]
  [Pemilih varian] — chip selector (jika ada)
  [Custom note field] — textarea, placeholder "Warna pita, tulisan ucapan..."
  [Deskripsi] — collapsible jika > 4 baris
  ────────────────────────────────────
  [Sticky bottom bar — selalu terlihat]:
    Qty stepper (−  1  +) | [Tambah ke Keranjang]
```

### D. Keranjang

```
  [List item keranjang]:
    Foto mini 64×64 | Nama + varian | Harga | Qty stepper | 🗑
  [Offline banner]: hanya tampil jika offline
    "📶 Sedang offline — perubahan disimpan sementara"
  [Ringkasan]:
    Subtotal: Rp xxx
    Ongkir  : Rp xxx (atau "dihitung saat checkout")
    Total   : Rp xxx (bold)
  [Sticky]: Tombol "Checkout →" full-width, primary
```

### E. Checkout — 3 Step

```
Step indicator horizontal:
  ① Pengiriman → ② Konfirmasi → ③ Selesai

Step 1 — Pengiriman & Detail:
  Pilih tipe:  [🚚 Antar ke Alamat]  [🏪 Ambil Sendiri]
  Jika Antar:
    Input alamat lengkap
    (opsional: map picker)
    Estimasi ongkir → "Hitung Ongkir"
  WA untuk notifikasi: input nomor
  Nama pemesan, nama penerima, telepon penerima
  Custom request / ucapan papan
  → Tombol "Lanjut ke Konfirmasi"

Step 2 — Konfirmasi & DP:
  Ringkasan order (collapsible)
  ┌─────────────────────────────┐
  │ DP yang harus dibayar       │
  │ Rp xxx (50% dari total)     │
  │                             │
  │ ⏰ Bayar sebelum:           │
  │  [Countdown HH:MM:SS]       │ ← timer, warna #F59E0B jika < 30 mnt
  │                             │
  │ Transfer ke:                │
  │ BCA 1234567890 a/n Seli     │
  │ [Salin Nomor Rekening]      │
  └─────────────────────────────┘
  → Tombol "Sudah Transfer — Upload Bukti DP"

Step 3 — Selesai:
  Ilustrasi SVG bunga bermekaran
  "Pesanan berhasil dibuat! 🌸"
  Nomor order: #XXXXXX
  Info: "Kami akan verifikasi bukti DP kamu segera"
  → Tombol "Cek Status Pesanan"
```

### F. Halaman Upload Bukti Bayar

```
  Info order + nominal yang harus dibayar
  Area upload:
    ┌────────────────────────────────┐
    │  📷                            │
    │  Ketuk untuk upload foto       │
    │  Format: JPG/PNG, max 2MB      │
    └────────────────────────────────┘
  Preview foto setelah dipilih
  Tombol "Ganti Foto" (retract & upload ulang)
  Tombol "Kirim Bukti Bayar" (primary)
  Catatan: "Bukti bisa diganti selama belum diverifikasi admin"
```

### G. Riwayat Order

```
  [Tab filter pills]:
    Semua | Menunggu DP | DP OK | Perlu Lunas | Selesai | Batal

  [Card per order]:
    Foto produk mini (max 3 + "+N")
    Nomor order + tanggal
    Status badge (warna sesuai sistem)
    Total harga
    CTA: "Lihat Detail" atau "Upload Bukti DP" (jika pending)
```

### H. Detail Order

```
  [Status timeline — vertikal]:
    ● Order Dibuat (✓)
    ● DP Diterima (✓ / pending / ✕)
    ● Lunas (✓ / pending / ✕)
    ● Sedang Diproses
    ● Selesai

  [Detail produk]: list item dengan foto
  [Info pengiriman]: alamat / pickup + estimasi siap
  [Info pembayaran]:
    DP: Rp xxx (✓ Diverifikasi / ⏳ Menunggu)
    Sisa: Rp xxx — deadline: [tanggal]
    Countdown jika masih aktif
    Bukti DP: tampilkan thumbnail + tombol "Ganti Foto" (jika pending)
    Bukti Pelunasan: idem

  [Tombol Cancel] (hanya tampil jika masih bisa dibatalkan):
    Danger style, dengan bottom sheet konfirmasi:
      "Yakin ingin membatalkan pesanan ini?"
      Info refund sesuai usia order
      "Batal" | "Ya, Batalkan Pesanan"
```

### I. Panel Admin

```
Warna admin: tetap brand pink, tapi lebih bersih dan data-heavy.
Layout:
  Desktop  : sidebar kiri 240px + konten kanan
  Mobile   : bottom tab (Dashboard | Orders | Produk | Keuangan)

Dashboard:
  Row KPI card (4 kartu):
    Omzet Bulan Ini | Laba Bersih | Pending Verif | Perlu Refund
  Grafik line chart omzet 7 hari (warna #F472B6)
  Antrian verifikasi terbaru (list 5 item + "Lihat Semua")
  "● Live" WebSocket indicator (hijau jika terhubung)

Halaman Verifikasi Order:
  Card per order: foto bukti + info customer + amount
  Tombol "✓ Approve" (hijau) | "✕ Tolak" (merah)
  Filter: Menunggu DP | Menunggu Pelunasan | Perlu Refund

Halaman Keuangan:
  Tab: Modal Masuk | Pengeluaran | HPP Produk
  Tabel dengan soft-delete (tampilkan tombol restore)
```

---

## 10. Performa & Optimasi Flutter Web

### Target Metrics

```
First Contentful Paint  : < 1.5 detik
Time to Interactive     : < 3.0 detik
Lighthouse Mobile       : ≥ 90
Lighthouse Desktop      : ≥ 95
```

### Aturan Wajib

**Gambar:**
```
✅ Format WebP — pakai CDN transform (Cloudflare R2 Image Resizing)
✅ Lazy loading — CachedNetworkImage dengan fade-in placeholder
✅ Thumbnail berbeda resolusi dari foto detail
✅ Simpan di CDN, bukan di server sendiri
❌ Jangan load gambar resolusi penuh untuk thumbnail
```

**Font:**
```
✅ Preload font critical (Playfair Display title + Plus Jakarta Sans body)
✅ Hanya load weight yang dipakai (4 weights, bukan semua)
✅ Font di-bundle ke dalam app (assets), bukan CDN — lebih cepat offline
```

**Animasi:**
```
✅ Gunakan Transform + Opacity (tidak memaksa layout recalculation)
✅ AnimatedContainer untuk perubahan ukuran
✅ RepaintBoundary untuk komponen yang sering berubah (timer, badge)
❌ Jangan pakai Opacity widget untuk fade panjang — pakai FadeTransition
❌ Jangan animasikan height, margin, atau padding secara langsung
```

**Flutter-Specific:**
```
✅ Gunakan const constructor di semua widget yang tidak berubah
✅ ListView.builder untuk list panjang (bukan ListView)
✅ AutomaticKeepAliveClientMixin untuk halaman yang sering dikunjungi
✅ flutter_cache_manager untuk caching gambar
✅ Deferred loading untuk panel admin (tidak di-load saat customer membuka app)
✅ SliverAppBar untuk UX scroll yang halus di halaman katalog
```

**Asset:**
```
✅ SVG dioptimasi (hapus metadata, path berlebihan)
✅ Lottie (.json) untuk animasi kompleks — bukan GIF
✅ Icon pakai icon font / SVG inline, bukan PNG transparan
```

---

## 11. Dark Mode

> **Tidak diimplementasikan di v1.0** — menjaga konsistensi estetika pink-putih. Dijadwalkan untuk v2.0.

---

## 12. Aksesibilitas Minimum

```
Contrast ratio teks body   : min 4.5:1 (WCAG AA)
Touch target minimum       : 44×44px (semua tombol, link, chip)
Font size minimum          : 12px (tidak ada teks lebih kecil dari ini)
Form label                 : selalu ada teks label (tidak hanya placeholder)
Error message              : selalu deskriptif ("Email tidak valid" bukan "Error")
Loading state              : selalu ada indikator visual
Tombol disable             : opacity 0.5 + cursor not-allowed + aria-disabled
```

---

## 13. Referensi Desain (Inspirasi)

| Referensi | Aspek yang Diadopsi |
|---|---|
| [Shopee](https://shopee.co.id) | Card produk, chip kategori, bottom nav, checkout flow |
| [Tokopedia](https://tokopedia.com) | Layout checkout step, order status timeline |
| [Pinterest](https://pinterest.com) | Estetika foto produk, warna soft, grid |
| [Bloom & Wild](https://bloomandwild.com) | Typography Playfair Display, hero minimalis |
| [Lovepop](https://lovepop.com) | Color palette pink, feel boutique premium |
| Material Design 3 | Spacing system, elevation, motion principles |

---

## 14. Checklist QA Desain Sebelum Launch

### Warna & Tipografi
- [ ] Semua warna menggunakan nilai hex dari palet resmi di atas
- [ ] Tidak ada hex warna random yang tidak terdaftar
- [ ] Semua heading menggunakan Playfair Display atau Plus Jakarta Sans sesuai skala
- [ ] Tidak ada font size di bawah 12px

### Komponen
- [ ] Semua tombol menggunakan style komponen yang sudah didefinisikan
- [ ] Semua input field memiliki label, placeholder, error state, dan focus state
- [ ] Loading skeleton ada di semua konten yang di-fetch dari API
- [ ] Empty state ada di semua halaman yang mungkin kosong

### Animasi
- [ ] Tidak ada animasi yang durasinya > 400ms untuk elemen UI interaktif
- [ ] Semua animasi menggunakan transform/opacity (bukan height/margin)
- [ ] Tidak ada GIF — diganti Lottie atau CSS animation

### Gambar & Asset
- [ ] Semua foto produk berformat WebP dan lazy-loaded
- [ ] Semua SVG sudah dioptimasi
- [ ] Tidak ada gambar tanpa alt text / semantic label

### Aksesibilitas
- [ ] Touch target minimum 44×44px terpenuhi
- [ ] Contrast ratio teks ≥ 4.5:1
- [ ] Semua form memiliki error message yang deskriptif

### Performa
- [ ] Lighthouse Mobile score ≥ 90
- [ ] FCP < 1.5 detik
- [ ] Panel admin menggunakan deferred loading
