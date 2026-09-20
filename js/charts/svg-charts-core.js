// SVG CHARTS — CORE
var PAL2=['#818cf8','#34d399','#fbbf24','#f472b6','#60a5fa','#a78bfa','#fb923c','#2dd4bf'];

function svgScreePlot(eigenvalues, nFactors, W, H){
  W=W||380; H=H||150;
  var vals=eigenvalues.map(function(v){return parseFloat(v);});
  var maxEV=Math.max(Math.max.apply(null,vals),1.2);
  var P={l:36,r:16,t:14,b:32};
  var cw=W-P.l-P.r, ch=H-P.t-P.b;
  var n=vals.length;
  var xStep=cw/(n-1||1);
  var yScale=function(v){return ch-(v/maxEV)*ch;};

  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block;overflow:visible">';
  // Grid lines
  [0,0.25,0.5,0.75,1].forEach(function(f){
    var yv=f*maxEV;
    var y=P.t+yScale(yv);
    svg+='<line x1="'+P.l+'" y1="'+y+'" x2="'+(P.l+cw)+'" y2="'+y+'" stroke="rgba(255,255,255,.06)" stroke-width="1"/>';
    svg+='<text x="'+(P.l-4)+'" y="'+(y+4)+'" text-anchor="end" font-size="8" fill="#475569">'+yv.toFixed(1)+'</text>';
  });
  // Eigenvalue=1 reference line
  var y1=P.t+yScale(1);
  svg+='<line x1="'+P.l+'" y1="'+y1+'" x2="'+(P.l+cw)+'" y2="'+y1+'" stroke="rgba(251,191,36,.35)" stroke-width="1.5" stroke-dasharray="4,3"/>';
  svg+='<text x="'+(P.l+cw+3)+'" y="'+(y1+4)+'" font-size="8" fill="#fbbf24">1.0</text>';

  // Area fill under scree line (factors retained)
  var retainedPts='';
  var allPts='';
  vals.forEach(function(v,i){
    var x=P.l+i*xStep, y=P.t+yScale(v);
    if(i<nFactors) retainedPts+=(i===0?'M':' L')+x+' '+y;
    allPts+=(i===0?'M':' L')+x+' '+y;
  });
  // Fill retained area
  if(nFactors>0){
    var retFill=retainedPts+' L'+(P.l+(nFactors-1)*xStep)+' '+(P.t+ch)+' L'+P.l+' '+(P.t+ch)+' Z';
    svg+='<path d="'+retFill+'" fill="rgba(165,243,252,.08)"/>';
  }
  // Line
  svg+='<path d="'+allPts+'" fill="none" stroke="rgba(165,243,252,.5)" stroke-width="2" stroke-linejoin="round"/>';

  // Dots
  vals.forEach(function(v,i){
    var x=P.l+i*xStep, y=P.t+yScale(v);
    var isRetained=i<nFactors;
    svg+='<circle cx="'+x+'" cy="'+y+'" r="'+(isRetained?5:3.5)+'" fill="'+(isRetained?'#a5f3fc':'#475569')+'" stroke="'+(isRetained?'rgba(165,243,252,.6)':'rgba(71,85,105,.4)')+'" stroke-width="1.5"/>';
    svg+='<text x="'+x+'" y="'+(y-8)+'" text-anchor="middle" font-size="7.5" fill="'+(isRetained?'#a5f3fc':'#64748b')+'">'+v+'</text>';
    svg+='<text x="'+x+'" y="'+(P.t+ch+14)+'" text-anchor="middle" font-size="8" fill="#475569">F'+(i+1)+'</text>';
  });
  svg+='</svg>';
  return svg;
}

function svgHistogram(data,field,W=400,H=160){
  const nums=SE.validNums(data.map(r=>r[field]));
  if(nums.length<2)return '<div class="chart-empty">Need ≥2 values</div>';
  const mn=Math.min(...nums),mx=Math.max(...nums);
  const bins=Math.min(Math.max(5,Math.ceil(Math.sqrt(nums.length))),14);
  const step=mx===mn?1:(mx-mn)/bins;
  const freq=Array(bins).fill(0);
  nums.forEach(v=>{const i=Math.min(Math.floor((v-mn)/step),bins-1);freq[i]++;});
  const mF=Math.max(...freq)||1;
  const P={l:30,r:8,t:8,b:26};
  const bw=(W-P.l-P.r)/bins;
  let svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block;overflow:hidden">';
  freq.forEach((f,i)=>{const bh=(f/mF)*(H-P.t-P.b),x=P.l+i*bw,y=H-P.b-bh;
    svg+='<rect x="'+(x+1.5)+'" y="'+y+'" width="'+(bw-3)+'" height="'+bh+'" rx="3" fill="'+PAL2[i%8]+'" opacity=".82"/>';
    if(i%Math.ceil(bins/6)===0)svg+='<text x="'+(x+bw/2)+'" y="'+(H-P.b+14)+'" text-anchor="middle" font-size="8" fill="#64748b">'+(mn+i*step).toFixed(0)+'</text>';
  });
  [0,.5,1].forEach(v=>svg+='<text x="'+(P.l-3)+'" y="'+(H-P.b-v*(H-P.t-P.b)+4)+'" text-anchor="end" font-size="8" fill="#64748b">'+Math.round(v*mF)+'</text>');
  svg+='<line x1="'+P.l+'" y1="'+P.t+'" x2="'+P.l+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  svg+='<line x1="'+P.l+'" y1="'+(H-P.b)+'" x2="'+(W-P.r)+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  return svg+'</svg>';
}

