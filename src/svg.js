// Draw the knot grid as an animated SVG. The loop: the finished rug shimmers,
// the loom takes it back, then it is woven again row by row from the bottom.

import { DYES, hash } from './design.js';

const SCALE = 2; // pixels per knot
const FRINGE = 10; // knots of warp fringe at each end
const CYCLE = 16; // seconds per loop

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

  const pct = (s) => `${((s / CYCLE) * 100).toFixed(2)}%`;
  // Timeline (seconds): 0–3 rest, 3–4.2 unweave, 4.2–13 weave, 13–16 rest with a shimmer.
  const [rest, unweave, weave] = [3, 4.2, 13];
  const css = `
.loom{transform-box:fill-box;transform-origin:top;animation:loom ${CYCLE}s infinite}
@keyframes loom{0%,${pct(rest)}{transform:scaleY(0);animation-timing-function:ease-in}
${pct(unweave)}{transform:scaleY(1);animation-timing-function:steps(${H},end)}
${pct(weave)},100%{transform:scaleY(0)}}
.shuttle{animation:shuttle ${CYCLE}s infinite}
@keyframes shuttle{0%,${pct(rest)}{opacity:0;transform:translateY(0);animation-timing-function:ease-in}
${pct(unweave)}{opacity:1;transform:translateY(${H}px);animation-timing-function:steps(${H},end)}
${pct(weave)}{opacity:1;transform:translateY(0)}${pct(weave + 0.4)},100%{opacity:0;transform:translateY(0)}}
.bobbin{animation:bobbin .7s ease-in-out infinite alternate}
@keyframes bobbin{from{transform:translateX(4px)}to{transform:translateX(${W - 16}px)}}
.shine{animation:shine ${CYCLE}s infinite}
@keyframes shine{0%,${pct(weave + 0.3)}{transform:translateX(-${W * 1.5}px)}${pct(CYCLE - 0.2)},100%{transform:translateX(${W * 1.5}px)}}
@media (prefers-reduced-motion:reduce){.loom,.shuttle,.shine,.bobbin{animation:none}}`;

  const ivory = DYES.ivory;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${-FRINGE} ${W} ${H + 2 * FRINGE}" width="${W * SCALE}" height="${(H + 2 * FRINGE) * SCALE}" role="img" aria-label="A Persian carpet woven from ${escape(login)}'s GitHub activity">
<title>${escape(login)}'s carpet</title>
<style>${css}</style>
<defs>
<linearGradient id="pile" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".09"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient>
<pattern id="knots" width="1" height="1" patternUnits="userSpaceOnUse"><rect width="1" height="1" fill="url(#pile)"/><rect width=".14" height="1" fill="#000" opacity=".07"/></pattern>
<pattern id="warp" width="2" height="1" patternUnits="userSpaceOnUse"><rect width="2" height="1" fill="#2b1f17"/><rect x=".6" width=".8" height="1" fill="${ivory}" opacity=".8"/></pattern>
<linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<clipPath id="rug"><rect width="${W}" height="${H}"/></clipPath>
</defs>
<path d="${fringe.join('')}" stroke="${ivory}" stroke-width=".42" opacity=".9"/>
<g fill="none" stroke-width="1" shape-rendering="crispEdges">
${[...paths].map(([color, p]) => `<path stroke="${color}" d="${p.d}"/>`).join('\n')}
</g>
<rect width="${W}" height="${H}" fill="url(#knots)"/>
<g clip-path="url(#rug)"><rect class="shine" x="${-W * 0.25}" y="${-H * 0.1}" width="${W * 0.5}" height="${H * 1.2}" fill="url(#sheen)" transform="translate(-${W * 1.5})" style="mix-blend-mode:soft-light"/></g>
<rect class="loom" width="${W}" height="${H}" fill="url(#warp)" transform="scale(1 0)"/>
<g class="shuttle" opacity="0"><rect y="-.35" width="${W}" height=".7" fill="${DYES.gold}"/><g class="bobbin"><rect y="-2" width="14" height="4" rx="2" fill="#b07a45" stroke="#2b1f17" stroke-width=".6"/><rect x="4" y="-.7" width="6" height="1.4" rx=".7" fill="${DYES.madder}"/></g></g>
</svg>
`;
}

function escape(s) {
  return String(s).replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}
