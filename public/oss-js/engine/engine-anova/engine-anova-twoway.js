// Fitur: Two-Way Factorial ANOVA (kategori Analyze: ANOVA)
//   twowayANOVA
// Depends on: engine-core-distributions.js, engine-core-helpers.js

function twowayANOVA(dataArr, depVar, factorA, factorB) {
  var rows = dataArr.filter(function(r) {
    return isV(Number(r[depVar])) &&
      r[factorA] !== null && r[factorA] !== undefined && r[factorA] !== '' &&
      r[factorB] !== null && r[factorB] !== undefined && r[factorB] !== '';
  });
  var n = rows.length;
  req(n, 4, 'Two-Way ANOVA');

  var levA = [...new Set(rows.map(function(r) { return String(r[factorA]); }))].sort();
  var levB = [...new Set(rows.map(function(r) { return String(r[factorB]); }))].sort();
  req(levA.length, 2, 'Factor A must have ≥2 levels');
  req(levB.length, 2, 'Factor B must have ≥2 levels');

  var yAll = rows.map(function(r) { return Number(r[depVar]); });
  var grandMean = mean(yAll);
  var ssTotal = yAll.reduce(function(s, y) { return s + (y - grandMean) * (y - grandMean); }, 0);

  var cells = {};
  levA.forEach(function(a) {
    cells[a] = {};
    levB.forEach(function(b) {
      var vs = rows.filter(function(r) { return String(r[factorA]) === a && String(r[factorB]) === b; })
        .map(function(r) { return Number(r[depVar]); });
      cells[a][b] = { n: vs.length, mean: vs.length ? mean(vs) : NaN, vals: vs };
    });
  });

  var meanA = {};
  levA.forEach(function(a) {
    var vs = rows.filter(function(r) { return String(r[factorA]) === a; }).map(function(r) { return Number(r[depVar]); });
    meanA[a] = { n: vs.length, mean: mean(vs) };
  });
  var meanB = {};
  levB.forEach(function(b) {
    var vs = rows.filter(function(r) { return String(r[factorB]) === b; }).map(function(r) { return Number(r[depVar]); });
    meanB[b] = { n: vs.length, mean: mean(vs) };
  });

  var ssA = levA.reduce(function(s, a) {
    return s + meanA[a].n * Math.pow(meanA[a].mean - grandMean, 2);
  }, 0);
  var dfA = levA.length - 1;

  var ssB = levB.reduce(function(s, b) {
    return s + meanB[b].n * Math.pow(meanB[b].mean - grandMean, 2);
  }, 0);
  var dfB = levB.length - 1;

  var ssCells = 0;
  levA.forEach(function(a) {
    levB.forEach(function(b) {
      var c = cells[a][b];
      if (c.n > 0 && isFinite(c.mean)) {
        ssCells += c.n * Math.pow(c.mean - grandMean, 2);
      }
    });
  });
  var ssAB = ssCells - ssA - ssB;
  var dfAB = dfA * dfB;

  var ssError = 0;
  levA.forEach(function(a) {
    levB.forEach(function(b) {
      var c = cells[a][b];
      var cm = c.mean;
      c.vals.forEach(function(v) { ssError += (v - cm) * (v - cm); });
    });
  });
  var dfError = n - levA.length * levB.length;

  var msA = dfA > 0 ? ssA / dfA : NaN;
  var msB = dfB > 0 ? ssB / dfB : NaN;
  var msAB = dfAB > 0 ? ssAB / dfAB : NaN;
  var msError = dfError > 0 ? ssError / dfError : NaN;

  var FA = msError > 0 ? msA / msError : NaN;
  var FB = msError > 0 ? msB / msError : NaN;
  var FAB = msError > 0 ? msAB / msError : NaN;

  var pA = isFinite(FA) && FA > 0 ? 1 - fCDF(FA, dfA, dfError) : NaN;
  var pB = isFinite(FB) && FB > 0 ? 1 - fCDF(FB, dfB, dfError) : NaN;
  var pAB = isFinite(FAB) && FAB > 0 ? 1 - fCDF(FAB, dfAB, dfError) : NaN;

  var eta2A = ssTotal > 0 ? ssA / ssTotal : 0;
  var eta2B = ssTotal > 0 ? ssB / ssTotal : 0;
  var eta2AB = ssTotal > 0 ? ssAB / ssTotal : 0;
  var pEta2A = (ssA + ssError) > 0 ? ssA / (ssA + ssError) : 0;
  var pEta2B = (ssB + ssError) > 0 ? ssB / (ssB + ssError) : 0;
  var pEta2AB = (ssAB + ssError) > 0 ? ssAB / (ssAB + ssError) : 0;

  var cellMeansTable = levA.map(function(a) {
    return {
      level: a, byB: levB.map(function(b) {
        return { level: b, mean: cells[a][b].mean, n: cells[a][b].n };
      })
    };
  });

  return {
    n, depVar, factorA, factorB,
    levA, levB, grandMean: f4(grandMean),
    effects: [
      { source: factorA, SS: f4(ssA), df: dfA, MS: f4(msA), F: f4(FA), p: f4(pA), p_fmt: pFmt(pA), sig: pA < 0.05, eta2: f4(eta2A), pEta2: f4(pEta2A) },
      { source: factorB, SS: f4(ssB), df: dfB, MS: f4(msB), F: f4(FB), p: f4(pB), p_fmt: pFmt(pB), sig: pB < 0.05, eta2: f4(eta2B), pEta2: f4(pEta2B) },
      { source: factorA + '×' + factorB, SS: f4(ssAB), df: dfAB, MS: f4(msAB), F: f4(FAB), p: f4(pAB), p_fmt: pFmt(pAB), sig: pAB < 0.05, eta2: f4(eta2AB), pEta2: f4(pEta2AB) }
    ],
    error: { SS: f4(ssError), df: dfError, MS: f4(msError) },
    total: { SS: f4(ssTotal), df: n - 1 },
    cellMeansTable,
    meanA: levA.map(function(a) { return { level: a, mean: f4(meanA[a].mean), n: meanA[a].n }; }),
    meanB: levB.map(function(b) { return { level: b, mean: f4(meanB[b].mean), n: meanB[b].n }; }),
  };
}
