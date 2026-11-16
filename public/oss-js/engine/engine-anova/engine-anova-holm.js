// Fitur: Post-hoc & Koreksi Holm-Bonferroni (kategori Analyze: ANOVA)
//   holmBonferroni, holmBonferroniPosthoc
// Depends on: engine-core-distributions.js, engine-core-helpers.js

function holmBonferroni(pValues) {
  const n = pValues.length;
  const sorted = pValues.map(function(p, i) { return { p, i }; }).sort(function(a, b) { return a.p - b.p; });
  const adj = new Array(n);
  let prevAdj = 0;
  sorted.forEach(function(item, rank) {
    const adjP = Math.min(1, Math.max(prevAdj, item.p * (n - rank)));
    adj[item.i] = f4(adjP);
    prevAdj = adjP;
  });
  return adj;
}

function holmBonferroniPosthoc(groups) {
  req(groups.length, 2, 'Holm-Bonferroni post-hoc groups');
  var allVals = [].concat.apply([], groups.map(function(g) { return g.vals; }));
  var k = groups.length;
  var n = allVals.length;
  var ssW = groups.reduce(function(s, g) { var gm = mean(g.vals); return s + g.vals.reduce(function(ss, v) { return ss + (v - gm) * (v - gm); }, 0); }, 0);
  var dfW = n - k;
  var msW = dfW > 0 ? ssW / dfW : NaN;
  var pairs = [];
  for (var i = 0; i < groups.length; i++) {
    for (var j = i + 1; j < groups.length; j++) {
      var ni = groups[i].vals.length, nj = groups[j].vals.length;
      var mi = mean(groups[i].vals), mj = mean(groups[j].vals);
      var diff = mi - mj;
      var se = Math.sqrt(msW * (1 / ni + 1 / nj));
      var t_val = se > 0 ? diff / se : NaN;
      var p_raw = isFinite(t_val) ? tP(Math.abs(t_val), dfW) : NaN;
      pairs.push({ a: groups[i].label, b: groups[j].label, diff, se, t: t_val, df: dfW, p_raw });
    }
  }
  var pAdjArr = holmBonferroni(pairs.map(function(pr) { return isFinite(pr.p_raw) ? pr.p_raw : 1; }));
  return pairs.map(function(pr, idx) {
    var p_adj = parseFloat(pAdjArr[idx]);
    return {
      a: pr.a, b: pr.b,
      diff: f4(pr.diff), se: f4(pr.se),
      t: f4(pr.t), df: pr.df,
      p_raw: f4(pr.p_raw), p: f4(p_adj), p_fmt: pFmt(p_adj),
      sig: p_adj < 0.05
    };
  });
}
