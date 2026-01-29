/**
 * Script to generate favicon.ico from SVG
 * 
 * This script converts the SVG favicon to ICO format for older browser compatibility.
 * 
 * Requirements:
 * - Install sharp: npm install --save-dev sharp
 * - Or use an online tool: https://convertio.co/svg-ico/
 * 
 * Usage:
 * node scripts/generate-favicon.js
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Sharp not found. Please install it: npm install --save-dev sharp');
  console.log('Or use an online converter: https://convertio.co/svg-ico/');
  console.log('Convert public/images/favicon.svg to public/favicon.ico');
  process.exit(1);
}

async function generateFavicon() {
  const svgPath = path.join(__dirname, '../public/images/favicon.svg');
  const icoPath = path.join(__dirname, '../public/favicon.ico');

  try {
    // Read SVG
    const svgBuffer = fs.readFileSync(svgPath);

    // Convert to ICO (multiple sizes: 16x16, 32x32, 48x48)
    await sharp(svgBuffer)
      .resize(32, 32)
      .toFile(icoPath);

    console.log('✅ Favicon.ico generated successfully!');
    console.log(`   Output: ${icoPath}`);
  } catch (error) {
    console.error('❌ Error generating favicon:', error.message);
    console.log('\nAlternative: Use an online converter:');
    console.log('1. Go to https://convertio.co/svg-ico/');
    console.log('2. Upload public/images/favicon.svg');
    console.log('3. Download and save as public/favicon.ico');
  }
}

generateFavicon();


