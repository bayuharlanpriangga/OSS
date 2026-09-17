// TIME SERIES ENGINE 
function tsACF(y, maxLag){
  var n=y.length, mu=SE.mean(y);
  var denom=y.reduce(function(s,v){return s+(v-mu)*(v-mu);},0)/n;
  var acf=[];
  for(var k=0;k<=maxLag;k++){
    var num=0;
    for(var i=0;i<n-k;i++) num+=(y[i]-mu)*(y[i+k]-mu);
    acf.push(denom>0?(num/n)/denom:0);
  }
  return acf;
}

function tsPACF(y, maxLag){
  var acf=tsACF(y,maxLag+1);
  var pacf=[1],phi={};
  phi[1]=[acf[1]];
  pacf.push(acf[1]);
  for(var k=2;k<=maxLag;k++){
    var num=acf[k];
    for(var j=1;j<k;j++) num-=phi[k-1][j-1]*acf[k-j];
    var den=1;
    for(var j=1;j<k;j++) den-=phi[k-1][j-1]*acf[j];
    var pk=den!==0?num/den:0;
    pacf.push(pk);
    phi[k]=[];
    phi[k][k-1]=pk;
    for(var j=1;j<k;j++) phi[k][j-1]=phi[k-1][j-1]-pk*phi[k-1][k-1-j];
  }
  return pacf.slice(1);
}

function tsDiff(y, d){
  var s=y.slice();
  for(var i=0;i<d;i++){
    var t=[];
    for(var j=1;j<s.length;j++) t.push(s[j]-s[j-1]);
    s=t;
  }
  return s;
}

function tsARIMA(y, p, d, q){
  if(y.length < p+d+q+5) throw new Error('N terlalu kecil untuk ARIMA('+p+','+d+','+q+')');
  var yd = tsDiff(y, d);
  var n  = yd.length;
  var mu = SE.mean(yd);
  var arCoefs = new Array(p).fill(0);
  if(p>0){
    var acfYW=tsACF(yd,p);
    var R=[],r=[];
    for(var i=0;i<p;i++){r.push(acfYW[i+1]);var row=[];for(var j=0;j<p;j++)row.push(acfYW[Math.abs(i-j)]);R.push(row);}
    var M=R.map(function(row,i){return row.slice().concat([r[i]]);});
    for(var col=0;col<p;col++){
      var pivot=M[col][col]; if(Math.abs(pivot)<1e-14) continue;
      for(var row=0;row<p;row++){
        if(row===col) continue;
        var f=M[row][col]/pivot;
        for(var k=0;k<=p;k++) M[row][k]-=f*M[col][k];
      }
    }
    arCoefs=M.map(function(row,i){return M[i][i]!==0?row[p]/M[i][i]:0;});
  }
  var res=[];
  for(var i=p;i<n;i++){
    var yhat=mu;
    for(var j=0;j<p;j++) yhat+=arCoefs[j]*(yd[i-1-j]-mu);
    res.push(yd[i]-yhat);
  }
  var maCoefs=new Array(q).fill(0);
  if(q>0 && res.length>q){
    var acfR=tsACF(res,q);
    for(var i=0;i<q;i++) maCoefs[i]=acfR[i+1];
  }
  var fitted=[],resid=[];
  for(var i=p;i<n;i++){
    var yhat=mu;
    for(var j=0;j<p;j++) yhat+=arCoefs[j]*(yd[i-1-j]-mu);
    for(var j=0;j<q;j++){var ri=i-p-j-1;if(ri>=0&&ri<res.length)yhat+=maCoefs[j]*res[ri];}
    fitted.push(yhat);
    resid.push(yd[i]-yhat);
  }
  var sse=resid.reduce(function(s,v){return s+v*v;},0);
  var sigmasq=resid.length>p+q+1?sse/(resid.length-p-q-1):NaN;
  var aic=resid.length>0?resid.length*Math.log(sse/resid.length)+2*(p+q+1):NaN;
  var bic=resid.length>0?resid.length*Math.log(sse/resid.length)+(p+q+1)*Math.log(resid.length):NaN;
  var lastYd=yd.slice(-Math.max(p,1));
  var fc_yd=mu;
  for(var j=0;j<p;j++) if(lastYd[lastYd.length-1-j]!==undefined) fc_yd+=arCoefs[j]*(lastYd[lastYd.length-1-j]-mu);
  var fc=fc_yd;
  if(d===1) fc=y[y.length-1]+fc_yd;
  else if(d===2) fc=2*y[y.length-1]-y[y.length-2]+fc_yd;
  var se_fc=Math.sqrt(sigmasq||0);
  var origFitted=fitted.map(function(f,i){
    if(d===0) return f;
    var base=(i+p+d-1)<y.length?y[i+p+d-1]:y[y.length-1];
    return base+f;
  });
  return {
    p,d,q,n:y.length,nd:n,mu:SE.f4(mu),
    arCoefs:arCoefs.map(SE.f4),maCoefs:maCoefs.map(SE.f4),
    sse:SE.f4(sse),sigma:SE.f4(Math.sqrt(sigmasq||0)),
    aic:SE.f4(aic),bic:SE.f4(bic),
    resid,fitted,origFitted,ydArr:yd,
    forecast:SE.f4(fc),se_fc:SE.f4(se_fc),
    fc_lo95:SE.f4(fc-1.96*se_fc),fc_hi95:SE.f4(fc+1.96*se_fc),
    acf:tsACF(yd,Math.min(20,Math.floor(n/4))),
    pacf:tsPACF(yd,Math.min(15,Math.floor(n/4))),
    residACF:tsACF(resid,Math.min(20,Math.floor(resid.length/4)))
  };
}

