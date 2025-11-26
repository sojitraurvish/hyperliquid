

import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/tailwind/cn";
import React, { ReactNode } from "react";


const VARIANTS = {
  [VARIANT_TYPES.NOT_SELECTED]: "",
  [VARIANT_TYPES.PRIMARY]: "px-2 py-2 flex items-center justify-center text-gray-300 hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg cursor-pointer",
  [VARIANT_TYPES.SECONDARY]: "w-full flex items-center gap-4 p-4 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-all duration-200 text-white",
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