'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Aviso, Comunidad } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, ImageIcon, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function AvisosPage() {
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const [comunidades, setComunidades] = useState<Pick<Comunidad, 'id' | 'nombre'>[]>([])
  const [loading, setLoading] = useState(true)
  const [openNew, setOpenNew] = useState(false)
  const [openDetail, setOpenDetail] = useState(false)
  const [selectedAviso, setSelectedAviso] = useState<Aviso | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchData = useCallback(async () => {
    const [{ data: a }, { data: c }] = await Promise.all([
      supabase.from('avisos').select('*, comunidades(id, nombre)').order('created_at', { ascending: false }),
      supabase.from('comunidades').select('id, nombre').order('nombre'),
    ])
    if (a) setAvisos(a)
    if (c) setComunidades(c)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const pendientes = avisos.filter((a) => a.estado === 'pendiente')
  const finalizados = avisos.filter((a) => a.estado === 'finalizado')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData(e.currentTarget)
    const payload = {
      comunidad_id: (fd.get('comunidad_id') as string) || null,
      descripcion: fd.get('descripcion') as string,
    }
    const { error } = await supabase.from('avisos').insert(payload)
    if (error) {
      toast.error('Error al guardar el aviso')
    } else {
      toast.success('Aviso registrado')
      setOpenNew(false)
      ;(e.target as HTMLFormElement).reset()
      fetchData()
    }
    setSaving(false)
  }

  async function handleFinalizar() {
    if (!selectedAviso) return
    const { error } = await supabase
      .from('avisos')
      .update({ estado: 'finalizado', finalizado_at: new Date().toISOString() })
      .eq('id', selectedAviso.id)
    if (error) {
      toast.error('Error al finalizar')
    } else {
      toast.success('Aviso finalizado')
      setOpenDetail(false)
      fetchData()
    }
  }

  async function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!selectedAviso || !e.target.files?.length) return
    setUploading(true)
    const urls: string[] = []

    for (const file of Array.from(e.target.files)) {
      const ext = file.name.split('.').pop()
      const path = `${selectedAviso.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avisos-fotos')
        .upload(path, file)
      if (!uploadError) {
        const { data } = supabase.storage.from('avisos-fotos').getPublicUrl(path)
        urls.push(data.publicUrl)
      }
    }

    if (urls.length > 0) {
      const existingFotos = selectedAviso.fotos ?? []
      const { error } = await supabase
        .from('avisos')
        .update({ fotos: [...existingFotos, ...urls] })
        .eq('id', selectedAviso.id)
      if (!error) {
        toast.success(`${urls.length} foto(s) subida(s)`)
        setSelectedAviso({ ...selectedAviso, fotos: [...existingFotos, ...urls] })
        fetchData()
      }
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function openAvisoDetail(aviso: Aviso) {
    setSelectedAviso(aviso)
    setOpenDetail(true)
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <h1 className="text-xl font-bold text-foreground">Avisos</h1>

      {loading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))
      ) : (
        <Tabs defaultValue="pendientes">
          <TabsList>
            <TabsTrigger value="pendientes">
              Pendientes ({pendientes.length})
            </TabsTrigger>
            <TabsTrigger value="finalizados">
              Finalizados ({finalizados.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pendientes">
            {pendientes.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">Sin avisos pendientes</p>
            ) : (
              <div className="flex flex-col gap-3">
                {pendientes.map((a) => (
                  <Card key={a.id} className="cursor-pointer active:scale-[0.98] transition-transform" onClick={() => openAvisoDetail(a)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground line-clamp-2">{a.descripcion}</p>
                          {a.comunidades && <p className="text-xs text-muted-foreground mt-0.5">{a.comunidades.nombre}</p>}
                          <p className="text-xs text-muted-foreground mt-1">{new Date(a.created_at).toLocaleDateString('es-ES')}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="amber">Pendiente</Badge>
                          {a.fotos?.length ? <div className="flex items-center gap-0.5 text-xs text-muted-foreground"><ImageIcon className="h-3 w-3" /><span>{a.fotos.length}</span></div> : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="finalizados">
            {finalizados.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">Sin avisos finalizados</p>
            ) : (
              <div className="flex flex-col gap-3">
                {finalizados.map((a) => (
                  <Card key={a.id} className="cursor-pointer active:scale-[0.98] transition-transform" onClick={() => openAvisoDetail(a)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground line-clamp-2">{a.descripcion}</p>
                          {a.comunidades && <p className="text-xs text-muted-foreground mt-0.5">{a.comunidades.nombre}</p>}
                          <p className="text-xs text-muted-foreground mt-1">{new Date(a.created_at).toLocaleDateString('es-ES')}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="green">Finalizado</Badge>
                          {a.fotos?.length ? <div className="flex items-center gap-0.5 text-xs text-muted-foreground"><ImageIcon className="h-3 w-3" /><span>{a.fotos.length}</span></div> : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <button
        onClick={() => setOpenNew(true)}
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center z-10 active:scale-95 transition-transform"
        aria-label="Nuevo aviso"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Sheet: Nuevo aviso */}
      <Sheet open={openNew} onOpenChange={setOpenNew}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Nuevo aviso</SheetTitle>
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
                rows={4}
                className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                placeholder="Describe el aviso o incidencia..."
              />
            </div>
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Guardando...' : 'Registrar aviso'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Sheet: Detalle aviso */}
      <Sheet open={openDetail} onOpenChange={setOpenDetail}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Detalle del aviso</SheetTitle>
          </SheetHeader>
          {selectedAviso && (
            <div className="flex flex-col gap-4 px-4 pb-8">
              {selectedAviso.comunidades && (
                <p className="text-sm font-medium text-muted-foreground">{selectedAviso.comunidades.nombre}</p>
              )}
              <p className="text-sm text-foreground">{selectedAviso.descripcion}</p>
              <p className="text-xs text-muted-foreground">
                Registrado: {new Date(selectedAviso.created_at).toLocaleDateString('es-ES')}
              </p>
              {selectedAviso.finalizado_at && (
                <p className="text-xs text-muted-foreground">
                  Finalizado: {new Date(selectedAviso.finalizado_at).toLocaleDateString('es-ES')}
                </p>
              )}

              {/* Fotos */}
              {selectedAviso.fotos && selectedAviso.fotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {selectedAviso.fotos.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Foto ${i + 1}`}
                      className="w-full aspect-square object-cover rounded-xl"
                    />
                  ))}
                </div>
              )}

              {/* Upload fotos */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFotoUpload}
                  className="hidden"
                  id="foto-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <ImageIcon className="h-4 w-4" />
                  {uploading ? 'Subiendo...' : 'Añadir fotos'}
                </Button>
              </div>

              {selectedAviso.estado === 'pendiente' && (
                <Button
                  onClick={handleFinalizar}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="h-4 w-4" />
                  Marcar como finalizado
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
