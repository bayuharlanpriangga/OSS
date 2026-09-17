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