function tsDecomp(y, period, type){
  var n=y.length;
  if(n < period*2) throw new Error('N terlalu kecil untuk decomposition (butuh ≥ '+period*2+' obs)');
  var trend=new Array(n).fill(NaN);
  var half=Math.floor(period/2);
  for(var i=half;i<n-half;i++){
    var s=0,cnt=0;
    for(var j=-half;j<=half;j++){s+=y[i+j];cnt++;}
    trend[i]=s/cnt;
  }
  var sIdx=new Array(period).fill(0), sCount=new Array(period).fill(0);
  for(var i=half;i<n-half;i++){
    var pos=i%period;
    var ratio=type==='multiplicative'?(trend[i]!==0?y[i]/trend[i]:NaN):(y[i]-trend[i]);
    if(isFinite(ratio)){sIdx[pos]+=ratio;sCount[pos]++;}
  }
  var sAdj=sIdx.map(function(s,i){return sCount[i]>0?s/sCount[i]:0;});
  if(type==='multiplicative'){
    var smean=sAdj.reduce(function(a,b){return a+b;},0)/period;
    sAdj=sAdj.map(function(v){return smean!==0?v/smean:v;});
  } else {
    var ssum=sAdj.reduce(function(a,b){return a+b;},0)/period;
    sAdj=sAdj.map(function(v){return v-ssum;});
  }
  var seasonal=new Array(n).fill(NaN);
  for(var i=0;i<n;i++) seasonal[i]=sAdj[i%period];
  var remainder=new Array(n).fill(NaN);
  for(var i=half;i<n-half;i++){
    if(type==='multiplicative') remainder[i]=(seasonal[i]!==0&&trend[i]!==0)?y[i]/(trend[i]*seasonal[i]):NaN;
    else remainder[i]=y[i]-trend[i]-seasonal[i];
  }
  var remValid=remainder.filter(function(v){return isFinite(v);});
  var yValid=y.filter(function(v){return isFinite(v);});
  var strengthNum=SE.vari(remValid);
  var strengthDen=SE.vari(yValid)||1;
  var strength=1-(strengthNum/strengthDen);
  return {
    n,period,type,trend,seasonal,remainder,sAdj,
    sse:SE.f4(remValid.reduce(function(s,v){return s+v*v;},0)),
    strength:SE.f4(Math.max(0,Math.min(1,strength)))
  };
}
