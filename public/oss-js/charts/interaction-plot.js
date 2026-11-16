// Interaction Plot (Two-Way or Three-Way ANOVA)
// cellMeansTable: [{level:A_level, byB:[{level:B_level, mean, n}]}]
// xLabel: Factor B levels (x-axis), lineLabel: Factor A levels (lines)
function svgInteractionPlot(cellMeansTable, xLabel, lineLabel, depLabel, W, H){
  var T=ossChartTheme();
  W=W||420; H=H||220;
  if(!cellMeansTable||!cellMeansTable.length) return '<div class="chart-empty">No data</div>';
  var levB = cellMeansTable[0].byB.map(function(b){return b.level;});
  var allMeans = cellMeansTable.flatMap(function(row){return row.byB.map(function(c){return parseFloat(c.mean);}).filter(isFinite);});
  if(!allMeans.length) return '<div class="chart-empty">No valid cell means</div>';
  var minV = Math.min.apply(null,allMeans), maxV = Math.max.apply(null,allMeans);
  var pad = (maxV-minV)*0.15 || 0.5;
  minV -= pad; maxV += pad;

  var P={l:46,r:20,t:18,b:48};
  var cw=W-P.l-P.r, ch=H-P.t-P.b;
  var xStep = levB.length>1 ? cw/(levB.length-1) : cw/2;
  var xPos = function(i){return P.l + (levB.length>1 ? i*xStep : cw/2);};
  var yScale = function(v){return P.t + ch - ((v-minV)/(maxV-minV))*ch;};

  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block;overflow:visible">';

  // Grid lines
  var nGrid=4;
  for(var gi=0;gi<=nGrid;gi++){
    var gv=minV+gi*(maxV-minV)/nGrid;
    var gy=yScale(gv);
    svg+='<line x1="'+P.l+'" y1="'+gy+'" x2="'+(P.l+cw)+'" y2="'+gy+'" stroke="'+T.grid+'" stroke-width="1"/>';
    svg+='<text x="'+(P.l-4)+'" y="'+(gy+3.5)+'" text-anchor="end" font-size="8.5" fill="'+T.subtle+'">'+gv.toFixed(2)+'</text>';
  }
  // Axes
  svg+='<line x1="'+P.l+'" y1="'+P.t+'" x2="'+P.l+'" y2="'+(P.t+ch)+'" stroke="'+T.axis+'" stroke-width="1.5"/>';
  svg+='<line x1="'+P.l+'" y1="'+(P.t+ch)+'" x2="'+(P.l+cw)+'" y2="'+(P.t+ch)+'" stroke="'+T.axis+'" stroke-width="1.5"/>';

  // X axis labels (Factor B)
  levB.forEach(function(lbl,i){
    svg+='<text x="'+xPos(i)+'" y="'+(P.t+ch+16)+'" text-anchor="middle" font-size="9" fill="'+T.ink+'">'+escHtml(lbl)+'</text>';
  });
  // X axis title
  svg+='<text x="'+(P.l+cw/2)+'" y="'+(H-4)+'" text-anchor="middle" font-size="9.5" fill="'+T.muted+'">'+escHtml(xLabel)+'</text>';
  // Y axis title
  svg+='<text x="11" y="'+(P.t+ch/2)+'" text-anchor="middle" font-size="9.5" fill="'+T.muted+'" transform="rotate(-90 11 '+(P.t+ch/2)+')">'+escHtml(depLabel)+'</text>';

  // Lines per Factor A level
  cellMeansTable.forEach(function(row,ri){
    var col=T.series[ri%T.series.length];
    var pts=row.byB.map(function(c,i){
      var m=parseFloat(c.mean);
      if(!isFinite(m)) return null;
      return {x:xPos(i), y:yScale(m), m:m, n:c.n, lbl:c.level};
    }).filter(Boolean);
    if(pts.length<1) return;
    var d=pts.map(function(p,i){return (i===0?'M':'L')+p.x+' '+p.y;}).join(' ');
    svg+='<path d="'+d+'" fill="none" stroke="'+col+'" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>';
    pts.forEach(function(p){
      svg+='<circle cx="'+p.x+'" cy="'+p.y+'" r="4.5" fill="'+col+'" stroke="'+T.bg+'" stroke-width="1.5"><title>'+escHtml(row.level)+' / '+escHtml(p.lbl)+': M='+p.m.toFixed(3)+' (n='+p.n+')</title></circle>';
      svg+='<text x="'+p.x+'" y="'+(p.y-9)+'" text-anchor="middle" font-size="7.5" font-weight="600" fill="'+col+'">'+p.m.toFixed(2)+'</text>';
    });
  });

  // Legend (Factor A)
  var legX=P.l, legY=P.t-2;
  svg+='<text x="'+legX+'" y="'+legY+'" font-size="8" fill="'+T.muted+'">'+escHtml(lineLabel)+': </text>';
  cellMeansTable.forEach(function(row,ri){
    var lx=legX+50+ri*80, col=T.series[ri%T.series.length];
    svg+='<line x1="'+lx+'" y1="'+(legY-3.5)+'" x2="'+(lx+14)+'" y2="'+(legY-3.5)+'" stroke="'+col+'" stroke-width="2.2"/>';
    svg+='<circle cx="'+(lx+7)+'" cy="'+(legY-3.5)+'" r="3.5" fill="'+col+'"/>';
    svg+='<text x="'+(lx+18)+'" y="'+legY+'" font-size="8.5" fill="'+T.ink+'">'+escHtml(row.level)+'</text>';
  });

  svg+='</svg>';
  return svg;
}
