"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";

// ==================== Modular UI Components ====================

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline" | "success" | "danger" | "primary";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const Button = ({ 
  variant = "default", 
  size = "md", 
  children, 
  className = "",
  ...props 
}: ButtonProps) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    default: "bg-gray-800 text-gray-300 hover:bg-gray-700",
    ghost: "bg-transparent text-gray-400 hover:bg-gray-800/50 hover:text-gray-300",
    outline: "border border-gray-700 bg-transparent text-gray-400 hover:bg-gray-800/50 hover:text-gray-300 hover:border-gray-600",
    success: "bg-teal-400 text-white hover:bg-teal-500",
    danger: "bg-red-500 text-white hover:bg-red-600",
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

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = ({ className = "", ...props }: InputProps) => {
  return (
    <input
      className={`flex h-8 w-full rounded-md bg-gray-800/50 border-0 px-3 py-1 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-gray-950 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
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

// Checkbox Component
interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  id: string;
}

const Checkbox = ({ id, className = "", ...props }: CheckboxProps) => {
  return (
    <input
      type="checkbox"
      id={id}
      className={`h-3.5 w-3.5 rounded border-gray-600 bg-gray-800 text-teal-400 focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-gray-950 cursor-pointer ${className}`}
      {...props}
    />
  );
};

// Slider Component
interface SliderProps {
  defaultValue?: number[];
  max?: number;
  step?: number;
  value?: number[];
  onChange?: (value: number[]) => void;
  className?: string;
}

const Slider = ({ 
  defaultValue = [0], 
  max = 100, 
  step = 1,
  value,
  onChange,
  className = "" 
}: SliderProps) => {
  const [internalValue, setInternalValue] = useState(defaultValue[0] || 0);
  const currentValue = value ? value[0] : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onChange?.([newValue]);
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <input
        type="range"
        min="0"
        max={max}
        step={step}
        value={currentValue}
        onChange={handleChange}
        className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
        style={{
          background: `linear-gradient(to right, #2dd4bf 0%, #2dd4bf ${(currentValue / max) * 100}%, #1f2937 ${(currentValue / max) * 100}%, #1f2937 100%)`
        }}
      />
    </div>
  );
};

// ==================== Trading Panel Sub-Components ====================

// Trading Mode Tabs Component
interface TradingModeTabsProps {
  activeMode: string;
  onModeChange: (mode: string) => void;
}

