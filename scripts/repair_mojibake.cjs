const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Dashboard.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

const replacements = [
    [/ðŸ’ /g, '💍'],
    [/ðŸ§Š/g, '🧊'],
    [/ðŸ’¸/g, '💸'],
    [/ðŸŒ§ï¸ /g, '🌧️'],
    [/ðŸ”’/g, '🔒'],
    [/â ¤ï¸ /g, '❤️'],
    [/ðŸŽ‰/g, '🎉'],
    [/â Œ/g, '❌'],
    [/â­ /g, '⭐'],
    [/â€”/g, '—'],
    [/ðŸ”¥/g, '🔥'],
    [/â€™/g, '’'],
    [/ðŸ’–/g, '💖'],
    [/ðŸ’¡/g, '💡'],
    [/Â·/g, '·']
];

let updatedCount = 0;
replacements.forEach(([pattern, replacement]) => {
    const originalLength = content.length;
    content = content.replace(pattern, replacement);
    if (content.length !== originalLength) {
        updatedCount++;
    }
});

fs.writeFileSync(filePath, content, 'utf-8');
console.log(`Successfully updated ${updatedCount} mojibake patterns.`);
