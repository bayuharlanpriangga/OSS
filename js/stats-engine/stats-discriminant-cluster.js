// DISCRIMINANT ANALYSIS (LDA)
function computeLDA(groupVar, predVars, dataArr){
  var f4=function(v){return isFinite(v)?+(+v).toFixed(4):NaN;};
  var pFmt=function(p){if(!isFinite(p))return '—';if(p<.001)return '<.001';return p.toFixed(3);};
  var isV=function(v){return typeof v==='number'&&isFinite(v);};

  // Filter complete cases
  var rows=dataArr.filter(function(r){
    if(r[groupVar]===null||r[groupVar]===undefined||r[groupVar]==='') return false;
    return predVars.every(function(p){return isV(Number(r[p]));});
  });
  var n=rows.length;
  if(n<10) throw new Error('Need ≥10 complete cases (have '+n+')');

  var groups=[...new Set(rows.map(function(r){return String(r[groupVar]);}))].sort();
  var g=groups.length;
  if(g<2) throw new Error('Grouping variable must have ≥2 groups');
  var p=predVars.length;
  if(p<1) throw new Error('Select ≥1 predictor');
  var nFunctions=Math.min(g-1,p);

  // Group stats
  var groupStats=groups.map(function(grp){
    var gRows=rows.filter(function(r){return String(r[groupVar])===grp;});
    var means=predVars.map(function(v){
      var vs=gRows.map(function(r){return Number(r[v]);});
      return f4(vs.reduce(function(s,x){return s+x;},0)/vs.length);
    });
    return {label:grp,n:gRows.length,means:means,rows:gRows};
  });

  // Grand means
  var grandMeans=predVars.map(function(v){
    var vs=rows.map(function(r){return Number(r[v]);});
    return vs.reduce(function(s,x){return s+x;},0)/vs.length;
  });

  // Within-group scatter matrix W (p×p)
  var W=[];
  for(var i=0;i<p;i++){W[i]=[];for(var j=0;j<p;j++)W[i][j]=0;}
  groupStats.forEach(function(gs){
    gs.rows.forEach(function(r){
      predVars.forEach(function(vi,ii){
        predVars.forEach(function(vj,jj){
          W[ii][jj]+=(Number(r[vi])-gs.means[ii])*(Number(r[vj])-gs.means[jj]);
        });
      });
    });
  });

  // Between-group scatter matrix B (p×p)
  var B=[];
  for(var i=0;i<p;i++){B[i]=[];for(var j=0;j<p;j++)B[i][j]=0;}
  groupStats.forEach(function(gs){
    predVars.forEach(function(vi,ii){
      predVars.forEach(function(vj,jj){
        B[ii][jj]+=gs.n*(gs.means[ii]-grandMeans[ii])*(gs.means[jj]-grandMeans[jj]);
      });
    });
  });

  // Compute W^-1 * B via simple power iteration for eigenvalues (up to 4 functions)
  // Use Jacobi method for symmetric matrix eigen decomposition on W^-1 B
  function matMul(A,B){
    var n=A.length,m=B[0].length,k=B.length;
    var C=[];for(var i=0;i<n;i++){C[i]=[];for(var j=0;j<m;j++){C[i][j]=0;for(var l=0;l<k;l++)C[i][j]+=A[i][l]*B[l][j];}}
    return C;
  }
  function matInv(M){
    var n=M.length;
    var A=M.map(function(r){return r.slice();});
    var I=[];for(var i=0;i<n;i++){I[i]=[];for(var j=0;j<n;j++)I[i][j]=(i===j?1:0);}
    for(var col=0;col<n;col++){
      var pivotRow=col;
      for(var row=col+1;row<n;row++) if(Math.abs(A[row][col])>Math.abs(A[pivotRow][col])) pivotRow=row;
      var tmp=A[col];A[col]=A[pivotRow];A[pivotRow]=tmp;
      tmp=I[col];I[col]=I[pivotRow];I[pivotRow]=tmp;
      var piv=A[col][col];
      if(Math.abs(piv)<1e-14) throw new Error('Matrix is singular — predictors may be collinear');
      for(var j=0;j<n;j++){A[col][j]/=piv;I[col][j]/=piv;}
      for(var row=0;row<n;row++){if(row===col)continue;var f=A[row][col];for(var j=0;j<n;j++){A[row][j]-=f*A[col][j];I[row][j]-=f*I[col][j];}}
    }
    return I;
  }

  var Winv=matInv(W);
  var WinvB=matMul(Winv,B);

  // Power iteration to get top nFunctions eigenvectors
  function powerIter(M, k){
    var n=M.length;
    var eigVals=[],eigVecs=[];
    var Mcopy=M.map(function(r){return r.slice();});
    for(var ef=0;ef<k;ef++){
      var v=Array(n).fill(0).map(function(_,i){return i===0?1:Math.random()-.5;});
      for(var iter=0;iter<300;iter++){
        var Mv=Mcopy.map(function(row){return row.reduce(function(s,x,j){return s+x*v[j];},0);});
        var norm=Math.sqrt(Mv.reduce(function(s,x){return s+x*x;},0))||1;
        v=Mv.map(function(x){return x/norm;});
      }
      var lam=Mcopy.map(function(row){return row.reduce(function(s,x,j){return s+x*v[j];},0);}).reduce(function(s,x,j){return s+x*v[j];},0);
      eigVals.push(lam);eigVecs.push(v);
      // Deflate
      Mcopy=Mcopy.map(function(row,i){return row.map(function(x,j){return x-lam*v[i]*v[j];});});
    }
    return {vals:eigVals,vecs:eigVecs};
  }

  var eig=powerIter(WinvB,nFunctions);
  var eigVals=eig.vals.map(function(v){return Math.max(0,v);});
  var eigVecs=eig.vecs;
  var totalEig=eigVals.reduce(function(s,v){return s+v;},0)||1;
  var cumPct=0;

  var eigenvalues=eigVals.map(function(ev,i){
    var pct=+(ev/totalEig*100).toFixed(1);
    cumPct+=pct;
    return {eigenvalue:f4(ev),pctVar:pct,cumPct:+(cumPct).toFixed(1),canonicalR:f4(Math.sqrt(ev/(1+ev)))};
  });

  // Standardized coefficients: scale eigenvectors by within-group std
  var pooledVar=predVars.map(function(v,vi){return W[vi][vi]/(n-g);});
  var stdCoefs=eigVecs.map(function(vec){
    return vec.map(function(c,vi){return f4(c*Math.sqrt(pooledVar[vi]));});
  });

  // Structure matrix: correlation of each predictor with each discriminant function score
  // Compute discriminant scores for each row
  var scores=rows.map(function(r){
    return eigVecs.map(function(vec){
      return vec.reduce(function(s,c,vi){return s+c*Number(r[predVars[vi]]);},0);
    });
  });

  // Structure matrix via correlation
  var structureMatrix=eigVecs.map(function(vec,fi){
    var funcScores=scores.map(function(s){return s[fi];});
    var fMean=funcScores.reduce(function(s,v){return s+v;},0)/funcScores.length;
    var fStd=Math.sqrt(funcScores.reduce(function(s,v){return s+(v-fMean)*(v-fMean);},0)/(funcScores.length-1))||1;
    return predVars.map(function(v,vi){
      var vals=rows.map(function(r){return Number(r[v]);});
      var vMean=vals.reduce(function(s,x){return s+x;},0)/vals.length;
      var vStd=Math.sqrt(vals.reduce(function(s,x){return s+(x-vMean)*(x-vMean);},0)/(vals.length-1))||1;
      var cov=funcScores.reduce(function(s,fs,i){return s+(fs-fMean)*(vals[i]-vMean);},0)/(funcScores.length-1);
      return f4(cov/(fStd*vStd));
    });
  });

  // Classification using nearest centroid in discriminant space
  var groupCentroids=groupStats.map(function(gs){
    return eigVecs.map(function(vec){
      return vec.reduce(function(s,c,vi){return s+c*gs.means[vi];},0);
    });
  });

  var predicted=rows.map(function(r){
    var sc=eigVecs.map(function(vec){
      return vec.reduce(function(s,c,vi){return s+c*Number(r[predVars[vi]]);},0);
    });
    var minDist=Infinity,bestG=0;
    groupCentroids.forEach(function(gc,gi){
      var dist=gc.reduce(function(s,c,fi){return s+(c-sc[fi])*(c-sc[fi]);},0);
      if(dist<minDist){minDist=dist;bestG=gi;}
    });
    return groups[bestG];
  });

  // Classification table
  var classTable=groups.map(function(ag,ai){
    var actualRows=rows.filter(function(r,ri){return String(r[groupVar])===ag;});
    var counts=groups.map(function(pg){
      return actualRows.filter(function(r,ri){
        var ri2=rows.indexOf(r);
        return predicted[ri2]===pg;
      }).length;
    });
    var correct=counts[ai];
    var total=counts.reduce(function(s,v){return s+v;},0);
    return {counts:counts,pctCorrect:total>0?+(correct/total*100).toFixed(1):0};
  });

  var totalCorrect=classTable.reduce(function(s,row,i){return s+row.counts[i];},0);
  var accuracy=+(totalCorrect/n*100).toFixed(1);

  // Wilks' Lambda and chi-square test
  var wilksLambda=eigVals.reduce(function(prod,ev){return prod*(1/(1+ev));},1);
  var dfW_chi=predVars.length*(groups.length-1);
  var chiSq=-(n-1-(predVars.length+groups.length)/2)*Math.log(wilksLambda);
  var wilksP=pFmt(SE.chi2CDF?1-SE.chi2CDF(chiSq,dfW_chi):NaN);
  // Try to compute p using chi2 CDF
  try{
    var pval=1-regularizedGammaP(dfW_chi/2,chiSq/2);
    wilksP=pFmt(pval);
  }catch(e){}

  return {
    n,groups,preds:predVars,nFunctions,
    groupStats:groupStats.map(function(gs){return {label:gs.label,n:gs.n,means:gs.means};}),
    eigenvalues,stdCoefs,structureMatrix,
    wilksLambda:f4(wilksLambda),wilksP,
    accuracy,classTable,
    scores:scores.slice(0,Math.min(scores.length,300))
  };
}

// CLUSTER ANALYSIS (K-Means & Hierarchical)
function computeKMeans(dataArr, varNames, k, maxIter){
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
  // First centroid random
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
    // Assign
    zRows.forEach(function(zr,i){
      var minD=Infinity,best=0;
      centroids.forEach(function(c,ci){var d=zr.reduce(function(s,x,j){return s+(x-c[j])*(x-c[j]);},0);if(d<minD){minD=d;best=ci;}});
      if(assignments[i]!==best){assignments[i]=best;changed=true;}
    });
    if(!changed) break;
    // Update centroids
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

  // Elbow: run k=2..8 quickly (fewer iterations)
  var elbowData=[];
  for(var ek=2;ek<=Math.min(8,Math.floor(n/2));ek++){
    try{
      var ekRes=computeKMeans(dataArr,varNames,ek,20);
      elbowData.push({k:ek,wss:ekRes.totalWSS});
    }catch(e){break;}
  }

  // PCA scores for 2D plot (simple: use first 2 variables in z-space)
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
  var ids=Array(nn).fill(null).map(function(_,i){return i;});

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
  var cutActive=Array(clusters.length).fill(false);
  var assignments=new Array(nn).fill(0);
  // Replay merges but stop when we have k clusters
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