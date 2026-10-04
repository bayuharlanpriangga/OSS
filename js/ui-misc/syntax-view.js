// ════════════════════════════════════════════════════════════
// js/ui-misc/syntax-view.js
// Fitur (I1): tab Syntax — editor syntax ala SPSS (DESCRIPTIVES,
//   T-TEST, ONEWAY, CORRELATIONS, REGRESSION), "Auto-generated Syntax"
//   history, Save .sps, dan runner execSyntax().
// Depends on (dibaca runtime, di dalam function body — aman dimuat
//   sebelum app.js):
//   - _syntaxHistory (var di app.js; diisi oleh _genSyntaxFromOutput)
//   - SE (descriptive, validNums, tTest, onewayANOVA, tukeyHSD,
//     pearsonR, linearReg), data, numFields(), mkTable() (html-helpers.js),
//     escHtml(), showToast(), renderTab() (router.js)
// Dipanggil oleh: js/core/router.js (renderSyntax), wrapper loader
//   execSyntax di app.js (setTimeout 400ms, membungkus window.execSyntax).
// Catatan: dipindah byte-exact dari app.js (I1, 2026-10-04); tidak ada
//   perubahan logic.
// ════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════
// SYNTAX VIEW
// ════════════════════════════════════════════════════════════════════════
var synText="DESCRIPTIVES VARIABLES=score age salary\n  /STATISTICS=MEAN STDDEV MIN MAX.\n\nT-TEST GROUPS=gender(Male,Female)\n  /VARIABLES=score.\n\nONEWAY score BY group\n  /STATISTICS DESCRIPTIVES POSTHOC.\n\nCORRELATIONS\n  /VARIABLES=age score salary.\n\nREGRESSION\n  /DEPENDENT=score\n  /METHOD=enter age.";
var synResults=[];

