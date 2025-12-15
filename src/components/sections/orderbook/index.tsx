"use client";

import React, { useState, useCallback, useEffect } from "react";
import { MoreVertical, ChevronDown, ExternalLink, Leaf } from "lucide-react";
import { order, Subscription } from "@nktkas/hyperliquid";
import { subscriptionClient } from "@/lib/config/hyperliquied/hyperliquid-client";
import { addDecimal } from "@/lib/constants";

// Types
interface OrderBookData {
  price: string;
  size: string;
  total: string;
}

interface TradeData {
  price: number;
  size: string;
  time: string;
  isBuy: boolean;
}


const generateTradesData = (count: number): TradeData[] => {
  const basePrice = 3203.7;
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const tradeTime = new Date(now.getTime() - i * 1000);
    const isBuy = Math.random() > 0.5;
    return {
      price: basePrice + (Math.random() - 0.5) * 10,
      size: addDecimal(Math.random() * 1 + 0.01, 4),
      time: tradeTime.toLocaleTimeString("en-US", { 
        hour12: false, 
        hour: "2-digit", 
        minute: "2-digit", 
        second: "2-digit" 
      }),
      isBuy,
    };
  });
};

// Modular Components

// Custom Button Component
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "ghost" | "default";
  size?: "sm" | "icon" | "default";
  className?: string;
  disabled?: boolean;
}

const Button = ({ 
  children, 
  onClick, 
  variant = "default", 
  size = "default",
  className = "",
  disabled = false 
}: ButtonProps) => {
  const baseStyles = "inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-teal-400 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantStyles = {
    ghost: "hover:bg-gray-800/50 text-gray-300",
    default: "bg-gray-800 hover:bg-gray-700 text-white rounded",
  };
  
  const sizeStyles = {
    sm: "h-6 px-2 text-xs",
    icon: "h-6 w-6",
    default: "px-3 py-1.5 text-sm",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </button>
  );
};

// Tabs Components
interface TabsProps {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
}

interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextType | undefined>(undefined);

const Tabs = ({ defaultValue, children, className = "" }: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

const useTabs = () => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within Tabs");
  }
  return context;
};

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

const TabsList = ({ children, className = "" }: TabsListProps) => {
  return (
    <div className={`inline-flex items-center gap-2 sm:gap-4 ${className}`}>
      {children}
    </div>
  );
};

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

const TabsTrigger = ({ value, children, className = "" }: TabsTriggerProps) => {
  const { activeTab, setActiveTab } = useTabs();
  const isActive = activeTab === value;

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`
        text-xs sm:text-sm px-0 py-1 transition-colors duration-200
        relative focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 focus:ring-teal-400
        ${isActive ? "text-white" : "text-gray-400 hover:text-gray-300"}
        ${className}
      `}
    >
      {children}
      {isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400" />
      )}
    </button>
  );
};

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

const TabsContent = ({ value, children, className = "" }: TabsContentProps) => {
  const { activeTab } = useTabs();
  const isActive = activeTab === value;
  
  return (
    <div 
      className={className}
      style={{ 
        visibility: isActive ? 'visible' : 'hidden',
        pointerEvents: isActive ? 'auto' : 'none'
      }}
    >
      {children}
    </div>
  );
};

// Order Book Row Component
interface OrderRowProps {
  order: OrderBookData;
  isAsk: boolean;
  maxTotal: number;
  onClick?: () => void;
  isHighlighted?: boolean;
}

