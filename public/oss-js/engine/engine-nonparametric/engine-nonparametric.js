// Fitur: Uji Nonparametrik (Mann-Whitney U, Kruskal-Wallis H, Wilcoxon Signed-Rank) (kategori Analyze: Nonparametric)
//   mwExactDist, mannWhitney, kruskalWallis, wilcoxon
// Depends on: engine-core-distributions.js, engine-core-helpers.js

// Mann-Whitney U — exact p for small n (na+nb <= 20), asymptotic otherwise
function mwExactDist(na, nb) {
  const maxU = na * nb;
  const N = na + nb;
  const minR1 = na * (na + 1) / 2;
  const maxR1v = na * N - na * (na - 1) / 2;
  const dp2 = [];
  dp2[0] = new Float64Array(maxR1v + 1); dp2[0][0] = 1;
  for (let rank_m = 1; rank_m <= N; rank_m++) {
    const take = Math.min(rank_m, na);
    for (let k = take; k >= 1; k--) {
      if (!dp2[k]) dp2[k] = new Float64Array(maxR1v + 1);
      for (let r = maxR1v; r >= rank_m; r--) {
        dp2[k][r] += (dp2[k - 1][r - rank_m] || 0);
      }
    }
  }
  const total = dp2[na] || new Float64Array(1);
  return { total, minR1, maxR1v, na, nb, maxU };
}

function mannWhitney(a, b) {
  req(a.length, 2, 'MW A'); req(b.length, 2, 'MW B');
  const na = a.length, nb = b.length;
  const all = [...a.map(v => ({ v, g: 0 })), ...b.map(v => ({ v, g: 1 }))].sort((x, y) => x.v - y.v);
  let rank = 1; const ranked = [];
  while (rank <= all.length) {
    let j = rank; while (j < all.length && all[j].v === all[rank - 1].v) j++;
    const avg = (rank + j) / 2; for (let k = rank - 1; k < j; k++) ranked.push({ ...all[k], rank: avg }); rank = j + 1;
  }
  const R1 = ranked.filter(r => r.g === 0).reduce((s, r) => s + r.rank, 0);
  const U1 = R1 - na * (na + 1) / 2, U2 = na * nb - U1, U = Math.min(U1, U2);
  const N = na + nb;

  const hasTies = Object.values(ranked.reduce((m, r) => { m[r.v] = (m[r.v] || 0) + 1; return m; }, {})).some(c => c > 1);
  let p, z = NaN, method = 'asymptotic';
  if (N <= 20 && !hasTies) {
    method = 'exact';
    const dist = mwExactDist(na, nb);
    const grand = dist.total.reduce((s, v) => s + v, 0) || 1;
    const uObs = U;
    let count = 0;
    for (let r = dist.minR1; r <= dist.maxR1v; r++) {
      const u1 = r - na * (na + 1) / 2;
      const u2 = na * nb - u1;
      if (Math.min(u1, u2) <= uObs) count += dist.total[r] || 0;
    }
    p = count / grand;
    p = Math.min(1, p);
  } else {
    method = 'asymptotic';
    const muU = na * nb / 2;
    const tieMap = {}; ranked.forEach(r => { tieMap[r.v] = (tieMap[r.v] || 0) + 1; });
    const tieCorr = Object.values(tieMap).reduce((s, t) => s + (t * t * t - t), 0);
    const sigU = Math.sqrt((na * nb / 12) * ((N + 1) - (tieCorr / (N * (N - 1)))));
    z = sigU > 0 ? (U - muU) / sigU : 0;
    p = 2 * (1 - normCDF(Math.abs(z)));
  }
  return {
    U: f4(U), U1: f4(U1), U2: f4(U2), z: isFinite(z) ? f4(z) : '—', p: f4(p), p_fmt: pFmt(p), sig: p < .05,
    r_eff: f4(Math.abs(isFinite(z) ? z : 0) / Math.sqrt(N)), nA: na, nB: nb, method,
    medA: f4(quantile([...a].sort((x, y) => x - y), .5)), medB: f4(quantile([...b].sort((x, y) => x - y), .5))
  };
}

