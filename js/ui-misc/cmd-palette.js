// ════════════════════════════════════════════════════════════
// js/ui-misc/cmd-palette.js
// Fitur (I4): Command Palette (Ctrl/Cmd+K, tombol search di top bar &
//   sidebar) — daftar CMD_ACTIONS, filter pencarian, navigasi keyboard.
// Depends on (dibaca runtime di dalam function body / closure CMD_ACTIONS,
//   tidak ada pemanggilan saat parse — aman dimuat sebelum app.js):
//   switchTab (router.js), openAnalyze / saveSession / exportDataCSV /
//   exportToExcel / exportWordDialog / generateAPAReport /
//   showAddDatasetModal / dll (app.js & file split lain), elemen DOM
//   #cmd-ov #cmd-inp #cmd-list (index.html).
// Dipanggil oleh: index.html (onclick openCmd/closeCmd, oninput/onkeydown
//   renderCmdResults/cmdKeyNav), js/core/router.js (Ctrl+K, Escape),
//   js/ui-misc/custom-select.js (Escape -> closeCmd).
// Catatan: dipindah byte-exact dari app.js (I4, 2026-10-04); tidak ada
//   perubahan logic. Label menu "Orias AI" ikut dari perubahan I3.
// ════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════
// CMD PALETTE
// ════════════════════════════════════════════════════════════
var cmdOpen=false,cmdSelIdx=0;

function openCmd(){
  cmdOpen=true;
  var ov=document.getElementById('cmd-ov');
  if(ov){
    ov.classList.add('open');
    renderCmdResults('');
    // Only auto-focus on desktop — on mobile it would pop the keyboard immediately
    var inp=document.getElementById('cmd-inp');
    if(inp&&!/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)){
      inp.focus();
    } else if(inp) {
      inp.blur();
    }
  }
}
function closeCmd(){
  cmdOpen=false;
  var ov=document.getElementById('cmd-ov');
  if(ov)ov.classList.remove('open');
}

