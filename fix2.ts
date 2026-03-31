import fs from 'fs';

let content = fs.readFileSync('src/pages/features/Dua.tsx', 'utf8');
const lines = content.split('\n');

let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("৪। সূরা কাফিরুন, সূরা ইখলাস, সূরা ফালাক্ব ও সূরা নাস পড়া',")) {
    startIdx = i + 1;
    break;
  }
}

for (let i = startIdx; i < lines.length; i++) {
  if (lines[i].includes("title: 'দুআ ৩',") && lines[i-1].includes("type: 'dua',") && lines[i-2].includes("{")) {
    endIdx = i - 2;
    break;
  }
}

if (startIdx !== -1 && endIdx !== -1) {
  const replacement = `          '৫। ৩৩ বার সুবহানাল্লাহ, ৩৩ বার আলহামদুলিল্লাহ ও ৩৪ বার আল্লাহু আকবার পড়া'
        ]
      },
      {`;
  
  lines.splice(startIdx, endIdx - startIdx, replacement);
  fs.writeFileSync('src/pages/features/Dua.tsx', lines.join('\n'));
  console.log('Fixed successfully');
} else {
  console.log('Could not find indices', startIdx, endIdx);
}
