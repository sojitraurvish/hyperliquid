"use client";

import { Globe, Bell, Mail, Menu, X, HelpCircle, Headphones, FileText, Shield, ChevronDown } from "lucide-react";
import { ThemePickerButton, ThemePickerModal } from "@/components/ui/theme-picker";
import NetworkSwitcher from "@/components/ui/network-switcher";
import AppButton, { AppButton as Button } from "@/components/ui/button";
import AppDropdown, { DropdownOption } from "@/components/ui/dropdown";
import { VARIANT_TYPES } from "@/lib/constants";
import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
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
import Link from "next/link";
import { useRouter } from "next/router";
import { ROUTES } from "@/lib/config";

const MORE_MENU_ITEMS = [
  { label: "FAQ", route: ROUTES.FAQ, icon: HelpCircle },
  { label: "Support", route: ROUTES.SUPPORT, icon: Headphones },
  { label: "Terms of Service", route: ROUTES.TERMS, icon: FileText },
  { label: "Privacy Policy", route: ROUTES.PRIVACY, icon: Shield },
];

import { EXTERNAL_URLS } from "@/lib/config";

const WALLET_INSTALL_OPTIONS = [
  {
    name: 'MetaMask',
    iconUrl: EXTERNAL_URLS.METAMASK_ICON,
    url: EXTERNAL_URLS.METAMASK_DOWNLOAD,
    useIcon: false,
  },
  {
    name: 'Browse More Wallets',
    url: EXTERNAL_URLS.ETHEREUM_WALLETS,
    useIcon: true,
  },
];

