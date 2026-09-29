const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist/member');

const cssFile = fs
  .readdirSync(distDir)
  .find(
    file =>
      file.startsWith('styles.') &&
      file.endsWith('.css')
  );

if (!cssFile) {
  throw new Error('styles.<hash>.css not found');
}

fs.copyFileSync(
  path.join(distDir, cssFile),
  path.join(distDir, 'mfe-styles.css')
);

console.log(`Created mfe-styles.css from ${cssFile}`);