-- Crea o edita un combo junto con las categorías que incluye, en una sola transacción.
-- Corre con los permisos de quien llama (security invoker), así que RLS sigue aplicando.
create function public.guardar_combo(
  p_id bigint,
  p_nombre text,
  p_precio integer,
  p_activo boolean,
  p_categorias bigint[]
) returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id bigint;
begin
  if coalesce(array_length(p_categorias, 1), 0) < 2 then
    raise exception 'Un combo necesita al menos dos categorías' using errcode = '22023';
  end if;

  if p_id is null then
    insert into public.combos (nombre, precio_referencia, activo)
    values (p_nombre, p_precio, p_activo)
    returning id into v_id;
  else
    update public.combos
       set nombre = p_nombre, precio_referencia = p_precio, activo = p_activo
     where id = p_id
    returning id into v_id;
    if v_id is null then
      raise exception 'Combo inexistente' using errcode = 'P0002';
    end if;
    delete from public.combo_categorias where combo_id = v_id;
  end if;

  insert into public.combo_categorias (combo_id, categoria_id)
  select v_id, c from unnest(p_categorias) as c;

  return v_id;
end;
$$;

revoke execute on function public.guardar_combo(bigint, text, integer, boolean, bigint[]) from public, anon;
grant execute on function public.guardar_combo(bigint, text, integer, boolean, bigint[]) to authenticated;
