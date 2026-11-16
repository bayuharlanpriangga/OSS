// RENDER OUTPUT DISCRIMINANT
function renderOutAdv_discriminant(o){
  var html='';
      var r=o.res;
      var accCol=parseFloat(r.accuracy)>=70?'var(--ok)':parseFloat(r.accuracy)>=50?'var(--warn)':'var(--err)';
      html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-bottom:12px">';
      html+='<div class="sb"><div class="sb-label">N</div><div class="sb-value">'+r.n+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Groups</div><div class="sb-value">'+r.groups.length+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Functions</div><div class="sb-value">'+r.nFunctions+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Wilks\' λ</div><div class="sb-value">'+r.wilksLambda+'</div><div class="sb-note">p = '+r.wilksP+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Accuracy</div><div class="sb-value" style="color:'+accCol+'">'+r.accuracy+'%</div></div>';
      html+='</div>';
      html+=mkTable(['Function','Eigenvalue','% Var','Cumul %','Canonical r'],
        r.eigenvalues.map(function(e,i){return ['Function '+(i+1),e.eigenvalue,e.pctVar+'%',e.cumPct+'%',e.canonicalR];}));
      html+='<div class="sec-hd" style="margin-top:12px;margin-bottom:6px">Standardized Coefficients</div>';
      var scHeader=['Predictor'].concat(r.eigenvalues.map(function(_,i){return 'Function '+(i+1);}));
      html+=mkTable(scHeader, r.preds.map(function(p,pi){return [p].concat(r.stdCoefs.map(function(fc){return fc[pi];}));}));
      html+='<div class="sec-hd" style="margin-top:12px;margin-bottom:6px">Structure Matrix</div>';
      html+=mkTable(scHeader, r.preds.map(function(p,pi){return [p].concat(r.structureMatrix.map(function(fc){return fc[pi];}));}));
      html+='<div style="margin-top:6px;font-size:11px;color:var(--ink-subtle)">|r| ≥ .30 = practically significant. Classification accuracy: '+r.accuracy+'%</div>';
  return html;
}
