import { useMemo, useState } from 'react'
import OnlineRoom from './OnlineRoom'
import { houseColor, houseLabel, neighbors, nodes, playableElements, playerColors, playerMarks } from './game/board'

type View = 'arvore' | 'tabela'
const initialPositions = [1, 1, 1, 1]

export default function App() {
  const [page, setPage] = useState<'local'|'online'>(location.hash.includes('sala=') ? 'online' : 'local')
  return <div className="min-h-dvh bg-[#0d1d19] text-white">
    <nav aria-label="Modos de jogo" className="flex flex-wrap justify-center gap-2 border-b border-white/10 bg-[#102820] px-3 py-3">
      <button onClick={() => setPage('local')} aria-current={page==='local'?'page':undefined}
        className={'min-h-11 rounded-lg px-4 text-sm font-semibold '+(page==='local'?'bg-[#d8b875] text-[#1b3327]':'border border-white/30 text-[#e2eee7]')}>
        Demonstração local
      </button>
      <button onClick={() => setPage('online')} aria-current={page==='online'?'page':undefined}
        className={'min-h-11 rounded-lg px-4 text-sm font-semibold '+(page==='online'?'bg-[#d8b875] text-[#1b3327]':'border border-white/30 text-[#e2eee7]')}>
        Sala online
      </button>
    </nav>
    {page==='online' ? <OnlineRoom /> : <DemoApp />}
  </div>
}
function DemoApp() {
  const [view, setView] = useState<View>('arvore')
  const [active, setActive] = useState(0)
  const [positions, setPositions] = useState(initialPositions)
  const [remaining, setRemaining] = useState(0)
  const [lastRoll, setLastRoll] = useState<number | null>(null)
  const [claimed, setClaimed] = useState<Record<string, number>>({})
  const [notice, setNotice] = useState('Lance o dado e escolha as casas conectadas ao seu peão.')
  const [resolved, setResolved] = useState(false)
  const current = positions[active]
  const reachable = useMemo(() => remaining > 0 ? neighbors(current) : [], [current, remaining])
  const landing = nodes[current]
  const canResolve = lastRoll !== null && remaining === 0
  const ownedCount = Object.keys(claimed).length

  function roll() {
    if (lastRoll !== null) return
    const n = Math.floor(Math.random() * 6) + 1
    setLastRoll(n)
    setResolved(false)
    setRemaining(n)
    setNotice('Dado: ' + n + '. Toque em uma casa conectada para percorrer um passo.')
    setView('arvore')
  }
  function move(id: number) {
    if (!reachable.includes(id)) return
    setPositions(previous => previous.map((v, i) => i === active ? id : v))
    setRemaining(n => n - 1)
    if (remaining === 1) setNotice('Movimento encerrado. A casa alcançada é: ' + houseLabel[nodes[id].type] + '.')
  }
  function claim() {
    if (!canResolve || landing.type !== 'identificacao' || resolved) return
    // DEMONSTRAÇÃO LOCAL: não valida Libras nem verifica acertos; isso pertencerá ao mestre e ao servidor.
    const available = playableElements.find(el => claimed[el.symbol] === undefined)
    if (!available) { setNotice('Todos os elementos do protótipo estão atribuídos.'); return }
    setClaimed(previous => ({ ...previous, [available.symbol]: active }))
    setResolved(true)
    setNotice('SIMULAÇÃO: ' + available.symbol + ' — ' + available.name + ' marcado para o Jogador ' + (active + 1) + '.')
  }
  function nextTurn() {
    setActive(i => (i + 1) % 4)
    setLastRoll(null)
    setResolved(false)
    setRemaining(0)
    setNotice('Próximo jogador. Lance o dado para começar seu turno.')
  }

  return <main className="min-h-dvh bg-[#0d1d19] text-[#f0eee3]">
    <header className="border-b border-white/10 bg-[#142b25] px-4 py-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <div><p className="text-xs uppercase tracking-[.24em] text-[#9ec6b6]">Jogo de Química e Libras</p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-3xl">Raízes da Matéria</h1></div>
        <span className="rounded-full border border-[#7b986e]/50 bg-[#274238] px-3 py-1 text-xs">Protótipo 0.1</span>
      </div>
    </header>
    <div className="mx-auto max-w-5xl px-3 py-4 sm:px-6">
      <p role="status" className="mb-4 rounded-xl border border-amber-400/20 bg-amber-100/10 px-4 py-3 text-sm text-amber-100">
        Demonstração local interativa. A conexão entre celulares e o painel seguro do mestre dependem da configuração do backend Supabase.
      </p>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#192d27]">
          <nav aria-label="Alternar tabuleiros" className="grid grid-cols-2 border-b border-white/10">
            <button className={'min-h-12 p-3 font-medium ' + (view === 'arvore' ? 'bg-[#355c4c] text-white' : 'text-[#bed1c7]')} onClick={() => setView('arvore')}>Árvore da Descoberta</button>
            <button className={'min-h-12 p-3 font-medium ' + (view === 'tabela' ? 'bg-[#355c4c] text-white' : 'text-[#bed1c7]')} onClick={() => setView('tabela')}>Tabela Periódica</button>
          </nav>
          {view === 'arvore' ? <div className="p-2 sm:p-4">
            <p className="py-2 text-center text-xs text-[#b7c9bc]">Raízes · Tronco · Ramos · Passagens transversais</p>
            <svg viewBox="0 0 395 603" className="mx-auto block h-auto w-full max-w-[510px]" aria-label="Mapa de 48 casas conectadas da Árvore da Descoberta">
              <defs><linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#9c8459"/><stop offset="1" stopColor="#513f30"/></linearGradient></defs>
              <path d="M196 600 Q185 490 192 390 Q206 250 197 30" fill="none" stroke="url(#wood)" strokeWidth="20" strokeLinecap="round"/>
              <path d="M195 570 Q130 533 56 553 M196 570 Q267 534 335 553 M197 400 Q130 352 50 337 M197 400 Q278 354 345 337 M197 227 Q137 185 50 165 M197 227 Q266 183 340 165" stroke="#8a7253" strokeWidth="8" fill="none" strokeLinecap="round"/>
              {nodes.flatMap(n => neighbors(n.id).filter(j => j > n.id).map(j => {
                const b = nodes[j]
                return <path key={n.id + '-' + j} d={'M' + n.x + ' ' + n.y + ' Q' + ((n.x + b.x) / 2) + ' ' + ((n.y + b.y) / 2 - (n.row === b.row ? 9 : 0)) + ' ' + b.x + ' ' + b.y} stroke="#9ab99e" strokeOpacity=".6" strokeWidth="2.5" fill="none" />
              }))}
              {nodes.map(n => {
                const canSelect = reachable.includes(n.id)
                const isHere = positions[active] === n.id
                const fill = houseColor[n.type]
                const mark = n.type === 'identificacao' ? 'I' : n.type === 'cotidiano' ? 'C' : n.type === 'desafio' ? 'D' : '±'
                return <g key={n.id} tabIndex={canSelect ? 0 : -1} role="button" aria-label={'Casa ' + (n.id + 1) + ', ' + houseLabel[n.type] + (canSelect ? ', disponível para movimento' : '')} aria-disabled={!canSelect} onClick={() => move(n.id)} onKeyDown={ev => { if (canSelect && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); move(n.id) } }} className={canSelect ? 'cursor-pointer outline-none' : ''}>
                  {canSelect && <circle cx={n.x} cy={n.y} r="20" stroke="#fff5a9" strokeWidth="2" fill="none" strokeDasharray="4 3"/>}
                  <circle cx={n.x} cy={n.y} r="14" fill={fill} stroke={isHere ? '#fff7b7' : '#edddc2'} strokeWidth={isHere ? 3 : 1.3}/>
                  <text x={n.x} y={n.y + 4} fontSize="11" fill="#fff" textAnchor="middle" fontWeight="bold">{mark}</text>
                  {positions.some(p => p === n.id) && <circle cx={n.x + 10} cy={n.y - 11} r="5" fill={playerColors[positions.indexOf(n.id)]} stroke="#fff" strokeWidth="1.2"/>}
                </g>
              })}
            </svg>
          </div> : <div className="p-3 sm:p-4">
            <h2 className="mb-2 text-lg font-semibold">Atlas Periódico</h2>
            <p className="mb-3 text-sm text-[#bbcdc2]">118 posições científicas; 50 elementos jogáveis nesta edição. Deslize horizontalmente para consultar a tabela.</p>
            <div className="overflow-x-auto pb-3" aria-label="Tabela Periódica de conquistas">
              <div className="min-w-[620px] space-y-1">
                {Array.from({length: 7}, (_,p) => <div className="grid grid-cols-18 gap-1" key={p}>
                  {Array.from({length:18},(_,g) => {
                    const el = playableElements.find(e => e.period === p+1 && e.group === g+1)
                    const unavailable = !el && !(p===0 && g!==0 && g!==17) && !(p===1 || p===2) 
                    const inactive = !el && unavailable
                    return <div key={g} title={el ? el.name : inactive ? 'Posição não jogável nesta edição' : undefined}
                      className={'flex h-9 min-w-0 items-center justify-center rounded text-[10px] font-semibold ' +
                        (el ? 'border border-[#769c87] ' : inactive ? 'border border-white/10 bg-white/5 text-white/25' : '')}
                      style={el ? {backgroundColor: claimed[el.symbol] === undefined ? '#29483d' : playerColors[claimed[el.symbol]],color:'#fff'} : undefined}>
                      {el ? el.symbol : inactive ? '·' : ''}
                    </div>
                  })}
                </div>)}
                {[Array.from({length:14},(_,i)=>i+58),Array.from({length:14},(_,i)=>i+90)].map((f,p)=><div className="grid grid-cols-18 gap-1 pt-1" key={'f'+p}>
                  <span className="col-span-3 py-2 text-[10px] text-[#c1d1c5]">{p===0?'Lantanídeos':'Actinídeos'}</span>
                  {f.map(n=><div className="flex h-9 items-center justify-center rounded border border-white/10 bg-white/5 text-[9px] text-white/40" key={n}>{n}</div>)}
                </div>)}
              </div>
            </div>
            <p className="text-xs text-[#c2d6c8]">Cores mostram a posse de cada jogador. Os elementos inativos permanecem como referência estrutural.</p>
          </div>}
        </section>
        <aside className="space-y-4">
          <section className="rounded-2xl border border-white/10 bg-[#192d27] p-4">
            <h2 className="text-lg font-semibold">Mesa de jogo</h2>
            <p className="mb-3 text-xs text-[#b7cbbc]">Simulação de uma única tela, sem sincronização.</p>
            <div className="grid grid-cols-4 gap-2">
              {playerColors.map((color,i)=><div className={'rounded-xl border p-2 text-center ' + (active===i?'border-white/60':'border-white/10')} key={i}>
                <div className="text-xl" style={{color}}>{playerMarks[i]}</div><div className="text-xs">J{i+1}</div>
              </div>)}
            </div>
            <p className="mt-4 text-sm">Vez do <strong>Jogador {active + 1}</strong></p>
            <div className="my-3 rounded-xl bg-[#10251e] px-4 py-3 text-sm" role="status">{notice}</div>
            <p className="mb-3 text-sm">Dado: <strong>{lastRoll ?? '—'}</strong> · Passos restantes: <strong>{remaining}</strong></p>
            <button onClick={roll} disabled={lastRoll!==null} className="mb-2 min-h-12 w-full rounded-xl bg-[#d9b976] px-4 font-semibold text-[#203428] disabled:opacity-40">Lançar 1d6</button>
            {canResolve && <div className="mb-2 rounded-xl border border-white/15 p-3 text-sm">
              <p className="font-semibold">{houseLabel[landing.type]}</p>
              <p className="mt-1 text-[#bcd1c4]">A carta e o desafio são apresentados pelo mestre.</p>
              {landing.type === 'identificacao' && <button onClick={claim} disabled={resolved} className="mt-3 w-full rounded-lg border border-[#a7d7c0] px-3 py-3 text-[#d7f4e6] disabled:opacity-40">{resolved ? 'Conquista registrada' : 'Simular conquista de uma carta'}</button>}
            </div>}
            <button onClick={nextTurn} disabled={!canResolve} className="min-h-11 w-full rounded-xl border border-white/25 px-4 font-medium disabled:opacity-35">Encerrar turno</button>
          </section>
          <section className="rounded-2xl border border-white/10 bg-[#192d27] p-4">
            <h2 className="font-semibold">Conquistas: {ownedCount}/50</h2>
            <p className="my-2 text-sm text-[#bcd1c4]">Cada elemento conquistado aparece na cor de seu proprietário na Tabela Periódica.</p>
            <div className="flex flex-wrap gap-2">{Object.entries(claimed).slice(-15).map(([symbol,player])=><span key={symbol} className="rounded border border-white/30 px-2 py-1 text-sm" style={{backgroundColor:playerColors[player]}}>{symbol}</span>)}</div>
          </section>
          <section className="rounded-2xl border border-[#82b098]/25 bg-[#1a362d] p-4">
            <h2 className="font-semibold">Futura sala online</h2>
            <p className="mt-2 text-sm text-[#c5d7c9]">Mestre cria sala → jogadores entram por código/QR → estado sincronizado com Supabase. Ainda não ativado.</p>
          </section>
        </aside>
      </div>
      <footer className="py-6 text-center text-xs text-[#9cb8a7]">Protótipo de navegação e conquista. Pistas e sinais de Libras requerem validação especializada.</footer>
    </div>
  </main>
}
