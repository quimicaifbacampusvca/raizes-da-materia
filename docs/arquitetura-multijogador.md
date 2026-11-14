# Arquitetura multiplayer — Raízes da Matéria

## Objetivo
O celular é a plataforma principal. O mestre e 1–4 jogadores acessam o mesmo endereço público do GitHub Pages; um projetor/TV pode oferecer visão geral. O jogo físico será uma segunda edição dos mesmos componentes.

## Decisão tecnológica
- Interface: React, TypeScript, Tailwind CSS e SVG, gerados com Vite.
- Hospedagem estática: GitHub Pages (`https://quimicaifbacampusvca.github.io/raizes-da-materia/` quando o Pages for habilitado).
- Backend: Supabase Auth + PostgreSQL + Realtime + funções seguras de aplicação (Postgres RPC ou Edge Functions).
- Presença: Supabase Realtime Presence.
- Eventos instantâneos: Broadcast; mudanças persistentes guardadas no Postgres, nunca exclusivamente em mensagens efêmeras.
- Leitura offline e futura PWA são objetivos separados; multiplayer sincronizado requer rede.

## Fluxo de uma sala
1. Mestre entra, cria sala e recebe código/QR de convite.
2. Participante escolhe um apelido, entra na sala e recebe um identificador de jogador e uma cor/símbolo.
3. O mestre inicia a partida, sorteia os desafios e controla o ritmo.
4. O jogador da vez lança o dado e move o peão conforme as conexões permitidas.
5. O mestre mostra o desafio em Libras. As respostas e dicas restritas NÃO são enviadas antecipadamente aos clientes dos jogadores.
6. Um acerto validado pelo servidor registra a carta conquistada e o domínio na Tabela Periódica.
7. Todos os aparelhos recebem atualização de estado; o banco mantém o histórico para reconexão.
8. A vitória depende da coleção completa de família ou período e da narrativa final.

## Segurança e privacidade
- Preferir Supabase Auth com acesso anônimo por aparelho; não exigir e-mail para entrar.
- A identificação do mestre deve estar vinculada ao usuário autenticado criador da sala, e não somente a um campo enviado pelo navegador.
- Isolar dados por sala usando RLS e autorização de canais Realtime; verificar participantes em todas as ações.
- Ações críticas (movimento, turno, domínio, transferência, vitória e sorteio) devem ser atômicas e validadas no servidor. Nenhum cliente modifica livremente o estado da sala.
- Guardar gabaritos de cartas em tabelas privadas acessíveis apenas ao mestre autorizado / lógica de servidor. Não incluir respostas reservadas no bundle público.
- Código curto exige expiração, limite de tentativas e proteção contra enumeração; o QR pode carregar convite longo de uso limitado.
- Nunca colocar chave secreta (service/secret) nos arquivos de front-end ou em variáveis VITE_*. A chave Supabase publishable é pública, com proteção feita por políticas de acesso.
- Pseudônimos e dados mínimos; não gravar vídeo/áudio dos alunos por padrão.

## Tabelas propostas
- `rooms` — dono, fase, convite e configuração
- `participants` — identidade, apelido, papel, cor/símbolo
- `turns` — jogador atual, dado, passos, estado
- `claims` — casa/elemento, proprietário e histórico
- `movements` — caminho percorrido e auditoria
- `challenges` e `challenge_answers_private` — enunciados públicos e respostas restritas
- `event_log` — acontecimentos persistentes para reconstruir a partida

## Modos de operação
1. **Demonstração local**: funcional sem backend, para prototipar percursos e composição da Tabela Periódica. Não afirma ser multiplayer.
2. **Sala online**: ativar somente após configurar projeto Supabase, migrações SQL, RLS e serviços de partida.
3. **Futuro modo físico/PWA**: recursos impressos e acesso offline a materiais; sem prometer sincronização entre aparelhos desconectados.

## Critérios de aceite para a sala online
- Criar sala; entrar via código ou QR em Android/iOS/desktop.
- Quatro jogadores + mestre conectados simultaneamente.
- Só o jogador da vez pode movimentar; só o mestre pode revelar/validar desafios.
- Mudanças no mapa e na Tabela Periódica são visíveis em todos os dispositivos.
- Recarregar, desconectar e reconectar não perde o domínio dos elementos.
- Dois aparelhos simultâneos não conseguem reivindicar o mesmo elemento por corrida de escrita.
- Gabaritos não ficam disponíveis para jogadores pelo DevTools/API.
- Layout adaptado a telas pequenas, toque e preferências de redução de movimento.
- Testes em Chromium, Firefox e WebKit antes de declarar homologado.

## Estado atual
Somente protótipo local 0.1 foi preparado. Não existe ainda projeto Supabase configurado, nem migração, backend seguro, QR ou salas multiplayer. O Pages depende de configuração no repositório.
