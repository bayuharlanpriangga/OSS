// ════════════════════════════════════════════════════════════
// js/export/export-dialog.js
// Fitur: Per-Output Export Dialog (G4) — dialog pilihan mode export
// per satu output (Text&Table / Chart / Both), plus tombol pintas
// "Export Semua Output".
// Depends on: outputs[] (dataset-manager.js), escHtml() (app.js,
// dibaca runtime), document (global), _exportSingleOutput() (G1,
// js/export/export-word.js — dimuat sebelum file ini), exportWordDialog()
// (G5, masih di app.js saat ini — dipanggil runtime dari dalam onclick,
// aman meski app.js dimuat sesudah file ini).
// ════════════════════════════════════════════════════════════
function _exportOutputDialog(id){
  var o=outputs.find(function(x){return x.id===id;});
  if(!o) return;

  // Detect if this output has chart(s)
  var hasChart=false;
  var chartTypes=[];
  if(o.type==='descriptive'){hasChart=true;chartTypes=['Histogram','Normal Q-Q Plot'];}
  else if(o.type==='ttest'||o.type==='anova'||o.type==='nonparametric'){hasChart=true;chartTypes=['Boxplot'];}
  else if(o.type==='paired'||o.type==='correlation'||o.type==='regression'||o.type==='multipleReg'){hasChart=true;chartTypes=['Scatter Plot'];}
  else if(o.type==='rmanova'){hasChart=true;chartTypes=['Profile Plot'];}
  else if(o.type==='timeseries'){hasChart=true;chartTypes=['Time Series Plot'];}

  // Remove any existing dialog
  var ex=document.getElementById('_exp-dialog');
  if(ex) ex.remove();

  // Build dialog
  var overlay=document.createElement('div');
  overlay.id='_exp-dialog';
  overlay.style.cssText='position:fixed;inset:0;z-index:9900;background:rgba(5,1,14,.82);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px';

  var box=document.createElement('div');
  box.style.cssText='background:linear-gradient(135deg,rgba(20,8,40,.98),rgba(14,6,24,.99));border:1px solid rgba(192,132,252,.3);border-radius:18px;padding:24px;width:100%;max-width:380px;box-shadow:0 20px 60px rgba(0,0,0,.8)';

  // Header
  box.innerHTML='<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">'
    +'<span style="font-size:18px">⬇</span>'
    +'<div style="font-size:15px;font-weight:700;color:#e8deff;font-family:Playfair Display,serif;font-style:italic">Export to Word</div>'
    +'</div>'
    +'<div style="font-size:11.5px;color:rgba(232,222,255,.45);margin-bottom:18px;padding-left:28px">'+escHtml(o.title)+'</div>';

  // Option cards
  var opts=[
    {
      mode:'table',
      icon:'📋',
      label:'Text & Table Only',
      desc:'Ringkasan statistik + tabel hasil — tanpa diagram',
      always:true
    },
    {
      mode:'chart',
      icon:'📊',
      label:'Diagram/Chart Only',
      desc:'Hanya diagram grafis — tanpa tabel statistik',
      always:false
    },
    {
      mode:'both',
      icon:'📄',
      label:'Text, Table & Chart',
      desc:'Lengkap: ringkasan + tabel + diagram',
      always:false
    }
  ];

  var optWrap=document.createElement('div');
  optWrap.style.cssText='display:flex;flex-direction:column;gap:8px;margin-bottom:20px';

  opts.forEach(function(opt){
    var available=opt.always||hasChart;
    var btn=document.createElement('div');
    btn.style.cssText='display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:11px;border:1px solid '
      +(available?'rgba(192,132,252,.22)':'rgba(255,255,255,.06)')+';cursor:'
      +(available?'pointer':'not-allowed')+';background:'
      +(available?'rgba(124,58,237,.06)':'rgba(255,255,255,.02)')+';transition:.15s;opacity:'+(available?'1':'.38');
    if(available){
      btn.onmouseover=function(){this.style.background='rgba(124,58,237,.15)';this.style.borderColor='rgba(192,132,252,.45)';};
      btn.onmouseout=function(){this.style.background='rgba(124,58,237,.06)';this.style.borderColor='rgba(192,132,252,.22)';};
      btn.onclick=function(){overlay.remove();_exportSingleOutput(id,opt.mode);};
    }
    btn.innerHTML='<div style="font-size:22px;flex-shrink:0">'+opt.icon+'</div>'
      +'<div><div style="font-size:12.5px;font-weight:700;color:'+(available?'#e8deff':'rgba(232,222,255,.3)')+'">'+opt.label+'</div>'
      +'<div style="font-size:10.5px;color:'+(available?'rgba(232,222,255,.45)':'rgba(232,222,255,.2)')+'">'+opt.desc+'</div>'
      +((!available)?' <div style="font-size:9.5px;color:#fbbf24;margin-top:3px">⚠ Analisis ini tidak memiliki diagram</div>':'')
      +(available&&opt.mode!=='table'&&hasChart?' <div style="font-size:9.5px;color:#a78bfa;margin-top:2px">Chart: '+chartTypes.join(', ')+'</div>':'')
      +'</div>';
    optWrap.appendChild(btn);
  });

  box.appendChild(optWrap);

  // Export All button
  var allRow=document.createElement('div');
  allRow.style.cssText='display:flex;gap:8px;border-top:1px solid rgba(192,132,252,.1);padding-top:14px';

  var cancelBtn=document.createElement('button');
  cancelBtn.textContent='Batal';
  cancelBtn.style.cssText='flex:1;padding:9px;border-radius:8px;border:1px solid rgba(124,58,237,.25);background:transparent;color:rgba(232,222,255,.55);font-size:12.5px;cursor:pointer;font-family:Inter,sans-serif;font-weight:600';
  cancelBtn.onclick=function(){overlay.remove();};

  var exportAllBtn=document.createElement('button');
  exportAllBtn.textContent='⬇ Export Semua Output';
  exportAllBtn.style.cssText='flex:2;padding:9px;border-radius:8px;border:none;background:rgba(124,58,237,.18);color:#c084fc;font-size:12px;cursor:pointer;font-family:Inter,sans-serif;font-weight:600;border:1px solid rgba(124,58,237,.3)';
  exportAllBtn.onmouseover=function(){this.style.background='rgba(124,58,237,.3)';};
  exportAllBtn.onmouseout=function(){this.style.background='rgba(124,58,237,.18)';};
  exportAllBtn.onclick=function(){overlay.remove();exportWordDialog();};

  allRow.appendChild(cancelBtn);
  allRow.appendChild(exportAllBtn);
  box.appendChild(allRow);

  overlay.appendChild(box);
  overlay.addEventListener('click',function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}
