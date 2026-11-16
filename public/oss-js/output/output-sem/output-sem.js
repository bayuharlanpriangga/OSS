// RENDER OUTPUT SEM
function renderOutAdv_sem(o){
  var html='';
      var r=o.res;
      var T=typeof ossChartTheme==='function'?ossChartTheme():{series:['#4F7A99','#D4A72C','#2F7048','#A8530E','#A93226']};
      var fitColSEM=r.overallFit==='Good Fit'?'var(--ok)':r.overallFit==='Acceptable Fit'?'var(--warn)':'var(--err)';
      var fitClsSEM=r.overallFit==='Good Fit'?'notice-ok':r.overallFit==='Acceptable Fit'?'notice-warn':'notice-err';
      // Header
      html+='<div class="notice-box '+fitClsSEM+'" style="margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">';
      html+='<div><div style="font-size:15px;font-weight:800;color:'+fitColSEM+';font-family:var(--font-serif-stack)">'+r.overallFit+'</div>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-top:2px">N='+r.n+', '+r.totalIndicators+' indikators, '+r.nLatent+' konstruk laten</div></div>';
      html+='<div style="text-align:right;font-family:var(--font-mono-stack);font-variant-numeric:tabular-nums"><div style="font-size:11px;color:var(--ink-muted)">χ²('+r.dfModel+')='+r.chiSq+', p='+r.pChiSq+'</div>';
      html+='<div style="font-size:11px;color:var(--ink-muted)">χ²/df='+r.chiRatio+' | RMSEA CI: ['+r.RMSEA_lo+', '+r.RMSEA_hi+']</div></div>';
      html+='</div>';
      // Fit index cards
      var cficol3=r.CFI_raw>=0.95?'var(--ok)':r.CFI_raw>=0.90?'var(--warn)':'var(--err)';
      var tlicol3=r.TLI_raw>=0.95?'var(--ok)':r.TLI_raw>=0.90?'var(--warn)':'var(--err)';
      var rmsecol3=r.RMSEA_raw<=0.05?'var(--ok)':r.RMSEA_raw<=0.08?'var(--warn)':'var(--err)';
      var srmrcol3=r.SRMR_raw<=0.05?'var(--ok)':r.SRMR_raw<=0.08?'var(--warn)':'var(--err)';
      html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(105px,1fr));gap:8px;margin-bottom:12px">';
      html+=stCard('CFI','<span style="color:'+cficol3+'">'+r.CFI+'</span>','≥.95 good');
      html+=stCard('TLI','<span style="color:'+tlicol3+'">'+r.TLI+'</span>','≥.95 good');
      html+=stCard('RMSEA','<span style="color:'+rmsecol3+'">'+r.RMSEA+'</span>','≤.06 good');
      html+=stCard('SRMR','<span style="color:'+srmrcol3+'">'+r.SRMR+'</span>','≤.08 good');
      html+=stCard('χ²/df','<span style="color:'+(r.chiRatio<=2?'var(--ok)':r.chiRatio<=3?'var(--warn)':'var(--err)')+'">'+r.chiRatio+'</span>','≤2.0 good');
      html+=stCard('N',r.n,'Sample size');
      html+='</div>';
      // Construct validity
      if(r.constructs&&r.constructs.length){
        html+='<div class="sec-hd" style="margin-bottom:8px">Construct Validity (AVE & CR)</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th>Konstruk</th><th style="text-align:right">N Indics</th><th style="text-align:right">AVE</th><th style="text-align:right">CR</th><th style="text-align:right">Cronbach α</th><th>Validity</th></tr></thead><tbody>';
        r.constructs.forEach(function(c,ci){
          var col=T.series[ci%T.series.length];
          var avecol=parseFloat(c.AVE)>=0.5?'var(--ok)':parseFloat(c.AVE)>=0.4?'var(--warn)':'var(--err)';
          var crcol=parseFloat(c.CR)>=0.7?'var(--ok)':parseFloat(c.CR)>=0.6?'var(--warn)':'var(--err)';
          var alphacol=parseFloat(c.alpha)>=0.7?'var(--ok)':parseFloat(c.alpha)>=0.6?'var(--warn)':'var(--err)';
          var valid=parseFloat(c.AVE)>=0.5&&parseFloat(c.CR)>=0.7;
          html+='<tr>';
          html+='<td class="td-label" style="color:'+col+';font-weight:700">'+escHtml(c.name)+'</td>';
          html+='<td class="td-num">'+c.nIndics+'</td>';
          html+='<td class="td-num" style="color:'+avecol+'">'+c.AVE+'</td>';
          html+='<td class="td-num" style="color:'+crcol+'">'+c.CR+'</td>';
          html+='<td class="td-num" style="color:'+alphacol+'">'+c.alpha+'</td>';
          html+='<td><span class="tag '+(valid?'tag-green':'tag-yellow')+'" style="font-size:9px">'+(valid?'✓ Valid':'⚠ Check')+'</span></td>';
          html+='</tr>';
        });
        html+='</tbody></table></div>';
        html+='<div style="font-size:10.5px;color:var(--ink-subtle);margin-top:4px;margin-bottom:12px">AVE ≥ 0.50 = convergent validity | CR ≥ 0.70 = construct reliability | AVE &gt; r² between constructs = discriminant validity</div>';
      }
      // Factor loadings
      if(r.loadings&&r.loadings.length){
        html+='<div class="sec-hd" style="margin-bottom:8px">Standardized Factor Loadings (Measurement Model)</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th>Konstruk</th><th>Indikator</th><th style="text-align:right">λ</th><th style="text-align:right">h²</th><th style="text-align:right">t-val*</th><th>Status</th></tr></thead><tbody>';
        r.loadings.forEach(function(row){
          var lamNum=parseFloat(row.lambda);
          var lamCol=lamNum>=0.7?'var(--ok)':lamNum>=0.5?'var(--line)':lamNum>=0.3?'var(--warn)':'var(--err)';
          var lIdx=o.latents?o.latents.indexOf(row.construct):0;
          var col=T.series[lIdx>=0?lIdx%T.series.length:0];
          html+='<tr>';
          if(row.firstInConstruct) html+='<td class="td-label" rowspan="'+row.constructCount+'" style="color:'+col+';font-weight:700;vertical-align:top;padding-top:10px">'+escHtml(row.construct)+'</td>';
          html+='<td class="td-label">'+escHtml(row.indicator)+'</td>';
          html+='<td class="td-num" style="color:'+lamCol+';font-weight:'+(lamNum>=0.5?700:400)+'">'+row.lambda+'</td>';
          html+='<td class="td-num" style="color:'+(parseFloat(row.h2)>=0.4?'var(--line)':'var(--err)')+'">'+row.h2+'</td>';
          html+='<td class="td-num" style="color:var(--ink-muted)">'+row.tvalue+'</td>';
          html+='<td><span class="tag '+(lamNum>=0.5?'tag-green':'tag-red')+'" style="font-size:9px">'+(lamNum>=0.5?'✓ Adequate':'✗ Weak')+'</span></td>';
          html+='</tr>';
        });
        html+='</tbody></table></div>';
        html+='<div style="font-size:10.5px;color:var(--ink-subtle);margin-top:4px;margin-bottom:12px">*Estimasi t-val; t &gt; 1.96 = p &lt; .05 | λ ≥ 0.70 strong, ≥ 0.50 adequate</div>';
      }
      // Structural paths
      if(r.paths&&r.paths.length){
        html+='<div class="sec-hd" style="margin-bottom:8px">Structural Path Coefficients</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th>Dari</th><th>→ Ke</th><th style="text-align:right">β (Std)</th><th style="text-align:right">SE</th><th style="text-align:right">t</th><th style="text-align:right">p</th><th>Sig</th><th>Interpretasi</th></tr></thead><tbody>';
        r.paths.forEach(function(p){
          var betaNum=parseFloat(p.beta);
          var bcol=Math.abs(betaNum)>=0.3?'var(--ok)':Math.abs(betaNum)>=0.1?'var(--warn)':'var(--err)';
          var psig=parseFloat(p.p)<0.05;
          var fromIdx=o.latents?o.latents.indexOf(p.from):0;
          var toIdx=o.latents?o.latents.indexOf(p.to):1;
          html+='<tr>';
          html+='<td class="td-label" style="color:'+T.series[fromIdx>=0?fromIdx%T.series.length:0]+';font-weight:700">'+escHtml(p.from)+'</td>';
          html+='<td class="td-label" style="color:'+T.series[toIdx>=0?toIdx%T.series.length:1]+';font-weight:700">'+escHtml(p.to)+'</td>';
          html+='<td class="td-num" style="color:'+bcol+';font-weight:700">'+p.beta+'</td>';
          html+='<td class="td-num" style="color:var(--ink-muted)">'+p.se+'</td>';
          html+='<td class="td-num">'+p.t+'</td>';
          html+='<td class="td-num" style="color:'+(psig?'var(--ok)':'var(--err)')+'">'+(psig?'<b>':'')+p.p_fmt+(psig?'</b>':'')+'</td>';
          html+='<td>'+sigBadge(p.p)+'</td>';
          html+='<td style="font-size:11.5px;color:var(--ink-muted)">'+escHtml(p.interpretation)+'</td>';
          html+='</tr>';
        });
        html+='</tbody></table></div>';
        html+='<div style="font-size:10.5px;color:var(--ink-subtle);margin-top:4px;margin-bottom:12px">β = standardized path coefficient | |β| ≥ .30 = medium effect | |β| ≥ .50 = large effect</div>';
      }
      // Indirect effects
      if(r.indirectEffects&&r.indirectEffects.length){
        html+='<div class="sec-hd" style="margin-bottom:8px">Indirect Effects (Mediasi via Konstruk Laten)</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th>X</th><th>M (Mediator)</th><th>Y</th><th style="text-align:right">Indirect β</th><th style="text-align:right">95% CI</th><th>Sig</th></tr></thead><tbody>';
        r.indirectEffects.forEach(function(ie){
          var ciSig=parseFloat(ie.ci_lo)>0||parseFloat(ie.ci_hi)<0;
          html+='<tr>';
          html+='<td class="td-label" style="color:'+T.series[0]+';font-weight:700">'+escHtml(ie.x)+'</td>';
          html+='<td class="td-label" style="color:'+T.series[2]+'">'+escHtml(ie.m)+'</td>';
          html+='<td class="td-label" style="color:'+T.series[1]+';font-weight:700">'+escHtml(ie.y)+'</td>';
          html+='<td class="td-num" style="color:'+(Math.abs(parseFloat(ie.indirect))>=0.1?'var(--ok)':'var(--warn)')+'">'+ie.indirect+'</td>';
          html+='<td class="td-num" style="font-size:11px;color:'+(ciSig?'var(--ok)':'var(--err)')+'">['+ie.ci_lo+', '+ie.ci_hi+']</td>';
          html+='<td><span class="tag '+(ciSig?'tag-green':'tag-red')+'" style="font-size:9px">'+(ciSig?'✓ Signifikan':'n.s.')+'</span></td>';
          html+='</tr>';
        });
        html+='</tbody></table></div>';
        html+='<div style="font-size:10.5px;color:var(--ink-subtle);margin-top:4px;margin-bottom:12px">CI tidak mencakup 0 → indirect effect signifikan (mediasi terbukti)</div>';
      }
      // lavaan syntax
      if(o.latents&&o.latentMap&&o.paths!==undefined){
        html+='<div class="sec-hd" style="margin-bottom:6px">lavaan / AMOS Syntax</div>';
        html+='<textarea class="syn-area" readonly style="min-height:120px;font-size:11px">'+escHtml(generateLavaanSyntax(o.latents,o.latentMap,o.paths))+'</textarea>';
      }
      // Interpretation
      html+='<div class="assump" style="margin-top:10px"><b style="color:var(--ink)">Interpretasi SEM:</b> '+r.overallFit+'. '
        +(r.CFI_raw>=0.95&&r.RMSEA_raw<=0.06?'Model fit sangat baik (Good Fit). Konstruk laten valid dan reliable. ':'')
        +(r.CFI_raw<0.90||r.RMSEA_raw>0.08?'Model perlu modifikasi. Cek MI (Modification Indices) dan pertimbangkan re-specification. ':'')
        +'Reference: Hu & Bentler (1999); Hair et al. (2010) untuk SEM cut-off criteria.</div>';
  return html;
}
