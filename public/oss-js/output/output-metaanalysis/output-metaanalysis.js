// RENDER OUTPUT META-ANALYSIS
function renderOutAdv_metaanalysis(o){
  var html='';
      var r=o.res;
      var psig=r.p<0.05;
      html+='<div class="notice-box" style="margin-bottom:12px">';
      html+='<div style="font-size:15.5px;font-weight:800;color:var(--ink);font-family:var(--font-serif-stack)">Meta-Analysis — '+(r.model==='fixed'?'Fixed-Effect':'Random-Effects')+' (k = '+r.k+' studies)</div>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-top:3px">Pooled '+r.effectLabel+' = '+r.pooledEffect+' &nbsp;[95% CI: '+r.ci_lo+', '+r.ci_hi+'] &nbsp;|&nbsp; z = '+r.z+', p = '+r.p_fmt+'</div>';
      html+='</div>';

      html+='<div class="stats-grid2" style="margin-bottom:12px">';
      html+=stCard('Pooled Effect ('+r.effectLabel+')',r.pooledEffect,'SE = '+r.se);
      html+=stCard('95% CI','['+r.ci_lo+', '+r.ci_hi+']','');
      html+=stCard('z',r.z,'p = '+r.p_fmt);
      html+=stCard('Sig?',psig?'Yes ✓':'No ✗','α = 0.05');
      html+=stCard('Q statistic',r.Q,'p = '+r.Q_p_fmt);
      html+=stCard('I² (%)',r.I2+'%',r.I2label);
      html+=stCard('τ²',r.tau2,'Between-study variance');
      html+=stCard('τ',r.tau,'SD between studies');
      html+='</div>';

      // Heterogeneity interpretation
      var hColor=r.I2raw<25?'var(--ok)':r.I2raw<75?'var(--warn)':'var(--err)';
      html+='<div class="notice-box" style="margin-bottom:12px;font-size:11.5px;color:var(--ink-muted);line-height:1.65">';
      html+='<b style="color:var(--ink)">Heterogenitas: </b><b style="color:'+hColor+'">'+r.I2label+'</b> | ';
      html+='Q('+(r.k-1)+') = '+r.Q+', p = '+r.Q_p_fmt+'. ';
      html+=r.I2raw<25?'Studi cukup homogen.':r.I2raw<50?'Ada variasi sedang antar studi.':r.I2raw<75?'Heterogenitas substansial.':'Heterogenitas tinggi — hati-hati interpretasi.';
      html+='</div>';

      // Study-level table
      html+='<div class="sec-hd" style="margin-bottom:6px">Hasil Per Studi</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Studi</th><th style="text-align:right">yi</th><th style="text-align:right">vi</th><th style="text-align:right">SE</th><th style="text-align:right">95% CI</th><th style="text-align:right">Bobot (%)</th></tr></thead><tbody>';
      (r.studyData||[]).forEach(function(s){
        html+='<tr><td class="td-label">'+escHtml(s.name)+'</td>';
        html+='<td class="td-num">'+s.yi.toFixed(3)+'</td>';
        html+='<td class="td-num">'+s.vi.toFixed(4)+'</td>';
        html+='<td class="td-num">'+Math.sqrt(s.vi).toFixed(4)+'</td>';
        html+='<td class="td-num">['+s.ci_lo+', '+s.ci_hi+']</td>';
        html+='<td class="td-num">'+s.weight.toFixed(1)+'%</td>';
        html+='</tr>';
      });
      html+='</tbody></table></div>';

      // Forest plot
      html+='<div class="sec-hd" style="margin-top:14px;margin-bottom:6px">Forest Plot</div>';
      html+=svgMetaForestPlot(o.studies||[],r,o.effectType||'yi');

      // Funnel plot
      html+='<div class="sec-hd" style="margin-top:14px;margin-bottom:6px">Funnel Plot <span style="font-size:10.5px;font-weight:400;color:var(--ink-subtle)">(publication bias check)</span></div>';
      html+=svgFunnelPlot(r);
      html+='<div style="font-size:11px;color:var(--ink-subtle);margin-top:6px">Funnel plot simetris → tidak ada publication bias. Asimetri → kemungkinan ada bias publikasi.</div>';
  return html;
}
