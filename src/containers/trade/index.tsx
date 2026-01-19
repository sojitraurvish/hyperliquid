import { Header } from '@/components/sections/header';
import { useAccount, useWalletClient } from 'wagmi';
import { Wallet } from 'ethers'
import { useEffect, useState } from 'react';
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



export default function TradeContainer() {

  const selectedMarket = useMarketStore().selectedMarket;
  const selectedCoin = selectedMarket?.coin ?? "BTC";
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
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Fixed Header - Non-scrollable */}
      <div className="shrink-0">
        <Header />
      </div>
      
      {/* Main Content Area - Fixed height, no scroll */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="shrink-0">
          <MarketHeader currency={selectedCoin} />
        </div>
        
        {/* Main Layout: Left side (Chart + OrderBook + BottomPanel) | Right side (TradingPanel) */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left Side: Chart, OrderBook, and BottomPanel */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Chart and OrderBook side by side - Takes remaining space after BottomPanel */}
            <div className="flex flex-1 min-h-0 w-full overflow-hidden">
              {/* Chart takes remaining space - maximizes width */}
              <div className="flex-1 flex flex-col min-h-0 w-full min-w-0 overflow-hidden">
                <TradingChart currency={selectedCoin} />
              </div>
              {/* OrderBook keeps its fixed width */}
              <div className="shrink-0 flex flex-col min-h-0 overflow-hidden">
                <OrderBook currency={selectedCoin} />
              </div>
            </div>
            
            {/* BottomPanel below both Chart and OrderBook - Fixed height with internal scroll */}
            <div className="shrink-0 border-t border-gray-800 h-[180px] sm:h-[200px] md:h-[220px] flex flex-col overflow-hidden">
              <BottomPanel />
            </div>
          </div>
          
          {/* Right Side: TradingPanel - Full height beside all */}
          <div className="shrink-0 border-l border-gray-800 flex flex-col min-h-full overflow-hidden">
            <TradingPanel currentCurrency={selectedCoin} currentLeverage={selectedLeverage} />
          </div>
        </div>
      </div>
    </div>
  );
}
