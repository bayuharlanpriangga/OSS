// Fitur: Analisis Regresi (kategori Analyze: Regression)
//   linearReg (Simple OLS), multipleReg (Multiple/Hierarchical OLS + diagnostics + HC3), logisticReg (Binary & Multinomial)
// Depends on: stats-distributions.js, stats-helpers.js, stats-matrix.js, stats-descriptive.js (sw)

// Simple Linear Regression
function linearReg(ax, ay) {
  const { xs, ys, n } = validPairs(ax, ay); req(n, 3, 'Regression');
  const mx = mean(xs), my = mean(ys);
  const Sxx = xs.reduce((s, x) => s + (x - mx) * (x - mx), 0);
  const Sxy = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  if (Sxx === 0) throw new Error('Zero variance in predictor');
  const b1 = Sxy / Sxx, b0 = my - b1 * mx;
  const yHat = xs.map(x => b0 + b1 * x);
  const SSR = yHat.reduce((s, y, i) => s + (y - my) * (y - my), 0);
  const SSE = ys.reduce((s, y, i) => s + (y - yHat[i]) * (y - yHat[i]), 0);
  const SST = ys.reduce((s, y) => s + (y - my) * (y - my), 0);
  const R2 = SST > 0 ? SSR / SST : 0, R2adj = 1 - (1 - R2) * (n - 1) / (n - 2);
  const dfR = 1, dfE = n - 2, MSR = SSR / dfR, MSE = SSE / dfE;
  const F = MSE > 0 ? MSR / MSE : 0, pF = fP(F, dfR, dfE);
  const SEb1 = Math.sqrt(MSE / Sxx), SEb0 = Math.sqrt(MSE * (1 / n + mx * mx / Sxx));
  const tb1 = b1 / SEb1, tb0 = b0 / SEb0;
  const pb1 = tP(Math.abs(tb1), dfE), pb0 = tP(Math.abs(tb0), dfE);
  const residuals = ys.map((y, i) => y - yHat[i]);
  return {
    b0: f4(b0), b1: f4(b1), SEb0: f4(SEb0), SEb1: f4(SEb1),
    tb0: f4(tb0), tb1: f4(tb1), pb0: f4(pb0), pb1: f4(pb1), pb0_fmt: pFmt(pb0), pb1_fmt: pFmt(pb1),
    R2: f4(R2), R2adj: f4(R2adj), F: f4(F), dfR, dfE, pF: f4(pF), pF_fmt: pFmt(pF),
    RMSE: f4(Math.sqrt(MSE)), SSR: f4(SSR), SSE: f4(SSE), SST: f4(SST), n, sig: pF < .05,
    yHat, residuals, xs, ys
  };
}

