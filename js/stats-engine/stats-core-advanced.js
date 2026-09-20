// ── Matrix Engine (OLS via normal equations) ────────────────────────────
// Represents matrix as flat array, row-major
// Dipakai KHUSUS oleh multipleReg di file ini (bukan oleh EFA/CFA/
// MANOVA/canonicalCorr — mereka pakai versi 2D-array di bawah).
function matMulFlat(A,m,n,B,p){
  // A: m×n, B: n×p -> C: m×p
  const C=new Array(m*p).fill(0);
  for(let i=0;i<m;i++)for(let k=0;k<n;k++)if(A[i*n+k]!==0)
    for(let j=0;j<p;j++) C[i*p+j]+=A[i*n+k]*B[k*p+j];
  return C;
}
function matTFlat(A,m,n){
  const T=new Array(n*m);
  for(let i=0;i<m;i++)for(let j=0;j<n;j++) T[j*m+i]=A[i*n+j];
  return T;
}
function matDetFlat(A,n){
  const M=A.slice();let det=1;
  for(let col=0;col<n;col++){
    let maxR=col;
    for(let r=col+1;r<n;r++) if(Math.abs(M[r*n+col])>Math.abs(M[maxR*n+col])) maxR=r;
    if(maxR!==col){for(let j=0;j<n;j++){const t=M[col*n+j];M[col*n+j]=M[maxR*n+j];M[maxR*n+j]=t;}det*=-1;}
    if(Math.abs(M[col*n+col])<1e-12) return 0;
    det*=M[col*n+col];
    for(let r=col+1;r<n;r++){const f=M[r*n+col]/M[col*n+col];for(let j=col;j<n;j++) M[r*n+j]-=f*M[col*n+j];}
  }
  return det;
}
function matInvFlat(A,n){
  // Singularity guard
  if(Math.abs(matDetFlat(A,n))<1e-10) throw new Error('Matrix near-singular — multicollinearity detected. Remove correlated predictors.');
  // Gauss-Jordan elimination with partial pivoting
  const aug=[];
  for(let i=0;i<n;i++){
    for(let j=0;j<n;j++) aug.push(A[i*n+j]);
    for(let j=0;j<n;j++) aug.push(i===j?1:0);
  }
  const W=2*n;
  for(let col=0;col<n;col++){
    // Pivot
    let maxR=col;
    for(let r=col+1;r<n;r++) if(Math.abs(aug[r*W+col])>Math.abs(aug[maxR*W+col])) maxR=r;
    if(maxR!==col) for(let j=0;j<W;j++){const t=aug[col*W+j];aug[col*W+j]=aug[maxR*W+j];aug[maxR*W+j]=t;}
    const piv=aug[col*W+col];
    if(Math.abs(piv)<1e-14) throw new Error('Matrix is singular — multicollinearity detected');
    for(let j=0;j<W;j++) aug[col*W+j]/=piv;
    for(let r=0;r<n;r++) if(r!==col){
      const f=aug[r*W+col];
      for(let j=0;j<W;j++) aug[r*W+j]-=f*aug[col*W+j];
    }
  }
  const inv=new Array(n*n);
  for(let i=0;i<n;i++) for(let j=0;j<n;j++) inv[i*n+j]=aug[i*W+n+j];
  return inv;
}

