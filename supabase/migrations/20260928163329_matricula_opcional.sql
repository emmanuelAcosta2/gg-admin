-- La matrícula deja de ser obligatoria: hay autos que llegan sin ella todavía, o clientes de
-- los que no se tiene ese dato al momento de cargarlos.
--
-- No borra ni modifica ninguna fila existente: toda matrícula ya cargada cumple igual el check
-- nuevo (más permisivo que el viejo), así que no hace falta tocar los datos.
alter table public.vehiculos alter column matricula drop not null;

alter table public.vehiculos drop constraint vehiculos_matricula_check;
alter table public.vehiculos add constraint vehiculos_matricula_check
  check (matricula is null or length(btrim(matricula)) > 0);
-- ^ NULL = sin matrícula. '' o solo espacios siguen sin ser válidos: si no se sabe, no se carga.

-- vehiculos_matricula_uq (el índice único de la matrícula por dueño) no se toca: Postgres nunca
-- considera dos NULL como iguales, así que varios vehículos sin matrícula del mismo dueño no
-- chocan entre sí. Solo se sigue rechazando una matrícula real repetida.

-- Alta de cliente + primer vehículo: antes solo creaba el vehículo si había matrícula; ahora lo
-- crea si se cargó matrícula O marca/modelo (si ambos quedan vacíos, sigue sin crear vehículo,
-- igual que hoy). La matrícula vacía se guarda como NULL, nunca como ''.
create or replace function public.crear_cliente(
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

  if (p_matricula is not null and length(btrim(p_matricula)) > 0)
     or (p_marca_modelo is not null and length(btrim(p_marca_modelo)) > 0) then
    insert into public.vehiculos (cliente_id, matricula, marca_modelo, tamano)
    values (v_id, nullif(btrim(p_matricula), ''), coalesce(p_marca_modelo, ''), coalesce(p_tamano, 'mediano'));
  end if;

  return v_id;
end;
$$;

revoke execute on function public.crear_cliente(text, text, text, text, text, text) from public, anon;
grant execute on function public.crear_cliente(text, text, text, text, text, text) to authenticated;
