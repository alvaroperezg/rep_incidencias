'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { PlanificacionItem, Comunidad, PrioridadMejora, EstadoMejora } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/alert-dialog'
import { Plus, Trash2, Euro, Calendar, User } from 'lucide-react'
import { toast } from 'sonner'

const prioridadBadge: Record<PrioridadMejora, { label: string; variant: 'red' | 'amber' | 'green' }> = {
  alta: { label: 'Alta', variant: 'red' },
  media: { label: 'Media', variant: 'amber' },
  baja: { label: 'Baja', variant: 'green' },
}

const estadoBadge: Record<EstadoMejora, { label: string; variant: 'amber' | 'blue' | 'purple' | 'green' }> = {
  pendiente: { label: 'Pendiente', variant: 'amber' },
  aprobada: { label: 'Aprobada', variant: 'blue' },
  en_ejecucion: { label: 'En ejecución', variant: 'purple' },
  completada: { label: 'Completada', variant: 'green' },
}

const tabs: EstadoMejora[] = ['pendiente', 'aprobada', 'en_ejecucion', 'completada']
const tabLabels: Record<EstadoMejora, string> = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  en_ejecucion: 'En ejecución',
  completada: 'Completada',
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const selectCls = 'w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
const textareaCls = 'w-full rounded-xl border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none'

