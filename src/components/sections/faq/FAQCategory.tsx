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
      {/* Category Title */}
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
        {category.title}
      </h2>

      {/* FAQ Items */}
      <div className="space-y-4">
        {category.items.map((item, index) => {
          const isOpen = openItems.has(index);
          return (
            <div
              key={index}
              className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden"
            >
              {/* Question */}
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between text-left hover:bg-gray-800/50 transition-colors"
              >
                <h3 className="text-base sm:text-lg font-semibold text-white pr-4">
                  {item.question}
                </h3>
                <div className="flex-shrink-0">
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Answer */}
              {isOpen && (
                <div className="px-4 sm:px-6 pb-4 sm:pb-5 border-t border-gray-800">
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



