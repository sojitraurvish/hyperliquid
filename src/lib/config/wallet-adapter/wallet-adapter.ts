import { http, createConfig } from 'wagmi'
import { Chain } from 'viem'
import { injected } from 'wagmi/connectors'
import { arbitrum, arbitrumSepolia } from 'viem/chains'
import { ENVIRONMENT, ENVIRONMENT_TYPES } from '@/lib/constants'

// Both chains are available so the user can switch between mainnet and testnet
// at runtime. The active chain is determined by ENVIRONMENT (which reads localStorage).
export const allChains = [arbitrum, arbitrumSepolia] as const

// The "active" chain is the first one based on environment.
// Used by components that need the default chain (Deposit, Withdraw, etc.).
export const activeChain = ENVIRONMENT === ENVIRONMENT_TYPES.DEVELOPMENT
  ? arbitrumSepolia
  : arbitrum

// Legacy alias kept for compatibility
export const chains = [activeChain]

export const config = createConfig({
  chains: allChains as unknown as readonly [Chain, ...Chain[]],
  connectors: [
    injected(),
  ],
  transports: {
    [arbitrum.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
})


