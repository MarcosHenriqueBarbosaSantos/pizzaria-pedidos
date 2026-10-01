-- Banco da pizzaria: rode este arquivo UMA vez no SQL Editor do Supabase (projeto "Pizzaria Pedidos").

-- Equipe: quem pode ver pedidos (cozinha) e quem pode ver números e custos (gestor)
create table public.equipe (
  user_id uuid primary key references auth.users(id) on delete cascade,
  papel text not null check (papel in ('gestor','cozinha')),
  email text not null default '',
  criado_em timestamptz not null default now()
);
alter table public.equipe enable row level security;

create schema if not exists interno;
revoke all on schema interno from public;
grant usage on schema interno to authenticated;

create or replace function interno.papel() returns text
language sql stable security definer set search_path = '' as $$
  select papel from public.equipe where user_id = (select auth.uid())
$$;
revoke all on function interno.papel() from public;
grant execute on function interno.papel() to authenticated;

create policy "ver a propria linha ou tudo se gestor" on public.equipe
  for select to authenticated
  using (user_id = (select auth.uid()) or (select interno.papel()) = 'gestor');

-- Pedidos
create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  numero bigint generated always as identity (start with 1001),
  token uuid not null default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  cliente_nome text not null default '',
  cliente_tel text not null default '',
  tipo text not null check (tipo in ('entrega','retirada')),
  endereco text not null default '',
  pagamento text not null default '',
  pag_tipo text not null default '',
  canal text not null default 'App',
  frete numeric(10,2) not null default 0 check (frete >= 0),
  desconto numeric(10,2) not null default 0 check (desconto >= 0),
  total numeric(10,2) not null check (total >= 0),
  status smallint not null default 0 check (status between 0 and 4),
  cancelado boolean not null default false,
  itens jsonb not null check (jsonb_typeof(itens) = 'array'),
  origem_id text unique
);
create index pedidos_criado_em_idx on public.pedidos (criado_em desc);
create unique index pedidos_token_idx on public.pedidos (token);
create index pedidos_tel_idx on public.pedidos (cliente_tel, criado_em desc);
alter table public.pedidos enable row level security;

create policy "equipe le pedidos" on public.pedidos
  for select to authenticated using ((select interno.papel()) is not null);
create policy "equipe atualiza pedidos" on public.pedidos
  for update to authenticated
  using ((select interno.papel()) is not null) with check ((select interno.papel()) is not null);
create policy "gestor lanca vendas" on public.pedidos
  for insert to authenticated with check ((select interno.papel()) = 'gestor');
create policy "gestor apaga vendas lancadas" on public.pedidos
  for delete to authenticated using ((select interno.papel()) = 'gestor' and canal <> 'App');

-- Configurações do gestor (custos, ficha técnica)
create table public.config (
  chave text primary key,
  valor jsonb not null,
  atualizado_em timestamptz not null default now()
);
alter table public.config enable row level security;
create policy "gestor le e grava config" on public.config
  for all to authenticated
  using ((select interno.papel()) = 'gestor') with check ((select interno.papel()) = 'gestor');

-- Cliente sem login não toca nas tabelas; só usa as funções abaixo
revoke all on public.pedidos, public.equipe, public.config from anon;

