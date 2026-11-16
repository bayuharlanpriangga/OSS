// o.type==='repeated'
function renderOutBasic_repeated(o){
  var html='';
  var r=o.res;
  if(!r||r._err){
    return '<div class="notice-box notice-err">⚠ '+escHtml(r&&r._err?r._err:'No repeated measures result')+'</div>';
  }
  var vA=o.varA||r.varA||'Pre';
  var vB=o.varB||r.varB||'Post';
  html+='<div class="stats-grid" style="margin-bottom:11px">';
  html+=stCard('N',r.n);
  html+=stCard('Mean Diff',r.meanDiff,'SE = '+(r.seDiff||r.se||'—'));
  html+=stCard('t (df='+r.df+')',r.t,'p = '+r.p_fmt);
  html+=stCard("Cohen's dz",r.cohensD,r.dInterp);
  html+='</div>';
  html+='<div class="row" style="margin:8px 0 11px">'+sigBadge(r.p)+'</div>';
  if(r.meanA!==undefined&&r.meanB!==undefined){
    html+='<div class="sec-hd" style="font-size:11px;margin-bottom:6px">Time Point Descriptives</div>';
    html+=mkTable(['Condition','N','Mean','SD'],[
      [escHtml(vA)+' (Time 1)',r.n,r.meanA,r.sdA],
      [escHtml(vB)+' (Time 2)',r.n,r.meanB,r.sdB]
    ]);
  }
  html+='<div class="sec-hd" style="font-size:11px;margin:10px 0 6px">Within-Subjects Difference ('+escHtml(vA)+' − '+escHtml(vB)+')</div>';
  html+=mkTable(['Statistic','Value'],[
    ['Mean Diff',r.meanDiff],
    ['SD Diff',r.sdDiff],
    ['SE Diff',r.seDiff||'—'],
    ['t',r.t],
    ['df',r.df],
    ['p',r.p_fmt],
    ['95% CI',r.ci95],
    ["Cohen's dz",r.cohensD+' ('+r.dInterp+')'],
    ['Normality (Diff)',r.normD||'N/A']
  ]);
  if(r.interaction){
    var ia=r.interaction;
    html+='<div class="sec-hd" style="font-size:11px;margin:11px 0 6px">Time × '+escHtml(ia.factor)+' (Change Score Interaction)</div>';
    html+=mkTable(['Source','df1','df2','F','p','η²'],[
      ['Time × '+escHtml(ia.factor),ia.dfB,ia.dfW,ia.F,(ia.sig?'<b style="color:var(--ok)">'+ia.p_fmt+'</b>':ia.p_fmt),ia.eta2]
    ]);
    if(ia.groupStats&&ia.groupStats.length){
      html+=mkTable([escHtml(ia.factor),'N','Mean Δ (Post − Pre)','SD Δ'],
        ia.groupStats.map(function(g){return[escHtml(g.label),g.n,g.mean,g.sd];}));
    }
  }
  if(typeof svgScatter==='function'&&o.varA&&o.varB){
    html+=svgScatter(data,o.varA,o.varB);
  }
  return html;
}
