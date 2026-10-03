// Renders the PNG app icons from an SVG with Playwright's Chromium. Run once: npx tsx scripts/make-icons.ts
import { chromium } from '@playwright/test';

// Full-bleed square (iOS rounds the corners itself); tiles kept inside the maskable safe zone.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#121213"/>
  <rect x="21" y="21" width="27" height="27" fill="#538d4e"/>
  <rect x="52" y="21" width="27" height="27" fill="#b59f3b"/>
  <rect x="21" y="52" width="27" height="27" fill="#3a3a3c"/>
  <rect x="52" y="52" width="27" height="27" fill="#538d4e"/>
</svg>`;

const sizes: Record<string, number> = { 'icon-192.png': 192, 'icon-512.png': 512, 'apple-touch-icon.png': 180 };

const browser = await chromium.launch();
for (const [file, size] of Object.entries(sizes)) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  await page.screenshot({ path: `public/${file}` });
  await page.close();
}
await browser.close();