-- Cliente cria o pedido
create or replace function public.criar_pedido(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_nome text := btrim(coalesce(p->>'cliente_nome',''));
  v_tel text := regexp_replace(coalesce(p->>'cliente_tel',''), '\D', '', 'g');
  v_tipo text := coalesce(p->>'tipo','');
  v_end text := btrim(coalesce(p->>'endereco',''));
  v_itens jsonb := p->'itens';
  v_total numeric; v_frete numeric; v_desc numeric;
  r record;
begin
  if char_length(v_nome) not between 2 and 80 then raise exception 'Informe o nome.' using errcode = '22023'; end if;
  if char_length(v_tel) not between 10 and 13 then raise exception 'Informe um WhatsApp com DDD.' using errcode = '22023'; end if;
  if v_tipo not in ('entrega','retirada') then raise exception 'Escolha entrega ou retirada.' using errcode = '22023'; end if;
  if v_tipo = 'entrega' and char_length(v_end) not between 5 and 200 then raise exception 'Informe o endereço de entrega.' using errcode = '22023'; end if;
  if v_itens is null or jsonb_typeof(v_itens) <> 'array' or jsonb_array_length(v_itens) not between 1 and 30 or pg_column_size(v_itens) > 20000 then
    raise exception 'Pedido sem itens ou grande demais.' using errcode = '22023'; end if;
  begin
    v_total := round((p->>'total')::numeric, 2);
    v_frete := round(coalesce((p->>'frete')::numeric, 0), 2);
    v_desc := round(coalesce((p->>'desconto')::numeric, 0), 2);
  exception when others then
    raise exception 'Valores do pedido inválidos.' using errcode = '22023';
  end;
  if v_total is null or v_total not between 0 and 5000 or v_frete not between 0 and 200 or v_desc not between 0 and 5000 then
    raise exception 'Valores do pedido inválidos.' using errcode = '22023'; end if;
  if (select count(*) from public.pedidos where cliente_tel = v_tel and criado_em > now() - interval '10 minutes') >= 5 then
    raise exception 'Muitos pedidos em pouco tempo. Aguarde alguns minutos.' using errcode = '22023'; end if;
  insert into public.pedidos (cliente_nome, cliente_tel, tipo, endereco, pagamento, pag_tipo, canal, frete, desconto, total, itens)
  values (v_nome, v_tel, v_tipo, case when v_tipo = 'entrega' then v_end else '' end,
          left(coalesce(p->>'pagamento',''), 80), left(coalesce(p->>'pag_tipo',''), 30), 'App', v_frete, v_desc, v_total, v_itens)
  returning numero, token, criado_em into r;
  return jsonb_build_object('numero', r.numero, 'token', r.token, 'criado_em', r.criado_em);
end $$;
revoke all on function public.criar_pedido(jsonb) from public;
grant execute on function public.criar_pedido(jsonb) to anon, authenticated;

-- Cliente acompanha os próprios pedidos pelo código secreto de cada um
create or replace function public.acompanhar_pedidos(p_tokens uuid[])
returns table (token uuid, numero bigint, status smallint, cancelado boolean)
language sql stable security definer set search_path = '' as $$
  select pe.token, pe.numero, pe.status, pe.cancelado
  from public.pedidos pe
  where pe.token = any (p_tokens[1:30])
$$;
revoke all on function public.acompanhar_pedidos(uuid[]) from public;
grant execute on function public.acompanhar_pedidos(uuid[]) to anon, authenticated;

-- Primeiro login vira gestor, só enquanto a equipe estiver vazia
create or replace function public.primeiro_acesso() returns text
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_papel text;
begin
  if v_uid is null then raise exception 'Faça login primeiro.' using errcode = '28000'; end if;
  select papel into v_papel from public.equipe where user_id = v_uid;
  if v_papel is not null then return v_papel; end if;
  lock table public.equipe in share row exclusive mode;
  if not exists (select 1 from public.equipe) then
    insert into public.equipe (user_id, papel, email)
    values (v_uid, 'gestor', coalesce((select email from auth.users where id = v_uid), ''));
    return 'gestor';
  end if;
  return null;
end $$;
revoke all on function public.primeiro_acesso() from public, anon;
grant execute on function public.primeiro_acesso() to authenticated;

-- Gestor libera ou remove acesso de outras pessoas da equipe
create or replace function public.liberar_acesso(p_email text, p_papel text) returns text
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if (select interno.papel()) is distinct from 'gestor' then raise exception 'Só o gestor libera acessos.' using errcode = '42501'; end if;
  if p_papel not in ('gestor','cozinha') then raise exception 'Papel inválido.' using errcode = '22023'; end if;
  select id into v_id from auth.users where lower(email) = lower(btrim(p_email)) limit 1;
  if v_id is null then raise exception 'Essa pessoa ainda não criou o acesso com esse e-mail.' using errcode = '22023'; end if;
  insert into public.equipe (user_id, papel, email) values (v_id, p_papel, lower(btrim(p_email)))
  on conflict (user_id) do update set papel = excluded.papel;
  return p_papel;
end $$;
revoke all on function public.liberar_acesso(text, text) from public, anon;
grant execute on function public.liberar_acesso(text, text) to authenticated;

create or replace function public.remover_acesso(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if (select interno.papel()) is distinct from 'gestor' then raise exception 'Só o gestor remove acessos.' using errcode = '42501'; end if;
  if p_user = (select auth.uid()) then raise exception 'Você não pode remover o próprio acesso.' using errcode = '22023'; end if;
  delete from public.equipe where user_id = p_user;
end $$;
revoke all on function public.remover_acesso(uuid) from public, anon;
grant execute on function public.remover_acesso(uuid) to authenticated;

-- Tela da cozinha recebe pedidos novos na hora
alter publication supabase_realtime add table public.pedidos;
