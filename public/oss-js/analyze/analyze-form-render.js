// ANALYZE — FORM RENDERER
function renderDescriptiveForm(){
  const nF=numFields();
  let html='';
    const s=tryStats(()=>SE.descriptive(data.map(r=>r[aState.dFld])));
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Descriptive Statistics'+ossGuideBtn('descriptive')+'</div>';
    html+='<div class="row" style="margin-bottom:11px">'+mkSelect('d-fld',nF,aState.dFld,'aState.dFld=val;renderASub()','Variable')+'<button class="btn btn-primary btn-sm" onclick="runDesc()">▶ Run</button></div>';
    if(s&&!s._err&&!s.error){
      html+='<div class="stats-grid2">';
      [['N',s.n,''+s.missing+' miss'],['Mean',s.mean,s.ci95],['Median',s.median],['Mode',s.mode],
       ['Std Dev',s.std],['Variance',s.variance],['SEM',s.sem],
       ['Min',s.min],['Max',s.max],['Range',s.range],
       ['Q1',s.q1],['Q3',s.q3],['IQR',s.iqr],['Skewness',s.skewness],
       ['Kurtosis',s.kurtosis],['Shapiro-Wilk W',s.shapiroW,'p='+s.shapiroP],
       ['SW Normality',s.normality],
       ['K-S D (Lilliefors)',s.ksD,'p='+s.ksP],
       ['KS Normality',s.ksNormality],
       ['Outliers',s.outlierCount,s.outlierCount>0?s.outlierVals.join(', '):'none']
      ].forEach(([l,v,n])=>html+=stCard(l,v,n||''));
      html+='</div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Preview</div>';
    html+='<div class="sec-hd-sub" style="margin-top:0">Distribution + Q-Q Plot</div>';
    html+='<div class="chart-stack">'+svgHistogram(data,aState.dFld)+'<div class="sec-hd-sub" style="margin:2px 0">Normal Q-Q Plot</div>'+svgQQ(data,aState.dFld)+'</div>';
    html+='</div></div>';
  return html;
}

function renderTtestForm(){
  const nF=numFields(),aF=allFields();
  let html='';
    const grps=[...new Set(data.map(r=>r[aState.ttG]))].filter(v=>v!==null).slice(0,2);
    const prv=grps.length>=2?tryStats(()=>{
      const a=SE.validNums(data.filter(r=>r[aState.ttG]===grps[0]).map(r=>r[aState.ttV]));
      const b=SE.validNums(data.filter(r=>r[aState.ttG]===grps[1]).map(r=>r[aState.ttV]));
      return SE.tTest(a,b);
    }):null;
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Independent T-Test'+ossGuideBtn('ttest')+'</div>';
    html+=mkSelect('tt-v',nF,aState.ttV,'aState.ttV=val;renderASub()','Dependent Variable');
    html+='<div style="margin-top:8px">'+mkSelect('tt-g',aF,aState.ttG,'aState.ttG=val;renderASub()','Grouping Variable')+'</div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runTTest()">▶ Run</button>';
    if(prv&&!prv._err){
      html+='<div class="stats-grid2" style="margin-top:11px">'+stCard('Mean ('+grps[0]+')',prv.meanA,'SD='+prv.sdA+' n='+prv.nA)+stCard('Mean ('+grps[1]+')',prv.meanB,'SD='+prv.sdB+' n='+prv.nB)+stCard('t',prv.t,'df='+prv.df)+stCard("Cohen's d",prv.cohensD,prv.dInterp)+'</div>';
      html+='<div class="row" style="margin-top:8px">'+sigBadge(prv.p)+'</div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Preview</div><div class="sec-hd-sub" style="margin-top:0">Group Distributions</div>'+svgBoxplot(data,aState.ttV,aState.ttG)+'</div></div>';
  return html;
}

function renderOnesampForm(){
  const nF=numFields();
  let html='';
    const osVals=SE.validNums(data.map(r=>r[aState.osV]));
    const prv=osVals.length>=2?tryStats(()=>SE.oneSampleT(osVals,Number(aState.osMu0)||0)):null;
    const osMean=osVals.length?SE.f4(SE.mean(osVals)):'—';
    const osSd=osVals.length>=2?SE.f4(SE.std(osVals)):'—';
    html+='<div class="grid2">';
    html+='<div class="card">';
    html+='<div class="sec-hd">One-Sample T-Test'+ossGuideBtn('onesamp')+'</div>';
    html+=mkSelect('os-v',nF,aState.osV,'aState.osV=val;renderASub()','Test Variable');
    html+='<div style="margin-top:10px">';
    html+='<label class="lbl">Test Value (μ₀)</label>';
    html+='<input type="number" class="inp" id="os-mu0" value="'+(aState.osMu0||0)+'" step="any" placeholder="e.g. 70" oninput="aState.osMu0=parseFloat(this.value)||0;renderASub()" style="max-width:160px"/>';
    html+='</div>';
    if(osVals.length>=2){
      html+='<div class="stats-grid2" style="margin-top:11px">';
      html+=stCard('Sample Mean',osMean,'n='+osVals.length);
      html+=stCard('Std Dev',osSd);
      html+='</div>';
    }
    html+='<button class="btn btn-primary btn-sm" style="margin-top:11px" onclick="runOneSamp()">▶ Run</button>';
    if(prv&&!prv._err){
      html+='<div class="stats-grid2" style="margin-top:11px">';
      html+=stCard('Mean Diff',prv.meanDiff,'μ̄ − μ₀');
      html+=stCard('t-statistic',prv.t,'df='+prv.df);
      html+=stCard('p-value',prv.p_fmt);
      html+=stCard("Cohen's d",prv.cohensD,prv.dInterp);
      html+='</div>';
      html+='<div class="row" style="margin-top:8px">'+sigBadge(prv.p);
      html+='<span class="tag tag-blue">95% CI diff: '+prv.ciDiff+'</span></div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Preview</div>';
    html+='<div class="sec-hd-sub" style="margin-top:0">Distribution</div>';
    html+=svgHistogram(data,aState.osV);
    if(prv&&!prv._err&&aState.osV){
      html+='<div class="stats-grid" style="margin-top:10px">';
      html+=stCard('μ₀',SE.f4(aState.osMu0||0))+stCard('Mean',prv.mean)+stCard('Diff',prv.meanDiff)+stCard('p-value',prv.p_fmt);
      html+='</div>';
    }
    html+='</div></div>';
  return html;
}

function renderPairedForm(){
  const nF=numFields();
  let html='';
    const prv=tryStats(()=>SE.pairedTTest(SE.validNums(data.map(r=>r[aState.pairedA])),SE.validNums(data.map(r=>r[aState.pairedB]))));
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Paired Samples T-Test'+ossGuideBtn('paired')+'</div>';
    html+=mkSelect('pa-a',nF,aState.pairedA,'aState.pairedA=val;renderASub()','Variable A (Pre-test)');
    html+='<div style="margin-top:8px">'+mkSelect('pa-b',nF,aState.pairedB,'aState.pairedB=val;renderASub()','Variable B (Post-test)')+'</div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runPaired()">▶ Run</button>';
    if(prv&&!prv._err){
      html+='<div class="stats-grid2" style="margin-top:11px">'+stCard('Mean Diff',prv.meanDiff,prv.ci95)+stCard('SD Diff',prv.sdDiff)+stCard('t',prv.t,'df='+prv.df)+stCard("Cohen's dz",prv.cohensD,prv.dInterp)+'</div>';
      html+='<div class="row" style="margin-top:8px">'+sigBadge(prv.p)+'</div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Preview</div><div class="sec-hd-sub" style="margin-top:0">Scatter A vs B</div>'+svgScatter(data,aState.pairedA,aState.pairedB)+'</div></div>';
  return html;
}

function renderAnovaForm(){
  const nF=numFields(),aF=allFields();
  let html='';
    const gl=[...new Set(data.map(r=>r[aState.avG]))].filter(v=>v!==null);
    const groups=gl.map(g=>({label:String(g),vals:SE.validNums(data.filter(r=>r[aState.avG]===g).map(r=>r[aState.avV]))})).filter(g=>g.vals.length>=2);
    const prv=groups.length>=2?tryStats(()=>SE.onewayANOVA(groups)):null;
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">One-Way ANOVA'+ossGuideBtn('anova')+'</div>';
    html+=mkSelect('av-v',nF,aState.avV,'aState.avV=val;renderASub()','Dependent Variable');
    html+='<div style="margin-top:8px">'+mkSelect('av-g',aF,aState.avG,'aState.avG=val;renderASub()','Factor')+'</div>';
    html+='<div style="margin-top:10px">';
    html+='<label class="lbl">Post-hoc Test</label>';
    html+='<div style="display:flex;align-items:center;gap:8px;margin-top:4px">';
    html+='<button type="button" role="switch" aria-checked="'+(aState.avPost?'true':'false')+'" aria-label="Enable post-hoc test" onclick="aState.avPost=!aState.avPost;renderASub()" style="cursor:pointer;width:36px;height:20px;border-radius:var(--r-sm);background:'+(aState.avPost?'var(--gold)':'var(--surface-alt)')+';position:relative;flex-shrink:0;transition:background .15s;border:1px solid '+(aState.avPost?'var(--gold)':'var(--line-soft)')+';padding:0"><span style="position:absolute;top:2px;left:'+(aState.avPost?'18px':'2px')+';width:14px;height:14px;border-radius:1px;background:'+(aState.avPost?'var(--ink)':'var(--ink-muted)')+';transition:left .15s"></span></button>';
    var phLabels={'tukey':'Tukey HSD','bonferroni':'Bonferroni','lsd':'LSD (Fisher)','holm':'Holm-Bonferroni'};
    var phCurrent=phLabels[aState.avPostMethod||'tukey']||'Tukey HSD';
    html+='<div class="csel-wrap" id="cw-av-ph" style="flex:1'+(aState.avPost?'':';opacity:.4;pointer-events:none')+'">'
      +'<div class="csel-trigger" onclick="openCselById(\'av-ph\')">'
      +'<span class="csel-val" id="cv-av-ph">'+phCurrent+'</span>'
      +'<span class="csel-arrow">▾</span>'
      +'</div></div>';
    html+='</div></div>';
    _cR['av-ph']={
      fields:['Tukey HSD','Bonferroni','LSD (Fisher)','Holm-Bonferroni'],
      current:phCurrent,
      label:'Post-hoc Method',
      showBadge:false,
      onChange:'aState.avPostMethod={\'Tukey HSD\':\'tukey\',\'Bonferroni\':\'bonferroni\',\'LSD (Fisher)\':\'lsd\',\'Holm-Bonferroni\':\'holm\'}[val]||\'tukey\';renderASub()'
    };
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runANOVA()">▶ Run</button>';
    if(prv&&!prv._err){
      html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;margin-top:11px">'+stCard('F',prv.F)+stCard('p',prv.p_fmt)+stCard('η²',prv.eta2,prv.eta2Interp)+'</div>';
      html+='<div class="row" style="margin-top:8px">'+sigBadge(prv.p)+'</div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Preview</div><div class="sec-hd-sub" style="margin-top:0">Group Distributions</div>'+svgBoxplot(data,aState.avV,aState.avG)+'</div></div>';
  return html;
}

function renderRmanovaForm(){
  const nF=numFields();
  let html='';
    var rmVars=aState.rmVars||[];
    if(rmVars.length===0&&nF.length>=3) rmVars=nF.slice(0,Math.min(nF.length,3));
    aState.rmVars=rmVars;
    var rmPrv=null;
    if(rmVars.length>=3){
      rmPrv=tryStats(function(){return SE.repeatedMeasuresAnova(rmVars.map(function(v){return SE.validNums(data.map(function(r){return r[v];}));}),rmVars);});
    }
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Repeated Measures ANOVA'+ossGuideBtn('rmanova')+'</div>';
    html+='<div id="rm-slots">';
    for(var ri=0;ri<rmVars.length;ri++){
      html+='<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">';
      html+='<span style="font-size:11px;font-weight:600;color:var(--ink-subtle);width:24px;flex-shrink:0">T'+(ri+1)+'</span>';
      html+=mkSelect('rm-v-'+ri,nF,rmVars[ri],'(function(){aState.rmVars['+ri+']=val;renderASub();})()', 'Time point '+(ri+1));
      html+='<button class="btn btn-ghost btn-sm" style="padding:4px 8px;flex-shrink:0" aria-label="Remove T'+(ri+1)+'" onclick="aState.rmVars.splice('+ri+',1);renderASub()">✕</button>';
      html+='</div>';
    }
    html+='</div>';
    html+='<div style="display:flex;gap:6px;margin-top:6px">';
    html+='<button class="btn btn-ghost btn-sm" onclick="aState.rmVars.push(\'\');renderASub()">+ Tambah titik waktu</button>';
    html+='</div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runRmAnova()">▶ Run</button>';
    if(rmPrv&&!rmPrv._err){
      html+='<div class="stats-grid2" style="margin-top:11px">';
      html+=stCard('F',rmPrv.F,'df='+rmPrv.dfB+','+rmPrv.dfE);
      html+=stCard('p',rmPrv.p_fmt,'');
      html+=stCard('η²p',rmPrv.etaSq,'Effect size');
      html+=stCard('k',rmPrv.k,'Time points');
      html+='</div>';
      html+='<div class="row" style="margin-top:8px">'+sigBadge(rmPrv.p)+'</div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Preview</div>';
    html+='<div class="sec-hd-sub" style="margin-top:0">Profile Plot (Means)</div>';
    if(rmVars.length>=2&&rmVars.every(function(v){return v&&nF.includes(v);})){
      var T=typeof ossChartTheme==='function'?ossChartTheme():{ice:'#4F7A99',primary:'#D4A72C',muted:'#4A5663',ink:'#0D0D0D',grid:'rgba(79,122,153,0.18)'};
      var rmMeans=rmVars.map(function(v){
        var vals=SE.validNums(data.map(function(r){return r[v];}));
        return vals.length?vals.reduce(function(a,b){return a+b;},0)/vals.length:0;
      });
      var rmMax=Math.max.apply(null,rmMeans);var rmMin=Math.min.apply(null,rmMeans);
      var rmRange=rmMax-rmMin||1;
      var svgW=220,svgH=124,padL=30,padB=20,padT=16,padR=28;
      var plotW=svgW-padL-padR,plotH=svgH-padB-padT;
      var pts=rmVars.map(function(v,i){
        var x=padL+(i/(rmVars.length-1))*plotW;
        var y=padT+plotH-(((rmMeans[i]-rmMin)/rmRange)*plotH*0.85+0.075*plotH);
        return {x:x,y:y,mean:rmMeans[i],label:'T'+(i+1)};
      });
      var polyline=pts.map(function(p){return p.x+','+p.y;}).join(' ');
      var svgStr='<svg viewBox="0 0 '+svgW+' '+svgH+'" style="width:100%;height:auto">';
      svgStr+='<line x1="'+padL+'" y1="'+(svgH-padB)+'" x2="'+(svgW-padR)+'" y2="'+(svgH-padB)+'" stroke="'+T.grid+'" stroke-width="1"/>';
      svgStr+='<polyline points="'+polyline+'" fill="none" stroke="'+T.ice+'" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
      pts.forEach(function(p){
        svgStr+='<circle cx="'+p.x+'" cy="'+p.y+'" r="4" fill="'+T.primary+'" stroke="'+T.ice+'" stroke-width="1.2"/>';
        svgStr+='<text x="'+p.x+'" y="'+(svgH-5)+'" text-anchor="middle" font-size="9" fill="'+T.muted+'">'+p.label+'</text>';
        svgStr+='<text x="'+p.x+'" y="'+(p.y-7)+'" text-anchor="middle" font-size="8.5" font-weight="600" fill="'+T.ink+'">'+SE.fmt4(p.mean)+'</text>';
      });
      svgStr+='</svg>';
      html+=svgStr;
    } else {
      html+='<div class="chart-empty">Pilih ≥2 titik waktu untuk melihat preview</div>';
    }
    if(rmVars.length>=2&&rmVars.every(function(v){return v&&nF.includes(v);})){
      html+='<div class="tbl-wrap" style="margin-top:10px"><table><thead><tr><th>Titik Waktu</th><th>Variabel</th><th style="text-align:right">N</th><th style="text-align:right">Mean</th><th style="text-align:right">SD</th></tr></thead><tbody>';
      rmVars.forEach(function(v,i){
        var vals=SE.validNums(data.map(function(r){return r[v];}));
        if(!vals.length){html+='<tr><td class="td-label">T'+(i+1)+'</td><td class="td-label">'+escHtml(v)+'</td><td colspan="3">—</td></tr>';return;}
        var mean=vals.reduce(function(a,b){return a+b;},0)/vals.length;
        var sd=Math.sqrt(vals.reduce(function(a,b){return a+(b-mean)*(b-mean);},0)/(vals.length-1));
        html+='<tr><td class="td-label">T'+(i+1)+'</td><td class="td-label">'+escHtml(v)+'</td><td class="td-num">'+vals.length+'</td><td class="td-num">'+SE.fmt4(mean)+'</td><td class="td-num">'+SE.fmt4(sd)+'</td></tr>';
      });
      html+='</tbody></table></div>';
    }
    if(rmPrv&&!rmPrv._err&&parseFloat(rmPrv.p)<0.05){
      var pwRows=[];
      for(var pi=0;pi<rmVars.length;pi++){
        for(var pj=pi+1;pj<rmVars.length;pj++){
          var phRes=tryStats(function(){return SE.pairedTTest(SE.validNums(data.map(function(r){return r[rmVars[pi]];})),SE.validNums(data.map(function(r){return r[rmVars[pj]];})));});
          if(phRes&&!phRes._err) pwRows.push(['T'+(pi+1)+' vs T'+(pj+1),phRes.t,phRes.p_fmt]);
        }
      }
      if(pwRows.length){
        html+='<div class="sec-hd-sub">Pairwise Comparisons</div>';
        html+=mkTable(['Pair','t','p'],pwRows);
      }
    }
    html+='</div>';
    html+='</div>';
  return html;
}

function renderAnova2Form(){
  let html='';
    const nF2=numFields(),aF2=allFields();
    if(!aState.av2V&&nF2.length) aState.av2V=nF2[0];
    if(!aState.av2A&&aF2.length) aState.av2A=aF2[aF2.length>1?aF2.length-1:0];
    if(!aState.av2B&&aF2.length>1) aState.av2B=aF2[aF2.length>2?aF2.length-2:0];
    const prv2=aState.av2V&&aState.av2A&&aState.av2B&&aState.av2A!==aState.av2B?
      tryStats(()=>SE.twowayANOVA(data,aState.av2V,aState.av2A,aState.av2B)):null;
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Two-Way ANOVA'+ossGuideBtn('anova2')+'</div>';
    html+=mkSelect('av2-v',nF2,aState.av2V,'aState.av2V=val;renderASub()','Dependent Variable');
    html+='<div style="margin-top:8px">'+mkSelect('av2-a',aF2,aState.av2A,'aState.av2A=val;renderASub()','Factor A')+'</div>';
    html+='<div style="margin-top:8px">'+mkSelect('av2-b',aF2,aState.av2B,'aState.av2B=val;renderASub()','Factor B')+'</div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runANOVA2()">▶ Run</button>';
    if(prv2&&!prv2._err){
      html+='<div style="margin-top:11px">';
      prv2.effects.forEach(function(e){
        var col=e.source.indexOf('×')>=0?'var(--warn)':(e.source===aState.av2A?'var(--line)':'var(--ok)');
        html+='<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 10px;border-radius:var(--r-sm);background:var(--surface-alt);border:1px solid var(--line-soft);margin-bottom:4px">';
        html+='<span style="font-weight:700;color:'+col+';font-size:12px">'+e.source+'</span>';
        html+='<span style="font-family:var(--font-mono-stack);font-variant-numeric:tabular-nums;font-size:11.5px;color:var(--ink-muted)">F('+e.df+','+prv2.error.df+')='+e.F+'</span>';
        html+='<span class="tag '+(e.sig?'tag-green':'tag-gray')+'">p='+e.p_fmt+'</span>';
        html+='</div>';
      });
      html+='</div>';
    }
    if(prv2&&prv2._err) html+='<div style="color:var(--err);font-size:11.5px;margin-top:8px">'+prv2.msg+'</div>';
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Preview</div><div class="sec-hd-sub" style="margin-top:0">Interaction Plot ('+escHtml((aState.av2A)||'A')+'×'+escHtml((aState.av2B)||'B')+')</div>';
    if(prv2&&!prv2._err){
      html+=svgInteractionPlot(prv2.cellMeansTable,aState.av2B,aState.av2A,aState.av2V);
    } else {
      html+='<div class="chart-empty">Pilih variabel untuk melihat preview interaction plot</div>';
    }
    html+='</div></div>';
  return html;
}

function renderAnova3Form(){
  let html='';
    const nF3=numFields(),aF3=allFields();
    if(!aState.av3V&&nF3.length) aState.av3V=nF3[0];
    if(!aState.av3A&&aF3.length) aState.av3A=aF3[aF3.length>1?aF3.length-1:0];
    if(!aState.av3B&&aF3.length>1) aState.av3B=aF3[aF3.length>2?aF3.length-2:0];
    if(!aState.av3C&&aF3.length>2) aState.av3C=aF3[aF3.length>3?aF3.length-3:0];
    const valid3=aState.av3V&&aState.av3A&&aState.av3B&&aState.av3C&&
      aState.av3A!==aState.av3B&&aState.av3A!==aState.av3C&&aState.av3B!==aState.av3C;
    const prv3=valid3?tryStats(()=>SE.threewayANOVA(data,aState.av3V,aState.av3A,aState.av3B,aState.av3C)):null;
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Three-Way ANOVA'+ossGuideBtn('anova3')+'</div>';
    html+=mkSelect('av3-v',nF3,aState.av3V,'aState.av3V=val;renderASub()','Dependent Variable');
    html+='<div style="margin-top:8px">'+mkSelect('av3-a',aF3,aState.av3A,'aState.av3A=val;renderASub()','Factor A')+'</div>';
    html+='<div style="margin-top:8px">'+mkSelect('av3-b',aF3,aState.av3B,'aState.av3B=val;renderASub()','Factor B')+'</div>';
    html+='<div style="margin-top:8px">'+mkSelect('av3-c',aF3,aState.av3C,'aState.av3C=val;renderASub()','Factor C')+'</div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runANOVA3()">▶ Run</button>';
    if(prv3&&!prv3._err){
      html+='<div style="margin-top:11px">';
      prv3.effects.forEach(function(e){
        var col=e.source.split('×').length===3?'var(--gold-text)':e.source.indexOf('×')>=0?'var(--warn)':'var(--line)';
        html+='<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 10px;border-radius:var(--r-sm);background:var(--surface-alt);border:1px solid var(--line-soft);margin-bottom:4px">';
        html+='<span style="font-weight:700;color:'+col+';font-size:11.5px">'+e.source+'</span>';
        html+='<span class="tag '+(e.sig?'tag-green':'tag-gray')+'">p='+e.p_fmt+'</span>';
        html+='</div>';
      });
      html+='</div>';
    }
    if(prv3&&prv3._err) html+='<div style="color:var(--err);font-size:11.5px;margin-top:8px">'+prv3.msg+'</div>';
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Preview</div><div class="sec-hd-sub" style="margin-top:0">A×B Interaction Plot</div>';
    if(prv3&&!prv3._err){
      html+=svgInteractionPlot(prv3.cellMeansAB,aState.av3B,aState.av3A,aState.av3V);
    } else {
      html+='<div class="chart-empty">Pilih variabel untuk melihat preview interaction plot</div>';
    }
    html+='</div></div>';
  return html;
}

function renderCorrelationForm(){
  const nF=numFields();
  let html='';
    const prv=tryStats(()=>{const ax=data.map(r=>r[aState.crX]),ay=data.map(r=>r[aState.crY]);return aState.crType==='spearman'?SE.spearmanR(ax,ay):SE.pearsonR(ax,ay);});
    const pcPrv=aState.crType==='partial'&&aState.pcX&&aState.pcY&&aState.pcZ?tryStats(()=>SE.partialCorr(data.map(r=>r[aState.pcX]),data.map(r=>r[aState.pcY]),data.map(r=>r[aState.pcZ]))):null;
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Correlation'+ossGuideBtn('correlation')+'</div>';
    html+=mkCsel('cr-type',['pearson','spearman','partial'],aState.crType,'aState.crType=val;renderASub()','Type');
    if(aState.crType==='partial'){
      html+='<div style="margin-top:8px">'+mkSelect('pc-x',nF,aState.pcX,'aState.pcX=val;renderASub()','Variable X')+'</div>';
      html+='<div style="margin-top:8px">'+mkSelect('pc-y',nF,aState.pcY,'aState.pcY=val;renderASub()','Variable Y')+'</div>';
      html+='<div style="margin-top:8px">'+mkSelect('pc-z',nF,aState.pcZ,'aState.pcZ=val;renderASub()','Control Variable (Z)')+'</div>';
      html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runPartialCorr()">▶ Run</button>';
      if(pcPrv&&!pcPrv._err){
        html+='<div class="stats-grid2" style="margin-top:11px">'+stCard('Partial r',pcPrv.rp)+stCard('r²',pcPrv.r2,'Variance explained')+stCard('p',pcPrv.p_fmt)+stCard('95% CI',pcPrv.ci95)+'</div>';
        html+='<div class="row" style="margin-top:8px">'+sigBadge(pcPrv.p)+'<span class="tag tag-gray">'+pcPrv.strength+' '+(parseFloat(pcPrv.rp)>=0?'positive':'negative')+'</span></div>';
        html+='<div style="margin-top:7px;font-size:11px;color:var(--ink-muted)">Zero-order: r(X,Y)='+pcPrv.rxy+' | r(X,Z)='+pcPrv.rxz+' | r(Y,Z)='+pcPrv.ryz+'</div>';
      }
    } else {
      html+='<div style="margin-top:8px">'+mkSelect('cr-x',nF,aState.crX,'aState.crX=val;renderASub()','Variable X')+'</div>';
      html+='<div style="margin-top:8px">'+mkSelect('cr-y',nF,aState.crY,'aState.crY=val;renderASub()','Variable Y')+'</div>';
      html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runCorr()">▶ Run</button>';
      if(prv&&!prv._err){
        html+='<div class="stats-grid2" style="margin-top:11px">'+stCard('r',prv.r)+stCard('r²',prv.r2,'Variance explained')+stCard('p',prv.p_fmt)+stCard('95% CI',prv.ci95)+'</div>';
        html+='<div class="row" style="margin-top:8px">'+sigBadge(prv.p)+'<span class="tag tag-gray">'+prv.strength+' '+prv.direction+'</span></div>';
      }
    }
    html+='</div>';
    if(aState.crType==='partial'){
      html+='<div class="card"><div class="sec-hd">Preview</div><div class="sec-hd-sub" style="margin-top:0">Scatter X vs Y</div>'+svgScatter(data,aState.pcX,aState.pcY)+'</div>';
    } else {
      html+='<div class="card"><div class="sec-hd">Preview</div><div class="sec-hd-sub" style="margin-top:0">Scatter Plot</div>'+svgScatter(data,aState.crX,aState.crY)+'</div>';
    }
    html+='</div>';
  return html;
}

function renderRegressionForm(){
  const nF=numFields();
  let html='';
    const prv=tryStats(()=>SE.linearReg(data.map(r=>r[aState.regX]),data.map(r=>r[aState.regY])));
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Simple Regression'+ossGuideBtn('regression')+'</div>';
    html+=mkSelect('reg-x',nF,aState.regX,'aState.regX=val;renderASub()','Predictor (X)');
    html+='<div style="margin-top:8px">'+mkSelect('reg-y',nF,aState.regY,'aState.regY=val;renderASub()','Outcome (Y)')+'</div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runReg()">▶ Run</button>';
    if(prv&&!prv._err){
      html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-top:11px">'+stCard('R²',prv.R2,'Variance explained')+stCard('Adj R²',prv.R2adj)+stCard('F',prv.F,'p='+prv.pF_fmt)+stCard('RMSE',prv.RMSE)+'</div>';
      html+='<div class="eq" style="margin-top:9px">Ŷ = '+prv.b0+' + '+prv.b1+'·'+escHtml(aState.regX)+'</div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Preview</div><div class="sec-hd-sub" style="margin-top:0">Scatter + Residuals</div>';
    html+=svgScatter(data,aState.regX,aState.regY);
    if(prv&&!prv._err)html+='<div style="margin-top:10px">'+svgResidual(prv)+'</div>';
    html+='</div></div>';
  return html;
}

function renderMultipleRegForm(){
  const nF=numFields();
  let html='';
    const prv=aState.mrXs.length?tryStats(()=>SE.multipleReg(aState.mrXs,aState.mrY,data)):null;
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Multiple Regression'+ossGuideBtn('multipleReg')+'</div>';
    html+=mkSelect('mr-y',nF,aState.mrY,'aState.mrY=this.value;renderASub()','Dependent Variable (Y)');
    html+='<label class="lbl" style="margin-top:9px;margin-bottom:5px">Predictors (X):</label>';
    html+='<div style="display:flex;flex-direction:column;gap:4px;max-height:180px;overflow-y:auto;margin-bottom:11px">';
    nF.filter(f=>f!==aState.mrY).forEach(f=>{const sel=aState.mrXs.includes(f);
      html+='<label style="display:flex;align-items:center;gap:8px;font-size:12px;color:'+(sel?'var(--ink)':'var(--ink-muted)')+';cursor:pointer;padding:5px 8px;border-radius:var(--r-sm);background:'+(sel?'var(--gold-tint)':'transparent')+'"><input type="checkbox" data-fld="'+escHtmlAttr(f)+'" '+(sel?'checked':'')+' onchange="toggleMrXEl(this)" style="accent-color:var(--gold)"/>'+escHtml(f)+'</label>';
    });
    html+='</div>';
    html+='<button class="btn btn-primary btn-sm" onclick="runMultipleReg()">▶ Run</button>';
    if(prv&&!prv._err){
      html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-top:11px">'+stCard('R²',prv.R2,'Variance explained')+stCard('Adj R²',prv.R2adj)+stCard('F',prv.F,'p='+prv.pF_fmt)+stCard('DW',prv.DW,'Ideal 1.5-2.5')+'</div>';
      html+='<div class="row" style="margin-top:8px">'+sigBadge(prv.pF)+'</div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Preview</div><div class="sec-hd-sub" style="margin-top:0">Coefficients</div>';
    if(prv&&!prv._err)html+=mkTable(['Variable','B','SE','β','t','p','VIF'],prv.coefs.map((c,i)=>[escHtml(c.name),c.B,c.SE,i===0?'—':c.beta,c.t,c.p_fmt,i===0?'—':prv.vif[i-1]]));
    else html+='<div class="chart-empty">Pilih ≥1 prediktor untuk melihat preview koefisien</div>';
    html+='</div></div>';
  return html;
}

function renderNonparamForm(){
  const nF=numFields(),aF=allFields();
  let html='';
    var npPrv=null;
    if(aState.npV){
      if(aState.npType==='wilcoxon'){
        var wVals=SE.validNums(data.map(function(r){return r[aState.npV];}));
        if(wVals.length>=2) npPrv=tryStats(function(){return SE.wilcoxon(wVals,0);});
      } else if(aState.npType==='mannwhitney'&&aState.npG){
        var mwGrps=[...new Set(data.map(function(r){return r[aState.npG];}).filter(function(v){return v!==null&&v!==undefined;}))];
        if(mwGrps.length>=2){
          var gA=SE.validNums(data.filter(function(r){return r[aState.npG]===mwGrps[0];}).map(function(r){return r[aState.npV];}));
          var gB=SE.validNums(data.filter(function(r){return r[aState.npG]===mwGrps[1];}).map(function(r){return r[aState.npV];}));
          if(gA.length>=1&&gB.length>=1) npPrv=tryStats(function(){return SE.mannWhitney(gA,gB);});
        }
      } else if(aState.npType==='kruskal'&&aState.npG){
        var kwLabels=[...new Set(data.map(function(r){return r[aState.npG];}).filter(function(v){return v!==null&&v!==undefined;}))];
        var kwGrps=kwLabels.map(function(g){return {label:String(g),vals:SE.validNums(data.filter(function(r){return r[aState.npG]===g;}).map(function(r){return r[aState.npV];}))};}).filter(function(g){return g.vals.length>=1;});
        if(kwGrps.length>=2) npPrv=tryStats(function(){return SE.kruskalWallis(kwGrps);});
      }
    }
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Nonparametric Tests'+ossGuideBtn('nonparam')+'</div>';
    html+=mkCsel('np-type',['mannwhitney','kruskal','wilcoxon'],aState.npType,'aState.npType=val;renderASub()','Test');
    html+='<div style="margin-top:8px">'+mkSelect('np-v',nF,aState.npV,'aState.npV=val;renderASub()','Variable')+'</div>';
    if(aState.npType!=='wilcoxon')html+='<div style="margin-top:8px">'+mkSelect('np-g',aF,aState.npG,'aState.npG=val;renderASub()','Grouping Variable')+'</div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runNP()">▶ Run</button>';
    if(npPrv&&!npPrv._err){
      html+='<div class="stats-grid2" style="margin-top:11px">';
      if(aState.npType==='mannwhitney'){
        html+=stCard('Mann-Whitney U',npPrv.U,'z='+npPrv.z);
        html+=stCard('p-value',npPrv.p_fmt);
        html+=stCard('Effect r',npPrv.r_eff,'Med '+npPrv.medA+' vs '+npPrv.medB);
        html+=stCard('nA / nB',npPrv.nA+' / '+npPrv.nB);
      } else if(aState.npType==='kruskal'){
        html+=stCard('Kruskal H',npPrv.H,'df='+npPrv.df);
        html+=stCard('p-value',npPrv.p_fmt);
        html+=stCard('η²',npPrv.eta2,'Effect size');
        html+=stCard('Groups',npPrv.groupStats?npPrv.groupStats.length:'—');
      } else {
        html+=stCard('Wilcoxon W',npPrv.W,'z='+npPrv.z);
        html+=stCard('p-value',npPrv.p_fmt);
        html+=stCard('Effect r',npPrv.r_eff);
        html+=stCard('N',npPrv.n);
      }
      html+='</div>';
      html+='<div class="row" style="margin-top:8px">'+sigBadge(npPrv.p)+'</div>';
    } else if(npPrv&&npPrv._err){
      html+='<div class="notice-box notice-err" style="margin-top:9px">'+escHtml(npPrv._err)+'</div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Preview</div>';
    html+=svgBoxplot(data,aState.npV,aState.npType!=='wilcoxon'?aState.npG:null);
    if(npPrv&&!npPrv._err&&aState.npType==='kruskal'&&npPrv.groupStats){
      html+='<div class="tbl-wrap" style="margin-top:10px">'+mkTable(['Group','n','Median','Mean'],npPrv.groupStats.map(function(g){return [escHtml(g.label),g.n,g.median,g.mean];}))+'</div>';
    }
    html+='</div></div>';
  return html;
}

function evalPreviewComputeExpr(ex,scope){
  var pos=0,tok=[],src=String(ex||'').trim();
  if(!src) return NaN;
  while(pos<src.length){
    var c=src[pos];
    if(/\s/.test(c)){pos++;continue;}
    if(/[0-9]/.test(c)){var n=c;pos++;while(pos<src.length&&/[0-9.]/.test(src[pos]))n+=src[pos++];tok.push({t:'num',v:parseFloat(n)});continue;}
    if(/[a-zA-Z_]/.test(c)){var id=c;pos++;while(pos<src.length&&/[a-zA-Z0-9_]/.test(src[pos]))id+=src[pos++];tok.push({t:'id',v:id});continue;}
    if('+-*/()%^,'.includes(c)){tok.push({t:'op',v:c});pos++;continue;}
    pos++;
  }
  var ti=0;
  function peek(){return tok[ti];}
  function eat(){return tok[ti++];}
  var SF={abs:Math.abs,sqrt:Math.sqrt,log:Math.log,log10:Math.log10,exp:Math.exp,ceil:Math.ceil,floor:Math.floor,round:Math.round,sin:Math.sin,cos:Math.cos,pow:Math.pow,min:Math.min,max:Math.max,sign:Math.sign};
  function pE(){return pA();}
  function pA(){var l=pM();while(peek()&&(peek().v==='+'||peek().v==='-')){var op=eat().v,r=pM();l=op==='+'?l+r:l-r;}return l;}
  function pM(){var l=pP();while(peek()&&(peek().v==='*'||peek().v==='/'||peek().v==='%')){var op=eat().v,r=pP();l=op==='*'?l*r:op==='/'?l/r:l%r;}return l;}
  function pP(){var l=pU();if(peek()&&peek().v==='^'){eat();l=Math.pow(l,pP());}return l;}
  function pU(){if(peek()&&peek().v==='-'){eat();return -pPr();}return pPr();}
  function pPr(){
    var t=peek();if(!t) throw new Error('eof');
    if(t.t==='num'){eat();return t.v;}
    if(t.t==='op'&&t.v==='('){eat();var v=pE();if(peek()&&peek().v===')')eat();return v;}
    if(t.t==='id'){
      eat();
      if(peek()&&peek().v==='('){
        eat();var args=[];
        while(peek()&&peek().v!==')'){args.push(pE());if(peek()&&peek().v===',')eat();}
        if(peek()&&peek().v===')')eat();
        var fn=SF[t.v.toLowerCase()];if(!fn) throw new Error('fn');
        return fn.apply(null,args);
      }
      if(t.v==='pi'||t.v==='PI') return Math.PI;
      if(t.v==='e'||t.v==='E') return Math.E;
      if(Object.prototype.hasOwnProperty.call(scope,t.v)) return scope[t.v];
      throw new Error('var');
    }
    throw new Error('tok');
  }
  return pE();
}

function renderTransformPreviewHtml(){
  var html='';
  var fld=aState.trFld,tt=aState.trType||'zscore',nn=(aState.trNewName||'').trim()||(fld?fld+'_'+tt:'new_var');
  var vals=fld?SE.validNums(data.map(function(r){return r[fld];})):[];
  if(fld&&vals.length){
    var mn=SE.mean(vals),sd=vals.length>=2?SE.std(vals):0,minV=Math.min.apply(null,vals),maxV=Math.max.apply(null,vals);
    var sorted=[].concat(vals).sort(function(a,b){return a-b;});
    var rm={};var p=0;
    while(p<sorted.length){var j=p;while(j<sorted.length&&sorted[j]===sorted[p])j++;var avg=(p+j+1)/2;for(var x=p;x<j;x++)rm[sorted[x]]=avg;p=j;}
    var txFn=function(v){
      if(!SE.isV(v)) return null;
      switch(tt){
        case'zscore':return sd>0?(v-mn)/sd:0;
        case'minmax':return maxV>minV?(v-minV)/(maxV-minV):0;
        case'log':return v>0?Math.log(v):null;
        case'log10':return v>0?Math.log10(v):null;
        case'sqrt':return v>=0?Math.sqrt(v):null;
        case'square':return v*v;
        case'center':return v-mn;
        case'rank':return rm[v]!==undefined?rm[v]:null;
        default:return v;
      }
    };
    var outVals=vals.map(txFn).filter(function(v){return v!==null&&isFinite(v);});
    html+='<div class="sec-hd-sub" style="margin-top:0">Transform: '+escHtml(fld)+' → '+escHtml(nn)+' ('+escHtml(tt)+')</div>';
    if(outVals.length){
      html+='<div class="stats-grid2" style="margin-bottom:10px">';
      html+=stCard('Valid Out',outVals.length+' / '+data.length);
      html+=stCard('Mean',SE.f4(SE.mean(outVals)));
      html+=stCard('Min',SE.f4(Math.min.apply(null,outVals)));
      html+=stCard('Max',SE.f4(Math.max.apply(null,outVals)));
      html+='</div>';
    }
    var sampleRows=[];
    for(var ri=0;ri<Math.min(data.length,6);ri++){
      var raw=data[ri][fld],tv=txFn(raw);
      sampleRows.push(['#'+(ri+1),SE.isV(raw)?SE.f4(raw):'—',tv!==null&&isFinite(tv)?SE.f4(tv):'—']);
    }
    html+=mkTable(['Row',escHtml(fld),escHtml(nn)],sampleRows);
  } else {
    html+='<div class="chart-empty">Pilih Source Variable untuk melihat preview transformasi</div>';
  }

  var expr=(aState.computeExpr||'').trim(),cn=(aState.computeName||'').trim()||'computed_var';
  if(expr){
    html+='<div class="sec-hd-sub" style="margin-top:14px">Compute: '+escHtml(cn)+' = <span style="font-family:var(--font-mono-stack)">'+escHtml(expr)+'</span></div>';
    var cRows=[],okCount=0;
    for(var ci=0;ci<Math.min(data.length,6);ci++){
      var row=data[ci],sc={};
      vars.forEach(function(v){sc[v.name]=typeof row[v.name]==='number'?row[v.name]:NaN;});
      var resStr='—';
      try{var cv=evalPreviewComputeExpr(expr,sc);if(isFinite(cv)){resStr=SE.f4(cv);okCount++;}}catch{}
      cRows.push(['#'+(ci+1),resStr]);
    }
    if(okCount>0) html+=mkTable(['Row',escHtml(cn)],cRows);
    else html+='<div class="notice-box notice-warn">Ekspresi belum menghasilkan nilai numerik valid pada sampel baris.</div>';
  }
  return html;
}

function updateTransformPreview(){
  var box=document.getElementById('tr-preview-box');
  if(box) box.innerHTML=renderTransformPreviewHtml();
}

function renderTransformForm(){
  const nF=numFields();
  let html='';
    html+='<div class="grid2">';
    html+='<div>';
    html+='<div class="card"><div class="sec-hd">Transform Variable'+ossGuideBtn('transform')+'</div>';
    html+=mkSelect('tr-fld',nF,aState.trFld,'aState.trFld=val;renderASub()','Source Variable');
    html+='<div style="margin-top:8px">'+mkCsel('tr-type',['zscore','minmax','log','log10','sqrt','square','center','rank'],aState.trType,'aState.trType=val;renderASub()','Transformation')+'</div>';
    html+='<div style="margin-top:8px"><label class="lbl">New Variable Name</label><input class="inp" value="'+escHtmlAttr(aState.trNewName)+'" oninput="aState.trNewName=this.value;updateTransformPreview()"/></div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runTransform()"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-1px"><polyline points="20 6 9 17 4 12"/></svg> Apply</button>';
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Compute Variable</div>';
    html+='<div style="margin-bottom:8px"><label class="lbl">New Variable Name</label><input class="inp" value="'+escHtmlAttr(aState.computeName)+'" oninput="aState.computeName=this.value;updateTransformPreview()"/></div>';
    html+='<div style="margin-bottom:8px"><label class="lbl">Expression</label><input class="inp" style="font-family:var(--font-mono-stack)" value="'+escHtmlAttr(aState.computeExpr)+'" oninput="aState.computeExpr=this.value;updateTransformPreview()" placeholder="e.g. age * 2 + score / 10"/></div>';
    html+='<button class="btn btn-primary btn-sm" onclick="runCompute()"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-1px"><polyline points="20 6 9 17 4 12"/></svg> Apply</button>';
    html+='</div>';
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Preview</div><div id="tr-preview-box">'+renderTransformPreviewHtml()+'</div></div>';
    html+='</div>';
  return html;
}

function renderHierarchicalRegForm(){
  const nF=numFields();
  let html='';
    if(!aState.hrY) aState.hrY = nF[0]||'';
    if(!aState.hrBlocks) aState.hrBlocks = [[],[]];
    if(!aState.hrBlocks[0]) aState.hrBlocks[0]=[];
    if(!aState.hrBlocks[1]) aState.hrBlocks[1]=[];

    var hrPrvs = [];
    for(var bi=0; bi<aState.hrBlocks.length; bi++){
      var _cumXs = [];
      for(var ci=0;ci<=bi;ci++) aState.hrBlocks[ci].forEach(function(v){if(!_cumXs.includes(v))_cumXs.push(v);});
      if(_cumXs.length > 0 && aState.hrY){
        hrPrvs.push((function(xs){return tryStats(function(){return SE.multipleReg(xs, aState.hrY, data);});}(_cumXs)));
      } else {
        hrPrvs.push(null);
      }
    }

    var hrSeries = (typeof ossChartTheme==='function'?ossChartTheme().series:['#4F7A99','#D4A72C','#16A34A','#D97706','#DC2626']);

    html += '<div class="sec-hd" style="margin-bottom:12px">Hierarchical Regression'+ossGuideBtn('hierarchicalReg')+'</div>';
    html += '<div class="grid2">';

    html += '<div>';
    html += '<div class="card" style="margin-bottom:8px">';
    html += mkSelect('hr-y', nF, aState.hrY, 'aState.hrY=val;renderASub()', 'Dependent Variable');
    html += '</div>';

    for(var bi=0; bi<aState.hrBlocks.length; bi++){
      var bNum = bi+1;
      var blockColor = hrSeries[bi % hrSeries.length];
      html += '<div class="card" style="margin-bottom:8px;border-top:2px solid '+blockColor+'">';
      html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">';
      html += '<div class="sec-hd" style="margin-bottom:0;color:var(--ink)">Block '+bNum+'</div>';
      if(bi >= 2){
        html += '<button class="btn btn-ghost btn-sm" style="padding:3px 8px;font-size:10px" onclick="aState.hrBlocks.splice('+bi+',1);renderASub()">✕ Remove</button>';
      }
      html += '</div>';
      html += '<div style="display:flex;flex-direction:column;gap:3px;max-height:140px;overflow-y:auto">';
      var blockedAll = [];
      for(var ci=0;ci<aState.hrBlocks.length;ci++) if(ci!==bi) aState.hrBlocks[ci].forEach(function(v){blockedAll.push(v);});
      nF.filter(function(f){return f!==aState.hrY;}).forEach(function(f){
        var sel = aState.hrBlocks[bi].includes(f);
        var usedElsewhere = blockedAll.includes(f);
        html += '<label style="display:flex;align-items:center;gap:7px;font-size:12px;cursor:'+(usedElsewhere&&!sel?'not-allowed':'pointer')+';padding:4px 8px;border-radius:var(--r-sm);'
          +(sel?'background:var(--gold-tint);color:var(--gold-text);font-weight:600;':'color:'+(usedElsewhere?'var(--ink-subtle)':'var(--ink-muted)')+'')
          +(usedElsewhere&&!sel?';pointer-events:none;opacity:.5':'')
          +'">';
        html += '<input type="checkbox" '+(sel?'checked':'')+(usedElsewhere&&!sel?' disabled':'')
          +' onchange="toggleHrBlock('+bi+',\''+escHtmlAttr(f)+'\',this.checked)" style="accent-color:var(--gold)"/>'+escHtml(f);
        if(usedElsewhere && !sel) html += ' <span style="font-size:10px;color:var(--ink-subtle)">(used elsewhere)</span>';
        html += '</label>';
      });
      html += '</div>';
      if(hrPrvs[bi] && !hrPrvs[bi]._err){
        var bp = hrPrvs[bi];
        var dR2 = bi===0 ? parseFloat(bp.R2) : parseFloat(bp.R2) - (hrPrvs[bi-1]&&!hrPrvs[bi-1]._err?parseFloat(hrPrvs[bi-1].R2):0);
        html += '<div style="margin-top:8px;padding:7px 10px;background:var(--surface-alt);border:1px solid var(--line-soft);border-radius:var(--r-sm);font-size:11px;display:flex;gap:12px;flex-wrap:wrap;font-variant-numeric:tabular-nums">';
        html += '<span style="color:var(--ink)">R²=<b>'+bp.R2+'</b></span>';
        html += '<span style="color:var(--ink-muted)">Adj R²='+bp.R2adj+'</span>';
        if(bi>0) html += '<span style="color:var(--gold-text)">ΔR²=<b>'+dR2.toFixed(4)+'</b></span>';
        html += '</div>';
      }
      html += '</div>';
    }

    if(aState.hrBlocks.length < 5){
      html += '<button class="btn btn-ghost btn-sm" onclick="aState.hrBlocks.push([]);renderASub()" style="width:100%;justify-content:center;margin-bottom:8px">+ Add Block '+(aState.hrBlocks.length+1)+'</button>';
    }

    html += '<button class="btn btn-primary btn-sm" onclick="runHierarchicalReg()">▶ Run</button>';
    html += '</div>';

    html += '<div>';
    html += '<div class="card"><div class="sec-hd">Preview</div>';
    html += '<div class="sec-hd-sub" style="margin-top:0">Model Summary &amp; ΔR²</div>';
    if(hrPrvs.some(function(p){return p&&!p._err;})){
      html += '<div class="tbl-wrap" style="margin-bottom:14px"><table><thead><tr>';
      ['Block','Predictors','R²','Adj R²','ΔR²','F-change','df1','df2','p ΔR²'].forEach(function(h,hi){
        html+='<th'+(hi>=2?' style="text-align:right"':'')+'>'+h+'</th>';
      });
      html += '</tr></thead><tbody>';
      var prevR2 = 0, prevN = 0;
      for(var bi=0;bi<aState.hrBlocks.length;bi++){
        if(!hrPrvs[bi]||hrPrvs[bi]._err) continue;
        var bp = hrPrvs[bi];
        var _cumXs2 = [];
        for(var ci=0;ci<=bi;ci++) aState.hrBlocks[ci].forEach(function(v){if(!_cumXs2.includes(v))_cumXs2.push(v);});
        var dR2 = parseFloat(bp.R2) - prevR2;
        var n = parseInt(bp.n||data.length), kNew = aState.hrBlocks[bi].length;
        var dfErr = n - _cumXs2.length - 1;
        var Fchange = dfErr>0 && (1-parseFloat(bp.R2))>0 ? (dR2/kNew) / ((1-parseFloat(bp.R2))/dfErr) : 0;
        var pFchange = Fchange>0 ? SE.pFromF(Fchange, kNew, dfErr) : 1;
        var sig = pFchange < 0.05;
        html += '<tr>';
        html += '<td class="td-label" style="color:var(--ink);font-weight:700">Block '+(bi+1)+'</td>';
        html += '<td style="font-size:11px;color:var(--ink-muted)">'+escHtml(aState.hrBlocks[bi].join(', '))+'</td>';
        html += '<td class="td-num" style="color:var(--ink);font-weight:700">'+bp.R2+'</td>';
        html += '<td class="td-num">'+bp.R2adj+'</td>';
        html += '<td class="td-num" style="color:var(--gold-text);font-weight:700">'+dR2.toFixed(4)+'</td>';
        html += '<td class="td-num">'+Fchange.toFixed(3)+'</td>';
        html += '<td class="td-num">'+kNew+'</td>';
        html += '<td class="td-num">'+dfErr+'</td>';
        html += '<td class="td-num">'+(sig?'<b style="color:var(--ok)">':'<span style="color:var(--ink-muted)">')+SE.f4(pFchange)+(sig?'</b>':'</span>')+'</td>';
        html += '</tr>';
        prevR2 = parseFloat(bp.R2);
        prevN = n;
      }
      html += '</tbody></table></div>';
    } else {
      html += '<div class="chart-empty">Tambah prediktor ke setiap Block untuk melihat preview tabel ΔR².</div>';
    }

    for(var bi=0;bi<aState.hrBlocks.length;bi++){
      if(!hrPrvs[bi]||hrPrvs[bi]._err) continue;
      var bp = hrPrvs[bi];
      html += '<div class="sec-hd-sub">Block '+(bi+1)+' Coefficients</div>';
      html += mkTable(['Variable','B','SE','β','t','p','VIF'],
        bp.coefs.map(function(c,ci){return[c.name,c.B,c.SE,ci===0?'—':c.beta,c.t,c.p_fmt,ci===0?'—':bp.vif[ci-1]];}));
    }
    html += '</div>';
    html += '</div>';
    html += '</div>';
  return html;
}

function renderLogisticForm(){
  const nF=numFields(),aF=allFields();
  let html='';
    var lgType=aState.lgType||'binary';
    var lgY=aState.lgY||'';
    var lgXs=aState.lgXs||[];
    var lgCats=lgY?[...new Set(data.map(function(r){return r[lgY];}).filter(function(v){return v!==null&&v!==undefined;}))].sort():[];
    var lgPrv=(lgY&&lgXs.length&&lgCats.length>=2)?tryStats(function(){return SE.logisticReg(lgY,lgXs,data,lgType);}):null;
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Logistic Regression'+ossGuideBtn('logistic')+'</div>';
    html+=mkCsel('lg-type',['binary','multinomial'],lgType,'aState.lgType=val;renderASub()','Tipe Model');
    html+='<div style="margin-bottom:10px"></div>';
    html+=mkSelect('lg-y',aF,lgY,'aState.lgY=val;renderASub()','Dependent Variable (DV Kategorikal)');
    if(lgY&&lgCats.length>0){
      var catColor=lgCats.length===2?'tag-green':lgCats.length<=5?'tag-blue':'tag-yellow';
      html+='<div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px">';
      lgCats.slice(0,8).forEach(function(c){html+='<span class="tag '+catColor+'">'+escHtml(String(c))+'</span>';});
      if(lgCats.length>8) html+='<span class="tag tag-gray">+'+( lgCats.length-8)+' more</span>';
      html+='</div>';
      if(lgType==='binary'&&lgCats.length!==2){
        html+='<div class="notice-box notice-warn" style="margin-top:6px">'+IC.warn+' Binary mode butuh tepat 2 kategori. DV ini punya '+lgCats.length+'.</div>';
      }
      if(lgType==='multinomial'&&lgCats.length<3){
        html+='<div class="notice-box notice-warn" style="margin-top:6px">'+IC.warn+' Multinomial butuh ≥3 kategori.</div>';
      }
    }
    html+='<label class="lbl" style="margin-top:10px;margin-bottom:5px">Predictors (X — Numerik):</label>';
    html+='<div style="display:flex;flex-direction:column;gap:3px;max-height:160px;overflow-y:auto;margin-bottom:10px">';
    nF.filter(function(f){return f!==lgY;}).forEach(function(f){
      var sel=lgXs.includes(f);
      html+='<label style="display:flex;align-items:center;gap:7px;font-size:12px;color:'+(sel?'var(--ink)':'var(--ink-muted)')+';font-weight:'+(sel?600:400)+';cursor:pointer;padding:4px 8px;border-radius:var(--r-sm);background:'+(sel?'var(--gold-tint)':'transparent')+'"><input type="checkbox" data-lgf="'+escHtmlAttr(f)+'" '+(sel?'checked':'')+' onchange="toggleLgX(this)" style="accent-color:var(--gold)"/>'+escHtml(f)+'</label>';
    });
    html+='</div>';
    html+='<button class="btn btn-primary btn-sm" onclick="runLogistic()">▶ Run</button>';
    if(lgPrv&&!lgPrv._err){
      html+='<div class="stats-grid2" style="margin-top:11px">';
      html+=stCard('N',lgPrv.n,'valid cases');
      html+=stCard('−2LL',lgPrv.m2ll,'Log-likelihood');
      html+=stCard("Cox & Snell R²",lgPrv.coxSnell,'Pseudo-R²');
      html+=stCard("Nagelkerke R²",lgPrv.nagelkerke,'Pseudo-R²');
      html+='</div>';
      html+='<div class="row" style="margin-top:8px">';
      html+='<span class="tag '+(parseFloat(lgPrv.chiSqP)<0.05?'tag-green':'tag-yellow')+'">χ²('+lgPrv.chiSqDf+')='+lgPrv.chiSq+', p='+lgPrv.chiSqP_fmt+'</span>';
      if(lgType==='binary') html+='<span class="tag tag-blue">Accuracy: '+lgPrv.accuracy+'%</span>';
      html+='</div>';
      if(lgType==='binary') html+='<div style="margin-top:7px;font-size:11px;color:var(--ink-muted)">Reference: "'+escHtml(String(lgCats[0]))+'" → Predicted: "'+escHtml(String(lgCats[lgCats.length-1]))+'"</div>';
    } else if(lgPrv&&lgPrv._err){
      html+='<div class="notice-box notice-err" style="margin-top:8px">'+escHtml(lgPrv.msg)+'</div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Preview</div>';
    html+='<div class="sec-hd-sub" style="margin-top:0">Coefficients &amp; Odds Ratios</div>';
    if(lgPrv&&!lgPrv._err){
      if(lgType==='binary'){
        html+='<div class="tbl-wrap">'+mkTable(
          ['Variable','B','SE','Wald','df','p','OR','95% CI OR'],
          lgPrv.coefs.map(function(c){
            return [c.name, c.B, c.SE, c.wald, '1', c.p_fmt, c.OR, c.ci_or];
          })
        )+'</div>';
        html+='<div class="sec-hd-sub" style="margin-top:13px">Confusion Matrix</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th></th><th style="text-align:right">Pred. "'+escHtml(String(lgPrv.cats[0]))+'"</th><th style="text-align:right">Pred. "'+escHtml(String(lgPrv.cats[1]))+'"</th><th style="text-align:right">Correct</th></tr></thead><tbody>';
        html+='<tr><td class="td-label">Act. "'+escHtml(String(lgPrv.cats[0]))+'"</td><td class="td-num">'+lgPrv.cm[0][0]+'</td><td class="td-num">'+lgPrv.cm[0][1]+'</td><td class="td-num">'+SE.f1(lgPrv.cm[0][0]/(lgPrv.cm[0][0]+lgPrv.cm[0][1]+0.001)*100)+'%</td></tr>';
        html+='<tr><td class="td-label">Act. "'+escHtml(String(lgPrv.cats[1]))+'"</td><td class="td-num">'+lgPrv.cm[1][0]+'</td><td class="td-num">'+lgPrv.cm[1][1]+'</td><td class="td-num">'+SE.f1(lgPrv.cm[1][1]/(lgPrv.cm[1][0]+lgPrv.cm[1][1]+0.001)*100)+'%</td></tr>';
        html+='<tr><td class="td-label" style="color:var(--gold-text)">Total</td><td></td><td></td><td class="td-num" style="color:var(--ok);font-weight:700">'+lgPrv.accuracy+'%</td></tr>';
        html+='</tbody></table></div>';
        html+='<div style="margin-top:8px;font-size:11.5px;color:var(--ink-muted)">AUC = <span style="color:var(--ok);font-weight:700;font-variant-numeric:tabular-nums">'+lgPrv.auc+'</span> &nbsp;'+( parseFloat(lgPrv.auc)>=0.9?'<span class="tag tag-green">Excellent</span>':parseFloat(lgPrv.auc)>=0.8?'<span class="tag tag-blue">Good</span>':parseFloat(lgPrv.auc)>=0.7?'<span class="tag tag-yellow">Fair</span>':'<span class="tag tag-red">Poor</span>')+'</div>';
      } else {
        lgPrv.categories.forEach(function(cat,ci){
          if(ci===0) return;
          html+='<div style="margin-bottom:8px;font-size:11.5px;color:var(--gold-text);font-weight:700">vs. Reference: "'+escHtml(String(lgPrv.categories[0]))+'" → Predict: "'+escHtml(String(cat))+'"</div>';
          html+='<div class="tbl-wrap">'+mkTable(
            ['Variable','B','SE','Wald','p','OR','95% CI OR'],
            lgPrv.coefs[ci-1].map(function(c){
              return[c.name,c.B,c.SE,c.wald,c.p_fmt,c.OR,c.ci_or];
            })
          )+'</div>';
        });
        html+='<div style="margin-top:8px;font-size:11px;color:var(--ink-muted)">Overall Accuracy: '+lgPrv.accuracy+'%</div>';
      }
    } else {
      html+='<div class="chart-empty">Pilih DV kategorikal dan minimal 1 prediktor numerik untuk melihat preview.</div>';
    }
    html+='</div></div>';
  return html;
}

function renderReliabilityForm(){
  const nF=numFields();
  let html='';
    const validAlphaVars=aState.alphaVars.filter(v=>nF.includes(v));
    const cols=validAlphaVars.map(v=>SE.validNums(data.map(r=>r[v])));
    const minN=cols.length?Math.min(...cols.map(c=>c.length)):0;
    const aRes=(cols.length>=2&&minN>=2)?tryStats(()=>SE.cronbachAlpha(cols.map(c=>c.slice(0,minN)))):null;
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Cronbach Alpha'+ossGuideBtn('reliability')+'</div>';
    html+='<label class="lbl" style="margin-bottom:6px">Select items (≥2 numeric):</label>';
    html+='<div style="display:flex;flex-direction:column;gap:4px;max-height:220px;overflow-y:auto;margin-bottom:11px">';
    nF.forEach(f=>{const sel=aState.alphaVars.includes(f);
      html+='<label style="display:flex;align-items:center;gap:7px;font-size:12px;color:'+(sel?'var(--ink)':'var(--ink-muted)')+';font-weight:'+(sel?600:400)+';cursor:pointer;padding:4px 8px;border-radius:var(--r-sm);background:'+(sel?'var(--gold-tint)':'transparent')+'"><input type="checkbox" data-fld="'+escHtmlAttr(f)+'" '+(sel?'checked':'')+' onchange="toggleAlphaVarEl(this)" style="accent-color:var(--gold)"/>'+escHtml(f)+'</label>';
    });
    html+='</div>';
    html+='<button class="btn btn-primary btn-sm" onclick="runAlpha()">▶ Run</button>';
    if(aRes&&aRes._err){
      html+='<div class="notice-box notice-err" style="margin-top:9px">'+escHtml(aRes.msg)+'</div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Preview</div>';
    if(aRes&&!aRes._err){
      html+='<div class="stats-grid2" style="margin-bottom:10px">'+stCard('Cronbach α',aRes.alpha,aRes.interp)+stCard('Items k',aRes.k)+stCard('Cases n',aRes.n)+'</div>';
      html+='<div class="row" style="margin-bottom:10px"><span class="tag '+(parseFloat(aRes.alpha)>=.7?'tag-green':'tag-red')+'">'+escHtml(aRes.interp)+'</span></div>';
      if(aRes.itemStats&&aRes.itemStats.length){
        html+='<div class="sec-hd-sub" style="margin-top:4px">Item-Total Statistics</div>';
        html+=mkTable(
          ['Item','Corrected r_it','α if Deleted','Flag'],
          aRes.itemStats.map((it,idx)=>[
            escHtml(validAlphaVars[idx]||('Item '+(idx+1))),
            it.rit,
            it.alphaIfDeleted,
            it.flag?'<span class="tag tag-yellow">Check</span>':'<span class="tag tag-green">OK</span>'
          ])
        );
      }
    } else {
      html+='<div class="chart-empty">Pilih minimal 2 item numerik untuk melihat preview reliabilitas.</div>';
    }
    html+='</div></div>';
  return html;
}

function renderKappaForm(){
  let html='';
    var aF2=allFields();
    var kRes=null;
    if(aState.kappaR1&&aState.kappaR2&&aState.kappaR1!==aState.kappaR2){
      var pairsR1=[],pairsR2=[];
      data.forEach(function(r){
        var v1=r[aState.kappaR1],v2=r[aState.kappaR2];
        if(v1!==null&&v1!==undefined&&String(v1).trim()!==''&&v2!==null&&v2!==undefined&&String(v2).trim()!==''){
          pairsR1.push(String(v1)); pairsR2.push(String(v2));
        }
      });
      if(pairsR1.length>=2){
        kRes=tryStats(function(){return SE.cohenKappa(pairsR1,pairsR2);});
      }
    }
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Cohen\'s Kappa'+ossGuideBtn('kappa')+'</div>';
    html+=mkSelect('kap-r1',aF2,aState.kappaR1,'aState.kappaR1=val;renderASub()','Rater 1 / Observer 1');
    html+='<div style="margin-top:8px">'+mkSelect('kap-r2',aF2,aState.kappaR2,'aState.kappaR2=val;renderASub()','Rater 2 / Observer 2')+'</div>';
    html+='<label style="display:flex;align-items:center;gap:8px;margin-top:10px;font-size:12px;color:var(--ink-muted);cursor:pointer"><input type="checkbox" '+(aState.kappaWeighted?'checked':'')+' onchange="aState.kappaWeighted=this.checked;renderASub()" style="accent-color:var(--gold)"/> Weighted Kappa (ordinal data)</label>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runKappa()">▶ Run</button>';
    if(kRes&&kRes._err){
      html+='<div class="notice-box notice-err" style="margin-top:8px">'+escHtml(kRes.msg)+'</div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Preview</div>';
    if(kRes&&!kRes._err){
      var kv=parseFloat(kRes.kappa);
      var kCls=kv>=0.8?'tag-green':kv>=0.6?'tag-blue':kv>=0.4?'tag-purple':kv>=0.2?'tag-yellow':'tag-red';
      html+='<div class="stats-grid2" style="margin-bottom:10px">';
      html+=stCard("Cohen's κ",kRes.kappa,kRes.interp);
      html+=stCard('Observed Po',kRes.po,'Expected Pe='+kRes.pe);
      html+=stCard('95% CI','['+kRes.ci95lo+', '+kRes.ci95hi+']','p'+kRes.pFmt);
      html+=stCard('Cases n',kRes.n,kRes.k+' categories');
      html+='</div>';
      html+='<div class="row" style="margin-bottom:10px"><span class="tag '+kCls+'">'+escHtml(kRes.interp)+'</span>';
      if(aState.kappaWeighted&&kRes.wKappa!==null){
        html+='<span class="tag tag-purple">Weighted κ = '+kRes.wKappa+' ('+escHtml(kRes.interpW)+')</span>';
      }
      html+='</div>';
      if(kRes.cats&&kRes.mat){
        html+='<div class="sec-hd-sub" style="margin-top:4px">Agreement Matrix</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th>R1 \\ R2</th>';
        kRes.cats.forEach(function(c){html+='<th style="text-align:right">'+escHtml(String(c))+'</th>';});
        html+='<th style="text-align:right">Total</th></tr></thead><tbody>';
        kRes.cats.forEach(function(c,ri){
          html+='<tr><td class="td-label">'+escHtml(String(c))+'</td>';
          kRes.cats.forEach(function(_,ci){
            var v=kRes.mat[ri][ci];
            html+='<td class="td-num" style="'+(ri===ci?'font-weight:700;color:var(--ok)':'color:var(--ink-muted)')+'">'+v+'</td>';
          });
          html+='<td class="td-num" style="font-weight:700">'+(kRes.rowSum?kRes.rowSum[ri]:'')+'</td></tr>';
        });
        html+='</tbody></table></div>';
      }
    } else {
      html+='<div class="chart-empty">Pilih dua variabel rater yang berbeda untuk melihat preview kesepakatan.</div>';
    }
    html+='</div></div>';
  return html;
}

function renderCrosstabForm(){
  const aF=allFields();
  let html='';
    const ctRows=[...new Set(data.map(r=>String(r[aState.ctRow])))].sort();
    const ctCols=[...new Set(data.map(r=>String(r[aState.ctCol])))].sort();
    const ctN=data.length;
    const ctMat=ctRows.map(rv=>ctCols.map(cv=>data.filter(r=>String(r[aState.ctRow])===rv&&String(r[aState.ctCol])===cv).length));
    const ctRT=ctRows.map(rv=>data.filter(r=>String(r[aState.ctRow])===rv).length);
    const ctCT=ctCols.map(cv=>data.filter(r=>String(r[aState.ctCol])===cv).length);
    const chi=tryStats(()=>SE.chiSquare(ctMat,ctRT,ctCT,ctN));
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Crosstab &amp; Chi-Square'+ossGuideBtn('crosstab')+'</div>';
    html+=mkSelect('ct-row',aF,aState.ctRow,'aState.ctRow=val;renderASub()','Row Variable');
    html+='<div style="margin-top:8px">'+mkSelect('ct-col',aF,aState.ctCol,'aState.ctCol=val;renderASub()','Column Variable')+'</div>';
    if(chi&&!chi._err){
      html+='<div class="stats-grid2" style="margin-top:11px">'+stCard('χ²',chi.chi2,'df='+chi.df)+stCard('p-value',chi.p_fmt)+stCard("Cramér's V",chi.V)+stCard('N',ctN)+'</div>';
      html+='<div class="row" style="margin-top:8px">'+sigBadge(chi.p)+'</div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Preview</div>';
    html+='<div class="sec-hd-sub" style="margin-top:0">Contingency Table</div>';
    if(ctN>0&&ctRows.length&&ctCols.length){
      html+='<div class="tbl-wrap"><table><thead><tr><th style="color:var(--ink)">'+escHtml(aState.ctRow)+' \\ '+escHtml(aState.ctCol)+'</th>';
      ctCols.forEach(c=>html+='<th style="text-align:right">'+escHtml(c)+'</th>');html+='<th style="text-align:right">Total</th></tr></thead><tbody>';
      ctRows.forEach((rv,ri)=>{
        html+='<tr class="'+(ri%2?'':'alt')+'"><td class="td-label">'+escHtml(rv)+'</td>';
        ctCols.forEach((cv,ci)=>{const f=ctMat[ri][ci],pct=((f/ctN)*100).toFixed(1);const exp=chi&&chi.exp?chi.exp[ri][ci]:null;
          html+='<td class="td-num"><div style="font-weight:700;color:var(--ink)">'+f+'</div><div style="font-size:10px;color:var(--ink-subtle)">'+pct+'%'+(exp?' (E='+exp.toFixed(1)+')':'')+'</div></td>';});
        html+='<td class="td-num" style="font-weight:700;color:var(--ink-muted)">'+ctRT[ri]+'</td></tr>';
      });
      html+='<tr style="background:var(--surface-alt)"><td class="td-label">Total</td>';
      ctCT.forEach(v=>html+='<td class="td-num" style="font-weight:700;color:var(--ink-muted)">'+v+'</td>');
      html+='<td class="td-num" style="font-weight:800;color:var(--gold-text)">'+ctN+'</td></tr>';
      html+='</tbody></table></div>';
    } else {
      html+='<div class="chart-empty">Pilih variabel baris dan kolom untuk melihat tabel kontingensi.</div>';
    }
    html+='</div></div>';
  return html;
}

function renderRecodeForm(){
  const aF=allFields();
  let html='';
    const rcUniq=[...new Set(data.map(r=>r[aState.recodeFld]).filter(v=>v!==null))].slice(0,20);
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Recode Variable'+ossGuideBtn('recode')+'</div>';
    html+=mkSelect('rc-fld',aF,aState.recodeFld,'aState.recodeFld=val;renderASub()','Source Variable');
    html+='<div style="margin-top:8px">'+mkCsel('rc-type',['range','exact','binary'],aState.recodeType,'aState.recodeType=val;renderASub()','Recode Type')+'</div>';
    html+='<div style="margin-top:8px"><label class="lbl">New Variable Name</label><input class="inp" value="'+escHtmlAttr(aState.recodeNewName)+'" oninput="aState.recodeNewName=this.value"/></div>';
    if(aState.recodeType==='binary'){
      html+='<div class="row" style="gap:7px;margin-top:8px;margin-bottom:9px"><div style="flex:1"><label class="lbl">Value → 0</label><input class="inp" id="rc-val0" placeholder="e.g. Male"/></div><div style="flex:1"><label class="lbl">Value → 1</label><input class="inp" id="rc-val1" placeholder="e.g. Female"/></div></div>';
      html+='<button class="btn btn-primary btn-sm" onclick="runRecodeBinary()">▶ Run</button>';
    } else if(aState.recodeType==='exact'){
      html+='<div style="max-height:180px;overflow-y:auto;margin:9px 0">';
      html+='<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:4px;font-size:10px;color:var(--ink-muted);margin-bottom:3px"><span>Original</span><span></span><span>New Value</span></div>';
      rcUniq.forEach((v,i)=>html+='<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:4px;align-items:center;margin-bottom:4px"><div style="padding:5px 8px;background:var(--surface-alt);border:1px solid var(--line-soft);border-radius:var(--r-sm);font-size:11.5px;color:var(--ink)">'+escHtml(String(v))+'</div><span style="color:var(--ink-subtle)">→</span><input class="inp" style="padding:5px 8px;font-size:11.5px" id="rc-exact-'+i+'" placeholder="new"/></div>');
      html+='</div><button class="btn btn-primary btn-sm" onclick="runRecodeExact('+escHtmlAttr(JSON.stringify(rcUniq))+')">▶ Run</button>';
    } else {
      html+='<div style="margin:9px 0">';
      for(let i=0;i<3;i++)html+='<div style="display:grid;grid-template-columns:1fr auto 1fr auto 1fr;gap:4px;align-items:center;margin-bottom:5px"><input class="inp" id="rc-from-'+i+'" placeholder="From" style="font-size:11px;padding:5px 8px"/><span style="color:var(--ink-subtle)">–</span><input class="inp" id="rc-to-'+i+'" placeholder="To" style="font-size:11px;padding:5px 8px"/><span style="color:var(--ink-subtle)">→</span><input class="inp" id="rc-new-'+i+'" placeholder="Label" style="font-size:11px;padding:5px 8px"/></div>';
      html+='</div><button class="btn btn-primary btn-sm" onclick="runRecodeRange(3)">▶ Run</button>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Preview</div>';
    const rcV=SE.validNums(data.map(r=>r[aState.recodeFld]));
    if(rcV.length)html+='<div class="stats-grid2">'+stCard('Min',Math.min(...rcV).toFixed(2))+stCard('Max',Math.max(...rcV).toFixed(2))+stCard('Mean',SE.mean(rcV).toFixed(2))+stCard('N Valid',rcV.length)+'</div>';
    if(rcUniq.length){
      html+='<div class="sec-hd-sub" style="margin-top:11px">Source Values ('+rcUniq.length+')</div>';
      html+=mkTable(['Value','Count'],rcUniq.slice(0,8).map(v=>[escHtml(String(v)),data.filter(r=>r[aState.recodeFld]===v).length]));
    } else {
      html+='<div class="chart-empty">Pilih variabel sumber untuk melihat ringkasan nilai.</div>';
    }
    html+='</div></div>';
  return html;
}

function renderFilterPreviewHtml(){
  const src=(typeof _origData!=='undefined'&&_origData)?_origData:data;
  const expr=(aState.filterExpr||'').trim();
  const missRows=data.filter(r=>vars.some(v=>isMiss(r[v.name]))).length;
  let matched=src;
  if(expr&&typeof safeFilter==='function'){
    matched=src.filter(r=>safeFilter(r,expr));
  }
  const excluded=src.length-matched.length;
  let out='<div class="stats-grid2" style="margin-bottom:10px">';
  out+=stCard('Total Rows',src.length);
  out+=stCard('Matching',matched.length,expr?'expression':'no filter');
  out+=stCard('Excluded',excluded);
  out+=stCard('With Missing',missRows,'active rows');
  out+='</div>';
  const showCols=vars.slice(0,4).map(v=>v.name);
  if(matched.length&&showCols.length){
    out+='<div class="sec-hd-sub" style="margin-top:4px">Sample Matching Rows</div>';
    out+=mkTable(showCols,matched.slice(0,5).map(r=>showCols.map(c=>r[c]===null||r[c]===undefined?'—':escHtml(String(r[c])))));
  } else {
    out+='<div class="chart-empty">Tidak ada baris yang cocok dengan ekspresi filter.</div>';
  }
  return out;
}
function updateFilterPreview(){
  const box=document.getElementById('filter-preview-box');
  if(box)box.innerHTML=renderFilterPreviewHtml();
}
function renderFilterForm(){
  let html='';
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Filter Cases'+ossGuideBtn('filter')+'</div>';
    html+='<div style="margin-bottom:10px"><label class="lbl">Filter Expression</label><input class="inp" style="font-family:var(--font-mono-stack)" value="'+escHtmlAttr(aState.filterExpr)+'" oninput="aState.filterExpr=this.value;updateFilterPreview()" placeholder="e.g. age > 25"/></div>';
    html+='<div class="row" style="gap:8px"><button class="btn btn-primary btn-sm" onclick="applyFilter()">▶ Run</button>';
    if(aState.filterActive)html+='<button class="btn btn-red btn-sm" onclick="clearFilter()">✕ Clear</button>';
    html+='</div>';
    if(aState.filterActive)html+='<div class="notice-box notice-warn" style="margin-top:9px">Active: '+escHtml(aState.filterExpr)+' ('+data.length+' rows)</div>';
    html+='<div class="sec-hd-sub" style="margin-top:14px">Quick Filters</div>';
    html+='<div style="display:flex;flex-direction:column;gap:6px">';
    [['Complete cases only','completeCases()'],['Remove outliers (IQR)','removeOutlierFilter()']].forEach(([l,fn])=>
      html+='<button class="btn btn-ghost btn-sm" style="text-align:left;justify-content:flex-start" onclick="'+fn+'">'+l+'</button>');
    html+='</div>';
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Preview</div><div id="filter-preview-box">'+renderFilterPreviewHtml()+'</div></div>';
    html+='</div>';
  return html;
}

function renderWeightcasesForm(){
  const nF=numFields();
  let html='';
    var wcNF=nF.filter(function(f){return f!=='';});
    var wcPreview=null;
    var wcVar=aState.wcVar;
    if(wcVar&&wcNF.includes(wcVar)){
      var wcVals=data.map(function(r){return Number(r[wcVar]);});
      var wcValid=wcVals.filter(function(v){return isFinite(v)&&v>0;});
      wcPreview={
        min:wcValid.length?Math.min.apply(null,wcValid).toFixed(4):'—',
        max:wcValid.length?Math.max.apply(null,wcValid).toFixed(4):'—',
        sum:wcValid.length?wcValid.reduce(function(a,b){return a+b;},0).toFixed(2):'—',
        nValid:wcValid.length,
        nZero:wcVals.filter(function(v){return v===0;}).length,
        nNeg:wcVals.filter(function(v){return isFinite(v)&&v<0;}).length,
        nMiss:wcVals.filter(function(v){return !isFinite(v);}).length,
        expandedN:Math.round(wcValid.reduce(function(a,b){return a+b;},0)),
        isInteger:wcValid.every(function(v){return Math.floor(v)===v;}),
      };
    }
    html+='<div class="grid2">';
    html+='<div class="card">';
    html+='<div class="sec-hd">Weight Cases'+ossGuideBtn('weightcases')+'</div>';
    if(aState.wcActive){
      html+='<div class="notice-box notice-warn" style="margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:9px">';
      html+='<div style="flex:1"><div style="font-size:12px;font-weight:700;color:var(--warn)">Weight Cases AKTIF</div>';
      html+='<div style="font-size:11px;color:var(--ink-muted);margin-top:2px">Variabel bobot: <b style="color:var(--gold-text)">'+escHtml(aState.wcVar)+'</b>, N efektif (ΣW): <b style="color:var(--ok)">'+getNEff()+'</b>, Baris asli: '+data.length+'</div></div>';
      html+='<button class="btn btn-red btn-sm" onclick="clearWeightCases()">✕ Off</button>';
      html+='</div>';
    }
    html+='<div style="margin-bottom:12px">';
    html+=mkSelect('wc-var',wcNF,aState.wcVar,'aState.wcVar=val;renderASub()','Variabel Bobot (Frequency Weight)');
    html+='</div>';
    html+='<div class="row" style="gap:7px">';
    html+='<button class="btn btn-primary btn-sm" onclick="runWeightCases()" '+(wcVar?'':'disabled')+'>▶ Run</button>';
    if(aState.wcActive)html+='<button class="btn btn-ghost btn-sm" onclick="clearWeightCases()">✕ Turn Off</button>';
    html+='</div>';
    html+='</div>';

    html+='<div class="card"><div class="sec-hd">Preview</div>';
    if(wcPreview){
      html+='<div class="stats-grid2" style="margin-bottom:12px">';
      html+=stCard('N Baris (raw)',data.length,'sebelum weighting');
      html+=stCard('N Efektif (∑w)',wcPreview.expandedN,'setelah weighting');
      html+=stCard('Min Weight',wcPreview.min,'');
      html+=stCard('Max Weight',wcPreview.max,'');
      html+='</div>';
      if(wcPreview.nZero>0){
        html+='<div class="notice-box notice-warn" style="margin-bottom:7px"><span>⚠</span> <span>'+wcPreview.nZero+' baris dengan bobot = 0 (dikecualikan)</span></div>';
      }
      if(wcPreview.nNeg>0){
        html+='<div class="notice-box notice-err" style="margin-bottom:7px">✗ '+wcPreview.nNeg+' baris memiliki bobot negatif</div>';
      }
      if(wcPreview.nMiss>0){
        html+='<div class="notice-box notice-warn" style="margin-bottom:7px"><span>⚠</span> <span>'+wcPreview.nMiss+' baris bobot missing</span></div>';
      }
      if(!wcPreview.isInteger){
        html+='<div class="notice-box notice-warn" style="margin-bottom:7px"><span>ℹ</span> <span>Bobot desimal terdeteksi — dibulatkan ke integer saat ekspansi.</span></div>';
      }
      if(wcPreview.nValid===0){
        html+='<div class="notice-box notice-err" style="margin-top:8px">✗ Tidak ada baris dengan bobot valid (&gt; 0)</div>';
      } else {
        html+='<div style="margin-top:10px">';
        html+='<div class="sec-hd-sub" style="margin-top:0">Distribusi Bobot</div>';
        var wv=data.map(function(r){return Number(r[wcVar]);}).filter(function(v){return isFinite(v)&&v>0;});
        var wFreq={};
        wv.forEach(function(v){var k=Math.round(v);wFreq[k]=(wFreq[k]||0)+1;});
        var wEntries=Object.entries(wFreq).sort(function(a,b){return Number(a[0])-Number(b[0]);}).slice(0,10);
        var wMaxF=Math.max.apply(null,wEntries.map(function(e){return e[1];}));
        wEntries.forEach(function(e){
          var pct=Math.round(e[1]/wMaxF*100);
          html+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">';
          html+='<span style="width:36px;text-align:right;font-size:10.5px;color:var(--gold-text);font-family:var(--font-mono-stack);font-variant-numeric:tabular-nums">'+e[0]+'</span>';
          html+='<div style="flex:1;height:10px;background:var(--surface-alt);border-radius:2px"><div style="width:'+pct+'%;height:100%;background:var(--gold);border-radius:2px"></div></div>';
          html+='<span style="font-size:10.5px;color:var(--ink-muted);width:32px;font-variant-numeric:tabular-nums">×'+e[1]+'</span>';
          html+='</div>';
        });
        html+='</div>';
      }
    } else {
      html+='<div class="chart-empty">Pilih variabel bobot untuk melihat preview.</div>';
    }
    html+='</div></div>';
  return html;
}

function renderImputeForm(){
  const nF=numFields();
  let html='';
    const impV=SE.validNums(data.map(r=>r[aState.imputeFld]));
    const impM=data.filter(r=>isMiss(r[aState.imputeFld])).length;
    let impVal='N/A';
    if(impV.length){const s=[...impV].sort((a,b)=>a-b);
      if(aState.imputeMethod==='mean')impVal=SE.mean(impV).toFixed(4);
      else if(aState.imputeMethod==='median')impVal=SE.quantile(s,.5).toFixed(4);
      else if(aState.imputeMethod==='zero')impVal='0';
      else if(aState.imputeMethod==='min')impVal=Math.min(...impV).toFixed(4);
      else if(aState.imputeMethod==='max')impVal=Math.max(...impV).toFixed(4);
      else if(aState.imputeMethod==='mode'){const fr={};impV.forEach(v=>{fr[v]=(fr[v]||0)+1;});impVal=Object.entries(fr).sort((a,b)=>b[1]-a[1])[0]?.[0]||'N/A';}
    }
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Missing Imputation'+ossGuideBtn('impute')+'</div>';
    html+=mkSelect('imp-fld',nF,aState.imputeFld,'aState.imputeFld=val;renderASub()','Variable');
    html+='<div style="margin-top:8px">'+mkCsel('imp-meth',['mean','median','mode','zero','min','max'],aState.imputeMethod,'aState.imputeMethod=val;renderASub()','Method')+'</div>';
    html+='<div class="stats-grid2" style="margin-top:11px">'+stCard('Missing Count',impM,data.length?((impM/data.length)*100).toFixed(1)+'%':'0%')+stCard('Impute Value',impVal,'replaces '+impM+' cells')+'</div>';
    html+='<div style="display:flex;gap:7px;margin-top:11px"><button class="btn btn-primary btn-sm" onclick="runImpute()" '+(impM===0?'disabled':'')+'>▶ Run</button><button class="btn btn-ghost btn-sm" onclick="imputeAllVars()">Impute All</button></div>';
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Preview</div>';
    html+='<div class="sec-hd-sub" style="margin-top:0">Missing Overview</div>';
    const numV=vars.filter(v=>v.type==='Numeric');
    if(numV.length&&data.length){
      numV.forEach(v=>{const mc=data.filter(r=>isMiss(r[v.name])).length,pct=(mc/data.length)*100;
        var barCol = pct>20?'var(--err)':pct>5?'var(--warn)':'var(--ok)';
        html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="width:72px;font-size:11px;color:var(--ink-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+escHtml(v.name)+'</span><div style="flex:1;height:7px;background:var(--surface-alt);border-radius:3px"><div style="width:'+pct+'%;height:100%;background:'+barCol+';border-radius:3px"></div></div><span style="font-size:10.5px;color:'+(mc>0?'var(--err)':'var(--ok)')+';width:26px;text-align:right;font-variant-numeric:tabular-nums">'+mc+'</span></div>';
      });
    } else {
      html+='<div class="chart-empty">Tidak ada variabel numerik untuk pratinjau missing.</div>';
    }
    html+='</div></div>';
  return html;
}

function renderMiForm(){
  const nF=numFields();
  let html='';
    if(!aState.miVars) aState.miVars=[];
    if(!aState.miM) aState.miM=5;
    if(!aState.miMethod) aState.miMethod='pmm';
    var missVars=nF.filter(function(v){return data.some(function(r){return isMiss(r[v]);});});
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Multiple Imputation (MICE)'+ossGuideBtn('mi')+'</div>';
    html+='<label class="lbl">Variables to Impute</label>';
    html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin:6px 0 10px">';
    nF.forEach(function(v){
      var mc=data.filter(function(r){return isMiss(r[v]);}).length;
      var sel=(aState.miVars||[]).includes(v);
      var hasMiss=mc>0;
      html+='<label class="chip-opt'+(sel?' sel':'')+'">';
      html+='<input type="checkbox" '+(sel?'checked':'')+' onchange="toggleMIVar(\''+escHtmlAttr(v)+'\',this.checked)" style="accent-color:var(--gold)"/>';
      html+='<span'+(hasMiss&&!sel?' style="color:var(--warn)"':'')+'>'+(hasMiss?'⚠ ':'')+escHtml(v)+(hasMiss?' ('+mc+')':'')+'</span>';
      html+='</label>';
    });
    html+='</div>';
    if(missVars.length&&(!aState.miVars||!aState.miVars.length)){
      html+='<button class="btn btn-ghost btn-sm" style="margin-bottom:10px" onclick="aState.miVars='+escHtmlAttr(JSON.stringify(missVars))+';renderASub()">Auto-select variables with missing</button>';
    }
    html+='<div class="grid2" style="gap:8px;margin-bottom:10px">';
    html+='<div><label class="lbl">M (# imputations)</label>';
    html+=mkOptCsel('mi-m',[{val:5,label:'5 (standard)'},{val:10,label:'10 (thorough)'},{val:20,label:'20 (high accuracy)'},{val:50,label:'50 (publication)'}],aState.miM,'aState.miM=parseInt(_cR["mi-m"]._vals[_cR["mi-m"].fields.indexOf(val)]);renderASub()','');
    html+='</div>';
    html+='<div><label class="lbl">Method</label>';
    html+=mkOptCsel('mi-method',[{val:'pmm',label:'PMM (Predictive Mean Matching)'},{val:'norm',label:'Bayesian Normal Regression'},{val:'mice_cart',label:'CART (non-linear)'}],aState.miMethod,'aState.miMethod=_cR["mi-method"]._vals[_cR["mi-method"].fields.indexOf(val)];renderASub()','');
    html+='</div></div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:4px" onclick="runMultipleImputation()">▶ Run</button>';
    html+='</div>';

    html+='<div class="card"><div class="sec-hd">Preview</div>';
    var mthd={'pmm':'PMM','norm':'Bayesian','mice_cart':'CART'}[aState.miMethod]||'PMM';
    if(aState.miVars&&aState.miVars.length){
      var totalMissSel=aState.miVars.reduce(function(acc,v){return acc+data.filter(function(r){return isMiss(r[v]);}).length;},0);
      html+='<div class="stats-grid2" style="margin-bottom:10px">';
      html+=stCard('Selected Vars',aState.miVars.length,nF.length+' numeric');
      html+=stCard('Imputations M',aState.miM,mthd);
      html+=stCard('Missing Cells',totalMissSel,data.length+' rows');
      html+=stCard('Pooled Method',"Rubin's Rules",'M='+aState.miM);
      html+='</div>';
      html+='<div class="sec-hd-sub" style="margin-top:4px">Selected Variables — Missing Pattern</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Variable</th><th style="text-align:right">N Missing</th><th style="text-align:right">% Missing</th><th>Method</th></tr></thead><tbody>';
      (aState.miVars||[]).forEach(function(v){
        var mc=data.filter(function(r){return isMiss(r[v]);}).length;
        var pct=data.length?(mc/data.length*100).toFixed(1):'0.0';
        var col=parseFloat(pct)>20?'var(--err)':parseFloat(pct)>5?'var(--warn)':'var(--ok)';
        html+='<tr><td class="td-label">'+escHtml(v)+'</td><td class="td-num" style="color:'+col+'">'+mc+'</td><td class="td-num" style="color:'+col+'">'+pct+'%</td><td style="font-size:11px;color:var(--gold-text)">'+mthd+'</td></tr>';
      });
      html+='</tbody></table></div>';
    } else {
      html+='<div class="chart-empty">Pilih variabel untuk melihat pola missing sebelum imputasi MICE.</div>';
    }
    html+='</div></div>';
  return html;
}

function renderCorrmatrixForm(){
  const nF=numFields();
  let html='';
    aState.cmFields=aState.cmFields.filter(function(f){return nF.includes(f);});
    if(!aState.cmFields.length)aState.cmFields=[...nF.slice(0,6)];
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Correlation Matrix'+ossGuideBtn('corrmatrix')+'</div>';
    html+='<label class="lbl">Variables (Numerik)</label>';
    html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:6px;margin-bottom:10px">';
    nF.forEach(f=>{const sel=aState.cmFields.includes(f);
      html+='<label class="chip-opt'+(sel?' sel':'')+'"><input type="checkbox" data-fld="'+escHtmlAttr(f)+'" '+(sel?'checked':'')+' onchange="toggleCMFieldEl(this)" style="accent-color:var(--gold)"/>'+escHtml(f)+'</label>';
    });
    html+='</div>';
    if(aState.cmFields.length>=2){
      const pairs=[];
      for(let i=0;i<aState.cmFields.length;i++)for(let j=i+1;j<aState.cmFields.length;j++){
        try{const r=SE.pearsonR(data.map(d=>d[aState.cmFields[i]]),data.map(d=>d[aState.cmFields[j]]));pairs.push([aState.cmFields[i]+'×'+aState.cmFields[j],r.r,r.p_fmt,r.strength,r.sig?'*':'ns']);}
        catch{pairs.push([aState.cmFields[i]+'×'+aState.cmFields[j],'—','—','—','—']);}
      }
      html+='<div class="sec-hd-sub" style="margin-top:6px">Pairwise Correlations</div>';
      html+=mkTable(['Pair','r','p','Strength','Sig'],pairs);
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Preview</div>';
    if(aState.cmFields.length>=2){
      html+='<div class="sec-hd-sub" style="margin-top:0">Correlation Heatmap</div>'+svgCorrMatrix(data,aState.cmFields);
    } else {
      html+='<div class="chart-empty">Pilih minimal 2 variabel numerik untuk menampilkan matriks korelasi.</div>';
    }
    html+='</div></div>';
  return html;
}

function renderPartialcorrForm(){
  const nF=numFields();
  let html='';
    if(!aState.pcX) aState.pcX=nF[0]||'';
    if(!aState.pcY) aState.pcY=nF[1]||nF[0]||'';
    if(!aState.pcZ) aState.pcZ=nF[2]||nF[0]||'';
    const pcPrv=(aState.pcX&&aState.pcY&&aState.pcZ&&aState.pcX!==aState.pcY&&aState.pcX!==aState.pcZ&&aState.pcY!==aState.pcZ)
      ?tryStats(()=>SE.partialCorr(data.map(r=>r[aState.pcX]),data.map(r=>r[aState.pcY]),data.map(r=>r[aState.pcZ]))):null;
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Partial Correlation'+ossGuideBtn('partialcorr')+'</div>';
    html+='<label class="lbl">Variable X</label>'+mkSelect('pc-x',nF,aState.pcX,'aState.pcX=val;renderASub()','Variable X');
    html+='<div style="margin-top:8px"><label class="lbl">Variable Y</label>'+mkSelect('pc-y',nF,aState.pcY,'aState.pcY=val;renderASub()','Variable Y')+'</div>';
    html+='<div style="margin-top:8px"><label class="lbl">Control Variable (Z)</label>'+mkSelect('pc-z',nF,aState.pcZ,'aState.pcZ=val;renderASub()','Control Variable Z')+'</div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runPartialCorr()">▶ Run</button>';
    if(pcPrv&&pcPrv._err){
      html+='<div class="notice-box notice-err" style="margin-top:9px">⚠ '+escHtml(pcPrv._err)+'</div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Preview</div>';
    if(pcPrv&&!pcPrv._err){
      html+='<div class="stats-grid2" style="margin-bottom:10px">'+stCard('Partial r',pcPrv.rp)+stCard('r²',pcPrv.r2,'Variance explained')+stCard('p',pcPrv.p_fmt)+stCard('95% CI',pcPrv.ci95)+'</div>';
      html+='<div class="row" style="margin-bottom:10px">'+sigBadge(pcPrv.p)+'<span class="tag tag-gray">'+pcPrv.strength+' '+(parseFloat(pcPrv.rp)>=0?'positive':'negative')+'</span><span class="tag tag-blue">Zero-order r(X,Y)='+pcPrv.rxy+'</span></div>';
    }
    html+='<div class="sec-hd-sub" style="margin-top:0">Scatter X vs Y</div>'+svgScatter(data,aState.pcX,aState.pcY);
    html+='</div></div>';
  return html;
}

function renderCanonicalcorrForm(){
  const nF=numFields();
  let html='';
    if(!aState.ccaXs) aState.ccaXs=[];
    if(!aState.ccaYs) aState.ccaYs=[];
    aState.ccaXs=aState.ccaXs.filter(function(f){return nF.includes(f);});
    aState.ccaYs=aState.ccaYs.filter(function(f){return nF.includes(f);});
    const ccaReady=aState.ccaXs.length>=1&&aState.ccaYs.length>=1;
    const ccaPrv=ccaReady?tryStats(()=>SE.canonicalCorr(aState.ccaXs,aState.ccaYs,data)):null;
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Canonical Correlation'+ossGuideBtn('canonicalcorr')+'</div>';
    html+='<label class="lbl">Set X (Predictor Variables)</label>';
    html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px;margin-bottom:12px">';
    nF.forEach(function(f){
      const sel=aState.ccaXs.includes(f);
      const disabledY=aState.ccaYs.includes(f);
      html+='<label class="chip-opt'+(sel?' sel':'')+(disabledY?' disabled':'')+'">'
        +'<input type="checkbox" '+(sel?'checked':'')+(disabledY?' disabled':'')+' onchange="toggleCCAField(this,\'x\')" data-fld="'+escHtmlAttr(f)+'" style="accent-color:var(--gold)"/>'+escHtml(f)+'</label>';
    });
    html+='</div>';
    html+='<label class="lbl">Set Y (Criterion Variables)</label>';
    html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px;margin-bottom:12px">';
    nF.forEach(function(f){
      const sel=aState.ccaYs.includes(f);
      const disabledX=aState.ccaXs.includes(f);
      html+='<label class="chip-opt'+(sel?' sel':'')+(disabledX?' disabled':'')+'">'
        +'<input type="checkbox" '+(sel?'checked':'')+(disabledX?' disabled':'')+' onchange="toggleCCAField(this,\'y\')" data-fld="'+escHtmlAttr(f)+'" style="accent-color:var(--gold)"/>'+escHtml(f)+'</label>';
    });
    html+='</div>';
    html+='<button class="btn btn-primary btn-sm" onclick="runCCA()" '+(ccaReady?'':'disabled style="opacity:.45"')+'>▶ Run</button>';
    if(ccaPrv&&ccaPrv._err){
      html+='<div class="notice-box notice-err" style="margin-top:9px">⚠ '+escHtml(ccaPrv.msg)+'</div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Preview</div>';
    if(ccaPrv&&!ccaPrv._err){
      html+='<div class="stats-grid2" style="margin-bottom:10px">';
      ccaPrv.tests.slice(0,2).forEach(function(t){
        html+=stCard('Rc'+t.root, t.rc, 'Rc²='+t.rc2+', '+t.p_fmt+(t.sig?' *':''));
      });
      html+=stCard('Cases n',ccaPrv.n,ccaPrv.p+'×'+ccaPrv.q);
      html+='</div>';
      html+='<div class="sec-hd-sub" style="margin-top:4px">Canonical Roots</div>';
      html+=mkTable(
        ['Root','Rc','Rc²',"Wilks' λ",'χ²','df','p'],
        ccaPrv.tests.map(function(t){return['F'+t.root,t.rc,t.rc2,t.wilks,t.chiSq,t.df,t.p_fmt];})
      );
      if(ccaPrv.xLoadings&&ccaPrv.xLoadings.length){
        html+='<div class="sec-hd-sub" style="margin-top:11px">Set X Structure Loadings (Root 1)</div>';
        html+=mkTable(['Variable','Loading r'],ccaPrv.xLoadings.map(function(x){return[escHtml(x.name),x.loadings[0]??'—'];}));
      }
      if(ccaPrv.yLoadings&&ccaPrv.yLoadings.length){
        html+='<div class="sec-hd-sub" style="margin-top:11px">Set Y Structure Loadings (Root 1)</div>';
        html+=mkTable(['Variable','Loading r'],ccaPrv.yLoadings.map(function(y){return[escHtml(y.name),y.loadings[0]??'—'];}));
      }
    } else {
      html+='<div class="chart-empty">Pilih minimal 1 variabel di Set X dan Set Y untuk melihat preview korelasi kanonik.</div>';
    }
    html+='</div></div>';
  return html;
}

function renderChartsForm(){
  const nF=numFields(),aF=allFields();
  let html='';
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Chart Settings'+ossGuideBtn('charts')+'</div>';
    html+=mkCsel('ch-type',['histogram','boxplot','scatter','qq'],aState.chType,'aState.chType=val;renderASub()','Chart Type');
    if(aState.chType!=='scatter')html+='<div style="margin-top:8px">'+mkSelect('ch-v',nF,aState.chV,'aState.chV=val;renderASub()','Variable')+'</div>';
    if(aState.chType==='boxplot')html+='<div style="margin-top:8px">'+mkSelect('ch-g',aF,aState.chG,'aState.chG=val;renderASub()','Group By')+'</div>';
    if(aState.chType==='scatter'){
      html+=mkSelect('sc-x',nF,aState.scX,'aState.scX=val;renderASub()','X Axis');
      html+='<div style="margin-top:8px">'+mkSelect('sc-y',nF,aState.scY,'aState.scY=val;renderASub()','Y Axis')+'</div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Preview</div>';
    if(aState.chType==='histogram')html+=svgHistogram(data,aState.chV);
    else if(aState.chType==='boxplot')html+=svgBoxplot(data,aState.chV,aState.chG);
    else if(aState.chType==='scatter')html+=svgScatter(data,aState.scX,aState.scY);
    else if(aState.chType==='qq')html+=svgQQ(data,aState.chV);
    html+='</div></div>';
  return html;
}

function renderGlmCountForm(){
  const nF=numFields(),aF=allFields();
  let html='';
    var isNB = currentASub==='glm-negbin';
    if(!aState.cntPreds) aState.cntPreds=[];
    var cntPreview=null;
    if(aState.cntDep&&aState.cntPreds.length){
      try{
        cntPreview = isNB ? SE.negbinReg(aState.cntDep,aState.cntPreds,data) : SE.poissonReg(aState.cntDep,aState.cntPreds,data);
      }catch(e){cntPreview={_err:e.message};}
    }
    html+='<div class="grid2">';
    html+='<div class="card">';
    html+='<div class="sec-hd">'+(isNB?'Negative Binomial':'Poisson')+' Regression'+ossGuideBtn(isNB?'glm-negbin':'glm-poisson')+'</div>';
    html+='<div style="margin-bottom:11px">';
    html+=mkSelect('cnt-dep',nF,aState.cntDep,'aState.cntDep=val;if(aState.cntPreds.indexOf(val)>=0){aState.cntPreds=aState.cntPreds.filter(function(x){return x!==val;});}renderASub()','Dependent Variable (count)');
    html+='</div>';
    html+='<div style="margin-bottom:12px">';
    html+='<label class="lbl">Predictor(s) <span style="color:var(--ink-muted)">— numeric or dummy-coded</span></label>';
    html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px">';
    [...nF,...aF].filter(function(f,i,arr){return arr.indexOf(f)===i;}).forEach(function(f){
      if(f===aState.cntDep) return;
      var sel=aState.cntPreds.includes(f);
      html+='<label class="chip-opt'+(sel?' sel':'')+'">'
        +'<input type="checkbox" '+(sel?'checked':'')
        +' onchange="toggleCntPred(this.dataset.fld,this.checked)" data-fld="'+escHtmlAttr(f)
        +'" style="accent-color:var(--gold)"/>'+escHtml(f)+'</label>';
    });
    html+='</div></div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="'+(isNB?'runNegBinGLM':'runPoissonGLM')+'()">▶ Run</button>';
    html+='</div>';

    html+='<div class="card"><div class="sec-hd">Preview</div>';
    if(cntPreview&&!cntPreview._err){
      html+='<div class="stats-grid2" style="margin-bottom:11px">';
      html+=stCard('N',cntPreview.n);
      html+=stCard('Log-Lik',cntPreview.logLik);
      html+=stCard('McFadden R²',cntPreview.mcFaddenR2);
      if(isNB) html+=stCard('θ (dispersion)',cntPreview.theta);
      else html+=stCard('Dispersion',cntPreview.dispersion);
      html+='</div>';
      html+='<div class="sec-hd-sub" style="margin-top:4px">Parameter Estimates</div>';
      html+=mkTable(['Predictor','β','SE','z','p','IRR','95% CI IRR'],
        cntPreview.coefs.map(function(c){return[escHtml(c.name),c.b,c.se,c.z,c.p,c.irr,c.irrCI];}));
      if(cntPreview.warnings&&cntPreview.warnings.length){
        html+='<div class="notice-box notice-warn" style="margin-top:8px">';
        cntPreview.warnings.forEach(function(w){html+='⚠ '+escHtml(w)+'<br>';});
        html+='</div>';
      }
    } else if(cntPreview&&cntPreview._err){
      html+='<div class="notice-box notice-err">⚠ '+escHtml(cntPreview._err)+'</div>';
    } else {
      html+='<div class="chart-empty">Pilih variabel dependen (count) dan minimal 1 prediktor untuk melihat preview koefisien &amp; IRR.</div>';
    }
    html+='</div></div>';
  return html;
}

function renderGlmForm(){
  const nF=numFields(),aF=allFields();
  let html='';
    aState.glmSubType = currentASub==='glm-multi' ? 'multivariate' : currentASub==='glm-rep' ? 'repeated' : 'univariate';
    if(!aState.glmMultiDeps) aState.glmMultiDeps=[];
    if(!aState.glmWithin) aState.glmWithin='';
    if(!aState.glmBetween) aState.glmBetween='';

    if(aState.glmSubType==='univariate'){
      var glmRes=null;
      if(aState.glmDep&&aState.glmFactors.length){
        try{glmRes=SE.glmUnivariate(data,aState.glmDep,aState.glmFactors,aState.glmCovs);}catch(e){glmRes={_err:e.message};}
      }
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">GLM Univariate'+ossGuideBtn('glm')+'</div>';
      html+='<div style="margin-bottom:10px">';
      html+=mkSelect('glm-dep',nF,aState.glmDep,'aState.glmDep=val;renderASub()','Dependent Variable');
      html+='</div>';
      html+='<div style="margin-bottom:10px">';
      html+='<label class="lbl">Fixed Factor(s) <span style="color:var(--ink-muted)">— categorical</span></label>';
      html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px">';
      aF.forEach(function(f){
        if(f===aState.glmDep) return;
        var sel=aState.glmFactors.includes(f);
        html+='<label class="chip-opt'+(sel?' sel':'')+'">'
          +'<input type="checkbox" '+(sel?'checked':'')
          +' onchange="toggleGlmFactor(this.dataset.fld,this.checked)" data-fld="'+escHtmlAttr(f)
          +'" style="accent-color:var(--gold)"/>'+escHtml(f)+'</label>';
      });
      html+='</div></div>';
      html+='<div style="margin-bottom:12px">';
      html+='<label class="lbl">Covariate(s) <span style="color:var(--ink-muted)">— continuous (optional)</span></label>';
      html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px">';
      nF.forEach(function(f){
        if(f===aState.glmDep) return;
        var sel=aState.glmCovs.includes(f);
        html+='<label class="chip-opt'+(sel?' sel':'')+'">'
          +'<input type="checkbox" '+(sel?'checked':'')
          +' onchange="toggleGlmCov(this.dataset.fld,this.checked)" data-fld="'+escHtmlAttr(f)
          +'" style="accent-color:var(--gold)"/>'+escHtml(f)+'</label>';
      });
      html+='</div></div>';
      html+='<button class="btn btn-primary btn-sm" onclick="runGLM()">▶ Run</button>';
      html+='</div>';

      html+='<div class="card"><div class="sec-hd">Preview</div>';
      if(glmRes&&!glmRes._err){
        html+='<div class="stats-grid2" style="margin-bottom:11px">';
        html+=stCard('N',glmRes.n)+stCard('R²',glmRes.R2)+stCard('Adj R²',glmRes.R2adj)+stCard('Grand Mean',glmRes.grandMean);
        html+='</div>';
        html+='<div class="sec-hd-sub" style="margin-top:4px">Tests of Between-Subjects Effects</div>';
        html+='<div class="tbl-wrap"><table><thead><tr>';
        ['Source','df','SS','MS','F','p','η²','Partial η²'].forEach(function(h,hi){
          html+='<th'+(hi>=1?' style="text-align:right"':'')+'>'+h+'</th>';
        });
        html+='</tr></thead><tbody>';
        glmRes.effects.forEach(function(e){
          var psig=e.sig;
          html+='<tr>';
          html+='<td class="td-label" style="font-weight:600;color:var(--ink)">'+escHtml(e.source)+(e.isCov?' <span class="tag tag-blue" style="font-size:9px">cov</span>':'')+'</td>';
          html+='<td class="td-num">'+e.df+'</td><td class="td-num">'+(e.SS||'—')+'</td><td class="td-num">'+(e.MS||'—')+'</td><td class="td-num">'+(e.F||'—')+'</td>';
          html+='<td class="td-num">'+(psig?'<b style="color:var(--ok)">':'')+e.p_fmt+(psig?'</b>':'')+'</td>';
          html+='<td class="td-num">'+(e.eta2||'—')+'</td><td class="td-num">'+(e.partialEta2||'—')+'</td>';
          html+='</tr>';
        });
        html+='<tr style="border-top:1px solid var(--line)"><td class="td-label" style="color:var(--ink-muted)">Error</td><td class="td-num">'+glmRes.dfError+'</td><td class="td-num">'+glmRes.ssError+'</td><td class="td-num">'+glmRes.msError+'</td><td></td><td></td><td></td><td></td></tr>';
        html+='</tbody></table></div>';
        glmRes.factors.forEach(function(fac){
          var levels=glmRes.factorLevels[fac];
          if(!levels) return;
          var eff=glmRes.effects.find(function(e){return e.source===fac;});
          if(!eff||!eff.groups) return;
          html+='<div class="sec-hd-sub" style="margin-top:11px">'+escHtml(fac)+' — Estimated Marginal Means</div>';
          html+='<div class="tbl-wrap"><table><thead><tr><th>'+escHtml(fac)+'</th><th style="text-align:right">N</th><th style="text-align:right">Mean</th><th style="text-align:right">SD</th><th style="text-align:right">95% CI</th></tr></thead><tbody>';
          levels.forEach(function(g){
            var gv=eff.groups[g];
            if(!gv||!gv.length) return;
            var gm=SE.mean(gv),gs=gv.length>=2?SE.std(gv):NaN,gn=gv.length;
            var se=(gn>0&&isFinite(gs))?gs/Math.sqrt(gn):0;
            var ci=isFinite(gs)?'['+SE.f4(gm-1.96*se)+', '+SE.f4(gm+1.96*se)+']':'N/A';
            html+='<tr><td class="td-str">'+escHtml(g)+'</td><td class="td-num">'+gn+'</td><td class="td-num">'+SE.f4(gm)+'</td><td class="td-num">'+(isFinite(gs)?SE.f4(gs):'N/A')+'</td><td class="td-num" style="font-size:11px;color:var(--ink-muted)">'+ci+'</td></tr>';
          });
          html+='</tbody></table></div>';
        });
      } else if(glmRes&&glmRes._err){
        html+='<div class="notice-box notice-err">'+escHtml(glmRes._err)+'</div>';
      } else {
        html+='<div class="chart-empty">Pilih DV numerik dan minimal 1 Fixed Factor untuk melihat preview model GLM.</div>';
      }
      html+='</div></div>';
    }

    else if(aState.glmSubType==='multivariate'){
      if(!aState.glmMultiDeps||!aState.glmMultiDeps.length) aState.glmMultiDeps=nF.slice(0,Math.min(2,nF.length));
      var manova=null;
      if(aState.glmMultiDeps.length>=2&&aState.glmFactors.length===1){
        try{ manova=SE.manovaProper(data,aState.glmMultiDeps,aState.glmFactors[0]); }catch(e){ manova={_err:e.message}; }
      }
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">MANOVA'+ossGuideBtn('glm-multi')+'</div>';
      html+='<div style="margin-bottom:10px">';
      html+='<label class="lbl">Dependent Variables <span style="color:var(--ink-muted)">(select ≥2 numeric)</span></label>';
      html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px">';
      nF.forEach(function(f){
        var sel=aState.glmMultiDeps.includes(f);
        html+='<label class="chip-opt'+(sel?' sel':'')+'">'
          +'<input type="checkbox" '+(sel?'checked':'')
          +' onchange="toggleGlmMultiDep(this.dataset.fld,this.checked)" data-fld="'+escHtmlAttr(f)
          +'" style="accent-color:var(--gold)"/>'+escHtml(f)+'</label>';
      });
      html+='</div></div>';
      html+='<div style="margin-bottom:12px">';
      html+='<label class="lbl">Between-Subjects Factor <span style="color:var(--ink-muted)">(select exactly 1)</span></label>';
      html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px">';
      aF.forEach(function(f){
        if(aState.glmMultiDeps.includes(f)) return;
        var sel=aState.glmFactors.includes(f);
        html+='<label class="chip-opt'+(sel?' sel':'')+'">'
          +'<input type="checkbox" '+(sel?'checked':'')
          +' onchange="toggleGlmFactor(this.dataset.fld,this.checked)" data-fld="'+escHtmlAttr(f)
          +'" style="accent-color:var(--gold)"/>'+escHtml(f)+'</label>';
      });
      html+='</div></div>';
      html+='<button class="btn btn-primary btn-sm" onclick="runMANOVA()">▶ Run</button>';
      html+='</div>';

      html+='<div class="card"><div class="sec-hd">Preview</div>';
      if(manova&&!manova._err){
        html+='<div class="sec-hd-sub" style="margin-top:0">Multivariate Tests</div>';
        html+='<div class="tbl-wrap"><table><thead><tr>';
        ['Test','Value','F','df1','df2','p',''].forEach(function(h2,hi){
          html+='<th'+(hi>=1&&hi<=5?' style="text-align:right"':'')+'>'+h2+'</th>';
        });
        html+='</tr></thead><tbody>';
        [
          ["Pillai's Trace",       manova.pillai],
          ["Wilks' Lambda",        manova.wilks],
          ['Hotelling-Lawley',     manova.hotelling],
          ["Roy's Greatest Root",  manova.roy],
        ].forEach(function(pair){
          var lbl=pair[0], t=pair[1];
          html+='<tr><td class="td-label" style="font-size:11.5px">'+escHtml(lbl)+'</td>';
          html+='<td class="td-num">'+t.stat+'</td><td class="td-num">'+t.F+'</td>';
          html+='<td class="td-num">'+t.df1+'</td><td class="td-num">'+t.df2+'</td>';
          html+='<td class="td-num">'+(t.sig?'<b style="color:var(--ok)">'+t.p_fmt+'</b>':t.p_fmt)+'</td>';
          html+='<td>'+(t.sig?'<span class="tag tag-green" style="font-size:9px">✓</span>':'<span style="font-size:10px;color:var(--ink-subtle)">ns</span>')+'</td>';
          html+='</tr>';
        });
        html+='</tbody></table></div>';
        html+='<div class="stats-grid2" style="margin-top:10px">'+stCard('η² (Pillai)',manova.pillaiEta2)+stCard("Box's M p",manova.boxP,manova.boxSig?'Heterogeneous':'Homogeneous')+'</div>';
      } else if(manova&&manova._err){
        html+='<div class="notice-box notice-err">'+escHtml(manova._err)+'</div>';
      } else if(aState.glmMultiDeps.length<2){
        html+='<div class="chart-empty">Pilih minimal 2 variabel dependen dan 1 faktor untuk melihat preview MANOVA.</div>';
      } else if(aState.glmFactors.length!==1){
        html+='<div class="notice-box notice-warn">⚠ Pilih tepat 1 between-subjects factor untuk MANOVA.</div>';
      }
      html+='</div></div>';
    }

    else if(aState.glmSubType==='repeated'){
      var rmRes=(aState.pairedA&&aState.pairedB&&aState.pairedA!==aState.pairedB)
        ?tryStats(function(){return SE.pairedTTest(SE.validNums(data.map(function(r){return r[aState.pairedA];})),SE.validNums(data.map(function(r){return r[aState.pairedB];})));})
        :null;
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">Repeated Measures'+ossGuideBtn('glm-rep')+'</div>';
      html+='<div style="margin-bottom:10px">';
      html+=mkSelect('rm-pre',nF,aState.pairedA,'aState.pairedA=val;renderASub()','Time Point 1 (Pre)');
      html+='</div>';
      html+='<div style="margin-bottom:10px">';
      html+=mkSelect('rm-post',nF,aState.pairedB,'aState.pairedB=val;renderASub()','Time Point 2 (Post)');
      html+='</div>';
      html+='<div style="margin-bottom:12px">';
      html+=mkSelect('rm-grp',['(none)',...aF],aState.glmBetween||'(none)','aState.glmBetween=val==="(none)"?"":val;renderASub()','Between-Subjects Factor (optional)');
      html+='</div>';
      html+='<button class="btn btn-primary btn-sm" onclick="runRepeatedMeasures()">▶ Run</button>';
      html+='</div>';

      html+='<div class="card"><div class="sec-hd">Preview</div>';
      if(rmRes&&!rmRes._err){
        html+='<div class="stats-grid2" style="margin-bottom:11px">';
        html+=stCard('Mean Diff',rmRes.meanDiff,'SE='+rmRes.se)+stCard('t',rmRes.t,'df='+rmRes.df);
        html+=stCard("Cohen's d",rmRes.cohensD,rmRes.dInterp)+stCard('p-value',rmRes.p_fmt,rmRes.sig?'Significant':'n.s.');
        html+='</div>';
        html+='<div class="row" style="margin-bottom:10px">'+sigBadge(rmRes.p)+'</div>';
        html+='<div class="sec-hd-sub" style="margin-top:4px">Pre vs Post</div>'+svgScatter(data,aState.pairedA,aState.pairedB);
      } else if(rmRes&&rmRes._err){
        html+='<div class="notice-box notice-err">'+escHtml(rmRes._err)+'</div>';
      } else {
        html+='<div class="chart-empty">Pilih variabel Pre dan Post untuk melihat preview perubahan within-subjects.</div>';
      }
      html+='</div></div>';
    }
  return html;
}

function renderHlmForm(){
  const nF=numFields(),aF=allFields();
  let html='';
    if(!aState.hlmDep)   aState.hlmDep   = nF[0]||'';
    if(!aState.hlmGroup) aState.hlmGroup = aF[0]||'';
    if(!aState.hlmL1Preds) aState.hlmL1Preds = [];
    if(!aState.hlmL2Preds) aState.hlmL2Preds = [];
    if(!aState.hlmGroup2)  aState.hlmGroup2  = aF[1]||aF[0]||'';
    if(!aState.hlmModelType) aState.hlmModelType = 'intercept';

    var hlmIccRes=(currentASub==='hlm-icc'&&aState.hlmDep&&aState.hlmGroup)
      ?tryStats(function(){return computeHLMICC(aState.hlmDep,aState.hlmGroup);})
      :null;
    var hlm2Res=(currentASub==='hlm-2level'&&aState.hlmDep&&aState.hlmGroup)
      ?tryStats(function(){return computeHLMTwoLevel(aState.hlmDep,aState.hlmGroup,aState.hlmL1Preds,aState.hlmL2Preds,aState.hlmModelType);})
      :null;
    var hlm3Res=(currentASub==='hlm-3level'&&aState.hlmDep&&aState.hlmGroup&&aState.hlmGroup2)
      ?tryStats(function(){return computeHLMThreeLevel(aState.hlmDep,aState.hlmGroup,aState.hlmGroup2,aState.hlmL1Preds);})
      :null;

    if(currentASub==='hlm-icc'){
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">ICC &amp; Variance Partitioning'+ossGuideBtn('hlm-icc')+'</div>';
      html+=mkSelect('hlm-dep-icc',nF,aState.hlmDep,'aState.hlmDep=val;renderASub()','Outcome Variable');
      html+='<div style="margin-top:8px">'+mkSelect('hlm-grp-icc',aF,aState.hlmGroup,'aState.hlmGroup=val;renderASub()','Level-2 Grouping Variable')+'</div>';
      html+='<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="runHLM()">▶ Run</button>';
      html+='</div>';

      html+='<div class="card"><div class="sec-hd">Preview</div>';
      if(hlmIccRes&&!hlmIccRes._err){
        var iccVal=parseFloat(hlmIccRes.ICC);
        var iccLabel=iccVal<.05?'Negligible clustering':iccVal<.10?'Small clustering':iccVal<.25?'Moderate clustering':'Strong clustering';
        html+='<div class="stats-grid2" style="margin-bottom:11px">';
        html+=stCard('ICC (1)',hlmIccRes.ICC,iccLabel)+stCard('ICC (2)',hlmIccRes.ICC2,'Group-mean reliability');
        html+=stCard('τ₀₀ (Between)',hlmIccRes.varBetween,hlmIccRes.pctBetween+'% | σ²='+hlmIccRes.varWithin)+stCard('Design Effect',hlmIccRes.design_effect,'Eff N='+hlmIccRes.effectiveN+' | F='+hlmIccRes.F+(hlmIccRes.sig?' *':''));
        html+='</div>';
        if(hlmIccRes.grpStats&&hlmIccRes.grpStats.length){
          html+='<div class="sec-hd-sub" style="margin-top:4px">Group-Level Descriptives (k='+hlmIccRes.k+')</div>';
          html+='<div class="tbl-wrap"><table><thead><tr><th>Group</th><th style="text-align:right">n</th><th style="text-align:right">Mean</th><th style="text-align:right">SD</th></tr></thead><tbody>';
          hlmIccRes.grpStats.slice(0,12).forEach(function(g){
            html+='<tr><td class="td-str">'+escHtml(g.group)+'</td><td class="td-num">'+g.n+'</td><td class="td-num">'+g.mean+'</td><td class="td-num">'+g.sd+'</td></tr>';
          });
          html+='</tbody></table></div>';
        }
      } else if(hlmIccRes&&hlmIccRes._err){
        html+='<div class="notice-box notice-err">⚠ '+escHtml(hlmIccRes._err)+'</div>';
      } else {
        html+='<div class="chart-empty">Pilih outcome dan variabel pengelompokan Level-2 untuk menghitung ICC preview.</div>';
      }
      html+='</div></div>';
    }

    else if(currentASub==='hlm-2level'){
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">Two-Level HLM'+ossGuideBtn('hlm-2level')+'</div>';
      html+='<div style="margin-bottom:9px">'+mkSelect('hlm2-dep',nF,aState.hlmDep,'aState.hlmDep=val;renderASub()','Outcome (Level-1 numeric)')+'</div>';
      html+='<div style="margin-bottom:9px">'+mkSelect('hlm2-grp',aF,aState.hlmGroup,'aState.hlmGroup=val;renderASub()','Level-2 Grouping (cluster ID)')+'</div>';
      html+='<div style="margin-bottom:9px"><label class="lbl">Level-1 Predictors <span style="color:var(--ink-muted)">(within-group)</span></label>';
      html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px">';
      nF.forEach(function(f){
        if(f===aState.hlmDep) return;
        var sel=aState.hlmL1Preds.includes(f);
        html+='<label class="chip-opt'+(sel?' sel':'')+'">'
          +'<input type="checkbox" '+(sel?'checked':'')
          +' onchange="toggleHlmL1(this.dataset.fld,this.checked)" data-fld="'+escHtmlAttr(f)
          +'" style="accent-color:var(--gold)"/>'+escHtml(f)+'</label>';
      });
      html+='</div></div>';
      html+='<div style="margin-bottom:12px"><label class="lbl">Level-2 Predictors <span style="color:var(--ink-muted)">(between-group)</span></label>';
      html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px">';
      nF.filter(function(f,i,a){return a.indexOf(f)===i&&f!==aState.hlmDep&&f!==aState.hlmGroup&&!aState.hlmL1Preds.includes(f);}).forEach(function(f){
        var sel=aState.hlmL2Preds.includes(f);
        html+='<label class="chip-opt'+(sel?' sel':'')+'">'
          +'<input type="checkbox" '+(sel?'checked':'')
          +' onchange="toggleHlmL2(this.dataset.fld,this.checked)" data-fld="'+escHtmlAttr(f)
          +'" style="accent-color:var(--gold)"/>'+escHtml(f)+'</label>';
      });
      html+='</div></div>';
      html+='<div style="margin-bottom:12px">';
      html+=mkOptCsel('hlm-modeltype',
        [{val:'intercept',label:'Random Intercept'},{val:'slopes',label:'Random Slopes'},{val:'crosslevel',label:'Cross-Level Interaction'}],
        aState.hlmModelType,
        'aState.hlmModelType=_cR["hlm-modeltype"]._vals[_cR["hlm-modeltype"].fields.indexOf(val)];renderASub()',
        'Model Type');
      html+='</div>';
      html+='<button class="btn btn-primary btn-sm" onclick="runHLM()">▶ Run</button>';
      html+='</div>';

      html+='<div class="card"><div class="sec-hd">Preview</div>';
      if(hlm2Res&&!hlm2Res._err){
        html+='<div class="stats-grid2" style="margin-bottom:11px">';
        html+=stCard('Conditional ICC',hlm2Res.ICC,'Null ICC='+hlm2Res.ICC_null)+stCard('Pseudo-R² (L1 / L2)',hlm2Res.pseudoR2_L1+' / '+hlm2Res.pseudoR2_L2,'Variance explained');
        html+=stCard('τ₀₀ / σ²',hlm2Res.varBetween+' / '+hlm2Res.varWithin,(hlm2Res.tau11!==null?'τ₁₁ slope='+hlm2Res.tau11:'Random intercept'))+stCard('AIC / BIC',hlm2Res.AIC+' / '+hlm2Res.BIC,'-2LL='+hlm2Res.deviance);
        html+='</div>';
        if(hlm2Res.fixedEffects&&hlm2Res.fixedEffects.length){
          html+='<div class="sec-hd-sub" style="margin-top:4px">Fixed Effects (IGLS)</div>';
          html+=mkTable(['Parameter','Level','γ','SE','t','p'],hlm2Res.fixedEffects.map(function(fe){
            return[escHtml(fe.name),escHtml(fe.level),fe.gamma,fe.se,fe.t,fe.p_fmt+(fe.sig?' *':'')];
          }));
        }
      } else if(hlm2Res&&hlm2Res._err){
        html+='<div class="notice-box notice-err">⚠ '+escHtml(hlm2Res._err)+'</div>';
      } else {
        html+='<div class="chart-empty">Pilih Outcome dan Level-2 Grouping untuk melihat preview Two-Level HLM.</div>';
      }
      html+='</div></div>';
    }

    else if(currentASub==='hlm-3level'){
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">Three-Level HLM'+ossGuideBtn('hlm-3level')+'</div>';
      html+='<div style="margin-bottom:9px">'+mkSelect('hlm3-dep',nF,aState.hlmDep,'aState.hlmDep=val;renderASub()','Outcome (Level-1 numeric)')+'</div>';
      html+='<div style="margin-bottom:9px">'+mkSelect('hlm3-grp',aF,aState.hlmGroup,'aState.hlmGroup=val;renderASub()','Level-2 Grouping')+'</div>';
      html+='<div style="margin-bottom:9px">'+mkSelect('hlm3-grp2',aF,aState.hlmGroup2,'aState.hlmGroup2=val;renderASub()','Level-3 Grouping')+'</div>';
      html+='<div style="margin-bottom:12px"><label class="lbl">Level-1 Predictors</label>';
      html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px">';
      nF.forEach(function(f){
        if(f===aState.hlmDep) return;
        var sel=aState.hlmL1Preds.includes(f);
        html+='<label class="chip-opt'+(sel?' sel':'')+'">'
          +'<input type="checkbox" '+(sel?'checked':'')
          +' onchange="toggleHlmL1(this.dataset.fld,this.checked)" data-fld="'+escHtmlAttr(f)
          +'" style="accent-color:var(--gold)"/>'+escHtml(f)+'</label>';
      });
      html+='</div></div>';
      html+='<button class="btn btn-primary btn-sm" onclick="runHLM()">▶ Run</button>';
      html+='</div>';

      html+='<div class="card"><div class="sec-hd">Preview</div>';
      if(hlm3Res&&!hlm3Res._err){
        html+='<div class="stats-grid2" style="margin-bottom:11px">';
        html+=stCard('ICC (L3)',hlm3Res.ICC_L3,'τ_β='+hlm3Res.varL3+' ('+hlm3Res.vpcL3+'%)');
        html+=stCard('ICC (L2|L3)',hlm3Res.ICC_L2_within_L3,'τ_π='+hlm3Res.varL2+' ('+hlm3Res.vpcL2+'%)');
        html+=stCard('σ² (L1 Residual)',hlm3Res.varL1,hlm3Res.vpcL1+'% | Grand Mean='+hlm3Res.grandMean);
        html+=stCard('Hierarchy (K3 / J2)',hlm3Res.k3+' / '+hlm3Res.k2,'N='+hlm3Res.n+' | AIC='+hlm3Res.AIC);
        html+='</div>';
        if(hlm3Res.fixedEffects&&hlm3Res.fixedEffects.length){
          html+='<div class="sec-hd-sub" style="margin-top:4px">Fixed Effects (3-Level GLS)</div>';
          html+=mkTable(['Parameter','Level','γ','SE','t','p'],hlm3Res.fixedEffects.map(function(fe){
            return[escHtml(fe.name),escHtml(fe.level),fe.gamma,fe.se,fe.t,fe.p_fmt+(fe.sig?' *':'')];
          }));
        }
      } else if(hlm3Res&&hlm3Res._err){
        html+='<div class="notice-box notice-err">⚠ '+escHtml(hlm3Res._err)+'</div>';
      } else {
        html+='<div class="chart-empty">Pilih Outcome, Level-2 Grouping, dan Level-3 Grouping yang berbeda untuk melihat preview Three-Level HLM.</div>';
      }
      html+='</div></div>';
    }
  return html;
}

function renderEfaForm(){
  const nF=numFields();
  let html='';
    if(aState.efaVars===null||aState.efaVars===undefined) aState.efaVars=nF.slice(0,Math.min(5,nF.length));
    if(!aState.efaFactors) aState.efaFactors=2;
    if(!aState.efaRotation) aState.efaRotation='varimax';

    var efaPreview=null;
    if(aState.efaVars.length>=2&&aState.efaFactors>=1&&aState.efaFactors<=aState.efaVars.length){
      efaPreview=tryStats(function(){
        var matrix=aState.efaVars.map(function(v){return SE.validNums(data.map(function(r){return r[v];}));});
        var minLen=Math.min.apply(null,matrix.map(function(m){return m.length;}));
        matrix=matrix.map(function(m){return m.slice(0,minLen);});
        return SE.efa(matrix,aState.efaFactors,aState.efaRotation);
      });
    }

    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Exploratory Factor Analysis'+ossGuideBtn('efa')+'</div>';
    html+='<div style="margin-bottom:10px"><label class="lbl">Variables <span style="color:var(--ink-muted)">(select ≥2 numeric)</span></label>';
    html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px;max-height:160px;overflow-y:auto">';
    nF.forEach(function(f){
      var sel=aState.efaVars.includes(f);
      html+='<label class="chip-opt'+(sel?' sel':'')+'">'
        +'<input type="checkbox" '+(sel?'checked':'')
        +' onchange="toggleEfaVar(this.dataset.fld,this.checked)" data-fld="'+escHtmlAttr(f)
        +'" style="accent-color:var(--gold)"/>'+escHtml(f)+'</label>';
    });
    html+='</div></div>';
    html+='<div class="row" style="gap:11px;margin-bottom:10px">';
    html+='<div style="flex:1"><label class="lbl">Number of Factors</label>';
    html+='<input class="inp" type="number" min="1" max="'+(aState.efaVars.length||10)+'" value="'+aState.efaFactors+'" oninput="aState.efaFactors=Math.max(1,Math.min(parseInt(this.value)||2,aState.efaVars.length||1));renderASub()" style="width:100%"/></div>';
    html+='<div style="flex:1">'+mkCsel('efa-rot',['varimax','none'],aState.efaRotation,'aState.efaRotation=val;renderASub()','Rotation')+'</div>';
    html+='</div>';
    html+='<button class="btn btn-primary btn-sm" onclick="runEFA()">▶ Run</button>';
    if(efaPreview&&!efaPreview._err){
      var kmoColor=parseFloat(efaPreview.kmo)>=0.7?'var(--ok)':parseFloat(efaPreview.kmo)>=0.5?'var(--warn)':'var(--err)';
      html+='<div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px">';
      html+='<div class="sb"><div class="sb-label">KMO</div><div class="sb-value" style="color:'+kmoColor+'">'+efaPreview.kmo+'</div><div style="font-size:11px;color:'+kmoColor+';margin-top:2px">'+efaPreview.kmoInterp+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Bartlett χ²</div><div class="sb-value">'+efaPreview.chi2+'</div><div style="font-size:11px;color:'+(efaPreview.bartSig?'var(--ok)':'var(--err)')+'">df='+efaPreview.bartDf+', p='+(efaPreview.bartP||'N/A')+'</div></div>';
      html+='</div>';
    }
    if(efaPreview&&efaPreview._err){
      html+='<div class="miss-warn" style="margin-top:10px">'+escHtml(efaPreview.msg)+'</div>';
    }
    html+='</div>';

    html+='<div class="card"><div class="sec-hd">Preview</div>';
    if(efaPreview&&!efaPreview._err){
      html+='<div class="sec-hd-sub" style="margin-top:0">Scree Plot &amp; Eigenvalues</div>';
      html+=svgScreePlot(efaPreview.eigenvalues,efaPreview.nFactors);
      html+='<div class="tbl-wrap" style="margin-top:10px"><table><thead><tr><th>Factor</th><th style="text-align:right">Eigenvalue</th><th style="text-align:right">Variance %</th><th style="text-align:right">Cumulative %</th></tr></thead><tbody>';
      efaPreview.eigenvalues.forEach(function(ev,i){
        var isSel=i<efaPreview.nFactors;
        html+='<tr'+(isSel?' class="selected"':'')+'>';
        html+='<td class="td-label" style="color:'+(isSel?'var(--ink)':'var(--ink-muted)')+'">F'+(i+1)+'</td>';
        html+='<td class="td-num" style="color:'+(parseFloat(ev)>1?'var(--ink)':'var(--ink-muted)')+';font-weight:'+(parseFloat(ev)>1?700:400)+'">'+ev+'</td>';
        html+='<td class="td-num">'+(efaPreview.varExp[i]||'—')+'%</td>';
        html+='<td class="td-num">'+(efaPreview.cumVar[i]||'—')+'%</td>';
        html+='</tr>';
      });
      html+='</tbody></table></div>';
      html+='<div class="sec-hd-sub" style="margin-top:12px">Factor Loading Matrix ('+efaPreview.rotation+')</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Variable</th>';
      for(var f=0;f<efaPreview.nFactors;f++) html+='<th style="text-align:right">F'+(f+1)+'</th>';
      html+='<th style="text-align:right">h²</th></tr></thead><tbody>';
      aState.efaVars.forEach(function(v,i){
        html+='<tr><td class="td-label">'+escHtml(v)+'</td>';
        efaPreview.loadings[i].forEach(function(l){
          var absL=Math.abs(parseFloat(l));
          var highlight=absL>=0.4;
          var col=absL>=0.6?'var(--ok)':absL>=0.4?'var(--gold-text)':'var(--ink-muted)';
          html+='<td class="td-num" style="color:'+col+';font-weight:'+(highlight?700:400)+'">'+l+'</td>';
        });
        html+='<td class="td-num" style="color:var(--ink)">'+efaPreview.communalities[i]+'</td>';
        html+='</tr>';
      });
      html+='</tbody></table></div>';
    } else {
      html+='<div class="chart-empty">Pilih minimal 2 variabel numerik untuk melihat scree plot &amp; loading matrix.</div>';
    }
    html+='</div></div>';
  return html;
}

function renderCfaForm(){
  const nF=numFields();
  var T=ossChartTheme();
  let html='';
    if(!aState.cfaVars||!Array.isArray(aState.cfaVars)) aState.cfaVars=nF.slice(0,Math.min(6,nF.length));
    if(!aState.cfaFactors||aState.cfaFactors<1) aState.cfaFactors=1;
    if(!aState.cfaFactorNames||aState.cfaFactorNames.length!==aState.cfaFactors){
      aState.cfaFactorNames=[];
      for(var fi=0;fi<aState.cfaFactors;fi++) aState.cfaFactorNames.push('F'+(fi+1));
    }
    if(!aState.cfaFactorMap||typeof aState.cfaFactorMap!=='object') aState.cfaFactorMap={};
    var newMap={};
    aState.cfaFactorNames.forEach(function(fn){
      newMap[fn]=aState.cfaFactorMap[fn]||[];
    });
    aState.cfaFactorMap=newMap;

    var cfaPreview=null;
    var cfaReady=Object.keys(aState.cfaFactorMap).some(function(fn){return aState.cfaFactorMap[fn].length>=2;});
    if(cfaReady){
      cfaPreview=tryStats(function(){
        var allVars=[];
        aState.cfaFactorNames.forEach(function(fn){aState.cfaFactorMap[fn].forEach(function(v){if(!allVars.includes(v))allVars.push(v);});});
        var matrix=allVars.map(function(v){return SE.validNums(data.map(function(r){return r[v];}));});
        var minLen=Math.min.apply(null,matrix.map(function(m){return m.length;}));
        matrix=matrix.map(function(m){return m.slice(0,minLen);});
        return SE.cfa(matrix,aState.cfaFactorMap);
      });
    }

    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Confirmatory Factor Analysis (CFA)'+ossGuideBtn('cfa')+'</div>';
    html+='<div style="margin-bottom:10px">'+mkCsel('cfa-nfac',['1','2','3','4','5'],String(aState.cfaFactors),'setCfaFactors(parseInt(val))','Jumlah Faktor Laten')+'</div>';

    aState.cfaFactorNames.forEach(function(fn, fi){
      var factColor=T.series[fi%T.series.length];
      html+='<div class="notice-box" style="margin-bottom:12px;border-top:2px solid '+factColor+'">';
      html+='<div style="display:flex;align-items:center;gap:7px;margin-bottom:8px">';
      html+='<input class="inp" style="flex:1;font-weight:700;font-size:12.5px;padding:5px 9px" value="'+escHtmlAttr(fn)+'" oninput="renameCfaFactor('+fi+',this.value)" placeholder="Nama Faktor"/>';
      html+='</div>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-bottom:6px">Indikator <b style="color:var(--ink)">'+escHtml(fn)+'</b> (min 2):</div>';
      html+='<div style="display:flex;flex-wrap:wrap;gap:4px">';
      nF.forEach(function(v){
        var assigned=aState.cfaFactorMap[fn]&&aState.cfaFactorMap[fn].includes(v);
        html+='<label class="chip-opt'+(assigned?' sel':'')+'">'
          +'<input type="checkbox" '+(assigned?'checked':'')
          +' data-fn="'+escHtmlAttr(fn)+'" data-v="'+escHtmlAttr(v)+'" onchange="toggleCfaVar(this.dataset.fn,this.dataset.v,this.checked)" style="accent-color:var(--gold)"/>'+escHtml(v)+'</label>';
      });
      html+='</div>';
      var cnt=aState.cfaFactorMap[fn]?aState.cfaFactorMap[fn].length:0;
      if(cnt<2) html+='<div style="font-size:11px;color:var(--err);margin-top:5px">⚠ Min 2 indikator per faktor</div>';
      html+='</div>';
    });

    html+='<button class="btn btn-primary btn-sm" onclick="runCFA()" style="margin-top:4px">▶ Run</button>';
    html+='</div>';

    html+='<div class="card"><div class="sec-hd">Preview</div>';
    if(!cfaReady){
      html+='<div class="chart-empty" style="padding:32px 12px">Assign min 2 indikator ke faktor untuk melihat preview fit indices &amp; loadings.</div>';
    } else if(cfaPreview&&cfaPreview._err){
      html+='<div class="miss-warn">'+escHtml(cfaPreview.msg)+'</div>';
    } else if(cfaPreview){
      var r=cfaPreview;
      var fitStr=(r.overallFit||'').toLowerCase();
      var fitCls=fitStr.indexOf('good')>=0||fitStr.indexOf('excellent')>=0?'notice-ok':fitStr.indexOf('accept')>=0?'notice-warn':'notice-err';
      var fitCol=fitCls==='notice-ok'?'var(--ok)':fitCls==='notice-warn'?'var(--warn)':'var(--err)';
      html+='<div class="notice-box '+fitCls+'" style="margin-bottom:12px;text-align:center">';
      html+='<div style="font-size:15px;font-weight:700;color:'+fitCol+';font-family:var(--font-serif-stack)">'+r.overallFit+'</div>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-top:2px">N='+r.n+', '+r.p+' vars, '+r.nFactors+' factor'+(r.nFactors>1?'s':'')+' · χ²('+r.dfModel+')='+r.chiSq+', p='+r.pChiSq+'</div>';
      html+='</div>';

      function fitCard(name, val, interp, color){
        return '<div class="sb"><div class="sb-label">'+escHtml(name)+'</div>'
          +'<div class="sb-value" style="color:'+color+'">'+val+'</div>'
          +'<div style="font-size:11px;color:'+color+';margin-top:2px">'+interp+'</div></div>';
      }
      var cficol=r.CFI_raw>=0.95?'var(--ok)':r.CFI_raw>=0.90?'var(--warn)':'var(--err)';
      var tlicol=r.TLI_raw>=0.95?'var(--ok)':r.TLI_raw>=0.90?'var(--warn)':'var(--err)';
      var rmsecol=r.RMSEA_raw<=0.05?'var(--ok)':r.RMSEA_raw<=0.08?'var(--warn)':'var(--err)';
      var srmrcol=r.SRMR_raw<=0.05?'var(--ok)':r.SRMR_raw<=0.08?'var(--warn)':'var(--err)';
      html+='<div class="stats-grid2" style="margin-bottom:10px">';
      html+=fitCard('CFI',r.CFI,r.CFIinterp,cficol);
      html+=fitCard('TLI (NNFI)',r.TLI,r.TLIinterp,tlicol);
      html+=fitCard('RMSEA',r.RMSEA,r.RMSEAinterp+' ['+r.RMSEA_lo+', '+r.RMSEA_hi+']',rmsecol);
      html+=fitCard('SRMR',r.SRMR,r.SRMRinterp,srmrcol);
      html+='</div>';

      html+='<div class="sec-hd-sub" style="margin-top:12px">Factor Loadings (Standardized)</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Faktor</th><th>Indikator</th><th style="text-align:right">λ</th><th style="text-align:right">h²</th><th>Status</th></tr></thead><tbody>';
      r.factorNames.forEach(function(fn, fi){
        var factColor=T.series[fi%T.series.length];
        var varsL=r.factorMap[fn]||[];
        varsL.forEach(function(v, vi){
          var vIdx=r.varNames.indexOf(v);
          var lam=vIdx>=0?r.lambda[vIdx][fi]:null;
          var h2=vIdx>=0?r.communalities[vIdx]:null;
          var lamNum=lam!==null?parseFloat(lam):null;
          var lamCol=lamNum!==null?(Math.abs(lamNum)>=0.7?'var(--ok)':Math.abs(lamNum)>=0.5?'var(--ink)':Math.abs(lamNum)>=0.3?'var(--warn)':'var(--err)'):'var(--ink-muted)';
          var h2num=h2!==null?parseFloat(h2):null;
          var h2col=h2num!==null?(h2num>=0.7?'var(--ok)':h2num>=0.4?'var(--warn)':'var(--err)'):'var(--ink-muted)';
          html+='<tr>';
          if(vi===0) html+='<td class="td-label" rowspan="'+varsL.length+'" style="color:'+factColor+';font-weight:700;vertical-align:top;padding-top:10px">'+escHtml(fn)+'</td>';
          html+='<td class="td-label">'+escHtml(v)+'</td>';
          html+='<td class="td-num" style="color:'+lamCol+';font-weight:'+(Math.abs(lamNum||0)>=0.5?700:400)+'">'+(lam!==null?lam:'—')+'</td>';
          html+='<td class="td-num" style="color:'+h2col+'">'+(h2!==null?h2:'—')+'</td>';
          html+='<td><span class="tag '+(lamNum!==null&&Math.abs(lamNum)>=0.5?'tag-green':'tag-red')+'">'+(lamNum!==null&&Math.abs(lamNum)>=0.5?'✓ Adequate':'✗ Weak')+'</span></td>';
          html+='</tr>';
        });
      });
      html+='</tbody></table></div>';

      html+='<div class="sec-hd-sub" style="margin-top:12px">Residual Correlation Matrix (R − Σ̂)</div>';
      html+='<div class="tbl-wrap"><table style="font-size:11.5px"><thead><tr><th></th>';
      r.varNames.forEach(function(v){ html+='<th style="text-align:right">'+escHtml(v)+'</th>'; });
      html+='</tr></thead><tbody>';
      r.varNames.forEach(function(v, i){
        html+='<tr><td class="td-label">'+escHtml(v)+'</td>';
        r.varNames.forEach(function(vj, j){
          var resid=r.R[i][j]-r.Sigma[i][j];
          var absR=Math.abs(resid);
          var col=absR>0.1?'var(--err)':absR>0.05?'var(--warn)':'var(--ink-muted)';
          html+='<td class="td-num" style="color:'+col+'">'+SE.f4(resid)+'</td>';
        });
        html+='</tr>';
      });
      html+='</tbody></table></div>';
    }
    html+='</div></div>';
  return html;
}

function renderMediationForm(){
  const nF=numFields();
  let html='';
    if(!aState.medM) aState.medM=[];
    if(!aState.medBootN) aState.medBootN=5000;

    var medPreview=null;
    var canPreview=aState.medX&&aState.medY&&aState.medM.length>=1;
    if(canPreview){
      medPreview=tryStats(function(){return computeMediation(aState.medX,aState.medM,aState.medY,500);});
    }

    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Mediation Analysis'+ossGuideBtn('mediation')+'</div>';
    html+='<div style="margin-bottom:9px"><label class="lbl">Independent Variable (X)</label>'+mkSelect('med-x',nF,aState.medX,'aState.medX=val;renderASub()','Select X')+'</div>';
    html+='<div style="margin-bottom:9px"><label class="lbl">Dependent Variable (Y)</label>'+mkSelect('med-y',nF,aState.medY,'aState.medY=val;renderASub()','Select Y')+'</div>';
    html+='<div style="margin-bottom:9px"><label class="lbl">Mediator(s) (M)</label>';
    html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px">';
    nF.forEach(function(f){
      if(f===aState.medX||f===aState.medY) return;
      var sel=aState.medM.includes(f);
      html+='<label class="chip-opt'+(sel?' sel':'')+'">'
        +'<input type="checkbox" '+(sel?'checked':'')
        +' onchange="toggleMedM(this.dataset.fld,this.checked)" data-fld="'+escHtmlAttr(f)
        +'" style="accent-color:var(--gold)"/>'+escHtml(f)+'</label>';
    });
    html+='</div></div>';
    html+='<div style="margin-bottom:10px"><label class="lbl">Bootstrap Samples</label>';
    html+='<div style="display:flex;gap:6px;flex-wrap:wrap">';
    [1000,2000,5000].forEach(function(n){
      html+='<button class="btn btn-sm '+(aState.medBootN===n?'btn-active':'btn-ghost')+'" onclick="aState.medBootN='+n+';renderASub()">'+n+'</button>';
    });
    html+='</div></div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:4px" onclick="runMediation()">▶ Run</button>';
    html+='</div>';

    html+='<div class="card"><div class="sec-hd">Preview</div>';
    html+='<div class="notice-box" style="margin-bottom:12px;padding:10px;text-align:center">';
    html+=svgMediationPath(aState.medX||'X',aState.medM,aState.medY||'Y',medPreview);
    html+='</div>';
    if(!canPreview){
      html+='<div class="chart-empty">Pilih X, Y, dan minimal 1 Mediator untuk melihat preview jalur mediasi.</div>';
    } else if(medPreview&&medPreview._err){
      html+='<div class="miss-warn">'+escHtml(medPreview.msg)+'</div>';
    } else if(medPreview){
      html+='<div class="sec-hd-sub" style="margin-top:0">Baron-Kenny Steps</div>';
      var bk=medPreview.barronKenny;
      html+='<div style="display:flex;flex-direction:column;gap:6px">';
      var steps=[
        {step:'Step 1',desc:'X → Y (total, path c)',val:'c = '+bk.c,p:bk.p_c},
        {step:'Step 2',desc:'X → M (path a)',val:'a = '+bk.a,p:bk.p_a},
        {step:'Step 3',desc:'M → Y (path b | X)',val:'b = '+bk.b,p:bk.p_b},
        {step:'Step 4',desc:'X → Y (direct, path c\')',val:"c' = "+bk.c_prime,p:bk.p_c_prime},
      ];
      steps.forEach(function(s){
        var sig=parseFloat(s.p)<0.05;
        html+='<div class="notice-box '+(sig?'notice-ok':'')+'" style="padding:7px 10px">';
        html+='<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">';
        html+='<span style="font-size:11.5px;font-weight:700;color:'+(sig?'var(--ok)':'var(--ink-muted)')+'">'+s.step+': '+s.desc+'</span>';
        html+='<span class="tag '+(sig?'tag-green':'tag-red')+'">'+s.val+' (p='+parseFloat(s.p).toFixed(3)+')</span>';
        html+='</div></div>';
      });
      html+='</div>';

      if(medPreview.mediators&&medPreview.mediators.length){
        html+='<div class="sec-hd-sub" style="margin-top:11px">Indirect Effect (Sobel)</div>';
        medPreview.mediators.forEach(function(med){
          var sobelSig=parseFloat(med.sobel_p)<0.05;
          html+='<div class="notice-box" style="padding:8px 10px;margin-bottom:6px">';
          html+='<div style="font-size:12px;font-weight:700;color:var(--ink)">via '+escHtml(med.name)+'</div>';
          html+='<div class="stats-grid2" style="margin-top:6px">';
          html+='<div class="sb"><div class="sb-label">Indirect (a×b)</div><div class="sb-value" style="font-size:14px">'+SE.f4(med.indirect)+'</div></div>';
          html+='<div class="sb"><div class="sb-label">Sobel z</div><div class="sb-value" style="font-size:14px;color:'+(sobelSig?'var(--ok)':'var(--err)')+'">'+SE.f4(med.sobel_z)+'</div><div class="sb-note">p='+parseFloat(med.sobel_p).toFixed(3)+'</div></div>';
          html+='</div></div>';
        });
      }
    }
    html+='</div></div>';
  return html;
}

function renderSemForm(){
  const nF=numFields();
  var T=ossChartTheme();
  let html='';
    if(!aState.semLatents) aState.semLatents=[];
    if(aState.semLatentMap===undefined||aState.semLatentMap===null) aState.semLatentMap={};
    if(!aState.semPaths) aState.semPaths=[];
    if(!aState.semMode) aState.semMode='measurement';
    var semColors=T.series;

    aState.semLatents.forEach(function(ln){
      if(!aState.semLatentMap[ln]) aState.semLatentMap[ln]=[];
    });

    var semResult=null;
    var semReady=aState.semLatents.length>=1&&aState.semLatents.every(function(ln){return (aState.semLatentMap[ln]||[]).length>=2;});
    if(semReady){
      semResult=tryStats(function(){return computeSEM(aState.semLatents,aState.semLatentMap,aState.semPaths);});
    }

    html+='<div class="card" style="padding:12px 16px;margin-bottom:12px">';
    html+='<div class="sec-hd" style="margin-bottom:8px">Structural Equation Modeling (SEM)'+ossGuideBtn('sem')+'</div>';
    html+='<div style="display:flex;gap:6px;flex-wrap:wrap">';
    [{k:'measurement',l:'1. Measurement Model (CFA)'},{k:'structural',l:'2. Structural Model (Path)'},{k:'results',l:'3. Results & Fit'}].forEach(function(t){
      var act=aState.semMode===t.k;
      html+='<button class="sem-tab'+(act?' active':'')+'" onclick="aState.semMode=\''+t.k+'\';renderASub()">'+t.l+'</button>';
    });
    html+='</div></div>';

    if(aState.semMode==='measurement'){
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">Konstruk Laten</div>';
      html+='<div style="display:flex;gap:6px;margin-bottom:12px">';
      html+='<input class="inp" id="sem-new-latent" placeholder="Nama konstruk (cth: Motivasi, Kinerja...)" style="flex:1"/>';
      html+='<button class="btn btn-primary btn-sm" onclick="semAddLatent()" style="white-space:nowrap">+ Tambah</button>';
      html+='</div>';

      if(!aState.semLatents.length){
        html+='<div class="chart-empty" style="padding:24px 12px">Belum ada konstruk laten.<br>Tambah minimal 2 konstruk untuk SEM.</div>';
      }
      aState.semLatents.forEach(function(ln,li){
        var col=semColors[li%semColors.length];
        var indics=aState.semLatentMap[ln]||[];
        html+='<div class="notice-box" style="margin-bottom:10px;border-top:2px solid '+col+'">';
        html+='<div style="display:flex;align-items:center;gap:7px;margin-bottom:8px">';
        html+='<input class="inp" style="flex:1;font-weight:700;font-size:12.5px;padding:4px 9px" value="'+escHtmlAttr(ln)+'" oninput="semRenameLatent('+li+',this.value)" />';
        html+='<button class="btn btn-red btn-sm" aria-label="Hapus konstruk" onclick="semRemoveLatent('+li+')">✕</button>';
        html+='</div>';
        html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-bottom:6px">Indikator <b style="color:var(--ink)">'+escHtml(ln)+'</b> (min 2):</div>';
        html+='<div style="display:flex;flex-wrap:wrap;gap:4px">';
        nF.forEach(function(v){
          var sel=(aState.semLatentMap[ln]||[]).includes(v);
          html+='<label class="chip-opt'+(sel?' sel':'')+'"><input type="checkbox" '+(sel?'checked':'')+' data-ln="'+escHtmlAttr(ln)+'" data-v="'+escHtmlAttr(v)+'" onchange="semToggleIndicator(this.dataset.ln,this.dataset.v,this.checked)" style="accent-color:var(--gold)"/>'+escHtml(v)+'</label>';
        });
        html+='</div>';
        if(indics.length<2) html+='<div style="font-size:11px;color:var(--err);margin-top:6px">⚠ Butuh min 2 indikator</div>';
        else html+='<div style="font-size:11px;color:var(--ok);margin-top:6px">✓ '+indics.length+' indikator dipilih</div>';
        html+='</div>';
      });
      if(semReady) html+='<button class="btn btn-primary btn-sm" onclick="runSEM()">▶ Run</button>';
      html+='</div>';

      html+='<div class="card"><div class="sec-hd">Preview</div>';
      if(!semReady){
        html+='<div class="chart-empty" style="padding:32px 12px">Tambah ≥1 konstruk dengan ≥2 indikator untuk melihat preview model pengukuran.</div>';
      } else if(semResult&&semResult._err){
        html+='<div class="miss-warn">'+escHtml(semResult.msg)+'</div>';
      } else if(semResult){
        var fitCls=semResult.overallFit==='Good Fit'?'notice-ok':semResult.overallFit==='Acceptable Fit'?'notice-warn':'notice-err';
        var fitCol=fitCls==='notice-ok'?'var(--ok)':fitCls==='notice-warn'?'var(--warn)':'var(--err)';
        html+='<div class="notice-box '+fitCls+'" style="text-align:center;margin-bottom:13px">';
        html+='<div style="font-size:16px;font-weight:700;color:'+fitCol+';font-family:var(--font-serif-stack)">'+semResult.overallFit+'</div>';
        html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-top:2px">N='+semResult.n+', '+semResult.totalIndicators+' indicators, '+semResult.nLatent+' constructs · χ²('+semResult.dfModel+')='+semResult.chiSq+'</div>';
        html+='</div>';
        html+='<div class="stats-grid2" style="margin-bottom:10px">';
        function semFitCard(name,val,interp,col){return '<div class="sb"><div class="sb-label">'+escHtml(name)+'</div><div class="sb-value" style="color:'+col+'">'+val+'</div><div style="font-size:11px;color:'+col+';margin-top:2px">'+interp+'</div></div>';}
        var cficol2=semResult.CFI_raw>=0.95?'var(--ok)':semResult.CFI_raw>=0.90?'var(--warn)':'var(--err)';
        var tlicol2=semResult.TLI_raw>=0.95?'var(--ok)':semResult.TLI_raw>=0.90?'var(--warn)':'var(--err)';
        var rmsecol2=semResult.RMSEA_raw<=0.05?'var(--ok)':semResult.RMSEA_raw<=0.08?'var(--warn)':'var(--err)';
        var srmrcol2=semResult.SRMR_raw<=0.05?'var(--ok)':semResult.SRMR_raw<=0.08?'var(--warn)':'var(--err)';
        html+=semFitCard('CFI',semResult.CFI,semResult.CFIinterp,cficol2);
        html+=semFitCard('TLI',semResult.TLI,semResult.TLIinterp,tlicol2);
        html+=semFitCard('RMSEA',semResult.RMSEA,semResult.RMSEAinterp,rmsecol2);
        html+=semFitCard('SRMR',semResult.SRMR,semResult.SRMRinterp,srmrcol2);
        html+='</div>';
        html+='<div class="sec-hd-sub" style="margin-top:11px">Construct Validity</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th>Konstruk</th><th style="text-align:right">AVE</th><th style="text-align:right">CR</th><th style="text-align:right">α</th><th>Validity</th></tr></thead><tbody>';
        semResult.constructs.forEach(function(c){
          var avecol=parseFloat(c.AVE)>=0.5?'var(--ok)':parseFloat(c.AVE)>=0.4?'var(--warn)':'var(--err)';
          var crcol=parseFloat(c.CR)>=0.7?'var(--ok)':parseFloat(c.CR)>=0.6?'var(--warn)':'var(--err)';
          var alphacol=parseFloat(c.alpha)>=0.7?'var(--ok)':parseFloat(c.alpha)>=0.6?'var(--warn)':'var(--err)';
          var valid=parseFloat(c.AVE)>=0.5&&parseFloat(c.CR)>=0.7;
          html+='<tr><td class="td-label" style="color:'+semColors[semResult.constructs.indexOf(c)%semColors.length]+';font-weight:700">'+escHtml(c.name)+'</td>';
          html+='<td class="td-num" style="color:'+avecol+'">'+c.AVE+'</td>';
          html+='<td class="td-num" style="color:'+crcol+'">'+c.CR+'</td>';
          html+='<td class="td-num" style="color:'+alphacol+'">'+c.alpha+'</td>';
          html+='<td><span class="tag '+(valid?'tag-green':'tag-yellow')+'">'+(valid?'✓ Valid':'⚠ Check')+'</span></td></tr>';
        });
        html+='</tbody></table></div>';
        html+='<div class="sec-hd-sub" style="margin-top:12px">Standardized Factor Loadings (λ)</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th>Konstruk</th><th>Indikator</th><th style="text-align:right">λ</th><th style="text-align:right">h²</th><th style="text-align:right">t</th><th>Status</th></tr></thead><tbody>';
        semResult.loadings.forEach(function(row){
          var lamNum=parseFloat(row.lambda);
          var lamCol=lamNum>=0.7?'var(--ok)':lamNum>=0.5?'var(--ink)':lamNum>=0.3?'var(--warn)':'var(--err)';
          var constructIdx=aState.semLatents.indexOf(row.construct);
          var col=semColors[constructIdx>=0?constructIdx%semColors.length:0];
          html+='<tr>';
          if(row.firstInConstruct) html+='<td class="td-label" rowspan="'+row.constructCount+'" style="color:'+col+';font-weight:700;vertical-align:top;padding-top:10px">'+escHtml(row.construct)+'</td>';
          html+='<td class="td-label">'+escHtml(row.indicator)+'</td>';
          html+='<td class="td-num" style="color:'+lamCol+';font-weight:'+(lamNum>=0.5?700:400)+'">'+row.lambda+'</td>';
          html+='<td class="td-num" style="color:'+(parseFloat(row.h2)>=0.4?'var(--ok)':'var(--err)')+'">'+row.h2+'</td>';
          html+='<td class="td-num" style="color:var(--ink-muted)">'+row.tvalue+'</td>';
          html+='<td><span class="tag '+(lamNum>=0.5?'tag-green':'tag-red')+'">'+(lamNum>=0.5?'✓ Adequate':'✗ Weak')+'</span></td>';
          html+='</tr>';
        });
        html+='</tbody></table></div>';
      }
      html+='</div></div>';
    }

    else if(aState.semMode==='structural'){
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">Structural Paths</div>';
      if(aState.semLatents.length<2){
        html+='<div class="miss-warn">⚠ Butuh minimal 2 konstruk laten di Measurement Model.</div>';
      } else {
        html+='<div style="display:flex;gap:7px;margin-bottom:10px;align-items:center">';
        html+='<div style="flex:1"><label class="lbl">Dari (Eksogen)</label>';
        html+=mkSelect('sem-from',aState.semLatents,aState.semPathFrom||aState.semLatents[0],'aState.semPathFrom=val','Variabel asal');
        html+='</div>';
        html+='<div style="display:flex;align-items:flex-end;padding-bottom:6px"><span style="color:var(--ink);font-size:18px;font-weight:700">→</span></div>';
        html+='<div style="flex:1"><label class="lbl">Ke (Endogen)</label>';
        html+=mkSelect('sem-to',aState.semLatents,aState.semPathTo||aState.semLatents[aState.semLatents.length-1],'aState.semPathTo=val','Variabel tujuan');
        html+='</div>';
        html+='</div>';
        html+='<div class="row" style="gap:7px;margin-bottom:12px"><button class="btn btn-ghost btn-sm" onclick="semAddPath()">+ Tambah Path</button><button class="btn btn-primary btn-sm" onclick="runSEM()">▶ Run</button></div>';

        if(!aState.semPaths.length){
          html+='<div class="chart-empty" style="padding:16px 12px">Belum ada structural path.</div>';
        } else {
          html+='<div style="display:flex;flex-direction:column;gap:6px">';
          aState.semPaths.forEach(function(p,pi){
            html+='<div class="notice-box" style="display:flex;align-items:center;gap:7px;padding:8px 11px">';
            var fromCol=semColors[aState.semLatents.indexOf(p.from)%semColors.length]||T.ink;
            var toCol=semColors[aState.semLatents.indexOf(p.to)%semColors.length]||T.ice;
            html+='<span style="font-weight:700;color:'+fromCol+';font-size:12.5px">'+escHtml(p.from)+'</span>';
            html+='<span style="color:var(--ink-muted);font-size:14px;font-weight:700">→</span>';
            html+='<span style="font-weight:700;color:'+toCol+';font-size:12.5px;flex:1">'+escHtml(p.to)+'</span>';
            if(semResult&&!semResult._err){
              var pathRes=semResult.paths&&semResult.paths.find(function(r){return r.from===p.from&&r.to===p.to;});
              if(pathRes){
                var psig=parseFloat(pathRes.p)<0.05;
                html+='<span class="tag '+(parseFloat(pathRes.beta)>0?'tag-green':'tag-orange')+'">β='+pathRes.beta+'</span>';
                html+='<span class="tag '+(psig?'tag-green':'tag-red')+'">p='+pathRes.p_fmt+'</span>';
              }
            }
            html+='<button class="btn btn-red btn-sm" aria-label="Hapus path" onclick="semRemovePath('+pi+')">✕</button>';
            html+='</div>';
          });
          html+='</div>';
        }
      }
      html+='</div>';

      html+='<div class="card"><div class="sec-hd">Preview</div><div class="sec-hd-sub" style="margin-top:0">Path Diagram</div>';
      if(aState.semLatents.length>=1){
        html+=svgSEMDiagram(aState.semLatents,aState.semLatentMap,aState.semPaths,semResult,semColors);
      } else {
        html+='<div class="chart-empty" style="padding:32px 12px">Tambah konstruk di Measurement Model untuk melihat diagram.</div>';
      }
      html+='</div></div>';
    }

    else if(aState.semMode==='results'){
      html+='<div class="card"><div class="sec-hd">Preview</div>';
      if(!semReady){
        html+='<div class="chart-empty" style="padding:32px 12px">Lengkapi Measurement Model terlebih dahulu (≥2 konstruk, ≥2 indikator masing-masing).</div>';
      } else if(semResult&&semResult._err){
        html+='<div class="miss-warn">'+escHtml(semResult.msg)+'</div>';
      } else if(semResult){
        var fitCol2=semResult.overallFit==='Good Fit'?'var(--ok)':semResult.overallFit==='Acceptable Fit'?'var(--warn)':'var(--err)';
        html+='<div class="sec-hd-sub" style="margin-top:0">Model Fit Summary</div>';
        html+='<div class="stats-grid" style="margin-bottom:13px">';
        html+='<div class="sb"><div class="sb-label">Overall Fit</div><div class="sb-value" style="color:'+fitCol2+'">'+semResult.overallFit+'</div></div>';
        html+='<div class="sb"><div class="sb-label">CFI</div><div class="sb-value" style="color:'+(semResult.CFI_raw>=0.95?'var(--ok)':semResult.CFI_raw>=0.90?'var(--warn)':'var(--err)')+'">'+semResult.CFI+'</div></div>';
        html+='<div class="sb"><div class="sb-label">RMSEA</div><div class="sb-value" style="color:'+(semResult.RMSEA_raw<=0.05?'var(--ok)':semResult.RMSEA_raw<=0.08?'var(--warn)':'var(--err)')+'">'+semResult.RMSEA+'</div></div>';
        html+='<div class="sb"><div class="sb-label">SRMR</div><div class="sb-value" style="color:'+(semResult.SRMR_raw<=0.05?'var(--ok)':semResult.SRMR_raw<=0.08?'var(--warn)':'var(--err)')+'">'+semResult.SRMR+'</div></div>';
        html+='<div class="sb"><div class="sb-label">χ²/df</div><div class="sb-value" style="color:'+(semResult.chiRatio<=2?'var(--ok)':semResult.chiRatio<=3?'var(--warn)':'var(--err)')+'">'+semResult.chiRatio+'</div></div>';
        html+='<div class="sb"><div class="sb-label">TLI</div><div class="sb-value" style="color:'+(semResult.TLI_raw>=0.95?'var(--ok)':semResult.TLI_raw>=0.90?'var(--warn)':'var(--err)')+'">'+semResult.TLI+'</div></div>';
        html+='</div>';
        html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-bottom:12px">χ²('+semResult.dfModel+')='+semResult.chiSq+', p='+semResult.pChiSq+', N='+semResult.n+', RMSEA 90% CI: ['+semResult.RMSEA_lo+', '+semResult.RMSEA_hi+']</div>';

        if(semResult.paths&&semResult.paths.length){
          html+='<div class="sec-hd-sub">Structural Path Coefficients</div>';
          html+='<div class="tbl-wrap" style="margin-bottom:12px"><table><thead><tr><th>Dari</th><th>Ke</th><th style="text-align:right">β (Std)</th><th style="text-align:right">SE</th><th style="text-align:right">t</th><th style="text-align:right">p</th><th>Sig</th><th>Kesimpulan</th></tr></thead><tbody>';
          semResult.paths.forEach(function(p){
            var betaNum=parseFloat(p.beta);
            var bcol=Math.abs(betaNum)>=0.3?'var(--ok)':Math.abs(betaNum)>=0.1?'var(--warn)':'var(--err)';
            var psig=parseFloat(p.p)<0.05;
            var fromIdx=aState.semLatents.indexOf(p.from);
            var toIdx=aState.semLatents.indexOf(p.to);
            var fromCol=semColors[fromIdx>=0?fromIdx%semColors.length:0];
            var toCol=semColors[toIdx>=0?toIdx%semColors.length:1];
            html+='<tr>';
            html+='<td class="td-label" style="color:'+fromCol+';font-weight:700">'+escHtml(p.from)+'</td>';
            html+='<td class="td-label" style="color:'+toCol+';font-weight:700">'+escHtml(p.to)+'</td>';
            html+='<td class="td-num" style="color:'+bcol+';font-weight:700">'+p.beta+'</td>';
            html+='<td class="td-num" style="color:var(--ink-muted)">'+p.se+'</td>';
            html+='<td class="td-num">'+p.t+'</td>';
            html+='<td class="td-num" style="color:'+(psig?'var(--ok)':'var(--err)')+'">'+(psig?'<b>':'')+p.p_fmt+(psig?'</b>':'')+'</td>';
            html+='<td>'+sigBadge(p.p)+'</td>';
            html+='<td style="font-size:12px;color:var(--ink-muted)">'+escHtml(p.interpretation)+'</td>';
            html+='</tr>';
          });
          html+='</tbody></table></div>';
        }

        if(semResult.indirectEffects&&semResult.indirectEffects.length){
          html+='<div class="sec-hd-sub">Indirect Effects</div>';
          html+='<div class="tbl-wrap" style="margin-bottom:12px"><table><thead><tr><th>X</th><th>M</th><th>Y</th><th style="text-align:right">Indirect β</th><th style="text-align:right">Bootstrap CI 95%</th><th>Sig</th></tr></thead><tbody>';
          semResult.indirectEffects.forEach(function(ie){
            var ciSig=parseFloat(ie.ci_lo)>0||parseFloat(ie.ci_hi)<0;
            html+='<tr>';
            html+='<td class="td-label" style="color:'+semColors[0]+';font-weight:700">'+escHtml(ie.x)+'</td>';
            html+='<td class="td-label" style="color:'+semColors[2%semColors.length]+'">'+escHtml(ie.m)+'</td>';
            html+='<td class="td-label" style="color:'+semColors[1%semColors.length]+';font-weight:700">'+escHtml(ie.y)+'</td>';
            html+='<td class="td-num" style="color:'+(Math.abs(parseFloat(ie.indirect))>=0.1?'var(--ok)':'var(--warn)')+'">'+ie.indirect+'</td>';
            html+='<td class="td-num" style="color:'+(ciSig?'var(--ok)':'var(--err)')+'">['+ie.ci_lo+', '+ie.ci_hi+']</td>';
            html+='<td><span class="tag '+(ciSig?'tag-green':'tag-red')+'">'+(ciSig?'✓ Sig':'n.s.')+'</span></td>';
            html+='</tr>';
          });
          html+='</tbody></table></div>';
        }

        html+='<div class="sec-hd-sub">lavaan Syntax</div>';
        html+='<textarea class="syn-area" readonly style="min-height:130px">'+escHtml(generateLavaanSyntax(aState.semLatents,aState.semLatentMap,aState.semPaths))+'</textarea>';
        html+='<div style="margin-top:10px"><button class="btn btn-primary btn-sm" onclick="runSEM()">▶ Run</button></div>';
      }
      html+='</div>';
    }
  return html;
}

function renderDiscriminantForm(){
  const nF=numFields(),aF=allFields();
  let html='';
    if(!aState.ldaGroup) aState.ldaGroup='';
    if(!aState.ldaPreds) aState.ldaPreds=[];
    var ldaPreview=aState.ldaResult||((aState.ldaGroup&&aState.ldaPreds.length>=1)?tryStats(function(){return computeLDA(aState.ldaGroup,aState.ldaPreds,data);}):null);
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Linear Discriminant Analysis'+ossGuideBtn('discriminant')+'</div>';
    html+='<div style="margin-bottom:10px">';
    html+=mkSelect('lda-grp',aF,aState.ldaGroup,'aState.ldaGroup=val;aState.ldaResult=null;renderASub()','Grouping Variable (Kategorikal)');
    html+='</div>';
    html+='<div style="margin-bottom:10px"><label class="lbl">Predictors (Numerik) <span style="color:var(--ink-subtle);font-size:10px;text-transform:none;letter-spacing:0">— pilih ≥1</span></label>';
    html+='<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">';
    nF.forEach(function(f){
      if(f===aState.ldaGroup) return;
      var sel=aState.ldaPreds.indexOf(f)>=0;
      html+='<label class="chip-opt'+(sel?' sel':'')+'"><input type="checkbox" '+(sel?'checked':'')+' data-fld="'+escHtmlAttr(f)+'" onchange="var f=this.dataset.fld,i=aState.ldaPreds.indexOf(f);if(this.checked&&i<0)aState.ldaPreds.push(f);else if(!this.checked&&i>=0)aState.ldaPreds.splice(i,1);aState.ldaResult=null;renderASub()"/>'+escHtml(f)+'</label>';
    });
    html+='</div></div>';
    html+='<button class="btn btn-primary btn-sm" onclick="runDiscriminant()" style="margin-top:4px">▶ Run</button>';
    html+='</div>';

    html+='<div class="card"><div class="sec-hd">Preview</div>';
    if(ldaPreview&&ldaPreview._err){
      html+='<div class="miss-warn">'+escHtml(ldaPreview.msg)+'</div>';
    } else if(ldaPreview){
      var lr=ldaPreview;
      html+='<div class="stats-grid2" style="margin-bottom:10px">';
      html+=stCard('N',lr.n,lr.groups.length+' groups');
      html+=stCard("Wilks' λ",lr.wilksLambda,'p='+lr.wilksP);
      html+=stCard('Accuracy',lr.accuracy+'%',lr.nFunctions+' functions');
      html+=stCard('Predictors',lr.preds.length,'');
      html+='</div>';
      html+='<div class="sec-hd-sub" style="margin-top:6px">Eigenvalues &amp; Canonical Correlations</div>';
      html+='<div class="tbl-wrap" style="margin-bottom:10px"><table><thead><tr><th>Fn</th><th style="text-align:right">Eigenvalue</th><th style="text-align:right">% Var</th><th style="text-align:right">Cum %</th><th style="text-align:right">Canon. r</th></tr></thead><tbody>';
      lr.eigenvalues.forEach(function(e,i){
        html+='<tr><td class="td-label">'+(i+1)+'</td><td class="td-num">'+e.eigenvalue+'</td><td class="td-num">'+e.pctVar+'%</td><td class="td-num">'+e.cumPct+'%</td><td class="td-num" style="color:var(--gold-text);font-weight:700">'+e.canonicalR+'</td></tr>';
      });
      html+='</tbody></table></div>';
      html+='<div class="sec-hd-sub">Classification Results</div>';
      html+='<div class="tbl-wrap" style="margin-bottom:10px"><table><thead><tr><th>Actual \\ Pred</th>';
      lr.groups.forEach(function(g){ html+='<th style="text-align:right">'+escHtml(g)+'</th>'; });
      html+='<th style="text-align:right">% Correct</th></tr></thead><tbody>';
      lr.classTable.forEach(function(row,i){
        html+='<tr><td class="td-label" style="font-weight:700">'+escHtml(lr.groups[i])+'</td>';
        row.counts.forEach(function(c,j){
          var isDiag=i===j;
          html+='<td class="td-num" style="'+(isDiag?'color:var(--ok);font-weight:700;background:var(--ok-bg)':'')+'">'+c+'</td>';
        });
        html+='<td class="td-num" style="color:var(--ok);font-weight:700">'+row.pctCorrect+'%</td></tr>';
      });
      html+='</tbody></table></div>';
      html+='<div class="sec-hd-sub">Structure Matrix</div>';
      html+='<div class="tbl-wrap" style="margin-bottom:10px"><table><thead><tr><th>Predictor</th>';
      lr.eigenvalues.forEach(function(e,i){ html+='<th style="text-align:right">Fn '+(i+1)+'</th>'; });
      html+='</tr></thead><tbody>';
      lr.preds.forEach(function(p,pi){
        html+='<tr><td class="td-label">'+escHtml(p)+'</td>';
        lr.structureMatrix.forEach(function(fc){ html+='<td class="td-num" style="color:'+(Math.abs(fc[pi])>=0.3?'var(--gold-text)':'var(--ink-muted)')+';font-weight:'+(Math.abs(fc[pi])>=0.3?'700':'400')+'">'+fc[pi]+'</td>'; });
        html+='</tr>';
      });
      html+='</tbody></table></div>';
      if(lr.scores&&lr.nFunctions>=1){
        html+='<div class="sec-hd-sub">Discriminant Score Plot</div>';
        html+=svgDiscriminantPlot(lr);
      }
    } else {
      html+='<div class="chart-empty">Pilih Grouping Variable kategorikal dan ≥1 prediktor numerik untuk melihat preview LDA.</div>';
    }
    html+='</div></div>';
  return html;
}

function renderClusterForm(){
  const nF=numFields();
  var T=ossChartTheme();
  let html='';
    if(!aState.clMethod) aState.clMethod='kmeans';
    if(!aState.clK) aState.clK=3;
    if(!aState.clVars) aState.clVars=[];
    if(!aState.clLinkage) aState.clLinkage='ward';
    var clPreview=aState.clResult||(aState.clVars.length>=2?tryStats(function(){
      return aState.clMethod==='kmeans'
        ? computeKMeans(data,aState.clVars,aState.clK,undefined,true)
        : computeHierarchical(data,aState.clVars,aState.clK,aState.clLinkage);
    }):null);

    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Cluster Analysis'+ossGuideBtn('cluster')+'</div>';
    html+='<div style="margin-bottom:10px">'+mkCsel('cl-method',['kmeans','hierarchical'],aState.clMethod,'aState.clMethod=val;aState.clResult=null;renderASub()','Method')+'</div>';
    html+='<div style="margin-bottom:10px"><label class="lbl">Variables (Numerik) <span style="color:var(--ink-subtle);font-size:10px;text-transform:none;letter-spacing:0">— pilih ≥2</span></label>';
    html+='<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">';
    nF.forEach(function(f){
      var sel=aState.clVars.indexOf(f)>=0;
      html+='<label class="chip-opt'+(sel?' sel':'')+'"><input type="checkbox" '+(sel?'checked':'')+' data-fld="'+escHtmlAttr(f)+'" onchange="var f=this.dataset.fld,i=aState.clVars.indexOf(f);if(this.checked&&i<0)aState.clVars.push(f);else if(!this.checked&&i>=0)aState.clVars.splice(i,1);aState.clResult=null;renderASub()"/>'+escHtml(f)+'</label>';
    });
    html+='</div></div>';
    if(aState.clMethod==='kmeans'){
      html+='<div style="margin-bottom:10px">'+mkCsel('cl-k',['2','3','4','5','6','7','8'],String(aState.clK),'aState.clK=parseInt(val);aState.clResult=null;renderASub()','Number of Clusters (k)')+'</div>';
    } else {
      html+='<div style="margin-bottom:10px">'+mkCsel('cl-linkage',['ward','complete','average','single'],aState.clLinkage,'aState.clLinkage=val;aState.clResult=null;renderASub()','Linkage Method')+'</div>';
      html+='<div style="margin-bottom:10px">'+mkCsel('cl-hk',['2','3','4','5','6'],String(aState.clK),'aState.clK=parseInt(val);aState.clResult=null;renderASub()','Cut Clusters (k)')+'</div>';
    }
    html+='<button class="btn btn-primary btn-sm" onclick="runCluster()" style="margin-top:4px">▶ Run</button>';
    html+='</div>';

    html+='<div class="card"><div class="sec-hd">Preview</div>';
    if(clPreview&&clPreview._err){
      html+='<div class="miss-warn">'+escHtml(clPreview.msg)+'</div>';
    } else if(clPreview){
      var cr=clPreview;
      html+='<div class="stats-grid2" style="margin-bottom:10px">';
      html+=stCard('N Cases',cr.n,cr.vars.length+' vars');
      html+=stCard('Clusters (k)',cr.k,cr.method==='kmeans'?'K-Means':escHtml(cr.linkage));
      html+=stCard('Silhouette',cr.silhouette,'Cluster quality');
      if(cr.method==='kmeans'){
        html+=stCard('WSS / BSS',cr.totalWSS,'BSS='+cr.totalBSS);
      }
      html+='</div>';
      html+='<div class="sec-hd-sub" style="margin-top:4px">Cluster Sizes &amp; Centroids</div>';
      html+='<div class="tbl-wrap" style="margin-bottom:10px"><table><thead><tr><th>Cluster</th><th style="text-align:right">N</th><th style="text-align:right">%</th>';
      cr.vars.forEach(function(v){ html+='<th style="text-align:right">'+escHtml(v)+'</th>'; });
      html+='</tr></thead><tbody>';
      var clColors=T.series;
      cr.clusters.forEach(function(c,i){
        var col=clColors[i%clColors.length];
        html+='<tr><td class="td-label"><span style="display:inline-flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:2px;background:'+col+';display:inline-block"></span><b style="color:var(--ink)">C'+(i+1)+'</b></span></td>';
        html+='<td class="td-num">'+c.n+'</td><td class="td-num">'+c.pct+'%</td>';
        c.centroid.forEach(function(m){ html+='<td class="td-num">'+m+'</td>'; });
        html+='</tr>';
      });
      html+='</tbody></table></div>';
      if(cr.vars.length>=2){
        html+='<div class="sec-hd-sub">Cluster Plot (PC1 vs PC2)</div>';
        html+=svgClusterPlot(cr);
      }
      if(cr.method==='hierarchical'&&cr.dendro){
        html+='<div class="sec-hd-sub" style="margin-top:10px">Dendrogram</div>';
        html+=svgDendrogram(cr.dendro,cr.k,cr.vars);
      }
      if(cr.method==='kmeans'&&cr.elbowData){
        html+='<div class="sec-hd-sub" style="margin-top:10px">Elbow Chart</div>';
        html+=svgElbow(cr.elbowData);
      }
      html+='<div class="sec-hd-sub" style="margin-top:10px">ANOVA per Variable</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Variable</th><th style="text-align:right">F</th><th style="text-align:right">p</th><th>Sig</th></tr></thead><tbody>';
      cr.anova.forEach(function(a){
        var sig=parseFloat(a.p)<0.05;
        html+='<tr><td class="td-label">'+escHtml(a.variable)+'</td><td class="td-num">'+a.F+'</td>';
        html+='<td class="td-num" style="color:'+(sig?'var(--ok)':'var(--err)')+'">'+a.p_fmt+'</td>';
        html+='<td>'+sigBadge(a.p)+'</td></tr>';
      });
      html+='</tbody></table></div>';
    } else {
      html+='<div class="chart-empty">Pilih minimal 2 variabel numerik untuk melihat preview pengelompokan.</div>';
    }
    html+='</div></div>';
  return html;
}

function renderRocForm(){
  const nF=numFields(),aF=allFields();
  var T=ossChartTheme();
  let html='';
    if(!aState.rocTrue&&aF.length){
      var binCand=aF.find(function(f){var u=new Set(data.map(function(r){return r[f];}).filter(function(v){return v!==null&&v!==undefined&&v!=='';}));return u.size===2;});
      aState.rocTrue=binCand||aF[aF.length>1?aF.length-1:0];
    }
    if(!aState.rocProb&&nF.length){
      var scoreCand=nF.find(function(f){if(f===aState.rocTrue)return false;var u=new Set(data.map(function(r){return r[f];}).filter(function(v){return v!==null&&v!==undefined&&v!=='';}));return u.size>2;});
      aState.rocProb=scoreCand||nF.find(function(f){return f!==aState.rocTrue;})||nF[0];
    }
    if(!aState.rocCompare) aState.rocCompare=[];
    var rocPrv=aState.rocProb&&aState.rocTrue?tryStats(function(){return computeROC(data,aState.rocProb,aState.rocTrue,aState.rocPosClass);}):null;

    // Build comparison curves when Compare Curves (DeLong Test) toggle is active
    var otherScores=nF.filter(function(v){return v!==aState.rocProb;});
    var cmpVars=aState.rocCompareMode&&aState.rocProb
      ?[aState.rocProb].concat((aState.rocCompare||[]).filter(function(v){return v!==aState.rocProb&&nF.includes(v);}))
      :[];
    var cmpCurves=(aState.rocCompareMode&&aState.rocTrue&&cmpVars.length>=2)
      ?cmpVars.map(function(v){
        try{return {name:v,roc:computeROC(data,v,aState.rocTrue,aState.rocPosClass)};}
        catch(e){return {name:v,roc:{_err:true}};}
      }).filter(function(c){return !c.roc._err;})
      :[];

    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">ROC Curve Analysis'+ossGuideBtn('roc')+'</div>';
    html+=mkSelect('roc-prob',nF,aState.rocProb,'aState.rocProb=val;renderASub()','Predicted Probability / Score');
    html+='<div style="margin-top:8px">'+mkSelect('roc-true',aF,aState.rocTrue,'aState.rocTrue=val;renderASub()','True Binary Outcome')+'</div>';
    if(aState.rocTrue){
      var uniq=[...new Set(data.map(function(r){return String(r[aState.rocTrue]||'');}).filter(Boolean))].slice(0,10);
      if(uniq.length>=2){
        html+='<div style="margin-top:8px"><label class="lbl">Positive Class (event=1)</label>';
        html+='<div class="row" style="gap:5px;margin-top:5px;flex-wrap:wrap">';
        uniq.forEach(function(u){html+='<button class="btn '+(aState.rocPosClass===u?'btn-active':'btn-ghost')+' btn-sm" onclick="aState.rocPosClass=this.dataset.v;renderASub()" data-v="'+escHtmlAttr(u)+'">'+escHtml(u)+'</button>';});
        html+='</div></div>';
      }
    }

    // ANOVA-style Compare Curves (DeLong Test) post-hoc switch
    html+='<div style="margin-top:10px">';
    html+='<label class="lbl">Compare Curves (DeLong Test)</label>';
    html+='<div style="display:flex;align-items:center;gap:8px;margin-top:4px">';
    html+='<button type="button" role="switch" aria-checked="'+(aState.rocCompareMode?'true':'false')+'" aria-label="Enable ROC curve comparison" onclick="aState.rocCompareMode=!aState.rocCompareMode;renderASub()" style="cursor:pointer;width:36px;height:20px;border-radius:var(--r-sm);background:'+(aState.rocCompareMode?'var(--gold)':'var(--surface-alt)')+';position:relative;flex-shrink:0;transition:background .15s;border:1px solid '+(aState.rocCompareMode?'var(--gold)':'var(--line-soft)')+';padding:0"><span style="position:absolute;top:2px;left:'+(aState.rocCompareMode?'18px':'2px')+';width:14px;height:14px;border-radius:1px;background:'+(aState.rocCompareMode?'var(--ink)':'var(--ink-muted)')+';transition:left .15s"></span></button>';
    html+='<span style="font-size:12px;color:'+(aState.rocCompareMode?'var(--ink)':'var(--ink-muted)')+'">'+(aState.rocCompareMode?'Bandingkan dengan skor lain (DeLong Test)':'Uji kurva ROC tunggal')+'</span>';
    html+='</div>';
    if(aState.rocCompareMode){
      html+='<div style="margin-top:8px">';
      if(otherScores.length){
        html+='<div style="font-size:11px;color:var(--ink-muted);margin-bottom:5px">Pilih ≥1 skor pembanding terhadap <b>'+escHtml(aState.rocProb)+'</b>:</div>';
        html+='<div style="display:flex;flex-wrap:wrap;gap:6px">';
        otherScores.forEach(function(v){
          var sel=(aState.rocCompare||[]).includes(v);
          html+='<label class="chip-opt'+(sel?' sel':'')+'">';
          html+='<input type="checkbox" '+(sel?'checked':'')+' onchange="toggleROCCompare(this.dataset.fld,this.checked)" data-fld="'+escHtmlAttr(v)+'"/>'+escHtml(v)+'</label>';
        });
        html+='</div>';
      } else {
        html+='<div style="font-size:11px;color:var(--ink-subtle)">Perlu ≥2 variabel numerik di dataset untuk perbandingan kurva ROC.</div>';
      }
      html+='</div>';
    }
    html+='</div>';

    html+='<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="runROC()">▶ Run</button>';
    if(rocPrv&&!rocPrv._err){
      html+='<div class="stats-grid2" style="margin-top:12px">';
      html+=stCard('AUC',rocPrv.auc,rocPrv.aucInterp);
      html+=stCard('95% CI',rocPrv.aucCI,'');
      html+=stCard('Optimal Cutoff',rocPrv.optThresh,'Youden index');
      html+=stCard('Sens / Spec',rocPrv.optSens+' / '+rocPrv.optSpec,'pos='+rocPrv.nPos+' neg='+rocPrv.nNeg);
      html+='</div>';
    }
    if(rocPrv&&rocPrv._err) html+='<div class="notice-box notice-err" style="margin-top:8px">'+escHtml(rocPrv.msg)+'</div>';
    html+='</div>';

    html+='<div class="card"><div class="sec-hd">Preview</div>';
    if(aState.rocCompareMode&&cmpCurves.length>=2){
      html+='<div class="sec-hd-sub" style="margin-top:0">ROC Curves Comparison (DeLong Test)</div>';
      html+=svgROCCompare(cmpCurves);
      html+='<div class="tbl-wrap" style="margin-top:10px"><table><thead><tr><th>Model / Score</th><th style="text-align:right">AUC</th><th style="text-align:right">95% CI</th><th style="text-align:right">Cutoff</th><th style="text-align:right">Sens</th><th style="text-align:right">Spec</th></tr></thead><tbody>';
      cmpCurves.forEach(function(c,ci){
        var r=c.roc;
        var col=T.series[ci%T.series.length];
        html+='<tr><td class="td-label"><span style="display:inline-flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:2px;background:'+col+';display:inline-block"></span>'+escHtml(c.name)+'</span></td><td class="td-num" style="color:var(--gold-text);font-weight:700">'+r.auc+'</td><td class="td-num" style="font-size:11px">'+r.aucCI+'</td><td class="td-num">'+r.optThresh+'</td><td class="td-num">'+r.optSens+'</td><td class="td-num">'+r.optSpec+'</td></tr>';
      });
      html+='</tbody></table></div>';
      for(var ci=1;ci<cmpCurves.length;ci++){
        try{
          var dlong=deLongTest(cmpCurves[0].roc,cmpCurves[ci].roc);
          var dSig=parseFloat(dlong.p)<0.05;
          html+='<div class="notice-box '+(dSig?'notice-ok':'')+'" style="margin-top:8px"><b style="color:var(--gold-text)">DeLong ('+escHtml(cmpCurves[0].name)+' vs '+escHtml(cmpCurves[ci].name)+'):</b> z='+dlong.z+', p='+dlong.p_fmt+' — '+(dSig?'<span style="color:var(--ok);font-weight:700">Significant difference</span>':'<span style="color:var(--warn)">No significant difference</span>')+'</div>';
        }catch(e){}
      }
    } else if(rocPrv&&!rocPrv._err){
      html+='<div class="sec-hd-sub" style="margin-top:0">ROC Plot</div>';
      html+=svgROC(rocPrv);
      html+='<div style="margin-top:12px"><div class="sec-hd-sub">Optimal Operating Point (Youden)</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th style="text-align:right">Threshold</th><th style="text-align:right">Sens</th><th style="text-align:right">Spec</th><th style="text-align:right">PPV</th><th style="text-align:right">NPV</th><th style="text-align:right">F1</th><th style="text-align:right">Youden J</th></tr></thead><tbody>';
      html+='<tr><td class="td-num" style="color:var(--gold-text);font-weight:700">'+rocPrv.optThresh+'</td><td class="td-num">'+rocPrv.optSens+'</td><td class="td-num">'+rocPrv.optSpec+'</td><td class="td-num">'+rocPrv.optPPV+'</td><td class="td-num">'+rocPrv.optNPV+'</td><td class="td-num">'+rocPrv.optF1+'</td><td class="td-num" style="color:var(--ok);font-weight:700">'+rocPrv.optYouden+'</td></tr>';
      html+='</tbody></table></div></div>';
      html+='<div style="margin-top:12px"><div class="sec-hd-sub">Threshold Table</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th style="text-align:right">Threshold</th><th style="text-align:right">TPR</th><th style="text-align:right">FPR</th><th style="text-align:right">Precision</th><th style="text-align:right">F1</th></tr></thead><tbody>';
      var step=Math.max(1,Math.floor(rocPrv.curve.length/12));
      rocPrv.curve.filter(function(_,i){return i%step===0;}).slice(0,14).forEach(function(pt){
        html+='<tr><td class="td-num">'+SE.f4(pt.t)+'</td><td class="td-num">'+SE.f4(pt.tpr)+'</td><td class="td-num">'+SE.f4(pt.fpr)+'</td><td class="td-num">'+SE.f4(pt.ppv||0)+'</td><td class="td-num">'+SE.f4(pt.f1||0)+'</td></tr>';
      });
      html+='</tbody></table></div></div>';
    } else {
      html+='<div class="chart-empty">Pilih probability score dan outcome biner untuk melihat kurva ROC.</div>';
    }
    html+='</div></div>';
  return html;
}

function renderSurvivalForm(){
  const nF=numFields(),aF=allFields();
  let html='';
    if(!aState.survTime&&nF.length) aState.survTime=nF[0];
    if(!aState.survEvent&&nF.length>1) aState.survEvent=nF[1];
    if(!aState.survGroup) aState.survGroup='';
    if(!aState.survCovs) aState.survCovs=[];
    if(!aState.survMethod) aState.survMethod='km';
    if(currentASub==='km') aState.survMethod='km';
    else if(currentASub==='logrank') aState.survMethod='logrank';
    else if(currentASub==='cox') aState.survMethod='cox';

    var survValid=aState.survTime&&aState.survEvent;
    var survPrv=survValid?tryStats(function(){return computeKaplanMeier(data,aState.survTime,aState.survEvent,aState.survGroup||null);}):null;
    var coxPrv=(aState.survMethod==='cox'&&aState.survCovs&&aState.survCovs.length>0&&survValid)
      ?tryStats(function(){return computeCoxRegression(data,aState.survTime,aState.survEvent,aState.survCovs);}):null;
    var survGuideId=(aState.survMethod==='km'||aState.survMethod==='logrank'||aState.survMethod==='cox')?aState.survMethod:'survival';

    html+='<div class="grid2">';

    html+='<div class="card"><div class="sec-hd">Survival Analysis'+ossGuideBtn(survGuideId)+'</div>';
    html+='<div style="margin-bottom:8px"><label class="lbl">Analysis Method</label>';
    html+=mkOptCsel('surv-method',
      [{val:'km',label:'Kaplan-Meier Estimator'},{val:'logrank',label:'Log-Rank Test'},{val:'cox',label:'Cox Proportional Hazards'}],
      aState.survMethod,
      'aState.survMethod=_cR["surv-method"]._vals[_cR["surv-method"].fields.indexOf(val)];renderASub()',
      '');
    html+='</div>';
    html+='<div style="height:1px;background:var(--line-soft);margin:10px 0"></div>';
    html+='<div style="margin-bottom:8px"><label class="lbl">Time Variable</label>';
    html+=mkSelect('surv-time',nF,aState.survTime,'aState.survTime=val;renderASub()','Time Variable')+'</div>';
    html+='<div style="margin-bottom:8px"><label class="lbl">Event Indicator <span style="color:var(--ink-subtle);text-transform:none;letter-spacing:0">(1=event, 0=censored)</span></label>';
    html+=mkSelect('surv-event',nF,aState.survEvent,'aState.survEvent=val;renderASub()','Event Indicator')+'</div>';
    html+='<div><label class="lbl">Group Variable <span style="color:var(--ink-subtle);text-transform:none;letter-spacing:0">(optional)</span></label>';
    html+=mkSelect('surv-grp',['(none)'].concat(aF),aState.survGroup||'(none)','aState.survGroup=(val==="(none)"?"":val);renderASub()','Group Variable')+'</div>';
    if(aState.survMethod==='cox'){
      html+='<div style="margin-top:10px"><label class="lbl">Covariates (Predictors)</label>';
      html+='<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">';
      nF.filter(function(v){return v!==aState.survTime&&v!==aState.survEvent;}).forEach(function(v){
        var sel=(aState.survCovs||[]).includes(v);
        html+='<label class="chip-opt'+(sel?' sel':'')+'"><input type="checkbox" '+(sel?'checked':'')+' data-fld="'+escHtmlAttr(v)+'" onchange="toggleSurvCov(this.dataset.fld,this.checked)"/>'+escHtml(v)+'</label>';
      });
      html+='</div></div>';
    }
    html+='<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="'+(aState.survMethod==='cox'?'runCoxRegression()':'runSurvival()')+'">▶ Run</button>';
    html+='</div>';

    html+='<div class="card"><div class="sec-hd">Preview</div>';
    if(aState.survMethod==='km'){
      if(survPrv&&!survPrv._err){
        html+='<div class="stats-grid2" style="margin-bottom:10px">';
        survPrv.groups.forEach(function(g){
          html+=stCard('Median ('+escHtml(g.label)+')',g.medianSurv===null?'NR':SE.f4(g.medianSurv),'');
          html+=stCard('Events / N ('+escHtml(g.label)+')',g.events+' / '+g.n,'');
        });
        html+='</div>';
        if(survPrv.groups.length>=2){
          var lrSig=parseFloat(survPrv.logrank.p)<0.05;
          html+='<div class="notice-box '+(lrSig?'notice-ok':'')+'" style="margin-bottom:10px">';
          html+='Log-rank: χ²('+survPrv.logrank.df+') = '+survPrv.logrank.chi2+', p = '+survPrv.logrank.p_fmt+' '+(lrSig?'<b style="color:var(--ok)">✓ Sig</b>':'<span style="color:var(--warn)">ns</span>');
          html+='</div>';
        }
        html+='<div class="sec-hd-sub">Kaplan-Meier Plot</div>';
        html+=svgKaplanMeier(survPrv);
      } else if(survPrv&&survPrv._err){
        html+='<div class="notice-box notice-err">'+escHtml(survPrv.msg)+'</div>';
      } else {
        html+='<div class="chart-empty">Pilih time dan event variable untuk melihat preview kurva KM.</div>';
      }
    }
    else if(aState.survMethod==='logrank'){
      if(!aState.survGroup){
        html+='<div class="notice-box notice-warn">Pilih Group Variable untuk menjalankan log-rank test.</div>';
      } else if(survPrv&&!survPrv._err&&survPrv.groups.length>=2){
        var lr=survPrv.logrank;
        html+='<div class="stats-grid2" style="margin-bottom:12px">';
        html+=stCard('χ²',lr.chi2,'Chi-square');
        html+=stCard('df',lr.df,'');
        html+=stCard('p-value',lr.p_fmt,'');
        html+=stCard('Sig',parseFloat(lr.p)<0.05?'Yes *':'No','');
        html+='</div>';
        html+=mkTable(['Group','N','Events','Censored','Median Survival','O-E'],
          survPrv.groups.map(function(g){return [g.label,g.n,g.events,g.n-g.events,g.medianSurv===null?'NR':SE.f4(g.medianSurv),SE.f4(g.oe||0)];}));
        html+='<div class="sec-hd-sub" style="margin-top:12px">KM Plot (Comparison)</div>';
        html+=svgKaplanMeier(survPrv);
      } else if(survPrv&&survPrv._err){
        html+='<div class="notice-box notice-err">'+escHtml(survPrv.msg)+'</div>';
      } else {
        html+='<div class="chart-empty">Pilih group variable dan pastikan data memiliki minimal 2 kelompok.</div>';
      }
    }
    else if(aState.survMethod==='cox'){
      if(coxPrv&&!coxPrv._err){
        html+='<div class="stats-grid2" style="margin-bottom:12px">';
        html+=stCard('N',coxPrv.n,'');
        html+=stCard('Events',coxPrv.events,'');
        html+=stCard('LR χ²',coxPrv.lrChi2,'p='+coxPrv.lrP_fmt);
        html+=stCard('Concordance',coxPrv.concordance,'C-index');
        html+='</div>';
        html+='<div class="sec-hd-sub">Hazard Ratios</div>';
        html+=mkTable(['Covariate','β','SE','HR','95% CI HR','z','p'],
          coxPrv.coefs.map(function(c){
            var sig=parseFloat(c.p)<0.05;
            var hrNum=parseFloat(c.HR);
            var hrCol=hrNum>1.5?'var(--err)':hrNum<0.67?'var(--ok)':'var(--warn)';
            return [c.name,c.beta,c.se,'<span style="color:'+hrCol+';font-weight:700">'+c.HR+'</span>',c.ci95,c.z,(sig?'<b style="color:var(--ok)">':'')+c.p_fmt+(sig?'</b>':'')];
          }));
        html+='<div style="margin-top:12px">'+svgForestPlot(coxPrv)+'</div>';
      } else if(coxPrv&&coxPrv._err){
        html+='<div class="notice-box notice-err">'+escHtml(coxPrv.msg)+'</div>';
      } else {
        html+='<div class="chart-empty">Pilih minimal 1 covariate untuk melihat preview Cox Proportional Hazards.</div>';
      }
    }
    html+='</div></div>';
  return html;
}

function renderPoweranalysisForm(){
  let html='';
    var pw=aState;
    var testOptions=['ttest_2samp','ttest_1samp','ttest_paired','anova_oneway','correlation','regression_r2','chisq'];
    var testLabels={'ttest_2samp':'Independent Samples T-Test','ttest_1samp':'One-Sample T-Test','ttest_paired':'Paired T-Test','anova_oneway':'One-Way ANOVA (F-test)','correlation':'Correlation (r)','regression_r2':'Multiple Regression (R²)','chisq':'Chi-Square'};
    var effectLabels={'ttest_2samp':"Cohen's d",'ttest_1samp':"Cohen's d",'ttest_paired':"Cohen's dz",'anova_oneway':"Cohen's f",'correlation':"Pearson r",'regression_r2':"Cohen's f²",'chisq':'w (Cohen)'};
    var effectConventions={'ttest_2samp':['0.20','0.50','0.80'],'ttest_1samp':['0.20','0.50','0.80'],'ttest_paired':['0.20','0.50','0.80'],'anova_oneway':['0.10','0.25','0.40'],'correlation':['0.10','0.30','0.50'],'regression_r2':['0.02','0.15','0.35'],'chisq':['0.10','0.30','0.50']};
    var effConvNames=['Small','Medium','Large'];
    var predsInput=function(){return (pw.pwTest||'')==='regression_r2'?'<div style="margin-bottom:9px"><label class="lbl">Number of Predictors (u)</label><input type="number" class="inp" value="'+(pw.pwPreds||1)+'" min="1" max="50" oninput="aState.pwPreds=Math.max(1,parseInt(this.value)||1)" onblur="renderASub()" style="margin-top:5px;width:130px" placeholder="u"/></div>':'';};

    if(currentASub==='poweranalysis'){
      var pwRes=null;
      try{ pwRes=computePower(pw.pwTest,parseFloat(pw.pwAlpha),parseFloat(pw.pwPower),parseFloat(pw.pwEffect),parseInt(pw.pwGroups||2),parseInt(pw.pwTails||2),pw.pwSolve,parseInt(pw.pwN||30),parseInt(pw.pwPreds||1)); }catch(e){ pwRes={err:e.message}; }

      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">Power Analysis'+ossGuideBtn('poweranalysis')+'</div>';
      html+='<div style="margin-bottom:10px">';
      html+=mkOptCsel('pw-test', testOptions.map(function(t){return{val:t,label:testLabels[t]};}), pw.pwTest||'ttest_2samp', 'aState.pwTest=_cR["pw-test"]._vals[_cR["pw-test"].fields.indexOf(val)];renderASub()', 'Statistical Test', true);
      html+='</div>';

      html+='<div style="margin-bottom:10px"><label class="lbl">Solve For</label><div class="row" style="gap:5px;margin-top:5px;flex-wrap:wrap">';
      [['n','N (Sample Size)'],['power','Power (1−β)'],['alpha','Alpha (α)'],['effect','Effect Size']].forEach(function(s){
        html+='<button class="btn '+(pw.pwSolve===s[0]?'btn-active':'btn-ghost')+' btn-sm" onclick="aState.pwSolve=\''+s[0]+'\';renderASub()">'+s[1]+'</button>';
      });
      html+='</div></div>';

      if(pw.pwSolve!=='alpha'){
        html+='<div style="margin-bottom:9px">';
        html+=mkOptCsel('pw-alpha', [{val:0.001,label:'0.001'},{val:0.01,label:'0.01'},{val:0.05,label:'0.05'},{val:0.10,label:'0.10'}], pw.pwAlpha, 'aState.pwAlpha=parseFloat(_cR["pw-alpha"]._vals[_cR["pw-alpha"].fields.indexOf(val)]);renderASub()', 'Significance Level (α)');
        html+='</div>';
      }

      if(pw.pwSolve!=='power'){
        html+='<div style="margin-bottom:9px">';
        html+=mkOptCsel('pw-power', [{val:0.70,label:'0.70 (70%)'},{val:0.80,label:'0.80 (80%)'},{val:0.90,label:'0.90 (90%)'},{val:0.95,label:'0.95 (95%)'}], pw.pwPower, 'aState.pwPower=parseFloat(_cR["pw-power"]._vals[_cR["pw-power"].fields.indexOf(val)]);renderASub()', 'Desired Power (1−β)');
        html+='</div>';
      }

      if(pw.pwSolve!=='effect'){
        html+='<div style="margin-bottom:9px"><label class="lbl">'+effectLabels[pw.pwTest||'ttest_2samp']+' (Effect Size)</label>';
        var convs=effectConventions[pw.pwTest||'ttest_2samp']||['0.2','0.5','0.8'];
        html+='<div class="row" style="gap:5px;margin-top:5px;flex-wrap:wrap">';
        convs.forEach(function(v,i){
          var active=parseFloat(pw.pwEffect)===parseFloat(v);
          html+='<button class="btn '+(active?'btn-active':'btn-ghost')+' btn-sm" onclick="aState.pwEffect='+v+';renderASub()">'+effConvNames[i]+' ('+v+')</button>';
        });
        html+='</div>';
        html+='<input type="number" class="inp" step="0.01" value="'+pw.pwEffect+'" oninput="aState.pwEffect=parseFloat(this.value)||0.5" onblur="renderASub()" style="margin-top:7px;width:130px" placeholder="Custom…"/>';
        html+='</div>';
      }

      if(pw.pwSolve==='n'&&(pw.pwTest==='ttest_2samp'||pw.pwTest==='anova_oneway')){
        html+='<div style="margin-bottom:9px">';
        html+=mkOptCsel('pw-groups', [2,3,4,5,6].map(function(g){return{val:g,label:g+' groups'};}), pw.pwGroups||2, 'aState.pwGroups=parseInt(_cR["pw-groups"]._vals[_cR["pw-groups"].fields.indexOf(val)]);renderASub()', 'Number of Groups');
        html+='</div>';
      }

      if(pw.pwSolve!=='n'){
        var _pwIsGrouped=(pw.pwTest==='ttest_2samp'||pw.pwTest==='anova_oneway');
        html+='<div style="margin-bottom:9px"><label class="lbl">'+(_pwIsGrouped?'Sample Size (N per group)':'Sample Size (N)')+'</label>';
        html+='<input type="number" class="inp" value="'+(pw.pwN||30)+'" min="3" max="10000" oninput="aState.pwN=parseInt(this.value)||30" onblur="renderASub()" style="margin-top:5px;width:130px" placeholder="N"/>';
        html+='</div>';
      }

      if((pw.pwTest||'').indexOf('ttest')>=0||(pw.pwTest||'').indexOf('correlation')>=0){
        html+='<div style="margin-bottom:9px">';
        html+=mkOptCsel('pw-tails', [{val:1,label:'1-tailed'},{val:2,label:'2-tailed'}], pw.pwTails||2, 'aState.pwTails=parseInt(_cR["pw-tails"]._vals[_cR["pw-tails"].fields.indexOf(val)]);renderASub()', 'Hypothesis Tails');
        html+='</div>';
      }

      html+=predsInput();
      html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runPowerAnalysis()">▶ Run</button>';
      html+='</div>';

      html+='<div class="card"><div class="sec-hd">Preview</div>';
      if(pwRes&&!pwRes.err){
        html+='<div class="stats-grid2" style="margin-bottom:12px">';
        html+=stCard('Sample Size (N)',pwRes.n,pwRes.groups>1?'Per group':'');
        html+=stCard('Power (1−β)',SE.f4(pwRes.power),pwRes.powerInterp);
        html+=stCard('Alpha (α)',SE.f4(pwRes.alpha),'Type I error');
        html+=stCard(effectLabels[pw.pwTest||'ttest_2samp'],SE.f4(pwRes.effect),pwRes.effectInterp);
        html+='</div>';
        if(pwRes.totalN) html+='<div class="notice-box notice-ok" style="margin-bottom:10px"><b style="color:var(--ok)">Total N needed: '+pwRes.totalN+'</b>'+(pwRes.groups>1?' ('+pwRes.groups+' groups × '+pwRes.n+' per group)':'')+'</div>';
        var pwr=parseFloat(pwRes.power);
        var pwCol=pwr>=0.9?'var(--ok)':pwr>=0.8?'var(--warn)':'var(--err)';
        html+='<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:11px;color:var(--ink-muted);margin-bottom:4px"><span>Power</span><span style="color:'+pwCol+';font-weight:700">'+SE.f4(pwr*100)+'%</span></div>';
        html+='<div style="height:8px;background:var(--surface-alt);border:1px solid var(--line-soft);border-radius:var(--r-sm);overflow:hidden"><div style="height:100%;width:'+Math.min(100,pwr*100)+'%;background:'+pwCol+';transition:width .3s"></div></div></div>';
        var convRef=effectConventions[pw.pwTest||'ttest_2samp']||['0.2','0.5','0.8'];
        html+='<div class="sec-hd-sub" style="margin-top:8px">Effect Size Benchmarks</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th>Level</th><th style="text-align:right">'+effectLabels[pw.pwTest||'ttest_2samp']+'</th></tr></thead><tbody>';
        html+='<tr><td class="td-label" style="color:var(--ok);font-weight:700">Small</td><td class="td-num">'+convRef[0]+'</td></tr>';
        html+='<tr><td class="td-label" style="color:var(--warn);font-weight:700">Medium</td><td class="td-num">'+convRef[1]+'</td></tr>';
        html+='<tr><td class="td-label" style="color:var(--err);font-weight:700">Large</td><td class="td-num">'+convRef[2]+'</td></tr>';
        html+='</tbody></table></div>';
      } else if(pwRes&&pwRes.err){
        html+='<div class="notice-box notice-err">'+escHtml(pwRes.err)+'</div>';
      } else {
        html+='<div class="chart-empty">Atur parameter di sebelah kiri untuk melihat preview power.</div>';
      }
      html+='</div></div>';
    }

    else if(currentASub==='powerplot'){
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">Power Curves'+ossGuideBtn('powerplot')+'</div>';
      html+='<div style="margin-bottom:9px">';
      html+=mkOptCsel('pw-test-plot', testOptions.map(function(t){return{val:t,label:testLabels[t]};}), pw.pwTest||'ttest_2samp', 'aState.pwTest=_cR["pw-test-plot"]._vals[_cR["pw-test-plot"].fields.indexOf(val)];renderASub()', 'Test Type', true);
      html+='</div>';
      html+='<div style="margin-bottom:9px">';
      html+=mkOptCsel('pw-alpha-plot', [{val:0.001,label:'α = 0.001'},{val:0.01,label:'α = 0.01'},{val:0.05,label:'α = 0.05'},{val:0.10,label:'α = 0.10'}], pw.pwAlpha, 'aState.pwAlpha=parseFloat(_cR["pw-alpha-plot"]._vals[_cR["pw-alpha-plot"].fields.indexOf(val)]);renderASub()', 'Alpha (α)');
      html+='</div>';
      if((pw.pwTest||'').indexOf('ttest')>=0||(pw.pwTest||'').indexOf('correlation')>=0){
        html+='<div style="margin-bottom:9px">';
        html+=mkOptCsel('pw-tails-plot', [{val:1,label:'1-tailed'},{val:2,label:'2-tailed'}], pw.pwTails||2, 'aState.pwTails=parseInt(_cR["pw-tails-plot"]._vals[_cR["pw-tails-plot"].fields.indexOf(val)]);renderASub()', 'Hypothesis Tails');
        html+='</div>';
      }
      html+=predsInput();
      html+='<button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="runPowerAnalysis()">▶ Run</button>';
      html+='</div>';

      html+='<div class="card"><div class="sec-hd">Preview</div>';
      html+='<div class="sec-hd-sub" style="margin-top:0">Power Curves</div>';
      html+=svgPowerCurve(pw.pwTest||'ttest_2samp',parseFloat(pw.pwAlpha)||0.05,parseInt(pw.pwTails||2),undefined,undefined,parseInt(pw.pwPreds||1));
      html+='<div class="sec-hd-sub" style="margin-top:12px">Required Sample Size ('+((pw.pwTest==='ttest_2samp'||pw.pwTest==='anova_oneway')?'N per group':'N')+')</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Effect Size</th><th style="text-align:right">70%</th><th style="text-align:right">80%</th><th style="text-align:right">90%</th><th style="text-align:right">95%</th></tr></thead><tbody>';
      var convRef2=effectConventions[pw.pwTest||'ttest_2samp']||['0.2','0.5','0.8'];
      convRef2.forEach(function(eff,ei){
        html+='<tr><td class="td-label">'+eff+' ('+effConvNames[ei]+')</td>';
        [0.70,0.80,0.90,0.95].forEach(function(pwr2){
          try{var r2=computePower(pw.pwTest||'ttest_2samp',parseFloat(pw.pwAlpha)||0.05,pwr2,parseFloat(eff),parseInt(pw.pwGroups||2),parseInt(pw.pwTails||2),'n',30,parseInt(pw.pwPreds||1));html+='<td class="td-num" style="color:'+(pwr2>=0.8?'var(--ok)':'var(--warn)')+';font-weight:700">'+r2.n+'</td>';}
          catch(e2){html+='<td class="td-num">—</td>';}
        });
        html+='</tr>';
      });
      html+='</tbody></table></div></div></div>';
    }

    else if(currentASub==='sensitivity'){
      var mde=null;
      try{ mde=computePower(pw.pwTest||'ttest_2samp',parseFloat(pw.pwAlpha)||0.05,parseFloat(pw.pwPower)||0.80,null,parseInt(pw.pwGroups||2),parseInt(pw.pwTails||2),'effect',parseInt(pw.pwN||30),parseInt(pw.pwPreds||1)); }catch(e){}

      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">Sensitivity Analysis'+ossGuideBtn('sensitivity')+'</div>';
      html+='<div style="margin-bottom:9px">';
      html+=mkOptCsel('pw-test-sens', testOptions.map(function(t){return{val:t,label:testLabels[t]};}), pw.pwTest||'ttest_2samp', 'aState.pwTest=_cR["pw-test-sens"]._vals[_cR["pw-test-sens"].fields.indexOf(val)];renderASub()', 'Test Type', true);
      html+='</div>';
      html+='<div style="margin-bottom:9px"><label class="lbl">'+((pw.pwTest==='ttest_2samp'||pw.pwTest==='anova_oneway')?'N per group':'Sample Size (N)')+'</label><input type="number" class="inp" style="margin-top:5px" value="'+(pw.pwN||30)+'" min="3" max="10000" oninput="aState.pwN=parseInt(this.value)||30" onblur="renderASub()" placeholder="N"/></div>';
      html+='<div style="margin-bottom:9px">';
      html+=mkOptCsel('pw-power-sens', [{val:0.70,label:'0.70 (70%)'},{val:0.80,label:'0.80 (80%)'},{val:0.90,label:'0.90 (90%)'},{val:0.95,label:'0.95 (95%)'}], pw.pwPower, 'aState.pwPower=parseFloat(_cR["pw-power-sens"]._vals[_cR["pw-power-sens"].fields.indexOf(val)]);renderASub()', 'Desired Power');
      html+='</div>';
      html+='<div style="margin-bottom:9px">';
      html+=mkOptCsel('pw-alpha-sens', [{val:0.001,label:'0.001'},{val:0.01,label:'0.01'},{val:0.05,label:'0.05'},{val:0.10,label:'0.10'}], pw.pwAlpha, 'aState.pwAlpha=parseFloat(_cR["pw-alpha-sens"]._vals[_cR["pw-alpha-sens"].fields.indexOf(val)]);renderASub()', 'Alpha (α)');
      html+='</div>';
      html+=predsInput();
      html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runPowerAnalysis()">▶ Run</button>';
      html+='</div>';

      html+='<div class="card"><div class="sec-hd">Preview</div>';
      if(mde&&!mde.err){
        html+='<div class="stats-grid2" style="margin-bottom:12px">';
        html+=stCard((pw.pwTest==='ttest_2samp'||pw.pwTest==='anova_oneway')?'N per group':'N',pw.pwN,'Input');
        html+=stCard('MDE',SE.f4(mde.effect),effectLabels[pw.pwTest||'ttest_2samp']);
        html+=stCard('Power',SE.f4(mde.power*100)+'%','');
        html+=stCard('Alpha',pw.pwAlpha,'');
        html+='</div>';
        html+='<div class="sec-hd-sub">Sensitivity Curve</div>';
        html+=svgSensitivityCurve(pw.pwTest||'ttest_2samp',parseFloat(pw.pwAlpha)||0.05,parseFloat(pw.pwPower)||0.80,parseInt(pw.pwTails||2),parseInt(pw.pwN||30),undefined,undefined,parseInt(pw.pwPreds||1));
      } else if(mde&&mde.err){
        html+='<div class="notice-box notice-err">'+escHtml(mde.err)+'</div>';
      } else {
        html+='<div class="chart-empty">Atur N dan parameter untuk melihat Minimum Detectable Effect.</div>';
      }
      html+='</div></div>';
    }
  return html;
}

function renderModerationForm(){
  let html='';
    var nF2=numFields();
    if(!aState.modX&&nF2.length>0) aState.modX=nF2[0];
    if(!aState.modW&&nF2.length>1) aState.modW=nF2[1];
    if(!aState.modY&&nF2.length>2) aState.modY=nF2[2];
    var modValid=aState.modX&&aState.modW&&aState.modY&&aState.modX!==aState.modW&&aState.modX!==aState.modY&&aState.modW!==aState.modY;
    var modPrv=modValid?tryStats(function(){return computeModeration(aState.modX,aState.modW,aState.modY,aState.modCovs||[],aState.modCenter!==false);}):null;

    function modLeftControls(title, guideId){
      var lh='<div class="card"><div class="sec-hd">'+title+ossGuideBtn(guideId)+'</div>';
      lh+=mkSelect('mod-x',nF2,aState.modX,'aState.modX=val;renderASub()','Independent Variable (X)');
      lh+='<div style="margin-top:8px">'+mkSelect('mod-w',nF2,aState.modW,'aState.modW=val;renderASub()','Moderator Variable (W)')+'</div>';
      lh+='<div style="margin-top:8px">'+mkSelect('mod-y',nF2,aState.modY,'aState.modY=val;renderASub()','Dependent Variable (Y)')+'</div>';
      lh+='<div style="margin-top:10px"><label class="lbl">Covariates (optional)</label><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">';
      nF2.forEach(function(f){
        if(f===aState.modX||f===aState.modW||f===aState.modY) return;
        var checked=(aState.modCovs||[]).includes(f);
        lh+='<label class="chip-opt'+(checked?' sel':'')+'"><input type="checkbox" '+(checked?'checked':'')+' onchange="toggleModCov(this.dataset.fld,this.checked)" data-fld="'+escHtmlAttr(f)+'"/>'+escHtml(f)+'</label>';
      });
      lh+='</div></div>';
      lh+='<div style="margin-top:10px"><label style="display:flex;align-items:center;gap:7px;cursor:pointer"><input type="checkbox" '+(aState.modCenter!==false?'checked':'')+' onchange="aState.modCenter=this.checked;renderASub()" style="accent-color:var(--gold)"/><span style="font-size:12px;color:var(--ink)">Mean-center X and W before interaction</span></label></div>';
      lh+='<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="runModeration()">▶ Run</button>';
      lh+='</div>';
      return lh;
    }

    if(currentASub==='moderation'){
      html+='<div class="grid2">';
      html+=modLeftControls('Moderation Analysis (X×W → Y)','moderation');

      html+='<div class="card"><div class="sec-hd">Preview</div>';
      if(modPrv&&!modPrv._err){
        var intSig=parseFloat(modPrv.interaction.p)<0.05;
        html+='<div class="stats-grid2" style="margin-bottom:10px">';
        html+=stCard('R²',modPrv.R2,'Adj '+modPrv.R2adj);
        html+=stCard('F',modPrv.F,'df='+modPrv.dfR+','+modPrv.dfE);
        html+=stCard('ΔR² (X×W)',modPrv.deltaR2,'p='+modPrv.interaction.p_fmt);
        html+=stCard('N',modPrv.n,'');
        html+='</div>';
        html+='<div class="notice-box '+(intSig?'notice-ok':'notice-err')+'" style="margin-bottom:10px">';
        html+='Interaction ('+escHtml(aState.modX)+'×'+escHtml(aState.modW)+'): <b style="color:'+(intSig?'var(--ok)':'var(--err)')+'">b='+modPrv.interaction.b+', t='+modPrv.interaction.t+', p='+modPrv.interaction.p_fmt+'</b>';
        html+=(intSig?' ✓ Sig':' ✗ ns')+'</div>';
        html+='<div class="sec-hd-sub">Interaction Plot</div>';
        html+=svgModerationPlot(modPrv,aState.modX,aState.modW,aState.modY);
        html+='<div style="margin-top:12px"><div class="sec-hd-sub">Coefficient Table</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th>Variable</th><th style="text-align:right">b</th><th style="text-align:right">SE</th><th style="text-align:right">β</th><th style="text-align:right">t</th><th style="text-align:right">p</th></tr></thead><tbody>';
        modPrv.coefs.forEach(function(c){
          html+='<tr><td class="td-label">'+escHtml(c.name)+'</td><td class="td-num">'+c.b+'</td><td class="td-num">'+c.SE+'</td><td class="td-num">'+c.beta+'</td><td class="td-num">'+c.t+'</td><td class="td-num"><span class="tag '+(parseFloat(c.p)<0.05?'tag-green':'tag-gray')+'">'+c.p_fmt+'</span></td></tr>';
        });
        html+='</tbody></table></div></div>';
      } else if(modPrv&&modPrv._err){
        html+='<div class="notice-box notice-err">'+escHtml(modPrv.msg)+'</div>';
      } else {
        html+='<div class="chart-empty">Pilih X, W, dan Y yang berbeda untuk melihat preview moderasi.</div>';
      }
      html+='</div></div>';
    }

    else if(currentASub==='simpleslopes'){
      html+='<div class="grid2">';
      html+=modLeftControls('Simple Slopes Analysis','simpleslopes');

      html+='<div class="card"><div class="sec-hd">Preview</div>';
      if(!modValid){
        html+='<div class="chart-empty">Pilih X, W, dan Y yang berbeda untuk melihat preview simple slopes.</div>';
      } else if(modPrv&&!modPrv._err){
        var ss=modPrv.simpleSlopes;
        html+='<div class="tbl-wrap"><table><thead><tr><th>W Level</th><th style="text-align:right">W Value</th><th style="text-align:right">Slope</th><th style="text-align:right">SE</th><th style="text-align:right">t</th><th style="text-align:right">p</th><th style="text-align:right">95% CI</th><th>Sig</th></tr></thead><tbody>';
        ss.forEach(function(s){
          var sSig=parseFloat(s.p)<0.05;
          html+='<tr><td class="td-label" style="font-weight:700">'+escHtml(s.label)+'</td><td class="td-num">'+s.wVal+'</td><td class="td-num" style="color:'+(sSig?'var(--ok)':'var(--ink-muted)')+';font-weight:700">'+s.slope+'</td><td class="td-num">'+s.se+'</td><td class="td-num">'+s.t+'</td><td class="td-num"><span class="tag '+(sSig?'tag-green':'tag-gray')+'">'+s.p_fmt+'</span></td><td class="td-num">'+s.ci95+'</td><td>'+(sSig?'*':'ns')+'</td></tr>';
        });
        html+='</tbody></table></div>';
        html+='<div class="sec-hd-sub" style="margin-top:12px">Simple Slopes Plot</div>';
        html+=svgSimpleSlopesPlot(modPrv,aState.modX,aState.modW,aState.modY);
      } else if(modPrv&&modPrv._err){
        html+='<div class="notice-box notice-err">'+escHtml(modPrv.msg)+'</div>';
      }
      html+='</div></div>';
    }

    else if(currentASub==='jn'){
      html+='<div class="grid2">';
      html+=modLeftControls('Johnson-Neyman Technique','jn');

      html+='<div class="card"><div class="sec-hd">Preview</div>';
      if(!modValid){
        html+='<div class="chart-empty">Pilih X, W, dan Y yang berbeda untuk melihat preview Johnson-Neyman.</div>';
      } else if(modPrv&&!modPrv._err){
        var jn=modPrv.jn;
        html+='<div class="stats-grid2" style="margin-bottom:12px">';
        html+=stCard('JN Point(s)',jn.regions.length>0?jn.regions.map(function(r){return SE.f4(r.value);}).join(', '):'None','W value (p=0.05)');
        html+=stCard('% W significant',jn.pctSig+'%','Cases in sig region');
        html+='</div>';
        html+='<div class="sec-hd-sub">Johnson-Neyman Plot</div>';
        html+=svgJohnsonNeymanPlot(modPrv,aState.modX,aState.modW,aState.modY);
        if(jn.regions.length>0){
          html+='<div style="margin-top:10px"><div class="tbl-wrap"><table><thead><tr><th>JN Point</th><th style="text-align:right">W Value</th><th>Sig Region</th><th style="text-align:right">% Dataset</th></tr></thead><tbody>';
          jn.regions.forEach(function(r,i){
            html+='<tr><td class="td-label">JN-'+(i+1)+'</td><td class="td-num">'+SE.f4(r.value)+'</td><td style="font-size:11.5px;color:var(--gold-text);font-weight:700">'+escHtml(r.direction)+'</td><td class="td-num">'+r.pct+'%</td></tr>';
          });
          html+='</tbody></table></div></div>';
        }
      } else if(modPrv&&modPrv._err){
        html+='<div class="notice-box notice-err">'+escHtml(modPrv.msg)+'</div>';
      }
      html+='</div></div>';
    }
  return html;
}

function renderBayesianForm(){
  let html='';
  const nF=numFields(),aF=allFields();
    var bV=aState.bayV||nF[0]||'';
    var bG=aState.bayG||aF[aF.length>1?aF.length-1:0]||'';
    var bPrior=aState.bayPrior||0.707;
    var bTails=aState.bayTails||2;
    var prv=null;
    if(bV&&bG){
      var grps=[...new Set(data.map(function(r){return r[bG];}).filter(function(v){return v!==null&&v!==undefined;}))]
        .sort().slice(0,2);
      if(grps.length>=2){
        var a2=SE.validNums(data.filter(function(r){return r[bG]===grps[0];}).map(function(r){return r[bV];}));
        var b2=SE.validNums(data.filter(function(r){return r[bG]===grps[1];}).map(function(r){return r[bV];}));
        prv=tryStats(function(){return SE.bayesTTest(a2,b2,bPrior,bTails);});
      }
    }
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Bayesian Independent T-Test'+ossGuideBtn('bayesian')+'</div>';
    html+=mkSelect('bay-v',nF,bV,'aState.bayV=val;renderASub()','Dependent Variable');
    html+='<div style="margin-top:8px">'+mkSelect('bay-g',aF,bG,'aState.bayG=val;renderASub()','Grouping Variable')+'</div>';
    html+='<div style="margin-top:10px">';
    html+='<label class="lbl">Prior scale (r)</label>';
    html+='<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:5px">';
    [{v:0.354,l:'Wide (0.354)'},{v:0.707,l:'Default (√2/2)'},{v:1,l:'Ultrawide (1)'}].forEach(function(opt){
      var sel=Math.abs(bPrior-opt.v)<0.01;
      html+='<button class="btn btn-sm '+(sel?'btn-active':'btn-ghost')+'" onclick="aState.bayPrior='+opt.v+';renderASub()">'+opt.l+'</button>';
    });
    html+='</div></div>';
    html+='<div style="margin-top:10px">';
    html+='<label class="lbl">Hypothesis</label>';
    html+='<div style="display:flex;gap:7px;margin-top:5px">';
    [{v:2,l:'Two-tailed (≠)'},{v:1,l:'One-tailed (>)'}].forEach(function(opt){
      var sel=bTails===opt.v;
      html+='<button class="btn btn-sm '+(sel?'btn-active':'btn-ghost')+'" onclick="aState.bayTails='+opt.v+';renderASub()">'+opt.l+'</button>';
    });
    html+='</div></div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="runBayes()">▶ Run</button>';
    html+='</div>';

    html+='<div class="card"><div class="sec-hd">Preview</div>';
    if(prv&&!prv._err){
      var bf=parseFloat(prv.BF10);
      var bfCol=bf>3?'var(--ok)':bf>0.333?'var(--warn)':'var(--err)';
      var bfCls=bf>3?'notice-ok':bf>0.333?'notice-warn':'notice-err';
      html+='<div class="notice-box '+bfCls+'" style="margin-bottom:10px">';
      html+='<div style="font-size:18px;font-weight:700;color:'+bfCol+';font-family:var(--font-serif-stack);font-variant-numeric:tabular-nums">BF₁₀ = '+prv.BF10+'</div>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-top:3px">'+escHtml(prv.interpretation)+'</div>';
      html+='</div>';
      html+='<div class="stats-grid2" style="margin-bottom:10px">';
      html+=stCard('BF₁₀',prv.BF10,'Evidence ratio');
      html+=stCard('BF₀₁',prv.BF01,'Evidence for null');
      html+=stCard("Cohen's d",prv.cohensD,prv.dInterp);
      html+=stCard('t-statistic',prv.t,'df='+prv.df);
      html+='</div>';
      var bf2=parseFloat(prv.BF10);
      var bf2pct=Math.min(100,Math.max(0,bf2>100?100:bf2>10?(60+bf2*0.4):bf2>3?(40+bf2*6.67):bf2>1?(25+bf2*5):bf2*10));
      html+='<div style="margin-bottom:12px">';
      html+='<div style="font-size:10.5px;color:var(--ink-subtle);margin-bottom:5px;text-transform:uppercase;letter-spacing:1px;font-weight:700">Evidence Scale</div>';
      html+='<div style="position:relative;height:10px;border-radius:var(--r-sm);border:1px solid var(--line-soft);display:flex;overflow:visible">';
      html+='<div style="width:33.3%;height:100%;background:var(--err-bg);border-right:1px solid var(--line-soft)"></div>';
      html+='<div style="width:26.7%;height:100%;background:var(--warn-bg);border-right:1px solid var(--line-soft)"></div>';
      html+='<div style="width:40%;height:100%;background:var(--ok-bg)"></div>';
      html+='<div style="position:absolute;top:-3px;left:'+Math.max(2,Math.min(98,bf2pct))+'%;width:3px;height:14px;background:var(--ink);transform:translateX(-50%)"></div>';
      html+='</div>';
      html+='<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--ink-subtle);margin-top:4px"><span>Strong H₀</span><span>Anecdotal</span><span>Strong H₁</span></div>';
      html+='</div>';
      html+='<div class="sec-hd-sub">Group Distributions</div>';
      html+=svgBoxplot(data,bV,bG);
    } else if(prv&&prv._err){
      html+='<div class="notice-box notice-err">'+escHtml(prv.msg)+'</div>';
    } else {
      html+='<div class="chart-empty">Pilih variabel numerik dan variabel grup (minimal 2 kelompok) untuk preview.</div>';
    }
    html+='</div></div>';
  return html;
}

function renderBayesianCorrForm(){
  let html='';
  const nF=numFields();
    var bcX=aState.bcX||nF[0]||'';
    var bcY=aState.bcY||(nF.length>1?nF[1]:'');
    var bcPrior=aState.bcPrior||1;
    var bcPrv=null;
    if(bcX&&bcY){
      bcPrv=tryStats(function(){return SE.bayesPearson(SE.validNums(data.map(function(r){return r[bcX];})),SE.validNums(data.map(function(r){return r[bcY];})),bcPrior);});
    }
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Bayesian Correlation'+ossGuideBtn('bayesian_corr')+'</div>';
    html+=mkSelect('bc-x',nF,bcX,'aState.bcX=val;renderASub()','Variable X');
    html+='<div style="margin-top:8px">'+mkSelect('bc-y',nF,bcY,'aState.bcY=val;renderASub()','Variable Y')+'</div>';
    html+='<div style="margin-top:10px">';
    html+='<label class="lbl">Prior scale (κ)</label>';
    html+='<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:5px">';
    [{v:0.5,l:'0.5'},{v:1,l:'1 (default)'},{v:2,l:'2'}].forEach(function(opt){
      var sel=Math.abs(bcPrior-opt.v)<0.01;
      html+='<button class="btn btn-sm '+(sel?'btn-active':'btn-ghost')+'" onclick="aState.bcPrior='+opt.v+';renderASub()">'+opt.l+'</button>';
    });
    html+='</div></div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="runBayesCorr()">▶ Run</button>';
    html+='</div>';

    html+='<div class="card"><div class="sec-hd">Preview</div>';
    if(bcPrv&&!bcPrv._err){
      var bfc=parseFloat(bcPrv.BF10);
      var bfcCol=bfc>3?'var(--ok)':bfc>0.333?'var(--warn)':'var(--err)';
      var bfcCls=bfc>3?'notice-ok':bfc>0.333?'notice-warn':'notice-err';
      html+='<div class="notice-box '+bfcCls+'" style="margin-bottom:10px">';
      html+='<div style="font-size:18px;font-weight:700;color:'+bfcCol+';font-family:var(--font-serif-stack);font-variant-numeric:tabular-nums">BF₁₀ = '+bcPrv.BF10+'</div>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-top:3px">'+escHtml(bcPrv.interpretation)+'</div>';
      html+='</div>';
      html+='<div class="stats-grid2" style="margin-bottom:12px">';
      html+=stCard('BF₁₀',bcPrv.BF10,'');
      html+=stCard('BF₀₁',bcPrv.BF01,'');
      html+=stCard('Pearson r',bcPrv.r,'');
      html+=stCard('p-value',bcPrv.p_fmt,'NHST');
      html+='</div>';
      html+='<div class="sec-hd-sub">Scatter Plot</div>';
      html+=svgScatter(data,bcX,bcY);
    } else if(bcPrv&&bcPrv._err){
      html+='<div class="notice-box notice-err">'+escHtml(bcPrv.msg)+'</div>';
    } else {
      html+='<div class="chart-empty">Pilih Variable X dan Variable Y untuk melihat preview korelasi Bayesian.</div>';
    }
    html+='</div></div>';
  return html;
}

function renderBayesianPosteriorForm(){
  let html='';
  const nF=numFields();
    var bpV=aState.bpV||nF[0]||'';
    var bpMu0=aState.bpMu0!==undefined?aState.bpMu0:0;
    var bpKappa=aState.bpKappa||1;
    var bpAlpha=aState.bpAlpha||0.5;
    var bpBeta=aState.bpBeta||0.5;
    var bpPrv=null;
    var bpVals=SE.validNums(data.map(function(r){return r[bpV];}));
    if(bpVals.length>=3){
      bpPrv=tryStats(function(){return SE.bayesPosteriorNormal(bpVals,bpMu0,bpKappa,bpAlpha,bpBeta);});
    }
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">&#x3B2; Posterior Distribution'+ossGuideBtn('bayesian_posterior')+'</div>';
    html+=mkSelect('bp-v',nF,bpV,'aState.bpV=val;renderASub()','Variable');
    html+='<div class="grid2" style="margin-top:10px;gap:8px">';
    html+='<div><label class="lbl">Prior mean (μ₀)</label><input class="inp" type="number" step="any" value="'+bpMu0+'" oninput="aState.bpMu0=parseFloat(this.value)||0" onblur="renderASub()"/></div>';
    html+='<div><label class="lbl">Prior precision (κ₀)</label><input class="inp" type="number" step="0.1" min="0.01" value="'+bpKappa+'" oninput="aState.bpKappa=Math.max(0.01,parseFloat(this.value)||1)" onblur="renderASub()"/></div>';
    html+='<div><label class="lbl">α₀ (shape)</label><input class="inp" type="number" step="0.1" min="0.01" value="'+bpAlpha+'" oninput="aState.bpAlpha=Math.max(0.01,parseFloat(this.value)||0.5)" onblur="renderASub()"/></div>';
    html+='<div><label class="lbl">β₀ (rate)</label><input class="inp" type="number" step="0.1" min="0.01" value="'+bpBeta+'" oninput="aState.bpBeta=Math.max(0.01,parseFloat(this.value)||0.5)" onblur="renderASub()"/></div>';
    html+='</div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="runBayesPosterior()">▶ Run</button>';
    html+='</div>';

    html+='<div class="card"><div class="sec-hd">Preview</div>';
    if(bpPrv&&!bpPrv._err){
      html+='<div class="stats-grid2" style="margin-bottom:12px">';
      html+=stCard('Posterior Mean (μ)',bpPrv.postMean,'');
      html+=stCard('95% Credible Interval',bpPrv.hdi95,'HDI');
      html+=stCard('Posterior SD',bpPrv.postSD,'');
      html+=stCard('N',bpPrv.n,'observations');
      html+=stCard('Prior μ₀',bpPrv.priorMu0,'');
      html+=stCard('Posterior κₙ',bpPrv.postKappa,'precision');
      html+='</div>';
      html+='<div class="sec-hd-sub">Prior vs Posterior</div>';
      html+=svgBayesPosterior(bpPrv);
    } else if(bpPrv&&bpPrv._err){
      html+='<div class="notice-box notice-err">'+escHtml(bpPrv.msg)+'</div>';
    } else {
      html+='<div class="chart-empty">Pilih variabel numerik dengan ≥3 observasi untuk preview posterior.</div>';
    }
    html+='</div></div>';
  return html;
}

function renderTimeseriesForm(){
  let html='';
  const nF=numFields();
  var T=ossChartTheme();
    var tsV  = aState.tsV  || nF[0] || '';
    var tsMod= aState.tsMod|| 'arima';
    var tsP  = aState.tsP  !== undefined ? aState.tsP  : 1;
    var tsD  = aState.tsD  !== undefined ? aState.tsD  : 1;
    var tsQ  = aState.tsQ  !== undefined ? aState.tsQ  : 1;
    var tsDType = aState.tsDType || 'additive';
    var tsPeriod= aState.tsPeriod!== undefined ? aState.tsPeriod : 12;
    var tsVals  = SE.validNums(data.map(function(r){return r[tsV];}));
    var tsN     = tsVals.length;
    var tsRes = tsN>=4 ? tryStats(function(){
      if(tsMod==='arima') return tsARIMA(tsVals,tsP,tsD,tsQ);
      else return tsDecomp(tsVals,tsPeriod,tsDType);
    }) : null;

    html+='<div class="grid2">';

    html+='<div class="card"><div class="sec-hd">Time Series Analysis'+ossGuideBtn('timeseries')+'</div>';
    html+=mkSelect('ts-v',nF,tsV,'aState.tsV=val;renderASub()','Time-ordered Variable');
    html+='<div style="margin-top:9px">'+mkCsel('ts-mod',['arima','decomp'],tsMod,'aState.tsMod=val;renderASub()','Method')+'</div>';

    if(tsMod==='arima'){
      html+='<div style="margin-top:10px"><div class="sec-hd-sub" style="margin-bottom:7px">ARIMA Orders <span style="color:var(--ink-subtle);font-weight:400">(p, d, q)</span></div>';
      html+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">';
      [['AR (p)','tsP',tsP],['Diff (d)','tsD',tsD],['MA (q)','tsQ',tsQ]].forEach(function(f){
        html+='<div><label class="lbl" style="font-size:10px">'+f[0]+'</label>';
        html+='<div style="display:flex;gap:3px;margin-top:3px">';
        [0,1,2,3].forEach(function(v){
          html+='<button class="btn btn-sm '+(f[2]===v?'btn-active':'btn-ghost')+'" style="flex:1;padding:4px 2px;min-width:0;text-align:center;justify-content:center;display:flex;align-items:center" onclick="aState.'+f[1]+'='+v+';renderASub()">'+v+'</button>';
        });
        html+='</div></div>';
      });
      html+='</div></div>';
    } else {
      html+='<div style="margin-top:10px"><label class="lbl">Seasonal Period</label>';
      html+='<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:5px">';
      [4,7,12,24,52].forEach(function(v){
        html+='<button class="btn btn-sm '+(tsPeriod===v?'btn-active':'btn-ghost')+'" onclick="aState.tsPeriod='+v+';renderASub()">'+v+(v===4?' (Q)':v===7?' (D)':v===12?' (M)':v===24?' (H)':' (W)')+'</button>';
      });
      html+='</div>';
      html+='<div style="margin-top:9px">'+mkCsel('ts-dtype',['additive','multiplicative'],tsDType,'aState.tsDType=val;renderASub()','Model Type')+'</div>';
      html+='</div>';
    }
    html+='<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="runTimeSeries()">▶ Run</button>';
    html+='</div>';

    html+='<div class="card"><div class="sec-hd">Preview</div>';
    if(tsVals.length>0){
      html+='<div class="stats-grid2" style="margin-bottom:10px">';
      html+=stCard('N',tsN,'observations');
      html+=stCard('Mean',SE.f4(SE.mean(tsVals)),'');
      html+=stCard('Std Dev',SE.f4(SE.std(tsVals)),'');
      var tsMin=Math.min.apply(null,tsVals),tsMax=Math.max.apply(null,tsVals);
      html+=stCard('Range',SE.f4(tsMin)+' – '+SE.f4(tsMax),'Min – Max');
      if(tsMod==='arima'&&tsRes&&!tsRes._err){
        html+=stCard('AIC / BIC',tsRes.aic+' / '+tsRes.bic,'σ̂='+tsRes.sigma);
        html+=stCard('1-step Forecast',tsRes.forecast,'['+tsRes.fc_lo95+' – '+tsRes.fc_hi95+']');
      } else if(tsMod==='decomp'&&tsRes&&!tsRes._err){
        html+=stCard('Period / Type',tsRes.period+' ('+tsRes.type+')','');
        html+=stCard('Seasonal Strength',tsRes.strength,'Rem SD='+SE.f4(SE.std(tsRes.remainder.filter(isFinite))));
      }
      html+='</div>';
    }

    if(tsVals.length>1){
      var svgW=420,svgH=140;
      var vMin=Math.min.apply(null,tsVals),vMax=Math.max.apply(null,tsVals);
      var vRange=vMax-vMin||1;
      var pxFn=function(i){return 28+i*(svgW-40)/(tsVals.length-1);};
      var pyFn=function(v){return svgH-20-(v-vMin)/vRange*(svgH-30);};
      var ptStr=tsVals.map(function(v,i){return pxFn(i)+','+pyFn(v);}).join(' ');
      var svgLine='<svg viewBox="0 0 '+svgW+' '+svgH+'" style="width:100%;height:'+svgH+'px">';
      var aPath='M'+pxFn(0)+','+svgH+' '+tsVals.map(function(v,i){return pxFn(i)+','+pyFn(v);}).join(' L')+' L'+pxFn(tsVals.length-1)+','+svgH+' Z';
      svgLine+='<path d="'+aPath+'" fill="'+T.iceSoft+'" fill-opacity="0.22"/>';
      svgLine+='<polyline points="'+ptStr+'" fill="none" stroke="'+T.ice+'" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>';
      if(tsMod==='arima'&&tsRes&&!tsRes._err&&tsRes.origFitted&&tsRes.origFitted.length>0){
        var fitOff=tsP+tsD;
        var fPts=tsRes.origFitted.map(function(v,i){return pxFn(fitOff+i)+','+pyFn(Math.max(vMin-vRange*.05,Math.min(vMax+vRange*.05,v)));}).join(' ');
        svgLine+='<polyline points="'+fPts+'" fill="none" stroke="'+T.gold+'" stroke-width="1.4" stroke-dasharray="3,2"/>';
      }
      svgLine+='<line x1="28" y1="'+(svgH-1)+'" x2="'+svgW+'" y2="'+(svgH-1)+'" stroke="'+T.axis+'"/>';
      svgLine+='<line x1="29" y1="0" x2="29" y2="'+(svgH-1)+'" stroke="'+T.axis+'"/>';
      svgLine+='<text x="2" y="14" font-size="9" fill="'+T.muted+'" font-family="var(--font-sans-stack)">'+SE.f4(vMax)+'</text>';
      svgLine+='<text x="2" y="'+(svgH-5)+'" font-size="9" fill="'+T.muted+'" font-family="var(--font-sans-stack)">'+SE.f4(vMin)+'</text>';
      svgLine+='</svg>';
      html+='<div class="sec-hd-sub">Time Series Plot'+(tsMod==='arima'&&tsRes&&!tsRes._err?' <span style="font-size:10px;color:var(--ink-subtle);font-weight:400">(dashed = fitted)</span>':'')+'</div>'+svgLine;
    }

    if(tsMod==='arima'&&tsRes&&!tsRes._err){
      function svgCorrelogram(acfArr,title,color){
        var W=420,H=90,n2=acfArr.length,barW=Math.min(16,(W-40)/n2);
        var ci=1.96/Math.sqrt(Math.max(tsN,2));
        var sv='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:'+H+'px">';
        sv+='<line x1="20" y1="'+(H/2)+'" x2="'+W+'" y2="'+(H/2)+'" stroke="'+T.axis+'"/>';
        var ciY1=(H/2)*(1-ci*1.5),ciY2=(H/2)+(H/2)*ci*1.5;
        sv+='<line x1="20" y1="'+ciY1+'" x2="'+W+'" y2="'+ciY1+'" stroke="'+T.warn+'" stroke-opacity="0.6" stroke-dasharray="3,2"/>';
        sv+='<line x1="20" y1="'+ciY2+'" x2="'+W+'" y2="'+ciY2+'" stroke="'+T.warn+'" stroke-opacity="0.6" stroke-dasharray="3,2"/>';
        acfArr.forEach(function(v,i){
          var x=25+i*(W-30)/Math.max(n2,1);
          var hgt=Math.abs(v)*(H*0.44);
          var sig=Math.abs(v)>ci;
          var y2=v>=0?(H/2)-hgt:(H/2);
          var h2=hgt||1;
          sv+='<rect x="'+(x-barW/2)+'" y="'+y2+'" width="'+barW+'" height="'+h2+'" rx="2" fill="'+(sig?color:T.grid)+'"/>';
          sv+='<text x="'+x+'" y="'+(H-2)+'" font-size="8" fill="'+T.muted+'" text-anchor="middle" font-family="var(--font-sans-stack)">'+(i+1)+'</text>';
        });
        sv+='</svg>';
        return '<div class="sec-hd-sub" style="margin-top:10px">'+title+' <span style="float:right;font-size:10px;color:var(--ink-subtle);font-weight:400">95% CI</span></div>'+sv;
      }
      if(tsRes.acf&&tsRes.acf.length>1) html+=svgCorrelogram(tsRes.acf.slice(1),'ACF — differenced series',T.ice);
      if(tsRes.pacf&&tsRes.pacf.length) html+=svgCorrelogram(tsRes.pacf,'PACF — differenced series',T.gold);
      if(tsRes.residACF&&tsRes.residACF.length>1) html+=svgCorrelogram(tsRes.residACF.slice(1),'Residual ACF',T.series[2]||T.primary);
    }

    if(tsMod==='decomp'&&tsRes&&!tsRes._err){
      function svgDecompLine(arr,title,color,sh){
        var vals=arr.filter(isFinite);
        if(!vals.length) return '';
        var vMin2=Math.min.apply(null,vals),vMax2=Math.max.apply(null,vals),vR=vMax2-vMin2||1;
        var W2=420;
        var px2=function(i){return 28+i*(W2-40)/(arr.length-1);};
        var py2=function(v){return sh-16-(v-vMin2)/vR*(sh-22);};
        var ptArr=arr.map(function(v,i){return isFinite(v)?px2(i)+','+py2(v):null;}).filter(Boolean).join(' ');
        var sv='<svg viewBox="0 0 '+W2+' '+sh+'" style="width:100%;height:'+sh+'px">';
        sv+='<polyline points="'+ptArr+'" fill="none" stroke="'+color+'" stroke-width="1.5" stroke-linecap="round"/>';
        sv+='<line x1="28" y1="'+(sh-1)+'" x2="'+W2+'" y2="'+(sh-1)+'" stroke="'+T.axis+'"/>';
        sv+='<text x="2" y="14" font-size="9" fill="'+T.muted+'" font-family="var(--font-sans-stack)">'+SE.f4(vMax2)+'</text>';
        sv+='<text x="2" y="'+(sh-3)+'" font-size="9" fill="'+T.muted+'" font-family="var(--font-sans-stack)">'+SE.f4(vMin2)+'</text>';
        sv+='</svg>';
        return '<div class="sec-hd-sub" style="margin-top:10px">'+title+'</div>'+sv;
      }
      html+=svgDecompLine(tsRes.trend,'Trend',T.ice,80);
      html+=svgDecompLine(tsRes.seasonal,'Seasonal',T.gold,70);
      html+=svgDecompLine(tsRes.remainder,'Remainder (Residual)',T.series[2]||T.primary,70);
    }

    if(tsRes&&tsRes._err){
      html+='<div class="miss-warn" style="margin-top:8px">'+escHtml(tsRes._err)+'</div>';
    }
    if(!tsV||tsVals.length===0){
      html+='<div class="chart-empty">Pilih variabel numerik berurutan waktu untuk melihat preview.</div>';
    }
    html+='</div></div>';
  return html;
}

function renderMetaanalysisForm(){
  let html='';
    if(!aState.metaStudies||!Array.isArray(aState.metaStudies)) aState.metaStudies=[];
    if(!aState.metaModel) aState.metaModel='random';
    if(!aState.metaEffect) aState.metaEffect='d';
    if(!aState.metaNewStudy||typeof aState.metaNewStudy!=='object') aState.metaNewStudy={name:'',yi:'',vi:'',ni:''};

    var metaRes=null;
    if(aState.metaStudies.length>=2){
      try{ metaRes=computeMetaAnalysis(aState.metaStudies,aState.metaModel); }
      catch(e){ metaRes={_err:e.message}; }
    }

    html+='<div class="grid2">';

    html+='<div style="display:flex;flex-direction:column;gap:10px">';
    html+='<div class="card"><div class="sec-hd">Meta-Analysis'+ossGuideBtn('metaanalysis')+'</div>';
    var metaModelLabel=aState.metaModel==='random'?'Random-Effects':'Fixed-Effect';
    html+='<div style="margin-bottom:10px">';
    html+=mkCsel('meta-model',['Random-Effects','Fixed-Effect'],metaModelLabel,'metaSetModel(val)','Model');
    html+='</div>';
    var metaEffectMap={d:"Cohen's d",r:'Correlation r',or:'Odds Ratio',g:"Hedges' g",other:'Other (yi/vi)'};
    var metaEffectLabel=metaEffectMap[aState.metaEffect]||"Cohen's d";
    var metaEffectOpts=["Cohen's d",'Correlation r','Odds Ratio',"Hedges' g",'Other (yi/vi)'];
    html+=mkCsel('meta-effect',metaEffectOpts,metaEffectLabel,'metaSetEffect(val)','Effect Size');
    html+='</div>';

    html+='<div class="card"><div class="sec-hd">Tambah Studi</div>';
    html+='<div style="display:flex;flex-direction:column;gap:6px">';
    html+='<input class="inp" id="ma-name" placeholder="Nama studi (cth: Smith 2020)" value="'+escHtmlAttr(aState.metaNewStudy.name||'')+'" oninput="aState.metaNewStudy.name=this.value" style="font-size:12px"/>';
    html+='<div style="display:flex;gap:6px">';
    var eLab=aState.metaEffect==='d'?"Cohen's d":aState.metaEffect==='r'?'r':aState.metaEffect==='or'?'ln(OR)':aState.metaEffect==='g'?"Hedges' g":'Effect (yi)';
    html+='<input class="inp" id="ma-yi" type="number" step="any" placeholder="'+eLab+'" value="'+(aState.metaNewStudy.yi||'')+'" oninput="aState.metaNewStudy.yi=this.value" style="flex:1;font-size:12px"/>';
    html+='<input class="inp" id="ma-vi" type="number" step="any" placeholder="Variance (vi)" value="'+(aState.metaNewStudy.vi||'')+'" oninput="aState.metaNewStudy.vi=this.value" style="flex:1;font-size:12px"/>';
    html+='<input class="inp" id="ma-ni" type="number" step="1" min="2" placeholder="N" value="'+(aState.metaNewStudy.ni||'')+'" oninput="aState.metaNewStudy.ni=this.value" style="flex:1;font-size:12px"/>';
    html+='</div>';
    html+='<div style="display:flex;gap:6px">';
    html+='<button class="btn btn-ghost btn-sm" onclick="metaAddStudy()" style="flex:1">+ Tambah Studi</button>';
    html+='<button class="btn btn-ghost btn-sm" onclick="metaLoadExample()" style="flex:1">Load Contoh</button>';
    html+='</div></div></div>';

    html+='<div class="card"><div class="sec-hd">Daftar Studi ('+aState.metaStudies.length+')</div>';
    if(!aState.metaStudies.length){
      html+='<div class="chart-empty" style="padding:18px 0">Belum ada studi. Tambah minimal 2 studi untuk analisis.</div>';
    } else {
      html+='<div class="tbl-wrap"><table><thead><tr><th>Studi</th><th style="text-align:right">yi</th><th style="text-align:right">vi</th><th style="text-align:right">N</th><th></th></tr></thead><tbody>';
      aState.metaStudies.forEach(function(s,i){
        html+='<tr><td class="td-label" style="max-width:120px;overflow:hidden;text-overflow:ellipsis">'+escHtml(s.name)+'</td>';
        html+='<td class="td-num">'+parseFloat(s.yi).toFixed(3)+'</td>';
        html+='<td class="td-num">'+parseFloat(s.vi).toFixed(4)+'</td>';
        html+='<td class="td-num">'+(s.ni||'—')+'</td>';
        html+='<td style="text-align:right"><button class="btn btn-red btn-sm" onclick="metaRemoveStudy('+i+')" aria-label="Remove study" style="padding:2px 8px">✕</button></td>';
        html+='</tr>';
      });
      html+='</tbody></table></div>';
      html+='<div style="display:flex;gap:6px;margin-top:8px">';
      html+='<button class="btn btn-primary btn-sm" onclick="runMetaAnalysis()" style="flex:1">▶ Run</button>';
      html+='<button class="btn btn-red btn-sm" onclick="aState.metaStudies=[];renderASub()">Clear All</button>';
      html+='</div>';
    }
    html+='</div></div>';

    html+='<div class="card"><div class="sec-hd">Preview</div>';
    if(aState.metaStudies.length<2){
      html+='<div class="chart-empty" style="padding:40px 0">Tambah minimal 2 studi untuk melihat preview meta-analisis.</div>';
    } else if(metaRes&&metaRes._err){
      html+='<div class="miss-warn">'+escHtml(metaRes._err)+'</div>';
    } else if(metaRes){
      var psig=metaRes.p<0.05;
      html+='<div class="sec-hd-sub" style="margin-top:0">Pooled Effect Size</div>';
      html+='<div class="stats-grid2" style="margin-bottom:10px">';
      html+=stCard('Pooled '+metaRes.effectLabel,metaRes.pooledEffect,'SE = '+metaRes.se);
      html+=stCard('95% CI','['+metaRes.ci_lo+', '+metaRes.ci_hi+']','');
      html+=stCard('z-score',metaRes.z,'p = '+metaRes.p_fmt);
      html+=stCard('p-value',metaRes.p_fmt,psig?'Signifikan ✓':'Tidak sig ✗');
      html+='</div>';
      html+='<div class="sec-hd-sub">Heterogenitas</div>';
      html+='<div class="stats-grid2" style="margin-bottom:12px">';
      html+=stCard('Q statistic',metaRes.Q,'df = '+(aState.metaStudies.length-1)+', p = '+metaRes.Q_p_fmt);
      html+=stCard('I²',metaRes.I2+'%',metaRes.I2label);
      html+=stCard('τ² (tau²)',metaRes.tau2,'Between-study var');
      html+=stCard('τ (tau)',metaRes.tau,'SD between studies');
      html+='</div>';
      html+='<div class="sec-hd-sub">Forest Plot</div>';
      html+=svgMetaForestPlot(aState.metaStudies,metaRes,aState.metaEffect);
      html+='<div class="sec-hd-sub" style="margin-top:12px">Funnel Plot</div>';
      html+=svgFunnelPlot(metaRes);
    }
    html+='</div></div>';
  return html;
}


function renderASub(){
  const el=document.getElementById('a-content');
  if(!el)return;
  const nF=numFields(),aF=allFields();
  let html='';

  if(currentASub==='descriptive'){
    html+=renderDescriptiveForm();
  }

  else if(currentASub==='ttest'){
    html+=renderTtestForm();
  }

  else if(currentASub==='onesamp'){
    html+=renderOnesampForm();
  }

  else if(currentASub==='paired'){
    html+=renderPairedForm();
  }

  else if(currentASub==='rmanova'){
    html+=renderRmanovaForm();
  }

  else if(currentASub==='anova'){
    html+=renderAnovaForm();
  }

  else if(currentASub==='anova2'){
    html+=renderAnova2Form();
  }

  else if(currentASub==='anova3'){
    html+=renderAnova3Form();
  }
  else if(currentASub==='correlation'){
    html+=renderCorrelationForm();
  }

  else if(currentASub==='regression'){
    html+=renderRegressionForm();
  }

  else if(currentASub==='multipleReg'){
    html+=renderMultipleRegForm();
  }

  else if(currentASub==='hierarchicalReg'){
    html+=renderHierarchicalRegForm();
  }

  else if(currentASub==='logistic'){
    html+=renderLogisticForm();
  }

  else if(currentASub==='nonparam'){
    html+=renderNonparamForm();
  }

  else if(currentASub==='reliability'){
    html+=renderReliabilityForm();
  }

  else if(currentASub==='kappa'){
    html+=renderKappaForm();
  }

  else if(currentASub==='crosstab'){
    html+=renderCrosstabForm();
  }

  else if(currentASub==='transform'){
    html+=renderTransformForm();
  }

  else if(currentASub==='recode'){
    html+=renderRecodeForm();
  }

  else if(currentASub==='filter'){
    html+=renderFilterForm();
  }

  // WEIGHT CASES
  else if(currentASub==='weightcases'){
    html+=renderWeightcasesForm();
  }

  else if(currentASub==='impute'){
    html+=renderImputeForm();
  }

  // MULTIPLE IMPUTATION 
  else if(currentASub==='mi'){
    html+=renderMiForm();
  }

  else if(currentASub==='corrmatrix'){
    html+=renderCorrmatrixForm();
  }

  else if(currentASub==='partialcorr'){
    html+=renderPartialcorrForm();
  }

  else if(currentASub==='canonicalcorr'){
    html+=renderCanonicalcorrForm();
  }

  else if(currentASub==='charts'){
    html+=renderChartsForm();
  }

  else if(currentASub==='glm-poisson'||currentASub==='glm-negbin'){
    html+=renderGlmCountForm();
  }

  else if(currentASub==='glm'||currentASub==='glm-multi'||currentASub==='glm-rep'){
    html+=renderGlmForm();
  }

  // HLM – Hierarchical Linear Model
  else if(currentASub==='hlm-2level'||currentASub==='hlm-3level'||currentASub==='hlm-icc'){
    html+=renderHlmForm();
  }

  else if(currentASub==='efa'){
    html+=renderEfaForm();
  }

  else if(currentASub==='cfa'){
    html+=renderCfaForm();
  }

  else if(currentASub==='mediation'){
    html+=renderMediationForm();
  }

  else if(currentASub==='sem'){
    html+=renderSemForm();
  }

  // DISCRIMINANT ANALYSIS (LDA)
  else if(currentASub==='discriminant'){
    html+=renderDiscriminantForm();
  }

  // CLUSTER ANALYSIS (K-Means & Hierarchical)
  else if(currentASub==='cluster'){
    html+=renderClusterForm();
  }

  // MISSING DATA ANALYSIS — Little's MCAR + Pattern Matrix — badan
  else if(currentASub==='missinganalysis'){
    html+=renderMissingDataAnalysis();
  }


  // ROC CURVE
  else if(currentASub==='roc'){
    html+=renderRocForm();
  }

  // SURVIVAL ANALYSIS
  else if(currentASub==='survival'||currentASub==='km'||currentASub==='logrank'||currentASub==='cox'){
    html+=renderSurvivalForm();
  }
  
  // POWER ANALYSYS 
  else if(currentASub==='poweranalysis'||currentASub==='powerplot'||currentASub==='sensitivity'){
    html+=renderPoweranalysisForm();
  }

  // MODERATION ANALYSIS
  else if(currentASub==='moderation'||currentASub==='simpleslopes'||currentASub==='jn'){
    html+=renderModerationForm();
  }

  // BAYESIAN ANALYSIS
  else if(currentASub==='bayesian'){
    html+=renderBayesianForm();
  }

  else if(currentASub==='bayesian_corr'){
    html+=renderBayesianCorrForm();
  }

  else if(currentASub==='bayesian_posterior'){
    html+=renderBayesianPosteriorForm();
  }

  // TIME SERIES (ARIMA + Decomposition)
  else if(currentASub==='timeseries'){
    html+=renderTimeseriesForm();
  }

  // META-ANALYSIS
  else if(currentASub==='metaanalysis'){
    html+=renderMetaanalysisForm();
  }

  el.innerHTML=html;
}

// Meta-Analysis State Helpers 
function metaSetModel(val){
  aState.metaModel=(val==='Random-Effects'?'random':'fixed');
  renderASub();
}
function metaSetEffect(val){
  var m={"Cohen's d":'d','Correlation r':'r','Odds Ratio':'or',"Hedges' g":'g','Other (yi/vi)':'other'};
  aState.metaEffect=m[val]||'d';
  renderASub();
}
function metaAddStudy(){
  var ns=aState.metaNewStudy||{};
  var name=(ns.name||'').trim()||('Study '+(aState.metaStudies.length+1));
  var yi=parseFloat(ns.yi);
  var vi=parseFloat(ns.vi);
  var ni=parseInt(ns.ni)||null;
  if(isNaN(yi)){showToast('Effect size (yi) harus diisi','error');return;}
  if(isNaN(vi)||vi<=0){showToast('Variance (vi) harus > 0','error');return;}
  aState.metaStudies.push({name:name,yi:yi,vi:vi,ni:ni});
  aState.metaNewStudy={name:'',yi:'',vi:'',ni:''};
  renderASub();
  showToast('Studi berhasil ditambahkan');
}

function metaRemoveStudy(i){
  aState.metaStudies.splice(i,1);
  renderASub();
}

function metaLoadExample(){
  // Classic example: Glass (1981) meta-analysis example (synthetic)
  aState.metaStudies=[
    {name:'Borenstein 2010 (A)',yi:0.56,vi:0.042,ni:48},
    {name:'Borenstein 2010 (B)',yi:0.78,vi:0.058,ni:36},
    {name:'Smith & Glass 1981',yi:0.42,vi:0.031,ni:60},
    {name:'Rosenthal 1983',yi:0.65,vi:0.049,ni:52},
    {name:'Hunter & Schmidt',yi:0.35,vi:0.025,ni:80},
    {name:'Lipsey & Wilson',yi:0.71,vi:0.063,ni:32},
    {name:'Hedges 1985',yi:0.48,vi:0.038,ni:55}
  ];
  aState.metaEffect='d';
  renderASub();
  showToast('Data berhasil dimuat');
}

function runMetaAnalysis(){
  runSafe(function(){
    if(!aState.metaStudies||aState.metaStudies.length<2) throw new Error('Minimal 2 studi diperlukan');
    var res=computeMetaAnalysis(aState.metaStudies,aState.metaModel);
    var title='Meta-Analysis ('+aState.metaModel+', k='+aState.metaStudies.length+'): '+res.effectLabel+'='+res.pooledEffect+' ['+res.ci_lo+', '+res.ci_hi+']';
    addOutput({
      type:'metaanalysis',
      title:title,
      res:res,
      studies:JSON.parse(JSON.stringify(aState.metaStudies)),
      model:aState.metaModel,
      effectType:aState.metaEffect
    });
    showToast('Meta-Analysis berhasil');
  },'Meta-Analysis');
}
