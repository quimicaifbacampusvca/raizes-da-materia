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

// Coordenadas da própria árvore, no viewBox 900 × 1210.
// 0–11 = tronco; 12–23 = raízes; 24–35 = galhos médios;
// 36–47 = copa superior. Cada casa repousa sobre um veio de madeira.
// Galhos 24–35: espaçamento irregular e bifurcações reais, não fileiras diagonais.
const coordinates: ReadonlyArray<readonly [number, number]> = [
  [450,1078],[451,1022],[452,962],[447,900],[447,839],[453,784],
  [450,723],[453,663],[449,599],[450,536],[453,459],[451,369],
  [386,1040],[330,1038],[275,1073],[217,1073],[162,1090],[114,1105],
  [514,1041],[569,1038],[627,1069],[684,1073],[735,1090],[785,1105],
  [396,782],[344,748],[289,706],[247,658],[182,636],[210,565],
  [509,777],[563,744],[616,708],[663,667],[730,636],[706,565],
  [388,520],[337,497],[281,465],[228,420],[177,367],[128,301],
  [514,522],[568,496],[624,466],[674,423],[723,368],[770,300],
]

export const nodes: Node[] = coordinates.map(([x,y],id) => ({
  id, row: Math.floor(id/4), lane: id%4, x, y, type: types[(id*17)%48],
}))

// O grafo não é mais uma grade: são galhos e raízes realmente ramificados.
// Os atalhos são entrelaçamentos naturais entre raízes, tronco e copa.
const trunks: Array<readonly [number,number]> = Array.from({length:11},(_,i)=>[i,i+1])
const arms: Array<readonly [number,number]> = [12,18,24,30,36,42].flatMap(start =>
  Array.from({length:5},(_,i): readonly [number,number] => [start+i,start+i+1])
)
const junctions: Array<readonly [number,number]> = [
  [1,12],[1,18],[5,24],[5,30],[9,36],[9,42],
  [0,13],[0,19],[12,18],[24,30],[36,42],
  [15,17],[21,23],[27,29],[33,35],[39,41],[45,47],
  [11,38],[11,44],[29,39],[35,45],
]
// Os 62 caminhos e IDs continuam exatamente iguais aos do Supabase.
// As novas curvas são uma alteração visual compatível com partidas existentes.
export const edges: ReadonlyArray<readonly [number,number]> = [...trunks,...arms,...junctions]
const adjacency = Array.from({length:48},()=>new Set<number>())
for (const [a,b] of edges) { adjacency[a].add(b); adjacency[b].add(a) }

export function neighbors(id: number): number[] {
  return id >= 0 && id < 48 ? [...adjacency[id]] : []
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
