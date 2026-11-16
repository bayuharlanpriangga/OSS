// RENDER OUTPUT CLUSTER
function renderOutAdv_cluster(o){
  var html='';
      var r=o.res;
      var silCol=r.silhouette>=0.5?'var(--ok)':r.silhouette>=0.25?'var(--warn)':'var(--err)';
      var silLabel=r.silhouette>=0.7?'Strong':r.silhouette>=0.5?'Reasonable':r.silhouette>=0.25?'Weak':'Poor';
      html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-bottom:12px">';
      html+='<div class="sb"><div class="sb-label">Method</div><div class="sb-value" style="font-size:12px">'+( r.method==='kmeans'?'K-Means':'Hierarchical')+'</div></div>';
      html+='<div class="sb"><div class="sb-label">k Clusters</div><div class="sb-value" style="color:var(--gold-text)">'+r.k+'</div></div>';
      html+='<div class="sb"><div class="sb-label">N Cases</div><div class="sb-value">'+r.n+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Silhouette</div><div class="sb-value" style="color:'+silCol+'">'+r.silhouette+'</div><div class="sb-note">'+escHtml(silLabel)+'</div></div>';
      if(r.method==='kmeans'){
        html+='<div class="sb"><div class="sb-label">Within SS</div><div class="sb-value">'+r.totalWSS+'</div></div>';
        html+='<div class="sb"><div class="sb-label">Between SS</div><div class="sb-value">'+r.totalBSS+'</div></div>';
      } else {
        html+='<div class="sb"><div class="sb-label">Linkage</div><div class="sb-value" style="font-size:12px">'+r.linkage+'</div></div>';
      }
      html+='</div>';
      html+='<div class="sec-hd" style="margin-bottom:6px">Cluster Centroids (raw means)</div>';
      var cHeader=['Cluster','N','%'].concat(r.vars);
      html+=mkTable(cHeader, r.clusters.map(function(c){return [c.label,c.n,c.pct+'%'].concat(c.rawMeans);}));
      if(r.plotData){
        html+='<div style="margin-top:10px">'+svgClusterPlot(r)+'</div>';
      }
      if(r.method==='kmeans'&&r.elbowData){
        html+='<div class="sec-hd" style="margin-top:10px;margin-bottom:4px">Elbow Chart</div>';
        html+=svgElbow(r.elbowData);
      }
      if(r.method==='hierarchical'&&r.dendro){
        html+='<div class="sec-hd" style="margin-top:10px;margin-bottom:4px">Dendrogram</div>';
        html+=svgDendrogram(r.dendro,r.k,r.vars);
      }
      html+='<div class="sec-hd" style="margin-top:10px;margin-bottom:5px">ANOVA per Variable</div>';
      html+=mkTable(['Variable','F','df1','df2','p'],r.anova.map(function(a){var sig=parseFloat(a.p)<0.05;return [a.variable,a.F,a.df1,a.df2,(sig?'<b style="color:var(--ok)">':'')+a.p_fmt+(sig?'</b>':'')];}));
      html+='<div style="margin-top:6px;font-size:11px;color:var(--ink-subtle)">Silhouette ≥ .50 = reasonable cluster structure. Variables z-standardized before clustering.</div>';
  return html;
}
