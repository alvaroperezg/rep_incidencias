'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Incidencia, Comunidad, PrioridadIncidencia } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/alert-dialog'
import { Plus, ImageIcon, CheckCircle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const prioridadBadge: Record<PrioridadIncidencia, { label: string; variant: 'red' | 'amber' | 'green' }> = {
  alta: { label: 'Alta', variant: 'red' },
  media: { label: 'Media', variant: 'amber' },
  baja: { label: 'Baja', variant: 'green' },
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateTime(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const selectCls = 'w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
const textareaCls = 'w-full rounded-xl border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none'

function IncidenciaCard({
  inc,
  showFinalizada = false,
  onClick,
}: {
  inc: Incidencia
  showFinalizada?: boolean
  onClick: () => void
}) {
  const pb = prioridadBadge[inc.prioridad ?? 'media']
  return (
    <Card className="cursor-pointer active:scale-[0.98] transition-transform" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground line-clamp-1">{inc.titulo}</p>
            {inc.comunidades && <p className="text-xs text-muted-foreground mt-0.5">{inc.comunidades.nombre}</p>}
            <p className="text-xs text-muted-foreground mt-1">
              Abierta el {formatDate(inc.fecha_parte ?? inc.created_at)}
            </p>
            {showFinalizada && inc.fecha_solucion && (
              <p className="text-xs text-green-600 mt-0.5">Resuelta el {formatDate(inc.fecha_solucion)}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <Badge variant={pb.variant}>{pb.label}</Badge>
            {showFinalizada && <Badge variant="green">Finalizada</Badge>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function IncidenciasPage() {
  const [incidencias, setIncidencias] = useState<Incidencia[]>([])
  const [comunidades, setComunidades] = useState<Pick<Comunidad, 'id' | 'nombre'>[]>([])
  const [loading, setLoading] = useState(true)
  const [openNew, setOpenNew] = useState(false)
  const [openDetail, setOpenDetail] = useState(false)
  const [selected, setSelected] = useState<Incidencia | null>(null)
  const [saving, setSaving] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const newFileRef = useRef<HTMLInputElement>(null)
  const detailFileRef = useRef<HTMLInputElement>(null)

  const [editComunidad, setEditComunidad] = useState('')
  const [editTitulo, setEditTitulo] = useState('')
  const [editDescripcion, setEditDescripcion] = useState('')
  const [editPrioridad, setEditPrioridad] = useState<PrioridadIncidencia>('media')

  const fetchData = useCallback(async () => {
    const [{ data: inc }, { data: c }] = await Promise.all([
      supabase.from('tareas').select('*, comunidades(id, nombre)').order('created_at', { ascending: false }),
      supabase.from('comunidades').select('id, nombre').order('nombre'),
    ])
    if (inc) setIncidencias(inc)
    if (c) setComunidades(c)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const pendientes = incidencias.filter((i) => i.estado !== 'completada')
  const finalizadas = incidencias.filter((i) => i.estado === 'completada')

  function openDetailSheet(inc: Incidencia) {
    setSelected(inc)
    setEditComunidad(inc.comunidad_id ?? '')
    setEditTitulo(inc.titulo)
    setEditDescripcion(inc.descripcion ?? '')
    setEditPrioridad(inc.prioridad ?? 'media')
    setOpenDetail(true)
  }

  async function handleSubmitNew(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData(e.currentTarget)
    const files = newFileRef.current?.files ? Array.from(newFileRef.current.files) : []

    const { data: newInc, error } = await supabase
      .from('tareas')
      .insert({
        comunidad_id: (fd.get('comunidad_id') as string) || null,
        titulo: fd.get('titulo') as string,
        descripcion: (fd.get('descripcion') as string) || null,
        prioridad: (fd.get('prioridad') as string) || 'media',
        estado: 'pendiente',
        fecha_parte: new Date().toISOString(),
      })
      .select()
      .single()

    if (error || !newInc) {
      toast.error('Error al guardar la incidencia')
      setSaving(false)
      return
    }

    if (files.length > 0) {
      const urls: string[] = []
      for (const file of files) {
        const ext = file.name.split('.').pop()
        const path = `${newInc.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
        const { error: upErr } = await supabase.storage.from('avisos-fotos').upload(path, file)
        if (!upErr) {
          const { data } = supabase.storage.from('avisos-fotos').getPublicUrl(path)
          urls.push(data.publicUrl)
        }
      }
      if (urls.length > 0) {
        await supabase.from('tareas').update({ fotos: urls }).eq('id', newInc.id)
      }
    }

    toast.success('Incidencia registrada')
    setOpenNew(false)
    ;(e.target as HTMLFormElement).reset()
    fetchData()
    setSaving(false)
  }

  async function handleUpdate() {
    if (!selected) return
    setSaving(true)
    const { error } = await supabase
      .from('tareas')
      .update({
        comunidad_id: editComunidad || null,
        titulo: editTitulo,
        descripcion: editDescripcion || null,
        prioridad: editPrioridad,
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

  async function handleFinalizar() {
    if (!selected) return
    setFinalizing(true)
    const { error } = await supabase
      .from('tareas')
      .update({ estado: 'completada', fecha_solucion: new Date().toISOString() })
      .eq('id', selected.id)
    if (error) {
      toast.error('Error al finalizar')
    } else {
      toast.success('Incidencia marcada como finalizada')
      setOpenDetail(false)
      fetchData()
    }
    setFinalizing(false)
  }

  async function handleDelete() {
    if (!selected) return
    setDeleting(true)
    const { error } = await supabase.from('tareas').delete().eq('id', selected.id)
    if (error) {
      toast.error('Error al eliminar')
    } else {
      toast.success('Incidencia eliminada')
      setConfirmDelete(false)
      setOpenDetail(false)
      fetchData()
    }
    setDeleting(false)
  }

  async function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!selected || !e.target.files?.length) return
    setUploading(true)
    const urls: string[] = []
    for (const file of Array.from(e.target.files)) {
      const ext = file.name.split('.').pop()
      const path = `${selected.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage.from('avisos-fotos').upload(path, file)
      if (!upErr) {
        const { data } = supabase.storage.from('avisos-fotos').getPublicUrl(path)
        urls.push(data.publicUrl)
      }
    }
    if (urls.length > 0) {
      const existing = selected.fotos ?? []
      const { error } = await supabase
        .from('tareas')
        .update({ fotos: [...existing, ...urls] })
        .eq('id', selected.id)
      if (!error) {
        toast.success(`${urls.length} foto(s) subida(s)`)
        setSelected({ ...selected, fotos: [...existing, ...urls] })
        fetchData()
      }
    }
    setUploading(false)
    if (detailFileRef.current) detailFileRef.current.value = ''
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <h1 className="text-xl font-bold text-foreground">Incidencias</h1>

      {loading ? (
        Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
      ) : (
        <Tabs defaultValue="pendientes">
          <TabsList>
            <TabsTrigger value="pendientes">Pendientes ({pendientes.length})</TabsTrigger>
            <TabsTrigger value="finalizadas">Finalizadas ({finalizadas.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="pendientes">
            {pendientes.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">Sin incidencias pendientes</p>
            ) : (
              <div className="flex flex-col gap-3">
                {pendientes.map((inc) => <IncidenciaCard key={inc.id} inc={inc} onClick={() => openDetailSheet(inc)} />)}
              </div>
            )}
          </TabsContent>
          <TabsContent value="finalizadas">
            {finalizadas.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">Sin incidencias finalizadas</p>
            ) : (
              <div className="flex flex-col gap-3">
                {finalizadas.map((inc) => <IncidenciaCard key={inc.id} inc={inc} showFinalizada onClick={() => openDetailSheet(inc)} />)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <button
        onClick={() => setOpenNew(true)}
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center z-10 active:scale-95 transition-transform"
        aria-label="Nueva incidencia"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Sheet: Nueva incidencia */}
      <Sheet open={openNew} onOpenChange={setOpenNew}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Nueva incidencia</SheetTitle>
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
              <Label htmlFor="titulo">Título *</Label>
              <Input id="titulo" name="titulo" required placeholder="Ej: Fuga de agua en escalera" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="descripcion">Descripción</Label>
              <textarea id="descripcion" name="descripcion" rows={3} className={textareaCls} placeholder="Detalla la incidencia..." />
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
              <Label>Fotos</Label>
              <input ref={newFileRef} type="file" accept="image/*" multiple className="text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm" />
            </div>
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Guardando...' : 'Registrar incidencia'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Sheet: Detalle / edición */}
      <Sheet open={openDetail} onOpenChange={setOpenDetail}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Detalle de incidencia</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="flex flex-col gap-4 px-4 pb-8">
              <div className="rounded-xl bg-secondary px-3 py-2 text-xs text-muted-foreground space-y-0.5">
                <p>Parte abierto el {formatDateTime(selected.fecha_parte ?? selected.created_at)}</p>
                {selected.fecha_solucion && (
                  <p className="text-green-600">Resuelta el {formatDateTime(selected.fecha_solucion)}</p>
                )}
              </div>

              <div className="grid gap-1.5">
                <Label>Comunidad</Label>
                <select value={editComunidad} onChange={(e) => setEditComunidad(e.target.value)} className={selectCls}>
                  <option value="">Sin comunidad</option>
                  {comunidades.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label>Título *</Label>
                <Input value={editTitulo} onChange={(e) => setEditTitulo(e.target.value)} required />
              </div>
              <div className="grid gap-1.5">
                <Label>Descripción</Label>
                <textarea value={editDescripcion} onChange={(e) => setEditDescripcion(e.target.value)} rows={3} className={textareaCls} />
              </div>
              <div className="grid gap-1.5">
                <Label>Prioridad</Label>
                <select value={editPrioridad} onChange={(e) => setEditPrioridad(e.target.value as PrioridadIncidencia)} className={selectCls}>
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>

              {selected.fotos && selected.fotos.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selected.fotos.map((url, i) => (
                    <img key={i} src={url} alt={`Foto ${i + 1}`} className="w-20 h-20 object-cover rounded-xl" />
                  ))}
                </div>
              )}

              <div>
                <input ref={detailFileRef} type="file" accept="image/*" multiple onChange={handleFotoUpload} className="hidden" id="detail-foto-upload" />
                <Button type="button" variant="outline" className="w-full" onClick={() => detailFileRef.current?.click()} disabled={uploading}>
                  <ImageIcon className="h-4 w-4" />
                  {uploading ? 'Subiendo...' : 'Añadir fotos'}
                </Button>
              </div>

              <Button onClick={handleUpdate} disabled={saving} className="w-full">
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </Button>

              {selected.estado !== 'completada' && (
                <Button
                  type="button"
                  onClick={handleFinalizar}
                  disabled={finalizing}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="h-4 w-4" />
                  {finalizing ? 'Finalizando...' : 'Marcar como finalizada'}
                </Button>
              )}

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
        title="¿Eliminar incidencia?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
