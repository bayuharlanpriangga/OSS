// ════════════════════════════════════════════════════════════
// js/charts/roc-plot.js
// Fitur: ROC chart (E10, split roadmap OSS 2.0) — dipetakan 2026-09-19,
// tidak ada di baseline lama, dikelompokkan bareng file stats-engine
// pasangannya (computeROC ada di js/stats-engine/stats-roc.js, B-section).
// Isi:
//   - svgROC(roc,W,H): kurva ROC tunggal — grid, garis diagonal referensi,
//     area di bawah kurva (AUC fill), kurva ber-gradient (id `rocGrad`),
//     titik cutoff optimal (Youden), label AUC + interpretasi. 2 pemanggil:
//     preview di renderRocForm() (analyze-form-render.js) dan output di
//     renderOutput() kasus roc (app.js).
//   - svgROCCompare(curves,W,H): beberapa kurva ROC dalam 1 chart
//     (maks 5 warna bergiliran), legend nama + AUC per kurva.
//     `curves` = [{name, roc}] dengan `roc` hasil computeROC().
//     HANYA 1 pemanggil (preview mode compare di renderRocForm()) —
//     tidak dipakai renderOutput() di app.js, pola sama seperti
//     svgSEMDiagram/E7, svgSensitivityCurve/E8, dan svgSimpleSlopesPlot/E9.
// Depends on: escHtml() — global, dibaca runtime (dipanggil di svgROC untuk
// label tick), aman dimuat sebelum app.js (scope-fallback ke global).
// Tidak butuh SE. Tidak ada top-level call.
// ✅ Temuan E10 — SUDAH DIPERBAIKI (2026-09-20, langsung setelah pemindahan
// byte-exact diverifikasi; pola sama seperti Temuan E2/E6/E7/E9): di
// svgROCCompare, `c.name` (nama variabel skor/prediktor yang dibandingkan,
// dari data user — dibentuk di renderRocForm() dari `aState.rocCompare`)
// sempat masuk teks legend SVG TANPA escHtml. Sekarang dibungkus
// escHtml(c.name). svgROC tidak punya nama dari user di teks SVG:
// `roc.auc`/`roc.aucInterp` dihasilkan computeROC() (angka terformat +
// label tetap 'Excellent'/'Good'/'Acceptable'/'Poor'/'Fail'), tick
// sudah escHtml sejak awal — jadi aman, bukan bagian temuan.
// ════════════════════════════════════════════════════════════

