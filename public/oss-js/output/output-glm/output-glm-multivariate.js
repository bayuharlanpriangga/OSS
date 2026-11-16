// o.type==='manova'
function renderOutBasic_manova(o){
  var html='';
      var r = o.res;
      if(!r){ html+='<div class="notice-box notice-err">No MANOVA result.</div>'; }
      else {
        // Header summary
        html+='<div class="notice-box" style="margin-bottom:11px;font-size:12px;color:var(--ink-muted)">';
        html+='<b style="color:var(--ink)">MANOVA</b> — ';
        html+='DVs: <b style="color:var(--ink)">'+r.depVars.map(function(d){return escHtml(d);}).join(', ')+'</b> &nbsp;|&nbsp; ';
        html+='Factor: <b style="color:var(--line)">'+escHtml(r.factor)+'</b> &nbsp;|&nbsp; ';
        html+='N='+r.n+', Groups='+r.g+', DVs='+r.p;
        html+='</div>';

        // Multivariate Tests table (Pillai, Wilks, Hotelling, Roy)
        html+='<div class="sec-hd" style="margin-bottom:7px">Multivariate Tests <span style="font-weight:400;font-size:10.5px;color:var(--ink-subtle)">(Effect: '+escHtml(r.factor)+')</span></div>';
        var mvRows = [
          ['Pillai\'s Trace',      r.pillai.stat,    r.pillai.F,    r.pillai.df1,    r.pillai.df2,    r.pillai.p_fmt,    r.pillai.sig],
          ['Wilks\' Lambda',       r.wilks.stat,     r.wilks.F,     r.wilks.df1,     r.wilks.df2,     r.wilks.p_fmt,     r.wilks.sig],
          ['Hotelling-Lawley',     r.hotelling.stat, r.hotelling.F, r.hotelling.df1, r.hotelling.df2, r.hotelling.p_fmt, r.hotelling.sig],
          ['Roy\'s Greatest Root', r.roy.stat,       r.roy.F,       r.roy.df1,       r.roy.df2,       r.roy.p_fmt,       r.roy.sig],
        ];
        html+='<div class="tbl-wrap" style="margin-bottom:11px"><table><thead><tr>';
        ['Test','Value','F','df1','df2','p',''].forEach(function(h2,hi){ html+='<th'+((hi>=1&&hi<=5)?' style="text-align:right"':'')+'>'+h2+'</th>'; });
        html+='</tr></thead><tbody>';
        mvRows.forEach(function(row){
          var sig = row[6];
          html+='<tr>';
          html+='<td class="td-label" style="font-weight:600">'+row[0]+'</td>';
          html+='<td class="td-num">'+row[1]+'</td>';
          html+='<td class="td-num">'+row[2]+'</td>';
          html+='<td class="td-num">'+row[3]+'</td>';
          html+='<td class="td-num">'+row[4]+'</td>';
          html+='<td class="td-num">'+(sig?'<b style="color:var(--ok)">':'')+row[5]+(sig?'</b>':'')+'</td>';
          html+='<td>'+(sig?'<span class="tag tag-green" style="font-size:9px">✓ Sig</span>':'<span style="font-size:10px;color:var(--ink-subtle)">ns</span>')+'</td>';
          html+='</tr>';
        });
        html+='</tbody></table></div>';

        // Effect size + eigenvalues
        html+='<div class="stats-grid" style="margin-bottom:11px">';
        html+=stCard('Partial η² (Pillai)', r.pillaiEta2, parseFloat(r.pillaiEta2)>=0.14?'Large':parseFloat(r.pillaiEta2)>=0.06?'Medium':'Small');
        html+=stCard('Eigenvalue λ₁', r.eigenvalues[0]||'—');
        html+=stCard('s (dimensions)', r.s);
        html+=stCard('Box\'s M p', r.boxP, r.boxSig?'⚠ Violation':'✓ OK');
        html+='</div>';

        // Box's M note
        if(r.boxSig){
          html+='<div class="notice-box notice-warn" style="margin-bottom:10px;font-size:11.5px">';
          html+='<b>⚠ Box\'s M significant (p='+r.boxP+')</b> — covariance matrices differ across groups. ';
          html+='Pillai\'s Trace is the most robust test to use when this assumption is violated.';
          html+='</div>';
        } else {
          html+='<div class="notice-box notice-ok" style="margin-bottom:10px;font-size:11.5px"><b>✓ Box\'s M</b> not significant (p='+r.boxP+') — homogeneity of covariance matrices assumption met.</div>';
        }

        // Group Means matrix
        html+='<div class="sec-hd" style="margin-bottom:7px">Group Means</div>';
        html+='<div class="tbl-wrap" style="margin-bottom:11px"><table><thead><tr><th>'+escHtml(r.factor)+'</th><th style="text-align:right">N</th>';
        r.depVars.forEach(function(dv){ html+='<th style="text-align:right">'+escHtml(dv)+'</th>'; });
        html+='</tr></thead><tbody>';
        r.groupMeans.forEach(function(gm){
          html+='<tr><td class="td-label">'+escHtml(gm.key)+'</td><td class="td-num">'+gm.n+'</td>';
          gm.means.forEach(function(m){ html+='<td class="td-num">'+m+'</td>'; });
          html+='</tr>';
        });
        // Grand means row
        html+='<tr style="border-top:1px solid var(--line-soft);color:var(--ink-muted)"><td class="td-label"><i>Grand Mean</i></td><td></td>';
        r.grandMeans.forEach(function(m){ html+='<td class="td-num"><i>'+m+'</i></td>'; });
        html+='</tr>';
        html+='</tbody></table></div>';

        // Univariate follow-up ANOVAs
        html+='<div class="sec-hd" style="margin-bottom:7px">Univariate Follow-up ANOVAs <span style="font-weight:400;font-size:10.5px;color:var(--ink-subtle)">(interpret with Bonferroni correction p &lt; '+SE.f4(0.05/r.p)+')</span></div>';
        if(r.univariate && r.univariate.length){
          r.univariate.forEach(function(item){
            var dv=item.dv, ures=item.res;
            html+='<div class="notice-box" style="margin-bottom:10px">';
            html+='<div style="font-size:11.5px;font-weight:700;color:var(--ink);margin-bottom:6px">ANOVA: '+escHtml(dv)+'</div>';
            if(ures&&!ures._err&&ures.effects){
              var tRows2 = ures.effects.map(function(e){
                var ps = e.sig?'<b style="color:var(--ok)">'+e.p_fmt+'</b>':(e.p_fmt||'—');
                return [escHtml(e.source), e.df, e.SS||'—', e.MS||'—', e.F||'—', ps, e.eta2||'—'];
              });
              tRows2.push(['Error', ures.dfError, ures.ssError, ures.msError, '', '', '']);
              html+=mkTable(['SOURCE','DF','SS','MS','F','p','η²'], tRows2);
              // Group means for this DV
              var eff = ures.effects&&ures.effects[0];
              if(eff&&eff.groups){
                html+='<div style="margin-top:8px">';
                html+=mkTable([r.factor,'N','Mean','SD'],
                  (ures.factorLevels&&ures.factorLevels[r.factor]||[]).map(function(gk){
                    var gv=eff.groups[gk];
                    if(!gv||!gv.length) return[escHtml(gk),'—','—','—'];
                    return[escHtml(gk), gv.length, SE.f4(SE.mean(gv)), gv.length>=2?SE.f4(SE.std(gv)):'N/A'];
                  })
                );
                html+='</div>';
              }
            } else {
              html+='<div style="color:var(--err);font-size:11.5px">'+(ures&&ures._err?ures._err:'Failed')+'</div>';
            }
            html+='</div>';
          });
        }

        // Interpretation note
        html+='<div class="assump" style="margin-top:4px;font-size:11.5px">';
        html+='<b style="color:var(--ink)">Recommendation:</b> ';
        html+='Use <b>Pillai\'s Trace</b> as the primary test statistic — it is the most robust, especially when n is small or covariance matrices are unequal. ';
        html+='Wilks\' Lambda is most powerful when assumptions are met. Roy\'s Greatest Root is an upper bound (liberal). ';
        html+='Follow significant multivariate tests with univariate ANOVAs above, applying Bonferroni correction (α/'+r.p+').';
        html+='</div>';
      }
  return html;
}
