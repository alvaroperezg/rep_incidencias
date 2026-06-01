alter policy "auth_all" on comunidades to anon using (true) with check (true);
alter policy "auth_all" on tareas to anon using (true) with check (true);
alter policy "auth_all" on avisos to anon using (true) with check (true);
alter policy "auth_all" on mejoras to anon using (true) with check (true);
alter policy "auth_all" on extintores to anon using (true) with check (true);

drop policy if exists "auth_storage" on storage.objects;
create policy "anon_storage" on storage.objects for all to anon using (bucket_id = 'avisos-fotos') with check (bucket_id = 'avisos-fotos');
