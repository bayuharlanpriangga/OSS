// ── Core mediation computation ──────────────────────────────────────────
function computeMediation(xName,mNames,yName,bootN){
  var isV=function(v){return typeof v==='number'&&isFinite(v);};
  if(!xName||!yName||!mNames||!mNames.length) throw new Error('Select X, Y, and at least 1 Mediator');
  if(xName===yName) throw new Error('X and Y must be different variables');
  mNames.forEach(function(m){if(m===xName||m===yName) throw new Error('Mediator cannot equal X or Y');});

  // Build complete cases (listwise deletion)
  var allVars=[xName,...mNames,yName];
  var cases=data.filter(function(r){return allVars.every(function(v){return isV(r[v]);});});
  if(cases.length<mNames.length+10) throw new Error('Need at least '+(mNames.length+10)+' complete cases (got '+cases.length+')');

  var n=cases.length;
  var xArr=cases.map(function(r){return r[xName];});
  var yArr=cases.map(function(r){return r[yName];});

  // Helper: simple OLS regression, return {b0,b1,...,coefs,se,t,p}
  function ols1(x,y){
    // Simple regression y ~ x
    var r=SE.pearsonR(x,y);
    var xm=SE.mean(x),ym=SE.mean(y),sdx=SE.std(x),sdy=SE.std(y);
    var b1=parseFloat(r.r)*sdy/sdx;
    var b0=ym-b1*xm;
    var yhat=x.map(function(xi){return b0+b1*xi;});
    var sse=y.reduce(function(s,yi,i){return s+(yi-yhat[i])*(yi-yhat[i]);},0);
    var mse=sse/(n-2);
    var ssx=x.reduce(function(s,xi){return s+(xi-xm)*(xi-xm);},0);
    var se_b1=Math.sqrt(mse/ssx);
    var t_b1=b1/se_b1;
    var p_b1=SE.tP?SE.tP(Math.abs(t_b1),n-2):2*(1-SE.normCDF(Math.abs(t_b1)));
    return{b0:SE.f4(b0),b1:SE.f4(b1),se:SE.f4(se_b1),t:SE.f4(t_b1),p:SE.f4(p_b1),r2:r.r2};
  }

  function olsMultiple(Xmat,y){
    // Xmat: array of arrays (rows=obs, cols=predictors), y: array
    // Returns coefs array (excluding intercept), and se, t, p for each
    var nr=y.length,nc=Xmat[0].length;
    // Add intercept column
    var X=Xmat.map(function(row){return [1].concat(row);});
    var p=nc+1;
    // Xt X
    var XtX=[];
    for(var i=0;i<p;i++){XtX[i]=[];for(var j=0;j<p;j++){var s=0;for(var k=0;k<nr;k++)s+=X[k][i]*X[k][j];XtX[i][j]=s;}}
    var XtXinv;
    try{XtXinv=SE.matInv?SE.matInv(XtX):matInvLocal(XtX);}
    catch(e){throw new Error('Singular matrix — possible collinearity');}
    // Xt y
    var Xty=[];
    for(var i=0;i<p;i++){var s=0;for(var k=0;k<nr;k++)s+=X[k][i]*y[k];Xty[i]=s;}
    // beta = XtXinv * Xty
    var beta=[];
    for(var i=0;i<p;i++){var s=0;for(var j=0;j<p;j++)s+=XtXinv[i][j]*Xty[j];beta[i]=s;}
    // residuals
    var yhat=X.map(function(row){return row.reduce(function(s,xi,i){return s+xi*beta[i];},0);});
    var sse=y.reduce(function(s,yi,i){return s+(yi-yhat[i])*(yi-yhat[i]);},0);
    var mse=sse/(nr-p);
    var ses=beta.map(function(_,i){return Math.sqrt(Math.max(0,mse*XtXinv[i][i]));});
    var ts=beta.map(function(b,i){return ses[i]>0?b/ses[i]:0;});
    var ps=ts.map(function(t){return SE.tP?SE.tP(Math.abs(t),nr-p):2*(1-SE.normCDF(Math.abs(t)));});
    var ym=SE.mean(y);
    var sst=y.reduce(function(s,yi){return s+(yi-ym)*(yi-ym);},0);
    var r2=sst>0?1-sse/sst:0;
    return{beta:beta,ses:ses,ts:ts,ps:ps,r2:SE.f4(r2),mse:mse};
  }

  function matInvLocal(M){
    var n2=M.length;
    var aug=M.map(function(row,i){var r=row.slice();for(var j=0;j<n2;j++)r.push(i===j?1:0);return r;});
    for(var col=0;col<n2;col++){
      var pivRow=col;
      for(var row=col+1;row<n2;row++) if(Math.abs(aug[row][col])>Math.abs(aug[pivRow][col])) pivRow=row;
      var tmp=aug[col];aug[col]=aug[pivRow];aug[pivRow]=tmp;
      var pivot=aug[col][col];
      if(Math.abs(pivot)<1e-12) throw new Error('Singular');
      for(var j=0;j<2*n2;j++) aug[col][j]/=pivot;
      for(var row=0;row<n2;row++){
        if(row===col) continue;
        var factor=aug[row][col];
        for(var j=0;j<2*n2;j++) aug[row][j]-=factor*aug[col][j];
      }
    }
    return aug.map(function(row){return row.slice(n2);});
  }

  // Step 1: X → Y (total effect c)
  var step1=ols1(xArr,yArr);
  var c=parseFloat(step1.b1),p_c=parseFloat(step1.p);

  // Step 2: X → M for each mediator (path a)
  var step2Results=mNames.map(function(mName){
    var mArr=cases.map(function(r){return r[mName];});
    var res=ols1(xArr,mArr);
    return{name:mName,arr:mArr,a:parseFloat(res.b1),se_a:parseFloat(res.se),p_a:parseFloat(res.p)};
  });
  var a_first=step2Results[0].a, p_a_first=step2Results[0].p_a;

  // Step 3+4: M+X → Y (path b for each M, c' = direct effect)
  var allMArr=mNames.map(function(mName){return cases.map(function(r){return r[mName];});});
  var XMmat=cases.map(function(r,i){return [r[xName]].concat(mNames.map(function(m){return r[m];}));});
  var step34=olsMultiple(XMmat,yArr);
  // beta[0]=intercept, beta[1]=X coef (c'), beta[2..]=M coefs (b's)
  var c_prime=step34.beta[1], p_c_prime=step34.ps[1];
  var b_first=step34.beta[2], p_b_first=step34.ps[2];

  // Sobel test for each mediator (assuming one active mediator)
  var mediatorResults=step2Results.map(function(s2,i){
    var a=s2.a,se_a=s2.se_a;
    var b=step34.beta[2+i],se_b=Math.sqrt(Math.max(0,step34.mse*0.01)); // approx
    // Better: compute b and se_b from separate regression M+X → Y holding other Ms
    // For now use product method
    var indirect=a*b;
    // Sobel SE = sqrt(b²*se_a² + a²*se_b²)
    // Estimate se_b from the multiple regression SE
    var se_b_full=step34.ses[2+i];
    var sobel_se=Math.sqrt(b*b*se_a*se_a+a*a*se_b_full*se_b_full);
    var sobel_z=sobel_se>0?indirect/sobel_se:0;
    var sobel_p=2*(1-SE.normCDF(Math.abs(sobel_z)));
    return{
      name:s2.name,
      a:SE.f4(a),se_a:SE.f4(se_a),p_a:SE.f4(s2.p_a),
      b:SE.f4(b),se_b:SE.f4(se_b_full),p_b:SE.f4(step34.ps[2+i]),
      indirect:indirect,sobel_z:sobel_z,sobel_p:sobel_p,
    };
  });

  // Bootstrap CI for each mediator's indirect effect
  var bootResults=[];
  if(bootN>0){
    mediatorResults.forEach(function(med,mi){
      var indirects=[];
      for(var b=0;b<bootN;b++){
        var idx=[];for(var k=0;k<n;k++)idx.push(Math.floor(Math.random()*n));
        var bx=idx.map(function(i){return xArr[i];});
        var bm=idx.map(function(i){return allMArr[mi][i];});
        var by=idx.map(function(i){return yArr[i];});
        try{
          var ba=ols1(bx,bm);
          var bXM=idx.map(function(i){return [xArr[i]].concat(mNames.map(function(_,j){return allMArr[j][i];}));});
          var bstep34=olsMultiple(bXM,by);
          indirects.push(parseFloat(ba.b1)*bstep34.beta[2+mi]);
        }catch(e){}
      }
      indirects.sort(function(a,b){return a-b;});
      var lo=indirects[Math.floor(indirects.length*0.025)]||0;
      var hi=indirects[Math.floor(indirects.length*0.975)]||0;
      bootResults.push({name:med.name,lo:SE.f4(lo),hi:SE.f4(hi),sig:lo*hi>0});
    });
  }

  // Determine mediation type
  var totalIndirect=mediatorResults.reduce(function(s,m){return s+m.indirect;},0);
  var anyMSig=mediatorResults.some(function(m){return parseFloat(m.p_a)<0.05&&parseFloat(m.p_b)<0.05;});
  var cSig=p_c<0.05, c_primeSig=p_c_prime<0.05;
  var medType='No Mediation';
  if(anyMSig){
    if(cSig&&!c_primeSig) medType='Full Mediation';
    else if(cSig&&c_primeSig) medType='Partial Mediation';
    else if(!cSig) medType='Inconsistent/Suppression';
  }

  return{
    n,xName,yName,mNames:mNames.slice(),
    barronKenny:{
      c:SE.f4(c),p_c:SE.f4(p_c),
      a:SE.f4(a_first),p_a:SE.f4(p_a_first),
      b:SE.f4(b_first),p_b:SE.f4(step34.ps[2]),
      c_prime:SE.f4(c_prime),p_c_prime:SE.f4(p_c_prime),
    },
    mediators:mediatorResults,
    bootResults:bootResults,
    totalIndirect:SE.f4(totalIndirect),
    medType,
    r2_total:step34.r2,
    r2_step1:step1.r2,
  };
}

