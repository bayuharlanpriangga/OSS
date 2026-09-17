// ── Analyze sub-tab state ─────────────────────────────────
// DIPINDAH dari app.js (C2, split roadmap OSS 2.0) — var aState +
// field helpers (numFields/allFields/isMiss/missCount). Dipindah apa
// adanya jadi global biasa, pola sama C1: aState adalah object literal
// murni (tidak baca `vars`/`data` sama sekali), dan numFields/allFields/
// isMiss/missCount membaca `vars`/`data` di dalam function body
// (runtime, bukan top-level) — aman dimuat sebelum app.js.
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
// ════════════════════════════════════════════════════════════════════════
var numFields=()=>vars.filter(v=>v.type==='Numeric'&&v.name!=='id').map(v=>v.name);
var allFields=()=>vars.map(v=>v.name);
var isMiss=v=>v===null||v===undefined||v==='';
var missCount=()=>vars.map(v=>({name:v.name,count:data.filter(r=>isMiss(r[v.name])).length}));
