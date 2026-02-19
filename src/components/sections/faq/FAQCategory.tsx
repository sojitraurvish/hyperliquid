"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { FAQCategoryData } from "./index";

interface FAQCategoryProps {
  category: FAQCategoryData;
}

export const FAQCategory = ({ category }: FAQCategoryProps) => {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 tracking-tight">
        {category.title}
      </h2>

      <div className="space-y-3">
        {category.items.map((item, index) => {
          const isOpen = openItems.has(index);
          return (
            <div
              key={index}
              className={`bg-gray-900/40 backdrop-blur-sm rounded-2xl border transition-all duration-300 overflow-hidden ${
                isOpen ? 'border-green-500/25 bg-gray-900/60' : 'border-gray-800/50 hover:border-gray-700/50'
              }`}
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between text-left transition-colors"
              >
                <h3 className="text-base sm:text-lg font-semibold text-white pr-4">
                  {item.question}
                </h3>
                <div className={`shrink-0 p-1.5 rounded-lg transition-colors ${isOpen ? 'bg-green-500/15 text-green-400' : 'text-gray-500'}`}>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 border-t border-gray-800/30">
                  <p className="text-gray-400 text-sm sm:text-base leading-relaxed pt-4">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
