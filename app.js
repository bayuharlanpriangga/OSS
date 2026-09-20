


var SE = (() => {

  function f1(x){return isFinite(x)?Math.round(x*10)/10:'—';}

  // ── Logistic Regression (Binary & Multinomial) ── DIPINDAH ke
  // js/stats-engine/stats-core-advanced.js (B24, 2026-09-15)

  // pFromF: compute p-value from F distribution using Wilson-Hilferty approx
  function pFromF(F, df1, df2){
    if(!isFinite(F)||F<=0||df1<=0||df2<=0) return 1;
    // Patnaik two-moment approximation via chi-square
    var x = df1*F;
    var p = pChiApprox(x, df1, df2);
    return p;
  }
  function pChiApprox(F, df1, df2){
    // Beta incomplete function approx using continued fraction or WH
    var x = df2/(df2 + df1*F);
    // Use regularized incomplete beta via normal approx
    // For moderate df, Wilson-Hilferty on F dist
    var a = (2*df2+df1*F)/(2*(df2+df1*F));
    var mu = 1 - 2/(9*df2);
    var sig = Math.sqrt(2/(9*df2));
    var z = (Math.pow(df2/(df2+df1*F), 1/3) - mu) / sig;
    return normCDF(z);
  }

  // ── Poisson Regression (via IRLS, log link) ──────────── DIPINDAH ke
  // js/stats-engine/stats-glm-hlm.js (B25, 2026-09-16), bersama helper
  // solveLinear/invertMatrix dan Negative Binomial Regression di bawah.

  return {
    validNums, isV, mean, std, vari, quantile, normInv, sw, normCDF,
    descriptive, tTest, oneSampleT, pairedTTest, onewayANOVA,
    tukeyHSD, lsdPosthoc, bonferroniPosthoc, holmBonferroni, holmBonferroniPosthoc,
    twowayANOVA, threewayANOVA,
    pearsonR, spearmanR, partialCorr, canonicalCorr,
    linearReg, multipleReg, glmUnivariate,
    chiSquare, mannWhitney, kruskalWallis, wilcoxon,
    cronbachAlpha, cohenKappa, efa, cfa, levene, f4, f1, pFmt, tP,
    logisticReg, poissonReg, negbinReg,
    solveLinear, invertMatrix,
    manovaProper, repeatedMeasuresAnova, fmt4:f4,
    pFromF,
    fCDF, chiCDF,
    // ✅ TEMUAN DIPERBAIKI (2026-09-15): matMul/matT/matDet/matInv
    // (versi 2D-array — EFA/CFA/MANOVA/canonicalCorr) dan
    // matMulFlat/matTFlat/matDetFlat/matInvFlat (versi flat-array —
    // multipleReg, setelah di-rename saat memperbaiki tabrakan nama
    // B1 di stats-core-advanced.js) sebelumnya TIDAK PERNAH dimasukkan
    // ke sini, jadi `SE.matInv`/`SE.matMul` dkk selalu `undefined` di
    // luar file stats-core-advanced.js — bikin MICE imputation
    // (stats-imputation.js) dan Cox regression (stats-survival.js)
    // diam-diam gagal invert matrix dan fallback ke hasil yang salah.
    matMul, matT, matDet, matInv,
    matMulFlat, matTFlat, matDetFlat, matInvFlat
  };

})();

// ── MULTI-DATASET SYSTEM (C1) — DIPINDAH ke
// js/data/dataset-manager.js (2026-09-18): var datasets/activeDatasetId/
// data/vars/outputs, getActiveDs, _dsSyncSave, _dsSyncLoad, switchDataset,
// addDataset, deleteDataset, renameDataset, showAddDatasetModal,
// renderDsSidebar. File dimuat SEBELUM app.js (kategori "3. Data layer"
// di index.html) — semua dependency (ossDialog/showToast/switchTab/
// updateBadges/escDlg/escHtml/escHtmlAttr) diakses runtime di dalam
// function body, pola sama B13/B15/B19/B21/B23.

var cmdSelIdx=0;

// ── Analyze sub-tab state (aState) + field helpers (numFields/allFields/
// isMiss/missCount) — DIPINDAH ke js/analyze/analyze-subtab-ui.js (C2,
// split roadmap OSS 2.0). File dimuat SEBELUM app.js (kategori "4. Analyze
// layer" di index.html, sebelum <script src="app.js">) — pola sama C1
// (dataset-manager.js): aState object literal murni, field helpers baca
// vars/data di dalam function body (runtime), aman via scope-fallback ke
// global baru tanpa ubah call-site di app.js.

// ── WEIGHT HELPERS — getNEff & getWeightedRows DIPINDAH ke
// js/data/weight-cases.js (B23, 2026-09-15)

function showToast(msg,type='success'){
  const t=document.getElementById('toast');
  var icon=type==='error'
    ?'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
    :'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  t.innerHTML=icon+' '+escHtml(msg);
  t.className=type;t.style.display='flex';
  clearTimeout(window._toastTimer);
  window._toastTimer=setTimeout(()=>t.style.display='none',2600);
}
function runSafe(fn,label){try{fn();showToast(label+' berhasil');}catch(e){showToast(e.message,'error');}}
var _syntaxHistory=[];
function _genSyntaxFromOutput(item){
  if(!item)return null;
  var ts=new Date().toLocaleTimeString();
  var lines=['/* '+ts+' — '+(item.title||item.type)+' */'];
  var t=item.type;
  if(t==='descriptive'){
    lines.push('DESCRIPTIVES VARIABLES='+item.field);
    lines.push('  /STATISTICS=MEAN STDDEV MIN MAX SKEWNESS KURTOSIS.');
  } else if(t==='ttest'){
    lines.push('T-TEST GROUPS='+(item.grp||'')+'('+(item.ga||'')+','+(item.gb||'')+')');
    lines.push('  /VARIABLES='+(item.dv||'')+'.');
  } else if(t==='onesamp'){
    lines.push('T-TEST');
    lines.push('  /TESTVAL='+(item.mu||0));
    lines.push('  /VARIABLES='+(item.dv||'')+'.');
  } else if(t==='paired'){
    lines.push('T-TEST PAIRS='+(item.a||'')+' WITH '+(item.b||'')+'.');
  } else if(t==='anova'){
    lines.push('ONEWAY '+(item.dv||'')+' BY '+(item.grp||''));
    lines.push('  /STATISTICS DESCRIPTIVES POSTHOC.');
  } else if(t==='anova2'||t==='anova3'){
    var ivs=((item.ivs||[]).join(' '));
    lines.push('UNIANOVA '+(item.dv||'')+' BY '+ivs);
    lines.push('  /METHOD=SSTYPE(3)');
    lines.push('  /PRINT DESCRIPTIVE ETASQ.');
  } else if(t==='correlation'){
    var flds=((item.fields||[item.x,item.y]).filter(Boolean));
    lines.push('CORRELATIONS');
    lines.push('  /VARIABLES='+flds.join(' ')+'.');
  } else if(t==='regression'){
    lines.push('REGRESSION');
    lines.push('  /DEPENDENT='+(item.y||''));
    lines.push('  /METHOD=ENTER '+(item.x||'')+'.');
  } else if(t==='multipleReg'){
    lines.push('REGRESSION');
    lines.push('  /DEPENDENT='+(item.y||''));
    lines.push('  /METHOD=ENTER '+((item.xs||[]).join(' '))+'.');
  } else if(t==='logistic'){
    lines.push('LOGISTIC REGRESSION '+(item.y||''));
    lines.push('  /METHOD=ENTER '+((item.xs||[]).join(' '))+'.');
  } else { return null; }
  return lines.join('\n');
}
function addOutput(item){
  var entry=Object.assign({id:Date.now()},item);
  outputs.unshift(entry);
  updateBadges();
  var syn=_genSyntaxFromOutput(item);
  if(syn){
    _syntaxHistory.unshift({ts:Date.now(),title:item.title||item.type,syntax:syn});
    if(_syntaxHistory.length>30)_syntaxHistory.length=30;
  }
  // Show a toast notification instead of auto-switching to Output tab
  showToast('Analisis berhasil');
  // If user is already on output tab, refresh it live
  if(typeof currentTab!=='undefined' && currentTab==='output'){
    var _ocel=document.getElementById('app-content');
    if(_ocel) renderOutput(_ocel);
  }
}
function tryStats(fn){try{return fn();}catch(e){return{_err:true,msg:e.message};}}

// ── ANOVA Source Table renderer (renderAnovaTable) — DIPINDAH ke
// js/output/output-render-basic.js (E3, split roadmap OSS 2.0). File dimuat
// SEBELUM app.js — renderAnovaTable murni string builder (tanpa dependency,
// tanpa top-level call), dipanggil di runtime dari renderOutput() (kasus
// anova2 & anova3) di bawah.


// ── HTML HELPERS (sigBadge/stCard/mkTable/selOpts) — DIPINDAH ke
// js/core/html-helpers.js (C4, split roadmap OSS 2.0). File dimuat
// SEBELUM app.js — stCard/mkTable memanggil escHtml (masih di app.js,
// dipanggil di runtime setelah app.js dimuat, bukan saat parse), aman
// via scope-fallback ke global, pola sama file-file pre-app.js lain.

// ── CUSTOM SELECT — MODAL BOTTOM SHEET (mkCsel/mkSelect/mkOptCsel/
// varBdg/openCselById/openOptCselById/_buildCselList/filterCsel/closeCsel
// + listener keydown Escape) — DIPINDAH ke js/ui-misc/custom-select.js
// (C5, split roadmap OSS 2.0). File dimuat SEBELUM app.js — varBdg baca
// `vars` di runtime, mkCsel/mkOptCsel memanggil escHtml di runtime (pola
// sama C4), dan listener keydown aman dipasang lebih awal karena
// closeCsel/closeCmd baru betul-betul dipanggil saat user tekan Escape.


// ════════════════════════════════════════════════════════════════════════
// TAB SWITCHING
// ════════════════════════════════════════════════════════════════════════
// switchTab/renderTab defined below

// ── DATA VIEW — tabel utama, sort/search/select, windowed rendering
// (var sortCol/sortDir/searchQ/selRows/sprMode/_ossDataPageThreshold/
// _ossDataPageSize/_ossDataShown + function renderData) — DIPINDAH ke
// js/data/data-view.js (C6, split roadmap OSS 2.0). File dimuat SEBELUM
// app.js — semua dependency dibaca/dipanggil di dalam body renderData()
// di runtime, bukan top-level, aman lewat scope-fallback ke global.

// ── SPREADSHEET (BULK EDIT) MODE + sisa fungsi Data View — DIPINDAH ke
// js/data/spreadsheet-mode.js (C7, split roadmap OSS 2.0). File dimuat
// SEBELUM app.js — semua dependency dibaca/dipanggil di dalam function
// body (runtime), aman lewat scope-fallback ke global. Lihat catatan di
// spreadsheet-mode.js: blok ini campuran Spreadsheet Mode murni + sisa
// fungsi Data View (searchData/toggleSort/dll) + escHtmlAttr (utility
// umum) + toggleCoefView (tidak berhubungan, byte-exact dipindah apa
// adanya).


// ── VARIABLE VIEW — edit mode, inline add/change, picker TYPE/MEASURE/
// ROLE (renderVars + _var*/editVarField/cycleVarType/cycleMeasure/
// cycleRole/moveVar/deleteVar/clearAllData/addVarModal/confirmAddVar) —
// DIPINDAH ke js/data/variable-view.js (C8, split roadmap OSS 2.0). File
// dimuat SEBELUM app.js — dependency dibaca di runtime, aman lewat
// scope-fallback ke global. CATATAN (update 2026-09-20): `renderAnalyze`
// (fungsi tepat di bawah ini) juga sudah dipindah — lihat
// js/analyze/analyze-tab-shell.js.


// ── ANALYZE TAB SHELL (renderAnalyze) — DIPINDAH ke
// js/analyze/analyze-tab-shell.js (file terpisah, sesuai keputusan
// user). File dimuat SEBELUM app.js — dependency (currentGroup/
// currentASub/SUB_TO_GROUP/switchASub/renderASub/positionSubTabIndicator)
// dibaca di runtime, aman lewat scope-fallback ke global.


// ── Sliding pill indicator for .sub-tabs groups (var _subTabAnim +
// positionSubTabIndicator + listener resize) — DIPINDAH ke
// js/analyze/analyze-subtab-ui.js (C9, split roadmap OSS 2.0, file
// TARGET SAMA dengan C2). File itu belum ikut diupload sesi ini, jadi
// isinya sementara ada di fragmen js/analyze/_C9_append_to_analyze-
// subtab-ui.js — perlu digabung manual ke analyze-subtab-ui.js yang
// sudah ada (pola sama _B24_append_to_stats-core-advanced.js dulu).


// ── Mediation path diagram SVG (svgMediationPath) — DIPINDAH ke
// js/charts/sem-mediation-diagram.js (E6, split roadmap OSS 2.0). File
// dimuat SEBELUM app.js (kategori 4, setelah forest-funnel-plot.js) —
// pemanggil di renderOutput() kasus 'mediation' resolve lewat
// scope-fallback ke global, tidak diubah. Temuan escHtml (xName/mName/
// yName tanpa escape) sudah DIPERBAIKI di file target (2026-09-20).
// svgSEMDiagram (E7) juga sudah dipindah ke file yang sama — lihat
// pointer comment di bekas lokasinya (dulu sekitar baris 992).

function toggleModCov(f,checked){
  if(!aState.modCovs) aState.modCovs=[];
  if(checked){if(!aState.modCovs.includes(f))aState.modCovs.push(f);}
  else aState.modCovs=aState.modCovs.filter(function(x){return x!==f;});
  renderASub();
}

// SE helper for fInv (add to SE if missing)
// Kuantil F (invers CDF): cari x sehingga P(F<=x)=p. Bisection di atas `fP` GLOBAL
// (upper-tail, stats-distributions.js) — BUKAN SE.fP: SE.fP tidak pernah diekspor, dan
// versi lama (`SE.fP?…:0.5` + langkah ×0.9/×1.1) selalu mengembalikan 117.39 untuk
// semua argumen (diperbaiki 2026-09-21, Temuan F poin 11). NaN untuk input tak valid,
// sehingga pemanggil dengan `||fallback` tetap jalan.
if(!SE.fInv){
  SE.fInv=function(p,df1,df2){
    if(!(p>0&&p<1)||!(df1>0)||!(df2>0)) return NaN;
    var cdf=function(x){return 1-fP(x,df1,df2);};
    var lo=0,hi=1;
    while(cdf(hi)<p){lo=hi;hi*=2;if(hi>1e12) return NaN;}
    for(var i=0;i<200;i++){
      var mid=(lo+hi)/2;
      if(cdf(mid)<p) lo=mid; else hi=mid;
      if(hi-lo<1e-12*Math.max(1,hi)) break;
    }
    return (lo+hi)/2;
  };
}
// Nama "Approx" dipertahankan agar pemanggil (stats-poweranalysis.js) tidak berubah, tapi
// sekarang cuma membungkus SE.fInv yang eksak. Rumus Wilson-Hilferty lama salah
// (mis. 1.64 untuk F(.95;2,30) padahal 3.316).
if(!SE.fCritApprox){
  SE.fCritApprox=function(p,df1,df2){
    var v=SE.fInv(p,df1,df2);
    return isFinite(v)?Math.max(0.01,v):NaN;
  };
}
if(!SE.chiCritApprox){
  SE.chiCritApprox=function(p,df){
    var z=SE.normInv(p);
    var k=2/9/df;
    return Math.max(0,df*Math.pow(1-k+z*Math.sqrt(k),3));
  };
}

// ── Power Analysis chart (svgPowerCurve, svgSensitivityCurve) —
// DIPINDAH ke js/charts/power-plot.js (E8, split roadmap OSS 2.0, baru
// dipetakan 2026-09-19 — lihat Temuan E). Dimuat SEBELUM app.js
// (kategori 4, setelah sem-mediation-diagram.js) — dependency
// computePower() sudah ada di js/stats-engine/stats-poweranalysis.js
// yang dimuat lebih dulu (kategori 3), jadi aman. Pemanggil:
// svgPowerCurve 2 titik (preview renderPowerForm() di
// analyze-form-render.js + output renderOutput() kasus 'poweranalysis'
// di app.js, tidak diubah); svgSensitivityCurve 1 titik (preview saja,
// tidak dipakai renderOutput(), pola sama seperti svgSEMDiagram/E7).
// Tidak ada temuan escHtml — tidak ada nama variabel dataset yang
// dirender ke SVG di kedua fungsi ini.

function runPowerAnalysis(){
  runSafe(function(){
    var pw=aState;
    var res=computePower(pw.pwTest||'ttest_2samp',parseFloat(pw.pwAlpha)||0.05,parseFloat(pw.pwPower)||0.80,parseFloat(pw.pwEffect)||0.5,parseInt(pw.pwGroups||2),parseInt(pw.pwTails||2),pw.pwSolve||'n',parseInt(pw.pwN||30));
    var testLabels3={'ttest_2samp':'Independent T-Test','ttest_1samp':'One-Sample T-Test','ttest_paired':'Paired T-Test','anova_oneway':'One-Way ANOVA','correlation':'Correlation','regression_r2':'Multiple Regression','chisq':'Chi-Square'};
    var title='Power Analysis ('+testLabels3[pw.pwTest||'ttest_2samp']+'): N='+res.n+', power='+SE.f4(res.power*100)+'%, d/f/r='+SE.f4(res.effect);
    addOutput({type:'poweranalysis',title:title,res:res,pwTest:pw.pwTest,pwAlpha:pw.pwAlpha,pwPower:pw.pwPower,pwEffect:pw.pwEffect,pwGroups:pw.pwGroups,pwTails:pw.pwTails,pwSolve:pw.pwSolve});
  },'Power Analysis');
}

// ── Moderation Analysis chart (svgModerationPlot, svgSimpleSlopesPlot,
// svgJohnsonNeymanPlot) — DIPINDAH ke js/charts/moderation-plot.js (E9,
// split roadmap OSS 2.0, baru dipetakan 2026-09-19 — lihat Temuan E).
// Dimuat SEBELUM app.js (kategori 4, setelah power-plot.js). Pemanggil:
// svgModerationPlot & svgJohnsonNeymanPlot masing-masing 2 titik
// (preview + output, tidak diubah); svgSimpleSlopesPlot HANYA 1 titik
// (preview saja, pola sama seperti svgSEMDiagram/E7 &
// svgSensitivityCurve/E8). Temuan escHtml E9 (`wName` di
// svgJohnsonNeymanPlot tanpa escape) sudah DIPERBAIKI di file target
// (2026-09-20); renderModerationOutput() di bawah juga sudah
// di-escape (header, nama koefisien, interpretasi).

function runModeration(){
  runSafe(function(){
    if(!aState.modX) throw new Error('Select Independent Variable (X)');
    if(!aState.modW) throw new Error('Select Moderator (W)');
    if(!aState.modY) throw new Error('Select Dependent Variable (Y)');
    if(aState.modX===aState.modW||aState.modX===aState.modY||aState.modW===aState.modY) throw new Error('X, W, and Y must be different variables');
    var res=computeModeration(aState.modX,aState.modW,aState.modY,aState.modCovs||[],aState.modCenter!==false);
    var title='Moderation: '+aState.modX+'×'+aState.modW+' → '+aState.modY+(parseFloat(res.interaction.p)<0.05?' ✓':' ✗');
    addOutput({type:'moderation',title:title,res:res,modX:aState.modX,modW:aState.modW,modY:aState.modY,modCenter:aState.modCenter});
  },'Moderation Analysis');
}

// ════════════════════════════════════════════════════════════════════════
// MULTIPLE IMPUTATION (MICE — Predictive Mean Matching / Normal)
// ════════════════════════════════════════════════════════════════════════
function toggleMIVar(f,checked){
  if(!aState.miVars) aState.miVars=[];
  if(checked){if(!aState.miVars.includes(f))aState.miVars.push(f);}
  else aState.miVars=aState.miVars.filter(function(x){return x!==f;});
  renderASub();
}

function runMultipleImputation(){
  runSafe(function(){
    if(!aState.miVars||!aState.miVars.length) throw new Error('Select at least 1 variable to impute');
    var res=computeMICE(data,aState.miVars,parseInt(aState.miM)||5,aState.miMethod||'pmm');
    // Apply first imputed dataset to actual data
    var firstImp=res.imputedDatasets[0];
    data=firstImp;
    updateBadges();
    var title='Multiple Imputation ('+res.method.toUpperCase()+', M='+res.M+'): ['+res.targetVars.join(', ')+']';
    addOutput({type:'mi',title:title,res:res});
    showToast('Imputation berhasil');
  },'Multiple Imputation');
}

// ════════════════════════════════════════════════════════════════════════
// ROC CURVE
// ════════════════════════════════════════════════════════════════════════
function toggleROCCompare(f,checked){
  if(!aState.rocCompare) aState.rocCompare=[];
  if(checked){if(!aState.rocCompare.includes(f))aState.rocCompare.push(f);}
  else aState.rocCompare=aState.rocCompare.filter(function(x){return x!==f;});
  renderASub();
}

// ── ROC chart (svgROC, svgROCCompare) — DIPINDAH ke js/charts/roc-plot.js
// (E10, split roadmap OSS 2.0, baru dipetakan 2026-09-19 — lihat Temuan
// E). Dimuat SEBELUM app.js (kategori 4, setelah moderation-plot.js).
// Pemanggil: svgROC 2 titik (preview renderRocForm() di
// analyze-form-render.js + output renderOutput() kasus roc di bawah, tidak
// diubah); svgROCCompare HANYA 1 titik (preview mode compare saja, pola
// sama seperti E7/E8/E9). toggleROCCompare() di atas dan runROC() di
// bawah TIDAK ikut dipindah (bukan chart, bukan bagian E10).

function runROC(){
  runSafe(function(){
    if(!aState.rocProb) throw new Error('Select Predicted Probability variable');
    if(!aState.rocTrue) throw new Error('Select True Outcome variable');
    var res=computeROC(data,aState.rocProb,aState.rocTrue,aState.rocPosClass);
    var title='ROC Curve: '+aState.rocProb+' → '+aState.rocTrue+' | AUC='+res.auc+' ('+res.aucInterp+')';
    addOutput({type:'roc',title:title,res:res,rocProb:aState.rocProb,rocTrue:aState.rocTrue});
  },'ROC Analysis');
}

// ════════════════════════════════════════════════════════════════════════
// SURVIVAL ANALYSIS — Kaplan-Meier + Log-Rank + Cox PH
// ════════════════════════════════════════════════════════════════════════
function toggleSurvCov(f,checked){
  if(!aState.survCovs) aState.survCovs=[];
  if(checked){if(!aState.survCovs.includes(f))aState.survCovs.push(f);}
  else aState.survCovs=aState.survCovs.filter(function(x){return x!==f;});
  renderASub();
}


// ── Survival chart (svgKaplanMeier, svgForestPlot) — DIPINDAH ke
// js/charts/survival-plot.js (E11, split roadmap OSS 2.0, dipetakan
// 2026-09-19 — lihat Temuan E). Dimuat SEBELUM app.js (kategori 4, setelah
// roc-plot.js). Pemanggil: svgKaplanMeier 3 titik (preview KM + Log-Rank di
// renderSurvivalForm() analyze-form-render.js, output renderOutput() kasus
// survival di bawah); svgForestPlot 2 titik (preview Cox + output kasus cox).
// Call-site tidak diubah. toggleSurvCov() di atas TIDAK ikut dipindah
// (bukan chart).

// ── Multiple Imputation chart (svgConvergence) — DIPINDAH ke
// js/charts/imputation-plot.js (E14, split roadmap OSS 2.0, terakhir di
// Section E — 14/14). Dimuat SEBELUM app.js (kategori 4, setelah
// bayesian-plot.js). Pemanggil: 1 titik (output renderOutput() kasus MI,
// baris ~2853). Call-site tidak diubah. Temuan escHtml (p.variable, nama
// variabel dataset dari computeMICE, sebelumnya masuk teks SVG tanpa escape
// — pola sama dengan E2/E6/E7/E9/E10/E12) sudah diperbaiki sekalian di file
// baru.

// chi2CDF helper for survival (uses SE if available, else own)
if(!SE.chi2CDF){
  SE.chi2CDF=function(x,df){
    if(x<=0) return 0;
    // Regularized incomplete gamma P(df/2, x/2) via series
    var a=df/2,z=x/2;
    if(z<0) return 0;
    if(z<a+1){
      var ap=a,s=1/a,d=s;
      for(var i=0;i<100;i++){ap++;d*=z/ap;s+=d;if(Math.abs(d)<1e-8)break;}
      return Math.min(1,s*Math.exp(-z+a*Math.log(z)-lnGammaSimple(a)));
    } else {
      var b=z+1-a,c=1/1e-30,d2=1/b,h=d2;
      for(var i=1;i<=100;i++){var an=-i*(i-a);b+=2;d2=an*d2+b;if(Math.abs(d2)<1e-30)d2=1e-30;c=b+an/c;if(Math.abs(c)<1e-30)c=1e-30;d2=1/d2;var del=d2*c;h*=del;if(Math.abs(del-1)<1e-8)break;}
      return Math.max(0,1-Math.exp(-z+a*Math.log(z)-lnGammaSimple(a))*h);
    }
  };
}
function lnGammaSimple(x){
  var c=[76.18009172947146,-86.50532032941677,24.01409824083091,-1.231739572450155,0.1208650973866179e-2,-0.5395239384953e-5];
  var y=x,tmp=x+5.5;tmp-=(x+0.5)*Math.log(tmp);
  var ser=1.000000000190015;for(var j=0;j<6;j++)ser+=c[j]/(++y);
  return -tmp+Math.log(2.5066282746310005*ser/x);
}

function runSurvival(){
  runSafe(function(){
    if(!aState.survTime) throw new Error('Select Time variable');
    if(!aState.survEvent) throw new Error('Select Event variable');
    var res=computeKaplanMeier(data,aState.survTime,aState.survEvent,aState.survGroup||null);
    var gDesc=aState.survGroup?(' by '+aState.survGroup):'';
    var title='Kaplan-Meier: '+aState.survTime+gDesc+(res.groups.length>=2?' | LR p='+res.logrank.p_fmt:'');
    addOutput({type:'survival',title:title,res:res,survTime:aState.survTime,survEvent:aState.survEvent,survGroup:aState.survGroup});
  },'Survival Analysis');
}

function runCoxRegression(){
  runSafe(function(){
    if(!aState.survTime) throw new Error('Select Time variable');
    if(!aState.survEvent) throw new Error('Select Event variable');
    if(!aState.survCovs||!aState.survCovs.length) throw new Error('Select at least 1 covariate');
    var res=computeCoxRegression(data,aState.survTime,aState.survEvent,aState.survCovs);
    var title='Cox Regression: '+aState.survCovs.join(', ')+' → '+aState.survTime+' | C='+res.concordance;
    addOutput({type:'cox',title:title,res:res,survTime:aState.survTime,survEvent:aState.survEvent,covariates:aState.survCovs});
  },'Cox Regression');
}

function toggleMedM(f,checked){
  if(!aState.medM) aState.medM=[];
  if(checked){if(!aState.medM.includes(f))aState.medM.push(f);}
  else aState.medM=aState.medM.filter(function(x){return x!==f;});
  renderASub();
}

function runMediation(){
  runSafe(function(){
    if(!aState.medX) throw new Error('Select Independent Variable (X)');
    if(!aState.medY) throw new Error('Select Dependent Variable (Y)');
    if(!aState.medM||!aState.medM.length) throw new Error('Select at least 1 Mediator (M)');
    var res=computeMediation(aState.medX,aState.medM,aState.medY,aState.medBootN||5000);
    var title='Mediation: '+aState.medX+' → ['+aState.medM.join(', ')+'] → '+aState.medY;
    addOutput({type:'mediation',title:title,res:res,medX:aState.medX,medY:aState.medY,medM:aState.medM.slice()});
  },'Mediation Analysis');
}

function toggleEfaVar(f,checked){
  if(!aState.efaVars) aState.efaVars=[];
  if(checked){if(!aState.efaVars.includes(f))aState.efaVars.push(f);}
  else aState.efaVars=aState.efaVars.filter(function(x){return x!==f;});
  // clamp nFactors
  if(aState.efaFactors>aState.efaVars.length) aState.efaFactors=Math.max(1,aState.efaVars.length);
  renderASub();
}

function runEFA(){
  runSafe(function(){
    if(!aState.efaVars||aState.efaVars.length<2) throw new Error('Select at least 2 variables for EFA');
    if(aState.efaFactors<1||aState.efaFactors>aState.efaVars.length) throw new Error('Number of factors must be between 1 and '+aState.efaVars.length);
    var matrix=aState.efaVars.map(function(v){return SE.validNums(data.map(function(r){return r[v];}));});
    var minLen=Math.min.apply(null,matrix.map(function(m){return m.length;}));
    if(minLen<aState.efaVars.length+1) throw new Error('Need more observations (N > p='+aState.efaVars.length+')');
    matrix=matrix.map(function(m){return m.slice(0,minLen);});
    var res=SE.efa(matrix,aState.efaFactors,aState.efaRotation);
    var title='EFA ('+aState.efaFactors+' factors, '+aState.efaRotation+'): ['+aState.efaVars.join(', ')+']';
    addOutput({type:'efa',title:title,res:res,efaVars:aState.efaVars.slice()});
  },'Factor Analysis');
}

function setCfaFactors(n){
  aState.cfaFactors=n;
  // Rebuild factor names keeping existing ones
  var oldNames=aState.cfaFactorNames||[];
  var newNames=[];
  for(var i=0;i<n;i++) newNames.push(oldNames[i]||('F'+(i+1)));
  aState.cfaFactorNames=newNames;
  // Rebuild factorMap keeping existing assignments
  var newMap={};
  newNames.forEach(function(fn){ newMap[fn]=aState.cfaFactorMap[fn]||[]; });
  aState.cfaFactorMap=newMap;
  renderASub();
}
function renameCfaFactor(idx,name){
  var oldName=aState.cfaFactorNames[idx];
  aState.cfaFactorNames[idx]=name||('F'+(idx+1));
  // Move map entry
  var oldVars=aState.cfaFactorMap[oldName]||[];
  delete aState.cfaFactorMap[oldName];
  aState.cfaFactorMap[aState.cfaFactorNames[idx]]=oldVars;
  renderASub();
}
function toggleCfaVar(factorName,varName,checked){
  if(!aState.cfaFactorMap[factorName]) aState.cfaFactorMap[factorName]=[];
  if(checked){
    // Remove from other factors (each variable only in one factor for now)
    aState.cfaFactorNames.forEach(function(fn){
      if(fn!==factorName&&aState.cfaFactorMap[fn]){
        aState.cfaFactorMap[fn]=aState.cfaFactorMap[fn].filter(function(v){return v!==varName;});
      }
    });
    if(!aState.cfaFactorMap[factorName].includes(varName)) aState.cfaFactorMap[factorName].push(varName);
  } else {
    aState.cfaFactorMap[factorName]=aState.cfaFactorMap[factorName].filter(function(v){return v!==varName;});
  }
  renderASub();
}
function runCFA(){
  runSafe(function(){
    var hasMin=Object.keys(aState.cfaFactorMap).some(function(fn){return (aState.cfaFactorMap[fn]||[]).length>=2;});
    if(!hasMin) throw new Error('Setiap faktor membutuhkan minimal 2 indikator');
    var allVars=[];
    aState.cfaFactorNames.forEach(function(fn){
      (aState.cfaFactorMap[fn]||[]).forEach(function(v){if(!allVars.includes(v))allVars.push(v);});
    });
    if(allVars.length<2) throw new Error('Minimal 2 variabel total untuk CFA');
    var matrix=allVars.map(function(v){return SE.validNums(data.map(function(r){return r[v];}));});
    var minLen=Math.min.apply(null,matrix.map(function(m){return m.length;}));
    if(minLen<allVars.length+10) throw new Error('Perlu lebih banyak observasi (N ≥ p+10). N='+minLen+', p='+allVars.length);
    matrix=matrix.map(function(m){return m.slice(0,minLen);});
    var res=SE.cfa(matrix,aState.cfaFactorMap);
    var factorSummary=aState.cfaFactorNames.map(function(fn){
      return fn+':['+( (aState.cfaFactorMap[fn]||[]).join(', ') )+']';
    }).join('; ');
    var title='CFA ('+aState.cfaFactors+' faktor): '+factorSummary;
    addOutput({type:'cfa',title:title,res:res});
  },'Confirmatory Factor Analysis');
}

