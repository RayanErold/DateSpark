import fs from 'fs';

const code = fs.readFileSync('C:\\Users\\Erold Rayan\\Downloads\\Million Dollar Web app Ideas\\Date Planner app\\src\\pages\\Dashboard.jsx', 'utf-8');
const selfClosing = code.match(/<div [^>]*\/>/g) || [];
const closedBySlash = code.match(/<div[^>]*\/>/g) || [];

console.log("Self closing divs count:", selfClosing.length);
console.log("Details:", selfClosing);
fs.writeFileSync('C:\\Users\\Erold Rayan\\Downloads\\Million Dollar Web app Ideas\\Date Planner app\\self_closing_count.txt', `Count: ${selfClosing.length}\n${JSON.stringify(selfClosing, null, 2)}`);
