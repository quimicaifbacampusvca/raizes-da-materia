import { useEffect, useState } from 'react'
import { getPhysicalCard } from '../game/cardArt'

type Props = {
  symbol: string
  won: boolean
}

export default function PhysicalCard({symbol,won}: Props) {
  const art=getPhysicalCard(symbol)
  const [showA,setShowA]=useState(false)
  const [enlarged,setEnlarged]=useState(false)
  const [imageFailed,setImageFailed]=useState(false)

  useEffect(()=>{
    setShowA(won)
    setImageFailed(false)
  },[won,symbol])

  useEffect(()=>{
    if (!enlarged) return
    const escape=(event: KeyboardEvent)=>{if(event.key==='Escape')setEnlarged(false)}
    window.addEventListener('keydown',escape)
    return ()=>window.removeEventListener('keydown',escape)
  },[enlarged])

  if (!art) return null
  const active=showA&&won
  const image=active?art.a:art.b
  return <div className="flex flex-col items-center gap-2" data-testid="physical-card">
    <p className="self-start text-xs font-bold uppercase tracking-[.15em] text-[#604525]">
      {active?'Baralho A · Elemento conquistado':'Baralho B · Investigação em Libras'}
    </p>
    <button type="button" onClick={()=>setEnlarged(true)}
      title="Ampliar a arte original da carta" aria-label="Ampliar a carta atual"
      className="physical-card-deal block w-[min(100%,270px)] cursor-zoom-in rounded-xl outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#71428a] sm:w-[min(100%,350px)]">
      <span className={'physical-card-rotator'+(active?' physical-card-rotator--reversed':'')}>
        <span className="physical-card-face" aria-hidden={active}>
          <img src={art.b} draggable={false} alt="" decoding="async"
            className="block h-auto w-full rounded-xl" onError={()=>setImageFailed(true)}/>
        </span>
        {won&&<span className="physical-card-face physical-card-face--back" aria-hidden={!active}>
          <img src={art.a} draggable={false} alt="" decoding="async"
            className="block h-auto w-full rounded-xl" onError={()=>setImageFailed(true)}/>
        </span>}
      </span>
    </button>
    {imageFailed&&<p role="alert" className="text-xs text-[#652b20]">A arte desta carta não carregou. Tente recarregar a página.</p>}
    <div className="flex w-full flex-wrap justify-center gap-2">
      <button type="button" onClick={()=>setEnlarged(true)}
        className="min-h-11 rounded-lg border border-[#8f6739] bg-[#f6e7c9] px-4 text-sm font-semibold text-[#35281c]">
        Ampliar carta
      </button>
      {won&&<button type="button" onClick={()=>setShowA(value=>!value)}
        className="min-h-11 rounded-lg border border-[#8f6739] bg-[#f6e7c9] px-4 text-sm font-semibold text-[#35281c]">
        {active?'Rever carta B':'Virar para carta A'}
      </button>}
    </div>
    {!won&&<p className="max-w-sm text-center text-xs text-[#59442a]">
      Observe a datilologia e as três dicas. A carta A será liberada após a validação correta do mestre.
    </p>}
    {enlarged&&<div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#070707]/95 p-3 backdrop-blur-md"
      role="presentation" onClick={event=>{if(event.target===event.currentTarget)setEnlarged(false)}}>
      <section role="dialog" aria-modal="true" aria-label="Carta física ampliada"
        className="flex max-h-[96dvh] w-full max-w-3xl flex-col items-center gap-2">
        <div className="flex w-full shrink-0 justify-between gap-3">
          <p className="self-center text-sm font-semibold text-[#eed8b3]">{active?'Carta A · Conquista':'Carta B · Investigação'}</p>
          <button type="button" className="min-h-11 rounded-lg bg-[#e8d2a6] px-4 font-bold text-[#291c11]"
            onClick={()=>setEnlarged(false)}>Fechar ✕</button>
        </div>
        <img src={image} alt={active?'Carta A do elemento '+symbol:'Carta B: sinais em Libras e três dicas sem revelar o elemento'}
          className="min-h-0 max-h-[calc(96dvh-110px)] max-w-full rounded-lg object-contain shadow-[0_20px_80px_#000]"
          draggable={false}/>
        {won&&<button type="button" className="min-h-11 rounded-lg bg-[#e8d2a6] px-4 font-bold text-[#291c11]"
          onClick={()=>setShowA(value=>!value)}>{active?'Rever carta B':'Virar para carta A'}</button>}
      </section>
    </div>}
  </div>
}
