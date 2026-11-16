// Fitur: Analisis Varians & Post-hoc (kategori Analyze: ANOVA)
//   levene, onewayANOVA, qrangeCDF, tukeyHSD, qrangeCDF_inv,
//   lsdPosthoc, bonferroniPosthoc, holmBonferroni, holmBonferroniPosthoc,
//   twowayANOVA, threewayANOVA, repeatedMeasuresAnova
// Depends on: stats-distributions.js, stats-helpers.js

// Levene test (median-centered Brown-Forsythe via onewayANOVA)
function levene(groups) {
  const Z = groups.map(g => { const med = quantile([...g].sort((a, b) => a - b), .5); return g.map(v => Math.abs(v - med)); });
  try { return onewayANOVA(Z.map((z, i) => ({ label: String(i), vals: z }))); } catch { return null; }
}

// One-Way ANOVA
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

// Studentized Range (q) CDF for Tukey HSD — Gleason (1999) integration
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

// Inverse q (simple binary search for CI)
function qrangeCDF_inv(p, k, df) {
  let lo = 0, hi = 20;
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; qrangeCDF(mid, k, df) < p ? lo = mid : hi = mid; }
  return (lo + hi) / 2;
}

// LSD Post-hoc (Fisher's Least Significant Difference)
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

// Bonferroni Post-hoc (pairwise t-tests with Bonferroni correction)
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

// Holm-Bonferroni correction
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

// Two-Way ANOVA
function twowayANOVA(dataArr, depVar, factorA, factorB) {
  var rows = dataArr.filter(function(r) {
    return isV(Number(r[depVar])) &&
      r[factorA] !== null && r[factorA] !== undefined && r[factorA] !== '' &&
      r[factorB] !== null && r[factorB] !== undefined && r[factorB] !== '';
  });
  var n = rows.length;
  req(n, 4, 'Two-Way ANOVA');

  var levA = [...new Set(rows.map(function(r) { return String(r[factorA]); }))].sort();
  var levB = [...new Set(rows.map(function(r) { return String(r[factorB]); }))].sort();
  req(levA.length, 2, 'Factor A must have ≥2 levels');
  req(levB.length, 2, 'Factor B must have ≥2 levels');

  var yAll = rows.map(function(r) { return Number(r[depVar]); });
  var grandMean = mean(yAll);
  var ssTotal = yAll.reduce(function(s, y) { return s + (y - grandMean) * (y - grandMean); }, 0);

  var cells = {};
  levA.forEach(function(a) {
    cells[a] = {};
    levB.forEach(function(b) {
      var vs = rows.filter(function(r) { return String(r[factorA]) === a && String(r[factorB]) === b; })
        .map(function(r) { return Number(r[depVar]); });
      cells[a][b] = { n: vs.length, mean: vs.length ? mean(vs) : NaN, vals: vs };
    });
  });

  var meanA = {};
  levA.forEach(function(a) {
    var vs = rows.filter(function(r) { return String(r[factorA]) === a; }).map(function(r) { return Number(r[depVar]); });
    meanA[a] = { n: vs.length, mean: mean(vs) };
  });
  var meanB = {};
  levB.forEach(function(b) {
    var vs = rows.filter(function(r) { return String(r[factorB]) === b; }).map(function(r) { return Number(r[depVar]); });
    meanB[b] = { n: vs.length, mean: mean(vs) };
  });

  var ssA = levA.reduce(function(s, a) {
    return s + meanA[a].n * Math.pow(meanA[a].mean - grandMean, 2);
  }, 0);
  var dfA = levA.length - 1;

  var ssB = levB.reduce(function(s, b) {
    return s + meanB[b].n * Math.pow(meanB[b].mean - grandMean, 2);
  }, 0);
  var dfB = levB.length - 1;

  var ssCells = 0;
  levA.forEach(function(a) {
    levB.forEach(function(b) {
      var c = cells[a][b];
      if (c.n > 0 && isFinite(c.mean)) {
        ssCells += c.n * Math.pow(c.mean - grandMean, 2);
      }
    });
  });
  var ssAB = ssCells - ssA - ssB;
  var dfAB = dfA * dfB;

  var ssError = 0;
  levA.forEach(function(a) {
    levB.forEach(function(b) {
      var c = cells[a][b];
      var cm = c.mean;
      c.vals.forEach(function(v) { ssError += (v - cm) * (v - cm); });
    });
  });
  var dfError = n - levA.length * levB.length;

  var msA = dfA > 0 ? ssA / dfA : NaN;
  var msB = dfB > 0 ? ssB / dfB : NaN;
  var msAB = dfAB > 0 ? ssAB / dfAB : NaN;
  var msError = dfError > 0 ? ssError / dfError : NaN;

  var FA = msError > 0 ? msA / msError : NaN;
  var FB = msError > 0 ? msB / msError : NaN;
  var FAB = msError > 0 ? msAB / msError : NaN;

  var pA = isFinite(FA) && FA > 0 ? 1 - fCDF(FA, dfA, dfError) : NaN;
  var pB = isFinite(FB) && FB > 0 ? 1 - fCDF(FB, dfB, dfError) : NaN;
  var pAB = isFinite(FAB) && FAB > 0 ? 1 - fCDF(FAB, dfAB, dfError) : NaN;

  var eta2A = ssTotal > 0 ? ssA / ssTotal : 0;
  var eta2B = ssTotal > 0 ? ssB / ssTotal : 0;
  var eta2AB = ssTotal > 0 ? ssAB / ssTotal : 0;
  var pEta2A = (ssA + ssError) > 0 ? ssA / (ssA + ssError) : 0;
  var pEta2B = (ssB + ssError) > 0 ? ssB / (ssB + ssError) : 0;
  var pEta2AB = (ssAB + ssError) > 0 ? ssAB / (ssAB + ssError) : 0;

  var cellMeansTable = levA.map(function(a) {
    return {
      level: a, byB: levB.map(function(b) {
        return { level: b, mean: cells[a][b].mean, n: cells[a][b].n };
      })
    };
  });

  return {
    n, depVar, factorA, factorB,
    levA, levB, grandMean: f4(grandMean),
    effects: [
      { source: factorA, SS: f4(ssA), df: dfA, MS: f4(msA), F: f4(FA), p: f4(pA), p_fmt: pFmt(pA), sig: pA < 0.05, eta2: f4(eta2A), pEta2: f4(pEta2A) },
      { source: factorB, SS: f4(ssB), df: dfB, MS: f4(msB), F: f4(FB), p: f4(pB), p_fmt: pFmt(pB), sig: pB < 0.05, eta2: f4(eta2B), pEta2: f4(pEta2B) },
      { source: factorA + '×' + factorB, SS: f4(ssAB), df: dfAB, MS: f4(msAB), F: f4(FAB), p: f4(pAB), p_fmt: pFmt(pAB), sig: pAB < 0.05, eta2: f4(eta2AB), pEta2: f4(pEta2AB) }
    ],
    error: { SS: f4(ssError), df: dfError, MS: f4(msError) },
    total: { SS: f4(ssTotal), df: n - 1 },
    cellMeansTable,
    meanA: levA.map(function(a) { return { level: a, mean: f4(meanA[a].mean), n: meanA[a].n }; }),
    meanB: levB.map(function(b) { return { level: b, mean: f4(meanB[b].mean), n: meanB[b].n }; }),
  };
}

