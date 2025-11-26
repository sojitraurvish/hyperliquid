import { Settings, Globe, Bell, Mail } from "lucide-react";
import AppButton, { AppButton as Button } from "@/components/ui/button";
import AppDropdown, { DropdownOption } from "@/components/ui/dropdown";
import { VARIANT_TYPES } from "@/lib/constants";
import { useCallback, useMemo, useState } from "react";
import AppModal from "@/components/ui/modal";
import { useAccount, useConnect, useDisconnect, type Connector } from 'wagmi';
import HydrationGuard from "@/components/ui/hydration-guard";

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
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { connectors, connect } = useConnect();
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
        {isConnected ? (
          <>
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
                <div key={connector.uid} className="space-y-2">
                  <AppButton
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
           
                </div>
              ))
            ) : (
              <div className="space-y-3">
                <p className="text-gray-400 text-sm text-center mb-4">No wallet extensions detected. Please install a wallet to continue.</p>
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
              </div>
            )}
          </div>
        </HydrationGuard>

        {/* OR Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-900 text-gray-400">OR</span>
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
          <Mail className="w-5 h-5" color="#9CA3AF" />
          <span className="font-medium">Log in with Email</span>
        </AppButton>
      </AppModal>
    </>
  );
};
