# Raízes da Matéria

**Jogo educativo web multiplayer de Química e Libras**, para uso principalmente em celulares na sala de aula. Um mestre organiza a expedição e até quatro estudantes participam por código/link. A versão impressa será complementar.

## Experiência
- **Árvore da Descoberta:** Yggdrasil ornamental em SVG; as 48 casas estão localizadas em raízes, tronco e galhos. As 62 conexões de madeira são os caminhos, sem grade independente.
- **Atlas Periódico:** domínio de 50 elementos jogáveis das famílias A, em sua posição na Tabela Periódica. O painel ainda está em refinamento gráfico.
- **Doca responsiva:** Árvore, Tabela, Jogadores e Ações. Os dois últimos abrem painéis flutuantes sem abandonar o mapa.
- **Dado 3D:** animação autoral com CSS e bronze; o **resultado é sorteado e validado pelo servidor**, não pelo navegador.
- **Cartas digitais compartilhadas:** o servidor abre uma carta ao final da movimentação; todos os participantes a veem. O jogador da vez responde por alternativas ou texto, e o chat da carta permite diálogo.
- **Validação do mestre:** gabarito científico reservado, julgamento como correto/incorreto e registro automático de conquista de elemento quando aplicável.
- **Saída da sala:** jogadores podem liberar suas vagas sem perder o histórico; encerrar a sala é uma ação confirmada pelo mestre.
- **Libras:** o mestre apresenta e valida desafios presencialmente. Sinais-termo e os baralhos completos continuam pendentes de validação pedagógica.

O modo de jogo local foi removido da interface por enquanto. A prioridade é a experiência **multiplayer real**.

## Arquitetura
- React, TypeScript, Vite, Tailwind CSS e SVG.
- Hospedagem em GitHub Pages: https://quimicaifbacampusvca.github.io/raizes-da-materia/
- Supabase: autenticação anônima, PostgreSQL com RLS, funções SQL autoritativas e atualizações Realtime.
- Estrutura inicial: [database/initial_multiplayer.sql](database/initial_multiplayer.sql).
- Rotas de madeira e saída da sala: [database/board_routes_and_room_exit.sql](database/board_routes_and_room_exit.sql).
- Baralho, chat e validação: [database/digital_cards_and_dialogue.sql](database/digital_cards_and_dialogue.sql) (migração já aplicada ao projeto Supabase atual).
- Detalhes de segurança e arquitetura: [docs/arquitetura-multijogador.md](docs/arquitetura-multijogador.md).

## Desenvolvimento
```bash
npm install
npm run dev
npm run build
npm run test:e2e
```

O build para GitHub Pages utiliza as variáveis públicas `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. Nunca publicar a chave secreta/service role no front-end.

## Responsividade
A workflow [responsive.yml](.github/workflows/responsive.yml) executa o Playwright em **Chromium, Firefox e WebKit** com estes formatos: 320×640, 360×740, 390×844, 428×926, 667×375, 768×1024, 1024×768, 1440×900 e 1920×1080.

O teste usa um backend **mockado**, verifica ausência de rolagem horizontal global e navega pela doca, painéis e confirmação de saída. Um CI aprovado **não substitui** o teste real entre diferentes celulares conectados ao Supabase.

## Estado de implementação
- A infraestrutura Supabase está provisionada, a autenticação anônima foi habilitada e as rotas/ações de saída foram migradas para o banco.
- O mapa responsivo e o dado clicável fazem parte da base de produção. O fluxo de cartas digitais está em homologação no [PR #1](https://github.com/quimicaifbacampusvca/raizes-da-materia/pull/1).
- Persistência e sincronização dependem de conexão de rede.
- Baralho inicial com 61 cartas (50 de identificação e 11 de propriedades/aplicações) disponível no banco, com respostas preservadas fora do navegador; conteúdos em Libras e mecânicas de eventos/disputas ainda precisam de validação pedagógica e aprofundamento.
- A versão atual ainda **não é um jogo completo homologado**.

As imagens e a programação do tabuleiro são autorais. A técnica de dado CSS 3D foi escolhida após avaliar projetos abertos, sem incorporar bibliotecas ou código de terceiros.
