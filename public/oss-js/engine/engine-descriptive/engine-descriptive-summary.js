// Fitur: Statistik Deskriptif Ringkasan (kategori Analyze: Descriptive)
//   descriptive
// Depends on: engine-core-distributions.js, engine-core-helpers.js,
//   engine-descriptive-shapiro-wilk.js (sw), engine-descriptive-ks.js (ksTest)

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
