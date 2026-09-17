// ════════════════════════════════════════════════════════════════════════
// VARIABLE VIEW — edit mode, inline add/change, picker TYPE/MEASURE/ROLE
// (C8, split roadmap OSS 2.0). Dipindah sbg var/fungsi global apa
// adanya, pola sama C1-C7: var `_varTableEditMode`/`_varChecked` +
// `renderVars`, `addVarInline`, `_varInlineChange`, `_varCheckAll`,
// `_varUpdateHeaderChk`, `_varToggleCheck`, `_varSyncDeleteBtn`,
// `_varPickerOpen`, `_varDeleteSelected`, `_varSaveEditMode`,
// `editVarField`, `cycleVarType`, `cycleMeasure`, `cycleRole`,
// `moveVar`, `deleteVar`, `clearAllData`, `addVarModal`, `confirmAddVar`.
//
// CATATAN — beda dari C6/C7: kali ini header komentar "VARIABLE VIEW" di
// baseline TERNYATA membungkus lebih dari sekadar isi C8 (blok fisiknya
// terus sampai baris ~1297 di app.js snapshot sesi ini, hampir 800
// baris) — tapi begitu `confirmAddVar` selesai (baris 1053), fungsi
// berikutnya adalah `renderAnalyze(el)` yang JELAS bukan Variable View
// (itu wrapper render tab Analyze: sidebar grup + sub-tab, dipanggil
// sebelum `renderASub()`/D1 switch raksasa). `renderAnalyze` TIDAK ADA
// di tabel roadmap manapun (bukan C8, bukan C9/sliding-pill, bukan D1)
// — kemungkinan celah dokumentasi lama. **TIDAK ikut dipindah di sesi
// ini** — dibiarkan di app.js, direkomendasikan didiskusikan mau
// digabung ke `js/analyze/analyze-form-render.js` (rumah D1) atau jadi
// file terpisah `js/analyze/analyze-tab-shell.js`, sebelum D1 dikerjakan.
//
// Semua fungsi di file ini tetap global, dependency (`missCount`,
// `escHtml`, `IC`, `vars`, `data`, `updateBadges`, `switchTab`,
// `showToast`, `aState`, dll — sebagian dari file lain, sebagian masih
// di app.js) dibaca di dalam function body (runtime), bukan top-level —
// aman dimuat sbg file pre-app.js lewat scope-fallback ke global, tidak
// ada top-level call di blok ini.
// ════════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════════
// VARIABLE VIEW
// ════════════════════════════════════════════════════════════════════════
var _varTableEditMode = false;
var _varChecked = new Set();

