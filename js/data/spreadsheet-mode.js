// ════════════════════════════════════════════════════════════════════════
// SPREADSHEET (BULK EDIT) MODE + sisa fungsi Data View (C7, split roadmap
// OSS 2.0). Dipindah sbg var/fungsi global apa adanya, pola sama C1-C6.
//
// CATATAN PENTING (ditemukan pas split C6, dikonfirmasi lagi di sini):
// blok baseline C7 (baris 4268-4898) TERNYATA bukan cuma Spreadsheet Mode
// murni — isinya CAMPURAN 2 hal:
//   1) Spreadsheet Mode murni: sprBuffer, enterSprMode/exitSprMode/
//      saveSprMode, sprCellChange/sprCellInput/sprKeyNav, colFillModal/
//      cfSetMode/applyColFill/applyColSeq (fitur "Fill Column"),
//      addMultipleRows (Add N Empty Rows)
//   2) Sisa fungsi Data View (konsep C6, bukan C7) yang tidak ikut
//      terangkat waktu C6 karena baseline line-range-nya sudah masuk C7:
//      searchData, toggleSort, toggleRow, toggleAllRows,
//      syncHeaderCheckbox, deleteSelected, toggleEditMode,
//      enterCombinedEditMode, addDataRowInline, _ossLoadMoreRows,
//      handleCSV, addDataRow/editRowModal/confirmAddRow/confirmEditRow,
//      startEdit, var editMode
//   3) escHtmlAttr — utility umum escape HTML attribute, dipakai lintas
//      fitur (Data View, Spreadsheet, dan tempat lain), bukan spesifik
//      Spreadsheet, tapi lokasinya di awal blok baseline ini
//   4) toggleCoefView — TIDAK ADA hubungannya dengan Data View maupun
//      Spreadsheet sama sekali (toggle tampilan OLS vs HC3 robust SE di
//      hasil regresi). Kemungkinan salah taruh di monolith sejak lama.
//      Dipindah apa adanya (byte-exact) tanpa direlokasi/direfactor —
//      keputusan mau dipindah ke file mana (mis. digabung ke
//      analyze-form-render.js nanti) ditunda, cukup dicatat di sini.
//
// Semua fungsi tetap global, tidak ada yang direfactor. Dependency
// (vars/data/aState/showToast/updateBadges/switchTab/renderTab/isMiss/
// getActiveDs/addDataset/datasets/selRows/sortCol/sortDir/searchQ/
// _ossDataShown/_ossDataPageSize — sebagian dari js/data/data-view.js
// C6, sebagian masih di app.js) semua diakses di dalam function body
// (runtime), bukan top-level saat parse — aman dimuat sbg file
// pre-app.js lewat scope-fallback ke global, sama pola B1-C6. Tidak ada
// top-level call di blok ini (beda dari kasus C5/custom-select.js).
// ════════════════════════════════════════════════════════════════════════
// ── SPREADSHEET (BULK EDIT) MODE ──────────────────────────────────────
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
    modal.style.cssText='position:fixed;inset:0;z-index:9900;background:rgba(8,3,16,.82);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:24px';
    var box=document.createElement('div');
    box.style.cssText='background:rgba(20,8,40,.98);border:1px solid rgba(250,204,21,.3);border-top:2px solid #fbbf24;border-radius:14px;padding:22px;width:100%;max-width:340px;box-shadow:0 8px 32px rgba(0,0,0,.6)';
    box.innerHTML='<div style="font-size:14px;font-weight:700;color:#fbbf24;margin-bottom:8px;font-family:Playfair Display,serif;font-style:italic">Buang perubahan?</div><div style="font-size:12.5px;color:rgba(232,222,255,.6);margin-bottom:18px;line-height:1.6">Ada '+Object.keys(sprBuffer).length+' baris yang belum disimpan. Yakin ingin keluar tanpa menyimpan?</div><div style="display:flex;gap:8px"></div>';
    var btns=box.querySelector('div:last-child');
    var cb=document.createElement('button');cb.textContent='Batal';cb.style.cssText='flex:1;padding:10px;border-radius:8px;border:1px solid rgba(124,58,237,.25);background:transparent;color:rgba(232,222,255,.55);font-size:13px;cursor:pointer;font-family:Inter,sans-serif';cb.onclick=function(){modal.remove();};
    var xb=document.createElement('button');xb.textContent='Buang & Keluar';xb.style.cssText='flex:1;padding:10px;border-radius:8px;border:none;background:linear-gradient(135deg,#d97706,#b45309);color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:Inter,sans-serif';xb.onclick=function(){modal.remove();_doExit();};
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
    inp.classList.add('missing-cell');
    inp.placeholder='. (missing)';
  } else {
    inp.classList.remove('missing-cell');
    if(vtype==='Numeric'){
      var n=Number(val);
      sprBuffer[rowId][field]=isNaN(n)?null:n;
      if(isNaN(n)) inp.style.borderColor='#f87171';
      else inp.style.borderColor='';
    } else {
      sprBuffer[rowId][field]=val;
    }
  }
}