// ════════════════════════════════════════════════════════════════════════
// SEM — Structural Equation Modeling
// ════════════════════════════════════════════════════════════════════════

// State management helpers
function semAddLatent(){
  var inp=document.getElementById('sem-new-latent');
  var name=(inp?inp.value:'').trim();
  if(!name){showToast('Masukkan nama konstruk','error');return;}
  if(aState.semLatents.includes(name)){showToast('Nama sudah ada','error');return;}
  aState.semLatents.push(name);
  aState.semLatentMap[name]=[];
  renderASub();
}
function semRemoveLatent(idx){
  var name=aState.semLatents[idx];
  aState.semLatents.splice(idx,1);
  delete aState.semLatentMap[name];
  // Remove paths involving this latent
  aState.semPaths=aState.semPaths.filter(function(p){return p.from!==name&&p.to!==name;});
  renderASub();
}
function semRenameLatent(idx,newName){
  var oldName=aState.semLatents[idx];
  if(!newName||newName===oldName) return;
  if(aState.semLatents.includes(newName)){return;}
  aState.semLatents[idx]=newName;
  aState.semLatentMap[newName]=aState.semLatentMap[oldName]||[];
  delete aState.semLatentMap[oldName];
  // Rename in paths
  aState.semPaths.forEach(function(p){
    if(p.from===oldName) p.from=newName;
    if(p.to===oldName) p.to=newName;
  });
}
function semToggleIndicator(latentName,varName,checked){
  if(!aState.semLatentMap[latentName]) aState.semLatentMap[latentName]=[];
  if(checked){
    if(!aState.semLatentMap[latentName].includes(varName)) aState.semLatentMap[latentName].push(varName);
  } else {
    aState.semLatentMap[latentName]=aState.semLatentMap[latentName].filter(function(v){return v!==varName;});
  }
  renderASub();
}
function semAddPath(){
  var fromEl=document.getElementById('sem-from');
  var toEl=document.getElementById('sem-to');
  // Read directly from aState since we use mkSelect
  var from=aState.semPathFrom||aState.semLatents[0];
  var to=aState.semPathTo||aState.semLatents[aState.semLatents.length-1];
  if(!from||!to){showToast('Pilih konstruk asal dan tujuan','error');return;}
  if(from===to){showToast('Dari dan ke harus berbeda','error');return;}
  var exists=aState.semPaths.some(function(p){return p.from===from&&p.to===to;});
  if(exists){showToast('Path sudah ada','error');return;}
  aState.semPaths.push({from:from,to:to});
  renderASub();
}
function semRemovePath(idx){
  aState.semPaths.splice(idx,1);
  renderASub();
}

// ── Core SEM computation + helper (logDet, traceRinvImpl, pChiSquare) ───
// DIPINDAH ke js/stats-engine/stats-mediation-sem.js (B19, 2026-09-15)

// ── SEM Path Diagram SVG (svgSEMDiagram) — DIPINDAH ke
// js/charts/sem-mediation-diagram.js (E7, split roadmap OSS 2.0, file
// sama dengan svgMediationPath/E6). Dimuat SEBELUM app.js (kategori 4,
// bareng E6) — 1 pemanggil (preview) di renderSEMForm(),
// js/analyze/analyze-form-render.js; tidak ada pemanggil di app.js
// (grep 2026-09-20, tidak dipakai renderOutput). Signature tidak
// berubah, resolve lewat scope-fallback ke global. Temuan escHtml
// (nama konstruk laten & indikator tanpa escape) sudah DIPERBAIKI di
// file target (2026-09-20).

// ── Generate lavaan syntax ──────────────────────────────────────────────
// DIPINDAH ke js/stats-engine/stats-mediation-sem.js (B19, 2026-09-15)

// ── Run SEM → Output ────────────────────────────────────────────────────
function runSEM(){
  runSafe(function(){
    if(!aState.semLatents||!aState.semLatents.length) throw new Error('Tambah konstruk laten di Measurement Model');
    var allReady=aState.semLatents.every(function(ln){return (aState.semLatentMap[ln]||[]).length>=2;});
    if(!allReady) throw new Error('Setiap konstruk butuh ≥2 indikator');
    var res=computeSEM(aState.semLatents,aState.semLatentMap,aState.semPaths);
    var constructSummary=aState.semLatents.join(', ');
    addOutput({
      type:'sem',
      title:'SEM: '+constructSummary+(aState.semPaths.length?' — '+aState.semPaths.length+' structural path(s)':''),
      res:res,
      latents:aState.semLatents.slice(),
      latentMap:JSON.parse(JSON.stringify(aState.semLatentMap)),
      paths:aState.semPaths.slice()
    });
    showToast('SEM berhasil');
  },'SEM');
}



function toggleGlmFactor(f,checked){
  if(checked){if(!aState.glmFactors.includes(f))aState.glmFactors.push(f);}
  else aState.glmFactors=aState.glmFactors.filter(function(x){return x!==f;});
  renderASub();
}
function toggleGlmCov(f,checked){
  if(checked){if(!aState.glmCovs.includes(f))aState.glmCovs.push(f);}
  else aState.glmCovs=aState.glmCovs.filter(function(x){return x!==f;});
  renderASub();
}
function toggleGlmMultiDep(f,checked){
  if(!aState.glmMultiDeps) aState.glmMultiDeps=[];
  if(checked){if(!aState.glmMultiDeps.includes(f))aState.glmMultiDeps.push(f);}
  else aState.glmMultiDeps=aState.glmMultiDeps.filter(function(x){return x!==f;});
  renderASub();
}
function toggleHlmL1(f,checked){
  if(!aState.hlmL1Preds) aState.hlmL1Preds=[];
  if(checked){if(!aState.hlmL1Preds.includes(f))aState.hlmL1Preds.push(f);}
  else aState.hlmL1Preds=aState.hlmL1Preds.filter(function(x){return x!==f;});
  renderASub();
}
function toggleHlmL2(f,checked){
  if(!aState.hlmL2Preds) aState.hlmL2Preds=[];
  if(checked){if(!aState.hlmL2Preds.includes(f))aState.hlmL2Preds.push(f);}
  else aState.hlmL2Preds=aState.hlmL2Preds.filter(function(x){return x!==f;});
  renderASub();
}
function runHLM(){
  runSafe(function(){
    if(!aState.hlmDep) throw new Error('Select an outcome variable');
    if(!aState.hlmGroup) throw new Error('Select a Level-2 grouping variable');

    // Build group map
    var groups={};
    data.forEach(function(r){
      var g=r[aState.hlmGroup]; var y=parseFloat(r[aState.hlmDep]);
      if(g===undefined||g===null||isNaN(y)) return;
      if(!groups[g]) groups[g]=[];
      groups[g].push(y);
    });
    var gkeys=Object.keys(groups);
    if(gkeys.length<2) throw new Error('Need at least 2 groups for HLM');
    var allY=[]; gkeys.forEach(function(g){ groups[g].forEach(function(v){ allY.push(v); }); });
    var n=allY.length;
    var grandMean=SE.mean(allY);
    var SSB=0,SSW=0;
    gkeys.forEach(function(g){
      var gv=groups[g]; var gm=SE.mean(gv);
      SSB+=gv.length*Math.pow(gm-grandMean,2);
      gv.forEach(function(y){ SSW+=Math.pow(y-gm,2); });
    });
    var k=gkeys.length, dfB=k-1, dfW=n-k;
    var MSB=SSB/dfB, MSW=SSW/dfW;
    var avgN=n/k;
    var varBetween=Math.max(0,(MSB-MSW)/avgN);
    var varWithin=MSW;
    var ICC=(varBetween+varWithin)>0?varBetween/(varBetween+varWithin):0;
    var Fval=MSW>0?MSB/MSW:NaN;
    var pF=isNaN(Fval)?NaN:1-SE.fCDF(Fval,dfB,dfW);
    var grpStats=gkeys.map(function(g){
      var gv=groups[g]; return {group:g,n:gv.length,mean:SE.f4(SE.mean(gv)),sd:gv.length>=2?SE.f4(SE.std(gv)):'N/A'};
    });
    var res={k:k,n:n,grandMean:SE.f4(grandMean),ICC:SE.f4(ICC),
      varBetween:SE.f4(varBetween),varWithin:SE.f4(varWithin),
      MSB:SE.f4(MSB),MSW:SE.f4(MSW),F:SE.f4(Fval),p_fmt:SE.pFmt(pF),sig:pF<.05,
      design_effect:SE.f4(1+(avgN-1)*ICC),grpStats:grpStats,
      l1preds:aState.hlmL1Preds,l2preds:aState.hlmL2Preds,
      subtype:currentASub};
    var label=currentASub==='hlm-icc'?'ICC & Variance Partitioning':currentASub==='hlm-3level'?'Three-Level HLM':'Two-Level HLM';
    var title='HLM ('+label+'): '+aState.hlmDep+' by '+aState.hlmGroup;
    addOutput({type:'hlm',title:title,res:res,dep:aState.hlmDep,group:aState.hlmGroup});
  },'HLM');
}
function runMANOVA(){
  runSafe(function(){
    if(!aState.glmMultiDeps||aState.glmMultiDeps.length<2) throw new Error('Select 2 or more dependent variables');
    if(!aState.glmFactors.length) throw new Error('Select at least one factor');
    if(aState.glmFactors.length>1) throw new Error('Proper MANOVA supports one factor at a time — select exactly one between-subjects factor');
    var factor = aState.glmFactors[0];
    var res = SE.manovaProper(data, aState.glmMultiDeps, factor);
    var title = 'MANOVA: ['+aState.glmMultiDeps.join(', ')+'] by ['+factor+']';
    addOutput({type:'manova', title:title, res:res, deps:aState.glmMultiDeps, factors:aState.glmFactors});
  },'MANOVA');
}
function runRepeatedMeasures(){
  runSafe(function(){
    if(!aState.pairedA||!aState.pairedB) throw new Error('Select pre and post variables');
    if(aState.pairedA===aState.pairedB) throw new Error('Pre and post variables must differ');
    var aVals=SE.validNums(data.map(function(r){return r[aState.pairedA];}));
    var bVals=SE.validNums(data.map(function(r){return r[aState.pairedB];}));
    var res=SE.pairedTTest(aVals,bVals);
    var title='Repeated Measures: '+aState.pairedA+' to '+aState.pairedB;
    addOutput({type:'repeated',title:title,res:res,varA:aState.pairedA,varB:aState.pairedB,betweenFac:aState.glmBetween||null});
  },'Repeated Measures GLM');
}
function runGLM(){
  runSafe(function(){
    if(!aState.glmDep) throw new Error('Select a dependent variable');
    if(!aState.glmFactors.length&&!aState.glmCovs.length) throw new Error('Select at least one factor or covariate');
    var res=SE.glmUnivariate(data,aState.glmDep,aState.glmFactors,aState.glmCovs);
    var title='GLM: '+aState.glmDep+' ~ '+[...aState.glmFactors,...aState.glmCovs].join(' + ');
    addOutput({type:'glm',title:title,res:res,depVar:aState.glmDep,factors:aState.glmFactors,covs:aState.glmCovs});
  },'GLM Univariate');
}

function toggleCntPred(f,checked){
  if(!aState.cntPreds) aState.cntPreds=[];
  if(checked){if(!aState.cntPreds.includes(f)) aState.cntPreds.push(f);}
  else aState.cntPreds=aState.cntPreds.filter(function(x){return x!==f;});
  renderASub();
}

function runPoissonGLM(){
  runSafe(function(){
    if(!aState.cntDep) throw new Error('Select a dependent (count) variable');
    if(!aState.cntPreds||!aState.cntPreds.length) throw new Error('Select at least one predictor');
    var res=SE.poissonReg(aState.cntDep,aState.cntPreds,data);
    var title='Poisson Reg: '+aState.cntDep+' ~ '+aState.cntPreds.join(' + ');
    addOutput({type:'poisson',title:title,res:res,depVar:aState.cntDep,preds:aState.cntPreds.slice()});
  },'Poisson Regression');
}

function runNegBinGLM(){
  runSafe(function(){
    if(!aState.cntDep) throw new Error('Select a dependent (count) variable');
    if(!aState.cntPreds||!aState.cntPreds.length) throw new Error('Select at least one predictor');
    var res=SE.negbinReg(aState.cntDep,aState.cntPreds,data);
    var title='Neg. Binomial Reg: '+aState.cntDep+' ~ '+aState.cntPreds.join(' + ');
    addOutput({type:'negbin',title:title,res:res,depVar:aState.cntDep,preds:aState.cntPreds.slice()});
  },'Negative Binomial Regression');
}

// ════════════════════════════════════════════════════════════════════════
// BAYESIAN STATISTICS ENGINE — DIPINDAH ke js/stats-engine/stats-bayesian.js (B20, 2026-09-15)
// (file dimuat SETELAH app.js — lihat catatan B20 di ARCHITECTURE.md)
// SVG Posterior plot (svgBayesPosterior) — DIPINDAH ke js/charts/bayesian-plot.js (E13, 2026-09-20)
// ════════════════════════════════════════════════════════════════════════

function runDesc(){runSafe(()=>{const s=SE.descriptive(data.map(r=>r[aState.dFld]));if(s.error)throw new Error(s.error);addOutput({type:'descriptive',title:'Descriptive: '+aState.dFld,stats:s,field:aState.dFld});},'Descriptives');}


function runTimeSeries(){
  runSafe(function(){
    var tsV=aState.tsV||numFields()[0];
    var tsMod=aState.tsMod||'arima';
    if(!tsV) throw new Error('Select a variable');
    var tsVals=SE.validNums(data.map(function(r){return r[tsV];}));
    if(tsVals.length<5) throw new Error('Need at least 5 valid observations');

    // Re-run compute functions (same as preview — inline)
    function tsACF2(y,maxLag){
      var n=y.length,mu=SE.mean(y);
      var denom=y.reduce(function(s,v){return s+(v-mu)*(v-mu);},0)/n;
      var acf=[];
      for(var k=0;k<=maxLag;k++){var num=0;for(var i=0;i<n-k;i++)num+=(y[i]-mu)*(y[i+k]-mu);acf.push(denom>0?(num/n)/denom:0);}
      return acf;
    }
    function tsDiff2(y,d){var s=y.slice();for(var i=0;i<d;i++){var t=[];for(var j=1;j<s.length;j++)t.push(s[j]-s[j-1]);s=t;}return s;}

    var tsP=aState.tsP!==undefined?aState.tsP:1;
    var tsD=aState.tsD!==undefined?aState.tsD:1;
    var tsQ=aState.tsQ!==undefined?aState.tsQ:1;
    var tsPeriod=aState.tsPeriod!==undefined?aState.tsPeriod:12;
    var tsDType=aState.tsDType||'additive';

    var res;
    if(tsMod==='arima'){
      var yd=tsDiff2(tsVals,tsD);
      var mu=SE.mean(yd);
      var arCoefs=new Array(tsP).fill(0);
      if(tsP>0){
        var acfYW=tsACF2(yd,tsP);
        var M2=[];for(var i=0;i<tsP;i++){var row=[];for(var j=0;j<tsP;j++)row.push(acfYW[Math.abs(i-j)]);row.push(acfYW[i+1]);M2.push(row);}
        for(var col=0;col<tsP;col++){var pv=M2[col][col];if(Math.abs(pv)<1e-14)continue;for(var row=0;row<tsP;row++){if(row===col)continue;var f=M2[row][col]/pv;for(var k=0;k<=tsP;k++)M2[row][k]-=f*M2[col][k];}}
        arCoefs=M2.map(function(row,i){return M2[i][i]!==0?row[tsP]/M2[i][i]:0;});
      }
      var resid2=[];
      for(var i=tsP;i<yd.length;i++){var yhat=mu;for(var j=0;j<tsP;j++)yhat+=arCoefs[j]*(yd[i-1-j]-mu);resid2.push(yd[i]-yhat);}
      var maCoefs=new Array(tsQ).fill(0);
      if(tsQ>0&&resid2.length>tsQ){var acfR=tsACF2(resid2,tsQ);for(var i=0;i<tsQ;i++)maCoefs[i]=acfR[i+1];}
      var fitted2=[],resid3=[];
      for(var i=tsP;i<yd.length;i++){var yh=mu;for(var j=0;j<tsP;j++)yh+=arCoefs[j]*(yd[i-1-j]-mu);for(var j=0;j<tsQ;j++){var ri=i-tsP-j-1;if(ri>=0&&ri<resid2.length)yh+=maCoefs[j]*resid2[ri];}fitted2.push(yh);resid3.push(yd[i]-yh);}
      var sse2=resid3.reduce(function(s,v){return s+v*v;},0);
      var sigmasq=resid3.length>tsP+tsQ+1?sse2/(resid3.length-tsP-tsQ-1):NaN;
      var aic=resid3.length>0?resid3.length*Math.log(sse2/resid3.length)+2*(tsP+tsQ+1):NaN;
      var bic=resid3.length>0?resid3.length*Math.log(sse2/resid3.length)+(tsP+tsQ+1)*Math.log(resid3.length):NaN;
      var lastYd=yd.slice(-Math.max(tsP,1));
      var fc_yd=mu;for(var j=0;j<tsP;j++)if(lastYd[lastYd.length-1-j]!==undefined)fc_yd+=arCoefs[j]*(lastYd[lastYd.length-1-j]-mu);
      var fc=fc_yd;
      if(tsD===1)fc=tsVals[tsVals.length-1]+fc_yd;
      else if(tsD===2)fc=2*tsVals[tsVals.length-1]-tsVals[tsVals.length-2]+fc_yd;
      var se_fc=Math.sqrt(sigmasq||0);
      res={model:'ARIMA('+tsP+','+tsD+','+tsQ+')',variable:tsV,n:tsVals.length,
        arCoefs:arCoefs.map(SE.f4),maCoefs:maCoefs.map(SE.f4),
        sse:SE.f4(sse2),sigma:SE.f4(Math.sqrt(sigmasq||0)),
        aic:SE.f4(aic),bic:SE.f4(bic),
        forecast:SE.f4(fc),se_fc:SE.f4(se_fc),
        fc_lo95:SE.f4(fc-1.96*se_fc),fc_hi95:SE.f4(fc+1.96*se_fc),
        residMean:SE.f4(SE.mean(resid3)),residSD:SE.f4(SE.std(resid3))
      };
      addOutput({type:'timeseries',title:'ARIMA('+tsP+','+tsD+','+tsQ+'): '+tsV,res:res});
    } else {
      var n=tsVals.length,period=tsPeriod,type=tsDType;
      if(n<period*2) throw new Error('N terlalu kecil (butuh ≥'+period*2+' obs untuk decomposition)');
      var trend=new Array(n).fill(NaN),half=Math.floor(period/2);
      for(var i=half;i<n-half;i++){var s=0,cnt=0;for(var j=-half;j<=half;j++){s+=tsVals[i+j];cnt++;}trend[i]=s/cnt;}
      var sIdx=new Array(period).fill(0),sCount=new Array(period).fill(0);
      for(var i=half;i<n-half;i++){var pos=i%period;var ratio=type==='multiplicative'?(trend[i]!==0?tsVals[i]/trend[i]:NaN):(tsVals[i]-trend[i]);if(isFinite(ratio)){sIdx[pos]+=ratio;sCount[pos]++;}}
      var sAdj=sIdx.map(function(s,i){return sCount[i]>0?s/sCount[i]:0;});
      if(type==='multiplicative'){var sm=sAdj.reduce(function(a,b){return a+b;},0)/period;sAdj=sAdj.map(function(v){return sm!==0?v/sm:v;});}
      else{var ss=sAdj.reduce(function(a,b){return a+b;},0)/period;sAdj=sAdj.map(function(v){return v-ss;});}
      var seasonal=new Array(n).fill(NaN);for(var i=0;i<n;i++)seasonal[i]=sAdj[i%period];
      var remainder=new Array(n).fill(NaN);
      for(var i=half;i<n-half;i++){remainder[i]=type==='multiplicative'?(seasonal[i]&&trend[i]?tsVals[i]/(trend[i]*seasonal[i]):NaN):(tsVals[i]-trend[i]-seasonal[i]);}
      var remValid=remainder.filter(isFinite);
      var strength=1-(SE.vari(remValid)/(SE.vari(tsVals.filter(isFinite))||1));
      res={model:'Decomposition ('+type+')',variable:tsV,n:n,period:period,type:type,
        trendRange:[SE.f4(Math.min.apply(null,trend.filter(isFinite))),SE.f4(Math.max.apply(null,trend.filter(isFinite)))],
        seasonalAmplitude:SE.f4(Math.max.apply(null,sAdj)-Math.min.apply(null,sAdj)),
        remainderSD:SE.f4(SE.std(remValid)),
        seasonalStrength:SE.f4(Math.max(0,Math.min(1,strength))),
        seasonalIndices:sAdj.map(function(v,i){return{period:i+1,index:SE.f4(v)};})
      };
      addOutput({type:'timeseries',title:'Decomposition ('+type+', period='+period+'): '+tsV,res:res});
    }
  },'Time Series');
}

function runBayes(){
  runSafe(function(){
    var bV=aState.bayV||numFields()[0];
    var bG=aState.bayG;
    if(!bV||!bG) throw new Error('Select Dependent and Grouping variables');
    var grps=[...new Set(data.map(function(r){return r[bG];}).filter(function(v){return v!==null&&v!==undefined;}))]
      .sort().slice(0,2);
    if(grps.length<2) throw new Error('Grouping variable needs at least 2 groups');
    var a2=SE.validNums(data.filter(function(r){return r[bG]===grps[0];}).map(function(r){return r[bV];}));
    var b2=SE.validNums(data.filter(function(r){return r[bG]===grps[1];}).map(function(r){return r[bV];}));
    var res=SE.bayesTTest(a2,b2,aState.bayPrior||0.707,aState.bayTails||2);
    addOutput({type:'bayes_ttest',title:'Bayesian T-Test: '+bV+' by '+bG,res:res,depV:bV,grpV:bG,ga:String(grps[0]),gb:String(grps[1]),prior:aState.bayPrior||0.707,tails:aState.bayTails||2});
  },'Bayesian T-Test');
}

function runBayesCorr(){
  runSafe(function(){
    var bcX=aState.bcX||numFields()[0];
    var bcY=aState.bcY||(numFields().length>1?numFields()[1]:'');
    if(!bcX||!bcY) throw new Error('Select both X and Y variables');
    var xs=SE.validNums(data.map(function(r){return r[bcX];}));
    var ys=SE.validNums(data.map(function(r){return r[bcY];}));
    var res=SE.bayesPearson(xs,ys,aState.bcPrior||1);
    addOutput({type:'bayes_corr',title:'Bayesian Correlation: '+bcX+' × '+bcY,res:res,xV:bcX,yV:bcY,prior:aState.bcPrior||1});
  },'Bayesian Correlation');
}

function runBayesPosterior(){
  runSafe(function(){
    var bpV=aState.bpV||numFields()[0];
    if(!bpV) throw new Error('Select a variable');
    var vals=SE.validNums(data.map(function(r){return r[bpV];}));
    if(vals.length<3) throw new Error('Need at least 3 valid values');
    var res=SE.bayesPosteriorNormal(vals,aState.bpMu0||0,aState.bpKappa||1,aState.bpAlpha||0.5,aState.bpBeta||0.5);
    addOutput({type:'bayes_posterior',title:'Bayesian Posterior: '+bpV,res:res,field:bpV,mu0:aState.bpMu0||0});
  },'Bayesian Posterior');
}


function runTTest(){runSafe(()=>{
  const grps=[...new Set(data.map(r=>r[aState.ttG]))].filter(v=>v!==null).slice(0,2);
  if(grps.length<2)throw new Error('Need ≥2 groups');
  const a=SE.validNums(data.filter(r=>r[aState.ttG]===grps[0]).map(r=>r[aState.ttV]));
  const b=SE.validNums(data.filter(r=>r[aState.ttG]===grps[1]).map(r=>r[aState.ttV]));
  addOutput({type:'ttest',title:'T-Test: '+aState.ttV+' by '+aState.ttG,res:SE.tTest(a,b),ga:String(grps[0]),gb:String(grps[1]),lev:SE.levene([a,b]),swA:a.length>=3?SE.sw(a):null,swB:b.length>=3?SE.sw(b):null,depV:aState.ttV,grpV:aState.ttG});
},'T-Test');}

function runOneSamp(){runSafe(()=>{
  const mu0=Number(aState.osMu0)||0;
  const vals=SE.validNums(data.map(r=>r[aState.osV]));
  if(vals.length<2)throw new Error('Need ≥2 valid values');
  const res=SE.oneSampleT(vals,mu0);
  const sw=vals.length>=3?SE.sw(vals):null;
  addOutput({type:'onesamp',title:'One-Sample T-Test: '+aState.osV+' (μ₀='+SE.f4(mu0)+')',res,field:aState.osV,mu0,sw});
},'One-Sample T-Test');}

function runPaired(){runSafe(()=>{
  addOutput({type:'paired',title:'Paired T-Test: '+aState.pairedA+' vs '+aState.pairedB,res:SE.pairedTTest(SE.validNums(data.map(r=>r[aState.pairedA])),SE.validNums(data.map(r=>r[aState.pairedB]))),varA:aState.pairedA,varB:aState.pairedB});
},'Paired T-Test');}

function runRmAnova(){runSafe(function(){
  var rmVars=aState.rmVars||[];
  rmVars=rmVars.filter(function(v){return v&&vars.find(function(vr){return vr.name===v;});});
  if(rmVars.length<3) throw new Error('Pilih ≥3 variabel titik waktu');
  var groups=rmVars.map(function(v){return SE.validNums(data.map(function(r){return r[v];}));});
  var res=SE.repeatedMeasuresAnova(groups,rmVars);
  // Post-hoc pairwise
  var posthoc=[];
  for(var pi=0;pi<rmVars.length;pi++){
    for(var pj=pi+1;pj<rmVars.length;pj++){
      var phRes=SE.pairedTTest(SE.validNums(data.map(function(r){return r[rmVars[pi]];})),SE.validNums(data.map(function(r){return r[rmVars[pj]];})));
      posthoc.push({a:rmVars[pi],b:rmVars[pj],la:'T'+(pi+1),lb:'T'+(pj+1),t:phRes.t,p:phRes.p_fmt,sig:phRes.sig,meanDiff:phRes.meanDiff});
    }
  }
  addOutput({type:'rmanova',title:'RM-ANOVA: '+rmVars.join(' → '),res:res,posthoc:posthoc,rmVars:rmVars});
},'RM-ANOVA');}

function runANOVA(){runSafe(()=>{
  const gl=[...new Set(data.map(r=>r[aState.avG]))].filter(v=>v!==null);
  const groups=gl.map(g=>({label:String(g),vals:SE.validNums(data.filter(r=>r[aState.avG]===g).map(r=>r[aState.avV]))})).filter(g=>g.vals.length>=2);
  const res=SE.onewayANOVA(groups);
  var posthoc=null, posthocMethod=null;
  if(aState.avPost){
    posthocMethod=aState.avPostMethod||'tukey';
    if(posthocMethod==='tukey') posthoc=SE.tukeyHSD(groups);
    else if(posthocMethod==='bonferroni') posthoc=SE.bonferroniPosthoc(groups);
    else if(posthocMethod==='lsd') posthoc=SE.lsdPosthoc(groups);
    else if(posthocMethod==='holm') posthoc=SE.holmBonferroniPosthoc(groups);
  }
  addOutput({type:'anova',title:'ANOVA: '+aState.avV+' by '+aState.avG,res,groups,posthoc,posthocMethod,depV:aState.avV,grpV:aState.avG});
},'ANOVA');}

function runANOVA2(){runSafe(()=>{
  if(!aState.av2V||!aState.av2A||!aState.av2B) throw new Error('Select dependent variable and two factors');
  if(aState.av2A===aState.av2B) throw new Error('Factor A and Factor B must be different variables');
  const res=SE.twowayANOVA(data,aState.av2V,aState.av2A,aState.av2B);
  addOutput({type:'anova2',title:'Two-Way ANOVA: '+aState.av2V+' ~ '+aState.av2A+' × '+aState.av2B,res,depV:aState.av2V,factorA:aState.av2A,factorB:aState.av2B});
},'Two-Way ANOVA');}

function runANOVA3(){runSafe(()=>{
  if(!aState.av3V||!aState.av3A||!aState.av3B||!aState.av3C) throw new Error('Select dependent variable and three factors');
  if(aState.av3A===aState.av3B||aState.av3A===aState.av3C||aState.av3B===aState.av3C) throw new Error('All three factors must be different variables');
  const res=SE.threewayANOVA(data,aState.av3V,aState.av3A,aState.av3B,aState.av3C);
  addOutput({type:'anova3',title:'Three-Way ANOVA: '+aState.av3V+' ~ '+aState.av3A+' × '+aState.av3B+' × '+aState.av3C,res,depV:aState.av3V,factorA:aState.av3A,factorB:aState.av3B,factorC:aState.av3C});
},'Three-Way ANOVA');}

function runCorr(){runSafe(()=>{
  const ax=data.map(r=>r[aState.crX]),ay=data.map(r=>r[aState.crY]);
  addOutput({type:'correlation',title:(aState.crType==='spearman'?'Spearman':'Pearson')+': '+aState.crX+' × '+aState.crY,res:aState.crType==='spearman'?SE.spearmanR(ax,ay):SE.pearsonR(ax,ay),crX:aState.crX,crY:aState.crY,crType:aState.crType});
},'Correlation');}

function runPartialCorr(){runSafe(()=>{
  if(!aState.pcX||!aState.pcY||!aState.pcZ) throw new Error('Select X, Y and Control variable');
  if(aState.pcX===aState.pcY||aState.pcX===aState.pcZ||aState.pcY===aState.pcZ) throw new Error('X, Y, and Z must be different variables');
  const res=SE.partialCorr(data.map(r=>r[aState.pcX]),data.map(r=>r[aState.pcY]),data.map(r=>r[aState.pcZ]));
  addOutput({type:'partialCorr',title:'Partial r: '+aState.pcX+' × '+aState.pcY+' | '+aState.pcZ,res,pcX:aState.pcX,pcY:aState.pcY,pcZ:aState.pcZ});
},'Partial Correlation');}

function toggleCCAField(cb, set){
  var f=cb.dataset.fld;
  if(set==='x'){
    if(cb.checked){if(!aState.ccaXs.includes(f))aState.ccaXs.push(f);}
    else aState.ccaXs=aState.ccaXs.filter(function(v){return v!==f;});
  } else {
    if(cb.checked){if(!aState.ccaYs.includes(f))aState.ccaYs.push(f);}
    else aState.ccaYs=aState.ccaYs.filter(function(v){return v!==f;});
  }
  renderASub();
}

