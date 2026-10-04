var aiHistory=[];   // [{role:'user'|'assistant', content, err?:true}]
var _aiBusy=false;
var _aiSettingsOpen=null; // null = otomatis (terbuka jika belum ada key)

var AI_PROVIDERS={
  anthropic:{name:'Claude (Anthropic)',short:'Claude',color:'#e08a6d',models:['claude-sonnet-5-5','claude-haiku-4-5-20251001','claude-opus-5-5'],ph:'sk-ant-…'},
  openai:{name:'OpenAI (GPT)',short:'OpenAI',color:'#34d399',models:['gpt-4o-mini','gpt-4o'],ph:'sk-…'},
  gemini:{name:'Google Gemini',short:'Gemini',color:'#60a5fa',models:['gemini-2.5-flash','gemini-2.5-pro'],ph:'AIza…'},
  groq:{name:'Groq',short:'Groq',color:'#fb923c',models:['llama-3.3-70b-versatile','llama-3.1-8b-instant'],ph:'gsk_…'},
  openrouter:{name:'OpenRouter',short:'OpenRouter',color:'#a78bfa',models:['openrouter/auto'],ph:'sk-or-…'},
  xai:{name:'xAI (Grok)',short:'xAI',color:'#e2e8f0',models:['grok-3-mini','grok-3'],ph:'xai-…'},
  perplexity:{name:'Perplexity',short:'Perplexity',color:'#22d3ee',models:['sonar','sonar-pro'],ph:'pplx-…'}
};
var AI_ENDPOINTS={
  anthropic:'https://api.anthropic.com/v1/messages',
  openai:'https://api.openai.com/v1/chat/completions',
  groq:'https://api.groq.com/openai/v1/chat/completions',
  openrouter:'https://openrouter.ai/api/v1/chat/completions',
  xai:'https://api.x.ai/v1/chat/completions',
  perplexity:'https://api.perplexity.ai/chat/completions'
};

// ── Storage (localStorage, semua dibungkus try/catch) ──
function _aiLoad(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def;}catch(e){return def;}}
function _aiSave(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){return false;}}
function aiGetKeys(){var a=_aiLoad('oss_ai_keys',[]);return Array.isArray(a)?a.filter(function(x){return x&&x.id&&x.key&&AI_PROVIDERS[x.provider];}):[];}
function aiGetActive(){
  var ks=aiGetKeys(),id=_aiLoad('oss_ai_active',null);
  return ks.find(function(k){return k.id===id;})||ks[0]||null;
}
function aiGetModel(p){var m=_aiLoad('oss_ai_models',{});return (m&&m[p])||AI_PROVIDERS[p].models[0];}
function aiSetModel(val){
  var a=aiGetActive();if(!a)return;
  val=String(val||'').trim();if(!val)return;
  var m=_aiLoad('oss_ai_models',{});if(!m||typeof m!=='object')m={};
  m[a.provider]=val;_aiSave('oss_ai_models',m);
  renderTab('ai');
}

// ── Deteksi provider dari format key ──
function aiDetectProvider(k){
  k=String(k||'').trim();
  if(/^sk-ant-/.test(k))return 'anthropic';
  if(/^sk-or-/.test(k))return 'openrouter';
  if(/^AIza/.test(k))return 'gemini';
  if(/^gsk_/.test(k))return 'groq';
  if(/^xai-/.test(k))return 'xai';
  if(/^pplx-/.test(k))return 'perplexity';
  if(/^sk-/.test(k))return 'openai';
  return null;
}
function _aiMask(k){return k.length>12?k.slice(0,6)+'…'+k.slice(-4):'••••'+k.slice(-2);}

