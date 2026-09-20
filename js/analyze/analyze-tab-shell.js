// ANALYZE TAB SHELL — wrapper render tab Analyze: sidebar grup + daftar
function renderAnalyze(el){
  // Group definitions: each sidebar item maps to its own set of sub-tabs
  var GROUP_TABS={
    'descriptive':[
      {id:'descriptive',label:'Descriptive',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>'}
    ],
    'ttest':[
      {id:'ttest',label:'Independent T-Test',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 3h6m-3 0v7l-5 9a1 1 0 00.9 1.5h10.2a1 1 0 00.9-1.5L14 10V3"/></svg>'},
      {id:'onesamp',label:'One-Sample T',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>'},
      {id:'paired',label:'Paired Sample T',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>'}
    ],
    'anova':[
      {id:'anova',label:'One-Way ANOVA',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="10" width="5" height="10" rx="1"/><rect x="9.5" y="6" width="5" height="14" rx="1"/><rect x="17" y="2" width="5" height="18" rx="1"/></svg>'},
      {id:'anova2',label:'Two-Way ANOVA',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="8" width="4" height="12" rx="1"/><rect x="8" y="4" width="4" height="16" rx="1"/><rect x="14" y="8" width="4" height="12" rx="1"/><rect x="20" y="2" width="4" height="18" rx="1"/></svg>'},
      {id:'anova3',label:'Three-Way ANOVA',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="2 12 6 8 10 14 14 6 18 10 22 4"/><line x1="2" y1="20" x2="22" y2="20"/></svg>'},
      {id:'rmanova',label:'RM-ANOVA',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 12 7 8 11 14 15 6 19 10"/><path d="M3 20h18"/><polyline points="19 6 23 10"/></svg>'}
    ],
    'correlation':[
      {id:'correlation',label:'Correlation',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="6" cy="8" r="2" fill="currentColor"/><circle cx="16" cy="6" r="2" fill="currentColor"/><circle cx="5" cy="17" r="2" fill="currentColor"/><circle cx="14" cy="15" r="2" fill="currentColor"/><circle cx="19" cy="18" r="2" fill="currentColor"/></svg>'},
      {id:'canonicalcorr',label:'Canonical Corr',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="7" r="2" fill="currentColor"/><circle cx="5" cy="12" r="2" fill="currentColor"/><circle cx="5" cy="17" r="2" fill="currentColor"/><circle cx="19" cy="7" r="2" fill="currentColor"/><circle cx="19" cy="12" r="2" fill="currentColor"/><circle cx="19" cy="17" r="2" fill="currentColor"/><path d="M7 7 Q12 7 12 12 Q12 17 17 17" stroke-dasharray="none"/><path d="M7 17 Q12 17 12 12 Q12 7 17 7" stroke-dasharray="none" opacity="0.5"/></svg>'},
      {id:'corrmatrix',label:'Corr Matrix',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>'}
    ],
    'regression':[
      {id:'regression',label:'Simple Regression',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>'},
      {id:'multipleReg',label:'Multiple Reg',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="20" x2="18" y2="4"/><line x1="12" y1="20" x2="12" y2="10"/><line x1="6" y1="20" x2="6" y2="14"/><polyline points="2 10 6 6 10 10 14 4 18 8"/></svg>'},
      {id:'hierarchicalReg',label:'Hierarchical Reg',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="2" width="20" height="5" rx="1"/><rect x="2" y="9" width="14" height="5" rx="1"/><rect x="2" y="16" width="9" height="5" rx="1"/></svg>'},
      {id:'logistic',label:'Logistic Reg',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 20 Q6 4 12 12 Q18 20 22 4"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>'},
      {id:'glm-poisson',label:'Poisson Reg',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M8 12 Q10 7 12 12 Q14 17 16 12"/><line x1="3" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="21" y2="12"/></svg>'},
      {id:'glm-negbin',label:'Neg. Binomial Reg',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 20 Q5 10 8 14 Q11 18 14 10 Q17 2 22 8"/><circle cx="8" cy="14" r="2" fill="currentColor" opacity="0.5"/><circle cx="14" cy="10" r="2" fill="currentColor" opacity="0.5"/></svg>'}
    ],
    'nonparam':[
      {id:'nonparam',label:'Nonparametric',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>'}
    ],
    'glm':[
      {id:'glm',label:'Univariate',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="12" y1="9" x2="12" y2="21"/></svg>'},
      {id:'glm-multi',label:'Multivariate',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="3" width="18" height="18" rx="2"/><line x1="2" y1="8" x2="20" y2="8"/><line x1="2" y1="13" x2="20" y2="13"/><line x1="2" y1="18" x2="20" y2="18"/></svg>'},
      {id:'glm-rep',label:'Repeated Measures',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>'}
    ],
    'hlm':[
      {id:'hlm-2level',label:'Two-Level',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><ellipse cx="12" cy="6" rx="8" ry="2.5"/><path d="M4 6v6c0 1.38 3.58 2.5 8 2.5s8-1.12 8-2.5V6"/><path d="M4 12v6c0 1.38 3.58 2.5 8 2.5s8-1.12 8-2.5v-6"/></svg>'},
      {id:'hlm-3level',label:'Three-Level',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><ellipse cx="12" cy="4" rx="8" ry="2"/><path d="M4 4v4c0 1.1 3.58 2 8 2s8-.9 8-2V4"/><path d="M4 8v5c0 1.1 3.58 2 8 2s8-.9 8-2V8"/><path d="M4 13v5c0 1.1 3.58 2 8 2s8-.9 8-2v-5"/></svg>'},
      {id:'hlm-icc',label:'ICC & Variance',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 3v18"/><path d="M3.6 9h16.8"/><path d="M3.6 15h16.8"/></svg>'}
    ],
    'reliability':[
      {id:'reliability',label:'Cronbach Alpha',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>'},
      {id:'kappa',label:"Cohen's Kappa",ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4l7 7-7 7"/><path d="M13 4l7 7-7 7"/></svg>'}
    ],
    'crosstab':[
      {id:'crosstab',label:'Crosstab',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="1"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/></svg>'}
    ],
    'factor':[
      {id:'efa',label:'EFA',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><ellipse cx="12" cy="12" rx="10" ry="5"/><line x1="12" y1="7" x2="12" y2="17"/><path d="M2 12c3-4 7-6 10-6s7 2 10 6"/></svg>'},
      {id:'cfa',label:'CFA',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><circle cx="4" cy="6" r="2"/><circle cx="20" cy="6" r="2"/><circle cx="4" cy="18" r="2"/><circle cx="20" cy="18" r="2"/><line x1="6" y1="6" x2="10" y2="11"/><line x1="18" y1="6" x2="14" y2="11"/><line x1="6" y1="18" x2="10" y2="13"/><line x1="18" y1="18" x2="14" y2="13"/></svg>'}
    ],
    'sem':[
      {id:'sem',label:'SEM',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><ellipse cx="5" cy="12" rx="3" ry="3"/><ellipse cx="19" cy="5" rx="3" ry="3"/><ellipse cx="19" cy="19" rx="3" ry="3"/><line x1="8" y1="11" x2="16" y2="6.5"/><line x1="8" y1="13" x2="16" y2="17.5"/><line x1="16" y1="8" x2="16" y2="16"/></svg>'}
    ],
    'mediation':[
      {id:'mediation',label:'Mediation',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="12" r="2" fill="currentColor"/><circle cx="19" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="5" r="2" fill="currentColor"/><line x1="7" y1="12" x2="10" y2="12"/><line x1="14" y1="12" x2="17" y2="12"/><line x1="7" y1="11" x2="10" y2="6"/><line x1="14" y1="6" x2="17" y2="11"/></svg>'}
    ],
    'charts':[
      {id:'charts',label:'Charts',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><circle cx="8" cy="14" r="1.5" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/><circle cx="16" cy="14" r="1.5" fill="currentColor"/></svg>'}
    ],
    'discriminant':[
      {id:'discriminant',label:'Discriminant',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><ellipse cx="9" cy="12" rx="6" ry="9"/><ellipse cx="15" cy="12" rx="6" ry="9"/></svg>'}
    ],
    'cluster':[
      {id:'cluster',label:'Cluster Analysis',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="6" r="2" fill="currentColor"/><circle cx="12" cy="4" r="2" fill="currentColor"/><circle cx="7" cy="13" r="2" fill="currentColor"/><circle cx="17" cy="8" r="2" fill="currentColor"/><circle cx="19" cy="17" r="2" fill="currentColor"/><circle cx="13" cy="18" r="2" fill="currentColor"/></svg>'}
    ],
    'missinganalysis':[
      {id:'missinganalysis',label:'Missing Analysis',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/><circle cx="6" cy="6" r="1" fill="currentColor" stroke="none"/><line x1="14" y1="12" x2="18" y2="12" stroke-dasharray="1.5 1.5"/><line x1="14" y1="18" x2="18" y2="18" stroke-dasharray="1.5 1.5"/></svg>'}
    ],
    'poweranalysis':[
      {id:'poweranalysis',label:'Power Analysis',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>'},
      {id:'powerplot',label:'Power Curves',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>'},
      {id:'sensitivity',label:'Sensitivity',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"/></svg>'}
    ],
    'moderation':[
      {id:'moderation',label:'Moderation',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="12" r="2" fill="currentColor"/><circle cx="19" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="4" r="2" fill="currentColor"/><line x1="7" y1="12" x2="17" y2="12"/></svg>'},
      {id:'simpleslopes',label:'Simple Slopes',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="20" x2="18" y2="4"/><line x1="12" y1="20" x2="12" y2="10"/><line x1="6" y1="20" x2="6" y2="14"/></svg>'},
      {id:'jn',label:'Johnson-Neyman',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="2 20 7 10 12 15 17 5 22 12"/><line x1="2" y1="20" x2="22" y2="20"/></svg>'}
    ],
    'transform':[
      {id:'transform',label:'Transform',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>'},
      {id:'recode',label:'Recode',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>'},
      {id:'filter',label:'Filter',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>'}
    ],
    'imputation':[
      {id:'impute',label:'Single Imputation',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="8" width="20" height="8" rx="4"/><line x1="12" y1="10" x2="12" y2="14"/><line x1="10" y1="12" x2="14" y2="12"/></svg>'},
      {id:'mi',label:'Multiple Imputation',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="8" width="20" height="8" rx="4"/><line x1="6" y1="10" x2="6" y2="14"/><line x1="12" y1="10" x2="12" y2="14"/><line x1="18" y1="10" x2="18" y2="14"/></svg>'}
    ],
    'roc':[
      {id:'roc',label:'ROC Curve',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="2 20 6 14 10 17 15 8 20 4"/><line x1="2" y1="20" x2="22" y2="20"/><line x1="2" y1="2" x2="2" y2="20"/></svg>'},
      {id:'roc_compare',label:'Compare ROC',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="2 20 7 12 12 16 17 7 22 4"/><polyline points="2 20 7 15 12 18 17 10" stroke-dasharray="3 2"/><line x1="2" y1="20" x2="22" y2="20"/></svg>'}
    ],
    'survival':[
      {id:'survival',label:'Survival Analysis',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="2 20 6 20 6 14 10 14 10 10 14 10 14 7 18 7 18 4 22 4"/><line x1="2" y1="20" x2="22" y2="20"/></svg>'}
    ],
    'bayesian':[
      {id:'bayesian',label:'Bayes Factor (t-test)',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2a9 9 0 019 9c0 3-1.5 5.5-3.5 7.2"/><path d="M12 2a9 9 0 00-9 9c0 3 1.5 5.5 3.5 7.2"/><circle cx="12" cy="11" r="3"/></svg>'},
      {id:'bayesian_corr',label:'Bayes Factor (r)',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="6" cy="8" r="2" fill="currentColor"/><circle cx="16" cy="6" r="2" fill="currentColor"/><circle cx="5" cy="17" r="2" fill="currentColor"/><circle cx="18" cy="16" r="2" fill="currentColor"/></svg>'},
      {id:'bayesian_posterior',label:'Posterior Distribution',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 20 Q6 4 12 4 Q18 4 22 20"/><line x1="12" y1="4" x2="12" y2="20" stroke-dasharray="3,2"/></svg>'}
    ],
    'timeseries':[
      {id:'timeseries',label:'ARIMA & Decomposition',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>'}
    ],
    'metaanalysis':[
      {id:'metaanalysis',label:'Meta-Analysis',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="6" x2="18" y2="6"/><line x1="8" y1="12" x2="18" y2="12"/><line x1="8" y1="18" x2="18" y2="18"/><circle cx="4" cy="6" r="2"/><circle cx="4" cy="12" r="2"/><circle cx="4" cy="18" r="2"/></svg>'}
    ],
    'weightcases':[
      {id:'weightcases',label:'Weight Cases',ic:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.93 4.93l2.12 2.12m9.9 9.9l2.12 2.12M19.07 4.93l-2.12 2.12M7.05 16.95l-2.12 2.12"/></svg>'}
    ]
  };

  // Resolve group: prefer currentGroup, but if currentASub belongs to a different group, fix it
  var grp=currentGroup||'descriptive';
  var tabs=GROUP_TABS[grp]||GROUP_TABS['descriptive'];
  var validIds=tabs.map(function(t){return t.id;});
  // If currentASub not in current group, look it up in SUB_TO_GROUP and correct the group
  if(!validIds.includes(currentASub)){
    var resolvedGrp=typeof SUB_TO_GROUP!=='undefined'&&SUB_TO_GROUP[currentASub];
    if(resolvedGrp&&GROUP_TABS[resolvedGrp]){
      grp=resolvedGrp;
      currentGroup=grp;
      tabs=GROUP_TABS[grp];
      validIds=tabs.map(function(t){return t.id;});
    }
    // Only reset to first tab if sub truly doesn't exist anywhere
    if(!validIds.includes(currentASub)) currentASub=tabs[0].id;
  }

  // Auto-populate aState defaults from current vars
  var nF=numFields();var aF=allFields();
  if(!aState.dFld&&nF.length) aState.dFld=nF[0];
  if(!aState.ttV&&nF.length) aState.ttV=nF[0];
  if(!aState.ttG&&aF.length) aState.ttG=aF[aF.length>1?aF.length-1:0];
  if(!aState.osV&&nF.length) aState.osV=nF[0];
  if(!aState.pairedA&&nF.length>0) aState.pairedA=nF[0];
  if(!aState.pairedB&&nF.length>1) aState.pairedB=nF[1];
  if(!aState.avV&&nF.length) aState.avV=nF[0];
  if(!aState.avG&&aF.length) aState.avG=aF[aF.length>1?aF.length-1:0];
  if(!aState.crX&&nF.length>0) aState.crX=nF[0];
  // Sanitize aState: reset any field referencing a variable that no longer exists
  if(aState.dFld&&!nF.includes(aState.dFld)) aState.dFld='';
  if(aState.ttV&&!nF.includes(aState.ttV)) aState.ttV='';
  if(aState.ttG&&!aF.includes(aState.ttG)) aState.ttG='';
  if(aState.osV&&!nF.includes(aState.osV)) aState.osV='';
  if(aState.pairedA&&!nF.includes(aState.pairedA)) aState.pairedA='';
  if(aState.pairedB&&!nF.includes(aState.pairedB)) aState.pairedB='';
  if(aState.avV&&!nF.includes(aState.avV)) aState.avV='';
  if(aState.avG&&!aF.includes(aState.avG)) aState.avG='';
  if(aState.crX&&!nF.includes(aState.crX)) aState.crX='';
  if(aState.crY&&!nF.includes(aState.crY)) aState.crY='';
  if(aState.pcX&&!nF.includes(aState.pcX)) aState.pcX='';
  if(aState.pcY&&!nF.includes(aState.pcY)) aState.pcY='';
  if(aState.pcZ&&!nF.includes(aState.pcZ)) aState.pcZ='';
  if(aState.regX&&!nF.includes(aState.regX)) aState.regX='';
  if(aState.regY&&!nF.includes(aState.regY)) aState.regY='';
  if(aState.mrY&&!nF.includes(aState.mrY)) aState.mrY='';
  if(aState.mrXs) aState.mrXs=aState.mrXs.filter(function(f){return nF.includes(f);});
  if(aState.lgY&&!aF.includes(aState.lgY)) aState.lgY='';
  if(aState.lgXs) aState.lgXs=aState.lgXs.filter(function(f){return nF.includes(f);});
  if(aState.npV&&!nF.includes(aState.npV)) aState.npV='';
  if(aState.npG&&!aF.includes(aState.npG)) aState.npG='';
  if(aState.ctRow&&!aF.includes(aState.ctRow)) aState.ctRow='';
  if(aState.ctCol&&!aF.includes(aState.ctCol)) aState.ctCol='';
  if(aState.trFld&&!nF.includes(aState.trFld)) aState.trFld='';
  if(aState.imputeFld&&!nF.includes(aState.imputeFld)) aState.imputeFld='';
  if(aState.chV&&!nF.includes(aState.chV)) aState.chV='';
  if(aState.chG&&!aF.includes(aState.chG)) aState.chG='';
  if(aState.scX&&!nF.includes(aState.scX)) aState.scX='';
  if(aState.scY&&!nF.includes(aState.scY)) aState.scY='';
  if(aState.cmFields) aState.cmFields=aState.cmFields.filter(function(f){return nF.includes(f);});
  if(aState.glmDep&&!nF.includes(aState.glmDep)) aState.glmDep='';
  if(aState.glmFactors) aState.glmFactors=aState.glmFactors.filter(function(f){return aF.includes(f);});
  if(aState.glmCovs) aState.glmCovs=aState.glmCovs.filter(function(f){return nF.includes(f);});
  if(aState.glmMultiDeps) aState.glmMultiDeps=aState.glmMultiDeps.filter(function(f){return nF.includes(f);});
  if(aState.alphaVars) aState.alphaVars=aState.alphaVars.filter(function(f){return nF.includes(f);});
  if(aState.efaVars) aState.efaVars=aState.efaVars.filter(function(f){return nF.includes(f);});
  if(aState.medX&&!nF.includes(aState.medX)) aState.medX='';
  if(aState.medY&&!nF.includes(aState.medY)) aState.medY='';
  if(aState.medM) aState.medM=aState.medM.filter(function(f){return nF.includes(f);});
  if(aState.recodeFld&&!aF.includes(aState.recodeFld)) aState.recodeFld='';
  // Meta-Analysis: ensure arrays intact after session restore
  if(!Array.isArray(aState.metaStudies)) aState.metaStudies=[];
  if(!aState.metaModel) aState.metaModel='random';
  if(!aState.metaEffect) aState.metaEffect='d';
  if(!aState.metaNewStudy||typeof aState.metaNewStudy!=='object') aState.metaNewStudy={name:'',yi:'',vi:'',ni:''};

  if(!aState.crY&&nF.length>1) aState.crY=nF[1];
  if(!aState.pcX&&nF.length>0) aState.pcX=nF[0];
  if(!aState.pcY&&nF.length>1) aState.pcY=nF.length>1?nF[1]:nF[0];
  if(!aState.pcZ&&nF.length>2) aState.pcZ=nF[2];
  if(!aState.regX&&nF.length>0) aState.regX=nF[0];
  if(!aState.regY&&nF.length>1) aState.regY=nF[1];
  if(!aState.mrY&&nF.length) aState.mrY=nF[0];
  if(!aState.lgY) aState.lgY='';
  if(!aState.lgXs) aState.lgXs=[];
  if(!aState.lgType) aState.lgType='binary';
  if(!aState.npV&&nF.length) aState.npV=nF[0];
  if(!aState.npG&&aF.length) aState.npG=aF[aF.length>1?aF.length-1:0];
  if(!aState.ctRow&&aF.length>0) aState.ctRow=aF[0];
  if(!aState.ctCol&&aF.length>1) aState.ctCol=aF[1];
  if(!aState.trFld&&nF.length) aState.trFld=nF[0];
  if(!aState.imputeFld&&nF.length) aState.imputeFld=nF[0];
  if(!aState.chV&&nF.length) aState.chV=nF[0];
  if(!aState.scX&&nF.length>0) aState.scX=nF[0];
  if(!aState.scY&&nF.length>1) aState.scY=nF[1];
  if(!aState.cmFields||!Array.isArray(aState.cmFields)) aState.cmFields=[];
  if(!aState.cmFields.length&&nF.length) aState.cmFields=nF.slice(0,Math.min(6,nF.length));
  if(!aState.glmDep&&nF.length) aState.glmDep=nF[0];
  if(!aState.glmFactors) aState.glmFactors=[];
  if(!aState.glmCovs) aState.glmCovs=[];
  if(!aState.recodeFld&&aF.length) aState.recodeFld=aF[0];
  if(!aState.medX&&nF.length>0) aState.medX=nF[0];
  if(!aState.medY&&nF.length>1) aState.medY=nF[Math.min(1,nF.length-1)];
  if(!aState.medM||!aState.medM.length) aState.medM=nF.length>2?[nF[2]]:[];

  // Color map: group → sidebar icon color
  var _GC={
    'descriptive':'#f472b6','ttest':'#a78bfa','anova':'#34d399',
    'correlation':'#f472b6','regression':'#67e8f9','nonparam':'#c084fc',
    'glm':'#f9a8d4','hlm':'#a78bfa','reliability':'#34d399',
    'factor':'#a5f3fc','factoranalysis':'#a5f3fc','sem':'#e879f9','mediation':'#fb923c',
    'moderation':'#e879f9','charts':'#f472b6','discriminant':'#38bdf8',
    'cluster':'#4ade80','missinganalysis':'#f87171','poweranalysis':'#fbbf24',
    'roc':'#67e8f9','survival':'#4ade80','bayesian':'#f9a8d4',
    'timeseries':'#67e8f9','metaanalysis':'#fb923c','transform':'#fbbf24',
    'imputation':'#a5f3fc','crosstab':'#67e8f9','weightcases':'#fb923c'
  };
  var _gc=_GC[grp]||'#c084fc';
  var html='<div class="sub-tabs"><div class="sub-tab-indicator"></div>';
  tabs.forEach(function(s){
    var coloredIc=s.ic.replace(/stroke="currentColor"/g,'stroke="'+_gc+'"').replace(/fill="currentColor"/g,'fill="'+_gc+'"');
    html+='<button class="sub-btn'+(currentASub===s.id?' active':'')+'" onclick="switchASub(this.dataset.sub)" data-sub="'+s.id+'" style="display:inline-flex;align-items:center;gap:5px">'+coloredIc+' '+s.label+'</button>';
  });
  html+='</div><div id="a-content"></div>';
  el.innerHTML=html;
  positionSubTabIndicator(el,grp);
  renderASub();
}
