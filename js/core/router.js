// PAGE ROUTER — position:fixed true page isolation
var appReady=false;
var currentTab='data';
var currentASub='descriptive';
var currentGroup='descriptive';

function enterApp(){
  var app=document.getElementById('pa');
  if(app) app.classList.add('on');
  // Show mobile menu button only inside app on small screens
  var mb=document.getElementById('mob-btn');
  if(mb){
    if(window.innerWidth<=620){
      mb.style.cssText='display:flex!important;position:fixed;bottom:18px;left:50%;transform:translateX(-50%);z-index:200;background:linear-gradient(135deg,#7c3aed,#db2777);border:none;border-radius:999px;padding:10px 22px;color:#fff;font-size:12px;font-weight:700;cursor:pointer;box-shadow:0 4px 20px rgba(124,58,237,.45);font-family:Inter,sans-serif;align-items:center;gap:7px';
    }
  }
  if(!appReady){
    appReady=true;
    updateBadges();
    switchTab('data');
  }
}

function toggleSide(){
  var side=document.getElementById('side');
  var ov=document.getElementById('mob-ov');
  var isOpen=side.classList.toggle('open');
  if(ov) ov.style.display=isOpen?'block':'none';
}
function closeSide(){
  var side=document.getElementById('side');
  var ov=document.getElementById('mob-ov');
  if(side) side.classList.remove('open');
  if(ov) ov.style.display='none';
}

document.addEventListener('keydown',function(e){
  if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();openCmd();}
  if(e.key==='Escape'){closeCsel();closeCmd();}
  // a11y: Enter/Space mengaktifkan elemen non-<button> yang berperan tombol (mis. .s-item sidebar)
  if((e.key==='Enter'||e.key===' ')&&e.target&&e.target.matches&&e.target.matches('[data-kbd-clickable]')){
    e.preventDefault();
    e.target.click();
  }
});

// a11y: item navigasi sidebar (.s-item/.s-cat) adalah <div onclick> — tidak bisa dijangkau Tab.
// Elemen ini statis di index.html (tidak di-render ulang tiap frame), jadi cukup dipatch sekali
// saat load — tidak pakai MutationObserver supaya tidak menambah beban render tabel data besar.
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.s-item, .s-cat[onclick]').forEach(function(el){
    if(!el.hasAttribute('tabindex')) el.setAttribute('tabindex','0');
    if(!el.hasAttribute('role')) el.setAttribute('role','button');
    el.setAttribute('data-kbd-clickable','1');
  });
});

// APP TAB SWITCHING
// TAB SWITCHING + SIDE NAV ACTIVE STATE
var TAB_LABELS={'data':' Data','variable':' Variables','analyze':' Analyze',
  'syntax':' Syntax','pivot':' Pivot','ai':' AI Advisor','output':' Output'};

function switchTab(tab){
  currentTab=tab;
  // Update side nav active state
  document.querySelectorAll('.s-item').forEach(function(b){
    var tabMatch=b.dataset.tab===tab;
    var subMatch=!b.dataset.sub;
    b.classList.toggle('active', tabMatch && subMatch);
  });
  var el=document.getElementById('app-content');
  if(!el)return;
  el.innerHTML='';
  el.scrollTop=0;
  if(tab==='data')renderData(el);
  else{
    if(sprMode){sprMode=false;sprBuffer={};}
    if(tab==='variable')renderVars(el);
    else if(tab==='analyze')renderAnalyze(el);
    else if(tab==='syntax')renderSyntax(el);
    else if(tab==='pivot')renderPivot(el);
    else if(tab==='ai')renderAI(el);
    else if(tab==='output')renderOutput(el);
  }
  closeSide();
}

function renderTab(tab){ switchTab(tab); }

// Map every sub-analysis to its parent group (so renderAnalyze loads the right tab set)
var SUB_TO_GROUP={
  'descriptive':'descriptive',
  'ttest':'ttest','onesamp':'ttest','paired':'ttest',
  'anova':'anova','anova2':'anova','anova3':'anova','rmanova':'anova',
  'correlation':'correlation','canonicalcorr':'correlation','corrmatrix':'correlation','partialcorr':'correlation',
  'regression':'regression','multipleReg':'regression','hierarchicalReg':'regression','logistic':'regression',
  'nonparam':'nonparam',
  'glm':'glm','glm-multi':'glm','glm-rep':'glm',
  'hlm-2level':'hlm','hlm-3level':'hlm','hlm-icc':'hlm',
  'reliability':'reliability',
  'kappa':'reliability',
  'crosstab':'crosstab',
  'efa':'factor','cfa':'factor',
  'sem':'sem',
  'mediation':'mediation',
  'charts':'charts',
  'discriminant':'discriminant',
  'cluster':'cluster',
  'missinganalysis':'missinganalysis',
  'poweranalysis':'poweranalysis','powerplot':'poweranalysis','sensitivity':'poweranalysis',
  'moderation':'moderation','simpleslopes':'moderation','jn':'moderation',
  'transform':'transform','recode':'transform','filter':'transform',
  'impute':'imputation','mi':'imputation',
  'roc':'roc','roc_compare':'roc',
  'survival':'survival','km':'survival','logrank':'survival','cox':'survival',
  'bayesian':'bayesian','bayesian_corr':'bayesian','bayesian_posterior':'bayesian',
  'timeseries':'timeseries',
  'metaanalysis':'metaanalysis',
  'weightcases':'weightcases'
};

function openAnalyze(sub,group){
  // Always resolve the correct group — never rely on the previous currentGroup
  currentGroup = group || SUB_TO_GROUP[sub] || sub;
  currentASub = sub;
  currentTab = 'analyze';
  // Highlight correct side item
  document.querySelectorAll('.s-item').forEach(function(b){
    var bSub=b.dataset.sub;
    b.classList.toggle('active', b.dataset.tab==='analyze' && (bSub===sub || bSub===currentGroup));
  });
  var el=document.getElementById('app-content');
  if(!el)return;
  // Always force a full re-render regardless of previous tab state
  el.innerHTML='';
  el.scrollTop=0;
  renderAnalyze(el);
  closeSide();
}

function switchASub(sub){
  currentASub=sub;
  // Re-render without changing group or sidebar active state
  var el=document.getElementById('app-content');
  if(!el)return;
  el.innerHTML='';
  el.scrollTop=0;
  renderAnalyze(el);
}

// Compatibility
function goToApp(tab){ enterApp(); if(tab) setTimeout(function(){switchTab(tab);},200); }

// ── Boot sequence (dipindah dari akhir app.js) ──────────────
// Clear any previously saved demo/auto sessions so fresh installs start empty
(function(){
  try{
    var saved=localStorage.getItem('oss_session');
    if(saved){
      var s=JSON.parse(saved);
      // If the saved session contains the old demo data (id:1 name:'Andi'), wipe it
      if(s.data&&s.data.length&&s.data[0]&&s.data[0].name==='Andi'){
        localStorage.removeItem('oss_session');
        localStorage.removeItem('oss_auto');
      }
    }
  }catch(e){}
})();
updateBadges();
renderDsSidebar();
if(loadSession()){
  setTimeout(function(){showToast('Session berhasil dimuat');updateBadges();renderDsSidebar();},400);
}
// App now opens directly — no home/welcome page
enterApp();




