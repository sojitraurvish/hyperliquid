import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { applyThemeColors } from "@/lib/color-utils";

// ==================== Theme Color Presets ====================

export interface ThemePreset {
  name: string;
  upColor: string;   // Buy / Long / Success
  downColor: string;  // Sell / Short / Error
}

export const THEME_PRESETS: ThemePreset[] = [
  { name: "Emerald & Red",    upColor: "#10b981", downColor: "#ef4444" },
  { name: "Teal & Rose",      upColor: "#14b8a6", downColor: "#f43f5e" },
  { name: "Cyan & Orange",    upColor: "#06b6d4", downColor: "#f97316" },
  { name: "Blue & Pink",      upColor: "#3b82f6", downColor: "#ec4899" },
  { name: "Classic Green",    upColor: "#22c55e", downColor: "#ef4444" },
  { name: "Violet & Amber",   upColor: "#8b5cf6", downColor: "#f59e0b" },
];

const DEFAULT_UP   = "#10b981";
const DEFAULT_DOWN = "#ef4444";

// ==================== Zustand Store ====================

interface ThemeState {
  upColor: string;
  downColor: string;
  activePreset: string | null;
  setColors: (upColor: string, downColor: string, preset?: string | null) => void;
  resetToDefault: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      upColor: DEFAULT_UP,
      downColor: DEFAULT_DOWN,
      activePreset: "Emerald & Red" as string | null,

      setColors: (upColor, downColor, preset = null) => {
        set({ upColor, downColor, activePreset: preset });
      },

      resetToDefault: () => {
        set({ upColor: DEFAULT_UP, downColor: DEFAULT_DOWN, activePreset: "Emerald & Red" });
      },
    }),
    {
      name: "ht-theme-colors",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        upColor: state.upColor,
        downColor: state.downColor,
        activePreset: state.activePreset,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          // Apply CSS variables as soon as persisted state is rehydrated
          if (state) {
            applyThemeColors(state.upColor, state.downColor);
          }
        };
      },
    }
  )
);
