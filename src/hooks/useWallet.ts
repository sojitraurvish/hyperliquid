import { useState, useEffect } from 'react'
import { Wallet, HDNodeWallet } from 'ethers'
import { useAccount, useWalletClient } from 'wagmi'
import { getWalletClient } from 'wagmi/actions'
import { config } from '@/lib/config/wallet-adapter/wallet-adapter'
import { getLocalStorage, LOCAL_STORAGE_KEYS, setLocalStorage } from '@/lib/sessions/localstorage'
import { infoClient, getUserExchangeClient } from '@/lib/config/hyperliquied/hyperliquid-client'
import { appToast } from '@/components/ui/toast'
import { errorHandler } from '@/store/errorHandler'

// Module-level flag to track if approval check is in progress
let isCheckingApproval = false

/**
 * Hook to manage API wallet generation and storage
 * This creates a secondary wallet for trading that gets approved by the main wallet
 */
export const useApiWallet = ({userPublicKey}: {userPublicKey: `0x${string}`}) => {
  console.log("userPublicKey", userPublicKey)
  const [agentWallet, setAgentWallet] = useState<Wallet | HDNodeWallet | null>(null)
  const [isApproved, setIsApproved] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const {isConnected} = useAccount()
  const { data: walletClient, isPending: isWalletClientPending } = useWalletClient()

  // Helper function to reliably get wallet client with retry logic
  const getReliableWalletClient = async (maxRetries = 3, delay = 200) => {
    // First try: use hook's walletClient if available
    if (walletClient && !isWalletClientPending) {
      return walletClient;
    }

    // Retry: get wallet client directly from wagmi
    for (let i = 0; i < maxRetries; i++) {
      try {
        const client = await getWalletClient(config);
        if (client) {
          return client;
        }
      } catch (error) {
        console.log(`Attempt ${i + 1} to get wallet client failed, retrying...`);
      }
      
      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }

    return null;
  }

  const approveAgent = async ({agentPublicKeyParam = agentWallet?.address as `0x${string}`, userPublicKeyParam = userPublicKey }: {agentPublicKeyParam?: `0x${string}`, userPublicKeyParam?: `0x${string}`}) => {
    if (!userPublicKeyParam || !agentPublicKeyParam) {
      appToast.error({ message: "Missing required parameters for agent approval"});
      return false;
    }

    // Get reliable wallet client
    const clientToUse = await getReliableWalletClient();
    if (!clientToUse) {
      appToast.error({ message: "Wallet client not available. Please ensure your wallet is connected and unlocked, then try again."});
      return false;
    }
    
    try {
      setIsApproving(true);
      const exchangeClient = getUserExchangeClient(clientToUse);
      
      const result = await exchangeClient.approveAgent({
        agentAddress: agentPublicKeyParam,
        agentName: `agent${userPublicKeyParam.slice(0, 6)}_${userPublicKeyParam.slice(-4)}`
      });

      if (result.status === 'ok') {
        return true;
      } else {
        const error = (result as any).response?.data || 'Approval failed';
        appToast.error({ message: errorHandler(error) });
        return false;
      }
    } catch (e) {
      appToast.error({ message: errorHandler(e) });
      return false;
    } finally {
      setIsApproving(false);
    }
  };


  /**
   * Check if an agent is still valid based on its validUntil timestamp
   */
  function isAgentValid(agent: { validUntil?: number } | undefined): boolean {
    if (!agent?.validUntil) return false;
    return Date.now() < agent.validUntil;
  }

   const checkAgentApproval = async ({agentPublicKeyParam = agentWallet?.address as `0x${string}`, userPublicKeyParam = userPublicKey }: {agentPublicKeyParam?: `0x${string}`, userPublicKeyParam?: `0x${string}`}): Promise<boolean> => {
    const agents = await infoClient.extraAgents({ user: userPublicKeyParam });
    const found = agents.find(
      (a: { address: string; validUntil?: number }) =>
        a.address.toLowerCase() === agentPublicKeyParam?.toLowerCase()
    );
    if(!found) return false;
    return isAgentValid(found);
  };

  const checkApprovalStatus = async ({agentPublicKeyParam = agentWallet?.address as `0x${string}`, userPublicKeyParam = userPublicKey }: {agentPublicKeyParam?: `0x${string}`, userPublicKeyParam?: `0x${string}`}): Promise<boolean> => {
    try {
      const isApprovedResult = await checkAgentApproval({agentPublicKeyParam: agentPublicKeyParam, userPublicKeyParam: userPublicKeyParam});
      
      setIsApproved(isApprovedResult);

      // If not approved and wallet is connected, approve the agent (using reliable wallet client getter)
      if (!isApprovedResult && isConnected) {
          const approvalResult = await approveAgent({agentPublicKeyParam: agentPublicKeyParam, userPublicKeyParam: userPublicKeyParam});
          
            if(approvalResult){
              const updatedApprovedResult = await checkAgentApproval({agentPublicKeyParam: agentPublicKeyParam, userPublicKeyParam: userPublicKeyParam});
              setIsApproved(updatedApprovedResult);
              return updatedApprovedResult;
            } else {
              return false;
            }
      }

      return isApprovedResult;
    } catch (e) {
      appToast.error({ message: errorHandler(e) });
      return false;
    }
  };

    const generateNewApiWallet = ({userPublicKeyParam = userPublicKey}: {userPublicKeyParam?: `0x${string}`}) => {
    try {
      // Generate random private key for API wallet
      const wallet = Wallet.createRandom()
      setLocalStorage(`${LOCAL_STORAGE_KEYS.HYPERLIQUID_AGENT}${userPublicKeyParam}`, { agentPrivateKey: wallet.privateKey, userPublicKey: userPublicKeyParam })
      setAgentWallet(wallet)
      setIsApproved(false) // New wallet needs approval
      // checkApprovalStatus({agentPublicKeyParam: wallet.address as `0x${string}`, userPublicKeyParam: userPublicKeyParam})
    } catch (error) {
      console.error('Error generating API wallet:', error)
    }
  }

  


  const initializeApiWallet = ({userPublicKeyParam = userPublicKey}: {userPublicKeyParam?: `0x${string}`}) => {
    // Check if API wallet already exists in localStorage

    // If API wallet already exists and is approved or approving, return
    if(agentWallet?.address && (isApproved || isApproving)) return; 

    const storedData = getLocalStorage(`${LOCAL_STORAGE_KEYS.HYPERLIQUID_AGENT}${userPublicKeyParam}`)

    if (storedData && storedData?.agentPrivateKey) {
      // Use existing API wallet
      try {   
        const wallet = new Wallet(storedData.agentPrivateKey)
        setAgentWallet(wallet)

        // Only call checkApprovalStatus if it's not already in progress
        // if (!isCheckingApproval) {
        //   isCheckingApproval = true
          // checkApprovalStatus({agentPublicKeyParam: wallet.address as `0x${string}`, userPublicKeyParam : userPublicKeyParam})
          //   .finally(() => {
          //     // Reset flag after completion
          //     isCheckingApproval = false
          //   })
        // }
        
      } catch (error) {
        appToast.error({ message: errorHandler(error) });
        generateNewApiWallet({userPublicKeyParam: userPublicKeyParam})
      }
    } else {
      // Generate new API wallet
        generateNewApiWallet({userPublicKeyParam: userPublicKeyParam})
    }
  }

  useEffect(() => {
    if(!userPublicKey) return
    if(!walletClient?.account.address || isWalletClientPending) return;

    initializeApiWallet({userPublicKeyParam: userPublicKey})
  }, [userPublicKey, walletClient, isWalletClientPending])

  return { agentWallet, agentPrivateKey: agentWallet?.privateKey, isApproved, isApproving, checkApprovalStatus, checkAgentApproval }
}