// ── Kelola key ──
function aiOnKeyInput(){
  var inp=document.getElementById('ai-key-inp'),out=document.getElementById('ai-detect');
  if(!inp||!out)return;
  var p=aiDetectProvider(inp.value);
  if(!inp.value.trim())out.innerHTML='';
  else if(p)out.innerHTML='<span style="color:'+AI_PROVIDERS[p].color+'">✓ Terdeteksi: '+escHtml(AI_PROVIDERS[p].name)+'</span>';
  else out.innerHTML='<span style="color:#fbbf24">Format tidak dikenali — pilih provider manual</span>';
}
function aiAddKey(){
  var inp=document.getElementById('ai-key-inp'),sel=document.getElementById('ai-prov-sel');
  var key=inp?inp.value.trim():'';
  if(!key){showToast('Tempel API key dulu','error');return;}
  if(/\s/.test(key)){showToast('API key tidak boleh mengandung spasi','error');return;}
  var prov=(sel&&sel.value&&sel.value!=='auto')?sel.value:aiDetectProvider(key);
  if(!prov){showToast('Provider tidak dikenali — pilih manual di dropdown','error');return;}
  var ks=aiGetKeys();
  var dup=ks.find(function(k){return k.key===key;});
  if(dup){_aiSave('oss_ai_active',dup.id);showToast('Key sudah ada — dijadikan aktif');renderTab('ai');return;}
  var id='k'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  ks.push({id:id,provider:prov,key:key,addedAt:Date.now()});
  if(!_aiSave('oss_ai_keys',ks)){showToast('Gagal menyimpan key (localStorage diblokir?)','error');return;}
  _aiSave('oss_ai_active',id);
  _aiSettingsOpen=true; // tetap terbuka supaya key baru terlihat di daftar
  showToast('Key '+AI_PROVIDERS[prov].short+' ditambahkan');
  renderTab('ai');
}
function aiSetActive(id){_aiSave('oss_ai_active',id);renderTab('ai');}
function aiDeleteKey(id){
  var ks=aiGetKeys().filter(function(k){return k.id!==id;});
  _aiSave('oss_ai_keys',ks);
  var act=_aiLoad('oss_ai_active',null);
  if(act===id)_aiSave('oss_ai_active',ks[0]?ks[0].id:null);
  showToast('Key dihapus');
  renderTab('ai');
}
function aiClearAllKeys(){
  if(!confirm('Hapus SEMUA API key dari browser ini?'))return;
  try{localStorage.removeItem('oss_ai_keys');localStorage.removeItem('oss_ai_active');}catch(e){}
  showToast('Semua key dihapus');
  renderTab('ai');
}
function aiToggleSettings(){
  var cur=_aiSettingsOpen===null?!aiGetActive():_aiSettingsOpen;
  _aiSettingsOpen=!cur;
  renderTab('ai');
}
async function aiTestKey(id){
  var k=aiGetKeys().find(function(x){return x.id===id;});if(!k)return;
  showToast('Menguji key '+AI_PROVIDERS[k.provider].short+'…');
  try{
    await aiCall(k.provider,k.key,aiGetModel(k.provider),'Reply with the single word OK.',[{role:'user',content:'ping'}],16);
    showToast('Key '+AI_PROVIDERS[k.provider].short+' valid ✓');
  }catch(e){showToast(e.message,'error');}
}

