// Fitur: Canonical Correlation Analysis / CCA (kategori Analyze: Correlation)
//   canonicalCorr
// Depends on: engine-core-distributions.js, engine-core-helpers.js, engine-core-matrix.js

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
      name: name, loadings: idx.map(function(ei) {
        var s = 0; Rxx[i].forEach(function(v, j) { s += v * eig.vectors[j][ei]; }); return f4(s);
      })
    };
  });
  var yLoadings = yNames.map(function(name, i) {
    return {
      name: name, loadings: yVecsMat.map(function(vy) {
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
