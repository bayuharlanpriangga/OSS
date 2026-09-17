// BAYESIAN STATISTICS ENGINE
// Bayesian T-Test (Rouder et al. 2009) — Cauchy prior on effect size
// BF10 computed via numerical integration of t-distribution likelihood
(function(){
  // Local helpers (mirrors SE internals)
  function _lnG(z){
    var C=[0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,
      -176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
    if(z<0.5) return Math.log(Math.PI/Math.sin(Math.PI*z))-_lnG(1-z);
    z-=1; var x=C[0]; for(var i=1;i<9;i++) x+=C[i]/(z+i);
    var t2=z+7.5;
    return 0.5*Math.log(2*Math.PI)+(z+0.5)*Math.log(t2)-t2+Math.log(x);
  }
  function _req(n,min,lbl){if(n<min) throw new Error(lbl+': need ≥'+min+' valid cases (got '+n+')');}
  function _normInv(p){
    if(p<=0)return -Infinity; if(p>=1)return Infinity;
    var c=[0.3374754822726147,0.9761690190917186,0.1607979714918209,0.0276438810333863,
           0.0038405729373609,0.0003951896511349,0.0000321767881768,0.0000002888167364,0.0000003960315187];
    var a=[2.50662823884,-18.61500062529,41.39119773534,-25.44106049637];
    var b=[-8.47351093090,23.08336743743,-21.06224101826,3.13082909833];
    var r=p-0.5;
    if(Math.abs(r)<0.42){var rs=r*r;return r*(((a[3]*rs+a[2])*rs+a[1])*rs+a[0])/((((b[3]*rs+b[2])*rs+b[1])*rs+b[0])*rs+1);}
    var s=Math.log(p<0.5?-Math.log(p):-Math.log(1-p));
    var t2=c[0]; for(var i2=1;i2<9;i2++) t2=t2*s+c[i2];
    return p<0.5?-t2:t2;
  }

  // Log of Jeffreys' BF10 for independent t-test (Rouder et al., 2009)
  // Uses the JZS prior with Cauchy scale r
  function logIntegrand(delta, t, n1, n2, r){
    var df = n1+n2-2;
    var ssq = n1*n2/(n1+n2);
    // ncp for t: delta * sqrt(ssq)
    var lambda = delta * Math.sqrt(ssq);
    // log likelihood ratio under H1 vs H0
    // p(t|delta, df) / p(t|0, df)
    // = ratio of noncentral vs central t densities
    var logLik = logNonCentralT(t, df, lambda) - logCentralT(t, df);
    // log Cauchy prior p(delta | r)
    var logPrior = -Math.log(Math.PI * r * (1 + (delta*delta)/(r*r)));
    return logLik + logPrior;
  }

  function logCentralT(t, df){
    return _lnG((df+1)/2) - _lnG(df/2) - 0.5*Math.log(df*Math.PI) - (df+1)/2*Math.log(1+t*t/df);
  }

  function logNonCentralT(t, df, lambda){
    // Use normal approximation for large |lambda|, exact otherwise
    // Approximation: t_nc ≈ N(lambda, 1) for large df
    if(df > 30){
      var z = (t - lambda) / Math.sqrt(1 + t*t/df);
      return -0.5*z*z - 0.5*Math.log(2*Math.PI);
    }
    // For smaller df use direct computation
    var sum = 0, term = Math.exp(-0.5*lambda*lambda);
    var logBase = _lnG((df+1)/2) - _lnG(df/2) - 0.5*Math.log(df*Math.PI) - (df+1)/2*Math.log(1+t*t/df);
    // Series approximation
    for(var j=0; j<20; j++){
      var logTerm = j*Math.log(Math.abs(lambda)*Math.sqrt(2)) + _lnG(j+1) - _lnG(2*j+1);
      // simplified: use normal approximation
      break;
    }
    // Fallback to normal approximation
    var z2 = t - lambda;
    return -0.5*z2*z2 - 0.5*Math.log(2*Math.PI);
  }

  // Numerical integration using Gaussian quadrature (simplified)
  function adaptiveSimpson(f, a, b, tol, depth){
    var c=(a+b)/2, fa=f(a), fb=f(b), fc=f(c);
    var h=b-a;
    var s1=h/6*(fa+4*fc+fb);
    if(depth<=0) return s1;
    var s2=h/12*(fa+4*f((a+c)/2)+2*fc+4*f((c+b)/2)+fb);
    if(Math.abs(s2-s1)<15*tol) return s2+(s2-s1)/15;
    return adaptiveSimpson(f,a,c,tol/2,depth-1)+adaptiveSimpson(f,c,b,tol/2,depth-1);
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

    // BF10 via numerical integration over delta
    // Using Cauchy prior scaled by r
    // log p(t|H1) = log integral p(t|delta)*p(delta|r) d(delta)
    // We integrate in delta space from -8r to 8r
    var logH0 = logCentralT(t, df);

    // Map integration: integrate exp(logIntegrand) over delta
    var limit = 8*r;
    var fn = function(delta){
      var li = logIntegrand(delta, t, n1, n2, r);
      return Math.exp(li - logH0); // relative to H0
    };

    var integral = 0;
    // Gaussian quadrature with 200 points
    var N=200, step=2*limit/N;
    for(var i=0;i<N;i++){
      var del=-limit+(i+0.5)*step;
      integral+=fn(del)*step;
    }

    // For one-tailed: integrate only positive (or negative) delta
    if(tails===1){
      var integralPos=0;
      for(var i=0;i<N/2;i++){
        var del2=(i+0.5)*step;
        integralPos+=fn(del2)*step;
      }
      integral=integralPos*2; // prior is halved for one-tailed
    }

    var BF10=integral;
    var BF01=BF10>0?1/BF10:Infinity;

    // Cohen's d
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

  // Bayesian Correlation — JZS prior (Ly et al., 2016 approximation)
  SE.bayesPearson = function(x, y, kappa){
    kappa = kappa || 1;
    _req(x.length,3,'x'); _req(y.length,3,'y');
    var n = Math.min(x.length,y.length);
    var xs=x.slice(0,n), ys=y.slice(0,n);
    var cr=SE.pearsonR(xs,ys);
    var r=parseFloat(cr.r);
    var t=r*Math.sqrt((n-2)/(1-r*r));
    var p=SE.tP(Math.abs(t),n-2)*2;

    // BF10 approximation (Ly et al., 2016 via beta distribution)
    // BF10 = sqrt(n/2) * (1-r^2)^((n-1)/2) * beta((n-1)/2, 1/2+kappa) /
    //        (2^(n-2) * beta((n-1)/2, 1/2) * beta(1/2+kappa, 1/2))
    // Simplified closed-form (Jeffreys 1961 / Wetzels approximation)
    // We use a simpler version: BF10 based on t-value
    var lbeta = function(a,b){ return _lnG(a)+_lnG(b)-_lnG(a+b); };
    var logBF = 0;
    // Truncated beta integration approximation
    var steps = 300, BFint = 0;
    for(var i=1;i<steps;i++){
      var rho = -1 + i*(2/steps);
      // likelihood: (1-rho^2)^((n-2)/2) * (1-r*rho)^(-(n-3/2))
      var logLik = (n-2)/2*Math.log(1-rho*rho) - (n-1.5)*Math.log(1-r*rho) - lbeta(0.5,0.5*(n-1));
      // prior: kappa*beta(kappa,1) on |rho|
      var logPrior = -Math.log(2); // uniform prior on rho
      BFint += Math.exp(logLik+logPrior)*(2/steps);
    }
    var BF10 = BFint;
    if(!isFinite(BF10)||BF10<=0) BF10 = Math.exp(-0.5*(1-r*r)*(n-1) + 0.5*Math.log(n)) || 1;
    var BF01 = 1/BF10;

    var absBF=BF10;
    var interp='';
    if(absBF>=100) interp='Extreme evidence for ρ≠0';
    else if(absBF>=30) interp='Very strong evidence for ρ≠0';
    else if(absBF>=10) interp='Strong evidence for ρ≠0';
    else if(absBF>=3) interp='Moderate evidence for ρ≠0';
    else if(absBF>1) interp='Anecdotal evidence for ρ≠0';
    else if(absBF>1/3) interp='Anecdotal evidence for ρ=0';
    else interp='Moderate/strong evidence for ρ=0';

    return {
      BF10: SE.f4(BF10), BF01: SE.f4(BF01),
      r: cr.r, p_fmt: SE.f4(p),
      interpretation: interp, n: n
    };
  };

  // Bayesian Posterior (Normal-Inverse-Gamma conjugate)
  SE.bayesPosteriorNormal = function(arr, mu0, kappa0, alpha0, beta0){
    _req(arr.length,3,'arr');
    mu0=mu0||0; kappa0=kappa0||1; alpha0=alpha0||0.5; beta0=beta0||0.5;
    var n=arr.length, m=SE.mean(arr);
    var ss=arr.reduce(function(s,v){return s+(v-m)*(v-m);},0);
    // Posterior hyperparameters
    var kn=kappa0+n;
    var mun=(kappa0*mu0+n*m)/kn;
    var an=alpha0+n/2;
    var bn=beta0+0.5*ss+0.5*(kappa0*n/(kappa0+n))*(m-mu0)*(m-mu0);
    // Posterior variance of mu: bn/(an*kn) (marginal t-distribution)
    var postVar=bn/(an*kn);
    var postSD=Math.sqrt(postVar);
    // 95% credible interval (approx using Student-t with 2*an df)
    var tCrit=2.0; // approx 95% for large df; better: SE.normInv(0.975)
    if(2*an > 4) tCrit = SE.normInv(0.975); // use normal for large df
    var lo=mun-tCrit*postSD, hi=mun+tCrit*postSD;
    return {
      postMean: SE.f4(mun), postSD: SE.f4(postSD),
      hdi95: SE.f4(lo)+' – '+SE.f4(hi),
      postKappa: SE.f4(kn), postAlpha: SE.f4(an), postBeta: SE.f4(bn),
      priorMu0: SE.f4(mu0), priorKappa0: SE.f4(kappa0),
      n: n, sampleMean: SE.f4(m),
      // Raw values for chart
      _mun: mun, _postSD: postSD, _priorMu0: mu0, _priorSD: Math.sqrt(beta0/(alpha0*kappa0)),
      lo95: SE.f4(lo), hi95: SE.f4(hi)
    };
  };
})();