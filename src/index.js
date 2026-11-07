import { design } from './design.js';
import { weave } from './carpet.js';
import { render } from './svg.js';

export function carpet(profile, now) {
  const d = design(profile, now);
  const knots = weave(d);
  return { svg: render(knots, d, profile.login), design: d, knots };
}
