// DATA VIEW
var sortCol=null,sortDir='asc',searchQ='',selRows=new Set();

var sprMode=false; // spreadsheet (bulk edit) mode

// WINDOWED RENDERING untuk dataset besar (performa)
// Di bawah threshold ini, semua baris dirender seperti biasa (perilaku tidak berubah).
// Di atas threshold, hanya render batch pertama + tombol "Muat lebih banyak" —
// menghindari innerHTML raksasa untuk ribuan baris tanpa mengubah fitur edit/checkbox.
var _ossDataPageThreshold = 300;
var _ossDataPageSize = 300;
var _ossDataShown = _ossDataPageSize;

function renderData(el){
  var html='';
  // Toolbar
  html+='<div class="data-toolbar">';
  html+='<div class="dt-search"><span class="dt-search-ic">'+IC.search+'</span><input class="inp" id="srch-inp" placeholder="Search…" value="'+escHtmlAttr(searchQ)+'" oninput="searchData(this.value)" autocomplete="off"/></div>';
  html+='<div class="dt-actions">';
  // + Add: always inline blank row, no popup
  html+='<button class="dt-btn dt-btn-add" onclick="addDataRowInline()">'+IC.plus+' Add</button>';
  if(sprMode){
    // In combined edit mode: single Done button saves + closes checkbox mode
    html+='<button class="dt-btn dt-btn-done" onclick="saveSprMode()">'+IC.check+' Done</button>';
    html+='<button class="dt-btn dt-btn-edit" onclick="exitSprMode()">Cancel</button>';
  } else if(editMode){
    // Delete only visible when rows are selected
    if(selRows.size>0){
      html+='<button class="dt-btn dt-btn-del" id="del-btn" onclick="deleteSelected()">'+IC.trash+' Del '+selRows.size+'</button>';
    }
    html+='<button class="dt-btn dt-btn-done" onclick="toggleEditMode()">'+IC.check+' Done</button>';
  } else {
    // Single Edit button: enters combined mode (checkbox + inline editing)
    html+='<button class="dt-btn dt-btn-edit" onclick="enterCombinedEditMode()">'+IC.edit+' Edit</button>';
  }
  var csvBtn='<button class="dt-btn dt-btn-csv" onclick="document.getElementById(&quot;csv-input&quot;).click()">'+IC.upload+' CSV</button>';
  html+=csvBtn;
  html+='</div></div>';

  // Table directly on surface (Aturan 3.9)
  var d=[...data];
  if(searchQ&&!sprMode) d=d.filter(function(r){return vars.some(function(v){return String(r[v.name]??'').toLowerCase().includes(searchQ.toLowerCase());});});
  if(sortCol&&!sprMode) d.sort(function(a,b){var av=a[sortCol]??'',bv=b[sortCol]??'';return sortDir==='asc'?(av>bv?1:-1):(av<bv?1:-1);});

  html+='<div class="tbl-wrap"><table class="data-tbl"><thead><tr>';
  // Checkbox header col shown in editMode (includes sprMode since combined)
  if(editMode||sprMode){
    html+='<th style="width:36px"><input type="checkbox" id="chk-all" onchange="toggleAllRows(this)" aria-label="Select all rows"/></th>';
  }
  html+='<th style="width:44px;text-align:right;color:var(--ink-muted)">#</th>';
  vars.forEach(function(v){
    var MC={Scale:'var(--line)',Nominal:'var(--warn)',Ordinal:'var(--ok)'};
    var sc=sortCol===v.name&&!sprMode?(sortDir==='asc'?' '+IC.sort_asc:' '+IC.sort_desc):'';
    var dot='<span style="display:inline-block;width:6px;height:6px;margin-right:5px;vertical-align:1px;background:'+(MC[v.measure]||'var(--ink-subtle)')+';clip-path:polygon(50% 0%,100% 50%,50% 100%,0% 50%)"></span>';
    var vNameSafe=escHtml(v.name);
    var wBadge=(aState.wcActive&&aState.wcVar===v.name)
      ?'<span class="tag tag-yellow" style="margin-left:5px;font-size:10px;padding:0 5px">W</span>':'';
    var isNumCol=(v.type==='Numeric'||v.type==='Scale');
    var alignStyle=isNumCol?'text-align:right;':'';
    if(sprMode){
      html+='<th style="'+alignStyle+'">'+dot+vNameSafe+wBadge+' <button class="col-fill-btn" onclick="colFillModal(this.dataset.vn)" data-vn="'+escHtmlAttr(v.name)+'" title="Fill entire column">Fill</button></th>';
    } else {
      html+='<th onclick="toggleSort(this.dataset.col)" data-col="'+escHtmlAttr(v.name)+'" style="cursor:pointer;'+alignStyle+'">'+dot+vNameSafe+wBadge+sc+'</th>';
    }
  });
  html+='</tr></thead><tbody>';

  var isWindowed = !sprMode && d.length > _ossDataPageThreshold;
  var dShown = isWindowed ? d.slice(0, _ossDataShown) : d;

  dShown.forEach(function(row,ri){
    var sel=selRows.has(row.id);
    html+='<tr class="'+(sel?'selected':ri%2===0?'alt':'')+'">';
    if(editMode||sprMode){
      html+='<td style="width:36px;text-align:center">';
      html+='<input type="checkbox" data-rowcb="'+row.id+'" '+(sel?'checked':'')+' onchange="toggleRow('+row.id+',this)" aria-label="Select row '+(ri+1)+'"/>';
      html+='</td>';
    }
    html+='<td class="td-num" style="color:var(--ink-subtle);font-size:11.5px">'+(ri+1)+'</td>';
    vars.forEach(function(v){
      var val=row[v.name];var iM=isMiss(val);
      if(sprMode){
        var dispVal=(iM?'':String(val??''));
        html+='<td style="padding:3px 4px">';
        html+='<input class="spr-cell" ';
        html+='data-rowid="'+row.id+'" data-field="'+escHtmlAttr(v.name)+'" ';
        html+='type="text" ';
        if(v.type==='Numeric'||v.type==='Scale'){
          html+='inputmode="decimal" ';
        }
        html+='value="'+escHtmlAttr(dispVal)+'" ';
        html+='placeholder="—" ';
        html+='onkeydown="sprKeyNav(event,'+row.id+',this.dataset.field)" ';
        html+='onchange="sprCellChange(this,\''+v.type+'\')" ';
        html+='oninput="sprCellInput(this)" />';
        html+='</td>';
      } else {
        if(iM) html+='<td'+((v.type==='Numeric'||v.type==='Scale')?' style="text-align:right"':'')+'><span class="td-miss">—</span></td>';
        else if(v.type==='Numeric'&&typeof val==='number') html+='<td class="td-num">'+val.toFixed(v.dec)+'</td>';
        else html+='<td><span class="td-str">'+escHtml(val)+'</span></td>';
      }
    });
    html+='</tr>';
  });
  html+='</tbody></table></div>';

  // Footer info bar
  html+='<div style="padding:8px 2px;color:var(--ink-muted);font-size:12px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;font-variant-numeric:tabular-nums">';
  html+='<span>'+dShown.length+' / '+d.length+' rows'+(d.length!==data.length?' (dari '+data.length+' total)':'')+(aState.wcActive?' <span class="tag tag-yellow" style="margin-left:6px">N efektif = '+getNEff()+'</span>':'')+'</span>';
  if(isWindowed && dShown.length<d.length){
    html+='<button class="dt-btn" style="margin-left:auto" onclick="_ossLoadMoreRows()">Muat '+Math.min(_ossDataPageSize,d.length-dShown.length)+' baris lagi</button>';
  }
  html+='</div>';
  el.innerHTML=html;

  // Re-sync del btn (now only rendered when selRows.size>0, no re-sync needed)
  // If sprMode, restore sprBuffer into inputs
  if(sprMode&&Object.keys(sprBuffer).length){
    Object.keys(sprBuffer).forEach(function(rowId){
      Object.keys(sprBuffer[rowId]).forEach(function(field){
        var inp=document.querySelector('.spr-cell[data-rowid="'+rowId+'"][data-field="'+field+'"]');
        if(inp) inp.value=sprBuffer[rowId][field]===null?'':String(sprBuffer[rowId][field]??'');
      });
    });
  }
}

