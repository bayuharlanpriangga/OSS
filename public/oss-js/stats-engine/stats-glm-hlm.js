// - General Linear Model (GLM Univariate) -
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


// Poisson Regression (via IRLS, log link)
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

// Negative Binomial Regression (log link, NB2 parameterization)
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
  // THETA_MAX/THETA_MIN: batas pencarian θ. Tanpa batas atas, θ bisa
  // dobel terus tanpa henti (tiap outer loop hi=bestTh*2) kalau data
  // mendekati Poisson / tidak overdispersed — lgamma(y+θ) dan lgamma(θ)
  // jadi dua bilangan raksasa yang nyaris sama, selisihnya (dipakai di
  // log-likelihood) kehilangan presisi lalu meledak jadi NaN. θ=1e4
  // sudah jauh lebih dari cukup untuk dibedakan dari Poisson murni
  // (NB2 dengan θ≥1e4 praktis identik dengan Poisson untuk data nyata),
  // jadi dijadikan plafon aman sekaligus sinyal "data tidak overdispersed".
  var THETA_MAX = 1e4, THETA_MIN = 1e-3;
  var theta = 1.0;
  var converged=false, thetaAtCap=false;
  for(var outer=0;outer<50;outer++){
    // IRLS step with fixed theta (NB2 variance = mu + mu^2/theta), dengan
    // step-halving (line search sederhana). TANPA ini, Newton step bisa
    // overshoot parah lalu NaN — ditemukan saat verifikasi fix θ di atas:
    // dengan θ awal ditebak (1.0) dan beta awal 0, weight NB2
    // (mu/(1+mu/θ)) sering jauh lebih kecil dari weight Poisson biasa
    // (mu), bikin matriks informasi (X'WX) "kurang mengerem" step —
    // beta lompat jauh (kadang ke ribuan) dalam 2-3 iterasi lalu meledak
    // jadi NaN, SEBELUM pencarian θ pun sempat jalan. Begitu beta NaN,
    // log-likelihood NaN untuk semua kandidat θ → golden-section search
    // di atas selalu ambil cabang "else" → θ dobel terus tiap outer loop
    // (persis pola 2^50 yang sudah didiagnosis) — jadi ledakan θ itu
    // GEJALA, bukan akar masalah. Step-halving di bawah memastikan tiap
    // Newton step benar-benar menaikkan log-likelihood (kalau tidak,
    // step dikecilkan bertahap) sebelum diterima.
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
      var llBefore=nbLogLik(beta,theta);
      var step=1, betaTry=beta, md=0;
      for(var half=0;half<15;half++){
        betaTry=beta.map(function(bj,j){return bj+step*delta[j];});
        var llTry=nbLogLik(betaTry,theta);
        if(isFinite(llTry)&&(!isFinite(llBefore)||llTry>=llBefore-1e-8)) break;
        step*=0.5;
      }
      for(var j=0;j<k;j++){md=Math.max(md,Math.abs(betaTry[j]-beta[j]));beta[j]=betaTry[j];}
      if(md<1e-7) break;
    }
    // Profile log-likelihood search for theta in [0.01, 1000]
    var bestTh=theta, bestLL=nbLogLik(beta,theta);
    [0.1,0.5,1,2,5,10,20,50,100,500].forEach(function(th){
      var ll=nbLogLik(beta,th); if(ll>bestLL){bestLL=ll;bestTh=th;}
    });
    // Refine around bestTh, diklem ke [THETA_MIN, THETA_MAX] supaya
    // golden-section tidak bisa lari ke luar batas aman
    var lo=Math.max(THETA_MIN,bestTh*0.5), hi=Math.min(THETA_MAX,bestTh*2);
    for(var gs=0;gs<40;gs++){
      var m1=lo+(hi-lo)*0.382, m2=lo+(hi-lo)*0.618;
      if(nbLogLik(beta,m1)>nbLogLik(beta,m2)) hi=m2; else lo=m1;
    }
    var newTh=Math.min(THETA_MAX,Math.max(THETA_MIN,(lo+hi)/2));
    if(newTh>=THETA_MAX*0.999){
      // Log-likelihood masih naik terus ke arah θ besar sampai plafon —
      // artinya data tidak (atau nyaris tidak) overdispersed dibanding
      // Poisson. Berhenti di sini, JANGAN lanjut dobel tanpa batas.
      theta=THETA_MAX; thetaAtCap=true; converged=true; break;
    }
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
    warnings: thetaAtCap?['Dispersion parameter θ mencapai batas pencarian ('+THETA_MAX+'). Ini menandakan data tidak overdispersed — hasil NB2 akan hampir identik dengan Poisson Regression biasa, pertimbangkan pakai Poisson saja.']:[]
  };
}

