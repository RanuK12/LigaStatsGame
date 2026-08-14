# La tabla del reto diario — el SQL que hay que correr

Las tres tablas del reto (general, fuerza y eficiencia) necesitan una tabla nueva en Supabase.
Hasta que exista, el componente no dibuja nada y el juego sigue funcionando igual: `topDelDia`
devuelve `null` ante cualquier error y `guardarResultadoReto` no rompe la partida si falla.

## Por qué existe

7a0 (11,5 millones de visitas) perdió el 51 % del tráfico en un mes y su respuesta fue partir el
desafío diario en tres tablas en vez de una. Con una tabla hay un primero por día; con tres hay
tres, y el que sale primero en algo es el que lo publica.

Entran los invitados, no solo los registrados. El ranking global sigue siendo de los que tienen
cuenta —esa decisión no cambia—, pero el 87 % de los que juegan no tiene cuenta y una tabla
diaria vacía no la mira nadie.

## El SQL

Correr en el editor SQL del proyecto de Supabase:

```sql
create table if not exists public.reto_diario (
  id          bigint generated always as identity primary key,
  reto        text        not null,
  fecha       date        not null,
  username    text        not null,
  pts         integer     not null default 0,
  ovr         integer     not null default 0,
  pos         integer     not null default 0,
  eficiencia  numeric(5,1) not null default 0,
  creado      timestamptz not null default now()
);

-- Las tres consultas de la pantalla son "el día X ordenado por una columna".
create index if not exists reto_diario_fecha_pts_idx        on public.reto_diario (fecha, pts desc);
create index if not exists reto_diario_fecha_ovr_idx        on public.reto_diario (fecha, ovr desc);
create index if not exists reto_diario_fecha_eficiencia_idx on public.reto_diario (fecha, eficiencia desc);

alter table public.reto_diario enable row level security;

-- Lectura para cualquiera: la tabla del día es pública.
create policy "reto_diario lectura publica"
  on public.reto_diario for select
  to anon, authenticated
  using (true);

-- Escritura para cualquiera, porque el que juega el reto casi nunca tiene cuenta.
create policy "reto_diario alta publica"
  on public.reto_diario for insert
  to anon, authenticated
  with check (true);
```

## Lo que queda sin resolver, dicho de frente

Con `insert` abierto, cualquiera con la clave anónima —que viaja en el bundle, porque el sitio es
estático— puede escribir filas a mano. Para una tabla diaria de un juego de fútbol el daño es que
alguien se ponga primero sin jugar.

Si eso pasa, la solución no es cerrar el insert (mataría la tabla): es una Edge Function que
reciba el resultado y lo valide contra el bombo del día antes de escribir. No se hace ahora
porque el problema todavía no existe y agregar un servidor para prevenirlo es caro.

Mientras tanto, dos límites baratos que ya están en el código: el nombre se corta a 40 caracteres
y solo se escribe una fila por partida terminada.
