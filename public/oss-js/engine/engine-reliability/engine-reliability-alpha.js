// Fitur: Uji Reliabilitas Internal Consistency Cronbach's Alpha (kategori Analyze: Reliability)
//   cronbachAlpha
// Depends on: engine-core-distributions.js, engine-core-helpers.js

function cronbachAlpha(matrix) {
  const k = matrix.length; req(k, 2, 'Alpha items');
  const ns = matrix[0].length; req(ns, 2, 'Alpha cases');
  const totalScores = Array.from({ length: ns }, (_, i) => matrix.reduce((s, col) => s + col[i], 0));
  const sumItemVar = matrix.reduce((s, col) => s + vari(col), 0);
  const totalVar = vari(totalScores);
  const alpha = totalVar > 0 ? (k / (k - 1)) * (1 - sumItemVar / totalVar) : NaN;
  const interp = alpha >= .9 ? 'Excellent' : alpha >= .8 ? 'Good' : alpha >= .7 ? 'Acceptable' : alpha >= .6 ? 'Questionable' : alpha >= .5 ? 'Poor' : 'Unacceptable';
  const itemStats = matrix.map((col, i) => {
    const restScores = Array.from({ length: ns }, (_, j) => totalScores[j] - col[j]);
    const mc = mean(col), mr = mean(restScores), sc_ = std(col), sr = std(restScores);
    let cov = 0; for (let j = 0; j < ns; j++) cov += (col[j] - mc) * (restScores[j] - mr);
    cov /= ns;
    const rit = (sc_ > 0 && sr > 0) ? cov / (sc_ * sr) : 0;
    const rem = matrix.filter((_, ii) => ii !== i);
    const remTot = Array.from({ length: ns }, (_, j) => rem.reduce((s, c) => s + c[j], 0));
    const remSV = rem.reduce((s, c) => s + vari(c), 0);
    const remTV = vari(remTot);
    const aid = remTV > 0 && rem.length > 1 ? ((k - 1) / (k - 2)) * (1 - remSV / remTV) : NaN;
    return {
      rit: f4(rit), alphaIfDeleted: f4(aid),
      flag: rit < 0.3 ? 'Low (consider removing)' : rit < 0.5 ? 'Acceptable' : 'Good'
    };
  });
  return { alpha: f4(alpha), k, n: ns, interp, itemStats };
}
