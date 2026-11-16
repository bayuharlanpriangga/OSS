// RENDER OUTPUT BAYESIAN CORRELATION
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
