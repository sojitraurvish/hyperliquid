import { infoClient } from "../config/hyperliquied/hyperliquid-client";

export type CandleInterval = "1m" | "3m" | "5m" | "15m" | "30m" | "1h" | "2h" | "4h" | "8h" | "12h" | "1d" | "3d" | "1w" | "1M";

export async function getCandleData({coin, interval, startTime}: {coin: string, interval: CandleInterval, startTime: number}) {
    return await infoClient.candleSnapshot({ coin, interval, startTime, endTime: Date.now() });
}