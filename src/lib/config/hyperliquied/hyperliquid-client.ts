// hyperliquidClient.ts
import {
  InfoClient,
  ExchangeClient,
  HttpTransport,
  SubscriptionClient,
  WebSocketTransport
} from '@nktkas/hyperliquid'
import type { AbstractWallet } from '@nktkas/hyperliquid/signing'
import { privateKeyToAccount } from 'viem/accounts'
import { ENVIRONMENT, ENVIRONMENT_TYPES } from '@/lib/constants'
import { SymbolConverter, formatPrice, formatSize } from '@nktkas/hyperliquid/utils'

// 1) shared transport for both info & exchange // Increase timeout to be tolerant to slow networks (default is 10s)
export const transport = new HttpTransport({ isTestnet: ENVIRONMENT === ENVIRONMENT_TYPES.DEVELOPMENT,  timeout: 30000 })

// 2) read-only client to list your approved agents // Read-only client
export const infoClient = new InfoClient({ transport })

// Cache the symbol converter instance to avoid repeated API calls
let symbolConverterCache: Awaited<ReturnType<typeof SymbolConverter.create>> | null = null;

export async function getSymbolConverter() {
  if (!symbolConverterCache) {
    symbolConverterCache = await SymbolConverter.create({ transport })
  }
  return symbolConverterCache
}

// Exchange client signing with an AGENT private key
export function getAgentExchangeClient(agentPrivateKey: `0x${string}`) {
  if (!agentPrivateKey) {
    throw new Error("Agent private key is required but was not provided. Please ensure the API wallet is initialized.");
  }
  const account = privateKeyToAccount(agentPrivateKey)
  return new ExchangeClient({ transport, wallet: account })
}

// Exchange client signing with the USER’S web wallet (wagmi walletClient)
export function getUserExchangeClient(walletClient: AbstractWallet) {
    // walletClient must implement signTypedData (wagmi viem wallet client does)
  return new ExchangeClient({
    transport,
    wallet: walletClient
  })
}


// You can add other WebSocketTransport options if needed (e.g., custom url)
const wsTransport = new WebSocketTransport({ isTestnet: ENVIRONMENT === ENVIRONMENT_TYPES.DEVELOPMENT });


export const subscriptionClient = new SubscriptionClient({
  transport: wsTransport, // defaults to mainnet wss://api.hyperliquid.xyz/ws
});

// // Optional: small helper wrappers for common subs
// export async function subscribeL2Book(
//   params: { coin: string; nSigFigs?: 2 | 3 | 4 | 5 | null; mantissa?: 1 | 2 | 5 | null },
//   onData: (book: {
//     coin: string;
//     time: number; // ms since epoch
//     levels: [{ px: string; sz: string; n: number }[], { px: string; sz: string; n: number }[]]; // [bids, asks]
//   }) => void
// ) {
//   // Note: nSigFigs and mantissa are optional. mantissa is only valid when nSigFigs is 5.
//   return subscriptionClient.l2Book(params, onData);
// }



// --------


// // using the same getUserExchangeClient(walletClient) you use for approvals
// const exchangeClient = getUserExchangeClient(walletClient)

// // Market order example (user signs via connected wallet)
// const res = await exchangeClient.placeOrder?.({
//   coin: "ETH",            // market symbol used by Hyperliquid
//   side: "Buy",            // "Buy" / "Sell" (SDK may also accept "A"/"B" depending on implementation)
//   orderType: "Market",    // "Market" or "Limit"
//   sz: "0.0007",           // size (base asset units or lot units; convert per market lot size)
//   tif: "GTC",             // time-in-force: "GTC" | "IOC" | "ALO" etc
//   reduceOnly: false,      // reduce-only flag
//   cloid: "0x1234...",     // optional client order id (128-bit hex)
//   // builder fields (optional)
//   b: BUILDER_ADDRESS,     // builder public address (0x...)
//   f: desiredBps * 10      // builder fee in tenths of bps (5 bps -> 50)
// })

// // handle response
// if (res?.status === "ok") {
//   // order accepted
// } else {
//   // show error/res.response
// }