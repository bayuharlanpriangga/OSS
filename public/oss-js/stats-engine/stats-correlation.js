// Fitur: Analisis Korelasi (kategori Analyze: Correlation)
//   pearsonR, spearmanR, partialCorr, canonicalCorr
// Depends on: stats-distributions.js, stats-helpers.js, stats-matrix.js

// Pearson r (pairwise)
function pearsonR(ax, ay) {
  const { xs, ys, n } = validPairs(ax, ay); req(n, 3, 'Pearson r');
  const mx = mean(xs), my = mean(ys);
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const den = Math.sqrt(xs.reduce((s, x) => s + (x - mx) * (x - mx), 0) * ys.reduce((s, y) => s + (y - my) * (y - my), 0));
  if (den === 0) throw new Error('Zero variance — correlation undefined');
  const r = num / den, t2 = r * Math.sqrt((n - 2) / (1 - r * r));
  const p = tP(Math.abs(t2), n - 2);
  const fz = 0.5 * Math.log((1 + r) / (1 - r)), sez = 1 / Math.sqrt(n - 3);
  const zCrit95 = normInv(0.975);
  return {
    r: f4(r), r2: f4(r * r), p: f4(p), p_fmt: pFmt(p), sig: p < .05, n,
    ci95: '[' + f4(Math.tanh(fz - zCrit95 * sez)) + ', ' + f4(Math.tanh(fz + zCrit95 * sez)) + ']',
    strength: Math.abs(r) > .7 ? 'Strong' : Math.abs(r) > .4 ? 'Moderate' : Math.abs(r) > .1 ? 'Weak' : 'Negligible',
    direction: r >= 0 ? 'positive' : 'negative'
  };
}

// Spearman r
function spearmanR(ax, ay) {
  const { xs, ys, n } = validPairs(ax, ay); req(n, 3, 'Spearman r');
  function ranks(arr) {
    const idx = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
    const r = new Array(n); let pos = 0;
    while (pos < n) {
      let j = pos; while (j < n && idx[j].v === idx[pos].v) j++;
      const avg = (pos + j + 1) / 2; for (let k = pos; k < j; k++) r[idx[k].i] = avg; pos = j;
    }
    return r;
  }
  return pearsonR(ranks(xs), ranks(ys));
}

// Partial Correlation (Pearson r between X and Y controlling for Z)
function partialCorr(xArr, yArr, zArr) {
  req(xArr.length, 5, 'Partial correlation cases');
  var triples = [];
  for (var i = 0; i < Math.min(xArr.length, yArr.length, zArr.length); i++) {
    if (isV(xArr[i]) && isV(yArr[i]) && isV(zArr[i])) triples.push([xArr[i], yArr[i], zArr[i]]);
  }
  req(triples.length, 5, 'Partial correlation valid cases');
  var xs = triples.map(function(t) { return t[0]; });
  var ys = triples.map(function(t) { return t[1]; });
  var zs = triples.map(function(t) { return t[2]; });
  var rxy = parseFloat(pearsonR(xs, ys).r);
  var rxz = parseFloat(pearsonR(xs, zs).r);
  var ryz = parseFloat(pearsonR(ys, zs).r);
  var num = rxy - rxz * ryz;
  var den = Math.sqrt((1 - rxz * rxz) * (1 - ryz * ryz));
  if (Math.abs(den) < 1e-12) throw new Error('Control variable causes zero denominator (collinearity)');
  var rp = num / den;
  rp = Math.max(-1, Math.min(1, rp));
  var n = triples.length;
  var df = n - 3;
  req(df, 1, 'Partial correlation df (need n≥5)');
  var t_val = rp * Math.sqrt(df) / Math.sqrt(Math.max(1e-12, 1 - rp * rp));
  var p_val = tP(Math.abs(t_val), df);
  var r2 = rp * rp;
  var fz = 0.5 * Math.log((1 + rp) / (1 - rp));
  var se = 1 / Math.sqrt(n - 3);
  var tc95 = tCrit(df);
  var zlo = fz - tc95 * se, zhi = fz + tc95 * se;
  var rlo = Math.tanh(zlo), rhi = Math.tanh(zhi);
  var interp = Math.abs(rp) < .1 ? 'negligible' : Math.abs(rp) < .3 ? 'small' : Math.abs(rp) < .5 ? 'moderate' : 'large';
  return {
    rp: f4(rp), r2: f4(r2), t: f4(t_val), df,
    p: f4(p_val), p_fmt: pFmt(p_val),
    ci95: '[' + f4(rlo) + ', ' + f4(rhi) + ']',
    n, rxy: f4(rxy), rxz: f4(rxz), ryz: f4(ryz),
    strength: interp, sig: p_val < 0.05
  };
}

