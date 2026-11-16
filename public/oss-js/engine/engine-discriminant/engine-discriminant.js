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
