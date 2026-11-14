import { useEffect, useState } from 'react'

const rotations: Record<number,{x:number;y:number}> = {
  1:{x:0,y:0}, 2:{x:-90,y:0}, 3:{x:0,y:-90},
  4:{x:0,y:90}, 5:{x:90,y:0}, 6:{x:0,y:180},
}
const faceTurns = [
  {value:1,css:'translateZ(33px)'},
  {value:6,css:'rotateY(180deg) translateZ(33px)'},
  {value:3,css:'rotateY(90deg) translateZ(33px)'},
  {value:4,css:'rotateY(-90deg) translateZ(33px)'},
  {value:2,css:'rotateX(90deg) translateZ(33px)'},
  {value:5,css:'rotateX(-90deg) translateZ(33px)'},
]
const pipIndexes: Record<number,number[]> = {
  1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8],
}

type Props = {value:number|null; pending?:boolean; canRoll?:boolean; disabled?:boolean; onRoll?:()=>void}
export default function RuneDie({value,pending=false,canRoll=false,disabled=false,onRoll}:Props) {
  const [angle,setAngle]=useState({x:-20,y:24})
  const [turn,setTurn]=useState(0)
  useEffect(()=>{
    if(value===null || !rotations[value]) return
    setTurn(t=>t+1)
    // A rolagem é APENAS visual: não gera números ou resultados locais.
    setAngle({x:(turn+1)*720+rotations[value].x,y:(turn+1)*720+rotations[value].y})
    // value é o resultado recebido da função RPC do Supabase.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[value])
  return <div className="rounded-2xl border border-[#85663a]/60 bg-[#13100c]/90 p-3 text-center text-[#ecd5a7]">
    <p className="text-xs uppercase tracking-[.18em] text-[#ceae72]">Dado da Árvore</p>
    <div className={'runic-die-scene mx-auto my-3 flex h-[104px] items-center justify-center '+(pending?'runic-die-pending':'')}>
      <div className="runic-die-cube" style={{transform:'rotateX('+angle.x+'deg) rotateY('+angle.y+'deg)'}}>
        {faceTurns.map(face=><div key={face.value} className="runic-die-face" style={{transform:face.css}}>
          <div className="grid h-full w-full grid-cols-3 grid-rows-3 place-items-center p-[10px]">
            {Array.from({length:9},(_,i)=><span key={i}
              className={pipIndexes[face.value].includes(i)?'runic-die-pip':'h-[9px] w-[9px]'}/>)}
          </div>
        </div>)}
      </div>
    </div>
    <p className="mb-3 text-sm" role="status" aria-live="polite">
      Resultado: <strong className="tabular-nums text-lg text-[#ffe0a1]">{value??(pending?'…':'—')}</strong>
    </p>
    {canRoll&&<button type="button" onClick={onRoll} disabled={disabled||pending}
      className="min-h-12 w-full rounded-xl bg-gradient-to-b from-[#f0d39d] to-[#ba8d47] px-3 font-bold text-[#291d11] shadow-[0_3px_0_#634721] disabled:cursor-not-allowed disabled:opacity-45">
      {pending?'Lançando…':'Lançar dado'}
    </button>}
  </div>
}
