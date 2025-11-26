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
