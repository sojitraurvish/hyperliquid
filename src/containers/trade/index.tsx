import { Header } from '@/components/sections/header';
import { useAccount, useWalletClient } from 'wagmi';
import { Wallet } from 'ethers'
import { useEffect, useState, useRef } from 'react';
import { useApiWallet } from '@/hooks/useWallet';
import { getUserExchangeClient, infoClient, subscriptionClient } from '@/lib/config/hyperliquied/hyperliquid-client';
import { BUILDER_CONFIG } from '@/lib/config';
import { useBuilderFee } from '@/hooks/useBuilderFee';
import { MarketHeader } from '@/components/sections/market-header';
import { TradingChart } from '@/components/sections/trading-chart';
import { Subscription } from '@nktkas/hyperliquid';
import { OrderBook } from '@/components/sections/orderbook';
import { TradingPanel } from '@/components/sections/trading-panel';
import { BottomPanel } from '@/components/sections/bottom-panel';
import { CURRENCY_NAMES } from '@/lib/constants';
import { useMarketStore } from '@/store/market';
import { useRouter } from 'next/router';



export default function TradeContainer() {
  const router = useRouter();
  const { id } = router.query; // Get market from URL
  const { selectedMarket, setSelectedMarket } = useMarketStore();
  const hasSyncedFromUrl = useRef(false);
  
  // Extract market from URL on page load and when URL changes
  useEffect(() => {
    if (!router.isReady) return;
    
    if (id) {
      // Market in URL - sync to store
      const marketFromUrl = (id as string).toUpperCase();
      const currentMarket = selectedMarket?.coin?.toUpperCase();
      
      // Only update if different from current market
      if (!currentMarket || currentMarket !== marketFromUrl) {
        setSelectedMarket({ coin: marketFromUrl, leverage: selectedMarket?.leverage ?? 0 }, false);
      }
    } else if (selectedMarket && !hasSyncedFromUrl.current) {
      // No market in URL but we have one in store - redirect to URL with market (only once)
      hasSyncedFromUrl.current = true;
      const marketCoin = selectedMarket.coin.toUpperCase();
      router.replace(`/trade/${marketCoin}`, undefined, { shallow: true });
    } else if (!id && !selectedMarket && !hasSyncedFromUrl.current) {
      // No market in URL and no market in store - redirect to default BTC
      hasSyncedFromUrl.current = true;
      router.replace(`/trade/BTC`, undefined, { shallow: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, id]);

  const selectedCoin = selectedMarket?.coin ?? (id ? (id as string).toUpperCase() : "BTC");
  const selectedLeverage = selectedMarket?.leverage ?? 0;
  const { address: userAddress } = useAccount()
  // const { agentWallet, isApproved,checkApprovalStatus } = useApiWallet({userPublicKey: userAddress as `0x${string}`})
  const { checkBuilderFeeStatus } = useBuilderFee({userPublicKey: userAddress as `0x${string}`,builderPublicKey:BUILDER_CONFIG.BUILDER_FEE_ADDRESS})
  const getAgents = async () => {
    const agents = await infoClient.extraAgents({ user: userAddress! })
    console.log("agents", agents)
  }

  // console.log("agentWallet", agentWallet, isApproved)
  // const handleCheckApprovalStatus = async () => {
  //   if(await checkApprovalStatus({})){
  //     console.log("approved bro")
  //   }
  // }

  // const handleCheckBuilderFeeStatus = async () => {
  //   if(await checkBuilderFeeStatus({})){
  //     console.log("builder fee approved bro")
  //   }
  // }

 


  const { data: walletClient } = useWalletClient()


console.log("selectedMarket", selectedMarket)

  return (
    <div className="min-h-screen flex flex-col overflow-auto">
      {/* Fixed Header - Always stays at top while scrolling */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-950">
        <Header />
      </div>
      
      {/* Main Content Area - Allows page-level scrolling with padding for fixed header */}
      <div className="flex flex-col pt-14">
        <div className="shrink-0">
          <MarketHeader currency={selectedCoin} />
        </div>
        
        {/* Main Layout: Responsive - Desktop: side by side, Mobile: stacked */}
        <div className="flex flex-col lg:flex-row overflow-hidden min-h-0">
          {/* Left Side: Chart, OrderBook, and BottomPanel */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0 order-1 lg:order-1">
            {/* Chart and OrderBook - Desktop: side by side, Mobile: stacked */}
            <div className="flex flex-col lg:flex-row h-[400px] sm:h-[500px] lg:h-[600px] w-full shrink-0 overflow-hidden">
              {/* Chart takes remaining space */}
              <div className="flex-1 flex flex-col h-full w-full min-w-0 overflow-hidden">
                <TradingChart currency={selectedCoin} />
              </div>
              {/* OrderBook - Hidden on mobile, visible on tablet and up */}
              <div className="hidden md:flex shrink-0 flex-col h-full overflow-hidden border-t lg:border-t-0 lg:border-l border-gray-800 w-full md:w-80 lg:w-96">
                <OrderBook currency={selectedCoin} />
              </div>
            </div>
            
            {/* BottomPanel below both Chart and OrderBook - Responsive height */}
            <div className="shrink-0 border-t border-gray-800 h-[300px] sm:h-[400px] lg:h-[500px] flex flex-col overflow-hidden">
              <BottomPanel />
            </div>
          </div>
          
          {/* Right Side: TradingPanel - Stacks below on mobile, side by side on desktop */}
          <div className="shrink-0 border-t lg:border-t-0 lg:border-l border-gray-800 flex flex-col h-auto lg:h-[1100px] overflow-hidden order-2 lg:order-2 w-full lg:w-96 xl:w-[420px]">
            <TradingPanel currentCurrency={selectedCoin} currentLeverage={selectedLeverage} />
          </div>
        </div>
      </div>
    </div>
  );
}
