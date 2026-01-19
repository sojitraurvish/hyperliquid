import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Star } from "lucide-react";

export interface IntervalItem {
  title: string;
  value: string;
  isSelected: boolean;
  isFavorite: boolean;
}

export interface IntervalSection {
  title: string;
  value: IntervalItem[];
}

interface IntervalDropdownProps {
  sections: IntervalSection[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  onToggleFavorite?: (sectionIndex: number, itemIndex: number) => void;
  buttonText?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  maxHeight?: string;
  showFavorites?: boolean;
}

export const IntervalDropdown = ({
  sections,
  selectedValue,
  onSelect,
  onToggleFavorite,
  buttonText,
  buttonClassName = "",
  dropdownClassName = "",
  maxHeight = "max-h-96",
  showFavorites = true,
}: IntervalDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize collapsed state - all sections expanded by default
  useEffect(() => {
    const initialCollapsed: Record<string, boolean> = {};
    sections.forEach((section) => {
      initialCollapsed[section.title.toLowerCase()] = false;
    });
    setCollapsedSections(initialCollapsed);
  }, [sections]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Get selected item display text
  const getSelectedText = () => {
    if (buttonText) return buttonText;
    
    for (const section of sections) {
      const selected = section.value.find((item) => item.isSelected || item.value === selectedValue);
      if (selected) {
        return selected.value;
      }
    }
    return "Select";
  };

  // Handle interval selection
  const handleSelect = (sectionIndex: number, itemIndex: number, value: string) => {
    onSelect(value);
    setIsOpen(false);
  };

  // Handle favorite toggle
  const handleToggleFavorite = (e: React.MouseEvent, sectionIndex: number, itemIndex: number) => {
    e.stopPropagation();
    onToggleFavorite?.(sectionIndex, itemIndex);
  };

  // Toggle section collapse
  const toggleSection = (sectionTitle: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionTitle.toLowerCase()]: !prev[sectionTitle.toLowerCase()],
    }));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-6 sm:h-7 px-2 sm:px-3 text-xs text-gray-300 hover:text-white hover:bg-gray-900/50 rounded transition-colors flex items-center gap-1.5 border border-gray-700 hover:border-gray-600 ${buttonClassName}`}
      >
        <span className="hidden sm:inline">{getSelectedText()}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute right-0 top-full mt-1 w-52 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden ${dropdownClassName}`}>
          <div className={`overflow-y-auto ${maxHeight} [scrollbar-width:thin] [scrollbar-color:#374151_#1f2937] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-500`}>
            {sections.map((section, sectionIndex) => {
              const sectionKey = section.title.toLowerCase();
              const isCollapsed = collapsedSections[sectionKey] ?? false;
              
              return (
                <div key={section.title} className="border-b border-gray-800 last:border-b-0">
                  {/* Section Header with Chevron */}
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="w-full px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                  >
                    <span>{section.title}</span>
                    {isCollapsed ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronUp className="h-3 w-3" />
                    )}
                  </button>
                  
                  {/* Section Items */}
                  {!isCollapsed && (
                    <div className="py-0.5">
                      {section.value.map((item, itemIndex) => {
                        const isSelected = item.isSelected || item.value === selectedValue;
                        
                        return (
                          <button
                            key={item.value}
                            onClick={(e) => {
                              handleSelect(sectionIndex, itemIndex, item.value);
                            }}
                            className={`w-full px-4 py-2 text-xs text-left flex items-center justify-between transition-colors group ${
                              isSelected
                                ? "bg-teal-500/20 text-teal-400"
                                : "text-gray-300 hover:bg-gray-800 hover:text-white"
                            }`}
                          >
                            <span className="flex-1">{item.title}</span>
                            {showFavorites && (
                              <div className="flex items-center gap-2">
                                {item.isFavorite ? (
                                  <Star
                                    onClick={(e) => handleToggleFavorite(e, sectionIndex, itemIndex)}
                                    className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400 ml-2 shrink-0 cursor-pointer hover:scale-110 transition-transform"
                                  />
                                ) : (
                                  <Star
                                    onClick={(e) => handleToggleFavorite(e, sectionIndex, itemIndex)}
                                    className="h-3.5 w-3.5 text-gray-500 ml-2 shrink-0 cursor-pointer hover:text-yellow-400 hover:fill-yellow-400 transition-colors opacity-0 group-hover:opacity-100"
                                  />
                                )}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

