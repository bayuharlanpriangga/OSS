// o.type==='regression'
function renderOutBasic_regression(o){
  var html='';
      html+=mkTable(['','B','SE','t','p','Sig'],[['Constant',o.res.b0,o.res.SEb0,o.res.tb0,o.res.pb0_fmt,parseFloat(o.res.pb0)<.05?'*':'ns'],['Slope (b₁)',o.res.b1,o.res.SEb1,o.res.tb1,o.res.pb1_fmt,parseFloat(o.res.pb1)<.05?'*':'ns']]);
      html+='<div class="stats-grid" style="margin:10px 0">'+stCard('R²',o.res.R2)+stCard('Adj R²',o.res.R2adj)+stCard('F',o.res.F,'p='+o.res.pF_fmt)+stCard('RMSE',o.res.RMSE)+'</div>';
      html+='<div class="eq">Ŷ = '+o.res.b0+' + '+o.res.b1+'·'+escHtml(o.xF)+'</div>';
      html+='<div class="chart-stack">'+svgScatter(data,o.xF,o.yF)+svgResidual(o.res)+'</div>';
  return html;
}
