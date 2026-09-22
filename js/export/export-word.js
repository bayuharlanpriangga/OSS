// Build & download a single output as .doc
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

// Build HTML for one output (mode: 'table'|'chart'|'both')
function _buildSingleOutputHTML(o, mode){
  var showTable=(mode==='table'||mode==='both');
  var showChart=(mode==='chart'||mode==='both');
  var html='';
  html+='<h2>'+_escHtml(o.title)+'</h2>';
  html+='<p class="meta">'+new Date(o.id).toLocaleString()+'</p>';

  if(showTable){
    if(o.type==='descriptive'&&o.stats){
      html+='<div class="section"><p><b>'+_escHtml(o.field)+'</b> &mdash; N='+o.stats.n+', Mean='+o.stats.mean+', SD='+o.stats.std+'</p></div>';
      html+=_wordTable(['Statistic','Value'],Object.entries(o.stats).map(function(kv){return[kv[0],String(kv[1])];}));
    }
    else if(o.type==='ttest'&&o.res){
      html+='<div class="section"><p><b>t('+o.res.df+') = '+o.res.t+'</b>, p = '+o.res.p_fmt+", Cohen's d = "+o.res.cohensD+' ('+o.res.dInterp+')</p></div>';
      html+=_wordTable(['','Group A ('+(o.ga||'')+')', 'Group B ('+(o.gb||'')+')'],
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
      if(o.res.coefs){
        html+=_wordTable(['Variable','B','SE','β','t','p','VIF'],
          o.res.coefs.map(function(c,ci){return[c.name,c.B,c.SE,ci===0?'—':c.beta,c.t,c.p_fmt,ci===0?'—':(o.res.vif?o.res.vif[ci-1]:'—')];}));
      } else {
        // regresi sederhana (SE.linearReg) mengembalikan b0/b1, bukan coefs[]
        html+=_wordTable(['Variable','B','SE','t','p'],[['Constant',o.res.b0,o.res.SEb0,o.res.tb0,o.res.pb0_fmt],[o.xF||'Slope (b₁)',o.res.b1,o.res.SEb1,o.res.tb1,o.res.pb1_fmt]]);
      }
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
        ['Between Groups',o.res.dfB,o.res.ssB,o.res.msB,o.res.F,o.res.p_fmt,o.res.eta2],
        ['Within Groups',o.res.dfW,o.res.ssW,o.res.msW,'','','']
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
    else if(o.type==='alpha'&&o.res){
      html+='<div class="section"><p><b>Cronbach α = '+o.res.alpha+'</b> ('+o.res.interp+') &mdash; k = '+o.res.k+' item, N = '+o.res.n+'</p></div>';
      if(o.res.itemStats&&o.res.itemStats.length){
        html+=_wordTable(['Item','r item-total','Alpha if deleted','Keterangan'],o.res.itemStats.map(function(it,i){return[(o.vars&&o.vars[i])||('Item '+(i+1)),it.rit,it.alphaIfDeleted,it.flag];}));
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
    else if(o.type==='onesamp'&&o.res){
      var os1=o.res;
      html+='<div class="section"><p><b>t('+os1.df+') = '+os1.t+'</b>, p = '+os1.p_fmt+", Cohen's d = "+os1.cohensD+' ('+os1.dInterp+')</p></div>';
      html+=_wordTable(['Statistic','Value'],[['N',os1.n],['Mean',os1.mean],['SD',os1.sd],['SE',os1.se],['Test Value (μ₀)',os1.mu0],['Mean Difference',os1.meanDiff],['t',os1.t],['df',os1.df],['p',os1.p_fmt],["Cohen's d",os1.cohensD+' ('+os1.dInterp+')'],['95% CI (Mean)',os1.ci95],['95% CI (Difference)',os1.ciDiff]]);
      if(os1.conclusion) html+='<p>'+_escHtml(os1.conclusion)+'</p>';
    }
    else if(o.type==='mannwhitney'&&o.res){
      var mw1=o.res;
      html+='<div class="section"><p><b>U = '+mw1.U+'</b>, z = '+mw1.z+', p = '+mw1.p_fmt+', r = '+mw1.r_eff+'</p></div>';
      html+=_wordTable(['','Group A ('+(o.ga||'')+')','Group B ('+(o.gb||'')+')'],[['N',mw1.nA,mw1.nB],['Median',mw1.medA,mw1.medB]]);
      html+=_wordTable(['Statistic','Value'],[['U',mw1.U],['U₁',mw1.U1],['U₂',mw1.U2],['z',mw1.z],['p',mw1.p_fmt],['Effect size r',mw1.r_eff],['Method',mw1.method]]);
    }
    else if(o.type==='kruskal'&&o.res){
      var kw1=o.res;
      html+='<div class="section"><p><b>H('+kw1.df+') = '+kw1.H+'</b>, p = '+kw1.p_fmt+', η² = '+kw1.eta2+'</p></div>';
      html+=_wordTable(['Group','N','Median','Mean'],(kw1.groupStats||[]).map(function(g){return[g.label,g.n,g.median,g.mean];}));
      html+=_wordTable(['Statistic','Value'],[['H',kw1.H],['df',kw1.df],['p',kw1.p_fmt],['η²',kw1.eta2]]);
    }
    else if(o.type==='wilcoxon'&&o.res){
      var wx1=o.res;
      html+='<div class="section"><p><b>W = '+wx1.W+'</b>, z = '+wx1.z+', p = '+wx1.p_fmt+', r = '+wx1.r_eff+'</p></div>';
      html+=_wordTable(['Statistic','Value'],[['N',wx1.n],['W',wx1.W],['W+',wx1.Wplus],['W−',wx1.Wminus],['z',wx1.z],['p',wx1.p_fmt],['Effect size r',wx1.r_eff],['Method',wx1.method]]);
    }
    else if(o.type==='partialCorr'&&o.res){
      var pc1=o.res;
      html+='<div class="section"><p><b>r<sub>p</sub> = '+pc1.rp+'</b>, p = '+pc1.p_fmt+' &mdash; '+pc1.strength+(o.pcZ?' (controlling for '+_escHtml(o.pcZ)+')':'')+'</p></div>';
      html+=_wordTable(['Statistic','Value'],[['Partial r',pc1.rp],['r²',pc1.r2],['t',pc1.t],['df',pc1.df],['p',pc1.p_fmt],['95% CI',pc1.ci95],['N',pc1.n],['Zero-order r (X, Y)',pc1.rxy],['Zero-order r (X, Z)',pc1.rxz],['Zero-order r (Y, Z)',pc1.ryz]]);
    }
    else if(o.type==='kappa'&&o.res){
      var kp1=o.res;
      html+='<div class="section"><p><b>Cohen\'s κ = '+kp1.kappa+'</b> ('+kp1.interp+'), z = '+kp1.z+', p = '+kp1.pFmt+(o.weighted?' &mdash; weighted κ = '+kp1.wKappa+' ('+kp1.interpW+')':'')+'</p></div>';
      html+=_wordTable(['Statistic','Value'],[["Cohen's κ",kp1.kappa],['SE',kp1.seK],['z',kp1.z],['p',kp1.pFmt],['95% CI',kp1.ci95lo+' – '+kp1.ci95hi],['Observed agreement (Po)',kp1.po],['Expected agreement (Pe)',kp1.pe],['N',kp1.n],['Categories',kp1.k],['Weighted κ',kp1.wKappa]]);
      if(kp1.cats&&kp1.mat){
        html+='<h3>Agreement Matrix ('+_escHtml((o.vars&&o.vars[0])||'Rater 1')+' × '+_escHtml((o.vars&&o.vars[1])||'Rater 2')+')</h3>';
        var kpRows=kp1.mat.map(function(row,i){return[kp1.cats[i]].concat(row,[kp1.rowSum?kp1.rowSum[i]:'']);});
        if(kp1.colSum) kpRows.push(['Total'].concat(kp1.colSum,[kp1.n]));
        html+=_wordTable(['Category'].concat(kp1.cats,['Total']),kpRows);
      }
      if(kp1.catStats&&kp1.catStats.length){
        html+=_wordTable(['Category','N','TP','FP','FN','Precision','Recall'],kp1.catStats.map(function(c){return[c.cat,c.n,c.tp,c.fp,c.fn,c.precision,c.recall];}));
      }
    }
    else if((o.type==='anova2'||o.type==='anova3')&&o.res){
      var an1=o.res;
      html+='<p><b>Dependent Variable:</b> '+_escHtml(an1.depVar)+' &nbsp;&bull;&nbsp; N = '+an1.n+'</p>';
      var anRows=(an1.effects||[]).map(function(e){return[e.source,e.df,e.SS,e.MS,e.F,e.p_fmt,e.eta2,e.pEta2];});
      if(an1.error) anRows.push(['Error',an1.error.df,an1.error.SS,an1.error.MS,'','','','']);
      if(an1.total) anRows.push(['Total',an1.total.df,an1.total.SS,'','','','','']);
      html+=_wordTable(['Source','df','SS','MS','F','p','η²','Partial η²'],anRows);
      [['meanA',an1.factorA],['meanB',an1.factorB],['meanC',an1.factorC]].forEach(function(mf){
        if(an1[mf[0]]&&an1[mf[0]].length){
          html+='<h3>Marginal Means: '+_escHtml(mf[1])+'</h3>';
          html+=_wordTable(['Level','N','Mean'],an1[mf[0]].map(function(m){return[m.level,m.n,m.mean];}));
        }
      });
    }
    else if(o.type==='glm'&&o.res){
      var gl1=o.res;
      html+='<p><b>Dependent Variable:</b> '+_escHtml(gl1.depVar)+' &nbsp;&bull;&nbsp; R² = '+gl1.R2+', Adj R² = '+gl1.R2adj+', N = '+gl1.n+'</p>';
      html+=_wordGlmEffectsTable(gl1);
    }
    else if((o.type==='poisson'||o.type==='negbin')&&o.res){
      var pn1=o.res;
      html+='<p><b>Dependent Variable:</b> '+_escHtml(o.depVar||'')+' &nbsp;&bull;&nbsp; N = '+pn1.n+(pn1.converged===false?' &nbsp;&bull;&nbsp; <b>Model tidak konvergen</b>':'')+'</p>';
      html+=_wordTable(['Variable','B','SE','z','p','IRR','95% CI IRR'],(pn1.coefs||[]).map(function(c){return[c.name,c.b,c.se,c.z,c.p,c.irr,c.irrCI];}));
      var pnRows=[['Log-likelihood',pn1.logLik]];
      if(pn1.nullLogLik!==undefined) pnRows.push(['Null log-likelihood',pn1.nullLogLik]);
      if(pn1.deviance!==undefined) pnRows.push(['Deviance (df = '+pn1.df_res+')',pn1.deviance]);
      if(pn1.nullDeviance!==undefined) pnRows.push(['Null deviance (df = '+pn1.df_null+')',pn1.nullDeviance]);
      if(pn1.theta!==undefined) pnRows.push(['Theta (θ)',pn1.theta]);
      if(pn1.dispersion!==undefined) pnRows.push(['Dispersion',pn1.dispersion]);
      if(pn1.pearsonDispersion!==undefined) pnRows.push(['Pearson dispersion',pn1.pearsonDispersion]);
      pnRows.push(['LR χ² (df = '+pn1.lrDf+')',pn1.lrChi2],['LR p',pn1.lrP],['McFadden R²',pn1.mcFaddenR2]);
      html+=_wordTable(['Model Fit','Value'],pnRows);
      (pn1.warnings||[]).forEach(function(w){html+='<p style="color:#b45309">⚠ '+_escHtml(w)+'</p>';});
    }
    else if(o.type==='repeated'&&o.res){
      var rp1=o.res;
      html+='<div class="section"><p><b>t('+rp1.df+') = '+rp1.t+'</b>, p = '+rp1.p_fmt+", Cohen's d = "+rp1.cohensD+' ('+rp1.dInterp+')</p></div>';
      html+=_wordTable(['Statistic','Value'],[['N',rp1.n],['Mean Diff',rp1.meanDiff],['SD Diff',rp1.sdDiff],['SE Diff',rp1.seDiff],['t',rp1.t],['df',rp1.df],['p',rp1.p_fmt],["Cohen's d",rp1.cohensD+' ('+rp1.dInterp+')'],['95% CI',rp1.ci95],['Normality (differences)',rp1.normD]]);
    }
    else if(o.type==='canonicalCorr'&&o.res){
      var cc1=o.res;
      html+='<h3>Test of Canonical Roots</h3>';
      html+=_wordTable(['Root','Canonical r','r²','Wilks Λ','χ²','df','p'],(cc1.tests||[]).map(function(t){return[t.root,t.rc,t.rc2,t.wilks,t.chiSq,t.df,t.p_fmt];}));
      [['X-set Canonical Coefficients',cc1.xCoefs,'coefs'],['Y-set Canonical Coefficients',cc1.yCoefs,'coefs'],['X-set Loadings',cc1.xLoadings,'loadings'],['Y-set Loadings',cc1.yLoadings,'loadings']].forEach(function(blk){
        if(blk[1]&&blk[1].length){
          var ccHead=['Variable'];
          for(var ci2=1;ci2<=blk[1][0][blk[2]].length;ci2++) ccHead.push('Root '+ci2);
          html+='<h3>'+blk[0]+'</h3>';
          html+=_wordTable(ccHead,blk[1].map(function(v){return[v.name].concat(v[blk[2]]);}));
        }
      });
    }
    else if(o.type==='manova'&&o.res){
      var mv1=o.res;
      html+='<p><b>Factor:</b> '+_escHtml(mv1.factor)+' &nbsp;&bull;&nbsp; N = '+mv1.n+', groups = '+mv1.g+'</p>';
      html+='<h3>Multivariate Tests</h3>';
      html+=_wordTable(['Test','Value','F','df1','df2','p'],[["Pillai's Trace",mv1.pillai],["Wilks' Lambda",mv1.wilks],["Hotelling's Trace",mv1.hotelling],["Roy's Largest Root",mv1.roy]].map(function(tv){var s=tv[1]||{};return[tv[0],s.stat,s.F,s.df1,s.df2,s.p_fmt];}));
      if(mv1.pillaiEta2!==undefined) html+='<p>Partial η² (Pillai) = '+mv1.pillaiEta2+'</p>';
      if(mv1.boxM!==undefined) html+='<p>Box\'s M = '+mv1.boxM+', p = '+mv1.boxP+'</p>';
      if(mv1.groupMeans&&mv1.groupMeans.length){
        html+='<h3>Group Means</h3>';
        html+=_wordTable(['Group','N'].concat(mv1.depVars||[]),mv1.groupMeans.map(function(gm){return[gm.key,gm.n].concat(gm.means);}));
      }
      (mv1.univariate||[]).forEach(function(u){
        if(u&&u.res){ html+='<h3>Univariate: '+_escHtml(u.dv)+'</h3>'; html+=_wordGlmEffectsTable(u.res); }
      });
    }
    else if(o.type==='hlm'&&o.res){
      var hl1=o.res;
      html+='<div class="section"><p><b>ICC = '+hl1.ICC+'</b>, F = '+hl1.F+', p = '+hl1.p_fmt+', design effect = '+hl1.design_effect+'</p></div>';
      html+=_wordTable(['Statistic','Value'],[['Dependent Variable',o.dep],['Grouping Variable',o.group],['N',hl1.n],['Groups (k)',hl1.k],['Grand Mean',hl1.grandMean],['ICC',hl1.ICC],['Variance Between',hl1.varBetween],['Variance Within',hl1.varWithin],['MS Between',hl1.MSB],['MS Within',hl1.MSW],['F',hl1.F],['p',hl1.p_fmt],['Design Effect',hl1.design_effect]]);
      if(hl1.grpStats&&hl1.grpStats.length){
        html+=_wordTable(['Group','N','Mean','SD'],hl1.grpStats.map(function(g){return[g.group,g.n,g.mean,g.sd];}));
      }
    }
    else if(o.res&&typeof o.res==='object'){
      // Tipe lain (EFA, CFA, SEM, mediasi, survival, ROC, Bayes, dst.) & tipe baru di masa depan
      html+=_wordGenericRes(o.res);
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

// Helper tabel GLM (dipakai cabang 'glm' & univariat MANOVA)
function _wordGlmEffectsTable(g){
  var rows=(g.effects||[]).map(function(e){return[e.source,e.df,e.SS,e.MS,e.F,e.p_fmt,e.partialEta2];});
  rows.push(['Error',g.dfError,g.ssError,g.msError,'','','']);
  rows.push(['Total',(g.n-1),g.ssTot,'','','','']);
  return _wordTable(['Source','df','SS','MS','F','p','Partial η²'],rows);
}

// - Fallback generik untuk tipe output tanpa cabang khusus -
// Membaca o.res apa adanya: nilai skalar → satu tabel Statistic/Value;
// array objek / matriks → tabel sendiri; objek bersarang (maks. 2 level)
// → label "induk › anak". Array angka panjang (>20) tidak dimuat.
function _wordFmtVal(v){
  if(v===null||v===undefined) return '—';
  if(typeof v==='number') return isFinite(v)?String(Math.round(v*10000)/10000):'—';
  if(typeof v==='boolean') return v?'Ya':'Tidak';
  return String(v);
}
function _wordGenericRes(res){
  var MAXROWS=50, MAXCOLS=12, MAXLIST=20;
  var scalars=[], tables=[];
  function isPrim(v){return v===null||typeof v==='string'||typeof v==='number'||typeof v==='boolean';}
  function isObj(x){return x&&typeof x==='object'&&!Array.isArray(x);}
  function walk(obj,path,depth){
    Object.keys(obj).forEach(function(k){
      var v=obj[k], label=path?path+' › '+k:k;
      if(k.charAt(0)==='_'||typeof v==='function'||v===undefined) return;
      if(isPrim(v)){ scalars.push([label,_wordFmtVal(v)]); return; }
      if(Array.isArray(v)){
        if(!v.length) return;
        if(v.every(isPrim)){
          scalars.push([label,v.length<=MAXLIST?v.map(_wordFmtVal).join(', '):'('+v.length+' nilai — tidak dimuat)']);
        } else if(v.every(isObj)){
          var cols=[];
          v.slice(0,50).forEach(function(x){Object.keys(x).forEach(function(c){if(cols.length<MAXCOLS&&cols.indexOf(c)<0&&isPrim(x[c]))cols.push(c);});});
          if(cols.length) tables.push({label:label,headers:cols,total:v.length,rows:v.slice(0,MAXROWS).map(function(x){return cols.map(function(c){return _wordFmtVal(x[c]);});})});
        } else if(v.every(function(x){return Array.isArray(x)&&x.every(isPrim);})){
          var w=Math.min(MAXCOLS,Math.max.apply(null,v.map(function(x){return x.length;})));
          var hd=['#']; for(var j=1;j<=w;j++) hd.push(String(j));
          tables.push({label:label,headers:hd,total:v.length,rows:v.slice(0,MAXROWS).map(function(x,i){return[String(i+1)].concat(x.slice(0,w).map(_wordFmtVal));})});
        }
        return;
      }
      if(isObj(v)&&depth<2) walk(v,label,depth+1);
    });
  }
  walk(res,'',0);
  var html='';
  if(scalars.length) html+=_wordTable(['Statistic','Value'],scalars);
  tables.forEach(function(t){
    html+='<h3>'+_escHtml(t.label)+'</h3>'+_wordTable(t.headers,t.rows);
    if(t.total>MAXROWS) html+='<p class="meta">Hanya '+MAXROWS+' dari '+t.total+' baris yang dimuat.</p>';
  });
  return html;
}

// Get chart SVG string for a given output
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

