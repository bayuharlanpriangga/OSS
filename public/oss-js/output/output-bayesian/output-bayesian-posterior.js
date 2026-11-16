// RENDER OUTPUT BAYESIAN POSTERIOR
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
