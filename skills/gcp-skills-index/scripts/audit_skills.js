const fs = require('fs');
const path = require('path');

const baseDir = path.join('C:', 'Users', 'campabadal', '.gemini', 'config', 'skills');
const skills = fs.readdirSync(baseDir).filter(f => fs.statSync(path.join(baseDir, f)).isDirectory());

console.log(`Auditing ${skills.length} skills in ${baseDir}...\n`);

let totalErrors = 0;
let totalLinksAudited = 0;

for (const skill of skills) {
  const skillPath = path.join(baseDir, skill);
  const skillMdPath = path.join(skillPath, 'SKILL.md');
  const articlesMdPath = path.join(skillPath, 'references', 'articles.md');

  // 1. Check SKILL.md
  if (!fs.existsSync(skillMdPath)) {
    console.error(`[ERROR] Missing SKILL.md in ${skill}`);
    totalErrors++;
  } else {
    const content = fs.readFileSync(skillMdPath, 'utf8');
    if (!content.startsWith('---') || !content.includes('name:') || !content.includes('description:')) {
      console.error(`[ERROR] Invalid YAML frontmatter in ${skill}/SKILL.md`);
      totalErrors++;
    }
  }

  // 2. Check references/articles.md (except for index if skipped)
  if (skill !== 'gcp-skills-index') {
    if (!fs.existsSync(articlesMdPath)) {
      console.error(`[ERROR] Missing references/articles.md in ${skill}`);
      totalErrors++;
    } else {
      const articlesContent = fs.readFileSync(articlesMdPath, 'utf8');
      const lines = articlesContent.split('\n');
      let currentYearSection = null;
      let lastDateKey = 999999;
      let linkCountInSkill = 0;

      for (const line of lines) {
        if (line.startsWith('### 🌟 2026')) {
          currentYearSection = 2026;
          lastDateKey = 202612;
        } else if (line.startsWith('### 📅 2025')) {
          currentYearSection = 2025;
          lastDateKey = 202512;
        } else if (line.startsWith('### 🏛️ 2024')) {
          currentYearSection = 2024;
          lastDateKey = 202412;
        } else if (line.startsWith('### 🛠️') || line.startsWith('### 🐙') || line.startsWith('### 📖')) {
          currentYearSection = null;
        } else if (line.startsWith('- [')) {
          linkCountInSkill++;
          totalLinksAudited++;
          
          // Verify markdown link format
          if (!line.includes('](') || !line.endsWith(')')) {
            console.error(`[ERROR] Malformed markdown link in ${skill}: ${line}`);
            totalErrors++;
          }

          // Check date order if in dated section
          if (currentYearSection) {
            const match = line.match(/\[(\d{2})\.(\d{2})/);
            if (match) {
              const month = parseInt(match[1], 10);
              const year = parseInt(match[2], 10);
              const dateKey = (2000 + year) * 100 + month;
              if (dateKey > lastDateKey) {
                console.error(`[ORDER ERROR] in ${skill}: Date ${match[0]} (key ${dateKey}) is listed AFTER older/smaller key ${lastDateKey}`);
                totalErrors++;
              }
              lastDateKey = dateKey;
            }
          }
        }
      }
      console.log(`✓ ${skill}: OK (${linkCountInSkill} links verified)`);
    }
  }
}

console.log(`\n========================================`);
console.log(`Audit Complete! Total Links: ${totalLinksAudited}, Total Errors: ${totalErrors}`);
console.log(`========================================`);
