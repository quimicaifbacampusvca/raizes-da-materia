# Raízes da Matéria

Jogo educativo original de Química e Libras. A versão principal será um jogo **web mobile multiplayer**, com mestre e até quatro jogadores em uma sala compartilhada; a versão física será complementar.

## Tabuleiros
- **Árvore da Descoberta**: mapa SVG de 48 casas com navegação vertical/horizontal, bifurcações e quatro tipos de encontros.
- **Tabela Periódica**: estrutura científica de 118 posições com 50 elementos jogáveis das famílias A. O domínio é indicado por quatro cores e símbolos.

## Tecnologia
React + TypeScript + Tailwind CSS + SVG, Vite, GitHub Pages e backend futuro no Supabase. Arquitetura de salas descrita em [docs/arquitetura-multijogador.md](docs/arquitetura-multijogador.md).

## Desenvolvimento local
```bash
npm install
npm run dev
npm run build
```

## Publicação
O workflow `.github/workflows/pages.yml` prepara o site para GitHub Pages quando a branch for integrada na `main` e em **Settings → Pages → Build and deployment → Source** for escolhido **GitHub Actions**.

A URL prevista, após ativar a publicação, é `https://quimicaifbacampusvca.github.io/raizes-da-materia/`. Não presumir que esteja publicada antes de verificar o workflow e o Pages.

## Estado da versão 0.2 (em desenvolvimento)
- **Demonstração local:** movimentação simulada em um aparelho, com o mapa SVG e a Tabela Periódica.
- **Interface de salas online:** formulários de mestre e jogadores, convite por código/link, tabuleiro compartilhável, ações de turno e validação pelo mestre.
- **Backend preparado:** esquema SQL em [database/initial_multiplayer.sql](database/initial_multiplayer.sql) com RLS e funções de ação autorizadas.
- **Ainda não é multiplayer operacional:** falta criar e autorizar o projeto Supabase, habilitar Auth anônimo, aplicar/testar o SQL e configurar as variáveis públicas do build.
- Nenhum gabarito reservado nem sinal-termo definitivo foi disponibilizado; Libras e conteúdo científico exigem validação especializada.

## Como habilitar a sala online
1. Criar projeto Supabase autorizado e habilitar **Auth → Anonymous Sign-Ins**.
2. Aplicar e verificar `database/initial_multiplayer.sql` no projeto, incluindo autorização RLS e Realtime.
3. Definir `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no ambiente de build. A publishable key é pública; **nunca** incluir service role/secret key na aplicação.
4. Executar build e verificar sala com mestre e quatro jogadores em aparelhos diferentes.
5. Só declarar homologação após validar concorrência, reconexões, privacidade e compatibilidade móvel.

Consulte [docs/arquitetura-multijogador.md](docs/arquitetura-multijogador.md) para os critérios de aceitação.
