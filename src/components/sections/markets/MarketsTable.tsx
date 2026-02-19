"use client";

import { useState, useEffect, useMemo } from 'react';
import { Search, Star, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { fetchPerpetualMarkets } from '@/lib/services/markets';
import { subscriptionClient } from '@/lib/config/hyperliquied/hyperliquid-client';
import { Subscription } from '@nktkas/hyperliquid';
import { LOCAL_STORAGE_KEYS, getLocalStorage, setLocalStorage } from '@/lib/sessions/localstorage';
import { useMarketStore } from '@/store/market';
import { useRouter } from 'next/router';
import AppButton from '@/components/ui/button';
import { VARIANT_TYPES } from '@/lib/constants';
import { getCoinIconUrl, ROUTES } from '@/lib/config';

type PerpetualMarket = {
  coin: string;
  symbol: string;
  leverage: string | null;
  lastPrice: number | null;
  change24h: number | null;
  change24hPer: number | null;
  volume: number | null;
  openInterest: number | null;
  isFavorite: boolean;
};

type FilterType = 'All' | 'Favorites' | 'Top Gainers' | 'Top Losers';

// Helper function to get coin initials for fallback
const getCoinInitials = (coin: string): string => {
  return coin.substring(0, 2).toUpperCase();
};

// Format number with commas and decimals
const formatNumber = (num: number | null, decimals: number = 2): string => {
  if (num === null || isNaN(num)) return '—';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

// Format large numbers (B for billions, M for millions)
const formatLargeNumber = (num: number | null): string => {
  if (num === null || isNaN(num)) return '—';
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  return `$${formatNumber(num, 0)}`;
};

export const MarketsTable = () => {
  const router = useRouter();
  const setSelectedMarket = useMarketStore().setSelectedMarket;
  const [markets, setMarkets] = useState<Map<string, PerpetualMarket>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [isLoading, setIsLoading] = useState(true);

  // Convert Map to Array for operations
  const marketsArray = useMemo(() => Array.from(markets.values()), [markets]);

  // Load favorites from localStorage
  useEffect(() => {
    const favoriteData = getLocalStorage(LOCAL_STORAGE_KEYS.FAVORITE_MARKETS);
    const savedFavorites = favoriteData?.symbols ?? [];
    if (savedFavorites.length > 0 && marketsArray.length > 0) {
      setMarkets(prevMarkets => {
        const updated = new Map(prevMarkets);
        savedFavorites.forEach(symbol => {
          const market = updated.get(symbol);
          if (market) {
            updated.set(symbol, { ...market, isFavorite: true });
          }
        });
        return updated;
      });
    }
  }, [marketsArray.length]);

  // Fetch initial markets data
  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        setIsLoading(true);
        const resp = await fetchPerpetualMarkets();
        const universe = resp.meta?.universe || [];
        const assetCtxs = resp.assetCtxs || [];

        const marketsMap = new Map<string, PerpetualMarket>();
        universe.forEach((u, index) => {
          const coin = u.name;
          const ctx = assetCtxs[index];

          if (!ctx) {
            const market: PerpetualMarket = {
              coin,
              symbol: `${coin}-USDC`,
              leverage: u.maxLeverage ? `${u.maxLeverage}x` : null,
              lastPrice: null,
              change24h: null,
              change24hPer: null,
              volume: null,
              openInterest: null,
              isFavorite: false,
            };
            marketsMap.set(market.symbol, market);
            return;
          }

          const last = ctx.markPx ?? ctx.midPx ?? null;
          const prevDay = ctx.prevDayPx ?? null;

          const lastPrice = last != null ? Number(last) : null;
          const prevPrice = prevDay != null ? Number(prevDay) : null;

          const change24 = lastPrice != null && prevPrice != null ? lastPrice - prevPrice : null;
          const changePct = change24 != null && prevPrice != null && prevPrice !== 0
            ? (change24 / prevPrice) * 100
            : null;

          const volume = ctx.dayNtlVlm != null ? Number(ctx.dayNtlVlm) : null;
          const openInterestSize = ctx.openInterest != null ? Number(ctx.openInterest) : null;
          const openInterestUsd = (openInterestSize != null && lastPrice != null)
            ? openInterestSize * lastPrice
            : null;

          const market: PerpetualMarket = {
            coin,
            symbol: `${coin}-USDC`,
            leverage: u.maxLeverage ? `${u.maxLeverage}x` : null,
            lastPrice,
            change24h: change24,
            change24hPer: changePct,
            volume,
            openInterest: openInterestUsd,
            isFavorite: false,
          };
          marketsMap.set(market.symbol, market);
        });

        // Restore favorites
        const favoriteData = getLocalStorage(LOCAL_STORAGE_KEYS.FAVORITE_MARKETS);
        const savedFavorites = favoriteData?.symbols ?? [];
        savedFavorites.forEach(symbol => {
          const market = marketsMap.get(symbol);
          if (market) {
            marketsMap.set(symbol, { ...market, isFavorite: true });
          }
        });

        setMarkets(marketsMap);
      } catch (error) {
        console.error('Error fetching markets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarkets();
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    let subscription: Subscription | null = null;

    const start = async () => {
      try {
        subscription = await subscriptionClient.webData2(
          { user: '0x0000000000000000000000000000000000000000' },
          (resp) => {
            const universe = resp.meta?.universe || [];
            const assetCtxs = resp.assetCtxs || [];

            setMarkets(prevMarkets => {
              const updated = new Map(prevMarkets);

              universe.forEach((u, index) => {
                const coin = u.name;
                const symbol = `${coin}-USDC`;
                const ctx = assetCtxs[index];
                const existingMarket = updated.get(symbol);

                if (!ctx) return;

                const last = ctx.markPx ?? ctx.midPx ?? null;
                const prevDay = ctx.prevDayPx ?? null;

                const lastPrice = last != null ? Number(last) : null;
                const prevPrice = prevDay != null ? Number(prevDay) : null;

                const change24 = lastPrice != null && prevPrice != null ? lastPrice - prevPrice : null;
                const changePct = change24 != null && prevPrice != null && prevPrice !== 0
                  ? (change24 / prevPrice) * 100
                  : null;

                const volume = ctx.dayNtlVlm != null ? Number(ctx.dayNtlVlm) : null;
                const openInterestSize = ctx.openInterest != null ? Number(ctx.openInterest) : null;
                const openInterestUsd = (openInterestSize != null && lastPrice != null)
                  ? openInterestSize * lastPrice
                  : null;

                updated.set(symbol, {
                  coin,
                  symbol,
                  leverage: u.maxLeverage ? `${u.maxLeverage}x` : null,
                  lastPrice,
                  change24h: change24,
                  change24hPer: changePct,
                  volume,
                  openInterest: openInterestUsd,
                  isFavorite: existingMarket?.isFavorite ?? false,
                });
              });

              return updated;
            });
          }
        );
      } catch (error) {
        console.error('Subscription error:', error);
      }
    };

    start();

    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing:', error);
        }
      }
    };
  }, []);

  // Toggle favorite
  const toggleFavorite = (symbol: string) => {
    setMarkets(prevMarkets => {
      const updated = new Map(prevMarkets);
      const market = updated.get(symbol);
      if (market) {
        const newMarket = { ...market, isFavorite: !market.isFavorite };
        updated.set(symbol, newMarket);

        // Update localStorage
        const favoriteData = getLocalStorage(LOCAL_STORAGE_KEYS.FAVORITE_MARKETS);
        const currentFavorites = favoriteData?.symbols ?? [];
        let newFavorites: string[];

        if (newMarket.isFavorite) {
          newFavorites = [...currentFavorites, symbol];
        } else {
          newFavorites = currentFavorites.filter(s => s !== symbol);
        }

        setLocalStorage(LOCAL_STORAGE_KEYS.FAVORITE_MARKETS, { symbols: newFavorites });
      }
      return updated;
    });
  };

  // Handle trade navigation
  const handleTrade = (market: PerpetualMarket) => {
    const leverage = market.leverage ? parseInt(market.leverage.replace('x', '')) : 1;
    const marketCoin = market.coin.toUpperCase();
    setSelectedMarket({ coin: market.coin, leverage }, false); // Don't update URL here, navigation will handle it
    router.push(`${ROUTES.TRADE}/${marketCoin}`);
  };

  // Filter and search markets
  const filteredMarkets = useMemo(() => {
    let filtered = marketsArray;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(market =>
        market.coin.toLowerCase().includes(query) ||
        market.symbol.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    switch (activeFilter) {
      case 'Favorites':
        filtered = filtered.filter(m => m.isFavorite);
        break;
      case 'Top Gainers':
        filtered = filtered
          .filter(m => m.change24hPer !== null && m.change24hPer > 0)
          .sort((a, b) => (b.change24hPer ?? 0) - (a.change24hPer ?? 0));
        break;
      case 'Top Losers':
        filtered = filtered
          .filter(m => m.change24hPer !== null && m.change24hPer < 0)
          .sort((a, b) => (a.change24hPer ?? 0) - (b.change24hPer ?? 0));
        break;
      default:
        break;
    }

    return filtered;
  }, [marketsArray, searchQuery, activeFilter]);

  const filterTabs: FilterType[] = ['All', 'Favorites', 'Top Gainers', 'Top Losers'];

  return (
    <div className="w-full bg-gray-950 py-8 sm:py-12 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-green-500/3 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 tracking-tight">Available Markets</h2>
        
        {/* Search and Filter Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          {/* Search Bar */}
          <div className="relative w-full sm:w-auto sm:flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-900/60 backdrop-blur-sm border border-gray-800/60 rounded-xl text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500/30 transition-all"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {filterTabs.map((filter) => (
              <AppButton
                key={filter}
                variant={VARIANT_TYPES.NOT_SELECTED}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-all ${
                  activeFilter === filter
                    ? 'bg-green-500/15 text-green-400 border border-green-500/25'
                    : 'bg-transparent text-gray-400 hover:text-white hover:bg-gray-800/50 border border-transparent'
                }`}
              >
                {filter}
              </AppButton>
            ))}
          </div>
        </div>

        {/* Mobile Card Layout */}
        <div className="sm:hidden space-y-2">
          {isLoading ? (
            <div className="py-12 text-center text-gray-400 text-sm">Loading markets...</div>
          ) : filteredMarkets.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">No markets found</div>
          ) : (
            filteredMarkets.map((market) => {
              const isPositive = (market.change24hPer ?? 0) >= 0;
              return (
                <div
                  key={market.symbol}
                  className="bg-gray-900/50 border border-gray-800/40 rounded-xl overflow-hidden active:bg-gray-800/40 transition-colors px-3.5 py-3"
                >
                  {/* Top row: Coin info + Price */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => toggleFavorite(market.symbol)}
                        className="p-1 -ml-1 text-gray-600 hover:text-yellow-400 transition-colors shrink-0"
                      >
                        <Star className={`h-3.5 w-3.5 ${market.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      </button>
                      <div className="w-8 h-8 rounded-lg bg-gray-800/80 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {getCoinInitials(market.coin)}
                      </div>
                      <div>
                        <div className="text-white text-sm font-semibold leading-tight">{market.coin}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-gray-500">Perp</span>
                          {market.leverage && (
                            <span className="text-[9px] font-semibold text-green-400/80 bg-green-500/10 px-1 py-px rounded">{market.leverage}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white text-sm font-mono font-semibold">
                        {market.lastPrice !== null ? `$${formatNumber(market.lastPrice, 2)}` : '—'}
                      </div>
                      {market.change24hPer !== null ? (
                        <div className={`flex items-center justify-end gap-0.5 text-[11px] font-medium mt-0.5 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                          {isPositive ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
                          {isPositive ? '+' : ''}{market.change24hPer.toFixed(2)}%
                        </div>
                      ) : (
                        <div className="text-[11px] text-gray-500 mt-0.5">0.00%</div>
                      )}
                    </div>
                  </div>
                  {/* Bottom row: Volume + Trade */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-800/30">
                    <div className="flex items-center gap-4 text-[11px]">
                      <div>
                        <span className="text-gray-500">Vol </span>
                        <span className="text-gray-300 font-mono">{formatLargeNumber(market.volume)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">OI </span>
                        <span className="text-gray-300 font-mono">{formatLargeNumber(market.openInterest)}</span>
                      </div>
                    </div>
                    <AppButton
                      variant={VARIANT_TYPES.NOT_SELECTED}
                      onClick={() => handleTrade(market)}
                      className="bg-green-500/10 hover:bg-green-500/20 text-green-400 px-4 py-1.5 text-xs font-semibold rounded-lg border border-green-500/20 shrink-0"
                    >
                      Trade
                    </AppButton>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden sm:block bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-gray-800/50 overflow-hidden">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full">
              <thead className="bg-gray-900/60 border-b border-gray-800/50">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Market
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    24h Change
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    24h Volume
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Open Interest
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Max Leverage
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      Loading markets...
                    </td>
                  </tr>
                ) : filteredMarkets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      No markets found
                    </td>
                  </tr>
                ) : (
                  filteredMarkets.map((market) => {
                    const isPositive = (market.change24hPer ?? 0) >= 0;
                    const changeIcon = isPositive ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    );

                    return (
                      <tr
                        key={market.symbol}
                        className="hover:bg-gray-800/30 transition-colors group"
                      >
                        {/* Market */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleFavorite(market.symbol)}
                              className="p-1.5 -ml-1.5 text-gray-600 hover:text-yellow-400 transition-colors shrink-0 rounded-lg"
                            >
                              <Star
                                className={`h-4 w-4 ${market.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`}
                              />
                            </button>
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-gray-800/80 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                                {getCoinInitials(market.coin)}
                              </div>
                              <div className="min-w-0">
                                <div className="text-white font-medium text-base truncate">{market.symbol}</div>
                                <div className="text-xs text-gray-500 truncate">{market.coin}</div>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="px-5 py-4 text-right">
                          <div className="text-white font-medium text-base font-mono">
                            {market.lastPrice !== null ? `$${formatNumber(market.lastPrice, 2)}` : '—'}
                          </div>
                        </td>

                        {/* 24h Change */}
                        <td className="px-5 py-4 text-right">
                          {market.change24hPer !== null ? (
                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-sm font-medium ${
                              isPositive ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'
                            }`}>
                              {changeIcon}
                              <span>
                                {isPositive ? '+' : ''}{market.change24hPer.toFixed(2)}%
                              </span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 text-gray-500 text-sm">
                              <Minus className="h-3 w-3" />
                              <span>0.00%</span>
                            </div>
                          )}
                        </td>

                        {/* 24h Volume */}
                        <td className="px-5 py-4 text-right hidden md:table-cell">
                          <div className="text-gray-300 text-base font-mono">
                            {formatLargeNumber(market.volume)}
                          </div>
                        </td>

                        {/* Open Interest */}
                        <td className="px-5 py-4 text-right hidden lg:table-cell">
                          <div className="text-gray-300 text-base font-mono">
                            {formatLargeNumber(market.openInterest)}
                          </div>
                        </td>

                        {/* Max Leverage */}
                        <td className="px-5 py-4 text-right hidden lg:table-cell">
                          {market.leverage ? (
                            <span className="inline-block px-2.5 py-1 bg-green-500/10 text-green-400 text-xs font-semibold rounded-lg border border-green-500/20">
                              {market.leverage}
                            </span>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="px-5 py-4 text-right">
                          <AppButton
                            variant={VARIANT_TYPES.NOT_SELECTED}
                            onClick={() => handleTrade(market)}
                            className="bg-green-500/10 hover:bg-green-500/20 text-green-400 hover:text-green-300 px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap border border-green-500/20 hover:border-green-500/30"
                          >
                            Trade
                          </AppButton>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

