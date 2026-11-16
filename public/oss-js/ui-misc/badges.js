// UPDATE BADGES
function updateBadges(){
  var cellMiss=missCount().reduce(function(s,v){return s+v.count;},0);
  var mc=(typeof data!=='undefined'&&Array.isArray(data)&&data.length===0&&typeof vars!=='undefined'&&Array.isArray(vars)&&vars.length>0)?vars.length:cellMiss;
  var nDisp=aState.wcActive?getNEff():data.length;
  var bc=document.getElementById('badge-cases');
  if(bc)bc.textContent='N='+nDisp+(aState.wcActive?' (ΣW)':'')+' kasus';
  var tbc=document.getElementById('tb-cases');
  if(tbc)tbc.textContent='N='+nDisp+(aState.wcActive?'(ΣW)':'');
  var mnb=document.getElementById('miss-nav-badge');
  if(mnb){
    mnb.textContent=String(mc);
    mnb.style.display=mc>0?'inline-flex':'none';
  }
  var ob=document.getElementById('out-badge');
  if(ob){ob.textContent=outputs.length;ob.style.display=outputs.length>0?'inline':'none';}
  renderDsSidebar();
}
