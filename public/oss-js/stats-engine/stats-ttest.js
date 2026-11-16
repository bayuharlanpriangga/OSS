// Fitur: Uji T-Test (kategori Analyze: T-Test)
//   tTest (Welch Independent T-Test), oneSampleT, pairedTTest
// Depends on: stats-distributions.js, stats-helpers.js, stats-descriptive.js (sw)

// T-Test (Welch)
function tTest(a, b) {
  req(a.length, 2, 'T-Test A'); req(b.length, 2, 'T-Test B');
  const na = a.length, nb = b.length, ma = mean(a), mb = mean(b);
  const va = vari(a), vb = vari(b);
  if (va === 0 && vb === 0) throw new Error('Both groups have zero variance');
  const se = Math.sqrt(va / na + vb / nb);
  if (!se) throw new Error('Standard error is zero');
  const t = (ma - mb) / se;
  const df = (va / na + vb / nb) * (va / na + vb / nb) / ((va / na) * (va / na) / (na - 1) + (vb / nb) * (vb / nb) / (nb - 1));
  const p = tP(Math.abs(t), df);
  const sp = Math.sqrt(((na - 1) * va + (nb - 1) * vb) / (na + nb - 2));
  const d = sp > 0 ? Math.abs(ma - mb) / sp : NaN;
  const tc = tCrit(Math.round(df)); const ci = [ma - mb - tc * se, ma - mb + tc * se];
  const dCI = isFinite(d) ? cohenDCI(d, na, nb) : ['—', '—'];
  return {
    t: f4(t), df: f1(df), p: f4(p), p_fmt: pFmt(p), sig: p < .05,
    meanA: f4(ma), meanB: f4(mb), sdA: f4(std(a)), sdB: f4(std(b)), nA: na, nB: nb,
    cohensD: isFinite(d) ? f4(d) : 'N/A', dInterp: dLabel(d),
    cohensD_ci: '[' + dCI[0] + ', ' + dCI[1] + ']',
    ci95: '[' + f4(ci[0]) + ', ' + f4(ci[1]) + ']'
  };
}

// One-Sample T-Test
function oneSampleT(arr, mu0) {
  const nums = validNums(arr);
  req(nums.length, 2, 'One-Sample T-Test');
  const n = nums.length;
  const m = mean(nums);
  const s = std(nums);
  const se = s / Math.sqrt(n);
  const t = (m - mu0) / se;
  const df = n - 1;
  const p2 = tP(Math.abs(t), df);
  const tc = tCrit(df);
  const ci95 = '[' + f4(m - tc * se) + ', ' + f4(m + tc * se) + ']';
  const ciDiff = '[' + f4((m - mu0) - tc * se) + ', ' + f4((m - mu0) + tc * se) + ']';
  const d = (m - mu0) / s;
  return {
    n, mean: f4(m), sd: f4(s), se: f4(se),
    mu0: f4(mu0), meanDiff: f4(m - mu0),
    t: f4(t), df, p: f4(p2), p_fmt: pFmt(p2), sig: p2 < .05,
    ci95, ciDiff,
    cohensD: f4(Math.abs(d)), dInterp: dLabel(Math.abs(d)),
    conclusion: p2 < .05
      ? 'Mean significantly differs from ' + f4(mu0) + ' (p<.05)'
      : 'No significant difference from ' + f4(mu0) + ' (p≥.05)'
  };
}

// Paired T-Test
function pairedTTest(a, b) {
  const pairs = a.map((x, i) => [x, b[i]]).filter(([x, y]) => isV(x) && isV(y));
  req(pairs.length, 2, 'Paired T-Test');
  const diffs = pairs.map(([x, y]) => x - y);
  const n = diffs.length, md = mean(diffs), sd_d = std(diffs);
  const se = sd_d / Math.sqrt(n);
  if (se === 0) throw new Error('All differences are zero');
  const t = md / se, df = n - 1;
  const p = tP(Math.abs(t), df);
  // Cohen's dz (within-person)
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
