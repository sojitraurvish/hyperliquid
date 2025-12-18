import React from "react";
import { TradeRow } from "./TradeRow";
import { TradeData } from "..";


interface TradesListProps {
  trades: TradeData[];
}

export const TradesList = ({ trades }: TradesListProps) => {
  return (
    <div className="flex-1 overflow-auto scrollbar-hide">
      <div className="px-2 sm:px-3 py-1.5 flex justify-between text-xs text-gray-500 border-b border-gray-800 sticky top-0 bg-gray-900/95 backdrop-blur-sm">
        <span>Price</span>
        <span>Size (ETH)</span>
        <span>Time</span>
      </div>
      {trades.map((trade, i) => (
        <TradeRow key={`trade-${i}`} trade={trade} />
      ))}
    </div>
  );
};

