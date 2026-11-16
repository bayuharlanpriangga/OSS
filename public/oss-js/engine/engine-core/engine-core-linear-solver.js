// Fitur: Gaussian elimination & Gauss-Jordan matrix inversion untuk IRLS count regression
//   solveLinear, invertMatrix
// Depends on: tidak ada (pure math)

function solveLinear(A, b, k) {
  var M = []; for (var i = 0; i < k; i++) { M.push(A[i].slice()); M[i].push(b[i]); }
  for (var col = 0; col < k; col++) {
    var pivot = col; for (var row = col + 1; row < k; row++) if (Math.abs(M[row][col]) > Math.abs(M[pivot][col])) pivot = row;
    var tmp = M[col]; M[col] = M[pivot]; M[pivot] = tmp;
    if (Math.abs(M[col][col]) < 1e-14) continue;
    for (var row = 0; row < k; row++) { if (row === col) continue; var f = M[row][col] / M[col][col]; for (var c = col; c <= k; c++) M[row][c] -= f * M[col][c]; }
  }
  var x = []; for (var i = 0; i < k; i++) x.push(M[i][k] / (M[i][i] || 1e-14));
  return x;
}

function invertMatrix(A, k) {
  var M = []; for (var i = 0; i < k; i++) { M.push(A[i].slice()); }
  var I = []; for (var i = 0; i < k; i++) { I.push(new Array(k).fill(0)); I[i][i] = 1; }
  for (var col = 0; col < k; col++) {
    var pivot = col; for (var row = col + 1; row < k; row++) if (Math.abs(M[row][col]) > Math.abs(M[pivot][col])) pivot = row;
    var tmp = M[col]; M[col] = M[pivot]; M[pivot] = tmp; tmp = I[col]; I[col] = I[pivot]; I[pivot] = tmp;
    var d = M[col][col]; if (Math.abs(d) < 1e-14) return null;
    for (var c = 0; c < k; c++) { M[col][c] /= d; I[col][c] /= d; }
    for (var row = 0; row < k; row++) { if (row === col) continue; var f = M[row][col]; for (var c = 0; c < k; c++) { M[row][c] -= f * M[col][c]; I[row][c] -= f * I[col][c]; } }
  }
  return I;
}
