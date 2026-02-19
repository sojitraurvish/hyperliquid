"use client";

import { useState } from "react";
import { Position, OpenOrder, TradeHistory } from "@/types/bottom-panel";
import { OpenPositionsTable } from "./OpenPositionsTable";
import { OpenOrdersTable } from "./OpenOrdersTable";
import { TradeHistoryTable } from "./TradeHistoryTable";
import { TransactionsTable } from "./TransactionsTable";

type TabValue = "positions" | "orders" | "history" | "transactions";

interface PortfolioTabsProps {
  activeTab: TabValue;
  onTabChange: (tab: TabValue) => void;
  positions: Position[];
  openOrders: OpenOrder[];
  tradeHistory: TradeHistory[];
  isPositionsLoading: boolean;
  isOrdersLoading: boolean;
  isHistoryLoading: boolean;
}

export const PortfolioTabs = ({
  activeTab,
  onTabChange,
  positions,
  openOrders,
  tradeHistory,
  isPositionsLoading,
  isOrdersLoading,
  isHistoryLoading,
}: PortfolioTabsProps) => {
  const tabs = [
    { value: "positions" as TabValue, label: "Positions", fullLabel: "Open Positions" },
    { value: "orders" as TabValue, label: "Orders", fullLabel: "Open Orders" },
    { value: "history" as TabValue, label: "History", fullLabel: "Trade History" },
    { value: "transactions" as TabValue, label: "Txns", fullLabel: "Transactions" },
  ];

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800/60 overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-800/60 overflow-x-auto scrollbar-hide -mb-px">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={`
              flex-1 sm:flex-none px-3 sm:px-6 py-3.5 sm:py-4 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap text-center
              ${
                activeTab === tab.value
                  ? "text-white border-b-2 border-green-400 bg-gray-800/50"
                  : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/30"
              }
            `}
          >
            <span className="sm:hidden">{tab.label}</span>
            <span className="hidden sm:inline">{tab.fullLabel}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-0 sm:p-6">
        {activeTab === "positions" && (
          <OpenPositionsTable positions={positions} isLoading={isPositionsLoading} openOrders={openOrders} />
        )}
        {activeTab === "orders" && (
          <OpenOrdersTable orders={openOrders} isLoading={isOrdersLoading} />
        )}
        {activeTab === "history" && (
          <TradeHistoryTable trades={tradeHistory} isLoading={isHistoryLoading} />
        )}
        {activeTab === "transactions" && (
          <TransactionsTable trades={tradeHistory} isLoading={isHistoryLoading} />
        )}
      </div>
    </div>
  );
};