// Multiple Linear Regression (OLS, handles k predictors)
function multipleReg(Xnames, yName, dataArr) {
  const pairs = dataArr.filter(r => {
    if (!isV(r[yName])) return false;
    return Xnames.every(x => isV(r[x]));
  });
  const n = pairs.length, k = Xnames.length;
  req(n, k + 2, 'Multiple Regression');
  const y = pairs.map(r => r[yName]);
  const X = [];
  pairs.forEach(r => { X.push(1); Xnames.forEach(x => X.push(r[x])); });
  const p = k + 1;
  const Xt = matTFlat(X, n, p);
  const XtX = matMulFlat(Xt, p, n, X, p);
  const XtXinv = matInvFlat(XtX, p);
  const Xty = matMulFlat(Xt, p, n, y.map(v => [v]).flat(), 1);
  const beta = matMulFlat(XtXinv, p, p, Xty, 1);
  const yBar = mean(y);
  const yHat = pairs.map((_, i) => beta.reduce((s, b, j) => s + b * (j === 0 ? 1 : pairs[i][Xnames[j - 1]]), 0));
  const SSR = yHat.reduce((s, yh) => s + (yh - yBar) * (yh - yBar), 0);
  const SSE = y.reduce((s, yi, i) => s + (yi - yHat[i]) * (yi - yHat[i]), 0);
  const SST = y.reduce((s, yi) => s + (yi - yBar) * (yi - yBar), 0);
  const R2 = SST > 0 ? SSR / SST : 0;
  const R2adj = 1 - (1 - R2) * (n - 1) / (n - p);
  const MSE = SSE / (n - p), MSR = SSR / k;
  const F = MSE > 0 ? MSR / MSE : 0, pF = fP(F, k, n - p);
  const RMSE = Math.sqrt(MSE);
  const coefs = beta.map((b, j) => {
    const se_j = Math.sqrt(MSE * XtXinv[j * p + j]);
    const t_j = se_j > 0 ? b / se_j : 0;
    const p_j = tP(Math.abs(t_j), n - p);
    let stdBeta = 'N/A';
    if (j > 0) {
      const xVals = pairs.map(r => r[Xnames[j - 1]]);
      const sx = std(xVals), sy = std(y);
      if (sx > 0 && sy > 0) stdBeta = f4(b * sx / sy);
    }
    return { name: j === 0 ? '(Constant)' : Xnames[j - 1], B: f4(b), SE: f4(se_j), t: f4(t_j), p: f4(p_j), p_fmt: pFmt(p_j), sig: p_j < .05, beta: stdBeta };
  });
  const vif = Xnames.map((xi, idx) => {
    if (Xnames.length < 2) return 'N/A';
    try {
      const otherX = Xnames.filter((_, i) => i !== idx);
      const subRes = multipleReg(otherX, xi, dataArr);
      const r2_i = parseFloat(subRes.R2);
      return r2_i < 1 ? f4(1 / (1 - r2_i)) : '∞';
    } catch { return 'N/A'; }
  });
  const residuals = y.map((yi, i) => yi - yHat[i]);
  let dw = NaN;
  if (residuals.length > 2) {
    const num = residuals.slice(1).reduce((s, e, i) => s + (e - residuals[i]) * (e - residuals[i]), 0);
    const den = residuals.reduce((s, e) => s + e * e, 0);
    dw = den > 0 ? num / den : NaN;
  }

  let bpStat = NaN, bpP = NaN, bpSig = false;
  try {
    const res2 = residuals.map(r => r * r);
    const res2Mean = res2.reduce((s, v) => s + v, 0) / n;
    const auxP = p;
    const auxXtX = new Float64Array(auxP * auxP);
    const auxXty = new Float64Array(auxP);
    for (let i = 0; i < n; i++) {
      const xi = [1, ...Xnames.map(xn => isV(pairs[i][xn]) ? pairs[i][xn] : 0)];
      for (let a = 0; a < auxP; a++) {
        auxXty[a] += xi[a] * res2[i];
        for (let b = 0; b < auxP; b++) auxXtX[a * auxP + b] += xi[a] * xi[b];
      }
    }
    const auxInv = matInvFlat(Array.from(auxXtX), auxP);
    const auxBeta = new Float64Array(auxP);
    for (let a = 0; a < auxP; a++) for (let b = 0; b < auxP; b++) auxBeta[a] += auxInv[a * auxP + b] * auxXty[b];
    const res2Hat = Array.from({ length: n }, (_, i) => {
      const xi = [1, ...Xnames.map(xn => isV(pairs[i][xn]) ? pairs[i][xn] : 0)];
      return xi.reduce((s, v, j) => s + v * auxBeta[j], 0);
    });
    const ssTot = res2.reduce((s, v) => s + (v - res2Mean) * (v - res2Mean), 0);
    const ssRes = res2.map((v, i) => v - res2Hat[i]).reduce((s, v) => s + v * v, 0);
    const auxR2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
    bpStat = n * auxR2;
    bpP = 1 - chiCDF(bpStat, k);
    bpSig = bpP < 0.05;
  } catch (e) { bpStat = NaN; bpP = NaN; }

  const MSE_res = SSE / Math.max(n - p, 1);
  const hiiArr = Array.from({ length: n }, (_, i) => {
    try {
      const xi = [1, ...Xnames.map(xn => isV(pairs[i][xn]) ? pairs[i][xn] : 0)];
      let h = 0;
      for (let a = 0; a < p; a++) for (let b = 0; b < p; b++) h += xi[a] * XtXinv[a * p + b] * xi[b];
      return Math.min(Math.max(h, 0), 0.9999);
    } catch { return 0; }
  });
  const stdRes = residuals.map((r, i) => {
    const denom = Math.sqrt(MSE_res * (1 - hiiArr[i]));
    return denom > 0 ? r / denom : 0;
  });
  const outliers2 = stdRes.filter(r => Math.abs(r) > 2).length;
  const outliers3 = stdRes.filter(r => Math.abs(r) > 3).length;

  const cooksD = residuals.map((r, i) => {
    const hi = hiiArr[i];
    return MSE_res > 0 && hi < 1 ? r * r * hi / (p * MSE_res * (1 - hi) * (1 - hi)) : 0;
  });
  const cooksMax = cooksD.length ? Math.max(...cooksD) : 0;
  const cooksThr = 4 / n;
  const highCooks = cooksD.filter(d => d > cooksThr).length;
  const highLev = hiiArr.filter(h => h > 2 * p / n).length;

  let resNorm = null;
  if (residuals.length >= 5 && residuals.length <= 5000) {
    try { resNorm = sw(residuals); } catch {}
  }
  const resSkew = (() => {
    const mr = mean(residuals), sr = std(residuals);
    return sr > 0 ? residuals.reduce((s, r) => s + Math.pow((r - mr) / sr, 3), 0) / n : 0;
  })();
  const resKurt = (() => {
    const mr = mean(residuals), sr = std(residuals);
    return sr > 0 ? residuals.reduce((s, r) => s + Math.pow((r - mr) / sr, 4), 0) / n - 3 : 0;
  })();

  const regWarnings = [];
  vif.forEach((v, i) => {
    if (v === 'N/A' || v === '∞') return;
    const vn = parseFloat(v);
    if (vn > 10) regWarnings.push({ level: 'error', msg: 'VIF=' + v + ' for "' + Xnames[i] + '" — severe multicollinearity (VIF>10). Remove or combine predictors.' });
    else if (vn > 5) regWarnings.push({ level: 'warn', msg: 'VIF=' + v + ' for "' + Xnames[i] + '" — moderate multicollinearity (VIF>5). Interpret with caution.' });
  });
  if (isFinite(dw)) {
    if (dw < 1.0) regWarnings.push({ level: 'error', msg: 'Durbin-Watson=' + f4(dw) + ' — strong positive autocorrelation. Consider time-series model.' });
    else if (dw < 1.5) regWarnings.push({ level: 'warn', msg: 'Durbin-Watson=' + f4(dw) + ' — possible positive autocorrelation (ideal 1.5–2.5).' });
    else if (dw > 3.0) regWarnings.push({ level: 'error', msg: 'Durbin-Watson=' + f4(dw) + ' — strong negative autocorrelation.' });
    else if (dw > 2.5) regWarnings.push({ level: 'warn', msg: 'Durbin-Watson=' + f4(dw) + ' — possible negative autocorrelation.' });
  }
  if (isFinite(bpP)) {
    if (bpSig) regWarnings.push({ level: 'warn', msg: 'Breusch-Pagan: χ²=' + f4(bpStat) + ' p=' + f4(bpP) + ' — heteroscedasticity detected. Consider robust SE or WLS.' });
    else regWarnings.push({ level: 'info', msg: 'Breusch-Pagan: p=' + f4(bpP) + ' — homoscedasticity not rejected (good).' });
  }
  if (resNorm && isFinite(parseFloat(resNorm.p))) {
    if (parseFloat(resNorm.p) < 0.05) regWarnings.push({ level: 'warn', msg: 'Residuals non-normal (SW p=' + resNorm.p + '). Coefficient estimates still unbiased, but inference may be affected.' });
    else regWarnings.push({ level: 'info', msg: 'Residual normality: SW p=' + resNorm.p + ' — not rejected (good).' });
  }
  if (Math.abs(resSkew) > 1) regWarnings.push({ level: 'warn', msg: 'Residual skewness=' + f4(resSkew) + ' — distribution noticeably skewed.' });
  if (Math.abs(resKurt) > 3) regWarnings.push({ level: 'warn', msg: 'Residual kurtosis=' + f4(resKurt) + ' — heavy tails in residuals.' });
  if (outliers3 > 0) regWarnings.push({ level: 'error', msg: outliers3 + ' extreme outlier(s) |standardized residual|>3. Investigate these cases.' });
  else if (outliers2 > 0) regWarnings.push({ level: 'warn', msg: outliers2 + ' case(s) with |standardized residual|>2. Check for outliers.' });
  if (highCooks > 0) regWarnings.push({ level: 'warn', msg: highCooks + ' influential observation(s) (Cook D>' + f4(cooksThr) + '). Results may depend heavily on these.' });
  if (n < p * 10) regWarnings.push({ level: 'warn', msg: 'Small sample relative to predictors (n=' + n + ', k=' + k + '). Rule of thumb: n≥' + (p * 10) + ' for reliable estimates.' });

  try {
    const meat = new Float64Array(p * p);
    for (let i = 0; i < n; i++) {
      const xi = [1, ...Xnames.map(xn => isV(pairs[i][xn]) ? pairs[i][xn] : 0)];
      const hi = Math.min(hiiArr[i] || 0, 0.999);
      const scale = residuals[i] * residuals[i] / ((1 - hi) * (1 - hi));
      for (let a = 0; a < p; a++) for (let b = 0; b < p; b++) meat[a * p + b] += xi[a] * xi[b] * scale;
    }
    const vhc3 = new Float64Array(p * p);
    for (let a = 0; a < p; a++) for (let b = 0; b < p; b++) {
      let v = 0;
      for (let c = 0; c < p; c++) for (let d = 0; d < p; d++) v += XtXinv[a * p + c] * meat[c * p + d] * XtXinv[d * p + b];
      vhc3[a * p + b] = v;
    }
    coefs.forEach((c, i) => { c.SE_HC3 = f4(Math.sqrt(Math.max(0, vhc3[i * p + i]))); });
    coefs.forEach(c => {
      if (c.SE_HC3 && parseFloat(c.SE_HC3) > 0) {
        const t_hc3 = parseFloat(c.B) / parseFloat(c.SE_HC3);
        c.t_HC3 = f4(t_hc3);
        const p_hc3 = 2 * (1 - normCDF(Math.abs(t_hc3)));
        c.p_HC3 = f4(p_hc3);
        c.p_HC3_fmt = pFmt(p_hc3);
        c.sig_HC3 = p_hc3 < 0.05;
      }
    });
  } catch (e) { coefs.forEach(c => { c.SE_HC3 = '—'; c.t_HC3 = '—'; c.p_HC3 = '—'; }); }

  return {
    n, k, p, coefs, vif, R2: f4(R2), R2adj: f4(R2adj), F: f4(F), dfReg: k, dfRes: n - p,
    pF: f4(pF), pF_fmt: pFmt(pF), RMSE: f4(RMSE), SSR: f4(SSR), SSE: f4(SSE), SST: f4(SST),
    DW: f4(dw), yHat, residuals, pairs, sig: pF < .05,
    bpStat: f4(bpStat), bpP: f4(bpP), bpSig,
    stdRes: stdRes.map(r => f4(r)), cooksD: cooksD.map(d => f4(d)),
    cooksMax: f4(cooksMax), highCooks, highLev,
    outliers2, outliers3, resSkew: f4(resSkew), resKurt: f4(resKurt),
    resNorm: resNorm ? { W: resNorm.W, p: resNorm.p } : null,
    warnings: regWarnings
  };
}

