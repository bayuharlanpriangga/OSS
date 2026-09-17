// CUSTOM SELECT — MODAL BOTTOM SHEET
var _cR={};  // registry: id -> {fields,current,onChange,showBadge,label}
var _cActive=null;

function varBdg(f){
  const v=vars.find(x=>x.name===f);if(!v)return '';
  const col=v.measure==='Nominal'?'#f472b6':v.measure==='Ordinal'?'#a78bfa':'#60a5fa';
  const txt=v.measure==='Nominal'?'cat':v.measure==='Ordinal'?'ord':'num';
  return '<span class="csel-bdg" style="background:'+col+'22;color:'+col+'">'+txt+'</span>';
}

function mkCsel(id,fields,current,onChange,lbl='',showBadge=false){
  const disp=current||fields[0]||'—';
  _cR[id]={fields,current:disp,onChange,showBadge,label:lbl};
  const bdg=showBadge?varBdg(disp):'';
  return (lbl?'<label class="lbl">'+escHtml(lbl)+'</label>':'')+
    '<div class="csel-wrap" id="cw-'+id+'">'+
      '<div class="csel-trigger" onclick="openCselById(\''+id+'\')">'+
        '<span class="csel-val" id="cv-'+id+'">'+escHtml(disp)+'</span>'+bdg+
        '<span class="csel-arrow">▾</span>'+
      '</div>'+
    '</div>';
}
function mkSelect(id,fields,current,onchange,lbl=''){
  return mkCsel(id,fields,current,onchange.replace(/this\.value/g,'val'),lbl,true);
}

function openCselById(id){
  const cfg=_cR[id];if(!cfg)return;
  _cActive={id,...cfg};
  const modal=document.getElementById('csel-modal');
  const titleEl=document.getElementById('csel-title');
  const srch=document.getElementById('csel-srch');
  const inp=document.getElementById('csel-inp');
  if(!modal)return;
  if(titleEl)titleEl.textContent=cfg.label||'Select option';
  var showSrch=!cfg.noSearch&&cfg.fields.length>6;
  if(srch)srch.style.display=showSrch?'block':'none';
  if(inp)inp.value='';
  _buildCselList(cfg.fields,cfg.current,cfg.onChange,cfg.showBadge,'');
  modal.classList.add('open');
  if(showSrch&&inp)setTimeout(()=>inp.focus(),120);
}
function _buildCselList(fields,current,onChange,showBadge,filter){
  const list=document.getElementById('csel-list');if(!list)return;
  const filtered=filter?fields.filter(f=>f.toLowerCase().includes(filter.toLowerCase())):fields;
  list.innerHTML='';
  filtered.forEach(f=>{
    const d=document.createElement('div');
    d.className='csel-opt'+(f===current?' selected':'');
    const chk='<span class="csel-opt-check">'+(f===current?'✓':'')+'</span>';
    d.innerHTML=chk+'<span style="flex:1">'+f+'</span>'+(showBadge?varBdg(f):'');
    d.onclick=()=>{
      const id=_cActive?.id;
      const valEl=document.getElementById('cv-'+id);
      if(valEl){valEl.textContent=f;}
      // Update badge in trigger
      const wrap=document.getElementById('cw-'+id);
      if(wrap&&showBadge){
        const trig=wrap.querySelector('.csel-trigger');
        const oldBdg=trig?.querySelector('.csel-bdg');
        if(oldBdg)oldBdg.outerHTML=varBdg(f);
      }
      if(id&&_cR[id])_cR[id].current=f;
      try{(new Function('val',onChange))(f);}catch(ex){console.warn(ex);}
      closeCsel();
    };
    list.appendChild(d);
  });
  if(!filtered.length)list.innerHTML='<div style="padding:22px;text-align:center;color:#475569;font-size:13px">No options found</div>';
}
function filterCsel(q){
  if(!_cActive)return;
  _buildCselList(_cActive.fields,_cActive.current,_cActive.onChange,_cActive.showBadge,q);
}
function closeCsel(){
  const m=document.getElementById('csel-modal');if(m)m.classList.remove('open');
  _cActive=null;
}
// openOptCselById — seperti openCselById tapi pakai label sebagai display,
// dan onChange sudah di-bake pakai _vals dari mkOptCsel
function openOptCselById(id){
  const cfg=_cR[id];if(!cfg)return;
  _cActive={id,...cfg};
  const modal=document.getElementById('csel-modal');
  const titleEl=document.getElementById('csel-title');
  const srch=document.getElementById('csel-srch');
  const inp=document.getElementById('csel-inp');
  if(!modal)return;
  if(titleEl)titleEl.textContent=cfg.label||'Select option';
  var showSrch=!cfg.noSearch&&cfg.fields.length>6;
  if(srch)srch.style.display=showSrch?'block':'none';
  if(inp)inp.value='';
  _buildCselList(cfg.fields,cfg.current,cfg.onChange,false,'');
  modal.classList.add('open');
  if(showSrch&&inp)setTimeout(()=>inp.focus(),120);
}

// mkOptCsel — global helper untuk csel picker dengan arbitrary label/value pairs
// pairs = [{val, label}, ...], currentVal = current value (not label)
function mkOptCsel(id, pairs, currentVal, onChangeTpl, lbl, noSearch){
  var disp='';
  pairs.forEach(function(p){if(String(p.val)===String(currentVal))disp=p.label;});
  if(!disp&&pairs.length) disp=pairs[0].label;
  _cR[id]={
    fields: pairs.map(function(p){return p.label;}),
    _vals:  pairs.map(function(p){return p.val;}),
    current: disp,
    onChange: onChangeTpl,
    showBadge: false,
    label: lbl||'',
    noSearch: noSearch||false
  };
  return (lbl?'<label class="lbl">'+escHtml(lbl)+'</label>':'')+
    '<div class="csel-wrap" id="cw-'+id+'" style="margin-top:5px">'+
      '<div class="csel-trigger" onclick="openOptCselById(\''+id+'\')">'+
        '<span class="csel-val" id="cv-'+id+'">'+escHtml(disp)+'</span>'+
        '<span class="csel-arrow">&#x25be;</span>'+
      '</div>'+
    '</div>';
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeCsel();closeCmd();}});
