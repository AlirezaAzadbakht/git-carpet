// Re-weave the README gallery: node examples/gallery.js
// Profiles are made up; the date is fixed so the carpets only change when the design does.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { carpet } from '../src/index.js';

const dir = new URL('./gallery/', import.meta.url);
for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const { svg, design } = carpet(JSON.parse(readFileSync(new URL(file, dir), 'utf8')), new Date('2026-11-07'));
  writeFileSync(new URL(file.replace('.json', '.svg'), dir), svg);
  console.log(`${file}: ${design.harmony.name}`);
}
