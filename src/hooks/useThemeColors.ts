import { useEffect } from "react";
import { useThemeStore } from "@/store/theme";
import { applyThemeColors } from "@/lib/color-utils";

/**
 * Hook that applies the user's theme colors to the DOM.
 * Call once at the app root level (_app.tsx).
 * Whenever upColor or downColor changes, CSS variables are updated on :root.
 */
export function useThemeColors() {
  const { upColor, downColor, hydrate } = useThemeStore();

  // Hydrate store from localStorage on mount (client only)
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Apply CSS variables whenever colors change
  useEffect(() => {
    applyThemeColors(upColor, downColor);
  }, [upColor, downColor]);

  return { upColor, downColor };
}
