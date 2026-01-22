import { useEffect, useMemo, useRef, useState } from "react";
import { createChart, ColorType, CandlestickSeries, HistogramSeries, CandlestickData, CrosshairMode, IChartApi, ISeriesApi, SeriesMarker, Time, createSeriesMarkers, ISeriesMarkersPluginApi, IPriceLine } from "lightweight-charts";
import { BarChart3, Maximize2 } from "lucide-react";
import { IntervalDropdown, IntervalSection } from "../../ui/dropdown/IntervalDropdown";
import { Subscription } from "@nktkas/hyperliquid";
import { infoClient, subscriptionClient } from "@/lib/config/hyperliquied/hyperliquid-client";
import { getCandleData, CandleInterval } from "@/lib/services/candle-chart";
import AppButton from "@/components/ui/button";
import { VARIANT_TYPES } from "@/lib/constants";
import { LOCAL_STORAGE_KEYS, getLocalStorage, setLocalStorage } from "@/lib/sessions/localstorage";
import { useAccount } from "wagmi";
import { info } from "node:console";
import { useBottomPanelStore } from "@/store/bottom-panel";
import { errorHandler } from "@/store/errorHandler";

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
  time: Time; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
};

type ChartVolumeData = {
  time: Time;
  value: number;
  color: string;
};

// Fill data type
type FillData = {
  coin: string;
  px: string;
  sz: string;
  side: "A" | "B"; // A = Ask (Sell), B = Bid (Buy)
  time: number; // milliseconds
  startPosition: string;
  dir: string;
  closedPnl: string;
  hash: string;
  oid: number;
  crossed: boolean;
  fee: string;
  tid: number;
  feeToken: string;
  twapId: string | null;
  liquidation?: {
    liquidatedUser: string;
    markPx: string;
    method: string;
  };
  builderFee?: string;
};

// Transform API data to chart format
const transformCandleData = (apiData: CandleApiData[]): ChartCandleData[] => {
  return apiData.map((candle) => ({
    time: Math.floor(candle.t / 1000) as Time, // Convert milliseconds to seconds
    open: parseFloat(candle.o),
    high: parseFloat(candle.h),
    low: parseFloat(candle.l),
    close: parseFloat(candle.c),
  }));
};

// Transform volume data
const transformVolumeData = (apiData: CandleApiData[]): ChartVolumeData[] => {
  return apiData.map((candle) => ({
    time: Math.floor(candle.t / 1000) as Time,
    value: parseFloat(candle.v),
    color: parseFloat(candle.c) > parseFloat(candle.o) 
      ? "#22c55e80" // green with opacity
      : "#ef444480", // red with opacity
  }));
};

// Convert interval string to milliseconds
const intervalToMilliseconds = (interval: string): number => {
  const unit = interval.slice(-1);
  const value = parseInt(interval.slice(0, -1));
  
  switch (unit) {
    case 'm': // minutes
      return value * 60 * 1000;
    case 'h': // hours
      return value * 60 * 60 * 1000;
    case 'd': // days
      return value * 24 * 60 * 60 * 1000;
    case 'w': // weeks
      return value * 7 * 24 * 60 * 60 * 1000;
    case 'M': // months (approximate as 30 days)
      return value * 30 * 24 * 60 * 60 * 1000;
    default:
      return 15 * 60 * 1000; // default to 15 minutes
  }
};

// Convert timestamp to candle time based on interval
const getCandleTime = (timestamp: number, interval: string): number => {
  const intervalMs = intervalToMilliseconds(interval);
  const candleStartTime = Math.floor(timestamp / intervalMs) * intervalMs;
  return Math.floor(candleStartTime / 1000); // Convert to seconds
};

