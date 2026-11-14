-- Raízes da Matéria — estrutura multiplayer v0.2
-- Aplicar somente em um projeto Supabase autorizado.
-- Todas as tabelas publicadas usam RLS e não permitem escrita direta do cliente.

create schema if not exists game_private;
revoke all on schema game_private from public, anon, authenticated;
grant usage on schema game_private to authenticated;

create table if not exists public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) between 8 and 12),
  name text not null check (char_length(name) between 2 and 72),
  host_id uuid not null references auth.users(id),
  phase text not null default 'lobby' check (phase in ('lobby','ready','moving','challenge','finished')),
  current_seat smallint check (current_seat between 1 and 4),
  die_roll smallint check (die_roll between 1 and 6),
  remaining_steps smallint not null default 0 check (remaining_steps between 0 and 6),
  award_used boolean not null default false,
  revision integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.game_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  seat smallint not null check (seat between 1 and 4),
  nickname text not null check (char_length(nickname) between 2 and 32),
  node_id integer not null default 0 check (node_id between 0 and 47),
  created_at timestamptz not null default now(),
  unique (room_id, user_id),
  unique (room_id, seat)
);

create table if not exists public.game_claims (
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  symbol text not null check (symbol ~ '^[A-Z][a-z]?$'),
  owner_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (room_id, symbol),
  foreign key (room_id, owner_id) references public.game_players (room_id, user_id)
);

