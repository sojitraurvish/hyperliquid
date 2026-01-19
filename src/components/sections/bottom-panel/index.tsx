"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ExternalLink, Pencil } from "lucide-react";
import { infoClient , subscriptionClient, transport} from "@/lib/config/hyperliquied/hyperliquid-client";
import { useAccount } from "wagmi";
import { useBottomPanelStore } from "@/store/bottom-panel";
import { Balance, HistoricalOrder, FundingHistory, TradeHistory, OpenOrder, Position } from "@/types/bottom-panel";
import { addDecimals, DATE_TIME_FORMAT } from "@/lib/constants";
import moment from "moment";
import { formatDateTimeAccordingToFormat } from "@/lib/date-operation";
import { HISTORICAL_ORDERS_URL, FUNDING_HISTORY_URL, TRADE_HISTORY_URL, EXPLORER_TX_URL } from "@/lib/config";

// ==================== Types ====================

type TabValue = "balances" | "positions" | "openorders" | "twap" | "tradehistory" | "fundinghistory" | "orderhistory";

interface Tab {
  label: string;
  value: TabValue;
  count?: number;
}

interface SpotBalance {
  coin: string;
  total: number | null;
  available: number | null;
  hold: number | null;
  tokenId: number | null;
}

interface SpotBalances {
  all: Array<{
    coin: string;
    total?: string | number;
    hold?: string | number;
    token?: number;
    [key: string]: unknown;
  }>;
  usdc: SpotBalance | null;
}

interface PerpsBalances {
  raw: Record<string, unknown>;
  withdrawable: number | null;
  accountValue: number | null;
  usdcAvailable: number | null;
}

interface BalancesData {
  raw?: unknown;
  spot: SpotBalances;
  perps: PerpsBalances;
  meta?: unknown;
  timestamp: number;
  error?: unknown;
}

// ==================== Modular UI Components ====================

// Custom hook for positions table grid columns
const usePositionsGridColumns = () => {
  const [gridColumns, setGridColumns] = useState<string>("0.9fr 1fr 1.1fr 1.5fr 1.3fr 0.8fr");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateGridColumns = () => {
      const width = window.innerWidth;
      if (width >= 1280) {
        // xl: 11 columns
        setGridColumns("0.9fr 1fr 1.1fr 1fr 1fr 1.5fr 1fr 1.2fr 1fr 1.3fr 0.8fr");
      } else if (width >= 1024) {
        // lg: 9 columns
        setGridColumns("0.9fr 1fr 1.1fr 1fr 1fr 1.5fr 1fr 1.3fr 0.8fr");
      } else if (width >= 768) {
        // md: 8 columns
        setGridColumns("0.9fr 1fr 1.1fr 1fr 1fr 1.5fr 1.3fr 0.8fr");
      } else if (width >= 640) {
        // sm: 7 columns
        setGridColumns("0.9fr 1fr 1.1fr 1fr 1.5fr 1.3fr 0.8fr");
      } else {
        // base: 6 columns
        setGridColumns("0.9fr 1fr 1.1fr 1.5fr 1.3fr 0.8fr");
      }
    };

    updateGridColumns();
    window.addEventListener("resize", updateGridColumns);
    return () => window.removeEventListener("resize", updateGridColumns);
  }, []);

  return gridColumns;
};

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "ghost" | "outline" | "primary";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const Button = ({ 
  variant = "ghost", 
  size = "md", 
  children, 
  className = "",
  ...props 
}: ButtonProps) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-gray-950 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    ghost: "bg-transparent text-gray-400 hover:bg-gray-800/50 hover:text-gray-300",
    outline: "border border-gray-700 bg-transparent text-gray-400 hover:bg-gray-800/50 hover:text-gray-300 hover:border-gray-600",
    primary: "bg-teal-400 text-white hover:bg-teal-500",
  };
  
  const sizes = {
    sm: "h-7 px-2 text-xs",
    md: "h-8 px-3 text-xs sm:text-sm",
    lg: "h-9 px-4 text-sm",
  };
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Tab Button Component
interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}

