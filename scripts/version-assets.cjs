// Run before publishing: one content-derived version for the full asset graph.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const versionQuery = /\?v=[a-zA-Z0-9._-]+/g;
function walk(dir) {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(entry => {
    const name = dir + '/' + entry.name;
    return entry.isDirectory() ? walk(name) : [name];
  });
}
const assets = ['css', 'js', 'image', 'assets'].flatMap(walk).sort();
const hash = crypto.createHash('sha256');
for (const name of assets) {
  const buffer = fs.readFileSync(path.join(root, name));
  hash.update(name + '\0');
  hash.update(/\.(js|css|json|svg)$/.test(name) ? buffer.toString('utf8').replace(/\r\n/g, '\n').replace(versionQuery, '') : buffer);
  hash.update('\0');
}
const indexPath = path.join(root, 'index.html');
const index = fs.readFileSync(indexPath, 'utf8');
hash.update(index.replace(/\r\n/g, '\n').replace(versionQuery, '').replace(/^\s*<meta name="app-version"[^>]+>\n/gm, ''));
const version = hash.digest('hex').slice(0, 12);
const stamp = text => text.replace(versionQuery, '?v=' + version);
const write = (name, before, after) => {
  if (before !== after) fs.writeFileSync(path.join(root, name), after);
};
for (const name of assets.filter(name => /^(js|css)\//.test(name) && !name.startsWith('js/vendor/') && /\.(js|css)$/.test(name))) {
  const before = fs.readFileSync(path.join(root, name), 'utf8');
  let after = stamp(before);
  // Refresh static and lazy ES module dependencies, including previously unversioned ones.
  after = after.replace(/(['"])(\.\.?\/[^'"\s]+\.js)(\?v=[a-zA-Z0-9._-]+)?\1/g, (_, quote, url) => quote + url + '?v=' + version + quote);
  if (name.endsWith('.css')) after = after.replace(/url\((['"]?)(\.\.?\/[^'"()\s]+\.(?:png|webp|jpg|svg))(\?v=[a-zA-Z0-9._-]+)?\1\)/g, (_, quote, url) => 'url(' + quote + url + '?v=' + version + quote + ')');
  write(name, before, after);
}
let nextIndex = stamp(index).replace(/<meta name="app-version"[^>]+>\n\s*/g, '');
// Bare imports and direct imports must resolve to the same Three.js instance.
nextIndex = nextIndex.replace(/(['"])(\.\/js\/[^'"\s]+\.js)(\?v=[a-zA-Z0-9._-]+)?\1/g, (_, quote, url) => quote + url + '?v=' + version + quote);
nextIndex = nextIndex.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n  <meta name="app-version" content="' + version + '">');
write('index.html', index, nextIndex);
console.log(JSON.stringify({ version, assets: assets.length }));
