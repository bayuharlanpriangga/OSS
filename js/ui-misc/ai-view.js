// ════════════════════════════════════════════════════════════
// js/ui-misc/ai-view.js
// Fitur (I3): tab AI (AI Statistical Advisor) — riwayat chat, quick
//   prompts, dan pemanggil API AI (sendAI).
// Depends on (dibaca runtime, di dalam function body — aman dimuat
//   sebelum app.js): vars, data, missCount(), escHtml() (TETAP di app.js,
//   lihat catatan), renderTab() (router.js).
// Dipanggil oleh: js/core/router.js (renderAI).
// Catatan: dipindah byte-exact dari app.js (I3, 2026-10-04). `escHtml`
//   secara fisik berada di tengah blok AI VIEW tetapi dipakai global oleh
//   banyak file (syntax-view, pivot-view, dll), jadi sengaja TETAP di app.js.
// ════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════
// AI VIEW
// ════════════════════════════════════════════════════════════════════════
var aiHistory=[];
function renderAI(el){
  let html='<div class="card">';
  html+='<div class="sec-hd">AI Statistical Advisor <span class="tag tag-purple" style="margin-left:auto;font-size:9px">Claude-powered</span></div>';
  html+='<div style="font-size:11.5px;color:#475569;margin-bottom:10px">Test selection · Assumption checking · Interpretation</div>';
  html+='<div class="quick-prompts">';
  ['Which test should I use?','Check T-Test assumptions','When nonparametric?','Interpret α=0.72','Handle missing data?','What does R²=0.65 mean?','Effect size guide','Pearson vs Spearman?'].forEach(q=>{
    html+='<button class="qp" onclick="setAIMsg(this.textContent)">'+q+'</button>';
  });
  html+='</div>';
  html+='<div class="chat-wrap" id="chat-wrap">';
  aiHistory.forEach(m=>{
    if(m.role==='user')html+='<div style="display:flex;justify-content:flex-end"><div class="bubble bubble-user">'+escHtml(m.content)+'</div></div>';
    else html+='<div style="display:flex;justify-content:flex-start"><div class="bubble bubble-ai"><div class="bubble-ai-label">OSS AI</div>'+escHtml(m.content)+'</div></div>';
  });
  html+='<div id="typing" style="display:none"><div style="display:flex;justify-content:flex-start"><div class="bubble bubble-ai" style="padding:10px 14px"><div style="display:flex;gap:5px"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div></div></div>';
  html+='</div>';
  html+='<div class="row" style="gap:7px">';
  html+='<input class="inp" id="ai-inp" style="flex:1" placeholder="Ask a statistical question…" onkeydown="if(event.key===\'Enter\'&&!event.shiftKey)sendAI()"/>';
  html+='<button class="btn btn-purple btn-sm" id="ai-btn" onclick="sendAI()">✦ Ask</button>';
  if(aiHistory.length)html+='<button class="btn btn-ghost btn-sm" onclick="aiHistory=[];renderTab(\'ai\')">Clear</button>';
  html+='</div></div>';
  el.innerHTML=html;
  const chat=document.getElementById('chat-wrap');if(chat)chat.scrollTop=chat.scrollHeight;
}
function setAIMsg(q){const inp=document.getElementById('ai-inp');if(inp)inp.value=q;}
async function sendAI(){
  const inp=document.getElementById('ai-inp');const msg=inp?inp.value.trim():'';if(!msg)return;
  if(inp)inp.value='';
  const btn=document.getElementById('ai-btn');if(btn){btn.disabled=true;btn.textContent='…';}
  const typing=document.getElementById('typing');if(typing)typing.style.display='block';
  const chat=document.getElementById('chat-wrap');if(chat)chat.scrollTop=chat.scrollHeight;
  aiHistory.push({role:'user',content:msg});
  const varStr=vars.map(v=>v.name+'('+v.type+','+v.measure+')').join(', ');
  const mc=missCount().filter(m=>m.count>0).map(m=>m.name+':'+m.count).join(', ')||'none';
  const system='You are OSS AI, a statistical analysis assistant. Dataset: '+data.length+' cases. Variables: '+varStr+'. Missing: '+mc+'.\nBe concise (max 3 paragraphs), technically accurate, mention assumptions when relevant.';
  try{
    const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,system,messages:aiHistory.map(m=>({role:m.role,content:m.content}))})});
    const json=await res.json();
    const reply=json.content?.map(c=>c.text||'').join('')||'Error connecting.';
    aiHistory.push({role:'assistant',content:reply});
  }catch(e){aiHistory.push({role:'assistant',content:'Connection error. Please try again.'});}
  renderTab('ai');
}
