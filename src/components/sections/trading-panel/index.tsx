"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import AppModal from "@/components/ui/modal";
import { useAccount } from 'wagmi';
import { useApiWallet } from "@/hooks/useWallet";
import { appToast } from "@/components/ui/toast";
import { useBuilderFee } from "@/hooks/useBuilderFee";
import { getSymbolConverter, infoClient, subscriptionClient } from "@/lib/config/hyperliquied/hyperliquid-client";
import { addDecimals, DATE_TIME_FORMAT } from "@/lib/constants";
import HydrationGuard from "@/components/ui/hydration-guard";
import { useBottomPanelStore } from "@/store/bottom-panel";
import { useTradesStore, TradeData } from "@/store/trades";
import { useOrderBookStore } from "@/store/orderbook";
import { formatDateTimeAccordingToFormat } from "@/lib/date-operation";
import { formatPrice } from "@nktkas/hyperliquid/utils";
import { errorHandler } from "@/store/errorHandler";

// ==================== Modular UI Components ====================

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline" | "success" | "danger" | "primary";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  isLoading?: boolean;
  isDisabled?: boolean;
}

const Button = ({ 
  variant = "default", 
  size = "md", 
  children, 
  className = "",
  isLoading = false,
  isDisabled = false,
  ...props 
}: ButtonProps) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    default: "bg-gray-800 text-gray-300 hover:bg-gray-700",
    ghost: "bg-transparent text-gray-400 hover:bg-gray-800/50 hover:text-gray-300",
    outline: "border border-gray-700 bg-transparent text-gray-400 hover:bg-gray-800/50 hover:text-gray-300 hover:border-gray-600",
    success: "bg-green-400 text-white hover:bg-green-500",
    danger: "bg-red-500 text-white hover:bg-red-600",
    primary: "bg-green-400 text-white hover:bg-green-500",
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

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = ({ className = "", ...props }: InputProps) => {
  return (
    <input
      className={`flex h-8 w-full rounded-md bg-gray-800/50 border-0 px-3 py-1 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-950 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
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

const Checkbox = ({ id, className = "", checked, onChange, ...props }: CheckboxProps) => {
  return (
    <div className="relative inline-flex items-center justify-center">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        className="sr-only"
        {...props}
      />
      <label
        htmlFor={id}
        className={`inline-flex items-center justify-center h-4 w-4 rounded border-2 cursor-pointer transition-colors ${
          checked
            ? "bg-green-400 border-green-400"
            : "bg-transparent border-gray-600"
        } ${className}`}
      >
        {checked && (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </label>
    </div>
  );
};

// Slider Component
interface SliderProps {
  defaultValue?: number[];
  min?: number;
  max?: number;
  step?: number;
  value?: number[];
  onChange?: (value: number[]) => void;
  className?: string;
  disabled?: boolean;
}

const Slider = ({ 
  defaultValue = [0], 
  min = 0,
  max = 100, 
  step = 1,
  value,
  onChange,
  className = "",
  disabled = false
}: SliderProps) => {
  const [internalValue, setInternalValue] = useState(defaultValue[0] || min);
  const currentValue = value ? value[0] : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const newValue = Number(e.target.value);
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onChange?.([newValue]);
  };

  return (
    <div className={`relative flex items-center ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div className="relative w-full h-2 flex items-center bg-gray-800 rounded-lg" style={{
        background: `linear-gradient(to right, #22c55e 0%, #22c55e ${((currentValue - min) / (max - min)) * 100}%, #1f2937 ${((currentValue - min) / (max - min)) * 100}%, #1f2937 100%)`,
      }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={handleChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
};

// ==================== Trading Panel Sub-Components ====================

// Margin Mode Dialog Component
interface MarginModeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMode: "Cross" | "Isolated";
  onConfirm: (mode: "Cross" | "Isolated") => void;
  symbol: string;
}

const MarginModeDialog = ({ isOpen, onClose, selectedMode, onConfirm, symbol }: MarginModeDialogProps) => {
  const [tempMode, setTempMode] = useState<"Cross" | "Isolated">(selectedMode);

  useEffect(() => {
    if (isOpen) {
      setTempMode(selectedMode);
    }
  }, [isOpen, selectedMode]);

  const handleConfirm = () => {
    onConfirm(tempMode);
    onClose();
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${symbol} Margin Mode`}
      className="max-w-md"
      contentClassName="space-y-6"
    >
      <div className="space-y-4">
        {/* Cross Mode Option */}
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <Checkbox
              id="cross-mode"
              checked={tempMode === "Cross"}
              onChange={() => setTempMode("Cross")}
              className="mt-0.5"
            />
            <div className="flex-1">
              <Label htmlFor="cross-mode" className="text-sm text-white font-medium cursor-pointer">
                Cross
              </Label>
              <p className="text-xs text-gray-400 mt-1">
                All cross positions share the same cross margin as collateral. In the event of liquidation, your cross margin balance and any remaining open positions under assets in this mode may be forfeited.
              </p>
            </div>
          </div>
        </div>

        {/* Isolated Mode Option */}
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <Checkbox
              id="isolated-mode"
              checked={tempMode === "Isolated"}
              onChange={() => setTempMode("Isolated")}
              className="mt-0.5"
            />
            <div className="flex-1">
              <Label htmlFor="isolated-mode" className="text-sm text-white font-medium cursor-pointer">
                Isolated
              </Label>
              <p className="text-xs text-gray-400 mt-1">
                Manage your risk on individual positions by restricting the amount of margin allocated to each. If the margin ratio of an isolated position reaches 100%, the position will be liquidated. Margin can be added or removed to individual positions in this mode.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={handleConfirm}
      >
        Confirm
      </Button>
    </AppModal>
  );
};

// Leverage Dialog Component
interface LeverageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLeverage: number;
  onConfirm: (leverage: number) => void;
  symbol: string;
  maxLeverage?: number;
  maxPositionSize?: string;
}

const LeverageDialog = ({
  isOpen,
  onClose,
  selectedLeverage,
  onConfirm,
  symbol,
  maxLeverage = 100,
  maxPositionSize,
}: LeverageDialogProps) => {
  const [tempLeverage, setTempLeverage] = useState(selectedLeverage);

  useEffect(() => {
    if (isOpen) {
      setTempLeverage(selectedLeverage);
    }
  }, [isOpen, selectedLeverage]);

  const handleConfirm = () => {
    onConfirm(tempLeverage);
    onClose();
  };

  const handleLeverageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= maxLeverage) {
      setTempLeverage(value);
    }
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust Leverage"
      className="max-w-md"
      contentClassName="space-y-6"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-400">
          Control the leverage used for {symbol} positions. The maximum leverage is {maxLeverage}x.
        </p>

        {/* {maxPositionSize && (
          <p className="text-sm text-gray-400">
            Max position size decreases the higher your leverage. The max position size for {tempLeverage}x leverage on {symbol} is {maxPositionSize}.
          </p>
        )} */}

        {/* Leverage Slider */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Slider
              value={[tempLeverage]}
              onChange={(vals) => setTempLeverage(vals[0])}
              max={maxLeverage}
              step={1}
              className="flex-1 py-2"
            />
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={tempLeverage}
                onChange={handleLeverageInputChange}
                min={0}
                max={maxLeverage}
                step={1}
                className="w-14 h-9 text-center px-2"
              />
              <span className="text-white text-sm">x</span>
            </div>
          </div>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={handleConfirm}
      >
        Confirm
      </Button>

      <div className="bg-red-950/50 border border-red-500/50 rounded-lg p-3">
        <p className="text-xs text-white">
          Note that setting a higher leverage increases the risk of liquidation.
        </p>
      </div>
    </AppModal>
  );
};

// Establish Connection Dialog Component
interface EstablishConnectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onEstablish: () => void;
}

const EstablishConnectionDialog = ({
  isOpen,
  onClose,
  onEstablish,
}: EstablishConnectionDialogProps) => {
  const [stayConnected, setStayConnected] = useState(false);

  const handleEstablish = () => {
    onEstablish();
    onClose();
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Establish Connection"
      className="max-w-md"
      contentClassName="space-y-6"
    >
      <div className="space-y-4">
        <p className="text-sm text-white">
          This signature is gas-free to send. It opens a decentralized channel for gas-free and instantaneous trading.
        </p>

        <div className="flex items-center gap-3">
          <Checkbox
            id="stay-connected"
            checked={stayConnected}
            onChange={(e) => setStayConnected(e.target.checked)}
          />
          <Label htmlFor="stay-connected" className="text-sm text-white cursor-pointer">
            Stay Connected
          </Label>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={handleEstablish}
      >
        Establish Connection
      </Button>
    </AppModal>
  );
};

// Trading Mode Tabs Component
interface TradingModeTabsProps {
  marginMode: "Cross" | "Isolated";
  leverage: number;
  onMarginModeClick: () => void;
  onLeverageClick: () => void;
}

const TradingModeTabs = ({
  marginMode,
  leverage,
  onMarginModeClick,
  onLeverageClick,
}: TradingModeTabsProps) => {
  return (
    <div className="p-2 sm:p-3 border-b border-gray-800">
      <div className="grid grid-cols-2 gap-1 bg-gray-800/50 p-0.5 rounded-md">
        <button
          onClick={onMarginModeClick}
          className="h-7 text-xs rounded transition-colors bg-gray-800 text-white hover:bg-gray-700"
        >
          {marginMode}
        </button>
        <button
          onClick={onLeverageClick}
          className="h-7 text-xs rounded transition-colors bg-gray-800 text-white hover:bg-gray-700"
        >
          {leverage}x
        </button>
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
  const types = ["Market", "Limit"];
  
  return (
    <div className="px-2 sm:px-3 py-2 border-b border-gray-800">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
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
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400" />
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
              ? "bg-green-400 text-white hover:bg-green-500"
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
  // Extract numeric value from currentPosition string
  const parts = currentPosition.split(' ');
  const numericValue = parseFloat(parts[0]);
  const isNegative = numericValue < 0;
  const positionColor = isNegative ? 'text-red-500' : 'text-green-500';
  
  // Remove minus sign from display
  const displayValue = isNegative ? parts[0].replace('-', '') : parts[0];
  const displayPosition = `${displayValue} ${parts[1] || ''}`.trim();
  
  return (
    <div className="p-2 sm:p-3 space-y-2 border-b border-gray-800">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">Available to Trade</span>
        <span className="text-xs sm:text-sm text-white font-mono">{availableToTrade}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">Current Position</span>
        <span className={`text-xs sm:text-sm font-mono ${positionColor}`}>{displayPosition}</span>
      </div>
    </div>
  );
};

// Size Input Component
interface SizeInputProps {
  size: string;
  currency: string;
  onCurrencyChange: () => void;
}

const SizeInput = ({ size, currency, onCurrencyChange}: SizeInputProps) => {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-gray-500">Size</Label>
      <div className="relative">
        <Input
          value={size}
          readOnly
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

// Price Input Component for Limit Orders
interface PriceInputProps {
  price: string;
  onPriceChange: (price: string) => void;
  onMidClick: () => void;
  disabled?: boolean;
}

const PriceInput = ({ price, onPriceChange, onMidClick, disabled = false }: PriceInputProps) => {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-gray-500">Price (USDC)</Label>
      <div className="relative">
        <Input
          type="text"
          value={price}
          onChange={(e) => onPriceChange(e.target.value)}
          placeholder="0.00"
          disabled={disabled}
          className="h-8 sm:h-9 text-right font-mono text-sm pr-16 sm:pr-20"
        />
        <button
          onClick={onMidClick}
          disabled={disabled}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 sm:h-7 px-2 text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Mid
        </button>
      </div>
    </div>
  );
};

// Size Slider Component
interface SizeSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const SizeSlider = ({ value, onChange, disabled = false }: SizeSliderProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Slider
          value={[value]}
          onChange={(vals) => onChange(vals[0])}
          max={100}
          step={1}
          className="flex-1 py-1"
          disabled={disabled}
        />
        <div className={`text-xs text-white min-w-12 text-right ${disabled ? 'opacity-50' : ''}`}>
          {value} %
        </div>
      </div>
    </div>
  );
};

// Time In Force Dropdown Component
interface TIFDropdownProps {
  value: "GTC" | "IOC" | "ALO";
  onChange: (value: "GTC" | "IOC" | "ALO") => void;
  disabled?: boolean;
}

const TIFDropdown = ({ value, onChange, disabled = false }: TIFDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const options: ("GTC" | "IOC" | "ALO")[] = ["GTC", "IOC", "ALO"];

  const tooltipContent = {
    GTC: { name: "Good Til Cancel", description: "will rest until filled or canceled." },
    IOC: { name: "Immediate Or Cancel", description: "Any portion that is not immediately filled will be canceled." },
    ALO: { name: "Add Liquidity Only", description: "will exist only as a limit order on the book. Also known as post-only." },
  };

  return (
    <div className="relative w-full">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onMouseEnter={() => !disabled && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        disabled={disabled}
        className={`
          w-full h-8 sm:h-9 rounded-md bg-gray-800/50 border border-gray-700 
          px-3 py-1.5 text-xs sm:text-sm text-white
          flex items-center justify-between
          hover:bg-gray-800 hover:border-gray-600
          transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-950
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span>{value}</span>
        <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      
      {/* Tooltip */}
      {showTooltip && !disabled && !isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-gray-900 border border-gray-800 rounded-md shadow-xl z-30 p-3">
          <div className="text-xs font-semibold text-white mb-2">Time In Force</div>
          <div className="space-y-2.5">
            {options.map((option) => {
              const info = tooltipContent[option];
              return (
                <div key={option} className="text-xs">
                  <div className="font-semibold text-white">
                    {option} ({info.name})
                  </div>
                  <div className="text-gray-400 mt-0.5">
                    {info.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isOpen && !disabled && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-full bg-gray-900 border border-gray-800 rounded-md shadow-lg z-20">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`
                  w-full text-left px-3 py-2 text-xs sm:text-sm transition-colors
                  first:rounded-t-md last:rounded-b-md
                  ${value === option 
                    ? "bg-gray-800 text-white" 
                    : "text-gray-300 hover:bg-gray-800/50"
                  }
                `}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Max Slippage Dialog Component
interface MaxSlippageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMaxSlippage: number;
  onConfirm: (maxSlippage: number) => void;
}

const MaxSlippageDialog = ({
  isOpen,
  onClose,
  selectedMaxSlippage,
  onConfirm,
}: MaxSlippageDialogProps) => {
  const [tempMaxSlippage, setTempMaxSlippage] = useState(selectedMaxSlippage);

  useEffect(() => {
    if (isOpen) {
      setTempMaxSlippage(selectedMaxSlippage);
    }
  }, [isOpen, selectedMaxSlippage]);

  const handleConfirm = () => {
    onConfirm(tempMaxSlippage);
    onClose();
  };

  const handleSlippageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    // Value must be >= 1 and <= 100, rounded to whole number
    if (!isNaN(value) && value >= 1 && value <= 100) {
      setTempMaxSlippage(Math.round(value));
    }
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust Max Slippage"
      className="max-w-md"
      contentClassName="space-y-6"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-400">
          Max slippage only affects market orders placed from the order form. Closing positions will use max slippage of 8% and market TP/SL orders will use max slippage of 10%.
        </p>

        {/* Max Slippage Slider */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Slider
              value={[Math.max(1, Math.min(100, Math.round(tempMaxSlippage)))]}
              onChange={(vals) => {
                const val = vals[0];
                // Ensure value is >= 1 and <= 100, rounded to whole number
                const clampedVal = Math.max(1, Math.min(100, Math.round(val)));
                setTempMaxSlippage(clampedVal);
              }}
              min={1}
              max={100}
              step={1}
              className="flex-1 py-2"
            />
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={Math.round(tempMaxSlippage)}
                onChange={handleSlippageInputChange}
                min={1}
                max={100}
                step={1}
                className="w-20 h-9 text-center px-2"
              />
              <span className="text-white text-sm">%</span>
            </div>
          </div>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={handleConfirm}
      >
        Confirm
      </Button>
    </AppModal>
  );
};

// Position Info Component
interface PositionInfoProps {
  liquidationPrice: string;
  orderValue: string;
  marginRequired: string;
  slippage: string;
  maxSlippage: number;
  onMaxSlippageClick: () => void;
}

const PositionInfo = ({
  liquidationPrice,
  orderValue,
  marginRequired,
  slippage,
  maxSlippage,
  onMaxSlippageClick,
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
          EST: {slippage || "0.0000%"} MAX: <button onClick={onMaxSlippageClick} className="text-green-400 hover:text-green-300 underline cursor-pointer">{maxSlippage.toFixed(2)}%</button>
        </span>
      </div>
    </div>
  );
};

// Account Equity and Perps Overview Component
interface AccountEquityProps {
  spot: string;
  perps: string;
  balance: string;
  unrealizedPnl: string;
  crossMarginRatio: string;
  maintenanceMargin: string;
  crossAccountLeverage: string;
}

const AccountEquityOverview = ({ 
  spot, 
  perps, 
  balance, 
  unrealizedPnl, 
  crossMarginRatio, 
  maintenanceMargin, 
  crossAccountLeverage 
}: AccountEquityProps) => {
  const unrealizedPnlValue = parseFloat(unrealizedPnl.replace(/[^0-9.-]/g, '')) || 0;
  
  return (
    <div className="p-2 sm:p-3 space-y-4 border-b border-gray-800">
      {/* Account Equity Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm text-gray-500 font-medium">Account Equity</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Perps</span>
            <span className="text-xs sm:text-sm text-white font-mono">{perps}</span>
          </div>
        </div>
      </div>

      {/* Perps Overview Section */}
      <div className="space-y-2 pt-2 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm text-gray-500 font-medium">Perps Overview</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Balance</span>
            <span className="text-xs sm:text-sm text-white font-mono">{balance}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Unrealized PNL</span>
            <span className={`text-xs sm:text-sm font-mono ${
              unrealizedPnlValue >= 0 
                ? 'text-green-400' 
                : 'text-red-400'
            }`}>
              {unrealizedPnl}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Cross Account Leverage</span>
            <span className="text-xs sm:text-sm text-white font-mono">{crossAccountLeverage}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Account Equity Section Component with real-time data
interface AccountEquitySectionProps {
  publicKey: `0x${string}`;
}

interface PerpsSummary {
  balance?: string | number;
  maintenanceMargin?: string | number;
  maintenance_requirement?: string | number;
}

const AccountEquitySection = ({ publicKey }: AccountEquitySectionProps) => {
  const { balances, userPositions } = useBottomPanelStore();
  
  // Access perpsSummary if it exists in the store (may not be typed yet)
  const store = useBottomPanelStore();
  const storeRecord = store as Record<string, unknown>;
  const perpsSummaryValue = storeRecord.perpsSummary;
  const perpsSummary: PerpsSummary | undefined = 
    perpsSummaryValue !== null && 
    typeof perpsSummaryValue === 'object' &&
    'balance' in perpsSummaryValue
      ? {
          balance: 'balance' in perpsSummaryValue && (typeof perpsSummaryValue.balance === 'string' || typeof perpsSummaryValue.balance === 'number') 
            ? perpsSummaryValue.balance 
            : undefined,
          maintenanceMargin: 'maintenanceMargin' in perpsSummaryValue && (typeof perpsSummaryValue.maintenanceMargin === 'string' || typeof perpsSummaryValue.maintenanceMargin === 'number')
            ? perpsSummaryValue.maintenanceMargin 
            : undefined,
          maintenance_requirement: 'maintenance_requirement' in perpsSummaryValue && (typeof perpsSummaryValue.maintenance_requirement === 'string' || typeof perpsSummaryValue.maintenance_requirement === 'number')
            ? perpsSummaryValue.maintenance_requirement 
            : undefined,
        }
      : undefined;

  // Sum of spot USDC values (exclude perps account entries if your balances array includes them)
  const spotValue = (balances || []).reduce((sum, b) => {
    // if balances includes a perps entry, filter it out here by coin or type
    // e.g. if b.type === 'spot' or b.coin !== 'PERP_ACCOUNT'
    return sum + (parseFloat(b.usdc_value || '0') || 0);
  }, 0);

  // If you have a perpsSummary from the Info API, prefer using it for perps balance and maintenance margin.
  // perpsSummary.balance is typically the perps account balance/equity (already includes unrealized PnL).
  const perpsBalanceFromSummary = perpsSummary ? Number(perpsSummary.balance || 0) : null;
  const perpsMaintenanceFromSummary = perpsSummary 
    ? Number(perpsSummary.maintenanceMargin || perpsSummary.maintenance_requirement || 0) 
    : null;

  // If no perpsSummary, fall back to aggregating from positions (less reliable).
  const perpsValueFallback = (userPositions || []).reduce((sum, p) => {
    // position.position.positionValue should represent position notional (abs)
    return sum + (Math.abs(Number(p.position.positionValue || 0)) || 0);
  }, 0);

  // If perpsSummary exists prefer that perpsBalance (it already includes unrealized PnL). Otherwise, fall back:
  const perpsValue = perpsBalanceFromSummary !== null ? perpsBalanceFromSummary : perpsValueFallback;

  // Total account balance / equity: prefer the explicit API field if you have it; else sum spot + perps (perps must include unrealized pnl)
  // If your balances array already included perps account, don't double-count. Adjust as needed for your store.
  const accountEquity = (() => {
    if (perpsBalanceFromSummary !== null) {
      // spotValue + perps account balance
      return spotValue + perpsBalanceFromSummary;
    }
    // fallback: if balances already contains perps account as USDC values, use sum of balances:
    const balanceValue = (balances || []).reduce((s, b) => s + (parseFloat(b.usdc_value || '0') || 0), 0);
    return balanceValue;
  })();

  // Maintenance margin: prefer API perpsSummary. If not available, try to use per-position maintenance if present,
  // otherwise fall back to an approximation (NOT accurate) by summing per-position marginUsed (only as last resort).
  const maintenanceMargin = perpsMaintenanceFromSummary !== null
    ? perpsMaintenanceFromSummary
      : (userPositions || []).reduce((sum, p) => {
        // prefer explicit maintenance field if available.
        const position = p.position as Record<string, unknown>;
        const maintenanceMargin = 'maintenanceMargin' in position 
          ? (typeof position.maintenanceMargin === 'string' || typeof position.maintenanceMargin === 'number')
            ? position.maintenanceMargin 
            : undefined
          : undefined;
        const maintenanceRequirement = 'maintenanceRequirement' in position 
          ? (typeof position.maintenanceRequirement === 'string' || typeof position.maintenanceRequirement === 'number')
            ? position.maintenanceRequirement 
            : undefined
          : undefined;
        const perPosMaintenance = Number(maintenanceMargin ?? maintenanceRequirement ?? 0);
        if (perPosMaintenance && perPosMaintenance > 0) return sum + perPosMaintenance;
        // fallback: use marginUsed if nothing else available (not ideal)
        return sum + (Number(p.position.marginUsed || 0) || 0);
      }, 0);

  // Cross margin ratio = maintenance margin / account equity (in percent)
  const crossMarginRatioValue = accountEquity > 0 ? (maintenanceMargin / accountEquity) * 100 : 0;

  // Cross account leverage: sum absolute notionals / account equity
  const totalNotional = (userPositions || []).reduce((sum, p) => {
    // positionValue should be notional (size * mark price). If it's signed, take abs:
    return sum + (Math.abs(Number(p.position.positionValue || 0)) || 0);
  }, 0);
  const crossAccountLeverageValue = accountEquity > 0 ? (totalNotional / accountEquity) : 0;

  // Formatters
  const formatCurrency = (value: number) => `${Number(value || 0).toFixed(2)}$`;
  const formatPercent = (value: number) => `${Number(value || 0).toFixed(2)}%`;
  const formatLeverage = (value: number) => `${Number(value || 0).toFixed(2)}x`;

  return (
    <AccountEquityOverview 
      spot={formatCurrency(spotValue)}
      perps={formatCurrency(accountEquity)}
      balance={formatCurrency(accountEquity)}
      unrealizedPnl={formatCurrency((userPositions || []).reduce((s, p) => s + (Number(p.position.unrealizedPnl || 0) || 0), 0))}
      crossMarginRatio={formatPercent(crossMarginRatioValue)}
      maintenanceMargin={formatCurrency(maintenanceMargin)}
      crossAccountLeverage={formatLeverage(crossAccountLeverageValue)}
    />
  );
};

// ==================== Main Trading Panel Component ====================

export const TradingPanel = ({currentCurrency, currentLeverage}: {currentCurrency: string, currentLeverage: number}) => {
  // ==================== Hooks ====================
  const { isConnected, address } = useAccount();
  const { userPositions } = useBottomPanelStore();
  const { trades, setTrades, updateMarginAndLeverage, placeOrderWithAgent } = useTradesStore();
  const { bids, asks } = useOrderBookStore();
  const { isApproving: isApprovingAgent, agentPrivateKey, agentWallet, isApproved, checkApprovalStatus } = useApiWallet({userPublicKey: address as `0x${string}`});
  const { isApproving: isApprovingBuilderFee, isChecking: isCheckingBuilderFee, isApproved: isApprovedBuilderFee, checkBuilderFeeStatus } = useBuilderFee({userPublicKey: address as `0x${string}`});

  // ==================== useState Declarations ====================
  // Trading form states
  const [sliderValue, setSliderValue] = useState(0);
  const [orderType, setOrderType] = useState("Market");
  const [activeSide, setActiveSide] = useState<"buy" | "sell">("buy");
  const [currency, setCurrency] = useState("USDC");
  const [mounted, setMounted] = useState(false);
  
  // Margin and leverage states
  const [marginMode, setMarginMode] = useState<"Cross" | "Isolated">("Cross");
  const [maxLeverage, setMaxLeverage] = useState<number>(currentLeverage);
  const [userLeverage, setUserLeverage] = useState<number>(currentLeverage);
  
  // Dialog open states
  const [isMarginModeDialogOpen, setIsMarginModeDialogOpen] = useState(false);
  const [isLeverageDialogOpen, setIsLeverageDialogOpen] = useState(false);
  const [isMaxSlippageDialogOpen, setIsMaxSlippageDialogOpen] = useState(false);
  const [isEstablishConnectionDialogOpen, setIsEstablishConnectionDialogOpen] = useState(false);
  
  // Slippage and decimals states
  const [maxSlippage, setMaxSlippage] = useState<number>(8);
  const [szDecimals, setSzDecimals] = useState<number>(0);
  
  // Price and order states
  const [limitOrderPrice, setLimitOrderPrice] = useState<string>("");
  const [timeInForce, setTimeInForce] = useState<"GTC" | "IOC" | "ALO">("GTC");
  
  // Position and trading states
  const [availableToTradeBuy, setAvailableToTradeBuy] = useState(0);
  const [availableToTradeSell, setAvailableToTradeSell] = useState(0);
  const [currentPosition, setCurrentPosition] = useState<number>(0);
  const [isLiquidationPx, setIsLiquidationPx] = useState(0);
  
  // Combined loading state for all initial data
  const [isLoadingInitialData, setIsLoadingInitialData] = useState<boolean>(true);
  const apiDataReadyRef = useRef<boolean>(false);
  const positionDataReadyRef = useRef<boolean>(false);
  
  // Helper function to check if all data is ready
  const checkAllDataReady = useCallback(() => {
    const allReady = apiDataReadyRef.current && (positionDataReadyRef.current || !address);
    if (allReady) {
      setIsLoadingInitialData(false);
    }
  }, [address]);

  // ==================== Computed Values ====================
  const getCurrentPosition = useMemo(() => {
    if (!userPositions || userPositions.length === 0) return null;
    return userPositions.find(p => p.position.coin === currentCurrency) || null;
  }, [userPositions, currentCurrency]);

  // Fetch initial data (recent trades and decimals) in parallel when currency changes
  useEffect(() => {
    let isMounted = true;
    
    if (!currentCurrency) {
      apiDataReadyRef.current = true;
      setIsLoadingInitialData(false);
      return;
    }
    
    // Reset loading states when currency changes
    setIsLoadingInitialData(true);
    apiDataReadyRef.current = false;
    positionDataReadyRef.current = false;
    
    const fetchInitialData = async () => {
      try {
        // Clear existing trades when currency changes
        setTrades([]);
        
        // Fetch both APIs in parallel using Promise.all
        const [recentTradesData, converter] = await Promise.all([
          infoClient.recentTrades({ coin: currentCurrency }),
          getSymbolConverter()
        ]);
        
        if (!isMounted) return;
        
        // Process recent trades
        if (recentTradesData && recentTradesData.length > 0) {
          const transformedTrades: TradeData[] = recentTradesData.map((trade) => {
            const tradeTime = new Date(trade.time);
            return {
              price: parseFloat(trade.px),
              size: addDecimals(trade.sz, 4),
              time: formatDateTimeAccordingToFormat({ 
                timeStamp: tradeTime, 
                format: DATE_TIME_FORMAT.HH_mm_ss 
              }),
              isBuy: trade.side === "B", // "B" = buy, "A" = sell
              timestamp: tradeTime.getTime(),
              txnHash: trade.hash,
            };
          });
          
          // Sort by timestamp (newest first) and set in store
          transformedTrades.sort((a, b) => b.timestamp - a.timestamp);
          setTrades(transformedTrades.slice(0, 50));
        }
        
        // Process decimals
        const decimals = converter.getSzDecimals(currentCurrency);
        setSzDecimals(decimals ?? 4);
        
        // Mark API data as ready
        apiDataReadyRef.current = true;
        checkAllDataReady();
        
      } catch (error) {
        console.error("Error fetching initial data:", error);
        errorHandler(error, "Failed to load trading data");
        // Fallback to default 4 decimals on error
        setSzDecimals(4);
        // Mark as ready even on error so UI doesn't stay in loading state
        apiDataReadyRef.current = true;
        checkAllDataReady();
        // Don't clear trades on error, keep existing data if available
      }
    };
    
    fetchInitialData();
    
    return () => {
      isMounted = false;
    };
  }, [currentCurrency, setTrades, address, checkAllDataReady]);

  useEffect(() => {
    if (!address) {
      // No address means no position data needed
      positionDataReadyRef.current = true;
      checkAllDataReady();
      return;
    }

    // Reset position data state when address or currency changes
    positionDataReadyRef.current = false;

    subscriptionClient.webData2({user:address as `0x${string}`}, (data) => {
      const clearinghouseState = data.clearinghouseState;
      const positionData = clearinghouseState.assetPositions.filter((position) => position.position.coin === currentCurrency)[0];
      const positionValue = positionData ? Number(positionData.position.szi) : 0;
      setCurrentPosition(positionValue);

      const liquidationPx = positionData?.position?.liquidationPx;
      setIsLiquidationPx(Number(liquidationPx ?? 0));

      const availableToTradeBuy = positionValue > 0 
        ? Number(clearinghouseState.marginSummary.accountValue) - Number(clearinghouseState.marginSummary.totalMarginUsed) 
        : Number(clearinghouseState.marginSummary.accountValue) + Number(clearinghouseState.marginSummary.totalMarginUsed);
      const availableToTradeSell = positionValue < 0 
        ? Number(clearinghouseState.marginSummary.accountValue) - Number(clearinghouseState.marginSummary.totalMarginUsed) 
        : Number(clearinghouseState.marginSummary.accountValue) + Number(clearinghouseState.marginSummary.totalMarginUsed);
      setAvailableToTradeBuy(Number(availableToTradeBuy > 0 ? availableToTradeBuy : 0));
      setAvailableToTradeSell(Number(availableToTradeSell > 0 ? availableToTradeSell : 0));

      // Mark that we've received position data
      positionDataReadyRef.current = true;
      
      // Check if all data is ready
      checkAllDataReady();
    });
  }, [address, currentCurrency, checkAllDataReady]);

  // Calculate mid price from orderbook store (bid + ask) / 2, fallback to currencyPrice
  const currencyPrice = trades[0]?.price || 0;
  const bestBid = bids.length > 0 ? parseFloat(bids[0]?.price || "0") : null;
  const bestAsk = asks.length > 0 ? parseFloat(asks[0]?.price || "0") : null;
  const midPrice = bestBid && bestAsk && bestBid > 0 && bestAsk > 0
    ? (bestBid + bestAsk) / 2 
    : currencyPrice > 0 
      ? currencyPrice 
      : 0;
  
  // Order value (notional) = availableToTrade * userLeverage * percentage
  const availableToTrade = activeSide === "buy" ? availableToTradeBuy : availableToTradeSell;
  const orderValue = (availableToTrade * userLeverage * sliderValue) / 100;
  
  // Prevent division by zero and handle invalid values
  const orderValueInCurrency = currencyPrice > 0 && isFinite(currencyPrice)
    ? orderValue / currencyPrice 
    : 0;
  
  // Calculate limit price (p) for market orders
  // Formula: mid * (1 ± buffer), then round and format according to Hyperliquid rules
  let limitPrice = null;
  if (sliderValue > 0 && currencyPrice > 0 && currentCurrency && szDecimals > 0) {
    try {
      const buffer = 0.01; // 1% aggressiveness buffer
      const isBuy = activeSide === "buy";
      
      // Apply buffer: for buy use (1 + buffer), for sell use (1 - buffer)
      let rawPrice = isBuy 
        ? currencyPrice * (1 + buffer) 
        : currencyPrice * (1 - buffer);
      
      // Round to guarantee execution: ceil for buy, floor for sell
      rawPrice = isBuy ? Math.ceil(rawPrice) : Math.floor(rawPrice);
      
      // Format using Hyperliquid's formatPrice utility with szDecimals
      limitPrice = formatPrice(String(rawPrice), szDecimals);
    } catch (error) {
      console.error("Error calculating limit price:", error);
    }
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset limit price when switching order types
  useEffect(() => {
    if (orderType === "Market") {
      setLimitOrderPrice("");
    }
  }, [orderType]);

  // Reset currency display when currentCurrency changes
  useEffect(() => {
    setCurrency("USDC");
    setSliderValue(0);
    setLimitOrderPrice("");
    setTimeInForce("GTC"); // Reset TIF to default when currency changes
  }, [currentCurrency]);

  // Handle mid price click - set limit order price to mid price
  const handleMidPriceClick = () => {
    if (midPrice > 0) {
      const formattedPrice = formatPrice(String(midPrice), szDecimals);
      setLimitOrderPrice(formattedPrice);
    }
  };

  // Sync margin mode and leverage when currency changes or stored values update (client-side only)
  useEffect(() => {
    if (!mounted) return; // Only sync after client-side mount to avoid hydration issues
    
    const storedValues = useTradesStore.getState().getMarginAndLeverage(currentCurrency);
    
    // If stored values exist, use them
    if (storedValues?.marginMode) {
      setMarginMode(storedValues.marginMode as "Cross" | "Isolated");
    } else if (getCurrentPosition?.position.leverage) {
      // Fallback to current position leverage data if stored values are null
      const leverageData = getCurrentPosition.position.leverage;
      if (leverageData.type) {
        // Capitalize first letter: 'isolated' -> 'Isolated', 'cross' -> 'Cross'
        const marginType = leverageData.type.charAt(0).toUpperCase() + leverageData.type.slice(1) as "Cross" | "Isolated";
        setMarginMode(marginType);
      }
    }
    
    setMaxLeverage(currentLeverage);
    
    // Use stored leverage, or fallback to current position leverage value, or currentLeverage
    if (storedValues?.leverage) {
      setUserLeverage(storedValues.leverage);
    } else if (getCurrentPosition?.position.leverage?.value) {
      const leverageValue = getCurrentPosition.position.leverage.value;
      if (leverageValue) {
        setUserLeverage(leverageValue);
      }
    }
    
    
    if ((!storedValues?.marginMode && !storedValues?.leverage) || (!getCurrentPosition?.position.leverage && !getCurrentPosition?.position.leverage.type)) {
      if (agentPrivateKey) {
        (async () => {
          const success = await updateMarginAndLeverage({
            currentCurrency,
            agentPrivateKey: agentPrivateKey as `0x${string}`,
            marginMode: "Cross",
            leverage: currentLeverage,
          });
          if (success) {
            setMarginMode("Cross");
            setUserLeverage(currentLeverage);
          }
        })();
      }
    } 
  }, [currentCurrency, currentLeverage, mounted, getCurrentPosition]);

  return (
    <div className="w-full sm:w-80 lg:w-full bg-gray-950 border-l border-gray-800 flex flex-col text-xs h-full overflow-hidden relative">
      {/* Loading Overlay - Show until all initial data is loaded */}
      {isLoadingInitialData && (
        <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-8 w-8 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-gray-400">Loading trading data...</span>
          </div>
        </div>
      )}

      <TradingModeTabs 
        marginMode={marginMode}
        leverage={userLeverage}
        onMarginModeClick={() => setIsMarginModeDialogOpen(true)}
        onLeverageClick={() => setIsLeverageDialogOpen(true)}
      />

      {/* Margin Mode Dialog */}
      <MarginModeDialog
        isOpen={isMarginModeDialogOpen}
        onClose={() => setIsMarginModeDialogOpen(false)}
        selectedMode={marginMode}
        onConfirm={async (mode: "Cross" | "Isolated") => {
          if (agentPrivateKey) {
            try {
              const success = await updateMarginAndLeverage({
                currentCurrency,
                agentPrivateKey: agentPrivateKey as `0x${string}`,
                marginMode: mode,
                leverage: userLeverage,
              });
              if (success) {
                setMarginMode(mode);
                appToast.success("Margin mode updated successfully");
              }
            } catch (error) {
              console.error("Error updating margin mode:", error);
            }
          } 
        }}
        symbol={`${currentCurrency}-USDC`}
      />

      {/* Leverage Dialog */}
      <LeverageDialog
        isOpen={isLeverageDialogOpen}
        onClose={() => setIsLeverageDialogOpen(false)}
        selectedLeverage={userLeverage}
        onConfirm={async (leverage: number) => {
          if (agentPrivateKey) {
            try {
              const success = await updateMarginAndLeverage({
                currentCurrency,
                agentPrivateKey: agentPrivateKey as `0x${string}`,
                marginMode: marginMode,
                leverage: leverage,
              });
              if (success) {
                setUserLeverage(leverage);
                appToast.success("Leverage updated successfully");
              }
            } catch (error) {
              console.error("Error updating leverage:", error);
            }
          } 
        }}
        symbol={currentCurrency}
        maxLeverage={maxLeverage}
        maxPositionSize="$20,000"
      />

      {/* Max Slippage Dialog */}
      <MaxSlippageDialog
        isOpen={isMaxSlippageDialogOpen}
        onClose={() => setIsMaxSlippageDialogOpen(false)}
        selectedMaxSlippage={maxSlippage}
        onConfirm={(slippage: number) => {
          setMaxSlippage(slippage);
        }}
      />

      {/* Establish Connection Dialog */}
      <EstablishConnectionDialog
        isOpen={isEstablishConnectionDialogOpen}
        onClose={() => setIsEstablishConnectionDialogOpen(false)}
        onEstablish={() => {
          checkApprovalStatus({
            agentPublicKeyParam: agentWallet?.address as `0x${string}`,
            userPublicKeyParam: address as `0x${string}`
          });
        }}
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
        availableToTrade={`${addDecimals(activeSide === "buy" ? availableToTradeBuy : availableToTradeSell)} USDC`} 
        currentPosition={`${addDecimals(currentPosition, szDecimals)} ${currentCurrency}`} 
      />

      <div className="p-2 sm:p-3 space-y-3 border-b border-gray-800">
        {/* Price Input for Limit Orders */}
        {orderType === "Limit" && (
          <PriceInput
            price={limitOrderPrice}
            onPriceChange={setLimitOrderPrice}
            onMidClick={handleMidPriceClick}
            disabled={midPrice === 0 || isLoadingInitialData}
          />
        )}


        <SizeInput
          size={currency === "USDC" ? addDecimals(orderValue) : addDecimals(orderValueInCurrency,szDecimals)}
          currency={currency}
          onCurrencyChange={() => setCurrency(currency === "USDC" ? currentCurrency : "USDC")}
          />
        <SizeSlider value={sliderValue} onChange={setSliderValue} disabled={isLoadingInitialData} />
          {/* Time In Force Dropdown for Limit Orders */}
          {orderType === "Limit" && (
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">TIF</Label>
              <TIFDropdown
                value={timeInForce}
                onChange={setTimeInForce}
                disabled={isLoadingInitialData}
              />
            </div>
          )}
      </div>

      <div className="p-2 sm:p-3 border-b border-gray-800">
        {!mounted ? (
          <div className="text-center text-sm text-gray-400 py-4">
            Please connect your wallet to enable trading
          </div>
        ) : !isConnected ? (
          <div className="text-center text-sm text-gray-400 py-4">
            Please connect your wallet to enable trading
          </div>
        ) : !isApproved ? (
          <Button 
            variant="primary" 
            size="lg" 
            className="w-full"
            onClick={() => {
              setIsEstablishConnectionDialogOpen(true);
            }}
          >
            Enable Trading
          </Button>
        ) : (
          <Button 
            variant={activeSide === "buy" ? "primary" : "danger"} 
            size="lg" 
            className="w-full"
            isLoading={(isApprovingBuilderFee || isApprovingAgent || isCheckingBuilderFee)}
            isDisabled={
              (isApprovingBuilderFee || isApprovingAgent || isCheckingBuilderFee) || 
              (currency === "USDC" ? orderValue <= 0 : orderValueInCurrency <= 0) ||
              (orderType === "Limit" && !limitOrderPrice)
            }
            onClick={async () => {
            

              const isApprovedBuilderFee = await checkBuilderFeeStatus({
                userPublicKeyParam: address as `0x${string}`,
              });

              const isApproved = await checkApprovalStatus({
                agentPublicKeyParam: agentWallet?.address as `0x${string}`,
                userPublicKeyParam: address as `0x${string}`
              });


              if(!isApprovedBuilderFee){
                appToast.error({ message: "Please approve the builder fee to place order" });
                return;
              }
              
              if(!isApproved){
                appToast.error({ message: "Please approve the agent wallet to place order" });
                setIsEstablishConnectionDialogOpen(true);
              }

              const s = (addDecimals(orderValueInCurrency, szDecimals)).toString();
              
              // For limit orders, use the user-entered price; for market orders, use calculated limitPrice
              const p = orderType === "Limit" 
                ? limitOrderPrice || "" 
                : limitPrice || "";

              // Validate limit order price is provided
              if (orderType === "Limit" && !limitOrderPrice) {
                appToast.error({ message: "Please enter a limit price" });
                return;
              }

              if(isApproved && isApprovedBuilderFee){
                // Map TIF dropdown values to API format
                const tifMap: Record<"GTC" | "IOC" | "ALO", "Gtc" | "Ioc" | "Alo"> = {
                  "GTC": "Gtc",
                  "IOC": "Ioc",
                  "ALO": "Alo"
                };
                
                // Only send tif parameter for Limit orders
                const orderParams: Parameters<typeof placeOrderWithAgent>[0] = {
                  agentPrivateKey: agentPrivateKey as `0x${string}`,
                  a: currentCurrency,
                  b: activeSide === "buy" ? true : false, 
                  s: s,
                  p: p,
                  r: false,
                };
                
                // Add tif only for Limit orders
                if (orderType === "Limit") {
                  orderParams.tif = tifMap[timeInForce];
                }
                
                placeOrderWithAgent(orderParams);
              } 
            }}
          >
            Place Order
          </Button>
        )}
      </div>

      <PositionInfo
        liquidationPrice={`${isLiquidationPx ? addDecimals(isLiquidationPx,0) : "NA"}`}
        orderValue={`${addDecimals(orderValue)} USDC`}
        marginRequired={`${addDecimals(orderValue / userLeverage)} USDC`}
        slippage="0.0008%"
        maxSlippage={maxSlippage}
        onMaxSlippageClick={() => setIsMaxSlippageDialogOpen(true)}
      />

      {/* Account Equity and Perps Overview */}
      {isConnected && address && (
        <HydrationGuard>
          <AccountEquitySection publicKey={address} />
        </HydrationGuard>
      )}
    </div>
  );
};
