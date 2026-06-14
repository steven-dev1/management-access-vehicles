const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const assetsDir = path.join(__dirname, 'assets');

async function convertSVGtoPNG(svgFile, pngFile, width, height) {
  const svgPath = path.join(assetsDir, svgFile);
  const pngPath = path.join(assetsDir, pngFile);
  
  const svgBuffer = fs.readFileSync(svgPath);
  
  await sharp(svgBuffer)
    .resize(width, height)
    .png()
    .toFile(pngPath);
  
  const stats = fs.statSync(pngPath);
  console.log(`✓ ${pngFile} (${width}x${height}, ${(stats.size / 1024).toFixed(1)}KB)`);
}

async function main() {
  console.log('Generating PNG assets...\n');
  
  // Splash screen: 1284x2778 (iPhone 14 Pro Max)
  await convertSVGtoPNG('splash.svg', 'splash.png', 1284, 2778);
  
  // App icon: 1024x1024
  await convertSVGtoPNG('icon.svg', 'icon.png', 1024, 1024);
  
  // Adaptive icon: 1024x1024
  await convertSVGtoPNG('adaptive-icon.svg', 'adaptive-icon.png', 1024, 1024);
  
  // Favicon: 48x48
  await convertSVGtoPNG('favicon.svg', 'favicon.png', 48, 48);
  
  // Also generate a smaller favicon for web
  await convertSVGtoPNG('favicon.svg', 'favicon-16.png', 16, 16);
  await convertSVGtoPNG('favicon.svg', 'favicon-32.png', 32, 32);
  
  console.log('\nAll assets generated!');
}

main().catch(console.error);
