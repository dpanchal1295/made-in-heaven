import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const IMAGES_DIR = path.join(process.cwd(), 'public', 'images');

const HERO_IMAGES = new Set([
  'hero.jpg',
  'community-hero.jpg',
  'main-hero.jpg',
  'birthday-hero.jpg',
  'wedding.jpg',
]);

async function optimizeImages() {
  console.log('--- Starting Image Optimization for public/images ---');
  console.log(`Target directory: ${IMAGES_DIR}\n`);

  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`Error: Directory ${IMAGES_DIR} does not exist.`);
    process.exit(1);
  }

  const allFiles = fs.readdirSync(IMAGES_DIR);
  const jpgFiles = allFiles.filter((f) => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg'));

  const results = [];

  for (const filename of jpgFiles) {
    const filePath = path.join(IMAGES_DIR, filename);
    const inputBuffer = fs.readFileSync(filePath);
    const beforeBytes = inputBuffer.length;

    const metadata = await sharp(inputBuffer).metadata();

    const isHero = HERO_IMAGES.has(filename);
    const maxWidth = isHero ? 1600 : 1200;

    let pipeline = sharp(inputBuffer).rotate();

    // Resize by width only if wider than maxWidth, keep aspect ratio, never enlarge, never crop
    if (metadata.width && metadata.width > maxWidth) {
      pipeline = pipeline.resize({
        width: maxWidth,
        withoutEnlargement: true,
      });
    }

    // Re-encode as JPEG with mozjpeg, quality 72, progressive, strip metadata
    pipeline = pipeline.jpeg({
      quality: 72,
      progressive: true,
      mozjpeg: true,
    });

    const newBuffer = await pipeline.toBuffer();
    const afterBytes = newBuffer.length;

    let replaced = false;
    if (afterBytes < beforeBytes) {
      fs.writeFileSync(filePath, newBuffer);
      replaced = true;
    }

    const finalBytes = replaced ? afterBytes : beforeBytes;
    const diffPct = (((finalBytes - beforeBytes) / beforeBytes) * 100).toFixed(1);

    results.push({
      filename,
      width: metadata.width,
      height: metadata.height,
      targetMaxWidth: maxWidth,
      beforeBytes,
      afterBytes: finalBytes,
      diffPct: `${diffPct}%`,
      replaced,
    });
  }

  // Print results table
  console.log('| Photo | Dimensions | Max Width | Before | After | Change | Replaced |');
  console.log('| :--- | :--- | :--- | :--- | :--- | :--- | :--- |');
  let totalBefore = 0;
  let totalAfter = 0;

  for (const r of results) {
    totalBefore += r.beforeBytes;
    totalAfter += r.afterBytes;
    const beforeKb = (r.beforeBytes / 1024).toFixed(1) + ' KB';
    const afterKb = (r.afterBytes / 1024).toFixed(1) + ' KB';
    const dims = `${r.width}x${r.height}`;
    console.log(
      `| ${r.filename} | ${dims} | ${r.targetMaxWidth}px | ${beforeKb} | ${afterKb} | ${r.diffPct} | ${r.replaced ? 'Yes' : 'No'} |`
    );
  }

  console.log('\n--- Summary ---');
  console.log(`Total Before: ${(totalBefore / 1024 / 1024).toFixed(2)} MB (${totalBefore} bytes)`);
  console.log(`Total After:  ${(totalAfter / 1024 / 1024).toFixed(2)} MB (${totalAfter} bytes)`);
  console.log(
    `Saved:        ${((totalBefore - totalAfter) / 1024 / 1024).toFixed(2)} MB (${(
      ((totalAfter - totalBefore) / totalBefore) *
      100
    ).toFixed(1)}%)`
  );
}

optimizeImages().catch((err) => {
  console.error('Error during image optimization:', err);
  process.exit(1);
});
