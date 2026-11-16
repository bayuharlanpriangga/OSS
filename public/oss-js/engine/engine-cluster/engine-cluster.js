// CLUSTER ANALYSIS (K-Means & Hierarchical)
function computeKMeans(dataArr, varNames, k, maxIter, _noElbow){
  maxIter=maxIter||100;
  var f4=function(v){return isFinite(v)?+(+v).toFixed(4):NaN;};
  var isV=function(v){return typeof v==='number'&&isFinite(v);};
  var rows=dataArr.filter(function(r){return varNames.every(function(v){return isV(Number(r[v]));});});
  var n=rows.length;
  if(n<k*2) throw new Error('Need ≥'+(k*2)+' complete cases for k='+k);

  // Standardize variables
  var means=varNames.map(function(v){var vs=rows.map(function(r){return Number(r[v]);});return vs.reduce(function(s,x){return s+x;},0)/vs.length;});
  var stds=varNames.map(function(v,vi){var vs=rows.map(function(r){return Number(r[v]);});var m=means[vi];return Math.sqrt(vs.reduce(function(s,x){return s+(x-m)*(x-m);},0)/(vs.length-1))||1;});
  var zRows=rows.map(function(r){return varNames.map(function(v,vi){return (Number(r[v])-means[vi])/stds[vi];});});

  // Init centroids (k-means++ style)
  var centroids=[];
  var used=new Set();
  var first=Math.floor(Math.random()*n);
  centroids.push(zRows[first].slice());used.add(first);
  for(var ci=1;ci<k;ci++){
    var dists=zRows.map(function(zr,i){
      if(used.has(i)) return 0;
      var minD=Infinity;
      centroids.forEach(function(c){var d=zr.reduce(function(s,x,j){return s+(x-c[j])*(x-c[j]);},0);if(d<minD)minD=d;});
      return minD;
    });
    var totalD=dists.reduce(function(s,v){return s+v;},0);
    var rand=Math.random()*totalD,cumD=0;
    var chosen=0;
    for(var i=0;i<n;i++){cumD+=dists[i];if(cumD>=rand){chosen=i;break;}}
    centroids.push(zRows[chosen].slice());used.add(chosen);
  }

  // Iterate
  var assignments=new Array(n).fill(0);
  for(var iter=0;iter<maxIter;iter++){
    var changed=false;
    zRows.forEach(function(zr,i){
      var minD=Infinity,best=0;
      centroids.forEach(function(c,ci){var d=zr.reduce(function(s,x,j){return s+(x-c[j])*(x-c[j]);},0);if(d<minD){minD=d;best=ci;}});
      if(assignments[i]!==best){assignments[i]=best;changed=true;}
    });
    if(!changed) break;
    centroids=Array(k).fill(null).map(function(_,ci){
      var members=zRows.filter(function(_,i){return assignments[i]===ci;});
      if(!members.length) return centroids[ci];
      var p=members[0].length;
      return Array(p).fill(0).map(function(_,j){return members.reduce(function(s,r){return s+r[j];},0)/members.length;});
    });
  }

  // Compute WSS per cluster and BSS
  var grandCentroid=Array(varNames.length).fill(0).map(function(_,j){return zRows.reduce(function(s,r){return s+r[j];},0)/n;});
  var clusterData=Array(k).fill(null).map(function(_,ci){
    var members=zRows.filter(function(_,i){return assignments[i]===ci;});
    var originalMembers=rows.filter(function(_,i){return assignments[i]===ci;});
    var centroid=centroids[ci];
    var wss=members.reduce(function(s,r){return s+r.reduce(function(ss,x,j){return ss+(x-centroid[j])*(x-centroid[j]);},0);},0);
    var rawMeans=varNames.map(function(v){var vs=originalMembers.map(function(r){return Number(r[v]);});return vs.length?f4(vs.reduce(function(s,x){return s+x;},0)/vs.length):NaN;});
    return {n:members.length,wss:f4(wss),centroid:centroid,rawMeans:rawMeans,pct:+(members.length/n*100).toFixed(1)};
  });

  var totalWSS=f4(clusterData.reduce(function(s,c){return s+c.wss;},0));
  var totalBSS=f4(centroids.reduce(function(s,c,ci){return s+clusterData[ci].n*c.reduce(function(ss,x,j){return ss+(x-grandCentroid[j])*(x-grandCentroid[j]);},0);},0));

  // Silhouette
  function silScore(){
    if(k===1) return 0;
    var sils=zRows.map(function(zr,i){
      var ci=assignments[i];
      var sameCluster=zRows.filter(function(_,j){return j!==i&&assignments[j]===ci;});
      var a=sameCluster.length?sameCluster.reduce(function(s,r){return s+Math.sqrt(zr.reduce(function(ss,x,j){return ss+(x-r[j])*(x-r[j]);},0));},0)/sameCluster.length:0;
      var b=Infinity;
      for(var c=0;c<k;c++){
        if(c===ci) continue;
        var otherCluster=zRows.filter(function(_,j){return assignments[j]===c;});
        if(!otherCluster.length) continue;
        var bd=otherCluster.reduce(function(s,r){return s+Math.sqrt(zr.reduce(function(ss,x,j){return ss+(x-r[j])*(x-r[j]);},0));},0)/otherCluster.length;
        if(bd<b) b=bd;
      }
      var maxAB=Math.max(a,b);
      return maxAB>0?(b-a)/maxAB:0;
    });
    return f4(sils.reduce(function(s,v){return s+v;},0)/sils.length);
  }

  var silhouette=silScore();

  // ANOVA per variable
  var anova=varNames.map(function(v,vi){
    var groupVals=Array(k).fill(null).map(function(){return [];});
    rows.forEach(function(r,i){groupVals[assignments[i]].push(Number(r[v]));});
    var allVals=rows.map(function(r){return Number(r[v]);});
    var gMean=allVals.reduce(function(s,x){return s+x;},0)/allVals.length;
    var ssB=groupVals.reduce(function(s,gv){var gm=gv.reduce(function(ss,x){return ss+x;},0)/(gv.length||1);return s+gv.length*(gm-gMean)*(gm-gMean);},0);
    var ssW=groupVals.reduce(function(s,gv){var gm=gv.reduce(function(ss,x){return ss+x;},0)/(gv.length||1);return s+gv.reduce(function(ss,x){return ss+(x-gm)*(x-gm);},0);},0);
    var df1=k-1,df2=n-k;
    var F=df2>0&&ssW>0?(ssB/df1)/(ssW/df2):NaN;
    var pval=NaN;
    try{pval=1-regularizedGammaP?1-fCDF(F,df1,df2):NaN;}catch(e){}
    try{if(typeof fCDF==='function')pval=1-fCDF(F,df1,df2);}catch(e){}
    return {variable:v,F:f4(F),df1,df2,p:pval,p_fmt:isFinite(pval)?(pval<.001?'<.001':pval.toFixed(3)):'—'};
  });

  // Elbow: run k=2..8 quickly (fewer iterations).
  // _noElbow=true untuk panggilan internal ini — tanpa itu tiap panggilan menjalankan
  // elbow lagi dan rekursi tidak pernah berhenti (tab membeku).
  var elbowData=[];
  for(var ek=2;!_noElbow&&ek<=Math.min(8,Math.floor(n/2));ek++){
    try{
      var ekRes=computeKMeans(dataArr,varNames,ek,20,true);
      elbowData.push({k:ek,wss:ekRes.totalWSS});
    }catch(e){break;}
  }

  var plotData=zRows.map(function(zr,i){return {x:zr[0]||0,y:zr.length>1?zr[1]:0,cluster:assignments[i]};});

  return {
    method:'kmeans',n,k,vars:varNames,
    clusters:clusterData.map(function(c,i){return {label:'C'+(i+1),n:c.n,pct:c.pct,centroid:c.centroid.map(f4),rawMeans:c.rawMeans};}),
    totalWSS,totalBSS,silhouette,anova,elbowData,plotData,assignments
  };
}

