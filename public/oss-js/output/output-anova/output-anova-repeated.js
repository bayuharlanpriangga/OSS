// o.type==='rmanova'&&o.res
function renderOutBasic_rmanova(o){
  var html='';
      var r=o.res;
      var T=typeof ossChartTheme==='function'?ossChartTheme():{ice:'#4F7A99',primary:'#0D0D0D',ok:'#2F7048',muted:'#4A5663',ink:'#0D0D0D',grid:'rgba(79,122,153,0.18)'};
      // ANOVA table
      html+=mkTable(['Source','df','SS','MS','F','p','\u03b7\u00b2p'],[
        ['Between (Time)',r.dfB,r.SSB,r.MSB,r.F,r.p_fmt,r.etaSq],
        ['Subjects',r.dfS,r.SSS,'\u2014','\u2014','\u2014','\u2014'],
        ['Error (Residual)',r.dfE,r.SSE,r.MSE,'\u2014','\u2014','\u2014']
      ]);
      html+='<div class="row" style="margin:10px 0">'+sigBadge(r.p);
      html+='<span class="tag tag-gray">\u03b7\u00b2p='+r.etaSq+' ('+r.etaInterp+')</span></div>';
      // Means table
      html+=mkTable(['Time Point','Variable','Mean'],r.labels.map(function(lb,i){return[lb,o.rmVars[i],r.tMeans[i]];}));
      // Profile plot
      if(r.tMeans&&r.tMeans.length>=2){
        var rMns=r.tMeans.map(parseFloat);
        var rmx=Math.max.apply(null,rMns),rmn=Math.min.apply(null,rMns),rng=rmx-rmn||1;
        var svgW=240,svgH=120,pL=32,pB=22,pT=14,pR=14;
        var pW=svgW-pL-pR,pH=svgH-pB-pT;
        var rmPts=rMns.map(function(m,i){return{x:pL+i/(rMns.length-1)*pW,y:pT+pH-(((m-rmn)/rng)*pH*0.85+0.075*pH),m:m,lb:r.labels[i]};});
        var poly=rmPts.map(function(p){return p.x+','+p.y;}).join(' ');
        var svg='<svg viewBox="0 0 '+svgW+' '+svgH+'" style="width:100%;height:auto;margin-top:10px">';
        svg+='<line x1="'+pL+'" y1="'+(pT+pH)+'" x2="'+(svgW-pR)+'" y2="'+(pT+pH)+'" stroke="'+T.grid+'" stroke-width="1"/>';
        svg+='<polyline points="'+poly+'" fill="none" stroke="'+T.ice+'" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>';
        rmPts.forEach(function(p){
          svg+='<circle cx="'+p.x+'" cy="'+p.y+'" r="4" fill="'+T.primary+'"/>';
          svg+='<text x="'+p.x+'" y="'+(svgH-5)+'" text-anchor="middle" font-size="9" fill="'+T.muted+'">'+p.lb+'</text>';
          svg+='<text x="'+p.x+'" y="'+(p.y-8)+'" text-anchor="middle" font-size="8.5" font-weight="600" fill="'+T.ink+'">'+SE.f4(p.m)+'</text>';
        });
        svg+='</svg>';
        html+=svg;
      }
      // Post-hoc
      if(o.posthoc&&o.posthoc.length){
        html+='<div class="sec-hd" style="margin-top:13px">Post-Hoc Pairwise (Paired t-test, uncorrected)</div>';
        html+=mkTable(['Pair','Mean Diff','t','p','Sig'],o.posthoc.map(function(ph){return[ph.la+' vs '+ph.lb,ph.meanDiff,ph.t,ph.p,ph.sig?'*':'ns'];}));
        html+='<div style="font-size:11px;color:var(--ink-subtle);margin-top:5px">* Pertimbangkan koreksi Bonferroni: α/'+o.posthoc.length+' = '+SE.f4(.05/o.posthoc.length)+'</div>';
      }
  return html;
}
