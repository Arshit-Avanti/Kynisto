import fs from 'fs';

const content = fs.readFileSync('dist/client/assets/subscriptions-MBRpWQ4J.js', 'utf8');
const idx = content.indexOf('cloudflare:workers');
console.log(content.slice(Math.max(0, idx - 200), idx + 200));
