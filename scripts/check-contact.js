/**
 * Fails the build if the retired fax number appears in source files or in the
 * generated production output.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'scripts']);
const EXTENSIONS = ['.html', '.css', '.js', '.json', '.xml', '.svg', '.txt', '.md'];

// Retired fax numbers, in every format they could appear.
const FORBIDDEN = [/\(?573\)?[\s.-]*303[\s.-]*3540/, /\+?1?5733033540/];
const EXPECTED_FAX = '(573) 303-3544';

const offenders = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.htaccess') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(full);
    } else if (EXTENSIONS.includes(path.extname(entry.name)) || entry.name === '.htaccess') {
      const text = fs.readFileSync(full, 'utf8');
      text.split(/\r?\n/).forEach((line, i) => {
        if (FORBIDDEN.some((re) => re.test(line))) {
          offenders.push(`${path.relative(ROOT, full)}:${i + 1}: ${line.trim().slice(0, 160)}`);
        }
      });
    }
  }
}

walk(ROOT);

if (offenders.length) {
  console.error(`Retired fax number found (expected ${EXPECTED_FAX}):`);
  offenders.forEach((o) => console.error('  ' + o));
  process.exit(1);
}

console.log(`Contact check passed. No retired fax numbers found. Current fax: ${EXPECTED_FAX}`);