function renderVars(el){
  const MC={Scale:'#60a5fa',Nominal:'#f472b6',Ordinal:'#a78bfa'};
  const RC={Target:'#fbbf24',Input:'#34d399',Both:'#fb923c',None:'#94a3b8'};
  const mc=missCount();
  var em=_varTableEditMode;
  let html='';

  // ── Missing value summary ──────────────────────────────────
  html+='<div class="card" style="margin-bottom:12px">';
  html+='<div class="sec-hd">Missing Value Summary</div>';
  html+='<div style="display:flex;gap:7px;flex-wrap:wrap">';
  vars.forEach(function(v){
    const m=mc.find(function(x){return x.name===v.name;})||{count:0};
    const pct=data.length>0?((m.count/data.length)*100).toFixed(1):'0.0';
    const hasM=m.count>0;
    html+='<div style="background:rgba(124,58,237,.06);border:1px solid rgba(124,58,237,.12);border-radius:8px;padding:9px 12px;min-width:90px">';
    html+='<div style="font-size:9.5px;color:rgba(232,222,255,.4);text-transform:uppercase;font-weight:700;margin-bottom:3px">'+escHtml(v.name)+'</div>';
    html+='<div style="font-size:13px;font-weight:800;color:'+(hasM?'#f87171':'#34d399')+'">'+(hasM?m.count+' miss':'0 miss')+'</div>';
    html+='<div style="font-size:9.5px;color:rgba(232,222,255,.3)">'+pct+'% of '+data.length+'</div>';
    html+='</div>';
  });
  html+='</div></div>';

  // ── Variable Definitions ────────────────────────────────────
  html+='<div class="card">';
  html+='<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:12px">';
  html+='<div class="sec-hd" style="margin-bottom:0">Variable Definitions</div>';
  html+='<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">';

  // Add Variable button — now adds a raw blank row directly
  html+='<button class="btn btn-primary btn-sm" onclick="addVarInline()">+ Add Variable</button>';

  // Edit Table toggle
  if(!em){
    html+='<button class="btn btn-ghost btn-sm" onclick="_varTableEditMode=true;_varChecked=new Set();switchTab(\'variable\')" style="border-color:rgba(192,132,252,.35);color:#c084fc">✎ Edit Table</button>';
  } else {
    // In edit mode: show Done (delete only when checkboxes are checked)
    if(_varChecked.size>0){
      html+='<button class="btn btn-sm" onclick="_varDeleteSelected()" style="background:rgba(220,38,38,.15);border:1px solid rgba(220,38,38,.35);color:#f87171">🗑 Delete Selected ('+_varChecked.size+')</button>';
    }
    html+='<button id="var-done-btn" class="btn btn-sm" onclick="_varSaveEditMode()" style="background:linear-gradient(135deg,#7c3aed,#059669);border:none;color:#fff;font-weight:700"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-1px"><polyline points="20 6 9 17 4 12"/></svg> Done</button>';
  }
  html+='<button class="btn btn-ghost btn-sm" onclick="clearAllData()">Clear All Data</button>';
  html+='</div></div>';

  // Variable table
  html+='<div class="tbl-wrap"><table id="var-def-table"><thead><tr>';
  if(em) html+='<th style="width:32px"><input type="checkbox" id="var-chk-all" onchange="_varCheckAll(this.checked)" style="accent-color:#c084fc;width:14px;height:14px;cursor:pointer"/></th>';
  ['#','Name','Type','Measure','Role','Decimals','Valid','Miss'].forEach(function(h){
    html+='<th>'+h+'</th>';
  });
  if(!em) html+='<th>Actions</th>';
  html+='</tr></thead><tbody id="var-tbody">';

  vars.forEach(function(v,i){
    const m=mc.find(function(x){return x.name===v.name;})||{count:0};
    const nV=data.length-m.count;
    var chk=_varChecked.has(i);
    html+='<tr id="var-row-'+i+'"'+(chk?' style="background:rgba(220,38,38,.07)"':'')+'>';

    // Checkbox col (edit mode only)
    if(em){
      html+='<td style="text-align:center"><input type="checkbox" class="var-chk" data-i="'+i+'" '+(chk?'checked':'')+' onchange="_varToggleCheck('+i+',this.checked)" style="accent-color:#7c3aed;width:14px;height:14px;cursor:pointer"/></td>';
    }

    // Row number
    html+='<td style="color:rgba(232,222,255,.3);font-size:10.5px">'+(i+1)+'</td>';

    // Name
    if(em){
      html+='<td><input class="var-inline-inp" data-i="'+i+'" data-fld="name" value="'+escHtmlAttr(v.name)+'" onblur="_varInlineChange(this)" onkeydown="if(event.key===\'Enter\')this.blur()" style="width:100px;font-weight:700;color:#c084fc"/></td>';
    } else {
      html+='<td><span style="font-weight:700;color:#c084fc">'+escHtml(v.name)+'</span></td>';
    }

    // Type — clickable badge opens in-web picker popup (no native dropdown)
    if(em){
      var tCol=v.type==='Numeric'?'#60a5fa':'#f472b6';
      html+='<td><span class="var-pick-badge" data-i="'+i+'" data-fld="type" onclick="_varPickerOpen(this,'+i+',\'type\')" style="background:'+tCol+'18;color:'+tCol+';border:1px solid '+tCol+'35;border-radius:6px;padding:3px 10px;font-size:11.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;white-space:nowrap">'+v.type+' <svg width="9" height="9" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span></td>';
    } else {
      html+='<td><span class="tag '+(v.type==='Numeric'?'tag-blue':'tag-pink')+'">'+v.type+'</span></td>';
    }

    // Measure — clickable badge
    if(em){
      var mCol=MC[v.measure]||'#60a5fa';
      html+='<td><span class="var-pick-badge" data-i="'+i+'" data-fld="measure" onclick="_varPickerOpen(this,'+i+',\'measure\')" style="background:'+mCol+'18;color:'+mCol+';border:1px solid '+mCol+'35;border-radius:6px;padding:3px 10px;font-size:11.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;min-width:68px;justify-content:space-between">'+v.measure+' <svg width="9" height="9" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span></td>';
    } else {
      var mc2=MC[v.measure]||'#60a5fa';
      html+='<td><span class="tag" style="background:'+mc2+'22;color:'+mc2+';border:1px solid '+mc2+'35;min-width:62px;justify-content:center">'+v.measure+'</span></td>';
    }

    // Role — clickable badge
    if(em){
      var rCol=RC[v.role]||'#34d399';
      html+='<td><span class="var-pick-badge" data-i="'+i+'" data-fld="role" onclick="_varPickerOpen(this,'+i+',\'role\')" style="background:'+rCol+'18;color:'+rCol+';border:1px solid '+rCol+'35;border-radius:6px;padding:3px 10px;font-size:11.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;white-space:nowrap">'+v.role+' <svg width="9" height="9" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span></td>';
    } else {
      var rc2=RC[v.role]||'#34d399';
      html+='<td><span class="tag" style="background:'+rc2+'22;color:'+rc2+';border:1px solid '+rc2+'35">'+v.role+'</span></td>';
    }

    // Decimals
    if(em && v.type==='Numeric'){
      html+='<td><input class="var-inline-inp" data-i="'+i+'" data-fld="dec" type="number" min="0" max="10" value="'+v.dec+'" onblur="_varInlineChange(this)" style="width:52px;color:rgba(232,222,255,.7)"/></td>';
    } else {
      html+='<td style="color:rgba(232,222,255,.6)">'+(v.type==='Numeric'?v.dec:'—')+'</td>';
    }

    // Valid / Miss
    html+='<td style="color:#34d399;text-align:center">'+nV+'</td>';
    html+='<td style="text-align:center">'+(m.count>0?'<span style="color:#f87171;font-weight:700">'+m.count+'</span>':'<span style="color:#34d399">0</span>')+'</td>';

    // Actions column (non-edit mode only)
    if(!em){
      html+='<td>';
      html+='<div style="display:flex;gap:4px;align-items:center">';
      if(i>0) html+='<button onclick="moveVar('+i+',-1)" style="background:rgba(124,58,237,.1);border:1px solid rgba(124,58,237,.2);border-radius:5px;color:#c084fc;cursor:pointer;padding:3px 6px;font-size:11px" title="Move up">↑</button>';
      if(i<vars.length-1) html+='<button onclick="moveVar('+i+',1)" style="background:rgba(124,58,237,.1);border:1px solid rgba(124,58,237,.2);border-radius:5px;color:#c084fc;cursor:pointer;padding:3px 6px;font-size:11px" title="Move down">↓</button>';
      html+='<button onclick="deleteVar('+i+')" style="background:rgba(220,38,38,.1);border:1px solid rgba(220,38,38,.2);border-radius:5px;color:#f87171;cursor:pointer;padding:3px 6px;font-size:11px" title="Delete">✕</button>';
      html+='</div></td>';
    }

    html+='</tr>';
  });

  // If in edit mode, show a "new blank row" hint at the bottom
  if(em){
    html+='<tr style="opacity:.45"><td></td><td colspan="8" style="font-size:11px;color:rgba(232,222,255,.35);font-style:italic;padding:8px 6px">Use "+ Add Variable" to add more rows</td></tr>';
  }

  html+='</tbody></table></div>';

  // Suggestions
  const typeWarnings=vars.map(function(v){
    if(v.name==='id'&&v.measure!=='Scale') return 'ID variable should be Scale';
    return null;
  }).filter(Boolean);
  if(typeWarnings.length){
    html+='<div style="margin-top:10px;padding:8px 12px;background:rgba(217,119,6,.07);border:1px solid rgba(217,119,6,.18);border-radius:8px">';
    html+='<div style="font-size:10px;font-weight:700;color:#fbbf24;margin-bottom:4px;text-transform:uppercase">Suggestions</div>';
    typeWarnings.forEach(function(w){html+='<div style="font-size:11.5px;color:rgba(232,222,255,.6)">'+w+'</div>';});
    html+='</div>';
  }
  html+='</div>';

  // Inject CSS for inline inputs/selects once
  if(!document.getElementById('var-inline-style')){
    var s=document.createElement('style');s.id='var-inline-style';
    s.textContent='.var-inline-inp{background:rgba(124,58,237,.10);border:1px solid rgba(192,132,252,.25);border-radius:5px;padding:3px 7px;font-size:12px;font-family:Inter,sans-serif;outline:none;transition:border-color .15s}.var-inline-inp:focus{border-color:#c084fc;background:rgba(124,58,237,.18)}.var-inline-sel{background:rgba(14,6,24,.85);border:1px solid rgba(192,132,252,.28);border-radius:5px;padding:3px 6px;font-size:12px;font-family:Inter,sans-serif;outline:none;cursor:pointer;-webkit-appearance:none;appearance:none;transition:border-color .15s;min-width:80px}.var-inline-sel:focus{border-color:#c084fc}.var-inline-sel option{background:#1a0835;color:#e8deff}';
    document.head.appendChild(s);
  }

  el.innerHTML=html;
}

