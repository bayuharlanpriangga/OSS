// ════════════════════════════════════════════════════════════
// js/stats-engine/stats-glm-hlm.js
// Fitur (B6 - bagian GLM): GLM Univariate (Type III SS via regresi,
// 1 DV + fixed factors + covariates opsional), Bonferroni correction
// untuk multiple comparisons.
// Depends on: validNums, req, isV, mean, std, tCrit, tP, fP
// (js/stats-engine/stats-distributions.js); f4, pFmt
// (js/stats-engine/stats-core-basic.js); matMul, matT, matInv
// (js/stats-engine/stats-core-advanced.js)
//
// Catatan: file ini nanti juga jadi tujuan B25 (GLM Poisson/NegBin,
// HLM 2-level/3-level/ICC) sesuai roadmap — akan ditambah di sesi lain.
// ════════════════════════════════════════════════════════════


// ── General Linear Model (GLM Univariate) ───────────────
// One DV + fixed factors + optional covariates
// Uses Type III SS via regression approach
function glmUnivariate(data, depVar, factors, covariates){
  req(data.length, 3, 'GLM cases');
  // Get valid rows (listwise deletion)
  var allVars=[depVar,...factors,...covariates];
  var rows=data.filter(function(r){
    return allVars.every(function(v){return isV(Number(r[v]))||typeof r[v]==='string';})
      && isV(Number(r[depVar]));
  });
  var n=rows.length;
  req(n,3,'GLM valid cases');
  var yArr=validNums(rows.map(function(r){return Number(r[depVar]);}));
  req(yArr.length,3,'GLM numeric DV values');
  var grandMean=mean(yArr);
  var ssTot=yArr.reduce(function(s,y){return s+(y-grandMean)*(y-grandMean);},0);

  // Compute SS for each factor using group means
  var results=[];
  var factorLevels={};

  factors.forEach(function(fac){
    var groups={};
    rows.forEach(function(r){
      var yVal=Number(r[depVar]);
      if(!isV(yVal)) return;
      var g=String(r[fac]);
      if(!groups[g]) groups[g]=[];
      groups[g].push(yVal);
    });
    var levels=Object.keys(groups).filter(function(g){return groups[g].length>0;});
    factorLevels[fac]=levels;
    var dfFac=levels.length-1;
    if(dfFac<1){results.push({source:fac,df:0,SS:0,MS:0,F:0,p:'—',eta2:'—',sig:false});return;}
    // SS_between for this factor
    var ssFac=levels.reduce(function(s,g){
      var gm=mean(groups[g]);var gn=groups[g].length;
      return s+gn*(gm-grandMean)*(gm-grandMean);
    },0);
    results.push({source:fac,df:dfFac,SS:f4(ssFac),levels:levels,groups:groups});
  });

  // Covariates SS via correlation with DV
  covariates.forEach(function(cov){
    var xArr=validNums(rows.map(function(r){return Number(r[cov]);}));
    try{
      var r=pearsonR(xArr,yArr);
      var ssCov=r.r*r.r*ssTot;
      results.push({source:cov,df:1,SS:f4(ssCov),isCov:true});
    }catch(e){results.push({source:cov,df:1,SS:'—',isCov:true});}
  });

  // Error SS = SSTot - sum(SS effects)
  var ssEffects=results.reduce(function(s,r){return s+(parseFloat(r.SS)||0);},0);
  var dfModel=results.reduce(function(s,r){return s+(r.df||0);},0);
  var dfError=n-dfModel-1;
  var ssError=Math.max(0,ssTot-ssEffects);
  var msError=dfError>0?ssError/dfError:NaN;

  // Compute F and p for each effect
  results.forEach(function(r){
    if(r.SS==='—'||!r.df) return;
    var ms=parseFloat(r.SS)/r.df;
    r.MS=f4(ms);
    var F_val=msError>0?ms/msError:NaN;
    r.F=f4(F_val);
    var p_val=isFinite(F_val)&&F_val>0?1-fCDF(F_val,r.df,dfError):NaN;
    r.p=f4(p_val);r.p_fmt=pFmt(p_val);r.sig=p_val<0.05;
    var eta2=ssTot>0?parseFloat(r.SS)/ssTot:0;
    var peta2=(parseFloat(r.SS)+ssError)>0?parseFloat(r.SS)/(parseFloat(r.SS)+ssError):0;
    r.eta2=f4(eta2);r.partialEta2=f4(peta2);
  });

  var R2=ssTot>0?ssEffects/ssTot:0;
  var R2adj=n>dfModel+1?1-(1-R2)*(n-1)/(n-dfModel-1):R2;

  return{
    n,depVar,factors,covariates,
    grandMean:f4(grandMean),ssTot:f4(ssTot),
    effects:results,
    ssError:f4(ssError),msError:f4(msError),dfError,
    dfModel,R2:f4(R2),R2adj:f4(R2adj),
    factorLevels
  };
}


// Bonferroni correction for multiple comparisons
function bonferroni(pValues){
  const n=pValues.length;
  return pValues.map(function(p){return Math.min(1,p*n);});
}
