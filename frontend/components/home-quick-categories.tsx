"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { Category } from "@/lib/types";

export const HOME_CATEGORY_FILTER_EVENT = "lichary:home-category-filter";
export const HOME_CATEGORY_STATE_EVENT = "lichary:home-category-state";

export type HomeCategoryFilterDetail = {
  key: string;
  category: string;
  search: string;
};

const QUICK_CATEGORIES = [
  {
    key: "bouquet",
    label: "Buket Bunga",
    iconSrc: "/icons/buket-bunga.webp",
    categoryCandidates: ["buket_bunga", "buket", "bunga"],
    fallbackCategory: "bunga",
    search: "",
  },
  {
    key: "board",
    label: "Papan Ucapan",
    iconSrc: "/icons/papan-ucapan.webp",
    categoryCandidates: ["papan_ucapan", "papan-bunga", "papan"],
    fallbackCategory: "papan_ucapan",
    search: "",
  },
  {
    key: "hampers",
    label: "Hampers",
    iconSrc: "/icons/hampers.webp",
    categoryCandidates: ["hampers", "hampers_kado", "kado"],
    fallbackCategory: "kado",
    search: "",
  },
  {
    key: "artificial",
    label: "Bunga Artificial",
    iconSrc: "/icons/bunga-artificial.webp",
    categoryCandidates: ["bunga_artificial", "artificial"],
    fallbackCategory: "bunga",
    search: "artificial",
  },
  {
    key: "fresh",
    label: "Bunga Segar",
    iconSrc: "/icons/bunga-segar.webp",
    categoryCandidates: ["bunga_segar", "bunga-segar", "bunga"],
    fallbackCategory: "bunga",
    search: "",
  },
  {
    key: "decoration",
    label: "Dekorasi Acara",
    iconSrc: "/icons/dekorasi-acara.webp",
    categoryCandidates: ["dekorasi_acara", "dekorasi-acara", "dekorasi"],
    fallbackCategory: "",
    search: "dekorasi",
  },
  {
    key: "all",
    label: "Lainnya",
    iconSrc: "/icons/lainnya.webp",
    categoryCandidates: [],
    fallbackCategory: "",
    search: "",
  },
] as const;

function normalizeCategory(value: string) {
  return value.toLowerCase().trim().replace(/[\s-]+/g, "_");
}

export function HomeQuickCategories({
  categories,
}: Readonly<{ categories: Category[] }>) {
  const [activeKey, setActiveKey] = useState("");

  const items = useMemo(
    () =>
      QUICK_CATEGORIES.map((item) => {
        const match = categories.find((category) => {
          const slug = normalizeCategory(category.slug);
          const name = normalizeCategory(category.name);
          return item.categoryCandidates.some((candidate) => {
            const normalizedCandidate = normalizeCategory(candidate);
            return slug === normalizedCandidate || name.includes(normalizedCandidate);
          });
        });

        return {
          ...item,
          category: match?.slug ?? item.fallbackCategory,
          search: match ? "" : item.search,
        };
      }),
    [categories],
  );

  useEffect(() => {
    const syncActiveCategory = (event: Event) => {
      const detail = (event as CustomEvent<HomeCategoryFilterDetail>).detail;
      setActiveKey(detail?.key ?? "");
    };
    window.addEventListener(HOME_CATEGORY_STATE_EVENT, syncActiveCategory);
    return () =>
      window.removeEventListener(HOME_CATEGORY_STATE_EVENT, syncActiveCategory);
  }, []);

  const selectCategory = (detail: HomeCategoryFilterDetail) => {
    setActiveKey(detail.key);
    window.dispatchEvent(
      new CustomEvent<HomeCategoryFilterDetail>(HOME_CATEGORY_FILTER_EVENT, {
        detail,
      }),
    );
    document.getElementById("koleksi")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="category-bar-items" role="list">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="listitem"
          className={`category-pill-card ${activeKey === item.key ? "active" : ""}`}
          aria-pressed={activeKey === item.key}
          onClick={() =>
            selectCategory({
              key: item.key,
              category: item.category,
              search: item.search,
            })
          }
        >
          <Image
            src={item.iconSrc}
            alt=""
            width={72}
            height={72}
            className="category-icon"
          />
          <span className="category-pill-name">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
