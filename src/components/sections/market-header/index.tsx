import { infoClient, subscriptionClient } from "@/lib/config/hyperliquied/hyperliquid-client";
import { fetchPerpetualMarkets } from "@/lib/services/markets";
import { Subscription } from "@nktkas/hyperliquid";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Star, Search, X } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { LOCAL_STORAGE_KEYS, getLocalStorage, setLocalStorage } from "@/lib/sessions/localstorage";
import { useMarketStore } from "@/store/market";
import { getCoinIconUrl, DEFAULT_COIN_ICON_URL } from "@/lib/config";

// Helper function to convert leverage from string to number
const parseLeverage = (leverage: string | null): number => {
  if (!leverage) return 1;
  // Remove 'x' suffix if present and parse to number
  const num = parseFloat(leverage.replace(/x$/i, ''));
  return isNaN(num) ? 1 : num;
};

// Single source of truth for all markets

export type PerpetualMarket = {
  coin: string;
  symbol: string;
  leverage: string | null;
  lastPrice: number | null;
  change24h: number | null;
  change24hPer: number | null;
  fundingPer: number | null;
  volume: number | null;
  openInterest: number | null;
  mark: number | null;
  oracle: number | null;
  volume24h: number | null;
  fundingDisplay: string | null;
  countdown: string | null;
  isSelected: boolean;
  isFavorite: boolean;
};




