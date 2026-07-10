// Engines per model. id = `${modelId}${seq}`. 2-4 per model.
export const ENGINES = (() => {
  const out = {};
  const variants = [
    '1.0 TSI 95cv', '1.0 TSI 110cv', '1.2 TSI 85cv', '1.4 TSI 125cv', '1.4 TSI 150cv',
    '1.5 TSI 130cv', '1.5 dCi 90cv', '1.5 dCi 110cv', '1.6 TDI 110cv', '1.6 TDI 120cv',
    '2.0 TDI 110cv', '2.0 TDI 150cv', '2.0 TDI 190cv', '2.0 TFSI 190cv', '2.0 TFSI 245cv',
    '1.5 BlueHDi 130cv', '1.5 EcoBlue 120cv', '1.6 CRDi 136cv', '1.8 T 180cv', 'Hybrid 116cv',
  ];
  for (const makeId in (typeof window !== 'undefined' ? window : {})) {} // no-op
  // Build by iterating all known models in MODELS file (we hardcode the IDs we know exist)
  const allModelIds = [];
  for (let m = 1; m <= 30; m++) {
    for (let s = 1; s <= 5; s++) {
      const id = m * 100 + s;
      // only include if we know it exists; cheap proxy: include everything <= 305
      if (id <= 3005) allModelIds.push(id);
    }
  }
  for (const id of allModelIds) {
    const n = 2 + (id % 3); // 2..4
    const list = [];
    for (let i = 0; i < n; i++) {
      list.push({ id: id * 10 + i, name: variants[(id + i * 7) % variants.length] });
    }
    out[id] = list;
  }
  return out;
})();
