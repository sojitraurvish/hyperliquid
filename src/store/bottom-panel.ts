import { infoClient } from "@/lib/config/hyperliquied/hyperliquid-client";
import { getAllBalances, getHistoricalOrders, getUserFundings, getUserOpenOrders, getUserPositions, getUserTradeHistory } from "@/lib/services/bottom-panel";
import { Balance, FundingHistory, HistoricalOrder, OpenOrder, Position, TradeHistory } from "@/types/bottom-panel";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { errorHandler } from "./errorHandler";

type BottomPanelStore = {
    isError: string | null;
  
    balances: Balance[] | null;
    isBalancesLoading: boolean;
    getAllBalances: (params: {publicKey: `0x${string}`}) => Promise<void>;
    setBalances: (balances: Balance[]) => void; 

    historicalOrders: HistoricalOrder[] | null;
    isHistoricalOrdersLoading: boolean;
    getHistoricalOrders: (params: {publicKey: `0x${string}`}) => Promise<void>;

    userFundings: FundingHistory[] | null;
    isUserFundingsLoading: boolean;
    getUserFundings: (params: {publicKey: `0x${string}`}) => Promise<void>;

    tradeHistory: TradeHistory[] | null;
    isTradeHistoryLoading: boolean;
    getUserTradeHistory: (params: {publicKey: `0x${string}`}) => Promise<void>;

    userOpenOrders: OpenOrder[] | null;
    isUserOpenOrdersLoading: boolean;
    getUserOpenOrders: (params: {publicKey: `0x${string}`}) => Promise<void>;
    setOpenOrders: (orders: OpenOrder[]) => void;

    userPositions: Position[] | null;
    isUserPositionsLoading: boolean;
    getUserPositions: (params: {publicKey: `0x${string}`}) => Promise<void>;
    setUserPositions: (positions: Position[]) => void;
};

export const useBottomPanelStore = create<BottomPanelStore>()(
  devtools(persist((set,get) => ({
    balances: null,
    isBalancesLoading: false,
    isError: null,

    getAllBalances: async ({publicKey}: {publicKey: `0x${string}`}) => {
      try {
        set({ isBalancesLoading: true, isError: null });
        const resp = await getAllBalances({publicKey});
        set({ balances: resp });
      } catch (error) {
        set({ isError: errorHandler(error), isBalancesLoading: false });
      } finally {
        set({ isBalancesLoading: false });
      }
    },
    setBalances: (balances: Balance[]) => {
      set({ balances: balances });
    },

    historicalOrders: null,
    isHistoricalOrdersLoading: false,
    getHistoricalOrders: async ({publicKey}: {publicKey: `0x${string}`}) => {
      try {
        set({ isHistoricalOrdersLoading: true, isError: null });
        const resp = await getHistoricalOrders({publicKey});
        set({ historicalOrders: resp });
      } catch (error) {
        set({ isError: errorHandler(error), isHistoricalOrdersLoading: false });
      } finally {
        set({ isHistoricalOrdersLoading: false });
      }
    },
    
    userFundings: [],
    isUserFundingsLoading: false,
    getUserFundings: async ({publicKey}: {publicKey: `0x${string}`}) => {
      try {
        set({ isUserFundingsLoading: true, isError: null });
        const resp = await getUserFundings({publicKey});
        console.log("resp", resp);
        set({ userFundings: resp });
      } catch (error) {
        set({ isError: errorHandler(error), isUserFundingsLoading: false });
      } finally {
        set({ isUserFundingsLoading: false });
      }
    },

    tradeHistory: [],
    isTradeHistoryLoading: false,
    getUserTradeHistory: async ({publicKey}: {publicKey: `0x${string}`}) => {
      try {
        set({ isTradeHistoryLoading: true, isError: null });
        const resp = await getUserTradeHistory({publicKey});
        set({ tradeHistory: resp });
      } catch (error) {
        set({ isError: errorHandler(error), isTradeHistoryLoading: false });
      } finally {
        set({ isTradeHistoryLoading: false });
      }
    },

    userOpenOrders: [],
    isUserOpenOrdersLoading: false,
    getUserOpenOrders: async ({publicKey}: {publicKey: `0x${string}`}) => {
      try {
        set({ isUserOpenOrdersLoading: true, isError: null });
        const resp = await getUserOpenOrders({publicKey});
        console.log("resp", resp);
        
        set({ userOpenOrders: resp });
      } catch (error) {
        set({ isError: errorHandler(error), isUserOpenOrdersLoading: false });
      } finally {
        set({ isUserOpenOrdersLoading: false });
      }
    },
    setOpenOrders: (orders: OpenOrder[]) => {
      set({ userOpenOrders: orders });
    },

    userPositions: [],
    isUserPositionsLoading: false,
    getUserPositions: async ({publicKey}: {publicKey: `0x${string}`}) => {
      try {
        set({ isUserPositionsLoading: true, isError: null });
        const resp = await getUserPositions({publicKey});
        console.log("resp", resp);
        set({ userPositions: resp });
      } catch (error) {
        set({ isError: errorHandler(error), isUserPositionsLoading: false });
      } finally {
        set({ isUserPositionsLoading: false });
      }
    },
    setUserPositions: (positions: Position[]) => {
      set({ userPositions: positions });
    },

    // login: (user: User) => {
    //   set({user, isAuthenticated: true});
    // },
    
  }),{
    name: "bottom-panel-store",
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({ balances: state.balances }),
  })
  )
);