import { Settings, Globe, Bell, Mail } from "lucide-react";
import AppButton, { AppButton as Button } from "@/components/ui/button";
import AppDropdown, { DropdownOption } from "@/components/ui/dropdown";
import { VARIANT_TYPES } from "@/lib/constants";
import { useCallback, useEffect, useMemo, useState } from "react";
import AppModal from "@/components/ui/modal";
import { useAccount, useConnect, useDisconnect, useWalletClient, type Connector } from 'wagmi';
import HydrationGuard from "@/components/ui/hydration-guard";
import { ExchangeClient } from "@nktkas/hyperliquid";
import { getUserExchangeClient, infoClient } from "@/lib/config/hyperliquied/hyperliquid-client";
import { AbstractWallet } from "@nktkas/hyperliquid/signing";
import { appToast } from "@/components/ui/toast";
import { DepositModal } from "./DepositModal";
import { WithdrawModal } from "./WithdrawModal";
import { useBottomPanelStore } from "@/store/bottom-panel";
import { useApiWallet } from "@/hooks/useWallet";
import { errorHandler } from "@/store/errorHandler";

const MORE_MENU_ITEMS = [
  "Testnet",
  "Explorer",
  "Sub-Accounts",
  "API",
  "Multi-Sig",
  "Points",
  "Funding Comparison",
  "Announcements",
  "Stats",
  "Docs",
];

const moreDropdownOptions: DropdownOption[] = MORE_MENU_ITEMS.map((item) => ({
  label: item,
  value: item.toLowerCase().replace(/\s+/g, "-"),
  onClick: () => {
    console.log(`${item} clicked`);
  },
}));

const WALLET_INSTALL_OPTIONS = [
  {
    name: 'MetaMask',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
    url: 'https://metamask.io/download/',
    useIcon: false,
  },
  {
    name: 'Browse More Wallets',
    url: 'https://ethereum.org/en/wallets/find-wallet/',
    useIcon: true,
  },
];

