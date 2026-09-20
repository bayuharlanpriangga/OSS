// SVG Posterior plot (prior vs posterior)
function svgBayesPosterior(r){
  var W=400,H=180,P={l:30,r:10,t:12,b:28};
  var mn=parseFloat(r._mun), sd=parseFloat(r._postSD);
  var pmu=parseFloat(r._priorMu0), psd=parseFloat(r._priorSD);
  var xMin=Math.min(mn,pmu)-Math.max(sd,psd)*3.5;
  var xMax=Math.max(mn,pmu)+Math.max(sd,psd)*3.5;
  var plotW=W-P.l-P.r, plotH=H-P.t-P.b;
  var tx=function(x){return P.l+((x-xMin)/(xMax-xMin))*plotW;};
  var priorPeak=1/(Math.sqrt(2*Math.PI)*psd);
  var postPeak=1/(Math.sqrt(2*Math.PI)*sd);
  var yMax=Math.max(priorPeak,postPeak)*1.15;
  var ty=function(y){return H-P.b-(y/yMax)*plotH;};
  var npts=120;
  var priorPts='',postPts='',priorArea='',postArea='';
  var dx=(xMax-xMin)/npts;
  for(var i=0;i<=npts;i++){
    var x=xMin+i*dx;
    var yPrior=Math.exp(-0.5*Math.pow((x-pmu)/psd,2))/(Math.sqrt(2*Math.PI)*psd);
    var yPost=Math.exp(-0.5*Math.pow((x-mn)/sd,2))/(Math.sqrt(2*Math.PI)*sd);
    var px=tx(x),pyPr=ty(yPrior),pyPo=ty(yPost);
    if(i===0){priorPts='M'+px+' '+pyPr;postPts='M'+px+' '+pyPo;priorArea='M'+px+' '+(H-P.b)+' L'+px+' '+pyPr;postArea='M'+px+' '+(H-P.b)+' L'+px+' '+pyPo;}
    else{priorPts+=' L'+px+' '+pyPr;postPts+=' L'+px+' '+pyPo;priorArea+=' L'+px+' '+pyPr;postArea+=' L'+px+' '+pyPo;}
  }
  priorArea+=' L'+tx(xMax)+' '+(H-P.b)+' Z';
  postArea+=' L'+tx(xMax)+' '+(H-P.b)+' Z';
  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block">';
  svg+='<path d="'+priorArea+'" fill="rgba(192,132,252,0.12)"/>';
  svg+='<path d="'+postArea+'" fill="rgba(244,114,182,0.18)"/>';
  svg+='<path d="'+priorPts+'" fill="none" stroke="rgba(192,132,252,0.75)" stroke-width="1.8" stroke-dasharray="6,3"/>';
  svg+='<path d="'+postPts+'" fill="none" stroke="rgba(244,114,182,0.95)" stroke-width="2.2"/>';
  // posterior mean line
  svg+='<line x1="'+tx(mn)+'" y1="'+P.t+'" x2="'+tx(mn)+'" y2="'+(H-P.b)+'" stroke="#f472b6" stroke-width="1.2" stroke-dasharray="4,2"/>';
  // prior mean line
  svg+='<line x1="'+tx(pmu)+'" y1="'+P.t+'" x2="'+tx(pmu)+'" y2="'+(H-P.b)+'" stroke="rgba(192,132,252,0.5)" stroke-width="1" stroke-dasharray="4,3"/>';
  // labels
  svg+='<text x="'+(W-P.r-2)+'" y="'+(P.t+10)+'" text-anchor="end" font-size="9" fill="#f472b6">Posterior</text>';
  svg+='<text x="'+(W-P.r-2)+'" y="'+(P.t+22)+'" text-anchor="end" font-size="9" fill="rgba(192,132,252,0.8)">Prior</text>';
  // x axis ticks
  [xMin,(xMin+xMax)/2,xMax].forEach(function(v){
    svg+='<text x="'+tx(v)+'" y="'+(H-P.b+14)+'" text-anchor="middle" font-size="8" fill="#64748b">'+v.toFixed(2)+'</text>';
  });
  svg+='<line x1="'+P.l+'" y1="'+(H-P.b)+'" x2="'+(W-P.r)+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  svg+='</svg>';
  return svg;
}
