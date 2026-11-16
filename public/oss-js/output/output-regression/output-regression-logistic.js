// o.type==='logistic'
function renderOutBasic_logistic(o){
  var html='';
      var r=o.res,lgType=o.lgType||'binary';
      html+='<div class="stats-grid" style="margin-bottom:10px">';
      html+=stCard('N',r.n,'valid cases');
      html+=stCard('−2LL',r.m2ll,'Log-likelihood');
      html+=stCard("Cox & Snell R²",r.coxSnell,'Pseudo-R²');
      html+=stCard("Nagelkerke R²",r.nagelkerke,'Pseudo-R²');
      html+='</div>';
      html+='<div class="row" style="margin-bottom:10px">';
      html+='<span class="tag '+(r.chiSqP_fmt!=='n.s.'&&r.chiSqP_fmt!==''?'tag-green':'tag-yellow')+'">χ²('+r.chiSqDf+')='+r.chiSq+', p='+r.chiSqP_fmt+'</span>';
      if(lgType==='binary') html+='<span class="tag tag-blue">Accuracy: '+r.accuracy+'%</span>';
      if(lgType==='binary') html+='<span class="tag '+(parseFloat(r.auc)>=0.8?'tag-green':parseFloat(r.auc)>=0.7?'tag-blue':'tag-yellow')+'">AUC='+r.auc+'</span>';
      html+='</div>';
      if(lgType==='binary'){
        html+=mkTable(['Variable','B','SE','Wald','p','OR','95% CI OR'],
          r.coefs.map(function(c){
            var sig=c.p_fmt!=='—'&&(c.p_fmt==='<.001'||parseFloat(c.p_fmt)<0.05);
            return[escHtml(c.name),c.B,c.SE,c.wald,(sig?'<b style="color:var(--ok)">':'')+c.p_fmt+(sig?'</b>':''),c.OR,c.ci_or];
          })
        );
        // Confusion matrix
        html+='<div class="sec-hd" style="margin-top:14px;margin-bottom:6px">Confusion Matrix</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th>Actual \\ Predicted</th><th style="text-align:right">Pred. "'+escHtml(r.cats[0])+'"</th><th style="text-align:right">Pred. "'+escHtml(r.cats[1])+'"</th><th style="text-align:right">% Correct</th></tr></thead><tbody>';
        html+='<tr><td class="td-label">Act. "'+escHtml(r.cats[0])+'"</td><td class="td-num">'+r.cm[0][0]+'</td><td class="td-num">'+r.cm[0][1]+'</td><td class="td-num">'+SE.f1(r.cm[0][0]/(r.cm[0][0]+r.cm[0][1]+0.001)*100)+'%</td></tr>';
        html+='<tr><td class="td-label">Act. "'+escHtml(r.cats[1])+'"</td><td class="td-num">'+r.cm[1][0]+'</td><td class="td-num">'+r.cm[1][1]+'</td><td class="td-num">'+SE.f1(r.cm[1][1]/(r.cm[1][0]+r.cm[1][1]+0.001)*100)+'%</td></tr>';
        html+='<tr><td class="td-label" style="color:var(--ink);font-weight:700">Total</td><td class="td-num"></td><td class="td-num"></td><td class="td-num" style="color:var(--ok);font-weight:700">'+r.accuracy+'%</td></tr>';
        html+='</tbody></table></div>';
      } else {
        r.categories.forEach(function(cat,ci){
          if(ci===0) return;
          html+='<div style="margin-top:12px;margin-bottom:6px;font-size:11.5px;color:var(--gold-text);font-weight:700">Category "'+escHtml(cat)+'" vs. Reference "'+escHtml(r.categories[0])+'"</div>';
          html+=mkTable(['Variable','B','SE','Wald','p','OR','95% CI OR'],
            r.coefs[ci-1].map(function(c){
              var sig=c.p_fmt!=='—'&&(c.p_fmt==='<.001'||parseFloat(c.p_fmt)<0.05);
              return[escHtml(c.name),c.B,c.SE,c.wald,(sig?'<b style="color:var(--ok)">':'')+c.p_fmt+(sig?'</b>':''),c.OR,c.ci_or];
            })
          );
        });
        html+='<div style="margin-top:8px;font-size:12px">Overall Accuracy: <b style="color:var(--ok)">'+r.accuracy+'%</b></div>';
      }
      html+='<div class="assump" style="margin-top:11px"><b style="color:var(--ink)">Interpretasi:</b><br><b>OR &gt; 1</b>: peningkatan odds; <b>OR &lt; 1</b>: penurunan odds; <b>Wald p &lt; .05</b>: prediktor signifikan.<br><b>Nagelkerke R²</b>: varian DV yang dijelaskan model; <b>AUC &gt; .8</b>: diskriminasi baik.</div>';
  return html;
}
