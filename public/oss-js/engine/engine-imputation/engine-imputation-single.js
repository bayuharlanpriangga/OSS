// Single Imputation computation & handlers (kategori Analyze: Imputation -> Single Imputation)
//   computeSingleImpute, computeSingleImputeAll, runImpute, imputeAllVars
// Depends on: engine-core-helpers.js, engine-core-distributions.js

function computeSingleImpute(dataArr, fld, method) {
  if (!Array.isArray(dataArr) || !dataArr.length) throw new Error('No data available');
  if (!fld) throw new Error('Select a variable to impute');
  var vals = SE.validNums(dataArr.map(function(r) { return r[fld]; }));
  if (!vals.length) throw new Error('No valid data');
  var s = vals.slice().sort(function(a, b) { return a - b; });
  var m = method || 'mean';
  var iv;
  switch (m) {
    case 'mean':
      iv = SE.mean(vals);
      break;
    case 'median':
      iv = SE.quantile(s, 0.5);
      break;
    case 'mode': {
      var fr = {};
      vals.forEach(function(v) { fr[v] = (fr[v] || 0) + 1; });
      iv = parseFloat(Object.entries(fr).sort(function(a, b) { return b[1] - a[1]; })[0][0]);
      break;
    }
    case 'zero':
      iv = 0;
      break;
    case 'min':
      iv = Math.min.apply(null, vals);
      break;
    case 'max':
      iv = Math.max.apply(null, vals);
      break;
    default:
      iv = SE.mean(vals);
      m = 'mean';
  }
  var nImputed = 0;
  var nextData = dataArr.map(function(r) {
    if (isMiss(r[fld])) {
      nImputed++;
      var copy = Object.assign({}, r);
      copy[fld] = iv;
      return copy;
    }
    return r;
  });
  return {
    data: nextData,
    field: fld,
    method: m,
    imputeValue: iv,
    nImputed: nImputed
  };
}

function computeSingleImputeAll(dataArr, fields) {
  if (!Array.isArray(dataArr) || !dataArr.length) return { data: dataArr || [], nImputed: 0 };
  var nextData = dataArr.map(function(r) { return Object.assign({}, r); });
  var total = 0;
  (fields || []).forEach(function(fld) {
    var vals = SE.validNums(nextData.map(function(r) { return r[fld]; }));
    if (!vals.length) return;
    var iv = SE.mean(vals);
    nextData.forEach(function(r) {
      if (isMiss(r[fld])) {
        total++;
        r[fld] = iv;
      }
    });
  });
  return { data: nextData, nImputed: total };
}

function runImpute() {
  try {
    var res = computeSingleImpute(data, aState.imputeFld, aState.imputeMethod);
    data = res.data;
    updateBadges();
    showToast('Imputation berhasil (' + res.nImputed + ' sel)');
    renderASub();
  } catch (e) {
    showToast((e && e.message) || 'No valid data', 'error');
  }
}

function imputeAllVars() {
  var res = computeSingleImputeAll(data, numFields());
  data = res.data;
  updateBadges();
  showToast('Imputation berhasil (' + res.nImputed + ' sel)');
  renderASub();
}