// Create markers from fills data
const createMarkersFromFills = (
  fills: FillData[],
  interval: string,
  selectedTimePeriod: TimePeriod | undefined
): SeriesMarker<Time>[] => {
  if (!interval || !selectedTimePeriod || fills.length === 0) return [];

  const markers: SeriesMarker<Time>[] = [];
  
  // Get the time range based on selected time period
  const now = Date.now();
  const startTime = now - selectedTimePeriod.timePeriod;
  const endTime = now;

  // Filter fills within the time period and sort by timestamp to preserve chronological order
  const filteredFills = fills
    .filter((fill) => fill.time >= startTime && fill.time <= endTime)
    .sort((a, b) => a.time - b.time); // Sort by timestamp to preserve chronological order

  // Group fills by candle time while preserving order within each candle
  const fillsByCandleTime = new Map<number, FillData[]>();
  
  // Calculate the valid candle time range (in seconds)
  // Use the same logic as getCandleTime to ensure consistency
  const intervalMs = intervalToMilliseconds(interval);
  const startCandleTime = Math.floor(Math.floor(startTime / intervalMs) * intervalMs / 1000);
  const endCandleTime = Math.floor(Math.floor(endTime / intervalMs) * intervalMs / 1000);

  filteredFills.forEach((fill) => {
    // Double-check the fill is within the time period (safety check)
    if (fill.time < startTime || fill.time > endTime) {
      return; // Skip fills outside the time period
    }
    
    // Convert fill time to candle time based on interval
    const candleTime = getCandleTime(fill.time, interval);
    
    // Validate that the candle time is within the valid range
    // Allow fills at the boundary (>= start, <= end)
    if (candleTime < startCandleTime || candleTime > endCandleTime) {
      return; // Skip fills whose candle time is outside the period
    }
    
    if (!fillsByCandleTime.has(candleTime)) {
      fillsByCandleTime.set(candleTime, []);
    }
    
    fillsByCandleTime.get(candleTime)!.push(fill);
  });

  // Create markers in chronological order for each candle
  let markerId = 0;
  fillsByCandleTime.forEach((candleFills, candleTime) => {
    // Create markers in the order they occurred (chronological order)
    candleFills.forEach((fill) => {
      markers.push({
        time: candleTime as Time,
        position: "aboveBar",
        color: fill.side === "B" ? "#22c55e" : "#ef4444", // green for buy, red for sell
        shape: "circle",
        text: fill.side === "B" ? "B" : "S",
        size: 1.5, // Larger size to ensure text is visible inside circles
        id: `${fill.side === "B" ? "buy" : "sell"}-${candleTime}-${markerId++}`, // Unique ID for each marker
      });
    });
  });

  return markers;
};

