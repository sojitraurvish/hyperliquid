import { BarChart3, Maximize2 } from "lucide-react";
import { AppButton } from "@/components/ui/button";

interface ChartToolbarProps {
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
  onIndicatorsClick: () => void;
  onMaximizeClick: () => void;
}

const TIMEFRAMES = ["5m", "1h", "D"];

export const ChartToolbar = ({
  selectedTimeframe,
  onTimeframeChange,
  onIndicatorsClick,
  onMaximizeClick,
}: ChartToolbarProps) => {
  return (
    <div className="flex items-center justify-between px-2 sm:px-3 py-2 border-b border-gray-800">
      <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => onTimeframeChange(tf)}
            className={`text-xs h-7 px-2 rounded transition-colors whitespace-nowrap ${
              selectedTimeframe === tf
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-900/50"
            }`}
          >
            {tf}
          </button>
        ))}
        <div className="w-px h-4 bg-gray-800 mx-1" />
        <button
          onClick={onIndicatorsClick}
          className="text-xs h-7 px-2 text-gray-400 hover:text-white hover:bg-gray-900/50 rounded transition-colors flex items-center gap-1 whitespace-nowrap"
        >
          <BarChart3 className="h-3 w-3" />
          <span className="hidden sm:inline">Indicators</span>
        </button>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onMaximizeClick}
          className="h-7 w-7 text-gray-400 hover:text-white hover:bg-gray-900/50 rounded transition-colors flex items-center justify-center"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
