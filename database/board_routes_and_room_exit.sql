-- Etapa: rotas de madeira e saída segura das salas.
-- A fonte de verdade da adjacência é a tabela privada; só o servidor valida movimento.
create table if not exists game_private.board_edges (
  a integer not null check(a between 0 and 47),
  b integer not null check(b between 0 and 47 and b<>a),
  primary key(a,b)
);
revoke all on game_private.board_edges from public, anon, authenticated;
insert into game_private.board_edges(a,b) values
  (0,1),
  (1,2),
  (2,3),
  (3,4),
  (4,5),
  (5,6),
  (6,7),
  (7,8),
  (8,9),
  (9,10),
  (10,11),
  (12,13),
  (13,14),
  (14,15),
  (15,16),
  (16,17),
  (18,19),
  (19,20),
  (20,21),
  (21,22),
  (22,23),
  (24,25),
  (25,26),
  (26,27),
  (27,28),
  (28,29),
  (30,31),
  (31,32),
  (32,33),
  (33,34),
  (34,35),
  (36,37),
  (37,38),
  (38,39),
  (39,40),
  (40,41),
  (42,43),
  (43,44),
  (44,45),
  (45,46),
  (46,47),
  (1,12),
  (1,18),
  (5,24),
  (5,30),
  (9,36),
  (9,42),
  (0,13),
  (0,19),
  (12,18),
  (24,30),
  (36,42),
  (15,17),
  (21,23),
  (27,29),
  (33,35),
  (39,41),
  (45,47),
  (11,38),
  (11,44),
  (29,39),
  (35,45)
on conflict do nothing;

alter table public.game_players add column if not exists active boolean not null default true;
alter table public.game_players drop constraint if exists game_players_room_id_seat_key;
create unique index if not exists game_players_active_seat_uq
  on public.game_players(room_id,seat) where active;

