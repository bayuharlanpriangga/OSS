// Fitur: Independent Samples Welch T-Test (kategori Analyze: T-Test)
//   tTest
// Depends on: engine-core-distributions.js, engine-core-helpers.js

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
