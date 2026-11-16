// o.type==='anova3'
function renderOutBasic_anova3(o){
  var html='';
      const r=o.res;
      var T=typeof ossChartTheme==='function'?ossChartTheme():{series:['#0D0D0D','#4F7A99','#D4A72C']};
      html+='<div class="notice-box" style="margin-bottom:10px">';
      html+='<b style="color:var(--ink)">Three-Way Factorial:</b> '+r.depVar+' ~ '+r.factorA+' × '+r.factorB+' × '+r.factorC;
      html+=' &nbsp;|&nbsp; N='+r.n+' &nbsp;|&nbsp; Grand Mean='+r.grandMean;
      html+=' &nbsp;|&nbsp; Levels: A('+r.levA.length+') × B('+r.levB.length+') × C('+r.levC.length+')</div>';
      html+=renderAnovaTable(r.effects, r.error, r.total);
      html+='<div class="row" style="margin:8px 0;gap:5px;flex-wrap:wrap">';
      r.effects.forEach(function(e){
        html+='<span class="tag '+(e.sig?'tag-green':'tag-gray')+'" style="font-size:10.5px">'+e.source+': p='+e.p_fmt+(e.sig?' *':'')+'</span>';
      });
      html+='</div>';
      // Marginal means A B C
      html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-top:12px">';
      ['A','B','C'].forEach(function(label,idx){
        var mArr=[r.meanA,r.meanB,r.meanC][idx];
        var fName=[r.factorA,r.factorB,r.factorC][idx];
        var col=T.series[idx%T.series.length]||'var(--ink)';
        html+='<div><div style="font-size:11.5px;font-weight:700;color:'+col+';margin-bottom:6px">'+fName+'</div>';
        html+=mkTable(['Level','Mean','N'],mArr.map(function(m){return[m.level,m.mean,m.n];}));
        html+='</div>';
      });
      html+='</div>';
      // A×B interaction plot
      html+='<div style="margin-top:14px"><div style="font-size:11.5px;font-weight:700;color:var(--ink);margin-bottom:6px">A×B Interaction Plot (averaged over C)</div>';
      html+=svgInteractionPlot(r.cellMeansAB, r.factorB, r.factorA, r.depVar);
      html+='</div>';
  return html;
}
