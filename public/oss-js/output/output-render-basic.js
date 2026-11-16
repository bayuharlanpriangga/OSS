// ANOVA Source Table renderer
function renderAnovaTable(effects, error, total){
  var h='<div class="tbl-wrap"><table><thead><tr>';
  ['Source','SS','df','MS','F','p','η²','ηₚ²'].forEach(function(c,ci){
    h+='<th'+(ci>0?' style="text-align:right"':'')+'>'+c+'</th>';
  });
  h+='</tr></thead><tbody>';
  effects.forEach(function(e,i){
    var sc=e.sig?'var(--ok)':'var(--ink-muted)';
    h+='<tr class="'+(i%2?'':'alt')+'">';
    h+='<td class="td-label" style="font-weight:700;color:'+(e.source.indexOf('×')>=0?'var(--warn)':'var(--ink)')+'">'+e.source+'</td>';
    ['SS','df','MS','F'].forEach(function(k){h+='<td class="td-num" style="font-family:var(--font-mono-stack)">'+e[k]+'</td>';});
    h+='<td class="td-num"><span style="font-weight:700;color:'+sc+'">'+e.p_fmt+'</span>'+(e.sig?' <span style="font-size:10px;color:var(--ok)">*</span>':'')+'</td>';
    h+='<td class="td-num" style="font-family:var(--font-mono-stack)">'+e.eta2+'</td>';
    h+='<td class="td-num" style="font-family:var(--font-mono-stack)">'+e.pEta2+'</td>';
    h+='</tr>';
  });
  // Error row
  h+='<tr style="background:var(--surface-alt)"><td class="td-label" style="color:var(--ink-muted)">Error</td>';
  h+='<td class="td-num" style="font-family:var(--font-mono-stack)">'+error.SS+'</td><td class="td-num">'+error.df+'</td><td class="td-num" style="font-family:var(--font-mono-stack)">'+error.MS+'</td><td colspan="4" style="text-align:right;color:var(--ink-subtle)">—</td></tr>';
  // Total row
  if(total){
    h+='<tr style="background:var(--surface-alt)"><td class="td-label" style="color:var(--ink-muted);font-weight:700">Total</td>';
    h+='<td class="td-num" style="font-family:var(--font-mono-stack)">'+total.SS+'</td><td class="td-num">'+total.df+'</td><td colspan="5" style="text-align:right;color:var(--ink-subtle)">—</td></tr>';
  }
  h+='</tbody></table></div>';
  return h;
}

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

// o.type==='ttest'
function renderOutBasic_ttest(o){
  var html='';
      html+=mkTable(['','Group A ('+o.ga+')','Group B ('+o.gb+')'],
        [['N',o.res.nA,o.res.nB],['Mean',o.res.meanA,o.res.meanB],['SD',o.res.sdA,o.res.sdB]]);
      html+='<div class="stats-grid" style="margin:10px 0">'+stCard('t',o.res.t,'df='+o.res.df)+stCard('p-value',o.res.p_fmt)+stCard("Cohen's d",o.res.cohensD,o.res.dInterp)+stCard('95% CI',o.res.ci95)+'</div>';
      if(o.res.cohensD_ci&&o.res.cohensD_ci!=='[—, —]') html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-bottom:8px">Cohen\'s d 95% CI: <span style="color:var(--ink);font-weight:600">'+o.res.cohensD_ci+'</span></div>';
      html+='<div class="row" style="margin-bottom:10px">'+sigBadge(o.res.p)+'</div>';
      if(o.swA||o.swB||o.res.warnings?.length){
        html+='<div class="assumption-box" style="margin-bottom:10px">';
        html+='<div style="font-size:10.5px;font-weight:700;color:var(--warn);margin-bottom:5px;text-transform:uppercase;letter-spacing:.7px">Assumptions</div>';
        if(o.res.warnings) o.res.warnings.forEach(w=>{
          const col=w.level==='error'?'var(--err)':'var(--warn)';
          html+='<div style="font-size:11.5px;color:'+col+';margin-bottom:3px">'+(w.level==='error'?'✗':'⚠')+' '+w.msg+'</div>';
        });
        if(o.swA) html+='<div style="font-size:11.5px;color:var(--ink-muted)">SW ('+o.ga+'): W='+o.swA.W+' p='+o.swA.p+' → '+(parseFloat(o.swA.p)>.05?'<span style="color:var(--ok);font-weight:600">Normal</span>':'<span style="color:var(--err);font-weight:600">Non-normal</span>')+'</div>';
        if(o.swB) html+='<div style="font-size:11.5px;color:var(--ink-muted)">SW ('+o.gb+'): W='+o.swB.W+' p='+o.swB.p+' → '+(parseFloat(o.swB.p)>.05?'<span style="color:var(--ok);font-weight:600">Normal</span>':'<span style="color:var(--err);font-weight:600">Non-normal</span>')+'</div>';
        if(o.lev) html+='<div style="font-size:11.5px;color:var(--ink-muted)">Levene: F='+o.lev.F+' p='+o.lev.p_fmt+(parseFloat(o.lev.p)<.05?' → <span style="color:var(--warn);font-weight:600">Unequal variance</span>':' → Equal variance')+'</div>';
        html+='</div>';
      }
      html+=svgBoxplot(data,o.depV,o.grpV);
  return html;
}

// o.type==='paired'
function renderOutBasic_paired(o){
  var html='';
      html+=mkTable(['','Value'],[['N',o.res.n],['Mean Diff',o.res.meanDiff],['SD Diff',o.res.sdDiff],['t',o.res.t],['df',o.res.df],['p',o.res.p_fmt],["Cohen's dz",o.res.cohensD+' ('+o.res.dInterp+')'],['95% CI',o.res.ci95]]);
      html+='<div class="row" style="margin:10px 0">'+sigBadge(o.res.p)+'</div>';
      html+=svgScatter(data,o.varA,o.varB);
  return html;
}

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