// ── Panggilan API per provider ──
function _aiHttpError(status,json){
  var d=json&&(json.error&&(json.error.message||json.error)||json.message);
  d=typeof d==='string'?d:'';
  if(status===401||status===403)return 'Key ditolak ('+status+'). Periksa key / izin akses model. '+d;
  if(status===404)return 'Model tidak ditemukan (404). Ganti nama model. '+d;
  if(status===429)return 'Rate limit / kuota habis (429). Tunggu sebentar atau ganti key. '+d;
  if(status>=500)return 'Server provider bermasalah ('+status+'). Coba lagi nanti. '+d;
  return 'Error '+status+'. '+d;
}
async function aiCall(prov,key,model,system,msgs,maxTok){
  maxTok=maxTok||1500;
  var ctl=new AbortController(),timer=setTimeout(function(){ctl.abort();},60000);
  var url,headers={'Content-Type':'application/json'},body;
  if(prov==='anthropic'){
    url=AI_ENDPOINTS.anthropic;
    headers['x-api-key']=key;headers['anthropic-version']='2023-06-01';
    headers['anthropic-dangerous-direct-browser-access']='true';
    body={model:model,max_tokens:maxTok,system:system,messages:msgs};
  }else if(prov==='gemini'){
    url='https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent';
    headers['x-goog-api-key']=key;
    body={systemInstruction:{parts:[{text:system}]},
      contents:msgs.map(function(m){return {role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]};}),
      generationConfig:{maxOutputTokens:maxTok}};
  }else{
    url=AI_ENDPOINTS[prov];
    headers['Authorization']='Bearer '+key;
    body={model:model,messages:[{role:'system',content:system}].concat(msgs)};
    if(prov==='openai')body.max_completion_tokens=maxTok;else body.max_tokens=maxTok;
  }
  var res,json=null;
  try{
    res=await fetch(url,{method:'POST',headers:headers,body:JSON.stringify(body),signal:ctl.signal});
    try{json=await res.json();}catch(e){json=null;}
  }catch(e){
    clearTimeout(timer);
    if(e&&e.name==='AbortError')throw new Error('Timeout: provider tidak merespons dalam 60 detik.');
    throw new Error('Gagal terhubung ke '+AI_PROVIDERS[prov].short+'. Periksa internet, atau provider memblokir akses langsung dari browser (CORS).');
  }
  clearTimeout(timer);
  if(!res.ok)throw new Error(_aiHttpError(res.status,json));
  var text='';
  if(prov==='anthropic'){
    text=(json&&json.content||[]).map(function(c){return c.text||'';}).join('');
  }else if(prov==='gemini'){
    var c0=json&&json.candidates&&json.candidates[0];
    text=c0&&c0.content&&c0.content.parts?c0.content.parts.map(function(p){return p.text||'';}).join(''):'';
    if(!text&&json&&json.promptFeedback&&json.promptFeedback.blockReason)throw new Error('Diblokir provider: '+json.promptFeedback.blockReason);
  }else{
    var ct=json&&json.choices&&json.choices[0]&&json.choices[0].message&&json.choices[0].message.content;
    text=Array.isArray(ct)?ct.map(function(p){return p.text||'';}).join(''):(ct||'');
  }
  if(!text.trim())throw new Error('Provider mengembalikan jawaban kosong. Coba ganti model.');
  return text;
}

// Susun pesan untuk API: buang entri error/gagal, gabung role berurutan, mulai dari user
function _aiBuildMsgs(){
  var out=[];
  aiHistory.forEach(function(m){
    if(m.err||m.failed)return;
    var last=out[out.length-1];
    if(last&&last.role===m.role)last.content+='\n\n'+m.content;
    else out.push({role:m.role,content:m.content});
  });
  while(out.length&&out[0].role!=='user')out.shift();
  return out;
}

