// Fitur: Negative Binomial Regression (log link, NB2 parameterization) (kategori Analyze: Regression)
//   negbinReg
// Depends on: engine-core-distributions.js, engine-core-helpers.js, engine-core-linear-solver.js

function negbinReg(dvName, xNames, dataArr) {
  var rows = dataArr.filter(function(r) {
    if (!isV(r[dvName])) return false;
    var y = parseFloat(r[dvName]);
    if (!isFinite(y) || y < 0) return false;
    return xNames.every(function(x) { return isV(r[x]) && isFinite(parseFloat(r[x])); });
  });
  req(rows.length, xNames.length + 2, 'Negative Binomial cases');
  var n = rows.length, p = xNames.length, k = p + 1;
  var y = rows.map(function(r) { return parseFloat(r[dvName]); });
  var X = rows.map(function(r) { return [1].concat(xNames.map(function(x) { return parseFloat(r[x]); })); });
  function lgamma(z) {
    var C = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
    z -= 1; var x = C[0]; for (var i = 1; i < 9; i++) x += C[i] / (z + i);
    var t = z + 7.5; return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  }
  function nbLogLik(beta, theta) {
    var ll = 0;
    for (var i = 0; i < n; i++) {
      var xb = 0; for (var j = 0; j < k; j++) xb += X[i][j] * beta[j];
      var mu = Math.max(1e-10, Math.exp(xb));
      var th = Math.max(0.001, theta);
      ll += lgamma(y[i] + th) - lgamma(th) - lgamma(y[i] + 1) + th * Math.log(th / (th + mu)) + y[i] * Math.log(mu / (mu + th));
    }
    return ll;
  }
  var beta = new Array(k).fill(0);
  var THETA_MAX = 1e4, THETA_MIN = 1e-3;
  var theta = 1.0;
  var converged = false, thetaAtCap = false;
  for (var outer = 0; outer < 50; outer++) {
    for (var iter = 0; iter < 30; iter++) {
      var mu = X.map(function(xi) { var xb = 0; for (var j = 0; j < k; j++) xb += xi[j] * beta[j]; return Math.max(1e-10, Math.exp(xb)); });
      var XtWX = [], Xtr = [];
      for (var a = 0; a < k; a++) { XtWX.push(new Array(k).fill(0)); Xtr.push(0); }
      for (var i = 0; i < n; i++) {
        var w = mu[i] / (1 + mu[i] / theta);
        var res = y[i] - mu[i];
        for (var a = 0; a < k; a++) { Xtr[a] += X[i][a] * res; for (var b = 0; b < k; b++) XtWX[a][b] += X[i][a] * X[i][b] * w; }
      }
      var delta = solveLinear(XtWX, Xtr, k);
      var llBefore = nbLogLik(beta, theta);
      var step = 1, betaTry = beta, md = 0;
      for (var half = 0; half < 15; half++) {
        betaTry = beta.map(function(bj, j) { return bj + step * delta[j]; });
        var llTry = nbLogLik(betaTry, theta);
        if (isFinite(llTry) && (!isFinite(llBefore) || llTry >= llBefore - 1e-8)) break;
        step *= 0.5;
      }
      for (var j = 0; j < k; j++) { md = Math.max(md, Math.abs(betaTry[j] - beta[j])); beta[j] = betaTry[j]; }
      if (md < 1e-7) break;
    }
    var bestTh = theta, bestLL = nbLogLik(beta, theta);
    [0.1, 0.5, 1, 2, 5, 10, 20, 50, 100, 500].forEach(function(th) {
      var ll = nbLogLik(beta, th); if (ll > bestLL) { bestLL = ll; bestTh = th; }
    });
    var lo = Math.max(THETA_MIN, bestTh * 0.5), hi = Math.min(THETA_MAX, bestTh * 2);
    for (var gs = 0; gs < 40; gs++) {
      var m1 = lo + (hi - lo) * 0.382, m2 = lo + (hi - lo) * 0.618;
      if (nbLogLik(beta, m1) > nbLogLik(beta, m2)) hi = m2; else lo = m1;
    }
    var newTh = Math.min(THETA_MAX, Math.max(THETA_MIN, (lo + hi) / 2));
    if (newTh >= THETA_MAX * 0.999) {
      theta = THETA_MAX; thetaAtCap = true; converged = true; break;
    }
    if (Math.abs(newTh - theta) < 1e-5 && outer > 3) { converged = true; break; }
    theta = newTh;
  }
  var logLik = nbLogLik(beta, theta);
  var betaNull = [Math.log(mean(y) + 1e-10)];
  var nullLL = nbLogLik(betaNull.concat(new Array(k - 1).fill(0)), theta);
  var muFinal = X.map(function(xi) { var xb = 0; for (var j = 0; j < k; j++) xb += xi[j] * beta[j]; return Math.max(1e-10, Math.exp(xb)); });
  var XtWXF = []; for (var a = 0; a < k; a++) { XtWXF.push(new Array(k).fill(0)); }
  for (var i = 0; i < n; i++) {
    var w = muFinal[i] / (1 + muFinal[i] / theta);
    for (var a = 0; a < k; a++) for (var b = 0; b < k; b++) XtWXF[a][b] += X[i][a] * X[i][b] * w;
  }
  var invI = invertMatrix(XtWXF, k);
  var se = [], z = [], pv = [], irr = [], irrCI = [];
  for (var j = 0; j < k; j++) {
    var sej = invI ? Math.sqrt(Math.max(0, invI[j][j])) : NaN;
    var zj = isFinite(sej) && sej > 0 ? beta[j] / sej : NaN;
    var pj = isFinite(zj) ? 2 * (1 - normCDF(Math.abs(zj))) : NaN;
    se.push(sej); z.push(zj); pv.push(pj);
    irr.push(Math.exp(beta[j]));
    irrCI.push('[' + f4(Math.exp(beta[j] - 1.96 * sej)) + ', ' + f4(Math.exp(beta[j] + 1.96 * sej)) + ']');
  }
  var coefs = [{ name: 'Intercept', b: f4(beta[0]), se: f4(se[0]), z: f4(z[0]), p: pFmt(pv[0]), irr: f4(irr[0]), irrCI: irrCI[0], sig: pv[0] < .05 }];
  for (var j = 1; j < k; j++) coefs.push({ name: xNames[j - 1], b: f4(beta[j]), se: f4(se[j]), z: f4(z[j]), p: pFmt(pv[j]), irr: f4(irr[j]), irrCI: irrCI[j], sig: pv[j] < .05 });
  var lrChi2 = 2 * (logLik - nullLL);
  var mcFaddenR2 = 1 - logLik / nullLL;
  var pearsonX2 = 0;
  for (var i = 0; i < n; i++) pearsonX2 += Math.pow(y[i] - muFinal[i], 2) / (muFinal[i] + muFinal[i] * muFinal[i] / theta);
  return {
    n: n, k: k, converged: converged,
    theta: f4(theta), thetaDesc: 'Dispersion parameter θ (larger = less overdispersion)',
    coefs: coefs, logLik: f4(logLik),
    lrChi2: f4(lrChi2), lrDf: k - 1, lrP: pFmt(1 - normCDF(Math.sqrt(Math.max(0, lrChi2)))),
    mcFaddenR2: f4(mcFaddenR2),
    pearsonDispersion: f4(pearsonX2 / (n - k)),
    warnings: thetaAtCap ? ['Dispersion parameter θ mencapai batas pencarian (' + THETA_MAX + '). Ini menandakan data tidak overdispersed — hasil NB2 akan hampir identik dengan Poisson Regression biasa, pertimbangkan pakai Poisson saja.'] : []
  };
}