// Logistic Regression (Binary & Multinomial)
function logisticReg(dvName, xNames, dataArr, type) {
  type = type || 'binary';
  var cases = dataArr.filter(function(r) {
    return xNames.every(function(v) { return typeof r[v] === 'number' && isFinite(r[v]); })
      && r[dvName] !== null && r[dvName] !== undefined;
  });
  var n = cases.length;
  if (n < 10) throw new Error('N terlalu kecil (N=' + n + '). Butuh ≥10 cases valid.');
  if (xNames.length < 1) throw new Error('Pilih minimal 1 prediktor.');

  var cats = [...new Set(cases.map(function(r) { return r[dvName]; }))]
    .sort(function(a, b) { return String(a).localeCompare(String(b)); });

  if (type === 'binary' && cats.length !== 2)
    throw new Error('Binary logistic butuh tepat 2 kategori DV (ditemukan ' + cats.length + ').');
  if (type === 'multinomial' && cats.length < 3)
    throw new Error('Multinomial logistic butuh ≥3 kategori DV (ditemukan ' + cats.length + ').');

  function sigmoid(z) { return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, z)))); }

  var xMeans = xNames.map(function(v) { return mean(cases.map(function(r) { return r[v]; })); });
  var xStds = xNames.map(function(v) { return std(cases.map(function(r) { return r[v]; })) || 1; });

  function getX(row) { return xNames.map(function(v, i) { return (row[v] - xMeans[i]) / xStds[i]; }); }

  function binaryLogistic(yBin) {
    var p = xNames.length;
    var beta = new Array(p + 1).fill(0);
    var Xs = cases.map(getX);

    function logLik(b) {
      var ll = 0;
      for (var i = 0; i < n; i++) {
        var z = b[0]; for (var j = 0; j < p; j++) z += b[j + 1] * Xs[i][j];
        var pi = sigmoid(z); pi = Math.max(1e-10, Math.min(1 - 1e-10, pi));
        ll += yBin[i] * Math.log(pi) + (1 - yBin[i]) * Math.log(1 - pi);
      }
      return ll;
    }

    var curLL = logLik(beta);
    for (var iter = 0; iter < 100; iter++) {
      var grad = new Array(p + 1).fill(0);
      var I = [];
      for (var r = 0; r <= p; r++) { I.push(new Array(p + 1).fill(0)); }
      for (var i = 0; i < n; i++) {
        var z = beta[0];
        for (var j = 0; j < p; j++) z += beta[j + 1] * Xs[i][j];
        var pi = sigmoid(z);
        pi = Math.max(1e-10, Math.min(1 - 1e-10, pi));
        var err = yBin[i] - pi;
        var w = pi * (1 - pi);
        grad[0] += err;
        I[0][0] += w;
        for (var j = 0; j < p; j++) {
          grad[j + 1] += err * Xs[i][j];
          I[0][j + 1] += w * Xs[i][j];
          I[j + 1][0] += w * Xs[i][j];
          for (var k = 0; k < p; k++) I[j + 1][k + 1] += w * Xs[i][j] * Xs[i][k];
        }
      }
      for (var d = 0; d <= p; d++) I[d][d] += 1e-8;
      var Iinv;
      try { Iinv = matInv(I); }
      catch (e) { throw new Error('Matriks informasi singular — cek multikolinearitas antar prediktor atau perfect separation.'); }
      var delta = new Array(p + 1).fill(0);
      for (var a2 = 0; a2 <= p; a2++) for (var b2 = 0; b2 <= p; b2++) delta[a2] += Iinv[a2][b2] * grad[b2];

      var step = 1, accepted = false, newBeta = beta, newLL = curLL;
      for (var h = 0; h < 30; h++) {
        newBeta = beta.map(function(bv, idx) { return bv + step * delta[idx]; });
        newLL = logLik(newBeta);
        if (newLL >= curLL - 1e-12) { accepted = true; break; }
        step /= 2;
      }
      if (!accepted) break;
      var maxChange = 0;
      for (var q = 0; q <= p; q++) maxChange = Math.max(maxChange, Math.abs(newBeta[q] - beta[q]));
      beta = newBeta; curLL = newLL;
      if (maxChange < 1e-8) break;
    }
    var betaOrig = [beta[0]];
    for (var j = 0; j < p; j++) betaOrig.push(beta[j + 1] / xStds[j]);
    betaOrig[0] = beta[0] - xNames.reduce(function(s, v, j) { return s + beta[j + 1] * xMeans[j] / xStds[j]; }, 0);

    return { beta: betaOrig, betaStd: beta };
  }

  function computeSE(betaStd) {
    var p = xNames.length;
    var Xs = cases.map(getX);
    var I = new Array(p + 1).fill(0).map(function() { return new Array(p + 1).fill(0); });
    for (var i = 0; i < n; i++) {
      var z = betaStd[0]; for (var j = 0; j < p; j++) z += betaStd[j + 1] * Xs[i][j];
      var pi = sigmoid(z); pi = Math.max(1e-10, Math.min(1 - 1e-10, pi));
      var w = pi * (1 - pi);
      I[0][0] += w;
      for (var j = 0; j < p; j++) {
        I[0][j + 1] += w * Xs[i][j]; I[j + 1][0] += w * Xs[i][j];
        for (var k = 0; k < p; k++) I[j + 1][k + 1] += w * Xs[i][j] * Xs[i][k];
      }
    }
    var cov;
    try { cov = matInv(I); }
    catch (e) { throw new Error('Matriks informasi singular — cek multikolinearitas antar prediktor atau perfect separation.'); }
    var A = [];
    for (var r = 0; r <= p; r++) { A.push(new Array(p + 1).fill(0)); }
    A[0][0] = 1;
    for (var j = 0; j < p; j++) { A[0][j + 1] = -xMeans[j] / xStds[j]; A[j + 1][j + 1] = 1 / xStds[j]; }
    var se = [];
    for (var r = 0; r <= p; r++) {
      var v = 0;
      for (var a3 = 0; a3 <= p; a3++) for (var b3 = 0; b3 <= p; b3++) v += A[r][a3] * cov[a3][b3] * A[r][b3];
      se.push(Math.sqrt(Math.max(0, v)));
    }
    return se;
  }

  if (type === 'binary') {
    var yBin = cases.map(function(r) { return r[dvName] === cats[1] ? 1 : 0; });
    var fit = binaryLogistic(yBin);
    var betaOrig = fit.beta;
    var betaStd = fit.betaStd;
    var seOrig = computeSE(betaStd);

    var logL = 0;
    for (var i = 0; i < n; i++) {
      var z = betaOrig[0]; for (var j = 0; j < xNames.length; j++) z += betaOrig[j + 1] * cases[i][xNames[j]];
      var pi = sigmoid(z); pi = Math.max(1e-10, Math.min(1 - 1e-10, pi));
      logL += yBin[i] * Math.log(pi) + (1 - yBin[i]) * Math.log(1 - pi);
    }
    var pY = yBin.filter(function(y) { return y === 1; }).length / n;
    pY = Math.max(1e-10, Math.min(1 - 1e-10, pY));
    var nullLogL = n * (pY * Math.log(pY) + (1 - pY) * Math.log(1 - pY));

    var m2ll = -2 * logL;
    var chiSq2 = f4(-2 * (nullLogL - logL));
    var chiSqDf = xNames.length;
    var chiSqP = chi2P(parseFloat(chiSq2), chiSqDf);

    var coxSnell = f4(1 - Math.exp((2 * (nullLogL - logL)) / n));
    var nagelkerke = f4(parseFloat(coxSnell) / (1 - Math.exp(2 * nullLogL / n)));

    var coefs = [];
    var names = ['Constant'].concat(xNames);
    for (var j = 0; j <= xNames.length; j++) {
      var b = betaOrig[j];
      var se = seOrig[j] || 0.001;
      var wald = f4((b / se) * (b / se), 3);
      var waldP = Math.max(0, chi2P(parseFloat(wald), 1));
      var OR = j === 0 ? '—' : f4(Math.exp(b), 3);
      var ciLo = j === 0 ? '—' : f4(Math.exp(b - 1.96 * se), 3);
      var ciHi = j === 0 ? '—' : f4(Math.exp(b + 1.96 * se), 3);
      coefs.push({
        name: names[j], B: f4(b, 3), SE: f4(se, 3), wald: f4(parseFloat(wald), 3),
        p_fmt: pFmt(waldP), OR: OR,
        ci_or: j === 0 ? '—' : '[' + ciLo + ', ' + ciHi + ']'
      });
    }

    var preds = cases.map(function(r) {
      var z = betaOrig[0]; for (var j = 0; j < xNames.length; j++) z += betaOrig[j + 1] * r[xNames[j]];
      return sigmoid(z) >= 0.5 ? 1 : 0;
    });
    var cm = [[0, 0], [0, 0]];
    for (var i = 0; i < n; i++) cm[yBin[i]][preds[i]]++;
    var correct = cm[0][0] + cm[1][1];
    var accuracy = f1(correct / n * 100);

    var scored = cases.map(function(r, i) {
      var z = betaOrig[0]; for (var j = 0; j < xNames.length; j++) z += betaOrig[j + 1] * r[xNames[j]];
      return { prob: sigmoid(z), y: yBin[i] };
    }).sort(function(a, b) { return b.prob - a.prob; });
    var pos = yBin.filter(function(y) { return y === 1; }).length;
    var neg = n - pos;
    var auc = 0, tp = 0;
    for (var i = 0; i < scored.length; i++) {
      if (scored[i].y === 1) { tp++; } else { auc += tp; }
    }
    auc = pos > 0 && neg > 0 ? f4(auc / (pos * neg), 3) : f4(0.5, 3);

    return {
      n: n, cats: cats, coefs: coefs, m2ll: f4(m2ll, 3), chiSq: chiSq2,
      chiSqDf: chiSqDf, chiSqP_fmt: pFmt(chiSqP),
      coxSnell: coxSnell, nagelkerke: nagelkerke,
      cm: cm, accuracy: accuracy, auc: auc
    };
  } else {
    var allCoefs = [];
    for (var ki = 1; ki < cats.length; ki++) {
      var yBin2 = cases.map(function(r) { return r[dvName] === cats[ki] ? 1 : 0; });
      var fit2 = binaryLogistic(yBin2);
      var betaOrig2 = fit2.beta;
      var betaStd2 = fit2.betaStd;
      var seOrig2 = computeSE(betaStd2);
      var catCoefs = [];
      var names2 = ['Constant'].concat(xNames);
      for (var j = 0; j <= xNames.length; j++) {
        var b2 = betaOrig2[j], se2 = seOrig2[j] || 0.001;
        var wald2 = f4((b2 / se2) * (b2 / se2), 3);
        var waldP2 = Math.max(0, chi2P(parseFloat(wald2), 1));
        catCoefs.push({
          name: names2[j], B: f4(b2, 3), SE: f4(se2, 3), wald: f4(parseFloat(wald2), 3),
          p_fmt: pFmt(waldP2),
          OR: j === 0 ? '—' : f4(Math.exp(b2), 3),
          ci_or: j === 0 ? '—' : '[' + f4(Math.exp(b2 - 1.96 * se2), 3) + ', ' + f4(Math.exp(b2 + 1.96 * se2), 3) + ']'
        });
      }
      allCoefs.push(catCoefs);
    }
    var correctN = 0;
    cases.forEach(function(r) {
      var scores = cats.map(function(cat, ki) {
        if (ki === 0) return 0;
        return parseFloat(allCoefs[ki - 1][0].B) + xNames.reduce(function(s, v, j) { return s + parseFloat(allCoefs[ki - 1][j + 1].B) * r[v]; }, 0);
      });
      var bestCat = cats[scores.indexOf(Math.max.apply(null, scores))];
      if (bestCat === r[dvName]) correctN++;
    });

    var logLMult = 0;
    var nullLogLMult = -n * Math.log(cats.length);
    for (var i = 0; i < n; i++) {
      var probs = cats.map(function(cat, ki) {
        if (ki === 0) return 1;
        var z = xNames.reduce(function(s, v, j) { return s + parseFloat(allCoefs[ki - 1][j + 1].B) * cases[i][v]; }, parseFloat(allCoefs[ki - 1][0].B));
        return Math.exp(z);
      });
      var sumP = probs.reduce(function(s, p) { return s + p; }, 0);
      var normP = probs.map(function(p) { return p / sumP; });
      var yi = cats.indexOf(cases[i][dvName]);
      if (yi >= 0) logLMult += Math.log(Math.max(1e-10, normP[yi]));
    }
    var chiSqMult = f4(-2 * (nullLogLMult - logLMult), 3);
    var chiSqDfMult = (cats.length - 1) * xNames.length;
    var chiSqPMult = chi2P(parseFloat(chiSqMult), chiSqDfMult);
    var m2llMult = f4(-2 * logLMult, 3);
    var coxSnellMult = f4(1 - Math.exp((2 * (nullLogLMult - logLMult)) / n));
    var nagelkerkeMult = f4(parseFloat(coxSnellMult) / (1 - Math.exp(2 * nullLogLMult / n)));

    return {
      n: n, cats: cats, categories: cats, coefs: allCoefs,
      m2ll: m2llMult, chiSq: chiSqMult, chiSqDf: chiSqDfMult,
      chiSqP_fmt: pFmt(chiSqPMult),
      coxSnell: coxSnellMult, nagelkerke: nagelkerkeMult,
      accuracy: f1(correctN / n * 100)
    };
  }
}
