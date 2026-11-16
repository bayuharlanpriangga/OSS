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
  assert.equal(engineDiskFiles.length, 47, `Expected 47 modular engine files, got ${engineDiskFiles.length}`);
  assert.equal(fs.existsSync(path.join(ROOT_DIR, 'public/oss-js/data/imputation.js')), false, 'Old data/imputation.js must be removed');
  assert.equal(fs.existsSync(path.join(ROOT_DIR, 'public/oss-js/data/spreadsheet-mode.js')), false, 'Merged data/spreadsheet-mode.js must be removed');
  assert.equal(OSS_ENGINE_SCRIPTS.includes('/oss-js/data/spreadsheet-mode.js'), false, 'Merged spreadsheet-mode.js must not be referenced');
  assert.equal(fs.existsSync(path.join(ROOT_DIR, 'public/oss-js/engine/engine-hlm/engine-hlm.js')), false, 'Old shared engine-hlm.js must be removed');
  assert.equal(fs.existsSync(path.join(ROOT_DIR, 'public/oss-js/engine/engine-imputation/engine-imputation.js')), false, 'Old merged engine-imputation.js must be removed');
  for (const rel of engineDiskFiles) {
    assert.equal(
      OSS_ENGINE_SCRIPTS.includes(rel),
      true,
      `Engine module on disk is missing from OSS_ENGINE_SCRIPTS: ${rel}`
    );
  }

  // Every .js file inside /public/oss-js/output/ must be registered in OSS_ENGINE_SCRIPTS
  assert.equal(fs.existsSync(path.join(ROOT_DIR, 'public/oss-js/output/output-render-basic.js')), false, 'Obsolete output-render-basic.js must be removed');
  assert.equal(fs.existsSync(path.join(ROOT_DIR, 'public/oss-js/output/output-render-advanced.js')), false, 'Obsolete output-render-advanced.js must be removed');
  assert.equal(fs.existsSync(path.join(ROOT_DIR, 'public/oss-js/output/output-power-render.js')), false, 'Obsolete output-power-render.js must be removed');
  assert.equal(OSS_ENGINE_SCRIPTS.includes('/oss-js/output/output-render-basic.js'), false);
  assert.equal(OSS_ENGINE_SCRIPTS.includes('/oss-js/output/output-render-advanced.js'), false);
  assert.equal(OSS_ENGINE_SCRIPTS.includes('/oss-js/output/output-power-render.js'), false);

  assert.equal(fs.existsSync(path.join(ROOT_DIR, 'public/oss-js/output/output-correlation/output-correlation-partial.js')), false, 'Merged output-correlation-partial.js must be removed');
  assert.equal(OSS_ENGINE_SCRIPTS.includes('/oss-js/output/output-correlation/output-correlation-partial.js'), false);
  assert.equal(fs.existsSync(path.join(ROOT_DIR, 'public/oss-js/output/output-regression/output-regression-count.js')), false, 'Ambiguous output-regression-count.js must be removed');
  assert.equal(OSS_ENGINE_SCRIPTS.includes('/oss-js/output/output-regression/output-regression-count.js'), false);
  assert.equal(fs.existsSync(path.join(ROOT_DIR, 'public/oss-js/output/output-hlm/output-hlm.js')), false, 'Combined output-hlm.js must be split into 3 subtype files');
  assert.equal(OSS_ENGINE_SCRIPTS.includes('/oss-js/output/output-hlm/output-hlm.js'), false);

  const outputDiskFiles = listJsFiles(path.join(ROOT_DIR, 'public/oss-js/output')).map(
    (abs) => '/' + path.relative(path.join(ROOT_DIR, 'public'), abs).replace(/\\/g, '/')
  );
  const modularOutputFiles = outputDiskFiles.filter((f) => f.startsWith('/oss-js/output/output-') && f !== '/oss-js/output/output-view-shell.js');
  assert.equal(modularOutputFiles.length, 42, `Expected 42 modular output renderer files, got ${modularOutputFiles.length}`);
  for (const rel of outputDiskFiles) {
    assert.equal(
      OSS_ENGINE_SCRIPTS.includes(rel),
      true,
      `Output module on disk is missing from OSS_ENGINE_SCRIPTS: ${rel}`
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
    idx('/oss-js/engine/engine-regression/engine-regression-multiple.js') <
      idx('/oss-js/engine/engine-regression/engine-regression-hierarchical.js'),
    'engine-regression-multiple.js must load before engine-regression-hierarchical.js'
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
    idx('/oss-js/engine/engine-ttest/engine-ttest-paired.js') <
      idx('/oss-js/engine/engine-glm/engine-glm-repeated.js'),
    'engine-ttest-paired.js must load before engine-glm-repeated.js'
  );
  assert.ok(
    idx('/oss-js/data/data-dataset.js') < idx('/oss-js/data/data-dataview.js'),
    'data-dataset.js must load before data-dataview.js'
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
  assert.ok(
    idx('/oss-js/output/output-anova/output-anova-table.js') <
      idx('/oss-js/output/output-anova/output-anova-twoway.js'),
    'output-anova-table.js must load before output-anova-twoway.js'
  );
  assert.ok(
    idx('/oss-js/output/output-anova/output-anova-table.js') <
      idx('/oss-js/output/output-anova/output-anova-threeway.js'),
    'output-anova-table.js must load before output-anova-threeway.js'
  );
  const outputShellIdx = idx('/oss-js/output/output-view-shell.js');
  for (const rel of OSS_ENGINE_SCRIPTS.filter((s) => s.startsWith('/oss-js/output/output-') && s !== '/oss-js/output/output-view-shell.js')) {
    assert.ok(idx(rel) < outputShellIdx, `${rel} must load before output-view-shell.js`);
  }
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

test('Modular /oss-js/engine/ preserves full SE API parity and accurate statistical computations across all 47 modules', () => {
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
  assert.equal(engineAndAppScripts.length, 48, 'Expected 47 engine modules + app.js');

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
    'linearReg', 'multipleReg', 'hierarchicalReg', 'glmUnivariate', 'glmRepeated',
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

  const hreg = se.hierarchicalReg('y1', [['x1'], ['x2']], multiRows) as {
    depVar: string;
    blocks: Array<{ block: number; dR2: string; Fchange: string; dfNum: number }>;
  };
  assert.equal(hreg.depVar, 'y1');
  assert.equal(hreg.blocks.length, 2);
  assert.equal(hreg.blocks[0].block, 1);
  assert.equal(hreg.blocks[1].block, 2);
  assert.ok(Number(hreg.blocks[0].dR2) > 0.9);
  assert.equal(hreg.blocks[1].dfNum, 1);

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

  // GLM, Repeated Measures, MANOVA & HLM
  const manovaRes = se.manovaProper(multiRows, ['y1', 'y2'], 'g') as {
    n: number;
    pillai: { stat: string };
    wilks: { stat: string };
  };
  assert.equal(manovaRes.n, 16);
  assert.ok(Number(manovaRes.pillai.stat) > 0);
  assert.ok(Number(manovaRes.wilks.stat) < 1);

  const glmRepRes = se.glmRepeated(multiRows, 'x1', 'y1', 'g') as {
    n: number;
    meanDiff: string;
    interaction: { factor: string; dfB: number } | null;
  };
  assert.equal(glmRepRes.n, 16);
  assert.ok(glmRepRes.interaction !== null);
  assert.equal(glmRepRes.interaction?.factor, 'g');
  assert.equal(glmRepRes.interaction?.dfB, 1);

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

test('Data View & Variable View hide missing summaries while Missing Data uses Missing Analysis view & sidebar miss-nav-badge', () => {
  const els: Record<string, { innerHTML: string; textContent: string; style: Record<string, string>; querySelector: () => null }> = {
    'app-content': { innerHTML: '', textContent: '', style: {}, querySelector: () => null },
    'badge-cases': { innerHTML: '', textContent: '', style: {}, querySelector: () => null },
    'tb-cases': { innerHTML: '', textContent: '', style: {}, querySelector: () => null },
    'miss-nav-badge': { innerHTML: '', textContent: '', style: {}, querySelector: () => null },
    'out-badge': { innerHTML: '', textContent: '', style: {}, querySelector: () => null },
  };
  const ctx = vm.createContext({
    Math, Number, Array, Set, Object, String, Boolean, JSON, isFinite, isNaN, parseFloat, parseInt, console,
    document: {
      getElementById: (id: string) => els[id] || null,
      querySelectorAll: () => [],
      head: { appendChild: () => {} },
      createElement: () => ({ id: '', textContent: '' }),
    },
    IC: { warn: '', search: '', plus: '', check: '', edit: '', upload: '', trash: '', sort_asc: '', sort_desc: '' },
    escHtml: (s: unknown) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    ossGuideBtn: () => '',
    isMiss: (v: unknown) => v === null || v === undefined || v === '' || (typeof v === 'number' && !Number.isFinite(v)),
    missCount: () => [
      { name: 'x1', count: 1 },
      { name: 'x2', count: 2 },
    ],
    aState: { wcActive: false, wcVar: '' },
    getNEff: () => 2,
    outputs: [],
    renderDsSidebar: () => {},
    showToast: () => {},
    openAnalyze: () => {},
    ossDialog: () => {},
    vars: [
      { name: 'x1', label: 'x1', type: 'Numeric', measure: 'Scale', role: 'Input', dec: 2 },
      { name: 'x2', label: 'x2', type: 'Numeric', measure: 'Scale', role: 'Input', dec: 2 },
    ],
    data: [
      { id: 1, x1: 10, x2: null },
      { id: 2, x1: null, x2: null },
    ],
  });

  const scripts = [
    '/oss-js/data/data-dataview.js',
    '/oss-js/data/data-variableview.js',
    '/oss-js/data/data-missingdata.js',
    '/oss-js/ui-misc/badges.js',
  ];
  for (const rel of scripts) {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'public', rel), 'utf8');
    vm.runInContext(code, ctx, { filename: rel });
  }

  const g = ctx as Record<string, (...args: unknown[]) => unknown>;
  const target = els['app-content'];

  // 1. Data View must not display miss-warn banner
  g.renderData(target);
  assert.equal(target.innerHTML.includes('miss-warn'), false, 'Data View must not render miss-warn banner');
  assert.equal(target.innerHTML.includes('Missing:'), false, 'Data View must not render Missing summary');

  // 2. Variable View must not display Missing Value Summary or Miss column
  g.renderVars(target);
  assert.equal(target.innerHTML.includes('Missing Value Summary'), false, 'Variable View must not render Missing Value Summary');
  assert.equal(target.innerHTML.includes('>Miss<'), false, 'Variable View must not render Miss column');

  // 3. Missing Data page renders Missing Analysis content renamed to Missing Data
  const missingHtml = String(g.renderMissingDataAnalysis());
  assert.ok(missingHtml.includes('>Missing Data<'));
  assert.ok(missingHtml.includes('Overall Summary'));
  assert.ok(missingHtml.includes("Little's MCAR Test"));
  assert.equal(missingHtml.includes('Kelola Sel Hilang per Baris'), false);

  // 4. updateBadges updates #miss-nav-badge with total missing count (3)
  g.updateBadges();
  assert.equal(els['miss-nav-badge'].textContent, '3');
  assert.equal(els['miss-nav-badge'].style.display, 'inline-flex');

  // 5. When 0 missing with rows, #miss-nav-badge hides
  ctx.missCount = () => [
    { name: 'x1', count: 0 },
    { name: 'x2', count: 0 },
  ];
  g.updateBadges();
  assert.equal(els['miss-nav-badge'].textContent, '0');
  assert.equal(els['miss-nav-badge'].style.display, 'none');

  // 6. When variables exist (3 vars) but data has 0 rows, count = 3 in badge & Missing Data monitoring view
  ctx.vars = [
    { name: 'var1', label: 'var1', type: 'Numeric', measure: 'Scale', role: 'Input', dec: 2 },
    { name: 'var2', label: 'var2', type: 'Numeric', measure: 'Scale', role: 'Input', dec: 2 },
    { name: 'var3', label: 'var3', type: 'Numeric', measure: 'Scale', role: 'Input', dec: 2 },
  ];
  ctx.data = [];
  ctx.missCount = () => [
    { name: 'var1', count: 0 },
    { name: 'var2', count: 0 },
    { name: 'var3', count: 0 },
  ];
  g.updateBadges();
  assert.equal(els['miss-nav-badge'].textContent, '3');
  assert.equal(els['miss-nav-badge'].style.display, 'inline-flex');

  const emptyRowsHtml = String(g.renderMissingDataAnalysis());
  assert.ok(emptyRowsHtml.includes('100.0%'));
  assert.ok(emptyRowsHtml.includes('var1'));
  assert.ok(emptyRowsHtml.includes('var2'));
  assert.ok(emptyRowsHtml.includes('var3'));

  // 7. Header (#tb-miss) & sidebar footer (#badge-miss) missing badges are removed from TSX components
  const sidebarSrc = fs.readFileSync(path.join(ROOT_DIR, 'components/Sidebar.tsx'), 'utf8');
  const topbarSrc = fs.readFileSync(path.join(ROOT_DIR, 'components/TopBar.tsx'), 'utf8');
  assert.equal(sidebarSrc.includes('id="badge-miss"'), false, 'Sidebar footer must not render #badge-miss');
  assert.equal(sidebarSrc.includes('Missing Analysis'), false, 'Sidebar must not render Missing Analysis under Analyze');
  assert.equal(topbarSrc.includes('id="tb-miss"'), false, 'TopBar header must not render #tb-miss');
});

test('Output page uses mobile display modal, 1x1..4x4 grid only in Groups mode, icon-only Copy/Export, and Groups multi-select trash edit mode', () => {
  const modalClasses = new Set<string>();
  const els: Record<string, {
    innerHTML: string;
    textContent: string;
    classList: {
      add: (c: string) => void;
      remove: (c: string) => void;
      contains: (c: string) => boolean;
    };
  }> = {
    'app-content': {
      innerHTML: '',
      textContent: '',
      classList: { add: () => {}, remove: () => {}, contains: () => false },
    },
    'out-display-modal': {
      innerHTML: '',
      textContent: '',
      classList: {
        add: (c: string) => modalClasses.add(c),
        remove: (c: string) => modalClasses.delete(c),
        contains: (c: string) => modalClasses.has(c),
      },
    },
    'out-display-body': {
      innerHTML: '',
      textContent: '',
      classList: { add: () => {}, remove: () => {}, contains: () => false },
    },
  };

  let badgesUpdated = 0;
  let toastMsg = '';
  const sampleOutputs = [
    { id: 1001, type: 'descriptive', field: 'x1', title: 'Descriptives: x1', stats: { n: 3, mean: 2, median: 2, mode: 'None', std: 1, variance: 1, sem: 0.5774, ci95: '[0,4]', min: 1, max: 3, range: 2, q1: 1, q3: 3, iqr: 2, skewness: '0', kurtosis: '0', shapiroW: '1', shapiroP: '1' } },
    { id: 1002, type: 'ttest', title: 'T-Test: x1 by grp', ga: 'A', gb: 'B', res: { t: '2.5', df: 4, p: 0.04, p_fmt: '0.040', meanA: '1', meanB: '3', sdA: '1', sdB: '1', nA: 3, nB: 3, cohensD: '1.2', dInterp: 'large', ci95: '[0.1,3.9]' } },
    { id: 1003, type: 'correlation', title: 'Correlation: x1 x y1', crX: 'x1', crY: 'y1', crType: 'pearson', res: { r: '0.9', r2: '0.81', p: 0.01, p_fmt: '0.010', ci95: '[0.4,0.99]', direction: 'positif', strength: 'kuat' } },
  ];

  const ctx = vm.createContext({
    Math, Number, Array, Set, Object, String, Boolean, JSON, Date, isFinite, isNaN, parseFloat, parseInt, console,
    setTimeout,
    document: {
      getElementById: (id: string) => els[id] || null,
      createElement: () => ({ value: '', style: { cssText: '' }, focus: () => {}, select: () => {} }),
      body: { appendChild: () => {}, removeChild: () => {} },
      execCommand: () => true,
    },
    navigator: {},
    IC: { check: '<svg data-check="1"></svg>' },
    outputs: sampleOutputs.slice(),
    escHtml: (s: unknown) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    parsePValue: (p: unknown) => parseFloat(String(p)),
    renderOutBasic_descriptive: () => '<div>desc-body</div>',
    renderOutBasic_ttest: () => '<div>ttest-body</div>',
    renderOutBasic_correlation: () => '<div>corr-body</div>',
    renderTab: (t: string) => {
      if (t === 'output') (ctx.renderOutput as (el: unknown) => void)(els['app-content']);
    },
    updateBadges: () => { badgesUpdated++; },
    showToast: (m: string) => { toastMsg = m; },
  });

  for (const rel of ['/oss-js/output/apa-copy.js', '/oss-js/output/output-view-shell.js']) {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'public', rel), 'utf8');
    vm.runInContext(code, ctx, { filename: rel });
  }

  const g = ctx as Record<string, (...args: unknown[]) => unknown>;
  const outEl = els['app-content'];

  // 1. Default All mode: no Clear All button, Copy & Export are icon-only, no Grid picker shown in All mode
  g.renderOutput(outEl);
  assert.equal(outEl.innerHTML.includes('Clear All'), false, 'Clear All button must be removed');
  assert.equal(outEl.innerHTML.includes('out-display-modal-btn'), true, 'Mobile display modal button must render');
  assert.equal(outEl.innerHTML.includes('>Copy APA<'), false, 'Copy APA button must be icon-only');
  assert.equal(outEl.innerHTML.includes('>Export<'), false, 'Export button must be icon-only');
  assert.equal(outEl.innerHTML.includes('setOutDisplayGrid'), false, 'Grid options must not render in All mode');
  assert.equal(outEl.innerHTML.includes('out-group-trash-btn'), false, 'Group trash edit button only renders in Groups mode');

  // 2. Icon-only Copy APA feedback swaps to check icon without overwriting with text
  const mockCopyBtn = {
    attrs: new Map<string, string>([['data-icon-only', '1']]),
    classes: new Set<string>(),
    innerHTML: '<svg data-copy="1"></svg>',
    textContent: '',
    getAttribute(k: string) { return this.attrs.get(k) ?? null; },
    setAttribute(k: string, v: string) { this.attrs.set(k, v); },
    classList: {
      add(c: string) { mockCopyBtn.classes.add(c); },
      remove(c: string) { mockCopyBtn.classes.delete(c); },
    },
  };
  g.copyAPA(1001, mockCopyBtn);
  assert.equal(mockCopyBtn.innerHTML.includes('data-check="1"'), true);
  assert.equal(mockCopyBtn.classes.has('copied'), true);

  // 3. Mobile display modal: All mode shows Mode (All/Groups) and hides Tampilan grid
  g.openOutDisplayModal();
  assert.equal(modalClasses.has('open'), true);
  assert.equal(els['out-display-body'].innerHTML.includes('>Mode<'), true);
  assert.equal(els['out-display-body'].innerHTML.includes('>Tampilan<'), false);

  // 4. Switching to Groups inside modal reveals Tampilan with ONLY 1×1, 2×2, 3×3, 4×4
  g.setOutDisplayMode('group');
  const modalBodyGroup = els['out-display-body'].innerHTML;
  assert.equal(modalBodyGroup.includes('>Tampilan<'), true);
  assert.equal(modalBodyGroup.includes('1×1'), true);
  assert.equal(modalBodyGroup.includes('2×2'), true);
  assert.equal(modalBodyGroup.includes('3×3'), true);
  assert.equal(modalBodyGroup.includes('4×4'), true);
  assert.equal(modalBodyGroup.includes('1×2'), false);
  assert.equal(modalBodyGroup.includes('2×3'), false);
  assert.equal(modalBodyGroup.includes('2×4'), false);
  assert.equal(modalBodyGroup.includes('3×4'), false);

  // Set 2×2 grid and verify group grid CSS var & group trash button
  g.setOutDisplayGrid(2);
  assert.equal(outEl.innerHTML.includes('--out-cols:2'), true);
  assert.equal(outEl.innerHTML.includes('id="out-group-trash-btn"'), true);

  // 5. Group edit mode state machine:
  // Click trash -> enters edit mode (red .is-edit class + checkboxes on group cards)
  g.toggleOutGroupTrash();
  assert.equal(outEl.innerHTML.includes('out-trash-btn is-edit'), true);
  assert.equal(outEl.innerHTML.includes('class="out-grp-chk"'), true);

  // Click trash again with 0 selected -> exits edit mode & removes checkboxes
  g.toggleOutGroupTrash();
  assert.equal(outEl.innerHTML.includes('out-trash-btn is-edit'), false);
  assert.equal(outEl.innerHTML.includes('class="out-grp-chk"'), false);

  // Re-enter edit mode, select 2 groups ('Descriptives' & 'Correlation'), click red trash -> deletes only those 2 groups
  g.toggleOutGroupTrash();
  g.toggleOutGroupSelect('Descriptives');
  g.toggleOutGroupSelect('Correlation');
  assert.equal(outEl.innerHTML.includes('2 dipilih'), true);
  g.toggleOutGroupTrash();

  assert.equal((ctx.outputs as Array<{ id: number }>).length, 1);
  assert.equal((ctx.outputs as Array<{ id: number }>)[0].id, 1002);
  assert.equal(outEl.innerHTML.includes('out-trash-btn is-edit'), false);
  assert.equal(outEl.innerHTML.includes('class="out-grp-chk"'), false);
  assert.ok(badgesUpdated >= 1);
  assert.ok(toastMsg.includes('2 output'));

  // Modal markup exists in OssModals.tsx
  const modalsSrc = fs.readFileSync(path.join(ROOT_DIR, 'components/OssModals.tsx'), 'utf8');
  assert.equal(modalsSrc.includes('id="out-display-modal"'), true);
});

