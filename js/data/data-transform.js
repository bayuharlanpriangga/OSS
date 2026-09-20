// Transform & Compute
function runTransform(){
  const fld=aState.trFld,tt=aState.trType,nn=aState.trNewName.trim();
  if(!nn){showToast('Enter a variable name','error');return;}
  if(vars.find(v=>v.name===nn)){showToast('"'+nn+'" already exists','error');return;}
  const vals=SE.validNums(data.map(r=>r[fld]));
  if(!vals.length){showToast('No valid data','error');return;}
  const mn=SE.mean(vals),sd=vals.length>=2?SE.std(vals):0,minV=Math.min(...vals),maxV=Math.max(...vals);
  const sorted=[...vals].sort((a,b)=>a-b);
  const rm=new Map();let p=0;
  while(p<sorted.length){let j=p;while(j<sorted.length&&sorted[j]===sorted[p])j++;const avg=(p+j+1)/2;for(let x=p;x<j;x++)rm.set(sorted[x],avg);p=j;}
  const tx=v=>{if(!SE.isV(v))return null;
    switch(tt){case'zscore':return sd>0?(v-mn)/sd:0;case'minmax':return maxV>minV?(v-minV)/(maxV-minV):0;
      case'log':return v>0?Math.log(v):null;case'log10':return v>0?Math.log10(v):null;
      case'sqrt':return v>=0?Math.sqrt(v):null;case'square':return v*v;
      case'center':return v-mn;case'rank':return rm.get(v)??null;default:return v;}};
  data=data.map(r=>({...r,[nn]:tx(r[fld])}));
  vars=[...vars,{name:nn,type:'Numeric',width:10,dec:4,label:nn+' ('+tt+')',measure:'Scale',role:'Input'}];
  updateBadges();showToast('Transform berhasil');renderASub();
}

function runCompute(){
  const expr=aState.computeExpr.trim(),nn=aState.computeName.trim();
  if(!nn||!expr){showToast('Enter name and expression','error');return;}
  if(vars.find(v=>v.name===nn)){showToast('"'+nn+'" already exists','error');return;}
  function safeEval(ex,scope){
    let pos=0;const tok=[];const src=ex.trim();
    while(pos<src.length){const c=src[pos];
      if(/\s/.test(c)){pos++;continue;}
      if(/[0-9]/.test(c)){let n=c;pos++;while(pos<src.length&&/[0-9.]/.test(src[pos]))n+=src[pos++];tok.push({t:'num',v:parseFloat(n)});continue;}
      if(/[a-zA-Z_]/.test(c)){let id=c;pos++;while(pos<src.length&&/[a-zA-Z0-9_]/.test(src[pos]))id+=src[pos++];tok.push({t:'id',v:id});continue;}
      if('+-*/()%^,'.includes(c)){tok.push({t:'op',v:c});pos++;continue;}pos++;}
    let ti=0;const peek=()=>tok[ti];const eat=()=>tok[ti++];
    function pE(){return pA();}
    function pA(){let l=pM();while(peek()&&(peek().v==='+'||peek().v==='-')){const op=eat().v;const r=pM();l=op==='+'?l+r:l-r;}return l;}
    function pM(){let l=pP();while(peek()&&(peek().v==='*'||peek().v==='/'||peek().v==='%')){const op=eat().v;const r=pP();l=op==='*'?l*r:op==='/'?l/r:l%r;}return l;}
    function pP(){let l=pU();if(peek()&&peek().v==='^'){eat();const r=pP();l=Math.pow(l,r);}return l;}
    function pU(){if(peek()&&peek().v==='-'){eat();return -pPr();}return pPr();}
    const SF={abs:Math.abs,sqrt:Math.sqrt,log:Math.log,log10:Math.log10,exp:Math.exp,ceil:Math.ceil,floor:Math.floor,round:Math.round,sin:Math.sin,cos:Math.cos,pow:Math.pow,min:Math.min,max:Math.max,sign:Math.sign};
    function pPr(){const t=peek();if(!t)throw new Error('Unexpected end');
      if(t.t==='num'){eat();return t.v;}
      if(t.t==='op'&&t.v==='('){eat();const v=pE();if(peek()&&peek().v===')')eat();return v;}
      if(t.t==='id'){eat();
        if(peek()&&peek().v==='('){eat();const args=[];while(peek()&&peek().v!==')'){args.push(pE());if(peek()&&peek().v===',')eat();}if(peek()&&peek().v===')')eat();
          const fn=SF[t.v.toLowerCase()];if(!fn)throw new Error('Unknown function: '+t.v);return fn(...args);}
        if(t.v==='pi'||t.v==='PI')return Math.PI;if(t.v==='e'||t.v==='E')return Math.E;
        if(t.v in scope)return scope[t.v]??NaN;throw new Error('Unknown variable: '+t.v);}
      throw new Error('Unexpected: '+t.v);}
    return pE();
  }
  let errors=0;
  const nd=data.map(r=>{
    try{const scope={};vars.forEach(v=>{scope[v.name]=typeof r[v.name]==='number'?r[v.name]:NaN;});
      const val=safeEval(expr,scope);return{...r,[nn]:isFinite(val)?val:null};}
    catch{errors++;return{...r,[nn]:null};}
  });
  if(errors>data.length*.8){showToast('Expression errors in >80% rows','error');return;}
  data=nd;vars=[...vars,{name:nn,type:'Numeric',width:10,dec:4,label:nn+' (computed)',measure:'Scale',role:'Input'}];
  updateBadges();showToast('Compute berhasil');renderASub();
}

