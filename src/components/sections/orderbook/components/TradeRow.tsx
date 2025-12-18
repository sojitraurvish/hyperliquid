import React from "react";
import { ExternalLink } from "lucide-react";
import { addDecimal } from "@/lib/constants";
import { EXPLORER_TX_URL } from "@/lib/config";
import { TradeData } from "..";

interface TradeRowProps {
  trade: TradeData;
}

export const TradeRow = ({ trade }: TradeRowProps) => {
  const priceColor = trade.isBuy ? "text-teal-400" : "text-red-500";

  return (
    <div className="px-2 sm:px-3 py-1.5 flex justify-between items-center text-xs sm:text-sm hover:bg-gray-800/50 border-b border-gray-800/50 transition-colors">
      <span className={`${priceColor} font-mono flex-1 text-left tabular-nums font-medium`}>
          {addDecimal(trade.price)}
      </span>
      <span className="text-gray-300 flex-1 text-center tabular-nums">
        {addDecimal(trade.size)}
      </span>
      <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-end">
        <span className="text-gray-400 tabular-nums">{trade.time}</span>
        <a
          href={`${EXPLORER_TX_URL}/${trade.txnHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center"
        >
          <ExternalLink className="h-3 w-3 text-gray-500 hover:text-teal-400 transition-colors" />
        </a>
      </div>
    </div>
  );
};

