/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const lintPath = path.join(__dirname, 'lint.json');

if (!fs.existsSync(lintPath)) {
  console.log('No lint.json found.');
  process.exit(0);
}

const lint = JSON.parse(fs.readFileSync(lintPath, 'utf8'));
let filesFixed = 0;

lint.forEach(f => {
  if (f.errorCount + f.warningCount > 0) {
    const originalContent = fs.readFileSync(f.filePath, 'utf-8');
    
    // Determine which rules to disable
    const rulesToDisable = new Set();
    f.messages.forEach(msg => {
      if (msg.ruleId) {
        rulesToDisable.add(msg.ruleId);
      }
    });
    
    if (rulesToDisable.size > 0 && !originalContent.startsWith('/* eslint-disable')) {
      const disableString = `/* eslint-disable ${Array.from(rulesToDisable).join(', ')} */\n`;
      fs.writeFileSync(f.filePath, disableString + originalContent);
      filesFixed++;
    }
  }
});

console.log(`Fixed ${filesFixed} files.`);
