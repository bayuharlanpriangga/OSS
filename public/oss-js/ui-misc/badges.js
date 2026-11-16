// UPDATE BADGES
function updateBadges(){
  var mc=missCount().reduce(function(s,v){return s+v.count;},0);
  var nDisp=aState.wcActive?getNEff():data.length;
  var bc=document.getElementById('badge-cases');
  if(bc)bc.textContent='N='+nDisp+(aState.wcActive?' (ΣW)':'')+' kasus';
  var bm=document.getElementById('badge-miss');
  if(bm){
    var bmSpan=bm.querySelector('span');
    if(bmSpan)bmSpan.textContent=mc+' missing';
    else bm.textContent=mc+' missing';
    bm.style.display=mc>0?'flex':'none';
  }
  var tbc=document.getElementById('tb-cases');
  if(tbc)tbc.textContent='N='+nDisp+(aState.wcActive?'(ΣW)':'');
  var tbm=document.getElementById('tb-miss');
  if(tbm){tbm.style.display=mc>0?'inline-flex':'none';}
  var ob=document.getElementById('out-badge');
  if(ob){ob.textContent=outputs.length;ob.style.display=outputs.length>0?'inline':'none';}
  renderDsSidebar();
}
