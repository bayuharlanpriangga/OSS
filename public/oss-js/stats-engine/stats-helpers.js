// Fitur: Helper format angka, p-value, interpretasi effect size, & CI effect size
//   f4, f1, pFmt, dLabel, effLabel, cohenDCI, eta2CI
// Depends on: stats-distributions.js (tCrit)

function f4(v, d = 4) {
  if (!isFinite(v) || v === null || v === undefined) return 'N/A';
  return (+v.toFixed(d)).toString();
}
function f1(v) { return f4(v, 1); }
function pFmt(p) {
  if (!isFinite(p)) return 'N/A';
  return p < .001 ? '< .001' : p.toFixed(3);
}
function dLabel(d) {
  if (!isFinite(d)) return 'N/A';
  return d < .2 ? 'Negligible' : d < .5 ? 'Small' : d < .8 ? 'Medium' : 'Large';
}
function effLabel(e) {
  return e < .01 ? 'Negligible' : e < .06 ? 'Small' : e < .14 ? 'Medium' : 'Large';
}

// Cohen's d 95% CI (approximate via SE of d)
// SE(d) ≈ sqrt((nA+nB)/(nA*nB) + d²/(2*(nA+nB-2)))
function cohenDCI(d, nA, nB) {
  if (!isFinite(d) || nA < 2 || nB < 2) return ['—', '—'];
  const df = nA + nB - 2;
  const sed = Math.sqrt((nA + nB) / (nA * nB) + d * d / (2 * df));
  const tc = tCrit(df);
  return [f4(d - tc * sed), f4(d + tc * sed)];
}

// eta² CI via F distribution (Steiger & Fouladi approximation)
function eta2CI(F, df1, df2) {
  if (!isFinite(F) || F <= 0) return ['—', '—'];
  const eta2 = F * df1 / (F * df1 + df2);
  // Approximate 95% CI using noncentrality parameter
  const ncLow = Math.max(0, F - 1.96) * df1;
  const ncHigh = (F + 1.96) * df1;
  const lo = ncLow / (ncLow + df1 + df2 + 1);
  const hi = ncHigh / (ncHigh + df1 + df2 + 1);
  return [f4(lo), f4(hi)];
}
