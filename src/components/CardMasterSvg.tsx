import { useId } from 'react'

/**
 * MATRIZ ÚNICA: a mesma arte SVG é exibida na partida e na folha impressa.
 * Formato físico: 75 × 105 mm, proporção 5:7, sem dependência de CSS externo.
 * NÃO representar configurações de mãos sem validação por especialista de Libras.
 */
export type CardCategory = 'identificacao'|'cotidiano'|'desafio'|'acontecimento'
export type MasterCard = {
  id:string
  category:CardCategory
  title:string
  prompt:string
  mode:'choice'|'text'
  options:string[]
  symbol:string|null
  instructions:string
}
export type ValidatedSign = {
  src:string
  validationReference:string
  approved:boolean
}
export const CARD_SIZE_MM = { width:75, height:105 } as const

const palettes:Record<CardCategory,{ink:string;highlight:string;title:string;sigil:string}> = {
  identificacao:{ink:'#574379',highlight:'#b8a0de',title:'IDENTIFICAÇÃO',sigil:'◈'},
  cotidiano:{ink:'#29656b',highlight:'#a9d5cf',title:'COTIDIANO',sigil:'✥'},
  desafio:{ink:'#8c5b31',highlight:'#ecc894',title:'DESAFIO QUÍMICO',sigil:'◆'},
  acontecimento:{ink:'#714b42',highlight:'#e0b6a1',title:'ACONTECIMENTO',sigil:'✦'},
}
function wrapText(text:string,maxChars:number,maxLines=6):string[]{
  const words=text.trim().split(/\s+/)
  const lines:string[]=[]
  let current=''
  for(const word of words){
    if((current+' '+word).trim().length<=maxChars)current=(current+' '+word).trim()
    else{if(current)lines.push(current);current=word}
  }
  if(current)lines.push(current)
  if(lines.length<=maxLines)return lines
  const clipped=lines.slice(0,maxLines)
  clipped[maxLines-1]=clipped[maxLines-1].replace(/[.,;:\s]+$/,'')+'…'
  return clipped
}
function TreeMark({bright=false}:{bright?:boolean}){
  const c=bright?'#eccd8f':'#8c633a'
  return <g fill="none" stroke={c} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M0 52 C-12 0 10 -28 0 -85 M0 52 C20 10 -14 -23 0 -80"/>
    <path d="M0 -48 C-23 -85 -71 -74 -94 -115 M1 -48 C20 -87 68 -74 95 -120"/>
    <path d="M-24 -79 C-30 -120 -66 -135 -80 -152 M34 -82 C39 -115 74 -135 88 -147"/>
    <path d="M-12 -11 C-41 -45 -90 -25 -114 -55 M15 -14 C43 -43 88 -35 111 -65"/>
    <path d="M0 52 C-48 72 -82 65 -114 99 M0 52 C53 73 78 78 116 107"/>
    <path d="M0 52 C-30 96 -59 112 -94 141 M0 52 C34 90 74 123 96 147"/>
    <path d="M0 52 C-8 91 16 105 0 148"/>
  </g>
}
type Props={
  card:MasterCard
  side?:'front'|'back'
  selectedOption?:number|null
  sign?:ValidatedSign
  className?:string
}

