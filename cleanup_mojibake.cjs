const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.jsx');
const content = fs.readFileSync(appPath, 'utf8');
const lines = content.split('\n');

const cleanedLines = [];
let removedCount = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const isGarbageLine = (
        // Corrupted subject line (has both ?? and 憭芰憓)
        (line.includes('subject:') && line.includes('憭芰憓')) ||
        // Corrupted throw line (has 撖仃)
        (line.includes('throw new Error') && line.includes('撖仃')) ||
        // Corrupted console.error line (has 撖仃)
        (line.includes("console.error('撖仃"))
    );

    if (isGarbageLine) {
        console.log(`Removing line ${i + 1}: ${line.substring(0, 60)}...`);
        removedCount++;
        continue;
    }

    cleanedLines.push(line);
}

fs.writeFileSync(appPath, cleanedLines.join('\n'), 'utf8');
console.log(`\nRemoved ${removedCount} garbage lines.`);
console.log(`File now has ${cleanedLines.length} lines.`);
