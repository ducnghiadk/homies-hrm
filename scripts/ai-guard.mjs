import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const handoffPath = path.join(repoRoot, 'docs', 'TO_CODE.md');

function fail(message) {
  console.error(`AI guard failed: ${message}`);
  process.exit(1);
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    fail(`cannot read ${path.relative(repoRoot, filePath)} (${error.message})`);
  }
}

function assertVietnameseUiCopyGuard() {
  const scopedUiFiles = [
    path.join(repoRoot, 'src', 'app', 'employees', 'page.tsx'),
    path.join(repoRoot, 'src', 'app', 'employees', '[id]', 'page.tsx'),
    path.join(repoRoot, 'src', 'app', 'employees', 'contracts', 'page.tsx'),
    path.join(repoRoot, 'src', 'app', 'employees', 'contracts', '[id]', 'page.tsx'),
    path.join(repoRoot, 'src', 'app', 'employees', 'invitations', 'page.tsx'),
    path.join(repoRoot, 'src', 'app', 'employees', 'invitations', '_components', 'invitations-copy.ts'),
    path.join(repoRoot, 'src', 'app', 'employees', 'invitations', '_components', 'InvitationsTable.tsx'),
    path.join(repoRoot, 'src', 'app', 'employees', 'invitations', '_components', 'InvitationsToolbar.tsx'),
    path.join(repoRoot, 'src', 'app', 'employees', 'invitations', '_components', 'InvitationDetailModal.tsx'),
    path.join(repoRoot, 'src', 'app', 'employees', 'offboarding', 'page.tsx'),
    path.join(repoRoot, 'src', 'lib', 'navigation', 'sidebar-config.ts'),
  ];

  const mojibakePattern = /Ã|Â|Ä|á»|Æ|�/;
  const asciiFallbackPhrases = [
    'Nhan su',
    'Hop dong',
    'Khong tim thay',
    'Dang tai',
    'Tat ca',
    'Loai hop dong',
    'Ngay hieu luc',
    'Thu vien hop dong',
    'Tao va gui',
    'Ho so',
    'Ghi chu',
    'So dien thoai',
    'Chi nhanh',
    'Lien he khan cap',
    'Chon tat ca',
    'Bo chon',
  ];

  const errors = [];

  for (const filePath of scopedUiFiles) {
    if (!fs.existsSync(filePath)) continue;
    const text = readFile(filePath);
    if (mojibakePattern.test(text)) {
      errors.push(`${path.relative(repoRoot, filePath)} contains mojibake-like text`);
      continue;
    }

    for (const phrase of asciiFallbackPhrases) {
      const pattern = new RegExp(`['"\`]([^'"\\\`]*\\b${phrase}\\b[^'"\\\`]*)['"\`]`);
      if (pattern.test(text)) {
        errors.push(`${path.relative(repoRoot, filePath)} contains ASCII fallback phrase "${phrase}"`);
        break;
      }
    }
  }

  if (errors.length > 0) {
    fail(errors.join(' | '));
  }
}

function extractInlineCodeBlock(sectionText) {
  const matches = [...sectionText.matchAll(/`([^`]+)`/g)].map(match => match[1].trim());
  return matches.filter(Boolean);
}

function getSection(content, heading) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`## ${escapedHeading}\\s*\\r?\\n([\\s\\S]*?)(?:\\r?\\n---\\r?\\n|\\r?\\n## |$)`, 'i');
  return content.match(regex)?.[1]?.trim() ?? '';
}

function getFirstSection(content, headings) {
  for (const heading of headings) {
    const section = getSection(content, heading);
    if (section) return section;
  }
  return '';
}

const content = readFile(handoffPath);

const status = content.match(/## STATUS\s*[\r\n]+`([^`]+)`/i)?.[1]?.trim();
if (!status) fail('missing STATUS');
if (!['APPROVED', 'REVIEWING'].includes(status)) {
  fail(`STATUS must be APPROVED or REVIEWING, received ${status}`);
}

const taskName = (
  content.match(/## Ten task\s*[\r\n]+`([^`]+)`/i)?.[1]?.trim()
  || content.match(/## TASK\s*[\r\n]+`([^`]+)`/i)?.[1]?.trim()
);
if (!taskName) fail('missing task name');

const title = getFirstSection(content, ['Tieu de task', 'CURRENT ASK']);
if (!title) fail('missing task title');

const goal = getFirstSection(content, ['Muc tieu', 'GOAL']);
if (!goal) fail('missing main goal section');

const allowedFilesSection = getFirstSection(content, ['Pham vi duoc sua', 'IN SCOPE']);
if (!allowedFilesSection) fail('missing allowed scope section');

const allowedFiles = extractInlineCodeBlock(allowedFilesSection).filter(value =>
  value.includes('/') || value.includes('\\') || value.startsWith('docs/')
);

if (allowedFiles.length === 0) {
  fail('no allowed files found in scope section');
}

if (allowedFiles.length > 12) {
  fail(`allowed scope too wide (${allowedFiles.length} paths). Split task smaller.`);
}

const outOfScopeSection = getFirstSection(content, ['Ngoai scope / khong duoc lam', 'OUT OF SCOPE']);
if (!outOfScopeSection) fail('missing out-of-scope section');

const doneSignals = [
  'Definition of Done',
  'Dinh nghia hoan thanh',
  'Tieu chi hoan thanh',
  'Cach test',
  'DONE WHEN',
  'VERIFY',
];

const hasDoneSignal = doneSignals.some(signal => content.toLowerCase().includes(signal.toLowerCase()));
if (!hasDoneSignal) {
  fail('missing completion or test criteria');
}

assertVietnameseUiCopyGuard();

console.log(`AI guard passed for ${taskName}`);
console.log(`Title: ${title.split('\n')[0].trim()}`);
console.log(`Allowed paths: ${allowedFiles.length}`);
