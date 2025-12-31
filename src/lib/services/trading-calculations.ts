/**
 * Trading Calculations Service
 * 
 * Implements precise formulas for Hyperliquid trading calculations:
 * - Liquidation price (using Hyperliquid's exact formula)
 * - Order value / notional
 * - Initial margin (using margin tables)
 * - Maintenance margin (using margin tables)
 * - Slippage estimation (VWAP from order book)
 * - Fee estimation
 */

import { OrderBookLevel } from "./trading-panel";
import { infoClient } from "../config/hyperliquied/hyperliquid-client";

// Fee rates (in decimal, e.g., 0.00045 = 0.045%)
export const FEE_RATES = {
  MAKER: 0.00045, // 0.045%
  TAKER: 0.00015, // 0.015%
} as const;

/**
 * Margin tier from Hyperliquid API
 */
export interface MarginTier {
  imf?: number; // Initial margin fraction
  mmf?: number; // Maintenance margin fraction
  maxNotional?: number;
  [key: string]: unknown;
}

/**
 * Calculate order value (notional)
 * @param sizeInBase - Size in base asset units
 * @param price - Price in quote currency (USDC)
 * @returns Order value in USDC
 */
export function calculateOrderValue(sizeInBase: number, price: number): number {
  return sizeInBase * price;
}

/**
 * Get initial margin rate from margin table for a given notional
 * @param marginTable - Array of margin tiers from API
 * @param notional - Order notional value
 * @returns Initial margin fraction (e.g., 0.025 for 2.5%)
 */
export function getInitialMarginRate(
  marginTable: MarginTier[],
  notional: number
): number {
  if (!marginTable || marginTable.length === 0) {
    // Default fallback: use 1/maxLeverage (e.g., 1/50 = 0.02)
    return 0.02;
  }

  // Find the appropriate tier
  for (const tier of marginTable) {
    const maxNotional = tier.maxNotional ?? Infinity;
    if (notional <= maxNotional) {
      // Use imf (initial margin fraction) if available, otherwise estimate from mmf
      return tier.imf ?? (tier.mmf ? tier.mmf * 2 : 0.02);
    }
  }

  // Use last tier if notional exceeds all tiers
  const lastTier = marginTable[marginTable.length - 1];
  return lastTier.imf ?? (lastTier.mmf ? lastTier.mmf * 2 : 0.02);
}

/**
 * Calculate initial margin required
 * @param orderValue - Order notional value
 * @param leverage - Selected leverage (e.g., 40 for 40x)
 * @param marginTable - Margin table from API (optional, for precise calculation)
 * @returns Initial margin in USDC
 */
export function calculateInitialMargin(
  orderValue: number,
  leverage: number,
  marginTable?: MarginTier[]
): number {
  if (marginTable && marginTable.length > 0) {
    // Use margin table for precise calculation
    const initialMarginRate = getInitialMarginRate(marginTable, orderValue);
    return orderValue * initialMarginRate;
  }

  // Simple model: order_value / leverage
  return orderValue / leverage;
}

/**
 * Get maintenance margin rate from margin table
 * @param marginTable - Array of margin tiers from API
 * @param notional - Position notional value
 * @returns Maintenance margin fraction (e.g., 0.005 for 0.5%)
 */
export function getMaintenanceMarginRate(
  marginTable: MarginTier[],
  notional: number
): number {
  if (!marginTable || marginTable.length === 0) {
    // Default fallback: approximately half of initial margin at max leverage
    return 0.005; // 0.5%
  }

  // Find the appropriate tier
  for (const tier of marginTable) {
    const maxNotional = tier.maxNotional ?? Infinity;
    if (notional <= maxNotional) {
      return tier.mmf ?? 0.005;
    }
  }

  // Use last tier if notional exceeds all tiers
  const lastTier = marginTable[marginTable.length - 1];
  return lastTier.mmf ?? 0.005;
}

/**
 * Calculate maintenance margin
 * @param notional - Position notional value
 * @param marginTable - Margin table from API
 * @returns Maintenance margin in USDC
 */
export function calculateMaintenanceMargin(
  notional: number,
  marginTable?: MarginTier[]
): number {
  if (marginTable && marginTable.length > 0) {
    const mmRate = getMaintenanceMarginRate(marginTable, notional);
    return notional * mmRate;
  }

  // Fallback: use default maintenance leverage (typically ~200x, so 0.5%)
  return notional * 0.005;
}

