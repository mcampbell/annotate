// Mutation check: apply each entry in test/mutations.js, run its test, expect a failure, restore the file.
// Usage: node scripts/mutate.js [filter]   filter = substring of `file` or `from`; runs only matching entries.
// Exit 0: every mutation killed. Exit 1: a mutation survived or an entry is invalid. Exit 130: interrupted.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const filter = process.argv[2] ?? '';
const mutations = require('../test/mutations.js').filter((m) => m.file.includes(filter) || m.from.includes(filter));
const sh = (cmd) => spawnSync(cmd, { cwd: root, shell: true, stdio: 'ignore' });
const command = (test) => (test === 'unit' ? 'npm test' : `node build.js && node --test --test-timeout=60000 ${test}`);

// Ctrl-C reaches the child test run; the parent stays alive to restore the file, then stops.
process.on('SIGINT', () => {});

let ran = 0;
let survived = 0;
for (const m of mutations) {
  const file = path.join(root, m.file);
  const orig = fs.readFileSync(file, 'utf8');
  const hits = orig.split(m.from).length - 1;
  if (hits !== 1) {
    console.error(`INVALID ${m.file}: \`from\` occurs ${hits} times, expected 1: ${m.from}`);
    process.exitCode = 1;
    continue;
  }
  let r;
  try {
    fs.writeFileSync(file, orig.replace(m.from, () => m.to)); // function form: `to` may hold `$&`-style text
    r = sh(command(m.test));
  } finally {
    fs.writeFileSync(file, orig);
  }
  if (r.signal) {
    console.error(`Interrupted. ${m.file} restored.`);
    process.exit(130);
  }
  ran++;
  const killed = r.status !== 0;
  if (!killed) survived++;
  console.log(`${killed ? 'KILLED  ' : 'SURVIVED'} ${m.file}: ${m.from.trim().slice(0, 60)}`);
}

if (sh('node build.js').status !== 0) throw new Error('rebuild of dist/annotate.html failed after the run');
console.log(`${ran - survived}/${ran} killed`);
if (survived) process.exitCode = 1;
