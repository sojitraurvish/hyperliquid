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
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Type</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Asset</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Amount</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Date</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Status</th>
          </tr>
        </thead>
        <tbody>
          {limitedTransactions.map((transaction, index) => {
            const formattedDate = transaction.date.toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            });

            const amountPrefix = transaction.type === "Withdraw" ? "-" : "+";
            const amountColor = getAmountColor(transaction.type);

            return (
              <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(transaction.type)}
                    <span className="text-gray-300 text-sm">{transaction.type}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-gray-300 text-sm">{transaction.asset}</td>
                <td className={`py-4 px-4 text-sm font-medium ${amountColor}`}>
                  {amountPrefix}
                  {transaction.amount}
                </td>
                <td className="py-4 px-4 text-gray-300 text-sm">{formattedDate}</td>
                <td className="py-4 px-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                    {transaction.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

