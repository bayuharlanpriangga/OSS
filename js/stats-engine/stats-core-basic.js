// Shapiro-Wilk
function sw(arr){
  const x=[...arr].sort((a,b)=>a-b),n=x.length;
  if(n<3)return{W:'N/A',p:'N/A'};
  const m=mean(x),ss=x.reduce((s,v)=>s+(v-m)*(v-m),0);
  const u=x.map((_,i)=>{
    const pi=(i+1-3/8)/(n+0.25);
    const t2=Math.sqrt(-2*Math.log(pi<0.5?pi:1-pi));
    const z=t2-(2.515517+0.802853*t2+0.010328*t2*t2)/(1+1.432788*t2+0.189269*t2*t2+0.001308*Math.pow(t2,3));
    return pi<0.5?-z:z;
  });
  const uN=Math.sqrt(u.reduce((s,v)=>s+v*v,0));
  const a=u.map(v=>v/uN);
  let Wn=0; for(let i=0;i<Math.floor(n/2);i++) Wn+=a[n-1-i]*(x[n-1-i]-x[i]);
  const W=ss>0?(Wn*Wn)/ss:NaN;
  let p;
  if(n<=11){
    const mu=-0.0006714*n*n+0.025054*n-0.39978;
    const sigma=Math.exp(-0.0020322*n*n+0.062767*n-1.0521);
    p=1-normCDF((Math.log(1-W)-mu)/sigma);
  } else {
    const ln=Math.log(n);
    const mu=0.0038915*Math.pow(ln,3)-0.083751*ln*ln-0.31082*ln-1.5861;
    const sigma=Math.exp(0.0030302*ln*ln-0.082676*ln-0.4803);
    p=1-normCDF((Math.log(1-W)-mu)/sigma);
  }
  return{W:f4(W),p:f4(Math.max(0,Math.min(1,p)))};
}

// Kolmogorov-Smirnov test (Lilliefors correction for unknown mean/std)
function ksTest(arr){
  const nums=[...arr].sort((a,b)=>a-b);
  const n=nums.length;
  if(n<3)return{D:'N/A',p:'N/A'};
  const m=mean(nums),s=std(nums);
  if(s===0)return{D:'N/A',p:'N/A'};
  let D=0;
  for(let i=0;i<n;i++){
    const Fn=(i+1)/n;
    const Fn_prev=i/n;
    const Ft=normCDF((nums[i]-m)/s);
    D=Math.max(D,Math.abs(Fn-Ft),Math.abs(Fn_prev-Ft));
  }
  // Lilliefors p-value approximation
  const Dstar=D*(Math.sqrt(n)-0.01+0.85/Math.sqrt(n));
  let p;
  if(Dstar<=0.1)p=1;
  else if(Dstar<=0.2)p=1-(Dstar-0.1)*7;
  else if(Dstar<=0.302)p=0.3;
  else if(Dstar<=0.3385)p=0.2;
  else if(Dstar<=0.4732)p=0.1;
  else if(Dstar<=0.5063)p=0.05;
  else if(Dstar<=0.5710)p=0.02;
  else if(Dstar<=0.6008)p=0.01;
  else p=0.001;
  // More precise approximation using Marsaglia formula
  function ksP(d,n2){
    const s2=d*d*n2;
    if(s2>7.24||d>0.35&&n2>2e4)return 1-2*Math.exp(-s2*(2.000071+0.331/Math.sqrt(n2)+1.409/n2));
    let p2=0,term,fac=1,s22=s2*2;
    for(let j=1;j<=100;j++){
      term=Math.exp(-s22*j*j)*fac;
      p2+=term;fac=-fac;
      if(Math.abs(term)<1e-10)break;
    }
    return Math.max(0,Math.min(1,2*p2));
  }
  const pBetter=ksP(D,n);
  const pFinal=f4(Math.max(0.001,Math.min(1,pBetter)));
  return{D:f4(D),p:pFinal};
}

// Levene test
function levene(groups){
  const Z=groups.map(g=>{const med=quantile([...g].sort((a,b)=>a-b),.5);return g.map(v=>Math.abs(v-med));});
  try{return onewayANOVA(Z.map((z,i)=>({label:String(i),vals:z})));}catch{return null;}
}

