// Fitur: Operasi aljabar matriks (flat row-major & 2D array), eigendecomposition Jacobi, & rotasi Varimax
//   matMulFlat, matTFlat, matDetFlat, matInvFlat,
//   jacobiEigen, matMul, matT, matDet, matInv, varimaxRotate
// Depends on: tidak ada (pure math)

// Flat row-major Matrix Engine (dipakai OLS multipleReg)
function matMulFlat(A, m, n, B, p) {
  const C = new Array(m * p).fill(0);
  for (let i = 0; i < m; i++) for (let k = 0; k < n; k++) if (A[i * n + k] !== 0)
    for (let j = 0; j < p; j++) C[i * p + j] += A[i * n + k] * B[k * p + j];
  return C;
}

function matTFlat(A, m, n) {
  const T = new Array(n * m);
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) T[j * m + i] = A[i * n + j];
  return T;
}

function matDetFlat(A, n) {
  const M = A.slice(); let det = 1;
  for (let col = 0; col < n; col++) {
    let maxR = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r * n + col]) > Math.abs(M[maxR * n + col])) maxR = r;
    if (maxR !== col) { for (let j = 0; j < n; j++) { const t = M[col * n + j]; M[col * n + j] = M[maxR * n + j]; M[maxR * n + j] = t; } det *= -1; }
    if (Math.abs(M[col * n + col]) < 1e-12) return 0;
    det *= M[col * n + col];
    for (let r = col + 1; r < n; r++) { const f = M[r * n + col] / M[col * n + col]; for (let j = col; j < n; j++) M[r * n + j] -= f * M[col * n + j]; }
  }
  return det;
}

function matInvFlat(A, n) {
  if (Math.abs(matDetFlat(A, n)) < 1e-10) throw new Error('Matrix near-singular — multicollinearity detected. Remove correlated predictors.');
  const aug = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) aug.push(A[i * n + j]);
    for (let j = 0; j < n; j++) aug.push(i === j ? 1 : 0);
  }
  const W = 2 * n;
  for (let col = 0; col < n; col++) {
    let maxR = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(aug[r * W + col]) > Math.abs(aug[maxR * W + col])) maxR = r;
    if (maxR !== col) for (let j = 0; j < W; j++) { const t = aug[col * W + j]; aug[col * W + j] = aug[maxR * W + j]; aug[maxR * W + j] = t; }
    const piv = aug[col * W + col];
    if (Math.abs(piv) < 1e-14) throw new Error('Matrix is singular — multicollinearity detected');
    for (let j = 0; j < W; j++) aug[col * W + j] /= piv;
    for (let r = 0; r < n; r++) if (r !== col) {
      const f = aug[r * W + col];
      for (let j = 0; j < W; j++) aug[r * W + j] -= f * aug[col * W + j];
    }
  }
  const inv = new Array(n * n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) inv[i * n + j] = aug[i * W + n + j];
  return inv;
}

// 2D Array Matrix Engine & Decompositions (CCA, EFA, CFA, MANOVA, Logistic)
function jacobiEigen(A, maxIter) {
  var n = A.length;
  var a = A.map(function(row) { return row.slice(); });
  var V = []; for (var i = 0; i < n; i++) { V[i] = []; for (var j = 0; j < n; j++) V[i][j] = i === j ? 1 : 0; }
  for (var iter = 0; iter < maxIter * n * n; iter++) {
    var p = 0, q = 1, max = 0;
    for (var i = 0; i < n; i++) for (var j = i + 1; j < n; j++) {
      var v = Math.abs(a[i][j]); if (v > max) { max = v; p = i; q = j; }
    }
    if (max < 1e-10) break;
    var theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
    var t = theta >= 0 ? 1 / (theta + Math.sqrt(1 + theta * theta)) : 1 / (theta - Math.sqrt(1 + theta * theta));
    var c = 1 / Math.sqrt(1 + t * t), s = t * c;
    var G = []; for (var i = 0; i < n; i++) { G[i] = []; for (var j = 0; j < n; j++) G[i][j] = i === j ? 1 : 0; }
    G[p][p] = c; G[q][q] = c; G[p][q] = s; G[q][p] = -s;
    a = matMul(matMul(matT(G), a), G);
    V = matMul(V, G);
  }
  return { values: a.map(function(_, i) { return a[i][i]; }), vectors: V };
}

