import React from "react";
import { OrderRow } from "./OrderRow";
import { OrderBookData } from "@/store/orderbook";


interface OrderListProps {
  orders: OrderBookData[];
  isAsk: boolean;
  maxTotal: number;
  currency: string;
  hideScrollbar?: boolean;
  highlightedPrices?: Set<string>;
}

export const OrderList = ({ orders, isAsk, maxTotal, currency, hideScrollbar = true, highlightedPrices }: OrderListProps) => {
  return (
    <div className={`flex-1 overflow-auto gap-1 ${isAsk ? "flex flex-col-reverse" : "flex flex-col"} ${hideScrollbar ? "scrollbar-hide" : ""}`}>
      {orders.map((order, i) => (
        <OrderRow
          key={`${isAsk ? "ask" : "bid"}-${order.price}`}
          order={order}
          isAsk={isAsk}
          maxTotal={maxTotal}
          currency={currency}
          isHighlighted={highlightedPrices?.has(order.price)}
        />
      ))}
    </div>
  );
};

