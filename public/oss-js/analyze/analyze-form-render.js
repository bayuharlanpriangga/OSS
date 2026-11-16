// ANALYZE — FORM RENDERER
function renderDescriptiveForm(){
  const nF=numFields();
  let html='';
    const s=tryStats(()=>SE.descriptive(data.map(r=>r[aState.dFld])));
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Descriptive Statistics</div>';
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
    html+='<div class="card"><div class="sec-hd">Distribution + Q-Q Plot</div>';
    html+='<div class="chart-stack">'+svgHistogram(data,aState.dFld)+'<div style="font-size:11px;color:var(--ink-muted);margin:2px 0">Normal Q-Q Plot</div>'+svgQQ(data,aState.dFld)+'</div>';
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
    html+='<div class="card"><div class="sec-hd">Independent T-Test</div>';
    html+=mkSelect('tt-v',nF,aState.ttV,'aState.ttV=val;renderASub()','Dependent Variable');
    html+='<div style="margin-top:8px">'+mkSelect('tt-g',aF,aState.ttG,'aState.ttG=val;renderASub()','Grouping Variable')+'</div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runTTest()">▶ Run</button>';
    if(prv&&!prv._err){
      html+='<div class="stats-grid2" style="margin-top:11px">'+stCard('Mean ('+grps[0]+')',prv.meanA,'SD='+prv.sdA+' n='+prv.nA)+stCard('Mean ('+grps[1]+')',prv.meanB,'SD='+prv.sdB+' n='+prv.nB)+stCard('t',prv.t,'df='+prv.df)+stCard("Cohen's d",prv.cohensD,prv.dInterp)+'</div>';
      html+='<div class="row" style="margin-top:8px">'+sigBadge(prv.p)+'</div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Group Distributions</div>'+svgBoxplot(data,aState.ttV,aState.ttG)+'</div></div>';
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
    html+='<div class="sec-hd">One-Sample T-Test</div>';
    html+='<div style="font-size:12px;color:var(--ink-muted);margin-bottom:11px;line-height:1.6">Test whether the mean of a variable differs from a specified reference value (μ₀). Example: <em>"Is the average score different from 70?"</em></div>';
    html+=mkSelect('os-v',nF,aState.osV,'aState.osV=val;renderASub()','Test Variable');
    html+='<div style="margin-top:10px">';
    html+='<label class="lbl">Test Value (μ₀) — reference mean to compare against</label>';
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
    // Right card: distribution visualisation
    html+='<div class="card"><div class="sec-hd">Distribution</div>';
    html+=svgHistogram(data,aState.osV);
    if(prv&&!prv._err&&aState.osV){
      // Reference line annotation
      html+='<div class="notice-box" style="margin-top:8px;font-size:11.5px;color:var(--ink-muted)">';
      html+='<b style="color:var(--ink)">μ₀ = '+SE.f4(aState.osMu0||0)+'</b>';
      html+=' &nbsp;|&nbsp; Sample mean = <b style="color:var(--line)">'+prv.mean+'</b>';
      html+=' &nbsp;|&nbsp; Diff = <b style="color:'+(parseFloat(prv.p_fmt)<.05?'var(--ok)':'var(--warn)')+'">'+prv.meanDiff+'</b>';
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
    html+='<div class="card"><div class="sec-hd">Paired Samples T-Test</div>';
    html+=mkSelect('pa-a',nF,aState.pairedA,'aState.pairedA=val;renderASub()','Variable A (Pre-test)');
    html+='<div style="margin-top:8px">'+mkSelect('pa-b',nF,aState.pairedB,'aState.pairedB=val;renderASub()','Variable B (Post-test)')+'</div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runPaired()">▶ Run</button>';
    if(prv&&!prv._err){
      html+='<div class="stats-grid2" style="margin-top:11px">'+stCard('Mean Diff',prv.meanDiff,prv.ci95)+stCard('SD Diff',prv.sdDiff)+stCard('t',prv.t,'df='+prv.df)+stCard("Cohen's dz",prv.cohensD,prv.dInterp)+'</div>';
      html+='<div class="row" style="margin-top:8px">'+sigBadge(prv.p)+'</div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Scatter A vs B</div>'+svgScatter(data,aState.pairedA,aState.pairedB)+'</div></div>';
  return html;
}

function renderAnovaForm(){
  const nF=numFields(),aF=allFields();
  let html='';
    const gl=[...new Set(data.map(r=>r[aState.avG]))].filter(v=>v!==null);
    const groups=gl.map(g=>({label:String(g),vals:SE.validNums(data.filter(r=>r[aState.avG]===g).map(r=>r[aState.avV]))})).filter(g=>g.vals.length>=2);
    const prv=groups.length>=2?tryStats(()=>SE.onewayANOVA(groups)):null;
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">One-Way ANOVA</div>';
    html+=mkSelect('av-v',nF,aState.avV,'aState.avV=val;renderASub()','Dependent Variable');
    html+='<div style="margin-top:8px">'+mkSelect('av-g',aF,aState.avG,'aState.avG=val;renderASub()','Factor')+'</div>';
    html+='<div style="margin-top:10px">';
    html+='<label class="lbl">Post-hoc Test</label>';
    html+='<div style="display:flex;align-items:center;gap:8px;margin-top:4px">';
    // Toggle switch
    html+='<button type="button" role="switch" aria-checked="'+(aState.avPost?'true':'false')+'" aria-label="Enable post-hoc test" onclick="aState.avPost=!aState.avPost;renderASub()" style="cursor:pointer;width:36px;height:20px;border-radius:var(--r-sm);background:'+(aState.avPost?'var(--gold)':'var(--surface-alt)')+';position:relative;flex-shrink:0;transition:background .15s;border:1px solid '+(aState.avPost?'var(--gold)':'var(--line-soft)')+';padding:0"><span style="position:absolute;top:2px;left:'+(aState.avPost?'18px':'2px')+';width:14px;height:14px;border-radius:1px;background:'+(aState.avPost?'var(--ink)':'var(--ink-muted)')+';transition:left .15s"></span></button>';
    // Picker trigger — only active when toggle is on
    var phLabels={'tukey':'Tukey HSD','bonferroni':'Bonferroni','lsd':'LSD (Fisher)','holm':'Holm-Bonferroni'};
    var phCurrent=phLabels[aState.avPostMethod||'tukey']||'Tukey HSD';
    html+='<div class="csel-wrap" id="cw-av-ph" style="flex:1'+(aState.avPost?'':';opacity:.4;pointer-events:none')+'">'
      +'<div class="csel-trigger" onclick="openCselById(\'av-ph\')">'
      +'<span class="csel-val" id="cv-av-ph">'+phCurrent+'</span>'
      +'<span class="csel-arrow">▾</span>'
      +'</div></div>';
    html+='</div></div>';
    // Register csel for post-hoc picker
    _cR['av-ph']={
      fields:['Tukey HSD','Bonferroni','LSD (Fisher)','Holm-Bonferroni'],
      current:phCurrent,
      label:'Post-hoc Method',
      showBadge:false,
      onChange:'aState.avPostMethod={\'Tukey HSD\':\'tukey\',\'Bonferroni\':\'bonferroni\',\'LSD (Fisher)\':\'lsd\',\'Holm-Bonferroni\':\'holm\'}[val]||\'tukey\';renderASub()'
    };
    if(aState.avPost){
      var phHint={'tukey':'Conservative — controls familywise α (recommended)',
        'bonferroni':'Very conservative — α divided by # comparisons',
        'lsd':'Liberal — no familywise correction (use only if F is significant)',
        'holm':'Step-down Bonferroni — more powerful with strict α control'}[aState.avPostMethod||'tukey'];
      html+='<div style="margin-top:5px;font-size:11px;color:var(--ink-subtle);padding:0 2px">'+phHint+'</div>';
    }
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runANOVA()">▶ Run</button>';
    if(prv&&!prv._err){
      html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;margin-top:11px">'+stCard('F',prv.F)+stCard('p',prv.p_fmt)+stCard('&#x03b7;&#x00b2;',prv.eta2,prv.eta2Interp)+'</div>';
      html+='<div class="row" style="margin-top:8px">'+sigBadge(prv.p)+'</div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Group Distributions</div>'+svgBoxplot(data,aState.avV,aState.avG)+'</div></div>';
  return html;
}

function renderRmanovaForm(){
  const nF=numFields();
  let html='';
    // RM-ANOVA: 3+ repeated measures time points
    var rmVars=aState.rmVars||[];
    if(rmVars.length===0&&nF.length>=3) rmVars=nF.slice(0,Math.min(nF.length,3));
    aState.rmVars=rmVars;
    var rmPrv=null;
    if(rmVars.length>=3){
      rmPrv=tryStats(function(){return SE.repeatedMeasuresAnova(rmVars.map(function(v){return SE.validNums(data.map(function(r){return r[v];}));}),rmVars);});
    }
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Repeated Measures ANOVA</div>';
    html+='<div style="font-size:12px;color:var(--ink-muted);margin-bottom:10px;line-height:1.6">Pilih ≥3 variabel yang mewakili titik waktu berbeda (T1, T2, T3, dst.) dari subjek yang sama.</div>';
    // Dynamic variable slots
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
      html+=stCard('&#x03b7;&#x00b2;p',rmPrv.etaSq,'Effect size');
      html+=stCard('k',rmPrv.k,'Time points');
      html+='</div>';
      html+='<div class="row" style="margin-top:8px">'+sigBadge(rmPrv.p)+'</div>';
    }
    html+='</div>';
    // Profile / trajectory chart
    html+='<div class="card"><div class="sec-hd">Profile Plot (Means)</div>';
    if(rmVars.length>=2&&rmVars.every(function(v){return v&&nF.includes(v);})){
      var T=typeof ossChartTheme==='function'?ossChartTheme():{ice:'#4F7A99',primary:'#D4A72C',muted:'#4A5663',ink:'#0D0D0D',grid:'rgba(79,122,153,0.18)'};
      var rmMeans=rmVars.map(function(v){
        var vals=SE.validNums(data.map(function(r){return r[v];}));
        return vals.length?vals.reduce(function(a,b){return a+b;},0)/vals.length:0;
      });
      var rmMax=Math.max.apply(null,rmMeans);var rmMin=Math.min.apply(null,rmMeans);
      var rmRange=rmMax-rmMin||1;
      var svgW=220,svgH=120,padL=30,padB=20,padT=12,padR=14;
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
      html+='<div class="chart-empty">Pilih ≥2 titik waktu untuk melihat grafik</div>';
    }
    // Descriptives per time point
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
    // Mauchly & Post-hoc note
    if(rmPrv&&!rmPrv._err){
      html+='<div class="assump" style="margin-top:10px"><b style="color:var(--warn)">Catatan Sphericity:</b> Mauchly test tidak diimplementasikan. Jika data melanggar sphericity, pertimbangkan koreksi Greenhouse-Geisser di software seperti SPSS.<br><br>';
      if(parseFloat(rmPrv.p)<0.05){
        html+='<b style="color:var(--ok)">Post-hoc pairwise:</b><br>';
        for(var pi=0;pi<rmVars.length;pi++){
          for(var pj=pi+1;pj<rmVars.length;pj++){
            var phRes=tryStats(function(){return SE.pairedTTest(SE.validNums(data.map(function(r){return r[rmVars[pi]];})),SE.validNums(data.map(function(r){return r[rmVars[pj]];})));});
            if(phRes&&!phRes._err) html+='T'+(pi+1)+' vs T'+(pj+1)+': t='+phRes.t+', p='+phRes.p_fmt+'&nbsp;&nbsp;';
          }
        }
      }
      html+='</div>';
    }
    html+='</div>';
    html+='</div>';
  return html;
}

function renderAnova2Form(){
  let html='';
    // Two-Way ANOVA
    const nF2=numFields(),aF2=allFields();
    if(!aState.av2V&&nF2.length) aState.av2V=nF2[0];
    if(!aState.av2A&&aF2.length) aState.av2A=aF2[aF2.length>1?aF2.length-1:0];
    if(!aState.av2B&&aF2.length>1) aState.av2B=aF2[aF2.length>2?aF2.length-2:0];
    const prv2=aState.av2V&&aState.av2A&&aState.av2B&&aState.av2A!==aState.av2B?
      tryStats(()=>SE.twowayANOVA(data,aState.av2V,aState.av2A,aState.av2B)):null;
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Two-Way ANOVA</div>';
    html+='<div style="font-size:12px;color:var(--ink-muted);margin-bottom:9px;line-height:1.6">Tests main effects of two factors and their interaction (A×B). Requires at least 2 levels per factor.</div>';
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
    html+='<div class="card"><div class="sec-hd">Interaction Plot ('+((aState.av2A)||'A')+'×'+((aState.av2B)||'B')+')</div>';
    if(prv2&&!prv2._err){
      html+=svgInteractionPlot(prv2.cellMeansTable,aState.av2B,aState.av2A,aState.av2V);
    } else {
      html+='<div class="chart-empty">Select variables and Run to see interaction plot</div>';
    }
    html+='</div></div>';
  return html;
}

function renderAnova3Form(){
  let html='';
    // Three-Way ANOVA
    const nF3=numFields(),aF3=allFields();
    if(!aState.av3V&&nF3.length) aState.av3V=nF3[0];
    if(!aState.av3A&&aF3.length) aState.av3A=aF3[aF3.length>1?aF3.length-1:0];
    if(!aState.av3B&&aF3.length>1) aState.av3B=aF3[aF3.length>2?aF3.length-2:0];
    if(!aState.av3C&&aF3.length>2) aState.av3C=aF3[aF3.length>3?aF3.length-3:0];
    const valid3=aState.av3V&&aState.av3A&&aState.av3B&&aState.av3C&&
      aState.av3A!==aState.av3B&&aState.av3A!==aState.av3C&&aState.av3B!==aState.av3C;
    const prv3=valid3?tryStats(()=>SE.threewayANOVA(data,aState.av3V,aState.av3A,aState.av3B,aState.av3C)):null;
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Three-Way ANOVA</div>';
    html+='<div style="font-size:12px;color:var(--ink-muted);margin-bottom:9px;line-height:1.6">Tests 3 main effects + 3 two-way interactions + 1 three-way interaction. Factors A, B, C must be different variables.</div>';
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
    html+='<div class="card"><div class="sec-hd">A×B Interaction Plot</div>';
    if(prv3&&!prv3._err){
      html+=svgInteractionPlot(prv3.cellMeansAB,aState.av3B,aState.av3A,aState.av3V);
      html+='<div style="margin-top:7px;font-size:11px;color:var(--ink-subtle)">Marginal means across Factor C levels (averaged)</div>';
    } else {
      html+='<div class="chart-empty">Select variables and Run to see interaction plot</div>';
    }
    html+='</div></div>';
  return html;
}

function renderCorrelationForm(){
  const nF=numFields();
  let html='';
    const prv=tryStats(()=>{const ax=data.map(r=>r[aState.crX]),ay=data.map(r=>r[aState.crY]);return aState.crType==='spearman'?SE.spearmanR(ax,ay):SE.pearsonR(ax,ay);});
    // Partial correlation preview
    const pcPrv=aState.crType==='partial'&&aState.pcX&&aState.pcY&&aState.pcZ?tryStats(()=>SE.partialCorr(data.map(r=>r[aState.pcX]),data.map(r=>r[aState.pcY]),data.map(r=>r[aState.pcZ]))):null;
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Correlation</div>';
    html+=mkCsel('cr-type',['pearson','spearman','partial'],aState.crType,'aState.crType=val;renderASub()','Type');
    if(aState.crType==='partial'){
      html+='<div style="margin-top:8px">'+mkSelect('pc-x',nF,aState.pcX,'aState.pcX=val;renderASub()','Variable X')+'</div>';
      html+='<div style="margin-top:8px">'+mkSelect('pc-y',nF,aState.pcY,'aState.pcY=val;renderASub()','Variable Y')+'</div>';
      html+='<div style="margin-top:8px">'+mkSelect('pc-z',nF,aState.pcZ,'aState.pcZ=val;renderASub()','Control Variable (Z)')+'</div>';
      html+='<div class="notice-box" style="margin-top:8px;font-size:11px;color:var(--ink-muted)">Partial r removes the linear influence of Z from both X and Y before computing the correlation.</div>';
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
      html+='<div class="card"><div class="sec-hd">Scatter X vs Y</div>'+svgScatter(data,aState.pcX,aState.pcY)+'</div>';
    } else {
      html+='<div class="card"><div class="sec-hd">Scatter Plot</div>'+svgScatter(data,aState.crX,aState.crY)+'</div>';
    }
    html+='</div>';
  return html;
}

function renderRegressionForm(){
  const nF=numFields();
  let html='';
    const prv=tryStats(()=>SE.linearReg(data.map(r=>r[aState.regX]),data.map(r=>r[aState.regY])));
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Simple Regression</div>';
    html+=mkSelect('reg-x',nF,aState.regX,'aState.regX=val;renderASub()','Predictor (X)');
    html+='<div style="margin-top:8px">'+mkSelect('reg-y',nF,aState.regY,'aState.regY=val;renderASub()','Outcome (Y)')+'</div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runReg()">▶ Run</button>';
    if(prv&&!prv._err){
      html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-top:11px">'+stCard('R²',prv.R2,'Variance explained')+stCard('Adj R²',prv.R2adj)+stCard('F',prv.F,'p='+prv.pF_fmt)+stCard('RMSE',prv.RMSE)+'</div>';
      html+='<div class="eq" style="margin-top:9px">Ŷ = '+prv.b0+' + '+prv.b1+'·'+escHtml(aState.regX)+'</div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Scatter + Residuals</div>';
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
    html+='<div class="card"><div class="sec-hd">Multiple Regression</div>';
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
    html+='<div class="card"><div class="sec-hd">Coefficients</div>';
    if(prv&&!prv._err)html+=mkTable(['Variable','B','SE','β','t','p','VIF'],prv.coefs.map((c,i)=>[escHtml(c.name),c.B,c.SE,i===0?'—':c.beta,c.t,c.p_fmt,i===0?'—':prv.vif[i-1]]));
    else html+='<div style="color:var(--ink-muted);font-size:12px;padding:12px">Select ≥1 predictor and run.</div>';
    html+='</div></div>';
  return html;
}

function renderNonparamForm(){
  const nF=numFields(),aF=allFields();
  let html='';
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Nonparametric Tests</div>';
    html+=mkCsel('np-type',['mannwhitney','kruskal','wilcoxon'],aState.npType,'aState.npType=val;renderASub()','Test');
    html+='<div style="margin-top:8px">'+mkSelect('np-v',nF,aState.npV,'aState.npV=val;renderASub()','Variable')+'</div>';
    if(aState.npType!=='wilcoxon')html+='<div style="margin-top:8px">'+mkSelect('np-g',aF,aState.npG,'aState.npG=val;renderASub()','Grouping Variable')+'</div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runNP()">▶ Run</button>';
    html+='<div class="assump" style="margin-top:11px"><b style="color:var(--ink)">When to use:</b><br>Non-normal distribution (SW p≤.05), ordinal data, small n, or many outliers.</div>';
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Distribution Preview</div>'+svgBoxplot(data,aState.npV,aState.npType!=='wilcoxon'?aState.npG:null)+'</div></div>';
  return html;
}

function renderTransformForm(){
  const nF=numFields();
  let html='';
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Transform Variable</div>';
    html+=mkSelect('tr-fld',nF,aState.trFld,'aState.trFld=val;renderASub()','Source Variable');
    html+='<div style="margin-top:8px">'+mkCsel('tr-type',['zscore','minmax','log','log10','sqrt','square','center','rank'],aState.trType,'aState.trType=val;renderASub()','Transformation')+'</div>';
    html+='<div style="margin-top:8px"><label class="lbl">New Variable Name</label><input class="inp" value="'+escHtmlAttr(aState.trNewName)+'" oninput="aState.trNewName=this.value"/></div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runTransform()"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-1px"><polyline points="20 6 9 17 4 12"/></svg> Apply</button>';
    html+='<div class="assump" style="margin-top:11px">Z-score, Min-Max, Log, Sqrt, Square, Center, Rank</div>';
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Compute Variable</div>';
    html+='<div style="margin-bottom:8px"><label class="lbl">New Variable Name</label><input class="inp" value="'+escHtmlAttr(aState.computeName)+'" oninput="aState.computeName=this.value"/></div>';
    html+='<div style="margin-bottom:8px"><label class="lbl">Expression</label><input class="inp" style="font-family:var(--font-mono-stack)" value="'+escHtmlAttr(aState.computeExpr)+'" oninput="aState.computeExpr=this.value" placeholder="e.g. age * 2 + score / 10"/></div>';
    html+='<button class="btn btn-primary btn-sm" onclick="runCompute()"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-1px"><polyline points="20 6 9 17 4 12"/></svg> Apply</button>';
    html+='<div class="assump" style="margin-top:10px">Vars, + − × ÷ ^ %, abs / sqrt / log / exp / round / floor / ceil</div>';
    html+='</div></div>';
  return html;
}

function renderHierarchicalRegForm(){
  const nF=numFields();
  let html='';
    // Init state
    if(!aState.hrY) aState.hrY = nF[0]||'';
    if(!aState.hrBlocks) aState.hrBlocks = [[],[]]; // Block1, Block2 arrays
    if(!aState.hrBlocks[0]) aState.hrBlocks[0]=[];
    if(!aState.hrBlocks[1]) aState.hrBlocks[1]=[];

    // Live preview per block
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

    html += '<div class="sec-hd" style="margin-bottom:6px">Hierarchical Regression <span style="font-size:11px;font-weight:400;color:var(--ink-muted);margin-left:8px">Bertahap per Block (ΔR² &amp; F-change Test)</span></div>';
    html += '<div class="notice-box" style="margin-bottom:12px">Masukkan prediktor secara bertahap. Setiap Block menambah prediktor dan melaporkan <b style="color:var(--ink)">ΔR²</b> (perubahan variance) beserta uji F-change signifikansinya.</div>';
    html += '<div class="grid2">';

    // LEFT: setup column
    html += '<div>';

    // DV selector
    html += '<div class="card" style="margin-bottom:8px"><div class="sec-hd" style="margin-bottom:8px">Dependent Variable (Y)</div>';
    html += mkSelect('hr-y', nF, aState.hrY, 'aState.hrY=val;renderASub()', 'Dependent Variable');
    html += '</div>';

    // Block editors
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
      // Live preview summary for this block
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

    // Add block button
    if(aState.hrBlocks.length < 5){
      html += '<button class="btn btn-ghost btn-sm" onclick="aState.hrBlocks.push([]);renderASub()" style="width:100%;justify-content:center;margin-bottom:8px">+ Add Block '+(aState.hrBlocks.length+1)+'</button>';
    }

    // Run button
    html += '<button class="btn btn-primary btn-sm" onclick="runHierarchicalReg()">▶ Run</button>';
    html += '</div>';

    // RIGHT: ΔR² summary column
    html += '<div>';
    html += '<div class="card" style="margin-bottom:10px"><div class="sec-hd">Model Summary &amp; ΔR²</div>';
    if(hrPrvs.some(function(p){return p&&!p._err;})){
      html += '<div class="tbl-wrap"><table><thead><tr>';
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
      html += '<div class="chart-empty">Tambah prediktor ke setiap Block dan klik Run untuk melihat tabel ΔR².</div>';
    }
    html += '</div>';

    // Coefficient card per block
    for(var bi=0;bi<aState.hrBlocks.length;bi++){
      if(!hrPrvs[bi]||hrPrvs[bi]._err) continue;
      var bp = hrPrvs[bi];
      html += '<div class="card" style="margin-bottom:10px"><div class="sec-hd">Block '+(bi+1)+' Coefficients</div>';
      html += mkTable(['Variable','B','SE','β','t','p','VIF'],
        bp.coefs.map(function(c,ci){return[c.name,c.B,c.SE,ci===0?'—':c.beta,c.t,c.p_fmt,ci===0?'—':bp.vif[ci-1]];}));
      html += '</div>';
    }
    html += '</div>'; // end right col
    html += '</div>'; // end grid2
  return html;
}

function renderLogisticForm(){
  const nF=numFields(),aF=allFields();
  let html='';
    var lgType=aState.lgType||'binary';
    var lgY=aState.lgY||'';
    var lgXs=aState.lgXs||[];
    // Determine DV categories for preview
    var lgCats=lgY?[...new Set(data.map(function(r){return r[lgY];}).filter(function(v){return v!==null&&v!==undefined;}))].sort():[];
    var lgPrv=(lgY&&lgXs.length&&lgCats.length>=2)?tryStats(function(){return SE.logisticReg(lgY,lgXs,data,lgType);}):null;
    html+='<div class="grid2">';
    // Setup Card
    html+='<div class="card"><div class="sec-hd">Logistic Regression</div>';
    // Type toggle
    html+=mkCsel('lg-type',['binary','multinomial'],lgType,'aState.lgType=val;renderASub()','Tipe Model');
    html+='<div style="margin-bottom:10px"></div>';
    // DV selector — all fields (kategorikal)
    html+=mkSelect('lg-y',aF,lgY,'aState.lgY=val;renderASub()','Dependent Variable (DV Kategorikal)');
    // Category preview
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
    // Predictors
    html+='<label class="lbl" style="margin-top:10px;margin-bottom:5px">Predictors (X — Numerik):</label>';
    html+='<div style="display:flex;flex-direction:column;gap:3px;max-height:160px;overflow-y:auto;margin-bottom:10px">';
    nF.filter(function(f){return f!==lgY;}).forEach(function(f){
      var sel=lgXs.includes(f);
      html+='<label style="display:flex;align-items:center;gap:7px;font-size:12px;color:'+(sel?'var(--ink)':'var(--ink-muted)')+';font-weight:'+(sel?600:400)+';cursor:pointer;padding:4px 8px;border-radius:var(--r-sm);background:'+(sel?'var(--gold-tint)':'transparent')+'"><input type="checkbox" data-lgf="'+escHtmlAttr(f)+'" '+(sel?'checked':'')+' onchange="toggleLgX(this)" style="accent-color:var(--gold)"/>'+escHtml(f)+'</label>';
    });
    html+='</div>';
    html+='<button class="btn btn-primary btn-sm" onclick="runLogistic()">▶ Run</button>';
    // Quick preview stats
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
    // Results Card
    html+='<div class="card"><div class="sec-hd">Coefficients &amp; Odds Ratios</div>';
    if(lgPrv&&!lgPrv._err){
      if(lgType==='binary'){
        html+='<div class="tbl-wrap">'+mkTable(
          ['Variable','B','SE','Wald','df','p','OR','95% CI OR'],
          lgPrv.coefs.map(function(c){
            return [c.name, c.B, c.SE, c.wald, '1', c.p_fmt, c.OR, c.ci_or];
          })
        )+'</div>';
        // Confusion matrix
        html+='<div class="sec-hd" style="margin-top:13px">Confusion Matrix (Predicted vs Actual)</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th></th><th style="text-align:right">Pred. "'+escHtml(String(lgPrv.cats[0]))+'"</th><th style="text-align:right">Pred. "'+escHtml(String(lgPrv.cats[1]))+'"</th><th style="text-align:right">Correct</th></tr></thead><tbody>';
        html+='<tr><td class="td-label">Act. "'+escHtml(String(lgPrv.cats[0]))+'"</td><td class="td-num">'+lgPrv.cm[0][0]+'</td><td class="td-num">'+lgPrv.cm[0][1]+'</td><td class="td-num">'+SE.f1(lgPrv.cm[0][0]/(lgPrv.cm[0][0]+lgPrv.cm[0][1]+0.001)*100)+'%</td></tr>';
        html+='<tr><td class="td-label">Act. "'+escHtml(String(lgPrv.cats[1]))+'"</td><td class="td-num">'+lgPrv.cm[1][0]+'</td><td class="td-num">'+lgPrv.cm[1][1]+'</td><td class="td-num">'+SE.f1(lgPrv.cm[1][1]/(lgPrv.cm[1][0]+lgPrv.cm[1][1]+0.001)*100)+'%</td></tr>';
        html+='<tr><td class="td-label" style="color:var(--gold-text)">Total</td><td></td><td></td><td class="td-num" style="color:var(--ok);font-weight:700">'+lgPrv.accuracy+'%</td></tr>';
        html+='</tbody></table></div>';
        // ROC AUC
        html+='<div style="margin-top:8px;font-size:11.5px;color:var(--ink-muted)">AUC = <span style="color:var(--ok);font-weight:700;font-variant-numeric:tabular-nums">'+lgPrv.auc+'</span> &nbsp;'+( parseFloat(lgPrv.auc)>=0.9?'<span class="tag tag-green">Excellent</span>':parseFloat(lgPrv.auc)>=0.8?'<span class="tag tag-blue">Good</span>':parseFloat(lgPrv.auc)>=0.7?'<span class="tag tag-yellow">Fair</span>':'<span class="tag tag-red">Poor</span>')+'</div>';
      } else {
        // Multinomial: one table per category vs reference
        lgPrv.categories.forEach(function(cat,ci){
          if(ci===0) return; // reference
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
      // Assumptions note
      html+='<div class="assump" style="margin-top:11px"><b style="color:var(--ink)">Asumsi Logistic Regression:</b><br>DV harus kategorikal, observasi independen, bebas multikolinearitas ekstrem, dan sampel memadai (≥10 per prediktor per kategori).<br><br><b style="color:var(--gold-text)">Interpretasi OR:</b> OR &gt; 1 = peningkatan odds, OR &lt; 1 = penurunan odds, OR = 1 = tidak ada efek.</div>';
    } else {
      html+='<div class="chart-empty">Pilih DV kategorikal dan minimal 1 prediktor numerik, lalu klik Run.</div>';
    }
    html+='</div></div>';
  return html;
}

function renderReliabilityForm(){
  const nF=numFields();
  let html='';
    const cols=aState.alphaVars.filter(v=>nF.includes(v)).map(v=>SE.validNums(data.map(r=>r[v])));
    const minN=cols.length?Math.min(...cols.map(c=>c.length)):0;
    const aRes=(cols.length>=2&&minN>=2)?tryStats(()=>SE.cronbachAlpha(cols.map(c=>c.slice(0,minN)))):null;
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Cronbach Alpha</div>';
    html+='<label class="lbl" style="margin-bottom:6px">Select items (≥2 numeric):</label>';
    html+='<div style="display:flex;flex-direction:column;gap:4px;max-height:190px;overflow-y:auto;margin-bottom:11px">';
    nF.forEach(f=>{const sel=aState.alphaVars.includes(f);
      html+='<label style="display:flex;align-items:center;gap:7px;font-size:12px;color:'+(sel?'var(--ink)':'var(--ink-muted)')+';font-weight:'+(sel?600:400)+';cursor:pointer;padding:4px 8px;border-radius:var(--r-sm);background:'+(sel?'var(--gold-tint)':'transparent')+'"><input type="checkbox" data-fld="'+escHtmlAttr(f)+'" '+(sel?'checked':'')+' onchange="toggleAlphaVarEl(this)" style="accent-color:var(--gold)"/>'+escHtml(f)+'</label>';
    });
    html+='</div>';
    html+='<button class="btn btn-primary btn-sm" onclick="runAlpha()">▶ Run</button>';
    if(aRes&&!aRes._err){
      html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:6px;margin-top:11px">'+stCard('Cronbach α',aRes.alpha,aRes.interp)+stCard('Items k',aRes.k)+stCard('Cases n',aRes.n)+'</div>';
      html+='<div class="row" style="margin-top:8px"><span class="tag '+(parseFloat(aRes.alpha)>=.7?'tag-green':'tag-red')+'">'+escHtml(aRes.interp)+'</span></div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Interpretation</div>';
    [['≥.90','Excellent','tag-green'],['≥.80','Good','tag-blue'],['≥.70','Acceptable','tag-purple'],['≥.60','Questionable','tag-yellow'],['≥.50','Poor','tag-orange'],['<.50','Unacceptable','tag-red']].forEach(([rng,lbl,cls])=>{
      html+='<div style="display:flex;align-items:center;gap:9px;padding:6px 10px;background:var(--surface-alt);border-radius:var(--r-sm);border:1px solid var(--line-soft);margin-bottom:4px"><span style="font-family:var(--font-mono-stack);font-size:11px;color:var(--ink-muted);width:40px">'+rng+'</span><span class="tag '+cls+'">'+escHtml(lbl)+'</span></div>';
    });
    html+='</div></div>';
  return html;
}

function renderKappaForm(){
  let html='';
    var aF2=allFields(); var nF2=numFields();
    html+='<div class="grid2">';
    // ── Input card ──
    html+='<div class="card"><div class="sec-hd">Cohen\'s Kappa — Inter-Rater Reliability</div>';
    html+='<div class="assump" style="margin-bottom:10px"><b style="color:var(--ink)">What it measures:</b> Agreement between two raters beyond chance. κ = 0 indicates chance agreement; κ = 1 indicates perfect agreement.</div>';
    html+=mkSelect('kap-r1',aF2,aState.kappaR1,'aState.kappaR1=val;renderASub()','Rater 1 / Observer 1');
    html+='<div style="margin-top:8px">'+mkSelect('kap-r2',aF2,aState.kappaR2,'aState.kappaR2=val;renderASub()','Rater 2 / Observer 2')+'</div>';
    html+='<label style="display:flex;align-items:center;gap:8px;margin-top:10px;font-size:12px;color:var(--ink-muted);cursor:pointer"><input type="checkbox" '+(aState.kappaWeighted?'checked':'')+' onchange="aState.kappaWeighted=this.checked;renderASub()" style="accent-color:var(--gold)"/> Weighted Kappa (ordinal data)</label>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runKappa()">▶ Run</button>';
    // Live preview
    if(aState.kappaR1&&aState.kappaR2&&aState.kappaR1!==aState.kappaR2){
      var pairsR1=[],pairsR2=[];
      data.forEach(function(r){
        var v1=r[aState.kappaR1],v2=r[aState.kappaR2];
        if(v1!==null&&v1!==undefined&&String(v1).trim()!==''&&v2!==null&&v2!==undefined&&String(v2).trim()!==''){
          pairsR1.push(String(v1)); pairsR2.push(String(v2));
        }
      });
      if(pairsR1.length>=2){
        var kRes=tryStats(function(){return SE.cohenKappa(pairsR1,pairsR2);});
        if(kRes&&!kRes._err){
          html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:6px;margin-top:11px">';
          html+=stCard("Cohen's κ",kRes.kappa,kRes.interp);
          html+=stCard('Cases n',kRes.n);
          html+='</div>';
          html+='<div class="row" style="margin-top:6px">';
          var kv=parseFloat(kRes.kappa);
          var kCls=kv>=0.8?'tag-green':kv>=0.6?'tag-blue':kv>=0.4?'tag-purple':kv>=0.2?'tag-yellow':'tag-red';
          html+='<span class="tag '+kCls+'">'+escHtml(kRes.interp)+'</span>';
          html+='<span class="tag tag-blue">p'+kRes.pFmt+'</span>';
          html+='<span class="tag tag-purple">95% CI ['+kRes.ci95lo+', '+kRes.ci95hi+']</span>';
          html+='</div>';
          if(aState.kappaWeighted&&kRes.wKappa!==null){
            html+='<div style="margin-top:6px;font-size:11px;color:var(--ink-muted)">Weighted κ = <b style="color:var(--ink)">'+kRes.wKappa+'</b> ('+escHtml(kRes.interpW)+')</div>';
          }
        } else if(kRes&&kRes._err){
          html+='<div class="notice-box notice-err" style="margin-top:8px">'+escHtml(kRes.msg)+'</div>';
        }
      }
    }
    html+='</div>';
    // Interpretation card
    html+='<div class="card"><div class="sec-hd">Interpretation (Landis &amp; Koch 1977)</div>';
    [['< 0','Poor (below chance)','tag-red'],['0.00–0.20','Slight','tag-orange'],['0.21–0.40','Fair','tag-yellow'],['0.41–0.60','Moderate','tag-purple'],['0.61–0.80','Substantial','tag-blue'],['0.81–1.00','Almost Perfect','tag-green']].forEach(function(row){
      html+='<div style="display:flex;align-items:center;gap:9px;padding:6px 10px;background:var(--surface-alt);border-radius:var(--r-sm);border:1px solid var(--line-soft);margin-bottom:4px"><span style="font-family:var(--font-mono-stack);font-size:11px;color:var(--ink-muted);width:80px">'+row[0]+'</span><span class="tag '+row[2]+'">'+row[1]+'</span></div>';
    });
    html+='<div class="assump" style="margin-top:10px"><b style="color:var(--ink)">vs Cronbach α:</b><br>Cronbach α = internal consistency of a scale (same construct, multiple items).<br>Cohen κ = agreement between independent raters/coders (different judges, same items).</div>';
    html+='</div>';
    html+='</div>';
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
    html+='<div class="card" style="margin-bottom:12px"><div class="row">';
    html+=mkSelect('ct-row',aF,aState.ctRow,'aState.ctRow=val;renderASub()','Row');
    html+=mkSelect('ct-col',aF,aState.ctCol,'aState.ctCol=val;renderASub()','Column');
    if(chi&&!chi._err)html+='<div class="row" style="gap:5px;align-self:flex-end">'+sigBadge(chi.p)+'<span class="tag tag-purple">χ²='+chi.chi2+'</span><span class="tag tag-blue">V='+chi.V+'</span></div>';
    html+='</div></div>';
    html+='<div class="card"><div class="tbl-wrap"><table><thead><tr><th style="color:var(--ink)">'+escHtml(aState.ctRow)+' \\ '+escHtml(aState.ctCol)+'</th>';
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
    html+='</tbody></table></div></div>';
  return html;
}

function renderRecodeForm(){
  const aF=allFields();
  let html='';
    const rcUniq=[...new Set(data.map(r=>r[aState.recodeFld]).filter(v=>v!==null))].slice(0,20);
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Recode Variable</div>';
    html+=mkSelect('rc-fld',aF,aState.recodeFld,'aState.recodeFld=val;renderASub()','Source Variable');
    html+='<div style="margin-top:8px">'+mkCsel('rc-type',['range','exact','binary'],aState.recodeType,'aState.recodeType=val;renderASub()','Recode Type')+'</div>';
    html+='<div style="margin-top:8px"><label class="lbl">New Variable Name</label><input class="inp" value="'+escHtmlAttr(aState.recodeNewName)+'" oninput="aState.recodeNewName=this.value"/></div>';
    if(aState.recodeType==='binary'){
      html+='<div class="row" style="gap:7px;margin-top:8px;margin-bottom:9px"><div style="flex:1"><label class="lbl">Value → 0</label><input class="inp" id="rc-val0" placeholder="e.g. Male"/></div><div style="flex:1"><label class="lbl">Value → 1</label><input class="inp" id="rc-val1" placeholder="e.g. Female"/></div></div>';
      html+='<button class="btn btn-primary btn-sm" onclick="runRecodeBinary()"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-1px"><polyline points="20 6 9 17 4 12"/></svg> Apply</button>';
    } else if(aState.recodeType==='exact'){
      html+='<div style="max-height:180px;overflow-y:auto;margin:9px 0">';
      html+='<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:4px;font-size:10px;color:var(--ink-muted);margin-bottom:3px"><span>Original</span><span></span><span>New Value</span></div>';
      rcUniq.forEach((v,i)=>html+='<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:4px;align-items:center;margin-bottom:4px"><div style="padding:5px 8px;background:var(--surface-alt);border:1px solid var(--line-soft);border-radius:var(--r-sm);font-size:11.5px;color:var(--ink)">'+escHtml(String(v))+'</div><span style="color:var(--ink-subtle)">→</span><input class="inp" style="padding:5px 8px;font-size:11.5px" id="rc-exact-'+i+'" placeholder="new"/></div>');
      html+='</div><button class="btn btn-primary btn-sm" onclick="runRecodeExact('+JSON.stringify(rcUniq)+')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-1px"><polyline points="20 6 9 17 4 12"/></svg> Apply</button>';
    } else {
      html+='<div style="margin:9px 0">';
      for(let i=0;i<3;i++)html+='<div style="display:grid;grid-template-columns:1fr auto 1fr auto 1fr;gap:4px;align-items:center;margin-bottom:5px"><input class="inp" id="rc-from-'+i+'" placeholder="From" style="font-size:11px;padding:5px 8px"/><span style="color:var(--ink-subtle)">–</span><input class="inp" id="rc-to-'+i+'" placeholder="To" style="font-size:11px;padding:5px 8px"/><span style="color:var(--ink-subtle)">→</span><input class="inp" id="rc-new-'+i+'" placeholder="Label" style="font-size:11px;padding:5px 8px"/></div>';
      html+='</div><button class="btn btn-primary btn-sm" onclick="runRecodeRange(3)"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-1px"><polyline points="20 6 9 17 4 12"/></svg> Apply</button>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Preview</div>';
    const rcV=SE.validNums(data.map(r=>r[aState.recodeFld]));
    if(rcV.length)html+='<div class="stats-grid2">'+stCard('Min',Math.min(...rcV).toFixed(2))+stCard('Max',Math.max(...rcV).toFixed(2))+stCard('Mean',SE.mean(rcV).toFixed(2))+stCard('N Valid',rcV.length)+'</div>';
    html+='<div style="margin-top:9px;font-size:11px;color:var(--ink-muted)">'+rcUniq.length+' unique values</div>';
    html+='</div></div>';
  return html;
}

function renderFilterForm(){
  let html='';
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Filter Cases</div>';
    html+='<div style="margin-bottom:9px"><label class="lbl">Filter Expression</label><input class="inp" style="font-family:var(--font-mono-stack)" value="'+escHtmlAttr(aState.filterExpr)+'" oninput="aState.filterExpr=this.value" placeholder="e.g. age > 25"/></div>';
    html+='<div class="assump" style="margin-bottom:11px"><b style="color:var(--ink)">Syntax:</b><br><code style="color:var(--gold-text)">age > 25</code><br><code style="color:var(--gold-text)">gender == Male</code><br><code style="color:var(--gold-text)">score >= 70 && age < 35</code></div>';
    html+='<div class="row" style="gap:8px"><button class="btn btn-primary btn-sm" onclick="applyFilter()">▶ Run</button>';
    if(aState.filterActive)html+='<button class="btn btn-red btn-sm" onclick="clearFilter()">✕ Clear</button>';
    html+='</div>';
    if(aState.filterActive)html+='<div class="notice-box notice-warn" style="margin-top:9px">Active: '+escHtml(aState.filterExpr)+' ('+data.length+' rows)</div>';
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Quick Filters</div>';
    html+='<div style="display:flex;flex-direction:column;gap:6px">';
    [['Complete cases only','completeCases()'],['Remove outliers (IQR)','removeOutlierFilter()']].forEach(([l,fn])=>
      html+='<button class="btn btn-ghost btn-sm" style="text-align:left;justify-content:flex-start" onclick="'+fn+'">'+l+'</button>');
    html+='</div>';
    html+='<div style="margin-top:12px;font-size:11.5px;color:var(--ink-muted)">Total rows: '+data.length+'<br>With any missing: '+data.filter(r=>vars.some(v=>isMiss(r[v.name]))).length+'</div>';
    html+='</div></div>';
  return html;
}

function renderWeightcasesForm(){
  const nF=numFields();
  let html='';
    var wcNF=nF.filter(function(f){return f!=='';}); // all numeric fields
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

    // Left: Setup
    html+='<div class="card">';
    html+='<div class="sec-hd">Weight Cases</div>';
    html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-bottom:13px;line-height:1.65">Pembobotan frekuensi virtual: data asli tetap ringkas, tapi semua kalkulasi statistik memperlakukan setiap baris seolah direplikasi sebanyak nilai variabel bobot. Berguna untuk data agregat (frequency table, crosstab) dan survei berbobot.</div>';

    // Active status banner
    if(aState.wcActive){
      html+='<div class="notice-box notice-warn" style="margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:9px">';
      html+='<div style="flex:1"><div style="font-size:12px;font-weight:700;color:var(--warn)">Weight Cases AKTIF</div>';
      html+='<div style="font-size:11px;color:var(--ink-muted);margin-top:2px">Variabel bobot: <b style="color:var(--gold-text)">'+escHtml(aState.wcVar)+'</b>, N efektif (ΣW): <b style="color:var(--ok)">'+getNEff()+'</b>, Baris asli: '+data.length+'</div></div>';
      html+='<button class="btn btn-red btn-sm" onclick="clearWeightCases()">✕ Off</button>';
      html+='</div>';
    }

    // Variable selector
    html+='<div style="margin-bottom:10px">';
    html+=mkSelect('wc-var',wcNF,aState.wcVar,'aState.wcVar=val;renderASub()','Variabel Bobot (Frequency Weight)');
    html+='</div>';

    // Method explanation
    html+='<div class="assump" style="margin-bottom:12px">';
    html+='<b style="color:var(--ink)">Cara kerja:</b><br>';
    html+='Setiap baris dengan bobot <b style="color:var(--gold-text)">w</b> diperlakukan seperti <b style="color:var(--gold-text)">w</b> baris identik. ';
    html+='Baris dengan bobot ≤ 0 atau missing dikecualikan. ';
    html+='Nilai bobot desimal dibulatkan ke integer terdekat.<br><br>';
    html+='<b style="color:var(--ink)">Contoh:</b> Baris dengan <code style="color:var(--gold-text)">frekuensi=5</code> → diexpand jadi 5 baris untuk analisis berbobot.';
    html+='</div>';

    // Buttons
    html+='<div class="row" style="gap:7px">';
    html+='<button class="btn btn-primary btn-sm" onclick="runWeightCases()" '+(wcVar?'':'disabled')+'>▶ Run</button>';
    if(aState.wcActive)html+='<button class="btn btn-ghost btn-sm" onclick="clearWeightCases()">✕ Turn Off</button>';
    html+='</div>';
    html+='</div>';

    // Right: Preview
    html+='<div class="card"><div class="sec-hd">Preview &amp; Diagnostics</div>';
    if(wcPreview){
      html+='<div class="stats-grid2" style="margin-bottom:12px">';
      html+=stCard('N Baris (raw)',data.length,'sebelum weighting');
      html+=stCard('N Efektif (∑w)',wcPreview.expandedN,'setelah weighting');
      html+=stCard('Min Weight',wcPreview.min,'');
      html+=stCard('Max Weight',wcPreview.max,'');
      html+='</div>';

      // Warning cards
      if(wcPreview.nZero>0){
        html+='<div class="notice-box notice-warn" style="margin-bottom:7px"><span>⚠</span> <span>'+wcPreview.nZero+' baris dengan bobot = 0 (akan dikecualikan dari analisis)</span></div>';
      }
      if(wcPreview.nNeg>0){
        html+='<div class="notice-box notice-err" style="margin-bottom:7px">✗ '+wcPreview.nNeg+' baris memiliki bobot negatif — akan dikecualikan</div>';
      }
      if(wcPreview.nMiss>0){
        html+='<div class="notice-box notice-warn" style="margin-bottom:7px"><span>⚠</span> <span>'+wcPreview.nMiss+' baris bobot missing</span></div>';
      }
      if(!wcPreview.isInteger){
        html+='<div class="notice-box notice-warn" style="margin-bottom:7px"><span>ℹ</span> <span>Bobot desimal terdeteksi — akan dibulatkan ke integer (round). Pertimbangkan untuk menggunakan Integer weights.</span></div>';
      }
      if(wcPreview.nValid===0){
        html+='<div class="notice-box notice-err" style="margin-top:8px">✗ Tidak ada baris dengan bobot valid (&gt; 0)</div>';
      } else {
        html+='<div style="margin-top:10px">';
        html+='<div style="font-size:11px;font-weight:700;color:var(--ink);margin-bottom:8px">Distribusi Bobot</div>';
        // Mini histogram of weight values (top 10 unique values)
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
        if(wEntries.length===10) html+='<div style="font-size:10px;color:var(--ink-subtle);margin-top:3px">Menampilkan 10 nilai teratas</div>';
        html+='</div>';

        html+='<div class="notice-box" style="margin-top:12px">';
        html+='<div style="font-size:10.5px;font-weight:700;color:var(--ink);text-transform:uppercase;letter-spacing:.7px;margin-bottom:4px">Ringkasan</div>';
        html+='<div style="font-size:11.5px;color:var(--ink-muted);line-height:1.7">';
        html+='<b style="color:var(--ink)">'+wcPreview.nValid+'</b> baris valid, Bobot ∑ = <b style="color:var(--gold-text)">'+wcPreview.sum+'</b>, ';
        html+='Setelah weighting: <b style="color:var(--ok)">N efektif = '+wcPreview.expandedN+'</b>';
        html+='</div>';
        html+='</div>';
      }
    } else {
      html+='<div class="chart-empty">Pilih variabel bobot untuk melihat preview</div>';
      html+='<div class="notice-box" style="margin-top:14px">';
      html+='<div style="font-size:11px;font-weight:700;color:var(--ink);margin-bottom:6px">Kapan Weight Cases digunakan?</div>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);line-height:1.75">';
      html+='• Data sudah dalam bentuk <b style="color:var(--ink)">frekuensi/tabel</b> (bukan raw data)<br>';
      html+='• Hasil <b style="color:var(--ink)">crosstab</b> yang ingin dianalisis lebih lanjut<br>';
      html+='• <b style="color:var(--ink)">Survei berbobot</b> dengan sampling weight<br>';
      html+='• Replikasi data berdasarkan frekuensi kategori';
      html+='</div></div>';
    }
    html+='</div>';

    html+='</div>'; // close grid2
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
    html+='<div class="card"><div class="sec-hd">Missing Imputation</div>';
    html+=mkSelect('imp-fld',nF,aState.imputeFld,'aState.imputeFld=val;renderASub()','Variable');
    html+='<div style="margin-top:8px">'+mkCsel('imp-meth',['mean','median','mode','zero','min','max'],aState.imputeMethod,'aState.imputeMethod=val;renderASub()','Method')+'</div>';
    html+='<div class="stats-grid2" style="margin-top:11px">'+stCard('Missing Count',impM,((impM/data.length)*100).toFixed(1)+'%')+stCard('Impute Value',impVal,'replaces '+impM+' cells')+'</div>';
    html+='<div style="display:flex;gap:7px;margin-top:11px"><button class="btn btn-primary btn-sm" onclick="runImpute()" '+(impM===0?'disabled':'')+'><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-1px"><polyline points="20 6 9 17 4 12"/></svg> Apply</button><button class="btn btn-ghost btn-sm" onclick="imputeAllVars()">Impute All</button></div>';
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Missing Overview</div>';
    vars.filter(v=>v.type==='Numeric').forEach(v=>{const mc=data.filter(r=>isMiss(r[v.name])).length,pct=(mc/data.length)*100;
      var barCol = pct>20?'var(--err)':pct>5?'var(--warn)':'var(--ok)';
      html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="width:72px;font-size:11px;color:var(--ink-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+escHtml(v.name)+'</span><div style="flex:1;height:7px;background:var(--surface-alt);border-radius:3px"><div style="width:'+pct+'%;height:100%;background:'+barCol+';border-radius:3px"></div></div><span style="font-size:10.5px;color:'+(mc>0?'var(--err)':'var(--ok)')+';width:26px;text-align:right;font-variant-numeric:tabular-nums">'+mc+'</span></div>';
    });
    html+='</div></div>';
  return html;
}

function renderMiForm(){
  const nF=numFields();
  let html='';
    if(!aState.miVars) aState.miVars=[];
    if(!aState.miM) aState.miM=5;
    if(!aState.miMethod) aState.miMethod='pmm';
    // Vars with missing
    var missVars=nF.filter(function(v){return data.some(function(r){return isMiss(r[v]);});});
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Multiple Imputation (MICE)</div>';
    html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-bottom:11px;line-height:1.65">MI membuat M dataset lengkap melalui imputasi iteratif, menganalisis masing-masing, lalu menggabungkan hasil (Rubin\'s Rules) — jauh lebih akurat daripada single imputation untuk riset formal.</div>';

    // Variable selection
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
      html+='<button class="btn btn-ghost btn-sm" style="margin-bottom:10px" onclick="aState.miVars='+JSON.stringify(missVars)+';renderASub()">Auto-select variables with missing</button>';
    }

    // M and method
    html+='<div class="grid2" style="gap:8px;margin-bottom:10px">';
    html+='<div><label class="lbl">M (# imputations)</label>';
    html+=mkOptCsel('mi-m',[{val:5,label:'5 (standard)'},{val:10,label:'10 (thorough)'},{val:20,label:'20 (high accuracy)'},{val:50,label:'50 (publication)'}],aState.miM,'aState.miM=parseInt(_cR["mi-m"]._vals[_cR["mi-m"].fields.indexOf(val)]);renderASub()','');
    html+='</div>';
    html+='<div><label class="lbl">Method</label>';
    html+=mkOptCsel('mi-method',[{val:'pmm',label:'PMM (Predictive Mean Matching)'},{val:'norm',label:'Bayesian Normal Regression'},{val:'mice_cart',label:'CART (non-linear)'}],aState.miMethod,'aState.miMethod=_cR["mi-method"]._vals[_cR["mi-method"].fields.indexOf(val)];renderASub()','');
    html+='</div></div>';

    html+='<button class="btn btn-primary btn-sm" style="margin-top:4px" onclick="runMultipleImputation()">▶ Run</button>';

    // Preview missing pattern
    if(aState.miVars&&aState.miVars.length){
      html+='<div style="margin-top:12px"><div class="sec-hd" style="margin-bottom:6px">Selected Variables — Missing Pattern</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Variable</th><th style="text-align:right">N Missing</th><th style="text-align:right">% Missing</th><th>Method</th></tr></thead><tbody>';
      (aState.miVars||[]).forEach(function(v){
        var mc=data.filter(function(r){return isMiss(r[v]);}).length;
        var pct=(mc/data.length*100).toFixed(1);
        var mthd={'pmm':'PMM','norm':'Bayesian','mice_cart':'CART'}[aState.miMethod]||'PMM';
        var col=parseFloat(pct)>20?'var(--err)':parseFloat(pct)>5?'var(--warn)':'var(--ok)';
        html+='<tr><td class="td-label">'+escHtml(v)+'</td><td class="td-num" style="color:'+col+'">'+mc+'</td><td class="td-num" style="color:'+col+'">'+pct+'%</td><td style="font-size:11px;color:var(--gold-text)">'+mthd+'</td></tr>';
      });
      html+='</tbody></table></div></div>';
    }
    html+='</div>';

    // Theory panel
    var miSeries = (typeof ossChartTheme==='function'?ossChartTheme().series:['#4F7A99','#D4A72C','#16A34A','#D97706']);
    html+='<div class="card"><div class="sec-hd">MI — Theory &amp; Guidance</div>';
    html+='<div style="display:flex;flex-direction:column;gap:8px">';
    [{col:miSeries[0],title:'Why MI?',text:'Single imputation (mean/median) underestimates variance and inflates correlations. MI preserves the uncertainty of missing data, producing unbiased estimates.'},{col:miSeries[1],title:'MICE Algorithm',text:'Multiple Imputation by Chained Equations: each variable is imputed by regression on all others, iterated multiple times to achieve convergence.'},{col:miSeries[2],title:"Rubin's Rules",text:'Results from M imputed datasets are combined: β̄ = (1/M)Σβₘ. Variance pools within- and between-imputation variance. Requires M ≥ 5.'},{col:miSeries[3]||'var(--ok)',title:'MAR Assumption',text:'MI is valid under Missing At Random (MAR): missingness may depend on observed data but not on the missing values themselves.'}].forEach(function(tip){
      html+='<div class="notice-box" style="border-top:2px solid '+tip.col+'">';
      html+='<div style="font-size:11.5px;font-weight:700;color:var(--ink);margin-bottom:3px">'+tip.title+'</div>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);line-height:1.55">'+tip.text+'</div>';
      html+='</div>';
    });
    html+='</div></div></div>';
  return html;
}

function renderCorrmatrixForm(){
  const nF=numFields();
  let html='';
    // Filter out any stale fields that no longer exist in current vars
    aState.cmFields=aState.cmFields.filter(function(f){return nF.includes(f);});
    if(!aState.cmFields.length)aState.cmFields=[...nF.slice(0,6)];
    html+='<div class="card" style="margin-bottom:12px"><div class="sec-hd">Correlation Heatmap</div>';
    html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px">';
    nF.forEach(f=>{const sel=aState.cmFields.includes(f);
      html+='<label class="chip-opt'+(sel?' sel':'')+'"><input type="checkbox" data-fld="'+escHtmlAttr(f)+'" '+(sel?'checked':'')+' onchange="toggleCMFieldEl(this)" style="accent-color:var(--gold)"/>'+escHtml(f)+'</label>';
    });
    html+='</div>'+svgCorrMatrix(data,aState.cmFields)+'<div style="margin-top:7px;font-size:11px;color:var(--ink-muted)">Blue = positive, Red = negative, Darker = stronger</div></div>';
    if(aState.cmFields.length>=2){
      const pairs=[];
      for(let i=0;i<aState.cmFields.length;i++)for(let j=i+1;j<aState.cmFields.length;j++){
        try{const r=SE.pearsonR(data.map(d=>d[aState.cmFields[i]]),data.map(d=>d[aState.cmFields[j]]));pairs.push([aState.cmFields[i]+'×'+aState.cmFields[j],r.r,r.p_fmt,r.strength,r.sig?'*':'ns']);}
        catch{pairs.push([aState.cmFields[i]+'×'+aState.cmFields[j],'—','—','—','—']);}
      }
      html+='<div class="card">'+mkTable(['Pair','r','p','Strength','Sig'],pairs)+'</div>';
    }
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
    html+='<div class="card"><div class="sec-hd">Partial Correlation</div>';
    html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-bottom:11px;line-height:1.6">Pearson r antara X dan Y setelah membuang pengaruh linear dari variabel kontrol Z.</div>';
    html+='<label class="lbl">Variable X</label>'+mkSelect('pc-x',nF,aState.pcX,'aState.pcX=val;renderASub()','Variable X');
    html+='<div style="margin-top:8px"><label class="lbl">Variable Y</label>'+mkSelect('pc-y',nF,aState.pcY,'aState.pcY=val;renderASub()','Variable Y')+'</div>';
    html+='<div style="margin-top:8px"><label class="lbl">Control Variable (Z)</label>'+mkSelect('pc-z',nF,aState.pcZ,'aState.pcZ=val;renderASub()','Control Variable Z')+'</div>';
    html+='<div class="notice-box" style="margin-top:8px;line-height:1.6">'
      +'<b style="color:var(--ink)">Partial r</b> = korelasi X–Y setelah residualisasi terhadap Z.<br>'
      +'<b style="color:var(--gold-text)">Zero-order r</b> = korelasi bivariate tanpa kontrol.</div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runPartialCorr()">▶ Run</button>';
    if(pcPrv&&!pcPrv._err){
      html+='<div class="stats-grid2" style="margin-top:11px">'+stCard('Partial r',pcPrv.rp)+stCard('r²',pcPrv.r2,'Variance explained')+stCard('p',pcPrv.p_fmt)+stCard('95% CI',pcPrv.ci95)+'</div>';
      html+='<div class="row" style="margin-top:8px">'+sigBadge(pcPrv.p)+'<span class="tag tag-gray">'+pcPrv.strength+' '+(parseFloat(pcPrv.rp)>=0?'positive':'negative')+'</span></div>';
      html+='<div style="margin-top:7px;font-size:11px;color:var(--ink-muted)">Zero-order: r(X,Y)='+pcPrv.rxy+', r(X,Z)='+pcPrv.rxz+', r(Y,Z)='+pcPrv.ryz+'</div>';
    } else if(pcPrv&&pcPrv._err){
      html+='<div class="notice-box notice-err" style="margin-top:9px">⚠ '+escHtml(pcPrv._err)+'</div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Scatter X vs Y</div>'+svgScatter(data,aState.pcX,aState.pcY)+'</div>';
    html+='</div>';
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
    var ccaSeries = (typeof ossChartTheme==='function'?ossChartTheme().series:['#4F7A99','#D4A72C','#16A34A','#D97706','#DC2626']);
    html+='<div class="grid2">';
    // Left panel: variable selection
    html+='<div class="card"><div class="sec-hd">Canonical Correlation</div>';
    html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-bottom:11px;line-height:1.6">Hubungan antara <b style="color:var(--ink)">set variabel X</b> dan <b style="color:var(--gold-text)">set variabel Y</b> secara simultan. Setara fitur MANOVA correlational di SPSS.</div>';
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
    html+='<div class="notice-box" style="line-height:1.65;margin-bottom:10px">'
      +'<b style="color:var(--ink)">Rc</b> = canonical correlation (max korelasi linear antar dua set)<br>'
      +'<b style="color:var(--ink)">Wilks\' λ</b> = uji signifikansi tiap fungsi kanonik<br>'
      +'<b style="color:var(--ink)">Struktur koefisien</b> = loading tiap variabel ke fungsi kanonik</div>';
    html+='<button class="btn btn-primary btn-sm" onclick="runCCA()" '+(ccaReady?'':'disabled style="opacity:.45"')+'>▶ Run</button>';
    if(ccaPrv&&!ccaPrv._err){
      html+='<div class="stats-grid2" style="margin-top:11px">';
      ccaPrv.tests.slice(0,2).forEach(function(t){
        html+=stCard('Rc'+t.root, t.rc, 'Rc²='+t.rc2+', '+t.p_fmt+(t.sig?' *':''));
      });
      html+='</div>';
    } else if(ccaPrv&&ccaPrv._err){
      html+='<div class="notice-box notice-err" style="margin-top:9px">⚠ '+escHtml(ccaPrv.msg)+'</div>';
    }
    html+='</div>';
    // Right panel: interpretation guide
    html+='<div class="card"><div class="sec-hd">Panduan Interpretasi</div>';
    html+='<div style="display:flex;flex-direction:column;gap:8px;font-size:11.5px">';
    [
      [ccaSeries[0],'Rc (Canonical r)','Korelasi kanonik untuk setiap fungsi. Mirip r bivariate, tapi antara variate X dan variate Y.'],
      [ccaSeries[1],'Rc² (Canonical R²)','Proporsi varians yang dipakai bersama kedua set variate. Mirip R² di regresi.'],
      [ccaSeries[2],"Wilks' Lambda (λ)",'Statistik uji: λ = ∏(1−Rc²). Nilai kecil = asosiasi kuat. Diuji dengan chi-square.'],
      [ccaSeries[3]||'var(--warn)','Struktur Koefisien','Korelasi setiap variabel asli dengan variate kanonik. Seperti factor loadings — nilai ≥ |.30| dianggap bermakna.'],
      [ccaSeries[4]||'var(--ok)','Jumlah Fungsi','Jumlah canonical functions = min(p, q). Hanya fungsi yang signifikan (p < .05) yang diinterpretasi.']
    ].forEach(function(tip){
      html+='<div class="notice-box" style="border-top:2px solid '+tip[0]+'">'
        +'<div style="color:var(--ink);font-weight:700;font-size:11.5px;margin-bottom:2px">'+tip[1]+'</div>'
        +'<div style="color:var(--ink-muted);line-height:1.5">'+tip[2]+'</div></div>';
    });
    html+='</div></div>';
    html+='</div>';
  return html;
}

function renderChartsForm(){
  const nF=numFields(),aF=allFields();
  let html='';
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Chart Settings</div>';
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
    // Live preview
    var cntPreview=null;
    if(aState.cntDep&&aState.cntPreds.length){
      try{
        cntPreview = isNB ? SE.negbinReg(aState.cntDep,aState.cntPreds,data) : SE.poissonReg(aState.cntDep,aState.cntPreds,data);
      }catch(e){cntPreview={_err:e.message};}
    }
    var cntSeries = (typeof ossChartTheme==='function'?ossChartTheme().series:['#4F7A99','#D4A72C','#16A34A','#D97706','#DC2626']);
    html+='<div class="grid2">';
    html+='<div class="card">';
    html+='<div class="sec-hd">'+(isNB?'Negative Binomial':'Poisson')+' Regression</div>';
    html+='<div style="margin-bottom:11px">';
    html+='<label class="lbl">Count / Frequency Variable <span style="color:var(--ink-muted)">(non-negative integers)</span></label>';
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
    // Right panel: quick reference
    html+='<div class="card"><div class="sec-hd">Panduan Model</div>';
    if(!isNB){
      html+='<div class="assump" style="margin-bottom:10px"><b style="color:var(--ink)">Poisson Regression</b> memodelkan data count/frekuensi yang mengikuti distribusi Poisson (mean = variance). Gunakan ketika data berupa hitungan kejadian (jumlah kasus, frekuensi kunjungan, dll.).<br><br>Link function: <span style="color:var(--gold-text);font-family:var(--font-mono-stack)">log(μ) = Xβ</span><br>Koefisien diinterpretasi sebagai <b style="color:var(--ink)">Incidence Rate Ratio (IRR = e^β)</b>.</div>';
      html+='<div style="display:flex;flex-direction:column;gap:5px;font-size:11.5px">';
      [
        ['Deviance','Ukuran kesesuaian model (lebih kecil lebih baik)',cntSeries[0]],
        ['IRR','e^β — perubahan multiplikatif pada rate per 1 unit prediktor',cntSeries[2]],
        ['Dispersion','Pearson X²/df — jika >> 1 → overdispersion, coba NB',cntSeries[1]],
        ["McFadden R²",'Pseudo-R² — analog R² untuk GLM count',cntSeries[3]||'var(--warn)'],
        ['LR χ²','Likelihood Ratio Test: membandingkan model vs null',cntSeries[4]||'var(--line)']
      ].forEach(function(r){
        html+='<div class="notice-box" style="display:flex;gap:8px;padding:6px 10px">';
        html+='<span style="color:var(--ink);font-weight:700;min-width:85px;flex-shrink:0;font-family:var(--font-mono-stack);font-size:11px">'+r[0]+'</span>';
        html+='<span style="color:var(--ink-muted)">'+r[1]+'</span></div>';
      });
      html+='</div>';
    } else {
      html+='<div class="assump" style="margin-bottom:10px"><b style="color:var(--ink)">Negative Binomial Regression</b> adalah ekstensi Poisson yang menangani <b>overdispersion</b> — ketika variance &gt; mean. Parameter dispersi θ (theta) diestimasi dari data.<br><br>Link function: <span style="color:var(--gold-text);font-family:var(--font-mono-stack)">log(μ) = Xβ</span><br>Variance: <span style="color:var(--gold-text);font-family:var(--font-mono-stack)">μ + μ²/θ</span><br>IRR = e^β (interpretasi sama dengan Poisson).</div>';
      html+='<div style="display:flex;flex-direction:column;gap:5px;font-size:11.5px">';
      [
        ['θ (theta)','Parameter dispersi — kecil = overdispersion besar',cntSeries[1]],
        ['IRR','e^β — incidence rate ratio per prediktor',cntSeries[2]],
        ['NB vs Poisson','Jika Poisson dispersion >> 1, NB lebih tepat',cntSeries[3]||'var(--warn)'],
        ["McFadden R²",'Pseudo-R² berdasarkan log-likelihood',cntSeries[0]],
        ['LR χ²','Uji signifikansi keseluruhan model',cntSeries[4]||'var(--line)']
      ].forEach(function(r){
        html+='<div class="notice-box" style="display:flex;gap:8px;padding:6px 10px">';
        html+='<span style="color:var(--ink);font-weight:700;min-width:85px;flex-shrink:0;font-family:var(--font-mono-stack);font-size:11px">'+r[0]+'</span>';
        html+='<span style="color:var(--ink-muted)">'+r[1]+'</span></div>';
      });
      html+='</div>';
    }
    html+='</div></div>';
    // Live preview result
    if(cntPreview&&!cntPreview._err){
      html+='<div class="card" style="margin-top:12px"><div class="sec-hd">Preview Koefisien</div>';
      html+='<div class="stats-grid" style="margin-bottom:11px">';
      html+=stCard('N',cntPreview.n);
      html+=stCard('Log-Lik',cntPreview.logLik);
      html+=stCard('McFadden R²',cntPreview.mcFaddenR2);
      if(isNB) html+=stCard('θ (dispersion)',cntPreview.theta);
      else html+=stCard('Dispersion',cntPreview.dispersion);
      html+='</div>';
      html+=mkTable(['Predictor','β','SE','z','p','IRR','95% CI IRR'],
        cntPreview.coefs.map(function(c){return[escHtml(c.name),c.b,c.se,c.z,c.p,c.irr,c.irrCI];}));
      if(cntPreview.warnings&&cntPreview.warnings.length){
        html+='<div class="notice-box notice-warn" style="margin-top:8px">';
        cntPreview.warnings.forEach(function(w){html+='⚠ '+escHtml(w)+'<br>';});
        html+='</div>';
      }
      html+='</div>';
    } else if(cntPreview&&cntPreview._err){
      html+='<div class="card" style="margin-top:12px"><div class="notice-box notice-err">⚠ '+escHtml(cntPreview._err)+'</div></div>';
    }
  return html;
}

function renderGlmForm(){
  const nF=numFields(),aF=allFields();
  let html='';
    // Sync glmSubType from currentASub
    aState.glmSubType = currentASub==='glm-multi' ? 'multivariate' : currentASub==='glm-rep' ? 'repeated' : 'univariate';
    if(!aState.glmMultiDeps) aState.glmMultiDeps=[];
    if(!aState.glmWithin) aState.glmWithin='';
    if(!aState.glmBetween) aState.glmBetween='';

    // UNIVARIATE
    if(aState.glmSubType==='univariate'){
      var glmRes=null;
      if(aState.glmDep&&aState.glmFactors.length){
        try{glmRes=SE.glmUnivariate(data,aState.glmDep,aState.glmFactors,aState.glmCovs);}catch(e){glmRes={_err:e.message};}
      }
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">Model Setup</div>';
      html+='<div style="margin-bottom:10px">';
      html+='<label class="lbl">Dependent Variable <span style="color:var(--ink-muted)">(numeric)</span></label>';
      html+=mkSelect('glm-dep',nF,aState.glmDep,'aState.glmDep=val;renderASub()','Dependent Variable');
      html+='</div>';
      html+='<div style="margin-bottom:10px">';
      html+='<label class="lbl">Fixed Factor(s) <span style="color:var(--ink-muted)">— categorical grouping variables</span></label>';
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
      html+='<label class="lbl">Covariate(s) <span style="color:var(--ink-muted)">— continuous predictors (optional)</span></label>';
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
      html+='<div class="card"><div class="sec-hd">Quick Reference</div>';
      html+='<div class="assump" style="margin-bottom:9px"><b style="color:var(--ink)">GLM Univariate</b> = ANOVA/ANCOVA framework.<br>Include <b style="color:var(--ink)">factors</b> (categorical) and/or <b style="color:var(--gold-text)">covariates</b> (continuous) to test their effect on the DV.</div>';
      html+='<div style="display:flex;flex-direction:column;gap:5px;font-size:11.5px">';
      [['R²','Proportion of variance explained'],['Partial η²','Effect size per predictor'],['F','Ratio of variance (between/within)'],['p < .05','Significant effect']].forEach(function(r){
        html+='<div class="notice-box" style="display:flex;gap:8px;padding:6px 10px">';
        html+='<span style="color:var(--gold-text);font-weight:700;width:72px;flex-shrink:0;font-family:var(--font-mono-stack)">'+r[0]+'</span>';
        html+='<span style="color:var(--ink-muted)">'+r[1]+'</span></div>';
      });
      html+='</div></div></div>';
      // Results
      if(glmRes&&!glmRes._err){
        html+='<div class="card" style="margin-top:12px"><div class="sec-hd">Tests of Between-Subjects Effects</div>';
        html+='<div class="stats-grid" style="margin-bottom:11px">';
        html+=stCard('N',glmRes.n)+stCard('R²',glmRes.R2)+stCard('Adj R²',glmRes.R2adj)+stCard('Grand Mean',glmRes.grandMean);
        html+='</div>';
        html+='<div class="tbl-wrap"><table><thead><tr>';
        ['Source','df','SS','MS','F','p','η²','Partial η²'].forEach(function(h,hi){
          html+='<th'+(hi>=1?' style="text-align:right"':'')+'>'+h+'</th>';
        });
        html+='</tr></thead><tbody>';
        glmRes.effects.forEach(function(e){
          var psig=e.sig;
          html+='<tr>';
          html+='<td class="td-label" style="font-weight:600;color:var(--ink)">'+escHtml(e.source)+(e.isCov?' <span class="tag tag-blue" style="font-size:9px">cov</span>':'')+'</td>';
          html+='<td class="td-num">'+e.df+'</td>';
          html+='<td class="td-num">'+(e.SS||'—')+'</td>';
          html+='<td class="td-num">'+(e.MS||'—')+'</td>';
          html+='<td class="td-num">'+(e.F||'—')+'</td>';
          html+='<td class="td-num">'+(psig?'<b style="color:var(--ok)">':'')+e.p_fmt+(psig?'</b>':'')+'</td>';
          html+='<td class="td-num">'+(e.eta2||'—')+'</td>';
          html+='<td class="td-num">'+(e.partialEta2||'—')+'</td>';
          html+='</tr>';
        });
        html+='<tr style="border-top:1px solid var(--line)">';
        html+='<td class="td-label" style="color:var(--ink-muted)">Error</td>';
        html+='<td class="td-num">'+glmRes.dfError+'</td>';
        html+='<td class="td-num">'+glmRes.ssError+'</td>';
        html+='<td class="td-num">'+glmRes.msError+'</td>';
        html+='<td></td><td></td><td></td><td></td></tr>';
        html+='</tbody></table></div>';
        glmRes.factors.forEach(function(fac){
          var levels=glmRes.factorLevels[fac];
          if(!levels) return;
          var eff=glmRes.effects.find(function(e){return e.source===fac;});
          if(!eff||!eff.groups) return;
          html+='<div style="margin-top:12px"><div class="sec-hd" style="font-size:11.5px">'+escHtml(fac)+' — Estimated Marginal Means</div>';
          html+='<div class="tbl-wrap"><table><thead><tr><th>'+escHtml(fac)+'</th><th style="text-align:right">N</th><th style="text-align:right">Mean</th><th style="text-align:right">SD</th><th style="text-align:right">95% CI</th></tr></thead><tbody>';
          levels.forEach(function(g){
            var gv=eff.groups[g];
            if(!gv||!gv.length) return;
            var gm=SE.mean(gv),gs=gv.length>=2?SE.std(gv):NaN,gn=gv.length;
            var se=(gn>0&&isFinite(gs))?gs/Math.sqrt(gn):0;
            var ci=isFinite(gs)?'['+SE.f4(gm-1.96*se)+', '+SE.f4(gm+1.96*se)+']':'N/A';
            html+='<tr><td class="td-str">'+escHtml(g)+'</td><td class="td-num">'+gn+'</td>';
            html+='<td class="td-num">'+SE.f4(gm)+'</td><td class="td-num">'+(isFinite(gs)?SE.f4(gs):'N/A')+'</td>';
            html+='<td class="td-num" style="font-size:11px;color:var(--ink-muted)">'+ci+'</td></tr>';
          });
          html+='</tbody></table></div></div>';
        });
        html+='</div>';
      }
    }

    // MULTIVARIATE (MANOVA)
    else if(aState.glmSubType==='multivariate'){
      if(!aState.glmMultiDeps||!aState.glmMultiDeps.length) aState.glmMultiDeps=nF.slice(0,Math.min(2,nF.length));
      var manova=null;
      if(aState.glmMultiDeps.length>=2&&aState.glmFactors.length===1){
        try{ manova=SE.manovaProper(data,aState.glmMultiDeps,aState.glmFactors[0]); }catch(e){ manova={_err:e.message}; }
      }
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">MANOVA Setup</div>';
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
      html+='<div class="card"><div class="sec-hd">About MANOVA</div>';
      html+='<div class="assump"><b style="color:var(--ink)">Proper MANOVA</b> builds H (hypothesis) and E (error) cross-product matrices, then computes eigenvalues of E⁻¹H to derive all four multivariate test statistics.<br><br>';
      html+='<b style="color:var(--ink)">Pillai\'s Trace</b> — most robust (recommended)<br>';
      html+='<b style="color:var(--ink)">Wilks\' Lambda</b> — most powerful when assumptions met<br>';
      html+='<b style="color:var(--ink)">Hotelling-Lawley</b> — sensitive to mean differences<br>';
      html+='<b style="color:var(--ink)">Roy\'s Greatest Root</b> — upper bound (liberal)<br><br>';
      html+='<b style="color:var(--gold-text)">Box\'s M</b> tests homogeneity of covariance matrices.</div>';
      html+='</div></div>';
      // Live preview of multivariate tests
      if(manova&&!manova._err){
        html+='<div class="card" style="margin-top:12px"><div class="sec-hd">Multivariate Test Preview</div>';
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
        html+='<div style="margin-top:8px;font-size:11px;color:var(--ink-muted)">η² (Pillai) = '+manova.pillaiEta2+', Box\'s M p = '+manova.boxP+(manova.boxSig?' <span style="color:var(--warn)">⚠ violation</span>':' <span style="color:var(--ok)">✓ ok</span>')+'</div>';
        html+='</div>';
      } else if(manova&&manova._err){
        html+='<div class="card" style="margin-top:12px"><div class="notice-box notice-err">'+escHtml(manova._err)+'</div></div>';
      } else if(aState.glmMultiDeps.length<2){
        html+='<div class="card" style="margin-top:12px"><div class="chart-empty">Select ≥2 dependent variables and exactly 1 factor to see a live preview.</div></div>';
      } else if(aState.glmFactors.length!==1){
        html+='<div class="card" style="margin-top:12px"><div class="notice-box notice-warn">⚠ Select exactly 1 between-subjects factor for MANOVA.</div></div>';
      }
    }

    // REPEATED MEASURES
    else if(aState.glmSubType==='repeated'){
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">Repeated Measures Setup</div>';
      html+='<div style="margin-bottom:10px">';
      html+='<label class="lbl">Time Point 1 (Pre / Before)</label>';
      html+=mkSelect('rm-pre',nF,aState.pairedA,'aState.pairedA=val;renderASub()','Pre variable');
      html+='</div>';
      html+='<div style="margin-bottom:10px">';
      html+='<label class="lbl">Time Point 2 (Post / After)</label>';
      html+=mkSelect('rm-post',nF,aState.pairedB,'aState.pairedB=val;renderASub()','Post variable');
      html+='</div>';
      html+='<div style="margin-bottom:12px">';
      html+='<label class="lbl">Between-Subjects Factor <span style="color:var(--ink-muted)">(optional grouping)</span></label>';
      html+=mkSelect('rm-grp',['(none)',...aF],aState.glmBetween||'(none)','aState.glmBetween=val==="(none)"?"":val;renderASub()','Group factor');
      html+='</div>';
      html+='<button class="btn btn-primary btn-sm" onclick="runRepeatedMeasures()">▶ Run</button>';
      html+='</div>';
      html+='<div class="card"><div class="sec-hd">About Repeated Measures</div>';
      html+='<div class="assump"><b style="color:var(--ink)">Repeated Measures GLM</b> examines change across time points (within-subjects) while controlling for individual differences.<br><br>This implementation uses <b style="color:var(--gold-text)">Paired T-Test</b> logic with optional between-subjects grouping for comparison.</div>';
      html+='<div class="notice-box notice-warn" style="margin-top:10px">Tip: For 3+ time points, use the ANOVA tab with repeated-measures design.</div>';
      html+='</div></div>';
      // Quick preview of paired result
      if(aState.pairedA&&aState.pairedB&&aState.pairedA!==aState.pairedB){
        var rmRes=tryStats(function(){return SE.pairedTTest(SE.validNums(data.map(function(r){return r[aState.pairedA];})),SE.validNums(data.map(function(r){return r[aState.pairedB];})));});
        if(rmRes&&!rmRes._err){
          html+='<div class="card" style="margin-top:12px"><div class="sec-hd">Within-Subjects Effect</div>';
          html+='<div class="stats-grid" style="margin-bottom:11px">';
          html+=stCard('Mean Diff',rmRes.meanDiff,'SE='+rmRes.se)+stCard('t',rmRes.t,'df='+rmRes.df);
          html+=stCard("Cohen's d",rmRes.cohensD,rmRes.dInterp)+stCard('p-value',rmRes.p_fmt,rmRes.sig?'Significant':'n.s.');
          html+='</div>';
          html+='<div class="row">'+sigBadge(rmRes.p)+'<span class="assump" style="flex:1">'+escHtml(aState.pairedA)+' → '+escHtml(aState.pairedB)+': Mean change = '+rmRes.meanDiff+'</span></div>';
          html+='</div>';
        }
      }
    }
  return html;
}

function renderHlmForm(){
  const nF=numFields(),aF=allFields();
  let html='';

    // State init 
    if(!aState.hlmDep)   aState.hlmDep   = nF[0]||'';
    if(!aState.hlmGroup) aState.hlmGroup = aF[0]||'';
    if(!aState.hlmL1Preds) aState.hlmL1Preds = [];
    if(!aState.hlmL2Preds) aState.hlmL2Preds = [];
    if(!aState.hlmGroup2)  aState.hlmGroup2  = aF[1]||aF[0]||'';
    if(!aState.hlmModelType) aState.hlmModelType = 'intercept'; // intercept | slopes | crosslevel

    // Compute live results
    var hlmRes=aState.hlmDep&&aState.hlmGroup?tryStats(function(){return computeHLMBasics(aState.hlmDep,aState.hlmGroup);}):null;

    // SUB: ICC & Variance Partitioning
    if(currentASub==='hlm-icc'){
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">ICC & Variance Partitioning</div>';
      html+='<div class="assump" style="margin-bottom:12px">The <b style="color:var(--ink)">Intraclass Correlation Coefficient (ICC)</b> tells you how much variance in the outcome lives <i>between</i> groups vs. <i>within</i> groups. ICC &gt; .05 justifies using HLM.</div>';
      html+='<label class="lbl">Outcome Variable <span style="color:var(--ink-muted)">(numeric)</span></label>';
      html+=mkSelect('hlm-dep-icc',nF,aState.hlmDep,'aState.hlmDep=val;renderASub()','Outcome');
      html+='<div style="margin-top:8px"><label class="lbl">Level-2 Grouping Variable <span style="color:var(--ink-muted)">(e.g. class, hospital)</span></label>';
      html+=mkSelect('hlm-grp-icc',aF,aState.hlmGroup,'aState.hlmGroup=val;renderASub()','Grouping')+'</div>';
      html+='<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="runHLM()">▶ Run</button>';
      html+='</div>';
      html+='<div class="card"><div class="sec-hd">Interpretation Guide</div>';
      html+='<div style="display:flex;flex-direction:column;gap:6px;font-size:12px">';
      [['ICC < .05','Negligible clustering; single-level OK','var(--ok)'],
       ['ICC .05–.10','Small but real; HLM recommended','var(--gold-text)'],
       ['ICC .10–.25','Moderate clustering; HLM important','var(--warn)'],
       ['ICC > .25','Strong clustering; HLM essential','var(--err)']
      ].forEach(function(r){
        html+='<div class="notice-box" style="display:flex;gap:8px;padding:7px 10px">';
        html+='<span style="color:'+r[2]+';font-weight:700;min-width:82px;font-family:var(--font-mono-stack);font-size:11.5px">'+r[0]+'</span>';
        html+='<span style="color:var(--ink-muted)">'+r[1]+'</span></div>';
      });
      html+='</div>';
      html+='<div class="notice-box" style="margin-top:10px">Design Effect = 1 + (n̄−1)·ICC — effective N reduction due to clustering.</div>';
      html+='</div></div>';
      if(hlmRes&&!hlmRes._err){
        var iccVal=parseFloat(hlmRes.ICC);
        var iccCls=iccVal<.05?'notice-ok':iccVal<.25?'notice-warn':'notice-err';
        var iccCol=iccVal<.05?'var(--ok)':iccVal<.10?'var(--gold-text)':iccVal<.25?'var(--warn)':'var(--err)';
        var iccLabel=iccVal<.05?'Negligible – single-level likely OK':iccVal<.10?'Small – HLM recommended':iccVal<.25?'Moderate – HLM important':'Strong – HLM essential';
        html+='<div class="card"><div class="sec-hd">Null Model Results</div>';
        html+='<div class="stats-grid" style="margin-bottom:11px">';
        html+=stCard('ICC',hlmRes.ICC,'Intraclass Correlation')+stCard('Groups (k)',hlmRes.k,'Level-2 units');
        html+=stCard('N obs',hlmRes.n,'Level-1 units')+stCard('Grand Mean',hlmRes.grandMean,'Outcome');
        html+='</div>';
        html+='<div class="notice-box '+iccCls+'" style="margin-bottom:11px">';
        html+='<div style="font-size:13px;font-weight:700;color:'+iccCol+'">ICC = '+hlmRes.ICC+'</div>';
        html+='<div style="font-size:12px;color:var(--ink-muted);margin-top:2px">'+iccLabel+'</div></div>';
        html+='<div class="stats-grid2" style="margin-bottom:11px">';
        html+=stCard('Between-group var',hlmRes.varBetween,'τ₀₀')+stCard('Within-group var',hlmRes.varWithin,'σ²');
        html+=stCard('Design Effect',hlmRes.design_effect,'DEFF')+stCard('F (ANOVA)',hlmRes.F+(hlmRes.sig?' *':' ns'),'One-way test');
        html+='</div>';
        if(hlmRes.grpStats&&hlmRes.grpStats.length){
          html+='<div class="sec-hd-sub">Group-Level Descriptives</div>';
          html+='<div class="tbl-wrap"><table><thead><tr><th>Group</th><th style="text-align:right">n</th><th style="text-align:right">Mean</th><th style="text-align:right">SD</th></tr></thead><tbody>';
          hlmRes.grpStats.slice(0,15).forEach(function(g){
            html+='<tr><td class="td-str">'+escHtml(g.group)+'</td><td class="td-num">'+g.n+'</td><td class="td-num">'+g.mean+'</td><td class="td-num">'+g.sd+'</td></tr>';
          });
          if(hlmRes.grpStats.length>15) html+='<tr><td colspan="4" style="color:var(--ink-subtle);font-size:11.5px;text-align:center">… '+(hlmRes.grpStats.length-15)+' more groups</td></tr>';
          html+='</tbody></table></div>';
        }
        html+='</div>';
      } else if(hlmRes&&hlmRes._err){
        html+='<div class="card"><div class="notice-box notice-err">⚠ '+escHtml(hlmRes._err)+'</div></div>';
      }
    }

    // SUB: Two-Level HLM
    else if(currentASub==='hlm-2level'){
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">Two-Level HLM Setup</div>';
      html+='<div class="assump" style="margin-bottom:11px"><b style="color:var(--ink)">Two-Level HLM</b> — Level 1: individuals (e.g. students), Level 2: groups (e.g. classrooms). Accounts for non-independence within groups.</div>';
      html+='<div style="margin-bottom:9px"><label class="lbl">Outcome <span style="color:var(--ink-muted)">(Level-1 numeric)</span></label>';
      html+=mkSelect('hlm2-dep',nF,aState.hlmDep,'aState.hlmDep=val;renderASub()','Outcome')+'</div>';
      html+='<div style="margin-bottom:9px"><label class="lbl">Level-2 Grouping <span style="color:var(--ink-muted)">(cluster ID)</span></label>';
      html+=mkSelect('hlm2-grp',aF,aState.hlmGroup,'aState.hlmGroup=val;renderASub()','Group')+'</div>';
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
      nF.concat(aF).filter(function(f,i,a){return a.indexOf(f)===i&&f!==aState.hlmDep&&f!==aState.hlmGroup;}).forEach(function(f){
        var sel=aState.hlmL2Preds.includes(f);
        html+='<label class="chip-opt'+(sel?' sel':'')+'">'
          +'<input type="checkbox" '+(sel?'checked':'')
          +' onchange="toggleHlmL2(this.dataset.fld,this.checked)" data-fld="'+escHtmlAttr(f)
          +'" style="accent-color:var(--gold)"/>'+escHtml(f)+'</label>';
      });
      html+='</div></div>';
      html+='<div style="margin-bottom:12px"><label class="lbl">Model Type</label>';
      html+=mkOptCsel('hlm-modeltype',
        [{val:'intercept',label:'Random Intercept'},{val:'slopes',label:'Random Slopes'},{val:'crosslevel',label:'Cross-Level Interaction'}],
        aState.hlmModelType,
        'aState.hlmModelType=_cR["hlm-modeltype"]._vals[_cR["hlm-modeltype"].fields.indexOf(val)];renderASub()',
        '');
      html+='</div>';
      html+='<button class="btn btn-primary btn-sm" onclick="runHLM()">▶ Run</button>';
      html+='</div>';
      html+='<div class="card"><div class="sec-hd">Model Equations</div>';
      html+='<div style="font-size:12px;line-height:1.75;color:var(--ink-muted)">';
      html+='<div class="eq" style="white-space:normal;line-height:1.65;margin-bottom:10px">';
      html+='<div style="color:var(--ink);font-weight:700;margin-bottom:4px">Level 1 (within-group):</div>';
      html+='Y<sub>ij</sub> = β<sub>0j</sub> + β<sub>1j</sub>·X<sub>ij</sub> + r<sub>ij</sub><br>';
      html+='<div style="color:var(--ink);font-weight:700;margin:7px 0 4px">Level 2 (between-group):</div>';
      html+='β<sub>0j</sub> = γ<sub>00</sub> + γ<sub>01</sub>·W<sub>j</sub> + u<sub>0j</sub><br>';
      html+='β<sub>1j</sub> = γ<sub>10</sub> + γ<sub>11</sub>·W<sub>j</sub> + u<sub>1j</sub>';
      html+='</div>';
      html+='<div style="display:flex;flex-direction:column;gap:5px">';
      [['γ₀₀','Grand intercept (fixed)'],['γ₀₁','Level-2 predictor effect on intercept'],['γ₁₀','Level-1 slope (fixed)'],['γ₁₁','Cross-level interaction'],['u₀ⱼ','Random intercept variance (τ₀₀)'],['u₁ⱼ','Random slope variance (τ₁₁)'],['rᵢⱼ','Level-1 residual (σ²)']].forEach(function(r){
        html+='<div class="notice-box" style="display:flex;gap:8px;padding:5px 9px">';
        html+='<span style="color:var(--gold-text);font-family:var(--font-mono-stack);font-weight:700;min-width:36px">'+r[0]+'</span><span>'+r[1]+'</span></div>';
      });
      html+='</div></div></div></div>';
      // ICC preview from null model
      if(hlmRes&&!hlmRes._err){
        var iccV=parseFloat(hlmRes.ICC);
        html+='<div class="card"><div class="sec-hd">Null Model Diagnostics</div>';
        html+='<div class="stats-grid" style="margin-bottom:11px">';
        html+=stCard('ICC',hlmRes.ICC,'Clustering strength')+stCard('Groups',hlmRes.k,'Level-2 units');
        html+=stCard('τ₀₀',hlmRes.varBetween,'Between-group var')+stCard('σ²',hlmRes.varWithin,'Within-group var');
        html+='</div>';
        var iccMsg=iccV<.05?'Minimal clustering. Consider whether HLM is necessary.':iccV<.10?'Small but real clustering. HLM recommended.':'Meaningful clustering. HLM is important here.';
        html+='<div class="assump"><b style="color:var(--ink)">ICC = '+hlmRes.ICC+'</b> — '+iccMsg+'</div>';
        html+='</div>';
      }
    }

    // SUB: Three-Level HLM
    else if(currentASub==='hlm-3level'){
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">Three-Level HLM Setup</div>';
      html+='<div class="assump" style="margin-bottom:11px"><b style="color:var(--ink)">Three-Level HLM</b> — e.g. students (L1) nested in classrooms (L2) nested in schools (L3). Partitions variance across all three levels.</div>';
      html+='<div style="margin-bottom:9px"><label class="lbl">Outcome <span style="color:var(--ink-muted)">(Level-1 numeric)</span></label>';
      html+=mkSelect('hlm3-dep',nF,aState.hlmDep,'aState.hlmDep=val;renderASub()','Outcome')+'</div>';
      html+='<div style="margin-bottom:9px"><label class="lbl">Level-2 Grouping <span style="color:var(--ink-muted)">(e.g. classroom)</span></label>';
      html+=mkSelect('hlm3-grp',aF,aState.hlmGroup,'aState.hlmGroup=val;renderASub()','Level-2 group')+'</div>';
      html+='<div style="margin-bottom:9px"><label class="lbl">Level-3 Grouping <span style="color:var(--ink-muted)">(e.g. school)</span></label>';
      html+=mkSelect('hlm3-grp2',aF,aState.hlmGroup2,'aState.hlmGroup2=val;renderASub()','Level-3 group')+'</div>';
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
      html+='<div class="card"><div class="sec-hd">Variance Decomposition</div>';
      html+='<div class="assump" style="margin-bottom:10px">In a 3-level model, the total variance is split into three components:</div>';
      html+='<div style="display:flex;flex-direction:column;gap:6px;font-size:12px">';
      [['σ² (Level 1)','Residual within-group variance'],
       ['τ₀₀ L2 (Level 2)','Between-group-within-cluster variance'],
       ['τ₀₀ L3 (Level 3)','Between-cluster variance']
      ].forEach(function(r){
        html+='<div class="notice-box" style="display:flex;gap:8px;padding:7px 10px">';
        html+='<span style="color:var(--gold-text);font-weight:700;font-family:var(--font-mono-stack);min-width:112px;font-size:11.5px">'+r[0]+'</span>';
        html+='<span style="color:var(--ink-muted)">'+r[1]+'</span></div>';
      });
      html+='</div>';
      html+='<div class="notice-box notice-warn" style="margin-top:12px">⚠ Three-level models require large samples (≥ 30 level-3 units recommended). Results shown are ICC-based approximations from the two-level groupings.</div>';
      html+='</div></div>';
      // Show L2 and L3 ICC approximations
      var hlmRes3=aState.hlmGroup2&&aState.hlmDep?tryStats(function(){return computeHLMBasics(aState.hlmDep,aState.hlmGroup2);}):null;
      if(hlmRes&&!hlmRes._err&&hlmRes3&&!hlmRes3._err){
        html+='<div class="card"><div class="sec-hd">Variance Partition Estimates</div>';
        html+='<div class="stats-grid" style="margin-bottom:11px">';
        html+=stCard('ICC (L2)',hlmRes.ICC,'Level-2 clustering')+stCard('τ₀₀ L2',hlmRes.varBetween,'Between L2 variance');
        html+=stCard('ICC (L3)',hlmRes3.ICC,'Level-3 clustering')+stCard('τ₀₀ L3',hlmRes3.varBetween,'Between L3 variance');
        html+='</div>';
        html+='<div style="font-size:12px;color:var(--ink-muted)">Within-group σ² ≈ '+hlmRes.varWithin+' (Grand Mean = '+hlmRes.grandMean+')</div>';
        html+='</div>';
      }
    }
  return html;
}

function renderEfaForm(){
  const nF=numFields();
  let html='';
    if(aState.efaVars===null||aState.efaVars===undefined) aState.efaVars=nF.slice(0,Math.min(5,nF.length));
    if(!aState.efaFactors) aState.efaFactors=2;
    if(!aState.efaRotation) aState.efaRotation='varimax';

    // Live preview stats
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
    // Left: settings 
    html+='<div class="card"><div class="sec-hd">Exploratory Factor Analysis</div>';
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
    // Preview KMO + Bartlett
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

    // Right: scree plot + eigenvalues
    html+='<div class="card"><div class="sec-hd">Scree Plot</div>';
    if(efaPreview&&!efaPreview._err){
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
      html+='<div style="margin-top:6px;font-size:11px;color:var(--ink-subtle)">Kaiser criterion: retain factors with Eigenvalue &gt; 1 (highlighted = retained)</div>';
    } else {
      html+='<div class="chart-empty">Select ≥2 variables to see scree plot</div>';
    }
    html+='</div></div>';

    // Factor Loading Matrix
    if(efaPreview&&!efaPreview._err){
      html+='<div class="card"><div class="sec-hd">Factor Loading Matrix <span style="font-size:11.5px;font-family:var(--font-sans-stack);font-weight:400;color:var(--ink-muted);margin-left:8px">('+efaPreview.rotation+' rotation, |loading| ≥ 0.40 highlighted)</span></div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Variable</th>';
      for(var f=0;f<efaPreview.nFactors;f++) html+='<th style="text-align:right">F'+(f+1)+'</th>';
      html+='<th style="text-align:right">Communality h²</th></tr></thead><tbody>';
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
      html+='<div style="margin-top:8px;font-size:11.5px;color:var(--ink-muted)">Strong (≥0.60) shown in green; Moderate (≥0.40) in gold. Total variance explained: '+efaPreview.cumVar[efaPreview.nFactors-1]+'%</div>';
      html+='</div>';
    }
  return html;
}

function renderCfaForm(){
  const nF=numFields();
  var T=ossChartTheme();
  let html='';
    // Initialize CFA state
    if(!aState.cfaVars||!Array.isArray(aState.cfaVars)) aState.cfaVars=nF.slice(0,Math.min(6,nF.length));
    if(!aState.cfaFactors||aState.cfaFactors<1) aState.cfaFactors=1;
    if(!aState.cfaFactorNames||aState.cfaFactorNames.length!==aState.cfaFactors){
      aState.cfaFactorNames=[];
      for(var fi=0;fi<aState.cfaFactors;fi++) aState.cfaFactorNames.push('F'+(fi+1));
    }
    if(!aState.cfaFactorMap||typeof aState.cfaFactorMap!=='object') aState.cfaFactorMap={};
    // Ensure factorMap keys match factorNames
    var newMap={};
    aState.cfaFactorNames.forEach(function(fn){
      newMap[fn]=aState.cfaFactorMap[fn]||[];
    });
    aState.cfaFactorMap=newMap;

    // Try live CFA
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
    // Left: CFA setup 
    html+='<div class="card"><div class="sec-hd">Confirmatory Factor Analysis (CFA)</div>';
    html+='<div style="font-size:12px;color:var(--ink-muted);margin-bottom:12px;line-height:1.6">Tentukan jumlah faktor laten dan assign variabel ke masing-masing faktor. CFA akan menghitung fit indices: CFI, TLI, RMSEA, SRMR.</div>';
    // Number of factors
    html+='<div style="margin-bottom:10px">'+mkCsel('cfa-nfac',['1','2','3','4','5'],String(aState.cfaFactors),'setCfaFactors(parseInt(val))','Jumlah Faktor Laten')+'</div>';

    // Factor name + indicator assignment
    aState.cfaFactorNames.forEach(function(fn, fi){
      var factColor=T.series[fi%T.series.length];
      html+='<div class="notice-box" style="margin-bottom:12px;border-top:2px solid '+factColor+'">';
      html+='<div style="display:flex;align-items:center;gap:7px;margin-bottom:8px">';
      html+='<input class="inp" style="flex:1;font-weight:700;font-size:12.5px;padding:5px 9px" value="'+escHtmlAttr(fn)+'" oninput="renameCfaFactor('+fi+',this.value)" placeholder="Nama Faktor"/>';
      html+='</div>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-bottom:6px">Pilih indikator untuk <b style="color:var(--ink)">'+escHtml(fn)+'</b> (min 2 variabel):</div>';
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

    // Right: Fit indices preview
    html+='<div class="card"><div class="sec-hd">Fit Indices (Live Preview)</div>';
    if(!cfaReady){
      html+='<div class="chart-empty" style="padding:32px 12px">Assign min 2 indikator ke salah satu faktor untuk melihat fit indices.</div>';
    } else if(cfaPreview&&cfaPreview._err){
      html+='<div class="miss-warn">'+escHtml(cfaPreview.msg)+'</div>';
    } else if(cfaPreview){
      var r=cfaPreview;
      var fitStr=(r.overallFit||'').toLowerCase();
      var fitCls=fitStr.indexOf('good')>=0||fitStr.indexOf('excellent')>=0?'notice-ok':fitStr.indexOf('accept')>=0?'notice-warn':'notice-err';
      var fitCol=fitCls==='notice-ok'?'var(--ok)':fitCls==='notice-warn'?'var(--warn)':'var(--err)';
      // Overall fit badge
      html+='<div class="notice-box '+fitCls+'" style="margin-bottom:12px;text-align:center">';
      html+='<div style="font-size:15px;font-weight:700;color:'+fitCol+';font-family:var(--font-serif-stack)">'+r.overallFit+'</div>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-top:2px">N='+r.n+', '+r.p+' observed vars, '+r.nFactors+' latent factor'+(r.nFactors>1?'s':'')+'</div>';
      html+='</div>';

      // Fit index cards
      function fitCard(name, val, interp, good, cutoff, color){
        return '<div class="sb"><div class="sb-label">'+escHtml(name)+'</div>'
          +'<div class="sb-value" style="color:'+color+'">'+val+'</div>'
          +'<div style="font-size:11px;color:'+color+';margin-top:2px">'+interp+'</div>'
          +'<div style="font-size:10.5px;color:var(--ink-subtle);margin-top:1px">'+cutoff+'</div></div>';
      }
      var cficol=r.CFI_raw>=0.95?'var(--ok)':r.CFI_raw>=0.90?'var(--warn)':'var(--err)';
      var tlicol=r.TLI_raw>=0.95?'var(--ok)':r.TLI_raw>=0.90?'var(--warn)':'var(--err)';
      var rmsecol=r.RMSEA_raw<=0.05?'var(--ok)':r.RMSEA_raw<=0.08?'var(--warn)':'var(--err)';
      var srmrcol=r.SRMR_raw<=0.05?'var(--ok)':r.SRMR_raw<=0.08?'var(--warn)':'var(--err)';
      html+='<div class="stats-grid2" style="margin-bottom:10px">';
      html+=fitCard('CFI',r.CFI,r.CFIinterp,true,'≥ 0.95 excellent, ≥ 0.90 OK',cficol);
      html+=fitCard('TLI (NNFI)',r.TLI,r.TLIinterp,true,'≥ 0.95 excellent, ≥ 0.90 OK',tlicol);
      html+=fitCard('RMSEA',r.RMSEA,r.RMSEAinterp,false,'≤ 0.05 excellent, ≤ 0.08 OK',rmsecol);
      html+=fitCard('SRMR',r.SRMR,r.SRMRinterp,false,'≤ 0.05 excellent, ≤ 0.08 OK',srmrcol);
      html+='</div>';
      // RMSEA CI
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-bottom:8px">RMSEA 90% CI: ['+r.RMSEA_lo+', '+r.RMSEA_hi+'], χ²('+r.dfModel+')='+r.chiSq+', p='+r.pChiSq+'</div>';
      // Chi-square note
      html+='<div style="font-size:11px;color:var(--ink-subtle);line-height:1.5">χ² sensitif terhadap N besar. Utamakan CFI ≥ .95, RMSEA ≤ .06, SRMR ≤ .08 untuk menentukan model fit.</div>';
    }
    html+='</div></div>';

    // Factor Loadings Table
    if(cfaPreview&&!cfaPreview._err){
      var r=cfaPreview;
      html+='<div class="card"><div class="sec-hd">Factor Loadings (Standardized)</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Faktor</th><th>Indikator</th><th style="text-align:right">Loading (λ)</th><th style="text-align:right">Communality (h²)</th><th>Keterangan</th></tr></thead><tbody>';
      r.factorNames.forEach(function(fn, fi){
        var factColor=T.series[fi%T.series.length];
        var vars=r.factorMap[fn]||[];
        vars.forEach(function(v, vi){
          var vIdx=r.varNames.indexOf(v);
          var lam=vIdx>=0?r.lambda[vIdx][fi]:null;
          var h2=vIdx>=0?r.communalities[vIdx]:null;
          var lamNum=lam!==null?parseFloat(lam):null;
          var lamCol=lamNum!==null?(Math.abs(lamNum)>=0.7?'var(--ok)':Math.abs(lamNum)>=0.5?'var(--ink)':Math.abs(lamNum)>=0.3?'var(--warn)':'var(--err)'):'var(--ink-muted)';
          var h2num=h2!==null?parseFloat(h2):null;
          var h2col=h2num!==null?(h2num>=0.7?'var(--ok)':h2num>=0.4?'var(--warn)':'var(--err)'):'var(--ink-muted)';
          html+='<tr>';
          if(vi===0) html+='<td class="td-label" rowspan="'+vars.length+'" style="color:'+factColor+';font-weight:700;vertical-align:top;padding-top:10px">'+escHtml(fn)+'</td>';
          html+='<td class="td-label">'+escHtml(v)+'</td>';
          html+='<td class="td-num" style="color:'+lamCol+';font-weight:'+(Math.abs(lamNum||0)>=0.5?700:400)+'">'+(lam!==null?lam:'—')+'</td>';
          html+='<td class="td-num" style="color:'+h2col+'">'+(h2!==null?h2:'—')+'</td>';
          html+='<td><span class="tag '+(lamNum!==null&&Math.abs(lamNum)>=0.5?'tag-green':'tag-red')+'">'+(lamNum!==null&&Math.abs(lamNum)>=0.5?'✓ Adequate':'✗ Weak')+'</span></td>';
          html+='</tr>';
        });
      });
      html+='</tbody></table></div>';
      html+='<div style="margin-top:8px;font-size:11.5px;color:var(--ink-muted)">Loading ≥ 0.70 = strong, ≥ 0.50 = adequate, &lt; 0.30 = weak. Communality ≥ 0.40 disarankan.</div>';
      html+='</div>';

      // Residual matrix
      html+='<div class="card"><div class="sec-hd">Residual Correlation Matrix (R − Σ̂)</div>';
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
      html+='<div style="font-size:11px;color:var(--ink-subtle);margin-top:6px">Residual &gt; 0.10 mengindikasikan misfitting item pairs.</div>';
      html+='</div>';
    }
  return html;
}

function renderMediationForm(){
  const nF=numFields();
  let html='';
    if(!aState.medM) aState.medM=[];
    if(!aState.medBootN) aState.medBootN=5000;

    // Live path preview (Baron-Kenny steps)
    var medPreview=null;
    var canPreview=aState.medX&&aState.medY&&aState.medM.length>=1;
    if(canPreview){
      medPreview=tryStats(function(){return computeMediation(aState.medX,aState.medM,aState.medY,500);});
    }

    html+='<div class="card"><div class="sec-hd">Mediation Analysis <span style="font-size:11.5px;font-family:var(--font-sans-stack);font-weight:400;color:var(--ink-muted);margin-left:7px">Baron-Kenny Steps, Sobel Test, Bootstrap CI</span></div>';
    html+='<div style="font-size:12px;color:var(--ink-muted);margin-bottom:12px;line-height:1.65">Apakah variabel <b style="color:var(--ink)">X</b> berpengaruh terhadap <b style="color:var(--ink)">Y</b> <em>melalui</em> <b style="color:var(--gold-text)">M</b>? Mediation Analysis menghitung efek tidak langsung (indirect effect) menggunakan Sobel test dan Bootstrap confidence interval.</div>';

    // Path Diagram SVG
    html+='<div class="notice-box" style="margin-bottom:14px;padding:12px;text-align:center">';
    html+=svgMediationPath(aState.medX||'X',aState.medM,aState.medY||'Y',medPreview);
    html+='</div>';

    html+='<div class="grid2">';
    // Left column: variable selection
    html+='<div>';
    html+='<div style="margin-bottom:9px"><label class="lbl">Independent Variable (X)</label>'+mkSelect('med-x',nF,aState.medX,'aState.medX=val;renderASub()','Select X')+'</div>';
    html+='<div style="margin-bottom:9px"><label class="lbl">Dependent Variable (Y)</label>'+mkSelect('med-y',nF,aState.medY,'aState.medY=val;renderASub()','Select Y')+'</div>';
    html+='<div style="margin-bottom:9px"><label class="lbl">Mediator(s) (M) <span style="color:var(--ink-subtle)">(dapat lebih dari 1)</span></label>';
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
    html+='<button class="btn btn-primary btn-sm" style="margin-top:4px;margin-bottom:4px" onclick="runMediation()">▶ Run</button>';
    html+='</div>';

    // Right column: live preview
    html+='<div>';
    if(!canPreview){
      html+='<div class="chart-empty">Pilih X, Y, dan minimal 1 Mediator untuk melihat preview Baron-Kenny Steps.</div>';
    } else if(medPreview&&medPreview._err){
      html+='<div class="miss-warn">'+escHtml(medPreview.msg)+'</div>';
    } else if(medPreview){
      html+='<div class="sec-hd-sub" style="margin-top:0">Baron-Kenny Steps (Preview)</div>';
      var bk=medPreview.barronKenny;
      html+='<div style="display:flex;flex-direction:column;gap:6px">';
      var steps=[
        {step:'Step 1',desc:'X → Y (total effect, path c)',val:'c = '+bk.c,p:bk.p_c,note:'X harus signifikan prediktor Y'},
        {step:'Step 2',desc:'X → M (path a)',val:'a = '+bk.a,p:bk.p_a,note:'X harus signifikan prediktor M'},
        {step:'Step 3',desc:'M → Y (path b, controlling X)',val:'b = '+bk.b,p:bk.p_b,note:'M harus signifikan prediktor Y'},
        {step:'Step 4',desc:'X → Y (direct effect, path c\')',val:"c' = "+bk.c_prime,p:bk.p_c_prime,note:parseFloat(bk.p_c_prime)>=0.05?"c' tidak sig → Full mediation":"c' masih sig → Partial mediation"},
      ];
      steps.forEach(function(s){
        var sig=parseFloat(s.p)<0.05;
        html+='<div class="notice-box '+(sig?'notice-ok':'')+'" style="padding:8px 10px">';
        html+='<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">';
        html+='<span style="font-size:11.5px;font-weight:700;color:'+(sig?'var(--ok)':'var(--ink-muted)')+'">'+s.step+'</span>';
        html+='<span class="tag '+(sig?'tag-green':'tag-red')+'">'+(sig?'✓ sig':'✗ n.s.')+' p='+parseFloat(s.p).toFixed(3)+'</span>';
        html+='</div>';
        html+='<div style="font-size:12px;color:var(--ink-muted);margin-top:3px">'+s.desc+' → <b style="color:var(--ink)">'+s.val+'</b></div>';
        html+='<div style="font-size:11px;color:var(--ink-subtle);margin-top:2px">'+s.note+'</div>';
        html+='</div>';
      });
      html+='</div>';

      // Sobel + indirect effect preview
      if(medPreview.mediators&&medPreview.mediators.length){
        html+='<div class="sec-hd-sub">Indirect Effect (Sobel)</div>';
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
    html+='</div>';
    html+='</div>';
    html+='</div>';

    // Interpretation guide
    html+='<div class="card" style="margin-top:12px"><div class="sec-hd">Panduan Interpretasi</div>';
    html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;font-size:12px;color:var(--ink-muted);line-height:1.6">';
    html+='<div class="notice-box"><b style="color:var(--ok)">Full Mediation</b><br>c signifikan, a &amp; b signifikan, tapi c\' tidak signifikan → X hanya berpengaruh ke Y lewat M.</div>';
    html+='<div class="notice-box"><b style="color:var(--warn)">Partial Mediation</b><br>c, a, b, dan c\' semuanya signifikan → X berpengaruh langsung ke Y dan juga lewat M.</div>';
    html+='<div class="notice-box"><b style="color:var(--err)">No Mediation</b><br>a atau b tidak signifikan → M tidak memediasi X→Y.</div>';
    html+='<div class="notice-box"><b style="color:var(--gold-text)">Bootstrap CI</b><br>Jika 95% CI dari indirect effect tidak melewati 0, maka mediasi signifikan (lebih akurat dari Sobel).</div>';
    html+='</div></div>';
  return html;
}

function renderSemForm(){
  const nF=numFields();
  var T=ossChartTheme();
  let html='';
    // SEM State Defaults
    if(!aState.semLatents) aState.semLatents=[];
    if(aState.semLatentMap===undefined||aState.semLatentMap===null) aState.semLatentMap={};
    if(!aState.semPaths) aState.semPaths=[];   // array of {from,to} latent→latent or lat→observed
    if(!aState.semMode) aState.semMode='measurement'; // 'measurement' | 'structural'
    var semColors=T.series;

    // Ensure every latent has an entry
    aState.semLatents.forEach(function(ln){
      if(!aState.semLatentMap[ln]) aState.semLatentMap[ln]=[];
    });

    // Live SEM computation
    var semResult=null;
    var semReady=aState.semLatents.length>=1&&aState.semLatents.every(function(ln){return (aState.semLatentMap[ln]||[]).length>=2;});
    if(semReady){
      semResult=tryStats(function(){return computeSEM(aState.semLatents,aState.semLatentMap,aState.semPaths);});
    }

    html+='<div class="analyze-info-bar"><div class="analyze-info-title">Structural Equation Modeling (SEM)</div><div class="analyze-info-desc">Mengkombinasikan CFA + Path Analysis. Untuk uji konstruk laten, hubungan kausal antar konstruk, dan mediasi kompleks.</div></div>';

    // Mode tabs
    html+='<div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap">';
    [{k:'measurement',l:'1. Measurement Model (CFA)'},{k:'structural',l:'2. Structural Model (Path)'},{k:'results',l:'3. Results & Fit'}].forEach(function(t){
      var act=aState.semMode===t.k;
      html+='<button class="sem-tab'+(act?' active':'')+'" onclick="aState.semMode=\''+t.k+'\';renderASub()">'+t.l+'</button>';
    });
    html+='</div>';

    // MODE: MEASUREMENT
    if(aState.semMode==='measurement'){
      html+='<div class="grid2">';

      // Left: latent variable builder
      html+='<div class="card"><div class="sec-hd">Konstruk Laten (Latent Variables)</div>';
      html+='<div style="font-size:12px;color:var(--ink-muted);margin-bottom:11px;line-height:1.6">Definisikan setiap konstruk laten dan pilih variabel observasinya (indikator/manifest). Setiap konstruk butuh ≥2 indikator.</div>';

      // Add latent button
      html+='<div style="display:flex;gap:6px;margin-bottom:12px">';
      html+='<input class="inp" id="sem-new-latent" placeholder="Nama konstruk (cth: Motivasi, Kinerja...)" style="flex:1"/>';
      html+='<button class="btn btn-primary btn-sm" onclick="semAddLatent()" style="white-space:nowrap">+ Tambah</button>';
      html+='</div>';

      // List of latents
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
        html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-bottom:6px">Indikator/Manifest untuk <b style="color:var(--ink)">'+escHtml(ln)+'</b> (min 2):</div>';
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
      html+='</div>';

      // Right: live measurement model fit
      html+='<div class="card"><div class="sec-hd">Measurement Model Fit</div>';
      if(!semReady){
        html+='<div class="chart-empty" style="padding:32px 12px">Tambah ≥1 konstruk dengan ≥2 indikator untuk melihat fit model pengukuran.</div>';
        html+='<div class="assump" style="margin-top:12px">';
        html+='<div style="font-weight:700;color:var(--ink);margin-bottom:4px">Workflow SEM (AMOS)</div>';
        html+='1. Definisikan konstruk laten + indikator<br>2. Gambar structural paths<br>3. Run dan cek fit: CFI, RMSEA, SRMR<br>4. Modifikasi model jika fit buruk<br>5. Interpretasi path coefficients';
        html+='</div>';
      } else if(semResult&&semResult._err){
        html+='<div class="miss-warn">'+escHtml(semResult.msg)+'</div>';
      } else if(semResult){
        var fitCls=semResult.overallFit==='Good Fit'?'notice-ok':semResult.overallFit==='Acceptable Fit'?'notice-warn':'notice-err';
        var fitCol=fitCls==='notice-ok'?'var(--ok)':fitCls==='notice-warn'?'var(--warn)':'var(--err)';
        html+='<div class="notice-box '+fitCls+'" style="text-align:center;margin-bottom:13px">';
        html+='<div style="font-size:16px;font-weight:700;color:'+fitCol+';font-family:var(--font-serif-stack)">'+semResult.overallFit+'</div>';
        html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-top:2px">N='+semResult.n+', '+semResult.totalIndicators+' indikators, '+semResult.nLatent+' latent factors</div>';
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
        html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-bottom:6px">χ²('+semResult.dfModel+')='+semResult.chiSq+', p='+semResult.pChiSq+', RMSEA CI: ['+semResult.RMSEA_lo+', '+semResult.RMSEA_hi+']</div>';
        // AVE + CR
        html+='<div style="margin-top:11px"><div class="sec-hd-sub">Construct Validity</div>';
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
        html+='<div style="font-size:11px;color:var(--ink-subtle);margin-top:6px">AVE ≥ 0.50 = convergent validity, CR ≥ 0.70 = reliability, AVE &gt; r² antar konstruk = discriminant validity</div>';
        html+='</div>';
      }
      html+='</div></div>';

      // Factor Loadings Table
      if(semResult&&!semResult._err){
        html+='<div class="card"><div class="sec-hd">Standardized Factor Loadings (λ)</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th>Konstruk</th><th>Indikator</th><th style="text-align:right">λ (Loading)</th><th style="text-align:right">h²</th><th style="text-align:right">t-value*</th><th>Status</th></tr></thead><tbody>';
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
        html+='<div style="font-size:11px;color:var(--ink-subtle);margin-top:6px">*Estimasi t-value (reference: t &gt; 1.96 = signifikan p &lt; .05)</div>';
        html+='</div>';
      }
    }

    // MODE: STRUCTURAL 
    else if(aState.semMode==='structural'){
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">Structural Paths (Hubungan Antar Konstruk)</div>';
      html+='<div style="font-size:12px;color:var(--ink-muted);margin-bottom:11px;line-height:1.6">Definisikan path kausal antar konstruk laten. Di AMOS: gambar anak panah dari konstruk eksogen ke endogen.</div>';

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
        html+='<button class="btn btn-primary btn-sm" onclick="semAddPath()" style="margin-bottom:12px">+ Tambah Path</button>';

        // Path list
        if(!aState.semPaths.length){
          html+='<div class="chart-empty" style="padding:16px 12px">Belum ada structural path.<br>Tambah path hubungan antar konstruk.</div>';
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

      // Right: SEM path diagram SVG
      html+='<div class="card"><div class="sec-hd">Path Diagram</div>';
      if(aState.semLatents.length>=1){
        html+=svgSEMDiagram(aState.semLatents,aState.semLatentMap,aState.semPaths,semResult,semColors);
      } else {
        html+='<div class="chart-empty" style="padding:32px 12px">Tambah konstruk di Measurement Model untuk melihat diagram.</div>';
      }
      html+='</div></div>';

      // Run button
      html+='<div class="card" style="text-align:center;padding-top:14px">';
      html+='<button class="btn btn-primary" onclick="runSEM()">▶ Run</button>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-top:7px">Akan menghitung: CFA measurement model + structural paths + fit indices + path coefficients</div>';
      html+='</div>';
    }

    // MODE: RESULTS
    else if(aState.semMode==='results'){
      if(!semReady){
        html+='<div class="card"><div class="chart-empty" style="padding:32px 12px">Lengkapi Measurement Model terlebih dahulu (≥2 konstruk, ≥2 indikator masing-masing).</div></div>';
      } else if(semResult&&semResult._err){
        html+='<div class="card"><div class="miss-warn">'+escHtml(semResult.msg)+'</div></div>';
      } else if(semResult){
        // Overall fit summary
        var fitCol2=semResult.overallFit==='Good Fit'?'var(--ok)':semResult.overallFit==='Acceptable Fit'?'var(--warn)':'var(--err)';
        html+='<div class="card">';
        html+='<div class="sec-hd">Model Fit Summary</div>';
        html+='<div class="stats-grid" style="margin-bottom:13px">';
        html+='<div class="sb"><div class="sb-label">Overall Fit</div><div class="sb-value" style="color:'+fitCol2+'">'+semResult.overallFit+'</div></div>';
        html+='<div class="sb"><div class="sb-label">CFI</div><div class="sb-value" style="color:'+(semResult.CFI_raw>=0.95?'var(--ok)':semResult.CFI_raw>=0.90?'var(--warn)':'var(--err)')+'">'+semResult.CFI+'</div><div class="sb-note">≥ .95 = good</div></div>';
        html+='<div class="sb"><div class="sb-label">RMSEA</div><div class="sb-value" style="color:'+(semResult.RMSEA_raw<=0.05?'var(--ok)':semResult.RMSEA_raw<=0.08?'var(--warn)':'var(--err)')+'">'+semResult.RMSEA+'</div><div class="sb-note">≤ .06 = good</div></div>';
        html+='<div class="sb"><div class="sb-label">SRMR</div><div class="sb-value" style="color:'+(semResult.SRMR_raw<=0.05?'var(--ok)':semResult.SRMR_raw<=0.08?'var(--warn)':'var(--err)')+'">'+semResult.SRMR+'</div><div class="sb-note">≤ .08 = good</div></div>';
        html+='<div class="sb"><div class="sb-label">χ²/df</div><div class="sb-value" style="color:'+(semResult.chiRatio<=2?'var(--ok)':semResult.chiRatio<=3?'var(--warn)':'var(--err)')+'">'+semResult.chiRatio+'</div><div class="sb-note">≤ 2.0 = good</div></div>';
        html+='<div class="sb"><div class="sb-label">TLI</div><div class="sb-value" style="color:'+(semResult.TLI_raw>=0.95?'var(--ok)':semResult.TLI_raw>=0.90?'var(--warn)':'var(--err)')+'">'+semResult.TLI+'</div><div class="sb-note">≥ .95 = good</div></div>';
        html+='</div>';
        html+='<div style="font-size:11.5px;color:var(--ink-muted)">χ²('+semResult.dfModel+')='+semResult.chiSq+', p='+semResult.pChiSq+', N='+semResult.n+', RMSEA 90% CI: ['+semResult.RMSEA_lo+', '+semResult.RMSEA_hi+']</div>';
        html+='</div>';

        // Path coefficients table
        if(semResult.paths&&semResult.paths.length){
          html+='<div class="card"><div class="sec-hd">Structural Path Coefficients</div>';
          html+='<div class="tbl-wrap"><table><thead><tr><th>Dari</th><th>Ke</th><th style="text-align:right">β (Std)</th><th style="text-align:right">SE</th><th style="text-align:right">t</th><th style="text-align:right">p</th><th>Sig</th><th>Kesimpulan</th></tr></thead><tbody>';
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
          html+='</tbody></table></div></div>';
        }

        // Indirect effects (if paths exist)
        if(semResult.indirectEffects&&semResult.indirectEffects.length){
          html+='<div class="card"><div class="sec-hd">Indirect Effects (Mediasi via Konstruk Laten)</div>';
          html+='<div class="tbl-wrap"><table><thead><tr><th>X</th><th>M</th><th>Y</th><th style="text-align:right">Indirect β</th><th style="text-align:right">Bootstrap CI 95%</th><th>Sig</th></tr></thead><tbody>';
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
          html+='<div style="font-size:11px;color:var(--ink-subtle);margin-top:6px">Bootstrap CI (n=1000). Jika CI tidak mencakup 0 → indirect effect signifikan.</div>';
          html+='</div>';
        }

        // AMOS Syntax equivalent
        html+='<div class="card"><div class="sec-hd">AMOS / lavaan Syntax Equivalent</div>';
        html+='<div style="margin-bottom:8px;font-size:12px;color:var(--ink-muted)">R lavaan syntax untuk model ini:</div>';
        html+='<textarea class="syn-area" readonly style="min-height:160px">'+escHtml(generateLavaanSyntax(aState.semLatents,aState.semLatentMap,aState.semPaths))+'</textarea>';
        html+='<div style="font-size:11px;color:var(--ink-subtle);margin-top:6px">Di AMOS: gunakan path diagram GUI. Di R: <code style="color:var(--ink);font-family:var(--font-mono-stack)">library(lavaan); fit &lt;- sem(model, data=df)</code></div>';
        html+='</div>';

        // Model interpretation guide
        html+='<div class="card"><div class="sec-hd">Panduan Interpretasi SEM</div>';
        html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px;font-size:12px;color:var(--ink-muted);line-height:1.6">';
        [['var(--ok)','Good Fit','CFI ≥ .95, RMSEA ≤ .06, SRMR ≤ .08, χ²/df ≤ 2'],
         ['var(--warn)','Acceptable Fit','CFI ≥ .90, RMSEA ≤ .08, SRMR ≤ .10'],
         ['var(--err)','Poor Fit','Perlu modifikasi model: cek MI, re-specify'],
         ['var(--ink)','β (Path Coef)','Standardized: ≥ .30 = medium effect, ≥ .50 = large'],
         ['var(--gold-text)','AVE ≥ .50','Convergent validity terpenuhi untuk setiap konstruk'],
         ['var(--line)','CR ≥ .70','Construct reliability (internal consistency)']
        ].forEach(function(r){
          html+='<div class="notice-box"><b style="color:'+r[0]+'">'+r[1]+'</b><br>'+r[2]+'</div>';
        });
        html+='</div></div>';

        // Run SEM to output button
        html+='<div style="text-align:center;margin-top:8px"><button class="btn btn-primary" onclick="runSEM()">▶ Run</button></div>';
      }
    }
  return html;
}

function renderDiscriminantForm(){
  const nF=numFields(),aF=allFields();
  let html='';
    if(!aState.ldaGroup) aState.ldaGroup='';
    if(!aState.ldaPreds) aState.ldaPreds=[];
    var ldaResult=aState.ldaResult||null;
    html+='<div class="card"><div class="sec-hd">Linear Discriminant Analysis</div>';
    html+='<div style="margin-bottom:10px"><label class="lbl">Grouping Variable (Kategorikal)</label>';
    html+=mkSelect('lda-grp',aF,aState.ldaGroup,'aState.ldaGroup=val;aState.ldaResult=null;renderASub()','Select grouping variable');
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

    if(ldaResult&&ldaResult._err){
      html+='<div class="card"><div class="miss-warn">'+escHtml(ldaResult.msg)+'</div></div>';
    } else if(ldaResult){
      var lr=ldaResult;
      // Model fit summary
      html+='<div class="card"><div class="sec-hd">Model Summary</div>';
      html+='<div class="stats-grid" style="grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:6px;margin-bottom:10px">';
      html+='<div class="sb"><div class="sb-label">N</div><div class="sb-value">'+lr.n+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Groups</div><div class="sb-value">'+lr.groups.length+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Predictors</div><div class="sb-value">'+lr.preds.length+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Wilks\' λ</div><div class="sb-value">'+lr.wilksLambda+'</div><div class="sb-note">p = '+lr.wilksP+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Accuracy</div><div class="sb-value" style="color:'+(parseFloat(lr.accuracy)>=70?'var(--ok)':parseFloat(lr.accuracy)>=50?'var(--warn)':'var(--err)')+'">'+lr.accuracy+'%</div></div>';
      html+='<div class="sb"><div class="sb-label">Functions</div><div class="sb-value">'+lr.nFunctions+'</div></div>';
      html+='</div></div>';

      // Eigenvalues table
      html+='<div class="card"><div class="sec-hd">Eigenvalues & Canonical Correlations</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Function</th><th style="text-align:right">Eigenvalue</th><th style="text-align:right">% Variance</th><th style="text-align:right">Cumulative %</th><th style="text-align:right">Canonical r</th></tr></thead><tbody>';
      lr.eigenvalues.forEach(function(e,i){
        html+='<tr><td class="td-label">'+(i+1)+'</td><td class="td-num">'+e.eigenvalue+'</td><td class="td-num">'+e.pctVar+'%</td><td class="td-num">'+e.cumPct+'%</td><td class="td-num" style="color:var(--gold-text);font-weight:700">'+e.canonicalR+'</td></tr>';
      });
      html+='</tbody></table></div></div>';

      // Standardized coefficients
      html+='<div class="card"><div class="sec-hd">Standardized Discriminant Function Coefficients</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Predictor</th>';
      lr.eigenvalues.forEach(function(e,i){ html+='<th style="text-align:right">Function '+(i+1)+'</th>'; });
      html+='</tr></thead><tbody>';
      lr.preds.forEach(function(p,pi){
        html+='<tr><td class="td-label">'+escHtml(p)+'</td>';
        lr.stdCoefs.forEach(function(fc){ html+='<td class="td-num" style="color:'+(Math.abs(fc[pi])>=0.3?'var(--gold-text)':'var(--ink-muted)')+';font-weight:'+(Math.abs(fc[pi])>=0.3?'700':'400')+'">'+fc[pi]+'</td>'; });
        html+='</tr>';
      });
      html+='</tbody></table></div></div>';

      // Group means
      html+='<div class="card"><div class="sec-hd">Group Means (Discriminant Scores)</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Group</th><th style="text-align:right">N</th>';
      lr.preds.forEach(function(p){ html+='<th style="text-align:right">'+escHtml(p)+'</th>'; });
      html+='</tr></thead><tbody>';
      lr.groupStats.forEach(function(g){
        html+='<tr><td class="td-label" style="color:var(--ink);font-weight:700">'+escHtml(g.label)+'</td><td class="td-num">'+g.n+'</td>';
        g.means.forEach(function(m){ html+='<td class="td-num">'+m+'</td>'; });
        html+='</tr>';
      });
      html+='</tbody></table></div></div>';

      // Classification table
      html+='<div class="card"><div class="sec-hd">Classification Results</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Actual \\ Predicted</th>';
      lr.groups.forEach(function(g){ html+='<th style="text-align:right">'+escHtml(g)+'</th>'; });
      html+='<th style="text-align:right">Total</th><th style="text-align:right">% Correct</th></tr></thead><tbody>';
      lr.classTable.forEach(function(row,i){
        var tot=row.counts.reduce(function(s,v){return s+v;},0);
        html+='<tr><td class="td-label" style="color:var(--ink);font-weight:700">'+escHtml(lr.groups[i])+'</td>';
        row.counts.forEach(function(c,j){
          var isDiag=i===j;
          html+='<td class="td-num" style="'+(isDiag?'color:var(--ok);font-weight:700;background:var(--ok-bg)':'')+'">'+c+'</td>';
        });
        html+='<td class="td-num">'+tot+'</td><td class="td-num" style="color:var(--ok);font-weight:700">'+row.pctCorrect+'%</td></tr>';
      });
      html+='</tbody></table></div>';
      html+='<div style="margin-top:8px;font-size:11.5px;color:var(--ink-muted)">Overall accuracy: <b style="color:var(--ok)">'+lr.accuracy+'%</b></div></div>';

      // Structure matrix
      html+='<div class="card"><div class="sec-hd">Structure Matrix (Pooled Within-Groups Correlations)</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Predictor</th>';
      lr.eigenvalues.forEach(function(e,i){ html+='<th style="text-align:right">Function '+(i+1)+'</th>'; });
      html+='</tr></thead><tbody>';
      lr.preds.forEach(function(p,pi){
        html+='<tr><td class="td-label">'+escHtml(p)+'</td>';
        lr.structureMatrix.forEach(function(fc){ html+='<td class="td-num" style="color:'+(Math.abs(fc[pi])>=0.3?'var(--gold-text)':'var(--ink-muted)')+';font-weight:'+(Math.abs(fc[pi])>=0.3?'700':'400')+'">'+fc[pi]+'</td>'; });
        html+='</tr>';
      });
      html+='</tbody></table><div style="margin-top:6px;font-size:11px;color:var(--ink-subtle)">|r| ≥ .30 = practically significant loading</div></div></div>';

      // Scatter plot of first 2 discriminant functions
      if(lr.scores&&lr.nFunctions>=1){
        html+='<div class="card"><div class="sec-hd">Discriminant Score Plot</div>';
        html+=svgDiscriminantPlot(lr);
        html+='</div>';
      }
    }
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
    var clResult=aState.clResult||null;

    html+='<div class="card"><div class="sec-hd">Cluster Analysis</div>';
    // Method toggle
    html+='<div style="margin-bottom:10px">'+mkCsel('cl-method',['kmeans','hierarchical'],aState.clMethod,'aState.clMethod=val;aState.clResult=null;renderASub()','Method')+'</div>';

    // Variables
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

    if(clResult&&clResult._err){
      html+='<div class="card"><div class="miss-warn">'+escHtml(clResult.msg)+'</div></div>';
    } else if(clResult){
      var cr=clResult;
      // Summary
      html+='<div class="card"><div class="sec-hd">Cluster Summary</div>';
      html+='<div class="stats-grid" style="grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:6px;margin-bottom:10px">';
      html+='<div class="sb"><div class="sb-label">N Cases</div><div class="sb-value">'+cr.n+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Variables</div><div class="sb-value">'+cr.vars.length+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Clusters (k)</div><div class="sb-value" style="color:var(--gold-text)">'+cr.k+'</div></div>';
      if(cr.method==='kmeans'){
        html+='<div class="sb"><div class="sb-label">Within-SS</div><div class="sb-value">'+cr.totalWSS+'</div></div>';
        html+='<div class="sb"><div class="sb-label">Between-SS</div><div class="sb-value">'+cr.totalBSS+'</div></div>';
        html+='<div class="sb"><div class="sb-label">Silhouette</div><div class="sb-value" style="color:'+(cr.silhouette>=0.5?'var(--ok)':cr.silhouette>=0.25?'var(--warn)':'var(--err)')+'">'+cr.silhouette+'</div></div>';
      } else {
        html+='<div class="sb"><div class="sb-label">Linkage</div><div class="sb-value" style="font-size:12px">'+escHtml(cr.linkage)+'</div></div>';
        html+='<div class="sb"><div class="sb-label">Silhouette</div><div class="sb-value" style="color:'+(cr.silhouette>=0.5?'var(--ok)':cr.silhouette>=0.25?'var(--warn)':'var(--err)')+'">'+cr.silhouette+'</div></div>';
      }
      html+='</div>';
      // Silhouette interpretation
      var silVal=parseFloat(cr.silhouette);
      var silLabel=silVal>=0.7?'Strong structure':silVal>=0.5?'Reasonable structure':silVal>=0.25?'Weak structure':'No substantial structure';
      var silColor=silVal>=0.5?'var(--ok)':silVal>=0.25?'var(--warn)':'var(--err)';
      var silCls=silVal>=0.5?'notice-ok':silVal>=0.25?'notice-warn':'notice-err';
      html+='<div class="notice-box '+silCls+'">Silhouette = <b style="color:'+silColor+'">'+cr.silhouette+'</b> → <b style="color:'+silColor+'">'+escHtml(silLabel)+'</b><br><span style="font-size:11px;color:var(--ink-subtle)">≥0.70 = strong · ≥0.50 = reasonable · ≥0.25 = weak · &lt;0.25 = poor</span></div>';
      html+='</div>';

      // Cluster sizes
      html+='<div class="card"><div class="sec-hd">Cluster Sizes & Centroids</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Cluster</th><th style="text-align:right">N</th><th style="text-align:right">%</th>';
      cr.vars.forEach(function(v){ html+='<th style="text-align:right">'+escHtml(v)+' (mean)</th>'; });
      html+='</tr></thead><tbody>';
      var clColors=T.series;
      cr.clusters.forEach(function(c,i){
        var col=clColors[i%clColors.length];
        html+='<tr><td class="td-label"><span style="display:inline-flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:2px;background:'+col+';display:inline-block"></span><b style="color:var(--ink)">C'+(i+1)+'</b></span></td>';
        html+='<td class="td-num">'+c.n+'</td><td class="td-num">'+c.pct+'%</td>';
        c.centroid.forEach(function(m){ html+='<td class="td-num">'+m+'</td>'; });
        html+='</tr>';
      });
      html+='</tbody></table></div></div>';

      // Scatter plot (first 2 vars)
      if(cr.vars.length>=2){
        html+='<div class="card"><div class="sec-hd">Cluster Plot (PC1 vs PC2)</div>';
        html+=svgClusterPlot(cr);
        html+='</div>';
      }

      // Hierarchical: Dendrogram
      if(cr.method==='hierarchical'&&cr.dendro){
        html+='<div class="card"><div class="sec-hd">Dendrogram</div>';
        html+=svgDendrogram(cr.dendro,cr.k,cr.vars);
        html+='</div>';
      }

      // Elbow chart for K-Means
      if(cr.method==='kmeans'&&cr.elbowData){
        html+='<div class="card"><div class="sec-hd">Elbow Chart (WSS by k)</div>';
        html+=svgElbow(cr.elbowData);
        html+='<div style="font-size:11px;color:var(--ink-subtle);margin-top:6px">Look for the "elbow" — the k where adding more clusters gives diminishing returns.</div>';
        html+='</div>';
      }

      // ANOVA per variable
      html+='<div class="card"><div class="sec-hd">ANOVA per Variable (Cluster Discrimination)</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Variable</th><th style="text-align:right">F</th><th style="text-align:right">df1</th><th style="text-align:right">df2</th><th style="text-align:right">p</th><th>Sig</th></tr></thead><tbody>';
      cr.anova.forEach(function(a){
        var sig=parseFloat(a.p)<0.05;
        html+='<tr><td class="td-label">'+escHtml(a.variable)+'</td><td class="td-num">'+a.F+'</td><td class="td-num">'+a.df1+'</td><td class="td-num">'+a.df2+'</td>';
        html+='<td class="td-num" style="color:'+(sig?'var(--ok)':'var(--err)')+'">'+(sig?'<b>':'')+a.p_fmt+(sig?'</b>':'')+'</td>';
        html+='<td>'+sigBadge(a.p)+'</td></tr>';
      });
      html+='</tbody></table><div style="margin-top:6px;font-size:11px;color:var(--ink-subtle)">Variables with significant F contribute most to cluster separation.</div></div></div>';
    }
  return html;
}

function renderRocForm(){
  const nF=numFields(),aF=allFields();
  var T=ossChartTheme();
  let html='';
    if(!aState.rocProb&&nF.length) aState.rocProb=nF[0];
    if(!aState.rocTrue&&aF.length) aState.rocTrue=aF[aF.length>1?aF.length-1:0];
    if(!aState.rocCompare) aState.rocCompare=[];
    var rocPrv=aState.rocProb&&aState.rocTrue?tryStats(function(){return computeROC(data,aState.rocProb,aState.rocTrue,aState.rocPosClass);}):null;

    if(currentASub==='roc'){
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">ROC Curve Analysis</div>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-bottom:11px;line-height:1.65">Receiver Operating Characteristic curve — visualisasikan trade-off sensitivity vs specificity. AUC mengukur kemampuan diskriminasi model secara keseluruhan.</div>';
      html+=mkSelect('roc-prob',nF,aState.rocProb,'aState.rocProb=val;renderASub()','Predicted Probability / Score');
      html+='<div style="margin-top:8px">'+mkSelect('roc-true',aF,aState.rocTrue,'aState.rocTrue=val;renderASub()','True Binary Outcome')+'</div>';
      // Positive class selector
      if(aState.rocTrue){
        var uniq=[...new Set(data.map(function(r){return String(r[aState.rocTrue]||'');}).filter(Boolean))].slice(0,10);
        if(uniq.length>=2){
          html+='<div style="margin-top:8px"><label class="lbl">Positive Class (event=1)</label>';
          html+='<div class="row" style="gap:5px;margin-top:5px;flex-wrap:wrap">';
          uniq.forEach(function(u){html+='<button class="btn '+(aState.rocPosClass===u?'btn-active':'btn-ghost')+' btn-sm" onclick="aState.rocPosClass=this.dataset.v;renderASub()" data-v="'+escHtmlAttr(u)+'">'+escHtml(u)+'</button>';});
          html+='</div></div>';
        }
      }
      html+='<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="runROC()">▶ Run</button>';
      if(rocPrv&&!rocPrv._err){
        html+='<div class="stats-grid2" style="margin-top:12px">';
        html+=stCard('AUC',rocPrv.auc,rocPrv.aucInterp);
        html+=stCard('95% CI',rocPrv.aucCI,'');
        html+=stCard('Optimal Cutoff',rocPrv.optThresh,'Youden index');
        html+=stCard('Sensitivity',rocPrv.optSens,'at optimal');
        html+=stCard('Specificity',rocPrv.optSpec,'at optimal');
        html+=stCard('N',rocPrv.n,'pos='+rocPrv.nPos+' neg='+rocPrv.nNeg);
        html+='</div>';
        html+='<div class="row" style="margin-top:8px">';
        var aucTag=parseFloat(rocPrv.auc)>=0.9?'tag-green':parseFloat(rocPrv.auc)>=0.8?'tag-blue':parseFloat(rocPrv.auc)>=0.7?'tag-yellow':'tag-red';
        html+='<span class="tag '+aucTag+'">AUC = '+rocPrv.auc+' ('+escHtml(rocPrv.aucInterp)+')</span>';
        html+='</div>';
      }
      if(rocPrv&&rocPrv._err) html+='<div class="notice-box notice-err" style="margin-top:8px">'+escHtml(rocPrv.msg)+'</div>';
      html+='</div>';
      html+='<div class="card"><div class="sec-hd">ROC Plot</div>';
      if(rocPrv&&!rocPrv._err){
        html+=svgROC(rocPrv);
        html+='<div style="margin-top:12px"><div class="sec-hd-sub">Optimal Operating Point (Youden)</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th style="text-align:right">Threshold</th><th style="text-align:right">Sensitivity</th><th style="text-align:right">Specificity</th><th style="text-align:right">PPV</th><th style="text-align:right">NPV</th><th style="text-align:right">F1</th><th style="text-align:right">Youden J</th></tr></thead><tbody>';
        html+='<tr><td class="td-num" style="color:var(--gold-text);font-weight:700">'+rocPrv.optThresh+'</td><td class="td-num">'+rocPrv.optSens+'</td><td class="td-num">'+rocPrv.optSpec+'</td><td class="td-num">'+rocPrv.optPPV+'</td><td class="td-num">'+rocPrv.optNPV+'</td><td class="td-num">'+rocPrv.optF1+'</td><td class="td-num" style="color:var(--ok);font-weight:700">'+rocPrv.optYouden+'</td></tr>';
        html+='</tbody></table></div></div>';
        // Full threshold table (top 10 rows)
        html+='<div style="margin-top:12px"><div class="sec-hd-sub">Full Threshold Table (top points)</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th style="text-align:right">Threshold</th><th style="text-align:right">TPR (Sens)</th><th style="text-align:right">FPR (1-Spec)</th><th style="text-align:right">Precision</th><th style="text-align:right">F1</th></tr></thead><tbody>';
        var step=Math.max(1,Math.floor(rocPrv.curve.length/12));
        rocPrv.curve.filter(function(_,i){return i%step===0;}).slice(0,14).forEach(function(pt){
          html+='<tr><td class="td-num">'+SE.f4(pt.t)+'</td><td class="td-num">'+SE.f4(pt.tpr)+'</td><td class="td-num">'+SE.f4(pt.fpr)+'</td><td class="td-num">'+SE.f4(pt.ppv||0)+'</td><td class="td-num">'+SE.f4(pt.f1||0)+'</td></tr>';
        });
        html+='</tbody></table></div></div>';
      } else { html+='<div class="chart-empty">Select probability score and outcome to see ROC curve</div>'; }
      html+='</div></div>';
    }

    else if(currentASub==='roc_compare'){
      html+='<div class="card"><div class="sec-hd">Compare Multiple ROC Curves</div>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-bottom:10px;line-height:1.65">Bandingkan AUC dari beberapa model/prediktor secara visual. Gunakan DeLong test untuk uji perbedaan AUC yang signifikan.</div>';
      html+='<div style="margin-bottom:10px">'+mkSelect('roc-true-cmp',aF,aState.rocTrue,'aState.rocTrue=val;renderASub()','True Binary Outcome')+'</div>';
      html+='<label class="lbl">Predicted Scores to Compare</label>';
      html+='<div style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 12px">';
      nF.forEach(function(v){
        var sel=(aState.rocCompare||[]).includes(v);
        html+='<label class="chip-opt'+(sel?' sel':'')+'">';
        html+='<input type="checkbox" '+(sel?'checked':'')+' onchange="toggleROCCompare(this.dataset.fld,this.checked)" data-fld="'+escHtmlAttr(v)+'"/>'+escHtml(v)+'</label>';
      });
      html+='</div>';
      if(aState.rocTrue&&aState.rocCompare&&aState.rocCompare.length>=2){
        var cmpCurves=aState.rocCompare.map(function(v){
          try{return {name:v,roc:computeROC(data,v,aState.rocTrue,aState.rocPosClass)};}
          catch(e){return {name:v,roc:{_err:true}};}
        }).filter(function(c){return !c.roc._err;});
        if(cmpCurves.length>=2){
          html+=svgROCCompare(cmpCurves);
          html+='<div class="tbl-wrap" style="margin-top:10px"><table><thead><tr><th>Model / Score</th><th style="text-align:right">AUC</th><th style="text-align:right">95% CI</th><th style="text-align:right">Optimal Cutoff</th><th style="text-align:right">Sensitivity</th><th style="text-align:right">Specificity</th></tr></thead><tbody>';
          cmpCurves.forEach(function(c,ci){
            var r=c.roc;
            var col=T.series[ci%T.series.length];
            html+='<tr><td class="td-label"><span style="display:inline-flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:2px;background:'+col+';display:inline-block"></span>'+escHtml(c.name)+'</span></td><td class="td-num" style="color:var(--gold-text);font-weight:700">'+r.auc+'</td><td class="td-num" style="font-size:11px">'+r.aucCI+'</td><td class="td-num">'+r.optThresh+'</td><td class="td-num">'+r.optSens+'</td><td class="td-num">'+r.optSpec+'</td></tr>';
          });
          html+='</tbody></table></div>';
          // DeLong test between first two
          if(cmpCurves.length>=2){
            try{
              var dlong=deLongTest(cmpCurves[0].roc,cmpCurves[1].roc);
              var dSig=parseFloat(dlong.p)<0.05;
              html+='<div class="notice-box '+(dSig?'notice-ok':'')+'" style="margin-top:10px"><b style="color:var(--gold-text)">DeLong Test ('+escHtml(cmpCurves[0].name)+' vs '+escHtml(cmpCurves[1].name)+'):</b> z='+dlong.z+', p='+dlong.p_fmt+' — '+(dSig?'<span style="color:var(--ok);font-weight:700">Significant difference in AUC</span>':'<span style="color:var(--warn)">No significant difference</span>')+'</div>';
            }catch(e){}
          }
        }
      } else {
        html+='<div class="chart-empty">Select outcome and ≥2 score variables to compare</div>';
      }
      html+='</div>';
    }
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
    // Legacy subtab redirect
    if(currentASub==='km') aState.survMethod='km';
    else if(currentASub==='logrank') aState.survMethod='logrank';
    else if(currentASub==='cox') aState.survMethod='cox';

    var survValid=aState.survTime&&aState.survEvent;
    var survPrv=survValid?tryStats(function(){return computeKaplanMeier(data,aState.survTime,aState.survEvent,aState.survGroup||null);}):null;
    var coxPrv=(aState.survMethod==='cox'&&aState.survCovs&&aState.survCovs.length>0&&survValid)
      ?tryStats(function(){return computeCoxRegression(data,aState.survTime,aState.survEvent,aState.survCovs);}):null;

    html+='<div class="grid2">';

    // Left: shared setup + method select
    html+='<div style="display:flex;flex-direction:column;gap:10px">';
    html+='<div class="card"><div class="sec-hd">Variable Setup</div>';
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
    html+='</div>';
    html+='</div>';

    // Right: method-specific content
    html+='<div style="display:flex;flex-direction:column;gap:10px">';

    if(aState.survMethod==='km'){
      html+='<div class="card"><div class="sec-hd">Kaplan-Meier Estimator</div>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-bottom:10px;line-height:1.65">Mengestimasi survival function S(t) = P(T&gt;t) dari data dengan censoring. Titik drop = event; ✚ = censored.</div>';
      html+='<button class="btn btn-primary btn-sm" style="margin-bottom:11px" onclick="runSurvival()">▶ Run</button>';
      if(survPrv&&!survPrv._err){
        html+='<div class="stats-grid2">';
        survPrv.groups.forEach(function(g){
          html+=stCard('Median Survival ('+escHtml(g.label)+')',g.medianSurv===null?'NR':SE.f4(g.medianSurv),'');
          html+=stCard('Events / N ('+escHtml(g.label)+')',g.events+' / '+g.n,'');
        });
        html+='</div>';
        if(survPrv.groups.length>=2){
          var lrSig=parseFloat(survPrv.logrank.p)<0.05;
          html+='<div class="notice-box '+(lrSig?'notice-ok':'')+'" style="margin-top:10px">';
          html+='Log-rank: χ²('+survPrv.logrank.df+') = '+survPrv.logrank.chi2+', p = '+survPrv.logrank.p_fmt+' '+(lrSig?'<b style="color:var(--ok)">✓ Sig</b>':'<span style="color:var(--warn)">ns</span>');
          html+='</div>';
        }
      }
      if(survPrv&&survPrv._err) html+='<div class="notice-box notice-err" style="margin-top:8px">'+escHtml(survPrv.msg)+'</div>';
      html+='</div>';
      html+='<div class="card"><div class="sec-hd">KM Plot</div>';
      if(survPrv&&!survPrv._err) html+=svgKaplanMeier(survPrv);
      else html+='<div class="chart-empty">Set time dan event variable untuk melihat kurva KM</div>';
      html+='</div>';
    }

    else if(aState.survMethod==='logrank'){
      html+='<div class="card"><div class="sec-hd">Log-Rank Test</div>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-bottom:10px;line-height:1.65">Uji perbedaan survival curves antar grup. H₀: semua grup memiliki survival function yang sama.</div>';
      if(!aState.survGroup){
        html+='<div class="notice-box notice-warn">Pilih Group Variable di panel kiri untuk menjalankan log-rank test.</div>';
      } else if(survPrv&&!survPrv._err&&survPrv.groups.length>=2){
        var lr=survPrv.logrank;
        html+='<div class="stats-grid2" style="margin-bottom:12px">';
        html+=stCard('χ²',lr.chi2,'Chi-square');
        html+=stCard('df',lr.df,'');
        html+=stCard('p-value',lr.p_fmt,'');
        html+=stCard('Sig',parseFloat(lr.p)<0.05?'Yes *':'No','');
        html+='</div>';
        html+='<div class="notice-box" style="margin-bottom:10px">'+lr.interpretation+'</div>';
        html+=mkTable(['Group','N','Events','Censored','Median Survival','O-E'],
          survPrv.groups.map(function(g){return [g.label,g.n,g.events,g.n-g.events,g.medianSurv===null?'NR':SE.f4(g.medianSurv),SE.f4(g.oe||0)];}));
        html+='<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="runSurvival()">▶ Run</button>';
      } else if(survPrv&&survPrv._err) html+='<div class="notice-box notice-err">'+escHtml(survPrv.msg)+'</div>';
      else html+='<div class="chart-empty">Pilih group variable dan pastikan data sudah di-load</div>';
      html+='</div>';
      html+='<div class="card"><div class="sec-hd">KM Plot (Comparison)</div>';
      if(survPrv&&!survPrv._err) html+=svgKaplanMeier(survPrv);
      else html+='<div class="chart-empty">Set variables untuk melihat kurva perbandingan</div>';
      html+='</div>';
    }

    else if(aState.survMethod==='cox'){
      html+='<div class="card"><div class="sec-hd">Cox Proportional Hazards</div>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-bottom:10px;line-height:1.65">Model semi-parametrik untuk memodelkan hazard sebagai fungsi kovariat. HR &gt; 1 = peningkatan risiko; HR &lt; 1 = protektif.</div>';
      html+='<label class="lbl">Covariates <span style="color:var(--ink-subtle);text-transform:none;letter-spacing:0">(Predictors)</span></label>';
      html+='<div style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 12px">';
      nF.filter(function(v){return v!==aState.survTime&&v!==aState.survEvent;}).forEach(function(v){
        var sel=(aState.survCovs||[]).includes(v);
        html+='<label class="chip-opt'+(sel?' sel':'')+'"><input type="checkbox" '+(sel?'checked':'')+' data-fld="'+escHtmlAttr(v)+'" onchange="toggleSurvCov(this.dataset.fld,this.checked)"/>'+escHtml(v)+'</label>';
      });
      html+='</div>';
      html+='<button class="btn btn-primary btn-sm" onclick="runCoxRegression()">▶ Run</button>';
      if(coxPrv&&!coxPrv._err){
        html+='<div class="stats-grid2" style="margin-top:11px">';
        html+=stCard('N',coxPrv.n,'');
        html+=stCard('Events',coxPrv.events,'');
        html+=stCard('LR χ²',coxPrv.lrChi2,'p='+coxPrv.lrP_fmt);
        html+=stCard('Concordance',coxPrv.concordance,'C-index');
        html+='</div>';
      }
      if(coxPrv&&coxPrv._err) html+='<div class="notice-box notice-err" style="margin-top:8px">'+escHtml(coxPrv.msg)+'</div>';
      html+='</div>';
      html+='<div class="card"><div class="sec-hd">Hazard Ratios</div>';
      if(coxPrv&&!coxPrv._err){
        html+=mkTable(['Covariate','β','SE','HR','95% CI HR','z','p'],
          coxPrv.coefs.map(function(c){
            var sig=parseFloat(c.p)<0.05;
            var hrNum=parseFloat(c.HR);
            var hrCol=hrNum>1.5?'var(--err)':hrNum<0.67?'var(--ok)':'var(--warn)';
            return [c.name,c.beta,c.se,'<span style="color:'+hrCol+';font-weight:700">'+c.HR+'</span>',c.ci95,c.z,(sig?'<b style="color:var(--ok)">':'')+c.p_fmt+(sig?'</b>':'')];
          }));
        html+=svgForestPlot(coxPrv);
      } else {
        html+='<div class="chart-empty">Pilih covariates dan run Cox model</div>';
      }
      html+='</div>';
    }

    html+='</div>'; // end right col
    html+='</div>'; // end grid2
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
    // Input jumlah prediktor (u) — hanya untuk Multiple Regression (R²)
    var predsInput=function(){return (pw.pwTest||'')==='regression_r2'?'<div style="margin-bottom:9px"><label class="lbl">Number of Predictors (u)</label><input type="number" class="inp" value="'+(pw.pwPreds||1)+'" min="1" max="50" oninput="aState.pwPreds=Math.max(1,parseInt(this.value)||1)" onblur="renderASub()" style="margin-top:5px;width:130px" placeholder="u"/></div>':'';};

    if(currentASub==='poweranalysis'){
      var pwRes=null;
      try{ pwRes=computePower(pw.pwTest,parseFloat(pw.pwAlpha),parseFloat(pw.pwPower),parseFloat(pw.pwEffect),parseInt(pw.pwGroups||2),parseInt(pw.pwTails||2),pw.pwSolve,parseInt(pw.pwN||30),parseInt(pw.pwPreds||1)); }catch(e){ pwRes={err:e.message}; }

      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">Power Analysis — Sample Size Calculator</div>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-bottom:12px;line-height:1.6">Tentukan N minimum yang dibutuhkan, atau hitung power dari N yang ada, berdasarkan effect size, α, dan tipe uji statistik.</div>';

      // Test type — custom csel
      html+='<div style="margin-bottom:10px">';
      html+=mkOptCsel('pw-test', testOptions.map(function(t){return{val:t,label:testLabels[t]};}), pw.pwTest||'ttest_2samp', 'aState.pwTest=_cR["pw-test"]._vals[_cR["pw-test"].fields.indexOf(val)];renderASub()', 'Statistical Test', true);
      html+='</div>';

      // Solve for — toggle buttons
      html+='<div style="margin-bottom:10px"><label class="lbl">Solve For</label><div class="row" style="gap:5px;margin-top:5px;flex-wrap:wrap">';
      [['n','N (Sample Size)'],['power','Power (1−β)'],['alpha','Alpha (α)'],['effect','Effect Size']].forEach(function(s){
        html+='<button class="btn '+(pw.pwSolve===s[0]?'btn-active':'btn-ghost')+' btn-sm" onclick="aState.pwSolve=\''+s[0]+'\';renderASub()">'+s[1]+'</button>';
      });
      html+='</div></div>';

      // Alpha — csel
      if(pw.pwSolve!=='alpha'){
        html+='<div style="margin-bottom:9px">';
        html+=mkOptCsel('pw-alpha', [{val:0.001,label:'0.001'},{val:0.01,label:'0.01'},{val:0.05,label:'0.05'},{val:0.10,label:'0.10'}], pw.pwAlpha, 'aState.pwAlpha=parseFloat(_cR["pw-alpha"]._vals[_cR["pw-alpha"].fields.indexOf(val)]);renderASub()', 'Significance Level (α)');
        html+='</div>';
      }

      // Power — csel
      if(pw.pwSolve!=='power'){
        html+='<div style="margin-bottom:9px">';
        html+=mkOptCsel('pw-power', [{val:0.70,label:'0.70 (70%)'},{val:0.80,label:'0.80 (80%)'},{val:0.90,label:'0.90 (90%)'},{val:0.95,label:'0.95 (95%)'}], pw.pwPower, 'aState.pwPower=parseFloat(_cR["pw-power"]._vals[_cR["pw-power"].fields.indexOf(val)]);renderASub()', 'Desired Power (1−β)');
        html+='</div>';
      }

      // Effect size — toggle shortcuts + number input
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

      // Groups — csel (only when relevant)
      if(pw.pwSolve==='n'&&(pw.pwTest==='ttest_2samp'||pw.pwTest==='anova_oneway')){
        html+='<div style="margin-bottom:9px">';
        html+=mkOptCsel('pw-groups', [2,3,4,5,6].map(function(g){return{val:g,label:g+' groups'};}), pw.pwGroups||2, 'aState.pwGroups=parseInt(_cR["pw-groups"]._vals[_cR["pw-groups"].fields.indexOf(val)]);renderASub()', 'Number of Groups');
        html+='</div>';
      }

      // N input (when solving for power/effect/alpha)
      if(pw.pwSolve!=='n'){
        var _pwIsGrouped=(pw.pwTest==='ttest_2samp'||pw.pwTest==='anova_oneway');
        html+='<div style="margin-bottom:9px"><label class="lbl">'+(_pwIsGrouped?'Sample Size (N per group)':'Sample Size (N)')+'</label>';
        html+='<input type="number" class="inp" value="'+(pw.pwN||30)+'" min="3" max="10000" oninput="aState.pwN=parseInt(this.value)||30" onblur="renderASub()" style="margin-top:5px;width:130px" placeholder="N"/>';
        html+='</div>';
      }

      // Tails — csel
      if((pw.pwTest||'').indexOf('ttest')>=0||(pw.pwTest||'').indexOf('correlation')>=0){
        html+='<div style="margin-bottom:9px">';
        html+=mkOptCsel('pw-tails', [{val:1,label:'1-tailed'},{val:2,label:'2-tailed'}], pw.pwTails||2, 'aState.pwTails=parseInt(_cR["pw-tails"]._vals[_cR["pw-tails"].fields.indexOf(val)]);renderASub()', 'Hypothesis Tails');
        html+='</div>';
      }

      html+=predsInput();
      html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runPowerAnalysis()">▶ Run</button>';
      html+='</div>';

      // Results panel
      html+='<div class="card"><div class="sec-hd">Results</div>';
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
        html+='<div class="notice-box">'+pwRes.interpretation+'</div>';
        var convRef=effectConventions[pw.pwTest||'ttest_2samp']||['0.2','0.5','0.8'];
        html+='<div class="tbl-wrap" style="margin-top:12px"><table><thead><tr><th>Convention</th><th style="text-align:right">'+effectLabels[pw.pwTest||'ttest_2samp']+'</th><th>Interpretation</th></tr></thead><tbody>';
        html+='<tr><td class="td-label" style="color:var(--ok);font-weight:700">Small</td><td class="td-num">'+convRef[0]+'</td><td style="font-size:11.5px;color:var(--ink-muted)">Subtle, hard to detect visually</td></tr>';
        html+='<tr><td class="td-label" style="color:var(--warn);font-weight:700">Medium</td><td class="td-num">'+convRef[1]+'</td><td style="font-size:11.5px;color:var(--ink-muted)">Noticeable effect, typical in social science</td></tr>';
        html+='<tr><td class="td-label" style="color:var(--err);font-weight:700">Large</td><td class="td-num">'+convRef[2]+'</td><td style="font-size:11.5px;color:var(--ink-muted)">Obvious, strong effect</td></tr>';
        html+='</tbody></table></div>';
      } else if(pwRes&&pwRes.err){
        html+='<div class="notice-box notice-err">'+escHtml(pwRes.err)+'</div>';
      } else {
        html+='<div class="chart-empty">Set parameters above and click Run</div>';
      }
      html+='</div></div>';
    }

    else if(currentASub==='powerplot'){
      html+='<div class="card"><div class="sec-hd">Power Curves</div>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-bottom:12px;line-height:1.6">Visualisasi hubungan antara N, effect size, dan power. Garis horizontal 0.80 = standar minimum.</div>';
      html+='<div class="grid2" style="margin-bottom:12px">';
      html+='<div>';
      html+=mkOptCsel('pw-test-plot', testOptions.map(function(t){return{val:t,label:testLabels[t]};}), pw.pwTest||'ttest_2samp', 'aState.pwTest=_cR["pw-test-plot"]._vals[_cR["pw-test-plot"].fields.indexOf(val)];renderASub()', 'Test Type', true);
      html+='</div>';
      html+='<div>';
      html+=mkOptCsel('pw-alpha-plot', [{val:0.001,label:'α = 0.001'},{val:0.01,label:'α = 0.01'},{val:0.05,label:'α = 0.05'},{val:0.10,label:'α = 0.10'}], pw.pwAlpha, 'aState.pwAlpha=parseFloat(_cR["pw-alpha-plot"]._vals[_cR["pw-alpha-plot"].fields.indexOf(val)]);renderASub()', 'Alpha (α)');
      html+='</div>';
      html+='</div>';
      html+=predsInput();
      html+=svgPowerCurve(pw.pwTest||'ttest_2samp',parseFloat(pw.pwAlpha)||0.05,parseInt(pw.pwTails||2),undefined,undefined,parseInt(pw.pwPreds||1));
      html+='</div>';
      html+='<div class="card"><div class="sec-hd">N Table — Required Sample Size</div>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-bottom:10px">'+((pw.pwTest==='ttest_2samp'||pw.pwTest==='anova_oneway')?'N per group':'N')+' untuk tiap kombinasi power dan effect size (α='+pw.pwAlpha+')</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Effect Size</th><th style="text-align:right">Power 70%</th><th style="text-align:right">Power 80%</th><th style="text-align:right">Power 90%</th><th style="text-align:right">Power 95%</th></tr></thead><tbody>';
      var convRef2=effectConventions[pw.pwTest||'ttest_2samp']||['0.2','0.5','0.8'];
      convRef2.forEach(function(eff,ei){
        html+='<tr><td class="td-label">'+eff+' ('+effConvNames[ei]+')</td>';
        [0.70,0.80,0.90,0.95].forEach(function(pwr2){
          try{var r2=computePower(pw.pwTest||'ttest_2samp',parseFloat(pw.pwAlpha)||0.05,pwr2,parseFloat(eff),parseInt(pw.pwGroups||2),parseInt(pw.pwTails||2),'n',30,parseInt(pw.pwPreds||1));html+='<td class="td-num" style="color:'+(pwr2>=0.8?'var(--ok)':'var(--warn)')+';font-weight:700">'+r2.n+'</td>';}
          catch(e2){html+='<td class="td-num">—</td>';}
        });
        html+='</tr>';
      });
      html+='</tbody></table></div></div>';
    }

    else if(currentASub==='sensitivity'){
      html+='<div class="card"><div class="sec-hd">Sensitivity Analysis</div>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-bottom:12px;line-height:1.6">Berikan N yang ada → hitung Minimum Detectable Effect pada power dan α tertentu.</div>';
      html+='<div class="grid2" style="margin-bottom:10px">';
      html+='<div>';
      html+=mkOptCsel('pw-test-sens', testOptions.map(function(t){return{val:t,label:testLabels[t]};}), pw.pwTest||'ttest_2samp', 'aState.pwTest=_cR["pw-test-sens"]._vals[_cR["pw-test-sens"].fields.indexOf(val)];renderASub()', 'Test Type', true);
      html+='</div>';
      html+='<div><label class="lbl">'+((pw.pwTest==='ttest_2samp'||pw.pwTest==='anova_oneway')?'N per group':'N')+'</label><input type="number" class="inp" style="margin-top:5px" value="'+(pw.pwN||30)+'" min="3" max="10000" oninput="aState.pwN=parseInt(this.value)||30" onblur="renderASub()" placeholder="N"/></div>';
      html+='</div>';
      html+='<div class="grid2" style="margin-bottom:10px">';
      html+='<div>';
      html+=mkOptCsel('pw-power-sens', [{val:0.70,label:'0.70 (70%)'},{val:0.80,label:'0.80 (80%)'},{val:0.90,label:'0.90 (90%)'},{val:0.95,label:'0.95 (95%)'}], pw.pwPower, 'aState.pwPower=parseFloat(_cR["pw-power-sens"]._vals[_cR["pw-power-sens"].fields.indexOf(val)]);renderASub()', 'Desired Power');
      html+='</div>';
      html+='<div>';
      html+=mkOptCsel('pw-alpha-sens', [{val:0.001,label:'0.001'},{val:0.01,label:'0.01'},{val:0.05,label:'0.05'},{val:0.10,label:'0.10'}], pw.pwAlpha, 'aState.pwAlpha=parseFloat(_cR["pw-alpha-sens"]._vals[_cR["pw-alpha-sens"].fields.indexOf(val)]);renderASub()', 'Alpha (α)');
      html+='</div>';
      html+='</div>';

      html+=predsInput();
      var mde=null;
      try{ mde=computePower(pw.pwTest||'ttest_2samp',parseFloat(pw.pwAlpha)||0.05,parseFloat(pw.pwPower)||0.80,null,parseInt(pw.pwGroups||2),parseInt(pw.pwTails||2),'effect',parseInt(pw.pwN||30),parseInt(pw.pwPreds||1)); }catch(e){}

      if(mde&&!mde.err){
        html+='<div class="stats-grid2" style="margin:12px 0">';
        html+=stCard((pw.pwTest==='ttest_2samp'||pw.pwTest==='anova_oneway')?'N per group':'N',pw.pwN,'Input');
        html+=stCard('MDE',SE.f4(mde.effect),effectLabels[pw.pwTest||'ttest_2samp']);
        html+=stCard('Power',SE.f4(mde.power*100)+'%','');
        html+=stCard('Alpha',pw.pwAlpha,'');
        html+='</div>';
        html+='<div class="notice-box" style="margin-bottom:12px">';
        html+='Dengan N='+pw.pwN+(pw.pwTest==='ttest_2samp'||pw.pwTest==='anova_oneway'?' per grup':'')+', studi Anda dapat mendeteksi effect size ≥ <b style="color:var(--gold-text)">'+SE.f4(mde.effect)+'</b> ('+effectLabels[pw.pwTest||'ttest_2samp']+') pada power '+SE.f4(parseFloat(pw.pwPower)*100)+'% dan α='+pw.pwAlpha+'.';
        var convRef3=effectConventions[pw.pwTest||'ttest_2samp']||['0.2','0.5','0.8'];
        var mdeV=parseFloat(mde.effect);
        if(mdeV<=parseFloat(convRef3[0])) html+=' Cukup sensitif untuk mendeteksi efek kecil.';
        else if(mdeV<=parseFloat(convRef3[1])) html+=' Hanya bisa mendeteksi efek medium ke atas.';
        else html+=' Hanya bisa mendeteksi efek besar. Pertimbangkan menambah sampel.';
        html+='</div>';
        html+=svgSensitivityCurve(pw.pwTest||'ttest_2samp',parseFloat(pw.pwAlpha)||0.05,parseFloat(pw.pwPower)||0.80,parseInt(pw.pwTails||2),parseInt(pw.pwN||30),undefined,undefined,parseInt(pw.pwPreds||1));
      }
      html+='<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="runPowerAnalysis()">▶ Run</button>';
      html+='</div>';
    }
  return html;
}

function renderModerationForm(){
  let html='';
    var modData=data;
    var nF2=numFields(),aF2=allFields();
    if(!aState.modX&&nF2.length>0) aState.modX=nF2[0];
    if(!aState.modW&&nF2.length>1) aState.modW=nF2[1];
    if(!aState.modY&&nF2.length>2) aState.modY=nF2[2];
    var modValid=aState.modX&&aState.modW&&aState.modY&&aState.modX!==aState.modW&&aState.modX!==aState.modY&&aState.modW!==aState.modY;
    var modPrv=modValid?tryStats(function(){return computeModeration(aState.modX,aState.modW,aState.modY,aState.modCovs||[],aState.modCenter!==false);}):null;

    if(currentASub==='moderation'){
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">Moderation Analysis (X×W → Y)</div>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-bottom:10px;line-height:1.6">Uji apakah hubungan X→Y berbeda tergantung nilai moderator W. Interaction term X×W harus signifikan.</div>';

      html+=mkSelect('mod-x',nF2,aState.modX,'aState.modX=val;renderASub()','Independent Variable (X)');
      html+='<div style="margin-top:8px">'+mkSelect('mod-w',nF2,aState.modW,'aState.modW=val;renderASub()','Moderator Variable (W)')+'</div>';
      html+='<div style="margin-top:8px">'+mkSelect('mod-y',nF2,aState.modY,'aState.modY=val;renderASub()','Dependent Variable (Y)')+'</div>';

      // Covariates
      html+='<div style="margin-top:10px"><label class="lbl">Covariates (optional)</label><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">';
      nF2.forEach(function(f){
        if(f===aState.modX||f===aState.modW||f===aState.modY) return;
        var checked=(aState.modCovs||[]).includes(f);
        html+='<label class="chip-opt'+(checked?' sel':'')+'"><input type="checkbox" '+(checked?'checked':'')+' onchange="toggleModCov(this.dataset.fld,this.checked)" data-fld="'+escHtmlAttr(f)+'"/>'+escHtml(f)+'</label>';
      });
      html+='</div></div>';

      // Mean centering
      html+='<div style="margin-top:10px"><label style="display:flex;align-items:center;gap:7px;cursor:pointer"><input type="checkbox" '+(aState.modCenter!==false?'checked':'')+' onchange="aState.modCenter=this.checked;renderASub()" style="accent-color:var(--gold)"/><span style="font-size:12px;color:var(--ink)">Mean-center X and W before interaction</span></label><div style="font-size:11px;color:var(--ink-subtle);margin-top:3px;margin-left:22px">Direkomendasikan untuk mengurangi multikollinearitas dan memudahkan interpretasi</div></div>';

      html+='<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="runModeration()">▶ Run</button>';

      if(modPrv&&!modPrv._err){
        html+='<div style="margin-top:14px">';
        // Regression table summary
        html+='<div class="sec-hd-sub" style="margin-bottom:7px">Model Summary</div>';
        html+='<div class="stats-grid2" style="margin-bottom:10px">';
        html+=stCard('R²',modPrv.R2,'Variance explained');
        html+=stCard('Adj R²',modPrv.R2adj,'');
        html+=stCard('F',modPrv.F,'df='+modPrv.dfR+','+modPrv.dfE);
        html+=stCard('N',modPrv.n,'');
        html+='</div>';
        // Interaction significance
        var intSig=parseFloat(modPrv.interaction.p)<0.05;
        html+='<div class="notice-box '+(intSig?'notice-ok':'notice-err')+'">';
        html+='Interaction ('+escHtml(aState.modX)+'×'+escHtml(aState.modW)+'): <b style="color:'+(intSig?'var(--ok)':'var(--err)')+'">b='+modPrv.interaction.b+', t='+modPrv.interaction.t+', p='+modPrv.interaction.p_fmt+'</b>';
        html+=(intSig?' ✓ Significant moderation detected':' ✗ Moderation not significant')+'. ΔR²='+modPrv.deltaR2+'</div>';
        html+='</div>';
      }
      if(modPrv&&modPrv._err) html+='<div class="notice-box notice-err" style="margin-top:8px">'+escHtml(modPrv.msg)+'</div>';
      html+='</div>';

      // Interaction plot
      html+='<div class="card"><div class="sec-hd">Interaction Plot</div>';
      if(modPrv&&!modPrv._err){
        html+=svgModerationPlot(modPrv,aState.modX,aState.modW,aState.modY);
        html+='<div style="margin-top:12px"><div class="sec-hd-sub">Coefficient Table</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th>Variable</th><th style="text-align:right">b</th><th style="text-align:right">SE</th><th style="text-align:right">β</th><th style="text-align:right">t</th><th style="text-align:right">p</th></tr></thead><tbody>';
        modPrv.coefs.forEach(function(c){
          html+='<tr><td class="td-label">'+escHtml(c.name)+'</td><td class="td-num">'+c.b+'</td><td class="td-num">'+c.SE+'</td><td class="td-num">'+c.beta+'</td><td class="td-num">'+c.t+'</td><td class="td-num"><span class="tag '+(parseFloat(c.p)<0.05?'tag-green':'tag-gray')+'">'+c.p_fmt+'</span></td></tr>';
        });
        html+='</tbody></table></div></div>';
      } else {
        html+='<div class="chart-empty">Select X, W, Y and Run to see interaction plot</div>';
      }
      html+='</div></div>';
    }

    else if(currentASub==='simpleslopes'){
      html+='<div class="card"><div class="sec-hd">Simple Slopes Analysis</div>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-bottom:10px;line-height:1.6">Hitung slope X→Y pada tiga level W (Mean−1SD, Mean, Mean+1SD). Simple slope signifikan menunjukkan X berpengaruh pada W level tertentu.</div>';

      if(!modValid){
        html+='<div class="notice-box notice-warn">Pilih X, W, Y di tab Moderation terlebih dahulu.</div>';
      } else if(modPrv&&!modPrv._err){
        var ss=modPrv.simpleSlopes;
        html+='<div class="tbl-wrap"><table><thead><tr><th>W Level</th><th style="text-align:right">W Value</th><th style="text-align:right">Slope (b₁+b₃W)</th><th style="text-align:right">SE</th><th style="text-align:right">t</th><th style="text-align:right">p</th><th style="text-align:right">95% CI</th><th>Sig</th></tr></thead><tbody>';
        ss.forEach(function(s){
          var sSig=parseFloat(s.p)<0.05;
          html+='<tr><td class="td-label" style="font-weight:700">'+escHtml(s.label)+'</td><td class="td-num">'+s.wVal+'</td><td class="td-num" style="color:'+(sSig?'var(--ok)':'var(--ink-muted)')+';font-weight:700">'+s.slope+'</td><td class="td-num">'+s.se+'</td><td class="td-num">'+s.t+'</td><td class="td-num"><span class="tag '+(sSig?'tag-green':'tag-gray')+'">'+s.p_fmt+'</span></td><td class="td-num">'+s.ci95+'</td><td>'+(sSig?'*':'ns')+'</td></tr>';
        });
        html+='</tbody></table></div>';
        html+=svgSimpleSlopesPlot(modPrv,aState.modX,aState.modW,aState.modY);
        html+='<div class="notice-box" style="margin-top:10px">';
        html+='<b style="color:var(--gold-text)">Interpretasi:</b> ';
        var ssSig=ss.filter(function(s){return parseFloat(s.p)<0.05;});
        if(ssSig.length===0) html+='Tidak ada simple slope yang signifikan. X tidak berpengaruh signifikan pada Y di semua level W.';
        else if(ssSig.length===ss.length) html+='Semua simple slopes signifikan. X berpengaruh pada Y di semua level W, tetapi kekuatannya berbeda.';
        else html+='X berpengaruh signifikan pada Y hanya pada beberapa level W: '+ssSig.map(function(s){return escHtml(s.label);}).join(', ')+'.';
        html+='</div>';
      } else if(modPrv&&modPrv._err){
        html+='<div class="notice-box notice-err">'+escHtml(modPrv.msg)+'</div>';
      }
      html+='</div>';
    }

    else if(currentASub==='jn'){
      html+='<div class="card"><div class="sec-hd">Johnson-Neyman Technique (Floodlight Analysis)</div>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-bottom:10px;line-height:1.6">Temukan semua titik (significance region) pada W di mana hubungan X→Y signifikan (p&lt;0.05). Lebih presisi dari simple slopes yang hanya lihat ±1SD.</div>';

      if(!modValid){
        html+='<div class="notice-box notice-warn">Pilih X, W, Y di tab Moderation terlebih dahulu.</div>';
      } else if(modPrv&&!modPrv._err){
        var jn=modPrv.jn;
        html+='<div class="stats-grid2" style="margin-bottom:12px">';
        html+=stCard('JN Point(s)',jn.regions.length>0?jn.regions.map(function(r){return SE.f4(r.value);}).join(', '):'None','W value where p=0.05');
        html+=stCard('% W significant',jn.pctSig+'%','Cases in sig region');
        html+='</div>';
        html+=svgJohnsonNeymanPlot(modPrv,aState.modX,aState.modW,aState.modY);
        if(jn.regions.length>0){
          html+='<div style="margin-top:10px"><div class="tbl-wrap"><table><thead><tr><th>JN Point</th><th style="text-align:right">W Value</th><th>Sig Region</th><th style="text-align:right">% Dataset</th></tr></thead><tbody>';
          jn.regions.forEach(function(r,i){
            html+='<tr><td class="td-label">JN-'+(i+1)+'</td><td class="td-num">'+SE.f4(r.value)+'</td><td style="font-size:11.5px;color:var(--gold-text);font-weight:700">'+escHtml(r.direction)+'</td><td class="td-num">'+r.pct+'%</td></tr>';
          });
          html+='</tbody></table></div></div>';
        }
        html+='<div class="notice-box" style="margin-top:10px">';
        html+='<b style="color:var(--gold-text)">Interpretasi:</b> ';
        if(jn.regions.length===0) html+='Tidak ditemukan Johnson-Neyman point. Hubungan X→Y '+(jn.pctSig>50?'signifikan di seluruh rentang W.':'tidak signifikan di seluruh rentang W.');
        else if(jn.regions.length===1) html+='Johnson-Neyman point pada W='+SE.f4(jn.regions[0].value)+'. Hubungan X→Y signifikan '+escHtml(jn.regions[0].direction)+'.';
        else html+='Terdapat '+jn.regions.length+' titik transisi signifikansi pada rentang W.';
        html+='</div>';
        html+='<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="runModeration()">▶ Run</button>';
      } else if(modPrv&&modPrv._err){
        html+='<div class="notice-box notice-err">'+escHtml(modPrv.msg)+'</div>';
      }
      html+='</div>';
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
    html+='<div class="card"><div class="sec-hd">Bayesian Independent T-Test</div>';
    html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-bottom:11px;line-height:1.6">The Bayes Factor (BF₁₀) quantifies evidence <em>for</em> H₁ relative to H₀. BF₁₀ &gt; 3 = moderate evidence for effect; &lt; 1/3 = evidence for null.</div>';
    html+=mkSelect('bay-v',nF,bV,'aState.bayV=val;renderASub()','Dependent Variable');
    html+='<div style="margin-top:8px">'+mkSelect('bay-g',aF,bG,'aState.bayG=val;renderASub()','Grouping Variable')+'</div>';
    html+='<div style="margin-top:10px">';
    html+='<label class="lbl">Prior scale (r) — Cauchy half-normal width</label>';
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
    if(prv&&!prv._err){
      var bf=parseFloat(prv.BF10);
      var bfCol=bf>3?'var(--ok)':bf>0.333?'var(--warn)':'var(--err)';
      var bfCls=bf>3?'notice-ok':bf>0.333?'notice-warn':'notice-err';
      html+='<div class="notice-box '+bfCls+'" style="margin-top:12px">';
      html+='<div style="font-size:18px;font-weight:700;color:'+bfCol+';font-family:var(--font-serif-stack);font-variant-numeric:tabular-nums">BF₁₀ = '+prv.BF10+'</div>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-top:3px">'+escHtml(prv.interpretation)+'</div>';
      html+='</div>';
      html+='<div class="stats-grid2" style="margin-top:10px">';
      html+=stCard('BF₁₀',prv.BF10,'Evidence ratio');
      html+=stCard('BF₀₁',prv.BF01,'Evidence for null');
      html+=stCard("Cohen's d",prv.cohensD,prv.dInterp);
      html+=stCard('t-statistic',prv.t,'df='+prv.df);
      html+='</div>';
      html+='<div class="notice-box" style="margin-top:8px">';
      html+='<b style="color:var(--gold-text)">Prior:</b> Cauchy(r='+prv.priorScale+') · <b style="color:var(--gold-text)">Tails:</b> '+(bTails===2?'two-tailed':'one-tailed (positive)');
      html+='</div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Group Distributions</div>';
    html+=svgBoxplot(data,bV,bG);
    if(prv&&!prv._err){
      var bf2=parseFloat(prv.BF10);
      var bf2pct=Math.min(100,Math.max(0,bf2>100?100:bf2>10?(60+bf2*0.4):bf2>3?(40+bf2*6.67):bf2>1?(25+bf2*5):bf2*10));
      html+='<div style="margin-top:12px">';
      html+='<div style="font-size:10.5px;color:var(--ink-subtle);margin-bottom:5px;text-transform:uppercase;letter-spacing:1px;font-weight:700">Evidence Scale</div>';
      html+='<div style="position:relative;height:10px;border-radius:var(--r-sm);border:1px solid var(--line-soft);display:flex;overflow:visible">';
      html+='<div style="width:33.3%;height:100%;background:var(--err-bg);border-right:1px solid var(--line-soft)"></div>';
      html+='<div style="width:26.7%;height:100%;background:var(--warn-bg);border-right:1px solid var(--line-soft)"></div>';
      html+='<div style="width:40%;height:100%;background:var(--ok-bg)"></div>';
      html+='<div style="position:absolute;top:-3px;left:'+Math.max(2,Math.min(98,bf2pct))+'%;width:3px;height:14px;background:var(--ink);transform:translateX(-50%)"></div>';
      html+='</div>';
      html+='<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--ink-subtle);margin-top:4px"><span>Strong H₀</span><span>Anecdotal</span><span>Strong H₁</span></div>';
      html+='</div>';
      html+='<div class="notice-box" style="margin-top:10px">';
      html+='<b style="color:var(--gold-text)">BF Interpretation:</b> &lt;1/100 extreme H₀ · 1/30 very strong H₀ · 1/10 strong · 1/3 moderate · 1 no evidence · 3 moderate H₁ · 10 strong · 30 very strong · &gt;100 extreme H₁.';
      html+='</div>';
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
    html+='<div class="card"><div class="sec-hd">Bayesian Correlation</div>';
    html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-bottom:11px;line-height:1.6">Tests H₁: ρ≠0 vs H₀: ρ=0. Uses the Jeffreys–Zellner–Siow prior on the correlation coefficient.</div>';
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
    if(bcPrv&&!bcPrv._err){
      var bfc=parseFloat(bcPrv.BF10);
      var bfcCol=bfc>3?'var(--ok)':bfc>0.333?'var(--warn)':'var(--err)';
      var bfcCls=bfc>3?'notice-ok':bfc>0.333?'notice-warn':'notice-err';
      html+='<div class="notice-box '+bfcCls+'" style="margin-top:12px">';
      html+='<div style="font-size:18px;font-weight:700;color:'+bfcCol+';font-family:var(--font-serif-stack);font-variant-numeric:tabular-nums">BF₁₀ = '+bcPrv.BF10+'</div>';
      html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-top:3px">'+escHtml(bcPrv.interpretation)+'</div>';
      html+='</div>';
      html+='<div class="stats-grid2" style="margin-top:10px">';
      html+=stCard('BF₁₀',bcPrv.BF10,'');
      html+=stCard('BF₀₁',bcPrv.BF01,'');
      html+=stCard('Pearson r',bcPrv.r,'');
      html+=stCard('p-value',bcPrv.p_fmt,'NHST');
      html+='</div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Scatter Plot</div>';
    html+=svgScatter(data,bcX,bcY);
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
    html+='<div class="card"><div class="sec-hd">&#x3B2; Posterior Distribution (Normal-Inverse-Gamma)</div>';
    html+='<div style="font-size:11.5px;color:var(--ink-muted);margin-bottom:11px;line-height:1.6">Bayesian updating of the mean using a Normal-Inverse-Gamma prior. The posterior summarizes our updated belief about μ after observing the data.</div>';
    html+=mkSelect('bp-v',nF,bpV,'aState.bpV=val;renderASub()','Variable');
    html+='<div class="grid2" style="margin-top:10px;gap:8px">';
    html+='<div><label class="lbl">Prior mean (μ₀)</label><input class="inp" type="number" step="any" value="'+bpMu0+'" oninput="aState.bpMu0=parseFloat(this.value)||0;renderASub()"/></div>';
    html+='<div><label class="lbl">Prior precision (κ₀)</label><input class="inp" type="number" step="0.1" min="0.01" value="'+bpKappa+'" oninput="aState.bpKappa=Math.max(0.01,parseFloat(this.value)||1);renderASub()"/></div>';
    html+='<div><label class="lbl">α₀ (shape)</label><input class="inp" type="number" step="0.1" min="0.01" value="'+bpAlpha+'" oninput="aState.bpAlpha=Math.max(0.01,parseFloat(this.value)||0.5);renderASub()"/></div>';
    html+='<div><label class="lbl">β₀ (rate)</label><input class="inp" type="number" step="0.1" min="0.01" value="'+bpBeta+'" oninput="aState.bpBeta=Math.max(0.01,parseFloat(this.value)||0.5);renderASub()"/></div>';
    html+='</div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="runBayesPosterior()">▶ Run</button>';
    if(bpPrv&&!bpPrv._err){
      html+='<div class="stats-grid2" style="margin-top:11px">';
      html+=stCard('Posterior Mean (μ)',bpPrv.postMean,'');
      html+=stCard('95% Credible Interval',bpPrv.hdi95,'HDI');
      html+=stCard('Posterior SD',bpPrv.postSD,'');
      html+=stCard('N',bpPrv.n,'observations');
      html+=stCard('Prior μ₀',bpPrv.priorMu0,'');
      html+=stCard('Posterior κₙ',bpPrv.postKappa,'precision');
      html+='</div>';
      html+='<div class="notice-box" style="margin-top:8px">After observing '+bpPrv.n+' data points, posterior mean = <b style="color:var(--ink)">'+bpPrv.postMean+'</b> with 95% credible interval <b style="color:var(--gold-text)">'+bpPrv.hdi95+'</b>.</div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Prior vs Posterior</div>';
    if(bpPrv&&!bpPrv._err){
      html+=svgBayesPosterior(bpPrv);
    } else {
      html+='<div class="chart-empty">Select variable with ≥3 values</div>';
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

    // LEFT: Settings
    html+='<div>';
    html+='<div class="card"><div class="sec-hd">Time Series Analysis</div>';
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
      html+='</div>';
      html+='<div class="assump" style="margin-top:9px">p: AR lags · d: differencing · q: MA lags.<br>ACF / PACF plot otomatis ditampilkan di kanan setelah variable dipilih.</div>';
      html+='</div>';
    } else {
      html+='<div style="margin-top:10px"><label class="lbl">Seasonal Period</label>';
      html+='<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:5px">';
      [4,7,12,24,52].forEach(function(v){
        html+='<button class="btn btn-sm '+(tsPeriod===v?'btn-active':'btn-ghost')+'" onclick="aState.tsPeriod='+v+';renderASub()">'+v+(v===4?' (Q)':v===7?' (D)':v===12?' (M)':v===24?' (H)':' (W)')+'</button>';
      });
      html+='</div>';
      html+='<div style="margin-top:9px">'+mkCsel('ts-dtype',['additive','multiplicative'],tsDType,'aState.tsDType=val;renderASub()','Model Type')+'</div>';
      html+='<div class="assump" style="margin-top:8px">Additive: Y = T+S+R &nbsp;·&nbsp; Multiplicative: Y = T×S×R.<br>Pilih additive jika amplitudo seasonal konstan.</div>';
      html+='</div>';
    }
    html+='</div>';

    if(tsVals.length>0){
      html+='<div class="card"><div class="sec-hd">Series Statistics</div>';
      html+='<div class="stats-grid2">';
      html+=stCard('N',tsN,'observations');
      html+=stCard('Mean',SE.f4(SE.mean(tsVals)),'');
      html+=stCard('Std Dev',SE.f4(SE.std(tsVals)),'');
      var tsMin=Math.min.apply(null,tsVals),tsMax=Math.max.apply(null,tsVals);
      html+=stCard('Min',SE.f4(tsMin),'');
      html+=stCard('Max',SE.f4(tsMax),'');
      var half2=Math.floor(tsN/2);
      var ts1h=tsVals.slice(0,half2),ts2h=tsVals.slice(half2);
      var std2h=SE.std(ts2h); var vratio=std2h>0?SE.f4(SE.std(ts1h)/std2h):'N/A';
      html+=stCard('Var Ratio',vratio,'1st/2nd half');
      html+='</div>';
      if(tsMod==='arima'&&tsRes&&!tsRes._err){
        html+='<div style="margin-top:10px" class="stats-grid2">';
        html+=stCard('AIC',tsRes.aic,'');
        html+=stCard('BIC',tsRes.bic,'');
        html+=stCard('σ̂',tsRes.sigma,'residual SD');
        html+=stCard('1-step Forecast',tsRes.forecast,'');
        html+='</div>';
        html+='<div class="notice-box" style="margin-top:9px">';
        html+='<b style="color:var(--ink)">ARIMA('+tsP+','+tsD+','+tsQ+')</b><br>';
        if(tsP>0) html+='AR coefs: ['+tsRes.arCoefs.join(', ')+']<br>';
        if(tsQ>0) html+='MA coefs: ['+tsRes.maCoefs.join(', ')+']<br>';
        html+='Forecast: '+tsRes.forecast+' &nbsp;[95% CI: '+tsRes.fc_lo95+' – '+tsRes.fc_hi95+']';
        html+='</div>';
      }
      if(tsMod==='decomp'&&tsRes&&!tsRes._err){
        html+='<div style="margin-top:10px" class="stats-grid2">';
        html+=stCard('Period',tsRes.period,'seasonal');
        html+=stCard('Strength',tsRes.strength,'seasonal');
        html+=stCard('Type',tsRes.type,'model');
        html+=stCard('Rem SD',SE.f4(SE.std(tsRes.remainder.filter(isFinite))),'');
        html+='</div>';
      }
      html+='</div>';
    }

    html+='<button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="runTimeSeries()">▶ Run</button>';
    html+='</div>'; // end left col

    // RIGHT: Charts
    html+='<div>';
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
      html+='<div class="card"><div class="sec-hd">Time Series Plot';
      if(tsMod==='arima'&&tsRes&&!tsRes._err) html+=' <span style="font-size:10px;color:var(--ink-subtle);font-weight:400">(dashed = fitted)</span>';
      html+='</div>'+svgLine+'</div>';
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
        return '<div class="card" style="margin-top:8px"><div class="sec-hd-sub" style="margin-bottom:6px">'+title+' <span style="float:right;font-size:10px;color:var(--ink-subtle);font-weight:400">dashed = 95% CI</span></div>'+sv+'</div>';
      }
      if(tsRes.acf&&tsRes.acf.length>1) html+=svgCorrelogram(tsRes.acf.slice(1),'ACF — differenced series',T.ice);
      if(tsRes.pacf&&tsRes.pacf.length) html+=svgCorrelogram(tsRes.pacf,'PACF — differenced series',T.gold);
      if(tsRes.residACF&&tsRes.residACF.length>1) html+=svgCorrelogram(tsRes.residACF.slice(1),'Residual ACF — should be near zero',T.series[2]||T.primary);
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
        return '<div class="card" style="margin-top:8px"><div class="sec-hd-sub" style="margin-bottom:4px;color:var(--ink)">'+title+'</div>'+sv+'</div>';
      }
      html+=svgDecompLine(tsRes.trend,'Trend',T.ice,80);
      html+=svgDecompLine(tsRes.seasonal,'Seasonal',T.gold,70);
      html+=svgDecompLine(tsRes.remainder,'Remainder (Residual)',T.series[2]||T.primary,70);
    }

    if(tsRes&&tsRes._err){
      html+='<div class="card"><div class="miss-warn">'+escHtml(tsRes._err)+'</div></div>';
    }
    if(!tsV||tsVals.length===0){
      html+='<div class="card"><div class="chart-empty">Pilih variable numerik yang mewakili deret waktu (time-ordered).</div></div>';
    }

    html+='</div>'; // end right col
    html+='</div>'; // end grid2
  return html;
}

function renderMetaanalysisForm(){
  let html='';
    // Initialize state
    if(!aState.metaStudies||!Array.isArray(aState.metaStudies)) aState.metaStudies=[];
    if(!aState.metaModel) aState.metaModel='random';
    if(!aState.metaEffect) aState.metaEffect='d';
    if(!aState.metaNewStudy||typeof aState.metaNewStudy!=='object') aState.metaNewStudy={name:'',yi:'',vi:'',ni:''};

    // Compute meta-analysis
    var metaRes=null;
    if(aState.metaStudies.length>=2){
      try{ metaRes=computeMetaAnalysis(aState.metaStudies,aState.metaModel); }
      catch(e){ metaRes={_err:e.message}; }
    }

    html+='<div class="grid2">';

    // LEFT: Input Panel
    html+='<div>';
    html+='<div class="card"><div class="sec-hd">Model & Effect Size</div>';
    // Model picker
    var metaModelLabel=aState.metaModel==='random'?'Random-Effects':'Fixed-Effect';
    html+='<div style="margin-bottom:10px">';
    html+=mkCsel('meta-model',['Random-Effects','Fixed-Effect'],metaModelLabel,
      'metaSetModel(val)','Model');
    html+='</div>';
    html+='<div style="font-size:11px;color:var(--ink-muted);margin-bottom:10px;line-height:1.55">';
    html+=aState.metaModel==='random'?'<b style="color:var(--ink)">Random-Effects (DerSimonian-Laird):</b> Asumsi effect size berbeda antar studi. Cocok jika ada heterogenitas.':'<b style="color:var(--ink)">Fixed-Effect (Inverse-Variance):</b> Asumsi satu effect size yang sama di semua studi.';
    html+='</div>';
    // Effect type picker
    var metaEffectMap={d:"Cohen's d",r:'Correlation r',or:'Odds Ratio',g:"Hedges' g",other:'Other (yi/vi)'};
    var metaEffectLabel=metaEffectMap[aState.metaEffect]||"Cohen's d";
    var metaEffectOpts=["Cohen's d",'Correlation r','Odds Ratio',"Hedges' g",'Other (yi/vi)'];
    html+=mkCsel('meta-effect',metaEffectOpts,metaEffectLabel,'metaSetEffect(val)','Effect Size');
    html+='</div>';

    // Add Study
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
    html+='</div>';
    html+='<div style="font-size:11px;color:var(--ink-subtle);line-height:1.5">vi = variance effect size = (SE)². Jika punya SE: vi = SE². Jika punya n & SD: vi ≈ 4/n (untuk d).</div>';
    html+='</div></div>';

    // Study List
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
    html+='</div>'; // end study list card
    html+='</div>'; // end left col

    // RIGHT: Live Results + Plots
    html+='<div>';
    if(aState.metaStudies.length<2){
      html+='<div class="card"><div class="chart-empty" style="padding:40px 0;flex-direction:column;gap:10px"><div>Tambah minimal 2 studi untuk melihat hasil meta-analisis.</div></div></div>';
    } else if(metaRes&&metaRes._err){
      html+='<div class="card"><div class="miss-warn">'+escHtml(metaRes._err)+'</div></div>';
    } else if(metaRes){
      // Summary stats
      html+='<div class="card"><div class="sec-hd">Pooled Effect Size</div>';
      html+='<div class="stats-grid2">';
      var psig=metaRes.p<0.05;
      html+=stCard('Pooled '+metaRes.effectLabel,metaRes.pooledEffect,'SE = '+metaRes.se);
      html+=stCard('95% CI','['+metaRes.ci_lo+', '+metaRes.ci_hi+']','');
      html+=stCard('z-score',metaRes.z,'p = '+metaRes.p_fmt);
      html+=stCard('p-value',metaRes.p_fmt,psig?'Signifikan ✓':'Tidak sig ✗');
      html+='</div>';
      html+='<div class="notice-box '+(psig?'notice-ok':'notice-err')+'" style="margin-top:8px"><b style="color:'+(psig?'var(--ok)':'var(--err)')+'">'+(psig?'✓ Efek signifikan':'✗ Efek tidak signifikan')+'</b> — Pooled '+escHtml(metaRes.effectLabel)+' = '+metaRes.pooledEffect+' '+escHtml(metaRes.ci_label)+' ['+metaRes.ci_lo+', '+metaRes.ci_hi+'], z = '+metaRes.z+', p = '+metaRes.p_fmt+'</div>';
      html+='</div>';

      // Heterogeneity
      html+='<div class="card"><div class="sec-hd">Heterogenitas</div>';
      html+='<div class="stats-grid2">';
      html+=stCard('Q statistic',metaRes.Q,'df = '+(aState.metaStudies.length-1)+', p = '+metaRes.Q_p_fmt);
      html+=stCard('I²',metaRes.I2+'%',metaRes.I2label);
      html+=stCard('τ² (tau²)',metaRes.tau2,'Between-study variance');
      html+=stCard('τ (tau)',metaRes.tau,'SD between studies');
      html+='</div>';
      var hColor=metaRes.I2raw<25?'var(--ok)':metaRes.I2raw<50?'var(--warn)':'var(--err)';
      var hCls=metaRes.I2raw>=75?'notice-err':metaRes.I2raw>=50?'notice-warn':'';
      html+='<div class="notice-box '+hCls+'" style="margin-top:8px">';
      html+='<b style="color:'+hColor+'">'+escHtml(metaRes.I2label)+'</b> — ';
      html+='Q('+(aState.metaStudies.length-1)+') = '+metaRes.Q+', p = '+metaRes.Q_p_fmt+'. ';
      html+=metaRes.I2raw<25?'Heterogenitas rendah; studi cukup homogen.':metaRes.I2raw<50?'Heterogenitas sedang; ada variasi antar studi.':metaRes.I2raw<75?'Heterogenitas substansial; pertimbangkan analisis moderator.':'Heterogenitas tinggi; hasil hati-hati diinterpretasi.';
      html+='</div></div>';

      // Forest Plot
      html+='<div class="card"><div class="sec-hd">Forest Plot</div>';
      html+=svgMetaForestPlot(aState.metaStudies,metaRes,aState.metaEffect);
      html+='</div>';

      // Funnel Plot
      html+='<div class="card"><div class="sec-hd">Funnel Plot <span style="font-size:10.5px;font-weight:400;color:var(--ink-subtle)">(uji publication bias)</span></div>';
      html+=svgFunnelPlot(metaRes);
      html+='<div style="font-size:11px;color:var(--ink-subtle);margin-top:6px;line-height:1.55">Funnel plot simetris → tidak ada publication bias. Asimetri → kemungkinan ada bias. Gunakan Egger\'s test untuk konfirmasi.</div>';
      html+='</div>';
    }
    html+='</div>'; // end right col
    html+='</div>'; // end grid2
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
  else if(currentASub==='roc'||currentASub==='roc_compare'){
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
