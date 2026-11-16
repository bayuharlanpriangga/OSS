import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { ANALYZE_NAV_ITEMS, OSS_ENGINE_SCRIPTS } from './oss-scripts';

const ROOT_DIR = process.cwd();

test('OSS_ENGINE_SCRIPTS references existing files in topological order', () => {
  for (const scriptPath of OSS_ENGINE_SCRIPTS) {
    const abs = path.join(ROOT_DIR, 'public', scriptPath);
    assert.equal(fs.existsSync(abs), true, `Missing engine script: ${scriptPath}`);
  }

  assert.equal(
    OSS_ENGINE_SCRIPTS.includes('/oss-js/stats-engine/stats-core-basic.js'),
    false,
    'Obsolete monolithic stats-core-basic.js must not be referenced'
  );
  assert.equal(
    OSS_ENGINE_SCRIPTS.includes('/oss-js/stats-engine/stats-core-advanced.js'),
    false,
    'Obsolete monolithic stats-core-advanced.js must not be referenced'
  );
  assert.equal(
    OSS_ENGINE_SCRIPTS.includes('/oss-js/analyze/analyze-guide.js'),
    false,
    'Obsolete monolithic analyze-guide.js must not be referenced'
  );

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
    idx('/oss-js/stats-engine/stats-distributions.js') <
      idx('/oss-js/stats-engine/stats-helpers.js'),
    'stats-distributions.js must load before stats-helpers.js'
  );
  assert.ok(
    idx('/oss-js/stats-engine/stats-helpers.js') <
      idx('/oss-js/stats-engine/stats-descriptive.js'),
    'stats-helpers.js must load before stats-descriptive.js'
  );
  assert.ok(
    idx('/oss-js/stats-engine/stats-matrix.js') <
      idx('/oss-js/stats-engine/stats-correlation.js'),
    'stats-matrix.js must load before stats-correlation.js'
  );
  assert.ok(
    idx('/oss-js/stats-engine/stats-descriptive.js') <
      idx('/oss-js/stats-engine/stats-ttest.js'),
    'stats-descriptive.js must load before stats-ttest.js (sw dependency)'
  );
  assert.ok(
    idx('/oss-js/stats-engine/stats-descriptive.js') <
      idx('/oss-js/stats-engine/stats-regression.js'),
    'stats-descriptive.js must load before stats-regression.js (sw dependency)'
  );
  assert.ok(
    idx('/oss-js/stats-engine/stats-correlation.js') <
      idx('/oss-js/stats-engine/stats-glm-hlm.js'),
    'stats-correlation.js must load before stats-glm-hlm.js (pearsonR dependency)'
  );
  assert.ok(
    idx('/oss-js/data/dataset-manager.js') < idx('/oss-js/data/data-view.js'),
    'dataset-manager.js must load before data-view.js'
  );
  assert.ok(
    idx('/oss-js/app.js') < idx('/oss-js/stats-engine/stats-bayesian.js'),
    'app.js must load before stats-bayesian.js'
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

test('Modular stats-engine preserves full SE API parity and accurate statistical computations', () => {
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
  });

  const engineFiles = [
    '/oss-js/stats-engine/stats-distributions.js',
    '/oss-js/stats-engine/stats-helpers.js',
    '/oss-js/stats-engine/stats-matrix.js',
    '/oss-js/stats-engine/stats-descriptive.js',
    '/oss-js/stats-engine/stats-anova.js',
    '/oss-js/stats-engine/stats-ttest.js',
    '/oss-js/stats-engine/stats-correlation.js',
    '/oss-js/stats-engine/stats-regression.js',
    '/oss-js/stats-engine/stats-nonparametric.js',
    '/oss-js/stats-engine/stats-reliability.js',
    '/oss-js/stats-engine/stats-crosstab.js',
    '/oss-js/stats-engine/stats-factor.js',
    '/oss-js/stats-engine/stats-glm-hlm.js',
    '/oss-js/app.js',
  ];

  for (const rel of engineFiles) {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'public', rel), 'utf8');
    vm.runInContext(code, ctx, { filename: rel });
  }

  const se = ctx.SE as Record<string, (...args: unknown[]) => unknown>;

  const expectedMethods = [
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
    'pFromF', 'fCDF', 'chiCDF',
    'matMul', 'matT', 'matDet', 'matInv',
    'matMulFlat', 'matTFlat', 'matDetFlat', 'matInvFlat',
  ];

  for (const method of expectedMethods) {
    assert.equal(typeof se[method], 'function', `Missing SE.${method}`);
  }
  assert.equal(typeof (ctx as Record<string, unknown>).fisherExact, 'function', 'Missing global fisherExact');
  assert.equal(typeof (ctx as Record<string, unknown>).ksTest, 'function', 'Missing global ksTest');

  // Descriptive
  const desc = se.descriptive([10, 12, 14, 16, 18]) as {
    n: number; mean: string; median: string; min: string; max: string;
  };
  assert.equal(desc.n, 5);
  assert.equal(Number(desc.mean), 14);
  assert.equal(Number(desc.median), 14);
  assert.equal(Number(desc.min), 10);
  assert.equal(Number(desc.max), 18);

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

  // ANOVA + Post-hoc + Repeated Measures
  const groups = [
    { label: 'A', vals: [10, 11, 12, 13] },
    { label: 'B', vals: [14, 15, 16, 17] },
    { label: 'C', vals: [18, 19, 20, 21] },
  ];
  const anova = se.onewayANOVA(groups) as { F: string; sig: boolean };
  assert.ok(Number(anova.F) > 10);
  assert.equal(anova.sig, true);

  const tukey = se.tukeyHSD(groups) as Array<{ sig: boolean }>;
  assert.equal(tukey.length, 3);
  assert.ok(tukey.every((p) => p.sig));

  const bonf = se.bonferroniPosthoc(groups) as Array<{ sig: boolean }>;
  assert.equal(bonf.length, 3);
  assert.ok(bonf.every((p) => p.sig));

  const rm = se.repeatedMeasuresAnova([
    [10, 12, 14, 16, 18],
    [14, 16, 17, 20, 21],
    [18, 21, 23, 25, 28],
  ]) as { F: string; sig: boolean };
  assert.ok(Number(rm.F) > 10);
  assert.equal(rm.sig, true);

  // Correlation (Pearson, Partial, Canonical)
  const corr = se.pearsonR([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]) as { r: string; p: number };
  assert.equal(Number(corr.r), 1);
  assert.ok(corr.p < 0.001);

  const pcorr = se.partialCorr(
    [1, 2, 3, 4, 5, 6, 7],
    [2, 4, 5, 8, 10, 11, 14],
    [7, 5, 6, 4, 3, 2, 1]
  ) as { n: number; rp: string };
  assert.equal(pcorr.n, 7);
  assert.ok(Number(pcorr.rp) > 0.5);

  const multiRows = [
    { x1: 1, x2: 2, y1: 2, y2: 5, g: 'A', bin: 0 },
    { x1: 2, x2: 1, y1: 4, y2: 3, g: 'A', bin: 0 },
    { x1: 3, x2: 4, y1: 5, y2: 9, g: 'A', bin: 0 },
    { x1: 4, x2: 3, y1: 8, y2: 7, g: 'A', bin: 0 },
    { x1: 5, x2: 6, y1: 11, y2: 12, g: 'A', bin: 0 },
    { x1: 6, x2: 5, y1: 12, y2: 11, g: 'B', bin: 1 },
    { x1: 7, x2: 8, y1: 15, y2: 17, g: 'B', bin: 1 },
    { x1: 8, x2: 7, y1: 16, y2: 16, g: 'B', bin: 1 },
    { x1: 9, x2: 10, y1: 19, y2: 20, g: 'B', bin: 1 },
    { x1: 10, x2: 9, y1: 21, y2: 19, g: 'B', bin: 1 },
    { x1: 11, x2: 12, y1: 22, y2: 24, g: 'B', bin: 1 },
    { x1: 12, x2: 11, y1: 25, y2: 23, g: 'B', bin: 1 },
  ];

  const cca = se.canonicalCorr(['x1', 'x2'], ['y1', 'y2'], multiRows) as { n: number; tests: Array<{ rc: string }> };
  assert.equal(cca.n, 12);
  assert.ok(Number(cca.tests[0].rc) > 0.9);

  // Regression (Simple, Multiple, Logistic)
  const reg = se.linearReg([1, 2, 3, 4, 5], [3, 5, 7, 9, 11]) as { b0: string; b1: string; R2: string };
  assert.equal(Number(reg.b0), 1);
  assert.equal(Number(reg.b1), 2);
  assert.equal(Number(reg.R2), 1);

  const mreg = se.multipleReg(['x1', 'x2'], 'y1', multiRows) as { R2: string; coefs: Array<{ name: string }> };
  assert.ok(Number(mreg.R2) > 0.98);
  assert.equal(mreg.coefs.length, 3);

  const lreg = se.logisticReg('bin', ['x1', 'x2'], multiRows, 'binary') as { n: number; accuracy: number };
  assert.equal(lreg.n, 12);
  assert.ok(lreg.accuracy >= 80);

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
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    [1.1, 1.9, 3.2, 4.1, 4.8, 6.2, 7.1, 7.8, 9.2, 10.1, 10.9, 12.2, 13.1, 13.9, 15.1],
    [5, 4, 6, 5, 7, 6, 8, 7, 9, 8, 10, 9, 11, 10, 12],
    [5.2, 4.1, 5.8, 5.1, 6.9, 6.2, 7.9, 7.2, 8.9, 8.1, 10.2, 8.9, 11.1, 9.8, 12.1],
  ];
  const efaRes = se.efa(factorMat, 2, 'varimax') as { kmo: string; loadings: string[][] };
  assert.notEqual(efaRes.kmo, 'N/A');
  assert.equal(efaRes.loadings.length, 4);

  const cfaRes = se.cfa(factorMat, { F1: ['v1', 'v2'], F2: ['v3', 'v4'] }) as { CFI: string };
  assert.ok(Number(cfaRes.CFI) >= 0 && Number(cfaRes.CFI) <= 1);

  // GLM & MANOVA
  const manovaRes = se.manovaProper(multiRows, ['y1', 'y2'], 'g') as {
    n: number;
    pillai: { stat: string };
    wilks: { stat: string };
  };
  assert.equal(manovaRes.n, 12);
  assert.ok(Number(manovaRes.pillai.stat) > 0);
  assert.ok(Number(manovaRes.wilks.stat) < 1);
});
