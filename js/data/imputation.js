// Imputation
function runImpute(){
  const fld=aState.imputeFld,vals=SE.validNums(data.map(r=>r[fld]));
  if(!vals.length){showToast('No valid data','error');return;}
  const s=[...vals].sort((a,b)=>a-b);let iv;
  switch(aState.imputeMethod){case'mean':iv=SE.mean(vals);break;case'median':iv=SE.quantile(s,.5);break;
    case'mode':{const fr={};vals.forEach(v=>{fr[v]=(fr[v]||0)+1;});iv=parseFloat(Object.entries(fr).sort((a,b)=>b[1]-a[1])[0][0]);break;}
    case'zero':iv=0;break;case'min':iv=Math.min(...vals);break;case'max':iv=Math.max(...vals);break;default:iv=SE.mean(vals);}
  let n=0;data=data.map(r=>{if(isMiss(r[fld])){n++;return{...r,[fld]:iv};}return r;});
  updateBadges();showToast('Imputation berhasil');renderASub();
}
function imputeAllVars(){
  let tot=0;numFields().forEach(fld=>{const vals=SE.validNums(data.map(r=>r[fld]));if(!vals.length)return;const iv=SE.mean(vals);data=data.map(r=>{if(isMiss(r[fld])){tot++;return{...r,[fld]:iv};}return r;});});
  updateBadges();showToast('Imputation berhasil');renderASub();
}