// ── Inline add var (raw blank row) ──────────────────────────
function addVarInline(){
  // Generate unique name
  var base='var',n=1;
  while(vars.some(function(v){return v.name===base+n;})) n++;
  var name=base+n;
  vars.push({name:name,type:'Numeric',width:8,dec:2,label:name,measure:'Scale',role:'Input'});
  data.forEach(function(r){r[name]=null;});
  updateBadges();
  // Just refresh — don't enter edit mode automatically
  switchTab('variable');
  showToast('Variable berhasil ditambahkan');
}

// ── Inline change handler ─────────────────────────────────────
function _varInlineChange(el){
  var i=parseInt(el.dataset.i);
  var fld=el.dataset.fld;
  var val=el.value.trim();
  var v=vars[i];
  if(fld==='name'){
    var newName=val.replace(/[^a-zA-Z0-9_]/g,'_').toLowerCase();
    if(!newName){el.value=v.name;showToast('Name cannot be empty','error');return;}
    if(vars.some(function(vv,ii){return ii!==i&&vv.name===newName;})){el.value=v.name;showToast('Name already exists','error');return;}
    data.forEach(function(r){r[newName]=r[v.name];delete r[v.name];});
    v.name=newName;el.value=newName;
  } else if(fld==='dec'){
    var d=parseInt(val);if(!isNaN(d)&&d>=0&&d<=10) v.dec=d;
  } else if(fld==='type'){
    v.type=val;
    if(val==='String'){v.measure='Nominal';v.dec=0;}
    else v.measure='Scale';
    // Update measure select jika ada (native select, bukan badge)
    var mc2={Scale:'#60a5fa',Nominal:'#f472b6',Ordinal:'#a78bfa'};
    var mSel=document.querySelector('.var-inline-sel[data-i="'+i+'"][data-fld="measure"]');
    if(mSel){mSel.value=v.measure;mSel.style.color=mc2[v.measure]||'#60a5fa';}
    var decInp=document.querySelector('.var-inline-inp[data-i="'+i+'"][data-fld="dec"]');
    if(decInp) decInp.style.display=val==='Numeric'?'':'none';
    // Hanya update style jika el adalah elemen DOM nyata (bukan fakeEl dari picker)
    if(el.style) el.style.color=val==='Numeric'?'#60a5fa':'#f472b6';
  } else if(fld==='measure'){
    v.measure=val;
    var mc3={Scale:'#60a5fa',Nominal:'#f472b6',Ordinal:'#a78bfa'};
    if(el.style) el.style.color=mc3[val]||'#60a5fa';
  } else if(fld==='role'){
    v.role=val;
    var rc3={Target:'#fbbf24',Input:'#34d399',Both:'#fb923c',None:'#94a3b8'};
    if(el.style) el.style.color=rc3[val]||'#34d399';
  } else if(fld==='label'){
    v.label=val;
  }
  updateBadges();
}

