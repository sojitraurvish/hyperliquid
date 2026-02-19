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
    <div>
      {/* Mobile card layout */}
      <div className="sm:hidden py-1">
        {trades.slice().reverse().slice(0, 10).map((trade, index) => {
          const date = new Date(trade.time);
          const formattedTime = date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
          const isBuy = trade.side === "B";
          const price = parseFloat(trade.px);
          const size = parseFloat(trade.sz);
          const closedPnl = parseFloat(trade.closedPnl || "0");

          return (
            <div key={index} className="mx-3 my-2 rounded-xl bg-gray-800/25 border border-gray-700/25 overflow-hidden">
              <div className={`flex items-center justify-between px-4 py-3 ${isBuy ? "bg-green-500/3" : "bg-red-500/3"}`}>
                <div className="flex items-center gap-2.5">
                  <span className="text-white text-[13px] font-semibold">{trade.coin}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${isBuy ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                    {isBuy ? "Buy" : "Sell"}
                  </span>
                </div>
                <span className={`text-sm font-mono font-bold ${closedPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {closedPnl >= 0 ? "+" : ""}${closedPnl.toFixed(2)}
                </span>
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-gray-500 block text-[10px] mb-0.5">Price</span>
                    <span className="text-gray-200 font-mono font-medium">${price.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] mb-0.5">Size</span>
                    <span className="text-gray-200 font-mono font-medium">{size.toFixed(5)}</span>
                  </div>
                </div>
                <span className="text-gray-500 text-[11px]">{formattedTime}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table layout */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800/60">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Time</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Coin</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Direction</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Value</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Fee</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">PnL</th>
            </tr>
          </thead>
          <tbody>
            {trades.slice().reverse().slice(0, 10).map((trade, index) => {
              const date = new Date(trade.time);
              const formattedTime = date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
              const isBuy = trade.side === "B";
              const price = parseFloat(trade.px);
              const size = parseFloat(trade.sz);
              const value = price * size;
              const fee = parseFloat(trade.fee || "0");
              const closedPnl = parseFloat(trade.closedPnl || "0");

              return (
                <tr key={index} className="border-b border-gray-800/40 hover:bg-gray-800/30 transition-colors">
                  <td className="py-4 px-4 text-gray-400 text-sm hidden md:table-cell">{formattedTime}</td>
                  <td className="py-4 px-4 text-white text-sm font-medium">{trade.coin}</td>
                  <td className={`py-4 px-4 text-sm font-medium ${isBuy ? "text-green-500" : "text-red-500"}`}>{isBuy ? "Buy" : "Sell"}</td>
                  <td className="py-4 px-4 text-gray-300 text-sm font-mono">${price.toFixed(2)}</td>
                  <td className="py-4 px-4 text-gray-300 text-sm font-mono">{size.toFixed(5)}</td>
                  <td className="py-4 px-4 text-gray-300 text-sm font-mono hidden lg:table-cell">${value.toFixed(2)}</td>
                  <td className="py-4 px-4 text-gray-300 text-sm font-mono hidden lg:table-cell">{fee.toFixed(4)}</td>
                  <td className={`py-4 px-4 text-sm font-medium font-mono ${closedPnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {closedPnl >= 0 ? "+" : ""}${closedPnl.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

