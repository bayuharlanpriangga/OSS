// BAYESIAN POSTERIOR ENGINE (Normal-Inverse-Gamma conjugate)
(function(){
  function _req(n,min,lbl){if(n<min) throw new Error(lbl+': need ≥'+min+' valid cases (got '+n+')');}

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
    var tCrit=2.0;
    if(2*an > 4) tCrit = SE.normInv(0.975);
    var lo=mun-tCrit*postSD, hi=mun+tCrit*postSD;
    return {
      postMean: SE.f4(mun), postSD: SE.f4(postSD),
      hdi95: SE.f4(lo)+' – '+SE.f4(hi),
      postKappa: SE.f4(kn), postAlpha: SE.f4(an), postBeta: SE.f4(bn),
      priorMu0: SE.f4(mu0), priorKappa0: SE.f4(kappa0),
      n: n, sampleMean: SE.f4(m),
      _mun: mun, _postSD: postSD, _priorMu0: mu0, _priorSD: Math.sqrt(beta0/(alpha0*kappa0)),
      lo95: SE.f4(lo), hi95: SE.f4(hi)
    };
  };
})();
