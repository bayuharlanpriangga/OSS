// Mann-Whitney U — exact p for small n (na+nb <= 20), asymptotic otherwise
function mwExactDist(na,nb){
  // Enumerate all possible U values for na items chosen from na+nb
  // P(U=u) via dynamic programming: dp[u] = # arrangements with U=u
  const maxU=na*nb;
  const N=na+nb;
  // dp[i][j][u] too expensive; use 1D DP by choosing na positions from N
  // U = sum of ranks(group A) - na*(na+1)/2; ranks are 1..N
  // Equivalent: choose na positions (1-indexed) from {1..N}, U = sum - na*(na+1)/2
  // Use DP: ways[k][u] = # ways to pick k items from first m items summing to u+k*(k+1)/2
  const ways=new Array(na+1).fill(null).map(()=>new Float64Array(maxU+1));
  ways[0][0]=1;
  for(let m=1;m<=N;m++){
    // iterate backwards to avoid using same item twice
    for(let k=Math.min(m,na);k>=1;k--){
      const rankVal=m; // rank of m-th item
      for(let u=maxU;u>=0;u--){
        const prev=u-(rankVal-k); // R1 contribution: rank - already counted offset
        // Cleaner: U1 = R1 - na*(na+1)/2; rank m contributes m to R1 if chosen
        // Use direct R1 DP instead
      }
    }
  }
  // Simpler direct DP on R1 (sum of na chosen ranks from 1..N)
  const minR1=na*(na+1)/2, maxR1=na*(N-nb)+na*(na+1)/2; // actually sum of top na ranks
  const maxR1v=na*N-na*(na-1)/2;
  const dpR=new Float64Array(maxR1v+1);
  dpR[0]=1;
  // DP: choose na ranks from {1..N} without replacement
  // dp2[chosen][R1_so_far]
  const dp2=[];
  dp2[0]=new Float64Array(maxR1v+1); dp2[0][0]=1;
  for(let rank_m=1;rank_m<=N;rank_m++){
    const take=Math.min(rank_m,na);
    for(let k=take;k>=1;k--){
      if(!dp2[k])dp2[k]=new Float64Array(maxR1v+1);
      for(let r=maxR1v;r>=rank_m;r--){
        dp2[k][r]+=(dp2[k-1][r-rank_m]||0);
      }
    }
  }
  const total=dp2[na]||new Float64Array(1);
  // total[r] = # ways to get R1=r
  return{total,minR1,maxR1v,na,nb,maxU};
}

function mannWhitney(a,b){
  req(a.length,2,'MW A');req(b.length,2,'MW B');
  const na=a.length,nb=b.length;
  const all=[...a.map(v=>({v,g:0})),...b.map(v=>({v,g:1}))].sort((x,y)=>x.v-y.v);
  let rank=1;const ranked=[];
  while(rank<=all.length){
    let j=rank;while(j<all.length&&all[j].v===all[rank-1].v)j++;
    const avg=(rank+j)/2;for(let k=rank-1;k<j;k++)ranked.push({...all[k],rank:avg});rank=j+1;
  }
  const R1=ranked.filter(r=>r.g===0).reduce((s,r)=>s+r.rank,0);
  const U1=R1-na*(na+1)/2,U2=na*nb-U1,U=Math.min(U1,U2);
  const N=na+nb;

  // Exact p-value for small samples (no ties, na+nb ≤ 20)
  const hasTies=Object.values(ranked.reduce((m,r)=>{m[r.v]=(m[r.v]||0)+1;return m;},{})).some(c=>c>1);
  let p,z=NaN,method='asymptotic';
  if(N<=20&&!hasTies){
    method='exact';
    const dist=mwExactDist(na,nb);
    const grand=dist.total.reduce((s,v)=>s+v,0)||1;
    // P(U1 <= observed U1 or U2 <= observed) — two-tailed
    // P(U <= u_obs) = P(R1 <= R1_obs) + P(R1 >= R1_max - R1_obs + minR1)
    const r1obs=R1;
    const uObs=U; // smaller U
    // Count arrangements with R1 giving U = min(U1,U2) ≤ uObs
    let count=0;
    for(let r=dist.minR1;r<=dist.maxR1v;r++){
      const u1=r-na*(na+1)/2;
      const u2=na*nb-u1;
      if(Math.min(u1,u2)<=uObs) count+=dist.total[r]||0;
    }
    p=count/grand;
    p=Math.min(1,p);
  } else {
    method='asymptotic';
    const muU=na*nb/2;
    const tieMap={};ranked.forEach(r=>{tieMap[r.v]=(tieMap[r.v]||0)+1;});
    const tieCorr=Object.values(tieMap).reduce((s,t)=>s+(t*t*t-t),0);
    const sigU=Math.sqrt((na*nb/12)*((N+1)-(tieCorr/(N*(N-1)))));
    z=sigU>0?(U-muU)/sigU:0;
    p=2*(1-normCDF(Math.abs(z)));
  }
  return{U:f4(U),U1:f4(U1),U2:f4(U2),z:isFinite(z)?f4(z):'—',p:f4(p),p_fmt:pFmt(p),sig:p<.05,
    r_eff:f4(Math.abs(isFinite(z)?z:0)/Math.sqrt(N)),nA:na,nB:nb,method,
    medA:f4(quantile([...a].sort((x,y)=>x-y),.5)),medB:f4(quantile([...b].sort((x,y)=>x-y),.5))};
}

