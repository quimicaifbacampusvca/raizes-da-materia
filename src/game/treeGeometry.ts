import { nodes } from './board'

/**
 * As rotas não formam uma grade: curvas orgânicas são geradas entre casas
 * conectadas, sobre os mesmos veios de madeira usados na partida multiplayer.
 */
export const isMidBranchRoute=(a:number,b:number):boolean =>
  a>=24&&a<=35&&b>=24&&b<=35&&Math.floor(a/6)===Math.floor(b/6)

type Point={x:number;y:number}
export type TreeRoute={
  path:string
  midway:Point
  width:number
  middle:boolean
}

const cubic=(t:number,a:number,b:number,c:number,d:number):number=>{
  const u=1-t
  return u*u*u*a+3*u*u*t*b+3*u*t*t*c+t*t*t*d
}

export function treeRoute(a:number,b:number):TreeRoute{
  const from=nodes[a],to=nodes[b]
  if(!from||!to)throw new Error('Casa da árvore inexistente')
  const dx=to.x-from.x,dy=to.y-from.y
  const length=Math.hypot(dx,dy)||1
  const nx=-dy/length,ny=dx/length
  const middle=isMidBranchRoute(a,b)
  const sway=middle
    ? Math.sin((a+3)*1.17+(b+2)*.61)*15
    : Math.sin(a*1.31+b*.83)*8

  // Nos galhos intermediários, a curva acompanha as inflexões naturais.
  // Não deslocar pontas: os círculos de cada casa permanecem sobre a madeira.
  const c1={
    x:from.x+dx*.30+nx*sway,
    y:from.y+dy*.30+ny*sway,
  }
  const c2={
    x:from.x+dx*.73+nx*sway*.75,
    y:from.y+dy*.73+ny*sway*.75,
  }
  const path='M'+from.x+' '+from.y+
    ' C'+c1.x.toFixed(1)+' '+c1.y.toFixed(1)+
    ' '+c2.x.toFixed(1)+' '+c2.y.toFixed(1)+
    ' '+to.x+' '+to.y
  const midway={
    x:cubic(.5,from.x,c1.x,c2.x,to.x),
    y:cubic(.5,from.y,c1.y,c2.y,to.y),
  }
  const stage=middle?Math.max(0,Math.min(5,Math.min(a,b)%6)):0
  const width=middle
    ? Math.max(10,26-stage*3.1)
    : a<12&&b<12?40
    : a>=12&&Math.floor(a/6)===Math.floor(b/6)?a<24?24:19
    : 13
  return {path,midway,width,middle}
}
