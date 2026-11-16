// ── Moderation — covariates ──
function toggleModCov(f,checked){
  if(!aState.modCovs) aState.modCovs=[];
  if(checked){if(!aState.modCovs.includes(f))aState.modCovs.push(f);}
  else aState.modCovs=aState.modCovs.filter(function(x){return x!==f;});
  renderASub();
}

// ── Multiple Imputation — variabel ──
function toggleMIVar(f,checked){
  if(!aState.miVars) aState.miVars=[];
  if(checked){if(!aState.miVars.includes(f))aState.miVars.push(f);}
  else aState.miVars=aState.miVars.filter(function(x){return x!==f;});
  renderASub();
}

// ── ROC — compare predictors ──
function toggleROCCompare(f,checked){
  if(!aState.rocCompare) aState.rocCompare=[];
  if(checked){if(!aState.rocCompare.includes(f))aState.rocCompare.push(f);}
  else aState.rocCompare=aState.rocCompare.filter(function(x){return x!==f;});
  renderASub();
}

// ── Survival — covariates ──
function toggleSurvCov(f,checked){
  if(!aState.survCovs) aState.survCovs=[];
  if(checked){if(!aState.survCovs.includes(f))aState.survCovs.push(f);}
  else aState.survCovs=aState.survCovs.filter(function(x){return x!==f;});
  renderASub();
}

// ── Mediation — mediators ──
function toggleMedM(f,checked){
  if(!aState.medM) aState.medM=[];
  if(checked){if(!aState.medM.includes(f))aState.medM.push(f);}
  else aState.medM=aState.medM.filter(function(x){return x!==f;});
  renderASub();
}

// ── EFA — variabel ──
function toggleEfaVar(f,checked){
  if(!aState.efaVars) aState.efaVars=[];
  if(checked){if(!aState.efaVars.includes(f))aState.efaVars.push(f);}
  else aState.efaVars=aState.efaVars.filter(function(x){return x!==f;});
  // clamp nFactors
  if(aState.efaFactors>aState.efaVars.length) aState.efaFactors=Math.max(1,aState.efaVars.length);
  renderASub();
}

// ── CFA — faktor laten & penugasan variabel ──
function setCfaFactors(n){
  aState.cfaFactors=n;
  // Rebuild factor names keeping existing ones
  var oldNames=aState.cfaFactorNames||[];
  var newNames=[];
  for(var i=0;i<n;i++) newNames.push(oldNames[i]||('F'+(i+1)));
  aState.cfaFactorNames=newNames;
  // Rebuild factorMap keeping existing assignments
  var newMap={};
  newNames.forEach(function(fn){ newMap[fn]=aState.cfaFactorMap[fn]||[]; });
  aState.cfaFactorMap=newMap;
  renderASub();
}
function renameCfaFactor(idx,name){
  var oldName=aState.cfaFactorNames[idx];
  aState.cfaFactorNames[idx]=name||('F'+(idx+1));
  // Move map entry
  var oldVars=aState.cfaFactorMap[oldName]||[];
  delete aState.cfaFactorMap[oldName];
  aState.cfaFactorMap[aState.cfaFactorNames[idx]]=oldVars;
  renderASub();
}
function toggleCfaVar(factorName,varName,checked){
  if(!aState.cfaFactorMap[factorName]) aState.cfaFactorMap[factorName]=[];
  if(checked){
    // Remove from other factors (each variable only in one factor for now)
    aState.cfaFactorNames.forEach(function(fn){
      if(fn!==factorName&&aState.cfaFactorMap[fn]){
        aState.cfaFactorMap[fn]=aState.cfaFactorMap[fn].filter(function(v){return v!==varName;});
      }
    });
    if(!aState.cfaFactorMap[factorName].includes(varName)) aState.cfaFactorMap[factorName].push(varName);
  } else {
    aState.cfaFactorMap[factorName]=aState.cfaFactorMap[factorName].filter(function(v){return v!==varName;});
  }
  renderASub();
}

// ── SEM — state management helpers ──
// State management helpers
function semAddLatent(){
  var inp=document.getElementById('sem-new-latent');
  var name=(inp?inp.value:'').trim();
  if(!name){showToast('Masukkan nama konstruk','error');return;}
  if(aState.semLatents.includes(name)){showToast('Nama sudah ada','error');return;}
  aState.semLatents.push(name);
  aState.semLatentMap[name]=[];
  renderASub();
}
function semRemoveLatent(idx){
  var name=aState.semLatents[idx];
  aState.semLatents.splice(idx,1);
  delete aState.semLatentMap[name];
  // Remove paths involving this latent
  aState.semPaths=aState.semPaths.filter(function(p){return p.from!==name&&p.to!==name;});
  renderASub();
}
function semRenameLatent(idx,newName){
  var oldName=aState.semLatents[idx];
  if(!newName||newName===oldName) return;
  if(aState.semLatents.includes(newName)){return;}
  aState.semLatents[idx]=newName;
  aState.semLatentMap[newName]=aState.semLatentMap[oldName]||[];
  delete aState.semLatentMap[oldName];
  // Rename in paths
  aState.semPaths.forEach(function(p){
    if(p.from===oldName) p.from=newName;
    if(p.to===oldName) p.to=newName;
  });
}
function semToggleIndicator(latentName,varName,checked){
  if(!aState.semLatentMap[latentName]) aState.semLatentMap[latentName]=[];
  if(checked){
    if(!aState.semLatentMap[latentName].includes(varName)) aState.semLatentMap[latentName].push(varName);
  } else {
    aState.semLatentMap[latentName]=aState.semLatentMap[latentName].filter(function(v){return v!==varName;});
  }
  renderASub();
}
function semAddPath(){
  var fromEl=document.getElementById('sem-from');
  var toEl=document.getElementById('sem-to');
  // Read directly from aState since we use mkSelect
  var from=aState.semPathFrom||aState.semLatents[0];
  var to=aState.semPathTo||aState.semLatents[aState.semLatents.length-1];
  if(!from||!to){showToast('Pilih konstruk asal dan tujuan','error');return;}
  if(from===to){showToast('Dari dan ke harus berbeda','error');return;}
  var exists=aState.semPaths.some(function(p){return p.from===from&&p.to===to;});
  if(exists){showToast('Path sudah ada','error');return;}
  aState.semPaths.push({from:from,to:to});
  renderASub();
}
function semRemovePath(idx){
  aState.semPaths.splice(idx,1);
  renderASub();
}