// Kruskal-Wallis
function kruskalWallis(groups){
  const all=groups.flatMap(g=>g.vals.map(v=>({v,g:g.label}))).sort((a,b)=>a.v-b.v);
  const N=all.length,k=groups.length;req(N,3,'KW');
  let rank=1;const ranked=[];
  while(rank<=all.length){
    let j=rank;while(j<all.length&&all[j].v===all[rank-1].v)j++;
    const avg=(rank+j)/2;for(let x=rank-1;x<j;x++)ranked.push({...all[x],rank:avg});rank=j+1;
  }
  const H=groups.reduce((s,g)=>{
    const Rj=ranked.filter(r=>r.g===g.label).reduce((ss,r)=>ss+r.rank,0);
    return s+(Rj*Rj)/g.vals.length;
  },0);
  const Hstat=(12/(N*(N+1)))*H-3*(N+1);
  const df=k-1,p=chi2P(Hstat,df);
  return{H:f4(Hstat),df,p:f4(p),p_fmt:pFmt(p),sig:p<.05,
    eta2:f4(Math.max(0,(Hstat-k+1)/(N-k))),
    groupStats:groups.map(g=>({label:g.label,n:g.vals.length,
      median:f4(quantile([...g.vals].sort((a,b)=>a-b),.5)),mean:f4(mean(g.vals))}))};
}

// Wilcoxon Signed-Rank — exact p for small n (≤ 25), asymptotic otherwise
function wilcoxon(arr,mu0=0){
  const diffs=validNums(arr.map(v=>v-mu0)).filter(d=>d!==0);
  req(diffs.length,5,'Wilcoxon');
  const n=diffs.length;
  const signed=[...diffs].sort((a,b)=>Math.abs(a)-Math.abs(b));
  let rank=1;const ranked=[];
  while(rank<=signed.length){
    let j=rank;while(j<signed.length&&Math.abs(signed[j])===Math.abs(signed[rank-1]))j++;
    const avg=(rank+j)/2;for(let x=rank-1;x<j;x++)ranked.push({v:signed[x],rank:avg});rank=j+1;
  }
  const Wp=ranked.filter(r=>r.v>0).reduce((s,r)=>s+r.rank,0);
  const Wm=ranked.filter(r=>r.v<0).reduce((s,r)=>s+r.rank,0);
  const W=Math.min(Wp,Wm);

  const hasTies=ranked.some((r,i,arr)=>i>0&&r.rank===arr[i-1].rank);
  let p,z=NaN,method='asymptotic';
  if(n<=25&&!hasTies){
    method='exact';
    // Exact distribution of W+ via DP
    // W+ ranges from 0 to n*(n+1)/2
    const maxW=n*(n+1)/2;
    // dp[w] = # subsets of {1..n} with sum = w
    const dp=new Float64Array(maxW+1);
    dp[0]=1;
    for(let r=1;r<=n;r++){
      for(let w=maxW;w>=r;w--) dp[w]+=dp[w-r];
    }
    const total=Math.pow(2,n);
    // Two-tailed: P(W+ <= W_obs) + P(W+ >= maxW - W_obs) = 2*P(W+ <= min(Wp,Wm))
    const wObs=W; // min(Wp,Wm)
    let count=0;
    for(let w=0;w<=wObs;w++) count+=dp[w];
    p=Math.min(1,2*count/total);
  } else {
    method='asymptotic';
    const muW=n*(n+1)/4;
    const sigW=Math.sqrt(n*(n+1)*(2*n+1)/24);
    z=sigW>0?(W-muW)/sigW:0;
    p=2*(1-normCDF(Math.abs(z)));
  }
  return{W:f4(W),Wplus:f4(Wp),Wminus:f4(Wm),z:isFinite(z)?f4(z):'—',p:f4(p),p_fmt:pFmt(p),sig:p<.05,
    r_eff:f4(Math.abs(isFinite(z)?z:0)/Math.sqrt(n)),n,method};
}

