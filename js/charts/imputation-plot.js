// Multiple Imputation chart — Convergence Plot (data dari computeMICE, B16)
function svgConvergence(pooled,W,H){
  W=W||420;H=H||160;
  var P={l:40,r:12,t:12,b:32};
  var cw=W-P.l-P.r,ch=H-P.t-P.b;
  var M=pooled[0].convergence.length;
  var colors=['#f472b6','#67e8f9','#fbbf24','#34d399','#c084fc'];
  var allVals=pooled.flatMap(function(p){return p.convergence;}).filter(isFinite);
  if(!allVals.length) return '';
  var yMin=Math.min.apply(null,allVals),yMax=Math.max.apply(null,allVals);
  var yRange=yMax-yMin||1;
  function tx(m){return P.l+((m)/(M-1||1))*cw;}
  function ty(v){return P.t+ch*(1-(v-yMin)/yRange);}
  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block">';
  [0,.5,1].forEach(function(f){var y=P.t+f*ch;svg+='<line x1="'+P.l+'" x2="'+(P.l+cw)+'" y1="'+y+'" y2="'+y+'" stroke="rgba(255,255,255,.05)"/>';});
  pooled.slice(0,5).forEach(function(p,pi){
    var col=colors[pi%5];
    var pts=p.convergence;
    var path=pts.map(function(v,i){return (i===0?'M':'L')+tx(i)+' '+ty(v);}).join('');
    svg+='<path d="'+path+'" fill="none" stroke="'+col+'" stroke-width="1.8" stroke-linecap="round"/>';
    svg+='<text x="'+(P.l+cw+3)+'" y="'+(ty(pts[pts.length-1])+4)+'" font-size="8" fill="'+col+'">'+escHtml(p.variable)+'</text>';
  });
  svg+='<line x1="'+P.l+'" y1="'+P.t+'" x2="'+P.l+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.2)" stroke-width="1"/>';
  svg+='<line x1="'+P.l+'" y1="'+(P.t+ch)+'" x2="'+(P.l+cw)+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.2)" stroke-width="1"/>';
  for(var i=0;i<M;i+=Math.ceil(M/5)){svg+='<text x="'+tx(i)+'" y="'+(H-P.b+13)+'" text-anchor="middle" font-size="8" fill="#64748b">'+(i+1)+'</text>';}
  svg+='<text x="'+(P.l+cw/2)+'" y="'+H+'" text-anchor="middle" font-size="9" fill="#475569">Imputation m</text>';
  return svg+'</svg>';
}
