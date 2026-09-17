


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

// ════════════════════════════════════════════════════════════════════════
// SVG CHARTS
// ════════════════════════════════════════════════════════════════════════
var PAL2=['#818cf8','#34d399','#fbbf24','#f472b6','#60a5fa','#a78bfa','#fb923c','#2dd4bf'];

// ── Interaction Plot (Two-Way or Three-Way ANOVA) ──────────────────────
// cellMeansTable: [{level:A_level, byB:[{level:B_level, mean, n}]}]
// xLabel: Factor B levels (x-axis), lineLabel: Factor A levels (lines)
function svgInteractionPlot(cellMeansTable, xLabel, lineLabel, depLabel, W, H){
  W=W||420; H=H||220;
  if(!cellMeansTable||!cellMeansTable.length) return '<div style="color:#64748b;font-size:11px">No data</div>';
  var levB = cellMeansTable[0].byB.map(function(b){return b.level;});
  var allMeans = cellMeansTable.flatMap(function(row){return row.byB.map(function(c){return parseFloat(c.mean);}).filter(isFinite);});
  if(!allMeans.length) return '<div style="color:#64748b;font-size:11px">No valid cell means</div>';
  var minV = Math.min.apply(null,allMeans), maxV = Math.max.apply(null,allMeans);
  var pad = (maxV-minV)*0.15 || 0.5;
  minV -= pad; maxV += pad;

  var P={l:46,r:20,t:18,b:48};
  var cw=W-P.l-P.r, ch=H-P.t-P.b;
  var xStep = levB.length>1 ? cw/(levB.length-1) : cw/2;
  var xPos = function(i){return P.l + (levB.length>1 ? i*xStep : cw/2);};
  var yScale = function(v){return P.t + ch - ((v-minV)/(maxV-minV))*ch;};

  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block;overflow:visible">';

  // Grid lines
  var nGrid=4;
  for(var gi=0;gi<=nGrid;gi++){
    var gv=minV+gi*(maxV-minV)/nGrid;
    var gy=yScale(gv);
    svg+='<line x1="'+P.l+'" y1="'+gy+'" x2="'+(P.l+cw)+'" y2="'+gy+'" stroke="rgba(255,255,255,.05)" stroke-width="1"/>';
    svg+='<text x="'+(P.l-4)+'" y="'+(gy+3.5)+'" text-anchor="end" font-size="8.5" fill="#475569">'+gv.toFixed(2)+'</text>';
  }
  // Axes
  svg+='<line x1="'+P.l+'" y1="'+P.t+'" x2="'+P.l+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.12)" stroke-width="1.5"/>';
  svg+='<line x1="'+P.l+'" y1="'+(P.t+ch)+'" x2="'+(P.l+cw)+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.12)" stroke-width="1.5"/>';

  // X axis labels (Factor B)
  levB.forEach(function(lbl,i){
    svg+='<text x="'+xPos(i)+'" y="'+(P.t+ch+16)+'" text-anchor="middle" font-size="9" fill="#94a3b8">'+escHtml(lbl)+'</text>';
  });
  // X axis title
  svg+='<text x="'+(P.l+cw/2)+'" y="'+(H-4)+'" text-anchor="middle" font-size="9.5" fill="#64748b">'+escHtml(xLabel)+'</text>';
  // Y axis title
  svg+='<text x="11" y="'+(P.t+ch/2)+'" text-anchor="middle" font-size="9.5" fill="#64748b" transform="rotate(-90 11 '+(P.t+ch/2)+')">'+depLabel+'</text>';

  // Lines per Factor A level
  cellMeansTable.forEach(function(row,ri){
    var col=PAL2[ri%PAL2.length];
    var pts=row.byB.map(function(c,i){
      var m=parseFloat(c.mean);
      if(!isFinite(m)) return null;
      return {x:xPos(i), y:yScale(m), m:m, n:c.n, lbl:c.level};
    }).filter(Boolean);
    if(pts.length<1) return;
    // Line
    var d=pts.map(function(p,i){return (i===0?'M':'L')+p.x+' '+p.y;}).join(' ');
    svg+='<path d="'+d+'" fill="none" stroke="'+col+'" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" opacity="0.9"/>';
    // Dots + tooltips
    pts.forEach(function(p){
      svg+='<circle cx="'+p.x+'" cy="'+p.y+'" r="5" fill="'+col+'" stroke="rgba(14,6,24,.7)" stroke-width="1.5" opacity="0.95"><title>'+row.level+' / '+p.lbl+': M='+p.m.toFixed(3)+' (n='+p.n+')</title></circle>';
      svg+='<text x="'+p.x+'" y="'+(p.y-9)+'" text-anchor="middle" font-size="7.5" fill="'+col+'" opacity="0.85">'+p.m.toFixed(2)+'</text>';
    });
  });

  // Legend (Factor A)
  var legX=P.l, legY=P.t-2;
  svg+='<text x="'+legX+'" y="'+legY+'" font-size="8" fill="#64748b">'+lineLabel+': </text>';
  cellMeansTable.forEach(function(row,ri){
    var lx=legX+50+ri*80, col=PAL2[ri%PAL2.length];
    svg+='<line x1="'+lx+'" y1="'+(legY-3.5)+'" x2="'+(lx+14)+'" y2="'+(legY-3.5)+'" stroke="'+col+'" stroke-width="2.2"/>';
    svg+='<circle cx="'+(lx+7)+'" cy="'+(legY-3.5)+'" r="3.5" fill="'+col+'"/>';
    svg+='<text x="'+(lx+18)+'" y="'+legY+'" font-size="8.5" fill="#94a3b8">'+row.level+'</text>';
  });

  svg+='</svg>';
  return svg;
}

// ── ANOVA Source Table renderer ────────────────────────────────────────
function renderAnovaTable(effects, error, total){
  var h='<div class="tbl-wrap"><table><thead><tr>';
  ['Source','SS','df','MS','F','p','η²','ηₚ²'].forEach(function(c){h+='<th>'+c+'</th>';});
  h+='</tr></thead><tbody>';
  effects.forEach(function(e,i){
    var sc=e.sig?'#34d399':'#94a3b8';
    h+='<tr class="'+(i%2?'':'alt')+'">';
    h+='<td style="font-weight:700;color:'+(e.source.indexOf('×')>=0?'#fbbf24':'#c084fc')+'">'+e.source+'</td>';
    ['SS','df','MS','F'].forEach(function(k){h+='<td style="font-family:monospace">'+e[k]+'</td>';});
    h+='<td><span style="font-weight:700;color:'+sc+'">'+e.p_fmt+'</span>'+(e.sig?' <span style="font-size:9px;color:#34d399">*</span>':'')+'</td>';
    h+='<td style="font-family:monospace">'+e.eta2+'</td>';
    h+='<td style="font-family:monospace">'+e.pEta2+'</td>';
    h+='</tr>';
  });
  // Error row
  h+='<tr style="background:rgba(255,255,255,.015)"><td style="color:#64748b">Error</td>';
  h+='<td style="font-family:monospace">'+error.SS+'</td><td>'+error.df+'</td><td style="font-family:monospace">'+error.MS+'</td><td colspan="4">—</td></tr>';
  // Total row
  if(total){
    h+='<tr style="background:rgba(255,255,255,.015)"><td style="color:#64748b;font-weight:700">Total</td>';
    h+='<td style="font-family:monospace">'+total.SS+'</td><td>'+total.df+'</td><td colspan="5">—</td></tr>';
  }
  h+='</tbody></table></div>';
  return h;
}

function svgScreePlot(eigenvalues, nFactors, W, H){
  W=W||380; H=H||150;
  var vals=eigenvalues.map(function(v){return parseFloat(v);});
  var maxEV=Math.max(Math.max.apply(null,vals),1.2);
  var P={l:36,r:16,t:14,b:32};
  var cw=W-P.l-P.r, ch=H-P.t-P.b;
  var n=vals.length;
  var xStep=cw/(n-1||1);
  var yScale=function(v){return ch-(v/maxEV)*ch;};

  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block;overflow:visible">';
  // Grid lines
  [0,0.25,0.5,0.75,1].forEach(function(f){
    var yv=f*maxEV;
    var y=P.t+yScale(yv);
    svg+='<line x1="'+P.l+'" y1="'+y+'" x2="'+(P.l+cw)+'" y2="'+y+'" stroke="rgba(255,255,255,.06)" stroke-width="1"/>';
    svg+='<text x="'+(P.l-4)+'" y="'+(y+4)+'" text-anchor="end" font-size="8" fill="#475569">'+yv.toFixed(1)+'</text>';
  });
  // Eigenvalue=1 reference line
  var y1=P.t+yScale(1);
  svg+='<line x1="'+P.l+'" y1="'+y1+'" x2="'+(P.l+cw)+'" y2="'+y1+'" stroke="rgba(251,191,36,.35)" stroke-width="1.5" stroke-dasharray="4,3"/>';
  svg+='<text x="'+(P.l+cw+3)+'" y="'+(y1+4)+'" font-size="8" fill="#fbbf24">1.0</text>';

  // Area fill under scree line (factors retained)
  var retainedPts='';
  var allPts='';
  vals.forEach(function(v,i){
    var x=P.l+i*xStep, y=P.t+yScale(v);
    if(i<nFactors) retainedPts+=(i===0?'M':' L')+x+' '+y;
    allPts+=(i===0?'M':' L')+x+' '+y;
  });
  // Fill retained area
  if(nFactors>0){
    var retFill=retainedPts+' L'+(P.l+(nFactors-1)*xStep)+' '+(P.t+ch)+' L'+P.l+' '+(P.t+ch)+' Z';
    svg+='<path d="'+retFill+'" fill="rgba(165,243,252,.08)"/>';
  }
  // Line
  svg+='<path d="'+allPts+'" fill="none" stroke="rgba(165,243,252,.5)" stroke-width="2" stroke-linejoin="round"/>';

  // Dots
  vals.forEach(function(v,i){
    var x=P.l+i*xStep, y=P.t+yScale(v);
    var isRetained=i<nFactors;
    svg+='<circle cx="'+x+'" cy="'+y+'" r="'+(isRetained?5:3.5)+'" fill="'+(isRetained?'#a5f3fc':'#475569')+'" stroke="'+(isRetained?'rgba(165,243,252,.6)':'rgba(71,85,105,.4)')+'" stroke-width="1.5"/>';
    svg+='<text x="'+x+'" y="'+(y-8)+'" text-anchor="middle" font-size="7.5" fill="'+(isRetained?'#a5f3fc':'#64748b')+'">'+v+'</text>';
    svg+='<text x="'+x+'" y="'+(P.t+ch+14)+'" text-anchor="middle" font-size="8" fill="#475569">F'+(i+1)+'</text>';
  });
  svg+='</svg>';
  return svg;
}

function svgHistogram(data,field,W=400,H=160){
  const nums=SE.validNums(data.map(r=>r[field]));
  if(nums.length<2)return '<div class="chart-empty">Need ≥2 values</div>';
  const mn=Math.min(...nums),mx=Math.max(...nums);
  const bins=Math.min(Math.max(5,Math.ceil(Math.sqrt(nums.length))),14);
  const step=mx===mn?1:(mx-mn)/bins;
  const freq=Array(bins).fill(0);
  nums.forEach(v=>{const i=Math.min(Math.floor((v-mn)/step),bins-1);freq[i]++;});
  const mF=Math.max(...freq)||1;
  const P={l:30,r:8,t:8,b:26};
  const bw=(W-P.l-P.r)/bins;
  let svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block;overflow:hidden">';
  freq.forEach((f,i)=>{const bh=(f/mF)*(H-P.t-P.b),x=P.l+i*bw,y=H-P.b-bh;
    svg+='<rect x="'+(x+1.5)+'" y="'+y+'" width="'+(bw-3)+'" height="'+bh+'" rx="3" fill="'+PAL2[i%8]+'" opacity=".82"/>';
    if(i%Math.ceil(bins/6)===0)svg+='<text x="'+(x+bw/2)+'" y="'+(H-P.b+14)+'" text-anchor="middle" font-size="8" fill="#64748b">'+(mn+i*step).toFixed(0)+'</text>';
  });
  [0,.5,1].forEach(v=>svg+='<text x="'+(P.l-3)+'" y="'+(H-P.b-v*(H-P.t-P.b)+4)+'" text-anchor="end" font-size="8" fill="#64748b">'+Math.round(v*mF)+'</text>');
  svg+='<line x1="'+P.l+'" y1="'+P.t+'" x2="'+P.l+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  svg+='<line x1="'+P.l+'" y1="'+(H-P.b)+'" x2="'+(W-P.r)+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  return svg+'</svg>';
}

function svgBoxplot(data,field,groupField,W=400,H=160){
  const groups=groupField
    ?[...new Set(data.map(r=>r[groupField]))].sort().map(g=>({label:String(g),vals:SE.validNums(data.filter(r=>r[groupField]===g).map(r=>r[field]))}))
    :[{label:field,vals:SE.validNums(data.map(r=>r[field]))}];
  const all=groups.flatMap(g=>g.vals);
  if(!all.length)return '<div class="chart-empty">No data</div>';
  const gMin=Math.min(...all),gMax=Math.max(...all);
  const P={l:34,r:10,t:12,b:20};
  const ty=v=>H-P.b-((v-gMin)/((gMax-gMin)||1))*(H-P.t-P.b);
  const slotW=(W-P.l-P.r)/groups.length;
  const bw=Math.max(12,Math.min(42,slotW-12));
  let svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block;overflow:visible">';
  [0,.25,.5,.75,1].forEach(v=>{const val=gMin+v*(gMax-gMin);
    svg+='<line x1="'+P.l+'" x2="'+(W-P.r)+'" y1="'+ty(val)+'" y2="'+ty(val)+'" stroke="#1e293b" stroke-width=".5" stroke-dasharray="3,3"/>';
    svg+='<text x="'+(P.l-3)+'" y="'+(ty(val)+4)+'" text-anchor="end" font-size="8" fill="#64748b">'+val.toFixed(0)+'</text>';
  });
  groups.forEach((g,gi)=>{
    if(g.vals.length<4)return;
    const s=[...g.vals].sort((a,b)=>a-b);
    const q1=SE.quantile(s,.25),med=SE.quantile(s,.5),q3=SE.quantile(s,.75);
    const iqr=q3-q1,lo=q1-1.5*iqr,hi=q3+1.5*iqr;
    const wMin=Math.max(s[0],lo),wMax=Math.min(s[s.length-1],hi);
    const outs=g.vals.filter(v=>v<lo||v>hi);
    const cx=P.l+(gi+.5)*slotW,col=PAL2[gi%8];
    svg+='<rect x="'+(cx-bw/2)+'" y="'+ty(q3)+'" width="'+bw+'" height="'+Math.max(1,ty(q1)-ty(q3))+'" fill="'+col+'" fill-opacity=".2" stroke="'+col+'" stroke-width="1.5" rx="2"/>';
    svg+='<line x1="'+(cx-bw/2)+'" x2="'+(cx+bw/2)+'" y1="'+ty(med)+'" y2="'+ty(med)+'" stroke="'+col+'" stroke-width="2.5"/>';
    svg+='<line x1="'+cx+'" x2="'+cx+'" y1="'+ty(wMax)+'" y2="'+ty(q3)+'" stroke="'+col+'" stroke-width="1" stroke-dasharray="3,2"/>';
    svg+='<line x1="'+cx+'" x2="'+cx+'" y1="'+ty(q1)+'" y2="'+ty(wMin)+'" stroke="'+col+'" stroke-width="1" stroke-dasharray="3,2"/>';
    [[wMin,5],[wMax,5]].forEach(([v,hw])=>svg+='<line x1="'+(cx-hw)+'" x2="'+(cx+hw)+'" y1="'+ty(v)+'" y2="'+ty(v)+'" stroke="'+col+'" stroke-width="1.5"/>');
    outs.forEach(v=>svg+='<circle cx="'+cx+'" cy="'+ty(v)+'" r="3" fill="none" stroke="'+col+'" stroke-width="1.5"/>');
    svg+='<text x="'+cx+'" y="'+(H-P.b+14)+'" text-anchor="middle" font-size="9" fill="#94a3b8">'+g.label+'</text>';
  });
  svg+='<line x1="'+P.l+'" y1="'+P.t+'" x2="'+P.l+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  svg+='<line x1="'+P.l+'" y1="'+(H-P.b)+'" x2="'+(W-P.r)+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  return svg+'</svg>';
}

function svgScatter(dataArr,xField,yField,W=400,H=200){
  const pts=dataArr.filter(r=>SE.isV(r[xField])&&SE.isV(r[yField]));
  if(pts.length<3)return '<div class="chart-empty">Need ≥3 pairs</div>';
  const xs=pts.map(r=>r[xField]),ys=pts.map(r=>r[yField]);
  const xMin=Math.min(...xs),xMax=Math.max(...xs),yMin=Math.min(...ys),yMax=Math.max(...ys);
  const P={l:36,r:12,t:12,b:32};
  const tx=x=>P.l+((x-xMin)/((xMax-xMin)||1))*(W-P.l-P.r);
  const ty=y=>H-P.b-((y-yMin)/((yMax-yMin)||1))*(H-P.t-P.b);
  let svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block;overflow:visible">';
  let rLabel='';
  try{
    const cr=SE.pearsonR(xs,ys),sx=SE.std(xs),sy=SE.std(ys),mx=SE.mean(xs),my=SE.mean(ys);
    const sl=parseFloat(cr.r)*(sy/sx),ic=my-sl*mx;
    svg+='<line x1="'+tx(xMin)+'" y1="'+ty(sl*xMin+ic)+'" x2="'+tx(xMax)+'" y2="'+ty(sl*xMax+ic)+'" stroke="#f472b6" stroke-width="1.5" stroke-dasharray="5,3" opacity=".8"/>';
    rLabel='r='+cr.r+(parseFloat(cr.p)<.001?' p<.001':' p='+cr.p_fmt);
  }catch{}
  pts.forEach(r=>svg+='<circle cx="'+tx(r[xField])+'" cy="'+ty(r[yField])+'" r="5" fill="#818cf8" fill-opacity=".7" stroke="#a78bfa" stroke-width="1.2"/>');
  [xMin,(xMin+xMax)/2,xMax].forEach(v=>svg+='<text x="'+tx(v)+'" y="'+(H-P.b+14)+'" text-anchor="middle" font-size="8" fill="#64748b">'+v.toFixed(0)+'</text>');
  [yMin,(yMin+yMax)/2,yMax].forEach(v=>svg+='<text x="'+(P.l-4)+'" y="'+(ty(v)+4)+'" text-anchor="end" font-size="8" fill="#64748b">'+v.toFixed(0)+'</text>');
  svg+='<text x="'+(W/2)+'" y="'+H+'" text-anchor="middle" font-size="9" fill="#475569">'+escHtml(xField)+'</text>';
  if(rLabel)svg+='<text x="'+(W-P.r)+'" y="'+(P.t+2)+'" text-anchor="end" font-size="8" fill="#f472b6">'+escHtml(rLabel)+'</text>';
  svg+='<line x1="'+P.l+'" y1="'+P.t+'" x2="'+P.l+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  svg+='<line x1="'+P.l+'" y1="'+(H-P.b)+'" x2="'+(W-P.r)+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  return svg+'</svg>';
}

function svgQQ(dataArr,field,W=380,H=190){
  const nums=SE.validNums(dataArr.map(r=>r[field])).sort((a,b)=>a-b);
  if(nums.length<5)return '<div class="chart-empty">Need ≥5 values</div>';
  const n=nums.length,m=SE.mean(nums),s=SE.std(nums);
  const theo=nums.map((_,i)=>SE.normInv((i+.5)/n));
  const P={l:38,r:12,t:12,b:30};
  const tMin=Math.min(...theo),tMax=Math.max(...theo);
  const sMin=Math.min(...nums),sMax=Math.max(...nums);
  const tx=v=>P.l+((v-tMin)/((tMax-tMin)||1))*(W-P.l-P.r);
  const ty=v=>H-P.b-((v-sMin)/((sMax-sMin)||1))*(H-P.t-P.b);
  let svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block;overflow:hidden">';
  svg+='<defs><clipPath id="qq-clip"><rect x="'+P.l+'" y="'+P.t+'" width="'+(W-P.l-P.r)+'" height="'+(H-P.t-P.b)+'"/></clipPath></defs>';
  svg+='<line clip-path="url(#qq-clip)" x1="'+tx(tMin)+'" y1="'+ty(m+s*tMin)+'" x2="'+tx(tMax)+'" y2="'+ty(m+s*tMax)+'" stroke="#f472b6" stroke-width="1.5" stroke-dasharray="5,3" opacity=".7"/>';
  theo.forEach((t,i)=>svg+='<circle cx="'+tx(t)+'" cy="'+ty(nums[i])+'" r="4" fill="#818cf8" fill-opacity=".75" stroke="#a78bfa" stroke-width="1"/>');
  [tMin,0,tMax].forEach(v=>svg+='<text x="'+tx(v)+'" y="'+(H-P.b+13)+'" text-anchor="middle" font-size="8" fill="#64748b">'+v.toFixed(1)+'</text>');
  [sMin,(sMin+sMax)/2,sMax].forEach(v=>svg+='<text x="'+(P.l-4)+'" y="'+(ty(v)+4)+'" text-anchor="end" font-size="8" fill="#64748b">'+v.toFixed(0)+'</text>');
  svg+='<text x="'+(W/2)+'" y="'+H+'" text-anchor="middle" font-size="9" fill="#475569">Theoretical Quantiles</text>';
  svg+='<line x1="'+P.l+'" y1="'+P.t+'" x2="'+P.l+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  svg+='<line x1="'+P.l+'" y1="'+(H-P.b)+'" x2="'+(W-P.r)+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  return svg+'</svg>';
}

function svgResidual(res,W=380,H=170){
  if(!res)return '';
  const xs=res.yHat,ys=res.residuals;
  const xMin=Math.min(...xs),xMax=Math.max(...xs),yMin=Math.min(...ys),yMax=Math.max(...ys);
  const P={l:38,r:12,t:12,b:30};
  const tx=v=>P.l+((v-xMin)/((xMax-xMin)||1))*(W-P.l-P.r);
  const ty=v=>H-P.b-((v-yMin)/((yMax-yMin)||1))*(H-P.t-P.b);
  let svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block;overflow:visible">';
  svg+='<line x1="'+P.l+'" x2="'+(W-P.r)+'" y1="'+ty(0)+'" y2="'+ty(0)+'" stroke="#64748b" stroke-dasharray="4,3"/>';
  xs.forEach((x,i)=>svg+='<circle cx="'+tx(x)+'" cy="'+ty(ys[i])+'" r="4" fill="'+(ys[i]>=0?'#818cf8':'#f472b6')+'" fill-opacity=".72" stroke="#a78bfa" stroke-width="1"/>');
  [xMin,(xMin+xMax)/2,xMax].forEach(v=>svg+='<text x="'+tx(v)+'" y="'+(H-P.b+13)+'" text-anchor="middle" font-size="8" fill="#64748b">'+v.toFixed(0)+'</text>');
  svg+='<text x="'+(W/2)+'" y="'+H+'" text-anchor="middle" font-size="9" fill="#475569">Fitted Values</text>';
  svg+='<line x1="'+P.l+'" y1="'+P.t+'" x2="'+P.l+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  svg+='<line x1="'+P.l+'" y1="'+(H-P.b)+'" x2="'+(W-P.r)+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  return svg+'</svg>';
}

function svgCorrMatrix(dataArr,fields,W=400,H=400){
  const n=fields.length;
  if(n<2)return '<div class="chart-empty">Select ≥2 variables</div>';
  const cell=Math.floor(Math.min(W,H)/n);
  const mat=[];
  for(let i=0;i<n;i++){mat[i]=[];for(let j=0;j<n;j++){
    if(i===j){mat[i][j]=1;continue;}
    try{mat[i][j]=parseFloat(SE.pearsonR(dataArr.map(r=>r[fields[i]]),dataArr.map(r=>r[fields[j]])).r)||0;}catch{mat[i][j]=0;}
  }}
  function rColor(r){if(r>0){const t=r;return 'rgb('+Math.round(255*(1-t*.5))+','+Math.round(255*(1-t*.3))+',255)';}const t=Math.abs(r);return 'rgb(255,'+Math.round(255*(1-t*.3))+','+Math.round(255*(1-t*.5))+')';}
  const pad=54;
  let svg='<svg viewBox="0 0 '+(W+pad)+' '+(H+pad)+'" style="width:100%;height:auto;display:block;overflow:visible">';
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){
    const x=pad+j*cell,y=i*cell,r=mat[i][j];
    svg+='<rect x="'+x+'" y="'+y+'" width="'+cell+'" height="'+cell+'" fill="'+rColor(r)+'" opacity="'+(Math.abs(r)*.85+.15)+'"/>';
    svg+='<text x="'+(x+cell/2)+'" y="'+(y+cell/2+4)+'" text-anchor="middle" font-size="'+(cell>40?9:7)+'" fill="'+(Math.abs(r)>.5?'#fff':'#334155')+'" font-weight="600">'+r.toFixed(2)+'</text>';
  }
  fields.forEach((f,i)=>{
    svg+='<text x="'+(pad+i*cell+cell/2)+'" y="'+(H+pad-4)+'" text-anchor="middle" font-size="9" fill="#94a3b8" transform="rotate(-30,'+(pad+i*cell+cell/2)+','+(H+pad-4)+')">'+f.slice(0,8)+'</text>';
    svg+='<text x="'+(pad-4)+'" y="'+(i*cell+cell/2+4)+'" text-anchor="end" font-size="9" fill="#94a3b8">'+f.slice(0,8)+'</text>';
  });
  return svg+'</svg>';
}

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




function renderASub(){
  const el=document.getElementById('a-content');
  if(!el)return;
  const nF=numFields(),aF=allFields();
  let html='';

  if(currentASub==='descriptive'){
    html+=renderDescriptiveForm();
  }

  else if(currentASub==='ttest'){
    html+=renderTtestForm();
  }

  else if(currentASub==='onesamp'){
    html+=renderOnesampForm();
  }

  else if(currentASub==='paired'){
    html+=renderPairedForm();
  }

  else if(currentASub==='rmanova'){
    // RM-ANOVA: 3+ repeated measures time points
    var rmVars=aState.rmVars||[];
    // auto-populate if empty and enough numeric vars
    if(rmVars.length===0&&nF.length>=3) rmVars=nF.slice(0,Math.min(nF.length,3));
    aState.rmVars=rmVars;
    var rmPrv=null;
    if(rmVars.length>=3){
      rmPrv=tryStats(function(){return SE.repeatedMeasuresAnova(rmVars.map(function(v){return SE.validNums(data.map(function(r){return r[v];}));}),rmVars);});
    }
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Repeated Measures ANOVA</div>';
    html+='<div style="font-size:11px;color:rgba(232,222,255,.5);margin-bottom:10px;line-height:1.6">Pilih ≥3 variabel yang mewakili titik waktu berbeda (T1, T2, T3, dst.) dari subjek yang sama.</div>';
    // Dynamic variable slots
    html+='<div id="rm-slots">';
    for(var ri=0;ri<rmVars.length;ri++){
      html+='<div style="display:flex;gap:5px;align-items:center;margin-bottom:5px">';
      html+='<span style="font-size:10px;color:rgba(232,222,255,.35);width:22px;flex-shrink:0">T'+(ri+1)+'</span>';
      html+=mkSelect('rm-v-'+ri,nF,rmVars[ri],'(function(){aState.rmVars['+ri+']=val;renderASub();})()', 'Time point '+(ri+1));
      html+='<button class="btn btn-ghost btn-sm" style="padding:4px 7px;flex-shrink:0" onclick="aState.rmVars.splice('+ri+',1);renderASub()">✕</button>';
      html+='</div>';
    }
    html+='</div>';
    html+='<div style="display:flex;gap:5px;margin-top:5px">';
    html+='<button class="btn btn-ghost btn-sm" onclick="aState.rmVars.push(\'\');renderASub()">+ Tambah titik waktu</button>';
    html+='</div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runRmAnova()">▶ Run</button>';
    if(rmPrv&&!rmPrv._err){
      html+='<div class="stats-grid2" style="margin-top:11px">';
      html+=stCard('F',rmPrv.F,'df='+rmPrv.dfB+','+rmPrv.dfE);
      html+=stCard('p',rmPrv.p_fmt,'');
      html+=stCard('&#x03b7;&#x00b2;p',rmPrv.etaSq,'Effect size');
      html+=stCard('k',rmPrv.k,'Time points');
      html+='</div>';
      html+='<div class="row" style="margin-top:8px">'+sigBadge(rmPrv.p)+'</div>';
    }
    html+='</div>';
    // Profile / trajectory chart
    html+='<div class="card"><div class="sec-hd">Profile Plot (Means)</div>';
    if(rmVars.length>=2&&rmVars.every(function(v){return v&&nF.includes(v);})){
      var rmMeans=rmVars.map(function(v){
        var vals=SE.validNums(data.map(function(r){return r[v];}));
        return vals.length?vals.reduce(function(a,b){return a+b;},0)/vals.length:0;
      });
      var rmMax=Math.max.apply(null,rmMeans);var rmMin=Math.min.apply(null,rmMeans);
      var rmRange=rmMax-rmMin||1;
      var svgW=220,svgH=120,padL=30,padB=20,padT=10,padR=10;
      var plotW=svgW-padL-padR,plotH=svgH-padB-padT;
      var pts=rmVars.map(function(v,i){
        var x=padL+(i/(rmVars.length-1))*plotW;
        var y=padT+plotH-(((rmMeans[i]-rmMin)/rmRange)*plotH*0.85+0.075*plotH);
        return {x:x,y:y,mean:rmMeans[i],label:'T'+(i+1)};
      });
      var polyline=pts.map(function(p){return p.x+','+p.y;}).join(' ');
      var svgStr='<svg viewBox="0 0 '+svgW+' '+svgH+'" style="width:100%;height:auto">';
      svgStr+='<polyline points="'+polyline+'" fill="none" stroke="url(#rmGrad)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
      svgStr+='<defs><linearGradient id="rmGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#34d399"/><stop offset="100%" stop-color="#a78bfa"/></linearGradient></defs>';
      pts.forEach(function(p){
        svgStr+='<circle cx="'+p.x+'" cy="'+p.y+'" r="4" fill="#34d399" opacity="0.9"/>';
        svgStr+='<text x="'+p.x+'" y="'+(svgH-5)+'" text-anchor="middle" font-size="9" fill="rgba(232,222,255,0.5)">'+p.label+'</text>';
        svgStr+='<text x="'+p.x+'" y="'+(p.y-7)+'" text-anchor="middle" font-size="8" fill="#a5f3fc">'+SE.fmt4(p.mean)+'</text>';
      });
      svgStr+='</svg>';
      html+=svgStr;
    } else {
      html+='<div class="chart-empty">Pilih ≥2 titik waktu untuk melihat grafik</div>';
    }
    // Descriptives per time point
    if(rmVars.length>=2&&rmVars.every(function(v){return v&&nF.includes(v);})){
      html+='<div class="tbl-wrap" style="margin-top:10px"><table><thead><tr><th>Titik Waktu</th><th>Variabel</th><th>N</th><th>Mean</th><th>SD</th></tr></thead><tbody>';
      rmVars.forEach(function(v,i){
        var vals=SE.validNums(data.map(function(r){return r[v];}));
        if(!vals.length){html+='<tr><td>T'+(i+1)+'</td><td>'+v+'</td><td colspan="3">—</td></tr>';return;}
        var mean=vals.reduce(function(a,b){return a+b;},0)/vals.length;
        var sd=Math.sqrt(vals.reduce(function(a,b){return a+(b-mean)*(b-mean);},0)/(vals.length-1));
        html+='<tr><td class="td-label">T'+(i+1)+'</td><td class="td-str">'+escHtml(v)+'</td><td class="td-num">'+vals.length+'</td><td class="td-num">'+SE.fmt4(mean)+'</td><td class="td-num">'+SE.fmt4(sd)+'</td></tr>';
      });
      html+='</tbody></table></div>';
    }
    // Mauchly & Post-hoc note
    if(rmPrv&&!rmPrv._err){
      html+='<div class="assump" style="margin-top:10px"><b style="color:#fbbf24">Catatan Sphericity:</b> Mauchly test tidak diimplementasikan. Jika data melanggar sphericity, pertimbangkan koreksi Greenhouse-Geisser di software seperti SPSS.<br><br>';
      if(parseFloat(rmPrv.p)<0.05){
        html+='<b style="color:#34d399">Post-hoc pairwise:</b><br>';
        for(var pi=0;pi<rmVars.length;pi++){
          for(var pj=pi+1;pj<rmVars.length;pj++){
            var phRes=tryStats(function(){return SE.pairedTTest(SE.validNums(data.map(function(r){return r[rmVars[pi]];})),SE.validNums(data.map(function(r){return r[rmVars[pj]];})));});
            if(phRes&&!phRes._err) html+='T'+(pi+1)+' vs T'+(pj+1)+': t='+phRes.t+', p='+phRes.p_fmt+'&nbsp;&nbsp;';
          }
        }
      }
      html+='</div>';
    }
    html+='</div>';
    html+='</div>';
  }

  else if(currentASub==='anova'){
    const gl=[...new Set(data.map(r=>r[aState.avG]))].filter(v=>v!==null);
    const groups=gl.map(g=>({label:String(g),vals:SE.validNums(data.filter(r=>r[aState.avG]===g).map(r=>r[aState.avV]))})).filter(g=>g.vals.length>=2);
    const prv=groups.length>=2?tryStats(()=>SE.onewayANOVA(groups)):null;
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">One-Way ANOVA</div>';
    html+=mkSelect('av-v',nF,aState.avV,'aState.avV=val;renderASub()','Dependent Variable');
    html+='<div style="margin-top:8px">'+mkSelect('av-g',aF,aState.avG,'aState.avG=val;renderASub()','Factor')+'</div>';
    html+='<div style="margin-top:10px">';
    html+='<label class="lbl">Post-hoc Test</label>';
    html+='<div style="display:flex;align-items:center;gap:7px;margin-top:4px">';
    // Toggle switch
    html+='<div onclick="aState.avPost=!aState.avPost;renderASub()" style="cursor:pointer;width:34px;height:19px;border-radius:99px;background:'+(aState.avPost?'linear-gradient(135deg,#7c3aed,#db2777)':'rgba(124,58,237,.18)')+';position:relative;flex-shrink:0;transition:background .2s;border:1px solid '+(aState.avPost?'transparent':'rgba(124,58,237,.25)')+'"><div style="position:absolute;top:2px;left:'+(aState.avPost?'16px':'2px')+';width:13px;height:13px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div></div>';
    // Picker trigger — only active when toggle is on
    var phLabels={'tukey':'Tukey HSD','bonferroni':'Bonferroni','lsd':'LSD (Fisher)','holm':'Holm-Bonferroni'};
    var phCurrent=phLabels[aState.avPostMethod||'tukey']||'Tukey HSD';
    html+='<div class="csel-wrap" id="cw-av-ph" style="flex:1'+(aState.avPost?'':';opacity:.4;pointer-events:none')+'">'
      +'<div class="csel-trigger" onclick="openCselById(\'av-ph\')">'
      +'<span class="csel-val" id="cv-av-ph">'+phCurrent+'</span>'
      +'<span class="csel-arrow">▾</span>'
      +'</div></div>';
    html+='</div></div>';
    // Register csel for post-hoc picker
    _cR['av-ph']={
      fields:['Tukey HSD','Bonferroni','LSD (Fisher)','Holm-Bonferroni'],
      current:phCurrent,
      label:'Post-hoc Method',
      showBadge:false,
      onChange:'aState.avPostMethod={\'Tukey HSD\':\'tukey\',\'Bonferroni\':\'bonferroni\',\'LSD (Fisher)\':\'lsd\',\'Holm-Bonferroni\':\'holm\'}[val]||\'tukey\';renderASub()'
    };
    if(aState.avPost){
      var phHint={'tukey':'Conservative · Controls familywise α · Recommended for most cases',
        'bonferroni':'Very conservative · α divided by # comparisons · Best for few tests',
        'lsd':'Liberal · No familywise correction · Use only when F is significant',
        'holm':'Step-down Bonferroni · More powerful than Bonferroni, same strict α control'}[aState.avPostMethod||'tukey'];
      html+='<div style="margin-top:5px;font-size:10px;color:rgba(232,222,255,.35);padding:0 2px">'+phHint+'</div>';
    }
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runANOVA()">▶ Run</button>';
    if(prv&&!prv._err){
      html+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:11px">'+stCard('F',prv.F)+stCard('p',prv.p_fmt)+stCard('&#x03b7;&#x00b2;',prv.eta2,prv.eta2Interp)+'</div>';
      html+='<div class="row" style="margin-top:8px">'+sigBadge(prv.p)+'</div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Group Distributions</div>'+svgBoxplot(data,aState.avV,aState.avG)+'</div></div>';
  }

  else if(currentASub==='anova2'){
    // Two-Way ANOVA
    const nF2=numFields(),aF2=allFields();
    if(!aState.av2V&&nF2.length) aState.av2V=nF2[0];
    if(!aState.av2A&&aF2.length) aState.av2A=aF2[aF2.length>1?aF2.length-1:0];
    if(!aState.av2B&&aF2.length>1) aState.av2B=aF2[aF2.length>2?aF2.length-2:0];
    const prv2=aState.av2V&&aState.av2A&&aState.av2B&&aState.av2A!==aState.av2B?
      tryStats(()=>SE.twowayANOVA(data,aState.av2V,aState.av2A,aState.av2B)):null;
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Two-Way ANOVA</div>';
    html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:9px;line-height:1.6">Tests main effects of two factors and their interaction (A×B). Requires at least 2 levels per factor.</div>';
    html+=mkSelect('av2-v',nF2,aState.av2V,'aState.av2V=val;renderASub()','Dependent Variable');
    html+='<div style="margin-top:8px">'+mkSelect('av2-a',aF2,aState.av2A,'aState.av2A=val;renderASub()','Factor A')+'</div>';
    html+='<div style="margin-top:8px">'+mkSelect('av2-b',aF2,aState.av2B,'aState.av2B=val;renderASub()','Factor B')+'</div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runANOVA2()">▶ Run</button>';
    if(prv2&&!prv2._err){
      html+='<div style="margin-top:11px">';
      prv2.effects.forEach(function(e){
        var col=e.source.indexOf('×')>=0?'#fbbf24':(e.source===aState.av2A?'#818cf8':'#34d399');
        html+='<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 9px;border-radius:7px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.04);margin-bottom:4px">';
        html+='<span style="font-weight:700;color:'+col+';font-size:12px">'+e.source+'</span>';
        html+='<span style="font-family:monospace;font-size:11px;color:#94a3b8">F('+e.df+','+prv2.error.df+')='+e.F+'</span>';
        html+='<span class="tag '+(e.sig?'tag-green':'tag-gray')+'">p='+e.p_fmt+'</span>';
        html+='</div>';
      });
      html+='</div>';
    }
    if(prv2&&prv2._err) html+='<div style="color:#f87171;font-size:11px;margin-top:8px">'+prv2.msg+'</div>';
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Interaction Plot ('+((aState.av2A)||'A')+'×'+((aState.av2B)||'B')+')</div>';
    if(prv2&&!prv2._err){
      html+=svgInteractionPlot(prv2.cellMeansTable,aState.av2B,aState.av2A,aState.av2V);
    } else {
      html+='<div style="color:#64748b;font-size:11px;padding:20px;text-align:center">Select variables and Run to see interaction plot</div>';
    }
    html+='</div></div>';
  }

  else if(currentASub==='anova3'){
    // Three-Way ANOVA
    const nF3=numFields(),aF3=allFields();
    if(!aState.av3V&&nF3.length) aState.av3V=nF3[0];
    if(!aState.av3A&&aF3.length) aState.av3A=aF3[aF3.length>1?aF3.length-1:0];
    if(!aState.av3B&&aF3.length>1) aState.av3B=aF3[aF3.length>2?aF3.length-2:0];
    if(!aState.av3C&&aF3.length>2) aState.av3C=aF3[aF3.length>3?aF3.length-3:0];
    const valid3=aState.av3V&&aState.av3A&&aState.av3B&&aState.av3C&&
      aState.av3A!==aState.av3B&&aState.av3A!==aState.av3C&&aState.av3B!==aState.av3C;
    const prv3=valid3?tryStats(()=>SE.threewayANOVA(data,aState.av3V,aState.av3A,aState.av3B,aState.av3C)):null;
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Three-Way ANOVA</div>';
    html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:9px;line-height:1.6">Tests 3 main effects + 3 two-way interactions + 1 three-way interaction. Factors A, B, C must be different variables.</div>';
    html+=mkSelect('av3-v',nF3,aState.av3V,'aState.av3V=val;renderASub()','Dependent Variable');
    html+='<div style="margin-top:8px">'+mkSelect('av3-a',aF3,aState.av3A,'aState.av3A=val;renderASub()','Factor A')+'</div>';
    html+='<div style="margin-top:8px">'+mkSelect('av3-b',aF3,aState.av3B,'aState.av3B=val;renderASub()','Factor B')+'</div>';
    html+='<div style="margin-top:8px">'+mkSelect('av3-c',aF3,aState.av3C,'aState.av3C=val;renderASub()','Factor C')+'</div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runANOVA3()">▶ Run</button>';
    if(prv3&&!prv3._err){
      html+='<div style="margin-top:11px">';
      var effectColors={'×':('#fbbf24')};
      prv3.effects.forEach(function(e){
        var col=e.source.split('×').length===3?'#f472b6':e.source.indexOf('×')>=0?'#fbbf24':'#818cf8';
        html+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 9px;border-radius:7px;background:rgba(255,255,255,.022);border:1px solid rgba(255,255,255,.04);margin-bottom:3px">';
        html+='<span style="font-weight:700;color:'+col+';font-size:11px">'+e.source+'</span>';
        html+='<span class="tag '+(e.sig?'tag-green':'tag-gray')+'">p='+e.p_fmt+'</span>';
        html+='</div>';
      });
      html+='</div>';
    }
    if(prv3&&prv3._err) html+='<div style="color:#f87171;font-size:11px;margin-top:8px">'+prv3.msg+'</div>';
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">A×B Interaction Plot</div>';
    if(prv3&&!prv3._err){
      html+=svgInteractionPlot(prv3.cellMeansAB,aState.av3B,aState.av3A,aState.av3V);
      html+='<div style="margin-top:7px;font-size:10px;color:rgba(232,222,255,.3)">Marginal means across Factor C levels (averaged)</div>';
    } else {
      html+='<div style="color:#64748b;font-size:11px;padding:20px;text-align:center">Select variables and Run to see interaction plot</div>';
    }
    html+='</div></div>';
  }
  else if(currentASub==='correlation'){
    const prv=tryStats(()=>{const ax=data.map(r=>r[aState.crX]),ay=data.map(r=>r[aState.crY]);return aState.crType==='spearman'?SE.spearmanR(ax,ay):SE.pearsonR(ax,ay);});
    // Partial correlation preview
    const pcPrv=aState.crType==='partial'&&aState.pcX&&aState.pcY&&aState.pcZ?tryStats(()=>SE.partialCorr(data.map(r=>r[aState.pcX]),data.map(r=>r[aState.pcY]),data.map(r=>r[aState.pcZ]))):null;
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Correlation</div>';
    html+=mkCsel('cr-type',['pearson','spearman','partial'],aState.crType,'aState.crType=val;renderASub()','Type');
    if(aState.crType==='partial'){
      html+='<div style="margin-top:8px">'+mkSelect('pc-x',nF,aState.pcX,'aState.pcX=val;renderASub()','Variable X')+'</div>';
      html+='<div style="margin-top:8px">'+mkSelect('pc-y',nF,aState.pcY,'aState.pcY=val;renderASub()','Variable Y')+'</div>';
      html+='<div style="margin-top:8px">'+mkSelect('pc-z',nF,aState.pcZ,'aState.pcZ=val;renderASub()','Control Variable (Z)')+'</div>';
      html+='<div style="margin-top:7px;padding:7px 10px;background:rgba(103,232,249,.05);border-radius:7px;border:1px solid rgba(103,232,249,.15);font-size:10.5px;color:rgba(232,222,255,.5)">Partial r removes the linear influence of Z from both X and Y before computing the correlation.</div>';
      html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runPartialCorr()">▶ Run</button>';
      if(pcPrv&&!pcPrv._err){
        html+='<div class="stats-grid2" style="margin-top:11px">'+stCard('Partial r',pcPrv.rp)+stCard('r²',pcPrv.r2,'Variance explained')+stCard('p',pcPrv.p_fmt)+stCard('95% CI',pcPrv.ci95)+'</div>';
        html+='<div class="row" style="margin-top:8px">'+sigBadge(pcPrv.p)+'<span class="tag tag-gray">'+pcPrv.strength+' '+(parseFloat(pcPrv.rp)>=0?'positive':'negative')+'</span></div>';
        html+='<div style="margin-top:7px;font-size:10.5px;color:rgba(232,222,255,.4)">Zero-order: r(X,Y)='+pcPrv.rxy+' · r(X,Z)='+pcPrv.rxz+' · r(Y,Z)='+pcPrv.ryz+'</div>';
      }
    } else {
      html+='<div style="margin-top:8px">'+mkSelect('cr-x',nF,aState.crX,'aState.crX=val;renderASub()','Variable X')+'</div>';
      html+='<div style="margin-top:8px">'+mkSelect('cr-y',nF,aState.crY,'aState.crY=val;renderASub()','Variable Y')+'</div>';
      html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runCorr()">▶ Run</button>';
      if(prv&&!prv._err){
        html+='<div class="stats-grid2" style="margin-top:11px">'+stCard('r',prv.r)+stCard('r²',prv.r2,'Variance explained')+stCard('p',prv.p_fmt)+stCard('95% CI',prv.ci95)+'</div>';
        html+='<div class="row" style="margin-top:8px">'+sigBadge(prv.p)+'<span class="tag tag-gray">'+prv.strength+' '+prv.direction+'</span></div>';
      }
    }
    html+='</div>';
    if(aState.crType==='partial'){
      html+='<div class="card"><div class="sec-hd">Scatter X vs Y</div>'+svgScatter(data,aState.pcX,aState.pcY)+'</div>';
    } else {
      html+='<div class="card"><div class="sec-hd">Scatter Plot</div>'+svgScatter(data,aState.crX,aState.crY)+'</div>';
    }
    html+='</div>';
  }

  else if(currentASub==='regression'){
    const prv=tryStats(()=>SE.linearReg(data.map(r=>r[aState.regX]),data.map(r=>r[aState.regY])));
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Simple Regression</div>';
    html+=mkSelect('reg-x',nF,aState.regX,'aState.regX=val;renderASub()','Predictor (X)');
    html+='<div style="margin-top:8px">'+mkSelect('reg-y',nF,aState.regY,'aState.regY=val;renderASub()','Outcome (Y)')+'</div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runReg()">▶ Run</button>';
    if(prv&&!prv._err){
      html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:11px">'+stCard('R²',prv.R2,'Variance explained')+stCard('Adj R²',prv.R2adj)+stCard('F',prv.F,'p='+prv.pF_fmt)+stCard('RMSE',prv.RMSE)+'</div>';
      html+='<div class="eq" style="margin-top:9px">Ŷ = '+prv.b0+' + '+prv.b1+' · '+aState.regX+'</div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Scatter + Residuals</div>';
    html+=svgScatter(data,aState.regX,aState.regY);
    if(prv&&!prv._err)html+='<div style="margin-top:10px">'+svgResidual(prv)+'</div>';
    html+='</div></div>';
  }

  else if(currentASub==='multipleReg'){
    const prv=aState.mrXs.length?tryStats(()=>SE.multipleReg(aState.mrXs,aState.mrY,data)):null;
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Multiple Regression</div>';
    html+=mkSelect('mr-y',nF,aState.mrY,'aState.mrY=this.value;renderASub()','Dependent Variable (Y)');
    html+='<label class="lbl" style="margin-top:9px;margin-bottom:5px">Predictors (X):</label>';
    html+='<div style="display:flex;flex-direction:column;gap:4px;max-height:180px;overflow-y:auto;margin-bottom:11px">';
    nF.filter(f=>f!==aState.mrY).forEach(f=>{const sel=aState.mrXs.includes(f);
      html+='<label style="display:flex;align-items:center;gap:7px;font-size:12px;color:#94a3b8;cursor:pointer;padding:4px 7px;border-radius:7px;background:'+(sel?'rgba(99,102,241,.07)':'transparent')+'"><input type="checkbox" data-fld="'+f+'" '+(sel?'checked':'')+' onchange="toggleMrXEl(this)" style="accent-color:#818cf8"/>'+f+'</label>';
    });
    html+='</div>';
    html+='<button class="btn btn-primary btn-sm" onclick="runMultipleReg()">▶ Run</button>';
    if(prv&&!prv._err){
      html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:11px">'+stCard('R²',prv.R2,'Variance explained')+stCard('Adj R²',prv.R2adj)+stCard('F',prv.F,'p='+prv.pF_fmt)+stCard('DW',prv.DW,'Ideal 1.5-2.5')+'</div>';
      html+='<div class="row" style="margin-top:8px">'+sigBadge(prv.pF)+'</div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Coefficients</div>';
    if(prv&&!prv._err)html+=mkTable(['Variable','B','SE','β','t','p','VIF'],prv.coefs.map((c,i)=>[c.name,c.B,c.SE,i===0?'—':c.beta,c.t,c.p_fmt,i===0?'—':prv.vif[i-1]]));
    else html+='<div style="color:#64748b;font-size:12px;padding:12px">Select ≥1 predictor and run.</div>';
    html+='</div></div>';
  }

  else if(currentASub==='hierarchicalReg'){
    // ── Init state ──────────────────────────────────────────────────────
    if(!aState.hrY) aState.hrY = nF[0]||'';
    if(!aState.hrBlocks) aState.hrBlocks = [[],[]]; // Block1, Block2 arrays
    if(!aState.hrBlocks[0]) aState.hrBlocks[0]=[];
    if(!aState.hrBlocks[1]) aState.hrBlocks[1]=[];

    // ── Live preview per block ────────────────────────────────────────────
    var hrPrvs = [];
    for(var bi=0; bi<aState.hrBlocks.length; bi++){
      var _cumXs = [];
      for(var ci=0;ci<=bi;ci++) aState.hrBlocks[ci].forEach(function(v){if(!_cumXs.includes(v))_cumXs.push(v);});
      if(_cumXs.length > 0 && aState.hrY){
        hrPrvs.push((function(xs){return tryStats(function(){return SE.multipleReg(xs, aState.hrY, data);});}(_cumXs)));
      } else {
        hrPrvs.push(null);
      }
    }

    html += '<div class="card"><div class="sec-hd">Hierarchical Regression <span style="font-size:10px;font-style:normal;color:rgba(232,222,255,.35);margin-left:8px">Bertahap per Block · ΔR² · F-change Test</span></div>';
    html += '<div style="font-size:11.5px;color:rgba(232,222,255,.45);margin-bottom:12px;line-height:1.7">Masukkan prediktor secara bertahap. Setiap Block menambah prediktor dan melaporkan <b style="color:#a5f3fc">ΔR²</b> (perubahan variance) beserta uji F-change signifikansinya.</div>';
    html += '<div class="grid2">';

    // LEFT: setup card
    html += '<div>';

    // DV selector
    html += '<div class="card"><div class="sec-hd" style="margin-bottom:8px">Dependent Variable (Y)</div>';
    html += mkSelect('hr-y', nF, aState.hrY, 'aState.hrY=val;renderASub()', 'Dependent Variable');
    html += '</div>';

    // Block editors
    for(var bi=0; bi<aState.hrBlocks.length; bi++){
      var bNum = bi+1;
      var blockColor = bi===0 ? '#818cf8' : bi===1 ? '#a5f3fc' : bi===2 ? '#f472b6' : '#fbbf24';
      html += '<div class="card" style="border-color:'+blockColor+'30;margin-bottom:8px">';
      html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">';
      html += '<div class="sec-hd" style="margin-bottom:0;color:'+blockColor+'">Block '+bNum+'</div>';
      if(bi >= 2){
        html += '<button class="btn btn-ghost btn-sm" style="padding:3px 8px;font-size:10px" onclick="aState.hrBlocks.splice('+bi+',1);renderASub()">✕ Remove</button>';
      }
      html += '</div>';
      html += '<div style="display:flex;flex-direction:column;gap:3px;max-height:130px;overflow-y:auto">';
      var blockedAll = [];
      for(var ci=0;ci<aState.hrBlocks.length;ci++) if(ci!==bi) aState.hrBlocks[ci].forEach(function(v){blockedAll.push(v);});
      nF.filter(function(f){return f!==aState.hrY;}).forEach(function(f){
        var sel = aState.hrBlocks[bi].includes(f);
        var usedElsewhere = blockedAll.includes(f);
        html += '<label style="display:flex;align-items:center;gap:7px;font-size:12px;cursor:pointer;padding:3px 7px;border-radius:7px;'
          +(sel?'background:rgba(99,102,241,.1);color:#a5b4fc;':'color:'+(usedElsewhere?'rgba(232,222,255,.25)':'rgba(232,222,255,.5)')+'')
          +(usedElsewhere&&!sel?';pointer-events:none;opacity:.4':'')
          +'">';
        html += '<input type="checkbox" '+(sel?'checked':'')+(usedElsewhere&&!sel?' disabled':'')
          +' onchange="toggleHrBlock('+bi+',\''+f+'\',this.checked)" style="accent-color:'+blockColor+'"/>'+f;
        if(usedElsewhere && !sel) html += ' <span style="font-size:9px;color:#64748b">(Block '+(blockedAll.indexOf(f)+1)+')</span>';
        html += '</label>';
      });
      html += '</div>';
      // Live preview summary for this block
      if(hrPrvs[bi] && !hrPrvs[bi]._err){
        var bp = hrPrvs[bi];
        var dR2 = bi===0 ? parseFloat(bp.R2) : parseFloat(bp.R2) - (hrPrvs[bi-1]&&!hrPrvs[bi-1]._err?parseFloat(hrPrvs[bi-1].R2):0);
        html += '<div style="margin-top:7px;padding:6px 9px;background:rgba(165,243,252,.05);border:1px solid rgba(165,243,252,.12);border-radius:7px;font-size:11px;display:flex;gap:10px;flex-wrap:wrap">';
        html += '<span style="color:'+blockColor+'">R²=<b>'+bp.R2+'</b></span>';
        html += '<span style="color:rgba(232,222,255,.5)">Adj R²='+bp.R2adj+'</span>';
        if(bi>0) html += '<span style="color:#a5f3fc">ΔR²=<b>'+dR2.toFixed(4)+'</b></span>';
        html += '</div>';
      }
      html += '</div>';
    }

    // Add block button
    if(aState.hrBlocks.length < 5){
      html += '<button class="btn btn-ghost btn-sm" onclick="aState.hrBlocks.push([]);renderASub()" style="width:100%;justify-content:center;margin-bottom:8px">+ Add Block '+(aState.hrBlocks.length+1)+'</button>';
    }

    // Run button
    html += '<button class="btn btn-primary btn-sm"  onclick="runHierarchicalReg()">▶ Run</button>';
    html += '</div>';

    // RIGHT: ΔR² summary card
    html += '<div>';
    html += '<div class="card"><div class="sec-hd">Model Summary & ΔR²</div>';
    if(hrPrvs.some(function(p){return p&&!p._err;})){
      html += '<div class="tbl-wrap"><table><thead><tr>';
      ['Block','Predictors','R²','Adj R²','ΔR²','F-change','df1','df2','p ΔR²'].forEach(function(h){html+='<th>'+h+'</th>';});
      html += '</tr></thead><tbody>';
      var prevR2 = 0, prevN = 0;
      for(var bi=0;bi<aState.hrBlocks.length;bi++){
        if(!hrPrvs[bi]||hrPrvs[bi]._err) continue;
        var bp = hrPrvs[bi];
        var _cumXs2 = [];
        for(var ci=0;ci<=bi;ci++) aState.hrBlocks[ci].forEach(function(v){if(!_cumXs2.includes(v))_cumXs2.push(v);});
        var dR2 = parseFloat(bp.R2) - prevR2;
        var n = parseInt(bp.n||data.length), kNew = aState.hrBlocks[bi].length;
        var dfErr = n - _cumXs2.length - 1;
        var Fchange = dfErr>0 && (1-parseFloat(bp.R2))>0 ? (dR2/kNew) / ((1-parseFloat(bp.R2))/dfErr) : 0;
        var pFchange = Fchange>0 ? SE.pFromF(Fchange, kNew, dfErr) : 1;
        var blockColor2 = bi===0?'#818cf8':bi===1?'#a5f3fc':bi===2?'#f472b6':'#fbbf24';
        var sig = pFchange < 0.05;
        html += '<tr>';
        html += '<td class="td-label" style="color:'+blockColor2+';font-weight:700">Block '+(bi+1)+'</td>';
        html += '<td style="font-size:10.5px;color:#94a3b8">'+aState.hrBlocks[bi].join(', ')+'</td>';
        html += '<td class="td-num" style="color:#e8deff;font-weight:700">'+bp.R2+'</td>';
        html += '<td class="td-num">'+bp.R2adj+'</td>';
        html += '<td class="td-num" style="color:#a5f3fc;font-weight:700">'+dR2.toFixed(4)+'</td>';
        html += '<td class="td-num">'+Fchange.toFixed(3)+'</td>';
        html += '<td class="td-num">'+kNew+'</td>';
        html += '<td class="td-num">'+dfErr+'</td>';
        html += '<td class="td-num">'+(sig?'<b style="color:#34d399">':'<span style="color:#94a3b8">')+SE.f4(pFchange)+(sig?'</b>':'</span>')+'</td>';
        html += '</tr>';
        prevR2 = parseFloat(bp.R2);
        prevN = n;
      }
      html += '</tbody></table></div>';
    } else {
      html += '<div style="color:#64748b;font-size:12px;padding:20px;text-align:center">Tambah prediktor ke setiap Block dan klik Run untuk melihat tabel ΔR².</div>';
    }
    html += '</div>';

    // Coefficient card per block
    for(var bi=0;bi<aState.hrBlocks.length;bi++){
      if(!hrPrvs[bi]||hrPrvs[bi]._err) continue;
      var bp = hrPrvs[bi];
      var blockColor3 = bi===0?'#818cf8':bi===1?'#a5f3fc':bi===2?'#f472b6':'#fbbf24';
      html += '<div class="card"><div class="sec-hd" style="color:'+blockColor3+'">Block '+(bi+1)+' Coefficients</div>';
      html += mkTable(['Variable','B','SE','β','t','p','VIF'],
        bp.coefs.map(function(c,ci){return[c.name,c.B,c.SE,ci===0?'—':c.beta,c.t,c.p_fmt,ci===0?'—':bp.vif[ci-1]];}));
      html += '</div>';
    }
    html += '</div>'; // end right col
    html += '</div></div>'; // end grid2, card
  }

  else if(currentASub==='logistic'){
    var lgType=aState.lgType||'binary';
    var lgY=aState.lgY||'';
    var lgXs=aState.lgXs||[];
    // Determine DV categories for preview
    var lgCats=lgY?[...new Set(data.map(function(r){return r[lgY];}).filter(function(v){return v!==null&&v!==undefined;}))].sort():[];
    var lgPrv=(lgY&&lgXs.length&&lgCats.length>=2)?tryStats(function(){return SE.logisticReg(lgY,lgXs,data,lgType);}):null;
    html+='<div class="grid2">';
    // Setup Card
    html+='<div class="card"><div class="sec-hd">Logistic Regression</div>';
    // Type toggle
    html+=mkCsel('lg-type',['binary','multinomial'],lgType,'aState.lgType=val;renderASub()','Tipe Model');
    html+='<div style="margin-bottom:10px"></div>';
    // DV selector — all fields (kategorikal)
    html+=mkSelect('lg-y',aF,lgY,'aState.lgY=val;renderASub()','Dependent Variable (DV Kategorikal)');
    // Category preview
    if(lgY&&lgCats.length>0){
      var catColor=lgCats.length===2?'tag-green':lgCats.length<=5?'tag-blue':'tag-yellow';
      html+='<div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px">';
      lgCats.slice(0,8).forEach(function(c){html+='<span class="tag '+catColor+'">'+c+'</span>';});
      if(lgCats.length>8) html+='<span class="tag tag-gray">+'+( lgCats.length-8)+' more</span>';
      html+='</div>';
      if(lgType==='binary'&&lgCats.length!==2){
        html+='<div class="miss-warn" style="margin-top:6px">'+IC.warn+' Binary mode butuh tepat 2 kategori. DV ini punya '+lgCats.length+'.</div>';
      }
      if(lgType==='multinomial'&&lgCats.length<3){
        html+='<div class="miss-warn" style="margin-top:6px">'+IC.warn+' Multinomial butuh ≥3 kategori.</div>';
      }
    }
    // Predictors
    html+='<label class="lbl" style="margin-top:10px;margin-bottom:5px">Predictors (X — Numerik):</label>';
    html+='<div style="display:flex;flex-direction:column;gap:3px;max-height:160px;overflow-y:auto;margin-bottom:10px">';
    nF.filter(function(f){return f!==lgY;}).forEach(function(f){
      var sel=lgXs.includes(f);
      html+='<label style="display:flex;align-items:center;gap:7px;font-size:12px;color:#94a3b8;cursor:pointer;padding:4px 7px;border-radius:7px;background:'+(sel?'rgba(251,146,60,.07)':'transparent')+'"><input type="checkbox" data-lgf="'+f+'" '+(sel?'checked':'')+' onchange="toggleLgX(this)" style="accent-color:#fb923c"/>'+f+'</label>';
    });
    html+='</div>';
    html+='<button class="btn btn-primary btn-sm" onclick="runLogistic()">▶ Run</button>';
    // Quick preview stats
    if(lgPrv&&!lgPrv._err){
      html+='<div class="stats-grid2" style="margin-top:11px">';
      html+=stCard('N',lgPrv.n,'valid cases');
      html+=stCard('−2LL',lgPrv.m2ll,'Log-likelihood');
      html+=stCard("Cox & Snell R²",lgPrv.coxSnell,'Pseudo-R²');
      html+=stCard("Nagelkerke R²",lgPrv.nagelkerke,'Pseudo-R²');
      html+='</div>';
      html+='<div class="row" style="margin-top:8px">';
      html+='<span class="tag '+(parseFloat(lgPrv.chiSqP)<0.05?'tag-green':'tag-yellow')+'">χ²('+lgPrv.chiSqDf+')='+lgPrv.chiSq+', p='+lgPrv.chiSqP_fmt+'</span>';
      if(lgType==='binary') html+='<span class="tag tag-blue">Accuracy: '+lgPrv.accuracy+'%</span>';
      html+='</div>';
      if(lgType==='binary') html+='<div style="margin-top:7px;font-size:10.5px;color:rgba(232,222,255,.4)">Reference: "'+lgCats[0]+'" · Predicted: "'+lgCats[lgCats.length-1]+'"</div>';
    } else if(lgPrv&&lgPrv._err){
      html+='<div style="color:#f87171;font-size:11px;margin-top:8px">'+lgPrv.msg+'</div>';
    }
    html+='</div>';
    // Results Card
    html+='<div class="card"><div class="sec-hd">Coefficients &amp; Odds Ratios</div>';
    if(lgPrv&&!lgPrv._err){
      if(lgType==='binary'){
        html+='<div class="tbl-wrap">'+mkTable(
          ['Variable','B','SE','Wald','df','p','OR','95% CI OR'],
          lgPrv.coefs.map(function(c){
            return [c.name, c.B, c.SE, c.wald, '1', c.p_fmt, c.OR, c.ci_or];
          })
        )+'</div>';
        // Confusion matrix
        html+='<div class="sec-hd" style="margin-top:13px">Confusion Matrix (Predicted vs Actual)</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th></th><th>Pred. "'+lgPrv.cats[0]+'"</th><th>Pred. "'+lgPrv.cats[1]+'"</th><th>Correct</th></tr></thead><tbody>';
        html+='<tr><td class="td-label">Act. "'+lgPrv.cats[0]+'"</td><td class="td-num">'+lgPrv.cm[0][0]+'</td><td class="td-num">'+lgPrv.cm[0][1]+'</td><td class="td-num">'+SE.f1(lgPrv.cm[0][0]/(lgPrv.cm[0][0]+lgPrv.cm[0][1]+0.001)*100)+'%</td></tr>';
        html+='<tr><td class="td-label">Act. "'+lgPrv.cats[1]+'"</td><td class="td-num">'+lgPrv.cm[1][0]+'</td><td class="td-num">'+lgPrv.cm[1][1]+'</td><td class="td-num">'+SE.f1(lgPrv.cm[1][1]/(lgPrv.cm[1][0]+lgPrv.cm[1][1]+0.001)*100)+'%</td></tr>';
        html+='<tr><td class="td-label" style="color:#c084fc">Total</td><td></td><td></td><td class="td-num" style="color:#34d399;font-weight:700">'+lgPrv.accuracy+'%</td></tr>';
        html+='</tbody></table></div>';
        // ROC AUC
        html+='<div style="margin-top:8px;font-size:11.5px;color:rgba(232,222,255,.6)">AUC = <span style="color:#34d399;font-weight:700">'+lgPrv.auc+'</span> &nbsp;'+( parseFloat(lgPrv.auc)>=0.9?'<span class="tag tag-green">Excellent</span>':parseFloat(lgPrv.auc)>=0.8?'<span class="tag tag-blue">Good</span>':parseFloat(lgPrv.auc)>=0.7?'<span class="tag tag-yellow">Fair</span>':'<span class="tag tag-red">Poor</span>')+'</div>';
      } else {
        // Multinomial: one table per category vs reference
        lgPrv.categories.forEach(function(cat,ci){
          if(ci===0) return; // reference
          html+='<div style="margin-bottom:8px;font-size:11px;color:#fb923c;font-weight:700">vs. Reference: "'+lgPrv.categories[0]+'" → Predict: "'+cat+'"</div>';
          html+='<div class="tbl-wrap">'+mkTable(
            ['Variable','B','SE','Wald','p','OR','95% CI OR'],
            lgPrv.coefs[ci-1].map(function(c){
              return[c.name,c.B,c.SE,c.wald,c.p_fmt,c.OR,c.ci_or];
            })
          )+'</div>';
        });
        html+='<div style="margin-top:8px;font-size:11px;color:rgba(232,222,255,.4)">Overall Accuracy: '+lgPrv.accuracy+'%</div>';
      }
      // Assumptions note
      html+='<div class="assump" style="margin-top:11px"><b style="color:#fb923c">Asumsi Logistic Regression:</b><br>· DV harus kategorikal · Observasi independen · Tidak ada multikolinearitas ekstrem · Sampel cukup (≥10 per prediktor per kategori)<br><br><b style="color:#818cf8">Interpretasi OR:</b> OR &gt; 1 = peningkatan odds, OR &lt; 1 = penurunan odds, OR = 1 = tidak ada efek.</div>';
    } else {
      html+='<div style="color:#64748b;font-size:12px;padding:16px;text-align:center">Pilih DV kategorikal dan minimal 1 prediktor numerik, lalu klik Run.</div>';
    }
    html+='</div></div>';
  }

  else if(currentASub==='nonparam'){
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Nonparametric Tests</div>';
    html+=mkCsel('np-type',['mannwhitney','kruskal','wilcoxon'],aState.npType,'aState.npType=val;renderASub()','Test');
    html+='<div style="margin-top:8px">'+mkSelect('np-v',nF,aState.npV,'aState.npV=val;renderASub()','Variable')+'</div>';
    if(aState.npType!=='wilcoxon')html+='<div style="margin-top:8px">'+mkSelect('np-g',aF,aState.npG,'aState.npG=val;renderASub()','Grouping Variable')+'</div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runNP()">▶ Run</button>';
    html+='<div class="assump" style="margin-top:11px"><b style="color:#818cf8">When to use:</b><br>· Non-normal distribution (SW p≤.05)<br>· Ordinal data · Small n · Many outliers</div>';
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Distribution Preview</div>'+svgBoxplot(data,aState.npV,aState.npType!=='wilcoxon'?aState.npG:null)+'</div></div>';
  }

  else if(currentASub==='reliability'){
    const cols=aState.alphaVars.filter(v=>nF.includes(v)).map(v=>SE.validNums(data.map(r=>r[v])));
    const minN=cols.length?Math.min(...cols.map(c=>c.length)):0;
    const aRes=(cols.length>=2&&minN>=2)?tryStats(()=>SE.cronbachAlpha(cols.map(c=>c.slice(0,minN)))):null;
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Cronbach Alpha</div>';
    html+='<label class="lbl" style="margin-bottom:6px">Select items (≥2 numeric):</label>';
    html+='<div style="display:flex;flex-direction:column;gap:4px;max-height:190px;overflow-y:auto;margin-bottom:11px">';
    nF.forEach(f=>{const sel=aState.alphaVars.includes(f);
      html+='<label style="display:flex;align-items:center;gap:7px;font-size:12px;color:#94a3b8;cursor:pointer;padding:4px 7px;border-radius:7px;background:'+(sel?'rgba(99,102,241,.07)':'transparent')+'"><input type="checkbox" data-fld="'+f+'" '+(sel?'checked':'')+' onchange="toggleAlphaVarEl(this)" style="accent-color:#818cf8"/>'+f+'</label>';
    });
    html+='</div>';
    html+='<button class="btn btn-primary btn-sm" onclick="runAlpha()">▶ Run</button>';
    if(aRes&&!aRes._err){
      html+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:11px">'+stCard('Cronbach α',aRes.alpha,aRes.interp)+stCard('Items k',aRes.k)+stCard('Cases n',aRes.n)+'</div>';
      html+='<div class="row" style="margin-top:8px"><span class="tag '+(parseFloat(aRes.alpha)>=.7?'tag-green':'tag-red')+'">'+aRes.interp+'</span></div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Interpretation</div>';
    [['≥.90','Excellent','tag-green'],['≥.80','Good','tag-blue'],['≥.70','Acceptable','tag-purple'],['≥.60','Questionable','tag-yellow'],['≥.50','Poor','tag-orange'],['<.50','Unacceptable','tag-red']].forEach(([rng,lbl,cls])=>{
      html+='<div style="display:flex;align-items:center;gap:9px;padding:6px 10px;background:rgba(255,255,255,.018);border-radius:7px;border:1px solid rgba(255,255,255,.04);margin-bottom:4px"><span style="font-family:monospace;font-size:11px;color:#94a3b8;width:40px">'+rng+'</span><span class="tag '+cls+'">'+escHtml(lbl)+'</span></div>';
    });
    html+='</div></div>';
  }

  else if(currentASub==='kappa'){
    var aF2=allFields(); var nF2=numFields();
    html+='<div class="grid2">';
    // ── Input card ──
    html+='<div class="card"><div class="sec-hd">Cohen\'s Kappa — Inter-Rater Reliability</div>';
    html+='<div class="assump" style="margin-bottom:10px"><b style="color:#818cf8">What it measures:</b> Agreement between two raters beyond chance. κ=0 = chance, κ=1 = perfect agreement.</div>';
    html+=mkSelect('kap-r1',aF2,aState.kappaR1,'aState.kappaR1=val;renderASub()','Rater 1 / Observer 1');
    html+='<div style="margin-top:8px">'+mkSelect('kap-r2',aF2,aState.kappaR2,'aState.kappaR2=val;renderASub()','Rater 2 / Observer 2')+'</div>';
    html+='<label style="display:flex;align-items:center;gap:8px;margin-top:10px;font-size:12px;color:#94a3b8;cursor:pointer"><input type="checkbox" '+(aState.kappaWeighted?'checked':'')+' onchange="aState.kappaWeighted=this.checked;renderASub()" style="accent-color:#818cf8"/> Weighted Kappa (ordinal data)</label>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runKappa()">▶ Run</button>';
    // Live preview
    if(aState.kappaR1&&aState.kappaR2&&aState.kappaR1!==aState.kappaR2){
      var kR1=data.map(function(r){return r[aState.kappaR1];}).filter(function(v){return v!==null&&v!==undefined&&String(v).trim()!=='';});
      var kR2=data.map(function(r,i){
        if(data[i][aState.kappaR1]===null||data[i][aState.kappaR1]===undefined||String(data[i][aState.kappaR1]).trim()==='') return null;
        return data[i][aState.kappaR2];
      }).filter(function(v){return v!==null&&v!==undefined&&String(v).trim()!=='';});
      // Paired filtering
      var pairsR1=[],pairsR2=[];
      data.forEach(function(r){
        var v1=r[aState.kappaR1],v2=r[aState.kappaR2];
        if(v1!==null&&v1!==undefined&&String(v1).trim()!==''&&v2!==null&&v2!==undefined&&String(v2).trim()!==''){
          pairsR1.push(String(v1)); pairsR2.push(String(v2));
        }
      });
      if(pairsR1.length>=2){
        var kRes=tryStats(function(){return SE.cohenKappa(pairsR1,pairsR2);});
        if(kRes&&!kRes._err){
          html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:11px">';
          html+=stCard("Cohen's κ",kRes.kappa,kRes.interp);
          html+=stCard('Cases n',kRes.n);
          html+='</div>';
          html+='<div class="row" style="margin-top:6px">';
          var kv=parseFloat(kRes.kappa);
          var kCls=kv>=0.8?'tag-green':kv>=0.6?'tag-blue':kv>=0.4?'tag-purple':kv>=0.2?'tag-yellow':'tag-red';
          html+='<span class="tag '+kCls+'">'+kRes.interp+'</span>';
          html+='<span class="tag tag-blue">p'+kRes.pFmt+'</span>';
          html+='<span class="tag tag-purple">95% CI ['+kRes.ci95lo+', '+kRes.ci95hi+']</span>';
          html+='</div>';
          if(aState.kappaWeighted&&kRes.wKappa!==null){
            html+='<div style="margin-top:6px;font-size:11px;color:#94a3b8">Weighted κ = <b style="color:#e8deff">'+kRes.wKappa+'</b> ('+kRes.interpW+')</div>';
          }
        } else if(kRes&&kRes._err){
          html+='<div class="assump" style="margin-top:8px;color:#f87171">'+kRes.msg+'</div>';
        }
      }
    }
    html+='</div>';
    // ── Interpretation card ──
    html+='<div class="card"><div class="sec-hd">Interpretation (Landis & Koch 1977)</div>';
    [['< 0','Poor (below chance)','tag-red'],['0.00–0.20','Slight','tag-orange'],['0.21–0.40','Fair','tag-yellow'],['0.41–0.60','Moderate','tag-purple'],['0.61–0.80','Substantial','tag-blue'],['0.81–1.00','Almost Perfect','tag-green']].forEach(function(row){
      html+='<div style="display:flex;align-items:center;gap:9px;padding:6px 10px;background:rgba(255,255,255,.018);border-radius:7px;border:1px solid rgba(255,255,255,.04);margin-bottom:4px"><span style="font-family:monospace;font-size:11px;color:#94a3b8;width:80px">'+row[0]+'</span><span class="tag '+row[2]+'">'+row[1]+'</span></div>';
    });
    html+='<div class="assump" style="margin-top:10px"><b style="color:#818cf8">vs Cronbach α:</b><br>Cronbach α = internal consistency of a scale (same construct, multiple items).<br>Cohen κ = agreement between independent raters/coders (different judges, same items).</div>';
    html+='</div>';
    html+='</div>';
  }

  else if(currentASub==='crosstab'){
    const ctRows=[...new Set(data.map(r=>String(r[aState.ctRow])))].sort();
    const ctCols=[...new Set(data.map(r=>String(r[aState.ctCol])))].sort();
    const ctN=data.length;
    const ctMat=ctRows.map(rv=>ctCols.map(cv=>data.filter(r=>String(r[aState.ctRow])===rv&&String(r[aState.ctCol])===cv).length));
    const ctRT=ctRows.map(rv=>data.filter(r=>String(r[aState.ctRow])===rv).length);
    const ctCT=ctCols.map(cv=>data.filter(r=>String(r[aState.ctCol])===cv).length);
    const chi=tryStats(()=>SE.chiSquare(ctMat,ctRT,ctCT,ctN));
    html+='<div class="card" style="margin-bottom:12px"><div class="row">';
    html+=mkSelect('ct-row',aF,aState.ctRow,'aState.ctRow=val;renderASub()','Row');
    html+=mkSelect('ct-col',aF,aState.ctCol,'aState.ctCol=val;renderASub()','Column');
    if(chi&&!chi._err)html+='<div class="row" style="gap:5px;align-self:flex-end">'+sigBadge(chi.p)+'<span class="tag tag-purple">χ²='+chi.chi2+'</span><span class="tag tag-blue">V='+chi.V+'</span></div>';
    html+='</div></div>';
    html+='<div class="card"><div class="tbl-wrap"><table><thead><tr><th style="color:#818cf8">'+escHtml(aState.ctRow)+' \\ '+escHtml(aState.ctCol)+'</th>';
    ctCols.forEach(c=>html+='<th>'+escHtml(c)+'</th>');html+='<th>Total</th></tr></thead><tbody>';
    ctRows.forEach((rv,ri)=>{
      html+='<tr class="'+(ri%2?'':'alt')+'"><td class="td-label" style="color:#818cf8">'+escHtml(rv)+'</td>';
      ctCols.forEach((cv,ci)=>{const f=ctMat[ri][ci],pct=((f/ctN)*100).toFixed(1);const exp=chi&&chi.exp?chi.exp[ri][ci]:null;
        html+='<td><div style="font-weight:700">'+f+'</div><div style="font-size:9px;color:#64748b">'+pct+'%'+(exp?' (E='+exp.toFixed(1)+')':'')+'</div></td>';});
      html+='<td style="font-weight:700;color:#94a3b8">'+ctRT[ri]+'</td></tr>';
    });
    html+='<tr style="background:rgba(255,255,255,.02)"><td class="td-label">Total</td>';
    ctCT.forEach(v=>html+='<td style="font-weight:700;color:#94a3b8">'+v+'</td>');
    html+='<td style="font-weight:800;color:#c7d2fe">'+ctN+'</td></tr>';
    html+='</tbody></table></div></div>';
  }

  else if(currentASub==='transform'){
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Transform Variable</div>';
    html+=mkSelect('tr-fld',nF,aState.trFld,'aState.trFld=val;renderASub()','Source Variable');
    html+='<div style="margin-top:8px">'+mkCsel('tr-type',['zscore','minmax','log','log10','sqrt','square','center','rank'],aState.trType,'aState.trType=val;renderASub()','Transformation')+'</div>';
    html+='<div style="margin-top:8px"><label class="lbl">New Variable Name</label><input class="inp" value="'+aState.trNewName+'" oninput="aState.trNewName=this.value"/></div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runTransform()"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-1px"><polyline points="20 6 9 17 4 12"/></svg> Apply</button>';
    html+='<div class="assump" style="margin-top:11px">Z-score · Min-Max · Log · Sqrt · Square · Center · Rank</div>';
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Compute Variable</div>';
    html+='<div style="margin-bottom:8px"><label class="lbl">New Variable Name</label><input class="inp" value="'+aState.computeName+'" oninput="aState.computeName=this.value"/></div>';
    html+='<div style="margin-bottom:8px"><label class="lbl">Expression</label><input class="inp" style="font-family:monospace" value="'+aState.computeExpr+'" oninput="aState.computeExpr=this.value" placeholder="e.g. age * 2 + score / 10"/></div>';
    html+='<button class="btn btn-primary btn-sm" onclick="runCompute()"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-1px"><polyline points="20 6 9 17 4 12"/></svg> Apply</button>';
    html+='<div class="assump" style="margin-top:10px">Vars · +−×÷^% · abs/sqrt/log/exp/round/floor/ceil</div>';
    html+='</div></div>';
  }

  else if(currentASub==='recode'){
    const rcUniq=[...new Set(data.map(r=>r[aState.recodeFld]).filter(v=>v!==null))].slice(0,20);
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Recode Variable</div>';
    html+=mkSelect('rc-fld',aF,aState.recodeFld,'aState.recodeFld=val;renderASub()','Source Variable');
    html+='<div style="margin-top:8px">'+mkCsel('rc-type',['range','exact','binary'],aState.recodeType,'aState.recodeType=val;renderASub()','Recode Type')+'</div>';
    html+='<div style="margin-top:8px"><label class="lbl">New Variable Name</label><input class="inp" value="'+aState.recodeNewName+'" oninput="aState.recodeNewName=this.value"/></div>';
    if(aState.recodeType==='binary'){
      html+='<div class="row" style="gap:7px;margin-top:8px;margin-bottom:9px"><div style="flex:1"><label class="lbl">Value → 0</label><input class="inp" id="rc-val0" placeholder="e.g. Male"/></div><div style="flex:1"><label class="lbl">Value → 1</label><input class="inp" id="rc-val1" placeholder="e.g. Female"/></div></div>';
      html+='<button class="btn btn-primary btn-sm" onclick="runRecodeBinary()"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-1px"><polyline points="20 6 9 17 4 12"/></svg> Apply</button>';
    } else if(aState.recodeType==='exact'){
      html+='<div style="max-height:180px;overflow-y:auto;margin:9px 0">';
      html+='<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:4px;font-size:10px;color:#64748b;margin-bottom:3px"><span>Original</span><span></span><span>New Value</span></div>';
      rcUniq.forEach((v,i)=>html+='<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:4px;align-items:center;margin-bottom:4px"><div style="padding:5px 8px;background:rgba(255,255,255,.04);border-radius:6px;font-size:11.5px">'+v+'</div><span style="color:#64748b">→</span><input class="inp" style="padding:5px 8px;font-size:11.5px" id="rc-exact-'+i+'" placeholder="new"/></div>');
      html+='</div><button class="btn btn-primary btn-sm" onclick="runRecodeExact('+JSON.stringify(rcUniq)+')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-1px"><polyline points="20 6 9 17 4 12"/></svg> Apply</button>';
    } else {
      html+='<div style="margin:9px 0">';
      for(let i=0;i<3;i++)html+='<div style="display:grid;grid-template-columns:1fr auto 1fr auto 1fr;gap:4px;align-items:center;margin-bottom:5px"><input class="inp" id="rc-from-'+i+'" placeholder="From" style="font-size:11px;padding:5px 8px"/><span style="color:#64748b">–</span><input class="inp" id="rc-to-'+i+'" placeholder="To" style="font-size:11px;padding:5px 8px"/><span style="color:#64748b">→</span><input class="inp" id="rc-new-'+i+'" placeholder="Label" style="font-size:11px;padding:5px 8px"/></div>';
      html+='</div><button class="btn btn-primary btn-sm" onclick="runRecodeRange(3)"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-1px"><polyline points="20 6 9 17 4 12"/></svg> Apply</button>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Preview</div>';
    const rcV=SE.validNums(data.map(r=>r[aState.recodeFld]));
    if(rcV.length)html+='<div class="stats-grid2">'+stCard('Min',Math.min(...rcV).toFixed(2))+stCard('Max',Math.max(...rcV).toFixed(2))+stCard('Mean',SE.mean(rcV).toFixed(2))+stCard('N Valid',rcV.length)+'</div>';
    html+='<div style="margin-top:9px;font-size:11px;color:#64748b">'+rcUniq.length+' unique values</div>';
    html+='</div></div>';
  }

  else if(currentASub==='filter'){
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Filter Cases</div>';
    html+='<div style="margin-bottom:9px"><label class="lbl">Filter Expression</label><input class="inp" style="font-family:monospace" value="'+aState.filterExpr+'" oninput="aState.filterExpr=this.value" placeholder="e.g. age > 25"/></div>';
    html+='<div class="assump" style="margin-bottom:11px"><b style="color:#818cf8">Syntax:</b><br><code style="color:#60a5fa">age > 25</code> · <code style="color:#60a5fa">gender == Male</code><br><code style="color:#60a5fa">score >= 70 && age < 35</code></div>';
    html+='<div class="row" style="gap:8px"><button class="btn btn-primary btn-sm" onclick="applyFilter()">▶ Run</button>';
    if(aState.filterActive)html+='<button class="btn btn-red btn-sm" onclick="clearFilter()">✕ Clear</button>';
    html+='</div>';
    if(aState.filterActive)html+='<div style="margin-top:9px;padding:7px 11px;background:rgba(251,191,36,.06);border-radius:8px;font-size:11.5px;color:#fbbf24">Active: '+aState.filterExpr+' ('+data.length+' rows)</div>';
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Quick Filters</div>';
    html+='<div style="display:flex;flex-direction:column;gap:6px">';
    [['Complete cases only','completeCases()'],['Remove outliers (IQR)','removeOutlierFilter()']].forEach(([l,fn])=>
      html+='<button class="btn btn-ghost btn-sm" style="text-align:left;justify-content:flex-start" onclick="'+fn+'">'+l+'</button>');
    html+='</div>';
    html+='<div style="margin-top:12px;font-size:11.5px;color:#64748b">Total rows: '+data.length+'<br>With any missing: '+data.filter(r=>vars.some(v=>isMiss(r[v.name]))).length+'</div>';
    html+='</div></div>';
  }

  // ── WEIGHT CASES ──────────────────────────────────────────────────────
  else if(currentASub==='weightcases'){
    var wcNF=nF.filter(function(f){return f!=='';}); // all numeric fields
    var wcPreview=null;
    var wcVar=aState.wcVar;
    if(wcVar&&wcNF.includes(wcVar)){
      var wcVals=data.map(function(r){return Number(r[wcVar]);});
      var wcValid=wcVals.filter(function(v){return isFinite(v)&&v>0;});
      wcPreview={
        min:wcValid.length?Math.min.apply(null,wcValid).toFixed(4):'—',
        max:wcValid.length?Math.max.apply(null,wcValid).toFixed(4):'—',
        sum:wcValid.length?wcValid.reduce(function(a,b){return a+b;},0).toFixed(2):'—',
        nValid:wcValid.length,
        nZero:wcVals.filter(function(v){return v===0;}).length,
        nNeg:wcVals.filter(function(v){return isFinite(v)&&v<0;}).length,
        nMiss:wcVals.filter(function(v){return !isFinite(v);}).length,
        expandedN:Math.round(wcValid.reduce(function(a,b){return a+b;},0)),
        isInteger:wcValid.every(function(v){return Math.floor(v)===v;}),
      };
    }
    html+='<div class="grid2">';

    // ── Left: Setup ──
    html+='<div class="card">';
    html+='<div class="sec-hd">⚖ Weight Cases</div>';
    html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:13px;line-height:1.65">Pembobotan frekuensi virtual: data asli tetap ringkas, tapi semua kalkulasi statistik memperlakukan setiap baris seolah direplikasi sebanyak nilai variabel bobot. Berguna untuk data agregat (frequency table, crosstab) dan survei berbobot.</div>';

    // Active status banner
    if(aState.wcActive){
      html+='<div style="padding:9px 12px;border-radius:8px;background:rgba(251,146,60,.1);border:1px solid rgba(251,146,60,.35);margin-bottom:12px;display:flex;align-items:center;gap:9px">';
      html+='<span style="font-size:16px">⚖</span>';
      html+='<div style="flex:1"><div style="font-size:12px;font-weight:700;color:#fb923c">Weight Cases AKTIF</div>';
      html+='<div style="font-size:10.5px;color:rgba(232,222,255,.5);margin-top:1px">Variabel bobot: <b style="color:#fbbf24">'+aState.wcVar+'</b> · N efektif (ΣW): <b style="color:#34d399">'+getNEff()+'</b> · Baris asli: '+data.length+'</div></div>';
      html+='<button class="btn btn-red btn-sm" onclick="clearWeightCases()">✕ Off</button>';
      html+='</div>';
    }

    // Variable selector
    html+='<div style="margin-bottom:10px">';
    html+=mkSelect('wc-var',wcNF,aState.wcVar,'aState.wcVar=val;renderASub()','Variabel Bobot (Frequency Weight)');
    html+='</div>';

    // Method explanation
    html+='<div class="assump" style="margin-bottom:12px">';
    html+='<b style="color:#fb923c">Cara kerja:</b><br>';
    html+='Setiap baris dengan bobot <b style="color:#fbbf24">w</b> diperlakukan seperti <b style="color:#fbbf24">w</b> baris identik. ';
    html+='Baris dengan bobot ≤ 0 atau missing dikecualikan. ';
    html+='Nilai bobot desimal dibulatkan ke integer terdekat.<br><br>';
    html+='<b style="color:#67e8f9">Contoh:</b> Baris dengan <code style="color:#a5f3fc">frekuensi=5</code> → diexpand jadi 5 baris — memungkinkan SPSS-like weighted analysis.';
    html+='</div>';

    // Buttons
    html+='<div class="row" style="gap:7px">';
    html+='<button class="btn btn-primary btn-sm" onclick="runWeightCases()" '+(wcVar?'':'disabled')+'>▶ Run</button>';
    if(aState.wcActive)html+='<button class="btn btn-ghost btn-sm" onclick="clearWeightCases()">✕ Turn Off</button>';
    html+='</div>';
    html+='</div>';

    // ── Right: Preview ──
    html+='<div class="card"><div class="sec-hd">Preview & Diagnostics</div>';
    if(wcPreview){
      html+='<div class="stats-grid2" style="margin-bottom:12px">';
      html+=stCard('N Baris (raw)',data.length,'sebelum weighting');
      html+=stCard('N Efektif (∑w)',wcPreview.expandedN,'setelah weighting');
      html+=stCard('Min Weight',wcPreview.min,'');
      html+=stCard('Max Weight',wcPreview.max,'');
      html+='</div>';

      // Warning cards
      if(wcPreview.nZero>0){
        html+='<div class="miss-warn" style="margin-bottom:7px"><span>⚠</span><span>'+wcPreview.nZero+' baris dengan bobot = 0 (akan dikecualikan dari analisis)</span></div>';
      }
      if(wcPreview.nNeg>0){
        html+='<div style="padding:7px 11px;background:rgba(220,38,38,.08);border:1px solid rgba(220,38,38,.2);border-radius:8px;font-size:11.5px;color:#f87171;margin-bottom:7px">✗ '+wcPreview.nNeg+' baris memiliki bobot negatif — akan dikecualikan</div>';
      }
      if(wcPreview.nMiss>0){
        html+='<div class="miss-warn" style="margin-bottom:7px"><span>⚠</span><span>'+wcPreview.nMiss+' baris bobot missing</span></div>';
      }
      if(!wcPreview.isInteger){
        html+='<div class="miss-warn" style="margin-bottom:7px"><span>ℹ</span><span>Bobot desimal terdeteksi — akan dibulatkan ke integer (round). Pertimbangkan untuk menggunakan Integer weights.</span></div>';
      }
      if(wcPreview.nValid===0){
        html+='<div style="color:#f87171;font-size:11.5px;margin-top:8px">✗ Tidak ada baris dengan bobot valid (> 0)</div>';
      } else {
        html+='<div style="margin-top:10px">';
        html+='<div style="font-size:10.5px;font-weight:700;color:#c084fc;margin-bottom:8px">Distribusi Bobot</div>';
        // Mini histogram of weight values (top 10 unique values)
        var wv=data.map(function(r){return Number(r[wcVar]);}).filter(function(v){return isFinite(v)&&v>0;});
        var wMin=Math.min.apply(null,wv),wMax=Math.max.apply(null,wv);
        var wRange=wMax-wMin||1;
        // show simple bar list
        var wFreq={};
        wv.forEach(function(v){var k=Math.round(v);wFreq[k]=(wFreq[k]||0)+1;});
        var wEntries=Object.entries(wFreq).sort(function(a,b){return Number(a[0])-Number(b[0]);}).slice(0,10);
        var wMaxF=Math.max.apply(null,wEntries.map(function(e){return e[1];}));
        wEntries.forEach(function(e){
          var pct=Math.round(e[1]/wMaxF*100);
          html+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">';
          html+='<span style="width:32px;text-align:right;font-size:10.5px;color:#fbbf24;font-family:monospace">'+e[0]+'</span>';
          html+='<div style="flex:1;height:10px;background:rgba(255,255,255,.05);border-radius:2px"><div style="width:'+pct+'%;height:100%;background:linear-gradient(90deg,#fb923c,#f472b6);border-radius:2px"></div></div>';
          html+='<span style="font-size:10px;color:rgba(232,222,255,.4);width:28px">×'+e[1]+'</span>';
          html+='</div>';
        });
        if(wEntries.length===10) html+='<div style="font-size:10px;color:rgba(232,222,255,.3);margin-top:3px">Menampilkan 10 nilai teratas</div>';
        html+='</div>';

        html+='<div style="margin-top:12px;padding:9px 12px;background:rgba(251,146,60,.06);border-radius:8px;border:1px solid rgba(251,146,60,.18)">';
        html+='<div style="font-size:10px;font-weight:700;color:#fb923c;text-transform:uppercase;letter-spacing:.7px;margin-bottom:5px">Ringkasan</div>';
        html+='<div style="font-size:11.5px;color:rgba(232,222,255,.65);line-height:1.7">';
        html+='<b style="color:#e8deff">'+wcPreview.nValid+'</b> baris valid · Bobot ∑ = <b style="color:#fbbf24">'+wcPreview.sum+'</b> · ';
        html+='Setelah weighting: <b style="color:#34d399">N efektif = '+wcPreview.expandedN+'</b>';
        html+='</div>';
        html+='</div>';
      }
    } else {
      html+='<div class="chart-empty">Pilih variabel bobot untuk melihat preview</div>';
      html+='<div style="margin-top:16px;padding:10px 13px;background:rgba(124,58,237,.06);border-radius:8px;border:1px solid rgba(124,58,237,.12)">';
      html+='<div style="font-size:10.5px;font-weight:700;color:#c084fc;margin-bottom:7px">Kapan Weight Cases digunakan?</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.5);line-height:1.75">';
      html+='· Data sudah dalam bentuk <b style="color:#e8deff">frekuensi/tabel</b> (bukan raw data)<br>';
      html+='· Hasil <b style="color:#e8deff">crosstab</b> yang ingin dianalisis lebih lanjut<br>';
      html+='· <b style="color:#e8deff">Survei berbobot</b> dengan sampling weight<br>';
      html+='· Replikasi data berdasarkan frekuensi kategori';
      html+='</div></div>';
    }
    html+='</div>';

    html+='</div>'; // close grid2
  }

  else if(currentASub==='impute'){
    const impV=SE.validNums(data.map(r=>r[aState.imputeFld]));
    const impM=data.filter(r=>isMiss(r[aState.imputeFld])).length;
    let impVal='N/A';
    if(impV.length){const s=[...impV].sort((a,b)=>a-b);
      if(aState.imputeMethod==='mean')impVal=SE.mean(impV).toFixed(4);
      else if(aState.imputeMethod==='median')impVal=SE.quantile(s,.5).toFixed(4);
      else if(aState.imputeMethod==='zero')impVal='0';
      else if(aState.imputeMethod==='min')impVal=Math.min(...impV).toFixed(4);
      else if(aState.imputeMethod==='max')impVal=Math.max(...impV).toFixed(4);
      else if(aState.imputeMethod==='mode'){const fr={};impV.forEach(v=>{fr[v]=(fr[v]||0)+1;});impVal=Object.entries(fr).sort((a,b)=>b[1]-a[1])[0]?.[0]||'N/A';}
    }
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Missing Imputation</div>';
    html+=mkSelect('imp-fld',nF,aState.imputeFld,'aState.imputeFld=val;renderASub()','Variable');
    html+='<div style="margin-top:8px">'+mkCsel('imp-meth',['mean','median','mode','zero','min','max'],aState.imputeMethod,'aState.imputeMethod=val;renderASub()','Method')+'</div>';
    html+='<div class="stats-grid2" style="margin-top:11px">'+stCard('Missing Count',impM,((impM/data.length)*100).toFixed(1)+'%')+stCard('Impute Value',impVal,'replaces '+impM+' cells')+'</div>';
    html+='<div style="display:flex;gap:7px;margin-top:11px"><button class="btn btn-primary btn-sm" onclick="runImpute()" '+(impM===0?'disabled':'')+'><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-1px"><polyline points="20 6 9 17 4 12"/></svg> Apply</button><button class="btn btn-ghost btn-sm" onclick="imputeAllVars()">Impute All</button></div>';
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Missing Overview</div>';
    vars.filter(v=>v.type==='Numeric').forEach(v=>{const mc=data.filter(r=>isMiss(r[v.name])).length,pct=(mc/data.length)*100;
      html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="width:65px;font-size:11px;color:#94a3b8;overflow:hidden;text-overflow:ellipsis">'+escHtml(v.name)+'</span><div style="flex:1;height:7px;background:rgba(255,255,255,.055);border-radius:3px"><div style="width:'+pct+'%;height:100%;background:'+(pct>20?'#f87171':pct>5?'#fbbf24':'#34d399')+';border-radius:3px"></div></div><span style="font-size:10px;color:'+(mc>0?'#f87171':'#34d399')+';width:22px;text-align:right">'+mc+'</span></div>';
    });
    html+='</div></div>';
  }

  // ── MULTIPLE IMPUTATION ────────────────────────────────────────────────
  else if(currentASub==='mi'){
    if(!aState.miVars) aState.miVars=[];
    if(!aState.miM) aState.miM=5;
    if(!aState.miMethod) aState.miMethod='pmm';
    // Vars with missing
    var missVars=nF.filter(function(v){return data.some(function(r){return isMiss(r[v]);});});
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Multiple Imputation (MICE)</div>';
    html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:11px;line-height:1.65">MI membuat M dataset lengkap melalui imputasi iteratif, menganalisis masing-masing, lalu menggabungkan hasil (Rubin\'s Rules) — jauh lebih akurat daripada single imputation untuk riset formal.</div>';

    // Variable selection
    html+='<label class="lbl">Variables to Impute</label>';
    html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin:6px 0 10px">';
    nF.forEach(function(v){
      var mc=data.filter(function(r){return isMiss(r[v]);}).length;
      var sel=(aState.miVars||[]).includes(v);
      var hasMiss=mc>0;
      html+='<label style="display:flex;align-items:center;gap:4px;font-size:11px;cursor:pointer;padding:4px 8px;border-radius:6px;background:'+(sel?'rgba(192,132,252,.15)':'rgba(255,255,255,.03)')+';border:1px solid '+(sel?'rgba(192,132,252,.35)':'rgba(255,255,255,.07)')+';">';
      html+='<input type="checkbox" '+(sel?'checked':'')+' onchange="toggleMIVar(\''+v+'\',this.checked)" style="accent-color:#c084fc"/>';
      html+='<span style="color:'+(sel?'#c084fc':hasMiss?'#fbbf24':'rgba(232,222,255,.5)')+'">'+(hasMiss?'⚠ ':'')+v+(hasMiss?' ('+mc+')':'')+'</span>';
      html+='</label>';
    });
    html+='</div>';
    if(missVars.length&&(!aState.miVars||!aState.miVars.length)){
      html+='<button class="btn btn-ghost btn-sm" style="margin-bottom:10px" onclick="aState.miVars='+JSON.stringify(missVars)+';renderASub()">Auto-select variables with missing</button>';
    }

    // M and method
    html+='<div class="grid2" style="gap:8px;margin-bottom:10px">';
    html+='<div><label class="lbl">M (# imputations)</label>';
    html+=mkOptCsel('mi-m',[{val:5,label:'5 (standard)'},{val:10,label:'10 (thorough)'},{val:20,label:'20 (high accuracy)'},{val:50,label:'50 (publication)'}],aState.miM,'aState.miM=parseInt(_cR["mi-m"]._vals[_cR["mi-m"].fields.indexOf(val)]);renderASub()','');
    html+='</div>';
    html+='<div><label class="lbl">Method</label>';
    html+=mkOptCsel('mi-method',[{val:'pmm',label:'PMM (Predictive Mean Matching)'},{val:'norm',label:'Bayesian Normal Regression'},{val:'mice_cart',label:'CART (non-linear)'}],aState.miMethod,'aState.miMethod=_cR["mi-method"]._vals[_cR["mi-method"].fields.indexOf(val)];renderASub()','');
    html+='</div></div>';

    html+='<button class="btn btn-primary btn-sm" style="margin-top:4px" onclick="runMultipleImputation()">▶ Run</button>';

    // Preview missing pattern
    if(aState.miVars&&aState.miVars.length){
      html+='<div style="margin-top:12px"><div class="sec-hd" style="margin-bottom:6px">Selected Variables — Missing Pattern</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Variable</th><th>N Missing</th><th>% Missing</th><th>Method</th></tr></thead><tbody>';
      (aState.miVars||[]).forEach(function(v){
        var mc=data.filter(function(r){return isMiss(r[v]);}).length;
        var pct=(mc/data.length*100).toFixed(1);
        var mthd={'pmm':'PMM','norm':'Bayesian','mice_cart':'CART'}[aState.miMethod]||'PMM';
        var col=parseFloat(pct)>20?'#f87171':parseFloat(pct)>5?'#fbbf24':'#34d399';
        html+='<tr><td class="td-label">'+escHtml(v)+'</td><td class="td-num" style="color:'+col+'">'+mc+'</td><td class="td-num" style="color:'+col+'">'+pct+'%</td><td style="font-size:10.5px;color:#c084fc">'+mthd+'</td></tr>';
      });
      html+='</tbody></table></div></div>';
    }
    html+='</div>';

    // Theory panel
    html+='<div class="card"><div class="sec-hd">📖 MI — Theory & Guidance</div>';
    html+='<div style="display:flex;flex-direction:column;gap:8px">';
    [{col:'#67e8f9',title:'Why MI?',text:'Single imputation (mean/median) underestimates variance and inflates correlations. MI preserves the uncertainty of missing data, producing unbiased estimates.'},{col:'#c084fc',title:'MICE Algorithm',text:'Multiple Imputation by Chained Equations: each variable is imputed by regression on all others, iterated multiple times to achieve convergence.'},{col:'#fbbf24',title:'Rubin\'s Rules',text:'Results from M imputed datasets are combined: β̄ = (1/M)Σβₘ. Variance pools within- and between-imputation variance. Requires M≥5.'},{col:'#34d399',title:'MAR Assumption',text:'MI is valid under Missing At Random (MAR): missingness may depend on observed data but not on the missing values themselves.'}].forEach(function(tip){
      html+='<div style="padding:9px 12px;border-radius:8px;border-left:3px solid '+tip.col+';background:rgba(0,0,0,.12)">';
      html+='<div style="font-size:11px;font-weight:700;color:'+tip.col+';margin-bottom:3px">'+tip.title+'</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.65);line-height:1.55">'+tip.text+'</div>';
      html+='</div>';
    });
    html+='</div></div></div>';
  }

  else if(currentASub==='corrmatrix'){
    // Filter out any stale fields that no longer exist in current vars
    aState.cmFields=aState.cmFields.filter(function(f){return nF.includes(f);});
    if(!aState.cmFields.length)aState.cmFields=[...nF.slice(0,6)];
    html+='<div class="card" style="margin-bottom:12px"><div class="sec-hd">Correlation Heatmap</div>';
    html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px">';
    nF.forEach(f=>{const sel=aState.cmFields.includes(f);
      html+='<label style="display:inline-flex;align-items:center;gap:5px;font-size:11.5px;color:'+(sel?'#c7d2fe':'#64748b')+';cursor:pointer;padding:4px 9px;border-radius:6px;background:'+(sel?'rgba(99,102,241,.11)':'rgba(255,255,255,.024)')+';border:1px solid '+(sel?'rgba(99,102,241,.28)':'rgba(255,255,255,.055)')+'"><input type="checkbox" data-fld="'+f+'" '+(sel?'checked':'')+' onchange="toggleCMFieldEl(this)" style="accent-color:#818cf8"/>'+f+'</label>';
    });
    html+='</div>'+svgCorrMatrix(data,aState.cmFields)+'<div style="margin-top:7px;font-size:11px;color:#64748b">Blue = positive  ·  Red = negative  ·  Darker = stronger</div></div>';
    if(aState.cmFields.length>=2){
      const pairs=[];
      for(let i=0;i<aState.cmFields.length;i++)for(let j=i+1;j<aState.cmFields.length;j++){
        try{const r=SE.pearsonR(data.map(d=>d[aState.cmFields[i]]),data.map(d=>d[aState.cmFields[j]]));pairs.push([aState.cmFields[i]+'×'+aState.cmFields[j],r.r,r.p_fmt,r.strength,r.sig?'*':'ns']);}
        catch{pairs.push([aState.cmFields[i]+'×'+aState.cmFields[j],'—','—','—','—']);}
      }
      html+='<div class="card">'+mkTable(['Pair','r','p','Strength','Sig'],pairs)+'</div>';
    }
  }

  else if(currentASub==='partialcorr'){
    if(!aState.pcX) aState.pcX=nF[0]||'';
    if(!aState.pcY) aState.pcY=nF[1]||nF[0]||'';
    if(!aState.pcZ) aState.pcZ=nF[2]||nF[0]||'';
    const pcPrv=(aState.pcX&&aState.pcY&&aState.pcZ&&aState.pcX!==aState.pcY&&aState.pcX!==aState.pcZ&&aState.pcY!==aState.pcZ)
      ?tryStats(()=>SE.partialCorr(data.map(r=>r[aState.pcX]),data.map(r=>r[aState.pcY]),data.map(r=>r[aState.pcZ]))):null;
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Partial Correlation</div>';
    html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:11px;line-height:1.6">Pearson r antara X dan Y setelah membuang pengaruh linear dari variabel kontrol Z.</div>';
    html+='<label class="lbl">Variable X</label>'+mkSelect('pc-x',nF,aState.pcX,'aState.pcX=val;renderASub()','Variable X');
    html+='<div style="margin-top:8px"><label class="lbl">Variable Y</label>'+mkSelect('pc-y',nF,aState.pcY,'aState.pcY=val;renderASub()','Variable Y')+'</div>';
    html+='<div style="margin-top:8px"><label class="lbl">Control Variable (Z)</label>'+mkSelect('pc-z',nF,aState.pcZ,'aState.pcZ=val;renderASub()','Control Variable Z')+'</div>';
    html+='<div style="margin-top:8px;padding:7px 10px;background:rgba(103,232,249,.05);border-radius:7px;border:1px solid rgba(103,232,249,.15);font-size:10.5px;color:rgba(232,222,255,.45);line-height:1.6">'
      +'<b style="color:#67e8f9">Partial r</b> = korelasi X–Y setelah residualisasi terhadap Z.<br>'
      +'<b style="color:#a5f3fc">Zero-order r</b> = korelasi bivariate tanpa kontrol.</div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runPartialCorr()">▶ Run</button>';
    if(pcPrv&&!pcPrv._err){
      html+='<div class="stats-grid2" style="margin-top:11px">'+stCard('Partial r',pcPrv.rp)+stCard('r²',pcPrv.r2,'Variance explained')+stCard('p',pcPrv.p_fmt)+stCard('95% CI',pcPrv.ci95)+'</div>';
      html+='<div class="row" style="margin-top:8px">'+sigBadge(pcPrv.p)+'<span class="tag tag-gray">'+pcPrv.strength+' '+(parseFloat(pcPrv.rp)>=0?'positive':'negative')+'</span></div>';
      html+='<div style="margin-top:7px;font-size:10.5px;color:rgba(232,222,255,.4)">Zero-order: r(X,Y)='+pcPrv.rxy+' · r(X,Z)='+pcPrv.rxz+' · r(Y,Z)='+pcPrv.ryz+'</div>';
    } else if(pcPrv&&pcPrv._err){
      html+='<div class="assump" style="margin-top:9px;color:#fca5a5">⚠ '+pcPrv._err+'</div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Scatter X vs Y</div>'+svgScatter(data,aState.pcX,aState.pcY)+'</div>';
    html+='</div>';
  }

  else if(currentASub==='canonicalcorr'){
    if(!aState.ccaXs) aState.ccaXs=[];
    if(!aState.ccaYs) aState.ccaYs=[];
    aState.ccaXs=aState.ccaXs.filter(function(f){return nF.includes(f);});
    aState.ccaYs=aState.ccaYs.filter(function(f){return nF.includes(f);});
    const ccaReady=aState.ccaXs.length>=1&&aState.ccaYs.length>=1;
    const ccaPrv=ccaReady?tryStats(()=>SE.canonicalCorr(aState.ccaXs,aState.ccaYs,data)):null;
    html+='<div class="grid2">';
    // Left panel: variable selection
    html+='<div class="card"><div class="sec-hd">Canonical Correlation</div>';
    html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:11px;line-height:1.6">Hubungan antara <b style="color:#f472b6">set variabel X</b> dan <b style="color:#67e8f9">set variabel Y</b> secara simultan. Setara fitur MANOVA correlational di SPSS.</div>';
    html+='<label class="lbl" style="color:#f472b6">Set X (Predictor Variables)</label>';
    html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px;margin-bottom:12px">';
    nF.forEach(function(f){
      const sel=aState.ccaXs.includes(f);
      const disabledY=aState.ccaYs.includes(f);
      html+='<label style="display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:999px;cursor:'+(disabledY?'not-allowed':'pointer')+';font-size:11.5px;opacity:'+(disabledY?'.35':'1')+';'
        +(sel?'background:rgba(244,114,182,.18);color:#f472b6;border:1px solid rgba(244,114,182,.35);':'background:rgba(124,58,237,.06);color:rgba(232,222,255,.45);border:1px solid rgba(124,58,237,.15);')+'\">'
        +'<input type="checkbox" '+(sel?'checked':'')+(disabledY?' disabled':'')+' onchange="toggleCCAField(this,\'x\')" data-fld="'+f+'" style="accent-color:#f472b6;width:12px;height:12px"/>'+f+'</label>';
    });
    html+='</div>';
    html+='<label class="lbl" style="color:#67e8f9">Set Y (Criterion Variables)</label>';
    html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px;margin-bottom:12px">';
    nF.forEach(function(f){
      const sel=aState.ccaYs.includes(f);
      const disabledX=aState.ccaXs.includes(f);
      html+='<label style="display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:999px;cursor:'+(disabledX?'not-allowed':'pointer')+';font-size:11.5px;opacity:'+(disabledX?'.35':'1')+';'
        +(sel?'background:rgba(103,232,249,.18);color:#67e8f9;border:1px solid rgba(103,232,249,.35);':'background:rgba(124,58,237,.06);color:rgba(232,222,255,.45);border:1px solid rgba(124,58,237,.15);')+'\">'
        +'<input type="checkbox" '+(sel?'checked':'')+(disabledX?' disabled':'')+' onchange="toggleCCAField(this,\'y\')" data-fld="'+f+'" style="accent-color:#67e8f9;width:12px;height:12px"/>'+f+'</label>';
    });
    html+='</div>';
    html+='<div style="padding:7px 10px;background:rgba(192,132,252,.05);border-radius:7px;border:1px solid rgba(192,132,252,.15);font-size:10.5px;color:rgba(232,222,255,.45);line-height:1.65;margin-bottom:10px">'
      +'<b style="color:#c084fc">Rc</b> = canonical correlation (max korelasi linear antar dua set)<br>'
      +'<b style="color:#c084fc">Wilks\' λ</b> = uji signifikansi tiap fungsi kanonik<br>'
      +'<b style="color:#c084fc">Struktur koefisien</b> = loading tiap variabel ke fungsi kanonik</div>';
    html+='<button class="btn btn-primary btn-sm" onclick="runCCA()" '+(ccaReady?'':'disabled style="opacity:.45"')+'>▶ Run</button>';
    if(ccaPrv&&!ccaPrv._err){
      html+='<div class="stats-grid2" style="margin-top:11px">';
      ccaPrv.tests.slice(0,2).forEach(function(t){
        html+=stCard('Rc'+t.root, t.rc, 'Rc²='+t.rc2+' · '+t.p_fmt+(t.sig?' *':''));
      });
      html+='</div>';
    } else if(ccaPrv&&ccaPrv._err){
      html+='<div class="assump" style="margin-top:9px;color:#fca5a5">⚠ '+ccaPrv._err+'</div>';
    }
    html+='</div>';
    // Right panel: interpretation guide
    html+='<div class="card"><div class="sec-hd">Panduan Interpretasi</div>';
    html+='<div style="display:flex;flex-direction:column;gap:8px;font-size:11.5px">';
    [
      ['#f472b6','Rc (Canonical r)','Korelasi kanonik untuk setiap fungsi. Mirip r bivariate, tapi antara variate X dan variate Y.'],
      ['#67e8f9','Rc² (Canonical R²)','Proporsi varians yang dipakai bersama kedua set variate. Mirip R² di regresi.'],
      ['#c084fc','Wilks\' Lambda (λ)','Statistik uji: λ = ∏(1−Rc²). Nilai kecil = asosiasi kuat. Diuji dengan chi-square.'],
      ['#fbbf24','Struktur Koefisien','Korelasi setiap variabel asli dengan variate kanonik. Seperti factor loadings — nilai ≥ |.30| dianggap bermakna.'],
      ['#34d399','Jumlah Fungsi','Jumlah canonical functions = min(p, q). Hanya fungsi yang signifikan (p < .05) yang diinterpretasi.']
    ].forEach(function(tip){
      html+='<div style="display:flex;gap:9px;align-items:flex-start;padding:7px 9px;background:rgba(255,255,255,.02);border-radius:7px;border-left:3px solid '+tip[0]+'">'
        +'<div><div style="color:'+tip[0]+';font-weight:700;font-size:11px;margin-bottom:2px">'+tip[1]+'</div>'
        +'<div style="color:rgba(232,222,255,.5);line-height:1.5">'+tip[2]+'</div></div></div>';
    });
    html+='</div></div>';
    html+='</div>';
  }

  else if(currentASub==='charts'){
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Chart Settings</div>';
    html+=mkCsel('ch-type',['histogram','boxplot','scatter','qq'],aState.chType,'aState.chType=val;renderASub()','Chart Type');
    if(aState.chType!=='scatter')html+='<div style="margin-top:8px">'+mkSelect('ch-v',nF,aState.chV,'aState.chV=val;renderASub()','Variable')+'</div>';
    if(aState.chType==='boxplot')html+='<div style="margin-top:8px">'+mkSelect('ch-g',aF,aState.chG,'aState.chG=val;renderASub()','Group By')+'</div>';
    if(aState.chType==='scatter'){
      html+=mkSelect('sc-x',nF,aState.scX,'aState.scX=val;renderASub()','X Axis');
      html+='<div style="margin-top:8px">'+mkSelect('sc-y',nF,aState.scY,'aState.scY=val;renderASub()','Y Axis')+'</div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Preview</div>';
    if(aState.chType==='histogram')html+=svgHistogram(data,aState.chV);
    else if(aState.chType==='boxplot')html+=svgBoxplot(data,aState.chV,aState.chG);
    else if(aState.chType==='scatter')html+=svgScatter(data,aState.scX,aState.scY);
    else if(aState.chType==='qq')html+=svgQQ(data,aState.chV);
    html+='</div></div>';
  }

  else if(currentASub==='glm-poisson'||currentASub==='glm-negbin'){
    var isNB = currentASub==='glm-negbin';
    var modelLabel = isNB ? 'Negative Binomial Regression' : 'Poisson Regression';
    var modelColor = isNB ? '#fb923c' : '#34d399';
    if(!aState.cntPreds) aState.cntPreds=[];
    // Live preview
    var cntPreview=null;
    if(aState.cntDep&&aState.cntPreds.length){
      try{
        cntPreview = isNB ? SE.negbinReg(aState.cntDep,aState.cntPreds,data) : SE.poissonReg(aState.cntDep,aState.cntPreds,data);
      }catch(e){cntPreview={_err:e.message};}
    }
    html+='<div class="grid2">';
    html+='<div class="card">';
    html+='<div class="sec-hd">'+(isNB?'Negative Binomial':'Poisson')+' Regression</div>';
    html+='<div style="margin-bottom:11px">';
    html+='<label class="lbl">Count / Frequency Variable <span style="color:#67e8f9">(non-negative integers)</span></label>';
    html+=mkSelect('cnt-dep',nF,aState.cntDep,'aState.cntDep=val;if(aState.cntPreds.indexOf(val)>=0){aState.cntPreds=aState.cntPreds.filter(function(x){return x!==val;});}renderASub()','Dependent Variable (count)');
    html+='</div>';
    html+='<div style="margin-bottom:12px">';
    html+='<label class="lbl">Predictor(s) <span style="color:rgba(232,222,255,.35)">— numeric or dummy-coded</span></label>';
    html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px">';
    [...nF,...aF].filter(function(f,i,arr){return arr.indexOf(f)===i;}).forEach(function(f){
      if(f===aState.cntDep) return;
      var sel=aState.cntPreds.includes(f);
      html+='<label style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;cursor:pointer;font-size:12px;'
        +(sel?'background:rgba(52,211,153,.12);color:#34d399;border:1px solid rgba(52,211,153,.3);':'background:rgba(124,58,237,.06);color:rgba(232,222,255,.45);border:1px solid rgba(124,58,237,.15);')
        +'">'
        +'<input type="checkbox" '+(sel?'checked':'')
        +' onchange="toggleCntPred(this.dataset.fld,this.checked)" data-fld="'+f
        +'" style="accent-color:#34d399;width:13px;height:13px"/>'+f+'</label>';
    });
    html+='</div></div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="'+(isNB?'runNegBinGLM':'runPoissonGLM')+'()">▶ Run</button>';
    html+='</div>';
    // Right panel: quick reference
    html+='<div class="card"><div class="sec-hd">Panduan Model</div>';
    if(!isNB){
      html+='<div class="assump" style="margin-bottom:10px"><b style="color:#34d399">Poisson Regression</b> memodelkan data count/frekuensi yang mengikuti distribusi Poisson (mean = variance). Gunakan ketika data berupa hitungan kejadian (jumlah kasus, frekuensi kunjungan, dll.).<br><br>Link function: <span style="color:#67e8f9;font-family:monospace">log(μ) = Xβ</span><br>Koefisien diinterpretasi sebagai <b style="color:#34d399">Incidence Rate Ratio (IRR = e^β)</b>.</div>';
      html+='<div style="display:flex;flex-direction:column;gap:5px;font-size:11.5px">';
      [
        ['Deviance','Ukuran kesesuaian model (lebih kecil lebih baik)','#67e8f9'],
        ['IRR','e^β — perubahan multiplikatif pada rate per 1 unit prediktor','#34d399'],
        ['Dispersion','Pearson X²/df — jika >> 1 → overdispersion, coba NB','#fbbf24'],
        ["McFadden R²",'Pseudo-R² — analog R² untuk GLM count','#c084fc'],
        ['LR χ²','Likelihood Ratio Test: membandingkan model vs null','#f9a8d4']
      ].forEach(function(r){
        html+='<div style="display:flex;gap:8px;padding:5px 8px;background:rgba(124,58,237,.04);border-radius:6px;border-left:3px solid '+r[2]+'">';
        html+='<span style="color:'+r[2]+';font-weight:700;min-width:85px;flex-shrink:0;font-family:monospace;font-size:11px">'+r[0]+'</span>';
        html+='<span style="color:rgba(232,222,255,.55)">'+r[1]+'</span></div>';
      });
      html+='</div>';
    } else {
      html+='<div class="assump" style="margin-bottom:10px"><b style="color:#fb923c">Negative Binomial Regression</b> adalah ekstensi Poisson yang menangani <b>overdispersion</b> — ketika variance > mean. Parameter dispersi θ (theta) diestimasi dari data.<br><br>Link function: <span style="color:#67e8f9;font-family:monospace">log(μ) = Xβ</span><br>Variance: <span style="color:#fb923c;font-family:monospace">μ + μ²/θ</span><br>IRR = e^β (interpretasi sama dengan Poisson).</div>';
      html+='<div style="display:flex;flex-direction:column;gap:5px;font-size:11.5px">';
      [
        ['θ (theta)','Parameter dispersi — kecil = overdispersion besar','#fb923c'],
        ['IRR','e^β — incidence rate ratio per prediktor','#34d399'],
        ['NB vs Poisson','Jika Poisson dispersion >> 1, NB lebih tepat','#fbbf24'],
        ["McFadden R²",'Pseudo-R² berdasarkan log-likelihood','#c084fc'],
        ['LR χ²','Uji signifikansi keseluruhan model','#f9a8d4']
      ].forEach(function(r){
        html+='<div style="display:flex;gap:8px;padding:5px 8px;background:rgba(124,58,237,.04);border-radius:6px;border-left:3px solid '+r[2]+'">';
        html+='<span style="color:'+r[2]+';font-weight:700;min-width:85px;flex-shrink:0;font-family:monospace;font-size:11px">'+r[0]+'</span>';
        html+='<span style="color:rgba(232,222,255,.55)">'+r[1]+'</span></div>';
      });
      html+='</div>';
    }
    html+='</div></div>';
    // Live preview result
    if(cntPreview&&!cntPreview._err){
      html+='<div class="card"><div class="sec-hd">Preview Koefisien</div>';
      html+='<div class="stats-grid" style="margin-bottom:11px">';
      html+=stCard('N',cntPreview.n);
      html+=stCard('Log-Lik',cntPreview.logLik);
      html+=stCard('McFadden R²',cntPreview.mcFaddenR2);
      if(isNB) html+=stCard('θ (dispersion)',cntPreview.theta);
      else html+=stCard('Dispersion',cntPreview.dispersion);
      html+='</div>';
      html+=mkTable(['Predictor','β','SE','z','p','IRR','95% CI IRR'],
        cntPreview.coefs.map(function(c){return[c.name,c.b,c.se,c.z,c.p,c.irr,c.irrCI];}));
      if(cntPreview.warnings&&cntPreview.warnings.length){
        html+='<div style="margin-top:8px;padding:8px 11px;background:rgba(251,191,36,.06);border:1px solid rgba(251,191,36,.25);border-radius:7px;font-size:11.5px;color:#fbbf24">';
        cntPreview.warnings.forEach(function(w){html+='⚠ '+w+'<br>';});
        html+='</div>';
      }
      html+='</div>';
    } else if(cntPreview&&cntPreview._err){
      html+='<div class="card"><div style="color:#f87171;font-size:12px">⚠ '+cntPreview._err+'</div></div>';
    }
  }

  else if(currentASub==='glm'||currentASub==='glm-multi'||currentASub==='glm-rep'){
    // Sync glmSubType from currentASub
    aState.glmSubType = currentASub==='glm-multi' ? 'multivariate' : currentASub==='glm-rep' ? 'repeated' : 'univariate';
    if(!aState.glmMultiDeps) aState.glmMultiDeps=[];
    if(!aState.glmWithin) aState.glmWithin='';
    if(!aState.glmBetween) aState.glmBetween='';

    // ─── UNIVARIATE ───────────────────────────────────────────
    if(aState.glmSubType==='univariate'){
      var glmRes=null;
      if(aState.glmDep&&aState.glmFactors.length){
        try{glmRes=SE.glmUnivariate(data,aState.glmDep,aState.glmFactors,aState.glmCovs);}catch(e){glmRes={_err:e.message};}
      }
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">Model Setup</div>';
      html+='<div style="margin-bottom:10px">';
      html+='<label class="lbl">Dependent Variable <span style="color:#67e8f9">(numeric)</span></label>';
      html+=mkSelect('glm-dep',nF,aState.glmDep,'aState.glmDep=val;renderASub()','Dependent Variable');
      html+='</div>';
      html+='<div style="margin-bottom:10px">';
      html+='<label class="lbl">Fixed Factor(s) <span style="color:rgba(232,222,255,.35)">— categorical grouping variables</span></label>';
      html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px">';
      aF.forEach(function(f){
        if(f===aState.glmDep) return;
        var sel=aState.glmFactors.includes(f);
        html+='<label style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;cursor:pointer;font-size:12px;'
          +(sel?'background:rgba(167,139,250,.18);color:#c084fc;border:1px solid rgba(167,139,250,.3);':'background:rgba(124,58,237,.06);color:rgba(232,222,255,.45);border:1px solid rgba(124,58,237,.15);')
          +'">'
          +'<input type="checkbox" '+(sel?'checked':'')
          +' onchange="toggleGlmFactor(this.dataset.fld,this.checked)" data-fld="'+f
          +'" style="accent-color:#a78bfa;width:13px;height:13px"/>'+f+'</label>';
      });
      html+='</div></div>';
      html+='<div style="margin-bottom:12px">';
      html+='<label class="lbl">Covariate(s) <span style="color:rgba(232,222,255,.35)">— continuous predictors (optional)</span></label>';
      html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px">';
      nF.forEach(function(f){
        if(f===aState.glmDep) return;
        var sel=aState.glmCovs.includes(f);
        html+='<label style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;cursor:pointer;font-size:12px;'
          +(sel?'background:rgba(103,232,249,.12);color:#67e8f9;border:1px solid rgba(103,232,249,.3);':'background:rgba(124,58,237,.06);color:rgba(232,222,255,.45);border:1px solid rgba(124,58,237,.15);')
          +'">'
          +'<input type="checkbox" '+(sel?'checked':'')
          +' onchange="toggleGlmCov(this.dataset.fld,this.checked)" data-fld="'+f
          +'" style="accent-color:#67e8f9;width:13px;height:13px"/>'+f+'</label>';
      });
      html+='</div></div>';
      html+='<button class="btn btn-primary btn-sm" onclick="runGLM()">▶ Run</button>';
      html+='</div>';
      html+='<div class="card"><div class="sec-hd">Quick Reference</div>';
      html+='<div class="assump" style="margin-bottom:9px"><b style="color:#f9a8d4">GLM Univariate</b> = ANOVA/ANCOVA framework.<br>Include <span style="color:#c084fc">factors</span> (categorical) and/or <span style="color:#67e8f9">covariates</span> (continuous) to test their effect on the DV.</div>';
      html+='<div style="display:flex;flex-direction:column;gap:5px;font-size:11.5px">';
      [['R²','Proportion of variance explained'],['Partial η²','Effect size per predictor'],['F','Ratio of variance (between/within)'],['p < .05','Significant effect']].forEach(function(r){
        html+='<div style="display:flex;gap:8px;padding:5px 8px;background:rgba(124,58,237,.04);border-radius:6px;border:1px solid rgba(124,58,237,.1)">';
        html+='<span style="color:#c084fc;font-weight:700;width:65px;flex-shrink:0;font-family:monospace">'+r[0]+'</span>';
        html+='<span style="color:rgba(232,222,255,.55)">'+r[1]+'</span></div>';
      });
      html+='</div></div></div>';
      // Results
      if(glmRes&&!glmRes._err){
        html+='<div class="card"><div class="sec-hd">Tests of Between-Subjects Effects</div>';
        html+='<div class="stats-grid" style="margin-bottom:11px">';
        html+=stCard('N',glmRes.n)+stCard('R²',glmRes.R2)+stCard('Adj R²',glmRes.R2adj)+stCard('Grand Mean',glmRes.grandMean);
        html+='</div>';
        html+='<div class="tbl-wrap"><table><thead><tr>';
        ['Source','df','SS','MS','F','p','η²','Partial η²'].forEach(function(h){html+='<th>'+h+'</th>';});
        html+='</tr></thead><tbody>';
        glmRes.effects.forEach(function(e){
          var psig=e.sig;
          html+='<tr>';
          html+='<td style="font-weight:600;color:#c084fc">'+e.source+(e.isCov?' <span class="tag tag-blue" style="font-size:9px">cov</span>':'')+'</td>';
          html+='<td class="td-num">'+e.df+'</td>';
          html+='<td class="td-num">'+(e.SS||'—')+'</td>';
          html+='<td class="td-num">'+(e.MS||'—')+'</td>';
          html+='<td class="td-num">'+(e.F||'—')+'</td>';
          html+='<td class="td-num">'+(psig?'<b style="color:#34d399">':'')+e.p_fmt+(psig?'</b>':'')+'</td>';
          html+='<td class="td-num">'+(e.eta2||'—')+'</td>';
          html+='<td class="td-num">'+(e.partialEta2||'—')+'</td>';
          html+='</tr>';
        });
        html+='<tr style="border-top:1px solid rgba(124,58,237,.2)">';
        html+='<td style="color:rgba(232,222,255,.4)">Error</td>';
        html+='<td class="td-num">'+glmRes.dfError+'</td>';
        html+='<td class="td-num">'+glmRes.ssError+'</td>';
        html+='<td class="td-num">'+glmRes.msError+'</td>';
        html+='<td></td><td></td><td></td><td></td></tr>';
        html+='</tbody></table></div>';
        glmRes.factors.forEach(function(fac){
          var levels=glmRes.factorLevels[fac];
          if(!levels) return;
          var eff=glmRes.effects.find(function(e){return e.source===fac;});
          if(!eff||!eff.groups) return;
          html+='<div style="margin-top:12px"><div class="sec-hd" style="font-size:11px">'+escHtml(fac)+' — Estimated Marginal Means</div>';
          html+='<div class="tbl-wrap"><table><thead><tr><th>'+escHtml(fac)+'</th><th>N</th><th>Mean</th><th>SD</th><th>95% CI</th></tr></thead><tbody>';
          levels.forEach(function(g){
            var gv=eff.groups[g];
            if(!gv||!gv.length) return;
            var gm=SE.mean(gv),gs=gv.length>=2?SE.std(gv):NaN,gn=gv.length;
            var se=(gn>0&&isFinite(gs))?gs/Math.sqrt(gn):0;
            var ci=isFinite(gs)?'['+SE.f4(gm-1.96*se)+', '+SE.f4(gm+1.96*se)+']':'N/A';
            html+='<tr><td class="td-str">'+g+'</td><td class="td-num">'+gn+'</td>';
            html+='<td class="td-num">'+SE.f4(gm)+'</td><td class="td-num">'+(isFinite(gs)?SE.f4(gs):'N/A')+'</td>';
            html+='<td class="td-num" style="font-size:11px;color:#94a3b8">'+ci+'</td></tr>';
          });
          html+='</tbody></table></div></div>';
        });
        html+='</div>';
      }
    }

    // ─── MULTIVARIATE (MANOVA) ─────────────────────────────────
    else if(aState.glmSubType==='multivariate'){
      if(!aState.glmMultiDeps||!aState.glmMultiDeps.length) aState.glmMultiDeps=nF.slice(0,Math.min(2,nF.length));
      var manova=null;
      if(aState.glmMultiDeps.length>=2&&aState.glmFactors.length===1){
        try{ manova=SE.manovaProper(data,aState.glmMultiDeps,aState.glmFactors[0]); }catch(e){ manova={_err:e.message}; }
      }
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">MANOVA Setup</div>';
      html+='<div style="margin-bottom:10px">';
      html+='<label class="lbl">Dependent Variables <span style="color:#67e8f9">(select ≥2 numeric)</span></label>';
      html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px">';
      nF.forEach(function(f){
        var sel=aState.glmMultiDeps.includes(f);
        html+='<label style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;cursor:pointer;font-size:12px;'
          +(sel?'background:rgba(103,232,249,.14);color:#67e8f9;border:1px solid rgba(103,232,249,.35);':'background:rgba(124,58,237,.06);color:rgba(232,222,255,.45);border:1px solid rgba(124,58,237,.15);')
          +'">'
          +'<input type="checkbox" '+(sel?'checked':'')
          +' onchange="toggleGlmMultiDep(this.dataset.fld,this.checked)" data-fld="'+f
          +'" style="accent-color:#67e8f9;width:13px;height:13px"/>'+f+'</label>';
      });
      html+='</div></div>';
      html+='<div style="margin-bottom:12px">';
      html+='<label class="lbl">Between-Subjects Factor <span style="color:rgba(232,222,255,.35)">(select exactly 1)</span></label>';
      html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px">';
      aF.forEach(function(f){
        if(aState.glmMultiDeps.includes(f)) return;
        var sel=aState.glmFactors.includes(f);
        html+='<label style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;cursor:pointer;font-size:12px;'
          +(sel?'background:rgba(167,139,250,.18);color:#c084fc;border:1px solid rgba(167,139,250,.3);':'background:rgba(124,58,237,.06);color:rgba(232,222,255,.45);border:1px solid rgba(124,58,237,.15);')
          +'">'
          +'<input type="checkbox" '+(sel?'checked':'')
          +' onchange="toggleGlmFactor(this.dataset.fld,this.checked)" data-fld="'+f
          +'" style="accent-color:#a78bfa;width:13px;height:13px"/>'+f+'</label>';
      });
      html+='</div></div>';
      html+='<button class="btn btn-primary btn-sm" onclick="runMANOVA()">▶ Run</button>';
      html+='</div>';
      html+='<div class="card"><div class="sec-hd">About MANOVA</div>';
      html+='<div class="assump"><b style="color:#f9a8d4">Proper MANOVA</b> builds H (hypothesis) and E (error) cross-product matrices, then computes eigenvalues of E⁻¹H to derive all four multivariate test statistics.<br><br>';
      html+='<b style="color:#67e8f9">Pillai\'s Trace</b> — most robust (recommended)<br>';
      html+='<b style="color:#a5f3fc">Wilks\' Lambda</b> — most powerful when assumptions met<br>';
      html+='<b style="color:#c084fc">Hotelling-Lawley</b> — sensitive to mean differences<br>';
      html+='<b style="color:#fbbf24">Roy\'s Greatest Root</b> — upper bound (liberal)<br><br>';
      html+='<b style="color:#34d399">Box\'s M</b> tests homogeneity of covariance matrices.</div>';
      html+='</div></div>';
      // Live preview of multivariate tests
      if(manova&&!manova._err){
        html+='<div class="card"><div class="sec-hd">Multivariate Test Preview</div>';
        html+='<div class="tbl-wrap"><table><thead><tr>';
        ['Test','Value','F','df1','df2','p',''].forEach(function(h2){ html+='<th>'+h2+'</th>'; });
        html+='</tr></thead><tbody>';
        [
          ['Pillai\'s Trace',      manova.pillai],
          ['Wilks\' Lambda',       manova.wilks],
          ['Hotelling-Lawley',     manova.hotelling],
          ['Roy\'s Greatest Root', manova.roy],
        ].forEach(function(pair){
          var lbl=pair[0], t=pair[1];
          html+='<tr><td class="td-label" style="font-size:11px">'+escHtml(lbl)+'</td>';
          html+='<td class="td-num">'+t.stat+'</td><td class="td-num">'+t.F+'</td>';
          html+='<td class="td-num">'+t.df1+'</td><td class="td-num">'+t.df2+'</td>';
          html+='<td class="td-num">'+(t.sig?'<b style="color:#34d399">'+t.p_fmt+'</b>':t.p_fmt)+'</td>';
          html+='<td>'+(t.sig?'<span class="tag tag-green" style="font-size:9px">✓</span>':'<span style="font-size:9px;color:#475569">ns</span>')+'</td>';
          html+='</tr>';
        });
        html+='</tbody></table></div>';
        html+='<div style="margin-top:8px;font-size:11px;color:rgba(232,222,255,.4)">η² (Pillai) = '+manova.pillaiEta2+' &nbsp;·&nbsp; Box\'s M p = '+manova.boxP+(manova.boxSig?' <span style="color:#fbbf24">⚠ violation</span>':' <span style="color:#34d399">✓ ok</span>')+'</div>';
        html+='</div>';
      } else if(manova&&manova._err){
        html+='<div class="card"><div style="color:#f87171;font-size:12px">'+manova._err+'</div></div>';
      } else if(aState.glmMultiDeps.length<2){
        html+='<div class="card"><div style="color:rgba(232,222,255,.3);font-size:11px">Select ≥2 dependent variables and exactly 1 factor to see a live preview.</div></div>';
      } else if(aState.glmFactors.length!==1){
        html+='<div class="card"><div style="color:#fbbf24;font-size:11px">⚠ Select exactly 1 between-subjects factor for MANOVA.</div></div>';
      }
    }

    // ─── REPEATED MEASURES ─────────────────────────────────────
    else if(aState.glmSubType==='repeated'){
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">Repeated Measures Setup</div>';
      html+='<div style="margin-bottom:10px">';
      html+='<label class="lbl">Time Point 1 (Pre / Before)</label>';
      html+=mkSelect('rm-pre',nF,aState.pairedA,'aState.pairedA=val;renderASub()','Pre variable');
      html+='</div>';
      html+='<div style="margin-bottom:10px">';
      html+='<label class="lbl">Time Point 2 (Post / After)</label>';
      html+=mkSelect('rm-post',nF,aState.pairedB,'aState.pairedB=val;renderASub()','Post variable');
      html+='</div>';
      html+='<div style="margin-bottom:12px">';
      html+='<label class="lbl">Between-Subjects Factor <span style="color:rgba(232,222,255,.35)">(optional grouping)</span></label>';
      html+=mkSelect('rm-grp',['(none)',...aF],aState.glmBetween||'(none)','aState.glmBetween=val==="(none)"?"":val;renderASub()','Group factor');
      html+='</div>';
      html+='<button class="btn btn-primary btn-sm" onclick="runRepeatedMeasures()">▶ Run</button>';
      html+='</div>';
      html+='<div class="card"><div class="sec-hd">About Repeated Measures</div>';
      html+='<div class="assump"><b style="color:#f9a8d4">Repeated Measures GLM</b> examines change across time points (within-subjects) while controlling for individual differences.<br><br>This implementation uses <b style="color:#a78bfa">Paired T-Test</b> logic with optional between-subjects grouping for comparison.</div>';
      html+='<div style="margin-top:10px;padding:9px 12px;background:rgba(251,191,36,.05);border:1px solid rgba(251,191,36,.18);border-radius:8px;font-size:11px;color:#fbbf24">Tip: For 3+ time points, use the ANOVA tab with repeated-measures design.</div>';
      html+='</div></div>';
      // Quick preview of paired result
      if(aState.pairedA&&aState.pairedB&&aState.pairedA!==aState.pairedB){
        var rmRes=tryStats(function(){return SE.pairedTTest(SE.validNums(data.map(function(r){return r[aState.pairedA];})),SE.validNums(data.map(function(r){return r[aState.pairedB];})));});
        if(rmRes&&!rmRes._err){
          html+='<div class="card"><div class="sec-hd">Within-Subjects Effect</div>';
          html+='<div class="stats-grid" style="margin-bottom:11px">';
          html+=stCard('Mean Diff',rmRes.meanDiff,'SE='+rmRes.se)+stCard('t',rmRes.t,'df='+rmRes.df);
          html+=stCard("Cohen's d",rmRes.cohensD,rmRes.dInterp)+stCard('p-value',rmRes.p_fmt,rmRes.sig?'Significant':'n.s.');
          html+='</div>';
          html+='<div class="row">'+sigBadge(rmRes.p)+'<span class="assump" style="flex:1">'+aState.pairedA+' → '+aState.pairedB+': Mean change = '+rmRes.meanDiff+'</span></div>';
          html+='</div>';
        }
      }
    }
  }
  // ══════════════════════════════════════════════════════════════
  // HLM – Hierarchical Linear Model
  // ══════════════════════════════════════════════════════════════
  else if(currentASub==='hlm-2level'||currentASub==='hlm-3level'||currentASub==='hlm-icc'){

    // ── State init ──────────────────────────────────────────────
    if(!aState.hlmDep)   aState.hlmDep   = nF[0]||'';
    if(!aState.hlmGroup) aState.hlmGroup = aF[0]||'';
    if(!aState.hlmL1Preds) aState.hlmL1Preds = [];
    if(!aState.hlmL2Preds) aState.hlmL2Preds = [];
    if(!aState.hlmGroup2)  aState.hlmGroup2  = aF[1]||aF[0]||'';
    if(!aState.hlmModelType) aState.hlmModelType = 'intercept'; // intercept | slopes | crosslevel

    // ── Helper: compute ICC from data ─────── DIPINDAH ke
    // js/stats-engine/stats-glm-hlm.js (B25, 2026-09-16)

    // ── Compute live results ─────────────────────────────────────
    var hlmRes=aState.hlmDep&&aState.hlmGroup?tryStats(function(){return computeHLMBasics(aState.hlmDep,aState.hlmGroup);}):null;

    // ═══════════════════════════════════════════════════════════
    // SUB: ICC & Variance Partitioning
    // ═══════════════════════════════════════════════════════════
    if(currentASub==='hlm-icc'){
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">⬡ ICC & Variance Partitioning</div>';
      html+='<div class="assump" style="margin-bottom:12px">The <b style="color:#a78bfa">Intraclass Correlation Coefficient (ICC)</b> tells you how much variance in the outcome lives <i>between</i> groups vs. <i>within</i> groups. ICC > .05 justifies using HLM.</div>';
      html+='<label class="lbl">Outcome Variable <span style="color:#67e8f9">(numeric)</span></label>';
      html+=mkSelect('hlm-dep-icc',nF,aState.hlmDep,'aState.hlmDep=val;renderASub()','Outcome');
      html+='<div style="margin-top:8px"><label class="lbl">Level-2 Grouping Variable <span style="color:#c084fc">(e.g. class, hospital)</span></label>';
      html+=mkSelect('hlm-grp-icc',aF,aState.hlmGroup,'aState.hlmGroup=val;renderASub()','Grouping')+'</div>';
      html+='<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="runHLM()">▶ Run</button>';
      html+='</div>';
      html+='<div class="card"><div class="sec-hd">Interpretation Guide</div>';
      html+='<div style="display:flex;flex-direction:column;gap:6px;font-size:11.5px">';
      [['ICC < .05','Negligible clustering; single-level OK','#34d399'],
       ['ICC .05–.10','Small but real; HLM recommended','#fbbf24'],
       ['ICC .10–.25','Moderate clustering; HLM important','#f472b6'],
       ['ICC > .25','Strong clustering; HLM essential','#f87171']
      ].forEach(function(r){
        html+='<div style="display:flex;gap:8px;padding:6px 10px;background:rgba(124,58,237,.04);border-radius:7px;border-left:3px solid '+r[2]+'">';
        html+='<span style="color:'+r[2]+';font-weight:700;min-width:75px;font-family:monospace;font-size:11px">'+r[0]+'</span>';
        html+='<span style="color:rgba(232,222,255,.55)">'+r[1]+'</span></div>';
      });
      html+='</div>';
      html+='<div style="margin-top:12px;padding:8px 11px;background:rgba(167,139,250,.06);border:1px solid rgba(167,139,250,.2);border-radius:7px;font-size:11px;color:rgba(232,222,255,.5)">Design Effect = 1 + (ñ−1)·ICC &nbsp;→ effective N reduction due to clustering.</div>';
      html+='</div></div>';
      if(hlmRes&&!hlmRes._err){
        var iccVal=parseFloat(hlmRes.ICC);
        var iccColor=iccVal<.05?'#34d399':iccVal<.10?'#fbbf24':iccVal<.25?'#f472b6':'#f87171';
        var iccLabel=iccVal<.05?'Negligible – single-level likely OK':iccVal<.10?'Small – HLM recommended':iccVal<.25?'Moderate – HLM important':'Strong – HLM essential';
        html+='<div class="card"><div class="sec-hd">Null Model Results</div>';
        html+='<div class="stats-grid" style="margin-bottom:11px">';
        html+=stCard('ICC',hlmRes.ICC,'Intraclass Correlation')+stCard('Groups (k)',hlmRes.k,'Level-2 units');
        html+=stCard('N obs',hlmRes.n,'Level-1 units')+stCard('Grand Mean',hlmRes.grandMean,'Outcome');
        html+='</div>';
        html+='<div style="padding:10px 14px;border-radius:9px;border:1.5px solid '+iccColor+';background:rgba(124,58,237,.04);margin-bottom:11px">';
        html+='<div style="font-size:13px;font-weight:700;color:'+iccColor+'">ICC = '+hlmRes.ICC+'</div>';
        html+='<div style="font-size:11px;color:rgba(232,222,255,.55);margin-top:3px">'+iccLabel+'</div></div>';
        html+='<div class="stats-grid2" style="margin-bottom:11px">';
        html+=stCard('Between-group var',hlmRes.varBetween,'τ₀₀')+stCard('Within-group var',hlmRes.varWithin,'σ²');
        html+=stCard('Design Effect',hlmRes.design_effect,'DEFF')+stCard('F (ANOVA)',hlmRes.F+(hlmRes.sig?' *':' ns'),'One-way test');
        html+='</div>';
        if(hlmRes.grpStats&&hlmRes.grpStats.length){
          html+='<div class="sec-hd" style="font-size:11px;margin-bottom:6px">Group-Level Descriptives</div>';
          html+='<div class="tbl-wrap"><table><thead><tr><th>Group</th><th>n</th><th>Mean</th><th>SD</th></tr></thead><tbody>';
          hlmRes.grpStats.slice(0,15).forEach(function(g){
            html+='<tr><td class="td-str">'+g.group+'</td><td class="td-num">'+g.n+'</td><td class="td-num">'+g.mean+'</td><td class="td-num">'+g.sd+'</td></tr>';
          });
          if(hlmRes.grpStats.length>15) html+='<tr><td colspan="4" style="color:rgba(232,222,255,.3);font-size:11px;text-align:center">… '+( hlmRes.grpStats.length-15)+' more groups</td></tr>';
          html+='</tbody></table></div>';
        }
        html+='</div>';
      } else if(hlmRes&&hlmRes._err){
        html+='<div class="card"><div style="color:#f87171;font-size:12px">⚠ '+hlmRes._err+'</div></div>';
      }
    }

    // ═══════════════════════════════════════════════════════════
    // SUB: Two-Level HLM
    // ═══════════════════════════════════════════════════════════
    else if(currentASub==='hlm-2level'){
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">Two-Level HLM Setup</div>';
      html+='<div class="assump" style="margin-bottom:11px"><b style="color:#a78bfa">Two-Level HLM</b> — Level 1: individuals (e.g. students), Level 2: groups (e.g. classrooms). Accounts for non-independence within groups.</div>';
      html+='<div style="margin-bottom:9px"><label class="lbl">Outcome <span style="color:#67e8f9">(Level-1 numeric)</span></label>';
      html+=mkSelect('hlm2-dep',nF,aState.hlmDep,'aState.hlmDep=val;renderASub()','Outcome')+'</div>';
      html+='<div style="margin-bottom:9px"><label class="lbl">Level-2 Grouping <span style="color:#c084fc">(cluster ID)</span></label>';
      html+=mkSelect('hlm2-grp',aF,aState.hlmGroup,'aState.hlmGroup=val;renderASub()','Group')+'</div>';
      html+='<div style="margin-bottom:9px"><label class="lbl">Level-1 Predictors <span style="color:rgba(232,222,255,.35)">(within-group)</span></label>';
      html+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:5px">';
      nF.forEach(function(f){
        if(f===aState.hlmDep) return;
        var sel=aState.hlmL1Preds.includes(f);
        html+='<label style="display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:999px;cursor:pointer;font-size:11.5px;'
          +(sel?'background:rgba(103,232,249,.12);color:#67e8f9;border:1px solid rgba(103,232,249,.3);':'background:rgba(124,58,237,.06);color:rgba(232,222,255,.4);border:1px solid rgba(124,58,237,.14);')
          +'">'
          +'<input type="checkbox" '+(sel?'checked':'')
          +' onchange="toggleHlmL1(this.dataset.fld,this.checked)" data-fld="'+f
          +'" style="accent-color:#67e8f9;width:12px;height:12px"/>'+f+'</label>';
      });
      html+='</div></div>';
      html+='<div style="margin-bottom:12px"><label class="lbl">Level-2 Predictors <span style="color:rgba(232,222,255,.35)">(between-group)</span></label>';
      html+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:5px">';
      nF.concat(aF).filter(function(f,i,a){return a.indexOf(f)===i&&f!==aState.hlmDep&&f!==aState.hlmGroup;}).forEach(function(f){
        var sel=aState.hlmL2Preds.includes(f);
        html+='<label style="display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:999px;cursor:pointer;font-size:11.5px;'
          +(sel?'background:rgba(167,139,250,.14);color:#c084fc;border:1px solid rgba(167,139,250,.28);':'background:rgba(124,58,237,.06);color:rgba(232,222,255,.4);border:1px solid rgba(124,58,237,.14);')
          +'">'
          +'<input type="checkbox" '+(sel?'checked':'')
          +' onchange="toggleHlmL2(this.dataset.fld,this.checked)" data-fld="'+f
          +'" style="accent-color:#a78bfa;width:12px;height:12px"/>'+f+'</label>';
      });
      html+='</div></div>';
      html+='<div style="margin-bottom:12px"><label class="lbl">Model Type</label>';
      html+=mkOptCsel('hlm-modeltype',
        [{val:'intercept',label:'Random Intercept'},{val:'slopes',label:'Random Slopes'},{val:'crosslevel',label:'Cross-Level Interaction'}],
        aState.hlmModelType,
        'aState.hlmModelType=_cR["hlm-modeltype"]._vals[_cR["hlm-modeltype"].fields.indexOf(val)];renderASub()',
        '');
      html+='</div>';
      html+='<button class="btn btn-primary btn-sm" onclick="runHLM()">▶ Run</button>';
      html+='</div>';
      html+='<div class="card"><div class="sec-hd">Model Equations</div>';
      html+='<div style="font-size:11.5px;line-height:1.8;color:rgba(232,222,255,.55)">';
      html+='<div style="padding:10px 12px;background:rgba(167,139,250,.06);border-radius:8px;border:1px solid rgba(167,139,250,.15);margin-bottom:10px;font-family:monospace;font-size:11px">';
      html+='<div style="color:#a78bfa;font-weight:700;margin-bottom:5px">Level 1 (within-group):</div>';
      html+='Y<sub>ij</sub> = β<sub>0j</sub> + β<sub>1j</sub>·X<sub>ij</sub> + r<sub>ij</sub><br>';
      html+='<div style="color:#a78bfa;font-weight:700;margin:7px 0 5px">Level 2 (between-group):</div>';
      html+='β<sub>0j</sub> = γ<sub>00</sub> + γ<sub>01</sub>·W<sub>j</sub> + u<sub>0j</sub><br>';
      html+='β<sub>1j</sub> = γ<sub>10</sub> + γ<sub>11</sub>·W<sub>j</sub> + u<sub>1j</sub>';
      html+='</div>';
      html+='<div style="display:flex;flex-direction:column;gap:5px">';
      [['γ₀₀','Grand intercept (fixed)'],['γ₀₁','Level-2 predictor effect on intercept'],['γ₁₀','Level-1 slope (fixed)'],['γ₁₁','Cross-level interaction'],['u₀ⱼ','Random intercept variance (τ₀₀)'],['u₁ⱼ','Random slope variance (τ₁₁)'],['rᵢⱼ','Level-1 residual (σ²)']].forEach(function(r){
        html+='<div style="display:flex;gap:8px;padding:4px 8px;border-radius:5px;background:rgba(124,58,237,.04)">';
        html+='<span style="color:#c084fc;font-family:monospace;min-width:35px">'+r[0]+'</span><span>'+r[1]+'</span></div>';
      });
      html+='</div></div></div></div>';
      // ICC preview from null model
      if(hlmRes&&!hlmRes._err){
        var iccV=parseFloat(hlmRes.ICC);
        html+='<div class="card"><div class="sec-hd">Null Model Diagnostics</div>';
        html+='<div class="stats-grid" style="margin-bottom:11px">';
        html+=stCard('ICC',hlmRes.ICC,'Clustering strength')+stCard('Groups',hlmRes.k,'Level-2 units');
        html+=stCard('τ₀₀',hlmRes.varBetween,'Between-group var')+stCard('σ²',hlmRes.varWithin,'Within-group var');
        html+='</div>';
        var iccMsg=iccV<.05?'Minimal clustering. Consider whether HLM is necessary.':iccV<.10?'Small but real clustering. HLM recommended.':'Meaningful clustering. HLM is important here.';
        html+='<div class="assump"><span style="color:#a78bfa">ICC = '+hlmRes.ICC+'</span> — '+iccMsg+'</div>';
        html+='</div>';
      }
    }

    // ═══════════════════════════════════════════════════════════
    // SUB: Three-Level HLM
    // ═══════════════════════════════════════════════════════════
    else if(currentASub==='hlm-3level'){
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">Three-Level HLM Setup</div>';
      html+='<div class="assump" style="margin-bottom:11px"><b style="color:#a78bfa">Three-Level HLM</b> — e.g. students (L1) nested in classrooms (L2) nested in schools (L3). Partitions variance across all three levels.</div>';
      html+='<div style="margin-bottom:9px"><label class="lbl">Outcome <span style="color:#67e8f9">(Level-1 numeric)</span></label>';
      html+=mkSelect('hlm3-dep',nF,aState.hlmDep,'aState.hlmDep=val;renderASub()','Outcome')+'</div>';
      html+='<div style="margin-bottom:9px"><label class="lbl">Level-2 Grouping <span style="color:#f472b6">(e.g. classroom)</span></label>';
      html+=mkSelect('hlm3-grp',aF,aState.hlmGroup,'aState.hlmGroup=val;renderASub()','Level-2 group')+'</div>';
      html+='<div style="margin-bottom:9px"><label class="lbl">Level-3 Grouping <span style="color:#c084fc">(e.g. school)</span></label>';
      html+=mkSelect('hlm3-grp2',aF,aState.hlmGroup2,'aState.hlmGroup2=val;renderASub()','Level-3 group')+'</div>';
      html+='<div style="margin-bottom:12px"><label class="lbl">Level-1 Predictors</label>';
      html+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:5px">';
      nF.forEach(function(f){
        if(f===aState.hlmDep) return;
        var sel=aState.hlmL1Preds.includes(f);
        html+='<label style="display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:999px;cursor:pointer;font-size:11.5px;'
          +(sel?'background:rgba(103,232,249,.12);color:#67e8f9;border:1px solid rgba(103,232,249,.3);':'background:rgba(124,58,237,.06);color:rgba(232,222,255,.4);border:1px solid rgba(124,58,237,.14);')
          +'">'
          +'<input type="checkbox" '+(sel?'checked':'')
          +' onchange="toggleHlmL1(this.dataset.fld,this.checked)" data-fld="'+f
          +'" style="accent-color:#67e8f9;width:12px;height:12px"/>'+f+'</label>';
      });
      html+='</div></div>';
      html+='<button class="btn btn-primary btn-sm" onclick="runHLM()">▶ Run</button>';
      html+='</div>';
      html+='<div class="card"><div class="sec-hd">Variance Decomposition</div>';
      html+='<div class="assump" style="margin-bottom:10px">In a 3-level model, the total variance is split into three components:</div>';
      html+='<div style="display:flex;flex-direction:column;gap:6px;font-size:11.5px">';
      [['σ² (Level 1)','Residual within-group variance','#67e8f9'],
       ['τ₀₀ L2 (Level 2)','Between-group-within-cluster variance','#f472b6'],
       ['τ₀₀ L3 (Level 3)','Between-cluster variance','#a78bfa']
      ].forEach(function(r){
        html+='<div style="display:flex;gap:8px;padding:7px 10px;background:rgba(124,58,237,.04);border-radius:7px;border-left:3px solid '+r[2]+'">';
        html+='<span style="color:'+r[2]+';font-weight:700;font-family:monospace;min-width:110px;font-size:11px">'+r[0]+'</span>';
        html+='<span style="color:rgba(232,222,255,.55)">'+r[1]+'</span></div>';
      });
      html+='</div>';
      html+='<div style="margin-top:12px;padding:9px 12px;background:rgba(251,191,36,.05);border:1px solid rgba(251,191,36,.18);border-radius:8px;font-size:11px;color:#fbbf24">⚠ Three-level models require large samples (≥ 30 level-3 units recommended). Results shown are ICC-based approximations from the two-level groupings.</div>';
      html+='</div></div>';
      // Show L2 and L3 ICC approximations
      var hlmRes3=aState.hlmGroup2&&aState.hlmDep?tryStats(function(){return computeHLMBasics(aState.hlmDep,aState.hlmGroup2);}):null;
      if(hlmRes&&!hlmRes._err&&hlmRes3&&!hlmRes3._err){
        html+='<div class="card"><div class="sec-hd">Variance Partition Estimates</div>';
        html+='<div class="stats-grid" style="margin-bottom:11px">';
        html+=stCard('ICC (L2)',hlmRes.ICC,'Level-2 clustering')+stCard('τ₀₀ L2',hlmRes.varBetween,'Between L2 variance');
        html+=stCard('ICC (L3)',hlmRes3.ICC,'Level-3 clustering')+stCard('τ₀₀ L3',hlmRes3.varBetween,'Between L3 variance');
        html+='</div>';
        html+='<div style="font-size:11px;color:rgba(232,222,255,.4)">Within-group σ² ≈ '+hlmRes.varWithin+' &nbsp;·&nbsp; Grand Mean = '+hlmRes.grandMean+'</div>';
        html+='</div>';
      }
    }
  }

  else if(currentASub==='efa'){
    if(aState.efaVars===null||aState.efaVars===undefined) aState.efaVars=nF.slice(0,Math.min(5,nF.length));
    if(!aState.efaFactors) aState.efaFactors=2;
    if(!aState.efaRotation) aState.efaRotation='varimax';

    // Live preview stats
    var efaPreview=null;
    if(aState.efaVars.length>=2&&aState.efaFactors>=1&&aState.efaFactors<=aState.efaVars.length){
      efaPreview=tryStats(function(){
        var matrix=aState.efaVars.map(function(v){return SE.validNums(data.map(function(r){return r[v];}));});
        var minLen=Math.min.apply(null,matrix.map(function(m){return m.length;}));
        matrix=matrix.map(function(m){return m.slice(0,minLen);});
        return SE.efa(matrix,aState.efaFactors,aState.efaRotation);
      });
    }

    html+='<div class="grid2">';
    // ── Left: settings ──
    html+='<div class="card"><div class="sec-hd">Exploratory Factor Analysis</div>';
    html+='<div style="margin-bottom:10px"><label class="lbl">Variables <span style="color:#67e8f9">(select ≥2 numeric)</span></label>';
    html+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:5px;max-height:160px;overflow-y:auto">';
    nF.forEach(function(f){
      var sel=aState.efaVars.includes(f);
      html+='<label style="display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:999px;cursor:pointer;font-size:11.5px;'
        +(sel?'background:rgba(165,243,252,.12);color:#a5f3fc;border:1px solid rgba(165,243,252,.3);':'background:rgba(124,58,237,.06);color:rgba(232,222,255,.4);border:1px solid rgba(124,58,237,.12);')
        +'">'
        +'<input type="checkbox" '+(sel?'checked':'')
        +' onchange="toggleEfaVar(this.dataset.fld,this.checked)" data-fld="'+f
        +'" style="accent-color:#a5f3fc;width:12px;height:12px"/>'+f+'</label>';
    });
    html+='</div></div>';
    html+='<div class="row" style="gap:11px;margin-bottom:10px">';
    html+='<div style="flex:1"><label class="lbl">Number of Factors</label>';
    html+='<input class="inp" type="number" min="1" max="'+(aState.efaVars.length||10)+'" value="'+aState.efaFactors+'" oninput="aState.efaFactors=Math.max(1,Math.min(parseInt(this.value)||2,aState.efaVars.length||1));renderASub()" style="width:100%"/></div>';
    html+='<div style="flex:1">'+mkCsel('efa-rot',['varimax','none'],aState.efaRotation,'aState.efaRotation=val;renderASub()','Rotation')+'</div>';
    html+='</div>';
    html+='<button class="btn btn-primary btn-sm" onclick="runEFA()">▶ Run</button>';
    // Preview KMO + Bartlett
    if(efaPreview&&!efaPreview._err){
      var kmoColor=parseFloat(efaPreview.kmo)>=0.7?'#34d399':parseFloat(efaPreview.kmo)>=0.5?'#fbbf24':'#f87171';
      html+='<div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:7px">';
      html+='<div class="sb"><div class="sb-label">KMO</div><div class="sb-value" style="color:'+kmoColor+'">'+efaPreview.kmo+'</div><div style="font-size:9.5px;color:'+kmoColor+';margin-top:2px">'+efaPreview.kmoInterp+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Bartlett χ²</div><div class="sb-value">'+efaPreview.chi2+'</div><div style="font-size:9.5px;color:'+(efaPreview.bartSig?'#34d399':'#f87171')+'">df='+efaPreview.bartDf+' · p='+(efaPreview.bartP||'N/A')+'</div></div>';
      html+='</div>';
    }
    if(efaPreview&&efaPreview._err){
      html+='<div class="miss-warn" style="margin-top:10px">'+efaPreview.msg+'</div>';
    }
    html+='</div>';

    // ── Right: scree plot + eigenvalues ──
    html+='<div class="card"><div class="sec-hd">Scree Plot</div>';
    if(efaPreview&&!efaPreview._err){
      html+=svgScreePlot(efaPreview.eigenvalues,efaPreview.nFactors);
      html+='<div class="tbl-wrap" style="margin-top:10px"><table><thead><tr><th>Factor</th><th>Eigenvalue</th><th>Variance %</th><th>Cumulative %</th></tr></thead><tbody>';
      efaPreview.eigenvalues.forEach(function(ev,i){
        var isSel=i<efaPreview.nFactors;
        html+='<tr'+(isSel?' style="background:rgba(165,243,252,.06)"':'')+'>';
        html+='<td style="color:'+(isSel?'#a5f3fc':'rgba(232,222,255,.4)')+'">F'+(i+1)+'</td>';
        html+='<td class="td-num" style="color:'+(parseFloat(ev)>1?'#a5f3fc':'rgba(232,222,255,.4)')+'">'+ev+'</td>';
        html+='<td class="td-num">'+(efaPreview.varExp[i]||'—')+'%</td>';
        html+='<td class="td-num">'+(efaPreview.cumVar[i]||'—')+'%</td>';
        html+='</tr>';
      });
      html+='</tbody></table></div>';
      html+='<div style="margin-top:6px;font-size:10px;color:rgba(232,222,255,.3)">Kaiser criterion: retain factors with Eigenvalue > 1 · Highlighted = retained</div>';
    } else {
      html+='<div class="chart-empty">Select ≥2 variables to see scree plot</div>';
    }
    html+='</div></div>';

    // ── Factor Loading Matrix ──
    if(efaPreview&&!efaPreview._err){
      html+='<div class="card"><div class="sec-hd">Factor Loading Matrix <span style="font-size:10px;font-style:normal;color:rgba(232,222,255,.35);margin-left:8px">('+efaPreview.rotation+' rotation · |loading| ≥ 0.40 highlighted)</span></div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Variable</th>';
      for(var f=0;f<efaPreview.nFactors;f++) html+='<th>F'+(f+1)+'</th>';
      html+='<th>Communality h²</th></tr></thead><tbody>';
      aState.efaVars.forEach(function(v,i){
        html+='<tr><td class="td-label">'+escHtml(v)+'</td>';
        efaPreview.loadings[i].forEach(function(l){
          var absL=Math.abs(parseFloat(l));
          var highlight=absL>=0.4;
          var col=absL>=0.6?'#a5f3fc':absL>=0.4?'#c084fc':'rgba(232,222,255,.4)';
          html+='<td class="td-num" style="color:'+col+';font-weight:'+(highlight?700:400)+'">'+l+'</td>';
        });
        html+='<td class="td-num" style="color:#fbbf24">'+efaPreview.communalities[i]+'</td>';
        html+='</tr>';
      });
      html+='</tbody></table></div>';
      html+='<div style="margin-top:8px;font-size:11px;color:rgba(232,222,255,.35)">Cyan = strong (≥0.60) · Purple = moderate (≥0.40) · Total variance explained: '+efaPreview.cumVar[efaPreview.nFactors-1]+'%</div>';
      html+='</div>';
    }
  }

  else if(currentASub==='cfa'){
    // Initialize CFA state
    if(!aState.cfaVars||!Array.isArray(aState.cfaVars)) aState.cfaVars=nF.slice(0,Math.min(6,nF.length));
    if(!aState.cfaFactors||aState.cfaFactors<1) aState.cfaFactors=1;
    if(!aState.cfaFactorNames||aState.cfaFactorNames.length!==aState.cfaFactors){
      aState.cfaFactorNames=[];
      for(var fi=0;fi<aState.cfaFactors;fi++) aState.cfaFactorNames.push('F'+(fi+1));
    }
    if(!aState.cfaFactorMap||typeof aState.cfaFactorMap!=='object') aState.cfaFactorMap={};
    // Ensure factorMap keys match factorNames
    var newMap={};
    aState.cfaFactorNames.forEach(function(fn){
      newMap[fn]=aState.cfaFactorMap[fn]||[];
    });
    aState.cfaFactorMap=newMap;

    // Try live CFA
    var cfaPreview=null;
    var cfaReady=Object.keys(aState.cfaFactorMap).some(function(fn){return aState.cfaFactorMap[fn].length>=2;});
    if(cfaReady){
      cfaPreview=tryStats(function(){
        var allVars=[];
        aState.cfaFactorNames.forEach(function(fn){aState.cfaFactorMap[fn].forEach(function(v){if(!allVars.includes(v))allVars.push(v);});});
        var matrix=allVars.map(function(v){return SE.validNums(data.map(function(r){return r[v];}));});
        var minLen=Math.min.apply(null,matrix.map(function(m){return m.length;}));
        matrix=matrix.map(function(m){return m.slice(0,minLen);});
        return SE.cfa(matrix,aState.cfaFactorMap);
      });
    }

    html+='<div class="grid2">';
    // ── Left: CFA setup ──
    html+='<div class="card"><div class="sec-hd">Confirmatory Factor Analysis (CFA)</div>';
    html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:12px;line-height:1.6">Tentukan jumlah faktor laten dan assign variabel ke masing-masing faktor. CFA akan menghitung fit indices: CFI, TLI, RMSEA, SRMR.</div>';
    // Number of factors
    html+='<div style="margin-bottom:10px">'+mkCsel('cfa-nfac',['1','2','3','4','5'],String(aState.cfaFactors),'setCfaFactors(parseInt(val))','Jumlah Faktor Laten')+'</div>';

    // Factor name + indicator assignment
    aState.cfaFactorNames.forEach(function(fn, fi){
      var factColor=['#818cf8','#f472b6','#34d399','#fbbf24','#67e8f9'][fi%5];
      html+='<div style="margin-bottom:12px;padding:10px;border-radius:8px;border:1px solid rgba(129,140,248,.18);background:rgba(129,140,248,.04)">';
      html+='<div style="display:flex;align-items:center;gap:7px;margin-bottom:8px">';
      html+='<div style="width:8px;height:8px;border-radius:50%;background:'+factColor+';flex-shrink:0"></div>';
      html+='<input class="inp" style="flex:1;font-weight:700;font-size:12px;padding:5px 9px" value="'+fn+'" oninput="renameCfaFactor('+fi+',this.value)" placeholder="Nama Faktor"/>';
      html+='</div>';
      html+='<div style="font-size:10.5px;color:rgba(232,222,255,.35);margin-bottom:5px">Pilih indikator untuk <b style="color:'+factColor+'">'+fn+'</b> (min 2 variabel):</div>';
      html+='<div style="display:flex;flex-wrap:wrap;gap:3px">';
      nF.forEach(function(v){
        var assigned=aState.cfaFactorMap[fn]&&aState.cfaFactorMap[fn].includes(v);
        var safeFn=fn.replace(/'/g,"\'");
        var safeV=v.replace(/'/g,"\'");
        html+='<label style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:999px;cursor:pointer;font-size:11px;'
          +(assigned?'background:rgba(129,140,248,.18);color:'+factColor+';border:1px solid rgba(129,140,248,.35);':'background:rgba(124,58,237,.06);color:rgba(232,222,255,.4);border:1px solid rgba(124,58,237,.12);')
          +'">'
          +'<input type="checkbox" '+(assigned?'checked':'')
          +' data-fn="'+safeFn+'" data-v="'+safeV+'" onchange="toggleCfaVar(this.dataset.fn,this.dataset.v,this.checked)" style="accent-color:'+factColor+';width:11px;height:11px"/>'+v+'</label>';
      });
      html+='</div>';
      var cnt=aState.cfaFactorMap[fn]?aState.cfaFactorMap[fn].length:0;
      if(cnt<2) html+='<div style="font-size:10px;color:#f87171;margin-top:4px">⚠ Min 2 indikator per faktor</div>';
      html+='</div>';
    });

    html+='<button class="btn btn-primary btn-sm" onclick="runCFA()" style="margin-top:4px">▶ Run</button>';
    html+='</div>';

    // ── Right: Fit indices preview ──
    html+='<div class="card"><div class="sec-hd">Fit Indices (Live Preview)</div>';
    if(!cfaReady){
      html+='<div class="chart-empty" style="padding:32px 0">Assign min 2 indikator ke salah satu faktor untuk melihat fit indices.</div>';
    } else if(cfaPreview&&cfaPreview._err){
      html+='<div class="miss-warn">'+cfaPreview.msg+'</div>';
    } else if(cfaPreview){
      var r=cfaPreview;
      // Overall fit badge
      html+='<div style="margin-bottom:12px;padding:10px 14px;border-radius:9px;background:rgba(0,0,0,.15);border:1px solid '+r.fitColor+';text-align:center">';
      html+='<div style="font-size:14px;font-weight:900;color:'+r.fitColor+';font-family:Playfair Display,serif">'+r.overallFit+'</div>';
      html+='<div style="font-size:10px;color:rgba(232,222,255,.4);margin-top:2px">N='+r.n+' · '+r.p+' observed vars · '+r.nFactors+' latent factor'+(r.nFactors>1?'s':'')+'</div>';
      html+='</div>';

      // Fit index cards
      function fitCard(name, val, interp, good, cutoff, color){
        return '<div class="sb"><div class="sb-label">'+escHtml(name)+'</div>'
          +'<div class="sb-value" style="color:'+color+'">'+val+'</div>'
          +'<div style="font-size:9.5px;color:'+color+';margin-top:2px">'+interp+'</div>'
          +'<div style="font-size:9px;color:rgba(232,222,255,.25);margin-top:1px">'+cutoff+'</div></div>';
      }
      var cficol=r.CFI_raw>=0.95?'#34d399':r.CFI_raw>=0.90?'#fbbf24':'#f87171';
      var tlicol=r.TLI_raw>=0.95?'#34d399':r.TLI_raw>=0.90?'#fbbf24':'#f87171';
      var rmsecol=r.RMSEA_raw<=0.05?'#34d399':r.RMSEA_raw<=0.08?'#fbbf24':'#f87171';
      var srmrcol=r.SRMR_raw<=0.05?'#34d399':r.SRMR_raw<=0.08?'#fbbf24':'#f87171';
      html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">';
      html+=fitCard('CFI',r.CFI,r.CFIinterp,true,'≥ 0.95 excellent, ≥ 0.90 OK',cficol);
      html+=fitCard('TLI (NNFI)',r.TLI,r.TLIinterp,true,'≥ 0.95 excellent, ≥ 0.90 OK',tlicol);
      html+=fitCard('RMSEA',r.RMSEA,r.RMSEAinterp,false,'≤ 0.05 excellent, ≤ 0.08 OK',rmsecol);
      html+=fitCard('SRMR',r.SRMR,r.SRMRinterp,false,'≤ 0.05 excellent, ≤ 0.08 OK',srmrcol);
      html+='</div>';
      // RMSEA CI
      html+='<div style="font-size:10.5px;color:rgba(232,222,255,.45);margin-bottom:8px">RMSEA 90% CI: ['+r.RMSEA_lo+', '+r.RMSEA_hi+'] &nbsp;·&nbsp; χ²('+r.dfModel+')='+r.chiSq+', p='+r.pChiSq+'</div>';
      // Chi-square note
      html+='<div style="font-size:10px;color:rgba(232,222,255,.3);line-height:1.5">χ² sensitif terhadap N besar. Utamakan CFI ≥ .95, RMSEA ≤ .06, SRMR ≤ .08 untuk menentukan model fit.</div>';
    }
    html+='</div></div>';

    // ── Factor Loadings Table ──
    if(cfaPreview&&!cfaPreview._err){
      var r=cfaPreview;
      html+='<div class="card"><div class="sec-hd">Factor Loadings (Standardized)</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Faktor</th><th>Indikator</th><th>Loading (λ)</th><th>Communality (h²)</th><th>Keterangan</th></tr></thead><tbody>';
      r.factorNames.forEach(function(fn, fi){
        var factColor=['#818cf8','#f472b6','#34d399','#fbbf24','#67e8f9'][fi%5];
        var vars=r.factorMap[fn]||[];
        vars.forEach(function(v, vi){
          var vIdx=r.varNames.indexOf(v);
          var lam=vIdx>=0?r.lambda[vIdx][fi]:null;
          var h2=vIdx>=0?r.communalities[vIdx]:null;
          var lamNum=lam!==null?parseFloat(lam):null;
          var lamCol=lamNum!==null?(Math.abs(lamNum)>=0.7?'#34d399':Math.abs(lamNum)>=0.5?'#a5f3fc':Math.abs(lamNum)>=0.3?'#fbbf24':'#f87171'):'rgba(232,222,255,.4)';
          var h2num=h2!==null?parseFloat(h2):null;
          var h2col=h2num!==null?(h2num>=0.7?'#34d399':h2num>=0.4?'#fbbf24':'#f87171'):'rgba(232,222,255,.4)';
          html+='<tr>';
          if(vi===0) html+='<td class="td-label" rowspan="'+vars.length+'" style="color:'+factColor+';font-weight:800;vertical-align:top;padding-top:10px">'+escHtml(fn)+'</td>';
          html+='<td class="td-label">'+escHtml(v)+'</td>';
          html+='<td class="td-num" style="color:'+lamCol+';font-weight:'+(Math.abs(lamNum||0)>=0.5?700:400)+'">'+( lam!==null?lam:'—' )+'</td>';
          html+='<td class="td-num" style="color:'+h2col+'">'+( h2!==null?h2:'—' )+'</td>';
          html+='<td><span class="tag" style="font-size:9px;'+( lamNum!==null&&Math.abs(lamNum)>=0.5?'background:rgba(52,211,153,.12);color:#34d399;border:1px solid rgba(52,211,153,.25)':'background:rgba(248,113,113,.1);color:#f87171;border:1px solid rgba(248,113,113,.2)' )+'">'+( lamNum!==null&&Math.abs(lamNum)>=0.5?'✓ Adequate':'✗ Weak' )+'</span></td>';
          html+='</tr>';
        });
      });
      html+='</tbody></table></div>';
      html+='<div style="margin-top:8px;font-size:10.5px;color:rgba(232,222,255,.35)">Loading ≥ 0.70 = strong · ≥ 0.50 = adequate · &lt; 0.30 = weak. Communality ≥ 0.40 disarankan.</div>';
      html+='</div>';

      // Residual matrix
      html+='<div class="card"><div class="sec-hd">Residual Correlation Matrix (R − Σ̂)</div>';
      html+='<div style="overflow-x:auto"><table style="font-size:11px"><thead><tr><th></th>';
      r.varNames.forEach(function(v){ html+='<th>'+escHtml(v)+'</th>'; });
      html+='</tr></thead><tbody>';
      r.varNames.forEach(function(v, i){
        html+='<tr><td class="td-label">'+escHtml(v)+'</td>';
        r.varNames.forEach(function(vj, j){
          var resid=r.R[i][j]-r.Sigma[i][j];
          var absR=Math.abs(resid);
          var col=absR>0.1?'#f87171':absR>0.05?'#fbbf24':'rgba(232,222,255,.45)';
          html+='<td class="td-num" style="font-size:10px;color:'+col+'">'+SE.f4(resid)+'</td>';
        });
        html+='</tr>';
      });
      html+='</tbody></table></div>';
      html+='<div style="font-size:10px;color:rgba(232,222,255,.3);margin-top:6px">Residual &gt; 0.10 (merah) mengindikasikan misfitting item pairs.</div>';
      html+='</div>';
    }
  }

    else if(currentASub==='mediation'){
    if(!aState.medM) aState.medM=[];
    if(!aState.medBootN) aState.medBootN=5000;

    // Live path preview (Baron-Kenny steps)
    var medPreview=null;
    var canPreview=aState.medX&&aState.medY&&aState.medM.length>=1;
    if(canPreview){
      medPreview=tryStats(function(){return computeMediation(aState.medX,aState.medM,aState.medY,500);});
    }

    html+='<div class="card"><div class="sec-hd">Mediation Analysis <span style="font-size:10px;font-style:normal;color:rgba(232,222,255,.3);margin-left:7px">Baron-Kenny Steps · Sobel Test · Bootstrap CI</span></div>';
    html+='<div style="font-size:11.5px;color:rgba(232,222,255,.45);margin-bottom:12px;line-height:1.7">Apakah variabel <b style="color:#fb923c">X</b> berpengaruh terhadap <b style="color:#67e8f9">Y</b> <em>melalui</em> <b style="color:#f472b6">M</b>? Mediation Analysis menjawab pertanyaan ini dengan menghitung efek tidak langsung (indirect effect) menggunakan Sobel test dan Bootstrap confidence interval.</div>';

    // Path Diagram SVG
    var numM=aState.medM.length;
    html+='<div style="margin-bottom:14px;background:rgba(124,58,237,.04);border:1px solid rgba(124,58,237,.12);border-radius:10px;padding:12px;text-align:center">';
    html+=svgMediationPath(aState.medX||'X',aState.medM,aState.medY||'Y',medPreview);
    html+='</div>';

    html+='<div class="grid2">';
    // Left column: variable selection
    html+='<div>';
    html+='<div style="margin-bottom:9px"><label class="lbl">Independent Variable (X) <span style="color:#fb923c">●</span></label>'+mkSelect('med-x',nF,aState.medX,'aState.medX=val;renderASub()','Select X')+'</div>';
    html+='<div style="margin-bottom:9px"><label class="lbl">Dependent Variable (Y) <span style="color:#67e8f9">●</span></label>'+mkSelect('med-y',nF,aState.medY,'aState.medY=val;renderASub()','Select Y')+'</div>';
    html+='<div style="margin-bottom:9px"><label class="lbl">Mediator(s) (M) <span style="color:#f472b6">●</span> <span style="font-size:9.5px;color:rgba(232,222,255,.3)">(dapat lebih dari 1)</span></label>';
    html+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:5px">';
    nF.forEach(function(f){
      if(f===aState.medX||f===aState.medY) return;
      var sel=aState.medM.includes(f);
      html+='<label style="display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:999px;cursor:pointer;font-size:11.5px;'
        +(sel?'background:rgba(244,114,182,.12);color:#f472b6;border:1px solid rgba(244,114,182,.3);':'background:rgba(124,58,237,.06);color:rgba(232,222,255,.4);border:1px solid rgba(124,58,237,.12);')
        +'">'
        +'<input type="checkbox" '+(sel?'checked':'')
        +' onchange="toggleMedM(this.dataset.fld,this.checked)" data-fld="'+f
        +'" style="accent-color:#f472b6;width:12px;height:12px"/>'+f+'</label>';
    });
    html+='</div></div>';
    html+='<div style="margin-bottom:9px"><label class="lbl">Bootstrap Samples</label>';
    html+='<div style="display:flex;gap:5px;flex-wrap:wrap">';
    [1000,2000,5000].forEach(function(n){
      html+='<button onclick="aState.medBootN='+n+';renderASub()" style="padding:5px 12px;border-radius:6px;font-size:11.5px;font-weight:700;cursor:pointer;font-family:Inter,sans-serif;'+(aState.medBootN===n?'background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff;border:none;':'background:rgba(124,58,237,.07);color:rgba(232,222,255,.5);border:1px solid rgba(124,58,237,.2);')+'">'+n+'</button>';
    });
    html+='</div></div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:4px;margin-bottom:4px" onclick="runMediation()">▶ Run</button>';
    html+='</div>';

    // Right column: live preview
    html+='<div>';
    if(!canPreview){
      html+='<div style="padding:28px 16px;text-align:center;color:rgba(232,222,255,.3);font-size:12px">Pilih X, Y, dan minimal 1 Mediator untuk melihat preview Baron-Kenny Steps.</div>';
    } else if(medPreview&&medPreview._err){
      html+='<div class="miss-warn">'+medPreview.msg+'</div>';
    } else if(medPreview){
      html+='<div style="font-size:11px;font-weight:700;color:#c084fc;margin-bottom:8px;text-transform:uppercase;letter-spacing:.8px">Baron-Kenny Steps (preview)</div>';
      var bk=medPreview.barronKenny;
      html+='<div style="display:flex;flex-direction:column;gap:6px">';
      var steps=[
        {step:'Step 1',desc:'X → Y (total effect, path c)',val:'c = '+bk.c,p:bk.p_c,note:'X harus signifikan prediktor Y'},
        {step:'Step 2',desc:'X → M (path a)',val:'a = '+bk.a,p:bk.p_a,note:'X harus signifikan prediktor M'},
        {step:'Step 3',desc:'M → Y (path b, controlling X)',val:'b = '+bk.b,p:bk.p_b,note:'M harus signifikan prediktor Y'},
        {step:'Step 4',desc:'X → Y (direct effect, path c\')',val:"c' = "+bk.c_prime,p:bk.p_c_prime,note:parseFloat(bk.p_c_prime)>=0.05?"c' tidak sig → Full mediation":"c' masih sig → Partial mediation"},
      ];
      steps.forEach(function(s){
        var sig=parseFloat(s.p)<0.05;
        var pFmtted=SE.pFmt?SE.pFmt(parseFloat(s.p)):parseFloat(s.p).toFixed(3);
        html+='<div style="background:rgba(124,58,237,.06);border:1px solid rgba(124,58,237,.12);border-left:3px solid '+(sig?'#34d399':'#f87171')+';border-radius:7px;padding:8px 10px">';
        html+='<div style="display:flex;justify-content:space-between;align-items:center">';
        html+='<span style="font-size:10.5px;font-weight:700;color:'+(sig?'#34d399':'rgba(232,222,255,.5)')+'">'+s.step+'</span>';
        html+='<span style="font-size:10px;background:rgba('+(sig?'5,150,105':'220,38,38')+',.12);color:'+(sig?'#34d399':'#f87171')+';padding:2px 7px;border-radius:999px;font-weight:700">'+(sig?'✓ sig':'✗ n.s.')+' p='+parseFloat(s.p).toFixed(3)+'</span>';
        html+='</div>';
        html+='<div style="font-size:11.5px;color:rgba(232,222,255,.7);margin-top:3px">'+s.desc+' → <b style="color:#e8deff">'+s.val+'</b></div>';
        html+='<div style="font-size:10.5px;color:rgba(232,222,255,.35);margin-top:2px">'+s.note+'</div>';
        html+='</div>';
      });
      html+='</div>';

      // Sobel + indirect effect preview
      if(medPreview.mediators&&medPreview.mediators.length){
        html+='<div style="margin-top:10px;font-size:11px;font-weight:700;color:#c084fc;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px">Indirect Effect (Sobel)</div>';
        medPreview.mediators.forEach(function(med){
          var sobelSig=parseFloat(med.sobel_p)<0.05;
          html+='<div style="background:rgba(244,114,182,.06);border:1px solid rgba(244,114,182,.15);border-radius:7px;padding:8px 10px;margin-bottom:5px">';
          html+='<div style="font-size:11px;font-weight:700;color:#f472b6">via '+med.name+'</div>';
          html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:6px">';
          html+='<div class="sb"><div class="sb-label">Indirect (a×b)</div><div class="sb-value" style="font-size:13px">'+SE.f4(med.indirect)+'</div></div>';
          html+='<div class="sb"><div class="sb-label">Sobel z</div><div class="sb-value" style="font-size:13px;color:'+(sobelSig?'#34d399':'#f87171')+'">'+SE.f4(med.sobel_z)+'</div><div class="sb-note">p='+parseFloat(med.sobel_p).toFixed(3)+'</div></div>';
          html+='</div></div>';
        });
      }
    }
    html+='</div>';
    html+='</div>';

    // Interpretation guide
    html+='<div class="card" style="margin-top:9px"><div class="sec-hd">Panduan Interpretasi</div>';
    html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;font-size:11.5px;color:rgba(232,222,255,.6);line-height:1.65">';
    html+='<div style="background:rgba(124,58,237,.06);border-radius:7px;padding:9px 11px"><b style="color:#34d399">Full Mediation</b><br>c signifikan, a & b signifikan, tapi c\' tidak signifikan → X hanya berpengaruh ke Y lewat M.</div>';
    html+='<div style="background:rgba(124,58,237,.06);border-radius:7px;padding:9px 11px"><b style="color:#fbbf24">Partial Mediation</b><br>c, a, b, dan c\' semuanya signifikan → X berpengaruh langsung ke Y dan juga lewat M.</div>';
    html+='<div style="background:rgba(124,58,237,.06);border-radius:7px;padding:9px 11px"><b style="color:#f87171">No Mediation</b><br>a atau b tidak signifikan → M tidak memediasi X→Y.</div>';
    html+='<div style="background:rgba(124,58,237,.06);border-radius:7px;padding:9px 11px"><b style="color:#a5f3fc">Bootstrap CI</b><br>Jika 95% CI dari indirect effect tidak melewati 0, maka mediasi signifikan (lebih akurat dari Sobel).</div>';
    html+='</div></div>';
  }

  else if(currentASub==='sem'){
    // ── SEM State Defaults ──
    if(!aState.semLatents) aState.semLatents=[];
    if(aState.semLatentMap===undefined||aState.semLatentMap===null) aState.semLatentMap={};
    if(!aState.semPaths) aState.semPaths=[];   // array of {from,to} latent→latent or lat→observed
    if(!aState.semMode) aState.semMode='measurement'; // 'measurement' | 'structural'

    // Ensure every latent has an entry
    aState.semLatents.forEach(function(ln){
      if(!aState.semLatentMap[ln]) aState.semLatentMap[ln]=[];
    });

    // Live SEM computation
    var semResult=null;
    var semReady=aState.semLatents.length>=1&&aState.semLatents.every(function(ln){return (aState.semLatentMap[ln]||[]).length>=2;});
    if(semReady){
      semResult=tryStats(function(){return computeSEM(aState.semLatents,aState.semLatentMap,aState.semPaths);});
    }

    html+='<div class="analyze-info-bar"><div class="analyze-info-title">Structural Equation Modeling (SEM)</div><div class="analyze-info-desc">Mengkombinasikan CFA + Path Analysis. Untuk uji konstruk laten, hubungan kausal antar konstruk, dan mediasi kompleks.</div></div>';

    // Mode tabs
    html+='<div style="display:flex;gap:5px;margin-bottom:13px">';
    [{k:'measurement',l:'① Measurement Model (CFA)'},{k:'structural',l:'② Structural Model (Path)'},{k:'results',l:'③ Results & Fit'}].forEach(function(t){
      var act=aState.semMode===t.k;
      html+='<button onclick="aState.semMode=\''+t.k+'\';renderASub()" style="padding:7px 14px;border-radius:7px;font-size:11.5px;font-weight:700;cursor:pointer;font-family:Inter,sans-serif;flex:1;transition:all .15s;'+(act?'background:linear-gradient(135deg,rgba(232,121,249,.3),rgba(167,139,250,.2));color:#e879f9;border:1px solid rgba(232,121,249,.4);':'background:rgba(124,58,237,.06);color:rgba(232,222,255,.45);border:1px solid rgba(124,58,237,.15);')+'">'+t.l+'</button>';
    });
    html+='</div>';

    // ── MODE: MEASUREMENT ──────────────────────────────────────────────────
    if(aState.semMode==='measurement'){
      html+='<div class="grid2">';

      // Left: latent variable builder
      html+='<div class="card"><div class="sec-hd">Konstruk Laten (Latent Variables)</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:11px;line-height:1.6">Definisikan setiap konstruk laten dan pilih variabel observasinya (indikator/manifest). Setiap konstruk butuh ≥2 indikator.</div>';

      // Add latent button
      html+='<div style="display:flex;gap:6px;margin-bottom:12px">';
      html+='<input class="inp" id="sem-new-latent" placeholder="Nama konstruk (cth: Motivasi, Kinerja...)" style="flex:1;font-size:12px"/>';
      html+='<button class="btn btn-primary btn-sm" onclick="semAddLatent()" style="white-space:nowrap">+ Tambah</button>';
      html+='</div>';

      // List of latents
      if(!aState.semLatents.length){
        html+='<div class="chart-empty" style="padding:24px 0">Belum ada konstruk laten.<br>Tambah minimal 2 konstruk untuk SEM.</div>';
      }
      var semColors=['#e879f9','#818cf8','#34d399','#fbbf24','#67e8f9','#f472b6','#fb923c','#a78bfa'];
      aState.semLatents.forEach(function(ln,li){
        var col=semColors[li%semColors.length];
        var indics=aState.semLatentMap[ln]||[];
        html+='<div style="margin-bottom:10px;padding:10px;border-radius:9px;border:1.5px solid '+col.replace('#','rgba(').replace(/(.{6})/,'$1,.28)')+';background:'+col.replace('#','rgba(').replace(/(.{6})/,'$1,.04)')+'">';
        html+='<div style="display:flex;align-items:center;gap:7px;margin-bottom:8px">';
        html+='<div style="width:9px;height:9px;border-radius:50%;background:'+col+';flex-shrink:0"></div>';
        html+='<input class="inp" style="flex:1;font-weight:700;font-size:12px;color:'+col+';padding:4px 9px;border-color:'+col.replace('#','rgba(').replace(/(.{6})/,'$1,.35)')+';" value="'+ln+'" oninput="semRenameLatent('+li+',this.value)" />';
        html+='<button onclick="semRemoveLatent('+li+')" style="background:rgba(248,113,113,.12);border:1px solid rgba(248,113,113,.25);border-radius:6px;color:#f87171;cursor:pointer;padding:3px 8px;font-size:11px;font-family:Inter,sans-serif">✕</button>';
        html+='</div>';
        html+='<div style="font-size:10.5px;color:rgba(232,222,255,.35);margin-bottom:5px">Indikator/Manifest untuk <b style="color:'+col+'">'+ln+'</b> (min 2):</div>';
        html+='<div style="display:flex;flex-wrap:wrap;gap:3px">';
        nF.forEach(function(v){
          var sel=(aState.semLatentMap[ln]||[]).includes(v);
          var safeLn=ln.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
          var safeV=v.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
          html+='<label style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:999px;cursor:pointer;font-size:11px;'+(sel?'background:'+col.replace('#','rgba(').replace(/(.{6})/,'$1,.18)')+';color:'+col+';border:1px solid '+col.replace('#','rgba(').replace(/(.{6})/,'$1,.4)')+'':'background:rgba(124,58,237,.06);color:rgba(232,222,255,.4);border:1px solid rgba(124,58,237,.12)')+'"><input type="checkbox" '+(sel?'checked':'')+' data-ln="'+safeLn+'" data-v="'+safeV+'" onchange="semToggleIndicator(this.dataset.ln,this.dataset.v,this.checked)" style="accent-color:'+col+';width:11px;height:11px"/>'+v+'</label>';
        });
        html+='</div>';
        if(indics.length<2) html+='<div style="font-size:10px;color:#f87171;margin-top:5px">⚠ Butuh min 2 indikator</div>';
        else html+='<div style="font-size:10px;color:#34d399;margin-top:5px">✓ '+indics.length+' indikator dipilih</div>';
        html+='</div>';
      });
      html+='</div>';

      // Right: live measurement model fit
      html+='<div class="card"><div class="sec-hd">Measurement Model Fit</div>';
      if(!semReady){
        html+='<div class="chart-empty" style="padding:32px 0">Tambah ≥1 konstruk dengan ≥2 indikator untuk melihat fit model pengukuran.</div>';
        html+='<div class="analyze-info-bar" style="margin-top:14px">';
        html+='<div class="analyze-info-title">Workflow SEM (AMOS)</div>';
        html+='<div class="analyze-info-desc">1. Definisikan konstruk laten + indikator<br>2. Gambar structural paths<br>3. Run dan cek fit: CFI, RMSEA, SRMR<br>4. Modifikasi model jika fit buruk<br>5. Interpretasi path coefficients</div>';
        html+='</div>';
      } else if(semResult&&semResult._err){
        html+='<div class="miss-warn">'+semResult.msg+'</div>';
      } else if(semResult){
        var fitCol=semResult.overallFit==='Good Fit'?'#34d399':semResult.overallFit==='Acceptable Fit'?'#fbbf24':'#f87171';
        html+='<div style="padding:11px 14px;border-radius:9px;background:rgba(0,0,0,.15);border:1.5px solid '+fitCol+';text-align:center;margin-bottom:13px">';
        html+='<div style="font-size:15px;font-weight:900;color:'+fitCol+';font-family:Playfair Display,serif">'+semResult.overallFit+'</div>';
        html+='<div style="font-size:10px;color:rgba(232,222,255,.4);margin-top:2px">N='+semResult.n+' · '+semResult.totalIndicators+' indikators · '+semResult.nLatent+' latent factors</div>';
        html+='</div>';
        html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">';
        function semFitCard(name,val,interp,col){return '<div class="sb"><div class="sb-label">'+escHtml(name)+'</div><div class="sb-value" style="color:'+col+'">'+val+'</div><div style="font-size:9.5px;color:'+col+';margin-top:2px">'+interp+'</div></div>';}
        var cficol2=semResult.CFI_raw>=0.95?'#34d399':semResult.CFI_raw>=0.90?'#fbbf24':'#f87171';
        var tlicol2=semResult.TLI_raw>=0.95?'#34d399':semResult.TLI_raw>=0.90?'#fbbf24':'#f87171';
        var rmsecol2=semResult.RMSEA_raw<=0.05?'#34d399':semResult.RMSEA_raw<=0.08?'#fbbf24':'#f87171';
        var srmrcol2=semResult.SRMR_raw<=0.05?'#34d399':semResult.SRMR_raw<=0.08?'#fbbf24':'#f87171';
        html+=semFitCard('CFI',semResult.CFI,semResult.CFIinterp,cficol2);
        html+=semFitCard('TLI',semResult.TLI,semResult.TLIinterp,tlicol2);
        html+=semFitCard('RMSEA',semResult.RMSEA,semResult.RMSEAinterp,rmsecol2);
        html+=semFitCard('SRMR',semResult.SRMR,semResult.SRMRinterp,srmrcol2);
        html+='</div>';
        html+='<div style="font-size:10.5px;color:rgba(232,222,255,.45);margin-bottom:6px">χ²('+semResult.dfModel+')='+semResult.chiSq+', p='+semResult.pChiSq+' · RMSEA CI: ['+semResult.RMSEA_lo+', '+semResult.RMSEA_hi+']</div>';
        // AVE + CR
        html+='<div style="margin-top:11px"><div class="sec-hd" style="font-size:11.5px;margin-bottom:8px">Construct Validity</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th>Konstruk</th><th>AVE</th><th>CR</th><th>α</th><th>Validity</th></tr></thead><tbody>';
        semResult.constructs.forEach(function(c){
          var avecol=parseFloat(c.AVE)>=0.5?'#34d399':parseFloat(c.AVE)>=0.4?'#fbbf24':'#f87171';
          var crcol=parseFloat(c.CR)>=0.7?'#34d399':parseFloat(c.CR)>=0.6?'#fbbf24':'#f87171';
          var alphacol=parseFloat(c.alpha)>=0.7?'#34d399':parseFloat(c.alpha)>=0.6?'#fbbf24':'#f87171';
          var valid=parseFloat(c.AVE)>=0.5&&parseFloat(c.CR)>=0.7;
          html+='<tr><td class="td-label" style="color:'+semColors[semResult.constructs.indexOf(c)%semColors.length]+';font-weight:700">'+c.name+'</td>';
          html+='<td class="td-num" style="color:'+avecol+'">'+c.AVE+'</td>';
          html+='<td class="td-num" style="color:'+crcol+'">'+c.CR+'</td>';
          html+='<td class="td-num" style="color:'+alphacol+'">'+c.alpha+'</td>';
          html+='<td><span class="tag" style="font-size:9px;'+(valid?'background:rgba(52,211,153,.12);color:#34d399;border:1px solid rgba(52,211,153,.25)':'background:rgba(251,191,36,.1);color:#fbbf24;border:1px solid rgba(251,191,36,.25)')+'">'+(valid?'✓ Valid':'⚠ Check')+'</span></td></tr>';
        });
        html+='</tbody></table></div>';
        html+='<div style="font-size:10px;color:rgba(232,222,255,.3);margin-top:6px">AVE ≥ 0.50 = convergent validity · CR ≥ 0.70 = reliability · AVE > r² antar konstruk = discriminant validity</div>';
        html+='</div>';
      }
      html+='</div></div>';

      // Factor Loadings Table
      if(semResult&&!semResult._err){
        html+='<div class="card"><div class="sec-hd">Standardized Factor Loadings (λ)</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th>Konstruk</th><th>Indikator</th><th>λ (Loading)</th><th>h²</th><th>t-value*</th><th>Status</th></tr></thead><tbody>';
        semResult.loadings.forEach(function(row){
          var lamNum=parseFloat(row.lambda);
          var lamCol=lamNum>=0.7?'#34d399':lamNum>=0.5?'#a5f3fc':lamNum>=0.3?'#fbbf24':'#f87171';
          var constructIdx=aState.semLatents.indexOf(row.construct);
          var col=semColors[constructIdx>=0?constructIdx%semColors.length:0];
          html+='<tr>';
          if(row.firstInConstruct) html+='<td class="td-label" rowspan="'+row.constructCount+'" style="color:'+col+';font-weight:800;vertical-align:top;padding-top:10px">'+row.construct+'</td>';
          html+='<td class="td-label">'+row.indicator+'</td>';
          html+='<td class="td-num" style="color:'+lamCol+';font-weight:'+(lamNum>=0.5?700:400)+'">'+row.lambda+'</td>';
          html+='<td class="td-num" style="color:'+(parseFloat(row.h2)>=0.4?'#a5f3fc':'#f87171')+'">'+row.h2+'</td>';
          html+='<td class="td-num" style="color:rgba(232,222,255,.55)">'+row.tvalue+'</td>';
          html+='<td><span class="tag" style="font-size:9px;'+(lamNum>=0.5?'background:rgba(52,211,153,.12);color:#34d399;border:1px solid rgba(52,211,153,.25)':'background:rgba(248,113,113,.1);color:#f87171;border:1px solid rgba(248,113,113,.2)')+'">'+( lamNum>=0.5?'✓ Adequate':'✗ Weak' )+'</span></td>';
          html+='</tr>';
        });
        html+='</tbody></table></div>';
        html+='<div style="font-size:10px;color:rgba(232,222,255,.3);margin-top:6px">*Estimasi t-value (reference: t > 1.96 = signifikan p < .05)</div>';
        html+='</div>';
      }
    }

    // ── MODE: STRUCTURAL ──────────────────────────────────────────────────
    else if(aState.semMode==='structural'){
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">Structural Paths (Hubungan Antar Konstruk)</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:11px;line-height:1.6">Definisikan path kausal antar konstruk laten. Di AMOS: gambar anak panah dari konstruk eksogen ke endogen.</div>';

      if(aState.semLatents.length<2){
        html+='<div class="miss-warn">⚠ Butuh minimal 2 konstruk laten di Measurement Model.</div>';
      } else {
        html+='<div style="display:flex;gap:7px;margin-bottom:10px;align-items:center">';
        html+='<div style="flex:1"><label class="lbl">Dari (Eksogen)</label>';
        html+=mkSelect('sem-from',aState.semLatents,aState.semPathFrom||aState.semLatents[0],'aState.semPathFrom=val','Variabel asal');
        html+='</div>';
        html+='<div style="display:flex;align-items:flex-end;padding-bottom:4px"><span style="color:#e879f9;font-size:18px;font-weight:900">→</span></div>';
        html+='<div style="flex:1"><label class="lbl">Ke (Endogen)</label>';
        html+=mkSelect('sem-to',aState.semLatents,aState.semPathTo||aState.semLatents[aState.semLatents.length-1],'aState.semPathTo=val','Variabel tujuan');
        html+='</div>';
        html+='</div>';
        html+='<button class="btn btn-primary btn-sm" onclick="semAddPath()" style="margin-bottom:12px">+ Tambah Path</button>';

        // Path list
        if(!aState.semPaths.length){
          html+='<div class="chart-empty" style="padding:16px 0">Belum ada structural path.<br>Tambah path hubungan antar konstruk.</div>';
        } else {
          html+='<div style="display:flex;flex-direction:column;gap:6px">';
          aState.semPaths.forEach(function(p,pi){
            html+='<div style="display:flex;align-items:center;gap:7px;padding:8px 11px;background:rgba(232,121,249,.06);border:1px solid rgba(232,121,249,.2);border-radius:8px">';
            var fromCol=semColors[aState.semLatents.indexOf(p.from)%semColors.length]||'#e879f9';
            var toCol=semColors[aState.semLatents.indexOf(p.to)%semColors.length]||'#818cf8';
            html+='<span style="font-weight:700;color:'+fromCol+';font-size:12px">'+p.from+'</span>';
            html+='<span style="color:#e879f9;font-size:16px;font-weight:900">→</span>';
            html+='<span style="font-weight:700;color:'+toCol+';font-size:12px;flex:1">'+p.to+'</span>';
            if(semResult&&!semResult._err){
              var pathRes=semResult.paths&&semResult.paths.find(function(r){return r.from===p.from&&r.to===p.to;});
              if(pathRes){
                var bcol=parseFloat(pathRes.beta)>0?'#34d399':'#f472b6';
                var sigcol=parseFloat(pathRes.p)<0.05?'#34d399':'#f87171';
                html+='<span class="tag" style="background:rgba(52,211,153,.08);color:'+bcol+';border:1px solid rgba(52,211,153,.2);font-size:10px">β='+pathRes.beta+'</span>';
                html+='<span class="tag" style="background:rgba(52,211,153,.05);color:'+sigcol+';border:1px solid '+sigcol+'35;font-size:10px">p='+pathRes.p_fmt+'</span>';
              }
            }
            html+='<button onclick="semRemovePath('+pi+')" style="background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.2);border-radius:5px;color:#f87171;cursor:pointer;padding:2px 7px;font-size:11px;font-family:Inter,sans-serif">✕</button>';
            html+='</div>';
          });
          html+='</div>';
        }
      }
      html+='</div>';

      // Right: SEM path diagram SVG
      html+='<div class="card"><div class="sec-hd">Path Diagram</div>';
      if(aState.semLatents.length>=1){
        html+=svgSEMDiagram(aState.semLatents,aState.semLatentMap,aState.semPaths,semResult,semColors);
      } else {
        html+='<div class="chart-empty" style="padding:32px 0">Tambah konstruk di Measurement Model untuk melihat diagram.</div>';
      }
      html+='</div></div>';

      // Run button
      html+='<div class="card" style="text-align:center;padding:14px">';
      html+='<button class="btn btn-primary btn-sm" onclick="runSEM()" style="padding:11px 40px;font-size:13px">▶ Run</button>';
      html+='<div style="font-size:10.5px;color:rgba(232,222,255,.35);margin-top:7px">Akan menghitung: CFA measurement model + structural paths + fit indices + path coefficients</div>';
      html+='</div>';
    }

    // ── MODE: RESULTS ──────────────────────────────────────────────────
    else if(aState.semMode==='results'){
      if(!semReady){
        html+='<div class="card" style="text-align:center;padding:38px"><div style="font-size:32px;margin-bottom:9px">⬡</div><div style="color:#475569;font-size:13px">Lengkapi Measurement Model terlebih dahulu (≥2 konstruk, ≥2 indikator masing-masing).</div></div>';
      } else if(semResult&&semResult._err){
        html+='<div class="card"><div class="miss-warn">'+semResult.msg+'</div></div>';
      } else if(semResult){
        // Overall fit summary
        var fitCol2=semResult.overallFit==='Good Fit'?'#34d399':semResult.overallFit==='Acceptable Fit'?'#fbbf24':'#f87171';
        html+='<div class="card">';
        html+='<div class="sec-hd">Model Fit Summary</div>';
        html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:7px;margin-bottom:13px">';
        html+='<div class="sb"><div class="sb-label">Overall Fit</div><div class="sb-value" style="color:'+fitCol2+'">'+semResult.overallFit+'</div></div>';
        html+='<div class="sb"><div class="sb-label">CFI</div><div class="sb-value" style="color:'+(semResult.CFI_raw>=0.95?'#34d399':semResult.CFI_raw>=0.90?'#fbbf24':'#f87171')+'">'+semResult.CFI+'</div><div class="sb-note">≥ .95 = good</div></div>';
        html+='<div class="sb"><div class="sb-label">RMSEA</div><div class="sb-value" style="color:'+(semResult.RMSEA_raw<=0.05?'#34d399':semResult.RMSEA_raw<=0.08?'#fbbf24':'#f87171')+'">'+semResult.RMSEA+'</div><div class="sb-note">≤ .06 = good</div></div>';
        html+='<div class="sb"><div class="sb-label">SRMR</div><div class="sb-value" style="color:'+(semResult.SRMR_raw<=0.05?'#34d399':semResult.SRMR_raw<=0.08?'#fbbf24':'#f87171')+'">'+semResult.SRMR+'</div><div class="sb-note">≤ .08 = good</div></div>';
        html+='<div class="sb"><div class="sb-label">χ²/df</div><div class="sb-value" style="color:'+(semResult.chiRatio<=2?'#34d399':semResult.chiRatio<=3?'#fbbf24':'#f87171')+'">'+semResult.chiRatio+'</div><div class="sb-note">≤ 2.0 = good</div></div>';
        html+='<div class="sb"><div class="sb-label">TLI</div><div class="sb-value" style="color:'+(semResult.TLI_raw>=0.95?'#34d399':semResult.TLI_raw>=0.90?'#fbbf24':'#f87171')+'">'+semResult.TLI+'</div><div class="sb-note">≥ .95 = good</div></div>';
        html+='</div>';
        html+='<div style="font-size:10.5px;color:rgba(232,222,255,.45)">χ²('+semResult.dfModel+')='+semResult.chiSq+', p='+semResult.pChiSq+' &nbsp;·&nbsp; N='+semResult.n+' &nbsp;·&nbsp; RMSEA 90% CI: ['+semResult.RMSEA_lo+', '+semResult.RMSEA_hi+']</div>';
        html+='</div>';

        // Path coefficients table
        if(semResult.paths&&semResult.paths.length){
          html+='<div class="card"><div class="sec-hd">Structural Path Coefficients</div>';
          html+='<div class="tbl-wrap"><table><thead><tr><th>Dari</th><th>Ke</th><th>β (Std)</th><th>SE</th><th>t</th><th>p</th><th>Sig</th><th>Kesimpulan</th></tr></thead><tbody>';
          semResult.paths.forEach(function(p){
            var betaNum=parseFloat(p.beta);
            var bcol=Math.abs(betaNum)>=0.3?'#34d399':Math.abs(betaNum)>=0.1?'#fbbf24':'#f87171';
            var psig=parseFloat(p.p)<0.05;
            var fromIdx=aState.semLatents.indexOf(p.from);
            var toIdx=aState.semLatents.indexOf(p.to);
            var fromCol=semColors[fromIdx>=0?fromIdx%semColors.length:0];
            var toCol=semColors[toIdx>=0?toIdx%semColors.length:1];
            html+='<tr>';
            html+='<td class="td-label" style="color:'+fromCol+';font-weight:700">'+p.from+'</td>';
            html+='<td class="td-label" style="color:'+toCol+';font-weight:700">'+p.to+'</td>';
            html+='<td class="td-num" style="color:'+bcol+';font-weight:700">'+p.beta+'</td>';
            html+='<td class="td-num" style="color:rgba(232,222,255,.5)">'+p.se+'</td>';
            html+='<td class="td-num">'+p.t+'</td>';
            html+='<td class="td-num" style="color:'+(psig?'#34d399':'#f87171')+'">'+(psig?'<b>':'')+p.p_fmt+(psig?'</b>':'')+'</td>';
            html+='<td>'+sigBadge(p.p)+'</td>';
            html+='<td style="font-size:11px;color:rgba(232,222,255,.55)">'+p.interpretation+'</td>';
            html+='</tr>';
          });
          html+='</tbody></table></div></div>';
        }

        // Indirect effects (if paths exist)
        if(semResult.indirectEffects&&semResult.indirectEffects.length){
          html+='<div class="card"><div class="sec-hd">Indirect Effects (Mediasi via Konstruk Laten)</div>';
          html+='<div class="tbl-wrap"><table><thead><tr><th>X</th><th>M</th><th>Y</th><th>Indirect β</th><th>Bootstrap CI 95%</th><th>Sig</th></tr></thead><tbody>';
          semResult.indirectEffects.forEach(function(ie){
            var ciSig=parseFloat(ie.ci_lo)>0||parseFloat(ie.ci_hi)<0;
            html+='<tr>';
            html+='<td class="td-label" style="color:'+semColors[0]+';font-weight:700">'+ie.x+'</td>';
            html+='<td class="td-label" style="color:'+semColors[2]+'">'+ie.m+'</td>';
            html+='<td class="td-label" style="color:'+semColors[1]+';font-weight:700">'+ie.y+'</td>';
            html+='<td class="td-num" style="color:'+(Math.abs(parseFloat(ie.indirect))>=0.1?'#34d399':'#fbbf24')+'">'+ie.indirect+'</td>';
            html+='<td class="td-num" style="font-size:11px;color:'+(ciSig?'#34d399':'#f87171')+'">['+ie.ci_lo+', '+ie.ci_hi+']</td>';
            html+='<td><span class="tag" style="font-size:9px;'+(ciSig?'background:rgba(52,211,153,.12);color:#34d399;border:1px solid rgba(52,211,153,.25)':'background:rgba(248,113,113,.1);color:#f87171;border:1px solid rgba(248,113,113,.2)')+'">'+(ciSig?'✓ Sig':'n.s.')+'</span></td>';
            html+='</tr>';
          });
          html+='</tbody></table></div>';
          html+='<div style="font-size:10px;color:rgba(232,222,255,.3);margin-top:6px">Bootstrap CI (n=1000). Jika CI tidak mencakup 0 → indirect effect signifikan.</div>';
          html+='</div>';
        }

        // AMOS Syntax equivalent
        html+='<div class="card"><div class="sec-hd">AMOS / lavaan Syntax Equivalent</div>';
        html+='<div style="margin-bottom:8px;font-size:11px;color:rgba(232,222,255,.4)">R lavaan syntax untuk model ini:</div>';
        html+='<textarea class="syn-area" readonly style="min-height:160px;color:#a5f3fc;font-size:11px">'+generateLavaanSyntax(aState.semLatents,aState.semLatentMap,aState.semPaths)+'</textarea>';
        html+='<div style="font-size:10px;color:rgba(232,222,255,.3);margin-top:6px">Di AMOS: gunakan path diagram GUI. Di R: <code style="color:#c084fc">library(lavaan); fit &lt;- sem(model, data=df)</code></div>';
        html+='</div>';

        // Model interpretation guide
        html+='<div class="card"><div class="sec-hd">Panduan Interpretasi SEM</div>';
        html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px;font-size:11.5px;color:rgba(232,222,255,.6);line-height:1.6">';
        [['#34d399','Good Fit','CFI ≥ .95, RMSEA ≤ .06, SRMR ≤ .08, χ²/df ≤ 2'],
         ['#fbbf24','Acceptable Fit','CFI ≥ .90, RMSEA ≤ .08, SRMR ≤ .10'],
         ['#f87171','Poor Fit','Perlu modifikasi model: cek MI, re-specify'],
         ['#818cf8','β (Path Coef)','Standarized: ≥ .30 = medium effect, ≥ .50 = large'],
         ['#e879f9','AVE ≥ .50','Convergent validity terpenuhi untuk setiap konstruk'],
         ['#a5f3fc','CR ≥ .70','Construct reliability (internal consistency)']
        ].forEach(function(r){
          html+='<div style="background:rgba(124,58,237,.06);border-radius:7px;padding:9px 11px"><b style="color:'+r[0]+'">'+r[1]+'</b><br>'+r[2]+'</div>';
        });
        html+='</div></div>';

        // Run SEM to output button
        html+='<div style="text-align:center;margin-top:6px"><button class="btn btn-primary btn-sm" onclick="runSEM()" style="padding:11px 36px">▶ Run</button></div>';
      }
    }
  }

  // ══════════════════════════════════════════════════════════════
  // DISCRIMINANT ANALYSIS (LDA)
  // ══════════════════════════════════════════════════════════════
  else if(currentASub==='discriminant'){
    if(!aState.ldaGroup) aState.ldaGroup='';
    if(!aState.ldaPreds) aState.ldaPreds=[];
    var ldaResult=aState.ldaResult||null;
    html+='<div class="card"><div class="sec-hd">Linear Discriminant Analysis</div>';
    html+='<div style="margin-bottom:10px"><label class="lbl">Grouping Variable (Kategorikal)</label>';
    html+=mkSelect('lda-grp',aF,aState.ldaGroup,'aState.ldaGroup=val;aState.ldaResult=null;renderASub()','Select grouping variable');
    html+='</div>';
    html+='<div style="margin-bottom:10px"><label class="lbl">Predictors (Numerik) <span style="color:rgba(232,222,255,.4);font-size:10px">— pilih ≥1</span></label>';
    html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:6px">';
    nF.forEach(function(f){
      if(f===aState.ldaGroup) return;
      var sel=aState.ldaPreds.indexOf(f)>=0;
      html+='<button onclick="(function(){var i=aState.ldaPreds.indexOf(\''+f+'\');if(i>=0)aState.ldaPreds.splice(i,1);else aState.ldaPreds.push(\''+f+'\');aState.ldaResult=null;renderASub();})()" style="padding:4px 10px;border-radius:6px;border:1.5px solid '+(sel?'#38bdf8':'rgba(124,58,237,.3)')+';background:'+(sel?'rgba(56,189,248,.15)':'rgba(124,58,237,.06)')+';color:'+(sel?'#38bdf8':'rgba(232,222,255,.5)')+';font-size:11px;cursor:pointer;font-family:Inter,sans-serif;font-weight:'+(sel?'700':'400')+'">'+(sel?'✓ ':'')+f+'</button>';
    });
    html+='</div></div>';
    html+='<button class="btn btn-primary btn-sm" onclick="runDiscriminant()" style="margin-top:4px">▶ Run</button>';
    html+='</div>';

    if(ldaResult&&ldaResult._err){
      html+='<div class="card"><div class="miss-warn">'+ldaResult.msg+'</div></div>';
    } else if(ldaResult){
      var lr=ldaResult;
      // Model fit summary
      html+='<div class="card"><div class="sec-hd">Model Summary</div>';
      html+='<div class="stats-grid" style="grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:6px;margin-bottom:10px">';
      html+='<div class="sb"><div class="sb-label">N</div><div class="sb-value">'+lr.n+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Groups</div><div class="sb-value">'+lr.groups.length+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Predictors</div><div class="sb-value">'+lr.preds.length+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Wilks\' λ</div><div class="sb-value">'+lr.wilksLambda+'</div><div class="sb-note">p = '+lr.wilksP+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Accuracy</div><div class="sb-value" style="color:'+(parseFloat(lr.accuracy)>=70?'#34d399':parseFloat(lr.accuracy)>=50?'#fbbf24':'#f87171')+'">'+lr.accuracy+'%</div></div>';
      html+='<div class="sb"><div class="sb-label">Functions</div><div class="sb-value">'+lr.nFunctions+'</div></div>';
      html+='</div></div>';

      // Eigenvalues table
      html+='<div class="card"><div class="sec-hd">Eigenvalues & Canonical Correlations</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Function</th><th>Eigenvalue</th><th>% Variance</th><th>Cumulative %</th><th>Canonical r</th></tr></thead><tbody>';
      lr.eigenvalues.forEach(function(e,i){
        html+='<tr><td>'+( i+1)+'</td><td class="td-num">'+e.eigenvalue+'</td><td class="td-num">'+e.pctVar+'%</td><td class="td-num">'+e.cumPct+'%</td><td class="td-num" style="color:#38bdf8;font-weight:700">'+e.canonicalR+'</td></tr>';
      });
      html+='</tbody></table></div></div>';

      // Standardized coefficients
      html+='<div class="card"><div class="sec-hd">Standardized Discriminant Function Coefficients</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Predictor</th>';
      lr.eigenvalues.forEach(function(e,i){ html+='<th>Function '+(i+1)+'</th>'; });
      html+='</tr></thead><tbody>';
      lr.preds.forEach(function(p,pi){
        html+='<tr><td class="td-label">'+p+'</td>';
        lr.stdCoefs.forEach(function(fc){ html+='<td class="td-num" style="color:'+(Math.abs(fc[pi])>=0.3?'#38bdf8':'rgba(232,222,255,.6)')+'">'+fc[pi]+'</td>'; });
        html+='</tr>';
      });
      html+='</tbody></table></div></div>';

      // Group means
      html+='<div class="card"><div class="sec-hd">Group Means (Discriminant Scores)</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Group</th><th>N</th>';
      lr.preds.forEach(function(p){ html+='<th>'+escHtml(p)+'</th>'; });
      html+='</tr></thead><tbody>';
      lr.groupStats.forEach(function(g){
        html+='<tr><td class="td-label" style="color:#38bdf8;font-weight:700">'+g.label+'</td><td class="td-num">'+g.n+'</td>';
        g.means.forEach(function(m){ html+='<td class="td-num">'+m+'</td>'; });
        html+='</tr>';
      });
      html+='</tbody></table></div></div>';

      // Classification table
      html+='<div class="card"><div class="sec-hd">Classification Results</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Actual \\ Predicted</th>';
      lr.groups.forEach(function(g){ html+='<th>'+escHtml(g)+'</th>'; });
      html+='<th>Total</th><th>% Correct</th></tr></thead><tbody>';
      lr.classTable.forEach(function(row,i){
        var tot=row.counts.reduce(function(s,v){return s+v;},0);
        html+='<tr><td class="td-label" style="color:#38bdf8;font-weight:700">'+lr.groups[i]+'</td>';
        row.counts.forEach(function(c,j){
          var isDiag=i===j;
          html+='<td class="td-num" style="'+(isDiag?'color:#34d399;font-weight:700;background:rgba(52,211,153,.08)':'')+'">'+c+'</td>';
        });
        html+='<td class="td-num">'+tot+'</td><td class="td-num" style="color:#34d399">'+row.pctCorrect+'%</td></tr>';
      });
      html+='</tbody></table></div>';
      html+='<div style="margin-top:8px;font-size:11px;color:rgba(232,222,255,.5)">Overall accuracy: <b style="color:#34d399">'+lr.accuracy+'%</b></div></div>';

      // Structure matrix
      html+='<div class="card"><div class="sec-hd">Structure Matrix (Pooled Within-Groups Correlations)</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Predictor</th>';
      lr.eigenvalues.forEach(function(e,i){ html+='<th>Function '+(i+1)+'</th>'; });
      html+='</tr></thead><tbody>';
      lr.preds.forEach(function(p,pi){
        html+='<tr><td class="td-label">'+p+'</td>';
        lr.structureMatrix.forEach(function(fc){ html+='<td class="td-num" style="color:'+(Math.abs(fc[pi])>=0.3?'#fb923c':'rgba(232,222,255,.6)')+'">'+fc[pi]+'</td>'; });
        html+='</tr>';
      });
      html+='</tbody></table><div style="margin-top:6px;font-size:10px;color:rgba(232,222,255,.3)">|r| ≥ .30 = practically significant loading</div></div></div>';

      // Scatter plot of first 2 discriminant functions
      if(lr.scores&&lr.nFunctions>=1){
        html+='<div class="card"><div class="sec-hd">Discriminant Score Plot</div>';
        html+=svgDiscriminantPlot(lr);
        html+='</div>';
      }
    }
  }

  // ══════════════════════════════════════════════════════════════
  // CLUSTER ANALYSIS (K-Means & Hierarchical)
  // ══════════════════════════════════════════════════════════════
  else if(currentASub==='cluster'){
    if(!aState.clMethod) aState.clMethod='kmeans';
    if(!aState.clK) aState.clK=3;
    if(!aState.clVars) aState.clVars=[];
    if(!aState.clLinkage) aState.clLinkage='ward';
    var clResult=aState.clResult||null;

    html+='<div class="card"><div class="sec-hd">Cluster Analysis</div>';
    // Method toggle
    html+='<div style="margin-bottom:10px">'+mkCsel('cl-method',['kmeans','hierarchical'],aState.clMethod,'aState.clMethod=val;aState.clResult=null;renderASub()','Method')+'</div>';

    // Variables
    html+='<div style="margin-bottom:10px"><label class="lbl">Variables (Numerik) <span style="color:rgba(232,222,255,.4);font-size:10px">— pilih ≥2</span></label>';
    html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:6px">';
    nF.forEach(function(f){
      var sel=aState.clVars.indexOf(f)>=0;
      html+='<button onclick="(function(){var i=aState.clVars.indexOf(\''+f+'\');if(i>=0)aState.clVars.splice(i,1);else aState.clVars.push(\''+f+'\');aState.clResult=null;renderASub();})()" style="padding:4px 10px;border-radius:6px;border:1.5px solid '+(sel?'#4ade80':'rgba(124,58,237,.3)')+';background:'+(sel?'rgba(74,222,128,.15)':'rgba(124,58,237,.06)')+';color:'+(sel?'#4ade80':'rgba(232,222,255,.5)')+';font-size:11px;cursor:pointer;font-family:Inter,sans-serif;font-weight:'+(sel?'700':'400')+'">'+(sel?'✓ ':'')+f+'</button>';
    });
    html+='</div></div>';

    if(aState.clMethod==='kmeans'){
      html+='<div style="margin-bottom:10px">'+mkCsel('cl-k',['2','3','4','5','6','7','8'],String(aState.clK),'aState.clK=parseInt(val);aState.clResult=null;renderASub()','Number of Clusters (k)')+'</div>';
    } else {
      html+='<div style="margin-bottom:10px">'+mkCsel('cl-linkage',['ward','complete','average','single'],aState.clLinkage,'aState.clLinkage=val;aState.clResult=null;renderASub()','Linkage Method')+'</div>';
      html+='<div style="margin-bottom:10px">'+mkCsel('cl-hk',['2','3','4','5','6'],String(aState.clK),'aState.clK=parseInt(val);aState.clResult=null;renderASub()','Cut Clusters (k)')+'</div>';
    }

    html+='<button class="btn btn-primary btn-sm" onclick="runCluster()" style="margin-top:4px">▶ Run</button>';
    html+='</div>';

    if(clResult&&clResult._err){
      html+='<div class="card"><div class="miss-warn">'+clResult.msg+'</div></div>';
    } else if(clResult){
      var cr=clResult;
      // Summary
      html+='<div class="card"><div class="sec-hd">Cluster Summary</div>';
      html+='<div class="stats-grid" style="grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:6px;margin-bottom:10px">';
      html+='<div class="sb"><div class="sb-label">N Cases</div><div class="sb-value">'+cr.n+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Variables</div><div class="sb-value">'+cr.vars.length+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Clusters (k)</div><div class="sb-value" style="color:#4ade80">'+cr.k+'</div></div>';
      if(cr.method==='kmeans'){
        html+='<div class="sb"><div class="sb-label">Within-SS</div><div class="sb-value">'+cr.totalWSS+'</div></div>';
        html+='<div class="sb"><div class="sb-label">Between-SS</div><div class="sb-value">'+cr.totalBSS+'</div></div>';
        html+='<div class="sb"><div class="sb-label">Silhouette</div><div class="sb-value" style="color:'+(cr.silhouette>=0.5?'#34d399':cr.silhouette>=0.25?'#fbbf24':'#f87171')+'">'+cr.silhouette+'</div></div>';
      } else {
        html+='<div class="sb"><div class="sb-label">Linkage</div><div class="sb-value" style="font-size:12px">'+cr.linkage+'</div></div>';
        html+='<div class="sb"><div class="sb-label">Silhouette</div><div class="sb-value" style="color:'+(cr.silhouette>=0.5?'#34d399':cr.silhouette>=0.25?'#fbbf24':'#f87171')+'">'+cr.silhouette+'</div></div>';
      }
      html+='</div>';
      // Silhouette interpretation
      var silVal=parseFloat(cr.silhouette);
      var silLabel=silVal>=0.7?'Strong structure':silVal>=0.5?'Reasonable structure':silVal>=0.25?'Weak structure':'No substantial structure';
      var silColor=silVal>=0.5?'#34d399':silVal>=0.25?'#fbbf24':'#f87171';
      html+='<div style="padding:8px 11px;background:rgba(74,222,128,.06);border:1px solid rgba(74,222,128,.18);border-radius:8px;font-size:11.5px;color:rgba(232,222,255,.7)">Silhouette = <b style="color:'+silColor+'">'+cr.silhouette+'</b> → <b style="color:'+silColor+'">'+escHtml(silLabel)+'</b><br><span style="font-size:10px;color:rgba(232,222,255,.4)">≥0.70 = strong · ≥0.50 = reasonable · ≥0.25 = weak · <0.25 = poor</span></div>';
      html+='</div>';

      // Cluster sizes
      html+='<div class="card"><div class="sec-hd">Cluster Sizes & Centroids</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Cluster</th><th>N</th><th>%</th>';
      cr.vars.forEach(function(v){ html+='<th>'+escHtml(v)+' (mean)</th>'; });
      html+='</tr></thead><tbody>';
      var clColors=['#4ade80','#38bdf8','#f472b6','#fb923c','#a78bfa','#34d399','#fbbf24','#e879f9'];
      cr.clusters.forEach(function(c,i){
        html+='<tr><td><span style="display:inline-flex;align-items:center;gap:5px"><span style="width:10px;height:10px;border-radius:50%;background:'+clColors[i%clColors.length]+';display:inline-block"></span><b style="color:'+clColors[i%clColors.length]+'">C'+(i+1)+'</b></span></td>';
        html+='<td class="td-num">'+c.n+'</td><td class="td-num">'+c.pct+'%</td>';
        c.centroid.forEach(function(m){ html+='<td class="td-num">'+m+'</td>'; });
        html+='</tr>';
      });
      html+='</tbody></table></div></div>';

      // Scatter plot (first 2 vars)
      if(cr.vars.length>=2){
        html+='<div class="card"><div class="sec-hd">Cluster Plot (PC1 vs PC2)</div>';
        html+=svgClusterPlot(cr);
        html+='</div>';
      }

      // Hierarchical: Dendrogram
      if(cr.method==='hierarchical'&&cr.dendro){
        html+='<div class="card"><div class="sec-hd">Dendrogram</div>';
        html+=svgDendrogram(cr.dendro,cr.k,cr.vars);
        html+='</div>';
      }

      // Elbow chart for K-Means
      if(cr.method==='kmeans'&&cr.elbowData){
        html+='<div class="card"><div class="sec-hd">Elbow Chart (WSS by k)</div>';
        html+=svgElbow(cr.elbowData);
        html+='<div style="font-size:10px;color:rgba(232,222,255,.35);margin-top:6px">Look for the "elbow" — the k where adding more clusters gives diminishing returns.</div>';
        html+='</div>';
      }

      // ANOVA per variable
      html+='<div class="card"><div class="sec-hd">ANOVA per Variable (Cluster Discrimination)</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Variable</th><th>F</th><th>df1</th><th>df2</th><th>p</th><th>Sig</th></tr></thead><tbody>';
      cr.anova.forEach(function(a){
        var sig=parseFloat(a.p)<0.05;
        html+='<tr><td class="td-label">'+a.variable+'</td><td class="td-num">'+a.F+'</td><td class="td-num">'+a.df1+'</td><td class="td-num">'+a.df2+'</td>';
        html+='<td class="td-num" style="color:'+(sig?'#34d399':'#f87171')+'">'+(sig?'<b>':'')+a.p_fmt+(sig?'</b>':'')+'</td>';
        html+='<td>'+sigBadge(a.p)+'</td></tr>';
      });
      html+='</tbody></table><div style="margin-top:6px;font-size:10px;color:rgba(232,222,255,.35)">Variables with significant F contribute most to cluster separation.</div></div></div>';
    }
  }

  // ══════════════════════════════════════════════════════════════
  // MISSING DATA ANALYSIS — Little's MCAR + Pattern Matrix — badan
  // cabang ini DIPINDAH & DIBUNGKUS jadi function renderMissingDataAnalysis()
  // di js/data/missing-data.js (C11, split roadmap OSS 2.0). Cabang
  // if/else-if di sini TETAP ADA (perlu tetap ada supaya renderASub()
  // jalan benar), tapi badannya sekarang cuma 1 baris pemanggilan.
  // ══════════════════════════════════════════════════════════════
  else if(currentASub==='missinganalysis'){
    html+=renderMissingDataAnalysis();
  }


  // ── ROC CURVE ──────────────────────────────────────────────────────────
  else if(currentASub==='roc'||currentASub==='roc_compare'){
    if(!aState.rocProb&&nF.length) aState.rocProb=nF[0];
    if(!aState.rocTrue&&aF.length) aState.rocTrue=aF[aF.length>1?aF.length-1:0];
    if(!aState.rocCompare) aState.rocCompare=[];
    var rocPrv=aState.rocProb&&aState.rocTrue?tryStats(function(){return computeROC(data,aState.rocProb,aState.rocTrue,aState.rocPosClass);}):null;

    if(currentASub==='roc'){
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd"> ROC Curve Analysis</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:11px;line-height:1.65">Receiver Operating Characteristic curve — visualisasikan trade-off sensitivity vs specificity. AUC mengukur kemampuan diskriminasi model secara keseluruhan.</div>';
      html+=mkSelect('roc-prob',nF,aState.rocProb,'aState.rocProb=val;renderASub()','Predicted Probability / Score');
      html+='<div style="margin-top:8px">'+mkSelect('roc-true',aF,aState.rocTrue,'aState.rocTrue=val;renderASub()','True Binary Outcome')+'</div>';
      // Positive class selector
      if(aState.rocTrue){
        var uniq=[...new Set(data.map(function(r){return String(r[aState.rocTrue]||'');}).filter(Boolean))].slice(0,10);
        if(uniq.length>=2){
          html+='<div style="margin-top:8px"><label class="lbl">Positive Class (event=1)</label>';
          html+='<div class="row" style="gap:5px;margin-top:5px;flex-wrap:wrap">';
          uniq.forEach(function(u){html+='<button class="btn '+(aState.rocPosClass===u?'btn-primary':'btn-ghost')+' btn-sm" onclick="aState.rocPosClass=\''+u+'\';renderASub()">'+u+'</button>';});
          html+='</div></div>';
        }
      }
      html+='<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="runROC()">▶ Run</button>';
      if(rocPrv&&!rocPrv._err){
        html+='<div class="stats-grid2" style="margin-top:12px">';
        html+=stCard('AUC',rocPrv.auc,rocPrv.aucInterp);
        html+=stCard('95% CI',rocPrv.aucCI,'');
        html+=stCard('Optimal Cutoff',rocPrv.optThresh,'Youden index');
        html+=stCard('Sensitivity',rocPrv.optSens,'at optimal');
        html+=stCard('Specificity',rocPrv.optSpec,'at optimal');
        html+=stCard('N',rocPrv.n,'pos='+rocPrv.nPos+' neg='+rocPrv.nNeg);
        html+='</div>';
        html+='<div class="row" style="margin-top:8px">';
        var aucCol=parseFloat(rocPrv.auc)>=0.9?'#34d399':parseFloat(rocPrv.auc)>=0.8?'#a5f3fc':parseFloat(rocPrv.auc)>=0.7?'#fbbf24':'#f87171';
        html+='<span class="tag" style="background:rgba(52,211,153,.1);color:'+aucCol+';border:1px solid '+aucCol+'40">AUC='+rocPrv.auc+' ('+rocPrv.aucInterp+')</span>';
        html+='</div>';
      }
      if(rocPrv&&rocPrv._err) html+='<div style="color:#f87171;font-size:11px;margin-top:8px">'+rocPrv.msg+'</div>';
      html+='</div>';
      html+='<div class="card"><div class="sec-hd">ROC Plot</div>';
      if(rocPrv&&!rocPrv._err){
        html+=svgROC(rocPrv);
        html+='<div style="margin-top:10px"><div class="sec-hd" style="margin-bottom:6px">Optimal Operating Point (Youden)</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th>Threshold</th><th>Sensitivity</th><th>Specificity</th><th>PPV</th><th>NPV</th><th>F1</th><th>Youden J</th></tr></thead><tbody>';
        html+='<tr><td class="td-num" style="color:#f472b6">'+rocPrv.optThresh+'</td><td class="td-num">'+rocPrv.optSens+'</td><td class="td-num">'+rocPrv.optSpec+'</td><td class="td-num">'+rocPrv.optPPV+'</td><td class="td-num">'+rocPrv.optNPV+'</td><td class="td-num">'+rocPrv.optF1+'</td><td class="td-num" style="color:#34d399">'+rocPrv.optYouden+'</td></tr>';
        html+='</tbody></table></div>';
        // Full threshold table (top 10 rows)
        html+='<div style="margin-top:10px"><div class="sec-hd" style="margin-bottom:5px">Full Threshold Table (top points)</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th>Threshold</th><th>TPR (Sens)</th><th>FPR (1-Spec)</th><th>Precision</th><th>F1</th></tr></thead><tbody>';
        var step=Math.max(1,Math.floor(rocPrv.curve.length/12));
        rocPrv.curve.filter(function(_,i){return i%step===0;}).slice(0,14).forEach(function(pt){
          html+='<tr><td class="td-num">'+SE.f4(pt.t)+'</td><td class="td-num">'+SE.f4(pt.tpr)+'</td><td class="td-num">'+SE.f4(pt.fpr)+'</td><td class="td-num">'+SE.f4(pt.ppv||0)+'</td><td class="td-num">'+SE.f4(pt.f1||0)+'</td></tr>';
        });
        html+='</tbody></table></div></div>';
      } else { html+='<div class="chart-empty">Select probability score and outcome to see ROC curve</div>'; }
      html+='</div></div>';
    }

    else if(currentASub==='roc_compare'){
      html+='<div class="card"><div class="sec-hd"> Compare Multiple ROC Curves</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:10px;line-height:1.65">Bandingkan AUC dari beberapa model/prediktor secara visual. Gunakan DeLong test untuk uji perbedaan AUC yang signifikan.</div>';
      html+='<div style="margin-bottom:10px">'+mkSelect('roc-true-cmp',aF,aState.rocTrue,'aState.rocTrue=val;renderASub()','True Binary Outcome')+'</div>';
      html+='<label class="lbl">Predicted Scores to Compare</label>';
      html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin:6px 0 10px">';
      nF.forEach(function(v){
        var sel=(aState.rocCompare||[]).includes(v);
        html+='<label style="display:flex;align-items:center;gap:4px;font-size:11px;cursor:pointer;padding:4px 8px;border-radius:6px;background:'+(sel?'rgba(103,232,249,.12)':'rgba(255,255,255,.03)')+';border:1px solid '+(sel?'rgba(103,232,249,.3)':'rgba(255,255,255,.07)')+';">';
        html+='<input type="checkbox" '+(sel?'checked':'')+' onchange="toggleROCCompare(\''+v+'\',this.checked)" style="accent-color:#67e8f9"/>'+v+'</label>';
      });
      html+='</div>';
      if(aState.rocTrue&&aState.rocCompare&&aState.rocCompare.length>=2){
        var cmpCurves=aState.rocCompare.map(function(v){
          try{return {name:v,roc:computeROC(data,v,aState.rocTrue,aState.rocPosClass)};}
          catch(e){return {name:v,roc:{_err:true}};}
        }).filter(function(c){return !c.roc._err;});
        if(cmpCurves.length>=2){
          html+=svgROCCompare(cmpCurves);
          html+='<div class="tbl-wrap" style="margin-top:10px"><table><thead><tr><th>Model / Score</th><th>AUC</th><th>95% CI</th><th>Optimal Cutoff</th><th>Sensitivity</th><th>Specificity</th></tr></thead><tbody>';
          cmpCurves.forEach(function(c,ci){
            var r=c.roc;
            var col=['#f472b6','#67e8f9','#fbbf24','#34d399','#c084fc'][ci%5];
            html+='<tr><td class="td-label" style="color:'+col+'">'+c.name+'</td><td class="td-num" style="color:'+col+';font-weight:700">'+r.auc+'</td><td class="td-num" style="font-size:10px">'+r.aucCI+'</td><td class="td-num">'+r.optThresh+'</td><td class="td-num">'+r.optSens+'</td><td class="td-num">'+r.optSpec+'</td></tr>';
          });
          html+='</tbody></table></div>';
          // DeLong test between first two
          if(cmpCurves.length>=2){
            try{
              var dlong=deLongTest(cmpCurves[0].roc,cmpCurves[1].roc);
              html+='<div style="margin-top:10px;padding:9px 12px;background:rgba(124,58,237,.08);border-radius:8px;border:1px solid rgba(124,58,237,.18);font-size:11.5px;color:rgba(232,222,255,.7)"><b style="color:#c084fc">DeLong Test ('+cmpCurves[0].name+' vs '+cmpCurves[1].name+'):</b> z='+dlong.z+', p='+dlong.p_fmt+' — '+(parseFloat(dlong.p)<0.05?'<span style="color:#34d399">Significant difference in AUC</span>':'<span style="color:#fbbf24">No significant difference</span>')+'</div>';
            }catch(e){}
          }
        }
      } else {
        html+='<div class="chart-empty">Select outcome and ≥2 score variables to compare</div>';
      }
      html+='</div>';
    }
  }

  // ── SURVIVAL ANALYSIS ──────────────────────────────────────────────────
  else if(currentASub==='survival'||currentASub==='km'||currentASub==='logrank'||currentASub==='cox'){
    if(!aState.survTime&&nF.length) aState.survTime=nF[0];
    if(!aState.survEvent&&nF.length>1) aState.survEvent=nF[1];
    if(!aState.survGroup) aState.survGroup='';
    if(!aState.survCovs) aState.survCovs=[];
    if(!aState.survMethod) aState.survMethod='km';
    // Legacy subtab redirect
    if(currentASub==='km') aState.survMethod='km';
    else if(currentASub==='logrank') aState.survMethod='logrank';
    else if(currentASub==='cox') aState.survMethod='cox';

    var survValid=aState.survTime&&aState.survEvent;
    var survPrv=survValid?tryStats(function(){return computeKaplanMeier(data,aState.survTime,aState.survEvent,aState.survGroup||null);}):null;
    var coxPrv=(aState.survMethod==='cox'&&aState.survCovs&&aState.survCovs.length>0&&survValid)
      ?tryStats(function(){return computeCoxRegression(data,aState.survTime,aState.survEvent,aState.survCovs);}):null;

    html+='<div class="grid2">';

    // ── Left: shared setup + method select ──────────────────────
    html+='<div style="display:flex;flex-direction:column;gap:10px">';
    html+='<div class="card"><div class="sec-hd"> Variable Setup</div>';
    html+='<div style="margin-bottom:8px"><label class="lbl">Analysis Method</label>';
    html+=mkOptCsel('surv-method',
      [{val:'km',label:'Kaplan-Meier Estimator'},{val:'logrank',label:'Log-Rank Test'},{val:'cox',label:'Cox Proportional Hazards'}],
      aState.survMethod,
      'aState.survMethod=_cR["surv-method"]._vals[_cR["surv-method"].fields.indexOf(val)];renderASub()',
      '');
    html+='</div>';
    html+='<div style="height:1px;background:rgba(124,58,237,.15);margin:10px 0"></div>';
    html+='<div style="margin-bottom:8px"><label class="lbl">Time Variable</label>';
    html+=mkSelect('surv-time',nF,aState.survTime,'aState.survTime=val;renderASub()','Time Variable')+'</div>';
    html+='<div style="margin-bottom:8px"><label class="lbl">Event Indicator <span style="color:rgba(232,222,255,.35)">(1=event, 0=censored)</span></label>';
    html+=mkSelect('surv-event',nF,aState.survEvent,'aState.survEvent=val;renderASub()','Event Indicator')+'</div>';
    html+='<div><label class="lbl">Group Variable <span style="color:rgba(232,222,255,.35)">(optional)</span></label>';
    html+=mkSelect('surv-grp',['(none)'].concat(aF),aState.survGroup||'(none)','aState.survGroup=(val==="(none)"?"":val);renderASub()','Group Variable')+'</div>';
    html+='</div>';
    html+='</div>';

    // ── Right: method-specific content ──────────────────────────
    html+='<div style="display:flex;flex-direction:column;gap:10px">';

    if(aState.survMethod==='km'){
      html+='<div class="card"><div class="sec-hd">Kaplan-Meier Estimator</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:10px;line-height:1.65">Mengestimasi survival function S(t) = P(T&gt;t) dari data dengan censoring. Titik drop = event; ✚ = censored.</div>';
      html+='<button class="btn btn-primary btn-sm" style="margin-bottom:11px" onclick="runSurvival()">▶ Run</button>';
      if(survPrv&&!survPrv._err){
        html+='<div class="stats-grid2">';
        survPrv.groups.forEach(function(g){
          html+=stCard('Median Survival ('+g.label+')',g.medianSurv===null?'NR':SE.f4(g.medianSurv),'');
          html+=stCard('Events / N ('+g.label+')',g.events+' / '+g.n,'');
        });
        html+='</div>';
        if(survPrv.groups.length>=2){
          html+='<div style="margin-top:10px;padding:8px 12px;background:rgba(74,222,128,.07);border-radius:8px;border:1px solid rgba(74,222,128,.2);font-size:11.5px;color:rgba(232,222,255,.75)">';
          html+='Log-rank: χ²('+survPrv.logrank.df+') = '+survPrv.logrank.chi2+', p = '+survPrv.logrank.p_fmt+' '+(parseFloat(survPrv.logrank.p)<0.05?'<span style="color:#34d399">✓ Sig</span>':'<span style="color:#fbbf24">ns</span>');
          html+='</div>';
        }
      }
      if(survPrv&&survPrv._err) html+='<div style="color:#f87171;font-size:11px;margin-top:8px">'+survPrv.msg+'</div>';
      html+='</div>';
      html+='<div class="card"><div class="sec-hd">KM Plot</div>';
      if(survPrv&&!survPrv._err) html+=svgKaplanMeier(survPrv);
      else html+='<div class="chart-empty">Set time dan event variable untuk melihat kurva KM</div>';
      html+='</div>';
    }

    else if(aState.survMethod==='logrank'){
      html+='<div class="card"><div class="sec-hd">Log-Rank Test</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:10px;line-height:1.65">Uji perbedaan survival curves antar grup. H₀: semua grup memiliki survival function yang sama.</div>';
      if(!aState.survGroup){
        html+='<div style="padding:9px 12px;background:rgba(251,191,36,.08);border-radius:8px;border:1px solid rgba(251,191,36,.2);font-size:11.5px;color:#fbbf24">⚠ Pilih Group Variable di panel kiri untuk menjalankan log-rank test.</div>';
      } else if(survPrv&&!survPrv._err&&survPrv.groups.length>=2){
        var lr=survPrv.logrank;
        html+='<div class="stats-grid2" style="margin-bottom:12px">';
        html+=stCard('χ²',lr.chi2,'Chi-square');
        html+=stCard('df',lr.df,'');
        html+=stCard('p-value',lr.p_fmt,'');
        html+=stCard('Sig',parseFloat(lr.p)<0.05?'Yes *':'No','');
        html+='</div>';
        html+='<div style="padding:10px 12px;background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.18);border-radius:8px;font-size:11.5px;color:rgba(232,222,255,.7);line-height:1.65">'+lr.interpretation+'</div>';
        html+=mkTable(['Group','N','Events','Censored','Median Survival','O-E'],
          survPrv.groups.map(function(g){return [g.label,g.n,g.events,g.n-g.events,g.medianSurv===null?'NR':SE.f4(g.medianSurv),SE.f4(g.oe||0)];}));
        html+='<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="runSurvival()">▶ Run</button>';
      } else if(survPrv&&survPrv._err) html+='<div style="color:#f87171;font-size:11px">'+survPrv.msg+'</div>';
      else html+='<div class="chart-empty">Pilih group variable dan pastikan data sudah di-load</div>';
      html+='</div>';
      html+='<div class="card"><div class="sec-hd">KM Plot (Comparison)</div>';
      if(survPrv&&!survPrv._err) html+=svgKaplanMeier(survPrv);
      else html+='<div class="chart-empty">Set variables untuk melihat kurva perbandingan</div>';
      html+='</div>';
    }

    else if(aState.survMethod==='cox'){
      html+='<div class="card"><div class="sec-hd">Cox Proportional Hazards</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:10px;line-height:1.65">Model semi-parametrik untuk memodelkan hazard sebagai fungsi kovariat. HR &gt; 1 = peningkatan risiko; HR &lt; 1 = protektif.</div>';
      html+='<label class="lbl">Covariates <span style="color:rgba(232,222,255,.35)">(Predictors)</span></label>';
      html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin:6px 0 10px">';
      nF.filter(function(v){return v!==aState.survTime&&v!==aState.survEvent;}).forEach(function(v){
        var sel=(aState.survCovs||[]).includes(v);
        html+='<label style="display:flex;align-items:center;gap:4px;font-size:11px;cursor:pointer;padding:4px 8px;border-radius:6px;background:'+(sel?'rgba(74,222,128,.12)':'rgba(255,255,255,.03)')+';border:1px solid '+(sel?'rgba(74,222,128,.3)':'rgba(255,255,255,.07)')+'"><input type="checkbox" '+(sel?'checked':'')+' onchange="toggleSurvCov(\''+v+'\',this.checked)" style="accent-color:#4ade80"/>'+v+'</label>';
      });
      html+='</div>';
      html+='<button class="btn btn-primary btn-sm"  onclick="runCoxRegression()">▶ Run</button>';
      if(coxPrv&&!coxPrv._err){
        html+='<div class="stats-grid2" style="margin-top:11px">';
        html+=stCard('N',coxPrv.n,'');
        html+=stCard('Events',coxPrv.events,'');
        html+=stCard('LR χ²',coxPrv.lrChi2,'p='+coxPrv.lrP_fmt);
        html+=stCard('Concordance',coxPrv.concordance,'C-index');
        html+='</div>';
      }
      if(coxPrv&&coxPrv._err) html+='<div style="color:#f87171;font-size:11px;margin-top:8px">'+coxPrv.msg+'</div>';
      html+='</div>';
      html+='<div class="card"><div class="sec-hd">Hazard Ratios</div>';
      if(coxPrv&&!coxPrv._err){
        html+=mkTable(['Covariate','β','SE','HR','95% CI HR','z','p'],
          coxPrv.coefs.map(function(c){
            var sig=parseFloat(c.p)<0.05;
            var hrNum=parseFloat(c.HR);
            var hrCol=hrNum>1.5?'#f87171':hrNum<0.67?'#34d399':'#fbbf24';
            return [c.name,c.beta,c.se,'<span style="color:'+hrCol+';font-weight:700">'+c.HR+'</span>',c.ci95,c.z,(sig?'<b style="color:#34d399">':'')+c.p_fmt+(sig?'</b>':'')];
          }));
        html+=svgForestPlot(coxPrv);
      } else {
        html+='<div class="chart-empty">Pilih covariates dan run Cox model</div>';
      }
      html+='</div>';
    }

    html+='</div>'; // end right col
    html+='</div>'; // end grid2
  }
  // ─────────────────────────────────────────────────────────────────────
  else if(currentASub==='poweranalysis'||currentASub==='powerplot'||currentASub==='sensitivity'){
    var pw=aState;
    var testOptions=['ttest_2samp','ttest_1samp','ttest_paired','anova_oneway','correlation','regression_r2','chisq'];
    var testLabels={'ttest_2samp':'Independent Samples T-Test','ttest_1samp':'One-Sample T-Test','ttest_paired':'Paired T-Test','anova_oneway':'One-Way ANOVA (F-test)','correlation':'Correlation (r)','regression_r2':'Multiple Regression (R²)','chisq':'Chi-Square'};
    var effectLabels={'ttest_2samp':"Cohen's d",'ttest_1samp':"Cohen's d",'ttest_paired':"Cohen's dz",'anova_oneway':"Cohen's f",'correlation':"Pearson r",'regression_r2':"Cohen's f²",'chisq':'w (Cohen)'};
    var effectConventions={'ttest_2samp':['0.20','0.50','0.80'],'ttest_1samp':['0.20','0.50','0.80'],'ttest_paired':['0.20','0.50','0.80'],'anova_oneway':['0.10','0.25','0.40'],'correlation':['0.10','0.30','0.50'],'regression_r2':['0.02','0.15','0.35'],'chisq':['0.10','0.30','0.50']};
    var effConvNames=['Small','Medium','Large'];

    if(currentASub==='poweranalysis'){
      var pwRes=null;
      try{ pwRes=computePower(pw.pwTest,parseFloat(pw.pwAlpha),parseFloat(pw.pwPower),parseFloat(pw.pwEffect),parseInt(pw.pwGroups||2),parseInt(pw.pwTails||2),pw.pwSolve,parseInt(pw.pwN||30)); }catch(e){ pwRes={err:e.message}; }

      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">Power Analysis — Sample Size Calculator</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:12px;line-height:1.6">Tentukan N minimum yang dibutuhkan, atau hitung power dari N yang ada, berdasarkan effect size, α, dan tipe uji statistik.</div>';

      // Test type — custom csel
      html+='<div style="margin-bottom:10px">';
      html+=mkOptCsel('pw-test', testOptions.map(function(t){return{val:t,label:testLabels[t]};}), pw.pwTest||'ttest_2samp', 'aState.pwTest=_cR["pw-test"]._vals[_cR["pw-test"].fields.indexOf(val)];renderASub()', 'Statistical Test', true);
      html+='</div>';

      // Solve for — pill buttons
      html+='<div style="margin-bottom:10px"><label class="lbl">Solve For</label><div class="row" style="gap:5px;margin-top:5px;flex-wrap:wrap">';
      [['n','N (Sample Size)'],['power','Power (1−β)'],['alpha','Alpha (α)'],['effect','Effect Size']].forEach(function(s){
        html+='<button class="btn '+(pw.pwSolve===s[0]?'btn-primary':'btn-ghost')+' btn-sm" onclick="aState.pwSolve=\''+s[0]+'\';renderASub()">'+s[1]+'</button>';
      });
      html+='</div></div>';

      // Alpha — csel
      if(pw.pwSolve!=='alpha'){
        html+='<div style="margin-bottom:9px">';
        html+=mkOptCsel('pw-alpha', [{val:0.001,label:'0.001'},{val:0.01,label:'0.01'},{val:0.05,label:'0.05'},{val:0.10,label:'0.10'}], pw.pwAlpha, 'aState.pwAlpha=parseFloat(_cR["pw-alpha"]._vals[_cR["pw-alpha"].fields.indexOf(val)]);renderASub()', 'Significance Level (α)');
        html+='</div>';
      }

      // Power — csel
      if(pw.pwSolve!=='power'){
        html+='<div style="margin-bottom:9px">';
        html+=mkOptCsel('pw-power', [{val:0.70,label:'0.70 (70%)'},{val:0.80,label:'0.80 (80%)'},{val:0.90,label:'0.90 (90%)'},{val:0.95,label:'0.95 (95%)'}], pw.pwPower, 'aState.pwPower=parseFloat(_cR["pw-power"]._vals[_cR["pw-power"].fields.indexOf(val)]);renderASub()', 'Desired Power (1−β)');
        html+='</div>';
      }

      // Effect size — pill shortcuts + number input
      if(pw.pwSolve!=='effect'){
        html+='<div style="margin-bottom:9px"><label class="lbl">'+effectLabels[pw.pwTest||'ttest_2samp']+' (Effect Size)</label>';
        var convs=effectConventions[pw.pwTest||'ttest_2samp']||['0.2','0.5','0.8'];
        html+='<div class="row" style="gap:5px;margin-top:5px;flex-wrap:wrap">';
        convs.forEach(function(v,i){
          var active=parseFloat(pw.pwEffect)===parseFloat(v);
          html+='<button class="btn '+(active?'btn-primary':'btn-ghost')+' btn-sm" onclick="aState.pwEffect='+v+';renderASub()">'+effConvNames[i]+' ('+v+')</button>';
        });
        html+='</div>';
        html+='<input type="number" class="inp" step="0.01" value="'+pw.pwEffect+'" oninput="aState.pwEffect=parseFloat(this.value)||0.5" onblur="renderASub()" style="margin-top:7px;width:130px" placeholder="Custom…"/>';
        html+='</div>';
      }

      // Groups — csel (only when relevant)
      if(pw.pwSolve==='n'&&(pw.pwTest==='ttest_2samp'||pw.pwTest==='anova_oneway')){
        html+='<div style="margin-bottom:9px">';
        html+=mkOptCsel('pw-groups', [2,3,4,5,6].map(function(g){return{val:g,label:g+' groups'};}), pw.pwGroups||2, 'aState.pwGroups=parseInt(_cR["pw-groups"]._vals[_cR["pw-groups"].fields.indexOf(val)]);renderASub()', 'Number of Groups');
        html+='</div>';
      }

      // N input (when solving for power/effect/alpha)
      if(pw.pwSolve!=='n'){
        html+='<div style="margin-bottom:9px"><label class="lbl">Sample Size (N per group)</label>';
        html+='<input type="number" class="inp" value="'+(pw.pwN||30)+'" min="3" max="10000" oninput="aState.pwN=parseInt(this.value)||30" onblur="renderASub()" style="margin-top:5px;width:130px" placeholder="N"/>';
        html+='</div>';
      }

      // Tails — csel
      if((pw.pwTest||'').indexOf('ttest')>=0||(pw.pwTest||'').indexOf('correlation')>=0){
        html+='<div style="margin-bottom:9px">';
        html+=mkOptCsel('pw-tails', [{val:1,label:'1-tailed'},{val:2,label:'2-tailed'}], pw.pwTails||2, 'aState.pwTails=parseInt(_cR["pw-tails"]._vals[_cR["pw-tails"].fields.indexOf(val)]);renderASub()', 'Hypothesis Tails');
        html+='</div>';
      }

      html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runPowerAnalysis()">▶ Run</button>';
      html+='</div>';

      // Results panel
      html+='<div class="card"><div class="sec-hd">Results</div>';
      if(pwRes&&!pwRes.err){
        html+='<div class="stats-grid2" style="margin-bottom:12px">';
        html+=stCard('Sample Size (N)',pwRes.n,'Per group');
        html+=stCard('Power (1−β)',SE.f4(pwRes.power),pwRes.powerInterp);
        html+=stCard('Alpha (α)',SE.f4(pwRes.alpha),'Type I error');
        html+=stCard(effectLabels[pw.pwTest||'ttest_2samp'],SE.f4(pwRes.effect),pwRes.effectInterp);
        html+='</div>';
        if(pwRes.totalN) html+='<div style="padding:8px 11px;background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.2);border-radius:8px;font-size:12px;color:#34d399;margin-bottom:10px"><b>Total N needed: '+pwRes.totalN+'</b> ('+pwRes.groups+' groups × '+pwRes.n+' per group)</div>';
        var pwr=parseFloat(pwRes.power);
        var pwCol=pwr>=0.9?'#34d399':pwr>=0.8?'#fbbf24':'#f87171';
        html+='<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:11px;color:rgba(232,222,255,.5);margin-bottom:4px"><span>Power</span><span style="color:'+pwCol+'">'+SE.f4(pwr*100)+'%</span></div>';
        html+='<div style="height:8px;background:rgba(255,255,255,.06);border-radius:99px;overflow:hidden"><div style="height:100%;width:'+Math.min(100,pwr*100)+'%;background:'+pwCol+';border-radius:99px;transition:width .3s"></div></div></div>';
        html+='<div style="padding:10px 12px;background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.18);border-radius:8px;font-size:11.5px;color:rgba(232,222,255,.7);line-height:1.65">'+pwRes.interpretation+'</div>';
        var convRef=effectConventions[pw.pwTest||'ttest_2samp']||['0.2','0.5','0.8'];
        html+='<div class="tbl-wrap" style="margin-top:12px"><table><thead><tr><th>Convention</th><th>'+effectLabels[pw.pwTest||'ttest_2samp']+'</th><th>Interpretation</th></tr></thead><tbody>';
        html+='<tr><td class="td-label" style="color:#34d399">Small</td><td class="td-num">'+convRef[0]+'</td><td style="font-size:11px;color:rgba(232,222,255,.55)">Subtle, hard to detect visually</td></tr>';
        html+='<tr><td class="td-label" style="color:#fbbf24">Medium</td><td class="td-num">'+convRef[1]+'</td><td style="font-size:11px;color:rgba(232,222,255,.55)">Noticeable effect, typical in social science</td></tr>';
        html+='<tr><td class="td-label" style="color:#f87171">Large</td><td class="td-num">'+convRef[2]+'</td><td style="font-size:11px;color:rgba(232,222,255,.55)">Obvious, strong effect</td></tr>';
        html+='</tbody></table></div>';
      } else if(pwRes&&pwRes.err){
        html+='<div style="color:#f87171;font-size:11.5px;padding:10px">'+pwRes.err+'</div>';
      } else {
        html+='<div class="chart-empty">Set parameters above and click Calculate</div>';
      }
      html+='</div></div>';
    }

    else if(currentASub==='powerplot'){
      html+='<div class="card"><div class="sec-hd"> Power Curves</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:12px;line-height:1.6">Visualisasi hubungan antara N, effect size, dan power. Garis horizontal 0.80 = standar minimum.</div>';
      html+='<div class="grid2" style="margin-bottom:12px">';
      html+='<div>';
      html+=mkOptCsel('pw-test-plot', testOptions.map(function(t){return{val:t,label:testLabels[t]};}), pw.pwTest||'ttest_2samp', 'aState.pwTest=_cR["pw-test-plot"]._vals[_cR["pw-test-plot"].fields.indexOf(val)];renderASub()', 'Test Type', true);
      html+='</div>';
      html+='<div>';
      html+=mkOptCsel('pw-alpha-plot', [{val:0.001,label:'α = 0.001'},{val:0.01,label:'α = 0.01'},{val:0.05,label:'α = 0.05'},{val:0.10,label:'α = 0.10'}], pw.pwAlpha, 'aState.pwAlpha=parseFloat(_cR["pw-alpha-plot"]._vals[_cR["pw-alpha-plot"].fields.indexOf(val)]);renderASub()', 'Alpha (α)');
      html+='</div>';
      html+='</div>';
      html+=svgPowerCurve(pw.pwTest||'ttest_2samp',parseFloat(pw.pwAlpha)||0.05,parseInt(pw.pwTails||2));
      html+='</div>';
      html+='<div class="card"><div class="sec-hd">N Table — Required Sample Size</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:10px">N per group untuk tiap kombinasi power dan effect size (α='+pw.pwAlpha+')</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Effect Size</th><th>Power 70%</th><th>Power 80%</th><th>Power 90%</th><th>Power 95%</th></tr></thead><tbody>';
      var convRef2=effectConventions[pw.pwTest||'ttest_2samp']||['0.2','0.5','0.8'];
      convRef2.forEach(function(eff,ei){
        html+='<tr><td class="td-label">'+eff+' ('+effConvNames[ei]+')</td>';
        [0.70,0.80,0.90,0.95].forEach(function(pwr2){
          try{var r2=computePower(pw.pwTest||'ttest_2samp',parseFloat(pw.pwAlpha)||0.05,pwr2,parseFloat(eff),parseInt(pw.pwGroups||2),parseInt(pw.pwTails||2),'n',30);html+='<td class="td-num" style="color:'+(pwr2>=0.8?'#34d399':'#fbbf24')+'">'+r2.n+'</td>';}
          catch(e2){html+='<td class="td-num">—</td>';}
        });
        html+='</tr>';
      });
      html+='</tbody></table></div></div>';
    }

    else if(currentASub==='sensitivity'){
      html+='<div class="card"><div class="sec-hd"> Sensitivity Analysis</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:12px;line-height:1.6">Berikan N yang ada → hitung Minimum Detectable Effect pada power dan α tertentu.</div>';
      html+='<div class="grid2" style="margin-bottom:10px">';
      html+='<div>';
      html+=mkOptCsel('pw-test-sens', testOptions.map(function(t){return{val:t,label:testLabels[t]};}), pw.pwTest||'ttest_2samp', 'aState.pwTest=_cR["pw-test-sens"]._vals[_cR["pw-test-sens"].fields.indexOf(val)];renderASub()', 'Test Type', true);
      html+='</div>';
      html+='<div><label class="lbl">N per group</label><input type="number" class="inp" style="margin-top:5px" value="'+(pw.pwN||30)+'" min="3" max="10000" oninput="aState.pwN=parseInt(this.value)||30" onblur="renderASub()" placeholder="N"/></div>';
      html+='</div>';
      html+='<div class="grid2" style="margin-bottom:10px">';
      html+='<div>';
      html+=mkOptCsel('pw-power-sens', [{val:0.70,label:'0.70 (70%)'},{val:0.80,label:'0.80 (80%)'},{val:0.90,label:'0.90 (90%)'},{val:0.95,label:'0.95 (95%)'}], pw.pwPower, 'aState.pwPower=parseFloat(_cR["pw-power-sens"]._vals[_cR["pw-power-sens"].fields.indexOf(val)]);renderASub()', 'Desired Power');
      html+='</div>';
      html+='<div>';
      html+=mkOptCsel('pw-alpha-sens', [{val:0.001,label:'0.001'},{val:0.01,label:'0.01'},{val:0.05,label:'0.05'},{val:0.10,label:'0.10'}], pw.pwAlpha, 'aState.pwAlpha=parseFloat(_cR["pw-alpha-sens"]._vals[_cR["pw-alpha-sens"].fields.indexOf(val)]);renderASub()', 'Alpha (α)');
      html+='</div>';
      html+='</div>';

      var mde=null;
      try{ mde=computePower(pw.pwTest||'ttest_2samp',parseFloat(pw.pwAlpha)||0.05,parseFloat(pw.pwPower)||0.80,null,parseInt(pw.pwGroups||2),parseInt(pw.pwTails||2),'effect',parseInt(pw.pwN||30)); }catch(e){}

      if(mde&&!mde.err){
        html+='<div class="stats-grid2" style="margin:12px 0">';
        html+=stCard('N per group',pw.pwN,'Input');
        html+=stCard('MDE',SE.f4(mde.effect),effectLabels[pw.pwTest||'ttest_2samp']);
        html+=stCard('Power',SE.f4(mde.power*100)+'%','');
        html+=stCard('Alpha',pw.pwAlpha,'');
        html+='</div>';
        html+='<div style="padding:10px 12px;background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.18);border-radius:8px;font-size:11.5px;color:rgba(232,222,255,.7);line-height:1.65">';
        html+='Dengan N='+pw.pwN+' per grup, studi Anda dapat mendeteksi effect size ≥ <b style="color:#c084fc">'+SE.f4(mde.effect)+'</b> ('+effectLabels[pw.pwTest||'ttest_2samp']+') pada power '+SE.f4(parseFloat(pw.pwPower)*100)+'% dan α='+pw.pwAlpha+'.';
        var convRef3=effectConventions[pw.pwTest||'ttest_2samp']||['0.2','0.5','0.8'];
        var mdeV=parseFloat(mde.effect);
        if(mdeV<=parseFloat(convRef3[0])) html+=' Cukup sensitif untuk mendeteksi efek kecil.';
        else if(mdeV<=parseFloat(convRef3[1])) html+=' Hanya bisa mendeteksi efek medium ke atas.';
        else html+=' Hanya bisa mendeteksi efek besar. Pertimbangkan menambah sampel.';
        html+='</div>';
        html+=svgSensitivityCurve(pw.pwTest||'ttest_2samp',parseFloat(pw.pwAlpha)||0.05,parseFloat(pw.pwPower)||0.80,parseInt(pw.pwTails||2),parseInt(pw.pwN||30));
      }
      html+='<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="runPowerAnalysis()">▶ Run</button>';
      html+='</div>';
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // MODERATION ANALYSIS
  // ─────────────────────────────────────────────────────────────────────
  else if(currentASub==='moderation'||currentASub==='simpleslopes'||currentASub==='jn'){
    var modData=data;
    var nF2=numFields(),aF2=allFields();
    if(!aState.modX&&nF2.length>0) aState.modX=nF2[0];
    if(!aState.modW&&nF2.length>1) aState.modW=nF2[1];
    if(!aState.modY&&nF2.length>2) aState.modY=nF2[2];
    var modValid=aState.modX&&aState.modW&&aState.modY&&aState.modX!==aState.modW&&aState.modX!==aState.modY&&aState.modW!==aState.modY;
    var modPrv=modValid?tryStats(function(){return computeModeration(aState.modX,aState.modW,aState.modY,aState.modCovs||[],aState.modCenter!==false);}):null;

    if(currentASub==='moderation'){
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">Moderation Analysis (X×W → Y)</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:10px;line-height:1.6">Uji apakah hubungan X→Y berbeda tergantung nilai moderator W. Interaction term X×W harus signifikan.</div>';

      html+=mkSelect('mod-x',nF2,aState.modX,'aState.modX=val;renderASub()','Independent Variable (X)');
      html+='<div style="margin-top:8px">'+mkSelect('mod-w',nF2,aState.modW,'aState.modW=val;renderASub()','Moderator Variable (W)')+'</div>';
      html+='<div style="margin-top:8px">'+mkSelect('mod-y',nF2,aState.modY,'aState.modY=val;renderASub()','Dependent Variable (Y)')+'</div>';

      // Covariates
      html+='<div style="margin-top:10px"><label class="lbl">Covariates (optional)</label><div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px">';
      nF2.forEach(function(f){
        if(f===aState.modX||f===aState.modW||f===aState.modY) return;
        var checked=(aState.modCovs||[]).includes(f);
        html+='<label style="display:flex;align-items:center;gap:4px;font-size:11px;color:rgba(232,222,255,.6);cursor:pointer"><input type="checkbox" '+(checked?'checked':'')+' onchange="toggleModCov(\''+f+'\',this.checked)" style="accent-color:#c084fc"/>'+f+'</label>';
      });
      html+='</div></div>';

      // Mean centering
      html+='<div style="margin-top:9px"><label style="display:flex;align-items:center;gap:7px;cursor:pointer"><input type="checkbox" '+(aState.modCenter!==false?'checked':'')+' onchange="aState.modCenter=this.checked;renderASub()" style="accent-color:#c084fc"/><span style="font-size:12px;color:rgba(232,222,255,.7)">Mean-center X and W before interaction</span></label><div style="font-size:10px;color:rgba(232,222,255,.35);margin-top:3px;margin-left:22px">Direkomendasikan untuk mengurangi multikollinearitas dan memudahkan interpretasi</div></div>';

      html+='<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="runModeration()">▶ Run</button>';

      if(modPrv&&!modPrv._err){
        html+='<div style="margin-top:12px">';
        // Regression table summary
        html+='<div style="font-size:11px;font-weight:700;color:#c084fc;margin-bottom:7px">Model Summary</div>';
        html+='<div class="stats-grid2" style="margin-bottom:10px">';
        html+=stCard('R²',modPrv.R2,'Variance explained');
        html+=stCard('Adj R²',modPrv.R2adj,'');
        html+=stCard('F',modPrv.F,'df='+modPrv.dfR+','+modPrv.dfE);
        html+=stCard('N',modPrv.n,'');
        html+='</div>';
        // Interaction significance
        var intSig=parseFloat(modPrv.interaction.p)<0.05;
        html+='<div style="padding:9px 12px;border-radius:8px;border-left:3px solid '+(intSig?'#34d399':'#f87171')+';background:rgba(0,0,0,.15);font-size:11.5px;color:rgba(232,222,255,.75);line-height:1.6">';
        html+='Interaction ('+aState.modX+'×'+aState.modW+'): <b style="color:'+(intSig?'#34d399':'#f87171')+'">b='+modPrv.interaction.b+', t='+modPrv.interaction.t+', p='+modPrv.interaction.p_fmt+'</b>';
        html+=(intSig?' ✓ Significant moderation detected':' ✗ Moderation not significant')+'. ΔR²='+modPrv.deltaR2+'</div>';
        html+='</div>';
      }
      if(modPrv&&modPrv._err) html+='<div style="color:#f87171;font-size:11px;margin-top:8px">'+modPrv.msg+'</div>';
      html+='</div>';

      // Interaction plot
      html+='<div class="card"><div class="sec-hd">Interaction Plot</div>';
      if(modPrv&&!modPrv._err){
        html+=svgModerationPlot(modPrv,aState.modX,aState.modW,aState.modY);
        html+='<div style="margin-top:10px"><div class="sec-hd">Coefficient Table</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th>Variable</th><th>b</th><th>SE</th><th>β</th><th>t</th><th>p</th></tr></thead><tbody>';
        modPrv.coefs.forEach(function(c){
          html+='<tr><td class="td-label">'+c.name+'</td><td class="td-num">'+c.b+'</td><td class="td-num">'+c.SE+'</td><td class="td-num">'+c.beta+'</td><td class="td-num">'+c.t+'</td><td><span class="tag '+(parseFloat(c.p)<0.05?'tag-green':'tag-gray')+'">'+c.p_fmt+'</span></td></tr>';
        });
        html+='</tbody></table></div></div>';
      } else {
        html+='<div class="chart-empty">Select X, W, Y and Run to see interaction plot</div>';
      }
      html+='</div></div>';
    }

    else if(currentASub==='simpleslopes'){
      html+='<div class="card"><div class="sec-hd"> Simple Slopes Analysis</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:10px;line-height:1.6">Hitung slope X→Y pada tiga level W (Mean−1SD, Mean, Mean+1SD). Simple slope signifikan menunjukkan X berpengaruh pada W level tertentu.</div>';

      if(!modValid){
        html+='<div style="color:#fbbf24;font-size:11.5px;padding:10px;background:rgba(251,191,36,.08);border-radius:8px;border:1px solid rgba(251,191,36,.2)">Pilih X, W, Y di tab Moderation terlebih dahulu.</div>';
      } else if(modPrv&&!modPrv._err){
        var ss=modPrv.simpleSlopes;
        html+='<div class="tbl-wrap"><table><thead><tr><th>W Level</th><th>W Value</th><th>Slope (b₁+b₃W)</th><th>SE</th><th>t</th><th>p</th><th>95% CI</th><th>Sig</th></tr></thead><tbody>';
        ss.forEach(function(s){
          html+='<tr><td class="td-label" style="color:'+s.color+'">'+s.label+'</td><td class="td-num">'+s.wVal+'</td><td class="td-num" style="color:'+s.color+'">'+s.slope+'</td><td class="td-num">'+s.se+'</td><td class="td-num">'+s.t+'</td><td><span class="tag '+(parseFloat(s.p)<0.05?'tag-green':'tag-gray')+'">'+s.p_fmt+'</span></td><td class="td-num">'+s.ci95+'</td><td>'+( parseFloat(s.p)<0.05?'*':'ns')+'</td></tr>';
        });
        html+='</tbody></table></div>';
        html+=svgSimpleSlopesPlot(modPrv,aState.modX,aState.modW,aState.modY);
        html+='<div style="margin-top:10px;padding:9px 12px;background:rgba(124,58,237,.08);border-radius:8px;font-size:11px;color:rgba(232,222,255,.6);line-height:1.65">';
        html+='<b style="color:#c084fc">Interpretasi:</b> ';
        var ssSig=ss.filter(function(s){return parseFloat(s.p)<0.05;});
        if(ssSig.length===0) html+='Tidak ada simple slope yang signifikan. X tidak berpengaruh signifikan pada Y di semua level W.';
        else if(ssSig.length===ss.length) html+='Semua simple slopes signifikan. X berpengaruh pada Y di semua level W, tetapi kekuatannya berbeda.';
        else html+='X berpengaruh signifikan pada Y hanya pada beberapa level W: '+ssSig.map(function(s){return s.label;}).join(', ')+'.';
        html+='</div>';
      } else if(modPrv&&modPrv._err){
        html+='<div style="color:#f87171;font-size:11px">'+modPrv.msg+'</div>';
      }
      html+='</div>';
    }

    else if(currentASub==='jn'){
      html+='<div class="card"><div class="sec-hd"> Johnson-Neyman Technique (Floodlight Analysis)</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:10px;line-height:1.6">Temukan semua titik (significance region) pada W di mana hubungan X→Y signifikan (p&lt;0.05). Lebih presisi dari simple slopes yang hanya lihat ±1SD.</div>';

      if(!modValid){
        html+='<div style="color:#fbbf24;font-size:11.5px;padding:10px;background:rgba(251,191,36,.08);border-radius:8px;border:1px solid rgba(251,191,36,.2)">Pilih X, W, Y di tab Moderation terlebih dahulu.</div>';
      } else if(modPrv&&!modPrv._err){
        var jn=modPrv.jn;
        html+='<div class="stats-grid2" style="margin-bottom:12px">';
        html+=stCard('JN Point(s)',jn.regions.length>0?jn.regions.map(function(r){return SE.f4(r.value);}).join(', '):'None','W value where p=0.05');
        html+=stCard('% W significant',SE.f4(jn.pctSig)+'%','Cases in sig region');
        html+='</div>';
        html+=svgJohnsonNeymanPlot(modPrv,aState.modX,aState.modW,aState.modY);
        if(jn.regions.length>0){
          html+='<div style="margin-top:10px"><div class="tbl-wrap"><table><thead><tr><th>JN Point</th><th>W Value</th><th>Sig Region</th><th>% Dataset</th></tr></thead><tbody>';
          jn.regions.forEach(function(r,i){
            html+='<tr><td class="td-label">JN-'+(i+1)+'</td><td class="td-num">'+SE.f4(r.value)+'</td><td style="font-size:11px;color:#c084fc">'+r.direction+'</td><td class="td-num">'+SE.f4(r.pct)+'%</td></tr>';
          });
          html+='</tbody></table></div></div>';
        }
        html+='<div style="margin-top:10px;padding:9px 12px;background:rgba(124,58,237,.08);border-radius:8px;font-size:11.5px;color:rgba(232,222,255,.7);line-height:1.65">';
        html+='<b style="color:#c084fc">Interpretasi:</b> ';
        if(jn.regions.length===0) html+='Tidak ditemukan Johnson-Neyman point. Hubungan X→Y '+( jn.pctSig>50?'signifikan di seluruh rentang W.':'tidak signifikan di seluruh rentang W.');
        else if(jn.regions.length===1) html+='Johnson-Neyman point pada W='+SE.f4(jn.regions[0].value)+'. Hubungan X→Y signifikan '+jn.regions[0].direction+'.';
        else html+='Terdapat '+jn.regions.length+' titik transisi signifikansi pada rentang W.';
        html+='</div>';
        html+='<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="runModeration()">▶ Run</button>';
      } else if(modPrv&&modPrv._err){
        html+='<div style="color:#f87171;font-size:11px">'+modPrv.msg+'</div>';
      }
      html+='</div>';
    }
  }

  // ── BAYESIAN ANALYSIS ──────────────────────────────────────────────────
  else if(currentASub==='bayesian'){
    var bV=aState.bayV||nF[0]||'';
    var bG=aState.bayG||aF[aF.length>1?aF.length-1:0]||'';
    var bPrior=aState.bayPrior||0.707;
    var bTails=aState.bayTails||2;
    var prv=null;
    if(bV&&bG){
      var grps=[...new Set(data.map(function(r){return r[bG];}).filter(function(v){return v!==null&&v!==undefined;}))]
        .sort().slice(0,2);
      if(grps.length>=2){
        var a2=SE.validNums(data.filter(function(r){return r[bG]===grps[0];}).map(function(r){return r[bV];}));
        var b2=SE.validNums(data.filter(function(r){return r[bG]===grps[1];}).map(function(r){return r[bV];}));
        prv=tryStats(function(){return SE.bayesTTest(a2,b2,bPrior,bTails);});
      }
    }
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Bayesian Independent T-Test</div>';
    html+='<div style="font-size:11.5px;color:rgba(232,222,255,.45);margin-bottom:11px;line-height:1.6">The Bayes Factor (BF₁₀) quantifies evidence <em>for</em> H₁ relative to H₀. BF₁₀ &gt; 3 = moderate evidence for effect; &lt; 1/3 = evidence for null.</div>';
    html+=mkSelect('bay-v',nF,bV,'aState.bayV=val;renderASub()','Dependent Variable');
    html+='<div style="margin-top:8px">'+mkSelect('bay-g',aF,bG,'aState.bayG=val;renderASub()','Grouping Variable')+'</div>';
    html+='<div style="margin-top:10px">';
    html+='<label class="lbl">Prior scale (r) — Cauchy half-normal width</label>';
    html+='<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:5px">';
    [{v:0.354,l:'Wide (0.354)'},{v:0.707,l:'Default (√2/2)'},{v:1,l:'Ultrawide (1)'}].forEach(function(opt){
      var sel=Math.abs(bPrior-opt.v)<0.01;
      html+='<button class="btn btn-sm '+(sel?'btn-primary':'btn-ghost')+'" onclick="aState.bayPrior='+opt.v+';renderASub()">'+opt.l+'</button>';
    });
    html+='</div></div>';
    html+='<div style="margin-top:10px">';
    html+='<label class="lbl">Hypothesis</label>';
    html+='<div style="display:flex;gap:7px;margin-top:5px">';
    [{v:2,l:'Two-tailed (≠)'},{v:1,l:'One-tailed (>)'}].forEach(function(opt){
      var sel=bTails===opt.v;
      html+='<button class="btn btn-sm '+(sel?'btn-primary':'btn-ghost')+'" onclick="aState.bayTails='+opt.v+';renderASub()">'+opt.l+'</button>';
    });
    html+='</div></div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="runBayes()">▶ Run</button>';
    if(prv&&!prv._err){
      var bf=parseFloat(prv.BF10);
      var bfCol=bf>100?'#34d399':bf>10?'#4ade80':bf>3?'#a3e635':bf>1?'#fbbf24':bf>0.333?'#fb923c':'#f87171';
      html+='<div style="margin-top:12px;padding:12px 14px;border-radius:10px;background:rgba(0,0,0,.2);border:2px solid '+bfCol+'">';
      html+='<div style="font-size:18px;font-weight:900;color:'+bfCol+';font-family:Playfair Display,serif">BF₁₀ = '+prv.BF10+'</div>';
      html+='<div style="font-size:11.5px;color:rgba(232,222,255,.6);margin-top:3px">'+prv.interpretation+'</div>';
      html+='</div>';
      html+='<div class="stats-grid2" style="margin-top:10px">';
      html+=stCard('BF₁₀',prv.BF10,'Evidence ratio');
      html+=stCard('BF₀₁',prv.BF01,'Evidence for null');
      html+=stCard("Cohen's d",prv.cohensD,prv.dInterp);
      html+=stCard('t-statistic',prv.t,'df='+prv.df);
      html+='</div>';
      html+='<div style="margin-top:8px;padding:8px 11px;background:rgba(124,58,237,.07);border-radius:7px;font-size:11px;color:rgba(232,222,255,.55);line-height:1.6">';
      html+='<b style="color:#c084fc">Prior:</b> Cauchy(r='+prv.priorScale+') · <b style="color:#c084fc">Tails:</b> '+(bTails===2?'two-tailed':'one-tailed (positive)');
      html+='</div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Group Distributions</div>';
    html+=svgBoxplot(data,bV,bG);
    if(prv&&!prv._err){
      var bf2=parseFloat(prv.BF10);
      var bf2pct=Math.min(100,Math.max(0,bf2>100?100:bf2>10?(60+bf2*0.4):bf2>3?(40+bf2*6.67):bf2>1?(25+bf2*5):bf2*10));
      html+='<div style="margin-top:12px">';
      html+='<div style="font-size:10.5px;color:rgba(232,222,255,.4);margin-bottom:5px;text-transform:uppercase;letter-spacing:1px">Evidence Scale</div>';
      html+='<div style="position:relative;height:10px;background:linear-gradient(90deg,#f87171,#fbbf24,#34d399);border-radius:99px;overflow:hidden">';
      html+='<div style="position:absolute;top:0;left:0;height:100%;width:'+bf2pct+'%;background:rgba(255,255,255,.0)"></div>';
      html+='<div style="position:absolute;top:-2px;left:'+Math.max(0,Math.min(96,bf2pct))+'%;width:2px;height:14px;background:#fff;border-radius:99px;transform:translateX(-50%);box-shadow:0 0 6px rgba(255,255,255,.6)"></div>';
      html+='</div>';
      html+='<div style="display:flex;justify-content:space-between;font-size:9px;color:rgba(232,222,255,.3);margin-top:3px"><span>Strong H₀</span><span>Anecdotal</span><span>Strong H₁</span></div>';
      html+='</div>';
      html+='<div style="margin-top:10px;padding:8px 11px;background:rgba(124,58,237,.07);border:1px solid rgba(124,58,237,.15);border-radius:8px;font-size:11px;color:rgba(232,222,255,.55);line-height:1.65">';
      html+='<b style="color:#c084fc">BF Interpretation:</b> &lt;1/100 extreme H₀ · 1/30 very strong H₀ · 1/10 strong · 1/3 moderate · 1 no evidence · 3 moderate H₁ · 10 strong · 30 very strong · &gt;100 extreme H₁.';
      html+='</div>';
    }
    html+='</div></div>';
  }

  else if(currentASub==='bayesian_corr'){
    var bcX=aState.bcX||nF[0]||'';
    var bcY=aState.bcY||(nF.length>1?nF[1]:'');
    var bcPrior=aState.bcPrior||1;
    var bcPrv=null;
    if(bcX&&bcY){
      bcPrv=tryStats(function(){return SE.bayesPearson(SE.validNums(data.map(function(r){return r[bcX];})),SE.validNums(data.map(function(r){return r[bcY];})),bcPrior);});
    }
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Bayesian Correlation</div>';
    html+='<div style="font-size:11.5px;color:rgba(232,222,255,.45);margin-bottom:11px;line-height:1.6">Tests H₁: ρ≠0 vs H₀: ρ=0. Uses the Jeffreys–Zellner–Siow prior on the correlation coefficient.</div>';
    html+=mkSelect('bc-x',nF,bcX,'aState.bcX=val;renderASub()','Variable X');
    html+='<div style="margin-top:8px">'+mkSelect('bc-y',nF,bcY,'aState.bcY=val;renderASub()','Variable Y')+'</div>';
    html+='<div style="margin-top:10px">';
    html+='<label class="lbl">Prior scale (κ)</label>';
    html+='<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:5px">';
    [{v:0.5,l:'0.5'},{v:1,l:'1 (default)'},{v:2,l:'2'}].forEach(function(opt){
      var sel=Math.abs(bcPrior-opt.v)<0.01;
      html+='<button class="btn btn-sm '+(sel?'btn-primary':'btn-ghost')+'" onclick="aState.bcPrior='+opt.v+';renderASub()">'+opt.l+'</button>';
    });
    html+='</div></div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="runBayesCorr()">▶ Run</button>';
    if(bcPrv&&!bcPrv._err){
      var bfc=parseFloat(bcPrv.BF10);
      var bfcCol=bfc>100?'#34d399':bfc>10?'#4ade80':bfc>3?'#a3e635':bfc>1?'#fbbf24':bfc>0.333?'#fb923c':'#f87171';
      html+='<div style="margin-top:12px;padding:12px 14px;border-radius:10px;background:rgba(0,0,0,.2);border:2px solid '+bfcCol+'">';
      html+='<div style="font-size:18px;font-weight:900;color:'+bfcCol+';font-family:Playfair Display,serif">BF₁₀ = '+bcPrv.BF10+'</div>';
      html+='<div style="font-size:11.5px;color:rgba(232,222,255,.6);margin-top:3px">'+bcPrv.interpretation+'</div>';
      html+='</div>';
      html+='<div class="stats-grid2" style="margin-top:10px">';
      html+=stCard('BF₁₀',bcPrv.BF10,'');
      html+=stCard('BF₀₁',bcPrv.BF01,'');
      html+=stCard('Pearson r',bcPrv.r,'');
      html+=stCard('p-value',bcPrv.p_fmt,'NHST');
      html+='</div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Scatter Plot</div>';
    html+=svgScatter(data,bcX,bcY);
    html+='</div></div>';
  }

  else if(currentASub==='bayesian_posterior'){
    var bpV=aState.bpV||nF[0]||'';
    var bpMu0=aState.bpMu0!==undefined?aState.bpMu0:0;
    var bpKappa=aState.bpKappa||1;
    var bpAlpha=aState.bpAlpha||0.5;
    var bpBeta=aState.bpBeta||0.5;
    var bpPrv=null;
    var bpVals=SE.validNums(data.map(function(r){return r[bpV];}));
    if(bpVals.length>=3){
      bpPrv=tryStats(function(){return SE.bayesPosteriorNormal(bpVals,bpMu0,bpKappa,bpAlpha,bpBeta);});
    }
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">&#x3B2; Posterior Distribution (Normal-Inverse-Gamma)</div>';
    html+='<div style="font-size:11.5px;color:rgba(232,222,255,.45);margin-bottom:11px;line-height:1.6">Bayesian updating of the mean using a Normal-Inverse-Gamma prior. The posterior summarizes our updated belief about μ after observing the data.</div>';
    html+=mkSelect('bp-v',nF,bpV,'aState.bpV=val;renderASub()','Variable');
    html+='<div class="grid2" style="margin-top:10px;gap:8px">';
    html+='<div><label class="lbl">Prior mean (μ₀)</label><input class="inp" type="number" step="any" value="'+bpMu0+'" oninput="aState.bpMu0=parseFloat(this.value)||0;renderASub()"/></div>';
    html+='<div><label class="lbl">Prior precision (κ₀)</label><input class="inp" type="number" step="0.1" min="0.01" value="'+bpKappa+'" oninput="aState.bpKappa=Math.max(0.01,parseFloat(this.value)||1);renderASub()"/></div>';
    html+='<div><label class="lbl">α₀ (shape)</label><input class="inp" type="number" step="0.1" min="0.01" value="'+bpAlpha+'" oninput="aState.bpAlpha=Math.max(0.01,parseFloat(this.value)||0.5);renderASub()"/></div>';
    html+='<div><label class="lbl">β₀ (rate)</label><input class="inp" type="number" step="0.1" min="0.01" value="'+bpBeta+'" oninput="aState.bpBeta=Math.max(0.01,parseFloat(this.value)||0.5);renderASub()"/></div>';
    html+='</div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="runBayesPosterior()">▶ Run</button>';
    if(bpPrv&&!bpPrv._err){
      html+='<div class="stats-grid2" style="margin-top:11px">';
      html+=stCard('Posterior Mean (μ)',bpPrv.postMean,'');
      html+=stCard('95% Credible Interval',bpPrv.hdi95,'HDI');
      html+=stCard('Posterior SD',bpPrv.postSD,'');
      html+=stCard('N',bpPrv.n,'observations');
      html+=stCard('Prior μ₀',bpPrv.priorMu0,'');
      html+=stCard('Posterior κₙ',bpPrv.postKappa,'precision');
      html+='</div>';
      html+='<div style="margin-top:8px;padding:9px 12px;background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.18);border-radius:8px;font-size:11px;color:rgba(232,222,255,.6);line-height:1.65">After observing '+bpPrv.n+' data points, posterior mean = <b style="color:#c084fc">'+bpPrv.postMean+'</b> with 95% credible interval <b style="color:#f472b6">'+bpPrv.hdi95+'</b>.</div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Prior vs Posterior</div>';
    if(bpPrv&&!bpPrv._err){
      html+=svgBayesPosterior(bpPrv);
    } else {
      html+='<div class="chart-empty">Select variable with ≥3 values</div>';
    }
    html+='</div></div>';
  }

  // ── TIME SERIES (ARIMA + Decomposition) ────────────────────────────────
  else if(currentASub==='timeseries'){
    var tsV  = aState.tsV  || nF[0] || '';
    var tsMod= aState.tsMod|| 'arima';
    var tsP  = aState.tsP  !== undefined ? aState.tsP  : 1;
    var tsD  = aState.tsD  !== undefined ? aState.tsD  : 1;
    var tsQ  = aState.tsQ  !== undefined ? aState.tsQ  : 1;
    var tsDType = aState.tsDType || 'additive';
    var tsPeriod= aState.tsPeriod!== undefined ? aState.tsPeriod : 12;
    var tsVals  = SE.validNums(data.map(function(r){return r[tsV];}));
    var tsN     = tsVals.length;

    // tsACF, tsPACF, tsDiff, tsARIMA, tsDecomp dipindah ke
    // js/stats-engine/stats-timeseries.js (B26) — sekarang fungsi global,
    // dipanggil langsung di bawah tanpa ubah call-site.

    var tsRes = tsN>=4 ? tryStats(function(){
      if(tsMod==='arima') return tsARIMA(tsVals,tsP,tsD,tsQ);
      else return tsDecomp(tsVals,tsPeriod,tsDType);
    }) : null;

    html+='<div class="grid2">';

    // LEFT: Settings
    html+='<div>';
    html+='<div class="card"><div class="sec-hd">Time Series Analysis</div>';
    html+=mkSelect('ts-v',nF,tsV,'aState.tsV=val;renderASub()','Time-ordered Variable');
    html+='<div style="margin-top:9px">'+mkCsel('ts-mod',['arima','decomp'],tsMod,'aState.tsMod=val;renderASub()','Method')+'</div>';

    if(tsMod==='arima'){
      html+='<div style="margin-top:10px"><div class="sec-hd" style="font-size:11px;margin-bottom:7px">ARIMA Orders <span style="color:rgba(232,222,255,.35);font-weight:400">(p, d, q)</span></div>';
      html+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">';
      [['AR (p)','tsP',tsP],['Diff (d)','tsD',tsD],['MA (q)','tsQ',tsQ]].forEach(function(f){
        html+='<div><label class="lbl" style="font-size:10px">'+f[0]+'</label>';
        html+='<div style="display:flex;gap:3px;margin-top:3px">';
        [0,1,2,3].forEach(function(v){
          html+='<button class="btn btn-sm '+(f[2]===v?'btn-primary':'btn-ghost')+'" style="flex:1;padding:4px 2px;min-width:0;text-align:center;justify-content:center;display:flex;align-items:center" onclick="aState.'+f[1]+'='+v+';renderASub()">'+v+'</button>';
        });
        html+='</div></div>';
      });
      html+='</div>';
      html+='<div class="assump" style="margin-top:9px">p: AR lags · d: differencing · q: MA lags.<br>ACF / PACF plot otomatis ditampilkan di kanan setelah variable dipilih.</div>';
    } else {
      html+='<div style="margin-top:10px"><label class="lbl">Seasonal Period</label>';
      html+='<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:5px">';
      [4,7,12,24,52].forEach(function(v){
        html+='<button class="btn btn-sm '+(tsPeriod===v?'btn-primary':'btn-ghost')+'" onclick="aState.tsPeriod='+v+';renderASub()">'+v+(v===4?' (Q)':v===7?' (D)':v===12?' (M)':v===24?' (H)':' (W)')+'</button>';
      });
      html+='</div>';
      html+='<div style="margin-top:9px">'+mkCsel('ts-dtype',['additive','multiplicative'],tsDType,'aState.tsDType=val;renderASub()','Model Type')+'</div>';
      html+='<div class="assump" style="margin-top:8px">Additive: Y = T+S+R &nbsp;·&nbsp; Multiplicative: Y = T×S×R.<br>Pilih additive jika amplitudo seasonal konstan.</div>';
    }
    html+='</div>';

    if(tsVals.length>0){
      html+='<div class="card"><div class="sec-hd">Series Statistics</div>';
      html+='<div class="stats-grid2">';
      html+=stCard('N',tsN,'observations');
      html+=stCard('Mean',SE.f4(SE.mean(tsVals)),'');
      html+=stCard('Std Dev',SE.f4(SE.std(tsVals)),'');
      var tsMin=Math.min.apply(null,tsVals),tsMax=Math.max.apply(null,tsVals);
      html+=stCard('Min',SE.f4(tsMin),'');
      html+=stCard('Max',SE.f4(tsMax),'');
      var half2=Math.floor(tsN/2);
      var ts1h=tsVals.slice(0,half2),ts2h=tsVals.slice(half2);
      var std2h=SE.std(ts2h); var vratio=std2h>0?SE.f4(SE.std(ts1h)/std2h):'N/A';
      html+=stCard('Var Ratio',vratio,'1st/2nd half');
      html+='</div>';
      if(tsMod==='arima'&&tsRes&&!tsRes._err){
        html+='<div style="margin-top:10px" class="stats-grid2">';
        html+=stCard('AIC',tsRes.aic,'');
        html+=stCard('BIC',tsRes.bic,'');
        html+=stCard('σ̂',tsRes.sigma,'residual SD');
        html+=stCard('1-step Forecast',tsRes.forecast,'');
        html+='</div>';
        html+='<div style="margin-top:9px;padding:9px 12px;background:rgba(103,232,249,.05);border:1px solid rgba(103,232,249,.2);border-radius:8px;font-size:11.5px;color:rgba(232,222,255,.7)">';
        html+='<b style="color:#67e8f9">ARIMA('+tsP+','+tsD+','+tsQ+')</b><br>';
        if(tsP>0) html+='AR coefs: ['+tsRes.arCoefs.join(', ')+']<br>';
        if(tsQ>0) html+='MA coefs: ['+tsRes.maCoefs.join(', ')+']<br>';
        html+='Forecast: '+tsRes.forecast+' &nbsp;[95% CI: '+tsRes.fc_lo95+' – '+tsRes.fc_hi95+']';
        html+='</div>';
      }
      if(tsMod==='decomp'&&tsRes&&!tsRes._err){
        html+='<div style="margin-top:10px" class="stats-grid2">';
        html+=stCard('Period',tsRes.period,'seasonal');
        html+=stCard('Strength',tsRes.strength,'seasonal');
        html+=stCard('Type',tsRes.type,'model');
        html+=stCard('Rem SD',SE.f4(SE.std(tsRes.remainder.filter(isFinite))),'');
        html+='</div>';
      }
      html+='</div>';
    }

    html+='<button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="runTimeSeries()">▶ Run</button>';
    html+='</div>'; // end left col

    // RIGHT: Charts
    html+='<div>';
    if(tsVals.length>1){
      var svgW=420,svgH=140;
      var vMin=Math.min.apply(null,tsVals),vMax=Math.max.apply(null,tsVals);
      var vRange=vMax-vMin||1;
      var pxFn=function(i){return 28+i*(svgW-40)/(tsVals.length-1);};
      var pyFn=function(v){return svgH-20-(v-vMin)/vRange*(svgH-30);};
      var ptStr=tsVals.map(function(v,i){return pxFn(i)+','+pyFn(v);}).join(' ');
      var svgLine='<svg viewBox="0 0 '+svgW+' '+svgH+'" style="width:100%;height:'+svgH+'px">';
      svgLine+='<defs><linearGradient id="ts-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#67e8f9" stop-opacity=".15"/><stop offset="100%" stop-color="#67e8f9" stop-opacity="0"/></linearGradient></defs>';
      var aPath='M'+pxFn(0)+','+svgH+' '+tsVals.map(function(v,i){return pxFn(i)+','+pyFn(v);}).join(' L')+' L'+pxFn(tsVals.length-1)+','+svgH+' Z';
      svgLine+='<path d="'+aPath+'" fill="url(#ts-grad)"/>';
      svgLine+='<polyline points="'+ptStr+'" fill="none" stroke="#67e8f9" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>';
      if(tsMod==='arima'&&tsRes&&!tsRes._err&&tsRes.origFitted&&tsRes.origFitted.length>0){
        var fitOff=tsP+tsD;
        var fPts=tsRes.origFitted.map(function(v,i){return pxFn(fitOff+i)+','+pyFn(Math.max(vMin-vRange*.05,Math.min(vMax+vRange*.05,v)));}).join(' ');
        svgLine+='<polyline points="'+fPts+'" fill="none" stroke="#f472b6" stroke-width="1.3" stroke-dasharray="3,2" opacity=".8"/>';
      }
      svgLine+='<line x1="28" y1="'+(svgH-1)+'" x2="'+svgW+'" y2="'+(svgH-1)+'" stroke="rgba(255,255,255,.08)"/>';
      svgLine+='<line x1="29" y1="0" x2="29" y2="'+(svgH-1)+'" stroke="rgba(255,255,255,.08)"/>';
      svgLine+='<text x="2" y="14" font-size="9" fill="rgba(232,222,255,.4)" font-family="Inter,sans-serif">'+SE.f4(vMax)+'</text>';
      svgLine+='<text x="2" y="'+(svgH-5)+'" font-size="9" fill="rgba(232,222,255,.4)" font-family="Inter,sans-serif">'+SE.f4(vMin)+'</text>';
      svgLine+='</svg>';
      html+='<div class="card"><div class="sec-hd">Time Series Plot';
      if(tsMod==='arima'&&tsRes&&!tsRes._err) html+=' <span style="font-size:9.5px;color:rgba(232,222,255,.3);font-weight:400">· pink dash = fitted</span>';
      html+='</div>'+svgLine+'</div>';
    }

    if(tsMod==='arima'&&tsRes&&!tsRes._err){
      function svgCorrelogram(acfArr,title,color){
        var W=420,H=90,n2=acfArr.length,barW=Math.min(16,(W-40)/n2);
        var ci=1.96/Math.sqrt(Math.max(tsN,2));
        var sv='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:'+H+'px">';
        sv+='<line x1="20" y1="'+(H/2)+'" x2="'+W+'" y2="'+(H/2)+'" stroke="rgba(255,255,255,.08)"/>';
        var ciY1=(H/2)*(1-ci*1.5),ciY2=(H/2)+(H/2)*ci*1.5;
        sv+='<line x1="20" y1="'+ciY1+'" x2="'+W+'" y2="'+ciY1+'" stroke="rgba(251,191,36,.25)" stroke-dasharray="3,2"/>';
        sv+='<line x1="20" y1="'+ciY2+'" x2="'+W+'" y2="'+ciY2+'" stroke="rgba(251,191,36,.25)" stroke-dasharray="3,2"/>';
        acfArr.forEach(function(v,i){
          var x=25+i*(W-30)/Math.max(n2,1);
          var hgt=Math.abs(v)*(H*0.44);
          var sig=Math.abs(v)>ci;
          var y2=v>=0?(H/2)-hgt:(H/2);
          var h2=hgt||1;
          sv+='<rect x="'+(x-barW/2)+'" y="'+y2+'" width="'+barW+'" height="'+h2+'" rx="2" fill="'+(sig?color:'rgba(255,255,255,.12)')+'"/>';
          sv+='<text x="'+x+'" y="'+(H-2)+'" font-size="8" fill="rgba(232,222,255,.3)" text-anchor="middle" font-family="Inter,sans-serif">'+(i+1)+'</text>';
        });
        sv+='</svg>';
        return '<div class="card" style="margin-top:8px"><div class="sec-hd" style="font-size:11px">'+title+' <span style="float:right;font-size:9px;color:rgba(232,222,255,.3)">dashed = 95% CI</span></div>'+sv+'</div>';
      }
      if(tsRes.acf&&tsRes.acf.length>1) html+=svgCorrelogram(tsRes.acf.slice(1),'ACF — differenced series','#67e8f9');
      if(tsRes.pacf&&tsRes.pacf.length) html+=svgCorrelogram(tsRes.pacf,'PACF — differenced series','#c084fc');
      if(tsRes.residACF&&tsRes.residACF.length>1) html+=svgCorrelogram(tsRes.residACF.slice(1),'Residual ACF — should be near zero','#f472b6');
    }

    if(tsMod==='decomp'&&tsRes&&!tsRes._err){
      function svgDecompLine(arr,title,color,sh){
        var vals=arr.filter(isFinite);
        if(!vals.length) return '';
        var vMin2=Math.min.apply(null,vals),vMax2=Math.max.apply(null,vals),vR=vMax2-vMin2||1;
        var W2=420;
        var px2=function(i){return 28+i*(W2-40)/(arr.length-1);};
        var py2=function(v){return sh-16-(v-vMin2)/vR*(sh-22);};
        var ptArr=arr.map(function(v,i){return isFinite(v)?px2(i)+','+py2(v):null;}).filter(Boolean).join(' ');
        var sv='<svg viewBox="0 0 '+W2+' '+sh+'" style="width:100%;height:'+sh+'px">';
        sv+='<polyline points="'+ptArr+'" fill="none" stroke="'+color+'" stroke-width="1.5" stroke-linecap="round"/>';
        sv+='<line x1="28" y1="'+(sh-1)+'" x2="'+W2+'" y2="'+(sh-1)+'" stroke="rgba(255,255,255,.07)"/>';
        sv+='<text x="2" y="14" font-size="9" fill="rgba(232,222,255,.35)" font-family="Inter,sans-serif">'+SE.f4(vMax2)+'</text>';
        sv+='<text x="2" y="'+(sh-3)+'" font-size="9" fill="rgba(232,222,255,.35)" font-family="Inter,sans-serif">'+SE.f4(vMin2)+'</text>';
        sv+='</svg>';
        return '<div class="card" style="margin-top:8px"><div class="sec-hd" style="font-size:11px;color:'+color+'">'+title+'</div>'+sv+'</div>';
      }
      html+=svgDecompLine(tsRes.trend,'Trend','#67e8f9',80);
      html+=svgDecompLine(tsRes.seasonal,'Seasonal','#c084fc',70);
      html+=svgDecompLine(tsRes.remainder,'Remainder (Residual)','#f472b6',70);
    }

    if(tsRes&&tsRes._err){
      html+='<div class="card"><div style="color:#f87171;font-size:12.5px;padding:12px">'+IC.warn+' '+tsRes._err+'</div></div>';
    }
    if(!tsV||tsVals.length===0){
      html+='<div class="card"><div style="color:#64748b;font-size:12.5px;padding:20px;text-align:center">Pilih variable numerik yang mewakili deret waktu (time-ordered).</div></div>';
    }

    html+='</div>'; // end right col
    html+='</div>'; // end grid2
  }

  // ── META-ANALYSIS ─────────────────────────────────────────────────────────
  else if(currentASub==='metaanalysis'){
    // Initialize state
    if(!aState.metaStudies||!Array.isArray(aState.metaStudies)) aState.metaStudies=[];
    if(!aState.metaModel) aState.metaModel='random';
    if(!aState.metaEffect) aState.metaEffect='d';
    if(!aState.metaNewStudy||typeof aState.metaNewStudy!=='object') aState.metaNewStudy={name:'',yi:'',vi:'',ni:''};

    // Compute meta-analysis
    var metaRes=null;
    if(aState.metaStudies.length>=2){
      try{ metaRes=computeMetaAnalysis(aState.metaStudies,aState.metaModel); }
      catch(e){ metaRes={_err:e.message}; }
    }

    html+='<div class="grid2">';

    // ── LEFT: Input Panel ──
    html+='<div>';
    html+='<div class="card"><div class="sec-hd">Model & Effect Size</div>';
    // Model picker
    var metaModelLabel=aState.metaModel==='random'?'Random-Effects':'Fixed-Effect';
    html+='<div style="margin-bottom:10px">';
    html+=mkCsel('meta-model',['Random-Effects','Fixed-Effect'],metaModelLabel,
      'metaSetModel(val)','Model');
    html+='</div>';
    html+='<div style="font-size:10.5px;color:rgba(232,222,255,.35);margin-bottom:10px;line-height:1.55">';
    html+=aState.metaModel==='random'?'<b style="color:#fb923c">Random-Effects (DerSimonian-Laird):</b> Asumsi effect size berbeda antar studi. Cocok jika ada heterogenitas.':'<b style="color:#fbbf24">Fixed-Effect (Inverse-Variance):</b> Asumsi satu effect size yang sama di semua studi.';
    html+='</div>';
    // Effect type picker
    var metaEffectMap={d:"Cohen's d",r:'Correlation r',or:'Odds Ratio',g:"Hedges' g",other:'Other (yi/vi)'};
    var metaEffectLabel=metaEffectMap[aState.metaEffect]||"Cohen's d";
    var metaEffectOpts=["Cohen's d",'Correlation r','Odds Ratio',"Hedges' g",'Other (yi/vi)'];
    html+=mkCsel('meta-effect',metaEffectOpts,metaEffectLabel,'metaSetEffect(val)','Effect Size');
    html+='</div>';

    // ── Add Study ──
    html+='<div class="card"><div class="sec-hd">Tambah Studi</div>';
    html+='<div style="display:flex;flex-direction:column;gap:6px">';
    html+='<input class="inp" id="ma-name" placeholder="Nama studi (cth: Smith 2020)" value="'+(aState.metaNewStudy.name||'')+'" oninput="aState.metaNewStudy.name=this.value" style="font-size:12px"/>';
    html+='<div style="display:flex;gap:6px">';

    var eLab=aState.metaEffect==='d'?"Cohen's d":aState.metaEffect==='r'?'r':aState.metaEffect==='or'?'ln(OR)':aState.metaEffect==='g'?"Hedges' g":'Effect (yi)';
    html+='<input class="inp" id="ma-yi" type="number" step="any" placeholder="'+eLab+'" value="'+(aState.metaNewStudy.yi||'')+'" oninput="aState.metaNewStudy.yi=this.value" style="flex:1;font-size:12px"/>';
    html+='<input class="inp" id="ma-vi" type="number" step="any" placeholder="Variance (vi)" value="'+(aState.metaNewStudy.vi||'')+'" oninput="aState.metaNewStudy.vi=this.value" style="flex:1;font-size:12px"/>';
    html+='<input class="inp" id="ma-ni" type="number" step="1" min="2" placeholder="N" value="'+(aState.metaNewStudy.ni||'')+'" oninput="aState.metaNewStudy.ni=this.value" style="flex:1;font-size:12px"/>';
    html+='</div>';
    html+='<div style="display:flex;gap:6px">';
    html+='<button class="btn btn-primary btn-sm" onclick="metaAddStudy()" style="flex:1">+ Tambah Studi</button>';
    html+='<button class="btn btn-sm" onclick="metaLoadExample()" style="flex:1;background:rgba(124,58,237,.12);border-color:rgba(124,58,237,.3);color:#c084fc">Load Contoh</button>';
    html+='</div>';
    html+='<div style="font-size:10px;color:rgba(232,222,255,.3);line-height:1.5">vi = variance effect size = (SE)². Jika punya SE: vi = SE². Jika punya n & SD: vi ≈ 4/n (untuk d).</div>';
    html+='</div></div>';

    // ── Study List ──
    html+='<div class="card"><div class="sec-hd">Daftar Studi ('+aState.metaStudies.length+')</div>';
    if(!aState.metaStudies.length){
      html+='<div class="chart-empty" style="padding:18px 0">Belum ada studi. Tambah minimal 2 studi untuk analisis.</div>';
    } else {
      html+='<div class="tbl-wrap"><table><thead><tr><th>Studi</th><th>yi</th><th>vi</th><th>N</th><th></th></tr></thead><tbody>';
      aState.metaStudies.forEach(function(s,i){
        html+='<tr><td class="td-label" style="max-width:120px;overflow:hidden;text-overflow:ellipsis">'+s.name+'</td>';
        html+='<td class="td-num">'+parseFloat(s.yi).toFixed(3)+'</td>';
        html+='<td class="td-num">'+parseFloat(s.vi).toFixed(4)+'</td>';
        html+='<td class="td-num">'+(s.ni||'—')+'</td>';
        html+='<td><button onclick="metaRemoveStudy('+i+')" style="background:rgba(248,113,113,.12);border:1px solid rgba(248,113,113,.25);color:#f87171;border-radius:5px;padding:2px 8px;font-size:10.5px;cursor:pointer">✕</button></td>';
        html+='</tr>';
      });
      html+='</tbody></table></div>';
      html+='<div style="display:flex;gap:5px;margin-top:8px">';
      html+='<button class="btn btn-primary btn-sm" onclick="runMetaAnalysis()" style="flex:1">▶ Run</button>';
      html+='<button class="btn btn-sm" onclick="aState.metaStudies=[];renderASub()" style="background:rgba(248,113,113,.08);border-color:rgba(248,113,113,.2);color:#f87171">Clear All</button>';
      html+='</div>';
    }
    html+='</div>'; // end study list card
    html+='</div>'; // end left col

    // ── RIGHT: Live Results + Plots ──
    html+='<div>';
    if(aState.metaStudies.length<2){
      html+='<div class="card"><div class="chart-empty" style="padding:40px 0;flex-direction:column;gap:10px"><div>Tambah minimal 2 studi untuk melihat hasil meta-analisis.</div></div></div>';
    } else if(metaRes&&metaRes._err){
      html+='<div class="card"><div style="color:#f87171;font-size:12.5px;padding:12px">⚠ '+metaRes._err+'</div></div>';
    } else if(metaRes){
      // Summary stats
      html+='<div class="card"><div class="sec-hd">Pooled Effect Size</div>';
      html+='<div class="stats-grid2">';
      var psig=metaRes.p<0.05;
      html+=stCard('Pooled '+metaRes.effectLabel,metaRes.pooledEffect,'SE = '+metaRes.se);
      html+=stCard('95% CI','['+metaRes.ci_lo+', '+metaRes.ci_hi+']','');
      html+=stCard('z-score',metaRes.z,'p = '+metaRes.p_fmt);
      html+=stCard('p-value',metaRes.p_fmt,psig?'Signifikan ✓':'Tidak sig ✗');
      html+='</div>';
      html+='<div style="margin-top:8px;padding:8px 11px;border-radius:7px;background:rgba('+(psig?'5,150,105':'248,113,113')+',.08);border:1px solid rgba('+(psig?'5,150,105':'248,113,113')+',.2);font-size:11.5px;color:'+(psig?'#34d399':'#f87171')+'"><b>'+(psig?'✓ Efek signifikan':'✗ Efek tidak signifikan')+'</b> — Pooled '+metaRes.effectLabel+' = '+metaRes.pooledEffect+' '+metaRes.ci_label+' ['+metaRes.ci_lo+', '+metaRes.ci_hi+'], z = '+metaRes.z+', p = '+metaRes.p_fmt+'</div>';
      html+='</div>';

      // Heterogeneity
      html+='<div class="card"><div class="sec-hd">Heterogenitas</div>';
      html+='<div class="stats-grid2">';
      html+=stCard('Q statistic',metaRes.Q,'df = '+(aState.metaStudies.length-1)+', p = '+metaRes.Q_p_fmt);
      html+=stCard('I²',metaRes.I2+'%',metaRes.I2label);
      html+=stCard('τ² (tau²)',metaRes.tau2,'Between-study variance');
      html+=stCard('τ (tau)',metaRes.tau,'SD between studies');
      html+='</div>';
      var hColor=metaRes.I2raw<25?'#34d399':metaRes.I2raw<50?'#fbbf24':metaRes.I2raw<75?'#fb923c':'#f87171';
      html+='<div style="margin-top:8px;padding:8px 11px;border-radius:7px;background:rgba(124,58,237,.06);border:1px solid rgba(124,58,237,.15);font-size:11px;color:rgba(232,222,255,.6);line-height:1.6">';
      html+='<b style="color:'+hColor+'">'+metaRes.I2label+'</b> — ';
      html+='Q('+( aState.metaStudies.length-1)+') = '+metaRes.Q+', p = '+metaRes.Q_p_fmt+'. ';
      html+=metaRes.I2raw<25?'Heterogenitas rendah; studi cukup homogen.':metaRes.I2raw<50?'Heterogenitas sedang; ada variasi antar studi.':metaRes.I2raw<75?'Heterogenitas substansial; pertimbangkan analisis moderator.':'Heterogenitas tinggi; hasil hati-hati diinterpretasi.';
      html+='</div></div>';

      // Forest Plot
      html+='<div class="card"><div class="sec-hd">Forest Plot</div>';
      html+=svgMetaForestPlot(aState.metaStudies,metaRes,aState.metaEffect);
      html+='</div>';

      // Funnel Plot
      html+='<div class="card"><div class="sec-hd">Funnel Plot <span style="font-size:10px;font-weight:400;color:rgba(232,222,255,.3)">(uji publication bias)</span></div>';
      html+=svgFunnelPlot(aState.metaStudies,metaRes);
      html+='<div style="font-size:10.5px;color:rgba(232,222,255,.35);margin-top:6px;line-height:1.55">Funnel plot simetris → tidak ada publication bias. Asimetri → kemungkinan ada bias. Gunakan Egger\'s test untuk konfirmasi.</div>';
      html+='</div>';
    }
    html+='</div>'; // end right col
    html+='</div>'; // end grid2
  }

  el.innerHTML=html;
}


// ════════════════════════════════════════════════════════════════════════
// RUN ANALYSIS FUNCTIONS
// ════════════════════════════════════════════════════════════════════════

// ── Forest Plot SVG ─────────────────────────────────────────────────────
function svgMetaForestPlot(studies, res, effectType){
  var k=studies.length;
  var sd=res.studyData;
  var rowH=22,padT=30,padB=50,padL=130,padR=120;
  var W=520,H=padT+k*rowH+rowH*2+padB;
  var cw=W-padL-padR;
  var ch=H-padT-padB;

  // Determine x scale
  var allVals=sd.reduce(function(a,s){return a.concat([s.ci_lo,s.ci_hi,s.yi]);},[ res.ci_lo,res.ci_hi,res.pooledEffect]);
  var xMin=Math.min.apply(null,allVals),xMax=Math.max.apply(null,allVals);
  var xRange=xMax-xMin||1;
  var xPad=xRange*0.2;
  xMin-=xPad; xMax+=xPad;
  function tx(v){return padL+((v-xMin)/(xMax-xMin))*cw;}
  var x0=tx(0);

  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;max-height:'+Math.min(H,420)+'px;overflow:visible">';
  svg+='<defs><marker id="fp-arrow" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z" fill="#64748b" opacity=".5"/></marker></defs>';

  // Background grid
  for(var xi=-2;xi<=2;xi+=0.5){
    var gx=tx(xi);
    if(gx<padL||gx>padL+cw) continue;
    svg+='<line x1="'+gx+'" y1="'+padT+'" x2="'+gx+'" y2="'+(H-padB)+'" stroke="rgba(255,255,255,.05)" stroke-width="1"/>';
    svg+='<text x="'+gx+'" y="'+(H-padB+14)+'" text-anchor="middle" font-size="8.5" fill="rgba(232,222,255,.3)" font-family="Inter,sans-serif">'+xi+'</text>';
  }

  // Null line
  if(x0>=padL&&x0<=padL+cw){
    svg+='<line x1="'+x0+'" y1="'+padT+'" x2="'+x0+'" y2="'+(H-padB)+'" stroke="rgba(248,113,113,.3)" stroke-width="1.2" stroke-dasharray="4,3"/>';
  }

  // Header
  svg+='<text x="4" y="'+(padT-10)+'" font-size="9" font-weight="700" fill="rgba(232,222,255,.4)" font-family="Inter,sans-serif">Study</text>';
  svg+='<text x="'+(padL+cw+5)+'" y="'+(padT-10)+'" font-size="9" font-weight="700" fill="rgba(232,222,255,.4)" font-family="Inter,sans-serif">yi [95% CI]</text>';
  svg+='<text x="'+(padL+cw+100)+'" y="'+(padT-10)+'" font-size="9" font-weight="700" fill="rgba(232,222,255,.4)" font-family="Inter,sans-serif">W%</text>';

  // Study rows
  sd.forEach(function(s,i){
    var y=padT+i*rowH+rowH/2;
    var cx2=tx(s.yi);
    var lo=tx(s.ci_lo),hi=tx(s.ci_hi);
    var sqSize=Math.max(3,Math.min(9,2+s.weight/8));

    // Row bg on hover (alternating)
    if(i%2===0) svg+='<rect x="0" y="'+(y-rowH/2)+'" width="'+W+'" height="'+rowH+'" fill="rgba(255,255,255,.015)" rx="0"/>';

    // CI line
    svg+='<line x1="'+lo+'" y1="'+y+'" x2="'+hi+'" y2="'+y+'" stroke="#fb923c" stroke-width="1.5" opacity="0.7"/>';
    // End caps
    svg+='<line x1="'+lo+'" y1="'+(y-4)+'" x2="'+lo+'" y2="'+(y+4)+'" stroke="#fb923c" stroke-width="1.5" opacity="0.7"/>';
    svg+='<line x1="'+hi+'" y1="'+(y-4)+'" x2="'+hi+'" y2="'+(y+4)+'" stroke="#fb923c" stroke-width="1.5" opacity="0.7"/>';
    // Square (weight-proportional)
    svg+='<rect x="'+(cx2-sqSize/2)+'" y="'+(y-sqSize/2)+'" width="'+sqSize+'" height="'+sqSize+'" fill="#fb923c" opacity="0.9"/>';

    // Labels
    var nameShort=s.name.length>18?s.name.slice(0,16)+'…':s.name;
    svg+='<text x="'+(padL-6)+'" y="'+(y+3.5)+'" text-anchor="end" font-size="9" fill="rgba(232,222,255,.65)" font-family="Inter,sans-serif">'+escHtml(nameShort)+'</text>';
    svg+='<text x="'+(padL+cw+5)+'" y="'+(y+3.5)+'" font-size="8.5" fill="rgba(232,222,255,.55)" font-family="Inter,sans-serif">'+s.yi.toFixed(3)+' ['+s.ci_lo+', '+s.ci_hi+']</text>';
    svg+='<text x="'+(padL+cw+108)+'" y="'+(y+3.5)+'" font-size="8.5" fill="rgba(232,222,255,.4)" font-family="Inter,sans-serif">'+s.weight.toFixed(1)+'%</text>';
  });

  // Pooled diamond
  var py=padT+k*rowH+rowH*0.7;
  var px=tx(res.pooledEffect);
  var pl=tx(res.ci_lo),pr2=tx(res.ci_hi);
  var dh=8;
  svg+='<line x1="'+padL+'" y1="'+py+'" x2="'+(padL+cw)+'" y2="'+py+'" stroke="rgba(255,255,255,.08)" stroke-width="1"/>';
  svg+='<text x="'+(padL-6)+'" y="'+(py+4)+'" text-anchor="end" font-size="9" font-weight="700" fill="#fbbf24" font-family="Inter,sans-serif">'+(res.model==='fixed'?'FE':'RE')+' Summary</text>';
  svg+='<polygon points="'+px+','+(py-dh)+' '+pr2+','+py+' '+px+','+(py+dh)+' '+pl+','+py+'" fill="#fbbf24" opacity="0.9"/>';
  svg+='<text x="'+(padL+cw+5)+'" y="'+(py+4)+'" font-size="9" font-weight="700" fill="#fbbf24" font-family="Inter,sans-serif">'+res.pooledEffect+' ['+res.ci_lo+', '+res.ci_hi+']</text>';

  // X-axis
  svg+='<line x1="'+padL+'" y1="'+(H-padB)+'" x2="'+(padL+cw)+'" y2="'+(H-padB)+'" stroke="rgba(255,255,255,.15)" stroke-width="1"/>';
  svg+='<text x="'+tx(0)+'" y="'+(H-padB+28)+'" text-anchor="middle" font-size="9.5" fill="rgba(232,222,255,.4)" font-family="Inter,sans-serif">Effect Size ('+effectType+')</text>';

  svg+='</svg>';
  return svg;
}

// ── Funnel Plot SVG ─────────────────────────────────────────────────────
function svgFunnelPlot(studies, res){
  var sd=res.studyData;
  var W=420,H=220,padL=45,padR=20,padT=20,padB=40;
  var cw=W-padL-padR,ch=H-padT-padB;

  var seArr=sd.map(function(s){return Math.sqrt(s.vi);});
  var maxSE=Math.max.apply(null,seArr)*1.15;
  var mu=res.pooledEffect;

  var allX=sd.map(function(s){return s.yi;}).concat([mu-1.96*maxSE,mu+1.96*maxSE]);
  var xMin=Math.min.apply(null,allX),xMax=Math.max.apply(null,allX);
  var xRange=xMax-xMin||1;
  xMin-=xRange*0.1; xMax+=xRange*0.1;

  function tx(v){return padL+((v-xMin)/(xMax-xMin))*cw;}
  function ty(se){return padT+((se/maxSE))*ch;}  // SE axis goes down

  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:'+H+'px">';

  // Funnel lines (95% CI boundary)
  var seSteps=20;
  var fL=[],fR=[];
  for(var si=0;si<=seSteps;si++){
    var se=maxSE*si/seSteps;
    var xl=mu-1.96*se, xr=mu+1.96*se;
    var y=ty(se);
    fL.push(tx(xl)+','+y);
    fR.push(tx(xr)+','+y);
  }
  svg+='<polyline points="'+fL.join(' ')+'" fill="none" stroke="rgba(251,191,36,.2)" stroke-width="1.5" stroke-dasharray="4,3"/>';
  svg+='<polyline points="'+fR.join(' ')+'" fill="none" stroke="rgba(251,191,36,.2)" stroke-width="1.5" stroke-dasharray="4,3"/>';

  // Center line
  svg+='<line x1="'+tx(mu)+'" y1="'+padT+'" x2="'+tx(mu)+'" y2="'+(H-padB)+'" stroke="rgba(251,146,60,.5)" stroke-width="1.5" stroke-dasharray="5,3"/>';

  // Grid
  for(var gi=0;gi<=4;gi++){
    var gse=maxSE*gi/4;
    var gy=ty(gse);
    svg+='<line x1="'+padL+'" y1="'+gy+'" x2="'+(padL+cw)+'" y2="'+gy+'" stroke="rgba(255,255,255,.04)" stroke-width="1"/>';
    svg+='<text x="'+(padL-4)+'" y="'+(gy+3)+'" text-anchor="end" font-size="8" fill="rgba(232,222,255,.3)" font-family="Inter,sans-serif">'+gse.toFixed(2)+'</text>';
  }

  // Study points
  sd.forEach(function(s){
    var sx=tx(s.yi), sy=ty(Math.sqrt(s.vi));
    svg+='<circle cx="'+sx+'" cy="'+sy+'" r="5" fill="rgba(251,146,60,.7)" stroke="rgba(251,146,60,.4)" stroke-width="1"/>';
  });

  // Axes
  svg+='<line x1="'+padL+'" y1="'+padT+'" x2="'+padL+'" y2="'+(H-padB)+'" stroke="rgba(255,255,255,.15)" stroke-width="1"/>';
  svg+='<line x1="'+padL+'" y1="'+(H-padB)+'" x2="'+(padL+cw)+'" y2="'+(H-padB)+'" stroke="rgba(255,255,255,.15)" stroke-width="1"/>';

  // X tick labels
  [-2,-1,0,1,2].forEach(function(v){
    var gx=tx(mu+v*(xMax-xMin)/6);
    if(gx<padL||gx>padL+cw) return;
    svg+='<text x="'+gx+'" y="'+(H-padB+14)+'" text-anchor="middle" font-size="8" fill="rgba(232,222,255,.3)" font-family="Inter,sans-serif">'+(mu+v*(xMax-xMin)/6).toFixed(2)+'</text>';
  });

  // Labels
  svg+='<text x="'+(padL+cw/2)+'" y="'+H+'" text-anchor="middle" font-size="9" fill="rgba(232,222,255,.4)" font-family="Inter,sans-serif">Effect Size</text>';
  svg+='<text x="10" y="'+(padT+ch/2)+'" text-anchor="middle" font-size="8.5" fill="rgba(232,222,255,.3)" font-family="Inter,sans-serif" transform="rotate(-90,10,'+(padT+ch/2)+')">SE</text>';

  svg+='</svg>';
  return svg;
}

// ── Meta-Analysis State Helpers ─────────────────────────────────────────
function metaSetModel(val){
  aState.metaModel=(val==='Random-Effects'?'random':'fixed');
  renderASub();
}
function metaSetEffect(val){
  var m={"Cohen's d":'d','Correlation r':'r','Odds Ratio':'or',"Hedges' g":'g','Other (yi/vi)':'other'};
  aState.metaEffect=m[val]||'d';
  renderASub();
}
function metaAddStudy(){
  var ns=aState.metaNewStudy||{};
  var name=(ns.name||'').trim()||('Study '+(aState.metaStudies.length+1));
  var yi=parseFloat(ns.yi);
  var vi=parseFloat(ns.vi);
  var ni=parseInt(ns.ni)||null;
  if(isNaN(yi)){showToast('Effect size (yi) harus diisi','error');return;}
  if(isNaN(vi)||vi<=0){showToast('Variance (vi) harus > 0','error');return;}
  aState.metaStudies.push({name:name,yi:yi,vi:vi,ni:ni});
  aState.metaNewStudy={name:'',yi:'',vi:'',ni:''};
  renderASub();
  showToast('Studi berhasil ditambahkan');
}

function metaRemoveStudy(i){
  aState.metaStudies.splice(i,1);
  renderASub();
}

function metaLoadExample(){
  // Classic example: Glass (1981) meta-analysis example (synthetic)
  aState.metaStudies=[
    {name:'Borenstein 2010 (A)',yi:0.56,vi:0.042,ni:48},
    {name:'Borenstein 2010 (B)',yi:0.78,vi:0.058,ni:36},
    {name:'Smith & Glass 1981',yi:0.42,vi:0.031,ni:60},
    {name:'Rosenthal 1983',yi:0.65,vi:0.049,ni:52},
    {name:'Hunter & Schmidt',yi:0.35,vi:0.025,ni:80},
    {name:'Lipsey & Wilson',yi:0.71,vi:0.063,ni:32},
    {name:'Hedges 1985',yi:0.48,vi:0.038,ni:55}
  ];
  aState.metaEffect='d';
  renderASub();
  showToast('Data berhasil dimuat');
}

function runMetaAnalysis(){
  runSafe(function(){
    if(!aState.metaStudies||aState.metaStudies.length<2) throw new Error('Minimal 2 studi diperlukan');
    var res=computeMetaAnalysis(aState.metaStudies,aState.metaModel);
    var title='Meta-Analysis ('+aState.metaModel+', k='+aState.metaStudies.length+'): '+res.effectLabel+'='+res.pooledEffect+' ['+res.ci_lo+', '+res.ci_hi+']';
    addOutput({
      type:'metaanalysis',
      title:title,
      res:res,
      studies:JSON.parse(JSON.stringify(aState.metaStudies)),
      model:aState.metaModel,
      effectType:aState.metaEffect
    });
    showToast('Meta-Analysis berhasil');
  },'Meta-Analysis');
}

// ── Mediation path diagram SVG ──────────────────────────────────────────
function svgMediationPath(xName,mNames,yName,preview){
  var W=420,H=mNames&&mNames.length>1?160:120;
  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;max-width:420px;height:auto;display:inline-block">';
  var cx=W/2,xc=50,yc=W-50,mc=cx;
  var mCount=mNames?mNames.length:1;
  var yBase=H-30;

  // Draw X node
  svg+='<rect x="10" y="'+(yBase-16)+'" width="76" height="28" rx="8" fill="rgba(251,146,60,.15)" stroke="rgba(251,146,60,.5)" stroke-width="1.5"/>';
  svg+='<text x="48" y="'+(yBase+5)+'" text-anchor="middle" font-size="11" font-weight="700" fill="#fb923c">'+xName.slice(0,8)+'</text>';
  // Draw Y node
  svg+='<rect x="'+(W-86)+'" y="'+(yBase-16)+'" width="76" height="28" rx="8" fill="rgba(103,232,249,.12)" stroke="rgba(103,232,249,.45)" stroke-width="1.5"/>';
  svg+='<text x="'+(W-48)+'" y="'+(yBase+5)+'" text-anchor="middle" font-size="11" font-weight="700" fill="#67e8f9">'+yName.slice(0,8)+'</text>';

  // Direct effect arrow X→Y (dashed = c')
  var c_prime=preview&&preview.barronKenny?preview.barronKenny.c_prime:'';
  var directSig=preview&&preview.barronKenny?parseFloat(preview.barronKenny.p_c_prime)<0.05:true;
  svg+='<line x1="86" y1="'+yBase+'" x2="'+(W-86)+'" y2="'+yBase+'" stroke="'+(directSig?'#67e8f9':'rgba(100,116,139,.6)')+'" stroke-width="1.8" stroke-dasharray="'+(directSig?'0':'5,3')+'"/>';
  svg+='<polygon points="'+(W-86)+','+yBase+' '+(W-92)+','+(yBase-4)+' '+(W-92)+','+(yBase+4)+'" fill="'+(directSig?'#67e8f9':'rgba(100,116,139,.6)')+'"/>';
  if(c_prime) svg+='<text x="'+cx+'" y="'+(yBase-6)+'" text-anchor="middle" font-size="9" fill="rgba(232,222,255,.45)">c\'='+c_prime+'</text>';

  // Draw mediators
  if(mNames&&mNames.length>0){
    var mSpacing=mCount>1?Math.min(80,(W-120)/(mCount)):0;
    var mStartX=cx-(mSpacing*(mCount-1)/2);
    var mY=22;
    mNames.forEach(function(mName,i){
      var mx=mStartX+i*mSpacing;
      // M box
      svg+='<rect x="'+(mx-38)+'" y="'+(mY-16)+'" width="76" height="28" rx="8" fill="rgba(244,114,182,.12)" stroke="rgba(244,114,182,.4)" stroke-width="1.5"/>';
      svg+='<text x="'+mx+'" y="'+(mY+5)+'" text-anchor="middle" font-size="10" font-weight="700" fill="#f472b6">'+mName.slice(0,8)+'</text>';
      // a: X→M
      var aSig=preview&&preview.barronKenny?parseFloat(preview.barronKenny.p_a)<0.05:true;
      svg+='<line x1="72" y1="'+(yBase-16)+'" x2="'+(mx-10)+'" y2="'+(mY+12)+'" stroke="'+(aSig?'#fb923c':'rgba(100,116,139,.5)')+'" stroke-width="1.5"/>';
      if(preview&&preview.barronKenny) svg+='<text x="'+(72+(mx-10))/2+'" y="'+(yBase/2)+'" font-size="8.5" fill="rgba(251,146,60,.7)">a='+preview.barronKenny.a+'</text>';
      // b: M→Y
      var bSig=preview&&preview.barronKenny?parseFloat(preview.barronKenny.p_b)<0.05:true;
      svg+='<line x1="'+(mx+10)+'" y1="'+(mY+12)+'" x2="'+(W-86)+'" y2="'+(yBase-16)+'" stroke="'+(bSig?'#f472b6':'rgba(100,116,139,.5)')+'" stroke-width="1.5"/>';
      if(preview&&preview.barronKenny) svg+='<text x="'+(mx+10+(W-86))/2+'" y="'+(yBase/2)+'" font-size="8.5" fill="rgba(244,114,182,.7)">b='+preview.barronKenny.b+'</text>';
    });
  }
  svg+='</svg>';
  return svg;
}

function toggleModCov(f,checked){
  if(!aState.modCovs) aState.modCovs=[];
  if(checked){if(!aState.modCovs.includes(f))aState.modCovs.push(f);}
  else aState.modCovs=aState.modCovs.filter(function(x){return x!==f;});
  renderASub();
}

// SE helper for fInv (add to SE if missing)
if(!SE.fInv){
  SE.fInv=function(p,df1,df2){
    // Simple Newton iteration on fCDF for F quantile
    var x=1.0;
    for(var i=0;i<50;i++){
      var fx=SE.fP?1-SE.fP(x,df1,df2):0.5;
      if(Math.abs(fx-p)<1e-7) break;
      x*=fx>p?0.9:1.1;
    }
    return x;
  };
}
if(!SE.fCritApprox){
  SE.fCritApprox=function(p,df1,df2){
    // Wilson-Hilferty approximation for F critical value
    var z=SE.normInv(p);
    var c1=df1,c2=df2;
    var k1=2/9/c1, k2=2/9/c2;
    var x=Math.pow(1-k2+z*Math.sqrt(k2),3)/(1-k1);
    return Math.max(0.01,x);
  };
}
if(!SE.chiCritApprox){
  SE.chiCritApprox=function(p,df){
    var z=SE.normInv(p);
    var k=2/9/df;
    return Math.max(0,df*Math.pow(1-k+z*Math.sqrt(k),3));
  };
}

function svgPowerCurve(test,alpha,tails,W,H){
  W=W||420; H=H||220;
  var effectSets={
    'ttest_2samp':[[0.2,'Small'],[0.5,'Medium'],[0.8,'Large']],
    'ttest_1samp':[[0.2,'Small'],[0.5,'Medium'],[0.8,'Large']],
    'ttest_paired':[[0.2,'Small'],[0.5,'Medium'],[0.8,'Large']],
    'anova_oneway':[[0.10,'Small'],[0.25,'Medium'],[0.40,'Large']],
    'correlation':[[0.10,'Small'],[0.30,'Medium'],[0.50,'Large']],
    'regression_r2':[[0.02,'Small'],[0.15,'Medium'],[0.35,'Large']],
    'chisq':[[0.10,'Small'],[0.30,'Medium'],[0.50,'Large']]
  };
  var effs=effectSets[test]||effectSets['ttest_2samp'];
  var Ns=[]; for(var n=5;n<=200;n+=5) Ns.push(n);
  var P={l:38,r:16,t:14,b:42};
  var cw=W-P.l-P.r, ch=H-P.t-P.b;
  var colors=['#f472b6','#fbbf24','#34d399'];
  var xMin=Ns[0],xMax=Ns[Ns.length-1];
  function tx(n){return P.l+(n-xMin)/(xMax-xMin)*cw;}
  function ty(p){return P.t+ch*(1-p);}

  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block">';
  svg+='<defs>';
  for(var ci=0;ci<3;ci++) svg+='<linearGradient id="pwGrad'+ci+'" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="'+colors[ci]+'" stop-opacity="0.5"/><stop offset="100%" stop-color="'+colors[ci]+'" stop-opacity="1"/></linearGradient>';
  svg+='</defs>';

  // Grid
  [0.5,0.7,0.8,0.9,1.0].forEach(function(p){
    var y=ty(p);
    svg+='<line x1="'+P.l+'" x2="'+(P.l+cw)+'" y1="'+y+'" y2="'+y+'" stroke="rgba(255,255,255,'+(p===0.8?'.15':'.05')+')" stroke-width="'+(p===0.8?1.5:1)+'"/>';
    svg+='<text x="'+(P.l-4)+'" y="'+(y+4)+'" text-anchor="end" font-size="8" fill="#64748b">'+SE.f4(p)+'</text>';
    if(p===0.8) svg+='<text x="'+(P.l+cw+2)+'" y="'+(y+4)+'" font-size="8" fill="rgba(251,191,36,.8)">0.80</text>';
  });
  // Reference line at 0.80
  var y80=ty(0.80);
  svg+='<line x1="'+P.l+'" x2="'+(P.l+cw)+'" y1="'+y80+'" y2="'+y80+'" stroke="rgba(251,191,36,.6)" stroke-width="1.5" stroke-dasharray="5,3"/>';

  // Curves
  effs.forEach(function(ef,idx){
    var pts=Ns.map(function(n){
      try{var r=computePower(test,alpha,(aState.pwPower||0.8),ef[0],2,tails,'power',n);return{x:tx(n),y:ty(Math.min(1,parseFloat(r.power)||0))};} catch{return null;}
    }).filter(Boolean);
    if(pts.length<2) return;
    var d=pts.map(function(p,i){return (i===0?'M':'L')+p.x+' '+p.y;}).join('');
    svg+='<path d="'+d+'" fill="none" stroke="'+colors[idx]+'" stroke-width="2.2" opacity="0.9" stroke-linecap="round" stroke-linejoin="round"/>';
    // Label
    var last=pts[pts.length-1];
    svg+='<text x="'+(last.x+3)+'" y="'+(last.y+4)+'" font-size="9" fill="'+colors[idx]+'">'+ef[1]+'</text>';
  });

  // Axes
  svg+='<line x1="'+P.l+'" y1="'+P.t+'" x2="'+P.l+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.2)" stroke-width="1.2"/>';
  svg+='<line x1="'+P.l+'" y1="'+(P.t+ch)+'" x2="'+(P.l+cw)+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.2)" stroke-width="1.2"/>';
  // X labels
  [10,50,100,150,200].forEach(function(n){svg+='<text x="'+tx(n)+'" y="'+(H-P.b+14)+'" text-anchor="middle" font-size="8.5" fill="#64748b">'+n+'</text>';});
  svg+='<text x="'+(P.l+cw/2)+'" y="'+H+'" text-anchor="middle" font-size="9" fill="#475569">N per group</text>';
  svg+='<text x="12" y="'+(P.t+ch/2)+'" text-anchor="middle" font-size="9" fill="#475569" transform="rotate(-90,12,'+(P.t+ch/2)+')">Power</text>';
  return svg+'</svg>';
}

function svgSensitivityCurve(test,alpha,power,tails,nHighlight,W,H){
  W=W||420; H=H||180;
  var Ns=[]; for(var n=5;n<=300;n+=5) Ns.push(n);
  var P={l:40,r:16,t:14,b:40};
  var cw=W-P.l-P.r, ch=H-P.t-P.b;
  var xMin=Ns[0],xMax=Ns[Ns.length-1];
  function tx(n){return P.l+(n-xMin)/(xMax-xMin)*cw;}
  var allEffs=Ns.map(function(n){try{var r=computePower(test,alpha,power,null,2,tails,'effect',n);return parseFloat(r.effect)||null;}catch{return null;}});
  var validEffs=allEffs.filter(Boolean);
  if(!validEffs.length) return '';
  var eMin=Math.min.apply(null,validEffs),eMax=Math.max.apply(null,validEffs);
  var eRange=eMax-eMin||1;
  function ty(e){return P.t+ch*(1-(e-eMin)/eRange);}

  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;margin-top:12px;display:block">';
  // Grid
  [eMin,eMin+eRange/2,eMax].forEach(function(e){
    var y=ty(e);
    svg+='<line x1="'+P.l+'" x2="'+(P.l+cw)+'" y1="'+y+'" y2="'+y+'" stroke="rgba(255,255,255,.05)" stroke-width="1"/>';
    svg+='<text x="'+(P.l-4)+'" y="'+(y+4)+'" text-anchor="end" font-size="8" fill="#64748b">'+SE.f4(e)+'</text>';
  });
  // Curve
  var pts=Ns.map(function(n,i){var e=allEffs[i];return e?{x:tx(n),y:ty(e)}:null;}).filter(Boolean);
  if(pts.length>=2){
    var d=pts.map(function(p,i){return (i===0?'M':'L')+p.x+' '+p.y;}).join('');
    svg+='<path d="'+d+'" fill="none" stroke="#c084fc" stroke-width="2" opacity="0.9" stroke-linecap="round"/>';
    // Highlight current N
    if(nHighlight&&nHighlight>=Ns[0]&&nHighlight<=Ns[Ns.length-1]){
      var ni=Math.round((nHighlight-Ns[0])/5);
      if(ni>=0&&ni<allEffs.length&&allEffs[ni]){
        var hx=tx(nHighlight),hy=ty(allEffs[ni]);
        svg+='<line x1="'+hx+'" y1="'+P.t+'" x2="'+hx+'" y2="'+(P.t+ch)+'" stroke="#f472b6" stroke-width="1.2" stroke-dasharray="4,3"/>';
        svg+='<circle cx="'+hx+'" cy="'+hy+'" r="5" fill="#f472b6" opacity="0.9"/>';
        svg+='<text x="'+(hx+6)+'" y="'+(hy-4)+'" font-size="9" fill="#f472b6">N='+nHighlight+'</text>';
      }
    }
  }
  svg+='<line x1="'+P.l+'" y1="'+P.t+'" x2="'+P.l+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.2)" stroke-width="1.2"/>';
  svg+='<line x1="'+P.l+'" y1="'+(P.t+ch)+'" x2="'+(P.l+cw)+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.2)" stroke-width="1.2"/>';
  [20,50,100,200,300].forEach(function(n){if(n<=Ns[Ns.length-1]) svg+='<text x="'+tx(n)+'" y="'+(H-P.b+14)+'" text-anchor="middle" font-size="8.5" fill="#64748b">'+n+'</text>';});
  svg+='<text x="'+(P.l+cw/2)+'" y="'+H+'" text-anchor="middle" font-size="9" fill="#475569">N per group</text>';
  svg+='<text x="12" y="'+(P.t+ch/2)+'" text-anchor="middle" font-size="9" fill="#475569" transform="rotate(-90,12,'+(P.t+ch/2)+')">Min Det. Effect</text>';
  return svg+'</svg>';
}

function runPowerAnalysis(){
  runSafe(function(){
    var pw=aState;
    var res=computePower(pw.pwTest||'ttest_2samp',parseFloat(pw.pwAlpha)||0.05,parseFloat(pw.pwPower)||0.80,parseFloat(pw.pwEffect)||0.5,parseInt(pw.pwGroups||2),parseInt(pw.pwTails||2),pw.pwSolve||'n',parseInt(pw.pwN||30));
    var testLabels3={'ttest_2samp':'Independent T-Test','ttest_1samp':'One-Sample T-Test','ttest_paired':'Paired T-Test','anova_oneway':'One-Way ANOVA','correlation':'Correlation','regression_r2':'Multiple Regression','chisq':'Chi-Square'};
    var title='Power Analysis ('+testLabels3[pw.pwTest||'ttest_2samp']+'): N='+res.n+', power='+SE.f4(res.power*100)+'%, d/f/r='+SE.f4(res.effect);
    addOutput({type:'poweranalysis',title:title,res:res,pwTest:pw.pwTest,pwAlpha:pw.pwAlpha,pwPower:pw.pwPower,pwEffect:pw.pwEffect,pwGroups:pw.pwGroups,pwTails:pw.pwTails,pwSolve:pw.pwSolve});
  },'Power Analysis');
}

function svgModerationPlot(res,xName,wName,yName,W,H){
  W=W||420; H=H||220;
  var b0=parseFloat(res.coefs[0].b),b1=parseFloat(res.coefs[1].b),b2=parseFloat(res.coefs[2].b),b3_=parseFloat(res.coefs[3].b);
  var xMean=parseFloat(res.xMean),xSD=parseFloat(res.xSD);
  var wMean=parseFloat(res.wMean),wSD=parseFloat(res.wSD);
  var wLevels=[wMean-wSD,wMean,wMean+wSD];
  var wLabels=['W − 1SD','W Mean','W + 1SD'];
  var colors=['#60a5fa','#fbbf24','#f472b6'];

  // X range
  var xRange=[xMean-2*xSD,xMean+2*xSD];
  var lines=wLevels.map(function(w,wi){
    var wC=res.center?(w-wMean):w;
    var pts=[[xRange[0],b0+b1*(res.center?xRange[0]-xMean:xRange[0])+b2*wC+b3_*(res.center?xRange[0]-xMean:xRange[0])*wC],[xRange[1],b0+b1*(res.center?xRange[1]-xMean:xRange[1])+b2*wC+b3_*(res.center?xRange[1]-xMean:xRange[1])*wC]];
    return{pts:pts,color:colors[wi],label:wLabels[wi]};
  });

  var allY=lines.flatMap(function(l){return l.pts.map(function(p){return p[1];});});
  var yMin=Math.min.apply(null,allY),yMax=Math.max.apply(null,allY);
  var yPad=(yMax-yMin)*0.1||1;
  yMin-=yPad; yMax+=yPad;
  var P={l:40,r:80,t:14,b:40};
  var cw=W-P.l-P.r,ch=H-P.t-P.b;
  function tx(x){return P.l+(x-xRange[0])/(xRange[1]-xRange[0])*cw;}
  function ty(y){return P.t+ch*(1-(y-yMin)/(yMax-yMin));}

  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block">';
  // Grid
  [yMin,(yMin+yMax)/2,yMax].forEach(function(v){
    var y=ty(v); svg+='<line x1="'+P.l+'" x2="'+(P.l+cw)+'" y1="'+y+'" y2="'+y+'" stroke="rgba(255,255,255,.06)" stroke-width="1"/>';
    svg+='<text x="'+(P.l-4)+'" y="'+(y+4)+'" text-anchor="end" font-size="8" fill="#64748b">'+SE.f4(v)+'</text>';
  });
  // Lines
  lines.forEach(function(l){
    var x1=tx(l.pts[0][0]),y1=ty(l.pts[0][1]),x2=tx(l.pts[1][0]),y2=ty(l.pts[1][1]);
    svg+='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+l.color+'" stroke-width="2.2" stroke-linecap="round"/>';
    svg+='<circle cx="'+x2+'" cy="'+y2+'" r="4" fill="'+l.color+'" opacity="0.9"/>';
    svg+='<text x="'+(x2+5)+'" y="'+(y2+4)+'" font-size="9" fill="'+l.color+'">'+l.label+'</text>';
  });
  // Data points
  var pts=res.xArr.map(function(x,i){return{x:x,y:res.yArr[i]};});
  pts.forEach(function(pt){
    var px=tx(pt.x),py=ty(pt.y);
    if(px>=P.l&&px<=P.l+cw&&py>=P.t&&py<=P.t+ch)
      svg+='<circle cx="'+px+'" cy="'+py+'" r="3" fill="#818cf8" fill-opacity="0.35" stroke="#a78bfa" stroke-width="0.8"/>';
  });
  // Axes
  svg+='<line x1="'+P.l+'" y1="'+P.t+'" x2="'+P.l+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.2)" stroke-width="1.2"/>';
  svg+='<line x1="'+P.l+'" y1="'+(P.t+ch)+'" x2="'+(P.l+cw)+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.2)" stroke-width="1.2"/>';
  [xRange[0],(xRange[0]+xRange[1])/2,xRange[1]].forEach(function(v){svg+='<text x="'+tx(v)+'" y="'+(H-P.b+14)+'" text-anchor="middle" font-size="8" fill="#64748b">'+SE.f4(v)+'</text>';});
  svg+='<text x="'+(P.l+cw/2)+'" y="'+H+'" text-anchor="middle" font-size="9" fill="#475569">'+escHtml(xName)+'</text>';
  return svg+'</svg>';
}

function svgSimpleSlopesPlot(res,xName,wName,yName,W,H){
  return svgModerationPlot(res,xName,wName,yName,W,H);
}

function svgJohnsonNeymanPlot(res,xName,wName,yName,W,H){
  W=W||420; H=H||220;
  var b1=parseFloat(res.coefs[1].b),b3_=parseFloat(res.coefs[3].b);
  var wMean=parseFloat(res.wMean),wSD=parseFloat(res.wSD);
  var wArr=res.wArr;
  var wSorted=[...wArr].sort(function(a,b){return a-b;});
  var wMin=wSorted[0],wMax=wSorted[wSorted.length-1];
  var steps=200;
  var wPoints=[]; for(var i=0;i<=steps;i++) wPoints.push(wMin+i*(wMax-wMin)/steps);

  var slopeData=wPoints.map(function(w){
    var wC=res.center?(w-wMean):w;
    var sl=b1+b3_*wC;
    var se2=Math.sqrt(Math.max(0.0001,parseFloat(res.coefs[1].SE)*parseFloat(res.coefs[1].SE)+wC*wC*parseFloat(res.coefs[3].SE)*parseFloat(res.coefs[3].SE)));
    var tv=se2>0?sl/se2:0;
    var p=SE.tP(Math.abs(tv),res.dfE);
    return{w:w,slope:sl,t:tv,p:p};
  });

  var slopeMin=Math.min.apply(null,slopeData.map(function(d){return d.slope;}));
  var slopeMax=Math.max.apply(null,slopeData.map(function(d){return d.slope;}));
  var sRange=slopeMax-slopeMin||1;
  var P={l:40,r:16,t:18,b:40};
  var cw=W-P.l-P.r,ch=H-P.t-P.b;
  function tx(w){return P.l+(w-wMin)/(wMax-wMin)*cw;}
  function ty(s){return P.t+ch*(1-(s-slopeMin)/sRange);}

  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;margin-top:12px;display:block">';
  // Y=0 reference line
  var y0=ty(0);
  if(y0>=P.t&&y0<=P.t+ch) svg+='<line x1="'+P.l+'" x2="'+(P.l+cw)+'" y1="'+y0+'" y2="'+y0+'" stroke="rgba(255,255,255,.15)" stroke-width="1.5" stroke-dasharray="5,3"/>';

  // Color bands: sig vs non-sig
  slopeData.forEach(function(d,i){
    if(i===0) return;
    var x1=tx(slopeData[i-1].w),x2=tx(d.w);
    var isSig=d.p<0.05;
    svg+='<rect x="'+x1+'" y="'+P.t+'" width="'+(x2-x1)+'" height="'+ch+'" fill="'+(isSig?'rgba(52,211,153,.06)':'rgba(248,113,113,.04)')+'"/>';
  });

  // Slope curve
  var pts2=slopeData.map(function(d){return{x:tx(d.w),y:ty(d.slope),sig:d.p<0.05};});
  if(pts2.length>=2){
    var path='';
    pts2.forEach(function(p,i){path+=(i===0?'M':'L')+p.x+' '+p.y;});
    svg+='<path d="'+path+'" fill="none" stroke="#c084fc" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
  }

  // JN points
  res.jn.regions.forEach(function(r){
    var xj=tx(r.value);
    svg+='<line x1="'+xj+'" y1="'+P.t+'" x2="'+xj+'" y2="'+(P.t+ch)+'" stroke="#f472b6" stroke-width="1.5" stroke-dasharray="4,3"/>';
    svg+='<text x="'+(xj+3)+'" y="'+(P.t+12)+'" font-size="9" fill="#f472b6">JN='+SE.f4(r.value)+'</text>';
  });

  // Y axis labels
  [slopeMin,(slopeMin+slopeMax)/2,slopeMax].forEach(function(v){
    var y=ty(v);
    svg+='<line x1="'+P.l+'" x2="'+(P.l+cw)+'" y1="'+y+'" y2="'+y+'" stroke="rgba(255,255,255,.05)"/>';
    svg+='<text x="'+(P.l-4)+'" y="'+(y+4)+'" text-anchor="end" font-size="8" fill="#64748b">'+SE.f4(v)+'</text>';
  });
  svg+='<line x1="'+P.l+'" y1="'+P.t+'" x2="'+P.l+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.2)" stroke-width="1.2"/>';
  svg+='<line x1="'+P.l+'" y1="'+(P.t+ch)+'" x2="'+(P.l+cw)+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.2)" stroke-width="1.2"/>';
  [wMin,(wMin+wMax)/2,wMax].forEach(function(v){svg+='<text x="'+tx(v)+'" y="'+(H-P.b+14)+'" text-anchor="middle" font-size="8" fill="#64748b">'+SE.f4(v)+'</text>';});
  svg+='<text x="'+(P.l+cw/2)+'" y="'+H+'" text-anchor="middle" font-size="9" fill="#475569">'+wName+' (Moderator)</text>';
  svg+='<text x="12" y="'+(P.t+ch/2)+'" text-anchor="middle" font-size="8" fill="#475569" transform="rotate(-90,12,'+(P.t+ch/2)+')">Simple Slope</text>';
  // Legend
  svg+='<rect x="'+(P.l+4)+'" y="'+(P.t+4)+'" width="10" height="8" rx="2" fill="rgba(52,211,153,.25)"/>';
  svg+='<text x="'+(P.l+17)+'" y="'+(P.t+11)+'" font-size="8" fill="#34d399">Significant (p&lt;.05)</text>';
  svg+='<rect x="'+(P.l+4)+'" y="'+(P.t+15)+'" width="10" height="8" rx="2" fill="rgba(248,113,113,.2)"/>';
  svg+='<text x="'+(P.l+17)+'" y="'+(P.t+22)+'" font-size="8" fill="#f87171">Non-significant</text>';
  return svg+'</svg>';
}

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
    svg+='<text x="'+(P.l+22)+'" y="'+(y+4)+'" font-size="9" fill="'+col+'">'+c.name+' (AUC='+r.auc+')</text>';
  });
  svg+='<line x1="'+P.l+'" y1="'+P.t+'" x2="'+P.l+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.2)" stroke-width="1.2"/>';
  svg+='<line x1="'+P.l+'" y1="'+(P.t+ch)+'" x2="'+(P.l+cw)+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.2)" stroke-width="1.2"/>';
  svg+='<text x="'+(P.l+cw/2)+'" y="'+H+'" text-anchor="middle" font-size="9" fill="#475569">1 − Specificity (FPR)</text>';
  return svg+'</svg>';
}

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


function svgKaplanMeier(res,W,H){
  W=W||420;H=H||280;
  var P={l:40,r:14,t:14,b:44};
  var cw=W-P.l-P.r,ch=H-P.t-P.b;
  var allTimes=res.groups.flatMap(function(g){return g.steps.map(function(s){return s.t;});});
  var tMax=allTimes.length?Math.max.apply(null,allTimes):1;
  function tx(t){return P.l+Math.min(1,t/tMax)*cw;}
  function ty(s){return P.t+ch*(1-Math.max(0,Math.min(1,s)));}
  var colors=['#f472b6','#67e8f9','#fbbf24','#34d399','#c084fc'];
  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block">';
  svg+='<defs>';
  colors.forEach(function(c,i){svg+='<linearGradient id="kmFill'+i+'" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="'+c+'" stop-opacity="0.12"/><stop offset="100%" stop-color="'+c+'" stop-opacity="0"/></linearGradient>';});
  svg+='</defs>';
  // Grid
  [0,.25,.5,.75,1].forEach(function(v){
    var y=ty(v),x=tx(v*tMax);
    svg+='<line x1="'+P.l+'" x2="'+(P.l+cw)+'" y1="'+y+'" y2="'+y+'" stroke="rgba(255,255,255,'+(v===0.5?'.12':'.05')+')" stroke-width="'+(v===0.5?1.2:1)+'"/>';
    svg+='<text x="'+(P.l-4)+'" y="'+(y+4)+'" text-anchor="end" font-size="8" fill="#64748b">'+escHtml(v)+'</text>';
    svg+='<text x="'+x+'" y="'+(H-P.b+13)+'" text-anchor="middle" font-size="8" fill="#64748b">'+(v*tMax).toFixed(0)+'</text>';
  });
  // Reference line at 0.5 (median)
  svg+='<line x1="'+P.l+'" x2="'+(P.l+cw)+'" y1="'+ty(0.5)+'" y2="'+ty(0.5)+'" stroke="rgba(255,255,255,.2)" stroke-width="1" stroke-dasharray="4,3"/>';

  res.groups.forEach(function(g,gi){
    var col=colors[gi%5];
    if(!g.steps.length) return;
    // Build step function path
    var path='M'+tx(0)+' '+ty(1);
    var prevS=1,prevT=0;
    g.steps.forEach(function(s){
      path+=' L'+tx(s.t)+' '+ty(prevS); // horizontal step
      if(s.events>0) path+=' L'+tx(s.t)+' '+ty(s.S); // vertical drop
      prevS=s.S;prevT=s.t;
    });
    path+=' L'+tx(tMax)+' '+ty(prevS);
    // CI fill
    var ciPath='M'+tx(0)+' '+ty(1);
    g.steps.forEach(function(s){if(s.events>0)ciPath+=' L'+tx(s.t)+' '+ty(s.ci_hi);});
    g.steps.slice().reverse().forEach(function(s){if(s.events>0)ciPath+=' L'+tx(s.t)+' '+ty(s.ci_lo);});
    ciPath+=' Z';
    svg+='<path d="'+ciPath+'" fill="'+col+'" fill-opacity="0.08" stroke="none"/>';
    svg+='<path d="'+path+'" fill="none" stroke="'+col+'" stroke-width="2.2" stroke-linecap="round"/>';
    // Censored marks
    g.steps.forEach(function(s){
      if(s.censored>0) svg+='<line x1="'+tx(s.t)+'" x2="'+tx(s.t)+'" y1="'+(ty(s.S)-5)+'" y2="'+(ty(s.S)+5)+'" stroke="'+col+'" stroke-width="1.5" opacity="0.7"/>';
    });
    // Legend
    var ly=P.t+6+gi*14;
    svg+='<line x1="'+(P.l+4)+'" x2="'+(P.l+20)+'" y1="'+ly+'" y2="'+ly+'" stroke="'+col+'" stroke-width="2"/>';
    svg+='<text x="'+(P.l+24)+'" y="'+(ly+4)+'" font-size="9" fill="'+col+'">'+g.label+(g.medianSurv!==null?' (M='+SE.f4(g.medianSurv)+')':' (M=NR)')+'</text>';
  });

  svg+='<line x1="'+P.l+'" y1="'+P.t+'" x2="'+P.l+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.2)" stroke-width="1.2"/>';
  svg+='<line x1="'+P.l+'" y1="'+(P.t+ch)+'" x2="'+(P.l+cw)+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.2)" stroke-width="1.2"/>';
  svg+='<text x="'+(P.l+cw/2)+'" y="'+H+'" text-anchor="middle" font-size="9" fill="#475569">Time</text>';
  svg+='<text x="12" y="'+(P.t+ch/2)+'" text-anchor="middle" font-size="9" fill="#475569" transform="rotate(-90,12,'+(P.t+ch/2)+')">Survival Probability</text>';
  return svg+'</svg>';
}


function svgForestPlot(res,W,H){
  W=W||400;
  var rowH=28,padT=20,padB=24,padL=110,padR=80;
  H=padT+res.coefs.length*rowH+padB;
  var logHRs=res.coefs.map(function(c){return Math.log(parseFloat(c.HR));});
  var ciLos=res.coefs.map(function(c){return Math.log(parseFloat(c.ci95.replace(/[\[\] ]/g,'').split(',')[0]));});
  var ciHis=res.coefs.map(function(c){return Math.log(parseFloat(c.ci95.replace(/[\[\] ]/g,'').split(',')[1]));});
  var allVals=logHRs.concat(ciLos,ciHis).filter(isFinite);
  if(!allVals.length) return '';
  var xMin=Math.min.apply(null,allVals)-0.3,xMax=Math.max.apply(null,allVals)+0.3;
  xMin=Math.min(xMin,-0.5);xMax=Math.max(xMax,0.5);
  var plotW=W-padL-padR;
  function tx(v){return padL+((v-xMin)/(xMax-xMin))*plotW;}
  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;margin-top:12px;display:block">';
  var x0=tx(0);
  svg+='<line x1="'+x0+'" y1="'+padT+'" x2="'+x0+'" y2="'+(H-padB)+'" stroke="rgba(255,255,255,.18)" stroke-width="1.2" stroke-dasharray="4,3"/>';
  svg+='<text x="'+x0+'" y="'+(H-padB+14)+'" text-anchor="middle" font-size="8" fill="#64748b">1.0 (null)</text>';
  [-1,0,1].forEach(function(v){var xv=tx(v),hr=Math.exp(v).toFixed(1);svg+='<text x="'+xv+'" y="'+(H-padB+14)+'" text-anchor="middle" font-size="7.5" fill="#475569">HR='+hr+'</text>';});
  res.coefs.forEach(function(c,i){
    var y=padT+i*rowH+rowH/2;
    var lhr=logHRs[i],lo=ciLos[i],hi=ciHis[i];
    var sig=parseFloat(c.p)<0.05;
    var col=sig?(parseFloat(c.HR)>1?'#f87171':'#34d399'):'#818cf8';
    svg+='<text x="'+(padL-5)+'" y="'+(y+4)+'" text-anchor="end" font-size="9" fill="'+col+'" font-weight="'+(sig?700:400)+'">'+c.name+'</text>';
    if(isFinite(lo)&&isFinite(hi)){
      svg+='<line x1="'+tx(lo)+'" x2="'+tx(hi)+'" y1="'+y+'" y2="'+y+'" stroke="'+col+'" stroke-width="1.5"/>';
      svg+='<line x1="'+tx(lo)+'" x2="'+tx(lo)+'" y1="'+(y-4)+'" y2="'+(y+4)+'" stroke="'+col+'" stroke-width="1.5"/>';
      svg+='<line x1="'+tx(hi)+'" x2="'+tx(hi)+'" y1="'+(y-4)+'" y2="'+(y+4)+'" stroke="'+col+'" stroke-width="1.5"/>';
    }
    if(isFinite(lhr)) svg+='<rect x="'+(tx(lhr)-5)+'" y="'+(y-5)+'" width="10" height="10" rx="2" fill="'+col+'" opacity="0.9"/>';
    svg+='<text x="'+(W-padR+5)+'" y="'+(y+4)+'" font-size="8" fill="'+col+'">'+c.HR+' '+c.ci95+'</text>';
  });
  svg+='</svg>';
  return svg;
}

function svgConvergence(pooled,W,H){
  W=W||420;H=H||160;
  var P={l:40,r:12,t:12,b:32};
  var cw=W-P.l-P.r,ch=H-P.t-P.b;
  var M=pooled[0].convergence.length;
  var colors=['#f472b6','#67e8f9','#fbbf24','#34d399','#c084fc'];
  var allVals=pooled.flatMap(function(p){return p.convergence;}).filter(isFinite);
  if(!allVals.length) return '';
  var yMin=Math.min.apply(null,allVals),yMax=Math.max.apply(null,allVals);
  var yRange=yMax-yMin||1;
  function tx(m){return P.l+((m)/(M-1||1))*cw;}
  function ty(v){return P.t+ch*(1-(v-yMin)/yRange);}
  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block">';
  [0,.5,1].forEach(function(f){var y=P.t+f*ch;svg+='<line x1="'+P.l+'" x2="'+(P.l+cw)+'" y1="'+y+'" y2="'+y+'" stroke="rgba(255,255,255,.05)"/>';});
  pooled.slice(0,5).forEach(function(p,pi){
    var col=colors[pi%5];
    var pts=p.convergence;
    var path=pts.map(function(v,i){return (i===0?'M':'L')+tx(i)+' '+ty(v);}).join('');
    svg+='<path d="'+path+'" fill="none" stroke="'+col+'" stroke-width="1.8" stroke-linecap="round"/>';
    svg+='<text x="'+(P.l+cw+3)+'" y="'+(ty(pts[pts.length-1])+4)+'" font-size="8" fill="'+col+'">'+p.variable+'</text>';
  });
  svg+='<line x1="'+P.l+'" y1="'+P.t+'" x2="'+P.l+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.2)" stroke-width="1"/>';
  svg+='<line x1="'+P.l+'" y1="'+(P.t+ch)+'" x2="'+(P.l+cw)+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.2)" stroke-width="1"/>';
  for(var i=0;i<M;i+=Math.ceil(M/5)){svg+='<text x="'+tx(i)+'" y="'+(H-P.b+13)+'" text-anchor="middle" font-size="8" fill="#64748b">'+(i+1)+'</text>';}
  svg+='<text x="'+(P.l+cw/2)+'" y="'+H+'" text-anchor="middle" font-size="9" fill="#475569">Imputation m</text>';
  return svg+'</svg>';
}

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

// ── SEM Path Diagram SVG ─────────────────────────────────────────────────
function svgSEMDiagram(latents,latentMap,paths,semResult,semColors){
  var nL=latents.length;
  if(!nL) return '<div class="chart-empty">Belum ada konstruk laten</div>';
  var W=500,H=Math.max(240,nL*80+60);
  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;max-height:380px">';

  // Defs
  svg+='<defs><marker id="arrowSEM" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#e879f9" opacity="0.8"/></marker>';
  svg+='<filter id="glowSEM"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';

  // Position latents in a circle/column layout
  var cx=W/2,r=Math.min((H-80)/2,W/3);
  var positions={};
  latents.forEach(function(ln,i){
    var angle=(2*Math.PI*i/nL)-Math.PI/2;
    var x=nL===1?cx:cx+r*Math.cos(angle);
    var y=nL===1?H/2:H/2+r*Math.sin(angle);
    if(nL===2){x=i===0?120:W-120;y=H/2;}
    if(nL===3){
      if(i===0){x=cx;y=50;}
      else if(i===1){x=80;y=H-50;}
      else{x=W-80;y=H-50;}
    }
    positions[ln]={x:Math.round(x),y:Math.round(y)};
  });

  // Draw structural paths
  paths.forEach(function(path){
    var from=positions[path.from],to=positions[path.to];
    if(!from||!to) return;
    var dx=to.x-from.x,dy=to.y-from.y,dist=Math.sqrt(dx*dx+dy*dy);
    if(dist<1) return;
    var ux=dx/dist,uy=dy/dist;
    var x1=from.x+ux*32,y1=from.y+uy*32;
    var x2=to.x-ux*32,y2=to.y-uy*32;
    // Curved path
    var mx=(x1+x2)/2,my=(y1+y2)/2-20;
    svg+='<path d="M'+x1+','+y1+' Q'+mx+','+my+' '+x2+','+y2+'" fill="none" stroke="#e879f9" stroke-width="2" opacity="0.7" marker-end="url(#arrowSEM)"/>';
    // Beta label
    if(semResult&&semResult.paths){
      var pr=semResult.paths.find(function(p){return p.from===path.from&&p.to===path.to;});
      if(pr){
        var lx=(x1+x2)/2,ly=(y1+y2)/2-18;
        var psig=parseFloat(pr.p)<0.05;
        svg+='<rect x="'+(lx-16)+'" y="'+(ly-9)+'" width="32" height="14" rx="4" fill="rgba(14,6,24,.8)" stroke="rgba(232,121,249,.3)" stroke-width="1"/>';
        svg+='<text x="'+lx+'" y="'+(ly+3)+'" text-anchor="middle" font-size="9" font-weight="700" fill="'+(psig?'#34d399':'#f87171')+'">β='+pr.beta+'</text>';
      }
    }
  });

  // Draw latent variable ellipses
  latents.forEach(function(ln,li){
    var pos=positions[ln];
    var col=semColors[li%semColors.length];
    // Ellipse for latent
    svg+='<ellipse cx="'+pos.x+'" cy="'+pos.y+'" rx="35" ry="22" fill="'+col.replace('#','rgba(').replace(/(.{6})/,'$1,.12)')+'" stroke="'+col+'" stroke-width="1.8" filter="url(#glowSEM)"/>';
    svg+='<text x="'+pos.x+'" y="'+(pos.y+4)+'" text-anchor="middle" font-size="9.5" font-weight="800" fill="'+col+'">'+ln.slice(0,9)+'</text>';

    // Draw indicator lines
    var indics=latentMap[ln]||[];
    var nI=indics.length;
    indics.forEach(function(v,vi){
      var angle2=(2*Math.PI*vi/nI)-Math.PI/2;
      var ix=pos.x+70*Math.cos(angle2),iy=pos.y+70*Math.sin(angle2);
      // Adjust for nI===1
      if(nI===1){ix=pos.x;iy=pos.y+72;}
      if(nI===2){ix=pos.x+(vi===0?-55:55);iy=pos.y+55;}
      // Clamp to SVG bounds
      ix=Math.max(22,Math.min(W-22,ix));
      iy=Math.max(18,Math.min(H-18,iy));
      // Arrow from latent to indicator
      var dx2=ix-pos.x,dy2=iy-pos.y,dist2=Math.sqrt(dx2*dx2+dy2*dy2);
      if(dist2<1) return;
      var ux2=dx2/dist2,uy2=dy2/dist2;
      svg+='<line x1="'+(pos.x+ux2*22)+'" y1="'+(pos.y+uy2*22)+'" x2="'+(ix-ux2*14)+'" y2="'+(iy-uy2*14)+'" stroke="'+col+'" stroke-width="1.2" opacity="0.5"/>';
      // Indicator rect
      svg+='<rect x="'+(ix-18)+'" y="'+(iy-10)+'" width="36" height="18" rx="4" fill="rgba(14,6,24,.7)" stroke="'+col+'" stroke-width="1" opacity="0.8"/>';
      svg+='<text x="'+ix+'" y="'+(iy+4)+'" text-anchor="middle" font-size="8" fill="'+col+'" opacity="0.9">'+v.slice(0,6)+'</text>';
    });
  });

  svg+='</svg>';
  return svg;
}

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
// ════════════════════════════════════════════════════════════════════════

// SVG Posterior plot (prior vs posterior)
function svgBayesPosterior(r){
  var W=400,H=180,P={l:30,r:10,t:12,b:28};
  var mn=parseFloat(r._mun), sd=parseFloat(r._postSD);
  var pmu=parseFloat(r._priorMu0), psd=parseFloat(r._priorSD);
  var xMin=Math.min(mn,pmu)-Math.max(sd,psd)*3.5;
  var xMax=Math.max(mn,pmu)+Math.max(sd,psd)*3.5;
  var plotW=W-P.l-P.r, plotH=H-P.t-P.b;
  var tx=function(x){return P.l+((x-xMin)/(xMax-xMin))*plotW;};
  var priorPeak=1/(Math.sqrt(2*Math.PI)*psd);
  var postPeak=1/(Math.sqrt(2*Math.PI)*sd);
  var yMax=Math.max(priorPeak,postPeak)*1.15;
  var ty=function(y){return H-P.b-(y/yMax)*plotH;};
  var npts=120;
  var priorPts='',postPts='',priorArea='',postArea='';
  var dx=(xMax-xMin)/npts;
  for(var i=0;i<=npts;i++){
    var x=xMin+i*dx;
    var yPrior=Math.exp(-0.5*Math.pow((x-pmu)/psd,2))/(Math.sqrt(2*Math.PI)*psd);
    var yPost=Math.exp(-0.5*Math.pow((x-mn)/sd,2))/(Math.sqrt(2*Math.PI)*sd);
    var px=tx(x),pyPr=ty(yPrior),pyPo=ty(yPost);
    if(i===0){priorPts='M'+px+' '+pyPr;postPts='M'+px+' '+pyPo;priorArea='M'+px+' '+(H-P.b)+' L'+px+' '+pyPr;postArea='M'+px+' '+(H-P.b)+' L'+px+' '+pyPo;}
    else{priorPts+=' L'+px+' '+pyPr;postPts+=' L'+px+' '+pyPo;priorArea+=' L'+px+' '+pyPr;postArea+=' L'+px+' '+pyPo;}
  }
  priorArea+=' L'+tx(xMax)+' '+(H-P.b)+' Z';
  postArea+=' L'+tx(xMax)+' '+(H-P.b)+' Z';
  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block">';
  svg+='<path d="'+priorArea+'" fill="rgba(192,132,252,0.12)"/>';
  svg+='<path d="'+postArea+'" fill="rgba(244,114,182,0.18)"/>';
  svg+='<path d="'+priorPts+'" fill="none" stroke="rgba(192,132,252,0.75)" stroke-width="1.8" stroke-dasharray="6,3"/>';
  svg+='<path d="'+postPts+'" fill="none" stroke="rgba(244,114,182,0.95)" stroke-width="2.2"/>';
  // posterior mean line
  svg+='<line x1="'+tx(mn)+'" y1="'+P.t+'" x2="'+tx(mn)+'" y2="'+(H-P.b)+'" stroke="#f472b6" stroke-width="1.2" stroke-dasharray="4,2"/>';
  // prior mean line
  svg+='<line x1="'+tx(pmu)+'" y1="'+P.t+'" x2="'+tx(pmu)+'" y2="'+(H-P.b)+'" stroke="rgba(192,132,252,0.5)" stroke-width="1" stroke-dasharray="4,3"/>';
  // labels
  svg+='<text x="'+(W-P.r-2)+'" y="'+(P.t+10)+'" text-anchor="end" font-size="9" fill="#f472b6">Posterior</text>';
  svg+='<text x="'+(W-P.r-2)+'" y="'+(P.t+22)+'" text-anchor="end" font-size="9" fill="rgba(192,132,252,0.8)">Prior</text>';
  // x axis ticks
  [xMin,(xMin+xMax)/2,xMax].forEach(function(v){
    svg+='<text x="'+tx(v)+'" y="'+(H-P.b+14)+'" text-anchor="middle" font-size="8" fill="#64748b">'+v.toFixed(2)+'</text>';
  });
  svg+='<line x1="'+P.l+'" y1="'+(H-P.b)+'" x2="'+(W-P.r)+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  svg+='</svg>';
  return svg;
}

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

function svgDiscriminantPlot(lr){
  var W=400,H=220,P={l:36,r:16,t:16,b:32};
  var colors=['#38bdf8','#f472b6','#4ade80','#fb923c','#a78bfa','#34d399','#fbbf24','#e879f9'];
  var scores=lr.scores;
  if(!scores||scores.length<3) return '<div class="chart-empty">Not enough data for plot</div>';
  var xs=scores.map(function(s){return s[0]||0;});
  var ys=scores.map(function(s){return s.length>1?s[1]:0;});
  var xMin=Math.min.apply(null,xs),xMax=Math.max.apply(null,xs);
  var yMin=Math.min.apply(null,ys),yMax=Math.max.apply(null,ys);
  var xR=xMax-xMin||1,yR=yMax-yMin||1;
  var tx=function(v){return P.l+(v-xMin)/xR*(W-P.l-P.r);};
  var ty=function(v){return H-P.b-(v-yMin)/yR*(H-P.t-P.b);};
  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block;overflow:visible">';
  svg+='<line x1="'+P.l+'" y1="'+P.t+'" x2="'+P.l+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  svg+='<line x1="'+P.l+'" y1="'+(H-P.b)+'" x2="'+(W-P.r)+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  svg+='<text x="'+(W/2)+'" y="'+H+'" text-anchor="middle" font-size="9" fill="#64748b">Function 1</text>';
  if(lr.nFunctions>1) svg+='<text x="12" y="'+(H/2)+'" text-anchor="middle" font-size="9" fill="#64748b" transform="rotate(-90,12,'+(H/2)+')">Function 2</text>';
  // Plot points
  var groupIdx={};
  lr.groups.forEach(function(g,i){groupIdx[g]=i;});
  // We stored scores in same row order as rows (filtered data)
  scores.forEach(function(s,i){
    // We don't have per-row group label stored — use color cycling if groups unknown
    var col=colors[i%colors.length];
    svg+='<circle cx="'+tx(s[0]||0)+'" cy="'+ty(s.length>1?s[1]:0)+'" r="4" fill="'+col+'" fill-opacity=".65" stroke="'+col+'" stroke-width="1"/>';
  });
  // Legend
  lr.groups.forEach(function(g,i){
    svg+='<circle cx="'+(P.l+10+i*70)+'" cy="'+(P.t+6)+'" r="4" fill="'+colors[i%colors.length]+'" opacity=".8"/>';
    svg+='<text x="'+(P.l+17+i*70)+'" y="'+(P.t+10)+'" font-size="8.5" fill="#94a3b8">'+g.slice(0,8)+'</text>';
  });
  svg+='</svg>';
  return svg;
}

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

function svgClusterPlot(cr){
  var W=400,H=220,P={l:36,r:16,t:22,b:32};
  var colors=['#4ade80','#38bdf8','#f472b6','#fb923c','#a78bfa','#34d399','#fbbf24','#e879f9'];
  var pts=cr.plotData||[];
  if(!pts.length) return '<div class="chart-empty">No data</div>';
  var xs=pts.map(function(p){return p.x;}),ys=pts.map(function(p){return p.y;});
  var xMin=Math.min.apply(null,xs),xMax=Math.max.apply(null,xs);
  var yMin=Math.min.apply(null,ys),yMax=Math.max.apply(null,ys);
  var xR=xMax-xMin||1,yR=yMax-yMin||1;
  var tx=function(v){return P.l+(v-xMin)/xR*(W-P.l-P.r);};
  var ty=function(v){return H-P.b-(v-yMin)/yR*(H-P.t-P.b);};
  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block;overflow:visible">';
  svg+='<line x1="'+P.l+'" y1="'+P.t+'" x2="'+P.l+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  svg+='<line x1="'+P.l+'" y1="'+(H-P.b)+'" x2="'+(W-P.r)+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  svg+='<text x="'+(W/2)+'" y="'+H+'" text-anchor="middle" font-size="9" fill="#64748b">'+cr.vars[0]+' (z)</text>';
  if(cr.vars.length>1) svg+='<text x="11" y="'+(H/2)+'" text-anchor="middle" font-size="9" fill="#64748b" transform="rotate(-90,11,'+(H/2)+')">'+cr.vars[1]+' (z)</text>';
  pts.forEach(function(p){
    var col=colors[p.cluster%colors.length];
    svg+='<circle cx="'+tx(p.x)+'" cy="'+ty(p.y)+'" r="4.5" fill="'+col+'" fill-opacity=".65" stroke="'+col+'" stroke-width="1"/>';
  });
  // Legend
  var shown={};
  cr.clusters.forEach(function(c,i){
    svg+='<circle cx="'+(P.l+8+i*55)+'" cy="'+(P.t-6)+'" r="4" fill="'+colors[i%colors.length]+'" opacity=".85"/>';
    svg+='<text x="'+(P.l+15+i*55)+'" y="'+(P.t-2)+'" font-size="8.5" fill="#94a3b8">'+c.label+'</text>';
  });
  svg+='</svg>';
  return svg;
}

function svgElbow(elbowData){
  if(!elbowData||elbowData.length<2) return '<div class="chart-empty">Not enough data for elbow chart</div>';
  var W=380,H=160,P={l:44,r:16,t:12,b:32};
  var xs=elbowData.map(function(d){return d.k;});
  var ys=elbowData.map(function(d){return d.wss;});
  var xMin=Math.min.apply(null,xs),xMax=Math.max.apply(null,xs);
  var yMin=0,yMax=Math.max.apply(null,ys);
  var xR=xMax-xMin||1,yR=yMax-yMin||1;
  var tx=function(v){return P.l+(v-xMin)/xR*(W-P.l-P.r);};
  var ty=function(v){return H-P.b-(v-yMin)/yR*(H-P.t-P.b);};
  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block">';
  svg+='<line x1="'+P.l+'" y1="'+P.t+'" x2="'+P.l+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  svg+='<line x1="'+P.l+'" y1="'+(H-P.b)+'" x2="'+(W-P.r)+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  // Grid lines
  [0.25,0.5,0.75].forEach(function(f){
    var gy=P.t+f*(H-P.t-P.b);
    svg+='<line x1="'+P.l+'" y1="'+gy+'" x2="'+(W-P.r)+'" y2="'+gy+'" stroke="rgba(100,116,139,.2)" stroke-dasharray="3,3"/>';
    svg+='<text x="'+(P.l-4)+'" y="'+(gy+4)+'" text-anchor="end" font-size="8" fill="#64748b">'+((yMax*(1-f)).toFixed(0))+'</text>';
  });
  // Line
  var pts=elbowData.map(function(d){return tx(d.k)+','+ty(d.wss);}).join(' ');
  svg+='<polyline points="'+pts+'" fill="none" stroke="#4ade80" stroke-width="2" stroke-linejoin="round"/>';
  elbowData.forEach(function(d){
    svg+='<circle cx="'+tx(d.k)+'" cy="'+ty(d.wss)+'" r="4" fill="#4ade80" stroke="#0e0618" stroke-width="1.5"/>';
    svg+='<text x="'+tx(d.k)+'" y="'+(H-P.b+14)+'" text-anchor="middle" font-size="9" fill="#64748b">'+d.k+'</text>';
  });
  svg+='<text x="'+(W/2)+'" y="'+H+'" text-anchor="middle" font-size="9" fill="#64748b">Number of clusters (k)</text>';
  svg+='<text x="11" y="'+(H/2)+'" text-anchor="middle" font-size="9" fill="#64748b" transform="rotate(-90,11,'+(H/2)+')">WSS</text>';
  svg+='</svg>';
  return svg;
}

function svgDendrogram(mergeHistory, k, varNames){
  if(!mergeHistory||mergeHistory.length<1) return '<div class="chart-empty">No dendrogram data</div>';
  var W=400,H=200,P={l:10,r:10,t:10,b:30};
  // Simple horizontal dendrogram approximation
  var n=mergeHistory.length+1;
  var maxDist=mergeHistory.reduce(function(mx,m){return Math.max(mx,m.dist);},0)||1;
  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block">';
  svg+='<text x="'+(W/2)+'" y="'+(H-4)+'" text-anchor="middle" font-size="9" fill="#64748b">Merge Distance →</text>';
  // Draw simplified dendrogram as merge steps
  var stepH=(H-P.t-P.b-20)/Math.min(mergeHistory.length,15);
  var colors=['#4ade80','#38bdf8','#f472b6','#fb923c','#a78bfa'];
  mergeHistory.slice(0,15).forEach(function(m,i){
    var y=P.t+10+i*stepH;
    var xScale=(W-P.l-P.r);
    var x1=P.l+10,x2=P.l+10+(m.dist/maxDist)*xScale*0.85;
    var col=i>=mergeHistory.length-k+1?'#f87171':'#4ade80';
    svg+='<line x1="'+x1+'" y1="'+(y+stepH/2)+'" x2="'+x2+'" y2="'+(y+stepH/2)+'" stroke="'+col+'" stroke-width="'+(i>=mergeHistory.length-k+1?2:1.5)+'"/>';
    svg+='<circle cx="'+x2+'" cy="'+(y+stepH/2)+'" r="3" fill="'+col+'"/>';
    svg+='<text x="'+(x2+5)+'" y="'+(y+stepH/2+4)+'" font-size="8" fill="rgba(232,222,255,.5)">d='+m.dist+'  (n='+m.size+')</text>';
  });
  if(mergeHistory.length>15){
    svg+='<text x="'+(W/2)+'" y="'+(H-P.b-4)+'" text-anchor="middle" font-size="8" fill="rgba(232,222,255,.3)">...showing first 15 of '+mergeHistory.length+' merges</text>';
  }
  svg+='</svg>';
  return svg;
}

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
  rv.forEach((r,ri)=>{html+='<tr class="'+(ri%2?'':'alt')+'"><td style="font-weight:700;color:#a78bfa">'+r+'</td>';
    cv.forEach(c=>{const v=cell(r,c);html+='<td style="text-align:right;color:'+(v==='—'?'#334155':'#e2e8f0')+'">'+v+'</td>';});
    html+='</tr>';});
  html+='</tbody></table></div></div>';
  el.innerHTML=html;
}

// ════════════════════════════════════════════════════════════════════════
// OUTPUT VIEW
// ════════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════════
// OUTPUT VIEW — Tab Group System
// ════════════════════════════════════════════════════════════════════════

// ── Interpretation box helper ─────────────────────────────────────────
// Renders a subtle, theme-consistent conclusion line at the bottom of each output card
function _interpBox(text){
  return '<div style="margin-top:14px;padding:9px 13px;border-top:1px solid rgba(124,58,237,.1);font-size:11.5px;color:rgba(232,222,255,.45);line-height:1.65;font-style:italic">'+text+'</div>';
}

// Build interpretation string per output type
function _buildInterp(o){
  var r=o.res;
  var p=r?parseFloat(r.p||r.p_fmt||r.pF||r.lrP||1):1;
  var sig=p<.05;

  if(o.type==='descriptive'){
    var sk=parseFloat(o.stats&&o.stats.skewness)||0;
    var swp=parseFloat(o.stats&&o.stats.shapiroP)||1;
    var norm=swp>.05;
    return 'Distribusi '+o.field+' '+(norm?'normal (SW p='+o.stats.shapiroP+')'
      :'tidak normal (SW p='+o.stats.shapiroP+')')
      +', skewness '+Math.abs(sk).toFixed(2)+(Math.abs(sk)<1?' (simetris)':(sk>0?' (condong kanan)':' (condong kiri)'))+'.';
  }
  if(o.type==='ttest'){
    var d=parseFloat(r.cohensD)||0;
    var mag=Math.abs(d)<.2?'trivial':Math.abs(d)<.5?'kecil':Math.abs(d)<.8?'sedang':'besar';
    return (sig
      ?'Terdapat perbedaan signifikan antara '+o.ga+' dan '+o.gb+' (t='+r.t+', p='+r.p_fmt+'). Ukuran efek Cohen\'s d='+r.cohensD+' ('+mag+').'
      :'Tidak terdapat perbedaan signifikan antara '+o.ga+' dan '+o.gb+' (t='+r.t+', p='+r.p_fmt+'). Efek d='+r.cohensD+' ('+mag+').');
  }
  if(o.type==='onesamp'){
    return (sig
      ?'Rata-rata sampel (x̄='+r.mean+') berbeda signifikan dari nilai uji μ₀='+o.mu0+' (t='+r.t+', p='+r.p_fmt+').'
      :'Rata-rata sampel (x̄='+r.mean+') tidak berbeda signifikan dari nilai uji μ₀='+o.mu0+' (t='+r.t+', p='+r.p_fmt+').');
  }
  if(o.type==='paired'){
    return (sig
      ?'Terdapat perbedaan signifikan antara dua kondisi (mean diff='+r.meanDiff+', t='+r.t+', p='+r.p_fmt+'). Efek d='+r.cohensD+' ('+r.dInterp+').'
      :'Tidak terdapat perbedaan signifikan antara dua kondisi (mean diff='+r.meanDiff+', p='+r.p_fmt+').');
  }
  if(o.type==='rmanova'){
    return (sig
      ?'Terdapat perbedaan signifikan antar time point (F='+r.F+', p='+r.p_fmt+'). Ukuran efek η²p='+r.etaSq+' ('+r.etaInterp+').'
      :'Tidak terdapat perbedaan signifikan antar time point (F='+r.F+', p='+r.p_fmt+').');
  }
  if(o.type==='anova'){
    return (sig
      ?'Terdapat perbedaan signifikan antar grup (F='+r.F+', p='+r.p_fmt+'). Ukuran efek η²='+r.eta2+' ('+r.eta2Interp+'). Lanjutkan dengan post-hoc untuk mengetahui pasangan yang berbeda.'
      :'Tidak terdapat perbedaan signifikan antar grup (F='+r.F+', p='+r.p_fmt+'). η²='+r.eta2+'.');
  }
  if(o.type==='anova2'){
    var sigEffects=(r.effects||[]).filter(function(e){return e.sig;}).map(function(e){return e.source;});
    return sigEffects.length
      ?'Efek signifikan: '+sigEffects.join(', ')+'. Perhatikan interaksi jika '+r.factorA+'×'+r.factorB+' signifikan.'
      :'Tidak ada efek utama maupun interaksi yang signifikan.';
  }
  if(o.type==='anova3'){
    var sigEff3=(r.effects||[]).filter(function(e){return e.sig;}).map(function(e){return e.source;});
    return sigEff3.length
      ?'Efek signifikan: '+sigEff3.join(', ')+'.'
      :'Tidak ada efek utama maupun interaksi yang signifikan.';
  }
  if(o.type==='correlation'){
    return (sig
      ?'Terdapat korelasi '+r.direction+' yang signifikan antara kedua variabel (r='+r.r+', p='+r.p_fmt+'). Kekuatan: '+r.strength+'. Variabel berbagi '+r.r2+' varians bersama.'
      :'Tidak terdapat korelasi signifikan antara kedua variabel (r='+r.r+', p='+r.p_fmt+').');
  }
  if(o.type==='partialCorrelation'){
    return (sig
      ?'Setelah mengontrol '+o.pcZ+', korelasi antara '+o.pcX+' dan '+o.pcY+' tetap signifikan (r='+r.rp+', p='+r.p_fmt+').'
      :'Setelah mengontrol '+o.pcZ+', korelasi antara '+o.pcX+' dan '+o.pcY+' tidak signifikan (r='+r.rp+', p='+r.p_fmt+').');
  }
  if(o.type==='regression'){
    var pF=parseFloat(r.pF_fmt||1);
    return (pF<.05
      ?'Model regresi signifikan (F p='+r.pF_fmt+'). '+o.xF+' menjelaskan '+r.R2+' varians '+o.yF+'. Setiap +1 '+o.xF+' → '+o.yF+' berubah '+r.b1+'.'
      :'Model regresi tidak signifikan (F p='+r.pF_fmt+'). '+o.xF+' tidak cukup menjelaskan varians '+o.yF+'.');
  }
  if(o.type==='multipleReg'){
    var pF2=parseFloat(r.pF||1);
    var sigPreds=(r.coefs||[]).filter(function(c,i){return i>0&&parseFloat(c.p_fmt)<.05;}).map(function(c){return c.name;});
    return (pF2<.05
      ?'Model signifikan (R²='+r.R2+', p='+SE.f4(r.pF)+'). Prediktor signifikan: '+(sigPreds.length?sigPreds.join(', '):'tidak ada')+'.'
      :'Model tidak signifikan secara keseluruhan (R²='+r.R2+').');
  }
  if(o.type==='logistic'){
    return (parseFloat(r.nagelkerke)>.3
      ?'Model logistik menjelaskan ~'+r.nagelkerke+' varians (Nagelkerke R²). Akurasi klasifikasi: '+r.accuracy+'%. Periksa OR prediktor signifikan untuk arah pengaruh.'
      :'Model logistik dengan Nagelkerke R²='+r.nagelkerke+'. Akurasi: '+r.accuracy+'%.');
  }
  if(o.type==='mannwhitney'){
    return (sig
      ?'Terdapat perbedaan signifikan antara '+o.ga+' dan '+o.gb+' (U='+r.U+', p='+r.p_fmt+'). Ukuran efek r='+r.r_eff+'.'
      :'Tidak terdapat perbedaan signifikan antara '+o.ga+' dan '+o.gb+' (U='+r.U+', p='+r.p_fmt+').');
  }
  if(o.type==='kruskal'){
    return (sig
      ?'Terdapat perbedaan signifikan antar grup (H='+r.H+', p='+r.p_fmt+'). Lanjutkan dengan uji post-hoc nonparametrik.'
      :'Tidak terdapat perbedaan signifikan antar grup (H='+r.H+', p='+r.p_fmt+').');
  }
  if(o.type==='wilcoxon'){
    return (sig
      ?'Terdapat perbedaan signifikan antara dua kondisi (W='+r.Wplus+', p='+r.p_fmt+').'
      :'Tidak terdapat perbedaan signifikan antara dua kondisi (p='+r.p_fmt+').');
  }
  if(o.type==='chiSquare'||o.type==='nonparam'){
    return (sig
      ?'Terdapat hubungan signifikan antar variabel (χ²='+r.chi2+', p='+r.p_fmt+'). Kekuatan asosiasi V='+r.V+' ('+r.Vinterp+').'
      :'Tidak terdapat hubungan signifikan antar variabel (χ²='+r.chi2+', p='+r.p_fmt+').');
  }
  if(o.type==='alpha'){
    return 'Cronbach α='+r.alpha+' ('+r.interp+'). '+(parseFloat(r.alpha)>=.7?'Reliabilitas internal diterima.':'Reliabilitas di bawah standar minimum (α < .70).');
  }
  if(o.type==='kappa'){
    return 'Cohen\'s κ='+r.kappa+' ('+r.interp+'). '+(parseFloat(r.kappa)>.6?'Kesepakatan antar-rater dapat diterima.':'Kesepakatan antar-rater rendah.');
  }
  if(o.type==='efa'){
    var nf=r&&r.nFactors||'?';
    return 'EFA mengekstrak '+nf+' faktor. Periksa loading ≥ |.40| untuk interpretasi setiap faktor. Variabel dengan cross-loading tinggi perlu diperhatikan.';
  }
  if(o.type==='mediation'){
    var ab=r&&r.ab;
    var abSig=r&&r.abSig;
    return (abSig
      ?'Mediasi signifikan — indirect effect (ab='+ab+') berbeda dari nol berdasarkan bootstrap CI. '+(r&&parseFloat(r.c_prime_p)>=.05?'Full mediation (c\' tidak signifikan).':'Partial mediation (c\' masih signifikan).')
      :'Efek indirect tidak signifikan (ab='+ab+'). Mediasi tidak terbukti pada α=.05.');
  }
  if(o.type==='moderation'){
    return (sig
      ?'Efek interaksi signifikan (p='+r.p_fmt+') — hubungan antara X dan Y dimoderasi oleh W. Lihat interaction plot untuk pola.'
      :'Efek interaksi tidak signifikan (p='+r.p_fmt+') — W tidak memoderasi hubungan X→Y.');
  }
  if(o.type==='survival'||o.type==='cox'){
    return 'Analisis survival selesai. Periksa kurva Kaplan-Meier dan hazard ratio untuk interpretasi perbedaan antar grup.';
  }
  if(o.type==='roc'){
    var auc=r&&r.auc||0;
    var aucInterp=auc>.9?'excellent':auc>.8?'good':auc>.7?'fair':auc>.6?'poor':'tidak informatif';
    return 'AUC='+auc+' ('+aucInterp+'). '+(auc>.7?'Model memiliki kemampuan diskriminasi yang memadai.':'Kemampuan diskriminasi model terbatas.');
  }
  if(o.type==='bayesian'||o.type==='bayes_ttest'){
    return 'Interpretasi Bayesian: BF₁₀ > 3 menunjukkan dukungan moderat untuk H₁; BF₁₀ < 1/3 mendukung H₀. Posterior distribution merangkum estimasi parameter.';
  }
  if(o.type==='hlm'){
    var icc=r&&r.ICC;
    return icc!==undefined
      ?'ICC='+icc+' — '+Math.round(parseFloat(icc)*100)+'% varians '+o.depVar+' berada di level kelompok. '+(parseFloat(icc)>.05?'HLM justified untuk data ini.':'Varians kelompok rendah; regresi OLS mungkin cukup.')
      :'Model HLM selesai. Periksa random effects untuk variasi antar kelompok.';
  }
  if(o.type==='sem'){
    var cfi=r&&r.CFI||0;
    var rmsea=r&&r.RMSEA||1;
    return 'Model fit: CFI='+cfi+' ('+( parseFloat(cfi)>=.95?'good':parseFloat(cfi)>=.90?'acceptable':'poor')+'), RMSEA='+rmsea+' ('+(parseFloat(rmsea)<=.05?'excellent':parseFloat(rmsea)<=.08?'acceptable':'poor')+').';
  }
  if(o.type==='discriminant'){
    return 'Analisis diskriminan selesai. Periksa canonical discriminant functions dan struktur koefisien untuk mengidentifikasi variabel pembeda utama.';
  }
  if(o.type==='cluster'){
    return 'Cluster analysis selesai. Interpretasikan profil setiap cluster berdasarkan centroid dan ukuran cluster untuk memberikan label deskriptif.';
  }
  if(o.type==='metaanalysis'){
    return 'Meta-analysis selesai. Periksa pooled effect size, heterogeneity (I²), dan funnel plot untuk menilai publication bias.';
  }
  if(o.type==='timeseries'){
    return 'Analisis time series selesai. Periksa ACF/PACF dan diagnostik residual untuk memastikan model sudah memadai.';
  }
  if(o.type==='poweranalysis'){
    return 'Power analysis selesai. Power ≥ 0.80 umumnya dianggap memadai untuk mendeteksi efek yang diharapkan.';
  }
  if(o.type==='glm'){
    return 'General Linear Model selesai. Periksa partial η² untuk ukuran efek setiap faktor.';
  }
  if(o.type==='manova'){
    return 'MANOVA selesai. Jika uji multivariat signifikan, lanjutkan dengan univariat ANOVA per DV dengan koreksi Bonferroni.';
  }
  if(o.type==='hierarchicalReg'){
    var lastBlock=(r&&r.blocks)?r.blocks[r.blocks.length-1]:null;
    return lastBlock
      ?'Model final (Block '+lastBlock.block+'): R²='+lastBlock.R2+'. ΔR² setiap blok menunjukkan kontribusi inkremental prediktor baru.'
      :'Hierarchical regression selesai. Bandingkan ΔR² antar blok untuk menilai kontribusi setiap set prediktor.';
  }
  if(o.type==='corrmatrix'){
    return 'Matriks korelasi selesai. Perhatikan korelasi tinggi (|r| > .70) yang bisa mengindikasikan multikollinearitas jika variabel digunakan bersama dalam regresi.';
  }
  return null;
}

// Output tab group state
var _outMode = 'all';       // 'all' | 'group'
var _outActiveGroup = null; // active group key when in group mode
var _outGrid = 1;           // layout cols: 1=1×1, 2=1×2, 3=2×2, 4=2×3, 5=2×4, 6=3×3, 7=3×4, 8=4×4

// Map output type → canonical group key & label
function _outGroup(o){
  var map={
    ttest:'T-Test', onesamp:'T-Test', paired:'T-Test',
    anova:'ANOVA', anova2:'ANOVA', anova3:'ANOVA', rmanova:'ANOVA', glm:'ANOVA', manova:'ANOVA', repeated:'ANOVA',
    correlation:'Correlation', partialCorr:'Correlation', canonicalCorr:'Correlation', corrmatrix:'Correlation',
    regression:'Regression', multipleReg:'Regression', hierarchicalReg:'Regression', logistic:'Regression', poisson:'Regression', negbin:'Regression',
    nonparam:'Non-Parametric', mannwhitney:'Non-Parametric', kruskal:'Non-Parametric', wilcoxon:'Non-Parametric', chiSquare:'Non-Parametric',
    descriptive:'Descriptives',
    alpha:'Reliability', kappa:'Reliability',
    efa:'Factor Analysis', cfa:'Factor Analysis',
    cluster:'Cluster',
    discriminant:'Discriminant',
    bayes_ttest:'Bayesian', bayes_corr:'Bayesian', bayes_posterior:'Bayesian', bayesian:'Bayesian',
    timeseries:'Time Series',
    survival:'Survival', cox:'Survival',
    roc:'ROC',
    moderation:'Moderation',
    mediation:'Mediation',
    mi:'Missing Analysis', missinganalysis:'Missing Analysis',
    poweranalysis:'Power Analysis',
    metaanalysis:'Meta-Analysis',
    sem:'SEM',
    hlm:'HLM'
  };
  return map[o.type] || (o.type ? (o.type.charAt(0).toUpperCase()+o.type.slice(1)) : 'Other');
}

function _outGroupColor(key){
  // Colors match the sidebar icon colors for each category
  var colors={
    'T-Test':'#a78bfa',          // purple — matches T-Test sidebar icon
    'ANOVA':'#34d399',            // green — matches ANOVA sidebar icon
    'Correlation':'#f472b6',      // pink — matches Correlation sidebar icon
    'Regression':'#67e8f9',       // cyan — matches Regression sidebar icon
    'Descriptives':'#f472b6',     // pink — matches Descriptive sidebar icon
    'Factor Analysis':'#a5f3fc',  // light cyan — matches Factor Analysis sidebar icon
    'Cluster':'#4ade80',          // bright green — matches Cluster sidebar icon
    'Non-Parametric':'#c084fc',   // purple — matches Nonparametric sidebar icon
    'Reliability':'#34d399',      // green — matches Reliability sidebar icon
    'Bayesian':'#f9a8d4',         // light pink — matches Bayesian sidebar icon
    'Time Series':'#67e8f9',      // cyan — matches Time Series sidebar icon
    'Survival':'#4ade80',         // green — matches Survival sidebar icon
    'ROC':'#67e8f9',              // cyan — matches ROC Curve sidebar icon
    'Moderation':'#e879f9',       // fuchsia — matches Moderation sidebar icon
    'Mediation':'#fb923c',        // orange — matches Mediation sidebar icon
    'Missing Analysis':'#f87171', // red — matches Missing Analysis sidebar icon
    'Power Analysis':'#fbbf24',   // yellow — matches Power Analysis sidebar icon
    'Meta-Analysis':'#fb923c',    // orange — matches Meta-Analysis sidebar icon
    'SEM':'#e879f9',              // fuchsia — matches SEM sidebar icon
    'HLM':'#a78bfa',              // purple — matches HLM sidebar icon
    'Discriminant':'#38bdf8'      // sky blue — matches Discriminant sidebar icon
  };
  return colors[key]||'#c084fc';
}

function _outGroupIcon(key){
  var icons={
    'T-Test':'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 3h6m-3 0v7l-5 9a1 1 0 00.9 1.5h10.2a1 1 0 00.9-1.5L14 10V3"/></svg>',
    'ANOVA':'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="10" width="5" height="10" rx="1"/><rect x="9.5" y="6" width="5" height="14" rx="1"/><rect x="17" y="2" width="5" height="18" rx="1"/></svg>',
    'Correlation':'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="6" cy="8" r="2" fill="currentColor"/><circle cx="16" cy="6" r="2" fill="currentColor"/><circle cx="5" cy="17" r="2" fill="currentColor"/><circle cx="14" cy="15" r="2" fill="currentColor"/><circle cx="19" cy="18" r="2" fill="currentColor"/></svg>',
    'Regression':'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>',
    'Descriptives':'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    'Factor Analysis':'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg>',
    'Cluster':'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="6" r="2" fill="currentColor"/><circle cx="12" cy="4" r="2" fill="currentColor"/><circle cx="7" cy="13" r="2" fill="currentColor"/><circle cx="17" cy="8" r="2" fill="currentColor"/><circle cx="19" cy="17" r="2" fill="currentColor"/></svg>',
    'Bayesian':'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="11" r="3"/><line x1="12" y1="14" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>',
    'Non-Parametric':'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 20 Q6 4 12 12 Q18 20 22 4"/></svg>',
    'Reliability':'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    'Time Series':'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>',
    'Survival':'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="2 20 6 20 6 14 10 14 10 10 14 10 14 7 18 7 18 4 22 4"/></svg>'
  };
  return icons[key]||'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>';
}

function _outGroups(){
  var seen=[], map={};
  outputs.forEach(function(o){
    var g=_outGroup(o);
    if(!map[g]){map[g]={key:g,count:0,latest:o.id};seen.push(g);}
    map[g].count++;
  });
  return seen.map(function(k){return map[k];});
}

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
      html+='<div class="stats-grid">';
      Object.entries(o.stats).filter(([,v])=>v!==undefined&&v!==null).forEach(([k,v])=>html+=stCard(k,v));
      html+='</div>';
      const swp=parseFloat(o.stats.shapiroP),ksp=parseFloat(o.stats.ksP),sk=parseFloat(o.stats.skewness);
      html+='<div style="margin:10px 0;padding:9px 12px;background:rgba(255,255,255,.018);border-radius:8px;border:1px solid rgba(255,255,255,.042)">';
      html+='<div style="font-size:11px;font-weight:700;color:#818cf8;margin-bottom:6px">Normality Summary</div><div class="row" style="gap:6px;flex-wrap:wrap">';
      html+='<span class="tag '+(swp>.05?'tag-green':'tag-red')+'">'+(swp>.05?'✓ Normal':'✗ Non-normal')+' (SW p='+o.stats.shapiroP+')</span>';
      if(o.stats.ksP&&o.stats.ksP!=='N/A')
        html+='<span class="tag '+(ksp>.05?'tag-green':'tag-red')+'">'+(ksp>.05?'✓ Normal':'✗ Non-normal')+' (KS p='+o.stats.ksP+')</span>';
      const skTag=Math.abs(sk)<1?'tag-green':Math.abs(sk)<2?'tag-yellow':'tag-red';
      html+='<span class="tag '+skTag+'">'+(Math.abs(sk)<1?'Low skew':'Skewed')+'</span>';
      if(o.stats.outlierCount>0)html+='<span class="tag tag-yellow">'+o.stats.outlierCount+' outlier(s)</span>';
      html+='</div></div>';
      html+='<div class="chart-stack">'+svgHistogram(data,o.field)+'<div style="font-size:10px;color:#64748b;margin:3px 0">Normal Q-Q Plot</div>'+svgQQ(data,o.field)+'</div>';
    }
    else if(o.type==='ttest'){
      html+=mkTable(['','Group A ('+o.ga+')','Group B ('+o.gb+')'],
        [['N',o.res.nA,o.res.nB],['Mean',o.res.meanA,o.res.meanB],['SD',o.res.sdA,o.res.sdB]]);
      html+='<div class="stats-grid" style="margin:10px 0">'+stCard('t',o.res.t,'df='+o.res.df)+stCard('p-value',o.res.p_fmt)+stCard("Cohen's d",o.res.cohensD,o.res.dInterp)+stCard('95% CI',o.res.ci95)+'</div>';
      if(o.res.cohensD_ci&&o.res.cohensD_ci!=='[—, —]') html+='<div style="font-size:11px;color:rgba(232,222,255,.45);margin-bottom:8px">Cohen\'s d 95% CI: <span style="color:#c084fc">'+o.res.cohensD_ci+'</span></div>';
      html+='<div class="row" style="margin-bottom:10px">'+sigBadge(o.res.p)+'</div>';
      if(o.swA||o.swB||o.res.warnings?.length){
        html+='<div class="assumption-box" style="margin-bottom:10px">';
        html+='<div style="font-size:10px;font-weight:700;color:#fbbf24;margin-bottom:5px;text-transform:uppercase;letter-spacing:.7px">Assumptions</div>';
        if(o.res.warnings) o.res.warnings.forEach(w=>{
          const col=w.level==='error'?'#f87171':'#fbbf24';
          html+='<div style="font-size:11.5px;color:'+col+';margin-bottom:3px">'+(w.level==='error'?'✗':'⚠')+' '+w.msg+'</div>';
        });
        if(o.swA) html+='<div style="font-size:11.5px;color:rgba(232,222,255,.6)">SW ('+o.ga+'): W='+o.swA.W+' p='+o.swA.p+' → '+(parseFloat(o.swA.p)>.05?'<span style="color:#34d399">Normal</span>':'<span style="color:#f87171">Non-normal</span>')+'</div>';
        if(o.swB) html+='<div style="font-size:11.5px;color:rgba(232,222,255,.6)">SW ('+o.gb+'): W='+o.swB.W+' p='+o.swB.p+' → '+(parseFloat(o.swB.p)>.05?'<span style="color:#34d399">Normal</span>':'<span style="color:#f87171">Non-normal</span>')+'</div>';
        if(o.lev) html+='<div style="font-size:11.5px;color:rgba(232,222,255,.6)">Levene: F='+o.lev.F+' p='+o.lev.p_fmt+(parseFloat(o.lev.p)<.05?' → <span style="color:#fbbf24">Unequal variance</span>':' → Equal variance')+'</div>';
        html+='</div>';
      }
      html+=svgBoxplot(data,o.depV,o.grpV);
    }
    else if(o.type==='paired'){
      html+=mkTable(['','Value'],[['N',o.res.n],['Mean Diff',o.res.meanDiff],['SD Diff',o.res.sdDiff],['t',o.res.t],['df',o.res.df],['p',o.res.p_fmt],["Cohen's dz",o.res.cohensD+' ('+o.res.dInterp+')'],['95% CI',o.res.ci95]]);
      html+='<div class="row" style="margin:10px 0">'+sigBadge(o.res.p)+'</div>';
      html+=svgScatter(data,o.varA,o.varB);
    }
    else if(o.type==='rmanova'&&o.res){
      var r=o.res;
      // ANOVA table
      html+=mkTable(['Source','df','SS','MS','F','p','\u03b7\u00b2p'],[
        ['Between (Time)',r.dfB,r.SSB,r.MSB,r.F,r.p_fmt,r.etaSq],
        ['Subjects',r.dfS,r.SSS,'\u2014','\u2014','\u2014','\u2014'],
        ['Error (Residual)',r.dfE,r.SSE,r.MSE,'\u2014','\u2014','\u2014']
      ]);
      html+='<div class="row" style="margin:10px 0">'+sigBadge(r.p);
      html+='<span class="tag tag-gray">\u03b7\u00b2p='+r.etaSq+' ('+r.etaInterp+')</span></div>';
      // Means table
      html+=mkTable(['Time Point','Variable','Mean'],r.labels.map(function(lb,i){return[lb,o.rmVars[i],r.tMeans[i]];}));
      // Profile plot
      if(r.tMeans&&r.tMeans.length>=2){
        var rMns=r.tMeans.map(parseFloat);
        var rmx=Math.max.apply(null,rMns),rmn=Math.min.apply(null,rMns),rng=rmx-rmn||1;
        var svgW=240,svgH=120,pL=32,pB=22,pT=12,pR=12;
        var pW=svgW-pL-pR,pH=svgH-pB-pT;
        var rmPts=rMns.map(function(m,i){return{x:pL+i/(rMns.length-1)*pW,y:pT+pH-(((m-rmn)/rng)*pH*0.85+0.075*pH),m:m,lb:r.labels[i]};});
        var poly=rmPts.map(function(p){return p.x+','+p.y;}).join(' ');
        var svg='<svg viewBox="0 0 '+svgW+' '+svgH+'" style="width:100%;height:auto;margin-top:10px">';
        svg+='<defs><linearGradient id="rmOutGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#34d399"/><stop offset="100%" stop-color="#a78bfa"/></linearGradient></defs>';
        svg+='<polyline points="'+poly+'" fill="none" stroke="url(#rmOutGrad)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
        rmPts.forEach(function(p){
          svg+='<circle cx="'+p.x+'" cy="'+p.y+'" r="4.5" fill="#34d399" opacity="0.9"/>';
          svg+='<text x="'+p.x+'" y="'+(svgH-5)+'" text-anchor="middle" font-size="9" fill="rgba(232,222,255,0.5)">'+p.lb+'</text>';
          svg+='<text x="'+p.x+'" y="'+(p.y-8)+'" text-anchor="middle" font-size="8.5" fill="#a5f3fc">'+SE.f4(p.m)+'</text>';
        });
        svg+='</svg>';
        html+=svg;
      }
      // Post-hoc
      if(o.posthoc&&o.posthoc.length){
        html+='<div class="sec-hd" style="margin-top:13px">Post-Hoc Pairwise (Paired t-test, uncorrected)</div>';
        html+=mkTable(['Pair','Mean Diff','t','p','Sig'],o.posthoc.map(function(ph){return[ph.la+' vs '+ph.lb,ph.meanDiff,ph.t,ph.p,ph.sig?'*':'ns'];}));
        html+='<div style="font-size:10px;color:rgba(232,222,255,.35);margin-top:5px">* Pertimbangkan koreksi Bonferroni: α/'+o.posthoc.length+' = '+SE.f4(.05/o.posthoc.length)+'</div>';
      }
    }
    else if(o.type==='onesamp'){
      // Summary table
      html+=mkTable(['Parameter','Value'],[
        ['Variable',o.field],
        ['Test Value (μ₀)',SE.f4(o.mu0)],
        ['N',o.res.n],
        ['Sample Mean (x̄)',o.res.mean],
        ['Std Deviation',o.res.sd],
        ['Std Error',o.res.se],
        ['Mean Difference (x̄ − μ₀)',o.res.meanDiff],
        ['95% CI of Difference',o.res.ciDiff],
        ['95% CI of Mean',o.res.ci95],
        ['t-statistic',o.res.t],
        ['df',o.res.df],
        ['p-value (two-tailed)',o.res.p_fmt],
        ["Cohen's d",o.res.cohensD+' ('+o.res.dInterp+')'],
      ]);
      html+='<div class="stats-grid" style="margin:10px 0">';
      html+=stCard('t',o.res.t,'df='+o.res.df);
      html+=stCard('p-value',o.res.p_fmt);
      html+=stCard("Cohen's d",o.res.cohensD,o.res.dInterp);
      html+=stCard('Mean Diff',o.res.meanDiff,'CI: '+o.res.ciDiff);
      html+='</div>';
      html+='<div class="row" style="margin-bottom:10px">'+sigBadge(o.res.p);
      html+='<span class="tag tag-blue" style="font-size:10.5px">'+o.res.conclusion+'</span></div>';
      // Shapiro-Wilk normality
      if(o.sw){
        html+='<div class="assumption-box" style="margin-bottom:10px">';
        html+='<div style="font-size:10px;font-weight:700;color:#fbbf24;margin-bottom:5px;text-transform:uppercase;letter-spacing:.7px">Normality Assumption (Shapiro-Wilk)</div>';
        const swOk=parseFloat(o.sw.p)>.05;
        html+='<div style="font-size:11.5px;color:rgba(232,222,255,.75)">W = '+o.sw.W+' &nbsp; p = '+o.sw.p+' → ';
        html+='<span style="color:'+(swOk?'#34d399':'#f87171')+'">'+(swOk?'✓ Normal distribution':'✗ Non-normal — consider Wilcoxon Signed-Rank test')+'</span></div>';
        html+='</div>';
      }
      // Chart
      html+=svgHistogram(data,o.field);
    }
    else if(o.type==='anova'){
      html+=mkTable(['Source','df','SS','MS','F','p','η²'],[['Between',o.res.dfB,o.res.ssB,o.res.msB,o.res.F,o.res.p_fmt,o.res.eta2],['Within',o.res.dfW,o.res.ssW,o.res.msW,'','','']]);
      html+='<div class="row" style="margin:10px 0">'+sigBadge(o.res.p)+'<span class="tag tag-gray">η²='+o.res.eta2+' ('+o.res.eta2Interp+')</span></div>';
      if(o.res.eta2_ci) html+='<div style="font-size:11px;color:rgba(232,222,255,.45);margin-bottom:8px">η² 95% CI: <span style="color:#c084fc">'+o.res.eta2_ci+'</span></div>';
      html+=mkTable(['Group','N','Mean','SD'],o.res.groupStats.map(g=>[g.label,g.n,g.mean,g.sd]));
      if(o.posthoc){
        var phName={'tukey':'Tukey HSD','bonferroni':'Bonferroni','lsd':'LSD (Fisher)','holm':'Holm-Bonferroni'}[o.posthocMethod]||'Post-hoc';
        var phNote={'tukey':'q-statistic, studentized range distribution',
          'bonferroni':'p adjusted × number of comparisons ('+o.posthoc.length+')',
          'lsd':'Unadjusted — liberal test, no familywise correction',
          'holm':'Step-down Bonferroni — p adjusted sequentially, more powerful than plain Bonferroni'}[o.posthocMethod]||'';
        html+='<div style="font-weight:700;color:#a78bfa;font-size:12px;margin:10px 0 3px">'+phName+' Post-hoc</div>';
        if(phNote)html+='<div style="font-size:10px;color:rgba(232,222,255,.35);margin-bottom:6px">'+phNote+'</div>';
        if(o.posthocMethod==='tukey'){
          html+=mkTable(['Pair','Diff','q','p','Sig'],o.posthoc.map(ph=>[ph.a+' vs '+ph.b,ph.diff,ph.q,ph.p,ph.sig?'*':'ns']));
        } else if(o.posthocMethod==='bonferroni'){
          html+=mkTable(['Pair','Diff','SE','t','p (adj)','Sig'],o.posthoc.map(ph=>[ph.a+' vs '+ph.b,ph.diff,ph.se,ph.t,ph.p_fmt,ph.sig?'*':'ns']));
        } else {
          html+=mkTable(['Pair','Diff','SE','t','p','Sig'],o.posthoc.map(ph=>[ph.a+' vs '+ph.b,ph.diff,ph.se,ph.t,ph.p_fmt,ph.sig?'*':'ns']));
        }
      }
      html+='<div style="margin-top:10px">'+svgBoxplot(data,o.depV,o.grpV)+'</div>';
    }
    else if(o.type==='anova2'){
      const r=o.res;
      html+='<div style="margin-bottom:10px;padding:8px 12px;background:rgba(251,191,36,.05);border:1px solid rgba(251,191,36,.15);border-radius:8px;font-size:11px;color:rgba(232,222,255,.55)">';
      html+='<b style="color:#fbbf24">Factorial Design:</b> '+r.depVar+' ~ '+r.factorA+' × '+r.factorB;
      html+=' &nbsp;·&nbsp; N='+r.n+' &nbsp;·&nbsp; Grand Mean='+r.grandMean;
      html+=' &nbsp;·&nbsp; Levels: A('+r.levA.length+') × B('+r.levB.length+')</div>';
      html+=renderAnovaTable(r.effects, r.error, r.total);
      // ── Sparse cell warnings ──────────────────────────────────────────
      if(r.sparseWarnings && r.sparseWarnings.length){
        r.sparseWarnings.forEach(function(w){
          var bg = w.level==='warning' ? 'rgba(251,146,60,.08)' : 'rgba(251,191,36,.07)';
          var bc = w.level==='warning' ? 'rgba(251,146,60,.3)' : 'rgba(251,191,36,.25)';
          var tc = w.level==='warning' ? '#fb923c' : '#fbbf24';
          html+='<div style="margin:7px 0;padding:8px 11px;background:'+bg+';border:1px solid '+bc+';border-radius:7px;font-size:10.5px;line-height:1.55">';
          html+='<span style="color:'+tc+';font-weight:700">'+w.icon+' '+w.msg+'</span>';
          if(w.cells && w.cells.length && w.cells.length<=12){
            html+='<div style="margin-top:4px;color:rgba(232,222,255,.45);font-family:monospace;font-size:9.5px">Cells: '+w.cells.join(', ')+'</div>';
          }
          html+='</div>';
        });
      }
      html+='<div class="row" style="margin:8px 0;gap:5px;flex-wrap:wrap">';
      r.effects.forEach(function(e){
        html+='<span class="tag '+(e.sig?'tag-green':'tag-gray')+'" style="font-size:10px">'+e.source+': p='+e.p_fmt+(e.sig?' *':'')+'</span>';
      });
      html+='</div>';
      // Marginal means
      html+='<div class="grid2" style="margin-top:12px;gap:10px">';
      html+='<div><div style="font-size:10.5px;font-weight:700;color:#818cf8;margin-bottom:6px">Marginal Means — '+r.factorA+'</div>';
      html+=mkTable(['Level','Mean','N'],r.meanA.map(function(m){return[m.level,m.mean,m.n];}));
      html+='</div><div><div style="font-size:10.5px;font-weight:700;color:#34d399;margin-bottom:6px">Marginal Means — '+r.factorB+'</div>';
      html+=mkTable(['Level','Mean','N'],r.meanB.map(function(m){return[m.level,m.mean,m.n];}));
      html+='</div></div>';
      // Interaction plot
      html+='<div style="margin-top:14px"><div style="font-size:10.5px;font-weight:700;color:#fbbf24;margin-bottom:6px"> Interaction Plot: '+r.factorA+' × '+r.factorB+'</div>';
      html+=svgInteractionPlot(r.cellMeansTable, r.factorB, r.factorA, r.depVar);
      html+='<div style="font-size:10px;color:rgba(232,222,255,.3);margin-top:4px">Non-parallel lines suggest a significant interaction. Hover dots for cell means.</div>';
      html+='</div>';
    }
    else if(o.type==='anova3'){
      const r=o.res;
      html+='<div style="margin-bottom:10px;padding:8px 12px;background:rgba(244,114,182,.05);border:1px solid rgba(244,114,182,.15);border-radius:8px;font-size:11px;color:rgba(232,222,255,.55)">';
      html+='<b style="color:#f472b6">Three-Way Factorial:</b> '+r.depVar+' ~ '+r.factorA+' × '+r.factorB+' × '+r.factorC;
      html+=' &nbsp;·&nbsp; N='+r.n+' &nbsp;·&nbsp; Grand Mean='+r.grandMean;
      html+=' &nbsp;·&nbsp; Levels: A('+r.levA.length+') × B('+r.levB.length+') × C('+r.levC.length+')</div>';
      html+=renderAnovaTable(r.effects, r.error, r.total);
      html+='<div class="row" style="margin:8px 0;gap:5px;flex-wrap:wrap">';
      r.effects.forEach(function(e){
        html+='<span class="tag '+(e.sig?'tag-green':'tag-gray')+'" style="font-size:10px">'+e.source+': p='+e.p_fmt+(e.sig?' *':'')+'</span>';
      });
      html+='</div>';
      // Marginal means A B C
      html+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:12px">';
      ['A','B','C'].forEach(function(label,idx){
        var mArr=[r.meanA,r.meanB,r.meanC][idx];
        var fName=[r.factorA,r.factorB,r.factorC][idx];
        var col=['#818cf8','#34d399','#fbbf24'][idx];
        html+='<div><div style="font-size:10.5px;font-weight:700;color:'+col+';margin-bottom:6px">'+fName+'</div>';
        html+=mkTable(['Level','Mean','N'],mArr.map(function(m){return[m.level,m.mean,m.n];}));
        html+='</div>';
      });
      html+='</div>';
      // A×B interaction plot
      html+='<div style="margin-top:14px"><div style="font-size:10.5px;font-weight:700;color:#fbbf24;margin-bottom:6px"> A×B Interaction Plot (averaged over C)</div>';
      html+=svgInteractionPlot(r.cellMeansAB, r.factorB, r.factorA, r.depVar);
      html+='</div>';
    }
    else if(o.type==='correlation'){
      html+='<div class="stats-grid" style="margin-bottom:10px">'+stCard('r',o.res.r)+stCard('r²',o.res.r2,'Variance explained')+stCard('p',o.res.p_fmt)+stCard('95% CI',o.res.ci95)+'</div>';
      html+='<div class="row" style="margin-bottom:10px">'+sigBadge(o.res.p)+'<span class="tag tag-gray">'+o.res.strength+' '+o.res.direction+'</span></div>';
      html+=svgScatter(data,o.crX,o.crY);
    }
    else if(o.type==='partialCorrelation'){
      html+='<div style="margin-bottom:8px;padding:7px 11px;background:rgba(103,232,249,.06);border-radius:8px;border:1px solid rgba(103,232,249,.15);font-size:11px;color:rgba(232,222,255,.55)">Correlation between <b style="color:#67e8f9">'+o.pcX+'</b> and <b style="color:#67e8f9">'+o.pcY+'</b> controlling for <b style="color:#c084fc">'+o.pcZ+'</b></div>';
      html+='<div class="stats-grid" style="margin-bottom:10px">'+stCard('Partial r',o.res.rp)+stCard('r²',o.res.r2,'Variance explained')+stCard('p',o.res.p_fmt)+stCard('95% CI',o.res.ci95)+'</div>';
      html+='<div class="row" style="margin-bottom:10px">'+sigBadge(o.res.p)+'<span class="tag tag-gray">'+o.res.strength+' '+(parseFloat(o.res.rp)>=0?'positive':'negative')+'</span></div>';
      html+=mkTable(['','r','Note'],[
        [o.pcX+' × '+o.pcY+' (zero-order)',o.res.rxy,'Before controlling for '+o.pcZ],
        [o.pcX+' × '+o.pcY+' (partial)',o.res.rp,'After controlling for '+o.pcZ],
        [o.pcX+' × '+o.pcZ,o.res.rxz,'Control correlation'],
        [o.pcY+' × '+o.pcZ,o.res.ryz,'Control correlation'],
      ]);
      html+='<div style="margin-top:9px;padding:8px 11px;background:rgba(255,255,255,.018);border-radius:8px;font-size:11px;color:rgba(232,222,255,.5)">n='+o.res.n+' &nbsp;·&nbsp; df='+o.res.df+' &nbsp;·&nbsp; t='+o.res.t+'</div>';
      html+=svgScatter(data,o.pcX,o.pcY);
    }
    else if(o.type==='canonicalCorr'){
      var r=o.res;
      html+='<div style="margin-bottom:10px;padding:8px 12px;background:rgba(192,132,252,.06);border-radius:8px;border:1px solid rgba(192,132,252,.18);font-size:11.5px;color:rgba(232,222,255,.6)">'
        +'<b style="color:#f472b6">Set X:</b> '+o.xNames.join(', ')
        +' &nbsp;·&nbsp; <b style="color:#67e8f9">Set Y:</b> '+o.yNames.join(', ')
        +' &nbsp;·&nbsp; <b style="color:#c084fc">n='+r.n+' · functions='+r.nRoots+'</b></div>';
      // Canonical roots summary cards
      html+='<div class="stats-grid" style="margin-bottom:12px">';
      r.tests.forEach(function(t){
        html+=stCard('Rc'+t.root+' = '+t.rc, 'Rc²='+t.rc2, (t.sig?'✓ p='+t.p_fmt:'ns · p='+t.p_fmt));
      });
      html+='</div>';
      // Significance test table (Wilks' Lambda)
      html+='<div style="font-size:11px;font-weight:700;color:rgba(232,222,255,.55);margin-bottom:6px;text-transform:uppercase;letter-spacing:.6px">Uji Signifikansi — Wilks\' Lambda</div>';
      html+=mkTable(
        ['Fungsi','Rc','Rc²','Wilks\' λ','χ²','df','p','Sig'],
        r.tests.map(function(t){return[
          t.root, t.rc, t.rc2, t.wilks, t.chiSq, t.df, t.p_fmt, t.sig?'*':'ns'
        ];})
      );
      // Structure coefficients X
      html+='<div style="font-size:11px;font-weight:700;color:#f472b6;margin:12px 0 6px;text-transform:uppercase;letter-spacing:.6px">Struktur Koefisien — Set X</div>';
      var xCols=['Variabel'].concat(r.tests.map(function(t){return'Fungsi '+t.root;}));
      html+=mkTable(xCols, r.xLoadings.map(function(v){return[v.name].concat(v.loadings);}));
      // Structure coefficients Y
      html+='<div style="font-size:11px;font-weight:700;color:#67e8f9;margin:12px 0 6px;text-transform:uppercase;letter-spacing:.6px">Struktur Koefisien — Set Y</div>';
      var yCols=['Variabel'].concat(r.tests.map(function(t){return'Fungsi '+t.root;}));
      html+=mkTable(yCols, r.yLoadings.map(function(v){return[v.name].concat(v.loadings);}));
      html+='<div style="margin-top:10px;padding:8px 11px;background:rgba(255,255,255,.02);border-radius:8px;font-size:10.5px;color:rgba(232,222,255,.4);line-height:1.6">'
        +'<b style="color:rgba(232,222,255,.65)">Interpretasi:</b> Hanya fungsi dengan p &lt; .05 yang diinterpretasi. '
        +'Struktur koefisien ≥ |.30| dianggap meaningful loading. '
        +'Rc² menunjukkan proporsi varians yang dipakai bersama antara dua set variate kanonik.</div>';
    }
    else if(o.type==='regression'){
      html+=mkTable(['','B','SE','t','p','Sig'],[['Constant',o.res.b0,o.res.SEb0,o.res.tb0,o.res.pb0_fmt,parseFloat(o.res.pb0)<.05?'*':'ns'],['Slope (b₁)',o.res.b1,o.res.SEb1,o.res.tb1,o.res.pb1_fmt,parseFloat(o.res.pb1)<.05?'*':'ns']]);
      html+='<div class="stats-grid" style="margin:10px 0">'+stCard('R²',o.res.R2)+stCard('Adj R²',o.res.R2adj)+stCard('F',o.res.F,'p='+o.res.pF_fmt)+stCard('RMSE',o.res.RMSE)+'</div>';
      html+='<div class="eq">Ŷ = '+o.res.b0+' + '+o.res.b1+'·'+o.xF+'</div>';
      html+='<div class="chart-stack">'+svgScatter(data,o.xF,o.yF)+svgResidual(o.res)+'</div>';
    }
    else if(o.type==='multipleReg'){
      // Assumption warnings first
      if(o.res.warnings&&o.res.warnings.length){
        html+='<div class="assumption-box" style="margin-bottom:12px">';
        html+='<div style="font-size:10px;font-weight:700;color:#fbbf24;margin-bottom:6px;text-transform:uppercase;letter-spacing:.7px">Assumption Checks</div>';
        o.res.warnings.forEach(w=>{
          const col=w.level==='error'?'#f87171':w.level==='info'?'#67e8f9':'#fbbf24';
          const ic=w.level==='error'?'✗':w.level==='info'?'ℹ':'⚠';
          html+='<div style="display:flex;gap:7px;align-items:flex-start;margin-bottom:5px"><span style="color:'+col+';flex-shrink:0">'+ic+'</span><span style="font-size:11.5px;color:rgba(232,222,255,.75)">'+w.msg+'</span></div>';
        });
        html+='</div>';
      }
      html+=mkTable(['Source','df','SS','F','p'],[['Regression',o.res.dfReg,o.res.SSR,o.res.F,o.res.pF_fmt],['Residual',o.res.dfRes,o.res.SSE,'',''],['Total',o.res.dfReg+o.res.dfRes,o.res.SST,'','']]);
      html+='<div class="stats-grid" style="margin:10px 0">'+stCard('R²',o.res.R2)+stCard('Adj R²',o.res.R2adj)+stCard('RMSE',o.res.RMSE)+stCard('DW',o.res.DW,'Ideal: 1.5–2.5')+'</div>';
      html+='<div class="row" style="margin-bottom:10px">'+sigBadge(o.res.pF)+'</div>';
      // Toggle: OLS vs HC3 robust
      const hasBP=o.res.bpSig;
      html+='<div style="display:flex;gap:5px;margin-bottom:8px;align-items:center">';
      html+='<button onclick="toggleCoefView(this,\'ols\')" class="dt-btn dt-btn-edit active-coef" style="font-size:11px;padding:4px 10px">OLS SE</button>';
      html+='<button onclick="toggleCoefView(this,\'hc3\')" class="dt-btn dt-btn-csv" style="font-size:11px;padding:4px 10px">HC3 Robust SE'+(hasBP?' ⚠':'')+'</button>';
      if(hasBP) html+='<span style="font-size:10.5px;color:#fbbf24">Heteroscedasticity detected — HC3 recommended</span>';
      html+='</div>';
      // OLS table
      html+='<div id="coef-ols">';
      html+=mkTable(['Variable','B','SE','β','t','p','VIF'],o.res.coefs.map((c,i)=>{
        const vif=i===0?'—':o.res.vif[i-1];
        const vifCol=i>0&&parseFloat(vif)>10?'color:#f87171':i>0&&parseFloat(vif)>5?'color:#fbbf24':'';
        const pSig=parseFloat(c.p_fmt)<0.05;
        return[c.name,c.B,c.SE,i===0?'—':c.beta,c.t,
          (pSig?'<b style="color:#34d399">':'')+c.p_fmt+(pSig?'</b>':''),
          vifCol?'<span style="'+vifCol+'">'+vif+'</span>':vif];
      }));
      html+='</div>';
      // HC3 table (hidden by default)
      html+='<div id="coef-hc3" style="display:none">';
      html+=mkTable(['Variable','B','HC3-SE','β','HC3-t','HC3-p','VIF'],o.res.coefs.map((c,i)=>{
        const vif=i===0?'—':o.res.vif[i-1];
        const vifCol=i>0&&parseFloat(vif)>10?'color:#f87171':i>0&&parseFloat(vif)>5?'color:#fbbf24':'';
        const hcSE=c.SE_HC3||c.SE; const hcT=c.t_HC3||c.t; const hcP=c.p_HC3_fmt||c.p_fmt;
        const pSig=c.sig_HC3!==undefined?c.sig_HC3:parseFloat(hcP)<0.05;
        return[c.name,c.B,hcSE,i===0?'—':c.beta,hcT,
          (pSig?'<b style="color:#34d399">':'')+hcP+(pSig?'</b>':''),
          vifCol?'<span style="'+vifCol+'">'+vif+'</span>':vif];
      }));
      html+='<div style="font-size:10.5px;color:rgba(232,222,255,.35);margin-top:5px">HC3 = heteroscedasticity-consistent covariance (Long & Ervin 2000). Use when BP test is significant.</div>';
      html+='</div>';
      html+='<div class="eq">'+o.yName+' = '+o.res.coefs.map(c=>c.name==='(Constant)'?c.B:c.B+'·'+c.name).join(' + ')+'</div>';
      // Cook's D summary
      if(o.res.highCooks>0||o.res.highLeverage>0){
        html+='<div style="margin-top:10px;padding:8px 12px;background:rgba(124,58,237,.06);border-radius:8px;border:1px solid rgba(124,58,237,.14)">';
        html+='<div style="font-size:10px;color:rgba(232,222,255,.4);text-transform:uppercase;letter-spacing:.7px;margin-bottom:5px">Influence Diagnostics</div>';
        html+='<div style="font-size:11.5px;color:rgba(232,222,255,.65)">Cook D max: <b style="color:#c084fc">'+o.res.cooksMax+'</b> (threshold: '+parseFloat(4/data.length).toFixed(3)+')</div>';
        if(o.res.highCooks>0) html+='<div style="font-size:11.5px;color:#fbbf24">'+o.res.highCooks+' potentially influential observation(s)</div>';
        if(o.res.highLeverage>0) html+='<div style="font-size:11.5px;color:#67e8f9">'+o.res.highLeverage+' high-leverage point(s)</div>';
        html+='</div>';
      }
    }
    else if(o.type==='hierarchicalReg'&&o.res){
      var hrRes=o.res;
      html+='<p style="font-size:11.5px;color:rgba(232,222,255,.6);margin-bottom:12px"><b style="color:#a5f3fc">Dependent Variable:</b> '+hrRes.depVar+'</p>';
      // Model Summary Table
      html+='<div class="sec-hd" style="margin-bottom:8px">Model Summary & ΔR²</div>';
      html+='<div class="tbl-wrap">';
      html+=mkTable(
        ['Block','Predictors','R²','Adj R²','ΔR²','F-change','df1','df2','p (ΔR²)'],
        (hrRes.blocks||[]).map(function(b){
          var bCols=['#818cf8','#a5f3fc','#f472b6','#fbbf24','#34d399'];
          var bCol=bCols[(b.block-1)%5];
          var pSig=parseFloat(b.pFchange)<0.05;
          return[
            '<b style="color:'+bCol+'">Block '+b.block+'</b>',
            '<span style="color:#94a3b8;font-size:10.5px">'+b.predictors.join(', ')+'</span>',
            '<b>'+b.R2+'</b>',
            b.R2adj,
            '<b style="color:#a5f3fc">'+b.dR2+'</b>',
            b.Fchange,
            b.dfNum,
            b.dfDen,
            (pSig?'<b style="color:#34d399">':'<span style="color:#94a3b8">')+b.pFchange+(pSig?'</b>':'</span>')
          ];
        })
      );
      html+='</div>';
      // ΔR² visual bar
      html+='<div style="margin:11px 0">';
      var maxR2=hrRes.blocks.length?parseFloat(hrRes.blocks[hrRes.blocks.length-1].R2):0;
      html+='<div style="font-size:10px;color:rgba(232,222,255,.4);margin-bottom:5px">R² Accumulation per Block</div>';
      var prevAccum=0;
      var bCols2=['#818cf8','#a5f3fc','#f472b6','#fbbf24','#34d399'];
      (hrRes.blocks||[]).forEach(function(b,bi){
        var dR2Num=parseFloat(b.dR2);
        var pct=maxR2>0?(dR2Num/maxR2)*100:0;
        html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">';
        html+='<span style="font-size:10.5px;color:'+bCols2[bi%5]+';width:50px;flex-shrink:0">Block '+b.block+'</span>';
        html+='<div style="flex:1;height:16px;background:rgba(255,255,255,.04);border-radius:4px;overflow:hidden">';
        html+='<div style="margin-left:'+(prevAccum/maxR2*100).toFixed(1)+'%;width:'+pct.toFixed(1)+'%;height:100%;background:'+bCols2[bi%5]+';opacity:0.8;border-radius:4px;transition:width .4s"></div></div>';
        html+='<span style="font-size:10.5px;color:#a5f3fc;width:50px;text-align:right">ΔR²='+b.dR2+'</span>';
        html+='</div>';
        prevAccum+=dR2Num;
      });
      html+='</div>';
      // Coefficient tables per block
      (hrRes.blocks||[]).forEach(function(b,bi){
        var bCol=bCols2[bi%5];
        html+='<div style="margin-top:13px">';
        html+='<div class="sec-hd" style="margin-bottom:7px;color:'+bCol+'">Block '+b.block+' Coefficients <span style="font-size:9.5px;font-weight:400;color:rgba(232,222,255,.35);font-style:normal">(cumulative predictors: '+b.cumulativePredictors.join(', ')+')</span></div>';
        html+=mkTable(['Variable','B','SE','β','t','p','VIF'],
          (b.coefs||[]).map(function(c,ci){
            var vif=ci===0?'—':(b.vif?b.vif[ci-1]:'—');
            var pSig=parseFloat(c.p_fmt)<0.05;
            return[c.name,c.B,c.SE,ci===0?'—':c.beta,c.t,
              (pSig?'<b style="color:#34d399">':'')+c.p_fmt+(pSig?'</b>':''),
              vif];
          }));
        html+='</div>';
      });
    }
    else if(o.type==='logistic'){
      var r=o.res,lgType=o.lgType||'binary';
      html+='<div class="stats-grid" style="margin-bottom:10px">';
      html+=stCard('N',r.n,'valid cases');
      html+=stCard('−2LL',r.m2ll,'Log-likelihood');
      html+=stCard("Cox & Snell R²",r.coxSnell,'Pseudo-R²');
      html+=stCard("Nagelkerke R²",r.nagelkerke,'Pseudo-R²');
      html+='</div>';
      html+='<div class="row" style="margin-bottom:10px">';
      html+='<span class="tag '+(parseFloat(r.chiSqP_fmt)!=='n.s.'&&r.chiSqP_fmt!==''?'tag-green':'tag-yellow')+'">χ²('+r.chiSqDf+')='+r.chiSq+', p='+r.chiSqP_fmt+'</span>';
      if(lgType==='binary') html+='<span class="tag tag-blue">Accuracy: '+r.accuracy+'%</span>';
      if(lgType==='binary') html+='<span class="tag '+(parseFloat(r.auc)>=0.8?'tag-green':parseFloat(r.auc)>=0.7?'tag-blue':'tag-yellow')+'">AUC='+r.auc+'</span>';
      html+='</div>';
      if(lgType==='binary'){
        html+=mkTable(['Variable','B','SE','Wald','p','OR','95% CI OR'],
          r.coefs.map(function(c){
            var sig=c.p_fmt!=='—'&&(c.p_fmt==='<.001'||parseFloat(c.p_fmt)<0.05);
            return[c.name,c.B,c.SE,c.wald,(sig?'<b style="color:#34d399">':'')+c.p_fmt+(sig?'</b>':''),c.OR,c.ci_or];
          })
        );
        // Confusion matrix
        html+='<div style="margin-top:12px;font-size:11px;font-weight:700;color:#c084fc;margin-bottom:6px">Confusion Matrix</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th></th><th>Pred. "'+r.cats[0]+'"</th><th>Pred. "'+r.cats[1]+'"</th><th>% Correct</th></tr></thead><tbody>';
        html+='<tr><td class="td-label">Act. "'+r.cats[0]+'"</td><td class="td-num">'+r.cm[0][0]+'</td><td class="td-num">'+r.cm[0][1]+'</td><td class="td-num">'+SE.f1(r.cm[0][0]/(r.cm[0][0]+r.cm[0][1]+0.001)*100)+'%</td></tr>';
        html+='<tr><td class="td-label">Act. "'+r.cats[1]+'"</td><td class="td-num">'+r.cm[1][0]+'</td><td class="td-num">'+r.cm[1][1]+'</td><td class="td-num">'+SE.f1(r.cm[1][1]/(r.cm[1][0]+r.cm[1][1]+0.001)*100)+'%</td></tr>';
        html+='<tr><td class="td-label" style="color:#c084fc">Total</td><td></td><td></td><td class="td-num" style="color:#34d399;font-weight:700">'+r.accuracy+'%</td></tr>';
        html+='</tbody></table></div>';
      } else {
        r.categories.forEach(function(cat,ci){
          if(ci===0) return;
          html+='<div style="margin-top:10px;font-size:11px;color:#fb923c;font-weight:700">Category "'+cat+'" vs. Reference "'+r.categories[0]+'"</div>';
          html+=mkTable(['Variable','B','SE','Wald','p','OR','95% CI OR'],
            r.coefs[ci-1].map(function(c){
              var sig=c.p_fmt!=='—'&&(c.p_fmt==='<.001'||parseFloat(c.p_fmt)<0.05);
              return[c.name,c.B,c.SE,c.wald,(sig?'<b style="color:#34d399">':'')+c.p_fmt+(sig?'</b>':''),c.OR,c.ci_or];
            })
          );
        });
        html+='<div style="margin-top:8px">Overall Accuracy: <b style="color:#34d399">'+r.accuracy+'%</b></div>';
      }
      html+='<div class="assump" style="margin-top:11px"><b style="color:#fb923c">Interpretasi:</b><br>· <b>OR &gt; 1</b>: peningkatan odds · <b>OR &lt; 1</b>: penurunan odds · <b>Wald p &lt; .05</b>: prediktor signifikan<br>· <b>Nagelkerke R²</b>: varian DV yang dijelaskan model · <b>AUC &gt; .8</b>: discriminasi baik</div>';
    }
    else if(o.type==='mannwhitney'){
      html+=mkTable(['','A ('+o.ga+')','B ('+o.gb+')'],[['Median',o.res.medA,o.res.medB],['N',o.res.nA,o.res.nB]]);
      html+='<div class="stats-grid" style="margin:10px 0">'+stCard('U',o.res.U)+(o.res.z!=='—'?stCard('z',o.res.z):'')+stCard('p',o.res.p_fmt)+stCard('r_eff',o.res.r_eff)+'</div>';
      html+='<div class="row">'+sigBadge(o.res.p);
      if(o.res.method) html+='<span class="tag tag-gray" style="font-size:10px">'+(o.res.method==='exact'?'Exact p':'Asymptotic z')+'</span>';
      html+='</div>';
    }
    else if(o.type==='kruskal'){
      html+=mkTable(['Group','N','Median','Mean'],o.res.groupStats.map(g=>[g.label,g.n,g.median,g.mean]));
      html+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin:10px 0">'+stCard('H',o.res.H)+stCard('df',o.res.df)+stCard('p',o.res.p_fmt)+'</div>';
      html+='<div class="row">'+sigBadge(o.res.p)+'</div>';
    }
    else if(o.type==='wilcoxon'){
      html+='<div class="stats-grid" style="margin-bottom:10px">'+stCard('W+',o.res.Wplus)+stCard('W−',o.res.Wminus)+(o.res.z!=='—'?stCard('z',o.res.z):'')+stCard('p',o.res.p_fmt)+'</div>';
      html+='<div class="row">'+sigBadge(o.res.p);
      if(o.res.method) html+='<span class="tag tag-gray" style="font-size:10px">'+(o.res.method==='exact'?'Exact p':'Asymptotic z')+'</span>';
      html+='</div>';
    }
    else if(o.type==='glm'){
      if(o.res&&!o.res._err){
        html+='<div class="stats-grid" style="margin-bottom:11px">';
        html+=stCard('N',o.res.n)+stCard('R²',o.res.R2)+stCard('Adj R²',o.res.R2adj)+stCard('Grand Mean',o.res.grandMean);
        html+='</div>';
        html+=mkTable(['Source','df','SS','MS','F','p','η²','Partial η²'],
          o.res.effects.map(function(e){
            var ps=e.sig?'<b style="color:#34d399">'+e.p_fmt+'</b>':(e.p_fmt||'—');
            return[e.source+(e.isCov?' (cov)':''),e.df,e.SS||'—',e.MS||'—',e.F||'—',ps,e.eta2||'—',e.partialEta2||'—'];
          }).concat([['Error',o.res.dfError,o.res.ssError,o.res.msError,'','','','']]));
        // Factor means
        o.res.factors.forEach(function(fac){
          var levels=o.res.factorLevels[fac];
          var eff=o.res.effects.find(function(e){return e.source===fac;});
          if(!levels||!eff||!eff.groups) return;
          html+='<div style="margin-top:11px"><div class="sec-hd" style="font-size:11px">'+fac+' — Estimated Marginal Means</div>';
          html+=mkTable([fac,'N','Mean','SD'],levels.map(function(g){
            var gv=eff.groups[g];
            if(!gv) return[g,'—','—','—'];
            return[g,gv.length,SE.f4(SE.mean(gv)),gv.length>=2?SE.f4(SE.std(gv)):'N/A'];
          }));
          html+='</div>';
        });
      }
    }
    else if(o.type==='poisson'||o.type==='negbin'){
      var isNB2 = o.type==='negbin';
      var mColor = isNB2?'#fb923c':'#34d399';
      var mLabel = isNB2?'Negative Binomial':'Poisson';
      var r2 = o.res;
      if(r2&&!r2._err){
        // Header stats
        html+='<div class="stats-grid" style="margin-bottom:11px">';
        html+=stCard('N',r2.n);
        html+=stCard('Log-Likelihood',r2.logLik);
        html+=stCard('McFadden R²',r2.mcFaddenR2);
        if(isNB2) html+=stCard('θ (dispersion)',r2.theta);
        else html+=stCard('Pearson Disp.',r2.dispersion);
        html+='</div>';
        // LR test badge
        html+='<div class="row" style="gap:6px;margin-bottom:11px;flex-wrap:wrap">';
        html+='<span class="tag" style="background:rgba(124,58,237,.12);color:#c084fc;font-size:11px">LR χ²('+r2.lrDf+') = '+r2.lrChi2+'</span>';
        html+='<span class="tag" style="background:rgba(124,58,237,.12);color:#c084fc;font-size:11px">p = '+r2.lrP+'</span>';
        html+=sigBadge(parseFloat(r2.lrP));
        if(!r2.converged) html+='<span class="tag tag-yellow">⚠ IRLS did not fully converge</span>';
        html+='</div>';
        // Coefficients table
        html+='<div class="sec-hd" style="margin-bottom:7px"><span style="color:'+mColor+'">'+escHtml(mLabel)+'</span> — Coefficients</div>';
        html+='<div class="tbl-wrap"><table><thead><tr>';
        ['Predictor','β','SE','z','p','IRR (e^β)','95% CI IRR'].forEach(function(h2){html+='<th>'+h2+'</th>';});
        html+='</tr></thead><tbody>';
        r2.coefs.forEach(function(c){
          html+='<tr>';
          html+='<td style="font-weight:600;color:'+mColor+'">'+c.name+'</td>';
          html+='<td class="td-num">'+c.b+'</td>';
          html+='<td class="td-num">'+c.se+'</td>';
          html+='<td class="td-num">'+c.z+'</td>';
          html+='<td class="td-num">'+(c.sig?'<b style="color:#34d399">'+c.p+'</b>':c.p)+'</td>';
          html+='<td class="td-num" style="color:'+mColor+';font-weight:700">'+c.irr+'</td>';
          html+='<td class="td-num" style="font-size:11px;color:#94a3b8">'+c.irrCI+'</td>';
          html+='</tr>';
        });
        html+='</tbody></table></div>';
        // Interpretation notes
        html+='<div class="assump" style="margin-top:11px">';
        html+='<b style="color:'+mColor+'">Interpretasi IRR</b> — IRR = e^β: nilai > 1 berarti rate meningkat, < 1 berarti menurun, per 1 unit perubahan prediktor.<br>';
        if(!isNB2&&parseFloat(r2.dispersion)>2){
          html+='<span style="color:#fbbf24">⚠ Dispersion statistic = '+r2.dispersion+' (> 2). Data kemungkinan overdispersed. Pertimbangkan <b>Negative Binomial Regression</b>.</span>';
        } else if(!isNB2){
          html+='<span style="color:#34d399">✓ Dispersion = '+r2.dispersion+' — Poisson assumption (mean ≈ variance) terpenuhi.</span>';
        } else {
          html+='Parameter dispersi θ = '+r2.theta+'. '+r2.thetaDesc+'.';
        }
        html+='</div>';
        // Warnings
        if(r2.warnings&&r2.warnings.length){
          html+='<div style="margin-top:8px;padding:8px 11px;background:rgba(251,191,36,.06);border:1px solid rgba(251,191,36,.25);border-radius:7px;font-size:11.5px;color:#fbbf24">';
          r2.warnings.forEach(function(w){html+='⚠ '+w+'<br>';});
          html+='</div>';
        }
      } else {
        html+='<div style="color:#f87171;font-size:12px">⚠ '+(r2&&r2._err?r2._err:'No result')+'</div>';
      }
    }
    else if(o.type==='manova'){
      var r = o.res;
      if(!r){ html+='<div style="color:#f87171">No MANOVA result.</div>'; }
      else {
        // ── Header badges
        html+='<div class="assump" style="margin-bottom:11px">';
        html+='<b style="color:#c084fc">MANOVA</b> — ';
        html+='DVs: <b style="color:#f9a8d4">'+r.depVars.join(', ')+'</b> &nbsp;·&nbsp; ';
        html+='Factor: <b style="color:#a5f3fc">'+r.factor+'</b> &nbsp;·&nbsp; ';
        html+='N='+r.n+' &nbsp;·&nbsp; Groups='+r.g+' &nbsp;·&nbsp; DVs='+r.p;
        html+='</div>';

        // ── Multivariate Tests table (Pillai, Wilks, Hotelling, Roy)
        html+='<div class="sec-hd" style="margin-bottom:7px">Multivariate Tests <span style="font-weight:400;font-size:10px;color:rgba(232,222,255,.4)">(Effect: '+r.factor+')</span></div>';
        var mvRows = [
          ['Pillai\'s Trace',      r.pillai.stat,    r.pillai.F,    r.pillai.df1,    r.pillai.df2,    r.pillai.p_fmt,    r.pillai.sig],
          ['Wilks\' Lambda',       r.wilks.stat,     r.wilks.F,     r.wilks.df1,     r.wilks.df2,     r.wilks.p_fmt,     r.wilks.sig],
          ['Hotelling-Lawley',     r.hotelling.stat, r.hotelling.F, r.hotelling.df1, r.hotelling.df2, r.hotelling.p_fmt, r.hotelling.sig],
          ['Roy\'s Greatest Root', r.roy.stat,       r.roy.F,       r.roy.df1,       r.roy.df2,       r.roy.p_fmt,       r.roy.sig],
        ];
        html+='<div class="tbl-wrap" style="margin-bottom:11px"><table><thead><tr>';
        ['Test','Value','F','df1','df2','p',''].forEach(function(h2){ html+='<th>'+h2+'</th>'; });
        html+='</tr></thead><tbody>';
        mvRows.forEach(function(row){
          var sig = row[6];
          html+='<tr>';
          html+='<td class="td-label" style="font-weight:600">'+row[0]+'</td>';
          html+='<td class="td-num">'+row[1]+'</td>';
          html+='<td class="td-num">'+row[2]+'</td>';
          html+='<td class="td-num">'+row[3]+'</td>';
          html+='<td class="td-num">'+row[4]+'</td>';
          html+='<td class="td-num">'+(sig?'<b style="color:#34d399">':'')+row[5]+(sig?'</b>':'')+'</td>';
          html+='<td>'+(sig?'<span class="tag tag-green" style="font-size:9px">✓ Sig</span>':'<span style="font-size:9px;color:#475569">ns</span>')+'</td>';
          html+='</tr>';
        });
        html+='</tbody></table></div>';

        // ── Effect size + eigenvalues
        html+='<div class="stats-grid" style="margin-bottom:11px">';
        html+=stCard('Partial η² (Pillai)', r.pillaiEta2, parseFloat(r.pillaiEta2)>=0.14?'Large':parseFloat(r.pillaiEta2)>=0.06?'Medium':'Small');
        html+=stCard('Eigenvalue λ₁', r.eigenvalues[0]||'—');
        html+=stCard('s (dimensions)', r.s);
        html+=stCard('Box\'s M p', r.boxP, r.boxSig?'⚠ Violation':'✓ OK');
        html+='</div>';

        // Box's M note
        if(r.boxSig){
          html+='<div class="assump" style="margin-bottom:10px;border-color:rgba(251,191,36,.3);background:rgba(251,191,36,.05)">';
          html+='<b style="color:#fbbf24">⚠ Box\'s M significant (p='+r.boxP+')</b> — covariance matrices differ across groups. ';
          html+='Pillai\'s Trace is the most robust test to use when this assumption is violated.';
          html+='</div>';
        } else {
          html+='<div class="assump" style="margin-bottom:10px"><b style="color:#34d399">✓ Box\'s M</b> not significant (p='+r.boxP+') — homogeneity of covariance matrices assumption met.</div>';
        }

        // ── Group Means matrix
        html+='<div class="sec-hd" style="margin-bottom:7px">Group Means</div>';
        html+='<div class="tbl-wrap" style="margin-bottom:11px"><table><thead><tr><th>'+escHtml(r.factor)+'</th><th>N</th>';
        r.depVars.forEach(function(dv){ html+='<th>'+escHtml(dv)+'</th>'; });
        html+='</tr></thead><tbody>';
        r.groupMeans.forEach(function(gm){
          html+='<tr><td class="td-label">'+gm.key+'</td><td class="td-num">'+gm.n+'</td>';
          gm.means.forEach(function(m){ html+='<td class="td-num">'+m+'</td>'; });
          html+='</tr>';
        });
        // Grand means row
        html+='<tr style="border-top:1px solid rgba(124,58,237,.3);opacity:.7"><td class="td-label"><i>Grand Mean</i></td><td></td>';
        r.grandMeans.forEach(function(m){ html+='<td class="td-num"><i>'+m+'</i></td>'; });
        html+='</tr>';
        html+='</tbody></table></div>';

        // ── Univariate follow-up ANOVAs
        html+='<div class="sec-hd" style="margin-bottom:7px">Univariate Follow-up ANOVAs <span style="font-weight:400;font-size:10px;color:rgba(232,222,255,.4)">(interpret with Bonferroni correction p &lt; '+SE.f4(0.05/r.p)+')</span></div>';
        if(r.univariate && r.univariate.length){
          r.univariate.forEach(function(item){
            var dv=item.dv, ures=item.res;
            html+='<div style="margin-bottom:10px;padding:9px 11px;border-radius:7px;background:rgba(124,58,237,.07);border:1px solid rgba(124,58,237,.15)">';
            html+='<div style="font-size:11px;font-weight:700;color:#f9a8d4;margin-bottom:6px">ANOVA: '+dv+'</div>';
            if(ures&&!ures._err&&ures.effects){
              var tRows2 = ures.effects.map(function(e){
                var ps = e.sig?'<b style="color:#34d399">'+e.p_fmt+'</b>':(e.p_fmt||'—');
                return [e.source, e.df, e.SS||'—', e.MS||'—', e.F||'—', ps, e.eta2||'—'];
              });
              tRows2.push(['Error', ures.dfError, ures.ssError, ures.msError, '', '', '']);
              html+=mkTable(['SOURCE','DF','SS','MS','F','p','η²'], tRows2);
              // Group means for this DV
              var eff = ures.effects&&ures.effects[0];
              if(eff&&eff.groups){
                html+='<div style="margin-top:7px">';
                html+=mkTable([r.factor,'N','Mean','SD'],
                  (ures.factorLevels&&ures.factorLevels[r.factor]||[]).map(function(gk){
                    var gv=eff.groups[gk];
                    if(!gv||!gv.length) return[gk,'—','—','—'];
                    return[gk, gv.length, SE.f4(SE.mean(gv)), gv.length>=2?SE.f4(SE.std(gv)):'N/A'];
                  })
                );
                html+='</div>';
              }
            } else {
              html+='<div style="color:#f87171;font-size:11px">'+(ures&&ures._err?ures._err:'Failed')+'</div>';
            }
            html+='</div>';
          });
        }

        // ── Interpretation note
        html+='<div class="assump" style="margin-top:4px;font-size:11px">';
        html+='<b style="color:#c084fc">Recommendation:</b> ';
        html+='Use <b>Pillai\'s Trace</b> as the primary test statistic — it is the most robust, especially when n is small or covariance matrices are unequal. ';
        html+='Wilks\' Lambda is most powerful when assumptions are met. Roy\'s Greatest Root is an upper bound (liberal). ';
        html+='Follow significant multivariate tests with univariate ANOVAs above, applying Bonferroni correction (α/'+r.p+').';
        html+='</div>';
      }
    }
    else if(o.type==='hlm'){
      var r=o.res;
      if(!r){ html+='<div style="color:#f87171">No HLM result.</div>'; }
      else if(r._err){ html+='<div style="color:#f87171">⚠ '+r._err+'</div>'; }
      else {
        var iccV=parseFloat(r.ICC);
        var iccColor=iccV<.05?'#34d399':iccV<.10?'#fbbf24':iccV<.25?'#f472b6':'#f87171';
        var iccLabel=iccV<.05?'Negligible clustering':iccV<.10?'Small – HLM recommended':iccV<.25?'Moderate – HLM important':'Strong – HLM essential';
        html+='<div class="stats-grid" style="margin-bottom:11px">';
        html+=stCard('ICC',r.ICC,'Intraclass Correlation')+stCard('Groups (k)',r.k,'Level-2 units');
        html+=stCard('N obs',r.n,'Level-1 units')+stCard('Grand Mean',r.grandMean,o.dep);
        html+='</div>';
        html+='<div style="padding:10px 14px;border-radius:9px;border:1.5px solid '+iccColor+';background:rgba(124,58,237,.04);margin-bottom:11px">';
        html+='<div style="font-size:13px;font-weight:700;color:'+iccColor+'">ICC = '+r.ICC+'</div>';
        html+='<div style="font-size:11px;color:rgba(232,222,255,.55);margin-top:3px">'+iccLabel+'</div></div>';
        html+='<div class="stats-grid2" style="margin-bottom:11px">';
        html+=stCard('τ₀₀ (Between)',r.varBetween,'Level-2 variance')+stCard('σ² (Within)',r.varWithin,'Level-1 residual');
        html+=stCard('Design Effect',r.design_effect,'DEFF = 1+(ñ–1)·ICC')+stCard('F (null model)',r.F+(r.sig?' *':' ns'),'One-way ANOVA test');
        html+='</div>';
        if(r.grpStats&&r.grpStats.length){
          html+='<div class="sec-hd" style="font-size:11px;margin-bottom:6px">Group-Level Descriptives ('+o.group+')</div>';
          html+='<div class="tbl-wrap"><table><thead><tr><th>Group</th><th>n</th><th>Mean</th><th>SD</th></tr></thead><tbody>';
          r.grpStats.slice(0,20).forEach(function(g){
            html+='<tr><td class="td-str">'+g.group+'</td><td class="td-num">'+g.n+'</td><td class="td-num">'+g.mean+'</td><td class="td-num">'+g.sd+'</td></tr>';
          });
          if(r.grpStats.length>20) html+='<tr><td colspan="4" style="color:rgba(232,222,255,.3);font-size:11px;text-align:center">… '+(r.grpStats.length-20)+' more groups</td></tr>';
          html+='</tbody></table></div>';
        }
        html+='<div class="assump" style="margin-top:11px;font-size:11px">';
        html+='<b style="color:#a78bfa">Interpretation:</b> ICC = '+r.ICC+'. '+iccLabel+'. ';
        html+='Between-group variance τ₀₀ = '+r.varBetween+', within-group σ² = '+r.varWithin+'. ';
        html+='Design effect = '+r.design_effect+' (effective N is approximately 1/DEFF of observed N). ';
        if(iccV>.05) html+='<span style="color:#fbbf24">Recommend using HLM over OLS regression for this nested data structure.</span>';
        else html+='<span style="color:#34d399">Clustering is minimal; single-level analysis may be adequate, but verify theoretical justification for grouping.</span>';
        html+='</div>';
      }
    }
    else if(o.type==='alpha'){
      html+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:10px">'+stCard('Cronbach α',o.res.alpha,o.res.interp)+stCard('Items k',o.res.k)+stCard('Cases n',o.res.n)+'</div>';
      html+='<div class="row"><span class="tag '+(parseFloat(o.res.alpha)>=.7?'tag-green':'tag-red')+'">'+o.res.interp+' reliability</span></div>';
      html+='<div style="margin-top:8px;font-size:11px;color:#64748b">Items: '+o.vars.join(' · ')+'</div>';
    }
    else if(o.type==='kappa'){
      var r=o.res;
      var kv=parseFloat(r.kappa);
      var kCls=kv>=0.8?'tag-green':kv>=0.6?'tag-blue':kv>=0.4?'tag-purple':kv>=0.2?'tag-yellow':'tag-red';
      // Summary stats row
      html+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px">';
      html+=stCard("Cohen's κ",r.kappa,r.interp);
      html+=stCard('SE',r.seK);
      html+=stCard('z-score',r.z);
      html+=stCard('Cases n',r.n);
      html+='</div>';
      html+='<div class="row" style="margin-bottom:8px">';
      html+='<span class="tag '+kCls+'">'+r.interp+'</span>';
      html+='<span class="tag tag-blue">p'+r.pFmt+'</span>';
      html+='<span class="tag tag-purple">95% CI ['+r.ci95lo+', '+r.ci95hi+']</span>';
      if(o.weighted&&r.wKappa!==null) html+='<span class="tag tag-teal">Weighted κ='+r.wKappa+' ('+r.interpW+')</span>';
      html+='</div>';
      // Agreement detail
      html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">';
      html+=stCard('Observed Agreement (Po)',r.po);
      html+=stCard('Expected Agreement (Pe)',r.pe);
      html+='</div>';
      // Confusion matrix
      html+='<div style="font-size:11px;font-weight:700;color:#94a3b8;margin-bottom:6px;letter-spacing:.5px">CONFUSION MATRIX</div>';
      html+='<div class="tbl-wrap" style="margin-bottom:12px"><table><thead><tr><th style="color:#818cf8">'+escHtml(o.vars[0])+' \\ '+escHtml(o.vars[1])+'</th>';
      r.cats.forEach(function(c){html+='<th>'+escHtml(c)+'</th>';});
      html+='<th>Total</th></tr></thead><tbody>';
      r.cats.forEach(function(cat,i){
        html+='<tr class="'+(i%2?'':'alt')+'"><td class="td-label" style="color:#818cf8">'+escHtml(cat)+'</td>';
        r.mat[i].forEach(function(cell,j){
          var isDiag=i===j;
          html+='<td style="'+(isDiag?'background:rgba(129,140,248,.08);font-weight:700;color:#a5b4fc':'')+'">'+cell+'</td>';
        });
        html+='<td style="color:#94a3b8;font-weight:600">'+r.rowSum[i]+'</td></tr>';
      });
      html+='<tr style="background:rgba(255,255,255,.02)"><td class="td-label">Total</td>';
      r.colSum.forEach(function(v){html+='<td style="color:#94a3b8;font-weight:600">'+v+'</td>';});
      html+='<td style="font-weight:800;color:#c7d2fe">'+r.n+'</td></tr>';
      html+='</tbody></table></div>';
      // Per-category stats
      html+='<div style="font-size:11px;font-weight:700;color:#94a3b8;margin-bottom:6px;letter-spacing:.5px">PER-CATEGORY AGREEMENT</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Category</th><th>n (Rater 1)</th><th>Correct</th><th>Precision</th><th>Recall</th></tr></thead><tbody>';
      r.catStats.forEach(function(cs,i){
        html+='<tr class="'+(i%2?'':'alt')+'"><td class="td-label">'+cs.cat+'</td>';
        html+='<td class="td-num">'+cs.n+'</td>';
        html+='<td class="td-num" style="color:#34d399">'+cs.tp+'</td>';
        html+='<td class="td-num">'+cs.precision+'</td>';
        html+='<td class="td-num">'+cs.recall+'</td></tr>';
      });
      html+='</tbody></table></div>';
      html+='<div style="margin-top:8px;font-size:11px;color:#64748b">Rater 1: '+o.vars[0]+' · Rater 2: '+o.vars[1]+'</div>';
    }
    else if(o.type==='efa'){
      var r=o.res;
      // KMO + Bartlett
      html+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-bottom:11px">';
      var kmoColor=parseFloat(r.kmo)>=0.7?'#34d399':parseFloat(r.kmo)>=0.5?'#fbbf24':'#f87171';
      html+=stCard('KMO','<span style="color:'+kmoColor+'">'+r.kmo+'</span>',r.kmoInterp);
      html+=stCard('Bartlett χ²',r.chi2,'df='+r.bartDf+' p='+r.bartP);
      html+=stCard('Variance Explained',r.cumVar[r.nFactors-1]+'%',r.nFactors+' factor'+(r.nFactors>1?'s':'')+' · '+r.rotation);
      html+='</div>';
      html+='<div class="row" style="margin-bottom:11px">';
      html+='<span class="tag '+(parseFloat(r.kmo)>=0.7?'tag-green':parseFloat(r.kmo)>=0.5?'tag-yellow':'tag-red')+'">KMO: '+r.kmoInterp+'</span>';
      html+='<span class="tag '+(r.bartSig?'tag-green':'tag-red')+'">'+(r.bartSig?'✓ Bartlett significant':'✗ Bartlett not sig')+'</span>';
      html+='</div>';
      // Eigenvalue table
      html+='<div class="sec-hd" style="margin-bottom:8px">Eigenvalues & Variance Explained</div>';
      html+='<div class="tbl-wrap" style="margin-bottom:12px"><table><thead><tr><th>Factor</th><th>Eigenvalue</th><th>% Variance</th><th>Cumulative %</th><th>Retain?</th></tr></thead><tbody>';
      r.eigenvalues.forEach(function(ev,i){
        var retain=i<r.nFactors;
        var evNum=parseFloat(ev);
        html+='<tr style="'+(retain?'background:rgba(165,243,252,.05)':'')+'">'; 
        html+='<td class="td-label">F'+(i+1)+'</td>';
        html+='<td class="td-num" style="color:'+(evNum>1?'#a5f3fc':evNum>0.5?'rgba(232,222,255,.6)':'rgba(232,222,255,.3)')+'">'+ev+'</td>';
        html+='<td class="td-num">'+(r.varExp[i]||'—')+'%</td>';
        html+='<td class="td-num">'+(r.cumVar[i]||'—')+'%</td>';
        html+='<td>'+(retain?'<span class="tag tag-green" style="font-size:9px">✓ Yes</span>':(evNum>1?'<span class="tag tag-yellow" style="font-size:9px">Consider</span>':'<span style="font-size:9px;color:#334155">No</span>'))+'</td>';
        html+='</tr>';
      });
      html+='</tbody></table></div>';
      // Scree plot
      html+='<div style="margin-bottom:12px">'+svgScreePlot(r.eigenvalues,r.nFactors)+'</div>';
      // Factor loadings
      html+='<div class="sec-hd" style="margin-bottom:8px">Factor Loading Matrix <span style="font-weight:400;font-style:normal;color:rgba(232,222,255,.35);font-size:10px">('+r.rotation+' · |loading| ≥ 0.40 highlighted)</span></div>';
      html+='<div class="tbl-wrap" style="margin-bottom:10px"><table><thead><tr><th>Variable</th>';
      for(var fi=0;fi<r.nFactors;fi++) html+='<th>F'+(fi+1)+'</th>';
      html+='<th>Communality h²</th></tr></thead><tbody>';
      o.efaVars.forEach(function(v,i){
        html+='<tr><td class="td-label">'+escHtml(v)+'</td>';
        r.loadings[i].forEach(function(l){
          var absL=Math.abs(parseFloat(l));
          var col=absL>=0.6?'#a5f3fc':absL>=0.4?'#c084fc':'rgba(232,222,255,.38)';
          var fw=absL>=0.4?700:400;
          html+='<td class="td-num" style="color:'+col+';font-weight:'+fw+'">'+l+'</td>';
        });
        var h2=parseFloat(r.communalities[i]);
        var h2col=h2>=0.7?'#34d399':h2>=0.4?'#fbbf24':'#f87171';
        html+='<td class="td-num" style="color:'+h2col+'">'+r.communalities[i]+'</td>';
        html+='</tr>';
      });
      html+='</tbody></table></div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.35);margin-bottom:6px">Cyan ≥0.60 strong · Purple ≥0.40 moderate · Communality: green ≥0.70 · yellow ≥0.40 · red &lt;0.40</div>';
      // Interpretation hint
      html+='<div class="assump"><b style="color:#a5f3fc">N</b>='+r.n+' cases &nbsp;·&nbsp; <b style="color:#a5f3fc">p</b>='+r.p+' variables &nbsp;·&nbsp; '+r.nFactors+' factors extracted</div>';
    }
    else if(o.type==='cfa'){
      var r=o.res;
      // Overall fit badge
      html+='<div style="margin-bottom:12px;padding:12px 16px;border-radius:10px;background:rgba(0,0,0,.15);border:1px solid '+r.fitColor+';display:flex;align-items:center;justify-content:space-between">';
      html+='<div><div style="font-size:15px;font-weight:900;color:'+r.fitColor+';font-family:Playfair Display,serif">'+r.overallFit+'</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.45);margin-top:2px">N='+r.n+' · '+r.p+' variabel · '+r.nFactors+' faktor laten</div></div>';
      html+='<div style="text-align:right"><div style="font-size:10.5px;color:rgba(232,222,255,.4)">χ²('+r.dfModel+')='+r.chiSq+'</div><div style="font-size:10.5px;color:rgba(232,222,255,.4)">p = '+r.pChiSq+'</div></div>';
      html+='</div>';
      // 4 Fit index cards
      var cficol=r.CFI_raw>=0.95?'#34d399':r.CFI_raw>=0.90?'#fbbf24':'#f87171';
      var tlicol=r.TLI_raw>=0.95?'#34d399':r.TLI_raw>=0.90?'#fbbf24':'#f87171';
      var rmsecol=r.RMSEA_raw<=0.05?'#34d399':r.RMSEA_raw<=0.08?'#fbbf24':'#f87171';
      var srmrcol=r.SRMR_raw<=0.05?'#34d399':r.SRMR_raw<=0.08?'#fbbf24':'#f87171';
      html+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:12px">';
      html+=stCard('CFI','<span style="color:'+cficol+'">'+r.CFI+'</span>',r.CFIinterp+' (≥.95 excellent)');
      html+=stCard('TLI / NNFI','<span style="color:'+tlicol+'">'+r.TLI+'</span>',r.TLIinterp+' (≥.95 excellent)');
      html+=stCard('RMSEA','<span style="color:'+rmsecol+'">'+r.RMSEA+'</span>',r.RMSEAinterp+' (≤.05 excellent)');
      html+=stCard('SRMR','<span style="color:'+srmrcol+'">'+r.SRMR+'</span>',r.SRMRinterp+' (≤.05 excellent)');
      html+='</div>';
      // Fit tags row
      html+='<div class="row" style="margin-bottom:10px">';
      html+='<span class="tag '+(r.CFI_raw>=0.95?'tag-green':r.CFI_raw>=0.90?'tag-yellow':'tag-red')+'">CFI: '+r.CFIinterp+'</span>';
      html+='<span class="tag '+(r.TLI_raw>=0.95?'tag-green':r.TLI_raw>=0.90?'tag-yellow':'tag-red')+'">TLI: '+r.TLIinterp+'</span>';
      html+='<span class="tag '+(r.RMSEA_raw<=0.05?'tag-green':r.RMSEA_raw<=0.08?'tag-yellow':'tag-red')+'">RMSEA: '+r.RMSEAinterp+'</span>';
      html+='<span class="tag '+(r.SRMR_raw<=0.05?'tag-green':r.SRMR_raw<=0.08?'tag-yellow':'tag-red')+'">SRMR: '+r.SRMRinterp+'</span>';
      html+='</div>';
      // RMSEA CI + Chi-square table
      html+='<div style="font-size:11.5px;color:rgba(232,222,255,.55);margin-bottom:10px">RMSEA 90% CI: ['+r.RMSEA_lo+' – '+r.RMSEA_hi+']</div>';
      html+=mkTable(
        ['Index','Value','Cutoff (Excellent)','Cutoff (Acceptable)','Interpretation'],
        [
          ['CFI', r.CFI, '≥ .95', '≥ .90', r.CFIinterp],
          ['TLI (NNFI)', r.TLI, '≥ .95', '≥ .90', r.TLIinterp],
          ['RMSEA', r.RMSEA, '≤ .05', '≤ .08', r.RMSEAinterp+' ['+r.RMSEA_lo+', '+r.RMSEA_hi+']'],
          ['SRMR', r.SRMR, '≤ .05', '≤ .08', r.SRMRinterp],
          ['χ²', r.chiSq, 'p > .05*', '—', 'df='+r.dfModel+', p='+r.pChiSq+' (*N-sensitive)'],
        ]
      );
      // Factor loadings
      html+='<div class="sec-hd" style="margin-top:13px;margin-bottom:8px">Factor Loadings (Standardized)</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Faktor</th><th>Indikator</th><th>λ (Loading)</th><th>h² (Communality)</th><th>Status</th></tr></thead><tbody>';
      var factColors=['#818cf8','#f472b6','#34d399','#fbbf24','#67e8f9'];
      r.factorNames.forEach(function(fn, fi){
        var fcolor=factColors[fi%5];
        var vars=r.factorMap[fn]||[];
        vars.forEach(function(v,vi){
          var vIdx=r.varNames.indexOf(v);
          var lam=vIdx>=0?r.lambda[vIdx][fi]:'—';
          var h2=vIdx>=0?r.communalities[vIdx]:'—';
          var lamNum=parseFloat(lam);
          var h2num=parseFloat(h2);
          var lamCol=Math.abs(lamNum)>=0.7?'#34d399':Math.abs(lamNum)>=0.5?'#a5f3fc':Math.abs(lamNum)>=0.3?'#fbbf24':'#f87171';
          var h2col=h2num>=0.7?'#34d399':h2num>=0.4?'#fbbf24':'#f87171';
          html+='<tr>';
          if(vi===0) html+='<td class="td-label" rowspan="'+vars.length+'" style="color:'+fcolor+';font-weight:800;vertical-align:middle">'+escHtml(fn)+'</td>';
          html+='<td class="td-label">'+escHtml(v)+'</td>';
          html+='<td class="td-num" style="color:'+lamCol+';font-weight:'+(Math.abs(lamNum)>=0.5?700:400)+'">'+lam+'</td>';
          html+='<td class="td-num" style="color:'+h2col+'">'+h2+'</td>';
          html+='<td>'+(Math.abs(lamNum)>=0.5?'<span class="tag tag-green" style="font-size:9px">✓ Adequate</span>':'<span class="tag tag-red" style="font-size:9px">✗ Weak</span>')+'</td>';
          html+='</tr>';
        });
      });
      html+='</tbody></table></div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.35);margin-top:6px">λ ≥ 0.70 strong · ≥ 0.50 adequate · &lt; 0.30 weak · h² = komunalitas (variance explained)</div>';
      // Interpretation note
      html+='<div class="assump" style="margin-top:10px"><b style="color:#818cf8">Interpretasi Model:</b> '+r.overallFit+'. '
        +(r.CFI_raw>=0.95&&r.RMSEA_raw<=0.06?'Model memiliki fit yang baik terhadap data. ':'')
        +(r.CFI_raw<0.90||r.RMSEA_raw>0.08?'Pertimbangkan modifikasi model berdasarkan Modification Indices atau residual matrix. ':'')
        +'Reference: Hu & Bentler (1999): CFI ≥ .95, RMSEA ≤ .06, SRMR ≤ .08 sebagai indikator good fit.</div>';
    }

    else if(o.type==='sem'){
      var r=o.res;
      var semColsPal=['#e879f9','#818cf8','#34d399','#fbbf24','#67e8f9','#f472b6'];
      var fitColSEM=r.overallFit==='Good Fit'?'#34d399':r.overallFit==='Acceptable Fit'?'#fbbf24':'#f87171';
      // Header
      html+='<div style="margin-bottom:12px;padding:12px 16px;border-radius:10px;background:linear-gradient(135deg,rgba(232,121,249,.08),rgba(129,140,248,.05));border:1.5px solid '+fitColSEM+';display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">';
      html+='<div><div style="font-size:15px;font-weight:900;color:'+fitColSEM+';font-family:Playfair Display,serif">'+r.overallFit+'</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.5);margin-top:2px">N='+r.n+' · '+r.totalIndicators+' indikators · '+r.nLatent+' konstruk laten</div></div>';
      html+='<div style="text-align:right"><div style="font-size:10.5px;color:rgba(232,222,255,.4)">χ²('+r.dfModel+')='+r.chiSq+' · p='+r.pChiSq+'</div>';
      html+='<div style="font-size:10.5px;color:rgba(232,222,255,.4)">χ²/df='+r.chiRatio+' · RMSEA CI: ['+r.RMSEA_lo+', '+r.RMSEA_hi+']</div></div>';
      html+='</div>';
      // Fit index cards
      var cficol3=r.CFI_raw>=0.95?'#34d399':r.CFI_raw>=0.90?'#fbbf24':'#f87171';
      var tlicol3=r.TLI_raw>=0.95?'#34d399':r.TLI_raw>=0.90?'#fbbf24':'#f87171';
      var rmsecol3=r.RMSEA_raw<=0.05?'#34d399':r.RMSEA_raw<=0.08?'#fbbf24':'#f87171';
      var srmrcol3=r.SRMR_raw<=0.05?'#34d399':r.SRMR_raw<=0.08?'#fbbf24':'#f87171';
      html+='<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-bottom:12px">';
      html+=stCard('CFI','<span style="color:'+cficol3+'">'+r.CFI+'</span>','≥.95 good');
      html+=stCard('TLI','<span style="color:'+tlicol3+'">'+r.TLI+'</span>','≥.95 good');
      html+=stCard('RMSEA','<span style="color:'+rmsecol3+'">'+r.RMSEA+'</span>','≤.06 good');
      html+=stCard('SRMR','<span style="color:'+srmrcol3+'">'+r.SRMR+'</span>','≤.08 good');
      html+=stCard('χ²/df','<span style="color:'+(r.chiRatio<=2?'#34d399':r.chiRatio<=3?'#fbbf24':'#f87171')+'">'+r.chiRatio+'</span>','≤2.0 good');
      html+=stCard('N',r.n,'Sample size');
      html+='</div>';
      // Construct validity
      if(r.constructs&&r.constructs.length){
        html+='<div class="sec-hd" style="margin-bottom:8px">Construct Validity (AVE & CR)</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th>Konstruk</th><th>N Indics</th><th>AVE</th><th>CR</th><th>Cronbach α</th><th>Validity</th></tr></thead><tbody>';
        r.constructs.forEach(function(c,ci){
          var col=semColsPal[ci%semColsPal.length];
          var avecol=parseFloat(c.AVE)>=0.5?'#34d399':parseFloat(c.AVE)>=0.4?'#fbbf24':'#f87171';
          var crcol=parseFloat(c.CR)>=0.7?'#34d399':parseFloat(c.CR)>=0.6?'#fbbf24':'#f87171';
          var alphacol=parseFloat(c.alpha)>=0.7?'#34d399':parseFloat(c.alpha)>=0.6?'#fbbf24':'#f87171';
          var valid=parseFloat(c.AVE)>=0.5&&parseFloat(c.CR)>=0.7;
          html+='<tr>';
          html+='<td class="td-label" style="color:'+col+';font-weight:700">'+c.name+'</td>';
          html+='<td class="td-num">'+c.nIndics+'</td>';
          html+='<td class="td-num" style="color:'+avecol+'">'+c.AVE+'</td>';
          html+='<td class="td-num" style="color:'+crcol+'">'+c.CR+'</td>';
          html+='<td class="td-num" style="color:'+alphacol+'">'+c.alpha+'</td>';
          html+='<td><span class="tag" style="font-size:9px;'+(valid?'background:rgba(52,211,153,.12);color:#34d399;border:1px solid rgba(52,211,153,.25)':'background:rgba(251,191,36,.1);color:#fbbf24;border:1px solid rgba(251,191,36,.25)')+'">'+(valid?'✓ Valid':'⚠ Check')+'</span></td>';
          html+='</tr>';
        });
        html+='</tbody></table></div>';
        html+='<div style="font-size:10px;color:rgba(232,222,255,.3);margin-top:4px;margin-bottom:12px">AVE ≥ 0.50 = convergent validity · CR ≥ 0.70 = construct reliability · AVE > r² between constructs = discriminant validity</div>';
      }
      // Factor loadings
      if(r.loadings&&r.loadings.length){
        html+='<div class="sec-hd" style="margin-bottom:8px">Standardized Factor Loadings (Measurement Model)</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th>Konstruk</th><th>Indikator</th><th>λ</th><th>h²</th><th>t-val*</th><th>Status</th></tr></thead><tbody>';
        r.loadings.forEach(function(row){
          var lamNum=parseFloat(row.lambda);
          var lamCol=lamNum>=0.7?'#34d399':lamNum>=0.5?'#a5f3fc':lamNum>=0.3?'#fbbf24':'#f87171';
          var lIdx=o.latents?o.latents.indexOf(row.construct):0;
          var col=semColsPal[lIdx>=0?lIdx%semColsPal.length:0];
          html+='<tr>';
          if(row.firstInConstruct) html+='<td class="td-label" rowspan="'+row.constructCount+'" style="color:'+col+';font-weight:800;vertical-align:top;padding-top:10px">'+row.construct+'</td>';
          html+='<td class="td-label">'+row.indicator+'</td>';
          html+='<td class="td-num" style="color:'+lamCol+';font-weight:'+(lamNum>=0.5?700:400)+'">'+row.lambda+'</td>';
          html+='<td class="td-num" style="color:'+(parseFloat(row.h2)>=0.4?'#a5f3fc':'#f87171')+'">'+row.h2+'</td>';
          html+='<td class="td-num" style="color:rgba(232,222,255,.5)">'+row.tvalue+'</td>';
          html+='<td><span class="tag" style="font-size:9px;'+(lamNum>=0.5?'background:rgba(52,211,153,.12);color:#34d399;border:1px solid rgba(52,211,153,.25)':'background:rgba(248,113,113,.1);color:#f87171;border:1px solid rgba(248,113,113,.2)')+'">'+( lamNum>=0.5?'✓ Adequate':'✗ Weak' )+'</span></td>';
          html+='</tr>';
        });
        html+='</tbody></table></div>';
        html+='<div style="font-size:10px;color:rgba(232,222,255,.3);margin-top:4px;margin-bottom:12px">*Estimasi t-val; t > 1.96 = p < .05 &nbsp;·&nbsp; λ ≥ 0.70 strong · ≥ 0.50 adequate</div>';
      }
      // Structural paths
      if(r.paths&&r.paths.length){
        html+='<div class="sec-hd" style="margin-bottom:8px">Structural Path Coefficients</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th>Dari</th><th>→ Ke</th><th>β (Std)</th><th>SE</th><th>t</th><th>p</th><th>Sig</th><th>Interpretasi</th></tr></thead><tbody>';
        r.paths.forEach(function(p){
          var betaNum=parseFloat(p.beta);
          var bcol=Math.abs(betaNum)>=0.3?'#34d399':Math.abs(betaNum)>=0.1?'#fbbf24':'#f87171';
          var psig=parseFloat(p.p)<0.05;
          var fromIdx=o.latents?o.latents.indexOf(p.from):0;
          var toIdx=o.latents?o.latents.indexOf(p.to):1;
          html+='<tr>';
          html+='<td class="td-label" style="color:'+semColsPal[fromIdx>=0?fromIdx%semColsPal.length:0]+';font-weight:700">'+p.from+'</td>';
          html+='<td class="td-label" style="color:'+semColsPal[toIdx>=0?toIdx%semColsPal.length:1]+';font-weight:700">'+p.to+'</td>';
          html+='<td class="td-num" style="color:'+bcol+';font-weight:700">'+p.beta+'</td>';
          html+='<td class="td-num" style="color:rgba(232,222,255,.5)">'+p.se+'</td>';
          html+='<td class="td-num">'+p.t+'</td>';
          html+='<td class="td-num" style="color:'+(psig?'#34d399':'#f87171')+'">'+(psig?'<b>':'')+p.p_fmt+(psig?'</b>':'')+'</td>';
          html+='<td>'+sigBadge(p.p)+'</td>';
          html+='<td style="font-size:11px;color:rgba(232,222,255,.55)">'+p.interpretation+'</td>';
          html+='</tr>';
        });
        html+='</tbody></table></div>';
        html+='<div style="font-size:10px;color:rgba(232,222,255,.3);margin-top:4px;margin-bottom:12px">β = standardized path coefficient · |β| ≥ .30 = medium effect · |β| ≥ .50 = large effect</div>';
      }
      // Indirect effects
      if(r.indirectEffects&&r.indirectEffects.length){
        html+='<div class="sec-hd" style="margin-bottom:8px">Indirect Effects (Mediasi via Konstruk Laten)</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th>X</th><th>M (Mediator)</th><th>Y</th><th>Indirect β</th><th>95% CI</th><th>Sig</th></tr></thead><tbody>';
        r.indirectEffects.forEach(function(ie){
          var ciSig=parseFloat(ie.ci_lo)>0||parseFloat(ie.ci_hi)<0;
          html+='<tr>';
          html+='<td class="td-label" style="color:'+semColsPal[0]+';font-weight:700">'+ie.x+'</td>';
          html+='<td class="td-label" style="color:'+semColsPal[2]+'">'+ie.m+'</td>';
          html+='<td class="td-label" style="color:'+semColsPal[1]+';font-weight:700">'+ie.y+'</td>';
          html+='<td class="td-num" style="color:'+(Math.abs(parseFloat(ie.indirect))>=0.1?'#34d399':'#fbbf24')+'">'+ie.indirect+'</td>';
          html+='<td class="td-num" style="font-size:11px;color:'+(ciSig?'#34d399':'#f87171')+'">['+ie.ci_lo+', '+ie.ci_hi+']</td>';
          html+='<td><span class="tag" style="font-size:9px;'+(ciSig?'background:rgba(52,211,153,.12);color:#34d399;border:1px solid rgba(52,211,153,.25)':'background:rgba(248,113,113,.1);color:#f87171;border:1px solid rgba(248,113,113,.2)')+'">'+(ciSig?'✓ Signifikan':'n.s.')+'</span></td>';
          html+='</tr>';
        });
        html+='</tbody></table></div>';
        html+='<div style="font-size:10px;color:rgba(232,222,255,.3);margin-top:4px;margin-bottom:12px">CI tidak mencakup 0 → indirect effect signifikan (mediasi terbukti)</div>';
      }
      // lavaan syntax
      if(o.latents&&o.latentMap&&o.paths!==undefined){
        html+='<div class="sec-hd" style="margin-bottom:6px">lavaan / AMOS Syntax</div>';
        html+='<textarea class="syn-area" readonly style="min-height:120px;color:#a5f3fc;font-size:10.5px">'+generateLavaanSyntax(o.latents,o.latentMap,o.paths)+'</textarea>';
      }
      // Interpretation
      html+='<div class="assump" style="margin-top:10px"><b style="color:#e879f9">Interpretasi SEM:</b> '+r.overallFit+'. '
        +(r.CFI_raw>=0.95&&r.RMSEA_raw<=0.06?'Model fit sangat baik (Good Fit). Konstruk laten valid dan reliable. ':'')
        +(r.CFI_raw<0.90||r.RMSEA_raw>0.08?'Model perlu modifikasi. Cek MI (Modification Indices) dan pertimbangkan re-specification. ':'')
        +'Reference: Hu & Bentler (1999); Hair et al. (2010) untuk SEM cut-off criteria.</div>';
    }


        else if(o.type==='mediation'){
      var r=o.res;
      var medTypeColor={'Full Mediation':'#34d399','Partial Mediation':'#fbbf24','No Mediation':'#f87171','Inconsistent/Suppression':'#a78bfa'}[r.medType]||'#c084fc';
      // Conclusion badge
      html+='<div style="margin-bottom:12px;padding:10px 14px;border-radius:9px;border:1px solid '+medTypeColor+';background:rgba('+medTypeColor.replace('#','')+',0.06)">';
      html+='<span style="font-size:13px;font-weight:800;color:'+medTypeColor+'">'+r.medType+'</span>';
      html+='<span style="font-size:11.5px;color:rgba(232,222,255,.6);margin-left:10px">n='+r.n+' · X: '+r.xName+' → ['+r.mNames.join(', ')+'] → Y: '+r.yName+'</span>';
      html+='</div>';

      // Path diagram
      html+='<div style="text-align:center;margin-bottom:12px">'+svgMediationPath(r.xName,r.mNames,r.yName,r)+'</div>';

      // Baron-Kenny table
      var bk=r.barronKenny;
      html+='<div style="font-size:11px;font-weight:700;color:#c084fc;margin-bottom:6px;text-transform:uppercase;letter-spacing:.7px">Baron-Kenny Causal Steps</div>';
      html+=mkTable(
        ['Step','Path','Coef','p','Sig'],
        [
          ['Step 1','X → Y (total c)', bk.c, SE.pFmt?SE.pFmt(parseFloat(bk.p_c)):parseFloat(bk.p_c).toFixed(3), parseFloat(bk.p_c)<0.05?'*':''],
          ['Step 2','X → M (path a)', bk.a, SE.pFmt?SE.pFmt(parseFloat(bk.p_a)):parseFloat(bk.p_a).toFixed(3), parseFloat(bk.p_a)<0.05?'*':''],
          ['Step 3','M → Y (path b)', bk.b, SE.pFmt?SE.pFmt(parseFloat(bk.p_b)):parseFloat(bk.p_b).toFixed(3), parseFloat(bk.p_b)<0.05?'*':''],
          ["Step 4","X → Y (direct c')", bk.c_prime, SE.pFmt?SE.pFmt(parseFloat(bk.p_c_prime)):parseFloat(bk.p_c_prime).toFixed(3), parseFloat(bk.p_c_prime)<0.05?'*':'n.s.'],
        ]
      );

      // Sobel + Bootstrap per mediator
      html+='<div style="margin-top:12px;font-size:11px;font-weight:700;color:#c084fc;margin-bottom:6px;text-transform:uppercase;letter-spacing:.7px">Indirect Effect(s)</div>';
      var bootRows=r.mediators.map(function(med,i){
        var boot=r.bootResults&&r.bootResults[i];
        var ci=boot?('['+boot.lo+', '+boot.hi+']'):'—';
        var ciSig=boot?boot.sig:null;
        return [
          med.name,
          SE.f4(med.indirect),
          SE.f4(med.sobel_z),
          parseFloat(med.sobel_p).toFixed(3),
          parseFloat(med.sobel_p)<0.05?'*':'',
          ci,
          ciSig===null?'—':(ciSig?'<span style="color:#34d399">Sig (CI ≠ 0)</span>':'<span style="color:#f87171">n.s. (CI ∋ 0)</span>'),
        ];
      });
      var bootHdr=['Mediator','Indirect (a×b)','Sobel z','p (Sobel)','Sig','Boot 95% CI','Boot Sig'];
      html+='<div class="tbl-wrap"><table><thead><tr>'+bootHdr.map(function(h){return '<th>'+h+'</th>';}).join('')+'</tr></thead><tbody>';
      bootRows.forEach(function(row){
        html+='<tr>'+row.map(function(c,ci){
          return '<td class="'+(ci===0?'td-label':'td-num')+'">'+c+'</td>';
        }).join('')+'</tr>';
      });
      html+='</tbody></table></div>';

      html+='<div style="margin-top:10px;font-size:11.5px;color:rgba(232,222,255,.45)">* p &lt; .05. Total indirect effect: '+r.totalIndirect+' · Model R² (M+X→Y): '+r.r2_total+'</div>';
    }

    else if(o.type==='discriminant'&&o.res){
      var r=o.res;
      var accCol=parseFloat(r.accuracy)>=70?'#34d399':parseFloat(r.accuracy)>=50?'#fbbf24':'#f87171';
      html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:6px;margin-bottom:12px">';
      html+='<div class="sb"><div class="sb-label">N</div><div class="sb-value">'+r.n+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Groups</div><div class="sb-value">'+r.groups.length+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Functions</div><div class="sb-value">'+r.nFunctions+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Wilks\' λ</div><div class="sb-value">'+r.wilksLambda+'</div><div class="sb-note">p = '+r.wilksP+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Accuracy</div><div class="sb-value" style="color:'+accCol+'">'+r.accuracy+'%</div></div>';
      html+='</div>';
      html+=mkTable(['Function','Eigenvalue','% Var','Cumul %','Canonical r'],
        r.eigenvalues.map(function(e,i){return ['Function '+(i+1),e.eigenvalue,e.pctVar+'%',e.cumPct+'%',e.canonicalR];}));
      html+='<div style="margin-top:10px;font-size:11px;font-weight:700;color:#38bdf8;margin-bottom:5px">Standardized Coefficients</div>';
      var scHeader=['Predictor'].concat(r.eigenvalues.map(function(_,i){return 'Function '+(i+1);}));
      html+=mkTable(scHeader, r.preds.map(function(p,pi){return [p].concat(r.stdCoefs.map(function(fc){return fc[pi];}));}));
      html+='<div style="margin-top:10px;font-size:11px;font-weight:700;color:#38bdf8;margin-bottom:5px">Structure Matrix</div>';
      html+=mkTable(scHeader, r.preds.map(function(p,pi){return [p].concat(r.structureMatrix.map(function(fc){return fc[pi];}));}));
      html+='<div style="margin-top:6px;font-size:10px;color:rgba(232,222,255,.35)">|r| ≥ .30 = practically significant. Classification accuracy: '+r.accuracy+'%</div>';
    }

    else if(o.type==='cluster'&&o.res){
      var r=o.res;
      var silCol=r.silhouette>=0.5?'#34d399':r.silhouette>=0.25?'#fbbf24':'#f87171';
      var silLabel=r.silhouette>=0.7?'Strong':r.silhouette>=0.5?'Reasonable':r.silhouette>=0.25?'Weak':'Poor';
      html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:6px;margin-bottom:12px">';
      html+='<div class="sb"><div class="sb-label">Method</div><div class="sb-value" style="font-size:11px">'+( r.method==='kmeans'?'K-Means':'Hierarchical')+'</div></div>';
      html+='<div class="sb"><div class="sb-label">k Clusters</div><div class="sb-value" style="color:#4ade80">'+r.k+'</div></div>';
      html+='<div class="sb"><div class="sb-label">N Cases</div><div class="sb-value">'+r.n+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Silhouette</div><div class="sb-value" style="color:'+silCol+'">'+r.silhouette+'</div><div class="sb-note">'+escHtml(silLabel)+'</div></div>';
      if(r.method==='kmeans'){
        html+='<div class="sb"><div class="sb-label">Within SS</div><div class="sb-value">'+r.totalWSS+'</div></div>';
        html+='<div class="sb"><div class="sb-label">Between SS</div><div class="sb-value">'+r.totalBSS+'</div></div>';
      } else {
        html+='<div class="sb"><div class="sb-label">Linkage</div><div class="sb-value" style="font-size:11px">'+r.linkage+'</div></div>';
      }
      html+='</div>';
      html+='<div style="font-size:11px;font-weight:700;color:#4ade80;margin-bottom:6px">Cluster Centroids (raw means)</div>';
      var cHeader=['Cluster','N','%'].concat(r.vars);
      html+=mkTable(cHeader, r.clusters.map(function(c){return [c.label,c.n,c.pct+'%'].concat(c.rawMeans);}));
      if(r.plotData){
        html+='<div style="margin-top:10px">'+svgClusterPlot(r)+'</div>';
      }
      if(r.method==='kmeans'&&r.elbowData){
        html+='<div style="margin-top:8px;font-size:11px;font-weight:700;color:#4ade80;margin-bottom:4px">Elbow Chart</div>';
        html+=svgElbow(r.elbowData);
      }
      if(r.method==='hierarchical'&&r.dendro){
        html+='<div style="margin-top:8px;font-size:11px;font-weight:700;color:#4ade80;margin-bottom:4px">Dendrogram</div>';
        html+=svgDendrogram(r.dendro,r.k,r.vars);
      }
      html+='<div style="margin-top:8px;font-size:11px;font-weight:700;color:#4ade80;margin-bottom:5px">ANOVA per Variable</div>';
      html+=mkTable(['Variable','F','df1','df2','p'],r.anova.map(function(a){var sig=parseFloat(a.p)<0.05;return [a.variable,a.F,a.df1,a.df2,(sig?'<b style="color:#34d399">':'')+a.p_fmt+(sig?'</b>':'')];}));
      html+='<div style="margin-top:6px;font-size:10px;color:rgba(232,222,255,.35)">Silhouette ≥ .50 = reasonable cluster structure. Variables z-standardized before clustering.</div>';
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
      html+='<div><div style="font-size:14px;font-weight:800;color:'+aucCol2+';font-family:Playfair Display,serif">'+r.aucInterp+'</div><div style="font-size:11px;color:rgba(232,222,255,.5);margin-top:2px">'+o.rocProb+' → '+o.rocTrue+' (pos: '+r.posClass+')</div></div>';
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
      html+='<div style="font-size:11px;color:rgba(232,222,255,.5);margin-top:3px">Time: '+o.survTime+' · Event: '+o.survEvent+(o.survGroup?' · Group: '+o.survGroup:'')+'</div>';
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
          r.groups.map(function(g){return[g.label,g.n,g.events,g.n-g.events,g.medianSurv===null?'NR':SE.f4(g.medianSurv),g.oe];}));
        html+='<div style="margin-top:9px;padding:9px 12px;background:rgba(124,58,237,.08);border-radius:8px;border:1px solid rgba(124,58,237,.18);font-size:11.5px;color:rgba(232,222,255,.7)">'+lr.interpretation+'</div>';
        html+='</div>';
      }
    }

    else if(o.type==='cox'&&o.res){
      var r=o.res;
      var cC=parseFloat(r.concordance)>=0.8?'#34d399':parseFloat(r.concordance)>=0.7?'#fbbf24':'#f87171';
      html+='<div style="margin-bottom:11px;padding:10px 14px;border-radius:9px;border:1px solid rgba(74,222,128,.3);background:rgba(74,222,128,.06);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap">';
      html+='<div><div style="font-size:13px;font-weight:800;color:#4ade80;font-family:Playfair Display,serif">Cox Proportional Hazards</div><div style="font-size:11px;color:rgba(232,222,255,.5);margin-top:2px">N='+r.n+' · Events='+r.events+' · Covariates: '+r.covariates.join(', ')+'</div></div>';
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
          return[c.name,c.beta,c.se,'<b style="color:'+hrCol+'">'+c.HR+'</b>',c.ci95,c.z,(sig?'<b style="color:#34d399">':'')+c.p_fmt+(sig?'</b>':'')];
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
      html+=stCard('n₁',r.n1,'Group '+(o.ga||'A'));
      html+=stCard('n₂',r.n2,'Group '+(o.gb||'B'));
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
      html+='<div style="font-size:11.5px;color:rgba(232,222,255,.5);margin-top:3px">Variable: '+r.variable+' · N = '+r.n+'</div>';
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
        html+='<tr><td class="td-label">'+s.name+'</td>';
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
      html+=svgFunnelPlot(o.studies||[],r);
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
  html+='<div style="font-size:11px;color:rgba(232,222,255,.5);margin-top:2px">'+r.xName+'&#xD7;'+r.wName+' &#x2192; '+r.yName+' &#xB7; N='+r.n+(r.center?' (mean-centered)':'')+'</div></div>';
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
    html+='<tr><td class="td-label">'+c.name+'</td><td class="td-num">'+c.b+'</td><td class="td-num">'+c.SE+'</td><td class="td-num">'+c.beta+'</td><td class="td-num">'+c.t+'</td><td><span class="tag '+(sig?'tag-green':'tag-gray')+'">'+c.p_fmt+'</span></td></tr>';
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
      r.jn.regions.forEach(function(rp,i){html+='<tr><td class="td-label">JN-'+(i+1)+'</td><td class="td-num">'+SE.f4(rp.value)+'</td><td style="color:#c084fc;font-size:11px">'+rp.direction+'</td><td class="td-num">'+SE.f4(rp.pct)+'%</td></tr>';});
      html+='</tbody></table></div>';
    } else {
      html+='<div style="font-size:11px;color:rgba(232,222,255,.55);margin-top:5px">No JN transition points found. '+SE.f4(r.jn.pctSig)+'% of W range shows significant X&#x2192;Y relationship.</div>';
    }
  }
  html+='<div class="assump" style="margin-top:12px"><b style="color:#e879f9">Interpretation:</b> '+(intSig2?'Significant':'Non-significant')+' interaction b(X&#xD7;W)='+r.interaction.b+', t='+r.interaction.t+', p='+r.interaction.p_fmt+', &#x394;R&#xB2;='+r.deltaR2+'. '+(intSig2?'The effect of '+r.xName+' on '+r.yName+' is moderated by '+r.wName+'. Examine simple slopes and JN plot for regions of significance.':'The effect of '+r.xName+' on '+r.yName+' does not significantly differ across levels of '+r.wName+'.')+'</div>';
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
function pFmt(p){
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
        ['p',pFmt(r.p)],
        ["Cohen's d",r.cohensD+' ('+r.dInterp+')'],
        ['95% CI',r.ci95],
      ]
    ));
    lines.push('');
    lines.push('  Note. '+sigStar(r.p)+' = significant. * p < .05. ** p < .01. *** p < .001.');
    if(o.lev) lines.push('  Levene\'s test for equality of variances: F = '+o.lev.F+', p '+pFmt(o.lev.p_fmt)+'.');
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
        ['p',pFmt(r.p)],
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
        ['p',pFmt(r.p)],
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
        ['Between',r.dfB,r.ssB,r.msB,r.F+sigStar(r.p),pFmt(r.p),r.eta2],
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
        lines.push('    '+ph.a+' vs '+ph.b+': diff = '+ph.diff+', p '+pFmt(ph.p_fmt||ph.p)+' '+sigStar(ph.p_fmt||ph.p));
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
      [[o.crX+' × '+o.crY, r.r+sigStar(r.p), r.r2, pFmt(r.p), r.ci95]]
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
        [o.pcX+' × '+o.pcY+' (partial)',r.rp+sigStar(r.p),r.r2,pFmt(r.p),r.ci95],
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
      r.tests.map(function(t){return[t.root,t.rc,t.rc2,t.wilks,t.chiSq,t.df,pFmt(t.p_fmt),sigStar(t.p)];})
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
        ['Constant',r.b0,r.SEb0,r.tb0,pFmt(r.pb0_fmt),sigStar(r.pb0_fmt)],
        [o.xF+' (b₁)',r.b1,r.SEb1,r.tb1,pFmt(r.pb1_fmt),sigStar(r.pb1_fmt)],
      ]
    ));
    lines.push('');
    lines.push(txtTable(
      ['Model Fit','Value'],
      [['R²',r.R2],['Adj R²',r.R2adj],['F',r.F],['p',pFmt(r.pF_fmt)],['RMSE',r.RMSE]]
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
    var predRows=[['Constant',r.b0,r.SEb0||'—',r.t0||'—',pFmt(r.p0_fmt||'1'),sigStar(r.p0_fmt||'1')]];
    if(r.predictors) r.predictors.forEach(function(pr){
      predRows.push([pr.name,pr.b,pr.se,pr.t,pFmt(pr.p_fmt),sigStar(pr.p_fmt)]);
    });
    lines.push(txtTable(['Predictor','B','SE','t','p','Sig'],predRows));
    lines.push('');
    lines.push(txtTable(
      ['Model Fit','Value'],
      [['R²',r.R2],['Adj R²',r.R2adj],['F',r.F],['p',pFmt(r.pF_fmt)]]
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
        ['Shapiro-Wilk W',s.shapiroW],['Shapiro-Wilk p',pFmt(s.shapiroP)],
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
      [['U',r.U],['z',r.z],['p',pFmt(r.p_fmt)],['r (effect)',r.r_eff]]
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
      [['H',r.H],['df',r.df],['p',pFmt(r.p_fmt)]]
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
            (e.F||'—')+sigStar(e.p_fmt),pFmt(e.p_fmt),e.partialEta2||'—'];
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
                return[e.source,e.df,e.SS||'—',e.MS||'—',(e.F||'—')+sigStar(e.p_fmt),pFmt(e.p_fmt),e.eta2||'—'];
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
      [['KMO',r.kmo+' ('+r.kmoInterp+')'],['Bartlett χ²',r.chi2],['df',r.bartDf],['p',pFmt(r.bartP)]]
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
        ['Step 1 (c)',r.xName+' → '+r.yName,bk.c,pFmt(parseFloat(bk.p_c)),parseFloat(bk.p_c)<0.05?'Sig*':'n.s.'],
        ['Step 2 (a)',r.xName+' → '+r.mNames[0],bk.a,pFmt(parseFloat(bk.p_a)),parseFloat(bk.p_a)<0.05?'Sig*':'n.s.'],
        ['Step 3 (b)',r.mNames[0]+' → '+r.yName,bk.b,pFmt(parseFloat(bk.p_b)),parseFloat(bk.p_b)<0.05?'Sig*':'n.s.'],
        ["Step 4 (c')",r.xName+' → '+r.yName+' (direct)',bk.c_prime,pFmt(parseFloat(bk.p_c_prime)),parseFloat(bk.p_c_prime)<0.05?'Sig*':'n.s.'],
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
        (b.coefs||[]).map(function(c){return[c.name,c.B,c.SE,c.beta||'—',c.t,pFmt(c.p_fmt)+sigStar(c.p_fmt)];})
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
