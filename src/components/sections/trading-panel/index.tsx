"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
import { useMarketStore } from "@/store/market";
import { formatDateTimeAccordingToFormat } from "@/lib/date-operation";
import { formatPrice } from "@nktkas/hyperliquid/utils";
import { errorHandler } from "@/store/errorHandler";
import { TakeProfitStopLossInputs } from "./TakeProfitStopLossInputs";
import { ORDER_DIRECTION, type OrderDirection } from "@/types/tpsl";

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
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-bold transition-all focus:outline-none disabled:opacity-40 disabled:pointer-events-none";
  
  const variants = {
    default: "bg-gray-800/50 text-gray-300 hover:bg-gray-800/70 border border-gray-700/30",
    ghost: "bg-transparent text-gray-400 hover:bg-gray-800/40 hover:text-gray-300",
    outline: "border border-gray-700/30 bg-transparent text-gray-400 hover:bg-gray-800/40 hover:text-gray-300 hover:border-gray-600/40",
    success: "bg-green-500 text-white hover:bg-green-400 shadow-md shadow-green-500/25",
    danger: "bg-red-500 text-white hover:bg-red-400 shadow-md shadow-red-500/25",
    primary: "bg-green-500 text-white hover:bg-green-400 shadow-md shadow-green-500/25",
  };
  
  const sizes = {
    sm: "h-7 px-2 text-xs",
    md: "h-8 px-3 text-xs sm:text-sm",
    lg: "h-10 px-4 text-sm",
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
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className = "", ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`flex h-9 w-full rounded-lg bg-gray-800/40 border border-gray-700/50 px-3 py-1 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500/30 focus:border-green-500/30 disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${className}`}
      {...props}
    />
  );
});

Input.displayName = "Input";

