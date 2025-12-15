import { http, createConfig } from 'wagmi'
import { Chain, defineChain } from 'viem'
import { injected } from 'wagmi/connectors'
import { arbitrum, arbitrumSepolia, hyperliquidEvmTestnet } from 'viem/chains'
import { ENVIRONMENT, ENVIRONMENT_TYPES } from '@/lib/constants'


// pick the chain(s) our app will support
const chains = ENVIRONMENT === ENVIRONMENT_TYPES.DEVELOPMENT
  ? [arbitrumSepolia]    // USDC on Arbitrum Sepolia for Hyperliquid testnet
  : [arbitrum]           // USDC on Arbitrum One for Hyperliquid mainnet

export const config = createConfig({
  chains: chains as unknown as readonly [Chain, ...Chain[]],
  connectors: [
    injected(),
  ],
  transports: ENVIRONMENT === ENVIRONMENT_TYPES.DEVELOPMENT
    ? {
        [arbitrumSepolia.id]: http(),
      }
    : {
        [arbitrum.id]: http(),
      },
});