const OrderRow = ({ order, isAsk, maxTotal, onClick, isHighlighted = false }: OrderRowProps) => {
  const priceColor = isAsk ? "text-red-500" : "text-teal-400";
  const barColor = isAsk ? "bg-red-500/15" : "bg-teal-500/15";
  const highlightColor = isAsk ? "bg-red-500/40" : "bg-teal-500/40";
  const barWidth = Math.min((parseFloat(order.total) / maxTotal) * 100, 100);

  return (
    <div
      onClick={onClick}
      className="px-2 sm:px-3 py-0.5 flex justify-between text-xs sm:text-sm font-mono hover:bg-gray-800/50 cursor-pointer relative group transition-colors"
    >
      <div 
        className={`absolute inset-y-0 left-0 ${barColor} transition-all duration-700 ease-out group-hover:opacity-100`}
        style={{ width: `${barWidth}%` }} 
      />
      {isHighlighted && (
        <div 
          className={`absolute inset-0 ${highlightColor}`}
          style={{ animation: 'fadeOut 1.5s ease-out forwards' }}
        />
      )}
      <span className={`${priceColor} relative z-10 flex-1 text-left font-medium`}>
        {addDecimal(order.price)}
      </span>
      <span className="text-gray-300 relative z-10 flex-1 text-center tabular-nums">
        {addDecimal(order.size)}
      </span>
      <span className="text-gray-300 relative z-10 flex-1 text-right tabular-nums">
        {addDecimal(order.total)}
      </span>
    </div>
  );
};

// Order List Component
interface OrderListProps {
  orders: OrderBookData[];
  isAsk: boolean;
  maxTotal: number;
  hideScrollbar?: boolean;
  highlightedPrices?: Set<string>;
}

const OrderList = ({ orders, isAsk, maxTotal, hideScrollbar = true, highlightedPrices }: OrderListProps) => {
  return (
    <div className={`flex-1 overflow-auto gap-1 ${isAsk ? "flex flex-col-reverse" : "flex flex-col"} ${hideScrollbar ? "scrollbar-hide" : ""}`}>
      {orders.map((order, i) => (
        <OrderRow
          key={`${isAsk ? "ask" : "bid"}-${order.price}`}
          order={order}
          isAsk={isAsk}
          maxTotal={maxTotal}
          isHighlighted={highlightedPrices?.has(order.price)}
        />
      ))}
    </div>
  );
};

// Spread Indicator Component
interface SpreadIndicatorProps {
  spread: number;
  spreadPercent: number;
}

const SpreadIndicator = ({ spread, spreadPercent }: SpreadIndicatorProps) => {
  return (
    <div className="px-2 sm:px-3 py-1.5 flex items-center justify-around text-xs text-gray-400 border-y border-gray-800 bg-gray-800/50">
      <span className="text-gray-400">Spread</span>
 
        <span className="tabular-nums text-gray-300">{addDecimal(spread)}</span>
        <span className="tabular-nums text-gray-300">{addDecimal(spreadPercent)}%</span>

    </div>
  );
};

// Trade Row Component
interface TradeRowProps {
  trade: TradeData;
}