function sprCellInput(inp){
  if(inp.value==='.'||inp.value===''){
    inp.classList.add('missing-cell');
  } else {
    inp.classList.remove('missing-cell');
    inp.style.borderColor='';
  }
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
  var modal=document.createElement('div');
  modal.style.cssText='position:fixed;inset:0;z-index:9600;background:rgba(8,3,16,.9);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px';
  var box=document.createElement('div');
  box.style.cssText='background:#130922;border:1px solid rgba(124,58,237,.35);border-radius:16px;width:100%;max-width:480px;overflow:hidden;animation:popIn .2s cubic-bezier(.16,1,.3,1)';
  
  // Get unique values already in this column for suggestions
  var existing=[...new Set(data.map(function(r){return r[fieldName];}).filter(function(x){return x!==null&&x!==undefined;}))].slice(0,8);
  
  var hdrHtml='<div style="padding:14px 16px 10px;border-bottom:1px solid rgba(124,58,237,.12);display:flex;align-items:center;justify-content:space-between">';
  hdrHtml+='<div><div style="font-family:Playfair Display,serif;font-style:italic;font-size:15px;font-weight:700;color:#c084fc">Fill Column: '+escHtml(v.label)+'</div>';
  hdrHtml+='<div style="font-size:10.5px;color:rgba(232,222,255,.35);margin-top:2px">Apply a value to selected or all rows</div></div>';
  hdrHtml+='<button id="colfill-close" style="background:rgba(124,58,237,.12);border:none;color:rgba(232,222,255,.5);width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:14px">✕</button>';
  hdrHtml+='</div>';

  var bodyHtml='<div style="padding:16px;display:flex;flex-direction:column;gap:12px">';
  // Mode selector
  bodyHtml+='<div style="display:flex;gap:6px">';
  bodyHtml+='<button id="cfmode-all" onclick="cfSetMode(\'all\')" style="flex:1;padding:8px;border-radius:8px;border:2px solid #7c3aed;background:rgba(124,58,237,.2);color:#c084fc;font-size:11.5px;font-weight:700;cursor:pointer;font-family:Inter,sans-serif">All rows</button>';
  bodyHtml+='<button id="cfmode-empty" onclick="cfSetMode(\'empty\')" style="flex:1;padding:8px;border-radius:8px;border:1px solid rgba(124,58,237,.25);background:transparent;color:rgba(232,222,255,.5);font-size:11.5px;cursor:pointer;font-family:Inter,sans-serif">Missing only</button>';
  bodyHtml+='<button id="cfmode-range" onclick="cfSetMode(\'range\')" style="flex:1;padding:8px;border-radius:8px;border:1px solid rgba(124,58,237,.25);background:transparent;color:rgba(232,222,255,.5);font-size:11.5px;cursor:pointer;font-family:Inter,sans-serif">Row range</button>';
  bodyHtml+='</div>';
  
  // Range inputs (hidden by default)
  bodyHtml+='<div id="cf-range-row" style="display:none;gap:8px">';
  bodyHtml+='<div style="flex:1"><label style="font-size:10px;color:rgba(232,222,255,.4);display:block;margin-bottom:3px">From row #</label><input id="cf-from" class="inp" type="number" min="1" value="1" style="width:100%"/></div>';
  bodyHtml+='<div style="flex:1"><label style="font-size:10px;color:rgba(232,222,255,.4);display:block;margin-bottom:3px">To row #</label><input id="cf-to" class="inp" type="number" min="1" value="'+data.length+'" style="width:100%"/></div>';
  bodyHtml+='</div>';
  
  // Value input
  bodyHtml+='<div><label style="font-size:10.5px;color:rgba(232,222,255,.4);display:block;margin-bottom:4px;font-weight:500">Value to fill <span style="color:rgba(232,222,255,.25)">(type "." for missing)</span></label>';
  bodyHtml+='<input id="cf-val" class="inp" type="text" placeholder="'+(v.type==='Numeric'?'e.g. 0 or 42':'e.g. Tani or Buruh')+'" autocomplete="off" style="font-size:13px"/></div>';
  
  // Suggestions from existing values
  if(existing.length){
    bodyHtml+='<div><div style="font-size:10px;color:rgba(232,222,255,.3);margin-bottom:5px">Quick pick from existing values:</div>';
    bodyHtml+='<div style="display:flex;flex-wrap:wrap;gap:5px">';
    existing.forEach(function(ev){
      bodyHtml+='<button onclick="document.getElementById(\'cf-val\').value=\''+escHtmlAttr(String(ev))+'\'" style="padding:4px 10px;border-radius:999px;border:1px solid rgba(124,58,237,.25);background:rgba(124,58,237,.08);color:rgba(232,222,255,.7);font-size:11px;cursor:pointer;font-family:Inter,sans-serif">'+ev+'</button>';
    });
    bodyHtml+='</div></div>';
  }
  
  // Sequential fill for numeric
  if(v.type==='Numeric'){
    bodyHtml+='<details style="margin-top:2px"><summary style="cursor:pointer;font-size:11px;color:#a78bfa;font-weight:600;list-style:none">▸ Or fill with sequential numbers</summary>';
    bodyHtml+='<div style="margin-top:8px;display:flex;gap:8px">';
    bodyHtml+='<div style="flex:1"><label style="font-size:10px;color:rgba(232,222,255,.4);display:block;margin-bottom:3px">Start value</label><input id="cf-seq-start" class="inp" type="number" value="1" style="width:100%"/></div>';
    bodyHtml+='<div style="flex:1"><label style="font-size:10px;color:rgba(232,222,255,.4);display:block;margin-bottom:3px">Step</label><input id="cf-seq-step" class="inp" type="number" value="1" style="width:100%"/></div>';
    bodyHtml+='<div style="align-self:flex-end"><button onclick="applyColSeq(\''+fieldName+'\',\''+v.type+'\')" style="padding:8px 14px;border-radius:7px;border:none;background:linear-gradient(135deg,#059669,#0891b2);color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:Inter,sans-serif;white-space:nowrap">Fill Seq</button></div>';
    bodyHtml+='</div></details>';
  }
  
  bodyHtml+='</div>';
  
  var footHtml='<div style="padding:12px 16px;border-top:1px solid rgba(124,58,237,.1);display:flex;gap:8px">';
  footHtml+='<button onclick="applyColFill(\''+fieldName+'\',\''+v.type+'\')" style="flex:1;padding:11px;border-radius:8px;border:none;cursor:pointer;background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff;font-size:13px;font-weight:700;font-family:Inter,sans-serif">⬇ Apply Fill</button>';
  footHtml+='<button id="colfill-cancel" style="padding:11px 18px;border-radius:8px;border:1px solid rgba(124,58,237,.25);background:transparent;color:rgba(232,222,255,.5);font-size:13px;cursor:pointer;font-family:Inter,sans-serif">Cancel</button>';
  footHtml+='</div>';

  box.innerHTML=hdrHtml+bodyHtml+footHtml;
  modal.appendChild(box);
  document.body.appendChild(modal);
  modal.addEventListener('click',function(e){if(e.target===modal)modal.remove();});
  box.querySelector('#colfill-close').onclick=function(){modal.remove();};
  box.querySelector('#colfill-cancel').onclick=function(){modal.remove();};
  setTimeout(function(){var fi=box.querySelector('#cf-val');if(fi)fi.focus();},80);
  // Store modal ref for applyColFill
  box.querySelector('#cf-val')._modal=modal;
  box._modal=modal;
}