// o.type==='onesamp'
function renderOutBasic_onesamp(o){
  var html='';
      // Summary table
      html+=mkTable(['Parameter','Value'],[
        ['Variable',o.field],
        ['Test Value (μ₀)',SE.f4(o.mu0)],
        ['N',o.res.n],
        ['Sample Mean (x̄)',o.res.mean],
        ['Std Deviation',o.res.sd],
        ['Std Error',o.res.se],
        ['Mean Difference (x̄ − μ₀)',o.res.meanDiff],
        ['95% CI of Difference',o.res.ciDiff],
        ['95% CI of Mean',o.res.ci95],
        ['t-statistic',o.res.t],
        ['df',o.res.df],
        ['p-value (two-tailed)',o.res.p_fmt],
        ["Cohen's d",o.res.cohensD+' ('+o.res.dInterp+')'],
      ]);
      html+='<div class="stats-grid" style="margin:10px 0">';
      html+=stCard('t',o.res.t,'df='+o.res.df);
      html+=stCard('p-value',o.res.p_fmt);
      html+=stCard("Cohen's d",o.res.cohensD,o.res.dInterp);
      html+=stCard('Mean Diff',o.res.meanDiff,'CI: '+o.res.ciDiff);
      html+='</div>';
      html+='<div class="row" style="margin-bottom:10px">'+sigBadge(o.res.p);
      html+='<span class="tag tag-blue" style="font-size:10.5px">'+o.res.conclusion+'</span></div>';
      // Shapiro-Wilk normality
      if(o.sw){
        html+='<div class="assumption-box" style="margin-bottom:10px">';
        html+='<div style="font-size:10.5px;font-weight:700;color:var(--warn);margin-bottom:5px;text-transform:uppercase;letter-spacing:.7px">Normality Assumption (Shapiro-Wilk)</div>';
        const swOk=parseFloat(o.sw.p)>.05;
        html+='<div style="font-size:11.5px;color:var(--ink-muted)">W = '+o.sw.W+' &nbsp; p = '+o.sw.p+' → ';
        html+='<span style="font-weight:600;color:'+(swOk?'var(--ok)':'var(--err)')+'">'+(swOk?'✓ Normal distribution':'✗ Non-normal — consider Wilcoxon Signed-Rank test')+'</span></div>';
        html+='</div>';
      }
      // Chart
      html+=svgHistogram(data,o.field);
  return html;
}

// o.type==='anova'
function renderOutBasic_anova(o){
  var html='';
      html+=mkTable(['Source','df','SS','MS','F','p','η²'],[['Between',o.res.dfB,o.res.ssB,o.res.msB,o.res.F,o.res.p_fmt,o.res.eta2],['Within',o.res.dfW,o.res.ssW,o.res.msW,'','','']]);
      html+='<div class="row" style="margin:10px 0">'+sigBadge(o.res.p)+'<span class="tag tag-gray">η²='+o.res.eta2+' ('+o.res.eta2Interp+')</span></div>';
      if(o.res.eta2_ci) html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-bottom:8px">η² 95% CI: <span style="color:var(--ink);font-weight:600">'+o.res.eta2_ci+'</span></div>';
      html+=mkTable(['Group','N','Mean','SD'],o.res.groupStats.map(g=>[g.label,g.n,g.mean,g.sd]));
      if(o.posthoc){
        var phName={'tukey':'Tukey HSD','bonferroni':'Bonferroni','lsd':'LSD (Fisher)','holm':'Holm-Bonferroni'}[o.posthocMethod]||'Post-hoc';
        var phNote={'tukey':'q-statistic, studentized range distribution',
          'bonferroni':'p adjusted × number of comparisons ('+o.posthoc.length+')',
          'lsd':'Unadjusted — liberal test, no familywise correction',
          'holm':'Step-down Bonferroni — p adjusted sequentially, more powerful than plain Bonferroni'}[o.posthocMethod]||'';
        html+='<div style="font-weight:700;color:var(--ink);font-size:12.5px;margin:10px 0 3px">'+phName+' Post-hoc</div>';
        if(phNote)html+='<div style="font-size:11px;color:var(--ink-subtle);margin-bottom:6px">'+phNote+'</div>';
        if(o.posthocMethod==='tukey'){
          html+=mkTable(['Pair','Diff','q','p','Sig'],o.posthoc.map(ph=>[ph.a+' vs '+ph.b,ph.diff,ph.q,ph.p,ph.sig?'*':'ns']));
        } else if(o.posthocMethod==='bonferroni'){
          html+=mkTable(['Pair','Diff','SE','t','p (adj)','Sig'],o.posthoc.map(ph=>[ph.a+' vs '+ph.b,ph.diff,ph.se,ph.t,ph.p_fmt,ph.sig?'*':'ns']));
        } else {
          html+=mkTable(['Pair','Diff','SE','t','p','Sig'],o.posthoc.map(ph=>[ph.a+' vs '+ph.b,ph.diff,ph.se,ph.t,ph.p_fmt,ph.sig?'*':'ns']));
        }
      }
      html+='<div style="margin-top:10px">'+svgBoxplot(data,o.depV,o.grpV)+'</div>';
  return html;
}

// o.type==='anova2'
function renderOutBasic_anova2(o){
  var html='';
      const r=o.res;
      html+='<div class="notice-box" style="margin-bottom:10px">';
      html+='<b style="color:var(--ink)">Factorial Design:</b> '+r.depVar+' ~ '+r.factorA+' × '+r.factorB;
      html+=' &nbsp;|&nbsp; N='+r.n+' &nbsp;|&nbsp; Grand Mean='+r.grandMean;
      html+=' &nbsp;|&nbsp; Levels: A('+r.levA.length+') × B('+r.levB.length+')</div>';
      html+=renderAnovaTable(r.effects, r.error, r.total);
      // Sparse cell warnings
      if(r.sparseWarnings && r.sparseWarnings.length){
        r.sparseWarnings.forEach(function(w){
          html+='<div class="notice-box notice-warn" style="margin:7px 0">';
          html+='<span style="color:var(--warn);font-weight:700">'+w.icon+' '+w.msg+'</span>';
          if(w.cells && w.cells.length && w.cells.length<=12){
            html+='<div style="margin-top:4px;color:var(--ink-muted);font-family:var(--font-mono-stack);font-size:10.5px">Cells: '+w.cells.join(', ')+'</div>';
          }
          html+='</div>';
        });
      }
      html+='<div class="row" style="margin:8px 0;gap:5px;flex-wrap:wrap">';
      r.effects.forEach(function(e){
        html+='<span class="tag '+(e.sig?'tag-green':'tag-gray')+'" style="font-size:10.5px">'+e.source+': p='+e.p_fmt+(e.sig?' *':'')+'</span>';
      });
      html+='</div>';
      // Marginal means
      html+='<div class="grid2" style="margin-top:12px;gap:10px">';
      html+='<div><div style="font-size:11.5px;font-weight:700;color:var(--ink);margin-bottom:6px">Marginal Means — '+r.factorA+'</div>';
      html+=mkTable(['Level','Mean','N'],r.meanA.map(function(m){return[m.level,m.mean,m.n];}));
      html+='</div><div><div style="font-size:11.5px;font-weight:700;color:var(--ok);margin-bottom:6px">Marginal Means — '+r.factorB+'</div>';
      html+=mkTable(['Level','Mean','N'],r.meanB.map(function(m){return[m.level,m.mean,m.n];}));
      html+='</div></div>';
      // Interaction plot
      html+='<div style="margin-top:14px"><div style="font-size:11.5px;font-weight:700;color:var(--ink);margin-bottom:6px">Interaction Plot: '+r.factorA+' × '+r.factorB+'</div>';
      html+=svgInteractionPlot(r.cellMeansTable, r.factorB, r.factorA, r.depVar);
      html+='<div style="font-size:11px;color:var(--ink-subtle);margin-top:4px">Non-parallel lines suggest a significant interaction. Hover dots for cell means.</div>';
      html+='</div>';
  return html;
}

