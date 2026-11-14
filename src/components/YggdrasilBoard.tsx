import { useId, useRef, useState, type RefObject } from 'react'
import { houseColor, houseLabel, neighbors, nodes, playerColors, type HouseType } from '../game/board'

/**
 * Yggdrasil original em vetores: árvore entalhada + mapa jogável.
 * A camada de arte é puramente decorativa. A camada de casas usa
 * o mesmo grafo de 48 nós dos motores local e multiplayer.
 */
export type TreePawn = { seat: number; nodeId: number }
type Props = {
  pawns: TreePawn[]
  focusedNodeId?: number | null
  reachableIds?: readonly number[]
  onMove?: (nodeId: number) => void
  busy?: boolean
  className?: string
}

const parchment = '#f0d4a1'
const typeSymbols: Record<HouseType, string> = {
  identificacao: 'I', cotidiano: 'C', desafio: 'D', acontecimento: '±',
}
const typeNames: HouseType[] = ['identificacao', 'cotidiano', 'desafio', 'acontecimento']

function position(nodeId: number) {
  const n = nodes[nodeId]
  return { x: 450 + (n.x - 196) * 1.52, y: 980 - n.row * 58 }
}

function buildCanopy() {
  const byDepth = Array.from({ length: 7 }, () => '')
  const tips: { x: number; y: number; angle: number }[] = []
  function twig(x: number, y: number, angle: number, length: number, depth: number, seed: number) {
    const bend = Math.sin(seed * 1.87) * length * 0.16
    const xx = x + Math.sin(angle) * length
    const yy = y - Math.cos(angle) * length
    const cx = x + Math.sin(angle) * length * 0.47 + Math.cos(angle) * bend
    const cy = y - Math.cos(angle) * length * 0.51 + Math.sin(angle) * bend
    byDepth[depth] += 'M' + x.toFixed(1) + ' ' + y.toFixed(1) +
      ' Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + xx.toFixed(1) + ' ' + yy.toFixed(1) + ' '
    if (depth === 6) {
      tips.push({ x: xx, y: yy, angle })
      return
    }
    const spread = 0.32 + 0.09 * Math.sin(seed * 0.93)
    twig(xx, yy, angle - spread, length * 0.73, depth + 1, seed * 1.71 + 2)
    twig(xx, yy, angle + spread, length * 0.71, depth + 1, seed * 1.39 + 5)
  }
  for (let i = 0; i < 11; i++) {
    const angle = -1.27 + i * 0.254
    const x = 450 + Math.sin(i * 1.8) * 21
    const y = 712 + Math.cos(i * 1.3) * 31
    twig(x, y, angle, 128 - Math.abs(5 - i) * 2, 0, i + 3)
  }
  return { byDepth, tips: tips.filter((_, i) => i % 8 === 0) }
}
const canopy = buildCanopy()
const widths = [19, 13, 8.3, 5.3, 3.3, 2.1, 1.2]
const roots = [
  'M453 838 C403 893 385 941 302 968 C218 989 173 1052 126 1125',
  'M468 825 C516 884 539 935 615 967 C677 993 725 1063 775 1133',
  'M428 852 C381 932 354 1007 283 1050 C254 1070 214 1123 189 1161',
  'M477 853 C527 936 570 990 623 1045 C674 1095 669 1130 723 1171',
  'M445 856 C453 937 429 1018 460 1061 C496 1108 522 1122 538 1160',
  'M433 867 C393 926 330 975 349 1019 C367 1084 417 1125 397 1173',
  'M471 851 C513 925 580 984 551 1034 C527 1085 471 1112 481 1182',
  'M411 869 C352 908 277 943 222 934 C156 924 107 964 82 1025',
  'M489 868 C557 921 647 919 700 953 C741 974 796 1014 824 1057',
  'M456 861 C431 927 491 973 454 1017 C401 1071 369 1094 333 1171',
]
const trunk = [
  'M452 865 C391 817 412 765 456 728 C510 680 457 622 421 571',
  'M445 866 C494 806 489 760 451 720 C391 654 429 613 477 559',
  'M443 859 C416 803 472 772 490 728 C518 670 459 622 451 579',
  'M465 860 C491 790 412 765 431 711 C449 667 484 647 471 600',
  'M459 873 C397 815 372 751 422 695 C456 651 445 626 415 602',
  'M467 861 C523 813 536 751 477 697 C447 668 418 647 435 619',
]
const tracery = [
  'M441 840 C401 802 416 759 451 731 C482 704 489 678 451 638',
  'M458 842 C480 794 446 754 466 715 C498 676 434 652 431 620',
  'M478 847 C515 802 494 751 468 724 C446 690 422 670 455 631',
  'M419 841 C396 789 437 747 436 712 C421 679 457 654 469 617',
]
const outerLeaves = Array.from({ length: 32 }, (_, i) => {
  const t = -Math.PI + i * Math.PI / 31
  const x = 450 + Math.cos(t) * 394
  const y = 535 + Math.sin(t) * 404
  return { x, y, rotate: t * 180 / Math.PI + 90, long: i % 3 === 0 }
})
const flecks = Array.from({ length: 65 }, (_, i) => {
  const a = i * 2.399963
  const r = 78 + Math.sqrt(i / 65) * 272
  return { x: 450 + Math.cos(a) * r, y: 520 + Math.sin(a) * r, r: i % 7 === 0 ? 2.1 : 1.05 }
})

