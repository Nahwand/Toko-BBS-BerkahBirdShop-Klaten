const fs = require('fs');
const path = require('path');
const oldHtml = fs.readFileSync('old_index.html', 'utf8');
const tempHtml = fs.readFileSync('temp.html', 'utf8');

const emojiRegex = /[\u{2000}-\u{2BFF}\u{1F300}-\u{1FAFF}]/gu;
const dict = {};

// 1. Programmatic mapping built by comparing the pristine file and corrupted file
const emojis = [...new Set(oldHtml.match(emojiRegex) || [])];
for (const emoji of emojis) {
  const index = oldHtml.indexOf('"' + emoji);
  if (index > -1) {
    const context = oldHtml.substring(index - 10, index + 10);
    const parts = context.split(emoji);
    if (parts.length === 2) {
      const tempIndex = tempHtml.indexOf(parts[0]);
      if (tempIndex > -1) {
        const matchEnd = tempHtml.indexOf(parts[1], tempIndex + parts[0].length);
        if (matchEnd > -1) {
          const corrupted = tempHtml.substring(tempIndex + parts[0].length, matchEnd);
          if (corrupted && corrupted !== emoji) {
             dict[corrupted] = emoji;
          }
        }
      }
    }
  }
}

// 2. Add manual mapping hardcoded fallbacks just in case the context split missed any
const manualDict = {
  'âšž': '💻', 'ðŸ’°': '🛒', 'ðŸ“¦': '📦', 'ðŸ“‹': '📋',
  'ðŸ“Š': '📊', 'ðŸ“ˆ': '📈', 'ðŸ—‚ï¸\x8F': '🗂️', 'ðŸ‘¥': '👥',
  'ðŸ“—': '📗', 'ðŸŒ¿': '🌿', 'ðŸŸ¢': '🟢', 'ðŸ‘‘': '👑',
  'ðŸ›¡ï¸\x8F': '🛡️', 'ðŸ‘¤': '👤', 'âš ': '⚠', 'ðŸšª': '🚪',
  'â˜°': '☰', 'ðŸ”„': '🔄', 'ðŸ“\x9D': '📝', 'ðŸ”\x8D': '🔍',
  'ðŸ—‘': '🗑', 'âœ•': '✕', 'ðŸ“¥': '📥', 'ðŸ\x8F†': '🏆',
  'ðŸ“ž': '📞', 'âœ‰ï¸\x8F': '✉️', 'ðŸ“\x8D': '📍', 'ðŸ’¬': '💬',
  'âœ\x8Fï¸\x8F': '✏️', 'ðŸ“¤': '📤', 'ðŸ“‚': '📂', 'ðŸ“„': '📄',
  'â¬‡': '⬇', 'âž•': '➕', 'ðŸ’¾': '💾', 'ðŸ\x8F·ï¸\x8F': '🏷️',
  'âš–ï¸\x8F': '⚖️', 'â€”': '—', 'âœ…': '✅', 'â\x9DŒ': '❌', 'â€\x9D': '”', 'â€œ': '“',
  'âˆ’': '−'
};
Object.assign(dict, manualDict);

console.log('Final mapping dictionary size:', Object.keys(dict).length);

let totalChanged = 0;
// 3. Apply the replacement recursively across all src files
function fixDir(dir) {
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      for (const [bad, good] of Object.entries(dict)) {
        if (content.includes(bad)) {
          content = content.split(bad).join(good);
          changed = true;
        }
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Fixed encodings in:', fullPath);
        totalChanged++;
      }
    }
  }
}

fixDir('src');
console.log('Fixed exactly', totalChanged, 'files.');
