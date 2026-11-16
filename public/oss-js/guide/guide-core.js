// ═══════════════════════════════════════════════════════════════════════
// GUIDE CORE — Icon Button & Hidden Explanation Modal Registry (#oss-guide-modal)
// ═══════════════════════════════════════════════════════════════════════

var OSS_ANALYZE_GUIDES = OSS_ANALYZE_GUIDES || {};

var OSS_GUIDE_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M2 4.5A2.5 2.5 0 0 1 4.5 2H11a2 2 0 0 1 2 2v16a1.5 1.5 0 0 0-1.5-1.5H4.5A2.5 2.5 0 0 1 2 16z"/>' +
  '<path d="M22 4.5A2.5 2.5 0 0 0 19.5 2H13a2 2 0 0 0-2 2v16a1.5 1.5 0 0 1 1.5-1.5h7A2.5 2.5 0 0 0 22 16z"/>' +
  '<path d="M6 7h3"/><path d="M6 10.5h3"/><path d="M15 7h3"/><path d="M15 10.5h3"/>' +
  '</svg>';

function ossGuideBtn(subId) {
  var safe = String(subId || currentASub || 'descriptive').replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    '<button type="button" class="oss-guide-btn" data-guide-id="' + safe + '" ' +
    'onclick="openAnalyzeGuide(\'' + safe + '\')" ' +
    'aria-label="Panduan &amp; Penjelasan" title="Panduan &amp; Penjelasan">' +
    OSS_GUIDE_ICON +
    '</button>'
  );
}

function getAnalyzeGuide(subId) {
  var id = String(subId || currentASub || 'descriptive');
  if (OSS_ANALYZE_GUIDES[id]) return OSS_ANALYZE_GUIDES[id];
  return OSS_ANALYZE_GUIDES.descriptive;
}

function _escGuide(s) {
  if (typeof escHtml === 'function') {
    return escHtml(s == null ? '' : s).replace(/"/g, '&quot;');
  }
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function openAnalyzeGuide(subId) {
  var g = getAnalyzeGuide(subId);
  var modal = document.getElementById('oss-guide-modal');
  var titleEl = document.getElementById('oss-guide-title');
  var subEl = document.getElementById('oss-guide-sub');
  var bodyEl = document.getElementById('oss-guide-body');
  if (!modal || !titleEl || !subEl || !bodyEl || !g) return;

  titleEl.textContent = g.title;
  subEl.textContent = g.subtitle || '';

  var html = '';
  if (g.summary) {
    html +=
      '<div class="oss-guide-sec">' +
      '<div class="oss-guide-sec-title">Ringkasan Uji</div>' +
      '<div class="oss-guide-p">' + _escGuide(g.summary) + '</div>' +
      '</div>';
  }
  if (g.formula) {
    html +=
      '<div class="oss-guide-sec">' +
      '<div class="oss-guide-sec-title">Persamaan / Sintaks</div>' +
      '<div class="eq" style="margin-bottom:0">' + _escGuide(g.formula) + '</div>' +
      '</div>';
  }
  if (g.when && g.when.length) {
    html +=
      '<div class="oss-guide-sec">' +
      '<div class="oss-guide-sec-title">Kapan Digunakan</div>' +
      '<ul class="oss-guide-list">' +
      g.when.map(function (w) { return '<li>' + _escGuide(w) + '</li>'; }).join('') +
      '</ul></div>';
  }
  if (g.assumptions && g.assumptions.length) {
    html +=
      '<div class="oss-guide-sec">' +
      '<div class="oss-guide-sec-title">Asumsi &amp; Syarat Data</div>' +
      '<ul class="oss-guide-list">' +
      g.assumptions.map(function (a) { return '<li>' + _escGuide(a) + '</li>'; }).join('') +
      '</ul></div>';
  }
  if (g.metrics && g.metrics.length) {
    html +=
      '<div class="oss-guide-sec">' +
      '<div class="oss-guide-sec-title">Metrik &amp; Parameter Utama</div>' +
      '<div class="oss-guide-kv">' +
      g.metrics.map(function (m) {
        return '<div class="oss-guide-kv-row"><span class="oss-guide-kv-k">' + _escGuide(m.k) + '</span><span class="oss-guide-kv-v">' + _escGuide(m.v) + '</span></div>';
      }).join('') +
      '</div></div>';
  }
  if (g.interpretation) {
    html +=
      '<div class="oss-guide-sec">' +
      '<div class="oss-guide-sec-title">Panduan Interpretasi</div>' +
      '<div class="oss-guide-p">' + _escGuide(g.interpretation) + '</div>' +
      '</div>';
  }

  bodyEl.innerHTML = html;
  modal.classList.add('open');
}

function closeAnalyzeGuide() {
  var modal = document.getElementById('oss-guide-modal');
  if (modal) modal.classList.remove('open');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    OSS_GUIDE_ICON: OSS_GUIDE_ICON,
    ossGuideBtn: ossGuideBtn,
    OSS_ANALYZE_GUIDES: OSS_ANALYZE_GUIDES,
    getAnalyzeGuide: getAnalyzeGuide,
    openAnalyzeGuide: openAnalyzeGuide,
    closeAnalyzeGuide: closeAnalyzeGuide
  };
}
