// Fitur: Exploratory Factor Analysis / EFA (+ KMO + Bartlett + Varimax) (kategori Analyze: Factor Analysis)
//   efa, kmoLabel
// Depends on: engine-core-distributions.js, engine-core-helpers.js, engine-core-matrix.js

function efa(matrix2d, nFactors, rotation) {
  var p = matrix2d.length;
  var n = matrix2d[0].length;
  if (n < p + 1) throw new Error('Need more observations than variables (N > p)');
  if (nFactors < 1 || nFactors > p) throw new Error('Invalid number of factors');

  var R = [];
  for (var i = 0; i < p; i++) {
    R[i] = [];
    for (var j = 0; j < p; j++) {
      if (i === j) { R[i][j] = 1; continue; }
      var xi = matrix2d[i], xj = matrix2d[j];
      var mx = mean(xi), my = mean(xj);
      var num = 0, dxi = 0, dxj = 0;
      for (var k = 0; k < n; k++) { num += (xi[k] - mx) * (xj[k] - my); dxi += (xi[k] - mx) * (xi[k] - mx); dxj += (xj[k] - my) * (xj[k] - my); }
      R[i][j] = (dxi > 0 && dxj > 0) ? num / Math.sqrt(dxi * dxj) : 0;
    }
  }

  var sumR2 = 0, sumA2 = 0;
  var kmo = NaN;
  try {
    var Rinv = matInv(R);
    for (var i = 0; i < p; i++) for (var j = 0; j < p; j++) {
      if (i === j) continue;
      sumR2 += R[i][j] * R[i][j];
      var pij = -Rinv[i][j] / Math.sqrt(Rinv[i][i] * Rinv[j][j]);
      sumA2 += pij * pij;
    }
    kmo = sumR2 / (sumR2 + sumA2);
  } catch (e) { kmo = NaN; }

  var lnDetR = 0;
  try { lnDetR = Math.log(Math.abs(matDet(R))); } catch (e) { lnDetR = NaN; }
  var chi2 = NaN, bartDf = NaN, bartP = NaN;
  if (isFinite(lnDetR)) {
    chi2 = -(n - 1 - (2 * p + 5) / 6) * lnDetR;
    bartDf = p * (p - 1) / 2;
    bartP = chi2P(Math.max(0, chi2), bartDf);
  }

  var eigResult = jacobiEigen(R, 100);
  var eigenvalues = eigResult.values;
  var eigenvectors = eigResult.vectors;

  var order = eigenvalues.map(function(_, i) { return i; }).sort(function(a, b) { return eigenvalues[b] - eigenvalues[a]; });
  var sortedEval = order.map(function(i) { return eigenvalues[i]; });
  var sortedEvec = order.map(function(idx) {
    var col = eigenvectors.map(function(row) { return row[idx]; });
    if (col.reduce(function(a, b) { return a + b; }, 0) < 0) col = col.map(function(x) { return -x; });
    return col;
  });

  var loadings = [];
  for (var i = 0; i < p; i++) {
    loadings[i] = [];
    for (var f = 0; f < nFactors; f++) {
      var ev = sortedEval[f];
      loadings[i][f] = sortedEvec[f][i] * Math.sqrt(Math.max(0, ev));
    }
  }

  if (rotation === 'varimax' && nFactors > 1) {
    loadings = varimaxRotate(loadings, p, nFactors);
  }

  var communalities = loadings.map(function(row) { return row.reduce(function(s, l) { return s + l * l; }, 0); });

  var varExp = [];
  for (var f = 0; f < nFactors; f++) {
    var ss = 0;
    for (var i = 0; i < p; i++) ss += loadings[i][f] * loadings[i][f];
    varExp[f] = ss / p;
  }
  var cumVar = []; var cv = 0;
  varExp.forEach(function(v) { cv += v; cumVar.push(cv); });

  return {
    R: R,
    eigenvalues: sortedEval.map(f4),
    loadings: loadings.map(function(row) { return row.map(f4); }),
    communalities: communalities.map(f4),
    varExp: varExp.map(function(v) { return f4(v * 100); }),
    cumVar: cumVar.map(function(v) { return f4(v * 100); }),
    kmo: isFinite(kmo) ? f4(kmo) : 'N/A',
    kmoInterp: kmoLabel(kmo),
    chi2: isFinite(chi2) ? f4(chi2) : 'N/A',
    bartDf: bartDf,
    bartP: isFinite(bartP) ? f4(bartP) : 'N/A',
    bartSig: bartP < 0.05,
    nFactors: nFactors, p: p, n: n,
    rotation: rotation
  };
}

function kmoLabel(kmo) {
  if (!isFinite(kmo)) return '—';
  if (kmo >= 0.9) return 'Marvelous';
  if (kmo >= 0.8) return 'Meritorious';
  if (kmo >= 0.7) return 'Middling';
  if (kmo >= 0.6) return 'Mediocre';
  if (kmo >= 0.5) return 'Miserable';
  return 'Unacceptable';
}
