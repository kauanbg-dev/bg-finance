// Rewrites every "file?v=..." reference in the frontend to a hash of that file,
// and renames the service worker cache whenever a precached file changes.
// Runs from the pre-commit hook; `node scripts/version-assets.js` works by hand too.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const FRONTEND = path.join(__dirname, '..', 'frontend');
const REF = /((?:\.?\/)?([\w.-]+\.(?:css|js|png|ico|svg|webp|webmanifest)))\?v=[\w-]+/g;

const hashes = new Map();
function hashOf(name) {
  if (!hashes.has(name)) {
    const file = path.join(FRONTEND, name);
    hashes.set(name, fs.existsSync(file)
      ? crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex').slice(0, 8)
      : null);
  }
  return hashes.get(name);
}

const changed = [];
function rewrite(name, transform) {
  const file = path.join(FRONTEND, name);
  const before = fs.readFileSync(file, 'utf8');
  const after = transform(before);
  if (after === before) return;
  fs.writeFileSync(file, after);
  hashes.delete(name);
  changed.push(path.join('frontend', name));
}

const stampRefs = (text) => text.replace(REF, (match, ref, name) => {
  const hash = hashOf(name);
  return hash ? `${ref}?v=${hash}` : match;
});

// The manifest goes first because the pages reference it by its own hash.
rewrite('manifest.webmanifest', stampRefs);
fs.readdirSync(FRONTEND)
  .filter((name) => name.endsWith('.html'))
  .forEach((name) => rewrite(name, stampRefs));

rewrite('sw.js', (text) => {
  const shell = (text.match(/const SHELL = \[([\s\S]*?)\]/) || [])[1] || '';
  const files = [...shell.matchAll(/'\/([^']+)'/g)].map((m) => m[1]);
  const digest = crypto.createHash('sha1');
  files.forEach((name) => digest.update(`${name}:${hashOf(name) || ''}`));
  return text.replace(/const CACHE = '[^']*';/, `const CACHE = 'bg-finance-${digest.digest('hex').slice(0, 8)}';`);
});

if (changed.length) {
  console.log(`Versões atualizadas: ${changed.join(', ')}`);
  if (process.argv.includes('--stage')) {
    execFileSync('git', ['add', ...changed], { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
  }
}
