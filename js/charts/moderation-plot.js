// ════════════════════════════════════════════════════════════
// js/charts/moderation-plot.js
// Fitur: Moderation Analysis chart (E9, split roadmap OSS 2.0) —
// dipetakan 2026-09-19, tidak ada di baseline lama, dikelompokkan
// bareng file stats-engine pasangannya (moderation ada di dalam
// js/stats-engine/stats-glm-hlm.js atau file lain — cek saat E9
// dipindah, tidak divalidasi ulang di sesi ini karena bukan bagian
// pemindahan file ini).
// Isi:
//   - svgModerationPlot(res,xName,wName,yName,W,H): garis regresi X→Y
//     pada 3 level moderator W (−1SD/Mean/+1SD) + scatter data mentah.
//     2 pemanggil: preview di renderModerationForm() dan output di
//     renderOutput() kasus moderation (analyze-form-render.js + app.js).
//   - svgSimpleSlopesPlot(res,xName,wName,yName,W,H): wrapper 3 baris,
//     langsung memanggil svgModerationPlot() dengan argumen yang sama
//     (bukan chart terpisah, tetap 1 paket sesuai keputusan tabel E).
//     HANYA 1 pemanggil (preview di renderModerationForm()) — tidak
//     dipakai renderOutput() di app.js, pola sama seperti
//     svgSEMDiagram/E7 dan svgSensitivityCurve/E8.
//   - svgJohnsonNeymanPlot(res,xName,wName,yName,W,H): kurva simple
//     slope vs moderator W, dengan band signifikan/tidak-signifikan dan
//     garis vertikal titik Johnson-Neyman. 2 pemanggil: preview + output
//     (sama seperti svgModerationPlot).
// Depends on: escHtml() dan SE (SE.f4, SE.tP) — global, dibaca runtime,
// aman dimuat sebelum app.js (scope-fallback ke global).
// ⚠️ Temuan E9 (dicatat 2026-09-20, BELUM diperbaiki, pola sama seperti
// Temuan E2/E6/E7): di svgJohnsonNeymanPlot, `wName` (nama variabel
// moderator, dari data user) dimasukkan ke teks SVG (judul sumbu X)
// TANPA escHtml — beda dengan `xName` di svgModerationPlot yang SUDAH
// di-escape. `yName` diterima sebagai parameter di kedua fungsi tapi
// TIDAK PERNAH dirender ke teks SVG di salah satu fungsi (tidak ada Y
// axis title) — jadi tidak berisiko, tidak perlu escHtml. Menunggu
// konfirmasi user apakah mau diperbaiki sekarang (aturan Bagian 4
// poin 4).
// ════════════════════════════════════════════════════════════

