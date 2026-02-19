import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/tailwind/cn";
import React, { ReactNode, useEffect } from "react";
import Portal from "@/components/ui/portal/index";
import { X } from "lucide-react";

const MODAL_VARIANTS = {
  [VARIANT_TYPES.NOT_SELECTED]: "",
  [VARIANT_TYPES.PRIMARY]: "bg-gray-900 border border-gray-800/60 shadow-2xl shadow-black/60 w-full max-w-md",
  [VARIANT_TYPES.SECONDARY]: "bg-gray-900 border border-gray-800/60 shadow-2xl shadow-black/60 w-full max-w-md",
  [VARIANT_TYPES.TERTIARY]: "bg-gray-900 border border-gray-800/60 shadow-2xl shadow-black/60 w-full max-w-md",
} as const;

type VariantKeys = keyof typeof MODAL_VARIANTS;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
  title?: ReactNode;
  showCloseButton?: boolean;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  variant?: VariantKeys;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
};

export const AppModal: React.FC<Props> = ({
  isOpen,
  onClose,
  children,
  title,
  showCloseButton = true,
  closeOnOutsideClick = true,
  closeOnEscape = true,
  variant = VARIANT_TYPES.PRIMARY,
  className = "",
  headerClassName = "",
  contentClassName = "",
}) => {
  const modalClassName = MODAL_VARIANTS[variant] || MODAL_VARIANTS[VARIANT_TYPES.PRIMARY];

  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnOutsideClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <Portal overlay={false} zIndex={9999}>
      <div
        className="fixed inset-0 overflow-y-auto transition-all duration-300 bg-black/70 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <div className="min-h-full flex items-center justify-center p-4">
          <div
            className={cn(
              "relative w-full rounded-2xl transform transition-all duration-300 ease-out my-auto overflow-hidden",
              "animate-in fade-in zoom-in-95",
              modalClassName,
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Green accent line at top */}
            <div className="h-[2px] w-full bg-linear-to-r from-transparent via-green-500/60 to-transparent" />

            {/* Header */}
            {(title || showCloseButton) && (
              <div
                className={cn(
                  "flex items-center justify-between px-6 py-5 sticky top-0 z-10 bg-gray-900 rounded-t-2xl",
                  headerClassName
                )}
              >
                {title && (
                <div className="text-lg font-bold text-white tracking-tight">
                  {title}
                </div>
                )}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="ml-auto w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 transition-colors duration-200 text-gray-400 hover:text-white cursor-pointer"
                    aria-label="Close modal"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            {/* Separator */}
            {(title || showCloseButton) && (
              <div className="mx-6 h-px bg-gray-800/80" />
            )}

            {/* Content */}
            <div className={cn("px-6 py-5", contentClassName)}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default AppModal;
