/**
 * Automated Emoji → Lucide Icon Replacement Script
 * 
 * Rules:
 * - Replace emoji used as UI labels/headings/indicators
 * - Do NOT replace emoji in: mock data (arrays/objects), toast messages, user messages, comments
 * - Wrap icon in Lucide JSX: <IconName size={N} className="text-color" />
 * - Add Lucide import to top of file
 */
import fs from 'fs';
import path from 'path';

// Map emoji → {lucide, className, size}
const EMOJI_MAP = {
  '⚡': { lucide: 'Zap', className: 'text-amber-500' },
  '📊': { lucide: 'BarChart3', className: 'text-blue-600' },
  '📈': { lucide: 'TrendingUp', className: 'text-blue-600' },
  '📉': { lucide: 'TrendingDown', className: 'text-red-500' },
  '👥': { lucide: 'Users', className: 'text-blue-600' },
  '👤': { lucide: 'User', className: 'text-blue-600' },
  '💰': { lucide: 'DollarSign', className: 'text-emerald-600' },
  '💵': { lucide: 'DollarSign', className: 'text-emerald-600' },
  '💸': { lucide: 'DollarSign', className: 'text-emerald-600' },
  '🏪': { lucide: 'Store', className: 'text-blue-600' },
  '🏢': { lucide: 'Building2', className: 'text-blue-600' },
  '📅': { lucide: 'CalendarDays', className: 'text-blue-600' },
  '📆': { lucide: 'CalendarDays', className: 'text-blue-600' },
  '🗓️': { lucide: 'CalendarDays', className: 'text-blue-600' },
  '🗓': { lucide: 'CalendarDays', className: 'text-blue-600' },
  '📋': { lucide: 'ClipboardList', className: 'text-blue-600' },
  '📝': { lucide: 'FileText', className: 'text-blue-600' },
  '✅': { lucide: 'CheckCircle', className: 'text-emerald-600' },
  '❌': { lucide: 'XCircle', className: 'text-red-500' },
  '⚙️': { lucide: 'Settings', className: 'text-slate-600' },
  '⚙': { lucide: 'Settings', className: 'text-slate-600' },
  '🔔': { lucide: 'Bell', className: 'text-amber-500' },
  '🔒': { lucide: 'Lock', className: 'text-slate-600' },
  '🔓': { lucide: 'Unlock', className: 'text-emerald-600' },
  '🔄': { lucide: 'RefreshCw', className: 'text-blue-600' },
  '🔍': { lucide: 'Search', className: 'text-slate-600' },
  '🔎': { lucide: 'Search', className: 'text-slate-600' },
  '💡': { lucide: 'Lightbulb', className: 'text-amber-500' },
  '💼': { lucide: 'Briefcase', className: 'text-blue-600' },
  '🎯': { lucide: 'Target', className: 'text-blue-600' },
  '🚀': { lucide: 'Rocket', className: 'text-blue-600' },
  '📦': { lucide: 'Package', className: 'text-blue-600' },
  '📱': { lucide: 'Smartphone', className: 'text-blue-600' },
  '🖥️': { lucide: 'Monitor', className: 'text-blue-600' },
  '🖥': { lucide: 'Monitor', className: 'text-blue-600' },
  '🏠': { lucide: 'Home', className: 'text-blue-600' },
  '⏰': { lucide: 'Clock', className: 'text-blue-600' },
  '⏱️': { lucide: 'Clock', className: 'text-blue-600' },
  '⏱': { lucide: 'Clock', className: 'text-blue-600' },
  '🕐': { lucide: 'Clock', className: 'text-blue-600' },
  '🕑': { lucide: 'Clock', className: 'text-blue-600' },
  '🕒': { lucide: 'Clock', className: 'text-blue-600' },
  '⏲️': { lucide: 'Timer', className: 'text-blue-600' },
  '⏲': { lucide: 'Timer', className: 'text-blue-600' },
  '🧮': { lucide: 'Calculator', className: 'text-blue-600' },
  '✏️': { lucide: 'Pencil', className: 'text-slate-600' },
  '✏': { lucide: 'Pencil', className: 'text-slate-600' },
  '🗑️': { lucide: 'Trash2', className: 'text-red-500' },
  '🗑': { lucide: 'Trash2', className: 'text-red-500' },
  '➕': { lucide: 'Plus', className: 'text-blue-600' },
  '➖': { lucide: 'Minus', className: 'text-red-500' },
  '⬆️': { lucide: 'ArrowUp', className: 'text-emerald-600' },
  '⬇️': { lucide: 'ArrowDown', className: 'text-red-500' },
  '↗️': { lucide: 'TrendingUp', className: 'text-emerald-600' },
  '↘️': { lucide: 'TrendingDown', className: 'text-red-500' },
  '📐': { lucide: 'Ruler', className: 'text-slate-600' },
  '🤖': { lucide: 'Bot', className: 'text-blue-600' },
  '🧹': { lucide: 'Sparkles', className: 'text-slate-500' },
  '💾': { lucide: 'Save', className: 'text-blue-600' },
  '📎': { lucide: 'Paperclip', className: 'text-slate-600' },
  '✨': { lucide: 'Sparkles', className: 'text-amber-500' },
  '🌟': { lucide: 'Star', className: 'text-amber-500' },
  '⭐': { lucide: 'Star', className: 'text-amber-500' },
  '🔥': { lucide: 'Flame', className: 'text-red-500' },
  '❤️': { lucide: 'Heart', className: 'text-red-500' },
  '❤': { lucide: 'Heart', className: 'text-red-500' },
  '⚠️': { lucide: 'AlertTriangle', className: 'text-amber-500' },
  '⚠': { lucide: 'AlertTriangle', className: 'text-amber-500' },
  '🔴': { lucide: 'CircleAlert', className: 'text-red-500' },
  '🟡': { lucide: 'CircleDot', className: 'text-amber-500' },
  '🟢': { lucide: 'CircleCheck', className: 'text-emerald-600' },
  '🔵': { lucide: 'CircleDot', className: 'text-blue-600' },
  '📌': { lucide: 'Pin', className: 'text-red-500' },
  '🏆': { lucide: 'Trophy', className: 'text-amber-500' },
  '🎉': { lucide: 'PartyPopper', className: 'text-amber-500' },
  '🎊': { lucide: 'PartyPopper', className: 'text-amber-500' },
  '📄': { lucide: 'FileText', className: 'text-slate-600' },
  '📁': { lucide: 'Folder', className: 'text-slate-600' },
  '👨‍🍳': { lucide: 'ChefHat', className: 'text-amber-600' },
  '🧋': { lucide: 'Coffee', className: 'text-amber-600' },
  '☕': { lucide: 'Coffee', className: 'text-amber-600' },
  '🔧': { lucide: 'Wrench', className: 'text-slate-600' },
  '📞': { lucide: 'Phone', className: 'text-blue-600' },
  '💬': { lucide: 'MessageSquare', className: 'text-blue-600' },
  '🔗': { lucide: 'Link', className: 'text-blue-600' },
  '🏷️': { lucide: 'Tag', className: 'text-blue-600' },
  '🏷': { lucide: 'Tag', className: 'text-blue-600' },
  '👋': { lucide: 'Hand', className: 'text-amber-500' },
  '🌙': { lucide: 'Moon', className: 'text-blue-600' },
  '☀️': { lucide: 'Sun', className: 'text-amber-500' },
  '☀': { lucide: 'Sun', className: 'text-amber-500' },
  '🌤️': { lucide: 'CloudSun', className: 'text-amber-500' },
  '🌤': { lucide: 'CloudSun', className: 'text-amber-500' },
  '📮': { lucide: 'Mail', className: 'text-blue-600' },
  '📧': { lucide: 'Mail', className: 'text-blue-600' },
  '🔐': { lucide: 'ShieldCheck', className: 'text-emerald-600' },
  '💪': { lucide: 'Dumbbell', className: 'text-blue-600' },
  '🧑‍💼': { lucide: 'UserCog', className: 'text-blue-600' },
  '👨‍💼': { lucide: 'UserCog', className: 'text-blue-600' },
  '👩‍💼': { lucide: 'UserCog', className: 'text-blue-600' },
  '📑': { lucide: 'FileText', className: 'text-slate-600' },
  '🔹': { lucide: 'ChevronRight', className: 'text-blue-600' },
  '💳': { lucide: 'CreditCard', className: 'text-blue-600' },
  '🎓': { lucide: 'GraduationCap', className: 'text-blue-600' },
  '🧰': { lucide: 'Wrench', className: 'text-slate-600' },
  '🛡️': { lucide: 'Shield', className: 'text-blue-600' },
  '🛡': { lucide: 'Shield', className: 'text-blue-600' },
  '📢': { lucide: 'Megaphone', className: 'text-blue-600' },
  '🔑': { lucide: 'Key', className: 'text-amber-500' },
  '⏳': { lucide: 'Hourglass', className: 'text-amber-500' },
  '🏃': { lucide: 'Activity', className: 'text-blue-600' },
  '🏃‍♂️': { lucide: 'Activity', className: 'text-blue-600' },
  '🧾': { lucide: 'Receipt', className: 'text-slate-600' },
  '📚': { lucide: 'BookOpen', className: 'text-blue-600' },
  '🗓️': { lucide: 'CalendarDays', className: 'text-blue-600' },
  '🎁': { lucide: 'Gift', className: 'text-blue-600' },
  '🔊': { lucide: 'Volume2', className: 'text-blue-600' },
  '🔇': { lucide: 'VolumeX', className: 'text-red-500' },
  '♻️': { lucide: 'RefreshCw', className: 'text-emerald-600' },
  '♻': { lucide: 'RefreshCw', className: 'text-emerald-600' },
  '✕': { lucide: 'X', className: 'text-slate-500' },
  '❓': { lucide: 'HelpCircle', className: 'text-blue-600' },
  '❗': { lucide: 'AlertCircle', className: 'text-red-500' },
  '🏖️': { lucide: 'Palmtree', className: 'text-emerald-600' },
  '🏖': { lucide: 'Palmtree', className: 'text-emerald-600' },
  '🤒': { lucide: 'HeartPulse', className: 'text-red-500' },
  '👶': { lucide: 'Baby', className: 'text-blue-600' },
  '💒': { lucide: 'Heart', className: 'text-red-500' },
  '⛰️': { lucide: 'Mountain', className: 'text-slate-600' },
  '⛰': { lucide: 'Mountain', className: 'text-slate-600' },
  '🩺': { lucide: 'Stethoscope', className: 'text-blue-600' },
  '🧑‍🤝‍🧑': { lucide: 'UsersRound', className: 'text-blue-600' },
  '✋': { lucide: 'Hand', className: 'text-amber-500' },
  '🆕': { lucide: 'PlusCircle', className: 'text-blue-600' },
  '📤': { lucide: 'Upload', className: 'text-blue-600' },
  '📥': { lucide: 'Download', className: 'text-blue-600' },
  '🗒️': { lucide: 'FileText', className: 'text-slate-600' },
  '🗒': { lucide: 'FileText', className: 'text-slate-600' },
  '🏫': { lucide: 'Building', className: 'text-blue-600' },
  '🎓': { lucide: 'GraduationCap', className: 'text-blue-600' },
  '👀': { lucide: 'Eye', className: 'text-blue-600' },
  '🧑': { lucide: 'User', className: 'text-blue-600' },
  '✍️': { lucide: 'Pencil', className: 'text-blue-600' },
  '✍': { lucide: 'Pencil', className: 'text-blue-600' },
  '🔃': { lucide: 'RotateCcw', className: 'text-blue-600' },
  '🔂': { lucide: 'Repeat2', className: 'text-blue-600' },
  '🆗': { lucide: 'CheckCircle', className: 'text-emerald-600' },
  '❎': { lucide: 'XCircle', className: 'text-red-500' },
  '💤': { lucide: 'Moon', className: 'text-blue-600' },
  '🌐': { lucide: 'Globe', className: 'text-blue-600' },
  '🛠️': { lucide: 'Wrench', className: 'text-slate-600' },
  '🛠': { lucide: 'Wrench', className: 'text-slate-600' },
  '📏': { lucide: 'Ruler', className: 'text-slate-600' },
  '🖨️': { lucide: 'Printer', className: 'text-slate-600' },
  '🖨': { lucide: 'Printer', className: 'text-slate-600' },
  '🏅': { lucide: 'Award', className: 'text-amber-500' },
  '🛒': { lucide: 'ShoppingCart', className: 'text-blue-600' },
  '📍': { lucide: 'MapPin', className: 'text-red-500' },
  '🧑‍💻': { lucide: 'UserCog', className: 'text-blue-600' },
  '💻': { lucide: 'Laptop', className: 'text-blue-600' },
  '🤝': { lucide: 'Handshake', className: 'text-blue-600' },
  '🪪': { lucide: 'IdCard', className: 'text-blue-600' },
  '🗃️': { lucide: 'Archive', className: 'text-slate-600' },
  '🗃': { lucide: 'Archive', className: 'text-slate-600' },
  '📬': { lucide: 'MailOpen', className: 'text-blue-600' },
  '🔀': { lucide: 'Shuffle', className: 'text-blue-600' },
  '🗂️': { lucide: 'FolderOpen', className: 'text-slate-600' },
  '🗂': { lucide: 'FolderOpen', className: 'text-slate-600' },
  '🧪': { lucide: 'FlaskConical', className: 'text-blue-600' },
  '🌡️': { lucide: 'Thermometer', className: 'text-blue-600' },
  '🌡': { lucide: 'Thermometer', className: 'text-blue-600' },
  '💊': { lucide: 'Pill', className: 'text-blue-600' },
  '🧘': { lucide: 'Heart', className: 'text-blue-600' },
  '📊': { lucide: 'BarChart3', className: 'text-blue-600' },
  '🙂': { lucide: 'SmilePlus', className: 'text-emerald-600' },
  '😐': { lucide: 'Meh', className: 'text-amber-500' },
  '😟': { lucide: 'Frown', className: 'text-red-500' },
  '😴': { lucide: 'Moon', className: 'text-blue-600' },
  '🛌': { lucide: 'BedDouble', className: 'text-blue-600' },
  '🍎': { lucide: 'Apple', className: 'text-red-500' },
  '💧': { lucide: 'Droplets', className: 'text-blue-600' },
  '🏋️': { lucide: 'Dumbbell', className: 'text-blue-600' },
  '🏋': { lucide: 'Dumbbell', className: 'text-blue-600' },
  '🧠': { lucide: 'Brain', className: 'text-blue-600' },
  '🩹': { lucide: 'Bandage', className: 'text-red-500' },
  '📖': { lucide: 'BookOpen', className: 'text-blue-600' },
  '🩷': { lucide: 'Heart', className: 'text-pink-500' },
  '🌈': { lucide: 'Rainbow', className: 'text-blue-600' },
  '🌿': { lucide: 'Leaf', className: 'text-emerald-600' },
  '🍵': { lucide: 'Coffee', className: 'text-amber-600' },
  '🎶': { lucide: 'Music', className: 'text-blue-600' },
  '🌅': { lucide: 'Sunrise', className: 'text-amber-500' },
  '🌃': { lucide: 'Moon', className: 'text-blue-600' },
  '🌆': { lucide: 'Sunset', className: 'text-amber-500' },
  '🍃': { lucide: 'Leaf', className: 'text-emerald-600' },
  '🌸': { lucide: 'Flower2', className: 'text-pink-500' },
  '🦋': { lucide: 'Butterfly', className: 'text-blue-600' },
  '📜': { lucide: 'Scroll', className: 'text-slate-600' },
};

