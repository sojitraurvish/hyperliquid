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
    { value: "positions" as TabValue, label: "Open Positions" },
    { value: "orders" as TabValue, label: "Open Orders" },
    { value: "history" as TabValue, label: "Trade History" },
    { value: "transactions" as TabValue, label: "Transactions" },
  ];

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-800 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={`
              px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium transition-colors whitespace-nowrap
              ${
                activeTab === tab.value
                  ? "text-white border-b-2 border-white bg-gray-800"
                  : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4 sm:p-6">
        {activeTab === "positions" && (
          <OpenPositionsTable positions={positions} isLoading={isPositionsLoading} />
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





