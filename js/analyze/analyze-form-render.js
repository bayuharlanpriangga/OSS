// ════════════════════════════════════════════════════════════════════════
// ANALYZE — FORM RENDERER (D1, split bertahap dari renderASub() di app.js)
// Tiap fungsi di sini = isi 1 cabang else-if(currentASub===...) di renderASub(),
// dibungkus jadi fungsi berdiri sendiri (pola sama seperti C11/renderMissingDataAnalysis),
// dipanggil balik dari app.js lewat: html+=render<Nama>Form();
// Byte-exact terhadap isi cabang aslinya, kecuali wrapper function + var html lokal + return.
// ════════════════════════════════════════════════════════════════════════

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
    html+='<div class="chart-stack">'+svgHistogram(data,aState.dFld)+'<div style="font-size:10px;color:#64748b;margin:2px 0">Normal Q-Q Plot</div>'+svgQQ(data,aState.dFld)+'</div>';
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
    html+='<div style="font-size:11.5px;color:rgba(232,222,255,.45);margin-bottom:11px;line-height:1.6">Test whether the mean of a variable differs from a specified reference value (μ₀). Example: <em>"Is the average score different from 70?"</em></div>';
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
      html+='<div style="margin-top:8px;padding:8px 10px;background:rgba(124,58,237,.08);border-radius:7px;border:1px solid rgba(124,58,237,.18);font-size:11.5px;color:rgba(232,222,255,.7)">';
      html+='<span style="color:#c084fc;font-weight:700">μ₀ = '+SE.f4(aState.osMu0||0)+'</span>';
      html+='&nbsp;·&nbsp;Sample mean = <span style="color:#f472b6;font-weight:700">'+prv.mean+'</span>';
      html+='&nbsp;·&nbsp;Diff = <span style="color:'+(parseFloat(prv.p_fmt)<.05?'#34d399':'#fbbf24')+';font-weight:700">'+prv.meanDiff+'</span>';
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
    html+='<div style="display:flex;align-items:center;gap:7px;margin-top:4px">';
    // Toggle switch
    html+='<div onclick="aState.avPost=!aState.avPost;renderASub()" style="cursor:pointer;width:34px;height:19px;border-radius:99px;background:'+(aState.avPost?'linear-gradient(135deg,#7c3aed,#db2777)':'rgba(124,58,237,.18)')+';position:relative;flex-shrink:0;transition:background .2s;border:1px solid '+(aState.avPost?'transparent':'rgba(124,58,237,.25)')+'"><div style="position:absolute;top:2px;left:'+(aState.avPost?'16px':'2px')+';width:13px;height:13px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div></div>';
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
      var phHint={'tukey':'Conservative · Controls familywise α · Recommended for most cases',
        'bonferroni':'Very conservative · α divided by # comparisons · Best for few tests',
        'lsd':'Liberal · No familywise correction · Use only when F is significant',
        'holm':'Step-down Bonferroni · More powerful than Bonferroni, same strict α control'}[aState.avPostMethod||'tukey'];
      html+='<div style="margin-top:5px;font-size:10px;color:rgba(232,222,255,.35);padding:0 2px">'+phHint+'</div>';
    }
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runANOVA()">▶ Run</button>';
    if(prv&&!prv._err){
      html+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:11px">'+stCard('F',prv.F)+stCard('p',prv.p_fmt)+stCard('&#x03b7;&#x00b2;',prv.eta2,prv.eta2Interp)+'</div>';
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
    // auto-populate if empty and enough numeric vars
    if(rmVars.length===0&&nF.length>=3) rmVars=nF.slice(0,Math.min(nF.length,3));
    aState.rmVars=rmVars;
    var rmPrv=null;
    if(rmVars.length>=3){
      rmPrv=tryStats(function(){return SE.repeatedMeasuresAnova(rmVars.map(function(v){return SE.validNums(data.map(function(r){return r[v];}));}),rmVars);});
    }
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Repeated Measures ANOVA</div>';
    html+='<div style="font-size:11px;color:rgba(232,222,255,.5);margin-bottom:10px;line-height:1.6">Pilih ≥3 variabel yang mewakili titik waktu berbeda (T1, T2, T3, dst.) dari subjek yang sama.</div>';
    // Dynamic variable slots
    html+='<div id="rm-slots">';
    for(var ri=0;ri<rmVars.length;ri++){
      html+='<div style="display:flex;gap:5px;align-items:center;margin-bottom:5px">';
      html+='<span style="font-size:10px;color:rgba(232,222,255,.35);width:22px;flex-shrink:0">T'+(ri+1)+'</span>';
      html+=mkSelect('rm-v-'+ri,nF,rmVars[ri],'(function(){aState.rmVars['+ri+']=val;renderASub();})()', 'Time point '+(ri+1));
      html+='<button class="btn btn-ghost btn-sm" style="padding:4px 7px;flex-shrink:0" onclick="aState.rmVars.splice('+ri+',1);renderASub()">✕</button>';
      html+='</div>';
    }
    html+='</div>';
    html+='<div style="display:flex;gap:5px;margin-top:5px">';
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
      var rmMeans=rmVars.map(function(v){
        var vals=SE.validNums(data.map(function(r){return r[v];}));
        return vals.length?vals.reduce(function(a,b){return a+b;},0)/vals.length:0;
      });
      var rmMax=Math.max.apply(null,rmMeans);var rmMin=Math.min.apply(null,rmMeans);
      var rmRange=rmMax-rmMin||1;
      var svgW=220,svgH=120,padL=30,padB=20,padT=10,padR=10;
      var plotW=svgW-padL-padR,plotH=svgH-padB-padT;
      var pts=rmVars.map(function(v,i){
        var x=padL+(i/(rmVars.length-1))*plotW;
        var y=padT+plotH-(((rmMeans[i]-rmMin)/rmRange)*plotH*0.85+0.075*plotH);
        return {x:x,y:y,mean:rmMeans[i],label:'T'+(i+1)};
      });
      var polyline=pts.map(function(p){return p.x+','+p.y;}).join(' ');
      var svgStr='<svg viewBox="0 0 '+svgW+' '+svgH+'" style="width:100%;height:auto">';
      svgStr+='<polyline points="'+polyline+'" fill="none" stroke="url(#rmGrad)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
      svgStr+='<defs><linearGradient id="rmGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#34d399"/><stop offset="100%" stop-color="#a78bfa"/></linearGradient></defs>';
      pts.forEach(function(p){
        svgStr+='<circle cx="'+p.x+'" cy="'+p.y+'" r="4" fill="#34d399" opacity="0.9"/>';
        svgStr+='<text x="'+p.x+'" y="'+(svgH-5)+'" text-anchor="middle" font-size="9" fill="rgba(232,222,255,0.5)">'+p.label+'</text>';
        svgStr+='<text x="'+p.x+'" y="'+(p.y-7)+'" text-anchor="middle" font-size="8" fill="#a5f3fc">'+SE.fmt4(p.mean)+'</text>';
      });
      svgStr+='</svg>';
      html+=svgStr;
    } else {
      html+='<div class="chart-empty">Pilih ≥2 titik waktu untuk melihat grafik</div>';
    }
    // Descriptives per time point
    if(rmVars.length>=2&&rmVars.every(function(v){return v&&nF.includes(v);})){
      html+='<div class="tbl-wrap" style="margin-top:10px"><table><thead><tr><th>Titik Waktu</th><th>Variabel</th><th>N</th><th>Mean</th><th>SD</th></tr></thead><tbody>';
      rmVars.forEach(function(v,i){
        var vals=SE.validNums(data.map(function(r){return r[v];}));
        if(!vals.length){html+='<tr><td>T'+(i+1)+'</td><td>'+v+'</td><td colspan="3">—</td></tr>';return;}
        var mean=vals.reduce(function(a,b){return a+b;},0)/vals.length;
        var sd=Math.sqrt(vals.reduce(function(a,b){return a+(b-mean)*(b-mean);},0)/(vals.length-1));
        html+='<tr><td class="td-label">T'+(i+1)+'</td><td class="td-str">'+escHtml(v)+'</td><td class="td-num">'+vals.length+'</td><td class="td-num">'+SE.fmt4(mean)+'</td><td class="td-num">'+SE.fmt4(sd)+'</td></tr>';
      });
      html+='</tbody></table></div>';
    }
    // Mauchly & Post-hoc note
    if(rmPrv&&!rmPrv._err){
      html+='<div class="assump" style="margin-top:10px"><b style="color:#fbbf24">Catatan Sphericity:</b> Mauchly test tidak diimplementasikan. Jika data melanggar sphericity, pertimbangkan koreksi Greenhouse-Geisser di software seperti SPSS.<br><br>';
      if(parseFloat(rmPrv.p)<0.05){
        html+='<b style="color:#34d399">Post-hoc pairwise:</b><br>';
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
    html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:9px;line-height:1.6">Tests main effects of two factors and their interaction (A×B). Requires at least 2 levels per factor.</div>';
    html+=mkSelect('av2-v',nF2,aState.av2V,'aState.av2V=val;renderASub()','Dependent Variable');
    html+='<div style="margin-top:8px">'+mkSelect('av2-a',aF2,aState.av2A,'aState.av2A=val;renderASub()','Factor A')+'</div>';
    html+='<div style="margin-top:8px">'+mkSelect('av2-b',aF2,aState.av2B,'aState.av2B=val;renderASub()','Factor B')+'</div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runANOVA2()">▶ Run</button>';
    if(prv2&&!prv2._err){
      html+='<div style="margin-top:11px">';
      prv2.effects.forEach(function(e){
        var col=e.source.indexOf('×')>=0?'#fbbf24':(e.source===aState.av2A?'#818cf8':'#34d399');
        html+='<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 9px;border-radius:7px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.04);margin-bottom:4px">';
        html+='<span style="font-weight:700;color:'+col+';font-size:12px">'+e.source+'</span>';
        html+='<span style="font-family:monospace;font-size:11px;color:#94a3b8">F('+e.df+','+prv2.error.df+')='+e.F+'</span>';
        html+='<span class="tag '+(e.sig?'tag-green':'tag-gray')+'">p='+e.p_fmt+'</span>';
        html+='</div>';
      });
      html+='</div>';
    }
    if(prv2&&prv2._err) html+='<div style="color:#f87171;font-size:11px;margin-top:8px">'+prv2.msg+'</div>';
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Interaction Plot ('+((aState.av2A)||'A')+'×'+((aState.av2B)||'B')+')</div>';
    if(prv2&&!prv2._err){
      html+=svgInteractionPlot(prv2.cellMeansTable,aState.av2B,aState.av2A,aState.av2V);
    } else {
      html+='<div style="color:#64748b;font-size:11px;padding:20px;text-align:center">Select variables and Run to see interaction plot</div>';
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
    html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:9px;line-height:1.6">Tests 3 main effects + 3 two-way interactions + 1 three-way interaction. Factors A, B, C must be different variables.</div>';
    html+=mkSelect('av3-v',nF3,aState.av3V,'aState.av3V=val;renderASub()','Dependent Variable');
    html+='<div style="margin-top:8px">'+mkSelect('av3-a',aF3,aState.av3A,'aState.av3A=val;renderASub()','Factor A')+'</div>';
    html+='<div style="margin-top:8px">'+mkSelect('av3-b',aF3,aState.av3B,'aState.av3B=val;renderASub()','Factor B')+'</div>';
    html+='<div style="margin-top:8px">'+mkSelect('av3-c',aF3,aState.av3C,'aState.av3C=val;renderASub()','Factor C')+'</div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runANOVA3()">▶ Run</button>';
    if(prv3&&!prv3._err){
      html+='<div style="margin-top:11px">';
      var effectColors={'×':('#fbbf24')};
      prv3.effects.forEach(function(e){
        var col=e.source.split('×').length===3?'#f472b6':e.source.indexOf('×')>=0?'#fbbf24':'#818cf8';
        html+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 9px;border-radius:7px;background:rgba(255,255,255,.022);border:1px solid rgba(255,255,255,.04);margin-bottom:3px">';
        html+='<span style="font-weight:700;color:'+col+';font-size:11px">'+e.source+'</span>';
        html+='<span class="tag '+(e.sig?'tag-green':'tag-gray')+'">p='+e.p_fmt+'</span>';
        html+='</div>';
      });
      html+='</div>';
    }
    if(prv3&&prv3._err) html+='<div style="color:#f87171;font-size:11px;margin-top:8px">'+prv3.msg+'</div>';
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">A×B Interaction Plot</div>';
    if(prv3&&!prv3._err){
      html+=svgInteractionPlot(prv3.cellMeansAB,aState.av3B,aState.av3A,aState.av3V);
      html+='<div style="margin-top:7px;font-size:10px;color:rgba(232,222,255,.3)">Marginal means across Factor C levels (averaged)</div>';
    } else {
      html+='<div style="color:#64748b;font-size:11px;padding:20px;text-align:center">Select variables and Run to see interaction plot</div>';
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
      html+='<div style="margin-top:7px;padding:7px 10px;background:rgba(103,232,249,.05);border-radius:7px;border:1px solid rgba(103,232,249,.15);font-size:10.5px;color:rgba(232,222,255,.5)">Partial r removes the linear influence of Z from both X and Y before computing the correlation.</div>';
      html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runPartialCorr()">▶ Run</button>';
      if(pcPrv&&!pcPrv._err){
        html+='<div class="stats-grid2" style="margin-top:11px">'+stCard('Partial r',pcPrv.rp)+stCard('r²',pcPrv.r2,'Variance explained')+stCard('p',pcPrv.p_fmt)+stCard('95% CI',pcPrv.ci95)+'</div>';
        html+='<div class="row" style="margin-top:8px">'+sigBadge(pcPrv.p)+'<span class="tag tag-gray">'+pcPrv.strength+' '+(parseFloat(pcPrv.rp)>=0?'positive':'negative')+'</span></div>';
        html+='<div style="margin-top:7px;font-size:10.5px;color:rgba(232,222,255,.4)">Zero-order: r(X,Y)='+pcPrv.rxy+' · r(X,Z)='+pcPrv.rxz+' · r(Y,Z)='+pcPrv.ryz+'</div>';
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
      html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:11px">'+stCard('R²',prv.R2,'Variance explained')+stCard('Adj R²',prv.R2adj)+stCard('F',prv.F,'p='+prv.pF_fmt)+stCard('RMSE',prv.RMSE)+'</div>';
      html+='<div class="eq" style="margin-top:9px">Ŷ = '+prv.b0+' + '+prv.b1+' · '+escHtml(aState.regX)+'</div>';
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
      html+='<label style="display:flex;align-items:center;gap:7px;font-size:12px;color:#94a3b8;cursor:pointer;padding:4px 7px;border-radius:7px;background:'+(sel?'rgba(99,102,241,.07)':'transparent')+'"><input type="checkbox" data-fld="'+escHtmlAttr(f)+'" '+(sel?'checked':'')+' onchange="toggleMrXEl(this)" style="accent-color:#818cf8"/>'+escHtml(f)+'</label>';
    });
    html+='</div>';
    html+='<button class="btn btn-primary btn-sm" onclick="runMultipleReg()">▶ Run</button>';
    if(prv&&!prv._err){
      html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:11px">'+stCard('R²',prv.R2,'Variance explained')+stCard('Adj R²',prv.R2adj)+stCard('F',prv.F,'p='+prv.pF_fmt)+stCard('DW',prv.DW,'Ideal 1.5-2.5')+'</div>';
      html+='<div class="row" style="margin-top:8px">'+sigBadge(prv.pF)+'</div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Coefficients</div>';
    if(prv&&!prv._err)html+=mkTable(['Variable','B','SE','β','t','p','VIF'],prv.coefs.map((c,i)=>[escHtml(c.name),c.B,c.SE,i===0?'—':c.beta,c.t,c.p_fmt,i===0?'—':prv.vif[i-1]]));
    else html+='<div style="color:#64748b;font-size:12px;padding:12px">Select ≥1 predictor and run.</div>';
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
    html+='<div class="assump" style="margin-top:11px"><b style="color:#818cf8">When to use:</b><br>· Non-normal distribution (SW p≤.05)<br>· Ordinal data · Small n · Many outliers</div>';
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
    html+='<div style="margin-top:8px"><label class="lbl">New Variable Name</label><input class="inp" value="'+aState.trNewName+'" oninput="aState.trNewName=this.value"/></div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runTransform()"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-1px"><polyline points="20 6 9 17 4 12"/></svg> Apply</button>';
    html+='<div class="assump" style="margin-top:11px">Z-score · Min-Max · Log · Sqrt · Square · Center · Rank</div>';
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Compute Variable</div>';
    html+='<div style="margin-bottom:8px"><label class="lbl">New Variable Name</label><input class="inp" value="'+aState.computeName+'" oninput="aState.computeName=this.value"/></div>';
    html+='<div style="margin-bottom:8px"><label class="lbl">Expression</label><input class="inp" style="font-family:monospace" value="'+aState.computeExpr+'" oninput="aState.computeExpr=this.value" placeholder="e.g. age * 2 + score / 10"/></div>';
    html+='<button class="btn btn-primary btn-sm" onclick="runCompute()"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-1px"><polyline points="20 6 9 17 4 12"/></svg> Apply</button>';
    html+='<div class="assump" style="margin-top:10px">Vars · +−×÷^% · abs/sqrt/log/exp/round/floor/ceil</div>';
    html+='</div></div>';
  return html;
}

function renderHierarchicalRegForm(){
  const nF=numFields();
  let html='';
    // ── Init state ──────────────────────────────────────────────────────
    if(!aState.hrY) aState.hrY = nF[0]||'';
    if(!aState.hrBlocks) aState.hrBlocks = [[],[]]; // Block1, Block2 arrays
    if(!aState.hrBlocks[0]) aState.hrBlocks[0]=[];
    if(!aState.hrBlocks[1]) aState.hrBlocks[1]=[];

    // ── Live preview per block ────────────────────────────────────────────
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

    html += '<div class="card"><div class="sec-hd">Hierarchical Regression <span style="font-size:10px;font-style:normal;color:rgba(232,222,255,.35);margin-left:8px">Bertahap per Block · ΔR² · F-change Test</span></div>';
    html += '<div style="font-size:11.5px;color:rgba(232,222,255,.45);margin-bottom:12px;line-height:1.7">Masukkan prediktor secara bertahap. Setiap Block menambah prediktor dan melaporkan <b style="color:#a5f3fc">ΔR²</b> (perubahan variance) beserta uji F-change signifikansinya.</div>';
    html += '<div class="grid2">';

    // LEFT: setup card
    html += '<div>';

    // DV selector
    html += '<div class="card"><div class="sec-hd" style="margin-bottom:8px">Dependent Variable (Y)</div>';
    html += mkSelect('hr-y', nF, aState.hrY, 'aState.hrY=val;renderASub()', 'Dependent Variable');
    html += '</div>';

    // Block editors
    for(var bi=0; bi<aState.hrBlocks.length; bi++){
      var bNum = bi+1;
      var blockColor = bi===0 ? '#818cf8' : bi===1 ? '#a5f3fc' : bi===2 ? '#f472b6' : '#fbbf24';
      html += '<div class="card" style="border-color:'+blockColor+'30;margin-bottom:8px">';
      html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">';
      html += '<div class="sec-hd" style="margin-bottom:0;color:'+blockColor+'">Block '+bNum+'</div>';
      if(bi >= 2){
        html += '<button class="btn btn-ghost btn-sm" style="padding:3px 8px;font-size:10px" onclick="aState.hrBlocks.splice('+bi+',1);renderASub()">✕ Remove</button>';
      }
      html += '</div>';
      html += '<div style="display:flex;flex-direction:column;gap:3px;max-height:130px;overflow-y:auto">';
      var blockedAll = [];
      for(var ci=0;ci<aState.hrBlocks.length;ci++) if(ci!==bi) aState.hrBlocks[ci].forEach(function(v){blockedAll.push(v);});
      nF.filter(function(f){return f!==aState.hrY;}).forEach(function(f){
        var sel = aState.hrBlocks[bi].includes(f);
        var usedElsewhere = blockedAll.includes(f);
        html += '<label style="display:flex;align-items:center;gap:7px;font-size:12px;cursor:pointer;padding:3px 7px;border-radius:7px;'
          +(sel?'background:rgba(99,102,241,.1);color:#a5b4fc;':'color:'+(usedElsewhere?'rgba(232,222,255,.25)':'rgba(232,222,255,.5)')+'')
          +(usedElsewhere&&!sel?';pointer-events:none;opacity:.4':'')
          +'">';
        html += '<input type="checkbox" '+(sel?'checked':'')+(usedElsewhere&&!sel?' disabled':'')
          +' onchange="toggleHrBlock('+bi+',\''+f+'\',this.checked)" style="accent-color:'+blockColor+'"/>'+f;
        if(usedElsewhere && !sel) html += ' <span style="font-size:9px;color:#64748b">(Block '+(blockedAll.indexOf(f)+1)+')</span>';
        html += '</label>';
      });
      html += '</div>';
      // Live preview summary for this block
      if(hrPrvs[bi] && !hrPrvs[bi]._err){
        var bp = hrPrvs[bi];
        var dR2 = bi===0 ? parseFloat(bp.R2) : parseFloat(bp.R2) - (hrPrvs[bi-1]&&!hrPrvs[bi-1]._err?parseFloat(hrPrvs[bi-1].R2):0);
        html += '<div style="margin-top:7px;padding:6px 9px;background:rgba(165,243,252,.05);border:1px solid rgba(165,243,252,.12);border-radius:7px;font-size:11px;display:flex;gap:10px;flex-wrap:wrap">';
        html += '<span style="color:'+blockColor+'">R²=<b>'+bp.R2+'</b></span>';
        html += '<span style="color:rgba(232,222,255,.5)">Adj R²='+bp.R2adj+'</span>';
        if(bi>0) html += '<span style="color:#a5f3fc">ΔR²=<b>'+dR2.toFixed(4)+'</b></span>';
        html += '</div>';
      }
      html += '</div>';
    }

    // Add block button
    if(aState.hrBlocks.length < 5){
      html += '<button class="btn btn-ghost btn-sm" onclick="aState.hrBlocks.push([]);renderASub()" style="width:100%;justify-content:center;margin-bottom:8px">+ Add Block '+(aState.hrBlocks.length+1)+'</button>';
    }

    // Run button
    html += '<button class="btn btn-primary btn-sm"  onclick="runHierarchicalReg()">▶ Run</button>';
    html += '</div>';

    // RIGHT: ΔR² summary card
    html += '<div>';
    html += '<div class="card"><div class="sec-hd">Model Summary & ΔR²</div>';
    if(hrPrvs.some(function(p){return p&&!p._err;})){
      html += '<div class="tbl-wrap"><table><thead><tr>';
      ['Block','Predictors','R²','Adj R²','ΔR²','F-change','df1','df2','p ΔR²'].forEach(function(h){html+='<th>'+h+'</th>';});
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
        var blockColor2 = bi===0?'#818cf8':bi===1?'#a5f3fc':bi===2?'#f472b6':'#fbbf24';
        var sig = pFchange < 0.05;
        html += '<tr>';
        html += '<td class="td-label" style="color:'+blockColor2+';font-weight:700">Block '+(bi+1)+'</td>';
        html += '<td style="font-size:10.5px;color:#94a3b8">'+aState.hrBlocks[bi].join(', ')+'</td>';
        html += '<td class="td-num" style="color:#e8deff;font-weight:700">'+bp.R2+'</td>';
        html += '<td class="td-num">'+bp.R2adj+'</td>';
        html += '<td class="td-num" style="color:#a5f3fc;font-weight:700">'+dR2.toFixed(4)+'</td>';
        html += '<td class="td-num">'+Fchange.toFixed(3)+'</td>';
        html += '<td class="td-num">'+kNew+'</td>';
        html += '<td class="td-num">'+dfErr+'</td>';
        html += '<td class="td-num">'+(sig?'<b style="color:#34d399">':'<span style="color:#94a3b8">')+SE.f4(pFchange)+(sig?'</b>':'</span>')+'</td>';
        html += '</tr>';
        prevR2 = parseFloat(bp.R2);
        prevN = n;
      }
      html += '</tbody></table></div>';
    } else {
      html += '<div style="color:#64748b;font-size:12px;padding:20px;text-align:center">Tambah prediktor ke setiap Block dan klik Run untuk melihat tabel ΔR².</div>';
    }
    html += '</div>';

    // Coefficient card per block
    for(var bi=0;bi<aState.hrBlocks.length;bi++){
      if(!hrPrvs[bi]||hrPrvs[bi]._err) continue;
      var bp = hrPrvs[bi];
      var blockColor3 = bi===0?'#818cf8':bi===1?'#a5f3fc':bi===2?'#f472b6':'#fbbf24';
      html += '<div class="card"><div class="sec-hd" style="color:'+blockColor3+'">Block '+(bi+1)+' Coefficients</div>';
      html += mkTable(['Variable','B','SE','β','t','p','VIF'],
        bp.coefs.map(function(c,ci){return[c.name,c.B,c.SE,ci===0?'—':c.beta,c.t,c.p_fmt,ci===0?'—':bp.vif[ci-1]];}));
      html += '</div>';
    }
    html += '</div>'; // end right col
    html += '</div></div>'; // end grid2, card
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
      lgCats.slice(0,8).forEach(function(c){html+='<span class="tag '+catColor+'">'+c+'</span>';});
      if(lgCats.length>8) html+='<span class="tag tag-gray">+'+( lgCats.length-8)+' more</span>';
      html+='</div>';
      if(lgType==='binary'&&lgCats.length!==2){
        html+='<div class="miss-warn" style="margin-top:6px">'+IC.warn+' Binary mode butuh tepat 2 kategori. DV ini punya '+lgCats.length+'.</div>';
      }
      if(lgType==='multinomial'&&lgCats.length<3){
        html+='<div class="miss-warn" style="margin-top:6px">'+IC.warn+' Multinomial butuh ≥3 kategori.</div>';
      }
    }
    // Predictors
    html+='<label class="lbl" style="margin-top:10px;margin-bottom:5px">Predictors (X — Numerik):</label>';
    html+='<div style="display:flex;flex-direction:column;gap:3px;max-height:160px;overflow-y:auto;margin-bottom:10px">';
    nF.filter(function(f){return f!==lgY;}).forEach(function(f){
      var sel=lgXs.includes(f);
      html+='<label style="display:flex;align-items:center;gap:7px;font-size:12px;color:#94a3b8;cursor:pointer;padding:4px 7px;border-radius:7px;background:'+(sel?'rgba(251,146,60,.07)':'transparent')+'"><input type="checkbox" data-lgf="'+f+'" '+(sel?'checked':'')+' onchange="toggleLgX(this)" style="accent-color:#fb923c"/>'+f+'</label>';
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
      if(lgType==='binary') html+='<div style="margin-top:7px;font-size:10.5px;color:rgba(232,222,255,.4)">Reference: "'+lgCats[0]+'" · Predicted: "'+lgCats[lgCats.length-1]+'"</div>';
    } else if(lgPrv&&lgPrv._err){
      html+='<div style="color:#f87171;font-size:11px;margin-top:8px">'+lgPrv.msg+'</div>';
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
        html+='<div class="tbl-wrap"><table><thead><tr><th></th><th>Pred. "'+lgPrv.cats[0]+'"</th><th>Pred. "'+lgPrv.cats[1]+'"</th><th>Correct</th></tr></thead><tbody>';
        html+='<tr><td class="td-label">Act. "'+lgPrv.cats[0]+'"</td><td class="td-num">'+lgPrv.cm[0][0]+'</td><td class="td-num">'+lgPrv.cm[0][1]+'</td><td class="td-num">'+SE.f1(lgPrv.cm[0][0]/(lgPrv.cm[0][0]+lgPrv.cm[0][1]+0.001)*100)+'%</td></tr>';
        html+='<tr><td class="td-label">Act. "'+lgPrv.cats[1]+'"</td><td class="td-num">'+lgPrv.cm[1][0]+'</td><td class="td-num">'+lgPrv.cm[1][1]+'</td><td class="td-num">'+SE.f1(lgPrv.cm[1][1]/(lgPrv.cm[1][0]+lgPrv.cm[1][1]+0.001)*100)+'%</td></tr>';
        html+='<tr><td class="td-label" style="color:#c084fc">Total</td><td></td><td></td><td class="td-num" style="color:#34d399;font-weight:700">'+lgPrv.accuracy+'%</td></tr>';
        html+='</tbody></table></div>';
        // ROC AUC
        html+='<div style="margin-top:8px;font-size:11.5px;color:rgba(232,222,255,.6)">AUC = <span style="color:#34d399;font-weight:700">'+lgPrv.auc+'</span> &nbsp;'+( parseFloat(lgPrv.auc)>=0.9?'<span class="tag tag-green">Excellent</span>':parseFloat(lgPrv.auc)>=0.8?'<span class="tag tag-blue">Good</span>':parseFloat(lgPrv.auc)>=0.7?'<span class="tag tag-yellow">Fair</span>':'<span class="tag tag-red">Poor</span>')+'</div>';
      } else {
        // Multinomial: one table per category vs reference
        lgPrv.categories.forEach(function(cat,ci){
          if(ci===0) return; // reference
          html+='<div style="margin-bottom:8px;font-size:11px;color:#fb923c;font-weight:700">vs. Reference: "'+lgPrv.categories[0]+'" → Predict: "'+cat+'"</div>';
          html+='<div class="tbl-wrap">'+mkTable(
            ['Variable','B','SE','Wald','p','OR','95% CI OR'],
            lgPrv.coefs[ci-1].map(function(c){
              return[c.name,c.B,c.SE,c.wald,c.p_fmt,c.OR,c.ci_or];
            })
          )+'</div>';
        });
        html+='<div style="margin-top:8px;font-size:11px;color:rgba(232,222,255,.4)">Overall Accuracy: '+lgPrv.accuracy+'%</div>';
      }
      // Assumptions note
      html+='<div class="assump" style="margin-top:11px"><b style="color:#fb923c">Asumsi Logistic Regression:</b><br>· DV harus kategorikal · Observasi independen · Tidak ada multikolinearitas ekstrem · Sampel cukup (≥10 per prediktor per kategori)<br><br><b style="color:#818cf8">Interpretasi OR:</b> OR &gt; 1 = peningkatan odds, OR &lt; 1 = penurunan odds, OR = 1 = tidak ada efek.</div>';
    } else {
      html+='<div style="color:#64748b;font-size:12px;padding:16px;text-align:center">Pilih DV kategorikal dan minimal 1 prediktor numerik, lalu klik Run.</div>';
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
      html+='<label style="display:flex;align-items:center;gap:7px;font-size:12px;color:#94a3b8;cursor:pointer;padding:4px 7px;border-radius:7px;background:'+(sel?'rgba(99,102,241,.07)':'transparent')+'"><input type="checkbox" data-fld="'+escHtmlAttr(f)+'" '+(sel?'checked':'')+' onchange="toggleAlphaVarEl(this)" style="accent-color:#818cf8"/>'+escHtml(f)+'</label>';
    });
    html+='</div>';
    html+='<button class="btn btn-primary btn-sm" onclick="runAlpha()">▶ Run</button>';
    if(aRes&&!aRes._err){
      html+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:11px">'+stCard('Cronbach α',aRes.alpha,aRes.interp)+stCard('Items k',aRes.k)+stCard('Cases n',aRes.n)+'</div>';
      html+='<div class="row" style="margin-top:8px"><span class="tag '+(parseFloat(aRes.alpha)>=.7?'tag-green':'tag-red')+'">'+aRes.interp+'</span></div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Interpretation</div>';
    [['≥.90','Excellent','tag-green'],['≥.80','Good','tag-blue'],['≥.70','Acceptable','tag-purple'],['≥.60','Questionable','tag-yellow'],['≥.50','Poor','tag-orange'],['<.50','Unacceptable','tag-red']].forEach(([rng,lbl,cls])=>{
      html+='<div style="display:flex;align-items:center;gap:9px;padding:6px 10px;background:rgba(255,255,255,.018);border-radius:7px;border:1px solid rgba(255,255,255,.04);margin-bottom:4px"><span style="font-family:monospace;font-size:11px;color:#94a3b8;width:40px">'+rng+'</span><span class="tag '+cls+'">'+escHtml(lbl)+'</span></div>';
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
    html+='<div class="assump" style="margin-bottom:10px"><b style="color:#818cf8">What it measures:</b> Agreement between two raters beyond chance. κ=0 = chance, κ=1 = perfect agreement.</div>';
    html+=mkSelect('kap-r1',aF2,aState.kappaR1,'aState.kappaR1=val;renderASub()','Rater 1 / Observer 1');
    html+='<div style="margin-top:8px">'+mkSelect('kap-r2',aF2,aState.kappaR2,'aState.kappaR2=val;renderASub()','Rater 2 / Observer 2')+'</div>';
    html+='<label style="display:flex;align-items:center;gap:8px;margin-top:10px;font-size:12px;color:#94a3b8;cursor:pointer"><input type="checkbox" '+(aState.kappaWeighted?'checked':'')+' onchange="aState.kappaWeighted=this.checked;renderASub()" style="accent-color:#818cf8"/> Weighted Kappa (ordinal data)</label>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runKappa()">▶ Run</button>';
    // Live preview
    if(aState.kappaR1&&aState.kappaR2&&aState.kappaR1!==aState.kappaR2){
      var kR1=data.map(function(r){return r[aState.kappaR1];}).filter(function(v){return v!==null&&v!==undefined&&String(v).trim()!=='';});
      var kR2=data.map(function(r,i){
        if(data[i][aState.kappaR1]===null||data[i][aState.kappaR1]===undefined||String(data[i][aState.kappaR1]).trim()==='') return null;
        return data[i][aState.kappaR2];
      }).filter(function(v){return v!==null&&v!==undefined&&String(v).trim()!=='';});
      // Paired filtering
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
          html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:11px">';
          html+=stCard("Cohen's κ",kRes.kappa,kRes.interp);
          html+=stCard('Cases n',kRes.n);
          html+='</div>';
          html+='<div class="row" style="margin-top:6px">';
          var kv=parseFloat(kRes.kappa);
          var kCls=kv>=0.8?'tag-green':kv>=0.6?'tag-blue':kv>=0.4?'tag-purple':kv>=0.2?'tag-yellow':'tag-red';
          html+='<span class="tag '+kCls+'">'+kRes.interp+'</span>';
          html+='<span class="tag tag-blue">p'+kRes.pFmt+'</span>';
          html+='<span class="tag tag-purple">95% CI ['+kRes.ci95lo+', '+kRes.ci95hi+']</span>';
          html+='</div>';
          if(aState.kappaWeighted&&kRes.wKappa!==null){
            html+='<div style="margin-top:6px;font-size:11px;color:#94a3b8">Weighted κ = <b style="color:#e8deff">'+kRes.wKappa+'</b> ('+kRes.interpW+')</div>';
          }
        } else if(kRes&&kRes._err){
          html+='<div class="assump" style="margin-top:8px;color:#f87171">'+kRes.msg+'</div>';
        }
      }
    }
    html+='</div>';
    // ── Interpretation card ──
    html+='<div class="card"><div class="sec-hd">Interpretation (Landis & Koch 1977)</div>';
    [['< 0','Poor (below chance)','tag-red'],['0.00–0.20','Slight','tag-orange'],['0.21–0.40','Fair','tag-yellow'],['0.41–0.60','Moderate','tag-purple'],['0.61–0.80','Substantial','tag-blue'],['0.81–1.00','Almost Perfect','tag-green']].forEach(function(row){
      html+='<div style="display:flex;align-items:center;gap:9px;padding:6px 10px;background:rgba(255,255,255,.018);border-radius:7px;border:1px solid rgba(255,255,255,.04);margin-bottom:4px"><span style="font-family:monospace;font-size:11px;color:#94a3b8;width:80px">'+row[0]+'</span><span class="tag '+row[2]+'">'+row[1]+'</span></div>';
    });
    html+='<div class="assump" style="margin-top:10px"><b style="color:#818cf8">vs Cronbach α:</b><br>Cronbach α = internal consistency of a scale (same construct, multiple items).<br>Cohen κ = agreement between independent raters/coders (different judges, same items).</div>';
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
    html+='<div class="card"><div class="tbl-wrap"><table><thead><tr><th style="color:#818cf8">'+escHtml(aState.ctRow)+' \\ '+escHtml(aState.ctCol)+'</th>';
    ctCols.forEach(c=>html+='<th>'+escHtml(c)+'</th>');html+='<th>Total</th></tr></thead><tbody>';
    ctRows.forEach((rv,ri)=>{
      html+='<tr class="'+(ri%2?'':'alt')+'"><td class="td-label" style="color:#818cf8">'+escHtml(rv)+'</td>';
      ctCols.forEach((cv,ci)=>{const f=ctMat[ri][ci],pct=((f/ctN)*100).toFixed(1);const exp=chi&&chi.exp?chi.exp[ri][ci]:null;
        html+='<td><div style="font-weight:700">'+f+'</div><div style="font-size:9px;color:#64748b">'+pct+'%'+(exp?' (E='+exp.toFixed(1)+')':'')+'</div></td>';});
      html+='<td style="font-weight:700;color:#94a3b8">'+ctRT[ri]+'</td></tr>';
    });
    html+='<tr style="background:rgba(255,255,255,.02)"><td class="td-label">Total</td>';
    ctCT.forEach(v=>html+='<td style="font-weight:700;color:#94a3b8">'+v+'</td>');
    html+='<td style="font-weight:800;color:#c7d2fe">'+ctN+'</td></tr>';
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
    html+='<div style="margin-top:8px"><label class="lbl">New Variable Name</label><input class="inp" value="'+aState.recodeNewName+'" oninput="aState.recodeNewName=this.value"/></div>';
    if(aState.recodeType==='binary'){
      html+='<div class="row" style="gap:7px;margin-top:8px;margin-bottom:9px"><div style="flex:1"><label class="lbl">Value → 0</label><input class="inp" id="rc-val0" placeholder="e.g. Male"/></div><div style="flex:1"><label class="lbl">Value → 1</label><input class="inp" id="rc-val1" placeholder="e.g. Female"/></div></div>';
      html+='<button class="btn btn-primary btn-sm" onclick="runRecodeBinary()"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-1px"><polyline points="20 6 9 17 4 12"/></svg> Apply</button>';
    } else if(aState.recodeType==='exact'){
      html+='<div style="max-height:180px;overflow-y:auto;margin:9px 0">';
      html+='<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:4px;font-size:10px;color:#64748b;margin-bottom:3px"><span>Original</span><span></span><span>New Value</span></div>';
      rcUniq.forEach((v,i)=>html+='<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:4px;align-items:center;margin-bottom:4px"><div style="padding:5px 8px;background:rgba(255,255,255,.04);border-radius:6px;font-size:11.5px">'+v+'</div><span style="color:#64748b">→</span><input class="inp" style="padding:5px 8px;font-size:11.5px" id="rc-exact-'+i+'" placeholder="new"/></div>');
      html+='</div><button class="btn btn-primary btn-sm" onclick="runRecodeExact('+JSON.stringify(rcUniq)+')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-1px"><polyline points="20 6 9 17 4 12"/></svg> Apply</button>';
    } else {
      html+='<div style="margin:9px 0">';
      for(let i=0;i<3;i++)html+='<div style="display:grid;grid-template-columns:1fr auto 1fr auto 1fr;gap:4px;align-items:center;margin-bottom:5px"><input class="inp" id="rc-from-'+i+'" placeholder="From" style="font-size:11px;padding:5px 8px"/><span style="color:#64748b">–</span><input class="inp" id="rc-to-'+i+'" placeholder="To" style="font-size:11px;padding:5px 8px"/><span style="color:#64748b">→</span><input class="inp" id="rc-new-'+i+'" placeholder="Label" style="font-size:11px;padding:5px 8px"/></div>';
      html+='</div><button class="btn btn-primary btn-sm" onclick="runRecodeRange(3)"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-1px"><polyline points="20 6 9 17 4 12"/></svg> Apply</button>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Preview</div>';
    const rcV=SE.validNums(data.map(r=>r[aState.recodeFld]));
    if(rcV.length)html+='<div class="stats-grid2">'+stCard('Min',Math.min(...rcV).toFixed(2))+stCard('Max',Math.max(...rcV).toFixed(2))+stCard('Mean',SE.mean(rcV).toFixed(2))+stCard('N Valid',rcV.length)+'</div>';
    html+='<div style="margin-top:9px;font-size:11px;color:#64748b">'+rcUniq.length+' unique values</div>';
    html+='</div></div>';
  return html;
}

function renderFilterForm(){
  let html='';
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Filter Cases</div>';
    html+='<div style="margin-bottom:9px"><label class="lbl">Filter Expression</label><input class="inp" style="font-family:monospace" value="'+aState.filterExpr+'" oninput="aState.filterExpr=this.value" placeholder="e.g. age > 25"/></div>';
    html+='<div class="assump" style="margin-bottom:11px"><b style="color:#818cf8">Syntax:</b><br><code style="color:#60a5fa">age > 25</code> · <code style="color:#60a5fa">gender == Male</code><br><code style="color:#60a5fa">score >= 70 && age < 35</code></div>';
    html+='<div class="row" style="gap:8px"><button class="btn btn-primary btn-sm" onclick="applyFilter()">▶ Run</button>';
    if(aState.filterActive)html+='<button class="btn btn-red btn-sm" onclick="clearFilter()">✕ Clear</button>';
    html+='</div>';
    if(aState.filterActive)html+='<div style="margin-top:9px;padding:7px 11px;background:rgba(251,191,36,.06);border-radius:8px;font-size:11.5px;color:#fbbf24">Active: '+aState.filterExpr+' ('+data.length+' rows)</div>';
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Quick Filters</div>';
    html+='<div style="display:flex;flex-direction:column;gap:6px">';
    [['Complete cases only','completeCases()'],['Remove outliers (IQR)','removeOutlierFilter()']].forEach(([l,fn])=>
      html+='<button class="btn btn-ghost btn-sm" style="text-align:left;justify-content:flex-start" onclick="'+fn+'">'+l+'</button>');
    html+='</div>';
    html+='<div style="margin-top:12px;font-size:11.5px;color:#64748b">Total rows: '+data.length+'<br>With any missing: '+data.filter(r=>vars.some(v=>isMiss(r[v.name]))).length+'</div>';
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

    // ── Left: Setup ──
    html+='<div class="card">';
    html+='<div class="sec-hd">⚖ Weight Cases</div>';
    html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:13px;line-height:1.65">Pembobotan frekuensi virtual: data asli tetap ringkas, tapi semua kalkulasi statistik memperlakukan setiap baris seolah direplikasi sebanyak nilai variabel bobot. Berguna untuk data agregat (frequency table, crosstab) dan survei berbobot.</div>';

    // Active status banner
    if(aState.wcActive){
      html+='<div style="padding:9px 12px;border-radius:8px;background:rgba(251,146,60,.1);border:1px solid rgba(251,146,60,.35);margin-bottom:12px;display:flex;align-items:center;gap:9px">';
      html+='<span style="font-size:16px">⚖</span>';
      html+='<div style="flex:1"><div style="font-size:12px;font-weight:700;color:#fb923c">Weight Cases AKTIF</div>';
      html+='<div style="font-size:10.5px;color:rgba(232,222,255,.5);margin-top:1px">Variabel bobot: <b style="color:#fbbf24">'+aState.wcVar+'</b> · N efektif (ΣW): <b style="color:#34d399">'+getNEff()+'</b> · Baris asli: '+data.length+'</div></div>';
      html+='<button class="btn btn-red btn-sm" onclick="clearWeightCases()">✕ Off</button>';
      html+='</div>';
    }

    // Variable selector
    html+='<div style="margin-bottom:10px">';
    html+=mkSelect('wc-var',wcNF,aState.wcVar,'aState.wcVar=val;renderASub()','Variabel Bobot (Frequency Weight)');
    html+='</div>';

    // Method explanation
    html+='<div class="assump" style="margin-bottom:12px">';
    html+='<b style="color:#fb923c">Cara kerja:</b><br>';
    html+='Setiap baris dengan bobot <b style="color:#fbbf24">w</b> diperlakukan seperti <b style="color:#fbbf24">w</b> baris identik. ';
    html+='Baris dengan bobot ≤ 0 atau missing dikecualikan. ';
    html+='Nilai bobot desimal dibulatkan ke integer terdekat.<br><br>';
    html+='<b style="color:#67e8f9">Contoh:</b> Baris dengan <code style="color:#a5f3fc">frekuensi=5</code> → diexpand jadi 5 baris — memungkinkan SPSS-like weighted analysis.';
    html+='</div>';

    // Buttons
    html+='<div class="row" style="gap:7px">';
    html+='<button class="btn btn-primary btn-sm" onclick="runWeightCases()" '+(wcVar?'':'disabled')+'>▶ Run</button>';
    if(aState.wcActive)html+='<button class="btn btn-ghost btn-sm" onclick="clearWeightCases()">✕ Turn Off</button>';
    html+='</div>';
    html+='</div>';

    // ── Right: Preview ──
    html+='<div class="card"><div class="sec-hd">Preview & Diagnostics</div>';
    if(wcPreview){
      html+='<div class="stats-grid2" style="margin-bottom:12px">';
      html+=stCard('N Baris (raw)',data.length,'sebelum weighting');
      html+=stCard('N Efektif (∑w)',wcPreview.expandedN,'setelah weighting');
      html+=stCard('Min Weight',wcPreview.min,'');
      html+=stCard('Max Weight',wcPreview.max,'');
      html+='</div>';

      // Warning cards
      if(wcPreview.nZero>0){
        html+='<div class="miss-warn" style="margin-bottom:7px"><span>⚠</span><span>'+wcPreview.nZero+' baris dengan bobot = 0 (akan dikecualikan dari analisis)</span></div>';
      }
      if(wcPreview.nNeg>0){
        html+='<div style="padding:7px 11px;background:rgba(220,38,38,.08);border:1px solid rgba(220,38,38,.2);border-radius:8px;font-size:11.5px;color:#f87171;margin-bottom:7px">✗ '+wcPreview.nNeg+' baris memiliki bobot negatif — akan dikecualikan</div>';
      }
      if(wcPreview.nMiss>0){
        html+='<div class="miss-warn" style="margin-bottom:7px"><span>⚠</span><span>'+wcPreview.nMiss+' baris bobot missing</span></div>';
      }
      if(!wcPreview.isInteger){
        html+='<div class="miss-warn" style="margin-bottom:7px"><span>ℹ</span><span>Bobot desimal terdeteksi — akan dibulatkan ke integer (round). Pertimbangkan untuk menggunakan Integer weights.</span></div>';
      }
      if(wcPreview.nValid===0){
        html+='<div style="color:#f87171;font-size:11.5px;margin-top:8px">✗ Tidak ada baris dengan bobot valid (> 0)</div>';
      } else {
        html+='<div style="margin-top:10px">';
        html+='<div style="font-size:10.5px;font-weight:700;color:#c084fc;margin-bottom:8px">Distribusi Bobot</div>';
        // Mini histogram of weight values (top 10 unique values)
        var wv=data.map(function(r){return Number(r[wcVar]);}).filter(function(v){return isFinite(v)&&v>0;});
        var wMin=Math.min.apply(null,wv),wMax=Math.max.apply(null,wv);
        var wRange=wMax-wMin||1;
        // show simple bar list
        var wFreq={};
        wv.forEach(function(v){var k=Math.round(v);wFreq[k]=(wFreq[k]||0)+1;});
        var wEntries=Object.entries(wFreq).sort(function(a,b){return Number(a[0])-Number(b[0]);}).slice(0,10);
        var wMaxF=Math.max.apply(null,wEntries.map(function(e){return e[1];}));
        wEntries.forEach(function(e){
          var pct=Math.round(e[1]/wMaxF*100);
          html+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">';
          html+='<span style="width:32px;text-align:right;font-size:10.5px;color:#fbbf24;font-family:monospace">'+e[0]+'</span>';
          html+='<div style="flex:1;height:10px;background:rgba(255,255,255,.05);border-radius:2px"><div style="width:'+pct+'%;height:100%;background:linear-gradient(90deg,#fb923c,#f472b6);border-radius:2px"></div></div>';
          html+='<span style="font-size:10px;color:rgba(232,222,255,.4);width:28px">×'+e[1]+'</span>';
          html+='</div>';
        });
        if(wEntries.length===10) html+='<div style="font-size:10px;color:rgba(232,222,255,.3);margin-top:3px">Menampilkan 10 nilai teratas</div>';
        html+='</div>';

        html+='<div style="margin-top:12px;padding:9px 12px;background:rgba(251,146,60,.06);border-radius:8px;border:1px solid rgba(251,146,60,.18)">';
        html+='<div style="font-size:10px;font-weight:700;color:#fb923c;text-transform:uppercase;letter-spacing:.7px;margin-bottom:5px">Ringkasan</div>';
        html+='<div style="font-size:11.5px;color:rgba(232,222,255,.65);line-height:1.7">';
        html+='<b style="color:#e8deff">'+wcPreview.nValid+'</b> baris valid · Bobot ∑ = <b style="color:#fbbf24">'+wcPreview.sum+'</b> · ';
        html+='Setelah weighting: <b style="color:#34d399">N efektif = '+wcPreview.expandedN+'</b>';
        html+='</div>';
        html+='</div>';
      }
    } else {
      html+='<div class="chart-empty">Pilih variabel bobot untuk melihat preview</div>';
      html+='<div style="margin-top:16px;padding:10px 13px;background:rgba(124,58,237,.06);border-radius:8px;border:1px solid rgba(124,58,237,.12)">';
      html+='<div style="font-size:10.5px;font-weight:700;color:#c084fc;margin-bottom:7px">Kapan Weight Cases digunakan?</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.5);line-height:1.75">';
      html+='· Data sudah dalam bentuk <b style="color:#e8deff">frekuensi/tabel</b> (bukan raw data)<br>';
      html+='· Hasil <b style="color:#e8deff">crosstab</b> yang ingin dianalisis lebih lanjut<br>';
      html+='· <b style="color:#e8deff">Survei berbobot</b> dengan sampling weight<br>';
      html+='· Replikasi data berdasarkan frekuensi kategori';
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
      html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="width:65px;font-size:11px;color:#94a3b8;overflow:hidden;text-overflow:ellipsis">'+escHtml(v.name)+'</span><div style="flex:1;height:7px;background:rgba(255,255,255,.055);border-radius:3px"><div style="width:'+pct+'%;height:100%;background:'+(pct>20?'#f87171':pct>5?'#fbbf24':'#34d399')+';border-radius:3px"></div></div><span style="font-size:10px;color:'+(mc>0?'#f87171':'#34d399')+';width:22px;text-align:right">'+mc+'</span></div>';
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
    html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:11px;line-height:1.65">MI membuat M dataset lengkap melalui imputasi iteratif, menganalisis masing-masing, lalu menggabungkan hasil (Rubin\'s Rules) — jauh lebih akurat daripada single imputation untuk riset formal.</div>';

    // Variable selection
    html+='<label class="lbl">Variables to Impute</label>';
    html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin:6px 0 10px">';
    nF.forEach(function(v){
      var mc=data.filter(function(r){return isMiss(r[v]);}).length;
      var sel=(aState.miVars||[]).includes(v);
      var hasMiss=mc>0;
      html+='<label style="display:flex;align-items:center;gap:4px;font-size:11px;cursor:pointer;padding:4px 8px;border-radius:6px;background:'+(sel?'rgba(192,132,252,.15)':'rgba(255,255,255,.03)')+';border:1px solid '+(sel?'rgba(192,132,252,.35)':'rgba(255,255,255,.07)')+';">';
      html+='<input type="checkbox" '+(sel?'checked':'')+' onchange="toggleMIVar(\''+v+'\',this.checked)" style="accent-color:#c084fc"/>';
      html+='<span style="color:'+(sel?'#c084fc':hasMiss?'#fbbf24':'rgba(232,222,255,.5)')+'">'+(hasMiss?'⚠ ':'')+v+(hasMiss?' ('+mc+')':'')+'</span>';
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
      html+='<div class="tbl-wrap"><table><thead><tr><th>Variable</th><th>N Missing</th><th>% Missing</th><th>Method</th></tr></thead><tbody>';
      (aState.miVars||[]).forEach(function(v){
        var mc=data.filter(function(r){return isMiss(r[v]);}).length;
        var pct=(mc/data.length*100).toFixed(1);
        var mthd={'pmm':'PMM','norm':'Bayesian','mice_cart':'CART'}[aState.miMethod]||'PMM';
        var col=parseFloat(pct)>20?'#f87171':parseFloat(pct)>5?'#fbbf24':'#34d399';
        html+='<tr><td class="td-label">'+escHtml(v)+'</td><td class="td-num" style="color:'+col+'">'+mc+'</td><td class="td-num" style="color:'+col+'">'+pct+'%</td><td style="font-size:10.5px;color:#c084fc">'+mthd+'</td></tr>';
      });
      html+='</tbody></table></div></div>';
    }
    html+='</div>';

    // Theory panel
    html+='<div class="card"><div class="sec-hd">📖 MI — Theory & Guidance</div>';
    html+='<div style="display:flex;flex-direction:column;gap:8px">';
    [{col:'#67e8f9',title:'Why MI?',text:'Single imputation (mean/median) underestimates variance and inflates correlations. MI preserves the uncertainty of missing data, producing unbiased estimates.'},{col:'#c084fc',title:'MICE Algorithm',text:'Multiple Imputation by Chained Equations: each variable is imputed by regression on all others, iterated multiple times to achieve convergence.'},{col:'#fbbf24',title:'Rubin\'s Rules',text:'Results from M imputed datasets are combined: β̄ = (1/M)Σβₘ. Variance pools within- and between-imputation variance. Requires M≥5.'},{col:'#34d399',title:'MAR Assumption',text:'MI is valid under Missing At Random (MAR): missingness may depend on observed data but not on the missing values themselves.'}].forEach(function(tip){
      html+='<div style="padding:9px 12px;border-radius:8px;border-left:3px solid '+tip.col+';background:rgba(0,0,0,.12)">';
      html+='<div style="font-size:11px;font-weight:700;color:'+tip.col+';margin-bottom:3px">'+tip.title+'</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.65);line-height:1.55">'+tip.text+'</div>';
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
      html+='<label style="display:inline-flex;align-items:center;gap:5px;font-size:11.5px;color:'+(sel?'#c7d2fe':'#64748b')+';cursor:pointer;padding:4px 9px;border-radius:6px;background:'+(sel?'rgba(99,102,241,.11)':'rgba(255,255,255,.024)')+';border:1px solid '+(sel?'rgba(99,102,241,.28)':'rgba(255,255,255,.055)')+'"><input type="checkbox" data-fld="'+f+'" '+(sel?'checked':'')+' onchange="toggleCMFieldEl(this)" style="accent-color:#818cf8"/>'+f+'</label>';
    });
    html+='</div>'+svgCorrMatrix(data,aState.cmFields)+'<div style="margin-top:7px;font-size:11px;color:#64748b">Blue = positive  ·  Red = negative  ·  Darker = stronger</div></div>';
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
    html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:11px;line-height:1.6">Pearson r antara X dan Y setelah membuang pengaruh linear dari variabel kontrol Z.</div>';
    html+='<label class="lbl">Variable X</label>'+mkSelect('pc-x',nF,aState.pcX,'aState.pcX=val;renderASub()','Variable X');
    html+='<div style="margin-top:8px"><label class="lbl">Variable Y</label>'+mkSelect('pc-y',nF,aState.pcY,'aState.pcY=val;renderASub()','Variable Y')+'</div>';
    html+='<div style="margin-top:8px"><label class="lbl">Control Variable (Z)</label>'+mkSelect('pc-z',nF,aState.pcZ,'aState.pcZ=val;renderASub()','Control Variable Z')+'</div>';
    html+='<div style="margin-top:8px;padding:7px 10px;background:rgba(103,232,249,.05);border-radius:7px;border:1px solid rgba(103,232,249,.15);font-size:10.5px;color:rgba(232,222,255,.45);line-height:1.6">'
      +'<b style="color:#67e8f9">Partial r</b> = korelasi X–Y setelah residualisasi terhadap Z.<br>'
      +'<b style="color:#a5f3fc">Zero-order r</b> = korelasi bivariate tanpa kontrol.</div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runPartialCorr()">▶ Run</button>';
    if(pcPrv&&!pcPrv._err){
      html+='<div class="stats-grid2" style="margin-top:11px">'+stCard('Partial r',pcPrv.rp)+stCard('r²',pcPrv.r2,'Variance explained')+stCard('p',pcPrv.p_fmt)+stCard('95% CI',pcPrv.ci95)+'</div>';
      html+='<div class="row" style="margin-top:8px">'+sigBadge(pcPrv.p)+'<span class="tag tag-gray">'+pcPrv.strength+' '+(parseFloat(pcPrv.rp)>=0?'positive':'negative')+'</span></div>';
      html+='<div style="margin-top:7px;font-size:10.5px;color:rgba(232,222,255,.4)">Zero-order: r(X,Y)='+pcPrv.rxy+' · r(X,Z)='+pcPrv.rxz+' · r(Y,Z)='+pcPrv.ryz+'</div>';
    } else if(pcPrv&&pcPrv._err){
      html+='<div class="assump" style="margin-top:9px;color:#fca5a5">⚠ '+pcPrv._err+'</div>';
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
    html+='<div class="grid2">';
    // Left panel: variable selection
    html+='<div class="card"><div class="sec-hd">Canonical Correlation</div>';
    html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:11px;line-height:1.6">Hubungan antara <b style="color:#f472b6">set variabel X</b> dan <b style="color:#67e8f9">set variabel Y</b> secara simultan. Setara fitur MANOVA correlational di SPSS.</div>';
    html+='<label class="lbl" style="color:#f472b6">Set X (Predictor Variables)</label>';
    html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px;margin-bottom:12px">';
    nF.forEach(function(f){
      const sel=aState.ccaXs.includes(f);
      const disabledY=aState.ccaYs.includes(f);
      html+='<label style="display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:999px;cursor:'+(disabledY?'not-allowed':'pointer')+';font-size:11.5px;opacity:'+(disabledY?'.35':'1')+';'
        +(sel?'background:rgba(244,114,182,.18);color:#f472b6;border:1px solid rgba(244,114,182,.35);':'background:rgba(124,58,237,.06);color:rgba(232,222,255,.45);border:1px solid rgba(124,58,237,.15);')+'\">'
        +'<input type="checkbox" '+(sel?'checked':'')+(disabledY?' disabled':'')+' onchange="toggleCCAField(this,\'x\')" data-fld="'+escHtmlAttr(f)+'" style="accent-color:#f472b6;width:12px;height:12px"/>'+escHtml(f)+'</label>';
    });
    html+='</div>';
    html+='<label class="lbl" style="color:#67e8f9">Set Y (Criterion Variables)</label>';
    html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px;margin-bottom:12px">';
    nF.forEach(function(f){
      const sel=aState.ccaYs.includes(f);
      const disabledX=aState.ccaXs.includes(f);
      html+='<label style="display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:999px;cursor:'+(disabledX?'not-allowed':'pointer')+';font-size:11.5px;opacity:'+(disabledX?'.35':'1')+';'
        +(sel?'background:rgba(103,232,249,.18);color:#67e8f9;border:1px solid rgba(103,232,249,.35);':'background:rgba(124,58,237,.06);color:rgba(232,222,255,.45);border:1px solid rgba(124,58,237,.15);')+'\">'
        +'<input type="checkbox" '+(sel?'checked':'')+(disabledX?' disabled':'')+' onchange="toggleCCAField(this,\'y\')" data-fld="'+escHtmlAttr(f)+'" style="accent-color:#67e8f9;width:12px;height:12px"/>'+escHtml(f)+'</label>';
    });
    html+='</div>';
    html+='<div style="padding:7px 10px;background:rgba(192,132,252,.05);border-radius:7px;border:1px solid rgba(192,132,252,.15);font-size:10.5px;color:rgba(232,222,255,.45);line-height:1.65;margin-bottom:10px">'
      +'<b style="color:#c084fc">Rc</b> = canonical correlation (max korelasi linear antar dua set)<br>'
      +'<b style="color:#c084fc">Wilks\' λ</b> = uji signifikansi tiap fungsi kanonik<br>'
      +'<b style="color:#c084fc">Struktur koefisien</b> = loading tiap variabel ke fungsi kanonik</div>';
    html+='<button class="btn btn-primary btn-sm" onclick="runCCA()" '+(ccaReady?'':'disabled style="opacity:.45"')+'>▶ Run</button>';
    if(ccaPrv&&!ccaPrv._err){
      html+='<div class="stats-grid2" style="margin-top:11px">';
      ccaPrv.tests.slice(0,2).forEach(function(t){
        html+=stCard('Rc'+t.root, t.rc, 'Rc²='+t.rc2+' · '+t.p_fmt+(t.sig?' *':''));
      });
      html+='</div>';
    } else if(ccaPrv&&ccaPrv._err){
      html+='<div class="assump" style="margin-top:9px;color:#fca5a5">⚠ '+escHtml(ccaPrv.msg)+'</div>';
    }
    html+='</div>';
    // Right panel: interpretation guide
    html+='<div class="card"><div class="sec-hd">Panduan Interpretasi</div>';
    html+='<div style="display:flex;flex-direction:column;gap:8px;font-size:11.5px">';
    [
      ['#f472b6','Rc (Canonical r)','Korelasi kanonik untuk setiap fungsi. Mirip r bivariate, tapi antara variate X dan variate Y.'],
      ['#67e8f9','Rc² (Canonical R²)','Proporsi varians yang dipakai bersama kedua set variate. Mirip R² di regresi.'],
      ['#c084fc','Wilks\' Lambda (λ)','Statistik uji: λ = ∏(1−Rc²). Nilai kecil = asosiasi kuat. Diuji dengan chi-square.'],
      ['#fbbf24','Struktur Koefisien','Korelasi setiap variabel asli dengan variate kanonik. Seperti factor loadings — nilai ≥ |.30| dianggap bermakna.'],
      ['#34d399','Jumlah Fungsi','Jumlah canonical functions = min(p, q). Hanya fungsi yang signifikan (p < .05) yang diinterpretasi.']
    ].forEach(function(tip){
      html+='<div style="display:flex;gap:9px;align-items:flex-start;padding:7px 9px;background:rgba(255,255,255,.02);border-radius:7px;border-left:3px solid '+tip[0]+'">'
        +'<div><div style="color:'+tip[0]+';font-weight:700;font-size:11px;margin-bottom:2px">'+tip[1]+'</div>'
        +'<div style="color:rgba(232,222,255,.5);line-height:1.5">'+tip[2]+'</div></div></div>';
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
    var modelLabel = isNB ? 'Negative Binomial Regression' : 'Poisson Regression';
    var modelColor = isNB ? '#fb923c' : '#34d399';
    if(!aState.cntPreds) aState.cntPreds=[];
    // Live preview
    var cntPreview=null;
    if(aState.cntDep&&aState.cntPreds.length){
      try{
        cntPreview = isNB ? SE.negbinReg(aState.cntDep,aState.cntPreds,data) : SE.poissonReg(aState.cntDep,aState.cntPreds,data);
      }catch(e){cntPreview={_err:e.message};}
    }
    html+='<div class="grid2">';
    html+='<div class="card">';
    html+='<div class="sec-hd">'+(isNB?'Negative Binomial':'Poisson')+' Regression</div>';
    html+='<div style="margin-bottom:11px">';
    html+='<label class="lbl">Count / Frequency Variable <span style="color:#67e8f9">(non-negative integers)</span></label>';
    html+=mkSelect('cnt-dep',nF,aState.cntDep,'aState.cntDep=val;if(aState.cntPreds.indexOf(val)>=0){aState.cntPreds=aState.cntPreds.filter(function(x){return x!==val;});}renderASub()','Dependent Variable (count)');
    html+='</div>';
    html+='<div style="margin-bottom:12px">';
    html+='<label class="lbl">Predictor(s) <span style="color:rgba(232,222,255,.35)">— numeric or dummy-coded</span></label>';
    html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px">';
    [...nF,...aF].filter(function(f,i,arr){return arr.indexOf(f)===i;}).forEach(function(f){
      if(f===aState.cntDep) return;
      var sel=aState.cntPreds.includes(f);
      html+='<label style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;cursor:pointer;font-size:12px;'
        +(sel?'background:rgba(52,211,153,.12);color:#34d399;border:1px solid rgba(52,211,153,.3);':'background:rgba(124,58,237,.06);color:rgba(232,222,255,.45);border:1px solid rgba(124,58,237,.15);')
        +'">'
        +'<input type="checkbox" '+(sel?'checked':'')
        +' onchange="toggleCntPred(this.dataset.fld,this.checked)" data-fld="'+escHtmlAttr(f)
        +'" style="accent-color:#34d399;width:13px;height:13px"/>'+escHtml(f)+'</label>';
    });
    html+='</div></div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="'+(isNB?'runNegBinGLM':'runPoissonGLM')+'()">▶ Run</button>';
    html+='</div>';
    // Right panel: quick reference
    html+='<div class="card"><div class="sec-hd">Panduan Model</div>';
    if(!isNB){
      html+='<div class="assump" style="margin-bottom:10px"><b style="color:#34d399">Poisson Regression</b> memodelkan data count/frekuensi yang mengikuti distribusi Poisson (mean = variance). Gunakan ketika data berupa hitungan kejadian (jumlah kasus, frekuensi kunjungan, dll.).<br><br>Link function: <span style="color:#67e8f9;font-family:monospace">log(μ) = Xβ</span><br>Koefisien diinterpretasi sebagai <b style="color:#34d399">Incidence Rate Ratio (IRR = e^β)</b>.</div>';
      html+='<div style="display:flex;flex-direction:column;gap:5px;font-size:11.5px">';
      [
        ['Deviance','Ukuran kesesuaian model (lebih kecil lebih baik)','#67e8f9'],
        ['IRR','e^β — perubahan multiplikatif pada rate per 1 unit prediktor','#34d399'],
        ['Dispersion','Pearson X²/df — jika >> 1 → overdispersion, coba NB','#fbbf24'],
        ["McFadden R²",'Pseudo-R² — analog R² untuk GLM count','#c084fc'],
        ['LR χ²','Likelihood Ratio Test: membandingkan model vs null','#f9a8d4']
      ].forEach(function(r){
        html+='<div style="display:flex;gap:8px;padding:5px 8px;background:rgba(124,58,237,.04);border-radius:6px;border-left:3px solid '+r[2]+'">';
        html+='<span style="color:'+r[2]+';font-weight:700;min-width:85px;flex-shrink:0;font-family:monospace;font-size:11px">'+r[0]+'</span>';
        html+='<span style="color:rgba(232,222,255,.55)">'+r[1]+'</span></div>';
      });
      html+='</div>';
    } else {
      html+='<div class="assump" style="margin-bottom:10px"><b style="color:#fb923c">Negative Binomial Regression</b> adalah ekstensi Poisson yang menangani <b>overdispersion</b> — ketika variance > mean. Parameter dispersi θ (theta) diestimasi dari data.<br><br>Link function: <span style="color:#67e8f9;font-family:monospace">log(μ) = Xβ</span><br>Variance: <span style="color:#fb923c;font-family:monospace">μ + μ²/θ</span><br>IRR = e^β (interpretasi sama dengan Poisson).</div>';
      html+='<div style="display:flex;flex-direction:column;gap:5px;font-size:11.5px">';
      [
        ['θ (theta)','Parameter dispersi — kecil = overdispersion besar','#fb923c'],
        ['IRR','e^β — incidence rate ratio per prediktor','#34d399'],
        ['NB vs Poisson','Jika Poisson dispersion >> 1, NB lebih tepat','#fbbf24'],
        ["McFadden R²",'Pseudo-R² berdasarkan log-likelihood','#c084fc'],
        ['LR χ²','Uji signifikansi keseluruhan model','#f9a8d4']
      ].forEach(function(r){
        html+='<div style="display:flex;gap:8px;padding:5px 8px;background:rgba(124,58,237,.04);border-radius:6px;border-left:3px solid '+r[2]+'">';
        html+='<span style="color:'+r[2]+';font-weight:700;min-width:85px;flex-shrink:0;font-family:monospace;font-size:11px">'+r[0]+'</span>';
        html+='<span style="color:rgba(232,222,255,.55)">'+r[1]+'</span></div>';
      });
      html+='</div>';
    }
    html+='</div></div>';
    // Live preview result
    if(cntPreview&&!cntPreview._err){
      html+='<div class="card"><div class="sec-hd">Preview Koefisien</div>';
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
        html+='<div style="margin-top:8px;padding:8px 11px;background:rgba(251,191,36,.06);border:1px solid rgba(251,191,36,.25);border-radius:7px;font-size:11.5px;color:#fbbf24">';
        cntPreview.warnings.forEach(function(w){html+='⚠ '+w+'<br>';});
        html+='</div>';
      }
      html+='</div>';
    } else if(cntPreview&&cntPreview._err){
      html+='<div class="card"><div style="color:#f87171;font-size:12px">⚠ '+cntPreview._err+'</div></div>';
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

    // ─── UNIVARIATE ───────────────────────────────────────────
    if(aState.glmSubType==='univariate'){
      var glmRes=null;
      if(aState.glmDep&&aState.glmFactors.length){
        try{glmRes=SE.glmUnivariate(data,aState.glmDep,aState.glmFactors,aState.glmCovs);}catch(e){glmRes={_err:e.message};}
      }
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">Model Setup</div>';
      html+='<div style="margin-bottom:10px">';
      html+='<label class="lbl">Dependent Variable <span style="color:#67e8f9">(numeric)</span></label>';
      html+=mkSelect('glm-dep',nF,aState.glmDep,'aState.glmDep=val;renderASub()','Dependent Variable');
      html+='</div>';
      html+='<div style="margin-bottom:10px">';
      html+='<label class="lbl">Fixed Factor(s) <span style="color:rgba(232,222,255,.35)">— categorical grouping variables</span></label>';
      html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px">';
      aF.forEach(function(f){
        if(f===aState.glmDep) return;
        var sel=aState.glmFactors.includes(f);
        html+='<label style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;cursor:pointer;font-size:12px;'
          +(sel?'background:rgba(167,139,250,.18);color:#c084fc;border:1px solid rgba(167,139,250,.3);':'background:rgba(124,58,237,.06);color:rgba(232,222,255,.45);border:1px solid rgba(124,58,237,.15);')
          +'">'
          +'<input type="checkbox" '+(sel?'checked':'')
          +' onchange="toggleGlmFactor(this.dataset.fld,this.checked)" data-fld="'+escHtmlAttr(f)
          +'" style="accent-color:#a78bfa;width:13px;height:13px"/>'+escHtml(f)+'</label>';
      });
      html+='</div></div>';
      html+='<div style="margin-bottom:12px">';
      html+='<label class="lbl">Covariate(s) <span style="color:rgba(232,222,255,.35)">— continuous predictors (optional)</span></label>';
      html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px">';
      nF.forEach(function(f){
        if(f===aState.glmDep) return;
        var sel=aState.glmCovs.includes(f);
        html+='<label style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;cursor:pointer;font-size:12px;'
          +(sel?'background:rgba(103,232,249,.12);color:#67e8f9;border:1px solid rgba(103,232,249,.3);':'background:rgba(124,58,237,.06);color:rgba(232,222,255,.45);border:1px solid rgba(124,58,237,.15);')
          +'">'
          +'<input type="checkbox" '+(sel?'checked':'')
          +' onchange="toggleGlmCov(this.dataset.fld,this.checked)" data-fld="'+escHtmlAttr(f)
          +'" style="accent-color:#67e8f9;width:13px;height:13px"/>'+escHtml(f)+'</label>';
      });
      html+='</div></div>';
      html+='<button class="btn btn-primary btn-sm" onclick="runGLM()">▶ Run</button>';
      html+='</div>';
      html+='<div class="card"><div class="sec-hd">Quick Reference</div>';
      html+='<div class="assump" style="margin-bottom:9px"><b style="color:#f9a8d4">GLM Univariate</b> = ANOVA/ANCOVA framework.<br>Include <span style="color:#c084fc">factors</span> (categorical) and/or <span style="color:#67e8f9">covariates</span> (continuous) to test their effect on the DV.</div>';
      html+='<div style="display:flex;flex-direction:column;gap:5px;font-size:11.5px">';
      [['R²','Proportion of variance explained'],['Partial η²','Effect size per predictor'],['F','Ratio of variance (between/within)'],['p < .05','Significant effect']].forEach(function(r){
        html+='<div style="display:flex;gap:8px;padding:5px 8px;background:rgba(124,58,237,.04);border-radius:6px;border:1px solid rgba(124,58,237,.1)">';
        html+='<span style="color:#c084fc;font-weight:700;width:65px;flex-shrink:0;font-family:monospace">'+r[0]+'</span>';
        html+='<span style="color:rgba(232,222,255,.55)">'+r[1]+'</span></div>';
      });
      html+='</div></div></div>';
      // Results
      if(glmRes&&!glmRes._err){
        html+='<div class="card"><div class="sec-hd">Tests of Between-Subjects Effects</div>';
        html+='<div class="stats-grid" style="margin-bottom:11px">';
        html+=stCard('N',glmRes.n)+stCard('R²',glmRes.R2)+stCard('Adj R²',glmRes.R2adj)+stCard('Grand Mean',glmRes.grandMean);
        html+='</div>';
        html+='<div class="tbl-wrap"><table><thead><tr>';
        ['Source','df','SS','MS','F','p','η²','Partial η²'].forEach(function(h){html+='<th>'+h+'</th>';});
        html+='</tr></thead><tbody>';
        glmRes.effects.forEach(function(e){
          var psig=e.sig;
          html+='<tr>';
          html+='<td style="font-weight:600;color:#c084fc">'+escHtml(e.source)+(e.isCov?' <span class="tag tag-blue" style="font-size:9px">cov</span>':'')+'</td>';
          html+='<td class="td-num">'+e.df+'</td>';
          html+='<td class="td-num">'+(e.SS||'—')+'</td>';
          html+='<td class="td-num">'+(e.MS||'—')+'</td>';
          html+='<td class="td-num">'+(e.F||'—')+'</td>';
          html+='<td class="td-num">'+(psig?'<b style="color:#34d399">':'')+e.p_fmt+(psig?'</b>':'')+'</td>';
          html+='<td class="td-num">'+(e.eta2||'—')+'</td>';
          html+='<td class="td-num">'+(e.partialEta2||'—')+'</td>';
          html+='</tr>';
        });
        html+='<tr style="border-top:1px solid rgba(124,58,237,.2)">';
        html+='<td style="color:rgba(232,222,255,.4)">Error</td>';
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
          html+='<div style="margin-top:12px"><div class="sec-hd" style="font-size:11px">'+escHtml(fac)+' — Estimated Marginal Means</div>';
          html+='<div class="tbl-wrap"><table><thead><tr><th>'+escHtml(fac)+'</th><th>N</th><th>Mean</th><th>SD</th><th>95% CI</th></tr></thead><tbody>';
          levels.forEach(function(g){
            var gv=eff.groups[g];
            if(!gv||!gv.length) return;
            var gm=SE.mean(gv),gs=gv.length>=2?SE.std(gv):NaN,gn=gv.length;
            var se=(gn>0&&isFinite(gs))?gs/Math.sqrt(gn):0;
            var ci=isFinite(gs)?'['+SE.f4(gm-1.96*se)+', '+SE.f4(gm+1.96*se)+']':'N/A';
            html+='<tr><td class="td-str">'+escHtml(g)+'</td><td class="td-num">'+gn+'</td>';
            html+='<td class="td-num">'+SE.f4(gm)+'</td><td class="td-num">'+(isFinite(gs)?SE.f4(gs):'N/A')+'</td>';
            html+='<td class="td-num" style="font-size:11px;color:#94a3b8">'+ci+'</td></tr>';
          });
          html+='</tbody></table></div></div>';
        });
        html+='</div>';
      }
    }

    // ─── MULTIVARIATE (MANOVA) ─────────────────────────────────
    else if(aState.glmSubType==='multivariate'){
      if(!aState.glmMultiDeps||!aState.glmMultiDeps.length) aState.glmMultiDeps=nF.slice(0,Math.min(2,nF.length));
      var manova=null;
      if(aState.glmMultiDeps.length>=2&&aState.glmFactors.length===1){
        try{ manova=SE.manovaProper(data,aState.glmMultiDeps,aState.glmFactors[0]); }catch(e){ manova={_err:e.message}; }
      }
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">MANOVA Setup</div>';
      html+='<div style="margin-bottom:10px">';
      html+='<label class="lbl">Dependent Variables <span style="color:#67e8f9">(select ≥2 numeric)</span></label>';
      html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px">';
      nF.forEach(function(f){
        var sel=aState.glmMultiDeps.includes(f);
        html+='<label style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;cursor:pointer;font-size:12px;'
          +(sel?'background:rgba(103,232,249,.14);color:#67e8f9;border:1px solid rgba(103,232,249,.35);':'background:rgba(124,58,237,.06);color:rgba(232,222,255,.45);border:1px solid rgba(124,58,237,.15);')
          +'">'
          +'<input type="checkbox" '+(sel?'checked':'')
          +' onchange="toggleGlmMultiDep(this.dataset.fld,this.checked)" data-fld="'+escHtmlAttr(f)
          +'" style="accent-color:#67e8f9;width:13px;height:13px"/>'+escHtml(f)+'</label>';
      });
      html+='</div></div>';
      html+='<div style="margin-bottom:12px">';
      html+='<label class="lbl">Between-Subjects Factor <span style="color:rgba(232,222,255,.35)">(select exactly 1)</span></label>';
      html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px">';
      aF.forEach(function(f){
        if(aState.glmMultiDeps.includes(f)) return;
        var sel=aState.glmFactors.includes(f);
        html+='<label style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;cursor:pointer;font-size:12px;'
          +(sel?'background:rgba(167,139,250,.18);color:#c084fc;border:1px solid rgba(167,139,250,.3);':'background:rgba(124,58,237,.06);color:rgba(232,222,255,.45);border:1px solid rgba(124,58,237,.15);')
          +'">'
          +'<input type="checkbox" '+(sel?'checked':'')
          +' onchange="toggleGlmFactor(this.dataset.fld,this.checked)" data-fld="'+escHtmlAttr(f)
          +'" style="accent-color:#a78bfa;width:13px;height:13px"/>'+escHtml(f)+'</label>';
      });
      html+='</div></div>';
      html+='<button class="btn btn-primary btn-sm" onclick="runMANOVA()">▶ Run</button>';
      html+='</div>';
      html+='<div class="card"><div class="sec-hd">About MANOVA</div>';
      html+='<div class="assump"><b style="color:#f9a8d4">Proper MANOVA</b> builds H (hypothesis) and E (error) cross-product matrices, then computes eigenvalues of E⁻¹H to derive all four multivariate test statistics.<br><br>';
      html+='<b style="color:#67e8f9">Pillai\'s Trace</b> — most robust (recommended)<br>';
      html+='<b style="color:#a5f3fc">Wilks\' Lambda</b> — most powerful when assumptions met<br>';
      html+='<b style="color:#c084fc">Hotelling-Lawley</b> — sensitive to mean differences<br>';
      html+='<b style="color:#fbbf24">Roy\'s Greatest Root</b> — upper bound (liberal)<br><br>';
      html+='<b style="color:#34d399">Box\'s M</b> tests homogeneity of covariance matrices.</div>';
      html+='</div></div>';
      // Live preview of multivariate tests
      if(manova&&!manova._err){
        html+='<div class="card"><div class="sec-hd">Multivariate Test Preview</div>';
        html+='<div class="tbl-wrap"><table><thead><tr>';
        ['Test','Value','F','df1','df2','p',''].forEach(function(h2){ html+='<th>'+h2+'</th>'; });
        html+='</tr></thead><tbody>';
        [
          ['Pillai\'s Trace',      manova.pillai],
          ['Wilks\' Lambda',       manova.wilks],
          ['Hotelling-Lawley',     manova.hotelling],
          ['Roy\'s Greatest Root', manova.roy],
        ].forEach(function(pair){
          var lbl=pair[0], t=pair[1];
          html+='<tr><td class="td-label" style="font-size:11px">'+escHtml(lbl)+'</td>';
          html+='<td class="td-num">'+t.stat+'</td><td class="td-num">'+t.F+'</td>';
          html+='<td class="td-num">'+t.df1+'</td><td class="td-num">'+t.df2+'</td>';
          html+='<td class="td-num">'+(t.sig?'<b style="color:#34d399">'+t.p_fmt+'</b>':t.p_fmt)+'</td>';
          html+='<td>'+(t.sig?'<span class="tag tag-green" style="font-size:9px">✓</span>':'<span style="font-size:9px;color:#475569">ns</span>')+'</td>';
          html+='</tr>';
        });
        html+='</tbody></table></div>';
        html+='<div style="margin-top:8px;font-size:11px;color:rgba(232,222,255,.4)">η² (Pillai) = '+manova.pillaiEta2+' &nbsp;·&nbsp; Box\'s M p = '+manova.boxP+(manova.boxSig?' <span style="color:#fbbf24">⚠ violation</span>':' <span style="color:#34d399">✓ ok</span>')+'</div>';
        html+='</div>';
      } else if(manova&&manova._err){
        html+='<div class="card"><div style="color:#f87171;font-size:12px">'+manova._err+'</div></div>';
      } else if(aState.glmMultiDeps.length<2){
        html+='<div class="card"><div style="color:rgba(232,222,255,.3);font-size:11px">Select ≥2 dependent variables and exactly 1 factor to see a live preview.</div></div>';
      } else if(aState.glmFactors.length!==1){
        html+='<div class="card"><div style="color:#fbbf24;font-size:11px">⚠ Select exactly 1 between-subjects factor for MANOVA.</div></div>';
      }
    }

    // ─── REPEATED MEASURES ─────────────────────────────────────
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
      html+='<label class="lbl">Between-Subjects Factor <span style="color:rgba(232,222,255,.35)">(optional grouping)</span></label>';
      html+=mkSelect('rm-grp',['(none)',...aF],aState.glmBetween||'(none)','aState.glmBetween=val==="(none)"?"":val;renderASub()','Group factor');
      html+='</div>';
      html+='<button class="btn btn-primary btn-sm" onclick="runRepeatedMeasures()">▶ Run</button>';
      html+='</div>';
      html+='<div class="card"><div class="sec-hd">About Repeated Measures</div>';
      html+='<div class="assump"><b style="color:#f9a8d4">Repeated Measures GLM</b> examines change across time points (within-subjects) while controlling for individual differences.<br><br>This implementation uses <b style="color:#a78bfa">Paired T-Test</b> logic with optional between-subjects grouping for comparison.</div>';
      html+='<div style="margin-top:10px;padding:9px 12px;background:rgba(251,191,36,.05);border:1px solid rgba(251,191,36,.18);border-radius:8px;font-size:11px;color:#fbbf24">Tip: For 3+ time points, use the ANOVA tab with repeated-measures design.</div>';
      html+='</div></div>';
      // Quick preview of paired result
      if(aState.pairedA&&aState.pairedB&&aState.pairedA!==aState.pairedB){
        var rmRes=tryStats(function(){return SE.pairedTTest(SE.validNums(data.map(function(r){return r[aState.pairedA];})),SE.validNums(data.map(function(r){return r[aState.pairedB];})));});
        if(rmRes&&!rmRes._err){
          html+='<div class="card"><div class="sec-hd">Within-Subjects Effect</div>';
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

    // ── State init ──────────────────────────────────────────────
    if(!aState.hlmDep)   aState.hlmDep   = nF[0]||'';
    if(!aState.hlmGroup) aState.hlmGroup = aF[0]||'';
    if(!aState.hlmL1Preds) aState.hlmL1Preds = [];
    if(!aState.hlmL2Preds) aState.hlmL2Preds = [];
    if(!aState.hlmGroup2)  aState.hlmGroup2  = aF[1]||aF[0]||'';
    if(!aState.hlmModelType) aState.hlmModelType = 'intercept'; // intercept | slopes | crosslevel

    // ── Helper: compute ICC from data ─────── DIPINDAH ke
    // js/stats-engine/stats-glm-hlm.js (B25, 2026-09-16)

    // ── Compute live results ─────────────────────────────────────
    var hlmRes=aState.hlmDep&&aState.hlmGroup?tryStats(function(){return computeHLMBasics(aState.hlmDep,aState.hlmGroup);}):null;

    // ═══════════════════════════════════════════════════════════
    // SUB: ICC & Variance Partitioning
    // ═══════════════════════════════════════════════════════════
    if(currentASub==='hlm-icc'){
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">⬡ ICC & Variance Partitioning</div>';
      html+='<div class="assump" style="margin-bottom:12px">The <b style="color:#a78bfa">Intraclass Correlation Coefficient (ICC)</b> tells you how much variance in the outcome lives <i>between</i> groups vs. <i>within</i> groups. ICC > .05 justifies using HLM.</div>';
      html+='<label class="lbl">Outcome Variable <span style="color:#67e8f9">(numeric)</span></label>';
      html+=mkSelect('hlm-dep-icc',nF,aState.hlmDep,'aState.hlmDep=val;renderASub()','Outcome');
      html+='<div style="margin-top:8px"><label class="lbl">Level-2 Grouping Variable <span style="color:#c084fc">(e.g. class, hospital)</span></label>';
      html+=mkSelect('hlm-grp-icc',aF,aState.hlmGroup,'aState.hlmGroup=val;renderASub()','Grouping')+'</div>';
      html+='<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="runHLM()">▶ Run</button>';
      html+='</div>';
      html+='<div class="card"><div class="sec-hd">Interpretation Guide</div>';
      html+='<div style="display:flex;flex-direction:column;gap:6px;font-size:11.5px">';
      [['ICC < .05','Negligible clustering; single-level OK','#34d399'],
       ['ICC .05–.10','Small but real; HLM recommended','#fbbf24'],
       ['ICC .10–.25','Moderate clustering; HLM important','#f472b6'],
       ['ICC > .25','Strong clustering; HLM essential','#f87171']
      ].forEach(function(r){
        html+='<div style="display:flex;gap:8px;padding:6px 10px;background:rgba(124,58,237,.04);border-radius:7px;border-left:3px solid '+r[2]+'">';
        html+='<span style="color:'+r[2]+';font-weight:700;min-width:75px;font-family:monospace;font-size:11px">'+r[0]+'</span>';
        html+='<span style="color:rgba(232,222,255,.55)">'+r[1]+'</span></div>';
      });
      html+='</div>';
      html+='<div style="margin-top:12px;padding:8px 11px;background:rgba(167,139,250,.06);border:1px solid rgba(167,139,250,.2);border-radius:7px;font-size:11px;color:rgba(232,222,255,.5)">Design Effect = 1 + (ñ−1)·ICC &nbsp;→ effective N reduction due to clustering.</div>';
      html+='</div></div>';
      if(hlmRes&&!hlmRes._err){
        var iccVal=parseFloat(hlmRes.ICC);
        var iccColor=iccVal<.05?'#34d399':iccVal<.10?'#fbbf24':iccVal<.25?'#f472b6':'#f87171';
        var iccLabel=iccVal<.05?'Negligible – single-level likely OK':iccVal<.10?'Small – HLM recommended':iccVal<.25?'Moderate – HLM important':'Strong – HLM essential';
        html+='<div class="card"><div class="sec-hd">Null Model Results</div>';
        html+='<div class="stats-grid" style="margin-bottom:11px">';
        html+=stCard('ICC',hlmRes.ICC,'Intraclass Correlation')+stCard('Groups (k)',hlmRes.k,'Level-2 units');
        html+=stCard('N obs',hlmRes.n,'Level-1 units')+stCard('Grand Mean',hlmRes.grandMean,'Outcome');
        html+='</div>';
        html+='<div style="padding:10px 14px;border-radius:9px;border:1.5px solid '+iccColor+';background:rgba(124,58,237,.04);margin-bottom:11px">';
        html+='<div style="font-size:13px;font-weight:700;color:'+iccColor+'">ICC = '+hlmRes.ICC+'</div>';
        html+='<div style="font-size:11px;color:rgba(232,222,255,.55);margin-top:3px">'+iccLabel+'</div></div>';
        html+='<div class="stats-grid2" style="margin-bottom:11px">';
        html+=stCard('Between-group var',hlmRes.varBetween,'τ₀₀')+stCard('Within-group var',hlmRes.varWithin,'σ²');
        html+=stCard('Design Effect',hlmRes.design_effect,'DEFF')+stCard('F (ANOVA)',hlmRes.F+(hlmRes.sig?' *':' ns'),'One-way test');
        html+='</div>';
        if(hlmRes.grpStats&&hlmRes.grpStats.length){
          html+='<div class="sec-hd" style="font-size:11px;margin-bottom:6px">Group-Level Descriptives</div>';
          html+='<div class="tbl-wrap"><table><thead><tr><th>Group</th><th>n</th><th>Mean</th><th>SD</th></tr></thead><tbody>';
          hlmRes.grpStats.slice(0,15).forEach(function(g){
            html+='<tr><td class="td-str">'+escHtml(g.group)+'</td><td class="td-num">'+g.n+'</td><td class="td-num">'+g.mean+'</td><td class="td-num">'+g.sd+'</td></tr>';
          });
          if(hlmRes.grpStats.length>15) html+='<tr><td colspan="4" style="color:rgba(232,222,255,.3);font-size:11px;text-align:center">… '+( hlmRes.grpStats.length-15)+' more groups</td></tr>';
          html+='</tbody></table></div>';
        }
        html+='</div>';
      } else if(hlmRes&&hlmRes._err){
        html+='<div class="card"><div style="color:#f87171;font-size:12px">⚠ '+hlmRes._err+'</div></div>';
      }
    }

    // ═══════════════════════════════════════════════════════════
    // SUB: Two-Level HLM
    // ═══════════════════════════════════════════════════════════
    else if(currentASub==='hlm-2level'){
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">Two-Level HLM Setup</div>';
      html+='<div class="assump" style="margin-bottom:11px"><b style="color:#a78bfa">Two-Level HLM</b> — Level 1: individuals (e.g. students), Level 2: groups (e.g. classrooms). Accounts for non-independence within groups.</div>';
      html+='<div style="margin-bottom:9px"><label class="lbl">Outcome <span style="color:#67e8f9">(Level-1 numeric)</span></label>';
      html+=mkSelect('hlm2-dep',nF,aState.hlmDep,'aState.hlmDep=val;renderASub()','Outcome')+'</div>';
      html+='<div style="margin-bottom:9px"><label class="lbl">Level-2 Grouping <span style="color:#c084fc">(cluster ID)</span></label>';
      html+=mkSelect('hlm2-grp',aF,aState.hlmGroup,'aState.hlmGroup=val;renderASub()','Group')+'</div>';
      html+='<div style="margin-bottom:9px"><label class="lbl">Level-1 Predictors <span style="color:rgba(232,222,255,.35)">(within-group)</span></label>';
      html+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:5px">';
      nF.forEach(function(f){
        if(f===aState.hlmDep) return;
        var sel=aState.hlmL1Preds.includes(f);
        html+='<label style="display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:999px;cursor:pointer;font-size:11.5px;'
          +(sel?'background:rgba(103,232,249,.12);color:#67e8f9;border:1px solid rgba(103,232,249,.3);':'background:rgba(124,58,237,.06);color:rgba(232,222,255,.4);border:1px solid rgba(124,58,237,.14);')
          +'">'
          +'<input type="checkbox" '+(sel?'checked':'')
          +' onchange="toggleHlmL1(this.dataset.fld,this.checked)" data-fld="'+escHtmlAttr(f)
          +'" style="accent-color:#67e8f9;width:12px;height:12px"/>'+escHtml(f)+'</label>';
      });
      html+='</div></div>';
      html+='<div style="margin-bottom:12px"><label class="lbl">Level-2 Predictors <span style="color:rgba(232,222,255,.35)">(between-group)</span></label>';
      html+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:5px">';
      nF.concat(aF).filter(function(f,i,a){return a.indexOf(f)===i&&f!==aState.hlmDep&&f!==aState.hlmGroup;}).forEach(function(f){
        var sel=aState.hlmL2Preds.includes(f);
        html+='<label style="display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:999px;cursor:pointer;font-size:11.5px;'
          +(sel?'background:rgba(167,139,250,.14);color:#c084fc;border:1px solid rgba(167,139,250,.28);':'background:rgba(124,58,237,.06);color:rgba(232,222,255,.4);border:1px solid rgba(124,58,237,.14);')
          +'">'
          +'<input type="checkbox" '+(sel?'checked':'')
          +' onchange="toggleHlmL2(this.dataset.fld,this.checked)" data-fld="'+escHtmlAttr(f)
          +'" style="accent-color:#a78bfa;width:12px;height:12px"/>'+escHtml(f)+'</label>';
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
      html+='<div style="font-size:11.5px;line-height:1.8;color:rgba(232,222,255,.55)">';
      html+='<div style="padding:10px 12px;background:rgba(167,139,250,.06);border-radius:8px;border:1px solid rgba(167,139,250,.15);margin-bottom:10px;font-family:monospace;font-size:11px">';
      html+='<div style="color:#a78bfa;font-weight:700;margin-bottom:5px">Level 1 (within-group):</div>';
      html+='Y<sub>ij</sub> = β<sub>0j</sub> + β<sub>1j</sub>·X<sub>ij</sub> + r<sub>ij</sub><br>';
      html+='<div style="color:#a78bfa;font-weight:700;margin:7px 0 5px">Level 2 (between-group):</div>';
      html+='β<sub>0j</sub> = γ<sub>00</sub> + γ<sub>01</sub>·W<sub>j</sub> + u<sub>0j</sub><br>';
      html+='β<sub>1j</sub> = γ<sub>10</sub> + γ<sub>11</sub>·W<sub>j</sub> + u<sub>1j</sub>';
      html+='</div>';
      html+='<div style="display:flex;flex-direction:column;gap:5px">';
      [['γ₀₀','Grand intercept (fixed)'],['γ₀₁','Level-2 predictor effect on intercept'],['γ₁₀','Level-1 slope (fixed)'],['γ₁₁','Cross-level interaction'],['u₀ⱼ','Random intercept variance (τ₀₀)'],['u₁ⱼ','Random slope variance (τ₁₁)'],['rᵢⱼ','Level-1 residual (σ²)']].forEach(function(r){
        html+='<div style="display:flex;gap:8px;padding:4px 8px;border-radius:5px;background:rgba(124,58,237,.04)">';
        html+='<span style="color:#c084fc;font-family:monospace;min-width:35px">'+r[0]+'</span><span>'+r[1]+'</span></div>';
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
        html+='<div class="assump"><span style="color:#a78bfa">ICC = '+hlmRes.ICC+'</span> — '+iccMsg+'</div>';
        html+='</div>';
      }
    }

    // ═══════════════════════════════════════════════════════════
    // SUB: Three-Level HLM
    // ═══════════════════════════════════════════════════════════
    else if(currentASub==='hlm-3level'){
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">Three-Level HLM Setup</div>';
      html+='<div class="assump" style="margin-bottom:11px"><b style="color:#a78bfa">Three-Level HLM</b> — e.g. students (L1) nested in classrooms (L2) nested in schools (L3). Partitions variance across all three levels.</div>';
      html+='<div style="margin-bottom:9px"><label class="lbl">Outcome <span style="color:#67e8f9">(Level-1 numeric)</span></label>';
      html+=mkSelect('hlm3-dep',nF,aState.hlmDep,'aState.hlmDep=val;renderASub()','Outcome')+'</div>';
      html+='<div style="margin-bottom:9px"><label class="lbl">Level-2 Grouping <span style="color:#f472b6">(e.g. classroom)</span></label>';
      html+=mkSelect('hlm3-grp',aF,aState.hlmGroup,'aState.hlmGroup=val;renderASub()','Level-2 group')+'</div>';
      html+='<div style="margin-bottom:9px"><label class="lbl">Level-3 Grouping <span style="color:#c084fc">(e.g. school)</span></label>';
      html+=mkSelect('hlm3-grp2',aF,aState.hlmGroup2,'aState.hlmGroup2=val;renderASub()','Level-3 group')+'</div>';
      html+='<div style="margin-bottom:12px"><label class="lbl">Level-1 Predictors</label>';
      html+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:5px">';
      nF.forEach(function(f){
        if(f===aState.hlmDep) return;
        var sel=aState.hlmL1Preds.includes(f);
        html+='<label style="display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:999px;cursor:pointer;font-size:11.5px;'
          +(sel?'background:rgba(103,232,249,.12);color:#67e8f9;border:1px solid rgba(103,232,249,.3);':'background:rgba(124,58,237,.06);color:rgba(232,222,255,.4);border:1px solid rgba(124,58,237,.14);')
          +'">'
          +'<input type="checkbox" '+(sel?'checked':'')
          +' onchange="toggleHlmL1(this.dataset.fld,this.checked)" data-fld="'+escHtmlAttr(f)
          +'" style="accent-color:#67e8f9;width:12px;height:12px"/>'+escHtml(f)+'</label>';
      });
      html+='</div></div>';
      html+='<button class="btn btn-primary btn-sm" onclick="runHLM()">▶ Run</button>';
      html+='</div>';
      html+='<div class="card"><div class="sec-hd">Variance Decomposition</div>';
      html+='<div class="assump" style="margin-bottom:10px">In a 3-level model, the total variance is split into three components:</div>';
      html+='<div style="display:flex;flex-direction:column;gap:6px;font-size:11.5px">';
      [['σ² (Level 1)','Residual within-group variance','#67e8f9'],
       ['τ₀₀ L2 (Level 2)','Between-group-within-cluster variance','#f472b6'],
       ['τ₀₀ L3 (Level 3)','Between-cluster variance','#a78bfa']
      ].forEach(function(r){
        html+='<div style="display:flex;gap:8px;padding:7px 10px;background:rgba(124,58,237,.04);border-radius:7px;border-left:3px solid '+r[2]+'">';
        html+='<span style="color:'+r[2]+';font-weight:700;font-family:monospace;min-width:110px;font-size:11px">'+r[0]+'</span>';
        html+='<span style="color:rgba(232,222,255,.55)">'+r[1]+'</span></div>';
      });
      html+='</div>';
      html+='<div style="margin-top:12px;padding:9px 12px;background:rgba(251,191,36,.05);border:1px solid rgba(251,191,36,.18);border-radius:8px;font-size:11px;color:#fbbf24">⚠ Three-level models require large samples (≥ 30 level-3 units recommended). Results shown are ICC-based approximations from the two-level groupings.</div>';
      html+='</div></div>';
      // Show L2 and L3 ICC approximations
      var hlmRes3=aState.hlmGroup2&&aState.hlmDep?tryStats(function(){return computeHLMBasics(aState.hlmDep,aState.hlmGroup2);}):null;
      if(hlmRes&&!hlmRes._err&&hlmRes3&&!hlmRes3._err){
        html+='<div class="card"><div class="sec-hd">Variance Partition Estimates</div>';
        html+='<div class="stats-grid" style="margin-bottom:11px">';
        html+=stCard('ICC (L2)',hlmRes.ICC,'Level-2 clustering')+stCard('τ₀₀ L2',hlmRes.varBetween,'Between L2 variance');
        html+=stCard('ICC (L3)',hlmRes3.ICC,'Level-3 clustering')+stCard('τ₀₀ L3',hlmRes3.varBetween,'Between L3 variance');
        html+='</div>';
        html+='<div style="font-size:11px;color:rgba(232,222,255,.4)">Within-group σ² ≈ '+hlmRes.varWithin+' &nbsp;·&nbsp; Grand Mean = '+hlmRes.grandMean+'</div>';
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
    // ── Left: settings ──
    html+='<div class="card"><div class="sec-hd">Exploratory Factor Analysis</div>';
    html+='<div style="margin-bottom:10px"><label class="lbl">Variables <span style="color:#67e8f9">(select ≥2 numeric)</span></label>';
    html+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:5px;max-height:160px;overflow-y:auto">';
    nF.forEach(function(f){
      var sel=aState.efaVars.includes(f);
      html+='<label style="display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:999px;cursor:pointer;font-size:11.5px;'
        +(sel?'background:rgba(165,243,252,.12);color:#a5f3fc;border:1px solid rgba(165,243,252,.3);':'background:rgba(124,58,237,.06);color:rgba(232,222,255,.4);border:1px solid rgba(124,58,237,.12);')
        +'">'
        +'<input type="checkbox" '+(sel?'checked':'')
        +' onchange="toggleEfaVar(this.dataset.fld,this.checked)" data-fld="'+escHtmlAttr(f)
        +'" style="accent-color:#a5f3fc;width:12px;height:12px"/>'+escHtml(f)+'</label>';
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
      var kmoColor=parseFloat(efaPreview.kmo)>=0.7?'#34d399':parseFloat(efaPreview.kmo)>=0.5?'#fbbf24':'#f87171';
      html+='<div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:7px">';
      html+='<div class="sb"><div class="sb-label">KMO</div><div class="sb-value" style="color:'+kmoColor+'">'+efaPreview.kmo+'</div><div style="font-size:9.5px;color:'+kmoColor+';margin-top:2px">'+efaPreview.kmoInterp+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Bartlett χ²</div><div class="sb-value">'+efaPreview.chi2+'</div><div style="font-size:9.5px;color:'+(efaPreview.bartSig?'#34d399':'#f87171')+'">df='+efaPreview.bartDf+' · p='+(efaPreview.bartP||'N/A')+'</div></div>';
      html+='</div>';
    }
    if(efaPreview&&efaPreview._err){
      html+='<div class="miss-warn" style="margin-top:10px">'+escHtml(efaPreview.msg)+'</div>';
    }
    html+='</div>';

    // ── Right: scree plot + eigenvalues ──
    html+='<div class="card"><div class="sec-hd">Scree Plot</div>';
    if(efaPreview&&!efaPreview._err){
      html+=svgScreePlot(efaPreview.eigenvalues,efaPreview.nFactors);
      html+='<div class="tbl-wrap" style="margin-top:10px"><table><thead><tr><th>Factor</th><th>Eigenvalue</th><th>Variance %</th><th>Cumulative %</th></tr></thead><tbody>';
      efaPreview.eigenvalues.forEach(function(ev,i){
        var isSel=i<efaPreview.nFactors;
        html+='<tr'+(isSel?' style="background:rgba(165,243,252,.06)"':'')+'>';
        html+='<td style="color:'+(isSel?'#a5f3fc':'rgba(232,222,255,.4)')+'">F'+(i+1)+'</td>';
        html+='<td class="td-num" style="color:'+(parseFloat(ev)>1?'#a5f3fc':'rgba(232,222,255,.4)')+'">'+ev+'</td>';
        html+='<td class="td-num">'+(efaPreview.varExp[i]||'—')+'%</td>';
        html+='<td class="td-num">'+(efaPreview.cumVar[i]||'—')+'%</td>';
        html+='</tr>';
      });
      html+='</tbody></table></div>';
      html+='<div style="margin-top:6px;font-size:10px;color:rgba(232,222,255,.3)">Kaiser criterion: retain factors with Eigenvalue > 1 · Highlighted = retained</div>';
    } else {
      html+='<div class="chart-empty">Select ≥2 variables to see scree plot</div>';
    }
    html+='</div></div>';

    // ── Factor Loading Matrix ──
    if(efaPreview&&!efaPreview._err){
      html+='<div class="card"><div class="sec-hd">Factor Loading Matrix <span style="font-size:10px;font-style:normal;color:rgba(232,222,255,.35);margin-left:8px">('+efaPreview.rotation+' rotation · |loading| ≥ 0.40 highlighted)</span></div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Variable</th>';
      for(var f=0;f<efaPreview.nFactors;f++) html+='<th>F'+(f+1)+'</th>';
      html+='<th>Communality h²</th></tr></thead><tbody>';
      aState.efaVars.forEach(function(v,i){
        html+='<tr><td class="td-label">'+escHtml(v)+'</td>';
        efaPreview.loadings[i].forEach(function(l){
          var absL=Math.abs(parseFloat(l));
          var highlight=absL>=0.4;
          var col=absL>=0.6?'#a5f3fc':absL>=0.4?'#c084fc':'rgba(232,222,255,.4)';
          html+='<td class="td-num" style="color:'+col+';font-weight:'+(highlight?700:400)+'">'+l+'</td>';
        });
        html+='<td class="td-num" style="color:#fbbf24">'+efaPreview.communalities[i]+'</td>';
        html+='</tr>';
      });
      html+='</tbody></table></div>';
      html+='<div style="margin-top:8px;font-size:11px;color:rgba(232,222,255,.35)">Cyan = strong (≥0.60) · Purple = moderate (≥0.40) · Total variance explained: '+efaPreview.cumVar[efaPreview.nFactors-1]+'%</div>';
      html+='</div>';
    }
  return html;
}

function renderCfaForm(){
  const nF=numFields();
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
    // ── Left: CFA setup ──
    html+='<div class="card"><div class="sec-hd">Confirmatory Factor Analysis (CFA)</div>';
    html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:12px;line-height:1.6">Tentukan jumlah faktor laten dan assign variabel ke masing-masing faktor. CFA akan menghitung fit indices: CFI, TLI, RMSEA, SRMR.</div>';
    // Number of factors
    html+='<div style="margin-bottom:10px">'+mkCsel('cfa-nfac',['1','2','3','4','5'],String(aState.cfaFactors),'setCfaFactors(parseInt(val))','Jumlah Faktor Laten')+'</div>';

    // Factor name + indicator assignment
    aState.cfaFactorNames.forEach(function(fn, fi){
      var factColor=['#818cf8','#f472b6','#34d399','#fbbf24','#67e8f9'][fi%5];
      html+='<div style="margin-bottom:12px;padding:10px;border-radius:8px;border:1px solid rgba(129,140,248,.18);background:rgba(129,140,248,.04)">';
      html+='<div style="display:flex;align-items:center;gap:7px;margin-bottom:8px">';
      html+='<div style="width:8px;height:8px;border-radius:50%;background:'+factColor+';flex-shrink:0"></div>';
      html+='<input class="inp" style="flex:1;font-weight:700;font-size:12px;padding:5px 9px" value="'+escHtmlAttr(fn)+'" oninput="renameCfaFactor('+fi+',this.value)" placeholder="Nama Faktor"/>';
      html+='</div>';
      html+='<div style="font-size:10.5px;color:rgba(232,222,255,.35);margin-bottom:5px">Pilih indikator untuk <b style="color:'+factColor+'">'+escHtml(fn)+'</b> (min 2 variabel):</div>';
      html+='<div style="display:flex;flex-wrap:wrap;gap:3px">';
      nF.forEach(function(v){
        var assigned=aState.cfaFactorMap[fn]&&aState.cfaFactorMap[fn].includes(v);
        html+='<label style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:999px;cursor:pointer;font-size:11px;'
          +(assigned?'background:rgba(129,140,248,.18);color:'+factColor+';border:1px solid rgba(129,140,248,.35);':'background:rgba(124,58,237,.06);color:rgba(232,222,255,.4);border:1px solid rgba(124,58,237,.12);')
          +'">'
          +'<input type="checkbox" '+(assigned?'checked':'')
          +' data-fn="'+escHtmlAttr(fn)+'" data-v="'+escHtmlAttr(v)+'" onchange="toggleCfaVar(this.dataset.fn,this.dataset.v,this.checked)" style="accent-color:'+factColor+';width:11px;height:11px"/>'+escHtml(v)+'</label>';
      });
      html+='</div>';
      var cnt=aState.cfaFactorMap[fn]?aState.cfaFactorMap[fn].length:0;
      if(cnt<2) html+='<div style="font-size:10px;color:#f87171;margin-top:4px">⚠ Min 2 indikator per faktor</div>';
      html+='</div>';
    });

    html+='<button class="btn btn-primary btn-sm" onclick="runCFA()" style="margin-top:4px">▶ Run</button>';
    html+='</div>';

    // ── Right: Fit indices preview ──
    html+='<div class="card"><div class="sec-hd">Fit Indices (Live Preview)</div>';
    if(!cfaReady){
      html+='<div class="chart-empty" style="padding:32px 0">Assign min 2 indikator ke salah satu faktor untuk melihat fit indices.</div>';
    } else if(cfaPreview&&cfaPreview._err){
      html+='<div class="miss-warn">'+escHtml(cfaPreview.msg)+'</div>';
    } else if(cfaPreview){
      var r=cfaPreview;
      // Overall fit badge
      html+='<div style="margin-bottom:12px;padding:10px 14px;border-radius:9px;background:rgba(0,0,0,.15);border:1px solid '+r.fitColor+';text-align:center">';
      html+='<div style="font-size:14px;font-weight:900;color:'+r.fitColor+';font-family:Playfair Display,serif">'+r.overallFit+'</div>';
      html+='<div style="font-size:10px;color:rgba(232,222,255,.4);margin-top:2px">N='+r.n+' · '+r.p+' observed vars · '+r.nFactors+' latent factor'+(r.nFactors>1?'s':'')+'</div>';
      html+='</div>';

      // Fit index cards
      function fitCard(name, val, interp, good, cutoff, color){
        return '<div class="sb"><div class="sb-label">'+escHtml(name)+'</div>'
          +'<div class="sb-value" style="color:'+color+'">'+val+'</div>'
          +'<div style="font-size:9.5px;color:'+color+';margin-top:2px">'+interp+'</div>'
          +'<div style="font-size:9px;color:rgba(232,222,255,.25);margin-top:1px">'+cutoff+'</div></div>';
      }
      var cficol=r.CFI_raw>=0.95?'#34d399':r.CFI_raw>=0.90?'#fbbf24':'#f87171';
      var tlicol=r.TLI_raw>=0.95?'#34d399':r.TLI_raw>=0.90?'#fbbf24':'#f87171';
      var rmsecol=r.RMSEA_raw<=0.05?'#34d399':r.RMSEA_raw<=0.08?'#fbbf24':'#f87171';
      var srmrcol=r.SRMR_raw<=0.05?'#34d399':r.SRMR_raw<=0.08?'#fbbf24':'#f87171';
      html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">';
      html+=fitCard('CFI',r.CFI,r.CFIinterp,true,'≥ 0.95 excellent, ≥ 0.90 OK',cficol);
      html+=fitCard('TLI (NNFI)',r.TLI,r.TLIinterp,true,'≥ 0.95 excellent, ≥ 0.90 OK',tlicol);
      html+=fitCard('RMSEA',r.RMSEA,r.RMSEAinterp,false,'≤ 0.05 excellent, ≤ 0.08 OK',rmsecol);
      html+=fitCard('SRMR',r.SRMR,r.SRMRinterp,false,'≤ 0.05 excellent, ≤ 0.08 OK',srmrcol);
      html+='</div>';
      // RMSEA CI
      html+='<div style="font-size:10.5px;color:rgba(232,222,255,.45);margin-bottom:8px">RMSEA 90% CI: ['+r.RMSEA_lo+', '+r.RMSEA_hi+'] &nbsp;·&nbsp; χ²('+r.dfModel+')='+r.chiSq+', p='+r.pChiSq+'</div>';
      // Chi-square note
      html+='<div style="font-size:10px;color:rgba(232,222,255,.3);line-height:1.5">χ² sensitif terhadap N besar. Utamakan CFI ≥ .95, RMSEA ≤ .06, SRMR ≤ .08 untuk menentukan model fit.</div>';
    }
    html+='</div></div>';

    // ── Factor Loadings Table ──
    if(cfaPreview&&!cfaPreview._err){
      var r=cfaPreview;
      html+='<div class="card"><div class="sec-hd">Factor Loadings (Standardized)</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Faktor</th><th>Indikator</th><th>Loading (λ)</th><th>Communality (h²)</th><th>Keterangan</th></tr></thead><tbody>';
      r.factorNames.forEach(function(fn, fi){
        var factColor=['#818cf8','#f472b6','#34d399','#fbbf24','#67e8f9'][fi%5];
        var vars=r.factorMap[fn]||[];
        vars.forEach(function(v, vi){
          var vIdx=r.varNames.indexOf(v);
          var lam=vIdx>=0?r.lambda[vIdx][fi]:null;
          var h2=vIdx>=0?r.communalities[vIdx]:null;
          var lamNum=lam!==null?parseFloat(lam):null;
          var lamCol=lamNum!==null?(Math.abs(lamNum)>=0.7?'#34d399':Math.abs(lamNum)>=0.5?'#a5f3fc':Math.abs(lamNum)>=0.3?'#fbbf24':'#f87171'):'rgba(232,222,255,.4)';
          var h2num=h2!==null?parseFloat(h2):null;
          var h2col=h2num!==null?(h2num>=0.7?'#34d399':h2num>=0.4?'#fbbf24':'#f87171'):'rgba(232,222,255,.4)';
          html+='<tr>';
          if(vi===0) html+='<td class="td-label" rowspan="'+vars.length+'" style="color:'+factColor+';font-weight:800;vertical-align:top;padding-top:10px">'+escHtml(fn)+'</td>';
          html+='<td class="td-label">'+escHtml(v)+'</td>';
          html+='<td class="td-num" style="color:'+lamCol+';font-weight:'+(Math.abs(lamNum||0)>=0.5?700:400)+'">'+( lam!==null?lam:'—' )+'</td>';
          html+='<td class="td-num" style="color:'+h2col+'">'+( h2!==null?h2:'—' )+'</td>';
          html+='<td><span class="tag" style="font-size:9px;'+( lamNum!==null&&Math.abs(lamNum)>=0.5?'background:rgba(52,211,153,.12);color:#34d399;border:1px solid rgba(52,211,153,.25)':'background:rgba(248,113,113,.1);color:#f87171;border:1px solid rgba(248,113,113,.2)' )+'">'+( lamNum!==null&&Math.abs(lamNum)>=0.5?'✓ Adequate':'✗ Weak' )+'</span></td>';
          html+='</tr>';
        });
      });
      html+='</tbody></table></div>';
      html+='<div style="margin-top:8px;font-size:10.5px;color:rgba(232,222,255,.35)">Loading ≥ 0.70 = strong · ≥ 0.50 = adequate · &lt; 0.30 = weak. Communality ≥ 0.40 disarankan.</div>';
      html+='</div>';

      // Residual matrix
      html+='<div class="card"><div class="sec-hd">Residual Correlation Matrix (R − Σ̂)</div>';
      html+='<div style="overflow-x:auto"><table style="font-size:11px"><thead><tr><th></th>';
      r.varNames.forEach(function(v){ html+='<th>'+escHtml(v)+'</th>'; });
      html+='</tr></thead><tbody>';
      r.varNames.forEach(function(v, i){
        html+='<tr><td class="td-label">'+escHtml(v)+'</td>';
        r.varNames.forEach(function(vj, j){
          var resid=r.R[i][j]-r.Sigma[i][j];
          var absR=Math.abs(resid);
          var col=absR>0.1?'#f87171':absR>0.05?'#fbbf24':'rgba(232,222,255,.45)';
          html+='<td class="td-num" style="font-size:10px;color:'+col+'">'+SE.f4(resid)+'</td>';
        });
        html+='</tr>';
      });
      html+='</tbody></table></div>';
      html+='<div style="font-size:10px;color:rgba(232,222,255,.3);margin-top:6px">Residual &gt; 0.10 (merah) mengindikasikan misfitting item pairs.</div>';
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

    html+='<div class="card"><div class="sec-hd">Mediation Analysis <span style="font-size:10px;font-style:normal;color:rgba(232,222,255,.3);margin-left:7px">Baron-Kenny Steps · Sobel Test · Bootstrap CI</span></div>';
    html+='<div style="font-size:11.5px;color:rgba(232,222,255,.45);margin-bottom:12px;line-height:1.7">Apakah variabel <b style="color:#fb923c">X</b> berpengaruh terhadap <b style="color:#67e8f9">Y</b> <em>melalui</em> <b style="color:#f472b6">M</b>? Mediation Analysis menjawab pertanyaan ini dengan menghitung efek tidak langsung (indirect effect) menggunakan Sobel test dan Bootstrap confidence interval.</div>';

    // Path Diagram SVG
    var numM=aState.medM.length;
    html+='<div style="margin-bottom:14px;background:rgba(124,58,237,.04);border:1px solid rgba(124,58,237,.12);border-radius:10px;padding:12px;text-align:center">';
    html+=svgMediationPath(aState.medX||'X',aState.medM,aState.medY||'Y',medPreview);
    html+='</div>';

    html+='<div class="grid2">';
    // Left column: variable selection
    html+='<div>';
    html+='<div style="margin-bottom:9px"><label class="lbl">Independent Variable (X) <span style="color:#fb923c">●</span></label>'+mkSelect('med-x',nF,aState.medX,'aState.medX=val;renderASub()','Select X')+'</div>';
    html+='<div style="margin-bottom:9px"><label class="lbl">Dependent Variable (Y) <span style="color:#67e8f9">●</span></label>'+mkSelect('med-y',nF,aState.medY,'aState.medY=val;renderASub()','Select Y')+'</div>';
    html+='<div style="margin-bottom:9px"><label class="lbl">Mediator(s) (M) <span style="color:#f472b6">●</span> <span style="font-size:9.5px;color:rgba(232,222,255,.3)">(dapat lebih dari 1)</span></label>';
    html+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:5px">';
    nF.forEach(function(f){
      if(f===aState.medX||f===aState.medY) return;
      var sel=aState.medM.includes(f);
      html+='<label style="display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:999px;cursor:pointer;font-size:11.5px;'
        +(sel?'background:rgba(244,114,182,.12);color:#f472b6;border:1px solid rgba(244,114,182,.3);':'background:rgba(124,58,237,.06);color:rgba(232,222,255,.4);border:1px solid rgba(124,58,237,.12);')
        +'">'
        +'<input type="checkbox" '+(sel?'checked':'')
        +' onchange="toggleMedM(this.dataset.fld,this.checked)" data-fld="'+escHtmlAttr(f)
        +'" style="accent-color:#f472b6;width:12px;height:12px"/>'+escHtml(f)+'</label>';
    });
    html+='</div></div>';
    html+='<div style="margin-bottom:9px"><label class="lbl">Bootstrap Samples</label>';
    html+='<div style="display:flex;gap:5px;flex-wrap:wrap">';
    [1000,2000,5000].forEach(function(n){
      html+='<button onclick="aState.medBootN='+n+';renderASub()" style="padding:5px 12px;border-radius:6px;font-size:11.5px;font-weight:700;cursor:pointer;font-family:Inter,sans-serif;'+(aState.medBootN===n?'background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff;border:none;':'background:rgba(124,58,237,.07);color:rgba(232,222,255,.5);border:1px solid rgba(124,58,237,.2);')+'">'+n+'</button>';
    });
    html+='</div></div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:4px;margin-bottom:4px" onclick="runMediation()">▶ Run</button>';
    html+='</div>';

    // Right column: live preview
    html+='<div>';
    if(!canPreview){
      html+='<div style="padding:28px 16px;text-align:center;color:rgba(232,222,255,.3);font-size:12px">Pilih X, Y, dan minimal 1 Mediator untuk melihat preview Baron-Kenny Steps.</div>';
    } else if(medPreview&&medPreview._err){
      html+='<div class="miss-warn">'+medPreview.msg+'</div>';
    } else if(medPreview){
      html+='<div style="font-size:11px;font-weight:700;color:#c084fc;margin-bottom:8px;text-transform:uppercase;letter-spacing:.8px">Baron-Kenny Steps (preview)</div>';
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
        var pFmtted=SE.pFmt?SE.pFmt(parseFloat(s.p)):parseFloat(s.p).toFixed(3);
        html+='<div style="background:rgba(124,58,237,.06);border:1px solid rgba(124,58,237,.12);border-left:3px solid '+(sig?'#34d399':'#f87171')+';border-radius:7px;padding:8px 10px">';
        html+='<div style="display:flex;justify-content:space-between;align-items:center">';
        html+='<span style="font-size:10.5px;font-weight:700;color:'+(sig?'#34d399':'rgba(232,222,255,.5)')+'">'+s.step+'</span>';
        html+='<span style="font-size:10px;background:rgba('+(sig?'5,150,105':'220,38,38')+',.12);color:'+(sig?'#34d399':'#f87171')+';padding:2px 7px;border-radius:999px;font-weight:700">'+(sig?'✓ sig':'✗ n.s.')+' p='+parseFloat(s.p).toFixed(3)+'</span>';
        html+='</div>';
        html+='<div style="font-size:11.5px;color:rgba(232,222,255,.7);margin-top:3px">'+s.desc+' → <b style="color:#e8deff">'+s.val+'</b></div>';
        html+='<div style="font-size:10.5px;color:rgba(232,222,255,.35);margin-top:2px">'+s.note+'</div>';
        html+='</div>';
      });
      html+='</div>';

      // Sobel + indirect effect preview
      if(medPreview.mediators&&medPreview.mediators.length){
        html+='<div style="margin-top:10px;font-size:11px;font-weight:700;color:#c084fc;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px">Indirect Effect (Sobel)</div>';
        medPreview.mediators.forEach(function(med){
          var sobelSig=parseFloat(med.sobel_p)<0.05;
          html+='<div style="background:rgba(244,114,182,.06);border:1px solid rgba(244,114,182,.15);border-radius:7px;padding:8px 10px;margin-bottom:5px">';
          html+='<div style="font-size:11px;font-weight:700;color:#f472b6">via '+escHtml(med.name)+'</div>';
          html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:6px">';
          html+='<div class="sb"><div class="sb-label">Indirect (a×b)</div><div class="sb-value" style="font-size:13px">'+SE.f4(med.indirect)+'</div></div>';
          html+='<div class="sb"><div class="sb-label">Sobel z</div><div class="sb-value" style="font-size:13px;color:'+(sobelSig?'#34d399':'#f87171')+'">'+SE.f4(med.sobel_z)+'</div><div class="sb-note">p='+parseFloat(med.sobel_p).toFixed(3)+'</div></div>';
          html+='</div></div>';
        });
      }
    }
    html+='</div>';
    html+='</div>';

    // Interpretation guide
    html+='<div class="card" style="margin-top:9px"><div class="sec-hd">Panduan Interpretasi</div>';
    html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;font-size:11.5px;color:rgba(232,222,255,.6);line-height:1.65">';
    html+='<div style="background:rgba(124,58,237,.06);border-radius:7px;padding:9px 11px"><b style="color:#34d399">Full Mediation</b><br>c signifikan, a & b signifikan, tapi c\' tidak signifikan → X hanya berpengaruh ke Y lewat M.</div>';
    html+='<div style="background:rgba(124,58,237,.06);border-radius:7px;padding:9px 11px"><b style="color:#fbbf24">Partial Mediation</b><br>c, a, b, dan c\' semuanya signifikan → X berpengaruh langsung ke Y dan juga lewat M.</div>';
    html+='<div style="background:rgba(124,58,237,.06);border-radius:7px;padding:9px 11px"><b style="color:#f87171">No Mediation</b><br>a atau b tidak signifikan → M tidak memediasi X→Y.</div>';
    html+='<div style="background:rgba(124,58,237,.06);border-radius:7px;padding:9px 11px"><b style="color:#a5f3fc">Bootstrap CI</b><br>Jika 95% CI dari indirect effect tidak melewati 0, maka mediasi signifikan (lebih akurat dari Sobel).</div>';
    html+='</div></div>';
  return html;
}

function renderSemForm(){
  const nF=numFields();
  let html='';
    // ── SEM State Defaults ──
    if(!aState.semLatents) aState.semLatents=[];
    if(aState.semLatentMap===undefined||aState.semLatentMap===null) aState.semLatentMap={};
    if(!aState.semPaths) aState.semPaths=[];   // array of {from,to} latent→latent or lat→observed
    if(!aState.semMode) aState.semMode='measurement'; // 'measurement' | 'structural'
    // Palet warna konstruk — dipakai di ketiga mode (measurement/structural/results), jadi harus di-declare di level atas cabang
    var semColors=['#e879f9','#818cf8','#34d399','#fbbf24','#67e8f9','#f472b6','#fb923c','#a78bfa'];

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
    html+='<div style="display:flex;gap:5px;margin-bottom:13px">';
    [{k:'measurement',l:'① Measurement Model (CFA)'},{k:'structural',l:'② Structural Model (Path)'},{k:'results',l:'③ Results & Fit'}].forEach(function(t){
      var act=aState.semMode===t.k;
      html+='<button onclick="aState.semMode=\''+t.k+'\';renderASub()" style="padding:7px 14px;border-radius:7px;font-size:11.5px;font-weight:700;cursor:pointer;font-family:Inter,sans-serif;flex:1;transition:all .15s;'+(act?'background:linear-gradient(135deg,rgba(232,121,249,.3),rgba(167,139,250,.2));color:#e879f9;border:1px solid rgba(232,121,249,.4);':'background:rgba(124,58,237,.06);color:rgba(232,222,255,.45);border:1px solid rgba(124,58,237,.15);')+'">'+t.l+'</button>';
    });
    html+='</div>';

    // ── MODE: MEASUREMENT ──────────────────────────────────────────────────
    if(aState.semMode==='measurement'){
      html+='<div class="grid2">';

      // Left: latent variable builder
      html+='<div class="card"><div class="sec-hd">Konstruk Laten (Latent Variables)</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:11px;line-height:1.6">Definisikan setiap konstruk laten dan pilih variabel observasinya (indikator/manifest). Setiap konstruk butuh ≥2 indikator.</div>';

      // Add latent button
      html+='<div style="display:flex;gap:6px;margin-bottom:12px">';
      html+='<input class="inp" id="sem-new-latent" placeholder="Nama konstruk (cth: Motivasi, Kinerja...)" style="flex:1;font-size:12px"/>';
      html+='<button class="btn btn-primary btn-sm" onclick="semAddLatent()" style="white-space:nowrap">+ Tambah</button>';
      html+='</div>';

      // List of latents
      if(!aState.semLatents.length){
        html+='<div class="chart-empty" style="padding:24px 0">Belum ada konstruk laten.<br>Tambah minimal 2 konstruk untuk SEM.</div>';
      }
      aState.semLatents.forEach(function(ln,li){
        var col=semColors[li%semColors.length];
        var indics=aState.semLatentMap[ln]||[];
        html+='<div style="margin-bottom:10px;padding:10px;border-radius:9px;border:1.5px solid '+col.replace('#','rgba(').replace(/(.{6})/,'$1,.28)')+';background:'+col.replace('#','rgba(').replace(/(.{6})/,'$1,.04)')+'">';
        html+='<div style="display:flex;align-items:center;gap:7px;margin-bottom:8px">';
        html+='<div style="width:9px;height:9px;border-radius:50%;background:'+col+';flex-shrink:0"></div>';
        html+='<input class="inp" style="flex:1;font-weight:700;font-size:12px;color:'+col+';padding:4px 9px;border-color:'+col.replace('#','rgba(').replace(/(.{6})/,'$1,.35)')+';" value="'+escHtmlAttr(ln)+'" oninput="semRenameLatent('+li+',this.value)" />';
        html+='<button onclick="semRemoveLatent('+li+')" style="background:rgba(248,113,113,.12);border:1px solid rgba(248,113,113,.25);border-radius:6px;color:#f87171;cursor:pointer;padding:3px 8px;font-size:11px;font-family:Inter,sans-serif">✕</button>';
        html+='</div>';
        html+='<div style="font-size:10.5px;color:rgba(232,222,255,.35);margin-bottom:5px">Indikator/Manifest untuk <b style="color:'+col+'">'+escHtml(ln)+'</b> (min 2):</div>';
        html+='<div style="display:flex;flex-wrap:wrap;gap:3px">';
        nF.forEach(function(v){
          var sel=(aState.semLatentMap[ln]||[]).includes(v);
          html+='<label style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:999px;cursor:pointer;font-size:11px;'+(sel?'background:'+col.replace('#','rgba(').replace(/(.{6})/,'$1,.18)')+';color:'+col+';border:1px solid '+col.replace('#','rgba(').replace(/(.{6})/,'$1,.4)')+'':'background:rgba(124,58,237,.06);color:rgba(232,222,255,.4);border:1px solid rgba(124,58,237,.12)')+'"><input type="checkbox" '+(sel?'checked':'')+' data-ln="'+escHtmlAttr(ln)+'" data-v="'+escHtmlAttr(v)+'" onchange="semToggleIndicator(this.dataset.ln,this.dataset.v,this.checked)" style="accent-color:'+col+';width:11px;height:11px"/>'+escHtml(v)+'</label>';
        });
        html+='</div>';
        if(indics.length<2) html+='<div style="font-size:10px;color:#f87171;margin-top:5px">⚠ Butuh min 2 indikator</div>';
        else html+='<div style="font-size:10px;color:#34d399;margin-top:5px">✓ '+indics.length+' indikator dipilih</div>';
        html+='</div>';
      });
      html+='</div>';

      // Right: live measurement model fit
      html+='<div class="card"><div class="sec-hd">Measurement Model Fit</div>';
      if(!semReady){
        html+='<div class="chart-empty" style="padding:32px 0">Tambah ≥1 konstruk dengan ≥2 indikator untuk melihat fit model pengukuran.</div>';
        html+='<div class="analyze-info-bar" style="margin-top:14px">';
        html+='<div class="analyze-info-title">Workflow SEM (AMOS)</div>';
        html+='<div class="analyze-info-desc">1. Definisikan konstruk laten + indikator<br>2. Gambar structural paths<br>3. Run dan cek fit: CFI, RMSEA, SRMR<br>4. Modifikasi model jika fit buruk<br>5. Interpretasi path coefficients</div>';
        html+='</div>';
      } else if(semResult&&semResult._err){
        html+='<div class="miss-warn">'+semResult.msg+'</div>';
      } else if(semResult){
        var fitCol=semResult.overallFit==='Good Fit'?'#34d399':semResult.overallFit==='Acceptable Fit'?'#fbbf24':'#f87171';
        html+='<div style="padding:11px 14px;border-radius:9px;background:rgba(0,0,0,.15);border:1.5px solid '+fitCol+';text-align:center;margin-bottom:13px">';
        html+='<div style="font-size:15px;font-weight:900;color:'+fitCol+';font-family:Playfair Display,serif">'+semResult.overallFit+'</div>';
        html+='<div style="font-size:10px;color:rgba(232,222,255,.4);margin-top:2px">N='+semResult.n+' · '+semResult.totalIndicators+' indikators · '+semResult.nLatent+' latent factors</div>';
        html+='</div>';
        html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">';
        function semFitCard(name,val,interp,col){return '<div class="sb"><div class="sb-label">'+escHtml(name)+'</div><div class="sb-value" style="color:'+col+'">'+val+'</div><div style="font-size:9.5px;color:'+col+';margin-top:2px">'+interp+'</div></div>';}
        var cficol2=semResult.CFI_raw>=0.95?'#34d399':semResult.CFI_raw>=0.90?'#fbbf24':'#f87171';
        var tlicol2=semResult.TLI_raw>=0.95?'#34d399':semResult.TLI_raw>=0.90?'#fbbf24':'#f87171';
        var rmsecol2=semResult.RMSEA_raw<=0.05?'#34d399':semResult.RMSEA_raw<=0.08?'#fbbf24':'#f87171';
        var srmrcol2=semResult.SRMR_raw<=0.05?'#34d399':semResult.SRMR_raw<=0.08?'#fbbf24':'#f87171';
        html+=semFitCard('CFI',semResult.CFI,semResult.CFIinterp,cficol2);
        html+=semFitCard('TLI',semResult.TLI,semResult.TLIinterp,tlicol2);
        html+=semFitCard('RMSEA',semResult.RMSEA,semResult.RMSEAinterp,rmsecol2);
        html+=semFitCard('SRMR',semResult.SRMR,semResult.SRMRinterp,srmrcol2);
        html+='</div>';
        html+='<div style="font-size:10.5px;color:rgba(232,222,255,.45);margin-bottom:6px">χ²('+semResult.dfModel+')='+semResult.chiSq+', p='+semResult.pChiSq+' · RMSEA CI: ['+semResult.RMSEA_lo+', '+semResult.RMSEA_hi+']</div>';
        // AVE + CR
        html+='<div style="margin-top:11px"><div class="sec-hd" style="font-size:11.5px;margin-bottom:8px">Construct Validity</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th>Konstruk</th><th>AVE</th><th>CR</th><th>α</th><th>Validity</th></tr></thead><tbody>';
        semResult.constructs.forEach(function(c){
          var avecol=parseFloat(c.AVE)>=0.5?'#34d399':parseFloat(c.AVE)>=0.4?'#fbbf24':'#f87171';
          var crcol=parseFloat(c.CR)>=0.7?'#34d399':parseFloat(c.CR)>=0.6?'#fbbf24':'#f87171';
          var alphacol=parseFloat(c.alpha)>=0.7?'#34d399':parseFloat(c.alpha)>=0.6?'#fbbf24':'#f87171';
          var valid=parseFloat(c.AVE)>=0.5&&parseFloat(c.CR)>=0.7;
          html+='<tr><td class="td-label" style="color:'+semColors[semResult.constructs.indexOf(c)%semColors.length]+';font-weight:700">'+escHtml(c.name)+'</td>';
          html+='<td class="td-num" style="color:'+avecol+'">'+c.AVE+'</td>';
          html+='<td class="td-num" style="color:'+crcol+'">'+c.CR+'</td>';
          html+='<td class="td-num" style="color:'+alphacol+'">'+c.alpha+'</td>';
          html+='<td><span class="tag" style="font-size:9px;'+(valid?'background:rgba(52,211,153,.12);color:#34d399;border:1px solid rgba(52,211,153,.25)':'background:rgba(251,191,36,.1);color:#fbbf24;border:1px solid rgba(251,191,36,.25)')+'">'+(valid?'✓ Valid':'⚠ Check')+'</span></td></tr>';
        });
        html+='</tbody></table></div>';
        html+='<div style="font-size:10px;color:rgba(232,222,255,.3);margin-top:6px">AVE ≥ 0.50 = convergent validity · CR ≥ 0.70 = reliability · AVE > r² antar konstruk = discriminant validity</div>';
        html+='</div>';
      }
      html+='</div></div>';

      // Factor Loadings Table
      if(semResult&&!semResult._err){
        html+='<div class="card"><div class="sec-hd">Standardized Factor Loadings (λ)</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th>Konstruk</th><th>Indikator</th><th>λ (Loading)</th><th>h²</th><th>t-value*</th><th>Status</th></tr></thead><tbody>';
        semResult.loadings.forEach(function(row){
          var lamNum=parseFloat(row.lambda);
          var lamCol=lamNum>=0.7?'#34d399':lamNum>=0.5?'#a5f3fc':lamNum>=0.3?'#fbbf24':'#f87171';
          var constructIdx=aState.semLatents.indexOf(row.construct);
          var col=semColors[constructIdx>=0?constructIdx%semColors.length:0];
          html+='<tr>';
          if(row.firstInConstruct) html+='<td class="td-label" rowspan="'+row.constructCount+'" style="color:'+col+';font-weight:800;vertical-align:top;padding-top:10px">'+escHtml(row.construct)+'</td>';
          html+='<td class="td-label">'+escHtml(row.indicator)+'</td>';
          html+='<td class="td-num" style="color:'+lamCol+';font-weight:'+(lamNum>=0.5?700:400)+'">'+row.lambda+'</td>';
          html+='<td class="td-num" style="color:'+(parseFloat(row.h2)>=0.4?'#a5f3fc':'#f87171')+'">'+row.h2+'</td>';
          html+='<td class="td-num" style="color:rgba(232,222,255,.55)">'+row.tvalue+'</td>';
          html+='<td><span class="tag" style="font-size:9px;'+(lamNum>=0.5?'background:rgba(52,211,153,.12);color:#34d399;border:1px solid rgba(52,211,153,.25)':'background:rgba(248,113,113,.1);color:#f87171;border:1px solid rgba(248,113,113,.2)')+'">'+( lamNum>=0.5?'✓ Adequate':'✗ Weak' )+'</span></td>';
          html+='</tr>';
        });
        html+='</tbody></table></div>';
        html+='<div style="font-size:10px;color:rgba(232,222,255,.3);margin-top:6px">*Estimasi t-value (reference: t > 1.96 = signifikan p < .05)</div>';
        html+='</div>';
      }
    }

    // ── MODE: STRUCTURAL ──────────────────────────────────────────────────
    else if(aState.semMode==='structural'){
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">Structural Paths (Hubungan Antar Konstruk)</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:11px;line-height:1.6">Definisikan path kausal antar konstruk laten. Di AMOS: gambar anak panah dari konstruk eksogen ke endogen.</div>';

      if(aState.semLatents.length<2){
        html+='<div class="miss-warn">⚠ Butuh minimal 2 konstruk laten di Measurement Model.</div>';
      } else {
        html+='<div style="display:flex;gap:7px;margin-bottom:10px;align-items:center">';
        html+='<div style="flex:1"><label class="lbl">Dari (Eksogen)</label>';
        html+=mkSelect('sem-from',aState.semLatents,aState.semPathFrom||aState.semLatents[0],'aState.semPathFrom=val','Variabel asal');
        html+='</div>';
        html+='<div style="display:flex;align-items:flex-end;padding-bottom:4px"><span style="color:#e879f9;font-size:18px;font-weight:900">→</span></div>';
        html+='<div style="flex:1"><label class="lbl">Ke (Endogen)</label>';
        html+=mkSelect('sem-to',aState.semLatents,aState.semPathTo||aState.semLatents[aState.semLatents.length-1],'aState.semPathTo=val','Variabel tujuan');
        html+='</div>';
        html+='</div>';
        html+='<button class="btn btn-primary btn-sm" onclick="semAddPath()" style="margin-bottom:12px">+ Tambah Path</button>';

        // Path list
        if(!aState.semPaths.length){
          html+='<div class="chart-empty" style="padding:16px 0">Belum ada structural path.<br>Tambah path hubungan antar konstruk.</div>';
        } else {
          html+='<div style="display:flex;flex-direction:column;gap:6px">';
          aState.semPaths.forEach(function(p,pi){
            html+='<div style="display:flex;align-items:center;gap:7px;padding:8px 11px;background:rgba(232,121,249,.06);border:1px solid rgba(232,121,249,.2);border-radius:8px">';
            var fromCol=semColors[aState.semLatents.indexOf(p.from)%semColors.length]||'#e879f9';
            var toCol=semColors[aState.semLatents.indexOf(p.to)%semColors.length]||'#818cf8';
            html+='<span style="font-weight:700;color:'+fromCol+';font-size:12px">'+escHtml(p.from)+'</span>';
            html+='<span style="color:#e879f9;font-size:16px;font-weight:900">→</span>';
            html+='<span style="font-weight:700;color:'+toCol+';font-size:12px;flex:1">'+escHtml(p.to)+'</span>';
            if(semResult&&!semResult._err){
              var pathRes=semResult.paths&&semResult.paths.find(function(r){return r.from===p.from&&r.to===p.to;});
              if(pathRes){
                var bcol=parseFloat(pathRes.beta)>0?'#34d399':'#f472b6';
                var sigcol=parseFloat(pathRes.p)<0.05?'#34d399':'#f87171';
                html+='<span class="tag" style="background:rgba(52,211,153,.08);color:'+bcol+';border:1px solid rgba(52,211,153,.2);font-size:10px">β='+pathRes.beta+'</span>';
                html+='<span class="tag" style="background:rgba(52,211,153,.05);color:'+sigcol+';border:1px solid '+sigcol+'35;font-size:10px">p='+pathRes.p_fmt+'</span>';
              }
            }
            html+='<button onclick="semRemovePath('+pi+')" style="background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.2);border-radius:5px;color:#f87171;cursor:pointer;padding:2px 7px;font-size:11px;font-family:Inter,sans-serif">✕</button>';
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
        html+='<div class="chart-empty" style="padding:32px 0">Tambah konstruk di Measurement Model untuk melihat diagram.</div>';
      }
      html+='</div></div>';

      // Run button
      html+='<div class="card" style="text-align:center;padding:14px">';
      html+='<button class="btn btn-primary btn-sm" onclick="runSEM()" style="padding:11px 40px;font-size:13px">▶ Run</button>';
      html+='<div style="font-size:10.5px;color:rgba(232,222,255,.35);margin-top:7px">Akan menghitung: CFA measurement model + structural paths + fit indices + path coefficients</div>';
      html+='</div>';
    }

    // ── MODE: RESULTS ──────────────────────────────────────────────────
    else if(aState.semMode==='results'){
      if(!semReady){
        html+='<div class="card" style="text-align:center;padding:38px"><div style="font-size:32px;margin-bottom:9px">⬡</div><div style="color:#475569;font-size:13px">Lengkapi Measurement Model terlebih dahulu (≥2 konstruk, ≥2 indikator masing-masing).</div></div>';
      } else if(semResult&&semResult._err){
        html+='<div class="card"><div class="miss-warn">'+escHtml(semResult.msg)+'</div></div>';
      } else if(semResult){
        // Overall fit summary
        var fitCol2=semResult.overallFit==='Good Fit'?'#34d399':semResult.overallFit==='Acceptable Fit'?'#fbbf24':'#f87171';
        html+='<div class="card">';
        html+='<div class="sec-hd">Model Fit Summary</div>';
        html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:7px;margin-bottom:13px">';
        html+='<div class="sb"><div class="sb-label">Overall Fit</div><div class="sb-value" style="color:'+fitCol2+'">'+semResult.overallFit+'</div></div>';
        html+='<div class="sb"><div class="sb-label">CFI</div><div class="sb-value" style="color:'+(semResult.CFI_raw>=0.95?'#34d399':semResult.CFI_raw>=0.90?'#fbbf24':'#f87171')+'">'+semResult.CFI+'</div><div class="sb-note">≥ .95 = good</div></div>';
        html+='<div class="sb"><div class="sb-label">RMSEA</div><div class="sb-value" style="color:'+(semResult.RMSEA_raw<=0.05?'#34d399':semResult.RMSEA_raw<=0.08?'#fbbf24':'#f87171')+'">'+semResult.RMSEA+'</div><div class="sb-note">≤ .06 = good</div></div>';
        html+='<div class="sb"><div class="sb-label">SRMR</div><div class="sb-value" style="color:'+(semResult.SRMR_raw<=0.05?'#34d399':semResult.SRMR_raw<=0.08?'#fbbf24':'#f87171')+'">'+semResult.SRMR+'</div><div class="sb-note">≤ .08 = good</div></div>';
        html+='<div class="sb"><div class="sb-label">χ²/df</div><div class="sb-value" style="color:'+(semResult.chiRatio<=2?'#34d399':semResult.chiRatio<=3?'#fbbf24':'#f87171')+'">'+semResult.chiRatio+'</div><div class="sb-note">≤ 2.0 = good</div></div>';
        html+='<div class="sb"><div class="sb-label">TLI</div><div class="sb-value" style="color:'+(semResult.TLI_raw>=0.95?'#34d399':semResult.TLI_raw>=0.90?'#fbbf24':'#f87171')+'">'+semResult.TLI+'</div><div class="sb-note">≥ .95 = good</div></div>';
        html+='</div>';
        html+='<div style="font-size:10.5px;color:rgba(232,222,255,.45)">χ²('+semResult.dfModel+')='+semResult.chiSq+', p='+semResult.pChiSq+' &nbsp;·&nbsp; N='+semResult.n+' &nbsp;·&nbsp; RMSEA 90% CI: ['+semResult.RMSEA_lo+', '+semResult.RMSEA_hi+']</div>';
        html+='</div>';

        // Path coefficients table
        if(semResult.paths&&semResult.paths.length){
          html+='<div class="card"><div class="sec-hd">Structural Path Coefficients</div>';
          html+='<div class="tbl-wrap"><table><thead><tr><th>Dari</th><th>Ke</th><th>β (Std)</th><th>SE</th><th>t</th><th>p</th><th>Sig</th><th>Kesimpulan</th></tr></thead><tbody>';
          semResult.paths.forEach(function(p){
            var betaNum=parseFloat(p.beta);
            var bcol=Math.abs(betaNum)>=0.3?'#34d399':Math.abs(betaNum)>=0.1?'#fbbf24':'#f87171';
            var psig=parseFloat(p.p)<0.05;
            var fromIdx=aState.semLatents.indexOf(p.from);
            var toIdx=aState.semLatents.indexOf(p.to);
            var fromCol=semColors[fromIdx>=0?fromIdx%semColors.length:0];
            var toCol=semColors[toIdx>=0?toIdx%semColors.length:1];
            html+='<tr>';
            html+='<td class="td-label" style="color:'+fromCol+';font-weight:700">'+escHtml(p.from)+'</td>';
            html+='<td class="td-label" style="color:'+toCol+';font-weight:700">'+escHtml(p.to)+'</td>';
            html+='<td class="td-num" style="color:'+bcol+';font-weight:700">'+p.beta+'</td>';
            html+='<td class="td-num" style="color:rgba(232,222,255,.5)">'+p.se+'</td>';
            html+='<td class="td-num">'+p.t+'</td>';
            html+='<td class="td-num" style="color:'+(psig?'#34d399':'#f87171')+'">'+(psig?'<b>':'')+p.p_fmt+(psig?'</b>':'')+'</td>';
            html+='<td>'+sigBadge(p.p)+'</td>';
            html+='<td style="font-size:11px;color:rgba(232,222,255,.55)">'+escHtml(p.interpretation)+'</td>';
            html+='</tr>';
          });
          html+='</tbody></table></div></div>';
        }

        // Indirect effects (if paths exist)
        if(semResult.indirectEffects&&semResult.indirectEffects.length){
          html+='<div class="card"><div class="sec-hd">Indirect Effects (Mediasi via Konstruk Laten)</div>';
          html+='<div class="tbl-wrap"><table><thead><tr><th>X</th><th>M</th><th>Y</th><th>Indirect β</th><th>Bootstrap CI 95%</th><th>Sig</th></tr></thead><tbody>';
          semResult.indirectEffects.forEach(function(ie){
            var ciSig=parseFloat(ie.ci_lo)>0||parseFloat(ie.ci_hi)<0;
            html+='<tr>';
            html+='<td class="td-label" style="color:'+semColors[0]+';font-weight:700">'+escHtml(ie.x)+'</td>';
            html+='<td class="td-label" style="color:'+semColors[2]+'">'+escHtml(ie.m)+'</td>';
            html+='<td class="td-label" style="color:'+semColors[1]+';font-weight:700">'+escHtml(ie.y)+'</td>';
            html+='<td class="td-num" style="color:'+(Math.abs(parseFloat(ie.indirect))>=0.1?'#34d399':'#fbbf24')+'">'+ie.indirect+'</td>';
            html+='<td class="td-num" style="font-size:11px;color:'+(ciSig?'#34d399':'#f87171')+'">['+ie.ci_lo+', '+ie.ci_hi+']</td>';
            html+='<td><span class="tag" style="font-size:9px;'+(ciSig?'background:rgba(52,211,153,.12);color:#34d399;border:1px solid rgba(52,211,153,.25)':'background:rgba(248,113,113,.1);color:#f87171;border:1px solid rgba(248,113,113,.2)')+'">'+(ciSig?'✓ Sig':'n.s.')+'</span></td>';
            html+='</tr>';
          });
          html+='</tbody></table></div>';
          html+='<div style="font-size:10px;color:rgba(232,222,255,.3);margin-top:6px">Bootstrap CI (n=1000). Jika CI tidak mencakup 0 → indirect effect signifikan.</div>';
          html+='</div>';
        }

        // AMOS Syntax equivalent
        html+='<div class="card"><div class="sec-hd">AMOS / lavaan Syntax Equivalent</div>';
        html+='<div style="margin-bottom:8px;font-size:11px;color:rgba(232,222,255,.4)">R lavaan syntax untuk model ini:</div>';
        html+='<textarea class="syn-area" readonly style="min-height:160px;color:#a5f3fc;font-size:11px">'+escHtml(generateLavaanSyntax(aState.semLatents,aState.semLatentMap,aState.semPaths))+'</textarea>';
        html+='<div style="font-size:10px;color:rgba(232,222,255,.3);margin-top:6px">Di AMOS: gunakan path diagram GUI. Di R: <code style="color:#c084fc">library(lavaan); fit &lt;- sem(model, data=df)</code></div>';
        html+='</div>';

        // Model interpretation guide
        html+='<div class="card"><div class="sec-hd">Panduan Interpretasi SEM</div>';
        html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px;font-size:11.5px;color:rgba(232,222,255,.6);line-height:1.6">';
        [['#34d399','Good Fit','CFI ≥ .95, RMSEA ≤ .06, SRMR ≤ .08, χ²/df ≤ 2'],
         ['#fbbf24','Acceptable Fit','CFI ≥ .90, RMSEA ≤ .08, SRMR ≤ .10'],
         ['#f87171','Poor Fit','Perlu modifikasi model: cek MI, re-specify'],
         ['#818cf8','β (Path Coef)','Standarized: ≥ .30 = medium effect, ≥ .50 = large'],
         ['#e879f9','AVE ≥ .50','Convergent validity terpenuhi untuk setiap konstruk'],
         ['#a5f3fc','CR ≥ .70','Construct reliability (internal consistency)']
        ].forEach(function(r){
          html+='<div style="background:rgba(124,58,237,.06);border-radius:7px;padding:9px 11px"><b style="color:'+r[0]+'">'+r[1]+'</b><br>'+r[2]+'</div>';
        });
        html+='</div></div>';

        // Run SEM to output button
        html+='<div style="text-align:center;margin-top:6px"><button class="btn btn-primary btn-sm" onclick="runSEM()" style="padding:11px 36px">▶ Run</button></div>';
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
    html+='<div style="margin-bottom:10px"><label class="lbl">Predictors (Numerik) <span style="color:rgba(232,222,255,.4);font-size:10px">— pilih ≥1</span></label>';
    html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:6px">';
    nF.forEach(function(f){
      if(f===aState.ldaGroup) return;
      var sel=aState.ldaPreds.indexOf(f)>=0;
      html+='<button onclick="(function(){var i=aState.ldaPreds.indexOf(\''+f+'\');if(i>=0)aState.ldaPreds.splice(i,1);else aState.ldaPreds.push(\''+f+'\');aState.ldaResult=null;renderASub();})()" style="padding:4px 10px;border-radius:6px;border:1.5px solid '+(sel?'#38bdf8':'rgba(124,58,237,.3)')+';background:'+(sel?'rgba(56,189,248,.15)':'rgba(124,58,237,.06)')+';color:'+(sel?'#38bdf8':'rgba(232,222,255,.5)')+';font-size:11px;cursor:pointer;font-family:Inter,sans-serif;font-weight:'+(sel?'700':'400')+'">'+(sel?'✓ ':'')+f+'</button>';
    });
    html+='</div></div>';
    html+='<button class="btn btn-primary btn-sm" onclick="runDiscriminant()" style="margin-top:4px">▶ Run</button>';
    html+='</div>';

    if(ldaResult&&ldaResult._err){
      html+='<div class="card"><div class="miss-warn">'+ldaResult.msg+'</div></div>';
    } else if(ldaResult){
      var lr=ldaResult;
      // Model fit summary
      html+='<div class="card"><div class="sec-hd">Model Summary</div>';
      html+='<div class="stats-grid" style="grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:6px;margin-bottom:10px">';
      html+='<div class="sb"><div class="sb-label">N</div><div class="sb-value">'+lr.n+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Groups</div><div class="sb-value">'+lr.groups.length+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Predictors</div><div class="sb-value">'+lr.preds.length+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Wilks\' λ</div><div class="sb-value">'+lr.wilksLambda+'</div><div class="sb-note">p = '+lr.wilksP+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Accuracy</div><div class="sb-value" style="color:'+(parseFloat(lr.accuracy)>=70?'#34d399':parseFloat(lr.accuracy)>=50?'#fbbf24':'#f87171')+'">'+lr.accuracy+'%</div></div>';
      html+='<div class="sb"><div class="sb-label">Functions</div><div class="sb-value">'+lr.nFunctions+'</div></div>';
      html+='</div></div>';

      // Eigenvalues table
      html+='<div class="card"><div class="sec-hd">Eigenvalues & Canonical Correlations</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Function</th><th>Eigenvalue</th><th>% Variance</th><th>Cumulative %</th><th>Canonical r</th></tr></thead><tbody>';
      lr.eigenvalues.forEach(function(e,i){
        html+='<tr><td>'+( i+1)+'</td><td class="td-num">'+e.eigenvalue+'</td><td class="td-num">'+e.pctVar+'%</td><td class="td-num">'+e.cumPct+'%</td><td class="td-num" style="color:#38bdf8;font-weight:700">'+e.canonicalR+'</td></tr>';
      });
      html+='</tbody></table></div></div>';

      // Standardized coefficients
      html+='<div class="card"><div class="sec-hd">Standardized Discriminant Function Coefficients</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Predictor</th>';
      lr.eigenvalues.forEach(function(e,i){ html+='<th>Function '+(i+1)+'</th>'; });
      html+='</tr></thead><tbody>';
      lr.preds.forEach(function(p,pi){
        html+='<tr><td class="td-label">'+p+'</td>';
        lr.stdCoefs.forEach(function(fc){ html+='<td class="td-num" style="color:'+(Math.abs(fc[pi])>=0.3?'#38bdf8':'rgba(232,222,255,.6)')+'">'+fc[pi]+'</td>'; });
        html+='</tr>';
      });
      html+='</tbody></table></div></div>';

      // Group means
      html+='<div class="card"><div class="sec-hd">Group Means (Discriminant Scores)</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Group</th><th>N</th>';
      lr.preds.forEach(function(p){ html+='<th>'+escHtml(p)+'</th>'; });
      html+='</tr></thead><tbody>';
      lr.groupStats.forEach(function(g){
        html+='<tr><td class="td-label" style="color:#38bdf8;font-weight:700">'+g.label+'</td><td class="td-num">'+g.n+'</td>';
        g.means.forEach(function(m){ html+='<td class="td-num">'+m+'</td>'; });
        html+='</tr>';
      });
      html+='</tbody></table></div></div>';

      // Classification table
      html+='<div class="card"><div class="sec-hd">Classification Results</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Actual \\ Predicted</th>';
      lr.groups.forEach(function(g){ html+='<th>'+escHtml(g)+'</th>'; });
      html+='<th>Total</th><th>% Correct</th></tr></thead><tbody>';
      lr.classTable.forEach(function(row,i){
        var tot=row.counts.reduce(function(s,v){return s+v;},0);
        html+='<tr><td class="td-label" style="color:#38bdf8;font-weight:700">'+lr.groups[i]+'</td>';
        row.counts.forEach(function(c,j){
          var isDiag=i===j;
          html+='<td class="td-num" style="'+(isDiag?'color:#34d399;font-weight:700;background:rgba(52,211,153,.08)':'')+'">'+c+'</td>';
        });
        html+='<td class="td-num">'+tot+'</td><td class="td-num" style="color:#34d399">'+row.pctCorrect+'%</td></tr>';
      });
      html+='</tbody></table></div>';
      html+='<div style="margin-top:8px;font-size:11px;color:rgba(232,222,255,.5)">Overall accuracy: <b style="color:#34d399">'+lr.accuracy+'%</b></div></div>';

      // Structure matrix
      html+='<div class="card"><div class="sec-hd">Structure Matrix (Pooled Within-Groups Correlations)</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Predictor</th>';
      lr.eigenvalues.forEach(function(e,i){ html+='<th>Function '+(i+1)+'</th>'; });
      html+='</tr></thead><tbody>';
      lr.preds.forEach(function(p,pi){
        html+='<tr><td class="td-label">'+p+'</td>';
        lr.structureMatrix.forEach(function(fc){ html+='<td class="td-num" style="color:'+(Math.abs(fc[pi])>=0.3?'#fb923c':'rgba(232,222,255,.6)')+'">'+fc[pi]+'</td>'; });
        html+='</tr>';
      });
      html+='</tbody></table><div style="margin-top:6px;font-size:10px;color:rgba(232,222,255,.3)">|r| ≥ .30 = practically significant loading</div></div></div>';

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
    html+='<div style="margin-bottom:10px"><label class="lbl">Variables (Numerik) <span style="color:rgba(232,222,255,.4);font-size:10px">— pilih ≥2</span></label>';
    html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:6px">';
    nF.forEach(function(f){
      var sel=aState.clVars.indexOf(f)>=0;
      html+='<button onclick="(function(){var i=aState.clVars.indexOf(\''+f+'\');if(i>=0)aState.clVars.splice(i,1);else aState.clVars.push(\''+f+'\');aState.clResult=null;renderASub();})()" style="padding:4px 10px;border-radius:6px;border:1.5px solid '+(sel?'#4ade80':'rgba(124,58,237,.3)')+';background:'+(sel?'rgba(74,222,128,.15)':'rgba(124,58,237,.06)')+';color:'+(sel?'#4ade80':'rgba(232,222,255,.5)')+';font-size:11px;cursor:pointer;font-family:Inter,sans-serif;font-weight:'+(sel?'700':'400')+'">'+(sel?'✓ ':'')+f+'</button>';
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
      html+='<div class="card"><div class="miss-warn">'+clResult.msg+'</div></div>';
    } else if(clResult){
      var cr=clResult;
      // Summary
      html+='<div class="card"><div class="sec-hd">Cluster Summary</div>';
      html+='<div class="stats-grid" style="grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:6px;margin-bottom:10px">';
      html+='<div class="sb"><div class="sb-label">N Cases</div><div class="sb-value">'+cr.n+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Variables</div><div class="sb-value">'+cr.vars.length+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Clusters (k)</div><div class="sb-value" style="color:#4ade80">'+cr.k+'</div></div>';
      if(cr.method==='kmeans'){
        html+='<div class="sb"><div class="sb-label">Within-SS</div><div class="sb-value">'+cr.totalWSS+'</div></div>';
        html+='<div class="sb"><div class="sb-label">Between-SS</div><div class="sb-value">'+cr.totalBSS+'</div></div>';
        html+='<div class="sb"><div class="sb-label">Silhouette</div><div class="sb-value" style="color:'+(cr.silhouette>=0.5?'#34d399':cr.silhouette>=0.25?'#fbbf24':'#f87171')+'">'+cr.silhouette+'</div></div>';
      } else {
        html+='<div class="sb"><div class="sb-label">Linkage</div><div class="sb-value" style="font-size:12px">'+cr.linkage+'</div></div>';
        html+='<div class="sb"><div class="sb-label">Silhouette</div><div class="sb-value" style="color:'+(cr.silhouette>=0.5?'#34d399':cr.silhouette>=0.25?'#fbbf24':'#f87171')+'">'+cr.silhouette+'</div></div>';
      }
      html+='</div>';
      // Silhouette interpretation
      var silVal=parseFloat(cr.silhouette);
      var silLabel=silVal>=0.7?'Strong structure':silVal>=0.5?'Reasonable structure':silVal>=0.25?'Weak structure':'No substantial structure';
      var silColor=silVal>=0.5?'#34d399':silVal>=0.25?'#fbbf24':'#f87171';
      html+='<div style="padding:8px 11px;background:rgba(74,222,128,.06);border:1px solid rgba(74,222,128,.18);border-radius:8px;font-size:11.5px;color:rgba(232,222,255,.7)">Silhouette = <b style="color:'+silColor+'">'+cr.silhouette+'</b> → <b style="color:'+silColor+'">'+escHtml(silLabel)+'</b><br><span style="font-size:10px;color:rgba(232,222,255,.4)">≥0.70 = strong · ≥0.50 = reasonable · ≥0.25 = weak · <0.25 = poor</span></div>';
      html+='</div>';

      // Cluster sizes
      html+='<div class="card"><div class="sec-hd">Cluster Sizes & Centroids</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Cluster</th><th>N</th><th>%</th>';
      cr.vars.forEach(function(v){ html+='<th>'+escHtml(v)+' (mean)</th>'; });
      html+='</tr></thead><tbody>';
      var clColors=['#4ade80','#38bdf8','#f472b6','#fb923c','#a78bfa','#34d399','#fbbf24','#e879f9'];
      cr.clusters.forEach(function(c,i){
        html+='<tr><td><span style="display:inline-flex;align-items:center;gap:5px"><span style="width:10px;height:10px;border-radius:50%;background:'+clColors[i%clColors.length]+';display:inline-block"></span><b style="color:'+clColors[i%clColors.length]+'">C'+(i+1)+'</b></span></td>';
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
        html+='<div style="font-size:10px;color:rgba(232,222,255,.35);margin-top:6px">Look for the "elbow" — the k where adding more clusters gives diminishing returns.</div>';
        html+='</div>';
      }

      // ANOVA per variable
      html+='<div class="card"><div class="sec-hd">ANOVA per Variable (Cluster Discrimination)</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Variable</th><th>F</th><th>df1</th><th>df2</th><th>p</th><th>Sig</th></tr></thead><tbody>';
      cr.anova.forEach(function(a){
        var sig=parseFloat(a.p)<0.05;
        html+='<tr><td class="td-label">'+a.variable+'</td><td class="td-num">'+a.F+'</td><td class="td-num">'+a.df1+'</td><td class="td-num">'+a.df2+'</td>';
        html+='<td class="td-num" style="color:'+(sig?'#34d399':'#f87171')+'">'+(sig?'<b>':'')+a.p_fmt+(sig?'</b>':'')+'</td>';
        html+='<td>'+sigBadge(a.p)+'</td></tr>';
      });
      html+='</tbody></table><div style="margin-top:6px;font-size:10px;color:rgba(232,222,255,.35)">Variables with significant F contribute most to cluster separation.</div></div></div>';
    }
  return html;
}

function renderRocForm(){
  const nF=numFields(),aF=allFields();
  let html='';
    if(!aState.rocProb&&nF.length) aState.rocProb=nF[0];
    if(!aState.rocTrue&&aF.length) aState.rocTrue=aF[aF.length>1?aF.length-1:0];
    if(!aState.rocCompare) aState.rocCompare=[];
    var rocPrv=aState.rocProb&&aState.rocTrue?tryStats(function(){return computeROC(data,aState.rocProb,aState.rocTrue,aState.rocPosClass);}):null;

    if(currentASub==='roc'){
      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd"> ROC Curve Analysis</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:11px;line-height:1.65">Receiver Operating Characteristic curve — visualisasikan trade-off sensitivity vs specificity. AUC mengukur kemampuan diskriminasi model secara keseluruhan.</div>';
      html+=mkSelect('roc-prob',nF,aState.rocProb,'aState.rocProb=val;renderASub()','Predicted Probability / Score');
      html+='<div style="margin-top:8px">'+mkSelect('roc-true',aF,aState.rocTrue,'aState.rocTrue=val;renderASub()','True Binary Outcome')+'</div>';
      // Positive class selector
      if(aState.rocTrue){
        var uniq=[...new Set(data.map(function(r){return String(r[aState.rocTrue]||'');}).filter(Boolean))].slice(0,10);
        if(uniq.length>=2){
          html+='<div style="margin-top:8px"><label class="lbl">Positive Class (event=1)</label>';
          html+='<div class="row" style="gap:5px;margin-top:5px;flex-wrap:wrap">';
          uniq.forEach(function(u){html+='<button class="btn '+(aState.rocPosClass===u?'btn-primary':'btn-ghost')+' btn-sm" onclick="aState.rocPosClass=this.dataset.v;renderASub()" data-v="'+escHtmlAttr(u)+'">'+escHtml(u)+'</button>';});
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
        var aucCol=parseFloat(rocPrv.auc)>=0.9?'#34d399':parseFloat(rocPrv.auc)>=0.8?'#a5f3fc':parseFloat(rocPrv.auc)>=0.7?'#fbbf24':'#f87171';
        html+='<span class="tag" style="background:rgba(52,211,153,.1);color:'+aucCol+';border:1px solid '+aucCol+'40">AUC='+rocPrv.auc+' ('+rocPrv.aucInterp+')</span>';
        html+='</div>';
      }
      if(rocPrv&&rocPrv._err) html+='<div style="color:#f87171;font-size:11px;margin-top:8px">'+rocPrv.msg+'</div>';
      html+='</div>';
      html+='<div class="card"><div class="sec-hd">ROC Plot</div>';
      if(rocPrv&&!rocPrv._err){
        html+=svgROC(rocPrv);
        html+='<div style="margin-top:10px"><div class="sec-hd" style="margin-bottom:6px">Optimal Operating Point (Youden)</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th>Threshold</th><th>Sensitivity</th><th>Specificity</th><th>PPV</th><th>NPV</th><th>F1</th><th>Youden J</th></tr></thead><tbody>';
        html+='<tr><td class="td-num" style="color:#f472b6">'+rocPrv.optThresh+'</td><td class="td-num">'+rocPrv.optSens+'</td><td class="td-num">'+rocPrv.optSpec+'</td><td class="td-num">'+rocPrv.optPPV+'</td><td class="td-num">'+rocPrv.optNPV+'</td><td class="td-num">'+rocPrv.optF1+'</td><td class="td-num" style="color:#34d399">'+rocPrv.optYouden+'</td></tr>';
        html+='</tbody></table></div>';
        // Full threshold table (top 10 rows)
        html+='<div style="margin-top:10px"><div class="sec-hd" style="margin-bottom:5px">Full Threshold Table (top points)</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th>Threshold</th><th>TPR (Sens)</th><th>FPR (1-Spec)</th><th>Precision</th><th>F1</th></tr></thead><tbody>';
        var step=Math.max(1,Math.floor(rocPrv.curve.length/12));
        rocPrv.curve.filter(function(_,i){return i%step===0;}).slice(0,14).forEach(function(pt){
          html+='<tr><td class="td-num">'+SE.f4(pt.t)+'</td><td class="td-num">'+SE.f4(pt.tpr)+'</td><td class="td-num">'+SE.f4(pt.fpr)+'</td><td class="td-num">'+SE.f4(pt.ppv||0)+'</td><td class="td-num">'+SE.f4(pt.f1||0)+'</td></tr>';
        });
        html+='</tbody></table></div></div>';
      } else { html+='<div class="chart-empty">Select probability score and outcome to see ROC curve</div>'; }
      html+='</div></div>';
    }

    else if(currentASub==='roc_compare'){
      html+='<div class="card"><div class="sec-hd"> Compare Multiple ROC Curves</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:10px;line-height:1.65">Bandingkan AUC dari beberapa model/prediktor secara visual. Gunakan DeLong test untuk uji perbedaan AUC yang signifikan.</div>';
      html+='<div style="margin-bottom:10px">'+mkSelect('roc-true-cmp',aF,aState.rocTrue,'aState.rocTrue=val;renderASub()','True Binary Outcome')+'</div>';
      html+='<label class="lbl">Predicted Scores to Compare</label>';
      html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin:6px 0 10px">';
      nF.forEach(function(v){
        var sel=(aState.rocCompare||[]).includes(v);
        html+='<label style="display:flex;align-items:center;gap:4px;font-size:11px;cursor:pointer;padding:4px 8px;border-radius:6px;background:'+(sel?'rgba(103,232,249,.12)':'rgba(255,255,255,.03)')+';border:1px solid '+(sel?'rgba(103,232,249,.3)':'rgba(255,255,255,.07)')+';">';
        html+='<input type="checkbox" '+(sel?'checked':'')+' onchange="toggleROCCompare(this.dataset.fld,this.checked)" data-fld="'+escHtmlAttr(v)+'" style="accent-color:#67e8f9"/>'+escHtml(v)+'</label>';
      });
      html+='</div>';
      if(aState.rocTrue&&aState.rocCompare&&aState.rocCompare.length>=2){
        var cmpCurves=aState.rocCompare.map(function(v){
          try{return {name:v,roc:computeROC(data,v,aState.rocTrue,aState.rocPosClass)};}
          catch(e){return {name:v,roc:{_err:true}};}
        }).filter(function(c){return !c.roc._err;});
        if(cmpCurves.length>=2){
          html+=svgROCCompare(cmpCurves);
          html+='<div class="tbl-wrap" style="margin-top:10px"><table><thead><tr><th>Model / Score</th><th>AUC</th><th>95% CI</th><th>Optimal Cutoff</th><th>Sensitivity</th><th>Specificity</th></tr></thead><tbody>';
          cmpCurves.forEach(function(c,ci){
            var r=c.roc;
            var col=['#f472b6','#67e8f9','#fbbf24','#34d399','#c084fc'][ci%5];
            html+='<tr><td class="td-label" style="color:'+col+'">'+escHtml(c.name)+'</td><td class="td-num" style="color:'+col+';font-weight:700">'+r.auc+'</td><td class="td-num" style="font-size:10px">'+r.aucCI+'</td><td class="td-num">'+r.optThresh+'</td><td class="td-num">'+r.optSens+'</td><td class="td-num">'+r.optSpec+'</td></tr>';
          });
          html+='</tbody></table></div>';
          // DeLong test between first two
          if(cmpCurves.length>=2){
            try{
              var dlong=deLongTest(cmpCurves[0].roc,cmpCurves[1].roc);
              html+='<div style="margin-top:10px;padding:9px 12px;background:rgba(124,58,237,.08);border-radius:8px;border:1px solid rgba(124,58,237,.18);font-size:11.5px;color:rgba(232,222,255,.7)"><b style="color:#c084fc">DeLong Test ('+escHtml(cmpCurves[0].name)+' vs '+escHtml(cmpCurves[1].name)+'):</b> z='+dlong.z+', p='+dlong.p_fmt+' — '+(parseFloat(dlong.p)<0.05?'<span style="color:#34d399">Significant difference in AUC</span>':'<span style="color:#fbbf24">No significant difference</span>')+'</div>';
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

    // ── Left: shared setup + method select ──────────────────────
    html+='<div style="display:flex;flex-direction:column;gap:10px">';
    html+='<div class="card"><div class="sec-hd"> Variable Setup</div>';
    html+='<div style="margin-bottom:8px"><label class="lbl">Analysis Method</label>';
    html+=mkOptCsel('surv-method',
      [{val:'km',label:'Kaplan-Meier Estimator'},{val:'logrank',label:'Log-Rank Test'},{val:'cox',label:'Cox Proportional Hazards'}],
      aState.survMethod,
      'aState.survMethod=_cR["surv-method"]._vals[_cR["surv-method"].fields.indexOf(val)];renderASub()',
      '');
    html+='</div>';
    html+='<div style="height:1px;background:rgba(124,58,237,.15);margin:10px 0"></div>';
    html+='<div style="margin-bottom:8px"><label class="lbl">Time Variable</label>';
    html+=mkSelect('surv-time',nF,aState.survTime,'aState.survTime=val;renderASub()','Time Variable')+'</div>';
    html+='<div style="margin-bottom:8px"><label class="lbl">Event Indicator <span style="color:rgba(232,222,255,.35)">(1=event, 0=censored)</span></label>';
    html+=mkSelect('surv-event',nF,aState.survEvent,'aState.survEvent=val;renderASub()','Event Indicator')+'</div>';
    html+='<div><label class="lbl">Group Variable <span style="color:rgba(232,222,255,.35)">(optional)</span></label>';
    html+=mkSelect('surv-grp',['(none)'].concat(aF),aState.survGroup||'(none)','aState.survGroup=(val==="(none)"?"":val);renderASub()','Group Variable')+'</div>';
    html+='</div>';
    html+='</div>';

    // ── Right: method-specific content ──────────────────────────
    html+='<div style="display:flex;flex-direction:column;gap:10px">';

    if(aState.survMethod==='km'){
      html+='<div class="card"><div class="sec-hd">Kaplan-Meier Estimator</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:10px;line-height:1.65">Mengestimasi survival function S(t) = P(T&gt;t) dari data dengan censoring. Titik drop = event; ✚ = censored.</div>';
      html+='<button class="btn btn-primary btn-sm" style="margin-bottom:11px" onclick="runSurvival()">▶ Run</button>';
      if(survPrv&&!survPrv._err){
        html+='<div class="stats-grid2">';
        survPrv.groups.forEach(function(g){
          html+=stCard('Median Survival ('+g.label+')',g.medianSurv===null?'NR':SE.f4(g.medianSurv),'');
          html+=stCard('Events / N ('+g.label+')',g.events+' / '+g.n,'');
        });
        html+='</div>';
        if(survPrv.groups.length>=2){
          html+='<div style="margin-top:10px;padding:8px 12px;background:rgba(74,222,128,.07);border-radius:8px;border:1px solid rgba(74,222,128,.2);font-size:11.5px;color:rgba(232,222,255,.75)">';
          html+='Log-rank: χ²('+survPrv.logrank.df+') = '+survPrv.logrank.chi2+', p = '+survPrv.logrank.p_fmt+' '+(parseFloat(survPrv.logrank.p)<0.05?'<span style="color:#34d399">✓ Sig</span>':'<span style="color:#fbbf24">ns</span>');
          html+='</div>';
        }
      }
      if(survPrv&&survPrv._err) html+='<div style="color:#f87171;font-size:11px;margin-top:8px">'+survPrv.msg+'</div>';
      html+='</div>';
      html+='<div class="card"><div class="sec-hd">KM Plot</div>';
      if(survPrv&&!survPrv._err) html+=svgKaplanMeier(survPrv);
      else html+='<div class="chart-empty">Set time dan event variable untuk melihat kurva KM</div>';
      html+='</div>';
    }

    else if(aState.survMethod==='logrank'){
      html+='<div class="card"><div class="sec-hd">Log-Rank Test</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:10px;line-height:1.65">Uji perbedaan survival curves antar grup. H₀: semua grup memiliki survival function yang sama.</div>';
      if(!aState.survGroup){
        html+='<div style="padding:9px 12px;background:rgba(251,191,36,.08);border-radius:8px;border:1px solid rgba(251,191,36,.2);font-size:11.5px;color:#fbbf24">⚠ Pilih Group Variable di panel kiri untuk menjalankan log-rank test.</div>';
      } else if(survPrv&&!survPrv._err&&survPrv.groups.length>=2){
        var lr=survPrv.logrank;
        html+='<div class="stats-grid2" style="margin-bottom:12px">';
        html+=stCard('χ²',lr.chi2,'Chi-square');
        html+=stCard('df',lr.df,'');
        html+=stCard('p-value',lr.p_fmt,'');
        html+=stCard('Sig',parseFloat(lr.p)<0.05?'Yes *':'No','');
        html+='</div>';
        html+='<div style="padding:10px 12px;background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.18);border-radius:8px;font-size:11.5px;color:rgba(232,222,255,.7);line-height:1.65">'+lr.interpretation+'</div>';
        html+=mkTable(['Group','N','Events','Censored','Median Survival','O-E'],
          survPrv.groups.map(function(g){return [g.label,g.n,g.events,g.n-g.events,g.medianSurv===null?'NR':SE.f4(g.medianSurv),SE.f4(g.oe||0)];}));
        html+='<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="runSurvival()">▶ Run</button>';
      } else if(survPrv&&survPrv._err) html+='<div style="color:#f87171;font-size:11px">'+survPrv.msg+'</div>';
      else html+='<div class="chart-empty">Pilih group variable dan pastikan data sudah di-load</div>';
      html+='</div>';
      html+='<div class="card"><div class="sec-hd">KM Plot (Comparison)</div>';
      if(survPrv&&!survPrv._err) html+=svgKaplanMeier(survPrv);
      else html+='<div class="chart-empty">Set variables untuk melihat kurva perbandingan</div>';
      html+='</div>';
    }

    else if(aState.survMethod==='cox'){
      html+='<div class="card"><div class="sec-hd">Cox Proportional Hazards</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:10px;line-height:1.65">Model semi-parametrik untuk memodelkan hazard sebagai fungsi kovariat. HR &gt; 1 = peningkatan risiko; HR &lt; 1 = protektif.</div>';
      html+='<label class="lbl">Covariates <span style="color:rgba(232,222,255,.35)">(Predictors)</span></label>';
      html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin:6px 0 10px">';
      nF.filter(function(v){return v!==aState.survTime&&v!==aState.survEvent;}).forEach(function(v){
        var sel=(aState.survCovs||[]).includes(v);
        html+='<label style="display:flex;align-items:center;gap:4px;font-size:11px;cursor:pointer;padding:4px 8px;border-radius:6px;background:'+(sel?'rgba(74,222,128,.12)':'rgba(255,255,255,.03)')+';border:1px solid '+(sel?'rgba(74,222,128,.3)':'rgba(255,255,255,.07)')+'"><input type="checkbox" '+(sel?'checked':'')+' onchange="toggleSurvCov(\''+v+'\',this.checked)" style="accent-color:#4ade80"/>'+v+'</label>';
      });
      html+='</div>';
      html+='<button class="btn btn-primary btn-sm"  onclick="runCoxRegression()">▶ Run</button>';
      if(coxPrv&&!coxPrv._err){
        html+='<div class="stats-grid2" style="margin-top:11px">';
        html+=stCard('N',coxPrv.n,'');
        html+=stCard('Events',coxPrv.events,'');
        html+=stCard('LR χ²',coxPrv.lrChi2,'p='+coxPrv.lrP_fmt);
        html+=stCard('Concordance',coxPrv.concordance,'C-index');
        html+='</div>';
      }
      if(coxPrv&&coxPrv._err) html+='<div style="color:#f87171;font-size:11px;margin-top:8px">'+coxPrv.msg+'</div>';
      html+='</div>';
      html+='<div class="card"><div class="sec-hd">Hazard Ratios</div>';
      if(coxPrv&&!coxPrv._err){
        html+=mkTable(['Covariate','β','SE','HR','95% CI HR','z','p'],
          coxPrv.coefs.map(function(c){
            var sig=parseFloat(c.p)<0.05;
            var hrNum=parseFloat(c.HR);
            var hrCol=hrNum>1.5?'#f87171':hrNum<0.67?'#34d399':'#fbbf24';
            return [c.name,c.beta,c.se,'<span style="color:'+hrCol+';font-weight:700">'+c.HR+'</span>',c.ci95,c.z,(sig?'<b style="color:#34d399">':'')+c.p_fmt+(sig?'</b>':'')];
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

    if(currentASub==='poweranalysis'){
      var pwRes=null;
      try{ pwRes=computePower(pw.pwTest,parseFloat(pw.pwAlpha),parseFloat(pw.pwPower),parseFloat(pw.pwEffect),parseInt(pw.pwGroups||2),parseInt(pw.pwTails||2),pw.pwSolve,parseInt(pw.pwN||30)); }catch(e){ pwRes={err:e.message}; }

      html+='<div class="grid2">';
      html+='<div class="card"><div class="sec-hd">Power Analysis — Sample Size Calculator</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:12px;line-height:1.6">Tentukan N minimum yang dibutuhkan, atau hitung power dari N yang ada, berdasarkan effect size, α, dan tipe uji statistik.</div>';

      // Test type — custom csel
      html+='<div style="margin-bottom:10px">';
      html+=mkOptCsel('pw-test', testOptions.map(function(t){return{val:t,label:testLabels[t]};}), pw.pwTest||'ttest_2samp', 'aState.pwTest=_cR["pw-test"]._vals[_cR["pw-test"].fields.indexOf(val)];renderASub()', 'Statistical Test', true);
      html+='</div>';

      // Solve for — pill buttons
      html+='<div style="margin-bottom:10px"><label class="lbl">Solve For</label><div class="row" style="gap:5px;margin-top:5px;flex-wrap:wrap">';
      [['n','N (Sample Size)'],['power','Power (1−β)'],['alpha','Alpha (α)'],['effect','Effect Size']].forEach(function(s){
        html+='<button class="btn '+(pw.pwSolve===s[0]?'btn-primary':'btn-ghost')+' btn-sm" onclick="aState.pwSolve=\''+s[0]+'\';renderASub()">'+s[1]+'</button>';
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

      // Effect size — pill shortcuts + number input
      if(pw.pwSolve!=='effect'){
        html+='<div style="margin-bottom:9px"><label class="lbl">'+effectLabels[pw.pwTest||'ttest_2samp']+' (Effect Size)</label>';
        var convs=effectConventions[pw.pwTest||'ttest_2samp']||['0.2','0.5','0.8'];
        html+='<div class="row" style="gap:5px;margin-top:5px;flex-wrap:wrap">';
        convs.forEach(function(v,i){
          var active=parseFloat(pw.pwEffect)===parseFloat(v);
          html+='<button class="btn '+(active?'btn-primary':'btn-ghost')+' btn-sm" onclick="aState.pwEffect='+v+';renderASub()">'+effConvNames[i]+' ('+v+')</button>';
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
        html+='<div style="margin-bottom:9px"><label class="lbl">Sample Size (N per group)</label>';
        html+='<input type="number" class="inp" value="'+(pw.pwN||30)+'" min="3" max="10000" oninput="aState.pwN=parseInt(this.value)||30" onblur="renderASub()" style="margin-top:5px;width:130px" placeholder="N"/>';
        html+='</div>';
      }

      // Tails — csel
      if((pw.pwTest||'').indexOf('ttest')>=0||(pw.pwTest||'').indexOf('correlation')>=0){
        html+='<div style="margin-bottom:9px">';
        html+=mkOptCsel('pw-tails', [{val:1,label:'1-tailed'},{val:2,label:'2-tailed'}], pw.pwTails||2, 'aState.pwTails=parseInt(_cR["pw-tails"]._vals[_cR["pw-tails"].fields.indexOf(val)]);renderASub()', 'Hypothesis Tails');
        html+='</div>';
      }

      html+='<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="runPowerAnalysis()">▶ Run</button>';
      html+='</div>';

      // Results panel
      html+='<div class="card"><div class="sec-hd">Results</div>';
      if(pwRes&&!pwRes.err){
        html+='<div class="stats-grid2" style="margin-bottom:12px">';
        html+=stCard('Sample Size (N)',pwRes.n,'Per group');
        html+=stCard('Power (1−β)',SE.f4(pwRes.power),pwRes.powerInterp);
        html+=stCard('Alpha (α)',SE.f4(pwRes.alpha),'Type I error');
        html+=stCard(effectLabels[pw.pwTest||'ttest_2samp'],SE.f4(pwRes.effect),pwRes.effectInterp);
        html+='</div>';
        if(pwRes.totalN) html+='<div style="padding:8px 11px;background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.2);border-radius:8px;font-size:12px;color:#34d399;margin-bottom:10px"><b>Total N needed: '+pwRes.totalN+'</b> ('+pwRes.groups+' groups × '+pwRes.n+' per group)</div>';
        var pwr=parseFloat(pwRes.power);
        var pwCol=pwr>=0.9?'#34d399':pwr>=0.8?'#fbbf24':'#f87171';
        html+='<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:11px;color:rgba(232,222,255,.5);margin-bottom:4px"><span>Power</span><span style="color:'+pwCol+'">'+SE.f4(pwr*100)+'%</span></div>';
        html+='<div style="height:8px;background:rgba(255,255,255,.06);border-radius:99px;overflow:hidden"><div style="height:100%;width:'+Math.min(100,pwr*100)+'%;background:'+pwCol+';border-radius:99px;transition:width .3s"></div></div></div>';
        html+='<div style="padding:10px 12px;background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.18);border-radius:8px;font-size:11.5px;color:rgba(232,222,255,.7);line-height:1.65">'+pwRes.interpretation+'</div>';
        var convRef=effectConventions[pw.pwTest||'ttest_2samp']||['0.2','0.5','0.8'];
        html+='<div class="tbl-wrap" style="margin-top:12px"><table><thead><tr><th>Convention</th><th>'+effectLabels[pw.pwTest||'ttest_2samp']+'</th><th>Interpretation</th></tr></thead><tbody>';
        html+='<tr><td class="td-label" style="color:#34d399">Small</td><td class="td-num">'+convRef[0]+'</td><td style="font-size:11px;color:rgba(232,222,255,.55)">Subtle, hard to detect visually</td></tr>';
        html+='<tr><td class="td-label" style="color:#fbbf24">Medium</td><td class="td-num">'+convRef[1]+'</td><td style="font-size:11px;color:rgba(232,222,255,.55)">Noticeable effect, typical in social science</td></tr>';
        html+='<tr><td class="td-label" style="color:#f87171">Large</td><td class="td-num">'+convRef[2]+'</td><td style="font-size:11px;color:rgba(232,222,255,.55)">Obvious, strong effect</td></tr>';
        html+='</tbody></table></div>';
      } else if(pwRes&&pwRes.err){
        html+='<div style="color:#f87171;font-size:11.5px;padding:10px">'+pwRes.err+'</div>';
      } else {
        html+='<div class="chart-empty">Set parameters above and click Calculate</div>';
      }
      html+='</div></div>';
    }

    else if(currentASub==='powerplot'){
      html+='<div class="card"><div class="sec-hd"> Power Curves</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:12px;line-height:1.6">Visualisasi hubungan antara N, effect size, dan power. Garis horizontal 0.80 = standar minimum.</div>';
      html+='<div class="grid2" style="margin-bottom:12px">';
      html+='<div>';
      html+=mkOptCsel('pw-test-plot', testOptions.map(function(t){return{val:t,label:testLabels[t]};}), pw.pwTest||'ttest_2samp', 'aState.pwTest=_cR["pw-test-plot"]._vals[_cR["pw-test-plot"].fields.indexOf(val)];renderASub()', 'Test Type', true);
      html+='</div>';
      html+='<div>';
      html+=mkOptCsel('pw-alpha-plot', [{val:0.001,label:'α = 0.001'},{val:0.01,label:'α = 0.01'},{val:0.05,label:'α = 0.05'},{val:0.10,label:'α = 0.10'}], pw.pwAlpha, 'aState.pwAlpha=parseFloat(_cR["pw-alpha-plot"]._vals[_cR["pw-alpha-plot"].fields.indexOf(val)]);renderASub()', 'Alpha (α)');
      html+='</div>';
      html+='</div>';
      html+=svgPowerCurve(pw.pwTest||'ttest_2samp',parseFloat(pw.pwAlpha)||0.05,parseInt(pw.pwTails||2));
      html+='</div>';
      html+='<div class="card"><div class="sec-hd">N Table — Required Sample Size</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:10px">N per group untuk tiap kombinasi power dan effect size (α='+pw.pwAlpha+')</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Effect Size</th><th>Power 70%</th><th>Power 80%</th><th>Power 90%</th><th>Power 95%</th></tr></thead><tbody>';
      var convRef2=effectConventions[pw.pwTest||'ttest_2samp']||['0.2','0.5','0.8'];
      convRef2.forEach(function(eff,ei){
        html+='<tr><td class="td-label">'+eff+' ('+effConvNames[ei]+')</td>';
        [0.70,0.80,0.90,0.95].forEach(function(pwr2){
          try{var r2=computePower(pw.pwTest||'ttest_2samp',parseFloat(pw.pwAlpha)||0.05,pwr2,parseFloat(eff),parseInt(pw.pwGroups||2),parseInt(pw.pwTails||2),'n',30);html+='<td class="td-num" style="color:'+(pwr2>=0.8?'#34d399':'#fbbf24')+'">'+r2.n+'</td>';}
          catch(e2){html+='<td class="td-num">—</td>';}
        });
        html+='</tr>';
      });
      html+='</tbody></table></div></div>';
    }

    else if(currentASub==='sensitivity'){
      html+='<div class="card"><div class="sec-hd"> Sensitivity Analysis</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:12px;line-height:1.6">Berikan N yang ada → hitung Minimum Detectable Effect pada power dan α tertentu.</div>';
      html+='<div class="grid2" style="margin-bottom:10px">';
      html+='<div>';
      html+=mkOptCsel('pw-test-sens', testOptions.map(function(t){return{val:t,label:testLabels[t]};}), pw.pwTest||'ttest_2samp', 'aState.pwTest=_cR["pw-test-sens"]._vals[_cR["pw-test-sens"].fields.indexOf(val)];renderASub()', 'Test Type', true);
      html+='</div>';
      html+='<div><label class="lbl">N per group</label><input type="number" class="inp" style="margin-top:5px" value="'+(pw.pwN||30)+'" min="3" max="10000" oninput="aState.pwN=parseInt(this.value)||30" onblur="renderASub()" placeholder="N"/></div>';
      html+='</div>';
      html+='<div class="grid2" style="margin-bottom:10px">';
      html+='<div>';
      html+=mkOptCsel('pw-power-sens', [{val:0.70,label:'0.70 (70%)'},{val:0.80,label:'0.80 (80%)'},{val:0.90,label:'0.90 (90%)'},{val:0.95,label:'0.95 (95%)'}], pw.pwPower, 'aState.pwPower=parseFloat(_cR["pw-power-sens"]._vals[_cR["pw-power-sens"].fields.indexOf(val)]);renderASub()', 'Desired Power');
      html+='</div>';
      html+='<div>';
      html+=mkOptCsel('pw-alpha-sens', [{val:0.001,label:'0.001'},{val:0.01,label:'0.01'},{val:0.05,label:'0.05'},{val:0.10,label:'0.10'}], pw.pwAlpha, 'aState.pwAlpha=parseFloat(_cR["pw-alpha-sens"]._vals[_cR["pw-alpha-sens"].fields.indexOf(val)]);renderASub()', 'Alpha (α)');
      html+='</div>';
      html+='</div>';

      var mde=null;
      try{ mde=computePower(pw.pwTest||'ttest_2samp',parseFloat(pw.pwAlpha)||0.05,parseFloat(pw.pwPower)||0.80,null,parseInt(pw.pwGroups||2),parseInt(pw.pwTails||2),'effect',parseInt(pw.pwN||30)); }catch(e){}

      if(mde&&!mde.err){
        html+='<div class="stats-grid2" style="margin:12px 0">';
        html+=stCard('N per group',pw.pwN,'Input');
        html+=stCard('MDE',SE.f4(mde.effect),effectLabels[pw.pwTest||'ttest_2samp']);
        html+=stCard('Power',SE.f4(mde.power*100)+'%','');
        html+=stCard('Alpha',pw.pwAlpha,'');
        html+='</div>';
        html+='<div style="padding:10px 12px;background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.18);border-radius:8px;font-size:11.5px;color:rgba(232,222,255,.7);line-height:1.65">';
        html+='Dengan N='+pw.pwN+' per grup, studi Anda dapat mendeteksi effect size ≥ <b style="color:#c084fc">'+SE.f4(mde.effect)+'</b> ('+effectLabels[pw.pwTest||'ttest_2samp']+') pada power '+SE.f4(parseFloat(pw.pwPower)*100)+'% dan α='+pw.pwAlpha+'.';
        var convRef3=effectConventions[pw.pwTest||'ttest_2samp']||['0.2','0.5','0.8'];
        var mdeV=parseFloat(mde.effect);
        if(mdeV<=parseFloat(convRef3[0])) html+=' Cukup sensitif untuk mendeteksi efek kecil.';
        else if(mdeV<=parseFloat(convRef3[1])) html+=' Hanya bisa mendeteksi efek medium ke atas.';
        else html+=' Hanya bisa mendeteksi efek besar. Pertimbangkan menambah sampel.';
        html+='</div>';
        html+=svgSensitivityCurve(pw.pwTest||'ttest_2samp',parseFloat(pw.pwAlpha)||0.05,parseFloat(pw.pwPower)||0.80,parseInt(pw.pwTails||2),parseInt(pw.pwN||30));
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
      html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:10px;line-height:1.6">Uji apakah hubungan X→Y berbeda tergantung nilai moderator W. Interaction term X×W harus signifikan.</div>';

      html+=mkSelect('mod-x',nF2,aState.modX,'aState.modX=val;renderASub()','Independent Variable (X)');
      html+='<div style="margin-top:8px">'+mkSelect('mod-w',nF2,aState.modW,'aState.modW=val;renderASub()','Moderator Variable (W)')+'</div>';
      html+='<div style="margin-top:8px">'+mkSelect('mod-y',nF2,aState.modY,'aState.modY=val;renderASub()','Dependent Variable (Y)')+'</div>';

      // Covariates
      html+='<div style="margin-top:10px"><label class="lbl">Covariates (optional)</label><div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px">';
      nF2.forEach(function(f){
        if(f===aState.modX||f===aState.modW||f===aState.modY) return;
        var checked=(aState.modCovs||[]).includes(f);
        html+='<label style="display:flex;align-items:center;gap:4px;font-size:11px;color:rgba(232,222,255,.6);cursor:pointer"><input type="checkbox" '+(checked?'checked':'')+' onchange="toggleModCov(this.dataset.fld,this.checked)" data-fld="'+escHtmlAttr(f)+'" style="accent-color:#c084fc"/>'+escHtml(f)+'</label>';
      });
      html+='</div></div>';

      // Mean centering
      html+='<div style="margin-top:9px"><label style="display:flex;align-items:center;gap:7px;cursor:pointer"><input type="checkbox" '+(aState.modCenter!==false?'checked':'')+' onchange="aState.modCenter=this.checked;renderASub()" style="accent-color:#c084fc"/><span style="font-size:12px;color:rgba(232,222,255,.7)">Mean-center X and W before interaction</span></label><div style="font-size:10px;color:rgba(232,222,255,.35);margin-top:3px;margin-left:22px">Direkomendasikan untuk mengurangi multikollinearitas dan memudahkan interpretasi</div></div>';

      html+='<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="runModeration()">▶ Run</button>';

      if(modPrv&&!modPrv._err){
        html+='<div style="margin-top:12px">';
        // Regression table summary
        html+='<div style="font-size:11px;font-weight:700;color:#c084fc;margin-bottom:7px">Model Summary</div>';
        html+='<div class="stats-grid2" style="margin-bottom:10px">';
        html+=stCard('R²',modPrv.R2,'Variance explained');
        html+=stCard('Adj R²',modPrv.R2adj,'');
        html+=stCard('F',modPrv.F,'df='+modPrv.dfR+','+modPrv.dfE);
        html+=stCard('N',modPrv.n,'');
        html+='</div>';
        // Interaction significance
        var intSig=parseFloat(modPrv.interaction.p)<0.05;
        html+='<div style="padding:9px 12px;border-radius:8px;border-left:3px solid '+(intSig?'#34d399':'#f87171')+';background:rgba(0,0,0,.15);font-size:11.5px;color:rgba(232,222,255,.75);line-height:1.6">';
        html+='Interaction ('+escHtml(aState.modX)+'×'+escHtml(aState.modW)+'): <b style="color:'+(intSig?'#34d399':'#f87171')+'">b='+modPrv.interaction.b+', t='+modPrv.interaction.t+', p='+modPrv.interaction.p_fmt+'</b>';
        html+=(intSig?' ✓ Significant moderation detected':' ✗ Moderation not significant')+'. ΔR²='+modPrv.deltaR2+'</div>';
        html+='</div>';
      }
      if(modPrv&&modPrv._err) html+='<div style="color:#f87171;font-size:11px;margin-top:8px">'+modPrv.msg+'</div>';
      html+='</div>';

      // Interaction plot
      html+='<div class="card"><div class="sec-hd">Interaction Plot</div>';
      if(modPrv&&!modPrv._err){
        html+=svgModerationPlot(modPrv,aState.modX,aState.modW,aState.modY);
        html+='<div style="margin-top:10px"><div class="sec-hd">Coefficient Table</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th>Variable</th><th>b</th><th>SE</th><th>β</th><th>t</th><th>p</th></tr></thead><tbody>';
        modPrv.coefs.forEach(function(c){
          html+='<tr><td class="td-label">'+escHtml(c.name)+'</td><td class="td-num">'+c.b+'</td><td class="td-num">'+c.SE+'</td><td class="td-num">'+c.beta+'</td><td class="td-num">'+c.t+'</td><td><span class="tag '+(parseFloat(c.p)<0.05?'tag-green':'tag-gray')+'">'+c.p_fmt+'</span></td></tr>';
        });
        html+='</tbody></table></div></div>';
      } else {
        html+='<div class="chart-empty">Select X, W, Y and Run to see interaction plot</div>';
      }
      html+='</div></div>';
    }

    else if(currentASub==='simpleslopes'){
      html+='<div class="card"><div class="sec-hd"> Simple Slopes Analysis</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:10px;line-height:1.6">Hitung slope X→Y pada tiga level W (Mean−1SD, Mean, Mean+1SD). Simple slope signifikan menunjukkan X berpengaruh pada W level tertentu.</div>';

      if(!modValid){
        html+='<div style="color:#fbbf24;font-size:11.5px;padding:10px;background:rgba(251,191,36,.08);border-radius:8px;border:1px solid rgba(251,191,36,.2)">Pilih X, W, Y di tab Moderation terlebih dahulu.</div>';
      } else if(modPrv&&!modPrv._err){
        var ss=modPrv.simpleSlopes;
        html+='<div class="tbl-wrap"><table><thead><tr><th>W Level</th><th>W Value</th><th>Slope (b₁+b₃W)</th><th>SE</th><th>t</th><th>p</th><th>95% CI</th><th>Sig</th></tr></thead><tbody>';
        ss.forEach(function(s){
          html+='<tr><td class="td-label" style="color:'+s.color+'">'+s.label+'</td><td class="td-num">'+s.wVal+'</td><td class="td-num" style="color:'+s.color+'">'+s.slope+'</td><td class="td-num">'+s.se+'</td><td class="td-num">'+s.t+'</td><td><span class="tag '+(parseFloat(s.p)<0.05?'tag-green':'tag-gray')+'">'+s.p_fmt+'</span></td><td class="td-num">'+s.ci95+'</td><td>'+( parseFloat(s.p)<0.05?'*':'ns')+'</td></tr>';
        });
        html+='</tbody></table></div>';
        html+=svgSimpleSlopesPlot(modPrv,aState.modX,aState.modW,aState.modY);
        html+='<div style="margin-top:10px;padding:9px 12px;background:rgba(124,58,237,.08);border-radius:8px;font-size:11px;color:rgba(232,222,255,.6);line-height:1.65">';
        html+='<b style="color:#c084fc">Interpretasi:</b> ';
        var ssSig=ss.filter(function(s){return parseFloat(s.p)<0.05;});
        if(ssSig.length===0) html+='Tidak ada simple slope yang signifikan. X tidak berpengaruh signifikan pada Y di semua level W.';
        else if(ssSig.length===ss.length) html+='Semua simple slopes signifikan. X berpengaruh pada Y di semua level W, tetapi kekuatannya berbeda.';
        else html+='X berpengaruh signifikan pada Y hanya pada beberapa level W: '+ssSig.map(function(s){return s.label;}).join(', ')+'.';
        html+='</div>';
      } else if(modPrv&&modPrv._err){
        html+='<div style="color:#f87171;font-size:11px">'+modPrv.msg+'</div>';
      }
      html+='</div>';
    }

    else if(currentASub==='jn'){
      html+='<div class="card"><div class="sec-hd"> Johnson-Neyman Technique (Floodlight Analysis)</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:10px;line-height:1.6">Temukan semua titik (significance region) pada W di mana hubungan X→Y signifikan (p&lt;0.05). Lebih presisi dari simple slopes yang hanya lihat ±1SD.</div>';

      if(!modValid){
        html+='<div style="color:#fbbf24;font-size:11.5px;padding:10px;background:rgba(251,191,36,.08);border-radius:8px;border:1px solid rgba(251,191,36,.2)">Pilih X, W, Y di tab Moderation terlebih dahulu.</div>';
      } else if(modPrv&&!modPrv._err){
        var jn=modPrv.jn;
        html+='<div class="stats-grid2" style="margin-bottom:12px">';
        html+=stCard('JN Point(s)',jn.regions.length>0?jn.regions.map(function(r){return SE.f4(r.value);}).join(', '):'None','W value where p=0.05');
        html+=stCard('% W significant',SE.f4(jn.pctSig)+'%','Cases in sig region');
        html+='</div>';
        html+=svgJohnsonNeymanPlot(modPrv,aState.modX,aState.modW,aState.modY);
        if(jn.regions.length>0){
          html+='<div style="margin-top:10px"><div class="tbl-wrap"><table><thead><tr><th>JN Point</th><th>W Value</th><th>Sig Region</th><th>% Dataset</th></tr></thead><tbody>';
          jn.regions.forEach(function(r,i){
            html+='<tr><td class="td-label">JN-'+(i+1)+'</td><td class="td-num">'+SE.f4(r.value)+'</td><td style="font-size:11px;color:#c084fc">'+r.direction+'</td><td class="td-num">'+SE.f4(r.pct)+'%</td></tr>';
          });
          html+='</tbody></table></div></div>';
        }
        html+='<div style="margin-top:10px;padding:9px 12px;background:rgba(124,58,237,.08);border-radius:8px;font-size:11.5px;color:rgba(232,222,255,.7);line-height:1.65">';
        html+='<b style="color:#c084fc">Interpretasi:</b> ';
        if(jn.regions.length===0) html+='Tidak ditemukan Johnson-Neyman point. Hubungan X→Y '+( jn.pctSig>50?'signifikan di seluruh rentang W.':'tidak signifikan di seluruh rentang W.');
        else if(jn.regions.length===1) html+='Johnson-Neyman point pada W='+SE.f4(jn.regions[0].value)+'. Hubungan X→Y signifikan '+jn.regions[0].direction+'.';
        else html+='Terdapat '+jn.regions.length+' titik transisi signifikansi pada rentang W.';
        html+='</div>';
        html+='<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="runModeration()">▶ Run</button>';
      } else if(modPrv&&modPrv._err){
        html+='<div style="color:#f87171;font-size:11px">'+modPrv.msg+'</div>';
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
    html+='<div style="font-size:11.5px;color:rgba(232,222,255,.45);margin-bottom:11px;line-height:1.6">The Bayes Factor (BF₁₀) quantifies evidence <em>for</em> H₁ relative to H₀. BF₁₀ &gt; 3 = moderate evidence for effect; &lt; 1/3 = evidence for null.</div>';
    html+=mkSelect('bay-v',nF,bV,'aState.bayV=val;renderASub()','Dependent Variable');
    html+='<div style="margin-top:8px">'+mkSelect('bay-g',aF,bG,'aState.bayG=val;renderASub()','Grouping Variable')+'</div>';
    html+='<div style="margin-top:10px">';
    html+='<label class="lbl">Prior scale (r) — Cauchy half-normal width</label>';
    html+='<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:5px">';
    [{v:0.354,l:'Wide (0.354)'},{v:0.707,l:'Default (√2/2)'},{v:1,l:'Ultrawide (1)'}].forEach(function(opt){
      var sel=Math.abs(bPrior-opt.v)<0.01;
      html+='<button class="btn btn-sm '+(sel?'btn-primary':'btn-ghost')+'" onclick="aState.bayPrior='+opt.v+';renderASub()">'+opt.l+'</button>';
    });
    html+='</div></div>';
    html+='<div style="margin-top:10px">';
    html+='<label class="lbl">Hypothesis</label>';
    html+='<div style="display:flex;gap:7px;margin-top:5px">';
    [{v:2,l:'Two-tailed (≠)'},{v:1,l:'One-tailed (>)'}].forEach(function(opt){
      var sel=bTails===opt.v;
      html+='<button class="btn btn-sm '+(sel?'btn-primary':'btn-ghost')+'" onclick="aState.bayTails='+opt.v+';renderASub()">'+opt.l+'</button>';
    });
    html+='</div></div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="runBayes()">▶ Run</button>';
    if(prv&&!prv._err){
      var bf=parseFloat(prv.BF10);
      var bfCol=bf>100?'#34d399':bf>10?'#4ade80':bf>3?'#a3e635':bf>1?'#fbbf24':bf>0.333?'#fb923c':'#f87171';
      html+='<div style="margin-top:12px;padding:12px 14px;border-radius:10px;background:rgba(0,0,0,.2);border:2px solid '+bfCol+'">';
      html+='<div style="font-size:18px;font-weight:900;color:'+bfCol+';font-family:Playfair Display,serif">BF₁₀ = '+prv.BF10+'</div>';
      html+='<div style="font-size:11.5px;color:rgba(232,222,255,.6);margin-top:3px">'+prv.interpretation+'</div>';
      html+='</div>';
      html+='<div class="stats-grid2" style="margin-top:10px">';
      html+=stCard('BF₁₀',prv.BF10,'Evidence ratio');
      html+=stCard('BF₀₁',prv.BF01,'Evidence for null');
      html+=stCard("Cohen's d",prv.cohensD,prv.dInterp);
      html+=stCard('t-statistic',prv.t,'df='+prv.df);
      html+='</div>';
      html+='<div style="margin-top:8px;padding:8px 11px;background:rgba(124,58,237,.07);border-radius:7px;font-size:11px;color:rgba(232,222,255,.55);line-height:1.6">';
      html+='<b style="color:#c084fc">Prior:</b> Cauchy(r='+prv.priorScale+') · <b style="color:#c084fc">Tails:</b> '+(bTails===2?'two-tailed':'one-tailed (positive)');
      html+='</div>';
    }
    html+='</div>';
    html+='<div class="card"><div class="sec-hd">Group Distributions</div>';
    html+=svgBoxplot(data,bV,bG);
    if(prv&&!prv._err){
      var bf2=parseFloat(prv.BF10);
      var bf2pct=Math.min(100,Math.max(0,bf2>100?100:bf2>10?(60+bf2*0.4):bf2>3?(40+bf2*6.67):bf2>1?(25+bf2*5):bf2*10));
      html+='<div style="margin-top:12px">';
      html+='<div style="font-size:10.5px;color:rgba(232,222,255,.4);margin-bottom:5px;text-transform:uppercase;letter-spacing:1px">Evidence Scale</div>';
      html+='<div style="position:relative;height:10px;background:linear-gradient(90deg,#f87171,#fbbf24,#34d399);border-radius:99px;overflow:hidden">';
      html+='<div style="position:absolute;top:0;left:0;height:100%;width:'+bf2pct+'%;background:rgba(255,255,255,.0)"></div>';
      html+='<div style="position:absolute;top:-2px;left:'+Math.max(0,Math.min(96,bf2pct))+'%;width:2px;height:14px;background:#fff;border-radius:99px;transform:translateX(-50%);box-shadow:0 0 6px rgba(255,255,255,.6)"></div>';
      html+='</div>';
      html+='<div style="display:flex;justify-content:space-between;font-size:9px;color:rgba(232,222,255,.3);margin-top:3px"><span>Strong H₀</span><span>Anecdotal</span><span>Strong H₁</span></div>';
      html+='</div>';
      html+='<div style="margin-top:10px;padding:8px 11px;background:rgba(124,58,237,.07);border:1px solid rgba(124,58,237,.15);border-radius:8px;font-size:11px;color:rgba(232,222,255,.55);line-height:1.65">';
      html+='<b style="color:#c084fc">BF Interpretation:</b> &lt;1/100 extreme H₀ · 1/30 very strong H₀ · 1/10 strong · 1/3 moderate · 1 no evidence · 3 moderate H₁ · 10 strong · 30 very strong · &gt;100 extreme H₁.';
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
    html+='<div style="font-size:11.5px;color:rgba(232,222,255,.45);margin-bottom:11px;line-height:1.6">Tests H₁: ρ≠0 vs H₀: ρ=0. Uses the Jeffreys–Zellner–Siow prior on the correlation coefficient.</div>';
    html+=mkSelect('bc-x',nF,bcX,'aState.bcX=val;renderASub()','Variable X');
    html+='<div style="margin-top:8px">'+mkSelect('bc-y',nF,bcY,'aState.bcY=val;renderASub()','Variable Y')+'</div>';
    html+='<div style="margin-top:10px">';
    html+='<label class="lbl">Prior scale (κ)</label>';
    html+='<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:5px">';
    [{v:0.5,l:'0.5'},{v:1,l:'1 (default)'},{v:2,l:'2'}].forEach(function(opt){
      var sel=Math.abs(bcPrior-opt.v)<0.01;
      html+='<button class="btn btn-sm '+(sel?'btn-primary':'btn-ghost')+'" onclick="aState.bcPrior='+opt.v+';renderASub()">'+opt.l+'</button>';
    });
    html+='</div></div>';
    html+='<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="runBayesCorr()">▶ Run</button>';
    if(bcPrv&&!bcPrv._err){
      var bfc=parseFloat(bcPrv.BF10);
      var bfcCol=bfc>100?'#34d399':bfc>10?'#4ade80':bfc>3?'#a3e635':bfc>1?'#fbbf24':bfc>0.333?'#fb923c':'#f87171';
      html+='<div style="margin-top:12px;padding:12px 14px;border-radius:10px;background:rgba(0,0,0,.2);border:2px solid '+bfcCol+'">';
      html+='<div style="font-size:18px;font-weight:900;color:'+bfcCol+';font-family:Playfair Display,serif">BF₁₀ = '+bcPrv.BF10+'</div>';
      html+='<div style="font-size:11.5px;color:rgba(232,222,255,.6);margin-top:3px">'+bcPrv.interpretation+'</div>';
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
    html+='<div style="font-size:11.5px;color:rgba(232,222,255,.45);margin-bottom:11px;line-height:1.6">Bayesian updating of the mean using a Normal-Inverse-Gamma prior. The posterior summarizes our updated belief about μ after observing the data.</div>';
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
      html+='<div style="margin-top:8px;padding:9px 12px;background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.18);border-radius:8px;font-size:11px;color:rgba(232,222,255,.6);line-height:1.65">After observing '+bpPrv.n+' data points, posterior mean = <b style="color:#c084fc">'+bpPrv.postMean+'</b> with 95% credible interval <b style="color:#f472b6">'+bpPrv.hdi95+'</b>.</div>';
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
    var tsV  = aState.tsV  || nF[0] || '';
    var tsMod= aState.tsMod|| 'arima';
    var tsP  = aState.tsP  !== undefined ? aState.tsP  : 1;
    var tsD  = aState.tsD  !== undefined ? aState.tsD  : 1;
    var tsQ  = aState.tsQ  !== undefined ? aState.tsQ  : 1;
    var tsDType = aState.tsDType || 'additive';
    var tsPeriod= aState.tsPeriod!== undefined ? aState.tsPeriod : 12;
    var tsVals  = SE.validNums(data.map(function(r){return r[tsV];}));
    var tsN     = tsVals.length;

    // tsACF, tsPACF, tsDiff, tsARIMA, tsDecomp dipindah ke
    // js/stats-engine/stats-timeseries.js (B26) — sekarang fungsi global,
    // dipanggil langsung di bawah tanpa ubah call-site.

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
      html+='<div style="margin-top:10px"><div class="sec-hd" style="font-size:11px;margin-bottom:7px">ARIMA Orders <span style="color:rgba(232,222,255,.35);font-weight:400">(p, d, q)</span></div>';
      html+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">';
      [['AR (p)','tsP',tsP],['Diff (d)','tsD',tsD],['MA (q)','tsQ',tsQ]].forEach(function(f){
        html+='<div><label class="lbl" style="font-size:10px">'+f[0]+'</label>';
        html+='<div style="display:flex;gap:3px;margin-top:3px">';
        [0,1,2,3].forEach(function(v){
          html+='<button class="btn btn-sm '+(f[2]===v?'btn-primary':'btn-ghost')+'" style="flex:1;padding:4px 2px;min-width:0;text-align:center;justify-content:center;display:flex;align-items:center" onclick="aState.'+f[1]+'='+v+';renderASub()">'+v+'</button>';
        });
        html+='</div></div>';
      });
      html+='</div>';
      html+='<div class="assump" style="margin-top:9px">p: AR lags · d: differencing · q: MA lags.<br>ACF / PACF plot otomatis ditampilkan di kanan setelah variable dipilih.</div>';
    } else {
      html+='<div style="margin-top:10px"><label class="lbl">Seasonal Period</label>';
      html+='<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:5px">';
      [4,7,12,24,52].forEach(function(v){
        html+='<button class="btn btn-sm '+(tsPeriod===v?'btn-primary':'btn-ghost')+'" onclick="aState.tsPeriod='+v+';renderASub()">'+v+(v===4?' (Q)':v===7?' (D)':v===12?' (M)':v===24?' (H)':' (W)')+'</button>';
      });
      html+='</div>';
      html+='<div style="margin-top:9px">'+mkCsel('ts-dtype',['additive','multiplicative'],tsDType,'aState.tsDType=val;renderASub()','Model Type')+'</div>';
      html+='<div class="assump" style="margin-top:8px">Additive: Y = T+S+R &nbsp;·&nbsp; Multiplicative: Y = T×S×R.<br>Pilih additive jika amplitudo seasonal konstan.</div>';
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
        html+='<div style="margin-top:9px;padding:9px 12px;background:rgba(103,232,249,.05);border:1px solid rgba(103,232,249,.2);border-radius:8px;font-size:11.5px;color:rgba(232,222,255,.7)">';
        html+='<b style="color:#67e8f9">ARIMA('+tsP+','+tsD+','+tsQ+')</b><br>';
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
      svgLine+='<defs><linearGradient id="ts-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#67e8f9" stop-opacity=".15"/><stop offset="100%" stop-color="#67e8f9" stop-opacity="0"/></linearGradient></defs>';
      var aPath='M'+pxFn(0)+','+svgH+' '+tsVals.map(function(v,i){return pxFn(i)+','+pyFn(v);}).join(' L')+' L'+pxFn(tsVals.length-1)+','+svgH+' Z';
      svgLine+='<path d="'+aPath+'" fill="url(#ts-grad)"/>';
      svgLine+='<polyline points="'+ptStr+'" fill="none" stroke="#67e8f9" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>';
      if(tsMod==='arima'&&tsRes&&!tsRes._err&&tsRes.origFitted&&tsRes.origFitted.length>0){
        var fitOff=tsP+tsD;
        var fPts=tsRes.origFitted.map(function(v,i){return pxFn(fitOff+i)+','+pyFn(Math.max(vMin-vRange*.05,Math.min(vMax+vRange*.05,v)));}).join(' ');
        svgLine+='<polyline points="'+fPts+'" fill="none" stroke="#f472b6" stroke-width="1.3" stroke-dasharray="3,2" opacity=".8"/>';
      }
      svgLine+='<line x1="28" y1="'+(svgH-1)+'" x2="'+svgW+'" y2="'+(svgH-1)+'" stroke="rgba(255,255,255,.08)"/>';
      svgLine+='<line x1="29" y1="0" x2="29" y2="'+(svgH-1)+'" stroke="rgba(255,255,255,.08)"/>';
      svgLine+='<text x="2" y="14" font-size="9" fill="rgba(232,222,255,.4)" font-family="Inter,sans-serif">'+SE.f4(vMax)+'</text>';
      svgLine+='<text x="2" y="'+(svgH-5)+'" font-size="9" fill="rgba(232,222,255,.4)" font-family="Inter,sans-serif">'+SE.f4(vMin)+'</text>';
      svgLine+='</svg>';
      html+='<div class="card"><div class="sec-hd">Time Series Plot';
      if(tsMod==='arima'&&tsRes&&!tsRes._err) html+=' <span style="font-size:9.5px;color:rgba(232,222,255,.3);font-weight:400">· pink dash = fitted</span>';
      html+='</div>'+svgLine+'</div>';
    }

    if(tsMod==='arima'&&tsRes&&!tsRes._err){
      function svgCorrelogram(acfArr,title,color){
        var W=420,H=90,n2=acfArr.length,barW=Math.min(16,(W-40)/n2);
        var ci=1.96/Math.sqrt(Math.max(tsN,2));
        var sv='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:'+H+'px">';
        sv+='<line x1="20" y1="'+(H/2)+'" x2="'+W+'" y2="'+(H/2)+'" stroke="rgba(255,255,255,.08)"/>';
        var ciY1=(H/2)*(1-ci*1.5),ciY2=(H/2)+(H/2)*ci*1.5;
        sv+='<line x1="20" y1="'+ciY1+'" x2="'+W+'" y2="'+ciY1+'" stroke="rgba(251,191,36,.25)" stroke-dasharray="3,2"/>';
        sv+='<line x1="20" y1="'+ciY2+'" x2="'+W+'" y2="'+ciY2+'" stroke="rgba(251,191,36,.25)" stroke-dasharray="3,2"/>';
        acfArr.forEach(function(v,i){
          var x=25+i*(W-30)/Math.max(n2,1);
          var hgt=Math.abs(v)*(H*0.44);
          var sig=Math.abs(v)>ci;
          var y2=v>=0?(H/2)-hgt:(H/2);
          var h2=hgt||1;
          sv+='<rect x="'+(x-barW/2)+'" y="'+y2+'" width="'+barW+'" height="'+h2+'" rx="2" fill="'+(sig?color:'rgba(255,255,255,.12)')+'"/>';
          sv+='<text x="'+x+'" y="'+(H-2)+'" font-size="8" fill="rgba(232,222,255,.3)" text-anchor="middle" font-family="Inter,sans-serif">'+(i+1)+'</text>';
        });
        sv+='</svg>';
        return '<div class="card" style="margin-top:8px"><div class="sec-hd" style="font-size:11px">'+title+' <span style="float:right;font-size:9px;color:rgba(232,222,255,.3)">dashed = 95% CI</span></div>'+sv+'</div>';
      }
      if(tsRes.acf&&tsRes.acf.length>1) html+=svgCorrelogram(tsRes.acf.slice(1),'ACF — differenced series','#67e8f9');
      if(tsRes.pacf&&tsRes.pacf.length) html+=svgCorrelogram(tsRes.pacf,'PACF — differenced series','#c084fc');
      if(tsRes.residACF&&tsRes.residACF.length>1) html+=svgCorrelogram(tsRes.residACF.slice(1),'Residual ACF — should be near zero','#f472b6');
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
        sv+='<line x1="28" y1="'+(sh-1)+'" x2="'+W2+'" y2="'+(sh-1)+'" stroke="rgba(255,255,255,.07)"/>';
        sv+='<text x="2" y="14" font-size="9" fill="rgba(232,222,255,.35)" font-family="Inter,sans-serif">'+SE.f4(vMax2)+'</text>';
        sv+='<text x="2" y="'+(sh-3)+'" font-size="9" fill="rgba(232,222,255,.35)" font-family="Inter,sans-serif">'+SE.f4(vMin2)+'</text>';
        sv+='</svg>';
        return '<div class="card" style="margin-top:8px"><div class="sec-hd" style="font-size:11px;color:'+color+'">'+title+'</div>'+sv+'</div>';
      }
      html+=svgDecompLine(tsRes.trend,'Trend','#67e8f9',80);
      html+=svgDecompLine(tsRes.seasonal,'Seasonal','#c084fc',70);
      html+=svgDecompLine(tsRes.remainder,'Remainder (Residual)','#f472b6',70);
    }

    if(tsRes&&tsRes._err){
      html+='<div class="card"><div style="color:#f87171;font-size:12.5px;padding:12px">'+IC.warn+' '+tsRes._err+'</div></div>';
    }
    if(!tsV||tsVals.length===0){
      html+='<div class="card"><div style="color:#64748b;font-size:12.5px;padding:20px;text-align:center">Pilih variable numerik yang mewakili deret waktu (time-ordered).</div></div>';
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

    // ── LEFT: Input Panel ──
    html+='<div>';
    html+='<div class="card"><div class="sec-hd">Model & Effect Size</div>';
    // Model picker
    var metaModelLabel=aState.metaModel==='random'?'Random-Effects':'Fixed-Effect';
    html+='<div style="margin-bottom:10px">';
    html+=mkCsel('meta-model',['Random-Effects','Fixed-Effect'],metaModelLabel,
      'metaSetModel(val)','Model');
    html+='</div>';
    html+='<div style="font-size:10.5px;color:rgba(232,222,255,.35);margin-bottom:10px;line-height:1.55">';
    html+=aState.metaModel==='random'?'<b style="color:#fb923c">Random-Effects (DerSimonian-Laird):</b> Asumsi effect size berbeda antar studi. Cocok jika ada heterogenitas.':'<b style="color:#fbbf24">Fixed-Effect (Inverse-Variance):</b> Asumsi satu effect size yang sama di semua studi.';
    html+='</div>';
    // Effect type picker
    var metaEffectMap={d:"Cohen's d",r:'Correlation r',or:'Odds Ratio',g:"Hedges' g",other:'Other (yi/vi)'};
    var metaEffectLabel=metaEffectMap[aState.metaEffect]||"Cohen's d";
    var metaEffectOpts=["Cohen's d",'Correlation r','Odds Ratio',"Hedges' g",'Other (yi/vi)'];
    html+=mkCsel('meta-effect',metaEffectOpts,metaEffectLabel,'metaSetEffect(val)','Effect Size');
    html+='</div>';

    // ── Add Study ──
    html+='<div class="card"><div class="sec-hd">Tambah Studi</div>';
    html+='<div style="display:flex;flex-direction:column;gap:6px">';
    html+='<input class="inp" id="ma-name" placeholder="Nama studi (cth: Smith 2020)" value="'+(aState.metaNewStudy.name||'')+'" oninput="aState.metaNewStudy.name=this.value" style="font-size:12px"/>';
    html+='<div style="display:flex;gap:6px">';

    var eLab=aState.metaEffect==='d'?"Cohen's d":aState.metaEffect==='r'?'r':aState.metaEffect==='or'?'ln(OR)':aState.metaEffect==='g'?"Hedges' g":'Effect (yi)';
    html+='<input class="inp" id="ma-yi" type="number" step="any" placeholder="'+eLab+'" value="'+(aState.metaNewStudy.yi||'')+'" oninput="aState.metaNewStudy.yi=this.value" style="flex:1;font-size:12px"/>';
    html+='<input class="inp" id="ma-vi" type="number" step="any" placeholder="Variance (vi)" value="'+(aState.metaNewStudy.vi||'')+'" oninput="aState.metaNewStudy.vi=this.value" style="flex:1;font-size:12px"/>';
    html+='<input class="inp" id="ma-ni" type="number" step="1" min="2" placeholder="N" value="'+(aState.metaNewStudy.ni||'')+'" oninput="aState.metaNewStudy.ni=this.value" style="flex:1;font-size:12px"/>';
    html+='</div>';
    html+='<div style="display:flex;gap:6px">';
    html+='<button class="btn btn-primary btn-sm" onclick="metaAddStudy()" style="flex:1">+ Tambah Studi</button>';
    html+='<button class="btn btn-sm" onclick="metaLoadExample()" style="flex:1;background:rgba(124,58,237,.12);border-color:rgba(124,58,237,.3);color:#c084fc">Load Contoh</button>';
    html+='</div>';
    html+='<div style="font-size:10px;color:rgba(232,222,255,.3);line-height:1.5">vi = variance effect size = (SE)². Jika punya SE: vi = SE². Jika punya n & SD: vi ≈ 4/n (untuk d).</div>';
    html+='</div></div>';

    // ── Study List ──
    html+='<div class="card"><div class="sec-hd">Daftar Studi ('+aState.metaStudies.length+')</div>';
    if(!aState.metaStudies.length){
      html+='<div class="chart-empty" style="padding:18px 0">Belum ada studi. Tambah minimal 2 studi untuk analisis.</div>';
    } else {
      html+='<div class="tbl-wrap"><table><thead><tr><th>Studi</th><th>yi</th><th>vi</th><th>N</th><th></th></tr></thead><tbody>';
      aState.metaStudies.forEach(function(s,i){
        html+='<tr><td class="td-label" style="max-width:120px;overflow:hidden;text-overflow:ellipsis">'+s.name+'</td>';
        html+='<td class="td-num">'+parseFloat(s.yi).toFixed(3)+'</td>';
        html+='<td class="td-num">'+parseFloat(s.vi).toFixed(4)+'</td>';
        html+='<td class="td-num">'+(s.ni||'—')+'</td>';
        html+='<td><button onclick="metaRemoveStudy('+i+')" style="background:rgba(248,113,113,.12);border:1px solid rgba(248,113,113,.25);color:#f87171;border-radius:5px;padding:2px 8px;font-size:10.5px;cursor:pointer">✕</button></td>';
        html+='</tr>';
      });
      html+='</tbody></table></div>';
      html+='<div style="display:flex;gap:5px;margin-top:8px">';
      html+='<button class="btn btn-primary btn-sm" onclick="runMetaAnalysis()" style="flex:1">▶ Run</button>';
      html+='<button class="btn btn-sm" onclick="aState.metaStudies=[];renderASub()" style="background:rgba(248,113,113,.08);border-color:rgba(248,113,113,.2);color:#f87171">Clear All</button>';
      html+='</div>';
    }
    html+='</div>'; // end study list card
    html+='</div>'; // end left col

    // ── RIGHT: Live Results + Plots ──
    html+='<div>';
    if(aState.metaStudies.length<2){
      html+='<div class="card"><div class="chart-empty" style="padding:40px 0;flex-direction:column;gap:10px"><div>Tambah minimal 2 studi untuk melihat hasil meta-analisis.</div></div></div>';
    } else if(metaRes&&metaRes._err){
      html+='<div class="card"><div style="color:#f87171;font-size:12.5px;padding:12px">⚠ '+metaRes._err+'</div></div>';
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
      html+='<div style="margin-top:8px;padding:8px 11px;border-radius:7px;background:rgba('+(psig?'5,150,105':'248,113,113')+',.08);border:1px solid rgba('+(psig?'5,150,105':'248,113,113')+',.2);font-size:11.5px;color:'+(psig?'#34d399':'#f87171')+'"><b>'+(psig?'✓ Efek signifikan':'✗ Efek tidak signifikan')+'</b> — Pooled '+metaRes.effectLabel+' = '+metaRes.pooledEffect+' '+metaRes.ci_label+' ['+metaRes.ci_lo+', '+metaRes.ci_hi+'], z = '+metaRes.z+', p = '+metaRes.p_fmt+'</div>';
      html+='</div>';

      // Heterogeneity
      html+='<div class="card"><div class="sec-hd">Heterogenitas</div>';
      html+='<div class="stats-grid2">';
      html+=stCard('Q statistic',metaRes.Q,'df = '+(aState.metaStudies.length-1)+', p = '+metaRes.Q_p_fmt);
      html+=stCard('I²',metaRes.I2+'%',metaRes.I2label);
      html+=stCard('τ² (tau²)',metaRes.tau2,'Between-study variance');
      html+=stCard('τ (tau)',metaRes.tau,'SD between studies');
      html+='</div>';
      var hColor=metaRes.I2raw<25?'#34d399':metaRes.I2raw<50?'#fbbf24':metaRes.I2raw<75?'#fb923c':'#f87171';
      html+='<div style="margin-top:8px;padding:8px 11px;border-radius:7px;background:rgba(124,58,237,.06);border:1px solid rgba(124,58,237,.15);font-size:11px;color:rgba(232,222,255,.6);line-height:1.6">';
      html+='<b style="color:'+hColor+'">'+metaRes.I2label+'</b> — ';
      html+='Q('+( aState.metaStudies.length-1)+') = '+metaRes.Q+', p = '+metaRes.Q_p_fmt+'. ';
      html+=metaRes.I2raw<25?'Heterogenitas rendah; studi cukup homogen.':metaRes.I2raw<50?'Heterogenitas sedang; ada variasi antar studi.':metaRes.I2raw<75?'Heterogenitas substansial; pertimbangkan analisis moderator.':'Heterogenitas tinggi; hasil hati-hati diinterpretasi.';
      html+='</div></div>';

      // Forest Plot
      html+='<div class="card"><div class="sec-hd">Forest Plot</div>';
      html+=svgMetaForestPlot(aState.metaStudies,metaRes,aState.metaEffect);
      html+='</div>';

      // Funnel Plot
      html+='<div class="card"><div class="sec-hd">Funnel Plot <span style="font-size:10px;font-weight:400;color:rgba(232,222,255,.3)">(uji publication bias)</span></div>';
      html+=svgFunnelPlot(metaRes);
      html+='<div style="font-size:10.5px;color:rgba(232,222,255,.35);margin-top:6px;line-height:1.55">Funnel plot simetris → tidak ada publication bias. Asimetri → kemungkinan ada bias. Gunakan Egger\'s test untuk konfirmasi.</div>';
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

  // ── WEIGHT CASES ──────────────────────────────────────────────────────
  else if(currentASub==='weightcases'){
    html+=renderWeightcasesForm();
  }

  else if(currentASub==='impute'){
    html+=renderImputeForm();
  }

  // ── MULTIPLE IMPUTATION ────────────────────────────────────────────────
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
  // ══════════════════════════════════════════════════════════════
  // HLM – Hierarchical Linear Model
  // ══════════════════════════════════════════════════════════════
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

  // ══════════════════════════════════════════════════════════════
  // DISCRIMINANT ANALYSIS (LDA)
  // ══════════════════════════════════════════════════════════════
  else if(currentASub==='discriminant'){
    html+=renderDiscriminantForm();
  }

  // ══════════════════════════════════════════════════════════════
  // CLUSTER ANALYSIS (K-Means & Hierarchical)
  // ══════════════════════════════════════════════════════════════
  else if(currentASub==='cluster'){
    html+=renderClusterForm();
  }

  // ══════════════════════════════════════════════════════════════
  // MISSING DATA ANALYSIS — Little's MCAR + Pattern Matrix — badan
  // cabang ini DIPINDAH & DIBUNGKUS jadi function renderMissingDataAnalysis()
  // di js/data/missing-data.js (C11, split roadmap OSS 2.0). Cabang
  // if/else-if di sini TETAP ADA (perlu tetap ada supaya renderASub()
  // jalan benar), tapi badannya sekarang cuma 1 baris pemanggilan.
  // ══════════════════════════════════════════════════════════════
  else if(currentASub==='missinganalysis'){
    html+=renderMissingDataAnalysis();
  }


  // ── ROC CURVE ──────────────────────────────────────────────────────────
  else if(currentASub==='roc'||currentASub==='roc_compare'){
    html+=renderRocForm();
  }

  // ── SURVIVAL ANALYSIS ──────────────────────────────────────────────────
  else if(currentASub==='survival'||currentASub==='km'||currentASub==='logrank'||currentASub==='cox'){
    html+=renderSurvivalForm();
  }
  // ─────────────────────────────────────────────────────────────────────
  else if(currentASub==='poweranalysis'||currentASub==='powerplot'||currentASub==='sensitivity'){
    html+=renderPoweranalysisForm();
  }

  // ─────────────────────────────────────────────────────────────────────
  // MODERATION ANALYSIS
  // ─────────────────────────────────────────────────────────────────────
  else if(currentASub==='moderation'||currentASub==='simpleslopes'||currentASub==='jn'){
    html+=renderModerationForm();
  }

  // ── BAYESIAN ANALYSIS ──────────────────────────────────────────────────
  else if(currentASub==='bayesian'){
    html+=renderBayesianForm();
  }

  else if(currentASub==='bayesian_corr'){
    html+=renderBayesianCorrForm();
  }

  else if(currentASub==='bayesian_posterior'){
    html+=renderBayesianPosteriorForm();
  }

  // ── TIME SERIES (ARIMA + Decomposition) ────────────────────────────────
  else if(currentASub==='timeseries'){
    html+=renderTimeseriesForm();
  }

  // ── META-ANALYSIS ─────────────────────────────────────────────────────────
  else if(currentASub==='metaanalysis'){
    html+=renderMetaanalysisForm();
  }

  el.innerHTML=html;
}


// ════════════════════════════════════════════════════════════════════════
// RUN ANALYSIS FUNCTIONS
// ════════════════════════════════════════════════════════════════════════

// ── Forest Plot SVG + Funnel Plot SVG (svgMetaForestPlot/svgFunnelPlot) —
// DIPINDAH ke js/charts/forest-funnel-plot.js (E4+E5, split roadmap OSS 2.0).
// File dimuat SEBELUM file ini — keduanya murni string builder yang baca
// escHtml di runtime; dipanggil dari renderMetaanalysisForm (di atas) dan
// renderOutput (app.js).


// ── Meta-Analysis State Helpers ─────────────────────────────────────────
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
