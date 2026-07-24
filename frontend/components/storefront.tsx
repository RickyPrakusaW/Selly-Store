"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Flower2, Search, X } from "lucide-react";
import { useDeferredValue, useEffect, useState } from "react";
import { fetchProducts } from "@/lib/api";
import { subscribeToCatalogChanges } from "@/lib/catalog-events";
import { useSeliStore } from "@/lib/store";
import type { Category, Product } from "@/lib/types";
import { ProductCard } from "./product-card";

export function Storefront({
  initialProducts,
  categories,
}: Readonly<{ initialProducts: Product[]; categories: Category[] }>) {
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const queryClient = useQueryClient();
  const searchOpen = useSeliStore((state) => state.searchOpen);
  const setSearchOpen = useSeliStore((state) => state.setSearchOpen);
  const { data = initialProducts, isFetching } = useQuery({
    queryKey: ["products", deferredSearch, category],
    queryFn: () => fetchProducts(deferredSearch, category),
    initialData: !deferredSearch && !category ? initialProducts : undefined,
    staleTime: 0,
    refetchInterval: 3000,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
  });

  useEffect(
    () =>
      subscribeToCatalogChanges(() => {
        void queryClient.invalidateQueries({
          queryKey: ["products"],
          refetchType: "active",
        });
      }),
    [queryClient],
  );

  return (
    <>
      {searchOpen && (
        <div className="search-overlay">
          <div className="search-panel">
            <Search />
            <input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari buket, kado, atau papan ucapan…"
              aria-label="Pencarian produk"
            />
            <button
              onClick={() => setSearchOpen(false)}
              aria-label="Tutup pencarian"
            >
              <X />
            </button>
          </div>
        </div>
      )}
      <main>
        <section className="hero shell">
          <div className="hero-copy">
            <p className="eyebrow">Dirangkai dengan sepenuh hati</p>
            <h1>
              Bunga untuk setiap <em>cerita indah.</em>
            </h1>
            <p>
              Rangkaian segar, hadiah penuh makna, dan papan ucapan untuk
              merayakan momen yang tak terlupakan.
            </p>
            <a href="#koleksi" className="primary-button">
              Jelajahi Koleksi <ArrowRight size={18} />
            </a>
            <div className="hero-trust">
              <span>
                <b>4.9/5</b> pelanggan bahagia
              </span>
              <span>
                <b>Same day</b> area terpilih
              </span>
            </div>
          </div>
          <div
            className="hero-art"
            aria-label="Ilustrasi rangkaian bunga Seli Florist"
          >
            <div className="petal petal-one" />
            <div className="petal petal-two" />
            <div className="bouquet-symbol">
              <Flower2 aria-hidden="true" />
            </div>
            <div className="glass-note">
              <b>Freshly picked</b>
              <span>Dirangkai hari ini</span>
            </div>
          </div>
        </section>
        <section className="category-strip shell" aria-label="Kategori produk">
          <button
            className={!category ? "active" : ""}
            onClick={() => setCategory("")}
          >
            Semua
          </button>
          {categories.map((item) => (
            <button
              className={category === item.slug ? "active" : ""}
              key={item.id}
              onClick={() => setCategory(item.slug)}
            >
              {item.name}
            </button>
          ))}
        </section>
        <section className="collection shell" id="koleksi">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Pilihan kesayangan</p>
              <h2>Temukan bunga favoritmu</h2>
            </div>
            <span>{isFetching ? "Memuat…" : `${data.length} produk`}</span>
          </div>
          {data.length ? (
            <div className="product-grid">
              {data.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={idx < 4}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Search />
              <h3>Belum ada produk yang cocok</h3>
              <p>Coba kata kunci atau kategori lain.</p>
            </div>
          )}
        </section>
        <section className="promise shell">
          <div>
            <span>01</span>
            <h3>Bunga Segar</h3>
            <p>Dipilih dan dirangkai dekat waktu pengiriman.</p>
          </div>
          <div>
            <span>02</span>
            <h3>Sentuhan Personal</h3>
            <p>Tambahkan pesan untuk orang tersayang.</p>
          </div>
          <div>
            <span>03</span>
            <h3>Pengiriman Hangat</h3>
            <p>Kami menjaga setiap rangkaian hingga tiba.</p>
          </div>
        </section>
      </main>
    </>
  );
}
