// ANOVA Source Table renderer
function renderAnovaTable(effects, error, total){
  var h='<div class="tbl-wrap"><table><thead><tr>';
  ['Source','SS','df','MS','F','p','η²','ηₚ²'].forEach(function(c){h+='<th>'+c+'</th>';});
  h+='</tr></thead><tbody>';
  effects.forEach(function(e,i){
    var sc=e.sig?'#34d399':'#94a3b8';
    h+='<tr class="'+(i%2?'':'alt')+'">';
    h+='<td style="font-weight:700;color:'+(e.source.indexOf('×')>=0?'#fbbf24':'#c084fc')+'">'+e.source+'</td>';
    ['SS','df','MS','F'].forEach(function(k){h+='<td style="font-family:monospace">'+e[k]+'</td>';});
    h+='<td><span style="font-weight:700;color:'+sc+'">'+e.p_fmt+'</span>'+(e.sig?' <span style="font-size:9px;color:#34d399">*</span>':'')+'</td>';
    h+='<td style="font-family:monospace">'+e.eta2+'</td>';
    h+='<td style="font-family:monospace">'+e.pEta2+'</td>';
    h+='</tr>';
  });
  // Error row
  h+='<tr style="background:rgba(255,255,255,.015)"><td style="color:#64748b">Error</td>';
  h+='<td style="font-family:monospace">'+error.SS+'</td><td>'+error.df+'</td><td style="font-family:monospace">'+error.MS+'</td><td colspan="4">—</td></tr>';
  // Total row
  if(total){
    h+='<tr style="background:rgba(255,255,255,.015)"><td style="color:#64748b;font-weight:700">Total</td>';
    h+='<td style="font-family:monospace">'+total.SS+'</td><td>'+total.df+'</td><td colspan="5">—</td></tr>';
  }
  h+='</tbody></table></div>';
  return h;
}
