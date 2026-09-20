// Output tab group state
var _outMode = 'all';       // 'all' | 'group'
var _outActiveGroup = null; // active group key when in group mode
var _outGrid = 1;           // layout cols: 1=1×1, 2=1×2, 3=2×2, 4=2×3, 5=2×4, 6=3×3, 7=3×4, 8=4×4

// Map output type → canonical group key & label
function _outGroup(o){
  var map={
    ttest:'T-Test', onesamp:'T-Test', paired:'T-Test',
    anova:'ANOVA', anova2:'ANOVA', anova3:'ANOVA', rmanova:'ANOVA', glm:'ANOVA', manova:'ANOVA', repeated:'ANOVA',
    correlation:'Correlation', partialCorr:'Correlation', canonicalCorr:'Correlation', corrmatrix:'Correlation',
    regression:'Regression', multipleReg:'Regression', hierarchicalReg:'Regression', logistic:'Regression', poisson:'Regression', negbin:'Regression',
    nonparam:'Non-Parametric', mannwhitney:'Non-Parametric', kruskal:'Non-Parametric', wilcoxon:'Non-Parametric', chiSquare:'Non-Parametric',
    descriptive:'Descriptives',
    alpha:'Reliability', kappa:'Reliability',
    efa:'Factor Analysis', cfa:'Factor Analysis',
    cluster:'Cluster',
    discriminant:'Discriminant',
    bayes_ttest:'Bayesian', bayes_corr:'Bayesian', bayes_posterior:'Bayesian', bayesian:'Bayesian',
    timeseries:'Time Series',
    survival:'Survival', cox:'Survival',
    roc:'ROC',
    moderation:'Moderation',
    mediation:'Mediation',
    mi:'Missing Analysis', missinganalysis:'Missing Analysis',
    poweranalysis:'Power Analysis',
    metaanalysis:'Meta-Analysis',
    sem:'SEM',
    hlm:'HLM'
  };
  return map[o.type] || (o.type ? (o.type.charAt(0).toUpperCase()+o.type.slice(1)) : 'Other');
}

function _outGroupColor(key){
  // Colors match the sidebar icon colors for each category
  var colors={
    'T-Test':'#a78bfa',          // purple — matches T-Test sidebar icon
    'ANOVA':'#34d399',            // green — matches ANOVA sidebar icon
    'Correlation':'#f472b6',      // pink — matches Correlation sidebar icon
    'Regression':'#67e8f9',       // cyan — matches Regression sidebar icon
    'Descriptives':'#f472b6',     // pink — matches Descriptive sidebar icon
    'Factor Analysis':'#a5f3fc',  // light cyan — matches Factor Analysis sidebar icon
    'Cluster':'#4ade80',          // bright green — matches Cluster sidebar icon
    'Non-Parametric':'#c084fc',   // purple — matches Nonparametric sidebar icon
    'Reliability':'#34d399',      // green — matches Reliability sidebar icon
    'Bayesian':'#f9a8d4',         // light pink — matches Bayesian sidebar icon
    'Time Series':'#67e8f9',      // cyan — matches Time Series sidebar icon
    'Survival':'#4ade80',         // green — matches Survival sidebar icon
    'ROC':'#67e8f9',              // cyan — matches ROC Curve sidebar icon
    'Moderation':'#e879f9',       // fuchsia — matches Moderation sidebar icon
    'Mediation':'#fb923c',        // orange — matches Mediation sidebar icon
    'Missing Analysis':'#f87171', // red — matches Missing Analysis sidebar icon
    'Power Analysis':'#fbbf24',   // yellow — matches Power Analysis sidebar icon
    'Meta-Analysis':'#fb923c',    // orange — matches Meta-Analysis sidebar icon
    'SEM':'#e879f9',              // fuchsia — matches SEM sidebar icon
    'HLM':'#a78bfa',              // purple — matches HLM sidebar icon
    'Discriminant':'#38bdf8'      // sky blue — matches Discriminant sidebar icon
  };
  return colors[key]||'#c084fc';
}

