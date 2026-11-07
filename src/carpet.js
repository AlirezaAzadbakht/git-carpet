// Knot the carpet. Every knot is decided from its distance to the carpet's center
// lines (u, v), so the rug is mirror-symmetric left/right and top/bottom by
// construction, the way a Persian weaver repeats one quarter of the cartoon.

export function weave(d) {
  const { W, H } = d;
  const roles = [];
  const index = new Map();
  const id = (role) => {
    if (!index.has(role)) { index.set(role, roles.length); roles.push(role); }
    return index.get(role);
  };
  const knot = layout(d);
  const grid = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      grid[y * W + x] = id(knot(Math.abs(x + 0.5 - W / 2), Math.abs(y + 0.5 - H / 2)));
    }
  }
  return { W, H, grid, roles };
}

// Bands from the edge inward: outer guard, main border, inner guard, stripes, field.
function layout(d) {
  const { W, H, harmony: c } = d;
  const G1 = 9, BW = d.border.width, G2 = 8, S = 2 * d.stripes;
  const F = G1 + BW + G2 + S; // field starts this far from the edge
  const fw = W / 2 - F, fh = H / 2 - F; // field half extents

  const zig = [period(W / 2, 9), period(H / 2, 9)];
  const dots = [period(W / 2 - (G1 + BW + G2 / 2), 6), period(H / 2 - (G1 + BW + G2 / 2), 6)];
  const corner = G1 + BW / 2; // corner rosette center, measured from both edges
  const hp = [period(W / 2 - corner, d.border.halfPeriod), period(H / 2 - corner, d.border.halfPeriod)];

  const med = { rx: fw * d.medallion.rx, ry: fh * d.medallion.ry, lobes: d.medallion.lobes };
  const lach = { rx: fw * 0.62, ry: fw * 0.68 };
  const sx = period(fw, 13), sy = period(fh, 16); // herati lattice spacing

  return (u, v) => {
    const dx = W / 2 - u, dy = H / 2 - v;
    const edge = Math.min(dx, dy);
    // Mitred corners: the diagonal decides whether a knot belongs to the top/bottom or the side border.
    const side = dy <= dx ? 0 : 1;
    const along = side ? dy : dx, cross = side ? dx : dy;

    if (edge < G1) return guardZigzag(cross, along, G1, zig[side], c);
    if (edge < G1 + BW) return mainBorder(cross - G1, along - corner, BW, hp[side], c);
    if (edge < G1 + BW + G2) return guardDots(cross - G1 - BW, along, G2, dots[side], c);
    if (edge < F) return c.stripes[Math.floor((edge - G1 - BW - G2) / 2) % c.stripes.length];
    if (edge < F + 1.5) return 'walnut';
    return field(u, v, fw, fh, med, lach, sx, sy, c);
  };
}

// Pick a spacing near `target` that divides `length` evenly, so motifs land
// symmetrically on the center line instead of being cut by the mirror.
function period(length, target) {
  return length / Math.max(1, Math.round(length / target));
}

function guardZigzag(cross, along, w, p, c) {
  if (cross < 1.5 || cross >= w - 1.5) return 'walnut';
  const t = Math.abs((((along / p) % 1) + 1) % 1 - 0.5) * 2; // triangle wave 0..1
  const line = 2.2 + t * (w - 4.4);
  const dist = Math.abs(cross - line);
  if (dist < 1) return c.guardOutMotif;
  // Reciprocal teeth: the ground on either side of the zigzag alternates.
  return c.guardOut;
}

function guardDots(cross, along, w, p, c) {
  if (cross < 1.5 || cross >= w - 1.5) return 'walnut';
  const a = ((along / p) % 1) * p - p / 2;
  const r = Math.hypot(a, cross - w / 2);
  if (r < 0.9) return 'gold';
  return r < 2.1 ? c.guardInMotif : c.guardIn;
}

