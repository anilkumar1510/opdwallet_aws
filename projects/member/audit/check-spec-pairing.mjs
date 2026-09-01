// Section 8/9 pairing check: every transcribed spec must have BOTH a transcribe
// task and a verify task. Section 9 says the change cannot close while any
// transcribed spec has unverified scenarios; nothing enforced it until now.
//
// Reads files whole and parses them. Deliberately not line-based grep - four
// grep failures in this audit were against hand-written markdown with wrapped
// lines, blockquotes and tables.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const CHANGE = 'C:/Users/singh/OneDrive/Desktop/opdwallet_aws/openspec/changes/angular-member-portal';
const ORIGINAL = ['member-session', 'member-shell', 'member-family-context', 'member-wallet'];

const specs = readdirSync(join(CHANGE, 'specs')).filter((d) => d.startsWith('member-'));
const transcribed = specs.filter((s) => !ORIGINAL.includes(s));
const tasks = readFileSync(join(CHANGE, 'tasks.md'), 'utf8');

// Section 8 only.
const s8 = tasks.slice(tasks.indexOf('## 8.'), tasks.indexOf('## 9.'));
const has = (name, kind) =>
  new RegExp(`^- \\[.\\] 8\\.\\d+ \\*{0,2}${kind}`, 'im').test(
    s8.split('\n').filter((l) => l.includes(`\`specs/${name}/spec.md\``) || l.includes(`\`${name}\``))
      .join('\n'),
  );

const check = (name) => ({
  name,
  transcribe: s8.split('\n').some((l) => /8\.\d+ Transcribe/.test(l) && l.includes(`\`${name}\``)),
  verify: s8.split('\n').some((l) => /8\.\d+ \*\*Verify\*\*/.test(l) && l.includes(`specs/${name}/spec.md`)),
});

// --- CONTROLS ---
const posCtl = check('member-lab');
const posOk = posCtl.transcribe && posCtl.verify;
const negCtl = check('member-not-a-real-spec');
const negOk = !negCtl.transcribe && !negCtl.verify;

console.log('POSITIVE CONTROL  member-lab has both tasks:', posOk ? 'PASS' : 'FAIL');
console.log('NEGATIVE CONTROL  a non-existent spec matches neither:', negOk ? 'PASS' : 'FAIL');
if (!posOk || !negOk) {
  console.log('\nA control failed - this check is broken and its output is meaningless, not clean.');
  process.exit(2);
}

console.log(`\nspecs found: ${specs.length}  (${ORIGINAL.length} original, ${transcribed.length} transcribed)\n`);
let bad = 0;
for (const name of transcribed) {
  const r = check(name);
  const ok = r.transcribe && r.verify;
  if (!ok) bad++;
  console.log(
    `${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(22)} transcribe:${r.transcribe ? 'y' : 'N'} verify:${r.verify ? 'y' : 'N'}`,
  );
}
// A transcribed spec on disk with no task at all is the drift this catches.
console.log(bad === 0 ? '\nPAIRING OK' : `\nPAIRING BROKEN for ${bad} spec(s)`);
process.exit(bad === 0 ? 0 : 1);
