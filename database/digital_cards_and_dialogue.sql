-- Cartas digitais de Química/Libras: a carta é pública, o gabarito é privado.
-- O mestre julga a resposta. Não existem sinais-termo inventados no baralho.

create table if not exists public.game_cards (
  id text primary key check(length(id) between 3 and 50),
  category text not null check(category in ('identificacao','cotidiano','desafio','acontecimento')),
  title text not null check(length(title) between 3 and 100),
  prompt text not null check(length(prompt) between 8 and 500),
  mode text not null check(mode in ('choice','text')),
  options jsonb not null default '[]'::jsonb check(jsonb_typeof(options)='array'),
  symbol text,
  instructions text not null default '',
  check ((mode='text' and jsonb_array_length(options)=0)
      or (mode='choice' and jsonb_array_length(options)=4))
);
create table if not exists game_private.card_keys (
  card_id text primary key references public.game_cards(id) on delete cascade,
  correct_index integer,
  reference text not null
);
revoke all on game_private.card_keys from public,anon,authenticated;
revoke all on public.game_cards from anon,authenticated;
grant select on public.game_cards to authenticated;
alter table public.game_cards enable row level security;
create policy "visible cards for authenticated players"
  on public.game_cards for select to authenticated
  using (true);

insert into public.game_cards(id,category,title,prompt,mode,options,symbol,instructions)
values
('el_H','identificacao','Símbolo H','Qual elemento químico corresponde ao símbolo H?','choice','["Hidrogênio","Oxigênio","Cálcio","Telúrio"]'::jsonb,'H','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_He','identificacao','Símbolo He','Qual elemento químico corresponde ao símbolo He?','choice','["Flúor","Gálio","Iodo","Hélio"]'::jsonb,'He','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Li','identificacao','Símbolo Li','Qual elemento químico corresponde ao símbolo Li?','choice','["Germânio","Xenônio","Lítio","Neônio"]'::jsonb,'Li','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Be','identificacao','Símbolo Be','Qual elemento químico corresponde ao símbolo Be?','choice','["Césio","Berílio","Sódio","Arsênio"]'::jsonb,'Be','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_B','identificacao','Símbolo B','Qual elemento químico corresponde ao símbolo B?','choice','["Boro","Magnésio","Selênio","Bário"]'::jsonb,'B','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_C','identificacao','Símbolo C','Qual elemento químico corresponde ao símbolo C?','choice','["Alumínio","Bromo","Tálio","Carbono"]'::jsonb,'C','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_N','identificacao','Símbolo N','Qual elemento químico corresponde ao símbolo N?','choice','["Criptônio","Chumbo","Nitrogênio","Silício"]'::jsonb,'N','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_O','identificacao','Símbolo O','Qual elemento químico corresponde ao símbolo O?','choice','["Bismuto","Oxigênio","Fósforo","Rubídio"]'::jsonb,'O','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_F','identificacao','Símbolo F','Qual elemento químico corresponde ao símbolo F?','choice','["Flúor","Enxofre","Estrôncio","Polônio"]'::jsonb,'F','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Ne','identificacao','Símbolo Ne','Qual elemento químico corresponde ao símbolo Ne?','choice','["Cloro","Índio","Astato","Neônio"]'::jsonb,'Ne','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Na','identificacao','Símbolo Na','Qual elemento químico corresponde ao símbolo Na?','choice','["Estanho","Radônio","Sódio","Argônio"]'::jsonb,'Na','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Mg','identificacao','Símbolo Mg','Qual elemento químico corresponde ao símbolo Mg?','choice','["Frâncio","Magnésio","Potássio","Antimônio"]'::jsonb,'Mg','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Al','identificacao','Símbolo Al','Qual elemento químico corresponde ao símbolo Al?','choice','["Alumínio","Cálcio","Telúrio","Rádio"]'::jsonb,'Al','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Si','identificacao','Símbolo Si','Qual elemento químico corresponde ao símbolo Si?','choice','["Gálio","Iodo","Nihônio","Silício"]'::jsonb,'Si','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_P','identificacao','Símbolo P','Qual elemento químico corresponde ao símbolo P?','choice','["Xenônio","Fleróvio","Fósforo","Germânio"]'::jsonb,'P','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_S','identificacao','Símbolo S','Qual elemento químico corresponde ao símbolo S?','choice','["Moscóvio","Enxofre","Arsênio","Césio"]'::jsonb,'S','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Cl','identificacao','Símbolo Cl','Qual elemento químico corresponde ao símbolo Cl?','choice','["Cloro","Selênio","Bário","Livermório"]'::jsonb,'Cl','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Ar','identificacao','Símbolo Ar','Qual elemento químico corresponde ao símbolo Ar?','choice','["Bromo","Tálio","Tenessino","Argônio"]'::jsonb,'Ar','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_K','identificacao','Símbolo K','Qual elemento químico corresponde ao símbolo K?','choice','["Chumbo","Oganessônio","Potássio","Criptônio"]'::jsonb,'K','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Ca','identificacao','Símbolo Ca','Qual elemento químico corresponde ao símbolo Ca?','choice','["Hidrogênio","Cálcio","Rubídio","Bismuto"]'::jsonb,'Ca','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Ga','identificacao','Símbolo Ga','Qual elemento químico corresponde ao símbolo Ga?','choice','["Gálio","Estrôncio","Polônio","Hélio"]'::jsonb,'Ga','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Ge','identificacao','Símbolo Ge','Qual elemento químico corresponde ao símbolo Ge?','choice','["Índio","Astato","Lítio","Germânio"]'::jsonb,'Ge','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_As','identificacao','Símbolo As','Qual elemento químico corresponde ao símbolo As?','choice','["Radônio","Berílio","Arsênio","Estanho"]'::jsonb,'As','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Se','identificacao','Símbolo Se','Qual elemento químico corresponde ao símbolo Se?','choice','["Boro","Selênio","Antimônio","Frâncio"]'::jsonb,'Se','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Br','identificacao','Símbolo Br','Qual elemento químico corresponde ao símbolo Br?','choice','["Bromo","Telúrio","Rádio","Carbono"]'::jsonb,'Br','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Kr','identificacao','Símbolo Kr','Qual elemento químico corresponde ao símbolo Kr?','choice','["Iodo","Nihônio","Nitrogênio","Criptônio"]'::jsonb,'Kr','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Rb','identificacao','Símbolo Rb','Qual elemento químico corresponde ao símbolo Rb?','choice','["Fleróvio","Oxigênio","Rubídio","Xenônio"]'::jsonb,'Rb','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Sr','identificacao','Símbolo Sr','Qual elemento químico corresponde ao símbolo Sr?','choice','["Flúor","Estrôncio","Césio","Moscóvio"]'::jsonb,'Sr','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_In','identificacao','Símbolo In','Qual elemento químico corresponde ao símbolo In?','choice','["Índio","Bário","Livermório","Neônio"]'::jsonb,'In','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Sn','identificacao','Símbolo Sn','Qual elemento químico corresponde ao símbolo Sn?','choice','["Tálio","Tenessino","Sódio","Estanho"]'::jsonb,'Sn','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Sb','identificacao','Símbolo Sb','Qual elemento químico corresponde ao símbolo Sb?','choice','["Oganessônio","Magnésio","Antimônio","Chumbo"]'::jsonb,'Sb','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Te','identificacao','Símbolo Te','Qual elemento químico corresponde ao símbolo Te?','choice','["Alumínio","Telúrio","Bismuto","Hidrogênio"]'::jsonb,'Te','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_I','identificacao','Símbolo I','Qual elemento químico corresponde ao símbolo I?','choice','["Iodo","Polônio","Hélio","Silício"]'::jsonb,'I','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Xe','identificacao','Símbolo Xe','Qual elemento químico corresponde ao símbolo Xe?','choice','["Astato","Lítio","Fósforo","Xenônio"]'::jsonb,'Xe','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Cs','identificacao','Símbolo Cs','Qual elemento químico corresponde ao símbolo Cs?','choice','["Berílio","Enxofre","Césio","Radônio"]'::jsonb,'Cs','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Ba','identificacao','Símbolo Ba','Qual elemento químico corresponde ao símbolo Ba?','choice','["Cloro","Bário","Frâncio","Boro"]'::jsonb,'Ba','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Tl','identificacao','Símbolo Tl','Qual elemento químico corresponde ao símbolo Tl?','choice','["Tálio","Rádio","Carbono","Argônio"]'::jsonb,'Tl','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Pb','identificacao','Símbolo Pb','Qual elemento químico corresponde ao símbolo Pb?','choice','["Nihônio","Nitrogênio","Potássio","Chumbo"]'::jsonb,'Pb','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Bi','identificacao','Símbolo Bi','Qual elemento químico corresponde ao símbolo Bi?','choice','["Oxigênio","Cálcio","Bismuto","Fleróvio"]'::jsonb,'Bi','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Po','identificacao','Símbolo Po','Qual elemento químico corresponde ao símbolo Po?','choice','["Gálio","Polônio","Moscóvio","Flúor"]'::jsonb,'Po','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_At','identificacao','Símbolo At','Qual elemento químico corresponde ao símbolo At?','choice','["Astato","Livermório","Neônio","Germânio"]'::jsonb,'At','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Rn','identificacao','Símbolo Rn','Qual elemento químico corresponde ao símbolo Rn?','choice','["Tenessino","Sódio","Arsênio","Radônio"]'::jsonb,'Rn','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Fr','identificacao','Símbolo Fr','Qual elemento químico corresponde ao símbolo Fr?','choice','["Magnésio","Selênio","Frâncio","Oganessônio"]'::jsonb,'Fr','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Ra','identificacao','Símbolo Ra','Qual elemento químico corresponde ao símbolo Ra?','choice','["Bromo","Rádio","Hidrogênio","Alumínio"]'::jsonb,'Ra','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Nh','identificacao','Símbolo Nh','Qual elemento químico corresponde ao símbolo Nh?','choice','["Nihônio","Hélio","Silício","Criptônio"]'::jsonb,'Nh','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Fl','identificacao','Símbolo Fl','Qual elemento químico corresponde ao símbolo Fl?','choice','["Lítio","Fósforo","Rubídio","Fleróvio"]'::jsonb,'Fl','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Mc','identificacao','Símbolo Mc','Qual elemento químico corresponde ao símbolo Mc?','choice','["Enxofre","Estrôncio","Moscóvio","Berílio"]'::jsonb,'Mc','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Lv','identificacao','Símbolo Lv','Qual elemento químico corresponde ao símbolo Lv?','choice','["Índio","Livermório","Boro","Cloro"]'::jsonb,'Lv','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Ts','identificacao','Símbolo Ts','Qual elemento químico corresponde ao símbolo Ts?','choice','["Tenessino","Carbono","Argônio","Estanho"]'::jsonb,'Ts','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('el_Og','identificacao','Símbolo Og','Qual elemento químico corresponde ao símbolo Og?','choice','["Nitrogênio","Potássio","Antimônio","Oganessônio"]'::jsonb,'Og','Depois de responder, o jogador pode dialogar sobre aplicações e representação em Libras.'),
('cot_calor','cotidiano','O calor percorre o metal','Qual propriedade explica por que uma colher metálica aquece ao ficar em uma bebida quente?','choice','["Condutividade térmica","Magnetismo obrigatório","Radioatividade","Transparência óptica"]'::jsonb,NULL,'Convide o grupo a comentar usos cotidianos de metais.'),
('cot_fios','cotidiano','Fios e circuitos','Por que o cobre é usado em muitos fios elétricos?','choice','["Porque é sempre atraído por ímãs","Por sua boa condutividade elétrica e ductilidade","Porque é um isolante elétrico","Porque não sofre aquecimento"]'::jsonb,NULL,'Relacione a aplicação a uma propriedade física observável.'),
('cot_objetos','cotidiano','Metais no entorno','Cite um objeto metálico do cotidiano e explique qual propriedade favorece seu uso.','text','[]'::jsonb,NULL,'O grupo pode sugerir outros exemplos no chat, respeitando a vez do jogador.'),
('cot_branco','cotidiano','Brilho na superfície','O que favorece o brilho característico de muitas superfícies metálicas polidas?','choice','["Ausência de elétrons no sólido","Reflexão da luz devido à resposta dos elétrons","Transparência total à luz visível","Formação obrigatória de moléculas isoladas"]'::jsonb,NULL,'Discuta por que o estado da superfície altera a aparência.'),
('des_maleabilidade','desafio','Deformar sem quebrar','Como se chama a capacidade de formar lâminas por deformação plástica?','choice','["Ductilidade","Maleabilidade","Fragilidade","Volatilidade"]'::jsonb,NULL,'Peça que diferenciem maleabilidade de ductilidade.'),
('des_ductilidade','desafio','Fios metálicos','A propriedade de um metal que permite ser transformado em fios é principalmente a:','choice','["Ductilidade","Solubilidade em água","Transparência","Fluorescência"]'::jsonb,NULL,'Convide a turma a explicar o processo de trefilação.'),
('des_ligacao','desafio','Ligação metálica','Explique com suas palavras como a ligação metálica mantém os centros metálicos unidos.','text','[]'::jsonb,NULL,'O mestre pode mediar o diálogo em Libras. O sinal-termo não é presumido no sistema.'),
('des_tabela','desafio','Famílias e propriedades','Qual dos elementos a seguir pertence ao grupo 1 da Tabela Periódica?','choice','["Neônio","Cálcio","Sódio","Alumínio"]'::jsonb,NULL,'Explore a posição de cada elemento na tabela.'),
('evt_reflexao','acontecimento','O desafio da oficina','Uma peça metálica perdeu o brilho após ficar exposta ao ambiente. O que pode ter acontecido com sua superfície?','text','[]'::jsonb,NULL,'Carta de acontecimento: o mestre define o resultado após a explicação.'),
('evt_encontro','acontecimento','Diálogo dos materiais','Qual afirmação sobre metais é mais adequada?','choice','["Todos os metais são ferromagnéticos","Todos os metais são líquidos à temperatura ambiente","Metais podem apresentar propriedades muito diferentes entre si","Todos os metais possuem a mesma estrutura cristalina"]'::jsonb,NULL,'Peça um contraexemplo para alguma alternativa incorreta.'),
('evt_comunicacao','acontecimento','Comunicação científica','Explique uma propriedade metálica para o grupo usando texto ou Libras mediada pelo mestre. Dê um exemplo de aplicação.','text','[]'::jsonb,NULL,'Esta carta valoriza o diálogo, não o conhecimento de um sinal específico.')
on conflict (id) do update set category=excluded.category,title=excluded.title,
prompt=excluded.prompt,mode=excluded.mode,options=excluded.options,
symbol=excluded.symbol,instructions=excluded.instructions;

insert into game_private.card_keys(card_id,correct_index,reference)
values
('el_H',0,'Gabarito: Hidrogênio (H), número atômico 1, grupo 1. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_He',3,'Gabarito: Hélio (He), número atômico 2, grupo 18. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Li',2,'Gabarito: Lítio (Li), número atômico 3, grupo 1. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Be',1,'Gabarito: Berílio (Be), número atômico 4, grupo 2. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_B',0,'Gabarito: Boro (B), número atômico 5, grupo 13. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_C',3,'Gabarito: Carbono (C), número atômico 6, grupo 14. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_N',2,'Gabarito: Nitrogênio (N), número atômico 7, grupo 15. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_O',1,'Gabarito: Oxigênio (O), número atômico 8, grupo 16. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_F',0,'Gabarito: Flúor (F), número atômico 9, grupo 17. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Ne',3,'Gabarito: Neônio (Ne), número atômico 10, grupo 18. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Na',2,'Gabarito: Sódio (Na), número atômico 11, grupo 1. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Mg',1,'Gabarito: Magnésio (Mg), número atômico 12, grupo 2. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Al',0,'Gabarito: Alumínio (Al), número atômico 13, grupo 13. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Si',3,'Gabarito: Silício (Si), número atômico 14, grupo 14. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_P',2,'Gabarito: Fósforo (P), número atômico 15, grupo 15. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_S',1,'Gabarito: Enxofre (S), número atômico 16, grupo 16. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Cl',0,'Gabarito: Cloro (Cl), número atômico 17, grupo 17. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Ar',3,'Gabarito: Argônio (Ar), número atômico 18, grupo 18. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_K',2,'Gabarito: Potássio (K), número atômico 19, grupo 1. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Ca',1,'Gabarito: Cálcio (Ca), número atômico 20, grupo 2. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Ga',0,'Gabarito: Gálio (Ga), número atômico 31, grupo 13. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Ge',3,'Gabarito: Germânio (Ge), número atômico 32, grupo 14. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_As',2,'Gabarito: Arsênio (As), número atômico 33, grupo 15. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Se',1,'Gabarito: Selênio (Se), número atômico 34, grupo 16. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Br',0,'Gabarito: Bromo (Br), número atômico 35, grupo 17. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Kr',3,'Gabarito: Criptônio (Kr), número atômico 36, grupo 18. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Rb',2,'Gabarito: Rubídio (Rb), número atômico 37, grupo 1. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Sr',1,'Gabarito: Estrôncio (Sr), número atômico 38, grupo 2. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_In',0,'Gabarito: Índio (In), número atômico 49, grupo 13. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Sn',3,'Gabarito: Estanho (Sn), número atômico 50, grupo 14. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Sb',2,'Gabarito: Antimônio (Sb), número atômico 51, grupo 15. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Te',1,'Gabarito: Telúrio (Te), número atômico 52, grupo 16. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_I',0,'Gabarito: Iodo (I), número atômico 53, grupo 17. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Xe',3,'Gabarito: Xenônio (Xe), número atômico 54, grupo 18. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Cs',2,'Gabarito: Césio (Cs), número atômico 55, grupo 1. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Ba',1,'Gabarito: Bário (Ba), número atômico 56, grupo 2. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Tl',0,'Gabarito: Tálio (Tl), número atômico 81, grupo 13. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Pb',3,'Gabarito: Chumbo (Pb), número atômico 82, grupo 14. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Bi',2,'Gabarito: Bismuto (Bi), número atômico 83, grupo 15. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Po',1,'Gabarito: Polônio (Po), número atômico 84, grupo 16. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_At',0,'Gabarito: Astato (At), número atômico 85, grupo 17. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Rn',3,'Gabarito: Radônio (Rn), número atômico 86, grupo 18. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Fr',2,'Gabarito: Frâncio (Fr), número atômico 87, grupo 1. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Ra',1,'Gabarito: Rádio (Ra), número atômico 88, grupo 2. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Nh',0,'Gabarito: Nihônio (Nh), número atômico 113, grupo 13. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Fl',3,'Gabarito: Fleróvio (Fl), número atômico 114, grupo 14. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Mc',2,'Gabarito: Moscóvio (Mc), número atômico 115, grupo 15. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Lv',1,'Gabarito: Livermório (Lv), número atômico 116, grupo 16. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Ts',0,'Gabarito: Tenessino (Ts), número atômico 117, grupo 17. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('el_Og',3,'Gabarito: Oganessônio (Og), número atômico 118, grupo 18. O sinal em Libras deve ser apresentado ou validado por educador competente; datilologia não é automaticamente um sinal lexical.'),
('cot_calor',0,'A transferência de calor ao longo da colher envolve condução térmica. Atenção: a temperatura não é uma substância que se desloca.'),
('cot_fios',1,'O cobre tem alta condutividade elétrica e pode ser trefilado; fios também podem aquecer por efeito Joule.'),
('cot_objetos',NULL,'Exemplos: panela — condutividade térmica; fio de cobre — condutividade elétrica e ductilidade; lata de alumínio — maleabilidade. Avalie a coerência entre objeto e propriedade.'),
('cot_branco',1,'A resposta coletiva de elétrons de condução à luz produz refletância elevada em muitos metais, com dependência de frequência e estado da superfície.'),
('des_maleabilidade',1,'Maleabilidade descreve capacidade de deformação plástica sob compressão/laminação; ductilidade costuma relacionar-se à tração e formação de fios.'),
('des_ductilidade',0,'Ductilidade descreve deformação plástica sob tração, associada à trefilação.'),
('des_ligacao',NULL,'Resposta esperada em nível introdutório: atração eletrostática coletiva entre núcleos e elétrons de valência deslocalizados numa estrutura sólida; evitar descrever elétrons como órbitas fixas.'),
('des_tabela',2,'O sódio (Na) pertence ao grupo 1; o cálcio ao grupo 2; alumínio ao grupo 13; neônio ao grupo 18.'),
('evt_reflexao',NULL,'Respostas possíveis: oxidação, formação de filmes superficiais, corrosão, contaminação e rugosidade, dependendo do metal e ambiente. Não aceite que todo metal necessariamente enferruja.'),
('evt_encontro',2,'Há grande diversidade entre metais em magnetismo, fase, estrutura cristalina, condutividade e comportamento mecânico.'),
('evt_comunicacao',NULL,'Avaliar relação correta entre a propriedade descrita e a aplicação; oferecer apoio linguístico em Libras sem inventar sinais.')
on conflict(card_id) do update
set correct_index=excluded.correct_index,reference=excluded.reference;

alter table public.game_rooms
  add column if not exists turn_index integer not null default 0 check(turn_index>=0);

create table if not exists public.game_room_challenges (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  turn_index integer not null,
  card_id text not null references public.game_cards(id),
  player_id uuid not null references auth.users(id),
  node_id integer not null check(node_id between 0 and 47),
  verdict text check(verdict in ('correct','incorrect')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique(room_id,turn_index),
  unique(id,room_id)
);
create index if not exists game_room_challenges_room_idx
  on public.game_room_challenges(room_id,turn_index desc);

create table if not exists public.game_challenge_submissions (
  challenge_id uuid primary key,
  room_id uuid not null,
  player_id uuid not null references auth.users(id),
  mode text not null check(mode in ('choice','text')),
  option_index integer check(option_index between 0 and 3),
  answer_text text,
  created_at timestamptz not null default now(),
  foreign key(challenge_id,room_id) references public.game_room_challenges(id,room_id) on delete cascade,
  check ((mode='choice' and option_index is not null and answer_text is null)
      or (mode='text' and option_index is null and answer_text is not null and length(answer_text) between 1 and 600))
);
create table if not exists public.game_challenge_messages (
  id bigint generated always as identity primary key,
  challenge_id uuid not null,
  room_id uuid not null,
  sender_id uuid not null references auth.users(id),
  body text not null check(length(body) between 1 and 500),
  created_at timestamptz not null default now(),
  foreign key(challenge_id,room_id) references public.game_room_challenges(id,room_id) on delete cascade
);
create index if not exists challenge_messages_room_idx
  on public.game_challenge_messages(challenge_id,id);

alter table public.game_room_challenges enable row level security;
alter table public.game_challenge_submissions enable row level security;
alter table public.game_challenge_messages enable row level security;
revoke all on public.game_room_challenges,public.game_challenge_submissions,public.game_challenge_messages
  from anon,authenticated;
grant select on public.game_room_challenges,public.game_challenge_submissions,public.game_challenge_messages
  to authenticated;
create policy "room members see active card state"
  on public.game_room_challenges for select to authenticated
  using (game_private.is_member(room_id));
create policy "only player and master see submitted answer"
  on public.game_challenge_submissions for select to authenticated
  using (
    game_private.is_member(room_id)
    and (
      player_id=(select auth.uid())
      or exists(select 1 from public.game_rooms r where r.id=room_id and r.host_id=(select auth.uid()))
    )
  );
create policy "room members see challenge discussion"
  on public.game_challenge_messages for select to authenticated
  using (game_private.is_member(room_id));

-- Cartas publicadas via Postgres Changes; as mensagens são recuperadas via polling
-- para não expor payloads de resposta a outras pessoas no canal de Realtime.
do $$
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime')
     and not exists(select 1 from pg_publication_tables
       where pubname='supabase_realtime' and schemaname='public' and tablename='game_room_challenges')
  then
    alter publication supabase_realtime add table public.game_room_challenges;
  end if;
end $$;

-- Ao concluir o movimento, o servidor escolhe uma carta correspondente ao tipo
-- de casa (mesma fórmula do front-end) e a abre para TODA a sala.
create or replace function game_private.move_pawn(p_room uuid,p_node integer)
returns integer language plpgsql security definer set search_path=''
as $$
declare
 v_room public.game_rooms%rowtype; v_player public.game_players%rowtype;
 v_old integer; v_remaining integer; v_category text; v_card text;
begin
 if auth.uid() is null then raise exception 'Autenticação necessária'; end if;
 select * into v_room from public.game_rooms where id=p_room for update;
 if not found or v_room.phase<>'moving' or v_room.remaining_steps<1 then
   raise exception 'Movimentação não permitida';
 end if;
 select * into v_player from public.game_players
   where room_id=p_room and seat=v_room.current_seat and active for update;
 if not found or v_player.user_id<>auth.uid() then raise exception 'Não é o seu turno'; end if;
 v_old:=v_player.node_id;
 if p_node is null or not exists(select 1 from game_private.board_edges e
   where (e.a=v_old and e.b=p_node) or (e.a=p_node and e.b=v_old))
 then raise exception 'Esse galho não está conectado à casa atual'; end if;
 v_remaining:=v_room.remaining_steps-1;
 update public.game_players set node_id=p_node where id=v_player.id;
 update public.game_rooms set remaining_steps=v_remaining,
  phase=case when v_remaining=0 then 'challenge' else 'moving' end,
  revision=revision+1,updated_at=now() where id=p_room;
 if v_remaining=0 then
   v_category:=case
     when (p_node*17)%48<20 then 'identificacao'
     when (p_node*17)%48<32 then 'cotidiano'
     when (p_node*17)%48<42 then 'desafio'
     else 'acontecimento' end;
   select id into v_card
     from public.game_cards c
     where c.category=v_category
       and (v_category<>'identificacao' or not exists(
         select 1 from public.game_claims cl where cl.room_id=p_room and cl.symbol=c.symbol
       ))
     order by md5(c.id||':'||p_room::text||':'||v_room.revision::text)
     limit 1;
   if v_card is null then
     select id into v_card from public.game_cards c where c.category=v_category
       order by md5(c.id||':'||p_room::text||':'||v_room.revision::text) limit 1;
   end if;
   if v_card is null then raise exception 'Baralho desta categoria está vazio'; end if;
   insert into public.game_room_challenges(room_id,turn_index,card_id,player_id,node_id)
     values(p_room,v_room.turn_index,v_card,v_player.user_id,p_node);
   insert into public.game_events(room_id,actor_id,kind,payload)
     values(p_room,auth.uid(),'card_opened',
       jsonb_build_object('card',v_card,'category',v_category,'turn',v_room.turn_index));
 end if;
 insert into public.game_events(room_id,actor_id,kind,payload)
   values(p_room,auth.uid(),'pawn_moved',jsonb_build_object('from',v_old,'to',p_node));
 return v_remaining;
end $$;

create or replace function game_private.submit_answer(
 p_room uuid,p_challenge uuid,p_option integer,p_text text
) returns boolean language plpgsql security definer set search_path=''
as $$
declare v_room public.game_rooms%rowtype; v_ch public.game_room_challenges%rowtype;
 v_card public.game_cards%rowtype; v_text text:=btrim(coalesce(p_text,''));
begin
 if auth.uid() is null then raise exception 'Autenticação necessária'; end if;
 select * into v_room from public.game_rooms where id=p_room for update;
 if not found or v_room.phase<>'challenge' then raise exception 'Não há desafio aberto'; end if;
 select * into v_ch from public.game_room_challenges where id=p_challenge and room_id=p_room;
 if not found or v_ch.turn_index<>v_room.turn_index or v_ch.verdict is not null then
    raise exception 'Esta carta já foi encerrada'; end if;
 if v_ch.player_id<>auth.uid() or not exists(
   select 1 from public.game_players p where p.room_id=p_room and p.user_id=auth.uid() and p.active
 ) then raise exception 'Somente o jogador da vez pode responder'; end if;
 select * into v_card from public.game_cards where id=v_ch.card_id;
 if v_card.mode='choice' then
    if p_option is null or p_option<0 or p_option>=jsonb_array_length(v_card.options) then
      raise exception 'Selecione uma alternativa válida'; end if;
    insert into public.game_challenge_submissions(challenge_id,room_id,player_id,mode,option_index)
      values(p_challenge,p_room,auth.uid(),'choice',p_option);
 else
    if length(v_text)<2 or length(v_text)>600 then
      raise exception 'Resposta precisa ter entre 2 e 600 caracteres'; end if;
    insert into public.game_challenge_submissions(challenge_id,room_id,player_id,mode,answer_text)
      values(p_challenge,p_room,auth.uid(),'text',v_text);
 end if;
 insert into public.game_events(room_id,actor_id,kind,payload)
   values(p_room,auth.uid(),'answer_submitted',jsonb_build_object('challenge',p_challenge));
 return true;
exception when unique_violation then
 raise exception 'Você já enviou a resposta desta carta';
end $$;

create or replace function game_private.send_challenge_message(
 p_room uuid,p_challenge uuid,p_body text
) returns bigint language plpgsql security definer set search_path=''
as $$
declare v_room public.game_rooms%rowtype; v_ch public.game_room_challenges%rowtype;
 v_text text:=btrim(coalesce(p_body,'')); v_id bigint; v_count integer;
begin
 if auth.uid() is null then raise exception 'Autenticação necessária'; end if;
 select * into v_room from public.game_rooms where id=p_room for update;
 if not found or v_room.phase<>'challenge' or not game_private.is_member(p_room) then
   raise exception 'Sem permissão para enviar mensagens'; end if;
 select * into v_ch from public.game_room_challenges
   where room_id=p_room and id=p_challenge;
 if not found or v_ch.verdict is not null or v_ch.turn_index<>v_room.turn_index then
   raise exception 'Discussão desta carta encerrada'; end if;
 if length(v_text)<1 or length(v_text)>500 then raise exception 'Mensagem entre 1 e 500 caracteres'; end if;
 select count(*) into v_count from public.game_challenge_messages
  where challenge_id=p_challenge and sender_id=auth.uid();
 if v_count>=25 then raise exception 'Limite de mensagens por carta alcançado'; end if;
 insert into public.game_challenge_messages(challenge_id,room_id,sender_id,body)
   values(p_challenge,p_room,auth.uid(),v_text) returning id into v_id;
 return v_id;
end $$;

create or replace function game_private.get_card_key(p_room uuid,p_challenge uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_key game_private.card_keys%rowtype; v_ch public.game_room_challenges%rowtype;
begin
 if auth.uid() is null or not exists(
    select 1 from public.game_rooms where id=p_room and host_id=auth.uid()
 ) then raise exception 'Gabarito reservado ao mestre'; end if;
 select * into v_ch from public.game_room_challenges where id=p_challenge and room_id=p_room;
 if not found then raise exception 'Carta não encontrada'; end if;
 select * into v_key from game_private.card_keys where card_id=v_ch.card_id;
 return jsonb_build_object('correct_index',v_key.correct_index,'reference',v_key.reference);
end $$;

create or replace function game_private.validate_card(
 p_room uuid,p_challenge uuid,p_correct boolean
) returns boolean language plpgsql security definer set search_path=''
as $$
declare v_room public.game_rooms%rowtype; v_ch public.game_room_challenges%rowtype;
 v_card public.game_cards%rowtype; v_awarded boolean:=false;
begin
 if auth.uid() is null then raise exception 'Autenticação necessária'; end if;
 if p_correct is null then raise exception 'Escolha correto ou incorreto'; end if;
 select * into v_room from public.game_rooms where id=p_room for update;
 if not found or v_room.host_id<>auth.uid() then raise exception 'Só o mestre valida'; end if;
 if v_room.phase<>'challenge' then raise exception 'Nenhum desafio em andamento'; end if;
 select * into v_ch from public.game_room_challenges
   where id=p_challenge and room_id=p_room for update;
 if not found or v_ch.turn_index<>v_room.turn_index or v_ch.verdict is not null then
   raise exception 'Esta carta já foi validada ou não corresponde ao turno'; end if;
 select * into v_card from public.game_cards where id=v_ch.card_id;
 update public.game_room_challenges set
   verdict=case when p_correct then 'correct' else 'incorrect' end,
   resolved_at=now() where id=p_challenge;
 if p_correct and v_card.category='identificacao' and v_card.symbol is not null
    and not exists(select 1 from public.game_claims cl
      where cl.room_id=p_room and cl.symbol=v_card.symbol)
 then
   insert into public.game_claims(room_id,symbol,owner_id)
     values(p_room,v_card.symbol,v_ch.player_id)
   on conflict (room_id,symbol) do nothing;
   v_awarded:=found;
 end if;
 update public.game_rooms set award_used=v_awarded,revision=revision+1,
   updated_at=now() where id=p_room;
 insert into public.game_events(room_id,actor_id,kind,payload)
   values(p_room,auth.uid(),'card_validated',jsonb_build_object(
     'challenge',p_challenge,'correct',p_correct,'awarded',v_awarded));
 return true;
end $$;

-- Sem validação não é possível passar à próxima carta.
-- Compatibilidade: partidas iniciadas antes desta migração sem cartas podem terminar o turno.
create or replace function game_private.end_turn(p_room uuid)
returns integer language plpgsql security definer set search_path=''
as $$
declare v_room public.game_rooms%rowtype; v_actor uuid; v_next smallint;
 v_ch public.game_room_challenges%rowtype;
begin
 if auth.uid() is null then raise exception 'Autenticação necessária'; end if;
 select * into v_room from public.game_rooms where id=p_room for update;
 if not found or v_room.phase<>'challenge' then raise exception 'O movimento ainda não terminou'; end if;
 select user_id into v_actor from public.game_players where room_id=p_room
   and seat=v_room.current_seat and active;
 if auth.uid()<>v_room.host_id and auth.uid() is distinct from v_actor then
   raise exception 'Só o mestre ou jogador da vez pode encerrar o turno'; end if;
 select * into v_ch from public.game_room_challenges
   where room_id=p_room and turn_index=v_room.turn_index;
 if found and v_ch.verdict is null then raise exception 'Aguarde a validação do mestre'; end if;
 select min(seat) into v_next from public.game_players
   where room_id=p_room and active and seat>v_room.current_seat;
 if v_next is null then
    select min(seat) into v_next from public.game_players where room_id=p_room and active;
 end if;
 if v_next is null then raise exception 'Nenhum jogador ativo'; end if;
 update public.game_rooms set phase='ready',current_seat=v_next,die_roll=null,
    remaining_steps=0,award_used=false,turn_index=turn_index+1,
    revision=revision+1,updated_at=now() where id=p_room;
 insert into public.game_events(room_id,actor_id,kind,payload)
   values(p_room,auth.uid(),'turn_ended',jsonb_build_object('next_seat',v_next));
 return v_next;
end $$;

-- Impede concessões arbitrárias no sistema de cartas digitais.
-- O validador acima é a única forma de conceder elementos nesta edição.
create or replace function game_private.award_element(p_room uuid,p_symbol text)
returns boolean language plpgsql security definer set search_path=''
as $$
begin
 if auth.uid() is null then raise exception 'Autenticação necessária'; end if;
 raise exception 'Use a validação da carta; a concessão manual foi substituída';
end $$;

-- RPCs para clientes web; nenhum acesso direto de escrita às tabelas.
create or replace function public.game_submit_answer(
 p_room uuid,p_challenge uuid,p_option integer,p_text text
) returns boolean language sql security invoker set search_path=''
as $$ select game_private.submit_answer(p_room,p_challenge,p_option,p_text); $$;
create or replace function public.game_send_challenge_message(
 p_room uuid,p_challenge uuid,p_body text
) returns bigint language sql security invoker set search_path=''
as $$ select game_private.send_challenge_message(p_room,p_challenge,p_body); $$;
create or replace function public.game_get_card_key(p_room uuid,p_challenge uuid)
returns jsonb language sql security invoker set search_path=''
as $$ select game_private.get_card_key(p_room,p_challenge); $$;
create or replace function public.game_validate_card(
 p_room uuid,p_challenge uuid,p_correct boolean
) returns boolean language sql security invoker set search_path=''
as $$ select game_private.validate_card(p_room,p_challenge,p_correct); $$;

revoke all on function game_private.submit_answer(uuid,uuid,integer,text) from public,anon;
revoke all on function game_private.send_challenge_message(uuid,uuid,text) from public,anon;
revoke all on function game_private.get_card_key(uuid,uuid) from public,anon;
revoke all on function game_private.validate_card(uuid,uuid,boolean) from public,anon;
grant execute on function game_private.submit_answer(uuid,uuid,integer,text) to authenticated;
grant execute on function game_private.send_challenge_message(uuid,uuid,text) to authenticated;
grant execute on function game_private.get_card_key(uuid,uuid) to authenticated;
grant execute on function game_private.validate_card(uuid,uuid,boolean) to authenticated;
revoke all on function public.game_submit_answer(uuid,uuid,integer,text) from public,anon;
revoke all on function public.game_send_challenge_message(uuid,uuid,text) from public,anon;
revoke all on function public.game_get_card_key(uuid,uuid) from public,anon;
revoke all on function public.game_validate_card(uuid,uuid,boolean) from public,anon;
grant execute on function public.game_submit_answer(uuid,uuid,integer,text) to authenticated;
grant execute on function public.game_send_challenge_message(uuid,uuid,text) to authenticated;
grant execute on function public.game_get_card_key(uuid,uuid) to authenticated;
grant execute on function public.game_validate_card(uuid,uuid,boolean) to authenticated;
