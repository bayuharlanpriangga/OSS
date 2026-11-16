// VARIABLE VIEW
var _varTableEditMode = false;
var _varChecked = new Set();

function renderVars(el){
  const MC={Scale:'var(--ink)',Nominal:'var(--line)',Ordinal:'var(--gold-text)'};
  const RC={Target:'var(--gold-text)',Input:'var(--ok)',Both:'var(--warn)',None:'var(--ink-subtle)'};
  var em=_varTableEditMode;
  let html='';

  // Variable Definitions — flattened table directly on Perak surface
  html+='<section>';
  html+='<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:12px">';
  html+='<div class="sec-hd" style="margin-bottom:0">Variable Definitions</div>';
  html+='<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">';

  // Add Variable button (Emas primary CTA when not in edit mode)
  if(!em){
    html+='<button class="btn btn-primary btn-sm" onclick="addVarInline()">+ Add Variable</button>';
    html+='<button class="btn btn-ghost btn-sm" onclick="_varTableEditMode=true;_varChecked=new Set();switchTab(\'variable\')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;margin-right:4px"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>Edit Table</button>';
  } else {
    html+='<button class="btn btn-ghost btn-sm" onclick="addVarInline()">+ Add Variable</button>';
    if(_varChecked.size>0){
      html+='<button class="btn btn-red btn-sm var-del-btn" onclick="_varDeleteSelected()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;margin-right:4px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>Delete ('+_varChecked.size+')</button>';
    }
    html+='<button id="var-done-btn" class="btn btn-primary btn-sm" onclick="_varSaveEditMode()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;margin-right:4px"><polyline points="20 6 9 17 4 12"/></svg>Done</button>';
  }
  html+='<button class="btn btn-ghost btn-sm" onclick="clearAllData()">Clear Data</button>';
  html+='</div></div>';

  // Variable table
  html+='<div class="tbl-wrap"><table id="var-def-table"><thead><tr>';
  if(em) html+='<th style="width:36px;text-align:center"><input type="checkbox" id="var-chk-all" onchange="_varCheckAll(this.checked)" style="accent-color:var(--ink);width:15px;height:15px;cursor:pointer"/></th>';
  ['#','Name','Type','Measure','Role','Decimals','Valid'].forEach(function(h){
    var isNum=(h==='#'||h==='Decimals'||h==='Valid');
    html+='<th'+(isNum?' class="td-num"':'')+'>'+h+'</th>';
  });
  if(!em) html+='<th>Actions</th>';
  html+='</tr></thead><tbody id="var-tbody">';

  vars.forEach(function(v,i){
    const nMiss=data.filter(function(r){return isMiss(r[v.name]);}).length;
    const nV=data.length-nMiss;
    var chk=_varChecked.has(i);
    html+='<tr id="var-row-'+i+'"'+(chk?' style="background:var(--err-bg)"':'')+'>';

    // Checkbox col (edit mode only)
    if(em){
      html+='<td style="text-align:center"><input type="checkbox" class="var-chk" data-i="'+i+'" '+(chk?'checked':'')+' onchange="_varToggleCheck('+i+',this.checked)" style="accent-color:var(--ink);width:15px;height:15px;cursor:pointer"/></td>';
    }

    // Row number
    html+='<td class="td-num" style="color:var(--ink-subtle);font-size:11px">'+(i+1)+'</td>';

    // Name
    if(em){
      html+='<td><input class="var-inline-inp" data-i="'+i+'" data-fld="name" value="'+escHtmlAttr(v.name)+'" onblur="_varInlineChange(this)" onkeydown="if(event.key===\'Enter\')this.blur()" style="width:110px;font-weight:700;color:var(--ink)"/></td>';
    } else {
      html+='<td><span style="font-weight:700;color:var(--ink)">'+escHtml(v.name)+'</span></td>';
    }

    // Type — clickable badge opens in-web picker popup
    if(em){
      var tCol=v.type==='Numeric'?'var(--ink)':'var(--line)';
      html+='<td><span class="var-pick-badge" data-i="'+i+'" data-fld="type" onclick="_varPickerOpen(this,'+i+',\'type\')" style="background:var(--surface-alt);color:'+tCol+';border:1px solid var(--line-soft);border-radius:var(--r-sm);padding:4px 10px;font-size:11.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:5px;white-space:nowrap">'+v.type+' <svg width="9" height="9" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span></td>';
    } else {
      html+='<td><span class="tag '+(v.type==='Numeric'?'tag-blue':'tag-pink')+'">'+v.type+'</span></td>';
    }

    // Measure — clickable badge
    if(em){
      var mCol=MC[v.measure]||'var(--ink)';
      html+='<td><span class="var-pick-badge" data-i="'+i+'" data-fld="measure" onclick="_varPickerOpen(this,'+i+',\'measure\')" style="background:var(--surface-alt);color:'+mCol+';border:1px solid var(--line-soft);border-radius:var(--r-sm);padding:4px 10px;font-size:11.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:5px;white-space:nowrap;min-width:74px;justify-content:space-between">'+v.measure+' <svg width="9" height="9" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span></td>';
    } else {
      var mc2=MC[v.measure]||'var(--ink)';
      html+='<td><span class="tag" style="background:var(--surface-alt);color:'+mc2+';border:1px solid var(--line-soft);min-width:64px;justify-content:center">'+v.measure+'</span></td>';
    }

    // Role — clickable badge
    if(em){
      var rCol=RC[v.role]||'var(--ok)';
      html+='<td><span class="var-pick-badge" data-i="'+i+'" data-fld="role" onclick="_varPickerOpen(this,'+i+',\'role\')" style="background:var(--surface-alt);color:'+rCol+';border:1px solid var(--line-soft);border-radius:var(--r-sm);padding:4px 10px;font-size:11.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:5px;white-space:nowrap">'+v.role+' <svg width="9" height="9" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span></td>';
    } else {
      var rc2=RC[v.role]||'var(--ok)';
      html+='<td><span class="tag" style="background:var(--surface-alt);color:'+rc2+';border:1px solid var(--line-soft)">'+v.role+'</span></td>';
    }

    // Decimals
    if(em && v.type==='Numeric'){
      html+='<td class="td-num"><input class="var-inline-inp" data-i="'+i+'" data-fld="dec" type="number" min="0" max="10" value="'+v.dec+'" onblur="_varInlineChange(this)" style="width:56px;color:var(--ink);text-align:right"/></td>';
    } else {
      html+='<td class="td-num" style="color:var(--ink-muted)">'+(v.type==='Numeric'?v.dec:'—')+'</td>';
    }

    // Valid
    html+='<td class="td-num" style="color:var(--ok);font-weight:600">'+nV+'</td>';

    // Actions column (non-edit mode only)
    if(!em){
      html+='<td>';
      html+='<div style="display:flex;gap:4px;align-items:center">';
      if(i>0) html+='<button onclick="moveVar('+i+',-1)" class="btn btn-ghost btn-sm" style="min-height:30px;padding:3px 7px" title="Move up" aria-label="Move up"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg></button>';
      if(i<vars.length-1) html+='<button onclick="moveVar('+i+',1)" class="btn btn-ghost btn-sm" style="min-height:30px;padding:3px 7px" title="Move down" aria-label="Move down"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></button>';
      html+='<button onclick="deleteVar('+i+')" class="btn btn-red btn-sm" style="min-height:30px;padding:3px 7px" title="Delete" aria-label="Delete"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
      html+='</div></td>';
    }

    html+='</tr>';
  });

  // If in edit mode, show a "new blank row" hint at the bottom
  if(em){
    html+='<tr><td></td><td colspan="7" style="font-size:11.5px;color:var(--ink-subtle);font-style:italic;padding:10px 8px">Use "+ Add Variable" to add more rows</td></tr>';
  }

  html+='</tbody></table></div>';

  // Suggestions
  const typeWarnings=vars.map(function(v){
    if(v.name==='id'&&v.measure!=='Scale') return 'ID variable should be Scale';
    return null;
  }).filter(Boolean);
  if(typeWarnings.length){
    html+='<div style="margin-top:12px;padding:10px 14px;background:var(--warn-bg);border:1px solid var(--warn-bd);border-radius:var(--r-sm)">';
    html+='<div style="font-size:10.5px;font-weight:700;color:var(--warn);margin-bottom:4px;text-transform:uppercase;letter-spacing:.06em">Suggestions</div>';
    typeWarnings.forEach(function(w){html+='<div style="font-size:12px;color:var(--ink)">'+w+'</div>';});
    html+='</div>';
  }
  html+='</section>';

  // Inject CSS for inline inputs/selects once
  if(!document.getElementById('var-inline-style')){
    var s=document.createElement('style');s.id='var-inline-style';
    s.textContent='.var-inline-inp{background:var(--surface);border:1px solid var(--line-soft);border-radius:var(--r-sm);padding:4px 8px;font-size:12.5px;font-family:var(--font-sans-stack);color:var(--ink);outline:none;transition:border-color .15s}.var-inline-inp:focus{border-color:var(--ink);background:var(--surface)}.var-inline-sel{background:var(--surface);border:1px solid var(--line-soft);border-radius:var(--r-sm);padding:4px 8px;font-size:12.5px;font-family:var(--font-sans-stack);color:var(--ink);outline:none;cursor:pointer;-webkit-appearance:none;appearance:none;transition:border-color .15s;min-width:80px}.var-inline-sel:focus{border-color:var(--ink)}.var-inline-sel option{background:var(--surface);color:var(--ink)}';
    document.head.appendChild(s);
  }

  el.innerHTML=html;
}

