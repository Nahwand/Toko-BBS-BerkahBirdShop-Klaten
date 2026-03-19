const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

if (!code.includes('import styles from')) {
  code = code.replace(
    /import \{ sb \} from '\.\/config\/supabase';/,
    "import { sb } from './config/supabase';\nimport styles from './styles/App.module.css';"
  );
}

code = code.replace(/style=\{S\.([a-zA-Z0-9_]+)\}/g, 'className={styles.$1}');

code = code.replace(/style=\{\{\s*\.\.\.S\.([a-zA-Z0-9_]+)\s*,\s*([^}]+)\}\}/g, 'className={styles.$1} style={{ $2 }}');

code = code.replace(/style=\{btn\(([^,)]+)\)\}/g, (match, p1) => {
  const v = p1.replace(/['"]/g, '').toLowerCase();
  if (!v) return 'className={styles.btndefault}';
  return `className={\`\${styles.btn} \${styles.btn${v}}\`}`;
});

code = code.replace(/style=\{\{\s*\.\.\.btn\(([^,)]+)\)\s*,\s*([^}]+)\}\}/g, (match, p1, p2) => {
  const v = p1.replace(/['"]/g, '').toLowerCase();
  if (!v) return `className={styles.btndefault} style={{ ${p2} }}`;
  return `className={\`\${styles.btn} \${styles.btn${v}}\`} style={{ ${p2} }}`;
});

code = code.replace(/style=\{stChip\(([^)]+)\)\}/g, (match, p1) => {
  return `className={\`\${styles.stChip} \${styles['stChip' + ${p1}]}\`}`;
});

fs.writeFileSync('src/App.jsx.new', code);
console.log('Done');