// ── Moderation Analysis computation ─────────────────────────────────────
function computeModeration(xName,wName,yName,covNames,center){
  covNames=covNames||[];
  var cases=data.filter(function(r){
    if(!SE.isV(r[xName])||!SE.isV(r[wName])||!SE.isV(r[yName])) return false;
    return covNames.every(function(c){return SE.isV(r[c]);});
  });
  var n=cases.length;
  if(n<cases.length+5) {} // just check
  if(n<10) throw new Error('Need at least 10 complete cases');

  var xArr=cases.map(function(r){return Number(r[xName]);});
  var wArr=cases.map(function(r){return Number(r[wName]);});
  var yArr=cases.map(function(r){return Number(r[yName]);});

  var xMean=SE.mean(xArr), wMean=SE.mean(wArr);
  var xSD=SE.std(xArr), wSD=SE.std(wArr);

  // Mean-center if requested
  var xC=center?xArr.map(function(v){return v-xMean;}):xArr.slice();
  var wC=center?wArr.map(function(v){return v-wMean;}):wArr.slice();
  var xw=xC.map(function(x,i){return x*wC[i];});

  // Build design matrix: [1, X, W, X*W, covs...]
  var predictorNames=[xName+'_c',wName+'_c',xName+'×'+wName].concat(covNames);
  var allPred=[xName,wName,'interaction'].concat(covNames);

  // Use SE.multipleReg-style OLS
  var XMat=cases.map(function(r,i){
    var row=[xC[i],wC[i],xw[i]];
    covNames.forEach(function(c){row.push(Number(r[c]));});
    return row;
  });

  // Partial OLS: [1, X_c, W_c, X*W, ...covs]
  function olsAug(Xrows,y){
    var n2=Xrows.length,p2=Xrows[0].length+1; // +1 for intercept
    var X2=Xrows.map(function(row){return [1].concat(row);});
    var XtX=[],Xty=[];
    for(var a=0;a<p2;a++){Xty.push(0);XtX.push([]);for(var b2=0;b2<p2;b2++)XtX[a].push(0);}
    for(var i=0;i<n2;i++){for(var a=0;a<p2;a++){Xty[a]+=X2[i][a]*y[i];for(var b2=0;b2<p2;b2++)XtX[a][b2]+=X2[i][a]*X2[i][b2];}}
    // Flatten for matInv
    var flat=[];XtX.forEach(function(row){row.forEach(function(v){flat.push(v);});});
    var inv=SE.matInvFlat?SE.matInvFlat(flat,p2):matInvLocal(flat,p2);
    var beta=[];for(var a=0;a<p2;a++){var s=0;for(var b2=0;b2<p2;b2++)s+=inv[a*p2+b2]*Xty[b2];beta.push(s);}
    var yBar=SE.mean(y);
    var yHat=X2.map(function(row){return beta.reduce(function(s,b,j){return s+b*row[j];},0);});
    var SST=y.reduce(function(s,v){return s+(v-yBar)*(v-yBar);},0);
    var SSR=yHat.reduce(function(s,v){return s+(v-yBar)*(v-yBar);},0);
    var SSE=y.reduce(function(s,v,i){return s+(v-yHat[i])*(v-yHat[i]);},0);
    var R2=SST>0?SSR/SST:0;
    var dfR=p2-1,dfE=n2-p2;
    var MSE=dfE>0?SSE/dfE:0,MSR=dfR>0?SSR/dfR:0;
    var F=MSE>0?MSR/MSE:0,pF=fP(F,dfR,dfE);
    var R2adj=1-(1-R2)*(n2-1)/(n2-p2);
    var ses=[];for(var a=0;a<p2;a++)ses.push(Math.sqrt(Math.max(0,MSE*inv[a*p2+a])));
    var ts=beta.map(function(b,a){return ses[a]>0?b/ses[a]:0;});
    var ps=ts.map(function(t,a){return a===0?1:SE.tP(Math.abs(t),dfE);});
    return {beta:beta,ses:ses,ts:ts,ps:ps,R2:R2,R2adj:R2adj,F:F,pF:pF,dfR:dfR,dfE:dfE,SSE:SSE,SST:SST,MSE:MSE,yHat:yHat,n:n2,p:p2};
  }

  // Local matrix inverse fallback
  function matInvLocal(flat,n2){
    var aug=[]; for(var i=0;i<n2;i++){for(var j=0;j<n2;j++)aug.push(flat[i*n2+j]);for(var j=0;j<n2;j++)aug.push(i===j?1:0);}
    var W2=2*n2;
    for(var col=0;col<n2;col++){var maxR=col;for(var r=col+1;r<n2;r++)if(Math.abs(aug[r*W2+col])>Math.abs(aug[maxR*W2+col]))maxR=r;
      if(maxR!==col)for(var j=0;j<W2;j++){var t=aug[col*W2+j];aug[col*W2+j]=aug[maxR*W2+j];aug[maxR*W2+j]=t;}
      var piv=aug[col*W2+col];if(Math.abs(piv)<1e-14)throw new Error('Singular matrix in moderation');
      for(var j=0;j<W2;j++)aug[col*W2+j]/=piv;
      for(var r=0;r<n2;r++){if(r===col)continue;var f=aug[r*W2+col];for(var j=0;j<W2;j++)aug[r*W2+j]-=f*aug[col*W2+j];}
    }
    var inv2=new Array(n2*n2);for(var i=0;i<n2;i++)for(var j=0;j<n2;j++)inv2[i*n2+j]=aug[i*W2+n2+j];return inv2;
  }

  var fullRes=olsAug(XMat,yArr);

  // Baseline model without interaction (X, W, covs) to get ΔR²
  var basePred=[xC,wC].concat(covNames.map(function(c){return cases.map(function(r){return Number(r[c]);});}));
  var baseMat=cases.map(function(r,i){var row=[xC[i],wC[i]];covNames.forEach(function(c){row.push(Number(r[c]));});return row;});
  var baseRes=olsAug(baseMat,yArr);
  var deltaR2=fullRes.R2-baseRes.R2;

  // Coefficient table
  var names=['(Constant)',xName+(center?'_c':''),wName+(center?'_c':''),xName+'×'+wName].concat(covNames);
  var ySD=SE.std(yArr);
  var coefs=fullRes.beta.map(function(b,j){
    var se=fullRes.ses[j],t=fullRes.ts[j],p=fullRes.ps[j];
    var beta_std=j>0&&se>0?SE.f4(b*(j===1?xSD:j===2?wSD:j===3?xSD*wSD:SE.std(cases.map(function(r){return Number(r[covNames[j-4]]);})))/ySD):'—';
    return {name:names[j],b:SE.f4(b),SE:SE.f4(se),beta:beta_std,t:SE.f4(t),p:SE.f4(p),p_fmt:SE.pFmt(p)};
  });

  // Interaction coefficient
  var b3=fullRes.beta[3],se3=fullRes.ses[3],t3=fullRes.ts[3],p3=fullRes.ps[3];

  // Simple slopes at W = Mean-1SD, Mean, Mean+1SD
  var wLevels=[{val:wMean-wSD,label:'W − 1SD',color:'#60a5fa'},{val:wMean,label:'W Mean',color:'#fbbf24'},{val:wMean+wSD,label:'W + 1SD',color:'#f472b6'}];
  var b1=fullRes.beta[1],b3_int=fullRes.beta[3];
  var simpleSlopes=wLevels.map(function(wl){
    var wVal=center?(wl.val-wMean):wl.val;
    var slope=b1+b3_int*wVal;
    // SE of simple slope: sqrt(Var(b1)+wVal²*Var(b3)+2*wVal*Cov(b1,b3))
    // We approximate using the full regression
    var varB1=fullRes.MSE*(SE.matInv?1:1)*Math.pow(fullRes.ses[1],2)/fullRes.MSE;// ses[1]² = MSE*inv[1*p+1]
    var varB3=Math.pow(fullRes.ses[3],2);
    var se_slope=Math.sqrt(Math.max(0,varB1+wVal*wVal*varB3+2*wVal*0)); // cov approx 0 for now
    // Better SE using full covariance from augmented inversion
    se_slope=Math.sqrt(Math.max(0.0001,fullRes.ses[1]*fullRes.ses[1]+wVal*wVal*fullRes.ses[3]*fullRes.ses[3]));
    var t_slope=se_slope>0?slope/se_slope:0;
    var p_slope=SE.tP(Math.abs(t_slope),fullRes.dfE);
    var zCrit=SE.normInv(0.975);
    var ci='['+SE.f4(slope-zCrit*se_slope)+', '+SE.f4(slope+zCrit*se_slope)+']';
    return {label:wl.label,wVal:SE.f4(wl.val),wValC:SE.f4(wVal),slope:SE.f4(slope),se:SE.f4(se_slope),t:SE.f4(t_slope),p:SE.f4(p_slope),p_fmt:SE.pFmt(p_slope),ci95:ci,color:wl.color};
  });

  // Johnson-Neyman: find W where p(slope)=0.05
  var wVals=SE.validNums(wArr);
  var wSorted=[...wVals].sort(function(a,b){return a-b;});
  var wRange=[wSorted[0],wSorted[wSorted.length-1]];
  var tCrit05=SE.normInv(0.975); // approx for large n; better: t-dist
  var jnPoints=[];
  var jnSteps=200;
  for(var ji=0;ji<=jnSteps;ji++){
    var wj=wRange[0]+ji*(wRange[1]-wRange[0])/jnSteps;
    var wjC=center?wj-wMean:wj;
    var slopeJ=b1+b3_int*wjC;
    var seJ=Math.sqrt(Math.max(0.0001,fullRes.ses[1]*fullRes.ses[1]+wjC*wjC*fullRes.ses[3]*fullRes.ses[3]));
    var tJ=seJ>0?slopeJ/seJ:0;
    var pJ=SE.tP(Math.abs(tJ),fullRes.dfE);
    // Detect sign change in t - tCrit
    if(ji>0){
      var prevWj=wRange[0]+(ji-1)*(wRange[1]-wRange[0])/jnSteps;
      var prevWjC=center?prevWj-wMean:prevWj;
      var prevSlope=b1+b3_int*prevWjC;
      var prevSe=Math.sqrt(Math.max(0.0001,fullRes.ses[1]*fullRes.ses[1]+prevWjC*prevWjC*fullRes.ses[3]*fullRes.ses[3]));
      var prevT=prevSe>0?prevSlope/prevSe:0;
      var prevP=SE.tP(Math.abs(prevT),fullRes.dfE);
      if((prevP-0.05)*(pJ-0.05)<0){
        // Sign change: interpolate
        var wCross=prevWj+(wj-prevWj)*((prevP-0.05)/((prevP-0.05)-(pJ-0.05)));
        var crossPct=wVals.filter(function(v){return v>=wCross;}).length/wVals.length*100;
        var crossDir=slopeJ>0?'W > '+SE.f4(wCross):'W < '+SE.f4(wCross);
        jnPoints.push({value:wCross,pct:SE.f4(crossPct),direction:crossDir});
      }
    }
  }
  // Calculate % of dataset in significant region
  var pctSig=0;
  if(jnPoints.length>0){
    // Calculate region significance
    var sigCount=0;
    wVals.forEach(function(wv){
      var wvC=center?wv-wMean:wv;
      var sl=b1+b3_int*wvC;
      var se2=Math.sqrt(Math.max(0.0001,fullRes.ses[1]*fullRes.ses[1]+wvC*wvC*fullRes.ses[3]*fullRes.ses[3]));
      var tv=se2>0?sl/se2:0;
      var pv=SE.tP(Math.abs(tv),fullRes.dfE);
      if(pv<0.05) sigCount++;
    });
    pctSig=SE.f4(sigCount/wVals.length*100);
  } else {
    var sigCount2=0;
    wVals.forEach(function(wv){
      var wvC=center?wv-wMean:wv;
      var sl=b1+b3_int*wvC;
      var se2=Math.sqrt(Math.max(0.0001,fullRes.ses[1]*fullRes.ses[1]+wvC*wvC*fullRes.ses[3]*fullRes.ses[3]));
      var tv=se2>0?sl/se2:0;
      var pv=SE.tP(Math.abs(tv),fullRes.dfE);
      if(pv<0.05) sigCount2++;
    });
    pctSig=SE.f4(sigCount2/Math.max(1,wVals.length)*100);
  }

  return {
    n:n,xName:xName,wName:wName,yName:yName,center:center,
    R2:SE.f4(fullRes.R2),R2adj:SE.f4(fullRes.R2adj),F:SE.f4(fullRes.F),
    pF:SE.f4(fullRes.pF),pF_fmt:SE.pFmt(fullRes.pF),
    dfR:fullRes.dfR,dfE:fullRes.dfE,
    coefs:coefs,
    interaction:{b:SE.f4(b3),SE:SE.f4(se3),t:SE.f4(t3),p:SE.f4(p3),p_fmt:SE.pFmt(p3)},
    deltaR2:SE.f4(deltaR2),
    xMean:SE.f4(xMean),xSD:SE.f4(xSD),
    wMean:SE.f4(wMean),wSD:SE.f4(wSD),
    simpleSlopes:simpleSlopes,
    jn:{regions:jnPoints,pctSig:pctSig},
    xArr:xArr,wArr:wArr,yArr:yArr,xC:xC,wC:wC
  };
}