// Multiple Linear Regression (OLS, handles k predictors)
function multipleReg(Xnames, yName, dataArr){
  // Build design matrix with intercept
  const pairs=dataArr.filter(r=>{
    if(!isV(r[yName]))return false;
    return Xnames.every(x=>isV(r[x]));
  });
  const n=pairs.length, k=Xnames.length;
  req(n, k+2, 'Multiple Regression');
  const y=pairs.map(r=>r[yName]);
  // X matrix: n×(k+1), first col = 1 (intercept)
  const X=[];
  pairs.forEach(r=>{X.push(1);Xnames.forEach(x=>X.push(r[x]));});
  const p=k+1; // num params incl intercept
  // beta = (X'X)^{-1} X'y
  const Xt=matTFlat(X,n,p);
  const XtX=matMulFlat(Xt,p,n,X,p);
  const XtXinv=matInvFlat(XtX,p);
  const Xty=matMulFlat(Xt,p,n,y.map(v=>[v]).flat(),1);
  const beta=matMulFlat(XtXinv,p,p,Xty,1);
  const yBar=mean(y);
  const yHat=pairs.map((_,i)=>beta.reduce((s,b,j)=>s+b*(j===0?1:pairs[i][Xnames[j-1]]),0));
  const SSR=yHat.reduce((s,yh)=>s+(yh-yBar)*(yh-yBar),0);
  const SSE=y.reduce((s,yi,i)=>s+(yi-yHat[i])*(yi-yHat[i]),0);
  const SST=y.reduce((s,yi)=>s+(yi-yBar)*(yi-yBar),0);
  const R2=SST>0?SSR/SST:0;
  const R2adj=1-(1-R2)*(n-1)/(n-p);
  const MSE=SSE/(n-p), MSR=SSR/k;
  const F=MSE>0?MSR/MSE:0, pF=fP(F,k,n-p);
  const RMSE=Math.sqrt(MSE);
  // SE of coefficients: sqrt(MSE * diag(XtX_inv))
  const coefs=beta.map((b,j)=>{
    const se_j=Math.sqrt(MSE*XtXinv[j*p+j]);
    const t_j=se_j>0?b/se_j:0;
    const p_j=tP(Math.abs(t_j),n-p);
    // Standardized beta (for j>0)
    let stdBeta='N/A';
    if(j>0){
      const xVals=pairs.map(r=>r[Xnames[j-1]]);
      const sx=std(xVals), sy=std(y);
      if(sx>0&&sy>0) stdBeta=f4(b*sx/sy);
    }
    return{name:j===0?'(Constant)':Xnames[j-1],B:f4(b),SE:f4(se_j),t:f4(t_j),p:f4(p_j),p_fmt:pFmt(p_j),sig:p_j<.05,beta:stdBeta};
  });
  // VIF for each predictor (need sub-regression)
  const vif=Xnames.map((xi,idx)=>{
    if(Xnames.length<2)return 'N/A';
    try{
      const otherX=Xnames.filter((_,i)=>i!==idx);
      const subRes=multipleReg(otherX,xi,dataArr);
      const r2_i=parseFloat(subRes.R2);
      return r2_i<1?f4(1/(1-r2_i)):'∞';
    }catch{return 'N/A';}
  });
  const residuals=y.map((yi,i)=>yi-yHat[i]);
  // Durbin-Watson
  let dw=NaN;
  if(residuals.length>2){
    const num=residuals.slice(1).reduce((s,e,i)=>s+(e-residuals[i])*(e-residuals[i]),0);
    const den=residuals.reduce((s,e)=>s+e*e,0);
    dw=den>0?num/den:NaN;
  }

  // ── Breusch-Pagan heteroscedasticity test ──────────────
  // Regress squared residuals on predictors
  // BP = n * R² from auxiliary regression ~ χ²(k)
  let bpStat=NaN, bpP=NaN, bpSig=false;
  try{
    const res2=residuals.map(r=>r*r);
    const res2Mean=res2.reduce((s,v)=>s+v,0)/n;
    const auxP=p;
    const auxXtX=new Float64Array(auxP*auxP);
    const auxXty=new Float64Array(auxP);
    for(let i=0;i<n;i++){
      const xi=[1,...Xnames.map(xn=>isV(pairs[i][xn])?pairs[i][xn]:0)];
      for(let a=0;a<auxP;a++){
        auxXty[a]+=xi[a]*res2[i];
        for(let b=0;b<auxP;b++) auxXtX[a*auxP+b]+=xi[a]*xi[b];
      }
    }
    const auxInv=matInvFlat(Array.from(auxXtX),auxP);
    const auxBeta=new Float64Array(auxP);
    for(let a=0;a<auxP;a++) for(let b=0;b<auxP;b++) auxBeta[a]+=auxInv[a*auxP+b]*auxXty[b];
    const res2Hat=Array.from({length:n},(_,i)=>{
      const xi=[1,...Xnames.map(xn=>isV(pairs[i][xn])?pairs[i][xn]:0)];
      return xi.reduce((s,v,j)=>s+v*auxBeta[j],0);
    });
    const ssTot=res2.reduce((s,v)=>s+(v-res2Mean)*(v-res2Mean),0);
    const ssRes=res2.map((v,i)=>v-res2Hat[i]).reduce((s,v)=>s+v*v,0);
    const auxR2=ssTot>0?1-ssRes/ssTot:0;
    bpStat=n*auxR2;
    bpP=1-chiCDF(bpStat,k);
    bpSig=bpP<0.05;
  }catch(e){bpStat=NaN;bpP=NaN;}

  // ── Leverage (hat values) ──────────────────────────────
  const MSE_res=SSE/Math.max(n-p,1);
  const hiiArr=Array.from({length:n},(_,i)=>{
    try{
      const xi=[1,...Xnames.map(xn=>isV(pairs[i][xn])?pairs[i][xn]:0)];
      let h=0;
      for(let a=0;a<p;a++) for(let b=0;b<p;b++) h+=xi[a]*XtXinv[a*p+b]*xi[b];
      return Math.min(Math.max(h,0),0.9999);
    }catch{return 0;}
  });
  const stdRes=residuals.map((r,i)=>{
    const denom=Math.sqrt(MSE_res*(1-hiiArr[i]));
    return denom>0?r/denom:0;
  });
  const studRes=residuals.map((r,i)=>{
    // Jackknife: use PRESS residual
    const denom=Math.sqrt(MSE_res/(1-hiiArr[i]));
    return denom>0?r/denom:0;
  });
  const outliers2=stdRes.filter(r=>Math.abs(r)>2).length;
  const outliers3=stdRes.filter(r=>Math.abs(r)>3).length;

  // ── Cook's Distance ────────────────────────────────────
  const cooksD=residuals.map((r,i)=>{
    const hi=hiiArr[i];
    return MSE_res>0&&hi<1?r*r*hi/(p*MSE_res*(1-hi)*(1-hi)):0;
  });
  const cooksMax=cooksD.length?Math.max(...cooksD):0;
  const cooksThr=4/n;
  const highCooks=cooksD.filter(d=>d>cooksThr).length;
  const highLev=hiiArr.filter(h=>h>2*p/n).length;

  // ── Residual normality (SW on residuals) ───────────────
  let resNorm=null;
  if(residuals.length>=5&&residuals.length<=5000){
    try{resNorm=sw(residuals);}catch{}
  }
  const resSkew=(()=>{
    const mr=mean(residuals),sr=std(residuals);
    return sr>0?residuals.reduce((s,r)=>s+Math.pow((r-mr)/sr,3),0)/n:0;
  })();
  const resKurt=(()=>{
    const mr=mean(residuals),sr=std(residuals);
    return sr>0?residuals.reduce((s,r)=>s+Math.pow((r-mr)/sr,4),0)/n-3:0;
  })();

  // ── Assumption Warning Engine ──────────────────────────
  const regWarnings=[];
  // VIF multicollinearity
  vif.forEach((v,i)=>{
    if(v==='N/A'||v==='∞')return;
    const vn=parseFloat(v);
    if(vn>10) regWarnings.push({level:'error',msg:'VIF='+v+' for "'+Xnames[i]+'" — severe multicollinearity (VIF>10). Remove or combine predictors.'});
    else if(vn>5) regWarnings.push({level:'warn',msg:'VIF='+v+' for "'+Xnames[i]+'" — moderate multicollinearity (VIF>5). Interpret with caution.'});
  });
  // Durbin-Watson autocorrelation
  if(isFinite(dw)){
    if(dw<1.0) regWarnings.push({level:'error',msg:'Durbin-Watson='+f4(dw)+' — strong positive autocorrelation. Consider time-series model.'});
    else if(dw<1.5) regWarnings.push({level:'warn',msg:'Durbin-Watson='+f4(dw)+' — possible positive autocorrelation (ideal 1.5–2.5).'});
    else if(dw>3.0) regWarnings.push({level:'error',msg:'Durbin-Watson='+f4(dw)+' — strong negative autocorrelation.'});
    else if(dw>2.5) regWarnings.push({level:'warn',msg:'Durbin-Watson='+f4(dw)+' — possible negative autocorrelation.'});
  }
  // Breusch-Pagan heteroscedasticity
  if(isFinite(bpP)){
    if(bpSig) regWarnings.push({level:'warn',msg:'Breusch-Pagan: χ²='+f4(bpStat)+' p='+f4(bpP)+' — heteroscedasticity detected. Consider robust SE or WLS.'});
    else regWarnings.push({level:'info',msg:'Breusch-Pagan: p='+f4(bpP)+' — homoscedasticity not rejected (good).'});
  }
  // Residual normality
  if(resNorm&&isFinite(parseFloat(resNorm.p))){
    if(parseFloat(resNorm.p)<0.05) regWarnings.push({level:'warn',msg:'Residuals non-normal (SW p='+resNorm.p+'). Coefficient estimates still unbiased, but inference may be affected.'});
    else regWarnings.push({level:'info',msg:'Residual normality: SW p='+resNorm.p+' — not rejected (good).'});
  }
  if(Math.abs(resSkew)>1) regWarnings.push({level:'warn',msg:'Residual skewness='+f4(resSkew)+' — distribution noticeably skewed.'});
  if(Math.abs(resKurt)>3) regWarnings.push({level:'warn',msg:'Residual kurtosis='+f4(resKurt)+' — heavy tails in residuals.'});
  // Outliers
  if(outliers3>0) regWarnings.push({level:'error',msg:outliers3+' extreme outlier(s) |standardized residual|>3. Investigate these cases.'});
  else if(outliers2>0) regWarnings.push({level:'warn',msg:outliers2+' case(s) with |standardized residual|>2. Check for outliers.'});
  // Cook's influence
  if(highCooks>0) regWarnings.push({level:'warn',msg:highCooks+' influential observation(s) (Cook D>'+f4(cooksThr)+'). Results may depend heavily on these.'});
  // Sample size
  if(n<p*10) regWarnings.push({level:'warn',msg:'Small sample relative to predictors (n='+n+', k='+k+'). Rule of thumb: n≥'+(p*10)+' for reliable estimates.'});


  // ── HC3 Robust Standard Errors ─────────────────────────
  const hc3SE=[];
  try{
    const meat=new Float64Array(p*p);
    for(let i=0;i<n;i++){
      const xi=[1,...Xnames.map(xn=>isV(pairs[i][xn])?pairs[i][xn]:0)];
      const hi=Math.min(hiiArr[i]||0, 0.999);
      const scale=residuals[i]*residuals[i]/((1-hi)*(1-hi));
      for(let a=0;a<p;a++) for(let b=0;b<p;b++) meat[a*p+b]+=xi[a]*xi[b]*scale;
    }
    const vhc3=new Float64Array(p*p);
    for(let a=0;a<p;a++) for(let b=0;b<p;b++){
      let v=0;
      for(let c=0;c<p;c++) for(let d=0;d<p;d++) v+=XtXinv[a*p+c]*meat[c*p+d]*XtXinv[d*p+b];
      vhc3[a*p+b]=v;
    }
    coefs.forEach((c,i)=>{ c.SE_HC3=f4(Math.sqrt(Math.max(0,vhc3[i*p+i]))); });
    coefs.forEach(c=>{
      if(c.SE_HC3&&parseFloat(c.SE_HC3)>0){
        const t_hc3=parseFloat(c.B)/parseFloat(c.SE_HC3);
        c.t_HC3=f4(t_hc3);
        const p_hc3=2*(1-normCDF(Math.abs(t_hc3)));
        c.p_HC3=f4(p_hc3);
        c.p_HC3_fmt=pFmt(p_hc3);
        c.sig_HC3=p_hc3<0.05;
      }
    });
  }catch(e){ coefs.forEach(c=>{c.SE_HC3='—';c.t_HC3='—';c.p_HC3='—';}); }

      return{n,k,p,coefs,vif,R2:f4(R2),R2adj:f4(R2adj),F:f4(F),dfReg:k,dfRes:n-p,
    pF:f4(pF),pF_fmt:pFmt(pF),RMSE:f4(RMSE),SSR:f4(SSR),SSE:f4(SSE),SST:f4(SST),
    DW:f4(dw),yHat,residuals,pairs,sig:pF<.05,
    bpStat:f4(bpStat),bpP:f4(bpP),bpSig,
    stdRes:stdRes.map(r=>f4(r)),cooksD:cooksD.map(d=>f4(d)),
    cooksMax:f4(cooksMax),highCooks,highLev,
    outliers2,outliers3,resSkew:f4(resSkew),resKurt:f4(resKurt),
    resNorm:resNorm?{W:resNorm.W,p:resNorm.p}:null,
    warnings:regWarnings};
}

// Repeated Measures ANOVA (one-way within-subjects)
function repeatedMeasuresAnova(groups, labels){
  // groups: array of arrays (each = measurements at one time point)
  const k=groups.length;
  if(k<3) throw new Error('RM-ANOVA membutuhkan ≥3 titik waktu');
  // Pair rows: only keep subjects with all time points
  const rawN=groups[0].length;
  const valid=[];
  for(let i=0;i<rawN;i++){
    const row=groups.map(g=>g[i]);
    if(row.every(v=>isV(v))) valid.push(row);
  }
  const n=valid.length;
  if(n<3) throw new Error('Tidak cukup data lengkap (butuh ≥3 subjek dengan semua titik waktu)');
  // Grand mean
  const allVals=valid.flat();
  const grandMean=allVals.reduce((a,b)=>a+b,0)/allVals.length;
  // Time-point means
  const tMeans=groups.map((_,j)=>{
    const col=valid.map(r=>r[j]);
    return col.reduce((a,b)=>a+b,0)/n;
  });
  // Subject means
  const sMeans=valid.map(r=>r.reduce((a,b)=>a+b,0)/k);
  // SS Between (time points)
  const SSB=n*tMeans.reduce((a,m)=>a+(m-grandMean)*(m-grandMean),0);
  // SS Subjects
  const SSS=k*sMeans.reduce((a,m)=>a+(m-grandMean)*(m-grandMean),0);
  // SS Total
  const SST=valid.flat().reduce((a,v)=>a+(v-grandMean)*(v-grandMean),0);
  // SS Error = SST - SSB - SSS
  const SSE=SST-SSB-SSS;
  const dfB=k-1, dfS=n-1, dfE=(k-1)*(n-1);
  const MSB=SSB/dfB, MSE=SSE/dfE;
  if(MSE<=0) throw new Error('MSE ≤ 0; periksa data');
  const F=MSB/MSE;
  // p-value via F distribution
  const p=1-fCDF(F,dfB,dfE);
  // Effect size: partial eta squared
  const etaSq=SSB/(SSB+SSE);
  const interp=etaSq>=0.14?'Large':etaSq>=0.06?'Medium':'Small';
  // Means per time point
  return{
    F:f4(F), p:f4(p), p_fmt:pFmt(p), sig:p<.05,
    k, n, dfB, dfE:dfE, dfS,
    MSB:f4(MSB), MSE:f4(MSE),
    SSB:f4(SSB), SSE:f4(SSE), SSS:f4(SSS), SST:f4(SST),
    etaSq:f4(etaSq), etaInterp:interp,
    tMeans:tMeans.map(m=>f4(m)),
    labels:labels||groups.map((_,i)=>'T'+(i+1))
  };
}

