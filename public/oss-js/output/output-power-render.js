// Render Power Output
function renderPowerOutput(o){
  var r=o.res;
  var testLabelsOut={'ttest_2samp':'Independent T-Test','ttest_1samp':'One-Sample T-Test','ttest_paired':'Paired T-Test','anova_oneway':'One-Way ANOVA','correlation':'Correlation (r)','regression_r2':'Multiple Regression (R²)','chisq':'Chi-Square'};
  var effLabelOut={'ttest_2samp':"Cohen's d",'ttest_1samp':"Cohen's d",'ttest_paired':"Cohen's dz",'anova_oneway':"Cohen's f",'correlation':'Pearson r','regression_r2':"Cohen's f²",'chisq':"Cohen's w"};
  var pwCol=parseFloat(r.power)>=0.9?'var(--ok)':parseFloat(r.power)>=0.8?'var(--warn)':'var(--err)';
  var pwBg=parseFloat(r.power)>=0.9?'var(--ok-bg)':parseFloat(r.power)>=0.8?'var(--warn-bg)':'var(--err-bg)';
  var html='';
  html+='<div style="margin-bottom:12px;padding:12px 16px;border-radius:var(--r-sm);background:'+pwBg+';border:1px solid '+pwCol+'"><div style="font-size:15px;font-weight:700;color:'+pwCol+';font-family:var(--font-serif-stack)">'+r.powerInterp+'</div>';
  html+='<div style="font-size:12px;color:var(--ink-muted);margin-top:3px;font-variant-numeric:tabular-nums">'+testLabelsOut[o.pwTest||'ttest_2samp']+' — Power = '+SE.f4(parseFloat(r.power)*100)+'%, α = '+r.alpha+', N = '+r.n+'</div></div>';
  html+='<div class="stats-grid" style="margin-bottom:12px">';
  html+=stCard(r.groups>1?'N (per group)':'N',r.n,'');
  html+=stCard('Total N',r.totalN||r.n,'');
  html+=stCard('Power (1−β)',SE.f4(parseFloat(r.power)*100)+'%',r.powerInterp);
  html+=stCard(effLabelOut[o.pwTest||'ttest_2samp'],SE.f4(r.effect),r.effectInterp);
  html+=stCard('Alpha (α)',r.alpha,'');
  if(r.groups>1) html+=stCard('Groups',r.groups,'k');
  if(r.preds) html+=stCard('Predictors (u)',r.preds,'');
  html+='</div>';
  html+='<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:12px;color:var(--ink-muted);margin-bottom:4px;font-variant-numeric:tabular-nums"><span>Power</span><span style="color:'+pwCol+';font-weight:700">'+SE.f4(parseFloat(r.power)*100)+'%</span></div>';
  html+='<div style="height:8px;background:var(--surface-alt);border-radius:var(--r-sm);overflow:hidden"><div style="height:100%;width:'+Math.min(100,parseFloat(r.power)*100)+'%;background:'+pwCol+'"></div></div></div>';
  html+='<div style="padding:10px 12px;background:var(--surface-alt);border:1px solid var(--line-soft);border-radius:var(--r-sm);font-size:12.5px;color:var(--ink);line-height:1.65">'+r.interpretation+'</div>';
  html+='<div style="margin-top:12px">'+svgPowerCurve(o.pwTest||'ttest_2samp',parseFloat(o.pwAlpha||0.05),parseInt(o.pwTails||2),undefined,undefined,r.preds)+'</div>';
  return html;
}