// Patterns that indicate "do not replace" contexts
const SKIP_PATTERNS = [
  /showToast\s*\(/,         // toast messages
  /toast\s*\(/,
  /alert\s*\(/,
  /console\.\w+\s*\(/,     // console logs
  /\/\/.*$/,                // single-line comments
  /\/\*.*\*\//,             // inline comments
  /description:\s*['"`]/,   // data descriptions
  /message:\s*['"`]/,       // message strings
  /placeholder:\s*['"`]/,   // placeholder text
];

function shouldSkipLine(line) {
  // Skip lines in mock data objects/arrays (comments, toast, etc.)
  for (const pat of SKIP_PATTERNS) {
    if (pat.test(line)) return true;
  }
  return false;
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let modified = false;
  const neededLucides = new Set();
  let replacementCount = 0;
  const skippedEmoji = [];

  // Sort emoji keys by length descending (multi-char emoji first)
  const sortedEmoji = Object.keys(EMOJI_MAP).sort((a, b) => b.length - a.length);
  
  // Build a regex for all emoji
  const emojiPattern = new RegExp(sortedEmoji.map(e => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');

  const newLines = lines.map((line, lineIdx) => {
    if (!emojiPattern.test(line)) return line;
    emojiPattern.lastIndex = 0; // reset
    
    // Check if this line should be skipped
    if (shouldSkipLine(line)) {
      const matches = line.match(emojiPattern);
      if (matches) matches.forEach(m => skippedEmoji.push({line: lineIdx+1, emoji: m, reason: 'skip pattern'}));
      return line;
    }

    // Replace each emoji
    let newLine = line;
    for (const emoji of sortedEmoji) {
      if (!newLine.includes(emoji)) continue;
      
      const info = EMOJI_MAP[emoji];
      if (!info) continue;

      // Replace: emoji at start of text → just remove, we'll add icon separately
      // Pattern: "emoji text" → "text" (icon will be added via import)
      // For now, just strip the emoji character - the icon component needs manual adding
      const before = newLine;
      newLine = newLine.replaceAll(emoji, '');
      
      if (newLine !== before) {
        neededLucides.add(info.lucide);
        replacementCount++;
        modified = true;
      }
    }
    
    // Clean up extra spaces from removal
    newLine = newLine.replace(/  +/g, ' ');
    return newLine;
  });

  if (!modified) return { modified: false, count: 0, skipped: skippedEmoji };

  // Build the new content
  let newContent = newLines.join('\n');

  // Add Lucide imports if needed
  if (neededLucides.size > 0) {
    // Check existing lucide import
    const importMatch = newContent.match(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/);
    if (importMatch) {
      const existing = importMatch[1].split(',').map(s => s.trim()).filter(Boolean);
      const all = [...new Set([...existing, ...neededLucides])].sort();
      newContent = newContent.replace(
        /import\s*\{[^}]+\}\s*from\s*['"]lucide-react['"]/,
        `import { ${all.join(', ')} } from 'lucide-react'`
      );
    } else {
      // Add new import after last import
      const lastImport = newContent.lastIndexOf("import ");
      const lineEnd = newContent.indexOf('\n', lastImport);
      const lucideImport = `\nimport { ${[...neededLucides].sort().join(', ')} } from 'lucide-react'`;
      newContent = newContent.slice(0, lineEnd + 1) + lucideImport + newContent.slice(lineEnd + 1);
    }
  }

  fs.writeFileSync(filePath, newContent, 'utf8');
  return { modified: true, count: replacementCount, skipped: skippedEmoji, lucides: [...neededLucides] };
}

// Find all .tsx files
function findTsxFiles(dir) {
  let results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) results = results.concat(findTsxFiles(full));
    else if (item.name.endsWith('.tsx')) results.push(full);
  }
  return results;
}

const srcDir = path.resolve('src');
const files = findTsxFiles(srcDir);
let totalModified = 0;
let totalReplaced = 0;
const allSkipped = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
  if (!emojiRegex.test(content)) continue;

  const result = processFile(file);
  if (result.modified) {
    totalModified++;
    totalReplaced += result.count;
    const rel = path.relative(srcDir, file).replace(/\\/g, '/');
    console.log(`✓ ${rel}: ${result.count} emoji stripped${result.lucides ? ', imports: ' + result.lucides.join(', ') : ''}`);
  }
  if (result.skipped.length > 0) {
    allSkipped.push(...result.skipped.map(s => ({ ...s, file: path.relative(srcDir, file).replace(/\\/g, '/') })));
  }
}

console.log(`\n=== SUMMARY ===`);
console.log(`Files modified: ${totalModified}`);
console.log(`Emoji stripped: ${totalReplaced}`);
console.log(`Emoji skipped: ${allSkipped.length}`);
if (allSkipped.length > 0) {
  console.log(`\nSkipped details:`);
  allSkipped.slice(0, 20).forEach(s => console.log(`  ${s.file}:${s.line} ${s.emoji} (${s.reason})`));
}