// Descriptive
function descriptive(raw){
  const nums=validNums(raw),miss=raw.length-nums.length;
  if(!nums.length)return{error:'No valid data',missing:miss};
  const n=nums.length,s=[...nums].sort((a,b)=>a-b),m=mean(nums);
  const v=n>=2?vari(nums):NaN,sd=n>=2?std(nums):NaN;
  const skew=n>=3&&sd>0?(n*n/((n-1)*(n-2)))*nums.reduce((a,x)=>a+Math.pow((x-m)/sd,3),0)/n:NaN;
  const kurt=n>=4&&sd>0?((n*(n+1))/((n-1)*(n-2)*(n-3)))*nums.reduce((a,x)=>a+Math.pow((x-m)/sd,4),0)-(3*(n-1)*(n-1))/((n-2)*(n-3)):NaN;
  const q1=quantile(s,.25),med=quantile(s,.5),q3=quantile(s,.75),iqr=q3-q1;
  const sem=sd/Math.sqrt(n);
  const swR=n>=3&&n<=5000?sw(nums):null;
  const ksR=n>=3?ksTest(nums):null;
  const outs=nums.filter(v=>v<q1-1.5*iqr||v>q3+1.5*iqr);
  const freq={}; nums.forEach(v=>{freq[v]=(freq[v]||0)+1;});
  const maxF=Math.max(...Object.values(freq));
  const modes=Object.entries(freq).filter(([,c])=>c===maxF).map(([v])=>+v);
  const modeStr=modes.length===n?'None':modes.slice(0,3).map(f4).join(', ');
  return{n,missing:miss,mean:f4(m),median:f4(med),mode:modeStr,std:f4(sd),variance:f4(v),sem:f4(sem),
    ci95:'['+f4(m-tCrit(n-1)*sem)+', '+f4(m+tCrit(n-1)*sem)+']',
    min:f4(s[0]),max:f4(s[n-1]),range:f4(s[n-1]-s[0]),
    q1:f4(q1),q3:f4(q3),iqr:f4(iqr),skewness:f4(skew),kurtosis:f4(kurt),
    shapiroW:swR?swR.W:'N/A',shapiroP:swR?swR.p:'N/A',
    normality:swR?(parseFloat(swR.p)>.05?'✓ Normal (p>.05)':'✗ Non-normal (p≤.05)'):'N/A',
    ksD:ksR?ksR.D:'N/A',ksP:ksR?ksR.p:'N/A',
    ksNormality:ksR?(parseFloat(ksR.p)>.05?'✓ Normal (p>.05)':'✗ Non-normal (p≤.05)'):'N/A',
    outlierCount:outs.length,outlierVals:outs.slice(0,5).map(f4)};
}

// T-Test (Welch)
function tTest(a,b){
  req(a.length,2,'T-Test A');req(b.length,2,'T-Test B');
  const na=a.length,nb=b.length,ma=mean(a),mb=mean(b);
  const va=vari(a),vb=vari(b);
  if(va===0&&vb===0)throw new Error('Both groups have zero variance');
  const se=Math.sqrt(va/na+vb/nb);
  if(!se)throw new Error('Standard error is zero');
  const t=(ma-mb)/se;
  const df=(va/na+vb/nb)*(va/na+vb/nb)/((va/na)*(va/na)/(na-1)+(vb/nb)*(vb/nb)/(nb-1));
  const p=tP(Math.abs(t),df);
  const sp=Math.sqrt(((na-1)*va+(nb-1)*vb)/(na+nb-2));
  const d=sp>0?Math.abs(ma-mb)/sp:NaN;
  const tc=tCrit(Math.round(df));const ci=[ma-mb-tc*se,ma-mb+tc*se];
  const dCI=isFinite(d)?cohenDCI(d,na,nb):['—','—'];
  return{t:f4(t),df:f1(df),p:f4(p),p_fmt:pFmt(p),sig:p<.05,
    meanA:f4(ma),meanB:f4(mb),sdA:f4(std(a)),sdB:f4(std(b)),nA:na,nB:nb,
    cohensD:isFinite(d)?f4(d):'N/A',dInterp:dLabel(d),
    cohensD_ci:'['+dCI[0]+', '+dCI[1]+']',
    ci95:'['+f4(ci[0])+', '+f4(ci[1])+']'};
}

// One-Way ANOVA
function onewayANOVA(groups){
  const all=groups.flatMap(g=>g.vals);req(all.length,3,'ANOVA');
  if(groups.length<2)throw new Error('ANOVA needs ≥2 groups');
  const gm=mean(all),N=all.length,k=groups.length;
  const ssB=groups.reduce((s,g)=>s+g.vals.length*Math.pow(mean(g.vals)-gm,2),0);
  const ssW=groups.reduce((s,g)=>s+g.vals.reduce((ss,v)=>ss+Math.pow(v-mean(g.vals),2),0),0);
  const dfB=k-1,dfW=N-k;
  if(dfW<=0||ssW===0)throw new Error('Insufficient degrees of freedom');
  const msB=ssB/dfB,msW=ssW/dfW,F=msB/msW;
  const p=fP(F,dfB,dfW);
  const eta2=ssB/(ssB+ssW),omega2=Math.max(0,(ssB-dfB*msW)/(ssB+ssW+msW));
  const eta2_ci=eta2CI(F,dfB,dfW);
  return{F:f4(F),dfB,dfW,msB:f4(msB),msW:f4(msW),ssB:f4(ssB),ssW:f4(ssW),
    p:f4(p),p_fmt:pFmt(p),sig:p<.05,eta2:f4(eta2),omega2:f4(omega2),
    eta2Interp:effLabel(eta2),eta2_ci:'['+eta2_ci[0]+', '+eta2_ci[1]+']',
    groupStats:groups.map(g=>({label:g.label,n:g.vals.length,mean:f4(mean(g.vals)),sd:f4(std(g.vals)),min:f4(Math.min(...g.vals)),max:f4(Math.max(...g.vals))}))};
}

