import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const markSvg = fs.readFileSync(path.join(root, "public/brand/logo-mark.svg"));

async function writePng(filePath, size, background) {
  await sharp(markSvg, { density: 384 })
    .resize(size, size, { fit: "contain", background })
    .png()
    .toFile(filePath);
  console.log("wrote", path.relative(root, filePath));
}

async function writeOg() {
  const width = 1200;
  const height = 630;
  const mark = await sharp(markSvg, { density: 512 }).resize(220, 220).png().toBuffer();

  const svg = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#F8FAF9"/>
          <stop offset="55%" stop-color="#ECFEFF"/>
          <stop offset="100%" stop-color="#FEF3C7"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <circle cx="1080" cy="-40" r="280" fill="#14B8A6" fill-opacity="0.12"/>
      <circle cx="80" cy="680" r="260" fill="#F59E0B" fill-opacity="0.12"/>
      <text x="120" y="250" fill="#134E4A" font-family="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="92" font-weight="700" letter-spacing="-0.045em">TimeGrid</text>
      <text x="120" y="330" fill="#0F766E" font-family="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="36" font-weight="500">Plan across time zones without the clutter.</text>
      <text x="120" y="520" fill="#64748B" font-family="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="28">Compare · Overlap · Share · Export</text>
      <text x="120" y="570" fill="#94A3B8" font-family="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="22">Made by Evolvtech, LLC</text>
    </svg>
  `);

  await sharp(svg)
    .composite([{ input: mark, left: 900, top: 190 }])
    .png()
    .toFile(path.join(root, "public/og.png"));
  console.log("wrote public/og.png");
}

async function main() {
  const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

  await writePng(path.join(root, "public/favicon-16x16.png"), 16, transparent);
  await writePng(path.join(root, "public/favicon-32x32.png"), 32, transparent);
  await writePng(path.join(root, "public/icon-192.png"), 192, transparent);
  await writePng(path.join(root, "public/icon-512.png"), 512, transparent);
  await writePng(path.join(root, "app/apple-icon.png"), 180, transparent);
  await writePng(path.join(root, "app/icon.png"), 32, transparent);

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 15, g: 118, b: 110, alpha: 1 }
    }
  })
    .composite([
      {
        input: await sharp(markSvg, { density: 512 }).resize(512, 512).png().toBuffer(),
        gravity: "centre"
      }
    ])
    .png()
    .toFile(path.join(root, "public/icon-512-maskable.png"));
  console.log("wrote public/icon-512-maskable.png");

  await writeOg();

  const png16 = await sharp(markSvg, { density: 384 }).resize(16, 16).png().toBuffer();
  const png32 = await sharp(markSvg, { density: 384 }).resize(32, 32).png().toBuffer();
  const ico = await pngToIco([png16, png32]);
  fs.writeFileSync(path.join(root, "app/favicon.ico"), ico);
  fs.writeFileSync(path.join(root, "public/favicon.ico"), ico);
  console.log("wrote favicon.ico");

  fs.copyFileSync(path.join(root, "public/brand/logo-mark.svg"), path.join(root, "public/icon.svg"));
  console.log("wrote public/icon.svg");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