export const TradingChart = ({ currency }: { currency: string }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const markersPluginRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const entryPriceLineRef = useRef<IPriceLine | null>(null);
  const liquidationPriceLineRef = useRef<IPriceLine | null>(null);
  const [entryPriceY, setEntryPriceY] = useState<number | null>(null);
  const [chartHeight, setChartHeight] = useState(400);
  const isInitialLoadRef = useRef<boolean>(true);
  const previousDataLengthRef = useRef<number>(0);
  
  // State for candle data
  const [candleData, setCandleData] = useState<CandleApiData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredCandle, setHoveredCandle] = useState<{ time: number; open: number; high: number; low: number; close: number } | null>(null);
  const [fillsData, setFillsData] = useState<FillData[]>([]);
  const [currentCurrency, setCurrentCurrency] = useState<string | null>(null);

  
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

  // Helper function to create initial interval state with a selected value and favorites
  const createIntervalState = (selectedValue: string = "15m", favoriteValues: string[] = []): IntervalSection[] => {
    const defaultInterval: IntervalSection[] = [
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
            isSelected: false,
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
      }
    ];

    // Set the selected value and favorites
    // favoriteValues can be:
    // - undefined/null: use default favorites (first time, never saved)
    // - []: empty array means user cleared all favorites
    // - ['2h', '4h']: use saved favorites
    const useSavedFavorites = favoriteValues !== undefined && favoriteValues !== null;
    return defaultInterval.map((section) => ({
      ...section,
      value: section.value.map((item) => ({
        ...item,
        isSelected: item.value === selectedValue,
        isFavorite: useSavedFavorites 
          ? favoriteValues.includes(item.value)
          : item.isFavorite, // Use default favorites if not saved yet
      })),
    }));
  };

  // Helper function to extract favorite values from interval state
  const extractFavoriteValues = (intervalState: IntervalSection[]): string[] => {
    const favorites: string[] = [];
    intervalState.forEach((section) => {
      section.value.forEach((item) => {
        if (item.isFavorite) {
          favorites.push(item.value);
        }
      });
    });
    return favorites;
  };

  // Helper function to save favorites to localStorage
  const saveFavoritesToStorage = (intervalState: IntervalSection[]) => {
    const favoriteValues = extractFavoriteValues(intervalState);
    setLocalStorage(LOCAL_STORAGE_KEYS.FAVORITE_INTERVALS, favoriteValues);
  };

  // Initialize interval state with default value to avoid hydration mismatch
  // Load from localStorage after mount (client-side only)
  const [interval, setInterval] = useState<IntervalSection[]>(() => {
    // Always use default on initial render to match server and client
    return createIntervalState("15m");
  });

  // Load interval and favorites from localStorage after mount (client-side only)
  useEffect(() => {
    const savedInterval = getLocalStorage(LOCAL_STORAGE_KEYS.SELECTED_INTERVAL);
    const savedFavorites = getLocalStorage(LOCAL_STORAGE_KEYS.FAVORITE_INTERVALS);
    
    // Pass savedFavorites as-is (could be null, [], or array of values)
    // createIntervalState will handle null by using defaults
    setInterval(createIntervalState(savedInterval || "15m", savedFavorites ?? undefined));
  }, []);

    const selectedInterval = useMemo(() => interval.find((item) => item.value.find((item) => item.isSelected))?.value.filter((item) => item.isSelected)[0].value, [interval]);
    const selectedTimePeriodObj = useMemo(() => timePeriods.find((item) => item.isSelected), [timePeriods]);
    
    // Clear hovered candle when currency changes
    useEffect(() => {
      setHoveredCandle(null);
    }, [currency]);

    // Fetch candle data from API
    useEffect(() => {
      if (selectedInterval && selectedTimePeriodObj && currency) {
        // Clear old data immediately when currency/interval/timePeriod changes
        // This prevents showing wrong data while new data is being fetched
        setCandleData([]);
        setHoveredCandle(null);
        setIsLoading(true);
        isInitialLoadRef.current = true; // Mark as initial load when fetching new data
        
        const currentFetchCurrency = currency; // Capture currency for this fetch
        const startTime = Date.now() - selectedTimePeriodObj.timePeriod;
        
        getCandleData({coin: currency, interval: selectedInterval as CandleInterval, startTime})
          .then((data: CandleApiData[]) => {
            // Only update if this fetch is still for the current currency
            // This prevents race conditions where multiple fetches are in flight
            if (currentFetchCurrency === currency) {
              console.log("brio data", data);
              setCandleData(data);
              setCurrentCurrency(currency);
              previousDataLengthRef.current = data.length;
              setIsLoading(false);
            }
          })
          .catch((error) => {
            // Only update state if this fetch is still for the current currency
            if (currentFetchCurrency === currency) {
              console.error("Error fetching candle data:", error);
              setIsLoading(false);
              setCurrentCurrency(null);
              errorHandler(error, "Failed to load chart data");
            }
          });
      } else {
        // Clear data if currency/interval/timePeriod is not available
        setCandleData([]);
        setCurrentCurrency(null);
        setIsLoading(false);
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
      crosshair: "#22c55e", // green-400
      upColor: "#22c55e", // green-400
      downColor: "#ef4444", // red-500
      volumeBase: "#22c55e", // green-400
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
        mode: CrosshairMode.Normal, // Free movement instead of snapping to candles
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

  // Subscribe to crosshair move events to track hovered candle
  useEffect(() => {
    if (!chartRef.current || !candlestickSeriesRef.current || candleData.length === 0) return;

    const chart = chartRef.current;
    const candlestickSeries = candlestickSeriesRef.current;

    const crosshairMoveHandler = (param: any) => {
      if (param.time && param.seriesData && param.seriesData.size > 0) {
        // Get the candlestick data at the crosshair time
        const candlestickData = param.seriesData.get(candlestickSeries);
        if (candlestickData && candlestickData.time) {
          // Use the data directly from the series
          const timeValue = typeof candlestickData.time === 'number' 
            ? candlestickData.time 
            : (candlestickData.time as any).timestamp || Date.now() / 1000;
          setHoveredCandle({
            time: timeValue,
            open: candlestickData.open as number,
            high: candlestickData.high as number,
            low: candlestickData.low as number,
            close: candlestickData.close as number,
          });
        }
      } else {
        // Crosshair moved out of chart area or no data
        setHoveredCandle(null);
      }
    };

    chart.subscribeCrosshairMove(crosshairMoveHandler);

    return () => {
      chart.unsubscribeCrosshairMove(crosshairMoveHandler);
    };
  }, [candleData]);

  const { address: userAddress } = useAccount();
  
  // Clear fills data and markers immediately when time period changes (before fetching new data)
  useEffect(() => {
    // Clear fills data - this will trigger markers to update to empty array
    setFillsData([]);
    
    // AGGRESSIVELY clear markers plugin immediately when time period changes
    if (markersPluginRef.current) {
      const plugin = markersPluginRef.current as any;
      try {
        // Try setMarkers with empty array first (fastest way to clear)
        if (typeof plugin.setMarkers === 'function') {
          plugin.setMarkers([]);
        }
        // Then detach to fully remove
        if (typeof plugin.detach === 'function') {
          plugin.detach();
        } else if (typeof plugin.remove === 'function') {
          plugin.remove();
        }
      } catch (e) {
        // Ignore errors
      }
      markersPluginRef.current = null;
    }
    
    // Force create empty markers plugin to ensure chart is cleared
    if (candlestickSeriesRef.current) {
      try {
        markersPluginRef.current = createSeriesMarkers(candlestickSeriesRef.current, []);
      } catch (e) {
        // Ignore errors
      }
    }
  }, [selectedTimePeriodObj]);
  
  // Fetch fills data based on selected time period
  useEffect(() => {
    const getFills = async () => {
      if (!userAddress || !selectedTimePeriodObj) {
        // Clear fills data if no user or time period selected
        setFillsData([]);
        return;
      }
      
      try {
        const now = Date.now();
        const startTime = now - selectedTimePeriodObj.timePeriod;
        const endTime = now;
        
        // Use userFillsByTime to fetch only fills within the selected time period
        const fills = await infoClient.userFillsByTime({ 
          user: userAddress as `0x${string}`, 
          startTime,
          endTime,
          aggregateByTime: true,
        });

        // subscriptionClient.userFills({ user: userAddress }, (fills) => {
        //     console.log("orders fills",fills);
        //       }); 
        
        console.log("fills", fills);
        // Additional client-side filtering to ensure strict time boundaries
        // This is a safety net in case the API returns data slightly outside the range
        const filteredFills = (fills as FillData[]).filter(
          (fill) => fill.time >= startTime && fill.time <= endTime
        );
        
        setFillsData(filteredFills);
      } catch (error) {
        console.error("Error fetching fills:", error);
        setFillsData([]);
        errorHandler(error, "Failed to load trade history");
      }
    };
    getFills();
  }, [userAddress, selectedTimePeriodObj]);

  // Filter fills by currency
  const filteredFills = useMemo(() => {
    if (!currency) return [];
    return fillsData.filter((fill) => fill.coin === currency);
  }, [fillsData, currency]);

  // Create markers from filtered fills
  // Create markers for ALL fills within the time period - lightweight-charts will handle visibility
  const markers = useMemo(() => {
    return createMarkersFromFills(
      filteredFills,
      selectedInterval || "15m",
      selectedTimePeriodObj
    );
  }, [filteredFills, selectedInterval, selectedTimePeriodObj]);

  // Update chart when candle data changes
  useEffect(() => {
    if (!candlestickSeriesRef.current || !volumeSeriesRef.current) return;
    
    // Only show data if it matches the current currency
    // This prevents showing stale data from a previous currency
    if (candleData.length === 0 || currentCurrency !== currency) {
      // Clear chart data if no data or currency mismatch
      candlestickSeriesRef.current.setData([]);
      volumeSeriesRef.current.setData([]);
      return;
    }

    const chartCandleData = transformCandleData(candleData);
    const chartVolumeData = transformVolumeData(candleData);

    candlestickSeriesRef.current.setData(chartCandleData);
    volumeSeriesRef.current.setData(chartVolumeData);

    // Don't recreate markers here - let the markers useEffect handle it
    // This prevents conflicts and ensures markers are properly managed

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
  }, [candleData, selectedInterval, currency, currentCurrency]);

  // Update markers - SINGLE source of truth for marker updates
  // This effect handles ALL marker updates to prevent conflicts
  useEffect(() => {
    if (!candlestickSeriesRef.current) return;
    
    // If plugin exists, try to update markers using setMarkers (preferred method)
    if (markersPluginRef.current) {
      const plugin = markersPluginRef.current as any;
      if (typeof plugin.setMarkers === 'function') {
        // Use setMarkers to update - this is the proper way and clears old markers
        try {
          plugin.setMarkers(markers);
          return; // Successfully updated, no need to recreate
        } catch (e) {
          console.error("Error setting markers:", e);
          // Fall through to recreate plugin
        }
      }
      
      // If setMarkers doesn't work, detach and recreate
      try {
        if (typeof plugin.detach === 'function') {
          plugin.detach();
        } else if (typeof plugin.remove === 'function') {
          plugin.remove();
        }
      } catch (e) {
        console.error("Error detaching markers plugin:", e);
      }
      markersPluginRef.current = null;
    }
    
    // Create new plugin with current markers (or recreate if update failed)
    // Empty array = no markers, which clears the chart
    if (candlestickSeriesRef.current) {
      markersPluginRef.current = createSeriesMarkers(candlestickSeriesRef.current, markers);
    }
  }, [markers]);

  // Removed visible range change handler - it was causing duplicate markers
  // The markers useEffect handles all marker updates now


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
        // If item is selected, also make it a favorite
        isFavorite: item.value === value ? true : item.isFavorite,
      })),
    }));
    setInterval(updatedInterval);
    // Save to localStorage
    setLocalStorage(LOCAL_STORAGE_KEYS.SELECTED_INTERVAL, value);
    saveFavoritesToStorage(updatedInterval);
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
    // Save favorites to localStorage
    saveFavoritesToStorage(updatedInterval);
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
    // Save to localStorage
    setLocalStorage(LOCAL_STORAGE_KEYS.SELECTED_INTERVAL, value);
    saveFavoritesToStorage(updatedInterval);
  };


  const favoriteItems = getFavoriteItems();

  // Get displayed OHLC values - use hovered candle if available, otherwise latest candle
  const displayedCandle = useMemo(() => {
    // Only show data if it matches the current currency
    if (currentCurrency !== currency || candleData.length === 0) return null;
    
    if (hoveredCandle) {
      // Find the corresponding API data for volume
      const apiCandle = candleData.find((c) => Math.floor(c.t / 1000) === hoveredCandle.time);
      return {
        open: hoveredCandle.open,
        high: hoveredCandle.high,
        low: hoveredCandle.low,
        close: hoveredCandle.close,
        volume: apiCandle ? parseFloat(apiCandle.v) : 0,
      };
    }
    
    const latest = candleData[candleData.length - 1];
    return {
      open: parseFloat(latest.o),
      high: parseFloat(latest.h),
      low: parseFloat(latest.l),
      close: parseFloat(latest.c),
      volume: parseFloat(latest.v),
    };
  }, [candleData, hoveredCandle, currency, currentCurrency]);

  // Calculate price change - compare with previous candle
  const priceChange = useMemo(() => {
    if (!displayedCandle || candleData.length < 2) return null;
    
    // Find the previous candle
    let previousClose: number;
    if (hoveredCandle) {
      // Find the candle before the hovered one
      const transformedData = transformCandleData(candleData);
      const hoveredIndex = transformedData.findIndex((c) => c.time === hoveredCandle.time);
      if (hoveredIndex > 0) {
        previousClose = transformedData[hoveredIndex - 1].close;
      } else {
        // If it's the first candle, use its open as previous
        previousClose = hoveredCandle.open;
      }
    } else {
      // Use the previous candle from latest
      previousClose = parseFloat(candleData[candleData.length - 2].c);
    }
    
    const change = displayedCandle.close - previousClose;
    const changePercent = (change / previousClose) * 100;
    return { change, changePercent };
  }, [candleData, displayedCandle, hoveredCandle]);

  // WebSocket subscription for real-time updates
  useEffect(() => {
    let subscription: Subscription | null = null;
    let isSubscribed = true;
    const currentWsCurrency = currency; // Capture currency for this subscription

    const setupWebSocket = async () => {
      if (selectedInterval && currency) {
        try {
          subscription = await subscriptionClient.candle(
            { coin: currency, interval: selectedInterval as CandleInterval },
            (data: CandleApiData) => {
              // Only update state if still subscribed to this market/interval
              // AND the data matches the current currency (prevent race conditions)
              if (!isSubscribed || currentWsCurrency !== currency) return;
              
              // Verify the data symbol matches the current currency
              if (data.s !== currency) return;
              
              console.log("WebSocket candle data", data);
              // Update candle data with new candle from websocket
              setCandleData((prev) => {
                // Only update if we have data for the current currency
                if (currentCurrency !== currency) return prev;
                
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
          errorHandler(error, "WebSocket connection error");
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
  }, [selectedInterval, currency, currentCurrency]);

  // WebSocket subscription for live user fills (real-time order markers)
  useEffect(() => {
    let fillsSubscription: Subscription | null = null;
    let isSubscribed = true;
    const currentWsUserAddress = userAddress; // Capture user address for this subscription

    const setupFillsWebSocket = async () => {
      if (!userAddress || !selectedTimePeriodObj) {
        return;
      }

      try {
        fillsSubscription = await subscriptionClient.userFills(
          { user: userAddress as `0x${string}` },
          (data: any) => {
            // Only update state if still subscribed to this user
            if (!isSubscribed || currentWsUserAddress !== userAddress) return;

            console.log("WebSocket live fills data", data);
            
            // Extract fills from the data object and cast to FillData
            // The API may return twapId as number | null, but we store it as string | null
            const fills = (data.fills || []).map((fill: any) => ({
              ...fill,
              twapId: fill.twapId !== null && fill.twapId !== undefined ? String(fill.twapId) : null,
            })) as FillData[];
            
            // Process new fills and add them to fillsData
            setFillsData((prevFills) => {
              // Get current time period boundaries
              const now = Date.now();
              const startTime = now - selectedTimePeriodObj.timePeriod;
              const endTime = now;

              // Filter fills to only include those within the time period and matching currency
              const validFills = fills.filter(
                (fill) =>
                  fill.time >= startTime &&
                  fill.time <= endTime &&
                  fill.coin === currency
              );

              if (validFills.length === 0) {
                return prevFills;
              }

              // Create a Set of existing fill IDs to avoid duplicates
              // Use a combination of hash, oid, and time as unique identifier
              const existingFillIds = new Set(
                prevFills.map((f) => `${f.hash}-${f.oid}-${f.time}`)
              );

              // Add new fills that don't already exist
              const newFills = validFills.filter(
                (fill) => !existingFillIds.has(`${fill.hash}-${fill.oid}-${fill.time}`)
              );

              if (newFills.length === 0) {
                return prevFills;
              }

              // Combine with existing fills and sort by time
              const combinedFills = [...prevFills, ...newFills].sort(
                (a, b) => a.time - b.time
              );

              return combinedFills;
            });
          }
        );
      } catch (error) {
        console.error("Error setting up fills WebSocket:", error);
        errorHandler(error, "Failed to subscribe to live fills");
      }
    };

    setupFillsWebSocket();

    return () => {
      // Mark as unsubscribed to prevent state updates
      isSubscribed = false;
      // Unsubscribe from the fills subscription
      if (fillsSubscription) {
        try {
          fillsSubscription.unsubscribe();
        } catch (error) {
          console.error("Error unsubscribing from fills WebSocket:", error);
        }
        fillsSubscription = null;
      }
    };
  }, [userAddress, selectedTimePeriodObj, currency]);
  const { userPositions } = useBottomPanelStore();
  
  const position = userPositions?.find(
    (p) => p.position?.coin === currency
  );

  const positionData = position?.position;

  const pnlValue = positionData?.unrealizedPnl 
  ? parseFloat(positionData.unrealizedPnl).toFixed(2)
  : null;
const pnlIsPositive = pnlValue ? parseFloat(pnlValue) >= 0 : false;

// Position size display
const positionSize = positionData?.szi || null;

  // Update price lines when position data changes
  useEffect(() => {
    if (!candlestickSeriesRef.current) return;

    const series = candlestickSeriesRef.current;

    // Remove existing price lines
    if (entryPriceLineRef.current) {
      series.removePriceLine(entryPriceLineRef.current);
      entryPriceLineRef.current = null;
    }
    if (liquidationPriceLineRef.current) {
      series.removePriceLine(liquidationPriceLineRef.current);
      liquidationPriceLineRef.current = null;
    }

    // Add price lines if position exists
    if (positionData) {
      // Entry price line (green dashed)
      if (positionData.entryPx) {
        entryPriceLineRef.current = series.createPriceLine({
          price: parseFloat(positionData.entryPx),
          color: "#22c55e", // green-400 (green)
          lineWidth: 1,
          lineStyle: 2, // dashed
          axisLabelVisible: true,
          title: `PNL ${pnlValue} | ${positionSize}`,
        });
      }

      // Liquidation price line (pink dashed)
      if (positionData.liquidationPx) {
        liquidationPriceLineRef.current = series.createPriceLine({
          price: parseFloat(positionData.liquidationPx),
          color: "#ec4899", // pink-500
          lineWidth: 1,
          lineStyle: 2, // dashed
          axisLabelVisible: true,
          title: "Liq. Price",
        });
      }
    }

    return () => {
      // Cleanup on unmount
      if (entryPriceLineRef.current && series) {
        try {
          series.removePriceLine(entryPriceLineRef.current);
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
      if (liquidationPriceLineRef.current && series) {
        try {
          series.removePriceLine(liquidationPriceLineRef.current);
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    };
  }, [positionData]);

  // Calculate entry price Y coordinate for positioning PNL box
  useEffect(() => {
    if (!positionData?.entryPx || !candlestickSeriesRef.current || !chartRef.current || !chartContainerRef.current) {
      setEntryPriceY(null);
      return;
    }

    const updateEntryPriceY = () => {
      try {
        const series = candlestickSeriesRef.current;
        const chart = chartRef.current;
        if (!series || !chart || !chartContainerRef.current) return;

        const entryPrice = parseFloat(positionData.entryPx);
        const priceScale = series.priceScale();
        
        // Get visible price range
        const visibleRange = priceScale.getVisibleRange();
        if (!visibleRange) return;

        // Get container dimensions - this is what we're positioning relative to
        const containerRect = chartContainerRef.current.getBoundingClientRect();
        const containerHeight = containerRect.height;
        
        // Get price scale options to account for margins
        const priceScaleOptions = priceScale.options();
        const topMargin = priceScaleOptions.scaleMargins?.top || 0.1;
        const bottomMargin = priceScaleOptions.scaleMargins?.bottom || 0;
        
        // Calculate the actual chart area height (excluding margins)
        const chartAreaHeight = containerHeight * (1 - topMargin - bottomMargin);
        const chartAreaTopOffset = containerHeight * topMargin;
        
        // Calculate the Y position within the visible price range
        const priceRange = visibleRange.to - visibleRange.from;
        if (priceRange === 0) return;
        
        // Calculate price ratio (0 = bottom of visible range, 1 = top of visible range)
        const priceOffset = entryPrice - visibleRange.from;
        const priceRatio = priceOffset / priceRange;
        
        // Y coordinate: 0 is top, so we invert (higher price = higher on screen = lower Y value)
        // Price at top of range should be at top of chart area
        const yInChartArea = chartAreaHeight * (1 - priceRatio);
        
        // Calculate relative Y position within the container
        // Position is: top margin + position in chart area
        const relativeY = chartAreaTopOffset + yInChartArea;
        
        setEntryPriceY(relativeY);
      } catch (e) {
        console.error('Error calculating entry price Y:', e);
        setEntryPriceY(null);
      }
    };

    // Update immediately with a delay to ensure chart is rendered
    const timeoutId = setTimeout(updateEntryPriceY, 200);

    // Update on chart resize
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(updateEntryPriceY, 100);
    });
    resizeObserver.observe(chartContainerRef.current);

    // Update on visible range changes (zoom/pan)
    const handleTimeRangeChange = () => {
      setTimeout(updateEntryPriceY, 100);
    };
    
    if (chartRef.current) {
      const timeScale = chartRef.current.timeScale();
      timeScale.subscribeVisibleTimeRangeChange(handleTimeRangeChange);
    }

    // Update frequently to catch any price scale changes (zoom/pan on price axis)
    const intervalId = window.setInterval(() => {
      updateEntryPriceY();
    }, 200);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timeoutId);
      window.clearInterval(intervalId);
      if (chartRef.current) {
        try {
          const timeScale = chartRef.current.timeScale();
          timeScale.unsubscribeVisibleTimeRangeChange(handleTimeRangeChange);
        } catch (e) {
          // Ignore errors
        }
      }
    };
  }, [positionData, candleData, chartHeight]);

  // Calculate PNL display value


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
                  ? "bg-green-500/20 text-green-400"
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
        <span className="w-2 h-2 rounded-full bg-green-400 ml-1 sm:ml-2" />
        {displayedCandle ? (
          <>
            <span className="text-gray-400 ml-1 sm:ml-2">O</span>
            <span className={`tabular-nums ${displayedCandle.close >= displayedCandle.open ? 'text-green-400' : 'text-red-500'}`}>{displayedCandle.open.toFixed(2)}</span>
            <span className="text-gray-400 ml-1 sm:ml-2">H</span>
            <span className={`tabular-nums ${displayedCandle.close >= displayedCandle.open ? 'text-green-400' : 'text-red-500'}`}>{displayedCandle.high.toFixed(2)}</span>
            <span className="text-gray-400 ml-1 sm:ml-2">L</span>
            <span className={`tabular-nums ${displayedCandle.close >= displayedCandle.open ? 'text-green-400' : 'text-red-500'}`}>{displayedCandle.low.toFixed(2)}</span>
            <span className="text-gray-400 ml-1 sm:ml-2">C</span>
            <span className={`tabular-nums ${displayedCandle.close >= displayedCandle.open ? 'text-green-400' : 'text-red-500'}`}>
              {displayedCandle.close.toFixed(2)}
            </span>
            {priceChange && (
              <span className={`ml-1 sm:ml-2 tabular-nums ${priceChange.change >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                {priceChange.change >= 0 ? '+' : ''}{priceChange.change.toFixed(6)} ({priceChange.changePercent >= 0 ? '+' : ''}{priceChange.changePercent.toFixed(2)}%)
              </span>
            )}
          </>
        ) : (
          <span className="text-gray-400 ml-1 sm:ml-2">Loading...</span>
        )}
      </div>

      {/* Chart */}
      <div className="flex-1 w-full min-h-0 relative">
        <div ref={chartContainerRef} className="absolute inset-0 cursor-crosshair" />
        
        {/* Loading Overlay */}
        {(isLoading || currentCurrency !== currency) && (
          <div className="absolute inset-0 bg-gray-950/90 backdrop-blur-md z-10 flex items-center justify-center">
            <div className="flex flex-col items-center gap-6">
              {/* Modern Animated Loader */}
              <div className="relative">
                {/* Outer rotating ring */}
                <div className="w-16 h-16 border-4 border-gray-800 rounded-full relative">
                  <div className="absolute inset-0 border-4 border-transparent border-t-green-400 rounded-full animate-spin" style={{ animationDuration: '1s' }} />
                  <div className="absolute inset-0 border-4 border-transparent border-r-green-500 rounded-full animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
                </div>
                {/* Inner pulsing dot */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" style={{ animationDuration: '1s' }} />
                </div>
              </div>
              
              {/* Loading text with animated dots */}
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-gray-300">Loading chart data</span>
                <div className="flex gap-1">
                  <span className="w-1 h-1 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '1.4s' }} />
                  <span className="w-1 h-1 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '1.4s' }} />
                  <span className="w-1 h-1 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s', animationDuration: '1.4s' }} />
                </div>
              </div>
              
              {/* Modern progress bar */}
              <div className="w-72 h-1.5 bg-gray-800/50 rounded-full overflow-hidden relative">
                <div 
                  className="absolute inset-0 h-full rounded-full animate-shimmer"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.8), rgba(34, 197, 94, 1), rgba(34, 197, 94, 0.8), transparent)',
                    width: '40%',
                    transform: 'translateX(-100%)'
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Volume label */}
      {/* <div className="px-2 sm:px-3 py-1 text-xs text-gray-400 flex items-center gap-2">
        <span>Volume</span>
        <span className="text-green-400 tabular-nums">
          {displayedCandle ? displayedCandle.volume.toFixed(2) : '0.00'}
        </span>
      </div> */}

      {/* Bottom time controls */}
      <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 border-t border-gray-800 text-xs">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {timePeriods.filter((period) => period.value !== "5y").map((period) => (
            <AppButton
              key={period.value}
              variant={VARIANT_TYPES.QUATERNARY}
              onClick={() => handleTimePeriodSelect(period.value)}
              className={
                period.isSelected
                  ? "bg-green-500/20 text-green-400"
                  : ""
              }
            >
              {period.title}
            </AppButton>
          ))}
        </div>
        {/* <div className="flex items-center gap-2 sm:gap-3 text-gray-400 shrink-0">
          <span className="tabular-nums text-[10px] sm:text-xs">06:38:10 (UTC-5)</span>
          <span className="hidden sm:inline">%</span>
          <span className="hidden sm:inline">log</span>
          <span className="hidden sm:inline">auto</span>
        </div> */}
      </div>
    </div>
  );
};
 