#!/usr/bin/env node
import { execSync } from 'node:child_process';

const remoteUrl = process.argv[2];

if (!remoteUrl) {
  console.error('Usage: npm run remote:set -- <git-remote-url>');
  process.exit(1);
}

execSync(`git remote set-url origin ${shellEscape(remoteUrl)}`, { stdio: 'inherit' });
console.log(`Updated origin to: ${remoteUrl}`);

function shellEscape(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}
