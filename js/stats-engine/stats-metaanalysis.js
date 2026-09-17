//Meta-Analysis core — effect size pooling
function computeMetaAnalysis(studies, model){
  if(!studies||studies.length<2) throw new Error('Minimal 2 studi diperlukan');
  var k=studies.length;
  var yi=studies.map(function(s){return parseFloat(s.yi);});
  var vi=studies.map(function(s){return parseFloat(s.vi);});
  if(yi.some(isNaN)||vi.some(isNaN)) throw new Error('Effect size (yi) dan variance (vi) harus berupa angka');
  if(vi.some(function(v){return v<=0;})) throw new Error('Variance (vi) harus > 0');

  var f4=function(x){return isFinite(x)?parseFloat(x.toFixed(4)):NaN;};
  var f3=function(x){return isFinite(x)?parseFloat(x.toFixed(3)):NaN;};

  // ── Fixed-Effect (Inverse-Variance Weighting) ──
  var wi_fe=vi.map(function(v){return 1/v;});
  var W_fe=wi_fe.reduce(function(s,w){return s+w;},0);
  var mu_fe=wi_fe.reduce(function(s,w,i){return s+w*yi[i];},0)/W_fe;
  var var_fe=1/W_fe;
  var se_fe=Math.sqrt(var_fe);

  // ── Cochran's Q ──
  var Q=yi.reduce(function(s,y,i){return s+wi_fe[i]*(y-mu_fe)*(y-mu_fe);},0);
  var df=k-1;
  var Q_p=pChiSquare(Q,df);
  function pChiSquare(chi,df){
    if(chi<=0||df<=0) return 1;
    var x=chi/df,mu=1-2/(9*df),sigma=Math.sqrt(2/(9*df));
    var z=(Math.pow(x,1/3)-mu)/sigma;
    var t=1/(1+0.2316419*Math.abs(z));
    var d=0.3989422818*Math.exp(-z*z/2);
    var p=d*t*(0.3193815+t*(-0.3565638+t*(1.7814779+t*(-1.8212559+t*1.3302744))));
    return z>0?1-(1-p):p;
  }

  // ── I² ──
  var C=W_fe-wi_fe.reduce(function(s,w){return s+w*w;},0)/W_fe;
  var tau2=Math.max(0,(Q-df)/C);
  var I2=Math.max(0,Math.min(100,100*(Q-df)/Q));
  if(!isFinite(I2)||Q<=df) I2=0;
  var I2label=I2<25?'Low (I²<25%)':I2<50?'Moderate (I²<50%)':I2<75?'Substantial (I²<75%)':'High (I²≥75%)';
  var tau=Math.sqrt(tau2);

  // ── Random-Effects (DerSimonian-Laird) ──
  var wi_re=vi.map(function(v){return 1/(v+tau2);});
  var W_re=wi_re.reduce(function(s,w){return s+w;},0);
  var mu_re=wi_re.reduce(function(s,w,i){return s+w*yi[i];},0)/W_re;
  var var_re=1/W_re;
  var se_re=Math.sqrt(var_re);

  // ── Final model ──
  var mu=model==='fixed'?mu_fe:mu_re;
  var se=model==='fixed'?se_fe:se_re;
  var z=mu/se;
  function normCDF2(z){var t=1/(1+0.2316419*Math.abs(z));var d=0.3989422818*Math.exp(-z*z/2);var p=d*t*(0.3193815+t*(-0.3565638+t*(1.7814779+t*(-1.8212559+t*1.3302744))));return z>0?1-p:p;}
  var p=2*normCDF2(Math.abs(z));
  var z95=1.96;
  var ci_lo=mu-z95*se;
  var ci_hi=mu+z95*se;

  function pFmt(p){if(p<0.001) return '<0.001';if(p<0.01) return p.toFixed(3);return p.toFixed(3);}

  // Per-study weights and CIs for forest plot
  var wi_use=model==='fixed'?wi_fe:wi_re;
  var W_use=wi_use.reduce(function(s,w){return s+w;},0);
  var studyData=studies.map(function(s,i){
    var ci_lo_i=parseFloat(s.yi)-z95*Math.sqrt(parseFloat(s.vi));
    var ci_hi_i=parseFloat(s.yi)+z95*Math.sqrt(parseFloat(s.vi));
    var wPct=100*wi_use[i]/W_use;
    return{name:s.name,yi:parseFloat(s.yi),vi:parseFloat(s.vi),ci_lo:f3(ci_lo_i),ci_hi:f3(ci_hi_i),weight:f3(wPct),ni:s.ni};
  });

  return{
    k:k, model:model,
    pooledEffect:f4(mu), se:f4(se), var:f4(model==='fixed'?var_fe:var_re),
    ci_lo:f3(ci_lo), ci_hi:f3(ci_hi), ci_label:'95% CI',
    z:f3(z), p:p, p_fmt:pFmt(p),
    Q:f3(Q), Q_p:Q_p, Q_p_fmt:pFmt(Q_p),
    I2:f3(I2), I2raw:I2, I2label:I2label,
    tau2:f4(tau2), tau:f4(tau),
    mu_fe:f4(mu_fe), se_fe:f4(se_fe),
    mu_re:f4(mu_re), se_re:f4(se_re),
    effectLabel:'yi',
    studyData:studyData
  };
}
