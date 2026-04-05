/**
 * Syntax check script for Dashboard.jsx
 * Uses esbuild to parse the JSX and report the exact error with line number.
 */
import * as esbuild from 'esbuild';
import { readFileSync } from 'fs';

const filePath = './src/pages/Dashboard.jsx';
const code = readFileSync(filePath, 'utf8');

try {
  await esbuild.transform(code, {
    loader: 'jsx',
    target: 'es2020',
    jsx: 'automatic',
  });
  console.log('✅ No syntax errors found in Dashboard.jsx!');
} catch (err) {
  if (err.errors && err.errors.length > 0) {
    console.error('❌ SYNTAX ERROR(S) FOUND:');
    err.errors.forEach((e, i) => {
      console.error(`\n--- Error ${i + 1} ---`);
      console.error(`  File   : ${e.location?.file || filePath}`);
      console.error(`  Line   : ${e.location?.line}`);
      console.error(`  Column : ${e.location?.column}`);
      console.error(`  Text   : ${e.location?.lineText}`);
      console.error(`  Reason : ${e.text}`);
    });
  } else {
    console.error('❌ Unknown build error:', err.message);
  }
  process.exit(1);
}
