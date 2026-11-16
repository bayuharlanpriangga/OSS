// RENDER OUTPUT SURVIVAL (Kaplan-Meier & Cox)
function renderOutAdv_survival(o){
  var html='';
      var r=o.res;
      html+='<div class="notice-box notice-ok" style="margin-bottom:11px">';
      html+='<div style="font-size:14px;font-weight:800;color:var(--ok);font-family:var(--font-serif-stack)">Kaplan-Meier Survival Analysis</div>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-top:3px">Time: '+escHtml(o.survTime)+' | Event: '+escHtml(o.survEvent)+(o.survGroup?' | Group: '+escHtml(o.survGroup):'')+'</div>';
      html+='</div>';
      html+='<div class="stats-grid" style="margin-bottom:12px">';
      r.groups.forEach(function(g){
        html+=stCard('N ('+g.label+')',g.n,'');
        html+=stCard('Events ('+g.label+')',g.events,'');
        html+=stCard('Median Surv. ('+g.label+')',g.medianSurv===null?'NR':SE.f4(g.medianSurv),'');
      });
      html+='</div>';
      html+=svgKaplanMeier(r);
      if(r.groups.length>=2){
        var lr=r.logrank;
        html+='<div style="margin-top:12px"><div class="sec-hd" style="margin-bottom:7px">Log-Rank Test</div>';
        html+=mkTable(['Group','N','Events','Censored','Median Survival','O−E'],
          r.groups.map(function(g){return[escHtml(g.label),g.n,g.events,g.n-g.events,g.medianSurv===null?'NR':SE.f4(g.medianSurv),g.oe];}));
        html+='<div class="notice-box" style="margin-top:9px;font-size:11.5px;color:var(--ink)">'+lr.interpretation+'</div>';
        html+='</div>';
      }
  return html;
}

function renderOutAdv_cox(o){
  var html='';
      var r=o.res;
      var cC=parseFloat(r.concordance)>=0.8?'var(--ok)':parseFloat(r.concordance)>=0.7?'var(--warn)':'var(--err)';
      html+='<div class="notice-box notice-ok" style="margin-bottom:11px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">';
      html+='<div><div style="font-size:14px;font-weight:800;color:var(--ok);font-family:var(--font-serif-stack)">Cox Proportional Hazards</div><div style="font-size:11.5px;color:var(--ink-muted);margin-top:2px">N='+r.n+' | Events='+r.events+' | Covariates: '+r.covariates.map(escHtml).join(', ')+'</div></div>';
      html+='<div style="text-align:right;font-family:var(--font-mono-stack);font-variant-numeric:tabular-nums"><div style="font-size:13px;font-weight:700;color:'+cC+'">C-index = '+r.concordance+'</div><div style="font-size:10.5px;color:var(--ink-muted)">LR χ²='+r.lrChi2+' p='+r.lrP_fmt+'</div></div>';
      html+='</div>';
      html+='<div class="stats-grid2" style="margin-bottom:12px">';
      html+=stCard('N',r.n,'');
      html+=stCard('Events',r.events,'');
      html+=stCard('Concordance (C)',r.concordance,'');
      html+=stCard('LR Test p',r.lrP_fmt,'');
      html+='</div>';
      html+=mkTable(['Covariate','β','SE','HR','95% CI HR','z','p'],
        r.coefs.map(function(c){
          var sig=parseFloat(c.p)<0.05;
          var hrNum=parseFloat(c.HR);
          var hrCol=hrNum>1.5?'var(--err)':hrNum<0.67?'var(--ok)':'var(--ink)';
          return[escHtml(c.name),c.beta,c.se,'<b style="color:'+hrCol+'">'+c.HR+'</b>',c.ci95,c.z,(sig?'<b style="color:var(--ok)">':'')+c.p_fmt+(sig?'</b>':'')];
        }));
      html+=svgForestPlot(r);
      html+='<div class="assump" style="margin-top:10px;font-size:11.5px;line-height:1.65"><b style="color:var(--ink)">Interpretation:</b> HR &gt; 1 = higher risk (shorter survival); HR &lt; 1 = protective. C-index: 0.5 = random, ≥0.7 = acceptable, ≥0.8 = good discrimination.</div>';
  return html;
}
