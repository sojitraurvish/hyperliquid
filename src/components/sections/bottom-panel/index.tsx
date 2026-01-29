"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronDown, ExternalLink, Pencil } from "lucide-react";
import { infoClient , subscriptionClient, transport, getSymbolConverter} from "@/lib/config/hyperliquied/hyperliquid-client";
import { Subscription } from "@nktkas/hyperliquid";
import { useAccount } from "wagmi";
import { useApiWallet } from "@/hooks/useWallet";
import { useBuilderFee } from "@/hooks/useBuilderFee";
import { useBottomPanelStore } from "@/store/bottom-panel";
import { Balance, HistoricalOrder, FundingHistory, TradeHistory, OpenOrder, Position } from "@/types/bottom-panel";
import { addDecimals, DATE_TIME_FORMAT } from "@/lib/constants";
import moment from "moment";
import { formatDateTimeAccordingToFormat } from "@/lib/date-operation";
import { HISTORICAL_ORDERS_URL, FUNDING_HISTORY_URL, TRADE_HISTORY_URL, EXPLORER_TX_URL } from "@/lib/config";
import { useTradesStore } from "@/store/trades";  
import { appToast } from "@/components/ui/toast";
import { formatPrice } from "@nktkas/hyperliquid/utils";
import AppModal from "@/components/ui/modal";
import { useOrderBookStore } from "@/store/orderbook";
import { useMarketStore } from "@/store/market";
import { errorHandler } from "@/store/errorHandler";
import { PositionTpslModal } from "@/components/sections/portfolio/PositionTpslModal";
import { placePositionTpslOrder, cancelOrdersWithAgent } from "@/lib/services/trading-panel";
// ==================== Types ====================

type TabValue = "balances" | "positions" | "openorders" | "tradehistory" | "fundinghistory" | "orderhistory";

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
  const [gridColumns, setGridColumns] = useState<string>("0.9fr 1fr 1.1fr 1.5fr 1.3fr 1fr");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateGridColumns = () => {
      const width = window.innerWidth;
      if (width >= 1280) {
        // xl: 11 columns (added TP/SL)
        setGridColumns("0.9fr 1fr 1.1fr 1fr 1fr 1.5fr 1fr 1.2fr 1fr 1fr 1.3fr");
      } else if (width >= 1024) {
        // lg: 9 columns (added TP/SL)
        setGridColumns("0.9fr 1fr 1.1fr 1fr 1fr 1.5fr 1fr 1fr 1.3fr");
      } else if (width >= 768) {
        // md: 8 columns (added TP/SL)
        setGridColumns("0.9fr 1fr 1.1fr 1fr 1fr 1.5fr 1fr 1.3fr");
      } else if (width >= 640) {
        // sm: 7 columns (added TP/SL)
        setGridColumns("0.9fr 1fr 1.1fr 1fr 1.5fr 1fr 1.3fr");
      } else {
        // base: 6 columns (added TP/SL)
        setGridColumns("0.9fr 1fr 1.1fr 1.5fr 1.3fr 1fr");
      }
    };

    updateGridColumns();
    window.addEventListener("resize", updateGridColumns);
    return () => window.removeEventListener("resize", updateGridColumns);
  }, []);

  return gridColumns;
};

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = ({ className = "", ...props }: InputProps) => {
  return (
    <input
      className={`flex h-8 w-full rounded-md bg-gray-900/50 border border-gray-800 px-3 py-1 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-950 focus:border-green-400 disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${className}`}
      {...props}
    />
  );
};

// Label Component
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

