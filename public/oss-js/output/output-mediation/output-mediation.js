// RENDER OUTPUT MEDIATION
function renderOutAdv_mediation(o){
  var html='';
      var r=o.res;
      var medMeta={
        'Full Mediation':{cls:'notice-ok',col:'var(--ok)'},
        'Partial Mediation':{cls:'notice-warn',col:'var(--warn)'},
        'No Mediation':{cls:'notice-err',col:'var(--err)'},
        'Inconsistent/Suppression':{cls:'notice-warn',col:'var(--gold-text)'}
      }[r.medType]||{cls:'',col:'var(--ink)'};
      // Conclusion badge
      html+='<div class="notice-box '+medMeta.cls+'" style="margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">';
      html+='<span style="font-size:13.5px;font-weight:800;color:'+medMeta.col+'">'+r.medType+'</span>';
      html+='<span style="font-size:11.5px;color:var(--ink-muted)">n='+r.n+' | X: '+escHtml(r.xName)+' → ['+r.mNames.map(function(m){return escHtml(m);}).join(', ')+'] → Y: '+escHtml(r.yName)+'</span>';
      html+='</div>';

      // Path diagram
      html+='<div style="text-align:center;margin-bottom:12px">'+svgMediationPath(r.xName,r.mNames,r.yName,r)+'</div>';

      // Baron-Kenny table
      var bk=r.barronKenny;
      html+='<div class="sec-hd" style="margin-bottom:6px">Baron-Kenny Causal Steps</div>';
      html+=mkTable(
        ['Step','Path','Coef','p','Sig'],
        [
          ['Step 1','X → Y (total c)', bk.c, SE.pFmt?SE.pFmt(parseFloat(bk.p_c)):parseFloat(bk.p_c).toFixed(3), parseFloat(bk.p_c)<0.05?'*':''],
          ['Step 2','X → M (path a)', bk.a, SE.pFmt?SE.pFmt(parseFloat(bk.p_a)):parseFloat(bk.p_a).toFixed(3), parseFloat(bk.p_a)<0.05?'*':''],
          ['Step 3','M → Y (path b)', bk.b, SE.pFmt?SE.pFmt(parseFloat(bk.p_b)):parseFloat(bk.p_b).toFixed(3), parseFloat(bk.p_b)<0.05?'*':''],
          ["Step 4","X → Y (direct c')", bk.c_prime, SE.pFmt?SE.pFmt(parseFloat(bk.p_c_prime)):parseFloat(bk.p_c_prime).toFixed(3), parseFloat(bk.p_c_prime)<0.05?'*':'n.s.'],
        ]
      );

      // Sobel + Bootstrap per mediator
      html+='<div class="sec-hd" style="margin-top:12px;margin-bottom:6px">Indirect Effect(s)</div>';
      var bootRows=r.mediators.map(function(med,i){
        var boot=r.bootResults&&r.bootResults[i];
        var ci=boot?('['+boot.lo+', '+boot.hi+']'):'—';
        var ciSig=boot?boot.sig:null;
        return [
          escHtml(med.name),
          SE.f4(med.indirect),
          SE.f4(med.sobel_z),
          parseFloat(med.sobel_p).toFixed(3),
          parseFloat(med.sobel_p)<0.05?'*':'',
          ci,
          ciSig===null?'—':(ciSig?'<span style="color:var(--ok);font-weight:600">Sig (CI ≠ 0)</span>':'<span style="color:var(--err)">n.s. (CI ∋ 0)</span>'),
        ];
      });
      var bootHdr=['Mediator','Indirect (a×b)','Sobel z','p (Sobel)','Sig','Boot 95% CI','Boot Sig'];
      html+='<div class="tbl-wrap"><table><thead><tr>'+bootHdr.map(function(h,hi){return '<th'+((hi>=1&&hi<=3)||hi===5?' style="text-align:right"':'')+'>'+h+'</th>';}).join('')+'</tr></thead><tbody>';
      bootRows.forEach(function(row){
        html+='<tr>'+row.map(function(c,ci){
          return '<td class="'+(ci===0||ci===6?'td-label':'td-num')+'">'+c+'</td>';
        }).join('')+'</tr>';
      });
      html+='</tbody></table></div>';

      html+='<div style="margin-top:10px;font-size:11.5px;color:var(--ink-muted)">* p &lt; .05 | Total indirect effect: '+r.totalIndirect+' | Model R² (M+X→Y): '+r.r2_total+'</div>';
  return html;
}
