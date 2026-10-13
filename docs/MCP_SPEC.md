# 🤖 Seli Florist — Model Context Protocol (MCP) Specification

Dokumen ini adalah **spesifikasi resmi perancangan MCP Server** untuk platform e-commerce Seli Florist. Dokumen ini merangkum seluruh alat (*Tools*), sumber daya (*Resources*), skema parameter (*Input Schemas*), dan aturan bisnis (*Business Rules*) yang dibutuhkan oleh AI Assistant / Agent untuk berinteraksi dengan API Seli Florist.

---

## 🏗️ 1. Arsitektur MCP Server

```
+-------------------------------------------------------------+
|                     LLM / AI Client                         |
|        (Claude Desktop, Cursor, Antigravity, Open WebUI)    |
+------------------------------+------------------------------+
                               | JSON-RPC (STDIO / SSE)
+------------------------------v------------------------------+
|                   Seli Florist MCP Server                   |
|           (@modelcontextprotocol/sdk + TypeScript)          |
+------------------------------+------------------------------+
                               | REST API / HTTP Client
+------------------------------v------------------------------+
|                     Seli Florist Backend                    |
|             (NestJS API: http://localhost:3000/api)         |
+-------------------------------------------------------------+
```

* **Teknologi Rekomendasi:** Node.js / TypeScript dengan `@modelcontextprotocol/sdk` & `zod`.
* **Protokol:** JSON-RPC 2.0 melalui STDIO (lokal) atau SSE (HTTP server).
* **API Base URL:** `http://localhost:3000/api` (atau via environment variable `API_BASE_URL`).
* **Autentikasi:** Bearer Token JWT pada header `Authorization: Bearer <TOKEN>`.

---

## 📜 2. Aturan Bisnis Inti (Business Rules untuk AI Agent)

AI Agent **wajib memahami dan mematuhi** aturan berikut saat memproses data dan pesanan:

1. **Skema Pembayaran 2 Tahap (DP 50%):**
   * Setiap pesanan yang dibuat berstatus `PENDING_PAYMENT`.
   * Customer wajib membayar **DP 50%** dari total pesanan (termasuk ongkir).
   * Sisa pelunasan (50%) wajib dibayarkan sebelum barang dikirim/diambil (`PENDING_FINAL_PAYMENT`).
2. **Penyewaan Papan Ucapan (Rental Unit):**
   * Unit papan ucapan memiliki inventaris terbatas (default: 3–5 unit).
   * Wajib dilakukan pengecekan ketersediaan via `check_rental_availability` sebelum checkout untuk mencegah *double booking*.
   * Tanggal sewa dicatat dalam format `YYYY-MM-DD`.
3. **Kebijakan Pembatalan & Refund DP:**
   * **< 12 jam setelah order:** Potongan 0% (Refund 100%).
   * **12 – 24 jam:** Potongan 25% (Refund 75%).
   * **> 24 jam:** Potongan 50% (Refund 50%).
4. **Metode Pengiriman:**
   * `DELIVERY`: Wajib menyertakan alamat lengkap, nomor telepon penerima, dan menghitung ongkir via `estimate_shipping`.
   * `PICKUP`: Gratis ongkir, customer mengambil sendiri di workshop Seli Florist.

---

## 🛠️ 3. Daftar Tools MCP (Tools Definition)

### A. Modul Katalog & Pencarian (Public)

#### 1. `list_categories`
* **Deskripsi:** Mengambil daftar semua kategori produk (misal: Bunga Segar, Hampers & Kado, Papan Ucapan).
* **Input Schema:** Tidak memerlukan parameter.
* **Target Endpoint:** `GET /categories`

#### 2. `search_products`
* **Deskripsi:** Mencari dan memfilter produk di katalog Seli Florist (dengan pagination).
* **Input Schema (Zod):**
  ```typescript
  z.object({
    search: z.string().optional().describe("Kata kunci pencarian nama/deskripsi produk"),
    category: z.string().optional().describe("Slug kategori (contoh: 'bunga', 'kado', 'papan_ucapan')"),
    page: z.number().int().min(1).default(1).describe("Nomor halaman"),
    limit: z.number().int().min(1).max(50).default(12).describe("Jumlah item per halaman"),
    minPrice: z.number().optional().describe("Harga minimum (IDR)"),
    maxPrice: z.number().optional().describe("Harga maksimum (IDR)"),
  })
  ```
* **Target Endpoint:** `GET /products?page={page}&limit={limit}&category={category}&search={search}`

#### 3. `get_product_detail`
* **Deskripsi:** Mengambil informasi detail satu produk, termasuk daftar varian harga, foto, dan status stok.
* **Input Schema (Zod):**
  ```typescript
  z.object({
    productId: z.string().uuid().describe("UUID produk yang ingin dilihat"),
  })
  ```
* **Target Endpoint:** `GET /products/{productId}`

---

### B. Modul Rental & Ketersediaan Papan Ucapan

