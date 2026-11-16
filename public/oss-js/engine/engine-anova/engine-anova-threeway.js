// Fitur: Three-Way Factorial ANOVA (Factorial A×B×C, Type I SS) (kategori Analyze: ANOVA)
//   threewayANOVA
// Depends on: engine-core-distributions.js, engine-core-helpers.js

function threewayANOVA(dataArr, depVar, factorA, factorB, factorC) {
  var rows = dataArr.filter(function(r) {
    return isV(Number(r[depVar])) &&
      r[factorA] !== null && r[factorA] !== undefined && r[factorA] !== '' &&
      r[factorB] !== null && r[factorB] !== undefined && r[factorB] !== '' &&
      r[factorC] !== null && r[factorC] !== undefined && r[factorC] !== '';
  });
  var n = rows.length;
  req(n, 8, 'Three-Way ANOVA');

  var levA = [...new Set(rows.map(function(r) { return String(r[factorA]); }))].sort();
  var levB = [...new Set(rows.map(function(r) { return String(r[factorB]); }))].sort();
  var levC = [...new Set(rows.map(function(r) { return String(r[factorC]); }))].sort();
  req(levA.length, 2, 'Factor A must have ≥2 levels');
  req(levB.length, 2, 'Factor B must have ≥2 levels');
  req(levC.length, 2, 'Factor C must have ≥2 levels');

  var yAll = rows.map(function(r) { return Number(r[depVar]); });
  var grandMean = mean(yAll);
  var ssTotal = yAll.reduce(function(s, y) { return s + (y - grandMean) * (y - grandMean); }, 0);

  function cellVals(a, b, c) {
    return rows.filter(function(r) {
      return (a === null || String(r[factorA]) === a) &&
        (b === null || String(r[factorB]) === b) &&
        (c === null || String(r[factorC]) === c);
    }).map(function(r) { return Number(r[depVar]); });
  }

  var mA = {}, mB = {}, mC = {};
  levA.forEach(function(a) { var vs = cellVals(a, null, null); mA[a] = { n: vs.length, m: mean(vs) }; });
  levB.forEach(function(b) { var vs = cellVals(null, b, null); mB[b] = { n: vs.length, m: mean(vs) }; });
  levC.forEach(function(c) { var vs = cellVals(null, null, c); mC[c] = { n: vs.length, m: mean(vs) }; });

  var mAB = {}, mAC = {}, mBC = {};
  levA.forEach(function(a) { levB.forEach(function(b) { var vs = cellVals(a, b, null); mAB[a + '_' + b] = { n: vs.length, m: mean(vs) }; }); });
  levA.forEach(function(a) { levC.forEach(function(c) { var vs = cellVals(a, null, c); mAC[a + '_' + c] = { n: vs.length, m: mean(vs) }; }); });
  levB.forEach(function(b) { levC.forEach(function(c) { var vs = cellVals(null, b, c); mBC[b + '_' + c] = { n: vs.length, m: mean(vs) }; }); });

  var ssA = levA.reduce(function(s, a) { return s + mA[a].n * Math.pow(mA[a].m - grandMean, 2); }, 0);
  var ssB = levB.reduce(function(s, b) { return s + mB[b].n * Math.pow(mB[b].m - grandMean, 2); }, 0);
  var ssC = levC.reduce(function(s, c) { return s + mC[c].n * Math.pow(mC[c].m - grandMean, 2); }, 0);
  var dfA = levA.length - 1, dfB = levB.length - 1, dfC = levC.length - 1;

  var ssABcells = 0;
  levA.forEach(function(a) { levB.forEach(function(b) { var v = mAB[a + '_' + b]; if (v.n > 0) ssABcells += v.n * Math.pow(v.m - grandMean, 2); }); });
  var ssAB = ssABcells - ssA - ssB;
  var dfAB = dfA * dfB;

  var ssACcells = 0;
  levA.forEach(function(a) { levC.forEach(function(c) { var v = mAC[a + '_' + c]; if (v.n > 0) ssACcells += v.n * Math.pow(v.m - grandMean, 2); }); });
  var ssAC = ssACcells - ssA - ssC;
  var dfAC = dfA * dfC;

  var ssBCcells = 0;
  levB.forEach(function(b) { levC.forEach(function(c) { var v = mBC[b + '_' + c]; if (v.n > 0) ssBCcells += v.n * Math.pow(v.m - grandMean, 2); }); });
  var ssBC = ssBCcells - ssB - ssC;
  var dfBC = dfB * dfC;

  var ssABCcells = 0;
  levA.forEach(function(a) {
    levB.forEach(function(b) {
      levC.forEach(function(c) {
        var vs = cellVals(a, b, c); if (!vs.length) return;
        ssABCcells += vs.length * Math.pow(mean(vs) - grandMean, 2);
      });
    });
  });
  var ssABC = ssABCcells - ssA - ssB - ssC - ssAB - ssAC - ssBC;
  var dfABC = dfA * dfB * dfC;

  var totalCells = levA.length * levB.length * levC.length;
  var emptyCells = [], singletonCells = [];
  levA.forEach(function(a) {
    levB.forEach(function(b) {
      levC.forEach(function(c) {
        var vs = cellVals(a, b, c);
        var key = a + '×' + b + '×' + c;
        if (vs.length === 0) emptyCells.push(key);
        else if (vs.length === 1) singletonCells.push(key);
      });
    });
  });
  var _nCellsCheck = 0;
  levA.forEach(function(a) {
    levB.forEach(function(b) {
      levC.forEach(function(c) {
        if (cellVals(a, b, c).length > 0) _nCellsCheck++;
      });
    });
  });
  var _dfErrCheck = n - _nCellsCheck;
  if (_dfErrCheck <= 0) {
    throw new Error(
      '🔴 Model singular: ' + emptyCells.length + ' of ' + totalCells + ' cells are empty. ' +
      'dfError = ' + _dfErrCheck + ' ≤ 0 — within-cell error cannot be estimated. ' +
      'Try reducing factor levels, merging sparse groups, or using Two-Way ANOVA.'
    );
  }
  var sparseWarnings = [];
  if (emptyCells.length > 0) {
    sparseWarnings.push({
      level: 'warning', icon: '🟠',
      msg: emptyCells.length + ' empty cell(s) (' + Math.round(emptyCells.length / totalCells * 100) + '% of ' + totalCells + ' cells). ' +
        'These combinations are excluded from SS computation. Affected interaction effects may be biased.',
      cells: emptyCells
    });
  }
  if (singletonCells.length > 0) {
    sparseWarnings.push({
      level: 'caution', icon: '🟡',
      msg: singletonCells.length + ' cell(s) with n=1. SE and effect sizes for these cells are unreliable.',
      cells: singletonCells
    });
  }

  var ssError = 0, nCells = 0;
  levA.forEach(function(a) {
    levB.forEach(function(b) {
      levC.forEach(function(c) {
        var vs = cellVals(a, b, c); if (!vs.length) return;
        var cm = mean(vs); nCells++;
        vs.forEach(function(v) { ssError += (v - cm) * (v - cm); });
      });
    });
  });
  var dfError = n - nCells;

  function effect(source, ss, df) {
    var ms = df > 0 ? ss / df : NaN;
    var msE = dfError > 0 ? ssError / dfError : NaN;
    var F = msE > 0 ? ms / msE : NaN;
    var p = isFinite(F) && F > 0 ? 1 - fCDF(F, df, dfError) : NaN;
    var eta2 = ssTotal > 0 ? ss / ssTotal : 0;
    var pEta2 = (ss + ssError) > 0 ? ss / (ss + ssError) : 0;
    return { source, SS: f4(ss), df, MS: f4(ms), F: f4(F), p: f4(p), p_fmt: pFmt(p), sig: p < 0.05, eta2: f4(eta2), pEta2: f4(pEta2) };
  }
  var msError = dfError > 0 ? ssError / dfError : NaN;

  var cellMeansAB = levA.map(function(a) {
    return {
      level: a, byB: levB.map(function(b) {
        var v = mAB[a + '_' + b]; return { level: b, mean: f4(v.m), n: v.n, empty: v.n === 0 };
      })
    };
  });

  return {
    n, depVar, factorA, factorB, factorC,
    levA, levB, levC, grandMean: f4(grandMean),
    effects: [
      effect(factorA, ssA, dfA),
      effect(factorB, ssB, dfB),
      effect(factorC, ssC, dfC),
      effect(factorA + '×' + factorB, ssAB, dfAB),
      effect(factorA + '×' + factorC, ssAC, dfAC),
      effect(factorB + '×' + factorC, ssBC, dfBC),
      effect(factorA + '×' + factorB + '×' + factorC, ssABC, dfABC),
    ],
    sparseWarnings,
    emptyCells, singletonCells, totalCells, nCells,
    error: { SS: f4(ssError), df: dfError, MS: f4(msError) },
    total: { SS: f4(ssTotal), df: n - 1 },
    cellMeansAB,
    meanA: levA.map(function(a) { return { level: a, mean: f4(mA[a].m), n: mA[a].n }; }),
    meanB: levB.map(function(b) { return { level: b, mean: f4(mB[b].m), n: mB[b].n }; }),
    meanC: levC.map(function(c) { return { level: c, mean: f4(mC[c].m), n: mC[c].n }; }),
  };
}
