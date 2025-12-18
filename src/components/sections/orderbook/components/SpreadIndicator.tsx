import React from "react";
import { addDecimal } from "@/lib/constants";

interface SpreadIndicatorProps {
  spread: number;
  spreadPercent: number;
}

export const SpreadIndicator = ({ spread, spreadPercent }: SpreadIndicatorProps) => {
  return (
    <div className="px-2 sm:px-3 py-1.5 flex items-center justify-around text-xs text-gray-400 border-y border-gray-800 bg-gray-800/50">
      <span className="text-gray-400">Spread</span>
      <span className="tabular-nums text-gray-300">{addDecimal(spread)}</span>
      <span className="tabular-nums text-gray-300">{addDecimal(spreadPercent,3)}%</span>
    </div>
  );
};