function runCCA(){runSafe(function(){
  if(!aState.ccaXs||aState.ccaXs.length<1) throw new Error('Pilih minimal 1 variabel untuk Set X');
  if(!aState.ccaYs||aState.ccaYs.length<1) throw new Error('Pilih minimal 1 variabel untuk Set Y');
  var overlap=aState.ccaXs.filter(function(v){return aState.ccaYs.includes(v);});
  if(overlap.length) throw new Error('Variabel tidak boleh masuk kedua set sekaligus: '+overlap.join(', '));
  var res=SE.canonicalCorr(aState.ccaXs,aState.ccaYs,data);
  addOutput({type:'canonicalCorr',title:'Canonical Correlation: ['+aState.ccaXs.join(', ')+'] ↔ ['+aState.ccaYs.join(', ')+']',res,xNames:aState.ccaXs,yNames:aState.ccaYs});
},'Canonical Correlation');}

function runReg(){runSafe(()=>{
  const res=SE.linearReg(data.map(r=>r[aState.regX]),data.map(r=>r[aState.regY]));
  addOutput({type:'regression',title:'Regression: '+aState.regY+' ~ '+aState.regX,res,xF:aState.regX,yF:aState.regY});
},'Regression');}

function toggleMrXEl(cb){const f=cb.dataset.fld;if(cb.checked){if(!aState.mrXs.includes(f))aState.mrXs.push(f);}else aState.mrXs=aState.mrXs.filter(x=>x!==f);renderASub();}

function toggleLgX(cb){
  var f=cb.dataset.lgf;
  if(cb.checked){if(!aState.lgXs.includes(f))aState.lgXs.push(f);}
  else{aState.lgXs=aState.lgXs.filter(function(x){return x!==f;});}
  renderASub();
}

function runLogistic(){
  var lgY=aState.lgY,lgXs=aState.lgXs,lgType=aState.lgType||'binary';
  if(!lgY){showToast('Pilih Dependent Variable','error');return;}
  if(!lgXs.length){showToast('Pilih minimal 1 prediktor','error');return;}
  var res=tryStats(function(){return SE.logisticReg(lgY,lgXs,data,lgType);});
  if(!res||res._err){showToast(res?res.msg:'Error dalam analisis','error');return;}
  var id='lg_'+Date.now();
  var title=(lgType==='binary'?'Binary':'Multinomial')+' Logistic Regression: '+lgY+' ~ '+lgXs.join('+');
  addOutput({id:id,title:title,type:'logistic',res:res,lgY:lgY,lgXs:lgXs,lgType:lgType});
}


// ════════════════════════════════════════════════════════════
// DISCRIMINANT ANALYSIS (LDA) — computeLDA DIPINDAH ke
// js/stats-engine/stats-discriminant-cluster.js (B21, 2026-09-15)
// ════════════════════════════════════════════════════════════

// ── Discriminant chart (svgDiscriminantPlot) — DIPINDAH ke
// js/charts/discriminant-cluster-plot.js (E12, split roadmap OSS 2.0). Dimuat
// SEBELUM app.js (kategori 4, setelah survival-plot.js). Pemanggil: 1 titik
// (preview renderDiscriminantForm() di analyze-form-render.js; tidak dipakai
// output di app.js). Call-site tidak diubah.

function runDiscriminant(){
  var grp=aState.ldaGroup,preds=aState.ldaPreds||[];
  if(!grp){showToast('Pilih grouping variable','error');return;}
  if(preds.length<1){showToast('Pilih ≥1 prediktor','error');return;}
  var res=tryStats(function(){return computeLDA(grp,preds,data);});
  if(!res||res._err){showToast(res?res.msg:'Error dalam LDA','error');return;}
  aState.ldaResult=res;
  renderASub();
  addOutput({id:'lda_'+Date.now(),title:'Discriminant Analysis: '+grp+' ~ '+preds.join('+'),type:'discriminant',res:res,groupVar:grp,predVars:preds});
  showToast('Discriminant Analysis berhasil');
}


// ════════════════════════════════════════════════════════════
// CLUSTER ANALYSIS (K-Means & Hierarchical) — computeKMeans &
// computeHierarchical DIPINDAH ke
// js/stats-engine/stats-discriminant-cluster.js (B22, 2026-09-15)
// ════════════════════════════════════════════════════════════

// ── Cluster chart (svgClusterPlot, svgElbow, svgDendrogram) — DIPINDAH ke
// js/charts/discriminant-cluster-plot.js (E12, split roadmap OSS 2.0). Dimuat
// SEBELUM app.js (kategori 4, setelah survival-plot.js). Pemanggil: ketiganya
// 2 titik (preview renderClusterForm() di analyze-form-render.js + output
// renderOutput() kasus cluster di bawah). Call-site tidak diubah.

function runCluster(){
  var vars=aState.clVars||[],k=aState.clK||3,method=aState.clMethod||'kmeans',linkage=aState.clLinkage||'ward';
  if(vars.length<2){showToast('Pilih ≥2 variabel','error');return;}
  var res=tryStats(function(){
    if(method==='kmeans') return computeKMeans(data,vars,k);
    else return computeHierarchical(data,vars,k,linkage);
  });
  if(!res||res._err){showToast(res?res.msg:'Error dalam cluster analysis','error');return;}
  aState.clResult=res;
  renderASub();
  addOutput({id:'cl_'+Date.now(),title:(method==='kmeans'?'K-Means':'Hierarchical')+' Cluster (k='+res.k+'): '+vars.join(', '),type:'cluster',res:res,vars,k:res.k,method});
  showToast('Cluster Analysis berhasil');
}

function runMultipleReg(){runSafe(()=>{
  if(!aState.mrXs.length)throw new Error('Select ≥1 predictor');
  if(aState.mrXs.includes(aState.mrY))throw new Error('Outcome cannot also be predictor');
  const res=SE.multipleReg(aState.mrXs,aState.mrY,data);
  addOutput({type:'multipleReg',title:'Multiple Regression: '+aState.mrY+' ~ '+aState.mrXs.join('+'),res,yName:aState.mrY,xNames:aState.mrXs});
},'Multiple Regression');}

function runNP(){runSafe(()=>{
  if(aState.npType==='mannwhitney'){
    const grps=[...new Set(data.map(r=>r[aState.npG]))].filter(v=>v!==null).slice(0,2);
    if(grps.length<2)throw new Error('Need ≥2 groups');
    const a=SE.validNums(data.filter(r=>r[aState.npG]===grps[0]).map(r=>r[aState.npV]));
    const b=SE.validNums(data.filter(r=>r[aState.npG]===grps[1]).map(r=>r[aState.npV]));
    addOutput({type:'mannwhitney',title:'Mann-Whitney U: '+aState.npV+' by '+aState.npG,res:SE.mannWhitney(a,b),ga:String(grps[0]),gb:String(grps[1])});
  } else if(aState.npType==='kruskal'){
    const gl=[...new Set(data.map(r=>r[aState.npG]))].filter(v=>v!==null);
    const groups=gl.map(g=>({label:String(g),vals:SE.validNums(data.filter(r=>r[aState.npG]===g).map(r=>r[aState.npV]))})).filter(g=>g.vals.length>=2);
    addOutput({type:'kruskal',title:'Kruskal-Wallis: '+aState.npV,res:SE.kruskalWallis(groups)});
  } else {
    addOutput({type:'wilcoxon',title:'Wilcoxon: '+aState.npV,res:SE.wilcoxon(SE.validNums(data.map(r=>r[aState.npV])))});
  }
},'Nonparametric');}

function toggleAlphaVarEl(cb){const f=cb.dataset.fld;if(cb.checked){if(!aState.alphaVars.includes(f))aState.alphaVars.push(f);}else aState.alphaVars=aState.alphaVars.filter(x=>x!==f);renderASub();}
function runAlpha(){runSafe(()=>{
  const cols=aState.alphaVars.filter(v=>numFields().includes(v)).map(v=>SE.validNums(data.map(r=>r[v])));
  if(cols.length<2)throw new Error('Select ≥2 numeric items');
  const minN=Math.min(...cols.map(c=>c.length));
  addOutput({type:'alpha',title:'Cronbach α: '+aState.alphaVars.join(', '),res:SE.cronbachAlpha(cols.map(c=>c.slice(0,minN))),vars:aState.alphaVars});
},'Cronbach α');}

function runKappa(){runSafe(function(){
  if(!aState.kappaR1||!aState.kappaR2) throw new Error('Select both rater variables');
  if(aState.kappaR1===aState.kappaR2) throw new Error('Rater 1 and Rater 2 must be different variables');
  var r1=[],r2=[];
  data.forEach(function(row){
    var v1=row[aState.kappaR1], v2=row[aState.kappaR2];
    if(v1!==null&&v1!==undefined&&String(v1).trim()!==''&&
       v2!==null&&v2!==undefined&&String(v2).trim()!==''){
      r1.push(String(v1)); r2.push(String(v2));
    }
  });
  if(r1.length<2) throw new Error('Need ≥2 valid paired cases');
  var res=SE.cohenKappa(r1,r2);
  var title="Cohen's κ: "+aState.kappaR1+' vs '+aState.kappaR2+(aState.kappaWeighted?' (weighted)':'');
  addOutput({type:'kappa',title:title,res:res,vars:[aState.kappaR1,aState.kappaR2],weighted:aState.kappaWeighted});
},"Cohen's Kappa");}

// ── Transform (Compute), Recode, Filter Cases (runTransform/runCompute/
// runRecodeRange/runRecodeBinary/runRecodeExact/safeFilter/applyFilter/
// var _origData/clearFilter/completeCases/removeOutlierFilter) —
// DIPINDAH ke js/data/data-transform.js (C10, split roadmap OSS 2.0).
// File dimuat SEBELUM app.js — dependency dibaca di runtime, aman lewat
// scope-fallback ke global. CATATAN: runWeightCases/clearWeightCases
// (di bawah ini) dan runImpute/imputeAllVars (di bawahnya lagi) TIDAK
// ikut dipindah — tidak terdaftar di roadmap manapun, lihat catatan
// lengkap di data-transform.js.


// ── WEIGHT CASES ─────────────────────────────────────────────────────────
// VIRTUAL WEIGHTING: data fisik TIDAK pernah diexpand.
// Bobot hanya disimpan sebagai nama variabel; semua kalkulasi statistik
// menggunakan getWeightedRows() yang menghasilkan array virtual berbobot.
function runWeightCases(){
  var wcVar=aState.wcVar;
  if(!wcVar){showToast('Pilih variabel bobot','error');return;}
  var varObj=vars.find(function(v){return v.name===wcVar;});
  if(!varObj||varObj.type!=='Numeric'){showToast('Variabel bobot harus Numeric','error');return;}
  // Hitung N efektif (ΣW) tanpa mengubah data
  var nEff=0,nSkipped=0;
  data.forEach(function(row){
    var w=Number(row[wcVar]);
    if(!isFinite(w)||w<=0){nSkipped++;return;}
    nEff+=Math.round(w);
  });
  if(!nEff){showToast('Tidak ada baris valid untuk weighting','error');return;}
  aState.wcActive=true;
  aState.wcOrigData=null; // tidak dipakai lagi
  var badge=document.getElementById('wc-badge');
  if(badge)badge.style.display='inline';
  updateBadges();
  showToast('Weight Cases berhasil');
  renderASub();
}

function clearWeightCases(){
  aState.wcActive=false;
  aState.wcOrigData=null;
  aState.wcVar='';
  var badge=document.getElementById('wc-badge');
  if(badge)badge.style.display='none';
  updateBadges();
  showToast('Weight Cases dinonaktifkan');
  renderASub();
}

// ── Imputation (runImpute/imputeAllVars) — DIPINDAH ke
// js/data/imputation.js (temuan pas C10, split roadmap OSS 2.0, file
// baru sesuai keputusan user). File dimuat SEBELUM app.js — dependency
// dibaca di runtime, aman lewat scope-fallback ke global.


// Corr matrix field toggle
function toggleCMFieldEl(cb){const f=cb.dataset.fld;if(cb.checked){if(!aState.cmFields.includes(f))aState.cmFields.push(f);}else aState.cmFields=aState.cmFields.filter(x=>x!==f);renderASub();}


// ════════════════════════════════════════════════════════════════════════
// SYNTAX VIEW
// ════════════════════════════════════════════════════════════════════════
var synText="DESCRIPTIVES VARIABLES=score age salary\n  /STATISTICS=MEAN STDDEV MIN MAX.\n\nT-TEST GROUPS=gender(Male,Female)\n  /VARIABLES=score.\n\nONEWAY score BY group\n  /STATISTICS DESCRIPTIVES POSTHOC.\n\nCORRELATIONS\n  /VARIABLES=age score salary.\n\nREGRESSION\n  /DEPENDENT=score\n  /METHOD=enter age.";
var synResults=[];

function _loadSyntaxToEditor(syn){
  synText=syn;
  var ta=document.getElementById('syn-ta');
  if(ta){ta.value=syn;}
  showToast('Syntax berhasil dimuat');
}
function _downloadSyntax(){
  var syn=document.getElementById('syn-ta')?document.getElementById('syn-ta').value:synText;
  var blob=new Blob([syn],{type:'text/plain'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='oss_syntax.sps';
  a.click();
}
function renderSyntax(el){
  let html='<div class="grid2">';
  html+='<div style="display:flex;flex-direction:column;gap:12px">';
  html+='<div class="card"><div class="sec-hd">Syntax Editor</div>';
  html+='<textarea class="syn-area" id="syn-ta" oninput="synText=this.value">'+synText+'</textarea>';
  html+='<div class="row" style="margin-top:9px;flex-wrap:wrap;gap:6px">';
  html+='<button class="btn btn-primary btn-sm" onclick="execSyntax()" id="syn-run-btn">▶ Run All</button>';
  html+='<button class="btn btn-ghost btn-sm" onclick="_downloadSyntax()">&#8595; Save .sps</button>';
  html+='<button class="btn btn-ghost btn-sm" onclick="synResults=[];renderTab(\'syntax\')">Clear</button>';
  html+='</div>';
  html+='<div style="margin-top:10px;padding:9px 11px;background:rgba(255,255,255,.016);border-radius:7px;font-size:10.5px;color:#475569;line-height:1.9">';
  html+='<b style="color:#64748b">Commands:</b> DESCRIPTIVES &middot; T-TEST &middot; ONEWAY &middot; CORRELATIONS &middot; REGRESSION';
  html+='</div></div>';
  html+='<div class="card"><div class="sec-hd" style="display:flex;align-items:center;justify-content:space-between">Auto-generated Syntax<span style="font-size:10px;color:#64748b;font-weight:400">Tiap analisis tersimpan otomatis</span></div>';
  if(!_syntaxHistory.length){
    html+='<div style="text-align:center;padding:22px 12px;color:#334155;font-size:11.5px">Belum ada analisis dijalankan.<br><span style="color:#475569">Jalankan analisis &rarr; syntax otomatis muncul di sini.</span></div>';
  } else {
    html+='<div style="display:flex;flex-direction:column;gap:6px;max-height:260px;overflow-y:auto">';
    _syntaxHistory.forEach(function(h,i){
      html+='<div style="background:rgba(124,58,237,.07);border:1px solid rgba(124,58,237,.15);border-radius:8px;padding:8px 10px">';
      html+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">';
      html+='<span style="font-size:10.5px;font-weight:600;color:#a78bfa">'+escHtml(h.title)+'</span>';
      html+='<button onclick="_loadSyntaxToEditor(_syntaxHistory['+i+'].syntax)" style="font-size:10px;padding:2px 8px;border-radius:5px;border:1px solid rgba(124,58,237,.3);background:rgba(124,58,237,.15);color:#c084fc;cursor:pointer;font-family:Inter,sans-serif">Load to Editor</button>';
      html+='</div>';
      html+='<pre style="font-family:Fira Code,monospace;font-size:9.5px;color:#94a3b8;white-space:pre-wrap;margin:0;line-height:1.6">'+h.syntax.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</pre>';
      html+='</div>';
    });
    html+='</div>';
    html+='<button onclick="_loadSyntaxToEditor(_syntaxHistory.map(function(h){return h.syntax;}).join(\'\\n\\n\'))" style="margin-top:8px;width:100%;padding:7px;border-radius:7px;border:1px solid rgba(124,58,237,.25);background:rgba(124,58,237,.1);color:#c084fc;font-size:11.5px;cursor:pointer;font-family:Inter,sans-serif">Load All to Editor</button>';
  }
  html+='</div>';
  html+='</div>';
  html+='<div class="card"><div class="sec-hd">Output</div><div id="syn-out">';
  if(!synResults.length)html+='<div style="text-align:center;padding:36px;color:#334155;font-size:12px">Run syntax to see results.</div>';
  else synResults.forEach(item=>{
    if(item.type==='hdr')html+='<div style="font-weight:700;color:#818cf8;font-size:12px;padding-bottom:5px;border-bottom:1px solid rgba(129,140,248,.14);margin-bottom:5px">'+item.text+'</div>';
    else if(item.type==='err')html+='<div style="color:#f87171;font-size:11.5px;margin-bottom:7px"> '+item.text+'</div>';
    else if(item.type==='stats')html+='<div class="card2" style="margin-bottom:7px"><div style="font-size:10px;color:#60a5fa;font-weight:700;margin-bottom:5px">'+item.field+'</div>'+mkTable(['Stat','Value'],Object.entries(item.stats).map(([k,v])=>[k,v]))+'</div>';
    else if(item.type==='ttest')html+='<div class="card2" style="margin-bottom:7px"><div style="font-size:10px;color:#fbbf24;font-weight:700;margin-bottom:5px">'+item.text+'</div>'+mkTable(['','A','B'],[['Label',...item.labels],['Mean',item.res.meanA,item.res.meanB],['SD',item.res.sdA,item.res.sdB],['t',item.res.t,''],['df',item.res.df,''],['p',item.res.p_fmt,''],["Cohen's d",item.res.cohensD,item.res.dInterp]])+'</div>';
    else if(item.type==='anova'){html+='<div class="card2" style="margin-bottom:7px"><div style="font-size:10px;color:#f472b6;font-weight:700;margin-bottom:5px">'+item.text+'</div>'+mkTable(['Source','df','SS','MS','F','p','\u03b7\u00b2'],[['Between',item.res.dfB,item.res.ssB,item.res.msB,item.res.F,item.res.p_fmt,item.res.eta2],['Within',item.res.dfW,item.res.ssW,item.res.msW,'','','']]);if(item.posthoc)html+='<div style="font-size:10px;color:#a78bfa;margin:7px 0 4px">Tukey HSD</div>'+mkTable(['Pair','Diff','q','p','Sig'],item.posthoc.map(ph=>[ph.a+' vs '+ph.b,ph.diff,ph.q,ph.p,ph.sig?'*':'ns']));html+='</div>';}
    else if(item.type==='corr')html+='<div class="card2" style="margin-bottom:7px"><div style="font-size:10px;color:#34d399;font-weight:700;margin-bottom:5px">'+item.text+'</div>'+mkTable(['Pair','r','r\u00b2','p','Sig'],item.matrix.map(m=>m.error?[m.a+'\u00d7'+m.b,'Err',m.error,'','']:[m.a+'\u00d7'+m.b,m.r,m.r2,m.p_fmt,m.sig?'**':'ns']))+'</div>';
    else if(item.type==='reg')html+='<div class="card2" style="margin-bottom:7px"><div style="font-size:10px;color:#60a5fa;font-weight:700;margin-bottom:5px">'+item.text+'</div>'+mkTable(['','B','SE','t','p'],[['Intercept',item.res.b0,item.res.SEb0,item.res.tb0,item.res.pb0_fmt],['Slope',item.res.b1,item.res.SEb1,item.res.tb1,item.res.pb1_fmt]])+'<div style="margin-top:5px;font-size:10.5px;color:#64748b">R\u00b2='+item.res.R2+' F='+item.res.F+' p='+item.res.pF_fmt+'</div></div>';
  });
  html+='</div></div></div>';
  el.innerHTML=html;
}

async function execSyntax(){
  const btn=document.getElementById('syn-run-btn');if(btn){btn.disabled=true;btn.textContent='Running…';}
  await new Promise(r=>setTimeout(r,80));
  const syn=document.getElementById('syn-ta')?.value||synText;
  const results=[],nF=numFields();
  const descM=syn.match(/DESCRIPTIVES VARIABLES=([^\n/]+)/i);
  if(descM){const flds=descM[1].trim().split(/\s+/).filter(f=>nF.includes(f));results.push({type:'hdr',text:'► DESCRIPTIVES'});
    flds.forEach(f=>{try{const s=SE.descriptive(data.map(r=>r[f]));if(s.error)throw new Error(s.error);results.push({type:'stats',field:f,stats:s});}catch(e){results.push({type:'err',text:f+': '+e.message});}});}
  const ttM=syn.match(/T-TEST GROUPS=(\w+)\(([^,)]+),([^)]+)\)\s*\/VARIABLES=(\w+)/i);
  if(ttM){const grp=ttM[1],ga=ttM[2].trim().replace(/'/g,''),gb=ttM[3].trim().replace(/'/g,''),dv=ttM[4];
    try{const a=SE.validNums(data.filter(r=>String(r[grp])===ga).map(r=>r[dv])),b=SE.validNums(data.filter(r=>String(r[grp])===gb).map(r=>r[dv]));results.push({type:'ttest',text:'► T-TEST: '+dv+' by '+grp,res:SE.tTest(a,b),labels:[ga,gb]});}catch(e){results.push({type:'err',text:'T-TEST: '+e.message});}}
  const owM=syn.match(/ONEWAY (\w+) BY (\w+)/i);
  if(owM){const dv=owM[1],gf=owM[2];try{const gl=[...new Set(data.map(r=>r[gf]))].filter(v=>v!==null);const groups=gl.map(g=>({label:String(g),vals:SE.validNums(data.filter(r=>r[gf]===g).map(r=>r[dv]))})).filter(g=>g.vals.length>=2);const res=SE.onewayANOVA(groups);const ph=/POSTHOC/i.test(syn)?SE.tukeyHSD(groups):null;results.push({type:'anova',text:'► ONEWAY: '+dv+' by '+gf,res,posthoc:ph});}catch(e){results.push({type:'err',text:'ONEWAY: '+e.message});}}
  const corrM=syn.match(/CORRELATIONS\s+\/VARIABLES=([^\n.]+)/i);
  if(corrM){const flds=corrM[1].trim().split(/\s+/).filter(f=>nF.includes(f));const matrix=[];for(let i=0;i<flds.length;i++)for(let j=i+1;j<flds.length;j++){try{matrix.push({a:flds[i],b:flds[j],...SE.pearsonR(data.map(r=>r[flds[i]]),data.map(r=>r[flds[j]]))});}catch(e){matrix.push({a:flds[i],b:flds[j],error:e.message});}}if(matrix.length)results.push({type:'corr',text:'► CORRELATIONS',matrix});}
  const regM=syn.match(/REGRESSION\s+\/DEPENDENT=(\w+)\s+\/METHOD=\S+\s+(\w+)/i);
  if(regM){const dv=regM[1],iv=regM[2];try{results.push({type:'reg',text:'► REGRESSION: '+dv+' ~ '+iv,res:SE.linearReg(data.map(r=>r[iv]),data.map(r=>r[dv]))});}catch(e){results.push({type:'err',text:'REGRESSION: '+e.message});}}
  if(!results.length)results.push({type:'err',text:'No recognized commands found.'});
  synResults=results;renderSyntax(document.getElementById('view-syntax'));
}

// ════════════════════════════════════════════════════════════════════════
// PIVOT VIEW
// ════════════════════════════════════════════════════════════════════════
var pvState={row:'group',col:'gender',val:'score',fn:'mean'};
function renderPivot(el){
  const rv=[...new Set(data.map(r=>String(r[pvState.row])))].sort();
  const cv=[...new Set(data.map(r=>String(r[pvState.col])))].sort();
  const cell=(r,c)=>{const sub=SE.validNums(data.filter(x=>String(x[pvState.row])===r&&String(x[pvState.col])===c).map(x=>x[pvState.val]));if(!sub.length)return '—';
    try{switch(pvState.fn){case'mean':return SE.mean(sub).toFixed(2);case'sum':return sub.reduce((a,b)=>a+b,0).toFixed(0);case'count':return sub.length;case'min':return Math.min(...sub).toFixed(2);case'max':return Math.max(...sub).toFixed(2);case'std':return sub.length>=2?SE.std(sub).toFixed(2):'N/A';default:return SE.mean(sub).toFixed(2);}}catch{return 'Err';}};
  let html='<div class="card" style="margin-bottom:12px"><div class="row" style="flex-wrap:wrap;gap:8px">';
  html+=mkSelect('pv-row',allFields(),pvState.row,'pvState.row=val;renderPivot(document.getElementById(\'view-pivot\'))','Row');
  html+=mkSelect('pv-col',allFields(),pvState.col,'pvState.col=val;renderPivot(document.getElementById(\'view-pivot\'))','Column');
  html+=mkSelect('pv-val',numFields(),pvState.val,'pvState.val=val;renderPivot(document.getElementById(\'view-pivot\'))','Value');
  html+=mkCsel('pv-fn',['mean','sum','count','min','max','std'],pvState.fn,'pvState.fn=val;renderPivot(document.getElementById(\'view-pivot\'))','Function');
  html+='</div></div>';
  html+='<div class="card"><div class="tbl-wrap"><table><thead><tr>';
  html+='<th style="color:#818cf8">'+escHtml(pvState.row)+' \\ '+escHtml(pvState.col)+'</th>';
  cv.forEach(c=>html+='<th style="color:#60a5fa">'+escHtml(c)+'</th>');
  html+='</tr></thead><tbody>';
  rv.forEach((r,ri)=>{html+='<tr class="'+(ri%2?'':'alt')+'"><td style="font-weight:700;color:#a78bfa">'+escHtml(r)+'</td>';
    cv.forEach(c=>{const v=cell(r,c);html+='<td style="text-align:right;color:'+(v==='—'?'#334155':'#e2e8f0')+'">'+v+'</td>';});
    html+='</tr>';});
  html+='</tbody></table></div></div>';
  el.innerHTML=html;
}

// ════════════════════════════════════════════════════════════════════════
// OUTPUT VIEW
// ════════════════════════════════════════════════════════════════════════

// ── Output Tab Group System (F1) + Ringkasan per-tipe output (F2) — DIPINDAH
// ke js/output/output-view-shell.js (split roadmap OSS 2.0, F-series 1–2/7).
// Dimuat SEBELUM app.js (kategori 4c, setelah output-render-basic.js).
//   F1: state (_outMode, _outActiveGroup, _outGrid) + _outGroup/_outGroupColor/
//       _outGroupIcon/_outGroups.
//   F2: _interpBox(text) + _buildInterp(o) — kotak interpretasi di bawah tiap
//       kartu output. Satu-satunya pemanggil: renderOutput() di bawah (blok
//       "Interpretation summary", dibungkus try/catch).
// Pemanggil F1: renderOutput() (beberapa titik) dan Export Word Dialog (Section G,
// belum dipindah). Call-site tidak diubah.
//
// ── Render detail per-tipe (F3, F4) — DIPINDAH ke file terpisah, dimuat SEBELUM
// app.js. Rantai `if/else if` per `o.type` di bawah MASIH di sini (1 baris per
// cabang: `html+=renderOutBasic_x(o);` / `html+=renderOutAdv_x(o);`) sampai F5
// selesai; tiap fungsi menerima `o` dan mengembalikan string HTML isi kartu.
//   F3: js/output/output-render-basic.js    — renderOutBasic_<tipe> (21 tipe:
//       descriptive s/d manova; `poisson` juga melayani `negbin`).
//   F4: js/output/output-render-advanced.js — renderOutAdv_<tipe> (9 tipe: hlm,
//       alpha, kappa, efa, cfa, sem, mediation, discriminant, cluster).
//   Cabang yang MASIH inline di bawah (F5): poweranalysis, moderation, mi, roc,
//   survival, cox, bayes_ttest, bayes_corr, bayes_posterior, timeseries,
//   metaanalysis.

