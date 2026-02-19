"use client";

import { useState, useRef, useEffect } from "react";
import { getNetworkPreference, setNetworkPreference, type NetworkMode } from "@/lib/network-preference";
import { useDisconnect } from "wagmi";

// ==================== Network Config ====================

interface NetworkOption {
  mode: NetworkMode;
  label: string;
  chainLabel: string;
  dotColor: string;        // Tailwind class for the status dot
  badgeBg: string;         // Tailwind class for the header badge bg
  badgeText: string;       // Tailwind class for the header badge text
}

const NETWORKS: NetworkOption[] = [
  {
    mode: "mainnet",
    label: "Mainnet",
    chainLabel: "Arbitrum One",
    dotColor: "bg-green-400",
    badgeBg: "bg-green-500/15",
    badgeText: "text-green-400",
  },
  {
    mode: "testnet",
    label: "Testnet",
    chainLabel: "Arbitrum Sepolia",
    dotColor: "bg-yellow-400",
    badgeBg: "bg-yellow-500/15",
    badgeText: "text-yellow-400",
  },
];

// ==================== NetworkSwitcher ====================

export const NetworkSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState<NetworkMode>("mainnet");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { disconnect } = useDisconnect();

  // Hydrate on mount
  useEffect(() => {
    setCurrentNetwork(getNetworkPreference());
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  const active = NETWORKS.find((n) => n.mode === currentNetwork) ?? NETWORKS[0];

  const handleSelect = (network: NetworkOption) => {
    if (network.mode === currentNetwork) {
      setIsOpen(false);
      return;
    }
    // Persist preference, disconnect wallet, and reload
    setNetworkPreference(network.mode);
    disconnect();
    window.location.reload();
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className={`
          flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-medium
          transition-all cursor-pointer
          bg-gray-900/60 border border-gray-800/40 ${active.badgeText}
          hover:bg-gray-800/60 hover:border-gray-700/50
        `}
        title={`Network: ${active.label} (${active.chainLabel})`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${active.dotColor}`} />
        {active.label}
        <svg
          className={`w-3 h-3 opacity-40 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-52 rounded-xl bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 shadow-2xl shadow-black/40 z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-800/50">
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
              Network
            </span>
          </div>

          <div className="p-1">
            {NETWORKS.map((network) => {
              const isActive = network.mode === currentNetwork;
              return (
                <button
                  key={network.mode}
                  onClick={() => handleSelect(network)}
                  className={`
                    w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left
                    transition-all cursor-pointer text-sm
                    ${isActive
                      ? "bg-gray-800/80 text-white"
                      : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                    }
                  `}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${network.dotColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[13px]">{network.label}</div>
                    <div className="text-[10px] text-gray-500">{network.chainLabel}</div>
                  </div>
                  {isActive && (
                    <svg className="w-3.5 h-3.5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          <div className="px-3 py-2 border-t border-gray-800/50">
            <p className="text-[10px] text-gray-500 leading-relaxed">
              Switching disconnects wallet and reloads.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkSwitcher;