function computeHierarchical(dataArr, varNames, k, linkage){
  var f4=function(v){return isFinite(v)?+(+v).toFixed(4):NaN;};
  var isV=function(v){return typeof v==='number'&&isFinite(v);};
  var rows=dataArr.filter(function(r){return varNames.every(function(v){return isV(Number(r[v]));});});
  var n=rows.length;
  if(n<4) throw new Error('Need ≥4 complete cases');
  if(n>200) rows=rows.slice(0,200); // cap for performance

  // Standardize
  var means=varNames.map(function(v){var vs=rows.map(function(r){return Number(r[v]);});return vs.reduce(function(s,x){return s+x;},0)/vs.length;});
  var stds=varNames.map(function(v,vi){var vs=rows.map(function(r){return Number(r[v]);});var m=means[vi];return Math.sqrt(vs.reduce(function(s,x){return s+(x-m)*(x-m);},0)/(vs.length-1))||1;});
  var zRows=rows.map(function(r){return varNames.map(function(v,vi){return (Number(r[v])-means[vi])/stds[vi];});});
  var nn=zRows.length;

  // Distance matrix
  var dist=[];
  for(var i=0;i<nn;i++){dist[i]=[];for(var j=0;j<nn;j++){dist[i][j]=i===j?0:Math.sqrt(zRows[i].reduce(function(s,x,k){return s+(x-zRows[j][k])*(x-zRows[j][k]);},0));}}

  // Agglomerative clustering
  var clusters=Array(nn).fill(null).map(function(_,i){return [i];});
  var mergeHistory=[];
  var active=Array(nn).fill(true);

  function clusterDist(ci,cj){
    var vi=clusters[ci],vj=clusters[cj];
    if(linkage==='single'){
      var minD=Infinity;
      vi.forEach(function(a){vj.forEach(function(b){if(dist[a][b]<minD)minD=dist[a][b];});});
      return minD;
    } else if(linkage==='complete'){
      var maxD=0;
      vi.forEach(function(a){vj.forEach(function(b){if(dist[a][b]>maxD)maxD=dist[a][b];});});
      return maxD;
    } else if(linkage==='average'){
      var s=0,cnt=0;
      vi.forEach(function(a){vj.forEach(function(b){s+=dist[a][b];cnt++;});});
      return cnt?s/cnt:Infinity;
    } else { // ward
      var ni=vi.length,nj=vj.length;
      var mi=Array(varNames.length).fill(0).map(function(_,d){return vi.reduce(function(s,r){return s+zRows[r][d];},0)/ni;});
      var mj=Array(varNames.length).fill(0).map(function(_,d){return vj.reduce(function(s,r){return s+zRows[r][d];},0)/nj;});
      var d2=mi.reduce(function(s,x,d){return s+(x-mj[d])*(x-mj[d]);},0);
      return Math.sqrt(ni*nj/(ni+nj)*d2);
    }
  }

  for(var step=0;step<nn-1;step++){
    var minD=Infinity,mergeI=-1,mergeJ=-1;
    var actIdx=[];for(var i=0;i<clusters.length;i++)if(active[i])actIdx.push(i);
    for(var ai=0;ai<actIdx.length;ai++)for(var aj=ai+1;aj<actIdx.length;aj++){
      var d=clusterDist(actIdx[ai],actIdx[aj]);
      if(d<minD){minD=d;mergeI=actIdx[ai];mergeJ=actIdx[aj];}
    }
    if(mergeI<0) break;
    clusters[mergeI]=clusters[mergeI].concat(clusters[mergeJ]);
    mergeHistory.push({left:mergeI,right:mergeJ,dist:f4(minD),size:clusters[mergeI].length});
    active[mergeJ]=false;
  }

  // Cut at k clusters: take top k active merges
  var assignments=new Array(nn).fill(0);
  var clState=Array(nn).fill(null).map(function(_,i){return [i];});
  var clActive=Array(nn).fill(true);
  var clCount=nn;
  for(var step=0;step<mergeHistory.length;step++){
    if(clCount<=k) break;
    var m=mergeHistory[step];
    clState[m.left]=clState[m.left].concat(clState[m.right]);
    clActive[m.right]=false;
    clCount--;
  }
  var clLabels=[];
  for(var i=0;i<clState.length;i++)if(clActive[i])clLabels.push(i);
  clLabels.forEach(function(ci,label){clState[ci].forEach(function(ri){assignments[ri]=label;});});
  var actualK=clLabels.length;

  // Cluster stats
  var clusterData=Array(actualK).fill(null).map(function(_,ci){
    var members=rows.filter(function(_,i){return assignments[i]===ci;});
    var rawMeans=varNames.map(function(v){var vs=members.map(function(r){return Number(r[v]);});return vs.length?f4(vs.reduce(function(s,x){return s+x;},0)/vs.length):NaN;});
    return {label:'C'+(ci+1),n:members.length,pct:+(members.length/nn*100).toFixed(1),rawMeans:rawMeans};
  });

  // Silhouette
  var sils=zRows.map(function(zr,i){
    if(actualK===1) return 0;
    var ci=assignments[i];
    var sameCluster=zRows.filter(function(_,j){return j!==i&&assignments[j]===ci;});
    var a=sameCluster.length?sameCluster.reduce(function(s,r){return s+Math.sqrt(zr.reduce(function(ss,x,j){return ss+(x-r[j])*(x-r[j]);},0));},0)/sameCluster.length:0;
    var b=Infinity;
    for(var c=0;c<actualK;c++){
      if(c===ci) continue;
      var oc=zRows.filter(function(_,j){return assignments[j]===c;});
      if(!oc.length) continue;
      var bd=oc.reduce(function(s,r){return s+Math.sqrt(zr.reduce(function(ss,x,j){return ss+(x-r[j])*(x-r[j]);},0));},0)/oc.length;
      if(bd<b) b=bd;
    }
    var mx=Math.max(a,b);
    return mx>0?(b-a)/mx:0;
  });
  var silhouette=f4(sils.reduce(function(s,v){return s+v;},0)/sils.length);

  // ANOVA per variable
  var anova=varNames.map(function(v){
    var groupVals=Array(actualK).fill(null).map(function(){return [];});
    rows.forEach(function(r,i){groupVals[assignments[i]].push(Number(r[v]));});
    var allVals=rows.map(function(r){return Number(r[v]);});
    var gMean=allVals.reduce(function(s,x){return s+x;},0)/allVals.length;
    var ssB=groupVals.reduce(function(s,gv){if(!gv.length)return s;var gm=gv.reduce(function(ss,x){return ss+x;},0)/gv.length;return s+gv.length*(gm-gMean)*(gm-gMean);},0);
    var ssW=groupVals.reduce(function(s,gv){if(!gv.length)return s;var gm=gv.reduce(function(ss,x){return ss+x;},0)/gv.length;return s+gv.reduce(function(ss,x){return ss+(x-gm)*(x-gm);},0);},0);
    var df1=actualK-1,df2=nn-actualK;
    var F=df2>0&&ssW>0?(ssB/df1)/(ssW/df2):NaN;
    var pval=NaN;
    try{if(typeof fCDF==='function')pval=1-fCDF(F,df1,df2);}catch(e){}
    return {variable:v,F:f4(F),df1,df2,p:pval,p_fmt:isFinite(pval)?(pval<.001?'<.001':pval.toFixed(3)):'—'};
  });

  var plotData=zRows.map(function(zr,i){return {x:zr[0]||0,y:zr.length>1?zr[1]:0,cluster:assignments[i]};});

  return {
    method:'hierarchical',n:nn,k:actualK,vars:varNames,linkage,
    clusters:clusterData,silhouette,anova,plotData,assignments,
    dendro:mergeHistory
  };
}
