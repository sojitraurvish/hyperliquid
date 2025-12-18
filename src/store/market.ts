import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

type MarketStore = {
  selectedMarket: string | null;
  
  setSelectedMarket: (coin: string) => void;
  getSelectedMarket: () => string | null;
};

export const useMarketStore = create<MarketStore>()(
  devtools(
    persist(
      (set, get) => ({
        selectedMarket: null,

        setSelectedMarket: (coin: string) => {
          set({ selectedMarket: coin });
        },

        getSelectedMarket: () => {
          return get().selectedMarket;
        },
      }),
      {
        name: "market-store",
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          selectedMarket: state.selectedMarket,
        }),
      }
    )
  )
);

