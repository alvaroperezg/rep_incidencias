'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Mejora, Comunidad, PrioridadMejora, EstadoMejora } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, User } from 'lucide-react'
import { toast } from 'sonner'

const prioridadBadge: Record<PrioridadMejora, { label: string; variant: 'red' | 'amber' | 'green' }> = {
  alta: { label: 'Alta', variant: 'red' },
  media: { label: 'Media', variant: 'amber' },
  baja: { label: 'Baja', variant: 'green' },
}

const estadoBadge: Record<EstadoMejora, { label: string; variant: 'amber' | 'blue' | 'green' }> = {
  pendiente: { label: 'Pendiente', variant: 'amber' },
  en_estudio: { label: 'En estudio', variant: 'blue' },
  aprobada: { label: 'Aprobada', variant: 'green' },
}

export default function MejorasPage() {
  const [mejoras, setMejoras] = useState<Mejora[]>([])
  const [comunidades, setComunidades] = useState<Pick<Comunidad, 'id' | 'nombre'>[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData(e.currentTarget)
    const payload = {
      comunidad_id: (fd.get('comunidad_id') as string) || null,
      descripcion: fd.get('descripcion') as string,
      prioridad: (fd.get('prioridad') as PrioridadMejora) || 'media',
      estado: (fd.get('estado') as EstadoMejora) || 'pendiente',
      vecino_nombre: (fd.get('vecino_nombre') as string) || null,
    }
    const { error } = await supabase.from('mejoras').insert(payload)
    if (error) {
      toast.error('Error al guardar la mejora')
    } else {
      toast.success('Mejora registrada')
      setOpen(false)
      ;(e.target as HTMLFormElement).reset()
      fetchData()
    }
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <h1 className="text-xl font-bold text-foreground">Mejoras</h1>

      {loading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))
      ) : mejoras.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">No hay mejoras registradas</p>
      ) : (
        mejoras.map((mejora) => {
          const pBadge = prioridadBadge[mejora.prioridad]
          const eBadge = estadoBadge[mejora.estado]
          return (
            <Card key={mejora.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-2">{mejora.descripcion}</p>
                    {mejora.comunidades && (
                      <p className="text-xs text-muted-foreground mt-0.5">{mejora.comunidades.nombre}</p>
                    )}
                    {mejora.vecino_nombre && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <User className="h-3 w-3" />
                        <span>{mejora.vecino_nombre}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <Badge variant={pBadge.variant}>{pBadge.label}</Badge>
                    <Badge variant={eBadge.variant}>{eBadge.label}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })
      )}

      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center z-10 active:scale-95 transition-transform"
        aria-label="Nueva mejora"
      >
        <Plus className="h-6 w-6" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Nueva mejora</SheetTitle>
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
              <Label htmlFor="descripcion">Descripción *</Label>
              <textarea
                id="descripcion"
                name="descripcion"
                required
                rows={3}
                className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                placeholder="Describe la mejora propuesta..."
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Prioridad</Label>
              <select
                name="prioridad"
                defaultValue="media"
                className="w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label>Estado</Label>
              <select
                name="estado"
                defaultValue="pendiente"
                className="w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_estudio">En estudio</option>
                <option value="aprobada">Aprobada</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="vecino_nombre">Nombre del vecino</Label>
              <Input id="vecino_nombre" name="vecino_nombre" placeholder="María López" />
            </div>
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Guardando...' : 'Registrar mejora'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