// ── Checkbox helpers ──────────────────────────────────────────
function _varCheckAll(checked){
  _varChecked=new Set();
  if(checked) vars.forEach(function(_,i){_varChecked.add(i);});
  document.querySelectorAll('.var-chk').forEach(function(cb){cb.checked=checked;});
  document.querySelectorAll('#var-tbody tr').forEach(function(tr){
    tr.style.background=checked?'rgba(124,58,237,.07)':'';
  });
  _varUpdateHeaderChk();
  _varSyncDeleteBtn();
}

function _varUpdateHeaderChk(){
  var hdr=document.getElementById('var-chk-all');
  if(!hdr) return;
  var total=vars.length;
  var sel=_varChecked.size;
  if(sel===0){hdr.checked=false;hdr.indeterminate=false;}
  else if(sel===total){hdr.checked=true;hdr.indeterminate=false;}
  else{hdr.checked=false;hdr.indeterminate=true;}
}

function _varToggleCheck(i,checked){
  if(checked) _varChecked.add(i);
  else _varChecked.delete(i);
  var row=document.getElementById('var-row-'+i);
  if(row) row.style.background=checked?'rgba(124,58,237,.07)':'';
  _varUpdateHeaderChk();
  _varSyncDeleteBtn();
}

function _varSyncDeleteBtn(){
  var doneBtn=document.getElementById('var-done-btn');
  if(!doneBtn) return;
  var parent=doneBtn.parentNode;
  // Remove ALL existing delete buttons to avoid duplicates
  parent.querySelectorAll('.var-del-btn').forEach(function(b){b.remove();});
  if(_varChecked.size>0){
    var nb=document.createElement('button');
    nb.className='btn btn-sm var-del-btn';
    nb.style.cssText='background:rgba(220,38,38,.15);border:1px solid rgba(220,38,38,.35);color:#f87171';
    nb.textContent='🗑 Delete Selected ('+_varChecked.size+')';
    nb.onclick=function(){_varDeleteSelected();};
    parent.insertBefore(nb,doneBtn);
  }
}

