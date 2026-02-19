"use client";

import { Wallet, TrendingUp, Clock, Activity } from "lucide-react";

interface SummaryMetrics {
  totalBalance: number;
  availableBalance: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  totalPositions: number;
  tradingVolume24h: number;
  trades24h: number;
}

interface PortfolioSummaryCardsProps {
  metrics: SummaryMetrics;
  isLoading: boolean;
}

export const PortfolioSummaryCards = ({ metrics, isLoading }: PortfolioSummaryCardsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const cards = [
    {
      title: "Total Balance",
      value: formatCurrency(metrics.totalBalance),
      subtitle: `Available: ${formatCurrency(metrics.availableBalance)}`,
      icon: Wallet,
      iconColor: "text-green-400",
    },
    {
      title: "Unrealized PnL",
      value: `${metrics.unrealizedPnL >= 0 ? "+" : ""}${formatCurrency(metrics.unrealizedPnL)}`,
      subtitle: `${metrics.unrealizedPnLPercent >= 0 ? "+" : ""}${metrics.unrealizedPnLPercent.toFixed(2)}%`,
      icon: TrendingUp,
      iconColor: metrics.unrealizedPnL >= 0 ? "text-green-500" : "text-red-500",
      valueColor: metrics.unrealizedPnL >= 0 ? "text-green-500" : "text-red-500",
    },
    {
      title: "Total Positions",
      value: formatNumber(metrics.totalPositions),
      subtitle: "active positions",
      icon: Clock,
      iconColor: "text-gray-400",
    },
    {
      title: "24h Trading Volume",
      value: formatCurrency(metrics.tradingVolume24h),
      subtitle: `${formatNumber(metrics.trades24h)} trades`,
      icon: Activity,
      iconColor: "text-gray-400",
    },
  ];

  return (
    <>
      {/* Mobile: compact 2-column grid */}
      <div className="grid grid-cols-2 gap-3 mb-6 sm:hidden">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-gray-900/50 rounded-xl p-3.5 border border-gray-800/40">
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-3 bg-gray-800/60 rounded animate-pulse w-16" />
                  <div className="h-6 bg-gray-800/60 rounded animate-pulse w-20" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Icon className={`w-3.5 h-3.5 ${card.iconColor}`} />
                    <h3 className="text-[11px] text-gray-500 font-medium">{card.title}</h3>
                  </div>
                  <p className={`text-base font-bold font-mono tracking-tight ${card.valueColor || "text-white"}`}>
                    {card.value}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">{card.subtitle}</p>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop: original layout */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="group relative bg-gray-900/40 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-gray-800/50 hover:border-green-500/25 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-linear-to-br from-green-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                {isLoading ? (
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-800/60 rounded-lg animate-pulse w-24" />
                    <div className="h-8 bg-gray-800/60 rounded-lg animate-pulse w-32" />
                    <div className="h-3 bg-gray-800/60 rounded-lg animate-pulse w-20" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm text-gray-400 font-medium tracking-wide">{card.title}</h3>
                      <div className="p-2 bg-gray-800/50 rounded-xl group-hover:bg-green-500/10 transition-colors duration-300">
                        <Icon className={`w-4 h-4 ${card.iconColor}`} />
                      </div>
                    </div>
                    <div className="mb-2">
                      <p className={`text-xl sm:text-2xl md:text-3xl font-bold tracking-tight font-mono ${card.valueColor || "text-white"}`}>
                        {card.value}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{card.subtitle}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};





