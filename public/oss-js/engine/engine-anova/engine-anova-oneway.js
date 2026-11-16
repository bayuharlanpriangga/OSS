// Fitur: One-Way ANOVA beserta Levene & seluruh opsi Post-hoc (Tukey HSD, Fisher LSD, Bonferroni, Holm-Bonferroni)
//   onewayANOVA, levene, qrangeCDF, tukeyHSD, qrangeCDF_inv, lsdPosthoc, bonferroniPosthoc, holmBonferroni, holmBonferroniPosthoc
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

// Levene's / Brown-Forsythe Test of Homogeneity of Variance
function levene(groups) {
  const Z = groups.map(g => { const med = quantile([...g].sort((a, b) => a - b), .5); return g.map(v => Math.abs(v - med)); });
  try { return onewayANOVA(Z.map((z, i) => ({ label: String(i), vals: z }))); } catch { return null; }
}

// Tukey HSD Post-Hoc & Studentized Range q Distribution
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

// Fisher's LSD Post-Hoc
function lsdPosthoc(groups) {
  req(groups.length, 2, 'LSD post-hoc groups');
  var allVals = [].concat.apply([], groups.map(function(g) { return g.vals; }));
  var k = groups.length;
  var n = allVals.length;
  var ssW = groups.reduce(function(s, g) { var gm = mean(g.vals); return s + g.vals.reduce(function(ss, v) { return ss + (v - gm) * (v - gm); }, 0); }, 0);
  var dfW = n - k;
  var msW = dfW > 0 ? ssW / dfW : NaN;
  var results = [];
  for (var i = 0; i < groups.length; i++) {
    for (var j = i + 1; j < groups.length; j++) {
      var ni = groups[i].vals.length, nj = groups[j].vals.length;
      var mi = mean(groups[i].vals), mj = mean(groups[j].vals);
      var diff = mi - mj;
      var se = Math.sqrt(msW * (1 / ni + 1 / nj));
      var t_val = se > 0 ? diff / se : NaN;
      var p_val = isFinite(t_val) ? tP(Math.abs(t_val), dfW) : NaN;
      results.push({
        a: groups[i].label, b: groups[j].label,
        diff: f4(diff), se: f4(se),
        t: f4(t_val), df: dfW,
        p: f4(p_val), p_fmt: pFmt(p_val),
        sig: p_val < 0.05
      });
    }
  }
  return results;
}

// Bonferroni Post-Hoc
function bonferroniPosthoc(groups) {
  req(groups.length, 2, 'Bonferroni post-hoc groups');
  var allVals = [].concat.apply([], groups.map(function(g) { return g.vals; }));
  var k = groups.length;
  var n = allVals.length;
  var ssW = groups.reduce(function(s, g) { var gm = mean(g.vals); return s + g.vals.reduce(function(ss, v) { return ss + (v - gm) * (v - gm); }, 0); }, 0);
  var dfW = n - k;
  var msW = dfW > 0 ? ssW / dfW : NaN;
  var m = k * (k - 1) / 2;
  var results = [];
  for (var i = 0; i < groups.length; i++) {
    for (var j = i + 1; j < groups.length; j++) {
      var ni = groups[i].vals.length, nj = groups[j].vals.length;
      var mi = mean(groups[i].vals), mj = mean(groups[j].vals);
      var diff = mi - mj;
      var se = Math.sqrt(msW * (1 / ni + 1 / nj));
      var t_val = se > 0 ? diff / se : NaN;
      var p_raw = isFinite(t_val) ? tP(Math.abs(t_val), dfW) : NaN;
      var p_adj = isFinite(p_raw) ? Math.min(1, p_raw * m) : NaN;
      results.push({
        a: groups[i].label, b: groups[j].label,
        diff: f4(diff), se: f4(se),
        t: f4(t_val), df: dfW,
        p_raw: f4(p_raw), p: f4(p_adj), p_fmt: pFmt(p_adj),
        sig: p_adj < 0.05
      });
    }
  }
  return results;
}

// Holm-Bonferroni correction & Post-Hoc
function holmBonferroni(pValues) {
  const n = pValues.length;
  const sorted = pValues.map(function(p, i) { return { p, i }; }).sort(function(a, b) { return a.p - b.p; });
  const adj = new Array(n);
  let prevAdj = 0;
  sorted.forEach(function(item, rank) {
    const adjP = Math.min(1, Math.max(prevAdj, item.p * (n - rank)));
    adj[item.i] = f4(adjP);
    prevAdj = adjP;
  });
  return adj;
}

function holmBonferroniPosthoc(groups) {
  req(groups.length, 2, 'Holm-Bonferroni post-hoc groups');
  var allVals = [].concat.apply([], groups.map(function(g) { return g.vals; }));
  var k = groups.length;
  var n = allVals.length;
  var ssW = groups.reduce(function(s, g) { var gm = mean(g.vals); return s + g.vals.reduce(function(ss, v) { return ss + (v - gm) * (v - gm); }, 0); }, 0);
  var dfW = n - k;
  var msW = dfW > 0 ? ssW / dfW : NaN;
  var pairs = [];
  for (var i = 0; i < groups.length; i++) {
    for (var j = i + 1; j < groups.length; j++) {
      var ni = groups[i].vals.length, nj = groups[j].vals.length;
      var mi = mean(groups[i].vals), mj = mean(groups[j].vals);
      var diff = mi - mj;
      var se = Math.sqrt(msW * (1 / ni + 1 / nj));
      var t_val = se > 0 ? diff / se : NaN;
      var p_raw = isFinite(t_val) ? tP(Math.abs(t_val), dfW) : NaN;
      pairs.push({ a: groups[i].label, b: groups[j].label, diff, se, t: t_val, df: dfW, p_raw });
    }
  }
  var pAdjArr = holmBonferroni(pairs.map(function(pr) { return isFinite(pr.p_raw) ? pr.p_raw : 1; }));
  return pairs.map(function(pr, idx) {
    var p_adj = parseFloat(pAdjArr[idx]);
    return {
      a: pr.a, b: pr.b,
      diff: f4(pr.diff), se: f4(pr.se),
      t: f4(pr.t), df: pr.df,
      p_raw: f4(pr.p_raw), p: f4(p_adj), p_fmt: pFmt(p_adj),
      sig: p_adj < 0.05
    };
  });
}