// ── Tampilan ──
function renderAI(el){
  var act=aiGetActive(),ks=aiGetKeys();
  var open=_aiSettingsOpen===null?!act:_aiSettingsOpen;
  var html='<div class="card">';
  html+='<div class="sec-hd">Orias AI ';
  if(act)html+='<span class="tag tag-purple" style="margin-left:auto;font-size:9px;color:'+AI_PROVIDERS[act.provider].color+'">'+escHtml(AI_PROVIDERS[act.provider].short)+' · '+escHtml(aiGetModel(act.provider))+'</span>';
  else html+='<span class="tag" style="margin-left:auto;font-size:9px;color:#fbbf24;border:1px solid rgba(251,191,36,.3)">Belum ada API key</span>';
  html+='<button class="btn btn-ghost btn-sm" style="margin-left:8px" onclick="aiToggleSettings()">⚙ API Key</button></div>';
  html+='<div style="font-size:11.5px;color:#475569;margin-bottom:10px">Test selection · Assumption checking · Interpretation</div>';

  if(open){
    html+='<div class="card2" style="margin-bottom:12px;padding:12px">';
    html+='<div style="font-size:11px;color:#94a3b8;line-height:1.7;margin-bottom:10px">';
    html+='<b style="color:#c084fc">BYOK</b> — pakai API key milikmu sendiri. Key disimpan <b>hanya di browser ini</b> (localStorage) dan dikirim langsung ke provider pilihanmu. Hanya pertanyaan, nama/tipe variabel, jumlah kasus &amp; missing yang ikut dikirim — <b>bukan isi datamu</b>. Jangan simpan key di komputer umum.</div>';
    html+='<div class="row" style="gap:7px;flex-wrap:wrap;align-items:center">';
    html+='<input class="inp" id="ai-key-inp" type="password" autocomplete="off" spellcheck="false" style="flex:1;min-width:180px" placeholder="Tempel API key (sk-ant-…, sk-…, AIza…, gsk_…, xai-…, pplx-…)" oninput="aiOnKeyInput()" onkeydown="if(event.key===\'Enter\')aiAddKey()"/>';
    html+='<select class="inp" id="ai-prov-sel" style="width:auto"><option value="auto">Auto-detect</option>';
    Object.keys(AI_PROVIDERS).forEach(function(p){html+='<option value="'+p+'">'+escHtml(AI_PROVIDERS[p].name)+'</option>';});
    html+='</select>';
    html+='<button class="btn btn-purple btn-sm" onclick="aiAddKey()">+ Tambah</button>';
    html+='</div><div id="ai-detect" style="font-size:10.5px;margin:6px 0 2px;min-height:14px"></div>';
    if(ks.length){
      html+='<div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">';
      ks.forEach(function(k){
        var P=AI_PROVIDERS[k.provider],on=act&&act.id===k.id;
        html+='<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:7px 9px;border-radius:8px;border:1px solid '+(on?'rgba(124,58,237,.55)':'rgba(124,58,237,.15)')+';background:'+(on?'rgba(124,58,237,.12)':'rgba(255,255,255,.015)')+'">';
        html+='<span style="font-size:11px;font-weight:700;color:'+P.color+';min-width:78px">'+escHtml(P.short)+'</span>';
        html+='<span style="font-family:Fira Code,monospace;font-size:10.5px;color:#94a3b8;flex:1;min-width:100px">'+escHtml(_aiMask(k.key))+'</span>';
        if(on)html+='<span class="tag tag-purple" style="font-size:9px">AKTIF</span>';
        else html+='<button class="btn btn-ghost btn-sm" onclick="aiSetActive(\''+k.id+'\')">Pakai</button>';
        html+='<button class="btn btn-ghost btn-sm" onclick="aiTestKey(\''+k.id+'\')">Tes</button>';
        html+='<button class="btn btn-ghost btn-sm" style="color:#f87171" onclick="aiDeleteKey(\''+k.id+'\')">Hapus</button>';
        html+='</div>';
      });
      html+='</div>';
      if(act){
        html+='<div class="row" style="gap:8px;margin-top:10px;align-items:center;flex-wrap:wrap"><label class="lbl" style="margin:0">Model ('+escHtml(AI_PROVIDERS[act.provider].short)+')</label>';
        html+='<input class="inp" list="ai-models-dl" style="flex:1;min-width:180px" value="'+escHtml(aiGetModel(act.provider))+'" onchange="aiSetModel(this.value)" placeholder="nama model"/>';
        html+='<datalist id="ai-models-dl">'+AI_PROVIDERS[act.provider].models.map(function(m){return '<option value="'+escHtml(m)+'">';}).join('')+'</datalist></div>';
        html+='<div style="font-size:10px;color:#475569;margin-top:4px">Nama model bisa diketik bebas — daftar hanya saran dan bisa berubah di sisi provider.</div>';
      }
      html+='<div style="margin-top:10px"><button class="btn btn-ghost btn-sm" style="color:#f87171" onclick="aiClearAllKeys()">Hapus semua key</button></div>';
    }
    html+='</div>';
  }

  html+='<div class="quick-prompts">';
  ['Which test should I use?','Check T-Test assumptions','When nonparametric?','Interpret α=0.72','Handle missing data?','What does R²=0.65 mean?','Effect size guide','Pearson vs Spearman?'].forEach(function(q){
    html+='<button class="qp" onclick="setAIMsg(this.textContent)">'+q+'</button>';
  });
  html+='</div>';
  html+='<div class="chat-wrap" id="chat-wrap">';
  if(!aiHistory.length&&!act)html+='<div style="text-align:center;padding:22px 12px;color:#64748b;font-size:12px;line-height:1.8">Tambahkan API key lewat tombol <b style="color:#c084fc">⚙ API Key</b> untuk mulai memakai Orias AI.</div>';
  aiHistory.forEach(function(m){
    if(m.role==='user')html+='<div style="display:flex;justify-content:flex-end"><div class="bubble bubble-user">'+escHtml(m.content)+'</div></div>';
    else html+='<div style="display:flex;justify-content:flex-start"><div class="bubble bubble-ai"'+(m.err?' style="border-color:rgba(248,113,113,.4)"':'')+'><div class="bubble-ai-label">'+(m.err?'Orias AI · Error':'Orias AI')+'</div>'+escHtml(m.content)+'</div></div>';
  });
  html+='<div id="typing" style="display:none"><div style="display:flex;justify-content:flex-start"><div class="bubble bubble-ai" style="padding:10px 14px"><div style="display:flex;gap:5px"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div></div></div>';
  html+='</div>';
  html+='<div class="row" style="gap:7px">';
  html+='<input class="inp" id="ai-inp" style="flex:1" placeholder="Ask a statistical question…" onkeydown="if(event.key===\'Enter\'&&!event.shiftKey)sendAI()"/>';
  html+='<button class="btn btn-purple btn-sm" id="ai-btn" onclick="sendAI()">✦ Ask</button>';
  if(aiHistory.length)html+='<button class="btn btn-ghost btn-sm" onclick="aiHistory=[];renderTab(\'ai\')">Clear</button>';
  html+='</div></div>';
  el.innerHTML=html;
  var chat=document.getElementById('chat-wrap');if(chat)chat.scrollTop=chat.scrollHeight;
}
function setAIMsg(q){var inp=document.getElementById('ai-inp');if(inp)inp.value=q;}

