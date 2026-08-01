import fs from 'node:fs';
import path from 'node:path';

const filePath = path.resolve('dist/server/index.js');
if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  const polyfill = `/** WeakRef Polyfill for workerd */
if (typeof globalThis.WeakRef === "undefined") {
  globalThis.WeakRef = class WeakRef {
    constructor(value) {
      this.value = value;
    }
    deref() {
      return this.value;
    }
  };
}
`;
  if (!content.includes('/** WeakRef Polyfill for workerd */')) {
    content = polyfill + content;
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully patched dist/server/index.js with WeakRef polyfill!');
  } else {
    console.log('dist/server/index.js already patched.');
  }
} else {
  console.log('dist/server/index.js not found, skipping patch.');
}
