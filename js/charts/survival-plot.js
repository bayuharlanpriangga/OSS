// Survival Analysis chart — Kaplan-Meier + Forest Plot Hazard Ratio (Cox)
// Depends on: escHtml() (app.js) dan SE.f4 — keduanya dibaca runtime.
function svgKaplanMeier(res,W,H){
  W=W||420;H=H||280;
  var P={l:40,r:14,t:14,b:44};
  var cw=W-P.l-P.r,ch=H-P.t-P.b;
  var allTimes=res.groups.flatMap(function(g){return g.steps.map(function(s){return s.t;});});
  var tMax=allTimes.length?Math.max.apply(null,allTimes):1;
  function tx(t){return P.l+Math.min(1,t/tMax)*cw;}
  function ty(s){return P.t+ch*(1-Math.max(0,Math.min(1,s)));}
  var colors=['#f472b6','#67e8f9','#fbbf24','#34d399','#c084fc'];
  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block">';
  svg+='<defs>';
  colors.forEach(function(c,i){svg+='<linearGradient id="kmFill'+i+'" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="'+c+'" stop-opacity="0.12"/><stop offset="100%" stop-color="'+c+'" stop-opacity="0"/></linearGradient>';});
  svg+='</defs>';
  // Grid
  [0,.25,.5,.75,1].forEach(function(v){
    var y=ty(v),x=tx(v*tMax);
    svg+='<line x1="'+P.l+'" x2="'+(P.l+cw)+'" y1="'+y+'" y2="'+y+'" stroke="rgba(255,255,255,'+(v===0.5?'.12':'.05')+')" stroke-width="'+(v===0.5?1.2:1)+'"/>';
    svg+='<text x="'+(P.l-4)+'" y="'+(y+4)+'" text-anchor="end" font-size="8" fill="#64748b">'+escHtml(v)+'</text>';
    svg+='<text x="'+x+'" y="'+(H-P.b+13)+'" text-anchor="middle" font-size="8" fill="#64748b">'+(v*tMax).toFixed(0)+'</text>';
  });
  // Reference line at 0.5 (median)
  svg+='<line x1="'+P.l+'" x2="'+(P.l+cw)+'" y1="'+ty(0.5)+'" y2="'+ty(0.5)+'" stroke="rgba(255,255,255,.2)" stroke-width="1" stroke-dasharray="4,3"/>';

  res.groups.forEach(function(g,gi){
    var col=colors[gi%5];
    if(!g.steps.length) return;
    // Build step function path
    var path='M'+tx(0)+' '+ty(1);
    var prevS=1,prevT=0;
    g.steps.forEach(function(s){
      path+=' L'+tx(s.t)+' '+ty(prevS); // horizontal step
      if(s.events>0) path+=' L'+tx(s.t)+' '+ty(s.S); // vertical drop
      prevS=s.S;prevT=s.t;
    });
    path+=' L'+tx(tMax)+' '+ty(prevS);
    // CI fill
    var ciPath='M'+tx(0)+' '+ty(1);
    g.steps.forEach(function(s){if(s.events>0)ciPath+=' L'+tx(s.t)+' '+ty(s.ci_hi);});
    g.steps.slice().reverse().forEach(function(s){if(s.events>0)ciPath+=' L'+tx(s.t)+' '+ty(s.ci_lo);});
    ciPath+=' Z';
    svg+='<path d="'+ciPath+'" fill="'+col+'" fill-opacity="0.08" stroke="none"/>';
    svg+='<path d="'+path+'" fill="none" stroke="'+col+'" stroke-width="2.2" stroke-linecap="round"/>';
    // Censored marks
    g.steps.forEach(function(s){
      if(s.censored>0) svg+='<line x1="'+tx(s.t)+'" x2="'+tx(s.t)+'" y1="'+(ty(s.S)-5)+'" y2="'+(ty(s.S)+5)+'" stroke="'+col+'" stroke-width="1.5" opacity="0.7"/>';
    });
    // Legend
    var ly=P.t+6+gi*14;
    svg+='<line x1="'+(P.l+4)+'" x2="'+(P.l+20)+'" y1="'+ly+'" y2="'+ly+'" stroke="'+col+'" stroke-width="2"/>';
    svg+='<text x="'+(P.l+24)+'" y="'+(ly+4)+'" font-size="9" fill="'+col+'">'+escHtml(g.label)+(g.medianSurv!==null?' (M='+SE.f4(g.medianSurv)+')':' (M=NR)')+'</text>';
  });

  svg+='<line x1="'+P.l+'" y1="'+P.t+'" x2="'+P.l+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.2)" stroke-width="1.2"/>';
  svg+='<line x1="'+P.l+'" y1="'+(P.t+ch)+'" x2="'+(P.l+cw)+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.2)" stroke-width="1.2"/>';
  svg+='<text x="'+(P.l+cw/2)+'" y="'+H+'" text-anchor="middle" font-size="9" fill="#475569">Time</text>';
  svg+='<text x="12" y="'+(P.t+ch/2)+'" text-anchor="middle" font-size="9" fill="#475569" transform="rotate(-90,12,'+(P.t+ch/2)+')">Survival Probability</text>';
  return svg+'</svg>';
}


