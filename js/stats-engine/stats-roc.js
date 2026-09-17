//ROC Curve computation
function computeROC(dataArr,probVar,trueVar,posClass){
  var cases=dataArr.filter(function(r){return SE.isV(r[probVar])&&!isMiss(r[trueVar]);});
  var n=cases.length;
  if(n<10) throw new Error('Need ≥10 complete cases');
  var probs=cases.map(function(r){return Number(r[probVar]);});
  var trueLabels=cases.map(function(r){return r[trueVar];});
  // Determine positive class
  var uniq=[...new Set(trueLabels.map(String))];
  var pos=posClass||uniq[uniq.length-1];
  var binary=trueLabels.map(function(v){return String(v)===String(pos)?1:0;});
  var nPos=binary.reduce(function(s,v){return s+v;},0);
  var nNeg=n-nPos;
  if(nPos<1||nNeg<1) throw new Error('Both classes must have at least 1 case');

  // Sort by prob descending
  var sorted=probs.map(function(p,i){return{p:p,y:binary[i]};}).sort(function(a,b){return b.p-a.p;});

  // Build curve
  var thresholds=[];
  sorted.forEach(function(s){if(!thresholds.includes(s.p))thresholds.push(s.p);});
  thresholds.sort(function(a,b){return b-a;});
  thresholds.push(-Infinity);

  var curve=[];
  thresholds.forEach(function(t){
    var tp=0,fp=0,tn=0,fn=0;
    sorted.forEach(function(s){
      var pred=s.p>=t?1:0;
      if(pred===1&&s.y===1)tp++;
      else if(pred===1&&s.y===0)fp++;
      else if(pred===0&&s.y===0)tn++;
      else fn++;
    });
    var tpr=nPos>0?tp/nPos:0;
    var fpr=nNeg>0?fp/nNeg:0;
    var ppv=(tp+fp)>0?tp/(tp+fp):0;
    var npv=(tn+fn)>0?tn/(tn+fn):0;
    var f1=(2*tp+fp+fn)>0?2*tp/(2*tp+fp+fn):0;
    curve.push({t:t===(-Infinity)?0:t,tpr:tpr,fpr:fpr,ppv:ppv,npv:npv,f1:f1,tp:tp,fp:fp,tn:tn,fn:fn,youden:tpr+(1-fpr)-1});
  });
  // Ensure (0,0) and (1,1)
  if(curve[0].fpr!==0||curve[0].tpr!==0) curve.unshift({t:Infinity,tpr:0,fpr:0,ppv:1,npv:1,f1:0});
  curve.push({t:-1,tpr:1,fpr:1});

  // AUC via trapezoidal rule
  var auc=0;
  for(var i=1;i<curve.length;i++){
    auc+=Math.abs(curve[i].fpr-curve[i-1].fpr)*(curve[i].tpr+curve[i-1].tpr)/2;
  }
  auc=Math.min(1,Math.max(0,auc));

  // 95% CI via Hanley-McNeil
  var q1=auc/(2-auc),q2=2*auc*auc/(1+auc);
  var seAuc=Math.sqrt((auc*(1-auc)+(nPos-1)*(q1-auc*auc)+(nNeg-1)*(q2-auc*auc))/(nPos*nNeg));
  var z95=SE.normInv(0.975);
  var aucCI='['+SE.f4(Math.max(0,auc-z95*seAuc))+', '+SE.f4(Math.min(1,auc+z95*seAuc))+']';

  // Optimal threshold (Youden index)
  var bestPt=curve.reduce(function(best,pt){return pt.youden>best.youden?pt:best;},curve[0]);

  var aucInterp=auc>=0.9?'Excellent':auc>=0.8?'Good':auc>=0.7?'Acceptable':auc>=0.6?'Poor':'Fail';

  return {n:n,nPos:nPos,nNeg:nNeg,auc:SE.f4(auc),aucCI:aucCI,aucInterp:aucInterp,
    optThresh:SE.f4(bestPt.t),optSens:SE.f4(bestPt.tpr),optSpec:SE.f4(1-bestPt.fpr),
    optPPV:SE.f4(bestPt.ppv),optNPV:SE.f4(bestPt.npv),optF1:SE.f4(bestPt.f1),optYouden:SE.f4(bestPt.youden),
    curve:curve,posClass:pos};
}

function deLongTest(roc1,roc2){
  var z=(parseFloat(roc1.auc)-parseFloat(roc2.auc))/Math.sqrt(Math.pow(parseFloat(roc1.aucCI.replace(/[\[\] ]/g,'').split(',')[1])-parseFloat(roc1.auc),2)+Math.pow(parseFloat(roc2.aucCI.replace(/[\[\] ]/g,'').split(',')[1])-parseFloat(roc2.auc),2)||0.001);
  var p=2*(1-SE.normCDF(Math.abs(z)));
  return {z:SE.f4(z),p:SE.f4(p),p_fmt:SE.pFmt(p)};
}