const TabButton = ({ isActive, onClick, children, count }: TabButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative px-2 sm:px-3 h-8 sm:h-10 text-xs font-medium transition-all duration-200
        whitespace-nowrap
        ${isActive 
          ? "text-white border-b-2 border-teal-400" 
          : "text-gray-400 hover:text-gray-300 border-b-2 border-transparent"
        }
      `}
    >
      {children}
      {count !== undefined && count > 0 && (
        <span className="ml-1 text-gray-500">({count})</span>
      )}
    </button>
  );
};

// Tab Content Component
interface TabContentProps {
  value: TabValue;
  activeTab: TabValue;
  children: React.ReactNode;
}

const TabContent = ({ value, activeTab, children }: TabContentProps) => {
  if (value !== activeTab) return null;
  
  return (
    <div className="flex-1 overflow-auto">
      {children}
    </div>
  );
};

// Positions Table Header Component
const PositionsTableHeader = () => {
  const gridColumns = usePositionsGridColumns();

  const headers = [
    { label: "Coin", className: "" },
    { label: "Size", className: "" },
    { label: "Position Value", icon: true, className: "" },
    { label: "Entry Price", className: "hidden sm:block" },
    { label: "Mark Price", className: "hidden md:block" },
    { label: "PNL (ROE %)", underline: true, className: "" },
    { label: "Liq. Price", className: "hidden lg:block" },
    { label: "Margin", underline: true, className: "hidden xl:block" },
    { label: "Funding", underline: true, className: "hidden xl:block" },
    { label: "Close All", className: "" },
    { label: "TP/SL", className: "" },
  ];

  return (
    <div 
      className="grid gap-2 sm:gap-3 md:gap-4 px-2 sm:px-3 py-2 text-xs text-gray-400 border-b border-gray-800"
      style={{ gridTemplateColumns: gridColumns }}
    >
      {headers.map((header, index) => (
        <div
          key={index}
          className={`flex items-center gap-1 ${header.className} ${
            header.underline ? "underline decoration-dotted" : ""
          }`}
        >
          <span>{header.label}</span>
          {header.icon && <ChevronDown className="h-3 w-3 shrink-0" />}
        </div>
      ))}
    </div>
  );
};

// Balances Table Header Component
const BalancesTableHeader = () => {
  const headers = [
    { label: "Coin", className: "col-span-2 sm:col-span-1" },
    { label: "Total Balance", className: "col-span-2 sm:col-span-1" },
    { label: "Available Balance", className: "col-span-2 sm:col-span-1" },
    { label: "USDC Value", icon: true, className: "hidden md:col-span-1 md:block" },
    { label: "Send", className: "col-span-1 sm:col-span-1" },
  ];

  return (
    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-6 gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs text-gray-400 border-b border-gray-800">
      {headers.map((header, index) => (
        <div
          key={index}
          className={`flex items-center ${header.icon ? "gap-1.5" : ""} ${header.className}`}
        >
          <span className="leading-none">{header.label}</span>
          {/* {header.icon && <ChevronDown className="h-3 w-3 shrink-0 mt-0.5" />} */}
        </div>
      ))}
    </div>
  );
};

// Orders Table Header Component
const OrdersTableHeader = () => {
  const headers = [
    { label: "Time", className: "col-span-2 sm:col-span-1" },
    { label: "Pair", className: "col-span-2 sm:col-span-1" },
    { label: "Type", className: "col-span-2 sm:col-span-1" },
    { label: "Side", className: "hidden sm:col-span-1 sm:block" },
    { label: "Price", className: "hidden md:col-span-1 md:block" },
    { label: "Amount", className: "hidden lg:col-span-1 lg:block" },
    { label: "Filled", className: "hidden xl:col-span-1 xl:block" },
    { label: "Status", className: "hidden xl:col-span-1 xl:block" },
    { label: "Actions", className: "col-span-2 sm:col-span-1" },
  ];

  return (
    <div className="grid grid-cols-6 sm:grid-cols-7 md:grid-cols-8 lg:grid-cols-9 xl:grid-cols-10 gap-2 sm:gap-4 px-2 sm:px-3 py-2 text-xs text-gray-400 border-b border-gray-800">
      {headers.map((header, index) => (
        <div key={index} className={header.className}>
          {header.label}
        </div>
      ))}
    </div>
  );
};

// Open Orders Table Header Component
const OpenOrdersTableHeader = () => {
  const headers = [
    { label: "Time" },
    { label: "Type" },
    { label: "Coin" },
    { label: "Direction" },
    { label: "Size" },
    { label: "Original Size" },
    { label: "Order Value", icon: true },
    { label: "Price" },
    { label: "Reduce Only" },
    { label: "Trigger Conditions" },
    { label: "TP/SL" },
    { label: "" }, // Empty column for actions
  ];

  return (
    <div className="sticky top-0 z-50 bg-gray-950 backdrop-blur-sm grid gap-1 px-2 sm:px-3 py-2 text-xs text-gray-400 border-b border-gray-800" style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}>
      {headers.map((header, index) => (
        <div key={index} className="flex items-center gap-1 truncate">
          <span>{header.label}</span>
          {header.icon && <ChevronDown className="h-3 w-3 shrink-0" />}
        </div>
      ))}
    </div>
  );
};

// Order History Table Header Component
const OrderHistoryTableHeader = () => {
  const headers = [
    { label: "Date and Time" },
    { label: "Order Type" },
    { label: "Coin" },
    { label: "Direction" },
    { label: "Size" },
    { label: "Filled Size" },
    { label: "Order Value" },
    { label: "Price" },
    { label: "Reduce Only" },
    { label: "Tp/SL" },
    { label: "Status" },
    { label: "Order ID" },
  ];

  return (
    <div className="sticky top-0 z-50 bg-gray-950 grid gap-1 px-2 sm:px-3 py-2 text-xs text-gray-400 border-b border-gray-800 backdrop-blur-sm" style={{ gridTemplateColumns: '2fr repeat(11, 1fr)' }}>
      {headers.map((header, index) => (
        <div key={index} className="truncate">
          {header.label}
        </div>
      ))}
    </div>
  );
};

// Funding History Table Header Component
const FundingHistoryTableHeader = () => {
  const headers = [
    { label: "Time", icon: true },
    { label: "Coin" },
    { label: "Size" },
    { label: "Position Side" },
    { label: "Payment" },
    { label: "Rate" },
  ];

  return (
    <div className="sticky top-0 z-50 bg-gray-950 backdrop-blur-sm grid grid-cols-6 gap-2 sm:gap-4 px-2 sm:px-3 py-2 text-xs text-gray-400 border-b border-gray-800">
      {headers.map((header, index) => (
        <div
          key={index}
          className="flex items-center gap-1"
        >
          <span>{header.label}</span>
          {header.icon && <ChevronDown className="h-3 w-3 shrink-0" />}
        </div>
      ))}
    </div>
  );
};

// Trade History Table Header Component
const TradeHistoryTableHeader = () => {
  const headers = [
    { label: "Time", className: "col-span-2 sm:col-span-1" },
    { label: "Coin", className: "col-span-1" },
    { label: "Direction", className: "col-span-1" },
    { label: "Price", className: "col-span-1" },
    { label: "Size", className: "col-span-1" },
    { label: "Trade Value", className: "col-span-1" },
    { label: "Fee", className: "col-span-1" },
    { label: "Closed PNL", className: "col-span-1" },
  ];

  return (
    <div className="sticky top-0 z-50 bg-gray-950 backdrop-blur-sm grid grid-cols-8 gap-2 sm:gap-4 px-2 sm:px-3 py-2 text-xs text-gray-400 border-b border-gray-800">
      {headers.map((header, index) => (
        <div key={index} className={header.className}>
          {header.label}
        </div>
      ))}
    </div>
  );
};

// Funding History Row Component
interface FundingHistoryRowProps {
  funding: FundingHistory;
}

const FundingHistoryRow = ({ funding }: FundingHistoryRowProps) => {
  // Format date and time: "DD/MM/YYYY - HH:mm:ss"
  const formattedDateTime = formatDateTimeAccordingToFormat({
    timeStamp: funding.time,
    format: DATE_TIME_FORMAT.DD_MM_YYYY_HH_MM_SS
  });

  // Format size with BTC suffix
  const size = `${parseFloat(funding.delta.szi).toFixed(5)} BTC`;

  // Format payment - already negative in data, display with $ sign in red
  const payment = `-$${Math.abs(parseFloat(funding.delta.usdc)).toFixed(4)}`;

  // Format rate as percentage (multiply by 100)
  const rate = `${(parseFloat(funding.delta.fundingRate) * 100).toFixed(4)}%`;

  // Position side - based on the image, all are "Long"
  const positionSide = "Long";

  return (
    <div className="grid grid-cols-6 gap-2 sm:gap-4 px-2 sm:px-3 py-2 text-xs sm:text-sm border-b border-gray-800 hover:bg-gray-900/50 transition-colors">
      <div className="text-gray-300 truncate" title={formattedDateTime}>
        {formattedDateTime}
      </div>
      <div className="text-teal-400 font-medium truncate" title={funding.delta.coin}>
        {funding.delta.coin}
      </div>
      <div className="text-gray-300 truncate" title={size}>
        {size}
      </div>
      <div className="text-teal-400 font-medium truncate" title={positionSide}>
        {positionSide}
      </div>
      <div className="text-red-500 truncate" title={payment}>
        {payment}
      </div>
      <div className="text-gray-300 truncate" title={rate}>
        {rate}
      </div>
    </div>
  );
};

// Trade History Row Component
interface TradeHistoryRowProps {
  trade: TradeHistory;
}

const TradeHistoryRow = ({ trade }: TradeHistoryRowProps) => {
  // Format date and time: "DD/MM/YYYY - HH:mm:ss"
  const formattedDateTime = formatDateTimeAccordingToFormat({
    timeStamp: trade.time,
    format: DATE_TIME_FORMAT.DD_MM_YYYY_HH_MM_SS
  });

  // Determine direction based on side, dir, startPosition, and closedPnl
  // side: "B" = Buy, "A" = Sell
  // dir: indicates position direction
  // startPosition: position size before trade (0 = opening, non-zero = closing/modifying)
  // closedPnl: profit/loss from closing position
  const isBuy = trade.side === "B";
  const startPos = parseFloat(trade.startPosition);
  const isOpening = Math.abs(startPos) < 0.000001; // Effectively zero
  const hasClosedPnl = Math.abs(parseFloat(trade.closedPnl)) > 0.000001;
  const isClosing = !isOpening; // If we had a position before, this might be closing
  
  let direction: string;
  let directionColor: string;
  
  // Check if this is a perpetual trade (has dir field indicating Long/Short, or has position history)
  const isPerpetual = trade.dir && (trade.dir.toLowerCase().includes("long") || trade.dir.toLowerCase().includes("short"));
  
  if (isPerpetual) {
    // Perpetual trades - show position actions
    if (isOpening && isBuy) {
      direction = "Open Long";
      directionColor = "text-green-500";
    } else if (isClosing && isBuy) {
      // Closing a long position (had position before)
      direction = "Close Long";
      directionColor = "text-red-500";
    } else if (isOpening && !isBuy) {
      direction = "Open Short";
      directionColor = "text-red-500";
    } else if (isClosing && !isBuy) {
      direction = "Close Short";
      directionColor = "text-green-500";
    } else {
      // Fallback for perpetual trades
      direction = isBuy ? "Buy" : "Sell";
      directionColor = isBuy ? "text-green-500" : "text-red-500";
    }
  } else {
    // Spot trades - just show Buy or Sell
    direction = isBuy ? "Buy" : "Sell";
    directionColor = isBuy ? "text-green-500" : "text-red-500";
  }

  // Format coin - display as-is from data
  const coin = trade.coin;

  // Format price
  const price = parseFloat(trade.px).toLocaleString('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 5
  });

  // Format size with coin name
  const size = `${parseFloat(trade.sz).toFixed(5)} ${trade.coin}`;

  // Calculate trade value: price * size in USDC
  const tradeValue = (parseFloat(trade.px) * parseFloat(trade.sz)).toFixed(2);
  const formattedTradeValue = `${parseFloat(tradeValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`;

  // Format fee with fee token
  const feeAmount = parseFloat(trade.fee);
  let formattedFee: string;
  if (feeAmount === 0) {
    formattedFee = "0.00 USDC";
  } else {
    formattedFee = `${feeAmount.toFixed(8)} ${trade.feeToken || "USDC"}`;
  }

  // Format closed PNL
  const closedPnl = parseFloat(trade.closedPnl);
  const formattedClosedPnl = closedPnl >= 0 
    ? `${closedPnl.toFixed(2)} USDC`
    : `${closedPnl.toFixed(2)} USDC`;
  const closedPnlColor = closedPnl >= 0 ? "text-green-500" : "text-red-500";

  return (
    <div className="grid grid-cols-8 gap-2 sm:gap-4 px-2 sm:px-3 py-2 text-xs sm:text-sm border-b border-gray-800 hover:bg-gray-900/50 transition-colors">
      <div className="col-span-2 sm:col-span-1 flex items-center gap-1">
        <span className="text-gray-300 truncate" title={formattedDateTime}>
          {formattedDateTime}
        </span>
        <a
          href={`${EXPLORER_TX_URL}/${trade.hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center shrink-0"
        >
          <ExternalLink className="h-3 w-3 text-gray-500 hover:text-teal-400 transition-colors" />
        </a>
      </div>
      <div className="text-teal-400 font-medium truncate" title={coin}>
        {coin}
      </div>
      <div className={`${directionColor} font-medium truncate`} title={direction}>
        {direction}
      </div>
      <div className="text-gray-300 truncate" title={price}>
        {price}
      </div>
      <div className="text-gray-300 truncate" title={size}>
        {size}
      </div>
      <div className="text-gray-300 truncate" title={formattedTradeValue}>
        {formattedTradeValue}
      </div>
      <div className="text-gray-300 truncate" title={formattedFee}>
        {formattedFee}
      </div>
      <div className="flex items-center gap-1">
        <span className={`${closedPnlColor} truncate`} title={formattedClosedPnl}>
          {formattedClosedPnl}
        </span>
        <a
          href={`${EXPLORER_TX_URL}/${trade.hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center shrink-0"
        >
          {/* <ExternalLink className="h-3 w-3 text-gray-500 hover:text-teal-400 transition-colors" /> */}
        </a>
      </div>
    </div>
  );
};

// Positions Row Component
interface PositionsRowProps {
  position: Position;
  markPrice?: string;
}

const PositionsRow = ({ position, markPrice }: PositionsRowProps) => {
  const pos = position.position;
  
  // Format coin with leverage (e.g., "BTC 20x")
  const coin = `${pos.coin} ${pos.leverage.value}x`;
  
  // Format size with coin name
  const size = `${parseFloat(pos.szi).toFixed(5)} ${pos.coin}`;
  
  // Format position value
  const positionValue = `$${parseFloat(pos.positionValue).toFixed(2)} USDC`;
  
  // Format entry price (remove decimals if whole number)
  const entryPrice = parseFloat(pos.entryPx).toFixed(2);
  
  // Format mark price (use provided or calculate from position value and size)
  const formattedMarkPrice = markPrice 
    ? parseFloat(markPrice).toFixed(2) : (() => {
        // Calculate approximate mark price from position value and size
        const posValue = parseFloat(pos.positionValue);
        const posSize = parseFloat(pos.szi);
        return (posValue / posSize).toFixed(2);
      })();
  
  // Format PNL
  const pnl = parseFloat(pos.unrealizedPnl);
  const pnlFormatted = pnl >= 0 
    ? `$${pnl.toFixed(2)}`
    : `-$${Math.abs(pnl).toFixed(2)}`;
  const pnlColor = pnl >= 0 ? "text-green-500" : "text-red-500";
  
  // Format ROE as percentage
  const roe = parseFloat(pos.returnOnEquity) * 100;
  const roeFormatted = `${roe >= 0 ? "+" : ""}${roe.toFixed(1)}%`;
  const roeColor = roe >= 0 ? "text-green-500" : "text-red-500";
  
  // Format liquidation price
  const liqPrice = pos.liquidationPx 
    ? parseFloat(pos.liquidationPx).toFixed(2)
    : "--";
  
  // Format margin with type
  const marginType = pos.leverage.type === "isolated" ? "Isolated" : "Cross";
  const marginFormatted = `$${parseFloat(pos.marginUsed).toFixed(2)}`;
  
  // Format funding
  const funding = parseFloat(pos.cumFunding.sinceOpen);
  const fundingFormatted = funding >= 0 
    ? `-$${funding.toFixed(2)}`
    : `$${Math.abs(funding).toFixed(2)}`;
  const fundingColor = funding <= 0 ? "text-green-500" : "text-red-500";
  
  const gridColumns = usePositionsGridColumns();

  return (
    <div 
      className="grid gap-2 sm:gap-3 md:gap-4 px-2 sm:px-3 py-2 text-xs sm:text-sm border-b border-gray-800 hover:bg-gray-900/50 transition-colors"
      style={{ gridTemplateColumns: gridColumns }}
    >
      {/* Coin */}
      <div>
        <span className="inline-block px-2 py-0.5 bg-teal-400/20 text-teal-400 rounded text-xs font-medium">
          {coin}
        </span>
      </div>
      
      {/* Size */}
      <div className="text-gray-300 truncate" title={size}>
        {size}
      </div>
      
      {/* Position Value */}
      <div className="text-gray-300 truncate" title={positionValue}>
        {positionValue}
      </div>
      
      {/* Entry Price */}
      <div className="hidden sm:block text-gray-300 truncate" title={entryPrice}>
        {entryPrice}
      </div>
      
      {/* Mark Price */}
      <div className="hidden md:block text-gray-300 truncate" title={formattedMarkPrice}>
        {formattedMarkPrice}
      </div>
      
      {/* PNL (ROE %) */}
      <div className="flex items-center gap-1">
        <span className={`${pnlColor} truncate`} title={pnlFormatted}>
          {pnlFormatted}
        </span>
        <span className={`${roeColor} truncate`} title={roeFormatted}>
          ({roeFormatted})
        </span>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            // TODO: Open PNL details
          }}
          className="inline-flex items-center shrink-0"
        >
          {/* <ExternalLink className="h-3 w-3 text-gray-500 hover:text-teal-400 transition-colors" /> */}
        </a>
      </div>
      
      {/* Liq. Price */}
      <div className="hidden lg:block text-gray-300 truncate" title={liqPrice}>
        {liqPrice}
      </div>
      
      {/* Margin */}
      <div className="hidden xl:block">
        <div className="flex items-center gap-1">
          <span className="text-gray-300 truncate" title={marginFormatted}>
            {marginFormatted}
          </span>
          <span className="text-gray-500 truncate" title={marginType}>
            ({marginType})
          </span>
          <button
            onClick={() => {
              // TODO: Edit margin
            }}
            className="inline-flex items-center shrink-0"
          >
            {/* <Pencil className="h-3 w-3 text-gray-500 hover:text-teal-400 transition-colors" /> */}
          </button>
        </div>
      </div>
      
      {/* Funding */}
      <div className={`hidden xl:block ${fundingColor} truncate`} title={fundingFormatted}>
        {fundingFormatted}
      </div>
      
      {/* Close All */}
      <div className="flex items-center gap-1 text-xs">
        <button
          onClick={() => {
            // TODO: Close with limit order
          }}
          className="text-teal-400 hover:text-teal-300 cursor-pointer transition-colors"
        >
          Limit
        </button>
        <span className="text-gray-600">|</span>
        <button
          onClick={() => {
            // TODO: Close with market order
          }}
          className="text-teal-400 hover:text-teal-300 cursor-pointer transition-colors"
        >
          Market
        </button>
        <span className="text-gray-600">|</span>
        <button
          onClick={() => {
            // TODO: Reverse position
          }}
          className="text-teal-400 hover:text-teal-300 cursor-pointer transition-colors"
        >
          Reverse
        </button>
      </div>
      
      {/* TP/SL */}
      <div className="flex items-center gap-1">
        <span className="text-gray-400 truncate">--/--</span>
        <button
          onClick={() => {
            // TODO: Edit TP/SL
          }}
          className="inline-flex items-center shrink-0"
        >
          <Pencil className="h-3 w-3 text-gray-500 hover:text-teal-400 transition-colors" />
        </button>
      </div>
    </div>
  );
};

// Empty State Component
interface EmptyStateProps {
  message: string;
}

const EmptyState = ({ message }: EmptyStateProps) => {
  return (
    <div className="flex items-center justify-center px-2 sm:px-3 py-6 sm:py-8 min-h-[100px]">
      <p className="text-xs sm:text-sm text-gray-400 text-center">{message}</p>
    </div>
  );
};

// Shimmer Skeleton Component
const ShimmerSkeleton = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`relative overflow-hidden bg-gray-800/50 rounded ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/50 to-transparent animate-shimmer" />
    </div>
  );
};

// Positions Table Shimmer
const PositionsTableShimmer = () => {
  const gridColumns = usePositionsGridColumns();
  return (
    <>
      {[1, 2, 3].map((index) => (
        <div
          key={index}
          className="grid gap-2 sm:gap-3 md:gap-4 px-2 sm:px-3 py-2 text-xs sm:text-sm border-b border-gray-800"
          style={{ gridTemplateColumns: gridColumns }}
        >
          {Array.from({ length: gridColumns.split(' ').length }).map((_, colIndex) => (
            <ShimmerSkeleton key={colIndex} className="h-4 sm:h-5" />
          ))}
        </div>
      ))}
    </>
  );
};

// Balances Table Shimmer
const BalancesTableShimmer = () => {
  return (
    <>
      {[1, 2, 3].map((index) => (
        <div
          key={index}
          className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-6 gap-1 sm:gap-2 px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm border-b border-gray-800"
        >
          {[1, 2, 3, 4, 5, 6].map((colIndex) => (
            <ShimmerSkeleton key={colIndex} className="h-4 sm:h-5" />
          ))}
        </div>
      ))}
    </>
  );
};

// Open Orders Table Shimmer
const OpenOrdersTableShimmer = () => {
  return (
    <>
      {[1, 2, 3].map((index) => (
        <div
          key={index}
          className="grid gap-1 px-2 sm:px-3 py-2 text-xs border-b border-gray-800"
          style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}
        >
          {Array.from({ length: 12 }).map((_, colIndex) => (
            <ShimmerSkeleton key={colIndex} className="h-4" />
          ))}
        </div>
      ))}
    </>
  );
};

// Trade History Table Shimmer
const TradeHistoryTableShimmer = () => {
  return (
    <>
      {[1, 2, 3].map((index) => (
        <div
          key={index}
          className="grid grid-cols-8 gap-2 sm:gap-4 px-2 sm:px-3 py-2 text-xs sm:text-sm border-b border-gray-800"
        >
          {Array.from({ length: 8 }).map((_, colIndex) => (
            <ShimmerSkeleton key={colIndex} className="h-4 sm:h-5" />
          ))}
        </div>
      ))}
    </>
  );
};

// Funding History Table Shimmer
const FundingHistoryTableShimmer = () => {
  return (
    <>
      {[1, 2, 3].map((index) => (
        <div
          key={index}
          className="grid grid-cols-6 gap-2 sm:gap-4 px-2 sm:px-3 py-2 text-xs sm:text-sm border-b border-gray-800"
        >
          {Array.from({ length: 6 }).map((_, colIndex) => (
            <ShimmerSkeleton key={colIndex} className="h-4 sm:h-5" />
          ))}
        </div>
      ))}
    </>
  );
};

// Order History Table Shimmer
const OrderHistoryTableShimmer = () => {
  return (
    <>
      {[1, 2, 3].map((index) => (
        <div
          key={index}
          className="grid gap-1 px-2 sm:px-3 py-2 text-xs border-b border-gray-800"
          style={{ gridTemplateColumns: '2fr repeat(11, 1fr)' }}
        >
          {Array.from({ length: 12 }).map((_, colIndex) => (
            <ShimmerSkeleton key={colIndex} className="h-4" />
          ))}
        </div>
      ))}
    </>
  );
};



const BalanceRow = ({ 
  coin,
  total_balance,
  available_balance,
  usdc_value,
}: Balance) => {
  // Check if available balance equals total balance (for underline styling)
  const isAvailableEqualTotal = available_balance === total_balance;
  
  
  return (
    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-6 gap-1 sm:gap-2 px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm border-b border-gray-800 hover:bg-gray-900/50 transition-colors">
      <div className="col-span-2 sm:col-span-1 text-gray-300 font-medium">
        {coin}
      </div>
      <div className="col-span-2 sm:col-span-1 text-gray-300">
        {total_balance}
      </div>
      <div className={`col-span-2 sm:col-span-1 text-gray-300 ${isAvailableEqualTotal ? "decoration-dotted underline" : ""}`}>
        {available_balance}
      </div>
      <div className="hidden md:col-span-1 md:block text-gray-300">
        {usdc_value}
      </div>
      <div className="col-span-1 sm:col-span-1 text-xs text-teal-400 hover:text-teal-300 cursor-pointer">
        Send
      </div>
    </div>
  );
};

// Order History Row Component
interface OrderHistoryRowProps {
  timestamp: number;
  coin: string;
  reduceOnly: boolean;
  side: "B" | "A";
  isPositionTpsl: boolean;
  limitPx: string;
  triggerPx: string;
  orderType: string;
  sz: string;
  origSz: string;
  oid: number;
  status: string;
}

const OrderHistoryRow = ({ 
  timestamp,
  coin,
  reduceOnly,
  side,
  isPositionTpsl,
  limitPx,
  triggerPx,
  orderType,
  sz,
  origSz,
  oid,
  status
}: OrderHistoryRowProps) => {
  // Format date and time: "DD/MM/YYYY - HH:mm:ss"
  const formattedDateTime = formatDateTimeAccordingToFormat({
    timeStamp: timestamp,
    format: DATE_TIME_FORMAT.DD_MM_YYYY_HH_MM_SS
  });
  
  // Get currency name from coin - coin should already be a readable name since we filter out "@" prefixed ones
  const currency = coin;
  
  // Determine position/action
  // Side "A" = Ask (Sell), Side "B" = Bid (Buy)
  // reduceOnly = closing a position
  const isCloseLong = reduceOnly || (side === "A" && !isPositionTpsl);
  const positionAction = isCloseLong ? "Close Long" : "Long";
  const positionColor = isCloseLong ? "text-pink-500" : "text-green-500";
  
  // Format values
  const value1 = limitPx && parseFloat(limitPx) > 0 
    ? addDecimals(parseFloat(limitPx), 5) 
    : "--";
  const value2 = triggerPx && parseFloat(triggerPx) > 0 
    ? addDecimals(parseFloat(triggerPx), 5) 
    : "--";
  
  // Format amount/quantity
  const amountQuantity = orderType === "Market" 
    ? "Market" 
    : sz && parseFloat(sz) > 0
    ? parseFloat(sz).toLocaleString('en-US', { maximumFractionDigits: 0 })
    : "--";
  
  // Confirmation - based on order status
  const confirmation = status === "filled" || status === "Filled" ? "Yes" : "No";
  
  // Order status with styling
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "filled") return "text-green-400";
    if (statusLower === "open") return "text-yellow-400";
    if (statusLower === "canceled" || statusLower === "cancelled") return "text-red-400";
    if (statusLower.includes("rejected")) return "text-red-400";
    return "text-gray-400";
  };
  
  const statusColor = getStatusColor(status);
  // Format status: capitalize first letter and handle camelCase
  const formattedStatus = status
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  // Format size - show original size for all orders
  const formattedSize = origSz && parseFloat(origSz) > 0
    ? parseFloat(origSz).toLocaleString('en-US', { maximumFractionDigits: 5, minimumFractionDigits: 5 })
    : "--";
  
  // Calculate filled size as a number first
  const filledSizeNum = origSz && parseFloat(origSz) > 0
    ? (() => {
        const orig = parseFloat(origSz);
        const remaining = sz ? parseFloat(sz) : 0;
        return orig - remaining;
      })()
    : 0;
  
  // Format filled size for display
  const filledSize = filledSizeNum > 0
    ? filledSizeNum.toLocaleString('en-US', { maximumFractionDigits: 5, minimumFractionDigits: 5 })
    : "0";
  
  // Order value calculation:
  // - For Market orders: show "--" (execution price unknown at order time)
  // - For Filled Limit orders: show "--" (already executed, value not shown)
  // - For Open/Canceled/Rejected Limit orders: show limitPx * origSz (full potential value)
  const orderValue = orderType === "Market" || status.toLowerCase() === "filled"
    ? "--"
    : limitPx && parseFloat(limitPx) > 0 && origSz && parseFloat(origSz) > 0
    ? `${(parseFloat(limitPx) * parseFloat(origSz)).toLocaleString('en-US', { maximumFractionDigits: 2 })} USDC`
    : "--";
  
  // Format price - show "Market" for Market orders, otherwise show limitPx with formatting
  const formattedPrice = orderType === "Market"
    ? "Market"
    : limitPx && parseFloat(limitPx) > 0 
    ? (() => {
        const price = parseFloat(limitPx);
        // Format with 5 decimals and add comma separators
        return price.toLocaleString('en-US', { 
          minimumFractionDigits: 5, 
          maximumFractionDigits: 5 
        });
      })()
    : triggerPx && parseFloat(triggerPx) > 0
    ? (() => {
        const price = parseFloat(triggerPx);
        return price.toLocaleString('en-US', { 
          minimumFractionDigits: 5, 
          maximumFractionDigits: 5 
        });
      })()
    : "--";
  
  // Reduce Only
  const reduceOnlyText = reduceOnly ? "Yes" : "No" ;
  
  return (
    <div className="grid gap-1 px-2 sm:px-3 py-2 text-xs border-b border-gray-800 hover:bg-gray-900/50 transition-colors" style={{ gridTemplateColumns: '2fr repeat(11, 1fr)' }}>
      <div className="text-gray-300 truncate" title={formattedDateTime}>
        {formattedDateTime}
      </div>
      <div className="text-gray-300 truncate" title={orderType || "Limit"}>
        {orderType}
      </div>
      <div className={`${positionColor} font-medium truncate`} title={currency}>
        {coin}
      </div>
      <div className={`${positionColor} font-medium truncate`} title={positionAction}>
        {positionAction}
      </div>
      <div className="text-gray-300 truncate" title={formattedSize}>
        {addDecimals(sz, 5) === "0.00000" ? "--" : addDecimals(sz, 5)}
      </div>
      <div className="text-gray-300 truncate" title={filledSize}>
        {addDecimals(filledSize, 5) === "0.00000" ? "--" : addDecimals(filledSize, 5)}
      </div>
      <div className="text-gray-300 truncate" title={orderValue}>
        {orderValue}
      </div>
      <div className="text-gray-300 truncate" title={formattedPrice}>
        {formattedPrice}
      </div>
      <div className="text-gray-300 truncate" title={reduceOnlyText}>
        {reduceOnlyText}
      </div>
      <div className="text-gray-300 truncate" title="N/A">
        N/A
      </div>
      <div className={`${statusColor} truncate`} title={formattedStatus}>
        {formattedStatus}
      </div>
      <div className="text-gray-300 truncate" title={oid.toString()}>
        {oid}
      </div>
    </div>
  );
};

