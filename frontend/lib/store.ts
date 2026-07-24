"use client";

import { create } from "zustand";
import type { AddCartItemPayload, CartItem, Product, User } from "./types";
import {
  addCartItem as apiAddCartItem,
  clearCart as apiClearCart,
  fetchCart as apiFetchCart,
  removeCartItem as apiRemoveCartItem,
  syncCart as apiSyncCart,
  updateCartItem as apiUpdateCartItem,
  logout as apiLogout,
  setAccessToken,
} from "./api";

/** Local-only cart line for guest users */
type GuestCartLine = {
  product: Product;
  qty: number;
  variantId?: string;
  customNote?: string;
  bookingDate?: string;
  bookingEndDate?: string;
};

type Store = {
  /* ── Auth ── */
  user: User | null;
  setUser: (user: User | null) => void;
  logoutUser: () => Promise<void>;

  /* ── Cart (backend-synced for logged-in, local for guest) ── */
  cartItems: CartItem[];
  guestCart: GuestCartLine[];
  cartLoading: boolean;
  cartCount: number;

  loadCart: () => Promise<void>;
  addToCart: (
    product: Product,
    variantId?: string,
    qty?: number,
    opts?: {
      customNote?: string;
      bookingDate?: string;
      bookingEndDate?: string;
    },
  ) => Promise<void>;
  updateQuantity: (itemId: string, qty: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  syncGuestCart: () => Promise<void>;

  /* ── UI ── */
  searchOpen: boolean;
  authOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  setAuthOpen: (open: boolean) => void;

  /* ── Toast ── */
  toast: { message: string; type: "success" | "error" | "info" } | null;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  clearToast: () => void;
};

const getInitialUser = (): User | null => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("seli_user");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        /* ignore */
      }
    }
  }
  return null;
};

export const useSeliStore = create<Store>((set, get) => ({
  /* ── Auth ── */
  user: getInitialUser(),
  setUser: (user) => {
    if (typeof window !== "undefined") {
      if (user) {
        localStorage.setItem("seli_user", JSON.stringify(user));
      } else {
        localStorage.removeItem("seli_user");
      }
    }
    set({ user });
  },
  logoutUser: async () => {
    try {
      await apiLogout();
    } catch {
      /* ignore */
    }
    setAccessToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("seli_user");
    }
    set({ user: null, cartItems: [], cartCount: 0 });
  },

  /* ── Cart ── */
  cartItems: [],
  guestCart: [],
  cartLoading: false,
  cartCount: 0,

  loadCart: async () => {
    if (!get().user) return;
    set({ cartLoading: true });
    try {
      const cart = await apiFetchCart();
      const items = Array.isArray(cart) ? cart : (cart?.items ?? []);
      set({
        cartItems: items,
        cartCount: items.reduce((s, i) => s + i.qty, 0),
      });
    } catch {
      /* user might not be logged in */
    }
    set({ cartLoading: false });
  },

  addToCart: async (product, variantId, qty = 1, opts) => {
    const { user } = get();
    const optionalFields = {
      ...(variantId ? { variantId } : {}),
      ...(opts?.customNote ? { customNote: opts.customNote } : {}),
      ...(opts?.bookingDate ? { bookingDate: opts.bookingDate } : {}),
      ...(opts?.bookingEndDate ? { bookingEndDate: opts.bookingEndDate } : {}),
    };
    if (user) {
      try {
        const payload: AddCartItemPayload = {
          productId: product.id,
          qty,
          ...optionalFields,
        };
        await apiAddCartItem(payload);
        await get().loadCart();
        get().showToast("Ditambahkan ke keranjang!");
      } catch (err) {
        get().showToast(
          err instanceof Error ? err.message : "Gagal menambahkan",
          "error",
        );
      }
    } else {
      // Guest cart — store locally
      const guestCart = [...get().guestCart];
      const existing = guestCart.find(
        (line) =>
          line.product.id === product.id && line.variantId === variantId,
      );
      if (existing) {
        existing.qty += qty;
      } else {
        guestCart.push({ product, qty, ...optionalFields });
      }
      set({ guestCart, cartCount: guestCart.reduce((s, l) => s + l.qty, 0) });
      get().showToast("Ditambahkan ke keranjang!");
    }
  },

  updateQuantity: async (itemId, qty) => {
    const { user } = get();
    if (user) {
      try {
        await apiUpdateCartItem(itemId, { qty });
        await get().loadCart();
      } catch (err) {
        get().showToast(
          err instanceof Error ? err.message : "Gagal update",
          "error",
        );
      }
    } else {
      const guestCart = get().guestCart.map((line, i) =>
        i === Number(itemId) ? { ...line, qty } : line,
      );
      set({ guestCart, cartCount: guestCart.reduce((s, l) => s + l.qty, 0) });
    }
  },

  removeFromCart: async (itemId) => {
    const { user } = get();
    if (user) {
      try {
        await apiRemoveCartItem(itemId);
        await get().loadCart();
        get().showToast("Item dihapus dari keranjang");
      } catch (err) {
        get().showToast(
          err instanceof Error ? err.message : "Gagal menghapus",
          "error",
        );
      }
    } else {
      const guestCart = get().guestCart.filter((_, i) => i !== Number(itemId));
      set({ guestCart, cartCount: guestCart.reduce((s, l) => s + l.qty, 0) });
    }
  },

  clearCart: async () => {
    const { user } = get();
    if (user) {
      try {
        await apiClearCart();
        set({ cartItems: [], cartCount: 0 });
      } catch {
        /* ignore */
      }
    } else {
      set({ guestCart: [], cartCount: 0 });
    }
  },

  syncGuestCart: async () => {
    const { guestCart } = get();
    if (guestCart.length === 0) return;
    try {
      await apiSyncCart({
        items: guestCart.map((line) => ({
          productId: line.product.id,
          qty: line.qty,
          ...(line.variantId ? { variantId: line.variantId } : {}),
          ...(line.customNote ? { customNote: line.customNote } : {}),
          ...(line.bookingDate ? { bookingDate: line.bookingDate } : {}),
          ...(line.bookingEndDate
            ? { bookingEndDate: line.bookingEndDate }
            : {}),
        })),
      });
      set({ guestCart: [] });
      await get().loadCart();
    } catch {
      /* ignore sync errors */
    }
  },

  /* ── UI ── */
  searchOpen: false,
  authOpen: false,
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setAuthOpen: (authOpen) => set({ authOpen }),

  /* ── Toast ── */
  toast: null,
  showToast: (message, type = "success") => {
    set({ toast: { message, type } });
    setTimeout(() => set({ toast: null }), 3500);
  },
  clearToast: () => set({ toast: null }),
}));
