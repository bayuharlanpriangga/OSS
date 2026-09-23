// SESSION + EXPORT
function saveSession(){
  try{
    _dsSyncSave(); // push globals → active dataset object
    var snap={datasets:datasets,activeDatasetId:activeDatasetId};
    localStorage.setItem('oss_session',JSON.stringify(snap));
    showToast('Session berhasil disimpan');
  }catch(e){showToast('Save failed','error');}
}
function loadSession(){
  try{
    var raw=localStorage.getItem('oss_session');
    if(!raw)return false;
    var s=JSON.parse(raw);
    // Support both old single-dataset format and new multi-dataset format
    if(s.datasets&&Array.isArray(s.datasets)){
      datasets=s.datasets;
      activeDatasetId=s.activeDatasetId||datasets[0].id;
    } else if(s.data||s.vars){
      // Legacy single-dataset session
      datasets=[{id:1,name:'Dataset 1',data:s.data||[],vars:s.vars||[],outputs:s.outputs||[]}];
      activeDatasetId=1;
    }
    _dsSyncLoad(); // push active dataset → globals
    return true;
  }catch(e){return false;}
}
setInterval(function(){
  try{_dsSyncSave();localStorage.setItem('oss_auto',JSON.stringify({datasets:datasets,activeDatasetId:activeDatasetId}));}catch(e){}
},30000);

function exportDataCSV(){
  var hdr=vars.map(function(v){return '"'+v.name+'"';}).join(',');
  var rows=data.map(function(r){
    return vars.map(function(v){
      var val=r[v.name];
      if(val===null||val===undefined)return '.';
      if(typeof val==='string')return '"'+val.replace(/"/g,'""')+'"';
      return val;
    }).join(',');
  });
  var csv=[hdr].concat(rows).join('\n');
  var blob=new Blob([csv],{type:'text/csv'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;a.download='oss_data.csv';a.click();
  URL.revokeObjectURL(url);
  showToast('CSV berhasil diexport');
}

function generateAPAReport(){
  if(!outputs.length){showToast('No outputs yet','error');return;}
  var txt='OSS Analysis Report\n'+new Date().toLocaleString()+'\n\n';
  outputs.forEach(function(o){
    txt+='## '+o.title+'\n';
    if(o.type==='ttest'&&o.res)
      txt+='t('+o.res.df+')='+o.res.t+', p'+(parseFloat(o.res.p)<.001?'<.001':'='+o.res.p_fmt)+".\n\n";
    else if(o.type==='anova'&&o.res)
      txt+='F('+o.res.dfB+','+o.res.dfW+')='+o.res.F+', p'+(parseFloat(o.res.p)<.001?'<.001':'='+o.res.p_fmt)+'.\n\n';
    else if(o.type==='correlation'&&o.res)
      txt+='r='+o.res.r+', p'+(parseFloat(o.res.p)<.001?'<.001':'='+o.res.p_fmt)+'.\n\n';
  });
  var blob=new Blob([txt],{type:'text/plain'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;a.download='oss_apa.txt';a.click();
  URL.revokeObjectURL(url);
  showToast('Report berhasil diexport');
}


// SESSION SNAPSHOT — dirty-flag tracking + build/restore snapshot
var _ossUnsaved    = false;      // dirty flag

// ── Dirty-flag tracking: mark unsaved on any data/output change ──
(function(){
  var _origAdd = window.addOutput;
  var _patchInterval = setInterval(function(){
    // Patch addOutput
    if(typeof window.addOutput === 'function' && window.addOutput !== _origAdd){
      _origAdd = window.addOutput;
    }
    var origAdd = window.addOutput;
    if(origAdd && !origAdd._ossDirtyPatched){
      window.addOutput = function(){
        origAdd.apply(this, arguments);
        ossMarkUnsaved();
      };
      window.addOutput._ossDirtyPatched = true;
    }
    // Patch handleCSV completion
    clearInterval(_patchInterval);
  }, 800);

  // Also mark dirty on data changes via interval
  setInterval(function(){
    if(data && data.length > 0) ossMarkUnsaved();
  }, 60000); // gentle reminder every 60s if data exists
})();

function ossMarkUnsaved(){
  if(_ossFileName){
    _ossUnsaved = true;
    var el = document.getElementById('oss-unsaved-dot');
    if(el) el.classList.add('visible');
  }
}

function ossMarkSaved(){
  _ossUnsaved = false;
  var el = document.getElementById('oss-unsaved-dot');
  if(el) el.classList.remove('visible');
}

function ossUpdateFileBar(name){
  _ossFileName = name;
  ossMarkSaved();
}

// ── Build the session snapshot (same structure as saveSession) ──
function ossSnapshot(){
  _dsSyncSave();
  return {
    _ossVersion: 1,
    _savedAt: new Date().toISOString(),
    _appName: 'OSS — Orias Statistik System',
    datasets: datasets,
    activeDatasetId: activeDatasetId
  };
}

// ── Restore snapshot (same as loadSession but from object) ──
function ossRestore(snap){
  if(!snap || !snap.datasets) throw new Error('Format file tidak dikenali (.oss)');
  datasets = snap.datasets;
  activeDatasetId = snap.activeDatasetId || (datasets[0] && datasets[0].id) || 1;
  _dsSyncLoad();
  updateBadges();
  renderDsSidebar();
  // Re-render current view
  if(typeof renderASub === 'function') renderASub();
  if(typeof renderOutput === 'function'){
    var el = document.getElementById('app-content');
    if(el && currentTab === 'output') renderOutput(el);
  }
}
