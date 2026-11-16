// Fitur: Paired Samples T-Test (kategori Analyze: T-Test)
//   pairedTTest
// Depends on: engine-core-distributions.js, engine-core-helpers.js, engine-descriptive-shapiro-wilk.js (sw)

function pairedTTest(a, b) {
  const pairs = a.map((x, i) => [x, b[i]]).filter(([x, y]) => isV(x) && isV(y));
  req(pairs.length, 2, 'Paired T-Test');
  const diffs = pairs.map(([x, y]) => x - y);
  const n = diffs.length, md = mean(diffs), sd_d = std(diffs);
  const se = sd_d / Math.sqrt(n);
  if (se === 0) throw new Error('All differences are zero');
  const t = md / se, df = n - 1;
  const p = tP(Math.abs(t), df);
  const dz = Math.abs(md) / sd_d;
  const tc_p = tCrit(n - 1); const ci = [md - tc_p * se, md + tc_p * se];
  const swD = n >= 3 ? sw(diffs) : null;
  return {
    t: f4(t), df, p: f4(p), p_fmt: pFmt(p), sig: p < .05, n,
    meanDiff: f4(md), sdDiff: f4(sd_d), seDiff: f4(se),
    cohensD: f4(dz), dInterp: dLabel(dz),
    ci95: '[' + f4(ci[0]) + ', ' + f4(ci[1]) + ']',
    normD: swD ? ('W=' + swD.W + ' p=' + swD.p) : 'N/A'
  };
}
