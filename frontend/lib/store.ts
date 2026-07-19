'use client';

import { create } from 'zustand';
import type { Product, User } from './types';

type CartLine = { product: Product; quantity: number };

type Store = {
  user: User | null;
  cart: CartLine[];
  searchOpen: boolean;
  authOpen: boolean;
  setUser: (user: User | null) => void;
  addToCart: (product: Product) => void;
  setSearchOpen: (open: boolean) => void;
  setAuthOpen: (open: boolean) => void;
};

export const useSeliStore = create<Store>((set) => ({
  user: null,
  cart: [],
  searchOpen: false,
  authOpen: false,
  setUser: (user) => set({ user }),
  addToCart: (product) =>
    set((state) => {
      const existing = state.cart.find((line) => line.product.id === product.id);
      return {
        cart: existing
          ? state.cart.map((line) =>
              line.product.id === product.id
                ? { ...line, quantity: line.quantity + 1 }
                : line,
            )
          : [...state.cart, { product, quantity: 1 }],
      };
    }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setAuthOpen: (authOpen) => set({ authOpen }),
}));
