// Fitur: Uji Normalitas Kolmogorov-Smirnov dengan koreksi Lilliefors (kategori Analyze: Descriptive)
//   ksTest
// Depends on: engine-core-distributions.js, engine-core-helpers.js

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
