// Inline every local <script src> and stylesheet into one HTML file that opens from file://.
const fs = require('node:fs');
const path = require('node:path');

const inline = (html, read) =>
  html
    .replace(/<script src="([^"]+)"><\/script>/g, (_, src) => `<script>${read(src).replace(/<\/script/gi, '<\\/script')}</script>`)
    .replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, href) => `<style>${read(href)}</style>`)
    .replace(/<script[^>]*\ssrc=[^>]*>|<link[^>]*stylesheet[^>]*>/i, (tag) => {
      throw new Error(`not inlined: ${tag}`);
    });

if (require.main === module) {
  const read = (p) => fs.readFileSync(path.join(__dirname, p), 'utf8');
  fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'dist/annotate.html'), inline(read('index.html'), read));
  console.log('built dist/annotate.html');
}

module.exports = { inline };