function svgBoxplot(data,field,groupField,W=400,H=160){
  const groups=groupField
    ?[...new Set(data.map(r=>r[groupField]))].sort().map(g=>({label:String(g),vals:SE.validNums(data.filter(r=>r[groupField]===g).map(r=>r[field]))}))
    :[{label:field,vals:SE.validNums(data.map(r=>r[field]))}];
  const all=groups.flatMap(g=>g.vals);
  if(!all.length)return '<div class="chart-empty">No data</div>';
  const gMin=Math.min(...all),gMax=Math.max(...all);
  const P={l:34,r:10,t:12,b:20};
  const ty=v=>H-P.b-((v-gMin)/((gMax-gMin)||1))*(H-P.t-P.b);
  const slotW=(W-P.l-P.r)/groups.length;
  const bw=Math.max(12,Math.min(42,slotW-12));
  let svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block;overflow:visible">';
  [0,.25,.5,.75,1].forEach(v=>{const val=gMin+v*(gMax-gMin);
    svg+='<line x1="'+P.l+'" x2="'+(W-P.r)+'" y1="'+ty(val)+'" y2="'+ty(val)+'" stroke="#1e293b" stroke-width=".5" stroke-dasharray="3,3"/>';
    svg+='<text x="'+(P.l-3)+'" y="'+(ty(val)+4)+'" text-anchor="end" font-size="8" fill="#64748b">'+val.toFixed(0)+'</text>';
  });
  groups.forEach((g,gi)=>{
    if(g.vals.length<4)return;
    const s=[...g.vals].sort((a,b)=>a-b);
    const q1=SE.quantile(s,.25),med=SE.quantile(s,.5),q3=SE.quantile(s,.75);
    const iqr=q3-q1,lo=q1-1.5*iqr,hi=q3+1.5*iqr;
    const wMin=Math.max(s[0],lo),wMax=Math.min(s[s.length-1],hi);
    const outs=g.vals.filter(v=>v<lo||v>hi);
    const cx=P.l+(gi+.5)*slotW,col=PAL2[gi%8];
    svg+='<rect x="'+(cx-bw/2)+'" y="'+ty(q3)+'" width="'+bw+'" height="'+Math.max(1,ty(q1)-ty(q3))+'" fill="'+col+'" fill-opacity=".2" stroke="'+col+'" stroke-width="1.5" rx="2"/>';
    svg+='<line x1="'+(cx-bw/2)+'" x2="'+(cx+bw/2)+'" y1="'+ty(med)+'" y2="'+ty(med)+'" stroke="'+col+'" stroke-width="2.5"/>';
    svg+='<line x1="'+cx+'" x2="'+cx+'" y1="'+ty(wMax)+'" y2="'+ty(q3)+'" stroke="'+col+'" stroke-width="1" stroke-dasharray="3,2"/>';
    svg+='<line x1="'+cx+'" x2="'+cx+'" y1="'+ty(q1)+'" y2="'+ty(wMin)+'" stroke="'+col+'" stroke-width="1" stroke-dasharray="3,2"/>';
    [[wMin,5],[wMax,5]].forEach(([v,hw])=>svg+='<line x1="'+(cx-hw)+'" x2="'+(cx+hw)+'" y1="'+ty(v)+'" y2="'+ty(v)+'" stroke="'+col+'" stroke-width="1.5"/>');
    outs.forEach(v=>svg+='<circle cx="'+cx+'" cy="'+ty(v)+'" r="3" fill="none" stroke="'+col+'" stroke-width="1.5"/>');
    svg+='<text x="'+cx+'" y="'+(H-P.b+14)+'" text-anchor="middle" font-size="9" fill="#94a3b8">'+g.label+'</text>';
  });
  svg+='<line x1="'+P.l+'" y1="'+P.t+'" x2="'+P.l+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  svg+='<line x1="'+P.l+'" y1="'+(H-P.b)+'" x2="'+(W-P.r)+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  return svg+'</svg>';
}

