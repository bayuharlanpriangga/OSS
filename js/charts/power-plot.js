// Power Analysis chart
function svgPowerCurve(test,alpha,tails,W,H){
  W=W||420; H=H||220;
  var effectSets={
    'ttest_2samp':[[0.2,'Small'],[0.5,'Medium'],[0.8,'Large']],
    'ttest_1samp':[[0.2,'Small'],[0.5,'Medium'],[0.8,'Large']],
    'ttest_paired':[[0.2,'Small'],[0.5,'Medium'],[0.8,'Large']],
    'anova_oneway':[[0.10,'Small'],[0.25,'Medium'],[0.40,'Large']],
    'correlation':[[0.10,'Small'],[0.30,'Medium'],[0.50,'Large']],
    'regression_r2':[[0.02,'Small'],[0.15,'Medium'],[0.35,'Large']],
    'chisq':[[0.10,'Small'],[0.30,'Medium'],[0.50,'Large']]
  };
  var effs=effectSets[test]||effectSets['ttest_2samp'];
  var Ns=[]; for(var n=5;n<=200;n+=5) Ns.push(n);
  var P={l:38,r:16,t:14,b:42};
  var cw=W-P.l-P.r, ch=H-P.t-P.b;
  var colors=['#f472b6','#fbbf24','#34d399'];
  var xMin=Ns[0],xMax=Ns[Ns.length-1];
  function tx(n){return P.l+(n-xMin)/(xMax-xMin)*cw;}
  function ty(p){return P.t+ch*(1-p);}

  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block">';
  svg+='<defs>';
  for(var ci=0;ci<3;ci++) svg+='<linearGradient id="pwGrad'+ci+'" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="'+colors[ci]+'" stop-opacity="0.5"/><stop offset="100%" stop-color="'+colors[ci]+'" stop-opacity="1"/></linearGradient>';
  svg+='</defs>';

  // Grid
  [0.5,0.7,0.8,0.9,1.0].forEach(function(p){
    var y=ty(p);
    svg+='<line x1="'+P.l+'" x2="'+(P.l+cw)+'" y1="'+y+'" y2="'+y+'" stroke="rgba(255,255,255,'+(p===0.8?'.15':'.05')+')" stroke-width="'+(p===0.8?1.5:1)+'"/>';
    svg+='<text x="'+(P.l-4)+'" y="'+(y+4)+'" text-anchor="end" font-size="8" fill="#64748b">'+SE.f4(p)+'</text>';
    if(p===0.8) svg+='<text x="'+(P.l+cw+2)+'" y="'+(y+4)+'" font-size="8" fill="rgba(251,191,36,.8)">0.80</text>';
  });
  // Reference line at 0.80
  var y80=ty(0.80);
  svg+='<line x1="'+P.l+'" x2="'+(P.l+cw)+'" y1="'+y80+'" y2="'+y80+'" stroke="rgba(251,191,36,.6)" stroke-width="1.5" stroke-dasharray="5,3"/>';

  // Curves
  effs.forEach(function(ef,idx){
    var pts=Ns.map(function(n){
      try{var r=computePower(test,alpha,(aState.pwPower||0.8),ef[0],2,tails,'power',n);return{x:tx(n),y:ty(Math.min(1,parseFloat(r.power)||0))};} catch{return null;}
    }).filter(Boolean);
    if(pts.length<2) return;
    var d=pts.map(function(p,i){return (i===0?'M':'L')+p.x+' '+p.y;}).join('');
    svg+='<path d="'+d+'" fill="none" stroke="'+colors[idx]+'" stroke-width="2.2" opacity="0.9" stroke-linecap="round" stroke-linejoin="round"/>';
    // Label
    var last=pts[pts.length-1];
    svg+='<text x="'+(last.x+3)+'" y="'+(last.y+4)+'" font-size="9" fill="'+colors[idx]+'">'+ef[1]+'</text>';
  });

  // Axes
  svg+='<line x1="'+P.l+'" y1="'+P.t+'" x2="'+P.l+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.2)" stroke-width="1.2"/>';
  svg+='<line x1="'+P.l+'" y1="'+(P.t+ch)+'" x2="'+(P.l+cw)+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.2)" stroke-width="1.2"/>';
  // X labels
  [10,50,100,150,200].forEach(function(n){svg+='<text x="'+tx(n)+'" y="'+(H-P.b+14)+'" text-anchor="middle" font-size="8.5" fill="#64748b">'+n+'</text>';});
  svg+='<text x="'+(P.l+cw/2)+'" y="'+H+'" text-anchor="middle" font-size="9" fill="#475569">N per group</text>';
  svg+='<text x="12" y="'+(P.t+ch/2)+'" text-anchor="middle" font-size="9" fill="#475569" transform="rotate(-90,12,'+(P.t+ch/2)+')">Power</text>';
  return svg+'</svg>';
}

