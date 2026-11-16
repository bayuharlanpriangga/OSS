import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { ANALYZE_NAV_ITEMS, OSS_ENGINE_SCRIPTS } from './oss-scripts';

const ROOT_DIR = process.cwd();

function listJsFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listJsFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      results.push(full);
    }
  }
  return results;
}

test('OSS_ENGINE_SCRIPTS references existing files in topological order and registers all engine modules', () => {
  for (const scriptPath of OSS_ENGINE_SCRIPTS) {
    const abs = path.join(ROOT_DIR, 'public', scriptPath);
    assert.equal(fs.existsSync(abs), true, `Missing engine script: ${scriptPath}`);
  }

  assert.equal(
    new Set(OSS_ENGINE_SCRIPTS).size,
    OSS_ENGINE_SCRIPTS.length,
    'OSS_ENGINE_SCRIPTS must not contain duplicates'
  );

  assert.equal(
    fs.existsSync(path.join(ROOT_DIR, 'public/oss-js/stats-engine')),
    false,
    'Obsolete /public/oss-js/stats-engine directory must be removed'
  );

  assert.equal(
    OSS_ENGINE_SCRIPTS.some((s) => s.includes('/stats-engine/')),
    false,
    'OSS_ENGINE_SCRIPTS must not reference /oss-js/stats-engine/'
  );

  assert.equal(
    OSS_ENGINE_SCRIPTS.includes('/oss-js/analyze/analyze-guide.js'),
    false,
    'Obsolete monolithic analyze-guide.js must not be referenced'
  );

  // Every .js file inside /public/oss-js/engine/ must be registered in OSS_ENGINE_SCRIPTS
  const engineDiskFiles = listJsFiles(path.join(ROOT_DIR, 'public/oss-js/engine')).map(
    (abs) => '/' + path.relative(path.join(ROOT_DIR, 'public'), abs).replace(/\\/g, '/')
  );
  assert.equal(engineDiskFiles.length, 45, `Expected 45 modular engine files, got ${engineDiskFiles.length}`);
  assert.equal(fs.existsSync(path.join(ROOT_DIR, 'public/oss-js/data/imputation.js')), false, 'Old data/imputation.js must be removed');
  assert.equal(fs.existsSync(path.join(ROOT_DIR, 'public/oss-js/engine/engine-hlm/engine-hlm.js')), false, 'Old shared engine-hlm.js must be removed');
  assert.equal(fs.existsSync(path.join(ROOT_DIR, 'public/oss-js/engine/engine-imputation/engine-imputation.js')), false, 'Old merged engine-imputation.js must be removed');
  for (const rel of engineDiskFiles) {
    assert.equal(
      OSS_ENGINE_SCRIPTS.includes(rel),
      true,
      `Engine module on disk is missing from OSS_ENGINE_SCRIPTS: ${rel}`
    );
  }

  const idx = (needle: string) => OSS_ENGINE_SCRIPTS.indexOf(needle);

  const guideScripts = OSS_ENGINE_SCRIPTS.filter((s) => s.startsWith('/oss-js/guide/'));
  assert.ok(guideScripts.length >= 25, 'Expected modular guide/*.js scripts');
  const formIdx = idx('/oss-js/analyze/analyze-form-render.js');
  for (const gs of guideScripts) {
    assert.ok(idx(gs) < formIdx, `${gs} must load before analyze-form-render.js`);
    if (gs !== '/oss-js/guide/guide-core.js') {
      assert.ok(
        idx('/oss-js/guide/guide-core.js') < idx(gs),
        `guide-core.js must load before ${gs}`
      );
    }
  }

  assert.ok(
    idx('/oss-js/engine/engine-core/engine-core-distributions.js') <
      idx('/oss-js/engine/engine-core/engine-core-helpers.js'),
    'engine-core-distributions.js must load before engine-core-helpers.js'
  );
  assert.ok(
    idx('/oss-js/engine/engine-core/engine-core-helpers.js') <
      idx('/oss-js/engine/engine-descriptive/engine-descriptive.js'),
    'engine-core-helpers.js must load before engine-descriptive.js'
  );
  assert.ok(
    idx('/oss-js/engine/engine-core/engine-core-matrix.js') <
      idx('/oss-js/engine/engine-correlation/engine-correlation-bivariate.js'),
    'engine-core-matrix.js must load before engine-correlation-bivariate.js'
  );
  assert.ok(
    idx('/oss-js/engine/engine-descriptive/engine-descriptive.js') <
      idx('/oss-js/engine/engine-ttest/engine-ttest-paired.js'),
    'engine-descriptive.js must load before engine-ttest-paired.js (sw dependency)'
  );
  assert.ok(
    idx('/oss-js/engine/engine-descriptive/engine-descriptive.js') <
      idx('/oss-js/engine/engine-regression/engine-regression-multiple.js'),
    'engine-descriptive.js must load before engine-regression-multiple.js (sw dependency)'
  );
  assert.ok(
    idx('/oss-js/engine/engine-correlation/engine-correlation-bivariate.js') <
      idx('/oss-js/engine/engine-glm/engine-glm-univariate.js'),
    'engine-correlation-bivariate.js must load before engine-glm-univariate.js (pearsonR dependency)'
  );
  assert.ok(
    idx('/oss-js/engine/engine-glm/engine-glm-univariate.js') <
      idx('/oss-js/engine/engine-glm/engine-glm-multivariate.js'),
    'engine-glm-univariate.js must load before engine-glm-multivariate.js (manovaProper calls glmUnivariate)'
  );
  assert.ok(
    idx('/oss-js/data/dataset-manager.js') < idx('/oss-js/data/data-view.js'),
    'dataset-manager.js must load before data-view.js'
  );
  assert.ok(
    idx('/oss-js/app.js') < idx('/oss-js/engine/engine-bayesian/engine-bayesian-ttest.js'),
    'app.js must load before engine-bayesian-ttest.js'
  );
  assert.ok(
    idx('/oss-js/app.js') < idx('/oss-js/engine/engine-bayesian/engine-bayesian-correlation.js'),
    'app.js must load before engine-bayesian-correlation.js'
  );
  assert.ok(
    idx('/oss-js/app.js') < idx('/oss-js/engine/engine-bayesian/engine-bayesian-posterior.js'),
    'app.js must load before engine-bayesian-posterior.js'
  );
  assert.ok(
    idx('/oss-js/app.js') < idx('/oss-js/ui-misc/activity-loading-popup.js'),
    'app.js must load before activity-loading-popup.js'
  );
  assert.equal(
    OSS_ENGINE_SCRIPTS[OSS_ENGINE_SCRIPTS.length - 1],
    '/oss-js/core/router.js',
    'router.js must be the last engine script'
  );
});

