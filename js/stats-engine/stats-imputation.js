// ════════════════════════════════════════════════════════════
// js/stats-engine/stats-imputation.js
// Fitur (B16): Multiple Imputation computation — MICE
// (Multivariate Imputation by Chained Equations), mendukung metode
// Predictive Mean Matching (PMM) dan Normal (noise dari residual
// distribution), dengan pooling estimasi lewat Rubin's Rules
// (Qbar, Ubar, B, T, FMI).
// Depends on: global `vars` (metadata variabel dataset aktif),
// `isMiss` (helper global cek nilai kosong), dan namespace `SE.*`
// (`matInvFlat`, `mean`, `std`, `validNums`, `f4`) — semuanya diakses
// lewat nama global langsung (`vars`, `isMiss`) atau lewat `SE.` di
// dalam function body, bukan di top-level, jadi aman dipindah ke file
// yang dimuat sebelum app.js: `vars`/`isMiss`/`SE` baru terbentuk saat
// app.js dieksekusi, tapi computeMICE baru benar-benar jalan saat
// dipanggil user (runtime), bukan saat file di-parse.
// Dipindah keluar apa adanya sebagai fungsi global biasa, mengikuti
// pola B1-B15.
// Catatan: UI wiring (toggleMIVar, runMultipleImputation) BUKAN
// bagian B16 — tetap di app.js untuk saat ini.
//
// ✅ TEMUAN DIPERBAIKI (2026-09-15): `SE.matInv(flat,p2+1)` di baris
// olsPredict TIDAK PERNAH BERHASIL sebelumnya — `matInv` tidak pernah
// dimasukkan ke `return {...}` objek `SE` di app.js, jadi `SE.matInv`
// selalu `undefined` dan cabang ini selalu jatuh ke `:null` →
// `olsPredict` selalu gagal diam-diam dan MICE diam-diam SELALU
// fallback ke mean sederhana (lihat bawah), bukan regresi seperti
// seharusnya. Diperbaiki dengan memanggil `SE.matInvFlat` (nama baru
// versi flat-array setelah B1 di stats-core-advanced.js diperbaiki)
// DAN memasukkan `matInvFlat` ke `return {...}` di app.js supaya
// benar-benar terisi saat runtime.
// ════════════════════════════════════════════════════════════

