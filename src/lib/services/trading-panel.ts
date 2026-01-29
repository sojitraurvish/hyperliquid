import { CancelPayload, OrderPayload } from "@/types/trading-panel";
import { BUILDER_CONFIG } from "../config";
import { getAgentExchangeClient, getSymbolConverter } from "../config/hyperliquied/hyperliquid-client";

export interface OrderBookLevel {
  px: string;
  sz: string;
}

/**
 * Calculate slippage for a market order by simulating execution through the order book
 * @param orderBook - Object containing bids and asks arrays
 * @param orderSize - Size of the order in base asset (e.g., ETH)
 * @param side - "buy" or "sell"
 * @returns Slippage percentage (positive for unfavorable slippage, negative for favorable)
 */
export const calculateSlippage = (
  orderBook: { bids: OrderBookLevel[]; asks: OrderBookLevel[] },
  orderSize: number,
  side: "buy" | "sell"
): number => {
  const { bids, asks } = orderBook;

  // Need at least one bid and one ask to calculate reference price
  if (!bids || bids.length === 0 || !asks || asks.length === 0) {
    return 0;
  }

  // Get reference price (mid price)
  const bestBid = parseFloat(bids[0]?.px || "0");
  const bestAsk = parseFloat(asks[0]?.px || "0");
  const referencePrice = (bestBid + bestAsk) / 2;

  if (referencePrice === 0) {
    return 0;
  }

  // Determine which side of the book to use
  const levels = side === "sell" ? bids : asks;

  if (!levels || levels.length === 0) {
    return 0;
  }

  // Simulate order execution by walking through the order book
  let totalQuote = 0; // Total quote currency received/paid
  let totalBase = 0; // Total base currency filled
  let remaining = orderSize;

  for (const level of levels) {
    if (remaining <= 0) break;

    const price = parseFloat(level.px);
    const size = parseFloat(level.sz);

    if (isNaN(price) || isNaN(size) || price <= 0 || size <= 0) {
      continue;
    }

    const fillAmount = Math.min(remaining, size);
    totalQuote += fillAmount * price;
    totalBase += fillAmount;
    remaining -= fillAmount;
  }

  // If we couldn't fill the entire order, calculate based on what we could fill
  if (totalBase === 0) {
    return 0;
  }

  // Calculate average execution price
  const avgExecutionPrice = totalQuote / totalBase;

  // Calculate slippage as percentage
  // For sell orders: positive slippage means we got less than expected (bad)
  // For buy orders: positive slippage means we paid more than expected (bad)
  const slippage = ((avgExecutionPrice - referencePrice) / referencePrice) * 100;

  // For sell orders, slippage should be negative if we got less (unfavorable)
  // For buy orders, slippage should be positive if we paid more (unfavorable)
  // The formula already handles this correctly
  return slippage;
};


export const updateMarginAndLeverage = async ({currentCurrency, agentPrivateKey, marginMode, leverage}: {currentCurrency: string, agentPrivateKey: `0x${string}`, marginMode: string, leverage: number}) => {
    const conv = await getSymbolConverter();
    const assetId = conv.getAssetId(currentCurrency);
    const exchange = await getAgentExchangeClient(agentPrivateKey as `0x${string}`);
    return await exchange.updateLeverage(
        { asset: assetId as number, isCross: marginMode === "Cross", leverage },
    );
}


export const placeOrderWithAgent = async ({
    agentPrivateKey,
    a,
    b, 
    r, 
    s, // string or number
    p, // for limit orders
    tif = "FrontendMarket",
    builderAddress=BUILDER_CONFIG.BUILDER_FEE_ADDRESS, // optional
    desiredBps=BUILDER_CONFIG.BUILDER_FEE_RATE * 10, //  // f uses tenths of bps: 1 bps => 10
    takeProfitPrice,
    stopLossPrice
  }: {
    agentPrivateKey: string,
    a: string,
    b: boolean,
    s: string,
    p: string,
    r: boolean,
    tif?: "FrontendMarket" | "Gtc" | "Ioc" | "Alo" | "LiquidationMarket",
    builderAddress?: `0x${string}`,
    desiredBps?: number,
    takeProfitPrice?: number,
    stopLossPrice?: number
  }): Promise<OrderPayload> => {
    const conv = await getSymbolConverter();
    const assetId = conv.getAssetId(a);
    const agentExchangeClient = getAgentExchangeClient(agentPrivateKey as `0x${string}`)

    const hasTpsl = takeProfitPrice !== undefined || stopLossPrice !== undefined;
    
    // When TP/SL is enabled, main order must use FrontendMarket tif
    const mainOrderTif = hasTpsl ? "FrontendMarket" : tif;
    
    const orders: any[] = [
      {
        a: String(assetId), // Convert to string as API expects string ID
        b: b,
        p: p,
        r: r,
        s: s,
        t: { limit: { tif: mainOrderTif} }
      }
    ];

    // Add TP/SL orders if provided
    if (hasTpsl) {

      // Add Stop Loss order if provided
      if (stopLossPrice !== undefined) {
        orders.push({
          a: String(assetId),
          b: !b, // Opposite side of main order
          p: String(stopLossPrice),
          r: true, // Reduce only
          s: s,
          t: {
            trigger: {
              isMarket: true,
              tpsl: "sl",
              triggerPx: String(stopLossPrice)
            }
          }
        });
      }

      // Add Take Profit order if provided
      if (takeProfitPrice !== undefined) {
        orders.push({
          a: String(assetId),
          b: !b, // Opposite side of main order
          p: String(takeProfitPrice),
          r: true, // Reduce only
          s: s,
          t: {
            trigger: {
              isMarket: true,
              tpsl: "tp",
              triggerPx: String(takeProfitPrice)
            }
          }
        });
      }
    }

    const res = await agentExchangeClient.order({
      grouping: hasTpsl ? "normalTpsl" : "na",
      orders: orders,
      ...(builderAddress && desiredBps ? { builder: { b: builderAddress, f: desiredBps } } : {})
    })
    return res as OrderPayload;
  }


export const cancelOrdersWithAgent = async ({
    agentPrivateKey,
    orders,
  }: {
    agentPrivateKey: string,
    orders: {
      orderId: string,
      a: string
    }[]
  }): Promise<CancelPayload> => {
    const conv = await getSymbolConverter();
    const agentExchangeClient = getAgentExchangeClient(agentPrivateKey as `0x${string}`);
    
    const cancels = orders.map(({ orderId, a }) => {
      const assetId = conv.getAssetId(a) as number;
      return { a: assetId, o: orderId };
    });
    
    return await agentExchangeClient.cancel({ cancels });
  }