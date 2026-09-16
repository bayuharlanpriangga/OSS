// ════════════════════════════════════════════════════════════
// js/stats-engine/stats-glm-hlm.js
// Fitur (B6 - bagian GLM): GLM Univariate (Type III SS via regresi,
// 1 DV + fixed factors + covariates opsional), Bonferroni correction
// untuk multiple comparisons.
// Fitur (B25): Poisson Regression (IRLS, log link) + Negative Binomial
// Regression (NB2, profile likelihood untuk θ) + helper matriks lokal
// `solveLinear`/`invertMatrix` (dipakai KHUSUS oleh 2 fungsi ini —
// beda dari matMul/matInv dkk di stats-core-advanced.js, jadi TIDAK
// di-rename, tidak ada tabrakan nama). Juga `computeHLMBasics`
// (Hierarchical Linear Model — hitung ICC & variance partitioning lewat
// one-way ANOVA between/within groups; dipakai untuk tampilan 2-level
// DAN 3-level HLM di UI, cukup dipanggil 2x dengan grouping var beda).
// Depends on: validNums, req, isV, mean, std, tCrit, tP, fP, normCDF,
// fCDF (js/stats-engine/stats-distributions.js); f4, pFmt
// (js/stats-engine/stats-core-basic.js); matMul, matT, matInv
// (js/stats-engine/stats-core-advanced.js); global `data` (dataset
// aktif, dipakai `computeHLMBasics` — diakses langsung by name,
// bukan lewat parameter, sama seperti pola di file2 lain).
//
// Dipindah keluar apa adanya sebagai fungsi global biasa, mengikuti
// pola B1-B24. Tidak ada perubahan logic — murni potong-tempel dari
// app.js (poissonReg/negbinReg/solveLinear/invertMatrix sebelumnya di
// dalam IIFE `var SE = (()=>{...})()`; computeHLMBasics sebelumnya
// nested di dalam function render sub-tab HLM).
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


