// Moderation Analysis computation
function computeModeration(xName,wName,yName,covNames,center){
  covNames=covNames||[];
  var cases=data.filter(function(r){
    if(!SE.isV(r[xName])||!SE.isV(r[wName])||!SE.isV(r[yName])) return false;
    return covNames.every(function(c){return SE.isV(r[c]);});
  });
  var n=cases.length;
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
  var _ct=typeof ossChartTheme==='function'?ossChartTheme():{ice:'#4F7A99',goldText:'#7A5C00',warn:'#A8530E'};
  var wLevels=[{val:wMean-wSD,label:'W − 1SD',color:_ct.ice},{val:wMean,label:'W Mean',color:_ct.goldText},{val:wMean+wSD,label:'W + 1SD',color:_ct.warn}];
  var b1=fullRes.beta[1],b3_int=fullRes.beta[3];
  var simpleSlopes=wLevels.map(function(wl){
    var wVal=center?(wl.val-wMean):wl.val;
    var slope=b1+b3_int*wVal;
    var se_slope=Math.sqrt(Math.max(0.0001,fullRes.ses[1]*fullRes.ses[1]+wVal*wVal*fullRes.ses[3]*fullRes.ses[3]));
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
  var jnPoints=[];
  var jnSteps=200;
  for(var ji=0;ji<=jnSteps;ji++){
    var wj=wRange[0]+ji*(wRange[1]-wRange[0])/jnSteps;
    var wjC=center?wj-wMean:wj;
    var slopeJ=b1+b3_int*wjC;
    var seJ=Math.sqrt(Math.max(0.0001,fullRes.ses[1]*fullRes.ses[1]+wjC*wjC*fullRes.ses[3]*fullRes.ses[3]));
    var tJ=seJ>0?slopeJ/seJ:0;
    var pJ=SE.tP(Math.abs(tJ),fullRes.dfE);
    if(ji>0){
      var prevWj=wRange[0]+(ji-1)*(wRange[1]-wRange[0])/jnSteps;
      var prevWjC=center?prevWj-wMean:prevWj;
      var prevSlope=b1+b3_int*prevWjC;
      var prevSe=Math.sqrt(Math.max(0.0001,fullRes.ses[1]*fullRes.ses[1]+prevWjC*prevWjC*fullRes.ses[3]*fullRes.ses[3]));
      var prevT=prevSe>0?prevSlope/prevSe:0;
      var prevP=SE.tP(Math.abs(prevT),fullRes.dfE);
      if((prevP-0.05)*(pJ-0.05)<0){
        var wCross=prevWj+(wj-prevWj)*((prevP-0.05)/((prevP-0.05)-(pJ-0.05)));
        var crossPct=wVals.filter(function(v){return v>=wCross;}).length/wVals.length*100;
        var crossDir=slopeJ>0?'W > '+SE.f4(wCross):'W < '+SE.f4(wCross);
        jnPoints.push({value:wCross,pct:SE.f4(crossPct),direction:crossDir});
      }
    }
  }
  // Calculate % of dataset in significant region
  var sigCount=0;
  wVals.forEach(function(wv){
    var wvC=center?wv-wMean:wv;
    var sl=b1+b3_int*wvC;
    var se2=Math.sqrt(Math.max(0.0001,fullRes.ses[1]*fullRes.ses[1]+wvC*wvC*fullRes.ses[3]*fullRes.ses[3]));
    var tv=se2>0?sl/se2:0;
    var pv=SE.tP(Math.abs(tv),fullRes.dfE);
    if(pv<0.05) sigCount++;
  });
  var pctSig=SE.f4(sigCount/Math.max(1,wVals.length)*100);

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
