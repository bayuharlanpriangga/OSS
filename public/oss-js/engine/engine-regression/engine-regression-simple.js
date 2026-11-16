// Fitur: Simple Linear Regression OLS (kategori Analyze: Regression)
//   linearReg
// Depends on: engine-core-distributions.js, engine-core-helpers.js

function linearReg(ax, ay) {
  const { xs, ys, n } = validPairs(ax, ay); req(n, 3, 'Regression');
  const mx = mean(xs), my = mean(ys);
  const Sxx = xs.reduce((s, x) => s + (x - mx) * (x - mx), 0);
  const Sxy = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  if (Sxx === 0) throw new Error('Zero variance in predictor');
  const b1 = Sxy / Sxx, b0 = my - b1 * mx;
  const yHat = xs.map(x => b0 + b1 * x);
  const SSR = yHat.reduce((s, y, i) => s + (y - my) * (y - my), 0);
  const SSE = ys.reduce((s, y, i) => s + (y - yHat[i]) * (y - yHat[i]), 0);
  const SST = ys.reduce((s, y) => s + (y - my) * (y - my), 0);
  const R2 = SST > 0 ? SSR / SST : 0, R2adj = 1 - (1 - R2) * (n - 1) / (n - 2);
  const dfR = 1, dfE = n - 2, MSR = SSR / dfR, MSE = SSE / dfE;
  const F = MSE > 0 ? MSR / MSE : 0, pF = fP(F, dfR, dfE);
  const SEb1 = Math.sqrt(MSE / Sxx), SEb0 = Math.sqrt(MSE * (1 / n + mx * mx / Sxx));
  const tb1 = b1 / SEb1, tb0 = b0 / SEb0;
  const pb1 = tP(Math.abs(tb1), dfE), pb0 = tP(Math.abs(tb0), dfE);
  const residuals = ys.map((y, i) => y - yHat[i]);
  return {
    b0: f4(b0), b1: f4(b1), SEb0: f4(SEb0), SEb1: f4(SEb1),
    tb0: f4(tb0), tb1: f4(tb1), pb0: f4(pb0), pb1: f4(pb1), pb0_fmt: pFmt(pb0), pb1_fmt: pFmt(pb1),
    R2: f4(R2), R2adj: f4(R2adj), F: f4(F), dfR, dfE, pF: f4(pF), pF_fmt: pFmt(pF),
    RMSE: f4(Math.sqrt(MSE)), SSR: f4(SSR), SSE: f4(SSE), SST: f4(SST), n, sig: pF < .05,
    yHat, residuals, xs, ys
  };
}
