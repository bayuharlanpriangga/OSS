// Fitur: One-Sample T-Test (kategori Analyze: T-Test)
//   oneSampleT
// Depends on: engine-core-distributions.js, engine-core-helpers.js

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
