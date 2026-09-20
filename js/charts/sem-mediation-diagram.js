// svgMediationPath
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

function svgSEMDiagram(latents,latentMap,paths,semResult,semColors){
  var nL=latents.length;
  if(!nL) return '<div class="chart-empty">Belum ada konstruk laten</div>';
  var W=500,H=Math.max(240,nL*80+60);
  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;max-height:380px">';

  // Defs
  svg+='<defs><marker id="arrowSEM" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#e879f9" opacity="0.8"/></marker>';
  svg+='<filter id="glowSEM"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';

  // Position latents in a circle/column layout
  var cx=W/2,r=Math.min((H-80)/2,W/3);
  var positions={};
  latents.forEach(function(ln,i){
    var angle=(2*Math.PI*i/nL)-Math.PI/2;
    var x=nL===1?cx:cx+r*Math.cos(angle);
    var y=nL===1?H/2:H/2+r*Math.sin(angle);
    if(nL===2){x=i===0?120:W-120;y=H/2;}
    if(nL===3){
      if(i===0){x=cx;y=50;}
      else if(i===1){x=80;y=H-50;}
      else{x=W-80;y=H-50;}
    }
    positions[ln]={x:Math.round(x),y:Math.round(y)};
  });

  // Draw structural paths
  paths.forEach(function(path){
    var from=positions[path.from],to=positions[path.to];
    if(!from||!to) return;
    var dx=to.x-from.x,dy=to.y-from.y,dist=Math.sqrt(dx*dx+dy*dy);
    if(dist<1) return;
    var ux=dx/dist,uy=dy/dist;
    var x1=from.x+ux*32,y1=from.y+uy*32;
    var x2=to.x-ux*32,y2=to.y-uy*32;
    // Curved path
    var mx=(x1+x2)/2,my=(y1+y2)/2-20;
    svg+='<path d="M'+x1+','+y1+' Q'+mx+','+my+' '+x2+','+y2+'" fill="none" stroke="#e879f9" stroke-width="2" opacity="0.7" marker-end="url(#arrowSEM)"/>';
    // Beta label
    if(semResult&&semResult.paths){
      var pr=semResult.paths.find(function(p){return p.from===path.from&&p.to===path.to;});
      if(pr){
        var lx=(x1+x2)/2,ly=(y1+y2)/2-18;
        var psig=parseFloat(pr.p)<0.05;
        svg+='<rect x="'+(lx-16)+'" y="'+(ly-9)+'" width="32" height="14" rx="4" fill="rgba(14,6,24,.8)" stroke="rgba(232,121,249,.3)" stroke-width="1"/>';
        svg+='<text x="'+lx+'" y="'+(ly+3)+'" text-anchor="middle" font-size="9" font-weight="700" fill="'+(psig?'#34d399':'#f87171')+'">β='+pr.beta+'</text>';
      }
    }
  });

  // Draw latent variable ellipses
  latents.forEach(function(ln,li){
    var pos=positions[ln];
    var col=semColors[li%semColors.length];
    // Ellipse for latent
    svg+='<ellipse cx="'+pos.x+'" cy="'+pos.y+'" rx="35" ry="22" fill="'+col.replace('#','rgba(').replace(/(.{6})/,'$1,.12)')+'" stroke="'+col+'" stroke-width="1.8" filter="url(#glowSEM)"/>';
    svg+='<text x="'+pos.x+'" y="'+(pos.y+4)+'" text-anchor="middle" font-size="9.5" font-weight="800" fill="'+col+'">'+escHtml(ln.slice(0,9))+'</text>';

    // Draw indicator lines
    var indics=latentMap[ln]||[];
    var nI=indics.length;
    indics.forEach(function(v,vi){
      var angle2=(2*Math.PI*vi/nI)-Math.PI/2;
      var ix=pos.x+70*Math.cos(angle2),iy=pos.y+70*Math.sin(angle2);
      // Adjust for nI===1
      if(nI===1){ix=pos.x;iy=pos.y+72;}
      if(nI===2){ix=pos.x+(vi===0?-55:55);iy=pos.y+55;}
      // Clamp to SVG bounds
      ix=Math.max(22,Math.min(W-22,ix));
      iy=Math.max(18,Math.min(H-18,iy));
      // Arrow from latent to indicator
      var dx2=ix-pos.x,dy2=iy-pos.y,dist2=Math.sqrt(dx2*dx2+dy2*dy2);
      if(dist2<1) return;
      var ux2=dx2/dist2,uy2=dy2/dist2;
      svg+='<line x1="'+(pos.x+ux2*22)+'" y1="'+(pos.y+uy2*22)+'" x2="'+(ix-ux2*14)+'" y2="'+(iy-uy2*14)+'" stroke="'+col+'" stroke-width="1.2" opacity="0.5"/>';
      // Indicator rect
      svg+='<rect x="'+(ix-18)+'" y="'+(iy-10)+'" width="36" height="18" rx="4" fill="rgba(14,6,24,.7)" stroke="'+col+'" stroke-width="1" opacity="0.8"/>';
      svg+='<text x="'+ix+'" y="'+(iy+4)+'" text-anchor="middle" font-size="8" fill="'+col+'" opacity="0.9">'+escHtml(v.slice(0,6))+'</text>';
    });
  });

  svg+='</svg>';
  return svg;
}
