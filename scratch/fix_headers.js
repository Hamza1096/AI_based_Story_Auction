const fs = require('fs');

const files = [
  'app/dashboard/page.tsx', 
  'app/dashboard/wallet/page.tsx', 
  'app/dashboard/create-story/page.tsx', 
  'app/stories/page.tsx', 
  'app/stories/[id]/page.tsx'
];

files.forEach(f => {
  if (!fs.existsSync(f)) {
    console.log('Skipping', f);
    return;
  }
  let content = fs.readFileSync(f, 'utf8');
  
  if (!content.includes('import Navbar')) {
     const importStatement = 'import Navbar from "@/components/Navbar";\n';
     // insert after the last import statement
     const lastImportIndex = content.lastIndexOf('import ');
     if (lastImportIndex !== -1) {
       const endOfLastImport = content.indexOf('\n', lastImportIndex);
       content = content.slice(0, endOfLastImport + 1) + importStatement + content.slice(endOfLastImport + 1);
     }
  }
  
  const headerStartRegex = /<header[\s\S]*?<\/header>/;
  content = content.replace(headerStartRegex, '<Navbar />');
  
  fs.writeFileSync(f, content);
  console.log('Replaced header in', f);
});
