// Output tab group state
var _outMode = 'all';         // 'all' | 'group'
var _outActiveGroup = null;   // active group key when in group mode
var _outGridOpen = true;      // tampilkan pill pilihan grid? (toggle lewat tombol GRID)
var _outGrid = 1;             // layout cols: 1=1×1, 2=2×2, 3=3×3, 4=4×4
var _outGroupEdit = false;    // mode edit pilih kategori group untuk hapus sekaligus
var _outSelectedGroups = [];  // key grup terpilih di mode edit
var _OUT_GRID_OPTS = [{c:1,lbl:'1×1'},{c:2,lbl:'2×2'},{c:3,lbl:'3×3'},{c:4,lbl:'4×4'}];

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
  var colors={
    'T-Test':'var(--ink)',
    'ANOVA':'var(--ok)',
    'Correlation':'var(--line)',
    'Regression':'var(--ink)',
    'Descriptives':'var(--line)',
    'Factor Analysis':'var(--gold-text)',
    'Cluster':'var(--ok)',
    'Non-Parametric':'var(--line)',
    'Reliability':'var(--ok)',
    'Bayesian':'var(--gold-text)',
    'Time Series':'var(--line)',
    'Survival':'var(--ok)',
    'ROC':'var(--gold-text)',
    'Moderation':'var(--warn)',
    'Mediation':'var(--warn)',
    'Missing Analysis':'var(--err)',
    'Power Analysis':'var(--gold-text)',
    'Meta-Analysis':'var(--warn)',
    'SEM':'var(--ink)',
    'HLM':'var(--line)',
    'Discriminant':'var(--line)'
  };
  return colors[key]||'var(--ink)';
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
  return '<div style="margin-top:14px;padding:10px 14px;border-top:1px solid var(--line-soft);font-size:12px;color:var(--ink-muted);line-height:1.65;font-style:italic">'+text+'</div>';
}

