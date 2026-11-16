// o.type==='correlation' | 'partialCorr'
function renderOutBasic_correlation(o){
  var html='';
      html+='<div class="stats-grid" style="margin-bottom:10px">'+stCard('r',o.res.r)+stCard('r²',o.res.r2,'Variance explained')+stCard('p',o.res.p_fmt)+stCard('95% CI',o.res.ci95)+'</div>';
      html+='<div class="row" style="margin-bottom:10px">'+sigBadge(o.res.p)+'<span class="tag tag-gray">'+o.res.strength+' '+o.res.direction+'</span></div>';
      html+=svgScatter(data,o.crX,o.crY);
  return html;
}

// o.type==='partialCorr'
function renderOutBasic_partialCorr(o){
  var html='';
      html+='<div class="notice-box" style="margin-bottom:8px">Correlation between <b style="color:var(--ink)">'+escHtml(o.pcX)+'</b> and <b style="color:var(--ink)">'+escHtml(o.pcY)+'</b> controlling for <b style="color:var(--ink)">'+escHtml(o.pcZ)+'</b></div>';
      html+='<div class="stats-grid" style="margin-bottom:10px">'+stCard('Partial r',o.res.rp)+stCard('r²',o.res.r2,'Variance explained')+stCard('p',o.res.p_fmt)+stCard('95% CI',o.res.ci95)+'</div>';
      html+='<div class="row" style="margin-bottom:10px">'+sigBadge(o.res.p)+'<span class="tag tag-gray">'+o.res.strength+' '+(parseFloat(o.res.rp)>=0?'positive':'negative')+'</span></div>';
      html+=mkTable(['','r','Note'],[
        [escHtml(o.pcX)+' × '+escHtml(o.pcY)+' (zero-order)',o.res.rxy,'Before controlling for '+escHtml(o.pcZ)],
        [escHtml(o.pcX)+' × '+escHtml(o.pcY)+' (partial)',o.res.rp,'After controlling for '+escHtml(o.pcZ)],
        [escHtml(o.pcX)+' × '+escHtml(o.pcZ),o.res.rxz,'Control correlation'],
        [escHtml(o.pcY)+' × '+escHtml(o.pcZ),o.res.ryz,'Control correlation'],
      ]);
      html+='<div class="notice-box" style="margin-top:9px">n='+o.res.n+' &nbsp;|&nbsp; df='+o.res.df+' &nbsp;|&nbsp; t='+o.res.t+'</div>';
      html+=svgScatter(data,o.pcX,o.pcY);
  return html;
}
