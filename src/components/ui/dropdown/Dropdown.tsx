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
        className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-400 hover:text-gray-300 transition-all focus:outline-none rounded-lg px-2 py-1 hover:bg-gray-800/30 border border-gray-800/15 hover:border-gray-700/30"
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
          <div className="absolute top-full left-0 mt-1.5 bg-gray-900/95 backdrop-blur-xl border border-gray-700/30 rounded-xl shadow-2xl shadow-black/40 z-20 min-w-[100px] overflow-hidden">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                className={`
                  w-full text-left px-3 py-1.5 text-[10px] font-medium transition-all
                  ${value === option 
                    ? "bg-green-500/10 text-green-400" 
                    : "text-gray-400 hover:bg-gray-800/30 hover:text-gray-200"
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