// Open Orders Row Component
interface OpenOrdersRowProps {
  order: OpenOrder;
  onCancel?: (oid: number) => void;
}

const OpenOrdersRow = ({ order, onCancel }: OpenOrdersRowProps) => {
  // Format date and time: "DD/MM/YYYY - HH:mm:ss"
  const formattedDateTime = formatDateTimeAccordingToFormat({
    timeStamp: order.timestamp,
    format: DATE_TIME_FORMAT.DD_MM_YYYY_HH_MM_SS
  });

  // Determine direction based on side
  // side: "B" = Buy = Long, side: "A" = Sell = Short
  const direction = order.side === "B" ? "Long" : "Short";
  const directionColor = direction === "Long" ? "text-teal-400" : "text-red-500";

  // Format coin - display as-is
  const coin = order.coin;

  // Format size
  const size = parseFloat(order.sz).toFixed(5);

  // Format original size
  const originalSize = parseFloat(order.origSz).toFixed(5);

  // Calculate order value: limitPx * sz in USDC
  const orderValue = order.limitPx && parseFloat(order.limitPx) > 0 && order.sz && parseFloat(order.sz) > 0
    ? `${(parseFloat(order.limitPx) * parseFloat(order.sz)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`
    : "--";

  // Format price - remove decimals if it's a whole number, otherwise show with appropriate precision
  const price = order.limitPx && parseFloat(order.limitPx) > 0
    ? parseFloat(order.limitPx).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })
    : "--";

  // Reduce Only
  const reduceOnlyText = order.reduceOnly ? "Yes" : "No";

  // Trigger Conditions
  const triggerConditions = order.triggerCondition || "N/A";

  // TP/SL - always "--" based on image
  const tpSl = "--";

  // Order Type
  const orderType = order.orderType || "Limit";

  return (
    <div className="grid gap-1 px-2 sm:px-3 py-2 text-xs border-b border-gray-800 hover:bg-gray-900/50 transition-colors" style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}>
      <div className="text-gray-300 truncate" title={formattedDateTime}>
        {formattedDateTime}
      </div>
      <div className="text-gray-300 truncate" title={orderType}>
        {orderType}
      </div>
      <div className={`${directionColor} font-medium truncate`} title={coin}>
        {coin}
      </div>
      <div className={`${directionColor} font-medium truncate`} title={direction}>
        {direction}
      </div>
      <div className="text-gray-300 truncate" title={size}>
        {size}
      </div>
      <div className="text-gray-300 truncate" title={originalSize}>
        {originalSize}
      </div>
      <div className="text-gray-300 truncate" title={orderValue}>
        {orderValue}
      </div>
      <div className="text-gray-300 truncate" title={price}>
        {price}
      </div>
      <div className="text-gray-300 truncate" title={reduceOnlyText}>
        {reduceOnlyText}
      </div>
      <div className="text-gray-300 truncate" title={triggerConditions}>
        {triggerConditions}
      </div>
      <div className="text-gray-300 truncate" title={tpSl}>
        {tpSl}
      </div>
      <div className="text-teal-400 hover:text-teal-300 cursor-pointer truncate" title="Cancel" onClick={() => onCancel?.(order.oid)}>
        Cancel
      </div>
    </div>
  );
};

