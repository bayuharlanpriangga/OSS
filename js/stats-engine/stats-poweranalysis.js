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

// ── Distribusi eksak untuk power (mandiri — tidak bergantung pada SE.fInv/fCritApprox) ──
// Non-central F / chi-square = campuran Poisson dari CDF pusat (Patnaik/Johnson-Kotz):
//   P(F' <= x) = Σ_j Pois(j; λ/2) · I_y(df1/2 + j, df2/2),  y = df1·x/(df1·x + df2)
//   P(χ'² <= x) = Σ_j Pois(j; λ/2) · P(df/2 + j, x/2)
// dengan I = regularized incomplete beta, P = regularized lower incomplete gamma.
function _pwLnGamma(x){
  var c=[0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
  if(x<0.5) return Math.log(Math.PI/Math.abs(Math.sin(Math.PI*x)))-_pwLnGamma(1-x);
  x-=1; var a=c[0], t=x+7.5;
  for(var i=1;i<9;i++) a+=c[i]/(x+i);
  return 0.5*Math.log(2*Math.PI)+(x+0.5)*Math.log(t)-t+Math.log(a);
}
function _pwBetaCF(x,a,b){
  var FPMIN=1e-300,qab=a+b,qap=a+1,qam=a-1,c=1,d=1-qab*x/qap;
  if(Math.abs(d)<FPMIN) d=FPMIN; d=1/d; var h=d;
  for(var m=1;m<=3000;m++){
    var m2=2*m, aa=m*(b-m)*x/((qam+m2)*(a+m2));
    d=1+aa*d; if(Math.abs(d)<FPMIN) d=FPMIN; c=1+aa/c; if(Math.abs(c)<FPMIN) c=FPMIN; d=1/d; h*=d*c;
    aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2));
    d=1+aa*d; if(Math.abs(d)<FPMIN) d=FPMIN; c=1+aa/c; if(Math.abs(c)<FPMIN) c=FPMIN; d=1/d;
    var del=d*c; h*=del;
    if(Math.abs(del-1)<3e-16) break;
  }
  return h;
}
function _pwIncBeta(x,a,b){
  if(x<=0) return 0; if(x>=1) return 1;
  var bt=Math.exp(_pwLnGamma(a+b)-_pwLnGamma(a)-_pwLnGamma(b)+a*Math.log(x)+b*Math.log(1-x));
  if(x<(a+1)/(a+b+2)) return bt*_pwBetaCF(x,a,b)/a;
  return 1-bt*_pwBetaCF(1-x,b,a)/b;
}
function _pwGammaP(a,x){
  if(x<=0) return 0;
  var gln=_pwLnGamma(a), n;
  if(x<a+1){
    var ap=a,sum=1/a,del=sum;
    for(n=1;n<=3000;n++){ap++;del*=x/ap;sum+=del;if(Math.abs(del)<Math.abs(sum)*3e-16) break;}
    return sum*Math.exp(-x+a*Math.log(x)-gln);
  }
  var b=x+1-a,c=1/1e-300,d=1/b,h=d;
  for(n=1;n<=3000;n++){
    var an=-n*(n-a); b+=2;
    d=an*d+b; if(Math.abs(d)<1e-300) d=1e-300;
    c=b+an/c; if(Math.abs(c)<1e-300) c=1e-300;
    d=1/d; var dl=d*c; h*=dl;
    if(Math.abs(dl-1)<3e-16) break;
  }
  return 1-Math.exp(-x+a*Math.log(x)-gln)*h;
}
// Σ_j Pois(j; λ/2)·cdfFn(j) — jendela ±12 SD di sekitar rata-rata (bobot di luar jendela < 1e-30)
function _pwPoisMix(lambda,cdfFn){
  var half=lambda/2;
  if(!(half>0)) return cdfFn(0);
  var sd=Math.sqrt(half), jmin=Math.max(0,Math.floor(half-12*sd-60)), jmax=Math.ceil(half+12*sd+60), s=0;
  for(var j=jmin;j<=jmax;j++){
    s+=Math.exp(-half+j*Math.log(half)-_pwLnGamma(j+1))*cdfFn(j);
  }
  return s;
}
function _pwFCdf(x,df1,df2){ return _pwIncBeta(df1*x/(df1*x+df2),df1/2,df2/2); }
function _pwChiCdf(x,df){ return _pwGammaP(df/2,x/2); }
function _pwInvBisect(cdf,p){
  var lo=0,hi=1;
  while(cdf(hi)<p&&hi<1e12) hi*=2;
  for(var i=0;i<200;i++){var mid=(lo+hi)/2; if(cdf(mid)<p) lo=mid; else hi=mid; if(hi-lo<1e-13*Math.max(1,hi)) break;}
  return (lo+hi)/2;
}
function _pwFInv(p,df1,df2){ return _pwInvBisect(function(x){return _pwFCdf(x,df1,df2);},p); }
function _pwChiInv(p,df){ return _pwInvBisect(function(x){return _pwChiCdf(x,df);},p); }

