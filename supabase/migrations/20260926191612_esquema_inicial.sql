-- Esquema inicial de GyG Taller.
--
-- Decisiones:
--  * Un solo usuario (el dueño). Cada fila lleva owner_id y las políticas RLS lo exigen, así que
--    aunque alguien lograra registrarse en Supabase Auth no vería ni escribiría nada.
--  * Los precios son enteros en pesos uruguayos, sin decimales.
--  * El total de un turno no se guarda: sale de la vista v_turnos_total (suma de sus ítems).
--  * Cuando un ítem es un combo se guarda una copia de las categorías que incluía ese día
--    (turno_item_categorias), para que editar el combo después no altere el historial.
--  * Categorías y combos se desactivan, no se borran (activa / activo).

-- ---------------------------------------------------------------- tablas

create table public.clientes (
  id          bigint generated always as identity primary key,
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre      text not null check (length(btrim(nombre)) > 0),
  telefono    text,
  notas       text,
  creado_en   timestamptz not null default now()
);

create table public.vehiculos (
  id            bigint generated always as identity primary key,
  owner_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  cliente_id    bigint not null references public.clientes (id) on delete restrict,
  matricula     text not null check (length(btrim(matricula)) > 0),
  marca_modelo  text not null default '',
  tamano        text not null default 'mediano' check (tamano in ('chico', 'mediano', 'grande', 'camioneta')),
  creado_en     timestamptz not null default now()
);
-- La matrícula es única sin importar mayúsculas ni espacios ("sab 1234" = "SAB1234").
create unique index vehiculos_matricula_uq
  on public.vehiculos (owner_id, upper(regexp_replace(matricula, '\s', '', 'g')));
create index vehiculos_cliente_idx on public.vehiculos (cliente_id);

create table public.categorias (
  id                 bigint generated always as identity primary key,
  owner_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre             text not null check (length(btrim(nombre)) > 0),
  color              text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  precio_referencia  integer check (precio_referencia >= 0),
  activa             boolean not null default true,
  creado_en          timestamptz not null default now()
);
create unique index categorias_nombre_uq on public.categorias (owner_id, lower(nombre));

create table public.combos (
  id                 bigint generated always as identity primary key,
  owner_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre             text not null check (length(btrim(nombre)) > 0),
  precio_referencia  integer not null check (precio_referencia >= 0),
  activo             boolean not null default true,
  creado_en          timestamptz not null default now()
);
create unique index combos_nombre_uq on public.combos (owner_id, lower(nombre));

create table public.combo_categorias (
  combo_id      bigint not null references public.combos (id) on delete cascade,
  categoria_id  bigint not null references public.categorias (id) on delete restrict,
  owner_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  primary key (combo_id, categoria_id)
);
create index combo_categorias_categoria_idx on public.combo_categorias (categoria_id);

create table public.turnos (
  id          bigint generated always as identity primary key,
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  vehiculo_id bigint not null references public.vehiculos (id) on delete restrict,
  inicio      timestamptz not null,
  estado      text not null default 'agendado' check (estado in ('agendado', 'realizado', 'cancelado')),
  medio_pago  text check (medio_pago in ('efectivo', 'transferencia', 'debito', 'credito')),
  notas       text,
  creado_en   timestamptz not null default now(),
  -- Un turno realizado siempre dice cómo se cobró.
  constraint turnos_realizado_con_pago check (estado <> 'realizado' or medio_pago is not null)
);
create index turnos_vehiculo_idx on public.turnos (vehiculo_id);
create index turnos_inicio_idx on public.turnos (inicio);