/**
 * Calculate liquidation price using Hyperliquid's exact formula
 * 
 * Formula: liq_price = price - side * (margin_available / position_size) * (1 / (1 - l * side))
 * where l = 1 / MAINTENANCE_LEVERAGE, side = +1 for long, -1 for short
 * 
 * @param price - Current mark price or entry price
 * @param side - +1 for long, -1 for short
 * @param marginAvailable - Available margin (for cross: accountValue - maintenanceMargin, for isolated: isolatedMargin - maintenanceMargin)
 * @param positionSize - Position size in base units (absolute value)
 * @param maintenanceLeverage - Maintenance leverage (from margin table, typically ~200)
 * @returns Liquidation price
 */
export function calculateLiquidationPrice(
  price: number,
  side: 1 | -1,
  marginAvailable: number,
  positionSize: number,
  maintenanceLeverage: number = 200 // Default maintenance leverage
): number {
  if (positionSize === 0) {
    return 0;
  }

  // l = 1 / maintenance_leverage
  const l = 1 / maintenanceLeverage;

  // Formula: liq_price = price - side * (margin_available / position_size) * (1 / (1 - l * side))
  const marginPerUnit = marginAvailable / positionSize;
  const denominator = 1 - l * side;
  
  if (denominator === 0) {
    return 0; // Avoid division by zero
  }

  const liqPrice = price - side * marginPerUnit * (1 / denominator);
  return Math.max(0, liqPrice); // Ensure non-negative
}

/**
 * Calculate liquidation price for cross margin
 * @param price - Current mark price
 * @param side - +1 for long, -1 for short
 * @param accountValue - Total account value
 * @param maintenanceMarginRequired - Total maintenance margin required
 * @param positionSize - Position size in base units (absolute value)
 * @param marginTable - Margin table for maintenance leverage calculation
 * @returns Liquidation price
 */
export function calculateCrossMarginLiquidationPrice(
  price: number,
  side: 1 | -1,
  accountValue: number,
  maintenanceMarginRequired: number,
  positionSize: number,
  marginTable?: MarginTier[]
): number {
  const marginAvailable = accountValue - maintenanceMarginRequired;
  
  // Get maintenance leverage from margin table (default ~200x)
  let maintenanceLeverage = 200;
  if (marginTable && marginTable.length > 0 && positionSize > 0) {
    const notional = positionSize * price;
    const mmRate = getMaintenanceMarginRate(marginTable, notional);
    maintenanceLeverage = 1 / mmRate;
  }

  return calculateLiquidationPrice(
    price,
    side,
    marginAvailable,
    positionSize,
    maintenanceLeverage
  );
}

/**
 * Calculate liquidation price for isolated margin
 * @param price - Current mark price or entry price
 * @param side - +1 for long, -1 for short
 * @param isolatedMargin - Isolated margin allocated to position
 * @param maintenanceMarginRequired - Maintenance margin required for position
 * @param positionSize - Position size in base units (absolute value)
 * @param marginTable - Margin table for maintenance leverage calculation
 * @returns Liquidation price
 */
export function calculateIsolatedMarginLiquidationPrice(
  price: number,
  side: 1 | -1,
  isolatedMargin: number,
  maintenanceMarginRequired: number,
  positionSize: number,
  marginTable?: MarginTier[]
): number {
  const marginAvailable = isolatedMargin - maintenanceMarginRequired;
  
  // Get maintenance leverage from margin table (default ~200x)
  let maintenanceLeverage = 200;
  if (marginTable && marginTable.length > 0 && positionSize > 0) {
    const notional = positionSize * price;
    const mmRate = getMaintenanceMarginRate(marginTable, notional);
    maintenanceLeverage = 1 / mmRate;
  }

  return calculateLiquidationPrice(
    price,
    side,
    marginAvailable,
    positionSize,
    maintenanceLeverage
  );
}

/**
 * Simulate order fill through order book and calculate VWAP, worst price, and slippage
 * @param orderBook - Order book with bids and asks
 * @param sizeBase - Order size in base asset units
 * @param side - "buy" or "sell"
 * @param referencePrice - Reference price (usually mark price or mid price)
 * @returns Object with VWAP, worst price, slippage, cost, or null if not enough depth
 */