// ════════════════════════════════════════════════════════════
// Fitur (B6 - bagian korelasi): Partial Correlation (Pearson,
// mengontrol 1 variabel Z), Canonical Correlation.
// ════════════════════════════════════════════════════════════

// ── Partial Correlation ────────────────────────────────────
// Pearson partial correlation between X and Y controlling for Z (one control var)
function partialCorr(xArr, yArr, zArr){
  req(xArr.length, 5, 'Partial correlation cases');
  // Filter to complete cases across all three
  var triples=[];
  for(var i=0;i<Math.min(xArr.length,yArr.length,zArr.length);i++){
    if(isV(xArr[i])&&isV(yArr[i])&&isV(zArr[i]))triples.push([xArr[i],yArr[i],zArr[i]]);
  }
  req(triples.length,5,'Partial correlation valid cases');
  var xs=triples.map(function(t){return t[0];});
  var ys=triples.map(function(t){return t[1];});
  var zs=triples.map(function(t){return t[2];});
  var rxy=parseFloat(pearsonR(xs,ys).r);
  var rxz=parseFloat(pearsonR(xs,zs).r);
  var ryz=parseFloat(pearsonR(ys,zs).r);
  var num=rxy - rxz*ryz;
  var den=Math.sqrt((1-rxz*rxz)*(1-ryz*ryz));
  if(Math.abs(den)<1e-12)throw new Error('Control variable causes zero denominator (collinearity)');
  var rp=num/den;
  rp=Math.max(-1,Math.min(1,rp));
  var n=triples.length;
  var df=n-3;
  req(df,1,'Partial correlation df (need n≥5)');
  var t_val=rp*Math.sqrt(df)/Math.sqrt(Math.max(1e-12,1-rp*rp));
  var p_val=tP(Math.abs(t_val),df);
  var r2=rp*rp;
  // Fisher z CI
  var fz=0.5*Math.log((1+rp)/(1-rp));
  var se=1/Math.sqrt(n-3);
  var tc95=tCrit(df);
  var zlo=fz-tc95*se, zhi=fz+tc95*se;
  var rlo=Math.tanh(zlo), rhi=Math.tanh(zhi);
  var interp=Math.abs(rp)<.1?'negligible':Math.abs(rp)<.3?'small':Math.abs(rp)<.5?'moderate':'large';
  return{
    rp:f4(rp),r2:f4(r2),t:f4(t_val),df,
    p:f4(p_val),p_fmt:pFmt(p_val),
    ci95:'['+f4(rlo)+', '+f4(rhi)+']',
    n,rxy:f4(rxy),rxz:f4(rxz),ryz:f4(ryz),
    strength:interp,sig:p_val<0.05
  };
}

// ── Canonical Correlation Analysis (CCA) ─────────────────
// Computes canonical correlations between two sets of variables (X-set and Y-set)
// Uses eigendecomposition of R_xx^{-1} * R_xy * R_yy^{-1} * R_yx
function canonicalCorr(xNames, yNames, dataArr){
  req(dataArr.length, xNames.length + yNames.length + 3, 'CCA cases');
  // Complete cases across all variables
  var allVars = xNames.concat(yNames);
  var rows = dataArr.filter(function(r){return allVars.every(function(v){return isV(r[v]);});});
  req(rows.length, xNames.length + yNames.length + 3, 'CCA complete cases');
  var n = rows.length;
  var p = xNames.length;  // # X variables
  var q = yNames.length;  // # Y variables
  // Center all variables
  function colMean(names, idx){ var s=0; rows.forEach(function(r){s+=r[names[idx]];}); return s/n; }
  var xMeans = xNames.map(function(_,i){return colMean(xNames,i);});
  var yMeans = yNames.map(function(_,i){return colMean(yNames,i);});
  // Build centered matrices X (n×p) and Y (n×q)
  var X = rows.map(function(r){return xNames.map(function(v,i){return r[v]-xMeans[i];});});
  var Y = rows.map(function(r){return yNames.map(function(v,i){return r[v]-yMeans[i];});});
  // Compute standardized forms for correlation matrix
  function stdArr(mat, cols){
    var sds = [];
    for(var j=0;j<cols;j++){
      var s=0; mat.forEach(function(row){s+=row[j]*row[j];}); sds.push(Math.sqrt(s/(n-1)));
    }
    return mat.map(function(row){return row.map(function(v,j){return sds[j]>0?v/sds[j]:0;});});
  }
  var Xs = stdArr(X, p);
  var Ys = stdArr(Y, q);
  // Correlation sub-matrices via matMul (2D array version)
  function corrMat(A, B, nA, nB){
    // R = (1/(n-1)) * A' * B
    var R = [];
    for(var i=0;i<nA;i++){
      R[i]=[];
      for(var j=0;j<nB;j++){
        var s=0; for(var k=0;k<n;k++) s+=A[k][i]*B[k][j];
        R[i][j]=s/(n-1);
      }
    }
    return R;
  }
  var Rxx = corrMat(Xs,Xs,p,p);
  var Ryy = corrMat(Ys,Ys,q,q);
  var Rxy = corrMat(Xs,Ys,p,q);
  var Ryx = corrMat(Ys,Xs,q,p);
  // Invert Rxx and Ryy using jacobiEigen-based approach (via matInv 2D)
  var RxxInv, RyyInv;
  try { RxxInv = matInv(Rxx); } catch(e){ throw new Error('X-set variables are collinear. Remove redundant variables.'); }
  try { RyyInv = matInv(Ryy); } catch(e){ throw new Error('Y-set variables are collinear. Remove redundant variables.'); }
  // Form M = Rxx^{-1} * Rxy * Ryy^{-1} * Ryx  (p×p)
  var M = matMul(matMul(matMul(RxxInv, Rxy), RyyInv), Ryx);
  // Eigendecomposition of M
  var eig = jacobiEigen(M, 100);
  // Sort eigenvalues descending
  var nRoots = Math.min(p, q);
  var idx = eig.values.map(function(v,i){return i;})
    .sort(function(a,b){return eig.values[b]-eig.values[a];})
    .slice(0, nRoots);
  var roots = idx.map(function(i){return Math.max(0, eig.values[i]);});
  var canR  = roots.map(function(ev){return Math.sqrt(Math.min(1, ev));});
  var canR2 = canR.map(function(r){return r*r;});
  // Wilks' Lambda test for each root (test that root k through nRoots is 0)
  // Wilks_k = prod_{i>=k}(1 - rc_i^2)
  // Chi-sq approx: Bartlett (1951)
  var tests = [];
  for(var k=0;k<nRoots;k++){
    var lambda = 1;
    for(var i=k;i<nRoots;i++) lambda *= (1 - canR2[i]);
    var df = (p - k) * (q - k);
    var chiSq = -(n - 1 - (p + q + 1)/2) * Math.log(Math.max(lambda, 1e-15));
    var pVal = chi2P(Math.max(0, chiSq), df); // F(13): dulu `chiSqP(...)` (tak terdefinisi) → Canonical Correlation selalu throw
    tests.push({
      root: k+1,
      rc: f4(canR[k]),
      rc2: f4(canR2[k]),
      wilks: f4(lambda),
      chiSq: f4(chiSq),
      df: df,
      p: f4(pVal),
      p_fmt: pFmt(pVal),
      sig: pVal < 0.05
    });
  }
  // Canonical coefficients (standardized) for X-set: columns of eigenvectors
  var xCoefs = xNames.map(function(name, i){
    return { name: name, coefs: idx.map(function(ei){return f4(eig.vectors[i][ei]);}) };
  });
  // Y canonical coefficients via: Vy = Ryy^{-1} * Ryx * Vx, then scale
  var xVecs = idx.map(function(ei){return xNames.map(function(_,i){return eig.vectors[i][ei];});});
  var yVecsMat = xVecs.map(function(vx){
    // Ryy^{-1} * Ryx * vx
    var RyxVx = Ryx.map(function(row){return row.reduce(function(s,v,i){return s+v*vx[i];},0);});
    return RyyInv.map(function(row){return row.reduce(function(s,v,i){return s+v*RyxVx[i];},0);});
  });
  // Normalize y coefs so they define a unit-length canonical variate
  yVecsMat = yVecsMat.map(function(vy){
    var norm = Math.sqrt(vy.reduce(function(s,v){return s+v*v;},0));
    return norm>0 ? vy.map(function(v){return v/norm;}) : vy;
  });
  var yCoefs = yNames.map(function(name, i){
    return { name: name, coefs: yVecsMat.map(function(vy){return f4(vy[i]);}) };
  });
  // Structure coefficients (loadings): correlation of original vars with canonical variates
  // For X: R_sx = Rxx * Vx (already standardized)
  var xLoadings = xNames.map(function(name, i){
    return { name: name, loadings: idx.map(function(ei, ki){
      var s=0; Rxx[i].forEach(function(v,j){s+=v*eig.vectors[j][ei];}); return f4(s);
    })};
  });
  var yLoadings = yNames.map(function(name, i){
    return { name: name, loadings: yVecsMat.map(function(vy, ki){
      var s=0; Ryy[i].forEach(function(v,j){s+=v*vy[j];}); return f4(s);
    })};
  });
  return {
    n: n, p: p, q: q, nRoots: nRoots,
    tests: tests,
    xCoefs: xCoefs,
    yCoefs: yCoefs,
    xLoadings: xLoadings,
    yLoadings: yLoadings,
    xNames: xNames,
    yNames: yNames
  };
}


