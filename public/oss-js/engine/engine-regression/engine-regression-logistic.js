// Fitur: Logistic Regression (Binary & Multinomial) (kategori Analyze: Regression)
//   logisticReg
// Depends on: engine-core-distributions.js, engine-core-helpers.js, engine-core-matrix.js

function logisticReg(dvName, xNames, dataArr, type) {
  type = type || 'binary';
  var cases = dataArr.filter(function(r) {
    return xNames.every(function(v) { return typeof r[v] === 'number' && isFinite(r[v]); })
      && r[dvName] !== null && r[dvName] !== undefined;
  });
  var n = cases.length;
  if (n < 10) throw new Error('N terlalu kecil (N=' + n + '). Butuh ≥10 cases valid.');
  if (xNames.length < 1) throw new Error('Pilih minimal 1 prediktor.');

  var cats = [...new Set(cases.map(function(r) { return r[dvName]; }))]
    .sort(function(a, b) { return String(a).localeCompare(String(b)); });

  if (type === 'binary' && cats.length !== 2)
    throw new Error('Binary logistic butuh tepat 2 kategori DV (ditemukan ' + cats.length + ').');
  if (type === 'multinomial' && cats.length < 3)
    throw new Error('Multinomial logistic butuh ≥3 kategori DV (ditemukan ' + cats.length + ').');

  function sigmoid(z) { return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, z)))); }

  var xMeans = xNames.map(function(v) { return mean(cases.map(function(r) { return r[v]; })); });
  var xStds = xNames.map(function(v) { return std(cases.map(function(r) { return r[v]; })) || 1; });

  function getX(row) { return xNames.map(function(v, i) { return (row[v] - xMeans[i]) / xStds[i]; }); }

  function binaryLogistic(yBin) {
    var p = xNames.length;
    var beta = new Array(p + 1).fill(0);
    var Xs = cases.map(getX);

    function logLik(b) {
      var ll = 0;
      for (var i = 0; i < n; i++) {
        var z = b[0]; for (var j = 0; j < p; j++) z += b[j + 1] * Xs[i][j];
        var pi = sigmoid(z); pi = Math.max(1e-10, Math.min(1 - 1e-10, pi));
        ll += yBin[i] * Math.log(pi) + (1 - yBin[i]) * Math.log(1 - pi);
      }
      return ll;
    }

    var curLL = logLik(beta);
    for (var iter = 0; iter < 100; iter++) {
      var grad = new Array(p + 1).fill(0);
      var I = [];
      for (var r = 0; r <= p; r++) { I.push(new Array(p + 1).fill(0)); }
      for (var i = 0; i < n; i++) {
        var z = beta[0];
        for (var j = 0; j < p; j++) z += beta[j + 1] * Xs[i][j];
        var pi = sigmoid(z);
        pi = Math.max(1e-10, Math.min(1 - 1e-10, pi));
        var err = yBin[i] - pi;
        var w = pi * (1 - pi);
        grad[0] += err;
        I[0][0] += w;
        for (var j = 0; j < p; j++) {
          grad[j + 1] += err * Xs[i][j];
          I[0][j + 1] += w * Xs[i][j];
          I[j + 1][0] += w * Xs[i][j];
          for (var k = 0; k < p; k++) I[j + 1][k + 1] += w * Xs[i][j] * Xs[i][k];
        }
      }
      for (var d = 0; d <= p; d++) I[d][d] += 1e-8;
      var Iinv;
      try { Iinv = matInv(I); }
      catch (e) { throw new Error('Matriks informasi singular — cek multikolinearitas antar prediktor atau perfect separation.'); }
      var delta = new Array(p + 1).fill(0);
      for (var a2 = 0; a2 <= p; a2++) for (var b2 = 0; b2 <= p; b2++) delta[a2] += Iinv[a2][b2] * grad[b2];

      var step = 1, accepted = false, newBeta = beta, newLL = curLL;
      for (var h = 0; h < 30; h++) {
        newBeta = beta.map(function(bv, idx) { return bv + step * delta[idx]; });
        newLL = logLik(newBeta);
        if (newLL >= curLL - 1e-12) { accepted = true; break; }
        step /= 2;
      }
      if (!accepted) break;
      var maxChange = 0;
      for (var q = 0; q <= p; q++) maxChange = Math.max(maxChange, Math.abs(newBeta[q] - beta[q]));
      beta = newBeta; curLL = newLL;
      if (maxChange < 1e-8) break;
    }
    var betaOrig = [beta[0]];
    for (var j = 0; j < p; j++) betaOrig.push(beta[j + 1] / xStds[j]);
    betaOrig[0] = beta[0] - xNames.reduce(function(s, v, j) { return s + beta[j + 1] * xMeans[j] / xStds[j]; }, 0);

    return { beta: betaOrig, betaStd: beta };
  }

  function computeSE(betaStd) {
    var p = xNames.length;
    var Xs = cases.map(getX);
    var I = new Array(p + 1).fill(0).map(function() { return new Array(p + 1).fill(0); });
    for (var i = 0; i < n; i++) {
      var z = betaStd[0]; for (var j = 0; j < p; j++) z += betaStd[j + 1] * Xs[i][j];
      var pi = sigmoid(z); pi = Math.max(1e-10, Math.min(1 - 1e-10, pi));
      var w = pi * (1 - pi);
      I[0][0] += w;
      for (var j = 0; j < p; j++) {
        I[0][j + 1] += w * Xs[i][j]; I[j + 1][0] += w * Xs[i][j];
        for (var k = 0; k < p; k++) I[j + 1][k + 1] += w * Xs[i][j] * Xs[i][k];
      }
    }
    var cov;
    try { cov = matInv(I); }
    catch (e) { throw new Error('Matriks informasi singular — cek multikolinearitas antar prediktor atau perfect separation.'); }
    var A = [];
    for (var r = 0; r <= p; r++) { A.push(new Array(p + 1).fill(0)); }
    A[0][0] = 1;
    for (var j = 0; j < p; j++) { A[0][j + 1] = -xMeans[j] / xStds[j]; A[j + 1][j + 1] = 1 / xStds[j]; }
    var se = [];
    for (var r = 0; r <= p; r++) {
      var v = 0;
      for (var a3 = 0; a3 <= p; a3++) for (var b3 = 0; b3 <= p; b3++) v += A[r][a3] * cov[a3][b3] * A[r][b3];
      se.push(Math.sqrt(Math.max(0, v)));
    }
    return se;
  }

  if (type === 'binary') {
    var yBin = cases.map(function(r) { return r[dvName] === cats[1] ? 1 : 0; });
    var fit = binaryLogistic(yBin);
    var betaOrig = fit.beta;
    var betaStd = fit.betaStd;
    var seOrig = computeSE(betaStd);

    var logL = 0;
    for (var i = 0; i < n; i++) {
      var z = betaOrig[0]; for (var j = 0; j < xNames.length; j++) z += betaOrig[j + 1] * cases[i][xNames[j]];
      var pi = sigmoid(z); pi = Math.max(1e-10, Math.min(1 - 1e-10, pi));
      logL += yBin[i] * Math.log(pi) + (1 - yBin[i]) * Math.log(1 - pi);
    }
    var pY = yBin.filter(function(y) { return y === 1; }).length / n;
    pY = Math.max(1e-10, Math.min(1 - 1e-10, pY));
    var nullLogL = n * (pY * Math.log(pY) + (1 - pY) * Math.log(1 - pY));

    var m2ll = -2 * logL;
    var chiSq2 = f4(-2 * (nullLogL - logL));
    var chiSqDf = xNames.length;
    var chiSqP = chi2P(parseFloat(chiSq2), chiSqDf);

    var coxSnell = f4(1 - Math.exp((2 * (nullLogL - logL)) / n));
    var nagelkerke = f4(parseFloat(coxSnell) / (1 - Math.exp(2 * nullLogL / n)));

    var coefs = [];
    var names = ['Constant'].concat(xNames);
    for (var j = 0; j <= xNames.length; j++) {
      var b = betaOrig[j];
      var se = seOrig[j] || 0.001;
      var wald = f4((b / se) * (b / se), 3);
      var waldP = Math.max(0, chi2P(parseFloat(wald), 1));
      var OR = j === 0 ? '—' : f4(Math.exp(b), 3);
      var ciLo = j === 0 ? '—' : f4(Math.exp(b - 1.96 * se), 3);
      var ciHi = j === 0 ? '—' : f4(Math.exp(b + 1.96 * se), 3);
      coefs.push({
        name: names[j], B: f4(b, 3), SE: f4(se, 3), wald: f4(parseFloat(wald), 3),
        p_fmt: pFmt(waldP), OR: OR,
        ci_or: j === 0 ? '—' : '[' + ciLo + ', ' + ciHi + ']'
      });
    }

    var preds = cases.map(function(r) {
      var z = betaOrig[0]; for (var j = 0; j < xNames.length; j++) z += betaOrig[j + 1] * r[xNames[j]];
      return sigmoid(z) >= 0.5 ? 1 : 0;
    });
    var cm = [[0, 0], [0, 0]];
    for (var i = 0; i < n; i++) cm[yBin[i]][preds[i]]++;
    var correct = cm[0][0] + cm[1][1];
    var accuracy = f1(correct / n * 100);

    var scored = cases.map(function(r, i) {
      var z = betaOrig[0]; for (var j = 0; j < xNames.length; j++) z += betaOrig[j + 1] * r[xNames[j]];
      return { prob: sigmoid(z), y: yBin[i] };
    }).sort(function(a, b) { return b.prob - a.prob; });
    var pos = yBin.filter(function(y) { return y === 1; }).length;
    var neg = n - pos;
    var auc = 0, tp = 0;
    for (var i = 0; i < scored.length; i++) {
      if (scored[i].y === 1) { tp++; } else { auc += tp; }
    }
    auc = pos > 0 && neg > 0 ? f4(auc / (pos * neg), 3) : f4(0.5, 3);

    return {
      n: n, cats: cats, coefs: coefs, m2ll: f4(m2ll, 3), chiSq: chiSq2,
      chiSqDf: chiSqDf, chiSqP_fmt: pFmt(chiSqP),
      coxSnell: coxSnell, nagelkerke: nagelkerke,
      cm: cm, accuracy: accuracy, auc: auc
    };
  } else {
    var allCoefs = [];
    for (var ki = 1; ki < cats.length; ki++) {
      var yBin2 = cases.map(function(r) { return r[dvName] === cats[ki] ? 1 : 0; });
      var fit2 = binaryLogistic(yBin2);
      var betaOrig2 = fit2.beta;
      var betaStd2 = fit2.betaStd;
      var seOrig2 = computeSE(betaStd2);
      var catCoefs = [];
      var names2 = ['Constant'].concat(xNames);
      for (var j = 0; j <= xNames.length; j++) {
        var b2 = betaOrig2[j], se2 = seOrig2[j] || 0.001;
        var wald2 = f4((b2 / se2) * (b2 / se2), 3);
        var waldP2 = Math.max(0, chi2P(parseFloat(wald2), 1));
        catCoefs.push({
          name: names2[j], B: f4(b2, 3), SE: f4(se2, 3), wald: f4(parseFloat(wald2), 3),
          p_fmt: pFmt(waldP2),
          OR: j === 0 ? '—' : f4(Math.exp(b2), 3),
          ci_or: j === 0 ? '—' : '[' + f4(Math.exp(b2 - 1.96 * se2), 3) + ', ' + f4(Math.exp(b2 + 1.96 * se2), 3) + ']'
        });
      }
      allCoefs.push(catCoefs);
    }
    var correctN = 0;
    cases.forEach(function(r) {
      var scores = cats.map(function(cat, ki) {
        if (ki === 0) return 0;
        return parseFloat(allCoefs[ki - 1][0].B) + xNames.reduce(function(s, v, j) { return s + parseFloat(allCoefs[ki - 1][j + 1].B) * r[v]; }, 0);
      });
      var bestCat = cats[scores.indexOf(Math.max.apply(null, scores))];
      if (bestCat === r[dvName]) correctN++;
    });

    var logLMult = 0;
    var nullLogLMult = -n * Math.log(cats.length);
    for (var i = 0; i < n; i++) {
      var probs = cats.map(function(cat, ki) {
        if (ki === 0) return 1;
        var z = xNames.reduce(function(s, v, j) { return s + parseFloat(allCoefs[ki - 1][j + 1].B) * cases[i][v]; }, parseFloat(allCoefs[ki - 1][0].B));
        return Math.exp(z);
      });
      var sumP = probs.reduce(function(s, p) { return s + p; }, 0);
      var normP = probs.map(function(p) { return p / sumP; });
      var yi = cats.indexOf(cases[i][dvName]);
      if (yi >= 0) logLMult += Math.log(Math.max(1e-10, normP[yi]));
    }
    var chiSqMult = f4(-2 * (nullLogLMult - logLMult), 3);
    var chiSqDfMult = (cats.length - 1) * xNames.length;
    var chiSqPMult = chi2P(parseFloat(chiSqMult), chiSqDfMult);
    var m2llMult = f4(-2 * logLMult, 3);
    var coxSnellMult = f4(1 - Math.exp((2 * (nullLogLMult - logLMult)) / n));
    var nagelkerkeMult = f4(parseFloat(coxSnellMult) / (1 - Math.exp(2 * nullLogLMult / n)));

    return {
      n: n, cats: cats, categories: cats, coefs: allCoefs,
      m2ll: m2llMult, chiSq: chiSqMult, chiSqDf: chiSqDfMult,
      chiSqP_fmt: pFmt(chiSqPMult),
      coxSnell: coxSnellMult, nagelkerke: nagelkerkeMult,
      accuracy: f1(correctN / n * 100)
    };
  }
}
