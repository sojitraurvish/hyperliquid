# Favicon Setup Instructions

The old Vercel favicon has been removed. To complete the setup, you need to generate a new `favicon.ico` file.

## Quick Setup (Choose One Method)

### Method 1: Using Online Converter (Fastest - 2 minutes)
1. Go to https://convertio.co/svg-ico/ or https://cloudconvert.com/svg-to-ico
2. Upload `public/images/favicon.svg`
3. Download the converted file
4. Save it as `public/favicon.ico`
5. Restart your dev server

### Method 2: Using Node Script (Automated)
```bash
# Install sharp (image processing library)
npm install --save-dev sharp

# Run the generation script
node scripts/generate-favicon.js
```

### Method 3: Using ImageMagick (If installed)
```bash
convert public/images/favicon.svg -resize 32x32 public/favicon.ico
```

## Current Status

✅ SVG favicon created: `public/images/favicon.svg`
✅ Favicon links added to `_document.tsx` and `CustomHead.tsx`
✅ Old Vercel favicon removed
⏳ ICO file needs to be generated (for older browser compatibility)

## Browser Support

- **Modern browsers** (Chrome, Firefox, Safari, Edge): Will use `/images/favicon.svg` ✅
- **Older browsers**: Will fallback to `/favicon.ico` (needs to be generated)

## Verification

After generating the ICO file:
1. Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)
2. Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)
3. Check the browser tab - you should see the new "HT" logo

## Files Created

- `/public/images/favicon.svg` - SVG favicon (modern browsers)
- `/public/images/logo.svg` - Main logo
- `/public/images/og-image.svg` - Open Graph image for social sharing
- `/scripts/generate-favicon.js` - Script to generate ICO from SVG

