// BAYESIAN T-TEST ENGINE (Rouder et al. 2009) — Cauchy prior on effect size
// BF10 computed via numerical integration of t-distribution likelihood
(function(){
  function _lnG(z){
    var C=[0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,
      -176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
    if(z<0.5) return Math.log(Math.PI/Math.sin(Math.PI*z))-_lnG(1-z);
    z-=1; var x=C[0]; for(var i=1;i<9;i++) x+=C[i]/(z+i);
    var t2=z+7.5;
    return 0.5*Math.log(2*Math.PI)+(z+0.5)*Math.log(t2)-t2+Math.log(x);
  }
  function _req(n,min,lbl){if(n<min) throw new Error(lbl+': need ≥'+min+' valid cases (got '+n+')');}

  // Log of Jeffreys' BF10 for independent t-test (Rouder et al., 2009)
  // Uses the JZS prior with Cauchy scale r
  function logIntegrand(delta, t, n1, n2, r){
    var df = n1+n2-2;
    var ssq = n1*n2/(n1+n2);
    var lambda = delta * Math.sqrt(ssq);
    var logLik = logNonCentralT(t, df, lambda) - logCentralT(t, df);
    var logPrior = -Math.log(Math.PI * r * (1 + (delta*delta)/(r*r)));
    return logLik + logPrior;
  }

  function logCentralT(t, df){
    return _lnG((df+1)/2) - _lnG(df/2) - 0.5*Math.log(df*Math.PI) - (df+1)/2*Math.log(1+t*t/df);
  }

  function logNonCentralT(t, df, lambda){
    if(df > 30){
      var z = (t - lambda) / Math.sqrt(1 + t*t/df);
      return -0.5*z*z - 0.5*Math.log(2*Math.PI);
    }
    var z2 = t - lambda;
    return -0.5*z2*z2 - 0.5*Math.log(2*Math.PI);
  }

  SE.bayesTTest = function(a, b, r, tails){
    r = r || 0.707;
    tails = tails || 2;
    _req(a.length,2,'Group A'); _req(b.length,2,'Group B');
    var n1=a.length, n2=b.length;
    var m1=SE.mean(a), m2=SE.mean(b);
    var s1=SE.vari(a), s2=SE.vari(b);
    var sp=Math.sqrt(((n1-1)*s1+(n2-1)*s2)/(n1+n2-2));
    var t=(m1-m2)/(sp*Math.sqrt(1/n1+1/n2));
    var df=n1+n2-2;
    var d=(m1-m2)/sp;

    var logH0 = logCentralT(t, df);
    var limit = 8*r;
    var fn = function(delta){
      var li = logIntegrand(delta, t, n1, n2, r);
      return Math.exp(li - logH0);
    };

    var integral = 0;
    var N=200, step=2*limit/N;
    for(var i=0;i<N;i++){
      var del=-limit+(i+0.5)*step;
      integral+=fn(del)*step;
    }

    if(tails===1){
      var integralPos=0;
      for(var i=0;i<N/2;i++){
        var del2=(i+0.5)*step;
        integralPos+=fn(del2)*step;
      }
      integral=integralPos*2;
    }

    var BF10=integral;
    var BF01=BF10>0?1/BF10:Infinity;

    var dInterp=Math.abs(d)<0.2?'negligible':Math.abs(d)<0.5?'small':Math.abs(d)<0.8?'medium':'large';
    var interp='';
    var absBF=BF10;
    if(absBF>=100) interp='Extreme evidence for H₁';
    else if(absBF>=30) interp='Very strong evidence for H₁';
    else if(absBF>=10) interp='Strong evidence for H₁';
    else if(absBF>=3) interp='Moderate evidence for H₁';
    else if(absBF>1) interp='Anecdotal evidence for H₁';
    else if(absBF===1) interp='No evidence';
    else if(absBF>1/3) interp='Anecdotal evidence for H₀';
    else if(absBF>1/10) interp='Moderate evidence for H₀';
    else if(absBF>1/30) interp='Strong evidence for H₀';
    else interp='Very strong evidence for H₀';

    return {
      BF10: SE.f4(BF10), BF01: SE.f4(BF01),
      t: SE.f4(t), df: df,
      cohensD: SE.f4(d), dInterp: dInterp,
      interpretation: interp,
      priorScale: r,
      n1: n1, n2: n2,
      mean1: SE.f4(m1), mean2: SE.f4(m2),
      p_fmt: SE.f4(SE.tP(Math.abs(t),df)*2)
    };
  };
})();