// Main border: rosettes on a meandering vine, palmettes in the vine's bends.
function mainBorder(cross, a, w, h, c) {
  if (cross < 1.5 || cross >= w - 1.5) return 'walnut';
  const mid = w / 2;
  const k = Math.round(a / h);
  const da = a - k * h, dc = cross - mid;
  const ros = rosette(da, dc, Math.min(h * 0.3, mid - 2.4), c.rosette, c.rosetteIn, 'gold');
  if (ros) return ros;

  const amp = mid - 9;
  const wave = (t) => amp * Math.sin((Math.PI * t) / h);
  const s = wave(a);

  // Palmette at each bend, opening toward the border edge the vine swings to.
  const km = Math.floor(a / h) + 0.5;
  const sign = Math.sign(Math.sin(Math.PI * km));
  const pa = a - km * h, pq = sign * (cross - mid) - amp + 1.2;
  const pal = palmette(pa, pq, Math.min(h * 0.38, mid - amp - 0.4), c);
  if (pal) return pal;

  if (Math.abs(cross - mid - s) < 0.85) return c.vine;

  // A leaf on the inside of each bend, lying along the vine.
  for (const off of [-0.27, 0.27]) {
    const ta = (km + off) * h;
    const slope = (amp * Math.PI / h) * Math.cos((Math.PI * ta) / h);
    const len = Math.hypot(1, slope), tx = 1 / len, ty = slope / len;
    const cx = ta, cy = mid + wave(ta) - sign * 1.9 * tx; // offset toward the inside of the bend
    const px = a - cx, py = cross - cy;
    const t = px * tx + py * ty, n = -px * ty + py * tx;
    const e = (t / 3.2) ** 2 + (n / 1.25) ** 2;
    if (e < 1) return e < 0.2 ? c.vine : c.bud;
  }
  return c.border;
}

// A fan-shaped palmette rooted at (0,0), opening toward +q.
function palmette(p, q, R, c) {
  if (q < -0.6) return null;
  const r = Math.hypot(p, q);
  const phi = Math.atan2(p, q); // 0 straight out
  if (Math.abs(phi) > 1.35 || r > R) return null;
  const edge = R * (0.8 + 0.2 * Math.abs(Math.cos((phi * 5) / 1.25 * (Math.PI / 2))));
  if (r > edge) return null;
  if (r > edge - 1.1) return 'walnut';
  if (r < R * 0.28) return 'gold';
  if (r < R * 0.55) return Math.abs(phi) < 0.18 ? 'walnut' : c.rosetteIn;
  return c.bud;
}

// An eight-petal rosette: walnut outline, outer petals, offset inner petals, gold heart.
function rosette(x, y, R, petal, inner, heart) {
  const r = Math.hypot(x, y);
  if (r > R) return null;
  const th = Math.atan2(y, x);
  const edge = R * (0.7 + 0.3 * Math.abs(Math.cos(4 * th)));
  if (r > edge) return null;
  if (r > edge - 1.1) return 'walnut';
  if (r < R * 0.2) return heart;
  const innerEdge = R * (0.36 + 0.2 * Math.abs(Math.sin(4 * th)));
  if (r < innerEdge) return r > innerEdge - 0.9 ? 'walnut' : inner;
  return petal;
}

function field(u, v, fw, fh, med, lach, sx, sy, c) {
  return medallion(u, v, med, c) || lachak(fw - u, fh - v, lach, c) || herati(u, v, sx, sy, c);
}

// Central medallion (toranj) with pendants (sar-toranj) above and below.
function medallion(u, v, { rx, ry, lobes }, c) {
  const ex = u / rx, ey = v / ry;
  const r = Math.hypot(ex, ey), th = Math.atan2(ey, ex); // th: 0 at the side, PI/2 at the tip
  // Scalloped edge, drawn out to points at top and bottom.
  const R = (1 - 0.05 * (1 - Math.abs(Math.cos((lobes * th) / 2)))) * (1 + 0.24 * Math.sin(th) ** 10);
  const g = slope(ex, ey, r, rx, ry);
  const q = r / R;
  if (q <= 1) {
    const depth = (R - r) / g; // knots in from the edge
    if (depth < 1.6) return 'walnut';
    if (depth < 4.6) return c.medalBand;
    if (depth < 5.8) return 'walnut';
    // Eight-pointed star (shamseh) at the heart.
    const sr = r / 0.52;
    const star = 0.6 + 0.4 * Math.abs(Math.cos(4 * th)) ** 1.6;
    if (sr < star) {
      if ((star - sr) * 0.52 / g < 1.4) return 'walnut';
      const m = Math.min(rx, ry);
      return rosette(ex * m, ey * m, 0.3 * m, c.petal, 'ivory', 'gold') || c.star;
    }
    // Ring of petals around the star, gold dots between them.
    const ring = Math.cos(16 * th);
    const rr = r - 0.72;
    if (Math.abs(rr) < 0.1 && ring > 0.3 + 5 * Math.abs(rr)) return Math.abs(rr) < 0.03 && ring > 0.8 ? c.medalDot : c.petal;
    if (Math.abs(rr) < 0.04 && ring < -0.85) return c.medalDot;
    return c.medal;
  }
  // Pendant: a small cartouche on the long axis, joined by a stem.
  const tip = 1.24;
  const pr = Math.hypot(u / (rx * 0.2), (v - ry * (tip + 0.15)) / (ry * 0.12));
  if (pr < 1) {
    if ((1 - pr) * ry * 0.12 < 1.4) return 'walnut';
    return pr < 0.45 ? c.medalBand : c.medal;
  }
  if (u < 1.2 && v > ry * 1.1 && v < ry * (tip + 0.06)) return 'walnut';
  if (q < 1.12) return c.field; // a halo of plain field around it
  return null;
}

