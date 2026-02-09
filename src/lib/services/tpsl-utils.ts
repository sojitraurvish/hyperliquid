import { formatPrice } from "@nktkas/hyperliquid/utils"
import type { OrderDirection, PnlKind } from "@/types/tpsl"
import { ORDER_DIRECTION } from "@/types/tpsl"

export const isPositiveFiniteNumber = (value: number): boolean =>
  Number.isFinite(value) && value > 0

const LEADING_ZEROS_REGEX = /^0+/
const TRAILING_DECIMAL_ZEROS_REGEX = /(\.\d*?)0+$/
const TRAILING_DOT_REGEX = /\.$/
const THOUSAND_SEPARATOR_REGEX = /\B(?=(\d{3})+(?!\d))/g
const NON_NUMERIC_REGEX = /[^0-9.]/g

const trimTrailingZeros = (value: string): string =>
  value
    .replace(TRAILING_DECIMAL_ZEROS_REGEX, "$1")
    .replace(TRAILING_DOT_REGEX, "")

/**
 * @internal - Exported for testing, use processUserInput or formatNumber instead
 */
export const addThousandSeparators = (numStr: string): string => {
  const [intPart, decPart] = numStr.split(".")
  const formattedInt = intPart.replace(THOUSAND_SEPARATOR_REGEX, ",")
  return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt
}

/**
 * @internal - Exported for testing, use processUserInput instead
 */
export const calculateCursorPosition = (
  formattedValue: string,
  sanitizedPrefix: string,
): number => {
  const rawCursor = sanitizedPrefix.length
  let newCursor = 0
  let digitCount = 0
  for (let i = 0; i < formattedValue.length && digitCount < rawCursor; i += 1) {
    newCursor = i + 1
    if (formattedValue[i] !== ",") {
      digitCount += 1
    }
  }
  return newCursor
}

type ProcessInputResult = {
  display: string
  value: string
  cursorPosition: number
}

/**
 * Processes raw user input: sanitizes, formats with thousand separators, and calculates cursor position.
 * This is the main function for handling onChange events in price/percent inputs.
 *
 * @returns {ProcessInputResult}
 *   - display: Formatted string with thousand separators for the input field
 *   - value: Clean numeric string for parsing/calculations
 *   - cursorPosition: Position for cursor tracking
 */
export const processUserInput = (
  rawValue: string,
  cursorPosition: number,
  options: {
    addSeparators: boolean
    allowNegative: boolean
  } = { addSeparators: true, allowNegative: false },
): ProcessInputResult => {
  const { addSeparators, allowNegative } = options

  const sanitized = sanitizeDecimalInput(rawValue, { allowNegative })
  const display = addSeparators ? addThousandSeparators(sanitized) : sanitized

  const inputPrefix = rawValue.slice(0, cursorPosition)
  const sanitizedPrefix = sanitizeDecimalInput(inputPrefix, { allowNegative })
  const newCursor = addSeparators
    ? calculateCursorPosition(display, sanitizedPrefix)
    : sanitizedPrefix.length

  return {
    display,
    value: sanitized,
    cursorPosition: newCursor,
  }
}

/**
 * Formats a number for display with proper decimals and optional thousand separators.
 * Uses formatPrice from hyperliquid utils when possible, falls back to simple formatting.
 */
export const formatNumber = (
  value: number,
  szDecimals: number,
  options: {
    addSeparators?: boolean
  } = {},
): string => {
  const { addSeparators = true } = options

  if (!Number.isFinite(value)) {
    return ""
  }

  const decimals = Math.min(Math.max(0, szDecimals + 5), 100)
  let formatted: string

  try {
    const priceStr = value.toFixed(decimals)
    formatted = formatPrice(priceStr, szDecimals)
  } catch {
    formatted = trimTrailingZeros(value.toFixed(decimals))
  }

  return addSeparators ? addThousandSeparators(formatted) : formatted
}

export const stripLeadingZeros = (value: string): string => {
  if (value === "" || value === "0" || value === "-0") {
    return value
  }
  if (value.startsWith("-")) {
    const rest = value.slice(1)
    if (rest.startsWith("0.") || rest.startsWith(".")) {
      return value
    }
    const stripped = rest.replace(LEADING_ZEROS_REGEX, "") || "0"
    return `-${stripped}`
  }
  if (value.startsWith("0.") || value.startsWith(".")) {
    return value
  }
  return value.replace(LEADING_ZEROS_REGEX, "") || "0"
}

