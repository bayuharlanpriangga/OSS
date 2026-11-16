
// RENDER OUTPUT HLM
function renderOutAdv_hlm(o){
  var html='';
      var r=o.res;
      if(!r){ html+='<div class="notice-box notice-err">No HLM result.</div>'; }
      else if(r._err){ html+='<div class="notice-box notice-err">⚠ '+escHtml(r._err)+'</div>'; }
      else if(r.subtype==='hlm-3level'){
        html+='<div class="stats-grid" style="margin-bottom:11px">';
        html+=stCard('ICC (Level-3)',r.ICC_L3,'τ_β = '+r.varL3)+stCard('ICC (L2|L3)',r.ICC_L2_within_L3,'τ_π+τ_β = '+r.varBetween);
        html+=stCard('L3 / L2 Units',r.k3+' / '+r.k2,'N obs = '+r.n)+stCard('AIC / BIC',r.AIC+' / '+r.BIC,'-2LL = '+r.deviance);
        html+='</div>';
        html+='<div class="sec-hd" style="font-size:11px;margin-bottom:6px">Three-Level Variance Partitioning (VPC)</div>';
        html+='<div class="tbl-wrap" style="margin-bottom:11px"><table><thead><tr><th>Level</th><th style="text-align:right">Component</th><th style="text-align:right">Variance</th><th style="text-align:right">% Total</th><th style="text-align:right">F</th><th style="text-align:right">p</th></tr></thead><tbody>';
        html+='<tr><td class="td-label">Level-3 ('+escHtml(o.group2||'Cluster L3')+')</td><td class="td-label">τ_β</td><td class="td-num">'+r.varL3+'</td><td class="td-num">'+r.vpcL3+'%</td><td class="td-num">'+r.F_L3+'</td><td class="td-num">'+r.p_L3_fmt+(r.sig_L3?' *':'')+'</td></tr>';
        html+='<tr><td class="td-label">Level-2 ('+escHtml(o.group||'Cluster L2')+')</td><td class="td-label">τ_π</td><td class="td-num">'+r.varL2+'</td><td class="td-num">'+r.vpcL2+'%</td><td class="td-num">'+r.F_L2+'</td><td class="td-num">'+r.p_L2_fmt+(r.sig_L2?' *':'')+'</td></tr>';
        html+='<tr><td class="td-label">Level-1 (Residual)</td><td class="td-label">σ²</td><td class="td-num">'+r.varL1+'</td><td class="td-num">'+r.vpcL1+'%</td><td class="td-num">—</td><td class="td-num">—</td></tr>';
        html+='</tbody></table></div>';
        if(r.fixedEffects&&r.fixedEffects.length){
          html+='<div class="sec-hd" style="font-size:11px;margin-bottom:6px">Fixed Effects (Three-Level GLS)</div>';
          html+='<div class="tbl-wrap" style="margin-bottom:11px"><table><thead><tr><th>Parameter</th><th>Level</th><th style="text-align:right">γ</th><th style="text-align:right">SE</th><th style="text-align:right">t</th><th style="text-align:right">p</th><th style="text-align:right">95% CI</th></tr></thead><tbody>';
          r.fixedEffects.forEach(function(fe){
            html+='<tr><td class="td-label">'+escHtml(fe.name)+'</td><td class="td-label">'+escHtml(fe.level)+'</td><td class="td-num">'+fe.gamma+'</td><td class="td-num">'+fe.se+'</td><td class="td-num">'+fe.t+'</td><td class="td-num"><span class="tag '+(fe.sig?'tag-green':'tag-gray')+'">'+fe.p_fmt+'</span></td><td class="td-num">'+fe.ci95+'</td></tr>';
          });
          html+='</tbody></table></div>';
        }
        if(r.l3Stats&&r.l3Stats.length){
          html+='<div class="sec-hd" style="font-size:11px;margin-bottom:6px">Level-3 Cluster Summary ('+escHtml(o.group2||'')+')</div>';
          html+='<div class="tbl-wrap"><table><thead><tr><th>Level-3 Cluster</th><th style="text-align:right">L2 Units</th><th style="text-align:right">N obs</th><th style="text-align:right">Mean</th><th style="text-align:right">SD</th></tr></thead><tbody>';
          r.l3Stats.slice(0,20).forEach(function(g){
            html+='<tr><td class="td-label">'+escHtml(g.group)+'</td><td class="td-num">'+g.nL2+'</td><td class="td-num">'+g.n+'</td><td class="td-num">'+g.mean+'</td><td class="td-num">'+g.sd+'</td></tr>';
          });
          html+='</tbody></table></div>';
        }
      }
      else if(r.subtype==='hlm-2level'){
        html+='<div class="stats-grid" style="margin-bottom:11px">';
        html+=stCard('Conditional ICC',r.ICC,'Null ICC = '+r.ICC_null)+stCard('Groups (k)',r.k,'N obs = '+r.n);
        html+=stCard('Pseudo-R² (L1 / L2)',r.pseudoR2_L1+' / '+r.pseudoR2_L2,'Snijders & Bosker')+stCard('AIC / BIC',r.AIC+' / '+r.BIC,'-2LL = '+r.deviance);
        html+='</div>';
        html+='<div class="stats-grid2" style="margin-bottom:11px">';
        html+=stCard('τ₀₀ (Intercept Var)',r.varBetween,'Null τ₀₀ = '+r.nullTau00)+stCard('σ² (Residual Var)',r.varWithin,'Null σ² = '+r.nullSigma2);
        if(r.tau11!==null&&r.tau11!==undefined){
          html+=stCard('τ₁₁ (Slope Var)',r.tau11,'Model: '+escHtml(r.modelType));
        }
        html+=stCard('LRT vs Null', 'χ²('+r.lrtDf+')='+r.lrtChi2, 'p = '+r.lrtP_fmt);
        html+='</div>';
        if(r.fixedEffects&&r.fixedEffects.length){
          html+='<div class="sec-hd" style="font-size:11px;margin-bottom:6px">Fixed Effects (IGLS — '+escHtml(r.modelType)+')</div>';
          html+='<div class="tbl-wrap" style="margin-bottom:11px"><table><thead><tr><th>Parameter</th><th>Level</th><th style="text-align:right">γ</th><th style="text-align:right">SE</th><th style="text-align:right">t</th><th style="text-align:right">p</th><th style="text-align:right">95% CI</th></tr></thead><tbody>';
          r.fixedEffects.forEach(function(fe){
            html+='<tr><td class="td-label">'+escHtml(fe.name)+'</td><td class="td-label">'+escHtml(fe.level)+'</td><td class="td-num">'+fe.gamma+'</td><td class="td-num">'+fe.se+'</td><td class="td-num">'+fe.t+'</td><td class="td-num"><span class="tag '+(fe.sig?'tag-green':'tag-gray')+'">'+fe.p_fmt+'</span></td><td class="td-num">'+fe.ci95+'</td></tr>';
          });
          html+='</tbody></table></div>';
        }
        if(r.grpStats&&r.grpStats.length){
          html+='<div class="sec-hd" style="font-size:11px;margin-bottom:6px">Cluster Summary &amp; Empirical Bayes Intercepts ('+escHtml(o.group)+')</div>';
          html+='<div class="tbl-wrap"><table><thead><tr><th>Cluster</th><th style="text-align:right">n</th><th style="text-align:right">Mean</th><th style="text-align:right">SD</th><th style="text-align:right">EB u₀ⱼ</th></tr></thead><tbody>';
          r.grpStats.slice(0,20).forEach(function(g){
            html+='<tr><td class="td-label">'+escHtml(g.group)+'</td><td class="td-num">'+g.n+'</td><td class="td-num">'+g.mean+'</td><td class="td-num">'+g.sd+'</td><td class="td-num">'+(g.ebIntercept!==undefined?g.ebIntercept:'—')+'</td></tr>';
          });
          if(r.grpStats.length>20) html+='<tr><td colspan="5" style="color:var(--ink-subtle);font-size:11px;text-align:center">… '+(r.grpStats.length-20)+' more clusters</td></tr>';
          html+='</tbody></table></div>';
        }
      }
      else {
        var iccV=parseFloat(r.ICC);
        var iccColor=iccV<.05?'var(--ok)':iccV<.25?'var(--warn)':'var(--err)';
        var iccCls=iccV<.05?'notice-ok':iccV<.25?'notice-warn':'notice-err';
        var iccLabel=iccV<.05?'Negligible clustering':iccV<.10?'Small – HLM recommended':iccV<.25?'Moderate – HLM important':'Strong – HLM essential';
        html+='<div class="stats-grid" style="margin-bottom:11px">';
        html+=stCard('ICC (1)',r.ICC,'Intraclass Correlation')+stCard('ICC (2)',r.ICC2||'—','Group-mean reliability');
        html+=stCard('Groups (k)',r.k,'N obs = '+r.n)+stCard('Grand Mean',r.grandMean,escHtml(o.dep));
        html+='</div>';
        html+='<div class="notice-box '+iccCls+'" style="margin-bottom:11px">';
        html+='<div style="font-size:13px;font-weight:700;color:'+iccColor+'">ICC = '+r.ICC+' ('+(r.pctBetween||'—')+'% between-group)</div>';
        html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-top:3px">'+iccLabel+'</div></div>';
        html+='<div class="stats-grid2" style="margin-bottom:11px">';
        html+=stCard('τ₀₀ (Between)',r.varBetween,'Level-2 variance')+stCard('σ² (Within)',r.varWithin,'Level-1 residual');
        html+=stCard('Design Effect',r.design_effect,'Eff N = '+(r.effectiveN||r.n))+stCard('F (null model)',r.F+(r.sig?' *':' ns'),'p = '+r.p_fmt);
        html+='</div>';
        if(r.grpStats&&r.grpStats.length){
          html+='<div class="sec-hd" style="font-size:11px;margin-bottom:6px">Group-Level Descriptives ('+escHtml(o.group)+')</div>';
          html+='<div class="tbl-wrap"><table><thead><tr><th>Group</th><th style="text-align:right">n</th><th style="text-align:right">Mean</th><th style="text-align:right">SD</th></tr></thead><tbody>';
          r.grpStats.slice(0,20).forEach(function(g){
            html+='<tr><td class="td-label">'+escHtml(g.group)+'</td><td class="td-num">'+g.n+'</td><td class="td-num">'+g.mean+'</td><td class="td-num">'+g.sd+'</td></tr>';
          });
          if(r.grpStats.length>20) html+='<tr><td colspan="4" style="color:var(--ink-subtle);font-size:11px;text-align:center">… '+(r.grpStats.length-20)+' more groups</td></tr>';
          html+='</tbody></table></div>';
        }
        html+='<div class="assump" style="margin-top:11px;font-size:11.5px">';
        html+='<b style="color:var(--ink)">Interpretation:</b> ICC = '+r.ICC+'. '+iccLabel+'. ';
        html+='Between-group variance τ₀₀ = '+r.varBetween+', within-group σ² = '+r.varWithin+'. ';
        html+='Design effect = '+r.design_effect+' (effective N is approximately '+(r.effectiveN||r.n)+'). ';
        if(iccV>.05) html+='<span style="color:var(--warn)">Recommend using HLM over OLS regression for this nested data structure.</span>';
        else html+='<span style="color:var(--ok)">Clustering is minimal; single-level analysis may be adequate, but verify theoretical justification for grouping.</span>';
        html+='</div>';
      }
  return html;
}