function svgScatter(dataArr,xField,yField,W=400,H=200){
  const pts=dataArr.filter(r=>SE.isV(r[xField])&&SE.isV(r[yField]));
  if(pts.length<3)return '<div class="chart-empty">Need ≥3 pairs</div>';
  const xs=pts.map(r=>r[xField]),ys=pts.map(r=>r[yField]);
  const xMin=Math.min(...xs),xMax=Math.max(...xs),yMin=Math.min(...ys),yMax=Math.max(...ys);
  const P={l:36,r:12,t:12,b:32};
  const tx=x=>P.l+((x-xMin)/((xMax-xMin)||1))*(W-P.l-P.r);
  const ty=y=>H-P.b-((y-yMin)/((yMax-yMin)||1))*(H-P.t-P.b);
  let svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block;overflow:visible">';
  let rLabel='';
  try{
    const cr=SE.pearsonR(xs,ys),sx=SE.std(xs),sy=SE.std(ys),mx=SE.mean(xs),my=SE.mean(ys);
    const sl=parseFloat(cr.r)*(sy/sx),ic=my-sl*mx;
    svg+='<line x1="'+tx(xMin)+'" y1="'+ty(sl*xMin+ic)+'" x2="'+tx(xMax)+'" y2="'+ty(sl*xMax+ic)+'" stroke="#f472b6" stroke-width="1.5" stroke-dasharray="5,3" opacity=".8"/>';
    rLabel='r='+cr.r+(parseFloat(cr.p)<.001?' p<.001':' p='+cr.p_fmt);
  }catch{}
  pts.forEach(r=>svg+='<circle cx="'+tx(r[xField])+'" cy="'+ty(r[yField])+'" r="5" fill="#818cf8" fill-opacity=".7" stroke="#a78bfa" stroke-width="1.2"/>');
  [xMin,(xMin+xMax)/2,xMax].forEach(v=>svg+='<text x="'+tx(v)+'" y="'+(H-P.b+14)+'" text-anchor="middle" font-size="8" fill="#64748b">'+v.toFixed(0)+'</text>');
  [yMin,(yMin+yMax)/2,yMax].forEach(v=>svg+='<text x="'+(P.l-4)+'" y="'+(ty(v)+4)+'" text-anchor="end" font-size="8" fill="#64748b">'+v.toFixed(0)+'</text>');
  svg+='<text x="'+(W/2)+'" y="'+H+'" text-anchor="middle" font-size="9" fill="#475569">'+escHtml(xField)+'</text>';
  if(rLabel)svg+='<text x="'+(W-P.r)+'" y="'+(P.t+2)+'" text-anchor="end" font-size="8" fill="#f472b6">'+escHtml(rLabel)+'</text>';
  svg+='<line x1="'+P.l+'" y1="'+P.t+'" x2="'+P.l+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  svg+='<line x1="'+P.l+'" y1="'+(H-P.b)+'" x2="'+(W-P.r)+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  return svg+'</svg>';
}

function svgQQ(dataArr,field,W=380,H=190){
  const nums=SE.validNums(dataArr.map(r=>r[field])).sort((a,b)=>a-b);
  if(nums.length<5)return '<div class="chart-empty">Need ≥5 values</div>';
  const n=nums.length,m=SE.mean(nums),s=SE.std(nums);
  const theo=nums.map((_,i)=>SE.normInv((i+.5)/n));
  const P={l:38,r:12,t:12,b:30};
  const tMin=Math.min(...theo),tMax=Math.max(...theo);
  const sMin=Math.min(...nums),sMax=Math.max(...nums);
  const tx=v=>P.l+((v-tMin)/((tMax-tMin)||1))*(W-P.l-P.r);
  const ty=v=>H-P.b-((v-sMin)/((sMax-sMin)||1))*(H-P.t-P.b);
  let svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block;overflow:hidden">';
  svg+='<defs><clipPath id="qq-clip"><rect x="'+P.l+'" y="'+P.t+'" width="'+(W-P.l-P.r)+'" height="'+(H-P.t-P.b)+'"/></clipPath></defs>';
  svg+='<line clip-path="url(#qq-clip)" x1="'+tx(tMin)+'" y1="'+ty(m+s*tMin)+'" x2="'+tx(tMax)+'" y2="'+ty(m+s*tMax)+'" stroke="#f472b6" stroke-width="1.5" stroke-dasharray="5,3" opacity=".7"/>';
  theo.forEach((t,i)=>svg+='<circle cx="'+tx(t)+'" cy="'+ty(nums[i])+'" r="4" fill="#818cf8" fill-opacity=".75" stroke="#a78bfa" stroke-width="1"/>');
  [tMin,0,tMax].forEach(v=>svg+='<text x="'+tx(v)+'" y="'+(H-P.b+13)+'" text-anchor="middle" font-size="8" fill="#64748b">'+v.toFixed(1)+'</text>');
  [sMin,(sMin+sMax)/2,sMax].forEach(v=>svg+='<text x="'+(P.l-4)+'" y="'+(ty(v)+4)+'" text-anchor="end" font-size="8" fill="#64748b">'+v.toFixed(0)+'</text>');
  svg+='<text x="'+(W/2)+'" y="'+H+'" text-anchor="middle" font-size="9" fill="#475569">Theoretical Quantiles</text>';
  svg+='<line x1="'+P.l+'" y1="'+P.t+'" x2="'+P.l+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  svg+='<line x1="'+P.l+'" y1="'+(H-P.b)+'" x2="'+(W-P.r)+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  return svg+'</svg>';
}

