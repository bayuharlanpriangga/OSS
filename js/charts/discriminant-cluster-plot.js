// Discriminant & Cluster chart — svgDiscriminantPlot, svgClusterPlot, svgElbow, svgDendrogram
// Depends on: tidak ada (string builder murni, tanpa SE/escHtml/PAL2).

function svgDiscriminantPlot(lr){
  var W=400,H=220,P={l:36,r:16,t:16,b:32};
  var colors=['#38bdf8','#f472b6','#4ade80','#fb923c','#a78bfa','#34d399','#fbbf24','#e879f9'];
  var scores=lr.scores;
  if(!scores||scores.length<3) return '<div class="chart-empty">Not enough data for plot</div>';
  var xs=scores.map(function(s){return s[0]||0;});
  var ys=scores.map(function(s){return s.length>1?s[1]:0;});
  var xMin=Math.min.apply(null,xs),xMax=Math.max.apply(null,xs);
  var yMin=Math.min.apply(null,ys),yMax=Math.max.apply(null,ys);
  var xR=xMax-xMin||1,yR=yMax-yMin||1;
  var tx=function(v){return P.l+(v-xMin)/xR*(W-P.l-P.r);};
  var ty=function(v){return H-P.b-(v-yMin)/yR*(H-P.t-P.b);};
  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block;overflow:visible">';
  svg+='<line x1="'+P.l+'" y1="'+P.t+'" x2="'+P.l+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  svg+='<line x1="'+P.l+'" y1="'+(H-P.b)+'" x2="'+(W-P.r)+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  svg+='<text x="'+(W/2)+'" y="'+H+'" text-anchor="middle" font-size="9" fill="#64748b">Function 1</text>';
  if(lr.nFunctions>1) svg+='<text x="12" y="'+(H/2)+'" text-anchor="middle" font-size="9" fill="#64748b" transform="rotate(-90,12,'+(H/2)+')">Function 2</text>';
  // Plot points
  var groupIdx={};
  lr.groups.forEach(function(g,i){groupIdx[g]=i;});
  // We stored scores in same row order as rows (filtered data)
  scores.forEach(function(s,i){
    // We don't have per-row group label stored — use color cycling if groups unknown
    var col=colors[i%colors.length];
    svg+='<circle cx="'+tx(s[0]||0)+'" cy="'+ty(s.length>1?s[1]:0)+'" r="4" fill="'+col+'" fill-opacity=".65" stroke="'+col+'" stroke-width="1"/>';
  });
  // Legend
  lr.groups.forEach(function(g,i){
    svg+='<circle cx="'+(P.l+10+i*70)+'" cy="'+(P.t+6)+'" r="4" fill="'+colors[i%colors.length]+'" opacity=".8"/>';
    svg+='<text x="'+(P.l+17+i*70)+'" y="'+(P.t+10)+'" font-size="8.5" fill="#94a3b8">'+g.slice(0,8)+'</text>';
  });
  svg+='</svg>';
  return svg;
}

function svgClusterPlot(cr){
  var W=400,H=220,P={l:36,r:16,t:22,b:32};
  var colors=['#4ade80','#38bdf8','#f472b6','#fb923c','#a78bfa','#34d399','#fbbf24','#e879f9'];
  var pts=cr.plotData||[];
  if(!pts.length) return '<div class="chart-empty">No data</div>';
  var xs=pts.map(function(p){return p.x;}),ys=pts.map(function(p){return p.y;});
  var xMin=Math.min.apply(null,xs),xMax=Math.max.apply(null,xs);
  var yMin=Math.min.apply(null,ys),yMax=Math.max.apply(null,ys);
  var xR=xMax-xMin||1,yR=yMax-yMin||1;
  var tx=function(v){return P.l+(v-xMin)/xR*(W-P.l-P.r);};
  var ty=function(v){return H-P.b-(v-yMin)/yR*(H-P.t-P.b);};
  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block;overflow:visible">';
  svg+='<line x1="'+P.l+'" y1="'+P.t+'" x2="'+P.l+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  svg+='<line x1="'+P.l+'" y1="'+(H-P.b)+'" x2="'+(W-P.r)+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  svg+='<text x="'+(W/2)+'" y="'+H+'" text-anchor="middle" font-size="9" fill="#64748b">'+cr.vars[0]+' (z)</text>';
  if(cr.vars.length>1) svg+='<text x="11" y="'+(H/2)+'" text-anchor="middle" font-size="9" fill="#64748b" transform="rotate(-90,11,'+(H/2)+')">'+cr.vars[1]+' (z)</text>';
  pts.forEach(function(p){
    var col=colors[p.cluster%colors.length];
    svg+='<circle cx="'+tx(p.x)+'" cy="'+ty(p.y)+'" r="4.5" fill="'+col+'" fill-opacity=".65" stroke="'+col+'" stroke-width="1"/>';
  });
  // Legend
  var shown={};
  cr.clusters.forEach(function(c,i){
    svg+='<circle cx="'+(P.l+8+i*55)+'" cy="'+(P.t-6)+'" r="4" fill="'+colors[i%colors.length]+'" opacity=".85"/>';
    svg+='<text x="'+(P.l+15+i*55)+'" y="'+(P.t-2)+'" font-size="8.5" fill="#94a3b8">'+c.label+'</text>';
  });
  svg+='</svg>';
  return svg;
}

