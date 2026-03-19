const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

// 2. Replace style={S.xyz} -> className={styles.xyz}
code = code.replace(/style=\{S\.([a-zA-Z0-9_]+)\}/g, 'className={styles.$1}');

// 3. Replace style={{ ...S.xyz, prop: val }} -> className={styles.xyz} style={{ prop: val }}
code = code.replace(/style=\{\{\s*\.\.\.S\.([a-zA-Z0-9_]+)\s*,\s*([^}]+)\}\}/g, 'className={styles.$1} style={{ $2 }}');

// 5. stChip() to className
code = code.replace(/style=\{stChip\(([^)]+)\)\}/g, (match, p1) => {
  return `className={\`\${styles.stChip} \${styles['stChip' + ${p1}]}\`}`;
});

fs.writeFileSync('src/App.jsx', code);
console.log('Fixed S and stChip replacements in App.jsx directly');
