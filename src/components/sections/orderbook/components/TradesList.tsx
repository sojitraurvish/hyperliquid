import React from "react";
import { TradeRow } from "./TradeRow";
import { TradeData } from "@/store/trades";


interface TradesListProps {
  trades: TradeData[];
  currency: string;
}

export const TradesList = ({ trades , currency }: TradesListProps) => {
  return (
    <div className="flex-1 overflow-auto scrollbar-hide">
      <div className="px-2 sm:px-3 py-1 flex justify-between text-[10px] text-gray-500 border-b border-gray-800/20 sticky top-0 bg-gray-950/95 backdrop-blur-sm font-medium uppercase tracking-wider">
        <span>Price</span>
        <span>Size ({currency})</span>
        <span>Time</span>
      </div>
      {trades.map((trade, i) => (
        <TradeRow key={`trade-${i}`} trade={trade} />
      ))}
    </div>
  );
};

