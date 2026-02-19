"use client";

import { useState, useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { Wallet, TrendingUp, Clock, Activity } from "lucide-react";
import AppButton from "@/components/ui/button";
import { VARIANT_TYPES } from "@/lib/constants";
import { useBottomPanelStore } from "@/store/bottom-panel";
import { PortfolioSummaryCards } from "./PortfolioSummaryCards";
import { PortfolioTabs } from "./PortfolioTabs";
import { DepositModal } from "@/components/sections/header/DepositModal";
import { WithdrawModal } from "@/components/sections/header/WithdrawModal";
import { formatDateTimeAccordingToFormat } from "@/lib/date-operation";
import { DATE_TIME_FORMAT } from "@/lib/constants";
import HydrationGuard from "@/components/ui/hydration-guard";

export const PortfolioContent = () => {
  const { address, isConnected } = useAccount();
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"positions" | "orders" | "history" | "transactions">("positions");
  const [isMounted, setIsMounted] = useState(false);
  
  const {
    balances,
    isBalancesLoading,
    getAllBalances,
    userPositions,
    isUserPositionsLoading,
    getUserPositions,
    userOpenOrders,
    isUserOpenOrdersLoading,
    getUserOpenOrders,
    tradeHistory,
    isTradeHistoryLoading,
    getUserTradeHistory,
  } = useBottomPanelStore();

  // Track if component is mounted to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load data when wallet is connected
  useEffect(() => {
    if (!address || !isConnected || !isMounted) return;

    const loadData = async () => {
      await Promise.all([
        getAllBalances({ publicKey: address }),
        getUserPositions({ publicKey: address }),
        getUserOpenOrders({ publicKey: address }),
        getUserTradeHistory({ publicKey: address }),
      ]);
    };

    loadData();
  }, [address, isConnected, isMounted, getAllBalances, getUserPositions, getUserOpenOrders, getUserTradeHistory]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!balances || balances.length === 0) {
      return {
        totalBalance: 0,
        availableBalance: 0,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        totalPositions: 0,
        tradingVolume24h: 0,
        trades24h: 0,
      };
    }

    const balanceData = balances[0];
    const totalBalance = parseFloat(balanceData.total_balance.replace(/[^0-9.-]/g, "")) || 0;
    const availableBalance = parseFloat(balanceData.available_balance.replace(/[^0-9.-]/g, "")) || 0;

    // Calculate unrealized PnL from positions
    let unrealizedPnL = 0;
    if (userPositions && userPositions.length > 0) {
      unrealizedPnL = userPositions.reduce((sum, pos) => {
        return sum + parseFloat(pos.position.unrealizedPnl || "0");
      }, 0);
    }

    const unrealizedPnLPercent = totalBalance > 0 ? (unrealizedPnL / totalBalance) * 100 : 0;

    // Calculate 24h trading volume
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    let tradingVolume24h = 0;
    let trades24h = 0;

    if (tradeHistory && tradeHistory.length > 0) {
      const recentTrades = tradeHistory.filter((trade) => trade.time >= oneDayAgo);
      trades24h = recentTrades.length;
      tradingVolume24h = recentTrades.reduce((sum, trade) => {
        const price = parseFloat(trade.px || "0");
        const size = parseFloat(trade.sz || "0");
        return sum + price * size;
      }, 0);
    }

    return {
      totalBalance,
      availableBalance,
      unrealizedPnL,
      unrealizedPnLPercent,
      totalPositions: userPositions?.length || 0,
      tradingVolume24h,
      trades24h,
    };
  }, [balances, userPositions, tradeHistory]);

  // Show loading state during SSR and before hydration
  if (!isMounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="mb-8">
          <div className="h-10 bg-gray-800/50 rounded-xl animate-pulse w-48 mb-2" />
          <div className="h-5 bg-gray-800/50 rounded-xl animate-pulse w-64" />
        </div>
      </div>
    );
  }

  // Wallet not connected state
  if (!isConnected || !address) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
        <div className="max-w-sm sm:max-w-md w-full text-center">
          <div className="mb-6 p-6 sm:p-10 bg-gray-900/30 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-gray-800/50">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gray-800/50 rounded-xl sm:rounded-2xl flex items-center justify-center">
              <Wallet className="w-8 h-8 sm:w-10 sm:h-10 text-gray-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3 tracking-tight">Connect Your Wallet</h2>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
              Connect your wallet to view your portfolio and manage your positions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-14 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-green-500/3 rounded-full blur-3xl pointer-events-none" />

      <div className="relative">
      {/* Header Section */}
      <div className="mb-5 sm:mb-8 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-1 sm:mb-2 tracking-tight">Portfolio</h1>
          <p className="text-gray-400 text-xs sm:text-base hidden sm:block">Manage your positions and track performance.</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 sm:gap-3">
          <AppButton
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="bg-green-500 hover:bg-green-400 text-white px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]"
            onClick={() => setIsDepositModalOpen(true)}
          >
            Deposit
          </AppButton>
          <AppButton
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all backdrop-blur-sm"
            onClick={() => setIsWithdrawModalOpen(true)}
          >
            Withdraw
          </AppButton>
        </div>
      </div>

      {/* Summary Cards */}
      <PortfolioSummaryCards metrics={summaryMetrics} isLoading={isBalancesLoading || isUserPositionsLoading} />

      {/* Tabs */}
      <PortfolioTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        positions={userPositions || []}
        openOrders={userOpenOrders || []}
        tradeHistory={tradeHistory || []}
        isPositionsLoading={isUserPositionsLoading}
        isOrdersLoading={isUserOpenOrdersLoading}
        isHistoryLoading={isTradeHistoryLoading}
      />

      {/* Modals */}
      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onSuccess={() => {
          if (address) {
            getAllBalances({ publicKey: address });
          }
        }}
      />

      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        onSuccess={() => {
          if (address) {
            getAllBalances({ publicKey: address });
          }
        }}
      />
      </div>
    </div>
  );
};

