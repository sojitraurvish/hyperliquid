import { infoClient } from "../config/hyperliquied/hyperliquid-client";
import { errorHandler } from "@/store/errorHandler";

export type CandleInterval = "1m" | "3m" | "5m" | "15m" | "30m" | "1h" | "2h" | "4h" | "8h" | "12h" | "1d" | "3d" | "1w" | "1M";

interface GetCandleDataOptions {
  coin: string;
  interval: CandleInterval;
  startTime: number;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Get candle data with retry logic and error handling
 */
export async function getCandleData({
  coin, 
  interval, 
  startTime,
  maxRetries = 3,
  retryDelay = 1000
}: GetCandleDataOptions) {
  const endTime = Date.now();
  let lastError: Error | null = null;
  
  // Validate time range to prevent requesting too much data
  const timeRange = endTime - startTime;
  const maxTimeRange = 5 * 365 * 24 * 60 * 60 * 1000; // 5 years max (1825 days)
  
  if (timeRange > maxTimeRange) {
    throw new Error(
      `Time range too large. Maximum allowed: 5 years. Requested: ${Math.round(timeRange / (24 * 60 * 60 * 1000))} days. ` +
      `Please select a shorter time period.`
    );
  }
  
  // Retry logic with exponential backoff
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const data = await infoClient.candleSnapshot({ 
        coin, 
        interval, 
        startTime, 
        endTime 
      });
      
      return data;
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on certain errors (validation errors, etc.)
      if (error?.message?.includes("Time range too large") || 
          error?.message?.includes("Invalid") ||
          error?.status === 400) {
        throw error;
      }
      
      // If this is not the last attempt, wait and retry
      if (attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
        console.warn(
          `Candle data request failed (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delay}ms...`,
          error
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // If all retries failed, show error toast and throw
  const errorMessage = lastError?.message || "Unknown error";
  const isTimeout = errorMessage.includes("timeout") || errorMessage.includes("Timeout");
  
  let userFriendlyMessage = "";
  if (isTimeout) {
    userFriendlyMessage = 
      `Request timed out. This may be due to network issues or requesting too much data. ` +
      `Please try selecting a shorter time period or a larger interval.`;
  } else {
    userFriendlyMessage = `Failed to fetch candle data after ${maxRetries + 1} attempts. ${errorMessage}`;
  }
  
  // Show toast notification
  errorHandler(lastError || new Error(userFriendlyMessage), "Chart Data Error");
  
  // Throw error for component to handle
  throw new Error(userFriendlyMessage);
}