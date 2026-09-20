// - Power Analysis (computation) -
// Normal distribution utilities
function normCDFpw(z){return SE.normCDF(z);}
function normInvpw(p){return SE.normInv(p);}

// Non-central t approximation for power
function powerFromNcpT(delta,df,tCrit){
  // P(|T| > tCrit | ncp=delta) using normal approximation for moderate df
  if(df>200){
    var z=tCrit-delta;
    return normCDFpw(-tCrit+delta)+normCDFpw(-tCrit-delta);
  }
  // Use Owen's T-function approximation: power = 1 - beta
  // For practical purposes, use normal approximation adjusted for df
  var correction=1+0.5/(df+1);
  var z=(tCrit/correction);
  return normCDFpw(delta-z)+normCDFpw(-delta-z);
}

// Non-central F approximation
function powerFromNcpF(ncp,df1,df2,fCrit){
  // Normal approx: z-score from ncp and df
  var mu=df1+ncp, variance2=2*(df1+2*ncp)+(2*df1*df1/df2);
  var z=(fCrit*df1-mu)/Math.sqrt(Math.max(variance2,0.001));
  return normCDFpw(-z);
}

function computePower(test,alpha,power,effect,groups,tails,solve,nInput){
  groups=groups||2; tails=tails||2; nInput=nInput||30;
  var zAlpha=tails===1?normInvpw(1-alpha):normInvpw(1-alpha/2);
  var zBeta=normInvpw(power||0.80);

  function solveN_ttest(d,al,pw,tl){
    var za=tl===1?normInvpw(1-al):normInvpw(1-al/2);
    var zb=normInvpw(pw);
    var n=Math.ceil(2*Math.pow((za+zb)/d,2));
    return Math.max(3,n);
  }
  function solvePower_ttest(d,al,n,tl){
    var za=tl===1?normInvpw(1-al):normInvpw(1-al/2);
    var tCrit=za;// approx
    var delta=d*Math.sqrt(n/2);
    var pwr=normCDFpw(delta-tCrit)+normCDFpw(-delta-tCrit);
    return Math.min(0.9999,Math.max(0.001,pwr));
  }
  function solveEffect_ttest(al,pw,n,tl){
    var za=tl===1?normInvpw(1-al):normInvpw(1-al/2);
    var zb=normInvpw(pw);
    return (za+zb)/Math.sqrt(n/2);
  }
  function solveN_anova(f,al,pw,g){
    // Using F-test for one-way ANOVA
    var lam0=0,lam1=100,tol=0.001;
    // N per group
    for(var iter=0;iter<60;iter++){
      var nMid=Math.ceil((lam0+lam1)/2);
      var pwr2=solvePower_anova(f,al,nMid,g);
      if(pwr2<pw) lam0=nMid; else lam1=nMid;
      if(lam1-lam0<=1) break;
    }
    return Math.max(3,lam1);
  }
  function solvePower_anova(f,al,n,g){
    var dfB=g-1,dfW=g*(n-1);
    var ncp=f*f*g*n; // ncp = f²·N
    var fCrit=SE.fInv(1-al,dfB,dfW)||SE.fCritApprox(1-al,dfB,dfW)||3;
    return powerFromNcpF(ncp,dfB,dfW,fCrit);
  }
  function solveN_corr(r,al,pw,tl){
    var zr=0.5*Math.log((1+r)/(1-r));
    var za=tl===1?normInvpw(1-al):normInvpw(1-al/2);
    var zb=normInvpw(pw);
    return Math.max(3,Math.ceil(Math.pow((za+zb)/zr,2)+3));
  }
  function solvePower_corr(r,al,n,tl){
    var zr=0.5*Math.log((1+r)/(1-r));
    var za=tl===1?normInvpw(1-al):normInvpw(1-al/2);
    var se=1/Math.sqrt(n-3);
    return normCDFpw((Math.abs(zr)-za*se)/se);
  }
  function solveN_chisq(w,al,df2){
    df2=df2||1;
    var lo=3,hi=10000;
    for(var i=0;i<50;i++){var mid=Math.ceil((lo+hi)/2);if(solvePower_chisq(w,al,mid,df2)<(power||0.80))lo=mid;else hi=mid;}
    return Math.max(3,hi);
  }
  function solvePower_chisq(w,al,n,df2){
    df2=df2||1;
    var ncp=n*w*w;
    var chiCrit=SE.chiCritApprox(1-al,df2)||3.84;
    // Power using normal approx of non-central chi2
    var mu=df2+ncp, v=2*(df2+2*ncp);
    var z=(chiCrit-mu)/Math.sqrt(v);
    return normCDFpw(-z);
  }

  var n,pwr,eff,tot,interp,effInterp;

  if(test==='ttest_2samp'||test==='ttest_1samp'||test==='ttest_paired'){
    var nFactor=test==='ttest_2samp'?2:1;
    if(solve==='n'){
      if(!effect||effect<=0) throw new Error('Effect size must be > 0');
      n=solveN_ttest(Math.abs(effect),alpha,power,tails);
      pwr=solvePower_ttest(Math.abs(effect),alpha,n,tails);
      eff=effect;
    } else if(solve==='power'){
      if(!nInput||nInput<3) throw new Error('N must be ≥ 3');
      n=nInput;
      pwr=solvePower_ttest(Math.abs(effect||0.5),alpha,n,tails);
      eff=effect||0.5;
    } else if(solve==='effect'){
      n=nInput;
      eff=solveEffect_ttest(alpha,power,n,tails);
      pwr=power;
    } else if(solve==='alpha'){
      n=nInput; eff=effect||0.5;
      // Solve alpha numerically
      var lo=0.0001,hi=0.5;
      for(var i=0;i<50;i++){var mid=(lo+hi)/2;if(solvePower_ttest(Math.abs(eff),mid,n,tails)<power)hi=mid;else lo=mid;}
      alpha=lo; pwr=power;
    }
    tot=nFactor===2?n*2:n;
    interp=pwr>=0.9?'Excellent power':pwr>=0.8?'Adequate power (meets 0.80 threshold)':pwr>=0.7?'Marginal power':' Underpowered';
    effInterp=Math.abs(eff||0)<0.2?'Negligible':Math.abs(eff||0)<0.5?'Small':Math.abs(eff||0)<0.8?'Medium':'Large';
  }
  else if(test==='anova_oneway'){
    if(solve==='n'){
      if(!effect||effect<=0) throw new Error('Effect size f must be > 0');
      n=solveN_anova(Math.abs(effect),alpha,power,groups);
      pwr=solvePower_anova(Math.abs(effect),alpha,n,groups);
      eff=effect;
    } else if(solve==='power'){
      n=nInput; eff=effect||0.25;
      pwr=solvePower_anova(Math.abs(eff),alpha,n,groups);
    } else if(solve==='effect'){
      n=nInput; pwr=power;
      var lo=0.01,hi=3;
      for(var i=0;i<60;i++){var mid=(lo+hi)/2;if(solvePower_anova(mid,alpha,n,groups)<power)lo=mid;else hi=mid;}
      eff=lo; pwr=solvePower_anova(eff,alpha,n,groups);
    }
    tot=n*groups;
    interp=pwr>=0.9?'Excellent power':pwr>=0.8?'Adequate power':pwr>=0.7?'Marginal power':' Underpowered';
    effInterp=Math.abs(eff||0)<0.1?'Negligible':Math.abs(eff||0)<0.25?'Small':Math.abs(eff||0)<0.4?'Medium':'Large';
  }
  else if(test==='correlation'){
    if(solve==='n'){
      if(!effect||Math.abs(effect)>=1) throw new Error('r must be between -1 and 1');
      n=solveN_corr(Math.abs(effect),alpha,power,tails);
      pwr=solvePower_corr(Math.abs(effect),alpha,n,tails);
      eff=effect;
    } else if(solve==='power'){
      n=nInput; eff=effect||0.3;
      pwr=solvePower_corr(Math.abs(eff),alpha,n,tails);
    } else if(solve==='effect'){
      n=nInput; pwr=power;
      var lo=0.01,hi=0.99;
      for(var i=0;i<60;i++){var mid=(lo+hi)/2;if(solvePower_corr(mid,alpha,n,tails)<power)lo=mid;else hi=mid;}
      eff=lo; pwr=solvePower_corr(eff,alpha,n,tails);
    }
    tot=n;
    interp=pwr>=0.9?'Excellent power':pwr>=0.8?'Adequate power':pwr>=0.7?'Marginal power':' Underpowered';
    effInterp=Math.abs(eff||0)<0.1?'Negligible':Math.abs(eff||0)<0.3?'Small':Math.abs(eff||0)<0.5?'Medium':'Large';
  }
  else if(test==='regression_r2'){
    // f² = R²/(1-R²)
    if(solve==='n'){
      if(!effect||effect<=0) throw new Error('Cohen\'s f² must be > 0');
      // f² for regression: n = (zα+zβ)²/f² + u + 1 (u = number of predictors, approx 1)
      var u=1;
      n=Math.ceil(Math.pow((zAlpha+zBeta),2)/effect+u+1);
      pwr=power; eff=effect;
    } else if(solve==='power'){
      n=nInput; eff=effect||0.15;
      var u2=1;
      var ncp=eff*n; var df1=u2,df2=n-u2-1;
      var fCrit=SE.fCritApprox(1-alpha,df1,df2)||3.84;
      pwr=powerFromNcpF(ncp,df1,df2,fCrit);
    } else if(solve==='effect'){
      n=nInput; pwr=power;
      eff=Math.pow((zAlpha+zBeta),2)/n;
    }
    tot=n;
    interp=pwr>=0.9?'Excellent power':pwr>=0.8?'Adequate power':pwr>=0.7?'Marginal power':' Underpowered';
    effInterp=Math.abs(eff||0)<0.02?'Negligible':Math.abs(eff||0)<0.15?'Small':Math.abs(eff||0)<0.35?'Medium':'Large';
  }
  else if(test==='chisq'){
    if(solve==='n'){
      if(!effect||effect<=0) throw new Error('Cohen\'s w must be > 0');
      n=solveN_chisq(Math.abs(effect),alpha,1);
      pwr=solvePower_chisq(Math.abs(effect),alpha,n,1);
      eff=effect;
    } else if(solve==='power'){
      n=nInput; eff=effect||0.3;
      pwr=solvePower_chisq(Math.abs(eff),alpha,n,1);
    } else if(solve==='effect'){
      n=nInput; pwr=power;
      var lo=0.01,hi=2;
      for(var i=0;i<60;i++){var mid=(lo+hi)/2;if(solvePower_chisq(mid,alpha,n,1)<power)lo=mid;else hi=mid;}
      eff=lo; pwr=solvePower_chisq(eff,alpha,n,1);
    }
    tot=n; groups=1;
    interp=pwr>=0.9?'Excellent power':pwr>=0.8?'Adequate power':pwr>=0.7?'Marginal power':' Underpowered';
    effInterp=Math.abs(eff||0)<0.1?'Negligible':Math.abs(eff||0)<0.3?'Small':Math.abs(eff||0)<0.5?'Medium':'Large';
  }
  else throw new Error('Unknown test type');

  pwr=Math.min(0.9999,Math.max(0.0001,pwr||0));
  var testLabels2={'ttest_2samp':'Independent T-Test','ttest_1samp':'One-Sample T-Test','ttest_paired':'Paired T-Test','anova_oneway':'One-Way ANOVA','correlation':'Correlation','regression_r2':'Multiple Regression','chisq':'Chi-Square'};
  var interpretation='Test: '+testLabels2[test]+'. '+
    (solve==='n'?'To detect '+effectLabels2(test)+' = '+SE.f4(eff||0)+' with power = '+SE.f4((pwr||0)*100)+'% and α = '+alpha+', you need N = '+n+(groups>1?' per group ('+tot+' total)':'')+'.':(solve==='power'?'With N = '+n+(groups>1?' per group':'')+' and effect = '+SE.f4(eff||0)+', achieved power = '+SE.f4((pwr||0)*100)+'%.':
    'Minimum detectable effect: '+SE.f4(eff||0)+'.'))+' '+interp+'.';

  return {n:n||nInput, power:pwr, alpha:alpha, effect:eff, totalN:tot, groups:groups, powerInterp:interp, effectInterp:effInterp, interpretation:interpretation, solved:solve};
}

function effectLabels2(test){
  var m={'ttest_2samp':"Cohen's d",'ttest_1samp':"Cohen's d",'ttest_paired':"Cohen's dz",'anova_oneway':"Cohen's f",'correlation':'r','regression_r2':"f²",'chisq':'w'};
  return m[test]||'effect';
}
