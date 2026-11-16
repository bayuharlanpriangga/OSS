// MULTI-DATASET SYSTEM 
var datasets = [
  { id: 1, name: 'Dataset 1', data: [], vars: [], outputs: [] }
];
var activeDatasetId = 1;

// Global working variables — always point to active dataset
var data = datasets[0].data;
var vars = datasets[0].vars;
var outputs = datasets[0].outputs;

function getActiveDs(){ return datasets.find(function(d){return d.id===activeDatasetId;})||datasets[0]; }

// Save current globals back into the active dataset object
function _dsSyncSave(){
  var ds=getActiveDs();
  ds.data=data; ds.vars=vars; ds.outputs=outputs;
}
// Load active dataset into globals
function _dsSyncLoad(){
  var ds=getActiveDs();
  data=ds.data; vars=ds.vars; outputs=ds.outputs;
}

function switchDataset(id){
  if(activeDatasetId===id) return;
  _dsSyncSave();           // save current state
  activeDatasetId=id;
  _dsSyncLoad();           // load new dataset into globals
  updateBadges();
  renderDsSidebar();
  switchTab('data');
  showToast('Dataset berhasil diganti');
}

function addDataset(name){
  _dsSyncSave();
  var newId = datasets.reduce(function(mx,d){return Math.max(mx,d.id);},0)+1;
  datasets.push({id:newId,name:name||('Dataset '+newId),data:[],vars:[],outputs:[]});
  activeDatasetId=newId;
  _dsSyncLoad();
  updateBadges();
  renderDsSidebar();
  switchTab('data');
  showToast('Dataset berhasil dibuat');
}

function deleteDataset(id){
  if(datasets.length<=1){showToast('Minimal satu dataset harus dipertahankan','error');return;}
  var dsName=(datasets.find(function(d){return d.id===id;})||{name:'?'}).name;
  ossDialog({
    type:'delete',
    title:'Hapus Dataset',
    msg:'Yakin ingin menghapus <b style="color:var(--err)">'+escDlg(dsName)+'</b>? Tindakan ini tidak dapat dibatalkan.',
    okLabel:'Hapus',
    onOk:function(){
      _dsSyncSave();
      datasets=datasets.filter(function(d){return d.id!==id;});
      if(activeDatasetId===id) activeDatasetId=datasets[0].id;
      _dsSyncLoad();
      updateBadges();
      renderDsSidebar();
      switchTab('data');
      showToast('Dataset berhasil dihapus');
    }
  });
}

function renameDataset(id){
  var ds=datasets.find(function(d){return d.id===id;});
  if(!ds) return;
  ossDialog({
    type:'rename',
    title:'Ubah Nama Dataset',
    msg:'Masukkan nama baru untuk dataset ini.',
    inputVal:ds.name,
    inputPlaceholder:'Nama dataset…',
    okLabel:'Simpan',
    onOk:function(val){
      if(!val||!val.trim()) return;
      ds.name=val.trim();
      renderDsSidebar();
      showToast('Rename berhasil');
    }
  });
}

function showAddDatasetModal(){
  ossDialog({
    type:'add',
    title:'Dataset Baru',
    msg:'Masukkan nama untuk dataset baru.',
    inputVal:'Dataset '+(datasets.length+1),
    inputPlaceholder:'Contoh: Survei 2026',
    okLabel:'Buat',
    onOk:function(val){
      if(val&&val.trim()) addDataset(val.trim());
    }
  });
}


function renderDsSidebar(){
  var el=document.getElementById('ds-list-side');
  if(!el) return;
  _dsSyncSave();
  el.innerHTML=datasets.map(function(ds){
    var active=ds.id===activeDatasetId;
    var mc=ds.vars.reduce(function(s,v){
      return s+ds.data.filter(function(r){return r[v.name]===null||r[v.name]===undefined;}).length;
    },0);
    var delBtn='';
    if(datasets.length>1){
      delBtn='<button type="button" onclick="event.stopPropagation();deleteDataset('+ds.id+')" style="background:none;border:none;color:var(--err);cursor:pointer;padding:2px 6px;min-height:28px;font-size:12px;line-height:1" title="Hapus dataset" aria-label="Hapus '+escHtmlAttr(ds.name)+'">×</button>';
    }
    var wrapStyle='display:flex;align-items:center;gap:6px;min-height:34px;padding:5px 8px 5px 10px;border-radius:var(--r-sm);margin-bottom:2px;cursor:pointer;';
    wrapStyle+=active
      ?'background:var(--gold-tint);border:1px solid var(--gold);'
      :'border:1px solid transparent;';
    var facetStyle='width:7px;height:7px;clip-path:polygon(50% 0%,100% 50%,50% 100%,0% 50%);flex-shrink:0;background:'+(active?'var(--gold)':'var(--line-soft)');
    var nameStyle='flex:1;font-size:12.5px;font-weight:'+(active?'600':'500')+';color:'+(active?'var(--ink)':'var(--ink-muted)')+';overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
    return '<div style="'+wrapStyle+'" onclick="switchDataset('+ds.id+')" tabindex="0" role="button" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();switchDataset('+ds.id+');}" aria-label="'+escHtmlAttr(ds.name)+(active?' (aktif)':'')+'">'
      +'<span style="'+facetStyle+'" aria-hidden="true"></span>'
      +'<span style="'+nameStyle+'" ondblclick="event.stopPropagation();renameDataset('+ds.id+')">'+escHtml(ds.name)+'</span>'
      +'<span style="font-size:11px;font-variant-numeric:tabular-nums;color:var(--ink-subtle)">N='+ds.data.length+(mc>0?', '+mc+' miss':'')+'</span>'
      +delBtn
      +'</div>';
  }).join('');
}
