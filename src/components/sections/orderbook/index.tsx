"use client";

import React, { useState, useEffect, useMemo } from "react";
import { MoreVertical } from "lucide-react";
import { Subscription } from "@nktkas/hyperliquid";
import { subscriptionClient } from "@/lib/config/hyperliquied/hyperliquid-client";
import { addDecimals, CURRENCY_NAMES, DATE_TIME_FORMAT, ORDER_BOOK_TABS, OrderBookTabs, VARIANT_TYPES } from "@/lib/constants";
import { formatDateTimeAccordingToFormat } from "@/lib/date-operation";
import { L2BookParameters, TradesParameters } from "@nktkas/hyperliquid/api/subscription";
import { AppButton } from "@/components/ui/button";
import { OrderList } from "./components/OrderList";
import { SpreadIndicator } from "./components/SpreadIndicator";
import { TradesList } from "./components/TradesList";
import { Dropdown } from "../../ui/dropdown/Dropdown";
import { useTradesStore, TradeData } from "@/store/trades";
import { useOrderBookStore, OrderBookData } from "@/store/orderbook";
import { errorHandler } from "@/store/errorHandler";

// TradeData is now exported from @/store/trades


// Main OrderBook Component
export const OrderBook = ({ currency }: { currency: string }) => {
  const [activeTab, setActiveTab] = useState<OrderBookTabs>(ORDER_BOOK_TABS.ORDERBOOK);

  const tabs = useMemo(() => [
    {
      label: "Order Book",
      value: ORDER_BOOK_TABS.ORDERBOOK,
      onClick: (): void => setActiveTab(ORDER_BOOK_TABS.ORDERBOOK),
      isActive: activeTab === ORDER_BOOK_TABS.ORDERBOOK,
    },
    {
      label: "Trades",
      value: ORDER_BOOK_TABS.TRADES,
      onClick: (): void => setActiveTab(ORDER_BOOK_TABS.TRADES),
      isActive: activeTab === ORDER_BOOK_TABS.TRADES,
    },
  ], [activeTab]);

  const [viewMode, setViewMode] = useState<"Stacked" | "Large">("Stacked");
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const { trades, setTrades } = useTradesStore();
  const { asks, bids, setAsks, setBids } = useOrderBookStore();
  
  const [spread, setSpread] = useState(0);
  const [spreadPercent, setSpreadPercent] = useState(0);
  
  const [highlightedAskPrices, setHighlightedAskPrices] = useState<Set<string>>(new Set());
  const [highlightedBidPrices, setHighlightedBidPrices] = useState<Set<string>>(new Set());
  
  // Generate data only on client side to avoid hydration mismatch
  // Calculate max total for bar width scaling
  const allTotals = [...asks, ...bids].map(o => parseFloat(o.total));
  const maxTotal = Math.max(...allTotals, 1);
  
  // Precision configuration mapping
  const [precision, setPrecision] = useState("0.02");
  const precisionConfig: Record<string, { nSigFigs: number; mantissa?: number }> = {
    "0.01": {  nSigFigs: 5 },
    "0.02": { nSigFigs: 5, mantissa: 2 },
    "0.05": { nSigFigs: 5, mantissa: 5 },
    "0.1": { nSigFigs: 4 },
    "1": { nSigFigs: 3 },
    "10": { nSigFigs: 2 },
  };
  const precisionOptions = Object.keys(precisionConfig);
  
  const [currencyName, setCurrencyName] = useState<string>(currency);
  useEffect(()=>{
    setCurrencyName(currency)
  },[currency])
  const currencies = useMemo(() => [
    {
      label: CURRENCY_NAMES.USDC,
      value: CURRENCY_NAMES.USDC,
      onClick: (): void => setCurrencyName(CURRENCY_NAMES.USDC),
      isActive: currencyName === CURRENCY_NAMES.USDC,
    },
    {
      label: currency,
      value: currency,
      onClick: (): void => setCurrencyName(currency),
      isActive: currencyName === currency,
    },
  ], [currencyName]);

  const currencyOptions = currencies.map(c => c.value);
  const viewModeOptions: ("Stacked" | "Large")[] = ["Stacked", "Large"];



  useEffect(() => {
    // Clear existing orderbook data when precision or currency changes
    setAsks([]);
    setBids([]);
    setHighlightedAskPrices(new Set());
    setHighlightedBidPrices(new Set());
    setSpread(0);
    setSpreadPercent(0);
    
    let orderbookSubscription: Subscription | null = null;
    let isSubscribed = true;
    
    const handleSubscribeToLiveOrderBook = async () => {
      try {
        const config: L2BookParameters = {coin: currency, ...precisionConfig[precision]};
 
        orderbookSubscription = await subscriptionClient.l2Book(
          config,
          (book) => {
          // Only update state if still subscribed to this market
          if (!isSubscribed) return;
          // console.log("book", book);
          const bestBid = book.levels[0];
          const bestAsk = book.levels[1];
          const spread = parseFloat(bestAsk[0]?.px) - parseFloat(bestBid[0]?.px);
          const spreadPercent = (spread / parseFloat(bestAsk[0]?.px)) * 100;
          setSpread(spread);
          setSpreadPercent(spreadPercent)
          

        setAsks((prev: OrderBookData[]) => {
          let currentAsks = [...(prev || [])];

          // Create a Map of prices from bestAsk for efficient lookup
          const bestAskMap = new Map<string, { sz: string; n?: number }>();
          bestAsk.forEach(ask => {
            bestAskMap.set(ask.px, { sz: ask.sz, n: ask.n });
          });

          // Create a Set of prices from bestAsk to check removals
          const bestAskPrices = new Set(bestAsk.map(ask => ask.px));

          // Track prices that are updated or newly added for highlighting
          const newOrUpdatedPrices = new Set<string>();

          // Step 1: Update existing prices and mark which ones exist
          const updatedPrices = new Set<string>();
          for (let i = 0; i < currentAsks.length; i++) {
            const price = currentAsks[i].price;
            const bestAskData = bestAskMap.get(price);
            
            if (bestAskData) {
              // Check if size changed (update) or if it's a new entry
              const oldSize = currentAsks[i].size;
              if (oldSize !== bestAskData.sz) {
                newOrUpdatedPrices.add(price);
              }
              // Update existing price
              currentAsks[i] = {
                price: price,
                size: bestAskData.sz,
                total: bestAskData.n?.toString() || "0",
              };
              updatedPrices.add(price);
            }
          }

          // Step 2: Remove prices that are no longer in bestAsk
          currentAsks = currentAsks.filter(ask => bestAskPrices.has(ask.price));

          // Step 3: Insert new prices from bestAsk
          for (let j = 0; j < bestAsk.length; j++) {
            const price = bestAsk[j].px;
            if (!updatedPrices.has(price)) {
              currentAsks.push({
                price: price,
                size: bestAsk[j].sz,
                total: bestAsk[j]?.n?.toString() || "0",
              });
              newOrUpdatedPrices.add(price);
            }
          }

          // Step 4: Sort by price (ascending for asks - lowest ask first)
          currentAsks.sort((x, y) => Number(x.price) - Number(y.price));

          // Step 5: Recalculate cumulative total based on size
          let cumulativeTotal = 0;
          currentAsks = currentAsks.map((ask) => {
            const sizeNum = parseFloat(ask.size) || 0;
            cumulativeTotal += sizeNum;
            return {
              ...ask,
              total: addDecimals(cumulativeTotal),
            };
          });

          // Update highlighted prices
          if (newOrUpdatedPrices.size > 0) {
            setHighlightedAskPrices(new Set(newOrUpdatedPrices));
          }

          return currentAsks?.slice(0, 11);
        });

         setBids((prev: OrderBookData[]) => {
            let currentBids = [...(prev || [])];
            
            // Create a Map of prices from bestBid for efficient lookup
            const bestBidMap = new Map<string, { sz: string; n?: number }>();
            bestBid.forEach(bid => {
              bestBidMap.set(bid.px, { sz: bid.sz, n: bid.n });
            });

            // Create a Set of prices from bestBid to check removals
            const bestBidPrices = new Set(bestBid.map(bid => bid.px));

            // Track prices that are updated or newly added for highlighting
            const newOrUpdatedPrices = new Set<string>();

            // Step 1: Update existing prices and mark which ones exist
            const updatedPrices = new Set<string>();
            for (let i = 0; i < currentBids.length; i++) {
              const price = currentBids[i].price;
              const bestBidData = bestBidMap.get(price);
              
              if (bestBidData) {
                // Check if size changed (update) or if it's a new entry
                const oldSize = currentBids[i].size;
                if (oldSize !== bestBidData.sz) {
                  newOrUpdatedPrices.add(price);
                }
                // Update existing price
                currentBids[i] = {
                  price: price,
                  size: bestBidData.sz,
                  total: bestBidData.n?.toString() || "0",
                };
                updatedPrices.add(price);
              }
            }
            
            // Step 2: Remove prices that are no longer in bestBid
            currentBids = currentBids.filter(bid => bestBidPrices.has(bid.price));
            
            // Step 3: Insert new prices from bestBid
            for (let j = 0; j < bestBid.length; j++) {
              const price = bestBid[j].px;
              if (!updatedPrices.has(price)) {
                currentBids.push({
                  price: price,
                  size: bestBid[j].sz,
                  total: bestBid[j]?.n?.toString() || "0",
                });
                newOrUpdatedPrices.add(price);
              }
            }
            
            // Step 4: Sort by price (descending for bids - highest bid first)
            currentBids.sort((x, y) => Number(y.price) - Number(x.price));

            // Step 5: Recalculate cumulative total based on size
            let cumulativeTotal = 0;
            currentBids = currentBids.map((bid) => {
              const sizeNum = parseFloat(bid.size) || 0;
              cumulativeTotal += sizeNum;
              return {
                ...bid,
                total: addDecimals(cumulativeTotal),
              };
            });

            // Update highlighted prices
            if (newOrUpdatedPrices.size > 0) {
              setHighlightedBidPrices(new Set(newOrUpdatedPrices));
            }

            return currentBids?.slice(0, 11);
          });
        });
      } catch (error) {
        console.error("Error subscribing to orderbook:", error);
        errorHandler(error, "Failed to load orderbook");
      }
    };
    handleSubscribeToLiveOrderBook();

  
    return () => {
      // Mark as unsubscribed to prevent state updates
      isSubscribed = false;
      // Unsubscribe from the old subscription
      if (orderbookSubscription) {
        try {
          orderbookSubscription.unsubscribe();
        } catch (error) {
          console.error("Error unsubscribing from orderbook:", error);
          // Don't show toast for unsubscribe errors
        }
        orderbookSubscription = null;
      }
    };
  }, [precision, currency]);

  // Subscribe to trades
  useEffect(() => {
    // Clear trades when currency changes
    setTrades([]);
    
    let tradeSubscription: Subscription | null = null;
    let isSubscribed = true;
    
    const handleSubscribeToTrades = async () => {
      try {
        const config: TradesParameters = {coin: currency};
        
        tradeSubscription = await subscriptionClient.trades(config, (trades) => {
        // Only update state if still subscribed to this market
        if (!isSubscribed) return;
        
        // trades is an array of trade objects
        if (trades.length > 0) {
          const newTrades: TradeData[] = trades.map((trade) => {
            const tradeTime = new Date(trade.time);
            return {
              price: parseFloat(trade.px),
              size: addDecimals(trade.sz, 4),
              time: formatDateTimeAccordingToFormat({ timeStamp: tradeTime , format: DATE_TIME_FORMAT.HH_mm_ss}),
              isBuy: trade.side === "B", // "B" = buy, "A" = sell
              timestamp: tradeTime.getTime(), // Store timestamp for sorting
              txnHash: trade.hash,
            };
          });
          
      
          // Prepend new trades to existing trades, sort by date, and limit to 50 most recent
          const currentTrades = useTradesStore.getState().trades;
          const updatedTrades = [...newTrades, ...currentTrades];
          // Sort all trades by timestamp (newest first)
          updatedTrades.sort((a, b) => b.timestamp - a.timestamp);
          setTrades(updatedTrades?.slice(0, 50));
        }
      });
      } catch (error) {
        console.error("Error subscribing to trades:", error);
        errorHandler(error, "Failed to load trades");
      }
    };
    handleSubscribeToTrades();


    return () => {
      // Mark as unsubscribed to prevent state updates
      isSubscribed = false;
      // Unsubscribe from the old subscription
      if (tradeSubscription) {
        try {
          tradeSubscription.unsubscribe();
        } catch (error) {
          console.error("Error unsubscribing from trades:", error);
          // Don't show toast for unsubscribe errors
        }
        tradeSubscription = null;
      }
    };
  }, [currency, setTrades]);

  // Show loading state during SSR or initial mount

  return (
    <div className="w-full bg-gray-950 border-l border-gray-800 flex flex-col h-full">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header with Tabs */}
        <div className="flex items-center justify-between px-2 sm:px-3 py-2 border-b border-gray-800 shrink-0">
          <div className="flex items-center bg-transparent p-0 h-auto w-full">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={tab.onClick}
                className={` hover:cursor-pointer
                  flex-1 text-xs sm:text-sm px-0 py-1 transition-colors duration-200
                  relative focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 focus:ring-green-400
                  ${tab.isActive ? "text-white" : "text-gray-400 hover:text-gray-300"}
                `}
              >
                {tab.label}
                {tab.isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400" />
                )}
              </button>
            ))}
          </div>
          {/* <div className="relative">
            <AppButton
              variant={VARIANT_TYPES.NOT_SELECTED}
              onClick={() => setIsOptionsOpen(!isOptionsOpen)}
              className="h-6 w-6 p-0 inline-flex items-center justify-center hover:bg-gray-800/50 text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-400"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </AppButton>
            {isOptionsOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsOptionsOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-800 rounded shadow-lg z-20 min-w-[120px]">
                  <div className="px-3 py-1.5 text-xs text-gray-500 border-b border-gray-800">
                    Tab
                  </div>
                  {viewModeOptions.map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setViewMode(mode);
                        setIsOptionsOpen(false);
                      }}
                      className={`
                        w-full text-left px-3 py-1.5 text-xs transition-colors
                        ${viewMode === mode 
                          ? "bg-gray-800 text-white" 
                          : "text-gray-300 hover:bg-gray-800/50"
                        }
                      `}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div> */}
        </div>

        {/* Tab Content Container - Maintains consistent height */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          {/* Invisible spacer to maintain height - uses the orderbook structure (tallest tab) */}
          <div className="invisible pointer-events-none flex flex-col min-h-0 w-full">
            {/* Controls */}
            <div className="px-2 sm:px-3 py-2 flex items-center gap-2 shrink-0">
              <div className="h-6 w-12" />
              <div className="h-6 w-16 ml-auto" />
            </div>
            {/* Column Headers */}
            <div className="px-2 sm:px-3 py-1.5 flex justify-between text-xs shrink-0">
              <span className="flex-1" />
              <span className="flex-1" />
              <span className="flex-1" />
            </div>
            {/* Spacer for content area */}
            <div className="flex-1" />
          </div>
          
          {/* Order Book Tab Content */}
          {activeTab === ORDER_BOOK_TABS.ORDERBOOK && (
            <div className="absolute inset-0 m-0 p-0 flex flex-col min-h-0 w-full">
              {/* Controls */}
              <div className="px-2 sm:px-3 py-2 flex items-center gap-2 shrink-0">
                <Dropdown
                  value={precision}
                  options={precisionOptions}
                  onChange={setPrecision}
                />
                <Dropdown
                  value={currencyName}
                  options={currencyOptions}
                  onChange={setCurrencyName}
                  className="ml-auto"
                />
              </div>

              {/* Column Headers */}
              <div className="px-2 sm:px-3 py-1.5 flex justify-between text-xs text-gray-500 border-b border-gray-800 shrink-0 bg-gray-900/50">
                <span className="flex-1 text-left">Price</span>
                <span className="flex-1 text-center">Size ({currencyName})</span>
                <span className="flex-1 text-right">Total ({currencyName})</span>
              </div>

              {/* Order Book Data */}
              <div className="flex-1 overflow-hidden grid grid-rows-[1fr_auto_1fr] min-h-0">
                <div className="min-h-0 flex flex-col">
                  <OrderList 
                    orders={asks} 
                    isAsk={true} 
                    maxTotal={maxTotal} 
                    currency={currencyName} 
                    hideScrollbar={true} 
                    highlightedPrices={highlightedAskPrices} 
                  />
                </div>
                <SpreadIndicator 
                  spread={spread} 
                  spreadPercent={spreadPercent} 
                />
                <div className="min-h-0 flex flex-col">
                  <OrderList 
                    orders={bids} 
                    isAsk={false} 
                    maxTotal={maxTotal} 
                    currency={currencyName} 
                    hideScrollbar={true} 
                    highlightedPrices={highlightedBidPrices} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* Trades Tab Content */}
          {activeTab === ORDER_BOOK_TABS.TRADES && (
            <div className="absolute inset-0 m-0 p-0 flex flex-col min-h-0 w-full">
              <TradesList trades={trades} currency={currencyName} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