#### 4. `check_rental_availability`
* **Deskripsi:** Memeriksa ketersediaan unit papan ucapan untuk tanggal tertentu sebelum customer melakukan booking.
* **Input Schema (Zod):**
  ```typescript
  z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Tanggal sewa dalam format YYYY-MM-DD"),
  })
  ```
* **Target Endpoint:** `GET /booking/check-availability?date={date}`

#### 5. `get_rental_calendar`
* **Deskripsi:** Melihat kalender jadwal okupansi sewa papan ucapan dalam satu bulan tertentu.
* **Input Schema (Zod):**
  ```typescript
  z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/).describe("Format bulan YYYY-MM, contoh: '2026-10'"),
  })
  ```
* **Target Endpoint:** `GET /booking/calendar?month={month}`

---

### C. Modul Keranjang Belanja (Customer Session)

#### 6. `get_cart`
* **Deskripsi:** Mengambil daftar produk yang ada di keranjang belanja pengguna saat ini.
* **Input Schema (Zod):**
  ```typescript
  z.object({
    token: z.string().describe("Access Token JWT pengguna"),
  })
  ```
* **Target Endpoint:** `GET /cart`

#### 7. `add_to_cart`
* **Deskripsi:** Menambahkan item buket bunga, kado, atau papan ucapan ke keranjang.
* **Input Schema (Zod):**
  ```typescript
  z.object({
    token: z.string().describe("Access Token JWT pengguna"),
    productId: z.string().uuid().describe("UUID produk"),
    qty: z.number().int().min(1).default(1).describe("Jumlah kuantitas"),
    variantId: z.string().uuid().optional().describe("UUID varian produk jika ada"),
    customNote: z.string().max(500).optional().describe("Catatan khusus / pesan ucapan"),
    bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Tanggal sewa mulai (khusus rental)"),
    bookingEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Tanggal sewa selesai (khusus rental)"),
  })
  ```
* **Target Endpoint:** `POST /cart/items`

---

### D. Modul Ongkir & Checkout Pesanan

#### 8. `estimate_shipping`
* **Deskripsi:** Menghitung ongkos kirim ke alamat tujuan customer (otomatis menghitung jarak dari titik workshop toko).
* **Input Schema (Zod):**
  ```typescript
  z.object({
    fullAddress: z.string().min(10).describe("Alamat lengkap pengiriman tujuan"),
    latitude: z.string().optional().describe("Koordinat latitude (default pusat kota jika kosong)"),
    longitude: z.string().optional().describe("Koordinat longitude (default pusat kota jika kosong)"),
  })
  ```
* **Target Endpoint:** `POST /checkout/estimate-ongkir`
* **Payload Body:**
  ```json
  {
    "deliveryType": "DELIVERY",
    "address": { "fullAddress": "...", "latitude": "...", "longitude": "..." }
  }
  ```

#### 9. `create_order`
* **Deskripsi:** Membuat pesanan final dari keranjang belanja atau langsung checkout.
* **Input Schema (Zod):**
  ```typescript
  z.object({
    token: z.string().describe("Access Token JWT pengguna"),
    deliveryType: z.enum(["DELIVERY", "PICKUP"]).describe("Metode pengiriman"),
    customerName: z.string().describe("Nama pemesan"),
    waNumber: z.string().describe("Nomor WhatsApp pemesan"),
    recipientName: z.string().describe("Nama penerima pesanan"),
    recipientPhone: z.string().describe("Nomor telepon penerima"),
    customTextRequest: z.string().optional().describe("Teks ucapan untuk kartu / pita / papan"),
    address: z.object({
      fullAddress: z.string(),
      latitude: z.string().optional(),
      longitude: z.string().optional(),
    }).optional().describe("Wajib diisi jika deliveryType = DELIVERY"),
    items: z.array(z.object({
      productId: z.string().uuid(),
      qty: z.number().int().min(1),
      variantId: z.string().uuid().optional(),
      customNote: z.string().optional(),
      bookingDate: z.string().optional(),
      bookingEndDate: z.string().optional(),
    })).describe("Daftar item produk yang dipesan"),
  })
  ```
* **Target Endpoint:** `POST /checkout` (dengan header `X-Idempotency-Key: <UUID>`)

---

### E. Modul Pelacakan Pesanan & Customer

#### 10. `get_customer_orders`
* **Deskripsi:** Melihat riwayat pesanan milik customer yang sedang login.
* **Input Schema (Zod):**
  ```typescript
  z.object({
    token: z.string().describe("Access Token JWT pengguna"),
    page: z.number().int().min(1).default(1),
    status: z.enum([
      "PENDING_PAYMENT",
      "DP_VERIFIED",
      "PENDING_FINAL_PAYMENT",
      "FULLY_PAID",
      "PROCESSING",
      "COMPLETED",
      "CANCELLED",
      "REJECTED"
    ]).optional().describe("Filter status transaksi"),
  })
  ```
* **Target Endpoint:** `GET /orders?page={page}&status={status}`