// Label Component
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export const Label = ({ className = "", children, ...props }: LabelProps) => {
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
        className={`inline-flex items-center justify-center h-4 w-4 rounded-[4px] border cursor-pointer transition-colors ${
          checked
            ? "bg-green-500 border-green-500"
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
      <div className="relative w-full h-1.5 flex items-center rounded-full" style={{
        background: `linear-gradient(to right, var(--color-green-500, #10b981) 0%, var(--color-green-500, #10b981) ${((currentValue - min) / (max - min)) * 100}%, #1f293780 ${((currentValue - min) / (max - min)) * 100}%, #1f293780 100%)`,
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
  selectedMode: "cross" | "isolated";
  onConfirm: (mode: "cross" | "isolated") => void;
  symbol: string;
}

const MarginModeDialog = ({ isOpen, onClose, selectedMode, onConfirm, symbol }: MarginModeDialogProps) => {
  const [tempMode, setTempMode] = useState<"cross" | "isolated">(selectedMode);

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
      <div className="space-y-3">
        {/* Cross Mode Option */}
        <button
          onClick={() => setTempMode("cross")}
          className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
            tempMode === "cross"
              ? "bg-green-500/8 border-green-500/30 ring-1 ring-green-500/20"
              : "bg-gray-800/30 border-gray-800/60 hover:border-gray-700/60 hover:bg-gray-800/50"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
              tempMode === "cross" ? "border-green-400 bg-green-400" : "border-gray-600"
            }`}>
              {tempMode === "cross" && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <span className={`text-sm font-semibold ${tempMode === "cross" ? "text-white" : "text-gray-300"}`}>
                Cross
              </span>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                All cross positions share the same cross margin as collateral. In the event of liquidation, your cross margin balance and any remaining open positions under assets in this mode may be forfeited.
              </p>
            </div>
          </div>
        </button>

        {/* Isolated Mode Option */}
        <button
          onClick={() => setTempMode("isolated")}
          className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
            tempMode === "isolated"
              ? "bg-green-500/8 border-green-500/30 ring-1 ring-green-500/20"
              : "bg-gray-800/30 border-gray-800/60 hover:border-gray-700/60 hover:bg-gray-800/50"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
              tempMode === "isolated" ? "border-green-400 bg-green-400" : "border-gray-600"
            }`}>
              {tempMode === "isolated" && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <span className={`text-sm font-semibold ${tempMode === "isolated" ? "text-white" : "text-gray-300"}`}>
                Isolated
              </span>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Manage your risk on individual positions by restricting the amount of margin allocated to each. If the margin ratio of an isolated position reaches 100%, the position will be liquidated. Margin can be added or removed to individual positions in this mode.
              </p>
            </div>
          </div>
        </button>
      </div>

      <button
        onClick={handleConfirm}
        className="w-full h-11 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold text-sm transition-colors cursor-pointer"
      >
        Confirm
      </button>
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
      <p className="text-sm text-gray-400 leading-relaxed">
        Control the leverage used for <span className="text-white font-medium">{symbol}</span> positions. The maximum leverage is <span className="text-white font-medium">{maxLeverage}x</span>.
      </p>

      {/* Leverage display */}
      <div className="flex items-center justify-center py-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-white font-mono">{tempLeverage}<span className="text-green-400 text-2xl ml-0.5">x</span></div>
          <div className="text-xs text-gray-500 mt-1">Leverage</div>
        </div>
      </div>

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
              className="w-16 h-9 text-center px-2 rounded-lg"
            />
            <span className="text-gray-400 text-sm">x</span>
          </div>
        </div>
        {/* Quick select buttons */}
        <div className="flex gap-2">
          {[1, 5, 10, 25, maxLeverage].filter((v) => v <= maxLeverage).filter((v, i, a) => a.indexOf(v) === i).map((val) => (
            <button
              key={val}
              onClick={() => setTempLeverage(val)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                tempLeverage === val
                  ? "bg-green-500/15 text-green-400 border border-green-500/25"
                  : "bg-gray-800/50 text-gray-400 hover:text-white border border-gray-800/60 hover:border-gray-700"
              }`}
            >
              {val}x
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleConfirm}
        className="w-full h-11 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold text-sm transition-colors cursor-pointer"
      >
        Confirm
      </button>

      <div className="flex items-start gap-2.5 bg-amber-500/5 border border-amber-500/15 rounded-xl p-3.5">
        <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <p className="text-xs text-amber-200/70 leading-relaxed">
          Higher leverage increases the risk of liquidation.
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
      <div className="flex items-center justify-center py-2">
        <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
          <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.514a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.343 8.97" />
          </svg>
        </div>
      </div>

      <p className="text-sm text-gray-400 text-center leading-relaxed">
        This signature is gas-free to send. It opens a decentralized channel for <span className="text-white">gas-free</span> and <span className="text-white">instantaneous</span> trading.
      </p>

      <button
        onClick={() => setStayConnected(!stayConnected)}
        className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
          stayConnected
            ? "bg-green-500/8 border-green-500/30"
            : "bg-gray-800/30 border-gray-800/60 hover:border-gray-700/60"
        }`}
      >
        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
          stayConnected ? "border-green-400 bg-green-400" : "border-gray-600"
        }`}>
          {stayConnected && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <span className={`text-sm font-medium ${stayConnected ? "text-white" : "text-gray-400"}`}>Stay Connected</span>
      </button>

      <button
        onClick={handleEstablish}
        disabled={!stayConnected}
        className={`w-full h-11 rounded-xl font-semibold text-sm transition-colors cursor-pointer ${
          stayConnected
            ? "bg-green-500 hover:bg-green-400 text-white"
            : "bg-gray-800 text-gray-500 cursor-not-allowed"
        }`}
      >
        Establish Connection
      </button>
    </AppModal>
  );
};

// Trading Mode Tabs Component
interface TradingModeTabsProps {
  marginMode: "cross" | "isolated";
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
    <div className="p-2 sm:p-3 border-b border-gray-800/30">
      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={onMarginModeClick}
          className="h-8 text-[11px] font-semibold rounded-lg transition-all bg-gray-800/50 text-gray-300 hover:bg-gray-800/80 hover:text-white border border-gray-700/30 hover:border-gray-600/40"
        >
          {marginMode.charAt(0).toUpperCase() + marginMode.slice(1)}
        </button>
        <button
          onClick={onLeverageClick}
          className="h-8 text-[11px] font-semibold rounded-lg transition-all bg-green-500/10 text-green-400 hover:bg-green-500/15 border border-green-500/20 hover:border-green-500/30"
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
    <div className="px-2 sm:px-3 py-2 border-b border-gray-800/30">
      <div className="grid grid-cols-2 gap-1 bg-gray-900/50 p-0.5 rounded-lg border border-gray-800/20">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => onTypeChange(type)}
            className={`h-7 text-[11px] font-semibold rounded-md transition-all ${
              activeType === type
                ? "bg-gray-800/70 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/20"
            }`}
          >
            {type}
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
    <div className="p-2 sm:p-3 border-b border-gray-800/30">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onSideChange("buy")}
          className={`h-9 text-xs sm:text-[13px] font-bold rounded-lg transition-all ${
            activeSide === "buy"
              ? "bg-green-500 text-white hover:bg-green-400 shadow-md shadow-green-500/25"
              : "bg-gray-800/40 text-gray-500 hover:bg-gray-800/60 hover:text-gray-300 border border-gray-700/30"
          }`}
        >
          Buy / Long
        </button>
        <button
          onClick={() => onSideChange("sell")}
          className={`h-9 text-xs sm:text-[13px] font-bold rounded-lg transition-all ${
            activeSide === "sell"
              ? "bg-red-500 text-white hover:bg-red-400 shadow-md shadow-red-500/25"
              : "bg-gray-800/40 text-gray-500 hover:bg-gray-800/60 hover:text-gray-300 border border-gray-700/30"
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
  const positionColor = isNegative ? 'text-red-400' : 'text-green-400';
  
  const displayValue = isNegative ? parts[0].replace('-', '') : parts[0];
  const displayPosition = `${displayValue} ${parts[1] || ''}`.trim();
  
  return (
    <div className="p-2 sm:p-3 space-y-2 border-b border-gray-800/30">
      <div className="flex justify-between items-center py-0.5">
        <span className="text-[11px] text-gray-500 font-medium">Available to Trade</span>
        <span className="text-[11px] text-gray-200 font-mono tabular-nums font-semibold">{availableToTrade}</span>
      </div>
      <div className="flex justify-between items-center py-0.5">
        <span className="text-[11px] text-gray-500 font-medium">Current Position</span>
        <span className={`text-[11px] font-mono tabular-nums font-semibold ${positionColor}`}>{displayPosition}</span>
      </div>
    </div>
  );
};

// Size Input Component
interface SizeInputProps {
  size: string;
  currency: string;
  onCurrencyChange: () => void;
  onChange?: (value: string) => void;
  hasError?: boolean;
  maxDecimals?: number;
}

const SizeInput = ({ size, currency, onCurrencyChange, onChange, hasError, maxDecimals = 2 }: SizeInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow empty value
    if (value === '') {
      onChange?.(value);
      return;
    }

    // Allow only numbers and one decimal point
    if (!/^\d*\.?\d*$/.test(value)) return;

    // Split by decimal point
    const parts = value.split('.');
    const integerPart = parts[0] || '';
    const decimalPart = parts[1];

    // Limit decimal places based on currency (USDC = 2, market currency = szDecimals)
    if (decimalPart !== undefined && decimalPart.length > maxDecimals) return;

    // Total digits (excluding decimal point) max 12
    const totalDigits = integerPart.length + (decimalPart?.length || 0);
    if (totalDigits > 12) return;

    onChange?.(value);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Size</Label>
      <div className="relative group">
        <Input
          value={size}
          onChange={handleChange}
          placeholder="0.00"
          className={`h-9 text-right font-mono text-sm pr-20 sm:pr-24 rounded-lg bg-gray-800/30 border-gray-700/40 focus:border-green-500/40 focus:ring-1 focus:ring-green-500/20 transition-all ${hasError ? 'ring-2 ring-red-500/60 border-red-500/40 focus:ring-red-500/40' : ''}`}
        />
        <button
          onClick={onCurrencyChange}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 h-6 px-2 text-[10px] font-medium text-gray-400 hover:text-white flex items-center gap-1 transition-all rounded-md hover:bg-gray-700/40 border border-transparent hover:border-gray-600/30"
        >
          {currency} <ChevronDown className="h-2.5 w-2.5" />
        </button>
      </div>
      {hasError && (
        <p className="text-[10px] text-red-400 font-medium">Size exceeds maximum available</p>
      )}
    </div>
  );
};

// Price Input Component for Limit Orders
interface PriceInputProps {
  price: string;
  onPriceChange: (price: string) => void;
  onMidClick: () => void;
  disabled?: boolean;
  maxDecimals?: number;
}

const PriceInput = ({ price, onPriceChange, onMidClick, disabled = false, maxDecimals = 2 }: PriceInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow empty value
    if (value === '') {
      onPriceChange(value);
      return;
    }

    // Allow only numbers and one decimal point
    if (!/^\d*\.?\d*$/.test(value)) return;

    // Split by decimal point
    const parts = value.split('.');
    const integerPart = parts[0] || '';
    const decimalPart = parts[1];

    // Limit decimal places
    if (decimalPart !== undefined && decimalPart.length > maxDecimals) return;

    // Total digits (excluding decimal point) max 12
    const totalDigits = integerPart.length + (decimalPart?.length || 0);
    if (totalDigits > 12) return;

    onPriceChange(value);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Price (USDC)</Label>
      <div className="relative group">
        <Input
          type="text"
          value={price}
          onChange={handleChange}
          placeholder="0.00"
          disabled={disabled}
          className="h-9 text-right font-mono text-sm pr-16 sm:pr-20 rounded-lg bg-gray-800/30 border-gray-700/40 focus:border-green-500/40 focus:ring-1 focus:ring-green-500/20 transition-all"
        />
        <button
          onClick={onMidClick}
          disabled={disabled}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 h-6 px-2.5 text-[10px] font-semibold bg-green-500/12 text-green-400 hover:bg-green-500/20 rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-green-500/15 hover:border-green-500/25"
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
        <div className={`text-[11px] text-gray-300 min-w-12 text-right tabular-nums ${disabled ? 'opacity-50' : ''}`}>
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
          w-full h-9 rounded-lg bg-gray-800/40 border border-gray-700/50 
          px-3 py-1.5 text-xs text-gray-200
          flex items-center justify-between
          hover:bg-gray-800/60 hover:border-gray-600/50
          transition-colors focus:outline-none focus:ring-1 focus:ring-green-500/30 focus:border-green-500/30
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span>{value}</span>
        <ChevronDown className={`h-3 w-3 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      
      {showTooltip && !disabled && !isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl shadow-black/40 z-30 p-3">
          <div className="text-[11px] font-semibold text-white mb-2">Time In Force</div>
          <div className="space-y-2.5">
            {options.map((option) => {
              const info = tooltipContent[option];
              return (
                <div key={option} className="text-[11px]">
                  <div className="font-semibold text-gray-200">
                    {option} ({info.name})
                  </div>
                  <div className="text-gray-500 mt-0.5">
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
          <div className="absolute top-full left-0 mt-1.5 w-full bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl shadow-black/40 z-20 overflow-hidden">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`
                  w-full text-left px-3 py-2 text-xs transition-colors
                  ${value === option 
                    ? "bg-green-500/15 text-green-400" 
                    : "text-gray-400 hover:bg-gray-800/40 hover:text-gray-200"
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
      {/* Slippage display */}
      <div className="flex items-center justify-center py-3">
        <div className="text-center">
          <div className="text-3xl font-bold text-white font-mono">{Math.round(tempMaxSlippage)}<span className="text-green-400 text-xl ml-0.5">%</span></div>
          <div className="text-xs text-gray-500 mt-1">Max Slippage</div>
        </div>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        Max slippage only affects market orders. Closing positions uses <span className="text-gray-300">8%</span> and market TP/SL orders use <span className="text-gray-300">10%</span>.
      </p>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Slider
            value={[Math.max(1, Math.min(100, Math.round(tempMaxSlippage)))]}
            onChange={(vals) => {
              const val = vals[0];
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
              className="w-16 h-9 text-center px-2 rounded-lg"
            />
            <span className="text-gray-400 text-sm">%</span>
          </div>
        </div>
        {/* Quick select buttons */}
        <div className="flex gap-2">
          {[1, 3, 5, 10, 25].map((val) => (
            <button
              key={val}
              onClick={() => setTempMaxSlippage(val)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                Math.round(tempMaxSlippage) === val
                  ? "bg-green-500/15 text-green-400 border border-green-500/25"
                  : "bg-gray-800/50 text-gray-400 hover:text-white border border-gray-800/60 hover:border-gray-700"
              }`}
            >
              {val}%
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleConfirm}
        className="w-full h-11 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold text-sm transition-colors cursor-pointer"
      >
        Confirm
      </button>
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
    <div className="p-2 sm:p-3 space-y-1 border-b border-gray-800/30">
      <div className="flex justify-between items-center py-0.5">
        <span className="text-[10px] text-gray-500 font-medium">Liquidation Price</span>
        <span className="text-[11px] text-gray-200 tabular-nums font-mono">{liquidationPrice}</span>
      </div>
      <div className="flex justify-between items-center py-0.5">
        <span className="text-[10px] text-gray-500 font-medium">Order Value</span>
        <span className="text-[11px] text-gray-200 tabular-nums font-mono">{orderValue}</span>
      </div>
      <div className="flex justify-between items-center py-0.5">
        <span className="text-[10px] text-gray-500 font-medium">Margin Required</span>
        <span className="text-[11px] text-gray-200 tabular-nums font-mono">{marginRequired}</span>
      </div>
      <div className="flex justify-between items-center py-0.5">
        <span className="text-[10px] text-gray-500 font-medium">Slippage</span>
        <span className="text-[11px] text-gray-200 tabular-nums font-mono">
          MAX: <button onClick={onMaxSlippageClick} className="text-green-400 hover:text-green-300 cursor-pointer font-semibold">{maxSlippage.toFixed(2)}%</button>
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
    <div className="p-2 sm:p-3 space-y-3 border-b border-gray-800/30">
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <div className="w-1 h-3 rounded-full bg-green-500/60" />
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Account Equity</span>
        </div>
        <div className="flex justify-between items-center py-0.5">
          <span className="text-[10px] text-gray-500 font-medium">Perps</span>
          <span className="text-[11px] text-gray-200 font-mono tabular-nums font-semibold">{perps}</span>
        </div>
      </div>

      <div className="space-y-1.5 pt-2 border-t border-gray-800/20">
        <div className="flex items-center gap-1.5">
          <div className="w-1 h-3 rounded-full bg-green-500/60" />
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Perps Overview</span>
        </div>
        <div className="space-y-0.5">
          <div className="flex justify-between items-center py-0.5">
            <span className="text-[10px] text-gray-500 font-medium">Balance</span>
            <span className="text-[11px] text-gray-200 font-mono tabular-nums">{balance}</span>
          </div>
          <div className="flex justify-between items-center py-0.5">
            <span className="text-[10px] text-gray-500 font-medium">Unrealized PNL</span>
            <span className={`text-[11px] font-mono tabular-nums font-semibold ${
              unrealizedPnlValue >= 0 
                ? 'text-green-400' 
                : 'text-red-400'
            }`}>
              {unrealizedPnl}
            </span>
          </div>
          <div className="flex justify-between items-center py-0.5">
            <span className="text-[10px] text-gray-500 font-medium">Cross Account Leverage</span>
            <span className="text-[11px] text-gray-200 font-mono tabular-nums">{crossAccountLeverage}</span>
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
  const { trades, setTrades, updateMarginAndLeverage, placeOrderWithAgent, maxSlippage, setMaxSlippage } = useTradesStore();
  const { bids, asks } = useOrderBookStore();
  const { markPrice, setMarkPrice } = useMarketStore();
  const { isApproving: isApprovingAgent, agentPrivateKey, agentWallet, isApproved, checkApprovalStatus, checkAgentApproval } = useApiWallet({userPublicKey: address as `0x${string}`});
  const { isApproving: isApprovingBuilderFee, isChecking: isCheckingBuilderFee, isApproved: isApprovedBuilderFee, checkBuilderFeeStatus } = useBuilderFee({userPublicKey: address as `0x${string}`});

  console.log("isApproved", isApproved);
  
  // ==================== useState Declarations ====================
  // Trading form states
  const [sliderValue, setSliderValue] = useState(0);
  const [orderType, setOrderType] = useState("Market");
  const [activeSide, setActiveSide] = useState<"buy" | "sell">("buy");
  const [currency, setCurrency] = useState("USDC");
  const [mounted, setMounted] = useState(false);
  
  // Manual size input states
  const [sizeInputValue, setSizeInputValue] = useState("0.00");
  const [isManualSizeInput, setIsManualSizeInput] = useState(false);
  
  // Margin and leverage states
  const [marginMode, setMarginMode] = useState<"cross" | "isolated">("cross");
  const [maxLeverage, setMaxLeverage] = useState<number>(currentLeverage);
  const [userLeverage, setUserLeverage] = useState<number>(currentLeverage);
  
  // Dialog open states
  const [isMarginModeDialogOpen, setIsMarginModeDialogOpen] = useState(false);
  const [isLeverageDialogOpen, setIsLeverageDialogOpen] = useState(false);
  const [isMaxSlippageDialogOpen, setIsMaxSlippageDialogOpen] = useState(false);
  const [isEstablishConnectionDialogOpen, setIsEstablishConnectionDialogOpen] = useState(false);
  
  // Decimals state
  const [szDecimals, setSzDecimals] = useState<number>(0);
  
  // Price and order states
  const [limitOrderPrice, setLimitOrderPrice] = useState<string>("");
  const [timeInForce, setTimeInForce] = useState<"GTC" | "IOC" | "ALO">("GTC");
  
  // TP/SL states
  const [isTpslEnabled, setIsTpslEnabled] = useState(false);
  const [takeProfitPrice, setTakeProfitPrice] = useState<number | undefined>(undefined);
  const [stopLossPrice, setStopLossPrice] = useState<number | undefined>(undefined);
  const { tpslVariant, setTpslVariant } = useTradesStore();
  
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
      setAvailableToTradeBuy(0);
      setAvailableToTradeSell(0);
      setCurrentPosition(0);
      setIsLiquidationPx(0);
      checkAllDataReady();
      return;
    }

    // Reset position data state when address or currency changes
    positionDataReadyRef.current = false;

    const webData2Sub = subscriptionClient.webData2({user:address as `0x${string}`}, (data) => {
      const clearinghouseState = data.clearinghouseState;
      
      const positionData = clearinghouseState.assetPositions.filter((position) => position.position.coin === currentCurrency)[0];
      const positionValue = positionData ? Number(positionData.position.szi) : 0;
      setCurrentPosition(positionValue);

      const liquidationPx = positionData?.position?.liquidationPx;
      setIsLiquidationPx(Number(liquidationPx ?? 0));

      positionDataReadyRef.current = true;
      checkAllDataReady();
    });

    const activeAssetSub = subscriptionClient.activeAssetData({user:address as `0x${string}`,coin:currentCurrency}, (data) => {
      console.log("mine bro   ",data);
      if (data.coin === currentCurrency) {
        setAvailableToTradeBuy(Number(data?.availableToTrade[0]) > 0 ? Number(data.availableToTrade[0]) : 0);
        setAvailableToTradeSell(Number(data?.availableToTrade[1]) > 0 ? Number(data.availableToTrade[1]) : 0);

        setMarginMode(data?.leverage.type === "isolated" ? "isolated" : "cross");
        setUserLeverage(Number(data?.leverage.value));
        setMarkPrice(Number(data?.markPx));
      }
    });

    return () => {
      webData2Sub.then(sub => sub.unsubscribe()).catch(() => {});
      activeAssetSub.then(sub => sub.unsubscribe()).catch(() => {});
    };
  }, [address, currentCurrency, checkAllDataReady, setMarkPrice]);

  console.log("markPrice",markPrice);
  

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
  const sliderBasedOrderValue = (availableToTrade * userLeverage * sliderValue) / 100;
  
  // When manual input is active, derive order value from typed value; otherwise use slider
  let orderValue: number;
  let orderValueInCurrency: number;

  if (isManualSizeInput && sizeInputValue !== '') {
    const typedValue = parseFloat(sizeInputValue) || 0;
    if (currency === 'USDC') {
      orderValue = typedValue;
      orderValueInCurrency = currencyPrice > 0 && isFinite(currencyPrice) ? typedValue / currencyPrice : 0;
    } else {
      orderValueInCurrency = typedValue;
      orderValue = typedValue * currencyPrice;
    }
  } else {
    orderValue = sliderBasedOrderValue;
    orderValueInCurrency = currencyPrice > 0 && isFinite(currencyPrice)
      ? sliderBasedOrderValue / currencyPrice 
      : 0;
  }

  // Max order value for validation (slider at 100%)
  const maxOrderValueUsdc = availableToTrade * userLeverage;
  const isSizeExceedsMax = orderValue > maxOrderValueUsdc && orderValue > 0;
  
  // Calculate market price (p) for market orders
  // Formula: markPrice ± (slippage percentage of markPrice), then format according to Hyperliquid rules
  let marketPrice = null;
  if (sliderValue > 0 && markPrice !== null && markPrice > 0 && currentCurrency && szDecimals > 0) {
    try {
      const isBuy = activeSide === "buy";
      
      // Calculate slippage amount as percentage of markPrice
      const slippageAmount = markPrice * (maxSlippage / 100);
      
      // Apply slippage: for buy (long) add slippage, for sell (short) subtract slippage
      let rawPrice = isBuy 
        ? markPrice + slippageAmount 
        : markPrice - slippageAmount;
      
      // Format using Hyperliquid's formatPrice utility with szDecimals
      marketPrice = formatPrice(String(rawPrice), szDecimals);
    } catch (error) {
      console.error("Error calculating market price:", error);
    }
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync slider → input: when slider changes and not manually editing, update the input display
  useEffect(() => {
    if (!isManualSizeInput) {
      const displayValue = currency === "USDC" 
        ? addDecimals(sliderBasedOrderValue) 
        : addDecimals(sliderBasedOrderValue > 0 && currencyPrice > 0 ? sliderBasedOrderValue / currencyPrice : 0, szDecimals);
      setSizeInputValue(displayValue);
    }
  }, [isManualSizeInput, sliderBasedOrderValue, currency, currencyPrice, szDecimals]);

  // Handle manual size input change
  const handleSizeInputChange = useCallback((value: string) => {
    setSizeInputValue(value);
    setIsManualSizeInput(true);

    const numValue = parseFloat(value);
    if (value === '' || isNaN(numValue) || numValue === 0) {
      setSliderValue(0);
      return;
    }

    // Reverse-calculate slider value from typed value
    let orderVal: number;
    if (currency === 'USDC') {
      orderVal = numValue;
    } else {
      orderVal = numValue * currencyPrice;
    }

    const maxVal = availableToTrade * userLeverage;
    if (maxVal > 0) {
      const newSlider = Math.min(100, Math.round((orderVal * 100) / maxVal));
      setSliderValue(newSlider);
    }
  }, [currency, currencyPrice, availableToTrade, userLeverage]);

  // Handle slider change (user drags slider directly)
  const handleSliderChange = useCallback((value: number) => {
    setSliderValue(value);
    setIsManualSizeInput(false);
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
    setMarkPrice(null); // Reset mark price when currency changes
    setIsTpslEnabled(false); // Reset TP/SL when currency changes
    setTakeProfitPrice(undefined);
    setStopLossPrice(undefined);
    setSizeInputValue("0.00"); // Reset size input
    setIsManualSizeInput(false); // Reset manual input flag
  }, [currentCurrency, setMarkPrice]);

  // Handle mid price click - set limit order price to mid price
  const handleMidPriceClick = () => {
    if (midPrice > 0) {
      const formattedPrice = formatPrice(String(midPrice), szDecimals);
      setLimitOrderPrice(formattedPrice);
    }
  };

  // Sync margin mode and leverage when currency changes or stored values update (client-side only)
  useEffect(() => {
    setMaxLeverage(currentLeverage);
  }, [currentLeverage]);

  return (
    <div className="w-full sm:w-80 lg:w-full bg-gray-950 flex flex-col text-xs h-full overflow-hidden relative">
      {isLoadingInitialData && (
        <div className="absolute inset-0 bg-gray-950/90 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-gray-800 border-t-green-400 animate-spin" />
            <span className="text-xs text-gray-500">Loading trading data...</span>
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
        onConfirm={async (mode: "cross" | "isolated") => {
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

      <div className="p-2 sm:p-3 space-y-3 border-b border-gray-800/30">
        {orderType === "Limit" && (
          <PriceInput
            price={limitOrderPrice}
            onPriceChange={setLimitOrderPrice}
            onMidClick={handleMidPriceClick}
            disabled={midPrice === 0 || isLoadingInitialData}
          />
        )}


        <SizeInput
          size={sizeInputValue}
          currency={currency}
          onCurrencyChange={() => {
            setCurrency(currency === "USDC" ? currentCurrency : "USDC");
            setIsManualSizeInput(false);
          }}
          onChange={handleSizeInputChange}
          hasError={isSizeExceedsMax}
          maxDecimals={currency === "USDC" ? 2 : szDecimals}
        />
        <SizeSlider value={sliderValue} onChange={handleSliderChange} disabled={isLoadingInitialData} />
          {orderType === "Limit" && (
            <div className="space-y-1.5">
              <Label className="text-[11px] text-gray-500">TIF</Label>
              <TIFDropdown
                value={timeInForce}
                onChange={setTimeInForce}
                disabled={isLoadingInitialData}
              />
            </div>
          )}

          {/* Reduce Only Checkbox */}
          {/* <div className="flex items-center gap-2">
            <Checkbox
              id="reduce-only"
              checked={false}
              onChange={() => {}}
            />
            <Label htmlFor="reduce-only" className="text-xs text-gray-400 cursor-pointer">
              Reduce Only
            </Label>
          </div> */}

          {/* Take Profit / Stop Loss Checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="tpsl-enabled"
              checked={isTpslEnabled}
              onChange={(e) => {
                setIsTpslEnabled(e.target.checked);
                if (!e.target.checked) {
                  setTakeProfitPrice(undefined);
                  setStopLossPrice(undefined);
                }
              }}
            />
            <Label htmlFor="tpsl-enabled" className="text-[11px] text-gray-400 cursor-pointer">
              Take Profit / Stop Loss
            </Label>
          </div>

          {/* TP/SL Inputs - Only show when enabled */}
          {isTpslEnabled && (
            <TakeProfitStopLossInputs
              entryPrice={orderType === "Limit" ? parseFloat(limitOrderPrice) || undefined : markPrice || undefined}
              direction={activeSide === "buy" ? ORDER_DIRECTION.LONG : ORDER_DIRECTION.SHORT}
              leverage={userLeverage}
              takeProfitPrice={takeProfitPrice}
              stopLossPrice={stopLossPrice}
              onTakeProfitPriceChange={setTakeProfitPrice}
              onStopLossPriceChange={setStopLossPrice}
              szDecimals={szDecimals}
              priceLabel="entry"
              positionSize={orderValueInCurrency > 0 ? orderValueInCurrency : undefined}
              thresholdPrice={orderType === "Limit" ? parseFloat(limitOrderPrice) || null : markPrice || null}
              tpslVariant={tpslVariant}
              setTpslVariant={setTpslVariant}
              disabled={isLoadingInitialData || sliderValue === 0}
            />
          )}
      </div>

      <div className="p-2 sm:p-3 border-b border-gray-800/30">
        {!mounted ? (
          <div className="text-center text-[11px] text-gray-500 py-4 bg-gray-900/30 rounded-lg border border-gray-800/20">
            Please connect your wallet to enable trading
          </div>
        ) : !isConnected ? (
          <div className="text-center text-[11px] text-gray-500 py-4 bg-gray-900/30 rounded-lg border border-gray-800/20">
            Please connect your wallet to enable trading
          </div>
        ) 
        // : !isApproved ? (
        //   <Button 
        //     variant="primary" 
        //     size="lg" 
        //     className="w-full"
        //     onClick={() => {
        //       setIsEstablishConnectionDialogOpen(true);
        //     }}
        //   >
        //     Enable Trading
        //   </Button>
        // ) 
        : (
          <Button 
            variant={activeSide === "buy" ? "primary" : "danger"} 
            size="lg" 
            className="w-full"
            isLoading={(isApprovingBuilderFee || isApprovingAgent || isCheckingBuilderFee)}
            isDisabled={
              (isApprovingBuilderFee || isApprovingAgent || isCheckingBuilderFee) || 
              (currency === "USDC" ? orderValue <= 0 : orderValueInCurrency <= 0) ||
              (orderType === "Limit" && !limitOrderPrice) ||
              isSizeExceedsMax
            }
            onClick={async () => {
              if (!isConnected || !address) {
                appToast.error({ message: "Please connect your wallet first" });
                return;
              }
            
              const isApprovedBuilderFee = await checkBuilderFeeStatus({
                userPublicKeyParam: address as `0x${string}`,
              });

              const isApproved = await checkAgentApproval({
                agentPublicKeyParam: agentWallet?.address as `0x${string}`,
                userPublicKeyParam: address as `0x${string}`
              });

              if(!isApproved){
                appToast.error({ message: "Please approve the agent wallet to place order" });
                setIsEstablishConnectionDialogOpen(true);
              }

              if(!isApprovedBuilderFee){
                appToast.error({ message: "Please approve the builder fee to place order" });
                return;
              }
              

              const s = (addDecimals(orderValueInCurrency, szDecimals)).toString();
              
              // For limit orders, use the user-entered price; for market orders, use calculated marketPrice
              const p = orderType === "Limit" 
                ? limitOrderPrice || "" 
                : marketPrice || "";

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

                // Add TP/SL prices if enabled
                if (isTpslEnabled) {
                  if (takeProfitPrice !== undefined) {
                    orderParams.takeProfitPrice = takeProfitPrice;
                  }
                  if (stopLossPrice !== undefined) {
                    orderParams.stopLossPrice = stopLossPrice;
                  }
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
