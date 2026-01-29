import { SelectedMarket } from "@/types/market";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { ROUTES } from "@/lib/config";

type MarketStore = {
  selectedMarket: SelectedMarket | null;
  
  setSelectedMarket: (selectedMarket: SelectedMarket, updateUrl?: boolean) => void;
  
  markPrice: number | null;
  setMarkPrice: (markPrice: number | null) => void;
};

export const useMarketStore = create<MarketStore>()(
  devtools(
    persist(
      (set, get) => ({
        selectedMarket: null,

        setSelectedMarket: (selectedMarket: SelectedMarket, updateUrl: boolean = true) => {
          set({ selectedMarket });
          
          // Update URL if we're on the trade page and updateUrl is true
          if (updateUrl && typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            const marketCoin = selectedMarket.coin.toUpperCase();
            
            // Only update URL if we're on trade page
            if (currentPath.startsWith('/trade')) {
              const newPath = `${ROUTES.TRADE}/${marketCoin}`;
              // Use replaceState to update URL without adding to history
              // This prevents back button from going through every market change
              window.history.replaceState(null, '', newPath);
            }
          }
        },

        markPrice: null,
        setMarkPrice: (markPrice: number | null) => {
          set({ markPrice });
        },
      }),
      {
        name: "market-store",
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          selectedMarket: state.selectedMarket,
          // Don't persist markPrice as it is real-time data
        }),
      }
    )
  )
);