function svgROC(roc,W,H){
  W=W||380;H=H||260;
  var P={l:38,r:12,t:12,b:40};
  var cw=W-P.l-P.r,ch=H-P.t-P.b;
  function tx(x){return P.l+x*cw;}
  function ty(y){return P.t+ch*(1-y);}
  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block">';
  svg+='<defs><linearGradient id="rocGrad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#f472b6" stop-opacity="0.8"/><stop offset="100%" stop-color="#c084fc" stop-opacity="0.9"/></linearGradient></defs>';
  // Grid
  [0,.25,.5,.75,1].forEach(function(v){
    var x=tx(v),y=ty(v);
    svg+='<line x1="'+x+'" x2="'+x+'" y1="'+P.t+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.05)"/>';
    svg+='<line x1="'+P.l+'" x2="'+(P.l+cw)+'" y1="'+y+'" y2="'+y+'" stroke="rgba(255,255,255,.05)"/>';
    svg+='<text x="'+x+'" y="'+(H-P.b+13)+'" text-anchor="middle" font-size="8" fill="#475569">'+escHtml(v)+'</text>';
    svg+='<text x="'+(P.l-4)+'" y="'+(y+4)+'" text-anchor="end" font-size="8" fill="#475569">'+escHtml(v)+'</text>';
  });
  // Diagonal reference line
  svg+='<line x1="'+tx(0)+'" y1="'+ty(0)+'" x2="'+tx(1)+'" y2="'+ty(1)+'" stroke="rgba(255,255,255,.2)" stroke-width="1.2" stroke-dasharray="5,3"/>';
  // AUC fill
  var areaPath='M'+tx(0)+' '+ty(0);
  roc.curve.forEach(function(pt){areaPath+=' L'+tx(pt.fpr)+' '+ty(pt.tpr);});
  areaPath+=' L'+tx(1)+' '+ty(0)+' Z';
  svg+='<path d="'+areaPath+'" fill="rgba(192,132,252,.12)" stroke="none"/>';
  // ROC curve
  var linePath=roc.curve.map(function(pt,i){return (i===0?'M':'L')+tx(pt.fpr)+' '+ty(pt.tpr);}).join('');
  svg+='<path d="'+linePath+'" fill="none" stroke="url(#rocGrad)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
  // Optimal point
  var opt=roc.curve.reduce(function(b,p){return p.youden>b.youden?p:b;},roc.curve[0]);
  svg+='<circle cx="'+tx(opt.fpr)+'" cy="'+ty(opt.tpr)+'" r="5.5" fill="#f472b6" opacity="0.9"/>';
  svg+='<circle cx="'+tx(opt.fpr)+'" cy="'+ty(opt.tpr)+'" r="2.5" fill="#fff" opacity="0.9"/>';
  // AUC label
  svg+='<text x="'+(P.l+cw-2)+'" y="'+(P.t+16)+'" text-anchor="end" font-size="10" fill="#c084fc" font-weight="700">AUC = '+roc.auc+'</text>';
  svg+='<text x="'+(P.l+cw-2)+'" y="'+(P.t+27)+'" text-anchor="end" font-size="8.5" fill="rgba(232,222,255,.45)">'+roc.aucInterp+'</text>';
  // Axes
  svg+='<line x1="'+P.l+'" y1="'+P.t+'" x2="'+P.l+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.2)" stroke-width="1.2"/>';
  svg+='<line x1="'+P.l+'" y1="'+(P.t+ch)+'" x2="'+(P.l+cw)+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.2)" stroke-width="1.2"/>';
  svg+='<text x="'+(P.l+cw/2)+'" y="'+H+'" text-anchor="middle" font-size="9" fill="#475569">1 − Specificity (FPR)</text>';
  svg+='<text x="12" y="'+(P.t+ch/2)+'" text-anchor="middle" font-size="9" fill="#475569" transform="rotate(-90,12,'+(P.t+ch/2)+')">Sensitivity (TPR)</text>';
  return svg+'</svg>';
}

function svgROCCompare(curves,W,H){
  W=W||420;H=H||280;
  var P={l:38,r:12,t:14,b:40};
  var cw=W-P.l-P.r,ch=H-P.t-P.b;
  function tx(x){return P.l+x*cw;}
  function ty(y){return P.t+ch*(1-y);}
  var colors=['#f472b6','#67e8f9','#fbbf24','#34d399','#c084fc'];
  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block">';
  [0,.25,.5,.75,1].forEach(function(v){svg+='<line x1="'+tx(v)+'" x2="'+tx(v)+'" y1="'+P.t+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.04)"/><line x1="'+P.l+'" x2="'+(P.l+cw)+'" y1="'+ty(v)+'" y2="'+ty(v)+'" stroke="rgba(255,255,255,.04)"/>';});
  svg+='<line x1="'+tx(0)+'" y1="'+ty(0)+'" x2="'+tx(1)+'" y2="'+ty(1)+'" stroke="rgba(255,255,255,.15)" stroke-width="1" stroke-dasharray="4,3"/>';
  curves.forEach(function(c,ci){
    var r=c.roc,col=colors[ci%5];
    var path=r.curve.map(function(pt,i){return (i===0?'M':'L')+tx(pt.fpr)+' '+ty(pt.tpr);}).join('');
    svg+='<path d="'+path+'" fill="none" stroke="'+col+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    var y=P.t+14+ci*15;
    svg+='<line x1="'+(P.l+4)+'" x2="'+(P.l+18)+'" y1="'+y+'" y2="'+y+'" stroke="'+col+'" stroke-width="2"/>';
    svg+='<text x="'+(P.l+22)+'" y="'+(y+4)+'" font-size="9" fill="'+col+'">'+escHtml(c.name)+' (AUC='+r.auc+')</text>';
  });
  svg+='<line x1="'+P.l+'" y1="'+P.t+'" x2="'+P.l+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.2)" stroke-width="1.2"/>';
  svg+='<line x1="'+P.l+'" y1="'+(P.t+ch)+'" x2="'+(P.l+cw)+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.2)" stroke-width="1.2"/>';
  svg+='<text x="'+(P.l+cw/2)+'" y="'+H+'" text-anchor="middle" font-size="9" fill="#475569">1 − Specificity (FPR)</text>';
  return svg+'</svg>';
}
