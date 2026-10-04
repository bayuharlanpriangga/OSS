


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


// ── Analyze sub-tab state (aState) + field helpers (numFields/allFields/
// isMiss/missCount) — DIPINDAH ke js/analyze/analyze-subtab-ui.js (C2,
// split roadmap OSS 2.0). File dimuat SEBELUM app.js (kategori "4. Analyze
// layer" di index.html, sebelum <script src="app.js">) — pola sama C1
// (dataset-manager.js): aState object literal murni, field helpers baca
// vars/data di dalam function body (runtime), aman via scope-fallback ke
// global baru tanpa ubah call-site di app.js.

// ── WEIGHT HELPERS — getNEff & getWeightedRows DIPINDAH ke
// js/data/weight-cases.js (B23, 2026-09-15)

// _genSyntaxFromOutput — DIPINDAH ke js/ui-misc/syntax-view.js (2026-10-04)
// showToast / runSafe / addOutput / tryStats — DIPINDAH ke js/core/app-helpers.js (AHP, 2026-10-04)
// escHtml — DIPINDAH ke js/core/html-helpers.js (AHP, 2026-10-04)
// var _syntaxHistory (sudah ada di js/ui-misc/syntax-view.js) & var cmdSelIdx (sudah ada di
// js/ui-misc/cmd-palette.js) — duplikat di app.js DIHAPUS (AHP, 2026-10-04)


// ── ANOVA Source Table renderer (renderAnovaTable) — DIPINDAH ke
// js/output/output-render-basic.js (E3, split roadmap OSS 2.0). File dimuat
// SEBELUM app.js — renderAnovaTable murni string builder (tanpa dependency,
// tanpa top-level call), dipanggil di runtime dari renderOutput() (kasus
// anova2 & anova3) di bawah.


// ── HTML HELPERS (sigBadge/stCard/mkTable/selOpts) — DIPINDAH ke
// js/core/html-helpers.js (C4, split roadmap OSS 2.0). File dimuat
// SEBELUM app.js — stCard/mkTable memanggil escHtml (sejak 2026-10-04 escHtml
// ikut berada di file yang sama, js/core/html-helpers.js), pola sama
// file-file pre-app.js lain.

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


// ════════════════════════════════════════════════════════════════════════
// MULTIPLE IMPUTATION (MICE — Predictive Mean Matching / Normal)
// ════════════════════════════════════════════════════════════════════════
// DIPINDAH ke js/analyze/analyze-form-helpers.js (AFH, 2026-10-04): toggleMIVar


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


// DIPINDAH ke js/analyze/analyze-form-helpers.js (AFH, 2026-10-04): toggleMedM


// DIPINDAH ke js/analyze/analyze-form-helpers.js (AFH, 2026-10-04): toggleEfaVar


// DIPINDAH ke js/analyze/analyze-form-helpers.js (AFH, 2026-10-04): setCfaFactors, renameCfaFactor, toggleCfaVar

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

// ── Run SEM → Output — runSEM DIPINDAH ke js/analyze/analyze-run-advanced.js (2026-10-04) ────────────────────────────────────────────────────


// DIPINDAH ke js/analyze/analyze-form-helpers.js (AFH, 2026-10-04): toggleGlmFactor, toggleGlmCov, toggleGlmMultiDep, toggleHlmL1, toggleHlmL2

// DIPINDAH ke js/analyze/analyze-form-helpers.js (AFH, 2026-10-04): toggleCntPred


// ════════════════════════════════════════════════════════════════════════
// BAYESIAN STATISTICS ENGINE — DIPINDAH ke js/stats-engine/stats-bayesian.js (B20, 2026-09-15)
// (file dimuat SETELAH app.js — lihat catatan B20 di ARCHITECTURE.md)
// SVG Posterior plot (svgBayesPosterior) — DIPINDAH ke js/charts/bayesian-plot.js (E13, 2026-09-20)
// ════════════════════════════════════════════════════════════════════════


// DIPINDAH ke js/analyze/analyze-form-helpers.js (AFH, 2026-10-04): toggleCCAField


// DIPINDAH ke js/analyze/analyze-form-helpers.js (AFH, 2026-10-04): toggleMrXEl

