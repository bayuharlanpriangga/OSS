// RENDER OUTPUT ALPHA
function renderOutAdv_alpha(o){
  var html='';
      html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-bottom:10px">'+stCard('Cronbach α',o.res.alpha,o.res.interp)+stCard('Items k',o.res.k)+stCard('Cases n',o.res.n)+'</div>';
      html+='<div class="row"><span class="tag '+(parseFloat(o.res.alpha)>=.7?'tag-green':'tag-red')+'">'+o.res.interp+' reliability</span></div>';
      html+='<div style="margin-top:8px;font-size:11.5px;color:var(--ink-muted)">Items: '+o.vars.map(escHtml).join(', ')+'</div>';
  return html;
}