function renderOutput(el){
  if(!outputs.length){
    el.innerHTML='<div class="card" style="text-align:center;padding:48px"><div style="color:rgba(232,222,255,.4);font-size:14px">No outputs yet.<br><span style="font-size:12px;opacity:.6">Run an analysis and results will appear here.</span></div></div>';
    return;
  }

  var groups=_outGroups();
  var em=_outMode;
  var ag=_outActiveGroup;
  var html='';

  // ── Top toolbar ──────────────────────────────────────────────────────
  html+='<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:14px">';
  html+='<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">';
  // Mode toggle pills
  html+='<div style="display:flex;background:rgba(14,6,24,.7);border:1px solid rgba(124,58,237,.22);border-radius:8px;padding:2px;gap:2px">';
  html+='<button onclick="_outMode=\'all\';_outActiveGroup=null;renderTab(\'output\')" style="padding:5px 12px;border-radius:6px;border:none;cursor:pointer;font-size:11.5px;font-family:Inter,sans-serif;font-weight:600;transition:.15s;'+(em==='all'?'background:rgba(124,58,237,.45);color:#e8deff':'background:transparent;color:rgba(232,222,255,.4)')+'">☰ All</button>';
  html+='<button onclick="_outMode=\'group\';_outActiveGroup=null;renderTab(\'output\')" style="padding:5px 12px;border-radius:6px;border:none;cursor:pointer;font-size:11.5px;font-family:Inter,sans-serif;font-weight:600;transition:.15s;'+(em==='group'&&!ag?'background:rgba(124,58,237,.45);color:#e8deff':'background:transparent;color:rgba(232,222,255,.4)')+'">▤ Groups</button>';
  html+='</div>';
  // Grid layout picker
  var gridOpts=[{c:1,lbl:'1×1'},{c:2,lbl:'1×2'},{c:3,lbl:'2×2'},{c:4,lbl:'2×3'},{c:5,lbl:'2×4'},{c:6,lbl:'3×3'},{c:7,lbl:'3×4'},{c:8,lbl:'4×4'}];
  html+='<div style="display:flex;background:rgba(14,6,24,.7);border:1px solid rgba(124,58,237,.18);border-radius:8px;padding:2px;gap:1px;align-items:center">';
  html+='<span style="font-size:9px;padding:3px 6px 3px 7px;background:rgba(124,58,237,.4);color:#e8deff;border-radius:5px;white-space:nowrap;letter-spacing:.4px;font-weight:700;text-transform:uppercase;border:1px solid rgba(124,58,237,.35);margin-right:2px">Grid</span>';
  gridOpts.forEach(function(g){
    var active=_outGrid===g.c;
    html+='<button onclick="_outGrid='+g.c+';renderTab(\'output\')" style="padding:4px 7px;border-radius:5px;border:none;cursor:pointer;font-size:10px;font-family:Inter,sans-serif;font-weight:700;white-space:nowrap;transition:.12s;'+(active?'background:rgba(124,58,237,.5);color:#e8deff':'background:transparent;color:rgba(232,222,255,.3)')+'" title="'+g.lbl+' grid">'+g.lbl+'</button>';
  });
  html+='</div>';
  // Breadcrumb when inside a group
  if(em==='group'&&ag){
    var crCol=_outGroupColor(ag);
    html+='<div style="display:flex;align-items:center;gap:6px">';
    html+='<button onclick="_outActiveGroup=null;renderTab(\'output\')" style="background:rgba(124,58,237,.12);border:1px solid rgba(124,58,237,.22);border-radius:6px;padding:4px 9px;color:#c084fc;font-size:11px;cursor:pointer">← All Groups</button>';
    html+='<span style="font-size:12px;font-weight:700;color:'+crCol+';display:flex;align-items:center;gap:5px">'+_outGroupIcon(ag)+' '+ag+'</span>';
    html+='</div>';
  }
  html+='</div>';
  // Right: count + clear
  html+='<div style="display:flex;align-items:center;gap:6px">';
  html+='<span style="font-size:10.5px;color:rgba(232,222,255,.3)">'+outputs.length+' result'+(outputs.length>1?'s':'')+'</span>';
  html+='<button onclick="ossDialog({type:\'delete\',title:\'Clear All Outputs\',msg:\'Hapus semua hasil analisis?\',okLabel:\'Clear All\',onOk:function(){outputs.length=0;updateBadges();renderTab(\'output\');}})" style="background:rgba(220,38,38,.1);border:1px solid rgba(220,38,38,.22);border-radius:6px;padding:4px 9px;color:#f87171;font-size:11px;cursor:pointer">Clear All</button>';
  html+='</div>';
  html+='</div>';

  // ── GROUP VIEW: preview grid ─────────────────────────────────────────
  if(em==='group' && !ag){
    html+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px">';
    groups.forEach(function(g){
      var col=_outGroupColor(g.key);
      var grpOuts=outputs.filter(function(o){return _outGroup(o)===g.key;});
      // Derive a solid background from col (sidebar-like, not transparent)
      html+='<div onclick="_outActiveGroup=\'' + g.key.replace(/\\/g,'\\\\').replace(/'/g,"\\'") + '\';renderTab(\'output\')" ';
      html+='style="cursor:pointer;background:rgba(14,6,28,.97);border:1px solid '+col+'45;border-top:3px solid '+col+';border-radius:12px;padding:14px 16px;transition:.18s;position:relative;box-shadow:0 2px 18px rgba(0,0,0,.45),inset 0 0 0 1px '+col+'10">';
      html+='<div style="display:flex;align-items:center;gap:7px;margin-bottom:10px">';
      html+='<span style="color:'+col+';display:flex">'+_outGroupIcon(g.key)+'</span>';
      html+='<span style="font-size:13px;font-weight:700;color:#e8deff">'+g.key+'</span>';
      html+='<span style="margin-left:auto;background:'+col+'30;color:'+col+';border-radius:999px;padding:1px 8px;font-size:10px;font-weight:700;border:1px solid '+col+'40">'+g.count+'</span>';
      html+='</div>';
      grpOuts.slice(0,2).forEach(function(o){
        html+='<div style="font-size:10.5px;color:rgba(232,222,255,.5);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px">'+escHtml(o.title)+'</div>';
      });
      if(g.count>2) html+='<div style="font-size:10px;color:rgba(232,222,255,.25);margin-top:2px">+'+(g.count-2)+' more…</div>';
      html+='<div style="font-size:9.5px;color:rgba(232,222,255,.2);margin-top:8px">Latest: '+new Date(grpOuts[0].id).toLocaleTimeString()+'</div>';
      html+='<div style="position:absolute;bottom:10px;right:12px;font-size:10.5px;color:'+col+';opacity:.8">View →</div>';
      html+='</div>';
    });
    html+='</div>';
    el.innerHTML=html;
    return;
  }

  // ── ALL VIEW or GROUP DETAIL VIEW: render cards ──────────────────────
  var toShow=outputs;
  if(em==='group'&&ag){
    toShow=outputs.filter(function(o){return _outGroup(o)===ag;});
    // Sub-label chips
    var subTitles=[];
    toShow.forEach(function(o){if(subTitles.indexOf(o.title)===-1)subTitles.push(o.title);});
    if(subTitles.length>1){
      var col2=_outGroupColor(ag);
      html+='<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:12px;padding:10px;background:rgba(14,6,24,.5);border-radius:8px;border:1px solid '+col2+'18">';
      html+='<span style="font-size:10px;color:rgba(232,222,255,.3);align-self:center;margin-right:4px">Tests:</span>';
      subTitles.forEach(function(sub){
        var cnt=toShow.filter(function(o){return o.title===sub;}).length;
        html+='<div style="background:rgba(14,6,24,.7);border:1px solid '+col2+'25;border-radius:6px;padding:4px 10px;font-size:10.5px;color:rgba(232,222,255,.65);display:flex;align-items:center;gap:5px">';
        html+=escHtml(sub);
        if(cnt>1) html+='<span style="background:'+col2+'22;color:'+col2+';border-radius:999px;padding:0 6px;font-size:9.5px;font-weight:700">×'+cnt+'</span>';
        html+='</div>';
      });
      html+='</div>';
    }
  }

  // Grid wrapper — cols based on _outGrid
  var _gridColsMap=[1,2,2,2,2,3,3,4];
  var _cols=_gridColsMap[(_outGrid-1)%8]||1;
  var _gridStyle=_cols===1
    ?'display:flex;flex-direction:column;gap:10px'
    :'display:grid;grid-template-columns:repeat('+_cols+',1fr);gap:10px;align-items:start';
  html+='<div style="'+_gridStyle+'">';

  toShow.forEach(function(o){
    var grpColor=_outGroupColor(_outGroup(o));
    var _isCompact=_cols>1;
    html+='<div class="card" style="border-top:2px solid '+grpColor+'35;margin-bottom:0;overflow:hidden'+ (_isCompact?';min-width:0':'')+'">';
    html+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:11px;flex-wrap:wrap;gap:6px">';
    html+='<div style="display:flex;align-items:center;gap:7px;min-width:0;flex:1">';
    html+='<span style="background:'+grpColor+'18;color:'+grpColor+';border:1px solid '+grpColor+'30;border-radius:5px;padding:1px 7px;font-size:9.5px;font-weight:700;white-space:nowrap;flex-shrink:0">'+_outGroup(o)+'</span>';
    html+='<div class="sec-hd" style="margin-bottom:0;overflow:hidden;text-overflow:ellipsis;white-space:'+ (_isCompact?'nowrap':'normal')+'">'+escHtml(o.title)+'</div>';
    html+='</div>';
    html+='<div class="row" style="gap:5px;flex-wrap:wrap;flex-shrink:0">';
    html+='<span style="font-size:9.5px;color:#334155">'+new Date(o.id).toLocaleTimeString()+'</span>';
    html+='<button class="btn-apa-copy" id="apacopy-'+o.id+'" onclick="copyAPA('+o.id+',this)" title="Copy APA">Copy APA</button>';
    html+='<button class="btn btn-ghost btn-sm" style="padding:3px 9px;background:rgba(124,58,237,.12);border:1px solid rgba(124,58,237,.3);color:#c084fc;font-size:11px;font-weight:600" onclick="_exportOutputDialog('+o.id+')">⬇ Export</button>';
    html+='<button class="btn btn-ghost btn-sm" style="padding:3px 8px" onclick="removeOutput('+o.id+')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg></button>';
    html+='</div>';
    html+='</div>';
    if(o.type==='descriptive'){
      html+=renderOutBasic_descriptive(o);
    }
    else if(o.type==='ttest'){
      html+=renderOutBasic_ttest(o);
    }
    else if(o.type==='paired'){
      html+=renderOutBasic_paired(o);
    }
    else if(o.type==='rmanova'&&o.res){
      html+=renderOutBasic_rmanova(o);
    }
    else if(o.type==='onesamp'){
      html+=renderOutBasic_onesamp(o);
    }
    else if(o.type==='anova'){
      html+=renderOutBasic_anova(o);
    }
    else if(o.type==='anova2'){
      html+=renderOutBasic_anova2(o);
    }
    else if(o.type==='anova3'){
      html+=renderOutBasic_anova3(o);
    }
    else if(o.type==='correlation'){
      html+=renderOutBasic_correlation(o);
    }
    else if(o.type==='partialCorr'){
      html+=renderOutBasic_partialCorr(o);
    }
    else if(o.type==='canonicalCorr'){
      html+=renderOutBasic_canonicalCorr(o);
    }
    else if(o.type==='regression'){
      html+=renderOutBasic_regression(o);
    }
    else if(o.type==='multipleReg'){
      html+=renderOutBasic_multipleReg(o);
    }
    else if(o.type==='hierarchicalReg'&&o.res){
      html+=renderOutBasic_hierarchicalReg(o);
    }
    else if(o.type==='logistic'){
      html+=renderOutBasic_logistic(o);
    }
    else if(o.type==='mannwhitney'){
      html+=renderOutBasic_mannwhitney(o);
    }
    else if(o.type==='kruskal'){
      html+=renderOutBasic_kruskal(o);
    }
    else if(o.type==='wilcoxon'){
      html+=renderOutBasic_wilcoxon(o);
    }
    else if(o.type==='glm'){
      html+=renderOutBasic_glm(o);
    }
    else if(o.type==='poisson'||o.type==='negbin'){
      html+=renderOutBasic_poisson(o);
    }
    else if(o.type==='manova'){
      html+=renderOutBasic_manova(o);
    }
    else if(o.type==='hlm'){
      html+=renderOutAdv_hlm(o);
    }
    else if(o.type==='alpha'){
      html+=renderOutAdv_alpha(o);
    }
    else if(o.type==='kappa'){
      html+=renderOutAdv_kappa(o);
    }
    else if(o.type==='efa'){
      html+=renderOutAdv_efa(o);
    }
    else if(o.type==='cfa'){
      html+=renderOutAdv_cfa(o);
    }

    else if(o.type==='sem'){
      html+=renderOutAdv_sem(o);
    }


        else if(o.type==='mediation'){
      html+=renderOutAdv_mediation(o);
    }

    else if(o.type==='discriminant'&&o.res){
      html+=renderOutAdv_discriminant(o);
    }

    else if(o.type==='cluster'&&o.res){
      html+=renderOutAdv_cluster(o);
    }

    else if(o.type==='poweranalysis'&&o.res){
      html+=renderPowerOutput(o);
    }

    else if(o.type==='moderation'&&o.res){
      html+=renderModerationOutput(o);
    }

    else if(o.type==='mi'&&o.res){
      var r=o.res;
      var methLabels={'pmm':'PMM (Predictive Mean Matching)','norm':'Bayesian Normal Regression','mice_cart':'CART'};
      html+='<div style="margin-bottom:11px;padding:10px 14px;border-radius:9px;border:1px solid rgba(192,132,252,.35);background:rgba(192,132,252,.06)">';
      html+='<div style="font-size:13px;font-weight:800;color:#c084fc;font-family:Playfair Display,serif"> Multiple Imputation</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.5);margin-top:3px">Method: '+methLabels[r.method]+' · M='+r.M+' imputed datasets · N='+r.n+'</div>';
      html+='</div>';
      html+='<div class="stats-grid2" style="margin-bottom:11px">';
      html+=stCard('M (Imputations)',r.M,'');
      html+=stCard('Variables Imputed',r.targetVars.length,'');
      html+=stCard('Method',r.method.toUpperCase(),'');
      html+=stCard('Cases',r.n,'');
      html+='</div>';
      html+='<div style="font-size:11px;font-weight:700;color:#c084fc;margin-bottom:7px">Pooled Results (Rubin\'s Rules)</div>';
      html+=mkTable(['Variable','N Observed','N Imputed','Orig. Mean','Pooled Mean','Orig. SD','Pooled SD','FMI (λ)'],
        r.pooled.map(function(p){
          var fmiNum=parseFloat(p.FMI);
          var fmiCol=fmiNum>0.5?'#f87171':fmiNum>0.3?'#fbbf24':'#34d399';
          return[p.variable,p.n,p.nImputed,p.origMean,'<b style="color:#c084fc">'+p.pooledMean+'</b>',p.origSD,p.pooledSD,'<span style="color:'+fmiCol+'">'+p.FMI+'</span>'];
        }));
      html+='<div style="margin-top:10px;padding:9px 12px;background:rgba(124,58,237,.08);border-radius:8px;border:1px solid rgba(124,58,237,.18);font-size:11px;color:rgba(232,222,255,.6);line-height:1.65">';
      html+='<b style="color:#c084fc">FMI (Fraction of Missing Information):</b> λ &lt; 0.1 = low impact · λ 0.1–0.3 = moderate · λ &gt; 0.5 = high — consider reducing missingness. Pooled SD reflects imputation uncertainty. The first imputed dataset (M=1) has been applied to the active dataset.';
      html+='</div>';
      // Convergence plot
      if(r.pooled.length>0&&r.pooled[0].convergence&&r.pooled[0].convergence.length>1){
        html+='<div style="margin-top:12px;font-size:11px;font-weight:700;color:#c084fc;margin-bottom:5px">Convergence Plot (Imputed Means across M)</div>';
        html+=svgConvergence(r.pooled);
      }
    }

    else if(o.type==='roc'&&o.res){
      var r=o.res;
      var aucCol2=parseFloat(r.auc)>=0.9?'#34d399':parseFloat(r.auc)>=0.8?'#a5f3fc':parseFloat(r.auc)>=0.7?'#fbbf24':'#f87171';
      html+='<div style="margin-bottom:11px;padding:10px 14px;border-radius:9px;border:1px solid '+aucCol2+';background:rgba(0,0,0,.12);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">';
      html+='<div><div style="font-size:14px;font-weight:800;color:'+aucCol2+';font-family:Playfair Display,serif">'+r.aucInterp+'</div><div style="font-size:11px;color:rgba(232,222,255,.5);margin-top:2px">'+escHtml(o.rocProb)+' → '+escHtml(o.rocTrue)+' (pos: '+escHtml(r.posClass)+')</div></div>';
      html+='<div style="text-align:right"><div style="font-size:18px;font-weight:900;color:'+aucCol2+'">AUC = '+r.auc+'</div><div style="font-size:10px;color:rgba(232,222,255,.4)">95% CI: '+r.aucCI+'</div></div>';
      html+='</div>';
      html+='<div class="stats-grid" style="margin-bottom:12px">';
      html+=stCard('AUC',r.auc,r.aucInterp);
      html+=stCard('95% CI',r.aucCI,'Hanley-McNeil');
      html+=stCard('N',r.n,'pos='+r.nPos+' neg='+r.nNeg);
      html+=stCard('Optimal Cutoff',r.optThresh,'Youden');
      html+=stCard('Sensitivity',r.optSens,'at optimal');
      html+=stCard('Specificity',r.optSpec,'at optimal');
      html+=stCard('PPV',r.optPPV,'precision');
      html+=stCard('NPV',r.optNPV,'');
      html+=stCard('F1 Score',r.optF1,'');
      html+=stCard('Youden J',r.optYouden,'');
      html+='</div>';
      html+=svgROC(r);
      html+='<div style="margin-top:12px"><div class="sec-hd" style="margin-bottom:6px">AUC Interpretation Guide</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>AUC Range</th><th>Discriminative Ability</th></tr></thead><tbody>';
      [['0.90 – 1.00','Excellent'],['0.80 – 0.89','Good'],['0.70 – 0.79','Acceptable'],['0.60 – 0.69','Poor'],['0.50 – 0.59','Fail (no better than chance)']].forEach(function(row){
        html+='<tr><td class="td-num">'+row[0]+'</td><td style="font-size:11px;color:rgba(232,222,255,.6)">'+row[1]+'</td></tr>';
      });
      html+='</tbody></table></div></div>';
    }

    else if(o.type==='survival'&&o.res){
      var r=o.res;
      html+='<div style="margin-bottom:11px;padding:10px 14px;border-radius:9px;border:1px solid rgba(74,222,128,.3);background:rgba(74,222,128,.06)">';
      html+='<div style="font-size:13px;font-weight:800;color:#4ade80;font-family:Playfair Display,serif"> Kaplan-Meier Survival Analysis</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.5);margin-top:3px">Time: '+escHtml(o.survTime)+' · Event: '+escHtml(o.survEvent)+(o.survGroup?' · Group: '+escHtml(o.survGroup):'')+'</div>';
      html+='</div>';
      html+='<div class="stats-grid" style="margin-bottom:12px">';
      r.groups.forEach(function(g){
        html+=stCard('N ('+g.label+')',g.n,'');
        html+=stCard('Events ('+g.label+')',g.events,'');
        html+=stCard('Median Surv. ('+g.label+')',g.medianSurv===null?'NR':SE.f4(g.medianSurv),'');
      });
      html+='</div>';
      html+=svgKaplanMeier(r);
      if(r.groups.length>=2){
        var lr=r.logrank;
        html+='<div style="margin-top:12px"><div class="sec-hd" style="margin-bottom:7px">Log-Rank Test</div>';
        html+=mkTable(['Group','N','Events','Censored','Median Survival','O−E'],
          r.groups.map(function(g){return[escHtml(g.label),g.n,g.events,g.n-g.events,g.medianSurv===null?'NR':SE.f4(g.medianSurv),g.oe];}));
        html+='<div style="margin-top:9px;padding:9px 12px;background:rgba(124,58,237,.08);border-radius:8px;border:1px solid rgba(124,58,237,.18);font-size:11.5px;color:rgba(232,222,255,.7)">'+lr.interpretation+'</div>';
        html+='</div>';
      }
    }

    else if(o.type==='cox'&&o.res){
      var r=o.res;
      var cC=parseFloat(r.concordance)>=0.8?'#34d399':parseFloat(r.concordance)>=0.7?'#fbbf24':'#f87171';
      html+='<div style="margin-bottom:11px;padding:10px 14px;border-radius:9px;border:1px solid rgba(74,222,128,.3);background:rgba(74,222,128,.06);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap">';
      html+='<div><div style="font-size:13px;font-weight:800;color:#4ade80;font-family:Playfair Display,serif">Cox Proportional Hazards</div><div style="font-size:11px;color:rgba(232,222,255,.5);margin-top:2px">N='+r.n+' · Events='+r.events+' · Covariates: '+r.covariates.map(escHtml).join(', ')+'</div></div>';
      html+='<div style="text-align:right"><div style="font-size:13px;font-weight:700;color:'+cC+'">C-index = '+r.concordance+'</div><div style="font-size:10px;color:rgba(232,222,255,.4)">LR χ²='+r.lrChi2+' p='+r.lrP_fmt+'</div></div>';
      html+='</div>';
      html+='<div class="stats-grid2" style="margin-bottom:12px">';
      html+=stCard('N',r.n,'');
      html+=stCard('Events',r.events,'');
      html+=stCard('Concordance (C)',r.concordance,'');
      html+=stCard('LR Test p',r.lrP_fmt,'');
      html+='</div>';
      html+=mkTable(['Covariate','β','SE','HR','95% CI HR','z','p'],
        r.coefs.map(function(c){
          var sig=parseFloat(c.p)<0.05;
          var hrNum=parseFloat(c.HR);
          var hrCol=hrNum>1.5?'#f87171':hrNum<0.67?'#34d399':'rgba(232,222,255,.75)';
          return[escHtml(c.name),c.beta,c.se,'<b style="color:'+hrCol+'">'+c.HR+'</b>',c.ci95,c.z,(sig?'<b style="color:#34d399">':'')+c.p_fmt+(sig?'</b>':'')];
        }));
      html+=svgForestPlot(r);
      html+='<div style="margin-top:10px;padding:9px 12px;background:rgba(74,222,128,.06);border:1px solid rgba(74,222,128,.18);border-radius:8px;font-size:11px;color:rgba(232,222,255,.6);line-height:1.65"><b style="color:#4ade80">Interpretation:</b> HR &gt; 1 = higher risk (shorter survival); HR &lt; 1 = protective. C-index: 0.5 = random · ≥0.7 = acceptable · ≥0.8 = good discrimination.</div>';
    }

    else if(o.type==='bayes_ttest'&&o.res){
      var r=o.res;
      var bf=parseFloat(r.BF10);
      var bfCol=bf>100?'#34d399':bf>30?'#4ade80':bf>10?'#a3e635':bf>3?'#fbbf24':bf>1?'#fb923c':bf>0.1?'#f87171':'#e879f9';
      html+='<div style="margin-bottom:12px;padding:14px 18px;border-radius:10px;background:rgba(0,0,0,.2);border:2px solid '+bfCol+';display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">';
      html+='<div><div style="font-size:22px;font-weight:900;color:'+bfCol+';font-family:Playfair Display,serif">BF₁₀ = '+r.BF10+'</div>';
      html+='<div style="font-size:12px;color:rgba(232,222,255,.6);margin-top:2px">'+r.interpretation+'</div></div>';
      html+='<div style="text-align:right"><div style="font-size:11.5px;font-weight:700;color:rgba(232,222,255,.5)">BF₀₁ = '+r.BF01+'</div>';
      html+='<div style="font-size:10.5px;color:rgba(232,222,255,.35)">t('+r.df+')='+r.t+' · p='+r.p_fmt+'</div></div>';
      html+='</div>';
      html+='<div class="stats-grid2" style="margin-bottom:12px">';
      html+=stCard('BF₁₀',r.BF10,'Evidence for H₁');
      html+=stCard('BF₀₁',r.BF01,'Evidence for H₀');
      html+=stCard("Cohen's d",r.cohensD,r.dInterp);
      html+=stCard('t-statistic',r.t,'df='+r.df+' · p='+r.p_fmt);
      html+=stCard('n₁',r.n1,'Group '+escHtml(o.ga||'A'));
      html+=stCard('n₂',r.n2,'Group '+escHtml(o.gb||'B'));
      html+='</div>';
      html+='<div style="margin-top:8px;padding:10px 14px;border-radius:9px;background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.18);font-size:11.5px;color:rgba(232,222,255,.65);line-height:1.7">';
      html+='<b style="color:#c084fc">Prior:</b> Cauchy(r='+r.priorScale+') · Tails: '+(o.tails===2?'two-tailed':'one-tailed')+'<br>';
      html+='<b style="color:#c084fc">Interpretation guide:</b> BF₁₀ &gt; 100 = extreme H₁ · &gt; 30 = very strong · &gt; 10 = strong · &gt; 3 = moderate · &gt; 1 = anecdotal · &lt; 1/3 = moderate H₀ · &lt; 1/10 = strong H₀.';
      html+='</div>';
    }

    else if(o.type==='bayes_corr'&&o.res){
      var r=o.res;
      var bf=parseFloat(r.BF10);
      var bfCol=bf>100?'#34d399':bf>10?'#4ade80':bf>3?'#fbbf24':bf>1?'#fb923c':'#f87171';
      html+='<div style="margin-bottom:12px;padding:14px 18px;border-radius:10px;background:rgba(0,0,0,.2);border:2px solid '+bfCol+'">>';
      html+='<div style="font-size:22px;font-weight:900;color:'+bfCol+';font-family:Playfair Display,serif">BF₁₀ = '+r.BF10+'</div>';
      html+='<div style="font-size:12px;color:rgba(232,222,255,.6);margin-top:2px">'+r.interpretation+'</div>';
      html+='</div>';
      html+='<div class="stats-grid2" style="margin-bottom:12px">';
      html+=stCard('BF₁₀',r.BF10,'Evidence for ρ≠0');
      html+=stCard('BF₀₁',r.BF01,'Evidence for ρ=0');
      html+=stCard('Pearson r',r.r,'');
      html+=stCard('p-value (NHST)',r.p_fmt,'');
      html+=stCard('N',r.n,'');
      html+=stCard('Prior scale κ',SE.f4(o.prior||1),'JZS prior');
      html+='</div>';
    }

    else if(o.type==='bayes_posterior'&&o.res){
      var r=o.res;
      html+='<div style="margin-bottom:12px;padding:12px 16px;border-radius:10px;background:rgba(124,58,237,.12);border:1.5px solid rgba(192,132,252,.4)">';
      html+='<div style="font-size:16px;font-weight:800;color:#c084fc;font-family:Playfair Display,serif">Posterior Mean = '+r.postMean+'</div>';
      html+='<div style="font-size:12px;color:rgba(232,222,255,.6);margin-top:2px">95% Credible Interval: '+r.hdi95+'</div>';
      html+='</div>';
      html+='<div class="stats-grid2" style="margin-bottom:12px">';
      html+=stCard('Posterior μ',r.postMean,'');
      html+=stCard('Posterior SD',r.postSD,'');
      html+=stCard('95% Credible Interval',r.hdi95,'HDI');
      html+=stCard('Sample Mean',r.sampleMean,'');
      html+=stCard('Prior μ₀',r.priorMu0,'');
      html+=stCard('N',r.n,'');
      html+='</div>';
      html+=svgBayesPosterior(r);
      html+='<div style="margin-top:10px;padding:10px 14px;border-radius:9px;background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.18);font-size:11.5px;color:rgba(232,222,255,.65);line-height:1.7">';
      html+='<b style="color:#c084fc">Prior:</b> Normal-Inverse-Gamma (μ₀='+r.priorMu0+', κ₀='+r.priorKappa0+')<br>';
      html+='<b style="color:#c084fc">Note:</b> The credible interval is a direct probability statement: "There is 95% probability that μ lies in '+r.hdi95+' given the data and prior."';
      html+='</div>';
    }

    else if(o.type==='timeseries'&&o.res){
      var r=o.res;
      html+='<div style="margin-bottom:12px;padding:12px 16px;border-radius:10px;background:rgba(103,232,249,.07);border:1.5px solid rgba(103,232,249,.3)">';
      html+='<div style="font-size:16px;font-weight:800;color:#67e8f9;font-family:Playfair Display,serif">'+r.model+'</div>';
      html+='<div style="font-size:11.5px;color:rgba(232,222,255,.5);margin-top:3px">Variable: '+escHtml(r.variable)+' · N = '+r.n+'</div>';
      html+='</div>';
      if(r.arCoefs){
        // ARIMA output
        html+='<div class="stats-grid2" style="margin-bottom:12px">';
        html+=stCard('AIC',r.aic,'');
        html+=stCard('BIC',r.bic,'');
        html+=stCard('σ̂ (residual SD)',r.sigma,'');
        html+=stCard('1-step Forecast',r.forecast,'');
        html+=stCard('95% CI Low',r.fc_lo95,'');
        html+=stCard('95% CI High',r.fc_hi95,'');
        html+='</div>';
        if(r.arCoefs.length){
          html+='<div class="tbl-wrap"><table><thead><tr><th>Parameter</th><th>Estimate</th></tr></thead><tbody>';
          html+='<tr><td>Intercept (μ)</td><td class="td-num">'+SE.f4(r.mu||0)+'</td></tr>';
          r.arCoefs.forEach(function(c,i){html+='<tr><td>AR('+(i+1)+')</td><td class="td-num">'+c+'</td></tr>';});
          r.maCoefs.forEach(function(c,i){html+='<tr><td>MA('+(i+1)+')</td><td class="td-num">'+c+'</td></tr>';});
          html+='</tbody></table></div>';
        }
        html+='<div style="margin-top:10px;padding:9px 13px;background:rgba(103,232,249,.05);border:1px solid rgba(103,232,249,.18);border-radius:8px;font-size:11.5px;color:rgba(232,222,255,.7);line-height:1.65">';
        html+='<b style="color:#67e8f9">Forecast (1-step):</b> '+r.forecast+' &nbsp;[95% CI: '+r.fc_lo95+' – '+r.fc_hi95+']<br>';
        html+='<b style="color:#67e8f9">Residual Mean:</b> '+r.residMean+' &nbsp;·&nbsp; <b style="color:#67e8f9">Residual SD:</b> '+r.residSD;
        html+='</div>';
      } else {
        // Decomposition output
        html+='<div class="stats-grid2" style="margin-bottom:12px">';
        html+=stCard('Period',r.period,'seasonal');
        html+=stCard('Model Type',r.type,'');
        html+=stCard('Seasonal Strength',r.seasonalStrength,'0–1 scale');
        html+=stCard('Seasonal Amplitude',r.seasonalAmplitude,'');
        html+=stCard('Remainder SD',r.remainderSD,'');
        html+=stCard('Trend Range','['+r.trendRange[0]+', '+r.trendRange[1]+']','');
        html+='</div>';
        if(r.seasonalIndices&&r.seasonalIndices.length){
          html+='<div style="margin-top:10px"><div style="font-size:11px;font-weight:700;color:#c084fc;margin-bottom:6px">Seasonal Indices</div>';
          html+='<div class="tbl-wrap"><table><thead><tr>';
          r.seasonalIndices.forEach(function(s){html+='<th>P'+s.period+'</th>';});
          html+='</tr></thead><tbody><tr>';
          r.seasonalIndices.forEach(function(s){
            var v=parseFloat(s.index),col=v>0?'#34d399':v<0?'#f87171':'rgba(232,222,255,.6)';
            html+='<td class="td-num" style="color:'+col+'">'+s.index+'</td>';
          });
          html+='</tr></tbody></table></div></div>';
        }
      }
    }

    else if(o.type==='metaanalysis'&&o.res){
      var r=o.res;
      var psig=r.p<0.05;
      html+='<div style="margin-bottom:12px;padding:12px 16px;border-radius:10px;background:rgba(251,146,60,.07);border:1.5px solid rgba(251,146,60,.3)">';
      html+='<div style="font-size:16px;font-weight:800;color:#fb923c;font-family:Playfair Display,serif">Meta-Analysis · '+(r.model==='fixed'?'Fixed-Effect':'Random-Effects')+' (k = '+r.k+' studies)</div>';
      html+='<div style="font-size:11.5px;color:rgba(232,222,255,.5);margin-top:3px">Pooled '+r.effectLabel+' = '+r.pooledEffect+' &nbsp;[95% CI: '+r.ci_lo+', '+r.ci_hi+'] &nbsp;· &nbsp;z = '+r.z+', p = '+r.p_fmt+'</div>';
      html+='</div>';

      html+='<div class="stats-grid2" style="margin-bottom:12px">';
      html+=stCard('Pooled Effect ('+r.effectLabel+')',r.pooledEffect,'SE = '+r.se);
      html+=stCard('95% CI','['+r.ci_lo+', '+r.ci_hi+']','');
      html+=stCard('z',r.z,'p = '+r.p_fmt);
      html+=stCard('Sig?',psig?'Yes ✓':'No ✗','α = 0.05');
      html+=stCard('Q statistic',r.Q,'p = '+r.Q_p_fmt);
      html+=stCard('I² (%)',r.I2+'%',r.I2label);
      html+=stCard('τ²',r.tau2,'Between-study variance');
      html+=stCard('τ',r.tau,'SD between studies');
      html+='</div>';

      // Heterogeneity interpretation
      var hColor=r.I2raw<25?'#34d399':r.I2raw<50?'#fbbf24':r.I2raw<75?'#fb923c':'#f87171';
      html+='<div style="margin-bottom:12px;padding:10px 13px;background:rgba(124,58,237,.06);border:1px solid rgba(124,58,237,.15);border-radius:8px;font-size:11.5px;color:rgba(232,222,255,.7);line-height:1.65">';
      html+='<b style="color:#fb923c">Heterogenitas: </b><b style="color:'+hColor+'">'+r.I2label+'</b> · ';
      html+='Q('+( r.k-1)+') = '+r.Q+', p = '+r.Q_p_fmt+'. ';
      html+=r.I2raw<25?'Studi cukup homogen.':r.I2raw<50?'Ada variasi sedang antar studi.':r.I2raw<75?'Heterogenitas substansial.':'Heterogenitas tinggi — hati-hati interpretasi.';
      html+='</div>';

      // Study-level table
      html+='<div style="font-size:11px;font-weight:700;color:#fb923c;margin-bottom:6px">Hasil Per Studi</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Studi</th><th>yi</th><th>vi</th><th>SE</th><th>95% CI</th><th>Bobot (%)</th></tr></thead><tbody>';
      (r.studyData||[]).forEach(function(s){
        html+='<tr><td class="td-label">'+escHtml(s.name)+'</td>';
        html+='<td class="td-num">'+s.yi.toFixed(3)+'</td>';
        html+='<td class="td-num">'+s.vi.toFixed(4)+'</td>';
        html+='<td class="td-num">'+Math.sqrt(s.vi).toFixed(4)+'</td>';
        html+='<td class="td-num">['+s.ci_lo+', '+s.ci_hi+']</td>';
        html+='<td class="td-num">'+s.weight.toFixed(1)+'%</td>';
        html+='</tr>';
      });
      html+='</tbody></table></div>';

      // Forest plot
      html+='<div style="margin-top:14px;font-size:11px;font-weight:700;color:#fb923c;margin-bottom:6px">Forest Plot</div>';
      html+=svgMetaForestPlot(o.studies||[],r,o.effectType||'yi');

      // Funnel plot
      html+='<div style="margin-top:14px;font-size:11px;font-weight:700;color:#fb923c;margin-bottom:6px">Funnel Plot <span style="font-size:9.5px;font-weight:400;color:rgba(232,222,255,.35)">(publication bias check)</span></div>';
      html+=svgFunnelPlot(r);
      html+='<div style="font-size:10.5px;color:rgba(232,222,255,.35);margin-top:6px">Funnel plot simetris → tidak ada publication bias. Asimetri → kemungkinan ada bias publikasi.</div>';
    }

    // ── Interpretation summary ────────────────────────────────────────
    try{var _interp=_buildInterp(o);if(_interp)html+=_interpBox(_interp);}catch(e){}

    html+='</div>';
  });
  html+='</div>'; // end grid wrapper
  el.innerHTML=html;
}
// ════════════════════════════════════════════════════════════════════════
// (these are called from inside renderOutputs forEach loop above)
// We patch the renderOutputs function to add these types by using
// a post-render injection approach — the output html is built inline
// in the forEach at line ~11000+. Since we can't easily inject there,
// we store the renderers here and invoke them via the output block.
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
  html+='</div>';
  html+='<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:11px;color:rgba(232,222,255,.5);margin-bottom:4px"><span>Power</span><span style="color:'+pwCol+'">'+SE.f4(parseFloat(r.power)*100)+'%</span></div>';
  html+='<div style="height:10px;background:rgba(255,255,255,.06);border-radius:99px;overflow:hidden"><div style="height:100%;width:'+Math.min(100,parseFloat(r.power)*100)+'%;background:'+pwCol+';border-radius:99px"></div></div></div>';
  html+='<div style="padding:10px 12px;background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.18);border-radius:8px;font-size:11.5px;color:rgba(232,222,255,.7);line-height:1.65">'+r.interpretation+'</div>';
  html+='<div style="margin-top:12px">'+svgPowerCurve(o.pwTest||'ttest_2samp',parseFloat(o.pwAlpha||0.05),parseInt(o.pwTails||2))+'</div>';
  return html;
}