// ── Poisson Regression (via IRLS, log link) ─────────────────────────
function poissonReg(dvName, xNames, dataArr) {
  var rows = dataArr.filter(function(r){
    if(!isV(r[dvName])) return false;
    var y = parseFloat(r[dvName]);
    if(!isFinite(y)||y<0) return false;
    return xNames.every(function(x){return isV(r[x])&&isFinite(parseFloat(r[x]));});
  });
  req(rows.length, xNames.length+2, 'Poisson regression cases');
  var n = rows.length, p = xNames.length;
  var y = rows.map(function(r){return parseFloat(r[dvName]);});
  // Check for non-integer counts (warning only)
  var hasNonInt = y.some(function(v){return Math.abs(v-Math.round(v))>0.001;});
  // Design matrix with intercept
  var X = rows.map(function(r){
    return [1].concat(xNames.map(function(x){return parseFloat(r[x]);}));
  });
  var k = p+1;
  // IRLS for Poisson (log link, Poisson variance)
  var beta = new Array(k).fill(0);
  var converged = false;
  for(var iter=0;iter<200;iter++){
    // mu = exp(X*beta)
    var mu = X.map(function(xi){
      var xb=0; for(var j=0;j<k;j++) xb+=xi[j]*beta[j];
      return Math.max(1e-10, Math.exp(xb));
    });
    // W = diag(mu), z = X*beta + (y-mu)/mu
    // Score: X'(y-mu), Hessian: X'WX
    // Normal equations: (X'WX)*delta = X'(y-mu)
    // Build X'WX and X'(y-mu)
    var XtWX = [], Xtr = [];
    for(var a=0;a<k;a++){
      XtWX.push(new Array(k).fill(0));
      Xtr.push(0);
    }
    for(var i=0;i<n;i++){
      var w=mu[i], res=y[i]-mu[i];
      for(var a=0;a<k;a++){
        Xtr[a]+=X[i][a]*res;
        for(var b=0;b<k;b++) XtWX[a][b]+=X[i][a]*X[i][b]*w;
      }
    }
    // Solve via Cholesky/Gaussian elimination
    var delta = solveLinear(XtWX, Xtr, k);
    var maxDelta=0;
    for(var j=0;j<k;j++){beta[j]+=delta[j];maxDelta=Math.max(maxDelta,Math.abs(delta[j]));}
    if(maxDelta<1e-8){converged=true;break;}
  }
  // Final mu and log-likelihood
  var muFinal = X.map(function(xi){
    var xb=0; for(var j=0;j<k;j++) xb+=xi[j]*beta[j]; return Math.max(1e-10,Math.exp(xb));
  });
  function lgamma(z){
    var C=[0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
    if(z<0.5) return Math.log(Math.PI/Math.sin(Math.PI*z))-lgamma(1-z);
    z-=1; var x=C[0]; for(var i=1;i<9;i++) x+=C[i]/(z+i);
    var t=z+7.5; return 0.5*Math.log(2*Math.PI)+(z+0.5)*Math.log(t)-t+Math.log(x);
  }
  var logLik=0, nullLogLik=0, yMean=mean(y);
  for(var i=0;i<n;i++){
    logLik += y[i]*Math.log(muFinal[i])-muFinal[i]-lgamma(y[i]+1);
    nullLogLik += y[i]*Math.log(yMean)-yMean-lgamma(y[i]+1);
  }
  var deviance = 2*(logLik - (-logLik)), nullDeviance = 2*(nullLogLik - (-nullLogLik));
  // Actually: deviance = 2*(logSat - logFit)
  var logSat=0;
  for(var i=0;i<n;i++) logSat += (y[i]>0?y[i]*Math.log(y[i])-y[i]-lgamma(y[i]+1):-lgamma(1));
  deviance = 2*(logSat - logLik);
  nullDeviance = 2*(logSat - nullLogLik);
  var df_res = n - k, df_null = n - 1;
  var mcFaddenR2 = 1 - logLik/nullLogLik;
  // Standard errors via Fisher info = (X'WX)^{-1}
  var XtWXFinal=[]; for(var a=0;a<k;a++){XtWXFinal.push(new Array(k).fill(0));}
  for(var i=0;i<n;i++) for(var a=0;a<k;a++) for(var b=0;b<k;b++) XtWXFinal[a][b]+=X[i][a]*X[i][b]*muFinal[i];
  var invI = invertMatrix(XtWXFinal, k);
  var se = [], z = [], p = [], irr = [], irrCI = [];
  for(var j=0;j<k;j++){
    var sej = invI?Math.sqrt(Math.max(0,invI[j][j])):NaN;
    var zj = isFinite(sej)&&sej>0 ? beta[j]/sej : NaN;
    var pj = isFinite(zj) ? 2*(1-normCDF(Math.abs(zj))) : NaN;
    se.push(sej); z.push(zj); p.push(pj);
    irr.push(Math.exp(beta[j]));
    irrCI.push('['+f4(Math.exp(beta[j]-1.96*sej))+', '+f4(Math.exp(beta[j]+1.96*sej))+']');
  }
  // Pearson chi-sq dispersion
  var pearsonX2=0;
  for(var i=0;i<n;i++) pearsonX2 += Math.pow(y[i]-muFinal[i],2)/muFinal[i];
  var dispersion = pearsonX2/df_res;
  var coefs = [{name:'Intercept',b:f4(beta[0]),se:f4(se[0]),z:f4(z[0]),p:pFmt(p[0]),irr:f4(irr[0]),irrCI:irrCI[0],sig:p[0]<.05}];
  for(var j=1;j<k;j++) coefs.push({name:xNames[j-1],b:f4(beta[j]),se:f4(se[j]),z:f4(z[j]),p:pFmt(p[j]),irr:f4(irr[j]),irrCI:irrCI[j],sig:p[j]<.05});
  var lrChi2 = 2*(logLik-nullLogLik);
  return {
    n:n, k:k, converged:converged,
    coefs:coefs, logLik:f4(logLik), nullLogLik:f4(nullLogLik),
    deviance:f4(deviance), nullDeviance:f4(nullDeviance),
    df_res:df_res, df_null:df_null,
    mcFaddenR2:f4(mcFaddenR2), dispersion:f4(dispersion),
    lrChi2:f4(lrChi2), lrDf:k-1, lrP:pFmt(1-normCDF(Math.sqrt(lrChi2))*2),
    hasNonInt:hasNonInt, warnings: dispersion>2?['Dispersion statistic = '+f4(dispersion)+' > 2. Data may be overdispersed — consider Negative Binomial.']:[]
  };
}

// Helper: Gaussian elimination to solve Ax = b
// (KHUSUS dipakai poissonReg/negbinReg di file ini — beda dari
// matMulFlat/matInvFlat di stats-core-advanced.js, tidak ada tabrakan)
function solveLinear(A, b, k){
  var M=[]; for(var i=0;i<k;i++){M.push(A[i].slice());M[i].push(b[i]);}
  for(var col=0;col<k;col++){
    var pivot=col; for(var row=col+1;row<k;row++) if(Math.abs(M[row][col])>Math.abs(M[pivot][col])) pivot=row;
    var tmp=M[col];M[col]=M[pivot];M[pivot]=tmp;
    if(Math.abs(M[col][col])<1e-14) continue;
    for(var row=0;row<k;row++){if(row===col) continue;var f=M[row][col]/M[col][col];for(var c=col;c<=k;c++) M[row][c]-=f*M[col][c];}
  }
  var x=[]; for(var i=0;i<k;i++) x.push(M[i][k]/(M[i][i]||1e-14));
  return x;
}

// Helper: matrix inversion (Gauss-Jordan)
// (KHUSUS dipakai poissonReg/negbinReg di file ini — beda dari
// matInv/matInvFlat di stats-core-advanced.js, tidak ada tabrakan)
function invertMatrix(A, k){
  var M=[]; for(var i=0;i<k;i++){M.push(A[i].slice());} // copy
  var I=[]; for(var i=0;i<k;i++){I.push(new Array(k).fill(0));I[i][i]=1;}
  for(var col=0;col<k;col++){
    var pivot=col; for(var row=col+1;row<k;row++) if(Math.abs(M[row][col])>Math.abs(M[pivot][col])) pivot=row;
    var tmp=M[col];M[col]=M[pivot];M[pivot]=tmp; tmp=I[col];I[col]=I[pivot];I[pivot]=tmp;
    var d=M[col][col]; if(Math.abs(d)<1e-14) return null;
    for(var c=0;c<k;c++){M[col][c]/=d;I[col][c]/=d;}
    for(var row=0;row<k;row++){if(row===col) continue;var f=M[row][col];for(var c=0;c<k;c++){M[row][c]-=f*M[col][c];I[row][c]-=f*I[col][c];}}
  }
  return I;
}

// ── Negative Binomial Regression (log link, NB2 parameterization) ────
function negbinReg(dvName, xNames, dataArr) {
  var rows = dataArr.filter(function(r){
    if(!isV(r[dvName])) return false;
    var y = parseFloat(r[dvName]);
    if(!isFinite(y)||y<0) return false;
    return xNames.every(function(x){return isV(r[x])&&isFinite(parseFloat(r[x]));});
  });
  req(rows.length, xNames.length+2, 'Negative Binomial cases');
  var n = rows.length, p = xNames.length, k = p+1;
  var y = rows.map(function(r){return parseFloat(r[dvName]);});
  var X = rows.map(function(r){return [1].concat(xNames.map(function(x){return parseFloat(r[x]);}));});
  function lgamma(z){
    var C=[0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
    if(z<0.5) return Math.log(Math.PI/Math.sin(Math.PI*z))-lgamma(1-z);
    z-=1; var x=C[0]; for(var i=1;i<9;i++) x+=C[i]/(z+i);
    var t=z+7.5; return 0.5*Math.log(2*Math.PI)+(z+0.5)*Math.log(t)-t+Math.log(x);
  }
  // NB2 log-likelihood: f(y|mu,theta) = lgamma(y+theta)-lgamma(theta)-lgamma(y+1)+theta*log(theta/(theta+mu))+y*log(mu/(mu+theta))
  function nbLogLik(beta, theta){
    var ll=0;
    for(var i=0;i<n;i++){
      var xb=0; for(var j=0;j<k;j++) xb+=X[i][j]*beta[j];
      var mu=Math.max(1e-10,Math.exp(xb));
      var th=Math.max(0.001,theta);
      ll += lgamma(y[i]+th)-lgamma(th)-lgamma(y[i]+1)+th*Math.log(th/(th+mu))+y[i]*Math.log(mu/(mu+th));
    }
    return ll;
  }
  // Start from Poisson estimates then optimize theta
  var beta = new Array(k).fill(0);
  // IRLS outer loop + golden-section search for theta
  var theta = 1.0;
  var converged=false;
  for(var outer=0;outer<50;outer++){
    // IRLS step with fixed theta (NB2 variance = mu + mu^2/theta)
    for(var iter=0;iter<30;iter++){
      var mu=X.map(function(xi){var xb=0;for(var j=0;j<k;j++) xb+=xi[j]*beta[j];return Math.max(1e-10,Math.exp(xb));});
      var XtWX=[],Xtr=[];
      for(var a=0;a<k;a++){XtWX.push(new Array(k).fill(0));Xtr.push(0);}
      for(var i=0;i<n;i++){
        var w=mu[i]/(1+mu[i]/theta); // NB2 weight
        var res=y[i]-mu[i];
        for(var a=0;a<k;a++){Xtr[a]+=X[i][a]*res;for(var b=0;b<k;b++) XtWX[a][b]+=X[i][a]*X[i][b]*w;}
      }
      var delta=solveLinear(XtWX,Xtr,k);
      var md=0; for(var j=0;j<k;j++){beta[j]+=delta[j];md=Math.max(md,Math.abs(delta[j]));}
      if(md<1e-7) break;
    }
    // Profile log-likelihood search for theta in [0.01, 1000]
    var bestTh=theta, bestLL=nbLogLik(beta,theta);
    [0.1,0.5,1,2,5,10,20,50,100,500].forEach(function(th){
      var ll=nbLogLik(beta,th); if(ll>bestLL){bestLL=ll;bestTh=th;}
    });
    // Refine around bestTh
    var lo=bestTh*0.5, hi=bestTh*2;
    for(var gs=0;gs<40;gs++){
      var m1=lo+(hi-lo)*0.382, m2=lo+(hi-lo)*0.618;
      if(nbLogLik(beta,m1)>nbLogLik(beta,m2)) hi=m2; else lo=m1;
    }
    var newTh=(lo+hi)/2;
    if(Math.abs(newTh-theta)<1e-5&&outer>3){converged=true;break;}
    theta=newTh;
  }
  var logLik=nbLogLik(beta,theta);
  // Null log-lik (intercept only)
  var betaNull=[Math.log(mean(y)+1e-10)]; // just intercept
  var nullLL=nbLogLik(betaNull.concat(new Array(k-1).fill(0)),theta);
  // SE via observed Fisher info (numerical Hessian)
  var muFinal=X.map(function(xi){var xb=0;for(var j=0;j<k;j++) xb+=xi[j]*beta[j];return Math.max(1e-10,Math.exp(xb));});
  var XtWXF=[]; for(var a=0;a<k;a++){XtWXF.push(new Array(k).fill(0));}
  for(var i=0;i<n;i++){
    var w=muFinal[i]/(1+muFinal[i]/theta);
    for(var a=0;a<k;a++) for(var b=0;b<k;b++) XtWXF[a][b]+=X[i][a]*X[i][b]*w;
  }
  var invI=invertMatrix(XtWXF,k);
  var se=[],z=[],pv=[],irr=[],irrCI=[];
  for(var j=0;j<k;j++){
    var sej=invI?Math.sqrt(Math.max(0,invI[j][j])):NaN;
    var zj=isFinite(sej)&&sej>0?beta[j]/sej:NaN;
    var pj=isFinite(zj)?2*(1-normCDF(Math.abs(zj))):NaN;
    se.push(sej);z.push(zj);pv.push(pj);
    irr.push(Math.exp(beta[j]));
    irrCI.push('['+f4(Math.exp(beta[j]-1.96*sej))+', '+f4(Math.exp(beta[j]+1.96*sej))+']');
  }
  var coefs=[{name:'Intercept',b:f4(beta[0]),se:f4(se[0]),z:f4(z[0]),p:pFmt(pv[0]),irr:f4(irr[0]),irrCI:irrCI[0],sig:pv[0]<.05}];
  for(var j=1;j<k;j++) coefs.push({name:xNames[j-1],b:f4(beta[j]),se:f4(se[j]),z:f4(z[j]),p:pFmt(pv[j]),irr:f4(irr[j]),irrCI:irrCI[j],sig:pv[j]<.05});
  var lrChi2=2*(logLik-nullLL);
  var mcFaddenR2=1-logLik/nullLL;
  // Pearson dispersion for NB
  var pearsonX2=0;
  for(var i=0;i<n;i++) pearsonX2+=Math.pow(y[i]-muFinal[i],2)/(muFinal[i]+muFinal[i]*muFinal[i]/theta);
  return {
    n:n, k:k, converged:converged,
    theta:f4(theta), thetaDesc:'Dispersion parameter θ (larger = less overdispersion)',
    coefs:coefs, logLik:f4(logLik),
    lrChi2:f4(lrChi2), lrDf:k-1, lrP:pFmt(1-normCDF(Math.sqrt(Math.max(0,lrChi2)))),
    mcFaddenR2:f4(mcFaddenR2),
    pearsonDispersion:f4(pearsonX2/(n-k)),
    warnings:[]
  };
}

// ── Hierarchical Linear Model — ICC & Variance Partitioning ──────────
// Dipakai untuk tampilan 2-level (grp) DAN 3-level (dipanggil ulang
// dengan grouping var Level-3) — one-way ANOVA between/within groups
// buat mengestimasi ICC, tanpa fit model mixed-effects penuh.
function computeHLMBasics(dep, grp){
  if(!dep||!grp) return null;
  var groups={};
  data.forEach(function(r){
    var g=r[grp]; var y=parseFloat(r[dep]);
    if(g===undefined||g===null||isNaN(y)) return;
    if(!groups[g]) groups[g]=[];
    groups[g].push(y);
  });
  var gkeys=Object.keys(groups);
  var k=gkeys.length;
  if(k<2) return {_err:'Need ≥2 groups'};
  var allY=[]; gkeys.forEach(function(g){ groups[g].forEach(function(v){ allY.push(v); }); });
  var n=allY.length;
  if(n<k+1) return {_err:'Too few observations'};
  var grandMean=mean(allY);
  // One-way ANOVA to partition variance
  var SSB=0,SSW=0;
  gkeys.forEach(function(g){
    var gv=groups[g]; var gm=mean(gv);
    SSB+=gv.length*Math.pow(gm-grandMean,2);
    gv.forEach(function(y){ SSW+=Math.pow(y-gm,2); });
  });
  var dfB=k-1, dfW=n-k;
  var MSB=SSB/dfB, MSW=SSW/dfW;
  var avgGrpSize=n/k;
  var varBetween=Math.max(0,(MSB-MSW)/avgGrpSize);
  var varWithin=MSW;
  var varTotal=varBetween+varWithin;
  var ICC=varTotal>0?varBetween/varTotal:0;
  var Fval=MSW>0?MSB/MSW:NaN;
  var pFval=isNaN(Fval)?NaN:1-fCDF(Fval,dfB,dfW);
  // Group means & sizes
  var grpStats=gkeys.map(function(g){
    var gv=groups[g];
    return {group:g,n:gv.length,mean:f4(mean(gv)),sd:gv.length>=2?f4(std(gv)):'N/A'};
  });
  return {k:k,n:n,grandMean:f4(grandMean),ICC:f4(ICC),
    varBetween:f4(varBetween),varWithin:f4(varWithin),
    MSB:f4(MSB),MSW:f4(MSW),F:f4(Fval),p_fmt:pFmt(pFval),sig:pFval<.05,
    grpStats:grpStats,
    design_effect:f4(1+(avgGrpSize-1)*ICC),
    minN_needed:Math.ceil(400/(1+(avgGrpSize-1)*ICC))};
}
