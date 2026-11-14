import { useCallback, useEffect, useMemo, useState } from 'react'
import { houseLabel, neighbors, nodes, playableElements, playerColors, playerMarks } from './game/board'
import { getSupabaseClient, isSupabaseConfigured } from './lib/supabase'
import YggdrasilBoard from './components/YggdrasilBoard'

type Room = {
  id: string; code: string; name: string; host_id: string
  phase: 'lobby'|'ready'|'moving'|'challenge'|'finished'
  current_seat: number|null; die_roll: number|null
  remaining_steps: number; award_used: boolean; revision: number
}
type Player = { user_id: string; seat: number; nickname: string; node_id: number }
type Claim = { symbol: string; owner_id: string }
type JsonResponse = { id: string; code: string; seat?: number }

function getInviteCode(): string {
  const match = location.hash.match(/(?:^#|[&?])sala=([0-9a-f]{8,12})/i)
  return match?.[1]?.toUpperCase() ?? ''
}
function humanPhase(phase: Room['phase']): string {
  return { lobby:'Aguardando jogadores', ready:'Aguardando dado', moving:'Peão em movimento', challenge:'Desafio do mestre', finished:'Partida encerrada' }[phase]
}
function asError(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocorreu um erro de conexão.'
}
const styles = {
  card: 'rounded-2xl border border-white/15 bg-[#19352d] p-4',
  button: 'min-h-11 rounded-xl bg-[#d8b875] px-4 py-2 font-semibold text-[#1c3329] disabled:cursor-not-allowed disabled:opacity-35',
  secondary: 'min-h-11 rounded-xl border border-white/25 px-4 py-2 font-medium text-[#eef2e8] disabled:cursor-not-allowed disabled:opacity-35',
  field: 'min-h-12 w-full rounded-xl border border-white/20 bg-[#10251e] px-3 text-white outline-offset-2 focus:outline-[#f4d99a]',
}

export default function OnlineRoom() {
  const [userId, setUserId] = useState<string|null>(null)
  const [code, setCode] = useState(getInviteCode)
  const [name, setName] = useState('Pesquisador')
  const [roomTitle, setRoomTitle] = useState('Expedição da Matéria')
  const [roomId, setRoomId] = useState<string|null>(() => sessionStorage.getItem('raizes-room-id'))
  const [room, setRoom] = useState<Room|null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [claims, setClaims] = useState<Claim[]>([])
  const [symbol, setSymbol] = useState('H')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('Entre em uma sala ou crie uma partida como mestre.')
  const [authError, setAuthError] = useState<string|null>(null)
  const supabase = useMemo(getSupabaseClient, [])
  const configured = isSupabaseConfigured()

  useEffect(() => {
    if (!supabase) return
    let disposed = false
    async function authenticate() {
      try {
        if (!supabase) return
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error && !/session missing/i.test(error.message)) throw error
        if (user) { if (!disposed) setUserId(user.id); return }
        const next = await supabase.auth.signInAnonymously()
        if (next.error) throw next.error
        if (!disposed) setUserId(next.data.user?.id ?? null)
      } catch (e) { if (!disposed) setAuthError(asError(e)) }
    }
    void authenticate()
    return () => { disposed = true }
  }, [supabase])

  const refresh = useCallback(async (id: string) => {
    if (!supabase) return
    const [r,p,c] = await Promise.all([
      supabase.from('game_rooms').select('id,code,name,host_id,phase,current_seat,die_roll,remaining_steps,award_used,revision').eq('id',id).single(),
      supabase.from('game_players').select('user_id,seat,nickname,node_id').eq('room_id',id).order('seat'),
      supabase.from('game_claims').select('symbol,owner_id').eq('room_id',id),
    ])
    if (r.error) throw r.error
    if (p.error) throw p.error
    if (c.error) throw c.error
    setRoom(r.data as Room)
    setPlayers(p.data as Player[])
    setClaims(c.data as Claim[])
  }, [supabase])

  useEffect(() => {
    if (!roomId || !supabase) return
    let disposed = false
    const load = () => { void refresh(roomId).catch(e => { if (!disposed) setNotice(asError(e)) }) }
    load()
    const channel = supabase.channel('partida-' + roomId)
      .on('postgres_changes',{event:'*',schema:'public',table:'game_rooms',filter:'id=eq.'+roomId},load)
      .on('postgres_changes',{event:'*',schema:'public',table:'game_players',filter:'room_id=eq.'+roomId},load)
      .on('postgres_changes',{event:'*',schema:'public',table:'game_claims',filter:'room_id=eq.'+roomId},load)
      .subscribe()
    // Recuperação de conexão e fallback em redes móveis instáveis.
    const interval = setInterval(load, 6000)
    const visible = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', visible)
    return () => {
      disposed=true
      clearInterval(interval)
      document.removeEventListener('visibilitychange', visible)
      void supabase.removeChannel(channel)
    }
  }, [roomId,supabase,refresh])

  const host = !!room && room.host_id === userId
  const self = players.find(p => p.user_id === userId)
  const activePlayer = players.find(p => p.seat === room?.current_seat)
  const myTurn = !!room && room.current_seat === self?.seat
  const myPosition = self?.node_id ?? null
  const reachable = myTurn && room?.phase === 'moving' && myPosition !== null ? neighbors(myPosition) : []
  const canMasterAward = host && room?.phase === 'challenge' && !room.award_used &&
    !!activePlayer && ((activePlayer.node_id * 17) % 48) < 20
  const available = playableElements.filter(e => !claims.some(c => c.symbol === e.symbol))
  const ownerBySymbol = useMemo(() => new Map(claims.map(c => [c.symbol,players.find(p=>p.user_id===c.owner_id)?.seat ?? 0])), [claims,players])

  async function execute(action: () => PromiseLike<{data: unknown; error: {message:string}|null}>, message: string | ((result: unknown) => string), roomOverride?: string) {
    if (!supabase || loading) return
    setLoading(true)
    try {
      const {data,error} = await action()
      if (error) throw new Error(error.message)
      const response = data as JsonResponse|boolean|number|null
      const id = roomOverride ?? (typeof response === 'object' && response !== null && 'id' in response ? response.id : roomId)
      if (id) { sessionStorage.setItem('raizes-room-id',id); setRoomId(id); await refresh(id) }
      setNotice(typeof message === 'function' ? message(response) : message)
    } catch (e) {
      const detail = asError(e)
      const guidance = detail.includes('Mestre não entra como jogador')
        ? 'Você é o mestre desta sala. Use a visão de mestre aqui; para participar como jogador, abra o convite em uma janela InPrivate/anônima ou em outro celular.'
        : detail
      setNotice('Não foi possível concluir: ' + guidance)
    }
    finally { setLoading(false) }
  }

  async function createRoom() {
    if (!supabase) return
    await execute(() => supabase.rpc('game_create_room',{p_name:roomTitle}), 'Sala criada. Compartilhe o código com os jogadores.')
  }
  async function joinRoom() {
    if (!supabase || !userId) return
    const roomCode = code.toUpperCase().trim()
    await execute(async () => {
      // Evita o erro HTTP 400 quando o mestre tenta entrar com a própria sessão.
      const ownRoom = await supabase.from('game_rooms')
        .select('id').eq('code', roomCode).eq('host_id', userId).maybeSingle()
      if (ownRoom.error) return {data:null,error:ownRoom.error}
      if (ownRoom.data) return {data:{id:ownRoom.data.id,kind:'host'},error:null}
      return supabase.rpc('game_join_room',{p_code:roomCode,p_nickname:name.trim()})
    }, result => {
      const isHost = typeof result === 'object' && result !== null && 'kind' in result && result.kind === 'host'
      return isHost
        ? 'Esta é sua sala de mestre; reabrimos seu painel. Para testar um jogador, use outra sessão (janela InPrivate/anônima ou outro celular).'
        : 'Você entrou na partida!'
    })
  }
  function roomAction(fn: 'game_start_room'|'game_roll_die'|'game_end_turn') {
    if (!supabase || !roomId) return
    const labels = {game_start_room:'Partida iniciada.',game_roll_die:'Dado lançado.',game_end_turn:'Turno encerrado.'}
    void execute(() => supabase.rpc(fn,{p_room:roomId}), labels[fn])
  }
  function move(node: number) {
    if (!supabase || !roomId || !reachable.includes(node)) return
    void execute(() => supabase.rpc('game_move_pawn',{p_room:roomId,p_node:node}), 'Peão movimentado.')
  }
  function award() {
    if (!supabase || !roomId || !canMasterAward) return
    const chosen = available.some(e=>e.symbol===symbol) ? symbol : available[0]?.symbol
    if (!chosen) return
    void execute(() => supabase.rpc('game_award_element',{p_room:roomId,p_symbol:chosen}), 'Elemento atribuído ao jogador atual.')
  }

  if (!configured) return <section className="mx-auto max-w-3xl p-4 text-[#f2ede1]">
    <div className={styles.card}><h2 className="text-2xl font-semibold">Salas online</h2>
      <p className="mt-3 text-sm text-[#c4d6cb]">O front-end multiplayer está preparado, mas ainda não há projeto Supabase vinculado a esta publicação. É necessário configurar a URL pública e a chave publishable do projeto, habilitar login anônimo e aplicar o esquema SQL. A demonstração local continua disponível.</p></div>
  </section>

  return <section className="mx-auto max-w-5xl p-3 text-[#f0eee3] sm:p-5">
    <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs uppercase tracking-[.17em] text-[#9cc6ab]">Sala de aula · Multiplayer</p>
        <h2 className="text-2xl font-semibold">Raízes da Matéria Online</h2></div>
      <span className="rounded-xl border border-white/20 px-3 py-2 text-xs">{userId ? 'Sessão anônima ativa' : 'Autenticando...'}</span>
    </header>
    {authError && <p role="alert" className="mb-3 rounded-xl border border-red-300 p-3 text-red-100">{authError}. Verifique se o login anônimo está habilitado no Supabase.</p>}
    <p role="status" className="mb-4 rounded-xl border border-[#a6b39b]/30 bg-[#263e34] p-3 text-sm">{notice}</p>
    {!roomId && <div className="grid gap-4 sm:grid-cols-2">
      <div className={styles.card}>
        <h3 className="text-lg font-semibold">Sou o mestre</h3>
        <p className="mb-3 text-sm text-[#c3d3c9]">Crie uma sala para controlar os desafios em Libras.</p>
        <label className="mb-1 block text-sm" htmlFor="room-title">Nome da sala</label>
        <input id="room-title" className={styles.field} value={roomTitle} maxLength={72} onChange={e=>setRoomTitle(e.target.value)}/>
        <button className={styles.button+' mt-3 w-full'} disabled={!userId || loading || roomTitle.trim().length<2} onClick={()=>void createRoom()}>Criar sala</button>
      </div>
      <div className={styles.card}>
        <h3 className="text-lg font-semibold">Sou jogador</h3>
        <p className="mb-3 text-sm text-[#c3d3c9]">Entre usando o código compartilhado pelo mestre. O mestre não pode assumir uma vaga de jogador na mesma sessão.</p>
        <label className="mb-1 block text-sm" htmlFor="room-code">Código da sala</label>
        <input id="room-code" autoCapitalize="characters" autoComplete="off" className={styles.field} value={code} maxLength={12} onChange={e=>setCode(e.target.value.toUpperCase())}/>
        <label className="mb-1 mt-3 block text-sm" htmlFor="player-name">Apelido</label>
        <input id="player-name" className={styles.field} value={name} maxLength={32} onChange={e=>setName(e.target.value)}/>
        <button className={styles.button+' mt-3 w-full'} disabled={!userId || loading || code.length<8 || name.trim().length<2} onClick={()=>void joinRoom()}>Entrar na sala</button>
      </div>
    </div>}
    {room && <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <div className={styles.card}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h3 className="text-lg font-semibold">{room.name}</h3>
              <p className="text-sm text-[#c4d7ca]">Código: <strong className="tracking-[.2em] text-white">{room.code}</strong></p>
              <p className="text-xs text-[#c1d2c6]">{humanPhase(room.phase)}</p></div>
            <div className="flex flex-wrap gap-2"><button className={styles.secondary} onClick={()=> {
              const url = location.origin + location.pathname + '#sala=' + room.code
              void navigator.clipboard.writeText(url).then(()=>setNotice('Link de convite copiado.')).catch(()=>setNotice(url))
            }}>Copiar convite</button><button className={styles.secondary} onClick={()=> {
              sessionStorage.removeItem('raizes-room-id'); setRoomId(null); setRoom(null); setPlayers([]); setClaims([]); setNotice('Você voltou à entrada. Seu registro anterior na sala foi preservado.')
            }}>Voltar à entrada</button></div>
          </div>
        </div>
        <div className={styles.card}>
          <h3 className="mb-2 font-semibold">Árvore da Descoberta</h3>
          <p className="text-xs text-[#baccbd]">Os círculos com borda clara indicam movimentos permitidos. Os peões são compartilhados com todos os celulares.</p>
          <YggdrasilBoard
            className="mt-3"
            pawns={players.map(player => ({ seat: player.seat, nodeId: player.node_id }))}
            focusedNodeId={activePlayer?.node_id ?? null}
            reachableIds={reachable}
            onMove={move}
            busy={loading}
          />
        </div>
        <div className={styles.card}>
          <h3 className="mb-2 font-semibold">Tabela Periódica · Domínios</h3>
          <div className="overflow-x-auto pb-3">
            <div className="min-w-[670px]">
              {Array.from({length:7},(_,p)=><div key={p} className="mb-1 grid grid-cols-18 gap-1">
                {Array.from({length:18},(_,g)=>{
                  const element=playableElements.find(e=>e.period===p+1&&e.group===g+1)
                  const seat=element?ownerBySymbol.get(element.symbol):undefined
                  return <div key={g} className="flex h-9 items-center justify-center rounded border border-white/15 text-xs"
                    style={element?{background:seat?playerColors[seat-1]:'#2c5045'}:{opacity:.16}}>
                    {element?.symbol||''}
                  </div>
                })}
              </div>)}
            </div>
          </div>
          <p className="text-xs text-[#bcd0c2]">{claims.length}/50 elementos conquistados nesta sala.</p>
        </div>
      </div>
      <aside className="space-y-4">
        <div className={styles.card}>
          <h3 className="mb-3 font-semibold">Participantes ({players.length}/4)</h3>
          <p className="mb-2 text-xs text-[#bed0c4]">Mestre: {host?'você':'conectado à sala'} · Atualização em tempo real</p>
          {players.length===0&&<p className="text-sm text-[#bed0c4]">Aguardando jogadores entrarem.</p>}
          {players.map(p=><div key={p.seat} className="mb-2 flex items-center gap-2 rounded-lg border border-white/10 p-2">
            <span className="text-lg" style={{color:playerColors[p.seat-1]}}>{playerMarks[p.seat-1]}</span>
            <span className="flex-1 text-sm">{p.nickname}{p.user_id===userId?' (você)':''}</span>
            {p.seat===room.current_seat&&<span className="text-xs text-amber-200">Vez</span>}
          </div>)}
          <p className="mt-3 text-sm">Dado: <strong>{room.die_roll??'—'}</strong> · Restam <strong>{room.remaining_steps}</strong> passos</p>
          {host&&room.phase==='lobby'&&<button disabled={loading||!players.length} className={styles.button+' mt-3 w-full'} onClick={()=>roomAction('game_start_room')}>Iniciar partida</button>}
          {myTurn&&room.phase==='ready'&&<button disabled={loading} className={styles.button+' mt-3 w-full'} onClick={()=>roomAction('game_roll_die')}>Lançar dado</button>}
          {myTurn&&room.phase==='moving'&&<p className="mt-3 text-xs text-[#d7e5d3]">Selecione uma das casas destacadas no mapa para movimentar seu peão.</p>}
          {room.phase==='challenge'&&<div className="mt-3 rounded-lg bg-[#10261e] p-3 text-sm">
            <p className="font-medium">{activePlayer?'Casa de '+houseLabel[nodes[activePlayer.node_id].type]:'Desafio em andamento'}</p>
            <p className="mt-1 text-[#bfd2c2]">O mestre apresenta o desafio presencialmente em Libras e valida a resposta.</p>
          </div>}
          {room.phase==='challenge'&&(myTurn||host)&&<button disabled={loading} className={styles.secondary+' mt-3 w-full'} onClick={()=>roomAction('game_end_turn')}>Encerrar turno</button>}
        </div>
        {host&&<div className={styles.card}>
          <h3 className="font-semibold">Painel do mestre</h3>
          <p className="my-2 text-xs text-[#c0d2c8]">Gabaritos e sinais em Libras devem ser apresentados e validados pelo mestre, não pelo dispositivo do jogador.</p>
          <label className="mb-1 block text-xs" htmlFor="award-element">Elemento identificado corretamente</label>
          <select id="award-element" value={available.some(e=>e.symbol===symbol)?symbol:(available[0]?.symbol??'')}
            onChange={e=>setSymbol(e.target.value)} disabled={!canMasterAward||loading}
            className={styles.field}>
            {available.map(e=><option key={e.symbol} value={e.symbol}>{e.symbol} — {e.name}</option>)}
          </select>
          <button disabled={!canMasterAward||loading||available.length===0} onClick={award} className={styles.button+' mt-3 w-full'}>Validar conquista</button>
          <p className="mt-2 text-xs text-[#a9c3b0]">A atribuição é autorizada e registrada no banco, com apenas um elemento por turno.</p>
        </div>}
      </aside>
    </div>}
  </section>
}
