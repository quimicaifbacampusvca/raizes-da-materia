import { test, expect, type Page } from '@playwright/test'

const masterId = '11111111-1111-4111-8111-111111111111'
const playerId = '22222222-2222-4222-8222-222222222222'
const roomId = '33333333-3333-4333-8333-333333333333'
const screens = [
  { name:'celular-320', width:320, height:640 },
  { name:'celular-360', width:360, height:740 },
  { name:'celular-390', width:390, height:844 },
  { name:'celular-428', width:428, height:926 },
  { name:'paisagem-667', width:667, height:375 },
  { name:'tablet-768', width:768, height:1024 },
  { name:'tablet-horizontal-1024', width:1024, height:768 },
  { name:'desktop-1440', width:1440, height:900 },
  { name:'desktop-wide-1920', width:1920, height:1080 },
] as const

const user = {
  id:masterId, aud:'authenticated', role:'authenticated',
  email:'', is_anonymous:true,
  app_metadata:{provider:'anonymous',providers:['anonymous']},
  user_metadata:{}, identities:[],
  created_at:'2026-01-01T00:00:00.000Z',
}

async function mockBackend(page:Page, loadRoom:boolean){
  if(loadRoom){
    await page.addInitScript((id:string)=>{
      sessionStorage.setItem('raizes-room-id',id)
    }, roomId)
  }
  const header=Buffer.from(JSON.stringify({alg:'none',typ:'JWT'})).toString('base64url')
  const payload=Buffer.from(JSON.stringify({sub:masterId,role:'authenticated',aud:'authenticated',exp:4070908800})).toString('base64url')
  const token=header+'.'+payload+'.mock'

  await page.route('https://mock.supabase.co/**', async route => {
    const url=new URL(route.request().url())
    const path=url.pathname
    let response:unknown={}
    let status=200

    if(path.includes('/auth/v1/signup')||path.includes('/auth/v1/token')){
      response={access_token:token,refresh_token:'mock-refresh',token_type:'bearer',expires_in:3600,user}
    }else if(path.includes('/auth/v1/user')){
      response=user
    }else if(path.includes('/rest/v1/game_rooms')){
      response={
        id:roomId,code:'1A2B3C4D5E',name:'Expedição dos Metais',host_id:masterId,
        phase:'ready',current_seat:1,die_roll:null,remaining_steps:0,
        award_used:false,revision:3,
      }
    }else if(path.includes('/rest/v1/game_players')){
      response=[
        {user_id:playerId,seat:1,nickname:'Jogador A',node_id:0,active:true},
      ]
    }else if(path.includes('/rest/v1/game_claims')){
      response=[]
    }else if(path.includes('/rest/v1/rpc/game_close_room')){
      response=true
    }else if(path.includes('/rest/v1/')){
      response=null
    }else{
      status=404
      response={message:'API não mockada: '+path}
    }
    await route.fulfill({
      status,contentType:'application/json',
      headers:{'access-control-allow-origin':'*','content-range':'0-0/1'},
      body:JSON.stringify(response),
    })
  })
}

async function assertNoOverflow(page:Page, width:number){
  const metrics=await page.evaluate(()=>{
    const html=document.documentElement
    return {
      viewport:html.clientWidth,
      document:html.scrollWidth,
      body:document.body.scrollWidth,
    }
  })
  expect(metrics.viewport).toBe(width)
  expect(metrics.document, 'O documento não pode criar rolagem horizontal global').toBeLessThanOrEqual(width+2)
  expect(metrics.body, 'O corpo não pode criar rolagem horizontal global').toBeLessThanOrEqual(width+2)
}

