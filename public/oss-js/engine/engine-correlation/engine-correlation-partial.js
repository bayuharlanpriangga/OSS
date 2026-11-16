// Fitur: Korelasi Parsial (kategori Analyze: Correlation)
//   partialCorr
// Depends on: engine-core-distributions.js, engine-core-helpers.js, engine-correlation-pearson.js (pearsonR)

function partialCorr(xArr, yArr, zArr) {
  req(xArr.length, 5, 'Partial correlation cases');
  var triples = [];
  for (var i = 0; i < Math.min(xArr.length, yArr.length, zArr.length); i++) {
    if (isV(xArr[i]) && isV(yArr[i]) && isV(zArr[i])) triples.push([xArr[i], yArr[i], zArr[i]]);
  }
  req(triples.length, 5, 'Partial correlation valid cases');
  var xs = triples.map(function(t) { return t[0]; });
  var ys = triples.map(function(t) { return t[1]; });
  var zs = triples.map(function(t) { return t[2]; });
  var rxy = parseFloat(pearsonR(xs, ys).r);
  var rxz = parseFloat(pearsonR(xs, zs).r);
  var ryz = parseFloat(pearsonR(ys, zs).r);
  var num = rxy - rxz * ryz;
  var den = Math.sqrt((1 - rxz * rxz) * (1 - ryz * ryz));
  if (Math.abs(den) < 1e-12) throw new Error('Control variable causes zero denominator (collinearity)');
  var rp = num / den;
  rp = Math.max(-1, Math.min(1, rp));
  var n = triples.length;
  var df = n - 3;
  req(df, 1, 'Partial correlation df (need n≥5)');
  var t_val = rp * Math.sqrt(df) / Math.sqrt(Math.max(1e-12, 1 - rp * rp));
  var p_val = tP(Math.abs(t_val), df);
  var r2 = rp * rp;
  var fz = 0.5 * Math.log((1 + rp) / (1 - rp));
  var se = 1 / Math.sqrt(n - 3);
  var tc95 = tCrit(df);
  var zlo = fz - tc95 * se, zhi = fz + tc95 * se;
  var rlo = Math.tanh(zlo), rhi = Math.tanh(zhi);
  var interp = Math.abs(rp) < .1 ? 'negligible' : Math.abs(rp) < .3 ? 'small' : Math.abs(rp) < .5 ? 'moderate' : 'large';
  return {
    rp: f4(rp), r2: f4(r2), t: f4(t_val), df,
    p: f4(p_val), p_fmt: pFmt(p_val),
    ci95: '[' + f4(rlo) + ', ' + f4(rhi) + ']',
    n, rxy: f4(rxy), rxz: f4(rxz), ryz: f4(ryz),
    strength: interp, sig: p_val < 0.05
  };
}