// RENDER OUTPUT ALPHA
function renderOutAdv_alpha(o){
  var html='';
      html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-bottom:10px">'+stCard('Cronbach α',o.res.alpha,o.res.interp)+stCard('Items k',o.res.k)+stCard('Cases n',o.res.n)+'</div>';
      html+='<div class="row"><span class="tag '+(parseFloat(o.res.alpha)>=.7?'tag-green':'tag-red')+'">'+o.res.interp+' reliability</span></div>';
      html+='<div style="margin-top:8px;font-size:11.5px;color:var(--ink-muted)">Items: '+o.vars.map(escHtml).join(', ')+'</div>';
  return html;
}

// RENDER OUTPUT KAPPA
function renderOutAdv_kappa(o){
  var html='';
      var r=o.res;
      var kv=parseFloat(r.kappa);
      var kCls=kv>=0.8?'tag-green':kv>=0.6?'tag-blue':kv>=0.4?'tag-purple':kv>=0.2?'tag-yellow':'tag-red';
      // Summary stats row
      html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-bottom:10px">';
      html+=stCard("Cohen's κ",r.kappa,r.interp);
      html+=stCard('SE',r.seK);
      html+=stCard('z-score',r.z);
      html+=stCard('Cases n',r.n);
      html+='</div>';
      html+='<div class="row" style="margin-bottom:8px">';
      html+='<span class="tag '+kCls+'">'+r.interp+'</span>';
      html+='<span class="tag tag-blue">p'+r.pFmt+'</span>';
      html+='<span class="tag tag-gray">95% CI ['+r.ci95lo+', '+r.ci95hi+']</span>';
      if(o.weighted&&r.wKappa!==null) html+='<span class="tag tag-blue">Weighted κ='+r.wKappa+' ('+r.interpW+')</span>';
      html+='</div>';
      // Agreement detail
      html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px;margin-bottom:10px">';
      html+=stCard('Observed Agreement (Po)',r.po);
      html+=stCard('Expected Agreement (Pe)',r.pe);
      html+='</div>';
      // Confusion matrix
      html+='<div class="sec-hd" style="margin-bottom:6px">Confusion Matrix</div>';
      html+='<div class="tbl-wrap" style="margin-bottom:12px"><table><thead><tr><th style="color:var(--line)">'+escHtml(o.vars[0])+' \\ '+escHtml(o.vars[1])+'</th>';
      r.cats.forEach(function(c){html+='<th style="text-align:right">'+escHtml(c)+'</th>';});
      html+='<th style="text-align:right">Total</th></tr></thead><tbody>';
      r.cats.forEach(function(cat,i){
        html+='<tr class="'+(i%2?'':'alt')+'"><td class="td-label" style="color:var(--line);font-weight:600">'+escHtml(cat)+'</td>';
        r.mat[i].forEach(function(cell,j){
          var isDiag=i===j;
          html+='<td class="td-num" style="'+(isDiag?'background:var(--gold-tint);font-weight:700;color:var(--ink)':'')+'">'+cell+'</td>';
        });
        html+='<td class="td-num" style="color:var(--ink-muted);font-weight:600">'+r.rowSum[i]+'</td></tr>';
      });
      html+='<tr style="background:var(--surface-alt);border-top:1px solid var(--line-soft)"><td class="td-label" style="font-weight:700">Total</td>';
      r.colSum.forEach(function(v){html+='<td class="td-num" style="color:var(--ink-muted);font-weight:600">'+v+'</td>';});
      html+='<td class="td-num" style="font-weight:800;color:var(--ink)">'+r.n+'</td></tr>';
      html+='</tbody></table></div>';
      // Per-category stats
      html+='<div class="sec-hd" style="margin-bottom:6px">Per-Category Agreement</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Category</th><th style="text-align:right">n (Rater 1)</th><th style="text-align:right">Correct</th><th style="text-align:right">Precision</th><th style="text-align:right">Recall</th></tr></thead><tbody>';
      r.catStats.forEach(function(cs,i){
        html+='<tr class="'+(i%2?'':'alt')+'"><td class="td-label">'+cs.cat+'</td>';
        html+='<td class="td-num">'+cs.n+'</td>';
        html+='<td class="td-num" style="color:var(--ok);font-weight:600">'+cs.tp+'</td>';
        html+='<td class="td-num">'+cs.precision+'</td>';
        html+='<td class="td-num">'+cs.recall+'</td></tr>';
      });
      html+='</tbody></table></div>';
      html+='<div style="margin-top:8px;font-size:11.5px;color:var(--ink-muted)">Rater 1: '+escHtml(o.vars[0])+' &nbsp;|&nbsp; Rater 2: '+escHtml(o.vars[1])+'</div>';
  return html;
}

