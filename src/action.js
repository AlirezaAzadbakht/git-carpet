// GitHub Action entry: weave the carpet, write it, and commit it if it changed.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fetchProfile } from './data.js';
import { carpet } from './index.js';

const input = (name, fallback = '') => (process.env[`INPUT_${name.toUpperCase()}`] || fallback).trim();
const login = input('user', process.env.GITHUB_REPOSITORY_OWNER);
const outDir = input('output-dir', 'carpet');
const token = input('github-token');
const git = (...args) => execFileSync('git', args, { stdio: 'inherit' });

const profile = await fetchProfile(login, token);
const { svg, design } = carpet(profile);
mkdirSync(outDir, { recursive: true });
const file = join(outDir, 'carpet.svg');
writeFileSync(file, svg);
console.log(`Wove a ${design.harmony.name} carpet for ${login} → ${file}`);

if (input('commit', 'true') === 'true') {
  git('add', file);
  try {
    execFileSync('git', ['diff', '--cached', '--quiet']);
    console.log('The carpet is unchanged; nothing to commit.');
  } catch {
    git('-c', 'user.name=github-actions[bot]', '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com',
      'commit', '--quiet', '-m', input('commit-message', 'carpet: weave the day\'s carpet'));
    git('push', '--quiet');
  }
}