// o.type==='anova3'
function renderOutBasic_anova3(o){
  var html='';
      const r=o.res;
      var T=typeof ossChartTheme==='function'?ossChartTheme():{series:['#0D0D0D','#4F7A99','#D4A72C']};
      html+='<div class="notice-box" style="margin-bottom:10px">';
      html+='<b style="color:var(--ink)">Three-Way Factorial:</b> '+r.depVar+' ~ '+r.factorA+' × '+r.factorB+' × '+r.factorC;
      html+=' &nbsp;|&nbsp; N='+r.n+' &nbsp;|&nbsp; Grand Mean='+r.grandMean;
      html+=' &nbsp;|&nbsp; Levels: A('+r.levA.length+') × B('+r.levB.length+') × C('+r.levC.length+')</div>';
      html+=renderAnovaTable(r.effects, r.error, r.total);
      html+='<div class="row" style="margin:8px 0;gap:5px;flex-wrap:wrap">';
      r.effects.forEach(function(e){
        html+='<span class="tag '+(e.sig?'tag-green':'tag-gray')+'" style="font-size:10.5px">'+e.source+': p='+e.p_fmt+(e.sig?' *':'')+'</span>';
      });
      html+='</div>';
      // Marginal means A B C
      html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-top:12px">';
      ['A','B','C'].forEach(function(label,idx){
        var mArr=[r.meanA,r.meanB,r.meanC][idx];
        var fName=[r.factorA,r.factorB,r.factorC][idx];
        var col=T.series[idx%T.series.length]||'var(--ink)';
        html+='<div><div style="font-size:11.5px;font-weight:700;color:'+col+';margin-bottom:6px">'+fName+'</div>';
        html+=mkTable(['Level','Mean','N'],mArr.map(function(m){return[m.level,m.mean,m.n];}));
        html+='</div>';
      });
      html+='</div>';
      // A×B interaction plot
      html+='<div style="margin-top:14px"><div style="font-size:11.5px;font-weight:700;color:var(--ink);margin-bottom:6px">A×B Interaction Plot (averaged over C)</div>';
      html+=svgInteractionPlot(r.cellMeansAB, r.factorB, r.factorA, r.depVar);
      html+='</div>';
  return html;
}

// o.type==='correlation'
function renderOutBasic_correlation(o){
  var html='';
      html+='<div class="stats-grid" style="margin-bottom:10px">'+stCard('r',o.res.r)+stCard('r²',o.res.r2,'Variance explained')+stCard('p',o.res.p_fmt)+stCard('95% CI',o.res.ci95)+'</div>';
      html+='<div class="row" style="margin-bottom:10px">'+sigBadge(o.res.p)+'<span class="tag tag-gray">'+o.res.strength+' '+o.res.direction+'</span></div>';
      html+=svgScatter(data,o.crX,o.crY);
  return html;
}

// o.type==='partialCorr'
function renderOutBasic_partialCorr(o){
  var html='';
      html+='<div class="notice-box" style="margin-bottom:8px">Correlation between <b style="color:var(--ink)">'+escHtml(o.pcX)+'</b> and <b style="color:var(--ink)">'+escHtml(o.pcY)+'</b> controlling for <b style="color:var(--ink)">'+escHtml(o.pcZ)+'</b></div>';
      html+='<div class="stats-grid" style="margin-bottom:10px">'+stCard('Partial r',o.res.rp)+stCard('r²',o.res.r2,'Variance explained')+stCard('p',o.res.p_fmt)+stCard('95% CI',o.res.ci95)+'</div>';
      html+='<div class="row" style="margin-bottom:10px">'+sigBadge(o.res.p)+'<span class="tag tag-gray">'+o.res.strength+' '+(parseFloat(o.res.rp)>=0?'positive':'negative')+'</span></div>';
      html+=mkTable(['','r','Note'],[
        [escHtml(o.pcX)+' × '+escHtml(o.pcY)+' (zero-order)',o.res.rxy,'Before controlling for '+escHtml(o.pcZ)],
        [escHtml(o.pcX)+' × '+escHtml(o.pcY)+' (partial)',o.res.rp,'After controlling for '+escHtml(o.pcZ)],
        [escHtml(o.pcX)+' × '+escHtml(o.pcZ),o.res.rxz,'Control correlation'],
        [escHtml(o.pcY)+' × '+escHtml(o.pcZ),o.res.ryz,'Control correlation'],
      ]);
      html+='<div class="notice-box" style="margin-top:9px">n='+o.res.n+' &nbsp;|&nbsp; df='+o.res.df+' &nbsp;|&nbsp; t='+o.res.t+'</div>';
      html+=svgScatter(data,o.pcX,o.pcY);
  return html;
}

