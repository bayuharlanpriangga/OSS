// o.type==='paired'
function renderOutBasic_paired(o){
  var html='';
      html+=mkTable(['','Value'],[['N',o.res.n],['Mean Diff',o.res.meanDiff],['SD Diff',o.res.sdDiff],['t',o.res.t],['df',o.res.df],['p',o.res.p_fmt],["Cohen's dz",o.res.cohensD+' ('+o.res.dInterp+')'],['95% CI',o.res.ci95]]);
      html+='<div class="row" style="margin:10px 0">'+sigBadge(o.res.p)+'</div>';
      html+=svgScatter(data,o.varA,o.varB);
  return html;
}
