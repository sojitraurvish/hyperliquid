export interface Balance {
    coin: string;
    total_balance: string;
    available_balance: string;
    usdc_value: string;
  }



 export type HistoricalOrder = {
    order: {
      coin: string;        // e.g. "@1137" or asset name/index
      side: "B" | "A";
      limitPx: string;     // e.g. "1370.0"
      sz: string;          // remaining size
      oid: number;
      timestamp: number;   // ms epoch
      triggerCondition: string;
      isTrigger: boolean;
      triggerPx: string;
      children: any[];
      isPositionTpsl: boolean;
      reduceOnly: boolean;
      orderType: string;   // "Limit", "Market", ...
      origSz: string;      // original size at placement
      tif?: string;
      cloid?: string | null;
    };
    status: string;
    statusTimestamp: number;
  };

export interface FundingHistory {
  time: number;           // timestamp in milliseconds
  hash: string;           // transaction hash (hex string)
  delta: {
    type: string;         // e.g. "funding"
    coin: string;         // e.g. "BTC"
    usdc: string;         // funding amount in USDC (can be negative)
    szi: string;          // size
    fundingRate: string;  // funding rate
    nSamples: number | null;
  };
}

export interface TradeHistory {
    coin: string;
    px: string;
    sz: string;
    side: "B" | "A";
    time: number;
    startPosition: string;
    dir: string;
    closedPnl: string;
    hash: `0x${string}`;
    oid: number;
    crossed: boolean;
    fee: string;
    tid: number;
    cloid?: `0x${string}` | undefined;
    liquidation?: {
        liquidatedUser: `0x${string}`;
        markPx: string;
        method: "market" | "backstop";
    } | undefined;
    feeToken: string;
    twapId: number | null;
}

export interface OpenOrder {
  coin: string;
  side: "B" | "A";
  limitPx: string;
  sz: string;
  oid: number;
  timestamp: number;
  origSz: string;
  triggerCondition: string;
  isTrigger: boolean;
  triggerPx: string;
  children: any[];
  isPositionTpsl: boolean;
  reduceOnly: boolean;
  orderType: "Market" | "Limit" | "Stop Market" | "Stop Limit" | "Take Profit Market" | "Take Profit Limit";
  tif: "Gtc" | "Ioc" | "Alo" | "FrontendMarket" | "LiquidationMarket" | null;
  cloid: `0x${string}` | null;
}

export interface Position {
  type: "oneWay";
  position: {
      coin: string;
      szi: string;
      leverage: {
          type: "isolated";
          value: number;
          rawUsd: string;
      } | {
          type: "cross";
          value: number;
      };
      entryPx: string;
      positionValue: string;
      unrealizedPnl: string;
      returnOnEquity: string;
      liquidationPx: string | null;
      marginUsed: string;
      maxLeverage: number;
      cumFunding: {
          allTime: string;
          sinceOpen: string;
          sinceChange: string;
      };
  };
}