// SPREADSHEET (BULK EDIT) MODE & DATA VIEW ACTIONS
var sprBuffer={}; // {rowId: {field: value}} — pending changes

function escHtmlAttr(s){
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function enterSprMode(){
  sprMode=true;
  sprBuffer={};
  editMode=false;
  selRows.clear();
  switchTab('data');
  showToast('Edit mode aktif');
}

function exitSprMode(){
  function _doExit(){
    sprMode=false;sprBuffer={};editMode=false;selRows.clear();switchTab('data');
  }
  if(Object.keys(sprBuffer).length>0){
    var modal=document.createElement('div');
    modal.style.cssText='position:fixed;inset:0;z-index:9900;background:var(--scrim);display:flex;align-items:center;justify-content:center;padding:16px';
    var box=document.createElement('div');
    box.className='modal-box';
    box.style.cssText='border-top:2px solid var(--warn);padding:22px;width:100%;max-width:360px';
    box.innerHTML='<div style="font-size:16px;font-weight:700;color:var(--warn);margin-bottom:8px;font-family:var(--font-serif-stack)">Buang perubahan?</div><div style="font-size:13px;color:var(--ink-muted);margin-bottom:18px;line-height:1.6">Ada '+Object.keys(sprBuffer).length+' baris yang belum disimpan. Yakin ingin keluar tanpa menyimpan?</div><div style="display:flex;gap:8px"></div>';
    var btns=box.querySelector('div:last-child');
    var cb=document.createElement('button');cb.textContent='Batal';cb.className='btn btn-ghost';cb.style.flex='1';cb.onclick=function(){modal.remove();};
    var xb=document.createElement('button');xb.textContent='Buang & Keluar';xb.className='btn btn-red';xb.style.flex='1';xb.onclick=function(){modal.remove();_doExit();};
    btns.appendChild(cb);btns.appendChild(xb);
    modal.appendChild(box);
    modal.addEventListener('click',function(e){if(e.target===modal)modal.remove();});
    document.body.appendChild(modal);
  } else {
    _doExit();
  }
}

function saveSprMode(){
  // Flush all current input values first
  document.querySelectorAll('.spr-cell').forEach(function(inp){
    var rowId=parseInt(inp.dataset.rowid);
    var field=inp.dataset.field;
    var val=inp.value;
    var v=vars.find(function(x){return x.name===field;});
    if(!sprBuffer[rowId]) sprBuffer[rowId]={};
    if(val===''||val==='.'){sprBuffer[rowId][field]=null;}
    else if(v&&v.type==='Numeric'){var n=Number(val);sprBuffer[rowId][field]=isNaN(n)?null:n;}
    else{sprBuffer[rowId][field]=val;}
  });
  // Apply buffer to data
  var changed=0;
  Object.keys(sprBuffer).forEach(function(rowId){
    var row=data.find(function(r){return r.id===parseInt(rowId);});
    if(!row) return;
    Object.keys(sprBuffer[rowId]).forEach(function(field){
      row[field]=sprBuffer[rowId][field];
      changed++;
    });
  });
  sprMode=false;
  sprBuffer={};
  editMode=false;   // close checkbox mode too — single Done, single session
  selRows.clear();
  updateBadges();
  switchTab('data');
  showToast('Data berhasil disimpan');
}

function sprCellChange(inp,vtype){
  var rowId=parseInt(inp.dataset.rowid);
  var field=inp.dataset.field;
  if(!sprBuffer[rowId]) sprBuffer[rowId]={};
  var val=inp.value.trim();
  if(val===''||val==='.'){
    sprBuffer[rowId][field]=null;
    inp.placeholder='—';
  } else {
    if(vtype==='Numeric'){
      var n=Number(val);
      sprBuffer[rowId][field]=isNaN(n)?null:n;
      if(isNaN(n)) inp.style.borderColor='var(--err)';
      else inp.style.borderColor='';
    } else {
      sprBuffer[rowId][field]=val;
    }
  }
}

function sprCellInput(inp){
  inp.style.borderColor='';
}

function sprKeyNav(e,rowId,field){
  // Tab → next column, Shift+Tab → prev column, Enter → next row
  if(e.key==='Tab'||e.key==='Enter'){
    e.preventDefault();
    var vi=vars.findIndex(function(v){return v.name===field;});
    var ri=data.findIndex(function(r){return r.id===rowId;});
    var nextV=vi,nextR=ri;
    if(e.key==='Tab'){
      if(e.shiftKey){nextV=vi-1;if(nextV<0){nextV=vars.length-1;nextR=ri-1;}}
      else{nextV=vi+1;if(nextV>=vars.length){nextV=0;nextR=ri+1;}}
    } else {
      nextR=e.shiftKey?ri-1:ri+1;
    }
    nextR=Math.max(0,Math.min(nextR,data.length-1));
    nextV=Math.max(0,Math.min(nextV,vars.length-1));
    var nextRowId=data[nextR]?data[nextR].id:rowId;
    var nextField=vars[nextV]?vars[nextV].name:field;
    var nextInp=document.querySelector('.spr-cell[data-rowid="'+nextRowId+'"][data-field="'+nextField+'"]');
    if(nextInp){nextInp.focus();nextInp.select();}
  }
}

// Column Fill Modal — fill an entire column at once
function colFillModal(fieldName){
  var v=vars.find(function(x){return x.name===fieldName;});
  if(!v) return;
  var existingModal=document.getElementById('colfill-modal');
  if(existingModal) existingModal.remove();
  var modal=document.createElement('div');
  modal.id='colfill-modal';
  modal.style.cssText='position:fixed;inset:0;z-index:9600;background:var(--scrim);display:flex;align-items:center;justify-content:center;padding:16px';
  var box=document.createElement('div');
  box.className='modal-box';
  box.style.cssText='width:100%;max-width:480px;overflow:hidden;padding:0;animation:popIn .18s cubic-bezier(.16,1,.3,1)';

  var existing=[...new Set(data.map(function(r){return r[fieldName];}).filter(function(x){return x!==null&&x!==undefined;}))].slice(0,8);

  var hdrHtml='<div style="padding:14px 16px 10px;border-bottom:1px solid var(--line-soft);display:flex;align-items:center;justify-content:space-between">';
  hdrHtml+='<div><div style="font-family:var(--font-serif-stack);font-size:16px;font-weight:700;color:var(--ink)">Fill Column: '+escHtml(v.label)+'</div>';
  hdrHtml+='<div style="font-size:11.5px;color:var(--ink-muted);margin-top:2px">Apply a value to selected or all rows</div></div>';
  hdrHtml+='<button id="colfill-close" class="btn btn-ghost btn-sm" style="min-height:36px;min-width:36px;padding:0;justify-content:center" aria-label="Close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
  hdrHtml+='</div>';

  var bodyHtml='<div style="padding:16px;display:flex;flex-direction:column;gap:12px">';
  bodyHtml+='<div style="display:flex;gap:6px">';
  bodyHtml+='<button id="cfmode-all" onclick="cfSetMode(\'all\')" style="flex:1;min-height:38px;padding:6px 8px;border-radius:var(--r-sm);border:1.5px solid var(--ink);background:var(--surface-alt);color:var(--ink);font-size:12px;font-weight:700;cursor:pointer;font-family:var(--font-sans-stack)">All rows</button>';
  bodyHtml+='<button id="cfmode-empty" onclick="cfSetMode(\'empty\')" style="flex:1;min-height:38px;padding:6px 8px;border-radius:var(--r-sm);border:1px solid var(--line-soft);background:transparent;color:var(--ink-muted);font-size:12px;cursor:pointer;font-family:var(--font-sans-stack)">Missing only</button>';
  bodyHtml+='<button id="cfmode-range" onclick="cfSetMode(\'range\')" style="flex:1;min-height:38px;padding:6px 8px;border-radius:var(--r-sm);border:1px solid var(--line-soft);background:transparent;color:var(--ink-muted);font-size:12px;cursor:pointer;font-family:var(--font-sans-stack)">Row range</button>';
  bodyHtml+='</div>';

  bodyHtml+='<div id="cf-range-row" style="display:none;gap:8px">';
  bodyHtml+='<div style="flex:1"><label style="font-size:11px;color:var(--ink-muted);display:block;margin-bottom:3px">From row #</label><input id="cf-from" class="inp" type="number" min="1" value="1" style="width:100%"/></div>';
  bodyHtml+='<div style="flex:1"><label style="font-size:11px;color:var(--ink-muted);display:block;margin-bottom:3px">To row #</label><input id="cf-to" class="inp" type="number" min="1" value="'+data.length+'" style="width:100%"/></div>';
  bodyHtml+='</div>';

  bodyHtml+='<div><label style="font-size:11.5px;color:var(--ink-muted);display:block;margin-bottom:4px;font-weight:600">Value to fill <span style="color:var(--ink-subtle);font-weight:400">(type "." for missing)</span></label>';
  bodyHtml+='<input id="cf-val" class="inp" type="text" placeholder="'+(v.type==='Numeric'?'e.g. 0 or 42':'e.g. Tani or Buruh')+'" autocomplete="off"/></div>';

  if(existing.length){
    bodyHtml+='<div><div style="font-size:11px;color:var(--ink-subtle);margin-bottom:5px">Quick pick from existing values:</div>';
    bodyHtml+='<div style="display:flex;flex-wrap:wrap;gap:5px">';
    existing.forEach(function(ev){
      bodyHtml+='<button onclick="document.getElementById(\'cf-val\').value=\''+escHtmlAttr(String(ev))+'\'" class="btn btn-ghost btn-sm" style="min-height:32px;padding:4px 10px">'+escHtml(String(ev))+'</button>';
    });
    bodyHtml+='</div></div>';
  }

  if(v.type==='Numeric'){
    bodyHtml+='<details style="margin-top:2px"><summary style="cursor:pointer;font-size:12px;color:var(--ink);font-weight:600;list-style:none">Or fill with sequential numbers</summary>';
    bodyHtml+='<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">';
    bodyHtml+='<div style="flex:1;min-width:90px"><label style="font-size:11px;color:var(--ink-muted);display:block;margin-bottom:3px">Start value</label><input id="cf-seq-start" class="inp" type="number" value="1" style="width:100%"/></div>';
    bodyHtml+='<div style="flex:1;min-width:90px"><label style="font-size:11px;color:var(--ink-muted);display:block;margin-bottom:3px">Step</label><input id="cf-seq-step" class="inp" type="number" value="1" style="width:100%"/></div>';
    bodyHtml+='<div style="align-self:flex-end"><button onclick="applyColSeq(\''+escHtmlAttr(fieldName)+'\',\''+escHtmlAttr(v.type)+'\')" class="btn btn-ghost btn-sm">Fill Seq</button></div>';
    bodyHtml+='</div></details>';
  }

  bodyHtml+='</div>';

  var footHtml='<div style="padding:12px 16px;border-top:1px solid var(--line-soft);display:flex;gap:8px">';
  footHtml+='<button onclick="applyColFill(\''+escHtmlAttr(fieldName)+'\',\''+escHtmlAttr(v.type)+'\')" class="btn btn-primary" style="flex:1">Apply Fill</button>';
  footHtml+='<button id="colfill-cancel" class="btn btn-ghost">Cancel</button>';
  footHtml+='</div>';

  box.innerHTML=hdrHtml+bodyHtml+footHtml;
  modal.appendChild(box);
  document.body.appendChild(modal);
  modal.addEventListener('click',function(e){if(e.target===modal)modal.remove();});
  box.querySelector('#colfill-close').onclick=function(){modal.remove();};
  box.querySelector('#colfill-cancel').onclick=function(){modal.remove();};
  setTimeout(function(){var fi=box.querySelector('#cf-val');if(fi)fi.focus();},80);
  box.querySelector('#cf-val')._modal=modal;
  box._modal=modal;
}

var _cfMode='all';
function cfSetMode(m){
  _cfMode=m;
  ['all','empty','range'].forEach(function(mode){
    var btn=document.getElementById('cfmode-'+mode);
    if(btn){
      if(mode===m){btn.style.border='1.5px solid var(--ink)';btn.style.background='var(--surface-alt)';btn.style.color='var(--ink)';btn.style.fontWeight='700';}
      else{btn.style.border='1px solid var(--line-soft)';btn.style.background='transparent';btn.style.color='var(--ink-muted)';btn.style.fontWeight='500';}
    }
  });
  var rr=document.getElementById('cf-range-row');
  if(rr) rr.style.display=m==='range'?'flex':'none';
}

function applyColFill(fieldName,vtype){
  var inp=document.getElementById('cf-val');
  if(!inp) return;
  var rawVal=inp.value;
  var val;
  if(rawVal===''||rawVal==='.'){val=null;}
  else if(vtype==='Numeric'){var n=Number(rawVal);val=isNaN(n)?null:n;}
  else{val=rawVal;}
  
  var fromR=1,toR=data.length;
  if(_cfMode==='range'){
    fromR=parseInt(document.getElementById('cf-from')?.value)||1;
    toR=parseInt(document.getElementById('cf-to')?.value)||data.length;
  }
  
  var count=0;
  data.forEach(function(row,ri){
    var rowNum=ri+1;
    if(_cfMode==='range'&&(rowNum<fromR||rowNum>toR)) return;
    if(_cfMode==='empty'&&!isMiss(row[fieldName])) return;
    row[fieldName]=val;
    // Also update sprBuffer
    if(sprMode){if(!sprBuffer[row.id])sprBuffer[row.id]={};sprBuffer[row.id][fieldName]=val;}
    count++;
  });
  
  // Close modal
  var modal=document.getElementById('colfill-modal')||inp._modal;
  if(modal) modal.remove();
  
  updateBadges();
  renderTab('data');
  showToast('Fill kolom berhasil');
}

function applyColSeq(fieldName,vtype){
  var start=parseFloat(document.getElementById('cf-seq-start')?.value)||1;
  var step=parseFloat(document.getElementById('cf-seq-step')?.value)||1;
  var mode=_cfMode;
  var fromR=1,toR=data.length;
  if(mode==='range'){
    fromR=parseInt(document.getElementById('cf-from')?.value)||1;
    toR=parseInt(document.getElementById('cf-to')?.value)||data.length;
  }
  var cur=start,count=0;
  data.forEach(function(row,ri){
    var rowNum=ri+1;
    if(mode==='range'&&(rowNum<fromR||rowNum>toR)) return;
    if(mode==='empty'&&!isMiss(row[fieldName])) return;
    row[fieldName]=cur;
    if(sprMode){if(!sprBuffer[row.id])sprBuffer[row.id]={};sprBuffer[row.id][fieldName]=cur;}
    cur+=step;count++;
  });
  var modal=document.getElementById('colfill-modal');
  if(modal) modal.remove();
  updateBadges();renderTab('data');
  showToast('Fill berhasil');
}

// Add Multiple Empty Rows at once
function addMultipleRows(){
  var modal=document.createElement('div');
  modal.style.cssText='position:fixed;inset:0;z-index:9600;background:var(--scrim);display:flex;align-items:center;justify-content:center;padding:16px';
  var box=document.createElement('div');
  box.className='modal-box';
  box.style.cssText='width:100%;max-width:340px;padding:22px;display:flex;flex-direction:column;gap:14px';
  box.innerHTML='<div style="font-family:var(--font-serif-stack);font-size:17px;font-weight:700;color:var(--ink)">Add Empty Rows</div>'
    +'<div><label style="font-size:11.5px;color:var(--ink-muted);display:block;margin-bottom:5px">Number of rows to add</label>'
    +'<input id="addrows-n" class="inp" type="number" min="1" max="200" value="5" style="width:100%;font-weight:700"/></div>'
    +'<div style="display:flex;gap:8px">'
    +'<button id="addrows-ok" class="btn btn-primary" style="flex:1">Add Rows</button>'
    +'<button id="addrows-cancel" class="btn btn-ghost">Cancel</button>'
    +'</div>';
  modal.appendChild(box);
  document.body.appendChild(modal);
  modal.addEventListener('click',function(e){if(e.target===modal)modal.remove();});
  box.querySelector('#addrows-cancel').onclick=function(){modal.remove();};
  box.querySelector('#addrows-ok').onclick=function(){
    var n=parseInt(document.getElementById('addrows-n').value)||1;
    n=Math.max(1,Math.min(n,200));
    var maxId=Math.max.apply(null,data.map(function(r){return r.id;}).concat([0]));
    for(var i=0;i<n;i++){
      var row={id:maxId+i+1};
      vars.forEach(function(v){row[v.name]=v.name==='id'?maxId+i+1:null;});
      data.push(row);
    }
    modal.remove();
    updateBadges();
    renderTab('data');
    showToast('Rows berhasil ditambahkan');
  };
  setTimeout(function(){var inp=box.querySelector('#addrows-n');if(inp){inp.focus();inp.select();}},80);
}

var editMode=false;
function toggleCoefView(btn,view){
  document.getElementById('coef-ols').style.display=view==='ols'?'block':'none';
  document.getElementById('coef-hc3').style.display=view==='hc3'?'block':'none';
  document.querySelectorAll('.active-coef').forEach(b=>b.classList.remove('active-coef'));
  btn.classList.add('active-coef');
}
function toggleEditMode(){
  editMode=!editMode;
  if(!editMode) selRows.clear();
  switchTab('data');
}

// Combined Edit Mode: merges old editMode + sprMode into one button
function enterCombinedEditMode(){
  editMode=true;
  sprMode=true;
  sprBuffer={};
  selRows.clear();
  switchTab('data');
  showToast('Edit mode aktif');
}

// Inline Add Row (no popup)
function addDataRowInline(){
  var maxId=Math.max.apply(null,data.map(function(r){return r.id;}).concat([0]))+1;
  var row={id:maxId};
  vars.forEach(function(v){row[v.name]=v.name==='id'?maxId:null;});
  data.push(row);
  updateBadges();
  renderTab('data');
  // Scroll to bottom and focus first cell of new row
  setTimeout(function(){
    var cells=document.querySelectorAll('.spr-cell[data-rowid="'+maxId+'"]');
    if(cells.length) cells[0].focus();
    else{var tbl=document.querySelector('.data-tbl');if(tbl)tbl.scrollIntoView({behavior:'smooth',block:'end'});}
  },80);
}

function searchData(q){searchQ=q;_ossDataShown=_ossDataPageSize;renderTab('data');}
function toggleSort(col){if(sortCol===col)sortDir=sortDir==='asc'?'desc':'asc';else{sortCol=col;sortDir='asc';}_ossDataShown=_ossDataPageSize;renderTab('data');}
function _ossLoadMoreRows(){_ossDataShown+=_ossDataPageSize;renderTab('data');}
// Sinkronkan tombol Del di toolbar dengan jumlah baris tercentang.
// Dipakai oleh centang per-baris DAN centang "All" (header) supaya perilakunya sama.
function syncDelButton(){
  var toolbar=document.querySelector('.dt-actions');
  if(!toolbar) return;
  var existing=document.getElementById('del-btn');
  if(selRows.size>0){
    if(!existing){
      var doneBtn=toolbar.querySelector('.dt-btn-done');
      var newDel=document.createElement('button');
      newDel.id='del-btn';newDel.className='dt-btn dt-btn-del';
      newDel.onclick=function(){deleteSelected();};
      newDel.innerHTML=IC.trash+' Del '+selRows.size;
      if(doneBtn) toolbar.insertBefore(newDel,doneBtn);
      else toolbar.appendChild(newDel);
    } else {
      existing.disabled=false;
      existing.innerHTML=IC.trash+' Del '+selRows.size;
    }
  } else if(existing){
    existing.remove();
  }
}
function toggleRow(id,cb){
  if(cb.checked)selRows.add(id);else selRows.delete(id);
  syncDelButton();
  syncHeaderCheckbox();
}

function syncHeaderCheckbox(){
  var chkAll=document.getElementById('chk-all');
  if(!chkAll) return;
  var total=data.length, checked=selRows.size;
  if(checked===0){
    chkAll.checked=false;
    chkAll.indeterminate=false;
  } else if(checked===total){
    chkAll.checked=true;
    chkAll.indeterminate=false;
  } else {
    chkAll.checked=false;
    chkAll.indeterminate=true; // sebagian → tanda minus (—)
  }
}
function toggleAllRows(cb){
  // Jika semua sudah tercentang → uncheck semua; sebaliknya → check semua
  var allChecked=(selRows.size===data.length&&data.length>0);
  if(allChecked){
    selRows.clear();
    cb.checked=false;
    cb.indeterminate=false;
  } else {
    data.forEach(function(r){selRows.add(r.id);});
    cb.checked=true;
    cb.indeterminate=false;
  }
  // Sync semua row checkbox tanpa re-render penuh
  document.querySelectorAll('input[data-rowcb]').forEach(function(inp){
    inp.checked=selRows.has(parseInt(inp.dataset.rowcb));
  });
  // Sync del button (buat jika belum ada, hapus jika kosong)
  syncDelButton();
}
function deleteSelected(){if(!selRows.size)return;data=data.filter(r=>!selRows.has(r.id));selRows.clear();updateBadges();renderTab('data');showToast('Data berhasil dihapus');}
function addDataRow(){
  var nid=Math.max.apply(null,data.map(function(r){return r.id;}).concat([0]))+1;
  var modal=document.createElement('div');
  modal.id='add-row-modal';
  modal.style.cssText='position:fixed;inset:0;z-index:9500;background:var(--scrim);display:flex;align-items:center;justify-content:center;padding:16px';

  var box=document.createElement('div');
  box.className='modal-box';
  box.style.cssText='width:100%;max-width:560px;max-height:88dvh;display:flex;flex-direction:column;overflow:hidden;padding:0';

  var hdr=document.createElement('div');
  hdr.style.cssText='display:flex;align-items:center;justify-content:space-between;padding:14px 16px 10px;border-bottom:1px solid var(--line-soft);flex-shrink:0';
  hdr.innerHTML='<span style="font-family:var(--font-serif-stack);font-size:17px;font-weight:700;color:var(--ink)">Add New Row</span>';
  var closeBtn=document.createElement('button');
  closeBtn.className='btn btn-ghost btn-sm';
  closeBtn.setAttribute('aria-label','Close');
  closeBtn.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  closeBtn.style.cssText='min-width:36px;min-height:36px;padding:0;justify-content:center';
  closeBtn.onclick=function(){modal.remove();};
  hdr.appendChild(closeBtn);
  box.appendChild(hdr);

  var body=document.createElement('div');
  body.style.cssText='overflow-y:auto;flex:1;padding:14px 16px';
  var grid=document.createElement('div');
  grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px';

  vars.forEach(function(v){
    if(v.name==='id') return;
    var wrap=document.createElement('div');
    var lbl=document.createElement('label');
    lbl.style.cssText='font-size:11.5px;color:var(--ink-muted);display:block;margin-bottom:4px;font-weight:600';
    lbl.textContent=v.label;
    var inp=document.createElement('input');
    inp.id='new-'+v.name;
    inp.className='inp';
    inp.type=v.type==='Numeric'?'number':'text';
    inp.placeholder=v.type==='Numeric'?'Number…':'Text…';
    inp.autocomplete='off';
    inp.style.width='100%';
    wrap.appendChild(lbl);
    wrap.appendChild(inp);
    grid.appendChild(wrap);
  });
  body.appendChild(grid);
  box.appendChild(body);

  var foot=document.createElement('div');
  foot.style.cssText='padding:12px 16px;border-top:1px solid var(--line-soft);display:flex;gap:8px;flex-shrink:0';
  var addBtn=document.createElement('button');
  addBtn.textContent='Add Row';
  addBtn.className='btn btn-primary';
  addBtn.style.flex='1';
  addBtn.onclick=function(){confirmAddRow(nid);};
  var cancelBtn=document.createElement('button');
  cancelBtn.textContent='Cancel';
  cancelBtn.className='btn btn-ghost';
  cancelBtn.onclick=function(){modal.remove();};
  foot.appendChild(addBtn);
  foot.appendChild(cancelBtn);
  box.appendChild(foot);

  modal.appendChild(box);
  modal.addEventListener('click',function(e){if(e.target===modal)modal.remove();});
  document.body.appendChild(modal);
  setTimeout(function(){var fi=body.querySelector('.inp');if(fi)fi.focus();},100);
}

function editRowModal(rowId){
  var row=data.find(function(r){return r.id===rowId;});
  if(!row) return;
  var modal=document.createElement('div');
  modal.id='edit-row-modal';
  modal.style.cssText='position:fixed;inset:0;z-index:9500;background:var(--scrim);display:flex;align-items:center;justify-content:center;padding:16px';

  var box=document.createElement('div');
  box.className='modal-box';
  box.style.cssText='width:100%;max-width:560px;max-height:88dvh;display:flex;flex-direction:column;overflow:hidden;padding:0';

  var hdr=document.createElement('div');
  hdr.style.cssText='display:flex;align-items:center;justify-content:space-between;padding:14px 16px 10px;border-bottom:1px solid var(--line-soft);flex-shrink:0';
  hdr.innerHTML='<span style="font-family:var(--font-serif-stack);font-size:17px;font-weight:700;color:var(--ink)">Edit Row #'+rowId+'</span>';
  var closeBtn=document.createElement('button');
  closeBtn.className='btn btn-ghost btn-sm';
  closeBtn.setAttribute('aria-label','Close');
  closeBtn.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  closeBtn.style.cssText='min-width:36px;min-height:36px;padding:0;justify-content:center';
  closeBtn.onclick=function(){modal.remove();};
  hdr.appendChild(closeBtn);
  box.appendChild(hdr);

  var body=document.createElement('div');
  body.style.cssText='overflow-y:auto;flex:1;padding:14px 16px';
  var grid=document.createElement('div');
  grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px';

  vars.forEach(function(v){
    if(v.name==='id') return;
    var wrap=document.createElement('div');
    var lbl=document.createElement('label');
    lbl.style.cssText='font-size:11.5px;color:var(--ink-muted);display:block;margin-bottom:4px;font-weight:600';
    lbl.textContent=v.label;
    var inp=document.createElement('input');
    inp.id='edit-'+v.name;
    inp.className='inp';
    inp.type=v.type==='Numeric'?'number':'text';
    inp.autocomplete='off';
    inp.style.width='100%';
    var curVal=row[v.name];
    if(curVal===null||curVal===undefined){inp.placeholder='Missing (leave blank)';}
    else{inp.value=String(curVal);}
    wrap.appendChild(lbl);
    wrap.appendChild(inp);
    grid.appendChild(wrap);
  });
  body.appendChild(grid);
  box.appendChild(body);

  var foot=document.createElement('div');
  foot.style.cssText='padding:12px 16px;border-top:1px solid var(--line-soft);display:flex;gap:8px;flex-shrink:0';
  var saveBtn=document.createElement('button');
  saveBtn.textContent='Save Changes';
  saveBtn.className='btn btn-primary';
  saveBtn.style.flex='1';
  saveBtn.onclick=function(){confirmEditRow(rowId);};
  var cancelBtn=document.createElement('button');
  cancelBtn.textContent='Cancel';
  cancelBtn.className='btn btn-ghost';
  cancelBtn.onclick=function(){modal.remove();};
  foot.appendChild(saveBtn);
  foot.appendChild(cancelBtn);
  box.appendChild(foot);
  modal.appendChild(box);
  modal.addEventListener('click',function(e){if(e.target===modal)modal.remove();});
  document.body.appendChild(modal);
  setTimeout(function(){var fi=body.querySelector('.inp');if(fi)fi.focus();},100);
}

function confirmEditRow(rowId){
  var row=data.find(function(r){return r.id===rowId;});
  if(!row) return;
  vars.forEach(function(v){
    if(v.name==='id') return;
    var el=document.getElementById('edit-'+v.name);
    if(!el) return;
    var val=el.value.trim();
    if(val===''||val==='.'){row[v.name]=null;}
    else if(v.type==='Numeric'){var n=Number(val);row[v.name]=isNaN(n)?null:n;}
    else{row[v.name]=val;}
  });
  var modal=document.getElementById('edit-row-modal');
  if(modal) modal.remove();
  updateBadges();
  showToast('Row berhasil diupdate');
  switchTab('data');
}

function confirmAddRow(nid){
  var row={id:nid};
  vars.forEach(function(v){
    if(v.name==='id'){row[v.name]=nid;return;}
    var el=document.getElementById('new-'+v.name);
    if(!el){row[v.name]=null;return;}
    var val=el.value.trim();
    if(val===''||val==='.'){row[v.name]=null;}
    else if(v.type==='Numeric'){var n=Number(val);row[v.name]=isNaN(n)?null:n;}
    else{row[v.name]=val;}
  });
  data.push(row);
  var modal=document.getElementById('add-row-modal');
  if(modal)modal.remove();
  updateBadges();
  showToast('Row berhasil ditambahkan');
  switchTab('data');
}

function startEdit(rowId,field){
  const v=vars.find(x=>x.name===field),row=data.find(r=>r.id===rowId);if(!row||!v)return;
  const cur=row[field]===null||row[field]===undefined?'':String(row[field]);
  const val=prompt('Edit "'+field+'" (enter "." for missing):\nCurrent: '+(isMiss(row[field])?'[missing]':row[field]),cur);
  if(val===null)return;
  if(val.trim()===''||val==='.'){
    row[field]=null;
  } else if(v.type==='Numeric'){
    const n=Number(val);
    if(isNaN(n)){showToast('"'+val+'" not a number','error');return;}
    row[field]=n;
  } else {
    row[field]=val;
  }
  updateBadges();renderTab('data');
}

function handleCSV(e){
  const file=e.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=ev=>{
    try{
      const txt=ev.target.result,lines=txt.trim().split(/\r?\n/);
      const parseL=line=>{const res=[];let cur='',inQ=false;
        for(let i=0;i<line.length;i++){const ch=line[i];
          if(ch==='"'&&!inQ){inQ=true;continue;}if(ch==='"'&&inQ&&line[i+1]==='"'){cur+='"';i++;continue;}
          if(ch==='"'&&inQ){inQ=false;continue;}if(ch===','&&!inQ){res.push(cur.trim());cur='';continue;}cur+=ch;}
        res.push(cur.trim());return res;};
      const hdr=parseL(lines[0]);
      const rows=lines.slice(1).filter(l=>l.trim()).map((l,i)=>{
        const vs=parseL(l);const row={id:i+1};
        hdr.forEach((h,j)=>{const v=vs[j]?.trim()??'';
          if(v===''||v==='.'||v==='NA')row[h]=null;else{const n=Number(v);row[h]=isNaN(n)?v:n;}});
        return row;});
      const nv=hdr.map(h=>{
        const isStr=rows.some(r=>typeof r[h]==='string'&&r[h]!==null);
        return {name:h,type:isStr?'String':'Numeric',width:12,dec:isStr?0:2,label:h,measure:isStr?'Nominal':'Scale',role:'Input'};
      });
      // If active dataset is empty OR user wants a new dataset
      var dsIsEmpty=!data.length&&!vars.length;
      var toNew=!dsIsEmpty&&confirm('Import "'+file.name+'" as a NEW dataset?\n\nOK = New dataset\nCancel = Replace current dataset ("'+getActiveDs().name+'")');
      if(toNew){
        var fname=file.name.replace(/\.[^.]+$/,'').replace(/[^a-zA-Z0-9 _-]/g,' ').trim()||('Dataset '+(datasets.length+1));
        addDataset(fname);
      }
      data=rows;vars=nv;if(typeof selRows!=='undefined')selRows.clear();updateBadges();renderTab('data');
      showToast('CSV berhasil diimport');
    }catch(err){showToast('CSV error: '+err.message,'error');}
  };
  reader.readAsText(file);e.target.value='';
}

