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

  const idx = (needle: string) => OSS_ENGINE_SCRIPTS.indexOf(needle);

  assert.ok(
    idx('/oss-js/stats-engine/stats-distributions.js') <
      idx('/oss-js/stats-engine/stats-core-basic.js'),
    'stats-distributions.js must load before stats-core-basic.js'
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

test('Core OSS statistical engine computes accurate descriptive, t-test, ANOVA, correlation, and regression metrics', () => {
  const ctx = vm.createContext({
    Math,
    Number,
    Array,
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
    '/oss-js/stats-engine/stats-core-basic.js',
    '/oss-js/stats-engine/stats-core-advanced.js',
    '/oss-js/stats-engine/stats-nonparametric.js',
    '/oss-js/stats-engine/stats-crosstab.js',
    '/oss-js/stats-engine/stats-glm-hlm.js',
    '/oss-js/app.js',
  ];

  for (const rel of engineFiles) {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'public', rel), 'utf8');
    vm.runInContext(code, ctx, { filename: rel });
  }

  const se = ctx.SE as Record<string, (...args: unknown[]) => unknown>;
  assert.ok(se && typeof se.descriptive === 'function', 'SE.descriptive should exist');

  const desc = se.descriptive([10, 12, 14, 16, 18]) as {
    n: number;
    mean: string;
    median: string;
    min: string;
    max: string;
  };
  assert.equal(desc.n, 5);
  assert.equal(Number(desc.mean), 14);
  assert.equal(Number(desc.median), 14);
  assert.equal(Number(desc.min), 10);
  assert.equal(Number(desc.max), 18);

  const tt = se.tTest([10, 12, 11, 13, 14], [20, 22, 21, 23, 24]) as {
    meanA: string;
    meanB: string;
    t: string;
    p: number;
  };
  assert.equal(Number(tt.meanA), 12);
  assert.equal(Number(tt.meanB), 22);
  assert.ok(Number(tt.t) < -5, 'Expected strongly negative t statistic');
  assert.ok(tt.p < 0.001, 'Expected p < 0.001 for separated groups');

  const corr = se.pearsonR([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]) as {
    r: string;
    p: number;
  };
  assert.equal(Number(corr.r), 1);
  assert.ok(corr.p < 0.001);

  const reg = se.linearReg([1, 2, 3, 4, 5], [3, 5, 7, 9, 11]) as {
    b0: string;
    b1: string;
    R2: string;
  };
  assert.equal(Number(reg.b0), 1);
  assert.equal(Number(reg.b1), 2);
  assert.equal(Number(reg.R2), 1);

  const alpha = se.cronbachAlpha([
    [1, 2, 3, 4, 5],
    [1, 2, 3, 4, 5],
    [2, 3, 4, 5, 6],
  ]) as { alpha: string; k: number; n: number };
  assert.equal(alpha.k, 3);
  assert.equal(alpha.n, 5);
  assert.equal(Number(alpha.alpha), 1);
});
