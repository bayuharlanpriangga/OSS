// o.type==='descriptive'
function renderOutBasic_descriptive(o){
  var html='';
      html+='<div class="stats-grid">';
      Object.entries(o.stats).filter(([,v])=>v!==undefined&&v!==null).forEach(([k,v])=>html+=stCard(k,v));
      html+='</div>';
      const swp=parseFloat(o.stats.shapiroP),ksp=parseFloat(o.stats.ksP),sk=parseFloat(o.stats.skewness);
      html+='<div class="notice-box" style="margin:10px 0">';
      html+='<div style="font-size:11px;font-weight:700;color:var(--ink);margin-bottom:6px">Normality Summary</div><div class="row" style="gap:6px;flex-wrap:wrap">';
      html+='<span class="tag '+(swp>.05?'tag-green':'tag-red')+'">'+(swp>.05?'✓ Normal':'✗ Non-normal')+' (SW p='+o.stats.shapiroP+')</span>';
      if(o.stats.ksP&&o.stats.ksP!=='N/A')
        html+='<span class="tag '+(ksp>.05?'tag-green':'tag-red')+'">'+(ksp>.05?'✓ Normal':'✗ Non-normal')+' (KS p='+o.stats.ksP+')</span>';
      const skTag=Math.abs(sk)<1?'tag-green':Math.abs(sk)<2?'tag-yellow':'tag-red';
      html+='<span class="tag '+skTag+'">'+(Math.abs(sk)<1?'Low skew':'Skewed')+'</span>';
      if(o.stats.outlierCount>0)html+='<span class="tag tag-yellow">'+o.stats.outlierCount+' outlier(s)</span>';
      html+='</div></div>';
      html+='<div class="chart-stack">'+svgHistogram(data,o.field)+'<div style="font-size:11px;color:var(--ink-muted);margin:3px 0">Normal Q-Q Plot</div>'+svgQQ(data,o.field)+'</div>';
  return html;
}
