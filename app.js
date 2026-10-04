


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
// _genSyntaxFromOutput — DIPINDAH ke js/ui-misc/syntax-view.js (2026-10-04)
var _syntaxHistory=window._syntaxHistory||[];

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

// DIPINDAH ke js/analyze/analyze-form-helpers.js (AFH, 2026-10-04): toggleModCov

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
    var res=computePower(pw.pwTest||'ttest_2samp',parseFloat(pw.pwAlpha)||0.05,parseFloat(pw.pwPower)||0.80,parseFloat(pw.pwEffect)||0.5,parseInt(pw.pwGroups||2),parseInt(pw.pwTails||2),pw.pwSolve||'n',parseInt(pw.pwN||30),parseInt(pw.pwPreds||1));
    var testLabels3={'ttest_2samp':'Independent T-Test','ttest_1samp':'One-Sample T-Test','ttest_paired':'Paired T-Test','anova_oneway':'One-Way ANOVA','correlation':'Correlation','regression_r2':'Multiple Regression','chisq':'Chi-Square'};
    var title='Power Analysis ('+testLabels3[pw.pwTest||'ttest_2samp']+'): N='+res.n+', power='+SE.f4(res.power*100)+'%, d/f/r='+SE.f4(res.effect);
    addOutput({type:'poweranalysis',title:title,res:res,pwTest:pw.pwTest,pwAlpha:pw.pwAlpha,pwPower:pw.pwPower,pwEffect:pw.pwEffect,pwGroups:pw.pwGroups,pwTails:pw.pwTails,pwSolve:pw.pwSolve,pwPreds:pw.pwPreds});
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
// DIPINDAH ke js/analyze/analyze-form-helpers.js (AFH, 2026-10-04): toggleMIVar

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
// DIPINDAH ke js/analyze/analyze-form-helpers.js (AFH, 2026-10-04): toggleROCCompare

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
// DIPINDAH ke js/analyze/analyze-form-helpers.js (AFH, 2026-10-04): toggleSurvCov


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

// DIPINDAH ke js/analyze/analyze-form-helpers.js (AFH, 2026-10-04): toggleMedM

function runMediation(){
  runSafe(function(){
    if(!aState.medX) throw new Error('Select Independent Variable (X)');
    if(!aState.medY) throw new Error('Select Dependent Variable (Y)');
    if(!aState.medM||!aState.medM.length) throw new Error('Select at least 1 Mediator (M)');
    // medBootN=0 = tanpa bootstrap (hanya Sobel); dulu `||5000` membuat 0 diam-diam jadi 5000.
    // Kosong/tak valid/negatif tetap memakai default 5000.
    var _medBN=parseInt(aState.medBootN,10);
    if(!isFinite(_medBN)||_medBN<0) _medBN=5000;
    var res=computeMediation(aState.medX,aState.medM,aState.medY,_medBN);
    var title='Mediation: '+aState.medX+' → ['+aState.medM.join(', ')+'] → '+aState.medY;
    addOutput({type:'mediation',title:title,res:res,medX:aState.medX,medY:aState.medY,medM:aState.medM.slice()});
  },'Mediation Analysis');
}

// DIPINDAH ke js/analyze/analyze-form-helpers.js (AFH, 2026-10-04): toggleEfaVar

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

// DIPINDAH ke js/analyze/analyze-form-helpers.js (AFH, 2026-10-04): setCfaFactors, renameCfaFactor, toggleCfaVar
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

// DIPINDAH ke js/analyze/analyze-form-helpers.js (AFH, 2026-10-04): semAddLatent, semRemoveLatent, semRenameLatent, semToggleIndicator, semAddPath, semRemovePath

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



// DIPINDAH ke js/analyze/analyze-form-helpers.js (AFH, 2026-10-04): toggleGlmFactor, toggleGlmCov, toggleGlmMultiDep, toggleHlmL1, toggleHlmL2
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

// DIPINDAH ke js/analyze/analyze-form-helpers.js (AFH, 2026-10-04): toggleCntPred

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

// DIPINDAH ke js/analyze/analyze-form-helpers.js (AFH, 2026-10-04): toggleCCAField

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

// DIPINDAH ke js/analyze/analyze-form-helpers.js (AFH, 2026-10-04): toggleMrXEl

// DIPINDAH ke js/analyze/analyze-form-helpers.js (AFH, 2026-10-04): toggleLgX

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

// DIPINDAH ke js/analyze/analyze-form-helpers.js (AFH, 2026-10-04): toggleAlphaVarEl
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

// DIPINDAH ke js/analyze/analyze-form-helpers.js (AFH, 2026-10-04): clearWeightCases

// ── Imputation (runImpute/imputeAllVars) — DIPINDAH ke
// js/data/imputation.js (temuan pas C10, split roadmap OSS 2.0, file
// baru sesuai keputusan user). File dimuat SEBELUM app.js — dependency
// dibaca di runtime, aman lewat scope-fallback ke global.


