// o.type==='anova2'
function renderOutBasic_anova2(o){
  var html='';
      const r=o.res;
      html+='<div class="notice-box" style="margin-bottom:10px">';
      html+='<b style="color:var(--ink)">Factorial Design:</b> '+r.depVar+' ~ '+r.factorA+' × '+r.factorB;
      html+=' &nbsp;|&nbsp; N='+r.n+' &nbsp;|&nbsp; Grand Mean='+r.grandMean;
      html+=' &nbsp;|&nbsp; Levels: A('+r.levA.length+') × B('+r.levB.length+')</div>';
      html+=renderAnovaTable(r.effects, r.error, r.total);
      // Sparse cell warnings
      if(r.sparseWarnings && r.sparseWarnings.length){
        r.sparseWarnings.forEach(function(w){
          html+='<div class="notice-box notice-warn" style="margin:7px 0">';
          html+='<span style="color:var(--warn);font-weight:700">'+w.icon+' '+w.msg+'</span>';
          if(w.cells && w.cells.length && w.cells.length<=12){
            html+='<div style="margin-top:4px;color:var(--ink-muted);font-family:var(--font-mono-stack);font-size:10.5px">Cells: '+w.cells.join(', ')+'</div>';
          }
          html+='</div>';
        });
      }
      html+='<div class="row" style="margin:8px 0;gap:5px;flex-wrap:wrap">';
      r.effects.forEach(function(e){
        html+='<span class="tag '+(e.sig?'tag-green':'tag-gray')+'" style="font-size:10.5px">'+e.source+': p='+e.p_fmt+(e.sig?' *':'')+'</span>';
      });
      html+='</div>';
      // Marginal means
      html+='<div class="grid2" style="margin-top:12px;gap:10px">';
      html+='<div><div style="font-size:11.5px;font-weight:700;color:var(--ink);margin-bottom:6px">Marginal Means — '+r.factorA+'</div>';
      html+=mkTable(['Level','Mean','N'],r.meanA.map(function(m){return[m.level,m.mean,m.n];}));
      html+='</div><div><div style="font-size:11.5px;font-weight:700;color:var(--ok);margin-bottom:6px">Marginal Means — '+r.factorB+'</div>';
      html+=mkTable(['Level','Mean','N'],r.meanB.map(function(m){return[m.level,m.mean,m.n];}));
      html+='</div></div>';
      // Interaction plot
      html+='<div style="margin-top:14px"><div style="font-size:11.5px;font-weight:700;color:var(--ink);margin-bottom:6px">Interaction Plot: '+r.factorA+' × '+r.factorB+'</div>';
      html+=svgInteractionPlot(r.cellMeansTable, r.factorB, r.factorA, r.depVar);
      html+='<div style="font-size:11px;color:var(--ink-subtle);margin-top:4px">Non-parallel lines suggest a significant interaction. Hover dots for cell means.</div>';
      html+='</div>';
  return html;
}
