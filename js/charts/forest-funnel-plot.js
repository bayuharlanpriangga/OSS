// Forest Plot SVG
function svgMetaForestPlot(studies, res, effectType){
  var k=studies.length;
  var sd=res.studyData;
  var rowH=22,padT=30,padB=50,padL=130,padR=120;
  var W=520,H=padT+k*rowH+rowH*2+padB;
  var cw=W-padL-padR;
  var ch=H-padT-padB;

  // Determine x scale
  var allVals=sd.reduce(function(a,s){return a.concat([s.ci_lo,s.ci_hi,s.yi]);},[ res.ci_lo,res.ci_hi,res.pooledEffect]);
  var xMin=Math.min.apply(null,allVals),xMax=Math.max.apply(null,allVals);
  var xRange=xMax-xMin||1;
  var xPad=xRange*0.2;
  xMin-=xPad; xMax+=xPad;
  function tx(v){return padL+((v-xMin)/(xMax-xMin))*cw;}
  var x0=tx(0);

  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;max-height:'+Math.min(H,420)+'px;overflow:visible">';

  // Background grid
  for(var xi=-2;xi<=2;xi+=0.5){
    var gx=tx(xi);
    if(gx<padL||gx>padL+cw) continue;
    svg+='<line x1="'+gx+'" y1="'+padT+'" x2="'+gx+'" y2="'+(H-padB)+'" stroke="rgba(255,255,255,.05)" stroke-width="1"/>';
    svg+='<text x="'+gx+'" y="'+(H-padB+14)+'" text-anchor="middle" font-size="8.5" fill="rgba(232,222,255,.3)" font-family="Inter,sans-serif">'+xi+'</text>';
  }

  // Null line
  if(x0>=padL&&x0<=padL+cw){
    svg+='<line x1="'+x0+'" y1="'+padT+'" x2="'+x0+'" y2="'+(H-padB)+'" stroke="rgba(248,113,113,.3)" stroke-width="1.2" stroke-dasharray="4,3"/>';
  }

  // Header
  svg+='<text x="4" y="'+(padT-10)+'" font-size="9" font-weight="700" fill="rgba(232,222,255,.4)" font-family="Inter,sans-serif">Study</text>';
  svg+='<text x="'+(padL+cw+5)+'" y="'+(padT-10)+'" font-size="9" font-weight="700" fill="rgba(232,222,255,.4)" font-family="Inter,sans-serif">yi [95% CI]</text>';
  svg+='<text x="'+(padL+cw+100)+'" y="'+(padT-10)+'" font-size="9" font-weight="700" fill="rgba(232,222,255,.4)" font-family="Inter,sans-serif">W%</text>';

  // Study rows
  sd.forEach(function(s,i){
    var y=padT+i*rowH+rowH/2;
    var cx2=tx(s.yi);
    var lo=tx(s.ci_lo),hi=tx(s.ci_hi);
    var sqSize=Math.max(3,Math.min(9,2+s.weight/8));

    // Row bg on hover (alternating)
    if(i%2===0) svg+='<rect x="0" y="'+(y-rowH/2)+'" width="'+W+'" height="'+rowH+'" fill="rgba(255,255,255,.015)" rx="0"/>';

    // CI line
    svg+='<line x1="'+lo+'" y1="'+y+'" x2="'+hi+'" y2="'+y+'" stroke="#fb923c" stroke-width="1.5" opacity="0.7"/>';
    // End caps
    svg+='<line x1="'+lo+'" y1="'+(y-4)+'" x2="'+lo+'" y2="'+(y+4)+'" stroke="#fb923c" stroke-width="1.5" opacity="0.7"/>';
    svg+='<line x1="'+hi+'" y1="'+(y-4)+'" x2="'+hi+'" y2="'+(y+4)+'" stroke="#fb923c" stroke-width="1.5" opacity="0.7"/>';
    // Square (weight-proportional)
    svg+='<rect x="'+(cx2-sqSize/2)+'" y="'+(y-sqSize/2)+'" width="'+sqSize+'" height="'+sqSize+'" fill="#fb923c" opacity="0.9"/>';

    // Labels
    var nameShort=s.name.length>18?s.name.slice(0,16)+'…':s.name;
    svg+='<text x="'+(padL-6)+'" y="'+(y+3.5)+'" text-anchor="end" font-size="9" fill="rgba(232,222,255,.65)" font-family="Inter,sans-serif">'+escHtml(nameShort)+'</text>';
    svg+='<text x="'+(padL+cw+5)+'" y="'+(y+3.5)+'" font-size="8.5" fill="rgba(232,222,255,.55)" font-family="Inter,sans-serif">'+s.yi.toFixed(3)+' ['+s.ci_lo+', '+s.ci_hi+']</text>';
    svg+='<text x="'+(padL+cw+108)+'" y="'+(y+3.5)+'" font-size="8.5" fill="rgba(232,222,255,.4)" font-family="Inter,sans-serif">'+s.weight.toFixed(1)+'%</text>';
  });

  // Pooled diamond
  var py=padT+k*rowH+rowH*0.7;
  var px=tx(res.pooledEffect);
  var pl=tx(res.ci_lo),pr2=tx(res.ci_hi);
  var dh=8;
  svg+='<line x1="'+padL+'" y1="'+py+'" x2="'+(padL+cw)+'" y2="'+py+'" stroke="rgba(255,255,255,.08)" stroke-width="1"/>';
  svg+='<text x="'+(padL-6)+'" y="'+(py+4)+'" text-anchor="end" font-size="9" font-weight="700" fill="#fbbf24" font-family="Inter,sans-serif">'+(res.model==='fixed'?'FE':'RE')+' Summary</text>';
  svg+='<polygon points="'+px+','+(py-dh)+' '+pr2+','+py+' '+px+','+(py+dh)+' '+pl+','+py+'" fill="#fbbf24" opacity="0.9"/>';
  svg+='<text x="'+(padL+cw+5)+'" y="'+(py+4)+'" font-size="9" font-weight="700" fill="#fbbf24" font-family="Inter,sans-serif">'+res.pooledEffect+' ['+res.ci_lo+', '+res.ci_hi+']</text>';

  // X-axis
  svg+='<line x1="'+padL+'" y1="'+(H-padB)+'" x2="'+(padL+cw)+'" y2="'+(H-padB)+'" stroke="rgba(255,255,255,.15)" stroke-width="1"/>';
  svg+='<text x="'+tx(0)+'" y="'+(H-padB+28)+'" text-anchor="middle" font-size="9.5" fill="rgba(232,222,255,.4)" font-family="Inter,sans-serif">Effect Size ('+escHtml(effectType)+')</text>';

  svg+='</svg>';
  return svg;
}

