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
  var mc=missCount().filter(function(m){return m.count>0;});
  var html='';
  if(mc.length){
    html+='<div class="miss-warn">'+IC.warn+' <span><b>Missing:</b> '+mc.map(function(m){return escHtml(m.name)+'('+m.count+')';}).join(' · ')+' · Enter "." to mark missing</span></div>';
  }
  // Toolbar
  html+='<div class="data-toolbar">';
  html+='<div class="dt-search"><span class="dt-search-ic">'+IC.search+'</span><input class="inp" id="srch-inp" placeholder="Search…" value="'+escHtmlAttr(searchQ)+'" oninput="searchData(this.value)" autocomplete="off"/></div>';
  html+='<div class="dt-actions">';
  // + Add: always inline blank row, no popup
  html+='<button class="dt-btn dt-btn-add" onclick="addDataRowInline()">'+IC.plus+' Add</button>';
  if(sprMode){
    // In combined edit mode: single Done button saves + closes checkbox mode
    html+='<button class="dt-btn dt-btn-done" onclick="saveSprMode()">'+IC.check+' Done</button>';
    html+='<button class="dt-btn dt-btn-edit" onclick="exitSprMode()">✕ Cancel</button>';
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

  // Table
  var d=[...data];
  if(searchQ&&!sprMode) d=d.filter(function(r){return vars.some(function(v){return String(r[v.name]??'').toLowerCase().includes(searchQ.toLowerCase());});});
  if(sortCol&&!sprMode) d.sort(function(a,b){var av=a[sortCol]??'',bv=b[sortCol]??'';return sortDir==='asc'?(av>bv?1:-1):(av<bv?1:-1);});

  html+='<div class="card" style="padding:0;overflow:hidden"><div class="tbl-wrap"><table class="data-tbl"><thead><tr>';
  // Checkbox header col shown in editMode (includes sprMode since combined)
  if(editMode||sprMode){
    html+='<th style="width:26px"><input type="checkbox" id="chk-all" onchange="toggleAllRows(this)" style="accent-color:#7c3aed;width:14px;height:14px"/></th>';
  }
  html+='<th style="width:32px;color:rgba(232,222,255,.2)">#</th>';
  vars.forEach(function(v){
    var MC={Scale:'#67e8f9',Nominal:'#f472b6',Ordinal:'#c084fc'};
    var sc=sortCol===v.name&&!sprMode?(sortDir==='asc'?' '+IC.sort_asc:' '+IC.sort_desc):'';
    var dot='<span style="color:'+(MC[v.measure]||'rgba(232,222,255,.3)')+';font-size:7px;margin-right:3px">●</span>';
    var vNameSafe=escHtml(v.name);
    // Badge ⚖ di header kolom bobot kalau weight aktif
    var wBadge=(aState.wcActive&&aState.wcVar===v.name)
      ?'<span style="margin-left:4px;background:linear-gradient(135deg,#fb923c,#f472b6);color:#fff;border-radius:999px;padding:0 5px;font-size:8px">⚖</span>':'';
    if(sprMode){
      // Column fill button in header (combined edit mode)
      html+='<th>'+dot+vNameSafe+wBadge+'<button class="col-fill-btn" onclick="colFillModal(this.closest(\'th\').dataset.vn)" data-vn="'+escHtmlAttr(v.name)+'" title="Fill entire column">⬇ Fill</button></th>';
    } else {
      html+='<th onclick="toggleSort(this.dataset.col)" data-col="'+escHtmlAttr(v.name)+'" style="cursor:pointer">'+dot+vNameSafe+wBadge+sc+'</th>';
    }
  });
  html+='</tr></thead><tbody>';

  var isWindowed = !sprMode && d.length > _ossDataPageThreshold;
  var dShown = isWindowed ? d.slice(0, _ossDataShown) : d;

  dShown.forEach(function(row,ri){
    var sel=selRows.has(row.id);
    html+='<tr class="'+(sel?'selected':ri%2===0?'alt':'')+'">';
    // Checkbox col — visible in both editMode and sprMode (combined)
    if(editMode||sprMode){
      html+='<td style="min-width:26px;width:26px">';
      html+='<input type="checkbox" data-rowcb="'+row.id+'" '+(sel?'checked':'')+' onchange="toggleRow('+row.id+',this)" style="accent-color:#7c3aed;width:14px;height:14px"/>';
      html+='</td>';
    }
    html+='<td style="color:rgba(232,222,255,.2);font-size:10.5px">'+(ri+1)+'</td>';
    vars.forEach(function(v){
      var val=row[v.name];var iM=isMiss(val);
      if(sprMode){
        // Combined edit mode: direct inline editable cells
        var dispVal=(iM?'':String(val??''));
        html+='<td style="padding:3px 4px">';
        html+='<input class="spr-cell'+(iM?' missing-cell':'')+'" ';
        html+='data-rowid="'+row.id+'" data-field="'+escHtmlAttr(v.name)+'" ';
        html+='type="text" ';
        if(v.type==='Numeric'||v.type==='Scale'){
          html+='inputmode="decimal" ';
        }
        html+='value="'+escHtmlAttr(dispVal)+'" ';
        html+='placeholder="'+(iM?'. (missing)':'.')+'" ';
        html+='onkeydown="sprKeyNav(event,'+row.id+',this.dataset.field)" ';
        html+='onchange="sprCellChange(this,\''+v.type+'\')" ';
        html+='oninput="sprCellInput(this)" />';
        html+='</td>';
      } else {
        html+='<td>';
        if(iM) html+='<span class="td-miss">—</span>';
        else if(v.type==='Numeric'&&typeof val==='number') html+='<span class="td-num">'+val.toFixed(v.dec)+'</span>';
        else html+='<span class="td-str">'+escHtml(val)+'</span>';
        html+='</td>';
      }
    });
    html+='</tr>';
  });
  html+='</tbody></table></div>';

  // Footer info bar
  html+='<div style="padding:5px 11px;border-top:1px solid rgba(124,58,237,.08);color:rgba(232,222,255,.25);font-size:11px;display:flex;gap:12px;align-items:center;flex-wrap:wrap">';
  html+='<span>'+dShown.length+'/'+d.length+' rows'+(d.length!==data.length?' (dari '+data.length+' total)':'')+(aState.wcActive?' <span style="color:#fb923c;font-size:10px">⚖ N efektif = '+getNEff()+'</span>':'')+'</span>';
  if(isWindowed && dShown.length<d.length){
    html+='<button class="dt-btn" style="margin-left:auto" onclick="_ossLoadMoreRows()">⬇ Muat '+Math.min(_ossDataPageSize,d.length-dShown.length)+' baris lagi</button>';
  }
  // edit hint removed
  html+='</div></div>';
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
