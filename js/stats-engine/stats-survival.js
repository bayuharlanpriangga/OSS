//Survival Analysis computation — Kaplan-Meier estimator
function computeKaplanMeier(dataArr,timeVar,eventVar,groupVar){
  var cases=dataArr.filter(function(r){return SE.isV(r[timeVar])&&!isMiss(r[eventVar])&&Number(r[timeVar])>=0;});
  var n=cases.length;
  if(n<3) throw new Error('Need ≥3 cases with valid time and event');

  var groupKeys=groupVar?[...new Set(cases.map(function(r){return String(r[groupVar]);}))].sort():['All'];

  function kmForGroup(rows){
    var sorted=rows.map(function(r){return {t:Number(r[timeVar]),e:Number(r[eventVar])===1?1:0};})
      .sort(function(a,b){return a.t-b.t;});
    var steps=[],S=1,atRisk=rows.length;
    var times=[...new Set(sorted.map(function(s){return s.t;}))].sort(function(a,b){return a-b;});
    times.forEach(function(t){
      var events=sorted.filter(function(s){return s.t===t&&s.e===1;}).length;
      var censored=sorted.filter(function(s){return s.t===t&&s.e===0;}).length;
      if(events>0){
        var q=(atRisk-events)/atRisk;
        S=S*q;
        // Greenwood SE
        var greenwood=steps.reduce(function(sum,s){return sum+(s.events/(s.atRisk*(s.atRisk-s.events))||0);},0)+events/(atRisk*(atRisk-events)||1);
        var se=S*Math.sqrt(greenwood);
        steps.push({t:t,S:S,se:se,events:events,censored:censored,atRisk:atRisk,
          ci_lo:Math.max(0,S-1.96*se),ci_hi:Math.min(1,S+1.96*se)});
      } else {
        steps.push({t:t,S:S,se:0,events:0,censored:censored,atRisk:atRisk});
      }
      atRisk-=(events+censored);
    });
    // Median survival: first time S<=0.5
    var med=null;
    for(var i=0;i<steps.length;i++){if(steps[i].S<=0.5){med=steps[i].t;break;}}
    var totalEvents=sorted.filter(function(s){return s.e===1;}).length;
    return{steps:steps,median:med,events:totalEvents,n:rows.length};
  }

  var groups=groupKeys.map(function(g){
    var rows=groupVar?cases.filter(function(r){return String(r[groupVar])===g;}):cases;
    var km=kmForGroup(rows);
    return{label:g,steps:km.steps,medianSurv:km.median,events:km.events,n:km.n,oe:0};
  });

  // Log-rank test (Mantel-Haenszel)
  var logrank={chi2:0,df:0,p:1,p_fmt:'1.000',interpretation:'',observed:[],expected:[]};
  if(groups.length>=2){
    var allTimes=[...new Set(cases.filter(function(r){return Number(r[eventVar])===1;}).map(function(r){return Number(r[timeVar]);}))].sort(function(a,b){return a-b;});
    var O=[],E=[];
    groups.forEach(function(){O.push(0);E.push(0);});
    allTimes.forEach(function(t){
      var nj=groups.map(function(g){return g.steps.length?g.n-g.steps.filter(function(s){return s.t<t;}).reduce(function(sum,s){return sum+s.events+s.censored;},0):g.n;});
      var dj=groups.map(function(g){return g.steps.filter(function(s){return s.t===t;}).reduce(function(sum,s){return sum+s.events;},0);});
      var Nj=nj.reduce(function(s,v){return s+v;},0);
      var Dj=dj.reduce(function(s,v){return s+v;},0);
      if(Nj>0&&Dj>0){
        groups.forEach(function(_,gi){O[gi]+=dj[gi];E[gi]+=Nj>0?nj[gi]*Dj/Nj:0;});
      }
    });
    // Mantel-Cox chi2 = Σ(Oi-Ei)²/Ei
    var chi2=0;
    groups.forEach(function(_,gi){if(E[gi]>0)chi2+=Math.pow(O[gi]-E[gi],2)/E[gi];});
    chi2=Math.max(0,chi2);
    var df=groups.length-1;
    var p=1-SE.chi2CDF(chi2,df);
    groups.forEach(function(g,gi){g.oe=SE.f4((O[gi]-E[gi])||0);});
    logrank={chi2:SE.f4(chi2),df:df,p:SE.f4(p),p_fmt:SE.pFmt(p),
      interpretation:'Log-rank χ²('+df+')='+SE.f4(chi2)+', p='+SE.pFmt(p)+'. '+(p<0.05?'Significant difference in survival between groups (p<0.05).':'No significant difference in survival between groups (p≥0.05).')};
  }

  return{n:n,groups:groups,logrank:logrank,timeVar:timeVar,eventVar:eventVar,groupVar:groupVar};
}