const TradingModeTabs = ({ activeMode, onModeChange }: TradingModeTabsProps) => {
  const modes = ["Cross", "20x", "One-Way"];
  
  return (
    <div className="p-2 sm:p-3 border-b border-gray-800">
      <div className="grid grid-cols-3 gap-1 bg-gray-800/50 p-0.5 rounded-md">
        {modes.map((mode) => (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            className={`h-7 text-xs rounded transition-colors ${
              activeMode === mode
                ? "bg-gray-800 text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  );
};

// Order Type Tabs Component
interface OrderTypeTabsProps {
  activeType: string;
  onTypeChange: (type: string) => void;
}

const OrderTypeTabs = ({ activeType, onTypeChange }: OrderTypeTabsProps) => {
  const types = ["Market", "Limit", "Pro"];
  
  return (
    <div className="px-2 sm:px-3 py-2 border-b border-gray-800">
      <div className="flex gap-3 sm:gap-4">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => onTypeChange(type)}
            className={`relative h-6 px-0 text-xs transition-colors focus:outline-none ${
              activeType === type
                ? "text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {type}
            {activeType === type && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400" />
            )}
            {type === "Pro" && (
              <ChevronDown className="inline-block h-3 w-3 ml-1" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// Buy/Sell Buttons Component
interface BuySellButtonsProps {
  activeSide: "buy" | "sell";
  onSideChange: (side: "buy" | "sell") => void;
}

const BuySellButtons = ({ activeSide, onSideChange }: BuySellButtonsProps) => {
  return (
    <div className="p-2 sm:p-3 border-b border-gray-800">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onSideChange("buy")}
          className={`h-8 sm:h-9 text-xs sm:text-sm font-medium rounded-md transition-colors ${
            activeSide === "buy"
              ? "bg-teal-400 text-white hover:bg-teal-500"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
          }`}
        >
          Buy / Long
        </button>
        <button
          onClick={() => onSideChange("sell")}
          className={`h-8 sm:h-9 text-xs sm:text-sm font-medium rounded-md transition-colors ${
            activeSide === "sell"
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
          }`}
        >
          Sell / Short
        </button>
      </div>
    </div>
  );
};

// Trading Info Component
interface TradingInfoProps {
  availableToTrade: string;
  currentPosition: string;
}

const TradingInfo = ({ availableToTrade, currentPosition }: TradingInfoProps) => {
  return (
    <div className="p-2 sm:p-3 space-y-2 border-b border-gray-800">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">Available to Trade</span>
        <span className="text-xs sm:text-sm text-white font-mono">{availableToTrade}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">Current Position</span>
        <span className="text-xs sm:text-sm text-white font-mono">{currentPosition}</span>
      </div>
    </div>
  );
};

// Size Input Component
interface SizeInputProps {
  size: string;
  onSizeChange: (size: string) => void;
  currency: string;
  onCurrencyChange: () => void;
}

const SizeInput = ({ size, onSizeChange, currency, onCurrencyChange }: SizeInputProps) => {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-gray-500">Size</Label>
      <div className="relative">
        <Input
          value={size}
          onChange={(e) => onSizeChange(e.target.value)}
          placeholder="0"
          className="h-8 sm:h-9 text-right font-mono text-sm pr-20 sm:pr-24"
        />
        <button
          onClick={onCurrencyChange}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 sm:h-7 px-2 text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          {currency} <ChevronDown className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

// Size Slider Component
interface SizeSliderProps {
  value: number;
  onChange: (value: number) => void;
}

const SizeSlider = ({ value, onChange }: SizeSliderProps) => {
  return (
    <div className="space-y-2">
      <Slider
        value={[value]}
        onChange={(vals) => onChange(vals[0])}
        max={100}
        step={25}
        className="py-1"
      />
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">0</span>
        <span className="text-white">{value}%</span>
      </div>
    </div>
  );
};

// Order Options Component
interface OrderOptionsProps {
  reduceOnly: boolean;
  takeProfitStopLoss: boolean;
  onReduceOnlyChange: (checked: boolean) => void;
  onTakeProfitStopLossChange: (checked: boolean) => void;
}

const OrderOptions = ({
  reduceOnly,
  takeProfitStopLoss,
  onReduceOnlyChange,
  onTakeProfitStopLossChange,
}: OrderOptionsProps) => {
  return (
    <div className="space-y-2 pt-2">
      <div className="flex items-center gap-2">
        <Checkbox
          id="reduceOnly"
          checked={reduceOnly}
          onChange={(e) => onReduceOnlyChange(e.target.checked)}
        />
        <Label htmlFor="reduceOnly" className="text-xs text-gray-500 cursor-pointer">
          Reduce Only
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="tpsl"
          checked={takeProfitStopLoss}
          onChange={(e) => onTakeProfitStopLossChange(e.target.checked)}
        />
        <Label htmlFor="tpsl" className="text-xs text-gray-500 cursor-pointer">
          Take Profit / Stop Loss
        </Label>
      </div>
    </div>
  );
};

// Position Info Component
interface PositionInfoProps {
  liquidationPrice: string;
  orderValue: string;
  marginRequired: string;
  slippage: string;
  fees: string;
}

const PositionInfo = ({
  liquidationPrice,
  orderValue,
  marginRequired,
  slippage,
  fees,
}: PositionInfoProps) => {
  return (
    <div className="p-2 sm:p-3 space-y-1.5 border-b border-gray-800">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">Liquidation Price</span>
        <span className="text-xs sm:text-sm text-white">{liquidationPrice}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">Order Value</span>
        <span className="text-xs sm:text-sm text-white">{orderValue}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">Margin Required</span>
        <span className="text-xs sm:text-sm text-white">{marginRequired}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">Slippage</span>
        <span className="text-xs sm:text-sm text-white">
          Est: <span className="text-teal-400">0%</span> / Max: 8.00%
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">Fees</span>
        <span className="text-xs sm:text-sm text-white">0.0450% / 0.0150%</span>
      </div>
    </div>
  );
};

// Account Equity Component
interface AccountEquityProps {
  spot: string;
  perps: string;
}

const AccountEquity = ({ spot, perps }: AccountEquityProps) => {
  return (
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs sm:text-sm text-gray-500 font-medium">Account Equity</span>
    </div>
  );
};

// Announcements Component
interface Announcement {
  title: string;
  description?: string;
  highlight?: string;
}

interface AnnouncementsProps {
  announcements: Announcement[];
  onClose: () => void;
}

const Announcements = ({ announcements, onClose }: AnnouncementsProps) => {
  return (
    <div className="p-2 sm:p-3 flex-1 min-h-0 overflow-y-auto">
      <AccountEquity spot="$0.00" perps="$994.99" />
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium text-xs sm:text-sm text-white">Announcements</span>
        <button
          onClick={onClose}
          className="h-5 w-5 text-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      <div className="space-y-3 text-xs">
        {announcements.map((announcement, index) => (
          <div key={index}>
            <p className="text-gray-500">
              {announcement.title}
              {announcement.highlight && (
                <span className="text-teal-400"> {announcement.highlight}</span>
              )}
            </p>
            {announcement.description && (
              <p className="text-gray-500 mt-0.5">{announcement.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Footer Links Component
const FooterLinks = () => {
  const links = ["Docs", "Support", "Terms", "Privacy Policy"];
  
  return (
    <div className="p-2 sm:p-3 border-t border-gray-800 flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-gray-500">
      {links.map((link) => (
        <a
          key={link}
          href="#"
          className="hover:text-white transition-colors"
        >
          {link}
        </a>
      ))}
    </div>
  );
};

// ==================== Main Trading Panel Component ====================

export const TradingPanel = () => {
  const [size, setSize] = useState("");
  const [sliderValue, setSliderValue] = useState(0);
  const [tradingMode, setTradingMode] = useState("Cross");
  const [orderType, setOrderType] = useState("Market");
  const [activeSide, setActiveSide] = useState<"buy" | "sell">("buy");
  const [currency, setCurrency] = useState("ETH");
  const [reduceOnly, setReduceOnly] = useState(false);
  const [takeProfitStopLoss, setTakeProfitStopLoss] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(true);

  const announcements: Announcement[] = [
    {
      title: "New listing:",
      highlight: "FOGO-USDC hyperps",
      description: "Long or short the unlaunched FOGO token with up to 3x leverage",
    },
    {
      title: "New listing:",
      highlight: "STABLE-USD perps",
    },
    {
      title: "Added spot",
      highlight: "ENA",
      description: "ENA spot trading, deposits, and withdrawals are now live",
    },
  ];

  return (
    <div className="w-full sm:w-80 lg:w-96 bg-gray-950 border-l border-gray-800 flex flex-col text-xs h-full overflow-hidden">
      <TradingModeTabs 
        activeMode={tradingMode} 
        onModeChange={setTradingMode} 
      />

      <OrderTypeTabs 
        activeType={orderType} 
        onTypeChange={setOrderType} 
      />

      <BuySellButtons 
        activeSide={activeSide} 
        onSideChange={setActiveSide} 
      />

      <TradingInfo 
        availableToTrade="994.99 USDC" 
        currentPosition="0.0000 ETH" 
      />

      <div className="p-2 sm:p-3 space-y-3 border-b border-gray-800">
        <SizeInput
          size={size}
          onSizeChange={setSize}
          currency={currency}
          onCurrencyChange={() => setCurrency(currency === "ETH" ? "USDC" : "ETH")}
        />

        <SizeSlider value={sliderValue} onChange={setSliderValue} />

        <OrderOptions
          reduceOnly={reduceOnly}
          takeProfitStopLoss={takeProfitStopLoss}
          onReduceOnlyChange={setReduceOnly}
          onTakeProfitStopLossChange={setTakeProfitStopLoss}
        />
      </div>

      <div className="p-2 sm:p-3 border-b border-gray-800">
        <Button 
          variant="primary" 
          size="lg" 
          className="w-full"
        >
          Connect
        </Button>
      </div>

      <PositionInfo
        liquidationPrice="N/A"
        orderValue="N/A"
        marginRequired="N/A"
        slippage="Est: 0% / Max: 8.00%"
        fees="0.0450% / 0.0150%"
      />

      <div className="p-2 sm:p-3 border-b border-gray-800">
        <Button 
          variant="outline" 
          size="md" 
          className="w-full bg-teal-400/20 hover:bg-teal-400/30 text-teal-400 border-teal-400/50"
        >
          Deposit
        </Button>
      </div>

      <div className="p-2 sm:p-3 border-b border-gray-800">
        <div className="grid grid-cols-3 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 text-xs border-gray-700 text-gray-400 hover:text-white hover:border-teal-400/50"
          >
            Perps ⇄ Spot
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 text-xs border-gray-700 text-gray-400 hover:text-white hover:border-teal-400/50 col-span-2"
          >
            Withdraw
          </Button>
        </div>
      </div>

      {showAnnouncements && (
        <Announcements 
          announcements={announcements} 
          onClose={() => setShowAnnouncements(false)} 
        />
      )}

      <FooterLinks />
    </div>
  );
};
