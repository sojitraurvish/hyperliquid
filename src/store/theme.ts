import { create } from "zustand";

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

// ==================== Local Storage Helpers ====================

const STORAGE_KEY = "ht-theme-colors";

interface StoredTheme {
  upColor: string;
  downColor: string;
  activePreset: string | null;
}

function loadFromStorage(): StoredTheme | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredTheme;
  } catch {
    return null;
  }
}

function saveToStorage(data: StoredTheme): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Silently fail if storage is full or unavailable
  }
}

// ==================== Zustand Store ====================

interface ThemeState {
  upColor: string;
  downColor: string;
  activePreset: string | null;
  setColors: (upColor: string, downColor: string, preset?: string | null) => void;
  resetToDefault: () => void;
  hydrate: () => void;
}

const stored = loadFromStorage();

export const useThemeStore = create<ThemeState>((set, get) => ({
  upColor:      stored?.upColor      ?? DEFAULT_UP,
  downColor:    stored?.downColor    ?? DEFAULT_DOWN,
  activePreset: stored?.activePreset ?? "Emerald & Red",

  setColors: (upColor, downColor, preset = null) => {
    set({ upColor, downColor, activePreset: preset });
    saveToStorage({ upColor, downColor, activePreset: preset });
  },

  resetToDefault: () => {
    const data = { upColor: DEFAULT_UP, downColor: DEFAULT_DOWN, activePreset: "Emerald & Red" as string | null };
    set(data);
    saveToStorage(data);
  },

  hydrate: () => {
    const saved = loadFromStorage();
    if (saved) {
      set(saved);
    }
  },
}));
