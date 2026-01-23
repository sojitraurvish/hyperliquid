# SEO Images Directory

This directory contains all SEO-related images for the Hyper Trading platform.

## Files

### `logo.svg`
- **Purpose**: Main logo for the application
- **Size**: 512x512px (scalable SVG)
- **Usage**: Used in structured data, general branding
- **Format**: SVG (vector, scalable)

### `og-image.svg`
- **Purpose**: Open Graph image for social media sharing
- **Size**: 1200x630px (standard OG image dimensions)
- **Usage**: Facebook, Twitter, LinkedIn, etc. when sharing links
- **Format**: SVG (vector, scalable)
- **Note**: Some platforms prefer PNG/JPG. If needed, create a PNG version at 1200x630px.

### `favicon.svg`
- **Purpose**: Favicon for browser tabs
- **Size**: 32x32px (scalable SVG)
- **Usage**: Browser tab icon
- **Format**: SVG (modern browsers support SVG favicons)
- **Fallback**: `/favicon.ico` is used for older browsers

### `og-image.png` (Placeholder)
- **Purpose**: PNG version of OG image for better compatibility
- **Size**: Should be 1200x630px
- **Status**: Currently a placeholder - replace with actual PNG image if needed
- **Note**: SVG version is used by default, but PNG can be used for better compatibility with some platforms

## Usage in Code

All images are referenced through constants in `/src/lib/config/index.tsx`:
- `DESK_LOGO` → `/images/logo.svg`
- `OG_IMAGE` → `/images/og-image.svg`
- `SMALL_LOGO` → `/images/logo.svg`
- `FavIcon` → `/images/favicon.svg`
- `SEO_LOGO` → `${WEB_URL}/images/logo.svg` (absolute URL)

## Best Practices

1. **OG Images**: Should be at least 1200x630px for optimal display on social media
2. **Favicons**: SVG is preferred for modern browsers, but keep `.ico` as fallback
3. **File Size**: Keep images optimized for web (SVG is already optimized)
4. **Alt Text**: Ensure proper alt text is set when using images in components

## Replacing Images

When replacing these images:
1. Keep the same file names to maintain existing references
2. Maintain the same dimensions (or update constants if dimensions change)
3. For PNG versions, ensure they're optimized (use tools like TinyPNG)
4. Update the constants in `/src/lib/config/index.tsx` if file names change

