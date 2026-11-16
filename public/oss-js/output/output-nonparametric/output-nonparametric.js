// o.type==='mannwhitney' | 'kruskal' | 'wilcoxon'
function renderOutBasic_mannwhitney(o){
  var html='';
      html+=mkTable(['','A ('+o.ga+')','B ('+o.gb+')'],[['Median',o.res.medA,o.res.medB],['N',o.res.nA,o.res.nB]]);
      html+='<div class="stats-grid" style="margin:10px 0">'+stCard('U',o.res.U)+(o.res.z!=='—'?stCard('z',o.res.z):'')+stCard('p',o.res.p_fmt)+stCard('r_eff',o.res.r_eff)+'</div>';
      html+='<div class="row">'+sigBadge(o.res.p);
      if(o.res.method) html+='<span class="tag tag-gray" style="font-size:10px">'+(o.res.method==='exact'?'Exact p':'Asymptotic z')+'</span>';
      html+='</div>';
  return html;
}

function renderOutBasic_kruskal(o){
  var html='';
      html+=mkTable(['Group','N','Median','Mean'],o.res.groupStats.map(g=>[g.label,g.n,g.median,g.mean]));
      html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin:10px 0">'+stCard('H',o.res.H)+stCard('df',o.res.df)+stCard('p',o.res.p_fmt)+'</div>';
      html+='<div class="row">'+sigBadge(o.res.p)+'</div>';
  return html;
}

function renderOutBasic_wilcoxon(o){
  var html='';
      html+='<div class="stats-grid" style="margin-bottom:10px">'+stCard('W+',o.res.Wplus)+stCard('W−',o.res.Wminus)+(o.res.z!=='—'?stCard('z',o.res.z):'')+stCard('p',o.res.p_fmt)+'</div>';
      html+='<div class="row">'+sigBadge(o.res.p);
      if(o.res.method) html+='<span class="tag tag-gray" style="font-size:10px">'+(o.res.method==='exact'?'Exact p':'Asymptotic z')+'</span>';
      html+='</div>';
  return html;
}