// - Hierarchical Linear Model — ICC & Variance Partitioning -
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

// - Multivariate Analysis of Variance (MANOVA) -
function manovaProper(data, depVars, factor) {
  var rows = data.filter(function(r) {
    if (r[factor] === null || r[factor] === undefined || r[factor] === '') return false;
    return depVars.every(function(dv) { var v = Number(r[dv]); return isV(v); });
  });
  var n = rows.length;
  var p = depVars.length;
  req(n, p + 2, 'MANOVA: need more cases than DVs');
  req(p, 2, 'MANOVA: need ≥2 dependent variables');

  var groupKeys = [];
  rows.forEach(function(r) {
    var g = String(r[factor]);
    if (groupKeys.indexOf(g) === -1) groupKeys.push(g);
  });
  groupKeys.sort();
  var g = groupKeys.length;
  req(g, 2, 'MANOVA: need ≥2 groups');

  var grandMeans = depVars.map(function(dv) {
    return mean(rows.map(function(r) { return Number(r[dv]); }));
  });

  var groupMeans = groupKeys.map(function(gk) {
    var gRows = rows.filter(function(r) { return String(r[factor]) === gk; });
    return {
      key: gk,
      n: gRows.length,
      means: depVars.map(function(dv) {
        return mean(gRows.map(function(r) { return Number(r[dv]); }));
      }),
      rows: gRows
    };
  });

  var H = [];
  for (var i = 0; i < p; i++) {
    H[i] = [];
    for (var j = 0; j < p; j++) {
      var val = 0;
      groupMeans.forEach(function(gm) {
        val += gm.n * (gm.means[i] - grandMeans[i]) * (gm.means[j] - grandMeans[j]);
      });
      H[i][j] = val;
    }
  }

  var E = [];
  for (var i = 0; i < p; i++) {
    E[i] = [];
    for (var j = 0; j < p; j++) E[i][j] = 0;
  }
  groupMeans.forEach(function(gm) {
    gm.rows.forEach(function(r) {
      for (var i = 0; i < p; i++) {
        for (var j = 0; j < p; j++) {
          E[i][j] += (Number(r[depVars[i]]) - gm.means[i]) * (Number(r[depVars[j]]) - gm.means[j]);
        }
      }
    });
  });

  var Einv, eigenVals;
  try { Einv = matInv(E); } catch (e) { throw new Error('Error matrix is singular — check for collinear DVs or empty groups'); }
  var EinvH = matMul(Einv, H);
  var eigRes = jacobiEigen(EinvH, 150);
  eigenVals = eigRes.values.map(function(v) { return Math.max(0, v); });
  eigenVals.sort(function(a, b) { return b - a; });
  var s = Math.min(p, g - 1);
  eigenVals = eigenVals.slice(0, s);

  var pillai = eigenVals.reduce(function(acc, lam) { return acc + lam / (1 + lam); }, 0);
  var wilks = eigenVals.reduce(function(acc, lam) { return acc * (1 / (1 + lam)); }, 1);
  var hotelling = eigenVals.reduce(function(acc, lam) { return acc + lam; }, 0);
  var roy = eigenVals.length > 0 ? eigenVals[0] : 0;

  var dfH = g - 1;
  var dfE = n - g;

  var pillaiF = NaN, pillaiDf1 = NaN, pillaiDf2 = NaN, pillaiP = NaN;
  pillaiDf1 = s * dfH;
  pillaiDf2 = s * (dfE - p + s);
  if (s > 0 && pillaiDf2 > 0) {
    pillaiF = (pillai / (s - pillai)) * (pillaiDf2 / pillaiDf1);
    pillaiP = isFinite(pillaiF) && pillaiF > 0 ? 1 - fCDF(pillaiF, pillaiDf1, pillaiDf2) : NaN;
  }

  var wilksF = NaN, wilksDf1 = NaN, wilksDf2 = NaN, wilksP = NaN;
  wilksDf1 = p * dfH;
  var pp = p * p, hh = dfH * dfH;
  var r_rao = NaN;
  if (pp + hh - 5 > 0) r_rao = Math.sqrt((pp * hh - 4) / (pp + hh - 5));
  var u = dfE - (p - dfH + 1) / 2;
  wilksDf2 = u * (isFinite(r_rao) ? r_rao : 1) - (p * dfH - 2) / 2;
  if (wilks > 0 && wilksDf1 > 0 && wilksDf2 > 0) {
    var wilksLam = Math.pow(wilks, isFinite(r_rao) ? 1 / r_rao : 1);
    wilksF = ((1 - wilksLam) / wilksLam) * (wilksDf2 / wilksDf1);
    wilksP = isFinite(wilksF) && wilksF > 0 ? 1 - fCDF(wilksF, wilksDf1, wilksDf2) : NaN;
  }

  var hotellingF = NaN, hotellingDf1 = NaN, hotellingDf2 = NaN, hotellingP = NaN;
  hotellingDf1 = s * dfH;
  hotellingDf2 = s * (dfE - p - 1) + 2;
  if (hotellingDf1 > 0 && hotellingDf2 > 0 && s > 0) {
    hotellingF = (hotelling / s) * (hotellingDf2 / hotellingDf1);
    hotellingP = isFinite(hotellingF) && hotellingF > 0 ? 1 - fCDF(hotellingF, hotellingDf1, hotellingDf2) : NaN;
  }

  var royF = NaN, royDf1 = NaN, royDf2 = NaN, royP = NaN;
  royDf1 = Math.max(p, dfH);
  royDf2 = dfE - royDf1 + dfH;
  if (royDf1 > 0 && royDf2 > 0) {
    royF = roy * royDf2 / royDf1;
    royP = isFinite(royF) && royF > 0 ? 1 - fCDF(royF, royDf1, royDf2) : NaN;
  }

  var pillaiEta2 = pillaiDf1 > 0 && pillaiDf1 + pillaiDf2 > 0
    ? (pillaiF * pillaiDf1) / (pillaiF * pillaiDf1 + pillaiDf2) : NaN;

  var boxM = NaN, boxP = NaN, boxF = NaN, boxDf1 = NaN, boxDf2 = NaN;
  try {
    var Sp = E.map(function(row) { return row.map(function(v) { return v / dfE; }); });
    var lnDetSp = Math.log(Math.abs(matDet(Sp)));
    var sumLnDet = 0;
    groupMeans.map(function(gm) {
      var ni = gm.n;
      if (ni < 2) return 0;
      var Si = [];
      for (var i2 = 0; i2 < p; i2++) {
        Si[i2] = [];
        for (var j2 = 0; j2 < p; j2++) {
          var s2 = 0;
          gm.rows.forEach(function(r) {
            s2 += (Number(r[depVars[i2]]) - gm.means[i2]) * (Number(r[depVars[j2]]) - gm.means[j2]);
          });
          Si[i2][j2] = s2 / (ni - 1);
        }
      }
      var ld = Math.log(Math.abs(matDet(Si)));
      sumLnDet += (ni - 1) * ld;
      return ld;
    });
    var c1 = (2 * p * p + 3 * p - 1) / (6 * (p + 1) * (g - 1)) *
      (groupMeans.reduce(function(s, gm) { return s + 1 / (gm.n - 1); }, 0) - 1 / dfE);
    boxM = (1 - c1) * (dfE * lnDetSp - sumLnDet);
    boxDf1 = p * (p + 1) * (g - 1) / 2;
    var c2 = (p - 1) * (p + 2) / (6 * (g - 1));
    var sumInvSq = groupMeans.reduce(function(s, gm) { return s + 1 / ((gm.n - 1) * (gm.n - 1)); }, 0);
    var invSqTotal = 1 / (dfE * dfE);
    var b = (sumInvSq - invSqTotal) * c2;
    if (b >= 0 && b < 1) {
      boxDf2 = (boxDf1 + 2) / b;
      boxF = boxM / boxDf1 * (1 - b);
      boxP = isFinite(boxF) && boxF >= 0 ? 1 - fCDF(Math.abs(boxF), boxDf1, Math.abs(boxDf2)) : NaN;
    } else {
      boxP = 1 - manovaChi2CDF(boxM, boxDf1);
    }
  } catch (e) { /* Box's M failed silently */ }

  var univariate = depVars.map(function(dv) {
    try { return { dv: dv, res: glmUnivariate(data, dv, [factor], []) }; }
    catch (e) { return { dv: dv, res: { _err: e.message } }; }
  });

  return {
    n, p, g, s, factor,
    depVars, groupKeys,
    groupMeans: groupMeans.map(function(gm) {
      return { key: gm.key, n: gm.n, means: gm.means.map(f4) };
    }),
    grandMeans: grandMeans.map(f4),
    eigenvalues: eigenVals.map(f4),
    pillai: { stat: f4(pillai), F: f4(pillaiF), df1: pillaiDf1, df2: f4(pillaiDf2), p: pillaiP, p_fmt: pFmt(pillaiP), sig: pillaiP < 0.05 },
    wilks: { stat: f4(wilks), F: f4(wilksF), df1: wilksDf1, df2: f4(wilksDf2), p: wilksP, p_fmt: pFmt(wilksP), sig: wilksP < 0.05 },
    hotelling: { stat: f4(hotelling), F: f4(hotellingF), df1: hotellingDf1, df2: f4(hotellingDf2), p: hotellingP, p_fmt: pFmt(hotellingP), sig: hotellingP < 0.05 },
    roy: { stat: f4(roy), F: f4(royF), df1: royDf1, df2: f4(royDf2), p: royP, p_fmt: pFmt(royP), sig: royP < 0.05 },
    pillaiEta2: isFinite(pillaiEta2) ? f4(pillaiEta2) : '—',
    boxM: isFinite(boxM) ? f4(boxM) : '—',
    boxP: isFinite(boxP) ? pFmt(boxP) : '—',
    boxSig: isFinite(boxP) && boxP < 0.05,
    univariate,
    H, E
  };
}

function manovaChi2CDF(x, df) {
  if (x <= 0) return 0;
  return manovaRegGammaP(df / 2, x / 2);
}
function manovaRegGammaP(a, x) {
  if (x <= 0) return 0;
  if (x > (a + 1)) { return 1 - manovaRegGammaQ(a, x); }
  var sum = 1 / a, term = 1 / a;
  for (var n = 1; n < 300; n++) { term *= x / (a + n); sum += term; if (Math.abs(term) < 1e-10) break; }
  return sum * Math.exp(-x + a * Math.log(x) - lnG(a));
}
function manovaRegGammaQ(a, x) {
  var fpmin = 1e-30, b = x + 1 - a, c = 1 / fpmin, d = 1 / b, h = d;
  for (var i = 1; i < 300; i++) { var an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < fpmin) d = fpmin; c = b + an / c; if (Math.abs(c) < fpmin) c = fpmin; d = 1 / d; var del = d * c; h *= del; if (Math.abs(del - 1) < 1e-10) break; }
  return Math.exp(-x + a * Math.log(x) - lnG(a)) * h;
}

