// Fitur: Repeated Measures ANOVA (one-way within-subjects) (kategori Analyze: ANOVA)
//   repeatedMeasuresAnova
// Depends on: engine-core-distributions.js, engine-core-helpers.js

function repeatedMeasuresAnova(groups, labels) {
  const k = groups.length;
  if (k < 3) throw new Error('RM-ANOVA membutuhkan ≥3 titik waktu');
  const rawN = groups[0].length;
  const valid = [];
  for (let i = 0; i < rawN; i++) {
    const row = groups.map(g => g[i]);
    if (row.every(v => isV(v))) valid.push(row);
  }
  const n = valid.length;
  if (n < 3) throw new Error('Tidak cukup data lengkap (butuh ≥3 subjek dengan semua titik waktu)');
  const allVals = valid.flat();
  const grandMean = allVals.reduce((a, b) => a + b, 0) / allVals.length;
  const tMeans = groups.map((_, j) => {
    const col = valid.map(r => r[j]);
    return col.reduce((a, b) => a + b, 0) / n;
  });
  const sMeans = valid.map(r => r.reduce((a, b) => a + b, 0) / k);
  const SSB = n * tMeans.reduce((a, m) => a + (m - grandMean) * (m - grandMean), 0);
  const SSS = k * sMeans.reduce((a, m) => a + (m - grandMean) * (m - grandMean), 0);
  const SST = valid.flat().reduce((a, v) => a + (v - grandMean) * (v - grandMean), 0);
  const SSE = SST - SSB - SSS;
  const dfB = k - 1, dfS = n - 1, dfE = (k - 1) * (n - 1);
  const MSB = SSB / dfB, MSE = SSE / dfE;
  if (MSE <= 0) throw new Error('MSE ≤ 0; periksa data');
  const F = MSB / MSE;
  const p = 1 - fCDF(F, dfB, dfE);
  const etaSq = SSB / (SSB + SSE);
  const interp = etaSq >= 0.14 ? 'Large' : etaSq >= 0.06 ? 'Medium' : 'Small';
  return {
    F: f4(F), p: f4(p), p_fmt: pFmt(p), sig: p < .05,
    k, n, dfB, dfE: dfE, dfS,
    MSB: f4(MSB), MSE: f4(MSE),
    SSB: f4(SSB), SSE: f4(SSE), SSS: f4(SSS), SST: f4(SST),
    etaSq: f4(etaSq), etaInterp: interp,
    tMeans: tMeans.map(m => f4(m)),
    labels: labels || groups.map((_, i) => 'T' + (i + 1))
  };
}