export default function CardMasterSvg({card,side='front',selectedOption=null,sign,className=''}:Props){
  const uid=useId().replaceAll(':','')
  const paper=uid+'-paper'
  const bronze=uid+'-bronze'
  const isBack=side==='back'
  const theme=palettes[card.category]
  const promptSize=card.prompt.length>155?22:card.prompt.length>100?25:29
  const promptLines=wrapText(card.prompt,promptSize===22?58:promptSize===25?49:43,5)
  const titleSize=card.title.length>32?28:card.title.length>24?34:42
  const letters=card.symbol?.toUpperCase().split('').join('  ·  ')??null
  const hasVerifiedSign=!!sign?.approved&&!!sign.validationReference&&!!sign.src

  return <svg viewBox="0 0 750 1050" width="750" height="1050"
    xmlns="http://www.w3.org/2000/svg" role="img"
    aria-label={(isBack?'Verso':'Frente')+' da carta '+card.title}
    data-card-master={card.id} data-card-side={side}
    className={'block h-full w-full '+className}>
    <defs>
      <linearGradient id={paper} x1="0%" y1="0%" x2="95%" y2="100%">
        <stop stopColor="#efe0c0"/><stop offset=".53" stopColor="#e3c99c"/>
        <stop offset="1" stopColor="#c59c66"/>
      </linearGradient>
      <linearGradient id={bronze} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop stopColor="#88643d"/><stop offset=".35" stopColor="#eacf91"/>
        <stop offset=".7" stopColor="#a47b42"/><stop offset="1" stopColor="#f4dea9"/>
      </linearGradient>
      <pattern id={uid+'-dots'} width="21" height="21" patternUnits="userSpaceOnUse">
        <circle cx="4" cy="7" r="1.1" fill="#513a23" opacity=".18"/>
        <circle cx="18" cy="17" r=".8" fill="#f8eccd" opacity=".55"/>
      </pattern>
      <clipPath id={uid+'-illustration-clip'}>
        <rect x="76" y="188" width="598" height="245" rx="12"/>
      </clipPath>
    </defs>
    <rect width="750" height="1050" fill="#10231c"/>
    <rect x="12" y="12" width="726" height="1026" rx="27"
      stroke={'url(#'+bronze+')'} strokeWidth="9" fill="#121b14"/>
    <rect x="29" y="29" width="692" height="992" rx="15"
      stroke="#b38a51" strokeWidth="2" fill={'url(#'+paper+')'}/>
    <rect x="34" y="34" width="682" height="982" rx="12" fill={'url(#'+uid+'-dots)'} opacity=".55"/>
    <path d="M75 32 H675 M75 1019 H675" stroke="#5f452a" strokeWidth="2" opacity=".6"/>
    {[
      [59,59,1,1],[691,59,-1,1],[59,991,1,-1],[691,991,-1,-1],
    ].map(([x,y,sx,sy],i)=>
      <g key={i} transform={'translate('+x+' '+y+') scale('+sx+' '+sy+')'} fill="none" stroke="#6e4c2c" strokeWidth="3">
        <path d="M0 35 Q0 0 35 0 M0 20 Q0 7 17 7 M20 0 Q11 12 20 19"/>
      </g>)}

    {isBack?<>
      <rect x="68" y="108" width="614" height="821" rx="26" fill="#12271e" stroke="#8e7145" strokeWidth="5"/>
      <rect x="84" y="124" width="582" height="789" rx="19" fill="none" stroke="#b59157" strokeWidth="2"/>
      <ellipse cx="375" cy="502" rx="242" ry="296" fill="#2c3e30" stroke="#b38c53" strokeWidth="5"/>
      <ellipse cx="375" cy="502" rx="226" ry="280" fill="none" stroke="#e1c18b" strokeWidth="2" strokeDasharray="3 11"/>
      <g transform="translate(375 510) scale(1.68)"><TreeMark bright/></g>
      <circle cx="375" cy="511" r="57" fill="#182b22" stroke="#e8c78a" strokeWidth="4"/>
      <g transform="translate(375 511)" fill="none" stroke="#eccf96" strokeWidth="4">
        <ellipse rx="38" ry="17" transform="rotate(0)"/>
        <ellipse rx="38" ry="17" transform="rotate(60)"/>
        <ellipse rx="38" ry="17" transform="rotate(120)"/>
        <circle r="6" fill="#eccf96"/>
      </g>
      <text x="375" y="166" textAnchor="middle" fontSize="32" fontFamily="Georgia,serif"
        fill="#f7dba8" letterSpacing="7">YGGDRASIL</text>
      <text x="375" y="848" textAnchor="middle" fontSize="38" fontFamily="Georgia,serif"
        fontWeight="bold" fill="#f3d49c" letterSpacing="3">RAÍZES DA MATÉRIA</text>
      <text x="375" y="889" textAnchor="middle" fontSize="20" fill="#e0bd7d"
        letterSpacing="5">QUÍMICA · LIBRAS · DESCOBERTA</text>
      <text x="375" y="983" textAnchor="middle" fontSize="19" fontWeight="bold"
        fill="#382a18" letterSpacing="3">BARALHO DE INVESTIGAÇÃO</text>
    </>:<>
      <rect x="66" y="52" width="618" height="58" rx="12" fill={theme.ink}/>
      <path d="M90 81 H166 M584 81 H660" stroke={theme.highlight} strokeWidth="2"/>
      <text x="375" y="90" textAnchor="middle" fontSize="25"
        fontWeight="bold" letterSpacing="3.5" fill="#fdf1d2">{theme.title}</text>
      <text x="375" y="161" textAnchor="middle" fontSize={titleSize} fontFamily="Georgia,serif"
        fontWeight="bold" fill="#271f16">{card.title}</text>

      <g clipPath={'url(#'+uid+'-illustration-clip)'}>
        <rect x="76" y="188" width="598" height="245" fill="#304336"/>
        <ellipse cx="375" cy="325" rx="204" ry="103" fill="#6e7954" opacity=".26"/>
        <path d="M76 408 Q230 342 330 397 Q480 341 674 403 L674 433 H76Z" fill="#182a23" opacity=".85"/>
        <g transform="translate(375 328) scale(1.20)"><TreeMark bright/></g>
        <g fill="none" stroke={theme.highlight} strokeWidth="3.6">
          <ellipse cx="375" cy="322" rx="143" ry="56" transform="rotate(32 375 322)"/>
          <ellipse cx="375" cy="322" rx="143" ry="56" transform="rotate(-32 375 322)"/>
          <ellipse cx="375" cy="322" rx="150" ry="56" transform="rotate(90 375 322)" opacity=".6"/>
        </g>
        <circle cx="375" cy="322" r="72" fill="#1d2b21" stroke={'url(#'+bronze+')'} strokeWidth="8"/>
        {card.symbol?
          <text x="375" y="342" fontFamily="Georgia,serif" textAnchor="middle" fontSize="73"
            fontWeight="bold" fill="#f7ddb0">{card.symbol}</text>:
          <text x="375" y="345" textAnchor="middle" fontFamily="Georgia,serif"
            fontSize="80" fill="#f4d39d">{theme.sigil}</text>}
        <circle cx="249" cy="270" r="9" fill={theme.highlight}/>
        <circle cx="508" cy="388" r="9" fill={theme.highlight}/>
      </g>
      <rect x="76" y="188" width="598" height="245" rx="12"
        stroke="#aa8754" strokeWidth="4" fill="none"/>
      <path d="M90 413 H660" stroke="#d3b580" strokeWidth="2" opacity=".6"/>

      <rect x="76" y="451" width="598" height="158" rx="13"
        fill="#f3e4c2" stroke="#8f6d44" strokeWidth="3"/>
      <rect x="90" y="462" width="570" height="30" rx="6" fill="#5a4b39"/>
      <text x="375" y="484" textAnchor="middle" fill="#fff0cb"
        fontSize="19" fontWeight="bold" letterSpacing="3.2">ÁREA DE LIBRAS</text>
      {hasVerifiedSign?
        <image href={sign.src} x="253" y="497" width="244" height="102"
          preserveAspectRatio="xMidYMid meet"/>:
        <>
          <text x="375" y="535" textAnchor="middle" fontSize={letters?33:25}
            fontFamily="Georgia,serif" fontWeight="bold" fill="#413025">
            {letters??'MEDIAÇÃO EM LIBRAS'}
          </text>
          <text x="375" y="574" textAnchor="middle" fontSize="17" fill="#6b4e2c">
            {letters?'Letras para datilologia · não representa sinais':
              'Representação linguística ainda não homologada'}
          </text>
        </>}
      <text x="375" y="599" textAnchor="middle" fontSize="13"
        fill="#825e36">INSERIR ARTE DE LIBRAS SOMENTE APÓS VALIDAÇÃO</text>

      <rect x="76" y="625" width="598" height="146" rx="11" fill="#f5e9cc"
        stroke="#a38351" strokeWidth="3"/>
      <text x="95" y="651" fontSize="17" fill={theme.ink} fontWeight="bold"
        letterSpacing="2.4">INVESTIGAÇÃO</text>
      <text x="95" y="687" fontSize={promptSize} fontFamily="Georgia,serif"
        fontWeight="bold" fill="#282118">
        {promptLines.map((line,i)=><tspan key={i} x="95"
          dy={i===0?0:(promptSize===22?26:30)}>{i===0?'':' '}{line}</tspan>)}
      </text>

      {card.mode==='choice'&&card.options.length>=4?
        card.options.slice(0,4).map((option,i)=>{
          const y=783+i*52
          const lines=wrapText(option,option.length>40?46:49,2)
          const font=option.length>48?17:option.length>34?19:23
          return <g key={i} data-card-option={i}>
            <rect x="77" y={y} width="596" height="47" rx="9"
              fill={selectedOption===i?'#edd2a1':'#f5e5c3'}
              stroke={selectedOption===i?theme.ink:'#b39768'}
              strokeWidth={selectedOption===i?5:2.4}/>
            <circle cx="106" cy={y+23.5} r="17" fill={theme.ink}/>
            <text x="106" y={y+30} textAnchor="middle" fontSize="20"
              fontWeight="bold" fill="#fff1d5">{String.fromCharCode(65+i)}</text>
            <text x="134" y={y+(lines.length>1?19:31)} fontSize={font}
              fill="#251d15" fontWeight="bold">
              {lines.map((line,j)=><tspan key={j} x="134" dy={j===0?0:20}>
                {j===0?'':' '}{line}
              </tspan>)}
            </text>
          </g>
        }):
        <g>
          <rect x="77" y="783" width="596" height="198" rx="10"
            fill="#f5e5c3" stroke="#b39768" strokeWidth="2.4"/>
          <text x="105" y="818" fontSize="23" fontFamily="Georgia,serif"
            fontWeight="bold" fill="#503c26">RESPOSTA ABERTA</text>
          {[850,892,934].map(y=><path key={y} d={'M105 '+y+' H644'}
            stroke="#bda177" strokeWidth="2" strokeDasharray="4 6"/>)}
          <text x="375" y="968" fontSize="16" textAnchor="middle" fill="#5d4631">
            Responda por texto ou Libras mediada pelo mestre.
          </text>
        </g>}
      <text x="375" y="1020" textAnchor="middle" fontSize="17"
        fill="#dfc28d" fontWeight="bold" letterSpacing="1.5">
        {card.id.toUpperCase()} · RAÍZES DA MATÉRIA
      </text>
    </>}
  </svg>
}
