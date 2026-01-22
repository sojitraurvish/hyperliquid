import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface OrderBookData {
  price: string;
  size: string;
  total: string;
}

type OrderBookStore = {
  asks: OrderBookData[];
  bids: OrderBookData[];
  setAsks: (asks: OrderBookData[] | ((prev: OrderBookData[]) => OrderBookData[])) => void;
  setBids: (bids: OrderBookData[] | ((prev: OrderBookData[]) => OrderBookData[])) => void;
  getAsks: () => OrderBookData[];
  getBids: () => OrderBookData[];
};

export const useOrderBookStore = create<OrderBookStore>()(
  devtools(
    (set, get) => ({
      asks: [],
      bids: [],

      setAsks: (asks) => {
        if (typeof asks === 'function') {
          set((state) => ({ asks: asks(state.asks) }));
        } else {
          set({ asks });
        }
      },

      setBids: (bids) => {
        if (typeof bids === 'function') {
          set((state) => ({ bids: bids(state.bids) }));
        } else {
          set({ bids });
        }
      },

      getAsks: () => {
        return get().asks;
      },

      getBids: () => {
        return get().bids;
      },
    })
  )
);

