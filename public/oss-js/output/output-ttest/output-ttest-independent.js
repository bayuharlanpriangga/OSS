// o.type==='ttest'
function renderOutBasic_ttest(o){
  var html='';
      html+=mkTable(['','Group A ('+o.ga+')','Group B ('+o.gb+')'],
        [['N',o.res.nA,o.res.nB],['Mean',o.res.meanA,o.res.meanB],['SD',o.res.sdA,o.res.sdB]]);
      html+='<div class="stats-grid" style="margin:10px 0">'+stCard('t',o.res.t,'df='+o.res.df)+stCard('p-value',o.res.p_fmt)+stCard("Cohen's d",o.res.cohensD,o.res.dInterp)+stCard('95% CI',o.res.ci95)+'</div>';
      if(o.res.cohensD_ci&&o.res.cohensD_ci!=='[—, —]') html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-bottom:8px">Cohen\'s d 95% CI: <span style="color:var(--ink);font-weight:600">'+o.res.cohensD_ci+'</span></div>';
      html+='<div class="row" style="margin-bottom:10px">'+sigBadge(o.res.p)+'</div>';
      if(o.swA||o.swB||o.res.warnings?.length){
        html+='<div class="assumption-box" style="margin-bottom:10px">';
        html+='<div style="font-size:10.5px;font-weight:700;color:var(--warn);margin-bottom:5px;text-transform:uppercase;letter-spacing:.7px">Assumptions</div>';
        if(o.res.warnings) o.res.warnings.forEach(w=>{
          const col=w.level==='error'?'var(--err)':'var(--warn)';
          html+='<div style="font-size:11.5px;color:'+col+';margin-bottom:3px">'+(w.level==='error'?'✗':'⚠')+' '+w.msg+'</div>';
        });
        if(o.swA) html+='<div style="font-size:11.5px;color:var(--ink-muted)">SW ('+o.ga+'): W='+o.swA.W+' p='+o.swA.p+' → '+(parseFloat(o.swA.p)>.05?'<span style="color:var(--ok);font-weight:600">Normal</span>':'<span style="color:var(--err);font-weight:600">Non-normal</span>')+'</div>';
        if(o.swB) html+='<div style="font-size:11.5px;color:var(--ink-muted)">SW ('+o.gb+'): W='+o.swB.W+' p='+o.swB.p+' → '+(parseFloat(o.swB.p)>.05?'<span style="color:var(--ok);font-weight:600">Normal</span>':'<span style="color:var(--err);font-weight:600">Non-normal</span>')+'</div>';
        if(o.lev) html+='<div style="font-size:11.5px;color:var(--ink-muted)">Levene: F='+o.lev.F+' p='+o.lev.p_fmt+(parseFloat(o.lev.p)<.05?' → <span style="color:var(--warn);font-weight:600">Unequal variance</span>':' → Equal variance')+'</div>';
        html+='</div>';
      }
      html+=svgBoxplot(data,o.depV,o.grpV);
  return html;
}