create table public.turno_items (
  id              bigint generated always as identity primary key,
  owner_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  turno_id        bigint not null references public.turnos (id) on delete cascade,
  tipo            text not null check (tipo in ('servicio', 'combo')),
  categoria_id    bigint references public.categorias (id) on delete restrict,
  combo_id        bigint references public.combos (id) on delete restrict,
  precio_cobrado  integer not null check (precio_cobrado >= 0),
  nota_ajuste     text,
  constraint turno_items_tipo_coherente check (
    (tipo = 'servicio' and categoria_id is not null and combo_id is null) or
    (tipo = 'combo' and combo_id is not null and categoria_id is null)
  )
);
create index turno_items_turno_idx on public.turno_items (turno_id);
create index turno_items_categoria_idx on public.turno_items (categoria_id) where categoria_id is not null;
create index turno_items_combo_idx on public.turno_items (combo_id) where combo_id is not null;

-- Copia de las categorías que incluía el combo al momento de cobrarlo.
create table public.turno_item_categorias (
  item_id       bigint not null references public.turno_items (id) on delete cascade,
  categoria_id  bigint not null references public.categorias (id) on delete restrict,
  owner_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  primary key (item_id, categoria_id)
);
create index turno_item_categorias_categoria_idx on public.turno_item_categorias (categoria_id);

-- ---------------------------------------------------------------- copia de categorías del combo

create function public.copiar_categorias_del_combo() returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  delete from public.turno_item_categorias where item_id = new.id;
  if new.tipo = 'combo' then
    insert into public.turno_item_categorias (item_id, categoria_id, owner_id)
    select new.id, cc.categoria_id, new.owner_id
    from public.combo_categorias cc
    where cc.combo_id = new.combo_id;
  end if;
  return new;
end;
$$;

create trigger turno_items_copiar_categorias
  after insert or update of tipo, combo_id on public.turno_items
  for each row execute function public.copiar_categorias_del_combo();

-- ---------------------------------------------------------------- vistas

-- Un turno con su total y su fecha local (Montevideo).
create view public.v_turnos_total with (security_invoker = true) as
select
  t.id,
  t.vehiculo_id,
  t.inicio,
  (t.inicio at time zone 'America/Montevideo')::date as fecha,
  t.estado,
  t.medio_pago,
  t.notas,
  coalesce(sum(i.precio_cobrado), 0)::integer as total,
  count(i.id)::integer as cantidad_items
from public.turnos t
left join public.turno_items i on i.turno_id = t.id
group by t.id;

-- Un renglón por servicio realizado, sea suelto o venga dentro de un combo.
-- Alimenta el conteo de servicios por categoría de Reportes.
create view public.v_servicios_realizados with (security_invoker = true) as
select
  t.id as turno_id,
  (t.inicio at time zone 'America/Montevideo')::date as fecha,
  i.id as item_id,
  i.categoria_id,
  'suelto'::text as origen,
  null::bigint as combo_id
from public.turnos t
join public.turno_items i on i.turno_id = t.id and i.tipo = 'servicio'
where t.estado = 'realizado'
union all
select
  t.id,
  (t.inicio at time zone 'America/Montevideo')::date,
  i.id,
  ic.categoria_id,
  'combo',
  i.combo_id
from public.turnos t
join public.turno_items i on i.turno_id = t.id and i.tipo = 'combo'
join public.turno_item_categorias ic on ic.item_id = i.id
where t.estado = 'realizado';

-- ---------------------------------------------------------------- seguridad (RLS)

do $$
declare
  tabla text;
begin
  foreach tabla in array array[
    'clientes', 'vehiculos', 'categorias', 'combos', 'combo_categorias',
    'turnos', 'turno_items', 'turno_item_categorias'
  ] loop
    execute format('alter table public.%I enable row level security', tabla);
    execute format('revoke all on public.%I from anon', tabla);
    execute format('grant select, insert, update, delete on public.%I to authenticated', tabla);

    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = owner_id)',
                   tabla || '_select', tabla);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = owner_id)',
                   tabla || '_insert', tabla);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id)',
                   tabla || '_update', tabla);
    execute format('create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = owner_id)',
                   tabla || '_delete', tabla);
  end loop;
end
$$;

revoke all on public.v_turnos_total, public.v_servicios_realizados from anon;
grant select on public.v_turnos_total, public.v_servicios_realizados to authenticated;
