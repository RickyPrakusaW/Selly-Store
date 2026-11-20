"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  ChevronDown,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { fetchProducts } from "@/lib/api";
import { subscribeToCatalogChanges } from "@/lib/catalog-events";
import { useSeliStore } from "@/lib/store";
import type { Category, Product } from "@/lib/types";
import { ProductCard } from "./product-card";

type ProductSort = "featured" | "price-asc" | "price-desc" | "name";
type ProductType = "all" | "ready" | "preorder" | "rental";
type PriceRange = "all" | "under-300" | "300-500" | "above-500";

interface DropdownOption<T extends string> {
  value: T;
  label: string;
  shortLabel?: string;
}

const TYPE_OPTIONS: readonly DropdownOption<ProductType>[] = [
  { value: "all", label: "Semua jenis", shortLabel: "Semua" },
  { value: "ready", label: "Ready stock", shortLabel: "Ready" },
  { value: "preorder", label: "Pre-order", shortLabel: "PO" },
  { value: "rental", label: "Rental papan", shortLabel: "Rental" },
];

const PRICE_OPTIONS: readonly DropdownOption<PriceRange>[] = [
  { value: "all", label: "Semua harga", shortLabel: "Semua" },
  { value: "under-300", label: "< Rp300rb", shortLabel: "<300rb" },
  { value: "300-500", label: "Rp300rb–500rb", shortLabel: "300-500rb" },
  { value: "above-500", label: "> Rp500rb", shortLabel: ">500rb" },
];

const SORT_OPTIONS: readonly DropdownOption<ProductSort>[] = [
  { value: "featured", label: "Rekomendasi", shortLabel: "Rekomendasi" },
  { value: "price-asc", label: "Harga terendah", shortLabel: "Termurah" },
  { value: "price-desc", label: "Harga tertinggi", shortLabel: "Termahal" },
  { value: "name", label: "Nama A–Z", shortLabel: "A–Z" },
];

