// RENDER OUTPUT MULTIPLE IMPUTATION
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
