export type HouseType = 'identificacao' | 'cotidiano' | 'desafio' | 'acontecimento'
export type Node = { id: number; row: number; lane: number; x: number; y: number; type: HouseType }
export type Element = { symbol: string; name: string; atomic: number; group: number; period: number }

// Os 50 elementos representativos dos grupos 1, 2 e 13–18.
const elementsByPeriod: Array<Array<[string, string, number, number]>> = [
  [['H','Hidrogênio',1,1],['He','Hélio',2,18]],
  [['Li','Lítio',3,1],['Be','Berílio',4,2],['B','Boro',5,13],['C','Carbono',6,14],['N','Nitrogênio',7,15],['O','Oxigênio',8,16],['F','Flúor',9,17],['Ne','Neônio',10,18]],
  [['Na','Sódio',11,1],['Mg','Magnésio',12,2],['Al','Alumínio',13,13],['Si','Silício',14,14],['P','Fósforo',15,15],['S','Enxofre',16,16],['Cl','Cloro',17,17],['Ar','Argônio',18,18]],
  [['K','Potássio',19,1],['Ca','Cálcio',20,2],['Ga','Gálio',31,13],['Ge','Germânio',32,14],['As','Arsênio',33,15],['Se','Selênio',34,16],['Br','Bromo',35,17],['Kr','Criptônio',36,18]],
  [['Rb','Rubídio',37,1],['Sr','Estrôncio',38,2],['In','Índio',49,13],['Sn','Estanho',50,14],['Sb','Antimônio',51,15],['Te','Telúrio',52,16],['I','Iodo',53,17],['Xe','Xenônio',54,18]],
  [['Cs','Césio',55,1],['Ba','Bário',56,2],['Tl','Tálio',81,13],['Pb','Chumbo',82,14],['Bi','Bismuto',83,15],['Po','Polônio',84,16],['At','Astato',85,17],['Rn','Radônio',86,18]],
  [['Fr','Frâncio',87,1],['Ra','Rádio',88,2],['Nh','Nihônio',113,13],['Fl','Fleróvio',114,14],['Mc','Moscóvio',115,15],['Lv','Livermório',116,16],['Ts','Tenessino',117,17],['Og','Oganessônio',118,18]],
]
export const playableElements: Element[] = elementsByPeriod.flatMap((row, p) =>
  row.map(([symbol, name, atomic, group]) => ({ symbol, name, atomic, group, period: p + 1 }))
)

const types: HouseType[] = [
  ...Array<HouseType>(20).fill('identificacao'),
  ...Array<HouseType>(12).fill('cotidiano'),
  ...Array<HouseType>(10).fill('desafio'),
  ...Array<HouseType>(6).fill('acontecimento'),
]
export const nodes: Node[] = Array.from({ length: 48 }, (_, id) => {
  const row = Math.floor(id / 4)
  const lane = id % 4
  return {
    id, row, lane,
    x: [56, 144, 246, 336][lane] + Math.sin(row * 0.9 + lane) * 8,
    y: 553 - row * 43,
    type: types[(id * 17) % 48],
  }
})
export function neighbors(id: number): number[] {
  const row = Math.floor(id / 4), lane = id % 4, next: number[] = []
  if (row > 0) next.push(id - 4)
  if (row < 11) next.push(id + 4)
  if (row % 2 === 0 && lane > 0) next.push(id - 1)
  if (row % 2 === 0 && lane < 3) next.push(id + 1)
  return next
}
export const houseLabel: Record<HouseType, string> = {
  identificacao: 'Identificação em Libras',
  cotidiano: 'Investigação do cotidiano',
  desafio: 'Desafio químico',
  acontecimento: 'Acontecimento ±',
}
export const houseColor: Record<HouseType, string> = {
  identificacao: '#8366c5',
  cotidiano: '#48aabc',
  desafio: '#dbad61',
  acontecimento: '#ad8f82',
}
export const playerColors = ['#4a9ee4','#54c293','#f18b73','#b58ae9']
export const playerMarks = ['●','▲','■','◆']
