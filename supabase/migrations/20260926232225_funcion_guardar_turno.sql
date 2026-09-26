-- Crea o edita un turno junto con sus ítems, en una sola transacción.
--
-- p_items es un arreglo JSON: [{"tipo":"servicio","categoria_id":1,"precio":600,"nota":null},
--                              {"tipo":"combo","combo_id":2,"precio":2500,"nota":"..."}]
-- Al editar se reemplazan todos los ítems; el estado del turno no cambia.
-- Corre con los permisos de quien llama (security invoker), así que RLS sigue aplicando.
create function public.guardar_turno(
  p_id bigint,
  p_vehiculo_id bigint,
  p_inicio timestamptz,
  p_medio_pago text,
  p_notas text,
  p_items jsonb
) returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id     bigint;
  v_estado text;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Un turno necesita al menos un servicio o combo' using errcode = '22023';
  end if;

  if p_id is null then
    insert into public.turnos (vehiculo_id, inicio, medio_pago, notas)
    values (p_vehiculo_id, p_inicio, p_medio_pago, p_notas)
    returning id into v_id;
  else
    select estado into v_estado from public.turnos where id = p_id for update;
    if not found then
      raise exception 'Turno inexistente' using errcode = 'P0002';
    end if;
    if v_estado = 'cancelado' then
      raise exception 'Un turno cancelado no se edita; volvelo a agendar primero' using errcode = '22023';
    end if;

    update public.turnos
       set vehiculo_id = p_vehiculo_id, inicio = p_inicio, medio_pago = p_medio_pago, notas = p_notas
     where id = p_id
    returning id into v_id;

    delete from public.turno_items where turno_id = v_id;
  end if;

  insert into public.turno_items (turno_id, tipo, categoria_id, combo_id, precio_cobrado, nota_ajuste)
  select v_id, x.tipo, x.categoria_id, x.combo_id, x.precio, nullif(btrim(x.nota), '')
  from jsonb_to_recordset(p_items) as x (tipo text, categoria_id bigint, combo_id bigint, precio integer, nota text);

  return v_id;
end;
$$;

revoke execute on function public.guardar_turno(bigint, bigint, timestamptz, text, text, jsonb) from public, anon;
grant execute on function public.guardar_turno(bigint, bigint, timestamptz, text, text, jsonb) to authenticated;
