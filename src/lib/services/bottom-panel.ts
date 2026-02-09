import { Balance, FundingHistory, HistoricalOrder, OpenOrder, Position, TradeHistory } from "@/types/bottom-panel";
import { infoClient, getUserExchangeClient } from "../config/hyperliquied/hyperliquid-client";
import { addDecimals } from "../constants";
import type { AbstractWallet } from "@nktkas/hyperliquid/signing";

export async function getAllBalances({publicKey}: {publicKey: `0x${string}`}): Promise<Balance[]> {
  const resp = await infoClient.webData2({ user: publicKey as string });

  const ch = resp?.clearinghouseState ?? {};
  const marginSummary = ch?.marginSummary ?? {};

  // Extract spot USDC balance from spotState.balances
  const spotBalances = (resp as any)?.spotState?.balances ?? [];
  const spotUsdc = spotBalances.find((b: { coin: string }) => b.coin === "USDC");
  const spotTotal = spotUsdc ? parseFloat(spotUsdc.total ?? "0") : 0;
  const spotHold = spotUsdc ? parseFloat(spotUsdc.hold ?? "0") : 0;
  const spotAvailable = spotTotal - spotHold;

  const rows: Balance[] = [
    {
      coin: "USDC (Perps)",
      total_balance: `${addDecimals(marginSummary?.accountValue ?? 0)} USDC`,
      available_balance: `${addDecimals(ch?.withdrawable ?? 0)} USDC`,
      usdc_value: addDecimals(marginSummary?.accountValue ?? 0),
    },
  ];

  if (spotTotal > 0) {
    rows.push({
      coin: "USDC (Spot)",
      total_balance: `${addDecimals(spotTotal)} USDC`,
      available_balance: `${addDecimals(spotAvailable)} USDC`,
      usdc_value: addDecimals(spotTotal),
    });
  }

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

/**
 * Transfer USDC between Perps and Spot balances.
 * Uses the user's connected wallet (not the agent) since this is a user-signed action.
 * @param walletClient - The wagmi wallet client (user's connected wallet)
 * @param amount - Amount to transfer as a string (e.g. "100" = $100)
 * @param toPerp - true = Spot → Perps, false = Perps → Spot
 */
export const transferUsdcBetweenAccounts = async ({
  walletClient,
  amount,
  toPerp,
}: {
  walletClient: AbstractWallet;
  amount: string;
  toPerp: boolean;
}) => {
  const exchangeClient = getUserExchangeClient(walletClient);
  return await exchangeClient.usdClassTransfer({ amount, toPerp });
}

