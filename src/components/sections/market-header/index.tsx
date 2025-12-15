import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export const MarketHeader = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-b border-gray-800 bg-gray-950">
      {/* Desktop & Tablet View */}
      <div className="hidden md:flex">
        <div className="w-full px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4 lg:gap-8 flex-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <button className="text-white hover:bg-gray-900/50 p-2 h-auto rounded transition-colors shrink-0">
              <div className="flex items-center gap-2">
                <img 
                  src="https://app.hyperliquid-testnet.xyz/coins/ETH.svg" 
                  alt="ETH" 
                  className="w-5 h-5 rounded-full"
                />
                <span className="font-semibold text-sm text-white">ETH-USDC</span>
                <ChevronDown className="h-3 w-3 text-gray-400" />
              </div>
            </button>

            <span className="text-xs font-medium bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded shrink-0">25x</span>

            <div className="flex gap-4 lg:gap-8 text-xs flex-1 min-w-0">
              <div className="shrink-0">
                <div className="text-gray-400 mb-0.5 border-b border-dashed border-gray-600 pb-0.5 inline-block">Mark</div>
                <div className="font-medium tabular-nums text-white">3,204.5</div>
              </div>
              <div className="shrink-0">
                <div className="text-gray-400 mb-0.5 border-b border-dashed border-gray-600 pb-0.5 inline-block">Oracle</div>
                <div className="font-medium tabular-nums text-white">3,198.8</div>
              </div>
              <div className="shrink-0">
                <div className="text-gray-400 mb-0.5">24H Change</div>
                <div className="font-medium text-red-500 tabular-nums">-101.3 / -3.06%</div>
              </div>
              <div className="shrink-0 hidden lg:block">
                <div className="text-gray-400 mb-0.5">24H Volume</div>
                <div className="font-medium tabular-nums text-white">$1,042,583.16</div>
              </div>
              <div className="shrink-0 hidden lg:block">
                <div className="text-gray-400 mb-0.5 border-b border-dashed border-gray-600 pb-0.5 inline-block">Open Interest</div>
                <div className="font-medium tabular-nums text-white">$1,455,648.61</div>
              </div>
              <div className="shrink-0 hidden xl:block">
                <div className="text-gray-400 mb-0.5 border-b border-dashed border-gray-600 pb-0.5 inline-block">Funding / Countdown</div>
                <div className="font-medium tabular-nums text-teal-400">0.0170% <span className="text-white">00:21:49</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button className="text-white hover:bg-gray-900/50 p-2 h-auto rounded transition-colors">
              <div className="flex items-center gap-2">
                <img 
                  src="https://app.hyperliquid-testnet.xyz/coins/ETH.svg" 
                  alt="ETH" 
                  className="w-5 h-5 rounded-full"
                />
                <span className="font-semibold text-sm text-white">ETH-USDC</span>
                <ChevronDown className="h-3 w-3 text-gray-400" />
              </div>
            </button>
            <span className="text-xs font-medium bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded">25x</span>
            <div className="ml-auto text-right">
              <div className="text-xs font-medium tabular-nums text-white">3,204.5</div>
              <div className="text-xs font-medium text-red-500 tabular-nums">-101.3 / -3.06%</div>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2 p-2 hover:bg-gray-900/50 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>

        {/* Expanded Mobile Details */}
        {isExpanded && (
          <div className="px-4 pb-3 space-y-3 border-t border-gray-800 pt-3">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-gray-400 mb-0.5 border-b border-dashed border-gray-600 pb-0.5 inline-block">Mark</div>
                <div className="font-medium tabular-nums text-white">3,204.5</div>
              </div>
              <div>
                <div className="text-gray-400 mb-0.5 border-b border-dashed border-gray-600 pb-0.5 inline-block">Oracle</div>
                <div className="font-medium tabular-nums text-white">3,198.8</div>
              </div>
              <div>
                <div className="text-gray-400 mb-0.5">24H Volume</div>
                <div className="font-medium tabular-nums text-white">$1,042,583.16</div>
              </div>
              <div>
                <div className="text-gray-400 mb-0.5 border-b border-dashed border-gray-600 pb-0.5 inline-block">Open Interest</div>
                <div className="font-medium tabular-nums text-white">$1,455,648.61</div>
              </div>
              <div className="col-span-2">
                <div className="text-gray-400 mb-0.5 border-b border-dashed border-gray-600 pb-0.5 inline-block">Funding / Countdown</div>
                <div className="font-medium tabular-nums text-teal-400">0.0170% <span className="text-white">00:21:49</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
