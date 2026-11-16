// Fitur: GLM Repeated Measures (Within-Subjects Pre-Post + optional Between-Subjects Interaction) (kategori Analyze: General Linear Model)
//   glmRepeated
// Depends on: engine-core-helpers.js, engine-ttest-paired.js, engine-anova-oneway.js

function glmRepeated(dataArr, varA, varB, betweenFac) {
  if (!varA || !varB) throw new Error('Select pre and post variables');
  if (varA === varB) throw new Error('Pre and post variables must differ');

  var pairedRows = [];
  for (var i = 0; i < dataArr.length; i++) {
    var row = dataArr[i];
    if (isV(row[varA]) && isV(row[varB])) {
      pairedRows.push({
        a: Number(row[varA]),
        b: Number(row[varB]),
        diff: Number(row[varB]) - Number(row[varA]),
        grp: betweenFac ? row[betweenFac] : null
      });
    }
  }
  req(pairedRows.length, 2, 'Repeated Measures GLM');

  var aVals = pairedRows.map(function(r) { return r.a; });
  var bVals = pairedRows.map(function(r) { return r.b; });
  var base = pairedTTest(aVals, bVals);

  var interaction = null;
  if (betweenFac) {
    var grpMap = {};
    for (var j = 0; j < pairedRows.length; j++) {
      var gk = pairedRows[j].grp;
      if (gk === null || gk === undefined || gk === '') continue;
      var key = String(gk);
      if (!grpMap[key]) grpMap[key] = [];
      grpMap[key].push(pairedRows[j].diff);
    }
    var gKeys = Object.keys(grpMap).sort();
    var groupObjs = gKeys
      .map(function(k) { return { label: k, vals: grpMap[k] }; })
      .filter(function(g) { return g.vals.length >= 1; });
    var totalGrouped = groupObjs.reduce(function(s, g) { return s + g.vals.length; }, 0);
    if (groupObjs.length >= 2 && totalGrouped >= groupObjs.length + 2) {
      var aov = onewayANOVA(groupObjs);
      interaction = {
        factor: betweenFac,
        F: aov.F,
        dfB: aov.dfB,
        dfW: aov.dfW,
        p: aov.p,
        p_fmt: aov.p_fmt,
        sig: aov.sig,
        eta2: aov.eta2,
        eta2Interp: aov.eta2Interp,
        groupStats: aov.groupStats
      };
    }
  }

  return Object.assign({}, base, {
    varA: varA,
    varB: varB,
    meanA: f4(mean(aVals)),
    sdA: f4(std(aVals)),
    meanB: f4(mean(bVals)),
    sdB: f4(std(bVals)),
    betweenFac: betweenFac || null,
    interaction: interaction
  });
}