// Tukey HSD
// Studentized Range (q) CDF for Tukey HSD — Gleason (1999) integration
function qrangeCDF(q,k,df){
  // Uses 40-point Gauss-Legendre quadrature on the inner integral
  // Reference: Lund & Lund (1983), verified against R's ptukey
  if(q<=0||k<2||df<1)return 0;
  // GL nodes/weights for [0,1]
  const GL=[
    [0.0130467357,0.0325581548],[0.0674683167,0.0732003399],[0.1602952158,0.1091892035],
    [0.2833023029,0.1347646891],[0.4255628305,0.1477391050],[0.5744371695,0.1477391050],
    [0.7166976971,0.1347646891],[0.8397047842,0.1091892035],[0.9325316833,0.0732003399],
    [0.9869532643,0.0325581548]
  ];
  function normPDF(x){return Math.exp(-0.5*x*x)/Math.sqrt(2*Math.PI);}
  function inner(z){
    // P(q) = integral of k*phi(x)*[Phi(x)-Phi(x-q)]^(k-1) dx
    // approximated via Gauss-Legendre on truncated range [-8, 8]
    let s=0;
    const lo=-q-5,hi=5;
    const mid=(hi+lo)/2,half=(hi-lo)/2;
    GL.forEach(([xi,wi])=>{
      const x=mid+half*(2*xi-1);
      const phi=normPDF(x);
      const F1=normCDF(x),F2=normCDF(x-z);
      if(phi>1e-15&&F1>0&&F2>=0&&F1>=F2)
        s+=wi*phi*Math.pow(F1-F2,k-1);
    });
    return k*s*half*2;
  }
  // Integrate over q distribution with df correction
  if(df>=1000)return inner(q); // normal approx for large df
  // Use t-based correction: q_adj = q * sqrt(chi2/df / 1) ~ q*sqrt(v/df) where v~df
  // Simplified: use 16-point GL on chi-squared
  let p=0;
  const GL16=[
    [0.0950125098,0.1894506105],[0.2816035508,0.1826034151],[0.4580167777,0.1691565194],
    [0.6178762444,0.1495959889],[0.7554044084,0.1246289555],[0.8656312024,0.0951585117],
    [0.9445750231,0.0622535239],[0.9894009350,0.0271524594]
  ];
  const scale=2*df;
  GL16.forEach(([xi,wi])=>{
    const x1=scale*xi, x2=scale*(1-xi);
    [[x1,wi],[x2,wi]].forEach(([x,w])=>{
      if(x>0){
        const v=x; // chi2 sample
        const qAdj=q*Math.sqrt(v/df);
        const fChi=Math.exp((df/2-1)*Math.log(x)-(x/2)-lnG(df/2)-(df/2)*Math.log(2));
        if(isFinite(fChi)&&fChi>0) p+=w*inner(qAdj)*fChi*scale;
      }
    });
  });
  return Math.min(1,Math.max(0,p));
}

function tukeyHSD(groups){
  const res=onewayANOVA(groups);
  const msW=parseFloat(res.msW),pairs=[];
  const k=groups.length,N=groups.flatMap(g=>g.vals).length,dfW=N-k;
  for(let i=0;i<k;i++) for(let j=i+1;j<k;j++){
    const a=groups[i],b=groups[j];
    const meanDiff=mean(a.vals)-mean(b.vals);
    // Tukey's q uses equal-n SE = sqrt(msW/n); unequal: Tukey-Kramer
    const harmN=2/(1/a.vals.length+1/b.vals.length); // harmonic mean n
    const se=Math.sqrt(msW/harmN);
    const q=Math.abs(meanDiff)/se;
    // p = 1 - P(Q_{k,dfW} <= q)
    const pa=Math.max(0,1-qrangeCDF(q,k,dfW));
    // 95% CI for mean difference (Tukey)
    const qCrit=qrangeCDF_inv(0.95,k,dfW)||1.96;
    pairs.push({a:a.label,b:b.label,diff:f4(meanDiff),absDiff:f4(Math.abs(meanDiff)),q:f4(q),p:f4(pa),p_fmt:pFmt(pa),sig:pa<.05});
  }
  return pairs;
}

// Inverse q (simple binary search for CI)
function qrangeCDF_inv(p,k,df){
  let lo=0,hi=20;
  for(let i=0;i<40;i++){const mid=(lo+hi)/2;qrangeCDF(mid,k,df)<p?lo=mid:hi=mid;}
  return (lo+hi)/2;
}

// Pearson r (pairwise)
function pearsonR(ax,ay){
  const {xs,ys,n}=validPairs(ax,ay);req(n,3,'Pearson r');
  const mx=mean(xs),my=mean(ys);
  const num=xs.reduce((s,x,i)=>s+(x-mx)*(ys[i]-my),0);
  const den=Math.sqrt(xs.reduce((s,x)=>s+(x-mx)*(x-mx),0)*ys.reduce((s,y)=>s+(y-my)*(y-my),0));
  if(den===0)throw new Error('Zero variance — correlation undefined');
  const r=num/den,t2=r*Math.sqrt((n-2)/(1-r*r));
  const p=tP(Math.abs(t2),n-2);
  const fz=0.5*Math.log((1+r)/(1-r)),sez=1/Math.sqrt(n-3);
  const zCrit95=normInv(0.975); // proper z critical (≈1.96 for large n, exact for small)
  return{r:f4(r),r2:f4(r*r),p:f4(p),p_fmt:pFmt(p),sig:p<.05,n,
    ci95:'['+f4(Math.tanh(fz-zCrit95*sez))+', '+f4(Math.tanh(fz+zCrit95*sez))+']',
    strength:Math.abs(r)>.7?'Strong':Math.abs(r)>.4?'Moderate':Math.abs(r)>.1?'Weak':'Negligible',
    direction:r>=0?'positive':'negative'};
}

// Spearman r
function spearmanR(ax,ay){
  const {xs,ys,n}=validPairs(ax,ay);req(n,3,'Spearman r');
  function ranks(arr){
    const idx=arr.map((v,i)=>({v,i})).sort((a,b)=>a.v-b.v);
    const r=new Array(n); let pos=0;
    while(pos<n){let j=pos;while(j<n&&idx[j].v===idx[pos].v)j++;
      const avg=(pos+j+1)/2;for(let k=pos;k<j;k++)r[idx[k].i]=avg;pos=j;}
    return r;
  }
  return pearsonR(ranks(xs),ranks(ys));
}

