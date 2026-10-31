const fs = require('fs');
const path = require('path');

const publicImagesDir = path.join(__dirname, '..', 'public', 'images');
const outputFile = path.join(__dirname, '..', 'src', 'config', 'available-images.json');

if (!fs.existsSync(publicImagesDir)) {
  fs.mkdirSync(publicImagesDir, { recursive: true });
}

const files = fs.readdirSync(publicImagesDir);
const imagePaths = files
  .filter((f) => /\.(jpg|jpeg|png|webp|avif|svg)$/i.test(f))
  .map((f) => `/images/${f}`);

fs.writeFileSync(outputFile, JSON.stringify(imagePaths, null, 2) + '\n', 'utf-8');
console.log(`Generated ${outputFile} with ${imagePaths.length} images.`);