function _outGroupIcon(key){
  var icons={
    'T-Test':'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 3h6m-3 0v7l-5 9a1 1 0 00.9 1.5h10.2a1 1 0 00.9-1.5L14 10V3"/></svg>',
    'ANOVA':'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="10" width="5" height="10" rx="1"/><rect x="9.5" y="6" width="5" height="14" rx="1"/><rect x="17" y="2" width="5" height="18" rx="1"/></svg>',
    'Correlation':'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="6" cy="8" r="2" fill="currentColor"/><circle cx="16" cy="6" r="2" fill="currentColor"/><circle cx="5" cy="17" r="2" fill="currentColor"/><circle cx="14" cy="15" r="2" fill="currentColor"/><circle cx="19" cy="18" r="2" fill="currentColor"/></svg>',
    'Regression':'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>',
    'Descriptives':'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    'Factor Analysis':'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg>',
    'Cluster':'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="6" r="2" fill="currentColor"/><circle cx="12" cy="4" r="2" fill="currentColor"/><circle cx="7" cy="13" r="2" fill="currentColor"/><circle cx="17" cy="8" r="2" fill="currentColor"/><circle cx="19" cy="17" r="2" fill="currentColor"/></svg>',
    'Bayesian':'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="11" r="3"/><line x1="12" y1="14" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>',
    'Non-Parametric':'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 20 Q6 4 12 12 Q18 20 22 4"/></svg>',
    'Reliability':'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    'Time Series':'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>',
    'Survival':'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="2 20 6 20 6 14 10 14 10 10 14 10 14 7 18 7 18 4 22 4"/></svg>'
  };
  return icons[key]||'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>';
}

function _outGroups(){
  var seen=[], map={};
  outputs.forEach(function(o){
    var g=_outGroup(o);
    if(!map[g]){map[g]={key:g,count:0,latest:o.id};seen.push(g);}
    map[g].count++;
  });
  return seen.map(function(k){return map[k];});
}

// Interpretation box helper
// Renders a subtle, theme-consistent conclusion line at the bottom of each output card
function _interpBox(text){
  return '<div style="margin-top:14px;padding:9px 13px;border-top:1px solid rgba(124,58,237,.1);font-size:11.5px;color:rgba(232,222,255,.45);line-height:1.65;font-style:italic">'+text+'</div>';
}