export const sanitizeDecimalInput = (
  value: string,
  { allowNegative = false }: { allowNegative?: boolean } = {},
): string => {
  if (value === "") {
    return ""
  }
  const isNegative = allowNegative && value.startsWith("-")
  const withoutSign = isNegative ? value.slice(1) : value
  const cleaned = withoutSign.replace(NON_NUMERIC_REGEX, "")
  const parts = cleaned.split(".")
  let result: string
  if (parts.length <= 2) {
    result = cleaned
  } else {
    result = `${parts[0]}.${parts.slice(1).join("")}`
  }
  const [intPart, decPart] = result.split(".")
  const strippedInt = stripLeadingZeros(intPart)
  if (decPart !== undefined) {
    const normalized = `${strippedInt || "0"}.${decPart}`
    return isNegative ? `-${normalized}` : normalized
  }
  return isNegative ? `-${strippedInt}` : strippedInt
}

export const parseNumberOrUndefined = (value: string): number | undefined => {
  if (value === "") {
    return
  }

  const num = Number.parseFloat(value)
  return Number.isNaN(num) ? undefined : num
}

const getPercentMultiplier = (
  direction: OrderDirection,
  kind: PnlKind,
): number => {
  const isLong = direction === ORDER_DIRECTION.LONG
  if (isLong) {
    return kind === "takeProfit" ? 1 : -1
  }

  return kind === "takeProfit" ? -1 : 1
}

export const calculatePriceFromPercent = ({
  percent,
  entry,
  leverage,
  direction,
  kind,
  szDecimals,
}: {
  percent: number
  entry: number
  leverage: number
  direction: OrderDirection
  kind: PnlKind
  szDecimals: number
}): number | undefined => {
  const hasValidInputs =
    isPositiveFiniteNumber(entry) &&
    isPositiveFiniteNumber(leverage) &&
    Number.isFinite(percent)
  if (!hasValidInputs) {
    return
  }

  const multiplier = getPercentMultiplier(direction, kind)
  const price = entry * (1 + (multiplier * percent) / 100 / leverage)
  try {
    const formatted = formatPrice(price, szDecimals)
    const formattedNum = Number.parseFloat(formatted)
    return Number.isNaN(formattedNum) ? undefined : formattedNum
  } catch {
    return
  }
}

export const calculatePercentFromPrice = ({
  targetPrice,
  entry,
  leverage,
  direction,
  kind,
}: {
  targetPrice: number
  entry: number
  leverage: number
  direction: OrderDirection
  kind: PnlKind
}): number | undefined => {
  const hasValidInputs =
    isPositiveFiniteNumber(targetPrice) && isPositiveFiniteNumber(entry)
  if (!hasValidInputs) {
    return
  }

  const multiplier = getPercentMultiplier(direction, kind)
  const raw = leverage * (targetPrice / entry - 1) * 100
  const percent = multiplier * raw
  return Number.isFinite(percent) ? percent : undefined
}

export const calculateProfitLossFromPrice = ({
  targetPrice,
  entry,
  direction,
  kind,
  positionSize,
}: {
  targetPrice: number
  entry: number
  direction: OrderDirection
  kind: PnlKind
  positionSize: number
}): number | undefined => {
  const hasValidInputs =
    isPositiveFiniteNumber(targetPrice) &&
    isPositiveFiniteNumber(entry) &&
    isPositiveFiniteNumber(positionSize)
  if (!hasValidInputs) {
    return
  }
  const multiplier = getPercentMultiplier(direction, kind)
  const positionSizeInUsd = positionSize * entry
  const profitLoss =
    ((positionSizeInUsd * (targetPrice - entry)) / entry) * multiplier
  return Number.isFinite(profitLoss) ? profitLoss : undefined
}

export const calculatePriceFromProfitLoss = ({
  profitLoss,
  entry,
  direction,
  kind,
  positionSize,
  szDecimals,
}: {
  profitLoss: number
  entry: number
  direction: OrderDirection
  kind: PnlKind
  positionSize: number
  szDecimals: number
}): number | undefined => {
  const hasValidInputs =
    isPositiveFiniteNumber(entry) &&
    isPositiveFiniteNumber(profitLoss) &&
    isPositiveFiniteNumber(positionSize)
  if (!hasValidInputs) {
    return
  }
  const multiplier = getPercentMultiplier(direction, kind)
  const price = entry + (profitLoss / positionSize) * multiplier
  try {
    const formatted = formatPrice(price, szDecimals)
    const formattedNum = Number.parseFloat(formatted)
    return Number.isNaN(formattedNum) ? undefined : formattedNum
  } catch {
    return
  }
}




