// Fitur: Hierarchical Multiple Linear Regression (Sequential Blocks + ΔR², F-change) (kategori Analyze: Regression)
//   hierarchicalReg
// Depends on: engine-core-distributions.js, engine-core-helpers.js, engine-regression-multiple.js

function hierarchicalReg(depVar, blocks, dataArr) {
  if (!depVar) throw new Error('Select Dependent Variable (Y)');
  if (!Array.isArray(blocks) || blocks.every(function(b) { return !b || !b.length; })) {
    throw new Error('Add predictors to at least one Block');
  }

  var blockResults = [];
  var prevR2 = 0;

  for (var bi = 0; bi < blocks.length; bi++) {
    var curBlock = Array.isArray(blocks[bi]) ? blocks[bi] : [];
    var cumXs = [];
    for (var ci = 0; ci <= bi; ci++) {
      var blk = Array.isArray(blocks[ci]) ? blocks[ci] : [];
      for (var vi = 0; vi < blk.length; vi++) {
        if (!cumXs.includes(blk[vi])) cumXs.push(blk[vi]);
      }
    }
    if (!cumXs.length || !curBlock.length) continue;

    var res = multipleReg(cumXs, depVar, dataArr);
    var n = parseInt(res.n || dataArr.length, 10);
    var kNew = curBlock.length;
    var kCum = cumXs.length;
    var r2Val = parseFloat(res.R2);
    var dR2 = r2Val - prevR2;
    var dfErr = n - kCum - 1;
    var Fchange = dfErr > 0 && (1 - r2Val) > 0 && kNew > 0
      ? (dR2 / kNew) / ((1 - r2Val) / dfErr)
      : 0;
    var pFchange = Fchange > 0 ? fP(Fchange, kNew, dfErr) : 1;

    blockResults.push({
      block: bi + 1,
      predictors: curBlock.slice(),
      cumulativePredictors: cumXs.slice(),
      R2: res.R2,
      R2adj: res.R2adj,
      F: res.F,
      pF: res.pF_fmt,
      dR2: f4(dR2),
      Fchange: f4(Fchange),
      pFchange: f4(pFchange),
      dfNum: kNew,
      dfDen: dfErr,
      coefs: res.coefs,
      vif: res.vif,
      n: n
    });
    prevR2 = r2Val;
  }

  if (!blockResults.length) {
    throw new Error('Add predictors to at least one Block');
  }

  return {
    depVar: depVar,
    blocks: blockResults
  };
}