function NodeGlyph({ type }: { type: HouseType }) {
  const fill = houseColor[type]
  if (type === 'cotidiano') return <circle r="20" fill={fill} stroke={parchment} strokeWidth="1.6" />
  if (type === 'identificacao') return <rect x="-19" y="-19" width="38" height="38" rx="3" fill={fill} stroke={parchment} strokeWidth="1.6" />
  if (type === 'desafio') return <path d="M0 -23 L23 0 L0 23 L-23 0 Z" fill={fill} stroke={parchment} strokeWidth="1.6" />
  return <path d="M-21 -12 L0 -24 L21 -12 L21 12 L0 24 L-21 12 Z" fill={fill} stroke={parchment} strokeWidth="1.6" />
}

function TreeDrawing({ prefix, pawns, focusedNodeId, reachableIds, onMove, busy, svgRef }: Required<Pick<Props, 'pawns' | 'reachableIds' | 'busy'>> & Pick<Props, 'focusedNodeId' | 'onMove'> & { prefix: string; svgRef: RefObject<SVGSVGElement | null> }) {
  return <svg ref={svgRef} viewBox="0 0 900 1210" role="group" aria-label="Yggdrasil, árvore da descoberta com 48 casas navegáveis"
    className="block h-auto w-full select-none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id={prefix + '-vellum'} cx="48%" cy="41%" r="64%">
        <stop offset="0%" stopColor="#dec49a" /><stop offset="50%" stopColor="#b89769" />
        <stop offset="78%" stopColor="#6d5031" /><stop offset="100%" stopColor="#201a14" />
      </radialGradient>
      <radialGradient id={prefix + '-aura'} cx="50%" cy="38%" r="64%">
        <stop offset="0%" stopColor="#f4d19b" stopOpacity=".6" />
        <stop offset="75%" stopColor="#d5b782" stopOpacity=".06" />
        <stop offset="100%" stopColor="#000" stopOpacity=".2" />
      </radialGradient>
      <linearGradient id={prefix + '-wood'} x1="0%" y1="10%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#18140e" />
        <stop offset="30%" stopColor="#493b28" />
        <stop offset="58%" stopColor="#ad8c57" />
        <stop offset="78%" stopColor="#292115" />
        <stop offset="100%" stopColor="#b69662" />
      </linearGradient>
      <linearGradient id={prefix + '-gold'} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop stopColor="#8a6e41" /><stop offset=".46" stopColor="#f4dba5" />
        <stop offset="1" stopColor="#8d663c" />
      </linearGradient>
      <pattern id={prefix + '-grain'} width="17" height="17" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="4" r=".8" fill="#ebc58b" opacity=".35"/>
        <circle cx="12" cy="13" r=".6" fill="#1b1815" opacity=".32"/>
        <path d="M0 9L17 6" stroke="#241d16" strokeOpacity=".15" strokeWidth=".7"/>
      </pattern>
      <clipPath id={prefix + '-roundel'}><circle cx="450" cy="532" r="352" /></clipPath>
    </defs>

    {/* Fundo de gravura e medalhão de bronze */}
    <rect width="900" height="1210" fill="#080807" />
    <circle cx="450" cy="532" r="378" fill="none" stroke="#6d4d2b" strokeWidth="29" opacity=".48" />
    <circle cx="450" cy="532" r="378" fill="none" stroke="#c29c5e" strokeWidth="2.2" />
    <circle cx="450" cy="532" r="368" fill="none" stroke="#e7c38b" strokeWidth="1.6" />
    <circle cx="450" cy="532" r="361" fill="none" stroke="#a27b4b" strokeWidth="4" />
    <circle cx="450" cy="532" r="353" fill={'url(#' + prefix + '-vellum)'} />
    <g clipPath={'url(#' + prefix + '-roundel)'}>
      <circle cx="450" cy="532" r="355" fill={'url(#' + prefix + '-grain)'} />
      <circle cx="450" cy="500" r="352" fill={'url(#' + prefix + '-aura)'} />
      {/* Estratos da paisagem ao fundo */}
      <path d="M65 756 Q180 675 278 741 T450 732 T670 747 T835 735 L835 905 H65 Z" fill="#463828" opacity=".37" />
      <path d="M70 813 Q185 737 299 789 Q398 754 494 781 Q590 758 690 783 Q786 743 835 782 L835 908 H70 Z" fill="#221d16" opacity=".39" />
      {flecks.map((s,i)=><circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#f4d8a4" opacity={i%3===0?".55":".22"}/>)}
      {/* Copa ramificada, com ramificações recursivas de curvas Bézier */}
      {canopy.byDepth.map((d, depth) => <g key={depth} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} stroke="#100f0c" strokeWidth={widths[depth] + 3} />
        <path d={d} stroke={depth < 3 ? '#59462e' : '#352a1c'} strokeWidth={widths[depth]} />
        {depth < 4 && <path d={d} stroke="#b39762" strokeWidth={widths[depth] * .27} opacity=".75" />}
      </g>)}
      {canopy.tips.map((t,i)=><ellipse key={i} cx={t.x} cy={t.y} rx="1.5" ry="4" transform={'rotate('+(t.angle*180/Math.PI)+' '+t.x+' '+t.y+')'} fill="#665034" opacity=".8"/>)}
      {/* Tronco torcido, com fios de corte e textura */}
      {trunk.map((d,i)=><g key={i} fill="none" strokeLinecap="round">
        <path d={d} stroke="#17120d" strokeWidth={42-i%3*4} />
        <path d={d} stroke={'url(#' + prefix + '-wood)'} strokeWidth={34-i%3*4} />
        <path d={d} stroke="#d3ad71" strokeWidth={2.3+i%2} opacity=".7" />
      </g>)}
      {tracery.map((d,i)=><path key={i} d={d} stroke="#1a1710" strokeWidth="5.5" fill="none" opacity=".67" />)}
      <path d="M420 842 Q450 878 480 841" fill="none" stroke="#d9b985" strokeWidth="5" opacity=".76" />
    </g>

    {/* Raízes transbordam do medalhão, como na referência */}
    {roots.map((d,i)=><g key={i} fill="none" strokeLinecap="round">
      <path d={d} stroke="#0b0c0a" strokeWidth={18-i%3*2} />
      <path d={d} stroke={'url(#' + prefix + '-wood)'} strokeWidth={12-i%3*2} />
      <path d={d} stroke="#dfbb7d" strokeWidth="1.5" opacity=".72" />
    </g>)}
    {Array.from({length:20},(_,i)=>{
      const x=85+i*38
      const y=1046+Math.sin(i*1.83)*39
      return <path key={i} d={'M'+(450+(i-10)*12)+' 964 Q'+x+' '+(y-45)+' '+x+' '+y+' Q'+(x+Math.cos(i)*22)+' '+(y+35)+' '+(x+Math.sin(i)*34)+' '+(y+75)}
        fill="none" stroke="#967a4f" strokeWidth={i%4===0?2:1} opacity=".6"/>
    })}
    {/* Nó da matéria: quatro laços metálicos entrelaçados */}
    <g fill="none" stroke={'url(#' + prefix + '-gold)'} strokeWidth="4" opacity=".88">
      {[0,45,90,135].map(a=><ellipse key={a} cx="450" cy="1045" rx="113" ry="45" transform={'rotate('+a+' 450 1045)'} />)}
      <circle cx="450" cy="1045" r="69" strokeWidth="2"/>
      <circle cx="450" cy="1045" r="91" strokeWidth="1" strokeDasharray="3 9" />
    </g>
    <circle cx="450" cy="1045" r="14" fill="#11110c" stroke="#e6c890" strokeWidth="3"/>
    <path d="M450 1033 L461 1040 L461 1052 L450 1059 L439 1052 L439 1040 Z" fill="none" stroke="#e5bd77" strokeWidth="2"/>

    {/* Grinalda e inscrições ornamentais */}
    {outerLeaves.map((l,i)=><g key={i} transform={'translate('+l.x+' '+l.y+') rotate('+l.rotate+')'} fill="none" stroke="#a78a59" opacity={i%2===0?".9":".6"}>
      <path d={l.long?'M0 0 Q-12 -12 0 -28 Q10 -12 0 0 Z':'M0 0 Q-8 -8 0 -18 Q8 -9 0 0 Z'} fill="#8b6e47" fillOpacity=".35" strokeWidth="1.4"/>
      <path d="M0 0 L0 -23" strokeWidth=".9"/>
    </g>)}
    {Array.from({length:90},(_,i)=>{
      const a=2*Math.PI*i/90
      return <circle key={i} cx={450+365*Math.cos(a)} cy={532+365*Math.sin(a)} r={i%5===0?2.4:1.1} fill="#e7ca91" opacity=".65"/>
    })}
    <g transform="translate(450 116)">
      <circle r="43" fill="#0a0b09" stroke="#caa66c" strokeWidth="3"/>
      <circle r="35" fill="none" stroke="#e2c58b" strokeWidth="1" strokeDasharray="2 6"/>
      <path d="M-11 -19 V-7 L-21 15 Q-24 23 -16 23 H16 Q24 23 21 15 L11 -7 V-19 M-14 -19 H14" stroke="#edc889" strokeWidth="2.8" fill="none"/>
      <path d="M-18 13 Q0 5 18 13 L15 20 H-15 Z" fill="#c69b55"/>
      <circle cx="-5" cy="6" r="2.7" fill="#f8da9e"/><circle cx="6" cy="13" r="2.2" fill="#f8da9e"/>
    </g>
    <g transform="translate(90 150)" stroke="#d7b577" fill="none" strokeWidth="2.5">
      <path d="M12 -20 A26 26 0 1 0 12 20 A20 20 0 1 1 12 -20Z" fill="#b18b54" fillOpacity=".5"/>
      <circle cx="48" cy="-14" r="2" fill="#d7b577" />
    </g>
    <g transform="translate(809 147)" stroke="#d7b577" fill="none" strokeWidth="2">
      <ellipse rx="26" ry="11" transform="rotate(60)"/>
      <ellipse rx="26" ry="11" transform="rotate(-60)"/>
      <ellipse rx="26" ry="11"/>
      <circle r="4" fill="#d7b577"/>
    </g>
    <text x="450" y="48" textAnchor="middle" fill="#e7c994" fontSize="30" fontFamily="Georgia,serif" letterSpacing="8">YGGDRASIL</text>
    <text x="450" y="80" textAnchor="middle" fill="#a88b60" fontSize="12" letterSpacing="6">ÁRVORE DA DESCOBERTA</text>
    <g transform="translate(450 1174)">
      <path d="M-260 -33 Q0 -50 260 -33 L248 29 Q0 39 -248 29 Z" fill="#100f0b" stroke="#bc975b" strokeWidth="2.4"/>
      <path d="M-238 -23 H238 M-235 20 H235" stroke="#745c3b" strokeWidth="1" fill="none"/>
      <text x="0" y="8" fontFamily="Georgia,serif" fontSize="26" letterSpacing="4" fill="#f0d5a2" textAnchor="middle">RAÍZES DA MATÉRIA</text>
    </g>

    {/* Grafo de movimento: conectado aos mesmos nós do motor do jogo */}
    <g aria-hidden="true" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {nodes.flatMap(n => neighbors(n.id).filter(next => next > n.id).map(next => {
        const from=position(n.id), to=position(next)
        const midX=(from.x+to.x)/2
        const midY=(from.y+to.y)/2 - (n.row===nodes[next].row?11:0)
        const d='M'+from.x+' '+from.y+' Q'+midX+' '+midY+' '+to.x+' '+to.y
        return <g key={n.id+'-'+next}>
          <path d={d} stroke="#100e0a" strokeWidth="10" opacity=".86"/>
          <path d={d} stroke="#f8d28c" strokeWidth="2.3" opacity=".93"/>
          <path d={d} stroke="#77572c" strokeWidth=".8" strokeDasharray="3 9"/>
        </g>
      }))}
    </g>

    {nodes.map(n=>{
      const p=position(n.id)
      const selectable=reachableIds.includes(n.id) && !busy && !!onMove
      const focused=focusedNodeId===n.id
      const occupants=pawns.filter(pawn=>pawn.nodeId===n.id)
      return <g key={n.id}
        role="button" tabIndex={selectable?0:-1}
        aria-label={'Casa '+(n.id+1)+': '+houseLabel[n.type]+(selectable?', movimento disponível':'')}
        aria-disabled={!selectable}
        onClick={()=> { if(selectable) onMove?.(n.id) }}
        onKeyDown={event=> {
          if(selectable && (event.key==='Enter'||event.key===' ')){
            event.preventDefault()
            onMove?.(n.id)
          }
        }}
        className={selectable?'cursor-pointer focus:outline-none':'cursor-default'}
        transform={'translate('+p.x+' '+p.y+')'}>
        <title>{'Casa '+(n.id+1)+' — '+houseLabel[n.type]}</title>
        {/* Área de toque maior que o marcador visível */}
        <circle r="34" fill="#000" fillOpacity=".001" />
        {selectable && <circle r="32" fill="#f5d691" fillOpacity=".22" stroke="#fff5b2" strokeWidth="3.3"
          strokeDasharray="5 4" className="motion-safe:animate-pulse" />}
        <circle r="25" fill="#17150f" stroke={focused?'#fff6bf':'#c6a269'} strokeWidth={focused?4:2.2}/>
        <NodeGlyph type={n.type}/>
        <text textAnchor="middle" y="6" fontSize="17" fill="white" fontWeight="800"
          stroke="#171410" strokeWidth=".6" paintOrder="stroke">{typeSymbols[n.type]}</text>
        {occupants.map((pawn,i)=>{
          const a=(-Math.PI/2)+(i*Math.PI/2)
          const x=Math.cos(a)*26
          const y=Math.sin(a)*26
          return <g key={pawn.seat} transform={'translate('+x+' '+y+')'}>
            <circle r="11" fill={playerColors[pawn.seat-1]??'#fff'} stroke="#15130d" strokeWidth="2.6"/>
            <text y="4" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#13110d">{pawn.seat}</text>
          </g>
        })}
      </g>
    })}
  </svg>
}

export default function YggdrasilBoard({ pawns, focusedNodeId=null, reachableIds=[], onMove, busy=false, className='' }: Props) {
  const [expanded,setExpanded] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const prefix=useId().replace(/:/g,'')

  function exportSvg() {
    if (!svgRef.current) return
    const cloned = svgRef.current.cloneNode(true) as SVGSVGElement
    cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    cloned.removeAttribute('class')
    cloned.querySelectorAll('[role="button"]').forEach(node => {
      node.removeAttribute('tabindex')
      node.removeAttribute('role')
      node.removeAttribute('aria-disabled')
      node.removeAttribute('class')
    })
    const content = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      new XMLSerializer().serializeToString(cloned)
    const url = URL.createObjectURL(new Blob([content], { type: 'image/svg+xml;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'raizes-da-materia-yggdrasil.svg'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return <div className={'w-full rounded-2xl border border-[#876b45]/45 bg-[#080807] text-[#f4dfb9] shadow-[inset_0_0_80px_rgba(139,100,50,0.17)] '+className}>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#8a6a43]/35 px-3 py-3 sm:px-5">
      <div>
        <p className="font-serif text-base tracking-[.14em] text-[#e7ca91] sm:text-lg">A Árvore dos Elementos</p>
        <p className="text-xs text-[#bcac8e]">Gravura vetorial interativa · 48 casas</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={()=>setExpanded(old=>!old)}
          aria-pressed={expanded}
          className="min-h-11 rounded-lg border border-[#c59d5c]/60 px-3 text-sm font-semibold text-[#f2d49d] hover:bg-[#3d3020] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fae4b4]">
          {expanded?'Ajustar mapa':'Ampliar mapa'}
        </button>
        <button type="button" onClick={exportSvg}
          className="min-h-11 rounded-lg border border-[#c59d5c]/60 px-3 text-sm font-semibold text-[#f2d49d] hover:bg-[#3d3020] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fae4b4]">
          Exportar SVG
        </button>
      </div>
    </div>
    <div className="overflow-x-auto overscroll-x-contain">
      <div className={'mx-auto '+(expanded?'min-w-[840px] max-w-[960px]':'min-w-[600px] max-w-[850px] sm:min-w-0')}>
        <TreeDrawing prefix={prefix} svgRef={svgRef} pawns={pawns} focusedNodeId={focusedNodeId}
          reachableIds={reachableIds} onMove={onMove} busy={busy}/>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2 border-t border-[#8a6a43]/35 p-3 sm:grid-cols-4 sm:px-5">
      {typeNames.map(type=><div key={type} className="flex min-h-10 items-center gap-2 rounded-lg border border-[#886b47]/20 bg-[#241d14] px-2 py-2 text-xs">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md font-bold text-white"
          style={{backgroundColor:houseColor[type]}}>{typeSymbols[type]}</span>
        <span>{houseLabel[type]}</span>
      </div>)}
    </div>
    <p className="px-3 pb-3 text-xs text-[#b9a98a] sm:px-5">Linhas douradas indicam conexões. Casas com halo luminoso podem ser escolhidas neste turno. No celular, deslize lateralmente para explorar o tabuleiro.</p>
  </div>
}
