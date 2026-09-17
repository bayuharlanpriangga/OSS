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
