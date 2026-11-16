// SYNTAX VIEW
var synText="DESCRIPTIVES VARIABLES=score age salary\n  /STATISTICS=MEAN STDDEV MIN MAX.\n\nT-TEST GROUPS=gender(Male,Female)\n  /VARIABLES=score.\n\nONEWAY score BY group\n  /STATISTICS DESCRIPTIVES POSTHOC.\n\nCORRELATIONS\n  /VARIABLES=age score salary.\n\nREGRESSION\n  /DEPENDENT=score\n  /METHOD=enter age.";
var synResults=[];
var _syntaxHistory=window._syntaxHistory||[];
window._syntaxHistory=_syntaxHistory;

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
  html+='<div style="display:flex;flex-direction:column;gap:16px">';
  html+='<div class="card" style="margin-bottom:0"><div class="sec-hd">Syntax Editor</div>';
  html+='<textarea class="syn-area" id="syn-ta" oninput="synText=this.value">'+synText+'</textarea>';
  html+='<div class="row" style="margin-top:10px;flex-wrap:wrap;gap:8px">';
  html+='<button class="btn btn-primary btn-sm" onclick="execSyntax()" id="syn-run-btn">Jalankan Semua</button>';
  html+='<button class="btn btn-ghost btn-sm" onclick="_downloadSyntax()">Simpan .sps</button>';
  html+='<button class="btn btn-ghost btn-sm" onclick="synResults=[];renderTab(\'syntax\')">Bersihkan</button>';
  html+='</div>';
  html+='<div class="assump" style="margin-top:10px">';
  html+='<b>Perintah didukung:</b> DESCRIPTIVES, T-TEST, ONEWAY, CORRELATIONS, REGRESSION';
  html+='</div></div>';
  html+='<div class="card"><div class="sec-hd" style="justify-content:space-between"><span>Riwayat Syntax Otomatis</span><span style="font-family:var(--font-sans-stack);font-size:12px;color:var(--ink-muted);font-weight:400">Otomatis tersimpan</span></div>';
  if(!_syntaxHistory.length){
    html+='<div class="chart-empty">Belum ada analisis dijalankan. Jalankan analisis apa pun agar syntax muncul di sini.</div>';
  } else {
    html+='<div style="display:flex;flex-direction:column;gap:8px;max-height:260px;overflow-y:auto">';
    _syntaxHistory.forEach(function(h,i){
      html+='<div style="background:var(--surface);border:1px solid var(--line-soft);border-radius:var(--r-sm);padding:10px 12px">';
      html+='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">';
      html+='<span style="font-size:12.5px;font-weight:600;color:var(--ink)">'+escHtml(h.title)+'</span>';
      html+='<button class="btn btn-ghost btn-sm" onclick="_loadSyntaxToEditor(_syntaxHistory['+i+'].syntax)">Muat ke Editor</button>';
      html+='</div>';
      html+='<pre style="font-family:var(--font-mono-stack);font-size:12px;color:var(--ink-muted);white-space:pre-wrap;margin:0;line-height:1.55">'+h.syntax.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</pre>';
      html+='</div>';
    });
    html+='</div>';
    html+='<button class="btn btn-ghost btn-sm" onclick="_loadSyntaxToEditor(_syntaxHistory.map(function(h){return h.syntax;}).join(\'\\n\\n\'))" style="margin-top:8px;width:100%">Muat Semua ke Editor</button>';
  }
  html+='</div>';
  html+='</div>';
  html+='<div class="card"><div class="sec-hd">Hasil Eksekusi</div><div id="syn-out">';
  if(!synResults.length)html+='<div class="chart-empty">Jalankan syntax untuk melihat hasil analisis.</div>';
  else synResults.forEach(item=>{
    if(item.type==='hdr')html+='<div style="font-family:var(--font-serif-stack);font-weight:700;color:var(--ink);font-size:15px;padding-bottom:6px;border-bottom:1px solid var(--line);margin:10px 0 8px">'+escHtml(item.text)+'</div>';
    else if(item.type==='err')html+='<div style="color:var(--err);background:var(--err-bg);border:1px solid var(--err);border-radius:var(--r-sm);padding:6px 10px;font-size:12.5px;margin-bottom:8px">'+escHtml(item.text)+'</div>';
    else if(item.type==='stats')html+='<div class="card2" style="margin-bottom:10px"><div class="sec-hd-sub">'+escHtml(item.field)+'</div>'+mkTable(['Stat','Value'],Object.entries(item.stats).map(([k,v])=>[k,v]))+'</div>';
    else if(item.type==='ttest')html+='<div class="card2" style="margin-bottom:10px"><div class="sec-hd-sub">'+escHtml(item.text)+'</div>'+mkTable(['','A','B'],[['Label',...item.labels],['Mean',item.res.meanA,item.res.meanB],['SD',item.res.sdA,item.res.sdB],['t',item.res.t,''],['df',item.res.df,''],['p',item.res.p_fmt,''],["Cohen's d",item.res.cohensD,item.res.dInterp]])+'</div>';
    else if(item.type==='anova'){html+='<div class="card2" style="margin-bottom:10px"><div class="sec-hd-sub">'+escHtml(item.text)+'</div>'+mkTable(['Source','df','SS','MS','F','p','\u03b7\u00b2'],[['Between',item.res.dfB,item.res.ssB,item.res.msB,item.res.F,item.res.p_fmt,item.res.eta2],['Within',item.res.dfW,item.res.ssW,item.res.msW,'','','']]);if(item.posthoc)html+='<div class="sec-hd-sub">Tukey HSD</div>'+mkTable(['Pair','Diff','q','p','Sig'],item.posthoc.map(ph=>[ph.a+' vs '+ph.b,ph.diff,ph.q,ph.p,ph.sig?'*':'ns']));html+='</div>';}
    else if(item.type==='corr')html+='<div class="card2" style="margin-bottom:10px"><div class="sec-hd-sub">'+escHtml(item.text)+'</div>'+mkTable(['Pair','r','r\u00b2','p','Sig'],item.matrix.map(m=>m.error?[m.a+'\u00d7'+m.b,'Err',m.error,'','']:[m.a+'\u00d7'+m.b,m.r,m.r2,m.p_fmt,m.sig?'**':'ns']))+'</div>';
    else if(item.type==='reg')html+='<div class="card2" style="margin-bottom:10px"><div class="sec-hd-sub">'+escHtml(item.text)+'</div>'+mkTable(['','B','SE','t','p'],[['Intercept',item.res.b0,item.res.SEb0,item.res.tb0,item.res.pb0_fmt],['Slope',item.res.b1,item.res.SEb1,item.res.tb1,item.res.pb1_fmt]])+'<div style="margin-top:6px;font-size:12px;color:var(--ink-muted)">R\u00b2='+item.res.R2+', F='+item.res.F+', p='+item.res.pF_fmt+'</div></div>';
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
  synResults=results;renderSyntax(document.getElementById('app-content'));
}

// ════════════════════════════════════════════════════════════════════════
// AUTO-GENERATE SYNTAX FROM OUTPUT (dipindah dari app.js, 2026-10-04)
// ════════════════════════════════════════════════════════════════════════
function _genSyntaxFromOutput(item){
  if(!item)return null;
  var ts=new Date().toLocaleTimeString();
  var lines=['/* '+ts+' — '+(item.title||item.type)+' */'];
  var t=item.type;
  if(t==='descriptive'){
    lines.push('DESCRIPTIVES VARIABLES='+item.field);
    lines.push('  /STATISTICS=MEAN STDDEV MIN MAX SKEWNESS KURTOSIS.');
  } else if(t==='ttest'){
    lines.push('T-TEST GROUPS='+(item.grp||'')+'('+(item.ga||'')+','+(item.gb||'')+')');
    lines.push('  /VARIABLES='+(item.dv||'')+'.');
  } else if(t==='onesamp'){
    lines.push('T-TEST');
    lines.push('  /TESTVAL='+(item.mu||0));
    lines.push('  /VARIABLES='+(item.dv||'')+'.');
  } else if(t==='paired'){
    lines.push('T-TEST PAIRS='+(item.a||'')+' WITH '+(item.b||'')+'.');
  } else if(t==='anova'){
    lines.push('ONEWAY '+(item.dv||'')+' BY '+(item.grp||''));
    lines.push('  /STATISTICS DESCRIPTIVES POSTHOC.');
  } else if(t==='anova2'||t==='anova3'){
    var ivs=((item.ivs||[]).join(' '));
    lines.push('UNIANOVA '+(item.dv||'')+' BY '+ivs);
    lines.push('  /METHOD=SSTYPE(3)');
    lines.push('  /PRINT DESCRIPTIVE ETASQ.');
  } else if(t==='correlation'){
    var flds=((item.fields||[item.x,item.y]).filter(Boolean));
    lines.push('CORRELATIONS');
    lines.push('  /VARIABLES='+flds.join(' ')+'.');
  } else if(t==='regression'){
    lines.push('REGRESSION');
    lines.push('  /DEPENDENT='+(item.y||''));
    lines.push('  /METHOD=ENTER '+(item.x||'')+'.');
  } else if(t==='multipleReg'){
    lines.push('REGRESSION');
    lines.push('  /DEPENDENT='+(item.y||''));
    lines.push('  /METHOD=ENTER '+((item.xs||[]).join(' '))+'.');
  } else if(t==='logistic'){
    lines.push('LOGISTIC REGRESSION '+(item.y||''));
    lines.push('  /METHOD=ENTER '+((item.xs||[]).join(' '))+'.');
  } else { return null; }
  return lines.join('\n');
}