function svgForestPlot(res,W,H){
  W=W||400;
  var rowH=28,padT=20,padB=24,padL=110,padR=80;
  H=padT+res.coefs.length*rowH+padB;
  var logHRs=res.coefs.map(function(c){return Math.log(parseFloat(c.HR));});
  var ciLos=res.coefs.map(function(c){return Math.log(parseFloat(c.ci95.replace(/[\[\] ]/g,'').split(',')[0]));});
  var ciHis=res.coefs.map(function(c){return Math.log(parseFloat(c.ci95.replace(/[\[\] ]/g,'').split(',')[1]));});
  var allVals=logHRs.concat(ciLos,ciHis).filter(isFinite);
  if(!allVals.length) return '';
  var xMin=Math.min.apply(null,allVals)-0.3,xMax=Math.max.apply(null,allVals)+0.3;
  xMin=Math.min(xMin,-0.5);xMax=Math.max(xMax,0.5);
  var plotW=W-padL-padR;
  function tx(v){return padL+((v-xMin)/(xMax-xMin))*plotW;}
  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;margin-top:12px;display:block">';
  var x0=tx(0);
  svg+='<line x1="'+x0+'" y1="'+padT+'" x2="'+x0+'" y2="'+(H-padB)+'" stroke="rgba(255,255,255,.18)" stroke-width="1.2" stroke-dasharray="4,3"/>';
  svg+='<text x="'+x0+'" y="'+(H-padB+14)+'" text-anchor="middle" font-size="8" fill="#64748b">1.0 (null)</text>';
  [-1,0,1].forEach(function(v){var xv=tx(v),hr=Math.exp(v).toFixed(1);svg+='<text x="'+xv+'" y="'+(H-padB+14)+'" text-anchor="middle" font-size="7.5" fill="#475569">HR='+hr+'</text>';});
  res.coefs.forEach(function(c,i){
    var y=padT+i*rowH+rowH/2;
    var lhr=logHRs[i],lo=ciLos[i],hi=ciHis[i];
    var sig=parseFloat(c.p)<0.05;
    var col=sig?(parseFloat(c.HR)>1?'#f87171':'#34d399'):'#818cf8';
    svg+='<text x="'+(padL-5)+'" y="'+(y+4)+'" text-anchor="end" font-size="9" fill="'+col+'" font-weight="'+(sig?700:400)+'">'+escHtml(c.name)+'</text>';
    if(isFinite(lo)&&isFinite(hi)){
      svg+='<line x1="'+tx(lo)+'" x2="'+tx(hi)+'" y1="'+y+'" y2="'+y+'" stroke="'+col+'" stroke-width="1.5"/>';
      svg+='<line x1="'+tx(lo)+'" x2="'+tx(lo)+'" y1="'+(y-4)+'" y2="'+(y+4)+'" stroke="'+col+'" stroke-width="1.5"/>';
      svg+='<line x1="'+tx(hi)+'" x2="'+tx(hi)+'" y1="'+(y-4)+'" y2="'+(y+4)+'" stroke="'+col+'" stroke-width="1.5"/>';
    }
    if(isFinite(lhr)) svg+='<rect x="'+(tx(lhr)-5)+'" y="'+(y-5)+'" width="10" height="10" rx="2" fill="'+col+'" opacity="0.9"/>';
    svg+='<text x="'+(W-padR+5)+'" y="'+(y+4)+'" font-size="8" fill="'+col+'">'+c.HR+' '+c.ci95+'</text>';
  });
  svg+='</svg>';
  return svg;
}