function matMul(A, B) {
  var n = A.length, m = B[0].length, k = B.length;
  var C = []; for (var i = 0; i < n; i++) { C[i] = []; for (var j = 0; j < m; j++) { var s = 0; for (var l = 0; l < k; l++) s += A[i][l] * B[l][j]; C[i][j] = s; } }
  return C;
}

function matT(A) {
  return A[0].map(function(_, j) { return A.map(function(row) { return row[j]; }); });
}

function matDet(M) {
  var n = M.length;
  if (n === 1) return M[0][0];
  if (n === 2) return M[0][0] * M[1][1] - M[0][1] * M[1][0];
  var d = 0;
  for (var j = 0; j < n; j++) {
    var sub = M.slice(1).map(function(row) { return row.filter(function(_, k) { return k !== j; }); });
    d += ((j % 2 === 0) ? 1 : -1) * M[0][j] * matDet(sub);
  }
  return d;
}

function matInv(M) {
  var n = M.length;
  var aug = M.map(function(row, i) { var r = row.slice(); for (var j = 0; j < n; j++) r.push(i === j ? 1 : 0); return r; });
  for (var col = 0; col < n; col++) {
    var pivRow = col;
    for (var row = col + 1; row < n; row++) if (Math.abs(aug[row][col]) > Math.abs(aug[pivRow][col])) pivRow = row;
    var tmp = aug[col]; aug[col] = aug[pivRow]; aug[pivRow] = tmp;
    var pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-12) throw new Error('Singular matrix');
    for (var j = 0; j < 2 * n; j++) aug[col][j] /= pivot;
    for (var row = 0; row < n; row++) {
      if (row === col) continue;
      var factor = aug[row][col];
      for (var j = 0; j < 2 * n; j++) aug[row][j] -= factor * aug[col][j];
    }
  }
  return aug.map(function(row) { return row.slice(n); });
}

// Varimax rotation: Kaiser's algorithm
function varimaxRotate(L, p, m) {
  for (var iter = 0; iter < 200; iter++) {
    var maxRot = 0;
    for (var i = 0; i < m - 1; i++) for (var j = i + 1; j < m; j++) {
      var u = [], v = [];
      for (var k = 0; k < p; k++) { u.push(L[k][i] * L[k][i] - L[k][j] * L[k][j]); v.push(2 * L[k][i] * L[k][j]); }
      var A = u.reduce(function(s, x) { return s + x; }, 0) / p;
      var B = v.reduce(function(s, x) { return s + x; }, 0) / p;
      var C = u.reduce(function(s, x, k) { return s + (x * x - v[k] * v[k]); }, 0) / p;
      var D = u.reduce(function(s, x, k) { return s + x * v[k]; }, 0) / p * 2;
      var X = C - A * A + B * B; var Y = D - 2 * A * B;
      var phi = Math.atan2(Y, X) / 4;
      if (Math.abs(phi) < 1e-6) continue;
      maxRot = Math.max(maxRot, Math.abs(phi));
      var cp = Math.cos(phi), sp = Math.sin(phi);
      for (var k = 0; k < p; k++) { var li = L[k][i], lj = L[k][j]; L[k][i] = cp * li + sp * lj; L[k][j] = -sp * li + cp * lj; }
    }
    if (maxRot < 1e-7) break;
  }
  for (var j = 0; j < m; j++) {
    var maxAbs = 0, maxI = 0;
    for (var i = 0; i < p; i++) if (Math.abs(L[i][j]) > maxAbs) { maxAbs = Math.abs(L[i][j]); maxI = i; }
    if (L[maxI][j] < 0) for (var i = 0; i < p; i++) L[i][j] = -L[i][j];
  }
  return L;
}