// Recode
function runRecodeRange(n){
  const nn=aState.recodeNewName.trim();if(!nn){showToast('Enter name','error');return;}
  if(vars.find(v=>v.name===nn)){showToast('"'+nn+'" exists','error');return;}
  const rules=[];
  for(let i=0;i<n;i++){const fr=document.getElementById('rc-from-'+i)?.value.trim(),to=document.getElementById('rc-to-'+i)?.value.trim(),nv=document.getElementById('rc-new-'+i)?.value.trim();
    if(fr&&to&&nv)rules.push({from:parseFloat(fr),to:parseFloat(to),newVal:nv});}
  if(!rules.length){showToast('Enter at least 1 rule','error');return;}
  data=data.map(r=>{const v=r[aState.recodeFld];if(v===null||v===undefined)return{...r,[nn]:null};for(const rule of rules)if(v>=rule.from&&v<=rule.to)return{...r,[nn]:rule.newVal};return{...r,[nn]:null};});
  vars=[...vars,{name:nn,type:'String',width:15,dec:0,label:nn+' (recoded)',measure:'Nominal',role:'Input'}];
  updateBadges();showToast('Recode berhasil');renderASub();
}
function runRecodeBinary(){
  const nn=aState.recodeNewName.trim();if(!nn){showToast('Enter name','error');return;}
  const v0=document.getElementById('rc-val0')?.value.trim(),v1=document.getElementById('rc-val1')?.value.trim();
  if(!v0||!v1){showToast('Enter both values','error');return;}
  data=data.map(r=>{const v=String(r[aState.recodeFld]??'');if(v===v0)return{...r,[nn]:0};if(v===v1)return{...r,[nn]:1};return{...r,[nn]:null};});
  vars=[...vars,{name:nn,type:'Numeric',width:5,dec:0,label:nn+' (0='+v0+',1='+v1+')',measure:'Nominal',role:'Input'}];
  updateBadges();showToast('Recode berhasil');renderASub();
}
function runRecodeExact(uniq){
  const nn=aState.recodeNewName.trim();if(!nn){showToast('Enter name','error');return;}
  const map={};uniq.forEach((v,i)=>{const nv=document.getElementById('rc-exact-'+i)?.value.trim();if(nv)map[v]=nv;});
  if(!Object.keys(map).length){showToast('Enter at least 1 mapping','error');return;}
  const isNum=Object.values(map).every(v=>!isNaN(Number(v)));
  data=data.map(r=>{const v=r[aState.recodeFld];if(v===null||v===undefined)return{...r,[nn]:null};const nv=map[v];if(nv===undefined)return{...r,[nn]:null};return{...r,[nn]:isNum?Number(nv):nv};});
  vars=[...vars,{name:nn,type:isNum?'Numeric':'String',width:15,dec:0,label:nn+' (recoded)',measure:isNum?'Scale':'Nominal',role:'Input'}];
  updateBadges();showToast('Recode berhasil');renderASub();
}