function renderModerationOutput(o){
  var r=o.res;
  var intSig2=parseFloat(r.interaction.p)<0.05;
  var intColor=intSig2?'#34d399':'#f87171';
  var html='';
  html+='<div style="margin-bottom:12px;padding:12px 16px;border-radius:10px;background:rgba(0,0,0,.15);border:1.5px solid '+intColor+'"><div style="font-size:14px;font-weight:800;color:'+intColor+';font-family:Playfair Display,serif">'+(intSig2?'&#x2713; Significant Moderation':'&#x2717; Non-significant Moderation')+'</div>';
  html+='<div style="font-size:11px;color:rgba(232,222,255,.5);margin-top:2px">'+escHtml(r.xName)+'&#xD7;'+escHtml(r.wName)+' &#x2192; '+escHtml(r.yName)+' &#xB7; N='+r.n+(r.center?' (mean-centered)':'')+'</div></div>';
  html+='<div class="stats-grid" style="margin-bottom:12px">';
  html+=stCard('R&#xB2;',r.R2,'Variance explained');
  html+=stCard('Adj R&#xB2;',r.R2adj,'');
  html+=stCard('F',r.F,'p='+r.pF_fmt);
  html+=stCard('N',r.n,'');
  html+=stCard('&#x394;R&#xB2; (int)',r.deltaR2,'Interaction increment');
  html+=stCard('b(X&#xD7;W)',r.interaction.b,'p='+r.interaction.p_fmt);
  html+='</div>';
  html+='<div style="font-size:11px;font-weight:700;color:#c084fc;margin-bottom:7px">Regression Coefficients</div>';
  html+='<div class="tbl-wrap"><table><thead><tr><th>Variable</th><th>b</th><th>SE</th><th>&#x3B2;</th><th>t</th><th>p</th></tr></thead><tbody>';
  r.coefs.forEach(function(c){
    var sig=parseFloat(c.p)<0.05;
    html+='<tr><td class="td-label">'+escHtml(c.name)+'</td><td class="td-num">'+c.b+'</td><td class="td-num">'+c.SE+'</td><td class="td-num">'+c.beta+'</td><td class="td-num">'+c.t+'</td><td><span class="tag '+(sig?'tag-green':'tag-gray')+'">'+c.p_fmt+'</span></td></tr>';
  });
  html+='</tbody></table></div>';
  html+='<div style="margin-top:12px">'+svgModerationPlot(r,r.xName,r.wName,r.yName)+'</div>';
  html+='<div style="margin-top:12px;font-size:11px;font-weight:700;color:#c084fc;margin-bottom:7px">Simple Slopes Analysis</div>';
  html+='<div class="tbl-wrap"><table><thead><tr><th>W Level</th><th>W Value</th><th>Slope</th><th>SE</th><th>t</th><th>p</th><th>95% CI</th></tr></thead><tbody>';
  r.simpleSlopes.forEach(function(s){
    var ssig=parseFloat(s.p)<0.05;
    html+='<tr><td class="td-label" style="color:'+s.color+'">'+s.label+'</td><td class="td-num">'+s.wVal+'</td><td class="td-num" style="color:'+s.color+'">'+s.slope+'</td><td class="td-num">'+s.se+'</td><td class="td-num">'+s.t+'</td><td><span class="tag '+(ssig?'tag-green':'tag-gray')+'">'+s.p_fmt+'</span></td><td class="td-num" style="font-size:10px">'+s.ci95+'</td></tr>';
  });
  html+='</tbody></table></div>';
  if(r.jn){
    html+='<div style="margin-top:12px;font-size:11px;font-weight:700;color:#c084fc;margin-bottom:5px">Johnson-Neyman Floodlight Analysis</div>';
    html+=svgJohnsonNeymanPlot(r,r.xName,r.wName,r.yName);
    if(r.jn.regions.length>0){
      html+='<div class="tbl-wrap" style="margin-top:8px"><table><thead><tr><th>JN Point</th><th>W Value</th><th>Significant Region</th><th>% Dataset</th></tr></thead><tbody>';
      r.jn.regions.forEach(function(rp,i){html+='<tr><td class="td-label">JN-'+(i+1)+'</td><td class="td-num">'+SE.f4(rp.value)+'</td><td style="color:#c084fc;font-size:11px">'+rp.direction+'</td><td class="td-num">'+rp.pct+'%</td></tr>';});
      html+='</tbody></table></div>';
    } else {
      html+='<div style="font-size:11px;color:rgba(232,222,255,.55);margin-top:5px">No JN transition points found. '+r.jn.pctSig+'% of W range shows significant X&#x2192;Y relationship.</div>';
    }
  }
  html+='<div class="assump" style="margin-top:12px"><b style="color:#e879f9">Interpretation:</b> '+(intSig2?'Significant':'Non-significant')+' interaction b(X&#xD7;W)='+r.interaction.b+', t='+r.interaction.t+', p='+r.interaction.p_fmt+', &#x394;R&#xB2;='+r.deltaR2+'. '+(intSig2?'The effect of '+escHtml(r.xName)+' on '+escHtml(r.yName)+' is moderated by '+escHtml(r.wName)+'. Examine simple slopes and JN plot for regions of significance.':'The effect of '+escHtml(r.xName)+' on '+escHtml(r.yName)+' does not significantly differ across levels of '+escHtml(r.wName)+'.')+'</div>';
  return html;
}

function sigStar(p){
  var pf=parseFloat(p);
  if(!isFinite(pf)) return '';
  if(pf<.001) return '***';
  if(pf<.01)  return '**';
  if(pf<.05)  return '*';
  return '';
}
// Format p-value untuk teks APA (input: string p yang SUDAH diformat, mis. '0.0123').
// Output: '< .001' atau '= <p>'. SENGAJA bernama pFmtAPA — dulu bernama `pFmt` dan
// (sebagai function declaration global) menimpa pFmt milik stats-core-basic.js,
// sehingga SEMUA `p_fmt` engine jadi '= 0.1229189…' (regresi B5, diperbaiki 2026-09-21).
// JANGAN dinamai ulang jadi `pFmt` lagi.
function pFmtAPA(p){
  var pf=parseFloat(p);
  if(!isFinite(pf)) return p;
  if(pf<.001) return '< .001';
  return '= '+p;
}

function buildAPATable(o){
  // Returns plain-text APA table string siap paste ke Word
  var lines=[];
  var sep=function(len){return '-'.repeat(len||60);};
  var col=function(val,w,align){
    val=String(val??'—');
    if(align==='right') return val.padStart(w);
    if(align==='center'){var pad=Math.max(0,w-val.length);return ' '.repeat(Math.floor(pad/2))+val+' '.repeat(Math.ceil(pad/2));}
    return val.padEnd(w);
  };

  // Helper: render plain-text table from headers + rows (array of arrays)
  function txtTable(headers,rows){
    var widths=headers.map(function(h,i){
      return Math.max(h.length,Math.max.apply(null,rows.map(function(r){return String(r[i]??'—').length;})));
    });
    var line='  '+headers.map(function(h,i){return col(h,widths[i]);}).join('  ');
    var rule='  '+widths.map(function(w){return '-'.repeat(w);}).join('  ');
    var out=[line,rule];
    rows.forEach(function(r){out.push('  '+r.map(function(c,i){return col(c,widths[i]);}).join('  '));});
    return out.join('\n');
  }

  var title=o.title;
  lines.push('');
  lines.push('Table. '+title);
  lines.push(sep(title.length+7));

  if(o.type==='ttest'){
    var r=o.res;
    lines.push('Independent Samples T-Test');
    lines.push('');
    lines.push(txtTable(
      ['','Group A ('+o.ga+')','Group B ('+o.gb+')'],
      [['N',r.nA,r.nB],['M',r.meanA,r.meanB],['SD',r.sdA,r.sdB]]
    ));
    lines.push('');
    lines.push(txtTable(
      ['Statistic','Value'],
      [
        ['t('+r.df+')',r.t+sigStar(r.p)],
        ['p',pFmtAPA(r.p)],
        ["Cohen's d",r.cohensD+' ('+r.dInterp+')'],
        ['95% CI',r.ci95],
      ]
    ));
    lines.push('');
    lines.push('  Note. '+sigStar(r.p)+' = significant. * p < .05. ** p < .01. *** p < .001.');
    if(o.lev) lines.push('  Levene\'s test for equality of variances: F = '+o.lev.F+', p '+pFmtAPA(o.lev.p_fmt)+'.');
  }

  else if(o.type==='paired'){
    var r=o.res;
    lines.push('Paired Samples T-Test');
    lines.push('');
    lines.push(txtTable(
      ['Variable','M','SD','N'],
      [[o.varA,'—','—',r.n],[o.varB,'—','—',r.n]]
    ));
    lines.push('');
    lines.push(txtTable(
      ['Statistic','Value'],
      [
        ['Mean Difference',r.meanDiff],
        ['SD Difference',r.sdDiff],
        ['t('+r.df+')',r.t+sigStar(r.p)],
        ['p',pFmtAPA(r.p)],
        ["Cohen's dz",r.cohensD+' ('+r.dInterp+')'],
        ['95% CI',r.ci95],
      ]
    ));
    lines.push('');
    lines.push('  Note. * p < .05. ** p < .01. *** p < .001.');
  }

  else if(o.type==='onesamp'){
    var r=o.res;
    lines.push('One-Sample T-Test');
    lines.push('');
    lines.push(txtTable(
      ['Parameter','Value'],
      [
        ['Variable',o.field],
        ['Test Value (μ₀)',String(o.mu0)],
        ['N',r.n],
        ['M (x̄)',r.mean],
        ['SD',r.sd],
        ['SE',r.se],
        ['Mean Difference',r.meanDiff],
        ['95% CI of Diff',r.ciDiff],
        ['t('+r.df+')',r.t+sigStar(r.p)],
        ['p',pFmtAPA(r.p)],
        ["Cohen's d",r.cohensD+' ('+r.dInterp+')'],
      ]
    ));
    lines.push('');
    lines.push('  Note. * p < .05. ** p < .01. *** p < .001.');
  }

  else if(o.type==='anova'){
    var r=o.res;
    lines.push('One-Way ANOVA');
    lines.push('');
    lines.push(txtTable(
      ['Source','df','SS','MS','F','p','η²'],
      [
        ['Between',r.dfB,r.ssB,r.msB,r.F+sigStar(r.p),pFmtAPA(r.p),r.eta2],
        ['Within',r.dfW,r.ssW,r.msW,'','',''],
        ['Total',r.dfB+r.dfW,'','','','',''],
      ]
    ));
    lines.push('');
    // Group means table
    if(r.groupStats&&r.groupStats.length){
      lines.push(txtTable(
        ['Group','N','M','SD'],
        r.groupStats.map(function(g){return[g.label,g.n,g.mean,g.sd];})
      ));
    }
    lines.push('');
    lines.push('  Note. η² = '+r.eta2+' ('+r.eta2Interp+'). * p < .05. ** p < .01. *** p < .001.');
    if(o.posthoc){
      lines.push('');
      var phLabel={'tukey':'Tukey HSD','bonferroni':'Bonferroni','lsd':'LSD Fisher','holm':'Holm-Bonferroni'}[o.posthocMethod]||'Post-hoc';
      lines.push('  '+phLabel+' Post-hoc Comparisons:');
      o.posthoc.forEach(function(ph){
        lines.push('    '+ph.a+' vs '+ph.b+': diff = '+ph.diff+', p '+pFmtAPA(ph.p_fmt||ph.p)+' '+sigStar(ph.p_fmt||ph.p));
      });
    }
  }

  else if(o.type==='correlation'){
    var r=o.res;
    var ctype=o.crType==='spearman'?'Spearman':'Pearson';
    lines.push(ctype+' Correlation');
    lines.push('');
    lines.push(txtTable(
      ['Variables','r','r²','p','95% CI'],
      [[o.crX+' × '+o.crY, r.r+sigStar(r.p), r.r2, pFmtAPA(r.p), r.ci95]]
    ));
    lines.push('');
    lines.push('  Note. '+r.strength+' '+r.direction+' relationship.');
    lines.push('  * p < .05. ** p < .01. *** p < .001.');
  }

  else if(o.type==='partialCorr'){
    var r=o.res;
    lines.push('Partial Correlation');
    lines.push('');
    lines.push(txtTable(
      ['','r','r²','p','95% CI'],
      [
        [o.pcX+' × '+o.pcY+' (zero-order)',r.rxy,'—','—','—'],
        [o.pcX+' × '+o.pcY+' (partial)',r.rp+sigStar(r.p),r.r2,pFmtAPA(r.p),r.ci95],
      ]
    ));
    lines.push('');
    lines.push('  Note. Controlling for '+o.pcZ+'. * p < .05. ** p < .01. *** p < .001.');
  }

  else if(o.type==='canonicalCorr'){
    var r=o.res;
    lines.push('Canonical Correlation Analysis');
    lines.push('  Set X: '+o.xNames.join(', '));
    lines.push('  Set Y: '+o.yNames.join(', '));
    lines.push('  n = '+r.n+'   Functions = '+r.nRoots);
    lines.push('');
    lines.push('Significance Tests (Wilks\' Lambda):');
    lines.push(txtTable(
      ['Fungsi','Rc','Rc²','Wilks λ','χ²','df','p','Sig'],
      r.tests.map(function(t){return[t.root,t.rc,t.rc2,t.wilks,t.chiSq,t.df,pFmtAPA(t.p_fmt),sigStar(t.p)];})
    ));
    lines.push('');
    lines.push('Structure Coefficients — Set X:');
    var xCols2=['Variable'].concat(r.tests.map(function(t){return'Fn'+t.root;}));
    lines.push(txtTable(xCols2, r.xLoadings.map(function(v){return[v.name].concat(v.loadings);})));
    lines.push('');
    lines.push('Structure Coefficients — Set Y:');
    var yCols2=['Variable'].concat(r.tests.map(function(t){return'Fn'+t.root;}));
    lines.push(txtTable(yCols2, r.yLoadings.map(function(v){return[v.name].concat(v.loadings);})));
    lines.push('');
    lines.push('  Note. Rc = canonical correlation. Structure coefficients ≥ |.30| considered meaningful.');
    lines.push('  * p < .05. ** p < .01. *** p < .001.');
  }

  else if(o.type==='regression'){
    var r=o.res;
    lines.push('Simple Linear Regression');
    lines.push('');
    lines.push(txtTable(
      ['','B','SE','t','p','Sig'],
      [
        ['Constant',r.b0,r.SEb0,r.tb0,pFmtAPA(r.pb0_fmt),sigStar(r.pb0_fmt)],
        [o.xF+' (b₁)',r.b1,r.SEb1,r.tb1,pFmtAPA(r.pb1_fmt),sigStar(r.pb1_fmt)],
      ]
    ));
    lines.push('');
    lines.push(txtTable(
      ['Model Fit','Value'],
      [['R²',r.R2],['Adj R²',r.R2adj],['F',r.F],['p',pFmtAPA(r.pF_fmt)],['RMSE',r.RMSE]]
    ));
    lines.push('');
    lines.push('  Equation: Ŷ = '+r.b0+' + '+r.b1+' · '+o.xF);
    lines.push('  * p < .05. ** p < .01. *** p < .001.');
  }

  else if(o.type==='multipleReg'){
    var r=o.res;
    lines.push('Multiple Linear Regression');
    lines.push('Dependent Variable: '+o.yName);
    lines.push('');
    var predRows=[['Constant',r.b0,r.SEb0||'—',r.t0||'—',pFmtAPA(r.p0_fmt||'1'),sigStar(r.p0_fmt||'1')]];
    if(r.predictors) r.predictors.forEach(function(pr){
      predRows.push([pr.name,pr.b,pr.se,pr.t,pFmtAPA(pr.p_fmt),sigStar(pr.p_fmt)]);
    });
    lines.push(txtTable(['Predictor','B','SE','t','p','Sig'],predRows));
    lines.push('');
    lines.push(txtTable(
      ['Model Fit','Value'],
      [['R²',r.R2],['Adj R²',r.R2adj],['F',r.F],['p',pFmtAPA(r.pF_fmt)]]
    ));
    lines.push('');
    lines.push('  * p < .05. ** p < .01. *** p < .001.');
  }

  else if(o.type==='descriptive'){
    var s=o.stats;
    lines.push('Descriptive Statistics: '+o.field);
    lines.push('');
    lines.push(txtTable(
      ['Statistic','Value'],
      [
        ['N',s.n],['Mean',s.mean],['Median',s.median],['SD',s.sd],
        ['Variance',s.variance],['Min',s.min],['Max',s.max],
        ['Range',s.range],['Skewness',s.skewness],['Kurtosis',s.kurtosis],
        ['SE Mean',s.seMean],['95% CI','['+s.ci95l+', '+s.ci95u+']'],
        ['Shapiro-Wilk W',s.shapiroW],['Shapiro-Wilk p',pFmtAPA(s.shapiroP)],
      ].filter(function(row){return row[1]!==undefined&&row[1]!==null;})
    ));
  }

  else if(o.type==='mannwhitney'){
    var r=o.res;
    lines.push('Mann-Whitney U Test');
    lines.push('');
    lines.push(txtTable(
      ['','Group A ('+o.ga+')','Group B ('+o.gb+')'],
      [['Median',r.medA,r.medB],['N',r.nA,r.nB]]
    ));
    lines.push('');
    lines.push(txtTable(
      ['Statistic','Value'],
      [['U',r.U],['z',r.z],['p',pFmtAPA(r.p_fmt)],['r (effect)',r.r_eff]]
    ));
    lines.push('');
    lines.push('  Note. * p < .05. ** p < .01. *** p < .001.');
  }

  else if(o.type==='kruskal'){
    var r=o.res;
    lines.push('Kruskal-Wallis H Test');
    lines.push('');
    lines.push(txtTable(
      ['Group','N','Median','M'],
      r.groupStats.map(function(g){return[g.label,g.n,g.median,g.mean];})
    ));
    lines.push('');
    lines.push(txtTable(
      ['Statistic','Value'],
      [['H',r.H],['df',r.df],['p',pFmtAPA(r.p_fmt)]]
    ));
    lines.push('');
    lines.push('  Note. * p < .05. ** p < .01. *** p < .001.');
  }

  else if(o.type==='alpha'){
    var r=o.res;
    lines.push('Reliability Analysis (Cronbach\'s Alpha)');
    lines.push('');
    lines.push(txtTable(
      ['Statistic','Value'],
      [['Cronbach\'s α',r.alpha],['Items (k)',r.k],['Cases (n)',r.n],['Interpretation',r.interp]]
    ));
    lines.push('');
    lines.push('  Items: '+o.vars.join(', '));
  }
  else if(o.type==='kappa'){
    var r=o.res;
    lines.push("Inter-Rater Reliability — Cohen's Kappa");
    lines.push('');
    lines.push(txtTable(
      ['Statistic','Value'],
      [["Cohen's κ",r.kappa],['SE',r.seK],['z',r.z],['p',r.pFmt],
       ['95% CI','['+r.ci95lo+', '+r.ci95hi+']'],
       ['Observed Agreement (Po)',r.po],['Expected Agreement (Pe)',r.pe],
       ['Cases (n)',r.n],['Categories (k)',r.k],['Interpretation',r.interp]]
    ));
    if(o.weighted&&r.wKappa!==null){
      lines.push('');
      lines.push('  Weighted κ = '+r.wKappa+' ('+r.interpW+')');
    }
    lines.push('');
    lines.push('  Rater 1: '+o.vars[0]+'   Rater 2: '+o.vars[1]);
  }

  else if(o.type==='glm'){
    var r=o.res;
    lines.push('General Linear Model (Univariate)');
    lines.push('Dependent Variable: '+o.depVar);
    lines.push('');
    if(r&&r.effects){
      lines.push(txtTable(
        ['Source','df','SS','MS','F','p','Partial η²'],
        r.effects.map(function(e){
          return[e.source+(e.isCov?' (cov)':''),e.df,e.SS||'—',e.MS||'—',
            (e.F||'—')+sigStar(e.p_fmt),pFmtAPA(e.p_fmt),e.partialEta2||'—'];
        }).concat([['Error',r.dfError,r.ssError,r.msError,'','','']])
      ));
      lines.push('');
      lines.push(txtTable(['Model Fit','Value'],[['R²',r.R2],['Adj R²',r.R2adj],['N',r.n]]));
    }
    lines.push('');
    lines.push('  Note. * p < .05. ** p < .01. *** p < .001.');
  }

  else if(o.type==='manova'){
    var r=o.res;
    lines.push('MANOVA — Multivariate Analysis of Variance');
    if(r){
      lines.push('Dependent Variables: '+r.depVars.join(', '));
      lines.push('Factor: '+r.factor+' ('+r.g+' groups) · N = '+r.n);
      lines.push('');
      lines.push('Multivariate Tests (Effect: '+r.factor+')');
      lines.push(txtTable(
        ['Test','Value','F','df1','df2','p'],
        [
          ['Pillai\'s Trace',    r.pillai.stat,    r.pillai.F,    r.pillai.df1,    r.pillai.df2,    r.pillai.p_fmt],
          ['Wilks\' Lambda',     r.wilks.stat,     r.wilks.F,     r.wilks.df1,     r.wilks.df2,     r.wilks.p_fmt],
          ['Hotelling-Lawley',   r.hotelling.stat, r.hotelling.F, r.hotelling.df1, r.hotelling.df2, r.hotelling.p_fmt],
          ['Roy\'s Greatest Root',r.roy.stat,      r.roy.F,       r.roy.df1,       r.roy.df2,       r.roy.p_fmt],
        ]
      ));
      lines.push('');
      lines.push('Partial η² (Pillai) = '+r.pillaiEta2+' · Box\'s M p = '+r.boxP);
      lines.push('');
      lines.push('Univariate Follow-up ANOVAs (Bonferroni α = '+SE.f4(0.05/r.p)+')');
      if(r.univariate){
        r.univariate.forEach(function(item){
          var ures=item.res;
          lines.push('  DV: '+item.dv);
          if(ures&&!ures._err&&ures.effects){
            lines.push(txtTable(
              ['Source','df','SS','MS','F','p','η²'],
              ures.effects.map(function(e){
                return[e.source,e.df,e.SS||'—',e.MS||'—',(e.F||'—')+sigStar(e.p_fmt),pFmtAPA(e.p_fmt),e.eta2||'—'];
              }).concat([['Error',ures.dfError,ures.ssError,ures.msError,'','','']])
            ));
          }
          lines.push('');
        });
      }
      lines.push('  Note. * p < .05. ** p < .01. *** p < .001.');
      lines.push('  Recommended primary test: Pillai\'s Trace (most robust).');
    }
  }

  else if(o.type==='efa'){
    var r=o.res;
    lines.push('Exploratory Factor Analysis');
    lines.push('Rotation: '+r.rotation+' · Factors: '+r.nFactors+' · N = '+r.n);
    lines.push('');
    // KMO + Bartlett
    lines.push(txtTable(
      ['Adequacy Check','Value'],
      [['KMO',r.kmo+' ('+r.kmoInterp+')'],['Bartlett χ²',r.chi2],['df',r.bartDf],['p',pFmtAPA(r.bartP)]]
    ));
    lines.push('');
    // Factor loadings
    var fHeaders=['Variable'].concat(
      Array.from({length:r.nFactors},function(_,i){return 'F'+(i+1);}),['h²']
    );
    var fRows=o.efaVars.map(function(v,i){
      return [v].concat(r.loadings[i]).concat([r.communalities[i]]);
    });
    lines.push(txtTable(fHeaders,fRows));
    lines.push('');
    // Eigenvalues
    lines.push(txtTable(
      ['Factor','Eigenvalue','% Var','Cum %'],
      r.eigenvalues.map(function(ev,i){
        return['F'+(i+1),ev,r.varExp[i]+'%',r.cumVar[i]+'%'];
      })
    ));
    lines.push('');
    lines.push('  Note. Loadings |≥ .40| considered significant. h² = communality.');
  }

  else if(o.type==='mediation'){
    var r=o.res;
    var bk=r.barronKenny;
    lines.push('Mediation Analysis');
    lines.push('X: '+r.xName+' · M: ['+r.mNames.join(', ')+'] · Y: '+r.yName+' · N = '+r.n);
    lines.push('');
    lines.push(txtTable(
      ['Step','Path','Coef (β)','p','Result'],
      [
        ['Step 1 (c)',r.xName+' → '+r.yName,bk.c,pFmtAPA(parseFloat(bk.p_c)),parseFloat(bk.p_c)<0.05?'Sig*':'n.s.'],
        ['Step 2 (a)',r.xName+' → '+r.mNames[0],bk.a,pFmtAPA(parseFloat(bk.p_a)),parseFloat(bk.p_a)<0.05?'Sig*':'n.s.'],
        ['Step 3 (b)',r.mNames[0]+' → '+r.yName,bk.b,pFmtAPA(parseFloat(bk.p_b)),parseFloat(bk.p_b)<0.05?'Sig*':'n.s.'],
        ["Step 4 (c')",r.xName+' → '+r.yName+' (direct)',bk.c_prime,pFmtAPA(parseFloat(bk.p_c_prime)),parseFloat(bk.p_c_prime)<0.05?'Sig*':'n.s.'],
      ]
    ));
    lines.push('');
    lines.push('  Mediation Type: '+r.medType);
    lines.push('');
    lines.push('  Indirect Effect(s) — Sobel Test + Bootstrap 95% CI:');
    r.mediators.forEach(function(med,i){
      var boot=r.bootResults&&r.bootResults[i];
      lines.push('    via '+med.name+': Indirect = '+SE.f4(med.indirect)+', Sobel z = '+SE.f4(med.sobel_z)+', p = '+parseFloat(med.sobel_p).toFixed(3)+(boot?', Bootstrap CI ['+boot.lo+', '+boot.hi+']':''));
    });
    lines.push('');
    lines.push('  Note. * p < .05. Bootstrap 95% CI based on '+r.bootResults?.length+' samples.');
    lines.push('  If Bootstrap CI does not include 0, indirect effect is significant.');
  }

  else if(o.type==='hierarchicalReg'&&o.res){
    var hrRes=o.res;
    lines.push('Hierarchical Multiple Regression');
    lines.push('Dependent Variable: '+hrRes.depVar);
    lines.push('');
    // Model Summary table
    lines.push(txtTable(
      ['Block','Predictors','R²','Adj R²','ΔR²','F-change','df1','df2','p (ΔR²)'],
      (hrRes.blocks||[]).map(function(b){
        return['Block '+b.block, b.predictors.join(', '), b.R2, b.R2adj, b.dR2, b.Fchange, b.dfNum, b.dfDen, b.pFchange+sigStar(b.pFchange)];
      })
    ));
    lines.push('');
    // Coefficient tables
    (hrRes.blocks||[]).forEach(function(b){
      lines.push('Block '+b.block+' Coefficients (Cumulative: '+b.cumulativePredictors.join(', ')+')');
      lines.push(txtTable(
        ['Variable','B','SE','β','t','p'],
        (b.coefs||[]).map(function(c){return[c.name,c.B,c.SE,c.beta||'—',c.t,pFmtAPA(c.p_fmt)+sigStar(c.p_fmt)];})
      ));
      lines.push('');
    });
    lines.push('  Note. * p < .05. ** p < .01. *** p < .001.');
    lines.push('  ΔR² = change in R² for each block; F-change tests significance of ΔR².');
  }

  else if(o.type==='discriminant'&&o.res){
    var r=o.res;
    lines.push('Linear Discriminant Analysis');
    lines.push('Grouping Variable: '+o.groupVar+' · Predictors: '+o.predVars.join(', ')+' · N = '+r.n);
    lines.push('');
    lines.push('  Wilks\' Λ = '+r.wilksLambda+'  p = '+r.wilksP+'  Overall Accuracy = '+r.accuracy+'%');
    lines.push('');
    lines.push(txtTable(
      ['Function','Eigenvalue','% Variance','Cumulative %','Canonical r'],
      r.eigenvalues.map(function(e,i){return['Function '+(i+1),e.eigenvalue,e.pctVar+'%',e.cumPct+'%',e.canonicalR];})
    ));
    lines.push('');
    lines.push('Standardized Coefficients');
    var scHeader=['Predictor'].concat(r.eigenvalues.map(function(_,i){return 'Function '+(i+1);}));
    lines.push(txtTable(scHeader, r.preds.map(function(p,pi){return [p].concat(r.stdCoefs.map(function(fc){return fc[pi];}));})));
    lines.push('');
    lines.push('Classification Results — Overall Accuracy: '+r.accuracy+'%');
    lines.push('');
    lines.push('  Note. Standardized coefficients used for interpretation. Accuracy = % correctly classified.');
  }

  else if(o.type==='cluster'&&o.res){
    var r=o.res;
    var method=r.method==='kmeans'?'K-Means':'Hierarchical ('+r.linkage+')';
    lines.push(method+' Cluster Analysis');
    lines.push('Variables: '+r.vars.join(', ')+' · k = '+r.k+' · N = '+r.n);
    lines.push('');
    lines.push('  Silhouette = '+r.silhouette+(r.silhouette>=0.5?' (Reasonable-Strong structure)':r.silhouette>=0.25?' (Weak structure)':' (Poor structure)'));
    if(r.method==='kmeans') lines.push('  Total WSS = '+r.totalWSS+' · Between-SS = '+r.totalBSS);
    lines.push('');
    lines.push('Cluster Sizes & Centroids (raw means)');
    var cHeader=['Cluster','N','%'].concat(r.vars);
    lines.push(txtTable(cHeader, r.clusters.map(function(c){return [c.label,c.n,c.pct+'%'].concat(c.rawMeans);})));
    lines.push('');
    lines.push('ANOVA per Variable');
    lines.push(txtTable(['Variable','F','df1','df2','p'],r.anova.map(function(a){return [a.variable,a.F,a.df1,a.df2,a.p_fmt+(parseFloat(a.p)<0.05?'*':'')];})));
    lines.push('');
    lines.push('  Note. * p < .05. Variables are z-standardized before clustering. Silhouette ≥ .50 = reasonable structure.');
  }

  else {
    // Fallback: generic key-value
    lines.push('(No APA table template for this analysis type.)');
    lines.push('Title: '+o.title);
  }

  lines.push('');
  lines.push(sep(60));
  lines.push('Generated by OSS — Orias Statistik System · '+new Date().toLocaleDateString());
  lines.push('');
  return lines.join('\n');
}

