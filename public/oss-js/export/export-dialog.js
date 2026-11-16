// Export Output Dialog 
function _exportOutputDialog(id){
  var o=outputs.find(function(x){return x.id===id;});
  if(!o) return;

  // Detect if this output has chart(s)
  var hasChart=false;
  var chartTypes=[];
  if(o.type==='descriptive'){hasChart=true;chartTypes=['Histogram','Normal Q-Q Plot'];}
  else if(o.type==='ttest'||o.type==='anova'||o.type==='nonparametric'){hasChart=true;chartTypes=['Boxplot'];}
  else if(o.type==='paired'||o.type==='correlation'||o.type==='regression'||o.type==='multipleReg'){hasChart=true;chartTypes=['Scatter Plot'];}
  else if(o.type==='rmanova'){hasChart=true;chartTypes=['Profile Plot'];}
  else if(o.type==='timeseries'){hasChart=true;chartTypes=['Time Series Plot'];}

  // Remove any existing dialog
  var ex=document.getElementById('_exp-dialog');
  if(ex) ex.remove();

  // Build dialog
  var overlay=document.createElement('div');
  overlay.id='_exp-dialog';
  overlay.style.cssText='position:fixed;inset:0;z-index:9900;background:var(--scrim);display:flex;align-items:center;justify-content:center;padding:16px';

  var box=document.createElement('div');
  box.className='modal-box';
  box.style.cssText='padding:22px;width:100%;max-width:400px';

  // Header
  box.innerHTML='<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">'
    +'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
    +'<div style="font-size:17px;font-weight:700;color:var(--ink);font-family:var(--font-serif-stack)">Export to Word</div>'
    +'</div>'
    +'<div style="font-size:12px;color:var(--ink-muted);margin-bottom:16px;padding-left:28px">'+escHtml(o.title)+'</div>';

  // Option rows
  var opts=[
    {
      mode:'table',
      icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>',
      label:'Text & Table Only',
      desc:'Ringkasan statistik + tabel hasil — tanpa diagram',
      always:true
    },
    {
      mode:'chart',
      icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
      label:'Diagram / Chart Only',
      desc:'Hanya diagram grafis — tanpa tabel statistik',
      always:false
    },
    {
      mode:'both',
      icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
      label:'Text, Table & Chart',
      desc:'Lengkap: ringkasan + tabel + diagram',
      always:false
    }
  ];

  var optWrap=document.createElement('div');
  optWrap.style.cssText='display:flex;flex-direction:column;gap:8px;margin-bottom:18px';

  opts.forEach(function(opt){
    var available=opt.always||hasChart;
    var btn=document.createElement('div');
    btn.style.cssText='display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:var(--r-sm);border:1px solid '
      +(available?'var(--line-soft)':'var(--line-soft)')+';cursor:'
      +(available?'pointer':'not-allowed')+';background:'
      +(available?'var(--surface-alt)':'transparent')+';transition:.15s;opacity:'+(available?'1':'.45');
    if(available){
      btn.onmouseover=function(){this.style.borderColor='var(--ink)';};
      btn.onmouseout=function(){this.style.borderColor='var(--line-soft)';};
      btn.onclick=function(){overlay.remove();_exportSingleOutput(id,opt.mode);};
    }
    btn.innerHTML='<div style="color:var(--ink);display:flex;align-items:center;flex-shrink:0">'+opt.icon+'</div>'
      +'<div><div style="font-size:13px;font-weight:700;color:'+(available?'var(--ink)':'var(--ink-subtle)')+'">'+opt.label+'</div>'
      +'<div style="font-size:11.5px;color:var(--ink-muted);margin-top:2px">'+opt.desc+'</div>'
      +((!available)?' <div style="font-size:11px;color:var(--warn);margin-top:3px">Analisis ini tidak memiliki diagram</div>':'')
      +(available&&opt.mode!=='table'&&hasChart?' <div style="font-size:11px;color:var(--gold-text);margin-top:3px">Chart: '+chartTypes.join(', ')+'</div>':'')
      +'</div>';
    optWrap.appendChild(btn);
  });

  box.appendChild(optWrap);

  // Export All button
  var allRow=document.createElement('div');
  allRow.style.cssText='display:flex;gap:8px;border-top:1px solid var(--line-soft);padding-top:14px';

  var cancelBtn=document.createElement('button');
  cancelBtn.textContent='Batal';
  cancelBtn.className='btn btn-ghost';
  cancelBtn.style.flex='1';
  cancelBtn.onclick=function(){overlay.remove();};

  var exportAllBtn=document.createElement('button');
  exportAllBtn.textContent='Export Semua Output';
  exportAllBtn.className='btn btn-primary';
  exportAllBtn.style.flex='2';
  exportAllBtn.onclick=function(){overlay.remove();exportWordDialog();};

  allRow.appendChild(cancelBtn);
  allRow.appendChild(exportAllBtn);
  box.appendChild(allRow);

  overlay.appendChild(box);
  overlay.addEventListener('click',function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}


// EXPORT WORD DIALOG — pilih group/sub-type yang mau diekspor
function exportWordDialog(){
  if(!outputs.length){showToast('No outputs yet. Run an analysis first.','error');return;}

  var SUB_LABEL={
    ttest:'Independent T-Test', onesamp:'One-Sample T-Test', paired:'Paired T-Test',
    anova:'One-Way ANOVA', anova2:'Two-Way ANOVA', anova3:'Three-Way ANOVA',
    rmanova:'Repeated Measures ANOVA', glm:'General Linear Model', manova:'MANOVA', repeated:'Repeated Mixed ANOVA',
    correlation:'Pearson Correlation', partialCorr:'Partial Correlation', canonicalCorr:'Canonical Correlation', corrmatrix:'Correlation Matrix',
    regression:'Simple Regression', multipleReg:'Multiple Regression', hierarchicalReg:'Hierarchical Regression',
    logistic:'Logistic Regression', poisson:'Poisson Regression', negbin:'Negative Binomial',
    nonparam:'Non-Parametric', mannwhitney:'Mann-Whitney U', kruskal:'Kruskal-Wallis', wilcoxon:'Wilcoxon Signed-Rank', chiSquare:'Chi-Square',
    descriptive:'Descriptive Statistics',
    alpha:'Cronbach Alpha', kappa:'Cohen Kappa',
    efa:'Exploratory Factor Analysis', cfa:'Confirmatory Factor Analysis',
    cluster:'Cluster Analysis', discriminant:'Discriminant Analysis',
    bayes_ttest:'Bayesian T-Test', bayes_corr:'Bayesian Correlation', bayes_posterior:'Bayesian Posterior', bayesian:'Bayesian Analysis',
    timeseries:'Time Series / ARIMA',
    survival:'Kaplan-Meier Survival', cox:'Cox Regression',
    roc:'ROC Analysis', moderation:'Moderation Analysis', mediation:'Mediation Analysis',
    mi:'Missing Data Analysis', missinganalysis:'Missing Data Analysis',
    poweranalysis:'Power Analysis', metaanalysis:'Meta-Analysis',
    sem:'Structural Equation Modeling', hlm:'Hierarchical Linear Model',
    crosstab:'Crosstab / Chi-Square', reliability:'Reliability'
  };

  function subLabel(o){ return SUB_LABEL[o.type]||o.title||o.type; }

  var groups={};
  var groupOrder=[];
  outputs.forEach(function(o){
    var grp=_outGroup(o);
    var sub=subLabel(o);
    if(!groups[grp]){groups[grp]={};groupOrder.push(grp);}
    if(!groups[grp][sub]) groups[grp][sub]=[];
    groups[grp][sub].push(o.id);
  });

  var selIds=new Set(outputs.map(function(o){return o.id;}));

  var ex=document.getElementById('_exp-bulk-dialog');
  if(ex) ex.remove();

  var overlay=document.createElement('div');
  overlay.id='_exp-bulk-dialog';
  overlay.style.cssText='position:fixed;inset:0;z-index:9900;background:var(--scrim);display:flex;align-items:center;justify-content:center;padding:16px';

  var box=document.createElement('div');
  box.className='modal-box';
  box.style.cssText='width:100%;max-width:520px;max-height:88dvh;display:flex;flex-direction:column;padding:0;overflow:hidden';

  var hdr=document.createElement('div');
  hdr.style.cssText='padding:18px 20px 14px;border-bottom:1px solid var(--line-soft);flex-shrink:0';
  hdr.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between">'
    +'<div style="display:flex;align-items:center;gap:10px">'
    +'<div class="orias-prism-mark" aria-hidden="true"></div>'
    +'<div><div style="font-size:17px;font-weight:700;color:var(--ink);font-family:var(--font-serif-stack)">Export ke Word</div>'
    +'<div style="font-size:12px;color:var(--ink-muted);margin-top:2px">Pilih analisis yang ingin diekspor</div></div></div>'
    +'<button id="_exp-bulk-close" class="btn btn-ghost btn-sm" style="min-width:36px;min-height:36px;padding:0;justify-content:center" aria-label="Close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>'
    +'</div>';

  var selBar=document.createElement('div');
  selBar.style.cssText='padding:8px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line-soft);flex-shrink:0;background:var(--surface-alt)';
  selBar.innerHTML='<div id="_exp-sel-count" style="font-size:12px;font-weight:600;color:var(--ink-muted)"></div>'
    +'<div style="display:flex;gap:6px">'
    +'<button id="_exp-sel-all" class="btn btn-ghost btn-sm" style="min-height:32px;padding:4px 10px">Pilih Semua</button>'
    +'<button id="_exp-sel-none" class="btn btn-ghost btn-sm" style="min-height:32px;padding:4px 10px">Batalkan</button>'
    +'</div>';

  var listWrap=document.createElement('div');
  listWrap.id='_exp-list-wrap';
  listWrap.style.cssText='overflow-y:auto;flex:1;padding:12px 20px 8px';

  var footer=document.createElement('div');
  footer.style.cssText='padding:14px 20px;border-top:1px solid var(--line-soft);flex-shrink:0;display:flex;gap:8px;align-items:center';
  footer.innerHTML='<button id="_exp-bulk-cancel" class="btn btn-ghost" style="flex:1">Batal</button>'
    +'<div style="flex:2;display:flex;flex-direction:column;gap:5px">'
    +'<div style="display:flex;gap:6px">'
    +'<button id="_exp-bulk-table" class="btn btn-ghost" style="flex:1;font-size:12px">Teks &amp; Tabel</button>'
    +'<button id="_exp-bulk-chart" class="btn btn-primary" style="flex:1;font-size:12px">Lengkap + Chart</button>'
    +'</div>'
    +'<div id="_exp-bulk-hint" style="font-size:11px;color:var(--ink-subtle);text-align:center"></div>'
    +'</div>';

  box.appendChild(hdr);
  box.appendChild(selBar);
  box.appendChild(listWrap);
  box.appendChild(footer);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  function renderList(){
    listWrap.innerHTML='';
    groupOrder.forEach(function(grp){
      var subMap=groups[grp];
      var subTypes=Object.keys(subMap);
      var grpColor=_outGroupColor(grp);
      var grpIcon=_outGroupIcon(grp);

      var grpIds=[];
      subTypes.forEach(function(s){ subMap[s].forEach(function(id){grpIds.push(id);}); });
      var grpAllSel=grpIds.every(function(id){return selIds.has(id);});
      var grpNoneSel=grpIds.every(function(id){return !selIds.has(id);});
      var grpPartial=!grpAllSel&&!grpNoneSel;

      var grpRow=document.createElement('div');
      grpRow.style.cssText='display:flex;align-items:center;gap:10px;padding:9px 0 6px;border-bottom:1px solid var(--line-soft);margin-bottom:4px;cursor:pointer;user-select:none';
      grpRow.innerHTML='<input type="checkbox" id="grp-chk-'+encodeURIComponent(grp)+'" '+(grpAllSel?'checked':'')+' style="accent-color:var(--ink);width:15px;height:15px;cursor:pointer;flex-shrink:0"/>'
        +'<span style="color:'+grpColor+';display:flex;align-items:center;flex-shrink:0">'+grpIcon+'</span>'
        +'<span style="font-size:13px;font-weight:700;color:var(--ink)">'+escHtml(grp)+'</span>'
        +'<span style="background:var(--surface-alt);color:var(--ink-muted);border:1px solid var(--line-soft);border-radius:var(--r-sm);padding:1px 7px;font-size:10.5px;font-weight:700;margin-left:auto;font-variant-numeric:tabular-nums">'+grpIds.length+' hasil</span>';
      var grpChk=grpRow.querySelector('input');
      if(grpPartial) grpChk.indeterminate=true;
      grpChk.addEventListener('change',function(e){
        e.stopPropagation();
        grpIds.forEach(function(id){if(this.checked)selIds.add(id);else selIds.delete(id);},this);
        renderList(); updateFooter();
      });
      grpRow.addEventListener('click',function(e){
        if(e.target.tagName==='INPUT') return;
        grpChk.checked=!grpChk.checked;
        grpIds.forEach(function(id){if(grpChk.checked)selIds.add(id);else selIds.delete(id);});
        renderList(); updateFooter();
      });
      listWrap.appendChild(grpRow);

      subTypes.forEach(function(sub){
        var ids=subMap[sub];
        var allSel=ids.every(function(id){return selIds.has(id);});
        var noneSel=ids.every(function(id){return !selIds.has(id);});
        var partial=!allSel&&!noneSel;

        var subRow=document.createElement('div');
        subRow.style.cssText='display:flex;align-items:center;gap:10px;padding:7px 8px 7px 24px;border-radius:var(--r-sm);cursor:pointer;user-select:none;margin-bottom:2px;transition:.1s;'+(allSel?'background:var(--surface-alt)':'');
        subRow.innerHTML='<input type="checkbox" '+(allSel?'checked':'')+' style="accent-color:var(--ink);width:14px;height:14px;cursor:pointer;flex-shrink:0"/>'
          +'<div style="flex:1;min-width:0">'
          +'<div style="font-size:12.5px;font-weight:600;color:'+(allSel?'var(--ink)':'var(--ink-muted)')+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+escHtml(sub)+'</div>'
          +'<div style="font-size:10.5px;color:var(--ink-subtle);margin-top:1px">'+ids.length+' output'+(ids.length>1?'s':'')+' tersimpan</div>'
          +'</div>'
          +'<span style="background:var(--surface);color:var(--ink-muted);border:1px solid var(--line-soft);border-radius:var(--r-sm);padding:2px 8px;font-size:10.5px;font-weight:700;flex-shrink:0;font-variant-numeric:tabular-nums">'+ids.length+'</span>';
        var subChk=subRow.querySelector('input');
        if(partial) subChk.indeterminate=true;
        subChk.addEventListener('change',function(e){
          e.stopPropagation();
          ids.forEach(function(id){if(this.checked)selIds.add(id);else selIds.delete(id);},this);
          renderList(); updateFooter();
        });
        subRow.addEventListener('click',function(e){
          if(e.target.tagName==='INPUT') return;
          subChk.checked=!subChk.checked;
          ids.forEach(function(id){if(subChk.checked)selIds.add(id);else selIds.delete(id);});
          renderList(); updateFooter();
        });
        subRow.onmouseover=function(){if(!allSel)subRow.style.background='var(--surface-alt)';};
        subRow.onmouseout=function(){var a=ids.every(function(id){return selIds.has(id);});subRow.style.background=a?'var(--surface-alt)':'';};
        listWrap.appendChild(subRow);
      });

      var sp=document.createElement('div');
      sp.style.height='10px';
      listWrap.appendChild(sp);
    });
  }

  function updateFooter(){
    var n=selIds.size;
    document.getElementById('_exp-sel-count').textContent=n+' output dipilih dari '+outputs.length;
    document.getElementById('_exp-bulk-hint').textContent=n===0?'Pilih minimal 1 output untuk mengekspor':n+' output akan diekspor ke .doc';
    var tableBtn=document.getElementById('_exp-bulk-table');
    var chartBtn=document.getElementById('_exp-bulk-chart');
    if(tableBtn){tableBtn.disabled=n===0;tableBtn.style.opacity=n===0?'.4':'1';}
    if(chartBtn){chartBtn.disabled=n===0;chartBtn.style.opacity=n===0?'.4':'1';}
  }

  renderList();
  updateFooter();

  document.getElementById('_exp-sel-all').onclick=function(){
    outputs.forEach(function(o){selIds.add(o.id);});
    renderList(); updateFooter();
  };
  document.getElementById('_exp-sel-none').onclick=function(){
    selIds.clear();
    renderList(); updateFooter();
  };

  document.getElementById('_exp-bulk-close').onclick=function(){overlay.remove();};
  document.getElementById('_exp-bulk-cancel').onclick=function(){overlay.remove();};
  overlay.addEventListener('click',function(e){if(e.target===overlay)overlay.remove();});

  document.getElementById('_exp-bulk-table').onclick=function(){
    if(!selIds.size){showToast('Pilih minimal 1 output','error');return;}
    overlay.remove();
    _exportBulkWord(Array.from(selIds),'table');
  };
  document.getElementById('_exp-bulk-chart').onclick=function(){
    if(!selIds.size){showToast('Pilih minimal 1 output','error');return;}
    overlay.remove();
    _exportBulkWord(Array.from(selIds),'both');
  };
}
