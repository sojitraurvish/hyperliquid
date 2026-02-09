export type AnchorField = "price" | "pnl"

export type PnlKind = "takeProfit" | "stopLoss"

export type TpslVariant = "percent" | "dollar"

export type TpSlValidationError = {
  takeProfitError: boolean
  stopLossError: boolean
}

export type OrderDirection = "buy" | "sell"

export const ORDER_DIRECTION = {
  LONG: "buy" as OrderDirection,
  SHORT: "sell" as OrderDirection,
}




