import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/tailwind/cn";
import React, { ReactNode, useEffect } from "react";
import Portal from "@/components/ui/portal/index";
import { X } from "lucide-react";

const MODAL_VARIANTS = {
  [VARIANT_TYPES.NOT_SELECTED]: "",
  [VARIANT_TYPES.PRIMARY]: "bg-gray-900 border border-gray-800 shadow-2xl max-w-md",
  [VARIANT_TYPES.SECONDARY]: "bg-white shadow-2xl max-w-md",
  [VARIANT_TYPES.TERTIARY]: "bg-gradient-to-br from-purple-900 to-gray-900 border border-purple-700 shadow-2xl max-w-md",
} as const;

type VariantKeys = keyof typeof MODAL_VARIANTS;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
  title?: string;
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

  // Handle escape key press
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

  // Prevent body scroll when modal is open
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
        className="fixed inset-0 flex items-center justify-center p-4 transition-all duration-300 bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <div
          className={cn(
            "relative w-full rounded-2xl transform transition-all duration-300 ease-out",
            "animate-in fade-in zoom-in-95",
            modalClassName,
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div
              className={cn(
                "flex items-center justify-between p-6 border-b border-gray-800",
                headerClassName
              )}
            >
              {title && (
                <h2 className="text-xl font-semibold text-white">
                  {title}
                </h2>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="ml-auto p-2 rounded-lg hover:bg-gray-800 transition-colors duration-200 text-gray-400 hover:text-white"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className={cn("p-6", contentClassName)}>
            {children}
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default AppModal;

