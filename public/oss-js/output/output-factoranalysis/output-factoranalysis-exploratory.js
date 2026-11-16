// RENDER OUTPUT EFA
function renderOutAdv_efa(o){
  var html='';
      var r=o.res;
      // KMO + Bartlett
      html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-bottom:11px">';
      var kmoColor=parseFloat(r.kmo)>=0.7?'var(--ok)':parseFloat(r.kmo)>=0.5?'var(--warn)':'var(--err)';
      html+=stCard('KMO','<span style="color:'+kmoColor+'">'+r.kmo+'</span>',r.kmoInterp);
      html+=stCard('Bartlett χ²',r.chi2,'df='+r.bartDf+' p='+r.bartP);
      html+=stCard('Variance Explained',r.cumVar[r.nFactors-1]+'%',r.nFactors+' factor'+(r.nFactors>1?'s':'')+', '+r.rotation);
      html+='</div>';
      html+='<div class="row" style="margin-bottom:11px">';
      html+='<span class="tag '+(parseFloat(r.kmo)>=0.7?'tag-green':parseFloat(r.kmo)>=0.5?'tag-yellow':'tag-red')+'">KMO: '+r.kmoInterp+'</span>';
      html+='<span class="tag '+(r.bartSig?'tag-green':'tag-red')+'">'+(r.bartSig?'✓ Bartlett significant':'✗ Bartlett not sig')+'</span>';
      html+='</div>';
      // Eigenvalue table
      html+='<div class="sec-hd" style="margin-bottom:8px">Eigenvalues & Variance Explained</div>';
      html+='<div class="tbl-wrap" style="margin-bottom:12px"><table><thead><tr><th>Factor</th><th style="text-align:right">Eigenvalue</th><th style="text-align:right">% Variance</th><th style="text-align:right">Cumulative %</th><th>Retain?</th></tr></thead><tbody>';
      r.eigenvalues.forEach(function(ev,i){
        var retain=i<r.nFactors;
        var evNum=parseFloat(ev);
        html+='<tr style="'+(retain?'background:var(--gold-tint)':'')+'">';
        html+='<td class="td-label">F'+(i+1)+'</td>';
        html+='<td class="td-num" style="font-weight:'+(evNum>1?700:400)+';color:'+(evNum>1?'var(--ink)':evNum>0.5?'var(--ink-muted)':'var(--ink-subtle)')+'">'+ev+'</td>';
        html+='<td class="td-num">'+(r.varExp[i]||'—')+'%</td>';
        html+='<td class="td-num">'+(r.cumVar[i]||'—')+'%</td>';
        html+='<td>'+(retain?'<span class="tag tag-green" style="font-size:9px">✓ Yes</span>':(evNum>1?'<span class="tag tag-yellow" style="font-size:9px">Consider</span>':'<span style="font-size:10px;color:var(--ink-subtle)">No</span>'))+'</td>';
        html+='</tr>';
      });
      html+='</tbody></table></div>';
      // Scree plot
      html+='<div style="margin-bottom:12px">'+svgScreePlot(r.eigenvalues,r.nFactors)+'</div>';
      // Factor loadings
      html+='<div class="sec-hd" style="margin-bottom:8px">Factor Loading Matrix <span style="font-weight:400;font-style:normal;color:var(--ink-subtle);font-size:10.5px">('+r.rotation+', |loading| ≥ 0.40 highlighted)</span></div>';
      html+='<div class="tbl-wrap" style="margin-bottom:10px"><table><thead><tr><th>Variable</th>';
      for(var fi=0;fi<r.nFactors;fi++) html+='<th style="text-align:right">F'+(fi+1)+'</th>';
      html+='<th style="text-align:right">Communality h²</th></tr></thead><tbody>';
      o.efaVars.forEach(function(v,i){
        html+='<tr><td class="td-label">'+escHtml(v)+'</td>';
        r.loadings[i].forEach(function(l){
          var absL=Math.abs(parseFloat(l));
          var col=absL>=0.6?'var(--gold-text)':absL>=0.4?'var(--line)':'var(--ink-subtle)';
          var fw=absL>=0.4?700:400;
          html+='<td class="td-num" style="color:'+col+';font-weight:'+fw+'">'+l+'</td>';
        });
        var h2=parseFloat(r.communalities[i]);
        var h2col=h2>=0.7?'var(--ok)':h2>=0.4?'var(--warn)':'var(--err)';
        html+='<td class="td-num" style="color:'+h2col+';font-weight:600">'+r.communalities[i]+'</td>';
        html+='</tr>';
      });
      html+='</tbody></table></div>';
      html+='<div style="font-size:11px;color:var(--ink-muted);margin-bottom:6px">Gold ≥0.60 strong, Ice ≥0.40 moderate | Communality: green ≥0.70, amber ≥0.40, red &lt;0.40</div>';
      // Interpretation hint
      html+='<div class="assump"><b style="color:var(--ink)">N</b>='+r.n+' cases &nbsp;|&nbsp; <b style="color:var(--ink)">p</b>='+r.p+' variables &nbsp;|&nbsp; '+r.nFactors+' factors extracted</div>';
  return html;
}
