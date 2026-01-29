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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-800 hover:border-gray-700 transition-colors"
          >
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-4 bg-gray-800 rounded animate-pulse w-24" />
                <div className="h-8 bg-gray-800 rounded animate-pulse w-32" />
                <div className="h-3 bg-gray-800 rounded animate-pulse w-20" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm text-gray-400 font-medium">{card.title}</h3>
                  <Icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                <div className="mb-2">
                  <p className={`text-2xl sm:text-3xl font-bold ${card.valueColor || "text-white"}`}>
                    {card.value}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{card.subtitle}</p>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};