// o.type==='canonicalCorr'
function renderOutBasic_canonicalCorr(o){
  var html='';
      var r=o.res;
      html+='<div class="notice-box" style="margin-bottom:10px">'
        +'<b style="color:var(--ink)">Set X:</b> '+o.xNames.map(function(n){return escHtml(n);}).join(', ')
        +' &nbsp;|&nbsp; <b style="color:var(--ink)">Set Y:</b> '+o.yNames.map(function(n){return escHtml(n);}).join(', ')
        +' &nbsp;|&nbsp; <b style="color:var(--ink)">n='+r.n+' ('+r.nRoots+' functions)</b></div>';
      // Canonical roots summary cards
      html+='<div class="stats-grid" style="margin-bottom:12px">';
      r.tests.forEach(function(t){
        html+=stCard('Rc'+t.root+' = '+t.rc, 'Rc²='+t.rc2, (t.sig?'✓ p='+t.p_fmt:'ns (p='+t.p_fmt+')'));
      });
      html+='</div>';
      // Significance test table (Wilks' Lambda)
      html+='<div style="font-size:11px;font-weight:700;color:var(--ink-muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:.6px">Uji Signifikansi — Wilks\' Lambda</div>';
      html+=mkTable(
        ['Fungsi','Rc','Rc²','Wilks\' λ','χ²','df','p','Sig'],
        r.tests.map(function(t){return[
          t.root, t.rc, t.rc2, t.wilks, t.chiSq, t.df, t.p_fmt, t.sig?'*':'ns'
        ];})
      );
      // Structure coefficients X
      html+='<div style="font-size:11px;font-weight:700;color:var(--ink);margin:12px 0 6px;text-transform:uppercase;letter-spacing:.6px">Struktur Koefisien — Set X</div>';
      var xCols=['Variabel'].concat(r.tests.map(function(t){return'Fungsi '+t.root;}));
      html+=mkTable(xCols, r.xLoadings.map(function(v){return[escHtml(v.name)].concat(v.loadings);}));
      // Structure coefficients Y
      html+='<div style="font-size:11px;font-weight:700;color:var(--ink);margin:12px 0 6px;text-transform:uppercase;letter-spacing:.6px">Struktur Koefisien — Set Y</div>';
      var yCols=['Variabel'].concat(r.tests.map(function(t){return'Fungsi '+t.root;}));
      html+=mkTable(yCols, r.yLoadings.map(function(v){return[escHtml(v.name)].concat(v.loadings);}));
      html+='<div class="assump" style="margin-top:10px">'
        +'<b style="color:var(--ink)">Interpretasi:</b> Hanya fungsi dengan p &lt; .05 yang diinterpretasi. '
        +'Struktur koefisien ≥ |.30| dianggap meaningful loading. '
        +'Rc² menunjukkan proporsi varians yang dipakai bersama antara dua set variate kanonik.</div>';
  return html;
}

// o.type==='regression'
function renderOutBasic_regression(o){
  var html='';
      html+=mkTable(['','B','SE','t','p','Sig'],[['Constant',o.res.b0,o.res.SEb0,o.res.tb0,o.res.pb0_fmt,parseFloat(o.res.pb0)<.05?'*':'ns'],['Slope (b₁)',o.res.b1,o.res.SEb1,o.res.tb1,o.res.pb1_fmt,parseFloat(o.res.pb1)<.05?'*':'ns']]);
      html+='<div class="stats-grid" style="margin:10px 0">'+stCard('R²',o.res.R2)+stCard('Adj R²',o.res.R2adj)+stCard('F',o.res.F,'p='+o.res.pF_fmt)+stCard('RMSE',o.res.RMSE)+'</div>';
      html+='<div class="eq">Ŷ = '+o.res.b0+' + '+o.res.b1+'·'+escHtml(o.xF)+'</div>';
      html+='<div class="chart-stack">'+svgScatter(data,o.xF,o.yF)+svgResidual(o.res)+'</div>';
  return html;
}

// o.type==='multipleReg'
function renderOutBasic_multipleReg(o){
  var html='';
      // Assumption warnings first
      if(o.res.warnings&&o.res.warnings.length){
        html+='<div class="assumption-box" style="margin-bottom:12px">';
        html+='<div style="font-size:10.5px;font-weight:700;color:var(--warn);margin-bottom:6px;text-transform:uppercase;letter-spacing:.7px">Assumption Checks</div>';
        o.res.warnings.forEach(w=>{
          const col=w.level==='error'?'var(--err)':w.level==='info'?'var(--line)':'var(--warn)';
          const ic=w.level==='error'?'✗':w.level==='info'?'ℹ':'⚠';
          html+='<div style="display:flex;gap:7px;align-items:flex-start;margin-bottom:5px"><span style="color:'+col+';flex-shrink:0">'+ic+'</span><span style="font-size:11.5px;color:var(--ink-muted)">'+escHtml(w.msg)+'</span></div>';
        });
        html+='</div>';
      }
      html+=mkTable(['Source','df','SS','F','p'],[['Regression',o.res.dfReg,o.res.SSR,o.res.F,o.res.pF_fmt],['Residual',o.res.dfRes,o.res.SSE,'',''],['Total',o.res.dfReg+o.res.dfRes,o.res.SST,'','']]);
      html+='<div class="stats-grid" style="margin:10px 0">'+stCard('R²',o.res.R2)+stCard('Adj R²',o.res.R2adj)+stCard('RMSE',o.res.RMSE)+stCard('DW',o.res.DW,'Ideal: 1.5–2.5')+'</div>';
      html+='<div class="row" style="margin-bottom:10px">'+sigBadge(o.res.pF)+'</div>';
      // Toggle: OLS vs HC3 robust
      const hasBP=o.res.bpSig;
      html+='<div style="display:flex;gap:6px;margin-bottom:8px;align-items:center;flex-wrap:wrap">';
      html+='<button onclick="toggleCoefView(this,\'ols\')" class="dt-btn coef-tab active-coef">OLS SE</button>';
      html+='<button onclick="toggleCoefView(this,\'hc3\')" class="dt-btn coef-tab">HC3 Robust SE'+(hasBP?' ⚠':'')+'</button>';
      if(hasBP) html+='<span style="font-size:11px;color:var(--warn);font-weight:600">Heteroscedasticity detected — HC3 recommended</span>';
      html+='</div>';
      // OLS table
      html+='<div id="coef-ols">';
      html+=mkTable(['Variable','B','SE','β','t','p','VIF'],o.res.coefs.map((c,i)=>{
        const vif=i===0?'—':o.res.vif[i-1];
        const vifCol=i>0&&parseFloat(vif)>10?'color:var(--err)':i>0&&parseFloat(vif)>5?'color:var(--warn)':'';
        const pSig=parseFloat(c.p_fmt)<0.05;
        return[escHtml(c.name),c.B,c.SE,i===0?'—':c.beta,c.t,
          (pSig?'<b style="color:var(--ok)">':'')+c.p_fmt+(pSig?'</b>':''),
          vifCol?'<span style="'+vifCol+';font-weight:600">'+vif+'</span>':vif];
      }));
      html+='</div>';
      // HC3 table (hidden by default)
      html+='<div id="coef-hc3" style="display:none">';
      html+=mkTable(['Variable','B','HC3-SE','β','HC3-t','HC3-p','VIF'],o.res.coefs.map((c,i)=>{
        const vif=i===0?'—':o.res.vif[i-1];
        const vifCol=i>0&&parseFloat(vif)>10?'color:var(--err)':i>0&&parseFloat(vif)>5?'color:var(--warn)':'';
        const hcSE=c.SE_HC3||c.SE; const hcT=c.t_HC3||c.t; const hcP=c.p_HC3_fmt||c.p_fmt;
        const pSig=c.sig_HC3!==undefined?c.sig_HC3:parseFloat(hcP)<0.05;
        return[escHtml(c.name),c.B,hcSE,i===0?'—':c.beta,hcT,
          (pSig?'<b style="color:var(--ok)">':'')+hcP+(pSig?'</b>':''),
          vifCol?'<span style="'+vifCol+';font-weight:600">'+vif+'</span>':vif];
      }));
      html+='<div style="font-size:11px;color:var(--ink-subtle);margin-top:5px">HC3 = heteroscedasticity-consistent covariance (Long & Ervin 2000). Use when BP test is significant.</div>';
      html+='</div>';
      html+='<div class="eq">'+escHtml(o.yName)+' = '+o.res.coefs.map(c=>c.name==='(Constant)'?c.B:c.B+'·'+escHtml(c.name)).join(' + ')+'</div>';
      // Cook's D summary
      if(o.res.highCooks>0||o.res.highLeverage>0){
        html+='<div class="notice-box" style="margin-top:10px">';
        html+='<div style="font-size:10.5px;color:var(--ink-muted);font-weight:700;text-transform:uppercase;letter-spacing:.7px;margin-bottom:5px">Influence Diagnostics</div>';
        html+='<div style="font-size:11.5px;color:var(--ink-muted)">Cook D max: <b style="color:var(--ink)">'+o.res.cooksMax+'</b> (threshold: '+parseFloat(4/data.length).toFixed(3)+')</div>';
        if(o.res.highCooks>0) html+='<div style="font-size:11.5px;color:var(--warn)">'+o.res.highCooks+' potentially influential observation(s)</div>';
        if(o.res.highLeverage>0) html+='<div style="font-size:11.5px;color:var(--line)">'+o.res.highLeverage+' high-leverage point(s)</div>';
        html+='</div>';
      }
  return html;
}

