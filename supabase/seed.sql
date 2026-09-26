-- Datos de ejemplo SOLO para desarrollo. Se corre con `npm run db:seed`, después de crear el
-- usuario del dueño en Authentication > Users. Es idempotente: si ya hay categorías, no hace nada.
-- Las fechas son relativas a hoy: hace ~8 semanas hasta 1 semana hacia adelante.

do $$
declare
  uid        uuid := (select id from auth.users order by created_at limit 1);
  lav bigint; tap bigint; cer bigint; ali bigint; pol bigint;
  cb1 bigint; cb2 bigint; cb3 bigint;
  cats_w     bigint[];
  combos_a   bigint[];
  veh        bigint[];
  d          date;
  hs         int[];
  h          int;
  n          int;
  v          bigint;
  tam        text;
  m          numeric;
  r          float;
  kinds      text[];
  kind       text;
  used       bigint[];
  pick       bigint;
  base       integer;
  precio     integer;
  nota       text;
  est        text;
  pago       text;
  turno      bigint;
  hoy_h      int := extract(hour from now() at time zone 'America/Montevideo');
  hoy        date := (now() at time zone 'America/Montevideo')::date;
begin
  if uid is null then
    raise exception 'Creá primero el usuario del dueño en Authentication > Users.';
  end if;
  if exists (select 1 from public.categorias where owner_id = uid) then
    raise notice 'Ya hay datos; no se siembra nada.';
    return;
  end if;

  insert into public.categorias (owner_id, nombre, color, precio_referencia) values (uid, 'Lavado', '#2F8CFF', 600) returning id into lav;
  insert into public.categorias (owner_id, nombre, color, precio_referencia) values (uid, 'Tapizado', '#F28C1B', 2200) returning id into tap;
  insert into public.categorias (owner_id, nombre, color, precio_referencia) values (uid, 'Cerámico', '#A78BFA', 9500) returning id into cer;
  insert into public.categorias (owner_id, nombre, color, precio_referencia) values (uid, 'Alineación y balanceo', '#F5C400', 1400) returning id into ali;
  insert into public.categorias (owner_id, nombre, color, precio_referencia) values (uid, 'Polarizado', '#3DD6C4', 3800) returning id into pol;

  insert into public.combos (owner_id, nombre, precio_referencia) values (uid, 'Lavado + Tapizado', 2500) returning id into cb1;
  insert into public.combos (owner_id, nombre, precio_referencia) values (uid, 'Full Detailing', 11500) returning id into cb2;
  insert into public.combos (owner_id, nombre, precio_referencia) values (uid, 'Lavado + Alineación', 1800) returning id into cb3;
  insert into public.combo_categorias (owner_id, combo_id, categoria_id) values
    (uid, cb1, lav), (uid, cb1, tap),
    (uid, cb2, lav), (uid, cb2, tap), (uid, cb2, cer),
    (uid, cb3, lav), (uid, cb3, ali);

  insert into public.clientes (owner_id, nombre, telefono, notas) values
    (uid, 'Martín Rodríguez', '099 123 456', 'Prefiere turnos por la mañana.'),
    (uid, 'Lucía Fernández', '098 765 432', null),
    (uid, 'Diego Pereira', '094 221 908', 'Camioneta y auto familiar.'),
    (uid, 'Camila Techera', '091 334 770', null),
    (uid, 'Nicolás Silva', '099 888 210', null),
    (uid, 'Valentina Acosta', '096 452 118', 'Cliente frecuente, lavado cada 15 días.'),
    (uid, 'Rodrigo Long', '092 610 447', null),
    (uid, 'Sofía Martínez', '098 101 332', null);

  insert into public.vehiculos (owner_id, cliente_id, matricula, marca_modelo, tamano)
  select uid, c.id, x.mat, x.mm, x.tam
  from (values
    ('Martín Rodríguez', 'SAB 1234', 'Chevrolet Onix', 'mediano'),
    ('Lucía Fernández', 'AAC 5521', 'Volkswagen Gol', 'chico'),
    ('Diego Pereira', 'SBK 8890', 'Toyota Hilux', 'camioneta'),
    ('Diego Pereira', 'SCD 1020', 'Ford Ka', 'chico'),
    ('Camila Techera', 'SAX 4417', 'Renault Duster', 'grande'),
    ('Nicolás Silva', 'SBB 7302', 'Fiat Cronos', 'mediano'),
    ('Valentina Acosta', 'SAH 2266', 'Peugeot 208', 'chico'),
    ('Rodrigo Long', 'SCA 9911', 'Toyota Corolla', 'mediano'),
    ('Sofía Martínez', 'SBM 3050', 'Nissan Kicks', 'grande')
  ) as x (cliente, mat, mm, tam)
  join public.clientes c on c.nombre = x.cliente and c.owner_id = uid;

  select array_agg(id order by id) into veh from public.vehiculos where owner_id = uid;
  cats_w := array[lav, lav, lav, tap, ali, ali, pol, cer];
  combos_a := array[cb1, cb2, cb3];
  perform setseed(0.26);

  for d in select g::date from generate_series(hoy - 55, hoy + 7, interval '1 day') g loop
    continue when extract(isodow from d) = 7;
    n := case when d > hoy then 1 + floor(random() * 3) else 2 + floor(random() * 3) end;
    select array_agg(x order by x) into hs
    from (select unnest(array[9, 10, 11, 12, 14, 15, 16, 17, 18]) as x order by random() limit n) s;

    foreach h in array hs loop
      v := veh[1 + floor(random() * array_length(veh, 1))];
      select tamano into tam from public.vehiculos where id = v;
      m := case tam when 'chico' then 1 when 'mediano' then 1.15 when 'grande' then 1.3 else 1.5 end;

      if d > hoy or (d = hoy and h >= hoy_h) then
        est := 'agendado'; pago := null;
      elsif random() < 0.06 then
        est := 'cancelado'; pago := null;
      else
        est := 'realizado';
        pago := (array['efectivo', 'transferencia', 'debito', 'credito'])[1 + floor(random() * 4)];
      end if;

      insert into public.turnos (owner_id, vehiculo_id, inicio, estado, medio_pago)
      values (uid, v, (d + make_time(h, case when random() < 0.3 then 30 else 0 end, 0)) at time zone 'America/Montevideo', est, pago)
      returning id into turno;

      r := random();
      kinds := case when r < 0.4 then array['s'] when r < 0.62 then array['c']
                    when r < 0.8 then array['c', 's'] else array['s', 's'] end;
      used := array[]::bigint[];

      foreach kind in array kinds loop
        loop
          pick := case when kind = 'c' then combos_a[1 + floor(random() * 3)] else cats_w[1 + floor(random() * 8)] end;
          exit when not (pick = any (used));
        end loop;
        used := used || pick;

        if kind = 'c' then
          select precio_referencia into base from public.combos where id = pick;
        else
          select precio_referencia into base from public.categorias where id = pick;
        end if;
        precio := round(base * m / 50.0)::integer * 50;
        nota := case when m <> 1 then 'Ajuste por tamaño: ' || initcap(tam) else null end;
        if random() < 0.12 then
          precio := round(precio * 0.9 / 50.0)::integer * 50;
          nota := 'Descuento cliente frecuente';
        end if;

        if kind = 'c' then
          insert into public.turno_items (owner_id, turno_id, tipo, combo_id, precio_cobrado, nota_ajuste)
          values (uid, turno, 'combo', pick, precio, nota);
        else
          insert into public.turno_items (owner_id, turno_id, tipo, categoria_id, precio_cobrado, nota_ajuste)
          values (uid, turno, 'servicio', pick, precio, nota);
        end if;
      end loop;
    end loop;
  end loop;

  raise notice 'Datos de ejemplo cargados.';
end
$$;
