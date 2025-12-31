"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronDown, X } from "lucide-react";
import AppModal from "@/components/ui/modal";
import { useAccount, useWalletClient } from 'wagmi';
import { useApiWallet } from "@/hooks/useWallet";
import { appToast } from "@/components/ui/toast";
import { useBuilderFee } from "@/hooks/useBuilderFee";
import { BUILDER_CONFIG } from "@/lib/config";
import { getAgentExchangeClient, getUserExchangeClient, infoClient, subscriptionClient } from "@/lib/config/hyperliquied/hyperliquid-client";
import { addDecimals, DATE_TIME_FORMAT } from "@/lib/constants";
import { Subscription } from "@nktkas/hyperliquid";
import { L2BookParameters } from "@nktkas/hyperliquid/api/subscription";
import HydrationGuard from "@/components/ui/hydration-guard";
import { useBottomPanelStore } from "@/store/bottom-panel";
import { useTradesStore, TradeData, } from "@/store/trades";
import Loader from "@/components/ui/loader";
import { formatDateTimeAccordingToFormat } from "@/lib/date-operation";
import { SymbolConverter } from "@nktkas/hyperliquid/utils";
import { useMarketStore } from "@/store/market";
import { fetchPerpetualMarkets } from "@/lib/services/markets";
import { toast } from "react-toastify";
import { placeOrderWithAgent, calculateSlippage } from "@/lib/services/trading-panel";

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
            ? "bg-teal-400 border-teal-400"
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
        background: `linear-gradient(to right, #2dd4bf 0%, #2dd4bf ${((currentValue - min) / (max - min)) * 100}%, #1f2937 ${((currentValue - min) / (max - min)) * 100}%, #1f2937 100%)`,
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

        {maxPositionSize && (
          <p className="text-sm text-gray-400">
            Max position size decreases the higher your leverage. The max position size for {tempLeverage}x leverage on {symbol} is {maxPositionSize}.
          </p>
        )}

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
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400" />
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
      <div className="flex justify-between text-xs text-gray-500">
        {/* <span>Price: {priceUsdc} USDC</span> */}
        {/* <span>{priceEth} {currentCurrency}</span> */}
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
  fees: string;
}