// Build interpretation string per output type
function _buildInterp(o){
  var r=o.res;
  var p=r?parseFloat(r.p||r.p_fmt||r.pF||r.lrP||1):1;
  var sig=p<.05;

  if(o.type==='descriptive'){
    var sk=parseFloat(o.stats&&o.stats.skewness)||0;
    var swp=parseFloat(o.stats&&o.stats.shapiroP)||1;
    var norm=swp>.05;
    return 'Distribusi '+escHtml(o.field)+' '+(norm?'normal (SW p='+o.stats.shapiroP+')'
      :'tidak normal (SW p='+o.stats.shapiroP+')')
      +', skewness '+Math.abs(sk).toFixed(2)+(Math.abs(sk)<1?' (simetris)':(sk>0?' (condong kanan)':' (condong kiri)'))+'.';
  }
  if(o.type==='ttest'){
    var d=parseFloat(r.cohensD)||0;
    var mag=Math.abs(d)<.2?'trivial':Math.abs(d)<.5?'kecil':Math.abs(d)<.8?'sedang':'besar';
    return (sig
      ?'Terdapat perbedaan signifikan antara '+escHtml(o.ga)+' dan '+escHtml(o.gb)+' (t='+r.t+', p='+r.p_fmt+'). Ukuran efek Cohen\'s d='+r.cohensD+' ('+mag+').'
      :'Tidak terdapat perbedaan signifikan antara '+escHtml(o.ga)+' dan '+escHtml(o.gb)+' (t='+r.t+', p='+r.p_fmt+'). Efek d='+r.cohensD+' ('+mag+').');
  }
  if(o.type==='onesamp'){
    return (sig
      ?'Rata-rata sampel (x̄='+r.mean+') berbeda signifikan dari nilai uji μ₀='+o.mu0+' (t='+r.t+', p='+r.p_fmt+').'
      :'Rata-rata sampel (x̄='+r.mean+') tidak berbeda signifikan dari nilai uji μ₀='+o.mu0+' (t='+r.t+', p='+r.p_fmt+').');
  }
  if(o.type==='paired'){
    return (sig
      ?'Terdapat perbedaan signifikan antara dua kondisi (mean diff='+r.meanDiff+', t='+r.t+', p='+r.p_fmt+'). Efek d='+r.cohensD+' ('+r.dInterp+').'
      :'Tidak terdapat perbedaan signifikan antara dua kondisi (mean diff='+r.meanDiff+', p='+r.p_fmt+').');
  }
  if(o.type==='rmanova'){
    return (sig
      ?'Terdapat perbedaan signifikan antar time point (F='+r.F+', p='+r.p_fmt+'). Ukuran efek η²p='+r.etaSq+' ('+r.etaInterp+').'
      :'Tidak terdapat perbedaan signifikan antar time point (F='+r.F+', p='+r.p_fmt+').');
  }
  if(o.type==='anova'){
    return (sig
      ?'Terdapat perbedaan signifikan antar grup (F='+r.F+', p='+r.p_fmt+'). Ukuran efek η²='+r.eta2+' ('+r.eta2Interp+'). Lanjutkan dengan post-hoc untuk mengetahui pasangan yang berbeda.'
      :'Tidak terdapat perbedaan signifikan antar grup (F='+r.F+', p='+r.p_fmt+'). η²='+r.eta2+'.');
  }
  if(o.type==='anova2'){
    var sigEffects=(r.effects||[]).filter(function(e){return e.sig;}).map(function(e){return escHtml(e.source);});
    return sigEffects.length
      ?'Efek signifikan: '+sigEffects.join(', ')+'. Perhatikan interaksi jika '+escHtml(r.factorA)+'×'+escHtml(r.factorB)+' signifikan.'
      :'Tidak ada efek utama maupun interaksi yang signifikan.';
  }
  if(o.type==='anova3'){
    var sigEff3=(r.effects||[]).filter(function(e){return e.sig;}).map(function(e){return escHtml(e.source);});
    return sigEff3.length
      ?'Efek signifikan: '+sigEff3.join(', ')+'.'
      :'Tidak ada efek utama maupun interaksi yang signifikan.';
  }
  if(o.type==='correlation'){
    return (sig
      ?'Terdapat korelasi '+r.direction+' yang signifikan antara kedua variabel (r='+r.r+', p='+r.p_fmt+'). Kekuatan: '+r.strength+'. Variabel berbagi '+r.r2+' varians bersama.'
      :'Tidak terdapat korelasi signifikan antara kedua variabel (r='+r.r+', p='+r.p_fmt+').');
  }
  if(o.type==='partialCorr'){
    return (sig
      ?'Setelah mengontrol '+escHtml(o.pcZ)+', korelasi antara '+escHtml(o.pcX)+' dan '+escHtml(o.pcY)+' tetap signifikan (r='+r.rp+', p='+r.p_fmt+').'
      :'Setelah mengontrol '+escHtml(o.pcZ)+', korelasi antara '+escHtml(o.pcX)+' dan '+escHtml(o.pcY)+' tidak signifikan (r='+r.rp+', p='+r.p_fmt+').');
  }
  if(o.type==='regression'){
    var regSig=(typeof r.sig==='boolean')?r.sig:parseFloat(r.pF)<.05;
    return (regSig
      ?'Model regresi signifikan (F p='+r.pF_fmt+'). '+escHtml(o.xF)+' menjelaskan '+r.R2+' varians '+escHtml(o.yF)+'. Setiap +1 '+escHtml(o.xF)+' → '+escHtml(o.yF)+' berubah '+r.b1+'.'
      :'Model regresi tidak signifikan (F p='+r.pF_fmt+'). '+escHtml(o.xF)+' tidak cukup menjelaskan varians '+escHtml(o.yF)+'.');
  }
  if(o.type==='multipleReg'){
    var mrSig=(typeof r.sig==='boolean')?r.sig:parseFloat(r.pF)<.05;
    var sigPreds=(r.coefs||[]).filter(function(c,i){return i>0&&((typeof c.sig==='boolean')?c.sig:parseFloat(c.p)<.05);}).map(function(c){return escHtml(c.name);});
    return (mrSig
      ?'Model signifikan (R²='+r.R2+', p='+(r.pF_fmt||r.pF)+'). Prediktor signifikan: '+(sigPreds.length?sigPreds.join(', '):'tidak ada')+'.'
      :'Model tidak signifikan secara keseluruhan (R²='+r.R2+').');
  }
  if(o.type==='logistic'){
    return (parseFloat(r.nagelkerke)>.3
      ?'Model logistik menjelaskan ~'+r.nagelkerke+' varians (Nagelkerke R²). Akurasi klasifikasi: '+r.accuracy+'%. Periksa OR prediktor signifikan untuk arah pengaruh.'
      :'Model logistik dengan Nagelkerke R²='+r.nagelkerke+'. Akurasi: '+r.accuracy+'%.');
  }
  if(o.type==='mannwhitney'){
    return (sig
      ?'Terdapat perbedaan signifikan antara '+escHtml(o.ga)+' dan '+escHtml(o.gb)+' (U='+r.U+', p='+r.p_fmt+'). Ukuran efek r='+r.r_eff+'.'
      :'Tidak terdapat perbedaan signifikan antara '+escHtml(o.ga)+' dan '+escHtml(o.gb)+' (U='+r.U+', p='+r.p_fmt+').');
  }
  if(o.type==='kruskal'){
    return (sig
      ?'Terdapat perbedaan signifikan antar grup (H='+r.H+', p='+r.p_fmt+'). Lanjutkan dengan uji post-hoc nonparametrik.'
      :'Tidak terdapat perbedaan signifikan antar grup (H='+r.H+', p='+r.p_fmt+').');
  }
  if(o.type==='wilcoxon'){
    return (sig
      ?'Terdapat perbedaan signifikan antara dua kondisi (W='+r.Wplus+', p='+r.p_fmt+').'
      :'Tidak terdapat perbedaan signifikan antara dua kondisi (p='+r.p_fmt+').');
  }
  if(o.type==='chiSquare'||o.type==='nonparam'){
    return (sig
      ?'Terdapat hubungan signifikan antar variabel (χ²='+r.chi2+', p='+r.p_fmt+'). Kekuatan asosiasi V='+r.V+' ('+r.Vinterp+').'
      :'Tidak terdapat hubungan signifikan antar variabel (χ²='+r.chi2+', p='+r.p_fmt+').');
  }
  if(o.type==='alpha'){
    return 'Cronbach α='+r.alpha+' ('+r.interp+'). '+(parseFloat(r.alpha)>=.7?'Reliabilitas internal diterima.':'Reliabilitas di bawah standar minimum (α < .70).');
  }
  if(o.type==='kappa'){
    return 'Cohen\'s κ='+r.kappa+' ('+r.interp+'). '+(parseFloat(r.kappa)>.6?'Kesepakatan antar-rater dapat diterima.':'Kesepakatan antar-rater rendah.');
  }
  if(o.type==='efa'){
    var nf=r&&r.nFactors||'?';
    return 'EFA mengekstrak '+nf+' faktor. Periksa loading ≥ |.40| untuk interpretasi setiap faktor. Variabel dengan cross-loading tinggi perlu diperhatikan.';
  }
  if(o.type==='mediation'){
    var meds=(r&&r.mediators)||[];
    var boots=(r&&r.bootResults)||[];
    var ab=r&&r.totalIndirect;
    var abSig=boots.length?boots.some(function(b){return b.sig;}):meds.some(function(m){return parseFloat(m.sobel_p)<.05;});
    var abBasis=boots.length?'bootstrap CI':'uji Sobel';
    var cpSig=parseFloat(r&&r.barronKenny&&r.barronKenny.p_c_prime)<.05;
    var sigMed=[];
    if(meds.length>1)meds.forEach(function(m,i){
      var ok=boots.length?(boots[i]&&boots[i].sig):parseFloat(m.sobel_p)<.05;
      if(ok)sigMed.push(escHtml(m.name));
    });
    return (abSig
      ?'Mediasi signifikan — indirect effect (ab='+ab+') berbeda dari nol berdasarkan '+abBasis+'. '+(cpSig?'Partial mediation (c\' masih signifikan).':'Full mediation (c\' tidak signifikan).')+(sigMed.length?' Mediator signifikan: '+sigMed.join(', ')+'.':'')
      :'Efek indirect tidak signifikan (ab='+ab+'). Mediasi tidak terbukti pada α=.05.');
  }
  if(o.type==='moderation'){
    var ia=(r&&r.interaction)||{};
    var modSig=parseFloat(ia.p)<.05;
    var modP=ia.p_fmt||'n/a';
    return (modSig
      ?'Efek interaksi signifikan (p='+modP+') — hubungan antara X dan Y dimoderasi oleh W. Lihat interaction plot untuk pola.'
      :'Efek interaksi tidak signifikan (p='+modP+') — W tidak memoderasi hubungan X→Y.');
  }
  if(o.type==='survival'||o.type==='cox'){
    return 'Analisis survival selesai. Periksa kurva Kaplan-Meier dan hazard ratio untuk interpretasi perbedaan antar grup.';
  }
  if(o.type==='roc'){
    var auc=r&&r.auc||0;
    var aucInterp=auc>.9?'excellent':auc>.8?'good':auc>.7?'fair':auc>.6?'poor':'tidak informatif';
    return 'AUC='+auc+' ('+aucInterp+'). '+(auc>.7?'Model memiliki kemampuan diskriminasi yang memadai.':'Kemampuan diskriminasi model terbatas.');
  }
  if(o.type==='bayesian'||o.type==='bayes_ttest'){
    return 'Interpretasi Bayesian: BF₁₀ > 3 menunjukkan dukungan moderat untuk H₁; BF₁₀ < 1/3 mendukung H₀. Posterior distribution merangkum estimasi parameter.';
  }
  if(o.type==='hlm'){
    var icc=r&&r.ICC;
    return icc!==undefined
      ?'ICC='+icc+' — '+Math.round(parseFloat(icc)*100)+'% varians '+escHtml(o.dep)+' berada di level kelompok. '+(parseFloat(icc)>.05?'HLM justified untuk data ini.':'Varians kelompok rendah; regresi OLS mungkin cukup.')
      :'Model HLM selesai. Periksa random effects untuk variasi antar kelompok.';
  }
  if(o.type==='sem'){
    var cfi=r&&r.CFI||0;
    var rmsea=r&&r.RMSEA||1;
    return 'Model fit: CFI='+cfi+' ('+( parseFloat(cfi)>=.95?'good':parseFloat(cfi)>=.90?'acceptable':'poor')+'), RMSEA='+rmsea+' ('+(parseFloat(rmsea)<=.05?'excellent':parseFloat(rmsea)<=.08?'acceptable':'poor')+').';
  }
  if(o.type==='discriminant'){
    return 'Analisis diskriminan selesai. Periksa canonical discriminant functions dan struktur koefisien untuk mengidentifikasi variabel pembeda utama.';
  }
  if(o.type==='cluster'){
    return 'Cluster analysis selesai. Interpretasikan profil setiap cluster berdasarkan centroid dan ukuran cluster untuk memberikan label deskriptif.';
  }
  if(o.type==='metaanalysis'){
    return 'Meta-analysis selesai. Periksa pooled effect size, heterogeneity (I²), dan funnel plot untuk menilai publication bias.';
  }
  if(o.type==='timeseries'){
    return 'Analisis time series selesai. Periksa ACF/PACF dan diagnostik residual untuk memastikan model sudah memadai.';
  }
  if(o.type==='poweranalysis'){
    return 'Power analysis selesai. Power ≥ 0.80 umumnya dianggap memadai untuk mendeteksi efek yang diharapkan.';
  }
  if(o.type==='glm'){
    return 'General Linear Model selesai. Periksa partial η² untuk ukuran efek setiap faktor.';
  }
  if(o.type==='manova'){
    return 'MANOVA selesai. Jika uji multivariat signifikan, lanjutkan dengan univariat ANOVA per DV dengan koreksi Bonferroni.';
  }
  if(o.type==='hierarchicalReg'){
    var lastBlock=(r&&r.blocks)?r.blocks[r.blocks.length-1]:null;
    return lastBlock
      ?'Model final (Block '+lastBlock.block+'): R²='+lastBlock.R2+'. ΔR² setiap blok menunjukkan kontribusi inkremental prediktor baru.'
      :'Hierarchical regression selesai. Bandingkan ΔR² antar blok untuk menilai kontribusi setiap set prediktor.';
  }
  if(o.type==='corrmatrix'){
    return 'Matriks korelasi selesai. Perhatikan korelasi tinggi (|r| > .70) yang bisa mengindikasikan multikollinearitas jika variabel digunakan bersama dalam regresi.';
  }
  return null;
}
