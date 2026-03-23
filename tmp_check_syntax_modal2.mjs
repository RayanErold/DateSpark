import fs from 'fs';

const code = fs.readFileSync('C:\\Users\\Erold Rayan\\Downloads\\Million Dollar Web app Ideas\\Date Planner app\\src\\pages\\Dashboard.jsx', 'utf-8');
const lines = code.split('\n');

let openDiv = 0;
let closeDiv = 0;

for (let i = 835; i < 940; i++) {
    const line = lines[i];
    if (!line) continue;
    
    const divs = line.match(/<div/g);
    if (divs) openDiv += divs.length;
    const closedDivs = line.match(/<\/div>/g);
    if (closedDivs) closeDiv += closedDivs.length;

    console.log(`${i+1}: Div[${openDiv - closeDiv}] -> ${line.trim()}`);
}