// RENDER OUTPUT EFA
function renderOutAdv_efa(o){
  var html='';
      var r=o.res;
      // KMO + Bartlett
      html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-bottom:11px">';
      var kmoColor=parseFloat(r.kmo)>=0.7?'var(--ok)':parseFloat(r.kmo)>=0.5?'var(--warn)':'var(--err)';
      html+=stCard('KMO','<span style="color:'+kmoColor+'">'+r.kmo+'</span>',r.kmoInterp);
      html+=stCard('Bartlett χ²',r.chi2,'df='+r.bartDf+' p='+r.bartP);
      html+=stCard('Variance Explained',r.cumVar[r.nFactors-1]+'%',r.nFactors+' factor'+(r.nFactors>1?'s':'')+', '+r.rotation);
      html+='</div>';
      html+='<div class="row" style="margin-bottom:11px">';
      html+='<span class="tag '+(parseFloat(r.kmo)>=0.7?'tag-green':parseFloat(r.kmo)>=0.5?'tag-yellow':'tag-red')+'">KMO: '+r.kmoInterp+'</span>';
      html+='<span class="tag '+(r.bartSig?'tag-green':'tag-red')+'">'+(r.bartSig?'✓ Bartlett significant':'✗ Bartlett not sig')+'</span>';
      html+='</div>';
      // Eigenvalue table
      html+='<div class="sec-hd" style="margin-bottom:8px">Eigenvalues & Variance Explained</div>';
      html+='<div class="tbl-wrap" style="margin-bottom:12px"><table><thead><tr><th>Factor</th><th style="text-align:right">Eigenvalue</th><th style="text-align:right">% Variance</th><th style="text-align:right">Cumulative %</th><th>Retain?</th></tr></thead><tbody>';
      r.eigenvalues.forEach(function(ev,i){
        var retain=i<r.nFactors;
        var evNum=parseFloat(ev);
        html+='<tr style="'+(retain?'background:var(--gold-tint)':'')+'">';
        html+='<td class="td-label">F'+(i+1)+'</td>';
        html+='<td class="td-num" style="font-weight:'+(evNum>1?700:400)+';color:'+(evNum>1?'var(--ink)':evNum>0.5?'var(--ink-muted)':'var(--ink-subtle)')+'">'+ev+'</td>';
        html+='<td class="td-num">'+(r.varExp[i]||'—')+'%</td>';
        html+='<td class="td-num">'+(r.cumVar[i]||'—')+'%</td>';
        html+='<td>'+(retain?'<span class="tag tag-green" style="font-size:9px">✓ Yes</span>':(evNum>1?'<span class="tag tag-yellow" style="font-size:9px">Consider</span>':'<span style="font-size:10px;color:var(--ink-subtle)">No</span>'))+'</td>';
        html+='</tr>';
      });
      html+='</tbody></table></div>';
      // Scree plot
      html+='<div style="margin-bottom:12px">'+svgScreePlot(r.eigenvalues,r.nFactors)+'</div>';
      // Factor loadings
      html+='<div class="sec-hd" style="margin-bottom:8px">Factor Loading Matrix <span style="font-weight:400;font-style:normal;color:var(--ink-subtle);font-size:10.5px">('+r.rotation+', |loading| ≥ 0.40 highlighted)</span></div>';
      html+='<div class="tbl-wrap" style="margin-bottom:10px"><table><thead><tr><th>Variable</th>';
      for(var fi=0;fi<r.nFactors;fi++) html+='<th style="text-align:right">F'+(fi+1)+'</th>';
      html+='<th style="text-align:right">Communality h²</th></tr></thead><tbody>';
      o.efaVars.forEach(function(v,i){
        html+='<tr><td class="td-label">'+escHtml(v)+'</td>';
        r.loadings[i].forEach(function(l){
          var absL=Math.abs(parseFloat(l));
          var col=absL>=0.6?'var(--gold-text)':absL>=0.4?'var(--line)':'var(--ink-subtle)';
          var fw=absL>=0.4?700:400;
          html+='<td class="td-num" style="color:'+col+';font-weight:'+fw+'">'+l+'</td>';
        });
        var h2=parseFloat(r.communalities[i]);
        var h2col=h2>=0.7?'var(--ok)':h2>=0.4?'var(--warn)':'var(--err)';
        html+='<td class="td-num" style="color:'+h2col+';font-weight:600">'+r.communalities[i]+'</td>';
        html+='</tr>';
      });
      html+='</tbody></table></div>';
      html+='<div style="font-size:11px;color:var(--ink-muted);margin-bottom:6px">Gold ≥0.60 strong, Ice ≥0.40 moderate | Communality: green ≥0.70, amber ≥0.40, red &lt;0.40</div>';
      // Interpretation hint
      html+='<div class="assump"><b style="color:var(--ink)">N</b>='+r.n+' cases &nbsp;|&nbsp; <b style="color:var(--ink)">p</b>='+r.p+' variables &nbsp;|&nbsp; '+r.nFactors+' factors extracted</div>';
  return html;
}

// RENDER OUTPUT CFA
function renderOutAdv_cfa(o){
  var html='';
      var r=o.res;
      var T=typeof ossChartTheme==='function'?ossChartTheme():{series:['#4F7A99','#D4A72C','#2F7048','#A8530E','#A93226']};
      var fitOk=r.CFI_raw>=0.95&&r.RMSEA_raw<=0.06;
      var fitAcc=r.CFI_raw>=0.90&&r.RMSEA_raw<=0.08;
      var fitCol=fitOk?'var(--ok)':fitAcc?'var(--warn)':'var(--err)';
      var fitCls=fitOk?'notice-ok':fitAcc?'notice-warn':'notice-err';
      // Overall fit badge
      html+='<div class="notice-box '+fitCls+'" style="margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">';
      html+='<div><div style="font-size:15px;font-weight:800;color:'+fitCol+';font-family:var(--font-serif-stack)">'+r.overallFit+'</div>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-top:2px">N='+r.n+', '+r.p+' variabel, '+r.nFactors+' faktor laten</div></div>';
      html+='<div style="text-align:right;font-family:var(--font-mono-stack);font-variant-numeric:tabular-nums"><div style="font-size:11px;color:var(--ink-muted)">χ²('+r.dfModel+')='+r.chiSq+'</div><div style="font-size:11px;color:var(--ink-muted)">p = '+r.pChiSq+'</div></div>';
      html+='</div>';
      // 4 Fit index cards
      var cficol=r.CFI_raw>=0.95?'var(--ok)':r.CFI_raw>=0.90?'var(--warn)':'var(--err)';
      var tlicol=r.TLI_raw>=0.95?'var(--ok)':r.TLI_raw>=0.90?'var(--warn)':'var(--err)';
      var rmsecol=r.RMSEA_raw<=0.05?'var(--ok)':r.RMSEA_raw<=0.08?'var(--warn)':'var(--err)';
      var srmrcol=r.SRMR_raw<=0.05?'var(--ok)':r.SRMR_raw<=0.08?'var(--warn)':'var(--err)';
      html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:12px">';
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
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-bottom:10px">RMSEA 90% CI: ['+r.RMSEA_lo+' – '+r.RMSEA_hi+']</div>';
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
      html+='<div class="tbl-wrap"><table><thead><tr><th>Faktor</th><th>Indikator</th><th style="text-align:right">λ (Loading)</th><th style="text-align:right">h² (Communality)</th><th>Status</th></tr></thead><tbody>';
      r.factorNames.forEach(function(fn, fi){
        var fcolor=T.series[fi%T.series.length];
        var vars=r.factorMap[fn]||[];
        vars.forEach(function(v,vi){
          var vIdx=r.varNames.indexOf(v);
          var lam=vIdx>=0?r.lambda[vIdx][fi]:'—';
          var h2=vIdx>=0?r.communalities[vIdx]:'—';
          var lamNum=parseFloat(lam);
          var h2num=parseFloat(h2);
          var lamCol=Math.abs(lamNum)>=0.7?'var(--ok)':Math.abs(lamNum)>=0.5?'var(--line)':Math.abs(lamNum)>=0.3?'var(--warn)':'var(--err)';
          var h2col=h2num>=0.7?'var(--ok)':h2num>=0.4?'var(--warn)':'var(--err)';
          html+='<tr>';
          if(vi===0) html+='<td class="td-label" rowspan="'+vars.length+'" style="color:'+fcolor+';font-weight:700;vertical-align:middle">'+escHtml(fn)+'</td>';
          html+='<td class="td-label">'+escHtml(v)+'</td>';
          html+='<td class="td-num" style="color:'+lamCol+';font-weight:'+(Math.abs(lamNum)>=0.5?700:400)+'">'+lam+'</td>';
          html+='<td class="td-num" style="color:'+h2col+'">'+h2+'</td>';
          html+='<td>'+(Math.abs(lamNum)>=0.5?'<span class="tag tag-green" style="font-size:9px">✓ Adequate</span>':'<span class="tag tag-red" style="font-size:9px">✗ Weak</span>')+'</td>';
          html+='</tr>';
        });
      });
      html+='</tbody></table></div>';
      html+='<div style="font-size:11px;color:var(--ink-subtle);margin-top:6px">λ ≥ 0.70 strong, ≥ 0.50 adequate, &lt; 0.30 weak | h² = komunalitas (variance explained)</div>';
      // Interpretation note
      html+='<div class="assump" style="margin-top:10px"><b style="color:var(--ink)">Interpretasi Model:</b> '+r.overallFit+'. '
        +(r.CFI_raw>=0.95&&r.RMSEA_raw<=0.06?'Model memiliki fit yang baik terhadap data. ':'')
        +(r.CFI_raw<0.90||r.RMSEA_raw>0.08?'Pertimbangkan modifikasi model berdasarkan Modification Indices atau residual matrix. ':'')
        +'Reference: Hu & Bentler (1999): CFI ≥ .95, RMSEA ≤ .06, SRMR ≤ .08 sebagai indikator good fit.</div>';
  return html;
}

