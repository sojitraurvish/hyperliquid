import { useEffect, useMemo, useRef, useState } from "react";
import { createChart, ColorType, CandlestickSeries, HistogramSeries, CandlestickData } from "lightweight-charts";
import { BarChart3, Maximize2 } from "lucide-react";
import { IntervalDropdown, IntervalSection } from "../../ui/dropdown/IntervalDropdown";
import { Subscription } from "@nktkas/hyperliquid";
import { infoClient, subscriptionClient } from "@/lib/config/hyperliquied/hyperliquid-client";
import { getCandleData, CandleInterval } from "@/lib/services/candle-chart";
import AppButton from "@/components/ui/button";
import { VARIANT_TYPES } from "@/lib/constants";

type TimePeriod = {
  title: string;
  value: string;
  timePeriod: number;
  isSelected: boolean;
};

// API Response type
type CandleApiData = {
  t: number; // start time (milliseconds)
  T: number; // end time (milliseconds)
  s: string; // symbol
  i: string; // interval
  o: string; // open price
  c: string; // close price
  h: string; // high price
  l: string; // low price
  v: string; // volume
  n: number; // number of trades
};

// Chart data format
type ChartCandleData = {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
};

type ChartVolumeData = {
  time: number;
  value: number;
  color: string;
};

// Transform API data to chart format
const transformCandleData = (apiData: CandleApiData[]): ChartCandleData[] => {
  return apiData.map((candle) => ({
    time: Math.floor(candle.t / 1000) as number, // Convert milliseconds to seconds
    open: parseFloat(candle.o),
    high: parseFloat(candle.h),
    low: parseFloat(candle.l),
    close: parseFloat(candle.c),
  }));
};

// Transform volume data
const transformVolumeData = (apiData: CandleApiData[]): ChartVolumeData[] => {
  return apiData.map((candle) => ({
    time: Math.floor(candle.t / 1000) as number,
    value: parseFloat(candle.v),
    color: parseFloat(candle.c) > parseFloat(candle.o) 
      ? "#2dd4bf80" // teal with opacity
      : "#ef444480", // red with opacity
  }));
};

