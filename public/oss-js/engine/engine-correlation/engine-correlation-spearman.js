// Fitur: Korelasi Spearman rho (kategori Analyze: Correlation)
//   spearmanR
// Depends on: engine-core-distributions.js, engine-correlation-pearson.js (pearsonR)

function spearmanR(ax, ay) {
  const { xs, ys, n } = validPairs(ax, ay); req(n, 3, 'Spearman r');
  function ranks(arr) {
    const idx = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
    const r = new Array(n); let pos = 0;
    while (pos < n) {
      let j = pos; while (j < n && idx[j].v === idx[pos].v) j++;
      const avg = (pos + j + 1) / 2; for (let k = pos; k < j; k++) r[idx[k].i] = avg; pos = j;
    }
    return r;
  }
  return pearsonR(ranks(xs), ranks(ys));
}
