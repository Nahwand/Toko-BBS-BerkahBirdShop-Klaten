const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

// Replace any remaining `style={{ ...btn("XYZ"), ... }}`
code = code.replace(/style=\{\{\s*\.\.\.btn\((['"]([^'"]*)['"])\)\s*,\s*([^}]+)\}\}/g, (match, fullQuote, val, rest) => {
  const v = val.toLowerCase();
  if (!v) return `className={styles.btndefault} style={{ ${rest} }}`;
  return `className={\`\${styles.btn} \${styles.btn${v}}\`} style={{ ${rest} }}`;
});

// Also check for `...btn()`
code = code.replace(/style=\{\{\s*\.\.\.btn\(\)\s*,\s*([^}]+)\}\}/g, (match, rest) => {
  return `className={styles.btndefault} style={{ ${rest} }}`;
});

code = code.replace(/style=\{btn\((['"]([^'"]*)['"])\)\}/g, (match, fullQuote, val) => {
  const v = val.toLowerCase();
  if (!v) return 'className={styles.btndefault}';
  return `className={\`\${styles.btn} \${styles.btn${v}}\`}`;
});

code = code.replace(/style=\{btn\(\)\}/g, 'className={styles.btndefault}');

fs.writeFileSync('src/App.jsx', code);
console.log('Fixed lingering btn calls');