function svgModerationPlot(res,xName,wName,yName,W,H){
  W=W||420; H=H||220;
  var b0=parseFloat(res.coefs[0].b),b1=parseFloat(res.coefs[1].b),b2=parseFloat(res.coefs[2].b),b3_=parseFloat(res.coefs[3].b);
  var xMean=parseFloat(res.xMean),xSD=parseFloat(res.xSD);
  var wMean=parseFloat(res.wMean),wSD=parseFloat(res.wSD);
  var wLevels=[wMean-wSD,wMean,wMean+wSD];
  var wLabels=['W − 1SD','W Mean','W + 1SD'];
  var colors=['#60a5fa','#fbbf24','#f472b6'];

  // X range
  var xRange=[xMean-2*xSD,xMean+2*xSD];
  var lines=wLevels.map(function(w,wi){
    var wC=res.center?(w-wMean):w;
    var pts=[[xRange[0],b0+b1*(res.center?xRange[0]-xMean:xRange[0])+b2*wC+b3_*(res.center?xRange[0]-xMean:xRange[0])*wC],[xRange[1],b0+b1*(res.center?xRange[1]-xMean:xRange[1])+b2*wC+b3_*(res.center?xRange[1]-xMean:xRange[1])*wC]];
    return{pts:pts,color:colors[wi],label:wLabels[wi]};
  });

  var allY=lines.flatMap(function(l){return l.pts.map(function(p){return p[1];});});
  var yMin=Math.min.apply(null,allY),yMax=Math.max.apply(null,allY);
  var yPad=(yMax-yMin)*0.1||1;
  yMin-=yPad; yMax+=yPad;
  var P={l:40,r:80,t:14,b:40};
  var cw=W-P.l-P.r,ch=H-P.t-P.b;
  function tx(x){return P.l+(x-xRange[0])/(xRange[1]-xRange[0])*cw;}
  function ty(y){return P.t+ch*(1-(y-yMin)/(yMax-yMin));}

  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block">';
  // Grid
  [yMin,(yMin+yMax)/2,yMax].forEach(function(v){
    var y=ty(v); svg+='<line x1="'+P.l+'" x2="'+(P.l+cw)+'" y1="'+y+'" y2="'+y+'" stroke="rgba(255,255,255,.06)" stroke-width="1"/>';
    svg+='<text x="'+(P.l-4)+'" y="'+(y+4)+'" text-anchor="end" font-size="8" fill="#64748b">'+SE.f4(v)+'</text>';
  });
  // Lines
  lines.forEach(function(l){
    var x1=tx(l.pts[0][0]),y1=ty(l.pts[0][1]),x2=tx(l.pts[1][0]),y2=ty(l.pts[1][1]);
    svg+='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+l.color+'" stroke-width="2.2" stroke-linecap="round"/>';
    svg+='<circle cx="'+x2+'" cy="'+y2+'" r="4" fill="'+l.color+'" opacity="0.9"/>';
    svg+='<text x="'+(x2+5)+'" y="'+(y2+4)+'" font-size="9" fill="'+l.color+'">'+l.label+'</text>';
  });
  // Data points
  var pts=res.xArr.map(function(x,i){return{x:x,y:res.yArr[i]};});
  pts.forEach(function(pt){
    var px=tx(pt.x),py=ty(pt.y);
    if(px>=P.l&&px<=P.l+cw&&py>=P.t&&py<=P.t+ch)
      svg+='<circle cx="'+px+'" cy="'+py+'" r="3" fill="#818cf8" fill-opacity="0.35" stroke="#a78bfa" stroke-width="0.8"/>';
  });
  // Axes
  svg+='<line x1="'+P.l+'" y1="'+P.t+'" x2="'+P.l+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.2)" stroke-width="1.2"/>';
  svg+='<line x1="'+P.l+'" y1="'+(P.t+ch)+'" x2="'+(P.l+cw)+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.2)" stroke-width="1.2"/>';
  [xRange[0],(xRange[0]+xRange[1])/2,xRange[1]].forEach(function(v){svg+='<text x="'+tx(v)+'" y="'+(H-P.b+14)+'" text-anchor="middle" font-size="8" fill="#64748b">'+SE.f4(v)+'</text>';});
  svg+='<text x="'+(P.l+cw/2)+'" y="'+H+'" text-anchor="middle" font-size="9" fill="#475569">'+escHtml(xName)+'</text>';
  return svg+'</svg>';
}

function svgSimpleSlopesPlot(res,xName,wName,yName,W,H){
  return svgModerationPlot(res,xName,wName,yName,W,H);
}

