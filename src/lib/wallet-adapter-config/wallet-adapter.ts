import { http, createConfig } from 'wagmi'
import { base, mainnet } from 'viem/chains'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet, base],
  connectors: [
    injected(), // Automatically detects MetaMask, Coinbase Wallet, Brave Wallet, etc.
  ],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
  },
});