// o.type==='hierarchicalReg'&&o.res
function renderOutBasic_hierarchicalReg(o){
  var html='';
      var hrRes=o.res;
      var T=typeof ossChartTheme==='function'?ossChartTheme():{series:['#4F7A99','#D4A72C','#2F7048','#A8530E','#A93226']};
      html+='<p style="font-size:12px;color:var(--ink-muted);margin-bottom:12px"><b style="color:var(--ink)">Dependent Variable:</b> '+escHtml(hrRes.depVar)+'</p>';
      // Model Summary Table
      html+='<div class="sec-hd" style="margin-bottom:8px">Model Summary & ΔR²</div>';
      html+='<div class="tbl-wrap">';
      html+=mkTable(
        ['Block','Predictors','R²','Adj R²','ΔR²','F-change','df1','df2','p (ΔR²)'],
        (hrRes.blocks||[]).map(function(b){
          var bCol=T.series[(b.block-1)%T.series.length];
          var pSig=parseFloat(b.pFchange)<0.05;
          return[
            '<b style="color:'+bCol+'">Block '+b.block+'</b>',
            '<span style="color:var(--ink-muted);font-size:11px">'+b.predictors.map(escHtml).join(', ')+'</span>',
            '<b>'+b.R2+'</b>',
            b.R2adj,
            '<b style="color:var(--gold-text)">'+b.dR2+'</b>',
            b.Fchange,
            b.dfNum,
            b.dfDen,
            (pSig?'<b style="color:var(--ok)">':'<span style="color:var(--ink-muted)">')+b.pFchange+(pSig?'</b>':'</span>')
          ];
        })
      );
      html+='</div>';
      // ΔR² visual bar
      html+='<div style="margin:12px 0">';
      var maxR2=hrRes.blocks.length?parseFloat(hrRes.blocks[hrRes.blocks.length-1].R2):0;
      html+='<div style="font-size:11px;color:var(--ink-muted);margin-bottom:6px">R² Accumulation per Block</div>';
      var prevAccum=0;
      (hrRes.blocks||[]).forEach(function(b,bi){
        var dR2Num=parseFloat(b.dR2);
        var pct=maxR2>0?(dR2Num/maxR2)*100:0;
        var bCol=T.series[bi%T.series.length];
        html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">';
        html+='<span style="font-size:11px;font-weight:600;color:'+bCol+';width:54px;flex-shrink:0">Block '+b.block+'</span>';
        html+='<div style="flex:1;height:14px;background:var(--surface-alt);border:1px solid var(--line-soft);border-radius:var(--r-sm);overflow:hidden">';
        html+='<div style="margin-left:'+(maxR2>0?(prevAccum/maxR2*100).toFixed(1):'0')+'%;width:'+pct.toFixed(1)+'%;height:100%;background:'+bCol+';transition:width .35s"></div></div>';
        html+='<span style="font-size:11px;font-family:var(--font-mono-stack);font-variant-numeric:tabular-nums;color:var(--ink);width:68px;text-align:right">ΔR²='+b.dR2+'</span>';
        html+='</div>';
        prevAccum+=dR2Num;
      });
      html+='</div>';
      // Coefficient tables per block
      (hrRes.blocks||[]).forEach(function(b,bi){
        var bCol=T.series[bi%T.series.length];
        html+='<div style="margin-top:14px">';
        html+='<div class="sec-hd" style="margin-bottom:7px;color:'+bCol+'">Block '+b.block+' Coefficients <span style="font-size:10.5px;font-weight:400;color:var(--ink-subtle);font-style:normal">(cumulative predictors: '+b.cumulativePredictors.map(escHtml).join(', ')+')</span></div>';
        html+=mkTable(['Variable','B','SE','β','t','p','VIF'],
          (b.coefs||[]).map(function(c,ci){
            var vif=ci===0?'—':(b.vif?b.vif[ci-1]:'—');
            var pSig=parseFloat(c.p_fmt)<0.05;
            return[escHtml(c.name),c.B,c.SE,ci===0?'—':c.beta,c.t,
              (pSig?'<b style="color:var(--ok)">':'')+c.p_fmt+(pSig?'</b>':''),
              vif];
          }));
        html+='</div>';
      });
  return html;
}