function computeMICE(dataArr,targetVars,M,method){
  var n=dataArr.length;
  if(n<5) throw new Error('Need ≥5 cases for MI');
  if(!targetVars||!targetVars.length) throw new Error('Select at least 1 variable to impute');
  M=Math.min(M||5,50);

  // All numeric vars as predictors
  var allNumVars=vars.filter(function(v){return v.type==='Numeric';}).map(function(v){return v.name;});

  // Helper: OLS predict y from X (no intercept regularization)
  function olsPredict(Xdata,yData,xNew){
    var n2=Xdata.length,p2=Xdata[0].length;
    var XtX=[];var Xty=[];
    for(var a=0;a<p2+1;a++){Xty.push(0);XtX.push([]);for(var b=0;b<p2+1;b++)XtX[a].push(0);}
    for(var i=0;i<n2;i++){
      var row=[1].concat(Xdata[i]);
      for(var a=0;a<p2+1;a++){Xty[a]+=row[a]*yData[i];for(var b=0;b<p2+1;b++)XtX[a][b]+=row[a]*row[b];}
    }
    var flat=[];XtX.forEach(function(row){row.forEach(function(v){flat.push(v);});});
    try{
      var inv=SE.matInvFlat?SE.matInvFlat(flat,p2+1):null;
      if(!inv) throw new Error('singular');
      var beta=[];for(var a=0;a<p2+1;a++){var s=0;for(var b=0;b<p2+1;b++)s+=inv[a*(p2+1)+b]*Xty[b];beta.push(s);}
      var xr=[1].concat(xNew);
      return xr.reduce(function(s,x,j){return s+x*beta[j];},0);
    }catch(e){return SE.mean(yData);}
  }

  // PMM: find k nearest observed values by predicted value
  function pmm(observed,obsIdx,predVal,k){
    k=Math.min(k||5,observed.length);
    var dists=observed.map(function(v,i){return{v:v,d:Math.abs(v-predVal),i:i};});
    dists.sort(function(a,b){return a.d-b.d;});
    var pool=dists.slice(0,k).map(function(d){return d.v;});
    return pool[Math.floor(Math.random()*pool.length)];
  }

  // Normal: add random noise from residual distribution
  function normalImpute(yData,predVal){
    var residSd=SE.std(yData)||1;
    // Box-Muller
    var u1=Math.random()||0.0001,u2=Math.random();
    var z=Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2);
    return predVal+residSd*z*0.3; // damped noise
  }

  var imputedDatasets=[];
  var convergenceStats=targetVars.map(function(){return [];});

  for(var m=0;m<M;m++){
    // Start with mean imputation
    var impData=dataArr.map(function(r){return Object.assign({},r);});
    targetVars.forEach(function(v){
      var vals=SE.validNums(dataArr.map(function(r){return r[v];}));
      var mn=vals.length?SE.mean(vals):0;
      impData.forEach(function(r){if(isMiss(r[v]))r[v]=mn+(Math.random()-0.5)*SE.std(vals)*0.1;});
    });

    // MICE iterations (5 cycles for convergence)
    for(var iter=0;iter<5;iter++){
      targetVars.forEach(function(v,vi){
        var predictors=allNumVars.filter(function(p){return p!==v&&SE.validNums(impData.map(function(r){return r[p];})).length>0;}).slice(0,8);
        var obsIdx=dataArr.map(function(r,i){return isMiss(r[v])?-1:i;}).filter(function(i){return i>=0;});
        var missIdx=dataArr.map(function(r,i){return isMiss(r[v])?i:-1;}).filter(function(i){return i>=0;});
        if(!missIdx.length||!obsIdx.length) return;

        var obsVals=obsIdx.map(function(i){return Number(impData[i][v]);});
        var XdataObs=obsIdx.map(function(i){return predictors.map(function(p){return Number(impData[i][p])||0;});});

        missIdx.forEach(function(i){
          var xNew=predictors.map(function(p){return Number(impData[i][p])||0;});
          var predVal=olsPredict(XdataObs,obsVals,xNew);
          if(method==='pmm') impData[i][v]=pmm(obsVals,obsIdx,predVal,5);
          else impData[i][v]=normalImpute(obsVals,predVal);
        });
      });
    }
    imputedDatasets.push(impData);
    // Track convergence: mean of imputed values per var
    targetVars.forEach(function(v,vi){
      var impVals=SE.validNums(impData.filter(function(_,i){return isMiss(dataArr[i][v]);}).map(function(r){return r[v];}));
      convergenceStats[vi].push(impVals.length?SE.mean(impVals):0);
    });
  }

  // Rubin's Rules: pool estimates for each target variable
  var pooled=targetVars.map(function(v,vi){
    var obsVals=SE.validNums(dataArr.map(function(r){return r[v];}));
    var missCount=dataArr.filter(function(r){return isMiss(r[v]);}).length;
    // Pool imputed means and variances
    var impMeans=imputedDatasets.map(function(d){
      var vals=SE.validNums(d.map(function(r){return r[v];}));
      return vals.length?SE.mean(vals):0;
    });
    var impVars=imputedDatasets.map(function(d){
      var vals=SE.validNums(d.map(function(r){return r[v];}));
      return vals.length>=2?Math.pow(SE.std(vals),2):0;
    });
    var Qbar=impMeans.reduce(function(s,x){return s+x;},0)/M;
    var Ubar=impVars.reduce(function(s,x){return s+x;},0)/M;
    var B=impMeans.reduce(function(s,x){return s+(x-Qbar)*(x-Qbar);},0)/(M-1);
    var T=Ubar+(1+1/M)*B; // total variance (Rubin's)
    var FMI=((1+1/M)*B)/T; // fraction missing information
    return {
      variable:v,
      n:obsVals.length,
      nImputed:missCount,
      nTotal:dataArr.length,
      origMean:SE.f4(obsVals.length?SE.mean(obsVals):0),
      pooledMean:SE.f4(Qbar),
      origSD:SE.f4(obsVals.length>=2?SE.std(obsVals):0),
      pooledSD:SE.f4(Math.sqrt(Math.max(0,T))),
      FMI:SE.f4(FMI),
      lambda:SE.f4(FMI),
      convergence:convergenceStats[vi]
    };
  });

  return {M:M,method:method,n:n,targetVars:targetVars,pooled:pooled,imputedDatasets:imputedDatasets};
}