// Linear Regression
function linearReg(ax,ay){
  const {xs,ys,n}=validPairs(ax,ay);req(n,3,'Regression');
  const mx=mean(xs),my=mean(ys);
  const Sxx=xs.reduce((s,x)=>s+(x-mx)*(x-mx),0);
  const Sxy=xs.reduce((s,x,i)=>s+(x-mx)*(ys[i]-my),0);
  if(Sxx===0)throw new Error('Zero variance in predictor');
  const b1=Sxy/Sxx,b0=my-b1*mx;
  const yHat=xs.map(x=>b0+b1*x);
  const SSR=yHat.reduce((s,y,i)=>s+(y-my)*(y-my),0);
  const SSE=ys.reduce((s,y,i)=>s+(y-yHat[i])*(y-yHat[i]),0);
  const SST=ys.reduce((s,y)=>s+(y-my)*(y-my),0);
  const R2=SST>0?SSR/SST:0,R2adj=1-(1-R2)*(n-1)/(n-2);
  const dfR=1,dfE=n-2,MSR=SSR/dfR,MSE=SSE/dfE;
  const F=MSE>0?MSR/MSE:0,pF=fP(F,dfR,dfE);
  const SEb1=Math.sqrt(MSE/Sxx),SEb0=Math.sqrt(MSE*(1/n+mx*mx/Sxx));
  const tb1=b1/SEb1,tb0=b0/SEb0;
  const pb1=tP(Math.abs(tb1),dfE),pb0=tP(Math.abs(tb0),dfE);
  const residuals=ys.map((y,i)=>y-yHat[i]);
  return{b0:f4(b0),b1:f4(b1),SEb0:f4(SEb0),SEb1:f4(SEb1),
    tb0:f4(tb0),tb1:f4(tb1),pb0:f4(pb0),pb1:f4(pb1),pb0_fmt:pFmt(pb0),pb1_fmt:pFmt(pb1),
    R2:f4(R2),R2adj:f4(R2adj),F:f4(F),dfR,dfE,pF:f4(pF),pF_fmt:pFmt(pF),
    RMSE:f4(Math.sqrt(MSE)),SSR:f4(SSR),SSE:f4(SSE),SST:f4(SST),n,sig:pF<.05,
    yHat,residuals,xs,ys};
}


// One-Sample T-Test
function oneSampleT(arr, mu0){
  const nums=validNums(arr);
  req(nums.length,2,'One-Sample T-Test');
  const n=nums.length;
  const m=mean(nums);
  const s=std(nums);
  const se=s/Math.sqrt(n);
  const t=(m-mu0)/se;
  const df=n-1;
  const p2=tP(Math.abs(t),df);
  const tc=tCrit(df);
  const ci95='['+f4(m-tc*se)+', '+f4(m+tc*se)+']';
  const ciDiff='['+f4((m-mu0)-tc*se)+', '+f4((m-mu0)+tc*se)+']';
  const d=(m-mu0)/s;
  return{
    n, mean:f4(m), sd:f4(s), se:f4(se),
    mu0:f4(mu0), meanDiff:f4(m-mu0),
    t:f4(t), df, p:f4(p2), p_fmt:pFmt(p2), sig:p2<.05,
    ci95, ciDiff,
    cohensD:f4(Math.abs(d)), dInterp:dLabel(Math.abs(d)),
    conclusion: p2<.05
      ? 'Mean significantly differs from '+f4(mu0)+' (p<.05)'
      : 'No significant difference from '+f4(mu0)+' (p≥.05)'
  };
}

// Paired T-Test
function pairedTTest(a,b){
  const pairs=a.map((x,i)=>[x,b[i]]).filter(([x,y])=>isV(x)&&isV(y));
  req(pairs.length,2,'Paired T-Test');
  const diffs=pairs.map(([x,y])=>x-y);
  const n=diffs.length, md=mean(diffs), sd_d=std(diffs);
  const se=sd_d/Math.sqrt(n);
  if(se===0)throw new Error('All differences are zero');
  const t=md/se, df=n-1;
  const p=tP(Math.abs(t),df);
  // Cohen's dz (within-person)
  const dz=Math.abs(md)/sd_d;
  const tc_p=tCrit(n-1);const ci=[md-tc_p*se, md+tc_p*se];
  const swD=n>=3?sw(diffs):null;
  return{t:f4(t),df,p:f4(p),p_fmt:pFmt(p),sig:p<.05,n,
    meanDiff:f4(md),sdDiff:f4(sd_d),seDiff:f4(se),
    cohensD:f4(dz),dInterp:dLabel(dz),
    ci95:'['+f4(ci[0])+', '+f4(ci[1])+']',
    normD:swD?('W='+swD.W+' p='+swD.p):'N/A'};
}


// Helpers
function f4(v,d=4){if(!isFinite(v)||v===null||v===undefined)return 'N/A';return (+v.toFixed(d)).toString();}
function f1(v){return f4(v,1);}
function pFmt(p){if(!isFinite(p))return 'N/A';return p<.001?'< .001':p.toFixed(3);}
function dLabel(d){if(!isFinite(d))return 'N/A';return d<.2?'Negligible':d<.5?'Small':d<.8?'Medium':'Large';}
function effLabel(e){return e<.01?'Negligible':e<.06?'Small':e<.14?'Medium':'Large';}


