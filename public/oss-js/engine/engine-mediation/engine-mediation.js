// Core mediation computation
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
