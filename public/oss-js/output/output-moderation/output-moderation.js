// RENDER OUTPUT MODERATION
function renderModerationOutput(o){
  var r=o.res;
  var intSig2=parseFloat(r.interaction.p)<0.05;
  var intColor=intSig2?'var(--ok)':'var(--err)';
  var html='';
  html+='<div class="notice-box '+(intSig2?'notice-ok':'notice-err')+'" style="margin-bottom:12px"><div style="font-size:14.5px;font-weight:800;color:'+intColor+';font-family:var(--font-serif-stack)">'+(intSig2?'&#x2713; Significant Moderation':'&#x2717; Non-significant Moderation')+'</div>';
  html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-top:2px">'+escHtml(r.xName)+'&#xD7;'+escHtml(r.wName)+' &#x2192; '+escHtml(r.yName)+' | N='+r.n+(r.center?' (mean-centered)':'')+'</div></div>';
  html+='<div class="stats-grid" style="margin-bottom:12px">';
  html+=stCard('R&#xB2;',r.R2,'Variance explained');
  html+=stCard('Adj R&#xB2;',r.R2adj,'');
  html+=stCard('F',r.F,'p='+r.pF_fmt);
  html+=stCard('N',r.n,'');
  html+=stCard('&#x394;R&#xB2; (int)',r.deltaR2,'Interaction increment');
  html+=stCard('b(X&#xD7;W)',r.interaction.b,'p='+r.interaction.p_fmt);
  html+='</div>';
  html+='<div class="sec-hd" style="margin-bottom:7px">Regression Coefficients</div>';
  html+='<div class="tbl-wrap"><table><thead><tr><th>Variable</th><th style="text-align:right">b</th><th style="text-align:right">SE</th><th style="text-align:right">&#x3B2;</th><th style="text-align:right">t</th><th style="text-align:right">p</th></tr></thead><tbody>';
  r.coefs.forEach(function(c){
    var sig=parseFloat(c.p)<0.05;
    html+='<tr><td class="td-label">'+escHtml(c.name)+'</td><td class="td-num">'+c.b+'</td><td class="td-num">'+c.SE+'</td><td class="td-num">'+c.beta+'</td><td class="td-num">'+c.t+'</td><td class="td-num"><span class="tag '+(sig?'tag-green':'tag-gray')+'">'+c.p_fmt+'</span></td></tr>';
  });
  html+='</tbody></table></div>';
  html+='<div style="margin-top:12px">'+svgModerationPlot(r,r.xName,r.wName,r.yName)+'</div>';
  html+='<div class="sec-hd" style="margin-top:12px;margin-bottom:7px">Simple Slopes Analysis</div>';
  html+='<div class="tbl-wrap"><table><thead><tr><th>W Level</th><th style="text-align:right">W Value</th><th style="text-align:right">Slope</th><th style="text-align:right">SE</th><th style="text-align:right">t</th><th style="text-align:right">p</th><th style="text-align:right">95% CI</th></tr></thead><tbody>';
  r.simpleSlopes.forEach(function(s){
    var ssig=parseFloat(s.p)<0.05;
    html+='<tr><td class="td-label" style="color:'+s.color+';font-weight:600">'+s.label+'</td><td class="td-num">'+s.wVal+'</td><td class="td-num" style="color:'+s.color+';font-weight:600">'+s.slope+'</td><td class="td-num">'+s.se+'</td><td class="td-num">'+s.t+'</td><td class="td-num"><span class="tag '+(ssig?'tag-green':'tag-gray')+'">'+s.p_fmt+'</span></td><td class="td-num" style="font-size:11px">'+s.ci95+'</td></tr>';
  });
  html+='</tbody></table></div>';
  if(r.jn){
    html+='<div class="sec-hd" style="margin-top:12px;margin-bottom:5px">Johnson-Neyman Floodlight Analysis</div>';
    html+=svgJohnsonNeymanPlot(r,r.xName,r.wName,r.yName);
    if(r.jn.regions.length>0){
      html+='<div class="tbl-wrap" style="margin-top:8px"><table><thead><tr><th>JN Point</th><th style="text-align:right">W Value</th><th>Significant Region</th><th style="text-align:right">% Dataset</th></tr></thead><tbody>';
      r.jn.regions.forEach(function(rp,i){html+='<tr><td class="td-label">JN-'+(i+1)+'</td><td class="td-num">'+SE.f4(rp.value)+'</td><td class="td-label" style="color:var(--gold-text);font-weight:600">'+rp.direction+'</td><td class="td-num">'+rp.pct+'%</td></tr>';});
      html+='</tbody></table></div>';
    } else {
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-top:5px">No JN transition points found. '+r.jn.pctSig+'% of W range shows significant X&#x2192;Y relationship.</div>';
    }
  }
  html+='<div class="assump" style="margin-top:12px"><b style="color:var(--ink)">Interpretation:</b> '+(intSig2?'Significant':'Non-significant')+' interaction b(X&#xD7;W)='+r.interaction.b+', t='+r.interaction.t+', p='+r.interaction.p_fmt+', &#x394;R&#xB2;='+r.deltaR2+'. '+(intSig2?'The effect of '+escHtml(r.xName)+' on '+escHtml(r.yName)+' is moderated by '+escHtml(r.wName)+'. Examine simple slopes and JN plot for regions of significance.':'The effect of '+escHtml(r.xName)+' on '+escHtml(r.yName)+' does not significantly differ across levels of '+escHtml(r.wName)+'.')+'</div>';
  return html;
}
