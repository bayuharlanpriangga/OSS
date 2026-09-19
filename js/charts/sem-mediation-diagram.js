// ════════════════════════════════════════════════════════════
// js/charts/sem-mediation-diagram.js
// Fitur: diagram path SEM & Mediation (E6/E7, split roadmap OSS 2.0)
// Isi saat ini (E6 saja — E7/svgSEMDiagram menyusul sesi berikutnya):
//   - svgMediationPath(xName,mNames,yName,preview): diagram path X→M→Y
//     untuk hasil Mediation Analysis (Baron-Kenny), dipakai renderOutput()
//     kasus 'mediation' di app.js.
// Depends on: escHtml() (app.js) — dibaca di runtime, tidak ada top-level
// call, aman dimuat sebelum app.js (scope-fallback ke global). Selain itu
// tidak ada dependency lain (tidak akses SE/PAL2/vars/data global).
// ✅ Temuan E6 DIPERBAIKI (2026-09-20, atas permintaan user): xName,
// tiap mName, dan yName sekarang dibungkus escHtml() sebelum masuk ke
// teks SVG (pola sama seperti temuan E2/svgInteractionPlot, yang MASIH
// belum diperbaiki — lihat file interaction-plot.js). Untuk nama
// variabel normal (huruf/angka/underscore) hasilnya identik karena
// tidak ada karakter yang di-escape.
// ════════════════════════════════════════════════════════════

function svgMediationPath(xName,mNames,yName,preview){
  var W=420,H=mNames&&mNames.length>1?160:120;
  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;max-width:420px;height:auto;display:inline-block">';
  var cx=W/2,xc=50,yc=W-50,mc=cx;
  var mCount=mNames?mNames.length:1;
  var yBase=H-30;

  // Draw X node
  svg+='<rect x="10" y="'+(yBase-16)+'" width="76" height="28" rx="8" fill="rgba(251,146,60,.15)" stroke="rgba(251,146,60,.5)" stroke-width="1.5"/>';
  svg+='<text x="48" y="'+(yBase+5)+'" text-anchor="middle" font-size="11" font-weight="700" fill="#fb923c">'+escHtml(xName.slice(0,8))+'</text>';
  // Draw Y node
  svg+='<rect x="'+(W-86)+'" y="'+(yBase-16)+'" width="76" height="28" rx="8" fill="rgba(103,232,249,.12)" stroke="rgba(103,232,249,.45)" stroke-width="1.5"/>';
  svg+='<text x="'+(W-48)+'" y="'+(yBase+5)+'" text-anchor="middle" font-size="11" font-weight="700" fill="#67e8f9">'+escHtml(yName.slice(0,8))+'</text>';

  // Direct effect arrow X→Y (dashed = c')
  var c_prime=preview&&preview.barronKenny?preview.barronKenny.c_prime:'';
  var directSig=preview&&preview.barronKenny?parseFloat(preview.barronKenny.p_c_prime)<0.05:true;
  svg+='<line x1="86" y1="'+yBase+'" x2="'+(W-86)+'" y2="'+yBase+'" stroke="'+(directSig?'#67e8f9':'rgba(100,116,139,.6)')+'" stroke-width="1.8" stroke-dasharray="'+(directSig?'0':'5,3')+'"/>';
  svg+='<polygon points="'+(W-86)+','+yBase+' '+(W-92)+','+(yBase-4)+' '+(W-92)+','+(yBase+4)+'" fill="'+(directSig?'#67e8f9':'rgba(100,116,139,.6)')+'"/>';
  if(c_prime) svg+='<text x="'+cx+'" y="'+(yBase-6)+'" text-anchor="middle" font-size="9" fill="rgba(232,222,255,.45)">c\'='+c_prime+'</text>';

  // Draw mediators
  if(mNames&&mNames.length>0){
    var mSpacing=mCount>1?Math.min(80,(W-120)/(mCount)):0;
    var mStartX=cx-(mSpacing*(mCount-1)/2);
    var mY=22;
    mNames.forEach(function(mName,i){
      var mx=mStartX+i*mSpacing;
      // M box
      svg+='<rect x="'+(mx-38)+'" y="'+(mY-16)+'" width="76" height="28" rx="8" fill="rgba(244,114,182,.12)" stroke="rgba(244,114,182,.4)" stroke-width="1.5"/>';
      svg+='<text x="'+mx+'" y="'+(mY+5)+'" text-anchor="middle" font-size="10" font-weight="700" fill="#f472b6">'+escHtml(mName.slice(0,8))+'</text>';
      // a: X→M
      var aSig=preview&&preview.barronKenny?parseFloat(preview.barronKenny.p_a)<0.05:true;
      svg+='<line x1="72" y1="'+(yBase-16)+'" x2="'+(mx-10)+'" y2="'+(mY+12)+'" stroke="'+(aSig?'#fb923c':'rgba(100,116,139,.5)')+'" stroke-width="1.5"/>';
      if(preview&&preview.barronKenny) svg+='<text x="'+(72+(mx-10))/2+'" y="'+(yBase/2)+'" font-size="8.5" fill="rgba(251,146,60,.7)">a='+preview.barronKenny.a+'</text>';
      // b: M→Y
      var bSig=preview&&preview.barronKenny?parseFloat(preview.barronKenny.p_b)<0.05:true;
      svg+='<line x1="'+(mx+10)+'" y1="'+(mY+12)+'" x2="'+(W-86)+'" y2="'+(yBase-16)+'" stroke="'+(bSig?'#f472b6':'rgba(100,116,139,.5)')+'" stroke-width="1.5"/>';
      if(preview&&preview.barronKenny) svg+='<text x="'+(mx+10+(W-86))/2+'" y="'+(yBase/2)+'" font-size="8.5" fill="rgba(244,114,182,.7)">b='+preview.barronKenny.b+'</text>';
    });
  }
  svg+='</svg>';
  return svg;
}
