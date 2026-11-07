// Turn a profile summary into carpet design parameters. Same profile in, same carpet out.

// Natural dyes of the Persian dyer's pot.
export const DYES = {
  madder: '#9b2226', madderDark: '#6a1517', pomegranate: '#b1343f', rose: '#cf7a6e',
  indigo: '#1c2b4d', indigoLight: '#46638f', sky: '#7d9cbf',
  ivory: '#efe3c6', camel: '#c19a68', gold: '#d6a44a', saffron: '#e6b94f',
  green: '#4f6c3a', pistachio: '#8fa45e', turquoise: '#3c8c86',
  walnut: '#2a1a12',
};

// Each harmony names the dye for every role a knot can play. Modeled on classic city rugs.
const HARMONIES = [
  { name: 'Kashan', field: 'madder', fieldLine: 'madderDark', fieldFlower: 'ivory', fieldLeaf: 'indigoLight', fieldDot: 'gold',
    medal: 'indigo', medalBand: 'ivory', star: 'madder', petal: 'rose', medalDot: 'gold',
    border: 'indigo', vine: 'gold', rosette: 'madder', rosetteIn: 'ivory', bud: 'pistachio',
    guardOut: 'madder', guardOutMotif: 'ivory', guardIn: 'ivory', guardInMotif: 'madder', stripes: ['gold', 'indigoLight', 'rose'] },
  { name: 'Tabriz', field: 'ivory', fieldLine: 'camel', fieldFlower: 'madder', fieldLeaf: 'green', fieldDot: 'indigoLight',
    medal: 'madder', medalBand: 'indigo', star: 'ivory', petal: 'gold', medalDot: 'indigo',
    border: 'madder', vine: 'ivory', rosette: 'indigo', rosetteIn: 'gold', bud: 'green',
    guardOut: 'indigo', guardOutMotif: 'gold', guardIn: 'indigo', guardInMotif: 'ivory', stripes: ['gold', 'madderDark', 'sky'] },
  { name: 'Isfahan', field: 'indigo', fieldLine: 'indigoLight', fieldFlower: 'ivory', fieldLeaf: 'pistachio', fieldDot: 'gold',
    medal: 'ivory', medalBand: 'madder', star: 'indigo', petal: 'rose', medalDot: 'madder',
    border: 'madder', vine: 'gold', rosette: 'ivory', rosetteIn: 'indigo', bud: 'pistachio',
    guardOut: 'ivory', guardOutMotif: 'madder', guardIn: 'gold', guardInMotif: 'indigo', stripes: ['madder', 'ivory', 'turquoise'] },
  { name: 'Nain', field: 'ivory', fieldLine: 'sky', fieldFlower: 'indigo', fieldLeaf: 'indigoLight', fieldDot: 'turquoise',
    medal: 'indigo', medalBand: 'ivory', star: 'ivory', petal: 'turquoise', medalDot: 'gold',
    border: 'indigo', vine: 'ivory', rosette: 'ivory', rosetteIn: 'turquoise', bud: 'sky',
    guardOut: 'ivory', guardOutMotif: 'indigo', guardIn: 'sky', guardInMotif: 'ivory', stripes: ['indigoLight', 'gold', 'turquoise'] },
  { name: 'Heriz', field: 'pomegranate', fieldLine: 'madderDark', fieldFlower: 'ivory', fieldLeaf: 'indigo', fieldDot: 'saffron',
    medal: 'ivory', medalBand: 'indigo', star: 'pomegranate', petal: 'indigoLight', medalDot: 'saffron',
    border: 'indigo', vine: 'saffron', rosette: 'pomegranate', rosetteIn: 'ivory', bud: 'turquoise',
    guardOut: 'ivory', guardOutMotif: 'pomegranate', guardIn: 'saffron', guardInMotif: 'indigo', stripes: ['ivory', 'turquoise', 'saffron'] },
];

export function hash(str) {
  let h = 2166136261;
  for (const ch of str) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
  return h >>> 0;
}

const clamp01 = (x) => Math.min(1, Math.max(0, x));

export function design(profile, now = new Date()) {
  const W = 192;
  const H = 288;
  const harmony = HARMONIES[hash(`${profile.languages[0] || ''}/${profile.login}`) % HARMONIES.length];

  const years = (now - new Date(profile.createdAt)) / (365.25 * 864e5);
  const activity = clamp01(Math.log10(profile.total + 1) / 4); // 0 quiet … 1 at 10k/yr

  // Abrash: one tone per week, smoothed so bands read as dye batches, not stripes.
  const weeks = profile.weeks;
  const max = Math.max(1, ...weeks);
  const level = weeks.map((w, i) => {
    const a = weeks[Math.max(0, i - 1)], b = weeks[Math.min(weeks.length - 1, i + 1)];
    return Math.sqrt((a + 2 * w + b) / 4 / max);
  });
  const rowTone = Array.from({ length: H }, (_, y) => {
    const week = Math.min(weeks.length - 1, Math.floor(((H - 1 - y) / H) * weeks.length)); // woven bottom-up
    return 1.05 - 0.1 * (level[week] || 0); // quiet weeks a touch lighter, busy weeks richer
  });

  return {
    W, H, harmony,
    stripes: 1 + Math.min(2, Math.floor(years / 4)), // older account, more stripes
    border: { width: 24, halfPeriod: 30 - 6 * clamp01(profile.longestStreak / 60) },
    medallion: { rx: 0.62, ry: 0.36 + 0.08 * activity, lobes: profile.total < 100 ? 12 : profile.total < 1000 ? 16 : 20 },
    rowTone,
  };
}
