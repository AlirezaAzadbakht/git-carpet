#!/usr/bin/env node
// Weave a carpet locally: node src/cli.js <login> [--fixture file.json] [--out dir]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { fetchProfile } from './data.js';
import { carpet } from './index.js';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const fixture = opt('--fixture');
const out = opt('--out') || 'carpet';
const login = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
if (!login && !fixture) {
  console.error('usage: node src/cli.js <login> [--fixture file.json] [--out dir]');
  process.exit(1);
}

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || (() => {
  try { return execSync('gh auth token', { encoding: 'utf8' }).trim(); } catch { return ''; }
})();
const profile = fixture ? JSON.parse(readFileSync(fixture, 'utf8')) : await fetchProfile(login, token);
const { svg, design } = carpet(profile);
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'carpet.svg'), svg);
console.log(`${profile.login}: ${design.harmony.name} carpet, ${(svg.length / 1024).toFixed(0)} KB → ${join(out, 'carpet.svg')}`);
