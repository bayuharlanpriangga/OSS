// o.type==='anova'
function renderOutBasic_anova(o){
  var html='';
      html+=mkTable(['Source','df','SS','MS','F','p','η²'],[['Between',o.res.dfB,o.res.ssB,o.res.msB,o.res.F,o.res.p_fmt,o.res.eta2],['Within',o.res.dfW,o.res.ssW,o.res.msW,'','','']]);
      html+='<div class="row" style="margin:10px 0">'+sigBadge(o.res.p)+'<span class="tag tag-gray">η²='+o.res.eta2+' ('+o.res.eta2Interp+')</span></div>';
      if(o.res.eta2_ci) html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-bottom:8px">η² 95% CI: <span style="color:var(--ink);font-weight:600">'+o.res.eta2_ci+'</span></div>';
      html+=mkTable(['Group','N','Mean','SD'],o.res.groupStats.map(g=>[g.label,g.n,g.mean,g.sd]));
      if(o.posthoc){
        var phName={'tukey':'Tukey HSD','bonferroni':'Bonferroni','lsd':'LSD (Fisher)','holm':'Holm-Bonferroni'}[o.posthocMethod]||'Post-hoc';
        var phNote={'tukey':'q-statistic, studentized range distribution',
          'bonferroni':'p adjusted × number of comparisons ('+o.posthoc.length+')',
          'lsd':'Unadjusted — liberal test, no familywise correction',
          'holm':'Step-down Bonferroni — p adjusted sequentially, more powerful than plain Bonferroni'}[o.posthocMethod]||'';
        html+='<div style="font-weight:700;color:var(--ink);font-size:12.5px;margin:10px 0 3px">'+phName+' Post-hoc</div>';
        if(phNote)html+='<div style="font-size:11px;color:var(--ink-subtle);margin-bottom:6px">'+phNote+'</div>';
        if(o.posthocMethod==='tukey'){
          html+=mkTable(['Pair','Diff','q','p','Sig'],o.posthoc.map(ph=>[ph.a+' vs '+ph.b,ph.diff,ph.q,ph.p,ph.sig?'*':'ns']));
        } else if(o.posthocMethod==='bonferroni'){
          html+=mkTable(['Pair','Diff','SE','t','p (adj)','Sig'],o.posthoc.map(ph=>[ph.a+' vs '+ph.b,ph.diff,ph.se,ph.t,ph.p_fmt,ph.sig?'*':'ns']));
        } else {
          html+=mkTable(['Pair','Diff','SE','t','p','Sig'],o.posthoc.map(ph=>[ph.a+' vs '+ph.b,ph.diff,ph.se,ph.t,ph.p_fmt,ph.sig?'*':'ns']));
        }
      }
      html+='<div style="margin-top:10px">'+svgBoxplot(data,o.depV,o.grpV)+'</div>';
  return html;
}
