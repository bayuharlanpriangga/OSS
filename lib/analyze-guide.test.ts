import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { ANALYZE_NAV_ITEMS, OSS_ENGINE_SCRIPTS } from './oss-scripts';

const ROOT_DIR = process.cwd();

function loadGuideModule(dom?: Record<string, { textContent: string; innerHTML: string; classList: { _set: Set<string>; add: (c: string) => void; remove: (c: string) => void; contains: (c: string) => boolean } }>) {
  const ctx = vm.createContext({
    Object,
    String,
    Array,
    currentASub: 'descriptive',
    escHtml: (s: unknown) =>
      String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;'),
    document: {
      getElementById: (id: string) => (dom ? dom[id] ?? null : null),
    },
  });
  const guideScripts = OSS_ENGINE_SCRIPTS.filter((s) => s.startsWith('/oss-js/guide/'));
  assert.ok(guideScripts.length >= 25, 'Expected modular guide scripts in OSS_ENGINE_SCRIPTS');
  for (const rel of guideScripts) {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'public', rel), 'utf8');
    vm.runInContext(code, ctx, { filename: rel });
  }
  return ctx as {
    OSS_GUIDE_ICON: string;
    OSS_ANALYZE_GUIDES: Record<string, { title: string; subtitle: string; summary: string }>;
    ossGuideBtn: (subId: string) => string;
    getAnalyzeGuide: (subId: string) => { title: string; subtitle?: string; summary?: string };
    openAnalyzeGuide: (subId: string) => void;
    closeAnalyzeGuide: () => void;
  };
}

test('openAnalyzeGuide populates guide modal DOM without ReferenceError and closeAnalyzeGuide closes it', () => {
  const mkNode = () => {
    const _set = new Set<string>();
    return {
      textContent: '',
      innerHTML: '',
      classList: {
        _set,
        add: (c: string) => _set.add(c),
        remove: (c: string) => _set.delete(c),
        contains: (c: string) => _set.has(c),
      },
    };
  };
  const dom = {
    'oss-guide-modal': mkNode(),
    'oss-guide-title': mkNode(),
    'oss-guide-sub': mkNode(),
    'oss-guide-body': mkNode(),
  };
  const { openAnalyzeGuide, closeAnalyzeGuide } = loadGuideModule(dom);
  openAnalyzeGuide('glm-poisson');
  assert.equal(dom['oss-guide-modal'].classList.contains('open'), true);
  assert.equal(dom['oss-guide-title'].textContent, 'Poisson Regression');
  assert.ok(dom['oss-guide-body'].innerHTML.includes('Ringkasan Uji'));
  closeAnalyzeGuide();
  assert.equal(dom['oss-guide-modal'].classList.contains('open'), false);
});

test('OSS_ANALYZE_GUIDES covers every subtab ID in GROUP_TABS, SUB_TO_GROUP, and ANALYZE_NAV_ITEMS', () => {
  const { OSS_ANALYZE_GUIDES } = loadGuideModule();

  const tabShellSrc = fs.readFileSync(
    path.join(ROOT_DIR, 'public/oss-js/analyze/analyze-tab-shell.js'),
    'utf8'
  );
  const tabIdMatches = [...tabShellSrc.matchAll(/\{id:'([^']+)'/g)].map((m) => m[1]);
  assert.ok(tabIdMatches.length >= 45, 'Expected GROUP_TABS subtab IDs');

  const routerSrc = fs.readFileSync(
    path.join(ROOT_DIR, 'public/oss-js/core/router.js'),
    'utf8'
  );
  const subToGroupBlock = routerSrc.match(/var SUB_TO_GROUP=\{([\s\S]*?)\};/)?.[1] || '';
  const routerSubIds = [...subToGroupBlock.matchAll(/'([^']+)'\s*:/g)].map((m) => m[1]);
  assert.ok(routerSubIds.length >= 45, 'Expected SUB_TO_GROUP keys');

  const navSubs = ANALYZE_NAV_ITEMS.map((item) => item.sub);

  const allSubIds = new Set([...tabIdMatches, ...routerSubIds, ...navSubs]);
  for (const subId of allSubIds) {
    const entry = OSS_ANALYZE_GUIDES[subId];
    assert.ok(entry, `Missing guide entry in OSS_ANALYZE_GUIDES for "${subId}"`);
    assert.ok(entry.title && entry.title.trim().length > 0, `Empty title for "${subId}"`);
    assert.ok(entry.summary && entry.summary.trim().length > 0, `Empty summary for "${subId}"`);
  }
});

test('ossGuideBtn renders strictly icon-only button with no visible text', () => {
  const { ossGuideBtn } = loadGuideModule();
  const sampleIds = ['descriptive', 'hierarchicalReg', 'glm-poisson', 'sem', 'metaanalysis', 'missinganalysis'];

  for (const id of sampleIds) {
    const html = ossGuideBtn(id);
    assert.ok(html.includes('class="oss-guide-btn"'), `Missing oss-guide-btn class for ${id}`);
    assert.ok(html.includes('<svg'), `Missing SVG icon for ${id}`);
    assert.ok(html.includes('aria-label="'), `Missing aria-label for ${id}`);
    assert.ok(html.includes(`openAnalyzeGuide('${id}')`), `Missing onclick handler for ${id}`);

    const visibleText = html
      .replace(/<svg[\s\S]*?<\/svg>/g, '')
      .replace(/<[^>]+>/g, '')
      .trim();
    assert.equal(visibleText, '', `Guide button for ${id} must contain no visible text, got: "${visibleText}"`);
  }
});

test('Analyze form renderers contain zero legacy inline guides and expose Preview headings', () => {
  const formSrc = fs.readFileSync(
    path.join(ROOT_DIR, 'public/oss-js/analyze/analyze-form-render.js'),
    'utf8'
  );
  const missingSrc = fs.readFileSync(
    path.join(ROOT_DIR, 'public/oss-js/data/missing-data.js'),
    'utf8'
  );

  const forbiddenPatterns = [
    /class="assump"/,
    /analyze-info-bar/,
    /Panduan Model/,
    /Quick Reference/,
    /About MANOVA/,
    /About Repeated/,
    /MI — Theory/,
    /Variance Decomposition/,
    /Workflow SEM/,
  ];

  for (const pat of forbiddenPatterns) {
    assert.equal(pat.test(formSrc), false, `Found forbidden inline guide pattern ${pat} in analyze-form-render.js`);
    assert.equal(pat.test(missingSrc), false, `Found forbidden inline guide pattern ${pat} in missing-data.js`);
  }

  const previewCount = (formSrc.match(/class="sec-hd">Preview</g) || []).length;
  assert.ok(previewCount >= 40, `Expected >= 40 Preview headings in analyze-form-render.js, found ${previewCount}`);
  assert.ok(missingSrc.includes('<div class="sec-hd">Preview</div>'), 'missing-data.js must have Preview heading');
  assert.ok(missingSrc.includes("ossGuideBtn('missinganalysis')"), 'missing-data.js must render ossGuideBtn');
});
