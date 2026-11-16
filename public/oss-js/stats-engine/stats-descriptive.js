// Fitur: Uji normalitas & statistik deskriptif (kategori Analyze: Descriptive)
//   sw (Shapiro-Wilk), ksTest (Kolmogorov-Smirnov / Lilliefors), descriptive
// Depends on: stats-distributions.js, stats-helpers.js

// Shapiro-Wilk
function sw(arr) {
  const x = [...arr].sort((a, b) => a - b), n = x.length;
  if (n < 3) return { W: 'N/A', p: 'N/A' };
  const m = mean(x), ss = x.reduce((s, v) => s + (v - m) * (v - m), 0);
  const u = x.map((_, i) => {
    const pi = (i + 1 - 3 / 8) / (n + 0.25);
    const t2 = Math.sqrt(-2 * Math.log(pi < 0.5 ? pi : 1 - pi));
    const z = t2 - (2.515517 + 0.802853 * t2 + 0.010328 * t2 * t2) / (1 + 1.432788 * t2 + 0.189269 * t2 * t2 + 0.001308 * Math.pow(t2, 3));
    return pi < 0.5 ? -z : z;
  });
  const uN = Math.sqrt(u.reduce((s, v) => s + v * v, 0));
  const a = u.map(v => v / uN);
  let Wn = 0; for (let i = 0; i < Math.floor(n / 2); i++) Wn += a[n - 1 - i] * (x[n - 1 - i] - x[i]);
  const W = ss > 0 ? (Wn * Wn) / ss : NaN;
  let p;
  if (n <= 11) {
    const mu = -0.0006714 * n * n + 0.025054 * n - 0.39978;
    const sigma = Math.exp(-0.0020322 * n * n + 0.062767 * n - 1.0521);
    p = 1 - normCDF((Math.log(1 - W) - mu) / sigma);
  } else {
    const ln = Math.log(n);
    const mu = 0.0038915 * Math.pow(ln, 3) - 0.083751 * ln * ln - 0.31082 * ln - 1.5861;
    const sigma = Math.exp(0.0030302 * ln * ln - 0.082676 * ln - 0.4803);
    p = 1 - normCDF((Math.log(1 - W) - mu) / sigma);
  }
  return { W: f4(W), p: f4(Math.max(0, Math.min(1, p))) };
}

// Kolmogorov-Smirnov test (Lilliefors correction for unknown mean/std)
function ksTest(arr) {
  const nums = [...arr].sort((a, b) => a - b);
  const n = nums.length;
  if (n < 3) return { D: 'N/A', p: 'N/A' };
  const m = mean(nums), s = std(nums);
  if (s === 0) return { D: 'N/A', p: 'N/A' };
  let D = 0;
  for (let i = 0; i < n; i++) {
    const Fn = (i + 1) / n;
    const Fn_prev = i / n;
    const Ft = normCDF((nums[i] - m) / s);
    D = Math.max(D, Math.abs(Fn - Ft), Math.abs(Fn_prev - Ft));
  }
  // Lilliefors p-value approximation
  const Dstar = D * (Math.sqrt(n) - 0.01 + 0.85 / Math.sqrt(n));
  let p;
  if (Dstar <= 0.1) p = 1;
  else if (Dstar <= 0.2) p = 1 - (Dstar - 0.1) * 7;
  else if (Dstar <= 0.302) p = 0.3;
  else if (Dstar <= 0.3385) p = 0.2;
  else if (Dstar <= 0.4732) p = 0.1;
  else if (Dstar <= 0.5063) p = 0.05;
  else if (Dstar <= 0.5710) p = 0.02;
  else if (Dstar <= 0.6008) p = 0.01;
  else p = 0.001;
  // More precise approximation using Marsaglia formula
  function ksP(d, n2) {
    const s2 = d * d * n2;
    if (s2 > 7.24 || d > 0.35 && n2 > 2e4) return 1 - 2 * Math.exp(-s2 * (2.000071 + 0.331 / Math.sqrt(n2) + 1.409 / n2));
    let p2 = 0, term, fac = 1, s22 = s2 * 2;
    for (let j = 1; j <= 100; j++) {
      term = Math.exp(-s22 * j * j) * fac;
      p2 += term; fac = -fac;
      if (Math.abs(term) < 1e-10) break;
    }
    return Math.max(0, Math.min(1, 2 * p2));
  }
  const pBetter = ksP(D, n);
  const pFinal = f4(Math.max(0.001, Math.min(1, pBetter)));
  return { D: f4(D), p: pFinal };
}

// Descriptive
function descriptive(raw) {
  const nums = validNums(raw), miss = raw.length - nums.length;
  if (!nums.length) return { error: 'No valid data', missing: miss };
  const n = nums.length, s = [...nums].sort((a, b) => a - b), m = mean(nums);
  const v = n >= 2 ? vari(nums) : NaN, sd = n >= 2 ? std(nums) : NaN;
  const skew = n >= 3 && sd > 0 ? (n * n / ((n - 1) * (n - 2))) * nums.reduce((a, x) => a + Math.pow((x - m) / sd, 3), 0) / n : NaN;
  const kurt = n >= 4 && sd > 0 ? ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * nums.reduce((a, x) => a + Math.pow((x - m) / sd, 4), 0) - (3 * (n - 1) * (n - 1)) / ((n - 2) * (n - 3)) : NaN;
  const q1 = quantile(s, .25), med = quantile(s, .5), q3 = quantile(s, .75), iqr = q3 - q1;
  const sem = sd / Math.sqrt(n);
  const swR = n >= 3 && n <= 5000 ? sw(nums) : null;
  const ksR = n >= 3 ? ksTest(nums) : null;
  const outs = nums.filter(v => v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr);
  const freq = {}; nums.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
  const maxF = Math.max(...Object.values(freq));
  const modes = Object.entries(freq).filter(([, c]) => c === maxF).map(([v]) => +v);
  const modeStr = modes.length === n ? 'None' : modes.slice(0, 3).map(f4).join(', ');
  return {
    n, missing: miss, mean: f4(m), median: f4(med), mode: modeStr, std: f4(sd), variance: f4(v), sem: f4(sem),
    ci95: '[' + f4(m - tCrit(n - 1) * sem) + ', ' + f4(m + tCrit(n - 1) * sem) + ']',
    min: f4(s[0]), max: f4(s[n - 1]), range: f4(s[n - 1] - s[0]),
    q1: f4(q1), q3: f4(q3), iqr: f4(iqr), skewness: f4(skew), kurtosis: f4(kurt),
    shapiroW: swR ? swR.W : 'N/A', shapiroP: swR ? swR.p : 'N/A',
    normality: swR ? (parseFloat(swR.p) > .05 ? '✓ Normal (p>.05)' : '✗ Non-normal (p≤.05)') : 'N/A',
    ksD: ksR ? ksR.D : 'N/A', ksP: ksR ? ksR.p : 'N/A',
    ksNormality: ksR ? (parseFloat(ksR.p) > .05 ? '✓ Normal (p>.05)' : '✗ Non-normal (p≤.05)') : 'N/A',
    outlierCount: outs.length, outlierVals: outs.slice(0, 5).map(f4)
  };
}
