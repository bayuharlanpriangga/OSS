// Fitur: Post-hoc Tukey HSD & distribusi Studentized Range q (kategori Analyze: ANOVA)
//   qrangeCDF, tukeyHSD, qrangeCDF_inv
// Depends on: engine-core-distributions.js, engine-core-helpers.js, engine-anova-oneway.js (onewayANOVA)

function qrangeCDF(q, k, df) {
  if (q <= 0 || k < 2 || df < 1) return 0;
  const GL = [
    [0.0130467357, 0.0325581548], [0.0674683167, 0.0732003399], [0.1602952158, 0.1091892035],
    [0.2833023029, 0.1347646891], [0.4255628305, 0.1477391050], [0.5744371695, 0.1477391050],
    [0.7166976971, 0.1347646891], [0.8397047842, 0.1091892035], [0.9325316833, 0.0732003399],
    [0.9869532643, 0.0325581548]
  ];
  function normPDF(x) { return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI); }
  function inner(z) {
    let s = 0;
    const lo = -q - 5, hi = 5;
    const mid = (hi + lo) / 2, half = (hi - lo) / 2;
    GL.forEach(([xi, wi]) => {
      const x = mid + half * (2 * xi - 1);
      const phi = normPDF(x);
      const F1 = normCDF(x), F2 = normCDF(x - z);
      if (phi > 1e-15 && F1 > 0 && F2 >= 0 && F1 >= F2)
        s += wi * phi * Math.pow(F1 - F2, k - 1);
    });
    return k * s * half * 2;
  }
  if (df >= 1000) return inner(q);
  let p = 0;
  const GL16 = [
    [0.0950125098, 0.1894506105], [0.2816035508, 0.1826034151], [0.4580167777, 0.1691565194],
    [0.6178762444, 0.1495959889], [0.7554044084, 0.1246289555], [0.8656312024, 0.0951585117],
    [0.9445750231, 0.0622535239], [0.9894009350, 0.0271524594]
  ];
  const scale = 2 * df;
  GL16.forEach(([xi, wi]) => {
    const x1 = scale * xi, x2 = scale * (1 - xi);
    [[x1, wi], [x2, wi]].forEach(([x, w]) => {
      if (x > 0) {
        const v = x;
        const qAdj = q * Math.sqrt(v / df);
        const fChi = Math.exp((df / 2 - 1) * Math.log(x) - (x / 2) - lnG(df / 2) - (df / 2) * Math.log(2));
        if (isFinite(fChi) && fChi > 0) p += w * inner(qAdj) * fChi * scale;
      }
    });
  });
  return Math.min(1, Math.max(0, p));
}

function tukeyHSD(groups) {
  const res = onewayANOVA(groups);
  const msW = parseFloat(res.msW), pairs = [];
  const k = groups.length, N = groups.flatMap(g => g.vals).length, dfW = N - k;
  for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) {
    const a = groups[i], b = groups[j];
    const meanDiff = mean(a.vals) - mean(b.vals);
    const harmN = 2 / (1 / a.vals.length + 1 / b.vals.length);
    const se = Math.sqrt(msW / harmN);
    const q = Math.abs(meanDiff) / se;
    const pa = Math.max(0, 1 - qrangeCDF(q, k, dfW));
    const qCrit = qrangeCDF_inv(0.95, k, dfW) || 1.96;
    pairs.push({ a: a.label, b: b.label, diff: f4(meanDiff), absDiff: f4(Math.abs(meanDiff)), q: f4(q), p: f4(pa), p_fmt: pFmt(pa), sig: pa < .05 });
  }
  return pairs;
}

function qrangeCDF_inv(p, k, df) {
  let lo = 0, hi = 20;
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; qrangeCDF(mid, k, df) < p ? lo = mid : hi = mid; }
  return (lo + hi) / 2;
}