var _cfMode='all';
function cfSetMode(m){
  _cfMode=m;
  ['all','empty','range'].forEach(function(mode){
    var btn=document.getElementById('cfmode-'+mode);
    if(btn){
      if(mode===m){btn.style.border='2px solid #7c3aed';btn.style.background='rgba(124,58,237,.2)';btn.style.color='#c084fc';}
      else{btn.style.border='1px solid rgba(124,58,237,.25)';btn.style.background='transparent';btn.style.color='rgba(232,222,255,.5)';}
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
  var modal=inp.closest('[style*="position:fixed"]');
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
  var modal=document.querySelector('[style*="position:fixed"][style*="9600"]');
  if(modal) modal.remove();
  updateBadges();renderTab('data');
  showToast('Fill berhasil');
}

// Add Multiple Empty Rows at once
function addMultipleRows(){
  var modal=document.createElement('div');
  modal.style.cssText='position:fixed;inset:0;z-index:9600;background:rgba(8,3,16,.9);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px';
  var box=document.createElement('div');
  box.style.cssText='background:#130922;border:1px solid rgba(124,58,237,.28);border-radius:14px;width:100%;max-width:340px;padding:22px;display:flex;flex-direction:column;gap:14px';
  box.innerHTML='<div style="font-family:Playfair Display,serif;font-style:italic;font-size:15px;font-weight:700;color:#c084fc">Add Empty Rows</div>'
    +'<div><label style="font-size:10.5px;color:rgba(232,222,255,.4);display:block;margin-bottom:5px">Number of rows to add</label>'
    +'<input id="addrows-n" class="inp" type="number" min="1" max="200" value="5" style="width:100%;font-size:14px;font-weight:700"/></div>'
    +'<div style="display:flex;gap:8px">'
    +'<button id="addrows-ok" style="flex:1;padding:11px;border-radius:8px;border:none;cursor:pointer;background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff;font-size:13px;font-weight:700;font-family:Inter,sans-serif">Add Rows</button>'
    +'<button id="addrows-cancel" style="padding:11px 16px;border-radius:8px;border:1px solid rgba(124,58,237,.25);background:transparent;color:rgba(232,222,255,.5);font-size:13px;cursor:pointer;font-family:Inter,sans-serif">Cancel</button>'
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
function toggleRow(id,cb){
  if(cb.checked)selRows.add(id);else selRows.delete(id);
  // Re-render toolbar if needed to show/hide del button
  var toolbar=document.querySelector('.dt-actions');
  if(toolbar){
    var existing=document.getElementById('del-btn');
    if(selRows.size>0){
      if(!existing){
        // Create & inject del btn before done btn
        var doneBtn=toolbar.querySelector('.dt-btn-done');
        var newDel=document.createElement('button');
        newDel.id='del-btn';newDel.className='dt-btn dt-btn-del';
        newDel.onclick=function(){deleteSelected();};
        newDel.innerHTML=IC.trash+' Del '+selRows.size;
        if(doneBtn) toolbar.insertBefore(newDel,doneBtn);
        else toolbar.appendChild(newDel);
      } else {
        existing.innerHTML=IC.trash+' Del '+selRows.size;
      }
    } else {
      if(existing) existing.remove();
    }
  }
  // Sync header checkbox
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
  // Sync del button
  var btn=document.getElementById('del-btn');
  if(btn){btn.disabled=!selRows.size;btn.innerHTML=IC.trash+' Del '+selRows.size;}
}
function deleteSelected(){if(!selRows.size)return;data=data.filter(r=>!selRows.has(r.id));selRows.clear();updateBadges();renderTab('data');showToast('Data berhasil dihapus');}
function addDataRow(){
  var nid=Math.max.apply(null,data.map(function(r){return r.id;}).concat([0]))+1;
  var modal=document.createElement('div');
  modal.id='add-row-modal';
  modal.style.cssText='position:fixed;inset:0;z-index:9500;background:rgba(5,1,14,.6);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px';
  
  var box=document.createElement('div');
  box.style.cssText='background:linear-gradient(135deg,rgba(124,58,237,.18) 0%,rgba(14,6,24,.82) 40%,rgba(219,39,119,.10) 100%);backdrop-filter:blur(28px) saturate(160%);-webkit-backdrop-filter:blur(28px) saturate(160%);border:1px solid rgba(192,132,252,.22);border-top:1px solid rgba(192,132,252,.38);border-radius:18px;width:100%;max-width:560px;max-height:88vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.55),0 0 0 1px rgba(124,58,237,.08) inset;animation:cselPop .22s cubic-bezier(.16,1,.3,1)';
  
  // Header
  var hdr=document.createElement('div');
  hdr.style.cssText='display:flex;align-items:center;justify-content:space-between;padding:14px 16px 10px;border-bottom:1px solid rgba(124,58,237,.12);flex-shrink:0';
  hdr.innerHTML='<span style="font-family:Playfair Display,serif;font-style:italic;font-size:15px;font-weight:700;color:#c084fc">Add New Row</span>';
  var closeBtn=document.createElement('button');
  closeBtn.innerHTML='✕';
  closeBtn.style.cssText='background:rgba(124,58,237,.12);border:none;color:rgba(232,222,255,.5);width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center';
  closeBtn.onclick=function(){modal.remove();};
  hdr.appendChild(closeBtn);
  box.appendChild(hdr);
  
  // Fields
  var body=document.createElement('div');
  body.style.cssText='overflow-y:auto;flex:1;padding:14px 16px';
  var grid=document.createElement('div');
  grid.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:10px';
  
  vars.forEach(function(v){
    if(v.name==='id') return;
    var wrap=document.createElement('div');
    var lbl=document.createElement('label');
    lbl.style.cssText='font-size:10.5px;color:rgba(232,222,255,.4);display:block;margin-bottom:4px;font-weight:500';
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
  
  // Footer
  var foot=document.createElement('div');
  foot.style.cssText='padding:12px 16px;border-top:1px solid rgba(124,58,237,.1);display:flex;gap:8px;flex-shrink:0';
  var addBtn=document.createElement('button');
  addBtn.textContent='Add Row';
  addBtn.style.cssText='flex:1;padding:11px;border-radius:8px;border:none;cursor:pointer;background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff;font-size:13px;font-weight:700;font-family:Inter,sans-serif';
  addBtn.onclick=function(){confirmAddRow(nid);};
  var cancelBtn=document.createElement('button');
  cancelBtn.textContent='Cancel';
  cancelBtn.style.cssText='padding:11px 18px;border-radius:8px;border:1px solid rgba(124,58,237,.25);background:transparent;color:rgba(232,222,255,.5);font-size:13px;cursor:pointer;font-family:Inter,sans-serif';
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
  modal.style.cssText='position:fixed;inset:0;z-index:9500;background:rgba(5,1,14,.6);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px';

  var box=document.createElement('div');
  box.style.cssText='background:linear-gradient(135deg,rgba(124,58,237,.18) 0%,rgba(14,6,24,.82) 40%,rgba(219,39,119,.10) 100%);backdrop-filter:blur(28px) saturate(160%);-webkit-backdrop-filter:blur(28px) saturate(160%);border:1px solid rgba(192,132,252,.22);border-top:1px solid rgba(192,132,252,.38);border-radius:18px;width:100%;max-width:560px;max-height:88vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.55),0 0 0 1px rgba(124,58,237,.08) inset;animation:cselPop .22s cubic-bezier(.16,1,.3,1)';

  var hdr=document.createElement('div');
  hdr.style.cssText='display:flex;align-items:center;justify-content:space-between;padding:14px 16px 10px;border-bottom:1px solid rgba(124,58,237,.12);flex-shrink:0';
  hdr.innerHTML='<span style="font-family:Playfair Display,serif;font-style:italic;font-size:15px;font-weight:700;color:#c084fc">Edit Row #'+rowId+'</span>';
  var closeBtn=document.createElement('button');
  closeBtn.innerHTML='✕';
  closeBtn.style.cssText='background:rgba(124,58,237,.12);border:none;color:rgba(232,222,255,.5);width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center';
  closeBtn.onclick=function(){modal.remove();};
  hdr.appendChild(closeBtn);
  box.appendChild(hdr);

  var body=document.createElement('div');
  body.style.cssText='overflow-y:auto;flex:1;padding:14px 16px';
  var grid=document.createElement('div');
  grid.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:10px';

  vars.forEach(function(v){
    if(v.name==='id') return;
    var wrap=document.createElement('div');
    var lbl=document.createElement('label');
    lbl.style.cssText='font-size:10.5px;color:rgba(232,222,255,.4);display:block;margin-bottom:4px;font-weight:500';
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
  foot.style.cssText='padding:12px 16px;border-top:1px solid rgba(124,58,237,.1);display:flex;gap:8px;flex-shrink:0';
  var saveBtn=document.createElement('button');
  saveBtn.textContent='Save Changes';
  saveBtn.style.cssText='flex:1;padding:11px;border-radius:8px;border:none;cursor:pointer;background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff;font-size:13px;font-weight:700;font-family:Inter,sans-serif';
  saveBtn.onclick=function(){confirmEditRow(rowId);};
  var cancelBtn=document.createElement('button');
  cancelBtn.textContent='Cancel';
  cancelBtn.style.cssText='padding:11px 18px;border-radius:8px;border:1px solid rgba(124,58,237,.25);background:transparent;color:rgba(232,222,255,.5);font-size:13px;cursor:pointer;font-family:Inter,sans-serif';
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
      const nv=hdr.map(h=>({name:h,type:rows.some(r=>typeof r[h]==='string'&&r[h]!==null)?'String':'Numeric',width:12,dec:2,label:h,measure:'Scale',role:'Input'}));
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