// ════════════════════════════════════════════════════════════
// Fitur (B8): Exploratory Factor Analysis (EFA) — Principal Axis
// Factoring + Varimax/Promax rotation, Confirmatory Factor Analysis
// (CFA). Termasuk helper: kmoLabel, jacobiEigen (eigen decomposition
// via metode Jacobi), varimaxRotate (Kaiser's algorithm).
//
// ⚠️ DUPLIKAT `matMul`, `matT`, `matDet`, `matInv` (signature
// matMul(A,B) — array 2D, dipakai EFA/CFA/manovaProper) DENGAN SENGAJA
// DIBIARKAN MENIMPA versi B3 (signature matMul(A,m,n,B,p) — flat array,
// dipakai multipleReg) di file ini. Ini adalah REPLIKASI PERSIS dari
// behavior yang sudah ada di app.js monolith (kedua versi di scope
// yang sama, versi kedua/terakhir menang) — bukan bug baru akibat
// pemisahan. Sudah dikonfirmasi user (2026-09-13): dibiarkan apa
// adanya, jangan direname/diperbaiki saat pemisahan. Lihat catatan di
// awal tabel Bagian 3.B ARCHITECTURE.md untuk detail penuh.
// ════════════════════════════════════════════════════════════


// ─── Exploratory Factor Analysis (EFA) ───────────────────────────────────
// Principal Axis Factoring with Varimax/Promax rotation
// Returns eigenvalues, factor loadings, communalities, KMO, Bartlett
function efa(matrix2d, nFactors, rotation){
  var p = matrix2d.length; // number of variables
  var n = matrix2d[0].length; // number of observations
  if(n < p + 1) throw new Error('Need more observations than variables (N > p)');
  if(nFactors < 1 || nFactors > p) throw new Error('Invalid number of factors');

  // 1. Compute correlation matrix
  var R = [];
  for(var i=0;i<p;i++){
    R[i]=[];
    for(var j=0;j<p;j++){
      if(i===j){R[i][j]=1;continue;}
      // pearson on matrix rows
      var xi=matrix2d[i],xj=matrix2d[j];
      var mx=mean(xi),my=mean(xj);
      var num=0,dxi=0,dxj=0;
      for(var k=0;k<n;k++){num+=(xi[k]-mx)*(xj[k]-my);dxi+=(xi[k]-mx)*(xi[k]-mx);dxj+=(xj[k]-my)*(xj[k]-my);}
      R[i][j]=(dxi>0&&dxj>0)?num/Math.sqrt(dxi*dxj):0;
    }
  }

  // 2. KMO measure of sampling adequacy
  // KMO = sum(r²) / (sum(r²) + sum(partial²))
  var sumR2=0, sumA2=0;
  // partial correlations via inversion
  var Rdet=matDet(R);
  var kmo=NaN;
  try{
    var Rinv=matInv(R);
    for(var i=0;i<p;i++) for(var j=0;j<p;j++){
      if(i===j) continue;
      sumR2+=R[i][j]*R[i][j];
      var pij=-Rinv[i][j]/Math.sqrt(Rinv[i][i]*Rinv[j][j]);
      sumA2+=pij*pij;
    }
    kmo = sumR2/(sumR2+sumA2);
  }catch(e){ kmo=NaN; }

  // 3. Bartlett test of sphericity: χ² = -(n-1-(2p+5)/6) * ln|R|
  var lnDetR=0;
  try{lnDetR=Math.log(Math.abs(matDet(R)));}catch(e){lnDetR=NaN;}
  var chi2=NaN,bartDf=NaN,bartP=NaN;
  if(isFinite(lnDetR)){
    chi2=-(n-1-(2*p+5)/6)*lnDetR;
    bartDf=p*(p-1)/2;
    bartP=chi2P(Math.max(0,chi2),bartDf); // F(14): dulu `1-chi2CDF(...)` (bare, tak terdefinisi) → EFA selalu throw
  }

  // 4. Eigendecomposition via power iteration (Jacobi sweep for symmetric matrix)
  var eigResult = jacobiEigen(R, 100);
  var eigenvalues = eigResult.values;
  var eigenvectors = eigResult.vectors; // columns = eigenvectors

  // Sort by descending eigenvalue
  var order=eigenvalues.map(function(_,i){return i;}).sort(function(a,b){return eigenvalues[b]-eigenvalues[a];});
  var sortedEval=order.map(function(i){return eigenvalues[i];});
  var sortedEvec=order.map(function(i){return eigenvectors[i];});

  // 5. Factor loading matrix: L = V * sqrt(Lambda), take first nFactors
  var loadings=[];
  for(var i=0;i<p;i++){
    loadings[i]=[];
    for(var f=0;f<nFactors;f++){
      var ev=sortedEval[f];
      loadings[i][f]=sortedEvec[f][i]*Math.sqrt(Math.max(0,ev));
    }
  }

  // 6. Varimax rotation
  if(rotation==='varimax' && nFactors>1){
    loadings=varimaxRotate(loadings,p,nFactors);
  }

  // 7. Communalities: h² = sum of squared loadings per variable
  var communalities=loadings.map(function(row){return row.reduce(function(s,l){return s+l*l;},0);});

  // 8. Variance explained per factor
  var varExp=[];
  for(var f=0;f<nFactors;f++){
    var ss=0;
    for(var i=0;i<p;i++) ss+=loadings[i][f]*loadings[i][f];
    varExp[f]=ss/p;
  }
  var cumVar=[];var cv=0;
  varExp.forEach(function(v){cv+=v;cumVar.push(cv);});

  return{
    R:R,
    eigenvalues:sortedEval.map(f4),
    loadings:loadings.map(function(row){return row.map(f4);}),
    communalities:communalities.map(f4),
    varExp:varExp.map(function(v){return f4(v*100);}),
    cumVar:cumVar.map(function(v){return f4(v*100);}),
    kmo:isFinite(kmo)?f4(kmo):'N/A',
    kmoInterp:kmoLabel(kmo),
    chi2:isFinite(chi2)?f4(chi2):'N/A',
    bartDf:bartDf,
    bartP:isFinite(bartP)?f4(bartP):'N/A',
    bartSig:bartP<0.05,
    nFactors:nFactors, p:p, n:n,
    rotation:rotation
  };
}