export const MarketHeader = ({ currency }: { currency: string }) => {
  const setSelectedMarket = useMarketStore().setSelectedMarket;
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<"$" | "%">("%");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // Single state variable containing all market data with isSelected and isFavorite
  const [markets, setMarkets] = useState<Map<string,PerpetualMarket>>(new Map());
  
  const [isHydrated, setIsHydrated] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const marketButtonRefDesktop = useRef<HTMLButtonElement>(null);
  const marketButtonRefMobile = useRef<HTMLButtonElement>(null);
  const hasFetchedMarketsRef = useRef(false);

  // Convert Map to Array for operations
  const marketsArray = useMemo(() => Array.from(markets.values()), [markets]);

  // Load favorites from localStorage after hydration (client-side only)
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Load favorites when markets are available (backup for subscription updates)
  useEffect(() => {
    if (!isHydrated || marketsArray.length === 0) return;
    
    const data = getLocalStorage(LOCAL_STORAGE_KEYS.FAVORITE_MARKETS);
    const savedFavorites = data?.symbols ?? [];
    if (savedFavorites.length > 0) {
      setMarkets(prevMarkets => {
        const updated = new Map(prevMarkets);
        let hasChanges = false;
        savedFavorites.forEach(symbol => {
          const market = updated.get(symbol);
          if (market && !market.isFavorite) {
            updated.set(symbol, { ...market, isFavorite: true });
            hasChanges = true;
          }
        });
        return hasChanges ? updated : prevMarkets;
      });
    }
  }, [isHydrated, marketsArray.length]);

  // Handle initial market selection after hydration and markets are loaded
  useEffect(() => {
    if (!isHydrated || marketsArray.length === 0) return;
    
    // Check if any market is already selected
    const hasSelected = marketsArray.some(m => m.isSelected);
    
    // Only set initial selection if no market is selected yet
    if (!hasSelected) {
      if (currency) {
        // Find market matching the currency prop
        const marketToSelect = marketsArray.find(m => m.coin === currency);
        
        if (marketToSelect) {
          setMarkets(prevMarkets => {
            const updated = new Map(prevMarkets);
            // Unselect all markets
            updated.forEach((market, key) => {
              updated.set(key, { ...market, isSelected: false });
            });
            // Select the market matching currency
            updated.set(marketToSelect.symbol, { ...marketToSelect, isSelected: true });
            return updated;
          });
          setSelectedMarket({ coin: marketToSelect.coin, leverage: parseLeverage(marketToSelect.leverage) }, false);
        } else {
          // Fallback to first market if saved market doesn't exist
          const firstMarket = marketsArray[0];
          setMarkets(prevMarkets => {
            const updated = new Map(prevMarkets);
            updated.forEach((market, key) => {
              updated.set(key, { ...market, isSelected: false });
            });
            updated.set(firstMarket.symbol, { ...firstMarket, isSelected: true });
            return updated;
          });
          setSelectedMarket({ coin: firstMarket.coin, leverage: parseLeverage(firstMarket.leverage) }, false);
        }
      } else {
        // Fallback to first market if no currency
        const firstMarket = marketsArray[0];
        setMarkets(prevMarkets => {
          const updated = new Map(prevMarkets);
          updated.forEach((market, key) => {
            updated.set(key, { ...market, isSelected: false });
          });
          updated.set(firstMarket.symbol, { ...firstMarket, isSelected: true });
          return updated;
        });
        setSelectedMarket({ coin: firstMarket.coin, leverage: parseLeverage(firstMarket.leverage) }, false);
      }
    }
  }, [isHydrated, marketsArray.length, currency]);

  // Sync selected market with currency prop when currency changes after initial load
  useEffect(() => {
    if (!isHydrated || marketsArray.length === 0 || !currency) return;
    
    // Find market matching the currency prop
    const marketToSelect = marketsArray.find(m => m.coin === currency);
    const currentlySelected = marketsArray.find(m => m.isSelected);
    
    // Only update if currency changed and market exists
    if (marketToSelect && currentlySelected?.coin !== currency) {
      setMarkets(prevMarkets => {
        const updated = new Map(prevMarkets);
        // Unselect all markets
        updated.forEach((market, key) => {
          updated.set(key, { ...market, isSelected: false });
        });
        // Select the market matching currency
        updated.set(marketToSelect.symbol, { ...marketToSelect, isSelected: true });
        return updated;
      });
      setSelectedMarket({ coin: marketToSelect.coin, leverage: parseLeverage(marketToSelect.leverage) }, false);
    }
  }, [currency, isHydrated, marketsArray.length]);

  // Get selected market data
  const selectedMarketData = useMemo(() => {
    if (currency) {
      const marketByCurrency = marketsArray.find(m => m.coin === currency);
      if (marketByCurrency) return marketByCurrency;
    }
    // Fallback to first market if currency not found or not provided
    return marketsArray[0] || null;
  }, [marketsArray, currency]);

  // Get favorite markets (memoized)
  const favoriteMarkets = useMemo(() => {
    return marketsArray.filter(market => market.isFavorite);
  }, [marketsArray]);

  // Get filtered markets for dropdown (memoized)
  const filteredMarkets = useMemo(() => {
    let filtered = marketsArray;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(market => 
        market.symbol.toLowerCase().includes(query) ||
        market.coin.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [marketsArray, searchQuery]);

  const handleToggleFavorite = (symbol: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setMarkets(prevMarkets => {
      const updated = new Map(prevMarkets);
      const market = updated.get(symbol);
      if (market) {
        updated.set(symbol, { ...market, isFavorite: !market.isFavorite });
        
        // Save favorites to localStorage
        const favoriteSymbols = Array.from(updated.values())
          .filter(m => m.isFavorite)
          .map(m => m.symbol);
        setLocalStorage(LOCAL_STORAGE_KEYS.FAVORITE_MARKETS, { symbols: favoriteSymbols });
      }
      return updated;
    });
  };

  const handleMarketSelect = (symbol: string, e?: React.MouseEvent) => {
    if (!symbol) return;
    
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setMarkets(prevMarkets => {
      const updated = new Map(prevMarkets);
      // Unselect all markets
      updated.forEach((market, key) => {
        updated.set(key, { ...market, isSelected: false });
      });
      // Select the chosen market
      const market = updated.get(symbol);
      if (market) {
        updated.set(symbol, { ...market, isSelected: true });
        // Save selected market to store
        setSelectedMarket({ coin: market.coin, leverage: parseLeverage(market.leverage) });
      }
      return updated;
    });
    
    setIsDropdownOpen(false);
    setSearchQuery("");
  };

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const checkScrollability = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      const hasOverflowContent = scrollWidth > clientWidth;
      const canScrollLeftNow = scrollLeft > 0;
      const canScrollRightNow = scrollLeft < scrollWidth - clientWidth - 1; // -1 for rounding errors

      setHasOverflow(hasOverflowContent);
      setCanScrollLeft(canScrollLeftNow);
      setCanScrollRight(canScrollRightNow);
    }
  };

  useEffect(() => {
    checkScrollability();
    
    const handleResize = () => {
      checkScrollability();
    };

    const handleScroll = () => {
      checkScrollability();
    };

    window.addEventListener("resize", handleResize);
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
    }

    // Use ResizeObserver to detect content size changes
    const resizeObserver = new ResizeObserver(() => {
      checkScrollability();
    });

    if (scrollContainer) {
      resizeObserver.observe(scrollContainer);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      }
      resizeObserver.disconnect();
    };
  }, [markets]);

  // Check scrollability when viewMode changes (affects content width)
  useEffect(() => {
    // Small delay to allow DOM to update
    setTimeout(checkScrollability, 0);
  }, [viewMode, markets]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const buttonRef = marketButtonRefDesktop.current || marketButtonRefMobile.current;
      const target = event.target as Node;
      
      // Check if click is inside dropdown or button
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(target) &&
        buttonRef &&
        !buttonRef.contains(target)
      ) {
        setIsDropdownOpen(false);
        setSearchQuery("");
      }
    };

    if (isDropdownOpen) {
      // Use click event (not mousedown) to allow button onClick handlers to execute first
      document.addEventListener("click", handleClickOutside);

      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [isDropdownOpen]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" });
      // Check scroll state after a short delay to account for smooth scrolling
      setTimeout(checkScrollability, 300);
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" });
      // Check scroll state after a short delay to account for smooth scrolling
      setTimeout(checkScrollability, 300);
    }
  };


  useEffect(() => {
    const fetchMarkets = async () => {
      const resp = await fetchPerpetualMarkets();
      const universe = resp.meta?.universe || [];      // array of { name, maxLeverage, ... }
      const assetCtxs = resp.assetCtxs || [];          // array of { markPx, midPx, prevDayPx, funding, dayNtlVlm, openInterest, ... }
    
      // assetCtxs is aligned with universe by index
      // Convert array to Map for fast lookup (keyed by symbol) while building the array
      const marketsMap = new Map<string, PerpetualMarket>();
      const marketsArray = await universe.map((u, index) => {
        const coin = u.name; // e.g. "BTC", "ETH", "SOL"
        const ctx = assetCtxs[index];
    
        // Safety check: ensure ctx exists (arrays should be aligned, but handle edge cases)
        if (!ctx) {
          const market = {
            coin,
            symbol: `${coin}-USDC`,
            leverage: u.maxLeverage ? `${u.maxLeverage}x` : null,
            lastPrice: null,
            change24h: null,
            change24hPer: null,
            fundingPer: null,
            volume: null,
            openInterest: null,
            mark: null,
            oracle: null,
            volume24h: null,
            fundingDisplay: null,
            countdown: null,
            isSelected: false,
            isFavorite: false,
          };
          marketsMap.set(market.symbol, market);
          return market;
        }
    
        // Last price: prefer markPx (mark price) over midPx (mid price)
        // Note: markPx is used for funding calculations, midPx is bid/ask midpoint
        const last = ctx.markPx ?? ctx.midPx ?? null;
        const prevDay = ctx.prevDayPx ?? null;
    
        const lastPrice = last != null ? Number(last) : null;
        const prevPrice = prevDay != null ? Number(prevDay) : null;
    
        // 24H Change: calculate absolute change and percentage
        const change24 = lastPrice != null && prevPrice != null ? lastPrice - prevPrice : null;
        // Explicit division by zero check: prevPrice must be non-zero for percentage calculation
        const changePct = change24 != null && prevPrice != null && prevPrice !== 0 
          ? (change24 / prevPrice) * 100 
          : null;
    
        // 8H Funding: funding is a decimal (e.g. -0.0027527) -> multiply by 100 for percent
        // Note: Verify if ctx.funding is 8-hour funding or hourly funding
        // If it's hourly, multiply by 8: Number(ctx.funding) * 8 * 100
        // Based on typical Hyperliquid API, funding appears to be 8-hour rate already
        const fundingPct = ctx.funding != null ? Number(ctx.funding) * 100 : null;
    
        // Volume: dayNtlVlm is 24h notional volume (USD)
        const volume = ctx.dayNtlVlm != null ? Number(ctx.dayNtlVlm) : null;
        
        // Open Interest: notional open interest (USD)
        // FIX: open interest is returned as size (base units), not USD
        const openInterestSize = ctx.openInterest != null ? Number(ctx.openInterest) : null;
        const openInterestUsd = (openInterestSize != null && lastPrice != null)
          ? openInterestSize * lastPrice
          : null;
    
          const markStr = ctx.markPx != null ? Number(ctx.markPx) : ctx.midPx != null ? Number(ctx.midPx) : null;
          const oracleStr = ctx.oraclePx != null ? Number(ctx.oraclePx) : null;
          
          const volumeStr = ctx.dayNtlVlm ?? null;
          const volume24h = volumeStr != null ? (Number(volumeStr)) : null;
    
    
          function formatPct(n: number | null, digits = 4) {
            if (n == null || !isFinite(n)) return "—";
            return `${n >= 0 ? "+" : ""}${n.toFixed(digits)}%`;
          }
          
          function formatCountdown(ms: number) {
            const s = Math.max(0, Math.floor(ms / 1000));
            const hh = Math.floor(s / 3600).toString().padStart(2, "0");
            const mm = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
            const ss = (s % 60).toString().padStart(2, "0");
            return `${hh}:${mm}:${ss}`;
          }
      
          const fundingRaw = ctx.funding != null ? Number(ctx.funding) : null;
      
          // Per docs: ctx.funding in examples is 0.0000125 (this equals 0.00125% per hour)
          // So hourly percent = fundingRaw * 100
          const fundingHourlyPct = fundingRaw != null ? fundingRaw * 100 : null;
          const funding8hPct = fundingRaw != null ? fundingRaw * 8 * 100 : null;
        
          // Use server-provided time if available to avoid clock skew
          const now = typeof (resp as any).time === "number" ? (resp as any).time : Date.now();
          const msUntilNextHour = 3600_000 - (now % 3600_000);
          const countdown = formatCountdown(msUntilNextHour);
    
        const market = {
          coin,
          symbol: `${coin}-USDC`,
          leverage: u.maxLeverage ? `${u.maxLeverage}x` : null,
          lastPrice,
          change24h: change24,
          change24hPer: changePct,
          fundingPer: fundingPct,
          volume,
          openInterest:openInterestUsd,
          mark: markStr,
          oracle: oracleStr,
          volume24h,
          fundingDisplay: formatPct(fundingHourlyPct ?? funding8hPct, 4), // choose hourly by default
          countdown,
          isSelected: false,
          isFavorite: false,
        };
        marketsMap.set(market.symbol, market);
        return market;
      });
      
      // Restore favorites from localStorage
      const favoriteData = getLocalStorage(LOCAL_STORAGE_KEYS.FAVORITE_MARKETS);
      const savedFavorites = favoriteData?.symbols ?? [];
      if (savedFavorites.length > 0) {
        savedFavorites.forEach(symbol => {
          const market = marketsMap.get(symbol);
          if (market) {
            marketsMap.set(symbol, { ...market, isFavorite: true });
          }
        });
      }
      
      setMarkets(marketsMap);
      console.log("markets", marketsMap);
    };
    fetchMarkets();
  }, []);
  
  const ZERO = "0x0000000000000000000000000000000000000000";

  // Type definitions for subscription response
  type UniverseItem = {
    name: string;
    maxLeverage?: number;
  };

  type AssetContext = {
    prevDayPx: string;
    dayNtlVlm: string;
    markPx: string;
    midPx: string | null;
    funding: string;
    openInterest: string;
    premium: string | null;
    oraclePx: string;
    impactPxs: string[] | null;
    dayBaseVlm: string;
  };

  // Use Parameters utility type to extract the actual callback parameter type
  type WebData2Callback = Parameters<typeof subscriptionClient.webData2>[1];
  type WebData2Response = Parameters<WebData2Callback>[0];

  useEffect(() => {
    let subscription: Subscription | null = null;
  
    const start = async () => {
      try {
        // Subscribe to webData2 for the zero address (global perps state)
        subscription = await subscriptionClient.webData2(
          { user: ZERO },
          (resp: WebData2Response) => {
            const universe = resp.meta?.universe || [];
            const assetCtxs = resp.assetCtxs || [];

            // Helper function to format percentage
            const formatPct = (n: number | null, digits = 4): string => {
              if (n == null || !isFinite(n)) return "—";
              return `${n >= 0 ? "+" : ""}${n.toFixed(digits)}%`;
            };

            // Helper function to format countdown
            const formatCountdown = (ms: number): string => {
              const s = Math.max(0, Math.floor(ms / 1000));
              const hh = Math.floor(s / 3600).toString().padStart(2, "0");
              const mm = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
              const ss = (s % 60).toString().padStart(2, "0");
              return `${hh}:${mm}:${ss}`;
            };

            // Use server-provided time if available to avoid clock skew
            const now = 'time' in resp && typeof (resp as { time?: number }).time === "number" 
              ? (resp as { time: number }).time 
              : Date.now();
            const msUntilNextHour = 3600_000 - (now % 3600_000);
            const countdown = formatCountdown(msUntilNextHour);

            // SINGLE LOOP OPTIMIZATION: Process all markets in one iteration
            setMarkets((prevMarkets) => {
              const updated = new Map<string, PerpetualMarket>();

              // Single loop: process incoming data, update/create markets in one pass
              for (let i = 0; i < universe.length; i++) {
                const u = universe[i];
                const ctx = assetCtxs[i];
                const coin = u?.name ?? "UNKNOWN";
                const symbol = `${coin}-USDC`;

                // Get existing market to preserve UI state (isSelected/isFavorite)
                const existingMarket = prevMarkets.get(symbol);

                let marketData: PerpetualMarket;

                if (!ctx) {
                  marketData = {
                    coin,
                    symbol,
                    leverage: u?.maxLeverage ? `${u.maxLeverage}x` : null,
                    lastPrice: null,
                    change24h: null,
                    change24hPer: null,
                    fundingPer: null,
                    volume: null,
                    openInterest: null,
                    mark: null,
                    oracle: null,
                    volume24h: null,
                    fundingDisplay: null,
                    countdown,
                    isSelected: existingMarket?.isSelected ?? false,
                    isFavorite: existingMarket?.isFavorite ?? false,
                  };
                } else {
                  // Prefer markPx over midPx
                  const last = ctx.markPx ?? ctx.midPx ?? null;
                  const prevDay = ctx.prevDayPx ?? null;
                  const lastPrice = last != null ? Number(last) : null;
                  const prevPrice = prevDay != null ? Number(prevDay) : null;

                  // 24H Change: calculate absolute change and percentage
                  const change24h = lastPrice != null && prevPrice != null ? lastPrice - prevPrice : null;
                  const change24hPer = change24h != null && prevPrice != null && prevPrice !== 0
                    ? (change24h / prevPrice) * 100
                    : null;

                  // Funding: API returns decimal per hour; multiply by 8 for 8H, *100 to percent
                  const fundingRaw = ctx.funding != null ? Number(ctx.funding) : null;
                  const fundingHourlyPct = fundingRaw != null ? fundingRaw * 100 : null;
                  const funding8hPct = fundingRaw != null ? fundingRaw * 8 * 100 : null;
                  const fundingPer = fundingRaw != null ? fundingRaw * 100 : null;

                  // Volume: dayNtlVlm is 24h notional volume (USD)
                  const volume = ctx.dayNtlVlm != null ? Number(ctx.dayNtlVlm) : null;

                  // Open Interest: convert from base units to USD notional
                  const openInterestSize = ctx.openInterest != null ? Number(ctx.openInterest) : null;
                  const openInterest = openInterestSize != null && lastPrice != null
                    ? openInterestSize * lastPrice
                    : null;

                  const mark = ctx.markPx != null ? Number(ctx.markPx) : ctx.midPx != null ? Number(ctx.midPx) : null;
                  const oracle = ctx.oraclePx != null ? Number(ctx.oraclePx) : null;

                  marketData = {
                    coin,
                    symbol,
                    leverage: u?.maxLeverage ? `${u.maxLeverage}x` : null,
                    lastPrice,
                    change24h,
                    change24hPer,
                    fundingPer,
                    volume,
                    openInterest,
                    mark,
                    oracle,
                    volume24h: volume,
                    fundingDisplay: formatPct(fundingHourlyPct ?? funding8hPct, 4),
                    countdown,
                    isSelected: existingMarket?.isSelected ?? false,
                    isFavorite: existingMarket?.isFavorite ?? false,
                  };
                }

                updated.set(symbol, marketData);
              }

              // Markets not in universe are automatically removed (not added to updated Map)
              // No need for additional loops - single pass handles everything
              return updated;
            });
          }
        );
      } catch (err) {
        console.error("webData2 subscription error:", err);
      }
    };
  
    start();
  
    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (e) {
          /* ignore unsubscribe errors */
        }
      }
    };
  }, []); // Empty dependency array - subscription runs once on mount
  
  return (
    <div className="border-b border-gray-800/20 bg-gray-950">
      <div className="border-b border-gray-800/15 bg-gray-950/80">
        <div className="px-4 py-2 flex items-center gap-3">
          <button className="text-gray-500 hover:text-yellow-400 transition-colors shrink-0 cursor-pointer">
            <Star fill={favoriteMarkets.length > 0 ? "yellow" : "none"} className="h-3.5 w-3.5" />
          </button>

          <div className="flex items-center bg-gray-900/40 rounded-lg p-0.5 shrink-0 border border-gray-800/15">
            <button
              onClick={() => setViewMode("$")}
              className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-all cursor-pointer ${
                viewMode === "$"
                  ? "bg-green-500/12 text-green-400"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              $
            </button>
            <button
              onClick={() => setViewMode("%")}
              className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-all cursor-pointer ${
                viewMode === "%"
                  ? "bg-green-500/12 text-green-400"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              %
            </button>
          </div>

          {/* Left Arrow */}
          {hasOverflow && canScrollLeft && (
            <button 
              onClick={scrollLeft}
              className="text-gray-400 hover:text-gray-300 transition-colors shrink-0 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}

          {/* Favorite Markets List - Scrollable Container */}
          <div 
            ref={scrollContainerRef}
            className="flex items-center gap-4 flex-1 min-w-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {favoriteMarkets.length === 0 ? (
              <div className="text-sm text-gray-500 px-2 py-1">
                No favorites. Click star to add markets.
              </div>
            ) : (
              favoriteMarkets.map((market) => {
                const isPositive = (market.change24hPer ?? 0) >= 0;
                const displayValue = viewMode === "$" 
                  ? market.change24h != null ? `$${Math.abs(market.change24h).toFixed(2)}` : "—"
                  : market.change24hPer != null ? `${isPositive ? "+" : ""}${market.change24hPer.toFixed(2)}%` : "—";
                
                return (
                  <button
                    key={market.symbol}
                    onClick={() => handleMarketSelect(market.symbol)}
                    className="text-[11px] font-semibold hover:bg-gray-800/40 px-2 py-1 rounded-lg transition-all shrink-0 whitespace-nowrap cursor-pointer"
                  >
                    <span className="text-gray-300">{market.symbol}</span>
                    <span className={`ml-1.5 text-[10px] font-mono tabular-nums ${isPositive ? "text-green-400" : "text-red-400"}`}>
                      {displayValue}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Right Arrow */}
          {hasOverflow && canScrollRight && (
            <button 
              onClick={scrollRight}
              className="text-gray-400 hover:text-gray-300 transition-colors shrink-0 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      {/* Desktop & Tablet View */}
      <div className="hidden md:flex">
        <div className="w-full px-4 py-3 flex items-center justify-between relative min-h-[52px]">
          <div className="flex items-center gap-4 lg:gap-6 flex-1 min-w-0">
            <div className="relative shrink-0">
              {selectedMarketData && (
                <button 
                  ref={marketButtonRefDesktop}
                  onClick={handleDropdownToggle}
                  className="text-white hover:bg-gray-800/50 px-3 py-1.5 h-auto rounded-lg transition-colors shrink-0 cursor-pointer border border-transparent hover:border-gray-700/40"
                >
                  <div className="flex items-center gap-2">
                    <img 
                      src={getCoinIconUrl(selectedMarketData.symbol)} 
                      alt={selectedMarketData.coin} 
                      className="w-5 h-5 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_COIN_ICON_URL;
                      }}
                    />
                    <span className="font-semibold text-sm text-white">{selectedMarketData.symbol}</span>
                    <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>
              )}

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div 
                  ref={dropdownRef}
                  className="absolute top-full left-0 mt-2 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl shadow-black/40 z-100 w-[800px] max-h-[600px] flex flex-col"
                >
                  <div className="p-3 border-b border-gray-800/40">
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search markets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-9 py-2 bg-gray-800/40 border border-gray-700/40 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500/40 focus:border-green-500/30 transition-colors"
                        autoFocus
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="overflow-y-auto flex-1 max-h-[400px] [scrollbar-width:thin] [scrollbar-color:gray-700_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-700/60 [&::-webkit-scrollbar-thumb]:rounded">
                    {filteredMarkets.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No markets found
                      </div>
                    ) : (
                      <div className="min-w-full">
                        <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800/30 px-4 py-2 grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,0.8fr)_minmax(0,1.2fr)_minmax(0,1.5fr)] gap-4 text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                          <div>Symbol</div>
                          <div className="text-right">Last Price</div>
                          <div className="text-right">24H Change</div>
                          <div className="text-right">8H Funding</div>
                          <div className="text-right">Volume</div>
                          <div className="text-right">Open Interest</div>
                        </div>
                        
                        {filteredMarkets.map((market) => {
                          const isPositive = (market.change24hPer ?? 0) >= 0;
                          const isFavorite = market.isFavorite;
                          const isSelected = market.isSelected;
                          const funding8hValue = market.fundingPer != null ? market.fundingPer * 8 : null;
                          const funding8hDisplay = funding8hValue != null ? `${funding8hValue >= 0 ? "+" : ""}${funding8hValue.toFixed(4)}%` : "—";
                          
                          return (
                            <button
                              key={market.symbol}
                              type="button"
                              onClick={(e) => handleMarketSelect(market.symbol, e)}
                              className={`w-full cursor-pointer px-4 py-2.5 grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,0.8fr)_minmax(0,1.2fr)_minmax(0,1.5fr)] gap-4 items-center hover:bg-gray-800/40 transition-colors border-b border-gray-800/20 last:border-b-0 text-xs ${
                                isSelected ? 'bg-green-500/5' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleFavorite(market.symbol, e)}
                                  className="shrink-0 hover:scale-110 transition-transform cursor-pointer"
                                >
                                  <Star
                                    fill={isFavorite ? "yellow" : "none"}
                                    className={`h-3 w-3 ${isFavorite ? "text-yellow-400" : "text-gray-600"}`}
                                  />
                                </button>
                                <img 
                                  src={getCoinIconUrl(market.symbol)} 
                                  alt={market.coin} 
                                  className="w-4 h-4 rounded-full shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = DEFAULT_COIN_ICON_URL;
                                  }}
                                />
                                <span className={`font-medium truncate ${isSelected ? 'text-green-400' : 'text-white'}`}>
                                  {market.symbol}
                                </span>
                                {market.leverage && (
                                  <span className="text-[10px] font-medium bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded-md shrink-0">
                                    {market.leverage}
                                  </span>
                                )}
                                {isSelected && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0"></div>
                                )}
                              </div>
                              <div className="text-right font-medium tabular-nums text-gray-200 whitespace-nowrap overflow-hidden text-ellipsis">
                                {market.lastPrice != null ? market.lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                              </div>
                              <div className={`text-right font-medium tabular-nums whitespace-nowrap overflow-hidden text-ellipsis ${isPositive ? "text-green-400" : "text-red-400"}`}>
                                {market.change24h != null ? `${isPositive ? "+" : ""}${market.change24h.toFixed(2)}` : "—"} / {market.change24hPer != null ? `${isPositive ? "+" : ""}${market.change24hPer.toFixed(2)}%` : "—"}
                              </div>
                              <div className={`text-right font-medium tabular-nums whitespace-nowrap overflow-hidden text-ellipsis ${(funding8hValue ?? 0) >= 0 ? "text-gray-200" : "text-red-400"}`}>
                                {funding8hDisplay}
                              </div>
                              <div className="text-right font-medium tabular-nums text-gray-200 whitespace-nowrap overflow-hidden text-ellipsis">
                                {market.volume24h != null ? `$${market.volume24h.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : "—"}
                              </div>
                              <div className="text-right font-medium tabular-nums text-gray-200 whitespace-nowrap overflow-hidden text-ellipsis">
                                {market.openInterest != null ? `$${market.openInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {selectedMarketData?.leverage && (
              <span className="text-[11px] font-medium bg-green-500/15 text-green-400 px-2 py-0.5 rounded-md shrink-0">{selectedMarketData.leverage}</span>
            )}

            {selectedMarketData && (
              <div className="flex gap-4 lg:gap-5 text-xs flex-1 min-w-0 items-center">
                {selectedMarketData.mark != null && (
                  <div className="shrink-0">
                    <div className="text-[10px] text-gray-500 mb-0.5 font-medium">Mark</div>
                    <div className="text-[11px] font-semibold tabular-nums text-gray-200 font-mono">{selectedMarketData.mark.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                )}
                {selectedMarketData.oracle != null && (
                  <>
                    <div className="w-px h-7 bg-gray-800/30 shrink-0 hidden lg:block" />
                    <div className="shrink-0">
                      <div className="text-[10px] text-gray-500 mb-0.5 font-medium">Oracle</div>
                      <div className="text-[11px] font-semibold tabular-nums text-gray-200 font-mono">{selectedMarketData.oracle.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                  </>
                )}
                <div className="w-px h-7 bg-gray-800/30 shrink-0 hidden lg:block" />
                <div className="shrink-0">
                  <div className="text-[10px] text-gray-500 mb-0.5 font-medium">24H Change</div>
                  <div className={`text-[11px] font-semibold tabular-nums font-mono ${(selectedMarketData.change24hPer ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedMarketData.change24h != null ? `${(selectedMarketData.change24hPer ?? 0) >= 0 ? '+' : ''}${selectedMarketData.change24h.toFixed(2)}` : '—'} / {selectedMarketData.change24hPer != null ? `${(selectedMarketData.change24hPer ?? 0) >= 0 ? '+' : ''}${selectedMarketData.change24hPer.toFixed(2)}%` : '—'}
                  </div>
                </div>
                {selectedMarketData.volume24h != null && (
                  <>
                    <div className="w-px h-7 bg-gray-800/30 shrink-0 hidden lg:block" />
                    <div className="shrink-0 hidden lg:block">
                      <div className="text-[10px] text-gray-500 mb-0.5 font-medium">24H Volume</div>
                      <div className="text-[11px] font-semibold tabular-nums text-gray-200 font-mono">${selectedMarketData.volume24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                  </>
                )}
                {selectedMarketData.openInterest != null && (
                  <>
                    <div className="w-px h-7 bg-gray-800/30 shrink-0 hidden lg:block" />
                    <div className="shrink-0 hidden lg:block">
                      <div className="text-[10px] text-gray-500 mb-0.5 font-medium">Open Interest</div>
                      <div className="text-[11px] font-semibold tabular-nums text-gray-200 font-mono">${selectedMarketData.openInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                  </>
                )}
                {selectedMarketData.fundingDisplay != null && (
                  <>
                    <div className="w-px h-7 bg-gray-800/30 shrink-0 hidden xl:block" />
                    <div className="shrink-0 hidden xl:block">
                      <div className="text-[10px] text-gray-500 mb-0.5 font-medium">Funding / Countdown</div>
                      <div className="text-[11px] font-semibold tabular-nums text-green-400 font-mono">
                        {selectedMarketData.fundingDisplay} <span className="text-gray-300">{selectedMarketData.countdown || '—'}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        <div className="px-3 py-2.5 flex items-center justify-between relative">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative">
              {selectedMarketData && (
                <button 
                  ref={marketButtonRefMobile}
                  onClick={handleDropdownToggle}
                  className="text-white hover:bg-gray-800/40 px-2 py-1.5 h-auto rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <img 
                      src={getCoinIconUrl(selectedMarketData.symbol)} 
                      alt={selectedMarketData.coin} 
                      className="w-5 h-5 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_COIN_ICON_URL;
                      }}
                    />
                    <span className="font-semibold text-sm text-white">{selectedMarketData.symbol}</span>
                    <ChevronDown className={`h-3 w-3 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>
              )}

              {isDropdownOpen && (
                <div 
                  ref={dropdownRef}
                  className="absolute top-full left-0 mt-2 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl shadow-black/40 z-100 w-[calc(100vw-2rem)] max-h-[600px] flex flex-col"
                >
                  <div className="p-3 border-b border-gray-800/30">
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search markets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-9 py-2 bg-gray-800/40 border border-gray-700/40 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500/40 focus:border-green-500/30 transition-colors"
                        autoFocus
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="overflow-y-auto flex-1 max-h-[400px] [scrollbar-width:thin] [scrollbar-color:gray-700_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-700/60 [&::-webkit-scrollbar-thumb]:rounded">
                    {filteredMarkets.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No markets found
                      </div>
                    ) : (
                      filteredMarkets.map((market) => {
                        const isPositive = (market.change24hPer ?? 0) >= 0;
                        const isFavorite = market.isFavorite;
                        const isSelected = market.isSelected;
                        
                        return (
                          <button
                            key={market.symbol}
                            type="button"
                            onClick={(e) => handleMarketSelect(market.symbol, e)}
                            className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/40 transition-colors border-b border-gray-800/20 last:border-b-0 cursor-pointer ${
                              isSelected ? 'bg-green-500/5' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <img 
                                src={getCoinIconUrl(market.symbol)} 
                                alt={market.coin} 
                                className="w-5 h-5 rounded-full shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = DEFAULT_COIN_ICON_URL;
                                }}
                              />
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleFavorite(market.symbol, e)}
                                  className="shrink-0 hover:scale-110 transition-transform cursor-pointer"
                                >
                                  <Star
                                    fill={isFavorite ? "yellow" : "none"}
                                    className={`h-3 w-3 ${isFavorite ? "text-yellow-400" : "text-gray-600"}`}
                                  />
                                </button>
                                <span className={`text-sm font-medium truncate ${isSelected ? 'text-green-400' : 'text-white'}`}>
                                  {market.symbol}
                                </span>
                                {market.leverage && (
                                  <span className="text-[10px] font-medium bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded-md shrink-0">
                                    {market.leverage}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-xs font-medium ${isPositive ? "text-green-400" : "text-red-400"}`}>
                                {market.change24hPer != null ? `${isPositive ? "+" : ""}${market.change24hPer.toFixed(2)}%` : "—"}
                              </span>
                              {isSelected && (
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
            {selectedMarketData?.leverage && (
              <span className="text-[11px] font-medium bg-green-500/15 text-green-400 px-2 py-0.5 rounded-md">{selectedMarketData.leverage}</span>
            )}
            {selectedMarketData && (
              <div className="ml-auto text-right">
                {selectedMarketData.mark != null && (
                  <div className="text-xs font-medium tabular-nums text-gray-200">{selectedMarketData.mark.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                )}
                <div className={`text-xs font-medium tabular-nums ${(selectedMarketData.change24hPer ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {selectedMarketData.change24h != null ? `${(selectedMarketData.change24hPer ?? 0) >= 0 ? '+' : ''}${selectedMarketData.change24h.toFixed(2)}` : '—'} / {selectedMarketData.change24hPer != null ? `${(selectedMarketData.change24hPer ?? 0) >= 0 ? '+' : ''}${selectedMarketData.change24hPer.toFixed(2)}%` : '—'}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2 p-2 hover:bg-gray-800/40 rounded-lg transition-colors cursor-pointer"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>
        </div>

        {/* Expanded Mobile Details */}
        {isExpanded && selectedMarketData && (
          <div className="px-3 pb-3 space-y-3 border-t border-gray-800/15 pt-3">
            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-900/20 rounded-xl p-3 border border-gray-800/10">
              {selectedMarketData.mark != null && (
                <div>
                  <div className="text-[10px] text-gray-500 mb-0.5 font-medium">Mark</div>
                  <div className="text-[11px] font-semibold tabular-nums text-gray-200 font-mono">{selectedMarketData.mark.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
              )}
              {selectedMarketData.oracle != null && (
                <div>
                  <div className="text-[10px] text-gray-500 mb-0.5 font-medium">Oracle</div>
                  <div className="text-[11px] font-semibold tabular-nums text-gray-200 font-mono">{selectedMarketData.oracle.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
              )}
              {selectedMarketData.volume24h != null && (
                <div>
                  <div className="text-[10px] text-gray-500 mb-0.5 font-medium">24H Volume</div>
                  <div className="text-[11px] font-semibold tabular-nums text-gray-200 font-mono">${selectedMarketData.volume24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
              )}
              {selectedMarketData.openInterest != null && (
                <div>
                  <div className="text-[10px] text-gray-500 mb-0.5 font-medium">Open Interest</div>
                  <div className="text-[11px] font-semibold tabular-nums text-gray-200 font-mono">${selectedMarketData.openInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
              )}
              {selectedMarketData.fundingDisplay != null && (
                <div className="col-span-2">
                  <div className="text-[10px] text-gray-500 mb-0.5 font-medium">Funding / Countdown</div>
                  <div className="text-[11px] font-semibold tabular-nums text-green-400 font-mono">
                    {selectedMarketData.fundingDisplay} <span className="text-gray-300">{selectedMarketData.countdown || '—'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
