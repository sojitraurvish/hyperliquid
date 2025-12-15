import { Wallet, HDNodeWallet } from 'ethers';
import * as hl from '@nktkas/hyperliquid';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { getLocalStorage, setLocalStorage, LOCAL_STORAGE_KEYS } from '@/lib/sessions/localstorage';

type ApiWalletStore = {
  apiWallet: Wallet | HDNodeWallet | null;
  isApproved: boolean;
  isChecking: boolean;
  isLoading: boolean;
  isError: string | null;

  // Initialize or generate the API wallet
  initializeApiWallet: (userAddress: string) => void;

  // Check if the current API wallet is approved
  checkApprovalStatus: (userAddress: string) => Promise<void>;

  // Approve the API wallet using the Hyperliquid SDK
  approveApiWallet: (userAddress: string, walletClient: any) => Promise<{ success: boolean; data?: any }>;

  // Reset state when disconnected
  reset: () => void;
};

export const useApiWalletStore = create<ApiWalletStore>()(
  devtools(
    persist(
      (set, get) => ({
        apiWallet: null,
        isApproved: false,
        isChecking: false,
        isLoading: false,
        isError: null,

        initializeApiWallet: (userAddress: string) => {
          if (!userAddress) return;

          try {
            const storedData = getLocalStorage(`${LOCAL_STORAGE_KEYS.HYPERLIQUID_AGENT}${userAddress}`);

            if (storedData) {
              try {
                // Parse the JSON object with privateKey and userAddress
                const parsedData = JSON.parse(storedData) as { privateKey: string; userAddress: string };
                
                if (!parsedData.privateKey) {
                  throw new Error('Invalid stored data: missing privateKey');
                }

                const wallet = new Wallet(parsedData.privateKey);
                set({ apiWallet: wallet, isError: null });
              } catch (error) {
                console.error('Error loading API wallet:', error);
                // Generate new wallet if stored data is invalid
                const newWallet = Wallet.createRandom();
                const walletData = {
                  privateKey: newWallet.privateKey,
                  userAddress: userAddress,
                };
                localStorage.setItem(storageKey, JSON.stringify(walletData));
                set({ 
                  apiWallet: newWallet, 
                  isApproved: false, 
                  isError: null 
                });
              }
            } else {
              // Generate new wallet if none exists
              const newWallet = Wallet.createRandom();
              const walletData = {
                privateKey: newWallet.privateKey,
                userAddress: userAddress,
              };
              localStorage.setItem(storageKey, JSON.stringify(walletData));
              set({ 
                apiWallet: newWallet, 
                isApproved: false, 
                isError: null 
              });
            }
          } catch (error) {
            console.error('Error initializing API wallet:', error);
            set({ 
              isError: error instanceof Error ? error.message : 'Failed to initialize API wallet' 
            });
          }
        },

        checkApprovalStatus: async (userAddress: string) => {
          const { apiWallet } = get();
          if (!userAddress || !apiWallet) return;

          set({ isChecking: true, isError: null });

          try {
            const infoClient = new hl.InfoClient({
              transport: new hl.HttpTransport({ isTestnet: true }), // Use testnet for development
            });

            // Use the info method to get user state
            const userState = await (infoClient as any).userState({ user: userAddress });

            // Check if the agent address in the state matches our API wallet
            const approved = userState?.agentAddress === apiWallet.address;
            set({ isApproved: approved, isError: null });
          } catch (error) {
            console.error('Error checking approval:', error);
            set({ 
              isError: error instanceof Error ? error.message : 'Failed to check approval status' 
            });
          } finally {
            set({ isChecking: false });
          }
        },

        approveApiWallet: async (userAddress: string, walletClient: any) => {
          const { apiWallet } = get();
          if (!userAddress || !apiWallet || !walletClient) {
            const error = 'Wallet not ready for approval';
            set({ isError: error });
            throw new Error(error);
          }

          set({ isLoading: true, isError: null });

          try {
            // Create an ExchangeClient using the user's main wallet (e.g., MetaMask via viem)
            const exchangeClient = new hl.ExchangeClient({
              wallet: walletClient, // The connected wagmi wallet client
              transport: new hl.HttpTransport({ isTestnet: true }),
            });

            // The SDK handles nonce and signing internally
            const result = await exchangeClient.approveAgent({
              agentAddress: apiWallet.address,
            });

            if (result.status === 'ok') {
              set({ isApproved: true, isError: null });
              return { success: true, data: result };
            } else {
              const error = (result as any).response?.data || 'Approval failed';
              set({ isError: error });
              throw new Error(error);
            }
          } catch (error) {
            console.error('API wallet approval error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to approve API wallet';
            set({ isError: errorMessage });
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },

        reset: () => {
          set({
            apiWallet: null,
            isApproved: false,
            isChecking: false,
            isLoading: false,
            isError: null,
          });
        },
      }),
      {
        name: 'api-wallet-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Don't persist the wallet object - it's reconstructed from localStorage private key
          // Only persist approval status and other non-sensitive state
          isApproved: state.isApproved,
        }),
      }
    )
  )
);