// ─── Confirmatory Factor Analysis (CFA) ──────────────────────────────────
// ULS (Unweighted Least Squares) estimation
// Fit indices: Chi-Square, CFI, TLI (NNFI), RMSEA, SRMR
// cfaFactorMap: { 'FactorName': ['var1','var2',...], ... }
function cfa(dataMatrix, factorMap) {
  var factorNames = Object.keys(factorMap);
  var nFactors = factorNames.length;
  var allVarNames = [];
  factorNames.forEach(function(fn) { factorMap[fn].forEach(function(v){ if(!allVarNames.includes(v)) allVarNames.push(v); }); });
  var p = allVarNames.length;
  var n = dataMatrix[0].length;

  if(n < p + 10) throw new Error('Need more observations (N > p+10). Got N=' + n + ', p=' + p);
  if(p < 2) throw new Error('Need at least 2 observed variables total');

  // Build observed covariance/correlation matrix S (p x p)
  var S = [];
  for(var i = 0; i < p; i++){
    S[i] = [];
    var xi = dataMatrix[i];
    var mx = mean(xi);
    for(var j = 0; j < p; j++){
      var xj = dataMatrix[j];
      var my = mean(xj);
      var cov = 0;
      for(var k = 0; k < n; k++) cov += (xi[k]-mx)*(xj[k]-my);
      cov /= (n - 1);
      S[i][j] = cov;
    }
  }

  // Standardize to correlation matrix R
  var sds = S.map(function(row, i){ return Math.sqrt(S[i][i]); });
  var R = S.map(function(row, i){
    return row.map(function(v, j){ return sds[i]>0 && sds[j]>0 ? v/(sds[i]*sds[j]) : 0; });
  });

  // Build lambda (loading) pattern matrix (p x nFactors) from factorMap
  // Initialize all loadings to 0
  var lambda = [];
  for(var i = 0; i < p; i++){
    lambda[i] = [];
    for(var fj = 0; fj < nFactors; fj++) lambda[i][fj] = 0;
  }

  // For ULS: estimate loadings per factor using correlations within that factor's indicators
  // Simple approach: loading = mean correlation of indicator with other indicators in same factor (scaled)
  var factorLoadings = {}; // factorName -> [{var, loading}]
  factorNames.forEach(function(fn, fi){
    var vars = factorMap[fn];
    var vnIdx = vars.map(function(v){ return allVarNames.indexOf(v); });
    factorLoadings[fn] = [];
    vnIdx.forEach(function(vi, ii){
      if(vi < 0) return;
      // Estimate loading via average inter-item correlation (Spearman's approach)
      var sumR = 0, cnt = 0;
      vnIdx.forEach(function(vj, jj){
        if(vj < 0 || ii === jj) return;
        sumR += Math.abs(R[vi][vj]);
        cnt++;
      });
      var avgR = cnt > 0 ? sumR / cnt : 0;
      // Loading estimate: sqrt of avg inter-item r (common factor model)
      var lam = cnt > 0 ? Math.sqrt(Math.max(0, avgR)) : Math.sqrt(Math.max(0, R[vi][vi]));
      // Refine: use eigenvector approach for the sub-matrix
      lambda[vi][fi] = lam;
      factorLoadings[fn].push({varName: vars[ii], varIdx: vi, loading: lam});
    });
    // Refine loading using PCA on sub-block
    if(vnIdx.length >= 2){
      var subR = vnIdx.map(function(vi){ return vnIdx.map(function(vj){ return R[vi][vj]; }); });
      try {
        var eigR = jacobiEigen(subR, 60);
        var order = eigR.values.map(function(_,i){return i;}).sort(function(a,b){return eigR.values[b]-eigR.values[a];});
        var ev0 = eigR.values[order[0]];
        // F(16): `jacobiEigen` mengembalikan eigenvector sebagai KOLOM (vectors[i][k]) — pola yang sama dipakai canonicalCorr.
        // Dulu `eigR.vectors[order[0]]` (baris) → loading CFA salah (mis. -1.24). Tanda eigenvector juga sembarang → dibuat positif.
        var evec0 = eigR.vectors.map(function(row){return row[order[0]];});
        if(evec0.reduce(function(a,b){return a+b;},0) < 0) evec0 = evec0.map(function(x){return -x;});
        vnIdx.forEach(function(vi, ii){
          if(vi < 0) return;
          var lam = evec0[ii] * Math.sqrt(Math.max(0, ev0));
          lambda[vi][fi] = lam;
          factorLoadings[fn][ii].loading = lam;
        });
      } catch(e) {}
    }
  });

  // Compute model-implied correlation matrix Sigma_hat = Lambda * Phi * Lambda' + Theta
  // Assuming Phi = identity (orthogonal factors) and Theta = diag(1 - h2)
  // Sigma_hat_ij = sum_f lambda_i_f * lambda_j_f + (if i==j: 1 - h2_i)
  var h2 = lambda.map(function(row){ return row.reduce(function(s,l){ return s+l*l; }, 0); });
  var Sigma = [];
  for(var i = 0; i < p; i++){
    Sigma[i] = [];
    for(var j = 0; j < p; j++){
      var s = 0;
      for(var fi2 = 0; fi2 < nFactors; fi2++) s += lambda[i][fi2] * lambda[j][fi2];
      if(i === j) s += Math.max(0, 1 - h2[i]); // unique variance
      Sigma[i][j] = s;
    }
  }

  // ── Fit Indices ────────────────────────────────────────────────────────
  // SRMR: Standardized Root Mean Residual
  var srmrSum = 0, srmrCount = 0;
  for(var i = 0; i < p; i++){
    for(var j = 0; j <= i; j++){
      var resid = R[i][j] - Sigma[i][j];
      srmrSum += resid * resid;
      srmrCount++;
    }
  }
  var SRMR = Math.sqrt(srmrSum / srmrCount);

  // Chi-Square: F_ML = trace(S * Sigma_inv) - ln|S*Sigma_inv| - p
  // Using simpler ULS discrepancy: F_ULS = 0.5 * tr[(S - Sigma)^2]
  var Fdiff = 0;
  for(var i = 0; i < p; i++){
    for(var j = 0; j < p; j++){
      var diff = R[i][j] - Sigma[i][j];
      Fdiff += diff * diff;
    }
  }
  Fdiff *= 0.5;
  var dfModel = p*(p+1)/2 - (p*nFactors - nFactors*(nFactors-1)/2 + p);
  dfModel = Math.max(1, dfModel);
  var chiSq = (n - 1) * Fdiff;
  var pChiSq = chi2P(Math.max(0, chiSq), dfModel); // F(14): dulu `1 - chi2CDF(...)` (bare, tak terdefinisi) → CFA selalu throw

  // Null model chi-square (independence model: all off-diagonal = 0)
  var FNull = 0;
  for(var i = 0; i < p; i++){
    for(var j = 0; j < p; j++){
      if(i !== j) FNull += R[i][j] * R[i][j];
    }
  }
  FNull *= 0.5;
  var dfNull = p*(p-1)/2;
  var chiSqNull = (n - 1) * FNull;

  // CFI = 1 - (chiSq - dfModel) / (chiSqNull - dfNull)
  var numer = Math.max(0, chiSq - dfModel);
  var denom = Math.max(0, chiSqNull - dfNull);
  var CFI = denom > 0 ? 1 - numer / denom : 1;
  CFI = Math.min(1, Math.max(0, CFI));

  // TLI (NNFI) = (chiSqNull/dfNull - chiSq/dfModel) / (chiSqNull/dfNull - 1)
  var TLI_num = chiSqNull/dfNull - chiSq/dfModel;
  var TLI_den = chiSqNull/dfNull - 1;
  var TLI = TLI_den > 0 ? TLI_num / TLI_den : 0;
  TLI = Math.min(1.1, TLI); // allow slightly above 1

  // RMSEA = sqrt(max(0, (chiSq/dfModel - 1) / (n-1)))
  var RMSEA = Math.sqrt(Math.max(0, (chiSq/dfModel - 1) / (n - 1)));
  // RMSEA 90% CI
  var rmsea_lo = Math.sqrt(Math.max(0, (chiSq - dfModel - 1.645*Math.sqrt(2*dfModel)) / ((n-1)*dfModel)));
  var rmsea_hi = Math.sqrt(Math.max(0, (chiSq + 1.645*Math.sqrt(2*dfModel)) / ((n-1)*dfModel)));

  // Communalities & factor scores summary
  var communalities = h2.map(function(v){ return Math.min(1, v); });

  // Fit interpretation helpers
  function fitCFI(v){ if(v>=0.95) return 'Excellent'; if(v>=0.90) return 'Acceptable'; return 'Poor'; }
  function fitTLI(v){ if(v>=0.95) return 'Excellent'; if(v>=0.90) return 'Acceptable'; return 'Poor'; }
  function fitRMSEA(v){ if(v<=0.05) return 'Excellent'; if(v<=0.08) return 'Acceptable'; if(v<=0.10) return 'Marginal'; return 'Poor'; }
  function fitSRMR(v){ if(v<=0.05) return 'Excellent'; if(v<=0.08) return 'Acceptable'; return 'Poor'; }

  return {
    n: n, p: p, nFactors: nFactors,
    factorNames: factorNames,
    factorMap: factorMap,
    lambda: lambda.map(function(r){ return r.map(f4); }),
    communalities: communalities.map(f4),
    varNames: allVarNames,
    factorLoadings: factorLoadings,
    R: R,
    Sigma: Sigma,
    // Fit indices
    chiSq: f4(chiSq), dfModel: dfModel, pChiSq: f4(pChiSq),
    chiSqNull: f4(chiSqNull), dfNull: dfNull,
    CFI: f4(CFI), CFIinterp: fitCFI(CFI),
    TLI: f4(TLI), TLIinterp: fitTLI(TLI),
    RMSEA: f4(RMSEA), RMSEAinterp: fitRMSEA(RMSEA),
    RMSEA_lo: f4(rmsea_lo), RMSEA_hi: f4(rmsea_hi),
    SRMR: f4(SRMR), SRMRinterp: fitSRMR(SRMR),
    SRMR_raw: SRMR,
    CFI_raw: CFI, TLI_raw: TLI, RMSEA_raw: RMSEA,
    overallFit: (CFI >= 0.95 && RMSEA <= 0.06 && SRMR <= 0.08) ? 'Good Fit' :
                (CFI >= 0.90 && RMSEA <= 0.08 && SRMR <= 0.10) ? 'Acceptable Fit' : 'Poor Fit',
    fitColor: (CFI >= 0.95 && RMSEA <= 0.06 && SRMR <= 0.08) ? '#34d399' :
              (CFI >= 0.90 && RMSEA <= 0.08 && SRMR <= 0.10) ? '#fbbf24' : '#f87171'
  };
}

function kmoLabel(kmo){
  if(!isFinite(kmo)) return '—';
  if(kmo>=0.9) return 'Marvelous';
  if(kmo>=0.8) return 'Meritorious';
  if(kmo>=0.7) return 'Middling';
  if(kmo>=0.6) return 'Mediocre';
  if(kmo>=0.5) return 'Miserable';
  return 'Unacceptable';
}

// Jacobi eigendecomposition for symmetric matrix
function jacobiEigen(A, maxIter){
  var n=A.length;
  var a=A.map(function(row){return row.slice();});
  var V=[];for(var i=0;i<n;i++){V[i]=[];for(var j=0;j<n;j++)V[i][j]=i===j?1:0;}
  for(var iter=0;iter<maxIter*n*n;iter++){
    // find max off-diagonal
    var p=0,q=1,max=0;
    for(var i=0;i<n;i++) for(var j=i+1;j<n;j++){
      var v=Math.abs(a[i][j]);if(v>max){max=v;p=i;q=j;}
    }
    if(max<1e-10) break;
    var theta=(a[q][q]-a[p][p])/(2*a[p][q]);
    var t=theta>=0?1/(theta+Math.sqrt(1+theta*theta)):1/(theta-Math.sqrt(1+theta*theta));
    var c=1/Math.sqrt(1+t*t),s=t*c;
    var G=[];for(var i=0;i<n;i++){G[i]=[];for(var j=0;j<n;j++)G[i][j]=i===j?1:0;}
    G[p][p]=c;G[q][q]=c;G[p][q]=s;G[q][p]=-s;
    a=matMul(matMul(matT(G),a),G);
    V=matMul(V,G);
  }
  return{values:a.map(function(_,i){return a[i][i];}),vectors:V};
}

function matMul(A,B){
  var n=A.length,m=B[0].length,k=B.length;
  var C=[];for(var i=0;i<n;i++){C[i]=[];for(var j=0;j<m;j++){var s=0;for(var l=0;l<k;l++)s+=A[i][l]*B[l][j];C[i][j]=s;}}
  return C;
}
function matT(A){return A[0].map(function(_,j){return A.map(function(row){return row[j];});});}

function matDet(M){
  var n=M.length;
  if(n===1) return M[0][0];
  if(n===2) return M[0][0]*M[1][1]-M[0][1]*M[1][0];
  var d=0;
  for(var j=0;j<n;j++){
    var sub=M.slice(1).map(function(row){return row.filter(function(_,k){return k!==j;});});
    d+=((j%2===0)?1:-1)*M[0][j]*matDet(sub);
  }
  return d;
}

