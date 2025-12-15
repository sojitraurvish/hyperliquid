interface MarketInfoBarProps {
  symbol?: string;
  timeframe?: string;
  exchange?: string;
  ohlc?: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
  change?: {
    value: number;
    percent: number;
  };
}

export const MarketInfoBar = ({
  symbol = "ETHUSD",
  timeframe = "1h",
  exchange = "Hyperliquid",
  ohlc,
  change,
}: MarketInfoBarProps) => {
  const formatPrice = (price: number) => {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  };

  const formatChange = (value: number, percent: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(4)} (${sign}${percent.toFixed(2)}%)`;
  };

  const isPositive = change ? change.value >= 0 : false;

  return (
    <div className="px-2 sm:px-3 py-2 text-xs flex items-center gap-1 flex-wrap">
      <span className="text-gray-400">{symbol} · {timeframe} · {exchange}</span>
      <span className="w-2 h-2 rounded-full bg-teal-400 ml-2" />
      {ohlc && (
        <>
          <span className="text-gray-400 ml-2">O</span>
          <span className="text-teal-400 tabular-nums">{formatPrice(ohlc.open)}</span>
          <span className="text-gray-400 ml-2">H</span>
          <span className="text-white tabular-nums">{formatPrice(ohlc.high)}</span>
          <span className="text-gray-400 ml-2">L</span>
          <span className="text-white tabular-nums">{formatPrice(ohlc.low)}</span>
          <span className="text-gray-400 ml-2">C</span>
          <span className={`tabular-nums ${isPositive ? "text-teal-400" : "text-red-500"}`}>
            {formatPrice(ohlc.close)}
          </span>
        </>
      )}
      {change && (
        <span
          className={`ml-2 tabular-nums ${
            isPositive ? "text-teal-400" : "text-red-500"
          }`}
        >
          {formatChange(change.value, change.percent)}
        </span>
      )}
    </div>
  );
};