function CatalogDropdown<T extends string>({
  label,
  value,
  options,
  onChange,
  icon: Icon,
  alignRight = false,
}: {
  label: string;
  value: T;
  options: readonly DropdownOption<T>[];
  onChange: (val: T) => void;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  alignRight?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const selectedOption = options.find((o) => o.value === value) ?? options[0];
  const selectedLabel = selectedOption?.label ?? "";
  const isFiltered = value !== "all" && value !== "featured";
  const mobileLabel = isFiltered
    ? (selectedOption?.shortLabel ?? selectedLabel)
    : label;

  return (
    <div
      className={`catalog-dropdown-wrap ${open ? "is-open" : ""} ${
        isFiltered ? "is-filtered" : ""
      }`}
      ref={dropdownRef}
    >
      <button
        type="button"
        className="catalog-dropdown-trigger"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${selectedLabel}`}
      >
        {Icon && <Icon size={13} className="dropdown-trigger-icon" />}
        <span className="dropdown-trigger-content">
          <span className="dropdown-desktop-text">
            <span className="dropdown-trigger-label">{label}:</span>{" "}
            <span className="dropdown-trigger-value">{selectedLabel}</span>
          </span>
          <span className="dropdown-mobile-text">{mobileLabel}</span>
        </span>
        {isFiltered && (
          <span className="dropdown-active-dot" aria-hidden="true" />
        )}
        <ChevronDown
          size={13}
          className={`dropdown-chevron ${open ? "rotated" : ""}`}
        />
      </button>

      {open && (
        <>
          <div
            className="catalog-dropdown-backdrop"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            className={`catalog-dropdown-popover ${alignRight ? "align-right" : ""}`}
            role="listbox"
            aria-label={`Pilihan ${label}`}
          >
            <div className="catalog-sheet-header">
              <div className="catalog-sheet-bar" aria-hidden="true" />
              <div className="catalog-sheet-title-row">
                <span className="catalog-sheet-title">Pilih {label}</span>
                <button
                  type="button"
                  className="catalog-sheet-close"
                  onClick={() => setOpen(false)}
                  aria-label="Tutup"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="catalog-dropdown-options">
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`catalog-dropdown-item ${isSelected ? "selected" : ""}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                  >
                    <span>{opt.label}</span>
                    {isSelected && (
                      <Check size={15} className="item-check-icon" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const fallbackProducts = [
  {
    name: "Buket Mawar Pink",
    price: "Rp 275.000",
    dp: "Rp 137.500",
    image: "/images/stitch/product-blush.jpg",
    tag: "Ready Stock",
  },
  {
    name: "Hydrangea & Baby Breath",
    price: "Rp 450.000",
    dp: "Rp 225.000",
    image: "/images/stitch/product-pastel.jpg",
    tag: "Pre-Order",
  },
  {
    name: "Hampers Bunga & Cokelat",
    price: "Rp 385.000",
    dp: "Rp 192.500",
    image: "/images/stitch/product-hamper.jpg",
    tag: "Ready Stock",
  },
  {
    name: "Rental Akrilik Bunga Asli",
    price: "Rp 650.000 / hari",
    dp: "Rp 325.000",
    image: "/images/stitch/product-board.jpg",
    tag: "Rental",
  },
] as const;

function productType(product: Product): Exclude<ProductType, "all"> {
  const stockType = product.stockType?.toString().toLowerCase() ?? "";
  if (product.productMode === "RENTAL" || stockType.includes("rental")) {
    return "rental";
  }
  if (stockType.includes("pre")) return "preorder";
  return "ready";
}

export function HomeCatalog({
  initialProducts,
  categories,
}: Readonly<{ initialProducts: Product[]; categories: Category[] }>) {
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<ProductSort>("featured");
  const [type, setType] = useState<ProductType>("all");
  const [priceRange, setPriceRange] = useState<PriceRange>("all");
  const deferredSearch = useDeferredValue(search.trim());
  const queryClient = useQueryClient();
  const searchOpen = useSeliStore((state) => state.searchOpen);
  const setSearchOpen = useSeliStore((state) => state.setSearchOpen);

  const { data = initialProducts, isFetching } = useQuery({
    queryKey: ["products", deferredSearch, category],
    queryFn: () => fetchProducts(deferredSearch, category),
    initialData: !deferredSearch && !category ? initialProducts : undefined,
    staleTime: 60_000,
    refetchOnMount: initialProducts.length === 0 ? "always" : false,
    refetchOnWindowFocus: false,
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

  useEffect(() => {
    if (!searchOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [searchOpen, setSearchOpen]);

  const visibleProducts = useMemo(() => {
    const filteredByType =
      type === "all"
        ? [...data]
        : data.filter((product) => productType(product) === type);
    const filtered = filteredByType.filter((product) => {
      const price = Number(product.basePrice);
      if (priceRange === "under-300") return price < 300_000;
      if (priceRange === "300-500") return price >= 300_000 && price <= 500_000;
      if (priceRange === "above-500") return price > 500_000;
      return true;
    });

    if (sort === "price-asc") {
      return filtered.sort((a, b) => Number(a.basePrice) - Number(b.basePrice));
    }
    if (sort === "price-desc") {
      return filtered.sort((a, b) => Number(b.basePrice) - Number(a.basePrice));
    }
    if (sort === "name") {
      return filtered.sort((a, b) => a.name.localeCompare(b.name, "id"));
    }
    return filtered;
  }, [data, priceRange, sort, type]);

  const hasFilters = Boolean(
    deferredSearch ||
      category ||
      type !== "all" ||
      priceRange !== "all" ||
      sort !== "featured",
  );

  const resetFilters = () => {
    setSearch("");
    setCategory("");
    setType("all");
    setPriceRange("all");
    setSort("featured");
  };

  const submitSearch = () => {
    setSearchOpen(false);
    document.getElementById("koleksi")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {searchOpen && (
        <div
          className="search-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Cari produk"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setSearchOpen(false);
          }}
        >
          <form
            className="search-panel"
            onSubmit={(event) => {
              event.preventDefault();
              submitSearch();
            }}
          >
            <Search size={20} aria-hidden="true" />
            <input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari buket, hampers, atau papan ucapan"
              aria-label="Pencarian produk"
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label="Tutup pencarian"
            >
              <X size={20} />
            </button>
          </form>
        </div>
      )}

      <section
        className="home-section home-catalog"
        id="koleksi"
        aria-labelledby="catalog-title"
      >
        <div className="home-shell">
          <div className="home-catalog-heading">
            <div className="home-heading">
              <p>
                <Sparkles size={14} /> Katalog lengkap LICHARY
              </p>
              <h2 id="catalog-title">Temukan Rangkaian yang Tepat</h2>
              <span>
                Jelajahi seluruh koleksi bunga, hampers, dan papan ucapan yang
                tersedia.
              </span>
            </div>
            <a href="#catalog-products">
              Lihat semua produk <ArrowRight size={15} />
            </a>
          </div>

          <div className="home-catalog-panel" id="semua-produk">
            <div className="home-catalog-search-row">
              <label className="home-product-search">
                <Search size={17} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari nama atau jenis produk…"
                  aria-label="Cari produk"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Hapus pencarian"
                  >
                    <X size={15} />
                  </button>
                )}
              </label>

              <div className="home-filter-controls">
                <CatalogDropdown
                  label="Jenis"
                  value={type}
                  options={TYPE_OPTIONS}
                  onChange={setType}
                  icon={SlidersHorizontal}
                />

                <CatalogDropdown
                  label="Harga"
                  value={priceRange}
                  options={PRICE_OPTIONS}
                  onChange={setPriceRange}
                />

                <CatalogDropdown
                  label="Urutan"
                  value={sort}
                  options={SORT_OPTIONS}
                  onChange={setSort}
                  alignRight
                />
              </div>
            </div>

            {categories.length > 0 ? (
              <div className="home-filter-row">
                <div className="home-filter-row-header">
                  <span>Kategori</span>
                  {hasFilters && (
                    <button
                      className="home-reset-filter mobile-only"
                      type="button"
                      onClick={resetFilters}
                      aria-label="Reset semua filter"
                    >
                      <RotateCcw size={12} /> Reset
                    </button>
                  )}
                </div>
                <div className="home-filter-pills" aria-label="Filter kategori">
                  <button
                    className={!category ? "active" : ""}
                    onClick={() => setCategory("")}
                    type="button"
                  >
                    Semua
                  </button>
                  {categories.map((item) => (
                    <button
                      className={category === item.slug ? "active" : ""}
                      onClick={() => setCategory(item.slug)}
                      type="button"
                      key={item.id}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
                {hasFilters && (
                  <button
                    className="home-reset-filter desktop-only"
                    type="button"
                    onClick={resetFilters}
                    aria-label="Reset semua filter"
                  >
                    <RotateCcw size={12} /> Reset
                  </button>
                )}
              </div>
            ) : hasFilters ? (
              <div className="home-filter-row home-filter-row-reset-only">
                <button
                  className="home-reset-filter"
                  type="button"
                  onClick={resetFilters}
                  style={{ marginLeft: "auto" }}
                >
                  <RotateCcw size={12} /> Reset Filter
                </button>
              </div>
            ) : null}
          </div>

          <div className="home-catalog-summary">
            <p aria-live="polite">
              {isFetching ? (
                "Memperbarui katalog…"
              ) : (
                <><b>{visibleProducts.length}</b> produk ditemukan</>
              )}
            </p>
            <span>Harga belum termasuk ongkir • DP 50% tersedia</span>
          </div>

          {visibleProducts.length > 0 ? (
            <div className="product-grid" id="catalog-products">
              {visibleProducts.map((product, index) => (
                <ProductCard
                  product={product}
                  priority={index < 4}
                  key={product.id}
                />
              ))}
            </div>
          ) : data.length > 0 || deferredSearch || category || type !== "all" || priceRange !== "all" ? (
            <div className="home-catalog-empty">
              <Search size={28} aria-hidden="true" />
              <h3>Produk belum ditemukan</h3>
              <p>Coba kata yang lebih singkat atau ubah filter yang digunakan.</p>
              <button type="button" onClick={resetFilters}>
                Tampilkan semua produk
              </button>
            </div>
          ) : (
            <div className="product-grid home-fallback-grid" id="catalog-products">
              {fallbackProducts.map((product) => (
                <article className="home-fallback-product" key={product.name}>
                  <div className="home-fallback-image">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 680px) 46vw, 23vw"
                    />
                    <span>{product.tag}</span>
                  </div>
                  <div>
                    <small>Pilihan florist</small>
                    <h3>{product.name}</h3>
                    <strong>{product.price}</strong>
                    <p>DP 50%: <b>{product.dp}</b></p>
                    <a href="#kontak">
                      Pesan via florist <ArrowRight size={14} />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