function svgJohnsonNeymanPlot(res,xName,wName,yName,W,H){
  W=W||420; H=H||220;
  var b1=parseFloat(res.coefs[1].b),b3_=parseFloat(res.coefs[3].b);
  var wMean=parseFloat(res.wMean),wSD=parseFloat(res.wSD);
  var wArr=res.wArr;
  var wSorted=[...wArr].sort(function(a,b){return a-b;});
  var wMin=wSorted[0],wMax=wSorted[wSorted.length-1];
  var steps=200;
  var wPoints=[]; for(var i=0;i<=steps;i++) wPoints.push(wMin+i*(wMax-wMin)/steps);

  var slopeData=wPoints.map(function(w){
    var wC=res.center?(w-wMean):w;
    var sl=b1+b3_*wC;
    var se2=Math.sqrt(Math.max(0.0001,parseFloat(res.coefs[1].SE)*parseFloat(res.coefs[1].SE)+wC*wC*parseFloat(res.coefs[3].SE)*parseFloat(res.coefs[3].SE)));
    var tv=se2>0?sl/se2:0;
    var p=SE.tP(Math.abs(tv),res.dfE);
    return{w:w,slope:sl,t:tv,p:p};
  });

  var slopeMin=Math.min.apply(null,slopeData.map(function(d){return d.slope;}));
  var slopeMax=Math.max.apply(null,slopeData.map(function(d){return d.slope;}));
  var sRange=slopeMax-slopeMin||1;
  var P={l:40,r:16,t:18,b:40};
  var cw=W-P.l-P.r,ch=H-P.t-P.b;
  function tx(w){return P.l+(w-wMin)/(wMax-wMin)*cw;}
  function ty(s){return P.t+ch*(1-(s-slopeMin)/sRange);}

  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;margin-top:12px;display:block">';
  // Y=0 reference line
  var y0=ty(0);
  if(y0>=P.t&&y0<=P.t+ch) svg+='<line x1="'+P.l+'" x2="'+(P.l+cw)+'" y1="'+y0+'" y2="'+y0+'" stroke="rgba(255,255,255,.15)" stroke-width="1.5" stroke-dasharray="5,3"/>';

  // Color bands: sig vs non-sig
  slopeData.forEach(function(d,i){
    if(i===0) return;
    var x1=tx(slopeData[i-1].w),x2=tx(d.w);
    var isSig=d.p<0.05;
    svg+='<rect x="'+x1+'" y="'+P.t+'" width="'+(x2-x1)+'" height="'+ch+'" fill="'+(isSig?'rgba(52,211,153,.06)':'rgba(248,113,113,.04)')+'"/>';
  });

  // Slope curve
  var pts2=slopeData.map(function(d){return{x:tx(d.w),y:ty(d.slope),sig:d.p<0.05};});
  if(pts2.length>=2){
    var path='';
    pts2.forEach(function(p,i){path+=(i===0?'M':'L')+p.x+' '+p.y;});
    svg+='<path d="'+path+'" fill="none" stroke="#c084fc" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
  }

  // JN points
  res.jn.regions.forEach(function(r){
    var xj=tx(r.value);
    svg+='<line x1="'+xj+'" y1="'+P.t+'" x2="'+xj+'" y2="'+(P.t+ch)+'" stroke="#f472b6" stroke-width="1.5" stroke-dasharray="4,3"/>';
    svg+='<text x="'+(xj+3)+'" y="'+(P.t+12)+'" font-size="9" fill="#f472b6">JN='+SE.f4(r.value)+'</text>';
  });

  // Y axis labels
  [slopeMin,(slopeMin+slopeMax)/2,slopeMax].forEach(function(v){
    var y=ty(v);
    svg+='<line x1="'+P.l+'" x2="'+(P.l+cw)+'" y1="'+y+'" y2="'+y+'" stroke="rgba(255,255,255,.05)"/>';
    svg+='<text x="'+(P.l-4)+'" y="'+(y+4)+'" text-anchor="end" font-size="8" fill="#64748b">'+SE.f4(v)+'</text>';
  });
  svg+='<line x1="'+P.l+'" y1="'+P.t+'" x2="'+P.l+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.2)" stroke-width="1.2"/>';
  svg+='<line x1="'+P.l+'" y1="'+(P.t+ch)+'" x2="'+(P.l+cw)+'" y2="'+(P.t+ch)+'" stroke="rgba(255,255,255,.2)" stroke-width="1.2"/>';
  [wMin,(wMin+wMax)/2,wMax].forEach(function(v){svg+='<text x="'+tx(v)+'" y="'+(H-P.b+14)+'" text-anchor="middle" font-size="8" fill="#64748b">'+SE.f4(v)+'</text>';});
  svg+='<text x="'+(P.l+cw/2)+'" y="'+H+'" text-anchor="middle" font-size="9" fill="#475569">'+wName+' (Moderator)</text>';
  svg+='<text x="12" y="'+(P.t+ch/2)+'" text-anchor="middle" font-size="8" fill="#475569" transform="rotate(-90,12,'+(P.t+ch/2)+')">Simple Slope</text>';
  // Legend
  svg+='<rect x="'+(P.l+4)+'" y="'+(P.t+4)+'" width="10" height="8" rx="2" fill="rgba(52,211,153,.25)"/>';
  svg+='<text x="'+(P.l+17)+'" y="'+(P.t+11)+'" font-size="8" fill="#34d399">Significant (p&lt;.05)</text>';
  svg+='<rect x="'+(P.l+4)+'" y="'+(P.t+15)+'" width="10" height="8" rx="2" fill="rgba(248,113,113,.2)"/>';
  svg+='<text x="'+(P.l+17)+'" y="'+(P.t+22)+'" font-size="8" fill="#f87171">Non-significant</text>';
  return svg+'</svg>';
}