function _loadSyntaxToEditor(syn){
  synText=syn;
  var ta=document.getElementById('syn-ta');
  if(ta){ta.value=syn;}
  showToast('Syntax berhasil dimuat');
}
function _downloadSyntax(){
  var syn=document.getElementById('syn-ta')?document.getElementById('syn-ta').value:synText;
  var blob=new Blob([syn],{type:'text/plain'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='oss_syntax.sps';
  a.click();
}
function renderSyntax(el){
  let html='<div class="grid2">';
  html+='<div style="display:flex;flex-direction:column;gap:12px">';
  html+='<div class="card"><div class="sec-hd">Syntax Editor</div>';
  html+='<textarea class="syn-area" id="syn-ta" oninput="synText=this.value">'+synText+'</textarea>';
  html+='<div class="row" style="margin-top:9px;flex-wrap:wrap;gap:6px">';
  html+='<button class="btn btn-primary btn-sm" onclick="execSyntax()" id="syn-run-btn">▶ Run All</button>';
  html+='<button class="btn btn-ghost btn-sm" onclick="_downloadSyntax()">&#8595; Save .sps</button>';
  html+='<button class="btn btn-ghost btn-sm" onclick="synResults=[];renderTab(\'syntax\')">Clear</button>';
  html+='</div>';
  html+='<div style="margin-top:10px;padding:9px 11px;background:rgba(255,255,255,.016);border-radius:7px;font-size:10.5px;color:#475569;line-height:1.9">';
  html+='<b style="color:#64748b">Commands:</b> DESCRIPTIVES &middot; T-TEST &middot; ONEWAY &middot; CORRELATIONS &middot; REGRESSION';
  html+='</div></div>';
  html+='<div class="card"><div class="sec-hd" style="display:flex;align-items:center;justify-content:space-between">Auto-generated Syntax<span style="font-size:10px;color:#64748b;font-weight:400">Tiap analisis tersimpan otomatis</span></div>';
  if(!_syntaxHistory.length){
    html+='<div style="text-align:center;padding:22px 12px;color:#334155;font-size:11.5px">Belum ada analisis dijalankan.<br><span style="color:#475569">Jalankan analisis &rarr; syntax otomatis muncul di sini.</span></div>';
  } else {
    html+='<div style="display:flex;flex-direction:column;gap:6px;max-height:260px;overflow-y:auto">';
    _syntaxHistory.forEach(function(h,i){
      html+='<div style="background:rgba(124,58,237,.07);border:1px solid rgba(124,58,237,.15);border-radius:8px;padding:8px 10px">';
      html+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">';
      html+='<span style="font-size:10.5px;font-weight:600;color:#a78bfa">'+escHtml(h.title)+'</span>';
      html+='<button onclick="_loadSyntaxToEditor(_syntaxHistory['+i+'].syntax)" style="font-size:10px;padding:2px 8px;border-radius:5px;border:1px solid rgba(124,58,237,.3);background:rgba(124,58,237,.15);color:#c084fc;cursor:pointer;font-family:Inter,sans-serif">Load to Editor</button>';
      html+='</div>';
      html+='<pre style="font-family:Fira Code,monospace;font-size:9.5px;color:#94a3b8;white-space:pre-wrap;margin:0;line-height:1.6">'+h.syntax.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</pre>';
      html+='</div>';
    });
    html+='</div>';
    html+='<button onclick="_loadSyntaxToEditor(_syntaxHistory.map(function(h){return h.syntax;}).join(\'\\n\\n\'))" style="margin-top:8px;width:100%;padding:7px;border-radius:7px;border:1px solid rgba(124,58,237,.25);background:rgba(124,58,237,.1);color:#c084fc;font-size:11.5px;cursor:pointer;font-family:Inter,sans-serif">Load All to Editor</button>';
  }
  html+='</div>';
  html+='</div>';
  html+='<div class="card"><div class="sec-hd">Output</div><div id="syn-out">';
  if(!synResults.length)html+='<div style="text-align:center;padding:36px;color:#334155;font-size:12px">Run syntax to see results.</div>';
  else synResults.forEach(item=>{
    if(item.type==='hdr')html+='<div style="font-weight:700;color:#818cf8;font-size:12px;padding-bottom:5px;border-bottom:1px solid rgba(129,140,248,.14);margin-bottom:5px">'+item.text+'</div>';
    else if(item.type==='err')html+='<div style="color:#f87171;font-size:11.5px;margin-bottom:7px"> '+item.text+'</div>';
    else if(item.type==='stats')html+='<div class="card2" style="margin-bottom:7px"><div style="font-size:10px;color:#60a5fa;font-weight:700;margin-bottom:5px">'+item.field+'</div>'+mkTable(['Stat','Value'],Object.entries(item.stats).map(([k,v])=>[k,v]))+'</div>';
    else if(item.type==='ttest')html+='<div class="card2" style="margin-bottom:7px"><div style="font-size:10px;color:#fbbf24;font-weight:700;margin-bottom:5px">'+item.text+'</div>'+mkTable(['','A','B'],[['Label',...item.labels],['Mean',item.res.meanA,item.res.meanB],['SD',item.res.sdA,item.res.sdB],['t',item.res.t,''],['df',item.res.df,''],['p',item.res.p_fmt,''],["Cohen's d",item.res.cohensD,item.res.dInterp]])+'</div>';
    else if(item.type==='anova'){html+='<div class="card2" style="margin-bottom:7px"><div style="font-size:10px;color:#f472b6;font-weight:700;margin-bottom:5px">'+item.text+'</div>'+mkTable(['Source','df','SS','MS','F','p','\u03b7\u00b2'],[['Between',item.res.dfB,item.res.ssB,item.res.msB,item.res.F,item.res.p_fmt,item.res.eta2],['Within',item.res.dfW,item.res.ssW,item.res.msW,'','','']]);if(item.posthoc)html+='<div style="font-size:10px;color:#a78bfa;margin:7px 0 4px">Tukey HSD</div>'+mkTable(['Pair','Diff','q','p','Sig'],item.posthoc.map(ph=>[ph.a+' vs '+ph.b,ph.diff,ph.q,ph.p,ph.sig?'*':'ns']));html+='</div>';}
    else if(item.type==='corr')html+='<div class="card2" style="margin-bottom:7px"><div style="font-size:10px;color:#34d399;font-weight:700;margin-bottom:5px">'+item.text+'</div>'+mkTable(['Pair','r','r\u00b2','p','Sig'],item.matrix.map(m=>m.error?[m.a+'\u00d7'+m.b,'Err',m.error,'','']:[m.a+'\u00d7'+m.b,m.r,m.r2,m.p_fmt,m.sig?'**':'ns']))+'</div>';
    else if(item.type==='reg')html+='<div class="card2" style="margin-bottom:7px"><div style="font-size:10px;color:#60a5fa;font-weight:700;margin-bottom:5px">'+item.text+'</div>'+mkTable(['','B','SE','t','p'],[['Intercept',item.res.b0,item.res.SEb0,item.res.tb0,item.res.pb0_fmt],['Slope',item.res.b1,item.res.SEb1,item.res.tb1,item.res.pb1_fmt]])+'<div style="margin-top:5px;font-size:10.5px;color:#64748b">R\u00b2='+item.res.R2+' F='+item.res.F+' p='+item.res.pF_fmt+'</div></div>';
  });
  html+='</div></div></div>';
  el.innerHTML=html;
}

async function execSyntax(){
  const btn=document.getElementById('syn-run-btn');if(btn){btn.disabled=true;btn.textContent='Running…';}
  await new Promise(r=>setTimeout(r,80));
  const syn=document.getElementById('syn-ta')?.value||synText;
  const results=[],nF=numFields();
  const descM=syn.match(/DESCRIPTIVES VARIABLES=([^\n/]+)/i);
  if(descM){const flds=descM[1].trim().split(/\s+/).filter(f=>nF.includes(f));results.push({type:'hdr',text:'► DESCRIPTIVES'});
    flds.forEach(f=>{try{const s=SE.descriptive(data.map(r=>r[f]));if(s.error)throw new Error(s.error);results.push({type:'stats',field:f,stats:s});}catch(e){results.push({type:'err',text:f+': '+e.message});}});}
  const ttM=syn.match(/T-TEST GROUPS=(\w+)\(([^,)]+),([^)]+)\)\s*\/VARIABLES=(\w+)/i);
  if(ttM){const grp=ttM[1],ga=ttM[2].trim().replace(/'/g,''),gb=ttM[3].trim().replace(/'/g,''),dv=ttM[4];
    try{const a=SE.validNums(data.filter(r=>String(r[grp])===ga).map(r=>r[dv])),b=SE.validNums(data.filter(r=>String(r[grp])===gb).map(r=>r[dv]));results.push({type:'ttest',text:'► T-TEST: '+dv+' by '+grp,res:SE.tTest(a,b),labels:[ga,gb]});}catch(e){results.push({type:'err',text:'T-TEST: '+e.message});}}
  const owM=syn.match(/ONEWAY (\w+) BY (\w+)/i);
  if(owM){const dv=owM[1],gf=owM[2];try{const gl=[...new Set(data.map(r=>r[gf]))].filter(v=>v!==null);const groups=gl.map(g=>({label:String(g),vals:SE.validNums(data.filter(r=>r[gf]===g).map(r=>r[dv]))})).filter(g=>g.vals.length>=2);const res=SE.onewayANOVA(groups);const ph=/POSTHOC/i.test(syn)?SE.tukeyHSD(groups):null;results.push({type:'anova',text:'► ONEWAY: '+dv+' by '+gf,res,posthoc:ph});}catch(e){results.push({type:'err',text:'ONEWAY: '+e.message});}}
  const corrM=syn.match(/CORRELATIONS\s+\/VARIABLES=([^\n.]+)/i);
  if(corrM){const flds=corrM[1].trim().split(/\s+/).filter(f=>nF.includes(f));const matrix=[];for(let i=0;i<flds.length;i++)for(let j=i+1;j<flds.length;j++){try{matrix.push({a:flds[i],b:flds[j],...SE.pearsonR(data.map(r=>r[flds[i]]),data.map(r=>r[flds[j]]))});}catch(e){matrix.push({a:flds[i],b:flds[j],error:e.message});}}if(matrix.length)results.push({type:'corr',text:'► CORRELATIONS',matrix});}
  const regM=syn.match(/REGRESSION\s+\/DEPENDENT=(\w+)\s+\/METHOD=\S+\s+(\w+)/i);
  if(regM){const dv=regM[1],iv=regM[2];try{results.push({type:'reg',text:'► REGRESSION: '+dv+' ~ '+iv,res:SE.linearReg(data.map(r=>r[iv]),data.map(r=>r[dv]))});}catch(e){results.push({type:'err',text:'REGRESSION: '+e.message});}}
  if(!results.length)results.push({type:'err',text:'No recognized commands found.'});
  synResults=results;renderSyntax(document.getElementById('view-syntax'));
}
