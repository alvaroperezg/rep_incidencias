-- Añadir campos que faltan a la tabla tareas
ALTER TABLE tareas
  ADD COLUMN IF NOT EXISTS fotos text[],
  ADD COLUMN IF NOT EXISTS fecha_parte timestamptz default now(),
  ADD COLUMN IF NOT EXISTS fecha_solucion timestamptz,
  ADD COLUMN IF NOT EXISTS prioridad text default 'media'
    check (prioridad in ('baja','media','alta'));

-- Actualizar mejoras para planificación
ALTER TABLE mejoras
  ADD COLUMN IF NOT EXISTS fecha_estimada_ejecucion date,
  ADD COLUMN IF NOT EXISTS presupuesto_estimado numeric;

-- Actualizar constraint de estado en mejoras
ALTER TABLE mejoras DROP CONSTRAINT IF EXISTS mejoras_estado_check;
ALTER TABLE mejoras ADD CONSTRAINT mejoras_estado_check
  CHECK (estado IN ('pendiente','aprobada','en_ejecucion','completada'));

-- Migrar datos de avisos a tareas
INSERT INTO tareas (comunidad_id, titulo, descripcion, estado, fotos, fecha_parte, fecha_solucion, created_at)
SELECT
  comunidad_id,
  descripcion as titulo,
  descripcion,
  CASE WHEN estado = 'finalizado' THEN 'completada' ELSE 'pendiente' END,
  fotos,
  created_at as fecha_parte,
  finalizado_at as fecha_solucion,
  created_at
FROM avisos;

-- Eliminar tabla avisos (ya no se necesita)
DROP TABLE IF EXISTS avisos;
