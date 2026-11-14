import { useCallback, useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

type Card = {
  id:string;category:'identificacao'|'cotidiano'|'desafio'|'acontecimento'
  title:string;prompt:string;mode:'choice'|'text'
  options:string[];symbol:string|null;instructions:string
}
type Challenge={
  id:string;room_id:string;turn_index:number;card_id:string
  player_id:string;node_id:number;verdict:'correct'|'incorrect'|null
}
type Submission={player_id:string;mode:'choice'|'text';option_index:number|null;answer_text:string|null}
type Message={id:number;sender_id:string;body:string;created_at:string}
type Key={correct_index:number|null;reference:string}
export type CardParticipant={user_id:string;nickname:string;seat:number}

type Props={
  client:SupabaseClient;roomId:string;turnIndex:number
  userId:string|null;host:boolean;isCurrentPlayer:boolean
  participants:CardParticipant[];playerName:string
  onClose:()=>void;onValidated:()=>void;onEndTurn:()=>void
}
const themes={
  identificacao:{label:'Identificação do elemento',color:'#7651a2',mark:'◈'},
  cotidiano:{label:'Investigação do cotidiano',color:'#387a81',mark:'●'},
  desafio:{label:'Desafio químico',color:'#977042',mark:'◆'},
  acontecimento:{label:'Acontecimento da árvore',color:'#7c5f47',mark:'✦'},
}
const button='min-h-11 rounded-xl border border-[#b48a4d]/50 px-3 font-semibold disabled:cursor-not-allowed disabled:opacity-40'
const textField='w-full rounded-xl border border-[#9b7b50]/50 bg-[#18160f] px-3 py-2 text-[#fbebca] placeholder:text-[#aa9b81] focus-visible:outline-2 focus-visible:outline-[#edd29c]'

export default function ChallengeCard({
  client,roomId,turnIndex,userId,host,isCurrentPlayer,participants,playerName,
  onClose,onValidated,onEndTurn,
}:Props){
  const [challenge,setChallenge]=useState<Challenge|null>(null)
  const [card,setCard]=useState<Card|null>(null)
  const [submission,setSubmission]=useState<Submission|null>(null)
  const [messages,setMessages]=useState<Message[]>([])
  const [key,setKey]=useState<Key|null>(null)
  const [choice,setChoice]=useState<number|null>(null)
  const [answer,setAnswer]=useState('')
  const [chatText,setChatText]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState<string|null>(null)
  const [loaded,setLoaded]=useState(false)

  const load=useCallback(async()=>{
    try{
      const result=await client.from('game_room_challenges')
        .select('id,room_id,turn_index,card_id,player_id,node_id,verdict')
        .eq('room_id',roomId).eq('turn_index',turnIndex).maybeSingle()
      if(result.error)throw result.error
      if(!result.data){
        setChallenge(null);setCard(null);setSubmission(null)
        setMessages([]);setKey(null);setLoaded(true);return
      }
      const next=result.data as Challenge
      const [c,s,m]=await Promise.all([
        client.from('game_cards')
          .select('id,category,title,prompt,mode,options,symbol,instructions').eq('id',next.card_id).single(),
        client.from('game_challenge_submissions')
          .select('player_id,mode,option_index,answer_text').eq('challenge_id',next.id).maybeSingle(),
        client.from('game_challenge_messages')
          .select('id,sender_id,body,created_at').eq('challenge_id',next.id).order('id',{ascending:true}).limit(125),
      ])
      if(c.error)throw c.error
      if(s.error)throw s.error
      if(m.error)throw m.error
      let answerKey:Key|null=null
      if(host){
        const response=await client.rpc('game_get_card_key',{p_room:roomId,p_challenge:next.id})
        if(response.error)throw response.error
        answerKey=response.data as Key
      }
      setChallenge(next)
      setCard(c.data as Card)
      setSubmission(s.data as Submission|null)
      setMessages(m.data as Message[])
      setKey(answerKey)
      setLoaded(true)
      setError(null)
    }catch(e){
      setError(e instanceof Error?e.message:'Não foi possível carregar esta carta.')
      setLoaded(true)
    }
  },[client,roomId,turnIndex,host])

  useEffect(()=>{
    let active=true
    const sync=()=>{if(active)void load()}
    sync()
    const timer=window.setInterval(sync,2500)
    const channel=client.channel('carta-'+roomId+'-'+turnIndex)
      .on('postgres_changes',{event:'*',schema:'public',table:'game_room_challenges',filter:'room_id=eq.'+roomId},sync)
      .subscribe()
    const foreground=()=>{if(document.visibilityState==='visible')sync()}
    document.addEventListener('visibilitychange',foreground)
    return()=>{
      active=false
      clearInterval(timer)
      document.removeEventListener('visibilitychange',foreground)
      void client.removeChannel(channel)
    }
  },[client,load,roomId,turnIndex])

  async function perform(work:()=>PromiseLike<{error:{message:string}|null}>,message:string){
    if(busy)return
    setBusy(true);setError(null)
    try{
      const result=await work()
      if(result.error)throw new Error(result.error.message)
      await load()
      if(message==='validated')onValidated()
    }catch(e){setError(e instanceof Error?e.message:'Não foi possível concluir a ação.')}
    finally{setBusy(false)}
  }
  function sendAnswer(){
    if(!challenge||!card||!isCurrentPlayer||challenge.verdict||submission)return
    const index=card.mode==='choice'?choice:null
    const text=card.mode==='text'?answer.trim():null
    if(card.mode==='choice'&&index===null){setError('Selecione uma alternativa.');return}
    if(card.mode==='text'&&(!text||text.length<2)){setError('Descreva sua resposta.');return}
    void perform(()=>client.rpc('game_submit_answer',{
      p_room:roomId,p_challenge:challenge.id,p_option:index,p_text:text,
    }),'answer')
  }
  function sendMessage(){
    if(!challenge||!chatText.trim()||challenge.verdict)return
    const body=chatText.trim()
    void perform(()=>client.rpc('game_send_challenge_message',{
      p_room:roomId,p_challenge:challenge.id,p_body:body,
    }),'chat')
    setChatText('')
  }
  function validate(correct:boolean){
    if(!challenge||!host||challenge.verdict||busy)return
    void perform(()=>client.rpc('game_validate_card',{
      p_room:roomId,p_challenge:challenge.id,p_correct:correct,
    }),'validated')
  }

  useEffect(()=>{setChoice(null);setAnswer('')},[challenge?.id])

  const theme=card?themes[card.category]:null
  const status=challenge?.verdict
  const canRespond=isCurrentPlayer&&!status&&!submission
  const submitReady=card?.mode==='choice'?choice!==null:answer.trim().length>=2
  const respondent=participants.find(p=>p.user_id===challenge?.player_id)?.nickname||playerName
  const chosenText=submission?.mode==='choice'&&submission.option_index!==null
    ?card?.options[submission.option_index]:submission?.answer_text

  return <div className="fixed inset-0 z-[65] flex items-center justify-center bg-[#030704]/85 px-2 py-2 backdrop-blur-sm sm:px-5 sm:py-4"
    role="presentation">
    <section role="dialog" aria-modal="true" aria-label="Carta de investigação compartilhada"
      className="flex max-h-[calc(100dvh-1rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border-2 border-[#af8850] bg-[#1b2117] shadow-[0_15px_80px_#000] sm:max-h-[calc(100dvh-2rem)]">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-[#927447]/50 bg-[#29281d] px-3 py-2 sm:px-5">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[.13em] text-[#c8af7e]">Raízes da Matéria · Carta compartilhada</p>
          <h2 className="truncate font-serif text-lg font-semibold text-[#f4d9a9] sm:text-2xl">
            {card?.title||'Preparando carta…'}
          </h2>
        </div>
        <button type="button" onClick={onClose} className={button+' shrink-0 bg-[#342d21] text-xs text-[#f1ddbc]'}>Ver tabuleiro</button>
      </header>

      <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto overscroll-contain p-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,.85fr)] lg:gap-4 lg:p-5">
        <article className="min-w-0 overflow-hidden rounded-2xl border-[3px] border-[#b7915b] bg-[#cfb487] p-3 text-[#211810] shadow-[inset_0_0_35px_#6d482a55] sm:p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-[#e6d19f] text-2xl text-[#fff2ca]"
                style={{background:theme?.color??'#6c5c46'}}>{theme?.mark||'✦'}</span>
              <div><p className="text-xs font-bold uppercase tracking-wide">{theme?.label||'Carta digital'}</p>
                <p className="text-xs">Casa {challenge?challenge.node_id+1:'—'} · Vez de {respondent}</p></div>
            </div>
            {card?.symbol&&<span className="rounded-lg border-2 border-[#78542c] bg-[#f0d6a7] px-3 py-1 font-serif text-2xl font-bold">{card.symbol}</span>}
          </div>

          {!loaded&&<p className="p-4">Carregando carta para todos os participantes…</p>}
          {loaded&&!challenge&&<p className="rounded-lg border border-[#997a55] p-3 text-sm">
            Esta partida começou antes da ativação do baralho digital. A etapa atual permanece presencial; as próximas casas abrirão cartas para toda a sala.
          </p>}
          {error&&<p role="alert" className="mb-3 rounded-lg border border-[#a04f3b] bg-[#f1c7b5] p-2 text-sm">{error}</p>}

          {card&&challenge&&<>
            <p className="mb-4 font-serif text-lg font-semibold leading-snug sm:text-2xl">{card.prompt}</p>
            {card.mode==='choice'?<div className="space-y-2" role="radiogroup" aria-label="Alternativas da carta">
              {card.options.map((option,i)=><label key={i}
                className={'flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm font-semibold sm:text-base '+
                  (choice===i?'border-[#795224] bg-[#f4dfb6]':'border-[#80613d]/50 bg-[#e2c79a]/65')+
                  (!canRespond?' cursor-default opacity-85':'')}>
                <input type="radio" name={'answer-'+challenge.id} value={i} checked={choice===i}
                  onChange={()=>setChoice(i)} disabled={!canRespond}
                  className="h-5 w-5 accent-[#654527]"/>
                <span className="min-w-0 flex-1">{String.fromCharCode(65+i)}. {option}</span>
              </label>)}
            </div>:<div>
              <label htmlFor="card-answer" className="mb-2 block text-sm font-semibold">Sua resposta para avaliação</label>
              <textarea id="card-answer" className={textField+' min-h-[104px]'} value={answer}
                onChange={e=>setAnswer(e.target.value)} maxLength={600}
                placeholder="Explique sua resposta ao mestre…" disabled={!canRespond}/>
            </div>}
            {canRespond&&<button className="mt-4 min-h-12 w-full rounded-xl bg-[#513a23] px-4 font-semibold text-[#f9e5bf] disabled:opacity-40"
              disabled={busy||!submitReady} onClick={sendAnswer}>Enviar resposta ao mestre</button>}
            {submission&&<div className="mt-4 rounded-xl border border-[#6f6e45] bg-[#e6d4a9] p-3 text-sm">
              <p className="font-semibold">Resposta enviada ao mestre</p>
              <p className="mt-1 whitespace-pre-wrap break-words">{chosenText}</p>
            </div>}
            {!isCurrentPlayer&&!host&&<p className="mt-3 text-sm">A carta está visível para você. O jogador da vez responde; todos podem participar do diálogo.</p>}
            {card.instructions&&<p className="mt-4 border-t border-[#8b714e] pt-3 text-sm italic">{card.instructions}</p>}
            {status&&<p role="status" className={'mt-4 rounded-lg border-2 p-3 font-bold '+
              (status==='correct'?'border-[#426e48] bg-[#b6d5a9]':'border-[#924f3a] bg-[#e6ad9b]')}>
              {status==='correct'?'✓ Resposta validada como correta pelo mestre.':'× Resposta marcada como incorreta pelo mestre.'}
            </p>}
          </>}
        </article>

        <aside className="flex min-w-0 flex-col gap-3">
          {host&&challenge&&<section className="rounded-xl border border-[#a68655] bg-[#2b2e21] p-3 text-[#efdfbc]">
            <h3 className="font-serif text-lg font-semibold">Validador do mestre</h3>
            <p className="my-2 text-xs text-[#b9c2aa]">O gabarito permanece reservado. O mestre decide após avaliar a resposta e o diálogo.</p>
            {key&&<div className="rounded-lg border border-[#b59a6d]/40 bg-[#101a13] p-3 text-sm">
              <p className="mb-1 text-xs font-bold uppercase text-[#d7b777]">Referência reservada</p>
              {key.correct_index!==null&&card&&<p className="mb-2 font-semibold">
                Alternativa esperada: {String.fromCharCode(65+key.correct_index)} — {card.options[key.correct_index]}
              </p>}
              <p className="leading-relaxed">{key.reference}</p>
            </div>}
            {submission?<div className="mt-2 rounded-lg border border-[#a99068]/35 p-3 text-sm">
              <p className="font-semibold">Resposta recebida de {respondent}:</p>
              <p className="mt-1 whitespace-pre-wrap break-words">{chosenText}</p>
            </div>:<p className="mt-3 text-sm text-[#cfbda0]">Nenhuma resposta formal enviada. Você pode avaliar o diálogo em Libras ou por chat.</p>}
            {!status&&<div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={()=>validate(true)} disabled={busy}
                className="min-h-12 rounded-xl border border-[#b6e5a5]/40 bg-[#276b46] px-2 font-bold text-white disabled:opacity-50">
                ✓ Correto
              </button>
              <button type="button" onClick={()=>validate(false)} disabled={busy}
                className="min-h-12 rounded-xl border border-[#e1b7a7]/50 bg-[#914e36] px-2 font-bold text-white disabled:opacity-50">
                × Incorreto
              </button>
            </div>}
            {status&&<p className="mt-3 text-sm font-semibold">Veredito registrado. Agora o turno pode ser encerrado.</p>}
          </section>}
          {status&&(host||isCurrentPlayer)&&<button type="button" onClick={onEndTurn}
            className={button+' min-h-12 bg-[#d2ad70] text-[#261c11]'}>Encerrar turno e continuar</button>}

          <section className="flex min-h-[240px] flex-1 flex-col overflow-hidden rounded-xl border border-[#9a7a4d]/45 bg-[#17251c] text-[#f0e0bb]">
            <div className="border-b border-[#9a7a4d]/40 px-3 py-3">
              <h3 className="font-serif text-lg font-semibold">Diálogo da expedição</h3>
              <p className="text-xs text-[#b8c8b2]">Chat compartilhado entre mestre e jogadores. Não há transmissão de vídeo nesta edição.</p>
            </div>
            <div className="max-h-[220px] min-h-[100px] flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-3"
              role="log" aria-label="Mensagens da carta" aria-live="polite">
              {messages.length===0?<p className="text-xs text-[#b8c8b2]">Nenhuma mensagem enviada. Inicie uma conversa sobre a carta.</p>:messages.map(m=>{
                const speaker=m.sender_id===userId?'Você':
                  participants.find(p=>p.user_id===m.sender_id)?.nickname||
                  (host?'Participante':'Mestre')
                return <div key={m.id} className="rounded-lg border border-[#b1a078]/20 bg-[#2a3427] px-3 py-2 text-sm">
                  <p className="mb-1 text-[11px] font-bold uppercase text-[#dbbe88]">{speaker}</p>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                </div>
              })}
            </div>
            {!status&&challenge&&<div className="border-t border-[#9a7a4d]/40 p-3">
              <label htmlFor="expedition-chat" className="mb-2 block text-xs text-[#d7c9a8]">Mensagem para todos</label>
              <textarea id="expedition-chat" rows={2} maxLength={500} className={textField}
                value={chatText} onChange={e=>setChatText(e.target.value)}
                placeholder="Pergunte, responda ou dialogue com a turma…"/>
              <button type="button" onClick={sendMessage} disabled={busy||!chatText.trim()}
                className={button+' mt-2 w-full bg-[#a77e46] text-[#1b180e]'}>
                Enviar ao chat
              </button>
            </div>}
            {status&&<p className="p-3 text-xs text-[#b5c6aa]">Discussão encerrada após validação do mestre.</p>}
          </section>
        </aside>
      </div>
    </section>
  </div>
}
