const fs = require('fs');
const path = require('path');

/**
 * Helper to recursively copy directories.
 */
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const root = path.join(__dirname, '..');
const standalone = path.join(root, '.next', 'standalone');

if (fs.existsSync(standalone)) {
  console.log('Postbuild: Copying static assets to Next.js standalone directory...');
  
  // 1. Copy public asset folder
  copyDir(path.join(root, 'public'), path.join(standalone, 'public'));
  
  // 2. Copy compiled static cache files (.next/static)
  copyDir(path.join(root, '.next', 'static'), path.join(standalone, '.next', 'static'));
  
  console.log('Postbuild: Static assets copied successfully.');
} else {
  console.log('Postbuild: Standalone directory not found. Skipping static copy.');
}