// DIPINDAH ke js/analyze/analyze-form-helpers.js (AFH, 2026-10-04): toggleCMFieldEl



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
// ── Render detail per-tipe (F3, F4, F5) — DIPINDAH ke file terpisah, dimuat
// SEBELUM app.js. Rantai `if/else if` per `o.type` di bawah MASIH di sini (1 baris
// per cabang: `html+=renderOutBasic_x(o);` / `html+=renderOutAdv_x(o);`) sampai
// dispatcher tabel/`switch` dibuat; tiap fungsi menerima `o` dan mengembalikan
// string HTML isi kartu.
//   F3: js/output/output-render-basic.js    — renderOutBasic_<tipe> (21 tipe:
//       descriptive s/d manova; `poisson` juga melayani `negbin`).
//   F4: js/output/output-render-advanced.js — renderOutAdv_<tipe> (9 tipe: hlm,
//       alpha, kappa, efa, cfa, sem, mediation, discriminant, cluster).
//   F5: js/output/output-render-advanced.js — renderOutAdv_<tipe> (9 tipe: mi,
//       roc, survival, cox, bayes_ttest, bayes_corr, bayes_posterior,
//       timeseries, metaanalysis).
//   `poweranalysis` dan `moderation` sengaja TIDAK dibungkus lagi: cabangnya
//   sudah 1 baris yang memanggil `renderPowerOutput`/`renderModerationOutput`
//   (F6 untuk yang pertama; yang kedua masih di app.js).

// ════════════════════════════════════════════════════════════════════════
// OUTPUT LAYER — DIPINDAH:
//   - renderOutput (dispatcher) & removeOutput → js/output/output-view-shell.js (2026-10-04)
//   - renderModerationOutput → js/output/output-render-advanced.js (2026-10-04)
//   - renderPowerOutput → js/output/output-power-render.js (F6, 2026-09-21)
//   - renderOutBasic_* → js/output/output-render-basic.js (F3, 2026-09-21)
//   - renderOutAdv_* → js/output/output-render-advanced.js (F4+F5, 2026-09-21)
// ════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════
// AI VIEW — DIPINDAH ke js/ui-misc/ai-view.js (I3). escHtml di bawah sengaja TETAP di sini
// (helper global yang dipakai banyak file).
// ════════════════════════════════════════════════════════════════════════
function escHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

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



// ════════════════════════════════════════════════════════════════════════
// CMD PALETTE — DIPINDAH ke js/ui-misc/cmd-palette.js (I4, dimuat sebelum app.js)
// ════════════════════════════════════════════════════════════════════════

// ✅ H1 (2026-09-23): saveSession/loadSession/autosave-interval/
// exportDataCSV/generateAPAReport SUDAH DIPINDAH ke
// js/session/session-save-restore.js (digabung 1 file — 4 fungsi ini
// memang 1 kelompok "SESSION + EXPORT" yang sama, sesuai catatan
// dead-code H1/H2 di atas). Lihat definisi aktifnya di file baru.

// ════════════════════════════════════════════════════════════
// HIERARCHICAL REGRESSION
// ════════════════════════════════════════════════════════════
// DIPINDAH ke js/analyze/analyze-form-helpers.js (AFH, 2026-10-04): toggleHrBlock

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

// ═════════════════════════════════════════════════════════════════
// G8: exportToExcel + _doExportExcel dipindah ke js/export/export-excel.js
// (dimuat sebelum app.js, setelah export-dialog.js)
// ═════════════════════════════════════════════════════════════════

// ═════════════════════════════════════════════════════════════════
// G4: _exportOutputDialog (Per-Output Export Dialog) dipindah ke
// js/export/export-dialog.js (dimuat sebelum app.js, setelah
// export-word.js)
// ═════════════════════════════════════════════════════════════════

// ═════════════════════════════════════════════════════════════════
// G2: _buildSingleOutputHTML, _wordGlmEffectsTable, _wordFmtVal,
// _wordGenericRes dipindah ke js/export/export-word.js
// (dimuat sebelum app.js, sama file dengan G1)
// ═════════════════════════════════════════════════════════════════

// ═════════════════════════════════════════════════════════════════
// G3: _getChartSVGForExport dipindah ke js/export/export-word.js
// (dimuat sebelum app.js, sama file dengan G1/G2)
// ═════════════════════════════════════════════════════════════════

// ═════════════════════════════════════════════════════════════════
// G5: exportWordDialog (Export Word Dialog — bulk, pilih group/sub-type)
// dipindah ke js/export/export-dialog.js (append, file sama dengan G4)
// ═════════════════════════════════════════════════════════════════

// ═════════════════════════════════════════════════════════════════
// G6: _exportBulkWord (Build & download selected outputs as .doc, bulk)
// dipindah ke js/export/export-word.js (append, file sama dengan G1-G3)
// ═════════════════════════════════════════════════════════════════


// ═════════════════════════════════════════════════════════════════
// G7: exportToWord, _wordCSS, _buildWordHTML, _wordTable, _escHtml
// dipindah ke js/export/export-word.js (append, file sama dengan G1-G3, G6)
// ═════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════
// ACTIVITY LOADING POPUP SYSTEM — DIPINDAH ke js/ui-misc/activity-loading-popup.js (I5)
// ⚠️ dimuat SESUDAH app.js (lihat header file itu untuk alasannya).
// ════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════
// FILE SYSTEM (H3–H9) — duplikat lama DIHAPUS 2026-10-04. Kode aktifnya ada di
// js/session/session-save-restore.js (H3–H5) dan js/session/oss-filesystem.js (H6–H9).
// ════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════
// PWA (Service Worker + Install Prompt) — DIPINDAH ke js/ui-misc/pwa-install.js (I6)
// ════════════════════════════════════════════════════════════

// ── [Duplikat ossDialog dihapus — gunakan ossDialog utama di atas] ──
