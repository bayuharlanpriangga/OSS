// RENDER OUTPUT HLM: Three-Level GLS & Variance Partitioning (r.subtype==='hlm-3level')
function renderOutAdv_hlm_threelevel(o){
  var html='';
  var r=o.res;
  if(!r){ return '<div class="notice-box notice-err">No Three-Level HLM result.</div>'; }
  if(r._err){ return '<div class="notice-box notice-err">⚠ '+escHtml(r._err)+'</div>'; }
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
  return html;
}