// Cronbach alpha
function cronbachAlpha(matrix){
  const k=matrix.length;req(k,2,'Alpha items');
  const ns=matrix[0].length;req(ns,2,'Alpha cases');
  const totalScores=Array.from({length:ns},(_,i)=>matrix.reduce((s,col)=>s+col[i],0));
  const sumItemVar=matrix.reduce((s,col)=>s+vari(col),0);
  const totalVar=vari(totalScores);
  const alpha=totalVar>0?(k/(k-1))*(1-sumItemVar/totalVar):NaN;
  const interp=alpha>=.9?'Excellent':alpha>=.8?'Good':alpha>=.7?'Acceptable':alpha>=.6?'Questionable':alpha>=.5?'Poor':'Unacceptable';
  // Item-total correlations (corrected: item vs rest-of-scale)
  const itemStats=matrix.map((col,i)=>{
    const restScores=Array.from({length:ns},(_,j)=>totalScores[j]-col[j]);
    const mc=mean(col),mr=mean(restScores),sc_=std(col),sr=std(restScores);
    let cov=0;for(let j=0;j<ns;j++) cov+=(col[j]-mc)*(restScores[j]-mr);
    cov/=ns;
    const rit=(sc_>0&&sr>0)?cov/(sc_*sr):0;
    // Alpha if item deleted
    const rem=matrix.filter((_,ii)=>ii!==i);
    const remTot=Array.from({length:ns},(_,j)=>rem.reduce((s,c)=>s+c[j],0));
    const remSV=rem.reduce((s,c)=>s+vari(c),0);
    const remTV=vari(remTot);
    const aid=remTV>0&&rem.length>1?((k-1)/(k-2))*(1-remSV/remTV):NaN;
    return{rit:f4(rit),alphaIfDeleted:f4(aid),
      flag:rit<0.3?'Low (consider removing)':rit<0.5?'Acceptable':'Good'};
  });
  return{alpha:f4(alpha),k,n:ns,interp,itemStats};
}