function matInv(M){
  var n=M.length;
  var aug=M.map(function(row,i){var r=row.slice();for(var j=0;j<n;j++)r.push(i===j?1:0);return r;});
  for(var col=0;col<n;col++){
    var pivRow=col;
    for(var row=col+1;row<n;row++) if(Math.abs(aug[row][col])>Math.abs(aug[pivRow][col])) pivRow=row;
    var tmp=aug[col];aug[col]=aug[pivRow];aug[pivRow]=tmp;
    var pivot=aug[col][col];
    if(Math.abs(pivot)<1e-12) throw new Error('Singular matrix');
    for(var j=0;j<2*n;j++) aug[col][j]/=pivot;
    for(var row=0;row<n;row++){
      if(row===col) continue;
      var factor=aug[row][col];
      for(var j=0;j<2*n;j++) aug[row][j]-=factor*aug[col][j];
    }
  }
  return aug.map(function(row){return row.slice(n);});
}

// Varimax rotation: Kaiser's algorithm
function varimaxRotate(L, p, m){
  var T=[];for(var i=0;i<m;i++){T[i]=[];for(var j=0;j<m;j++)T[i][j]=i===j?1:0;}
  for(var iter=0;iter<200;iter++){
    var maxRot=0;
    for(var i=0;i<m-1;i++) for(var j=i+1;j<m;j++){
      var u=[],v=[];
      for(var k=0;k<p;k++){u.push(L[k][i]*L[k][i]-L[k][j]*L[k][j]);v.push(2*L[k][i]*L[k][j]);}
      var A=u.reduce(function(s,x){return s+x;},0)/p;
      var B=v.reduce(function(s,x){return s+x;},0)/p;
      var C=u.reduce(function(s,x,k){return s+(x*x-v[k]*v[k]);},0)/p;
      var D=u.reduce(function(s,x,k){return s+x*v[k];},0)/p*2;
      var X=C-A*A+B*B;var Y=D-2*A*B;
      var phi=Math.atan2(Y,X)/4;
      if(Math.abs(phi)<1e-6) continue;
      maxRot=Math.max(maxRot,Math.abs(phi));
      var cp=Math.cos(phi),sp=Math.sin(phi);
      for(var k=0;k<p;k++){var li=L[k][i],lj=L[k][j];L[k][i]=cp*li+sp*lj;L[k][j]=-sp*li+cp*lj;}
    }
    if(maxRot<1e-7) break;
  }
  // Fix sign: make largest loading per factor positive
  for(var j=0;j<m;j++){
    var maxAbs=0,maxI=0;
    for(var i=0;i<p;i++) if(Math.abs(L[i][j])>maxAbs){maxAbs=Math.abs(L[i][j]);maxI=i;}
    if(L[maxI][j]<0) for(var i=0;i<p;i++) L[i][j]=-L[i][j];
  }
  return L;
}

  
  // PROPER MANOVA
  function manovaProper(data, depVars, factor){
    // 1. Listwise deletion: keep rows with all DVs numeric + factor present
    var rows = data.filter(function(r){
      if(r[factor]===null||r[factor]===undefined||r[factor]==='') return false;
      return depVars.every(function(dv){ var v=Number(r[dv]); return isV(v); });
    });
    var n = rows.length;
    var p = depVars.length; // number of DVs
    req(n, p+2, 'MANOVA: need more cases than DVs');
    req(p, 2, 'MANOVA: need ≥2 dependent variables');

    // 2. Groups
    var groupKeys = [];
    rows.forEach(function(r){
      var g = String(r[factor]);
      if(groupKeys.indexOf(g)===-1) groupKeys.push(g);
    });
    groupKeys.sort();
    var g = groupKeys.length;
    req(g, 2, 'MANOVA: need ≥2 groups');

    // 3. Grand means vector (p×1)
    var grandMeans = depVars.map(function(dv){
      return mean(rows.map(function(r){ return Number(r[dv]); }));
    });

    // 4. Group means matrix (g×p) and group ns
    var groupMeans = groupKeys.map(function(gk){
      var gRows = rows.filter(function(r){ return String(r[factor])===gk; });
      return {
        key: gk,
        n: gRows.length,
        means: depVars.map(function(dv){
          return mean(gRows.map(function(r){ return Number(r[dv]); }));
        }),
        rows: gRows
      };
    });

    // 5. Build H matrix (p×p) — Between-groups SSCP
    // H[i][j] = sum_g( n_g * (gMean_i - grandMean_i) * (gMean_j - grandMean_j) )
    var H = [];
    for(var i=0;i<p;i++){
      H[i]=[];
      for(var j=0;j<p;j++){
        var val=0;
        groupMeans.forEach(function(gm){
          val += gm.n * (gm.means[i]-grandMeans[i]) * (gm.means[j]-grandMeans[j]);
        });
        H[i][j]=val;
      }
    }

    // 6. Build E matrix (p×p) — Within-groups SSCP (Error)
    // E[i][j] = sum_g sum_k( (y_ik - gMean_i)(y_jk - gMean_j) )
    var E = [];
    for(var i=0;i<p;i++){
      E[i]=[];
      for(var j=0;j<p;j++) E[i][j]=0;
    }
    groupMeans.forEach(function(gm){
      gm.rows.forEach(function(r){
        for(var i=0;i<p;i++){
          for(var j=0;j<p;j++){
            E[i][j] += (Number(r[depVars[i]])-gm.means[i]) * (Number(r[depVars[j]])-gm.means[j]);
          }
        }
      });
    });

    // 7. Eigenvalues of E^{-1} H  →  lambda_i
    var Einv, eigenVals;
    try{ Einv = matInv(E); } catch(e){ throw new Error('Error matrix is singular — check for collinear DVs or empty groups'); }
    var EinvH = matMul(Einv, H);
    var eigRes = jacobiEigen(EinvH, 150);
    // Keep only positive real eigenvalues (numerical noise can create tiny negatives)
    eigenVals = eigRes.values.map(function(v){ return Math.max(0,v); });
    // Sort descending
    eigenVals.sort(function(a,b){ return b-a; });
    // Trim to min(p, g-1) meaningful eigenvalues
    var s = Math.min(p, g-1);
    eigenVals = eigenVals.slice(0, s);

    // 8. Multivariate test statistics
    // Pillai's Trace  V = sum( lambda/(1+lambda) )
    var pillai = eigenVals.reduce(function(acc,lam){ return acc + lam/(1+lam); }, 0);
    // Wilks' Lambda  W = product( 1/(1+lambda) )
    var wilks = eigenVals.reduce(function(acc,lam){ return acc * (1/(1+lam)); }, 1);
    // Hotelling-Lawley Trace  T = sum(lambda)
    var hotelling = eigenVals.reduce(function(acc,lam){ return acc+lam; }, 0);
    // Roy's Greatest Root  R = max(lambda)
    var roy = eigenVals.length>0 ? eigenVals[0] : 0;

    var dfH = g - 1;      // hypothesis df
    var dfE = n - g;      // error df

    // 9. F-approximations
    // --- Pillai ---
    var m1 = (Math.abs(dfH-p)-1)/2;
    var n1 = (dfE-p-1)/2;
    var pillaiF=NaN, pillaiDf1=NaN, pillaiDf2=NaN, pillaiP=NaN;
    pillaiDf1 = s * dfH;  // simplified; exact for s=1
    pillaiDf2 = s * (dfE - p + s);
    if(s>0 && pillaiDf2>0){
      pillaiF = (pillai / (s - pillai)) * (pillaiDf2 / pillaiDf1);
      pillaiP = isFinite(pillaiF)&&pillaiF>0 ? 1-fCDF(pillaiF,pillaiDf1,pillaiDf2) : NaN;
    }

    // --- Wilks (Rao's F-approximation) ---
    var wilksF=NaN, wilksDf1=NaN, wilksDf2=NaN, wilksP=NaN;
    wilksDf1 = p * dfH;
    // Rao's approximation parameters
    var pp = p*p, hh = dfH*dfH;
    var r_rao = NaN;
    if(pp+hh-5>0) r_rao = Math.sqrt((pp*hh-4)/(pp+hh-5));
    var u = dfE - (p - dfH + 1)/2;
    wilksDf2 = u * (isFinite(r_rao)?r_rao:1) - (p*dfH-2)/2;
    if(wilks>0 && wilksDf1>0 && wilksDf2>0){
      var wilksLam = Math.pow(wilks, isFinite(r_rao)?1/r_rao:1);
      wilksF = ((1-wilksLam)/wilksLam) * (wilksDf2/wilksDf1);
      wilksP = isFinite(wilksF)&&wilksF>0 ? 1-fCDF(wilksF,wilksDf1,wilksDf2) : NaN;
    }

    // --- Hotelling-Lawley ---
    var hotellingF=NaN, hotellingDf1=NaN, hotellingDf2=NaN, hotellingP=NaN;
    hotellingDf1 = s * dfH;
    hotellingDf2 = s * (dfE - p - 1) + 2;
    if(hotellingDf1>0 && hotellingDf2>0 && s>0){
      hotellingF = (hotelling/s) * (hotellingDf2/hotellingDf1);
      hotellingP = isFinite(hotellingF)&&hotellingF>0 ? 1-fCDF(hotellingF,hotellingDf1,hotellingDf2) : NaN;
    }

    // --- Roy (upper bound F, df = p, dfE-p+1) ---
    var royF=NaN, royDf1=NaN, royDf2=NaN, royP=NaN;
    royDf1 = Math.max(p, dfH);
    royDf2 = dfE - royDf1 + dfH;
    if(royDf1>0 && royDf2>0){
      royF = roy * royDf2 / royDf1;
      royP = isFinite(royF)&&royF>0 ? 1-fCDF(royF,royDf1,royDf2) : NaN;
    }

    // 10. Effect sizes
    // Partial eta² from Pillai (most recommended)
    var pillaiEta2 = pillaiDf1>0 && pillaiDf1+pillaiDf2>0
      ? (pillaiF*pillaiDf1)/(pillaiF*pillaiDf1+pillaiDf2) : NaN;

    // 11. Box's M test for equality of covariance matrices
    var boxM=NaN, boxP=NaN, boxF=NaN, boxDf1=NaN, boxDf2=NaN;
    try{
      // Pooled within-group covariance determinant
      var Sp = E.map(function(row){ return row.map(function(v){ return v/dfE; }); });
      var lnDetSp = Math.log(Math.abs(matDet(Sp)));
      // Per-group covariance determinants
      var sumLnDet = 0;
      var groupLnDets = groupMeans.map(function(gm){
        var ni = gm.n;
        if(ni<2) return 0;
        var Si = [];
        for(var i2=0;i2<p;i2++){
          Si[i2]=[];
          for(var j2=0;j2<p;j2++){
            var s2=0;
            gm.rows.forEach(function(r){
              s2 += (Number(r[depVars[i2]])-gm.means[i2])*(Number(r[depVars[j2]])-gm.means[j2]);
            });
            Si[i2][j2]=s2/(ni-1);
          }
        }
        var ld = Math.log(Math.abs(matDet(Si)));
        sumLnDet += (ni-1)*ld;
        return ld;
      });
      // Box's M
      var c1 = (2*p*p+3*p-1)/(6*(p+1)*(g-1)) *
        (groupMeans.reduce(function(s,gm){ return s+1/(gm.n-1); },0) - 1/dfE);
      boxM = (1-c1) * ((dfE)*lnDetSp - sumLnDet);
      boxDf1 = p*(p+1)*(g-1)/2;
      // F approx for Box's M
      var c2 = (p-1)*(p+2)/(6*(g-1));
      var sumInvSq = groupMeans.reduce(function(s,gm){ return s+1/((gm.n-1)*(gm.n-1)); },0);
      var invSqTotal = 1/(dfE*dfE);
      var b = (sumInvSq - invSqTotal) * c2;
      if(b>=0 && b<1){
        boxDf2 = (boxDf1+2)/(b);
        boxF = boxM/boxDf1 * (1-b);
        boxP = isFinite(boxF)&&boxF>=0 ? 1-fCDF(Math.abs(boxF),boxDf1,Math.abs(boxDf2)) : NaN;
      } else {
        boxP = 1-manovaChi2CDF(boxM, boxDf1);
      }
    }catch(e){ /* Box's M failed silently */ }

    // 12. Univariate follow-up ANOVAs (per DV)
    var univariate = depVars.map(function(dv){
      try{ return {dv:dv, res:glmUnivariate(data,dv,[factor],[])}; }
      catch(e){ return {dv:dv, res:{_err:e.message}}; }
    });

    return {
      n, p, g, s, factor,
      depVars, groupKeys,
      groupMeans: groupMeans.map(function(gm){
        return {key:gm.key, n:gm.n, means:gm.means.map(f4)};
      }),
      grandMeans: grandMeans.map(f4),
      eigenvalues: eigenVals.map(f4),
      // Multivariate tests
      pillai:   {stat:f4(pillai),   F:f4(pillaiF),   df1:pillaiDf1,   df2:f4(pillaiDf2),   p:pillaiP,   p_fmt:pFmt(pillaiP),   sig:pillaiP<0.05},
      wilks:    {stat:f4(wilks),    F:f4(wilksF),    df1:wilksDf1,    df2:f4(wilksDf2),    p:wilksP,    p_fmt:pFmt(wilksP),    sig:wilksP<0.05},
      hotelling:{stat:f4(hotelling),F:f4(hotellingF),df1:hotellingDf1,df2:f4(hotellingDf2),p:hotellingP,p_fmt:pFmt(hotellingP),sig:hotellingP<0.05},
      roy:      {stat:f4(roy),      F:f4(royF),      df1:royDf1,      df2:f4(royDf2),      p:royP,      p_fmt:pFmt(royP),      sig:royP<0.05},
      pillaiEta2: isFinite(pillaiEta2)?f4(pillaiEta2):'—',
      boxM: isFinite(boxM)?f4(boxM):'—',
      boxP: isFinite(boxP)?pFmt(boxP):'—',
      boxSig: isFinite(boxP)&&boxP<0.05,
      univariate,
      H, E
    };
  }

  function manovaChi2CDF(x, df){
    if(x<=0) return 0;
    return manovaRegGammaP(df/2, x/2);
  }
  function manovaRegGammaP(a, x){
    if(x<=0) return 0;
    if(x>(a+1)){return 1-manovaRegGammaQ(a,x);}
    var sum=1/a,term=1/a;
    for(var n=1;n<300;n++){term*=x/(a+n);sum+=term;if(Math.abs(term)<1e-10) break;}
    return sum*Math.exp(-x+a*Math.log(x)-lnG(a));
  }
  function manovaRegGammaQ(a,x){
    var fpmin=1e-30,b=x+1-a,c=1/fpmin,d=1/b,h=d;
    for(var i=1;i<300;i++){var an=-i*(i-a);b+=2;d=an*d+b;if(Math.abs(d)<fpmin)d=fpmin;c=b+an/c;if(Math.abs(c)<fpmin)c=fpmin;d=1/d;var del=d*c;h*=del;if(Math.abs(del-1)<1e-10)break;}
    return Math.exp(-x+a*Math.log(x)-lnG(a))*h;
  }