// RENDER OUTPUT SEM
function renderOutAdv_sem(o){
  var html='';
      var r=o.res;
      var T=typeof ossChartTheme==='function'?ossChartTheme():{series:['#4F7A99','#D4A72C','#2F7048','#A8530E','#A93226']};
      var fitColSEM=r.overallFit==='Good Fit'?'var(--ok)':r.overallFit==='Acceptable Fit'?'var(--warn)':'var(--err)';
      var fitClsSEM=r.overallFit==='Good Fit'?'notice-ok':r.overallFit==='Acceptable Fit'?'notice-warn':'notice-err';
      // Header
      html+='<div class="notice-box '+fitClsSEM+'" style="margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">';
      html+='<div><div style="font-size:15px;font-weight:800;color:'+fitColSEM+';font-family:var(--font-serif-stack)">'+r.overallFit+'</div>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-top:2px">N='+r.n+', '+r.totalIndicators+' indikators, '+r.nLatent+' konstruk laten</div></div>';
      html+='<div style="text-align:right;font-family:var(--font-mono-stack);font-variant-numeric:tabular-nums"><div style="font-size:11px;color:var(--ink-muted)">χ²('+r.dfModel+')='+r.chiSq+', p='+r.pChiSq+'</div>';
      html+='<div style="font-size:11px;color:var(--ink-muted)">χ²/df='+r.chiRatio+' | RMSEA CI: ['+r.RMSEA_lo+', '+r.RMSEA_hi+']</div></div>';
      html+='</div>';
      // Fit index cards
      var cficol3=r.CFI_raw>=0.95?'var(--ok)':r.CFI_raw>=0.90?'var(--warn)':'var(--err)';
      var tlicol3=r.TLI_raw>=0.95?'var(--ok)':r.TLI_raw>=0.90?'var(--warn)':'var(--err)';
      var rmsecol3=r.RMSEA_raw<=0.05?'var(--ok)':r.RMSEA_raw<=0.08?'var(--warn)':'var(--err)';
      var srmrcol3=r.SRMR_raw<=0.05?'var(--ok)':r.SRMR_raw<=0.08?'var(--warn)':'var(--err)';
      html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(105px,1fr));gap:8px;margin-bottom:12px">';
      html+=stCard('CFI','<span style="color:'+cficol3+'">'+r.CFI+'</span>','≥.95 good');
      html+=stCard('TLI','<span style="color:'+tlicol3+'">'+r.TLI+'</span>','≥.95 good');
      html+=stCard('RMSEA','<span style="color:'+rmsecol3+'">'+r.RMSEA+'</span>','≤.06 good');
      html+=stCard('SRMR','<span style="color:'+srmrcol3+'">'+r.SRMR+'</span>','≤.08 good');
      html+=stCard('χ²/df','<span style="color:'+(r.chiRatio<=2?'var(--ok)':r.chiRatio<=3?'var(--warn)':'var(--err)')+'">'+r.chiRatio+'</span>','≤2.0 good');
      html+=stCard('N',r.n,'Sample size');
      html+='</div>';
      // Construct validity
      if(r.constructs&&r.constructs.length){
        html+='<div class="sec-hd" style="margin-bottom:8px">Construct Validity (AVE & CR)</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th>Konstruk</th><th style="text-align:right">N Indics</th><th style="text-align:right">AVE</th><th style="text-align:right">CR</th><th style="text-align:right">Cronbach α</th><th>Validity</th></tr></thead><tbody>';
        r.constructs.forEach(function(c,ci){
          var col=T.series[ci%T.series.length];
          var avecol=parseFloat(c.AVE)>=0.5?'var(--ok)':parseFloat(c.AVE)>=0.4?'var(--warn)':'var(--err)';
          var crcol=parseFloat(c.CR)>=0.7?'var(--ok)':parseFloat(c.CR)>=0.6?'var(--warn)':'var(--err)';
          var alphacol=parseFloat(c.alpha)>=0.7?'var(--ok)':parseFloat(c.alpha)>=0.6?'var(--warn)':'var(--err)';
          var valid=parseFloat(c.AVE)>=0.5&&parseFloat(c.CR)>=0.7;
          html+='<tr>';
          html+='<td class="td-label" style="color:'+col+';font-weight:700">'+escHtml(c.name)+'</td>';
          html+='<td class="td-num">'+c.nIndics+'</td>';
          html+='<td class="td-num" style="color:'+avecol+'">'+c.AVE+'</td>';
          html+='<td class="td-num" style="color:'+crcol+'">'+c.CR+'</td>';
          html+='<td class="td-num" style="color:'+alphacol+'">'+c.alpha+'</td>';
          html+='<td><span class="tag '+(valid?'tag-green':'tag-yellow')+'" style="font-size:9px">'+(valid?'✓ Valid':'⚠ Check')+'</span></td>';
          html+='</tr>';
        });
        html+='</tbody></table></div>';
        html+='<div style="font-size:10.5px;color:var(--ink-subtle);margin-top:4px;margin-bottom:12px">AVE ≥ 0.50 = convergent validity | CR ≥ 0.70 = construct reliability | AVE &gt; r² between constructs = discriminant validity</div>';
      }
      // Factor loadings
      if(r.loadings&&r.loadings.length){
        html+='<div class="sec-hd" style="margin-bottom:8px">Standardized Factor Loadings (Measurement Model)</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th>Konstruk</th><th>Indikator</th><th style="text-align:right">λ</th><th style="text-align:right">h²</th><th style="text-align:right">t-val*</th><th>Status</th></tr></thead><tbody>';
        r.loadings.forEach(function(row){
          var lamNum=parseFloat(row.lambda);
          var lamCol=lamNum>=0.7?'var(--ok)':lamNum>=0.5?'var(--line)':lamNum>=0.3?'var(--warn)':'var(--err)';
          var lIdx=o.latents?o.latents.indexOf(row.construct):0;
          var col=T.series[lIdx>=0?lIdx%T.series.length:0];
          html+='<tr>';
          if(row.firstInConstruct) html+='<td class="td-label" rowspan="'+row.constructCount+'" style="color:'+col+';font-weight:700;vertical-align:top;padding-top:10px">'+escHtml(row.construct)+'</td>';
          html+='<td class="td-label">'+escHtml(row.indicator)+'</td>';
          html+='<td class="td-num" style="color:'+lamCol+';font-weight:'+(lamNum>=0.5?700:400)+'">'+row.lambda+'</td>';
          html+='<td class="td-num" style="color:'+(parseFloat(row.h2)>=0.4?'var(--line)':'var(--err)')+'">'+row.h2+'</td>';
          html+='<td class="td-num" style="color:var(--ink-muted)">'+row.tvalue+'</td>';
          html+='<td><span class="tag '+(lamNum>=0.5?'tag-green':'tag-red')+'" style="font-size:9px">'+(lamNum>=0.5?'✓ Adequate':'✗ Weak')+'</span></td>';
          html+='</tr>';
        });
        html+='</tbody></table></div>';
        html+='<div style="font-size:10.5px;color:var(--ink-subtle);margin-top:4px;margin-bottom:12px">*Estimasi t-val; t &gt; 1.96 = p &lt; .05 | λ ≥ 0.70 strong, ≥ 0.50 adequate</div>';
      }
      // Structural paths
      if(r.paths&&r.paths.length){
        html+='<div class="sec-hd" style="margin-bottom:8px">Structural Path Coefficients</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th>Dari</th><th>→ Ke</th><th style="text-align:right">β (Std)</th><th style="text-align:right">SE</th><th style="text-align:right">t</th><th style="text-align:right">p</th><th>Sig</th><th>Interpretasi</th></tr></thead><tbody>';
        r.paths.forEach(function(p){
          var betaNum=parseFloat(p.beta);
          var bcol=Math.abs(betaNum)>=0.3?'var(--ok)':Math.abs(betaNum)>=0.1?'var(--warn)':'var(--err)';
          var psig=parseFloat(p.p)<0.05;
          var fromIdx=o.latents?o.latents.indexOf(p.from):0;
          var toIdx=o.latents?o.latents.indexOf(p.to):1;
          html+='<tr>';
          html+='<td class="td-label" style="color:'+T.series[fromIdx>=0?fromIdx%T.series.length:0]+';font-weight:700">'+escHtml(p.from)+'</td>';
          html+='<td class="td-label" style="color:'+T.series[toIdx>=0?toIdx%T.series.length:1]+';font-weight:700">'+escHtml(p.to)+'</td>';
          html+='<td class="td-num" style="color:'+bcol+';font-weight:700">'+p.beta+'</td>';
          html+='<td class="td-num" style="color:var(--ink-muted)">'+p.se+'</td>';
          html+='<td class="td-num">'+p.t+'</td>';
          html+='<td class="td-num" style="color:'+(psig?'var(--ok)':'var(--err)')+'">'+(psig?'<b>':'')+p.p_fmt+(psig?'</b>':'')+'</td>';
          html+='<td>'+sigBadge(p.p)+'</td>';
          html+='<td style="font-size:11.5px;color:var(--ink-muted)">'+escHtml(p.interpretation)+'</td>';
          html+='</tr>';
        });
        html+='</tbody></table></div>';
        html+='<div style="font-size:10.5px;color:var(--ink-subtle);margin-top:4px;margin-bottom:12px">β = standardized path coefficient | |β| ≥ .30 = medium effect | |β| ≥ .50 = large effect</div>';
      }
      // Indirect effects
      if(r.indirectEffects&&r.indirectEffects.length){
        html+='<div class="sec-hd" style="margin-bottom:8px">Indirect Effects (Mediasi via Konstruk Laten)</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th>X</th><th>M (Mediator)</th><th>Y</th><th style="text-align:right">Indirect β</th><th style="text-align:right">95% CI</th><th>Sig</th></tr></thead><tbody>';
        r.indirectEffects.forEach(function(ie){
          var ciSig=parseFloat(ie.ci_lo)>0||parseFloat(ie.ci_hi)<0;
          html+='<tr>';
          html+='<td class="td-label" style="color:'+T.series[0]+';font-weight:700">'+escHtml(ie.x)+'</td>';
          html+='<td class="td-label" style="color:'+T.series[2]+'">'+escHtml(ie.m)+'</td>';
          html+='<td class="td-label" style="color:'+T.series[1]+';font-weight:700">'+escHtml(ie.y)+'</td>';
          html+='<td class="td-num" style="color:'+(Math.abs(parseFloat(ie.indirect))>=0.1?'var(--ok)':'var(--warn)')+'">'+ie.indirect+'</td>';
          html+='<td class="td-num" style="font-size:11px;color:'+(ciSig?'var(--ok)':'var(--err)')+'">['+ie.ci_lo+', '+ie.ci_hi+']</td>';
          html+='<td><span class="tag '+(ciSig?'tag-green':'tag-red')+'" style="font-size:9px">'+(ciSig?'✓ Signifikan':'n.s.')+'</span></td>';
          html+='</tr>';
        });
        html+='</tbody></table></div>';
        html+='<div style="font-size:10.5px;color:var(--ink-subtle);margin-top:4px;margin-bottom:12px">CI tidak mencakup 0 → indirect effect signifikan (mediasi terbukti)</div>';
      }
      // lavaan syntax
      if(o.latents&&o.latentMap&&o.paths!==undefined){
        html+='<div class="sec-hd" style="margin-bottom:6px">lavaan / AMOS Syntax</div>';
        html+='<textarea class="syn-area" readonly style="min-height:120px;font-size:11px">'+escHtml(generateLavaanSyntax(o.latents,o.latentMap,o.paths))+'</textarea>';
      }
      // Interpretation
      html+='<div class="assump" style="margin-top:10px"><b style="color:var(--ink)">Interpretasi SEM:</b> '+r.overallFit+'. '
        +(r.CFI_raw>=0.95&&r.RMSEA_raw<=0.06?'Model fit sangat baik (Good Fit). Konstruk laten valid dan reliable. ':'')
        +(r.CFI_raw<0.90||r.RMSEA_raw>0.08?'Model perlu modifikasi. Cek MI (Modification Indices) dan pertimbangkan re-specification. ':'')
        +'Reference: Hu & Bentler (1999); Hair et al. (2010) untuk SEM cut-off criteria.</div>';
  return html;
}