const PositionInfo = ({
  liquidationPrice,
  orderValue,
  marginRequired,
  slippage,
  maxSlippage,
  onMaxSlippageClick,
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
          EST: {slippage || "0.0000%"} MAX: <button onClick={onMaxSlippageClick} className="text-teal-400 hover:text-teal-300 underline cursor-pointer">{maxSlippage.toFixed(2)}%</button>
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">Fees</span>
        <span className="text-xs sm:text-sm text-white">0.0450% / 0.0150%</span>
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
          {/* <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Spot</span>
            <span className="text-xs sm:text-sm text-white font-mono">{spot}</span>
          </div> */}
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
                ? 'text-teal-400' 
                : 'text-red-400'
            }`}>
              {unrealizedPnl}
            </span>
          </div>
          {/* <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Cross Margin Ratio</span>
            <span className="text-xs sm:text-sm text-white font-mono">{crossMarginRatio}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Maintenance Margin</span>
            <span className="text-xs sm:text-sm text-white font-mono">{maintenanceMargin}</span>
          </div> */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Cross Account Leverage</span>
            <span className="text-xs sm:text-sm text-white font-mono">{crossAccountLeverage}</span>
          </div>
        </div>
      </div>
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

// Account Equity Section Component with real-time data
interface AccountEquitySectionProps {
  publicKey: `0x${string}`;
}

interface PerpsSummary {
  balance?: string | number;
  maintenanceMargin?: string | number;
  maintenance_requirement?: string | number;
}

interface PositionWithMaintenance {
  position: {
    maintenanceMargin?: string | number;
    maintenanceRequirement?: string | number;
    marginUsed: string;
    positionValue: string;
    unrealizedPnl: string;
    leverage: {
      type: "isolated" | "cross";
      value: number;
    };
  };
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
  const { isConnected } = useAccount();
  const [sliderValue, setSliderValue] = useState(0);
  const [orderType, setOrderType] = useState("Market");
  const [activeSide, setActiveSide] = useState<"buy" | "sell">("buy");
  const [currency, setCurrency] = useState("USDC");
  const [showAnnouncements, setShowAnnouncements] = useState(true);
  const [mounted, setMounted] = useState(false);

  const { balances, userPositions } = useBottomPanelStore();
  
  // Helper function to get the current position for the active currency
  // userPositions structure: [{ type: "oneWay", position: { coin, szi, leverage, entryPx, positionValue, unrealizedPnl, ... } }]
  // Access position data: getCurrentPosition?.position.{fieldName}
  // Available fields: coin, szi, leverage.{type|value|rawUsd}, entryPx, positionValue, unrealizedPnl, 
  //                   returnOnEquity, liquidationPx, marginUsed, maxLeverage, cumFunding.{allTime|sinceOpen|sinceChange}
  const getCurrentPosition = useMemo(() => {
    if (!userPositions || userPositions.length === 0) return null;
    // Find position matching the current currency
    return userPositions.find(p => p.position.coin === currentCurrency) || null;
  }, [userPositions, currentCurrency]);

  console.log("getCurrentPosition", getCurrentPosition?.position.leverage);

  // Two separate states for the two buttons/dialogs
  const { trades, setTrades, updateMarginAndLeverage } = useTradesStore();

  console.log("trades", trades);
  

  // Initialize with safe defaults that work on both server and client (no localStorage values)
  const [marginMode, setMarginMode] = useState<"Cross" | "Isolated">("Cross");
  // Leverage states: maxLeverage from market, userLeverage is what user sets (defaults to maxLeverage)
  const [maxLeverage, setMaxLeverage] = useState<number>(currentLeverage); // Default to market leverage, will be updated from market data
  const [userLeverage, setUserLeverage] = useState<number>(currentLeverage); // User's selected leverage for trading (initialized from stored value or maxLeverage when currency changes)

  // Dialog open states
  const [isMarginModeDialogOpen, setIsMarginModeDialogOpen] = useState(false);
  const [isLeverageDialogOpen, setIsLeverageDialogOpen] = useState(false);
  const [isMaxSlippageDialogOpen, setIsMaxSlippageDialogOpen] = useState(false);
  const [isEstablishConnectionDialogOpen, setIsEstablishConnectionDialogOpen] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  
  // Max slippage state (default 1%, range 0.01-100, cannot be 0)
  const [maxSlippage, setMaxSlippage] = useState<number>(15);
  const { address } = useAccount();
  const { isApproving: isApprovingAgent, agentPrivateKey, agentWallet, isApproved, checkApprovalStatus } = useApiWallet({userPublicKey: address as `0x${string}`});
  const { isApproving: isApprovingBuilderFee, isChecking: isCheckingBuilderFee, isApproved: isApprovedBuilderFee, checkBuilderFeeStatus } = useBuilderFee({userPublicKey: address as `0x${string}`});
  
  // Orderbook data for slippage calculation
  const [orderbookAsks, setOrderbookAsks] = useState<Array<{ px: string; sz: string }>>([]);
  const [orderbookBids, setOrderbookBids] = useState<Array<{ px: string; sz: string }>>([]);



  // Fetch recent trades via API on initial load or when currency changes
  // This sets the initial price, then websocket will update it live
  // const { data: walletClient } = useWalletClient();

  // const exchangeClient = getAgentExchangeClient(agentPrivateKey as `0x${string}`);
  // exchangeClient.updateLeverage

  // useEffect(async () => {
  //   const fsf=await infoClient.clearinghouseState({ user: address as `0x${string}` });
  //   console.log("fsf",fsf);
  // }, []);

  useEffect(() => {
    let isMounted = true;
    
    const fetchRecentTrades = async () => {
      try {
        // Clear existing trades when currency changes
        setTrades([]);
        
        // Fetch recent trades from API
        const recentTradesData = await infoClient.recentTrades({ coin: currentCurrency });
        
        if (!isMounted) return;
        
        // Transform API response to TradeData format (same as websocket format)
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
      } catch (error) {
        console.error("Error fetching recent trades:", error);
        // Don't clear trades on error, keep existing data if available
      }
    };
    
    fetchRecentTrades();
    
    return () => {
      isMounted = false;
    };
  }, [currentCurrency, setTrades]);

  // Subscribe to orderbook for slippage calculation
  useEffect(() => {
    let orderbookSubscription: Subscription | null = null;
    let isSubscribed = true;
    
    const handleSubscribeToOrderBook = async () => {
      const config: L2BookParameters = { coin: currentCurrency, nSigFigs: 5, mantissa: 2 };
      
      orderbookSubscription = await subscriptionClient.l2Book(
        config,
        (book) => {
          if (!isSubscribed) return;
          
          // book.levels[0] = bids, book.levels[1] = asks
          const bids = book.levels[0] || [];
          const asks = book.levels[1] || [];
          
          setOrderbookBids(bids);
          setOrderbookAsks(asks);
        }
      );
    };
    
    handleSubscribeToOrderBook();
    
    return () => {
      isSubscribed = false;
      if (orderbookSubscription) {
        try {
          orderbookSubscription.unsubscribe();
        } catch (error) {
          console.error("Error unsubscribing from orderbook:", error);
        }
        orderbookSubscription = null;
      }
    };
  }, [currentCurrency]);
  
  // Check if trade data is available
  const hasTradeData = trades && trades.length > 0 && trades[0]?.price !== undefined && trades[0]?.price !== null;

  const availableToTrade = useMemo(() => {
    const balanceStr = balances?.[0]?.available_balance || '0 USDC';
    const numericValue = balanceStr.replace(' USDC', '').trim();
    return Number(numericValue) || 0;
  }, [balances]);
  const currentPosition = addDecimals(getCurrentPosition?.position.szi || 0, 6);

  // Get currentCurrency price from market data - using a reasonable default for now
  // In production, this should come from orderbook or market data subscription
  const currencyPrice = trades[0]?.price || 0; // USDC per currentCurrency (should be fetched from market)
  const currencyPriceInCurrency = 1; // 1 currentCurrency = 1 currentCurrency

  // Calculate values based on slider (0-100%)
  const calculatedValues = useMemo(() => {
    const percentage = sliderValue ;
    
    // Order value (notional) = availableToTrade * userLeverage * percentage
    // This is the total position size you can open with leverage
    const orderValue = (availableToTrade * userLeverage * percentage) / 100;
    
    // Size in USDC (same as order value for USDC)
    const sizeUsdc = orderValue;
    
    // Size in currentCurrency - handle division by zero
    const sizeCurrency = currencyPrice > 0 ? orderValue / currencyPrice : 0;
    
    // Display size based on selected currency
    const displaySize = currency === "USDC" ? sizeUsdc : sizeCurrency;
    
    // Calculate margin required (order value / leverage)
    // This is how much margin you need from your available balance
    const marginRequired = orderValue / userLeverage;
    
    // Calculate liquidation price based on margin mode (Cross or Isolated)
    let liquidationPrice: number | null = null;
    
    // Maintenance margin rate (typically 0.5% for 10x leverage, adjust based on leverage)
    const maintenanceMarginRate = 0.005; // 0.5% default
    
    // Check if we have an existing position
    const hasExistingPosition = getCurrentPosition && Number(getCurrentPosition.position.szi) !== 0;
    
    // Determine margin mode - use position's leverage type if available, otherwise use selected marginMode
    const positionMarginMode = getCurrentPosition?.position.leverage?.type === "cross" ? "Cross" : 
                              getCurrentPosition?.position.leverage?.type === "isolated" ? "Isolated" : 
                              marginMode;
    
    if (hasExistingPosition) {
      // For existing positions
      const entryPrice = getCurrentPosition.position.entryPx 
        ? Number(getCurrentPosition.position.entryPx) 
        : currencyPrice;
      const positionSizeRaw = Number(getCurrentPosition.position.szi); // signed position size
      const positionSizeAbs = Math.abs(positionSizeRaw);
      const positionValue = Number(getCurrentPosition.position.positionValue || 0);
      const positionMarginUsed = Number(getCurrentPosition.position.marginUsed || 0);
      
      if (positionSizeAbs > 0) {
        if (positionMarginMode === "Cross") {
          // Cross Margin Formula: Liquidation Price = (Order Value - Account Balance) / (Position Size × (1 - Maintenance Margin Rate))
          // For existing position: use position value and account balance
          const netDebt = positionValue - availableToTrade;
          liquidationPrice = netDebt / (positionSizeAbs * (1 - maintenanceMarginRate));
        } else {
          // Isolated Margin: Use position-based calculation
          const maintenanceMarginUSD = positionMarginUsed * 0.25; // 25% of initial margin
          
          if (positionSizeRaw > 0) {
            // Long position
            liquidationPrice = entryPrice + (maintenanceMarginUSD - positionMarginUsed) / positionSizeRaw;
          } else {
            // Short position
            liquidationPrice = entryPrice - (maintenanceMarginUSD - positionMarginUsed) / positionSizeAbs;
          }
        }
      }
    } else if (sizeCurrency > 0 && currencyPrice > 0 && orderValue > 0) {
      // For new orders, calculate based on order size
      const entryPrice = currencyPrice; // Use current market price as entry price
      const positionSize = sizeCurrency; // base size
      const isLong = activeSide === "buy";
      
      if (marginMode === "Cross") {
        // Cross Margin Formula for new order:
        // Liquidation Price = (Order Value - Account Balance) / (Position Size × (1 - Maintenance Margin Rate))
        const netDebt = orderValue - availableToTrade;
        if (netDebt > 0 && positionSize > 0) {
          liquidationPrice = netDebt / (positionSize * (1 - maintenanceMarginRate));
        }
      } else {
        // Isolated Margin: Use simplified formula
        // Liquidation Price = Entry Price × (1 - 1/Leverage) / (1 - Maintenance Margin Rate) for long
        if (isLong) {
          liquidationPrice = entryPrice * (1 - (1 / userLeverage)) / (1 - maintenanceMarginRate);
        } else {
          liquidationPrice = entryPrice * (1 + (1 / userLeverage)) / (1 + maintenanceMarginRate);
        }
      }
    }
    
    // Fallback to 0 if calculation failed
    const finalLiquidationPrice = liquidationPrice ?? 0;

    // Calculate slippage for market orders
    let slippagePercent = 0;
    if (orderbookBids.length > 0 && orderbookAsks.length > 0 && sizeCurrency > 0) {
      const orderSide = activeSide === "buy" ? "buy" : "sell";
      slippagePercent = calculateSlippage(
        { bids: orderbookBids, asks: orderbookAsks },
        sizeCurrency,
        orderSide
      );
    }

    const slippageString = slippagePercent !== 0 
      ? `${slippagePercent >= 0 ? '' : ''}${slippagePercent.toFixed(4)}`
      : "0.0000%";

    return {
      size: currency === "USDC" 
        ? addDecimals(sizeUsdc) 
        : addDecimals(sizeCurrency, 4),
      sizeUsdc: addDecimals(sizeUsdc),
      sizeCurrency: addDecimals(sizeCurrency, 6),
      orderValue: addDecimals(orderValue),
      marginRequired: addDecimals(marginRequired),
      liquidationPrice: finalLiquidationPrice > 0 ? addDecimals(finalLiquidationPrice, 2) : "0.00",
      priceUsdc: addDecimals(currencyPrice, 2),
      priceCurrency: addDecimals(currencyPriceInCurrency, 6),
      slippage: slippageString,
    };
  }, [sliderValue, availableToTrade, currencyPrice, userLeverage, getCurrentPosition, currency, activeSide, trades, marginMode, orderbookBids, orderbookAsks]);

  console.log("calculatedValues", calculatedValues.orderValue);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <div className="w-full sm:w-80 lg:w-96 bg-gray-950 border-l border-gray-800 flex flex-col text-xs h-full overflow-hidden relative">
      {/* Loading Overlay */}
      {!hasTradeData && (
        <div className="absolute inset-0 bg-gray-950/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <Loader variant="secondary" size="lg" />
          <p className="text-sm text-gray-400 mt-4">Loading market data...</p>
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
        availableToTrade={`${addDecimals(availableToTrade)} USDC`} 
        currentPosition={`${currentPosition} ${currentCurrency}`} 
      />

      <div className="p-2 sm:p-3 space-y-3 border-b border-gray-800">
        <SizeInput
          size={calculatedValues.size}
          currency={currency}
          onCurrencyChange={() => setCurrency(currency === "USDC" ? currentCurrency : "USDC")}

        />

        <SizeSlider value={sliderValue} onChange={setSliderValue} disabled={!hasTradeData} />
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
            variant="primary" 
            size="lg" 
            className="w-full"
            isLoading={(isApprovingBuilderFee || isApprovingAgent || isCheckingBuilderFee)}
            isDisabled={(isApprovingBuilderFee || isApprovingAgent || isCheckingBuilderFee) || !hasTradeData}
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

              const s=(addDecimals(Number(calculatedValues.orderValue) / Number(trades[0]?.price), 4)).toString();
              // Use max slippage (convert from percentage to decimal: maxSlippage / 100)
              const p=(addDecimals(Number(trades[0]?.price) * (1 + (maxSlippage / 100)), 2)).toString();
              console.log("calculatedValues s", s); 
              console.log("calculatedValues p", p);
              console.log("maxSlippage", maxSlippage);

              if(isApproved && isApprovedBuilderFee){
                placeOrderWithAgent({
                  agentPrivateKey: agentPrivateKey as `0x${string}`,
                  a: currentCurrency,
                  b: true, 
                  s: s,
                  p: p,
                  r: false,
                });
              } 
            }}
          >
            Place Order
          </Button>
        )}
      </div>

      <PositionInfo
        liquidationPrice={`${calculatedValues.liquidationPrice}`}
        orderValue={`${calculatedValues.orderValue} USDC`}
        marginRequired={`${calculatedValues.marginRequired} USDC`}
        slippage={calculatedValues.slippage || "0.0000%"}
        maxSlippage={maxSlippage}
        onMaxSlippageClick={() => setIsMaxSlippageDialogOpen(true)}
        fees="0.0450% / 0.0150%"
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