#### 11. `get_order_detail`
* **Deskripsi:** Melihat rincian lengkap 1 transaksi: status pembayaran DP, sisa pelunasan, log pengiriman, dan item produk.
* **Input Schema (Zod):**
  ```typescript
  z.object({
    token: z.string().describe("Access Token JWT"),
    orderId: z.string().uuid().describe("UUID order"),
  })
  ```
* **Target Endpoint:** `GET /orders/{orderId}`

#### 12. `cancel_order`
* **Deskripsi:** Membatalkan pesanan yang belum diproses dan menghitung estimasi pengembalian dana (refund) berdasarkan tier jam pembatalan.
* **Input Schema (Zod):**
  ```typescript
  z.object({
    token: z.string().describe("Access Token JWT pengguna"),
    orderId: z.string().uuid().describe("UUID order yang ingin dibatalkan"),
    reason: z.string().min(5).describe("Alasan pembatalan"),
  })
  ```
* **Target Endpoint:** `POST /orders/{orderId}/cancel`

---

### F. Modul Manajemen Admin (Privileged)

#### 13. `admin_list_orders`
* **Deskripsi:** (Role: Owner / Staff / Finance) Menampilkan seluruh antrean pesanan toko untuk diverifikasi atau diproses.
* **Input Schema (Zod):**
  ```typescript
  z.object({
    adminToken: z.string().describe("Access Token Admin"),
    status: z.string().optional().describe("Filter status pesanan"),
    page: z.number().int().default(1),
  })
  ```
* **Target Endpoint:** `GET /admin/orders?page={page}&status={status}`

#### 14. `admin_update_order_status`
* **Deskripsi:** Mengubah status pengerjaan pesanan (misal: memproses rangkaian bunga atau menandai pesanan selesai).
* **Input Schema (Zod):**
  ```typescript
  z.object({
    adminToken: z.string().describe("Access Token Admin"),
    orderId: z.string().uuid().describe("UUID order"),
    action: z.enum(["process", "complete"]).describe("Aksi transisi status pesanan"),
  })
  ```
* **Target Endpoint:** `POST /admin/orders/{orderId}/{action}`

#### 15. `admin_get_financial_reports`
* **Deskripsi:** (Role: Owner / Finance) Menghitung rekapitulasi omzet kotor, HPP, laba bersih, dan volume transaksi dalam rentang tanggal.
* **Input Schema (Zod):**
  ```typescript
  z.object({
    adminToken: z.string().describe("Access Token Admin"),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Tanggal awal YYYY-MM-DD"),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Tanggal akhir YYYY-MM-DD"),
  })
  ```
* **Target Endpoint:** `GET /admin/reports/summary?from={from}&to={to}`

---

## 💻 4. Contoh Starter Code Implementasi MCP Server

Berikut template awal TypeScript jika Anda ingin langsung membuat folder project MCP (misal: `./seli-mcp`):

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const API_BASE = process.env.API_BASE_URL || "http://localhost:3000/api";

const server = new Server(
  {
    name: "seli-florist-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 1. Definisikan Daftar Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_products",
        description: "Cari produk buket bunga, hampers kado, atau papan ucapan di Seli Florist",
        inputSchema: {
          type: "object",
          properties: {
            search: { type: "string", description: "Kata kunci nama bunga/produk" },
            category: { type: "string", description: "Slug kategori (bunga, kado, papan_ucapan)" },
            page: { type: "number", default: 1 },
          },
        },
      },
      {
        name: "check_rental_availability",
        description: "Cek ketersediaan unit papan ucapan untuk tanggal tertentu (YYYY-MM-DD)",
        inputSchema: {
          type: "object",
          required: ["date"],
          properties: {
            date: { type: "string", description: "Tanggal sewa (format YYYY-MM-DD)" },
          },
        },
      },
      {
        name: "estimate_shipping",
        description: "Hitung ongkos kirim pengiriman kurir ke alamat tujuan",
        inputSchema: {
          type: "object",
          required: ["fullAddress"],
          properties: {
            fullAddress: { type: "string", description: "Alamat lengkap pengiriman" },
          },
        },
      },
    ],
  };
});

// 2. Eksekusi Panggilan Tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "search_products") {
      const params = new URLSearchParams();
      if (args?.search) params.append("search", String(args.search));
      if (args?.category) params.append("category", String(args.category));
      
      const res = await fetch(`${API_BASE}/products?${params.toString()}`);
      const data = await res.json();
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    if (name === "check_rental_availability") {
      const res = await fetch(`${API_BASE}/booking/check-availability?date=${args?.date}`);
      const data = await res.json();
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    if (name === "estimate_shipping") {
      const res = await fetch(`${API_BASE}/checkout/estimate-ongkir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryType: "DELIVERY",
          address: { fullAddress: args?.fullAddress },
        }),
      });
      const data = await res.json();
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    throw new Error(`Tool tidak ditemukan: ${name}`);
  } catch (error) {
    return {
      isError: true,
      content: [{ type: "text", text: `Error executing ${name}: ${(error as Error).message}` }],
    };
  }
});

// 3. Jalankan Server via STDIO
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Seli Florist MCP Server running on STDIO");
}

main().catch(console.error);
```
