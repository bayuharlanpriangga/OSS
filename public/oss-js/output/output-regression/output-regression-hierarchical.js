// o.type==='hierarchicalReg'&&o.res
function renderOutBasic_hierarchicalReg(o){
  var html='';
      var hrRes=o.res;
      var T=typeof ossChartTheme==='function'?ossChartTheme():{series:['#4F7A99','#D4A72C','#2F7048','#A8530E','#A93226']};
      html+='<p style="font-size:12px;color:var(--ink-muted);margin-bottom:12px"><b style="color:var(--ink)">Dependent Variable:</b> '+escHtml(hrRes.depVar)+'</p>';
      // Model Summary Table
      html+='<div class="sec-hd" style="margin-bottom:8px">Model Summary & ΔR²</div>';
      html+='<div class="tbl-wrap">';
      html+=mkTable(
        ['Block','Predictors','R²','Adj R²','ΔR²','F-change','df1','df2','p (ΔR²)'],
        (hrRes.blocks||[]).map(function(b){
          var bCol=T.series[(b.block-1)%T.series.length];
          var pSig=parseFloat(b.pFchange)<0.05;
          return[
            '<b style="color:'+bCol+'">Block '+b.block+'</b>',
            '<span style="color:var(--ink-muted);font-size:11px">'+b.predictors.map(escHtml).join(', ')+'</span>',
            '<b>'+b.R2+'</b>',
            b.R2adj,
            '<b style="color:var(--gold-text)">'+b.dR2+'</b>',
            b.Fchange,
            b.dfNum,
            b.dfDen,
            (pSig?'<b style="color:var(--ok)">':'<span style="color:var(--ink-muted)">')+b.pFchange+(pSig?'</b>':'</span>')
          ];
        })
      );
      html+='</div>';
      // ΔR² visual bar
      html+='<div style="margin:12px 0">';
      var maxR2=hrRes.blocks.length?parseFloat(hrRes.blocks[hrRes.blocks.length-1].R2):0;
      html+='<div style="font-size:11px;color:var(--ink-muted);margin-bottom:6px">R² Accumulation per Block</div>';
      var prevAccum=0;
      (hrRes.blocks||[]).forEach(function(b,bi){
        var dR2Num=parseFloat(b.dR2);
        var pct=maxR2>0?(dR2Num/maxR2)*100:0;
        var bCol=T.series[bi%T.series.length];
        html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">';
        html+='<span style="font-size:11px;font-weight:600;color:'+bCol+';width:54px;flex-shrink:0">Block '+b.block+'</span>';
        html+='<div style="flex:1;height:14px;background:var(--surface-alt);border:1px solid var(--line-soft);border-radius:var(--r-sm);overflow:hidden">';
        html+='<div style="margin-left:'+(maxR2>0?(prevAccum/maxR2*100).toFixed(1):'0')+'%;width:'+pct.toFixed(1)+'%;height:100%;background:'+bCol+';transition:width .35s"></div></div>';
        html+='<span style="font-size:11px;font-family:var(--font-mono-stack);font-variant-numeric:tabular-nums;color:var(--ink);width:68px;text-align:right">ΔR²='+b.dR2+'</span>';
        html+='</div>';
        prevAccum+=dR2Num;
      });
      html+='</div>';
      // Coefficient tables per block
      (hrRes.blocks||[]).forEach(function(b,bi){
        var bCol=T.series[bi%T.series.length];
        html+='<div style="margin-top:14px">';
        html+='<div class="sec-hd" style="margin-bottom:7px;color:'+bCol+'">Block '+b.block+' Coefficients <span style="font-size:10.5px;font-weight:400;color:var(--ink-subtle);font-style:normal">(cumulative predictors: '+b.cumulativePredictors.map(escHtml).join(', ')+')</span></div>';
        html+=mkTable(['Variable','B','SE','β','t','p','VIF'],
          (b.coefs||[]).map(function(c,ci){
            var vif=ci===0?'—':(b.vif?b.vif[ci-1]:'—');
            var pSig=parseFloat(c.p_fmt)<0.05;
            return[escHtml(c.name),c.B,c.SE,ci===0?'—':c.beta,c.t,
              (pSig?'<b style="color:var(--ok)">':'')+c.p_fmt+(pSig?'</b>':''),
              vif];
          }));
        html+='</div>';
      });
  return html;
}
