import { SelectedMarket } from "@/types/market";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

type MarketStore = {
  selectedMarket: SelectedMarket | null;
  
  setSelectedMarket: (selectedMarket: SelectedMarket) => void;
};

export const useMarketStore = create<MarketStore>()(
  devtools(
    persist(
      (set) => ({
        selectedMarket: null,

        setSelectedMarket: (selectedMarket: SelectedMarket) => {
          set({ selectedMarket });
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

