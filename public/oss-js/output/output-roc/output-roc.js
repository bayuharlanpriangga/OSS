// RENDER OUTPUT ROC
function renderOutAdv_roc(o){
  var html='';
      var r=o.res;
      var aucV=parseFloat(r.auc);
      var aucCol2=aucV>=0.9?'var(--ok)':aucV>=0.8?'var(--line)':aucV>=0.7?'var(--warn)':'var(--err)';
      var aucCls=aucV>=0.8?'notice-ok':aucV>=0.7?'notice-warn':'notice-err';
      html+='<div class="notice-box '+aucCls+'" style="margin-bottom:11px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">';
      html+='<div><div style="font-size:14.5px;font-weight:800;color:'+aucCol2+';font-family:var(--font-serif-stack)">'+r.aucInterp+'</div><div style="font-size:11.5px;color:var(--ink-muted);margin-top:2px">'+escHtml(o.rocProb)+' → '+escHtml(o.rocTrue)+' (pos: '+escHtml(r.posClass)+')</div></div>';
      html+='<div style="text-align:right;font-family:var(--font-mono-stack);font-variant-numeric:tabular-nums"><div style="font-size:17px;font-weight:800;color:'+aucCol2+'">AUC = '+r.auc+'</div><div style="font-size:10.5px;color:var(--ink-muted)">95% CI: '+r.aucCI+'</div></div>';
      html+='</div>';
      html+='<div class="stats-grid" style="margin-bottom:12px">';
      html+=stCard('AUC',r.auc,r.aucInterp);
      html+=stCard('95% CI',r.aucCI,'Hanley-McNeil');
      html+=stCard('N',r.n,'pos='+r.nPos+' neg='+r.nNeg);
      html+=stCard('Optimal Cutoff',r.optThresh,'Youden');
      html+=stCard('Sensitivity',r.optSens,'at optimal');
      html+=stCard('Specificity',r.optSpec,'at optimal');
      html+=stCard('PPV',r.optPPV,'precision');
      html+=stCard('NPV',r.optNPV,'');
      html+=stCard('F1 Score',r.optF1,'');
      html+=stCard('Youden J',r.optYouden,'');
      html+='</div>';
      html+='<div style="max-width:560px">'+svgROC(r)+'</div>';
      if(o.compare&&o.compare.curves&&o.compare.curves.length>=2){
        var T=typeof ossChartTheme==='function'?ossChartTheme():{series:['#4F7A99','#D4A72C','#2F7048','#A8530E']};
        html+='<div style="margin-top:14px"><div class="sec-hd" style="margin-bottom:6px">ROC Curve Comparison (DeLong Test)</div>';
        html+='<div style="max-width:580px">'+svgROCCompare(o.compare.curves)+'</div>';
        html+='<div class="tbl-wrap" style="margin-top:10px"><table><thead><tr><th>Model / Score</th><th style="text-align:right">AUC</th><th style="text-align:right">95% CI</th><th style="text-align:right">Cutoff</th><th style="text-align:right">Sens</th><th style="text-align:right">Spec</th></tr></thead><tbody>';
        o.compare.curves.forEach(function(c,ci){
          var cr=c.roc, col=T.series[ci%T.series.length];
          html+='<tr><td class="td-label"><span style="display:inline-flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:2px;background:'+col+';display:inline-block"></span>'+escHtml(c.name)+'</span></td><td class="td-num" style="color:var(--gold-text);font-weight:700">'+cr.auc+'</td><td class="td-num">'+cr.aucCI+'</td><td class="td-num">'+cr.optThresh+'</td><td class="td-num">'+cr.optSens+'</td><td class="td-num">'+cr.optSpec+'</td></tr>';
        });
        html+='</tbody></table></div>';
        if(o.compare.delongPairs&&o.compare.delongPairs.length){
          html+='<div class="tbl-wrap" style="margin-top:8px"><table><thead><tr><th>Comparison</th><th style="text-align:right">z</th><th style="text-align:right">p</th><th>Result</th></tr></thead><tbody>';
          o.compare.delongPairs.forEach(function(dp){
            var dSig=parseFloat(dp.test.p)<0.05;
            html+='<tr><td class="td-label">'+escHtml(dp.base)+' vs '+escHtml(dp.comp)+'</td><td class="td-num">'+dp.test.z+'</td><td class="td-num"><span class="tag '+(dSig?'tag-green':'tag-gray')+'">'+dp.test.p_fmt+'</span></td><td>'+(dSig?'Significant difference':'No significant difference')+'</td></tr>';
          });
          html+='</tbody></table></div>';
        }
        html+='</div>';
      }
      html+='<div style="margin-top:12px"><div class="sec-hd" style="margin-bottom:6px">AUC Interpretation Guide</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>AUC Range</th><th>Discriminative Ability</th></tr></thead><tbody>';
      [['0.90 – 1.00','Excellent'],['0.80 – 0.89','Good'],['0.70 – 0.79','Acceptable'],['0.60 – 0.69','Poor'],['0.50 – 0.59','Fail (no better than chance)']].forEach(function(row){
        html+='<tr><td class="td-label" style="font-family:var(--font-mono-stack);font-variant-numeric:tabular-nums">'+row[0]+'</td><td class="td-label" style="color:var(--ink-muted)">'+row[1]+'</td></tr>';
      });
      html+='</tbody></table></div></div>';
  return html;
}
