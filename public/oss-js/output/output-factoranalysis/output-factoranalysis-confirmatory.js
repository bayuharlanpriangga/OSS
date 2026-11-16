// RENDER OUTPUT CFA
function renderOutAdv_cfa(o){
  var html='';
      var r=o.res;
      var T=typeof ossChartTheme==='function'?ossChartTheme():{series:['#4F7A99','#D4A72C','#2F7048','#A8530E','#A93226']};
      var fitOk=r.CFI_raw>=0.95&&r.RMSEA_raw<=0.06;
      var fitAcc=r.CFI_raw>=0.90&&r.RMSEA_raw<=0.08;
      var fitCol=fitOk?'var(--ok)':fitAcc?'var(--warn)':'var(--err)';
      var fitCls=fitOk?'notice-ok':fitAcc?'notice-warn':'notice-err';
      // Overall fit badge
      html+='<div class="notice-box '+fitCls+'" style="margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">';
      html+='<div><div style="font-size:15px;font-weight:800;color:'+fitCol+';font-family:var(--font-serif-stack)">'+r.overallFit+'</div>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-top:2px">N='+r.n+', '+r.p+' variabel, '+r.nFactors+' faktor laten</div></div>';
      html+='<div style="text-align:right;font-family:var(--font-mono-stack);font-variant-numeric:tabular-nums"><div style="font-size:11px;color:var(--ink-muted)">χ²('+r.dfModel+')='+r.chiSq+'</div><div style="font-size:11px;color:var(--ink-muted)">p = '+r.pChiSq+'</div></div>';
      html+='</div>';
      // 4 Fit index cards
      var cficol=r.CFI_raw>=0.95?'var(--ok)':r.CFI_raw>=0.90?'var(--warn)':'var(--err)';
      var tlicol=r.TLI_raw>=0.95?'var(--ok)':r.TLI_raw>=0.90?'var(--warn)':'var(--err)';
      var rmsecol=r.RMSEA_raw<=0.05?'var(--ok)':r.RMSEA_raw<=0.08?'var(--warn)':'var(--err)';
      var srmrcol=r.SRMR_raw<=0.05?'var(--ok)':r.SRMR_raw<=0.08?'var(--warn)':'var(--err)';
      html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:12px">';
      html+=stCard('CFI','<span style="color:'+cficol+'">'+r.CFI+'</span>',r.CFIinterp+' (≥.95 excellent)');
      html+=stCard('TLI / NNFI','<span style="color:'+tlicol+'">'+r.TLI+'</span>',r.TLIinterp+' (≥.95 excellent)');
      html+=stCard('RMSEA','<span style="color:'+rmsecol+'">'+r.RMSEA+'</span>',r.RMSEAinterp+' (≤.05 excellent)');
      html+=stCard('SRMR','<span style="color:'+srmrcol+'">'+r.SRMR+'</span>',r.SRMRinterp+' (≤.05 excellent)');
      html+='</div>';
      // Fit tags row
      html+='<div class="row" style="margin-bottom:10px">';
      html+='<span class="tag '+(r.CFI_raw>=0.95?'tag-green':r.CFI_raw>=0.90?'tag-yellow':'tag-red')+'">CFI: '+r.CFIinterp+'</span>';
      html+='<span class="tag '+(r.TLI_raw>=0.95?'tag-green':r.TLI_raw>=0.90?'tag-yellow':'tag-red')+'">TLI: '+r.TLIinterp+'</span>';
      html+='<span class="tag '+(r.RMSEA_raw<=0.05?'tag-green':r.RMSEA_raw<=0.08?'tag-yellow':'tag-red')+'">RMSEA: '+r.RMSEAinterp+'</span>';
      html+='<span class="tag '+(r.SRMR_raw<=0.05?'tag-green':r.SRMR_raw<=0.08?'tag-yellow':'tag-red')+'">SRMR: '+r.SRMRinterp+'</span>';
      html+='</div>';
      // RMSEA CI + Chi-square table
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-bottom:10px">RMSEA 90% CI: ['+r.RMSEA_lo+' – '+r.RMSEA_hi+']</div>';
      html+=mkTable(
        ['Index','Value','Cutoff (Excellent)','Cutoff (Acceptable)','Interpretation'],
        [
          ['CFI', r.CFI, '≥ .95', '≥ .90', r.CFIinterp],
          ['TLI (NNFI)', r.TLI, '≥ .95', '≥ .90', r.TLIinterp],
          ['RMSEA', r.RMSEA, '≤ .05', '≤ .08', r.RMSEAinterp+' ['+r.RMSEA_lo+', '+r.RMSEA_hi+']'],
          ['SRMR', r.SRMR, '≤ .05', '≤ .08', r.SRMRinterp],
          ['χ²', r.chiSq, 'p > .05*', '—', 'df='+r.dfModel+', p='+r.pChiSq+' (*N-sensitive)'],
        ]
      );
      // Factor loadings
      html+='<div class="sec-hd" style="margin-top:13px;margin-bottom:8px">Factor Loadings (Standardized)</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Faktor</th><th>Indikator</th><th style="text-align:right">λ (Loading)</th><th style="text-align:right">h² (Communality)</th><th>Status</th></tr></thead><tbody>';
      r.factorNames.forEach(function(fn, fi){
        var fcolor=T.series[fi%T.series.length];
        var vars=r.factorMap[fn]||[];
        vars.forEach(function(v,vi){
          var vIdx=r.varNames.indexOf(v);
          var lam=vIdx>=0?r.lambda[vIdx][fi]:'—';
          var h2=vIdx>=0?r.communalities[vIdx]:'—';
          var lamNum=parseFloat(lam);
          var h2num=parseFloat(h2);
          var lamCol=Math.abs(lamNum)>=0.7?'var(--ok)':Math.abs(lamNum)>=0.5?'var(--line)':Math.abs(lamNum)>=0.3?'var(--warn)':'var(--err)';
          var h2col=h2num>=0.7?'var(--ok)':h2num>=0.4?'var(--warn)':'var(--err)';
          html+='<tr>';
          if(vi===0) html+='<td class="td-label" rowspan="'+vars.length+'" style="color:'+fcolor+';font-weight:700;vertical-align:middle">'+escHtml(fn)+'</td>';
          html+='<td class="td-label">'+escHtml(v)+'</td>';
          html+='<td class="td-num" style="color:'+lamCol+';font-weight:'+(Math.abs(lamNum)>=0.5?700:400)+'">'+lam+'</td>';
          html+='<td class="td-num" style="color:'+h2col+'">'+h2+'</td>';
          html+='<td>'+(Math.abs(lamNum)>=0.5?'<span class="tag tag-green" style="font-size:9px">✓ Adequate</span>':'<span class="tag tag-red" style="font-size:9px">✗ Weak</span>')+'</td>';
          html+='</tr>';
        });
      });
      html+='</tbody></table></div>';
      html+='<div style="font-size:11px;color:var(--ink-subtle);margin-top:6px">λ ≥ 0.70 strong, ≥ 0.50 adequate, &lt; 0.30 weak | h² = komunalitas (variance explained)</div>';
      // Interpretation note
      html+='<div class="assump" style="margin-top:10px"><b style="color:var(--ink)">Interpretasi Model:</b> '+r.overallFit+'. '
        +(r.CFI_raw>=0.95&&r.RMSEA_raw<=0.06?'Model memiliki fit yang baik terhadap data. ':'')
        +(r.CFI_raw<0.90||r.RMSEA_raw>0.08?'Pertimbangkan modifikasi model berdasarkan Modification Indices atau residual matrix. ':'')
        +'Reference: Hu & Bentler (1999); Hair et al. (2010) untuk SEM cut-off criteria.</div>';
  return html;
}
