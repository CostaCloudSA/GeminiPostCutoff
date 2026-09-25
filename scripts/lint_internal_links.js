const fs = require('fs');
const path = require('path');

const skillsDir = process.env.SKILLS_DIR || path.resolve(__dirname, '..', 'skills');
if (!fs.existsSync(skillsDir)) {
  console.error(`[ERROR] Skills directory not found at: ${skillsDir}`);
  process.exit(1);
}

let totalFilesChecked = 0;
let totalInternalLinksChecked = 0;
let brokenLinks = [];

function checkMarkdownFile(filePath) {
  totalFilesChecked++;
  let content = fs.readFileSync(filePath, 'utf8');
  const dir = path.dirname(filePath);

  // Strip out fenced code blocks and inline code so template examples are not checked as real file paths
  content = content.replace(/```[\s\S]*?```/g, '');
  content = content.replace(/`[^`]+`/g, '');

  // Match markdown links: [text](target) where target does NOT start with http, https, mailto, #
  const linkRegex = /\[([^\]]+)\]\((?!https?:\/\/|mailto:|#)([^)]+)\)/g;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    const rawTarget = match[2];
    // Remove anchor if present
    const cleanTarget = rawTarget.split('#')[0];
    if (!cleanTarget) continue; // Pure anchor link within the same page

    totalInternalLinksChecked++;
    const resolvedPath = path.resolve(dir, cleanTarget);

    if (!fs.existsSync(resolvedPath)) {
      brokenLinks.push({
        sourceFile: filePath,
        linkText: match[1],
        target: rawTarget,
        resolvedPath: resolvedPath
      });
    }
  }
}

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      checkMarkdownFile(fullPath);
    }
  }
}

console.log('Validating internal relative links across all skills...\n');
scanDirectory(skillsDir);

console.log('========================================');
console.log(`Files Checked: ${totalFilesChecked}`);
console.log(`Internal Links Verified: ${totalInternalLinksChecked}`);
console.log(`Broken Internal Links: ${brokenLinks.length}`);
console.log('========================================\n');

if (brokenLinks.length > 0) {
  console.error('❌ Found broken internal links:');
  for (const b of brokenLinks) {
    console.error(`- In ${b.sourceFile}:`);
    console.error(`    Link text: [${b.linkText}]`);
    console.error(`    Target:    ${b.target}`);
    console.error(`    Resolved:  ${b.resolvedPath}\n`);
  }
  process.exit(1);
} else {
  console.log('✓ 100% of internal links resolve to existing files on disk!\n');
}
