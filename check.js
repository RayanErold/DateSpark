import fs from 'fs';
const content = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8').split('\n');
content.forEach((line, i) => {
    let bts = line.match(/`/g);
    if (bts && bts.length % 2 !== 0) {
        console.log((i+1) + ': ' + line.trim());
    }
});