for(const viewport of screens){
  test('entrada responsiva • '+viewport.name, async({page})=>{
    await page.setViewportSize({width:viewport.width,height:viewport.height})
    await mockBackend(page,false)
    await page.goto('./')
    await expect(page.getByRole('heading',{name:'Raízes da Matéria'})).toBeVisible()
    await expect(page.getByRole('button',{name:'Criar sala multiplayer'})).toBeVisible()
    await expect(page.getByRole('button',{name:'Entrar na sala'})).toBeVisible()
    await expect(page.getByText('Demonstração local',{exact:true})).toHaveCount(0)
    await assertNoOverflow(page,viewport.width)
  })

  test('mapa, doca e saída • '+viewport.name, async({page})=>{
    await page.setViewportSize({width:viewport.width,height:viewport.height})
    await mockBackend(page,true)
    await page.goto('./')
    await expect(page.getByRole('button',{name:/Sair da sala/})).toBeVisible()
    await expect(page.getByRole('navigation',{name:'Doca de navegação'})).toBeVisible()
    await expect(page.getByRole('group',{name:/Yggdrasil/})).toBeVisible()
    await assertNoOverflow(page,viewport.width)

    await page.getByRole('button',{name:/Jogadores/}).click()
    await expect(page.getByRole('region',{name:/Painel flutuante: Participantes/})).toBeVisible()
    await assertNoOverflow(page,viewport.width)

    await page.getByRole('button',{name:/Ações/}).click()
    await expect(page.getByText('Dado da Árvore')).toBeVisible()
    await assertNoOverflow(page,viewport.width)

    await page.getByRole('button',{name:/Sair da sala/}).click()
    await expect(page.getByRole('dialog',{name:'Encerrar sala?'})).toBeVisible()
    await page.getByRole('button',{name:'Cancelar'}).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await assertNoOverflow(page,viewport.width)

    // Sair deve executar a RPC de encerramento e voltar à tela de ingresso.
    await page.getByRole('button',{name:/Sair da sala/}).click()
    await page.getByRole('button',{name:'Encerrar para todos'}).click()
    await expect(page.getByRole('button',{name:'Criar sala multiplayer'})).toBeVisible()
    await assertNoOverflow(page,viewport.width)
  })
}

test('rotas da árvore são orgânicas, sem grade retangular',async({page})=>{
  await page.setViewportSize({width:390,height:844})
  await mockBackend(page,true)
  await page.goto('./')
  await expect(page.getByRole('group',{name:/Yggdrasil/})).toBeVisible()
  const board=page.getByRole('group',{name:/Yggdrasil/})
  await expect(board.locator('[role="button"]')).toHaveCount(48)
  await expect(board.locator('path[stroke="#f8d28c"]')).toHaveCount(0)
  await expect(board.locator('path[stroke="#090a08"]')).not.toHaveCount(0)
})


test('casas intermediárias se distribuem por galhos orgânicos sem sobreposição',async({page})=>{
  await page.setViewportSize({width:390,height:844})
  await mockBackend(page,true)
  await page.goto('./')
  const drawing=page.getByRole('group',{name:/Yggdrasil/})
  await expect(drawing).toBeVisible()
  const points=await drawing.locator('[data-node-id]').evaluateAll((elements)=>{
    return elements.filter(el=>{
      const id=Number(el.getAttribute('data-node-id'))
      return id>=24&&id<=35
    }).map(el=>{
      const id=Number(el.getAttribute('data-node-id'))
      const transform=el.getAttribute('transform')??''
      const [x,y]=transform.replace('translate(','').replace(')','').split(' ').map(Number)
      return {id,x,y}
    })
  })
  expect(points).toHaveLength(12)
  expect(points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))).toBeTruthy()
  for(let i=0;i<points.length;i++){
    for(let j=i+1;j<points.length;j++){
      const distance=Math.hypot(points[i].x-points[j].x,points[i].y-points[j].y)
      expect(distance,'Casas '+points[i].id+' e '+points[j].id+' não devem se sobrepor').toBeGreaterThan(55)
    }
  }
  // Não pode ser uma grade com 12 casas em fileiras de alturas iguais.
  expect(new Set(points.map(p=>p.y)).size).toBeGreaterThanOrEqual(10)
  await expect(drawing.locator('[data-branch-kind="intermediario"]')).toHaveCount(12)
  await expect(drawing.locator('[data-node-id]')).toHaveCount(48)
  await assertNoOverflow(page,390)
})

test('capturas dos galhos intermediários para revisão da arte',async({page},testInfo)=>{
  await page.setViewportSize({width:390,height:844})
  await mockBackend(page,true)
  await page.goto('./')
  await expect(page.getByRole('group',{name:/Yggdrasil/})).toBeVisible()
  const viewport=page.getByRole('region',{name:/Área navegável da árvore/})
  await viewport.evaluate(el=>{el.scrollTop=285})
  await page.screenshot({path:testInfo.outputPath('yggdrasil-galhos-mobile.png')})
  await page.setViewportSize({width:1440,height:900})
  await page.screenshot({path:testInfo.outputPath('yggdrasil-galhos-desktop.png'),fullPage:true})
})
