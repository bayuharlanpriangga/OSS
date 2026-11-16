// Fitur: Uji Normalitas Shapiro-Wilk (kategori Analyze: Descriptive)
//   sw
// Depends on: engine-core-distributions.js, engine-core-helpers.js

function sw(arr) {
  const x = [...arr].sort((a, b) => a - b), n = x.length;
  if (n < 3) return { W: 'N/A', p: 'N/A' };
  const m = mean(x), ss = x.reduce((s, v) => s + (v - m) * (v - m), 0);
  const u = x.map((_, i) => {
    const pi = (i + 1 - 3 / 8) / (n + 0.25);
    const t2 = Math.sqrt(-2 * Math.log(pi < 0.5 ? pi : 1 - pi));
    const z = t2 - (2.515517 + 0.802853 * t2 + 0.010328 * t2 * t2) / (1 + 1.432788 * t2 + 0.189269 * t2 * t2 + 0.001308 * Math.pow(t2, 3));
    return pi < 0.5 ? -z : z;
  });
  const uN = Math.sqrt(u.reduce((s, v) => s + v * v, 0));
  const a = u.map(v => v / uN);
  let Wn = 0; for (let i = 0; i < Math.floor(n / 2); i++) Wn += a[n - 1 - i] * (x[n - 1 - i] - x[i]);
  const W = ss > 0 ? (Wn * Wn) / ss : NaN;
  let p;
  if (n <= 11) {
    const mu = -0.0006714 * n * n + 0.025054 * n - 0.39978;
    const sigma = Math.exp(-0.0020322 * n * n + 0.062767 * n - 1.0521);
    p = 1 - normCDF((Math.log(1 - W) - mu) / sigma);
  } else {
    const ln = Math.log(n);
    const mu = 0.0038915 * Math.pow(ln, 3) - 0.083751 * ln * ln - 0.31082 * ln - 1.5861;
    const sigma = Math.exp(0.0030302 * ln * ln - 0.082676 * ln - 0.4803);
    p = 1 - normCDF((Math.log(1 - W) - mu) / sigma);
  }
  return { W: f4(W), p: f4(Math.max(0, Math.min(1, p))) };
}