// Canonical Correlation Analysis (CCA)
function canonicalCorr(xNames, yNames, dataArr) {
  req(dataArr.length, xNames.length + yNames.length + 3, 'CCA cases');
  var allVars = xNames.concat(yNames);
  var rows = dataArr.filter(function(r) { return allVars.every(function(v) { return isV(r[v]); }); });
  req(rows.length, xNames.length + yNames.length + 3, 'CCA complete cases');
  var n = rows.length;
  var p = xNames.length;
  var q = yNames.length;
  function colMean(names, idx) { var s = 0; rows.forEach(function(r) { s += r[names[idx]]; }); return s / n; }
  var xMeans = xNames.map(function(_, i) { return colMean(xNames, i); });
  var yMeans = yNames.map(function(_, i) { return colMean(yNames, i); });
  var X = rows.map(function(r) { return xNames.map(function(v, i) { return r[v] - xMeans[i]; }); });
  var Y = rows.map(function(r) { return yNames.map(function(v, i) { return r[v] - yMeans[i]; }); });
  function stdArr(mat, cols) {
    var sds = [];
    for (var j = 0; j < cols; j++) {
      var s = 0; mat.forEach(function(row) { s += row[j] * row[j]; }); sds.push(Math.sqrt(s / (n - 1)));
    }
    return mat.map(function(row) { return row.map(function(v, j) { return sds[j] > 0 ? v / sds[j] : 0; }); });
  }
  var Xs = stdArr(X, p);
  var Ys = stdArr(Y, q);
  function corrMat(A, B, nA, nB) {
    var R = [];
    for (var i = 0; i < nA; i++) {
      R[i] = [];
      for (var j = 0; j < nB; j++) {
        var s = 0; for (var k = 0; k < n; k++) s += A[k][i] * B[k][j];
        R[i][j] = s / (n - 1);
      }
    }
    return R;
  }
  var Rxx = corrMat(Xs, Xs, p, p);
  var Ryy = corrMat(Ys, Ys, q, q);
  var Rxy = corrMat(Xs, Ys, p, q);
  var Ryx = corrMat(Ys, Xs, q, p);
  var RxxInv, RyyInv;
  try { RxxInv = matInv(Rxx); } catch (e) { throw new Error('X-set variables are collinear. Remove redundant variables.'); }
  try { RyyInv = matInv(Ryy); } catch (e) { throw new Error('Y-set variables are collinear. Remove redundant variables.'); }
  var M = matMul(matMul(matMul(RxxInv, Rxy), RyyInv), Ryx);
  var eig = jacobiEigen(M, 100);
  var nRoots = Math.min(p, q);
  var idx = eig.values.map(function(v, i) { return i; })
    .sort(function(a, b) { return eig.values[b] - eig.values[a]; })
    .slice(0, nRoots);
  var roots = idx.map(function(i) { return Math.max(0, eig.values[i]); });
  var canR = roots.map(function(ev) { return Math.sqrt(Math.min(1, ev)); });
  var canR2 = canR.map(function(r) { return r * r; });
  var tests = [];
  for (var k = 0; k < nRoots; k++) {
    var lambda = 1;
    for (var i = k; i < nRoots; i++) lambda *= (1 - canR2[i]);
    var df = (p - k) * (q - k);
    var chiSq = -(n - 1 - (p + q + 1) / 2) * Math.log(Math.max(lambda, 1e-15));
    var pVal = chi2P(Math.max(0, chiSq), df);
    tests.push({
      root: k + 1,
      rc: f4(canR[k]),
      rc2: f4(canR2[k]),
      wilks: f4(lambda),
      chiSq: f4(chiSq),
      df: df,
      p: f4(pVal),
      p_fmt: pFmt(pVal),
      sig: pVal < 0.05
    });
  }
  var xCoefs = xNames.map(function(name, i) {
    return { name: name, coefs: idx.map(function(ei) { return f4(eig.vectors[i][ei]); }) };
  });
  var xVecs = idx.map(function(ei) { return xNames.map(function(_, i) { return eig.vectors[i][ei]; }); });
  var yVecsMat = xVecs.map(function(vx) {
    var RyxVx = Ryx.map(function(row) { return row.reduce(function(s, v, i) { return s + v * vx[i]; }, 0); });
    return RyyInv.map(function(row) { return row.reduce(function(s, v, i) { return s + v * RyxVx[i]; }, 0); });
  });
  yVecsMat = yVecsMat.map(function(vy) {
    var norm = Math.sqrt(vy.reduce(function(s, v) { return s + v * v; }, 0));
    return norm > 0 ? vy.map(function(v) { return v / norm; }) : vy;
  });
  var yCoefs = yNames.map(function(name, i) {
    return { name: name, coefs: yVecsMat.map(function(vy) { return f4(vy[i]); }) };
  });
  var xLoadings = xNames.map(function(name, i) {
    return {
      name: name, loadings: idx.map(function(ei, ki) {
        var s = 0; Rxx[i].forEach(function(v, j) { s += v * eig.vectors[j][ei]; }); return f4(s);
      })
    };
  });
  var yLoadings = yNames.map(function(name, i) {
    return {
      name: name, loadings: yVecsMat.map(function(vy, ki) {
        var s = 0; Ryy[i].forEach(function(v, j) { s += v * vy[j]; }); return f4(s);
      })
    };
  });
  return {
    n: n, p: p, q: q, nRoots: nRoots,
    tests: tests,
    xCoefs: xCoefs,
    yCoefs: yCoefs,
    xLoadings: xLoadings,
    yLoadings: yLoadings,
    xNames: xNames,
    yNames: yNames
  };
}
