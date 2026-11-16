// o.type==='canonicalCorr'
function renderOutBasic_canonicalCorr(o){
  var html='';
      var r=o.res;
      html+='<div class="notice-box" style="margin-bottom:10px">'
        +'<b style="color:var(--ink)">Set X:</b> '+o.xNames.map(function(n){return escHtml(n);}).join(', ')
        +' &nbsp;|&nbsp; <b style="color:var(--ink)">Set Y:</b> '+o.yNames.map(function(n){return escHtml(n);}).join(', ')
        +' &nbsp;|&nbsp; <b style="color:var(--ink)">n='+r.n+' ('+r.nRoots+' functions)</b></div>';
      // Canonical roots summary cards
      html+='<div class="stats-grid" style="margin-bottom:12px">';
      r.tests.forEach(function(t){
        html+=stCard('Rc'+t.root+' = '+t.rc, 'Rc²='+t.rc2, (t.sig?'✓ p='+t.p_fmt:'ns (p='+t.p_fmt+')'));
      });
      html+='</div>';
      // Significance test table (Wilks' Lambda)
      html+='<div style="font-size:11px;font-weight:700;color:var(--ink-muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:.6px">Uji Signifikansi — Wilks\' Lambda</div>';
      html+=mkTable(
        ['Fungsi','Rc','Rc²','Wilks\' λ','χ²','df','p','Sig'],
        r.tests.map(function(t){return[
          t.root, t.rc, t.rc2, t.wilks, t.chiSq, t.df, t.p_fmt, t.sig?'*':'ns'
        ];})
      );
      // Structure coefficients X
      html+='<div style="font-size:11px;font-weight:700;color:var(--ink);margin:12px 0 6px;text-transform:uppercase;letter-spacing:.6px">Struktur Koefisien — Set X</div>';
      var xCols=['Variabel'].concat(r.tests.map(function(t){return'Fungsi '+t.root;}));
      html+=mkTable(xCols, r.xLoadings.map(function(v){return[escHtml(v.name)].concat(v.loadings);}));
      // Structure coefficients Y
      html+='<div style="font-size:11px;font-weight:700;color:var(--ink);margin:12px 0 6px;text-transform:uppercase;letter-spacing:.6px">Struktur Koefisien — Set Y</div>';
      var yCols=['Variabel'].concat(r.tests.map(function(t){return'Fungsi '+t.root;}));
      html+=mkTable(yCols, r.yLoadings.map(function(v){return[escHtml(v.name)].concat(v.loadings);}));
      html+='<div class="assump" style="margin-top:10px">'
        +'<b style="color:var(--ink)">Interpretasi:</b> Hanya fungsi dengan p &lt; .05 yang diinterpretasi. '
        +'Struktur koefisien ≥ |.30| dianggap meaningful loading. '
        +'Rc² menunjukkan proporsi varians yang dipakai bersama antara dua set variate kanonik.</div>';
  return html;
}