// Build interpretation string per output type
function _buildInterp(o){
  var r=o.res;
  var p=r?parsePValue(r.p!==undefined?r.p:(r.p_fmt!==undefined?r.p_fmt:(r.pF!==undefined?r.pF:(r.lrP!==undefined?r.lrP:1)))):1;
  if(!isFinite(p))p=1;
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
  if(o.type==='poisson'){
    var pSig=r&&r.lrP!==undefined?parsePValue(r.lrP)<.05:false;
    return (pSig
      ?'Model Poisson signifikan (LR χ²='+r.lrChi2+', p='+r.lrP+'). Periksa IRR (e^β) dan statistik dispersi ('+r.dispersion+').'
      :'Model Poisson tidak signifikan secara keseluruhan (p='+((r&&r.lrP)||'n/a')+').');
  }
  if(o.type==='negbin'){
    var nbSig=r&&r.lrP!==undefined?parsePValue(r.lrP)<.05:false;
    return (nbSig
      ?'Model Negative Binomial signifikan (LR χ²='+r.lrChi2+', p='+r.lrP+', θ='+r.theta+'). Periksa IRR (e^β) untuk besaran efek prediktor.'
      :'Model Negative Binomial tidak signifikan secara keseluruhan (p='+((r&&r.lrP)||'n/a')+').');
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
  if(o.type==='bayes_ttest'){
    return 'Interpretasi Bayesian: BF₁₀ > 3 menunjukkan dukungan moderat untuk H₁; BF₁₀ < 1/3 mendukung H₀. Posterior distribution merangkum estimasi parameter.';
  }
  if(o.type==='hlm'){
    if(r&&r.subtype==='hlm-3level'){
      return 'Three-Level HLM selesai: '+r.vpcL3+'% varians berada di Level-3 (ICC L3='+r.ICC_L3+'), '+r.vpcL2+'% di Level-2, dan '+r.vpcL1+'% di Level-1.';
    }
    if(r&&r.subtype==='hlm-2level'){
      return 'Two-Level HLM ('+r.modelType+') selesai: Conditional ICC='+r.ICC+' (Null ICC='+r.ICC_null+'), Pseudo-R² L1='+r.pseudoR2_L1+', L2='+r.pseudoR2_L2+'.';
    }
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
  if(o.type==='repeated'){
    return (sig
      ?'Terdapat perubahan signifikan antara kondisi pre dan post (t('+r.df+')='+r.t+', p='+r.p_fmt+', dz='+r.cohensD+').'
      :'Tidak terdapat perubahan signifikan antara kondisi pre dan post (t('+r.df+')='+r.t+', p='+r.p_fmt+').');
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
  return null;
}

// ════════════════════════════════════════════════════════════════════════
// OUTPUT DISPATCHER & ACTIONS (dipindah dari app.js, 2026-10-04)
// ════════════════════════════════════════════════════════════════════════
function _outNormalizeGrid(g){
  return (g>=1&&g<=4)?g:1;
}

function setOutDisplayMode(mode){
  _outMode=mode==='group'?'group':'all';
  _outActiveGroup=null;
  _outGroupEdit=false;
  _outSelectedGroups=[];
  var ov=document.getElementById('out-display-modal');
  if(ov&&ov.classList.contains('open')) renderOutDisplayModal();
  renderTab('output');
}

function setOutDisplayGrid(cols){
  _outGrid=_outNormalizeGrid(cols);
  var ov=document.getElementById('out-display-modal');
  if(ov&&ov.classList.contains('open')) renderOutDisplayModal();
  renderTab('output');
}

function renderOutDisplayModal(){
  var body=document.getElementById('out-display-body');
  if(!body) return;
  var em=_outMode;
  var gridVal=_outNormalizeGrid(_outGrid);
  var allIcon='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>';
  var grpIcon='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>';
  var html='';
  html+='<div>';
  html+='<div class="out-display-sec-lbl">Mode</div>';
  html+='<div class="out-display-mode-row">';
  html+='<button type="button" class="out-display-opt-btn'+(em==='all'?' active':'')+'" data-out-mode="all" onclick="setOutDisplayMode(\'all\')">'+allIcon+'All</button>';
  html+='<button type="button" class="out-display-opt-btn'+(em==='group'?' active':'')+'" data-out-mode="group" onclick="setOutDisplayMode(\'group\')">'+grpIcon+'Groups</button>';
  html+='</div>';
  html+='</div>';
  if(em==='group'){
    html+='<div>';
    html+='<div class="out-display-sec-lbl">Tampilan</div>';
    html+='<div class="out-display-grid-row">';
    _OUT_GRID_OPTS.forEach(function(g){
      html+='<button type="button" class="out-display-opt-btn'+(gridVal===g.c?' active':'')+'" data-out-grid="'+g.c+'" onclick="setOutDisplayGrid('+g.c+')">'+g.lbl+'</button>';
    });
    html+='</div>';
    html+='</div>';
  }
  body.innerHTML=html;
}

function openOutDisplayModal(){
  renderOutDisplayModal();
  var ov=document.getElementById('out-display-modal');
  if(ov) ov.classList.add('open');
}

function closeOutDisplayModal(){
  var ov=document.getElementById('out-display-modal');
  if(ov) ov.classList.remove('open');
}

function toggleOutGroupSelect(key){
  var idx=_outSelectedGroups.indexOf(key);
  if(idx===-1) _outSelectedGroups.push(key);
  else _outSelectedGroups.splice(idx,1);
  renderTab('output');
}

function toggleOutGroupTrash(){
  if(!_outGroupEdit){
    _outGroupEdit=true;
    _outSelectedGroups=[];
    renderTab('output');
    return;
  }
  if(!_outSelectedGroups.length){
    _outGroupEdit=false;
    renderTab('output');
    return;
  }
  var selMap={};
  _outSelectedGroups.forEach(function(k){selMap[k]=true;});
  var before=outputs.length;
  outputs=outputs.filter(function(o){return !selMap[_outGroup(o)];});
  var deleted=before-outputs.length;
  _outSelectedGroups=[];
  _outGroupEdit=false;
  if(!outputs.length) _outActiveGroup=null;
  updateBadges();
  renderTab('output');
  if(typeof showToast==='function'&&deleted>0) showToast(deleted+' output dihapus');
}

function renderOutput(el){
  if(!outputs.length){
    _outGroupEdit=false;
    _outSelectedGroups=[];
    _outActiveGroup=null;
    el.innerHTML='<div style="text-align:center;padding:48px 16px;border-top:1px solid var(--line-soft);border-bottom:1px solid var(--line-soft)"><div style="color:var(--ink);font-size:15px;font-weight:600;margin-bottom:6px">No outputs yet</div><div style="color:var(--ink-muted);font-size:13px">Run a statistical procedure from Analyze to inspect tables and plots here.</div></div>';
    return;
  }

  var groups=_outGroups();
  var groupKeyMap={};
  groups.forEach(function(g){groupKeyMap[g.key]=true;});
  _outSelectedGroups=_outSelectedGroups.filter(function(k){return !!groupKeyMap[k];});

  var em=_outMode;
  var ag=_outActiveGroup;
  var gridVal=_outNormalizeGrid(_outGrid);
  if(em!=='group'||ag){
    _outGroupEdit=false;
    _outSelectedGroups=[];
  }

  var trashSvg='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>';
  var phoneSvg='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>';
  var copySvg='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  var exportSvg='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';

  var html='';

  // ── Top toolbar ──────────────────────────────────────────────────────
  html+='<div class="out-toolbar">';
  html+='<div class="out-toolbar-left">';
  // Desktop inline Mode + Grid controls (hidden on mobile <768px)
  html+='<div class="out-inline-controls">';
  html+='<div class="out-seg-wrap">';
  html+='<button type="button" class="out-seg-btn'+(em==='all'?' active':'')+'" onclick="setOutDisplayMode(\'all\')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>All</button>';
  html+='<button type="button" class="out-seg-btn'+(em==='group'&&!ag?' active':'')+'" onclick="setOutDisplayMode(\'group\')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>Groups</button>';
  html+='</div>';
  if(em==='group'){
    html+='<div class="out-seg-wrap">';
    html+='<button type="button" class="out-grid-toggle-btn" onclick="_outGridOpen=!_outGridOpen;renderTab(\'output\')" title="'+(_outGridOpen?'Sembunyikan':'Tampilkan')+' pilihan grid" style="margin-right:'+(_outGridOpen?'2':'0')+'px">Tampilan<span style="font-size:9px;opacity:.75">'+(_outGridOpen?'\u25C2':'\u25B8')+'</span></button>';
    if(_outGridOpen){
      _OUT_GRID_OPTS.forEach(function(g){
        var active=gridVal===g.c;
        html+='<button type="button" class="out-grid-opt-btn'+(active?' active':'')+'" onclick="setOutDisplayGrid('+g.c+')" title="'+g.lbl+' grid">'+g.lbl+'</button>';
      });
    }
    html+='</div>';
  }
  html+='</div>';
  // Breadcrumb when inside a group (visible on both desktop and mobile)
  if(em==='group'&&ag){
    var crCol=_outGroupColor(ag);
    html+='<div style="display:flex;align-items:center;gap:8px">';
    html+='<button type="button" onclick="_outActiveGroup=null;_outGroupEdit=false;_outSelectedGroups=[];renderTab(\'output\')" class="btn btn-ghost btn-sm"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;margin-right:4px"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>All Groups</button>';
    html+='<span style="font-size:13px;font-weight:700;color:'+crCol+';display:flex;align-items:center;gap:5px">'+_outGroupIcon(ag)+' '+escHtml(ag)+'</span>';
    html+='</div>';
  }
  html+='</div>';
  // Right: result count / edit status + group trash icon + mobile display settings icon
  html+='<div class="out-toolbar-right">';
  if(_outGroupEdit&&_outSelectedGroups.length>0){
    html+='<span class="out-sel-count">'+_outSelectedGroups.length+' dipilih</span>';
  } else {
    html+='<span class="out-count-txt">'+outputs.length+' result'+(outputs.length>1?'s':'')+'</span>';
  }
  if(em==='group'&&!ag){
    var trashLabel=_outGroupEdit
      ?(_outSelectedGroups.length>0?'Hapus grup terpilih ('+_outSelectedGroups.length+')':'Keluar dari mode edit')
      :'Pilih grup untuk dihapus';
    html+='<button type="button" id="out-group-trash-btn" class="out-icon-btn out-trash-btn'+(_outGroupEdit?' is-edit':'')+'" onclick="toggleOutGroupTrash()" title="'+trashLabel+'" aria-label="'+trashLabel+'">'+trashSvg+'</button>';
  }
  html+='<button type="button" id="out-display-modal-btn" class="out-icon-btn out-mob-only" onclick="openOutDisplayModal()" title="Tampilan Output" aria-label="Pengaturan tampilan output">'+phoneSvg+'</button>';
  html+='</div>';
  html+='</div>';

  // ── GROUP VIEW: preview grid ─────────────────────────────────────────
  if(em==='group' && !ag){
    html+='<div class="out-grp-grid'+(gridVal>=3?' is-compact':'')+'" style="--out-cols:'+gridVal+'">';
    groups.forEach(function(g){
      var col=_outGroupColor(g.key);
      var grpOuts=outputs.filter(function(o){return _outGroup(o)===g.key;});
      var escapedKey=g.key.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
      var isSel=_outGroupEdit&&_outSelectedGroups.indexOf(g.key)!==-1;
      var clickHandler=_outGroupEdit
        ?'toggleOutGroupSelect(\''+escapedKey+'\')'
        :'_outActiveGroup=\''+escapedKey+'\';renderTab(\'output\')';
      html+='<div onclick="'+clickHandler+'" class="out-grp-card'+(isSel?' is-selected':'')+'" style="border-top-color:'+col+'" data-group-key="'+escHtml(g.key)+'">';
      html+='<div class="orias-facet-corner" aria-hidden="true"></div>';
      html+='<div class="out-grp-card-hdr">';
      if(_outGroupEdit){
        html+='<input type="checkbox" class="out-grp-chk"'+(isSel?' checked':'')+' onclick="event.stopPropagation();toggleOutGroupSelect(\''+escapedKey+'\')" aria-label="Pilih grup '+escHtml(g.key)+'">';
      }
      html+='<span style="color:'+col+';display:flex;flex-shrink:0">'+_outGroupIcon(g.key)+'</span>';
      html+='<span class="out-grp-card-name">'+escHtml(g.key)+'</span>';
      html+='<span class="out-grp-card-cnt">'+g.count+'</span>';
      html+='</div>';
      grpOuts.slice(0,2).forEach(function(o){
        html+='<div class="out-grp-preview" style="font-size:11.5px;color:var(--ink-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px">'+escHtml(o.title)+'</div>';
      });
      if(g.count>2) html+='<div class="out-grp-preview" style="font-size:11px;color:var(--ink-subtle);margin-top:2px">+'+(g.count-2)+' more</div>';
      html+='<div class="out-grp-preview" style="font-size:10.5px;color:var(--ink-subtle);margin-top:10px;font-variant-numeric:tabular-nums">Latest: '+new Date(grpOuts[0].id).toLocaleTimeString()+'</div>';
      if(!_outGroupEdit){
        html+='<div class="out-grp-open" style="position:absolute;bottom:12px;right:14px;font-size:11.5px;font-weight:600;color:var(--ink)">Open</div>';
      }
      html+='</div>';
    });
    html+='</div>';
    el.innerHTML=html;
    return;
  }

  // ── ALL VIEW or GROUP DETAIL VIEW: render output blocks ─────────────
  var toShow=outputs;
  if(em==='group'&&ag){
    toShow=outputs.filter(function(o){return _outGroup(o)===ag;});
    var subTitles=[];
    toShow.forEach(function(o){if(subTitles.indexOf(o.title)===-1)subTitles.push(o.title);});
    if(subTitles.length>1){
      html+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;padding:10px 12px;background:var(--surface);border-radius:var(--r-sm);border:1px solid var(--line-soft)">';
      html+='<span style="font-size:11px;color:var(--ink-subtle);align-self:center;margin-right:4px;font-weight:600">Tests:</span>';
      subTitles.forEach(function(sub){
        var cnt=toShow.filter(function(o){return o.title===sub;}).length;
        html+='<div style="background:var(--surface-alt);border:1px solid var(--line-soft);border-radius:var(--r-sm);padding:4px 10px;font-size:11.5px;color:var(--ink);display:flex;align-items:center;gap:6px">';
        html+=escHtml(sub);
        if(cnt>1) html+='<span style="background:var(--surface);color:var(--ink-muted);border:1px solid var(--line-soft);border-radius:var(--r-sm);padding:0 6px;font-size:10px;font-weight:700;font-variant-numeric:tabular-nums">×'+cnt+'</span>';
        html+='</div>';
      });
      html+='</div>';
    }
  }

  // In All mode: always 1-column stack (mobile and clean readability).
  // In Group detail: uses gridVal on >=768px desktop, 1-column on mobile.
  var _cols=(em==='group'&&ag)?gridVal:1;
  var _gridClass='out-cards-grid '+(em==='all'?'out-mode-all':'out-mode-group-detail'+(_cols>1?' has-cols':''));
  html+='<div class="'+_gridClass+'" style="--out-cols:'+_cols+'">';

  toShow.forEach(function(o){
    var grpColor=_outGroupColor(_outGroup(o));
    var _isCompact=_cols>1;
    html+='<div class="out-item" style="border-top-color:'+grpColor+';margin-bottom:0;overflow:hidden'+ (_isCompact?';min-width:0':'')+'">';
    html+='<div class="orias-facet-corner" aria-hidden="true"></div>';
    html+='<div class="out-card-head">';
    html+='<div class="out-card-title-wrap">';
    html+='<span class="out-card-grp-badge" style="color:'+grpColor+'">'+_outGroup(o)+'</span>';
    html+='<div class="sec-hd out-card-title">'+escHtml(o.title)+'</div>';
    html+='</div>';
    html+='<div class="out-card-actions">';
    html+='<span class="out-card-time">'+new Date(o.id).toLocaleTimeString()+'</span>';
    html+='<button type="button" class="out-icon-btn" id="apacopy-'+o.id+'" data-icon-only="1" onclick="copyAPA('+o.id+',this)" title="Copy APA" aria-label="Copy APA">'+copySvg+'</button>';
    html+='<button type="button" class="out-icon-btn" onclick="_exportOutputDialog('+o.id+')" title="Export" aria-label="Export">'+exportSvg+'</button>';
    html+='<button type="button" class="out-icon-btn" onclick="removeOutput('+o.id+')" title="Remove output" aria-label="Remove output">'+trashSvg+'</button>';
    html+='</div>';
    html+='</div>';
    if(o.type==='descriptive'){
      html+=renderOutBasic_descriptive(o);
    }
    else if(o.type==='ttest'){
      html+=renderOutBasic_ttest(o);
    }
    else if(o.type==='paired'){
      html+=renderOutBasic_paired(o);
    }
    else if(o.type==='rmanova'&&o.res){
      html+=renderOutBasic_rmanova(o);
    }
    else if(o.type==='onesamp'){
      html+=renderOutBasic_onesamp(o);
    }
    else if(o.type==='anova'){
      html+=renderOutBasic_anova(o);
    }
    else if(o.type==='anova2'){
      html+=renderOutBasic_anova2(o);
    }
    else if(o.type==='anova3'){
      html+=renderOutBasic_anova3(o);
    }
    else if(o.type==='correlation'){
      html+=renderOutBasic_correlation(o);
    }
    else if(o.type==='partialCorr'){
      html+=renderOutBasic_partialCorr(o);
    }
    else if(o.type==='canonicalCorr'){
      html+=renderOutBasic_canonicalCorr(o);
    }
    else if(o.type==='regression'){
      html+=renderOutBasic_regression(o);
    }
    else if(o.type==='multipleReg'){
      html+=renderOutBasic_multipleReg(o);
    }
    else if(o.type==='hierarchicalReg'&&o.res){
      html+=renderOutBasic_hierarchicalReg(o);
    }
    else if(o.type==='logistic'){
      html+=renderOutBasic_logistic(o);
    }
    else if(o.type==='mannwhitney'){
      html+=renderOutBasic_mannwhitney(o);
    }
    else if(o.type==='kruskal'){
      html+=renderOutBasic_kruskal(o);
    }
    else if(o.type==='wilcoxon'){
      html+=renderOutBasic_wilcoxon(o);
    }
    else if(o.type==='glm'){
      html+=renderOutBasic_glm(o);
    }
    else if(o.type==='repeated'&&o.res){
      html+=renderOutBasic_repeated(o);
    }
    else if(o.type==='poisson'){
      html+=renderOutBasic_poisson(o);
    }
    else if(o.type==='negbin'){
      html+=renderOutBasic_negbin(o);
    }
    else if(o.type==='manova'){
      html+=renderOutBasic_manova(o);
    }
    else if(o.type==='hlm'){
      if(o.res&&o.res.subtype==='hlm-3level') html+=renderOutAdv_hlm_threelevel(o);
      else if(o.res&&o.res.subtype==='hlm-2level') html+=renderOutAdv_hlm_twolevel(o);
      else html+=renderOutAdv_hlm_icc(o);
    }
    else if(o.type==='alpha'){
      html+=renderOutAdv_alpha(o);
    }
    else if(o.type==='kappa'){
      html+=renderOutAdv_kappa(o);
    }
    else if(o.type==='efa'){
      html+=renderOutAdv_efa(o);
    }
    else if(o.type==='cfa'){
      html+=renderOutAdv_cfa(o);
    }
    else if(o.type==='sem'){
      html+=renderOutAdv_sem(o);
    }
    else if(o.type==='mediation'){
      html+=renderOutAdv_mediation(o);
    }
    else if(o.type==='discriminant'&&o.res){
      html+=renderOutAdv_discriminant(o);
    }
    else if(o.type==='cluster'&&o.res){
      html+=renderOutAdv_cluster(o);
    }
    else if(o.type==='poweranalysis'&&o.res){
      html+=renderPowerOutput(o);
    }
    else if(o.type==='moderation'&&o.res){
      html+=renderModerationOutput(o);
    }
    else if(o.type==='mi'&&o.res){
      html+=renderOutAdv_mi(o);
    }
    else if(o.type==='roc'&&o.res){
      html+=renderOutAdv_roc(o);
    }
    else if(o.type==='survival'&&o.res){
      html+=renderOutAdv_survival(o);
    }
    else if(o.type==='cox'&&o.res){
      html+=renderOutAdv_cox(o);
    }
    else if(o.type==='bayes_ttest'&&o.res){
      html+=renderOutAdv_bayes_ttest(o);
    }
    else if(o.type==='bayes_corr'&&o.res){
      html+=renderOutAdv_bayes_corr(o);
    }
    else if(o.type==='bayes_posterior'&&o.res){
      html+=renderOutAdv_bayes_posterior(o);
    }
    else if(o.type==='timeseries'&&o.res){
      html+=renderOutAdv_timeseries(o);
    }
    else if(o.type==='metaanalysis'&&o.res){
      html+=renderOutAdv_metaanalysis(o);
    }

    // ── Interpretation summary ────────────────────────────────────────
    try{var _interp=_buildInterp(o);if(_interp)html+=_interpBox(_interp);}catch(e){}

    html+='</div>';
  });
  html+='</div>'; // end grid wrapper
  el.innerHTML=html;
}

function removeOutput(id){
  outputs=outputs.filter(function(o){return o.id!==id;});
  updateBadges();
  renderTab('output');
}

