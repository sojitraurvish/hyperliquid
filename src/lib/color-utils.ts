// ==================== Color Utility Functions ====================
// Used by the theme system to generate color palettes and apply them as CSS variables

/**
 * Convert hex color to RGB components
 */
export function hexToRGB(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace('#', '');
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleaned);
  if (!result) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Convert RGB components to hex string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b]
    .map((x) => {
      const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('');
}

/**
 * Mix two hex colors by a weight (0 = all color1, 1 = all color2)
 */
function mixColors(hex1: string, hex2: string, weight: number): string {
  const c1 = hexToRGB(hex1);
  const c2 = hexToRGB(hex2);
  return rgbToHex(
    Math.round(c1.r + (c2.r - c1.r) * weight),
    Math.round(c1.g + (c2.g - c1.g) * weight),
    Math.round(c1.b + (c2.b - c1.b) * weight)
  );
}

/**
 * Generate a full Tailwind-style color palette (50–950) from a single base color.
 * Lighter shades mix toward white, darker shades mix toward black.
 */
export function generatePalette(baseHex: string): Record<string, string> {
  return {
    '50':  mixColors(baseHex, '#ffffff', 0.95),
    '100': mixColors(baseHex, '#ffffff', 0.88),
    '200': mixColors(baseHex, '#ffffff', 0.75),
    '300': mixColors(baseHex, '#ffffff', 0.55),
    '400': mixColors(baseHex, '#ffffff', 0.3),
    '500': baseHex,
    '600': mixColors(baseHex, '#000000', 0.15),
    '700': mixColors(baseHex, '#000000', 0.3),
    '800': mixColors(baseHex, '#000000', 0.45),
    '900': mixColors(baseHex, '#000000', 0.55),
    '950': mixColors(baseHex, '#000000', 0.75),
  };
}

/**
 * Apply theme colors to the document root as CSS custom properties.
 * This overrides the Tailwind @theme defaults so all `green-*` and `red-*`
 * utilities automatically pick up the new values.
 */
export function applyThemeColors(upColor: string, downColor: string): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const upPalette = generatePalette(upColor);
  const downPalette = generatePalette(downColor);

  // Override green-* palette (buy / long / success)
  Object.entries(upPalette).forEach(([shade, hex]) => {
    root.style.setProperty(`--color-green-${shade}`, hex);
  });

  // Override red-* palette (sell / short / error)
  Object.entries(downPalette).forEach(([shade, hex]) => {
    root.style.setProperty(`--color-red-${shade}`, hex);
  });
}

/**
 * Remove all theme overrides from the root element (revert to @theme defaults)
 */
export function clearThemeColors(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
  shades.forEach((shade) => {
    root.style.removeProperty(`--color-green-${shade}`);
    root.style.removeProperty(`--color-red-${shade}`);
  });
}
