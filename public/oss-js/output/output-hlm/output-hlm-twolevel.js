// RENDER OUTPUT HLM: Two-Level IGLS (r.subtype==='hlm-2level')
function renderOutAdv_hlm_twolevel(o){
  var html='';
  var r=o.res;
  if(!r){ return '<div class="notice-box notice-err">No Two-Level HLM result.</div>'; }
  if(r._err){ return '<div class="notice-box notice-err">⚠ '+escHtml(r._err)+'</div>'; }
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
  return html;
}
