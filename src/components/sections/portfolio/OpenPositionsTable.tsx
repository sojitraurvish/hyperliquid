"use client";

import { useState, useMemo } from "react";
import { Pencil } from "lucide-react";
import { Position, OpenOrder } from "@/types/bottom-panel";
import { PositionTpslModal } from "./PositionTpslModal";
import { placePositionTpslOrder, cancelOrdersWithAgent } from "@/lib/services/trading-panel";
import { useApiWallet } from "@/hooks/useWallet";
import { useAccount } from "wagmi";
import { appToast } from "@/components/ui/toast";
import { formatPrice } from "@nktkas/hyperliquid/utils";
import { getSymbolConverter } from "@/lib/config/hyperliquied/hyperliquid-client";
import { addDecimals } from "@/lib/constants";

interface OpenPositionsTableProps {
  positions: Position[];
  isLoading: boolean;
  openOrders?: OpenOrder[];
}

export const OpenPositionsTable = ({ positions, isLoading, openOrders = [] }: OpenPositionsTableProps) => {
  const { address } = useAccount();
  const { agentPrivateKey } = useApiWallet({ userPublicKey: address as `0x${string}` });
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Extract TP/SL orders for each position
  const positionTpslMap = useMemo(() => {
    const map = new Map<string, { takeProfit?: { triggerPx: string; limitPx?: string; orderId?: string }, stopLoss?: { triggerPx: string; limitPx?: string; orderId?: string } }>();
    
    openOrders.forEach((order) => {
      if (order.isPositionTpsl && order.coin) {
        const coin = order.coin;
        if (!map.has(coin)) {
          map.set(coin, {});
        }
        const tpsl = map.get(coin)!;
        
        // Check if it's a TP or SL order based on orderType
        if (order.orderType?.includes("Take Profit")) {
          tpsl.takeProfit = {
            triggerPx: order.triggerPx,
            limitPx: order.limitPx && order.orderType.includes("Limit") ? order.limitPx : undefined,
            orderId: String(order.oid),
          };
        } else if (order.orderType?.includes("Stop")) {
          tpsl.stopLoss = {
            triggerPx: order.triggerPx,
            limitPx: order.limitPx && order.orderType.includes("Limit") ? order.limitPx : undefined,
            orderId: String(order.oid),
          };
        }
      }
    });
    
    return map;
  }, [openOrders]);

  const handleTpslClick = (position: Position) => {
    setSelectedPosition(position);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPosition(null);
  };

  const handleConfirmTpsl = async (params: {
    takeProfitPrice?: number;
    stopLossPrice?: number;
    takeProfitLimitPrice?: number;
    stopLossLimitPrice?: number;
    orderSize?: number;
  }) => {
    if (!selectedPosition || !agentPrivateKey || !address) {
      appToast.error({ message: "Missing required information" });
      return;
    }

    try {
      const pos = selectedPosition.position;
      const coin = pos.coin;
      const isLong = parseFloat(pos.szi) > 0;
      
      const conv = await getSymbolConverter();
      const szDecimals = conv.getSzDecimals(coin) || 4;
      // If orderSize is 0, it means Configure Amount was not selected (use full position)
      // If orderSize is provided and > 0, use that specific size
      const sizeStr = params.orderSize === 0 
        ? "0" 
        : params.orderSize && params.orderSize > 0
          ? addDecimals(params.orderSize, szDecimals)
          : "0";

      await placePositionTpslOrder({
        agentPrivateKey: agentPrivateKey as `0x${string}`,
        a: coin,
        b: isLong,
        s: sizeStr,
        takeProfitPrice: params.takeProfitPrice,
        stopLossPrice: params.stopLossPrice,
        takeProfitLimitPrice: params.takeProfitLimitPrice,
        stopLossLimitPrice: params.stopLossLimitPrice,
      });

      appToast.success({ title: "TP/SL orders placed successfully" });
    } catch (error: any) {
      console.error("Error placing TP/SL orders:", error);
      appToast.error({ message: error?.message || "Failed to place TP/SL orders" });
      throw error;
    }
  };

  const handleCancelTpsl = async (type: "tp" | "sl") => {
    if (!selectedPosition || !agentPrivateKey || !address) {
      appToast.error({ message: "Missing required information" });
      return;
    }

    try {
      const coin = selectedPosition.position.coin;
      const tpsl = positionTpslMap.get(coin);
      if (!tpsl) return;

      const orderToCancel = type === "tp" ? tpsl.takeProfit : tpsl.stopLoss;
      if (!orderToCancel?.orderId) return;

      await cancelOrdersWithAgent({
        agentPrivateKey: agentPrivateKey as `0x${string}`,
        orders: [{ orderId: orderToCancel.orderId, a: coin }],
      });

      appToast.success({ title: `${type === "tp" ? "Take Profit" : "Stop Loss"} order canceled` });
    } catch (error: any) {
      console.error("Error canceling TP/SL order:", error);
      appToast.error({ message: error?.message || "Failed to cancel order" });
      throw error;
    }
  };

  const handleClose = (position: Position) => {
    // Redirect to trade page for operations
    window.location.href = "/trade";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-sm">No open positions</p>
      </div>
    );
  }

  const renderPositionCard = (position: Position, index: number) => {
    const pos = position.position;
    const posSize = parseFloat(pos.szi);
    const entryPrice = parseFloat(pos.entryPx);
    const currentPrice = parseFloat(pos.positionValue) / Math.abs(posSize);
    const pnl = parseFloat(pos.unrealizedPnl);
    const pnlPercent = (pnl / parseFloat(pos.positionValue)) * 100;
    const coinAbbr = pos.coin.substring(0, 2).toUpperCase();
    const coinName = pos.coin;
    const isLong = posSize > 0;
    const tpsl = positionTpslMap.get(coinName);
    const tpPrice = tpsl?.takeProfit?.triggerPx;
    const slPrice = tpsl?.stopLoss?.triggerPx;

    return (
      <div key={index} className="mx-3 my-2.5 rounded-xl bg-gray-800/30 border border-gray-700/30 overflow-hidden">
        {/* Header row */}
        <div className={`flex items-center justify-between px-4 py-3 ${isLong ? "bg-green-500/4" : "bg-red-500/4"}`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isLong ? "bg-green-500/15" : "bg-red-500/15"}`}>
              <span className={`text-xs font-bold ${isLong ? "text-green-400" : "text-red-400"}`}>{coinAbbr}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white text-[13px] font-semibold leading-tight">{coinName}</span>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${isLong ? "text-green-400/80" : "text-red-400/80"}`}>
                {isLong ? "Long" : "Short"} · {Math.abs(posSize).toFixed(4)}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-sm font-bold font-mono ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
              {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
            </div>
            <div className={`text-[10px] font-mono ${pnl >= 0 ? "text-green-400/60" : "text-red-400/60"}`}>
              {pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(2)}%
            </div>
          </div>
        </div>
        {/* Data rows */}
        <div className="px-4 py-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-gray-500 block text-[10px] mb-0.5">Entry</span>
                <span className="text-gray-200 font-mono font-medium">${entryPrice.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] mb-0.5">Mark</span>
                <span className="text-gray-200 font-mono font-medium">${currentPrice.toFixed(2)}</span>
              </div>
              {(tpPrice || slPrice) && (
                <div>
                  <span className="text-gray-500 block text-[10px] mb-0.5">TP / SL</span>
                  <span className="font-mono text-gray-300">
                    {tpPrice ? <span className="text-green-400/70">${formatPrice(tpPrice, 2)}</span> : <span className="text-gray-600">--</span>}
                    <span className="text-gray-600 mx-0.5">/</span>
                    {slPrice ? <span className="text-red-400/70">${formatPrice(slPrice, 2)}</span> : <span className="text-gray-600">--</span>}
                  </span>
                </div>
              )}
            </div>
          </div>
          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => handleTpslClick(position)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-gray-400 hover:text-green-400 bg-gray-700/30 hover:bg-gray-700/50 text-[11px] font-medium rounded-lg transition-colors"
            >
              <Pencil className="w-3 h-3" /> TP/SL
            </button>
            <button
              onClick={() => handleClose(position)}
              className="flex-1 py-2 text-white bg-gray-700/40 hover:bg-red-500/20 hover:text-red-400 text-[11px] font-semibold rounded-lg transition-colors text-center"
            >
              Close Position
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPositionRow = (position: Position, index: number) => {
    const pos = position.position;
    const posSize = parseFloat(pos.szi);
    const entryPrice = parseFloat(pos.entryPx);
    const currentPrice = parseFloat(pos.positionValue) / Math.abs(posSize);
    const pnl = parseFloat(pos.unrealizedPnl);
    const pnlPercent = (pnl / parseFloat(pos.positionValue)) * 100;
    const coinAbbr = pos.coin.substring(0, 2).toUpperCase();
    const coinName = pos.coin;
    const tpsl = positionTpslMap.get(coinName);
    const tpPrice = tpsl?.takeProfit?.triggerPx;
    const slPrice = tpsl?.stopLoss?.triggerPx;
    const displayTp = tpPrice ? formatPrice(tpPrice, 2) : "--";
    const displaySl = slPrice ? formatPrice(slPrice, 2) : "--";

    return (
      <tr key={index} className="border-b border-gray-800/40 hover:bg-gray-800/30 transition-colors">
        <td className="py-4 px-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-semibold">{coinAbbr}</span>
            </div>
            <span className="text-white text-sm font-medium">{coinName}</span>
          </div>
        </td>
        <td className="py-4 px-4 text-gray-300 text-sm font-mono">{Math.abs(posSize).toFixed(4)}</td>
        <td className="py-4 px-4 text-gray-300 text-sm font-mono hidden lg:table-cell">${parseFloat(pos.positionValue).toFixed(2)}</td>
        <td className="py-4 px-4 text-gray-300 text-sm font-mono">${entryPrice.toFixed(2)}</td>
        <td className="py-4 px-4 text-gray-300 text-sm font-mono hidden lg:table-cell">${currentPrice.toFixed(2)}</td>
        <td className="py-4 px-4">
          <span className={`text-sm font-mono ${pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
            {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} ({pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(1)}%)
          </span>
        </td>
        <td className="py-4 px-4 hidden xl:table-cell">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 font-mono">{displayTp} / {displaySl}</span>
            <button onClick={() => handleTpslClick(position)} className="p-1.5 text-green-400 hover:text-green-300 hover:bg-gray-800/50 rounded-lg transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
        <td className="py-4 px-4">
          <div className="flex items-center gap-1">
            <button onClick={() => handleTpslClick(position)} className="xl:hidden p-1.5 text-gray-400 hover:text-green-400 hover:bg-gray-800/50 rounded-lg transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => handleClose(position)} className="px-3 py-1.5 text-green-400 hover:text-green-300 hover:bg-green-500/10 text-sm font-medium rounded-lg transition-colors">
              Close
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div>
      {/* Mobile card layout */}
      <div className="sm:hidden py-1">
        {positions.slice(0, 10).map((position, index) => renderPositionCard(position, index))}
      </div>

      {/* Desktop table layout */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800/60">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Value</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Entry</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Mark</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">PnL</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">TP/SL</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {positions.slice(0, 10).map((position, index) => renderPositionRow(position, index))}
          </tbody>
        </table>
      </div>

      {/* TP/SL Modal */}
      {selectedPosition && (
        <PositionTpslModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          position={selectedPosition}
          onConfirm={handleConfirmTpsl}
          existingTpsl={positionTpslMap.get(selectedPosition.position.coin)}
          onCancelTpsl={handleCancelTpsl}
        />
      )}
    </div>
  );
};

