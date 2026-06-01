'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Tarea, Comunidad, EstadoTarea } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Calendar } from 'lucide-react'
import { toast } from 'sonner'

const estadoBadge: Record<EstadoTarea, { label: string; variant: 'amber' | 'blue' | 'green' }> = {
  pendiente: { label: 'Pendiente', variant: 'amber' },
  en_curso: { label: 'En curso', variant: 'blue' },
  completada: { label: 'Completada', variant: 'green' },
}

export default function TareasPage() {
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [comunidades, setComunidades] = useState<Pick<Comunidad, 'id' | 'nombre'>[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroComunidad, setFiltroComunidad] = useState<string>('todas')
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    const [{ data: t }, { data: c }] = await Promise.all([
      supabase.from('tareas').select('*, comunidades(id, nombre)').order('created_at', { ascending: false }),
      supabase.from('comunidades').select('id, nombre').order('nombre'),
    ])
    if (t) setTareas(t)
    if (c) setComunidades(c)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const tareasFiltradas = filtroComunidad === 'todas'
    ? tareas
    : tareas.filter((t) => t.comunidad_id === filtroComunidad)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData(e.currentTarget)
    const payload = {
      comunidad_id: (fd.get('comunidad_id') as string) || null,
      titulo: fd.get('titulo') as string,
      descripcion: (fd.get('descripcion') as string) || null,
      estado: (fd.get('estado') as EstadoTarea) || 'pendiente',
      fecha_estimada: (fd.get('fecha_estimada') as string) || null,
      notas: (fd.get('notas') as string) || null,
    }
    const { error } = await supabase.from('tareas').insert(payload)
    if (error) {
      toast.error('Error al guardar la tarea')
    } else {
      toast.success('Tarea guardada')
      setOpen(false)
      ;(e.target as HTMLFormElement).reset()
      fetchData()
    }
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <h1 className="text-xl font-bold text-foreground">Tareas</h1>

      <select
        value={filtroComunidad}
        onChange={(e) => setFiltroComunidad(e.target.value)}
        className="w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="todas">Todas las comunidades</option>
        {comunidades.map((c) => (
          <option key={c.id} value={c.id}>{c.nombre}</option>
        ))}
      </select>

      {loading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))
      ) : tareasFiltradas.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">No hay tareas</p>
      ) : (
        tareasFiltradas.map((tarea) => {
          const badge = estadoBadge[tarea.estado]
          return (
            <Card key={tarea.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{tarea.titulo}</p>
                    {tarea.comunidades && (
                      <p className="text-xs text-muted-foreground mt-0.5">{tarea.comunidades.nombre}</p>
                    )}
                    {tarea.descripcion && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{tarea.descripcion}</p>
                    )}
                    {tarea.fecha_estimada && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1.5">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(tarea.fecha_estimada).toLocaleDateString('es-ES')}</span>
                      </div>
                    )}
                  </div>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>
              </CardContent>
            </Card>
          )
        })
      )}

      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center z-10 active:scale-95 transition-transform"
        aria-label="Nueva tarea"
      >
        <Plus className="h-6 w-6" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Nueva tarea</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pb-8">
            <div className="grid gap-1.5">
              <Label htmlFor="titulo">Título *</Label>
              <Input id="titulo" name="titulo" required placeholder="Revisar ascensor" />
            </div>
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
              <Label>Estado</Label>
              <select
                name="estado"
                defaultValue="pendiente"
                className="w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_curso">En curso</option>
                <option value="completada">Completada</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="fecha_estimada">Fecha estimada</Label>
              <Input id="fecha_estimada" name="fecha_estimada" type="date" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="descripcion">Descripción</Label>
              <textarea
                id="descripcion"
                name="descripcion"
                rows={3}
                className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                placeholder="Descripción de la tarea..."
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="notas">Notas</Label>
              <textarea
                id="notas"
                name="notas"
                rows={2}
                className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                placeholder="Notas adicionales..."
              />
            </div>
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Guardando...' : 'Guardar tarea'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
