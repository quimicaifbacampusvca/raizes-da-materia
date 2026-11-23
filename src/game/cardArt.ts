/**
 * Arte-final ORIGINAL dos baralhos físicos, copiada do Drive do projeto.
 * B = investigação em Libras e três dicas; A = elemento revelado.
 * A relação B↔elemento vem de "revisao_das_50_cartas_B.csv" (não do número B).
 */
export const physicalCardFiles: Record<string, { a: string; b: string }> = {
  "H": {
    "a": "A001_H.png",
    "b": "B08.png"
  },
  "He": {
    "a": "A002_He.png",
    "b": "B33.png"
  },
  "Li": {
    "a": "A003_Li.png",
    "b": "B07.png"
  },
  "Be": {
    "a": "A004_Be.png",
    "b": "B17.png"
  },
  "B": {
    "a": "A005_B.png",
    "b": "B36.png"
  },
  "C": {
    "a": "A006_C.png",
    "b": "B44.png"
  },
  "N": {
    "a": "A007_N.png",
    "b": "B35.png"
  },
  "O": {
    "a": "A008_O.png",
    "b": "B50.png"
  },
  "F": {
    "a": "A009_F.png",
    "b": "B31.png"
  },
  "Ne": {
    "a": "A010_Ne.png",
    "b": "B22.png"
  },
  "Na": {
    "a": "A011_Na.png",
    "b": "B49.png"
  },
  "Mg": {
    "a": "A012_Mg.png",
    "b": "B29.png"
  },
  "Al": {
    "a": "A013_Al.png",
    "b": "B47.png"
  },
  "Si": {
    "a": "A014_Si.png",
    "b": "B20.png"
  },
  "P": {
    "a": "A015_P.png",
    "b": "B34.png"
  },
  "S": {
    "a": "A016_S.png",
    "b": "B40.png"
  },
  "Cl": {
    "a": "A017_Cl.png",
    "b": "B30.png"
  },
  "Ar": {
    "a": "A018_Ar.png",
    "b": "B41.png"
  },
  "K": {
    "a": "A019_K.png",
    "b": "B43.png"
  },
  "Ca": {
    "a": "A020_Ca.png",
    "b": "B04.png"
  },
  "Ga": {
    "a": "A031_Ga.png",
    "b": "B15.png"
  },
  "Ge": {
    "a": "A032_Ge.png",
    "b": "B05.png"
  },
  "As": {
    "a": "A033_As.png",
    "b": "B39.png"
  },
  "Se": {
    "a": "A034_Se.png",
    "b": "B27.png"
  },
  "Br": {
    "a": "A035_Br.png",
    "b": "B09.png"
  },
  "Kr": {
    "a": "A036_Kr.png",
    "b": "B32.png"
  },
  "Rb": {
    "a": "A037_Rb.png",
    "b": "B11.png"
  },
  "Sr": {
    "a": "A038_Sr.png",
    "b": "B14.png"
  },
  "In": {
    "a": "A049_In.png",
    "b": "B10.png"
  },
  "Sn": {
    "a": "A050_Sn.png",
    "b": "B01.png"
  },
  "Sb": {
    "a": "A051_Sb.png",
    "b": "B06.png"
  },
  "Te": {
    "a": "A052_Te.png",
    "b": "B46.png"
  },
  "I": {
    "a": "A053_I.png",
    "b": "B26.png"
  },
  "Xe": {
    "a": "A054_Xe.png",
    "b": "B12.png"
  },
  "Cs": {
    "a": "A055_Cs.png",
    "b": "B48.png"
  },
  "Ba": {
    "a": "A056_Ba.png",
    "b": "B23.png"
  },
  "Tl": {
    "a": "A081_Tl.png",
    "b": "B03.png"
  },
  "Pb": {
    "a": "A082_Pb.png",
    "b": "B19.png"
  },
  "Bi": {
    "a": "A083_Bi.png",
    "b": "B13.png"
  },
  "Po": {
    "a": "A084_Po.png",
    "b": "B25.png"
  },
  "At": {
    "a": "A085_At.png",
    "b": "B45.png"
  },
  "Rn": {
    "a": "A086_Rn.png",
    "b": "B16.png"
  },
  "Fr": {
    "a": "A087_Fr.png",
    "b": "B28.png"
  },
  "Ra": {
    "a": "A088_Ra.png",
    "b": "B24.png"
  },
  "Nh": {
    "a": "A113_Nh.png",
    "b": "B18.png"
  },
  "Fl": {
    "a": "A114_Fl.png",
    "b": "B38.png"
  },
  "Mc": {
    "a": "A115_Mc.png",
    "b": "B02.png"
  },
  "Lv": {
    "a": "A116_Lv.png",
    "b": "B37.png"
  },
  "Ts": {
    "a": "A117_Ts.png",
    "b": "B21.png"
  },
  "Og": {
    "a": "A118_Og.png",
    "b": "B42.png"
  }
}

export function getPhysicalCard(symbol: string | null | undefined) {
  if (!symbol || !physicalCardFiles[symbol]) return null
  const files=physicalCardFiles[symbol]
  const base=import.meta.env.BASE_URL
  return {a:base+'cards/A/'+files.a,b:base+'cards/B/'+files.b}
}