// o.type==='logistic'
function renderOutBasic_logistic(o){
  var html='';
      var r=o.res,lgType=o.lgType||'binary';
      html+='<div class="stats-grid" style="margin-bottom:10px">';
      html+=stCard('N',r.n,'valid cases');
      html+=stCard('−2LL',r.m2ll,'Log-likelihood');
      html+=stCard("Cox & Snell R²",r.coxSnell,'Pseudo-R²');
      html+=stCard("Nagelkerke R²",r.nagelkerke,'Pseudo-R²');
      html+='</div>';
      html+='<div class="row" style="margin-bottom:10px">';
      html+='<span class="tag '+(r.chiSqP_fmt!=='n.s.'&&r.chiSqP_fmt!==''?'tag-green':'tag-yellow')+'">χ²('+r.chiSqDf+')='+r.chiSq+', p='+r.chiSqP_fmt+'</span>';
      if(lgType==='binary') html+='<span class="tag tag-blue">Accuracy: '+r.accuracy+'%</span>';
      if(lgType==='binary') html+='<span class="tag '+(parseFloat(r.auc)>=0.8?'tag-green':parseFloat(r.auc)>=0.7?'tag-blue':'tag-yellow')+'">AUC='+r.auc+'</span>';
      html+='</div>';
      if(lgType==='binary'){
        html+=mkTable(['Variable','B','SE','Wald','p','OR','95% CI OR'],
          r.coefs.map(function(c){
            var sig=c.p_fmt!=='—'&&(c.p_fmt==='<.001'||parseFloat(c.p_fmt)<0.05);
            return[escHtml(c.name),c.B,c.SE,c.wald,(sig?'<b style="color:var(--ok)">':'')+c.p_fmt+(sig?'</b>':''),c.OR,c.ci_or];
          })
        );
        // Confusion matrix
        html+='<div class="sec-hd" style="margin-top:14px;margin-bottom:6px">Confusion Matrix</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th>Actual \\ Predicted</th><th style="text-align:right">Pred. "'+escHtml(r.cats[0])+'"</th><th style="text-align:right">Pred. "'+escHtml(r.cats[1])+'"</th><th style="text-align:right">% Correct</th></tr></thead><tbody>';
        html+='<tr><td class="td-label">Act. "'+escHtml(r.cats[0])+'"</td><td class="td-num">'+r.cm[0][0]+'</td><td class="td-num">'+r.cm[0][1]+'</td><td class="td-num">'+SE.f1(r.cm[0][0]/(r.cm[0][0]+r.cm[0][1]+0.001)*100)+'%</td></tr>';
        html+='<tr><td class="td-label">Act. "'+escHtml(r.cats[1])+'"</td><td class="td-num">'+r.cm[1][0]+'</td><td class="td-num">'+r.cm[1][1]+'</td><td class="td-num">'+SE.f1(r.cm[1][1]/(r.cm[1][0]+r.cm[1][1]+0.001)*100)+'%</td></tr>';
        html+='<tr><td class="td-label" style="color:var(--ink);font-weight:700">Total</td><td class="td-num"></td><td class="td-num"></td><td class="td-num" style="color:var(--ok);font-weight:700">'+r.accuracy+'%</td></tr>';
        html+='</tbody></table></div>';
      } else {
        r.categories.forEach(function(cat,ci){
          if(ci===0) return;
          html+='<div style="margin-top:12px;margin-bottom:6px;font-size:11.5px;color:var(--gold-text);font-weight:700">Category "'+escHtml(cat)+'" vs. Reference "'+escHtml(r.categories[0])+'"</div>';
          html+=mkTable(['Variable','B','SE','Wald','p','OR','95% CI OR'],
            r.coefs[ci-1].map(function(c){
              var sig=c.p_fmt!=='—'&&(c.p_fmt==='<.001'||parseFloat(c.p_fmt)<0.05);
              return[escHtml(c.name),c.B,c.SE,c.wald,(sig?'<b style="color:var(--ok)">':'')+c.p_fmt+(sig?'</b>':''),c.OR,c.ci_or];
            })
          );
        });
        html+='<div style="margin-top:8px;font-size:12px">Overall Accuracy: <b style="color:var(--ok)">'+r.accuracy+'%</b></div>';
      }
      html+='<div class="assump" style="margin-top:11px"><b style="color:var(--ink)">Interpretasi:</b><br><b>OR &gt; 1</b>: peningkatan odds; <b>OR &lt; 1</b>: penurunan odds; <b>Wald p &lt; .05</b>: prediktor signifikan.<br><b>Nagelkerke R²</b>: varian DV yang dijelaskan model; <b>AUC &gt; .8</b>: diskriminasi baik.</div>';
  return html;
}

// o.type==='mannwhitney'
function renderOutBasic_mannwhitney(o){
  var html='';
      html+=mkTable(['','A ('+o.ga+')','B ('+o.gb+')'],[['Median',o.res.medA,o.res.medB],['N',o.res.nA,o.res.nB]]);
      html+='<div class="stats-grid" style="margin:10px 0">'+stCard('U',o.res.U)+(o.res.z!=='—'?stCard('z',o.res.z):'')+stCard('p',o.res.p_fmt)+stCard('r_eff',o.res.r_eff)+'</div>';
      html+='<div class="row">'+sigBadge(o.res.p);
      if(o.res.method) html+='<span class="tag tag-gray" style="font-size:10px">'+(o.res.method==='exact'?'Exact p':'Asymptotic z')+'</span>';
      html+='</div>';
  return html;
}

// o.type==='kruskal'
function renderOutBasic_kruskal(o){
  var html='';
      html+=mkTable(['Group','N','Median','Mean'],o.res.groupStats.map(g=>[g.label,g.n,g.median,g.mean]));
      html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin:10px 0">'+stCard('H',o.res.H)+stCard('df',o.res.df)+stCard('p',o.res.p_fmt)+'</div>';
      html+='<div class="row">'+sigBadge(o.res.p)+'</div>';
  return html;
}

// o.type==='wilcoxon'
function renderOutBasic_wilcoxon(o){
  var html='';
      html+='<div class="stats-grid" style="margin-bottom:10px">'+stCard('W+',o.res.Wplus)+stCard('W−',o.res.Wminus)+(o.res.z!=='—'?stCard('z',o.res.z):'')+stCard('p',o.res.p_fmt)+'</div>';
      html+='<div class="row">'+sigBadge(o.res.p);
      if(o.res.method) html+='<span class="tag tag-gray" style="font-size:10px">'+(o.res.method==='exact'?'Exact p':'Asymptotic z')+'</span>';
      html+='</div>';
  return html;
}

