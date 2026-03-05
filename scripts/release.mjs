#!/usr/bin/env node
import { execSync } from 'node:child_process';

const bump = process.argv[2];
const allowed = new Set(['patch', 'minor', 'major']);

if (!allowed.has(String(bump))) {
  console.error('Usage: npm run release:patch|release:minor|release:major');
  process.exit(1);
}

assertOnMainBranch();
assertCleanWorkingTree();

run('npm run lint');
run('npm test');
run('npm run build');

run(`npm version ${bump} -m "chore(release): v%s"`);
run('git push origin main --follow-tags');

console.log('Release workflow completed.');

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

function assertOnMainBranch() {
  const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  if (branch !== 'main') {
    console.error(`Release must run on main. Current branch: ${branch}`);
    process.exit(1);
  }
}

function assertCleanWorkingTree() {
  const output = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
  if (output) {
    console.error('Working tree is not clean. Commit or stash changes before release.');
    process.exit(1);
  }
}
