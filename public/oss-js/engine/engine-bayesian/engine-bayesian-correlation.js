// BAYESIAN CORRELATION ENGINE — JZS prior (Ly et al., 2016 approximation)
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

  SE.bayesPearson = function(x, y, kappa){
    kappa = kappa || 1;
    _req(x.length,3,'x'); _req(y.length,3,'y');
    var n = Math.min(x.length,y.length);
    var xs=x.slice(0,n), ys=y.slice(0,n);
    var cr=SE.pearsonR(xs,ys);
    var r=parseFloat(cr.r);
    var t=r*Math.sqrt((n-2)/(1-r*r));
    var p=SE.tP(Math.abs(t),n-2)*2;

    var lbeta = function(a,b){ return _lnG(a)+_lnG(b)-_lnG(a+b); };
    var steps = 300, BFint = 0;
    for(var i=1;i<steps;i++){
      var rho = -1 + i*(2/steps);
      var logLik = (n-2)/2*Math.log(1-rho*rho) - (n-1.5)*Math.log(1-r*rho) - lbeta(0.5,0.5*(n-1));
      var logPrior = -Math.log(2);
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
})();
