"use client";

import { OpenOrder } from "@/types/bottom-panel";
import { Activity } from "lucide-react";
import AppButton from "@/components/ui/button";
import { VARIANT_TYPES } from "@/lib/constants";

interface OpenOrdersTableProps {
  orders: OpenOrder[];
  isLoading: boolean;
}

export const OpenOrdersTable = ({ orders, isLoading }: OpenOrdersTableProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Activity className="w-8 h-8 text-gray-600" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No Open Orders</h3>
        <p className="text-gray-400 text-sm text-center mb-6">
          You don't have any open orders at the moment.
        </p>
        <AppButton
          variant={VARIANT_TYPES.NOT_SELECTED}
          className="bg-green-500 text-white hover:bg-green-600 px-6 py-2 text-sm font-medium rounded transition-colors"
          onClick={() => {
            window.location.href = "/trade";
          }}
        >
          Start Trading
        </AppButton>
      </div>
    );
  }

  return (
    <div>
      {/* Mobile card layout */}
      <div className="sm:hidden py-1">
        {orders.slice(0, 10).map((order, index) => {
          const direction = order.side === "B" ? "Long" : "Short";
          const isLong = direction === "Long";
          const date = new Date(order.timestamp);
          const formattedTime = date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

          return (
            <div key={index} className="mx-3 my-2 rounded-xl bg-gray-800/25 border border-gray-700/25 overflow-hidden">
              <div className={`flex items-center justify-between px-4 py-3 ${isLong ? "bg-green-500/3" : "bg-red-500/3"}`}>
                <div className="flex items-center gap-2.5">
                  <span className="text-white text-[13px] font-semibold">{order.coin}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${isLong ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                    {direction}
                  </span>
                  <span className="text-[10px] text-gray-500 bg-gray-700/40 px-1.5 py-0.5 rounded">{order.orderType || "Limit"}</span>
                </div>
                <button
                  onClick={() => { window.location.href = "/trade"; }}
                  className="px-3 py-1.5 text-red-400 bg-red-500/10 hover:bg-red-500/15 text-[11px] font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-gray-500 block text-[10px] mb-0.5">Size</span>
                    <span className="text-gray-200 font-mono font-medium">{parseFloat(order.sz).toFixed(5)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] mb-0.5">Price</span>
                    <span className="text-gray-200 font-mono font-medium">${order.limitPx ? parseFloat(order.limitPx).toFixed(2) : "--"}</span>
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
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Type</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Coin</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Direction</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 10).map((order, index) => {
              const direction = order.side === "B" ? "Long" : "Short";
              const directionColor = direction === "Long" ? "text-green-500" : "text-red-500";
              const date = new Date(order.timestamp);
              const formattedTime = date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

              return (
                <tr key={index} className="border-b border-gray-800/40 hover:bg-gray-800/30 transition-colors">
                  <td className="py-4 px-4 text-gray-300 text-sm hidden md:table-cell">{formattedTime}</td>
                  <td className="py-4 px-4 text-gray-300 text-sm hidden lg:table-cell">{order.orderType || "Limit"}</td>
                  <td className="py-4 px-4 text-white text-sm font-medium">{order.coin}</td>
                  <td className={`py-4 px-4 text-sm font-medium ${directionColor}`}>{direction}</td>
                  <td className="py-4 px-4 text-gray-300 text-sm font-mono">{parseFloat(order.sz).toFixed(5)}</td>
                  <td className="py-4 px-4 text-gray-300 text-sm font-mono">${order.limitPx ? parseFloat(order.limitPx).toFixed(2) : "--"}</td>
                  <td className="py-4 px-4">
                    <button onClick={() => { window.location.href = "/trade"; }} className="px-3 py-1.5 text-green-400 hover:text-green-300 hover:bg-green-500/10 text-sm font-medium rounded-lg transition-colors">
                      Cancel
                    </button>
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

