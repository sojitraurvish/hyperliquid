

import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/tailwind/cn";
import React, { ReactNode } from "react";


const VARIANTS = {
  [VARIANT_TYPES.NOT_SELECTED]: "cursor-pointer",
  [VARIANT_TYPES.PRIMARY]: "px-2 py-2 flex items-center justify-center text-gray-300 hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg cursor-pointer",
  [VARIANT_TYPES.SECONDARY]: "w-full flex items-center gap-3.5 px-4 py-3.5 bg-gray-800/30 hover:bg-gray-800/60 border border-gray-700/30 hover:border-gray-600/40 rounded-xl transition-all duration-200 text-white cursor-pointer",
  [VARIANT_TYPES.TERTIARY]: "text-xs h-6 sm:h-7 px-1.5 sm:px-2 text-gray-400 hover:text-white hover:bg-gray-900/50 rounded transition-colors whitespace-nowrap cursor-pointer",
  [VARIANT_TYPES.QUATERNARY]: "text-xs h-5 sm:h-6 px-1.5 sm:px-2 text-gray-400 hover:text-white hover:bg-gray-900/50 rounded transition-colors whitespace-nowrap cursor-pointer",
} as const;

type VariantKeys = keyof typeof VARIANTS;

type Props = {
  variant?: VariantKeys;
  children?: ReactNode;
  isLoading?: boolean;
  isDisabled?: boolean;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const AppButton: React.FC<Props> = ({
  children,
  isLoading = false,
  variant = VARIANT_TYPES.PRIMARY,
  isDisabled = false,
  className = "",
  ...props
}) => {
  const baseClassName = VARIANTS[variant] || VARIANT_TYPES.NOT_SELECTED;
  
  return (
    <button
      disabled={isDisabled || isLoading}
      className={cn(
"",
        baseClassName,
        className
      )}
      {...props}
    >
      {isLoading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
};

export default AppButton;