// Inline add var (raw blank row)
function addVarInline(){
  // Generate unique name
  var base='var',n=1;
  while(vars.some(function(v){return v.name===base+n;})) n++;
  var name=base+n;
  vars.push({name:name,type:'Numeric',width:8,dec:2,label:name,measure:'Scale',role:'Input'});
  data.forEach(function(r){r[name]=null;});
  updateBadges();
  switchTab('variable');
  showToast('Variable berhasil ditambahkan');
}

// Inline change handler
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
    var mc2={Scale:'var(--ink)',Nominal:'var(--line)',Ordinal:'var(--gold-text)'};
    var mSel=document.querySelector('.var-inline-sel[data-i="'+i+'"][data-fld="measure"]');
    if(mSel){mSel.value=v.measure;mSel.style.color=mc2[v.measure]||'var(--ink)';}
    var decInp=document.querySelector('.var-inline-inp[data-i="'+i+'"][data-fld="dec"]');
    if(decInp) decInp.style.display=val==='Numeric'?'':'none';
    if(el.style) el.style.color=val==='Numeric'?'var(--ink)':'var(--line)';
  } else if(fld==='measure'){
    v.measure=val;
    var mc3={Scale:'var(--ink)',Nominal:'var(--line)',Ordinal:'var(--gold-text)'};
    if(el.style) el.style.color=mc3[val]||'var(--ink)';
  } else if(fld==='role'){
    v.role=val;
    var rc3={Target:'var(--gold-text)',Input:'var(--ok)',Both:'var(--warn)',None:'var(--ink-subtle)'};
    if(el.style) el.style.color=rc3[val]||'var(--ok)';
  } else if(fld==='label'){
    v.label=val;
  }
  updateBadges();
}

