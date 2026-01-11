const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'App.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix Title Spans
// Looking for the spans with specific class names
const span1Marker = 'className="font-bold text-xl tracking-tight hidden sm:block">';
const span2Marker = 'className="font-bold text-xl tracking-tight sm:hidden">';

// Regex to match the whole line or span tag content
// We need to be careful not to replace too much.
// We can split by lines and process.
let lines = content.split('\n');
let newLines = lines.map(line => {
    if (line.includes(span1Marker)) {
        return `                <span className="font-bold text-xl tracking-tight hidden sm:block">捷泰環保報價系統</span>`;
    }
    if (line.includes(span2Marker)) {
        return `                <span className="font-bold text-xl tracking-tight sm:hidden">捷泰</span>`;
    }
    // Fix Menu Items
    if (line.includes("id: 'dashboard', label:")) {
        return `                  { id: 'dashboard', label: '報價單', icon: FileText },`;
    }
    if (line.includes("id: 'customers', label:")) {
        return `                  { id: 'customers', label: '客戶管理', icon: Users },`;
    }
    if (line.includes("id: 'products', label:")) {
        return `                  { id: 'products', label: '項目管理', icon: Package },`;
    }
    return line;
});

const newContent = newLines.join('\n');

if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Fixed Navigation text');
} else {
    console.log('No changes made - patterns might not have matched.');
}
