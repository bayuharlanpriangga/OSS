// Fitur: Hierarchical Linear Model — Three-Level Nested HLM (L1 in L2 in L3)
//   computeHLMThreeLevel
// Depends on: engine-core-distributions.js, engine-core-helpers.js, engine-core-linear-solver.js, global data

function computeHLMThreeLevel(dep, grpL2, grpL3, l1Preds, dataArr) {
  if (!dep || !grpL2 || !grpL3) return null;
  if (grpL2 === grpL3) return { _err: 'Level-2 and Level-3 grouping variables must be different' };
  var src = Array.isArray(dataArr) ? dataArr : data;
  var l1List = Array.isArray(l1Preds)
    ? l1Preds.filter(function(p) { return p && p !== dep && p !== grpL2 && p !== grpL3; })
    : [];

  // Build true 3-level nested hierarchy: L3 -> L2(within L3) -> L1 obs
  var l3Map = {};
  var rawRows = [];
  src.forEach(function(r) {
    var g3 = r[grpL3];
    var g2 = r[grpL2];
    var y = parseFloat(r[dep]);
    if (g3 === undefined || g3 === null || g3 === '' || g2 === undefined || g2 === null || g2 === '' || isNaN(y)) return;
    var xv = [];
    for (var i = 0; i < l1List.length; i++) {
      var val = parseFloat(r[l1List[i]]);
      if (isNaN(val)) return;
      xv.push(val);
    }
    var k3 = String(g3);
    var k2 = k3 + '::' + String(g2);
    if (!l3Map[k3]) l3Map[k3] = { label: k3, l2Map: {}, obs: [] };
    if (!l3Map[k3].l2Map[k2]) l3Map[k3].l2Map[k2] = { label: String(g2), compositeKey: k2, obs: [] };
    var rec = { k3: k3, k2: k2, y: y, l1: xv };
    l3Map[k3].l2Map[k2].obs.push(rec);
    l3Map[k3].obs.push(rec);
    rawRows.push(rec);
  });

  var k3Keys = Object.keys(l3Map);
  var K = k3Keys.length;
  if (K < 2) return { _err: 'Need ≥2 Level-3 super-clusters' };

  var J = 0;
  k3Keys.forEach(function(k3) { J += Object.keys(l3Map[k3].l2Map).length; });
  var N = rawRows.length;
  if (J <= K) return { _err: 'Need Level-2 units nested within Level-3 clusters (J > K)' };
  if (N <= J + l1List.length) return { _err: 'Too few Level-1 observations for Three-Level HLM' };

  // Helper: nested ANOVA variance component decomposition on any scalar vector accessor
  function decomposeThreeLevel(getVal) {
    var allVals = rawRows.map(getVal);
    var gm = mean(allVals);
    var SS3 = 0, SS2 = 0, SS1 = 0;
    var sumNk2 = 0;
    var sumNjk2 = 0;
    var sumNjk2OverNk = 0;

    k3Keys.forEach(function(k3) {
      var cl3 = l3Map[k3];
      var nk = cl3.obs.length;
      sumNk2 += nk * nk;
      var mk = mean(cl3.obs.map(getVal));
      SS3 += nk * Math.pow(mk - gm, 2);

      var l2Keys = Object.keys(cl3.l2Map);
      l2Keys.forEach(function(k2) {
        var cl2 = cl3.l2Map[k2];
        var njk = cl2.obs.length;
        sumNjk2 += njk * njk;
        sumNjk2OverNk += (njk * njk) / nk;
        var mjk = mean(cl2.obs.map(getVal));
        SS2 += njk * Math.pow(mjk - mk, 2);
        cl2.obs.forEach(function(rec) {
          var v = getVal(rec);
          SS1 += Math.pow(v - mjk, 2);
        });
      });
    });

    var df3 = K - 1;
    var df2 = J - K;
    var df1 = Math.max(1, N - J - l1List.length);
    var MS3 = SS3 / df3;
    var MS2 = SS2 / df2;
    var MS1 = SS1 / df1;

    // Exact unbalanced Henderson Method I EMS coefficients
    var c1 = (N - sumNjk2OverNk) / df2;
    if (!(c1 > 0)) c1 = N / J;
    var c2 = (sumNjk2OverNk - sumNjk2 / N) / df3;
    if (!(c2 > 0)) c2 = N / J;
    var c3 = (N - sumNk2 / N) / df3;
    if (!(c3 > 0)) c3 = N / K;

    var s2 = Math.max(1e-9, MS1);
    var tauL2 = Math.max(0, (MS2 - MS1) / c1);
    var tauL3 = Math.max(0, (MS3 - MS1 - c2 * tauL2) / c3);

    return {
      gm: gm,
      SS3: SS3, SS2: SS2, SS1: SS1,
      df3: df3, df2: df2, df1: df1,
      MS3: MS3, MS2: MS2, MS1: MS1,
      sigma2: s2, tauL2: tauL2, tauL3: tauL3
    };
  }

  var nullDecomp = decomposeThreeLevel(function(rec) { return rec.y; });
  var nullS2 = nullDecomp.sigma2;
  var nullTauL2 = nullDecomp.tauL2;
  var nullTauL3 = nullDecomp.tauL3;

  var fL3 = nullDecomp.MS2 > 0 ? nullDecomp.MS3 / nullDecomp.MS2 : NaN;
  var pL3 = isNaN(fL3) ? NaN : 1 - fCDF(fL3, nullDecomp.df3, nullDecomp.df2);
  var fL2 = nullDecomp.MS1 > 0 ? nullDecomp.MS2 / nullDecomp.MS1 : NaN;
  var pL2 = isNaN(fL2) ? NaN : 1 - fCDF(fL2, nullDecomp.df2, nullDecomp.df1);

  // Design matrix columns: [1, L1 predictors...]
  var colSpecs = [{ name: '(Intercept)', level: 'Intercept' }];
  l1List.forEach(function(nm) { colSpecs.push({ name: nm, level: 'Level-1' }); });
  var p = colSpecs.length;

  function rowVec(rec) {
    return [1].concat(rec.l1);
  }

  // Exact 3-level nested GLS using two-level Sherman-Morrison-Woodbury per L3 cluster
  function runThreeLevelGLS(s2, tau2, tau3) {
    var sigma2 = Math.max(1e-9, s2);
    var t2 = Math.max(0, tau2);
    var t3 = Math.max(0, tau3);
    var XtVX = [];
    var XtVy = new Array(p).fill(0);
    for (var a = 0; a < p; a++) XtVX.push(new Array(p).fill(0));

    k3Keys.forEach(function(k3) {
      var cl3 = l3Map[k3];
      var l2Keys = Object.keys(cl3.l2Map);
      // Accumulate D_k^{-1} X and D_k^{-1} y and 1^T D_k^{-1} 1
      var oneTDinvOne = 0;
      var oneTDinvX = new Array(p).fill(0);
      var oneTDinvY = 0;

      l2Keys.forEach(function(k2) {
        var obs = cl3.l2Map[k2].obs;
        var njk = obs.length;
        var w2 = t2 / (sigma2 + njk * t2);
        var sumX = new Array(p).fill(0);
        var sumY = 0;

        for (var i = 0; i < njk; i++) {
          var x = rowVec(obs[i]);
          var y = obs[i].y;
          sumY += y;
          for (var a = 0; a < p; a++) {
            sumX[a] += x[a];
            XtVy[a] += (x[a] * y) / sigma2;
            for (var b = 0; b < p; b++) {
              XtVX[a][b] += (x[a] * x[b]) / sigma2;
            }
          }
        }
        // Apply L2 Sherman-Morrison subtraction
        for (var a = 0; a < p; a++) {
          XtVy[a] -= (w2 / sigma2) * sumX[a] * sumY;
          for (var b = 0; b < p; b++) {
            XtVX[a][b] -= (w2 / sigma2) * sumX[a] * sumX[b];
          }
        }
        // Accumulate D_k^{-1} projections for outer L3 Woodbury update
        var scaleJ = (1 - njk * w2) / sigma2; // = 1 / (sigma2 + njk * t2)
        oneTDinvOne += njk * scaleJ;
        oneTDinvY += sumY * scaleJ;
        for (var a = 0; a < p; a++) oneTDinvX[a] += sumX[a] * scaleJ;
      });

      // Outer L3 Woodbury subtraction: - t3 / (1 + t3 * 1^T D_k^{-1} 1) * (D_k^{-1}1)(D_k^{-1}1)^T
      if (t3 > 0) {
        var w3 = t3 / (1 + t3 * oneTDinvOne);
        for (var a = 0; a < p; a++) {
          XtVy[a] -= w3 * oneTDinvX[a] * oneTDinvY;
          for (var b = 0; b < p; b++) {
            XtVX[a][b] -= w3 * oneTDinvX[a] * oneTDinvX[b];
          }
        }
      }
    });

    var cov = invertMatrix(XtVX, p);
    if (!cov) {
      for (var d = 0; d < p; d++) XtVX[d][d] += 1e-8;
      cov = invertMatrix(XtVX, p);
    }
    var beta = solveLinear(XtVX, XtVy, p);
    return { beta: beta, cov: cov };
  }

  function computeThreeLevelLogLik(beta, s2, tau2, tau3) {
    var sigma2 = Math.max(1e-9, s2);
    var t2 = Math.max(0, tau2);
    var t3 = Math.max(0, tau3);
    var ll = -0.5 * N * Math.log(2 * Math.PI);

    k3Keys.forEach(function(k3) {
      var cl3 = l3Map[k3];
      var l2Keys = Object.keys(cl3.l2Map);
      var logDetK = 0;
      var oneTDinvOne = 0;
      var oneTDinvR = 0;
      var rTDinvR = 0;

      l2Keys.forEach(function(k2) {
        var obs = cl3.l2Map[k2].obs;
        var njk = obs.length;
        var w2 = t2 / (sigma2 + njk * t2);
        logDetK += (njk - 1) * Math.log(sigma2) + Math.log(sigma2 + njk * t2);
        var sumR = 0, sumR2 = 0;
        for (var i = 0; i < njk; i++) {
          var x = rowVec(obs[i]);
          var pred = 0;
          for (var a = 0; a < p; a++) pred += x[a] * beta[a];
          var r = obs[i].y - pred;
          sumR += r;
          sumR2 += r * r;
        }
        rTDinvR += (sumR2 - w2 * sumR * sumR) / sigma2;
        var scaleJ = 1 / (sigma2 + njk * t2);
        oneTDinvOne += njk * scaleJ;
        oneTDinvR += sumR * scaleJ;
      });

      if (t3 > 0) {
        logDetK += Math.log(1 + t3 * oneTDinvOne);
        var w3 = t3 / (1 + t3 * oneTDinvOne);
        rTDinvR -= w3 * oneTDinvR * oneTDinvR;
      }
      ll -= 0.5 * (logDetK + rTDinvR);
    });
    return ll;
  }

  var sigma2 = nullS2, tauL2 = nullTauL2, tauL3 = nullTauL3;
  var gls = runThreeLevelGLS(sigma2, tauL2, tauL3);

  // IGLS iterations if predictors are present
  if (l1List.length > 0) {
    for (var iter = 0; iter < 12; iter++) {
      var prevS = sigma2, prev2 = tauL2, prev3 = tauL3;
      var dec = decomposeThreeLevel(function(rec) {
        var x = rowVec(rec);
        var pred = 0;
        for (var a = 0; a < p; a++) pred += x[a] * gls.beta[a];
        return rec.y - pred;
      });
      sigma2 = dec.sigma2;
      tauL2 = dec.tauL2;
      tauL3 = dec.tauL3;
      gls = runThreeLevelGLS(sigma2, tauL2, tauL3);
      if (Math.abs(sigma2 - prevS) < 1e-6 && Math.abs(tauL2 - prev2) < 1e-6 && Math.abs(tauL3 - prev3) < 1e-6) break;
    }
  }

  var ll = computeThreeLevelLogLik(gls.beta, sigma2, tauL2, tauL3);
  var deviance = -2 * ll;
  var nParams = p + 3; // beta + sigma2 + tauL2 + tauL3
  var AIC = deviance + 2 * nParams;
  var BIC = deviance + Math.log(N) * nParams;

  var varTotal = sigma2 + tauL2 + tauL3;
  var vpcL1 = varTotal > 0 ? (sigma2 / varTotal) * 100 : 0;
  var vpcL2 = varTotal > 0 ? (tauL2 / varTotal) * 100 : 0;
  var vpcL3 = varTotal > 0 ? (tauL3 / varTotal) * 100 : 0;
  var iccL3 = varTotal > 0 ? tauL3 / varTotal : 0;
  var iccL2WithinL3 = varTotal > 0 ? (tauL3 + tauL2) / varTotal : 0;

  var dfEff = Math.max(1, N - p);
  var tCrit95 = typeof tCrit === 'function' ? tCrit(dfEff) : 1.96;
  var fixedEffects = colSpecs.map(function(spec, idx) {
    var b = gls.beta[idx];
    var se = gls.cov && gls.cov[idx] ? Math.sqrt(Math.max(0, gls.cov[idx][idx])) : NaN;
    var tVal = se > 0 ? b / se : NaN;
    var pVal = isNaN(tVal) ? NaN : tP(Math.abs(tVal), dfEff);
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

  var l3Stats = k3Keys.map(function(k3) {
    var cl3 = l3Map[k3];
    var ys = cl3.obs.map(function(r) { return r.y; });
    return {
      group: cl3.label,
      nL2: Object.keys(cl3.l2Map).length,
      n: ys.length,
      mean: f4(mean(ys)),
      sd: ys.length >= 2 ? f4(std(ys)) : 'N/A'
    };
  });

  var l2Stats = [];
  k3Keys.forEach(function(k3) {
    var cl3 = l3Map[k3];
    Object.keys(cl3.l2Map).forEach(function(k2) {
      var cl2 = cl3.l2Map[k2];
      var ys = cl2.obs.map(function(r) { return r.y; });
      l2Stats.push({
        l3: cl3.label,
        group: cl2.label,
        n: ys.length,
        mean: f4(mean(ys)),
        sd: ys.length >= 2 ? f4(std(ys)) : 'N/A'
      });
    });
  });

  var r2L1 = nullS2 > 0 ? Math.max(0, (nullS2 - sigma2) / nullS2) : 0;
  var r2L2 = nullTauL2 > 0 ? Math.max(0, (nullTauL2 - tauL2) / nullTauL2) : 0;
  var r2L3 = nullTauL3 > 0 ? Math.max(0, (nullTauL3 - tauL3) / nullTauL3) : 0;

  return {
    subtype: 'hlm-3level',
    k: J,
    k2: J,
    k3: K,
    n: N,
    grandMean: f4(nullDecomp.gm),
    ICC: f4(iccL2WithinL3),
    ICC_L3: f4(iccL3),
    ICC_L2_within_L3: f4(iccL2WithinL3),
    varL1: f4(sigma2),
    varL2: f4(tauL2),
    varL3: f4(tauL3),
    varBetween: f4(tauL2 + tauL3),
    varWithin: f4(sigma2),
    varTotal: f4(varTotal),
    vpcL1: f4(vpcL1),
    vpcL2: f4(vpcL2),
    vpcL3: f4(vpcL3),
    F_L3: f4(fL3),
    p_L3_fmt: pFmt(pL3),
    sig_L3: pL3 < 0.05,
    F_L2: f4(fL2),
    p_L2_fmt: pFmt(pL2),
    sig_L2: pL2 < 0.05,
    F: f4(fL3),
    p_fmt: pFmt(pL3),
    sig: pL3 < 0.05,
    deviance: f4(deviance),
    AIC: f4(AIC),
    BIC: f4(BIC),
    pseudoR2_L1: f4(r2L1),
    pseudoR2_L2: f4(r2L2),
    pseudoR2_L3: f4(r2L3),
    fixedEffects: fixedEffects,
    l3Stats: l3Stats,
    l2Stats: l2Stats,
    grpStats: l3Stats,
    l1preds: l1List
  };
}