// Funnel Plot SVG 
function svgFunnelPlot(res){
  var sd=res.studyData;
  var W=420,H=220,padL=45,padR=20,padT=20,padB=40;
  var cw=W-padL-padR,ch=H-padT-padB;

  var seArr=sd.map(function(s){return Math.sqrt(s.vi);});
  var maxSE=Math.max.apply(null,seArr)*1.15;
  var mu=res.pooledEffect;

  var allX=sd.map(function(s){return s.yi;}).concat([mu-1.96*maxSE,mu+1.96*maxSE]);
  var xMin=Math.min.apply(null,allX),xMax=Math.max.apply(null,allX);
  var xRange=xMax-xMin||1;
  xMin-=xRange*0.1; xMax+=xRange*0.1;

  function tx(v){return padL+((v-xMin)/(xMax-xMin))*cw;}
  function ty(se){return padT+((se/maxSE))*ch;}  // SE axis goes down

  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:'+H+'px">';

  // Funnel lines (95% CI boundary)
  var seSteps=20;
  var fL=[],fR=[];
  for(var si=0;si<=seSteps;si++){
    var se=maxSE*si/seSteps;
    var xl=mu-1.96*se, xr=mu+1.96*se;
    var y=ty(se);
    fL.push(tx(xl)+','+y);
    fR.push(tx(xr)+','+y);
  }
  svg+='<polyline points="'+fL.join(' ')+'" fill="none" stroke="rgba(251,191,36,.2)" stroke-width="1.5" stroke-dasharray="4,3"/>';
  svg+='<polyline points="'+fR.join(' ')+'" fill="none" stroke="rgba(251,191,36,.2)" stroke-width="1.5" stroke-dasharray="4,3"/>';

  // Center line
  svg+='<line x1="'+tx(mu)+'" y1="'+padT+'" x2="'+tx(mu)+'" y2="'+(H-padB)+'" stroke="rgba(251,146,60,.5)" stroke-width="1.5" stroke-dasharray="5,3"/>';

  // Grid
  for(var gi=0;gi<=4;gi++){
    var gse=maxSE*gi/4;
    var gy=ty(gse);
    svg+='<line x1="'+padL+'" y1="'+gy+'" x2="'+(padL+cw)+'" y2="'+gy+'" stroke="rgba(255,255,255,.04)" stroke-width="1"/>';
    svg+='<text x="'+(padL-4)+'" y="'+(gy+3)+'" text-anchor="end" font-size="8" fill="rgba(232,222,255,.3)" font-family="Inter,sans-serif">'+gse.toFixed(2)+'</text>';
  }

  // Study points
  sd.forEach(function(s){
    var sx=tx(s.yi), sy=ty(Math.sqrt(s.vi));
    svg+='<circle cx="'+sx+'" cy="'+sy+'" r="5" fill="rgba(251,146,60,.7)" stroke="rgba(251,146,60,.4)" stroke-width="1"/>';
  });

  // Axes
  svg+='<line x1="'+padL+'" y1="'+padT+'" x2="'+padL+'" y2="'+(H-padB)+'" stroke="rgba(255,255,255,.15)" stroke-width="1"/>';
  svg+='<line x1="'+padL+'" y1="'+(H-padB)+'" x2="'+(padL+cw)+'" y2="'+(H-padB)+'" stroke="rgba(255,255,255,.15)" stroke-width="1"/>';

  // X tick labels
  [-2,-1,0,1,2].forEach(function(v){
    var gx=tx(mu+v*(xMax-xMin)/6);
    if(gx<padL||gx>padL+cw) return;
    svg+='<text x="'+gx+'" y="'+(H-padB+14)+'" text-anchor="middle" font-size="8" fill="rgba(232,222,255,.3)" font-family="Inter,sans-serif">'+(mu+v*(xMax-xMin)/6).toFixed(2)+'</text>';
  });

  // Labels
  svg+='<text x="'+(padL+cw/2)+'" y="'+H+'" text-anchor="middle" font-size="9" fill="rgba(232,222,255,.4)" font-family="Inter,sans-serif">Effect Size</text>';
  svg+='<text x="10" y="'+(padT+ch/2)+'" text-anchor="middle" font-size="8.5" fill="rgba(232,222,255,.3)" font-family="Inter,sans-serif" transform="rotate(-90,10,'+(padT+ch/2)+')">SE</text>';

  svg+='</svg>';
  return svg;
}