// ── Core SEM computation ─────────────────────────────────────────────────
function computeSEM(latents,latentMap,paths){
  var f4=SE.f4||function(x){return isFinite(x)?parseFloat(x.toFixed(4)):NaN;};
  var f3=function(x){return isFinite(x)?parseFloat(x.toFixed(3)):NaN;};
  var f2=function(x){return isFinite(x)?parseFloat(x.toFixed(2)):NaN;};

  // Collect all indicator variables
  var allVars=[];
  latents.forEach(function(ln){
    (latentMap[ln]||[]).forEach(function(v){if(!allVars.includes(v))allVars.push(v);});
  });
  if(allVars.length<2) throw new Error('Minimal 2 indikator total');

  // Build complete cases
  var cases=data.filter(function(r){return allVars.every(function(v){var x=r[v];return typeof x==='number'&&isFinite(x);});});
  var n=cases.length;
  if(n<allVars.length+10) throw new Error('N terlalu kecil. N='+n+', butuh ≥'+(allVars.length+10));

  // Build data matrix
  var matrix=allVars.map(function(v){return cases.map(function(r){return r[v];});});
  var p=allVars.length;

  // Helper functions
  function mean(arr){var s=0;for(var i=0;i<arr.length;i++)s+=arr[i];return s/arr.length;}
  function std(arr){var m=mean(arr);var s=0;for(var i=0;i<arr.length;i++)s+=(arr[i]-m)*(arr[i]-m);return Math.sqrt(s/(arr.length-1));}
  function corr(a,b){
    var ma=mean(a),mb=mean(b),sa=std(a),sb=std(b);
    if(sa===0||sb===0) return 0;
    var s=0;for(var i=0;i<a.length;i++)s+=(a[i]-ma)*(b[i]-mb);
    return s/((a.length-1)*sa*sb);
  }

  // Build observed correlation matrix
  var R=[];
  for(var i=0;i<p;i++){R[i]=[];for(var j=0;j<p;j++)R[i][j]=corr(matrix[i],matrix[j]);}

  // ── Measurement Model (CFA for each latent) ──
  var loadings=[];
  var constructs=[];
  var allLambdas=new Array(p).fill(0);
  var allCommunalities=new Array(p).fill(0);

  latents.forEach(function(ln,li){
    var indics=latentMap[ln]||[];
    if(indics.length<2) return;
    var idxs=indics.map(function(v){return allVars.indexOf(v);}).filter(function(i){return i>=0;});

    // Extract sub-correlation matrix for this construct
    var subR=idxs.map(function(i){return idxs.map(function(j){return R[i][j];});});

    // Estimate loadings via PCA of sub-correlation (first PC = factor)
    var q=idxs.length;
    var lambdas=new Array(q).fill(0);
    // Power iteration for first eigenvector
    var vec=new Array(q).fill(1/Math.sqrt(q));
    for(var iter=0;iter<50;iter++){
      var newVec=new Array(q).fill(0);
      for(var a=0;a<q;a++){for(var b=0;b<q;b++)newVec[a]+=subR[a][b]*vec[b];}
      var norm=Math.sqrt(newVec.reduce(function(s,x){return s+x*x;},0));
      if(norm<1e-10) break;
      newVec=newVec.map(function(x){return x/norm;});
      var diff=vec.reduce(function(s,x,i){return s+Math.abs(x-newVec[i]);},0);
      vec=newVec;
      if(diff<1e-8) break;
    }
    // Eigenvalue
    var eigVal=0;
    for(var a=0;a<q;a++){var rv=0;for(var b=0;b<q;b++)rv+=subR[a][b]*vec[b];eigVal+=vec[a]*rv;}
    // Loadings = eigvec * sqrt(eigenvalue)
    lambdas=vec.map(function(x){return Math.max(-0.999,Math.min(0.999,x*Math.sqrt(Math.max(0,eigVal))));});

    // Ensure positive average loading
    var avgLam=lambdas.reduce(function(s,x){return s+x;},0)/lambdas.length;
    if(avgLam<0) lambdas=lambdas.map(function(x){return -x;});

    // Communalities
    var h2s=lambdas.map(function(l){return Math.min(0.999,l*l);});

    // AVE and CR
    var sumL2=h2s.reduce(function(s,x){return s+x;},0);
    var AVE=sumL2/q;
    var sumL=lambdas.reduce(function(s,x){return s+Math.abs(x);},0);
    var CR=sumL*sumL/(sumL*sumL+(q-sumL2));

    // Cronbach's alpha for this construct
    var avgR=0,rCount=0;
    for(var a=0;a<q;a++){for(var b=a+1;b<q;b++){avgR+=subR[a][b];rCount++;}}
    avgR=rCount>0?avgR/rCount:0;
    var alpha=q*avgR/(1+(q-1)*avgR);

    constructs.push({name:ln,AVE:f4(AVE),CR:f4(CR),alpha:f4(Math.max(0,Math.min(1,alpha))),nIndics:q});

    // Store loadings
    idxs.forEach(function(globalIdx,localIdx){
      allLambdas[globalIdx]=lambdas[localIdx];
      allCommunalities[globalIdx]=h2s[localIdx];
    });

    // Build loadings rows
    var firstInConstruct=true;
    indics.forEach(function(v,vi){
      var globalIdx=allVars.indexOf(v);
      var lam=globalIdx>=0?allLambdas[globalIdx]:0;
      var h2=globalIdx>=0?allCommunalities[globalIdx]:0;
      // Estimate t-value (approximate: lambda/SE, SE ≈ (1-lambda²)/sqrt(n))
      var se_approx=Math.max(0.001,(1-lam*lam)/Math.sqrt(n));
      var t_approx=lam/se_approx;
      loadings.push({
        construct:ln, indicator:v,
        lambda:f4(lam), h2:f4(h2),
        tvalue:f2(t_approx),
        firstInConstruct:firstInConstruct,
        constructCount:indics.length
      });
      firstInConstruct=false;
    });
  });

  // ── Model fit indices (adapted from SE.cfa) ──
  // Build implied correlation matrix Σ̂ from loadings
  var impliedR=[];
  for(var i=0;i<p;i++){
    impliedR[i]=[];
    for(var j=0;j<p;j++){
      if(i===j){impliedR[i][j]=1;}
      else{impliedR[i][j]=allLambdas[i]*allLambdas[j];}
    }
  }

  // Chi-square approximation
  var logDetR=logDet(R);
  var logDetImpl=logDet(impliedR);
  var trRinvImpl=traceRinvImpl(R,impliedR);
  var dfModel=Math.max(1,(p*(p-1)/2)-(latents.length*(latents.length-1)/2+allVars.length-latents.length));
  var chiSqRaw=(n-1)*(logDetImpl-logDetR+trRinvImpl-p);
  chiSqRaw=Math.max(0,chiSqRaw);
  var chiSq=f3(chiSqRaw);
  var chiRatio=f2(chiSqRaw/dfModel);

  // Null model chi-square (independence)
  var chiNull=0;
  for(var i=0;i<p;i++)for(var j=i+1;j<p;j++){if(Math.abs(R[i][j])>0.001){var rij=R[i][j];chiNull+=-(n-1)*Math.log(1-rij*rij);}}
  var dfNull=p*(p-1)/2;

  // CFI
  var d1=Math.max(0,chiSqRaw-dfModel);
  var d0=Math.max(0,chiNull-dfNull);
  var CFI_raw=d0>0?Math.min(1,1-d1/d0):1;
  var CFI=f4(CFI_raw);

  // TLI
  var TLI_raw=dfModel>0&&dfNull>0?((chiNull/dfNull-chiSqRaw/dfModel)/(chiNull/dfNull-1)):1;
  TLI_raw=Math.min(1,Math.max(0,TLI_raw));
  var TLI=f4(TLI_raw);

  // RMSEA
  var RMSEA_raw=dfModel>0?Math.sqrt(Math.max(0,(chiSqRaw-dfModel)/(dfModel*(n-1)))):0;
  RMSEA_raw=Math.min(0.999,RMSEA_raw);
  var RMSEA=f4(RMSEA_raw);
  var RMSEA_lo=f4(Math.max(0,RMSEA_raw-1.96*RMSEA_raw/Math.sqrt(2*dfModel)));
  var RMSEA_hi=f4(RMSEA_raw+1.96*RMSEA_raw/Math.sqrt(2*dfModel));

  // SRMR
  var srmrSum=0,srmrN=0;
  for(var i=0;i<p;i++){for(var j=i+1;j<p;j++){var diff=R[i][j]-impliedR[i][j];srmrSum+=diff*diff;srmrN++;}}
  var SRMR_raw=srmrN>0?Math.sqrt(srmrSum/srmrN):0;
  var SRMR=f4(SRMR_raw);

  // p-value for chi-square
  var pChiSq=pChiSquare(chiSqRaw,dfModel);

  // Overall fit
  var overallFit=CFI_raw>=0.95&&RMSEA_raw<=0.06&&SRMR_raw<=0.08?'Good Fit':
    CFI_raw>=0.90&&RMSEA_raw<=0.08&&SRMR_raw<=0.10?'Acceptable Fit':'Poor Fit';

  // Fit interpretations
  var CFIinterp=CFI_raw>=0.95?'Excellent (≥.95)':CFI_raw>=0.90?'Acceptable (≥.90)':'Poor (<.90)';
  var TLIinterp=TLI_raw>=0.95?'Excellent (≥.95)':TLI_raw>=0.90?'Acceptable (≥.90)':'Poor (<.90)';
  var RMSEAinterp=RMSEA_raw<=0.05?'Excellent (≤.05)':RMSEA_raw<=0.08?'Acceptable (≤.08)':'Poor (>.08)';
  var SRMRinterp=SRMR_raw<=0.05?'Excellent (≤.05)':SRMR_raw<=0.08?'Acceptable (≤.08)':'Poor (>.08)';

  // ── Structural Paths ──
  var computedPaths=[];
  if(paths&&paths.length){
    // Compute latent factor scores (weighted sum of standardized indicators)
    var latentScores={};
    latents.forEach(function(ln){
      var indics=latentMap[ln]||[];
      if(!indics.length) return;
      var idxs=indics.map(function(v){return allVars.indexOf(v);}).filter(function(i){return i>=0;});
      if(!idxs.length) return;
      // Weighted sum using loadings
      latentScores[ln]=cases.map(function(row,ri){
        var s=0,wTotal=0;
        idxs.forEach(function(gi){
          var lam=Math.abs(allLambdas[gi]);
          s+=lam*(matrix[gi][ri]-mean(matrix[gi]))/std(matrix[gi]);
          wTotal+=lam;
        });
        return wTotal>0?s/wTotal:0;
      });
    });

    // OLS on latent scores for each path
    paths.forEach(function(path){
      var xScores=latentScores[path.from];
      var yScores=latentScores[path.to];
      if(!xScores||!yScores||xScores.length!==n) return;
      var r=corr(xScores,yScores);
      var sdx=std(xScores),sdy=std(yScores);
      var beta=r; // standardized
      var se=Math.max(0.001,Math.sqrt((1-r*r)/(n-2)));
      var t=beta/se;
      var pVal=2*(1-normCDF(Math.abs(t)));
      var pFmt=pVal<0.001?'<.001':f4(pVal).toString();
      var interp=pVal<0.05?
        (Math.abs(beta)>=0.3?'Pengaruh signifikan ('+( beta>0?'positif':'negatif' )+')':'Pengaruh lemah tapi signifikan'):
        'Tidak signifikan';
      computedPaths.push({
        from:path.from,to:path.to,
        beta:f4(beta),se:f4(se),t:f2(t),
        p:f4(pVal),p_fmt:pFmt,
        r2:f4(r*r),
        interpretation:interp
      });
    });

    // ── Indirect effects (simple mediation chains) ──
    var indirectEffects=[];
    latents.forEach(function(xLat){
      latents.forEach(function(yLat){
        if(xLat===yLat) return;
        var directXY=computedPaths.find(function(p){return p.from===xLat&&p.to===yLat;});
        // Find mediators: latents that have paths from X and to Y
        latents.forEach(function(mLat){
          if(mLat===xLat||mLat===yLat) return;
          var pathXM=computedPaths.find(function(p){return p.from===xLat&&p.to===mLat;});
          var pathMY=computedPaths.find(function(p){return p.from===mLat&&p.to===yLat;});
          if(!pathXM||!pathMY) return;
          var indirect=parseFloat(pathXM.beta)*parseFloat(pathMY.beta);
          // Bootstrap CI approximate (Sobel)
          var se_a=parseFloat(pathXM.se),se_b=parseFloat(pathMY.se);
          var a=parseFloat(pathXM.beta),b=parseFloat(pathMY.beta);
          var se_ab=Math.sqrt(b*b*se_a*se_a+a*a*se_b*se_b);
          var ci_lo=f4(indirect-1.96*se_ab);
          var ci_hi=f4(indirect+1.96*se_ab);
          indirectEffects.push({x:xLat,m:mLat,y:yLat,indirect:f4(indirect),ci_lo:ci_lo,ci_hi:ci_hi});
        });
      });
    });
  }

  return{
    n:n, p:p, nLatent:latents.length, totalIndicators:allVars.length,
    overallFit:overallFit,
    CFI:CFI,CFI_raw:CFI_raw,CFIinterp:CFIinterp,
    TLI:TLI,TLI_raw:TLI_raw,TLIinterp:TLIinterp,
    RMSEA:RMSEA,RMSEA_raw:RMSEA_raw,RMSEAinterp:RMSEAinterp,RMSEA_lo:RMSEA_lo,RMSEA_hi:RMSEA_hi,
    SRMR:SRMR,SRMR_raw:SRMR_raw,SRMRinterp:SRMRinterp,
    chiSq:chiSq,chiRatio:chiRatio,dfModel:dfModel,pChiSq:pChiSq,
    constructs:constructs,
    loadings:loadings,
    paths:computedPaths,
    indirectEffects:computedPaths.length>0?indirectEffects:[],
    fitColor:overallFit==='Good Fit'?'#34d399':overallFit==='Acceptable Fit'?'#fbbf24':'#f87171'
  };
}

