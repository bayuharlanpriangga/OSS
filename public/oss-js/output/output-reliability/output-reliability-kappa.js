// RENDER OUTPUT KAPPA
function renderOutAdv_kappa(o){
  var html='';
      var r=o.res;
      var kv=parseFloat(r.kappa);
      var kCls=kv>=0.8?'tag-green':kv>=0.6?'tag-blue':kv>=0.4?'tag-purple':kv>=0.2?'tag-yellow':'tag-red';
      // Summary stats row
      html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-bottom:10px">';
      html+=stCard("Cohen's κ",r.kappa,r.interp);
      html+=stCard('SE',r.seK);
      html+=stCard('z-score',r.z);
      html+=stCard('Cases n',r.n);
      html+='</div>';
      html+='<div class="row" style="margin-bottom:8px">';
      html+='<span class="tag '+kCls+'">'+r.interp+'</span>';
      html+='<span class="tag tag-blue">p'+r.pFmt+'</span>';
      html+='<span class="tag tag-gray">95% CI ['+r.ci95lo+', '+r.ci95hi+']</span>';
      if(o.weighted&&r.wKappa!==null) html+='<span class="tag tag-blue">Weighted κ='+r.wKappa+' ('+r.interpW+')</span>';
      html+='</div>';
      // Agreement detail
      html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px;margin-bottom:10px">';
      html+=stCard('Observed Agreement (Po)',r.po);
      html+=stCard('Expected Agreement (Pe)',r.pe);
      html+='</div>';
      // Confusion matrix
      html+='<div class="sec-hd" style="margin-bottom:6px">Confusion Matrix</div>';
      html+='<div class="tbl-wrap" style="margin-bottom:12px"><table><thead><tr><th style="color:var(--line)">'+escHtml(o.vars[0])+' \\ '+escHtml(o.vars[1])+'</th>';
      r.cats.forEach(function(c){html+='<th style="text-align:right">'+escHtml(c)+'</th>';});
      html+='<th style="text-align:right">Total</th></tr></thead><tbody>';
      r.cats.forEach(function(cat,i){
        html+='<tr class="'+(i%2?'':'alt')+'"><td class="td-label" style="color:var(--line);font-weight:600">'+escHtml(cat)+'</td>';
        r.mat[i].forEach(function(cell,j){
          var isDiag=i===j;
          html+='<td class="td-num" style="'+(isDiag?'background:var(--gold-tint);font-weight:700;color:var(--ink)':'')+'">'+cell+'</td>';
        });
        html+='<td class="td-num" style="color:var(--ink-muted);font-weight:600">'+r.rowSum[i]+'</td></tr>';
      });
      html+='<tr style="background:var(--surface-alt);border-top:1px solid var(--line-soft)"><td class="td-label" style="font-weight:700">Total</td>';
      r.colSum.forEach(function(v){html+='<td class="td-num" style="color:var(--ink-muted);font-weight:600">'+v+'</td>';});
      html+='<td class="td-num" style="font-weight:800;color:var(--ink)">'+r.n+'</td></tr>';
      html+='</tbody></table></div>';
      // Per-category stats
      html+='<div class="sec-hd" style="margin-bottom:6px">Per-Category Agreement</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Category</th><th style="text-align:right">n (Rater 1)</th><th style="text-align:right">Correct</th><th style="text-align:right">Precision</th><th style="text-align:right">Recall</th></tr></thead><tbody>';
      r.catStats.forEach(function(cs,i){
        html+='<tr class="'+(i%2?'':'alt')+'"><td class="td-label">'+cs.cat+'</td>';
        html+='<td class="td-num">'+cs.n+'</td>';
        html+='<td class="td-num" style="color:var(--ok);font-weight:600">'+cs.tp+'</td>';
        html+='<td class="td-num">'+cs.precision+'</td>';
        html+='<td class="td-num">'+cs.recall+'</td></tr>';
      });
      html+='</tbody></table></div>';
      html+='<div style="margin-top:8px;font-size:11.5px;color:var(--ink-muted)">Rater 1: '+escHtml(o.vars[0])+' &nbsp;|&nbsp; Rater 2: '+escHtml(o.vars[1])+'</div>';
  return html;
}
