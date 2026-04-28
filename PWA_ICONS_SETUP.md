# PWA Icons Setup Guide

This guide explains how to generate the required PWA icons for Teela app.

## Required Icons

The app needs:
- `public/icon-192.png` — 192x192 pixels (small icon)
- `public/icon-512.png` — 512x512 pixels (large icon)
- `public/icon-512-maskable.png` — 512x512 pixels (adaptive/maskable)

All icons should feature a simple **"T" monogram** on the **Teela primary color (#3D1F08)** background with cream/white text.

## Quick Setup Option 1: Use Favicon Generator

1. Go to https://realfavicongenerator.net/
2. Upload or design a "T" logo (512x512+)
3. Select these settings:
   - Background: #3D1F08
   - Text/Logo: White or #F9F6F1
   - Format: PNG
4. Download package and extract to `public/`

## Quick Setup Option 2: Use Online Icon Creator

1. Go to https://www.favicon-generator.org/
2. Create simple "T" text icon:
   - Text: "T"
   - Size: 512px
   - Background: #3D1F08
   - Text Color: #F9F6F1
   - Font: Bold, centered
3. Download 192x192 and 512x512 versions
4. Save to `public/icon-192.png` and `public/icon-512.png`

## Advanced Setup: Programmatic Generation

You can generate icons programmatically using Node.js:

```bash
npm install sharp
```

Create a script `scripts/generate-icons.js`:

```javascript
const sharp = require('sharp');
const svg = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#3D1F08"/>
  <text x="256" y="300" font-size="280" font-weight="bold" 
        text-anchor="middle" fill="#F9F6F1" font-family="Arial">T</text>
</svg>
`;

async function generateIcons() {
  const buffer = Buffer.from(svg);
  
  // 192x192
  await sharp(buffer).resize(192, 192).png().toFile('public/icon-192.png');
  
  // 512x512
  await sharp(buffer).resize(512, 512).png().toFile('public/icon-512.png');
  
  // 512x512 maskable (add padding for adaptive icons)
  const paddedSvg = `
  <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" fill="#3D1F08"/>
    <circle cx="256" cy="256" r="180" fill="#3D1F08"/>
    <text x="256" y="300" font-size="280" font-weight="bold" 
          text-anchor="middle" fill="#F9F6F1" font-family="Arial">T</text>
  </svg>
  `;
  
  await sharp(Buffer.from(paddedSvg)).resize(512, 512).png()
    .toFile('public/icon-512-maskable.png');
  
  console.log('✓ Icons generated successfully');
}

generateIcons().catch(console.error);
```

Run:
```bash
node scripts/generate-icons.js
```

## Verification

After generating icons, verify they exist:

```bash
ls -lh public/icon-*.png
```

Expected output:
```
-rw-r--r-- public/icon-192.png       (≈2-5 KB)
-rw-r--r-- public/icon-512.png       (≈5-10 KB)
-rw-r--r-- public/icon-512-maskable.png (≈5-10 KB)
```

## Testing PWA Icons

1. Build the app: `npm run build`
2. Deploy or use local preview: `npm run preview`
3. On mobile (Android):
   - Open Chrome
   - Tap menu > "Install app"
   - Check home screen icon appearance
4. On iOS:
   - Open Safari
   - Tap Share > "Add to Home Screen"
   - Check appearance in home screen

---

**Next Step:** Once icons are in place, run `npm run build` and deploy to Vercel!
