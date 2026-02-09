// ==================== Network Preference ====================
// Reads/writes the user's mainnet vs testnet preference from localStorage.
// Used by ENVIRONMENT constant to determine which Hyperliquid network to connect to.

const STORAGE_KEY = "ht-network";

export type NetworkMode = "mainnet" | "testnet";

/**
 * Read the persisted network preference.
 * Returns "mainnet" by default (production fallback, safe for SSR).
 */
export function getNetworkPreference(): NetworkMode {
  if (typeof window === "undefined") return "mainnet";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "testnet" || stored === "mainnet") return stored;
  } catch {
    // localStorage might be blocked
  }
  return "mainnet";
}

/**
 * Persist the network preference.
 */
export function setNetworkPreference(network: NetworkMode): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, network);
  } catch {
    // silently fail
  }
}