// o.type==='glm'
function renderOutBasic_glm(o){
  var html='';
      if(o.res&&!o.res._err){
        html+='<div class="stats-grid" style="margin-bottom:11px">';
        html+=stCard('N',o.res.n)+stCard('R²',o.res.R2)+stCard('Adj R²',o.res.R2adj)+stCard('Grand Mean',o.res.grandMean);
        html+='</div>';
        html+=mkTable(['Source','df','SS','MS','F','p','η²','Partial η²'],
          o.res.effects.map(function(e){
            var ps=e.sig?'<b style="color:var(--ok)">'+e.p_fmt+'</b>':(e.p_fmt||'—');
            return[escHtml(e.source)+(e.isCov?' (cov)':''),e.df,e.SS||'—',e.MS||'—',e.F||'—',ps,e.eta2||'—',e.partialEta2||'—'];
          }).concat([['Error',o.res.dfError,o.res.ssError,o.res.msError,'','','','']]));
        // Factor means
        o.res.factors.forEach(function(fac){
          var levels=o.res.factorLevels[fac];
          var eff=o.res.effects.find(function(e){return e.source===fac;});
          if(!levels||!eff||!eff.groups) return;
          html+='<div style="margin-top:11px"><div class="sec-hd" style="font-size:11px">'+escHtml(fac)+' — Estimated Marginal Means</div>';
          html+=mkTable([fac,'N','Mean','SD'],levels.map(function(g){
            var gv=eff.groups[g];
            if(!gv) return[escHtml(g),'—','—','—'];
            return[escHtml(g),gv.length,SE.f4(SE.mean(gv)),gv.length>=2?SE.f4(SE.std(gv)):'N/A'];
          }));
          html+='</div>';
        });
      }
  return html;
}

// o.type==='poisson'||o.type==='negbin'
function renderOutBasic_poisson(o){
  var html='';
      var isNB2 = o.type==='negbin';
      var mColor = isNB2?'var(--warn)':'var(--ok)';
      var mLabel = isNB2?'Negative Binomial':'Poisson';
      var r2 = o.res;
      if(r2&&!r2._err){
        // Header stats
        html+='<div class="stats-grid" style="margin-bottom:11px">';
        html+=stCard('N',r2.n);
        html+=stCard('Log-Likelihood',r2.logLik);
        html+=stCard('McFadden R²',r2.mcFaddenR2);
        if(isNB2) html+=stCard('θ (dispersion)',r2.theta);
        else html+=stCard('Pearson Disp.',r2.dispersion);
        html+='</div>';
        // LR test badge
        html+='<div class="row" style="gap:6px;margin-bottom:11px;flex-wrap:wrap">';
        html+='<span class="tag tag-blue">LR χ²('+r2.lrDf+') = '+r2.lrChi2+'</span>';
        html+='<span class="tag tag-gray">p = '+r2.lrP+'</span>';
        html+=sigBadge(parseFloat(r2.lrP));
        if(!r2.converged) html+='<span class="tag tag-yellow">⚠ IRLS did not fully converge</span>';
        html+='</div>';
        // Coefficients table
        html+='<div class="sec-hd" style="margin-bottom:7px"><span style="color:'+mColor+'">'+escHtml(mLabel)+'</span> — Coefficients</div>';
        html+='<div class="tbl-wrap"><table><thead><tr>';
        ['Predictor','β','SE','z','p','IRR (e^β)','95% CI IRR'].forEach(function(h2,hi){html+='<th'+(hi>0?' style="text-align:right"':'')+'>'+h2+'</th>';});
        html+='</tr></thead><tbody>';
        r2.coefs.forEach(function(c){
          html+='<tr>';
          html+='<td class="td-label" style="font-weight:600;color:var(--ink)">'+escHtml(c.name)+'</td>';
          html+='<td class="td-num">'+c.b+'</td>';
          html+='<td class="td-num">'+c.se+'</td>';
          html+='<td class="td-num">'+c.z+'</td>';
          html+='<td class="td-num">'+(c.sig?'<b style="color:var(--ok)">'+c.p+'</b>':c.p)+'</td>';
          html+='<td class="td-num" style="color:var(--gold-text);font-weight:700">'+c.irr+'</td>';
          html+='<td class="td-num" style="font-size:11px;color:var(--ink-muted)">'+c.irrCI+'</td>';
          html+='</tr>';
        });
        html+='</tbody></table></div>';
        // Interpretation notes
        html+='<div class="assump" style="margin-top:11px">';
        html+='<b style="color:var(--ink)">Interpretasi IRR</b> — IRR = e^β: nilai &gt; 1 berarti rate meningkat, &lt; 1 berarti menurun, per 1 unit perubahan prediktor.<br>';
        if(!isNB2&&parseFloat(r2.dispersion)>2){
          html+='<span style="color:var(--warn)">⚠ Dispersion statistic = '+r2.dispersion+' (&gt; 2). Data kemungkinan overdispersed. Pertimbangkan <b>Negative Binomial Regression</b>.</span>';
        } else if(!isNB2){
          html+='<span style="color:var(--ok)">✓ Dispersion = '+r2.dispersion+' — Poisson assumption (mean ≈ variance) terpenuhi.</span>';
        } else {
          html+='Parameter dispersi θ = '+r2.theta+'. '+r2.thetaDesc+'.';
        }
        html+='</div>';
        // Warnings
        if(r2.warnings&&r2.warnings.length){
          html+='<div class="notice-box notice-warn" style="margin-top:8px;font-size:11.5px">';
          r2.warnings.forEach(function(w){html+='⚠ '+w+'<br>';});
          html+='</div>';
        }
      } else {
        html+='<div class="notice-box notice-err" style="font-size:12px">⚠ '+(r2&&r2._err?r2._err:'No result')+'</div>';
      }
  return html;
}

