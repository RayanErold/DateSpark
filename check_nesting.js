import fs from 'fs';
const content = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');

let braces = 0;
let parens = 0;
let square = 0;
let backticks = 0;
let inString = null; // ' or "

const lines = content.split('\n');
lines.forEach((line, i) => {
    let startB = braces;
    for (let j = 0; j < line.length; j++) {
        let char = line[j];
        if (inString) {
            if (char === inString && line[j-1] !== '\\') inString = null;
            continue;
        }
        if (char === '`') {
            backticks++;
            continue;
        }
        if (backticks % 2 !== 0) continue; // inside template literal

        if (char === '\'' || char === '"') {
            inString = char;
            continue;
        }

        if (char === '{') braces++;
        if (char === '}') braces--;
        if (char === '(') parens++;
        if (char === ')') parens--;
        if (char === '[') square++;
        if (char === ']') square--;
    }
    if (braces !== startB) {
       if (i >= 0 && i <= 1000) {
           console.log(`${i+1}: B=${braces} | ${line.trim()}`);
       }
    }
});
