

export const DEFAULT_LANGUAGE = "en";

// lib/constants.ts
export const VARIANT_TYPES = {
    NOT_SELECTED: 'none',
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
    TERTIARY: 'tertiary',
    QUATERNARY: 'quaternary',
    QUINARY: 'quinary',
    SENARY: 'senary',
    OCTONARY: 'octonary',
    NONARY: 'nonary',
    DENARY: 'denary',
  } as const;
  
  export type VariantTypes = typeof VARIANT_TYPES[keyof typeof VARIANT_TYPES];

  export const COOKIE_PREFIX = "Bearer " as const

  
  export const ENVIRONMENT_TYPES = {
    DEVELOPMENT: "development",
    PRODUCTION: "production",
  } as const;
  
  export type EnvironmentTypes = typeof ENVIRONMENT_TYPES[keyof typeof ENVIRONMENT_TYPES];
  
  export const ENVIRONMENT = process.env.NEXT_PUBLIC_NODE_ENV || "development";
  

  export const ORDER_BOOK_TABS = {
    ORDERBOOK: "orderbook",
    TRADES: "trades",
  }

  export type OrderBookTabs = typeof ORDER_BOOK_TABS[keyof typeof ORDER_BOOK_TABS]; 


  export const DATE_TIME_FORMAT = {
    DD_MMM: 'DD MMM',
    HH_mm_ss: 'HH:mm:ss',
    MMMM_D_YYYY: 'MMMM D, YYYY',
    DD_MMM_YYYY: 'DD MMM YYYY',
    DD_MMM_YYYY_HH_MM_A: 'DD MMM YYYY, hh:mm A',
    DD_MM_YYYY: 'DD-MM-YYYY',
    ddd_MM_DD_YYYY: 'ddd, MM/DD/YYYY',
    DD_MM_YYYY_HH_MM_SS: 'DD/MM/YYYY - HH:mm:ss',
  };
  export type DateTimeFormat = typeof DATE_TIME_FORMAT[keyof typeof DATE_TIME_FORMAT];


  export const CURRENCY_NAMES = {
    USDC: "USDC",
    ETH: "ETH",
    SOL: "SOL",
  } as const;
  export type CurrencyNames = typeof CURRENCY_NAMES[keyof typeof CURRENCY_NAMES];
  export const CURRENCY_SYMBOLS = {
    USDC: "$",
    ETH: "ETH",
    SOL: "SOL",
  } as const;
  export type CurrencySymbols = typeof CURRENCY_SYMBOLS[keyof typeof CURRENCY_SYMBOLS];

// Utility function to format numbers with decimal places
export const addDecimals = (value: number | string, decimals: number = 2): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  return num.toFixed(decimals);
}

