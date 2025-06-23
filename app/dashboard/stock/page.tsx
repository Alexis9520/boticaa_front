"use client"

import { useEffect, useState } from "react"
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
import { AlertTriangle, Calendar, Edit, Package, Search, TrendingDown, TrendingUp } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
  // lote?: string // Elimínalo si tu backend no lo da
}

export default function StockPage() {
  const [stock, setStock] = useState<StockItem[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [editandoStock, setEditandoStock] = useState<StockItem | null>(null)
  const { toast } = useToast()

  // Cargar stock y productos desde backend
  useEffect(() => {
    fetch("/api/stock")
      .then(res => res.json())
      .then((data) => setStock(data))
  }, [])

  const stockFiltrado = stock.filter(
    (item) =>
      item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.codigoBarras.toLowerCase().includes(busqueda.toLowerCase())
  )

  const stockCritico = stock.filter((item) => item.cantidadUnidades <= item.cantidadMinima)
  const proximosVencer = stock.filter((item) => {
    const fechaVencimiento = new Date(item.fechaVencimiento)
    const hoy = new Date()
    const diasDiferencia = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 3600 * 24))
    return diasDiferencia <= 30 && diasDiferencia > 0
  })

  const editarStock = (item: StockItem) => {
    setEditandoStock({ ...item })
  }

  const guardarEdicion = async () => {
    if (
      !editandoStock?.cantidadUnidades ||
      !editandoStock?.precioCompra
    ) {
      toast({
        title: "Error",
        description: "Completa todos los campos obligatorios",
        variant: "destructive",
      })
      return
    }
    const res = await fetch(`/api/stock/${editandoStock.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cantidadUnidades: editandoStock.cantidadUnidades,
        cantidadMinima: editandoStock.cantidadMinima,
        precioCompra: editandoStock.precioCompra,
        fechaVencimiento: editandoStock.fechaVencimiento,
      }),
    })
    if (res.ok) {
      toast({ title: "Stock actualizado", description: "Los cambios se han guardado correctamente" })
      fetch("/api/stock").then(res => res.json()).then(data => setStock(data))
      setEditandoStock(null)
    } else {
      toast({ title: "Error", description: "No se pudo actualizar el stock", variant: "destructive" })
    }
  }

  const obtenerEstadoStock = (cantidad: number, minima: number) => {
    if (cantidad === 0) return { variant: "destructive" as const, texto: "Agotado" }
    if (cantidad <= minima) return { variant: "destructive" as const, texto: "Crítico" }
    if (cantidad <= minima * 2) return { variant: "secondary" as const, texto: "Bajo" }
    return { variant: "default" as const, texto: "Normal" }
  }

  const obtenerDiasVencimiento = (fechaVencimiento: string) => {
    const fecha = new Date(fechaVencimiento)
    const hoy = new Date()
    return Math.ceil((fecha.getTime() - hoy.getTime()) / (1000 * 3600 * 24))
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Stock</h1>
          <p className="text-muted-foreground">Controla el inventario y fechas de vencimiento</p>
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
            <CardHeader className="pb-3">
              <CardTitle>Inventario General</CardTitle>
              <CardDescription>Lista completa del stock disponible</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar por producto, código..."
                    className="pl-8"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código Barras</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Concentración</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Precio Compra</TableHead>
                      <TableHead>Precio Venta</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockFiltrado.map((item) => {
                      const estado = obtenerEstadoStock(item.cantidadUnidades, item.cantidadMinima)
                      const diasVencimiento = obtenerDiasVencimiento(item.fechaVencimiento)

                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.codigoBarras}</TableCell>
                          <TableCell>{item.nombre}</TableCell>
                          <TableCell>{item.concentracion}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.cantidadUnidades} unidades</div>
                              <div className="text-sm text-muted-foreground">Mín: {item.cantidadMinima}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={estado.variant}>{estado.texto}</Badge>
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
                          <TableCell>
                            <div>
                              <div>
                                {item.fechaVencimiento
                                  ? new Date(item.fechaVencimiento).toLocaleDateString()
                                  : "—"}
                              </div>
                              <div
                                className={`text-sm ${
                                  diasVencimiento <= 30
                                    ? "text-orange-600"
                                    : diasVencimiento <= 0
                                      ? "text-red-600"
                                      : "text-muted-foreground"
                                }`}
                              >
                                {diasVencimiento > 0 ? `${diasVencimiento} días` : "Vencido"}
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

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
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
                            <TableCell>{item.cantidadMinima} unidades</TableCell>
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
              {proximosVencer.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No hay productos próximos a vencer</div>
              ) : (
                <>
                  <Alert className="mb-4">
                    <Calendar className="h-4 w-4" />
                    <AlertTitle>Productos próximos a vencer</AlertTitle>
                    <AlertDescription>
                      Hay {proximosVencer.length} productos que vencen en los próximos 30 días.
                    </AlertDescription>
                  </Alert>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
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
                        {proximosVencer.map((item) => {
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
            <div className="grid gap-4 py-4">
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
                    onChange={(e) => setEditandoStock({ ...editandoStock, cantidadUnidades: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-cantidad-minima">Cantidad mínima</Label>
                  <Input
                    id="edit-cantidad-minima"
                    type="number"
                    value={editandoStock.cantidadMinima}
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
                    onChange={(e) => setEditandoStock({ ...editandoStock, precioCompra: Number(e.target.value) })}
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
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditandoStock(null)}>
              Cancelar
            </Button>
            <Button onClick={guardarEdicion}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}