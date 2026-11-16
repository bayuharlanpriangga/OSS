// o.type==='poisson'
function renderOutBasic_poisson(o){
  var html='';
  var r2=o.res;
  if(r2&&!r2._err){
    // Header stats
    html+='<div class="stats-grid" style="margin-bottom:11px">';
    html+=stCard('N',r2.n);
    html+=stCard('Log-Likelihood',r2.logLik);
    html+=stCard('McFadden R²',r2.mcFaddenR2);
    html+=stCard('Pearson Disp.',r2.dispersion);
    html+='</div>';
    // LR test badge
    html+='<div class="row" style="gap:6px;margin-bottom:11px;flex-wrap:wrap">';
    html+='<span class="tag tag-blue">LR χ²('+r2.lrDf+') = '+r2.lrChi2+'</span>';
    html+='<span class="tag tag-gray">p = '+r2.lrP+'</span>';
    html+=sigBadge(parseFloat(r2.lrP));
    if(!r2.converged) html+='<span class="tag tag-yellow">⚠ IRLS did not fully converge</span>';
    html+='</div>';
    // Coefficients table
    html+='<div class="sec-hd" style="margin-bottom:7px"><span style="color:var(--ok)">Poisson</span> — Coefficients</div>';
    html+='<div class="tbl-wrap"><table><thead><tr>';
    ['Predictor','β','SE','z','p','IRR (e^β)','95% CI IRR'].forEach(function(h2,hi){html+='<th'+(hi>0?' style="text-align:right"':'')+'>'+h2+'</th>';});
    html+='</tr></thead><tbody>';
    r2.coefs.forEach(function(c){
      html+='<tr>';
      html+='<td class="td-label" style="font-weight:600;color:var(--ink)">'+escHtml(c.name)+'</td>';
      html+='<td class="td-num">'+c.b+'</td>';
      html+='<td class="td-num">'+c.se+'</td>';
      html+='<td class="td-num">'+c.z+'</td>';
      html+='<td class="td-num">'+(c.sig?'<b style="color:var(--ok)">'+c.p+'</b>':c.p)+'</td>';
      html+='<td class="td-num" style="color:var(--gold-text);font-weight:700">'+c.irr+'</td>';
      html+='<td class="td-num" style="font-size:11px;color:var(--ink-muted)">'+c.irrCI+'</td>';
      html+='</tr>';
    });
    html+='</tbody></table></div>';
    // Interpretation notes
    html+='<div class="assump" style="margin-top:11px">';
    html+='<b style="color:var(--ink)">Interpretasi IRR</b> — IRR = e^β: nilai &gt; 1 berarti rate meningkat, &lt; 1 berarti menurun, per 1 unit perubahan prediktor.<br>';
    if(parseFloat(r2.dispersion)>2){
      html+='<span style="color:var(--warn)">⚠ Dispersion statistic = '+r2.dispersion+' (&gt; 2). Data kemungkinan overdispersed. Pertimbangkan <b>Negative Binomial Regression</b>.</span>';
    } else {
      html+='<span style="color:var(--ok)">✓ Dispersion = '+r2.dispersion+' — Poisson assumption (mean ≈ variance) terpenuhi.</span>';
    }
    html+='</div>';
    // Warnings
    if(r2.warnings&&r2.warnings.length){
      html+='<div class="notice-box notice-warn" style="margin-top:8px;font-size:11.5px">';
      r2.warnings.forEach(function(w){html+='⚠ '+escHtml(w)+'<br>';});
      html+='</div>';
    }
  } else {
    html+='<div class="notice-box notice-err" style="font-size:12px">⚠ '+escHtml(r2&&r2._err?r2._err:'No result')+'</div>';
  }
  return html;
}
