'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Extintor, Comunidad, EstadoExtintor } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Euro, Calendar, FileText } from 'lucide-react'
import { toast } from 'sonner'

const estadoBadge: Record<EstadoExtintor, { label: string; variant: 'red' | 'green' | 'amber' }> = {
  pendiente: { label: 'Pendiente', variant: 'red' },
  pagado: { label: 'Pagado', variant: 'green' },
  pasado: { label: 'Pasado', variant: 'amber' },
}

export default function ExtintoresPage() {
  const [extintores, setExtintores] = useState<Extintor[]>([])
  const [comunidades, setComunidades] = useState<Pick<Comunidad, 'id' | 'nombre'>[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [openDetail, setOpenDetail] = useState(false)
  const [selected, setSelected] = useState<Extintor | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    const [{ data: e }, { data: c }] = await Promise.all([
      supabase.from('extintores').select('*, comunidades(id, nombre)').order('created_at', { ascending: false }),
      supabase.from('comunidades').select('id, nombre').order('nombre'),
    ])
    if (e) setExtintores(e)
    if (c) setComunidades(c)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Group by community
  const grouped = extintores.reduce<Record<string, { nombre: string; items: Extintor[] }>>((acc, ext) => {
    const key = ext.comunidad_id ?? 'sin_comunidad'
    const nombre = ext.comunidades?.nombre ?? 'Sin comunidad'
    if (!acc[key]) acc[key] = { nombre, items: [] }
    acc[key].items.push(ext)
    return acc
  }, {})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData(e.currentTarget)
    const payload = {
      comunidad_id: (fd.get('comunidad_id') as string) || null,
      unidades: fd.get('unidades') ? Number(fd.get('unidades')) : null,
      coste_estimado: fd.get('coste_estimado') ? Number(fd.get('coste_estimado')) : null,
      estado: (fd.get('estado') as EstadoExtintor) || 'pendiente',
      fecha_caducidad: (fd.get('fecha_caducidad') as string) || null,
      fecha_proxima_revision: (fd.get('fecha_proxima_revision') as string) || null,
      notas: (fd.get('notas') as string) || null,
    }
    const { error } = await supabase.from('extintores').insert(payload)
    if (error) {
      toast.error('Error al guardar')
    } else {
      toast.success('Extintor registrado')
      setOpen(false)
      ;(e.target as HTMLFormElement).reset()
      fetchData()
    }
    setSaving(false)
  }

  function formatDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('es-ES')
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-bold text-foreground">Extintores</h1>

      {loading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full" />
        ))
      ) : Object.keys(grouped).length === 0 ? (
        <p className="text-center text-muted-foreground py-16">No hay extintores registrados</p>
      ) : (
        Object.entries(grouped).map(([key, { nombre, items }]) => (
          <div key={key}>
            <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-1">{nombre}</h2>
            <div className="flex flex-col gap-2">
              {items.map((ext) => {
                const badge = estadoBadge[ext.estado]
                return (
                  <Card
                    key={ext.id}
                    className="cursor-pointer active:scale-[0.98] transition-transform"
                    onClick={() => { setSelected(ext); setOpenDetail(true) }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">
                            {ext.unidades ? `${ext.unidades} unidad${ext.unidades !== 1 ? 'es' : ''}` : 'Extintores'}
                          </p>
                          {ext.fecha_proxima_revision && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Calendar className="h-3 w-3" />
                              <span>Revisión: {formatDate(ext.fecha_proxima_revision)}</span>
                            </div>
                          )}
                          {ext.coste_estimado != null && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <Euro className="h-3 w-3" />
                              <span>{ext.coste_estimado.toFixed(2)} €</span>
                            </div>
                          )}
                        </div>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ))
      )}

      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center z-10 active:scale-95 transition-transform"
        aria-label="Nuevo extintor"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Sheet: Nuevo extintor */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Nuevo registro de extintores</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pb-8">
            <div className="grid gap-1.5">
              <Label>Comunidad</Label>
              <select
                name="comunidad_id"
                className="w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Sin comunidad</option>
                {comunidades.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="unidades">Unidades</Label>
              <Input id="unidades" name="unidades" type="number" min="1" placeholder="4" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="coste_estimado">Coste estimado (€)</Label>
              <Input id="coste_estimado" name="coste_estimado" type="number" step="0.01" min="0" placeholder="120.00" />
            </div>
            <div className="grid gap-1.5">
              <Label>Estado</Label>
              <select
                name="estado"
                defaultValue="pendiente"
                className="w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="pendiente">Pendiente</option>
                <option value="pagado">Pagado</option>
                <option value="pasado">Pasado</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="fecha_caducidad">Fecha de caducidad</Label>
              <Input id="fecha_caducidad" name="fecha_caducidad" type="date" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="fecha_proxima_revision">Próxima revisión</Label>
              <Input id="fecha_proxima_revision" name="fecha_proxima_revision" type="date" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="notas">Notas</Label>
              <textarea
                id="notas"
                name="notas"
                rows={3}
                className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                placeholder="Observaciones..."
              />
            </div>
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Sheet: Detalle extintor */}
      <Sheet open={openDetail} onOpenChange={setOpenDetail}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Detalle extintores</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="flex flex-col gap-4 px-4 pb-8">
              {selected.comunidades && (
                <p className="text-sm font-medium text-muted-foreground">{selected.comunidades.nombre}</p>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado</span>
                <Badge variant={estadoBadge[selected.estado].variant}>
                  {estadoBadge[selected.estado].label}
                </Badge>
              </div>

              {selected.unidades != null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Unidades</span>
                  <span className="text-sm font-medium">{selected.unidades}</span>
                </div>
              )}

              {selected.coste_estimado != null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Coste estimado</span>
                  <span className="text-sm font-medium">{selected.coste_estimado.toFixed(2)} €</span>
                </div>
              )}

              {selected.fecha_caducidad && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Caducidad</span>
                  <span className="text-sm font-medium">{formatDate(selected.fecha_caducidad)}</span>
                </div>
              )}

              {selected.fecha_proxima_revision && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Próxima revisión</span>
                  <span className="text-sm font-medium">{formatDate(selected.fecha_proxima_revision)}</span>
                </div>
              )}

              {selected.notas && (
                <div className="mt-2">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
                    <FileText className="h-3.5 w-3.5" />
                    <span>Notas</span>
                  </div>
                  <p className="text-sm text-foreground bg-secondary rounded-xl px-3 py-2">{selected.notas}</p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
