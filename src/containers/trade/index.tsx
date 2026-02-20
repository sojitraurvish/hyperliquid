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
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col bg-gray-950">
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-950/95 backdrop-blur-md border-b border-gray-800/15">
        <Header />
      </div>
      
      <div className="flex flex-col flex-1 min-h-0 pt-14">
        <div className="shrink-0">
          <MarketHeader currency={selectedCoin} />
        </div>
        
        {/* Mobile: scrollable page with stacked sections. Desktop: fixed 2-column grid. */}
        <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_384px] lg:grid-rows-[minmax(0,3fr)_minmax(0,1fr)]">
          {/* Chart + Desktop OrderBook */}
          <div className="order-1 lg:col-start-1 lg:row-start-1 lg:min-h-0 overflow-hidden">
            <div className="flex h-[380px] sm:h-[420px] md:h-[480px] lg:h-full">
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TradingChart currency={selectedCoin} />
              </div>
              <div className="hidden md:flex shrink-0 flex-col overflow-hidden border-l border-gray-800/20 w-72 lg:w-80 xl:w-96">
                <OrderBook currency={selectedCoin} />
              </div>
            </div>
          </div>

          {/* Mobile OrderBook - visible only on small screens */}
          <div className="order-2 md:hidden h-[350px] border-t border-gray-800/20 flex flex-col overflow-hidden">
            <OrderBook currency={selectedCoin} />
          </div>
          
          {/* Bottom Panel (Positions/Orders) - after orderbook on mobile, below chart on desktop */}
          <div className="order-3 lg:order-3 lg:col-start-1 lg:row-start-2 border-t border-gray-800/20 h-[280px] sm:h-[320px] md:h-[350px] lg:h-auto lg:min-h-0 flex flex-col overflow-hidden">
            <BottomPanel />
          </div>

          {/* Trading Panel - after positions on mobile, sidebar on desktop */}
          <div className="order-4 lg:order-2 lg:col-start-2 lg:row-start-1 lg:row-span-2 border-t lg:border-t-0 lg:border-l border-gray-800/20 lg:overflow-y-auto lg:min-h-0">
            <TradingPanel currentCurrency={selectedCoin} currentLeverage={selectedLeverage} />
          </div>
        </div>
      </div>
    </div>
  );
}
