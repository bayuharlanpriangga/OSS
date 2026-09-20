// ════════════════════════════════════════════════════════════
// js/output/output-power-render.js
// Fitur: tab Output — kartu hasil Power Analysis (`renderPowerOutput`):
//        banner power, kartu N/Total N/Power/Effect/Alpha/Groups, bar power,
//        kotak interpretasi, dan kurva power (svgPowerCurve).
// Depends on (semua global, dibaca runtime, TANPA top-level call):
//   stCard (js/core/html-helpers.js), SE.f4 (app.js),
//   svgPowerCurve (js/charts/power-plot.js)
// Pemanggil: renderOutput() di app.js, cabang o.type==='poweranalysis'
//   (1 titik, `html+=renderPowerOutput(o);`, tidak diubah).
// Data sumber: hasil computePower() (js/stats-engine/stats-poweranalysis.js)
//   yang disimpan `runPowerAnalysis()` (app.js) lewat addOutput().
// Perubahan SETELAH dipindah (2026-09-21, sesi Power Analysis eksak): kartu
//   'Predictors (u)' (hanya bila r.preds ada, yaitu regression_r2) dan argumen
//   ke-6 `r.preds` ke svgPowerCurve. Output lama tanpa r.preds tetap dirender
//   seperti dulu (u=1). Selebihnya fungsi = hasil pindah byte-exact.
// Catatan (F6, dipindah byte-exact, TIDAK diubah):
//   - `r.powerInterp` dan `r.interpretation` masuk HTML tanpa escHtml; keduanya
//     dibentuk engine dari angka & label tetap (bukan nama variabel dataset),
//     jadi bukan temuan escHtml seperti pola E2/E6/E7.
//   - Label kartu pertama selalu 'N (per group)' dan kartu 'Groups' muncul
//     saat r.groups>1, termasuk untuk uji yang N-nya total (korelasi, regresi,
//     t 1-sampel/berpasangan) karena `groups` bawaan UI = 2 — perilaku lama,
//     dicatat di Temuan F6 (ARCHITECTURE.md), belum diperbaiki.
// ════════════════════════════════════════════════════════════

function renderPowerOutput(o){
  var r=o.res;
  var testLabelsOut={'ttest_2samp':'Independent T-Test','ttest_1samp':'One-Sample T-Test','ttest_paired':'Paired T-Test','anova_oneway':'One-Way ANOVA','correlation':'Correlation (r)','regression_r2':'Multiple Regression (R²)','chisq':'Chi-Square'};
  var effLabelOut={'ttest_2samp':"Cohen's d",'ttest_1samp':"Cohen's d",'ttest_paired':"Cohen's dz",'anova_oneway':"Cohen's f",'correlation':'Pearson r','regression_r2':"Cohen's f²",'chisq':"Cohen's w"};
  var pwCol=parseFloat(r.power)>=0.9?'#34d399':parseFloat(r.power)>=0.8?'#fbbf24':'#f87171';
  var html='';
  html+='<div style="margin-bottom:12px;padding:12px 16px;border-radius:10px;background:rgba(0,0,0,.15);border:1.5px solid '+pwCol+'"><div style="font-size:14px;font-weight:800;color:'+pwCol+';font-family:Playfair Display,serif">'+r.powerInterp+'</div>';
  html+='<div style="font-size:11px;color:rgba(232,222,255,.5);margin-top:2px">'+testLabelsOut[o.pwTest||'ttest_2samp']+' · Power='+SE.f4(parseFloat(r.power)*100)+'% · α='+r.alpha+' · N='+r.n+'</div></div>';
  html+='<div class="stats-grid" style="margin-bottom:12px">';
  html+=stCard('N (per group)',r.n,'');
  html+=stCard('Total N',r.totalN||r.n,'');
  html+=stCard('Power (1−β)',SE.f4(parseFloat(r.power)*100)+'%',r.powerInterp);
  html+=stCard(effLabelOut[o.pwTest||'ttest_2samp'],SE.f4(r.effect),r.effectInterp);
  html+=stCard('Alpha (α)',r.alpha,'');
  if(r.groups>1) html+=stCard('Groups',r.groups,'k');
  if(r.preds) html+=stCard('Predictors (u)',r.preds,'');
  html+='</div>';
  html+='<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:11px;color:rgba(232,222,255,.5);margin-bottom:4px"><span>Power</span><span style="color:'+pwCol+'">'+SE.f4(parseFloat(r.power)*100)+'%</span></div>';
  html+='<div style="height:10px;background:rgba(255,255,255,.06);border-radius:99px;overflow:hidden"><div style="height:100%;width:'+Math.min(100,parseFloat(r.power)*100)+'%;background:'+pwCol+';border-radius:99px"></div></div></div>';
  html+='<div style="padding:10px 12px;background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.18);border-radius:8px;font-size:11.5px;color:rgba(232,222,255,.7);line-height:1.65">'+r.interpretation+'</div>';
  html+='<div style="margin-top:12px">'+svgPowerCurve(o.pwTest||'ttest_2samp',parseFloat(o.pwAlpha||0.05),parseInt(o.pwTails||2),undefined,undefined,r.preds)+'</div>';
  return html;
}
