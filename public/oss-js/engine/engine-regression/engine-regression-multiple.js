// Fitur: Multiple & Hierarchical Linear Regression OLS + diagnostik (VIF, DW, Breusch-Pagan, Cook's D, HC3) (kategori Analyze: Regression)
//   multipleReg
// Depends on: engine-core-distributions.js, engine-core-helpers.js, engine-core-matrix.js, engine-descriptive.js (sw)

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
