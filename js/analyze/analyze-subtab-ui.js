// Analyze sub-tab state
var aState = {
  // Descriptive
  dFld: '',
  // T-Test
  ttV: '', ttG: '',
  // One-Sample T-Test
  osV: '', osMu0: 0,
  // Paired T-Test
  pairedA: '', pairedB: '',
  // ANOVA
  avV: '', avG: '', avPost: true, avPostMethod: 'tukey',
  // Two-Way ANOVA
  av2V:'', av2A:'', av2B:'',
  // Three-Way ANOVA
  av3V:'', av3A:'', av3B:'', av3C:'',
  // Correlation
  crX: '', crY: '', crType: 'pearson',
  // Partial Correlation
  pcX: '', pcY: '', pcZ: '',
  // Canonical Correlation
  ccaXs: [], ccaYs: [],
  // Regression
  regX: '', regY: '',
  // Multiple Regression
  mrXs: [], mrY: '',
  // Nonparametric
  npV: '', npG: '', npType: 'mannwhitney',
  // Crosstab
  ctRow: '', ctCol: '',
  // Transform
  trFld: '', trType: 'zscore', trNewName: '',
  // Compute
  computeName: '', computeExpr: '',
  // Recode
  recodeFld: '', recodeType: 'range', recodeNewName: '',
  // Filter
  filterExpr: '', filterActive: false,
  // Imputation
  imputeFld: '', imputeMethod: 'mean',
  // Corr Matrix
  cmFields: [],
  // Charts
  chType: 'histogram', chV: '', chG: '', scX: '', scY: '',
  // GLM Univariate / MANOVA / Repeated Measures
  glmDep: '', glmFactors: [], glmCovs: [], glmSubType:'univariate', glmMultiDeps: [], glmBetween: '',
  // Count regression (Poisson / Negative Binomial)
  cntDep: '', cntPreds: [], cntOffset: '',
  // HLM – Hierarchical Linear Model
  hlmDep: '', hlmGroup: '', hlmGroup2: '', hlmL1Preds: [], hlmL2Preds: [], hlmModelType: 'intercept',
  // Reliability
  alphaVars: [],
  // Kappa
  kappaR1: '', kappaR2: '', kappaWeighted: false,
  // EFA
  efaVars: [], efaFactors: 2, efaRotation: 'varimax',
  // CFA
  cfaVars: [], cfaFactors: 1, cfaFactorNames: ['F1'], cfaFactorMap: {},
  // Mediation
  medX: '', medM: [], medY: '', medBootN: 5000,
  // SEM
  semLatents: [], semLatentMap: {}, semPaths: [],
  semMode: 'measurement', semPathFrom: '', semPathTo: '',
  // Logistic Regression
  lgY: '', lgXs: [], lgType: 'binary',
  // Hierarchical Regression
  hrY: '', hrBlocks: [[],[]],
  // Power Analysis
  pwTest: 'ttest_2samp', pwAlpha: 0.05, pwPower: 0.80, pwEffect: 0.5,
  pwEffectType: 'd', pwGroups: 2, pwTails: 2, pwSolve: 'n',
  pwN: 30, pwN1: null, pwN2: null,
  pwPreds: 1, // jumlah prediktor u (hanya regression_r2)
  // Moderation
  modX: '', modW: '', modY: '', modCovs: [], modCenter: true,
  modBootN: 5000, modFloodlight: true,
  // Multiple Imputation
  miVars: [], miM: 5, miMethod: 'pmm', miSeed: 42,
  // ROC Curve
  rocProb: '', rocTrue: '', rocPosClass: '',
  rocCompare: [],
  // Survival Analysis
  survTime: '', survEvent: '', survGroup: '', survCovs: [], survMethod: 'km',
  survCutpoints: [],
  // Time Series
  tsV: '', tsMod: 'arima', tsP: 1, tsD: 1, tsQ: 1,
  tsDType: 'additive', tsPeriod: 12,
  // Meta-Analysis
  metaStudies: [], metaModel: 'random', metaEffect: 'd',
  metaNewStudy: {name:'',yi:'',vi:'',ni:''},
  // Weight Cases
  wcVar: '', wcActive: false, wcOrigData: null,
};

// UTILITIES — field helpers (dipakai lintas fitur: Data View, Pivot,
// Missing Data Analysis, Transform, dll)
var numFields=()=>vars.filter(v=>v.type==='Numeric'&&v.name!=='id').map(v=>v.name);
var allFields=()=>vars.map(v=>v.name);
var isMiss=v=>v===null||v===undefined||v==='';
var missCount=()=>vars.map(v=>({name:v.name,count:data.filter(r=>isMiss(r[v.name])).length}));

//  Sliding pill indicator for .sub-tabs groups 
var _subTabAnim={grp:null,left:0,width:0};
function positionSubTabIndicator(el,grp){
  var wrap=el.querySelector('.sub-tabs');
  var ind=wrap&&wrap.querySelector('.sub-tab-indicator');
  var activeBtn=wrap&&wrap.querySelector('.sub-btn.active');
  if(!wrap||!ind||!activeBtn) return;
  var targetLeft=activeBtn.offsetLeft;
  var targetWidth=activeBtn.offsetWidth;
  var sameGroup=_subTabAnim.grp===grp;
  ind.style.transition='none';
  ind.style.left=(sameGroup?_subTabAnim.left:targetLeft)+'px';
  ind.style.width=(sameGroup?_subTabAnim.width:targetWidth)+'px';
  // force reflow so the browser registers the start position before animating
  void ind.offsetWidth;
  ind.style.transition='';
  ind.style.left=targetLeft+'px';
  ind.style.width=targetWidth+'px';
  _subTabAnim={grp:grp,left:targetLeft,width:targetWidth};
}
// Keep the pill aligned if the window/sidebar is resized (no slide animation, just snap)
window.addEventListener('resize',function(){
  var el=document.getElementById('app-content');
  if(!el) return;
  var wrap=el.querySelector('.sub-tabs');
  var ind=wrap&&wrap.querySelector('.sub-tab-indicator');
  var activeBtn=wrap&&wrap.querySelector('.sub-btn.active');
  if(!wrap||!ind||!activeBtn) return;
  ind.style.transition='none';
  ind.style.left=activeBtn.offsetLeft+'px';
  ind.style.width=activeBtn.offsetWidth+'px';
  void ind.offsetWidth;
  ind.style.transition='';
  _subTabAnim={grp:currentGroup,left:activeBtn.offsetLeft,width:activeBtn.offsetWidth};
});
