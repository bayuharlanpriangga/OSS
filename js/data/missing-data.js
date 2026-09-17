// ════════════════════════════════════════════════════════════════════════
// MISSING DATA ANALYSIS — Little's MCAR Test + Pattern Matrix (C11, split
// roadmap OSS 2.0). BEDA STRUKTUR dari C1-C10: di baseline/app.js ini
// BUKAN fungsi berdiri sendiri, melainkan 1 cabang
// `else if(currentASub==='missinganalysis'){...}` di tengah switch
// raksasa `renderASub()` (D1, ~50 cabang, belum dipisah). Supaya bisa
// dipisah tanpa merusak alur `renderASub()`, badan cabang ini DIBUNGKUS
// jadi fungsi baru `renderMissingDataAnalysis()` yang membangun & me-
// return string HTML-nya sendiri (var `html` lokal, bukan lagi variabel
// bersama `renderASub()`) — SATU-SATUNYA perubahan struktural dari kode
// aslinya; isi logika di dalamnya (kalkulasi, HTML yang dihasilkan,
// urutan) 100% byte-exact, tidak ada yang diubah.
//
// Call-site di `renderASub()` (masih di app.js) juga HARUS diubah dari:
//   else if(currentASub==='missinganalysis'){ ...263 baris kode... }
// jadi:
//   else if(currentASub==='missinganalysis'){ html+=renderMissingDataAnalysis(); }
// (lihat komentar pointer yang ditinggal di app.js persis di titik ini).
//
// Dicek sebelum dibungkus: cabang aslinya TIDAK PERNAH membaca `html`
// (cuma `html+=`, tidak pernah `html=` reset atau baca isi/panjang
// `html` untuk logika apa pun) dan TIDAK memakai variabel dari scope
// `renderASub()` lain (`nF`/`aF`/`aState` dkk sama sekali tidak dipakai
// di cabang ini) — cuma `vars`/`data`/`escHtml` (global/lintas file) dan
// `nF2`/`n2`/dll yang didefinisikan lokal di dalam cabang itu sendiri.
// Karena itu membungkusnya jadi fungsi terpisah dengan `var html=''` +
// `return html;` di akhir dijamin PERSIS SAMA perilakunya dengan
// sebelumnya — bukan refactor, cuma perubahan bentuk pembungkus.
//
// Dependency (`vars`, `data`, `escHtml`) dibaca di dalam function body
// (runtime, dipanggil dari `renderASub()` saat sub-tab "Missing Data
// Analysis" aktif) — aman dimuat sbg file pre-app.js lewat scope-
// fallback ke global, tidak ada top-level call di file ini.
// ════════════════════════════════════════════════════════════════════════
function renderMissingDataAnalysis(){
  var html='';
    var nF2=vars.filter(function(v){return v.type==='Numeric';}).map(function(v){return v.name;});
    var n2=data.length;

    html+='<div class="analyze-info-bar"><div class="analyze-info-title">◎ Missing Data Analysis</div><div class="analyze-info-desc">Little\'s MCAR test: apakah data hilang bersifat acak (MCAR). Pattern matrix memvisualisasikan distribusi dan co-occurrence nilai hilang.</div></div>';

    if(!n2||!nF2.length){
      html+='<div class="card"><div class="chart-empty" style="padding:38px 0">No numeric data loaded. Import a CSV file to begin missing data analysis.</div></div>';
    } else {
      // ── Overall missing summary ──
      var totalCells=n2*nF2.length;
      var missPerVar=nF2.map(function(v){
        var cnt=data.filter(function(r){return r[v]===null||r[v]===undefined||r[v]==='';}).length;
        return{name:v,count:cnt,pct:(cnt/n2*100).toFixed(1)};
      });
      var totalMiss=missPerVar.reduce(function(s,v){return s+v.count;},0);
      var totalPct=(totalMiss/totalCells*100).toFixed(1);

      html+='<div class="card"><div class="sec-hd">Overall Summary</div>';
      html+='<div class="stats-grid" style="margin-bottom:12px">';
      html+='<div class="sb"><div class="sb-label">Total Cases</div><div class="sb-value">'+n2+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Numeric Variables</div><div class="sb-value">'+nF2.length+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Total Missing</div><div class="sb-value" style="color:'+(totalMiss>0?'#f87171':'#34d399')+'">'+totalMiss+'</div></div>';
      html+='<div class="sb"><div class="sb-label">Missing %</div><div class="sb-value" style="color:'+(parseFloat(totalPct)>5?'#f87171':parseFloat(totalPct)>0?'#fbbf24':'#34d399')+'">'+totalPct+'%</div></div>';
      html+='</div>';

      // Missing per variable bar chart
      html+='<div class="sec-hd" style="margin-bottom:8px">Missing by Variable</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th>Variable</th><th>Missing N</th><th>Missing %</th><th>Valid N</th><th>Distribution</th></tr></thead><tbody>';
      missPerVar.forEach(function(mv){
        var pctNum=parseFloat(mv.pct);
        var barCol=pctNum>20?'#f87171':pctNum>5?'#fbbf24':'#34d399';
        var barW=Math.max(0,Math.min(100,pctNum));
        html+='<tr>';
        html+='<td class="td-label" style="color:#c084fc">'+escHtml(mv.name)+'</td>';
        html+='<td class="td-num" style="color:'+(mv.count>0?'#f87171':'#34d399')+'">'+mv.count+'</td>';
        html+='<td class="td-num">'+mv.pct+'%</td>';
        html+='<td class="td-num" style="color:#34d399">'+(n2-mv.count)+'</td>';
        html+='<td style="min-width:120px"><div style="background:rgba(124,58,237,.12);border-radius:4px;height:8px;overflow:hidden"><div style="background:'+barCol+';width:'+barW+'%;height:100%;border-radius:4px;transition:width .5s"></div></div></td>';
        html+='</tr>';
      });
      html+='</tbody></table></div></div>';

      // ── Little's MCAR Test ──
      html+='<div class="card"><div class="sec-hd">Little\'s MCAR Test</div>';
      if(totalMiss===0){
        html+='<div style="padding:14px;background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.25);border-radius:8px;color:#34d399;font-weight:600;text-align:center">✓ No missing data found. MCAR test not applicable.</div>';
      } else {
        // Little's MCAR: chi-squared test
        // Group rows by missing pattern, compute expected means under MCAR, sum chi² deviations
        (function(){
          var f4L=function(v){return isFinite(v)?+(+v).toFixed(4):NaN;};
          var p2=nF2.length;

          // Compute overall means and variances for each variable
          var gMeans=nF2.map(function(v){
            var vals=data.filter(function(r){return typeof r[v]==='number'&&isFinite(r[v]);}).map(function(r){return r[v];});
            return vals.length?vals.reduce(function(s,x){return s+x;},0)/vals.length:NaN;
          });
          var gVars=nF2.map(function(v,vi){
            var vals=data.filter(function(r){return typeof r[v]==='number'&&isFinite(r[v]);}).map(function(r){return r[v];});
            if(vals.length<2) return NaN;
            var m=gMeans[vi];
            return vals.reduce(function(s,x){return s+(x-m)*(x-m);},0)/(vals.length-1);
          });

          // Group by missing pattern
          var patterns={};
          data.forEach(function(r){
            var key=nF2.map(function(v){return (r[v]===null||r[v]===undefined||r[v]==='')? '0':'1';}).join('');
            if(!patterns[key]) patterns[key]={key:key,rows:[],obs:nF2.map(function(v){return (r[v]!==null&&r[v]!==undefined&&r[v]!=='');}),n:0};
            patterns[key].rows.push(r);
            patterns[key].n++;
          });

          var patList=Object.values(patterns).filter(function(p){return p.n>0;});
          var nPat=patList.length;

          // Chi-squared: for each pattern group, for each observed variable, sum (group_mean - grand_mean)^2 / (grand_var/n_group)
          var chiSqTotal=0;
          var dfTotal=0;

          patList.forEach(function(pat){
            var nP=pat.n;
            nF2.forEach(function(v,vi){
              if(!pat.obs[vi]) return; // variable is missing in this pattern
              var gv=gVars[vi];
              if(!isFinite(gv)||gv===0) return;
              var gm=gMeans[vi];
              if(!isFinite(gm)) return;
              var patMean=pat.rows.reduce(function(s,r){return s+(typeof r[v]==='number'&&isFinite(r[v])?r[v]:0);},0)/nP;
              chiSqTotal+=nP*Math.pow(patMean-gm,2)/gv;
              dfTotal++;
            });
          });

          // Degrees of freedom: sum over patterns of (observed vars - 1), minus (p - 1)
          // Simplified: df = sum of observed variables per pattern - (number of patterns with obs - 1) * something
          // Standard df for Little's MCAR: df = sum_j(d_j) - d where d_j = # observed vars in pattern j, d = # vars
          var dfAdj=Math.max(1,dfTotal-(p2-1)*(nPat-1));
          var f4loc=f4L;

          // Chi-squared p-value
          function chi2pLocal(chi2,df){
            if(!isFinite(chi2)||chi2<0||df<1) return NaN;
            // Regularized incomplete gamma
            function lgamma(x){
              var c=[76.18009172947146,-86.50532032941677,24.01409824083091,-1.231739572450155,0.001208650973866179,-5.395239384953e-6];
              var y=x,tmp=x+5.5;
              tmp-=(x+0.5)*Math.log(tmp);
              var ser=1.000000000190015;
              for(var i=0;i<6;i++){y++;ser+=c[i]/y;}
              return -tmp+Math.log(2.5066282746310005*ser/x);
            }
            function gammaInc(s,x){
              if(x<0||s<=0) return NaN;
              if(x===0) return 0;
              if(x>(s+1)){
                var cf=0,n2c=50;
                for(var i2=n2c;i2>=1;i2--) cf=(i2*(s-i2))/(2*i2-s+x+1+cf);
                cf=x/(x-s+1+cf);
                return 1-(Math.exp(-x+s*Math.log(x)-lgamma(s))*cf);
              }
              var sum2=1/s,term=1/s,n3=200;
              for(var i3=1;i3<n3;i3++){term*=x/(s+i3);sum2+=term;if(Math.abs(term)<1e-10)break;}
              return Math.exp(-x+s*Math.log(x)-lgamma(s))*sum2;
            }
            return 1-gammaInc(df/2,chi2/2);
          }

          var pVal=chi2pLocal(chiSqTotal,dfAdj);
          var chiSqFmt=f4loc(chiSqTotal);
          var sig=isFinite(pVal)&&pVal<0.05;
          var interp=!isFinite(pVal)?'Cannot compute':(sig?'MCAR assumption rejected — data NOT missing completely at random (MAR or MNAR likely)':'Data appears MCAR — missing values are random with respect to observed variables');
          var interpColor=!isFinite(pVal)?'#94a3b8':(sig?'#f87171':'#34d399');

          html+='<div class="stats-grid" style="margin-bottom:12px">';
          html+='<div class="sb"><div class="sb-label">χ²</div><div class="sb-value">'+chiSqFmt+'</div></div>';
          html+='<div class="sb"><div class="sb-label">df</div><div class="sb-value">'+dfAdj+'</div></div>';
          html+='<div class="sb"><div class="sb-label">p-value</div><div class="sb-value" style="color:'+interpColor+'">'+( isFinite(pVal)?(pVal<.001?'<.001':f4loc(pVal)):'—')+'</div></div>';
          html+='<div class="sb"><div class="sb-label">Missing Patterns</div><div class="sb-value">'+nPat+'</div></div>';
          html+='</div>';
          html+='<div style="padding:11px 14px;border-radius:8px;background:rgba(0,0,0,.18);border:1.5px solid '+interpColor+';margin-bottom:10px">';
          html+='<div style="font-size:12px;font-weight:700;color:'+interpColor+'">'+( sig?'⚠ Not MCAR':'✓ MCAR')+'</div>';
          html+='<div style="font-size:11px;color:rgba(232,222,255,.65);margin-top:4px;line-height:1.6">'+interp+'</div>';
          html+='</div>';
          html+='<div style="font-size:10px;color:rgba(232,222,255,.3);line-height:1.6">Reference: Little (1988). A test of missing completely at random for multivariate data with missing values. <i>JASA</i>. If p &lt; .05, use MI (multiple imputation) or FIML rather than listwise deletion.</div>';

          // Pattern table
          html+='<div class="sec-hd" style="margin-top:14px;margin-bottom:8px">Missing Patterns ('+nPat+' unique patterns)</div>';
          html+='<div class="tbl-wrap"><table><thead><tr><th>Pattern</th><th>N</th><th>%</th>';
          nF2.forEach(function(v){ html+='<th style="font-size:10px;max-width:70px;word-break:break-all">'+escHtml(v)+'</th>'; });
          html+='</tr></thead><tbody>';
          patList.sort(function(a,b){return b.n-a.n;}).forEach(function(pat){
            var missCnt=pat.obs.filter(function(o){return !o;}).length;
            html+='<tr>';
            html+='<td class="td-label" style="font-family:Fira Code,monospace;font-size:10px;color:rgba(232,222,255,.5)">'+pat.key+'</td>';
            html+='<td class="td-num">'+pat.n+'</td>';
            html+='<td class="td-num">'+(pat.n/n2*100).toFixed(1)+'%</td>';
            pat.obs.forEach(function(o){
              html+='<td style="text-align:center"><span style="display:inline-block;width:16px;height:16px;border-radius:3px;background:'+(o?'rgba(52,211,153,.35)':'rgba(248,113,113,.35)')+';border:1px solid '+(o?'rgba(52,211,153,.5)':'rgba(248,113,113,.5)')+';font-size:9px;line-height:16px;color:'+(o?'#34d399':'#f87171')+'">'+(o?'●':'○')+'</span></td>';
            });
            html+='</tr>';
          });
          html+='</tbody></table></div>';
          html+='<div style="margin-top:6px;font-size:10px;color:rgba(232,222,255,.35)">● = observed &nbsp; ○ = missing &nbsp; Patterns sorted by frequency</div>';
        })();
      }
      html+='</div>';

      // ── Pattern Matrix Heatmap ──
      html+='<div class="card"><div class="sec-hd">Missing Pattern Matrix</div>';
      html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:10px">Visual heatmap of missing values across all cases and variables. Each row = one case, each column = one variable. Purple = observed, Red = missing.</div>';

      if(n2>0&&nF2.length>0){
        // Show up to 200 cases for performance
        var showN=Math.min(n2,200);
        var step2=n2>200?Math.ceil(n2/200):1;
        var sampleRows=[];
        for(var si=0;si<n2&&sampleRows.length<showN;si+=step2) sampleRows.push(data[si]);

        var cellSize=Math.max(3,Math.min(10,Math.floor(560/Math.max(nF2.length,1))));
        var svgH=Math.min(sampleRows.length*cellSize+40,600);
        var svgW=Math.min(nF2.length*cellSize+60,620);

        html+='<div style="overflow-x:auto"><svg viewBox="0 0 '+svgW+' '+svgH+'" style="width:100%;max-width:'+svgW+'px;display:block">';
        // Column labels
        nF2.forEach(function(v,vi){
          var x=60+vi*cellSize+cellSize/2;
          html+='<text x="'+x+'" y="12" font-size="'+(cellSize>=7?8:6)+'" fill="#c084fc" text-anchor="middle" transform="rotate(-60,'+x+',12)">'+v.slice(0,8)+'</text>';
        });
        // Row cells
        sampleRows.forEach(function(row,ri){
          var y=30+ri*cellSize;
          // Row label (case index)
          if(ri%Math.ceil(showN/20)===0||ri===0){
            html+='<text x="55" y="'+(y+cellSize/2+3)+'" font-size="7" fill="rgba(232,222,255,.3)" text-anchor="end">'+(ri*step2+1)+'</text>';
          }
          nF2.forEach(function(v,vi){
            var x=60+vi*cellSize;
            var miss=row[v]===null||row[v]===undefined||row[v]==='';
            html+='<rect x="'+x+'" y="'+y+'" width="'+( cellSize-1)+'" height="'+(cellSize-1)+'" rx="0.5" fill="'+(miss?'rgba(248,113,113,.7)':'rgba(124,58,237,.45)')+'"/>';
          });
        });
        // Legend
        var legY=svgH-10;
        html+='<rect x="60" y="'+legY+'" width="10" height="6" rx="1" fill="rgba(124,58,237,.45)"/>';
        html+='<text x="74" y="'+(legY+5)+'" font-size="8" fill="rgba(232,222,255,.5)">Observed</text>';
        html+='<rect x="140" y="'+legY+'" width="10" height="6" rx="1" fill="rgba(248,113,113,.7)"/>';
        html+='<text x="154" y="'+(legY+5)+'" font-size="8" fill="rgba(232,222,255,.5)">Missing</text>';
        html+='</svg></div>';
        if(n2>200) html+='<div style="font-size:10px;color:rgba(232,222,255,.3);margin-top:4px">Showing first 200 of '+n2+' cases for performance</div>';
      }
      html+='</div>';

      // ── Pairwise Co-occurrence ──
      if(nF2.length>=2&&totalMiss>0){
        html+='<div class="card"><div class="sec-hd">Pairwise Missing Co-occurrence</div>';
        html+='<div style="font-size:11px;color:rgba(232,222,255,.4);margin-bottom:10px">Number of cases where both variables are simultaneously missing. High values suggest correlated missingness.</div>';
        html+='<div class="tbl-wrap"><table><thead><tr><th></th>';
        nF2.forEach(function(v){html+='<th style="font-size:10px">'+escHtml(v)+'</th>';});
        html+='</tr></thead><tbody>';
        nF2.forEach(function(v1,i){
          html+='<tr><td class="td-label" style="color:#c084fc;font-weight:700">'+escHtml(v1)+'</td>';
          nF2.forEach(function(v2,j){
            var cnt=data.filter(function(r){
              var m1=r[v1]===null||r[v1]===undefined||r[v1]==='';
              var m2=r[v2]===null||r[v2]===undefined||r[v2]==='';
              return m1&&m2;
            }).length;
            if(i===j){
              html+='<td style="text-align:center;background:rgba(124,58,237,.1);color:#c084fc;font-weight:700">'+missPerVar[i].count+'</td>';
            } else {
              var intensity=cnt>0?Math.min(1,cnt/n2*10):0;
              html+='<td style="text-align:center;background:rgba(248,113,113,'+(cnt>0?0.08+intensity*0.3:0)+');color:'+(cnt>0?'#f87171':'rgba(232,222,255,.25)')+'">'+( cnt>0?cnt:'—')+'</td>';
            }
          });
          html+='</tr>';
        });
        html+='</tbody></table><div style="margin-top:6px;font-size:10px;color:rgba(232,222,255,.3)">Diagonal = total missing for each variable. Off-diagonal = cases missing for BOTH variables simultaneously.</div></div></div>';
      }

      // ── Recommendations ──
      html+='<div class="card"><div class="sec-hd">Recommendations</div>';
      html+='<div style="display:flex;flex-direction:column;gap:8px">';
      var recs=[];
      if(totalMiss===0) recs.push({col:'#34d399',icon:'✓',text:'No missing values detected. Your dataset is complete — proceed with any analysis.'});
      else{
        if(parseFloat(totalPct)<=5) recs.push({col:'#34d399',icon:'',text:'Missing rate ≤5%: Listwise deletion is acceptable. Consider mean/median imputation to preserve sample size.'});
        else if(parseFloat(totalPct)<=15) recs.push({col:'#fbbf24',icon:'⚠',text:'Missing rate 5–15%: Use multiple imputation (MI) or expectation-maximization (EM) methods. Avoid listwise deletion.'});
        else recs.push({col:'#f87171',icon:'✗',text:'Missing rate >15%: High missingness. Investigate causes. Multiple imputation strongly recommended.'});
        recs.push({col:'#a5f3fc',icon:'ℹ',text:'Use the Imputation tool (Analyze → Impute) to perform mean, median, or regression imputation on this dataset.'});
        recs.push({col:'rgba(192,132,252,.9)',icon:'',text:'If data is not MCAR, use Full Information Maximum Likelihood (FIML) or Multiple Imputation with Chained Equations (MICE/SPSS MI).'});
      }
      recs.forEach(function(r){
        html+='<div style="display:flex;align-items:flex-start;gap:9px;padding:9px 12px;border-radius:8px;background:rgba(0,0,0,.15);border-left:3px solid '+r.col+'">';
        html+='<span style="font-size:14px;color:'+r.col+';flex-shrink:0">'+r.icon+'</span>';
        html+='<span style="font-size:11.5px;color:rgba(232,222,255,.75);line-height:1.6">'+r.text+'</span>';
        html+='</div>';
      });
      html+='</div></div>';
    }
  return html;
}
