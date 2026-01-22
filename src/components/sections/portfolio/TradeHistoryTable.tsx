"use client";

import { TradeHistory } from "@/types/bottom-panel";
import { Activity } from "lucide-react";

interface TradeHistoryTableProps {
  trades: TradeHistory[];
  isLoading: boolean;
}

export const TradeHistoryTable = ({ trades, isLoading }: TradeHistoryTableProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Activity className="w-8 h-8 text-gray-600" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Trade History</h3>
        <p className="text-gray-400 text-sm text-center">
          Your completed trades will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Time</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Coin</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Direction</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Price</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Size</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Value</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Fee</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">PnL</th>
          </tr>
        </thead>
        <tbody>
          {trades.slice().reverse().slice(0, 10).map((trade, index) => {
            const date = new Date(trade.time);
            const formattedTime = date.toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            });

            const isBuy = trade.side === "B";
            const direction = isBuy ? "Buy" : "Sell";
            const directionColor = isBuy ? "text-green-500" : "text-red-500";
            const price = parseFloat(trade.px);
            const size = parseFloat(trade.sz);
            const value = price * size;
            const fee = parseFloat(trade.fee || "0");
            const closedPnl = parseFloat(trade.closedPnl || "0");

            return (
              <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                <td className="py-4 px-4 text-gray-300 text-sm">{formattedTime}</td>
                <td className="py-4 px-4 text-gray-300 text-sm">{trade.coin}</td>
                <td className={`py-4 px-4 text-sm font-medium ${directionColor}`}>{direction}</td>
                <td className="py-4 px-4 text-gray-300 text-sm">${price.toFixed(2)}</td>
                <td className="py-4 px-4 text-gray-300 text-sm">{size.toFixed(5)}</td>
                <td className="py-4 px-4 text-gray-300 text-sm">${value.toFixed(2)}</td>
                <td className="py-4 px-4 text-gray-300 text-sm">{fee.toFixed(4)}</td>
                <td className={`py-4 px-4 text-sm font-medium ${closedPnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {closedPnl >= 0 ? "+" : ""}${closedPnl.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

