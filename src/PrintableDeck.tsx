import { useEffect, useMemo, useState } from 'react'
import CardMasterSvg, {type MasterCard} from './components/CardMasterSvg'
import {getSupabaseClient} from './lib/supabase'
import './print.css'

const categories=[
  {id:'todas',name:'Todas as categorias'},
  {id:'identificacao',name:'Identificação'},
  {id:'cotidiano',name:'Cotidiano'},
  {id:'desafio',name:'Desafios'},
  {id:'acontecimento',name:'Acontecimentos'},
]
function pageOfFour(cards:MasterCard[]):MasterCard[][]{
  const pages:MasterCard[][]=[]
  for(let i=0;i<cards.length;i+=4)pages.push(cards.slice(i,i+4))
  return pages
}
function mirrorColumns(items:MasterCard[]):(MasterCard|null)[]{
  return [items[1]??null,items[0]??null,items[3]??null,items[2]??null]
}

export default function PrintableDeck(){
  const client=useMemo(getSupabaseClient,[])
  const [cards,setCards]=useState<MasterCard[]>([])
  const [category,setCategory]=useState('todas')
  const [backs,setBacks]=useState(true)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState<string|null>(null)

  useEffect(()=>{
    let active=true
    async function load(){
      if(!client){setError('A conexão com Supabase não está configurada.');setLoading(false);return}
      try{
        const current=await client.auth.getUser()
        if(!current.data.user){
          const signed=await client.auth.signInAnonymously()
          if(signed.error)throw signed.error
        }
        const result=await client.from('game_cards')
          .select('id,category,title,prompt,mode,options,symbol,instructions')
          .order('category',{ascending:true}).order('id',{ascending:true})
        if(result.error)throw result.error
        if(active)setCards((result.data??[]) as MasterCard[])
      }catch(e){
        if(active)setError(e instanceof Error?e.message:'Não foi possível abrir o baralho.')
      }finally{if(active)setLoading(false)}
    }
    void load()
    return()=>{active=false}
  },[client])
  const selected=cards.filter(card=>category==='todas'||card.category===category)
  const sheets=pageOfFour(selected)

  return <main className="min-h-dvh bg-[#101c15] p-3 text-[#f1dfb7] sm:p-6">
    <header className="no-print mx-auto max-w-5xl rounded-2xl border border-[#b59055]/50 bg-[#1e3024] p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[.16em] text-[#cead75]">Matriz física e digital · versão 1</p>
          <h1 className="mt-1 font-serif text-2xl font-bold sm:text-3xl">Baralho Raízes da Matéria</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#cbd1bf]">
            A carta impressa usa exatamente a mesma arte SVG da partida. Formato de
            75 × 105 mm em folhas A4, quatro cartas por folha, frente e verso alinhados.
            A Libras permanece sinalizada como não homologada até revisão por especialistas.
          </p>
        </div>
        <a href="./" className="inline-flex min-h-11 items-center rounded-xl border border-[#c09e6d]/50 px-4 text-sm font-semibold">Voltar ao jogo</a>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <label className="text-sm">Selecionar cartas
          <select value={category} onChange={event=>setCategory(event.target.value)}
            className="mt-1 min-h-11 w-full rounded-xl border border-[#b5986b]/45 bg-[#112017] px-3">
            {categories.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[#a17d4b]/30 px-3 text-sm">
          <input type="checkbox" checked={backs} onChange={e=>setBacks(e.target.checked)}
            className="h-4 w-4 accent-[#d0a46a]"/>
          Incluir versos
        </label>
        <button type="button" onClick={()=>window.print()}
          disabled={loading||!!error||!selected.length}
          className="min-h-11 rounded-xl bg-[#d7af72] px-5 font-bold text-[#22190e] disabled:opacity-50">
          Imprimir ou salvar como PDF
        </button>
      </div>
      {error&&<p role="alert" className="mt-3 text-red-300">{error}</p>}
      <p className="mt-3 text-xs text-[#cbbfa7]">
        {loading?'Carregando cartas…':selected.length+' cartas · '+sheets.length+' folhas de frentes'}
        {backs?' e '+sheets.length+' folhas de versos':''}.
        Ao imprimir, use A4, escala 100%, sem margens; para frente e verso, prefira virada pela borda longa.
        Faça uma folha de teste para conferir o alinhamento da impressora.
      </p>
    </header>

    {!loading&&!error&&sheets.map((cardsOnSheet,index)=><div key={index}>
      <section className="deck-print-sheet" aria-label={'Frente da folha '+(index+1)}
        data-deck-side="front">
        <div className="w-full">
          <p className="deck-print-caption">FOLHA {index+1} · FRENTES</p>
          <div className="deck-print-grid">
            {Array.from({length:4},(_,i)=>cardsOnSheet[i]??null).map((card,i)=>
              <div key={card?.id??'empty-'+i} className="deck-print-card">
                {card&&<CardMasterSvg card={card} side="front"/>}
              </div>)}
          </div>
        </div>
      </section>
      {backs&&<section className="deck-print-sheet" aria-label={'Verso da folha '+(index+1)}
        data-deck-side="back">
        <div className="w-full">
          <p className="deck-print-caption">FOLHA {index+1} · VERSOS (espelhados para duplex)</p>
          <div className="deck-print-grid">
            {mirrorColumns(cardsOnSheet).map((card,i)=>
              <div key={card?.id??'empty-'+i} className="deck-print-card">
                {card&&<CardMasterSvg card={card} side="back"/>}
              </div>)}
          </div>
        </div>
      </section>}
    </div>)}
  </main>
}