export const Header = () => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [isWalletConnectModalOpen, setIsWalletConnectModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { connectors, connect } = useConnect();

  const { data: walletClient } = useWalletClient();

  // Request agentWallet approval when wallet connects
  // useEffect(() => {
  //   if (!address || !isConnected || !agentWallet || !walletClient) {
  //     return;
  //   }

  //   // Only check approval status if not already approved
  //   if (!isApproved) {
  //     checkApprovalStatus({
  //       agentPublicKeyParam: agentWallet.address as `0x${string}`,
  //       userPublicKeyParam: address as `0x${string}`
  //     }).catch((error) => {
  //       console.error('Failed to check/approve agent wallet:', error);
  //       appToast.error({ message: errorHandler(error) });
  //     });
  //   }
  // }, [address, isConnected, agentWallet, walletClient, isApproved, checkApprovalStatus]);
  
  // Use store for balances
  const { balances, isBalancesLoading, getAllBalances: fetchBalancesFromStore } = useBottomPanelStore();
    // Filter out Injected connector and get available wallets
    const availableConnectors = useMemo(() => connectors.filter((connector) => connector.name !== 'Injected'), [connectors]);
  // Format wallet address for display

  // Wallet dropdown options
  const walletDropdownOptions: DropdownOption[] = useMemo(() => [
    {
      label: "Disconnect",
      value: "disconnect",
      onClick: () => {
        disconnect();
      },
    },
  ], [disconnect]);

  // Handle wallet dropdown selection
  const handleWalletAction = useCallback((value: string) => {
    if (value === "view") {
      // Handle view wallet details
      console.log("View wallet clicked");
    } else if (value === "disconnect") {
      disconnect();
      console.log("Disconnect clicked");
    }
  }, [disconnect]);


  // Handle wallet connection with error handling
  const handleConnect = useCallback(async (connector: Connector) => {
    setConnectionError(null);
    try {
      await connect({ connector });
      setIsWalletConnectModalOpen(false);
    } catch (error: unknown) {
      console.error('Connection error:', error);
      
      // Type guard for error with message and code properties
      const isErrorWithMessage = (err: unknown): err is { message?: string; code?: number } => {
        return typeof err === 'object' && err !== null;
      };

      const errorObj = isErrorWithMessage(error) ? error : null;
      const errorMessage = errorObj?.message;
      const errorCode = errorObj?.code;
      
      // Check if wallet is not installed
      if (errorMessage?.includes('Connector not found') || 
          errorMessage?.includes('No provider') ||
          errorCode === 4001) {
        setConnectionError(
          `${connector.name} is not installed. Please install the extension to continue.`
        );
      } else if (errorCode === 4001 || errorMessage?.includes('User rejected')) {
        setConnectionError('Connection request was rejected.');
      } else {
        setConnectionError('Failed to connect. Please try again.');
      }
    }
  }, [connect, disconnect]);

  // Fetch balances function using store
  const fetchBalances = useCallback(async () => {
    if (!address || !isConnected) {
      return;
    }

    await fetchBalancesFromStore({ publicKey: address });
  }, [address, isConnected, fetchBalancesFromStore]);

  // Fetch balances when address is connected
  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Extract numeric values from balance strings (format: "10.92 USDC")
  const parseBalanceValue = (balanceStr: string | undefined): number => {
    if (!balanceStr) return 0;
    const match = balanceStr.match(/^([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
  };

  // Get balance values from store
  const balanceData = balances?.[0]; // Get first balance (USDC Perps)
  const availableBalance = balanceData ? parseBalanceValue(balanceData.available_balance) : 0;
  const totalBalance = balanceData ? parseBalanceValue(balanceData.total_balance) : 0;

  // Format balances for display
  const formattedAvailableBalance = availableBalance.toFixed(2);
  const formattedTotalBalance = totalBalance.toFixed(2);

  
  return (
    <>
    <header className="h-14 border-b border-gray-800 bg-gray-950 flex items-center justify-between px-4">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-500 rounded-full" />
          <span className="font-semibold text-lg text-white">Hypertrading</span>
        </div>
        
        <nav className="flex items-center gap-1">
          {["Trade", "Vaults", "Portfolio", "Staking", "Referrals", "Leaderboard"].map((item) => (
            <Button
              key={item}
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="text-sm px-2 py-2 flex items-center justify-center hover:text-blue-400 text-gray-300 hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg cursor-pointer"
            >
              {item}
            </Button>
          ))}
          <AppDropdown
            variant={VARIANT_TYPES.PRIMARY}
            options={moreDropdownOptions}
            placeholder="More"
            className="w-auto"
            dropdownClassName="text-gray-300 hover:text-blue-400 bg-transparent hover:bg-gray-800 text-sm border-0 !bg-gray-900 !border-gray-700"
            optionClassName="w-40 bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-white border-gray-700"
          />
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <HydrationGuard
          fallback={
            <AppButton 
              variant={VARIANT_TYPES.NOT_SELECTED} 
              className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 text-sm font-medium rounded transition-colors"
            >
              Connect Wallet
            </AppButton>
          }
          className="flex items-center gap-3"
        >
          {isConnected ? (
            <>
              <AppButton 
                variant={VARIANT_TYPES.NOT_SELECTED} 
                className="bg-gray-800/80 border border-gray-700 text-white hover:bg-gray-700/80 px-4 py-2.5 text-xs font-normal rounded transition-all shadow-sm hover:shadow-md cursor-pointer relative overflow-hidden min-w-[200px]"
                onClick={fetchBalances}
                disabled={isBalancesLoading}
              >
                {isBalancesLoading ? (
                  <>
                    <div className="relative z-10 flex items-center gap-2 w-full">
                      <div className="h-3 w-20 bg-gray-600/50 rounded animate-pulse" />
                      <div className="h-3 w-16 bg-gray-600/50 rounded animate-pulse" />
                    </div>
                    <div className="absolute inset-0 w-full h-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)] animate-shimmer" />
                  </>
                ) : (
                  <div className="flex items-center gap-2 relative z-10">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400 text-[10px]">Available:</span>
                      <span className="text-white font-medium text-xs">{formattedAvailableBalance}</span>
                    </div>
                    <div className="w-px h-3 bg-gray-600" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400 text-[10px]">Total:</span>
                      <span className="text-gray-300 font-medium text-xs">{formattedTotalBalance}</span>
                    </div>
                  </div>
                )}
              </AppButton>
              <AppButton 
                variant={VARIANT_TYPES.NOT_SELECTED} 
                className="bg-teal-500 text-white hover:bg-teal-600 px-4 py-2 text-sm font-medium rounded transition-colors shadow-sm hover:shadow-md"
                onClick={() => {
                  setIsDepositModalOpen(true);
                }}
              >
                Deposit
              </AppButton>
              <AppButton 
                variant={VARIANT_TYPES.NOT_SELECTED} 
                className="bg-red-600 text-white hover:bg-red-700 px-4 py-2 text-sm font-medium rounded transition-colors shadow-sm hover:shadow-md disabled:bg-gray-700 disabled:cursor-not-allowed disabled:hover:bg-gray-700"
                onClick={() => {
                  setIsWithdrawModalOpen(true);
                }}
                disabled={availableBalance === 0}
              >
                Withdraw
              </AppButton>
              <AppDropdown
                variant={VARIANT_TYPES.PRIMARY}
                options={walletDropdownOptions}
                placeholder={address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connect Wallet"}
                onChange={handleWalletAction}
                className="w-auto"
                dropdownClassName="text-gray-300 hover:text-blue-400 bg-gray-900 hover:bg-gray-800 text-sm"
                optionClassName="bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-white border-gray-700 hover:text-blue-400"
              />
              <AppButton variant={VARIANT_TYPES.PRIMARY}>
                <Bell className="h-4 w-4 hover:text-blue-400" />
              </AppButton>
            </>
          ) : (
            <AppButton 
              variant={VARIANT_TYPES.NOT_SELECTED} 
              className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 text-sm font-medium rounded transition-colors"
              onClick={() => setIsWalletConnectModalOpen(true)}
            >
              Connect Wallet
            </AppButton>
          )}
        </HydrationGuard>
        <AppButton variant={VARIANT_TYPES.PRIMARY}>
          <Globe className="h-4 w-4 hover:text-blue-400" />
        </AppButton>
        <AppButton variant={VARIANT_TYPES.PRIMARY}>
          <Settings className="h-4 w-4 hover:text-blue-400" />
        </AppButton>
      </div>
    </header>

    <AppModal
        isOpen={isWalletConnectModalOpen}
        onClose={() => {
          setIsWalletConnectModalOpen(false);
          setConnectionError(null);
        }}
        title="Connect"
        variant={VARIANT_TYPES.PRIMARY}
        closeOnOutsideClick={true}
        closeOnEscape={true}
        showCloseButton={true}
      >
        {/* Error Message */}
        {connectionError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{connectionError}</p>
          </div>
        )}

        <HydrationGuard
          fallback={
            <div className="space-y-3">
              <div className="px-4 py-3 bg-gray-800 animate-pulse rounded-lg">
                <div className="h-5 bg-gray-700 rounded w-32"></div>
              </div>
              <div className="px-4 py-3 bg-gray-800 animate-pulse rounded-lg">
                <div className="h-5 bg-gray-700 rounded w-32"></div>
              </div>
            </div>
          }
        >
          <div className="space-y-3">
            {availableConnectors.length > 0 ? (
              availableConnectors.map((connector) => (
                <AppButton
                  key={connector.uid}
                  variant={VARIANT_TYPES.SECONDARY}
                  onClick={() => handleConnect(connector)}
                >
                  {connector.icon && (
                    <img 
                      src={connector.icon} 
                      alt={connector.name}
                      title={connector.name}
                      className="w-5 h-5"
                    />
                  )}
                  <span className="font-medium">{connector.name}</span>
                </AppButton>
              ))
            ) : (
              <>
                <p className="text-gray-400 text-sm text-center py-2">
                  No wallet extensions detected. Please install a wallet to continue.
                </p>
                {WALLET_INSTALL_OPTIONS.map((wallet) => (
                  <AppButton
                    key={wallet.name}
                    variant={VARIANT_TYPES.SECONDARY}
                    onClick={() => window.open(wallet.url, '_blank')}
                  >
                    {wallet.useIcon ? (
                      <Globe className="w-5 h-5" />
                    ) : (
                      <img 
                        src={wallet.iconUrl} 
                        alt={wallet.name}
                        className="w-5 h-5"
                      />
                    )}
                    <span className="font-medium">{wallet.name}</span>
                  </AppButton>
                ))}
              </>
            )}
          </div>
        </HydrationGuard>

        {/* OR Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-gray-950 text-gray-400">OR</span>
          </div>
        </div>

        {/* Email Login Option */}
        <AppButton
          variant={VARIANT_TYPES.SECONDARY}
          onClick={() => {
            console.log("Email login selected");
            // Handle email login logic here
          }}
        >
          <Mail className="w-5 h-5 text-gray-400" />
          <span className="font-medium">Log in with Email</span>
        </AppButton>
      </AppModal>

      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onSuccess={fetchBalances}
      />

      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        onSuccess={fetchBalances}
      />
    </>
  );
};