// Three-Way ANOVA (Factorial A×B×C) — Type I SS
function threewayANOVA(dataArr, depVar, factorA, factorB, factorC) {
  var rows = dataArr.filter(function(r) {
    return isV(Number(r[depVar])) &&
      r[factorA] !== null && r[factorA] !== undefined && r[factorA] !== '' &&
      r[factorB] !== null && r[factorB] !== undefined && r[factorB] !== '' &&
      r[factorC] !== null && r[factorC] !== undefined && r[factorC] !== '';
  });
  var n = rows.length;
  req(n, 8, 'Three-Way ANOVA');

  var levA = [...new Set(rows.map(function(r) { return String(r[factorA]); }))].sort();
  var levB = [...new Set(rows.map(function(r) { return String(r[factorB]); }))].sort();
  var levC = [...new Set(rows.map(function(r) { return String(r[factorC]); }))].sort();
  req(levA.length, 2, 'Factor A must have ≥2 levels');
  req(levB.length, 2, 'Factor B must have ≥2 levels');
  req(levC.length, 2, 'Factor C must have ≥2 levels');

  var yAll = rows.map(function(r) { return Number(r[depVar]); });
  var grandMean = mean(yAll);
  var ssTotal = yAll.reduce(function(s, y) { return s + (y - grandMean) * (y - grandMean); }, 0);

  function cellVals(a, b, c) {
    return rows.filter(function(r) {
      return (a === null || String(r[factorA]) === a) &&
        (b === null || String(r[factorB]) === b) &&
        (c === null || String(r[factorC]) === c);
    }).map(function(r) { return Number(r[depVar]); });
  }

  var mA = {}, mB = {}, mC = {};
  levA.forEach(function(a) { var vs = cellVals(a, null, null); mA[a] = { n: vs.length, m: mean(vs) }; });
  levB.forEach(function(b) { var vs = cellVals(null, b, null); mB[b] = { n: vs.length, m: mean(vs) }; });
  levC.forEach(function(c) { var vs = cellVals(null, null, c); mC[c] = { n: vs.length, m: mean(vs) }; });

  var mAB = {}, mAC = {}, mBC = {};
  levA.forEach(function(a) { levB.forEach(function(b) { var vs = cellVals(a, b, null); mAB[a + '_' + b] = { n: vs.length, m: mean(vs) }; }); });
  levA.forEach(function(a) { levC.forEach(function(c) { var vs = cellVals(a, null, c); mAC[a + '_' + c] = { n: vs.length, m: mean(vs) }; }); });
  levB.forEach(function(b) { levC.forEach(function(c) { var vs = cellVals(null, b, c); mBC[b + '_' + c] = { n: vs.length, m: mean(vs) }; }); });

  var ssA = levA.reduce(function(s, a) { return s + mA[a].n * Math.pow(mA[a].m - grandMean, 2); }, 0);
  var ssB = levB.reduce(function(s, b) { return s + mB[b].n * Math.pow(mB[b].m - grandMean, 2); }, 0);
  var ssC = levC.reduce(function(s, c) { return s + mC[c].n * Math.pow(mC[c].m - grandMean, 2); }, 0);
  var dfA = levA.length - 1, dfB = levB.length - 1, dfC = levC.length - 1;

  var ssABcells = 0;
  levA.forEach(function(a) { levB.forEach(function(b) { var v = mAB[a + '_' + b]; if (v.n > 0) ssABcells += v.n * Math.pow(v.m - grandMean, 2); }); });
  var ssAB = ssABcells - ssA - ssB;
  var dfAB = dfA * dfB;

  var ssACcells = 0;
  levA.forEach(function(a) { levC.forEach(function(c) { var v = mAC[a + '_' + c]; if (v.n > 0) ssACcells += v.n * Math.pow(v.m - grandMean, 2); }); });
  var ssAC = ssACcells - ssA - ssC;
  var dfAC = dfA * dfC;

  var ssBCcells = 0;
  levB.forEach(function(b) { levC.forEach(function(c) { var v = mBC[b + '_' + c]; if (v.n > 0) ssBCcells += v.n * Math.pow(v.m - grandMean, 2); }); });
  var ssBC = ssBCcells - ssB - ssC;
  var dfBC = dfB * dfC;

  var ssABCcells = 0;
  levA.forEach(function(a) {
    levB.forEach(function(b) {
      levC.forEach(function(c) {
        var vs = cellVals(a, b, c); if (!vs.length) return;
        ssABCcells += vs.length * Math.pow(mean(vs) - grandMean, 2);
      });
    });
  });
  var ssABC = ssABCcells - ssA - ssB - ssC - ssAB - ssAC - ssBC;
  var dfABC = dfA * dfB * dfC;

  var totalCells = levA.length * levB.length * levC.length;
  var emptyCells = [], singletonCells = [];
  levA.forEach(function(a) {
    levB.forEach(function(b) {
      levC.forEach(function(c) {
        var vs = cellVals(a, b, c);
        var key = a + '×' + b + '×' + c;
        if (vs.length === 0) emptyCells.push(key);
        else if (vs.length === 1) singletonCells.push(key);
      });
    });
  });
  var _nCellsCheck = 0;
  levA.forEach(function(a) {
    levB.forEach(function(b) {
      levC.forEach(function(c) {
        if (cellVals(a, b, c).length > 0) _nCellsCheck++;
      });
    });
  });
  var _dfErrCheck = n - _nCellsCheck;
  if (_dfErrCheck <= 0) {
    throw new Error(
      '🔴 Model singular: ' + emptyCells.length + ' of ' + totalCells + ' cells are empty. ' +
      'dfError = ' + _dfErrCheck + ' ≤ 0 — within-cell error cannot be estimated. ' +
      'Try reducing factor levels, merging sparse groups, or using Two-Way ANOVA.'
    );
  }
  var sparseWarnings = [];
  if (emptyCells.length > 0) {
    sparseWarnings.push({
      level: 'warning', icon: '🟠',
      msg: emptyCells.length + ' empty cell(s) (' + Math.round(emptyCells.length / totalCells * 100) + '% of ' + totalCells + ' cells). ' +
        'These combinations are excluded from SS computation. Affected interaction effects may be biased.',
      cells: emptyCells
    });
  }
  if (singletonCells.length > 0) {
    sparseWarnings.push({
      level: 'caution', icon: '🟡',
      msg: singletonCells.length + ' cell(s) with n=1. SE and effect sizes for these cells are unreliable.',
      cells: singletonCells
    });
  }

  var ssError = 0, nCells = 0;
  levA.forEach(function(a) {
    levB.forEach(function(b) {
      levC.forEach(function(c) {
        var vs = cellVals(a, b, c); if (!vs.length) return;
        var cm = mean(vs); nCells++;
        vs.forEach(function(v) { ssError += (v - cm) * (v - cm); });
      });
    });
  });
  var dfError = n - nCells;

  function effect(source, ss, df) {
    var ms = df > 0 ? ss / df : NaN;
    var msE = dfError > 0 ? ssError / dfError : NaN;
    var F = msE > 0 ? ms / msE : NaN;
    var p = isFinite(F) && F > 0 ? 1 - fCDF(F, df, dfError) : NaN;
    var eta2 = ssTotal > 0 ? ss / ssTotal : 0;
    var pEta2 = (ss + ssError) > 0 ? ss / (ss + ssError) : 0;
    return { source, SS: f4(ss), df, MS: f4(ms), F: f4(F), p: f4(p), p_fmt: pFmt(p), sig: p < 0.05, eta2: f4(eta2), pEta2: f4(pEta2) };
  }
  var msError = dfError > 0 ? ssError / dfError : NaN;

  var cellMeansAB = levA.map(function(a) {
    return {
      level: a, byB: levB.map(function(b) {
        var v = mAB[a + '_' + b]; return { level: b, mean: f4(v.m), n: v.n, empty: v.n === 0 };
      })
    };
  });

  return {
    n, depVar, factorA, factorB, factorC,
    levA, levB, levC, grandMean: f4(grandMean),
    effects: [
      effect(factorA, ssA, dfA),
      effect(factorB, ssB, dfB),
      effect(factorC, ssC, dfC),
      effect(factorA + '×' + factorB, ssAB, dfAB),
      effect(factorA + '×' + factorC, ssAC, dfAC),
      effect(factorB + '×' + factorC, ssBC, dfBC),
      effect(factorA + '×' + factorB + '×' + factorC, ssABC, dfABC),
    ],
    sparseWarnings,
    emptyCells, singletonCells, totalCells, nCells,
    error: { SS: f4(ssError), df: dfError, MS: f4(msError) },
    total: { SS: f4(ssTotal), df: n - 1 },
    cellMeansAB,
    meanA: levA.map(function(a) { return { level: a, mean: f4(mA[a].m), n: mA[a].n }; }),
    meanB: levB.map(function(b) { return { level: b, mean: f4(mB[b].m), n: mB[b].n }; }),
    meanC: levC.map(function(c) { return { level: c, mean: f4(mC[c].m), n: mC[c].n }; }),
  };
}

