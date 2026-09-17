// Fitur: Helper distribusi & statistik dasar murni komputasi 
//   isV, validNums, validPairs, req, tCrit, lnG, betaCF, incBeta,
//   gammaSer, gammaCF, gammaP, tP, fP, chi2P, erf, normCDF, normInv,
//   sum, mean, vari, std, quantile, chiCDF, fCDF, incompleteBeta
// Depends on: tidak ada (pure math, tidak sentuh DOM)


  const isV = v => typeof v === 'number' && isFinite(v);

  // t critical value (two-tailed alpha=0.05) via lookup + interpolation
  function tCrit(df){
    if(!isFinite(df)||df<=0) return 1.96;
    if(df>=120) return 1.960;
    const T={1:12.706,2:4.303,3:3.182,4:2.776,5:2.571,6:2.447,7:2.365,
      8:2.306,9:2.262,10:2.228,11:2.201,12:2.179,13:2.160,14:2.145,15:2.131,
      16:2.120,17:2.110,18:2.101,19:2.093,20:2.086,21:2.080,22:2.074,23:2.069,
      24:2.064,25:2.060,26:2.056,27:2.052,28:2.048,29:2.045,30:2.042,
      35:2.030,40:2.021,45:2.014,50:2.009,60:2.000,70:1.994,80:1.990,
      90:1.987,100:1.984,120:1.980};
    if(T[df]) return T[df];
    const keys=Object.keys(T).map(Number).sort((a,b)=>a-b);
    for(let i=0;i<keys.length-1;i++){
      if(df>keys[i]&&df<keys[i+1]){
        const t=(df-keys[i])/(keys[i+1]-keys[i]);
        return T[keys[i]]*(1-t)+T[keys[i+1]]*t;
      }
    }
    return 1.96;
  }

  const validNums = arr => arr.filter(isV);
  const validPairs = (ax, ay) => {
    const p = ax.map((x,i)=>[x,ay[i]]).filter(([x,y])=>isV(x)&&isV(y));
    return {xs:p.map(v=>v[0]),ys:p.map(v=>v[1]),n:p.length};
  };
  const req = (n,min,lbl) => { if(n<min) throw new Error(lbl+': need ≥'+min+' valid cases (got '+n+')'); };

  // Lanczos lnGamma
  function lnG(z){
    const C=[0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,
      -176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
    if(z<0.5) return Math.log(Math.PI/Math.sin(Math.PI*z))-lnG(1-z);
    z-=1; let x=C[0];
    for(let i=1;i<9;i++) x+=C[i]/(z+i);
    const t=z+7.5;
    return 0.5*Math.log(2*Math.PI)+(z+0.5)*Math.log(t)-t+Math.log(x);
  }

  // Lentz continued fraction for incomplete beta
  function betaCF(x,a,b){
    const FP=1e-30,EPS=3e-10;
    const qab=a+b,qap=a+1,qam=a-1;
    let c=1,d=1-qab*x/qap;
    if(Math.abs(d)<FP)d=FP; d=1/d; let h=d;
    for(let m=1;m<=300;m++){
      const m2=2*m;
      let aa=m*(b-m)*x/((qam+m2)*(a+m2));
      d=1+aa*d; if(Math.abs(d)<FP)d=FP; c=1+aa/c; if(Math.abs(c)<FP)c=FP;
      d=1/d; h*=d*c;
      aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2));
      d=1+aa*d; if(Math.abs(d)<FP)d=FP; c=1+aa/c; if(Math.abs(c)<FP)c=FP;
      d=1/d; const del=d*c; h*=del;
      if(Math.abs(del-1)<EPS) break;
    }
    return h;
  }

  function incBeta(x,a,b){
    if(x<=0)return 0; if(x>=1)return 1;
    const lB=lnG(a)+lnG(b)-lnG(a+b);
    const bt=Math.exp(Math.log(x)*a+Math.log(1-x)*b-lB);
    return x<(a+1)/(a+b+2)?bt*betaCF(x,a,b)/a:1-bt*betaCF(1-x,b,a)/b;
  }

  // Regularized incomplete gamma (series + CF)
  function gammaSer(a,x){
    let ap=a,s=1/a,del=s;
    for(let n=1;n<=200;n++){ap++;del*=x/ap;s+=del;if(Math.abs(del)<Math.abs(s)*1e-10)break;}
    return s*Math.exp(-x+a*Math.log(x)-lnG(a));
  }
  function gammaCF(a,x){
    let b=x+1-a,c=1e30,d=1/b,h=d;
    for(let i=1;i<=200;i++){
      const an=-i*(i-a),bi=x+2*i+1-a;
      d=an*d+bi;if(Math.abs(d)<1e-30)d=1e-30; d=1/d;
      c=bi+an/c;if(Math.abs(c)<1e-30)c=1e-30;
      h*=d*c; if(Math.abs(d*c-1)<1e-10)break;
    }
    return Math.exp(-x+a*Math.log(x)-lnG(a))*h;
  }
  const gammaP = (a,x) => x<0||a<=0?NaN:(x===0?0:(x<a+1?gammaSer(a,x):1-gammaCF(a,x)));

  // P-value functions
  const tP   = (t,df)    => df>0 ? incBeta(df/(df+t*t),df/2,0.5) : NaN;
  const fP   = (f,d1,d2) => f>=0 ? 1-incBeta(d1*f/(d1*f+d2),d1/2,d2/2) : NaN;
  const chi2P = (x,df)   => df>0&&x>=0 ? 1-gammaP(df/2,x/2) : NaN;

  function erf(x){
    const t=1/(1+0.3275911*Math.abs(x));
    const y=1-(0.254829592*t-0.284496736*t*t+1.421413741*Math.pow(t,3)-1.453152027*Math.pow(t,4)+1.061405429*Math.pow(t,5))*Math.exp(-x*x);
    return x<0?-y:y;
  }
  const normCDF = z => 0.5*(1+erf(z/Math.SQRT2));

  function normInv(p){
    if(p<=0)return -Infinity; if(p>=1)return Infinity;
    const c=[0.3374754822726147,0.9761690190917186,0.1607979714918209,0.0276438810333863,
             0.0038405729373609,0.0003951896511349,0.0000321767881768,0.0000002888167364,0.0000003960315187];
    const a=[2.50662823884,-18.61500062529,41.39119773534,-25.44106049637];
    const b=[-8.47351093090,23.08336743743,-21.06224101826,3.13082909833];
    const r=p-0.5;
    if(Math.abs(r)<0.42){
      const rs=r*r;
      return r*(((a[3]*rs+a[2])*rs+a[1])*rs+a[0])/((((b[3]*rs+b[2])*rs+b[1])*rs+b[0])*rs+1);
    }
    const s=Math.log(p<0.5?-Math.log(p):-Math.log(1-p));
    let t2=c[0]; for(let i=1;i<9;i++) t2=t2*s+c[i];
    return p<0.5?-t2:t2;
  }

  // Basic stats
  const sum  = a => a.reduce((s,v)=>s+v,0);
  const mean = a => { req(a.length,1,'mean'); return sum(a)/a.length; };
  const vari = (a,d=1) => { if(a.length<d+1) return NaN; const m=mean(a); return a.reduce((s,v)=>s+(v-m)*(v-m),0)/(a.length-d); };
  const std  = (a,d=1) => { if(a.length<d+1) return NaN; return Math.sqrt(vari(a,d)); };

  function quantile(s,p){ // R type 7
    const n=s.length; if(!n)return NaN;
    const h=(n-1)*p,lo=Math.floor(h),hi=Math.ceil(h);
    return lo===hi?s[lo]:s[lo]+(h-lo)*(s[hi]-s[lo]);
  }

  // Chi-square CDF (for Breusch-Pagan) — regularized incomplete gamma approximation
  function chiCDF(x,k){
    if(x<=0||k<=0) return 0;
    if(!isFinite(x)) return 1;
    // P(χ²≤x) = γ(k/2, x/2) / Γ(k/2) via series approximation
    const a=k/2, xh=x/2;
    // Series: sum_{n=0}^{inf} x^n / (a*(a+1)*...*(a+n)) * exp(-x) * x^a / Gamma(a)
    let sum=1,term=1;
    for(let n=1;n<=200;n++){
      term*=xh/(a+n);
      sum+=term;
      if(Math.abs(term)<1e-10*Math.abs(sum)) break;
    }
    const logP=a*Math.log(xh)-xh-lnG(a+1)+Math.log(sum);
    return Math.min(1,Math.max(0,Math.exp(logP)));
  }

  // F CDF using Wilson-Hilferty normal approximation
  function fCDF(F,d1,d2){
    if(!isFinite(F)||F<=0) return 0;
    var x=d2/(d2+d1*F);
    return 1-incompleteBeta(x,d2/2,d1/2);
  }

  // Regularized incomplete beta (for F and t CDFs)
  function incompleteBeta(x,a,b){
    if(x<=0) return 0; if(x>=1) return 1;
    var lbeta=lnG(a)+lnG(b)-lnG(a+b);
    // Continued fraction via Lentz
    var qab=a+b,qap=a+1,qam=a-1;
    var c=1,d=1-qab*x/qap;
    if(Math.abs(d)<1e-30) d=1e-30; d=1/d;
    var h=d;
    for(var m=1;m<=200;m++){
      var m2=2*m;
      var aa=m*(b-m)*x/((qam+m2)*(a+m2));
      d=1+aa*d; if(Math.abs(d)<1e-30) d=1e-30;
      c=1+aa/c; if(Math.abs(c)<1e-30) c=1e-30;
      d=1/d; h*=d*c;
      aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2));
      d=1+aa*d; if(Math.abs(d)<1e-30) d=1e-30;
      c=1+aa/c; if(Math.abs(c)<1e-30) c=1e-30;
      d=1/d; var del=d*c; h*=del;
      if(Math.abs(del-1)<1e-10) break;
    }
    return Math.exp(a*Math.log(x)+b*Math.log(1-x)-lbeta)*h/a;
  }