-- O ex-participante deixa de ler dados da sala imediatamente.
create or replace function game_private.is_member(p_room uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists(select 1 from public.game_rooms r
    where r.id=p_room and r.host_id=(select auth.uid()))
  or exists(select 1 from public.game_players p
    where p.room_id=p_room and p.user_id=(select auth.uid()) and p.active);
$$;

create or replace function game_private.join_room(p_code text, p_nickname text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_room public.game_rooms%rowtype;
  v_existing public.game_players%rowtype;
  v_has_existing boolean:=false;
  v_seat smallint;
  v_nickname text := left(trim(coalesce(p_nickname,'')),32);
begin
  if auth.uid() is null then raise exception 'Autenticação necessária'; end if;
  if char_length(v_nickname) < 2 then raise exception 'Apelido deve ter ao menos dois caracteres'; end if;
  select * into v_room from public.game_rooms where code=upper(trim(coalesce(p_code,''))) for update;
  if not found then raise exception 'Sala não encontrada'; end if;
  if v_room.host_id=auth.uid() then raise exception 'Mestre não entra como jogador'; end if;
  if v_room.phase='finished' then raise exception 'Esta sala foi encerrada'; end if;
  select * into v_existing from public.game_players where room_id=v_room.id and user_id=auth.uid();
  v_has_existing:=found;
  if v_has_existing and v_existing.active then
    return jsonb_build_object('id',v_room.id,'code',v_room.code,'seat',v_existing.seat);
  end if;
  if not v_has_existing and v_room.phase<>'lobby' then raise exception 'Partida já iniciada'; end if;
  -- Preferir o assento anterior durante reconexão; nunca ocupar assento ativo.
  if v_has_existing and not exists(select 1 from public.game_players p
    where p.room_id=v_room.id and p.seat=v_existing.seat and p.active) then
    v_seat:=v_existing.seat;
  else
    select s::smallint into v_seat from generate_series(1,4) s
      where not exists(select 1 from public.game_players p where p.room_id=v_room.id and p.seat=s and p.active)
      order by s limit 1;
  end if;
  if v_seat is null then raise exception 'Sala completa'; end if;
  if v_has_existing then
    update public.game_players set active=true,seat=v_seat,nickname=v_nickname
      where id=v_existing.id;
  else
    insert into public.game_players(room_id,user_id,seat,nickname)
      values(v_room.id,auth.uid(),v_seat,v_nickname);
  end if;
  insert into public.game_events(room_id,actor_id,kind,payload)
    values(v_room.id,auth.uid(),'player_joined',jsonb_build_object('seat',v_seat));
  return jsonb_build_object('id',v_room.id,'code',v_room.code,'seat',v_seat);
end $$;

-- Simplicidade e equilíbrio: a partida só começa com jogador ativo.
create or replace function game_private.start_room(p_room uuid)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare v_room public.game_rooms%rowtype; v_seat smallint;
begin
  if auth.uid() is null then raise exception 'Autenticação necessária'; end if;
  select * into v_room from public.game_rooms where id=p_room for update;
  if not found or v_room.host_id<>auth.uid() then raise exception 'Somente o mestre pode iniciar'; end if;
  if v_room.phase<>'lobby' then raise exception 'Partida já iniciada'; end if;
  select min(seat) into v_seat from public.game_players where room_id=p_room and active;
  if v_seat is null then raise exception 'A sala precisa de um jogador'; end if;
  update public.game_rooms set phase='ready',current_seat=v_seat,revision=revision+1,updated_at=now()
  where id=p_room;
  insert into public.game_events(room_id,actor_id,kind) values(p_room,auth.uid(),'started');
  return true;
end $$;

create or replace function game_private.roll_die(p_room uuid)
returns integer language plpgsql security definer set search_path = ''
as $$
declare v_room public.game_rooms%rowtype; v_actor uuid; v_roll integer;
begin
  if auth.uid() is null then raise exception 'Autenticação necessária'; end if;
  select * into v_room from public.game_rooms where id=p_room for update;
  if not found or v_room.phase<>'ready' then raise exception 'Não é hora de lançar o dado'; end if;
  select user_id into v_actor from public.game_players
    where room_id=p_room and seat=v_room.current_seat and active;
  if v_actor is distinct from auth.uid() then raise exception 'Não é o seu turno'; end if;
  v_roll := floor(random()*6)::integer+1;
  update public.game_rooms set phase='moving',die_roll=v_roll,remaining_steps=v_roll,
    award_used=false,revision=revision+1,updated_at=now() where id=p_room;
  insert into public.game_events(room_id,actor_id,kind,payload)
    values(p_room,auth.uid(),'die_rolled',jsonb_build_object('value',v_roll));
  return v_roll;
end $$;

create or replace function game_private.move_pawn(p_room uuid, p_node integer)
returns integer language plpgsql security definer set search_path = ''
as $$
declare v_room public.game_rooms%rowtype; v_player public.game_players%rowtype;
  v_old integer; v_remaining integer;
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
  if p_node is null or not exists(
    select 1 from game_private.board_edges e
      where (e.a=v_old and e.b=p_node) or (e.a=p_node and e.b=v_old)
  ) then raise exception 'Esse galho não está conectado à casa atual'; end if;
  v_remaining:=v_room.remaining_steps-1;
  update public.game_players set node_id=p_node where id=v_player.id;
  update public.game_rooms set remaining_steps=v_remaining,
    phase=case when v_remaining=0 then 'challenge' else 'moving' end,
    revision=revision+1,updated_at=now() where id=p_room;
  insert into public.game_events(room_id,actor_id,kind,payload)
    values(p_room,auth.uid(),'pawn_moved',jsonb_build_object('from',v_old,'to',p_node));
  return v_remaining;
end $$;

create or replace function game_private.end_turn(p_room uuid)
returns integer language plpgsql security definer set search_path = ''
as $$
declare v_room public.game_rooms%rowtype; v_actor uuid; v_next smallint;
begin
  if auth.uid() is null then raise exception 'Autenticação necessária'; end if;
  select * into v_room from public.game_rooms where id=p_room for update;
  if not found or v_room.phase<>'challenge' then raise exception 'O movimento ainda não terminou'; end if;
  select user_id into v_actor from public.game_players where room_id=p_room
    and seat=v_room.current_seat and active;
  if auth.uid()<>v_room.host_id and auth.uid() is distinct from v_actor then
    raise exception 'Apenas o mestre ou jogador atual pode encerrar o turno'; end if;
  select min(seat) into v_next from public.game_players
    where room_id=p_room and active and seat>v_room.current_seat;
  if v_next is null then
    select min(seat) into v_next from public.game_players where room_id=p_room and active;
  end if;
  if v_next is null then raise exception 'Nenhum jogador ativo'; end if;
  update public.game_rooms set phase='ready',current_seat=v_next,die_roll=null,
    remaining_steps=0,award_used=false,revision=revision+1,updated_at=now() where id=p_room;
  insert into public.game_events(room_id,actor_id,kind,payload)
    values(p_room,auth.uid(),'turn_ended',jsonb_build_object('next_seat',v_next));
  return v_next;
end $$;

create or replace function game_private.leave_room(p_room uuid)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare v_room public.game_rooms%rowtype; v_player public.game_players%rowtype; v_next smallint;
begin
  if auth.uid() is null then raise exception 'Autenticação necessária'; end if;
  select * into v_room from public.game_rooms where id=p_room for update;
  if not found then raise exception 'Sala não encontrada'; end if;
  if v_room.host_id=auth.uid() then raise exception 'O mestre deve encerrar a sala'; end if;
  select * into v_player from public.game_players where room_id=p_room
    and user_id=auth.uid() and active for update;
  if not found then raise exception 'Participante não encontrado'; end if;
  update public.game_players set active=false where id=v_player.id;
  if v_room.phase not in ('lobby','finished') and v_room.current_seat=v_player.seat then
    select min(seat) into v_next from public.game_players
      where room_id=p_room and active and seat>v_player.seat;
    if v_next is null then
      select min(seat) into v_next from public.game_players where room_id=p_room and active;
    end if;
    update public.game_rooms set phase=case when v_next is null then 'finished' else 'ready' end,
      current_seat=v_next,die_roll=null,remaining_steps=0,award_used=false,
      revision=revision+1,updated_at=now() where id=p_room;
  end if;
  insert into public.game_events(room_id,actor_id,kind)
    values(p_room,auth.uid(),'player_left');
  return true;
end $$;

create or replace function game_private.close_room(p_room uuid)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare v_room public.game_rooms%rowtype;
begin
  if auth.uid() is null then raise exception 'Autenticação necessária'; end if;
  select * into v_room from public.game_rooms where id=p_room for update;
  if not found or v_room.host_id<>auth.uid() then raise exception 'Somente o mestre pode encerrar a sala'; end if;
  update public.game_rooms set phase='finished',die_roll=null,remaining_steps=0,
    revision=revision+1,updated_at=now() where id=p_room;
  insert into public.game_events(room_id,actor_id,kind)
    values(p_room,auth.uid(),'room_closed');
  return true;
end $$;

create or replace function public.game_leave_room(p_room uuid)
returns boolean language sql security invoker set search_path = ''
as $$ select game_private.leave_room(p_room); $$;
create or replace function public.game_close_room(p_room uuid)
returns boolean language sql security invoker set search_path = ''
as $$ select game_private.close_room(p_room); $$;
revoke all on function game_private.leave_room(uuid) from public,anon;
revoke all on function game_private.close_room(uuid) from public,anon;
grant execute on function game_private.leave_room(uuid) to authenticated;
grant execute on function game_private.close_room(uuid) to authenticated;
revoke all on function public.game_leave_room(uuid) from public,anon;
revoke all on function public.game_close_room(uuid) from public,anon;
grant execute on function public.game_leave_room(uuid) to authenticated;
grant execute on function public.game_close_room(uuid) to authenticated;
