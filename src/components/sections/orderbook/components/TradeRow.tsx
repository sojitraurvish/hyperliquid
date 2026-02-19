import React from "react";
import { ExternalLink } from "lucide-react";
import { addDecimals } from "@/lib/constants";
import { EXPLORER_TX_URL } from "@/lib/config";
import { TradeData } from "@/store/trades";

interface TradeRowProps {
  trade: TradeData;
}

export const TradeRow = ({ trade }: TradeRowProps) => {
  const priceColor = trade.isBuy ? "text-green-400" : "text-red-400";

  return (
    <div className="px-2 sm:px-3 py-[3px] flex justify-between items-center text-[10px] font-mono hover:bg-gray-800/20 transition-colors">
      <span className={`${priceColor} flex-1 text-left tabular-nums font-semibold`}>
          {addDecimals(trade.price)}
      </span>
      <span className="text-gray-400 flex-1 text-center tabular-nums">
        {addDecimals(trade.size)}
      </span>
      <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-end">
        <span className="text-gray-500 tabular-nums">{trade.time}</span>
        <a
          href={`${EXPLORER_TX_URL}/${trade.txnHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ExternalLink className="h-2.5 w-2.5 text-gray-600 hover:text-green-400 transition-colors" />
        </a>
      </div>
    </div>
  );
};

