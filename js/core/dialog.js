// ════════════════════════════════════════════════════════════
// js/core/dialog.js
// Fitur: OSS Dialog Engine — pengganti confirm()/alert()/prompt() browser native
// Depends on: elemen #oss-dialog-overlay dkk di index.html
// ════════════════════════════════════════════════════════════
// ── OSS Dialog Engine ──────────────────────────────────────
function escDlg(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function ossDialog(cfg){
  var ov=document.getElementById('oss-dialog-overlay');
  var box=document.getElementById('oss-dialog-box');
  var iconEl=document.getElementById('oss-dialog-icon');
  var titleEl=document.getElementById('oss-dialog-title');
  var msgEl=document.getElementById('oss-dialog-msg');
  var inputWrap=document.getElementById('oss-dialog-input-wrap');
  var inputEl=document.getElementById('oss-dialog-input');
  var cancelBtn=document.getElementById('oss-dialog-cancel');
  var okBtn=document.getElementById('oss-dialog-ok');
  if(!ov) return;

  var icons={
    add:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
    delete:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>',
    rename:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'
  };
  iconEl.innerHTML=icons[cfg.type]||'<span>●</span>';
  iconEl.className='';
  iconEl.id='oss-dialog-icon';
  iconEl.classList.add('icon-'+cfg.type);

  titleEl.textContent=cfg.title||'Confirm';
  msgEl.innerHTML=cfg.msg||'';

  var hasInput=cfg.inputVal!==undefined;
  inputWrap.style.display=hasInput?'block':'none';
  if(hasInput){
    inputEl.value=cfg.inputVal||'';
    inputEl.placeholder=cfg.inputPlaceholder||'';
  }

  okBtn.textContent=cfg.okLabel||'OK';
  okBtn.className='dlg-btn-ok ok-'+(cfg.type||'add');

  // Clean old listeners
  var newOk=okBtn.cloneNode(true);
  var newCancel=cancelBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newOk,okBtn);
  cancelBtn.parentNode.replaceChild(newCancel,cancelBtn);

  function closeDlg(){ov.classList.remove('open');}
  newCancel.onclick=closeDlg;
  ov.onclick=function(e){if(e.target===ov)closeDlg();};
  newOk.onclick=function(){
    var val=hasInput?document.getElementById('oss-dialog-input').value:'';
    closeDlg();
    if(cfg.onOk) cfg.onOk(val);
  };

  ov.classList.add('open');
  if(hasInput){
    setTimeout(function(){
      var inp=document.getElementById('oss-dialog-input');
      if(inp){inp.focus();inp.select();}
    },120);
  }

  // Enter key submits
  document.getElementById('oss-dialog-input') && (document.getElementById('oss-dialog-input').onkeydown=function(e){
    if(e.key==='Enter'){newOk.click();}
    if(e.key==='Escape'){closeDlg();}
  });
}