export function simulateFill(
  orderBook: { bids: OrderBookLevel[]; asks: OrderBookLevel[] },
  sizeBase: number,
  side: "buy" | "sell",
  referencePrice: number
): { vwap: number; worstPx: number; slippage: number; cost: number; possible: boolean } | null {
  const { bids, asks } = orderBook;

  if (!bids || bids.length === 0 || !asks || asks.length === 0) {
    return null;
  }

  if (referencePrice <= 0) {
    return null;
  }

  // Use asks for buys, bids for sells
  const levels = side === "buy" ? asks : bids;

  if (!levels || levels.length === 0) {
    return null;
  }

  // Simulate order execution
  let remaining = sizeBase;
  let cost = 0; // Total notional spent/received
  let lastPx: number | null = null;

  for (const level of levels) {
    if (remaining <= 0) break;

    const price = parseFloat(level.px);
    const size = parseFloat(level.sz);

    if (isNaN(price) || isNaN(size) || price <= 0 || size <= 0) {
      continue;
    }

    const take = Math.min(remaining, size);
    cost += take * price;
    remaining -= take;
    lastPx = price; // Track the last (worst) price level used
  }

  // If we couldn't fill the entire order, return null
  if (remaining > 0 || lastPx === null) {
    return { vwap: 0, worstPx: 0, slippage: 0, cost: 0, possible: false };
  }

  // Calculate VWAP (volume-weighted average price)
  const vwap = cost / sizeBase;

  // Calculate slippage as percentage
  // For buys: positive slippage means we paid more (bad)
  // For sells: positive slippage means we got less (bad)
  const slippage = ((vwap - referencePrice) / referencePrice) * 100;

  return {
    vwap,
    worstPx: lastPx,
    slippage,
    cost,
    possible: true,
  };
}

/**
 * Estimate slippage by simulating order execution through order book
 * @param orderBook - Order book with bids and asks
 * @param sizeBase - Order size in base asset units
 * @param side - "buy" or "sell"
 * @param referencePrice - Reference price (usually mark price or mid price)
 * @returns Object with slippage percentage and VWAP, or null if not enough depth
 * @deprecated Use simulateFill instead for more detailed results including worstPx
 */
export function estimateSlippage(
  orderBook: { bids: OrderBookLevel[]; asks: OrderBookLevel[] },
  sizeBase: number,
  side: "buy" | "sell",
  referencePrice: number
): { vwap: number; slippage: number; cost: number; possible: boolean } | null {
  const result = simulateFill(orderBook, sizeBase, side, referencePrice);
  if (!result) return null;

  return {
    vwap: result.vwap,
    slippage: result.slippage,
    cost: result.cost,
    possible: result.possible,
  };
}

/**
 * Calculate estimated fees
 * @param orderValue - Order notional value
 * @param isMaker - Whether the order is a maker order
 * @param builderFeeRate - Optional builder fee rate (in bps, e.g., 5 for 5 bps)
 * @returns Estimated fee in USDC
 */
export function calculateFees(
  orderValue: number,
  isMaker: boolean = false,
  builderFeeRate?: number
): number {
  const baseFeeRate = isMaker ? FEE_RATES.MAKER : FEE_RATES.TAKER;
  const baseFee = orderValue * baseFeeRate;

  // Add builder fee if applicable (builder fee is typically a rebate or additional fee)
  let builderFee = 0;
  if (builderFeeRate !== undefined) {
    // Builder fee is in bps (basis points), convert to decimal
    builderFee = orderValue * (builderFeeRate / 10000);
  }

  return baseFee + builderFee;
}

/**
 * Calculate the order price (p) for FrontendMarket orders
 * 
 * The price is calculated as the minimum of:
 * - worst_px: The worst price level the order will touch (from order book simulation)
 * - reference_price * (1 ± max_slippage): The maximum allowed price based on slippage tolerance
 * 
 * This ensures the order can fill immediately but won't execute worse than the slippage tolerance.
 * 
 * @param orderBook - Order book with bids and asks
 * @param sizeBase - Order size in base asset units
 * @param side - "buy" or "sell"
 * @param referencePrice - Reference price (mark price or mid price)
 * @param maxSlippagePercent - Maximum slippage tolerance in percent (e.g., 1 for 1%)
 * @returns The calculated order price, or referencePrice if simulation fails
 */
