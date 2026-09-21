// APA TABLE COPY — sigStar, pFmtAPA (helper format), buildAPATable
// (generator teks APA per-output), copyAPA, fallbackCopy (clipboard tombol
// "Copy APA" per kartu output)
function parsePValue(p){
  return parseFloat(p);
}

function sigStar(p){
  var pf=parsePValue(p);
  if(!isFinite(pf)) return '';
  if(pf<.001) return '***';
  if(pf<.01)  return '**';
  if(pf<.05)  return '*';
  return '';
}
// Format p-value untuk teks APA 
function pFmtAPA(p){
  var pf=parsePValue(p);
  if(!isFinite(pf)) return p;
  if(pf<.001) return '< .001';
  return '= '+p;
}

function buildAPATable(o){
  // Returns plain-text APA table string siap paste ke Word
  var lines=[];
  var sep=function(len){return '-'.repeat(len||60);};
  var col=function(val,w,align){
    val=String(val??'—');
    if(align==='right') return val.padStart(w);
    if(align==='center'){var pad=Math.max(0,w-val.length);return ' '.repeat(Math.floor(pad/2))+val+' '.repeat(Math.ceil(pad/2));}
    return val.padEnd(w);
  };

  // Helper: render plain-text table from headers + rows (array of arrays)
  function txtTable(headers,rows){
    var widths=headers.map(function(h,i){
      return Math.max(h.length,Math.max.apply(null,rows.map(function(r){return String(r[i]??'—').length;})));
    });
    var line='  '+headers.map(function(h,i){return col(h,widths[i]);}).join('  ');
    var rule='  '+widths.map(function(w){return '-'.repeat(w);}).join('  ');
    var out=[line,rule];
    rows.forEach(function(r){out.push('  '+r.map(function(c,i){return col(c,widths[i]);}).join('  '));});
    return out.join('\n');
  }

  var title=o.title;
  lines.push('');
  lines.push('Table. '+title);
  lines.push(sep(title.length+7));

  if(o.type==='ttest'){
    var r=o.res;
    lines.push('Independent Samples T-Test');
    lines.push('');
    lines.push(txtTable(
      ['','Group A ('+o.ga+')','Group B ('+o.gb+')'],
      [['N',r.nA,r.nB],['M',r.meanA,r.meanB],['SD',r.sdA,r.sdB]]
    ));
    lines.push('');
    lines.push(txtTable(
      ['Statistic','Value'],
      [
        ['t('+r.df+')',r.t+sigStar(r.p)],
        ['p',pFmtAPA(r.p)],
        ["Cohen's d",r.cohensD+' ('+r.dInterp+')'],
        ['95% CI',r.ci95],
      ]
    ));
    lines.push('');
    lines.push('  Note. '+sigStar(r.p)+' = significant. * p < .05. ** p < .01. *** p < .001.');
    if(o.lev) lines.push('  Levene\'s test for equality of variances: F = '+o.lev.F+', p '+pFmtAPA(o.lev.p_fmt)+'.');
  }

  else if(o.type==='paired'){
    var r=o.res;
    lines.push('Paired Samples T-Test');
    lines.push('');
    lines.push(txtTable(
      ['Variable','M','SD','N'],
      [[o.varA,'—','—',r.n],[o.varB,'—','—',r.n]]
    ));
    lines.push('');
    lines.push(txtTable(
      ['Statistic','Value'],
      [
        ['Mean Difference',r.meanDiff],
        ['SD Difference',r.sdDiff],
        ['t('+r.df+')',r.t+sigStar(r.p)],
        ['p',pFmtAPA(r.p)],
        ["Cohen's dz",r.cohensD+' ('+r.dInterp+')'],
        ['95% CI',r.ci95],
      ]
    ));
    lines.push('');
    lines.push('  Note. * p < .05. ** p < .01. *** p < .001.');
  }

  else if(o.type==='onesamp'){
    var r=o.res;
    lines.push('One-Sample T-Test');
    lines.push('');
    lines.push(txtTable(
      ['Parameter','Value'],
      [
        ['Variable',o.field],
        ['Test Value (μ₀)',String(o.mu0)],
        ['N',r.n],
        ['M (x̄)',r.mean],
        ['SD',r.sd],
        ['SE',r.se],
        ['Mean Difference',r.meanDiff],
        ['95% CI of Diff',r.ciDiff],
        ['t('+r.df+')',r.t+sigStar(r.p)],
        ['p',pFmtAPA(r.p)],
        ["Cohen's d",r.cohensD+' ('+r.dInterp+')'],
      ]
    ));
    lines.push('');
    lines.push('  Note. * p < .05. ** p < .01. *** p < .001.');
  }

  else if(o.type==='anova'){
    var r=o.res;
    lines.push('One-Way ANOVA');
    lines.push('');
    lines.push(txtTable(
      ['Source','df','SS','MS','F','p','η²'],
      [
        ['Between',r.dfB,r.ssB,r.msB,r.F+sigStar(r.p),pFmtAPA(r.p),r.eta2],
        ['Within',r.dfW,r.ssW,r.msW,'','',''],
        ['Total',r.dfB+r.dfW,'','','','',''],
      ]
    ));
    lines.push('');
    // Group means table
    if(r.groupStats&&r.groupStats.length){
      lines.push(txtTable(
        ['Group','N','M','SD'],
        r.groupStats.map(function(g){return[g.label,g.n,g.mean,g.sd];})
      ));
    }
    lines.push('');
    lines.push('  Note. η² = '+r.eta2+' ('+r.eta2Interp+'). * p < .05. ** p < .01. *** p < .001.');
    if(o.posthoc){
      lines.push('');
      var phLabel={'tukey':'Tukey HSD','bonferroni':'Bonferroni','lsd':'LSD Fisher','holm':'Holm-Bonferroni'}[o.posthocMethod]||'Post-hoc';
      lines.push('  '+phLabel+' Post-hoc Comparisons:');
      o.posthoc.forEach(function(ph){
        lines.push('    '+ph.a+' vs '+ph.b+': diff = '+ph.diff+', p '+pFmtAPA(ph.p_fmt||ph.p)+' '+sigStar(ph.p_fmt||ph.p));
      });
    }
  }

  else if(o.type==='correlation'){
    var r=o.res;
    var ctype=o.crType==='spearman'?'Spearman':'Pearson';
    lines.push(ctype+' Correlation');
    lines.push('');
    lines.push(txtTable(
      ['Variables','r','r²','p','95% CI'],
      [[o.crX+' × '+o.crY, r.r+sigStar(r.p), r.r2, pFmtAPA(r.p), r.ci95]]
    ));
    lines.push('');
    lines.push('  Note. '+r.strength+' '+r.direction+' relationship.');
    lines.push('  * p < .05. ** p < .01. *** p < .001.');
  }

  else if(o.type==='partialCorr'){
    var r=o.res;
    lines.push('Partial Correlation');
    lines.push('');
    lines.push(txtTable(
      ['','r','r²','p','95% CI'],
      [
        [o.pcX+' × '+o.pcY+' (zero-order)',r.rxy,'—','—','—'],
        [o.pcX+' × '+o.pcY+' (partial)',r.rp+sigStar(r.p),r.r2,pFmtAPA(r.p),r.ci95],
      ]
    ));
    lines.push('');
    lines.push('  Note. Controlling for '+o.pcZ+'. * p < .05. ** p < .01. *** p < .001.');
  }

  else if(o.type==='canonicalCorr'){
    var r=o.res;
    lines.push('Canonical Correlation Analysis');
    lines.push('  Set X: '+o.xNames.join(', '));
    lines.push('  Set Y: '+o.yNames.join(', '));
    lines.push('  n = '+r.n+'   Functions = '+r.nRoots);
    lines.push('');
    lines.push('Significance Tests (Wilks\' Lambda):');
    lines.push(txtTable(
      ['Fungsi','Rc','Rc²','Wilks λ','χ²','df','p','Sig'],
      r.tests.map(function(t){return[t.root,t.rc,t.rc2,t.wilks,t.chiSq,t.df,pFmtAPA(t.p_fmt),sigStar(t.p)];})
    ));
    lines.push('');
    lines.push('Structure Coefficients — Set X:');
    var xCols2=['Variable'].concat(r.tests.map(function(t){return'Fn'+t.root;}));
    lines.push(txtTable(xCols2, r.xLoadings.map(function(v){return[v.name].concat(v.loadings);})));
    lines.push('');
    lines.push('Structure Coefficients — Set Y:');
    var yCols2=['Variable'].concat(r.tests.map(function(t){return'Fn'+t.root;}));
    lines.push(txtTable(yCols2, r.yLoadings.map(function(v){return[v.name].concat(v.loadings);})));
    lines.push('');
    lines.push('  Note. Rc = canonical correlation. Structure coefficients ≥ |.30| considered meaningful.');
    lines.push('  * p < .05. ** p < .01. *** p < .001.');
  }

  else if(o.type==='regression'){
    var r=o.res;
    lines.push('Simple Linear Regression');
    lines.push('');
    lines.push(txtTable(
      ['','B','SE','t','p','Sig'],
      [
        ['Constant',r.b0,r.SEb0,r.tb0,pFmtAPA(r.pb0_fmt),sigStar(r.pb0_fmt)],
        [o.xF+' (b₁)',r.b1,r.SEb1,r.tb1,pFmtAPA(r.pb1_fmt),sigStar(r.pb1_fmt)],
      ]
    ));
    lines.push('');
    lines.push(txtTable(
      ['Model Fit','Value'],
      [['R²',r.R2],['Adj R²',r.R2adj],['F',r.F],['p',pFmtAPA(r.pF_fmt)],['RMSE',r.RMSE]]
    ));
    lines.push('');
    lines.push('  Equation: Ŷ = '+r.b0+' + '+r.b1+' · '+o.xF);
    lines.push('  * p < .05. ** p < .01. *** p < .001.');
  }

  else if(o.type==='multipleReg'){
    var r=o.res;
    lines.push('Multiple Linear Regression');
    lines.push('Dependent Variable: '+o.yName);
    lines.push('');
    var predRows=[['Constant',r.b0,r.SEb0||'—',r.t0||'—',pFmtAPA(r.p0_fmt||'1'),sigStar(r.p0_fmt||'1')]];
    if(r.predictors) r.predictors.forEach(function(pr){
      predRows.push([pr.name,pr.b,pr.se,pr.t,pFmtAPA(pr.p_fmt),sigStar(pr.p_fmt)]);
    });
    lines.push(txtTable(['Predictor','B','SE','t','p','Sig'],predRows));
    lines.push('');
    lines.push(txtTable(
      ['Model Fit','Value'],
      [['R²',r.R2],['Adj R²',r.R2adj],['F',r.F],['p',pFmtAPA(r.pF_fmt)]]
    ));
    lines.push('');
    lines.push('  * p < .05. ** p < .01. *** p < .001.');
  }

  else if(o.type==='descriptive'){
    var s=o.stats;
    lines.push('Descriptive Statistics: '+o.field);
    lines.push('');
    lines.push(txtTable(
      ['Statistic','Value'],
      [
        ['N',s.n],['Mean',s.mean],['Median',s.median],['SD',s.std],
        ['Variance',s.variance],['Min',s.min],['Max',s.max],
        ['Range',s.range],['Skewness',s.skewness],['Kurtosis',s.kurtosis],
        ['SE Mean',s.sem],['95% CI',s.ci95],
        ['Shapiro-Wilk W',s.shapiroW],['Shapiro-Wilk p',pFmtAPA(s.shapiroP)],
      ].filter(function(row){return row[1]!==undefined&&row[1]!==null;})
    ));
  }

  else if(o.type==='mannwhitney'){
    var r=o.res;
    lines.push('Mann-Whitney U Test');
    lines.push('');
    lines.push(txtTable(
      ['','Group A ('+o.ga+')','Group B ('+o.gb+')'],
      [['Median',r.medA,r.medB],['N',r.nA,r.nB]]
    ));
    lines.push('');
    lines.push(txtTable(
      ['Statistic','Value'],
      [['U',r.U],['z',r.z],['p',pFmtAPA(r.p_fmt)],['r (effect)',r.r_eff]]
    ));
    lines.push('');
    lines.push('  Note. * p < .05. ** p < .01. *** p < .001.');
  }

  else if(o.type==='kruskal'){
    var r=o.res;
    lines.push('Kruskal-Wallis H Test');
    lines.push('');
    lines.push(txtTable(
      ['Group','N','Median','M'],
      r.groupStats.map(function(g){return[g.label,g.n,g.median,g.mean];})
    ));
    lines.push('');
    lines.push(txtTable(
      ['Statistic','Value'],
      [['H',r.H],['df',r.df],['p',pFmtAPA(r.p_fmt)]]
    ));
    lines.push('');
    lines.push('  Note. * p < .05. ** p < .01. *** p < .001.');
  }

  else if(o.type==='alpha'){
    var r=o.res;
    lines.push('Reliability Analysis (Cronbach\'s Alpha)');
    lines.push('');
    lines.push(txtTable(
      ['Statistic','Value'],
      [['Cronbach\'s α',r.alpha],['Items (k)',r.k],['Cases (n)',r.n],['Interpretation',r.interp]]
    ));
    lines.push('');
    lines.push('  Items: '+o.vars.join(', '));
  }
  else if(o.type==='kappa'){
    var r=o.res;
    lines.push("Inter-Rater Reliability — Cohen's Kappa");
    lines.push('');
    lines.push(txtTable(
      ['Statistic','Value'],
      [["Cohen's κ",r.kappa],['SE',r.seK],['z',r.z],['p',r.pFmt],
       ['95% CI','['+r.ci95lo+', '+r.ci95hi+']'],
       ['Observed Agreement (Po)',r.po],['Expected Agreement (Pe)',r.pe],
       ['Cases (n)',r.n],['Categories (k)',r.k],['Interpretation',r.interp]]
    ));
    if(o.weighted&&r.wKappa!==null){
      lines.push('');
      lines.push('  Weighted κ = '+r.wKappa+' ('+r.interpW+')');
    }
    lines.push('');
    lines.push('  Rater 1: '+o.vars[0]+'   Rater 2: '+o.vars[1]);
  }

  else if(o.type==='glm'){
    var r=o.res;
    lines.push('General Linear Model (Univariate)');
    lines.push('Dependent Variable: '+o.depVar);
    lines.push('');
    if(r&&r.effects){
      lines.push(txtTable(
        ['Source','df','SS','MS','F','p','Partial η²'],
        r.effects.map(function(e){
          return[e.source+(e.isCov?' (cov)':''),e.df,e.SS||'—',e.MS||'—',
            (e.F||'—')+sigStar(e.p_fmt),pFmtAPA(e.p_fmt),e.partialEta2||'—'];
        }).concat([['Error',r.dfError,r.ssError,r.msError,'','','']])
      ));
      lines.push('');
      lines.push(txtTable(['Model Fit','Value'],[['R²',r.R2],['Adj R²',r.R2adj],['N',r.n]]));
    }
    lines.push('');
    lines.push('  Note. * p < .05. ** p < .01. *** p < .001.');
  }

  else if(o.type==='manova'){
    var r=o.res;
    lines.push('MANOVA — Multivariate Analysis of Variance');
    if(r){
      lines.push('Dependent Variables: '+r.depVars.join(', '));
      lines.push('Factor: '+r.factor+' ('+r.g+' groups) · N = '+r.n);
      lines.push('');
      lines.push('Multivariate Tests (Effect: '+r.factor+')');
      lines.push(txtTable(
        ['Test','Value','F','df1','df2','p'],
        [
          ['Pillai\'s Trace',    r.pillai.stat,    r.pillai.F,    r.pillai.df1,    r.pillai.df2,    r.pillai.p_fmt],
          ['Wilks\' Lambda',     r.wilks.stat,     r.wilks.F,     r.wilks.df1,     r.wilks.df2,     r.wilks.p_fmt],
          ['Hotelling-Lawley',   r.hotelling.stat, r.hotelling.F, r.hotelling.df1, r.hotelling.df2, r.hotelling.p_fmt],
          ['Roy\'s Greatest Root',r.roy.stat,      r.roy.F,       r.roy.df1,       r.roy.df2,       r.roy.p_fmt],
        ]
      ));
      lines.push('');
      lines.push('Partial η² (Pillai) = '+r.pillaiEta2+' · Box\'s M p = '+r.boxP);
      lines.push('');
      lines.push('Univariate Follow-up ANOVAs (Bonferroni α = '+SE.f4(0.05/r.p)+')');
      if(r.univariate){
        r.univariate.forEach(function(item){
          var ures=item.res;
          lines.push('  DV: '+item.dv);
          if(ures&&!ures._err&&ures.effects){
            lines.push(txtTable(
              ['Source','df','SS','MS','F','p','η²'],
              ures.effects.map(function(e){
                return[e.source,e.df,e.SS||'—',e.MS||'—',(e.F||'—')+sigStar(e.p_fmt),pFmtAPA(e.p_fmt),e.eta2||'—'];
              }).concat([['Error',ures.dfError,ures.ssError,ures.msError,'','','']])
            ));
          }
          lines.push('');
        });
      }
      lines.push('  Note. * p < .05. ** p < .01. *** p < .001.');
      lines.push('  Recommended primary test: Pillai\'s Trace (most robust).');
    }
  }

  else if(o.type==='efa'){
    var r=o.res;
    lines.push('Exploratory Factor Analysis');
    lines.push('Rotation: '+r.rotation+' · Factors: '+r.nFactors+' · N = '+r.n);
    lines.push('');
    // KMO + Bartlett
    lines.push(txtTable(
      ['Adequacy Check','Value'],
      [['KMO',r.kmo+' ('+r.kmoInterp+')'],['Bartlett χ²',r.chi2],['df',r.bartDf],['p',pFmtAPA(r.bartP)]]
    ));
    lines.push('');
    // Factor loadings
    var fHeaders=['Variable'].concat(
      Array.from({length:r.nFactors},function(_,i){return 'F'+(i+1);}),['h²']
    );
    var fRows=o.efaVars.map(function(v,i){
      return [v].concat(r.loadings[i]).concat([r.communalities[i]]);
    });
    lines.push(txtTable(fHeaders,fRows));
    lines.push('');
    // Eigenvalues
    lines.push(txtTable(
      ['Factor','Eigenvalue','% Var','Cum %'],
      r.eigenvalues.map(function(ev,i){
        var ve=r.varExp[i]!==undefined?r.varExp[i]+'%':'—';
        var cv=r.cumVar[i]!==undefined?r.cumVar[i]+'%':'—';
        return['F'+(i+1),ev,ve,cv];
      })
    ));
    lines.push('');
    lines.push('  Note. Loadings |≥ .40| considered significant. h² = communality.');
  }

  else if(o.type==='mediation'){
    var r=o.res;
    var bk=r.barronKenny;
    lines.push('Mediation Analysis');
    lines.push('X: '+r.xName+' · M: ['+r.mNames.join(', ')+'] · Y: '+r.yName+' · N = '+r.n);
    lines.push('');
    lines.push(txtTable(
      ['Step','Path','Coef (β)','p','Result'],
      [
        ['Step 1 (c)',r.xName+' → '+r.yName,bk.c,pFmtAPA(parseFloat(bk.p_c)),parseFloat(bk.p_c)<0.05?'Sig*':'n.s.'],
        ['Step 2 (a)',r.xName+' → '+r.mNames[0],bk.a,pFmtAPA(parseFloat(bk.p_a)),parseFloat(bk.p_a)<0.05?'Sig*':'n.s.'],
        ['Step 3 (b)',r.mNames[0]+' → '+r.yName,bk.b,pFmtAPA(parseFloat(bk.p_b)),parseFloat(bk.p_b)<0.05?'Sig*':'n.s.'],
        ["Step 4 (c')",r.xName+' → '+r.yName+' (direct)',bk.c_prime,pFmtAPA(parseFloat(bk.p_c_prime)),parseFloat(bk.p_c_prime)<0.05?'Sig*':'n.s.'],
      ]
    ));
    lines.push('');
    lines.push('  Mediation Type: '+r.medType);
    lines.push('');
    lines.push('  Indirect Effect(s) — Sobel Test + Bootstrap 95% CI:');
    r.mediators.forEach(function(med,i){
      var boot=r.bootResults&&r.bootResults[i];
      lines.push('    via '+med.name+': Indirect = '+SE.f4(med.indirect)+', Sobel z = '+SE.f4(med.sobel_z)+', p = '+parseFloat(med.sobel_p).toFixed(3)+(boot?', Bootstrap CI ['+boot.lo+', '+boot.hi+']':''));
    });
    lines.push('');
    lines.push('  Note. * p < .05. Bootstrap 95% CI based on '+r.bootResults?.length+' samples.');
    lines.push('  If Bootstrap CI does not include 0, indirect effect is significant.');
  }

  else if(o.type==='hierarchicalReg'&&o.res){
    var hrRes=o.res;
    lines.push('Hierarchical Multiple Regression');
    lines.push('Dependent Variable: '+hrRes.depVar);
    lines.push('');
    // Model Summary table
    lines.push(txtTable(
      ['Block','Predictors','R²','Adj R²','ΔR²','F-change','df1','df2','p (ΔR²)'],
      (hrRes.blocks||[]).map(function(b){
        return['Block '+b.block, b.predictors.join(', '), b.R2, b.R2adj, b.dR2, b.Fchange, b.dfNum, b.dfDen, b.pFchange+sigStar(b.pFchange)];
      })
    ));
    lines.push('');
    // Coefficient tables
    (hrRes.blocks||[]).forEach(function(b){
      lines.push('Block '+b.block+' Coefficients (Cumulative: '+b.cumulativePredictors.join(', ')+')');
      lines.push(txtTable(
        ['Variable','B','SE','β','t','p'],
        (b.coefs||[]).map(function(c){return[c.name,c.B,c.SE,c.beta||'—',c.t,pFmtAPA(c.p_fmt)+sigStar(c.p_fmt)];})
      ));
      lines.push('');
    });
    lines.push('  Note. * p < .05. ** p < .01. *** p < .001.');
    lines.push('  ΔR² = change in R² for each block; F-change tests significance of ΔR².');
  }

  else if(o.type==='discriminant'&&o.res){
    var r=o.res;
    lines.push('Linear Discriminant Analysis');
    lines.push('Grouping Variable: '+o.groupVar+' · Predictors: '+o.predVars.join(', ')+' · N = '+r.n);
    lines.push('');
    lines.push('  Wilks\' Λ = '+r.wilksLambda+'  p = '+r.wilksP+'  Overall Accuracy = '+r.accuracy+'%');
    lines.push('');
    lines.push(txtTable(
      ['Function','Eigenvalue','% Variance','Cumulative %','Canonical r'],
      r.eigenvalues.map(function(e,i){return['Function '+(i+1),e.eigenvalue,e.pctVar+'%',e.cumPct+'%',e.canonicalR];})
    ));
    lines.push('');
    lines.push('Standardized Coefficients');
    var scHeader=['Predictor'].concat(r.eigenvalues.map(function(_,i){return 'Function '+(i+1);}));
    lines.push(txtTable(scHeader, r.preds.map(function(p,pi){return [p].concat(r.stdCoefs.map(function(fc){return fc[pi];}));})));
    lines.push('');
    lines.push('Classification Results — Overall Accuracy: '+r.accuracy+'%');
    lines.push('');
    lines.push('  Note. Standardized coefficients used for interpretation. Accuracy = % correctly classified.');
  }

  else if(o.type==='cluster'&&o.res){
    var r=o.res;
    var method=r.method==='kmeans'?'K-Means':'Hierarchical ('+r.linkage+')';
    lines.push(method+' Cluster Analysis');
    lines.push('Variables: '+r.vars.join(', ')+' · k = '+r.k+' · N = '+r.n);
    lines.push('');
    lines.push('  Silhouette = '+r.silhouette+(r.silhouette>=0.5?' (Reasonable-Strong structure)':r.silhouette>=0.25?' (Weak structure)':' (Poor structure)'));
    if(r.method==='kmeans') lines.push('  Total WSS = '+r.totalWSS+' · Between-SS = '+r.totalBSS);
    lines.push('');
    lines.push('Cluster Sizes & Centroids (raw means)');
    var cHeader=['Cluster','N','%'].concat(r.vars);
    lines.push(txtTable(cHeader, r.clusters.map(function(c){return [c.label,c.n,c.pct+'%'].concat(c.rawMeans);})));
    lines.push('');
    lines.push('ANOVA per Variable');
    lines.push(txtTable(['Variable','F','df1','df2','p'],r.anova.map(function(a){return [a.variable,a.F,a.df1,a.df2,a.p_fmt+(parseFloat(a.p)<0.05?'*':'')];})));
    lines.push('');
    lines.push('  Note. * p < .05. Variables are z-standardized before clustering. Silhouette ≥ .50 = reasonable structure.');
  }

  else {
    // Fallback: generic key-value
    lines.push('(No APA table template for this analysis type.)');
    lines.push('Title: '+o.title);
  }

  lines.push('');
  lines.push(sep(60));
  lines.push('Generated by OSS — Orias Statistik System · '+new Date().toLocaleDateString());
  lines.push('');
  return lines.join('\n');
}

function copyAPA(id,btn){
  var o=outputs.find(function(x){return x.id===id;});
  if(!o){showToast('Output not found','error');return;}
  var text=buildAPATable(o);
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(function(){
      btn.textContent='Copied!';
      btn.classList.add('copied');
      setTimeout(function(){btn.textContent='Copy APA';btn.classList.remove('copied');},2200);
      showToast('APA berhasil disalin');
    }).catch(function(){fallbackCopy(text,btn);});
  } else {
    fallbackCopy(text,btn);
  }
}

function fallbackCopy(text,btn){
  // Fallback for browsers without clipboard API
  var ta=document.createElement('textarea');
  ta.value=text;
  ta.style.cssText='position:fixed;top:-9999px;left:-9999px;opacity:0';
  document.body.appendChild(ta);
  ta.focus();ta.select();
  try{
    document.execCommand('copy');
    if(btn){btn.textContent='Copied!';btn.classList.add('copied');setTimeout(function(){btn.textContent='Copy APA';btn.classList.remove('copied');},2200);}
    showToast('APA berhasil disalin');
  }catch(e){
    showToast('Copy gagal — coba manual select teks','error');
  }
  document.body.removeChild(ta);
}