// Online Indicator Component
const OnlineIndicator = () => {
  return (
    <div className="absolute bottom-2 left-2 sm:left-3 z-10">
      <div className="flex items-center gap-1.5 text-xs">
        <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
        <span className="text-gray-400 hidden sm:inline">Online</span>
      </div>
    </div>
  );
};

// ==================== Main Component ====================

export const BottomPanel = () => {
  const [activeTab, setActiveTab] = useState<TabValue>("positions");
  const [markPrices, setMarkPrices] = useState<Record<string, string>>({});
  const [isHydrated, setIsHydrated] = useState(false);
  const { address: userAddress } = useAccount();
  const { setBalances,setUserPositions,balances, isBalancesLoading, getAllBalances, getHistoricalOrders ,isHistoricalOrdersLoading ,historicalOrders ,isError,setOpenOrders,userFundings, isUserFundingsLoading, getUserFundings, tradeHistory, isTradeHistoryLoading, getUserTradeHistory, userOpenOrders, isUserOpenOrdersLoading, getUserOpenOrders, userPositions, isUserPositionsLoading, getUserPositions} = useBottomPanelStore();

  // Hydration check to prevent SSR/client mismatch
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const openOrdersCount = userOpenOrders?.length || 0;
  
  const positionsCount = userPositions?.length || 0;
  
  const tabs: Tab[] = [
    { label: "Balances", value: "balances", count: 1 },
    { label: "Positions", value: "positions", count: positionsCount > 0 ? positionsCount : undefined },
    { label: "Open Orders", value: "openorders", count: openOrdersCount > 0 ? openOrdersCount : undefined },
    { label: "TWAP", value: "twap" },
    { label: "Trade History", value: "tradehistory" },
    { label: "Funding History", value: "fundinghistory" },
    { label: "Order History", value: "orderhistory" },
  ];

  useEffect(() => {
    if (!infoClient || !userAddress) return;

    if (activeTab === "balances") {
      getAllBalances({ publicKey: userAddress });
    }

    if (activeTab === "orderhistory") {
      getHistoricalOrders({ publicKey: userAddress });
    }

    if (activeTab === "fundinghistory") {
      getUserFundings({ publicKey: userAddress });
    }
    
    if (activeTab === "tradehistory") {
      getUserTradeHistory({ publicKey: userAddress });
    }

    if (activeTab === "openorders") {
      getUserOpenOrders({ publicKey: userAddress });
    }

    if (activeTab === "positions") {
      getUserPositions({ publicKey: userAddress });
    }

    
  
    subscriptionClient.webData2({ user: userAddress as `0x${string}`},(resp) => {
      const ch = resp?.clearinghouseState ?? {};
      const marginSummary = ch?.marginSummary ?? {};

      const rows: Balance[] = [
        {
          coin: "USDC (Perps)",
          total_balance: `${addDecimals(marginSummary?.accountValue ?? 0)} USDC`,
          available_balance: `${addDecimals((((Number(marginSummary.accountValue) - (Number(marginSummary.totalMarginUsed)) - 0.01) || 0)))} USDC`,
          usdc_value: addDecimals(marginSummary?.accountValue ?? 0),
        },
      ];

      setBalances(rows);
    });
    
    
    

subscriptionClient.openOrders({ user: userAddress }, (orders) => {
      // console.log("orders 1",orders);
      setOpenOrders(orders.orders);
    }); 
// subscriptionClient.userFills({ user: userAddress }, (fills) => {
//   console.log("orders fills",fills);
//     }); 
subscriptionClient.clearinghouseState({ user: userAddress }, (fundings) => {

  console.log("fundings",fundings);
      setUserPositions(fundings.clearinghouseState.assetPositions);
    }); 
   

  }, [infoClient, userAddress, activeTab]);


  return (
    <div className="relative h-full bg-gray-950 border-t border-gray-800 flex flex-col min-h-0 max-h-full overflow-hidden">
      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-gray-800 px-2 sm:px-3 shrink-0">
        {/* Tabs List - Scrollable on mobile */}
        <div className="flex-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-0 min-w-max">
            {tabs.map((tab) => (
              <TabButton
                key={tab.value}
                isActive={activeTab === tab.value}
                onClick={() => setActiveTab(tab.value)}
                count={tab.count}
              >
                {tab.label}
              </TabButton>
            ))}
          </div>
        </div>

        {/* Filter Button */}
        <div className="shrink-0 ml-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-7 text-gray-400 hover:text-gray-300 gap-1"
          >
            <span className="hidden sm:inline">Filter</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Positions Tab */}
        <TabContent value="positions" activeTab={activeTab}>
          <div className="flex-1 overflow-auto relative">
            <PositionsTableHeader />
            {!isHydrated ? (
              <PositionsTableShimmer />
            ) : isUserPositionsLoading ? (
              <PositionsTableShimmer />
            ) : !userAddress ? (
              <EmptyState message="Connect wallet to view positions" />
            ) : userPositions && userPositions.length > 0 ? (
              <div className="pb-10">
                {userPositions.map((position, index) => (
                  <PositionsRow
                    key={`${position.position.coin}-${index}`}
                    position={position}
                    markPrice={markPrices[position.position.coin]}
                  />
                ))}
              </div>
            ) : (
              <EmptyState message="No open positions yet" />
            )}
          </div>
        </TabContent>

        {/* Balances Tab */}
        <TabContent value="balances" activeTab={activeTab}>
          <BalancesTableHeader />
          {isBalancesLoading ? (
            <BalancesTableShimmer />
          ) : !userAddress ? (
            <EmptyState message="Connect wallet to view balances" />
          ) : balances && balances.length > 0 ? (
            <div className="overflow-auto">
              {balances.map((balance, index) => (
                <BalanceRow 
                  key={index} 
                  coin={balance.coin}
                  total_balance={`${balance.total_balance}`}
                  available_balance={balance.available_balance}
                  usdc_value={balance.usdc_value}

                />
              ))}
            </div>
          ) : (
            <EmptyState message="No balances found" />
          )}
        </TabContent>

        {/* Open Orders Tab */}
        <TabContent value="openorders" activeTab={activeTab}>
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Cancel All Button */}
            {/* {userOpenOrders && userOpenOrders.length > 0 && (
              <div className="flex justify-end px-2 sm:px-3 py-2 border-b border-gray-800">
                <button
                  className="text-xs text-teal-400 hover:text-teal-300 cursor-pointer transition-colors"
                  onClick={() => {
                    // TODO: Implement cancel all functionality
                    console.log("Cancel all orders");
                  }}
                >
                  Cancel All
                </button>
              </div>
            )} */}
            <div className="flex-1 overflow-auto relative">
              <OpenOrdersTableHeader />
              {isUserOpenOrdersLoading ? (
                <OpenOrdersTableShimmer />
              ) : !userAddress ? (
                <EmptyState message="Connect wallet to view open orders" />
              ) : userOpenOrders && userOpenOrders.length > 0 ? (
                <div className="pb-10">
                  {userOpenOrders.map((order, index) => (
                    <OpenOrdersRow
                      key={order.oid || index}
                      order={order}
                      onCancel={(oid) => {
                        // TODO: Implement cancel order functionality
                        console.log("Cancel order", oid);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message="No open orders" />
              )}
            </div>
          </div>
        </TabContent>

        {/* TWAP Tab */}
        <TabContent value="twap" activeTab={activeTab}>
          <EmptyState message="No TWAP orders" />
        </TabContent>

        {/* Trade History Tab */}
        {activeTab === "tradehistory" && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto relative">
              <TradeHistoryTableHeader />
              {isTradeHistoryLoading ? (
                <TradeHistoryTableShimmer />
              ) : !userAddress ? (
                <EmptyState message="Connect wallet to view trade history" />
              ) : tradeHistory && tradeHistory.length > 0 ? (
                <div className="pb-10">
                  {tradeHistory.slice().reverse().map((trade, index) => (
                    <TradeHistoryRow 
                      key={`${trade.time}-${trade.hash}-${trade.tid}-${index}`} 
                      trade={trade}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message="No trade history" />
              )}
            </div>
            {/* View All Link - Sticky at bottom */}
            {userAddress && (
              <div className="absolute bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800 z-20 shrink-0">
                <a
                  href={`${TRADE_HISTORY_URL}/${userAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-2 sm:px-3 py-2 text-xs text-teal-400 hover:text-teal-300 cursor-pointer transition-colors"
                >
                  View All
                </a>
              </div>
            )}
          </div>
        )}

        {/* Funding History Tab */}
        {activeTab === "fundinghistory" && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto relative">
              <FundingHistoryTableHeader />
              {isUserFundingsLoading ? (
                <FundingHistoryTableShimmer />
              ) : !userAddress ? (
                <EmptyState message="Connect wallet to view funding history" />
              ) : userFundings && userFundings.length > 0 ? (
                <div className="pb-10">
                  {userFundings.slice().reverse().map((funding, index) => (
                    <FundingHistoryRow 
                      key={`${funding.time}-${funding.hash}-${index}`} 
                      funding={funding}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message="No funding history" />
              )}
            </div>
            {/* View All Link - Sticky at bottom */}
            {userAddress && (
              <div className="absolute bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800 z-20 shrink-0">
                <a
                  href={`${FUNDING_HISTORY_URL}/${userAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-2 sm:px-3 py-2 text-xs text-teal-400 hover:text-teal-300 cursor-pointer transition-colors"
                >
                  View All
                </a>
              </div>
            )}
          </div>
        )}

        {/* Order History Tab */}
        {activeTab === "orderhistory" && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto relative">
              <OrderHistoryTableHeader />
              {isHistoricalOrdersLoading ? (
                <OrderHistoryTableShimmer />
              ) : !userAddress ? (
                <EmptyState message="Connect wallet to view order history" />
              ) : historicalOrders && historicalOrders.length > 0 ? (
                <div className="pb-10">
                  {historicalOrders.map((order, index) => (
                    <OrderHistoryRow 
                      key={order.order.oid || index} 
                      timestamp={order.order.timestamp}
                      coin={order.order.coin}
                      reduceOnly={order.order.reduceOnly}
                      side={order.order.side}
                      isPositionTpsl={order.order.isPositionTpsl}
                      limitPx={order.order.limitPx}
                      triggerPx={order.order.triggerPx}
                      orderType={order.order.orderType}
                      sz={order.order.sz}
                      origSz={order.order.origSz || order.order.sz}
                      oid={order.order.oid}
                      status={order.status}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message="No order history" />
              )}
            </div>
            {/* View All Link - Sticky at bottom */}
            {userAddress && (
              <div className="absolute bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800 z-20 shrink-0">
                <a
                  href={`${HISTORICAL_ORDERS_URL}/${userAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-2 sm:px-3 py-2 text-xs text-teal-400 hover:text-teal-300 cursor-pointer transition-colors"
                >
                  View All
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Online Indicator */}
      <OnlineIndicator />
    </div>
  );
};
