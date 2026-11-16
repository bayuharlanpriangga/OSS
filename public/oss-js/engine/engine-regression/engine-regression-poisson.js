// Fitur: Poisson Regression (via IRLS, log link) (kategori Analyze: Regression)
//   poissonReg
// Depends on: engine-core-distributions.js, engine-core-helpers.js, engine-core-linear-solver.js

function poissonReg(dvName, xNames, dataArr) {
  var rows = dataArr.filter(function(r) {
    if (!isV(r[dvName])) return false;
    var y = parseFloat(r[dvName]);
    if (!isFinite(y) || y < 0) return false;
    return xNames.every(function(x) { return isV(r[x]) && isFinite(parseFloat(r[x])); });
  });
  req(rows.length, xNames.length + 2, 'Poisson regression cases');
  var n = rows.length, p = xNames.length;
  var y = rows.map(function(r) { return parseFloat(r[dvName]); });
  var hasNonInt = y.some(function(v) { return Math.abs(v - Math.round(v)) > 0.001; });
  var X = rows.map(function(r) {
    return [1].concat(xNames.map(function(x) { return parseFloat(r[x]); }));
  });
  var k = p + 1;
  var beta = new Array(k).fill(0);
  var converged = false;
  for (var iter = 0; iter < 200; iter++) {
    var mu = X.map(function(xi) {
      var xb = 0; for (var j = 0; j < k; j++) xb += xi[j] * beta[j];
      return Math.max(1e-10, Math.exp(xb));
    });
    var XtWX = [], Xtr = [];
    for (var a = 0; a < k; a++) {
      XtWX.push(new Array(k).fill(0));
      Xtr.push(0);
    }
    for (var i = 0; i < n; i++) {
      var w = mu[i], res = y[i] - mu[i];
      for (var a = 0; a < k; a++) {
        Xtr[a] += X[i][a] * res;
        for (var b = 0; b < k; b++) XtWX[a][b] += X[i][a] * X[i][b] * w;
      }
    }
    var delta = solveLinear(XtWX, Xtr, k);
    var maxDelta = 0;
    for (var j = 0; j < k; j++) { beta[j] += delta[j]; maxDelta = Math.max(maxDelta, Math.abs(delta[j])); }
    if (maxDelta < 1e-8) { converged = true; break; }
  }
  var muFinal = X.map(function(xi) {
    var xb = 0; for (var j = 0; j < k; j++) xb += xi[j] * beta[j]; return Math.max(1e-10, Math.exp(xb));
  });
  function lgamma(z) {
    var C = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
    z -= 1; var x = C[0]; for (var i = 1; i < 9; i++) x += C[i] / (z + i);
    var t = z + 7.5; return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  }
  var logLik = 0, nullLogLik = 0, yMean = mean(y);
  for (var i = 0; i < n; i++) {
    logLik += y[i] * Math.log(muFinal[i]) - muFinal[i] - lgamma(y[i] + 1);
    nullLogLik += y[i] * Math.log(yMean) - yMean - lgamma(y[i] + 1);
  }
  var logSat = 0;
  for (var i = 0; i < n; i++) logSat += (y[i] > 0 ? y[i] * Math.log(y[i]) - y[i] - lgamma(y[i] + 1) : -lgamma(1));
  var deviance = 2 * (logSat - logLik);
  var nullDeviance = 2 * (logSat - nullLogLik);
  var df_res = n - k, df_null = n - 1;
  var mcFaddenR2 = 1 - logLik / nullLogLik;
  var XtWXFinal = []; for (var a = 0; a < k; a++) { XtWXFinal.push(new Array(k).fill(0)); }
  for (var i = 0; i < n; i++) for (var a = 0; a < k; a++) for (var b = 0; b < k; b++) XtWXFinal[a][b] += X[i][a] * X[i][b] * muFinal[i];
  var invI = invertMatrix(XtWXFinal, k);
  var se = [], z = [], p = [], irr = [], irrCI = [];
  for (var j = 0; j < k; j++) {
    var sej = invI ? Math.sqrt(Math.max(0, invI[j][j])) : NaN;
    var zj = isFinite(sej) && sej > 0 ? beta[j] / sej : NaN;
    var pj = isFinite(zj) ? 2 * (1 - normCDF(Math.abs(zj))) : NaN;
    se.push(sej); z.push(zj); p.push(pj);
    irr.push(Math.exp(beta[j]));
    irrCI.push('[' + f4(Math.exp(beta[j] - 1.96 * sej)) + ', ' + f4(Math.exp(beta[j] + 1.96 * sej)) + ']');
  }
  var pearsonX2 = 0;
  for (var i = 0; i < n; i++) pearsonX2 += Math.pow(y[i] - muFinal[i], 2) / muFinal[i];
  var dispersion = pearsonX2 / df_res;
  var coefs = [{ name: 'Intercept', b: f4(beta[0]), se: f4(se[0]), z: f4(z[0]), p: pFmt(p[0]), irr: f4(irr[0]), irrCI: irrCI[0], sig: p[0] < .05 }];
  for (var j = 1; j < k; j++) coefs.push({ name: xNames[j - 1], b: f4(beta[j]), se: f4(se[j]), z: f4(z[j]), p: pFmt(p[j]), irr: f4(irr[j]), irrCI: irrCI[j], sig: p[j] < .05 });
  var lrChi2 = 2 * (logLik - nullLogLik);
  return {
    n: n, k: k, converged: converged,
    coefs: coefs, logLik: f4(logLik), nullLogLik: f4(nullLogLik),
    deviance: f4(deviance), nullDeviance: f4(nullDeviance),
    df_res: df_res, df_null: df_null,
    mcFaddenR2: f4(mcFaddenR2), dispersion: f4(dispersion),
    lrChi2: f4(lrChi2), lrDf: k - 1, lrP: pFmt(1 - normCDF(Math.sqrt(lrChi2)) * 2),
    hasNonInt: hasNonInt, warnings: dispersion > 2 ? ['Dispersion statistic = ' + f4(dispersion) + ' > 2. Data may be overdispersed — consider Negative Binomial.'] : []
  };
}
