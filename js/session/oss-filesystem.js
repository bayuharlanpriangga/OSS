
var _ossFileHandle = null;       // File System Access API handle (if granted)
var _ossFileName   = null;       // current open filename (display only)

// SAVE TO FILE
async function saveToFile(){
  try {
    var snap = ossSnapshot();
    var json = JSON.stringify(snap, null, 2);
    var blob = new Blob([json], {type: 'application/json'});

    // ── Path A: File System Access API (Chrome/Edge — dapat pilih folder & nama) ──
    if(window.showSaveFilePicker){
      try {
        // If we already have a handle for this file, overwrite directly (Ctrl+S behavior)
        var handle = _ossFileHandle;
        if(!handle){
          handle = await window.showSaveFilePicker({
            suggestedName: (_ossFileName || 'penelitian') + '.oss',
            types: [{
              description: 'OSS Research File',
              accept: {'application/json': ['.oss']}
            }]
          });
        }
        var writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        _ossFileHandle = handle;
        ossUpdateFileBar(handle.name);
        showToast('File berhasil disimpan');
        return;
      } catch(err){
        if(err.name === 'AbortError') return; // user cancelled
        // Fall through to download fallback
      }
    }

    // ── Path B: Fallback — trigger browser download (semua browser) ──
    var fname = (_ossFileName || 'penelitian-oss-' + new Date().toLocaleDateString('id').replace(/\//g,'-')) + '.oss';
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = fname;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 2000);
    if(!_ossFileName) _ossFileName = fname;
    ossUpdateFileBar(fname);
    showToast('File berhasil diunduh');

  } catch(e){
    showToast('Gagal menyimpan: ' + e.message, 'error');
  }
}

// ── Save-As: always opens picker (ignore existing handle) ──
async function saveToFileAs(){
  _ossFileHandle = null; // force new picker
  await saveToFile();
}


// IMPORT / OPEN FILE
async function importFromFile(){
  // Warn user if there's unsaved local data
  var hasCurrent = (data && data.length > 0) || (outputs && outputs.length > 0);
  if(hasCurrent){
    var proceed = await new Promise(function(resolve){
      ossDialog({
        icon: '📂',
        title: 'Buka File Penelitian',
        msg: 'Sesi yang sedang aktif akan digantikan oleh file yang dibuka.\n\nData di browser (localStorage) tetap aman dan tidak hilang — hanya tampilan yang akan beralih ke file yang diimport.',
        inputs: [],
        buttons: [
          {label: 'Batal', val: false, ghost: true},
          {label: 'Lanjut, Buka File', val: true}
        ]
      }).then(resolve);
    });
    if(!proceed) return;
  }

  try {
    // ── Path A: File System Access API ──
    if(window.showOpenFilePicker){
      try {
        var handles = await window.showOpenFilePicker({
          types: [{
            description: 'OSS Research File',
            accept: {'application/json': ['.oss'], 'application/octet-stream': ['.oss']}
          }],
          multiple: false
        });
        if(!handles || !handles.length) return;
        var handle = handles[0];
        var file   = await handle.getFile();
        var text   = await file.text();
        var snap   = JSON.parse(text);
        ossRestore(snap);
        _ossFileHandle = handle;
        ossUpdateFileBar(handle.name);
        showToast('File berhasil dibuka');
        return;
      } catch(err){
        if(err.name === 'AbortError') return;
        // Fall through to input fallback
      }
    }

    // ── Path B: Fallback — hidden <input type="file"> ──
    document.getElementById('oss-import-input').click();

  } catch(e){
    showToast('Gagal membuka file: ' + e.message, 'error');
  }
}

// Called by the hidden <input> fallback
function handleOSSImport(evt){
  var file = evt.target.files && evt.target.files[0];
  evt.target.value = ''; // reset so same file can be re-opened
  if(!file) return;
  var reader = new FileReader();
  reader.onload = function(e){
    try {
      var snap = JSON.parse(e.target.result);
      ossRestore(snap);
      _ossFileHandle = null; // no handle in fallback mode
      ossUpdateFileBar(file.name);
      showToast('File berhasil dibuka');
    } catch(err){
      showToast('Format file tidak valid: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
}

// Also patch the menu-item 'Save Session' to use saveToFile
(function(){
  setTimeout(function(){
    // The context menu 'Save Session' label → redirect to saveToFile
    if(window.saveSession){
      var _orig = window.saveSession;
      window.saveSession = function(){
        // Still save to localStorage (backup), then also trigger file save
        _orig();
        // Don't auto-trigger file picker on autosave
      };
    }
  }, 1000);
})();
