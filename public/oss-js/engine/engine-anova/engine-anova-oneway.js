// Fitur: One-Way ANOVA (kategori Analyze: ANOVA)
//   onewayANOVA
// Depends on: engine-core-distributions.js, engine-core-helpers.js

function onewayANOVA(groups) {
  const all = groups.flatMap(g => g.vals); req(all.length, 3, 'ANOVA');
  if (groups.length < 2) throw new Error('ANOVA needs ≥2 groups');
  const gm = mean(all), N = all.length, k = groups.length;
  const ssB = groups.reduce((s, g) => s + g.vals.length * Math.pow(mean(g.vals) - gm, 2), 0);
  const ssW = groups.reduce((s, g) => s + g.vals.reduce((ss, v) => ss + Math.pow(v - mean(g.vals), 2), 0), 0);
  const dfB = k - 1, dfW = N - k;
  if (dfW <= 0 || ssW === 0) throw new Error('Insufficient degrees of freedom');
  const msB = ssB / dfB, msW = ssW / dfW, F = msB / msW;
  const p = fP(F, dfB, dfW);
  const eta2 = ssB / (ssB + ssW), omega2 = Math.max(0, (ssB - dfB * msW) / (ssB + ssW + msW));
  const eta2_ci = eta2CI(F, dfB, dfW);
  return {
    F: f4(F), dfB, dfW, msB: f4(msB), msW: f4(msW), ssB: f4(ssB), ssW: f4(ssW),
    p: f4(p), p_fmt: pFmt(p), sig: p < .05, eta2: f4(eta2), omega2: f4(omega2),
    eta2Interp: effLabel(eta2), eta2_ci: '[' + eta2_ci[0] + ', ' + eta2_ci[1] + ']',
    groupStats: groups.map(g => ({ label: g.label, n: g.vals.length, mean: f4(mean(g.vals)), sd: f4(std(g.vals)), min: f4(Math.min(...g.vals)), max: f4(Math.max(...g.vals)) }))
  };
}
