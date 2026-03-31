import fs from 'fs';

let content = fs.readFileSync('src/pages/features/Dua.tsx', 'utf8');
const lines = content.split('\n');

lines.splice(58, 1);

fs.writeFileSync('src/pages/features/Dua.tsx', lines.join('\n'));
console.log('Deleted line 59');
