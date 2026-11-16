// RENDER OUTPUT TIME SERIES
function renderOutAdv_timeseries(o){
  var html='';
      var r=o.res;
      html+='<div class="notice-box" style="margin-bottom:12px">';
      html+='<div style="font-size:16px;font-weight:800;color:var(--ink);font-family:var(--font-serif-stack)">'+r.model+'</div>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-top:3px">Variable: '+escHtml(r.variable)+' | N = '+r.n+'</div>';
      html+='</div>';
      if(r.arCoefs){
        // ARIMA output
        html+='<div class="stats-grid2" style="margin-bottom:12px">';
        html+=stCard('AIC',r.aic,'');
        html+=stCard('BIC',r.bic,'');
        html+=stCard('σ̂ (residual SD)',r.sigma,'');
        html+=stCard('1-step Forecast',r.forecast,'');
        html+=stCard('95% CI Low',r.fc_lo95,'');
        html+=stCard('95% CI High',r.fc_hi95,'');
        html+='</div>';
        if(r.arCoefs.length){
          html+='<div class="tbl-wrap"><table><thead><tr><th>Parameter</th><th style="text-align:right">Estimate</th></tr></thead><tbody>';
          html+='<tr><td class="td-label">Intercept (μ)</td><td class="td-num">'+SE.f4(r.mu||0)+'</td></tr>';
          r.arCoefs.forEach(function(c,i){html+='<tr><td class="td-label">AR('+(i+1)+')</td><td class="td-num">'+c+'</td></tr>';});
          r.maCoefs.forEach(function(c,i){html+='<tr><td class="td-label">MA('+(i+1)+')</td><td class="td-num">'+c+'</td></tr>';});
          html+='</tbody></table></div>';
        }
        html+='<div class="notice-box" style="margin-top:10px;font-size:11.5px;color:var(--ink-muted);line-height:1.65">';
        html+='<b style="color:var(--ink)">Forecast (1-step):</b> '+r.forecast+' &nbsp;[95% CI: '+r.fc_lo95+' – '+r.fc_hi95+']<br>';
        html+='<b style="color:var(--ink)">Residual Mean:</b> '+r.residMean+' &nbsp;|&nbsp; <b style="color:var(--ink)">Residual SD:</b> '+r.residSD;
        html+='</div>';
      } else {
        // Decomposition output
        html+='<div class="stats-grid2" style="margin-bottom:12px">';
        html+=stCard('Period',r.period,'seasonal');
        html+=stCard('Model Type',r.type,'');
        html+=stCard('Seasonal Strength',r.seasonalStrength,'0–1 scale');
        html+=stCard('Seasonal Amplitude',r.seasonalAmplitude,'');
        html+=stCard('Remainder SD',r.remainderSD,'');
        html+=stCard('Trend Range','['+r.trendRange[0]+', '+r.trendRange[1]+']','');
        html+='</div>';
        if(r.seasonalIndices&&r.seasonalIndices.length){
          html+='<div style="margin-top:10px"><div class="sec-hd" style="margin-bottom:6px">Seasonal Indices</div>';
          html+='<div class="tbl-wrap"><table><thead><tr>';
          r.seasonalIndices.forEach(function(s){html+='<th style="text-align:right">P'+s.period+'</th>';});
          html+='</tr></thead><tbody><tr>';
          r.seasonalIndices.forEach(function(s){
            var v=parseFloat(s.index),col=v>0?'var(--ok)':v<0?'var(--err)':'var(--ink-muted)';
            html+='<td class="td-num" style="color:'+col+';font-weight:600">'+s.index+'</td>';
          });
          html+='</tr></tbody></table></div></div>';
        }
      }
  return html;
}
