// Draw the knot grid as an SVG with a soft light sweeping across the pile.

import { DYES, hash } from './design.js';

const SCALE = 2; // pixels per knot
const FRINGE = 10; // knots of warp fringe at each end
const CYCLE = 7; // seconds between shimmers

export function tone(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(f > 1 ? v + (255 - v) * (f - 1) : v * f));
  return '#' + ch.map((v) => v.toString(16).padStart(2, '0')).join('');
}

export function render({ W, H, grid, roles }, d, login) {
  const hexes = roles.map((r) => DYES[r]);
  // One stroked path per color: each run of equal knots in a row is a 1-knot-thick segment.
  const paths = new Map();
  for (let y = 0; y < H; y++) {
    const f = d.rowTone[y];
    let x = 0;
    while (x < W) {
      const k = grid[y * W + x];
      let e = x + 1;
      while (e < W && grid[y * W + e] === k) e++;
      const color = tone(hexes[k], f);
      const p = paths.get(color) || { d: '', y: -1, x: 0 };
      p.d += p.y === y ? `m${x - p.x} 0h${e - x}` : `M${x} ${y + 0.5}h${e - x}`;
      p.y = y; p.x = e;
      paths.set(color, p);
      x = e;
    }
  }

  const fringe = [];
  for (let x = 0; x < W; x++) {
    const j = (hash(`${login}:${x}`) % 100) / 100;
    fringe.push(`M${x + 0.5} 0v-${(FRINGE - 1.5 + j * 1.2).toFixed(1)}`, `M${x + 0.5} ${H}v${(FRINGE - 1.5 + (1 - j) * 1.2).toFixed(1)}`);
  }

  const css = `
.shine{animation:shine ${CYCLE}s ease-in-out infinite}
@keyframes shine{0%{transform:translateX(-${W * 1.5}px)}40%,100%{transform:translateX(${W * 1.5}px)}}
@media (prefers-reduced-motion:reduce){.shine{animation:none}}`;

  const ivory = DYES.ivory;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${-FRINGE} ${W} ${H + 2 * FRINGE}" width="${W * SCALE}" height="${(H + 2 * FRINGE) * SCALE}" role="img" aria-label="A Persian carpet woven from ${escape(login)}'s GitHub activity">
<title>${escape(login)}'s carpet</title>
<style>${css}</style>
<defs>
<linearGradient id="pile" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".09"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient>
<pattern id="knots" width="1" height="1" patternUnits="userSpaceOnUse"><rect width="1" height="1" fill="url(#pile)"/><rect width=".14" height="1" fill="#000" opacity=".07"/></pattern>
<linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<clipPath id="rug"><rect width="${W}" height="${H}"/></clipPath>
</defs>
<path d="${fringe.join('')}" stroke="${ivory}" stroke-width=".42" opacity=".9"/>
<g fill="none" stroke-width="1" shape-rendering="crispEdges">
${[...paths].map(([color, p]) => `<path stroke="${color}" d="${p.d}"/>`).join('\n')}
</g>
<rect width="${W}" height="${H}" fill="url(#knots)"/>
<g clip-path="url(#rug)"><rect class="shine" x="${-W * 0.25}" y="${-H * 0.1}" width="${W * 0.5}" height="${H * 1.2}" fill="url(#sheen)" transform="translate(-${W * 1.5})" style="mix-blend-mode:soft-light"/></g>
</svg>
`;
}

function escape(s) {
  return String(s).replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}
