import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const handoffPath = path.join(repoRoot, 'docs', 'TO_CODE.md');

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function getSection(content, heading) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`## ${escapedHeading}\\s*\\r?\\n([\\s\\S]*?)(?:\\r?\\n---\\r?\\n|\\r?\\n## |$)`, 'i');
  return content.match(regex)?.[1]?.trim() ?? '';
}

function getInlineCodes(sectionText) {
  return [...sectionText.matchAll(/`([^`]+)`/g)]
    .map(match => match[1].trim())
    .filter(Boolean);
}

function getBullets(sectionText, limit = 5) {
  return sectionText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.startsWith('- '))
    .map(line => line.slice(2).trim())
    .slice(0, limit);
}

const content = readFile(handoffPath);
const taskName = content.match(/## Ten task\s*[\r\n]+`([^`]+)`/i)?.[1]?.trim() ?? 'UNKNOWN_TASK';
const status = content.match(/## STATUS\s*[\r\n]+`([^`]+)`/i)?.[1]?.trim() ?? 'UNKNOWN';
const owner = content.match(/## OWNER\s*[\r\n]+`([^`]+)`/i)?.[1]?.trim() ?? 'UNKNOWN';

const title = getSection(content, 'Tieu de task').split(/\r?\n/).find(Boolean) ?? '';
const goals = getBullets(getSection(content, 'Muc tieu'), 4);
const allowedScope = getInlineCodes(getSection(content, 'Pham vi duoc sua'))
  .filter(value => value.includes('/') || value.includes('\\') || value.startsWith('docs/'))
  .slice(0, 12);
const outOfScope = getBullets(getSection(content, 'Ngoai scope / khong duoc lam'), 6);

console.log('=== AI READY CONTEXT ===');
console.log(`Task: ${taskName}`);
console.log(`Status: ${status}`);
console.log(`Owner: ${owner}`);
if (title) console.log(`Title: ${title}`);

if (goals.length > 0) {
  console.log('\nMain goals:');
  goals.forEach(goal => console.log(`- ${goal}`));
}

if (allowedScope.length > 0) {
  console.log('\nAllowed scope:');
  allowedScope.forEach(file => console.log(`- ${file}`));
}

if (outOfScope.length > 0) {
  console.log('\nOut of scope:');
  outOfScope.forEach(item => console.log(`- ${item}`));
}

console.log('\nOperating mode:');
console.log('- Read only docs/TO_CODE.md first');
console.log('- Stay inside allowed scope');
console.log('- Verify only changed files or the smallest related slice');
console.log('- Stop and report blocker if task needs wider scope');
