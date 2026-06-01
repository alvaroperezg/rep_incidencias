'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Comunidad } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Phone, MapPin, User } from 'lucide-react'
import { toast } from 'sonner'

export default function ComunidadesPage() {
  const [comunidades, setComunidades] = useState<Comunidad[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchComunidades = useCallback(async () => {
    const { data } = await supabase.from('comunidades').select('*').order('nombre')
    if (data) setComunidades(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchComunidades() }, [fetchComunidades])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData(e.currentTarget)
    const payload = {
      nombre: fd.get('nombre') as string,
      direccion: (fd.get('direccion') as string) || null,
      presidente_nombre: (fd.get('presidente_nombre') as string) || null,
      presidente_telefono: (fd.get('presidente_telefono') as string) || null,
      numero_cuenta: (fd.get('numero_cuenta') as string) || null,
      cif: (fd.get('cif') as string) || null,
      seguro_compania: (fd.get('seguro_compania') as string) || null,
      seguro_poliza: (fd.get('seguro_poliza') as string) || null,
      seguro_vencimiento: (fd.get('seguro_vencimiento') as string) || null,
      notas: (fd.get('notas') as string) || null,
    }
    const { error } = await supabase.from('comunidades').insert(payload)
    if (error) {
      toast.error('Error al guardar la comunidad')
    } else {
      toast.success('Comunidad guardada')
      setOpen(false)
      ;(e.target as HTMLFormElement).reset()
      fetchComunidades()
    }
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <h1 className="text-xl font-bold text-foreground">Comunidades</h1>

      {loading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))
      ) : comunidades.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">No hay comunidades registradas</p>
      ) : (
        comunidades.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{c.nombre}</p>
                  {c.direccion && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{c.direccion}</span>
                    </div>
                  )}
                  {c.presidente_nombre && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                      <User className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{c.presidente_nombre}</span>
                    </div>
                  )}
                </div>
                {c.presidente_telefono && (
                  <a
                    href={`tel:${c.presidente_telefono}`}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0"
                  >
                    <Phone className="h-4 w-4" />
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center z-10 active:scale-95 transition-transform"
        aria-label="Nueva comunidad"
      >
        <Plus className="h-6 w-6" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Nueva comunidad</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pb-8">
            <div className="grid gap-1.5">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" name="nombre" required placeholder="Comunidad Los Álamos" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="direccion">Dirección</Label>
              <Input id="direccion" name="direccion" placeholder="Calle Mayor 1, Madrid" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="presidente_nombre">Presidente</Label>
              <Input id="presidente_nombre" name="presidente_nombre" placeholder="Juan García" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="presidente_telefono">Teléfono presidente</Label>
              <Input id="presidente_telefono" name="presidente_telefono" type="tel" placeholder="600 000 000" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="numero_cuenta">Nº cuenta bancaria</Label>
              <Input id="numero_cuenta" name="numero_cuenta" placeholder="ES00 0000 0000 0000 0000 0000" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cif">CIF</Label>
              <Input id="cif" name="cif" placeholder="H00000000" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="seguro_compania">Compañía de seguro</Label>
              <Input id="seguro_compania" name="seguro_compania" placeholder="MAPFRE" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="seguro_poliza">Nº póliza</Label>
              <Input id="seguro_poliza" name="seguro_poliza" placeholder="000000000" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="seguro_vencimiento">Vencimiento seguro</Label>
              <Input id="seguro_vencimiento" name="seguro_vencimiento" type="date" />
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
              {saving ? 'Guardando...' : 'Guardar comunidad'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
