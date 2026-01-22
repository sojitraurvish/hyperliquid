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
    <div className="w-full bg-gray-950 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search and Filter Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          {/* Search Bar */}
          <div className="relative w-full sm:w-auto sm:flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Q Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            {filterTabs.map((filter) => (
              <AppButton
                key={filter}
                variant={VARIANT_TYPES.NOT_SELECTED}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeFilter === filter
                    ? 'bg-gray-800 text-white'
                    : 'bg-transparent text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                {filter}
              </AppButton>
            ))}
          </div>
        </div>

        {/* Markets Table */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-900 border-b border-gray-800">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Market
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    24h Change
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">
                    24h Volume
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                    Open Interest
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Max Leverage
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
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
                        className="hover:bg-gray-800/50 transition-colors"
                      >
                        {/* Market */}
                        <td className="px-3 sm:px-4 py-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <button
                              onClick={() => toggleFavorite(market.symbol)}
                              className="text-gray-400 hover:text-yellow-400 transition-colors flex-shrink-0"
                            >
                              <Star
                                className={`h-4 w-4 ${market.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`}
                              />
                            </button>
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
                                {getCoinInitials(market.coin)}
                              </div>
                              <div className="min-w-0">
                                <div className="text-white font-medium text-sm sm:text-base truncate">{market.symbol}</div>
                                <div className="text-xs text-gray-400 truncate">{market.coin}</div>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="px-3 sm:px-4 py-4 text-right">
                          <div className="text-white font-medium text-sm sm:text-base">
                            {market.lastPrice !== null ? `$${formatNumber(market.lastPrice, 2)}` : '—'}
                          </div>
                        </td>

                        {/* 24h Change */}
                        <td className="px-3 sm:px-4 py-4 text-right">
                          {market.change24hPer !== null ? (
                            <div className={`flex items-center justify-end gap-1 ${
                              isPositive ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {changeIcon}
                              <span className="font-medium text-sm sm:text-base">
                                {isPositive ? '+' : ''}{market.change24hPer.toFixed(2)}%
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1 text-gray-400">
                              <Minus className="h-3 w-3" />
                              <span className="text-sm sm:text-base">0.00%</span>
                            </div>
                          )}
                        </td>

                        {/* 24h Volume */}
                        <td className="px-3 sm:px-4 py-4 text-right hidden md:table-cell">
                          <div className="text-gray-300 text-sm sm:text-base">
                            {formatLargeNumber(market.volume)}
                          </div>
                        </td>

                        {/* Open Interest */}
                        <td className="px-3 sm:px-4 py-4 text-right hidden lg:table-cell">
                          <div className="text-gray-300 text-sm sm:text-base">
                            {formatLargeNumber(market.openInterest)}
                          </div>
                        </td>

                        {/* Max Leverage */}
                        <td className="px-3 sm:px-4 py-4 text-right">
                          {market.leverage ? (
                            <span className="inline-block px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded">
                              {market.leverage}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="px-3 sm:px-4 py-4 text-right">
                          <AppButton
                            variant={VARIANT_TYPES.NOT_SELECTED}
                            onClick={() => handleTrade(market)}
                            className="bg-transparent hover:bg-gray-800 text-white px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded transition-colors whitespace-nowrap"
                          >
                            Trade →
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