function svgElbow(elbowData){
  if(!elbowData||elbowData.length<2) return '<div class="chart-empty">Not enough data for elbow chart</div>';
  var W=380,H=160,P={l:44,r:16,t:12,b:32};
  var xs=elbowData.map(function(d){return d.k;});
  var ys=elbowData.map(function(d){return d.wss;});
  var xMin=Math.min.apply(null,xs),xMax=Math.max.apply(null,xs);
  var yMin=0,yMax=Math.max.apply(null,ys);
  var xR=xMax-xMin||1,yR=yMax-yMin||1;
  var tx=function(v){return P.l+(v-xMin)/xR*(W-P.l-P.r);};
  var ty=function(v){return H-P.b-(v-yMin)/yR*(H-P.t-P.b);};
  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block">';
  svg+='<line x1="'+P.l+'" y1="'+P.t+'" x2="'+P.l+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  svg+='<line x1="'+P.l+'" y1="'+(H-P.b)+'" x2="'+(W-P.r)+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  // Grid lines
  [0.25,0.5,0.75].forEach(function(f){
    var gy=P.t+f*(H-P.t-P.b);
    svg+='<line x1="'+P.l+'" y1="'+gy+'" x2="'+(W-P.r)+'" y2="'+gy+'" stroke="rgba(100,116,139,.2)" stroke-dasharray="3,3"/>';
    svg+='<text x="'+(P.l-4)+'" y="'+(gy+4)+'" text-anchor="end" font-size="8" fill="#64748b">'+((yMax*(1-f)).toFixed(0))+'</text>';
  });
  // Line
  var pts=elbowData.map(function(d){return tx(d.k)+','+ty(d.wss);}).join(' ');
  svg+='<polyline points="'+pts+'" fill="none" stroke="#4ade80" stroke-width="2" stroke-linejoin="round"/>';
  elbowData.forEach(function(d){
    svg+='<circle cx="'+tx(d.k)+'" cy="'+ty(d.wss)+'" r="4" fill="#4ade80" stroke="#0e0618" stroke-width="1.5"/>';
    svg+='<text x="'+tx(d.k)+'" y="'+(H-P.b+14)+'" text-anchor="middle" font-size="9" fill="#64748b">'+d.k+'</text>';
  });
  svg+='<text x="'+(W/2)+'" y="'+H+'" text-anchor="middle" font-size="9" fill="#64748b">Number of clusters (k)</text>';
  svg+='<text x="11" y="'+(H/2)+'" text-anchor="middle" font-size="9" fill="#64748b" transform="rotate(-90,11,'+(H/2)+')">WSS</text>';
  svg+='</svg>';
  return svg;
}

function svgDendrogram(mergeHistory, k, varNames){
  if(!mergeHistory||mergeHistory.length<1) return '<div class="chart-empty">No dendrogram data</div>';
  var W=400,H=200,P={l:10,r:10,t:10,b:30};
  // Simple horizontal dendrogram approximation
  var n=mergeHistory.length+1;
  var maxDist=mergeHistory.reduce(function(mx,m){return Math.max(mx,m.dist);},0)||1;
  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block">';
  svg+='<text x="'+(W/2)+'" y="'+(H-4)+'" text-anchor="middle" font-size="9" fill="#64748b">Merge Distance →</text>';
  // Draw simplified dendrogram as merge steps
  var stepH=(H-P.t-P.b-20)/Math.min(mergeHistory.length,15);
  var colors=['#4ade80','#38bdf8','#f472b6','#fb923c','#a78bfa'];
  mergeHistory.slice(0,15).forEach(function(m,i){
    var y=P.t+10+i*stepH;
    var xScale=(W-P.l-P.r);
    var x1=P.l+10,x2=P.l+10+(m.dist/maxDist)*xScale*0.85;
    var col=i>=mergeHistory.length-k+1?'#f87171':'#4ade80';
    svg+='<line x1="'+x1+'" y1="'+(y+stepH/2)+'" x2="'+x2+'" y2="'+(y+stepH/2)+'" stroke="'+col+'" stroke-width="'+(i>=mergeHistory.length-k+1?2:1.5)+'"/>';
    svg+='<circle cx="'+x2+'" cy="'+(y+stepH/2)+'" r="3" fill="'+col+'"/>';
    svg+='<text x="'+(x2+5)+'" y="'+(y+stepH/2+4)+'" font-size="8" fill="rgba(232,222,255,.5)">d='+m.dist+'  (n='+m.size+')</text>';
  });
  if(mergeHistory.length>15){
    svg+='<text x="'+(W/2)+'" y="'+(H-P.b-4)+'" text-anchor="middle" font-size="8" fill="rgba(232,222,255,.3)">...showing first 15 of '+mergeHistory.length+' merges</text>';
  }
  svg+='</svg>';
  return svg;
}