test('Modular /oss-js/output/ renderers expose all 46 global renderer functions and render valid HTML', () => {
  const ctx = vm.createContext({
    Math, Number, Array, Set, Object, String, Boolean, JSON, Date, isFinite, isNaN, parseFloat, parseInt, console,
    data: [{ x1: 1, y1: 2, g: 'A' }, { x1: 2, y1: 4, g: 'A' }, { x1: 3, y1: 6, g: 'B' }, { x1: 4, y1: 8, g: 'B' }],
    escHtml: (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    stCard: (label: unknown, val: unknown, sub?: unknown) => `<div class="sb"><b>${label}</b>:${val}${sub ?? ''}</div>`,
    mkTable: (headers: string[], rows: unknown[][]) => `<table>${headers.join(',')}|${rows.map((r) => r.join(',')).join(';')}</table>`,
    sigBadge: (p: unknown) => `<span class="sig">${p}</span>`,
    ossChartTheme: () => ({ ice: '#4F7A99', primary: '#0D0D0D', ok: '#2F7048', muted: '#4A5663', ink: '#0D0D0D', grid: '#ccc', series: ['#0D0D0D', '#4F7A99', '#D4A72C'] }),
    SE: { f4: (n: unknown) => Number(n).toFixed(4), f1: (n: unknown) => Number(n).toFixed(1), pFmt: (p: number) => p.toFixed(3), mean: (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length, std: () => 1 },
    svgHistogram: () => '<svg data-hist="1"/>',
    svgQQ: () => '<svg data-qq="1"/>',
    svgBoxplot: () => '<svg data-box="1"/>',
    svgScatter: () => '<svg data-scatter="1"/>',
    svgResidual: () => '<svg data-resid="1"/>',
    svgInteractionPlot: () => '<svg data-int="1"/>',
    svgScreePlot: () => '<svg data-scree="1"/>',
    svgMediationPath: () => '<svg data-med="1"/>',
    svgClusterPlot: () => '<svg data-cluster="1"/>',
    svgElbow: () => '<svg data-elbow="1"/>',
    svgDendrogram: () => '<svg data-dendro="1"/>',
    svgConvergence: () => '<svg data-conv="1"/>',
    svgROC: () => '<svg data-roc="1"/>',
    svgROCCompare: () => '<svg data-roc-cmp="1"/>',
    svgKaplanMeier: () => '<svg data-km="1"/>',
    svgForestPlot: () => '<svg data-forest="1"/>',
    svgBayesPosterior: () => '<svg data-bayes="1"/>',
    svgMetaForestPlot: () => '<svg data-meta-forest="1"/>',
    svgFunnelPlot: () => '<svg data-funnel="1"/>',
    svgModerationPlot: () => '<svg data-mod="1"/>',
    svgJohnsonNeymanPlot: () => '<svg data-jn="1"/>',
    svgPowerCurve: () => '<svg data-power="1"/>',
    generateLavaanSyntax: () => 'F1 =~ i1 + i2',
  });

  const modularScripts = OSS_ENGINE_SCRIPTS.filter(
    (s) => s.startsWith('/oss-js/output/output-') && s !== '/oss-js/output/output-view-shell.js'
  );
  assert.equal(modularScripts.length, 42);

  for (const rel of modularScripts) {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'public', rel), 'utf8');
    vm.runInContext(code, ctx, { filename: rel });
  }

  const expectedRenderers = [
    'renderAnovaTable',
    'renderOutBasic_descriptive',
    'renderOutBasic_ttest',
    'renderOutBasic_onesamp',
    'renderOutBasic_paired',
    'renderOutBasic_anova',
    'renderOutBasic_anova2',
    'renderOutBasic_anova3',
    'renderOutBasic_rmanova',
    'renderOutBasic_correlation',
    'renderOutBasic_partialCorr',
    'renderOutBasic_canonicalCorr',
    'renderOutBasic_regression',
    'renderOutBasic_multipleReg',
    'renderOutBasic_hierarchicalReg',
    'renderOutBasic_logistic',
    'renderOutBasic_poisson',
    'renderOutBasic_negbin',
    'renderOutBasic_mannwhitney',
    'renderOutBasic_kruskal',
    'renderOutBasic_wilcoxon',
    'renderOutBasic_glm',
    'renderOutBasic_manova',
    'renderOutBasic_repeated',
    'renderOutAdv_hlm_icc',
    'renderOutAdv_hlm_twolevel',
    'renderOutAdv_hlm_threelevel',
    'renderOutAdv_alpha',
    'renderOutAdv_kappa',
    'renderOutAdv_efa',
    'renderOutAdv_cfa',
    'renderOutAdv_sem',
    'renderOutAdv_mediation',
    'renderModerationOutput',
    'renderOutAdv_discriminant',
    'renderOutAdv_cluster',
    'renderOutAdv_mi',
    'renderOutAdv_roc',
    'renderOutAdv_survival',
    'renderOutAdv_cox',
    'renderPowerOutput',
    'renderOutAdv_bayes_ttest',
    'renderOutAdv_bayes_corr',
    'renderOutAdv_bayes_posterior',
    'renderOutAdv_timeseries',
    'renderOutAdv_metaanalysis',
  ];

  const g = ctx as Record<string, (...args: unknown[]) => string>;
  for (const fnName of expectedRenderers) {
    assert.equal(typeof g[fnName], 'function', `Missing global renderer ${fnName}`);
  }

  // Smoke render representative modules across categories
  const descHtml = g.renderOutBasic_descriptive({
    field: 'x1',
    stats: { n: 4, mean: '2.5000', skewness: '0.0000', shapiroP: '0.950', ksP: '0.900', outlierCount: 0 },
  });
  assert.ok(descHtml.includes('Normality Summary'));

  const anova2Html = g.renderOutBasic_anova2({
    res: {
      depVar: 'y1', factorA: 'A', factorB: 'B', n: 12, grandMean: '5.0',
      levA: ['1', '2'], levB: ['1', '2'],
      effects: [{ source: 'A', SS: '4.0', df: 1, MS: '4.0', F: '5.2', p_fmt: '0.041', sig: true, eta2: '0.32', pEta2: '0.35' }],
      error: { SS: '8.0', df: 8, MS: '1.0' },
      total: { SS: '12.0', df: 11 },
      meanA: [{ level: '1', mean: '4.0', n: 6 }],
      meanB: [{ level: '1', mean: '4.5', n: 6 }],
      cellMeansTable: [],
    },
  });
  assert.ok(anova2Html.includes('Factorial Design'));
  assert.ok(anova2Html.includes('Error'));

  const powerHtml = g.renderPowerOutput({
    pwTest: 'ttest_2samp', pwAlpha: 0.05, pwTails: 2,
    res: { n: 64, totalN: 128, power: '0.8012', powerInterp: 'Adequate Power', alpha: '0.05', effect: 0.5, effectInterp: 'Medium', groups: 2, interpretation: 'Sample size 64 per group.' },
  });
  assert.ok(powerHtml.includes('Adequate Power'));

  const bayesHtml = g.renderOutAdv_bayes_ttest({
    ga: 'A', gb: 'B', tails: 2,
    res: { BF10: '24.500', BF01: '0.041', interpretation: 'Strong evidence for H1', cohensD: '1.10', dInterp: 'Large', t: '3.45', df: 18, p_fmt: '0.003', n1: 10, n2: 10, priorScale: '0.707' },
  });
  assert.ok(bayesHtml.includes('BF₁₀ = 24.500'));

  const poissonHtml = g.renderOutBasic_poisson({
    type: 'poisson',
    res: { n: 20, logLik: '-32.1000', mcFaddenR2: '0.3100', dispersion: '1.1200', lrDf: 1, lrChi2: '12.4000', lrP: '0.001', converged: true, coefs: [{ name: 'x1', b: '0.4500', se: '0.1200', z: '3.7500', p: '0.0002', irr: '1.5683', irrCI: '[1.24, 1.98]', sig: true }], warnings: [] },
  });
  assert.ok(poissonHtml.includes('Poisson'));
  assert.ok(!poissonHtml.includes('Negative Binomial'));

  const negbinHtml = g.renderOutBasic_negbin({
    type: 'negbin',
    res: { n: 20, logLik: '-30.1000', mcFaddenR2: '0.3500', theta: '2.5000', thetaDesc: 'Dispersion parameter θ', pearsonDispersion: '1.0500', lrDf: 1, lrChi2: '14.2000', lrP: '0.001', converged: true, coefs: [{ name: 'x1', b: '0.4100', se: '0.1300', z: '3.1500', p: '0.0016', irr: '1.5068', irrCI: '[1.16, 1.94]', sig: true }], warnings: [] },
  });
  assert.ok(negbinHtml.includes('Negative Binomial'));
  assert.ok(negbinHtml.includes('θ (dispersion)'));

  const repHtml = g.renderOutBasic_repeated({
    type: 'repeated', varA: 'x1', varB: 'y1',
    res: { n: 16, meanA: '8.5000', sdA: '4.7610', meanB: '17.3750', sdB: '9.8582', meanDiff: '-8.8750', sdDiff: '5.1490', seDiff: '1.2873', t: '-6.8945', df: 15, p: '0.0000', p_fmt: '< .001', cohensD: '1.7236', dInterp: 'Large', ci95: '[-11.62, -6.13]', normD: 'W=0.96 p=0.65', interaction: { factor: 'g', dfB: 1, dfW: 14, F: '6.12', p_fmt: '0.027', sig: true, eta2: '0.304', groupStats: [{ label: 'A', n: 5, mean: '5.0', sd: '1.2' }, { label: 'B', n: 11, mean: '10.6', sd: '2.1' }] } },
  });
  assert.ok(repHtml.includes('Within-Subjects Difference'));
  assert.ok(repHtml.includes('Time × g'));

  const hlmIccHtml = g.renderOutAdv_hlm_icc({ dep: 'y1', group: 'g', res: { ICC: '0.1800', ICC2: '0.7200', k: 4, n: 40, grandMean: '12.50', pctBetween: '18.0', varBetween: '2.1', varWithin: '9.5', design_effect: '2.62', effectiveN: 15, F: '4.12', sig: true, p_fmt: '0.012', grpStats: [] } });
  assert.ok(hlmIccHtml.includes('ICC (1)'));
  const hlm2Html = g.renderOutAdv_hlm_twolevel({ dep: 'y1', group: 'g', res: { subtype: 'hlm-2level', modelType: 'intercept', ICC: '0.15', ICC_null: '0.20', k: 4, n: 40, pseudoR2_L1: '0.22', pseudoR2_L2: '0.31', AIC: '120.1', BIC: '125.4', deviance: '112.1', varBetween: '1.5', nullTau00: '2.1', varWithin: '8.5', nullSigma2: '9.5', lrtDf: 1, lrtChi2: '5.4', lrtP_fmt: '0.020', fixedEffects: [], grpStats: [] } });
  assert.ok(hlm2Html.includes('Conditional ICC'));
  const hlm3Html = g.renderOutAdv_hlm_threelevel({ dep: 'y1', group: 'g', group2: 'g2', res: { subtype: 'hlm-3level', ICC_L3: '0.12', varL3: '1.2', ICC_L2_within_L3: '0.25', varBetween: '2.5', varL2: '1.3', varL1: '7.5', vpcL3: '12.0', vpcL2: '13.0', vpcL1: '75.0', F_L3: '3.2', p_L3_fmt: '0.040', sig_L3: true, F_L2: '2.8', p_L2_fmt: '0.030', sig_L2: true, k3: 3, k2: 6, n: 40, AIC: '118.0', BIC: '126.0', deviance: '108.0', fixedEffects: [], l3Stats: [] } });
  assert.ok(hlm3Html.includes('Three-Level Variance Partitioning'));
});