// ── Delete selected variables ─────────────────────────────────
// ── In-web picker popup for TYPE / MEASURE / ROLE ──────────────────
function _varPickerOpen(triggerEl, idx, field){
  // Remove any existing picker
  var existing=document.getElementById('_var-picker-pop');
  if(existing){existing.remove();if(existing.dataset.field===field&&parseInt(existing.dataset.idx)===idx)return;}

  var options=[];
  var MC={Scale:'#60a5fa',Nominal:'#f472b6',Ordinal:'#a78bfa'};
  var RC={Target:'#fbbf24',Input:'#34d399',Both:'#fb923c',None:'#94a3b8'};

  if(field==='type') options=[{v:'Numeric',c:'#60a5fa'},{v:'String',c:'#f472b6'}];
  else if(field==='measure') options=[{v:'Scale',c:MC.Scale},{v:'Nominal',c:MC.Nominal},{v:'Ordinal',c:MC.Ordinal}];
  else if(field==='role') options=[{v:'Input',c:RC.Input},{v:'Target',c:RC.Target},{v:'Both',c:RC.Both},{v:'None',c:RC.None}];

  var pop=document.createElement('div');
  pop.id='_var-picker-pop';
  pop.dataset.field=field;
  pop.dataset.idx=idx;
  pop.style.cssText='position:fixed;z-index:9800;background:linear-gradient(135deg,rgba(20,8,40,.97),rgba(14,6,24,.99));border:1px solid rgba(192,132,252,.3);border-radius:12px;padding:6px;box-shadow:0 8px 32px rgba(0,0,0,.7);min-width:140px;animation:cselPop .15s cubic-bezier(.16,1,.3,1)';

  // Position near trigger
  var rect=triggerEl.getBoundingClientRect();
  var top=rect.bottom+6;
  var left=rect.left;
  if(left+160>window.innerWidth) left=window.innerWidth-170;
  if(top+options.length*44+12>window.innerHeight) top=rect.top-options.length*44-16;
  pop.style.top=top+'px';
  pop.style.left=left+'px';

  // Header
  var hdr=document.createElement('div');
  hdr.style.cssText='font-size:9.5px;color:rgba(232,222,255,.3);text-transform:uppercase;font-weight:700;padding:4px 8px 6px;letter-spacing:.8px';
  hdr.textContent=field==='type'?'Variable Type':field==='measure'?'Measurement Level':'Role';
  pop.appendChild(hdr);

  var curVal=vars[idx][field];

  options.forEach(function(opt){
    var btn=document.createElement('button');
    var isActive=curVal===opt.v;
    btn.style.cssText='display:flex;align-items:center;gap:10px;width:100%;padding:8px 12px;border:none;border-radius:8px;cursor:pointer;font-family:Inter,sans-serif;font-size:12.5px;font-weight:600;margin-bottom:2px;transition:.12s;'
      +(isActive?'background:'+opt.c+'22;color:'+opt.c+';outline:1.5px solid '+opt.c+'45':'background:transparent;color:rgba(232,222,255,.6)');
    var dot=document.createElement('span');
    dot.style.cssText='width:10px;height:10px;border-radius:50%;background:'+opt.c+';flex-shrink:0;'+(isActive?'':'opacity:.4');
    var label=document.createElement('span');
    label.textContent=opt.v;
    var check=document.createElement('span');
    check.style.cssText='margin-left:auto;color:'+opt.c+';font-size:13px';
    check.textContent=isActive?'✓':'';
    btn.appendChild(dot);
    btn.appendChild(label);
    btn.appendChild(check);
    btn.onmouseover=function(){if(!isActive)this.style.background='rgba(124,58,237,.15)';};
    btn.onmouseout=function(){if(!isActive)this.style.background='transparent';};
    btn.onclick=function(){
      var MC2={Scale:'#60a5fa',Nominal:'#f472b6',Ordinal:'#a78bfa'};
      var RC2={Target:'#fbbf24',Input:'#34d399',Both:'#fb923c',None:'#94a3b8'};

      // Helper: update a badge element's text and color instantly
      function updateBadgeEl(badge, text, color){
        if(!badge) return;
        badge.innerHTML=text+' <svg width="9" height="9" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
        badge.style.background=color+'18';
        badge.style.color=color;
        badge.style.borderColor=color+'35';
      }

      // 1. Update badge di DOM SEBELUM pop.remove() agar querySelector masih valid
      var badge=document.querySelector('.var-pick-badge[data-i="'+idx+'"][data-fld="'+field+'"]');
      var newC=field==='type'?(opt.v==='Numeric'?'#60a5fa':'#f472b6'):field==='measure'?(MC2[opt.v]||'#60a5fa'):(RC2[opt.v]||'#34d399');
      updateBadgeEl(badge, opt.v, newC);

      // 2. Apply change to data model (setelah DOM diupdate)
      var fakeEl={dataset:{i:String(idx),fld:field},value:opt.v};
      _varInlineChange(fakeEl);

      // 3. Tutup popup
      pop.remove();

      // 4. Jika type berubah, juga update measure badge dan decimals
      if(field==='type'){
        var newMeasure=vars[idx].measure;
        var mBadge=document.querySelector('.var-pick-badge[data-i="'+idx+'"][data-fld="measure"]');
        updateBadgeEl(mBadge, newMeasure, MC2[newMeasure]||'#60a5fa');
        var decCell=document.querySelector('.var-inline-inp[data-i="'+idx+'"][data-fld="dec"]');
        var decTd=decCell?decCell.parentElement:null;
        if(decCell) decCell.style.display=opt.v==='Numeric'?'':'none';
        // Jika String, ganti cell decimals jadi teks "—"
        if(decTd && opt.v==='String'){
          decTd.innerHTML='<span style="color:rgba(232,222,255,.3)">—</span>';
        } else if(decTd && opt.v==='Numeric' && !decCell){
          // Jika sebelumnya String, perlu re-render cell decimals
          decTd.innerHTML='<input class="var-inline-inp" data-i="'+idx+'" data-fld="dec" type="number" min="0" max="10" value="'+vars[idx].dec+'" onblur="_varInlineChange(this)" style="width:52px;color:rgba(232,222,255,.7)"/>';
        }
      }
    };
    pop.appendChild(btn);
  });

  document.body.appendChild(pop);

  // Close on outside click
  setTimeout(function(){
    document.addEventListener('click',function _closePicker(e){
      if(!pop.contains(e.target)&&e.target!==triggerEl){pop.remove();document.removeEventListener('click',_closePicker);}
    });
  },0);
}

