-- Resumen por cliente para el listado: cuánto se le facturó, cuántas visitas y la última.
-- Solo cuentan los turnos realizados.
create view public.v_clientes_resumen with (security_invoker = true) as
select
  c.id as cliente_id,
  coalesce(sum(t.total) filter (where t.estado = 'realizado'), 0)::integer as facturado,
  (count(t.id) filter (where t.estado = 'realizado'))::integer as visitas,
  max(t.fecha) filter (where t.estado = 'realizado') as ultima_visita
from public.clientes c
left join public.vehiculos v on v.cliente_id = c.id
left join public.v_turnos_total t on t.vehiculo_id = v.id
group by c.id;

revoke all on public.v_clientes_resumen from anon;
grant select on public.v_clientes_resumen to authenticated;

-- Alta de un cliente con su primer vehículo en una sola transacción.
-- Si la matrícula ya existe, no se crea ni el cliente.
create function public.crear_cliente(
  p_nombre text,
  p_telefono text,
  p_notas text,
  p_matricula text,
  p_marca_modelo text,
  p_tamano text
) returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id bigint;
begin
  insert into public.clientes (nombre, telefono, notas)
  values (p_nombre, p_telefono, p_notas)
  returning id into v_id;

  if p_matricula is not null and length(btrim(p_matricula)) > 0 then
    insert into public.vehiculos (cliente_id, matricula, marca_modelo, tamano)
    values (v_id, p_matricula, coalesce(p_marca_modelo, ''), coalesce(p_tamano, 'mediano'));
  end if;

  return v_id;
end;
$$;

revoke execute on function public.crear_cliente(text, text, text, text, text, text) from public, anon;
grant execute on function public.crear_cliente(text, text, text, text, text, text) to authenticated;
