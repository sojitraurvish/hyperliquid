import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/tailwind/cn";
import React from "react";
import Loader from "../loader"; // Import your existing Loader component
import Portal from "../portal"; // Import the new Portal component

const VARIANTS = {
  [VARIANT_TYPES.NOT_SELECTED]: "",
  [VARIANT_TYPES.PRIMARY]: "bg-primary-foreground/50",
  [VARIANT_TYPES.SECONDARY]: "bg-white/50",
  [VARIANT_TYPES.TERTIARY]: "bg-white/50",
  [VARIANT_TYPES.QUATERNARY]: "bg-purple-600/50",
  [VARIANT_TYPES.QUINARY]: "bg-white/50",
  [VARIANT_TYPES.SENARY]: "bg-purple-600/50",
  [VARIANT_TYPES.OCTONARY]: "bg-white/50",
} as const;

type VariantKeys = keyof typeof VARIANTS;

type FullPageLoaderProps = {
  variant?: VariantKeys;
  className?: string;
  loaderSize?: "sm" | "md" | "lg" | "xl";
  primaryColor?: string;
  withOverlay?: boolean;
  overlayOpacity?: number;
  zIndex?: number;
};

const FullPageLoader: React.FC<FullPageLoaderProps> = ({
  variant = VARIANT_TYPES.PRIMARY,
  className = "",
  loaderSize = "md",
  primaryColor = "white",
  withOverlay = true,
  overlayOpacity = 0.5,
  zIndex = 50,
  ...props
}) => {
  const overlayClass = VARIANTS[variant] || VARIANTS[VARIANT_TYPES.PRIMARY];
  
  return (
    <Portal containerId="page-loader-portal">
      <div
        className={cn(
          "fixed inset-0 flex items-center justify-center",
          withOverlay && overlayClass,
          className
        )}
        style={{
          zIndex: 9999, // Use a very high z-index since we're in a portal
          ...(withOverlay && { backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }),
        }}
        {...props}
      >
        <div className="relative">
          <Loader
            variant={variant}
            size={loaderSize}
            primaryColor={primaryColor}
          />
          <span className="sr-only">Loading page...</span>
        </div>
      </div>
    </Portal>
  );
};

export default FullPageLoader;