function _varDeleteSelected(){
  if(_varChecked.size===0){showToast('No variables selected','error');return;}
  var indices=Array.from(_varChecked).sort(function(a,b){return b-a;});
  var names=indices.map(function(i){return vars[i].name;});
  ossDialog({
    type:'delete',
    title:'Delete Variable'+(indices.length>1?'s':''),
    msg:'Hapus <b style="color:#c084fc">'+indices.length+' variable</b>: <span style="color:rgba(232,222,255,.5);font-size:11.5px">'+names.map(function(n){return'"'+n+'"';}).join(', ')+'</span><br><br><span style="color:#fbbf24;font-size:11.5px">⚠ Semua data di kolom ini akan ikut terhapus.</span>',
    okLabel:'Hapus '+indices.length+' variable',
    onOk:function(){
      indices.forEach(function(i){
        var vname=vars[i].name;
        vars.splice(i,1);
        data.forEach(function(r){delete r[vname];});
      });
      _varChecked=new Set();
      updateBadges();
      switchTab('variable');
      showToast('Variable berhasil dihapus');
    }
  });
}

// ── Save / exit edit mode ────────────────────────────────────
function _varSaveEditMode(){
  _varTableEditMode=false;
  _varChecked=new Set();
  updateBadges();
  switchTab('variable');
  showToast('Variable berhasil disimpan');
}

// ── Variable editing functions ──────────────────────────────────
function editVarField(i, field){
  i=parseInt(i);var v=vars[i];
  var cur=v[field]||'';
  var label=field==='name'?'Variable Name':field==='label'?'Variable Label':field==='dec'?'Decimal Places':'';
  var inp=prompt(label+' for "'+v.name+'":', String(cur));
  if(inp===null) return;
  inp=inp.trim();
  if(inp==='') return;
  if(field==='name'){
    var newName=inp.replace(/[^a-zA-Z0-9_]/g,'_').toLowerCase();
    if(vars.some(function(vv,ii){return ii!==i&&vv.name===newName;})){
      showToast('Name already exists','error');return;
    }
    data.forEach(function(r){r[newName]=r[v.name];delete r[v.name];});
    v.name=newName;
  } else if(field==='dec'){
    var d=parseInt(inp);
    if(!isNaN(d)&&d>=0&&d<=10) v.dec=d;
  } else {
    v[field]=inp;
  }
  updateBadges();switchTab('variable');showToast('Variable berhasil diupdate');
}

