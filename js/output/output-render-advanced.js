
// RENDER OUTPUT HLM
function renderOutAdv_hlm(o){
  var html='';
      var r=o.res;
      if(!r){ html+='<div style="color:#f87171">No HLM result.</div>'; }
      else if(r._err){ html+='<div style="color:#f87171">⚠ '+r._err+'</div>'; }
      else {
        var iccV=parseFloat(r.ICC);
        var iccColor=iccV<.05?'#34d399':iccV<.10?'#fbbf24':iccV<.25?'#f472b6':'#f87171';
        var iccLabel=iccV<.05?'Negligible clustering':iccV<.10?'Small – HLM recommended':iccV<.25?'Moderate – HLM important':'Strong – HLM essential';
        html+='<div class="stats-grid" style="margin-bottom:11px">';
        html+=stCard('ICC',r.ICC,'Intraclass Correlation')+stCard('Groups (k)',r.k,'Level-2 units');
        html+=stCard('N obs',r.n,'Level-1 units')+stCard('Grand Mean',r.grandMean,escHtml(o.dep));
        html+='</div>';
        html+='<div style="padding:10px 14px;border-radius:9px;border:1.5px solid '+iccColor+';background:rgba(124,58,237,.04);margin-bottom:11px">';
        html+='<div style="font-size:13px;font-weight:700;color:'+iccColor+'">ICC = '+r.ICC+'</div>';
        html+='<div style="font-size:11px;color:rgba(232,222,255,.55);margin-top:3px">'+iccLabel+'</div></div>';
        html+='<div class="stats-grid2" style="margin-bottom:11px">';
        html+=stCard('τ₀₀ (Between)',r.varBetween,'Level-2 variance')+stCard('σ² (Within)',r.varWithin,'Level-1 residual');
        html+=stCard('Design Effect',r.design_effect,'DEFF = 1+(ñ–1)·ICC')+stCard('F (null model)',r.F+(r.sig?' *':' ns'),'One-way ANOVA test');
        html+='</div>';
        if(r.grpStats&&r.grpStats.length){
          html+='<div class="sec-hd" style="font-size:11px;margin-bottom:6px">Group-Level Descriptives ('+escHtml(o.group)+')</div>';
          html+='<div class="tbl-wrap"><table><thead><tr><th>Group</th><th>n</th><th>Mean</th><th>SD</th></tr></thead><tbody>';
          r.grpStats.slice(0,20).forEach(function(g){
            html+='<tr><td class="td-str">'+escHtml(g.group)+'</td><td class="td-num">'+g.n+'</td><td class="td-num">'+g.mean+'</td><td class="td-num">'+g.sd+'</td></tr>';
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
  return html;
}

// RENDER OUTPUT ALPHA
function renderOutAdv_alpha(o){
  var html='';
      html+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:10px">'+stCard('Cronbach α',o.res.alpha,o.res.interp)+stCard('Items k',o.res.k)+stCard('Cases n',o.res.n)+'</div>';
      html+='<div class="row"><span class="tag '+(parseFloat(o.res.alpha)>=.7?'tag-green':'tag-red')+'">'+o.res.interp+' reliability</span></div>';
      html+='<div style="margin-top:8px;font-size:11px;color:#64748b">Items: '+o.vars.map(escHtml).join(' · ')+'</div>';
  return html;
}

// RENDER OUTPUT KAPPA
function renderOutAdv_kappa(o){
  var html='';
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
      html+='<div style="margin-top:8px;font-size:11px;color:#64748b">Rater 1: '+escHtml(o.vars[0])+' · Rater 2: '+escHtml(o.vars[1])+'</div>';
  return html;
}

// RENDER OUTPUT EFA
function renderOutAdv_efa(o){
  var html='';
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
  return html;
}

// RENDER OUTPUT CFA
function renderOutAdv_cfa(o){
  var html='';
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
  return html;
}

// RENDER OUTPUT SEM
function renderOutAdv_sem(o){
  var html='';
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
          html+='<td class="td-label" style="color:'+col+';font-weight:700">'+escHtml(c.name)+'</td>';
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
          if(row.firstInConstruct) html+='<td class="td-label" rowspan="'+row.constructCount+'" style="color:'+col+';font-weight:800;vertical-align:top;padding-top:10px">'+escHtml(row.construct)+'</td>';
          html+='<td class="td-label">'+escHtml(row.indicator)+'</td>';
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
          html+='<td class="td-label" style="color:'+semColsPal[fromIdx>=0?fromIdx%semColsPal.length:0]+';font-weight:700">'+escHtml(p.from)+'</td>';
          html+='<td class="td-label" style="color:'+semColsPal[toIdx>=0?toIdx%semColsPal.length:1]+';font-weight:700">'+escHtml(p.to)+'</td>';
          html+='<td class="td-num" style="color:'+bcol+';font-weight:700">'+p.beta+'</td>';
          html+='<td class="td-num" style="color:rgba(232,222,255,.5)">'+p.se+'</td>';
          html+='<td class="td-num">'+p.t+'</td>';
          html+='<td class="td-num" style="color:'+(psig?'#34d399':'#f87171')+'">'+(psig?'<b>':'')+p.p_fmt+(psig?'</b>':'')+'</td>';
          html+='<td>'+sigBadge(p.p)+'</td>';
          html+='<td style="font-size:11px;color:rgba(232,222,255,.55)">'+escHtml(p.interpretation)+'</td>';
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
          html+='<td class="td-label" style="color:'+semColsPal[0]+';font-weight:700">'+escHtml(ie.x)+'</td>';
          html+='<td class="td-label" style="color:'+semColsPal[2]+'">'+escHtml(ie.m)+'</td>';
          html+='<td class="td-label" style="color:'+semColsPal[1]+';font-weight:700">'+escHtml(ie.y)+'</td>';
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
        html+='<textarea class="syn-area" readonly style="min-height:120px;color:#a5f3fc;font-size:10.5px">'+escHtml(generateLavaanSyntax(o.latents,o.latentMap,o.paths))+'</textarea>';
      }
      // Interpretation
      html+='<div class="assump" style="margin-top:10px"><b style="color:#e879f9">Interpretasi SEM:</b> '+r.overallFit+'. '
        +(r.CFI_raw>=0.95&&r.RMSEA_raw<=0.06?'Model fit sangat baik (Good Fit). Konstruk laten valid dan reliable. ':'')
        +(r.CFI_raw<0.90||r.RMSEA_raw>0.08?'Model perlu modifikasi. Cek MI (Modification Indices) dan pertimbangkan re-specification. ':'')
        +'Reference: Hu & Bentler (1999); Hair et al. (2010) untuk SEM cut-off criteria.</div>';
  return html;
}

// RENDER OUTPUT MEDIATION
function renderOutAdv_mediation(o){
  var html='';
      var r=o.res;
      var medTypeColor={'Full Mediation':'#34d399','Partial Mediation':'#fbbf24','No Mediation':'#f87171','Inconsistent/Suppression':'#a78bfa'}[r.medType]||'#c084fc';
      // Conclusion badge
      html+='<div style="margin-bottom:12px;padding:10px 14px;border-radius:9px;border:1px solid '+medTypeColor+';background:rgba('+medTypeColor.replace('#','')+',0.06)">';
      html+='<span style="font-size:13px;font-weight:800;color:'+medTypeColor+'">'+r.medType+'</span>';
      html+='<span style="font-size:11.5px;color:rgba(232,222,255,.6);margin-left:10px">n='+r.n+' · X: '+escHtml(r.xName)+' → ['+r.mNames.map(function(m){return escHtml(m);}).join(', ')+'] → Y: '+escHtml(r.yName)+'</span>';
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
          escHtml(med.name),
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
  return html;
}

// RENDER OUTPUT DISCRIMINANT
function renderOutAdv_discriminant(o){
  var html='';
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
  return html;
}

// RENDER OUTPUT CLUSTER
function renderOutAdv_cluster(o){
  var html='';
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
  return html;
}