export function calculateOrderPrice(
  orderBook: { bids: OrderBookLevel[]; asks: OrderBookLevel[] },
  sizeBase: number,
  side: "buy" | "sell",
  referencePrice: number,
  maxSlippagePercent: number
): number {
  // Simulate fill to get VWAP and worst price
  const fillResult = simulateFill(orderBook, sizeBase, side, referencePrice);

  if (!fillResult || !fillResult.possible) {
    // If simulation fails, fallback to reference price with slippage tolerance
    const slippageMultiplier = side === "buy" ? 1 + (maxSlippagePercent / 100) : 1 - (maxSlippagePercent / 100);
    return referencePrice * slippageMultiplier;
  }

  const { worstPx } = fillResult;

  // Calculate maximum allowed price based on slippage tolerance
  const slippageMultiplier = side === "buy" 
    ? 1 + (maxSlippagePercent / 100)  // For buys: allow up to reference * (1 + slippage)
    : 1 - (maxSlippagePercent / 100); // For sells: allow down to reference * (1 - slippage)
  const maxAllowedPrice = referencePrice * slippageMultiplier;

  // For buys: use min(worst_px, max_allowed_price) to ensure we don't pay more than either
  // For sells: use max(worst_px, max_allowed_price) to ensure we don't receive less than either
  if (side === "buy") {
    return Math.min(worstPx, maxAllowedPrice);
  } else {
    return Math.max(worstPx, maxAllowedPrice);
  }
}

/**
 * Fetch margin tables for an asset from Hyperliquid API
 * @param coin - Asset symbol (e.g., "BTC")
 * @returns Margin table array, or null if not found
 */
export async function fetchMarginTable(coin: string): Promise<MarginTier[] | null> {
  try {
    // Fetch webData2 for zero address to get global market data
    const resp = await infoClient.webData2({
      user: "0x0000000000000000000000000000000000000000",
    });

    const universe = resp.meta?.universe || [];
    const assetCtxs = resp.assetCtxs || [];

    // Find the asset in universe
    const assetIndex = universe.findIndex((u) => u?.name === coin);
    if (assetIndex === -1) {
      return null;
    }

    const assetCtx = assetCtxs[assetIndex];
    if (!assetCtx) {
      return null;
    }

    // Margin table should be in meta.marginTables
    // Check if marginTables exists in meta (it might be under a different key)
    const marginTable = (resp.meta as any)?.marginTables?.[assetIndex] || null;

    return marginTable || null;
  } catch (error) {
    console.error("Error fetching margin table:", error);
    return null;
  }
}

/**
 * Fetch mark price and impact prices for an asset
 * @param coin - Asset symbol (e.g., "BTC")
 * @returns Object with markPx and impactPxs, or null if not found
 */
export async function fetchAssetPrices(coin: string): Promise<{
  markPx: number | null;
  impactPxs: number[] | null;
} | null> {
  try {
    const resp = await infoClient.webData2({
      user: "0x0000000000000000000000000000000000000000",
    });

    const universe = resp.meta?.universe || [];
    const assetCtxs = resp.assetCtxs || [];

    const assetIndex = universe.findIndex((u) => u?.name === coin);
    if (assetIndex === -1) {
      return null;
    }

    const assetCtx = assetCtxs[assetIndex];
    if (!assetCtx) {
      return null;
    }

    const markPx = assetCtx.markPx ? Number(assetCtx.markPx) : null;
    const impactPxs = assetCtx.impactPxs
      ? assetCtx.impactPxs.map((px) => Number(px))
      : null;

    return { markPx, impactPxs };
  } catch (error) {
    console.error("Error fetching asset prices:", error);
    return null;
  }
}

/**
 * Comprehensive order calculation result
 */
export interface OrderCalculationResult {
  orderValue: number;
  initialMargin: number;
  maintenanceMargin: number;
  liquidationPrice: number | null;
  slippage: number | null;
  vwap: number | null;
  fees: {
    maker: number;
    taker: number;
    builder?: number;
  };
}

/**
 * Calculate all order metrics in one call
 * @param params - Calculation parameters
 * @returns Comprehensive calculation result
 */
