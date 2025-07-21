"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { AlertTriangle, Calendar, Edit, Package, Search, TrendingDown, TrendingUp, RefreshCcw, Filter, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { fetchWithAuth } from "@/lib/api"

type StockItem = {
  id: number
  codigoBarras: string
  nombre: string
  concentracion: string
  cantidadUnidades: number
  cantidadMinima: number
  precioCompra: number
  precioVenta: number
  fechaVencimiento: string
  laboratorio: string
  categoria: string
}

export default function StockPage() {
  const [stock, setStock] = useState<StockItem[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [editandoStock, setEditandoStock] = useState<StockItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterLab, setFilterLab] = useState<string>("todos")
  const [filterCat, setFilterCat] = useState<string>("todos")
  const { toast } = useToast()

  // Cargar stock usando fetchWithAuth
  const cargarStock = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchWithAuth("http://localhost:8080/api/stock")
      setStock(data || [])
    } catch (err: any) {
      setError("No se pudo cargar el stock")
      toast({ title: "Error", description: err?.message || "No se pudo cargar el stock", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarStock()
    // eslint-disable-next-line
  }, [])

  // Listas únicas para filtros
  const laboratorios = useMemo(() =>
    ["todos", ...Array.from(new Set(stock.map(s => s.laboratorio).filter(Boolean)))]
    , [stock])
  const categorias = useMemo(() =>
    ["todos", ...Array.from(new Set(stock.map(s => s.categoria).filter(Boolean)))]
    , [stock])

  // Filtro avanzado
  const stockFiltrado = useMemo(() =>
    stock.filter(
      (item) =>
        (item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          item.codigoBarras.toLowerCase().includes(busqueda.toLowerCase()) ||
          item.laboratorio?.toLowerCase().includes(busqueda.toLowerCase()) ||
          item.categoria?.toLowerCase().includes(busqueda.toLowerCase()) ||
          item.concentracion?.toLowerCase().includes(busqueda.toLowerCase())
        ) &&
        (filterLab === "todos" || item.laboratorio === filterLab) &&
        (filterCat === "todos" || item.categoria === filterCat)
    )
    , [stock, busqueda, filterLab, filterCat])

  // Productos en estado crítico
  const stockCritico = useMemo(() =>
    stock.filter((item) => item.cantidadUnidades <= item.cantidadMinima)
    , [stock])

  // Próximos a vencer (en 30 días)
  const proximosVencer = useMemo(() =>
    stock.filter((item) => {
      const fechaVencimiento = new Date(item.fechaVencimiento)
      const hoy = new Date()
      hoy.setHours(0,0,0,0)
      const diasDiferencia = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 3600 * 24))
      return diasDiferencia <= 30 && diasDiferencia > 0
    })
    , [stock])

  // Productos vencidos
  const productosVencidos = useMemo(() =>
    stock.filter((item) => {
      const fechaVencimiento = new Date(item.fechaVencimiento)
      const hoy = new Date()
      hoy.setHours(0,0,0,0)
      const diasDiferencia = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 3600 * 24))
      return diasDiferencia <= 0
    })
    , [stock])

  // Estado de stock (badge)
  const obtenerEstadoStock = (cantidad: number, minima: number) => {
    if (cantidad === 0) return { variant: "destructive" as const, texto: "Agotado", icon: <TrendingDown className="inline h-4 w-4 mr-1" /> }
    if (cantidad <= minima) return { variant: "destructive" as const, texto: "Crítico", icon: <AlertCircle className="inline h-4 w-4 mr-1" /> }
    if (cantidad <= minima * 2) return { variant: "secondary" as const, texto: "Bajo", icon: <TrendingDown className="inline h-4 w-4 mr-1" /> }
    return { variant: "default" as const, texto: "Normal", icon: <TrendingUp className="inline h-4 w-4 mr-1" /> }
  }

  // Días para vencimiento
  const obtenerDiasVencimiento = (fechaVencimiento: string) => {
    const fecha = new Date(fechaVencimiento)
    const hoy = new Date()
    hoy.setHours(0,0,0,0)
    return Math.ceil((fecha.getTime() - hoy.getTime()) / (1000 * 3600 * 24))
  }

  // Editar stock
  const editarStock = (item: StockItem) => {
    setEditandoStock({ ...item })
  }

  // Guardar edición
  const guardarEdicion = async () => {
    if (
      editandoStock?.cantidadUnidades === undefined ||
      editandoStock?.precioCompra === undefined ||
      editandoStock?.cantidadUnidades < 0 ||
      editandoStock?.precioCompra < 0
    ) {
      toast({
        title: "Error",
        description: "Completa correctamente los campos obligatorios (no negativos)",
        variant: "destructive",
      })
      return
    }
    setLoading(true)
    const res = await fetchWithAuth(`http://localhost:8080/api/stock/${editandoStock.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cantidadUnidades: editandoStock.cantidadUnidades,
        cantidadMinima: editandoStock.cantidadMinima,
        precioCompra: editandoStock.precioCompra,
        fechaVencimiento: editandoStock.fechaVencimiento,
      }),
    })
    if (res && res.ok) {
      toast({ title: "Stock actualizado", description: "Los cambios se han guardado correctamente" })
      await cargarStock()
      setEditandoStock(null)
    } else {
      toast({ title: "Error", description: "No se pudo actualizar el stock", variant: "destructive" })
    }
    setLoading(false)
  }

  // Visual helper para stock mínimo y badge crítico
  function stockMinBadge(item: StockItem) {
    if (item.cantidadMinima === undefined) return null
    const esCritico = item.cantidadUnidades <= item.cantidadMinima
    return (
      <span className="block text-xs mt-0.5">
        Min: <span className="font-semibold">{item.cantidadMinima}</span>
        {esCritico && (
          <Badge variant="destructive" className="ml-2 inline-flex items-center gap-1 px-2 py-0.5">
            <AlertCircle className="w-3 h-3" /> Crítico
          </Badge>
        )}
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Stock</h1>
          <p className="text-muted-foreground">Controla el inventario y fechas de vencimiento</p>
        </div>
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={cargarStock}
            disabled={loading}
            title="Refrescar datos"
          >
            <RefreshCcw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Refrescar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stock.length}</div>
            <p className="text-xs text-muted-foreground">Productos en inventario</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock crítico</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stockCritico.length}</div>
            <p className="text-xs text-muted-foreground">Productos con stock bajo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos a vencer</CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{proximosVencer.length}</div>
            <p className="text-xs text-muted-foreground">Vencen en 30 días</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor inventario</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              S/ {stock.reduce((total, item) => total + item.cantidadUnidades * (item.precioCompra || 0), 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Valor total del stock</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventario" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventario">Inventario</TabsTrigger>
          <TabsTrigger value="critico">Stock Crítico</TabsTrigger>
          <TabsTrigger value="vencimientos">Vencimientos</TabsTrigger>
        </TabsList>

        <TabsContent value="inventario" className="space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-col md:flex-row md:justify-between md:items-center gap-2">
              <div>
                <CardTitle>Inventario General</CardTitle>
                <CardDescription>Lista completa del stock disponible</CardDescription>
              </div>
              <div className="flex flex-row gap-3 items-center">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar producto, código, lab, categoría..."
                    className="pl-8 w-56"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <select
                    className="border rounded px-2 h-8 text-sm"
                    value={filterLab}
                    onChange={e => setFilterLab(e.target.value)}
                  >
                    {laboratorios.map(lab => (
                      <option key={lab} value={lab}>{lab === "todos" ? "Todos los laboratorios" : lab}</option>
                    ))}
                  </select>
                  <select
                    className="border rounded px-2 h-8 text-sm"
                    value={filterCat}
                    onChange={e => setFilterCat(e.target.value)}
                  >
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat === "todos" ? "Todas las categorías" : cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="text-center py-4 text-muted-foreground">Cargando inventario...</div>
              )}
              {error && (
                <div className="bg-red-100 text-red-700 border-l-4 border-red-500 p-2 rounded mb-2">{error}</div>
              )}
              <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-[1000px]">
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Código Barras</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Concentración</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Stock Mínimo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Precio Compra</TableHead>
                      <TableHead>Precio Venta</TableHead>
                      <TableHead>Laboratorio</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockFiltrado.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center text-muted-foreground py-4">
                          No hay productos para mostrar.
                        </TableCell>
                      </TableRow>
                    ) : stockFiltrado.map((item) => {
                      const estado = obtenerEstadoStock(item.cantidadUnidades, item.cantidadMinima)
                      const diasVencimiento = obtenerDiasVencimiento(item.fechaVencimiento)
                      const vencido = diasVencimiento <= 0
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.codigoBarras}</TableCell>
                          <TableCell>{item.nombre}</TableCell>
                          <TableCell>{item.concentracion}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.cantidadUnidades} unidades</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {stockMinBadge(item)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={estado.variant}>{estado.icon}{estado.texto}</Badge>
                          </TableCell>
                          <TableCell>
                            {item.precioCompra !== undefined && item.precioCompra !== null
                              ? Number(item.precioCompra).toFixed(2)
                              : "—"
                            }
                          </TableCell>
                          <TableCell>
                            {item.precioVenta !== undefined && item.precioVenta !== null
                              ? Number(item.precioVenta).toFixed(2)
                              : "—"
                            }
                          </TableCell>
                          <TableCell>{item.laboratorio}</TableCell>
                          <TableCell>{item.categoria}</TableCell>
                          <TableCell>
                            <div>
                              <div>
                                {item.fechaVencimiento
                                  ? new Date(item.fechaVencimiento).toLocaleDateString()
                                  : "—"}
                              </div>
                              <div
                                className={`text-sm ${vencido
                                  ? "text-red-600 font-bold"
                                  : diasVencimiento <= 30
                                    ? "text-orange-600"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {vencido
                                  ? "Vencido"
                                  : `${diasVencimiento} días`}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => editarStock(item)}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="critico" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Stock Crítico</CardTitle>
              <CardDescription>Productos que requieren reposición urgente</CardDescription>
            </CardHeader>
            <CardContent>
              {stockCritico.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No hay productos con stock crítico</div>
              ) : (
                <>
                  <Alert className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Atención</AlertTitle>
                    <AlertDescription>
                      Hay {stockCritico.length} productos que requieren reposición inmediata.
                    </AlertDescription>
                  </Alert>

                  <div className="rounded-md border overflow-x-auto">
                    <Table className="min-w-[700px]">
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead>Código Barras</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead>Stock Actual</TableHead>
                          <TableHead>Stock Mínimo</TableHead>
                          <TableHead>Diferencia</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stockCritico.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.codigoBarras}</TableCell>
                            <TableCell>{item.nombre}</TableCell>
                            <TableCell>
                              <Badge variant="destructive">{item.cantidadUnidades} unidades</Badge>
                            </TableCell>
                            <TableCell>
                              {stockMinBadge(item)}
                            </TableCell>
                            <TableCell className="text-red-600">
                              -{item.cantidadMinima - item.cantidadUnidades} unidades
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => editarStock(item)}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Editar</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vencimientos" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Próximos Vencimientos</CardTitle>
              <CardDescription>Productos que vencen en los próximos 30 días</CardDescription>
            </CardHeader>
            <CardContent>
              {(proximosVencer.length === 0 && productosVencidos.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground">No hay productos próximos a vencer ni vencidos</div>
              ) : (
                <>
                  {proximosVencer.length > 0 && (
                    <Alert className="mb-4">
                      <Calendar className="h-4 w-4" />
                      <AlertTitle>Productos próximos a vencer</AlertTitle>
                      <AlertDescription>
                        Hay {proximosVencer.length} productos que vencen en los próximos 30 días.
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="rounded-md border overflow-x-auto mb-6">
                    <Table className="min-w-[800px]">
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead>Código Barras</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead>Concentración</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Fecha Vencimiento</TableHead>
                          <TableHead>Días Restantes</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {proximosVencer.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-4">
                              No hay productos próximos a vencer.
                            </TableCell>
                          </TableRow>
                        ) : proximosVencer.map((item) => {
                          const diasVencimiento = obtenerDiasVencimiento(item.fechaVencimiento)
                          return (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.codigoBarras}</TableCell>
                              <TableCell>{item.nombre}</TableCell>
                              <TableCell>{item.concentracion}</TableCell>
                              <TableCell>{item.cantidadUnidades} unidades</TableCell>
                              <TableCell>{item.fechaVencimiento ? new Date(item.fechaVencimiento).toLocaleDateString() : "—"}</TableCell>
                              <TableCell>
                                <Badge variant={diasVencimiento <= 7 ? "destructive" : "secondary"}>
                                  {diasVencimiento} días
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => editarStock(item)}>
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Editar</span>
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Productos vencidos */}
                  {productosVencidos.length > 0 && (
                    <>
                      <Alert className="mb-4 bg-red-100 border-red-400">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertTitle className="text-red-700">Productos vencidos</AlertTitle>
                        <AlertDescription>
                          Hay {productosVencidos.length} productos que ya están vencidos. ¡Retíralos del stock!
                        </AlertDescription>
                      </Alert>
                      <div className="rounded-md border overflow-x-auto">
                        <Table className="min-w-[800px]">
                          <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                              <TableHead>Código Barras</TableHead>
                              <TableHead>Producto</TableHead>
                              <TableHead>Concentración</TableHead>
                              <TableHead>Stock</TableHead>
                              <TableHead>Fecha Vencimiento</TableHead>
                              <TableHead>Días Restantes</TableHead>
                              <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {productosVencidos.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.codigoBarras}</TableCell>
                                <TableCell>{item.nombre}</TableCell>
                                <TableCell>{item.concentracion}</TableCell>
                                <TableCell>{item.cantidadUnidades} unidades</TableCell>
                                <TableCell>{item.fechaVencimiento ? new Date(item.fechaVencimiento).toLocaleDateString() : "—"}</TableCell>
                                <TableCell>
                                  <Badge variant="destructive">Vencido</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="icon" onClick={() => editarStock(item)}>
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Editar</span>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para editar stock */}
      <Dialog open={!!editandoStock} onOpenChange={() => setEditandoStock(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Stock</DialogTitle>
            <DialogDescription>Modifica la información del stock del producto</DialogDescription>
          </DialogHeader>
          {editandoStock && (
            <form className="grid gap-4 py-4" onSubmit={e => { e.preventDefault(); guardarEdicion() }}>
              <div className="space-y-2">
                <Label>Producto</Label>
                <div className="text-sm font-medium">{editandoStock.nombre}</div>
                <div className="text-sm text-muted-foreground">Código: {editandoStock.codigoBarras}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-cantidad">Cantidad *</Label>
                  <Input
                    id="edit-cantidad"
                    type="number"
                    value={editandoStock.cantidadUnidades}
                    min={0}
                    onChange={(e) => setEditandoStock({ ...editandoStock, cantidadUnidades: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-cantidad-minima">Cantidad mínima (stock mínimo)</Label>
                  <Input
                    id="edit-cantidad-minima"
                    type="number"
                    value={editandoStock.cantidadMinima}
                    min={0}
                    onChange={(e) => setEditandoStock({ ...editandoStock, cantidadMinima: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-precio-compra">Precio de compra *</Label>
                  <Input
                    id="edit-precio-compra"
                    type="number"
                    step="0.01"
                    value={editandoStock.precioCompra}
                    min={0}
                    onChange={(e) => setEditandoStock({ ...editandoStock, precioCompra: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-fecha-vencimiento">Fecha de vencimiento</Label>
                  <Input
                    id="edit-fecha-vencimiento"
                    type="date"
                    value={editandoStock.fechaVencimiento}
                    onChange={(e) => setEditandoStock({ ...editandoStock, fechaVencimiento: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditandoStock(null)} type="button">
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar Cambios"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}