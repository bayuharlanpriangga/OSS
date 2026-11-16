// Fitur: Hierarchical Linear Model — Two-Level HLM (IGLS / Random Intercept, Random Slopes, Cross-Level Interaction)
//   computeHLMTwoLevel
// Depends on: engine-core-distributions.js, engine-core-helpers.js, engine-core-linear-solver.js, global data

function computeHLMTwoLevel(dep, grp, l1Preds, l2Preds, modelType, dataArr) {
  if (!dep || !grp) return null;
  var src = Array.isArray(dataArr) ? dataArr : data;
  var mType = modelType || 'intercept';
  var l1List = Array.isArray(l1Preds) ? l1Preds.filter(function(p) { return p && p !== dep && p !== grp; }) : [];
  var l2List = Array.isArray(l2Preds) ? l2Preds.filter(function(p) { return p && p !== dep && p !== grp && l1List.indexOf(p) === -1; }) : [];

  // Collect complete rows for dep + grp + L1 predictors
  var clusters = {};
  var rawRows = [];
  src.forEach(function(r) {
    var g = r[grp];
    var y = parseFloat(r[dep]);
    if (g === undefined || g === null || g === '' || isNaN(y)) return;
    var x1Vals = [];
    for (var i = 0; i < l1List.length; i++) {
      var xv = parseFloat(r[l1List[i]]);
      if (isNaN(xv)) return;
      x1Vals.push(xv);
    }
    var key = String(g);
    var rec = { g: key, y: y, l1: x1Vals, raw: r };
    if (!clusters[key]) clusters[key] = [];
    clusters[key].push(rec);
    rawRows.push(rec);
  });

  var gkeys = Object.keys(clusters);
  var k = gkeys.length;
  if (k < 2) return { _err: 'Need ≥2 Level-2 groups' };
  var n = rawRows.length;
  if (n < k + l1List.length + l2List.length + 2) return { _err: 'Too few observations for Two-Level HLM' };

  // Aggregate numeric Level-2 predictors per cluster (grand-mean centered if crosslevel)
  var activeL2 = [];
  var l2ClusterMeans = {};
  l2List.forEach(function(wName) {
    var clMeans = {};
    var validVals = [];
    gkeys.forEach(function(gk) {
      var vals = [];
      clusters[gk].forEach(function(rec) {
        var v = parseFloat(rec.raw[wName]);
        if (!isNaN(v)) vals.push(v);
      });
      if (vals.length) {
        var m = mean(vals);
        clMeans[gk] = m;
        validVals.push(m);
      }
    });
    if (Object.keys(clMeans).length === k && validVals.length) {
      var gmW = mean(validVals);
      // Fill & check non-zero variance across clusters
      var ssW = validVals.reduce(function(s, v) { return s + (v - gmW) * (v - gmW); }, 0);
      if (ssW > 1e-12) {
        activeL2.push({ name: wName, grandMean: gmW });
        l2ClusterMeans[wName] = clMeans;
      }
    }
  });

  // Grand means of L1 predictors (for cross-level interaction centering)
  var l1GrandMeans = l1List.map(function(_, idx) {
    return mean(rawRows.map(function(r) { return r.l1[idx]; }));
  });

  // Cross-level interactions: primary L1 predictor * each active L2 predictor
  var interactions = [];
  if (mType === 'crosslevel' && l1List.length > 0 && activeL2.length > 0) {
    activeL2.forEach(function(wObj) {
      interactions.push({
        name: l1List[0] + ' × ' + wObj.name,
        l1Idx: 0,
        l1Mean: l1GrandMeans[0],
        wName: wObj.name,
        wMean: wObj.grandMean
      });
    });
  }

  // Null model baseline (exact ANOVA variance decomposition)
  var allY = rawRows.map(function(r) { return r.y; });
  var grandMean = mean(allY);
  var sumNj2 = 0, SSB = 0, SSW = 0;
  gkeys.forEach(function(gk) {
    var cl = clusters[gk];
    var ys = cl.map(function(r) { return r.y; });
    var gm = mean(ys);
    sumNj2 += cl.length * cl.length;
    SSB += cl.length * Math.pow(gm - grandMean, 2);
    ys.forEach(function(y) { SSW += Math.pow(y - gm, 2); });
  });
  var dfB = k - 1, dfW = n - k;
  var MSB = SSB / dfB, MSW = SSW / dfW;
  var avgN = n / k;
  var n0 = k > 1 ? (n - sumNj2 / n) / (k - 1) : avgN;
  if (!(n0 > 0)) n0 = avgN;
  var nullTau00 = Math.max(0, (MSB - MSW) / n0);
  var nullSigma2 = Math.max(1e-12, MSW);
  var nullICC = (nullTau00 + nullSigma2) > 0 ? nullTau00 / (nullTau00 + nullSigma2) : 0;
  var Fnull = MSW > 0 ? MSB / MSW : NaN;
  var pFnull = isNaN(Fnull) ? NaN : 1 - fCDF(Fnull, dfB, dfW);

  // Build design matrix rows per cluster: [1, L1..., L2..., CrossLevel...]
  var colSpecs = [{ name: '(Intercept)', level: 'Intercept' }];
  l1List.forEach(function(nm) { colSpecs.push({ name: nm, level: 'Level-1' }); });
  activeL2.forEach(function(w) { colSpecs.push({ name: w.name, level: 'Level-2' }); });
  interactions.forEach(function(ix) { colSpecs.push({ name: ix.name, level: 'Cross-Level' }); });
  var p = colSpecs.length;

  var clusterMats = {};
  gkeys.forEach(function(gk) {
    var cl = clusters[gk];
    var Xc = [];
    var yc = [];
    cl.forEach(function(rec) {
      var row = [1];
      for (var i = 0; i < l1List.length; i++) row.push(rec.l1[i]);
      for (var j = 0; j < activeL2.length; j++) row.push(l2ClusterMeans[activeL2[j].name][gk]);
      for (var m = 0; m < interactions.length; m++) {
        var ix = interactions[m];
        var xC = rec.l1[ix.l1Idx] - ix.l1Mean;
        var wC = l2ClusterMeans[ix.wName][gk] - ix.wMean;
        row.push(xC * wC);
      }
      Xc.push(row);
      yc.push(rec.y);
    });
    clusterMats[gk] = { X: Xc, y: yc };
  });

  // Helper: GLS + log-likelihood for compound-symmetry V_j = sigma2*I + tau00*1*1^T
  function runGLS(tau00, sigma2) {
    var s2 = Math.max(1e-9, sigma2);
    var t0 = Math.max(0, tau00);
    var XtVX = [];
    var XtVy = new Array(p).fill(0);
    for (var a = 0; a < p; a++) XtVX.push(new Array(p).fill(0));

    gkeys.forEach(function(gk) {
      var Xc = clusterMats[gk].X;
      var yc = clusterMats[gk].y;
      var nj = yc.length;
      var w = t0 / (s2 + nj * t0);

      // Sum across rows in cluster
      var sumX = new Array(p).fill(0);
      var sumY = 0;
      for (var i = 0; i < nj; i++) {
        sumY += yc[i];
        for (var a = 0; a < p; a++) sumX[a] += Xc[i][a];
      }

      for (var i = 0; i < nj; i++) {
        for (var a = 0; a < p; a++) {
          XtVy[a] += (Xc[i][a] * yc[i]) / s2;
          for (var b = 0; b < p; b++) {
            XtVX[a][b] += (Xc[i][a] * Xc[i][b]) / s2;
          }
        }
      }
      // Subtract rank-1 Sherman-Morrison term
      for (var a = 0; a < p; a++) {
        XtVy[a] -= (w / s2) * sumX[a] * sumY;
        for (var b = 0; b < p; b++) {
          XtVX[a][b] -= (w / s2) * sumX[a] * sumX[b];
        }
      }
    });

    // Small ridge guard only if collinear
    var cov = invertMatrix(XtVX, p);
    if (!cov) {
      for (var d = 0; d < p; d++) XtVX[d][d] += 1e-8;
      cov = invertMatrix(XtVX, p);
    }
    var beta = solveLinear(XtVX, XtVy, p);
    return { beta: beta, cov: cov };
  }

  function computeLogLik(beta, tau00, sigma2) {
    var s2 = Math.max(1e-9, sigma2);
    var t0 = Math.max(0, tau00);
    var ll = -0.5 * n * Math.log(2 * Math.PI);
    gkeys.forEach(function(gk) {
      var Xc = clusterMats[gk].X;
      var yc = clusterMats[gk].y;
      var nj = yc.length;
      var w = t0 / (s2 + nj * t0);
      var logDet = (nj - 1) * Math.log(s2) + Math.log(s2 + nj * t0);
      var sumR = 0, sumR2 = 0;
      for (var i = 0; i < nj; i++) {
        var pred = 0;
        for (var a = 0; a < p; a++) pred += Xc[i][a] * beta[a];
        var r = yc[i] - pred;
        sumR += r;
        sumR2 += r * r;
      }
      var quad = (sumR2 - w * sumR * sumR) / s2;
      ll -= 0.5 * (logDet + quad);
    });
    return ll;
  }

  // Null model deviance for LRT
  var nullDeviance = -2 * computeLogLik(
    [grandMean].concat(new Array(p - 1).fill(0)),
    nullTau00,
    nullSigma2
  );

  // IGLS iterations (EM/REML-style updates on residuals)
  var tau00 = nullTau00;
  var sigma2 = nullSigma2;
  var gls = runGLS(tau00, sigma2);

  for (var iter = 0; iter < 15; iter++) {
    var prevT = tau00, prevS = sigma2;
    var sumE2 = 0;
    var clusterResids = [];
    var sumNj2_r = 0;
    var ssbRes = 0, sswRes = 0;

    // Residual ANOVA decomposition on fixed-effects residuals
    var allRes = [];
    gkeys.forEach(function(gk) {
      var Xc = clusterMats[gk].X;
      var yc = clusterMats[gk].y;
      var resVec = [];
      for (var i = 0; i < yc.length; i++) {
        var pred = 0;
        for (var a = 0; a < p; a++) pred += Xc[i][a] * gls.beta[a];
        var r = yc[i] - pred;
        resVec.push(r);
        allRes.push(r);
      }
      clusterResids.push(resVec);
    });
    var meanRes = mean(allRes);
    clusterResids.forEach(function(rv) {
      var gmR = mean(rv);
      sumNj2_r += rv.length * rv.length;
      ssbRes += rv.length * Math.pow(gmR - meanRes, 2);
      rv.forEach(function(r) {
        sswRes += Math.pow(r - gmR, 2);
        sumE2 += r * r;
      });
    });

    var dfResW = Math.max(1, n - k - l1List.length);
    var dfResB = Math.max(1, k - 1 - activeL2.length);
    var msW = sswRes / dfResW;
    var msB = ssbRes / dfResB;
    sigma2 = Math.max(1e-9, msW);
    tau00 = Math.max(0, (msB - msW) / n0);
    gls = runGLS(tau00, sigma2);
    if (Math.abs(tau00 - prevT) < 1e-6 && Math.abs(sigma2 - prevS) < 1e-6) break;
  }

  // Random slope variance tau11 when modelType === 'slopes' or 'crosslevel' and ≥1 L1 predictor
  var tau11 = null;
  if ((mType === 'slopes' || mType === 'crosslevel') && l1List.length > 0) {
    var clusterSlopes = [];
    var clusterSlopeSE2 = [];
    gkeys.forEach(function(gk) {
      var cl = clusters[gk];
      if (cl.length < 3) return;
      var xs = cl.map(function(r) { return r.l1[0]; });
      var ys = cl.map(function(r) { return r.y; });
      var mx = mean(xs), my = mean(ys);
      var sxx = 0, sxy = 0;
      for (var i = 0; i < cl.length; i++) {
        sxx += (xs[i] - mx) * (xs[i] - mx);
        sxy += (xs[i] - mx) * (ys[i] - my);
      }
      if (sxx > 1e-10) {
        var b1 = sxy / sxx;
        var sse = 0;
        for (var i = 0; i < cl.length; i++) {
          var yhat = my + b1 * (xs[i] - mx);
          sse += (ys[i] - yhat) * (ys[i] - yhat);
        }
        var s2j = sse / Math.max(1, cl.length - 2);
        clusterSlopes.push(b1);
        clusterSlopeSE2.push(s2j / sxx);
      }
    });
    if (clusterSlopes.length >= 2) {
      var varSlopes = vari(clusterSlopes);
      var meanSamplingVar = mean(clusterSlopeSE2);
      tau11 = Math.max(0, varSlopes - meanSamplingVar);
    } else {
      tau11 = 0;
    }
  }

  var ll = computeLogLik(gls.beta, tau00, sigma2);
  var deviance = -2 * ll;
  var nParams = p + 2 + (tau11 !== null ? 1 : 0);
  var AIC = deviance + 2 * nParams;
  var BIC = deviance + Math.log(n) * nParams;
  var lrtChi2 = Math.max(0, nullDeviance - deviance);
  var lrtDf = Math.max(1, p - 1);
  var lrtP = typeof chiCDF === 'function' ? 1 - chiCDF(lrtChi2, lrtDf) : NaN;

  var dfEff = Math.max(1, n - p);
  var tCrit95 = typeof tCrit === 'function' ? tCrit(dfEff) : 1.96;

  var fixedEffects = colSpecs.map(function(spec, idx) {
    var b = gls.beta[idx];
    var se = gls.cov && gls.cov[idx] ? Math.sqrt(Math.max(0, gls.cov[idx][idx])) : NaN;
    var tVal = se > 0 ? b / se : NaN;
    var dfRow = spec.level === 'Level-2' ? Math.max(1, k - activeL2.length - 1) : dfEff;
    var pVal = isNaN(tVal) ? NaN : tP(Math.abs(tVal), dfRow);
    return {
      name: spec.name,
      level: spec.level,
      gamma: f4(b),
      se: f4(se),
      t: f4(tVal),
      p: pVal,
      p_fmt: pFmt(pVal),
      sig: pVal < 0.05,
      ci95: isFinite(se) ? '[' + f4(b - tCrit95 * se) + ', ' + f4(b + tCrit95 * se) + ']' : '—'
    };
  });

  // Empirical Bayes random intercepts (BLUPs) u0j
  var grpStats = gkeys.map(function(gk) {
    var cl = clusters[gk];
    var Xc = clusterMats[gk].X;
    var yc = clusterMats[gk].y;
    var nj = yc.length;
    var resSum = 0;
    for (var i = 0; i < nj; i++) {
      var pred = 0;
      for (var a = 0; a < p; a++) pred += Xc[i][a] * gls.beta[a];
      resSum += yc[i] - pred;
    }
    var meanResJ = resSum / nj;
    var lambdaJ = (tau00 + sigma2 / nj) > 0 ? tau00 / (tau00 + sigma2 / nj) : 0;
    var u0j = lambdaJ * meanResJ;
    var ys = yc;
    return {
      group: gk,
      n: nj,
      mean: f4(mean(ys)),
      sd: nj >= 2 ? f4(std(ys)) : 'N/A',
      ebIntercept: f4(u0j)
    };
  });

  var condICC = (tau00 + sigma2) > 0 ? tau00 / (tau00 + sigma2) : 0;
  var r2L1 = nullSigma2 > 0 ? Math.max(0, (nullSigma2 - sigma2) / nullSigma2) : 0;
  var r2L2 = nullTau00 > 0 ? Math.max(0, (nullTau00 - tau00) / nullTau00) : 0;
  var deff = 1 + (avgN - 1) * nullICC;

  return {
    subtype: 'hlm-2level',
    modelType: mType,
    k: k,
    n: n,
    grandMean: f4(grandMean),
    ICC: f4(condICC),
    ICC_null: f4(nullICC),
    varBetween: f4(tau00),
    varWithin: f4(sigma2),
    tau11: tau11 !== null ? f4(tau11) : null,
    nullTau00: f4(nullTau00),
    nullSigma2: f4(nullSigma2),
    pseudoR2_L1: f4(r2L1),
    pseudoR2_L2: f4(r2L2),
    deviance: f4(deviance),
    nullDeviance: f4(nullDeviance),
    lrtChi2: f4(lrtChi2),
    lrtDf: lrtDf,
    lrtP_fmt: pFmt(lrtP),
    AIC: f4(AIC),
    BIC: f4(BIC),
    MSB: f4(MSB),
    MSW: f4(MSW),
    F: f4(Fnull),
    p_fmt: pFmt(pFnull),
    sig: pFnull < 0.05,
    design_effect: f4(deff),
    fixedEffects: fixedEffects,
    grpStats: grpStats,
    l1preds: l1List,
    l2preds: activeL2.map(function(w) { return w.name; })
  };
}
