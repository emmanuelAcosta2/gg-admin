-- Detalle de Reportes para un período: conteo de servicios por categoría (con el desglose
-- sueltos/en combo) y facturación por rubro (cada categoría suelta y cada combo, sin repartir
-- el monto del combo entre sus categorías).
--
-- Devuelve un solo objeto JSON:
--   { "categorias": [ {id, nombre, color, sueltos, combo, via: [{nombre, cantidad}]} ],
--     "rubros":     [ {tipo: 'categoria'|'combo', id, nombre, colores: [...], monto} ] }
--
-- Los colores de un combo son los de sus categorías actuales (combo_categorias), no la copia
-- histórica de cada turno: alcanza para el punto de color de la fila y evita mezclar variantes
-- si el combo cambió de composición en el medio del período.
-- Corre con los permisos de quien llama (security invoker), así que RLS sigue aplicando.
create function public.reporte_detalle(p_desde date, p_hasta date) returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with serv as (
    select s.categoria_id, s.origen, s.combo_id
    from public.v_servicios_realizados s
    where s.fecha >= p_desde and s.fecha < p_hasta
  ),
  via as (
    select v.categoria_id, cb.nombre, count(*)::int cantidad
    from serv v
    join public.combos cb on cb.id = v.combo_id
    where v.origen = 'combo'
    group by v.categoria_id, cb.nombre
  ),
  via_agg as (
    select categoria_id, jsonb_agg(jsonb_build_object('nombre', nombre, 'cantidad', cantidad) order by cantidad desc) vias
    from via
    group by categoria_id
  ),
  categorias as (
    select
      c.id, c.nombre, c.color,
      count(*) filter (where s.origen = 'suelto')::int sueltos,
      count(*) filter (where s.origen = 'combo')::int combo,
      coalesce(va.vias, '[]'::jsonb) via
    from public.categorias c
    join serv s on s.categoria_id = c.id
    left join via_agg va on va.categoria_id = c.id
    group by c.id, c.nombre, c.color, va.vias
  ),
  turnos_periodo as (
    select t.id
    from public.turnos t
    where t.estado = 'realizado'
      and (t.inicio at time zone 'America/Montevideo')::date >= p_desde
      and (t.inicio at time zone 'America/Montevideo')::date < p_hasta
  ),
  rubro_categoria as (
    select 'categoria'::text tipo, c.id, c.nombre, jsonb_build_array(c.color) colores, sum(i.precio_cobrado)::int monto
    from public.turno_items i
    join turnos_periodo t on t.id = i.turno_id
    join public.categorias c on c.id = i.categoria_id
    where i.tipo = 'servicio'
    group by c.id, c.nombre, c.color
  ),
  rubro_combo as (
    select
      'combo'::text tipo, cb.id, cb.nombre,
      (select coalesce(jsonb_agg(distinct cat.color), '[]'::jsonb)
         from public.combo_categorias bc join public.categorias cat on cat.id = bc.categoria_id
        where bc.combo_id = cb.id) colores,
      sum(i.precio_cobrado)::int monto
    from public.turno_items i
    join turnos_periodo t on t.id = i.turno_id
    join public.combos cb on cb.id = i.combo_id
    where i.tipo = 'combo'
    group by cb.id, cb.nombre
  )
  select jsonb_build_object(
    'categorias', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', id, 'nombre', nombre, 'color', color, 'sueltos', sueltos, 'combo', combo, 'via', via
      ) order by sueltos + combo desc), '[]'::jsonb)
      from categorias
    ),
    'rubros', (
      select coalesce(jsonb_agg(x order by x.monto desc), '[]'::jsonb)
      from (
        select tipo, id, nombre, colores, monto from rubro_categoria
        union all
        select tipo, id, nombre, colores, monto from rubro_combo
      ) x
    )
  );
$$;

revoke execute on function public.reporte_detalle(date, date) from public, anon;
grant execute on function public.reporte_detalle(date, date) to authenticated;