const TradeRow = ({ trade }: TradeRowProps) => {
  const priceColor = trade.isBuy ? "text-teal-400" : "text-red-500";

  return (
    <div className="px-2 sm:px-3 py-1.5 flex justify-between items-center text-xs sm:text-sm hover:bg-gray-800/50 border-b border-gray-800/50 transition-colors">
      <span className={`${priceColor} font-mono flex-1 text-left tabular-nums font-medium`}>
        {addDecimal(trade.price).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
      </span>
      <span className="text-gray-300 flex-1 text-center tabular-nums">
        {trade.size}
      </span>
      <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-end">
        <span className="text-gray-400 tabular-nums">{trade.time}</span>
        <ExternalLink className="h-3 w-3 text-gray-500 hover:text-teal-400 transition-colors" />
      </div>
    </div>
  );
};

// Trades List Component
interface TradesListProps {
  trades: TradeData[];
}

const TradesList = ({ trades }: TradesListProps) => {
  return (
    <div className="flex-1 overflow-auto">
      <div className="px-2 sm:px-3 py-1.5 flex justify-between text-xs text-gray-500 border-b border-gray-800 sticky top-0 bg-gray-900/95 backdrop-blur-sm">
        <span>Price</span>
        <span>Size (ETH)</span>
        <span>Time</span>
      </div>
      {trades.map((trade, i) => (
        <TradeRow key={`trade-${i}`} trade={trade} />
      ))}
    </div>
  );
};

// Dropdown Component
interface DropdownProps {
  value: string;
  options: string[];
  onChange?: (value: string) => void;
  className?: string;
}

const Dropdown = ({ value, options, onChange, className = "" }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = useCallback((option: string) => {
    onChange?.(option);
    setIsOpen(false);
  }, [onChange]);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 text-xs sm:text-sm text-gray-400 hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 focus:ring-teal-400 rounded px-1 py-0.5"
      >
        {value}
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 bg-gray-900 border border-gray-800 rounded shadow-lg z-20 min-w-[100px]">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                      className={`
                        w-full text-left px-3 py-1.5 text-xs sm:text-sm transition-colors
                        ${value === option 
                          ? "bg-gray-800 text-white" 
                          : "text-gray-300 hover:bg-gray-800/50"
                        }
                      `}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Main OrderBook Component
export const OrderBook = () => {
  const [precision, setPrecision] = useState("0.5");
  const [currency, setCurrency] = useState("USDC");
  const [viewMode, setViewMode] = useState<"Stacked" | "Large">("Stacked");
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  const [spread, setSpread] = useState(0);
  const [spreadPercent, setSpreadPercent] = useState(0);

  const [asks, setAsks] = useState<OrderBookData[]>([]);
  const [bids, setBids] = useState<OrderBookData[]>([]);
  const [highlightedAskPrices, setHighlightedAskPrices] = useState<Set<string>>(new Set());
  const [highlightedBidPrices, setHighlightedBidPrices] = useState<Set<string>>(new Set());

  // Generate data only on client side to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    setTrades(generateTradesData(20));
  }, []);


  // Calculate max total for bar width scaling
  const allTotals = [...asks, ...bids].map(o => parseFloat(o.total));
  const maxTotal = Math.max(...allTotals, 1);

  const precisionOptions = ["0.1", "0.5", "1", "5", "10"];
  const currencyOptions = ["USDC", "ETH"];
  const viewModeOptions: ("Stacked" | "Large")[] = ["Stacked", "Large"];



  useEffect(() => {
    let subscription: Subscription | null = null;

    const handleSubscribeToLiveOrderBook = async () => {
      subscription = await subscriptionClient.l2Book(
        { coin: "SOL", nSigFigs: 5, mantissa: 2  }, // params are optional
        (book) => {
          const bestBid = book.levels[0];
          const bestAsk = book.levels[1];
          const spread = parseFloat(bestAsk[0].px) - parseFloat(bestBid[0].px);
          const spreadPercent = (spread / parseFloat(bestAsk[0].px)) * 100;
          setSpread(spread);
          setSpreadPercent(spreadPercent);
            console.log("spread",spread,spreadPercent);
          
        

        //  setAsks((prev: OrderBookData[]) => {
        //     let currentAsks = [...(prev || [])];
            
        //     // Create a Map of prices from bestAsk for efficient lookup
        //     const bestAskMap = new Map<string, { sz: string; n?: number }>();
        //     bestAsk.forEach(ask => {
        //       bestAskMap.set(ask.px, { sz: ask.sz, n: ask.n });
        //     });
            
        //     // Create a Set of prices from bestAsk to check removals
        //     const bestAskPrices = new Set(bestAsk.map(ask => ask.px));
            
        //     // Step 1: Update existing prices and mark which ones exist
        //     const updatedPrices = new Set<string>();
        //     for (let i = 0; i < currentAsks.length; i++) {
        //       const price = currentAsks[i].price;
        //       const bestAskData = bestAskMap.get(price);
              
        //       if (bestAskData) {
        //         // Update existing price
        //         currentAsks[i] = {
        //           price: price,
        //           size: bestAskData.sz,
        //           total: bestAskData.n?.toString() || "0",
        //         };
        //         updatedPrices.add(price);
        //         console.log("update", price);
        //       }
        //     }
            
        //     // Step 2: Remove prices that are no longer in bestAsk
        //     currentAsks = currentAsks.filter(ask => bestAskPrices.has(ask.price));
            
        //     // Step 3: Insert new prices from bestAsk
        //     for (let j = 0; j < bestAsk.length; j++) {
        //       const price = bestAsk[j].px;
        //       if (!updatedPrices.has(price)) {
        //         currentAsks.push({
        //           price: price,
        //           size: bestAsk[j].sz,
        //           total: bestAsk[j]?.n?.toString() || "0",
        //         });
        //         console.log("insert", j, price);
        //       }
        //     }
            
        //     // Step 4: Sort by price (ascending for asks - lowest ask first)
        //     currentAsks.sort((x, y) => Number(x.price) - Number(y.price));

        //     // Step 5: Recalculate cumulative total based on size
        //     let cumulativeTotal = 0;
        //     currentAsks = currentAsks.map((ask) => {
        //       const sizeNum = parseFloat(ask.size) || 0;
        //       cumulativeTotal += sizeNum;
        //       return {
        //         ...ask,
        //         total: cumulativeTotal.toFixed(4),
        //       };
        //     });

        //     return currentAsks.slice(0, 11);
        //   });

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
              total: addDecimal(cumulativeTotal),
            };
          });

          // Update highlighted prices
          if (newOrUpdatedPrices.size > 0) {
            setHighlightedAskPrices(new Set(newOrUpdatedPrices));
          }

          return currentAsks.slice(0, 11);
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
                total: addDecimal(cumulativeTotal),
              };
            });

            // Update highlighted prices
            if (newOrUpdatedPrices.size > 0) {
              setHighlightedBidPrices(new Set(newOrUpdatedPrices));
            }

            return currentBids.slice(0, 11);
          });
        });
        
    };
    
    handleSubscribeToLiveOrderBook();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Show loading state during SSR or initial mount
  if (!isMounted) {
    return (
      <div className="w-full sm:w-72 lg:w-80 xl:w-96 bg-gray-950 border-l border-gray-800 flex flex-col h-full">
        <div className="flex items-center justify-between px-2 sm:px-3 py-2 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-xs sm:text-sm text-gray-400">Order Book</div>
            <div className="text-xs sm:text-sm text-gray-400">Trades</div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xs text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full sm:w-72 lg:w-80 xl:w-96 bg-gray-950 border-l border-gray-800 flex flex-col h-full">
      <Tabs defaultValue="orderbook" className="flex-1 flex flex-col min-h-0">
        {/* Header with Tabs */}
        <div className="flex items-center justify-between px-2 sm:px-3 py-2 border-b border-gray-800 shrink-0">
          <TabsList className="bg-transparent p-0 h-auto">
            <TabsTrigger value="orderbook">Order Book</TabsTrigger>
            <TabsTrigger value="trades">Trades</TabsTrigger>
          </TabsList>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOptionsOpen(!isOptionsOpen)}
              className="h-6 w-6 text-gray-400"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
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
          </div>
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
          <TabsContent value="orderbook" className="absolute inset-0 m-0 p-0 flex flex-col min-h-0 w-full">
            {/* Controls */}
            <div className="px-2 sm:px-3 py-2 flex items-center gap-2 shrink-0">
              <Dropdown
                value={precision}
                options={precisionOptions}
                onChange={setPrecision}
              />
              <Dropdown
                value={currency}
                options={currencyOptions}
                onChange={setCurrency}
                className="ml-auto"
              />
            </div>

            {/* Column Headers */}
            <div className="px-2 sm:px-3 py-1.5 flex justify-between text-xs text-gray-500 border-b border-gray-800 shrink-0 bg-gray-900/50">
              <span className="flex-1 text-left">Price</span>
              <span className="flex-1 text-center">Size ({currency})</span>
              <span className="flex-1 text-right">Total ({currency})</span>
            </div>

            {/* Order Book Data */}
            <div className="flex-1 overflow-hidden grid grid-rows-[1fr_auto_1fr] min-h-0">
              <div className="min-h-0 flex flex-col">
                <OrderList orders={asks} isAsk={true} maxTotal={maxTotal} hideScrollbar={true} highlightedPrices={highlightedAskPrices} />
              </div>
              <SpreadIndicator 
                spread={spread} 
                spreadPercent={spreadPercent} 
              />
              <div className="min-h-0 flex flex-col">
                <OrderList orders={bids} isAsk={false} maxTotal={maxTotal} hideScrollbar={true} highlightedPrices={highlightedBidPrices} />
              </div>
            </div>
          </TabsContent>

          {/* Trades Tab Content */}
          <TabsContent value="trades" className="absolute inset-0 m-0 p-0 flex flex-col min-h-0 w-full">
            <TradesList trades={trades} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