// Repeated Measures ANOVA (one-way within-subjects)
function repeatedMeasuresAnova(groups, labels) {
  const k = groups.length;
  if (k < 3) throw new Error('RM-ANOVA membutuhkan ≥3 titik waktu');
  const rawN = groups[0].length;
  const valid = [];
  for (let i = 0; i < rawN; i++) {
    const row = groups.map(g => g[i]);
    if (row.every(v => isV(v))) valid.push(row);
  }
  const n = valid.length;
  if (n < 3) throw new Error('Tidak cukup data lengkap (butuh ≥3 subjek dengan semua titik waktu)');
  const allVals = valid.flat();
  const grandMean = allVals.reduce((a, b) => a + b, 0) / allVals.length;
  const tMeans = groups.map((_, j) => {
    const col = valid.map(r => r[j]);
    return col.reduce((a, b) => a + b, 0) / n;
  });
  const sMeans = valid.map(r => r.reduce((a, b) => a + b, 0) / k);
  const SSB = n * tMeans.reduce((a, m) => a + (m - grandMean) * (m - grandMean), 0);
  const SSS = k * sMeans.reduce((a, m) => a + (m - grandMean) * (m - grandMean), 0);
  const SST = valid.flat().reduce((a, v) => a + (v - grandMean) * (v - grandMean), 0);
  const SSE = SST - SSB - SSS;
  const dfB = k - 1, dfS = n - 1, dfE = (k - 1) * (n - 1);
  const MSB = SSB / dfB, MSE = SSE / dfE;
  if (MSE <= 0) throw new Error('MSE ≤ 0; periksa data');
  const F = MSB / MSE;
  const p = 1 - fCDF(F, dfB, dfE);
  const etaSq = SSB / (SSB + SSE);
  const interp = etaSq >= 0.14 ? 'Large' : etaSq >= 0.06 ? 'Medium' : 'Small';
  return {
    F: f4(F), p: f4(p), p_fmt: pFmt(p), sig: p < .05,
    k, n, dfB, dfE: dfE, dfS,
    MSB: f4(MSB), MSE: f4(MSE),
    SSB: f4(SSB), SSE: f4(SSE), SSS: f4(SSS), SST: f4(SST),
    etaSq: f4(etaSq), etaInterp: interp,
    tMeans: tMeans.map(m => f4(m)),
    labels: labels || groups.map((_, i) => 'T' + (i + 1))
  };
}
