const fs = require('fs');

const code = fs.readFileSync('C:\\Users\\Erold Rayan\\Downloads\\Million Dollar Web app Ideas\\Date Planner app\\src\\pages\\Dashboard.jsx', 'utf-8');
const lines = code.split('\n');

let openCurl = 0;
let closeCurl = 0;
let openDiv = 0;
let closeDiv = 0;

for (let i = 590; i < 850; i++) {
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

    console.log(`${i+1}: Curl[${openCurl - closeCurl}] Div[${openDiv - closeDiv}] -> ${line.trim()}`);
}
