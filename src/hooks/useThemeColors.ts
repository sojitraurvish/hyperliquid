import { useEffect } from "react";
import { useThemeStore } from "@/store/theme";
import { applyThemeColors } from "@/lib/color-utils";

/**
 * Hook that applies the user's theme colors to the DOM.
 * Call once at the app root level (_app.tsx).
 * Persist middleware handles localStorage hydration automatically.
 * Whenever upColor or downColor changes, CSS variables are updated on :root.
 */
export function useThemeColors() {
  const { upColor, downColor } = useThemeStore();

  // Apply CSS variables whenever colors change
  useEffect(() => {
    applyThemeColors(upColor, downColor);
  }, [upColor, downColor]);

  return { upColor, downColor };
}
