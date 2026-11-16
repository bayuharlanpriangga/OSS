// Fitur: Confirmatory Factor Analysis / CFA (kategori Analyze: Factor Analysis)
//   cfa
// Depends on: engine-core-distributions.js, engine-core-helpers.js, engine-core-matrix.js

function cfa(dataMatrix, factorMap) {
  var factorNames = Object.keys(factorMap);
  var nFactors = factorNames.length;
  var allVarNames = [];
  factorNames.forEach(function(fn) { factorMap[fn].forEach(function(v) { if (!allVarNames.includes(v)) allVarNames.push(v); }); });
  var p = allVarNames.length;
  var n = dataMatrix[0].length;

  if (n < p + 10) throw new Error('Need more observations (N > p+10). Got N=' + n + ', p=' + p);
  if (p < 2) throw new Error('Need at least 2 observed variables total');

  var S = [];
  for (var i = 0; i < p; i++) {
    S[i] = [];
    var xi = dataMatrix[i];
    var mx = mean(xi);
    for (var j = 0; j < p; j++) {
      var xj = dataMatrix[j];
      var my = mean(xj);
      var cov = 0;
      for (var k = 0; k < n; k++) cov += (xi[k] - mx) * (xj[k] - my);
      cov /= (n - 1);
      S[i][j] = cov;
    }
  }

  var sds = S.map(function(row, i) { return Math.sqrt(S[i][i]); });
  var R = S.map(function(row, i) {
    return row.map(function(v, j) { return sds[i] > 0 && sds[j] > 0 ? v / (sds[i] * sds[j]) : 0; });
  });

  var lambda = [];
  for (var i = 0; i < p; i++) {
    lambda[i] = [];
    for (var fj = 0; fj < nFactors; fj++) lambda[i][fj] = 0;
  }

  var factorLoadings = {};
  factorNames.forEach(function(fn, fi) {
    var vars = factorMap[fn];
    var vnIdx = vars.map(function(v) { return allVarNames.indexOf(v); });
    factorLoadings[fn] = [];
    vnIdx.forEach(function(vi, ii) {
      if (vi < 0) return;
      var sumR = 0, cnt = 0;
      vnIdx.forEach(function(vj, jj) {
        if (vj < 0 || ii === jj) return;
        sumR += Math.abs(R[vi][vj]);
        cnt++;
      });
      var avgR = cnt > 0 ? sumR / cnt : 0;
      var lam = cnt > 0 ? Math.sqrt(Math.max(0, avgR)) : Math.sqrt(Math.max(0, R[vi][vi]));
      lambda[vi][fi] = lam;
      factorLoadings[fn].push({ varName: vars[ii], varIdx: vi, loading: lam });
    });
    if (vnIdx.length >= 2) {
      var subR = vnIdx.map(function(vi) { return vnIdx.map(function(vj) { return R[vi][vj]; }); });
      try {
        var eigR = jacobiEigen(subR, 60);
        var order = eigR.values.map(function(_, i) { return i; }).sort(function(a, b) { return eigR.values[b] - eigR.values[a]; });
        var ev0 = eigR.values[order[0]];
        var evec0 = eigR.vectors.map(function(row) { return row[order[0]]; });
        if (evec0.reduce(function(a, b) { return a + b; }, 0) < 0) evec0 = evec0.map(function(x) { return -x; });
        vnIdx.forEach(function(vi, ii) {
          if (vi < 0) return;
          var lam = evec0[ii] * Math.sqrt(Math.max(0, ev0));
          lambda[vi][fi] = lam;
          factorLoadings[fn][ii].loading = lam;
        });
      } catch (e) {}
    }
  });

  var h2 = lambda.map(function(row) { return row.reduce(function(s, l) { return s + l * l; }, 0); });
  var Sigma = [];
  for (var i = 0; i < p; i++) {
    Sigma[i] = [];
    for (var j = 0; j < p; j++) {
      var s = 0;
      for (var fi2 = 0; fi2 < nFactors; fi2++) s += lambda[i][fi2] * lambda[j][fi2];
      if (i === j) s += Math.max(0, 1 - h2[i]);
      Sigma[i][j] = s;
    }
  }

  var srmrSum = 0, srmrCount = 0;
  for (var i = 0; i < p; i++) {
    for (var j = 0; j <= i; j++) {
      var resid = R[i][j] - Sigma[i][j];
      srmrSum += resid * resid;
      srmrCount++;
    }
  }
  var SRMR = Math.sqrt(srmrSum / srmrCount);

  var Fdiff = 0;
  for (var i = 0; i < p; i++) {
    for (var j = 0; j < p; j++) {
      var diff = R[i][j] - Sigma[i][j];
      Fdiff += diff * diff;
    }
  }
  Fdiff *= 0.5;
  var dfModel = p * (p + 1) / 2 - (p * nFactors - nFactors * (nFactors - 1) / 2 + p);
  dfModel = Math.max(1, dfModel);
  var chiSq = (n - 1) * Fdiff;
  var pChiSq = chi2P(Math.max(0, chiSq), dfModel);

  var FNull = 0;
  for (var i = 0; i < p; i++) {
    for (var j = 0; j < p; j++) {
      if (i !== j) FNull += R[i][j] * R[i][j];
    }
  }
  FNull *= 0.5;
  var dfNull = p * (p - 1) / 2;
  var chiSqNull = (n - 1) * FNull;

  var numer = Math.max(0, chiSq - dfModel);
  var denom = Math.max(0, chiSqNull - dfNull);
  var CFI = denom > 0 ? 1 - numer / denom : 1;
  CFI = Math.min(1, Math.max(0, CFI));

  var TLI_num = chiSqNull / dfNull - chiSq / dfModel;
  var TLI_den = chiSqNull / dfNull - 1;
  var TLI = TLI_den > 0 ? TLI_num / TLI_den : 0;
  TLI = Math.min(1.1, TLI);

  var RMSEA = Math.sqrt(Math.max(0, (chiSq / dfModel - 1) / (n - 1)));
  var rmsea_lo = Math.sqrt(Math.max(0, (chiSq - dfModel - 1.645 * Math.sqrt(2 * dfModel)) / ((n - 1) * dfModel)));
  var rmsea_hi = Math.sqrt(Math.max(0, (chiSq + 1.645 * Math.sqrt(2 * dfModel)) / ((n - 1) * dfModel)));

  var communalities = h2.map(function(v) { return Math.min(1, v); });

  function fitCFI(v) { if (v >= 0.95) return 'Excellent'; if (v >= 0.90) return 'Acceptable'; return 'Poor'; }
  function fitTLI(v) { if (v >= 0.95) return 'Excellent'; if (v >= 0.90) return 'Acceptable'; return 'Poor'; }
  function fitRMSEA(v) { if (v <= 0.05) return 'Excellent'; if (v <= 0.08) return 'Acceptable'; if (v <= 0.10) return 'Marginal'; return 'Poor'; }
  function fitSRMR(v) { if (v <= 0.05) return 'Excellent'; if (v <= 0.08) return 'Acceptable'; return 'Poor'; }

  return {
    n: n, p: p, nFactors: nFactors,
    factorNames: factorNames,
    factorMap: factorMap,
    lambda: lambda.map(function(r) { return r.map(f4); }),
    communalities: communalities.map(f4),
    varNames: allVarNames,
    factorLoadings: factorLoadings,
    R: R,
    Sigma: Sigma,
    chiSq: f4(chiSq), dfModel: dfModel, pChiSq: f4(pChiSq),
    chiSqNull: f4(chiSqNull), dfNull: dfNull,
    CFI: f4(CFI), CFIinterp: fitCFI(CFI),
    TLI: f4(TLI), TLIinterp: fitTLI(TLI),
    RMSEA: f4(RMSEA), RMSEAinterp: fitRMSEA(RMSEA),
    RMSEA_lo: f4(rmsea_lo), RMSEA_hi: f4(rmsea_hi),
    SRMR: f4(SRMR), SRMRinterp: fitSRMR(SRMR),
    SRMR_raw: SRMR,
    CFI_raw: CFI, TLI_raw: TLI, RMSEA_raw: RMSEA,
    overallFit: (CFI >= 0.95 && RMSEA <= 0.06 && SRMR <= 0.08) ? 'Good Fit' :
      (CFI >= 0.90 && RMSEA <= 0.08 && SRMR <= 0.10) ? 'Acceptable Fit' : 'Poor Fit',
    fitColor: (CFI >= 0.95 && RMSEA <= 0.06 && SRMR <= 0.08) ? '#34d399' :
      (CFI >= 0.90 && RMSEA <= 0.08 && SRMR <= 0.10) ? '#fbbf24' : '#f87171'
  };
}