function copyAPA(id,btn){
  var o=outputs.find(function(x){return x.id===id;});
  if(!o){showToast('Output not found','error');return;}
  var text=buildAPATable(o);
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(function(){
      btn.textContent='Copied!';
      btn.classList.add('copied');
      setTimeout(function(){btn.textContent='Copy APA';btn.classList.remove('copied');},2200);
      showToast('APA berhasil disalin');
    }).catch(function(){fallbackCopy(text,btn);});
  } else {
    fallbackCopy(text,btn);
  }
}

function fallbackCopy(text,btn){
  // Fallback for browsers without clipboard API
  var ta=document.createElement('textarea');
  ta.value=text;
  ta.style.cssText='position:fixed;top:-9999px;left:-9999px;opacity:0';
  document.body.appendChild(ta);
  ta.focus();ta.select();
  try{
    document.execCommand('copy');
    if(btn){btn.textContent='Copied!';btn.classList.add('copied');setTimeout(function(){btn.textContent='Copy APA';btn.classList.remove('copied');},2200);}
    showToast('APA berhasil disalin');
  }catch(e){
    showToast('Copy gagal — coba manual select teks','error');
  }
  document.body.removeChild(ta);
}

function removeOutput(id){outputs=outputs.filter(o=>o.id!==id);updateBadges();renderTab('output');}

// ════════════════════════════════════════════════════════════════════════
// AI VIEW
// ════════════════════════════════════════════════════════════════════════
var aiHistory=[];
function renderAI(el){
  let html='<div class="card">';
  html+='<div class="sec-hd">AI Statistical Advisor <span class="tag tag-purple" style="margin-left:auto;font-size:9px">Claude-powered</span></div>';
  html+='<div style="font-size:11.5px;color:#475569;margin-bottom:10px">Test selection · Assumption checking · Interpretation</div>';
  html+='<div class="quick-prompts">';
  ['Which test should I use?','Check T-Test assumptions','When nonparametric?','Interpret α=0.72','Handle missing data?','What does R²=0.65 mean?','Effect size guide','Pearson vs Spearman?'].forEach(q=>{
    html+='<button class="qp" onclick="setAIMsg(this.textContent)">'+q+'</button>';
  });
  html+='</div>';
  html+='<div class="chat-wrap" id="chat-wrap">';
  aiHistory.forEach(m=>{
    if(m.role==='user')html+='<div style="display:flex;justify-content:flex-end"><div class="bubble bubble-user">'+escHtml(m.content)+'</div></div>';
    else html+='<div style="display:flex;justify-content:flex-start"><div class="bubble bubble-ai"><div class="bubble-ai-label">OSS AI</div>'+escHtml(m.content)+'</div></div>';
  });
  html+='<div id="typing" style="display:none"><div style="display:flex;justify-content:flex-start"><div class="bubble bubble-ai" style="padding:10px 14px"><div style="display:flex;gap:5px"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div></div></div>';
  html+='</div>';
  html+='<div class="row" style="gap:7px">';
  html+='<input class="inp" id="ai-inp" style="flex:1" placeholder="Ask a statistical question…" onkeydown="if(event.key===\'Enter\'&&!event.shiftKey)sendAI()"/>';
  html+='<button class="btn btn-purple btn-sm" id="ai-btn" onclick="sendAI()">✦ Ask</button>';
  if(aiHistory.length)html+='<button class="btn btn-ghost btn-sm" onclick="aiHistory=[];renderTab(\'ai\')">Clear</button>';
  html+='</div></div>';
  el.innerHTML=html;
  const chat=document.getElementById('chat-wrap');if(chat)chat.scrollTop=chat.scrollHeight;
}
function setAIMsg(q){const inp=document.getElementById('ai-inp');if(inp)inp.value=q;}
function escHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
async function sendAI(){
  const inp=document.getElementById('ai-inp');const msg=inp?inp.value.trim():'';if(!msg)return;
  if(inp)inp.value='';
  const btn=document.getElementById('ai-btn');if(btn){btn.disabled=true;btn.textContent='…';}
  const typing=document.getElementById('typing');if(typing)typing.style.display='block';
  const chat=document.getElementById('chat-wrap');if(chat)chat.scrollTop=chat.scrollHeight;
  aiHistory.push({role:'user',content:msg});
  const varStr=vars.map(v=>v.name+'('+v.type+','+v.measure+')').join(', ');
  const mc=missCount().filter(m=>m.count>0).map(m=>m.name+':'+m.count).join(', ')||'none';
  const system='You are OSS AI, a statistical analysis assistant. Dataset: '+data.length+' cases. Variables: '+varStr+'. Missing: '+mc+'.\nBe concise (max 3 paragraphs), technically accurate, mention assumptions when relevant.';
  try{
    const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,system,messages:aiHistory.map(m=>({role:m.role,content:m.content}))})});
    const json=await res.json();
    const reply=json.content?.map(c=>c.text||'').join('')||'Error connecting.';
    aiHistory.push({role:'assistant',content:reply});
  }catch(e){aiHistory.push({role:'assistant',content:'Connection error. Please try again.'});}
  renderTab('ai');
}

// ✅ TEMUAN H1/H2 DIPERBAIKI (2026-09-15): blok lama saveSession/
// loadSession/setInterval-autosave/exportDataCSV/generateAPAReport
// (versi single-dataset lama, `data`/`vars` langsung) yang tadinya ada
// di sini SUDAH DIHAPUS — seluruhnya dead code karena selalu ditimpa
// oleh deklarasi kedua (versi multi-dataset-aware, `datasets[]` +
// `_dsSyncSave`/`_dsSyncLoad`) di bawah. Function declaration dengan
// nama sama di scope yang sama: yang terakhir di-parse yang menang saat
// runtime, jadi blok lama ini tidak pernah benar-benar jalan — kecuali
// `setInterval(...)`-nya (bukan named function, jadi tidak ikut
// ditimpa) yang tadinya tetap jalan tiap 30 detik menulis format lama
// ke localStorage['oss_auto'], langsung ditimpa lagi oleh interval
// autosave versi baru. Tidak ada perubahan perilaku bagi user — versi
// aktif (multi-dataset) tetap sama persis seperti sebelumnya, cuma
// bagian mati/mubazir yang dibuang. Lihat definisi aktifnya di bawah.



// ════════════════════════════════════════════════════════════
// CMD PALETTE
// ════════════════════════════════════════════════════════════
var cmdOpen=false,cmdSelIdx=0;

function openCmd(){
  cmdOpen=true;
  var ov=document.getElementById('cmd-ov');
  if(ov){
    ov.classList.add('open');
    renderCmdResults('');
    // Only auto-focus on desktop — on mobile it would pop the keyboard immediately
    var inp=document.getElementById('cmd-inp');
    if(inp&&!/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)){
      inp.focus();
    } else if(inp) {
      inp.blur();
    }
  }
}
function closeCmd(){
  cmdOpen=false;
  var ov=document.getElementById('cmd-ov');
  if(ov)ov.classList.remove('open');
}

var CMD_ACTIONS=[
  // ── Navigation ──
  {label:'Data View',fn:function(){switchTab('data');}},
  {label:'Variable View',fn:function(){switchTab('variable');}},
  {label:'Syntax Editor',fn:function(){switchTab('syntax');}},
  {label:'Pivot Table',fn:function(){switchTab('pivot');}},
  {label:'AI Advisor',fn:function(){switchTab('ai');}},
  {label:'Output',fn:function(){switchTab('output');}},

  // ── Descriptive ──
  {label:'Descriptive Statistics',fn:function(){openAnalyze('descriptive');}},

  // ── T-Test ──
  {label:'Independent Samples T-Test',fn:function(){openAnalyze('ttest');}},
  {label:'One-Sample T-Test',fn:function(){openAnalyze('onesamp');}},
  {label:'Paired Samples T-Test',fn:function(){openAnalyze('paired');}},

  // ── ANOVA ──
  {label:'One-Way ANOVA',fn:function(){openAnalyze('anova');}},
  {label:'Two-Way ANOVA',fn:function(){openAnalyze('anova2');}},
  {label:'Three-Way ANOVA',fn:function(){openAnalyze('anova3');}},
  {label:'Repeated Measures ANOVA (RM-ANOVA)',fn:function(){openAnalyze('rmanova');}},

  // ── Correlation ──
  {label:'Pearson / Spearman Correlation',fn:function(){openAnalyze('correlation');}},
  {label:'Canonical Correlation',fn:function(){openAnalyze('canonicalcorr');}},
  {label:'Correlation Matrix',fn:function(){openAnalyze('corrmatrix');}},
  {label:'Partial Correlation',fn:function(){openAnalyze('partialcorr');}},

  // ── Regression ──
  {label:'Simple Linear Regression',fn:function(){openAnalyze('regression');}},
  {label:'Multiple Regression',fn:function(){openAnalyze('multipleReg');}},
  {label:'Hierarchical Regression (Block 1, Block 2, ΔR²)',fn:function(){openAnalyze('hierarchicalReg');}},
  {label:'Logistic Regression (Binary & Multinomial)',fn:function(){openAnalyze('logistic');}},

  // ── Nonparametric ──
  {label:'Nonparametric Tests',fn:function(){openAnalyze('nonparam');}},

  // ── GLM ──
  {label:'General Linear Model — Univariate (GLM)',fn:function(){openAnalyze('glm','glm');}},
  {label:'General Linear Model — Multivariate (GLM)',fn:function(){openAnalyze('glm-multi','glm');}},
  {label:'General Linear Model — Repeated Measures (GLM)',fn:function(){openAnalyze('glm-rep','glm');}},

  // ── HLM / Multilevel ──
  {label:'Multilevel Model — Two-Level (HLM)',fn:function(){openAnalyze('hlm-2level','hlm');}},
  {label:'Multilevel Model — Three-Level (HLM)',fn:function(){openAnalyze('hlm-3level','hlm');}},
  {label:'ICC & Variance Components (HLM)',fn:function(){openAnalyze('hlm-icc','hlm');}},

  // ── Reliability ──
  {label:'Reliability Analysis / Cronbach Alpha',fn:function(){openAnalyze('reliability');}},
  {label:"Cohen's Kappa (Inter-Rater Reliability)",fn:function(){openAnalyze('kappa','reliability');}},

  // ── Crosstab ──
  {label:'Crosstab / Chi-Square',fn:function(){openAnalyze('crosstab');}},

  // ── Factor Analysis ──
  {label:'Exploratory Factor Analysis (EFA)',fn:function(){openAnalyze('efa','factor');}},
  {label:'Confirmatory Factor Analysis (CFA) — Fit Indices',fn:function(){openAnalyze('cfa','factor');}},

  // ── SEM ──
  {label:'Structural Equation Modeling (SEM)',fn:function(){openAnalyze('sem','sem');}},

  // ── Mediation ──
  {label:'Mediation Analysis (Sobel / Bootstrap)',fn:function(){openAnalyze('mediation');}},

  // ── Moderation ──
  {label:'Moderation Analysis (Interaction)',fn:function(){openAnalyze('moderation');}},
  {label:'Simple Slopes Analysis',fn:function(){openAnalyze('simpleslopes','moderation');}},
  {label:'Johnson-Neyman Technique',fn:function(){openAnalyze('jn','moderation');}},

  // ── Discriminant & Cluster ──
  {label:'Discriminant Analysis (LDA)',fn:function(){openAnalyze('discriminant');}},
  {label:'Cluster Analysis (K-Means & Hierarchical)',fn:function(){openAnalyze('cluster');}},

  // ── Missing Data ──
  {label:"Missing Data Analysis (Little's MCAR + Pattern Matrix)",fn:function(){openAnalyze('missinganalysis');}},

  // ── Power Analysis ──
  {label:'Power Analysis',fn:function(){openAnalyze('poweranalysis');}},
  {label:'Power Curves',fn:function(){openAnalyze('powerplot','poweranalysis');}},
  {label:'Sensitivity Analysis (Power)',fn:function(){openAnalyze('sensitivity','poweranalysis');}},

  // ── Bayesian ──
  {label:'Bayesian Factor — T-Test',fn:function(){openAnalyze('bayesian');}},
  {label:'Bayesian Factor — Correlation',fn:function(){openAnalyze('bayesian_corr','bayesian');}},
  {label:'Bayesian Posterior Distribution',fn:function(){openAnalyze('bayesian_posterior','bayesian');}},

  // ── ROC ──
  {label:'ROC Curve Analysis',fn:function(){openAnalyze('roc');}},
  {label:'Compare ROC Curves',fn:function(){openAnalyze('roc_compare','roc');}},

  // ── Survival ──
  {label:'Survival Analysis',fn:function(){openAnalyze('survival');}},
  {label:'Kaplan-Meier (KM) Survival',fn:function(){openAnalyze('km','survival');}},
  {label:'Log-Rank Test',fn:function(){openAnalyze('logrank','survival');}},
  {label:'Cox Proportional Hazards Regression',fn:function(){openAnalyze('cox','survival');}},

  // ── Time Series ──
  {label:'ARIMA & Time Series Decomposition',fn:function(){openAnalyze('timeseries');}},

  // ── Meta-Analysis ──
  {label:'Meta-Analysis (Forest Plot)',fn:function(){openAnalyze('metaanalysis');}},

  // ── Charts ──
  {label:'Charts & Visualizations',fn:function(){openAnalyze('charts');}},

  // ── Transform / Data Tools ──
  {label:'Transform Variable (Compute)',fn:function(){openAnalyze('transform');}},
  {label:'Recode Variable',fn:function(){openAnalyze('recode');}},
  {label:'Filter Cases',fn:function(){openAnalyze('filter');}},
  {label:'Weight Cases (Frequency Weighting)',fn:function(){openAnalyze('weightcases','weightcases');}},
  {label:'Single Imputation',fn:function(){openAnalyze('impute','imputation');}},
  {label:'Multiple Imputation (MI)',fn:function(){openAnalyze('mi','imputation');}},

  // ── Session / Export ──
  {label:'Save Session',fn:function(){saveSession();}},
  {label:'Import CSV',fn:function(){document.getElementById('csv-input').click();}},
  {label:'Export CSV',fn:function(){exportDataCSV();}},
  {label:'Export to Excel (.xlsx)',fn:function(){exportToExcel();}},
  {label:'Export to Word (.doc)',fn:function(){exportWordDialog();}},
  {label:'APA Report (text)',fn:function(){generateAPAReport();}},
  {label:'New Dataset',fn:function(){showAddDatasetModal();}},
];

function renderCmdResults(q){
  var list=document.getElementById('cmd-list');if(!list)return;
  var items=q?CMD_ACTIONS.filter(function(a){return a.label.toLowerCase().includes(q.toLowerCase());}):CMD_ACTIONS;
  list.innerHTML=items.map(function(a,i){
    return '<div class="cmd-item" data-i="'+i+'" data-q="'+encodeURIComponent(q)+'" onclick="execCmdEl(this)">'+a.label+'</div>';
  }).join('');
  cmdSelIdx=0;
  var first=list.querySelector('.cmd-item');
  if(first)first.classList.add('active');
}
function execCmdEl(el){
  var i=parseInt(el.dataset.i),q=decodeURIComponent(el.dataset.q||'');
  var items=q?CMD_ACTIONS.filter(function(a){return a.label.toLowerCase().includes(q.toLowerCase());}):CMD_ACTIONS;
  if(items[i])items[i].fn();
  closeCmd();
}
function cmdKeyNav(e){
  var items=document.querySelectorAll('.cmd-item');
  if(e.key==='ArrowDown'){cmdSelIdx=Math.min(cmdSelIdx+1,items.length-1);}
  else if(e.key==='ArrowUp'){cmdSelIdx=Math.max(cmdSelIdx-1,0);}
  else if(e.key==='Enter'){var q=document.getElementById('cmd-inp').value||'';if(items[cmdSelIdx])execCmdEl(items[cmdSelIdx]);return;}
  items.forEach(function(el,i){el.classList.toggle('active',i===cmdSelIdx);});
  if(items[cmdSelIdx])items[cmdSelIdx].scrollIntoView({block:'nearest'});
}

// ════════════════════════════════════════════════════════════
// SESSION + EXPORT
// ════════════════════════════════════════════════════════════
function saveSession(){
  try{
    _dsSyncSave(); // push globals → active dataset object
    var snap={datasets:datasets,activeDatasetId:activeDatasetId};
    localStorage.setItem('oss_session',JSON.stringify(snap));
    showToast('Session berhasil disimpan');
  }catch(e){showToast('Save failed','error');}
}
function loadSession(){
  try{
    var raw=localStorage.getItem('oss_session');
    if(!raw)return false;
    var s=JSON.parse(raw);
    // Support both old single-dataset format and new multi-dataset format
    if(s.datasets&&Array.isArray(s.datasets)){
      datasets=s.datasets;
      activeDatasetId=s.activeDatasetId||datasets[0].id;
    } else if(s.data||s.vars){
      // Legacy single-dataset session
      datasets=[{id:1,name:'Dataset 1',data:s.data||[],vars:s.vars||[],outputs:s.outputs||[]}];
      activeDatasetId=1;
    }
    _dsSyncLoad(); // push active dataset → globals
    return true;
  }catch(e){return false;}
}
setInterval(function(){
  try{_dsSyncSave();localStorage.setItem('oss_auto',JSON.stringify({datasets:datasets,activeDatasetId:activeDatasetId}));}catch(e){}
},30000);

