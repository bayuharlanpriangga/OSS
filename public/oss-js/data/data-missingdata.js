// ── Missing Data (Monitoring, Little's MCAR & Pattern Matrix) ──
function renderMissingDataAnalysis(){
  var html='';
  var allVars=vars.map(function(v){return v.name;});
  var nF2=vars.filter(function(v){return v.type==='Numeric';}).map(function(v){return v.name;});
  var n2=data.length;
  var noRowsWithVars=(n2===0 && allVars.length>0);

  function _isMissingCell(val){
    return typeof isMiss==='function'
      ? isMiss(val)
      : (val===null||val===undefined||val===''||(typeof val==='number'&&!isFinite(val)));
  }

  html+='<div class="sec-hd" style="margin-bottom:14px">Missing Data'+ossGuideBtn('missinganalysis')+'</div>';

  if(!allVars.length){
    html+='<div class="grid2">';
    html+='<div class="card"><div class="sec-hd">Overall Summary</div><div class="chart-empty" style="padding:38px 0">Belum ada data atau variabel yang dimuat. Tambahkan variabel di Variable View atau impor file CSV.</div></div>';
    html+='<div class="card"><div class="sec-hd">Preview</div><div class="chart-empty" style="padding:38px 0">Muat dataset untuk melihat preview Little\'s MCAR Test &amp; Missingness Matrix.</div></div>';
    html+='</div>';
    return html;
  }

  // ── Overall missing summary (all variables, matching sidebar #miss-nav-badge) ──
  var totalCells=n2*allVars.length;
  var missPerVar=allVars.map(function(v){
    if(noRowsWithVars){
      return {name:v,count:1,pct:'100.0',valid:0};
    }
    var cnt=data.filter(function(r){return _isMissingCell(r[v]);}).length;
    return {name:v,count:cnt,pct:(cnt/n2*100).toFixed(1),valid:n2-cnt};
  });
  var totalMiss=noRowsWithVars?allVars.length:missPerVar.reduce(function(s,v){return s+v.count;},0);
  var totalPct=noRowsWithVars?'100.0':(totalCells>0?(totalMiss/totalCells*100).toFixed(1):'0.0');

  html+='<div class="grid2">';
  // Left Column: Overall Summary & Missing by Variable
  html+='<div>';
  html+='<div class="card"><div class="sec-hd">Overall Summary</div>';
  html+='<div class="stats-grid" style="margin-bottom:14px">';
  html+='<div class="sb"><div class="sb-label">Total Cases</div><div class="sb-value">'+n2+'</div></div>';
  html+='<div class="sb"><div class="sb-label">Variables</div><div class="sb-value">'+allVars.length+'</div></div>';
  html+='<div class="sb"><div class="sb-label">Total Missing</div><div class="sb-value" style="color:'+(totalMiss>0?'var(--err)':'var(--ok)')+'">'+totalMiss+'</div></div>';
  html+='<div class="sb"><div class="sb-label">Missing %</div><div class="sb-value" style="color:'+(parseFloat(totalPct)>5?'var(--err)':parseFloat(totalPct)>0?'var(--warn)':'var(--ok)')+'">'+totalPct+'%</div></div>';
  html+='</div>';

  html+='<div class="sec-hd-sub" style="margin-bottom:8px">Missing by Variable</div>';
  html+='<div class="tbl-wrap"><table><thead><tr><th>Variable</th><th style="text-align:right">Missing N</th><th style="text-align:right">Missing %</th><th style="text-align:right">Valid N</th><th>Distribution</th></tr></thead><tbody>';
  missPerVar.forEach(function(mv){
    var pctNum=parseFloat(mv.pct);
    var barCol=pctNum>20?'var(--err)':pctNum>5?'var(--warn)':'var(--ok)';
    var barW=Math.max(0,Math.min(100,pctNum));
    html+='<tr>';
    html+='<td class="td-label">'+escHtml(mv.name)+'</td>';
    html+='<td class="td-num" style="color:'+(mv.count>0?'var(--err)':'var(--ok)')+';font-weight:600">'+mv.count+'</td>';
    html+='<td class="td-num">'+mv.pct+'%</td>';
    html+='<td class="td-num" style="color:'+(mv.valid>0?'var(--ok)':'var(--ink-muted)')+'">'+mv.valid+'</td>';
    html+='<td style="min-width:110px"><div style="background:var(--surface-alt);border-radius:var(--r-sm);height:8px;overflow:hidden"><div style="background:'+barCol+';width:'+barW+'%;height:100%"></div></div></td>';
    html+='</tr>';
  });
  html+='</tbody></table></div></div>';
  html+='</div>';

  // Right Column: Preview
  html+='<div>';
  html+='<div class="card"><div class="sec-hd">Preview</div>';

  if(noRowsWithVars){
    html+='<div class="sec-hd-sub" style="margin-top:0">Little\'s MCAR Test &amp; Pattern Matrix</div>';
    html+='<div style="padding:12px 14px;background:var(--warn-bg);border:1px solid var(--warn);border-radius:var(--r-sm);color:var(--warn);font-weight:600">Dataset memiliki '+allVars.length+' variabel yang belum terisi data kasus (0 baris). Tambahkan baris data di Data View atau impor CSV untuk melihat uji MCAR &amp; Pattern Matrix.</div>';
  } else if(!nF2.length){
    html+='<div class="sec-hd-sub" style="margin-top:0">Little\'s MCAR Test &amp; Pattern Matrix</div>';
    html+='<div style="padding:12px 14px;background:var(--surface-alt);border:1px solid var(--line-soft);border-radius:var(--r-sm);color:var(--ink-muted);font-weight:500">Tidak ada variabel numerik untuk uji Little\'s MCAR &amp; Pattern Matrix.</div>';
  } else {
    var numMissPerVar=nF2.map(function(v){
      var cnt=data.filter(function(r){return _isMissingCell(r[v]);}).length;
      return {name:v,count:cnt};
    });
    var numTotalMiss=numMissPerVar.reduce(function(s,v){return s+v.count;},0);

    html+='<div class="sec-hd-sub" style="margin-top:0">Little\'s MCAR Test</div>';
    if(numTotalMiss===0){
      html+='<div style="padding:12px 14px;background:var(--ok-bg);border:1px solid var(--ok);border-radius:var(--r-sm);color:var(--ok);font-weight:600;margin-bottom:14px">'+(totalMiss===0?'Tidak ada data missing. Uji MCAR tidak diperlukan.':'Tidak ada data missing pada variabel numerik. Uji MCAR tidak diperlukan.')+'</div>';
    } else {
      (function(){
        var f4L=function(v){return isFinite(v)?+(+v).toFixed(4):NaN;};
        var p2=nF2.length;

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

        var patterns={};
        data.forEach(function(r){
          var key=nF2.map(function(v){return _isMissingCell(r[v])?'0':'1';}).join('');
          if(!patterns[key]) patterns[key]={key:key,rows:[],obs:nF2.map(function(v){return !_isMissingCell(r[v]);}),n:0};
          patterns[key].rows.push(r);
          patterns[key].n++;
        });

        var patList=Object.values(patterns).filter(function(p){return p.n>0;});
        var nPat=patList.length;

        var chiSqTotal=0;
        var dfTotal=0;

        patList.forEach(function(pat){
          var nP=pat.n;
          nF2.forEach(function(v,vi){
            if(!pat.obs[vi]) return;
            var gv=gVars[vi];
            if(!isFinite(gv)||gv===0) return;
            var gm=gMeans[vi];
            if(!isFinite(gm)) return;
            var patMean=pat.rows.reduce(function(s,r){return s+(typeof r[v]==='number'&&isFinite(r[v])?r[v]:0);},0)/nP;
            chiSqTotal+=nP*Math.pow(patMean-gm,2)/gv;
            dfTotal++;
          });
        });

        var dfAdj=Math.max(1,dfTotal-(p2-1)*(nPat-1));
        var f4loc=f4L;

        function chi2pLocal(chi2,df){
          if(!isFinite(chi2)||chi2<0||df<1) return NaN;
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
        var interp=!isFinite(pVal)?'Cannot compute':(sig?'Not MCAR (kemungkinan MAR/MNAR)':'MCAR');
        var interpColor=!isFinite(pVal)?'var(--ink-muted)':(sig?'var(--err)':'var(--ok)');

        html+='<div class="stats-grid" style="margin-bottom:12px">';
        html+='<div class="sb"><div class="sb-label">χ²</div><div class="sb-value">'+chiSqFmt+'</div></div>';
        html+='<div class="sb"><div class="sb-label">df</div><div class="sb-value">'+dfAdj+'</div></div>';
        html+='<div class="sb"><div class="sb-label">p-value</div><div class="sb-value" style="color:'+interpColor+'">'+(isFinite(pVal)?(pVal<.001?'<.001':f4loc(pVal)):'—')+'</div></div>';
        html+='<div class="sb"><div class="sb-label">Status</div><div class="sb-value" style="font-size:14px;color:'+interpColor+'">'+interp+'</div></div>';
        html+='</div>';

        // Pattern table
        html+='<div class="sec-hd-sub" style="margin-top:12px;margin-bottom:8px">Missing Patterns ('+nPat+' pola)</div>';
        html+='<div class="tbl-wrap" style="margin-bottom:14px"><table><thead><tr><th>Pattern</th><th style="text-align:right">N</th><th style="text-align:right">%</th>';
        nF2.forEach(function(v){html+='<th style="font-size:11px;max-width:80px;word-break:break-all;text-align:center">'+escHtml(v)+'</th>';});
        html+='</tr></thead><tbody>';
        patList.sort(function(a,b){return b.n-a.n;}).forEach(function(pat){
          html+='<tr>';
          html+='<td class="td-label" style="font-family:var(--font-mono-stack);font-size:11px;color:var(--ink-muted)">'+pat.key+'</td>';
          html+='<td class="td-num">'+pat.n+'</td>';
          html+='<td class="td-num">'+(pat.n/n2*100).toFixed(1)+'%</td>';
          pat.obs.forEach(function(o){
            html+='<td style="text-align:center"><span style="display:inline-block;width:16px;height:16px;border-radius:var(--r-sm);background:'+(o?'var(--ok-bg)':'var(--err-bg)')+';border:1px solid '+(o?'var(--ok)':'var(--err)')+';font-size:10px;line-height:14px;font-weight:700;color:'+(o?'var(--ok)':'var(--err)')+'">'+(o?'✓':'×')+'</span></td>';
          });
          html+='</tr>';
        });
        html+='</tbody></table></div>';
      })();
    }

    // ── Pattern Matrix Heatmap ──
    html+='<div class="sec-hd-sub">Missing Pattern Matrix</div>';
    if(n2>0&&nF2.length>0){
      var T=typeof ossChartTheme==='function'?ossChartTheme():{ice:'#4F7A99',err:'#A93226',muted:'#4A5663',ink:'#0D0D0D'};
      var showN=Math.min(n2,200);
      var step2=n2>200?Math.ceil(n2/200):1;
      var sampleRows=[];
      for(var si=0;si<n2&&sampleRows.length<showN;si+=step2) sampleRows.push(data[si]);

      var cellSize=Math.max(4,Math.min(11,Math.floor(560/Math.max(nF2.length,1))));
      var rowH=Math.max(2,Math.min(cellSize,Math.floor(500/Math.max(sampleRows.length,1))));
      var topPad=38;
      var svgH=topPad+sampleRows.length*rowH+24;
      var svgW=Math.max(220,Math.min(nF2.length*cellSize+92,640));

      html+='<div style="overflow-x:auto;margin-bottom:14px"><svg viewBox="0 0 '+svgW+' '+svgH+'" style="width:100%;max-width:'+svgW+'px;display:block">';
      nF2.forEach(function(v,vi){
        var x=60+vi*cellSize+cellSize/2;
        html+='<text x="'+x+'" y="32" font-size="'+(cellSize>=7?8.5:7)+'" fill="'+T.ink+'" font-weight="600" text-anchor="start" transform="rotate(-45,'+x+',32)">'+escHtml(v.slice(0,8))+'</text>';
      });
      sampleRows.forEach(function(row,ri){
        var y=topPad+ri*rowH;
        if(ri%Math.ceil(showN/20)===0||ri===0){
          html+='<text x="54" y="'+(y+rowH/2+3)+'" font-size="8" fill="'+T.muted+'" text-anchor="end">'+(ri*step2+1)+'</text>';
        }
        nF2.forEach(function(v,vi){
          var x=60+vi*cellSize;
          var miss=_isMissingCell(row[v]);
          html+='<rect x="'+x+'" y="'+y+'" width="'+(cellSize-1)+'" height="'+Math.max(1.5,rowH-1)+'" rx="0.5" fill="'+(miss?T.err:T.ice)+'" fill-opacity="'+(miss?'0.85':'0.55')+'"/>';
        });
      });
      var legY=svgH-14;
      html+='<rect x="60" y="'+legY+'" width="10" height="6" rx="1" fill="'+T.ice+'" fill-opacity="0.55"/>';
      html+='<text x="74" y="'+(legY+5.5)+'" font-size="8.5" fill="'+T.muted+'">Observed</text>';
      html+='<rect x="140" y="'+legY+'" width="10" height="6" rx="1" fill="'+T.err+'" fill-opacity="0.85"/>';
      html+='<text x="154" y="'+(legY+5.5)+'" font-size="8.5" fill="'+T.muted+'">Missing</text>';
      html+='</svg></div>';
    }

    // ── Pairwise Co-occurrence ──
    if(nF2.length>=2&&numTotalMiss>0){
      html+='<div class="sec-hd-sub">Pairwise Missing Co-occurrence</div>';
      html+='<div class="tbl-wrap"><table><thead><tr><th></th>';
      nF2.forEach(function(v){html+='<th style="font-size:11px;text-align:right">'+escHtml(v)+'</th>';});
      html+='</tr></thead><tbody>';
      nF2.forEach(function(v1,i){
        html+='<tr><td class="td-label">'+escHtml(v1)+'</td>';
        nF2.forEach(function(v2,j){
          var cnt=data.filter(function(r){
            return _isMissingCell(r[v1])&&_isMissingCell(r[v2]);
          }).length;
          if(i===j){
            html+='<td class="td-num" style="background:var(--surface-alt);color:var(--ink);font-weight:700">'+numMissPerVar[i].count+'</td>';
          } else {
            html+='<td class="td-num" style="background:'+(cnt>0?'var(--err-bg)':'transparent')+';color:'+(cnt>0?'var(--err)':'var(--ink-subtle)')+'">'+(cnt>0?cnt:'—')+'</td>';
          }
        });
        html+='</tr>';
      });
      html+='</tbody></table></div>';
    }
  }

  html+='</div>'; // end right Preview card
  html+='</div>'; // end right column
  html+='</div>'; // end grid2
  return html;
}
