#!/usr/bin/env node
import { execSync } from 'node:child_process';

const otp = process.env.NPM_OTP?.trim();

assertOnMainBranch();
assertCleanWorkingTree();

run('npm run preflight');
run('npm version minor -m "chore(release): v%s"');
run(`npm publish --access public${otp ? ` --otp=${shellEscapeArg(otp)}` : ''}`);
run('git push origin main --follow-tags');

console.log('Published new minor version successfully.');

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

function assertOnMainBranch() {
  const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  if (branch !== 'main') {
    console.error(`Publish must run on main. Current branch: ${branch}`);
    process.exit(1);
  }
}

function assertCleanWorkingTree() {
  const output = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
  if (output) {
    console.error('Working tree is not clean. Commit or stash changes before publish.');
    process.exit(1);
  }
}

function shellEscapeArg(value) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
