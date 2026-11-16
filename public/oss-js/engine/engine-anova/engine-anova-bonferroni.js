// Fitur: Post-hoc Bonferroni (kategori Analyze: ANOVA)
//   bonferroniPosthoc
// Depends on: engine-core-distributions.js, engine-core-helpers.js

function bonferroniPosthoc(groups) {
  req(groups.length, 2, 'Bonferroni post-hoc groups');
  var allVals = [].concat.apply([], groups.map(function(g) { return g.vals; }));
  var k = groups.length;
  var n = allVals.length;
  var ssW = groups.reduce(function(s, g) { var gm = mean(g.vals); return s + g.vals.reduce(function(ss, v) { return ss + (v - gm) * (v - gm); }, 0); }, 0);
  var dfW = n - k;
  var msW = dfW > 0 ? ssW / dfW : NaN;
  var m = k * (k - 1) / 2;
  var results = [];
  for (var i = 0; i < groups.length; i++) {
    for (var j = i + 1; j < groups.length; j++) {
      var ni = groups[i].vals.length, nj = groups[j].vals.length;
      var mi = mean(groups[i].vals), mj = mean(groups[j].vals);
      var diff = mi - mj;
      var se = Math.sqrt(msW * (1 / ni + 1 / nj));
      var t_val = se > 0 ? diff / se : NaN;
      var p_raw = isFinite(t_val) ? tP(Math.abs(t_val), dfW) : NaN;
      var p_adj = isFinite(p_raw) ? Math.min(1, p_raw * m) : NaN;
      results.push({
        a: groups[i].label, b: groups[j].label,
        diff: f4(diff), se: f4(se),
        t: f4(t_val), df: dfW,
        p_raw: f4(p_raw), p: f4(p_adj), p_fmt: pFmt(p_adj),
        sig: p_adj < 0.05
      });
    }
  }
  return results;
}