export const TradingChart = ({ currency }: { currency: string }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const [chartHeight, setChartHeight] = useState(400);
  const isInitialLoadRef = useRef<boolean>(true);
  const previousDataLengthRef = useRef<number>(0);
  
  // State for candle data
  const [candleData, setCandleData] = useState<CandleApiData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  
  const [timePeriods, setTimePeriods] = useState<TimePeriod[]>([
    {
      title: "1d",
      value: "1d",
      timePeriod: 24 * 60 * 60 * 1000, // 1 day
      isSelected: true,
    },
    {
      title: "5d",
      value: "5d",
      timePeriod: 5 * 24 * 60 * 60 * 1000, // 5 days
      isSelected: false,
    },
    {
      title: "1m",
      value: "1m",
      timePeriod: 30 * 24 * 60 * 60 * 1000, // 1 month (30 days)
      isSelected: false,
    },
    {
      title: "3m",
      value: "3m",
      timePeriod: 90 * 24 * 60 * 60 * 1000, // 3 months (90 days)
      isSelected: false,
    },
    {
      title: "6m",
      value: "6m",
      timePeriod: 180 * 24 * 60 * 60 * 1000, // 6 months (180 days)
      isSelected: false,
    },
    {
      title: "1y",
      value: "1y",
      timePeriod: 365 * 24 * 60 * 60 * 1000, // 1 year (365 days)
      isSelected: false,
    },
    {
      title: "5y",
      value: "5y",
      timePeriod: 5 * 365 * 24 * 60 * 60 * 1000, // 5 years (1825 days)
      isSelected: false,
    },
  ]);

  // Handle time period selection
  const handleTimePeriodSelect = (value: string) => {
    setTimePeriods((prev) =>
      prev.map((period) => ({
        ...period,
        isSelected: period.value === value,
      }))
    );
  };

  const [interval, setInterval] = useState<IntervalSection[]>([
      {
      title:"minutes",
      value:[
        {
          title:"1 minute",
          value:"1m",
          isSelected: false,
          isFavorite: false,
        },
        {
          title:"3 minutes",
          value:"3m",
          isSelected: false,
          isFavorite: false,
        },
        {
          title:"5 minutes",
          value:"5m",
          isSelected: false,
          isFavorite: false,
        },
        {
          title:"15 minutes",
          value:"15m",
          isSelected: true,
          isFavorite: false,
        },
        {
          title:"30 minutes",
          value:"30m",
          isSelected: false,
          isFavorite: false,
        },
      ]
    },
    {
      title:"hours",
      value:[
        {
          title:"1 hour",
          value:"1h",
          isSelected: false,
          isFavorite: false,
        },
        {
          title:"2 hours",
          value:"2h",
          isSelected: false,
          isFavorite: true,
        },
        {
          title:"4 hours",
          value:"4h",
          isSelected: false,
          isFavorite: true,
        },
        {
          title:"8 hours",
          value:"8h",
          isSelected: false,
          isFavorite: true,
        },
        {
          title:"12 hours",
          value:"12h",
          isSelected: false,
          isFavorite: true,
        },
      ]
    },
    {
      title:"days",
      value:[
        {
          title:"1 day",
          value:"1d",
          isSelected: false,
          isFavorite: false,
        },
        {
          title:"3 days",
          value:"3d",
          isSelected: false,
          isFavorite: false,
          },
        {
          title:"1 week",
          value:"1w",
          isSelected: false,
          isFavorite: false,
        },
        {
          title:"1 month",
          value:"1M",
          isSelected: false,
          isFavorite: false,
        },
      ]
    }]);

    const selectedInterval = useMemo(() => interval.find((item) => item.value.find((item) => item.isSelected))?.value.filter((item) => item.isSelected)[0].value, [interval]);
    const selectedTimePeriodObj = timePeriods.find((item) => item.isSelected);
    
    // Fetch candle data from API
    useEffect(() => {
      if (selectedInterval && selectedTimePeriodObj && currency) {
        setIsLoading(true);
        isInitialLoadRef.current = true; // Mark as initial load when fetching new data
        const startTime = Date.now() - selectedTimePeriodObj.timePeriod;
        getCandleData({coin: currency, interval: selectedInterval as CandleInterval, startTime})
          .then((data: CandleApiData[]) => {
            console.log("brio data", data);
            setCandleData(data);
            previousDataLengthRef.current = data.length;
            setIsLoading(false);
          })
          .catch((error) => {
            console.error("Error fetching candle data:", error);
            setIsLoading(false);
          });
      }
    }, [selectedInterval, selectedTimePeriodObj, currency]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Project theme colors
    const colors = {
      background: "transparent",
      text: "#9ca3af", // gray-400
      grid: "#1f2937", // gray-800
      border: "#374151", // gray-700
      crosshair: "#2dd4bf", // teal-400
      upColor: "#2dd4bf", // teal-400
      downColor: "#ef4444", // red-500
      volumeBase: "#2dd4bf", // teal-400
    };

    // Get initial container dimensions
    const updateChartSize = () => {
      if (!chartContainerRef.current) return;
      const container = chartContainerRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      if (height > 0) {
        setChartHeight(height);
        if (chartRef.current) {
          chartRef.current.applyOptions({
            width,
            height,
          });
        }
      }
    };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: colors.background },
        textColor: colors.text,
      },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: colors.border,
      },
      rightPriceScale: {
        borderColor: colors.border,
      },
      crosshair: {
        vertLine: {
          color: colors.crosshair,
          width: 1,
          style: 2,
        },
        horzLine: {
          color: colors.crosshair,
          width: 1,
          style: 2,
        },
      },
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: colors.upColor,
      downColor: colors.downColor,
      borderVisible: false,
      wickUpColor: colors.upColor,
      wickDownColor: colors.downColor,
    });

    candlestickSeriesRef.current = candlestickSeries;

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: colors.volumeBase,
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "",
    });

    volumeSeriesRef.current = volumeSeries;

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.9,
        bottom: 0,
      },
    });

    // Use ResizeObserver to track container size changes
    const resizeObserver = new ResizeObserver(() => {
      updateChartSize();
    });

    resizeObserver.observe(chartContainerRef.current);

    // Also handle window resize for width changes
    const handleResize = () => {
      updateChartSize();
    };

    window.addEventListener("resize", handleResize);

    // Initial size update after a brief delay to ensure container has rendered
    setTimeout(updateChartSize, 0);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  // Update chart when candle data changes
  useEffect(() => {
    if (!candlestickSeriesRef.current || !volumeSeriesRef.current || candleData.length === 0) return;

    const chartCandleData = transformCandleData(candleData);
    const chartVolumeData = transformVolumeData(candleData);

    candlestickSeriesRef.current.setData(chartCandleData);
    volumeSeriesRef.current.setData(chartVolumeData);

    // Configure time scale based on interval
    if (chartRef.current && selectedInterval) {
      const timeScale = chartRef.current.timeScale();
      
      // Determine time format based on interval
      const isMinutes = selectedInterval.includes('m');

      timeScale.applyOptions({
        timeVisible: true,
        secondsVisible: isMinutes && selectedInterval === '1m',
        borderColor: "#374151",
      });

      // Only fit content on initial load or when data length changes significantly (new fetch)
      // Don't fit content on WebSocket updates to preserve user's zoom/pan position
      const isSignificantDataChange = Math.abs(candleData.length - previousDataLengthRef.current) > 1;
      
      if (isInitialLoadRef.current || isSignificantDataChange) {
        setTimeout(() => {
          timeScale.fitContent();
        }, 0);
        isInitialLoadRef.current = false;
        previousDataLengthRef.current = candleData.length;
      }
    }
  }, [candleData, selectedInterval]);


  // Get all favorite items
  const getFavoriteItems = () => {
    const favorites: Array<{ title: string; value: string; isSelected: boolean }> = [];
    interval.forEach((section) => {
      section.value.forEach((item) => {
        if (item.isFavorite) {
          favorites.push({
            title: item.title,
            value: item.value,
            isSelected: item.isSelected,
          });
        }
      });
    });
    return favorites;
  };

  // Get selected interval display text
  const getSelectedIntervalText = () => {
    for (const section of interval) {
      const selected = section.value.find((item) => item.isSelected);
      if (selected) {
        return selected.value;
      }
    }
    return "1h";
  };

  // Handle interval selection
  const handleIntervalSelect = (value: string) => {
    const updatedInterval = interval.map((section) => ({
      ...section,
      value: section.value.map((item) => ({
        ...item,
        isSelected: item.value === value,
      })),
    }));
    setInterval(updatedInterval);
  };

  // Handle favorite toggle
  const handleToggleFavorite = (sectionIndex: number, itemIndex: number) => {
    const updatedInterval = interval.map((section, sIdx) => ({
      ...section,
      value: section.value.map((item, iIdx) => {
        if (sIdx === sectionIndex && iIdx === itemIndex) {
          return { ...item, isFavorite: !item.isFavorite };
        }
        return item;
      }),
    }));
    setInterval(updatedInterval);
  };

  // Handle quick favorite button click
  const handleQuickFavoriteClick = (value: string) => {
    const updatedInterval = interval.map((section) => ({
      ...section,
      value: section.value.map((item) => ({
        ...item,
        isSelected: item.value === value,
      })),
    }));
    setInterval(updatedInterval);
  };


  const favoriteItems = getFavoriteItems();

  // Get latest OHLC values from candle data
  const latestCandle = useMemo(() => {
    if (candleData.length === 0) return null;
    const latest = candleData[candleData.length - 1];
    return {
      open: parseFloat(latest.o),
      high: parseFloat(latest.h),
      low: parseFloat(latest.l),
      close: parseFloat(latest.c),
      volume: parseFloat(latest.v),
    };
  }, [candleData]);

  // Calculate price change
  const priceChange = useMemo(() => {
    if (!latestCandle || candleData.length < 2) return null;
    const previousClose = parseFloat(candleData[candleData.length - 2].c);
    const change = latestCandle.close - previousClose;
    const changePercent = (change / previousClose) * 100;
    return { change, changePercent };
  }, [candleData, latestCandle]);

  // WebSocket subscription for real-time updates
  useEffect(() => {
    let subscription: Subscription | null = null;
    let isSubscribed = true;

    const setupWebSocket = async () => {
      if (selectedInterval && currency) {
        try {
          subscription = await subscriptionClient.candle(
            { coin: currency, interval: selectedInterval as CandleInterval },
            (data: CandleApiData) => {
              // Only update state if still subscribed to this market/interval
              if (!isSubscribed) return;
              
              console.log("WebSocket candle data", data);
              // Update candle data with new candle from websocket
              setCandleData((prev) => {
                const newData = [...prev];
                // Check if this candle already exists (same timestamp)
                const existingIndex = newData.findIndex((c) => c.t === data.t);
                if (existingIndex >= 0) {
                  // Update existing candle
                  newData[existingIndex] = data;
                } else {
                  // Add new candle (should be sorted by time)
                  newData.push(data);
                  newData.sort((a, b) => a.t - b.t);
                }
                return newData;
              });
            }
          );
        } catch (error) {
          console.error("Error setting up WebSocket:", error);
        }
      }
    };

    setupWebSocket();

    return () => {
      // Mark as unsubscribed to prevent state updates
      isSubscribed = false;
      // Unsubscribe from the old subscription
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.error("Error unsubscribing from candle WebSocket:", error);
        }
        subscription = null;
      }
    };
  }, [selectedInterval, currency]);

  return (
    <div className="flex-1 flex flex-col bg-gray-950 w-full">
      {/* Chart toolbar */}
      <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 border-b border-gray-800">
        <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* Favorite quick access buttons */}
          {favoriteItems.map((fav) => (
            <button
              key={fav.value}
              onClick={() => handleQuickFavoriteClick(fav.value)}
              className={`text-xs h-6 sm:h-7 px-1.5 sm:px-2 rounded transition-colors whitespace-nowrap ${
                fav.isSelected
                  ? "bg-teal-500/20 text-teal-400"
                  : "text-gray-400 hover:text-white hover:bg-gray-900/50"
              }`}
            >
              {fav.value}
            </button>
          ))}
          <div className="w-px h-4 bg-gray-800 mx-0.5 sm:mx-1" />
          <button className="text-xs h-6 sm:h-7 px-1.5 sm:px-2 text-gray-400 hover:text-white hover:bg-gray-900/50 rounded transition-colors flex items-center gap-1 whitespace-nowrap">
            <BarChart3 className="h-3 w-3" />
            <span className="hidden sm:inline">Indicators</span>
          </button>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* Interval Dropdown */}
          <IntervalDropdown
            sections={interval}
            selectedValue={getSelectedIntervalText()}
            onSelect={handleIntervalSelect}
            onToggleFavorite={handleToggleFavorite}
            maxHeight="max-h-96"
            showFavorites={true}
          />

          <button className="h-6 w-6 sm:h-7 sm:w-7 text-gray-400 hover:text-white hover:bg-gray-900/50 rounded transition-colors flex items-center justify-center">
            <Maximize2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </button>
        </div>
      </div>

      {/* OHLC info */}
      <div className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs flex items-center gap-1 flex-wrap">
        <span className="text-gray-400">{currency} · {getSelectedIntervalText()} · Hyperliquid</span>
        <span className="w-2 h-2 rounded-full bg-teal-400 ml-1 sm:ml-2" />
        {latestCandle ? (
          <>
            <span className="text-gray-400 ml-1 sm:ml-2">O</span>
            <span className="text-teal-400 tabular-nums">{latestCandle.open.toFixed(2)}</span>
            <span className="text-gray-400 ml-1 sm:ml-2">H</span>
            <span className="text-white tabular-nums">{latestCandle.high.toFixed(2)}</span>
            <span className="text-gray-400 ml-1 sm:ml-2">L</span>
            <span className="text-white tabular-nums">{latestCandle.low.toFixed(2)}</span>
            <span className="text-gray-400 ml-1 sm:ml-2">C</span>
            <span className={`tabular-nums ${latestCandle.close >= latestCandle.open ? 'text-teal-400' : 'text-red-500'}`}>
              {latestCandle.close.toFixed(2)}
            </span>
            {priceChange && (
              <span className={`ml-1 sm:ml-2 tabular-nums ${priceChange.change >= 0 ? 'text-teal-400' : 'text-red-500'}`}>
                {priceChange.change >= 0 ? '+' : ''}{priceChange.change.toFixed(4)} ({priceChange.changePercent >= 0 ? '+' : ''}{priceChange.changePercent.toFixed(2)}%)
              </span>
            )}
          </>
        ) : (
          <span className="text-gray-400 ml-1 sm:ml-2">Loading...</span>
        )}
      </div>

      {/* Chart */}
      <div ref={chartContainerRef} className="flex-1  w-full min-h-0" />

      {/* Volume label */}
      <div className="px-2 sm:px-3 py-1 text-xs text-gray-400 flex items-center gap-2">
        <span>Volume</span>
        <span className="text-teal-400 tabular-nums">
          {latestCandle ? latestCandle.volume.toFixed(2) : '0.00'}
        </span>
      </div>

      {/* Bottom time controls */}
      <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 border-t border-gray-800 text-xs">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {timePeriods.map((period) => (
            <AppButton
              key={period.value}
              variant={VARIANT_TYPES.QUATERNARY}
              onClick={() => handleTimePeriodSelect(period.value)}
              className={
                period.isSelected
                  ? "bg-teal-500/20 text-teal-400"
                  : ""
              }
            >
              {period.title}
            </AppButton>
          ))}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 text-gray-400 shrink-0">
          <span className="tabular-nums text-[10px] sm:text-xs">06:38:10 (UTC-5)</span>
          <span className="hidden sm:inline">%</span>
          <span className="hidden sm:inline">log</span>
          <span className="hidden sm:inline">auto</span>
        </div>
      </div>
    </div>
  );
};
 