// o.type==='manova'
function renderOutBasic_manova(o){
  var html='';
      var r = o.res;
      if(!r){ html+='<div class="notice-box notice-err">No MANOVA result.</div>'; }
      else {
        // Header summary
        html+='<div class="notice-box" style="margin-bottom:11px;font-size:12px;color:var(--ink-muted)">';
        html+='<b style="color:var(--ink)">MANOVA</b> — ';
        html+='DVs: <b style="color:var(--ink)">'+r.depVars.map(function(d){return escHtml(d);}).join(', ')+'</b> &nbsp;|&nbsp; ';
        html+='Factor: <b style="color:var(--line)">'+escHtml(r.factor)+'</b> &nbsp;|&nbsp; ';
        html+='N='+r.n+', Groups='+r.g+', DVs='+r.p;
        html+='</div>';

        // Multivariate Tests table (Pillai, Wilks, Hotelling, Roy)
        html+='<div class="sec-hd" style="margin-bottom:7px">Multivariate Tests <span style="font-weight:400;font-size:10.5px;color:var(--ink-subtle)">(Effect: '+escHtml(r.factor)+')</span></div>';
        var mvRows = [
          ['Pillai\'s Trace',      r.pillai.stat,    r.pillai.F,    r.pillai.df1,    r.pillai.df2,    r.pillai.p_fmt,    r.pillai.sig],
          ['Wilks\' Lambda',       r.wilks.stat,     r.wilks.F,     r.wilks.df1,     r.wilks.df2,     r.wilks.p_fmt,     r.wilks.sig],
          ['Hotelling-Lawley',     r.hotelling.stat, r.hotelling.F, r.hotelling.df1, r.hotelling.df2, r.hotelling.p_fmt, r.hotelling.sig],
          ['Roy\'s Greatest Root', r.roy.stat,       r.roy.F,       r.roy.df1,       r.roy.df2,       r.roy.p_fmt,       r.roy.sig],
        ];
        html+='<div class="tbl-wrap" style="margin-bottom:11px"><table><thead><tr>';
        ['Test','Value','F','df1','df2','p',''].forEach(function(h2,hi){ html+='<th'+((hi>=1&&hi<=5)?' style="text-align:right"':'')+'>'+h2+'</th>'; });
        html+='</tr></thead><tbody>';
        mvRows.forEach(function(row){
          var sig = row[6];
          html+='<tr>';
          html+='<td class="td-label" style="font-weight:600">'+row[0]+'</td>';
          html+='<td class="td-num">'+row[1]+'</td>';
          html+='<td class="td-num">'+row[2]+'</td>';
          html+='<td class="td-num">'+row[3]+'</td>';
          html+='<td class="td-num">'+row[4]+'</td>';
          html+='<td class="td-num">'+(sig?'<b style="color:var(--ok)">':'')+row[5]+(sig?'</b>':'')+'</td>';
          html+='<td>'+(sig?'<span class="tag tag-green" style="font-size:9px">✓ Sig</span>':'<span style="font-size:10px;color:var(--ink-subtle)">ns</span>')+'</td>';
          html+='</tr>';
        });
        html+='</tbody></table></div>';

        // Effect size + eigenvalues
        html+='<div class="stats-grid" style="margin-bottom:11px">';
        html+=stCard('Partial η² (Pillai)', r.pillaiEta2, parseFloat(r.pillaiEta2)>=0.14?'Large':parseFloat(r.pillaiEta2)>=0.06?'Medium':'Small');
        html+=stCard('Eigenvalue λ₁', r.eigenvalues[0]||'—');
        html+=stCard('s (dimensions)', r.s);
        html+=stCard('Box\'s M p', r.boxP, r.boxSig?'⚠ Violation':'✓ OK');
        html+='</div>';

        // Box's M note
        if(r.boxSig){
          html+='<div class="notice-box notice-warn" style="margin-bottom:10px;font-size:11.5px">';
          html+='<b>⚠ Box\'s M significant (p='+r.boxP+')</b> — covariance matrices differ across groups. ';
          html+='Pillai\'s Trace is the most robust test to use when this assumption is violated.';
          html+='</div>';
        } else {
          html+='<div class="notice-box notice-ok" style="margin-bottom:10px;font-size:11.5px"><b>✓ Box\'s M</b> not significant (p='+r.boxP+') — homogeneity of covariance matrices assumption met.</div>';
        }

        // Group Means matrix
        html+='<div class="sec-hd" style="margin-bottom:7px">Group Means</div>';
        html+='<div class="tbl-wrap" style="margin-bottom:11px"><table><thead><tr><th>'+escHtml(r.factor)+'</th><th style="text-align:right">N</th>';
        r.depVars.forEach(function(dv){ html+='<th style="text-align:right">'+escHtml(dv)+'</th>'; });
        html+='</tr></thead><tbody>';
        r.groupMeans.forEach(function(gm){
          html+='<tr><td class="td-label">'+escHtml(gm.key)+'</td><td class="td-num">'+gm.n+'</td>';
          gm.means.forEach(function(m){ html+='<td class="td-num">'+m+'</td>'; });
          html+='</tr>';
        });
        // Grand means row
        html+='<tr style="border-top:1px solid var(--line-soft);color:var(--ink-muted)"><td class="td-label"><i>Grand Mean</i></td><td></td>';
        r.grandMeans.forEach(function(m){ html+='<td class="td-num"><i>'+m+'</i></td>'; });
        html+='</tr>';
        html+='</tbody></table></div>';

        // Univariate follow-up ANOVAs
        html+='<div class="sec-hd" style="margin-bottom:7px">Univariate Follow-up ANOVAs <span style="font-weight:400;font-size:10.5px;color:var(--ink-subtle)">(interpret with Bonferroni correction p &lt; '+SE.f4(0.05/r.p)+')</span></div>';
        if(r.univariate && r.univariate.length){
          r.univariate.forEach(function(item){
            var dv=item.dv, ures=item.res;
            html+='<div class="notice-box" style="margin-bottom:10px">';
            html+='<div style="font-size:11.5px;font-weight:700;color:var(--ink);margin-bottom:6px">ANOVA: '+escHtml(dv)+'</div>';
            if(ures&&!ures._err&&ures.effects){
              var tRows2 = ures.effects.map(function(e){
                var ps = e.sig?'<b style="color:var(--ok)">'+e.p_fmt+'</b>':(e.p_fmt||'—');
                return [escHtml(e.source), e.df, e.SS||'—', e.MS||'—', e.F||'—', ps, e.eta2||'—'];
              });
              tRows2.push(['Error', ures.dfError, ures.ssError, ures.msError, '', '', '']);
              html+=mkTable(['SOURCE','DF','SS','MS','F','p','η²'], tRows2);
              // Group means for this DV
              var eff = ures.effects&&ures.effects[0];
              if(eff&&eff.groups){
                html+='<div style="margin-top:8px">';
                html+=mkTable([r.factor,'N','Mean','SD'],
                  (ures.factorLevels&&ures.factorLevels[r.factor]||[]).map(function(gk){
                    var gv=eff.groups[gk];
                    if(!gv||!gv.length) return[escHtml(gk),'—','—','—'];
                    return[escHtml(gk), gv.length, SE.f4(SE.mean(gv)), gv.length>=2?SE.f4(SE.std(gv)):'N/A'];
                  })
                );
                html+='</div>';
              }
            } else {
              html+='<div style="color:var(--err);font-size:11.5px">'+(ures&&ures._err?ures._err:'Failed')+'</div>';
            }
            html+='</div>';
          });
        }

        // Interpretation note
        html+='<div class="assump" style="margin-top:4px;font-size:11.5px">';
        html+='<b style="color:var(--ink)">Recommendation:</b> ';
        html+='Use <b>Pillai\'s Trace</b> as the primary test statistic — it is the most robust, especially when n is small or covariance matrices are unequal. ';
        html+='Wilks\' Lambda is most powerful when assumptions are met. Roy\'s Greatest Root is an upper bound (liberal). ';
        html+='Follow significant multivariate tests with univariate ANOVAs above, applying Bonferroni correction (α/'+r.p+').';
        html+='</div>';
      }
  return html;
}
