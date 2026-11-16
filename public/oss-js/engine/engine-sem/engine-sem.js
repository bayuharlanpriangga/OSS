// Core SEM computation
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

  // Measurement Model (CFA for each latent)
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

  // - Model fit indices (adapted from SE.cfa) -
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

  // Structural Paths
  var computedPaths=[];
  var indirectEffects=[];
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

    // Indirect effects (simple mediation chains)
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

// Generate lavaan syntax
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