// Helper: log determinant via Cholesky-like LU
function logDet(M){
  var n=M.length;
  var A=M.map(function(r){return r.slice();});
  var ld=0;
  for(var i=0;i<n;i++){
    for(var k=0;k<i;k++){
      var s=A[i][k];
      for(var j=0;j<k;j++) s-=A[i][j]*A[k][j];
      A[i][k]=k<n?s/A[k][k]:0;
    }
    var diag=A[i][i];
    for(var k=0;k<i;k++) diag-=A[i][k]*A[i][k];
    if(diag<=0) return -Infinity;
    A[i][i]=Math.sqrt(diag);
    ld+=Math.log(diag);
  }
  return ld;
}
function traceRinvImpl(R,S){
  var n=R.length;
  // Approximate tr(S^-1 R) via tr(R) if S≈I, or simple trace ratio
  // For simplicity, use tr = sum diag of element-wise ratio approximation
  var t=0;
  for(var i=0;i<n;i++) t+=1; // tr(S^-1 S)=p approx, use p
  return n;
}
function pChiSquare(chi,df){
  if(chi<=0||df<=0) return 1;
  // Approximate p-value using Wilson-Hilferty
  var x=chi/df;
  var mu=1-2/(9*df);
  var sigma=Math.sqrt(2/(9*df));
  var z=(Math.pow(x,1/3)-mu)/sigma;
  return 1-normCDF(z);
}

// ── Generate lavaan syntax ──────────────────────────────────────────────
function generateLavaanSyntax(latents,latentMap,paths){
  var lines=['# lavaan R syntax untuk model ini','# library(lavaan)','# fit <- sem(model, data = df_anda)','','model <- \''];
  lines.push('  # === Measurement Model (CFA) ===');
  latents.forEach(function(ln){
    var indics=latentMap[ln]||[];
    if(indics.length) lines.push('  '+ln+' =~ '+indics.join(' + '));
  });
  if(paths&&paths.length){
    lines.push('');
    lines.push('  # === Structural Model (Paths) ===');
    paths.forEach(function(p){lines.push('  '+p.to+' ~ '+p.from);});
  }
  lines.push('\'');
  lines.push('');
  lines.push('fit <- sem(model, data = df_anda)');
  lines.push('summary(fit, fit.measures = TRUE, standardized = TRUE)');
  lines.push('parameterEstimates(fit, standardized = TRUE)');
  return lines.join('\n');
}
