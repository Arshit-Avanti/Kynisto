import fs from 'fs';
import path from 'path';

const clientAssets = fs.readdirSync('dist/client/assets');
for (const file of clientAssets) {
  if (file.endsWith('.js')) {
    const content = fs.readFileSync(path.join('dist/client/assets', file), 'utf8');
    if (content.includes('cloudflare:workers')) {
      console.log('Found cloudflare:workers in:', file);
    }
  }
}
console.log('Done scanning client assets.');