function exportDataCSV(){
  var hdr=vars.map(function(v){return '"'+v.name+'"';}).join(',');
  var rows=data.map(function(r){
    return vars.map(function(v){
      var val=r[v.name];
      if(val===null||val===undefined)return '.';
      if(typeof val==='string')return '"'+val.replace(/"/g,'""')+'"';
      return val;
    }).join(',');
  });
  var csv=[hdr].concat(rows).join('\n');
  var blob=new Blob([csv],{type:'text/csv'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;a.download='oss_data.csv';a.click();
  URL.revokeObjectURL(url);
  showToast('CSV berhasil diexport');
}

function generateAPAReport(){
  if(!outputs.length){showToast('No outputs yet','error');return;}
  var txt='OSS Analysis Report\n'+new Date().toLocaleString()+'\n\n';
  outputs.forEach(function(o){
    txt+='## '+o.title+'\n';
    if(o.type==='ttest'&&o.res)
      txt+='t('+o.res.df+')='+o.res.t+', p'+(parseFloat(o.res.p)<.001?'<.001':'='+o.res.p_fmt)+".\n\n";
    else if(o.type==='anova'&&o.res)
      txt+='F('+o.res.dfB+','+o.res.dfW+')='+o.res.F+', p'+(parseFloat(o.res.p)<.001?'<.001':'='+o.res.p_fmt)+'.\n\n';
    else if(o.type==='correlation'&&o.res)
      txt+='r='+o.res.r+', p'+(parseFloat(o.res.p)<.001?'<.001':'='+o.res.p_fmt)+'.\n\n';
  });
  var blob=new Blob([txt],{type:'text/plain'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;a.download='oss_apa.txt';a.click();
  URL.revokeObjectURL(url);
  showToast('Report berhasil diexport');
}

// ════════════════════════════════════════════════════════════
// HIERARCHICAL REGRESSION
// ════════════════════════════════════════════════════════════
function toggleHrBlock(blockIdx, field, checked){
  if(!aState.hrBlocks) aState.hrBlocks=[[],[]];
  while(aState.hrBlocks.length<=blockIdx) aState.hrBlocks.push([]);
  if(checked){
    // Remove from other blocks
    aState.hrBlocks.forEach(function(bl,bi){if(bi!==blockIdx)aState.hrBlocks[bi]=bl.filter(function(v){return v!==field;});});
    if(!aState.hrBlocks[blockIdx].includes(field)) aState.hrBlocks[blockIdx].push(field);
  } else {
    aState.hrBlocks[blockIdx]=aState.hrBlocks[blockIdx].filter(function(v){return v!==field;});
  }
  renderASub();
}

function runHierarchicalReg(){
  runSafe(function(){
    if(!aState.hrY) throw new Error('Select Dependent Variable (Y)');
    if(!aState.hrBlocks||aState.hrBlocks.every(function(b){return !b.length;})) throw new Error('Add predictors to at least one Block');
    
    var blockResults=[];
    var prevR2=0;
    for(var bi=0;bi<aState.hrBlocks.length;bi++){
      var cumXs=[];
      for(var ci=0;ci<=bi;ci++) aState.hrBlocks[ci].forEach(function(v){if(!cumXs.includes(v))cumXs.push(v);});
      if(!cumXs.length) continue;
      var res=SE.multipleReg(cumXs,aState.hrY,data);
      var n=parseInt(res.n||data.length);
      var kNew=aState.hrBlocks[bi].length;
      var kCum=cumXs.length;
      var dR2=parseFloat(res.R2)-prevR2;
      var dfErr=n-kCum-1;
      var Fchange=dfErr>0&&(1-parseFloat(res.R2))>0?(dR2/kNew)/((1-parseFloat(res.R2))/dfErr):0;
      var pFchange=Fchange>0?SE.pFromF(Fchange,kNew,dfErr):1;
      blockResults.push({
        block:bi+1,
        predictors:aState.hrBlocks[bi].slice(),
        cumulativePredictors:cumXs.slice(),
        R2:res.R2, R2adj:res.R2adj,
        F:res.F, pF:res.pF_fmt,
        dR2:SE.f4(dR2),
        Fchange:SE.f4(Fchange),
        pFchange:SE.f4(pFchange),
        dfNum:kNew, dfDen:dfErr,
        coefs:res.coefs,
        vif:res.vif,
        n:n
      });
      prevR2=parseFloat(res.R2);
    }
    
    var title='Hierarchical Reg: '+aState.hrY+' ('+aState.hrBlocks.length+' blocks)';
    addOutput({
      type:'hierarchicalReg',
      title:title,
      res:{blocks:blockResults,depVar:aState.hrY}
    });
  },'Hierarchical Regression');
}

// ════════════════════════════════════════════════════════════
// EXPORT TO EXCEL (SheetJS)
// ════════════════════════════════════════════════════════════
function exportToExcel(){
  if(!outputs.length){showToast('No outputs yet. Run an analysis first.','error');return;}
  
  // Dynamically load SheetJS
  var s=document.createElement('script');
  s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  s.onload=function(){_doExportExcel();};
  s.onerror=function(){showToast('Could not load XLSX library','error');};
  if(window.XLSX){_doExportExcel();}
  else document.head.appendChild(s);
}

function _doExportExcel(){
  var wb=XLSX.utils.book_new();
  
  // Sheet 1: Raw Data
  if(data.length){
    var dataRows=[vars.map(function(v){return v.label||v.name;})];
    data.forEach(function(r){
      dataRows.push(vars.map(function(v){var val=r[v.name];return val===null||val===undefined?'':val;}));
    });
    var wsData=XLSX.utils.aoa_to_sheet(dataRows);
    // Style header row
    var range=XLSX.utils.decode_range(wsData['!ref']);
    for(var c=range.s.c;c<=range.e.c;c++){
      var addr=XLSX.utils.encode_cell({r:0,c:c});
      if(wsData[addr]){wsData[addr].s={font:{bold:true},fill:{fgColor:{rgb:'7C3AED'}}};}
    }
    wsData['!cols']=vars.map(function(){return {wch:14};});
    XLSX.utils.book_append_sheet(wb,wsData,'Data');
  }
  
  // Sheet 2: Analysis Results
  outputs.forEach(function(o,idx){
    var rows=[];
    rows.push(['OSS Analysis Output',new Date(o.id).toLocaleString()]);
    rows.push([o.title]);
    rows.push([]);
    
    if(o.type==='descriptive'&&o.stats){
      rows.push(['Statistic','Value']);
      Object.entries(o.stats).forEach(function(kv){rows.push([kv[0],kv[1]]);});
    }
    else if(o.type==='ttest'&&o.res){
      rows.push(['Statistic','Group A ('+o.ga+')','Group B ('+o.gb+')']);
      rows.push(['N',o.res.nA,o.res.nB]);
      rows.push(['Mean',o.res.meanA,o.res.meanB]);
      rows.push(['SD',o.res.sdA,o.res.sdB]);
      rows.push([]);
      rows.push(['t',o.res.t]);rows.push(['df',o.res.df]);rows.push(['p',o.res.p_fmt]);
      rows.push(["Cohen's d",o.res.cohensD,o.res.dInterp]);
    }
    else if(o.type==='correlation'&&o.res){
      rows.push(['r','p','Strength','Direction','95% CI']);
      rows.push([o.res.r,o.res.p_fmt,o.res.strength,o.res.direction,o.res.ci95]);
    }
    else if((o.type==='regression'||o.type==='multipleReg')&&o.res){
      rows.push(['Model Fit']);
      rows.push(['R²',o.res.R2]);rows.push(['Adj R²',o.res.R2adj]);
      rows.push(['F',o.res.F]);rows.push(['p',o.res.pF_fmt]);
      if(o.res.RMSE) rows.push(['RMSE',o.res.RMSE]);
      rows.push([]);
      rows.push(['Variable','B','SE','β','t','p','VIF']);
      (o.res.coefs||[]).forEach(function(c,ci){
        rows.push([c.name,c.B,c.SE,ci===0?'—':c.beta,c.t,c.p_fmt,ci===0?'—':(o.res.vif?o.res.vif[ci-1]:'—')]);
      });
    }
    else if(o.type==='hierarchicalReg'&&o.res){
      rows.push(['Dependent Variable:',o.res.depVar]);
      rows.push([]);
      rows.push(['Block','Predictors','R²','Adj R²','ΔR²','F-change','df1','df2','p ΔR²']);
      (o.res.blocks||[]).forEach(function(b){
        rows.push([
          'Block '+b.block, b.predictors.join(', '),
          b.R2, b.R2adj, b.dR2, b.Fchange, b.dfNum, b.dfDen, b.pFchange
        ]);
      });
      rows.push([]);
      (o.res.blocks||[]).forEach(function(b){
        rows.push(['Block '+b.block+' Coefficients']);
        rows.push(['Variable','B','SE','β','t','p','VIF']);
        (b.coefs||[]).forEach(function(c,ci){
          rows.push([c.name,c.B,c.SE,ci===0?'—':c.beta,c.t,c.p_fmt,ci===0?'—':(b.vif?b.vif[ci-1]:'—')]);
        });
        rows.push([]);
      });
    }
    else if(o.type==='anova'&&o.res){
      rows.push(['Source','df','SS','MS','F','p','η²']);
      rows.push(['Between',o.res.dfB,o.res.SSB,o.res.MSB,o.res.F,o.res.p_fmt,o.res.eta2]);
      rows.push(['Within',o.res.dfW,o.res.SSW,o.res.MSW,'','','']);
    }
    else if(o.type==='logistic'&&o.res){
      rows.push(['-2LL',o.res.m2ll]);rows.push(["Cox & Snell R²",o.res.coxSnell]);
      rows.push(["Nagelkerke R²",o.res.nagelkerke]);rows.push(['Accuracy',o.res.accuracy+'%']);
      rows.push([]);
      rows.push(['Variable','B','SE','Wald','p','OR','95% CI OR']);
      (o.res.coefs||[]).forEach(function(c){rows.push([c.name,c.B,c.SE,c.wald,c.p_fmt,c.OR,c.ci_or]);});
    }
    
    var sheetName=('Output'+(idx+1)+'_'+(o.type||'').slice(0,8)).slice(0,31);
    var ws=XLSX.utils.aoa_to_sheet(rows);
    ws['!cols']=[{wch:22},{wch:16},{wch:12},{wch:12},{wch:12},{wch:12},{wch:12},{wch:12},{wch:12}];
    XLSX.utils.book_append_sheet(wb,ws,sheetName);
  });
  
  XLSX.writeFile(wb,'OSS_Results_'+new Date().toISOString().slice(0,10)+'.xlsx');
  showToast('Excel berhasil diexport');
}

// ════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════
// PER-OUTPUT EXPORT DIALOG
// ════════════════════════════════════════════════════════════
function _exportOutputDialog(id){
  var o=outputs.find(function(x){return x.id===id;});
  if(!o) return;

  // Detect if this output has chart(s)
  var hasChart=false;
  var chartTypes=[];
  if(o.type==='descriptive'){hasChart=true;chartTypes=['Histogram','Normal Q-Q Plot'];}
  else if(o.type==='ttest'||o.type==='anova'||o.type==='nonparametric'){hasChart=true;chartTypes=['Boxplot'];}
  else if(o.type==='paired'||o.type==='correlation'||o.type==='regression'||o.type==='multipleReg'){hasChart=true;chartTypes=['Scatter Plot'];}
  else if(o.type==='rmanova'){hasChart=true;chartTypes=['Profile Plot'];}
  else if(o.type==='timeseries'){hasChart=true;chartTypes=['Time Series Plot'];}

  // Remove any existing dialog
  var ex=document.getElementById('_exp-dialog');
  if(ex) ex.remove();

  // Build dialog
  var overlay=document.createElement('div');
  overlay.id='_exp-dialog';
  overlay.style.cssText='position:fixed;inset:0;z-index:9900;background:rgba(5,1,14,.82);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px';

  var box=document.createElement('div');
  box.style.cssText='background:linear-gradient(135deg,rgba(20,8,40,.98),rgba(14,6,24,.99));border:1px solid rgba(192,132,252,.3);border-radius:18px;padding:24px;width:100%;max-width:380px;box-shadow:0 20px 60px rgba(0,0,0,.8)';

  // Header
  box.innerHTML='<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">'
    +'<span style="font-size:18px">⬇</span>'
    +'<div style="font-size:15px;font-weight:700;color:#e8deff;font-family:Playfair Display,serif;font-style:italic">Export to Word</div>'
    +'</div>'
    +'<div style="font-size:11.5px;color:rgba(232,222,255,.45);margin-bottom:18px;padding-left:28px">'+escHtml(o.title)+'</div>';

  // Option cards
  var opts=[
    {
      mode:'table',
      icon:'📋',
      label:'Text & Table Only',
      desc:'Ringkasan statistik + tabel hasil — tanpa diagram',
      always:true
    },
    {
      mode:'chart',
      icon:'📊',
      label:'Diagram/Chart Only',
      desc:'Hanya diagram grafis — tanpa tabel statistik',
      always:false
    },
    {
      mode:'both',
      icon:'📄',
      label:'Text, Table & Chart',
      desc:'Lengkap: ringkasan + tabel + diagram',
      always:false
    }
  ];

  var optWrap=document.createElement('div');
  optWrap.style.cssText='display:flex;flex-direction:column;gap:8px;margin-bottom:20px';

  opts.forEach(function(opt){
    var available=opt.always||hasChart;
    var btn=document.createElement('div');
    btn.style.cssText='display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:11px;border:1px solid '
      +(available?'rgba(192,132,252,.22)':'rgba(255,255,255,.06)')+';cursor:'
      +(available?'pointer':'not-allowed')+';background:'
      +(available?'rgba(124,58,237,.06)':'rgba(255,255,255,.02)')+';transition:.15s;opacity:'+(available?'1':'.38');
    if(available){
      btn.onmouseover=function(){this.style.background='rgba(124,58,237,.15)';this.style.borderColor='rgba(192,132,252,.45)';};
      btn.onmouseout=function(){this.style.background='rgba(124,58,237,.06)';this.style.borderColor='rgba(192,132,252,.22)';};
      btn.onclick=function(){overlay.remove();_exportSingleOutput(id,opt.mode);};
    }
    btn.innerHTML='<div style="font-size:22px;flex-shrink:0">'+opt.icon+'</div>'
      +'<div><div style="font-size:12.5px;font-weight:700;color:'+(available?'#e8deff':'rgba(232,222,255,.3)')+'">'+opt.label+'</div>'
      +'<div style="font-size:10.5px;color:'+(available?'rgba(232,222,255,.45)':'rgba(232,222,255,.2)')+'">'+opt.desc+'</div>'
      +((!available)?' <div style="font-size:9.5px;color:#fbbf24;margin-top:3px">⚠ Analisis ini tidak memiliki diagram</div>':'')
      +(available&&opt.mode!=='table'&&hasChart?' <div style="font-size:9.5px;color:#a78bfa;margin-top:2px">Chart: '+chartTypes.join(', ')+'</div>':'')
      +'</div>';
    optWrap.appendChild(btn);
  });

  box.appendChild(optWrap);

  // Export All button
  var allRow=document.createElement('div');
  allRow.style.cssText='display:flex;gap:8px;border-top:1px solid rgba(192,132,252,.1);padding-top:14px';

  var cancelBtn=document.createElement('button');
  cancelBtn.textContent='Batal';
  cancelBtn.style.cssText='flex:1;padding:9px;border-radius:8px;border:1px solid rgba(124,58,237,.25);background:transparent;color:rgba(232,222,255,.55);font-size:12.5px;cursor:pointer;font-family:Inter,sans-serif;font-weight:600';
  cancelBtn.onclick=function(){overlay.remove();};

  var exportAllBtn=document.createElement('button');
  exportAllBtn.textContent='⬇ Export Semua Output';
  exportAllBtn.style.cssText='flex:2;padding:9px;border-radius:8px;border:none;background:rgba(124,58,237,.18);color:#c084fc;font-size:12px;cursor:pointer;font-family:Inter,sans-serif;font-weight:600;border:1px solid rgba(124,58,237,.3)';
  exportAllBtn.onmouseover=function(){this.style.background='rgba(124,58,237,.3)';};
  exportAllBtn.onmouseout=function(){this.style.background='rgba(124,58,237,.18)';};
  exportAllBtn.onclick=function(){overlay.remove();exportWordDialog();};

  allRow.appendChild(cancelBtn);
  allRow.appendChild(exportAllBtn);
  box.appendChild(allRow);

  overlay.appendChild(box);
  overlay.addEventListener('click',function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

// ── Build & download a single output as .doc ─────────────────
function _exportSingleOutput(id, mode){
  var o=outputs.find(function(x){return x.id===id;});
  if(!o){showToast('Output not found','error');return;}

  var html='';
  html+='<h1>OSS Analysis Report</h1>';
  html+='<p class="meta">Generated: '+new Date().toLocaleString()+'&nbsp;&nbsp;|&nbsp;&nbsp;N = '+data.length+' cases&nbsp;&nbsp;|&nbsp;&nbsp;Variables: '+vars.length+'</p>';
  html+='<hr style="border:none;border-top:1px solid #d4d4d4;margin:10pt 0"/>';
  html+=_buildSingleOutputHTML(o, mode);

  var preHtml="<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='UTF-8'><title>OSS Report</title><style>"+_wordCSS()+"</style></head><body>";
  var postHtml="</body></html>";
  var fullHtml=preHtml+html+postHtml;
  var blob=new Blob([fullHtml],{type:'application/msword'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;
  var safeName=o.title.replace(/[^a-zA-Z0-9_]/g,'_').slice(0,40);
  a.download='OSS_'+safeName+'_'+new Date().toISOString().slice(0,10)+'.doc';
  a.click();
  setTimeout(function(){URL.revokeObjectURL(url);},2000);
  showToast('Export berhasil');
}

// ── Build HTML for one output (mode: 'table'|'chart'|'both') ──
function _buildSingleOutputHTML(o, mode){
  var showTable=(mode==='table'||mode==='both');
  var showChart=(mode==='chart'||mode==='both');
  var html='';
  html+='<h2>'+_escHtml(o.title)+'</h2>';
  html+='<p class="meta">'+new Date(o.id).toLocaleString()+'</p>';

  if(showTable){
    if(o.type==='descriptive'&&o.stats){
      html+='<div class="section"><p><b>'+_escHtml(o.field)+'</b> &mdash; N='+o.stats.n+', Mean='+o.stats.mean+', SD='+o.stats.sd+'</p></div>';
      html+=_wordTable(['Statistic','Value'],Object.entries(o.stats).map(function(kv){return[kv[0],String(kv[1])];}));
    }
    else if(o.type==='ttest'&&o.res){
      html+='<div class="section"><p><b>t('+o.res.df+') = '+o.res.t+'</b>, p = '+o.res.p_fmt+", Cohen's d = "+o.res.cohensD+' ('+o.res.dInterp+')</p></div>';
      html+=_wordTable(['','Group A ('+_escHtml(o.ga||'')+')', 'Group B ('+_escHtml(o.gb||'')+')'],
        [['N',o.res.nA,o.res.nB],['Mean',o.res.meanA,o.res.meanB],['SD',o.res.sdA,o.res.sdB]]);
      html+=_wordTable(['Statistic','Value'],[['t',o.res.t],['df',o.res.df],['p',o.res.p_fmt],["Cohen's d",o.res.cohensD+' ('+o.res.dInterp+')'],['95% CI',o.res.ci95]]);
    }
    else if(o.type==='correlation'&&o.res){
      html+='<div class="section"><p><b>r = '+o.res.r+'</b>, p = '+o.res.p_fmt+' &mdash; '+o.res.strength+' '+o.res.direction+'</p></div>';
      html+=_wordTable(['r','r²','p','Strength','95% CI'],[[o.res.r,o.res.r2,o.res.p_fmt,o.res.strength,o.res.ci95]]);
    }
    else if((o.type==='regression'||o.type==='multipleReg')&&o.res){
      html+='<h3>Model Fit</h3>';
      html+=_wordTable(['R²','Adj R²','F','p (F)','RMSE'],[[o.res.R2,o.res.R2adj,o.res.F,o.res.pF_fmt,o.res.RMSE||'—']]);
      html+='<h3>Coefficients</h3>';
      html+=_wordTable(['Variable','B','SE','β','t','p','VIF'],
        (o.res.coefs||[]).map(function(c,ci){return[c.name,c.B,c.SE,ci===0?'—':c.beta,c.t,c.p_fmt,ci===0?'—':(o.res.vif?o.res.vif[ci-1]:'—')];}));
    }
    else if(o.type==='hierarchicalReg'&&o.res){
      html+='<p><b>Dependent Variable:</b> '+_escHtml(o.res.depVar)+'</p>';
      html+='<h3>Model Summary & ΔR²</h3>';
      html+=_wordTable(['Block','Predictors','R²','Adj R²','ΔR²','F-change','df1','df2','p ΔR²'],
        (o.res.blocks||[]).map(function(b){return['Block '+b.block,b.predictors.join(', '),b.R2,b.R2adj,b.dR2,b.Fchange,b.dfNum,b.dfDen,b.pFchange];}));
      (o.res.blocks||[]).forEach(function(b){
        html+='<h3>Block '+b.block+' Coefficients</h3>';
        html+=_wordTable(['Variable','B','SE','β','t','p','VIF'],
          (b.coefs||[]).map(function(c,ci){return[c.name,c.B,c.SE,ci===0?'—':c.beta,c.t,c.p_fmt,ci===0?'—':(b.vif?b.vif[ci-1]:'—')];}));
      });
    }
    else if(o.type==='anova'&&o.res){
      html+='<div class="section"><p><b>F('+o.res.dfB+', '+o.res.dfW+') = '+o.res.F+'</b>, p = '+o.res.p_fmt+', η² = '+o.res.eta2+'</p></div>';
      html+=_wordTable(['Source','df','SS','MS','F','p','η²'],[
        ['Between Groups',o.res.dfB,o.res.SSB,o.res.MSB,o.res.F,o.res.p_fmt,o.res.eta2],
        ['Within Groups',o.res.dfW,o.res.SSW,o.res.MSW,'','','']
      ]);
    }
    else if(o.type==='logistic'&&o.res){
      html+='<div class="section"><p>−2LL = '+o.res.m2ll+' &nbsp;&bull;&nbsp; Nagelkerke R² = '+o.res.nagelkerke+' &nbsp;&bull;&nbsp; Accuracy = '+o.res.accuracy+'%</p></div>';
      html+=_wordTable(['Variable','B','SE','Wald','p','OR','95% CI OR'],
        (o.res.coefs||[]).map(function(c){return[c.name,c.B,c.SE,c.wald,c.p_fmt,c.OR,c.ci_or];}));
    }
    else if(o.type==='paired'&&o.res){
      html+=_wordTable(['Statistic','Value'],[['N',o.res.n],['Mean Diff',o.res.meanDiff],['SD Diff',o.res.sdDiff],['t',o.res.t],['df',o.res.df],['p',o.res.p_fmt],["Cohen's dz",o.res.cohensD+' ('+o.res.dInterp+')'],['95% CI',o.res.ci95]]);
    }
    else if(o.type==='reliability'&&o.res){
      html+='<div class="section"><p><b>Cronbach α = '+o.res.alpha+'</b> ('+o.res.interp+')</p></div>';
      if(o.res.items&&o.res.items.length){
        html+=_wordTable(['Item','r item-total','Alpha if deleted'],o.res.items.map(function(it){return[it.name,it.rit,it.alphaIfDel];}));
      }
    }
    else if(o.type==='crosstab'&&o.res){
      html+='<div class="section"><p>χ²('+o.res.df+') = '+o.res.chi2+', p = '+o.res.p_fmt+', Cramer\'s V = '+o.res.cramersV+'</p></div>';
    }
    else if(o.type==='rmanova'&&o.res){
      var r=o.res;
      html+='<div class="section"><p><b>F('+r.dfB+','+r.dfE+') = '+r.F+'</b>, p = '+r.p_fmt+', η²p = '+r.etaSq+'</p></div>';
      html+=_wordTable(['Source','df','SS','MS','F','p','η²p'],[
        ['Between (Time)',r.dfB,r.SSB,r.MSB,r.F,r.p_fmt,r.etaSq],
        ['Subjects',r.dfS,r.SSS,'—','—','—','—'],
        ['Error',r.dfE,r.SSE,r.MSE,'—','—','—']
      ]);
    }
  }

  if(showChart){
    // Get chart SVG inline for Word export
    var chartHtml=_getChartSVGForExport(o);
    if(chartHtml){
      html+='<div style="margin:12pt 0">';
      html+='<div style="font-size:9pt;font-weight:bold;color:#5b21b6;margin-bottom:4pt">Chart: '+_escHtml(o.title)+'</div>';
      // Wrap SVG in a div with light background for better Word rendering
      html+='<div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:6px;padding:10px;display:inline-block;width:100%">'+chartHtml+'</div>';
      html+='</div>';
    } else if(mode==='chart'){
      html+='<p style="color:#6b7280;font-style:italic">Analisis ini tidak memiliki diagram yang dapat diekspor.</p>';
    }
  }

  html+='<br/>';
  return html;
}

// ── Get chart SVG string for a given output ──────────────────
function _getChartSVGForExport(o){
  try{
    if(o.type==='descriptive'&&o.field){
      return svgHistogram(data,o.field,520,200)+'<div style="font-size:9pt;color:#64748b;margin:6px 0 4px">Normal Q-Q Plot</div>'+svgQQ(data,o.field,520,200);
    }
    else if((o.type==='ttest'||o.type==='anova')&&o.depV&&o.grpV){
      return svgBoxplot(data,o.depV,o.grpV,520,200);
    }
    else if(o.type==='anova'&&o.avV&&o.avG){
      return svgBoxplot(data,o.avV,o.avG,520,200);
    }
    else if(o.type==='correlation'&&(o.crX||o.varX)&&(o.crY||o.varY)){
      return svgScatter(data,o.crX||o.varX,o.crY||o.varY,520,220);
    }
    else if((o.type==='regression'||o.type==='multipleReg')&&o.xF&&o.yF){
      return svgScatter(data,o.xF,o.yF,520,220);
    }
    else if(o.type==='paired'&&o.varA&&o.varB){
      return svgScatter(data,o.varA,o.varB,520,220);
    }
    else if(o.type==='rmanova'&&o.res&&o.res.tMeans){
      var r=o.res;
      var rMns=r.tMeans.map(parseFloat);
      var rmx=Math.max.apply(null,rMns),rmn=Math.min.apply(null,rMns),rng=rmx-rmn||1;
      var svgW=400,svgH=160,pL=42,pB=28,pT=16,pR=16;
      var pW=svgW-pL-pR,pH=svgH-pB-pT;
      var rmPts=rMns.map(function(m,i){return{x:pL+i/(Math.max(rMns.length-1,1))*pW,y:pT+pH-(((m-rmn)/(rng||1))*(pH*0.85)+0.075*pH),m:m,lb:r.labels[i]};});
      var poly=rmPts.map(function(p){return p.x+','+p.y;}).join(' ');
      var svg='<svg viewBox="0 0 '+svgW+' '+svgH+'" style="width:100%;max-width:480px;height:auto">';
      svg+='<rect x="0" y="0" width="'+svgW+'" height="'+svgH+'" fill="#faf5ff" rx="6"/>';
      svg+='<polyline points="'+poly+'" fill="none" stroke="#7c3aed" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
      rmPts.forEach(function(p){
        svg+='<circle cx="'+p.x+'" cy="'+p.y+'" r="5" fill="#7c3aed" opacity="0.85"/>';
        svg+='<text x="'+p.x+'" y="'+(svgH-6)+'" text-anchor="middle" font-size="9" fill="#475569">'+p.lb+'</text>';
        svg+='<text x="'+p.x+'" y="'+(p.y-10)+'" text-anchor="middle" font-size="8.5" fill="#5b21b6">'+p.m+'</text>';
      });
      svg+='<line x1="'+pL+'" y1="'+pT+'" x2="'+pL+'" y2="'+(svgH-pB)+'" stroke="#94a3b8"/>';
      svg+='<line x1="'+pL+'" y1="'+(svgH-pB)+'" x2="'+(svgW-pR)+'" y2="'+(svgH-pB)+'" stroke="#94a3b8"/>';
      svg+='</svg>';
      return svg;
    }
  }catch(e){}
  return null;
}

// ════════════════════════════════════════════════════════════
// EXPORT WORD DIALOG — pilih group/sub-type yang mau diekspor
// ════════════════════════════════════════════════════════════
function exportWordDialog(){
  if(!outputs.length){showToast('No outputs yet. Run an analysis first.','error');return;}

  // ── Map type → human-readable sub-label ──────────────────
  var SUB_LABEL={
    ttest:'Independent T-Test', onesamp:'One-Sample T-Test', paired:'Paired T-Test',
    anova:'One-Way ANOVA', anova2:'Two-Way ANOVA', anova3:'Three-Way ANOVA',
    rmanova:'Repeated Measures ANOVA', glm:'General Linear Model', manova:'MANOVA', repeated:'Repeated Mixed ANOVA',
    correlation:'Pearson Correlation', partialCorr:'Partial Correlation', canonicalCorr:'Canonical Correlation', corrmatrix:'Correlation Matrix',
    regression:'Simple Regression', multipleReg:'Multiple Regression', hierarchicalReg:'Hierarchical Regression',
    logistic:'Logistic Regression', poisson:'Poisson Regression', negbin:'Negative Binomial',
    nonparam:'Non-Parametric', mannwhitney:'Mann-Whitney U', kruskal:'Kruskal-Wallis', wilcoxon:'Wilcoxon Signed-Rank', chiSquare:'Chi-Square',
    descriptive:'Descriptive Statistics',
    alpha:'Cronbach Alpha', kappa:'Cohen Kappa',
    efa:'Exploratory Factor Analysis', cfa:'Confirmatory Factor Analysis',
    cluster:'Cluster Analysis', discriminant:'Discriminant Analysis',
    bayes_ttest:'Bayesian T-Test', bayes_corr:'Bayesian Correlation', bayes_posterior:'Bayesian Posterior', bayesian:'Bayesian Analysis',
    timeseries:'Time Series / ARIMA',
    survival:'Kaplan-Meier Survival', cox:'Cox Regression',
    roc:'ROC Analysis', moderation:'Moderation Analysis', mediation:'Mediation Analysis',
    mi:'Missing Data Analysis', missinganalysis:'Missing Data Analysis',
    poweranalysis:'Power Analysis', metaanalysis:'Meta-Analysis',
    sem:'Structural Equation Modeling', hlm:'Hierarchical Linear Model',
    crosstab:'Crosstab / Chi-Square', reliability:'Reliability'
  };

  function subLabel(o){ return SUB_LABEL[o.type]||o.title||o.type; }

  // ── Build tree: group → {subType → [output ids]} ─────────
  var groups={};   // { groupName: { subType: [ids] } }
  var groupOrder=[];
  outputs.forEach(function(o){
    var grp=_outGroup(o);
    var sub=subLabel(o);
    if(!groups[grp]){groups[grp]={};groupOrder.push(grp);}
    if(!groups[grp][sub]) groups[grp][sub]=[];
    groups[grp][sub].push(o.id);
  });

  // ── State: selected IDs set ───────────────────────────────
  var selIds=new Set(outputs.map(function(o){return o.id;})); // all selected by default

  // ── Remove any existing dialog ────────────────────────────
  var ex=document.getElementById('_exp-bulk-dialog');
  if(ex) ex.remove();

  // ── Build overlay ─────────────────────────────────────────
  var overlay=document.createElement('div');
  overlay.id='_exp-bulk-dialog';
  overlay.style.cssText='position:fixed;inset:0;z-index:9900;background:rgba(5,1,14,.85);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:16px';

  var box=document.createElement('div');
  box.style.cssText='background:linear-gradient(160deg,rgba(22,10,44,.99),rgba(14,6,24,.99));border:1px solid rgba(192,132,252,.28);border-radius:20px;width:100%;max-width:520px;max-height:88vh;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,.85)';

  // Header
  var hdr=document.createElement('div');
  hdr.style.cssText='padding:20px 22px 14px;border-bottom:1px solid rgba(192,132,252,.12);flex-shrink:0';
  hdr.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between">'
    +'<div style="display:flex;align-items:center;gap:10px">'
    +'<div style="width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#db2777);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">⬇</div>'
    +'<div><div style="font-size:15px;font-weight:800;color:#e8deff;font-family:Playfair Display,serif;font-style:italic">Export ke Word</div>'
    +'<div style="font-size:10.5px;color:rgba(232,222,255,.38);margin-top:1px">Pilih analisis yang ingin diekspor</div></div></div>'
    +'<button id="_exp-bulk-close" style="background:rgba(255,255,255,.06);border:none;border-radius:8px;width:28px;height:28px;cursor:pointer;color:rgba(232,222,255,.5);font-size:16px;display:flex;align-items:center;justify-content:center">✕</button>'
    +'</div>';

  // Select All / None bar
  var selBar=document.createElement('div');
  selBar.style.cssText='padding:8px 22px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(192,132,252,.08);flex-shrink:0;background:rgba(124,58,237,.04)';
  selBar.innerHTML='<div id="_exp-sel-count" style="font-size:11px;font-weight:600;color:rgba(232,222,255,.45)"></div>'
    +'<div style="display:flex;gap:6px">'
    +'<button id="_exp-sel-all" style="font-size:10.5px;padding:3px 10px;border-radius:6px;border:1px solid rgba(124,58,237,.3);background:rgba(124,58,237,.1);color:#c084fc;cursor:pointer;font-family:Inter,sans-serif;font-weight:600">Pilih Semua</button>'
    +'<button id="_exp-sel-none" style="font-size:10.5px;padding:3px 10px;border-radius:6px;border:1px solid rgba(255,255,255,.1);background:transparent;color:rgba(232,222,255,.4);cursor:pointer;font-family:Inter,sans-serif;font-weight:600">Batalkan Semua</button>'
    +'</div>';

  // Scrollable list
  var listWrap=document.createElement('div');
  listWrap.id='_exp-list-wrap';
  listWrap.style.cssText='overflow-y:auto;flex:1;padding:12px 22px 8px';

  // Footer
  var footer=document.createElement('div');
  footer.style.cssText='padding:14px 22px;border-top:1px solid rgba(192,132,252,.12);flex-shrink:0;display:flex;gap:8px;align-items:center';
  footer.innerHTML='<button id="_exp-bulk-cancel" style="flex:1;padding:10px;border-radius:9px;border:1px solid rgba(124,58,237,.2);background:transparent;color:rgba(232,222,255,.5);font-size:12.5px;cursor:pointer;font-family:Inter,sans-serif;font-weight:600">Batal</button>'
    +'<div style="flex:2;display:flex;flex-direction:column;gap:5px">'
    +'<div style="display:flex;gap:5px">'
    +'<button id="_exp-bulk-table" style="flex:1;padding:8px 6px;border-radius:8px;border:none;background:rgba(124,58,237,.18);color:#c084fc;font-size:11px;cursor:pointer;font-family:Inter,sans-serif;font-weight:700;border:1px solid rgba(124,58,237,.3)">📋 Teks &amp; Tabel</button>'
    +'<button id="_exp-bulk-chart" style="flex:1;padding:8px 6px;border-radius:8px;border:none;background:rgba(52,211,153,.1);color:#34d399;font-size:11px;cursor:pointer;font-family:Inter,sans-serif;font-weight:700;border:1px solid rgba(52,211,153,.25)">📊 + Chart</button>'
    +'</div>'
    +'<div id="_exp-bulk-hint" style="font-size:9.5px;color:rgba(232,222,255,.28);text-align:center"></div>'
    +'</div>';

  box.appendChild(hdr);
  box.appendChild(selBar);
  box.appendChild(listWrap);
  box.appendChild(footer);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  // ── Render checkbox list ──────────────────────────────────
  function renderList(){
    listWrap.innerHTML='';
    groupOrder.forEach(function(grp){
      var subMap=groups[grp];
      var subTypes=Object.keys(subMap);
      var grpColor=_outGroupColor(grp);
      var grpIcon=_outGroupIcon(grp);

      // All IDs in this group
      var grpIds=[];
      subTypes.forEach(function(s){ subMap[s].forEach(function(id){grpIds.push(id);}); });
      var grpAllSel=grpIds.every(function(id){return selIds.has(id);});
      var grpNoneSel=grpIds.every(function(id){return !selIds.has(id);});
      var grpPartial=!grpAllSel&&!grpNoneSel;

      // Group header row
      var grpRow=document.createElement('div');
      grpRow.style.cssText='display:flex;align-items:center;gap:10px;padding:9px 0 5px;border-bottom:1px solid '+grpColor+'18;margin-bottom:4px;cursor:pointer;user-select:none';
      grpRow.innerHTML='<input type="checkbox" id="grp-chk-'+encodeURIComponent(grp)+'" '+(grpAllSel?'checked':'')+' '+(grpPartial?'': '')+' style="accent-color:'+grpColor+';width:14px;height:14px;cursor:pointer;flex-shrink:0"/>'
        +'<span style="color:'+grpColor+';display:flex;align-items:center;flex-shrink:0">'+grpIcon+'</span>'
        +'<span style="font-size:12.5px;font-weight:800;color:'+grpColor+';letter-spacing:.3px">'+grp+'</span>'
        +'<span style="background:'+grpColor+'22;color:'+grpColor+';border-radius:999px;padding:1px 7px;font-size:9.5px;font-weight:700;margin-left:auto">'+grpIds.length+' hasil</span>';
      var grpChk=grpRow.querySelector('input');
      if(grpPartial) grpChk.indeterminate=true;
      grpChk.addEventListener('change',function(e){
        e.stopPropagation();
        grpIds.forEach(function(id){if(this.checked)selIds.add(id);else selIds.delete(id);},this);
        renderList(); updateFooter();
      });
      grpRow.addEventListener('click',function(e){
        if(e.target.tagName==='INPUT') return;
        grpChk.checked=!grpChk.checked;
        grpIds.forEach(function(id){if(grpChk.checked)selIds.add(id);else selIds.delete(id);});
        renderList(); updateFooter();
      });
      listWrap.appendChild(grpRow);

      // Sub-type rows (only show if group has multiple sub-types OR always show)
      subTypes.forEach(function(sub){
        var ids=subMap[sub];
        var allSel=ids.every(function(id){return selIds.has(id);});
        var noneSel=ids.every(function(id){return !selIds.has(id);});
        var partial=!allSel&&!noneSel;

        var subRow=document.createElement('div');
        subRow.style.cssText='display:flex;align-items:center;gap:10px;padding:6px 6px 6px 24px;border-radius:8px;cursor:pointer;user-select:none;margin-bottom:2px;transition:.1s;'+(allSel?'background:'+grpColor+'0d':'');
        subRow.innerHTML='<input type="checkbox" '+(allSel?'checked':'')+' style="accent-color:'+grpColor+';width:13px;height:13px;cursor:pointer;flex-shrink:0"/>'
          +'<div style="flex:1;min-width:0">'
          +'<div style="font-size:11.5px;font-weight:700;color:'+(allSel?'#e8deff':'rgba(232,222,255,.6)')+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+sub+'</div>'
          +'<div style="font-size:9.5px;color:rgba(232,222,255,.3);margin-top:1px">'+ids.length+' output'+( ids.length>1?'s':'')+' tersimpan</div>'
          +'</div>'
          +'<span style="background:'+(allSel?grpColor+'25':'rgba(255,255,255,.05)')+';color:'+(allSel?grpColor:'rgba(232,222,255,.25)')+';border:1px solid '+(allSel?grpColor+'35':'rgba(255,255,255,.08)')+';border-radius:6px;padding:2px 8px;font-size:10px;font-weight:700;flex-shrink:0">'+ids.length+'</span>';
        var subChk=subRow.querySelector('input');
        if(partial) subChk.indeterminate=true;
        subChk.addEventListener('change',function(e){
          e.stopPropagation();
          ids.forEach(function(id){if(this.checked)selIds.add(id);else selIds.delete(id);},this);
          renderList(); updateFooter();
        });
        subRow.addEventListener('click',function(e){
          if(e.target.tagName==='INPUT') return;
          subChk.checked=!subChk.checked;
          ids.forEach(function(id){if(subChk.checked)selIds.add(id);else selIds.delete(id);});
          renderList(); updateFooter();
        });
        subRow.onmouseover=function(){if(!subRow.style.background||subRow.style.background==='')subRow.style.background='rgba(124,58,237,.05)';};
        subRow.onmouseout=function(){var a=ids.every(function(id){return selIds.has(id);});subRow.style.background=a?grpColor+'0d':'';};
        listWrap.appendChild(subRow);
      });

      // Spacer
      var sp=document.createElement('div');
      sp.style.height='10px';
      listWrap.appendChild(sp);
    });
  }

  function updateFooter(){
    var n=selIds.size;
    document.getElementById('_exp-sel-count').textContent=n+' output dipilih dari '+outputs.length;
    document.getElementById('_exp-bulk-hint').textContent=n===0?'Pilih minimal 1 output untuk mengekspor':n+' output akan diekspor ke .doc';
    var tableBtn=document.getElementById('_exp-bulk-table');
    var chartBtn=document.getElementById('_exp-bulk-chart');
    if(tableBtn){tableBtn.disabled=n===0;tableBtn.style.opacity=n===0?'.35':'1';}
    if(chartBtn){chartBtn.disabled=n===0;chartBtn.style.opacity=n===0?'.35':'1';}
  }

  renderList();
  updateFooter();

  // Event: Select All / None
  document.getElementById('_exp-sel-all').onclick=function(){
    outputs.forEach(function(o){selIds.add(o.id);});
    renderList(); updateFooter();
  };
  document.getElementById('_exp-sel-none').onclick=function(){
    selIds.clear();
    renderList(); updateFooter();
  };

  // Event: Close
  document.getElementById('_exp-bulk-close').onclick=function(){overlay.remove();};
  document.getElementById('_exp-bulk-cancel').onclick=function(){overlay.remove();};
  overlay.addEventListener('click',function(e){if(e.target===overlay)overlay.remove();});

  // Event: Export buttons
  document.getElementById('_exp-bulk-table').onclick=function(){
    if(!selIds.size){showToast('Pilih minimal 1 output','error');return;}
    overlay.remove();
    _exportBulkWord(Array.from(selIds),'table');
  };
  document.getElementById('_exp-bulk-chart').onclick=function(){
    if(!selIds.size){showToast('Pilih minimal 1 output','error');return;}
    overlay.remove();
    _exportBulkWord(Array.from(selIds),'both');
  };
}

// ── Build & download selected outputs as .doc ─────────────────
function _exportBulkWord(ids, mode){
  var selected=outputs.filter(function(o){return ids.indexOf(o.id)!==-1;});
  if(!selected.length){showToast('Tidak ada output yang dipilih','error');return;}

  // Group selected for nice document structure
  var groups={}, groupOrder=[];
  var SUB_LABEL_MAP={
    ttest:'Independent T-Test', onesamp:'One-Sample T-Test', paired:'Paired T-Test',
    anova:'One-Way ANOVA', anova2:'Two-Way ANOVA', anova3:'Three-Way ANOVA',
    rmanova:'Repeated Measures ANOVA', glm:'General Linear Model', manova:'MANOVA', repeated:'Repeated Mixed ANOVA',
    correlation:'Pearson Correlation', partialCorr:'Partial Correlation', canonicalCorr:'Canonical Correlation', corrmatrix:'Correlation Matrix',
    regression:'Simple Regression', multipleReg:'Multiple Regression', hierarchicalReg:'Hierarchical Regression',
    logistic:'Logistic Regression', poisson:'Poisson Regression', negbin:'Negative Binomial',
    nonparam:'Non-Parametric Test', mannwhitney:'Mann-Whitney U', kruskal:'Kruskal-Wallis', wilcoxon:'Wilcoxon Signed-Rank', chiSquare:'Chi-Square',
    descriptive:'Descriptive Statistics',
    alpha:'Cronbach Alpha', kappa:'Cohen Kappa',
    efa:'Exploratory Factor Analysis', cfa:'Confirmatory Factor Analysis',
    cluster:'Cluster Analysis', discriminant:'Discriminant Analysis',
    timeseries:'Time Series / ARIMA', survival:'Kaplan-Meier Survival', cox:'Cox Regression',
    roc:'ROC Analysis', moderation:'Moderation', mediation:'Mediation',
    mi:'Missing Data Analysis', poweranalysis:'Power Analysis', metaanalysis:'Meta-Analysis',
    sem:'SEM', hlm:'HLM', crosstab:'Crosstab', reliability:'Reliability'
  };

  selected.forEach(function(o){
    var grp=_outGroup(o);
    if(!groups[grp]){groups[grp]=[];groupOrder.push(grp);}
    groups[grp].push(o);
  });

  var html='';
  html+='<h1>OSS Analysis Report</h1>';
  html+='<p class="meta">Generated: '+new Date().toLocaleString()+'&nbsp;&nbsp;|&nbsp;&nbsp;N = '+data.length+' cases&nbsp;&nbsp;|&nbsp;&nbsp;'+selected.length+' outputs selected</p>';
  html+='<hr style="border:none;border-top:1px solid #d4d4d4;margin:10pt 0"/>';

  groupOrder.forEach(function(grp){
    var outs=groups[grp];
    // Group heading
    html+='<h1 style="font-size:14pt;color:#4a0072;border-bottom:2px solid #7c3aed;padding-bottom:4pt;margin-top:20pt;margin-bottom:6pt">'+_escHtml(grp)+'</h1>';

    outs.forEach(function(o,i){
      html+=_buildSingleOutputHTML(o, mode);
    });
  });

  var preHtml="<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='UTF-8'><title>OSS Report</title><style>"+_wordCSS()+"</style></head><body>";
  var postHtml="</body></html>";
  var fullHtml=preHtml+html+postHtml;
  var blob=new Blob([fullHtml],{type:'application/msword'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;
  a.download='OSS_Report_'+new Date().toISOString().slice(0,10)+'.doc';
  a.click();
  setTimeout(function(){URL.revokeObjectURL(url);},2000);
  showToast('Export berhasil');
}

// EXPORT TO WORD (.docx via HTML→Blob)
// ════════════════════════════════════════════════════════════
function exportToWord(){
  if(!outputs.length){showToast('No outputs yet. Run an analysis first.','error');return;}
  
  var htmlContent=_buildWordHTML();
  
  // Use msSaveBlob for IE, or create HTML file with Word mime
  var preHtml="<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='UTF-8'><title>OSS Report</title><style>"+_wordCSS()+"</style></head><body>";
  var postHtml="</body></html>";
  var fullHtml=preHtml+htmlContent+postHtml;
  var blob=new Blob([fullHtml],{type:'application/msword'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;
  a.download='OSS_Report_'+new Date().toISOString().slice(0,10)+'.doc';
  a.click();
  setTimeout(function(){URL.revokeObjectURL(url);},2000);
  showToast('Word berhasil diexport');
}

function _wordCSS(){
  return [
    'body{font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#1a1a1a;margin:2cm 2.5cm;}',
    'h1{font-size:16pt;color:#4a0072;border-bottom:2px solid #7c3aed;padding-bottom:4pt;margin-top:18pt;}',
    'h2{font-size:13pt;color:#5b21b6;margin-top:14pt;margin-bottom:4pt;}',
    'h3{font-size:11pt;color:#6d28d9;margin-top:10pt;margin-bottom:3pt;}',
    'table{border-collapse:collapse;width:100%;margin:8pt 0;font-size:10pt;}',
    'th{background:#7c3aed;color:#fff;padding:5pt 8pt;text-align:left;border:1px solid #5b21b6;}',
    'td{padding:4pt 8pt;border:1px solid #d4d4d4;}',
    'tr:nth-child(even) td{background:#f5f3ff;}',
    '.badge-sig{color:#059669;font-weight:bold;}',
    '.badge-ns{color:#6b7280;}',
    '.section{background:#faf5ff;border-left:3px solid #7c3aed;padding:6pt 10pt;margin:8pt 0;}',
    '.meta{font-size:9pt;color:#6b7280;margin-bottom:3pt;}',
    'p{margin:3pt 0;line-height:1.5;}',
    'svg{max-width:100%;height:auto;display:block;background:#fff;}',
    '.chart-empty{color:#6b7280;font-style:italic;font-size:10pt;padding:8pt;}'
  ].join('\n');
}

function _buildWordHTML(){
  var html='';
  html+='<h1>OSS Analysis Report</h1>';
  html+='<p class="meta">Generated: '+new Date().toLocaleString()+'&nbsp;&nbsp;|&nbsp;&nbsp;N = '+data.length+' cases&nbsp;&nbsp;|&nbsp;&nbsp;Variables: '+vars.length+'</p>';
  html+='<hr style="border:none;border-top:1px solid #d4d4d4;margin:10pt 0"/>';
  
  outputs.forEach(function(o, idx){
    html+='<h2>'+(idx+1)+'. '+_escHtml(o.title)+'</h2>';
    html+='<p class="meta">'+new Date(o.id).toLocaleString()+'</p>';
    
    if(o.type==='descriptive'&&o.stats){
      html+=_wordTable(['Statistic','Value'],
        Object.entries(o.stats).map(function(kv){return[kv[0],String(kv[1])];})
      );
    }
    else if(o.type==='ttest'&&o.res){
      html+='<div class="section">';
      html+='<p><b>t('+o.res.df+') = '+o.res.t+'</b>, p = '+o.res.p_fmt+", Cohen's d = "+o.res.cohensD+' ('+o.res.dInterp+')</p>';
      html+='</div>';
      html+=_wordTable(['','Group A ('+_escHtml(o.ga||'')+')', 'Group B ('+_escHtml(o.gb||'')+')'],
        [['N',o.res.nA,o.res.nB],['Mean',o.res.meanA,o.res.meanB],['SD',o.res.sdA,o.res.sdB]]);
      html+=_wordTable(['Statistic','Value'],[['t',o.res.t],['df',o.res.df],['p',o.res.p_fmt],["Cohen's d",o.res.cohensD+' ('+o.res.dInterp+')'],['95% CI',o.res.ci95]]);
    }
    else if(o.type==='correlation'&&o.res){
      html+='<div class="section"><p><b>r = '+o.res.r+'</b>, p = '+o.res.p_fmt+' &mdash; '+o.res.strength+' '+o.res.direction+'</p></div>';
      html+=_wordTable(['r','r²','p','Strength','95% CI'],[[o.res.r,o.res.r2,o.res.p_fmt,o.res.strength,o.res.ci95]]);
    }
    else if((o.type==='regression'||o.type==='multipleReg')&&o.res){
      html+='<h3>Model Fit</h3>';
      html+=_wordTable(['R²','Adj R²','F','p (F)','RMSE'],[[o.res.R2,o.res.R2adj,o.res.F,o.res.pF_fmt,o.res.RMSE||'—']]);
      html+='<h3>Coefficients</h3>';
      html+=_wordTable(['Variable','B','SE','β','t','p','VIF'],
        (o.res.coefs||[]).map(function(c,ci){
          return[c.name,c.B,c.SE,ci===0?'—':c.beta,c.t,c.p_fmt,ci===0?'—':(o.res.vif?o.res.vif[ci-1]:'—')];
        }));
    }
    else if(o.type==='hierarchicalReg'&&o.res){
      html+='<p><b>Dependent Variable:</b> '+_escHtml(o.res.depVar)+'</p>';
      html+='<h3>Model Summary & ΔR²</h3>';
      html+=_wordTable(['Block','Predictors','R²','Adj R²','ΔR²','F-change','df1','df2','p ΔR²'],
        (o.res.blocks||[]).map(function(b){
          return['Block '+b.block, b.predictors.join(', '), b.R2, b.R2adj, b.dR2, b.Fchange, b.dfNum, b.dfDen, b.pFchange];
        }));
      (o.res.blocks||[]).forEach(function(b){
        html+='<h3>Block '+b.block+' Coefficients</h3>';
        html+=_wordTable(['Variable','B','SE','β','t','p','VIF'],
          (b.coefs||[]).map(function(c,ci){
            return[c.name,c.B,c.SE,ci===0?'—':c.beta,c.t,c.p_fmt,ci===0?'—':(b.vif?b.vif[ci-1]:'—')];
          }));
      });
    }
    else if(o.type==='anova'&&o.res){
      html+='<div class="section"><p><b>F('+o.res.dfB+', '+o.res.dfW+') = '+o.res.F+'</b>, p = '+o.res.p_fmt+', &eta;&sup2; = '+o.res.eta2+'</p></div>';
      html+=_wordTable(['Source','df','SS','MS','F','p','η²'],[
        ['Between Groups',o.res.dfB,o.res.SSB,o.res.MSB,o.res.F,o.res.p_fmt,o.res.eta2],
        ['Within Groups',o.res.dfW,o.res.SSW,o.res.MSW,'','','']
      ]);
    }
    else if(o.type==='logistic'&&o.res){
      html+='<div class="section"><p>&minus;2LL = '+o.res.m2ll+' &nbsp;&bull;&nbsp; Nagelkerke R&sup2; = '+o.res.nagelkerke+' &nbsp;&bull;&nbsp; Accuracy = '+o.res.accuracy+'%</p></div>';
      html+=_wordTable(['Variable','B','SE','Wald','p','OR','95% CI OR'],
        (o.res.coefs||[]).map(function(c){return[c.name,c.B,c.SE,c.wald,c.p_fmt,c.OR,c.ci_or];}));
    }
    
    html+='<br/>';
  });
  
  return html;
}

function _wordTable(headers, rows){
  var h='<table><thead><tr>'+headers.map(function(h){return '<th>'+_escHtml(String(h))+'</th>';}).join('')+'</tr></thead><tbody>';
  rows.forEach(function(row){
    h+='<tr>'+row.map(function(c){return '<td>'+_escHtml(String(c===null||c===undefined?'—':c))+'</td>';}).join('')+'</tr>';
  });
  h+='</tbody></table>';
  return h;
}

function _escHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ════════════════════════════════════════════════════════════
// ACTIVITY LOADING POPUP SYSTEM
// ════════════════════════════════════════════════════════════
(function(){
  // Inject HTML
  var loaderHtml=
    '<div id="oss-loader">'+
      '<div id="oss-loader-box">'+
        '<div class="oss-spin-wrap">'+
          '<div class="oss-arc"></div>'+
          '<div class="oss-arc2"></div>'+
          '<div class="oss-glow-dot"></div>'+
        '</div>'+
        '<div class="oss-ldr-title" id="oss-ldr-title">Memproses...</div>'+
        '<div class="oss-ldr-sub" id="oss-ldr-sub">Mohon tunggu sebentar</div>'+
        '<div class="oss-ldr-bar-wrap"><div class="oss-ldr-bar" id="oss-ldr-bar"></div></div>'+
        '<div class="oss-dots"><div class="oss-dot"></div><div class="oss-dot"></div><div class="oss-dot"></div></div>'+
      '</div>'+
    '</div>';
  document.body.insertAdjacentHTML('beforeend', loaderHtml);

  var loader    = null; // lazy ref
  var barEl     = null;
  var titleEl   = null;
  var subEl     = null;
  var _barPct   = 0;
  var _barTarget = 0;
  var _barAF    = null;
  var _hideTimer = null;

  function getEls(){
    if(!loader){
      loader  = document.getElementById('oss-loader');
      barEl   = document.getElementById('oss-ldr-bar');
      titleEl = document.getElementById('oss-ldr-title');
      subEl   = document.getElementById('oss-ldr-sub');
    }
  }

  // Animate progress bar smoothly
  function animBar(){
    if(_barPct < _barTarget){
      var step = Math.max(1, Math.ceil((_barTarget - _barPct) * 0.12));
      _barPct = Math.min(_barTarget, _barPct + step);
      if(barEl) barEl.style.width = _barPct + '%';
    }
    if(_barPct < 100){
      _barAF = requestAnimationFrame(animBar);
    }
  }

  function setBar(v){
    _barTarget = Math.min(100, Math.max(_barPct, v));
    if(!_barAF) _barAF = requestAnimationFrame(animBar);
  }

  // Public: show loader
  window.OSSLoader = {
    show: function(title, sub){
      getEls();
      clearTimeout(_hideTimer);
      _barPct = 0; _barTarget = 0;
      cancelAnimationFrame(_barAF); _barAF = null;
      if(barEl) barEl.style.width = '0%';
      if(titleEl) titleEl.textContent = title || 'Memproses...';
      if(subEl)   subEl.textContent   = sub   || 'Mohon tunggu sebentar';
      loader.classList.add('show');
      // Simulate smart progress based on perceived network
      setTimeout(function(){ setBar(25); }, 0);
      setTimeout(function(){ setBar(55); }, 120);
      setTimeout(function(){ setBar(78); }, 280);
    },
    hide: function(delay){
      getEls();
      setBar(100);
      _hideTimer = setTimeout(function(){
        if(loader) loader.classList.remove('show');
        _barPct = 0; _barTarget = 0;
        cancelAnimationFrame(_barAF); _barAF = null;
      }, delay != null ? delay : 260);
    },
    update: function(sub){ if(subEl) subEl.textContent = sub || ''; }
  };

  // ─── INTERCEPT USER ACTIVITIES ───────────────────────────────

  // 1. Analysis runs — wrap runSafe
  var _origRunSafe = window.runSafe;
  window.runSafe = function(fn, label){
    var messages = {
      'Descriptives'     : ['Menghitung statistik deskriptif','Menganalisis distribusi data...'],
      'Correlation'      : ['Menghitung korelasi','Menghitung matriks korelasi...'],
      'Regression'       : ['Menjalankan regresi','Membangun model regresi...'],
      'T-Test'           : ['Menjalankan uji t','Membandingkan kelompok...'],
      'ANOVA'            : ['Menjalankan ANOVA','Menganalisis varians...'],
      'Chi-Square'       : ['Menghitung Chi-Square','Menganalisis frekuensi...'],
      'Factor Analysis'  : ['Analisis faktor','Mengekstrak faktor...'],
      'Reliability'      : ['Uji reliabilitas','Menghitung Cronbach Alpha...'],
      'Mann-Whitney'     : ['Uji Mann-Whitney','Membandingkan distribusi...'],
      'Wilcoxon'         : ['Uji Wilcoxon','Menganalisis perbedaan...'],
      'Kruskal-Wallis'   : ['Uji Kruskal-Wallis','Analisis nonparametrik...'],
      'Logistic'         : ['Regresi logistik','Membangun model logistik...'],
      'Hierarchical'     : ['Regresi hierarki','Membangun model bertahap...'],
    };
    var lbl = label || '';
    var key = Object.keys(messages).find(function(k){ return lbl.indexOf(k) !== -1; });
    var title = key ? messages[key][0] : 'Menjalankan analisis';
    var sub   = key ? messages[key][1] : ('Memproses: ' + lbl + '...');
    OSSLoader.show(title, sub);
    setTimeout(function(){
      try{
        fn();
        OSSLoader.update('Analisis selesai ✓');
        OSSLoader.hide(340);
        showToast(label+' berhasil');
      }catch(e){
        OSSLoader.hide(0);
        showToast(e.message, 'error');
      }
    }, 60);
  };

  // 2. CSV import
  var _origHandleCSV = window.handleCSV;
  if(typeof _origHandleCSV === 'function'){
    window.handleCSV = function(e){
      var file = e.target.files[0];
      var name = file ? file.name : 'file';
      OSSLoader.show('Mengimpor data', 'Membaca: ' + name + '...');
      var origOnLoad = null;
      var origReader = window.FileReader;
      // Wrap with a short delay so loader renders first
      setTimeout(function(){
        _origHandleCSV(e);
        // Since handleCSV is async via FileReader, we patch the toast
      }, 80);
      // Hide loader after a realistic delay
      var t0 = Date.now();
      var checkDone = setInterval(function(){
        if(Date.now() - t0 > 2000){
          clearInterval(checkDone);
          OSSLoader.hide(200);
        }
      }, 100);
      // Also hook showToast to detect import finish
      var _origToast = window.showToast;
      window.showToast = function(msg, type){
        if(typeof msg === 'string' && msg.indexOf('Imported') === 0){
          clearInterval(checkDone);
          OSSLoader.update('Import berhasil ✓');
          OSSLoader.hide(350);
        }
        _origToast.apply(this, arguments);
        window.showToast = _origToast;
      };
    };
  }

  // 3. Export functions — patch download triggers
  function wrapExport(fnName, title, sub){
    var orig = window[fnName];
    if(typeof orig !== 'function') return;
    window[fnName] = function(){
      OSSLoader.show(title, sub);
      setTimeout(function(){
        try{ orig.apply(this, arguments); }catch(e){}
        OSSLoader.update('File siap diunduh ✓');
        OSSLoader.hide(600);
      }, 120);
    };
  }
  // Will run after page init so functions are defined
  setTimeout(function(){
    wrapExport('exportToWord',  'Mengekspor laporan', 'Membangun dokumen Word...');
    wrapExport('exportToExcel', 'Mengekspor ke Excel', 'Menulis data ke spreadsheet...');
    // detect CSV/APA export buttons via click delegation instead (handled below)
  }, 500);

  // 4. Hierarchical regression (async)
  setTimeout(function(){
    var _origHier = window.runHierarchicalReg;
    if(typeof _origHier === 'function'){
      window.runHierarchicalReg = function(){
        OSSLoader.show('Regresi hierarki', 'Membangun model bertahap...');
        setTimeout(function(){
          try{
            _origHier();
            OSSLoader.update('Analisis selesai ✓');
            OSSLoader.hide(320);
          }catch(e){
            OSSLoader.hide(0);
            showToast(e.message,'error');
          }
        }, 60);
      };
    }
  }, 300);

  // 5. execSyntax (async run all)
  setTimeout(function(){
    var _origExec = window.execSyntax;
    if(typeof _origExec === 'function'){
      window.execSyntax = async function(){
        OSSLoader.show('Menjalankan syntax', 'Mengeksekusi semua perintah...');
        try{
          await _origExec();
          OSSLoader.update('Eksekusi selesai ✓');
          OSSLoader.hide(320);
        }catch(e){
          OSSLoader.hide(0);
        }
      };
    }
  }, 400);

  // 6. Navigation between main pages (Home ↔ App)
  // Intercept via click delegation on nav items
  document.addEventListener('click', function(e){
    var item = e.target.closest('.s-item, .hero-cta, .s-logo');
    if(!item) return;
    // Only show brief loader for sidebar navigation switches
    if(item.classList.contains('s-item')){
      var text = item.textContent.trim().substring(0, 30);
      OSSLoader.show('Membuka halaman', 'Navigasi ke: ' + text + '...');
      OSSLoader.hide(420);
    }
  }, true);

  // 7. Tab switching inside pages (sub-tabs)
  document.addEventListener('click', function(e){
    var btn = e.target.closest('.sub-btn');
    if(!btn || !btn.dataset.tab) return;
    var tabName = btn.textContent.trim().substring(0, 24);
    OSSLoader.show('Memuat tampilan', 'Membuka: ' + tabName + '...');
    OSSLoader.hide(350);
  }, true);

  // 8. Impute / data processing
  setTimeout(function(){
    var _origImpute = window.runImpute;
    if(typeof _origImpute === 'function'){
      window.runImpute = function(){
        OSSLoader.show('Mengimputasi data', 'Mengisi nilai yang hilang...');
        try{ _origImpute(); OSSLoader.update('Imputasi selesai ✓'); OSSLoader.hide(300); }
        catch(e){ OSSLoader.hide(0); }
      };
    }
    var _origImputeAll = window.imputeAllVars;
    if(typeof _origImputeAll === 'function'){
      window.imputeAllVars = function(){
        OSSLoader.show('Mengimputasi semua variabel', 'Memproses semua kolom...');
        try{ _origImputeAll(); OSSLoader.update('Imputasi selesai ✓'); OSSLoader.hide(350); }
        catch(e){ OSSLoader.hide(0); }
      };
    }
  }, 500);

  // 9. Session save/restore indicator
  var _toastRef = window.showToast;
  setTimeout(function(){
    var _origSave;
    ['saveSession'].forEach(function(fn){
      if(typeof window[fn]==='function'){
        var orig = window[fn];
        window[fn] = function(){
          OSSLoader.show('Menyimpan sesi', 'Menulis data ke storage...');
          try{ orig.apply(this,arguments); OSSLoader.update('Tersimpan ✓'); OSSLoader.hide(280); }
          catch(e){ OSSLoader.hide(0); }
        };
      }
    });
  }, 600);

})();

// ════════════════════════════════════════════════════════════
// FILE SYSTEM — Save/Open .oss files (penelitian project file)
// Uses File System Access API when available (Chrome/Edge),
// falls back to download/upload on Firefox/Safari.
// ════════════════════════════════════════════════════════════

var _ossFileHandle = null;       // File System Access API handle (if granted)
var _ossFileName   = null;       // current open filename (display only)
var _ossUnsaved    = false;      // dirty flag

// ── Dirty-flag tracking: mark unsaved on any data/output change ──
(function(){
  var _origAdd = window.addOutput;
  var _patchInterval = setInterval(function(){
    // Patch addOutput
    if(typeof window.addOutput === 'function' && window.addOutput !== _origAdd){
      _origAdd = window.addOutput;
    }
    var origAdd = window.addOutput;
    if(origAdd && !origAdd._ossDirtyPatched){
      window.addOutput = function(){
        origAdd.apply(this, arguments);
        ossMarkUnsaved();
      };
      window.addOutput._ossDirtyPatched = true;
    }
    // Patch handleCSV completion
    clearInterval(_patchInterval);
  }, 800);

  // Also mark dirty on data changes via interval
  setInterval(function(){
    if(data && data.length > 0) ossMarkUnsaved();
  }, 60000); // gentle reminder every 60s if data exists
})();

function ossMarkUnsaved(){
  if(_ossFileName){
    _ossUnsaved = true;
    var el = document.getElementById('oss-unsaved-dot');
    if(el) el.classList.add('visible');
  }
}

function ossMarkSaved(){
  _ossUnsaved = false;
  var el = document.getElementById('oss-unsaved-dot');
  if(el) el.classList.remove('visible');
}

function ossUpdateFileBar(name){
  _ossFileName = name;
  ossMarkSaved();
}

// ── Build the session snapshot (same structure as saveSession) ──
function ossSnapshot(){
  _dsSyncSave();
  return {
    _ossVersion: 1,
    _savedAt: new Date().toISOString(),
    _appName: 'OSS — Orias Statistik System',
    datasets: datasets,
    activeDatasetId: activeDatasetId
  };
}

// ── Restore snapshot (same as loadSession but from object) ──
function ossRestore(snap){
  if(!snap || !snap.datasets) throw new Error('Format file tidak dikenali (.oss)');
  datasets = snap.datasets;
  activeDatasetId = snap.activeDatasetId || (datasets[0] && datasets[0].id) || 1;
  _dsSyncLoad();
  updateBadges();
  renderDsSidebar();
  // Re-render current view
  if(typeof renderASub === 'function') renderASub();
  if(typeof renderOutput === 'function'){
    var el = document.getElementById('app-content');
    if(el && currentTab === 'output') renderOutput(el);
  }
}

// ════════════════════════════════════════════════════════════
// SAVE TO FILE
// ════════════════════════════════════════════════════════════
async function saveToFile(){
  try {
    var snap = ossSnapshot();
    var json = JSON.stringify(snap, null, 2);
    var blob = new Blob([json], {type: 'application/json'});

    // ── Path A: File System Access API (Chrome/Edge — dapat pilih folder & nama) ──
    if(window.showSaveFilePicker){
      try {
        // If we already have a handle for this file, overwrite directly (Ctrl+S behavior)
        var handle = _ossFileHandle;
        if(!handle){
          handle = await window.showSaveFilePicker({
            suggestedName: (_ossFileName || 'penelitian') + '.oss',
            types: [{
              description: 'OSS Research File',
              accept: {'application/json': ['.oss']}
            }]
          });
        }
        var writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        _ossFileHandle = handle;
        ossUpdateFileBar(handle.name);
        showToast('File berhasil disimpan');
        return;
      } catch(err){
        if(err.name === 'AbortError') return; // user cancelled
        // Fall through to download fallback
      }
    }

    // ── Path B: Fallback — trigger browser download (semua browser) ──
    var fname = (_ossFileName || 'penelitian-oss-' + new Date().toLocaleDateString('id').replace(/\//g,'-')) + '.oss';
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = fname;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 2000);
    if(!_ossFileName) _ossFileName = fname;
    ossUpdateFileBar(fname);
    showToast('File berhasil diunduh');

  } catch(e){
    showToast('Gagal menyimpan: ' + e.message, 'error');
  }
}

// ── Save-As: always opens picker (ignore existing handle) ──
async function saveToFileAs(){
  _ossFileHandle = null; // force new picker
  await saveToFile();
}

// ════════════════════════════════════════════════════════════
// IMPORT / OPEN FILE
// ════════════════════════════════════════════════════════════
async function importFromFile(){
  // Warn user if there's unsaved local data
  var hasCurrent = (data && data.length > 0) || (outputs && outputs.length > 0);
  if(hasCurrent){
    var proceed = await new Promise(function(resolve){
      ossDialog({
        icon: '📂',
        title: 'Buka File Penelitian',
        msg: 'Sesi yang sedang aktif akan digantikan oleh file yang dibuka.\n\nData di browser (localStorage) tetap aman dan tidak hilang — hanya tampilan yang akan beralih ke file yang diimport.',
        inputs: [],
        buttons: [
          {label: 'Batal', val: false, ghost: true},
          {label: 'Lanjut, Buka File', val: true}
        ]
      }).then(resolve);
    });
    if(!proceed) return;
  }

  try {
    // ── Path A: File System Access API ──
    if(window.showOpenFilePicker){
      try {
        var handles = await window.showOpenFilePicker({
          types: [{
            description: 'OSS Research File',
            accept: {'application/json': ['.oss'], 'application/octet-stream': ['.oss']}
          }],
          multiple: false
        });
        if(!handles || !handles.length) return;
        var handle = handles[0];
        var file   = await handle.getFile();
        var text   = await file.text();
        var snap   = JSON.parse(text);
        ossRestore(snap);
        _ossFileHandle = handle;
        ossUpdateFileBar(handle.name);
        showToast('File berhasil dibuka');
        return;
      } catch(err){
        if(err.name === 'AbortError') return;
        // Fall through to input fallback
      }
    }

    // ── Path B: Fallback — hidden <input type="file"> ──
    document.getElementById('oss-import-input').click();

  } catch(e){
    showToast('Gagal membuka file: ' + e.message, 'error');
  }
}

// Called by the hidden <input> fallback
function handleOSSImport(evt){
  var file = evt.target.files && evt.target.files[0];
  evt.target.value = ''; // reset so same file can be re-opened
  if(!file) return;
  var reader = new FileReader();
  reader.onload = function(e){
    try {
      var snap = JSON.parse(e.target.result);
      ossRestore(snap);
      _ossFileHandle = null; // no handle in fallback mode
      ossUpdateFileBar(file.name);
      showToast('File berhasil dibuka');
    } catch(err){
      showToast('Format file tidak valid: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
}

// Also patch the menu-item 'Save Session' to use saveToFile
(function(){
  setTimeout(function(){
    // The context menu 'Save Session' label → redirect to saveToFile
    if(window.saveSession){
      var _orig = window.saveSession;
      window.saveSession = function(){
        // Still save to localStorage (backup), then also trigger file save
        _orig();
        // Don't auto-trigger file picker on autosave
      };
    }
  }, 1000);
})();

// ════════════════════════════════════════════════════════════
// PWA — Service Worker Registration + Install Prompt
// State: "installable" | "installed" | "unavailable"
// ════════════════════════════════════════════════════════════
var _pwaInstallEvent = null;

// ── Update tampilan tombol sesuai state ──────────────────
function _pwaSetInstalled(isInstalled){
  var btn   = document.getElementById('sidebar-install-btn');
  var label = document.getElementById('sidebar-install-label');
  if(!btn || !label) return;
  var svgEl = btn.querySelector('svg');

  if(isInstalled){
    btn.classList.add('installed');
    btn.disabled = true;
    if(svgEl){
      svgEl.setAttribute('viewBox','0 0 24 24');
      svgEl.innerHTML = '<polyline points="20 6 9 17 4 12"/>';
    }
    label.textContent = 'Sudah Terinstal \u2713';
  } else {
    btn.classList.remove('installed');
    btn.disabled = false;
    if(svgEl){
      svgEl.setAttribute('viewBox','0 0 24 24');
      svgEl.innerHTML = '<rect x="3" y="3" width="18" height="18" rx="3"/><polyline points="8 12 12 16 16 12"/><line x1="12" y1="8" x2="12" y2="16"/>';
    }
    label.textContent = 'Install App';
  }
}

// ── Cek apakah sudah terinstal saat load ────────────────
function _pwaCheckInstalled(){
  // Mode standalone = dibuka sebagai app (sudah install)
  if(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true){
    _pwaSetInstalled(true);
    return;
  }
  // getInstalledRelatedApps — Chrome Android/Desktop
  if(navigator.getInstalledRelatedApps){
    navigator.getInstalledRelatedApps().then(function(apps){
      if(apps && apps.length > 0) _pwaSetInstalled(true);
    }).catch(function(){});
  }
}

(function(){
  // Cek status awal
  _pwaCheckInstalled();

  // Listen perubahan display-mode: kalau user uninstall lalu buka di browser lagi
  var mq = window.matchMedia('(display-mode: standalone)');
  var mqFn = function(e){
    if(!e.matches && !_pwaInstallEvent){
      // Kembali ke browser mode, kemungkinan di-uninstall
      _pwaSetInstalled(false);
    }
  };
  if(mq.addEventListener) mq.addEventListener('change', mqFn);
  else if(mq.addListener) mq.addListener(mqFn); // Safari lama

  // Register Service Worker
  if('serviceWorker' in navigator){
    window.addEventListener('load', function(){
      navigator.serviceWorker.register('./sw.js').then(function(reg){
        // Check for update immediately on load
        reg.update();

        reg.addEventListener('updatefound', function(){
          var newWorker = reg.installing;
          newWorker.addEventListener('statechange', function(){
            if(newWorker.state === 'installed' && navigator.serviceWorker.controller){
              // Force activate new SW immediately — skip waiting
              newWorker.postMessage({type:'SKIP_WAITING'});
              showToast('Update tersedia — refresh browser');
            }
          });
        });
      }).catch(function(err){
        console.warn('OSS SW registration failed:', err);
      });

      // When SW has taken control, reload once to use new cache
      navigator.serviceWorker.addEventListener('controllerchange', function(){
        if(!window._swReloading){
          window._swReloading = true;
          window.location.reload();
        }
      });
    });
  }

  // Browser siap menawarkan install (belum diinstall)
  window.addEventListener('beforeinstallprompt', function(e){
    e.preventDefault();
    _pwaInstallEvent = e;
    _pwaSetInstalled(false); // pastikan tombol aktif
    if(!localStorage.getItem('oss_pwa_dismissed')){
      setTimeout(function(){
        var banner = document.getElementById('oss-pwa-banner');
        if(banner) banner.classList.add('show');
      }, 3000);
    }
  });

  // Berhasil diinstall
  window.addEventListener('appinstalled', function(){
    _pwaInstallEvent = null;
    var banner = document.getElementById('oss-pwa-banner');
    if(banner) banner.classList.remove('show');
    _pwaSetInstalled(true);
    showToast('OSS berhasil diinstall');
  });
})();

function installPWA(){
  if(!_pwaInstallEvent){ return; }
  _pwaInstallEvent.prompt();
  _pwaInstallEvent.userChoice.then(function(choice){
    if(choice.outcome === 'accepted'){
      _pwaInstallEvent = null;
      var banner = document.getElementById('oss-pwa-banner');
      if(banner) banner.classList.remove('show');
      // appinstalled event akan handle _pwaSetInstalled(true)
    }
  });
}

function dismissPWABanner(){
  var banner = document.getElementById('oss-pwa-banner');
  if(banner) banner.classList.remove('show');
  localStorage.setItem('oss_pwa_dismissed', '1');
}

// ── [Duplikat ossDialog dihapus — gunakan ossDialog utama di atas] ──