function cycleVarType(i){i=parseInt(i);
  var types=['Numeric','String'];
  var cur=types.indexOf(vars[i].type);
  vars[i].type=types[(cur+1)%types.length];
  if(vars[i].type==='String'){vars[i].measure='Nominal';vars[i].dec=0;}
  else vars[i].measure='Scale';
  switchTab('variable');
}

function cycleMeasure(i){i=parseInt(i);
  var ms=['Scale','Nominal','Ordinal'];
  var cur=ms.indexOf(vars[i].measure);
  vars[i].measure=ms[(cur+1)%ms.length];
  switchTab('variable');
}

function cycleRole(i){i=parseInt(i);
  var roles=['Input','Target','Both','None'];
  var cur=roles.indexOf(vars[i].role);
  vars[i].role=roles[(cur+1)%roles.length];
  switchTab('variable');
}

function moveVar(i, dir){i=parseInt(i);dir=parseInt(dir);
  var j=i+dir;
  if(j<0||j>=vars.length) return;
  var tmp=vars[i];vars[i]=vars[j];vars[j]=tmp;
  switchTab('variable');
}

function deleteVar(i){
  i=parseInt(i);
  if(i<0||i>=vars.length) return;
  var vname=vars[i].name;
  ossDialog({
    type:'delete',
    title:'Delete Variable',
    msg:'Delete <b style="color:#c084fc">"'+vname+'"</b>?<br><span style="color:rgba(232,222,255,.55);font-size:11.5px">This removes it from all '+data.length+' rows.</span>',
    okLabel:'Delete',
    onOk:function(){
      vars.splice(i,1);
      data.forEach(function(r){delete r[vname];});
      updateBadges();
      switchTab('variable');
      showToast('Variable berhasil dihapus');
    }
  });
}

function clearAllData(){
  ossDialog({
    type:'delete',
    title:'Clear All Data',
    msg:'Hapus semua baris data? <br><span style="color:rgba(232,222,255,.5);font-size:11.5px">Definisi variable akan tetap ada.</span>',
    okLabel:'Clear All Data',
    onOk:function(){data=[];updateBadges();switchTab('data');showToast('Data berhasil dihapus');}
  });
}

