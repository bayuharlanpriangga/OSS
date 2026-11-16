// ════════════════════════════════════════════════════════════════════════
// js/export/export-excel.js — G8 (2026-10-04)
// Export hasil analisis + data mentah ke .xlsx (SheetJS, dimuat dinamis dari
// cdnjs saat tombol ditekan): exportToExcel, _doExportExcel.
// Dependency (dibaca runtime di dalam function body, tidak ada pemanggilan
// saat parse): outputs, data, vars, showToast, window.XLSX. Dibungkus loader
// popup oleh activity-loading-popup.js (dimuat SESUDAH app.js) lewat
// window.exportToExcel — jadi tetap harus fungsi global.
// ════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════
// EXPORT TO EXCEL (SheetJS)
// ════════════════════════════════════════════════════════════
function exportToExcel(){
  if(!outputs.length){showToast('No outputs yet. Run an analysis first.','error');return;}
  
  // Dynamically load SheetJS
  var s=document.createElement('script');
  s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  s.onload=function(){_doExportExcel();};
  s.onerror=function(){showToast('Could not load XLSX library','error');};
  if(window.XLSX){_doExportExcel();}
  else document.head.appendChild(s);
}

function _doExportExcel(){
  var wb=XLSX.utils.book_new();
  
  // Sheet 1: Raw Data
  if(data.length){
    var dataRows=[vars.map(function(v){return v.label||v.name;})];
    data.forEach(function(r){
      dataRows.push(vars.map(function(v){var val=r[v.name];return val===null||val===undefined?'':val;}));
    });
    var wsData=XLSX.utils.aoa_to_sheet(dataRows);
    // Style header row
    var range=XLSX.utils.decode_range(wsData['!ref']);
    for(var c=range.s.c;c<=range.e.c;c++){
      var addr=XLSX.utils.encode_cell({r:0,c:c});
      if(wsData[addr]){wsData[addr].s={font:{bold:true},fill:{fgColor:{rgb:'7C3AED'}}};}
    }
    wsData['!cols']=vars.map(function(){return {wch:14};});
    XLSX.utils.book_append_sheet(wb,wsData,'Data');
  }
  
  // Sheet 2: Analysis Results
  outputs.forEach(function(o,idx){
    var rows=[];
    rows.push(['OSS Analysis Output',new Date(o.id).toLocaleString()]);
    rows.push([o.title]);
    rows.push([]);
    
    if(o.type==='descriptive'&&o.stats){
      rows.push(['Statistic','Value']);
      Object.entries(o.stats).forEach(function(kv){rows.push([kv[0],kv[1]]);});
    }
    else if(o.type==='ttest'&&o.res){
      rows.push(['Statistic','Group A ('+o.ga+')','Group B ('+o.gb+')']);
      rows.push(['N',_xlsxCell(o.res.nA),_xlsxCell(o.res.nB)]);
      rows.push(['Mean',_xlsxCell(o.res.meanA),_xlsxCell(o.res.meanB)]);
      rows.push(['SD',_xlsxCell(o.res.sdA),_xlsxCell(o.res.sdB)]);
      rows.push([]);
      rows.push(['t',_xlsxCell(o.res.t)]);rows.push(['df',_xlsxCell(o.res.df)]);rows.push(['p',_xlsxCell(o.res.p_fmt)]);
      rows.push(["Cohen's d",_xlsxCell(o.res.cohensD),o.res.dInterp]);
      if(o.lev){
        rows.push([]);
        rows.push(["Levene's Test for Equality of Variances"]);
        rows.push(['F',_xlsxCell(o.lev.F)]);
        rows.push(['p',_xlsxCell(o.lev.p_fmt||o.lev.p)]);
        rows.push(['Variance Homogeneity',parseFloat(o.lev.p)<0.05?'Unequal variance (violated)':'Equal variance (assumed)']);
      }
    }
    else if(o.type==='correlation'&&o.res){
      rows.push(['r','p','Strength','Direction','95% CI']);
      rows.push([o.res.r,o.res.p_fmt,o.res.strength,o.res.direction,o.res.ci95]);
    }
    else if((o.type==='regression'||o.type==='multipleReg')&&o.res){
      rows.push(['Model Fit']);
      rows.push(['R²',o.res.R2]);rows.push(['Adj R²',o.res.R2adj]);
      rows.push(['F',o.res.F]);rows.push(['p',o.res.pF_fmt]);
      if(o.res.RMSE) rows.push(['RMSE',o.res.RMSE]);
      rows.push([]);
      if(o.res.coefs){
        rows.push(['Variable','B','SE','β','t','p','VIF']);
        o.res.coefs.forEach(function(c,ci){
          rows.push([c.name,c.B,c.SE,ci===0?'—':c.beta,c.t,c.p_fmt,ci===0?'—':(o.res.vif?o.res.vif[ci-1]:'—')]);
        });
      } else {
        // regresi sederhana (SE.linearReg) mengembalikan b0/b1, bukan coefs[]
        rows.push(['Variable','B','SE','t','p']);
        rows.push(['Constant',o.res.b0,o.res.SEb0,o.res.tb0,o.res.pb0_fmt]);
        rows.push([o.xF||'Slope (b₁)',o.res.b1,o.res.SEb1,o.res.tb1,o.res.pb1_fmt]);
      }
    }
    else if(o.type==='hierarchicalReg'&&o.res){
      rows.push(['Dependent Variable:',o.res.depVar]);
      rows.push([]);
      rows.push(['Block','Predictors','R²','Adj R²','ΔR²','F-change','df1','df2','p ΔR²']);
      (o.res.blocks||[]).forEach(function(b){
        rows.push([
          'Block '+b.block, b.predictors.join(', '),
          b.R2, b.R2adj, b.dR2, b.Fchange, b.dfNum, b.dfDen, b.pFchange
        ]);
      });
      rows.push([]);
      (o.res.blocks||[]).forEach(function(b){
        rows.push(['Block '+b.block+' Coefficients']);
        rows.push(['Variable','B','SE','β','t','p','VIF']);
        (b.coefs||[]).forEach(function(c,ci){
          rows.push([c.name,c.B,c.SE,ci===0?'—':c.beta,c.t,c.p_fmt,ci===0?'—':(b.vif?b.vif[ci-1]:'—')]);
        });
        rows.push([]);
      });
    }
    else if(o.type==='anova'&&o.res){
      rows.push(['Source','df','SS','MS','F','p','η²']);
      rows.push(['Between',_xlsxCell(o.res.dfB),_xlsxCell(o.res.ssB),_xlsxCell(o.res.msB),_xlsxCell(o.res.F),_xlsxCell(o.res.p_fmt),_xlsxCell(o.res.eta2)]);
      rows.push(['Within',_xlsxCell(o.res.dfW),_xlsxCell(o.res.ssW),_xlsxCell(o.res.msW),'','','']);
      if(o.res.groupStats&&o.res.groupStats.length){
        rows.push([]);
        rows.push(['Descriptive Statistics (Groups)']);
        rows.push(['Group','N','Mean','SD']);
        o.res.groupStats.forEach(function(g){
          rows.push([g.label,_xlsxCell(g.n),_xlsxCell(g.mean),_xlsxCell(g.sd)]);
        });
      }
      if(o.posthoc&&o.posthoc.length){
        var phName={'tukey':'Tukey HSD','bonferroni':'Bonferroni','lsd':'LSD (Fisher)','holm':'Holm-Bonferroni'}[o.posthocMethod]||'Post-Hoc';
        var phMethod=o.posthocMethod||(o.posthoc[0]&&o.posthoc[0].q!==undefined?'tukey':'bonferroni');
        rows.push([]);
        rows.push([phName+' Multiple Comparisons']);
        if(phMethod==='tukey'){
          rows.push(['Comparison','Mean Diff','q','p','Sig']);
          o.posthoc.forEach(function(ph){
            rows.push([ph.a+' vs '+ph.b,_xlsxCell(ph.diff),_xlsxCell(ph.q),_xlsxCell(ph.p_fmt||ph.p),ph.sig?'*':'ns']);
          });
        } else if(phMethod==='bonferroni'){
          rows.push(['Comparison','Mean Diff','SE','t','p (adj)','Sig']);
          o.posthoc.forEach(function(ph){
            rows.push([ph.a+' vs '+ph.b,_xlsxCell(ph.diff),_xlsxCell(ph.se),_xlsxCell(ph.t),_xlsxCell(ph.p_fmt||ph.p),ph.sig?'*':'ns']);
          });
        } else {
          rows.push(['Comparison','Mean Diff','SE','t','p','Sig']);
          o.posthoc.forEach(function(ph){
            rows.push([ph.a+' vs '+ph.b,_xlsxCell(ph.diff),_xlsxCell(ph.se),_xlsxCell(ph.t),_xlsxCell(ph.p_fmt||ph.p),ph.sig?'*':'ns']);
          });
        }
      }
    }
    else if(o.type==='logistic'&&o.res){
      rows.push(['-2LL',o.res.m2ll]);rows.push(["Cox & Snell R²",o.res.coxSnell]);
      rows.push(["Nagelkerke R²",o.res.nagelkerke]);rows.push(['Accuracy',o.res.accuracy+'%']);
      rows.push([]);
      rows.push(['Variable','B','SE','Wald','p','OR','95% CI OR']);
      (o.res.coefs||[]).forEach(function(c){rows.push([c.name,c.B,c.SE,c.wald,c.p_fmt,c.OR,c.ci_or]);});
    }
    // G8 (2026-10-04): Cronbach α — nama item ada di o.vars, bukan di o.res.itemStats
    else if(o.type==='alpha'&&o.res&&o.res.itemStats){
      rows.push(['Statistic','Value']);
      rows.push(['Cronbach α',_xlsxCell(o.res.alpha)]);rows.push(['k (item)',_xlsxCell(o.res.k)]);
      rows.push(['n',_xlsxCell(o.res.n)]);rows.push(['Interpretasi',_xlsxCell(o.res.interp)]);
      rows.push([]);
      rows.push(['Item','Item-total r','α jika dihapus','Keterangan']);
      o.res.itemStats.forEach(function(it,ii){
        rows.push([(o.vars&&o.vars[ii])||('Item '+(ii+1)),_xlsxCell(it.rit),_xlsxCell(it.alphaIfDeleted),_xlsxCell(it.flag)]);
      });
    }
    // G8 (2026-10-04): fallback generik — sebelumnya hanya 8 tipe output yang punya
    // cabang di atas, sisanya (27 dari 38 tipe yang diuji) menghasilkan lembar berisi
    // judul + tanggal saja. Pola sama dengan _wordGenericRes di export-word.js.
    else if(o.res&&typeof o.res==='object'){
      _xlsxGenericRows(o.res).forEach(function(r){rows.push(r);});
    }
    
    var sheetName=('Output'+(idx+1)+'_'+(o.type||'').slice(0,8)).slice(0,31);
    var ws=XLSX.utils.aoa_to_sheet(rows);
    ws['!cols']=[{wch:22},{wch:16},{wch:12},{wch:12},{wch:12},{wch:12},{wch:12},{wch:12},{wch:12}];
    XLSX.utils.book_append_sheet(wb,ws,sheetName);
  });
  
  XLSX.writeFile(wb,'OSS_Results_'+new Date().toISOString().slice(0,10)+'.xlsx');
  showToast('Excel berhasil diexport');
}

