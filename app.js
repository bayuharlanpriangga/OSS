


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
    // medBootN=0 = tanpa bootstrap (hanya Sobel); dulu `||5000` membuat 0 diam-diam jadi 5000.
    // Kosong/tak valid/negatif tetap memakai default 5000.
    var _medBN=parseInt(aState.medBootN,10);
    if(!isFinite(_medBN)||_medBN<0) _medBN=5000;
    var res=computeMediation(aState.medX,aState.medM,aState.medY,_medBN);
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
      html+=renderOutAdv_mi(o);
    }

    else if(o.type==='roc'&&o.res){
      html+=renderOutAdv_roc(o);
    }

    else if(o.type==='survival'&&o.res){
      html+=renderOutAdv_survival(o);
    }

    else if(o.type==='cox'&&o.res){
      html+=renderOutAdv_cox(o);
    }

    else if(o.type==='bayes_ttest'&&o.res){
      html+=renderOutAdv_bayes_ttest(o);
    }

    else if(o.type==='bayes_corr'&&o.res){
      html+=renderOutAdv_bayes_corr(o);
    }

    else if(o.type==='bayes_posterior'&&o.res){
      html+=renderOutAdv_bayes_posterior(o);
    }

    else if(o.type==='timeseries'&&o.res){
      html+=renderOutAdv_timeseries(o);
    }

    else if(o.type==='metaanalysis'&&o.res){
      html+=renderOutAdv_metaanalysis(o);
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
// ── renderPowerOutput (kartu hasil Power Analysis di tab Output) —
// DIPINDAH ke js/output/output-power-render.js (F6, split roadmap OSS 2.0,
// 2026-09-21). Dimuat SEBELUM app.js (kategori 4b'', setelah
// output-render-advanced.js). Pemanggil: renderOutput() di atas, cabang
// o.type==='poweranalysis' (1 baris, tidak diubah — resolve lewat
// scope-fallback global). renderModerationOutput() di bawah SENGAJA tetap di
// app.js (target akhirnya output-render-advanced.js, lihat changelog F6).

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

// ════════════════════════════════════════════════════════════════════════
// F7: sigStar, pFmtAPA, buildAPATable, copyAPA, fallbackCopy dipindah ke
// js/output/apa-copy.js (dimuat sebelum app.js)
// ════════════════════════════════════════════════════════════════════════


function removeOutput(id){outputs=outputs.filter(o=>o.id!==id);updateBadges();renderTab('output');}

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
      if(o.res.coefs){
        rows.push(['Variable','B','SE','β','t','p','VIF']);
        o.res.coefs.forEach(function(c,ci){
          rows.push([c.name,c.B,c.SE,ci===0?'—':c.beta,c.t,c.p_fmt,ci===0?'—':(o.res.vif?o.res.vif[ci-1]:'—')]);
        });
      } else {
        // regresi sederhana (SE.linearReg) mengembalikan b0/b1, bukan coefs[]
        rows.push(['Variable','B','SE','t','p']);
        rows.push(['Constant',o.res.b0,o.res.SEb0,o.res.tb0,o.res.pb0_fmt]);
        rows.push([o.xF||'Slope (b₁)',o.res.b1,o.res.SEb1,o.res.tb1,o.res.pb1_fmt]);
      }
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
      rows.push(['Between',o.res.dfB,o.res.ssB,o.res.msB,o.res.F,o.res.p_fmt,o.res.eta2]);
      rows.push(['Within',o.res.dfW,o.res.ssW,o.res.msW,'','','']);
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