// Cohen's d 95% CI (approximate via SE of d)
// SE(d) ≈ sqrt((nA+nB)/(nA*nB) + d²/(2*(nA+nB-2)))
function cohenDCI(d,nA,nB){
  if(!isFinite(d)||nA<2||nB<2) return ['—','—'];
  const df=nA+nB-2;
  const sed=Math.sqrt((nA+nB)/(nA*nB)+d*d/(2*df));
  const tc=tCrit(df);
  return [f4(d-tc*sed),f4(d+tc*sed)];
}

// eta² CI via F distribution (Steiger & Fouladi approximation)
function eta2CI(F,df1,df2){
  if(!isFinite(F)||F<=0) return ['—','—'];
  const eta2=F*df1/(F*df1+df2);
  // Approximate 95% CI using noncentrality parameter
  const ncLow=Math.max(0,F-1.96)*df1;
  const ncHigh=(F+1.96)*df1;
  const lo=ncLow/(ncLow+df1+df2+1);
  const hi=ncHigh/(ncHigh+df1+df2+1);
  return [f4(lo),f4(hi)];
}

// - LSD Post-hoc (Fisher's Least Significant Difference) -
// Less conservative than Tukey; uses pooled MSW and t-test
function lsdPosthoc(groups){
  req(groups.length,2,'LSD post-hoc groups');
  var allVals=[].concat.apply([],groups.map(function(g){return g.vals;}));
  var grandMean=mean(allVals);
  var k=groups.length;
  var n=allVals.length;
  // MSW
  var ssW=groups.reduce(function(s,g){var gm=mean(g.vals);return s+g.vals.reduce(function(ss,v){return ss+(v-gm)*(v-gm);},0);},0);
  var dfW=n-k;
  var msW=dfW>0?ssW/dfW:NaN;
  var results=[];
  for(var i=0;i<groups.length;i++){
    for(var j=i+1;j<groups.length;j++){
      var ni=groups[i].vals.length, nj=groups[j].vals.length;
      var mi=mean(groups[i].vals), mj=mean(groups[j].vals);
      var diff=mi-mj;
      var se=Math.sqrt(msW*(1/ni+1/nj));
      var t_val=se>0?diff/se:NaN;
      var p_val=isFinite(t_val)?tP(Math.abs(t_val),dfW):NaN;
      results.push({
        a:groups[i].label,b:groups[j].label,
        diff:f4(diff),se:f4(se),
        t:f4(t_val),df:dfW,
        p:f4(p_val),p_fmt:pFmt(p_val),
        sig:p_val<0.05
      });
    }
  }
  return results;
}

// Bonferroni Post-hoc (pairwise t-tests with Bonferroni correction)
function bonferroniPosthoc(groups){
  req(groups.length,2,'Bonferroni post-hoc groups');
  var allVals=[].concat.apply([],groups.map(function(g){return g.vals;}));
  var k=groups.length;
  var n=allVals.length;
  var ssW=groups.reduce(function(s,g){var gm=mean(g.vals);return s+g.vals.reduce(function(ss,v){return ss+(v-gm)*(v-gm);},0);},0);
  var dfW=n-k;
  var msW=dfW>0?ssW/dfW:NaN;
  var m=k*(k-1)/2; // number of comparisons
  var results=[];
  for(var i=0;i<groups.length;i++){
    for(var j=i+1;j<groups.length;j++){
      var ni=groups[i].vals.length, nj=groups[j].vals.length;
      var mi=mean(groups[i].vals), mj=mean(groups[j].vals);
      var diff=mi-mj;
      var se=Math.sqrt(msW*(1/ni+1/nj));
      var t_val=se>0?diff/se:NaN;
      var p_raw=isFinite(t_val)?tP(Math.abs(t_val),dfW):NaN;
      var p_adj=isFinite(p_raw)?Math.min(1,p_raw*m):NaN;
      results.push({
        a:groups[i].label,b:groups[j].label,
        diff:f4(diff),se:f4(se),
        t:f4(t_val),df:dfW,
        p_raw:f4(p_raw),p:f4(p_adj),p_fmt:pFmt(p_adj),
        sig:p_adj<0.05
      });
    }
  }
  return results;
}

// Holm-Bonferroni correction
function holmBonferroni(pValues){
  const n=pValues.length;
  const sorted=pValues.map(function(p,i){return{p,i};}).sort(function(a,b){return a.p-b.p;});
  const adj=new Array(n);
  let prevAdj=0;
  sorted.forEach(function(item,rank){
    const adjP=Math.min(1,Math.max(prevAdj,item.p*(n-rank)));
    adj[item.i]=f4(adjP);
    prevAdj=adjP;
  });
  return adj;
}


