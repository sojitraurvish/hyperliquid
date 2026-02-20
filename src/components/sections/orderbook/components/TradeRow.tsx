import React from "react";
import { addDecimals } from "@/lib/constants";
import { TradeData } from "@/store/trades";

interface TradeRowProps {
  trade: TradeData;
}

export const TradeRow = ({ trade }: TradeRowProps) => {
  const priceColor = trade.isBuy ? "text-green-400" : "text-red-400";

  return (
    <div className="group px-2 sm:px-3 py-[3px] flex items-center text-[10px] font-mono hover:bg-gray-800/20 transition-colors">
      <span className={`${priceColor} flex-1 text-left tabular-nums font-semibold`}>
          {addDecimals(trade.price)}
      </span>
      <span className="text-gray-400 flex-1 text-center tabular-nums">
        {addDecimals(trade.size)}
      </span>
      <span className="flex-1 text-right tabular-nums text-gray-500 pr-1">
        {trade.time}
      </span>
    </div>
  );
};

