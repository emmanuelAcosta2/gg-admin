-- Turnos realizados de un período, con filtro opcional por categoría o por combo.
--
-- Devuelve un solo objeto JSON para no chocar con el tope de filas de la API:
--   { "cantidad": n, "total": pesos, "ids": [ids de la página, del más nuevo al más viejo] }
-- "cantidad" y "total" cubren todos los turnos que cumplen el filtro; "ids" solo la página pedida.
--
-- Filtrar por categoría incluye los turnos donde esa categoría vino suelta o dentro de un combo
-- (usa la copia de categorías del combo). El total es el de cada turno completo.
-- Corre con los permisos de quien llama (security invoker), así que RLS sigue aplicando.
create function public.registro_turnos(
  p_desde date,
  p_hasta date,
  p_categoria bigint default null,
  p_combo bigint default null,
  p_limite integer default 60,
  p_desplazamiento integer default 0
) returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with base as (
    select t.id, t.inicio, t.total
    from public.v_turnos_total t
    where t.estado = 'realizado'
      and t.fecha >= p_desde
      and t.fecha < p_hasta
      and (
        p_categoria is null or exists (
          select 1
          from public.turno_items i
          where i.turno_id = t.id
            and (
              i.categoria_id = p_categoria
              or exists (
                select 1 from public.turno_item_categorias c
                where c.item_id = i.id and c.categoria_id = p_categoria
              )
            )
        )
      )
      and (
        p_combo is null or exists (
          select 1 from public.turno_items i where i.turno_id = t.id and i.combo_id = p_combo
        )
      )
  )
  select jsonb_build_object(
    'cantidad', (select count(*) from base),
    'total', (select coalesce(sum(total), 0) from base),
    'ids', (
      select coalesce(jsonb_agg(id order by inicio desc), '[]'::jsonb)
      from (
        select id, inicio from base order by inicio desc limit greatest(p_limite, 0) offset greatest(p_desplazamiento, 0)
      ) pagina
    )
  );
$$;

revoke execute on function public.registro_turnos(date, date, bigint, bigint, integer, integer) from public, anon;
grant execute on function public.registro_turnos(date, date, bigint, bigint, integer, integer) to authenticated;
