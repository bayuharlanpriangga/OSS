// Fitur: Multivariate Analysis of Variance / MANOVA (kategori Analyze: General Linear Model)
//   manovaProper, manovaChi2CDF, manovaRegGammaP, manovaRegGammaQ
// Depends on: engine-core-distributions.js, engine-core-helpers.js, engine-core-matrix.js, engine-glm-univariate.js (glmUnivariate)

function manovaProper(data, depVars, factor) {
  var rows = data.filter(function(r) {
    if (r[factor] === null || r[factor] === undefined || r[factor] === '') return false;
    return depVars.every(function(dv) { var v = Number(r[dv]); return isV(v); });
  });
  var n = rows.length;
  var p = depVars.length;
  req(n, p + 2, 'MANOVA: need more cases than DVs');
  req(p, 2, 'MANOVA: need ≥2 dependent variables');

  var groupKeys = [];
  rows.forEach(function(r) {
    var g = String(r[factor]);
    if (groupKeys.indexOf(g) === -1) groupKeys.push(g);
  });
  groupKeys.sort();
  var g = groupKeys.length;
  req(g, 2, 'MANOVA: need ≥2 groups');

  var grandMeans = depVars.map(function(dv) {
    return mean(rows.map(function(r) { return Number(r[dv]); }));
  });

  var groupMeans = groupKeys.map(function(gk) {
    var gRows = rows.filter(function(r) { return String(r[factor]) === gk; });
    return {
      key: gk,
      n: gRows.length,
      means: depVars.map(function(dv) {
        return mean(gRows.map(function(r) { return Number(r[dv]); }));
      }),
      rows: gRows
    };
  });

  var H = [];
  for (var i = 0; i < p; i++) {
    H[i] = [];
    for (var j = 0; j < p; j++) {
      var val = 0;
      groupMeans.forEach(function(gm) {
        val += gm.n * (gm.means[i] - grandMeans[i]) * (gm.means[j] - grandMeans[j]);
      });
      H[i][j] = val;
    }
  }

  var E = [];
  for (var i = 0; i < p; i++) {
    E[i] = [];
    for (var j = 0; j < p; j++) E[i][j] = 0;
  }
  groupMeans.forEach(function(gm) {
    gm.rows.forEach(function(r) {
      for (var i = 0; i < p; i++) {
        for (var j = 0; j < p; j++) {
          E[i][j] += (Number(r[depVars[i]]) - gm.means[i]) * (Number(r[depVars[j]]) - gm.means[j]);
        }
      }
    });
  });

  var Einv, eigenVals;
  try { Einv = matInv(E); } catch (e) { throw new Error('Error matrix is singular — check for collinear DVs or empty groups'); }
  var EinvH = matMul(Einv, H);
  var eigRes = jacobiEigen(EinvH, 150);
  eigenVals = eigRes.values.map(function(v) { return Math.max(0, v); });
  eigenVals.sort(function(a, b) { return b - a; });
  var s = Math.min(p, g - 1);
  eigenVals = eigenVals.slice(0, s);

  var pillai = eigenVals.reduce(function(acc, lam) { return acc + lam / (1 + lam); }, 0);
  var wilks = eigenVals.reduce(function(acc, lam) { return acc * (1 / (1 + lam)); }, 1);
  var hotelling = eigenVals.reduce(function(acc, lam) { return acc + lam; }, 0);
  var roy = eigenVals.length > 0 ? eigenVals[0] : 0;

  var dfH = g - 1;
  var dfE = n - g;

  var pillaiF = NaN, pillaiDf1 = NaN, pillaiDf2 = NaN, pillaiP = NaN;
  pillaiDf1 = s * dfH;
  pillaiDf2 = s * (dfE - p + s);
  if (s > 0 && pillaiDf2 > 0) {
    pillaiF = (pillai / (s - pillai)) * (pillaiDf2 / pillaiDf1);
    pillaiP = isFinite(pillaiF) && pillaiF > 0 ? 1 - fCDF(pillaiF, pillaiDf1, pillaiDf2) : NaN;
  }

  var wilksF = NaN, wilksDf1 = NaN, wilksDf2 = NaN, wilksP = NaN;
  wilksDf1 = p * dfH;
  var pp = p * p, hh = dfH * dfH;
  var r_rao = NaN;
  if (pp + hh - 5 > 0) r_rao = Math.sqrt((pp * hh - 4) / (pp + hh - 5));
  var u = dfE - (p - dfH + 1) / 2;
  wilksDf2 = u * (isFinite(r_rao) ? r_rao : 1) - (p * dfH - 2) / 2;
  if (wilks > 0 && wilksDf1 > 0 && wilksDf2 > 0) {
    var wilksLam = Math.pow(wilks, isFinite(r_rao) ? 1 / r_rao : 1);
    wilksF = ((1 - wilksLam) / wilksLam) * (wilksDf2 / wilksDf1);
    wilksP = isFinite(wilksF) && wilksF > 0 ? 1 - fCDF(wilksF, wilksDf1, wilksDf2) : NaN;
  }

  var hotellingF = NaN, hotellingDf1 = NaN, hotellingDf2 = NaN, hotellingP = NaN;
  hotellingDf1 = s * dfH;
  hotellingDf2 = s * (dfE - p - 1) + 2;
  if (hotellingDf1 > 0 && hotellingDf2 > 0 && s > 0) {
    hotellingF = (hotelling / s) * (hotellingDf2 / hotellingDf1);
    hotellingP = isFinite(hotellingF) && hotellingF > 0 ? 1 - fCDF(hotellingF, hotellingDf1, hotellingDf2) : NaN;
  }

  var royF = NaN, royDf1 = NaN, royDf2 = NaN, royP = NaN;
  royDf1 = Math.max(p, dfH);
  royDf2 = dfE - royDf1 + dfH;
  if (royDf1 > 0 && royDf2 > 0) {
    royF = roy * royDf2 / royDf1;
    royP = isFinite(royF) && royF > 0 ? 1 - fCDF(royF, royDf1, royDf2) : NaN;
  }

  var pillaiEta2 = pillaiDf1 > 0 && pillaiDf1 + pillaiDf2 > 0
    ? (pillaiF * pillaiDf1) / (pillaiF * pillaiDf1 + pillaiDf2) : NaN;

  var boxM = NaN, boxP = NaN, boxF = NaN, boxDf1 = NaN, boxDf2 = NaN;
  try {
    var Sp = E.map(function(row) { return row.map(function(v) { return v / dfE; }); });
    var lnDetSp = Math.log(Math.abs(matDet(Sp)));
    var sumLnDet = 0;
    groupMeans.map(function(gm) {
      var ni = gm.n;
      if (ni < 2) return 0;
      var Si = [];
      for (var i2 = 0; i2 < p; i2++) {
        Si[i2] = [];
        for (var j2 = 0; j2 < p; j2++) {
          var s2 = 0;
          gm.rows.forEach(function(r) {
            s2 += (Number(r[depVars[i2]]) - gm.means[i2]) * (Number(r[depVars[j2]]) - gm.means[j2]);
          });
          Si[i2][j2] = s2 / (ni - 1);
        }
      }
      var ld = Math.log(Math.abs(matDet(Si)));
      sumLnDet += (ni - 1) * ld;
      return ld;
    });
    var c1 = (2 * p * p + 3 * p - 1) / (6 * (p + 1) * (g - 1)) *
      (groupMeans.reduce(function(s, gm) { return s + 1 / (gm.n - 1); }, 0) - 1 / dfE);
    boxM = (1 - c1) * (dfE * lnDetSp - sumLnDet);
    boxDf1 = p * (p + 1) * (g - 1) / 2;
    var c2 = (p - 1) * (p + 2) / (6 * (g - 1));
    var sumInvSq = groupMeans.reduce(function(s, gm) { return s + 1 / ((gm.n - 1) * (gm.n - 1)); }, 0);
    var invSqTotal = 1 / (dfE * dfE);
    var b = (sumInvSq - invSqTotal) * c2;
    if (b >= 0 && b < 1) {
      boxDf2 = (boxDf1 + 2) / b;
      boxF = boxM / boxDf1 * (1 - b);
      boxP = isFinite(boxF) && boxF >= 0 ? 1 - fCDF(Math.abs(boxF), boxDf1, Math.abs(boxDf2)) : NaN;
    } else {
      boxP = 1 - manovaChi2CDF(boxM, boxDf1);
    }
  } catch (e) { /* Box's M failed silently */ }

  var univariate = depVars.map(function(dv) {
    try { return { dv: dv, res: glmUnivariate(data, dv, [factor], []) }; }
    catch (e) { return { dv: dv, res: { _err: e.message } }; }
  });

  return {
    n, p, g, s, factor,
    depVars, groupKeys,
    groupMeans: groupMeans.map(function(gm) {
      return { key: gm.key, n: gm.n, means: gm.means.map(f4) };
    }),
    grandMeans: grandMeans.map(f4),
    eigenvalues: eigenVals.map(f4),
    pillai: { stat: f4(pillai), F: f4(pillaiF), df1: pillaiDf1, df2: f4(pillaiDf2), p: pillaiP, p_fmt: pFmt(pillaiP), sig: pillaiP < 0.05 },
    wilks: { stat: f4(wilks), F: f4(wilksF), df1: wilksDf1, df2: f4(wilksDf2), p: wilksP, p_fmt: pFmt(wilksP), sig: wilksP < 0.05 },
    hotelling: { stat: f4(hotelling), F: f4(hotellingF), df1: hotellingDf1, df2: f4(hotellingDf2), p: hotellingP, p_fmt: pFmt(hotellingP), sig: hotellingP < 0.05 },
    roy: { stat: f4(roy), F: f4(royF), df1: royDf1, df2: f4(royDf2), p: royP, p_fmt: pFmt(royP), sig: royP < 0.05 },
    pillaiEta2: isFinite(pillaiEta2) ? f4(pillaiEta2) : '—',
    boxM: isFinite(boxM) ? f4(boxM) : '—',
    boxP: isFinite(boxP) ? pFmt(boxP) : '—',
    boxSig: isFinite(boxP) && boxP < 0.05,
    univariate,
    H, E
  };
}

function manovaChi2CDF(x, df) {
  if (x <= 0) return 0;
  return manovaRegGammaP(df / 2, x / 2);
}
function manovaRegGammaP(a, x) {
  if (x <= 0) return 0;
  if (x > (a + 1)) { return 1 - manovaRegGammaQ(a, x); }
  var sum = 1 / a, term = 1 / a;
  for (var n = 1; n < 300; n++) { term *= x / (a + n); sum += term; if (Math.abs(term) < 1e-10) break; }
  return sum * Math.exp(-x + a * Math.log(x) - lnG(a));
}
function manovaRegGammaQ(a, x) {
  var fpmin = 1e-30, b = x + 1 - a, c = 1 / fpmin, d = 1 / b, h = d;
  for (var i = 1; i < 300; i++) { var an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < fpmin) d = fpmin; c = b + an / c; if (Math.abs(c) < fpmin) c = fpmin; d = 1 / d; var del = d * c; h *= del; if (Math.abs(del - 1) < 1e-10) break; }
  return Math.exp(-x + a * Math.log(x) - lnG(a)) * h;
}
