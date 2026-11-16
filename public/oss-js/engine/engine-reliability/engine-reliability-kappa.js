// Fitur: Uji Reliabilitas Inter-Rater Cohen's Kappa (kategori Analyze: Reliability)
//   cohenKappa
// Depends on: engine-core-distributions.js, engine-core-helpers.js

function cohenKappa(rater1, rater2) {
  const n = rater1.length;
  req(n, 2, 'Kappa cases');
  if (n !== rater2.length) throw new Error('Raters must have same length');
  const cats = [...new Set([...rater1, ...rater2])].sort(function(a, b) { return String(a) < String(b) ? -1 : 1; });
  const k = cats.length;
  if (k < 2) throw new Error('Need ≥2 categories');
  const mat = cats.map(function() { return cats.map(function() { return 0; }); });
  for (let i = 0; i < n; i++) {
    const r = cats.indexOf(rater1[i]);
    const c = cats.indexOf(rater2[i]);
    if (r >= 0 && c >= 0) mat[r][c]++;
  }
  const rowSum = mat.map(function(row) { return row.reduce(function(a, b) { return a + b; }, 0); });
  const colSum = cats.map(function(_, j) { return mat.reduce(function(s, row) { return s + row[j]; }, 0); });
  const total = rowSum.reduce(function(a, b) { return a + b; }, 0);
  let po = 0;
  for (let i = 0; i < k; i++) po += mat[i][i];
  po /= total;
  let pe = 0;
  for (let i = 0; i < k; i++) pe += (rowSum[i] / total) * (colSum[i] / total);
  const kappa = pe < 1 ? (po - pe) / (1 - pe) : 1;
  let varK = 0;
  for (let i = 0; i < k; i++) {
    varK += (mat[i][i] / total) * Math.pow(1 - (rowSum[i] + colSum[i]) / total * (1 - kappa), 2);
  }
  for (let i = 0; i < k; i++) {
    for (let j = 0; j < k; j++) {
      if (i === j) continue;
      varK += (mat[i][j] / total) * Math.pow((rowSum[i] + colSum[j]) / total, 2);
    }
  }
  varK = varK - Math.pow(kappa - pe * (1 - kappa), 2);
  const seK = total > 0 ? Math.sqrt(Math.abs(varK) / total) : 0;
  const z = seK > 0 ? kappa / seK : 0;
  const p = 2 * (1 - normCDF(Math.abs(z)));
  const ci95lo = kappa - 1.96 * seK;
  const ci95hi = kappa + 1.96 * seK;
  const allNum = cats.every(function(c) { return !isNaN(Number(c)); });
  let wKappa = null;
  if (allNum && k >= 2) {
    const catsN = cats.map(Number);
    const range = Math.max(...catsN) - Math.min(...catsN);
    let poW = 0, peW = 0;
    for (let i = 0; i < k; i++) {
      for (let j = 0; j < k; j++) {
        const w = 1 - Math.abs(catsN[i] - catsN[j]) / (range || 1);
        poW += w * mat[i][j] / total;
        peW += w * (rowSum[i] / total) * (colSum[j] / total);
      }
    }
    wKappa = peW < 1 ? (poW - peW) / (1 - peW) : 1;
  }
  function interp(kv) {
    if (kv < 0) return 'Poor (< chance)';
    if (kv < 0.2) return 'Slight';
    if (kv < 0.4) return 'Fair';
    if (kv < 0.6) return 'Moderate';
    if (kv < 0.8) return 'Substantial';
    return 'Almost Perfect';
  }
  const catStats = cats.map(function(cat, i) {
    const tp = mat[i][i];
    const fp = colSum[i] - tp;
    const fn_ = rowSum[i] - tp;
    const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
    const recall = (tp + fn_) > 0 ? tp / (tp + fn_) : 0;
    return { cat: String(cat), n: rowSum[i], tp, fp, fn: fn_, precision: f4(precision), recall: f4(recall) };
  });
  return {
    kappa: f4(kappa), seK: f4(seK), z: f4(z), p: f4(p), pFmt: pFmt(p),
    ci95lo: f4(ci95lo), ci95hi: f4(ci95hi),
    po: f4(po), pe: f4(pe),
    n: total, k,
    wKappa: wKappa !== null ? f4(wKappa) : null,
    cats, mat, rowSum, colSum,
    catStats,
    interp: interp(kappa),
    interpW: wKappa !== null ? interp(wKappa) : null,
  };
}
