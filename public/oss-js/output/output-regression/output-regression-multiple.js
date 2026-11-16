// o.type==='multipleReg'
function renderOutBasic_multipleReg(o){
  var html='';
      // Assumption warnings first
      if(o.res.warnings&&o.res.warnings.length){
        html+='<div class="assumption-box" style="margin-bottom:12px">';
        html+='<div style="font-size:10.5px;font-weight:700;color:var(--warn);margin-bottom:6px;text-transform:uppercase;letter-spacing:.7px">Assumption Checks</div>';
        o.res.warnings.forEach(w=>{
          const col=w.level==='error'?'var(--err)':w.level==='info'?'var(--line)':'var(--warn)';
          const ic=w.level==='error'?'✗':w.level==='info'?'ℹ':'⚠';
          html+='<div style="display:flex;gap:7px;align-items:flex-start;margin-bottom:5px"><span style="color:'+col+';flex-shrink:0">'+ic+'</span><span style="font-size:11.5px;color:var(--ink-muted)">'+escHtml(w.msg)+'</span></div>';
        });
        html+='</div>';
      }
      html+=mkTable(['Source','df','SS','F','p'],[['Regression',o.res.dfReg,o.res.SSR,o.res.F,o.res.pF_fmt],['Residual',o.res.dfRes,o.res.SSE,'',''],['Total',o.res.dfReg+o.res.dfRes,o.res.SST,'','']]);
      html+='<div class="stats-grid" style="margin:10px 0">'+stCard('R²',o.res.R2)+stCard('Adj R²',o.res.R2adj)+stCard('RMSE',o.res.RMSE)+stCard('DW',o.res.DW,'Ideal: 1.5–2.5')+'</div>';
      html+='<div class="row" style="margin-bottom:10px">'+sigBadge(o.res.pF)+'</div>';
      // Toggle: OLS vs HC3 robust
      const hasBP=o.res.bpSig;
      html+='<div style="display:flex;gap:6px;margin-bottom:8px;align-items:center;flex-wrap:wrap">';
      html+='<button onclick="toggleCoefView(this,\'ols\')" class="dt-btn coef-tab active-coef">OLS SE</button>';
      html+='<button onclick="toggleCoefView(this,\'hc3\')" class="dt-btn coef-tab">HC3 Robust SE'+(hasBP?' ⚠':'')+'</button>';
      if(hasBP) html+='<span style="font-size:11px;color:var(--warn);font-weight:600">Heteroscedasticity detected — HC3 recommended</span>';
      html+='</div>';
      // OLS table
      html+='<div id="coef-ols">';
      html+=mkTable(['Variable','B','SE','β','t','p','VIF'],o.res.coefs.map((c,i)=>{
        const vif=i===0?'—':o.res.vif[i-1];
        const vifCol=i>0&&parseFloat(vif)>10?'color:var(--err)':i>0&&parseFloat(vif)>5?'color:var(--warn)':'';
        const pSig=parseFloat(c.p_fmt)<0.05;
        return[escHtml(c.name),c.B,c.SE,i===0?'—':c.beta,c.t,
          (pSig?'<b style="color:var(--ok)">':'')+c.p_fmt+(pSig?'</b>':''),
          vifCol?'<span style="'+vifCol+';font-weight:600">'+vif+'</span>':vif];
      }));
      html+='</div>';
      // HC3 table (hidden by default)
      html+='<div id="coef-hc3" style="display:none">';
      html+=mkTable(['Variable','B','HC3-SE','β','HC3-t','HC3-p','VIF'],o.res.coefs.map((c,i)=>{
        const vif=i===0?'—':o.res.vif[i-1];
        const vifCol=i>0&&parseFloat(vif)>10?'color:var(--err)':i>0&&parseFloat(vif)>5?'color:var(--warn)':'';
        const hcSE=c.SE_HC3||c.SE; const hcT=c.t_HC3||c.t; const hcP=c.p_HC3_fmt||c.p_fmt;
        const pSig=c.sig_HC3!==undefined?c.sig_HC3:parseFloat(hcP)<0.05;
        return[escHtml(c.name),c.B,hcSE,i===0?'—':c.beta,hcT,
          (pSig?'<b style="color:var(--ok)">':'')+hcP+(pSig?'</b>':''),
          vifCol?'<span style="'+vifCol+';font-weight:600">'+vif+'</span>':vif];
      }));
      html+='<div style="font-size:11px;color:var(--ink-subtle);margin-top:5px">HC3 = heteroscedasticity-consistent covariance (Long & Ervin 2000). Use when BP test is significant.</div>';
      html+='</div>';
      html+='<div class="eq">'+escHtml(o.yName)+' = '+o.res.coefs.map(c=>c.name==='(Constant)'?c.B:c.B+'·'+escHtml(c.name)).join(' + ')+'</div>';
      // Cook's D summary
      if(o.res.highCooks>0||o.res.highLeverage>0){
        html+='<div class="notice-box" style="margin-top:10px">';
        html+='<div style="font-size:10.5px;color:var(--ink-muted);font-weight:700;text-transform:uppercase;letter-spacing:.7px;margin-bottom:5px">Influence Diagnostics</div>';
        html+='<div style="font-size:11.5px;color:var(--ink-muted)">Cook D max: <b style="color:var(--ink)">'+o.res.cooksMax+'</b> (threshold: '+parseFloat(4/data.length).toFixed(3)+')</div>';
        if(o.res.highCooks>0) html+='<div style="font-size:11.5px;color:var(--warn)">'+o.res.highCooks+' potentially influential observation(s)</div>';
        if(o.res.highLeverage>0) html+='<div style="font-size:11.5px;color:var(--line)">'+o.res.highLeverage+' high-leverage point(s)</div>';
        html+='</div>';
      }
  return html;
}