// RENDER OUTPUT MEDIATION
function renderOutAdv_mediation(o){
  var html='';
      var r=o.res;
      var medMeta={
        'Full Mediation':{cls:'notice-ok',col:'var(--ok)'},
        'Partial Mediation':{cls:'notice-warn',col:'var(--warn)'},
        'No Mediation':{cls:'notice-err',col:'var(--err)'},
        'Inconsistent/Suppression':{cls:'notice-warn',col:'var(--gold-text)'}
      }[r.medType]||{cls:'',col:'var(--ink)'};
      // Conclusion badge
      html+='<div class="notice-box '+medMeta.cls+'" style="margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">';
      html+='<span style="font-size:13.5px;font-weight:800;color:'+medMeta.col+'">'+r.medType+'</span>';
      html+='<span style="font-size:11.5px;color:var(--ink-muted)">n='+r.n+' | X: '+escHtml(r.xName)+' → ['+r.mNames.map(function(m){return escHtml(m);}).join(', ')+'] → Y: '+escHtml(r.yName)+'</span>';
      html+='</div>';

      // Path diagram
      html+='<div style="text-align:center;margin-bottom:12px">'+svgMediationPath(r.xName,r.mNames,r.yName,r)+'</div>';

      // Baron-Kenny table
      var bk=r.barronKenny;
      html+='<div class="sec-hd" style="margin-bottom:6px">Baron-Kenny Causal Steps</div>';
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
      html+='<div class="sec-hd" style="margin-top:12px;margin-bottom:6px">Indirect Effect(s)</div>';
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
          ciSig===null?'—':(ciSig?'<span style="color:var(--ok);font-weight:600">Sig (CI ≠ 0)</span>':'<span style="color:var(--err)">n.s. (CI ∋ 0)</span>'),
        ];
      });
      var bootHdr=['Mediator','Indirect (a×b)','Sobel z','p (Sobel)','Sig','Boot 95% CI','Boot Sig'];
      html+='<div class="tbl-wrap"><table><thead><tr>'+bootHdr.map(function(h,hi){return '<th'+((hi>=1&&hi<=3)||hi===5?' style="text-align:right"':'')+'>'+h+'</th>';}).join('')+'</tr></thead><tbody>';
      bootRows.forEach(function(row){
        html+='<tr>'+row.map(function(c,ci){
          return '<td class="'+(ci===0||ci===6?'td-label':'td-num')+'">'+c+'</td>';
        }).join('')+'</tr>';
      });
      html+='</tbody></table></div>';

      html+='<div style="margin-top:10px;font-size:11.5px;color:var(--ink-muted)">* p &lt; .05 | Total indirect effect: '+r.totalIndirect+' | Model R² (M+X→Y): '+r.r2_total+'</div>';
  return html;
}

// RENDER OUTPUT DISCRIMINANT
function renderOutAdv_discriminant(o){
  var html='';
      var r=o.res;
      var accCol=parseFloat(r.accuracy)>=70?'var(--ok)':parseFloat(r.accuracy)>=50?'var(--warn)':'var(--err)';
      html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-bottom:12px">';
      html+='<div class="sb"><div class="sb-label">N</div><div class="sb-value">'+r.n+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Groups</div><div class="sb-value">'+r.groups.length+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Functions</div><div class="sb-value">'+r.nFunctions+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Wilks\' λ</div><div class="sb-value">'+r.wilksLambda+'</div><div class="sb-note">p = '+r.wilksP+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Accuracy</div><div class="sb-value" style="color:'+accCol+'">'+r.accuracy+'%</div></div>';
      html+='</div>';
      html+=mkTable(['Function','Eigenvalue','% Var','Cumul %','Canonical r'],
        r.eigenvalues.map(function(e,i){return ['Function '+(i+1),e.eigenvalue,e.pctVar+'%',e.cumPct+'%',e.canonicalR];}));
      html+='<div class="sec-hd" style="margin-top:12px;margin-bottom:6px">Standardized Coefficients</div>';
      var scHeader=['Predictor'].concat(r.eigenvalues.map(function(_,i){return 'Function '+(i+1);}));
      html+=mkTable(scHeader, r.preds.map(function(p,pi){return [p].concat(r.stdCoefs.map(function(fc){return fc[pi];}));}));
      html+='<div class="sec-hd" style="margin-top:12px;margin-bottom:6px">Structure Matrix</div>';
      html+=mkTable(scHeader, r.preds.map(function(p,pi){return [p].concat(r.structureMatrix.map(function(fc){return fc[pi];}));}));
      html+='<div style="margin-top:6px;font-size:11px;color:var(--ink-subtle)">|r| ≥ .30 = practically significant. Classification accuracy: '+r.accuracy+'%</div>';
  return html;
}

// RENDER OUTPUT CLUSTER
function renderOutAdv_cluster(o){
  var html='';
      var r=o.res;
      var silCol=r.silhouette>=0.5?'var(--ok)':r.silhouette>=0.25?'var(--warn)':'var(--err)';
      var silLabel=r.silhouette>=0.7?'Strong':r.silhouette>=0.5?'Reasonable':r.silhouette>=0.25?'Weak':'Poor';
      html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-bottom:12px">';
      html+='<div class="sb"><div class="sb-label">Method</div><div class="sb-value" style="font-size:12px">'+( r.method==='kmeans'?'K-Means':'Hierarchical')+'</div></div>';
      html+='<div class="sb"><div class="sb-label">k Clusters</div><div class="sb-value" style="color:var(--gold-text)">'+r.k+'</div></div>';
      html+='<div class="sb"><div class="sb-label">N Cases</div><div class="sb-value">'+r.n+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Silhouette</div><div class="sb-value" style="color:'+silCol+'">'+r.silhouette+'</div><div class="sb-note">'+escHtml(silLabel)+'</div></div>';
      if(r.method==='kmeans'){
        html+='<div class="sb"><div class="sb-label">Within SS</div><div class="sb-value">'+r.totalWSS+'</div></div>';
        html+='<div class="sb"><div class="sb-label">Between SS</div><div class="sb-value">'+r.totalBSS+'</div></div>';
      } else {
        html+='<div class="sb"><div class="sb-label">Linkage</div><div class="sb-value" style="font-size:12px">'+r.linkage+'</div></div>';
      }
      html+='</div>';
      html+='<div class="sec-hd" style="margin-bottom:6px">Cluster Centroids (raw means)</div>';
      var cHeader=['Cluster','N','%'].concat(r.vars);
      html+=mkTable(cHeader, r.clusters.map(function(c){return [c.label,c.n,c.pct+'%'].concat(c.rawMeans);}));
      if(r.plotData){
        html+='<div style="margin-top:10px">'+svgClusterPlot(r)+'</div>';
      }
      if(r.method==='kmeans'&&r.elbowData){
        html+='<div class="sec-hd" style="margin-top:10px;margin-bottom:4px">Elbow Chart</div>';
        html+=svgElbow(r.elbowData);
      }
      if(r.method==='hierarchical'&&r.dendro){
        html+='<div class="sec-hd" style="margin-top:10px;margin-bottom:4px">Dendrogram</div>';
        html+=svgDendrogram(r.dendro,r.k,r.vars);
      }
      html+='<div class="sec-hd" style="margin-top:10px;margin-bottom:5px">ANOVA per Variable</div>';
      html+=mkTable(['Variable','F','df1','df2','p'],r.anova.map(function(a){var sig=parseFloat(a.p)<0.05;return [a.variable,a.F,a.df1,a.df2,(sig?'<b style="color:var(--ok)">':'')+a.p_fmt+(sig?'</b>':'')];}));
      html+='<div style="margin-top:6px;font-size:11px;color:var(--ink-subtle)">Silhouette ≥ .50 = reasonable cluster structure. Variables z-standardized before clustering.</div>';
  return html;
}

