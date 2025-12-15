import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, CandlestickSeries, HistogramSeries } from "lightweight-charts";
import { BarChart3, Maximize2 } from "lucide-react";

export const TradingChart = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const [chartHeight, setChartHeight] = useState(400);

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

    // Generate sample data for ETH around 3200
    const data = [];
    let base = 3200;
    for (let i = 0; i < 200; i++) {
      const time = Date.now() / 1000 - (200 - i) * 3600;
      const volatility = Math.random() * 100;
      const open = base + (Math.random() - 0.5) * volatility;
      const close = open + (Math.random() - 0.5) * volatility;
      const high = Math.max(open, close) + Math.random() * 30;
      const low = Math.min(open, close) - Math.random() * 30;
      
      data.push({
        time: time as any,
        open,
        high,
        low,
        close,
      });
      
      base = close;
    }

    candlestickSeries.setData(data);

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: colors.volumeBase,
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "",
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.9,
        bottom: 0,
      },
    });

    const volumeData = data.map((d) => ({
      time: d.time,
      value: Math.random() * 200 + 50,
      color: d.close > d.open ? `${colors.upColor}80` : `${colors.downColor}80`, // 50% opacity
    }));

    volumeSeries.setData(volumeData);

    chart.timeScale().fitContent();

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

  return (
    <div className="flex-1 flex flex-col bg-gray-950 w-full">
      {/* Chart toolbar */}
      <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 border-b border-gray-800">
        <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <button className="text-xs h-6 sm:h-7 px-1.5 sm:px-2 text-gray-400 hover:text-white hover:bg-gray-900/50 rounded transition-colors whitespace-nowrap">
            5m
          </button>
          <button className="text-xs h-6 sm:h-7 px-1.5 sm:px-2 bg-gray-800 text-white rounded whitespace-nowrap">
            1h
          </button>
          <button className="text-xs h-6 sm:h-7 px-1.5 sm:px-2 text-gray-400 hover:text-white hover:bg-gray-900/50 rounded transition-colors whitespace-nowrap">
            D
          </button>
          <div className="w-px h-4 bg-gray-800 mx-0.5 sm:mx-1" />
          <button className="text-xs h-6 sm:h-7 px-1.5 sm:px-2 text-gray-400 hover:text-white hover:bg-gray-900/50 rounded transition-colors flex items-center gap-1 whitespace-nowrap">
            <BarChart3 className="h-3 w-3" />
            <span className="hidden sm:inline">Indicators</span>
          </button>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button className="h-6 w-6 sm:h-7 sm:w-7 text-gray-400 hover:text-white hover:bg-gray-900/50 rounded transition-colors flex items-center justify-center">
            <Maximize2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </button>
        </div>
      </div>

      {/* OHLC info */}
      <div className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs flex items-center gap-1 flex-wrap">
        <span className="text-gray-400">ETHUSD · 1h · Hyperliquid</span>
        <span className="w-2 h-2 rounded-full bg-teal-400 ml-1 sm:ml-2" />
        <span className="text-gray-400 ml-1 sm:ml-2">O</span>
        <span className="text-teal-400 tabular-nums">3,204.1</span>
        <span className="text-gray-400 ml-1 sm:ml-2">H</span>
        <span className="text-white tabular-nums">3,209.1</span>
        <span className="text-gray-400 ml-1 sm:ml-2">L</span>
        <span className="text-white tabular-nums">3,201.8</span>
        <span className="text-gray-400 ml-1 sm:ml-2">C</span>
        <span className="text-teal-400 tabular-nums">3,203.7</span>
        <span className="text-red-500 ml-1 sm:ml-2 tabular-nums">-1.2000 (-0.04%)</span>
      </div>

      {/* Chart */}
      <div ref={chartContainerRef} className="flex-1  w-full min-h-0" />

      {/* Volume label */}
      <div className="px-2 sm:px-3 py-1 text-xs text-gray-400 flex items-center gap-2">
        <span>Volume</span>
        <span className="text-teal-400 tabular-nums">2.16</span>
      </div>

      {/* Bottom time controls */}
      <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 border-t border-gray-800 text-xs">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <button className="text-xs h-5 sm:h-6 px-1.5 sm:px-2 text-gray-400 hover:text-white hover:bg-gray-900/50 rounded transition-colors whitespace-nowrap">
            5y
          </button>
          <button className="text-xs h-5 sm:h-6 px-1.5 sm:px-2 text-gray-400 hover:text-white hover:bg-gray-900/50 rounded transition-colors whitespace-nowrap">
            1y
          </button>
          <button className="text-xs h-5 sm:h-6 px-1.5 sm:px-2 text-gray-400 hover:text-white hover:bg-gray-900/50 rounded transition-colors whitespace-nowrap">
            6m
          </button>
          <button className="text-xs h-5 sm:h-6 px-1.5 sm:px-2 text-gray-400 hover:text-white hover:bg-gray-900/50 rounded transition-colors whitespace-nowrap">
            3m
          </button>
          <button className="text-xs h-5 sm:h-6 px-1.5 sm:px-2 text-gray-400 hover:text-white hover:bg-gray-900/50 rounded transition-colors whitespace-nowrap">
            1m
          </button>
          <button className="text-xs h-5 sm:h-6 px-1.5 sm:px-2 text-gray-400 hover:text-white hover:bg-gray-900/50 rounded transition-colors whitespace-nowrap">
            5d
          </button>
          <button className="text-xs h-5 sm:h-6 px-1.5 sm:px-2 text-gray-400 hover:text-white hover:bg-gray-900/50 rounded transition-colors whitespace-nowrap">
            1d
          </button>
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