// Power EKSAK uji F: P(F' > fCrit | df1, df2, ncp). (Dulu: aproksimasi normal —
// terlalu konservatif untuk efek besar, mis. f=.40,k=4: 18/grup vs G*Power 12/grup.)
function powerFromNcpF(ncp,df1,df2,fCrit){
  var cdf=_pwPoisMix(ncp,function(j){return _pwIncBeta(df1*fCrit/(df1*fCrit+df2),df1/2+j,df2/2);});
  return Math.min(1,Math.max(0,1-cdf));
}
// Power EKSAK uji chi-square: P(χ'² > chiCrit | df, ncp).
function powerFromNcpChi(ncp,df,chiCrit){
  var cdf=_pwPoisMix(ncp,function(j){return _pwGammaP(df/2+j,chiCrit/2);});
  return Math.min(1,Math.max(0,1-cdf));
}
var PW_MAX_N=100000; // batas atas pencarian N (per grup / total); bila tercapai → peringatan

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
  // Cari N terkecil (integer) dgn power >= target. Bracket digandakan sampai target
  // tercapai (dulu dibatasi 100/grup tanpa peringatan → power sebenarnya bisa 0.40
  // tapi dilaporkan seolah memenuhi target). Bila PW_MAX_N tak cukup → peringatan.
  function searchN(powerFn,pw,nMin,label){
    var lo=nMin,hi=Math.max(nMin+1,4);
    while(powerFn(hi)<pw&&hi<PW_MAX_N){lo=hi;hi*=2;}
    if(hi>=PW_MAX_N&&powerFn(PW_MAX_N)<pw){
      warnings.push('Target power '+pw+' tidak tercapai sampai N = '+PW_MAX_N+(label||'')+' (efek terlalu kecil); N yang dilaporkan adalah batas pencarian, BUKAN N yang memenuhi target.');
      return PW_MAX_N;
    }
    hi=Math.min(hi,PW_MAX_N);
    while(hi-lo>1){var mid=Math.floor((lo+hi)/2); if(powerFn(mid)<pw) lo=mid; else hi=mid;}
    return Math.max(nMin,hi);
  }
  function solveN_anova(f,al,pw,g){
    return searchN(function(n){return solvePower_anova(f,al,n,g);},pw,2,' per grup');
  }
  function solvePower_anova(f,al,n,g){
    var dfB=g-1,dfW=g*(n-1);
    var ncp=f*f*g*n; // λ = f²·N_total (konvensi G*Power)
    var fCrit=_pwFInv(1-al,dfB,dfW);
    return powerFromNcpF(ncp,dfB,dfW,fCrit);
  }
  function solvePower_reg(f2,al,n,u){
    var df1=u,df2=n-u-1;
    if(df2<1) return 0;
    var fCrit=_pwFInv(1-al,df1,df2);
    return powerFromNcpF(f2*n,df1,df2,fCrit); // λ = f²·N
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
    return searchN(function(n){return solvePower_chisq(w,al,n,df2);},(power||0.80),3,'');
  }
  function solvePower_chisq(w,al,n,df2){
    df2=df2||1;
    var chiCrit=_pwChiInv(1-al,df2);
    return powerFromNcpChi(n*w*w,df2,chiCrit); // λ = N·w²
  }

  var n,pwr,eff,tot,interp,effInterp;
  var warnings=[];

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
    // f² = R²/(1-R²); u = jumlah prediktor (belum ada input UI → 1)
    var u=1;
    if(solve==='n'){
      if(!effect||effect<=0) throw new Error('Cohen\'s f² must be > 0');
      n=searchN(function(nn){return solvePower_reg(effect,alpha,nn,u);},power,u+2,'');
      pwr=solvePower_reg(effect,alpha,n,u); eff=effect;
    } else if(solve==='power'){
      n=nInput; eff=effect||0.15;
      pwr=solvePower_reg(eff,alpha,n,u);
    } else if(solve==='effect'){
      n=nInput;
      var lo=1e-5,hi=50;
      for(var i=0;i<80;i++){var mid=(lo+hi)/2;if(solvePower_reg(mid,alpha,n,u)<power)lo=mid;else hi=mid;}
      eff=hi; pwr=solvePower_reg(eff,alpha,n,u);
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
    'Minimum detectable effect: '+SE.f4(eff||0)+'.'))+' '+interp+'.'+(warnings.length?' ⚠ '+warnings.join(' '):'');

  return {n:n||nInput, power:pwr, alpha:alpha, effect:eff, totalN:tot, groups:groups, powerInterp:interp, effectInterp:effInterp, interpretation:interpretation, warnings:warnings, solved:solve};
}

function effectLabels2(test){
  var m={'ttest_2samp':"Cohen's d",'ttest_1samp':"Cohen's d",'ttest_paired':"Cohen's dz",'anova_oneway':"Cohen's f",'correlation':'r','regression_r2':"f²",'chisq':'w'};
  return m[test]||'effect';
}
