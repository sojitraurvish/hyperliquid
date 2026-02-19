"use client";

import { TradeHistory } from "@/types/bottom-panel";
import { TrendingUp, ArrowDown, ArrowUp } from "lucide-react";

interface TransactionsTableProps {
  trades: TradeHistory[];
  isLoading: boolean;
}

type Transaction = {
  type: "Trade" | "Deposit" | "Withdraw";
  asset: string;
  amount: string;
  date: Date;
  status: "completed";
};

export const TransactionsTable = ({ trades, isLoading }: TransactionsTableProps) => {
  // Transform trades into transactions
  // Note: In a real app, you'd fetch deposit/withdraw history from the API
  // For now, we'll show trades as transactions
  const transactions: Transaction[] = trades
    .slice()
    .reverse()
    .map((trade) => ({
      type: "Trade" as const,
      asset: `${trade.coin}-USDC`,
      amount: `${parseFloat(trade.sz).toFixed(2)} ${trade.coin}`,
      date: new Date(trade.time),
      status: "completed" as const,
    }));

  // Sort by date (newest first) and limit to first 10
  transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  const limitedTransactions = transactions.slice(0, 10);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (limitedTransactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-sm">No transactions found</p>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Trade":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "Deposit":
        return <ArrowDown className="w-4 h-4 text-green-500" />;
      case "Withdraw":
        return <ArrowUp className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case "Trade":
      case "Deposit":
        return "text-green-500";
      case "Withdraw":
        return "text-red-500";
      default:
        return "text-gray-300";
    }
  };

  return (
    <div>
      {/* Mobile card layout */}
      <div className="sm:hidden py-1">
        {limitedTransactions.map((transaction, index) => {
          const formattedDate = transaction.date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
          const amountPrefix = transaction.type === "Withdraw" ? "-" : "+";
          const amountColor = getAmountColor(transaction.type);

          return (
            <div key={index} className="mx-3 my-2 rounded-xl bg-gray-800/25 border border-gray-700/25 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gray-700/40 flex items-center justify-center shrink-0">
                    {getTypeIcon(transaction.type)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white text-[13px] font-semibold leading-tight">{transaction.type}</span>
                    <span className="text-gray-500 text-[10px]">{transaction.asset} · {formattedDate}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`font-mono font-bold text-sm block ${amountColor}`}>{amountPrefix}{transaction.amount}</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-green-500/15 text-green-400 mt-0.5">
                    {transaction.status}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table layout */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800/60">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {limitedTransactions.map((transaction, index) => {
              const formattedDate = transaction.date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
              const amountPrefix = transaction.type === "Withdraw" ? "-" : "+";
              const amountColor = getAmountColor(transaction.type);

              return (
                <tr key={index} className="border-b border-gray-800/40 hover:bg-gray-800/30 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(transaction.type)}
                      <span className="text-gray-300 text-sm">{transaction.type}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-300 text-sm">{transaction.asset}</td>
                  <td className={`py-4 px-4 text-sm font-medium font-mono ${amountColor}`}>{amountPrefix}{transaction.amount}</td>
                  <td className="py-4 px-4 text-gray-400 text-sm">{formattedDate}</td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/15 text-green-400">
                      {transaction.status}
                    </span>
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