var CMD_ACTIONS=[
  // ── Navigation ──
  {label:'Data View',fn:function(){switchTab('data');}},
  {label:'Variable View',fn:function(){switchTab('variable');}},
  {label:'Syntax Editor',fn:function(){switchTab('syntax');}},
  {label:'Pivot Table',fn:function(){switchTab('pivot');}},
  {label:'Orias AI',fn:function(){switchTab('ai');}},
  {label:'Output',fn:function(){switchTab('output');}},

  // ── Descriptive ──
  {label:'Descriptive Statistics',fn:function(){openAnalyze('descriptive');}},

  // ── T-Test ──
  {label:'Independent Samples T-Test',fn:function(){openAnalyze('ttest');}},
  {label:'One-Sample T-Test',fn:function(){openAnalyze('onesamp');}},
  {label:'Paired Samples T-Test',fn:function(){openAnalyze('paired');}},

  // ── ANOVA ──
  {label:'One-Way ANOVA',fn:function(){openAnalyze('anova');}},
  {label:'Two-Way ANOVA',fn:function(){openAnalyze('anova2');}},
  {label:'Three-Way ANOVA',fn:function(){openAnalyze('anova3');}},
  {label:'Repeated Measures ANOVA (RM-ANOVA)',fn:function(){openAnalyze('rmanova');}},

  // ── Correlation ──
  {label:'Pearson / Spearman Correlation',fn:function(){openAnalyze('correlation');}},
  {label:'Canonical Correlation',fn:function(){openAnalyze('canonicalcorr');}},
  {label:'Correlation Matrix',fn:function(){openAnalyze('corrmatrix');}},
  {label:'Partial Correlation',fn:function(){openAnalyze('partialcorr');}},

  // ── Regression ──
  {label:'Simple Linear Regression',fn:function(){openAnalyze('regression');}},
  {label:'Multiple Regression',fn:function(){openAnalyze('multipleReg');}},
  {label:'Hierarchical Regression (Block 1, Block 2, ΔR²)',fn:function(){openAnalyze('hierarchicalReg');}},
  {label:'Logistic Regression (Binary & Multinomial)',fn:function(){openAnalyze('logistic');}},

  // ── Nonparametric ──
  {label:'Nonparametric Tests',fn:function(){openAnalyze('nonparam');}},

  // ── GLM ──
  {label:'General Linear Model — Univariate (GLM)',fn:function(){openAnalyze('glm','glm');}},
  {label:'General Linear Model — Multivariate (GLM)',fn:function(){openAnalyze('glm-multi','glm');}},
  {label:'General Linear Model — Repeated Measures (GLM)',fn:function(){openAnalyze('glm-rep','glm');}},

  // ── HLM / Multilevel ──
  {label:'Multilevel Model — Two-Level (HLM)',fn:function(){openAnalyze('hlm-2level','hlm');}},
  {label:'Multilevel Model — Three-Level (HLM)',fn:function(){openAnalyze('hlm-3level','hlm');}},
  {label:'ICC & Variance Components (HLM)',fn:function(){openAnalyze('hlm-icc','hlm');}},

  // ── Reliability ──
  {label:'Reliability Analysis / Cronbach Alpha',fn:function(){openAnalyze('reliability');}},
  {label:"Cohen's Kappa (Inter-Rater Reliability)",fn:function(){openAnalyze('kappa','reliability');}},

  // ── Crosstab ──
  {label:'Crosstab / Chi-Square',fn:function(){openAnalyze('crosstab');}},

  // ── Factor Analysis ──
  {label:'Exploratory Factor Analysis (EFA)',fn:function(){openAnalyze('efa','factor');}},
  {label:'Confirmatory Factor Analysis (CFA) — Fit Indices',fn:function(){openAnalyze('cfa','factor');}},

  // ── SEM ──
  {label:'Structural Equation Modeling (SEM)',fn:function(){openAnalyze('sem','sem');}},

  // ── Mediation ──
  {label:'Mediation Analysis (Sobel / Bootstrap)',fn:function(){openAnalyze('mediation');}},

  // ── Moderation ──
  {label:'Moderation Analysis (Interaction)',fn:function(){openAnalyze('moderation');}},
  {label:'Simple Slopes Analysis',fn:function(){openAnalyze('simpleslopes','moderation');}},
  {label:'Johnson-Neyman Technique',fn:function(){openAnalyze('jn','moderation');}},

  // ── Discriminant & Cluster ──
  {label:'Discriminant Analysis (LDA)',fn:function(){openAnalyze('discriminant');}},
  {label:'Cluster Analysis (K-Means & Hierarchical)',fn:function(){openAnalyze('cluster');}},

  // ── Missing Data ──
  {label:"Missing Data Analysis (Little's MCAR + Pattern Matrix)",fn:function(){openAnalyze('missinganalysis');}},

  // ── Power Analysis ──
  {label:'Power Analysis',fn:function(){openAnalyze('poweranalysis');}},
  {label:'Power Curves',fn:function(){openAnalyze('powerplot','poweranalysis');}},
  {label:'Sensitivity Analysis (Power)',fn:function(){openAnalyze('sensitivity','poweranalysis');}},

  // ── Bayesian ──
  {label:'Bayesian Factor — T-Test',fn:function(){openAnalyze('bayesian');}},
  {label:'Bayesian Factor — Correlation',fn:function(){openAnalyze('bayesian_corr','bayesian');}},
  {label:'Bayesian Posterior Distribution',fn:function(){openAnalyze('bayesian_posterior','bayesian');}},

  // ── ROC ──
  {label:'ROC Curve Analysis',fn:function(){openAnalyze('roc');}},
  {label:'Compare ROC Curves',fn:function(){openAnalyze('roc_compare','roc');}},

  // ── Survival ──
  {label:'Survival Analysis',fn:function(){openAnalyze('survival');}},
  {label:'Kaplan-Meier (KM) Survival',fn:function(){openAnalyze('km','survival');}},
  {label:'Log-Rank Test',fn:function(){openAnalyze('logrank','survival');}},
  {label:'Cox Proportional Hazards Regression',fn:function(){openAnalyze('cox','survival');}},

  // ── Time Series ──
  {label:'ARIMA & Time Series Decomposition',fn:function(){openAnalyze('timeseries');}},

  // ── Meta-Analysis ──
  {label:'Meta-Analysis (Forest Plot)',fn:function(){openAnalyze('metaanalysis');}},

  // ── Charts ──
  {label:'Charts & Visualizations',fn:function(){openAnalyze('charts');}},

  // ── Transform / Data Tools ──
  {label:'Transform Variable (Compute)',fn:function(){openAnalyze('transform');}},
  {label:'Recode Variable',fn:function(){openAnalyze('recode');}},
  {label:'Filter Cases',fn:function(){openAnalyze('filter');}},
  {label:'Weight Cases (Frequency Weighting)',fn:function(){openAnalyze('weightcases','weightcases');}},
  {label:'Single Imputation',fn:function(){openAnalyze('impute','imputation');}},
  {label:'Multiple Imputation (MI)',fn:function(){openAnalyze('mi','imputation');}},

  // ── Session / Export ──
  {label:'Save Session',fn:function(){saveSession();}},
  {label:'Import CSV',fn:function(){document.getElementById('csv-input').click();}},
  {label:'Export CSV',fn:function(){exportDataCSV();}},
  {label:'Export to Excel (.xlsx)',fn:function(){exportToExcel();}},
  {label:'Export to Word (.doc)',fn:function(){exportWordDialog();}},
  {label:'APA Report (text)',fn:function(){generateAPAReport();}},
  {label:'New Dataset',fn:function(){showAddDatasetModal();}},
];

function renderCmdResults(q){
  var list=document.getElementById('cmd-list');if(!list)return;
  var items=q?CMD_ACTIONS.filter(function(a){return a.label.toLowerCase().includes(q.toLowerCase());}):CMD_ACTIONS;
  list.innerHTML=items.map(function(a,i){
    return '<div class="cmd-item" data-i="'+i+'" data-q="'+encodeURIComponent(q)+'" onclick="execCmdEl(this)">'+a.label+'</div>';
  }).join('');
  cmdSelIdx=0;
  var first=list.querySelector('.cmd-item');
  if(first)first.classList.add('active');
}
function execCmdEl(el){
  var i=parseInt(el.dataset.i),q=decodeURIComponent(el.dataset.q||'');
  var items=q?CMD_ACTIONS.filter(function(a){return a.label.toLowerCase().includes(q.toLowerCase());}):CMD_ACTIONS;
  if(items[i])items[i].fn();
  closeCmd();
}
function cmdKeyNav(e){
  var items=document.querySelectorAll('.cmd-item');
  if(e.key==='ArrowDown'){cmdSelIdx=Math.min(cmdSelIdx+1,items.length-1);}
  else if(e.key==='ArrowUp'){cmdSelIdx=Math.max(cmdSelIdx-1,0);}
  else if(e.key==='Enter'){var q=document.getElementById('cmd-inp').value||'';if(items[cmdSelIdx])execCmdEl(items[cmdSelIdx]);return;}
  items.forEach(function(el,i){el.classList.toggle('active',i===cmdSelIdx);});
  if(items[cmdSelIdx])items[cmdSelIdx].scrollIntoView({block:'nearest'});
}
