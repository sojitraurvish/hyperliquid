

import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/tailwind/cn";
import React, { ReactNode, useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import AppButton from "../button";

const VARIANTS = {
  [VARIANT_TYPES.NOT_SELECTED]: "",
  [VARIANT_TYPES.PRIMARY]: "px-2 py-2 flex items-center justify-center text-gray-300 hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg cursor-pointer",
} as const;

type VariantKeys = keyof typeof VARIANTS;

export type DropdownOption<T = string> = {
  label: string;
  value: T;
  disabled?: boolean;
  icon?: ReactNode;
  link?: string;
  linkTarget?: '_blank' | '_self' | '_parent' | '_top';
  onClick?: () => void;
};

type Props<T = string> = {
  variant?: VariantKeys;
  options: DropdownOption<T>[];
  value?: T;
  placeholder?: string;
  onChange?: (value: T) => void;
  isLoading?: boolean;
  isDisabled?: boolean;
  className?: string;
  dropdownClassName?: string;
  optionClassName?: string;
  label?: string;
  error?: string;
  showRightIcon?: boolean;
  rightIcon?: ReactNode;
};

export const AppDropdown = <T extends string | number>({
  variant = VARIANT_TYPES.PRIMARY,
  options = [],
  value,
  placeholder = "Select an option...",
  onChange,
  isLoading = false,
  isDisabled = false,
  className = "",
  dropdownClassName = "",
  optionClassName = "",
  label,
  error,
  showRightIcon = false,
  rightIcon,
}: Props<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const baseClassName = VARIANTS[variant] || VARIANT_TYPES.NOT_SELECTED;

  const selectedOption = options.find((option) => option.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isDisabled && !isLoading) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (option: DropdownOption<T>) => {
    if (!isDisabled && !isLoading) {
      // If option has a link, navigate to it
      if (option.link) {
        const target = option.linkTarget || '_self';
        if (target === '_blank') {
          // Open in new tab
          window.open(option.link, target);
        } else {
          // Use Next.js router for internal navigation
          router.push(option.link);
        }
      }
      option.onClick?.();
      // Call onChange callback
      onChange?.(option.value);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleToggle();
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      {label && (
        <label className="block text-sm font-semibold mb-2 text-gray-700 ">
          {label}
        </label>
      )}

      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          disabled={isDisabled || isLoading}
          className={cn(
            " w-full px-4 py-3 font-semibold flex items-center justify-between cursor-pointer transition-all duration-200",
            baseClassName,
            (isDisabled || isLoading) && "opacity-50 cursor-not-allowed",
            error && "border-red-500",
            dropdownClassName
          )}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="flex items-center gap-2 truncate ">
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current  border-t-transparent rounded-full animate-spin" />
                <span>Loading...</span>
              </>
            ) : selectedOption ? (
              <div className="text-ellipsis overflow-hidden">
                {selectedOption.icon && selectedOption.icon}
                {selectedOption.label}
              </div>
            ) : (
              <span className="opacity-60 text-ellipsis overflow-hidden">{placeholder}</span>
            )}
          </span>

          <svg
            className={cn(
              "w-3.5 h-3.5 opacity-50 transition-transform duration-200",
              isOpen && "transform rotate-180"
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && !isLoading && (
          <div
            className={cn(
              "absolute z-50 mt-1.5 rounded-xl shadow-2xl shadow-black/40 max-h-60 overflow-y-auto overflow-x-hidden",
              "bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 min-w-40",
              optionClassName
            )}
            role="listbox"
          >
            {options.length === 0 ? (
              <div className="px-4 py-3 text-gray-500 text-center text-sm">
                No options available
              </div>
            ) : (
              <div className="p-1">
                {options.map((option, index) => (
                  <AppButton
                    variant={VARIANT_TYPES.NOT_SELECTED}
                    key={index}
                    type="button"
                    onClick={() => !option.disabled && handleSelect(option)}
                    disabled={option.disabled}
                    className={cn(
                      "w-full px-3 py-2 text-left flex items-center gap-2 transition-all duration-150 cursor-pointer rounded-lg text-sm",
                      option.value === value
                        ? "bg-gray-800 text-white font-medium"
                        : "text-gray-300 hover:bg-gray-800/70 hover:text-white",
                      option.disabled && "opacity-50 cursor-not-allowed",
                    )}
                    role="option"
                    aria-selected={option.value === value}
                  >
                    {option.icon && <span className="shrink-0">{option.icon}</span>}
                    <span className="truncate flex-1 min-w-0">{option.label}</span>
                    {(option.value === value && showRightIcon) && (
                      rightIcon ? rightIcon : <svg
                        className="w-4 h-4 ml-auto text-green-400 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </AppButton>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default AppDropdown;

