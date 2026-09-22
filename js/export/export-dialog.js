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
  overlay.style.cssText='position:fixed;inset:0;z-index:9900;background:rgba(5,1,14,.82);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px';

  var box=document.createElement('div');
  box.style.cssText='background:linear-gradient(135deg,rgba(20,8,40,.98),rgba(14,6,24,.99));border:1px solid rgba(192,132,252,.3);border-radius:18px;padding:24px;width:100%;max-width:380px;box-shadow:0 20px 60px rgba(0,0,0,.8)';

  // Header
  box.innerHTML='<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">'
    +'<span style="font-size:18px">⬇</span>'
    +'<div style="font-size:15px;font-weight:700;color:#e8deff;font-family:Playfair Display,serif;font-style:italic">Export to Word</div>'
    +'</div>'
    +'<div style="font-size:11.5px;color:rgba(232,222,255,.45);margin-bottom:18px;padding-left:28px">'+escHtml(o.title)+'</div>';

  // Option cards
  var opts=[
    {
      mode:'table',
      icon:'📋',
      label:'Text & Table Only',
      desc:'Ringkasan statistik + tabel hasil — tanpa diagram',
      always:true
    },
    {
      mode:'chart',
      icon:'📊',
      label:'Diagram/Chart Only',
      desc:'Hanya diagram grafis — tanpa tabel statistik',
      always:false
    },
    {
      mode:'both',
      icon:'📄',
      label:'Text, Table & Chart',
      desc:'Lengkap: ringkasan + tabel + diagram',
      always:false
    }
  ];

  var optWrap=document.createElement('div');
  optWrap.style.cssText='display:flex;flex-direction:column;gap:8px;margin-bottom:20px';

  opts.forEach(function(opt){
    var available=opt.always||hasChart;
    var btn=document.createElement('div');
    btn.style.cssText='display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:11px;border:1px solid '
      +(available?'rgba(192,132,252,.22)':'rgba(255,255,255,.06)')+';cursor:'
      +(available?'pointer':'not-allowed')+';background:'
      +(available?'rgba(124,58,237,.06)':'rgba(255,255,255,.02)')+';transition:.15s;opacity:'+(available?'1':'.38');
    if(available){
      btn.onmouseover=function(){this.style.background='rgba(124,58,237,.15)';this.style.borderColor='rgba(192,132,252,.45)';};
      btn.onmouseout=function(){this.style.background='rgba(124,58,237,.06)';this.style.borderColor='rgba(192,132,252,.22)';};
      btn.onclick=function(){overlay.remove();_exportSingleOutput(id,opt.mode);};
    }
    btn.innerHTML='<div style="font-size:22px;flex-shrink:0">'+opt.icon+'</div>'
      +'<div><div style="font-size:12.5px;font-weight:700;color:'+(available?'#e8deff':'rgba(232,222,255,.3)')+'">'+opt.label+'</div>'
      +'<div style="font-size:10.5px;color:'+(available?'rgba(232,222,255,.45)':'rgba(232,222,255,.2)')+'">'+opt.desc+'</div>'
      +((!available)?' <div style="font-size:9.5px;color:#fbbf24;margin-top:3px">⚠ Analisis ini tidak memiliki diagram</div>':'')
      +(available&&opt.mode!=='table'&&hasChart?' <div style="font-size:9.5px;color:#a78bfa;margin-top:2px">Chart: '+chartTypes.join(', ')+'</div>':'')
      +'</div>';
    optWrap.appendChild(btn);
  });

  box.appendChild(optWrap);

  // Export All button
  var allRow=document.createElement('div');
  allRow.style.cssText='display:flex;gap:8px;border-top:1px solid rgba(192,132,252,.1);padding-top:14px';

  var cancelBtn=document.createElement('button');
  cancelBtn.textContent='Batal';
  cancelBtn.style.cssText='flex:1;padding:9px;border-radius:8px;border:1px solid rgba(124,58,237,.25);background:transparent;color:rgba(232,222,255,.55);font-size:12.5px;cursor:pointer;font-family:Inter,sans-serif;font-weight:600';
  cancelBtn.onclick=function(){overlay.remove();};

  var exportAllBtn=document.createElement('button');
  exportAllBtn.textContent='⬇ Export Semua Output';
  exportAllBtn.style.cssText='flex:2;padding:9px;border-radius:8px;border:none;background:rgba(124,58,237,.18);color:#c084fc;font-size:12px;cursor:pointer;font-family:Inter,sans-serif;font-weight:600;border:1px solid rgba(124,58,237,.3)';
  exportAllBtn.onmouseover=function(){this.style.background='rgba(124,58,237,.3)';};
  exportAllBtn.onmouseout=function(){this.style.background='rgba(124,58,237,.18)';};
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

  // Map type → human-readable sub-label
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

  // Build tree: group → {subType → [output ids]} 
  var groups={};   // { groupName: { subType: [ids] } }
  var groupOrder=[];
  outputs.forEach(function(o){
    var grp=_outGroup(o);
    var sub=subLabel(o);
    if(!groups[grp]){groups[grp]={};groupOrder.push(grp);}
    if(!groups[grp][sub]) groups[grp][sub]=[];
    groups[grp][sub].push(o.id);
  });

  // State: selected IDs set
  var selIds=new Set(outputs.map(function(o){return o.id;})); // all selected by default

  // Remove any existing dialog
  var ex=document.getElementById('_exp-bulk-dialog');
  if(ex) ex.remove();

  // Build overlay
  var overlay=document.createElement('div');
  overlay.id='_exp-bulk-dialog';
  overlay.style.cssText='position:fixed;inset:0;z-index:9900;background:rgba(5,1,14,.85);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:16px';

  var box=document.createElement('div');
  box.style.cssText='background:linear-gradient(160deg,rgba(22,10,44,.99),rgba(14,6,24,.99));border:1px solid rgba(192,132,252,.28);border-radius:20px;width:100%;max-width:520px;max-height:88vh;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,.85)';

  // Header
  var hdr=document.createElement('div');
  hdr.style.cssText='padding:20px 22px 14px;border-bottom:1px solid rgba(192,132,252,.12);flex-shrink:0';
  hdr.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between">'
    +'<div style="display:flex;align-items:center;gap:10px">'
    +'<div style="width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#db2777);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">⬇</div>'
    +'<div><div style="font-size:15px;font-weight:800;color:#e8deff;font-family:Playfair Display,serif;font-style:italic">Export ke Word</div>'
    +'<div style="font-size:10.5px;color:rgba(232,222,255,.38);margin-top:1px">Pilih analisis yang ingin diekspor</div></div></div>'
    +'<button id="_exp-bulk-close" style="background:rgba(255,255,255,.06);border:none;border-radius:8px;width:28px;height:28px;cursor:pointer;color:rgba(232,222,255,.5);font-size:16px;display:flex;align-items:center;justify-content:center">✕</button>'
    +'</div>';

  // Select All / None bar
  var selBar=document.createElement('div');
  selBar.style.cssText='padding:8px 22px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(192,132,252,.08);flex-shrink:0;background:rgba(124,58,237,.04)';
  selBar.innerHTML='<div id="_exp-sel-count" style="font-size:11px;font-weight:600;color:rgba(232,222,255,.45)"></div>'
    +'<div style="display:flex;gap:6px">'
    +'<button id="_exp-sel-all" style="font-size:10.5px;padding:3px 10px;border-radius:6px;border:1px solid rgba(124,58,237,.3);background:rgba(124,58,237,.1);color:#c084fc;cursor:pointer;font-family:Inter,sans-serif;font-weight:600">Pilih Semua</button>'
    +'<button id="_exp-sel-none" style="font-size:10.5px;padding:3px 10px;border-radius:6px;border:1px solid rgba(255,255,255,.1);background:transparent;color:rgba(232,222,255,.4);cursor:pointer;font-family:Inter,sans-serif;font-weight:600">Batalkan Semua</button>'
    +'</div>';

  // Scrollable list
  var listWrap=document.createElement('div');
  listWrap.id='_exp-list-wrap';
  listWrap.style.cssText='overflow-y:auto;flex:1;padding:12px 22px 8px';

  // Footer
  var footer=document.createElement('div');
  footer.style.cssText='padding:14px 22px;border-top:1px solid rgba(192,132,252,.12);flex-shrink:0;display:flex;gap:8px;align-items:center';
  footer.innerHTML='<button id="_exp-bulk-cancel" style="flex:1;padding:10px;border-radius:9px;border:1px solid rgba(124,58,237,.2);background:transparent;color:rgba(232,222,255,.5);font-size:12.5px;cursor:pointer;font-family:Inter,sans-serif;font-weight:600">Batal</button>'
    +'<div style="flex:2;display:flex;flex-direction:column;gap:5px">'
    +'<div style="display:flex;gap:5px">'
    +'<button id="_exp-bulk-table" style="flex:1;padding:8px 6px;border-radius:8px;border:none;background:rgba(124,58,237,.18);color:#c084fc;font-size:11px;cursor:pointer;font-family:Inter,sans-serif;font-weight:700;border:1px solid rgba(124,58,237,.3)">📋 Teks &amp; Tabel</button>'
    +'<button id="_exp-bulk-chart" style="flex:1;padding:8px 6px;border-radius:8px;border:none;background:rgba(52,211,153,.1);color:#34d399;font-size:11px;cursor:pointer;font-family:Inter,sans-serif;font-weight:700;border:1px solid rgba(52,211,153,.25)">📊 + Chart</button>'
    +'</div>'
    +'<div id="_exp-bulk-hint" style="font-size:9.5px;color:rgba(232,222,255,.28);text-align:center"></div>'
    +'</div>';

  box.appendChild(hdr);
  box.appendChild(selBar);
  box.appendChild(listWrap);
  box.appendChild(footer);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  // Render checkbox list
  function renderList(){
    listWrap.innerHTML='';
    groupOrder.forEach(function(grp){
      var subMap=groups[grp];
      var subTypes=Object.keys(subMap);
      var grpColor=_outGroupColor(grp);
      var grpIcon=_outGroupIcon(grp);

      // All IDs in this group
      var grpIds=[];
      subTypes.forEach(function(s){ subMap[s].forEach(function(id){grpIds.push(id);}); });
      var grpAllSel=grpIds.every(function(id){return selIds.has(id);});
      var grpNoneSel=grpIds.every(function(id){return !selIds.has(id);});
      var grpPartial=!grpAllSel&&!grpNoneSel;

      // Group header row
      var grpRow=document.createElement('div');
      grpRow.style.cssText='display:flex;align-items:center;gap:10px;padding:9px 0 5px;border-bottom:1px solid '+grpColor+'18;margin-bottom:4px;cursor:pointer;user-select:none';
      grpRow.innerHTML='<input type="checkbox" id="grp-chk-'+encodeURIComponent(grp)+'" '+(grpAllSel?'checked':'')+' '+(grpPartial?'': '')+' style="accent-color:'+grpColor+';width:14px;height:14px;cursor:pointer;flex-shrink:0"/>'
        +'<span style="color:'+grpColor+';display:flex;align-items:center;flex-shrink:0">'+grpIcon+'</span>'
        +'<span style="font-size:12.5px;font-weight:800;color:'+grpColor+';letter-spacing:.3px">'+grp+'</span>'
        +'<span style="background:'+grpColor+'22;color:'+grpColor+';border-radius:999px;padding:1px 7px;font-size:9.5px;font-weight:700;margin-left:auto">'+grpIds.length+' hasil</span>';
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

      // Sub-type rows (only show if group has multiple sub-types OR always show)
      subTypes.forEach(function(sub){
        var ids=subMap[sub];
        var allSel=ids.every(function(id){return selIds.has(id);});
        var noneSel=ids.every(function(id){return !selIds.has(id);});
        var partial=!allSel&&!noneSel;

        var subRow=document.createElement('div');
        subRow.style.cssText='display:flex;align-items:center;gap:10px;padding:6px 6px 6px 24px;border-radius:8px;cursor:pointer;user-select:none;margin-bottom:2px;transition:.1s;'+(allSel?'background:'+grpColor+'0d':'');
        subRow.innerHTML='<input type="checkbox" '+(allSel?'checked':'')+' style="accent-color:'+grpColor+';width:13px;height:13px;cursor:pointer;flex-shrink:0"/>'
          +'<div style="flex:1;min-width:0">'
          +'<div style="font-size:11.5px;font-weight:700;color:'+(allSel?'#e8deff':'rgba(232,222,255,.6)')+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+sub+'</div>'
          +'<div style="font-size:9.5px;color:rgba(232,222,255,.3);margin-top:1px">'+ids.length+' output'+( ids.length>1?'s':'')+' tersimpan</div>'
          +'</div>'
          +'<span style="background:'+(allSel?grpColor+'25':'rgba(255,255,255,.05)')+';color:'+(allSel?grpColor:'rgba(232,222,255,.25)')+';border:1px solid '+(allSel?grpColor+'35':'rgba(255,255,255,.08)')+';border-radius:6px;padding:2px 8px;font-size:10px;font-weight:700;flex-shrink:0">'+ids.length+'</span>';
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
        subRow.onmouseover=function(){if(!subRow.style.background||subRow.style.background==='')subRow.style.background='rgba(124,58,237,.05)';};
        subRow.onmouseout=function(){var a=ids.every(function(id){return selIds.has(id);});subRow.style.background=a?grpColor+'0d':'';};
        listWrap.appendChild(subRow);
      });

      // Spacer
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
    if(tableBtn){tableBtn.disabled=n===0;tableBtn.style.opacity=n===0?'.35':'1';}
    if(chartBtn){chartBtn.disabled=n===0;chartBtn.style.opacity=n===0?'.35':'1';}
  }

  renderList();
  updateFooter();

  // Event: Select All / None
  document.getElementById('_exp-sel-all').onclick=function(){
    outputs.forEach(function(o){selIds.add(o.id);});
    renderList(); updateFooter();
  };
  document.getElementById('_exp-sel-none').onclick=function(){
    selIds.clear();
    renderList(); updateFooter();
  };

  // Event: Close
  document.getElementById('_exp-bulk-close').onclick=function(){overlay.remove();};
  document.getElementById('_exp-bulk-cancel').onclick=function(){overlay.remove();};
  overlay.addEventListener('click',function(e){if(e.target===overlay)overlay.remove();});

  // Event: Export buttons
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