async function sendAI(){
  if(_aiBusy)return;
  var inp=document.getElementById('ai-inp');var msg=inp?inp.value.trim():'';if(!msg)return;
  var act=aiGetActive();
  if(!act){_aiSettingsOpen=true;showToast('Tambahkan API key dulu di ⚙ API Key','error');renderTab('ai');return;}
  _aiBusy=true;
  if(inp)inp.value='';
  var btn=document.getElementById('ai-btn');if(btn){btn.disabled=true;btn.textContent='…';}
  var typing=document.getElementById('typing');if(typing)typing.style.display='block';
  var chat=document.getElementById('chat-wrap');if(chat)chat.scrollTop=chat.scrollHeight;
  var userMsg={role:'user',content:msg};
  aiHistory.push(userMsg);
  var varStr=vars.map(function(v){return v.name+'('+v.type+','+v.measure+')';}).join(', ');
  var mc=missCount().filter(function(m){return m.count>0;}).map(function(m){return m.name+':'+m.count;}).join(', ')||'none';
  var system='You are Orias AI, the statistical analysis assistant inside Orias Statistik System (OSS). Dataset: '+data.length+' cases. Variables: '+varStr+'. Missing: '+mc+'.\nBe concise (max 3 paragraphs), technically accurate, mention assumptions when relevant. Reply in the same language as the user.';
  try{
    var reply=await aiCall(act.provider,act.key,aiGetModel(act.provider),system,_aiBuildMsgs());
    aiHistory.push({role:'assistant',content:reply});
  }catch(e){
    userMsg.failed=true;
    aiHistory.push({role:'assistant',content:'⚠ '+(e&&e.message||'Terjadi kesalahan.'),err:true});
  }
  _aiBusy=false;
  renderTab('ai');
}
