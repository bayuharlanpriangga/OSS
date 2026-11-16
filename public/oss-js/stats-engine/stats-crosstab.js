// Chi-Square Test of Independence
function chiSquare(mat,rT,cT,N){
   let chi2=0;
   const exp=mat.map((row,i)=>row.map((_,j)=>rT[i]*cT[j]/N));
   mat.forEach((row,i)=>row.forEach((O,j)=>{const E=exp[i][j];if(E>0)chi2+=(O-E)*(O-E)/E;}));
   const df=(mat.length-1)*(mat[0].length-1);
   const p=chi2P(chi2,df);
   const minD=Math.min(mat.length,mat[0].length)-1;
   const V=minD>0&&N>0?Math.sqrt(chi2/(N*minD)):NaN;
   const lowFreqCells=exp.flat().filter(v=>v<5).length;
   const chiWarnings=[];
   if(lowFreqCells>0){
     const pct=Math.round(100*lowFreqCells/exp.flat().length);
     if(pct>20) chiWarnings.push({level:'error',msg:pct+'% of cells have expected frequency <5. Use Fisher exact or merge categories.'});
     else chiWarnings.push({level:'warn',msg:lowFreqCells+' cell(s) with expected frequency <5 — interpret chi-square with caution.'});
   }
       return{chi2:f4(chi2),df,p:f4(p),p_fmt:pFmt(p),sig:p<.05,V:f4(V),
     Vinterp:V<.1?'Negligible':V<.3?'Small':V<.5?'Medium':'Large',exp,lowFreqCells,warnings:chiWarnings};
 }

// Fisher Exact Test for 2x2 tables
// P = C(r1,a)*C(r2,c) / C(n,c1) — hypergeometric
function fisherExact(a, b, c, d) {
  const n = a + b + c + d, r1 = a + b, r2 = c + d, c1 = a + c, c2 = b + d;
  function lnFact(k) { let s = 0; for (let i = 2; i <= k; i++) s += Math.log(i); return s; }
  const lnC = lnFact(r1) + lnFact(r2) + lnFact(c1) + lnFact(c2) - lnFact(n);
  const aMin = Math.max(0, r1 - c2), aMax = Math.min(r1, c1);
  const pObs = Math.exp(lnC - lnFact(a) - lnFact(b) - lnFact(c) - lnFact(d));
  let pVal = 0;
  for (let ai = aMin; ai <= aMax; ai++) {
    const bi = r1 - ai, ci_ = c1 - ai, di = r2 - ci_;
    if (bi < 0 || ci_ < 0 || di < 0) continue;
    const p = Math.exp(lnC - lnFact(ai) - lnFact(bi) - lnFact(ci_) - lnFact(di));
    if (p <= pObs + 1e-10) pVal += p;
  }
  const p = Math.min(1, pVal);
  const OR = f4((a * d) / Math.max(b * c, 0.0001));
  return { p: f4(p), p_fmt: pFmt(p), sig: p < .05, OR };
}

