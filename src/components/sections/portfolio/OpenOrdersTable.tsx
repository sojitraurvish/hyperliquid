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
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Time</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Type</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Coin</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Direction</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Size</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Price</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.slice(0, 10).map((order, index) => {
            const direction = order.side === "B" ? "Long" : "Short";
            const directionColor = direction === "Long" ? "text-green-500" : "text-red-500";
            const date = new Date(order.timestamp);
            const formattedTime = date.toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            });

            return (
              <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                <td className="py-4 px-4 text-gray-300 text-sm">{formattedTime}</td>
                <td className="py-4 px-4 text-gray-300 text-sm">{order.orderType || "Limit"}</td>
                <td className="py-4 px-4 text-gray-300 text-sm">{order.coin}</td>
                <td className={`py-4 px-4 text-sm font-medium ${directionColor}`}>{direction}</td>
                <td className="py-4 px-4 text-gray-300 text-sm">{parseFloat(order.sz).toFixed(5)}</td>
                <td className="py-4 px-4 text-gray-300 text-sm">
                  {order.limitPx ? parseFloat(order.limitPx).toFixed(2) : "--"}
                </td>
                <td className="py-4 px-4">
                  <button
                    onClick={() => {
                      window.location.href = "/trade";
                    }}
                    className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

