// Fitur: Hierarchical Linear Model — ICC & Variance Partitioning (Null / Unconditional Means Model)
//   computeHLMICC, computeHLMBasics
// Depends on: engine-core-distributions.js, engine-core-helpers.js, global data

function computeHLMICC(dep, grp, dataArr) {
  if (!dep || !grp) return null;
  var src = Array.isArray(dataArr) ? dataArr : data;
  var groups = {};
  src.forEach(function(r) {
    var g = r[grp];
    var y = parseFloat(r[dep]);
    if (g === undefined || g === null || g === '' || isNaN(y)) return;
    var key = String(g);
    if (!groups[key]) groups[key] = [];
    groups[key].push(y);
  });
  var gkeys = Object.keys(groups);
  var k = gkeys.length;
  if (k < 2) return { _err: 'Need ≥2 groups' };
  var allY = [];
  var sumNj2 = 0;
  gkeys.forEach(function(g) {
    var gv = groups[g];
    sumNj2 += gv.length * gv.length;
    gv.forEach(function(v) { allY.push(v); });
  });
  var n = allY.length;
  if (n < k + 1) return { _err: 'Too few observations' };

  var grandMean = mean(allY);
  var SSB = 0, SSW = 0;
  gkeys.forEach(function(g) {
    var gv = groups[g];
    var gm = mean(gv);
    SSB += gv.length * Math.pow(gm - grandMean, 2);
    gv.forEach(function(y) { SSW += Math.pow(y - gm, 2); });
  });
  var dfB = k - 1, dfW = n - k;
  var MSB = SSB / dfB, MSW = SSW / dfW;

  // Snijders & Bosker exact unbalanced effective cluster size n0
  var avgGrpSize = n / k;
  var n0 = k > 1 ? (n - sumNj2 / n) / (k - 1) : avgGrpSize;
  if (!(n0 > 0)) n0 = avgGrpSize;

  var varBetween = Math.max(0, (MSB - MSW) / n0);
  var varWithin = MSW;
  var varTotal = varBetween + varWithin;
  var ICC = varTotal > 0 ? varBetween / varTotal : 0;
  var ICC2 = MSB > 0 ? Math.max(0, (MSB - MSW) / MSB) : 0;
  var deff = 1 + (avgGrpSize - 1) * ICC;
  var effN = deff > 0 ? n / deff : n;
  var Fval = MSW > 0 ? MSB / MSW : NaN;
  var pFval = isNaN(Fval) ? NaN : 1 - fCDF(Fval, dfB, dfW);

  var grpStats = gkeys.map(function(g) {
    var gv = groups[g];
    return {
      group: g,
      n: gv.length,
      mean: f4(mean(gv)),
      sd: gv.length >= 2 ? f4(std(gv)) : 'N/A'
    };
  });

  return {
    subtype: 'hlm-icc',
    k: k,
    n: n,
    n0: f4(n0),
    grandMean: f4(grandMean),
    ICC: f4(ICC),
    ICC2: f4(ICC2),
    varBetween: f4(varBetween),
    varWithin: f4(varWithin),
    varTotal: f4(varTotal),
    pctBetween: f4(varTotal > 0 ? (varBetween / varTotal) * 100 : 0),
    pctWithin: f4(varTotal > 0 ? (varWithin / varTotal) * 100 : 0),
    MSB: f4(MSB),
    MSW: f4(MSW),
    dfB: dfB,
    dfW: dfW,
    F: f4(Fval),
    p_fmt: pFmt(pFval),
    sig: pFval < 0.05,
    grpStats: grpStats,
    design_effect: f4(deff),
    effectiveN: Math.round(effN),
    minN_needed: Math.ceil(400 / deff)
  };
}

function computeHLMBasics(dep, grp, dataArr) {
  return computeHLMICC(dep, grp, dataArr);
}
