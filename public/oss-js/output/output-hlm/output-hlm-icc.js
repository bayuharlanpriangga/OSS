// RENDER OUTPUT HLM: ICC & Variance Components (Null Model)
function renderOutAdv_hlm_icc(o){
  var html='';
  var r=o.res;
  if(!r){ return '<div class="notice-box notice-err">No HLM result.</div>'; }
  if(r._err){ return '<div class="notice-box notice-err">⚠ '+escHtml(r._err)+'</div>'; }
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
  return html;
}
