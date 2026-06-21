import { create } from 'zustand';

export type CartItem = {
  id: string;
  menuItemId: number;
  name: string;
  price: number;
  size: string;
  milk: string;
  addOns: string[];
  qty: number;
  imageUrl: string | null;
  temperature: 'Hot' | 'Cold' | null;
};

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'qty'>) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, delta: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],

  addItem: (item) =>
    set((state) => {
      const key = `${item.id}-${item.size}-${item.milk}-${item.addOns.join(',')}-${item.temperature ?? ''}`;
      const existing = state.items.find((i) => i.id === key);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === key ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      return { items: [...state.items, { ...item, id: key, qty: 1 }] };
    }),

  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

  updateQty: (id, delta) =>
    set((state) => ({
      items: state.items
        .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0),
    })),

  clear: () => set({ items: [] }),
}));
