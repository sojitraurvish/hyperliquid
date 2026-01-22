import { cancelOrdersWithAgent, placeOrderWithAgent, updateMarginAndLeverage } from "@/lib/services/trading-panel";
import { MarginAndLeverage, MarginLeverageValue } from "@/types/trading-panel";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { errorHandler } from "./errorHandler";
import { appToast } from "@/components/ui/toast";
import { toast } from "react-toastify";

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
  placeOrderWithAgent: ({agentPrivateKey, a, b, s, p, r, tif}: {agentPrivateKey: `0x${string}`, a: string, b: boolean, s: string, p: string, r: boolean, tif?: "FrontendMarket" | "Gtc" | "Ioc" | "Alo" | "LiquidationMarket"}) => Promise<boolean>;


  isCancellingOrdersWithAgentLoading: boolean;
  cancelOrdersWithAgent: ({agentPrivateKey, orders}: {agentPrivateKey: `0x${string}`, orders: {orderId: string, a: string}[]}) => Promise<boolean>;
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
      placeOrderWithAgent: async ({agentPrivateKey, a, b, s, p, r, tif = "FrontendMarket"}) => {
        set({ isPlacingOrderWithAgent: true });
        const loadingToastId = appToast.loading({title:"Order Submitted..."});
        try {
          const resp = await placeOrderWithAgent({agentPrivateKey, a, b, s, p, r, tif});
          if (resp.status === "ok") {
            toast.dismiss(loadingToastId);
            resp.response.data.statuses.forEach((status) => {
              // Check if order was filled (for ALO orders, it might not be filled immediately)
              if (status.filled) {
                appToast.success({title:`${status.filled.totalSz} assert ${b ? "bought" : "sold"} at average price ${status.filled.avgPx}`});
              } else if (tif === "Gtc" || tif === "Ioc" || tif === "Alo") {
                // Order was placed but not filled (e.g., ALO orders waiting for auction)
                appToast.success({title:`Limit Order placed successfully`});
              }else {
                appToast.success({title:`Order placed successfully`});
              }
            });
            set({ isPlacingOrderWithAgent: false });
            return true;
          } else {
            toast.dismiss(loadingToastId);
            appToast.error({title:"Order Failed", message: resp.response.type || "Failed to place order"});
            set({ isError: resp.response.type, isPlacingOrderWithAgent: false });
            return false;
          }
        } catch (error) {
          toast.dismiss(loadingToastId);
          const errorMessage = errorHandler(error);
          appToast.error({title:"Order Failed", message: errorMessage});
          set({ isError: errorMessage, isPlacingOrderWithAgent: false });
          return false;
        } finally {
          set({ isPlacingOrderWithAgent: false });
        }
      },

      isCancellingOrdersWithAgentLoading: false,
      cancelOrdersWithAgent: async ({agentPrivateKey, orders}: {agentPrivateKey: `0x${string}`, orders: {orderId: string, a: string}[]}) => {
        set({ isCancellingOrdersWithAgentLoading: true });

        try {
          const resp = await cancelOrdersWithAgent({agentPrivateKey, orders});
          if (resp.status === "ok") {
            set({ isCancellingOrdersWithAgentLoading: false });
            return true;
          } else {
            set({ isError: resp.response.type, isCancellingOrdersWithAgentLoading: false });
            return false;
          }
        } catch (error) {
          set({ isError: errorHandler(error), isCancellingOrdersWithAgentLoading: false });
          return false;
        } finally {
          set({ isCancellingOrdersWithAgentLoading: false });
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