// ════════════════════════════════════════════════════════════════════════════
// F5 — render detail lanjutan (bagian 2): MI, ROC, Survival, Cox, Bayesian
//      (t-test / korelasi / posterior), Time Series, Meta-analysis.
// APPEND ke akhir js/output/output-render-advanced.js (setelah 9 fungsi F4).
// Pola sama dgn F3/F4: tiap fungsi menerima objek output `o` dan MENGEMBALIKAN
// string HTML isi kartu; badan = isi cabang lama di `renderOutput()` apa adanya
// (byte-exact), tambahan hanya `var html='';` di awal dan `return html;` di akhir.
// Dispatcher (`else if(o.type===...&&o.res)`) tetap di `renderOutput()` (app.js).
// Dependency (semua global, dibaca saat runtime, tanpa top-level call):
//   escHtml, SE, stCard, mkTable, svgConvergence, svgROC, svgKaplanMeier,
//   svgForestPlot, svgBayesPosterior, svgMetaForestPlot, svgFunnelPlot.
// ════════════════════════════════════════════════════════════════════════════

function renderOutAdv_mi(o){
  var html='';
      var r=o.res;
      var methLabels={'pmm':'PMM (Predictive Mean Matching)','norm':'Bayesian Normal Regression','mice_cart':'CART'};
      html+='<div class="notice-box" style="margin-bottom:11px">';
      html+='<div style="font-size:14px;font-weight:800;color:var(--ink);font-family:var(--font-serif-stack)">Multiple Imputation</div>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-top:3px">Method: '+methLabels[r.method]+' | M='+r.M+' imputed datasets | N='+r.n+'</div>';
      html+='</div>';
      html+='<div class="stats-grid2" style="margin-bottom:11px">';
      html+=stCard('M (Imputations)',r.M,'');
      html+=stCard('Variables Imputed',r.targetVars.length,'');
      html+=stCard('Method',r.method.toUpperCase(),'');
      html+=stCard('Cases',r.n,'');
      html+='</div>';
      html+='<div class="sec-hd" style="margin-bottom:7px">Pooled Results (Rubin\'s Rules)</div>';
      html+=mkTable(['Variable','N Observed','N Imputed','Orig. Mean','Pooled Mean','Orig. SD','Pooled SD','FMI (λ)'],
        r.pooled.map(function(p){
          var fmiNum=parseFloat(p.FMI);
          var fmiCol=fmiNum>0.5?'var(--err)':fmiNum>0.3?'var(--warn)':'var(--ok)';
          return[p.variable,p.n,p.nImputed,p.origMean,'<b style="color:var(--gold-text)">'+p.pooledMean+'</b>',p.origSD,p.pooledSD,'<span style="color:'+fmiCol+';font-weight:600">'+p.FMI+'</span>'];
        }));
      html+='<div class="notice-box" style="margin-top:10px;font-size:11.5px;color:var(--ink-muted);line-height:1.65">';
      html+='<b style="color:var(--ink)">FMI (Fraction of Missing Information):</b> λ &lt; 0.1 = low impact, λ 0.1–0.3 = moderate, λ &gt; 0.5 = high (consider reducing missingness). Pooled SD reflects imputation uncertainty. The first imputed dataset (M=1) has been applied to the active dataset.';
      html+='</div>';
      // Convergence plot
      if(r.pooled.length>0&&r.pooled[0].convergence&&r.pooled[0].convergence.length>1){
        html+='<div class="sec-hd" style="margin-top:12px;margin-bottom:5px">Convergence Plot (Imputed Means across M)</div>';
        html+=svgConvergence(r.pooled);
      }
  return html;
}

function renderOutAdv_roc(o){
  var html='';
      var r=o.res;
      var aucV=parseFloat(r.auc);
      var aucCol2=aucV>=0.9?'var(--ok)':aucV>=0.8?'var(--line)':aucV>=0.7?'var(--warn)':'var(--err)';
      var aucCls=aucV>=0.8?'notice-ok':aucV>=0.7?'notice-warn':'notice-err';
      html+='<div class="notice-box '+aucCls+'" style="margin-bottom:11px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">';
      html+='<div><div style="font-size:14.5px;font-weight:800;color:'+aucCol2+';font-family:var(--font-serif-stack)">'+r.aucInterp+'</div><div style="font-size:11.5px;color:var(--ink-muted);margin-top:2px">'+escHtml(o.rocProb)+' → '+escHtml(o.rocTrue)+' (pos: '+escHtml(r.posClass)+')</div></div>';
      html+='<div style="text-align:right;font-family:var(--font-mono-stack);font-variant-numeric:tabular-nums"><div style="font-size:17px;font-weight:800;color:'+aucCol2+'">AUC = '+r.auc+'</div><div style="font-size:10.5px;color:var(--ink-muted)">95% CI: '+r.aucCI+'</div></div>';
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
      html+='<div style="max-width:560px">'+svgROC(r)+'</div>';
      if(o.compare&&o.compare.curves&&o.compare.curves.length>=2){
        var T=typeof ossChartTheme==='function'?ossChartTheme():{series:['#4F7A99','#D4A72C','#2F7048','#A8530E']};
        html+='<div style="margin-top:14px"><div class="sec-hd" style="margin-bottom:6px">ROC Curve Comparison (DeLong Test)</div>';
        html+='<div style="max-width:580px">'+svgROCCompare(o.compare.curves)+'</div>';
        html+='<div class="tbl-wrap" style="margin-top:10px"><table><thead><tr><th>Model / Score</th><th style="text-align:right">AUC</th><th style="text-align:right">95% CI</th><th style="text-align:right">Cutoff</th><th style="text-align:right">Sens</th><th style="text-align:right">Spec</th></tr></thead><tbody>';
        o.compare.curves.forEach(function(c,ci){
          var cr=c.roc, col=T.series[ci%T.series.length];
          html+='<tr><td class="td-label"><span style="display:inline-flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:2px;background:'+col+';display:inline-block"></span>'+escHtml(c.name)+'</span></td><td class="td-num" style="color:var(--gold-text);font-weight:700">'+cr.auc+'</td><td class="td-num">'+cr.aucCI+'</td><td class="td-num">'+cr.optThresh+'</td><td class="td-num">'+cr.optSens+'</td><td class="td-num">'+cr.optSpec+'</td></tr>';
        });
        html+='</tbody></table></div>';
        if(o.compare.delongPairs&&o.compare.delongPairs.length){
          html+='<div class="tbl-wrap" style="margin-top:8px"><table><thead><tr><th>Comparison</th><th style="text-align:right">z</th><th style="text-align:right">p</th><th>Result</th></tr></thead><tbody>';
          o.compare.delongPairs.forEach(function(dp){
            var dSig=parseFloat(dp.test.p)<0.05;
            html+='<tr><td class="td-label">'+escHtml(dp.base)+' vs '+escHtml(dp.comp)+'</td><td class="td-num">'+dp.test.z+'</td><td class="td-num"><span class="tag '+(dSig?'tag-green':'tag-gray')+'">'+dp.test.p_fmt+'</span></td><td>'+(dSig?'Significant difference':'No significant difference')+'</td></tr>';
          });
          html+='</tbody></table></div>';
        }
        html+='</div>';
      }
      html+='<div style="margin-top:12px"><div class="sec-hd" style="margin-bottom:6px">AUC Interpretation Guide</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>AUC Range</th><th>Discriminative Ability</th></tr></thead><tbody>';
      [['0.90 – 1.00','Excellent'],['0.80 – 0.89','Good'],['0.70 – 0.79','Acceptable'],['0.60 – 0.69','Poor'],['0.50 – 0.59','Fail (no better than chance)']].forEach(function(row){
        html+='<tr><td class="td-label" style="font-family:var(--font-mono-stack);font-variant-numeric:tabular-nums">'+row[0]+'</td><td class="td-label" style="color:var(--ink-muted)">'+row[1]+'</td></tr>';
      });
      html+='</tbody></table></div></div>';
  return html;
}

