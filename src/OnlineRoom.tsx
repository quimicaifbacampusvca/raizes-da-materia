import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import YggdrasilBoard from './components/YggdrasilBoard'
import RuneDie from './components/RuneDie'
import { houseLabel, neighbors, nodes, playableElements, playerColors, playerMarks } from './game/board'
import { getSupabaseClient, isSupabaseConfigured } from './lib/supabase'

type Phase='lobby'|'ready'|'moving'|'challenge'|'finished'
type Room={
  id:string;code:string;name:string;host_id:string;phase:Phase;
  current_seat:number|null;die_roll:number|null;remaining_steps:number;
  award_used:boolean;revision:number
}
type Player={user_id:string;seat:number;nickname:string;node_id:number;active:boolean}
type Claim={symbol:string;owner_id:string}
type RpcResult={id:string;code:string;seat?:number;kind?:'host'}
type Panel='pessoas'|'acoes'|null
type Board='arvore'|'tabela'

const skin={
  card:'rounded-2xl border border-[#8b6d46]/35 bg-[#1b251e]/95 p-4 shadow-[0_12px_40px_#04090766]',
  field:'min-h-12 w-full rounded-xl border border-[#ad8e57]/35 bg-[#0e1b16] px-3 text-[#f3e5c4] outline-offset-2 focus-visible:outline-[#f1d6a5]',
  gold:'min-h-12 rounded-xl border border-[#ddc18e]/40 bg-gradient-to-b from-[#f1d79e] to-[#bb914f] px-4 font-bold text-[#291e12] shadow-[0_3px_0_#654922] disabled:cursor-not-allowed disabled:opacity-45',
  secondary:'min-h-11 rounded-xl border border-[#a78b5c]/45 bg-[#2a3026]/90 px-3 font-semibold text-[#e6d3ad] hover:bg-[#354536] disabled:cursor-not-allowed disabled:opacity-40',
}
function inviteCode():string{
  return location.hash.match(/(?:^#|[&?])sala=([0-9a-f]{8,12})/i)?.[1]?.toUpperCase()??''
}
function phaseLabel(p:Phase):string{
  return {lobby:'Aguardando participantes',ready:'Lançamento do dado',moving:'Percorrendo a árvore',challenge:'Desafio do mestre',finished:'Sala encerrada'}[p]
}
function errorText(e:unknown):string{
  return e instanceof Error?e.message:'Erro de comunicação. Verifique a conexão.'
}

function PeriodicAtlas({claims,players}: {claims:Claim[];players:Player[]}) {
  const seats=new Map(claims.map(c=>[c.symbol,players.find(p=>p.user_id===c.owner_id)?.seat??0]))
  return <div className={skin.card+' w-full min-w-0'}>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div><h2 className="font-serif text-xl tracking-wide text-[#f0d8a6]">Atlas Periódico</h2>
        <p className="text-xs text-[#b9bbad]">50 elementos disputáveis · referência às 118 posições</p></div>
      <span className="rounded-lg border border-[#91764b]/45 px-3 py-1 text-sm text-[#f2dcac]">{claims.length}/50 conquistados</span>
    </div>
    <div className="overflow-x-auto overscroll-x-contain pb-3" role="region" aria-label="Tabela Periódica com rolagem lateral" tabIndex={0}>
      <div className="min-w-[630px] max-w-[1080px]">
        <div className="mb-2 grid grid-cols-18 gap-1 text-center text-[10px] text-[#a9946b]">
          {Array.from({length:18},(_,i)=><span key={i}>{i+1}</span>)}
        </div>
        {Array.from({length:7},(_,p)=><div key={p} className="mb-1 grid grid-cols-18 gap-1">
          {Array.from({length:18},(_,g)=>{
            const item=playableElements.find(e=>e.period===p+1&&e.group===g+1)
            const seat=item?seats.get(item.symbol):undefined
            return <div key={g} title={item?.name}
              className={'flex h-10 min-w-0 items-center justify-center rounded-md border text-xs font-bold sm:h-12 '+
                (item?'border-[#c2a16c]':'border-[#4d4d3a]/35 bg-[#0d1c16]/60')}
              style={item?{background:seat?playerColors[seat-1]:'#354939',color:seat?'#121d15':'#f2ddb4'}:undefined}>
              {item?.symbol??''}
            </div>
          })}
        </div>)}
        {[{title:'Lantanídeos',start:58},{title:'Actinídeos',start:90}].map(group=>
          <div key={group.title} className="mt-2 flex items-center gap-2 text-[#b6a47e]">
            <span className="w-[110px] shrink-0 text-xs">{group.title}</span>
            <div className="grid flex-1 grid-cols-14 gap-1">
              {Array.from({length:14},(_,i)=><div key={i}
                className="flex h-9 items-center justify-center rounded border border-[#66563f]/45 bg-[#121d17] text-[10px]">
                {group.start+i}
              </div>)}
            </div>
          </div>)}
      </div>
    </div>
    <p className="mt-2 text-xs leading-relaxed text-[#b8bdad]">Os símbolos coloridos pertencem aos jogadores. Os demais campos indicam regiões da tabela ainda indisponíveis nesta edição.</p>
  </div>
}

export default function OnlineRoom(){
  const [userId,setUserId]=useState<string|null>(null)
  const [code,setCode]=useState(inviteCode)
  const [name,setName]=useState('Pesquisador')
  const [title,setTitle]=useState('Expedição da Matéria')
  const [roomId,setRoomId]=useState<string|null>(()=>inviteCode()?null:sessionStorage.getItem('raizes-room-id'))
  const [room,setRoom]=useState<Room|null>(null)
  const [players,setPlayers]=useState<Player[]>([])
  const [claims,setClaims]=useState<Claim[]>([])
  const [symbol,setSymbol]=useState('H')
  const [board,setBoard]=useState<Board>('arvore')
  const [panel,setPanel]=useState<Panel>(null)
  const [exitConfirm,setExitConfirm]=useState(false)
  const headerRef=useRef<HTMLElement>(null)
  const [headerHeight,setHeaderHeight]=useState(128)
  const [busy,setBusy]=useState(false)
  const [pendingRoll,setPendingRoll]=useState(false)
  const [notice,setNotice]=useState('Crie uma sala como mestre ou entre com um código de convite.')
  const [authError,setAuthError]=useState<string|null>(null)
  const supabase=useMemo(getSupabaseClient,[])
  const configured=isSupabaseConfigured()

  useEffect(()=>{
    if(!supabase) return
    let cancelled=false
    async function login(){
      if(!supabase)return
      try {
        const existing=await supabase.auth.getUser()
        if(existing.data.user){if(!cancelled)setUserId(existing.data.user.id);return}
        const created=await supabase.auth.signInAnonymously()
        if(created.error)throw created.error
        if(!cancelled)setUserId(created.data.user?.id??null)
      } catch(e){if(!cancelled)setAuthError(errorText(e))}
    }
    void login()
    return()=>{cancelled=true}
  },[supabase])

  const refresh=useCallback(async(id:string)=>{
    if(!supabase)return
    const [r,p,c]=await Promise.all([
      supabase.from('game_rooms').select('id,code,name,host_id,phase,current_seat,die_roll,remaining_steps,award_used,revision').eq('id',id).single(),
      supabase.from('game_players').select('user_id,seat,nickname,node_id,active').eq('room_id',id).order('seat'),
      supabase.from('game_claims').select('symbol,owner_id').eq('room_id',id),
    ])
    if(r.error)throw r.error
    if(p.error)throw p.error
    if(c.error)throw c.error
    setRoom(r.data as Room)
    setPlayers(p.data as Player[])
    setClaims(c.data as Claim[])
  },[supabase])

  useEffect(()=>{
    if(!roomId||!userId||!supabase)return
    let cancelled=false
    const sync=()=>{void refresh(roomId).catch(e=>{if(!cancelled)setNotice(errorText(e))})}
    sync()
    const channel=supabase.channel('sala-'+roomId)
      .on('postgres_changes',{event:'*',schema:'public',table:'game_rooms',filter:'id=eq.'+roomId},sync)
      .on('postgres_changes',{event:'*',schema:'public',table:'game_players',filter:'room_id=eq.'+roomId},sync)
      .on('postgres_changes',{event:'*',schema:'public',table:'game_claims',filter:'room_id=eq.'+roomId},sync)
      .subscribe()
    const poll=window.setInterval(sync,7000)
    const visible=()=>{if(document.visibilityState==='visible')sync()}
    document.addEventListener('visibilitychange',visible)
    return()=>{
      cancelled=true;clearInterval(poll)
      document.removeEventListener('visibilitychange',visible)
      void supabase.removeChannel(channel)
    }
  },[supabase,roomId,userId,refresh])
  useEffect(()=>{
    const escape=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){setExitConfirm(false);setPanel(null)}
    }
    window.addEventListener('keydown',escape)
    return()=>window.removeEventListener('keydown',escape)
  },[])

  useEffect(()=>{
    const header=headerRef.current
    if(!header)return
    const update=()=>setHeaderHeight(Math.ceil(header.getBoundingClientRect().height))
    update()
    const observer=new ResizeObserver(update)
    observer.observe(header)
    window.addEventListener('resize',update)
    return()=>{observer.disconnect();window.removeEventListener('resize',update)}
  },[])

  const host=!!room&&room.host_id===userId
  const activePlayers=players.filter(p=>p.active)
  const self=activePlayers.find(p=>p.user_id===userId)
  const current=activePlayers.find(p=>p.seat===room?.current_seat)
  const myTurn=!!room&&room.current_seat===self?.seat
  const targets=myTurn&&room?.phase==='moving'&&self?neighbors(self.node_id):[]
  const canAward=host&&room?.phase==='challenge'&&!room.award_used&&!!current&&
    ((current.node_id*17)%48)<20
  const remainingElements=playableElements.filter(e=>!claims.some(c=>c.symbol===e.symbol))
  const activeSeat=room?.current_seat??null

  async function execute(action:()=>PromiseLike<{data:unknown;error:{message:string}|null}>,message:string|((data:unknown)=>string)){
    if(!supabase||busy)return
    setBusy(true)
    try{
      const {data,error}=await action()
      if(error)throw new Error(error.message)
      const result=data as RpcResult|boolean|number|null
      if(typeof result==='object'&&result!==null&&'id' in result){
        sessionStorage.setItem('raizes-room-id',result.id)
        setRoomId(result.id)
        await refresh(result.id)
      }else if(roomId){await refresh(roomId)}
      setNotice(typeof message==='function'?message(result):message)
    }catch(e){
      const msg=errorText(e)
      setNotice(msg.includes('Mestre não entra como jogador')
        ? 'Essa é sua sala de mestre. Para testar um jogador, utilize outro navegador ou janela privada.'
        : 'Não foi possível concluir: '+msg)
    }finally{setBusy(false)}
  }
  function createRoom(){
    if(!supabase)return
    void execute(()=>supabase.rpc('game_create_room',{p_name:title.trim()}),'Sala criada. Compartilhe o convite com os jogadores.')
  }
  function joinRoom(){
    if(!supabase||!userId)return
    const normalized=code.toUpperCase().trim()
    void execute(async()=>{
      const own=await supabase.from('game_rooms').select('id').eq('code',normalized).eq('host_id',userId).maybeSingle()
      if(own.error)return{data:null,error:own.error}
      if(own.data)return{data:{id:own.data.id,kind:'host'},error:null}
      return supabase.rpc('game_join_room',{p_code:normalized,p_nickname:name.trim()})
    },data=>{
      const isHost=!!data&&typeof data==='object'&&'kind' in data&&data.kind==='host'
      return isHost?'Sala recuperada: você é o mestre. Para testar como jogador, use outra sessão.':'Você entrou na sala!'
    })
  }
  function act(fn:'game_start_room'|'game_roll_die'|'game_end_turn'){
    if(!supabase||!roomId)return
    const messages={
      game_start_room:'Partida iniciada. Boa exploração!',
      game_roll_die:'O dado foi lançado; siga os galhos destacados.',
      game_end_turn:'Turno concluído.',
    }
    if(fn==='game_roll_die')setPendingRoll(true)
    void execute(()=>supabase.rpc(fn,{p_room:roomId}),messages[fn]).finally(()=>setPendingRoll(false))
  }
  function move(nodeId:number){
    if(!supabase||!roomId||!targets.includes(nodeId)||busy)return
    void execute(()=>supabase.rpc('game_move_pawn',{p_room:roomId,p_node:nodeId}),'Movimento registrado na árvore.')
  }
  function award(){
    if(!supabase||!roomId||!canAward)return
    const chosen=remainingElements.some(e=>e.symbol===symbol)?symbol:remainingElements[0]?.symbol
    if(!chosen)return
    void execute(()=>supabase.rpc('game_award_element',{p_room:roomId,p_symbol:chosen}),'Elemento conquistado e registrado no Atlas.')
  }
  async function exitRoom(){
    if(!supabase||!roomId||busy)return
    setBusy(true)
    try{
      if(room?.phase!=='finished'){
        const fn=host?'game_close_room':'game_leave_room'
        const result=await supabase.rpc(fn,{p_room:roomId})
        if(result.error)throw result.error
      }
      sessionStorage.removeItem('raizes-room-id')
      setRoomId(null);setRoom(null);setPlayers([]);setClaims([])
      setPanel(null);setExitConfirm(false);setBoard('arvore')
      setNotice(host?'A sala foi encerrada para todos.':'Você saiu da sala. É possível entrar em outra partida.')
    }catch(e){setNotice('Não foi possível sair: '+errorText(e));setExitConfirm(false)}
    finally{setBusy(false)}
  }
  function copyInvite(){
    if(!room)return
    const url=location.origin+location.pathname+'#sala='+room.code
    if(navigator.clipboard?.writeText){
      void navigator.clipboard.writeText(url).then(()=>setNotice('Convite copiado.')).catch(()=>setNotice('Copie: '+url))
    }else setNotice('Copie: '+url)
  }
  function clickDock(target:'arvore'|'tabela'|'pessoas'|'acoes'){
    if(target==='arvore'||target==='tabela'){setBoard(target);setPanel(null)}
    else setPanel(p=>p===target?null:target)
  }
  const panelTitle=panel==='pessoas'?'Participantes e conquistas':'Ações da partida'

  return <main className="min-h-dvh min-w-0 bg-[#0b1712] pb-[calc(6.6rem+env(safe-area-inset-bottom))] text-[#eee0c2]">
    <header ref={headerRef} className="sticky top-0 z-[60] border-b border-[#98784e]/30 bg-[#13251b]/95 px-3 py-2 shadow-xl backdrop-blur-md sm:px-5">
      <div className="mx-auto flex min-w-0 max-w-[1680px] flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[.2em] text-[#cbb388] sm:text-xs">Química • Libras • Estratégia</p>
          <h1 className="truncate font-serif text-lg font-bold tracking-wide text-[#efdaad] sm:text-2xl">Raízes da Matéria</h1>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {room&&<button type="button" className={skin.secondary+' max-w-[44vw] truncate text-xs sm:max-w-none sm:text-sm'} onClick={copyInvite}
            aria-label={'Copiar convite da sala '+room.code} title="Copiar convite">
            Sala {room.code}
          </button>}
          <span className="rounded-full border border-[#739a75]/40 bg-[#234633]/80 px-3 py-1.5 text-[11px] text-[#cfedc9]">
            {room?(host?'Mestre':'Jogador'):(userId?'Conectado':'Conectando')}
          </span>
          {room&&<button type="button" onClick={()=>setExitConfirm(true)}
            className="min-h-11 rounded-lg border border-[#d09988]/55 bg-[#432820]/75 px-3 text-xs font-semibold text-[#f1c4ae]">
            Sair da sala
          </button>}
        </div>
      </div>
    </header>

    <div className="mx-auto w-full max-w-[1680px] px-2 py-3 sm:px-4">
      <p role="status" aria-live="polite" className="mb-3 rounded-xl border border-[#b19565]/30 bg-[#24362a] px-3 py-2 text-sm leading-relaxed text-[#e4d5b5]">
        {notice}
      </p>
      {authError&&<p role="alert" className="mb-3 rounded-xl border border-red-400/60 bg-red-950/40 p-3 text-sm text-[#ffd9c8]">
        Falha na autenticação: {authError}
      </p>}
      {!configured&&<div className={skin.card+' mx-auto max-w-2xl'}>
        <h2 className="mb-2 font-serif text-xl">Conexão não configurada</h2>
        <p className="text-sm">Esta publicação precisa da URL pública e da chave publishable do projeto Supabase. O modo local foi temporariamente desativado para priorizar o multiplayer.</p>
      </div>}

      {configured&&!room&&<div className="mx-auto grid max-w-4xl gap-4 pt-4 sm:grid-cols-2">
        <section className={skin.card}>
          <p className="mb-2 text-xs uppercase tracking-[.14em] text-[#c8ae7e]">Painel do mestre</p>
          <h2 className="mb-3 font-serif text-2xl text-[#eedaad]">Criar uma expedição</h2>
          <p className="mb-4 text-sm text-[#c1cbbd]">Crie uma sala e compartilhe o código com até quatro jogadores.</p>
          <label htmlFor="room-name" className="mb-1 block text-sm">Nome da sala</label>
          <input id="room-name" className={skin.field} value={title} maxLength={72}
            onChange={e=>setTitle(e.target.value)}/>
          <button type="button" className={skin.gold+' mt-3 w-full'} disabled={!userId||busy||title.trim().length<2} onClick={createRoom}>
            Criar sala multiplayer
          </button>
        </section>
        <section className={skin.card}>
          <p className="mb-2 text-xs uppercase tracking-[.14em] text-[#c8ae7e]">Painel do jogador</p>
          <h2 className="mb-3 font-serif text-2xl text-[#eedaad]">Entrar na árvore</h2>
          <p className="mb-4 text-sm text-[#c1cbbd]">Entre com um convite do mestre. Um celular corresponde a um participante.</p>
          <label htmlFor="invite-code" className="mb-1 block text-sm">Código da sala</label>
          <input id="invite-code" className={skin.field} value={code} maxLength={12}
            autoCapitalize="characters" autoComplete="off" onChange={e=>setCode(e.target.value.toUpperCase())}/>
          <label htmlFor="nickname" className="mb-1 mt-3 block text-sm">Apelido</label>
          <input id="nickname" className={skin.field} value={name} maxLength={32}
            onChange={e=>setName(e.target.value)}/>
          <button type="button" className={skin.gold+' mt-3 w-full'}
            disabled={!userId||busy||code.length<8||name.trim().length<2} onClick={joinRoom}>Entrar na sala</button>
        </section>
        <p className="text-center text-xs text-[#a9b6a2] sm:col-span-2">A partida é compartilhada em tempo real. O mestre apresenta os desafios em Libras; seus resultados ficam registrados no Supabase.</p>
      </div>}

      {configured&&room&&<>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#846b47]/40 bg-[#1b2b20] px-3 py-2">
          <div><p className="text-sm font-semibold text-[#f0daad]">{room.name}</p>
            <p className="text-xs text-[#b6c0ac]">{phaseLabel(room.phase)} · {activePlayers.length}/4 jogadores</p></div>
          <div className="flex flex-wrap items-center gap-2">
            {current&&<span className="text-xs">Vez: <strong className="text-[#f8dda5]">{current.nickname}</strong></span>}
            {room.phase==='lobby'&&host&&<button className={skin.gold+' text-xs'} disabled={busy||activePlayers.length===0} onClick={()=>act('game_start_room')}>Iniciar</button>}
            <button className={skin.secondary+' text-xs'} onClick={()=>setPanel('acoes')}>Abrir ações</button>
          </div>
        </div>
        <div className="relative min-w-0">
          {board==='arvore'
            ?<YggdrasilBoard pawns={activePlayers.map(p=>({seat:p.seat,nodeId:p.node_id}))}
              focusedNodeId={current?.node_id??0} reachableIds={targets} onMove={move} busy={busy}/>
            :<PeriodicAtlas claims={claims} players={players}/>}
          {room.phase==='finished'&&<div className="mt-3 rounded-xl border border-[#bb9263]/55 bg-[#352b20] p-3 text-sm text-[#f5d9a6]">
            A sala foi encerrada. Seus dados permanecem no histórico até a futura implementação de arquivamento. Utilize “Sair da sala” para voltar à entrada.
          </div>}
          {room.phase==='lobby'&&!host&&<p className="mt-3 rounded-xl border border-[#846b47]/30 bg-[#202e23] p-3 text-sm">
            Aguardando o mestre iniciar a partida. Você já está conectado à sala.
          </p>}
        </div>
      </>}
    </div>

    {room&&<nav aria-label="Doca de navegação" className="fixed inset-x-0 bottom-0 z-50 border-t border-[#bc975b]/45 bg-[#101c15]/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_36px_#0009] backdrop-blur-xl">
      <div className="mx-auto grid max-w-[720px] grid-cols-4 gap-1 sm:gap-3">
        {([
          {key:'arvore',name:'Árvore',symbol:'♣'},
          {key:'tabela',name:'Tabela',symbol:'▦'},
          {key:'pessoas',name:'Jogadores',symbol:'◉'},
          {key:'acoes',name:'Ações',symbol:'⚄'},
        ] as const).map(tab=>{
          const selected=tab.key==='arvore'||tab.key==='tabela'?board===tab.key&&panel===null:panel===tab.key
          return <button key={tab.key} type="button" onClick={()=>clickDock(tab.key)}
            aria-current={selected?'page':undefined}
            className={'flex min-h-[62px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] font-semibold sm:text-sm '+
              (selected?'bg-[#a8844b] text-[#14170f]':'border border-[#7b6440]/25 bg-[#1e2a20] text-[#e5d8b6]')}>
            <span aria-hidden="true" className="text-xl leading-5">{tab.symbol}</span><span>{tab.name}</span>
          </button>
        })}
      </div>
    </nav>}

    {room&&panel&&<div className="fixed inset-x-2 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 overflow-y-auto overscroll-contain rounded-2xl border border-[#c19a61]/65 bg-[#17241c]/98 p-3 shadow-[0_15px_75px_#000b] backdrop-blur-xl sm:inset-x-auto sm:right-5 sm:w-[min(420px,calc(100vw-32px))] sm:p-4"
      style={{top:headerHeight+8}}
      role="region" aria-label={'Painel flutuante: '+panelTitle}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-serif text-xl text-[#f4dba8]">{panelTitle}</h2>
        <button className={skin.secondary+' shrink-0'} type="button" onClick={()=>setPanel(null)} aria-label="Fechar painel">Fechar</button>
      </div>
      {panel==='pessoas'&&<>
        <p className="mb-3 text-sm text-[#bcc9b8]">Mestre: {host?'você':'conectado'} · {activePlayers.length}/4 participantes ativos</p>
        {activePlayers.length===0?<p className="text-sm">Aguardando jogadores.</p>:
          activePlayers.map(p=><div key={p.user_id} className="mb-2 flex items-center gap-2 rounded-xl border border-[#826f47]/35 bg-[#263227] px-3 py-3">
            <span className="text-2xl" style={{color:playerColors[p.seat-1]}}>{playerMarks[p.seat-1]}</span>
            <span className="min-w-0 flex-1 truncate text-sm">{p.nickname}{p.user_id===userId?' (você)':''}</span>
            <span className="text-xs text-[#cbb895]">{p.seat===activeSeat?'Vez':'Casa '+(p.node_id+1)}</span>
          </div>)}
        <div className="mt-4 rounded-xl bg-[#0e1913] p-3">
          <h3 className="font-semibold text-[#f0d6a8]">Domínios ({claims.length}/50)</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {claims.map(c=>{
              const seat=players.find(p=>p.user_id===c.owner_id)?.seat??0
              return <span key={c.symbol} className="rounded-lg border border-white/25 px-2 py-1 text-xs font-bold"
                style={{backgroundColor:seat?playerColors[seat-1]:'#493f2b',color:'#151a13'}}>{c.symbol}</span>
            })}
            {!claims.length&&<p className="text-sm text-[#b1bfaa]">Nenhum elemento conquistado.</p>}
          </div>
        </div>
      </>}
      {panel==='acoes'&&<>
        {room.phase==='lobby'&&<div className="mb-3 text-sm">
          <p>Aguardando participantes. Compartilhe o código <strong>{room.code}</strong>.</p>
          <button className={skin.secondary+' mt-2 w-full'} onClick={copyInvite}>Copiar convite</button>
          {host&&<button className={skin.gold+' mt-2 w-full'} disabled={busy||activePlayers.length===0}
            onClick={()=>act('game_start_room')}>Iniciar partida</button>}
        </div>}
        {room.phase!=='lobby'&&<>
          <RuneDie value={room.die_roll} pending={pendingRoll} canRoll={myTurn&&room.phase==='ready'}
            disabled={busy} onRoll={()=>act('game_roll_die')}/>
          <p className="mt-3 text-sm">Passos restantes: <strong className="text-[#f6d99e]">{room.remaining_steps}</strong></p>
          {room.phase==='moving'&&<p className="mt-2 text-sm text-[#cad5c6]">
            {myTurn?'Toque em um galho destacado da árvore para avançar.':'Aguarde o participante percorrer o trajeto.'}
          </p>}
          {room.phase==='challenge'&&<div className="mt-3 rounded-xl border border-[#93784c]/50 bg-[#263021] p-3">
            <h3 className="font-semibold">Desafio em andamento</h3>
            <p className="mt-2 text-sm text-[#cdd6c2]">
              {current?'Casa '+(current.node_id+1)+' — '+houseLabel[nodes[current.node_id].type]:'Aguardando mestre'}
            </p>
            <p className="mt-2 text-xs text-[#b6c8b8]">A resposta em Libras é apresentada e validada pelo mestre presencialmente.</p>
          </div>}
          {host&&room.phase==='challenge'&&<>
            <div className="mt-4 rounded-xl border border-[#c69e65]/45 p-3">
              <h3 className="font-semibold text-[#f1d7a1]">Validação do mestre</h3>
              <p className="mb-3 text-xs">Disponível apenas na casa de identificação. O resultado é validado no servidor.</p>
              <label htmlFor="award-select" className="mb-1 block text-xs">Elemento correto</label>
              <select id="award-select" className={skin.field}
                value={remainingElements.some(e=>e.symbol===symbol)?symbol:(remainingElements[0]?.symbol??'')}
                onChange={e=>setSymbol(e.target.value)} disabled={!canAward||busy}>
                {remainingElements.map(e=><option key={e.symbol} value={e.symbol}>{e.symbol} — {e.name}</option>)}
              </select>
              <button type="button" className={skin.gold+' mt-3 w-full'}
                disabled={!canAward||busy||remainingElements.length===0} onClick={award}>Validar conquista</button>
            </div>
          </>}
          {room.phase==='challenge'&&(host||myTurn)&&<button type="button" onClick={()=>act('game_end_turn')}
            disabled={busy} className={skin.secondary+' mt-3 w-full'}>Encerrar turno</button>}
        </>}
      </>}
    </div>}

    {exitConfirm&&room&&<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm"
      role="presentation" onClick={e=>{if(e.target===e.currentTarget)setExitConfirm(false)}}>
      <section role="dialog" aria-modal="true" aria-labelledby="exit-title"
        className="w-full max-w-[430px] rounded-2xl border border-[#c49b63] bg-[#202b21] p-5 shadow-2xl">
        <h2 id="exit-title" className="mb-2 font-serif text-2xl text-[#f5dbad]">
          {host?'Encerrar sala?':'Sair da sala?'}
        </h2>
        <p className="mb-5 text-sm text-[#d2ddc8]">
          {host?'A partida será encerrada para todos os jogadores conectados. Esta ação não apaga os registros anteriores.':
          'Você sairá desta partida. Suas conquistas já registradas permanecerão no histórico e sua vaga ficará disponível.'}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" className={skin.secondary} onClick={()=>setExitConfirm(false)}>Cancelar</button>
          <button type="button" className="min-h-12 rounded-xl bg-[#9c4d39] px-4 font-semibold text-white disabled:opacity-50"
            disabled={busy} onClick={()=>void exitRoom()}>{host?'Encerrar para todos':'Confirmar saída'}</button>
        </div>
      </section>
    </div>}
  </main>
}