// Cohen's Kappa — inter-rater reliability
function cohenKappa(rater1, rater2) {
  const n = rater1.length;
  req(n, 2, 'Kappa cases');
  if (n !== rater2.length) throw new Error('Raters must have same length');
  // Get unique categories (sorted)
  const cats = [...new Set([...rater1, ...rater2])].sort(function(a,b){return String(a)<String(b)?-1:1;});
  const k = cats.length;
  if (k < 2) throw new Error('Need ≥2 categories');
  // Build confusion matrix
  const mat = cats.map(function(){ return cats.map(function(){ return 0; }); });
  for (let i = 0; i < n; i++) {
    const r = cats.indexOf(rater1[i]);
    const c = cats.indexOf(rater2[i]);
    if (r >= 0 && c >= 0) mat[r][c]++;
  }
  // Row sums, col sums
  const rowSum = mat.map(function(row){ return row.reduce(function(a,b){return a+b;},0); });
  const colSum = cats.map(function(_,j){ return mat.reduce(function(s,row){return s+row[j];},0); });
  const total = rowSum.reduce(function(a,b){return a+b;},0);
  // Observed agreement (Po)
  let po = 0;
  for (let i = 0; i < k; i++) po += mat[i][i];
  po /= total;
  // Expected agreement (Pe)
  let pe = 0;
  for (let i = 0; i < k; i++) pe += (rowSum[i] / total) * (colSum[i] / total);
  // Kappa
  const kappa = pe < 1 ? (po - pe) / (1 - pe) : 1;
  // SE of kappa (Fleiss 1971)
  let varK = 0;
  for (let i = 0; i < k; i++) {
    varK += (mat[i][i] / total) * Math.pow(1 - (rowSum[i] + colSum[i]) / total * (1 - kappa), 2);
  }
  // Add off-diagonal terms
  for (let i = 0; i < k; i++) {
    for (let j = 0; j < k; j++) {
      if (i === j) continue;
      varK += (mat[i][j] / total) * Math.pow((rowSum[i] + colSum[j]) / total, 2);
    }
  }
  varK = varK - Math.pow(kappa - pe * (1 - kappa), 2);
  const seK = total > 0 ? Math.sqrt(Math.abs(varK) / total) : 0;
  // Z-test for kappa > 0
  const z = seK > 0 ? kappa / seK : 0;
  const p = 2 * (1 - normCDF(Math.abs(z)));
  // 95% CI
  const ci95lo = kappa - 1.96 * seK;
  const ci95hi = kappa + 1.96 * seK;
  // Weighted kappa (linear weights for ordinal, if all cats are numeric)
  const allNum = cats.every(function(c){ return !isNaN(Number(c)); });
  let wKappa = null;
  if (allNum && k >= 2) {
    const catsN = cats.map(Number);
    const range = Math.max(...catsN) - Math.min(...catsN);
    // Linear weights: w_ij = 1 - |i-j|/(k-1)
    let poW = 0, peW = 0;
    for (let i = 0; i < k; i++) {
      for (let j = 0; j < k; j++) {
        const w = 1 - Math.abs(catsN[i] - catsN[j]) / (range || 1);
        poW += w * mat[i][j] / total;
        peW += w * (rowSum[i] / total) * (colSum[j] / total);
      }
    }
    wKappa = peW < 1 ? (poW - peW) / (1 - peW) : 1;
  }
  // Interpretation (Landis & Koch 1977)
  function interp(k) {
    if (k < 0)   return 'Poor (< chance)';
    if (k < 0.2) return 'Slight';
    if (k < 0.4) return 'Fair';
    if (k < 0.6) return 'Moderate';
    if (k < 0.8) return 'Substantial';
    return 'Almost Perfect';
  }
  // Per-category agreement stats
  const catStats = cats.map(function(cat, i) {
    const tp = mat[i][i];
    const fp = colSum[i] - tp;
    const fn_ = rowSum[i] - tp;
    const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
    const recall    = (tp + fn_) > 0 ? tp / (tp + fn_) : 0;
    return { cat: String(cat), n: rowSum[i], tp, fp, fn: fn_, precision: f4(precision), recall: f4(recall) };
  });
  return {
    kappa: f4(kappa), seK: f4(seK), z: f4(z), p: f4(p), pFmt: pFmt(p),
    ci95lo: f4(ci95lo), ci95hi: f4(ci95hi),
    po: f4(po), pe: f4(pe),
    n: total, k,
    wKappa: wKappa !== null ? f4(wKappa) : null,
    cats, mat, rowSum, colSum,
    catStats,
    interp: interp(kappa),
    interpW: wKappa !== null ? interp(wKappa) : null,
  };
}

// Chi-square
 // Fisher Exact Test for 2x2 tables
// P = C(r1,a)*C(r2,c) / C(n,c1) — hypergeometric
function fisherExact(a,b,c,d){
  const n=a+b+c+d, r1=a+b, r2=c+d, c1=a+c, c2=b+d;
  function lnFact(k){let s=0;for(let i=2;i<=k;i++)s+=Math.log(i);return s;}
  const lnC=lnFact(r1)+lnFact(r2)+lnFact(c1)+lnFact(c2)-lnFact(n);
  const aMin=Math.max(0,r1-c2), aMax=Math.min(r1,c1);
  const pObs=Math.exp(lnC-lnFact(a)-lnFact(b)-lnFact(c)-lnFact(d));
  let pVal=0;
  for(let ai=aMin;ai<=aMax;ai++){
    const bi=r1-ai,ci_=c1-ai,di=r2-ci_;
    if(bi<0||ci_<0||di<0) continue;
    const p=Math.exp(lnC-lnFact(ai)-lnFact(bi)-lnFact(ci_)-lnFact(di));
    if(p<=pObs+1e-10) pVal+=p;
  }
  const p=Math.min(1,pVal);
  const OR=f4((a*d)/Math.max(b*c,0.0001));
  return{p:f4(p),p_fmt:pFmt(p),sig:p<.05,OR};
}