// DIPINDAH ke js/analyze/analyze-form-helpers.js (AFH, 2026-10-04): toggleLgX


// ════════════════════════════════════════════════════════════
// DISCRIMINANT ANALYSIS (LDA) — computeLDA DIPINDAH ke
// js/stats-engine/stats-discriminant-cluster.js (B21, 2026-09-15)
// ════════════════════════════════════════════════════════════

// ── Discriminant chart (svgDiscriminantPlot) — DIPINDAH ke
// js/charts/discriminant-cluster-plot.js (E12, split roadmap OSS 2.0). Dimuat
// SEBELUM app.js (kategori 4, setelah survival-plot.js). Pemanggil: 1 titik
// (preview renderDiscriminantForm() di analyze-form-render.js; tidak dipakai
// output di app.js). Call-site tidak diubah.


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


// DIPINDAH ke js/analyze/analyze-form-helpers.js (AFH, 2026-10-04): toggleAlphaVarEl


// ── Transform (Compute), Recode, Filter Cases (runTransform/runCompute/
// runRecodeRange/runRecodeBinary/runRecodeExact/safeFilter/applyFilter/
// var _origData/clearFilter/completeCases/removeOutlierFilter) —
// DIPINDAH ke js/data/data-transform.js (C10, split roadmap OSS 2.0).
// File dimuat SEBELUM app.js — dependency dibaca di runtime, aman lewat
// scope-fallback ke global. CATATAN: runWeightCases/clearWeightCases
// (di bawah ini) dan runImpute/imputeAllVars (di bawahnya lagi) awalnya TIDAK
// ikut dipindah (lihat catatan lengkap di data-transform.js) — update 2026-10-04:
// runWeightCases → js/analyze/analyze-run-basic.js, clearWeightCases →
// js/analyze/analyze-form-helpers.js, runImpute/imputeAllVars → js/data/imputation.js.


// ── WEIGHT CASES — runWeightCases DIPINDAH ke js/analyze/analyze-run-basic.js (2026-10-04)
// (VIRTUAL WEIGHTING: data fisik TIDAK pernah diexpand; bobot hanya disimpan sebagai
// nama variabel, kalkulasi memakai getWeightedRows() — penjelasan lengkap di file target.)

// DIPINDAH ke js/analyze/analyze-form-helpers.js (AFH, 2026-10-04): clearWeightCases

// ── Imputation (runImpute/imputeAllVars) — DIPINDAH ke
// js/data/imputation.js (temuan pas C10, split roadmap OSS 2.0, file
// baru sesuai keputusan user). File dimuat SEBELUM app.js — dependency
// dibaca di runtime, aman lewat scope-fallback ke global.


// DIPINDAH ke js/analyze/analyze-form-helpers.js (AFH, 2026-10-04): toggleCMFieldEl


// ════════════════════════════════════════════════════════════════════════
// ANALYZE RUNNERS (run*) — SEMUA DIPINDAH (2026-10-04, duplikat di app.js dihapus):
//   - js/analyze/analyze-run-basic.js    — runDesc, runTTest, runOneSamp, runPaired, runRmAnova,
//     runANOVA/2/3, runCorr, runPartialCorr, runReg, runMultipleReg, runNP, runAlpha, runKappa,
//     runWeightCases
//   - js/analyze/analyze-run-advanced.js — runPowerAnalysis, runModeration, runMultipleImputation,
//     runROC, runSurvival, runCoxRegression, runMediation, runEFA, runCFA, runSEM, runHLM,
//     runMANOVA, runRepeatedMeasures, runGLM/runPoissonGLM/runNegBinGLM, runTimeSeries,
//     runBayes/runBayesCorr/runBayesPosterior, runCCA, runLogistic, runDiscriminant, runCluster,
//     runHierarchicalReg, lnGammaSimple
// ════════════════════════════════════════════════════════════════════════

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
// AI VIEW — DIPINDAH ke js/ui-misc/ai-view.js (I3). escHtml (helper global yang dipakai banyak file)
// sudah DIPINDAH ke js/core/html-helpers.js (AHP, 2026-10-04).
// ════════════════════════════════════════════════════════════════════════

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
