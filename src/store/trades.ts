import { placeOrderWithAgent, updateMarginAndLeverage } from "@/lib/services/trading-panel";
import { MarginAndLeverage, MarginLeverageValue } from "@/types/trading-panel";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { errorHandler } from "./errorHandler";

export interface TradeData {
  price: number;
  size: string;
  time: string;
  isBuy: boolean;
  timestamp: number;
  txnHash: string;
}

type TradesStore = {

  isError: string | null;

  trades: TradeData[];
  setTrades: (trades: TradeData[]) => void;
  getTrades: () => TradeData[];


  marginAndLeverage: MarginAndLeverage;
  isUpdatingMarginAndLeverage: boolean; 
  updateMarginAndLeverage: ({currentCurrency, agentPrivateKey, marginMode, leverage}: {currentCurrency: string, agentPrivateKey: `0x${string}`, marginMode: string, leverage: number}) => Promise<boolean>;
  getMarginAndLeverage: (selectedMarket: string) => MarginLeverageValue | undefined;

  isPlacingOrderWithAgent: boolean;
  placeOrderWithAgent: ({agentPrivateKey, a, b, s, p, r}: {agentPrivateKey: `0x${string}`, a: string, b: boolean, s: string, p: string, r: boolean}) => Promise<boolean>;
};

export const useTradesStore = create<TradesStore>()(
  devtools(
    persist(
    (set, get) => ({
      isError: null,
      trades: [],

      setTrades: (trades: TradeData[]) => {
        set({ trades });
      },

      getTrades: () => {
        return get().trades;
      },

      marginAndLeverage: {},
      isUpdatingMarginAndLeverage: false,
      updateMarginAndLeverage: async ({currentCurrency, agentPrivateKey, marginMode, leverage}) => {
        set({ isUpdatingMarginAndLeverage: true });
        try {
          const resp = await updateMarginAndLeverage({currentCurrency, agentPrivateKey, marginMode, leverage});

          if (resp.status === "ok") {
            set({ marginAndLeverage: { ...get().marginAndLeverage, [currentCurrency]: { marginMode, leverage } } });
            set({ isUpdatingMarginAndLeverage: false });
            return true;
          } else {
            set({ isError: resp.response.type, isUpdatingMarginAndLeverage: false });
            return false;
          }
        } catch (error) {
          set({ isError: errorHandler(error), isUpdatingMarginAndLeverage: false });
          return false;
        } finally {
          set({ isUpdatingMarginAndLeverage: false });
        }
      },

      getMarginAndLeverage: (selectedMarket: string) => {
        return get().marginAndLeverage[selectedMarket] || undefined;
      },


      isPlacingOrderWithAgent: false,
      placeOrderWithAgent: async ({agentPrivateKey, a, b, s, p, r}) => {
        set({ isPlacingOrderWithAgent: true });
        try {
          const resp = await placeOrderWithAgent({agentPrivateKey, a, b, s, p, r});
          if (resp.status === "ok") {
            set({ isPlacingOrderWithAgent: false });
            return true;
          } else {
            set({ isError: resp.response.type, isPlacingOrderWithAgent: false });
            return false;
          }
        } catch (error) {
          set({ isError: errorHandler(error), isPlacingOrderWithAgent: false });
          return false;
        } finally {
          set({ isPlacingOrderWithAgent: false });
        }
      },

      }),
      {
        name: "trades-store",
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          marginAndLeverage: state.marginAndLeverage,
        }),
      }
    )
  )
);


