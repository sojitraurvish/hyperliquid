"use client"

import React, { useState, useEffect, useMemo } from "react"
import { X } from "lucide-react"
import AppModal from "@/components/ui/modal"
import { Position } from "@/types/bottom-panel"
import { TakeProfitStopLossInputs } from "@/components/sections/trading-panel/TakeProfitStopLossInputs"
import { ORDER_DIRECTION, type OrderDirection } from "@/types/tpsl"
import { formatPrice } from "@nktkas/hyperliquid/utils"
import { addDecimals } from "@/lib/constants"
import { useTradesStore } from "@/store/trades"
import { Input, Label } from "@/components/sections/trading-panel"

// Checkbox Component (copied from trading panel)
interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  id: string
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
  )
}

// Slider Component (copied from trading panel)
interface SliderProps {
  defaultValue?: number[]
  min?: number
  max?: number
  step?: number
  value?: number[]
  onChange?: (value: number[]) => void
  className?: string
  disabled?: boolean
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
  const [internalValue, setInternalValue] = useState(defaultValue[0] || min)
  const currentValue = value ? value[0] : internalValue

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    const newValue = Number(e.target.value)
    if (value === undefined) {
      setInternalValue(newValue)
    }
    onChange?.([newValue])
  }

  return (
    <div className={`relative flex items-center ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div className="relative w-full h-2 flex items-center bg-gray-800 rounded-lg" style={{
        background: `linear-gradient(to right, var(--color-green-500, #10b981) 0%, var(--color-green-500, #10b981) ${((currentValue - min) / (max - min)) * 100}%, #1f2937 ${((currentValue - min) / (max - min)) * 100}%, #1f2937 100%)`,
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
  )
}

interface PositionTpslModalProps {
  isOpen: boolean
  onClose: () => void
  position: Position | null
  onConfirm: (params: {
    takeProfitPrice?: number
    stopLossPrice?: number
    takeProfitLimitPrice?: number
    stopLossLimitPrice?: number
    orderSize?: number
  }) => Promise<void>
  existingTpsl?: {
    takeProfit?: { triggerPx: string; limitPx?: string; orderId?: string }
    stopLoss?: { triggerPx: string; limitPx?: string; orderId?: string }
  }
  onCancelTpsl?: (type: "tp" | "sl") => Promise<void>
}

export function PositionTpslModal({
  isOpen,
  onClose,
  position,
  onConfirm,
  existingTpsl,
  onCancelTpsl,
}: PositionTpslModalProps) {
  const { tpslVariant, setTpslVariant } = useTradesStore()
  const [takeProfitPrice, setTakeProfitPrice] = useState<number | undefined>(undefined)
  const [stopLossPrice, setStopLossPrice] = useState<number | undefined>(undefined)
  const [takeProfitLimitPrice, setTakeProfitLimitPrice] = useState<string>("")
  const [stopLossLimitPrice, setStopLossLimitPrice] = useState<string>("")
  const [isLimitPriceEnabled, setIsLimitPriceEnabled] = useState(false)
  const [isConfigureAmountEnabled, setIsConfigureAmountEnabled] = useState(false)
  const [orderSizePercent, setOrderSizePercent] = useState(100)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const pos = position?.position
  const entryPrice = pos ? parseFloat(pos.entryPx) : undefined
  const markPrice = pos ? parseFloat(pos.positionValue) / Math.abs(parseFloat(pos.szi)) : undefined
  const positionSize = pos ? Math.abs(parseFloat(pos.szi)) : 0
  const direction: OrderDirection = pos && parseFloat(pos.szi) > 0 ? ORDER_DIRECTION.LONG : ORDER_DIRECTION.SHORT
  const leverage = pos?.leverage?.value || 1
  const coin = pos?.coin || ""

  // Get szDecimals from position or default to 4
  const szDecimals = 4 // You may want to fetch this from symbol converter

  // Initialize with existing TP/SL if available
  useEffect(() => {
    if (existingTpsl) {
      if (existingTpsl.takeProfit) {
        setTakeProfitPrice(parseFloat(existingTpsl.takeProfit.triggerPx))
        if (existingTpsl.takeProfit.limitPx) {
          setTakeProfitLimitPrice(existingTpsl.takeProfit.limitPx)
          setIsLimitPriceEnabled(true)
        }
      }
      if (existingTpsl.stopLoss) {
        setStopLossPrice(parseFloat(existingTpsl.stopLoss.triggerPx))
        if (existingTpsl.stopLoss.limitPx) {
          setStopLossLimitPrice(existingTpsl.stopLoss.limitPx)
          setIsLimitPriceEnabled(true)
        }
      }
    } else {
      // Reset when no existing TP/SL
      setTakeProfitPrice(undefined)
      setStopLossPrice(undefined)
      setTakeProfitLimitPrice("")
      setStopLossLimitPrice("")
      setIsLimitPriceEnabled(false)
      setIsConfigureAmountEnabled(false)
      setOrderSizePercent(100)
    }
  }, [existingTpsl, isOpen])

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTakeProfitPrice(undefined)
      setStopLossPrice(undefined)
      setTakeProfitLimitPrice("")
      setStopLossLimitPrice("")
      setIsLimitPriceEnabled(false)
      setIsConfigureAmountEnabled(false)
      setOrderSizePercent(100)
      setIsSubmitting(false)
    }
  }, [isOpen])

  const handleConfirm = async () => {
    if (!position) return

    setIsSubmitting(true)
    try {
      // If Configure Amount is not enabled, send 0 for size (full position)
      // If enabled, calculate the configured size
      const orderSize = isConfigureAmountEnabled
        ? (positionSize * orderSizePercent) / 100
        : 0

      await onConfirm({
        takeProfitPrice,
        stopLossPrice,
        takeProfitLimitPrice: isLimitPriceEnabled && takeProfitLimitPrice ? parseFloat(takeProfitLimitPrice) : undefined,
        stopLossLimitPrice: isLimitPriceEnabled && stopLossLimitPrice ? parseFloat(stopLossLimitPrice) : undefined,
        orderSize,
      })
      onClose()
    } catch (error) {
      console.error("Error setting TP/SL:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelTp = async () => {
    if (onCancelTpsl) {
      setIsSubmitting(true)
      try {
        await onCancelTpsl("tp")
        setTakeProfitPrice(undefined)
        setTakeProfitLimitPrice("")
      } catch (error) {
        console.error("Error canceling TP:", error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleCancelSl = async () => {
    if (onCancelTpsl) {
      setIsSubmitting(true)
      try {
        await onCancelTpsl("sl")
        setStopLossPrice(undefined)
        setStopLossLimitPrice("")
      } catch (error) {
        console.error("Error canceling SL:", error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const calculatedOrderSize = isConfigureAmountEnabled
    ? (positionSize * orderSizePercent) / 100
    : positionSize

  if (!position || !pos) return null

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="TP/SL for Position"
      className="w-full max-w-2xl"
      contentClassName="space-y-6"
    >
      {/* Position Details */}
      <div className="grid grid-cols-2 gap-2.5 p-3.5 bg-gray-800/30 rounded-xl border border-gray-800/50">
        <div className="space-y-0.5">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Coin</span>
          <div className="text-sm text-white font-semibold">{coin}</div>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Position</span>
          <div className={`text-sm font-semibold ${parseFloat(pos.szi) < 0 ? "text-red-400" : "text-green-400"}`}>
            {addDecimals(Math.abs(parseFloat(pos.szi)), szDecimals)} {coin}
          </div>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Entry Price</span>
          <div className="text-sm text-white font-mono">${addDecimals(entryPrice || 0, 2)}</div>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Mark Price</span>
          <div className="text-sm text-white font-mono">${addDecimals(markPrice || 0, 2)}</div>
        </div>
      </div>

      {/* Existing TP/SL Display */}
      {existingTpsl && (
        <div className="space-y-2.5">
          {existingTpsl.takeProfit && (
            <div className="flex items-center justify-between p-3 bg-green-500/5 border border-green-500/15 rounded-xl">
              <div>
                <div className="text-sm text-white font-medium">
                  Take Profit: {existingTpsl.takeProfit.triggerPx}
                </div>
                <div className="text-xs text-green-400/70 mt-0.5">
                  {calculateExpectedProfitLoss(
                    existingTpsl.takeProfit.triggerPx,
                    entryPrice || 0,
                    direction,
                    positionSize,
                    "tp"
                  )}
                </div>
              </div>
              <button
                onClick={handleCancelTp}
                disabled={isSubmitting}
                className="text-xs text-red-400 hover:text-red-300 font-medium cursor-pointer disabled:opacity-50 px-2.5 py-1 rounded-lg hover:bg-red-500/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
          {existingTpsl.stopLoss && (
            <div className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/15 rounded-xl">
              <div>
                <div className="text-sm text-white font-medium">
                  Stop Loss: {existingTpsl.stopLoss.triggerPx}
                </div>
                <div className="text-xs text-red-400/70 mt-0.5">
                  {calculateExpectedProfitLoss(
                    existingTpsl.stopLoss.triggerPx,
                    entryPrice || 0,
                    direction,
                    positionSize,
                    "sl"
                  )}
                </div>
              </div>
              <button
                onClick={handleCancelSl}
                disabled={isSubmitting}
                className="text-xs text-red-400 hover:text-red-300 font-medium cursor-pointer disabled:opacity-50 px-2.5 py-1 rounded-lg hover:bg-red-500/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* TP/SL Inputs - Only show inputs for orders that don't exist */}
      {(!existingTpsl?.takeProfit || !existingTpsl?.stopLoss) && (
        <TakeProfitStopLossInputs
          entryPrice={entryPrice}
          direction={direction}
          leverage={leverage}
          takeProfitPrice={takeProfitPrice}
          stopLossPrice={stopLossPrice}
          onTakeProfitPriceChange={setTakeProfitPrice}
          onStopLossPriceChange={setStopLossPrice}
          szDecimals={szDecimals}
          priceLabel="entry"
          positionSize={calculatedOrderSize}
          thresholdPrice={markPrice || null}
          tpslVariant={tpslVariant}
          setTpslVariant={setTpslVariant}
          disabled={false}
          hideTakeProfit={!!existingTpsl?.takeProfit}
          hideStopLoss={!!existingTpsl?.stopLoss}
        />
      )}

      {/* Configure Amount */}
      <div className="space-y-3">
        <button
          onClick={() => setIsConfigureAmountEnabled(!isConfigureAmountEnabled)}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
            isConfigureAmountEnabled ? "border-green-400 bg-green-400" : "border-gray-600"
          }`}>
            {isConfigureAmountEnabled && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-sm text-gray-400">Configure Amount</span>
        </button>
        {isConfigureAmountEnabled && (
          <div className="space-y-2 pl-7.5">
            <div className="flex items-center gap-2">
              <Slider
                value={[orderSizePercent]}
                onChange={(vals) => setOrderSizePercent(vals[0])}
                max={100}
                step={1}
                className="flex-1 py-1"
              />
              <div className="text-xs text-white font-mono min-w-14 text-right font-medium">
                {orderSizePercent}%
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {addDecimals(calculatedOrderSize, szDecimals)} {coin}
            </div>
          </div>
        )}
      </div>

      {/* Limit Price */}
      <div className="space-y-3">
        <button
          onClick={() => setIsLimitPriceEnabled(!isLimitPriceEnabled)}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
            isLimitPriceEnabled ? "border-green-400 bg-green-400" : "border-gray-600"
          }`}>
            {isLimitPriceEnabled && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-sm text-gray-400">Limit Price</span>
        </button>
        {isLimitPriceEnabled && (
          <div className="grid grid-cols-2 gap-3 pl-7.5">
            <div className="space-y-1.5">
              <span className="text-xs text-gray-500 font-medium">TP Limit Price</span>
              <Input
                type="text"
                value={takeProfitLimitPrice}
                onChange={(e) => setTakeProfitLimitPrice(e.target.value)}
                placeholder="0.00"
                className="h-9 text-right font-mono text-sm bg-gray-800/40 border-gray-700/50 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-gray-500 font-medium">SL Limit Price</span>
              <Input
                type="text"
                value={stopLossLimitPrice}
                onChange={(e) => setStopLossLimitPrice(e.target.value)}
                placeholder="0.00"
                className="h-9 text-right font-mono text-sm bg-gray-800/40 border-gray-700/50 rounded-xl"
              />
            </div>
          </div>
        )}
      </div>

      {/* Confirm Button */}
      {(!existingTpsl?.takeProfit || !existingTpsl?.stopLoss) && (
        <button
          onClick={handleConfirm}
          disabled={isSubmitting || (!takeProfitPrice && !stopLossPrice)}
          className={`w-full h-11 rounded-xl font-semibold text-sm transition-colors cursor-pointer ${
            isSubmitting || (!takeProfitPrice && !stopLossPrice)
              ? "bg-gray-800 text-gray-500 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-400 text-white"
          }`}
        >
          {isSubmitting ? "Processing..." : "Confirm"}
        </button>
      )}

      {/* Info Text */}
      <div className="text-[11px] text-gray-500 leading-relaxed p-3 bg-gray-800/20 rounded-xl">
        TP/SL orders apply to the entire position by default and auto-cancel after closing. A market order triggers at the set price. Configured sizes apply regardless of future position changes.
      </div>
    </AppModal>
  )
}

function calculateExpectedProfitLoss(
  triggerPrice: string,
  entryPrice: number,
  direction: OrderDirection,
  positionSize: number,
  kind: "tp" | "sl"
): string {
  const trigger = parseFloat(triggerPrice)
  const priceDiff = direction === ORDER_DIRECTION.LONG
    ? (kind === "tp" ? trigger - entryPrice : entryPrice - trigger)
    : (kind === "tp" ? entryPrice - trigger : trigger - entryPrice)
  
  const pnl = priceDiff * positionSize
  const sign = pnl >= 0 ? "+" : "-"
  return `${sign}$${Math.abs(pnl).toFixed(2)}`
}

