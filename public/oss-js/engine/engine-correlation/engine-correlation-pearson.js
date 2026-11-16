// Fitur: Korelasi Pearson r (kategori Analyze: Correlation)
//   pearsonR
// Depends on: engine-core-distributions.js, engine-core-helpers.js

function pearsonR(ax, ay) {
  const { xs, ys, n } = validPairs(ax, ay); req(n, 3, 'Pearson r');
  const mx = mean(xs), my = mean(ys);
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const den = Math.sqrt(xs.reduce((s, x) => s + (x - mx) * (x - mx), 0) * ys.reduce((s, y) => s + (y - my) * (y - my), 0));
  if (den === 0) throw new Error('Zero variance — correlation undefined');
  const r = num / den, t2 = r * Math.sqrt((n - 2) / (1 - r * r));
  const p = tP(Math.abs(t2), n - 2);
  const fz = 0.5 * Math.log((1 + r) / (1 - r)), sez = 1 / Math.sqrt(n - 3);
  const zCrit95 = normInv(0.975);
  return {
    r: f4(r), r2: f4(r * r), p: f4(p), p_fmt: pFmt(p), sig: p < .05, n,
    ci95: '[' + f4(Math.tanh(fz - zCrit95 * sez)) + ', ' + f4(Math.tanh(fz + zCrit95 * sez)) + ']',
    strength: Math.abs(r) > .7 ? 'Strong' : Math.abs(r) > .4 ? 'Moderate' : Math.abs(r) > .1 ? 'Weak' : 'Negligible',
    direction: r >= 0 ? 'positive' : 'negative'
  };
}