// Checkbox helpers
function _varCheckAll(checked){
  _varChecked=new Set();
  if(checked) vars.forEach(function(_,i){_varChecked.add(i);});
  document.querySelectorAll('.var-chk').forEach(function(cb){cb.checked=checked;});
  document.querySelectorAll('#var-tbody tr').forEach(function(tr){
    tr.style.background=checked?'var(--err-bg)':'';
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
  if(row) row.style.background=checked?'var(--err-bg)':'';
  _varUpdateHeaderChk();
  _varSyncDeleteBtn();
}

function _varSyncDeleteBtn(){
  var doneBtn=document.getElementById('var-done-btn');
  if(!doneBtn) return;
  var parent=doneBtn.parentNode;
  parent.querySelectorAll('.var-del-btn').forEach(function(b){b.remove();});
  if(_varChecked.size>0){
    var nb=document.createElement('button');
    nb.className='btn btn-red btn-sm var-del-btn';
    nb.innerHTML='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;margin-right:4px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>Delete ('+_varChecked.size+')';
    nb.onclick=function(){_varDeleteSelected();};
    parent.insertBefore(nb,doneBtn);
  }
}

// In-web picker popup for TYPE / MEASURE / ROLE
function _varPickerOpen(triggerEl, idx, field){
  var existing=document.getElementById('_var-picker-pop');
  if(existing){existing.remove();if(existing.dataset.field===field&&parseInt(existing.dataset.idx)===idx)return;}

  var options=[];
  var MC={Scale:'var(--ink)',Nominal:'var(--line)',Ordinal:'var(--gold-text)'};
  var RC={Target:'var(--gold-text)',Input:'var(--ok)',Both:'var(--warn)',None:'var(--ink-subtle)'};

  if(field==='type') options=[{v:'Numeric',c:'var(--ink)'},{v:'String',c:'var(--line)'}];
  else if(field==='measure') options=[{v:'Scale',c:MC.Scale},{v:'Nominal',c:MC.Nominal},{v:'Ordinal',c:MC.Ordinal}];
  else if(field==='role') options=[{v:'Input',c:RC.Input},{v:'Target',c:RC.Target},{v:'Both',c:RC.Both},{v:'None',c:RC.None}];

  var pop=document.createElement('div');
  pop.id='_var-picker-pop';
  pop.dataset.field=field;
  pop.dataset.idx=idx;
  pop.style.cssText='position:fixed;z-index:9800;background:var(--surface);border:1px solid var(--line);border-radius:var(--r-md);padding:6px;box-shadow:var(--shadow-modal);min-width:156px;animation:cselPop .15s cubic-bezier(.16,1,.3,1)';

  var rect=triggerEl.getBoundingClientRect();
  var top=rect.bottom+6;
  var left=rect.left;
  if(left+168>window.innerWidth) left=window.innerWidth-176;
  if(top+options.length*44+20>window.innerHeight) top=Math.max(12,rect.top-options.length*44-20);
  pop.style.top=top+'px';
  pop.style.left=left+'px';

  var hdr=document.createElement('div');
  hdr.style.cssText='font-size:10px;color:var(--ink-subtle);text-transform:uppercase;font-weight:700;padding:4px 8px 6px;letter-spacing:.08em';
  hdr.textContent=field==='type'?'Variable Type':field==='measure'?'Measurement Level':'Role';
  pop.appendChild(hdr);

  var curVal=vars[idx][field];

  options.forEach(function(opt){
    var btn=document.createElement('button');
    var isActive=curVal===opt.v;
    btn.style.cssText='display:flex;align-items:center;gap:10px;width:100%;padding:8px 10px;border:none;border-radius:var(--r-sm);cursor:pointer;font-family:var(--font-sans-stack);font-size:12.5px;font-weight:600;margin-bottom:2px;transition:.12s;min-height:36px;'
      +(isActive?'background:var(--surface-alt);color:'+opt.c+';outline:1px solid var(--line)':'background:transparent;color:var(--ink-muted)');
    var facet=document.createElement('span');
    facet.style.cssText='width:8px;height:8px;transform:rotate(45deg);background:'+opt.c+';flex-shrink:0;'+(isActive?'':'opacity:.45');
    var label=document.createElement('span');
    label.textContent=opt.v;
    var check=document.createElement('span');
    check.style.cssText='margin-left:auto;color:'+opt.c+';font-size:12px;display:flex;align-items:center';
    check.innerHTML=isActive?'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>':'';
    btn.appendChild(facet);
    btn.appendChild(label);
    btn.appendChild(check);
    btn.onmouseover=function(){if(!isActive)this.style.background='var(--surface-alt)';};
    btn.onmouseout=function(){if(!isActive)this.style.background='transparent';};
    btn.onclick=function(){
      var MC2={Scale:'var(--ink)',Nominal:'var(--line)',Ordinal:'var(--gold-text)'};
      var RC2={Target:'var(--gold-text)',Input:'var(--ok)',Both:'var(--warn)',None:'var(--ink-subtle)'};

      function updateBadgeEl(badge, text, color){
        if(!badge) return;
        badge.innerHTML=text+' <svg width="9" height="9" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
        badge.style.background='var(--surface-alt)';
        badge.style.color=color;
        badge.style.borderColor='var(--line-soft)';
      }

      var badge=document.querySelector('.var-pick-badge[data-i="'+idx+'"][data-fld="'+field+'"]');
      var newC=field==='type'?(opt.v==='Numeric'?'var(--ink)':'var(--line)'):field==='measure'?(MC2[opt.v]||'var(--ink)'):(RC2[opt.v]||'var(--ok)');
      updateBadgeEl(badge, opt.v, newC);

      var fakeEl={dataset:{i:String(idx),fld:field},value:opt.v};
      _varInlineChange(fakeEl);

      pop.remove();

      if(field==='type'){
        var newMeasure=vars[idx].measure;
        var mBadge=document.querySelector('.var-pick-badge[data-i="'+idx+'"][data-fld="measure"]');
        updateBadgeEl(mBadge, newMeasure, MC2[newMeasure]||'var(--ink)');
        var decCell=document.querySelector('.var-inline-inp[data-i="'+idx+'"][data-fld="dec"]');
        var decTd=decCell?decCell.parentElement:null;
        if(decCell) decCell.style.display=opt.v==='Numeric'?'':'none';
        if(decTd && opt.v==='String'){
          decTd.innerHTML='<span style="color:var(--ink-subtle)">—</span>';
        } else if(decTd && opt.v==='Numeric' && !decCell){
          decTd.innerHTML='<input class="var-inline-inp" data-i="'+idx+'" data-fld="dec" type="number" min="0" max="10" value="'+vars[idx].dec+'" onblur="_varInlineChange(this)" style="width:56px;color:var(--ink);text-align:right"/>';
        }
      }
    };
    pop.appendChild(btn);
  });

  document.body.appendChild(pop);

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
    msg:'Hapus <b style="color:var(--ink)">'+indices.length+' variable</b>: <span style="color:var(--ink-muted);font-size:12px">'+names.map(function(n){return'"'+escHtml(n)+'"';}).join(', ')+'</span><br><br><span style="color:var(--warn);font-size:12px">Semua data di kolom ini akan ikut terhapus.</span>',
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

// Save / exit edit mode
function _varSaveEditMode(){
  _varTableEditMode=false;
  _varChecked=new Set();
  updateBadges();
  switchTab('variable');
  showToast('Variable berhasil disimpan');
}

// Variable editing functions
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
    msg:'Delete <b style="color:var(--ink)">"'+escHtml(vname)+'"</b>?<br><span style="color:var(--ink-muted);font-size:12px">This removes it from all '+data.length+' rows.</span>',
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
    msg:'Hapus semua baris data? <br><span style="color:var(--ink-muted);font-size:12px">Definisi variable akan tetap ada.</span>',
    okLabel:'Clear All Data',
    onOk:function(){data=[];updateBadges();switchTab('data');showToast('Data berhasil dihapus');}
  });
}

