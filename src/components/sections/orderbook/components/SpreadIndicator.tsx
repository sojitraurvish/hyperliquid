import React from "react";
import { addDecimals } from "@/lib/constants";

interface SpreadIndicatorProps {
  spread: number;
  spreadPercent: number;
}

export const SpreadIndicator = ({ spread, spreadPercent }: SpreadIndicatorProps) => {
  return (
    <div className="px-2 sm:px-3 py-1.5 flex items-center justify-between text-[10px] border-y border-gray-800/20 bg-gray-900/40">
      <span className="text-gray-500 font-medium uppercase tracking-wider">Spread</span>
      <div className="flex items-center gap-3">
        <span className="tabular-nums text-gray-300 font-mono font-medium">{addDecimals(spread)}</span>
        <span className="tabular-nums text-gray-500 font-mono">{addDecimals(spreadPercent,3)}%</span>
      </div>
    </div>
  );
};

