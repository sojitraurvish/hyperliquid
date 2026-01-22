"use client";

import { Position } from "@/types/bottom-panel";

interface OpenPositionsTableProps {
  positions: Position[];
  isLoading: boolean;
}

export const OpenPositionsTable = ({ positions, isLoading }: OpenPositionsTableProps) => {

  const handleClose = (position: Position) => {
    // Redirect to trade page for operations
    window.location.href = "/trade";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-sm">No open positions</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-400">Asset</th>
              <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-400">Size</th>
              <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-400 hidden sm:table-cell">Value</th>
              <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-400">Entry Price</th>
              <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-400 hidden md:table-cell">Current Price</th>
              <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-400">PnL</th>
              <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
        <tbody>
          {positions.slice(0, 10).map((position, index) => {
            const pos = position.position;
            const posSize = parseFloat(pos.szi);
            const entryPrice = parseFloat(pos.entryPx);
            const currentPrice = parseFloat(pos.positionValue) / Math.abs(posSize);
            const pnl = parseFloat(pos.unrealizedPnl);
            const pnlPercent = (pnl / parseFloat(pos.positionValue)) * 100;

            // Get coin abbreviation (first 2 letters)
            const coinAbbr = pos.coin.substring(0, 2).toUpperCase();
            const coinName = pos.coin;

            return (
              <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                <td className="py-4 px-2 sm:px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-semibold">{coinAbbr}</span>
                    </div>
                    <span className="text-white text-sm font-medium truncate">{coinName}</span>
                  </div>
                </td>
                <td className="py-4 px-2 sm:px-4 text-gray-300 text-sm">{Math.abs(posSize).toFixed(2)}</td>
                <td className="py-4 px-2 sm:px-4 text-gray-300 text-sm hidden sm:table-cell">
                  ${parseFloat(pos.positionValue).toFixed(2)}
                </td>
                <td className="py-4 px-2 sm:px-4 text-gray-300 text-sm">${entryPrice.toFixed(2)}</td>
                <td className="py-4 px-2 sm:px-4 text-gray-300 text-sm hidden md:table-cell">${currentPrice.toFixed(2)}</td>
                <td className="py-4 px-2 sm:px-4">
                  <span className={`text-sm ${pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} ({pnlPercent >= 0 ? "+" : ""}
                    {pnlPercent.toFixed(2)}%)
                  </span>
                </td>
                <td className="py-4 px-2 sm:px-4">
                  <button
                    onClick={() => handleClose(position)}
                    className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    Close
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