function computeCoxRegression(dataArr,timeVar,eventVar,covariates){
  var cases=dataArr.filter(function(r){
    if(!SE.isV(r[timeVar])||isMiss(r[eventVar])) return false;
    return covariates.every(function(c){return SE.isV(r[c]);});
  });
  var n=cases.length;
  if(n<covariates.length+5) throw new Error('Need more cases than covariates');
  var times=cases.map(function(r){return Number(r[timeVar]);});
  var events=cases.map(function(r){return Number(r[eventVar])===1?1:0;});
  var totalEvents=events.reduce(function(s,v){return s+v;},0);
  if(totalEvents<5) throw new Error('Need ≥5 events for Cox regression');
  var p=covariates.length;

  // Standardize covariates for numerical stability
  var means=covariates.map(function(c){return SE.mean(cases.map(function(r){return Number(r[c]);}));});
  var sds=covariates.map(function(c,i){return SE.std(cases.map(function(r){return Number(r[c]);}))||1;});
  var X=cases.map(function(r){return covariates.map(function(c,i){return (Number(r[c])-means[i])/sds[i];});});

  // Log partial likelihood pada beta b (dipakai step-halving di bawah)
  function coxLL(b){
    var ord=times.map(function(t,i){return i;}).sort(function(a,c){return times[a]-times[c];});
    var v=0;
    ord.forEach(function(i){
      if(events[i]!==1) return;
      var t=times[i],S0=0;
      ord.forEach(function(j){if(times[j]>=t) S0+=Math.exp(X[j].reduce(function(s,x,k){return s+x*b[k];},0));});
      if(S0<=0) return;
      v+=X[i].reduce(function(s,x,k){return s+x*b[k];},0)-Math.log(S0);
    });
    return v;
  }

  // Newton-Raphson for partial likelihood
  var beta=new Array(p).fill(0);
  for(var iter=0;iter<25;iter++){
    var grad=new Array(p).fill(0);
    var hess=[];for(var a=0;a<p;a++){hess.push(new Array(p).fill(0));}
    // Sort by time
    var order=times.map(function(t,i){return i;}).sort(function(a,b){return times[a]-times[b];});
    var ll=0;
    order.forEach(function(i){
      if(events[i]!==1) return;
      var t=times[i];
      var xi=X[i];
      var xiBeta=xi.reduce(function(s,x,j){return s+x*beta[j];},0);
      // Risk set at time t
      var riskSet=order.filter(function(j){return times[j]>=t;});
      var expBetas=riskSet.map(function(j){return Math.exp(X[j].reduce(function(s,x,k){return s+x*beta[k];},0));});
      var S0=expBetas.reduce(function(s,v){return s+v;},0);
      if(S0<=0) return;
      var S1=covariates.map(function(_,k){return riskSet.reduce(function(s,j,ri){return s+X[j][k]*expBetas[ri];},0);});
      var S2=[];for(var a=0;a<p;a++){S2.push([]);for(var b=0;b<p;b++){S2[a].push(riskSet.reduce(function(s,j,ri){return s+X[j][a]*X[j][b]*expBetas[ri];},0));}}
      ll+=xiBeta-Math.log(S0);
      for(var k=0;k<p;k++){grad[k]+=xi[k]-S1[k]/S0;}
      for(var a=0;a<p;a++){for(var b=0;b<p;b++){hess[a][b]-=S2[a][b]/S0-S1[a]*S1[b]/(S0*S0);}}
    });
    // Newton step
    var flat=[];hess.forEach(function(row){row.forEach(function(v){flat.push(v);});});
    var inv; try{inv=SE.matInvFlat?SE.matInvFlat(flat,p):null;}catch(e){break;}
    if(!inv) break;
    var step=[];for(var a=0;a<p;a++){var s=0;for(var b=0;b<p;b++)s+=inv[a*p+b]*grad[b];step.push(s);}
    var maxStep=Math.max.apply(null,step.map(Math.abs));
    if(maxStep>1) step=step.map(function(s){return s/maxStep;});
    // hess = turunan kedua log-likelihood (negatif-definit), jadi step = H⁻¹·g dan
    // langkah Newton untuk MAKSIMASI adalah beta − step (bukan beta + step).
    // Step-halving: kecilkan langkah sampai log-likelihood tidak turun.
    var stepScale=1,trial=null,llTrial=-Infinity,accepted=false;
    for(var hlv=0;hlv<15;hlv++){
      trial=beta.map(function(b2,i){return b2-stepScale*step[i];});
      llTrial=coxLL(trial);
      if(isFinite(llTrial)&&llTrial>=ll-1e-10){accepted=true;break;}
      stepScale/=2;
    }
    if(!accepted) break;
    beta=trial;
    if(step.reduce(function(s,v){return s+v*v;},0)*stepScale*stepScale<1e-8) break;
  }

  // SEs from Hessian inverse
  var finalHess=[];for(var a=0;a<p;a++){finalHess.push(new Array(p).fill(0));}
  var order2=times.map(function(t,i){return i;}).sort(function(a,b){return times[a]-times[b];});
  order2.forEach(function(i){
    if(events[i]!==1) return;
    var t=times[i];
    var riskSet=order2.filter(function(j){return times[j]>=t;});
    var expBetas=riskSet.map(function(j){return Math.exp(X[j].reduce(function(s,x,k){return s+x*beta[k];},0));});
    var S0=expBetas.reduce(function(s,v){return s+v;},0)||1;
    var S1=covariates.map(function(_,k){return riskSet.reduce(function(s,j,ri){return s+X[j][k]*expBetas[ri];},0);});
    var S2=[];for(var a=0;a<p;a++){S2.push([]);for(var b=0;b<p;b++){S2[a].push(riskSet.reduce(function(s,j,ri){return s+X[j][a]*X[j][b]*expBetas[ri];},0));}}
    for(var a=0;a<p;a++){for(var b=0;b<p;b++){finalHess[a][b]+=S2[a][b]/S0-S1[a]*S1[b]/(S0*S0);}}
  });
  var flatH=[];finalHess.forEach(function(row){row.forEach(function(v){flatH.push(v);});});
  var invH;try{invH=SE.matInvFlat?SE.matInvFlat(flatH,p):null;}catch(e){invH=null;}
  var ses=covariates.map(function(_,i){return invH?Math.sqrt(Math.max(0,invH[i*p+i])):0.1;});

  // Back-transform betas to original scale
  var betaOrig=beta.map(function(b2,i){return b2/sds[i];});
  var sesOrig=ses.map(function(se,i){return se/sds[i];});

  var z95=SE.normInv(0.975);
  var coefs=covariates.map(function(c,i){
    var b=betaOrig[i],se=sesOrig[i];
    var z=se>0?b/se:0;
    var p2=2*(1-SE.normCDF(Math.abs(z)));
    var HR=Math.exp(b);
    return{name:c,beta:SE.f4(b),se:SE.f4(se),HR:SE.f4(HR),
      ci95:'['+SE.f4(Math.exp(b-z95*se))+', '+SE.f4(Math.exp(b+z95*se))+']',
      z:SE.f4(z),p:SE.f4(p2),p_fmt:SE.pFmt(p2)};
  });

  // Concordance index (Harrell's C)
  var concordPairs=0,totalPairs=0;
  for(var i=0;i<n;i++){for(var j=i+1;j<n;j++){
    if(events[i]===1&&times[i]<times[j]||events[j]===1&&times[j]<times[i]){
      var lpi=X[i].reduce(function(s,x,k){return s+x*beta[k];},0);
      var lpj=X[j].reduce(function(s,x,k){return s+x*beta[k];},0);
      totalPairs++;
      if((events[i]===1&&times[i]<times[j]&&lpi>lpj)||(events[j]===1&&times[j]<times[i]&&lpj>lpi)) concordPairs++;
    }
  }}
  var C=totalPairs>0?concordPairs/totalPairs:0.5;

  // LR test
  var nullLL=0,fullLL=0;
  order2.forEach(function(i){
    if(events[i]!==1) return;
    var riskSet=order2.filter(function(j){return times[j]>=times[i];});
    var S0full=riskSet.reduce(function(s,j){return s+Math.exp(X[j].reduce(function(ss,x,k){return ss+x*beta[k];},0));},0);
    fullLL+=X[i].reduce(function(s,x,k){return s+x*beta[k];},0)-Math.log(S0full||1);
    nullLL-=Math.log(riskSet.length||1);
  });
  var lrChi2=2*(fullLL-nullLL);
  var lrP=1-SE.chi2CDF(lrChi2,p);

  return{n:n,events:totalEvents,coefs:coefs,concordance:SE.f4(C),
    lrChi2:SE.f4(lrChi2),lrP_fmt:SE.pFmt(lrP),covariates:covariates,
    timeVar:timeVar,eventVar:eventVar};
}
