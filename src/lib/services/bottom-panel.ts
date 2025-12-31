import { Balance, FundingHistory, HistoricalOrder, OpenOrder, Position, TradeHistory } from "@/types/bottom-panel";
import { infoClient } from "../config/hyperliquied/hyperliquid-client";
import { addDecimals } from "../constants";

export async function getAllBalances({publicKey}: {publicKey: `0x${string}`}): Promise<Balance[]> {
  const resp = await infoClient.webData2({ user: publicKey as string });

  const ch = resp?.clearinghouseState ?? {};
  const marginSummary = ch?.marginSummary ?? {};

  const rows: Balance[] = [
    {
      coin: "USDC (Perps)",
      total_balance: `${addDecimals(marginSummary?.accountValue ?? 0)} USDC`,
      available_balance: `${addDecimals(ch?.withdrawable ?? 0)} USDC`,
      usdc_value: addDecimals(marginSummary?.accountValue ?? 0),
    },
  ];

  return rows;
}


 // SymbolConverter can translate symbols <-> ids; create it to attempt friendly names
 export const getHistoricalOrders = async ({publicKey}: {publicKey: `0x${string}`}): Promise<HistoricalOrder[]> => {
  const resp = await infoClient.historicalOrders({ user: publicKey as string });
  return await resp.filter((r) => !r.order.coin.startsWith("@")) as HistoricalOrder[];
}


export const getUserFundings = async ({publicKey}: {publicKey: `0x${string}`}): Promise<FundingHistory[]> => {
  return await infoClient.userFunding({ user: publicKey as string, startTime: 0 });
}

export const getUserTradeHistory = async ({publicKey}: {publicKey: `0x${string}`}): Promise<TradeHistory[]> => {
  const resp = await infoClient.userFillsByTime({ user: publicKey as string, startTime: 0 });
  return await resp.filter((r) => !r.coin.startsWith("@")) as TradeHistory[];
}

export const getUserOpenOrders = async ({publicKey}: {publicKey: `0x${string}`}): Promise<OpenOrder[]> => {
  const resp = await infoClient.frontendOpenOrders({ user: publicKey as string });
  return await resp.filter((r) => !r.coin.startsWith("@")) as OpenOrder[];
}


export const getUserPositions = async ({publicKey}: {publicKey: `0x${string}`}): Promise<Position[]> => {
  const resp = await infoClient.clearinghouseState({ user: publicKey as string });
  return await resp.assetPositions as Position[];
}

