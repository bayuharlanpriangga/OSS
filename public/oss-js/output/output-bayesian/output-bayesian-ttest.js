// RENDER OUTPUT BAYESIAN T-TEST
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