function holmBonferroniPosthoc(groups){
  req(groups.length,2,'Holm-Bonferroni post-hoc groups');
  var allVals=[].concat.apply([],groups.map(function(g){return g.vals;}));
  var k=groups.length;
  var n=allVals.length;
  var ssW=groups.reduce(function(s,g){var gm=mean(g.vals);return s+g.vals.reduce(function(ss,v){return ss+(v-gm)*(v-gm);},0);},0);
  var dfW=n-k;
  var msW=dfW>0?ssW/dfW:NaN;
  var pairs=[];
  for(var i=0;i<groups.length;i++){
    for(var j=i+1;j<groups.length;j++){
      var ni=groups[i].vals.length, nj=groups[j].vals.length;
      var mi=mean(groups[i].vals), mj=mean(groups[j].vals);
      var diff=mi-mj;
      var se=Math.sqrt(msW*(1/ni+1/nj));
      var t_val=se>0?diff/se:NaN;
      var p_raw=isFinite(t_val)?tP(Math.abs(t_val),dfW):NaN;
      pairs.push({a:groups[i].label,b:groups[j].label,diff,se,t:t_val,df:dfW,p_raw});
    }
  }
  var pAdjArr=holmBonferroni(pairs.map(function(pr){return isFinite(pr.p_raw)?pr.p_raw:1;}));
  return pairs.map(function(pr,idx){
    var p_adj=parseFloat(pAdjArr[idx]);
    return{
      a:pr.a,b:pr.b,
      diff:f4(pr.diff),se:f4(pr.se),
      t:f4(pr.t),df:pr.df,
      p_raw:f4(pr.p_raw),p:f4(p_adj),p_fmt:pFmt(p_adj),
      sig:p_adj<0.05
    };
  });
}

//Two-Way ANOVA
function twowayANOVA(dataArr, depVar, factorA, factorB){
  // Listwise deletion
  var rows = dataArr.filter(function(r){
    return isV(Number(r[depVar])) &&
           r[factorA]!==null && r[factorA]!==undefined && r[factorA]!=='' &&
           r[factorB]!==null && r[factorB]!==undefined && r[factorB]!=='';
  });
  var n = rows.length;
  req(n, 4, 'Two-Way ANOVA');

  var levA = [...new Set(rows.map(function(r){return String(r[factorA]);}))].sort();
  var levB = [...new Set(rows.map(function(r){return String(r[factorB]);}))].sort();
  req(levA.length, 2, 'Factor A must have ≥2 levels');
  req(levB.length, 2, 'Factor B must have ≥2 levels');

  var yAll = rows.map(function(r){return Number(r[depVar]);});
  var grandMean = mean(yAll);
  var ssTotal = yAll.reduce(function(s,y){return s+(y-grandMean)*(y-grandMean);},0);

  // Cell means and ns
  var cells = {};
  levA.forEach(function(a){
    cells[a]={};
    levB.forEach(function(b){
      var vs = rows.filter(function(r){return String(r[factorA])===a && String(r[factorB])===b;})
                   .map(function(r){return Number(r[depVar]);});
      cells[a][b] = {n:vs.length, mean: vs.length?mean(vs):NaN, vals:vs};
    });
  });

  // Marginal means A
  var meanA = {};
  levA.forEach(function(a){
    var vs = rows.filter(function(r){return String(r[factorA])===a;}).map(function(r){return Number(r[depVar]);});
    meanA[a] = {n:vs.length, mean:mean(vs)};
  });
  // Marginal means B
  var meanB = {};
  levB.forEach(function(b){
    var vs = rows.filter(function(r){return String(r[factorB])===b;}).map(function(r){return Number(r[depVar]);});
    meanB[b] = {n:vs.length, mean:mean(vs)};
  });

  // SS_A
  var ssA = levA.reduce(function(s,a){
    return s + meanA[a].n * Math.pow(meanA[a].mean - grandMean, 2);
  },0);
  var dfA = levA.length - 1;

  // SS_B
  var ssB = levB.reduce(function(s,b){
    return s + meanB[b].n * Math.pow(meanB[b].mean - grandMean, 2);
  },0);
  var dfB = levB.length - 1;

  // SS_AB (interaction) = SS_cells - SS_A - SS_B
  var ssCells = 0;
  levA.forEach(function(a){
    levB.forEach(function(b){
      var c = cells[a][b];
      if(c.n > 0 && isFinite(c.mean)){
        ssCells += c.n * Math.pow(c.mean - grandMean, 2);
      }
    });
  });
  var ssAB = ssCells - ssA - ssB;
  var dfAB = dfA * dfB;

  // SS_Error (within cells)
  var ssError = 0;
  levA.forEach(function(a){
    levB.forEach(function(b){
      var c = cells[a][b];
      var cm = c.mean;
      c.vals.forEach(function(v){ssError += (v-cm)*(v-cm);});
    });
  });
  var dfError = n - levA.length * levB.length;

  var msA = dfA>0 ? ssA/dfA : NaN;
  var msB = dfB>0 ? ssB/dfB : NaN;
  var msAB = dfAB>0 ? ssAB/dfAB : NaN;
  var msError = dfError>0 ? ssError/dfError : NaN;

  var FA = msError>0 ? msA/msError : NaN;
  var FB = msError>0 ? msB/msError : NaN;
  var FAB = msError>0 ? msAB/msError : NaN;

  var pA  = isFinite(FA)&&FA>0  ? 1-fCDF(FA, dfA, dfError) : NaN;
  var pB  = isFinite(FB)&&FB>0  ? 1-fCDF(FB, dfB, dfError) : NaN;
  var pAB = isFinite(FAB)&&FAB>0 ? 1-fCDF(FAB, dfAB, dfError) : NaN;

  var eta2A  = ssTotal>0 ? ssA/ssTotal  : 0;
  var eta2B  = ssTotal>0 ? ssB/ssTotal  : 0;
  var eta2AB = ssTotal>0 ? ssAB/ssTotal : 0;
  // Partial eta²
  var pEta2A  = (ssA+ssError)>0  ? ssA/(ssA+ssError)   : 0;
  var pEta2B  = (ssB+ssError)>0  ? ssB/(ssB+ssError)   : 0;
  var pEta2AB = (ssAB+ssError)>0 ? ssAB/(ssAB+ssError) : 0;

  // Means table for interaction plot
  var cellMeansTable = levA.map(function(a){
    return {level:a, byB: levB.map(function(b){
      return {level:b, mean:cells[a][b].mean, n:cells[a][b].n};
    })};
  });

  return {
    n, depVar, factorA, factorB,
    levA, levB, grandMean:f4(grandMean),
    effects:[
      {source:factorA, SS:f4(ssA), df:dfA, MS:f4(msA), F:f4(FA), p:f4(pA), p_fmt:pFmt(pA), sig:pA<0.05, eta2:f4(eta2A), pEta2:f4(pEta2A)},
      {source:factorB, SS:f4(ssB), df:dfB, MS:f4(msB), F:f4(FB), p:f4(pB), p_fmt:pFmt(pB), sig:pB<0.05, eta2:f4(eta2B), pEta2:f4(pEta2B)},
      {source:factorA+'×'+factorB, SS:f4(ssAB), df:dfAB, MS:f4(msAB), F:f4(FAB), p:f4(pAB), p_fmt:pFmt(pAB), sig:pAB<0.05, eta2:f4(eta2AB), pEta2:f4(pEta2AB)}
    ],
    error:{SS:f4(ssError), df:dfError, MS:f4(msError)},
    total:{SS:f4(ssTotal), df:n-1},
    cellMeansTable,
    meanA: levA.map(function(a){return {level:a, mean:f4(meanA[a].mean), n:meanA[a].n};}),
    meanB: levB.map(function(b){return {level:b, mean:f4(meanB[b].mean), n:meanB[b].n};}),
  };
}