function addVarModal(){
  window._nvType='Numeric';
  window._nvMeasure='Scale';
  window._nvRole='Input';

  _cR['nv-type']  ={fields:['Numeric','String'],          current:'Numeric', showBadge:false, label:'Type',    onChange:'window._nvType=val; var mv=document.getElementById("cv-nv-measure"); if(val==="String"){window._nvMeasure="Nominal";if(mv)mv.textContent="Nominal";_cR["nv-measure"].current="Nominal";}else{window._nvMeasure="Scale";if(mv)mv.textContent="Scale";_cR["nv-measure"].current="Scale";} var dw=document.getElementById("nv-dec-wrap");if(dw)dw.style.display=val==="Numeric"?"block":"none";'};
  _cR['nv-measure']={fields:['Scale','Nominal','Ordinal'], current:'Scale',   showBadge:false, label:'Measure', onChange:'window._nvMeasure=val;'};
  _cR['nv-role']  ={fields:['Input','Target','Both','None'],current:'Input',  showBadge:false, label:'Role',    onChange:'window._nvRole=val;'};

  var html=
    '<div id="add-var-modal" onclick="if(event.target===this)this.remove()" style="position:fixed;inset:0;z-index:9600;background:var(--scrim);display:flex;align-items:center;justify-content:center;padding:16px">'+
    '<div class="modal-box" style="width:100%;max-width:440px;max-height:90dvh;overflow:hidden;display:flex;flex-direction:column">'+
      '<div style="padding:16px 18px 12px;border-bottom:1px solid var(--line-soft);display:flex;align-items:center;justify-content:space-between;flex-shrink:0">'+
        '<span style="font-family:var(--font-serif-stack);font-size:17px;font-weight:700;color:var(--ink)">New Variable</span>'+
        '<button onclick="document.getElementById(\'add-var-modal\').remove()" class="btn btn-ghost btn-sm" style="min-height:36px;min-width:36px;padding:0;justify-content:center" aria-label="Close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>'+
      '</div>'+
      '<div style="padding:16px 18px;display:flex;flex-direction:column;gap:13px;overflow-y:auto;flex:1">'+

        '<div><label class="lbl">Variable Name <span style="color:var(--ink-subtle);text-transform:none;letter-spacing:0">(letters/numbers/underscore)</span></label>'+
        '<input id="nv-name" class="inp" placeholder="e.g. income, score_1, gender" autocomplete="off" style="margin-top:5px"/></div>'+

        '<div><label class="lbl">Label <span style="color:var(--ink-subtle);text-transform:none;letter-spacing:0">(descriptive name)</span></label>'+
        '<input id="nv-label" class="inp" placeholder="e.g. Monthly Income, Test Score" autocomplete="off" style="margin-top:5px"/></div>'+

        '<div>'+mkCsel('nv-type',  ['Numeric','String'],           'Numeric','window._nvType=val; var mv=document.getElementById("cv-nv-measure"); if(val==="String"){window._nvMeasure="Nominal";if(mv)mv.textContent="Nominal";_cR["nv-measure"].current="Nominal";}else{window._nvMeasure="Scale";if(mv)mv.textContent="Scale";_cR["nv-measure"].current="Scale";} var dw=document.getElementById("nv-dec-wrap");if(dw)dw.style.display=val==="Numeric"?"block":"none";','Type')+'</div>'+
        '<div>'+mkCsel('nv-measure',['Scale','Nominal','Ordinal'],  'Scale',  'window._nvMeasure=val;','Measure')+'</div>'+
        '<div>'+mkCsel('nv-role',  ['Input','Target','Both','None'],'Input',  'window._nvRole=val;','Role')+'</div>'+

        '<div id="nv-dec-wrap"><label class="lbl">Decimal Places</label>'+
        '<input id="nv-dec" class="inp" type="number" value="2" min="0" max="10" style="margin-top:5px;width:110px"/></div>'+

      '</div>'+
      '<div style="padding:12px 18px 16px;border-top:1px solid var(--line-soft);display:flex;gap:8px;flex-shrink:0">'+
        '<button onclick="confirmAddVar()" class="btn btn-primary" style="flex:1">Add Variable</button>'+
        '<button onclick="document.getElementById(\'add-var-modal\').remove()" class="btn btn-ghost">Cancel</button>'+
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
