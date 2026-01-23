"use client";

import { BlogCategory } from "./index";

interface BlogCategoryFilterProps {
  selectedCategory: BlogCategory;
  onCategoryChange: (category: BlogCategory) => void;
}

const categories: { label: string; value: BlogCategory }[] = [
  { label: "All Posts", value: "all" },
  { label: "Market Analysis", value: "market-analysis" },
  { label: "Education", value: "education" },
  { label: "Product", value: "product" },
];

export const BlogCategoryFilter = ({
  selectedCategory,
  onCategoryChange,
}: BlogCategoryFilterProps) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8">
      {categories.map((category) => {
        const isActive = selectedCategory === category.value;
        return (
          <button
            key={category.value}
            onClick={() => onCategoryChange(category.value)}
            className={`
              px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-all duration-200
              ${
                isActive
                  ? "bg-gray-800 text-white"
                  : "bg-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-900/50"
              }
            `}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
};



