import fs from 'fs';

const code = fs.readFileSync('C:\\Users\\Erold Rayan\\Downloads\\Million Dollar Web app Ideas\\Date Planner app\\src\\pages\\Dashboard.jsx', 'utf-8');
const lines = code.split('\n');

function checkRange(start, end) {
    let o = 0, c = 0, s = 0;
    for (let i = start; i < end; i++) {
         const line = lines[i];
         if (!line) continue;
         const divs = line.match(/<div/g);
         if (divs) o += divs.length;
         const closed = line.match(/<\/div>/g);
         if (closed) c += closed.length;
         const selfClosed = line.match(/<div [^>]*\/>/g) || [];
         s += selfClosed.length;
    }
    return { o, c, s, realDiff: (o - s) - c };
}

console.log("Range 0-385 (Pre-Return):", checkRange(0, 385));
console.log("Range 385-600 (Header/Main):", checkRange(385, 600));
console.log("Range 600-835 (Modal 1):", checkRange(600, 835));
console.log("Range 835-920 (Modal 2):", checkRange(835, 920));
console.log("Range 920-960 (Modal 3):", checkRange(920, 960));
console.log("Range 960-1175 (Settings Modal):", checkRange(960, 1175));