// Kruskal-Wallis
function kruskalWallis(groups) {
  const all = groups.flatMap(g => g.vals.map(v => ({ v, g: g.label }))).sort((a, b) => a.v - b.v);
  const N = all.length, k = groups.length; req(N, 3, 'KW');
  let rank = 1; const ranked = [];
  while (rank <= all.length) {
    let j = rank; while (j < all.length && all[j].v === all[rank - 1].v) j++;
    const avg = (rank + j) / 2; for (let x = rank - 1; x < j; x++) ranked.push({ ...all[x], rank: avg }); rank = j + 1;
  }
  const H = groups.reduce((s, g) => {
    const Rj = ranked.filter(r => r.g === g.label).reduce((ss, r) => ss + r.rank, 0);
    return s + (Rj * Rj) / g.vals.length;
  }, 0);
  const Hstat = (12 / (N * (N + 1))) * H - 3 * (N + 1);
  const df = k - 1, p = chi2P(Hstat, df);
  return {
    H: f4(Hstat), df, p: f4(p), p_fmt: pFmt(p), sig: p < .05,
    eta2: f4(Math.max(0, (Hstat - k + 1) / (N - k))),
    groupStats: groups.map(g => ({
      label: g.label, n: g.vals.length,
      median: f4(quantile([...g.vals].sort((a, b) => a - b), .5)), mean: f4(mean(g.vals))
    }))
  };
}

// Wilcoxon Signed-Rank — exact p for small n (≤ 25), asymptotic otherwise
function wilcoxon(arr, mu0 = 0) {
  const diffs = validNums(arr.map(v => v - mu0)).filter(d => d !== 0);
  req(diffs.length, 5, 'Wilcoxon');
  const n = diffs.length;
  const signed = [...diffs].sort((a, b) => Math.abs(a) - Math.abs(b));
  let rank = 1; const ranked = [];
  while (rank <= signed.length) {
    let j = rank; while (j < signed.length && Math.abs(signed[j]) === Math.abs(signed[rank - 1])) j++;
    const avg = (rank + j) / 2; for (let x = rank - 1; x < j; x++) ranked.push({ v: signed[x], rank: avg }); rank = j + 1;
  }
  const Wp = ranked.filter(r => r.v > 0).reduce((s, r) => s + r.rank, 0);
  const Wm = ranked.filter(r => r.v < 0).reduce((s, r) => s + r.rank, 0);
  const W = Math.min(Wp, Wm);

  const hasTies = ranked.some((r, i, arr2) => i > 0 && r.rank === arr2[i - 1].rank);
  let p, z = NaN, method = 'asymptotic';
  if (n <= 25 && !hasTies) {
    method = 'exact';
    const maxW = n * (n + 1) / 2;
    const dp = new Float64Array(maxW + 1);
    dp[0] = 1;
    for (let r = 1; r <= n; r++) {
      for (let w = maxW; w >= r; w--) dp[w] += dp[w - r];
    }
    const total = Math.pow(2, n);
    const wObs = W;
    let count = 0;
    for (let w = 0; w <= wObs; w++) count += dp[w];
    p = Math.min(1, 2 * count / total);
  } else {
    method = 'asymptotic';
    const muW = n * (n + 1) / 4;
    const sigW = Math.sqrt(n * (n + 1) * (2 * n + 1) / 24);
    z = sigW > 0 ? (W - muW) / sigW : 0;
    p = 2 * (1 - normCDF(Math.abs(z)));
  }
  return {
    W: f4(W), Wplus: f4(Wp), Wminus: f4(Wm), z: isFinite(z) ? f4(z) : '—', p: f4(p), p_fmt: pFmt(p), sig: p < .05,
    r_eff: f4(Math.abs(isFinite(z) ? z : 0) / Math.sqrt(n)), n, method
  };
}
