export const OSS_ENGINE_SCRIPTS: readonly string[] = [
  // 1. Core & state earliest
  '/oss-js/core/icons.js',
  '/oss-js/core/dialog.js',
  '/oss-js/core/watercolor-bg.js',
  '/oss-js/core/html-helpers.js',
  '/oss-js/core/app-helpers.js',
  '/oss-js/ui-misc/custom-select.js',

  // 2. Stats engine (modular per-domain modules under /oss-js/engine/)
  '/oss-js/engine/engine-core/engine-core-distributions.js',
  '/oss-js/engine/engine-core/engine-core-helpers.js',
  '/oss-js/engine/engine-core/engine-core-linear-solver.js',
  '/oss-js/engine/engine-core/engine-core-matrix.js',
  '/oss-js/engine/engine-descriptive/engine-descriptive.js',
  '/oss-js/engine/engine-anova/engine-anova-oneway.js',
  '/oss-js/engine/engine-anova/engine-anova-twoway.js',
  '/oss-js/engine/engine-anova/engine-anova-threeway.js',
  '/oss-js/engine/engine-anova/engine-anova-repeated.js',
  '/oss-js/engine/engine-ttest/engine-ttest-independent.js',
  '/oss-js/engine/engine-ttest/engine-ttest-onesample.js',
  '/oss-js/engine/engine-ttest/engine-ttest-paired.js',
  '/oss-js/engine/engine-correlation/engine-correlation-bivariate.js',
  '/oss-js/engine/engine-correlation/engine-correlation-canonical.js',
  '/oss-js/engine/engine-regression/engine-regression-simple.js',
  '/oss-js/engine/engine-regression/engine-regression-multiple.js',
  '/oss-js/engine/engine-regression/engine-regression-logistic.js',
  '/oss-js/engine/engine-regression/engine-regression-poisson.js',
  '/oss-js/engine/engine-regression/engine-regression-negbin.js',
  '/oss-js/engine/engine-nonparametric/engine-nonparametric.js',
  '/oss-js/engine/engine-reliability/engine-reliability-alpha.js',
  '/oss-js/engine/engine-reliability/engine-reliability-kappa.js',
  '/oss-js/engine/engine-crosstab/engine-crosstab.js',
  '/oss-js/engine/engine-factoranalysis/engine-factoranalysis-exploratory.js',
  '/oss-js/engine/engine-factoranalysis/engine-factoranalysis-confirmatory.js',
  '/oss-js/engine/engine-glm/engine-glm-univariate.js',
  '/oss-js/engine/engine-glm/engine-glm-multivariate.js',
  '/oss-js/engine/engine-hlm/engine-hlm-icc.js',
  '/oss-js/engine/engine-hlm/engine-hlm-twolevel.js',
  '/oss-js/engine/engine-hlm/engine-hlm-threelevel.js',
  '/oss-js/engine/engine-sem/engine-sem.js',
  '/oss-js/engine/engine-mediation/engine-mediation.js',
  '/oss-js/engine/engine-moderation/engine-moderation.js',
  '/oss-js/engine/engine-discriminant/engine-discriminant.js',
  '/oss-js/engine/engine-cluster/engine-cluster.js',
  '/oss-js/engine/engine-poweranalysis/engine-poweranalysis.js',
  '/oss-js/engine/engine-imputation/engine-imputation-single.js',
  '/oss-js/engine/engine-imputation/engine-imputation-multiple.js',
  '/oss-js/engine/engine-roc/engine-roc.js',
  '/oss-js/engine/engine-survival/engine-survival.js',
  '/oss-js/engine/engine-timeseries/engine-timeseries.js',
  '/oss-js/engine/engine-metaanalysis/engine-metaanalysis.js',

  // 3. Data layer
  '/oss-js/data/dataset-manager.js',
  '/oss-js/data/weight-cases.js',
  '/oss-js/data/data-view.js',
  '/oss-js/data/spreadsheet-mode.js',
  '/oss-js/data/variable-view.js',
  '/oss-js/data/data-transform.js',
  '/oss-js/data/missing-data.js',

  // 4. Analyze, charts, output, export, session, UI misc
  '/oss-js/analyze/analyze-subtab-ui.js',
  '/oss-js/analyze/analyze-tab-shell.js',
  '/oss-js/charts/svg-charts-core.js',
  '/oss-js/charts/interaction-plot.js',
  '/oss-js/charts/forest-funnel-plot.js',
  '/oss-js/charts/sem-mediation-diagram.js',
  '/oss-js/charts/power-plot.js',
  '/oss-js/charts/moderation-plot.js',
  '/oss-js/charts/roc-plot.js',
  '/oss-js/charts/survival-plot.js',
  '/oss-js/charts/discriminant-cluster-plot.js',
  '/oss-js/charts/bayesian-plot.js',
  '/oss-js/charts/imputation-plot.js',
  // Modular guide registry (core button/modal + per-test guides)
  '/oss-js/guide/guide-core.js',
  '/oss-js/guide/guide-descriptive.js',
  '/oss-js/guide/guide-ttest.js',
  '/oss-js/guide/guide-anova.js',
  '/oss-js/guide/guide-correlation.js',
  '/oss-js/guide/guide-regression.js',
  '/oss-js/guide/guide-nonparametric.js',
  '/oss-js/guide/guide-glm.js',
  '/oss-js/guide/guide-hlm.js',
  '/oss-js/guide/guide-reliability.js',
  '/oss-js/guide/guide-crosstab.js',
  '/oss-js/guide/guide-factor.js',
  '/oss-js/guide/guide-sem.js',
  '/oss-js/guide/guide-mediation.js',
  '/oss-js/guide/guide-charts.js',
  '/oss-js/guide/guide-discriminant.js',
  '/oss-js/guide/guide-cluster.js',
  '/oss-js/guide/guide-missing.js',
  '/oss-js/guide/guide-roc.js',
  '/oss-js/guide/guide-survival.js',
  '/oss-js/guide/guide-poweranalysis.js',
  '/oss-js/guide/guide-moderation.js',
  '/oss-js/guide/guide-transform.js',
  '/oss-js/guide/guide-imputation.js',
  '/oss-js/guide/guide-bayesian.js',
  '/oss-js/guide/guide-timeseries.js',
  '/oss-js/guide/guide-metaanalysis.js',
  '/oss-js/analyze/analyze-form-render.js',
  '/oss-js/analyze/analyze-form-helpers.js',
  '/oss-js/analyze/analyze-run-basic.js',
  '/oss-js/analyze/analyze-run-advanced.js',
  '/oss-js/output/output-render-basic.js',
  '/oss-js/output/output-render-advanced.js',
  '/oss-js/output/output-power-render.js',
  '/oss-js/output/output-view-shell.js',
  '/oss-js/output/apa-copy.js',
  '/oss-js/export/export-word.js',
  '/oss-js/export/export-dialog.js',
  '/oss-js/export/export-excel.js',
  '/oss-js/session/session-save-restore.js',
  '/oss-js/session/oss-filesystem.js',
  '/oss-js/ui-misc/syntax-view.js',
  '/oss-js/ui-misc/pivot-view.js',
  '/oss-js/ui-misc/ai-view.js',
  '/oss-js/ui-misc/cmd-palette.js',
  '/oss-js/ui-misc/pwa-install.js',

  // 5. Remaining SE facade & post-app hooks
  '/oss-js/app.js',
  '/oss-js/engine/engine-bayesian/engine-bayesian-ttest.js',
  '/oss-js/engine/engine-bayesian/engine-bayesian-correlation.js',
  '/oss-js/engine/engine-bayesian/engine-bayesian-posterior.js',
  '/oss-js/ui-misc/activity-loading-popup.js',
  '/oss-js/ui-misc/badges.js',

  // 6. Router last (boots app)
  '/oss-js/core/router.js',
];