export default function PlanificacionPage() {
  const [mejoras, setMejoras] = useState<PlanificacionItem[]>([])
  const [comunidades, setComunidades] = useState<Pick<Comunidad, 'id' | 'nombre'>[]>([])
  const [loading, setLoading] = useState(true)
  const [openNew, setOpenNew] = useState(false)
  const [openDetail, setOpenDetail] = useState(false)
  const [selected, setSelected] = useState<PlanificacionItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [editComunidad, setEditComunidad] = useState('')
  const [editDescripcion, setEditDescripcion] = useState('')
  const [editPrioridad, setEditPrioridad] = useState<PrioridadMejora>('media')
  const [editEstado, setEditEstado] = useState<EstadoMejora>('pendiente')
  const [editFechaEjecucion, setEditFechaEjecucion] = useState('')
  const [editPresupuesto, setEditPresupuesto] = useState('')
  const [editVecino, setEditVecino] = useState('')

  const fetchData = useCallback(async () => {
    const [{ data: m }, { data: c }] = await Promise.all([
      supabase.from('mejoras').select('*, comunidades(id, nombre)').order('created_at', { ascending: false }),
      supabase.from('comunidades').select('id, nombre').order('nombre'),
    ])
    if (m) setMejoras(m)
    if (c) setComunidades(c)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function openDetailSheet(item: PlanificacionItem) {
    setSelected(item)
    setEditComunidad(item.comunidad_id ?? '')
    setEditDescripcion(item.descripcion)
    setEditPrioridad(item.prioridad)
    setEditEstado(item.estado)
    setEditFechaEjecucion(item.fecha_estimada_ejecucion ?? '')
    setEditPresupuesto(item.presupuesto_estimado != null ? String(item.presupuesto_estimado) : '')
    setEditVecino(item.vecino_nombre ?? '')
    setOpenDetail(true)
  }

  async function handleSubmitNew(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData(e.currentTarget)
    const presupuesto = fd.get('presupuesto_estimado') as string
    const { error } = await supabase.from('mejoras').insert({
      comunidad_id: (fd.get('comunidad_id') as string) || null,
      descripcion: fd.get('descripcion') as string,
      prioridad: (fd.get('prioridad') as PrioridadMejora) || 'media',
      estado: (fd.get('estado') as EstadoMejora) || 'pendiente',
      vecino_nombre: (fd.get('vecino_nombre') as string) || null,
      fecha_estimada_ejecucion: (fd.get('fecha_estimada_ejecucion') as string) || null,
      presupuesto_estimado: presupuesto ? Number(presupuesto) : null,
    })
    if (error) {
      toast.error('Error al registrar la mejora')
    } else {
      toast.success('Mejora registrada')
      setOpenNew(false)
      ;(e.target as HTMLFormElement).reset()
      fetchData()
    }
    setSaving(false)
  }

  async function handleUpdate() {
    if (!selected) return
    setSaving(true)
    const { error } = await supabase
      .from('mejoras')
      .update({
        comunidad_id: editComunidad || null,
        descripcion: editDescripcion,
        prioridad: editPrioridad,
        estado: editEstado,
        vecino_nombre: editVecino || null,
        fecha_estimada_ejecucion: editFechaEjecucion || null,
        presupuesto_estimado: editPresupuesto ? Number(editPresupuesto) : null,
      })
      .eq('id', selected.id)
    if (error) {
      toast.error('Error al guardar los cambios')
    } else {
      toast.success('Cambios guardados')
      setOpenDetail(false)
      fetchData()
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!selected) return
    setDeleting(true)
    const { error } = await supabase.from('mejoras').delete().eq('id', selected.id)
    if (error) {
      toast.error('Error al eliminar')
    } else {
      toast.success('Mejora eliminada')
      setConfirmDelete(false)
      setOpenDetail(false)
      fetchData()
    }
    setDeleting(false)
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <h1 className="text-xl font-bold text-foreground">Planificación</h1>

      {loading ? (
        Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
      ) : (
        <Tabs defaultValue="pendiente">
          <TabsList className="overflow-x-auto flex-nowrap">
            {tabs.map((t) => (
              <TabsTrigger key={t} value={t} className="flex-shrink-0">
                {tabLabels[t]} ({mejoras.filter((m) => m.estado === t).length})
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((t) => {
            const items = mejoras.filter((m) => m.estado === t)
            return (
              <TabsContent key={t} value={t}>
                {items.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">Sin mejoras en este estado</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {items.map((item) => {
                      const pb = prioridadBadge[item.prioridad]
                      return (
                        <Card key={item.id} className="cursor-pointer active:scale-[0.98] transition-transform" onClick={() => openDetailSheet(item)}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground line-clamp-2">{item.descripcion}</p>
                                {item.comunidades && <p className="text-xs text-muted-foreground mt-0.5">{item.comunidades.nombre}</p>}
                                {item.fecha_estimada_ejecucion && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{formatDate(item.fecha_estimada_ejecucion)}</span>
                                  </div>
                                )}
                                {item.presupuesto_estimado != null && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                    <Euro className="h-3 w-3" />
                                    <span>{item.presupuesto_estimado.toFixed(2)} €</span>
                                  </div>
                                )}
                                {item.vecino_nombre && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                    <User className="h-3 w-3" />
                                    <span>{item.vecino_nombre}</span>
                                  </div>
                                )}
                              </div>
                              <Badge variant={pb.variant}>{pb.label}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      )}

      <button
        onClick={() => setOpenNew(true)}
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center z-10 active:scale-95 transition-transform"
        aria-label="Nueva mejora"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Sheet: Nueva mejora */}
      <Sheet open={openNew} onOpenChange={setOpenNew}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Nueva mejora</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmitNew} className="flex flex-col gap-4 px-4 pb-8">
            <div className="grid gap-1.5">
              <Label>Comunidad</Label>
              <select name="comunidad_id" className={selectCls}>
                <option value="">Sin comunidad</option>
                {comunidades.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="descripcion">Descripción *</Label>
              <textarea id="descripcion" name="descripcion" required rows={3} className={textareaCls} placeholder="Describe la mejora propuesta..." />
            </div>
            <div className="grid gap-1.5">
              <Label>Prioridad</Label>
              <select name="prioridad" defaultValue="media" className={selectCls}>
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label>Estado</Label>
              <select name="estado" defaultValue="pendiente" className={selectCls}>
                <option value="pendiente">Pendiente</option>
                <option value="aprobada">Aprobada</option>
                <option value="en_ejecucion">En ejecución</option>
                <option value="completada">Completada</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="fecha_estimada_ejecucion">Fecha estimada de ejecución</Label>
              <Input id="fecha_estimada_ejecucion" name="fecha_estimada_ejecucion" type="date" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="presupuesto_estimado">Presupuesto estimado (€)</Label>
              <Input id="presupuesto_estimado" name="presupuesto_estimado" type="number" step="0.01" min="0" placeholder="0.00" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="vecino_nombre">Vecino que sugiere</Label>
              <Input id="vecino_nombre" name="vecino_nombre" placeholder="Nombre del vecino" />
            </div>
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Guardando...' : 'Registrar mejora'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Sheet: Detalle / edición */}
      <Sheet open={openDetail} onOpenChange={setOpenDetail}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Detalle de mejora</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="flex flex-col gap-4 px-4 pb-8">
              <div className="grid gap-1.5">
                <Label>Comunidad</Label>
                <select value={editComunidad} onChange={(e) => setEditComunidad(e.target.value)} className={selectCls}>
                  <option value="">Sin comunidad</option>
                  {comunidades.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label>Descripción *</Label>
                <textarea value={editDescripcion} onChange={(e) => setEditDescripcion(e.target.value)} rows={3} className={textareaCls} />
              </div>
              <div className="grid gap-1.5">
                <Label>Prioridad</Label>
                <select value={editPrioridad} onChange={(e) => setEditPrioridad(e.target.value as PrioridadMejora)} className={selectCls}>
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label>Estado</Label>
                <select value={editEstado} onChange={(e) => setEditEstado(e.target.value as EstadoMejora)} className={selectCls}>
                  <option value="pendiente">Pendiente</option>
                  <option value="aprobada">Aprobada</option>
                  <option value="en_ejecucion">En ejecución</option>
                  <option value="completada">Completada</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label>Fecha estimada de ejecución</Label>
                <Input type="date" value={editFechaEjecucion} onChange={(e) => setEditFechaEjecucion(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>Presupuesto estimado (€)</Label>
                <Input type="number" step="0.01" min="0" value={editPresupuesto} onChange={(e) => setEditPresupuesto(e.target.value)} placeholder="0.00" />
              </div>
              <div className="grid gap-1.5">
                <Label>Vecino que sugiere</Label>
                <Input value={editVecino} onChange={(e) => setEditVecino(e.target.value)} placeholder="Nombre del vecino" />
              </div>

              <Button onClick={handleUpdate} disabled={saving} className="w-full">
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </Button>

              <Button
                type="button"
                variant="destructive"
                onClick={() => setConfirmDelete(true)}
                className="w-full"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="¿Eliminar esta mejora?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