function renderOutAdv_survival(o){
  var html='';
      var r=o.res;
      html+='<div class="notice-box notice-ok" style="margin-bottom:11px">';
      html+='<div style="font-size:14px;font-weight:800;color:var(--ok);font-family:var(--font-serif-stack)">Kaplan-Meier Survival Analysis</div>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-top:3px">Time: '+escHtml(o.survTime)+' | Event: '+escHtml(o.survEvent)+(o.survGroup?' | Group: '+escHtml(o.survGroup):'')+'</div>';
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
        html+='<div class="notice-box" style="margin-top:9px;font-size:11.5px;color:var(--ink)">'+lr.interpretation+'</div>';
        html+='</div>';
      }
  return html;
}

function renderOutAdv_cox(o){
  var html='';
      var r=o.res;
      var cC=parseFloat(r.concordance)>=0.8?'var(--ok)':parseFloat(r.concordance)>=0.7?'var(--warn)':'var(--err)';
      html+='<div class="notice-box notice-ok" style="margin-bottom:11px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">';
      html+='<div><div style="font-size:14px;font-weight:800;color:var(--ok);font-family:var(--font-serif-stack)">Cox Proportional Hazards</div><div style="font-size:11.5px;color:var(--ink-muted);margin-top:2px">N='+r.n+' | Events='+r.events+' | Covariates: '+r.covariates.map(escHtml).join(', ')+'</div></div>';
      html+='<div style="text-align:right;font-family:var(--font-mono-stack);font-variant-numeric:tabular-nums"><div style="font-size:13px;font-weight:700;color:'+cC+'">C-index = '+r.concordance+'</div><div style="font-size:10.5px;color:var(--ink-muted)">LR χ²='+r.lrChi2+' p='+r.lrP_fmt+'</div></div>';
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
          var hrCol=hrNum>1.5?'var(--err)':hrNum<0.67?'var(--ok)':'var(--ink)';
          return[escHtml(c.name),c.beta,c.se,'<b style="color:'+hrCol+'">'+c.HR+'</b>',c.ci95,c.z,(sig?'<b style="color:var(--ok)">':'')+c.p_fmt+(sig?'</b>':'')];
        }));
      html+=svgForestPlot(r);
      html+='<div class="assump" style="margin-top:10px;font-size:11.5px;line-height:1.65"><b style="color:var(--ink)">Interpretation:</b> HR &gt; 1 = higher risk (shorter survival); HR &lt; 1 = protective. C-index: 0.5 = random, ≥0.7 = acceptable, ≥0.8 = good discrimination.</div>';
  return html;
}

function renderOutAdv_bayes_ttest(o){
  var html='';
      var r=o.res;
      var bf=parseFloat(r.BF10);
      var bfCol=bf>3?'var(--ok)':bf>1/3?'var(--warn)':'var(--err)';
      var bfCls=bf>3?'notice-ok':bf>1/3?'notice-warn':'notice-err';
      html+='<div class="notice-box '+bfCls+'" style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">';
      html+='<div><div style="font-size:20px;font-weight:800;color:'+bfCol+';font-family:var(--font-serif-stack);font-variant-numeric:tabular-nums">BF₁₀ = '+r.BF10+'</div>';
      html+='<div style="font-size:12px;color:var(--ink-muted);margin-top:2px">'+r.interpretation+'</div></div>';
      html+='<div style="text-align:right;font-family:var(--font-mono-stack);font-variant-numeric:tabular-nums"><div style="font-size:12px;font-weight:700;color:var(--ink)">BF₀₁ = '+r.BF01+'</div>';
      html+='<div style="font-size:11px;color:var(--ink-muted)">t('+r.df+')='+r.t+' | p='+r.p_fmt+'</div></div>';
      html+='</div>';
      html+='<div class="stats-grid2" style="margin-bottom:12px">';
      html+=stCard('BF₁₀',r.BF10,'Evidence for H₁');
      html+=stCard('BF₀₁',r.BF01,'Evidence for H₀');
      html+=stCard("Cohen's d",r.cohensD,r.dInterp);
      html+=stCard('t-statistic',r.t,'df='+r.df+', p='+r.p_fmt);
      html+=stCard('n₁',r.n1,'Group '+escHtml(o.ga||'A'));
      html+=stCard('n₂',r.n2,'Group '+escHtml(o.gb||'B'));
      html+='</div>';
      html+='<div class="notice-box" style="margin-top:8px;font-size:11.5px;color:var(--ink-muted);line-height:1.7">';
      html+='<b style="color:var(--ink)">Prior:</b> Cauchy(r='+r.priorScale+') | Tails: '+(o.tails===2?'two-tailed':'one-tailed')+'<br>';
      html+='<b style="color:var(--ink)">Interpretation guide:</b> BF₁₀ &gt; 100 = extreme H₁, &gt; 30 = very strong, &gt; 10 = strong, &gt; 3 = moderate, &gt; 1 = anecdotal, &lt; 1/3 = moderate H₀, &lt; 1/10 = strong H₀.';
      html+='</div>';
  return html;
}

function renderOutAdv_bayes_corr(o){
  var html='';
      var r=o.res;
      var bf=parseFloat(r.BF10);
      var bfCol=bf>3?'var(--ok)':bf>1/3?'var(--warn)':'var(--err)';
      var bfCls=bf>3?'notice-ok':bf>1/3?'notice-warn':'notice-err';
      html+='<div class="notice-box '+bfCls+'" style="margin-bottom:12px">';
      html+='<div style="font-size:20px;font-weight:800;color:'+bfCol+';font-family:var(--font-serif-stack);font-variant-numeric:tabular-nums">BF₁₀ = '+r.BF10+'</div>';
      html+='<div style="font-size:12px;color:var(--ink-muted);margin-top:2px">'+r.interpretation+'</div>';
      html+='</div>';
      html+='<div class="stats-grid2" style="margin-bottom:12px">';
      html+=stCard('BF₁₀',r.BF10,'Evidence for ρ≠0');
      html+=stCard('BF₀₁',r.BF01,'Evidence for ρ=0');
      html+=stCard('Pearson r',r.r,'');
      html+=stCard('p-value (NHST)',r.p_fmt,'');
      html+=stCard('N',r.n,'');
      html+=stCard('Prior scale κ',SE.f4(o.prior||1),'JZS prior');
      html+='</div>';
  return html;
}

function renderOutAdv_bayes_posterior(o){
  var html='';
      var r=o.res;
      html+='<div class="notice-box" style="margin-bottom:12px">';
      html+='<div style="font-size:16px;font-weight:800;color:var(--ink);font-family:var(--font-serif-stack);font-variant-numeric:tabular-nums">Posterior Mean = '+r.postMean+'</div>';
      html+='<div style="font-size:12px;color:var(--ink-muted);margin-top:2px">95% Credible Interval: '+r.hdi95+'</div>';
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
      html+='<div class="notice-box" style="margin-top:10px;font-size:11.5px;color:var(--ink-muted);line-height:1.7">';
      html+='<b style="color:var(--ink)">Prior:</b> Normal-Inverse-Gamma (μ₀='+r.priorMu0+', κ₀='+r.priorKappa0+')<br>';
      html+='<b style="color:var(--ink)">Note:</b> The credible interval is a direct probability statement: "There is 95% probability that μ lies in '+r.hdi95+' given the data and prior."';
      html+='</div>';
  return html;
}

function renderOutAdv_timeseries(o){
  var html='';
      var r=o.res;
      html+='<div class="notice-box" style="margin-bottom:12px">';
      html+='<div style="font-size:16px;font-weight:800;color:var(--ink);font-family:var(--font-serif-stack)">'+r.model+'</div>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-top:3px">Variable: '+escHtml(r.variable)+' | N = '+r.n+'</div>';
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
          html+='<div class="tbl-wrap"><table><thead><tr><th>Parameter</th><th style="text-align:right">Estimate</th></tr></thead><tbody>';
          html+='<tr><td class="td-label">Intercept (μ)</td><td class="td-num">'+SE.f4(r.mu||0)+'</td></tr>';
          r.arCoefs.forEach(function(c,i){html+='<tr><td class="td-label">AR('+(i+1)+')</td><td class="td-num">'+c+'</td></tr>';});
          r.maCoefs.forEach(function(c,i){html+='<tr><td class="td-label">MA('+(i+1)+')</td><td class="td-num">'+c+'</td></tr>';});
          html+='</tbody></table></div>';
        }
        html+='<div class="notice-box" style="margin-top:10px;font-size:11.5px;color:var(--ink-muted);line-height:1.65">';
        html+='<b style="color:var(--ink)">Forecast (1-step):</b> '+r.forecast+' &nbsp;[95% CI: '+r.fc_lo95+' – '+r.fc_hi95+']<br>';
        html+='<b style="color:var(--ink)">Residual Mean:</b> '+r.residMean+' &nbsp;|&nbsp; <b style="color:var(--ink)">Residual SD:</b> '+r.residSD;
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
          html+='<div style="margin-top:10px"><div class="sec-hd" style="margin-bottom:6px">Seasonal Indices</div>';
          html+='<div class="tbl-wrap"><table><thead><tr>';
          r.seasonalIndices.forEach(function(s){html+='<th style="text-align:right">P'+s.period+'</th>';});
          html+='</tr></thead><tbody><tr>';
          r.seasonalIndices.forEach(function(s){
            var v=parseFloat(s.index),col=v>0?'var(--ok)':v<0?'var(--err)':'var(--ink-muted)';
            html+='<td class="td-num" style="color:'+col+';font-weight:600">'+s.index+'</td>';
          });
          html+='</tr></tbody></table></div></div>';
        }
      }
  return html;
}