const Label = ({ className = "", children, ...props }: LabelProps) => {
  return (
    <label
      className={`text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
};

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "ghost" | "outline" | "primary";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  isLoading?: boolean;
  isDisabled?: boolean;
}

const Button = ({ 
  variant = "ghost", 
  size = "md", 
  children, 
  className = "",
  isLoading = false,
  isDisabled = false,
  ...props 
}: ButtonProps) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-950 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed";
  
  const variants = {
    ghost: "bg-transparent text-gray-400 hover:bg-gray-800/50 hover:text-gray-300 cursor-pointer",
    outline: "border border-gray-700 bg-transparent text-gray-400 hover:bg-gray-800/50 hover:text-gray-300 hover:border-gray-600 cursor-pointer",
    primary: "bg-green-400 text-white hover:bg-green-500 cursor-pointer",
  };
  
  const sizes = {
    sm: "h-7 px-2 text-xs",
    md: "h-8 px-3 text-xs sm:text-sm",
    lg: "h-9 px-4 text-sm",
  };
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isDisabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
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
        whitespace-nowrap cursor-pointer
        ${isActive 
          ? "text-white border-b-2 border-green-400" 
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
    { label: "Coin", className: "col-span-1" },
    { label: "Total Balance", className: "col-span-1" },
    { label: "Available Balance", className: "col-span-1" },
    { label: "USDC Value", icon: true, className: "hidden md:col-span-1 md:block" },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-4 gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs text-gray-400 border-b border-gray-800">
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
      <div className="text-green-400 font-medium truncate" title={funding.delta.coin}>
        {funding.delta.coin}
      </div>
      <div className="text-gray-300 truncate" title={size}>
        {size}
      </div>
      <div className="text-green-400 font-medium truncate" title={positionSide}>
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
          className="inline-flex items-center shrink-0 cursor-pointer"
        >
          <ExternalLink className="h-3 w-3 text-gray-500 hover:text-green-400 transition-colors" />
        </a>
      </div>
      <div className="text-green-400 font-medium truncate" title={coin}>
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
          className="inline-flex items-center shrink-0 cursor-pointer"
        >
          {/* <ExternalLink className="h-3 w-3 text-gray-500 hover:text-green-400 transition-colors" /> */}
        </a>
      </div>
    </div>
  );
};

// Limit Close Modal Component
interface LimitCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: Position;
  markPrice?: string;
  agentPrivateKey?: `0x${string}`;
  szDecimals: number;
  onConfirm: (price: string, size: string, percentage: number) => Promise<void>;
}

const LimitCloseModal = ({ 
  isOpen, 
  onClose, 
  position, 
  markPrice,
  szDecimals,
  onConfirm 
}: LimitCloseModalProps) => {
  const pos = position.position;
  const { bids, asks } = useOrderBookStore();
  
  // Calculate mid price from orderbook or use mark price
  const getMidPrice = (): number => {
    if (bids.length > 0 && asks.length > 0) {
      const bestBid = parseFloat(bids[0]?.price || "0");
      const bestAsk = parseFloat(asks[0]?.price || "0");
      if (bestBid > 0 && bestAsk > 0) {
        return (bestBid + bestAsk) / 2;
      }
    }
    // Fallback to mark price or calculate from position
    if (markPrice) {
      return parseFloat(markPrice);
    }
    const posValue = parseFloat(pos.positionValue);
    const posSize = Math.abs(parseFloat(pos.szi));
    return posSize > 0 ? posValue / posSize : 0;
  };

  const midPrice = getMidPrice();
  const currentSize = Math.abs(parseFloat(pos.szi));
  const entryPrice = parseFloat(pos.entryPx);
  
  const [closePrice, setClosePrice] = useState<string>(midPrice > 0 ? midPrice.toFixed(2) : "");
  const [closePercentage, setClosePercentage] = useState<number>(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sizeCurrency, setSizeCurrency] = useState<"currency" | "USDC">("currency");

  // Update close price when modal opens or mid price changes
  // Reset currency display to currency (not USDC) when modal opens
  useEffect(() => {
    if (isOpen && midPrice > 0) {
      setClosePrice(midPrice.toFixed(2));
      setSizeCurrency("currency"); // Reset to show currency by default
    }
  }, [isOpen, midPrice]);

  // Calculate close size based on percentage
  const closeSize = (currentSize * closePercentage) / 100;
  const formattedCloseSize = addDecimals(closeSize, szDecimals);
  
  // Calculate size in USDC (closeSize * midPrice)
  const closeSizeInUSDC = closeSize * midPrice;
  const formattedCloseSizeInUSDC = addDecimals(closeSizeInUSDC, 2);
  
  // Display size based on selected currency
  const displaySize = sizeCurrency === "USDC" 
    ? formattedCloseSizeInUSDC 
    : formattedCloseSize;
  const displayCurrency = sizeCurrency === "USDC" ? "USDC" : pos.coin;

  // Calculate estimated PNL (without fees)
  const calculateEstimatedPNL = (): number => {
    if (!closePrice || parseFloat(closePrice) <= 0 || closeSize <= 0) return 0;
    
    const closePriceNum = parseFloat(closePrice);
    const isLong = parseFloat(pos.szi) > 0;
    
    // PNL = (closePrice - entryPrice) * size for long
    // PNL = (entryPrice - closePrice) * size for short
    const pnlPerUnit = isLong 
      ? (closePriceNum - entryPrice) 
      : (entryPrice - closePriceNum);
    
    return pnlPerUnit * closeSize;
  };

  const estimatedPNL = calculateEstimatedPNL();
  const pnlFormatted = estimatedPNL >= 0 
    ? `$${estimatedPNL.toFixed(2)}`
    : `-$${Math.abs(estimatedPNL).toFixed(2)}`;

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty, numbers, and one decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setClosePrice(value);
    }
  };

  const handlePercentageChange = (value: number[]) => {
    setClosePercentage(value[0]);
  };

  const handleConfirm = async () => {
    if (!closePrice || parseFloat(closePrice) <= 0) {
      appToast.error({ message: "Please enter a valid price" });
      return;
    }

    if (closeSize <= 0) {
      appToast.error({ message: "Close size must be greater than 0" });
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedPrice = formatPrice(closePrice, szDecimals);
      await onConfirm(formattedPrice, formattedCloseSize, closePercentage);
      onClose();
    } catch (error) {
      console.error("Error placing limit close order:", error);
      errorHandler(error, "Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Limit Close"
      className="max-w-md bg-gray-950 border border-gray-800"
      contentClassName="space-y-6"
    >
      <p className="text-sm text-gray-400">
        This will send an order to close your position at the limit price.
      </p>

      {/* Price Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-gray-400">Price (USDC)</Label>
          {midPrice > 0 && (
            <button
              onClick={() => setClosePrice(midPrice.toFixed(2))}
              className="text-xs text-green-400 hover:text-green-300 transition-colors cursor-pointer"
            >
              Mid
            </button>
          )}
        </div>
        <Input
          type="text"
          value={closePrice}
          onChange={handlePriceChange}
          placeholder="0.00"
          className="h-9 text-right font-mono bg-gray-900/50 border border-gray-800 text-white"
        />
        {midPrice > 0 && (
          <p className="text-xs text-gray-500 text-right">
            {midPrice.toFixed(2)} Mid
          </p>
        )}
      </div>

      {/* Size Input */}
      <div className="space-y-2">
        <Label className="text-xs text-gray-400">Size</Label>
        <div className="relative">
          <Input
            value={displaySize}
            readOnly
            className="h-9 text-right font-mono pr-20 bg-gray-900/50 border border-gray-800 text-white"
          />
          <button
            onClick={() => setSizeCurrency(sizeCurrency === "USDC" ? "currency" : "USDC")}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 sm:h-7 px-2 text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
          >
            {displayCurrency} <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Percentage Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-gray-400">Position Size</Label>
          <span className="text-xs text-white font-mono">{closePercentage}%</span>
        </div>
        <div className="relative flex items-center py-2">
          {/* Slider track background */}
          <div className="relative w-full h-2 bg-gray-800 rounded-full">
            {/* Filled portion */}
            <div 
              className="absolute top-0 left-0 h-2 bg-green-400 rounded-full transition-all duration-150 ease-out"
              style={{ width: `${closePercentage}%` }}
            />
            
            {/* Slider markers - positioned behind handle */}
            <div className="absolute inset-0 flex items-center justify-between px-0.5 pointer-events-none">
              {[0, 25, 50, 75, 100].map((val) => (
                <div
                  key={val}
                  className={`w-1.5 h-1.5 rounded-full transition-colors duration-150 ${
                    val <= closePercentage ? "bg-green-400" : "bg-gray-600"
                  }`}
                />
              ))}
            </div>
            
            {/* Custom slider handle */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-950 shadow-lg transition-all duration-150 ease-out hover:scale-110 hover:bg-green-300 z-20 pointer-events-none"
              style={{ left: `calc(${closePercentage}% - 8px)` }}
            />
            
            {/* Slider input - on top for interaction */}
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={closePercentage}
              onChange={(e) => handlePercentageChange([Number(e.target.value)])}
              className="absolute inset-0 w-full h-full cursor-pointer opacity-0 z-30"
              style={{
                WebkitAppearance: 'none',
                appearance: 'none',
                background: 'transparent',
              }}
            />
          </div>
        </div>
        {/* Quick percentage buttons */}
        <div className="flex items-center justify-end gap-2">
          {[25, 50, 75, 100].map((val) => (
            <button
              key={val}
              onClick={() => setClosePercentage(val)}
              className={`text-xs px-2.5 py-1 rounded transition-colors cursor-pointer ${
                closePercentage === val
                  ? "bg-green-400/20 text-green-400 border border-green-400/30"
                  : "text-gray-400 hover:text-green-400 hover:bg-gray-800/50 border border-transparent"
              }`}
            >
              {val}%
            </button>
          ))}
        </div>
      </div>

      {/* Estimated PNL */}
      <div className="space-y-1">
        <p className="text-xs text-gray-400">
          Estimated closed PNL (without fees): <span className={estimatedPNL >= 0 ? "text-green-500" : "text-red-500"}>{pnlFormatted}</span>
        </p>
      </div>

      {/* Confirm Button */}
      <Button
        variant="primary"
        size="lg"
        className="w-full cursor-pointer"
        onClick={handleConfirm}
        isLoading={isSubmitting}
        isDisabled={isSubmitting || !closePrice || parseFloat(closePrice) <= 0 || closeSize <= 0}
      >
        Confirm
      </Button>
    </AppModal>
  );
};

// Positions Row Component
interface PositionsRowProps {
  position: Position;
  markPrice?: string;
  agentPrivateKey?: `0x${string}`;
  openOrders?: OpenOrder[];
}

const PositionsRow = ({ position, markPrice, agentPrivateKey, openOrders = [] }: PositionsRowProps) => {
  const pos = position.position;
  const [szDecimals, setSzDecimals] = useState<number>(5); // Default to 5 if not loaded yet
  const [isLimitCloseModalOpen, setIsLimitCloseModalOpen] = useState(false);
  const [isTpslModalOpen, setIsTpslModalOpen] = useState(false);
  const { placeOrderWithAgent, maxSlippage } = useTradesStore();
  const { markPrice: storeMarkPrice } = useMarketStore();
  const { address: userAddress } = useAccount();
  const { agentWallet, checkApprovalStatus } = useApiWallet({userPublicKey: userAddress as `0x${string}`});
  const { checkBuilderFeeStatus } = useBuilderFee({userPublicKey: userAddress as `0x${string}`});

  // Extract TP/SL orders for this position
  const positionTpsl = useMemo(() => {
    const tpslOrders = openOrders.filter((order) => 
      order.isPositionTpsl && order.coin === pos.coin
    );
    
    const tpsl: { takeProfit?: { triggerPx: string; limitPx?: string; orderId?: string }, stopLoss?: { triggerPx: string; limitPx?: string; orderId?: string } } = {};
    
    tpslOrders.forEach((order) => {
      if (order.orderType?.includes("Take Profit")) {
        tpsl.takeProfit = {
          triggerPx: order.triggerPx,
          limitPx: order.limitPx && order.orderType.includes("Limit") ? order.limitPx : undefined,
          orderId: String(order.oid),
        };
      } else if (order.orderType?.includes("Stop")) {
        tpsl.stopLoss = {
          triggerPx: order.triggerPx,
          limitPx: order.limitPx && order.orderType.includes("Limit") ? order.limitPx : undefined,
          orderId: String(order.oid),
        };
      }
    });
    
    return tpsl;
  }, [openOrders, pos.coin]);
  
  // Fetch coin-specific decimals
  useEffect(() => {
    const fetchDecimals = async () => {
      try {
        const converter = await getSymbolConverter();
        const decimals = converter.getSzDecimals(pos.coin);
        setSzDecimals(decimals ?? 5);
      } catch (error) {
        console.error("Error fetching szDecimals:", error);
        // Don't show toast for decimals fetch errors, just use fallback
        setSzDecimals(5); // Fallback to 5 on error
      }
    };
    fetchDecimals();
  }, [pos.coin]);
  
  // Format coin with leverage (e.g., "BTC 20x")
  const coin = `${pos.coin} ${pos.leverage.value}x`;
  
  // Get numeric position size for comparisons
  const posSize = parseFloat(pos.szi);
  
  // Format size with coin name using coin-specific decimals
  const size = `${addDecimals(posSize, szDecimals)} ${pos.coin}`;
  
  // Format position value
  const positionValue = `$${parseFloat(pos.positionValue).toFixed(2)} USDC`;
  
  // Format entry price (remove decimals if whole number)
  const entryPrice = parseFloat(pos.entryPx).toFixed(2);
  
  // Format mark price (use provided or calculate from position value and size)
  const formattedMarkPrice = markPrice 
    ? parseFloat(markPrice).toFixed(2) : (() => {
        // Calculate approximate mark price from position value and size
        const posValue = parseFloat(pos.positionValue);
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
  
  // Handle close position with market order
  const handleClosePositionMarket = async () => {
    if (!agentPrivateKey) {
      appToast.error({ message: "Please connect your wallet" });
      return;
    }

    const isApprovedBuilderFee = await checkBuilderFeeStatus({
      userPublicKeyParam: userAddress as `0x${string}`,
    });

    const isApproved = await checkApprovalStatus({
      agentPublicKeyParam: agentWallet?.address as `0x${string}`,
      userPublicKeyParam: userAddress as `0x${string}`
    });

    if(!isApprovedBuilderFee){
      appToast.error({ message: "Please approve the builder fee to place order" });
      return;
    }
    
    if(!isApproved){
      appToast.error({ message: "Please approve the agent wallet to place order" });
      return;
    }

    try {
      // Determine if position is long (positive) or short (negative)
      const currentSize = parseFloat(pos.szi);
      if (currentSize === 0) {
        appToast.error({ message: "Position size is zero" });
        return;
      }

      // Determine if short position: negative size = short position
      const isShortPosition = currentSize < 0;
      
      // Use mark price from store for slippage calculation
      if (!storeMarkPrice || storeMarkPrice <= 0) {
        appToast.error({ message: "Unable to get mark price, Wait for a while and try again!" });
        return;
      }
      
      // Calculate slippage amount as percentage of markPrice
      const slippageAmount = storeMarkPrice * (maxSlippage / 100);
      
      // Apply slippage: for buy (closing short) add slippage, for sell (closing long) subtract slippage
      let rawPrice = isShortPosition 
        ? storeMarkPrice + slippageAmount 
        : storeMarkPrice - slippageAmount;
      
      // Format using Hyperliquid's formatPrice utility with szDecimals
      const marketPrice = formatPrice(String(rawPrice), szDecimals);
      
      // Get absolute size for the order and format it
      const orderSize = Math.abs(currentSize);
      const formattedSize = addDecimals(orderSize, szDecimals).toString();
      
      // Place market order to close position
      // b: true = buy (to close short positions), false = sell (to close long positions)
      // Use size directly: if size is negative (short), need to buy (true) to close
      const success = await placeOrderWithAgent({
        agentPrivateKey: agentPrivateKey,
        a: pos.coin,
        b: currentSize < 0, // true for buy (closing short), false for sell (closing long)
        s: formattedSize,
        p: marketPrice,
        r: true, // reduceOnly = true (closing position, prevent opening opposite position)
      });

      if (success) {
        appToast.success({ message: `Position closed successfully` });
      }
    } catch (error) {
      console.error("Error closing position:", error);
      appToast.error({ message: "Failed to close position" });
    }
  };

  // Handle reverse position
  const handleReversePosition = async () => {
    if (!agentPrivateKey) {
      appToast.error({ message: "Please connect your wallet" });
      return;
    }

    const isApprovedBuilderFee = await checkBuilderFeeStatus({
      userPublicKeyParam: userAddress as `0x${string}`,
    });

    const isApproved = await checkApprovalStatus({
      agentPublicKeyParam: agentWallet?.address as `0x${string}`,
      userPublicKeyParam: userAddress as `0x${string}`
    });

    if(!isApprovedBuilderFee){
      appToast.error({ message: "Please approve the builder fee to place order" });
      return;
    }
    
    if(!isApproved){
      appToast.error({ message: "Please approve the agent wallet to place order" });
      return;
    }

    try {
      const currentSize = parseFloat(pos.szi);
      if (currentSize === 0) {
        appToast.error({ message: "Position size is zero" });
        return;
      }

      // Reverse position: open opposite side with double the size
      // If current position is long (positive), reverse to short (sell)
      // If current position is short (negative), reverse to long (buy)
      const reverseSide = currentSize > 0 ? false : true; // Opposite of current position
      const reverseSize = Math.abs(currentSize) * 2; // Double the size to reverse
      
      // Use mark price from store for reverse order
      if (!storeMarkPrice || storeMarkPrice <= 0) {
        appToast.error({ message: "Unable to get mark price, Wait for a while and try again!" });
        return;
      }
      
      // Calculate slippage amount as percentage of markPrice
      const slippageAmount = storeMarkPrice * (maxSlippage / 100);
      
      // Apply slippage: for buy (long) add slippage, for sell (short) subtract slippage
      let rawPrice = reverseSide 
        ? storeMarkPrice + slippageAmount 
        : storeMarkPrice - slippageAmount;
      
      // Format using Hyperliquid's formatPrice utility with szDecimals
      const reversePrice = formatPrice(String(rawPrice), szDecimals);
      
      // Format size
      const formattedSize = addDecimals(reverseSize, szDecimals).toString();

      // Place reverse order
      const success = await placeOrderWithAgent({
        agentPrivateKey: agentPrivateKey,
        a: pos.coin,
        b: reverseSide, // Opposite side of current position
        s: formattedSize,
        p: reversePrice,
        r: false, // Not reduce only (opening new position)
        tif: "FrontendMarket",
      });

      if (success) {
        appToast.success({ message: `Reverse position order placed successfully` });
      }
    } catch (error) {
      console.error("Error reversing position:", error);
      appToast.error({ message: "Failed to reverse position" });
    }
  };

  // Handle close position with limit order
  const handleClosePositionLimit = async (price: string, size: string, percentage: number) => {
    if (!agentPrivateKey) {
      appToast.error({ message: "Please connect your wallet" });
      return;
    }

    const isApprovedBuilderFee = await checkBuilderFeeStatus({
      userPublicKeyParam: userAddress as `0x${string}`,
    });

    const isApproved = await checkApprovalStatus({
      agentPublicKeyParam: agentWallet?.address as `0x${string}`,
      userPublicKeyParam: userAddress as `0x${string}`
    });

    if(!isApprovedBuilderFee){
      appToast.error({ message: "Please approve the builder fee to place order" });
      return;
    }
    
    if(!isApproved){
      appToast.error({ message: "Please approve the agent wallet to place order" });
      return;
    }

    try {
      const currentSize = parseFloat(pos.szi);
      if (currentSize === 0) {
        appToast.error({ message: "Position size is zero" });
        return;
      }

      // Place limit order to close position
      // b: true = buy (to close short positions), false = sell (to close long positions)
      const success = await placeOrderWithAgent({
        agentPrivateKey: agentPrivateKey,
        a: pos.coin,
        b: currentSize < 0, // true for buy (closing short), false for sell (closing long)
        s: size,
        p: price,
        r: true, // reduceOnly = true (closing position, prevent opening opposite position)
        tif: "Gtc", // Good till cancel for limit orders
      });

      if (success) {
        appToast.success({ message: `Limit close order placed successfully` });
      }
    } catch (error) {
      console.error("Error placing limit close order:", error);
      appToast.error({ message: "Failed to place limit close order" });
      throw error;
    }
  };

  const gridColumns = usePositionsGridColumns();

  return (
    <div 
      className="grid gap-2 sm:gap-3 md:gap-4 px-2 sm:px-3 py-2 text-xs sm:text-sm border-b border-gray-800 hover:bg-gray-900/50 transition-colors"
      style={{ gridTemplateColumns: gridColumns }}
    >
      {/* Coin */}
      <div>
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${posSize > 0 ? "text-green-500 bg-green-500/20" :"text-red-500 bg-red-500/20"}`}>
          {coin}
        </span>
      </div>
      
      {/* Size */}
      <div className={`text-gray-300 truncate ${posSize > 0 ? "text-green-500" :"text-red-500"}`} title={size}>
        {size.replace("-","")}
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
        {formattedMarkPrice.replace("-","")}
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
          className="inline-flex items-center shrink-0 cursor-pointer"
        >
          {/* <ExternalLink className="h-3 w-3 text-gray-500 hover:text-green-400 transition-colors" /> */}
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
            className="inline-flex items-center shrink-0 cursor-pointer"
          >
            {/* <Pencil className="h-3 w-3 text-gray-500 hover:text-green-400 transition-colors" /> */}
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
          onClick={() => setIsLimitCloseModalOpen(true)}
          className="text-green-400 hover:text-green-300 cursor-pointer transition-colors"
        >
          Limit
        </button>
        <span className="text-gray-600">|</span>
        <button
          onClick={handleClosePositionMarket}
          className="text-green-400 hover:text-green-300 cursor-pointer transition-colors"
        >
          Market
        </button>
        <span className="text-gray-600">|</span>
        <button
          onClick={handleReversePosition}
          className="text-green-400 hover:text-green-300 cursor-pointer transition-colors"
        >
          Reverse
        </button>
      </div>

      {/* TP/SL */}
      <div className="flex items-center gap-2">
        {(() => {
          const tpPrice = positionTpsl.takeProfit?.triggerPx;
          const slPrice = positionTpsl.stopLoss?.triggerPx;
          const displayTp = tpPrice ? formatPrice(tpPrice, 2) : "--";
          const displaySl = slPrice ? formatPrice(slPrice, 2) : "--";
          return (
            <>
              <span className="text-sm text-gray-300">
                {displayTp} / {displaySl}
              </span>
              <button
                onClick={() => setIsTpslModalOpen(true)}
                className="text-green-400 hover:text-green-300 transition-colors shrink-0"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </>
          );
        })()}
      </div>

      {/* Limit Close Modal */}
      <LimitCloseModal
        isOpen={isLimitCloseModalOpen}
        onClose={() => setIsLimitCloseModalOpen(false)}
        position={position}
        markPrice={markPrice}
        agentPrivateKey={agentPrivateKey}
        szDecimals={szDecimals}
        onConfirm={handleClosePositionLimit}
      />

      {/* TP/SL Modal */}
      {agentPrivateKey && (
        <PositionTpslModal
          isOpen={isTpslModalOpen}
          onClose={() => setIsTpslModalOpen(false)}
          position={position}
          onConfirm={async (params) => {
            if (!agentPrivateKey || !userAddress) {
              appToast.error({ message: "Missing required information" });
              return;
            }

            try {
              const isLong = parseFloat(pos.szi) > 0;
              // If orderSize is 0, it means Configure Amount was not selected (use full position)
              // If orderSize is provided and > 0, use that specific size
              const sizeStr = params.orderSize === 0 
                ? "0" 
                : params.orderSize && params.orderSize > 0
                  ? addDecimals(params.orderSize, szDecimals)
                  : "0";

              await placePositionTpslOrder({
                agentPrivateKey: agentPrivateKey,
                a: pos.coin,
                b: isLong,
                s: sizeStr,
                takeProfitPrice: params.takeProfitPrice,
                stopLossPrice: params.stopLossPrice,
                takeProfitLimitPrice: params.takeProfitLimitPrice,
                stopLossLimitPrice: params.stopLossLimitPrice,
              });

              appToast.success({ title: "TP/SL orders placed successfully" });
            } catch (error: any) {
              console.error("Error placing TP/SL orders:", error);
              appToast.error({ message: error?.message || "Failed to place TP/SL orders" });
              throw error;
            }
          }}
          existingTpsl={positionTpsl}
          onCancelTpsl={async (type: "tp" | "sl") => {
            if (!agentPrivateKey || !userAddress) {
              appToast.error({ message: "Missing required information" });
              return;
            }

            try {
              const orderToCancel = type === "tp" ? positionTpsl.takeProfit : positionTpsl.stopLoss;
              if (!orderToCancel?.orderId) return;

              await cancelOrdersWithAgent({
                agentPrivateKey: agentPrivateKey,
                orders: [{ orderId: orderToCancel.orderId, a: pos.coin }],
              });

              appToast.success({ title: `${type === "tp" ? "Take Profit" : "Stop Loss"} order canceled` });
            } catch (error: any) {
              console.error("Error canceling TP/SL order:", error);
              appToast.error({ message: error?.message || "Failed to cancel order" });
              throw error;
            }
          }}
        />
      )}
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
      <div className="absolute inset-0 bg-linear-to-r from-transparent via-gray-700/50 to-transparent animate-shimmer" />
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
          className="grid grid-cols-3 md:grid-cols-4 gap-1 sm:gap-2 px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm border-b border-gray-800"
        >
          {[1, 2, 3, 4].map((colIndex) => (
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
    <div className="grid grid-cols-3 md:grid-cols-4 gap-1 sm:gap-2 px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm border-b border-gray-800 hover:bg-gray-900/50 transition-colors">
      <div className="col-span-1 text-gray-300 font-medium">
        {coin}
      </div>
      <div className="col-span-1 text-gray-300">
        {total_balance}
      </div>
      <div className={`col-span-1 text-gray-300 ${isAvailableEqualTotal ? "decoration-dotted underline" : ""}`}>
        {available_balance}
      </div>
      <div className="hidden md:col-span-1 md:block text-gray-300">
        {usdc_value}
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
  onCancel?: (oid: number, coin: string) => void;
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
  const directionColor = direction === "Long" ? "text-green-400" : "text-red-500";

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
      <div className="text-green-400 hover:text-green-300 cursor-pointer truncate" title="Cancel" onClick={() => onCancel?.(order.oid, order.coin)}>
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
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
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
  const { agentPrivateKey, agentWallet, checkApprovalStatus } = useApiWallet({userPublicKey: userAddress as `0x${string}`});
  const { checkBuilderFeeStatus } = useBuilderFee({userPublicKey: userAddress as `0x${string}`});
  const { 
    setBalances,
    setUserPositions,
    balances, 
    isBalancesLoading, 
    getAllBalances, 
    getHistoricalOrders,
    isHistoricalOrdersLoading,
    historicalOrders,
    isError,
    setOpenOrders,
    userFundings, 
    isUserFundingsLoading, 
    getUserFundings, 
    tradeHistory, 
    isTradeHistoryLoading, 
    getUserTradeHistory, 
    userOpenOrders, 
    isUserOpenOrdersLoading, 
    getUserOpenOrders, 
    userPositions, 
    isUserPositionsLoading, 
    getUserPositions,
    getAllData,
    isLoading
  } = useBottomPanelStore();
  const { selectedMarket } = useMarketStore();

  console.log("userPositions",userPositions);
  
  // Hydration check to prevent SSR/client mismatch
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const openOrdersCount = userOpenOrders?.length || 0;
  
  // Filter positions by selected market coin - if market is selected, show only that market's positions
  // If no market is selected, show no positions
  const filteredPositions = useMemo(() => {
    return selectedMarket?.coin 
      ? (userPositions?.filter(position => position.position.coin === selectedMarket.coin) || [])
      : [];
  }, [selectedMarket?.coin, userPositions]);
  
  // Count always shows all open positions regardless of market selection
  const positionsCount = userPositions?.length || 0;
  
  const tabs: Tab[] = [
    { label: "Balances", value: "balances", count: 1 },
    { label: "Positions", value: "positions", count: positionsCount > 0 ? positionsCount : undefined },
    { label: "Open Orders", value: "openorders", count: openOrdersCount > 0 ? openOrdersCount : undefined },
    { label: "Trade History", value: "tradehistory" },
    { label: "Funding History", value: "fundinghistory" },
    { label: "Order History", value: "orderhistory" },
  ];

  // Load data based on active tab - use individual calls for better UX (only load what's needed)
  // Note: If you want to load all data in parallel, use getAllData() from the store instead
  useEffect(() => {
    if (!infoClient || !userAddress) return;

    const loadTabData = async () => {
      switch (activeTab) {
        case "balances":
          await getAllBalances({ publicKey: userAddress });
          break;
        case "orderhistory":
          await getHistoricalOrders({ publicKey: userAddress });
          break;
        case "fundinghistory":
          await getUserFundings({ publicKey: userAddress });
          break;
        case "tradehistory":
          await getUserTradeHistory({ publicKey: userAddress });
          break;
        case "openorders":
          await getUserOpenOrders({ publicKey: userAddress });
          break;
        case "positions":
          await getUserPositions({ publicKey: userAddress });
          break;
      }
    };

    loadTabData();
  }, [infoClient, userAddress, activeTab, getAllBalances, getHistoricalOrders, getUserFundings, getUserTradeHistory, getUserOpenOrders, getUserPositions]);

  // Setup subscriptions for real-time updates
  useEffect(() => {
    if (!userAddress) return;

    let webDataSubscription: Subscription | null = null;
    let openOrdersSubscription: Subscription | null = null;
    let clearinghouseSubscription: Subscription | null = null;

    const setupSubscriptions = async () => {
      try {
        // WebData2 subscription for balances
        webDataSubscription = await subscriptionClient.webData2(
          { user: userAddress as `0x${string}` },
          (resp) => {
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
          }
        );

        // Open orders subscription
        openOrdersSubscription = await subscriptionClient.openOrders(
          { user: userAddress },
          (orders) => {
            setOpenOrders(orders.orders);
          }
        );

        // Clearinghouse state subscription for positions
        clearinghouseSubscription = await subscriptionClient.clearinghouseState(
          { user: userAddress },
          (fundings) => {
            setUserPositions(fundings.clearinghouseState.assetPositions);
          }
        );
      } catch (error) {
        console.error("Error setting up subscriptions:", error);
        errorHandler(error, "Failed to load account data");
      }
    };

    setupSubscriptions();

    // Cleanup subscriptions on unmount
    return () => {
      try {
        webDataSubscription?.unsubscribe();
        openOrdersSubscription?.unsubscribe();
        clearinghouseSubscription?.unsubscribe();
      } catch (error) {
        console.error("Error unsubscribing:", error);
        // Don't show toast for unsubscribe errors
      }
    };
  }, [userAddress, setBalances, setOpenOrders, setUserPositions]);

  const { cancelOrdersWithAgent, isCancellingOrdersWithAgentLoading } = useTradesStore();

  useEffect(() => {
    if (isCancellingOrdersWithAgentLoading) {
      appToast.info({ message: "Cancelling orders..." });
    } 
  }, [isCancellingOrdersWithAgentLoading]);

  // const handleCancelAllOrders = async () => {
  //   if (!userAddress || !userOpenOrders || userOpenOrders.length === 0) return;
    
  //   const success = await cancelOrdersWithAgent({
  //     agentPrivateKey: userAddress, 
  //     orders: userOpenOrders.map((order) => ({orderId: order.oid.toString(), a: order.coin}))
  //   });
    
  //   if (success) {
  //     setOpenOrders([]);
  //   }
  // }

  const handleCancelOrder = async ({agentPrivateKey, oid, coin}: { agentPrivateKey: `0x${string}`, oid: number, coin: string}) => {
    if (!userAddress) return;
    
    const success = await cancelOrdersWithAgent({
      agentPrivateKey: agentPrivateKey,
      orders: [{ orderId: oid.toString(), a: coin }]
    });
    
    if (success) {
      appToast.success({ message: "Order cancelled successfully" });
    } else {
      appToast.error({ message: "Failed to cancel order" });
    }
  };

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
            ) : filteredPositions && filteredPositions.length > 0 ? (
              <div className="pb-10">
                {filteredPositions.map((position, index) => (
                  <PositionsRow
                    key={`${position.position.coin}-${index}`}
                    position={position}
                    markPrice={markPrices[position.position.coin]}
                    agentPrivateKey={agentPrivateKey as `0x${string}` | undefined}
                    openOrders={userOpenOrders || undefined}
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
                  className="text-xs text-green-400 hover:text-green-300 cursor-pointer transition-colors"
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
                      onCancel={(oid, coin) => {
                        if (agentPrivateKey) {
                          handleCancelOrder({agentPrivateKey: agentPrivateKey as `0x${string}`, oid, coin});
                        }
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
                  className="block px-2 sm:px-3 py-2 text-xs text-green-400 hover:text-green-300 cursor-pointer transition-colors"
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
                  className="block px-2 sm:px-3 py-2 text-xs text-green-400 hover:text-green-300 cursor-pointer transition-colors"
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
                  className="block px-2 sm:px-3 py-2 text-xs text-green-400 hover:text-green-300 cursor-pointer transition-colors"
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