test('ANALYZE_NAV_ITEMS covers all primary sidebar analysis categories without duplicate subs', () => {
  const subs = ANALYZE_NAV_ITEMS.map((item) => item.sub);
  assert.equal(new Set(subs).size, subs.length);
  assert.ok(subs.includes('descriptive'));
  assert.ok(subs.includes('ttest'));
  assert.ok(subs.includes('regression'));
  assert.ok(subs.includes('sem'));
  assert.ok(subs.includes('bayesian'));
});

test('Modular /oss-js/engine/ preserves full SE API parity and accurate statistical computations across all 45 modules', () => {
  const multiRows = [
    { x1: 1, x2: 2, y1: 2, y2: 5, m1: 3, i1: 1.0, i2: 1.1, i3: 5.0, i4: 5.2, g: 'A', g2: 'C1', g3: 'S1', w2: 10, bin: 0, cnt: 1, prob: 0.12, time: 4, ev: 1 },
    { x1: 2, x2: 1, y1: 4, y2: 3, m1: 4, i1: 2.0, i2: 1.9, i3: 4.0, i4: 4.1, g: 'A', g2: 'C1', g3: 'S1', w2: 10, bin: 0, cnt: 2, prob: 0.25, time: 6, ev: 1 },
    { x1: 3, x2: 4, y1: 5, y2: 9, m1: 6, i1: 3.0, i2: 3.2, i3: 6.0, i4: 5.8, g: 'A', g2: 'C1', g3: 'S1', w2: 10, bin: 0, cnt: 2, prob: 0.31, time: 8, ev: 0 },
    { x1: 4, x2: 3, y1: 8, y2: 7, m1: 7, i1: 4.0, i2: 4.1, i3: 5.0, i4: 5.1, g: 'A', g2: 'C2', g3: 'S1', w2: 12, bin: 0, cnt: 3, prob: 0.42, time: 9, ev: 1 },
    { x1: 5, x2: 6, y1: 11, y2: 12, m1: 9, i1: 5.0, i2: 4.8, i3: 7.0, i4: 6.9, g: 'A', g2: 'C2', g3: 'S1', w2: 12, bin: 0, cnt: 4, prob: 0.38, time: 12, ev: 0 },
    { x1: 6, x2: 5, y1: 12, y2: 11, m1: 10, i1: 6.0, i2: 6.2, i3: 6.0, i4: 6.2, g: 'B', g2: 'C2', g3: 'S1', w2: 15, bin: 1, cnt: 5, prob: 0.64, time: 14, ev: 1 },
    { x1: 7, x2: 8, y1: 15, y2: 17, m1: 12, i1: 7.0, i2: 7.1, i3: 8.0, i4: 7.9, g: 'B', g2: 'C3', g3: 'S1', w2: 15, bin: 1, cnt: 6, prob: 0.72, time: 16, ev: 1 },
    { x1: 8, x2: 7, y1: 16, y2: 16, m1: 13, i1: 8.0, i2: 7.8, i3: 7.0, i4: 7.2, g: 'B', g2: 'C3', g3: 'S1', w2: 15, bin: 1, cnt: 7, prob: 0.79, time: 18, ev: 0 },
    { x1: 9, x2: 10, y1: 19, y2: 20, m1: 15, i1: 9.0, i2: 9.2, i3: 9.0, i4: 8.9, g: 'B', g2: 'C1', g3: 'S2', w2: 20, bin: 1, cnt: 8, prob: 0.85, time: 21, ev: 1 },
    { x1: 10, x2: 9, y1: 21, y2: 19, m1: 16, i1: 10.0, i2: 10.1, i3: 8.0, i4: 8.1, g: 'B', g2: 'C1', g3: 'S2', w2: 20, bin: 1, cnt: 9, prob: 0.90, time: 23, ev: 0 },
    { x1: 11, x2: 12, y1: 22, y2: 24, m1: 18, i1: 11.0, i2: 10.9, i3: 10.0, i4: 10.2, g: 'B', g2: 'C1', g3: 'S2', w2: 20, bin: 1, cnt: 10, prob: 0.93, time: 25, ev: 1 },
    { x1: 12, x2: 11, y1: 25, y2: 23, m1: 19, i1: 12.0, i2: 12.2, i3: 9.0, i4: 8.9, g: 'B', g2: 'C2', g3: 'S2', w2: 22, bin: 1, cnt: 11, prob: 0.97, time: 28, ev: 1 },
    { x1: 13, x2: 14, y1: 27, y2: 28, m1: 21, i1: 13.0, i2: 13.1, i3: 11.0, i4: 10.8, g: 'B', g2: 'C2', g3: 'S2', w2: 22, bin: 1, cnt: 12, prob: 0.98, time: 30, ev: 0 },
    { x1: 14, x2: 13, y1: 28, y2: 27, m1: 22, i1: 14.0, i2: 13.8, i3: 10.0, i4: 10.2, g: 'B', g2: 'C2', g3: 'S2', w2: 22, bin: 1, cnt: 13, prob: 0.99, time: 32, ev: 1 },
    { x1: 15, x2: 16, y1: 31, y2: 32, m1: 24, i1: 15.0, i2: 15.2, i3: 12.0, i4: 11.9, g: 'B', g2: 'C3', g3: 'S2', w2: 25, bin: 1, cnt: 14, prob: 0.99, time: 35, ev: 1 },
    { x1: 16, x2: 15, y1: 33, y2: 31, m1: 25, i1: 16.0, i2: 15.9, i3: 11.0, i4: 11.1, g: 'B', g2: 'C3', g3: 'S2', w2: 25, bin: 1, cnt: 15, prob: 0.99, time: 38, ev: 1 },
  ];

  const ctx = vm.createContext({
    Math,
    Number,
    Array,
    Float64Array,
    Set,
    Object,
    String,
    Boolean,
    JSON,
    Date,
    Error,
    isFinite,
    isNaN,
    parseFloat,
    parseInt,
    console,
    data: multiRows,
    vars: [
      { name: 'x1', type: 'Numeric' },
      { name: 'x2', type: 'Numeric' },
      { name: 'y1', type: 'Numeric' },
      { name: 'y2', type: 'Numeric' },
    ],
    isMiss: (v: unknown) => v === null || v === undefined || v === '' || (typeof v === 'number' && !Number.isFinite(v)),
  });

  // Load every registered script inside /oss-js/engine/ plus /oss-js/app.js in exact load order
  const engineAndAppScripts = OSS_ENGINE_SCRIPTS.filter(
    (s) => s.startsWith('/oss-js/engine/') || s === '/oss-js/app.js'
  );
  assert.equal(engineAndAppScripts.length, 46, 'Expected 45 engine modules + app.js');

  for (const rel of engineAndAppScripts) {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'public', rel), 'utf8');
    vm.runInContext(code, ctx, { filename: rel });
  }

  const se = ctx.SE as Record<string, (...args: unknown[]) => unknown>;
  const globals = ctx as Record<string, (...args: unknown[]) => unknown>;

  const expectedSeMethods = [
    'validNums', 'isV', 'mean', 'std', 'vari', 'quantile', 'normInv', 'sw', 'normCDF',
    'descriptive', 'tTest', 'oneSampleT', 'pairedTTest', 'onewayANOVA',
    'tukeyHSD', 'lsdPosthoc', 'bonferroniPosthoc', 'holmBonferroni', 'holmBonferroniPosthoc',
    'twowayANOVA', 'threewayANOVA',
    'pearsonR', 'spearmanR', 'partialCorr', 'canonicalCorr',
    'linearReg', 'multipleReg', 'glmUnivariate',
    'chiSquare', 'mannWhitney', 'kruskalWallis', 'wilcoxon',
    'cronbachAlpha', 'cohenKappa', 'efa', 'cfa', 'levene', 'f4', 'f1', 'pFmt', 'tP',
    'logisticReg', 'poissonReg', 'negbinReg',
    'solveLinear', 'invertMatrix',
    'manovaProper', 'repeatedMeasuresAnova', 'fmt4',
    'pFromF', 'fCDF', 'chiCDF', 'chi2CDF',
    'matMul', 'matT', 'matDet', 'matInv',
    'matMulFlat', 'matTFlat', 'matDetFlat', 'matInvFlat',
    'bayesTTest', 'bayesPearson', 'bayesPosteriorNormal',
  ];

  for (const method of expectedSeMethods) {
    assert.equal(typeof se[method], 'function', `Missing SE.${method}`);
  }

  const expectedGlobals = [
    'fisherExact', 'ksTest', 'computeHLMICC', 'computeHLMTwoLevel', 'computeHLMThreeLevel', 'computeHLMBasics',
    'computeSEM', 'generateLavaanSyntax', 'computeMediation', 'computeModeration', 'computeLDA',
    'computeKMeans', 'computeHierarchical', 'computePower',
    'computeSingleImpute', 'computeSingleImputeAll', 'computeMICE',
    'computeROC', 'deLongTest', 'computeKaplanMeier', 'computeCoxRegression',
    'tsARIMA', 'tsDecomp', 'computeMetaAnalysis',
  ];
  for (const fn of expectedGlobals) {
    assert.equal(typeof globals[fn], 'function', `Missing global ${fn}`);
  }

  // Descriptive + Normality (SW & KS)
  const desc = se.descriptive([10, 12, 14, 16, 18]) as {
    n: number; mean: string; median: string; min: string; max: string;
  };
  assert.equal(desc.n, 5);
  assert.equal(Number(desc.mean), 14);
  assert.equal(Number(desc.median), 14);
  const ksRes = globals.ksTest([10, 12, 14, 16, 18, 20]) as { D: string; p: number };
  assert.ok(Number(ksRes.D) >= 0 && Number(ksRes.D) <= 1);
  assert.ok(ksRes.p >= 0 && ksRes.p <= 1);

  // T-Tests
  const tt = se.tTest([10, 12, 11, 13, 14], [20, 22, 21, 23, 24]) as {
    meanA: string; meanB: string; t: string; p: number;
  };
  assert.equal(Number(tt.meanA), 12);
  assert.equal(Number(tt.meanB), 22);
  assert.ok(Number(tt.t) < -5);
  assert.ok(tt.p < 0.001);

  const oneSamp = se.oneSampleT([10, 12, 14, 16, 18], 10) as { meanDiff: string; sig: boolean };
  assert.equal(Number(oneSamp.meanDiff), 4);
  assert.equal(oneSamp.sig, true);

  const paired = se.pairedTTest([10, 12, 14, 16, 18], [5, 8, 9, 12, 13]) as { meanDiff: string; sig: boolean };
  assert.ok(Number(paired.meanDiff) > 4);
  assert.equal(paired.sig, true);

  // ANOVA + Post-hoc + Levene + Repeated Measures
  const groups = [
    { label: 'A', vals: [10, 11, 12, 13] },
    { label: 'B', vals: [14, 15, 16, 17] },
    { label: 'C', vals: [18, 19, 20, 21] },
  ];
  const anova = se.onewayANOVA(groups) as { F: string; sig: boolean };
  assert.ok(Number(anova.F) > 10);
  assert.equal(anova.sig, true);

  const lev = se.levene([
    [10, 11, 12, 14],
    [14, 15, 17, 19],
    [18, 22, 26, 30],
  ]) as { F: string; dfB: number };
  assert.equal(lev.dfB, 2);
  assert.ok(Number(lev.F) >= 0);

  const tukey = se.tukeyHSD(groups) as Array<{ sig: boolean }>;
  assert.equal(tukey.length, 3);
  assert.ok(tukey.every((p) => p.sig));

  const bonf = se.bonferroniPosthoc(groups) as Array<{ sig: boolean }>;
  assert.equal(bonf.length, 3);
  assert.ok(bonf.every((p) => p.sig));

  const holm = se.holmBonferroniPosthoc(groups) as Array<{ sig: boolean }>;
  assert.equal(holm.length, 3);
  assert.ok(holm.every((p) => p.sig));

  const rm = se.repeatedMeasuresAnova([
    [10, 12, 14, 16, 18],
    [14, 16, 17, 20, 21],
    [18, 21, 23, 25, 28],
  ]) as { F: string; sig: boolean };
  assert.ok(Number(rm.F) > 10);
  assert.equal(rm.sig, true);

  // Correlation (Pearson, Spearman, Partial, Canonical)
  const corr = se.pearsonR([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]) as { r: string; p: number };
  assert.equal(Number(corr.r), 1);
  assert.ok(corr.p < 0.001);

  const scorr = se.spearmanR([1, 2, 3, 4, 5], [10, 20, 30, 40, 50]) as { r: string };
  assert.equal(Number(scorr.r), 1);

  const pcorr = se.partialCorr(
    [1, 2, 3, 4, 5, 6, 7],
    [2, 4, 5, 8, 10, 11, 14],
    [7, 5, 6, 4, 3, 2, 1]
  ) as { n: number; rp: string };
  assert.equal(pcorr.n, 7);
  assert.ok(Number(pcorr.rp) > 0.5);

  const cca = se.canonicalCorr(['x1', 'x2'], ['y1', 'y2'], multiRows) as { n: number; tests: Array<{ rc: string }> };
  assert.equal(cca.n, 16);
  assert.ok(Number(cca.tests[0].rc) > 0.9);

  // Regression (Simple, Multiple, Logistic, Poisson, NegBin)
  const reg = se.linearReg([1, 2, 3, 4, 5], [3, 5, 7, 9, 11]) as { b0: string; b1: string; R2: string };
  assert.equal(Number(reg.b0), 1);
  assert.equal(Number(reg.b1), 2);
  assert.equal(Number(reg.R2), 1);

  const mreg = se.multipleReg(['x1', 'x2'], 'y1', multiRows) as { R2: string; coefs: Array<{ name: string }> };
  assert.ok(Number(mreg.R2) > 0.98);
  assert.equal(mreg.coefs.length, 3);

  const lreg = se.logisticReg('bin', ['x1', 'x2'], multiRows, 'binary') as { n: number; accuracy: number };
  assert.equal(lreg.n, 16);
  assert.ok(lreg.accuracy >= 80);

  const preg = se.poissonReg('cnt', ['x1'], multiRows) as { n: number; mcFaddenR2: string };
  assert.equal(preg.n, 16);
  assert.ok(Number(preg.mcFaddenR2) > 0.2);

  const nbreg = se.negbinReg('cnt', ['x1'], multiRows) as { n: number; theta: string };
  assert.equal(nbreg.n, 16);
  assert.ok(Number(nbreg.theta) > 0);

  // Nonparametric & Crosstab
  const mw = se.mannWhitney([1, 2, 3, 4], [10, 11, 16, 13]) as { U: string; sig: boolean };
  assert.equal(Number(mw.U), 0);
  assert.equal(mw.sig, true);

  const kw = se.kruskalWallis([
    { label: 'A', vals: [1, 2, 3] },
    { label: 'B', vals: [10, 11, 16] },
    { label: 'C', vals: [20, 21, 22] },
  ]) as { H: string; sig: boolean };
  assert.ok(Number(kw.H) > 5);
  assert.equal(kw.sig, true);

  const wilc = se.wilcoxon([5, 6, 7, 8, 9, 10], 0) as { sig: boolean };
  assert.equal(wilc.sig, true);

  const chi = se.chiSquare([[20, 5], [4, 21]], [25, 25], [24, 26], 50) as { sig: boolean };
  assert.equal(chi.sig, true);
  const fRes = globals.fisherExact(20, 5, 4, 21) as { sig: boolean; p: string };
  assert.equal(fRes.sig, true);
  assert.ok(Number(fRes.p) < 0.001);

  // Reliability
  const alpha = se.cronbachAlpha([
    [1, 2, 3, 4, 5],
    [1, 2, 3, 4, 5],
    [2, 3, 4, 5, 6],
  ]) as { alpha: string; k: number; n: number };
  assert.equal(alpha.k, 3);
  assert.equal(alpha.n, 5);
  assert.equal(Number(alpha.alpha), 1);

  const kappa = se.cohenKappa(['A', 'B', 'A', 'B', 'A'], ['A', 'B', 'A', 'B', 'A']) as { kappa: string };
  assert.equal(Number(kappa.kappa), 1);

  // Factor Analysis (EFA & CFA)
  const factorMat = [
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 16, 13, 14, 15],
    [1.1, 1.9, 3.2, 4.1, 4.8, 6.2, 7.1, 7.8, 9.2, 10.1, 10.9, 16.2, 13.1, 13.9, 15.1],
    [5, 4, 6, 5, 7, 6, 8, 7, 9, 8, 10, 9, 11, 10, 16],
    [5.2, 4.1, 5.8, 5.1, 6.9, 6.2, 7.9, 7.2, 8.9, 8.1, 10.2, 8.9, 11.1, 9.8, 16.1],
  ];
  const efaRes = se.efa(factorMat, 2, 'varimax') as { kmo: string; loadings: string[][] };
  assert.notEqual(efaRes.kmo, 'N/A');
  assert.equal(efaRes.loadings.length, 4);

  const cfaRes = se.cfa(factorMat, { F1: ['v1', 'v2'], F2: ['v3', 'v4'] }) as { CFI: string };
  assert.ok(Number(cfaRes.CFI) >= 0 && Number(cfaRes.CFI) <= 1);

  // GLM, MANOVA & HLM
  const manovaRes = se.manovaProper(multiRows, ['y1', 'y2'], 'g') as {
    n: number;
    pillai: { stat: string };
    wilks: { stat: string };
  };
  assert.equal(manovaRes.n, 16);
  assert.ok(Number(manovaRes.pillai.stat) > 0);
  assert.ok(Number(manovaRes.wilks.stat) < 1);

  // HLM: ICC, Two-Level, Three-Level (3 distinct engines)
  const hlmIcc = globals.computeHLMICC('y1', 'g') as { subtype: string; k: number; n: number; ICC: string; ICC2: string };
  assert.equal(hlmIcc.subtype, 'hlm-icc');
  assert.equal(hlmIcc.k, 2);
  assert.equal(hlmIcc.n, 16);
  assert.ok(Number(hlmIcc.ICC) > 0.5);
  assert.ok(Number(hlmIcc.ICC2) > 0.5);

  const hlm2 = globals.computeHLMTwoLevel('y1', 'g', ['x1'], ['w2'], 'crosslevel') as {
    subtype: string; modelType: string; k: number; n: number;
    fixedEffects: Array<{ name: string; gamma: string }>;
    tau11: string | null; pseudoR2_L1: string; AIC: string;
  };
  assert.equal(hlm2.subtype, 'hlm-2level');
  assert.equal(hlm2.modelType, 'crosslevel');
  assert.equal(hlm2.k, 2);
  assert.equal(hlm2.n, 16);
  assert.ok(hlm2.fixedEffects.some((f) => f.name === 'x1'));
  assert.ok(hlm2.fixedEffects.some((f) => f.name === 'x1 × w2'));
  assert.notEqual(hlm2.tau11, null);
  assert.ok(Number(hlm2.pseudoR2_L1) >= 0.8);

  const hlm3 = globals.computeHLMThreeLevel('y1', 'g2', 'g3', ['x1']) as {
    subtype: string; k3: number; k2: number; n: number;
    vpcL1: string; vpcL2: string; vpcL3: string;
    fixedEffects: Array<{ name: string }>;
  };
  assert.equal(hlm3.subtype, 'hlm-3level');
  assert.equal(hlm3.k3, 2);
  assert.equal(hlm3.k2, 6);
  assert.equal(hlm3.n, 16);
  assert.ok(Math.abs(Number(hlm3.vpcL1) + Number(hlm3.vpcL2) + Number(hlm3.vpcL3) - 100) < 0.05);
  assert.ok(hlm3.fixedEffects.some((f) => f.name === 'x1'));

  // SEM, Mediation & Moderation
  const semRes = globals.computeSEM(
    ['F1', 'F2'],
    { F1: ['i1', 'i2'], F2: ['i3', 'i4'] },
    [{ from: 'F1', to: 'F2' }]
  ) as { n: number; paths: Array<{ from: string; to: string }> };
  assert.equal(semRes.n, 16);
  assert.equal(semRes.paths.length, 1);

  const medRes = globals.computeMediation('x1', ['m1'], 'y1', 0) as { n: number; barronKenny: { c: string } };
  assert.equal(medRes.n, 16);
  assert.ok(Number(medRes.barronKenny.c) > 1);

  const modRes = globals.computeModeration('x1', 'x2', 'y1', [], true) as { n: number; R2: string };
  assert.equal(modRes.n, 16);
  assert.ok(Number(modRes.R2) > 0.9);

  // Discriminant & Cluster
  const ldaRes = globals.computeLDA('g', ['x1', 'x2'], multiRows) as { accuracy: number };
  assert.ok(ldaRes.accuracy >= 80);

  const kmRes = globals.computeKMeans(multiRows, ['x1', 'y1'], 2, 20, true) as { k: number; clusters: unknown[] };
  assert.equal(kmRes.k, 2);
  assert.equal(kmRes.clusters.length, 2);

  const hcRes = globals.computeHierarchical(multiRows, ['x1', 'y1'], 2, 'ward') as { k: number };
  assert.equal(hcRes.k, 2);

  // Power Analysis
  const pwRes = globals.computePower('ttest_2samp', 0.05, 0.8, 0.5, 2, 2, 'n', 30, 1) as { n: number; power: number };
  assert.equal(pwRes.n, 64);
  assert.ok(pwRes.power >= 0.8);

  // Single Imputation & Multiple Imputation (MICE)
  const missRows = multiRows.map((r, i) => (i === 2 ? { ...r, y1: null } : { ...r }));
  const singleImp = globals.computeSingleImpute(missRows, 'y1', 'median') as {
    nImputed: number;
    data: Array<{ y1: number }>;
  };
  assert.equal(singleImp.nImputed, 1);
  assert.ok(Number.isFinite(singleImp.data[2].y1));

  const miRes = globals.computeMICE(missRows, ['y1'], 3, 'pmm') as { M: number; pooled: Array<{ nImputed: number }> };
  assert.equal(miRes.M, 3);
  assert.equal(miRes.pooled[0].nImputed, 1);

  // ROC & DeLong
  const roc1 = globals.computeROC(multiRows, 'prob', 'bin', '1') as { auc: string };
  const roc2 = globals.computeROC(multiRows, 'x1', 'bin', '1') as { auc: string };
  assert.ok(Number(roc1.auc) > 0.95);
  const dl = globals.deLongTest(roc1, roc2) as { p_fmt: string };
  assert.ok(typeof dl.p_fmt === 'string');

  // Survival (Kaplan-Meier & Cox)
  const kmSurv = globals.computeKaplanMeier(multiRows, 'time', 'ev', 'g') as { n: number; groups: unknown[] };
  assert.equal(kmSurv.n, 16);
  assert.equal(kmSurv.groups.length, 2);

  const coxRes = globals.computeCoxRegression(multiRows, 'time', 'ev', ['x1']) as { n: number; events: number };
  assert.equal(coxRes.n, 16);
  assert.equal(coxRes.events, 11);

  // Time Series (ARIMA & Decomposition)
  const series = [10, 16, 15, 14, 18, 20, 23, 22, 26, 28, 31, 30, 34, 36, 39, 38];
  const arima = globals.tsARIMA(series, 1, 1, 1) as { n: number; forecast: string };
  assert.equal(arima.n, 16);
  assert.ok(Number.isFinite(Number(arima.forecast)));

  const decomp = globals.tsDecomp(series, 4, 'additive') as { n: number; strength: string };
  assert.equal(decomp.n, 16);
  assert.ok(Number(decomp.strength) >= 0);

  // Meta-Analysis
  const meta = globals.computeMetaAnalysis(
    [
      { name: 'S1', yi: 0.4, vi: 0.04, ni: 50 },
      { name: 'S2', yi: 0.6, vi: 0.05, ni: 60 },
      { name: 'S3', yi: 0.5, vi: 0.03, ni: 70 },
    ],
    'random'
  ) as { k: number; pooledEffect: string };
  assert.equal(meta.k, 3);
  assert.ok(Number(meta.pooledEffect) > 0.4 && Number(meta.pooledEffect) < 0.6);

  // Bayesian (T-Test, Pearson, Posterior)
  const bt = se.bayesTTest([10, 12, 11, 13, 14], [20, 22, 21, 23, 24], 0.707, 2) as { BF10: string };
  assert.ok(Number(bt.BF10) > 10);

  const bp = se.bayesPearson([1, 2, 3, 4, 5, 6], [2, 4, 5, 8, 10, 12], 1) as { BF10: string };
  assert.ok(Number(bp.BF10) > 3);

  const bpost = se.bayesPosteriorNormal([10, 12, 14, 16, 18], 0, 1, 0.5, 0.5) as { postMean: string; n: number };
  assert.equal(bpost.n, 5);
  assert.ok(Number(bpost.postMean) > 10);
});