function addVarModal(){
  // State
  window._nvType='Numeric';
  window._nvMeasure='Scale';
  window._nvRole='Input';

  // Register csel entries
  _cR['nv-type']  ={fields:['Numeric','String'],          current:'Numeric', showBadge:false, label:'Type',    onChange:'window._nvType=val; var mv=document.getElementById("cv-nv-measure"); if(val==="String"){window._nvMeasure="Nominal";if(mv)mv.textContent="Nominal";_cR["nv-measure"].current="Nominal";}else{window._nvMeasure="Scale";if(mv)mv.textContent="Scale";_cR["nv-measure"].current="Scale";} var dw=document.getElementById("nv-dec-wrap");if(dw)dw.style.display=val==="Numeric"?"block":"none";'};
  _cR['nv-measure']={fields:['Scale','Nominal','Ordinal'], current:'Scale',   showBadge:false, label:'Measure', onChange:'window._nvMeasure=val;'};
  _cR['nv-role']  ={fields:['Input','Target','Both','None'],current:'Input',  showBadge:false, label:'Role',    onChange:'window._nvRole=val;'};

  var html=
    '<div id="add-var-modal" onclick="if(event.target===this)this.remove()" style="position:fixed;inset:0;z-index:9600;background:rgba(5,1,14,.6);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px">'+
    '<div style="background:linear-gradient(135deg,rgba(124,58,237,.18) 0%,rgba(14,6,24,.82) 40%,rgba(219,39,119,.10) 100%);backdrop-filter:blur(28px) saturate(160%);-webkit-backdrop-filter:blur(28px) saturate(160%);border:1px solid rgba(192,132,252,.22);border-top:1px solid rgba(192,132,252,.38);border-radius:18px;width:100%;max-width:440px;max-height:90vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,.55),0 0 0 1px rgba(124,58,237,.08) inset;animation:cselPop .22s cubic-bezier(.16,1,.3,1)">'+
      '<div style="padding:16px 18px 12px;border-bottom:1px solid rgba(124,58,237,.12);display:flex;align-items:center;justify-content:space-between;flex-shrink:0">'+
        '<span style="font-family:\'Playfair Display\',serif;font-style:italic;font-size:15px;font-weight:700;color:#c084fc">New Variable</span>'+
        '<button onclick="document.getElementById(\'add-var-modal\').remove()" style="background:rgba(124,58,237,.12);border:none;color:rgba(232,222,255,.5);width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:14px">✕</button>'+
      '</div>'+
      '<div style="padding:16px 18px;display:flex;flex-direction:column;gap:13px;overflow-y:auto;flex:1">'+

        '<div><label class="lbl">Variable Name <span style="color:rgba(232,222,255,.3)">(letters/numbers/underscore)</span></label>'+
        '<input id="nv-name" class="inp" placeholder="e.g. income, score_1, gender" autocomplete="off" style="margin-top:5px"/></div>'+

        '<div><label class="lbl">Label <span style="color:rgba(232,222,255,.3)">(descriptive name)</span></label>'+
        '<input id="nv-label" class="inp" placeholder="e.g. Monthly Income, Test Score" autocomplete="off" style="margin-top:5px"/></div>'+

        '<div>'+mkCsel('nv-type',  ['Numeric','String'],           'Numeric','window._nvType=val; var mv=document.getElementById("cv-nv-measure"); if(val==="String"){window._nvMeasure="Nominal";if(mv)mv.textContent="Nominal";_cR["nv-measure"].current="Nominal";}else{window._nvMeasure="Scale";if(mv)mv.textContent="Scale";_cR["nv-measure"].current="Scale";} var dw=document.getElementById("nv-dec-wrap");if(dw)dw.style.display=val==="Numeric"?"block":"none";','Type')+'</div>'+
        '<div>'+mkCsel('nv-measure',['Scale','Nominal','Ordinal'],  'Scale',  'window._nvMeasure=val;','Measure')+'</div>'+
        '<div>'+mkCsel('nv-role',  ['Input','Target','Both','None'],'Input',  'window._nvRole=val;','Role')+'</div>'+

        '<div id="nv-dec-wrap"><label class="lbl">Decimal Places</label>'+
        '<input id="nv-dec" class="inp" type="number" value="2" min="0" max="10" style="margin-top:5px;width:100px"/></div>'+

      '</div>'+
      '<div style="padding:12px 18px 16px;border-top:1px solid rgba(124,58,237,.1);display:flex;gap:8px;flex-shrink:0">'+
        '<button onclick="confirmAddVar()" style="flex:1;padding:11px;border-radius:8px;border:none;cursor:pointer;background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff;font-size:13px;font-weight:700;font-family:Inter,sans-serif">Add Variable</button>'+
        '<button onclick="document.getElementById(\'add-var-modal\').remove()" style="padding:11px 18px;border-radius:8px;border:1px solid rgba(124,58,237,.25);background:transparent;color:rgba(232,222,255,.5);font-size:13px;cursor:pointer;font-family:Inter,sans-serif">Cancel</button>'+
      '</div>'+
    '</div>'+
    '</div>';

  document.body.insertAdjacentHTML('beforeend',html);
  setTimeout(function(){var el=document.getElementById('nv-name');if(el)el.focus();},100);
}

function confirmAddVar(){
  var nameInp=document.getElementById('nv-name');
  var lblInp=document.getElementById('nv-label');
  var decInp=document.getElementById('nv-dec');
  var name=(nameInp?nameInp.value:'').trim().replace(/[^a-zA-Z0-9_]/g,'_').toLowerCase();
  var label=(lblInp?lblInp.value:'').trim();
  var dec=parseInt(decInp?decInp.value:2)||0;
  var nvType=window._nvType||'Numeric';
  var nvMeasure=window._nvMeasure||'Scale';
  var nvRole=window._nvRole||'Input';
  if(!name){showToast('Variable name required','error');return;}
  if(vars.some(function(v){return v.name===name;})){showToast('Name already exists','error');return;}
  vars.push({name:name,type:nvType,width:nvType==='Numeric'?8:20,dec:nvType==='Numeric'?dec:0,
    label:label||name,measure:nvMeasure,role:nvRole});
  data.forEach(function(r){r[name]=null;});
  var m=document.getElementById('add-var-modal');if(m)m.remove();
  updateBadges();switchTab('variable');showToast('Variable berhasil ditambahkan');
}
