const fs = require('fs');
const filePath = 'src/pages/Dashboard.jsx';

const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

console.log('Total lines before:', lines.length);

// Lines to remove: the duplicates at 1075-1258 (1-indexed)
// But we need to also remove the blank line at 1074 that precedes them
// So remove lines 1074 to 1258 inclusive (0-indexed: 1073 to 1257)
// After removal, we also need to handle the stray useEffect that got inserted

// Find the first duplicate: line with "const handleAvatarUpload" that is NOT the original
let firstDupStart = -1;
let firstDupEnd = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const handleAvatarUpload = async (e) =>') && i > 500) {
        firstDupStart = i;
        break;
    }
}

if (firstDupStart === -1) {
    console.log('No duplicate found for handleAvatarUpload - already fixed?');
    process.exit(0);
}

// Find the end: the duplicate block ends just before "const handleSwitchUp"
for (let i = firstDupStart; i < lines.length; i++) {
    if (lines[i].includes('const handleSwitchUp = async')) {
        firstDupEnd = i - 1;
        // Trim trailing blanks
        while (firstDupEnd > firstDupStart && lines[firstDupEnd].trim() === '') {
            firstDupEnd--;
        }
        break;
    }
}

if (firstDupEnd === -1) {
    console.error('Could not find end of duplicate block');
    process.exit(1);
}

console.log(`Removing duplicate block from line ${firstDupStart + 1} to ${firstDupEnd + 1}`);

// Remove lines from firstDupStart-1 (the blank line before) through firstDupEnd
const startRemove = firstDupStart > 0 && lines[firstDupStart - 1].trim() === '' ? firstDupStart - 1 : firstDupStart;
const newLines = [
    ...lines.slice(0, startRemove),
    ...lines.slice(firstDupEnd + 1)
];

console.log('Total lines after:', newLines.length);
fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
console.log('Done removing duplicates.');