create table if not exists public.game_events (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  actor_id uuid references auth.users(id),
  kind text not null check (char_length(kind) between 2 and 48),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists game_events_room_idx on public.game_events(room_id, id);

alter table public.game_rooms enable row level security;
alter table public.game_players enable row level security;
alter table public.game_claims enable row level security;
alter table public.game_events enable row level security;

revoke all on public.game_rooms, public.game_players, public.game_claims, public.game_events from anon, authenticated;
grant select on public.game_rooms, public.game_players, public.game_claims, public.game_events to authenticated;

create or replace function game_private.is_member(p_room uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists(select 1 from public.game_rooms r where r.id = p_room and r.host_id = (select auth.uid()))
     or exists(select 1 from public.game_players p where p.room_id = p_room and p.user_id = (select auth.uid()));
$$;

create policy "rooms read by their members"
  on public.game_rooms for select to authenticated
  using (game_private.is_member(id));
create policy "players read by room members"
  on public.game_players for select to authenticated
  using (game_private.is_member(room_id));
create policy "claims read by room members"
  on public.game_claims for select to authenticated
  using (game_private.is_member(room_id));
create policy "events read by room members"
  on public.game_events for select to authenticated
  using (game_private.is_member(room_id));

create or replace function game_private.create_room(p_name text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_room public.game_rooms%rowtype;
  v_name text := left(trim(coalesce(p_name, 'Sala da Matéria')), 72);
begin
  if auth.uid() is null then raise exception 'Autenticação necessária'; end if;
  if char_length(v_name) < 2 then raise exception 'Nome da sala inválido'; end if;
  if (select count(*) from public.game_rooms where host_id = auth.uid() and phase <> 'finished') >= 10 then
    raise exception 'Limite de salas ativas atingido';
  end if;
  insert into public.game_rooms(code, name, host_id)
  values (upper(left(replace(gen_random_uuid()::text, '-', ''), 10)), v_name, auth.uid())
  returning * into v_room;
  insert into public.game_events(room_id, actor_id, kind) values(v_room.id, auth.uid(), 'room_created');
  return jsonb_build_object('id',v_room.id,'code',v_room.code);
end $$;

create or replace function game_private.join_room(p_code text, p_nickname text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_room public.game_rooms%rowtype;
  v_existing public.game_players%rowtype;
  v_seat smallint;
  v_nickname text := left(trim(coalesce(p_nickname,'')),32);
begin
  if auth.uid() is null then raise exception 'Autenticação necessária'; end if;
  if char_length(v_nickname) < 2 then raise exception 'Apelido deve ter ao menos dois caracteres'; end if;
  select * into v_room from public.game_rooms
   where code = upper(trim(coalesce(p_code,''))) for update;
  if not found then raise exception 'Sala não encontrada'; end if;
  if v_room.host_id = auth.uid() then raise exception 'Mestre não entra como jogador'; end if;

  select * into v_existing from public.game_players
    where room_id = v_room.id and user_id = auth.uid();
  if found then return jsonb_build_object('id',v_room.id,'code',v_room.code,'seat',v_existing.seat); end if;

  if v_room.phase <> 'lobby' then raise exception 'Partida já iniciada'; end if;
  select s::smallint into v_seat from generate_series(1,4) s
    where not exists (select 1 from public.game_players p where p.room_id=v_room.id and p.seat=s)
    order by s limit 1;
  if v_seat is null then raise exception 'Sala completa'; end if;
  insert into public.game_players(room_id,user_id,seat,nickname)
    values (v_room.id,auth.uid(),v_seat,v_nickname);
  insert into public.game_events(room_id,actor_id,kind,payload)
    values (v_room.id,auth.uid(),'player_joined',jsonb_build_object('seat',v_seat));
  return jsonb_build_object('id',v_room.id,'code',v_room.code,'seat',v_seat);
end $$;

create or replace function game_private.start_room(p_room uuid)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare v_room public.game_rooms%rowtype; v_seat smallint;
begin
  if auth.uid() is null then raise exception 'Autenticação necessária'; end if;
  select * into v_room from public.game_rooms where id=p_room for update;
  if not found or v_room.host_id <> auth.uid() then raise exception 'Somente o mestre pode iniciar'; end if;
  if v_room.phase <> 'lobby' then raise exception 'Partida já iniciada'; end if;
  select min(seat) into v_seat from public.game_players where room_id=p_room;
  if v_seat is null then raise exception 'A sala precisa de um jogador'; end if;
  update public.game_rooms set phase='ready',current_seat=v_seat,revision=revision+1,updated_at=now() where id=p_room;
  insert into public.game_events(room_id,actor_id,kind) values (p_room,auth.uid(),'started');
  return true;
end $$;

create or replace function game_private.roll_die(p_room uuid)
returns integer language plpgsql security definer set search_path = ''
as $$
declare v_room public.game_rooms%rowtype; v_actor uuid; v_roll integer;
begin
  if auth.uid() is null then raise exception 'Autenticação necessária'; end if;
  select * into v_room from public.game_rooms where id=p_room for update;
  if not found or v_room.phase <> 'ready' then raise exception 'Não é hora de lançar o dado'; end if;
  select user_id into v_actor from public.game_players where room_id=p_room and seat=v_room.current_seat;
  if v_actor is distinct from auth.uid() then raise exception 'Não é o seu turno'; end if;
  v_roll := floor(random()*6)::integer + 1;
  update public.game_rooms set phase='moving',die_roll=v_roll,remaining_steps=v_roll,
    award_used=false,revision=revision+1,updated_at=now() where id=p_room;
  insert into public.game_events(room_id,actor_id,kind,payload)
    values(p_room,auth.uid(),'die_rolled',jsonb_build_object('value',v_roll));
  return v_roll;
end $$;

create or replace function game_private.move_pawn(p_room uuid, p_node integer)
returns integer language plpgsql security definer set search_path = ''
as $$
declare v_room public.game_rooms%rowtype; v_player public.game_players%rowtype; v_old integer; v_remaining integer;
begin
  if auth.uid() is null then raise exception 'Autenticação necessária'; end if;
  select * into v_room from public.game_rooms where id=p_room for update;
  if not found or v_room.phase <> 'moving' or v_room.remaining_steps < 1 then raise exception 'Movimentação não permitida'; end if;
  select * into v_player from public.game_players where room_id=p_room and seat=v_room.current_seat for update;
  if not found or v_player.user_id <> auth.uid() then raise exception 'Não é o seu turno'; end if;
  v_old := v_player.node_id;
  if p_node is null or p_node < 0 or p_node > 47 or not (
      abs(p_node-v_old) = 4
      or (v_old / 4 = p_node / 4 and (v_old / 4) % 2 = 0 and abs(p_node-v_old)=1)
    ) then
    raise exception 'Essa casa não é vizinha';
  end if;
  v_remaining := v_room.remaining_steps - 1;
  update public.game_players set node_id=p_node where id=v_player.id;
  update public.game_rooms set remaining_steps=v_remaining,
    phase=case when v_remaining=0 then 'challenge' else 'moving' end,
    revision=revision+1,updated_at=now() where id=p_room;
  insert into public.game_events(room_id,actor_id,kind,payload)
    values(p_room,auth.uid(),'pawn_moved',jsonb_build_object('from',v_old,'to',p_node));
  return v_remaining;
end $$;

create or replace function game_private.award_element(p_room uuid, p_symbol text)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare
  v_room public.game_rooms%rowtype; v_player public.game_players%rowtype;
  v_symbols text[] := array[
   'H','He','Li','Be','B','C','N','O','F','Ne','Na','Mg','Al','Si','P','S','Cl','Ar',
   'K','Ca','Ga','Ge','As','Se','Br','Kr','Rb','Sr','In','Sn','Sb','Te','I','Xe',
   'Cs','Ba','Tl','Pb','Bi','Po','At','Rn','Fr','Ra','Nh','Fl','Mc','Lv','Ts','Og'
  ];
begin
  if auth.uid() is null then raise exception 'Autenticação necessária'; end if;
  select * into v_room from public.game_rooms where id=p_room for update;
  if not found or v_room.host_id <> auth.uid() then raise exception 'Somente o mestre pode validar'; end if;
  if v_room.phase <> 'challenge' or v_room.award_used then raise exception 'Nenhuma conquista disponível'; end if;
  select * into v_player from public.game_players where room_id=p_room and seat=v_room.current_seat;
  if not found then raise exception 'Jogador não encontrado'; end if;
  -- Mesma correspondência de casas do mapa TypeScript.
  if ((v_player.node_id * 17) % 48) >= 20 then raise exception 'Casa atual não é de identificação'; end if;
  if p_symbol is null or not (p_symbol = any(v_symbols)) then raise exception 'Elemento inválido'; end if;
  if exists(select 1 from public.game_claims where room_id=p_room and symbol=p_symbol) then
    raise exception 'Elemento já conquistado nesta sala';
  end if;
  insert into public.game_claims(room_id,symbol,owner_id) values(p_room,p_symbol,v_player.user_id);
  update public.game_rooms set award_used=true,revision=revision+1,updated_at=now() where id=p_room;
  insert into public.game_events(room_id,actor_id,kind,payload)
    values(p_room,auth.uid(),'element_claimed',jsonb_build_object('symbol',p_symbol,'seat',v_player.seat));
  return true;
end $$;

create or replace function game_private.end_turn(p_room uuid)
returns integer language plpgsql security definer set search_path = ''
as $$
declare v_room public.game_rooms%rowtype; v_actor uuid; v_next smallint;
begin
  if auth.uid() is null then raise exception 'Autenticação necessária'; end if;
  select * into v_room from public.game_rooms where id=p_room for update;
  if not found or v_room.phase <> 'challenge' then raise exception 'O movimento ainda não terminou'; end if;
  select user_id into v_actor from public.game_players where room_id=p_room and seat=v_room.current_seat;
  if auth.uid() <> v_room.host_id and auth.uid() is distinct from v_actor then
    raise exception 'Apenas o mestre ou jogador atual pode encerrar o turno';
  end if;
  select min(seat) into v_next from public.game_players where room_id=p_room and seat>v_room.current_seat;
  if v_next is null then select min(seat) into v_next from public.game_players where room_id=p_room; end if;
  update public.game_rooms set phase='ready',current_seat=v_next,die_roll=null,
    remaining_steps=0,award_used=false,revision=revision+1,updated_at=now() where id=p_room;
  insert into public.game_events(room_id,actor_id,kind,payload)
    values(p_room,auth.uid(),'turn_ended',jsonb_build_object('next_seat',v_next));
  return v_next;
end $$;

-- Wrappers expostos via PostgREST, sem privilégios adicionais.
create or replace function public.game_create_room(p_name text)
returns jsonb language sql security invoker set search_path = ''
as $$ select game_private.create_room(p_name); $$;
create or replace function public.game_join_room(p_code text,p_nickname text)
returns jsonb language sql security invoker set search_path = ''
as $$ select game_private.join_room(p_code,p_nickname); $$;
create or replace function public.game_start_room(p_room uuid)
returns boolean language sql security invoker set search_path = ''
as $$ select game_private.start_room(p_room); $$;
create or replace function public.game_roll_die(p_room uuid)
returns integer language sql security invoker set search_path = ''
as $$ select game_private.roll_die(p_room); $$;
create or replace function public.game_move_pawn(p_room uuid,p_node integer)
returns integer language sql security invoker set search_path = ''
as $$ select game_private.move_pawn(p_room,p_node); $$;
create or replace function public.game_award_element(p_room uuid,p_symbol text)
returns boolean language sql security invoker set search_path = ''
as $$ select game_private.award_element(p_room,p_symbol); $$;
create or replace function public.game_end_turn(p_room uuid)
returns integer language sql security invoker set search_path = ''
as $$ select game_private.end_turn(p_room); $$;

revoke all on all functions in schema game_private from public, anon;
grant execute on all functions in schema game_private to authenticated;
revoke all on function public.game_create_room(text) from public, anon;
revoke all on function public.game_join_room(text,text) from public, anon;
revoke all on function public.game_start_room(uuid) from public, anon;
revoke all on function public.game_roll_die(uuid) from public, anon;
revoke all on function public.game_move_pawn(uuid,integer) from public, anon;
revoke all on function public.game_award_element(uuid,text) from public, anon;
revoke all on function public.game_end_turn(uuid) from public, anon;
grant execute on function public.game_create_room(text) to authenticated;
grant execute on function public.game_join_room(text,text) to authenticated;
grant execute on function public.game_start_room(uuid) to authenticated;
grant execute on function public.game_roll_die(uuid) to authenticated;
grant execute on function public.game_move_pawn(uuid,integer) to authenticated;
grant execute on function public.game_award_element(uuid,text) to authenticated;
grant execute on function public.game_end_turn(uuid) to authenticated;

-- Notificações para clientes autorizados por RLS.
do $$
declare v_table text;
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    foreach v_table in array array['game_rooms','game_players','game_claims'] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname='supabase_realtime' and schemaname='public' and tablename=v_table
      ) then
        execute format('alter publication supabase_realtime add table public.%I',v_table);
      end if;
    end loop;
  end if;
end $$;