function svgSensitivityCurve(test,alpha,power,tails,nHighlight,W,H){
  W=W||420; H=H||180;
  var Ns=[]; for(var n=5;n<=300;n+=5) Ns.push(n);
  var P={l:40,r:16,t:14,b:40};
  var cw=W-P.l-P.r, ch=H-P.t-P.b;
  var xMin=Ns[0],xMax=Ns[Ns.length-1];
  function tx(n){return P.l+(n-xMin)/(xMax-xMin)*cw;}
  var allEffs=Ns.map(function(n){try{var r=computePower(test,alpha,power,null,2,tails,'effect',n);return parseFloat(r.effect)||null;}catch{return null;}});
  var validEffs=allEffs.filter(Boolean);
  if(!validEffs.length) return '';
  var eMin=Math.min.apply(null,validEffs),eMax=Math.max.apply(null,validEffs);
  var eRange=eMax-eMin||1;
  function ty(e){return P.t+ch*(1-(e-eMin)/eRange);}

  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;margin-top:12px;display:block">';
  // Grid
  [eMin,eMin+eRange/2,eMax].forEach(function(e){
    var y=ty(e);
    svg+='<line x1="'+P.l+'" x2="'+(P.l+cw)+'" y1="'+y+'" y2="'+y+'" stroke="rgba(255,255,255,.05)" stroke-width="1"/>';
    svg+='<text x="'+(P.l-4)+'" y="'+(y+4)+'" text-anchor="end" font-size="8" fill="#64748b">'+SE.f4(e)+'</text>';
  });
  // Curve
  var pts=Ns.map(function(n,i){var e=allEffs[i];return e?{x:tx(n),y:ty(e)}:null;}).filter(Boolean);
  if(pts.length>=2){
    var d=pts.map(function(p,i){return (i===0?'M':'L')+p.x+' '+p.y;}).join('');
    svg+='<path d="'+d+'" fill="none" stroke="#c084fc" stroke-width="2" opacity="0.9" stroke-linecap="round"/>';
    // Highlight current N
    if(nHighlight&&nHighlight>=Ns[0]&&nHighlight<=Ns[Ns.length-1]){
      var ni=Math.round((nHighlight-Ns[0])/5);
      if(ni>=0&&ni<allEffs.length&&allEffs[ni]){
        var hx=tx(nHighlight),hy=ty(allEffs[ni]);
        svg+='<line x1="'+hx+'" y1="'+P.t+'" x2="'+hx+'" y2="'+(P.t+ch)+'" stroke="#f472b6" stroke-width="1.2" stroke-dasharray="4,3"/>';
        svg+='<circle cx="'+hx+'" cy="'+hy+'" r="5" fill="#f472b6" opacity="0.9"/>';
        svg+='<text x="'+(hx+6)+'" y="'+(hy-4)+'" font-size="9" fill="#f472b6">N='+nHighlight+'</text>';
      }
    }
  }
  svg+='<line x1="'+P.l+'" y1="'+P.t+'" x2="'+P.l+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.2)" stroke-width="1.2"/>';
  svg+='<line x1="'+P.l+'" y1="'+(P.t+ch)+'" x2="'+(P.l+cw)+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.2)" stroke-width="1.2"/>';
  [20,50,100,200,300].forEach(function(n){if(n<=Ns[Ns.length-1]) svg+='<text x="'+tx(n)+'" y="'+(H-P.b+14)+'" text-anchor="middle" font-size="8.5" fill="#64748b">'+n+'</text>';});
  svg+='<text x="'+(P.l+cw/2)+'" y="'+H+'" text-anchor="middle" font-size="9" fill="#475569">N per group</text>';
  svg+='<text x="12" y="'+(P.t+ch/2)+'" text-anchor="middle" font-size="9" fill="#475569" transform="rotate(-90,12,'+(P.t+ch/2)+')">Min Det. Effect</text>';
  return svg+'</svg>';
}
