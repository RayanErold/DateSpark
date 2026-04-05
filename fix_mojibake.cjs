const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\Erold Rayan\\Downloads\\Million Dollar Web app Ideas\\Date Planner app\\src\\pages\\Dashboard.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replacements map: Corrupted sequence -> Correct character
// We use regex with the corrupted strings found in the file
const replacements = [
    // Vibe icons
    { target: /'anniversary': { label: 'Anniversary', icon: '.*' }/g, replacement: "'anniversary': { label: 'Anniversary', icon: '💍' }" },
    { target: /'icebreaker': { label: 'Icebreaker', icon: '.*' }/g, replacement: "'icebreaker': { label: 'Icebreaker', icon: '🧊' }" },
    { target: /'budget': { label: 'Budget-Friendly', icon: '.*' }/g, replacement: "'budget': { label: 'Budget-Friendly', icon: '💸' }" },
    { target: /'rainy': { label: 'Rainy Day', icon: '.*' }/g, replacement: "'rainy': { label: 'Rainy Day', icon: '🌧️' }" },
    
    // Alerts and other strings
    { target: /alert\('.* Payment Successful!/g, replacement: "alert('🎉 Payment Successful!" },
    { target: /alert\('.* Payment Canceled./g, replacement: "alert('❌ Payment Canceled." },
    
    // Buttons and Star ratings
    { target: /<span>.* \{alt\.rating \|\| 'New'\}/g, replacement: "<span>★ {alt.rating || 'New'}" },
    { target: /\{\/\* .* Like \*\/\}/g, replacement: "{/* 👍 Like */}" },
    { target: /I Tried This Plan .* Leave a Review/g, replacement: "⭐ I Tried This Plan — Leave a Review" }
];

let fixed = content;
const results = [];

// More surgical approach: replace specific lines we know are broken
const lines = fixed.split('\n');

// Line 355-358: Vibe tags
if (lines[354]?.includes('anniversary')) lines[354] = lines[354].replace(/'icon': '.*'/, "'icon': '💍'");
if (lines[355]?.includes('icebreaker'))  lines[355] = lines[355].replace(/'icon': '.*'/, "'icon': '🧊'");
if (lines[356]?.includes('budget'))      lines[356] = lines[356].replace(/'icon': '.*'/, "'icon': '💸'");
if (lines[357]?.includes('rainy'))       lines[357] = lines[357].replace(/'icon': '.*'/, "'icon': '🌧️'");

// Line 777: Payment success
if (lines[776]?.includes('Payment Successful')) lines[776] = lines[776].replace(/alert\('.* Payment Successful/, "alert('🎉 Payment Successful");

// Line 781: Payment canceled
if (lines[780]?.includes('Payment Canceled')) lines[780] = lines[780].replace(/alert\('.* Payment Canceled/, "alert('❌ Payment Canceled");

// Line 2506: Alt rating star
if (lines[2505]?.includes('{alt.rating')) lines[2505] = lines[2505].replace(/â˜…/, "★");

// Line 2604: Like emoji comment
if (lines[2603]?.includes('Like')) lines[2603] = lines[2603].replace(/ðŸ‘ /, "👍");

// Line 2699: "I Tried This Plan" button
if (lines[2698]?.includes('I Tried This Plan')) lines[2698] = lines[2698].replace(/â­  I Tried This Plan â€”/, "⭐ I Tried This Plan —");

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('✅ Mojibake fix script completed!');
