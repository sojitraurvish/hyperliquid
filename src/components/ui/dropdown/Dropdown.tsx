import React, { useState, useCallback } from "react";
import { ChevronDown } from "lucide-react";

interface DropdownProps {
  value: string;
  options: string[];
  onChange?: (value: string) => void;
  className?: string;
}

export const Dropdown = ({ value, options, onChange, className = "" }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = useCallback((option: string) => {
    onChange?.(option);
    setIsOpen(false);
  }, [onChange]);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 text-xs sm:text-sm text-gray-400 hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 focus:ring-green-400 rounded px-1 py-0.5"
      >
        {value}
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 bg-gray-900 border border-gray-800 rounded shadow-lg z-20 min-w-[100px]">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                className={`
                  w-full text-left px-3 py-1.5 text-xs sm:text-sm transition-colors
                  ${value === option 
                    ? "bg-gray-800 text-white" 
                    : "text-gray-300 hover:bg-gray-800/50"
                  }
                `}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

