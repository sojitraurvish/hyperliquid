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
  

  // Utility function to fix floating point precision issues
export const fixDecimals = (number: number, decimals: number = 8): number => {
  return Number(number.toFixed(decimals));
}

// Utility function to format numbers with decimal places
export const addDecimal = (value: number | string, decimals: number = 2): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  return num.toFixed(decimals);
}
