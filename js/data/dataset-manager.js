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
  if(datasets.length<=1){showToast('Must keep at least one dataset','error');return;}
  var dsName=(datasets.find(function(d){return d.id===id;})||{name:'?'}).name;
  ossDialog({
    type:'delete',
    title:'Delete Dataset',
    msg:'Are you sure you want to delete <b style="color:#f87171">'+escDlg(dsName)+'</b>? This action cannot be undone.',
    okLabel:'Delete',
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
    title:'Rename Dataset',
    msg:'Enter a new name for this dataset.',
    inputVal:ds.name,
    inputPlaceholder:'Dataset name…',
    okLabel:'Rename',
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
    title:'New Dataset',
    msg:'Enter a name for your new dataset.',
    inputVal:'Dataset '+(datasets.length+1),
    inputPlaceholder:'e.g. Dataset 2',
    okLabel:'Create',
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
      var btnCol=active?'rgba(248,113,113,.55)':'rgba(248,113,113,.3)';
      delBtn='<button onclick="event.stopPropagation();deleteDataset('+ds.id+')" style="background:none;border:none;color:'+btnCol+';cursor:pointer;padding:0 2px;font-size:11px;line-height:1" title="Delete">✕</button>';
    }
    var wrapStyle='display:flex;align-items:center;gap:4px;padding:5px 9px 5px 11px;border-radius:8px;margin-bottom:2px;cursor:pointer;';
    wrapStyle+=active?'background:linear-gradient(135deg,rgba(124,58,237,.2),rgba(219,39,119,.1));border:1px solid rgba(124,58,237,.22);':'border:1px solid transparent;';
    var dotCol=active?'#c084fc':'rgba(232,222,255,.2)';
    var nameStyle='flex:1;font-size:11px;font-weight:'+(active?'600':'400')+';color:'+(active?'#c084fc':'rgba(232,222,255,.45)')+';overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
    return '<div style="'+wrapStyle+'" onclick="switchDataset('+ds.id+')" tabindex="0" role="button" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();switchDataset('+ds.id+');}" aria-label="'+escHtmlAttr(ds.name)+(active?' (aktif)':'')+'">'
      +'<span style="width:7px;height:7px;border-radius:50%;background:'+dotCol+';flex-shrink:0"></span>'
      +'<span style="'+nameStyle+'" ondblclick="event.stopPropagation();renameDataset('+ds.id+')">'+escHtml(ds.name)+'</span>'
      +'<span style="font-size:9px;color:rgba(232,222,255,.3)">N='+ds.data.length+(mc>0?' ⚠'+mc:'')+'</span>'
      +delBtn
      +'</div>';
  }).join('');
}
