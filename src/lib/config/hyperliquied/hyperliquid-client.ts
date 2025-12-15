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

// 1) shared transport for both info & exchange // Increase timeout to be tolerant to slow networks (default is 10s)
const transport = new HttpTransport({ isTestnet: ENVIRONMENT === ENVIRONMENT_TYPES.DEVELOPMENT,  timeout: 30000 })

// 2) read-only client to list your approved agents // Read-only client
export const infoClient = new InfoClient({ transport })

// Exchange client signing with an AGENT private key
export function getAgentExchangeClient(agentPrivateKey: `0x${string}`) {
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