// Fitur: Uji Homogenitas Varians Levene / Brown-Forsythe (kategori Analyze: ANOVA)
//   levene
// Depends on: engine-core-distributions.js, engine-anova-oneway.js (onewayANOVA)

function levene(groups) {
  const Z = groups.map(g => { const med = quantile([...g].sort((a, b) => a - b), .5); return g.map(v => Math.abs(v - med)); });
  try { return onewayANOVA(Z.map((z, i) => ({ label: String(i), vals: z }))); } catch { return null; }
}
