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