export async function calculateOrderMetrics(params: {
  sizeBase: number;
  price: number;
  side: "buy" | "sell";
  leverage: number;
  marginMode: "Cross" | "Isolated";
  orderBook: { bids: OrderBookLevel[]; asks: OrderBookLevel[] };
  coin: string;
  // For existing positions
  existingPositionSize?: number;
  existingEntryPrice?: number;
  accountValue?: number;
  totalMaintenanceMargin?: number;
  isolatedMargin?: number;
  builderFeeRate?: number;
}): Promise<OrderCalculationResult> {
  const {
    sizeBase,
    price,
    side,
    leverage,
    marginMode,
    orderBook,
    coin,
    existingPositionSize,
    existingEntryPrice,
    accountValue,
    totalMaintenanceMargin,
    isolatedMargin,
    builderFeeRate,
  } = params;

  // Fetch margin table and mark price
  const [marginTable, assetPrices] = await Promise.all([
    fetchMarginTable(coin),
    fetchAssetPrices(coin),
  ]);

  const markPrice = assetPrices?.markPx ?? price;

  // Calculate order value (notional)
  const orderValue = calculateOrderValue(sizeBase, markPrice);

  // Calculate initial margin
  const initialMargin = calculateInitialMargin(
    orderValue,
    leverage,
    marginTable || undefined
  );

  // Calculate maintenance margin
  const maintenanceMargin = calculateMaintenanceMargin(
    orderValue,
    marginTable || undefined
  );

  // Calculate liquidation price
  let liquidationPrice: number | null = null;
  
  if (existingPositionSize !== undefined && Math.abs(existingPositionSize) > 0) {
    // For existing positions
    const positionSide = existingPositionSize > 0 ? 1 : -1;
    const positionSizeAbs = Math.abs(existingPositionSize);
    const entryPrice = existingEntryPrice ?? markPrice;

    if (marginMode === "Cross" && accountValue !== undefined && totalMaintenanceMargin !== undefined) {
      liquidationPrice = calculateCrossMarginLiquidationPrice(
        entryPrice,
        positionSide,
        accountValue,
        totalMaintenanceMargin,
        positionSizeAbs,
        marginTable || undefined
      );
    } else if (marginMode === "Isolated" && isolatedMargin !== undefined) {
      liquidationPrice = calculateIsolatedMarginLiquidationPrice(
        entryPrice,
        positionSide,
        isolatedMargin,
        maintenanceMargin,
        positionSizeAbs,
        marginTable || undefined
      );
    }
  } else if (sizeBase > 0) {
    // For new orders
    const orderSide = side === "buy" ? 1 : -1;

    if (marginMode === "Cross" && accountValue !== undefined && totalMaintenanceMargin !== undefined) {
      // Estimate new position after order
      const newPositionSize = sizeBase;
      const newOrderValue = calculateOrderValue(newPositionSize, markPrice);
      const newMaintenanceMargin = calculateMaintenanceMargin(
        newOrderValue,
        marginTable || undefined
      );
      
      liquidationPrice = calculateCrossMarginLiquidationPrice(
        markPrice,
        orderSide,
        accountValue,
        (totalMaintenanceMargin || 0) + newMaintenanceMargin,
        newPositionSize,
        marginTable || undefined
      );
    } else if (marginMode === "Isolated") {
      liquidationPrice = calculateIsolatedMarginLiquidationPrice(
        markPrice,
        orderSide,
        initialMargin,
        maintenanceMargin,
        sizeBase,
        marginTable || undefined
      );
    }
  }

  // Calculate slippage (use simulateFill for more details)
  const slippageResult = simulateFill(orderBook, sizeBase, side, markPrice);
  const slippage = slippageResult?.slippage ?? null;
  const vwap = slippageResult?.vwap ?? null;

  // Calculate fees
  const fees = {
    maker: calculateFees(orderValue, true, builderFeeRate),
    taker: calculateFees(orderValue, false, builderFeeRate),
    ...(builderFeeRate !== undefined ? { builder: calculateFees(orderValue, false, builderFeeRate) - calculateFees(orderValue, false) } : undefined),
  };

  return {
    orderValue,
    initialMargin,
    maintenanceMargin,
    liquidationPrice,
    slippage,
    vwap,
    fees,
  };
}

