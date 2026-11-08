const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\Wasil\\.gemini\\antigravity\\scratch\\aura-luxe-store';
const outPath = 'C:\\Users\\Wasil\\.gemini\\antigravity\\brain\\02385b1a-ad89-4965-9e66-b8faef4b48f7\\preview.html';

const html = fs.readFileSync(path.join(srcDir, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(srcDir, 'style.css'), 'utf8');
const products = fs.readFileSync(path.join(srcDir, 'products-data.js'), 'utf8');
const floatingBg = fs.readFileSync(path.join(srcDir, 'floating-background.js'), 'utf8');
const app = fs.readFileSync(path.join(srcDir, 'app.js'), 'utf8');

// Replace external CSS link with inline style
let bundled = html.replace('<link rel="stylesheet" href="style.css" />', `<style>\n${css}\n</style>`);

// Replace external JS scripts with inline scripts
const scriptTagsRegex = /<script src="products-data\.js"><\/script>\s*<script src="floating-background\.js"><\/script>\s*<script src="app\.js"><\/script>/;

const inlinedScripts = `
<script>
// --- PRODUCTS DATA ---
${products}

// --- FLOATING OBJECTS BACKGROUND ENGINE ---
${floatingBg}

// --- APP APPLICATION LOGIC ---
${app}
</script>
`;

bundled = bundled.replace(scriptTagsRegex, inlinedScripts);

fs.writeFileSync(outPath, bundled, 'utf8');
console.log('Successfully bundled to ' + outPath + ' (size: ' + bundled.length + ' bytes)');
