"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

import type { ParamCode } from "@/lib/pattern-domain";

/**
 * Корзина на zustand + localStorage (T-28, FR-5.1).
 *
 * В позиции хранится всё, что нужно для заказа и восстановления после
 * перезагрузки: выкройка, размер, нормализованный вариант и выбранные параметры.
 * `hydrated` не даёт отрисовать счётчик на сервере и получить расхождение SSR.
 */

export interface CartItem {
  key: string;
  patternId: string;
  slug: string;
  title: string;
  price: number;
  sizeLabel: string;
  variantKey: string;
  variantTitle: string;
  selection: Partial<Record<ParamCode, string>>;
}

interface CartState {
  items: CartItem[];
  hydrated: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  setHydrated: () => void;
}

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      hydrated: false,
      addItem: (item) =>
        set((state) =>
          state.items.some((current) => current.key === item.key)
            ? state
            : { items: [...state.items, item] },
        ),
      removeItem: (key) =>
        set((state) => ({ items: state.items.filter((item) => item.key !== key) })),
      clear: () => set({ items: [] }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "sewit-cart-v1",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? noopStorage : window.localStorage,
      ),
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
