export type EstadoTarea = 'pendiente' | 'en_curso' | 'completada'
export type PrioridadIncidencia = 'baja' | 'media' | 'alta'
export type EstadoMejora = 'pendiente' | 'aprobada' | 'en_ejecucion' | 'completada'
export type PrioridadMejora = 'baja' | 'media' | 'alta'
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

export interface Incidencia {
  id: string
  comunidad_id: string | null
  titulo: string
  descripcion: string | null
  estado: EstadoTarea
  prioridad: PrioridadIncidencia | null
  fotos: string[] | null
  fecha_parte: string | null
  fecha_solucion: string | null
  notas: string | null
  created_at: string
  comunidades?: Pick<Comunidad, 'id' | 'nombre'>
}

export interface PlanificacionItem {
  id: string
  comunidad_id: string | null
  descripcion: string
  prioridad: PrioridadMejora
  estado: EstadoMejora
  vecino_nombre: string | null
  fecha_estimada_ejecucion: string | null
  presupuesto_estimado: number | null
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
