export type EstadoTarea = 'pendiente' | 'en_curso' | 'completada'
export type EstadoAviso = 'pendiente' | 'finalizado'
export type PrioridadMejora = 'baja' | 'media' | 'alta'
export type EstadoMejora = 'pendiente' | 'en_estudio' | 'aprobada'
export type EstadoExtintor = 'pendiente' | 'pagado' | 'pasado'

export interface Comunidad {
  id: string
  nombre: string
  direccion: string | null
  presidente_nombre: string | null
  presidente_telefono: string | null
  numero_cuenta: string | null
  cif: string | null
  seguro_compania: string | null
  seguro_poliza: string | null
  seguro_vencimiento: string | null
  notas: string | null
  created_at: string
}

export interface Tarea {
  id: string
  comunidad_id: string | null
  titulo: string
  descripcion: string | null
  estado: EstadoTarea
  fecha_estimada: string | null
  notas: string | null
  created_at: string
  comunidades?: Pick<Comunidad, 'id' | 'nombre'>
}

export interface Aviso {
  id: string
  comunidad_id: string | null
  descripcion: string
  estado: EstadoAviso
  finalizado_at: string | null
  fotos: string[] | null
  created_at: string
  comunidades?: Pick<Comunidad, 'id' | 'nombre'>
}

export interface Mejora {
  id: string
  comunidad_id: string | null
  descripcion: string
  prioridad: PrioridadMejora
  estado: EstadoMejora
  vecino_nombre: string | null
  created_at: string
  comunidades?: Pick<Comunidad, 'id' | 'nombre'>
}

export interface Extintor {
  id: string
  comunidad_id: string | null
  unidades: number | null
  coste_estimado: number | null
  estado: EstadoExtintor
  fecha_caducidad: string | null
  fecha_proxima_revision: string | null
  notas: string | null
  created_at: string
  comunidades?: Pick<Comunidad, 'id' | 'nombre'>
}
