#!/usr/bin/env node

/**
 * Generate placeholder PWA icons for Teela app
 * Usage: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Simple 1x1 transparent PNG (8 bytes header)
// For production, replace with actual icon generation using sharp, jimp, or similar
const createPlaceholderPNG = () => {
  // Minimal valid PNG: 8-byte header + IHDR + IDAT + IEND
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
    0x00, 0x00, 0x00, 0x0d, // IHDR chunk size
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1
    0x08, 0x06, // 8-bit RGBA
    0x00, 0x00, 0x00, // compression, filter, interlace
    0x1f, 0x15, 0xc4, 0x89, // CRC
    0x00, 0x00, 0x00, 0x0a, // IDAT chunk size
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0xd7, 0x63, 0xf8, 0x0f, 0x00, 0x00, 0x01, 0x01, 0x00, 0x18, // data
    0xdd, 0x8d, 0xb4, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND chunk size
    0x49, 0x45, 0x4e, 0x44, // IEND
    0xae, 0x42, 0x60, 0x82, // CRC
  ]);
};

const publicDir = path.join(__dirname, '../public');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Create placeholder icons
const icons = [
  'icon-192.png',
  'icon-512.png',
  'icon-512-maskable.png',
];

console.log('Generating placeholder PWA icons...');

icons.forEach((icon) => {
  const filepath = path.join(publicDir, icon);
  fs.writeFileSync(filepath, createPlaceholderPNG());
  console.log(`✓ Created ${icon}`);
});

console.log('\n⚠️  These are placeholder PNGs. For production:');
console.log('1. Follow PWA_ICONS_SETUP.md for generating real icons');
console.log('2. Replace these placeholder files with actual "T" logo icons');
console.log('3. Ensure icons are #3D1F08 with #F9F6F1 text\n');
