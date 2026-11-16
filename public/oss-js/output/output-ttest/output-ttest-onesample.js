// o.type==='onesamp'
function renderOutBasic_onesamp(o){
  var html='';
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
        html+='<div style="font-size:10.5px;font-weight:700;color:var(--warn);margin-bottom:5px;text-transform:uppercase;letter-spacing:.7px">Normality Assumption (Shapiro-Wilk)</div>';
        const swOk=parseFloat(o.sw.p)>.05;
        html+='<div style="font-size:11.5px;color:var(--ink-muted)">W = '+o.sw.W+' &nbsp; p = '+o.sw.p+' → ';
        html+='<span style="font-weight:600;color:'+(swOk?'var(--ok)':'var(--err)')+'">'+(swOk?'✓ Normal distribution':'✗ Non-normal — consider Wilcoxon Signed-Rank test')+'</span></div>';
        html+='</div>';
      }
      // Chart
      html+=svgHistogram(data,o.field);
  return html;
}