// ── GLM Univariate & HLM — factor/covariate/level ──
function toggleGlmFactor(f,checked){
  if(checked){if(!aState.glmFactors.includes(f))aState.glmFactors.push(f);}
  else aState.glmFactors=aState.glmFactors.filter(function(x){return x!==f;});
  renderASub();
}
function toggleGlmCov(f,checked){
  if(checked){if(!aState.glmCovs.includes(f))aState.glmCovs.push(f);}
  else aState.glmCovs=aState.glmCovs.filter(function(x){return x!==f;});
  renderASub();
}
function toggleGlmMultiDep(f,checked){
  if(!aState.glmMultiDeps) aState.glmMultiDeps=[];
  if(checked){if(!aState.glmMultiDeps.includes(f))aState.glmMultiDeps.push(f);}
  else aState.glmMultiDeps=aState.glmMultiDeps.filter(function(x){return x!==f;});
  renderASub();
}
function toggleHlmL1(f,checked){
  if(!aState.hlmL1Preds) aState.hlmL1Preds=[];
  if(checked){if(!aState.hlmL1Preds.includes(f))aState.hlmL1Preds.push(f);}
  else aState.hlmL1Preds=aState.hlmL1Preds.filter(function(x){return x!==f;});
  renderASub();
}
function toggleHlmL2(f,checked){
  if(!aState.hlmL2Preds) aState.hlmL2Preds=[];
  if(checked){if(!aState.hlmL2Preds.includes(f))aState.hlmL2Preds.push(f);}
  else aState.hlmL2Preds=aState.hlmL2Preds.filter(function(x){return x!==f;});
  renderASub();
}

// ── Count GLM (Poisson/NegBin) — prediktor ──
function toggleCntPred(f,checked){
  if(!aState.cntPreds) aState.cntPreds=[];
  if(checked){if(!aState.cntPreds.includes(f)) aState.cntPreds.push(f);}
  else aState.cntPreds=aState.cntPreds.filter(function(x){return x!==f;});
  renderASub();
}

// ── Canonical Correlation — field X/Y ──
function toggleCCAField(cb, set){
  var f=cb.dataset.fld;
  if(set==='x'){
    if(cb.checked){if(!aState.ccaXs.includes(f))aState.ccaXs.push(f);}
    else aState.ccaXs=aState.ccaXs.filter(function(v){return v!==f;});
  } else {
    if(cb.checked){if(!aState.ccaYs.includes(f))aState.ccaYs.push(f);}
    else aState.ccaYs=aState.ccaYs.filter(function(v){return v!==f;});
  }
  renderASub();
}

// ── Multiple Regression — prediktor X ──
function toggleMrXEl(cb){const f=cb.dataset.fld;if(cb.checked){if(!aState.mrXs.includes(f))aState.mrXs.push(f);}else aState.mrXs=aState.mrXs.filter(x=>x!==f);renderASub();}

// ── Logistic Regression — prediktor X ──
function toggleLgX(cb){
  var f=cb.dataset.lgf;
  if(cb.checked){if(!aState.lgXs.includes(f))aState.lgXs.push(f);}
  else{aState.lgXs=aState.lgXs.filter(function(x){return x!==f;});}
  renderASub();
}

// ── Cronbach Alpha — item ──
function toggleAlphaVarEl(cb){const f=cb.dataset.fld;if(cb.checked){if(!aState.alphaVars.includes(f))aState.alphaVars.push(f);}else aState.alphaVars=aState.alphaVars.filter(x=>x!==f);renderASub();}

// ── Weight Cases — nonaktifkan ──
function clearWeightCases(){
  aState.wcActive=false;
  aState.wcOrigData=null;
  aState.wcVar='';
  var badge=document.getElementById('wc-badge');
  if(badge)badge.style.display='none';
  updateBadges();
  showToast('Weight Cases dinonaktifkan');
  renderASub();
}

// ── Correlation Matrix — field ──
// Corr matrix field toggle
function toggleCMFieldEl(cb){const f=cb.dataset.fld;if(cb.checked){if(!aState.cmFields.includes(f))aState.cmFields.push(f);}else aState.cmFields=aState.cmFields.filter(x=>x!==f);renderASub();}

// ── Hierarchical Regression — blok prediktor ──
function toggleHrBlock(blockIdx, field, checked){
  if(!aState.hrBlocks) aState.hrBlocks=[[],[]];
  while(aState.hrBlocks.length<=blockIdx) aState.hrBlocks.push([]);
  if(checked){
    // Remove from other blocks
    aState.hrBlocks.forEach(function(bl,bi){if(bi!==blockIdx)aState.hrBlocks[bi]=bl.filter(function(v){return v!==field;});});
    if(!aState.hrBlocks[blockIdx].includes(field)) aState.hrBlocks[blockIdx].push(field);
  } else {
    aState.hrBlocks[blockIdx]=aState.hrBlocks[blockIdx].filter(function(v){return v!==field;});
  }
  renderASub();
}