// Logistic Regression (Binary & Multinomial)
function logisticReg(dvName, xNames, dataArr, type) {
  type = type || 'binary';
  // Build valid cases (all fields present)
  var allVars = [dvName].concat(xNames);
  var cases = dataArr.filter(function(r) {
    return xNames.every(function(v) { return typeof r[v]==='number' && isFinite(r[v]); })
      && r[dvName] !== null && r[dvName] !== undefined;
  });
  var n = cases.length;
  if(n < 10) throw new Error('N terlalu kecil (N='+n+'). Butuh ≥10 cases valid.');
  if(xNames.length < 1) throw new Error('Pilih minimal 1 prediktor.');

  // Get categories
  var cats = [...new Set(cases.map(function(r){return r[dvName];}))]
    .sort(function(a,b){return String(a).localeCompare(String(b));});

  if(type==='binary' && cats.length !== 2)
    throw new Error('Binary logistic butuh tepat 2 kategori DV (ditemukan '+cats.length+').');
  if(type==='multinomial' && cats.length < 3)
    throw new Error('Multinomial logistic butuh ≥3 kategori DV (ditemukan '+cats.length+').');

  // Helper: sigmoid
  function sigmoid(z){ return 1/(1+Math.exp(-Math.max(-500,Math.min(500,z)))); }

  // Standardize X for stability
  var xMeans = xNames.map(function(v){ return mean(cases.map(function(r){return r[v];})); });
  var xStds  = xNames.map(function(v,i){ return std(cases.map(function(r){return r[v];})) || 1; });

  function getX(row){ return xNames.map(function(v,i){ return (row[v]-xMeans[i])/xStds[i]; }); }

  // Binary logistic via IRLS (Iteratively Re-weighted Least Squares)
  function binaryLogistic(yBin) {
    var p = xNames.length;
    var beta = new Array(p+1).fill(0); // [intercept, b1, b2, ...]
    var Xs = cases.map(getX);

    for(var iter=0; iter<100; iter++){
      var grad = new Array(p+1).fill(0);
      var H = [];
      for(var r=0;r<=p;r++){ H.push(new Array(p+1).fill(0)); }
      var logL=0;
      for(var i=0;i<n;i++){
        var z = beta[0];
        for(var j=0;j<p;j++) z += beta[j+1]*Xs[i][j];
        var pi = sigmoid(z);
        pi = Math.max(1e-10, Math.min(1-1e-10, pi));
        var y = yBin[i];
        logL += y*Math.log(pi) + (1-y)*Math.log(1-pi);
        var err = y - pi;
        grad[0] += err;
        for(var j=0;j<p;j++) grad[j+1] += err*Xs[i][j];
        var w = pi*(1-pi);
        H[0][0] -= w;
        for(var j=0;j<p;j++){
          H[0][j+1] -= w*Xs[i][j];
          H[j+1][0] -= w*Xs[i][j];
          for(var k=0;k<p;k++) H[j+1][k+1] -= w*Xs[i][j]*Xs[i][k];
        }
      }
      // Newton step: beta -= H^{-1} * grad (simple gradient ascent if Hessian fails)
      // Use gradient ascent with line search for stability
      var step = 0.1;
      var newBeta = beta.slice();
      for(var j=0;j<=p;j++) newBeta[j] = beta[j] + step*grad[j];
      // Check if logL improved (line search)
      var newLogL=0;
      for(var i=0;i<n;i++){
        var z2=newBeta[0]; for(var j=0;j<p;j++) z2+=newBeta[j+1]*Xs[i][j];
        var pi2=sigmoid(z2); pi2=Math.max(1e-10,Math.min(1-1e-10,pi2));
        newLogL+=yBin[i]*Math.log(pi2)+(1-yBin[i])*Math.log(1-pi2);
      }
      if(newLogL>=logL){ beta=newBeta; } else { step*=0.5; }
      // Convergence check
      var gradNorm=Math.sqrt(grad.reduce(function(s,g){return s+g*g;},0));
      if(gradNorm<1e-5) break;
    }
    // Back-transform coefficients to original scale
    var betaOrig = [beta[0]];
    for(var j=0;j<p;j++) betaOrig.push(beta[j+1]/xStds[j]);
    betaOrig[0] = beta[0] - xNames.reduce(function(s,v,j){return s+beta[j+1]*xMeans[j]/xStds[j];},0);

    return { beta: betaOrig, betaStd: beta };
  }

  // SE estimation via observed Fisher information (numerical)
  function computeSE(betaStd, yBin) {
    var p=xNames.length;
    var Xs=cases.map(getX);
    // Hessian diagonal approximation (diagonal Fisher)
    var H=new Array(p+1).fill(0).map(function(){return new Array(p+1).fill(0);});
    for(var i=0;i<n;i++){
      var z=betaStd[0]; for(var j=0;j<p;j++) z+=betaStd[j+1]*Xs[i][j];
      var pi=sigmoid(z); pi=Math.max(1e-10,Math.min(1-1e-10,pi));
      var w=pi*(1-pi);
      H[0][0]+=w;
      for(var j=0;j<p;j++){
        H[0][j+1]+=w*Xs[i][j]; H[j+1][0]+=w*Xs[i][j];
        for(var k=0;k<p;k++) H[j+1][k+1]+=w*Xs[i][j]*Xs[i][k];
      }
    }
    // Invert H (diagonal approx + small ridge for stability)
    var variances=new Array(p+1).fill(0);
    for(var j=0;j<=p;j++) variances[j]=H[j][j]>0?1/Math.max(H[j][j],1e-8):1;
    return variances;
  }

  // Binary case
  if(type==='binary') {
    var yBin = cases.map(function(r){ return r[dvName]===cats[1]?1:0; });
    var fit = binaryLogistic(yBin);
    var betaOrig = fit.beta;
    var betaStd  = fit.betaStd;
    var varSE = computeSE(betaStd, yBin);
    // Back-transform SE to original scale
    var seOrig = [Math.sqrt(varSE[0])];
    for(var j=0;j<xNames.length;j++) seOrig.push(Math.sqrt(varSE[j+1])/xStds[j]);

    // Log-likelihood
    var logL=0;
    for(var i=0;i<n;i++){
      var z=betaOrig[0]; for(var j=0;j<xNames.length;j++) z+=betaOrig[j+1]*cases[i][xNames[j]];
      var pi=sigmoid(z); pi=Math.max(1e-10,Math.min(1-1e-10,pi));
      logL+=yBin[i]*Math.log(pi)+(1-yBin[i])*Math.log(1-pi);
    }
    var nullLogL=0;
    var pY=yBin.filter(function(y){return y===1;}).length/n;
    pY=Math.max(1e-10,Math.min(1-1e-10,pY));
    nullLogL=n*(pY*Math.log(pY)+(1-pY)*Math.log(1-pY));

    var m2ll=-2*logL;
    var chiSq2=f4(-2*(nullLogL-logL));
    var chiSqDf=xNames.length;
    var chiSqP=Math.max(0,1-incBeta(chiSqDf/2,(chiSqDf>0?chiSq2:0)/2,0.5+0));
    // Proper chi-sq p via gamma
    chiSqP=chi2P(parseFloat(chiSq2),chiSqDf);

    // Pseudo-R²
    var coxSnell=f4(1-Math.exp((2*(nullLogL-logL))/n));
    var nagelkerke=f4(parseFloat(coxSnell)/(1-Math.exp(2*nullLogL/n)));

    // Coefficients
    var coefs=[];
    var names=['Constant'].concat(xNames);
    for(var j=0;j<=xNames.length;j++){
      var b=betaOrig[j];
      var se=seOrig[j]||0.001;
      var wald=f4((b/se)*(b/se),3);
      var waldP=Math.max(0,chi2P(parseFloat(wald),1));
      var OR=j===0?'—':f4(Math.exp(b),3);
      var ciLo=j===0?'—':f4(Math.exp(b-1.96*se),3);
      var ciHi=j===0?'—':f4(Math.exp(b+1.96*se),3);
      coefs.push({
        name:names[j], B:f4(b,3), SE:f4(se,3), wald:f4(parseFloat(wald),3),
        p_fmt:fmtP(waldP), OR:OR,
        ci_or:j===0?'—':'['+ciLo+', '+ciHi+']'
      });
    }

    // Predictions & confusion matrix
    var preds=cases.map(function(r){
      var z=betaOrig[0]; for(var j=0;j<xNames.length;j++) z+=betaOrig[j+1]*r[xNames[j]];
      return sigmoid(z)>=0.5?1:0;
    });
    var cm=[[0,0],[0,0]];
    for(var i=0;i<n;i++) cm[yBin[i]][preds[i]]++;
    var correct=cm[0][0]+cm[1][1];
    var accuracy=f1(correct/n*100);

    // AUC (trapezoidal)
    var scored=cases.map(function(r,i){
      var z=betaOrig[0]; for(var j=0;j<xNames.length;j++) z+=betaOrig[j+1]*r[xNames[j]];
      return{prob:sigmoid(z),y:yBin[i]};
    }).sort(function(a,b){return b.prob-a.prob;});
    var pos=yBin.filter(function(y){return y===1;}).length;
    var neg=n-pos;
    var auc=0,tp=0,fp=0;
    for(var i=0;i<scored.length;i++){
      if(scored[i].y===1){tp++;}else{fp++;auc+=tp;}
    }
    auc=pos>0&&neg>0?f4(auc/(pos*neg),3):f4(0.5,3);

    function fmtP(p){return pFmt(p);}

    return{
      n:n, cats:cats, coefs:coefs, m2ll:f4(m2ll,3), chiSq:chiSq2,
      chiSqDf:chiSqDf, chiSqP_fmt:fmtP(chiSqP),
      coxSnell:coxSnell, nagelkerke:nagelkerke,
      cm:cm, accuracy:accuracy, auc:auc
    };
  }

  // Multinomial case (one-vs-reference for each category)
  else {
    // Reference = cats[0], fit K-1 binary models
    var allCoefs=[];
    var totalCorrect=0;
    for(var ki=1;ki<cats.length;ki++){
      var yBin2=cases.map(function(r){ return r[dvName]===cats[ki]?1:0; });
      var fit2=binaryLogistic(yBin2);
      var betaOrig2=fit2.beta;
      var betaStd2=fit2.betaStd;
      var varSE2=computeSE(betaStd2,yBin2);
      var seOrig2=[Math.sqrt(varSE2[0])];
      for(var j=0;j<xNames.length;j++) seOrig2.push(Math.sqrt(varSE2[j+1])/xStds[j]);
      var catCoefs=[];
      var names2=['Constant'].concat(xNames);
      for(var j=0;j<=xNames.length;j++){
        var b2=betaOrig2[j],se2=seOrig2[j]||0.001;
        var wald2=f4((b2/se2)*(b2/se2),3);
        var waldP2=Math.max(0,chi2P(parseFloat(wald2),1));
        function fmtP2(p){return pFmt(p);}
        catCoefs.push({
          name:names2[j],B:f4(b2,3),SE:f4(se2,3),wald:f4(parseFloat(wald2),3),
          p_fmt:fmtP2(waldP2),
          OR:j===0?'—':f4(Math.exp(b2),3),
          ci_or:j===0?'—':'['+f4(Math.exp(b2-1.96*se2),3)+', '+f4(Math.exp(b2+1.96*se2),3)+']'
        });
      }
      allCoefs.push(catCoefs);
    }
    // Predict majority class
    var correctN=0;
    cases.forEach(function(r){
      var scores=cats.map(function(cat,ki){
        if(ki===0) return 0;
        var z=allCoefs[ki-1][0].B; // intercept
        for(var j=0;j<xNames.length;j++) z+=parseFloat(allCoefs[ki-1][j+1].B)*r[xNames[j]];
        return parseFloat(allCoefs[ki-1][0].B)+xNames.reduce(function(s,v,j){return s+parseFloat(allCoefs[ki-1][j+1].B)*r[v];},0);
      });
      var bestCat=cats[scores.indexOf(Math.max.apply(null,scores))];
      if(bestCat===r[dvName]) correctN++;
    });

    // Overall logL and pseudo-R²
    var logLMult=0;
    var nullLogLMult=-n*Math.log(cats.length);
    for(var i=0;i<n;i++){
      var probs=cats.map(function(cat,ki){
        if(ki===0) return 1;
        var z=xNames.reduce(function(s,v,j){return s+parseFloat(allCoefs[ki-1][j+1].B)*cases[i][v];},parseFloat(allCoefs[ki-1][0].B));
        return Math.exp(z);
      });
      var sumP=probs.reduce(function(s,p){return s+p;},0);
      var normP=probs.map(function(p){return p/sumP;});
      var yi=cats.indexOf(cases[i][dvName]);
      if(yi>=0) logLMult+=Math.log(Math.max(1e-10,normP[yi]));
    }
    var chiSqMult=f4(-2*(nullLogLMult-logLMult),3);
    var chiSqDfMult=(cats.length-1)*xNames.length;
    var chiSqPMult=chi2P(parseFloat(chiSqMult),chiSqDfMult);
    var m2llMult=f4(-2*logLMult,3);
    var coxSnellMult=f4(1-Math.exp((2*(nullLogLMult-logLMult))/n));
    var nagelkerkeMult=f4(parseFloat(coxSnellMult)/(1-Math.exp(2*nullLogLMult/n)));

    function fmtPM(p){return pFmt(p);}
    return{
      n:n,cats:cats,categories:cats,coefs:allCoefs,
      m2ll:m2llMult,chiSq:chiSqMult,chiSqDf:chiSqDfMult,
      chiSqP_fmt:fmtPM(chiSqPMult),
      coxSnell:coxSnellMult,nagelkerke:nagelkerkeMult,
      accuracy:f1(correctN/n*100)
    };
  }
}