// How fast the normalized radius r = |(u/rx, v/ry)| grows per knot, so outlines
// keep a constant thickness in knots around a stretched shape.
function slope(ex, ey, r, rx, ry) {
  return r > 1e-6 ? Math.hypot(ex / rx, ey / ry) / r : 1 / Math.max(rx, ry);
}

// Corner piece (lachak): a quarter medallion measured from the field corner.
function lachak(cu, cv, { rx, ry }, c) {
  const ex = cu / rx, ey = cv / ry;
  const r = Math.hypot(ex, ey), th = Math.atan2(ey, ex);
  const R = 1 - 0.06 * (1 - Math.abs(Math.cos(6 * th)));
  if (r > R * 1.1) return null;
  if (r > R) return c.field;
  const g = slope(ex, ey, r, rx, ry);
  const depth = (R - r) / g;
  if (depth < 1.6) return 'walnut';
  if (depth < 4.6) return c.medalBand;
  if (depth < 5.8) return 'walnut';
  // A quarter of the medallion's star in the corner, then a scalloped inner arc.
  const sr = r / 0.5;
  const star = 0.6 + 0.4 * Math.abs(Math.cos(4 * th)) ** 1.6;
  if (sr < star) {
    if ((star - sr) * 0.5 / g < 1.4) return 'walnut';
    return rosette(cu, cv, Math.min(rx, ry) * 0.24, c.petal, 'ivory', 'gold') || c.star;
  }
  const arc = 0.74 + 0.03 * Math.cos(16 * th);
  const ad = Math.abs(r - arc) / g;
  if (ad < 0.7) return 'walnut';
  if (ad < 1.8 && r < arc) return c.petal;
  return c.medal;
}

// Herati: a diamond lattice with a flower on every node and four leaves around it.
function herati(u, v, sx, sy, c) {
  // Nearest node of the diamond lattice {(i*sx, j*sy) : i+j even}.
  let i = Math.round(u / sx), j = Math.round(v / sy);
  if ((i + j) % 2) {
    let best = Infinity;
    for (const [a, b] of [[i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]]) {
      const dist = Math.abs(u / sx - a) + Math.abs(v / sy - b);
      if (dist < best) { best = dist; i = a; j = b; }
    }
  }
  const x = u - i * sx, y = v - j * sy; // knots from the node
  const nx = x / sx, ny = y / sy;
  if (Math.abs(nx) + Math.abs(ny) > 1 - 0.8 / Math.min(sx, sy)) return c.fieldLine; // lattice vines
  const ros = rosette(x, y, 4.4, c.fieldFlower, c.fieldDot, c.fieldDot);
  if (ros) return ros;
  // Four lancet leaves, one per diamond edge, lying along the edge.
  const gx = Math.sign(nx) || 1, gy = Math.sign(ny) || 1;
  const lx = x - gx * 0.5 * sx * 0.92, ly = y - gy * 0.5 * sy * 0.92;
  const len = Math.hypot(sx, sy);
  const ex = (gx * sx) / len, ey = (-gy * sy) / len;
  const t = lx * ex + ly * ey, n = -lx * ey + ly * ex;
  const leaf = (t / (0.27 * len)) ** 2 + (n / 1.6) ** 2;
  if (leaf < 1) return leaf < 0.3 && Math.abs(n) < 0.5 ? c.fieldDot : c.fieldLeaf;
  return c.field;
}