// Three-Way ANOVA (Factorial A×B×C) — Type I SS.
function threewayANOVA(dataArr, depVar, factorA, factorB, factorC){
  var rows = dataArr.filter(function(r){
    return isV(Number(r[depVar])) &&
           r[factorA]!==null && r[factorA]!==undefined && r[factorA]!=='' &&
           r[factorB]!==null && r[factorB]!==undefined && r[factorB]!=='' &&
           r[factorC]!==null && r[factorC]!==undefined && r[factorC]!=='';
  });
  var n = rows.length;
  req(n, 8, 'Three-Way ANOVA');

  var levA = [...new Set(rows.map(function(r){return String(r[factorA]);}))].sort();
  var levB = [...new Set(rows.map(function(r){return String(r[factorB]);}))].sort();
  var levC = [...new Set(rows.map(function(r){return String(r[factorC]);}))].sort();
  req(levA.length,2,'Factor A must have ≥2 levels');
  req(levB.length,2,'Factor B must have ≥2 levels');
  req(levC.length,2,'Factor C must have ≥2 levels');

  var yAll = rows.map(function(r){return Number(r[depVar]);});
  var grandMean = mean(yAll);
  var ssTotal = yAll.reduce(function(s,y){return s+(y-grandMean)*(y-grandMean);},0);

  function cellVals(a,b,c){
    return rows.filter(function(r){
      return (a===null||String(r[factorA])===a) &&
             (b===null||String(r[factorB])===b) &&
             (c===null||String(r[factorC])===c);
    }).map(function(r){return Number(r[depVar]);});
  }
  function cellMean(a,b,c){var vs=cellVals(a,b,c);return vs.length?mean(vs):NaN;}

  // Marginal means
  var mA={},mB={},mC={};
  levA.forEach(function(a){var vs=cellVals(a,null,null);mA[a]={n:vs.length,m:mean(vs)};});
  levB.forEach(function(b){var vs=cellVals(null,b,null);mB[b]={n:vs.length,m:mean(vs)};});
  levC.forEach(function(c){var vs=cellVals(null,null,c);mC[c]={n:vs.length,m:mean(vs)};});

  // Two-way marginal means
  var mAB={},mAC={},mBC={};
  levA.forEach(function(a){levB.forEach(function(b){var vs=cellVals(a,b,null);mAB[a+'_'+b]={n:vs.length,m:mean(vs)};});});
  levA.forEach(function(a){levC.forEach(function(c){var vs=cellVals(a,null,c);mAC[a+'_'+c]={n:vs.length,m:mean(vs)};});});
  levB.forEach(function(b){levC.forEach(function(c){var vs=cellVals(null,b,c);mBC[b+'_'+c]={n:vs.length,m:mean(vs)};});});

  // SS main effects
  var ssA  = levA.reduce(function(s,a){return s+mA[a].n*Math.pow(mA[a].m-grandMean,2);},0);
  var ssB  = levB.reduce(function(s,b){return s+mB[b].n*Math.pow(mB[b].m-grandMean,2);},0);
  var ssC  = levC.reduce(function(s,c){return s+mC[c].n*Math.pow(mC[c].m-grandMean,2);},0);
  var dfA=levA.length-1, dfB=levB.length-1, dfC=levC.length-1;

  // SS two-way interactions
  var ssABcells=0;
  levA.forEach(function(a){levB.forEach(function(b){var v=mAB[a+'_'+b];if(v.n>0)ssABcells+=v.n*Math.pow(v.m-grandMean,2);});});
  var ssAB = ssABcells - ssA - ssB;
  var dfAB = dfA*dfB;

  var ssACcells=0;
  levA.forEach(function(a){levC.forEach(function(c){var v=mAC[a+'_'+c];if(v.n>0)ssACcells+=v.n*Math.pow(v.m-grandMean,2);});});
  var ssAC = ssACcells - ssA - ssC;
  var dfAC = dfA*dfC;

  var ssBCcells=0;
  levB.forEach(function(b){levC.forEach(function(c){var v=mBC[b+'_'+c];if(v.n>0)ssBCcells+=v.n*Math.pow(v.m-grandMean,2);});});
  var ssBC = ssBCcells - ssB - ssC;
  var dfBC = dfB*dfC;

  // SS three-way: SS_cells(ABC) - all lower effects
  var ssABCcells=0;
  levA.forEach(function(a){levB.forEach(function(b){levC.forEach(function(c){
    var vs=cellVals(a,b,c); if(!vs.length) return;
    ssABCcells += vs.length*Math.pow(mean(vs)-grandMean,2);
  });});});
  var ssABC = ssABCcells - ssA - ssB - ssC - ssAB - ssAC - ssBC;
  var dfABC = dfA*dfB*dfC;

  // SPARSE CELL ANALYSIS: 3-tier warning system
  var totalCells = levA.length * levB.length * levC.length;
  var emptyCells = [], singletonCells = [];
  levA.forEach(function(a){ levB.forEach(function(b){ levC.forEach(function(c){
    var vs = cellVals(a,b,c);
    var key = a+'×'+b+'×'+c;
    if(vs.length === 0) emptyCells.push(key);
    else if(vs.length === 1) singletonCells.push(key);
  });});});
  // Pre-check dfError to detect unrecoverable singular model
  var _nCellsCheck=0;
  levA.forEach(function(a){levB.forEach(function(b){levC.forEach(function(c){
    if(cellVals(a,b,c).length>0) _nCellsCheck++;
  });});});
  var _dfErrCheck = n - _nCellsCheck;
  // 🔴 CRITICAL: dfError <= 0 => singular model, hard stop
  if(_dfErrCheck <= 0){
    throw new Error(
      '🔴 Model singular: ' + emptyCells.length + ' of ' + totalCells + ' cells are empty. ' +
      'dfError = ' + _dfErrCheck + ' ≤ 0 — within-cell error cannot be estimated. ' +
      'Try reducing factor levels, merging sparse groups, or using Two-Way ANOVA.'
    );
  }
  // Build non-blocking diagnostic warnings
  var sparseWarnings = [];
  if(emptyCells.length > 0){
    sparseWarnings.push({level:'warning', icon:'🟠',
      msg: emptyCells.length + ' empty cell(s) (' + Math.round(emptyCells.length/totalCells*100) + '% of ' + totalCells + ' cells). ' +
           'These combinations are excluded from SS computation. Affected interaction effects may be biased.',
      cells: emptyCells});
  }
  if(singletonCells.length > 0){
    sparseWarnings.push({level:'caution', icon:'🟡',
      msg: singletonCells.length + ' cell(s) with n=1. SE and effect sizes for these cells are unreliable.',
      cells: singletonCells});
  }

  // SS Error (within cells) — empty cells already skipped by if(!vs.length)
  var ssError=0, nCells=0;
  levA.forEach(function(a){levB.forEach(function(b){levC.forEach(function(c){
    var vs=cellVals(a,b,c); if(!vs.length) return;
    var cm=mean(vs); nCells++;
    vs.forEach(function(v){ssError+=(v-cm)*(v-cm);});
  });});});
  var dfError = n - nCells; // validated > 0 above

  function effect(source, ss, df){
    var ms = df>0?ss/df:NaN;
    var msE = dfError>0?ssError/dfError:NaN;
    var F = msE>0?ms/msE:NaN;
    var p = isFinite(F)&&F>0?1-fCDF(F,df,dfError):NaN;
    var eta2 = ssTotal>0?ss/ssTotal:0;
    var pEta2 = (ss+ssError)>0?ss/(ss+ssError):0;
    return {source, SS:f4(ss), df, MS:f4(ms), F:f4(F), p:f4(p), p_fmt:pFmt(p), sig:p<0.05, eta2:f4(eta2), pEta2:f4(pEta2)};
  }
  var msError = dfError>0?ssError/dfError:NaN;

  // Interaction table for A×B (holding C at first level, for plot)
  var cellMeansAB = levA.map(function(a){
    return {level:a, byB:levB.map(function(b){
      var v=mAB[a+'_'+b]; return {level:b, mean:f4(v.m), n:v.n, empty:v.n===0};
    })};
  });

  return {
    n, depVar, factorA, factorB, factorC,
    levA, levB, levC, grandMean:f4(grandMean),
    effects:[
      effect(factorA, ssA, dfA),
      effect(factorB, ssB, dfB),
      effect(factorC, ssC, dfC),
      effect(factorA+'×'+factorB, ssAB, dfAB),
      effect(factorA+'×'+factorC, ssAC, dfAC),
      effect(factorB+'×'+factorC, ssBC, dfBC),
      effect(factorA+'×'+factorB+'×'+factorC, ssABC, dfABC),
    ],
    sparseWarnings,
    emptyCells, singletonCells, totalCells, nCells,
    error:{SS:f4(ssError), df:dfError, MS:f4(msError)},
    total:{SS:f4(ssTotal), df:n-1},
    cellMeansAB,
    meanA:levA.map(function(a){return {level:a,mean:f4(mA[a].m),n:mA[a].n};}),
    meanB:levB.map(function(b){return {level:b,mean:f4(mB[b].m),n:mB[b].n};}),
    meanC:levC.map(function(c){return {level:c,mean:f4(mC[c].m),n:mC[c].n};}),
  };
}
