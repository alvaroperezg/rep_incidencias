-- COMUNIDADES
create table comunidades (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  direccion text,
  presidente_nombre text,
  presidente_telefono text,
  numero_cuenta text,
  cif text,
  seguro_compania text,
  seguro_poliza text,
  seguro_vencimiento date,
  notas text,
  created_at timestamptz default now()
);

-- TAREAS
create table tareas (
  id uuid primary key default gen_random_uuid(),
  comunidad_id uuid references comunidades(id) on delete cascade,
  titulo text not null,
  descripcion text,
  estado text not null default 'pendiente' check (estado in ('pendiente','en_curso','completada')),
  fecha_estimada date,
  notas text,
  created_at timestamptz default now()
);

-- AVISOS
create table avisos (
  id uuid primary key default gen_random_uuid(),
  comunidad_id uuid references comunidades(id) on delete cascade,
  descripcion text not null,
  estado text not null default 'pendiente' check (estado in ('pendiente','finalizado')),
  finalizado_at timestamptz,
  fotos text[],
  created_at timestamptz default now()
);

-- MEJORAS
create table mejoras (
  id uuid primary key default gen_random_uuid(),
  comunidad_id uuid references comunidades(id) on delete cascade,
  descripcion text not null,
  prioridad text not null default 'media' check (prioridad in ('baja','media','alta')),
  estado text not null default 'pendiente' check (estado in ('pendiente','en_estudio','aprobada')),
  vecino_nombre text,
  created_at timestamptz default now()
);

-- EXTINTORES
create table extintores (
  id uuid primary key default gen_random_uuid(),
  comunidad_id uuid references comunidades(id) on delete cascade,
  unidades int,
  coste_estimado numeric,
  estado text not null default 'pendiente' check (estado in ('pendiente','pagado','pasado')),
  fecha_caducidad date,
  fecha_proxima_revision date,
  notas text,
  created_at timestamptz default now()
);

-- RLS
alter table comunidades enable row level security;
alter table tareas enable row level security;
alter table avisos enable row level security;
alter table mejoras enable row level security;
alter table extintores enable row level security;

-- POLÍTICAS (usuario autenticado accede a todo — app de un solo usuario)
create policy "auth_all" on comunidades for all to authenticated using (true) with check (true);
create policy "auth_all" on tareas for all to authenticated using (true) with check (true);
create policy "auth_all" on avisos for all to authenticated using (true) with check (true);
create policy "auth_all" on mejoras for all to authenticated using (true) with check (true);
create policy "auth_all" on extintores for all to authenticated using (true) with check (true);

-- STORAGE BUCKET para fotos de avisos
insert into storage.buckets (id, name, public) values ('avisos-fotos', 'avisos-fotos', false);
create policy "auth_storage" on storage.objects for all to authenticated using (bucket_id = 'avisos-fotos') with check (bucket_id = 'avisos-fotos');
