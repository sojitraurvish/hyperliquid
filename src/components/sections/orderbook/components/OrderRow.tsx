import React from "react";
import { addDecimals } from "@/lib/constants";
import { OrderBookData } from "@/store/orderbook";


interface OrderRowProps {
  order: OrderBookData;
  isAsk: boolean;
  maxTotal: number;
  currency: string;
  onClick?: () => void;
  isHighlighted?: boolean;
}

export const OrderRow = ({ order, isAsk, maxTotal, currency, onClick, isHighlighted = false }: OrderRowProps) => {
  const priceColor = isAsk ? "text-red-500" : "text-green-400";
  const barColor = isAsk ? "bg-red-500/15" : "bg-green-500/15";
  const highlightColor = isAsk ? "bg-red-500/40" : "bg-green-500/40";
  const barWidth = Math.min((parseFloat(order.total) / maxTotal) * 100, 100);

  const priceNum = parseFloat(order.price);
  const sizeNum = parseFloat(order.size);
  const displaySize = currency === "USDC" ? (sizeNum * priceNum).toString() : order.size;
  const totalNum = parseFloat(order.total);
  const displayTotal = currency === "USDC" ? (totalNum * priceNum).toString() : order.total;

  return (
    <div
      onClick={onClick}
      className="px-2 sm:px-3 py-0.5 flex justify-between text-xs sm:text-sm font-mono hover:bg-gray-800/50 cursor-pointer relative group transition-colors"
    >
      <div 
        className={`absolute inset-y-0 left-0 ${barColor} transition-all duration-700 ease-out group-hover:opacity-100`}
        style={{ width: `${barWidth}%` }} 
      />
      {isHighlighted && (
        <div 
          className={`absolute inset-0 ${highlightColor}`}
          style={{ animation: 'fadeOut 1.5s ease-out forwards' }}
        />
      )}
      <span className={`${priceColor} relative z-10 flex-1 text-left font-medium`}>
        {addDecimals(order.price)}
      </span>
      <span className="text-gray-300 relative z-10 flex-1 text-center tabular-nums">
        {addDecimals(displaySize)}
      </span>
      <span className="text-gray-300 relative z-10 flex-1 text-right tabular-nums">
        {addDecimals(displayTotal)}
      </span>
    </div>
  );
};

