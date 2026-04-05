import fs from 'fs';

const code = fs.readFileSync('C:\\Users\\Erold Rayan\\Downloads\\Million Dollar Web app Ideas\\Date Planner app\\src\\pages\\Dashboard.jsx', 'utf-8');
const lines = code.split('\n');

let openCurl = 0;
let closeCurl = 0;
let openDiv = 0;
let closeDiv = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    
    // Count curlies
    const curlies = line.match(/{/g);
    if (curlies) openCurl += curlies.length;
    const closed = line.match(/}/g);
    if (closed) closeCurl += closed.length;

    // Count div tags
    const divs = line.match(/<div/g);
    if (divs) openDiv += divs.length;
    const closedDivs = line.match(/<\/div>/g);
    if (closedDivs) closeDiv += closedDivs.length;
}

console.log(`Final Totals for Entire File:`);
console.log(`Curl Open: ${openCurl}, Close: ${closeCurl} (Diff: ${openCurl - closeCurl})`);
console.log(`Div Open: ${openDiv}, Close: ${closeDiv} (Diff: ${openDiv - closeDiv})`);
fs.writeFileSync('C:\\Users\\Erold Rayan\\Downloads\\Million Dollar Web app Ideas\\Date Planner app\\syntax_totals.txt', `Curl Open: ${openCurl}, Close: ${closeCurl} (Diff: ${openCurl - closeCurl})\nDiv Open: ${openDiv}, Close: ${closeDiv} (Diff: ${openDiv - closeDiv})`);