// ── Fallback generik untuk tipe output tanpa cabang khusus (G8, 2026-10-04) ──
// Membaca o.res apa adanya: nilai skalar → tabel Statistic/Value; array objek &
// matriks → tabel sendiri; objek bersarang (maks. 2 level) → label "induk › anak";
// array angka pendek → satu sel berisi daftar (maks. 20 nilai). Angka dibiarkan
// numerik (bukan string) supaya bisa dihitung di Excel; NaN/Infinity → '—'.
function _xlsxCell(v){
  if(v===null||v===undefined) return '—';
  if(typeof v==='number') return isFinite(v)?v:'—';
  if(typeof v==='boolean') return v?'Ya':'Tidak';
  // Mesin statistik mengembalikan banyak angka sebagai string hasil SE.f4 ('0.9204');
  // jadikan numerik supaya bisa dihitung di Excel. Teks seperti '< .001' tetap string.
  if(typeof v==='string'&&/^-?(0|[1-9]\d*)(\.\d+)?$/.test(v)) return Number(v);
  return String(v);
}
function _xlsxGenericRows(res){
  var MAXROWS=200, MAXCOLS=20, MAXLIST=20;
  var scalars=[], tables=[];
  function isPrim(v){return v===null||typeof v==='string'||typeof v==='number'||typeof v==='boolean';}
  function isObj(x){return x&&typeof x==='object'&&!Array.isArray(x);}
  function walk(obj,path,depth){
    Object.keys(obj).forEach(function(k){
      var v=obj[k], label=path?path+' › '+k:k;
      if(k.charAt(0)==='_'||typeof v==='function'||v===undefined) return;
      if(isPrim(v)){ scalars.push([label,_xlsxCell(v)]); return; }
      if(Array.isArray(v)){
        if(!v.length) return;
        if(v.every(isPrim)){
          scalars.push([label,v.length<=MAXLIST?v.map(function(x){return String(_xlsxCell(x));}).join(', '):'('+v.length+' nilai — tidak dimuat)']);
        } else if(v.every(isObj)){
          var cols=[];
          v.slice(0,MAXROWS).forEach(function(x){Object.keys(x).forEach(function(c){if(cols.length<MAXCOLS&&cols.indexOf(c)<0&&isPrim(x[c])&&c.charAt(0)!=='_')cols.push(c);});});
          if(cols.length) tables.push({label:label,headers:cols,total:v.length,rows:v.slice(0,MAXROWS).map(function(x){return cols.map(function(c){return _xlsxCell(x[c]);});})});
        } else if(v.every(function(x){return Array.isArray(x)&&x.every(isPrim);})){
          var w=Math.min(MAXCOLS,Math.max.apply(null,v.map(function(x){return x.length;})));
          var hd=['#']; for(var j=1;j<=w;j++) hd.push(String(j));
          tables.push({label:label,headers:hd,total:v.length,rows:v.slice(0,MAXROWS).map(function(x,i){return[i+1].concat(x.slice(0,w).map(_xlsxCell));})});
        }
        return;
      }
      if(isObj(v)&&depth<2) walk(v,label,depth+1);
    });
  }
  walk(res,'',0);
  var rows=[];
  if(scalars.length){ rows.push(['Statistic','Value']); scalars.forEach(function(r){rows.push(r);}); rows.push([]); }
  tables.forEach(function(t){
    rows.push([t.label]);
    rows.push(t.headers);
    t.rows.forEach(function(r){rows.push(r);});
    if(t.total>MAXROWS) rows.push(['Hanya '+MAXROWS+' dari '+t.total+' baris yang dimuat.']);
    rows.push([]);
  });
  return rows;
}
