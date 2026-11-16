// o.type==='glm'
function renderOutBasic_glm(o){
  var html='';
      if(o.res&&!o.res._err){
        html+='<div class="stats-grid" style="margin-bottom:11px">';
        html+=stCard('N',o.res.n)+stCard('R²',o.res.R2)+stCard('Adj R²',o.res.R2adj)+stCard('Grand Mean',o.res.grandMean);
        html+='</div>';
        html+=mkTable(['Source','df','SS','MS','F','p','η²','Partial η²'],
          o.res.effects.map(function(e){
            var ps=e.sig?'<b style="color:var(--ok)">'+e.p_fmt+'</b>':(e.p_fmt||'—');
            return[escHtml(e.source)+(e.isCov?' (cov)':''),e.df,e.SS||'—',e.MS||'—',e.F||'—',ps,e.eta2||'—',e.partialEta2||'—'];
          }).concat([['Error',o.res.dfError,o.res.ssError,o.res.msError,'','','','']]));
        // Factor means
        o.res.factors.forEach(function(fac){
          var levels=o.res.factorLevels[fac];
          var eff=o.res.effects.find(function(e){return e.source===fac;});
          if(!levels||!eff||!eff.groups) return;
          html+='<div style="margin-top:11px"><div class="sec-hd" style="font-size:11px">'+escHtml(fac)+' — Estimated Marginal Means</div>';
          html+=mkTable([fac,'N','Mean','SD'],levels.map(function(g){
            var gv=eff.groups[g];
            if(!gv) return[escHtml(g),'—','—','—'];
            return[escHtml(g),gv.length,SE.f4(SE.mean(gv)),gv.length>=2?SE.f4(SE.std(gv)):'N/A'];
          }));
          html+='</div>';
        });
      }
  return html;
}