export const Header = () => {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [isWalletConnectModalOpen, setIsWalletConnectModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = React.useRef<HTMLDivElement>(null);
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
    const availableConnectors = useMemo(() => connectors.filter((connector) => connector.name !== 'Injected' && connector.name !== 'Backpack'), [connectors]);
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

  // Close "More" menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <header className="h-14 border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-xl flex items-center justify-between px-3 sm:px-5 relative z-40">
      <div className="flex items-center gap-2 sm:gap-5">
        <Link href={ROUTES.HOME} className="flex items-center gap-2 cursor-pointer group shrink-0">
          <div className="w-7 h-7 bg-linear-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-md shadow-green-500/20 group-hover:shadow-green-500/30 transition-shadow">
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <span className="font-semibold text-base text-white hidden sm:inline tracking-tight">Hypertrading</span>
        </Link>
        
        {/* Desktop nav */}
        <nav className="hidden md:flex items-center bg-gray-900/50 rounded-lg p-0.5 border border-gray-800/40">
          {[
            { label: "Trade", route: ROUTES.TRADE },
            { label: "Markets", route: ROUTES.MARKETS },
            { label: "Portfolio", route: ROUTES.PORTFOLIO },
          ].map((item) => {
            const isActive = router.pathname === item.route || 
              (item.route === ROUTES.TRADE && router.pathname.startsWith('/trade'));
            return (
              <Link key={item.label} href={item.route}>
                <Button
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className={`text-[13px] px-3.5 py-1.5 flex items-center justify-center transition-all duration-200 rounded-md cursor-pointer font-medium ${
                    isActive
                      ? "text-white bg-gray-800 shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {item.label}
                </Button>
              </Link>
            );
          })}
          <div ref={moreMenuRef} className="relative">
            <button
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className={`text-[13px] px-3 py-1.5 flex items-center gap-1 transition-all duration-200 rounded-md cursor-pointer font-medium ${
                isMoreMenuOpen ? "text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              More
              <ChevronDown className={`w-3 h-3 opacity-50 transition-transform duration-200 ${isMoreMenuOpen ? "rotate-180" : ""}`} />
            </button>
            {isMoreMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-52 rounded-xl bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 shadow-2xl shadow-black/40 z-50 overflow-hidden">
                <div className="p-1.5">
                  {MORE_MENU_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = router.pathname === item.route;
                    return (
                      <Link key={item.label} href={item.route} onClick={() => setIsMoreMenuOpen(false)}>
                        <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all cursor-pointer ${
                          isActive
                            ? "text-white bg-gray-800/80"
                            : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                        }`}>
                          <Icon className="w-3.5 h-3.5 opacity-60" />
                          {item.label}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Network switcher - always visible on sm+ */}
        <div className="hidden sm:block">
          <NetworkSwitcher />
        </div>

        <HydrationGuard
          fallback={
            <AppButton 
              variant={VARIANT_TYPES.NOT_SELECTED} 
              className="bg-green-500 text-white hover:bg-green-400 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all"
            >
              Connect Wallet
            </AppButton>
          }
          className="flex items-center gap-1.5 sm:gap-2"
        >
          {isConnected ? (
            <>
              {/* Deposit/Withdraw actions */}
              <div className="hidden sm:flex items-center bg-gray-900/70 border border-gray-800/40 rounded-lg overflow-hidden">
                <button
                  className="px-2.5 py-1.5 text-[11px] font-semibold text-green-400 hover:bg-green-500/10 transition-colors"
                  onClick={() => setIsDepositModalOpen(true)}
                >
                  Deposit
                </button>
                <div className="w-px h-4 bg-gray-800/60" />
                <button
                  className="px-2.5 py-1.5 text-[11px] font-semibold text-gray-400 hover:text-white hover:bg-gray-800/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  onClick={() => setIsWithdrawModalOpen(true)}
                  disabled={availableBalance === 0}
                >
                  Withdraw
                </button>
              </div>

              {/* Balance widget - lg only */}
              <button 
                className="hidden lg:flex items-center gap-2.5 bg-gray-900/70 border border-gray-800/40 rounded-lg px-3 py-1.5 text-xs transition-all hover:bg-gray-800/40 cursor-pointer"
                onClick={fetchBalances}
                disabled={isBalancesLoading}
              >
                {isBalancesLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-14 bg-gray-700/50 rounded animate-pulse" />
                    <div className="h-3 w-12 bg-gray-700/50 rounded animate-pulse" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <span className="text-white font-semibold font-mono">{formattedAvailableBalance}</span>
                    </div>
                    <div className="w-px h-3 bg-gray-700/50" />
                    <span className="text-gray-500 font-mono">{formattedTotalBalance}</span>
                  </>
                )}
              </button>

              {/* Wallet address */}
              <AppDropdown
                variant={VARIANT_TYPES.PRIMARY}
                options={walletDropdownOptions}
                placeholder={address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Wallet"}
                onChange={handleWalletAction}
                className="w-auto"
                dropdownClassName="text-white bg-gray-900/70 hover:bg-gray-800/80 text-xs border border-gray-800/40 rounded-lg font-mono"
                optionClassName="w-44 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 text-gray-300 hover:bg-gray-800 hover:text-white rounded-xl shadow-2xl shadow-black/40"
              />
            </>
          ) : (
            <AppButton 
              variant={VARIANT_TYPES.NOT_SELECTED} 
              className="bg-green-500 text-white hover:bg-green-400 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all"
              onClick={() => setIsWalletConnectModalOpen(true)}
            >
              Connect Wallet
            </AppButton>
          )}
        </HydrationGuard>

        {/* Theme picker */}
        <div className="hidden sm:block">
          <ThemePickerButton onClick={() => setIsThemePickerOpen(true)} />
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 -mr-1 text-gray-400 hover:text-white hover:bg-gray-800/60 rounded-lg transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="absolute top-14 left-0 right-0 bg-gray-950/98 backdrop-blur-xl border-b border-gray-800/60 z-50 md:hidden shadow-2xl shadow-black/40">
          <nav className="flex flex-col p-3 gap-0.5">
            {[
              { label: "Trade", route: ROUTES.TRADE },
              { label: "Markets", route: ROUTES.MARKETS },
              { label: "Portfolio", route: ROUTES.PORTFOLIO },
              ...MORE_MENU_ITEMS,
            ].map((item) => {
              const isActive = router.pathname === item.route || 
                (item.route === ROUTES.TRADE && router.pathname.startsWith('/trade'));
              return (
                <Link key={item.label} href={item.route} onClick={() => setIsMobileMenuOpen(false)}>
                  <div className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "text-green-400 bg-green-500/8"
                      : "text-gray-400 hover:text-white hover:bg-gray-800/40"
                  }`}>
                    {item.label}
                  </div>
                </Link>
              );
            })}
            {isConnected && (
              <>
                <div className="mx-3 mt-3 mb-2 pt-3 border-t border-gray-800/40">
                  <div className="bg-gray-900/50 rounded-xl p-3 border border-gray-800/30">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        <span className="text-gray-500 uppercase tracking-wider text-[10px]">Available</span>
                      </div>
                      <span className="text-white font-semibold font-mono">{formattedAvailableBalance} USDC</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 uppercase tracking-wider text-[10px] ml-3">Total</span>
                      <span className="text-gray-400 font-mono">{formattedTotalBalance} USDC</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 px-3 pb-1">
                  <AppButton
                    variant={VARIANT_TYPES.NOT_SELECTED}
                    className="flex-1 bg-linear-to-r from-green-500 to-emerald-600 text-white px-3 py-2.5 text-sm font-semibold rounded-xl transition-all justify-center shadow-sm shadow-green-500/15"
                    onClick={() => { setIsDepositModalOpen(true); setIsMobileMenuOpen(false); }}
                  >
                    Deposit
                  </AppButton>
                  <AppButton
                    variant={VARIANT_TYPES.NOT_SELECTED}
                    className="flex-1 bg-gray-800/60 text-gray-300 border border-gray-700/50 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() => { setIsWithdrawModalOpen(true); setIsMobileMenuOpen(false); }}
                    disabled={availableBalance === 0}
                  >
                    Withdraw
                  </AppButton>
                </div>
              </>
            )}
            <div className="flex items-center gap-2 mx-3 mt-2 pt-3 border-t border-gray-800/40 sm:hidden">
              <NetworkSwitcher />
              <ThemePickerButton onClick={() => { setIsThemePickerOpen(true); setIsMobileMenuOpen(false); }} />
            </div>
          </nav>
        </div>
      )}
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
        {/* <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-gray-950 text-gray-400">OR</span>
          </div>
        </div> */}

        {/* Email Login Option */}
        {/* <AppButton
          variant={VARIANT_TYPES.SECONDARY}
          onClick={() => {
            console.log("Email login selected");
            // Handle email login logic here
          }}
        >
          <Mail className="w-5 h-5 text-gray-400" />
          <span className="font-medium">Log in with Email</span>
        </AppButton> */}
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

      <ThemePickerModal
        isOpen={isThemePickerOpen}
        onClose={() => setIsThemePickerOpen(false)}
      />
    </>
  );
};