function svgResidual(res,W=380,H=170){
  if(!res)return '';
  const xs=res.yHat,ys=res.residuals;
  const xMin=Math.min(...xs),xMax=Math.max(...xs),yMin=Math.min(...ys),yMax=Math.max(...ys);
  const P={l:38,r:12,t:12,b:30};
  const tx=v=>P.l+((v-xMin)/((xMax-xMin)||1))*(W-P.l-P.r);
  const ty=v=>H-P.b-((v-yMin)/((yMax-yMin)||1))*(H-P.t-P.b);
  let svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block;overflow:visible">';
  svg+='<line x1="'+P.l+'" x2="'+(W-P.r)+'" y1="'+ty(0)+'" y2="'+ty(0)+'" stroke="#64748b" stroke-dasharray="4,3"/>';
  xs.forEach((x,i)=>svg+='<circle cx="'+tx(x)+'" cy="'+ty(ys[i])+'" r="4" fill="'+(ys[i]>=0?'#818cf8':'#f472b6')+'" fill-opacity=".72" stroke="#a78bfa" stroke-width="1"/>');
  [xMin,(xMin+xMax)/2,xMax].forEach(v=>svg+='<text x="'+tx(v)+'" y="'+(H-P.b+13)+'" text-anchor="middle" font-size="8" fill="#64748b">'+v.toFixed(0)+'</text>');
  svg+='<text x="'+(W/2)+'" y="'+H+'" text-anchor="middle" font-size="9" fill="#475569">Fitted Values</text>';
  svg+='<line x1="'+P.l+'" y1="'+P.t+'" x2="'+P.l+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  svg+='<line x1="'+P.l+'" y1="'+(H-P.b)+'" x2="'+(W-P.r)+'" y2="'+(H-P.b)+'" stroke="#1e293b"/>';
  return svg+'</svg>';
}

function svgCorrMatrix(dataArr,fields,W=400,H=400){
  const n=fields.length;
  if(n<2)return '<div class="chart-empty">Select ≥2 variables</div>';
  const cell=Math.floor(Math.min(W,H)/n);
  const mat=[];
  for(let i=0;i<n;i++){mat[i]=[];for(let j=0;j<n;j++){
    if(i===j){mat[i][j]=1;continue;}
    try{mat[i][j]=parseFloat(SE.pearsonR(dataArr.map(r=>r[fields[i]]),dataArr.map(r=>r[fields[j]])).r)||0;}catch{mat[i][j]=0;}
  }}
  function rColor(r){if(r>0){const t=r;return 'rgb('+Math.round(255*(1-t*.5))+','+Math.round(255*(1-t*.3))+',255)';}const t=Math.abs(r);return 'rgb(255,'+Math.round(255*(1-t*.3))+','+Math.round(255*(1-t*.5))+')';}
  const pad=54;
  let svg='<svg viewBox="0 0 '+(W+pad)+' '+(H+pad)+'" style="width:100%;height:auto;display:block;overflow:visible">';
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){
    const x=pad+j*cell,y=i*cell,r=mat[i][j];
    svg+='<rect x="'+x+'" y="'+y+'" width="'+cell+'" height="'+cell+'" fill="'+rColor(r)+'" opacity="'+(Math.abs(r)*.85+.15)+'"/>';
    svg+='<text x="'+(x+cell/2)+'" y="'+(y+cell/2+4)+'" text-anchor="middle" font-size="'+(cell>40?9:7)+'" fill="'+(Math.abs(r)>.5?'#fff':'#334155')+'" font-weight="600">'+r.toFixed(2)+'</text>';
  }
  fields.forEach((f,i)=>{
    svg+='<text x="'+(pad+i*cell+cell/2)+'" y="'+(H+pad-4)+'" text-anchor="middle" font-size="9" fill="#94a3b8" transform="rotate(-30,'+(pad+i*cell+cell/2)+','+(H+pad-4)+')">'+f.slice(0,8)+'</text>';
    svg+='<text x="'+(pad-4)+'" y="'+(i*cell+cell/2+4)+'" text-anchor="end" font-size="9" fill="#94a3b8">'+f.slice(0,8)+'</text>';
  });
  return svg+'</svg>';
}
