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

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-400">Asset</th>
              <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-400">Size</th>
              <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-400 hidden sm:table-cell">Value</th>
              <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-400">Entry Price</th>
              <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-400 hidden md:table-cell">Current Price</th>
              <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-400">PnL</th>
              <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-400">TP/SL</th>
              <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
        <tbody>
          {positions.slice(0, 10).map((position, index) => {
            const pos = position.position;
            const posSize = parseFloat(pos.szi);
            const entryPrice = parseFloat(pos.entryPx);
            const currentPrice = parseFloat(pos.positionValue) / Math.abs(posSize);
            const pnl = parseFloat(pos.unrealizedPnl);
            const pnlPercent = (pnl / parseFloat(pos.positionValue)) * 100;

            // Get coin abbreviation (first 2 letters)
            const coinAbbr = pos.coin.substring(0, 2).toUpperCase();
            const coinName = pos.coin;

            return (
              <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                <td className="py-4 px-2 sm:px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-semibold">{coinAbbr}</span>
                    </div>
                    <span className="text-white text-sm font-medium truncate">{coinName}</span>
                  </div>
                </td>
                <td className="py-4 px-2 sm:px-4 text-gray-300 text-sm">{Math.abs(posSize).toFixed(2)}</td>
                <td className="py-4 px-2 sm:px-4 text-gray-300 text-sm hidden sm:table-cell">
                  ${parseFloat(pos.positionValue).toFixed(2)}
                </td>
                <td className="py-4 px-2 sm:px-4 text-gray-300 text-sm">${entryPrice.toFixed(2)}</td>
                <td className="py-4 px-2 sm:px-4 text-gray-300 text-sm hidden md:table-cell">${currentPrice.toFixed(2)}</td>
                <td className="py-4 px-2 sm:px-4">
                  <span className={`text-sm ${pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} ({pnlPercent >= 0 ? "+" : ""}
                    {pnlPercent.toFixed(2)}%)
                  </span>
                </td>
                <td className="py-4 px-2 sm:px-4">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const tpsl = positionTpslMap.get(coinName);
                      const tpPrice = tpsl?.takeProfit?.triggerPx;
                      const slPrice = tpsl?.stopLoss?.triggerPx;
                      const displayTp = tpPrice ? formatPrice(tpPrice, 2) : "--";
                      const displaySl = slPrice ? formatPrice(slPrice, 2) : "--";
                      return (
                        <>
                          <span className="text-sm text-gray-300">
                            {displayTp} / {displaySl}
                          </span>
                          <button
                            onClick={() => handleTpslClick(position)}
                            className="text-green-400 hover:text-green-300 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </td>
                <td className="py-4 px-2 sm:px-4">
                  <button
                    onClick={() => handleClose(position)}
                    className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    Close
                  </button>
                </td>
              </tr>
            );
          })}
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

