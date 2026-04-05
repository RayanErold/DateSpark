// Run this with: node find_error.cjs
// It will output the EXACT line number and error from esbuild

const { transformSync } = require('esbuild');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Dashboard.jsx');
const code = fs.readFileSync(filePath, 'utf8');

try {
  transformSync(code, {
    loader: 'jsx',
    target: 'es2020',
  });
  console.log('\n✅ NO SYNTAX ERRORS FOUND!\n');
} catch (err) {
  if (err.errors && err.errors.length > 0) {
    console.error('\n❌ SYNTAX ERRORS:\n');
    err.errors.forEach((e, i) => {
      console.error(`Error ${i + 1}:`);
      console.error(`  Line   : ${e.location?.line}`);
      console.error(`  Column : ${e.location?.column}`);
      console.error(`  Code   : ${e.location?.lineText}`);
      console.error(`  Reason : ${e.text}`);
      console.error('');
    });
  } else {
    console.error('\n❌ Build error:', err.message);
  }
  process.exit(1);
}