export type OssTab =
  | 'data'
  | 'variable'
  | 'analyze'
  | 'syntax'
  | 'pivot'
  | 'ai'
  | 'output';

export interface AnalyzeNavItem {
  sub: string;
  group: string;
  label: string;
  color: string;
}

export const ANALYZE_NAV_ITEMS: readonly AnalyzeNavItem[] = [
  { sub: 'descriptive', group: 'descriptive', label: 'Descriptive', color: '#f472b6' },
  { sub: 'ttest', group: 'ttest', label: 'T-Test', color: '#a78bfa' },
  { sub: 'rmanova', group: 'anova', label: 'ANOVA', color: '#34d399' },
  { sub: 'correlation', group: 'correlation', label: 'Correlation', color: '#f472b6' },
  { sub: 'regression', group: 'regression', label: 'Regression', color: '#67e8f9' },
  { sub: 'nonparam', group: 'nonparam', label: 'Nonparametric', color: '#c084fc' },
  { sub: 'glm', group: 'glm', label: 'General Linear Model', color: '#f9a8d4' },
  { sub: 'hlm', group: 'hlm', label: 'Hierarchical Linear Model', color: '#a78bfa' },
  { sub: 'reliability', group: 'reliability', label: 'Reliability', color: '#34d399' },
  { sub: 'crosstab', group: 'crosstab', label: 'Crosstab', color: '#67e8f9' },
  { sub: 'efa', group: 'factor', label: 'Factor Analysis', color: '#a5f3fc' },
  { sub: 'sem', group: 'sem', label: 'SEM', color: '#e879f9' },
  { sub: 'mediation', group: 'mediation', label: 'Mediation', color: '#fb923c' },
  { sub: 'charts', group: 'charts', label: 'Charts', color: '#f472b6' },
  { sub: 'discriminant', group: 'discriminant', label: 'Discriminant', color: '#38bdf8' },
  { sub: 'cluster', group: 'cluster', label: 'Cluster Analysis', color: '#4ade80' },
  { sub: 'missinganalysis', group: 'missinganalysis', label: 'Missing Analysis', color: '#f87171' },
  { sub: 'roc', group: 'roc', label: 'ROC Curve', color: '#67e8f9' },
  { sub: 'survival', group: 'survival', label: 'Survival Analysis', color: '#4ade80' },
  { sub: 'poweranalysis', group: 'poweranalysis', label: 'Power Analysis', color: '#fbbf24' },
  { sub: 'moderation', group: 'moderation', label: 'Moderation', color: '#e879f9' },
  { sub: 'impute', group: 'imputation', label: 'Imputation', color: '#a5f3fc' },
  { sub: 'bayesian', group: 'bayesian', label: 'Bayesian Analysis', color: '#f9a8d4' },
  { sub: 'timeseries', group: 'timeseries', label: 'Time Series', color: '#67e8f9' },
  { sub: 'metaanalysis', group: 'metaanalysis', label: 'Meta-Analysis', color: '#fb923c' },
];

export function callOss(fnName: string, ...args: unknown[]): unknown {
  if (typeof window === 'undefined') return undefined;
  const win = window as unknown as Record<string, unknown>;
  const fn = win[fnName];
  if (typeof fn === 'function') {
    return (fn as (...a: unknown[]) => unknown)(...args);
  }
  return undefined;
}