function renderOutAdv_metaanalysis(o){
  var html='';
      var r=o.res;
      var psig=r.p<0.05;
      html+='<div class="notice-box" style="margin-bottom:12px">';
      html+='<div style="font-size:15.5px;font-weight:800;color:var(--ink);font-family:var(--font-serif-stack)">Meta-Analysis — '+(r.model==='fixed'?'Fixed-Effect':'Random-Effects')+' (k = '+r.k+' studies)</div>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-top:3px">Pooled '+r.effectLabel+' = '+r.pooledEffect+' &nbsp;[95% CI: '+r.ci_lo+', '+r.ci_hi+'] &nbsp;|&nbsp; z = '+r.z+', p = '+r.p_fmt+'</div>';
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
      var hColor=r.I2raw<25?'var(--ok)':r.I2raw<75?'var(--warn)':'var(--err)';
      html+='<div class="notice-box" style="margin-bottom:12px;font-size:11.5px;color:var(--ink-muted);line-height:1.65">';
      html+='<b style="color:var(--ink)">Heterogenitas: </b><b style="color:'+hColor+'">'+r.I2label+'</b> | ';
      html+='Q('+(r.k-1)+') = '+r.Q+', p = '+r.Q_p_fmt+'. ';
      html+=r.I2raw<25?'Studi cukup homogen.':r.I2raw<50?'Ada variasi sedang antar studi.':r.I2raw<75?'Heterogenitas substansial.':'Heterogenitas tinggi — hati-hati interpretasi.';
      html+='</div>';

      // Study-level table
      html+='<div class="sec-hd" style="margin-bottom:6px">Hasil Per Studi</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Studi</th><th style="text-align:right">yi</th><th style="text-align:right">vi</th><th style="text-align:right">SE</th><th style="text-align:right">95% CI</th><th style="text-align:right">Bobot (%)</th></tr></thead><tbody>';
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
      html+='<div class="sec-hd" style="margin-top:14px;margin-bottom:6px">Forest Plot</div>';
      html+=svgMetaForestPlot(o.studies||[],r,o.effectType||'yi');

      // Funnel plot
      html+='<div class="sec-hd" style="margin-top:14px;margin-bottom:6px">Funnel Plot <span style="font-size:10.5px;font-weight:400;color:var(--ink-subtle)">(publication bias check)</span></div>';
      html+=svgFunnelPlot(r);
      html+='<div style="font-size:11px;color:var(--ink-subtle);margin-top:6px">Funnel plot simetris → tidak ada publication bias. Asimetri → kemungkinan ada bias publikasi.</div>';
  return html;
}

// ════════════════════════════════════════════════════════════════════════
// RENDER OUTPUT MODERATION
// ════════════════════════════════════════════════════════════════════════
function renderModerationOutput(o){
  var r=o.res;
  var intSig2=parseFloat(r.interaction.p)<0.05;
  var intColor=intSig2?'var(--ok)':'var(--err)';
  var html='';
  html+='<div class="notice-box '+(intSig2?'notice-ok':'notice-err')+'" style="margin-bottom:12px"><div style="font-size:14.5px;font-weight:800;color:'+intColor+';font-family:var(--font-serif-stack)">'+(intSig2?'&#x2713; Significant Moderation':'&#x2717; Non-significant Moderation')+'</div>';
  html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-top:2px">'+escHtml(r.xName)+'&#xD7;'+escHtml(r.wName)+' &#x2192; '+escHtml(r.yName)+' | N='+r.n+(r.center?' (mean-centered)':'')+'</div></div>';
  html+='<div class="stats-grid" style="margin-bottom:12px">';
  html+=stCard('R&#xB2;',r.R2,'Variance explained');
  html+=stCard('Adj R&#xB2;',r.R2adj,'');
  html+=stCard('F',r.F,'p='+r.pF_fmt);
  html+=stCard('N',r.n,'');
  html+=stCard('&#x394;R&#xB2; (int)',r.deltaR2,'Interaction increment');
  html+=stCard('b(X&#xD7;W)',r.interaction.b,'p='+r.interaction.p_fmt);
  html+='</div>';
  html+='<div class="sec-hd" style="margin-bottom:7px">Regression Coefficients</div>';
  html+='<div class="tbl-wrap"><table><thead><tr><th>Variable</th><th style="text-align:right">b</th><th style="text-align:right">SE</th><th style="text-align:right">&#x3B2;</th><th style="text-align:right">t</th><th style="text-align:right">p</th></tr></thead><tbody>';
  r.coefs.forEach(function(c){
    var sig=parseFloat(c.p)<0.05;
    html+='<tr><td class="td-label">'+escHtml(c.name)+'</td><td class="td-num">'+c.b+'</td><td class="td-num">'+c.SE+'</td><td class="td-num">'+c.beta+'</td><td class="td-num">'+c.t+'</td><td class="td-num"><span class="tag '+(sig?'tag-green':'tag-gray')+'">'+c.p_fmt+'</span></td></tr>';
  });
  html+='</tbody></table></div>';
  html+='<div style="margin-top:12px">'+svgModerationPlot(r,r.xName,r.wName,r.yName)+'</div>';
  html+='<div class="sec-hd" style="margin-top:12px;margin-bottom:7px">Simple Slopes Analysis</div>';
  html+='<div class="tbl-wrap"><table><thead><tr><th>W Level</th><th style="text-align:right">W Value</th><th style="text-align:right">Slope</th><th style="text-align:right">SE</th><th style="text-align:right">t</th><th style="text-align:right">p</th><th style="text-align:right">95% CI</th></tr></thead><tbody>';
  r.simpleSlopes.forEach(function(s){
    var ssig=parseFloat(s.p)<0.05;
    html+='<tr><td class="td-label" style="color:'+s.color+';font-weight:600">'+s.label+'</td><td class="td-num">'+s.wVal+'</td><td class="td-num" style="color:'+s.color+';font-weight:600">'+s.slope+'</td><td class="td-num">'+s.se+'</td><td class="td-num">'+s.t+'</td><td class="td-num"><span class="tag '+(ssig?'tag-green':'tag-gray')+'">'+s.p_fmt+'</span></td><td class="td-num" style="font-size:11px">'+s.ci95+'</td></tr>';
  });
  html+='</tbody></table></div>';
  if(r.jn){
    html+='<div class="sec-hd" style="margin-top:12px;margin-bottom:5px">Johnson-Neyman Floodlight Analysis</div>';
    html+=svgJohnsonNeymanPlot(r,r.xName,r.wName,r.yName);
    if(r.jn.regions.length>0){
      html+='<div class="tbl-wrap" style="margin-top:8px"><table><thead><tr><th>JN Point</th><th style="text-align:right">W Value</th><th>Significant Region</th><th style="text-align:right">% Dataset</th></tr></thead><tbody>';
      r.jn.regions.forEach(function(rp,i){html+='<tr><td class="td-label">JN-'+(i+1)+'</td><td class="td-num">'+SE.f4(rp.value)+'</td><td class="td-label" style="color:var(--gold-text);font-weight:600">'+rp.direction+'</td><td class="td-num">'+rp.pct+'%</td></tr>';});
      html+='</tbody></table></div>';
    } else {
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-top:5px">No JN transition points found. '+r.jn.pctSig+'% of W range shows significant X&#x2192;Y relationship.</div>';
    }
  }
  html+='<div class="assump" style="margin-top:12px"><b style="color:var(--ink)">Interpretation:</b> '+(intSig2?'Significant':'Non-significant')+' interaction b(X&#xD7;W)='+r.interaction.b+', t='+r.interaction.t+', p='+r.interaction.p_fmt+', &#x394;R&#xB2;='+r.deltaR2+'. '+(intSig2?'The effect of '+escHtml(r.xName)+' on '+escHtml(r.yName)+' is moderated by '+escHtml(r.wName)+'. Examine simple slopes and JN plot for regions of significance.':'The effect of '+escHtml(r.xName)+' on '+escHtml(r.yName)+' does not significantly differ across levels of '+escHtml(r.wName)+'.')+'</div>';
  return html;
}

