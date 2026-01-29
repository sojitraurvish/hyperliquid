"use client"

import { formatPrice } from "@nktkas/hyperliquid/utils"
import type { ChangeEvent, RefObject } from "react"
import { useEffect, useRef, useState } from "react"
import type { AnchorField, PnlKind, TpslVariant } from "@/types/tpsl"
import {
  formatNumber,
  parseNumberOrUndefined,
  processUserInput,
  sanitizeDecimalInput,
} from "@/lib/services/tpsl-utils"
import { Input, Label } from "./index"

type PnlInputProps = {
  kind: PnlKind
  tpslVariant: TpslVariant
  setTpslVariant: (value: TpslVariant) => void
  entry: number | undefined
  szDecimals: number
  price: number | undefined
  pnlValue: string
  setPnLValue: (value: string) => void
  anchorRef: RefObject<AnchorField>
  onPriceChange: (value: number | undefined) => void
  error?: boolean
  disabled?: boolean
}

export function PnlInput({
  kind,
  tpslVariant,
  setTpslVariant,
  entry,
  szDecimals,
  price,
  pnlValue,
  setPnLValue,
  anchorRef,
  onPriceChange,
  error,
  disabled,
}: PnlInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [draftPrice, setDraftPrice] = useState(() =>
    price !== undefined ? formatNumber(price, szDecimals) : "",
  )

  useEffect(() => {
    setDraftPrice(price ? formatNumber(price, szDecimals) : "")
  }, [anchorRef, price, szDecimals])

  const handlePriceChange = (e: ChangeEvent<HTMLInputElement>) => {
    anchorRef.current = "price"
    const inputValue = e.target.value
    const cursorPos = e.target.selectionStart ?? 0

    const { display, value, cursorPosition } = processUserInput(
      inputValue,
      cursorPos,
    )
    setDraftPrice(display)

    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(cursorPosition, cursorPosition)
    })

    if (value === "") {
      onPriceChange(undefined)
      return
    }

    let formattedPrice: string
    try {
      formattedPrice = formatPrice(value, szDecimals)
    } catch {
      return
    }

    const priceNum = parseNumberOrUndefined(formattedPrice)
    if (priceNum === undefined || entry === undefined) {
      onPriceChange(undefined)
      return
    }

    onPriceChange(priceNum)
  }

  const handlePnLChange = (pnlStr: string) => {
    anchorRef.current = "pnl"
    const sanitized = sanitizeDecimalInput(pnlStr)
    setPnLValue(sanitized)
  }

  const toggleVariant = () => {
    setTpslVariant(tpslVariant === "percent" ? "dollar" : "percent")
  }

  const label = kind === "takeProfit" ? "TP Price" : "SL Price"
  const pnlLabel = kind === "takeProfit" ? "Gain" : "Loss"

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">{label}</Label>
          <div className="relative">
            <Input
              disabled={disabled}
              type="text"
              inputMode="decimal"
              onChange={handlePriceChange}
              placeholder="0.00"
              ref={inputRef}
              value={draftPrice}
              className={`h-8 sm:h-9 text-right font-mono text-sm pr-8 ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">{pnlLabel}</Label>
          <div className="relative">
            <Input
              disabled={disabled}
              type="text"
              inputMode="decimal"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePnLChange(e.target.value)}
              placeholder="0.00"
              value={pnlValue}
              className={`h-8 sm:h-9 text-right font-mono text-sm pr-8 ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            <button
              type="button"
              onClick={toggleVariant}
              disabled={disabled}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 sm:h-7 px-2 text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {tpslVariant === "percent" ? "%" : "$"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