// Filter
function safeBool(expr){
  const tokens=[];let pos=0;const s=expr.trim();
  while(pos<s.length){const c=s[pos];
    if(/\s/.test(c)){pos++;continue;}
    if(c==='"'){let str='';pos++;while(pos<s.length&&s[pos]!=='"')str+=s[pos++];pos++;tokens.push({t:'str',v:str});continue;}
    if(/[0-9.-]/.test(c)&&(!tokens.length||['op','cmp','lop'].includes(tokens[tokens.length-1]?.t))){
      let n=c;pos++;while(pos<s.length&&/[0-9.e]/.test(s[pos]))n+=s[pos++];tokens.push({t:'num',v:parseFloat(n)});continue;}
    if(s.slice(pos,pos+4)==='null'){tokens.push({t:'null'});pos+=4;continue;}
    if(s.slice(pos,pos+4)==='true'){tokens.push({t:'bool',v:true});pos+=4;continue;}
    if(s.slice(pos,pos+5)==='false'){tokens.push({t:'bool',v:false});pos+=5;continue;}
    if(s.slice(pos,pos+3)==='==='){tokens.push({t:'cmp',v:'==='});pos+=3;continue;}
    if(s.slice(pos,pos+3)==='!=='){tokens.push({t:'cmp',v:'!=='});pos+=3;continue;}
    if(s.slice(pos,pos+2)==='>='){tokens.push({t:'cmp',v:'>='});pos+=2;continue;}
    if(s.slice(pos,pos+2)==='<='){tokens.push({t:'cmp',v:'<='});pos+=2;continue;}
    if(s.slice(pos,pos+2)==='&&'){tokens.push({t:'lop',v:'&&'});pos+=2;continue;}
    if(s.slice(pos,pos+2)==='||'){tokens.push({t:'lop',v:'||'});pos+=2;continue;}
    if('><!'.includes(c)){tokens.push({t:'cmp',v:c});pos++;continue;}
    if(c==='('){tokens.push({t:'lp'});pos++;continue;}
    if(c===')'){tokens.push({t:'rp'});pos++;continue;}
    pos++;}
  function ev(a,op,b){if(a===null||b===null)return false;switch(op){case'===':return a===b;case'!==':return a!==b;case'>':return a>b;case'>=':return a>=b;case'<':return a<b;case'<=':return a<=b;}return false;}
  let i=0;
  function parseS(){while(i<tokens.length&&tokens[i]?.t==='lp')i++;
    const left=tokens[i++];let lv=left?.t==='num'?left.v:left?.t==='str'?left.v:left?.t==='bool'?left.v:left?.t==='null'?null:left?.v;
    if(i<tokens.length&&tokens[i]?.t==='cmp'){const op=tokens[i++].v;const right=tokens[i++];
      const rv=right?.t==='num'?right.v:right?.t==='str'?right.v:right?.t==='bool'?right.v:right?.t==='null'?null:right?.v;
      while(i<tokens.length&&tokens[i]?.t==='rp')i++;return ev(lv,op,rv);}
    while(i<tokens.length&&tokens[i]?.t==='rp')i++;return !!lv;}
  let result=parseS();
  while(i<tokens.length){const lop=tokens[i++];if(!lop||lop.t!=='lop')break;const right=parseS();result=lop.v==='&&'?result&&right:result||right;}
  return result;
}
function safeFilter(row,expr){
  let se=expr.trim().replace(/==/g,'===').replace(/!=/g,'!==');
  vars.forEach(v=>{const val=row[v.name];
    if(val===null||val===undefined)se=se.replace(new RegExp('\\b'+v.name+'\\b','g'),'null');
    else if(typeof val==='string')se=se.replace(new RegExp('\\b'+v.name+'\\b','g'),'"'+val.replace(/"/g,'\\"')+'"');
    else se=se.replace(new RegExp('\\b'+v.name+'\\b','g'),val);});
  try{return !!safeBool(se);}catch{return false;}
}
var _origData=null;
function applyFilter(){
  const expr=aState.filterExpr.trim();if(!expr)return;
  if(!_origData)_origData=[...data];
  const filtered=_origData.filter(r=>safeFilter(r,expr));
  if(!filtered.length){showToast('No rows match','error');return;}
  data=filtered;aState.filterActive=true;updateBadges();showToast('Filter berhasil');renderASub();
}
function clearFilter(){if(_origData){data=[..._origData];_origData=null;}aState.filterActive=false;updateBadges();showToast('Filter berhasil dihapus');renderASub();}
function completeCases(){if(!_origData)_origData=[...data];data=_origData.filter(r=>vars.every(v=>!isMiss(r[v.name])));aState.filterActive=true;updateBadges();showToast('Filter berhasil');renderASub();}
function removeOutlierFilter(){if(!numFields().length)return;const fld=numFields()[0];const vals=SE.validNums(data.map(r=>r[fld]));const s=[...vals].sort((a,b)=>a-b);const q1=SE.quantile(s,.25),q3=SE.quantile(s,.75),iqr=q3-q1;if(!_origData)_origData=[...data];data=_origData.filter(r=>{const v=r[fld];return v===null||v===undefined||(v>=q1-1.5*iqr&&v<=q3+1.5*iqr);});aState.filterActive=true;updateBadges();showToast('Filter berhasil');renderASub();}
