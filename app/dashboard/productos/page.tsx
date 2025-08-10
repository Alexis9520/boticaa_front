"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ComboBoxCategoria } from "@/components/ComboBoxCategoria";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Plus, Search, Trash2, Package, Calendar, DollarSign, Layers, Box, AlertCircle } from "lucide-react"
import { fetchWithAuth } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type StockLote = {
  codigoStock?: string  // NUEVO: para identificar el lote
  cantidadUnidades: number
  fechaVencimiento: string
  precioCompra: number
}

type Producto = {
  id: number
  codigoBarras: string
  nombre: string
  concentracion: string
  cantidadGeneral: number
  cantidadMinima?: number
  precioVentaUnd: number
  descuento: number
  laboratorio: string
  categoria: string
  cantidadUnidadesBlister?: number
  precioVentaBlister?: number
  fechaCreacion?: string
  stocks?: StockLote[]
}

const BACKEND_URL = "http://62.169.28.77:8080"

function generarCodigoLote(producto: Producto, index: number) {
  // Puedes mejorar esto según tu lógica
  return `${producto.codigoBarras}-${index + 1}`
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [lotesModalProducto, setLotesModalProducto] = useState<Producto | null>(null)
  const [nuevoProducto, setNuevoProducto] = useState({
    codigo_barras: "",
    nombre: "",
    concentracion: "",
    cantidad_general: "",
    cantidad_minima: "",
    precio_venta_und: "",
    descuento: "",
    laboratorio: "",
    categoria: "",
    cantidad_unidades_blister: "",
    precio_venta_blister: "",
    stocks: [] as StockLote[],
  })
  const [nuevoLote, setNuevoLote] = useState<StockLote>({
    codigoStock: "",
    cantidadUnidades: 0,
    fechaVencimiento: "",
    precioCompra: 0,
  })
  const [editandoProducto, setEditandoProducto] = useState<any>(null)
  const [editLoteIndex, setEditLoteIndex] = useState<number | null>(null)
  const [loteEnEdicion, setLoteEnEdicion] = useState<StockLote | null>(null)
  const { toast } = useToast()

  // Función para calcular días hasta vencimiento
  const calcularDiasParaVencer = (fechaVencimiento: string) => {
    const hoy = new Date()
    const fechaVence = new Date(fechaVencimiento)
    const diffTime = fechaVence.getTime() - hoy.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const obtenerEstadoLote = (fechaVencimiento: string) => {
    const dias = calcularDiasParaVencer(fechaVencimiento)
    if (dias < 0) return { estado: "vencido", color: "destructive", texto: "Vencido" }
    if (dias <= 30) return { estado: "vence-pronto", color: "secondary", texto: "Vence pronto" }
    return { estado: "vigente", color: "default", texto: "Vigente" }
  }

  const cargarProductos = async () => {
    try {
      const data = await fetchWithAuth(BACKEND_URL + "/productos");
      setProductos(data);
    } catch (err) {
      toast({ 
        title: "Error", 
        description: "No se pudo cargar productos", 
        variant: "destructive" 
      });
    }
  };

  useEffect(() => {
    cargarProductos()
  }, [])

  const productosFiltrados = productos.filter(
    (producto) =>
      producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      producto.codigoBarras.toLowerCase().includes(busqueda.toLowerCase()) ||
      (producto.categoria || "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (producto.laboratorio || "").toLowerCase().includes(busqueda.toLowerCase()),
  )

  const agregarProducto = async () => {
    const stocks = (nuevoProducto.stocks || []).map((lote, idx) => ({
      codigoStock: lote.codigoStock || generarCodigoLote({
        id: 0,
        codigoBarras: nuevoProducto.codigo_barras,
        nombre: nuevoProducto.nombre,
        concentracion: nuevoProducto.concentracion,
        cantidadGeneral: Number(nuevoProducto.cantidad_general) || 0,
        precioVentaUnd: Number(nuevoProducto.precio_venta_und) || 0,
        descuento: Number(nuevoProducto.descuento) || 0,
        laboratorio: nuevoProducto.laboratorio,
        categoria: nuevoProducto.categoria,
        cantidadMinima: Number(nuevoProducto.cantidad_minima) || 0,
        cantidadUnidadesBlister: Number(nuevoProducto.cantidad_unidades_blister) || 0,
        precioVentaBlister: Number(nuevoProducto.precio_venta_blister) || 0,
        stocks: [],
      }, idx),
      cantidadUnidades: Number(lote.cantidadUnidades) || 0,
      fechaVencimiento: lote.fechaVencimiento,
      precioCompra: Number(lote.precioCompra) || 0,
    }));

    const precioConDescuento = Number(nuevoProducto.descuento) || 0;

    try {
      const data = await fetchWithAuth(BACKEND_URL + "/productos/nuevo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigoBarras: nuevoProducto.codigo_barras,
          nombre: nuevoProducto.nombre,
          concentracion: nuevoProducto.concentracion,
          cantidadGeneral: stocks.reduce(
            (sum: number, lote: StockLote) => sum + Number(lote.cantidadUnidades),
            0
          ),
          cantidadMinima: Number(nuevoProducto.cantidad_minima) || 0,
          precioVentaUnd: Number(nuevoProducto.precio_venta_und),
          descuento: precioConDescuento,
          laboratorio: nuevoProducto.laboratorio,
          categoria: nuevoProducto.categoria,
          cantidadUnidadesBlister: Number(nuevoProducto.cantidad_unidades_blister) || 0,
          precioVentaBlister: Number(nuevoProducto.precio_venta_blister) || 0,
          stocks,
        }),
      });

      if (data) {
        if (data.reactivado) {
          toast({
            title: "Producto restaurado",
            description: "El producto fue reactivado y actualizado."
          });
        } else {
          toast({
            title: "Producto agregado",
            description: "El producto se ha agregado correctamente"
          });
        }
        setNuevoProducto({
          codigo_barras: "",
          nombre: "",
          concentracion: "",
          cantidad_general: "",
          cantidad_minima: "",
          precio_venta_und: "",
          descuento: "",
          laboratorio: "",
          categoria: "",
          cantidad_unidades_blister: "",
          precio_venta_blister: "",
          stocks: [],
        });
        setNuevoLote({
          codigoStock: "",
          cantidadUnidades: 0,
          fechaVencimiento: "",
          precioCompra: 0,
        });
        await cargarProductos();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el producto",
        variant: "destructive"
      });
    }
  };

  // Gestión de lotes - nuevo producto
  const agregarLoteANuevo = () => {
    if (!nuevoLote.cantidadUnidades || !nuevoLote.fechaVencimiento ) {
      toast({ title: "Error", description: "Completa todos los campos del lote", variant: "destructive" })
      return
    }
    setNuevoProducto({
      ...nuevoProducto,
      stocks: [...(nuevoProducto.stocks || []), { ...nuevoLote, codigoStock: nuevoLote.codigoStock || `L${(nuevoProducto.stocks.length+1).toString().padStart(2, '0')}` }]
    })
    setNuevoLote({ codigoStock: "", cantidadUnidades: 0, fechaVencimiento: "", precioCompra: 0 })
  }

  const eliminarLoteDeNuevo = (index: number) => {
    setNuevoProducto({
      ...nuevoProducto,
      stocks: nuevoProducto.stocks.filter((_, i) => i !== index)
    })
  }

  // Editar producto adaptando nombres de propiedades
  const editarProducto = (producto: Producto) => {
    setEditandoProducto({
      codigo_barras: producto.codigoBarras,
      nombre: producto.nombre,
      concentracion: producto.concentracion,
      cantidad_general: producto.cantidadGeneral.toString(),
      cantidad_minima: producto.cantidadMinima?.toString() || "",
      precio_venta_und: producto.precioVentaUnd.toString(),
      descuento: producto.descuento?.toString() || "",
      laboratorio: producto.laboratorio,
      categoria: producto.categoria,
      cantidad_unidades_blister: producto.cantidadUnidadesBlister?.toString() || "",
      precio_venta_blister: producto.precioVentaBlister?.toString() || "",
      stocks: (producto.stocks || []).map((lote, idx) => ({
        codigoStock: lote.codigoStock || generarCodigoLote(producto, idx),
        cantidadUnidades: lote.cantidadUnidades,
        fechaVencimiento: lote.fechaVencimiento,
        precioCompra: lote.precioCompra,
      }))
    })
  }

  // Gestión de lotes - edición de producto
  const agregarLoteAEdicion = () => {
    if (!loteEnEdicion?.cantidadUnidades || !loteEnEdicion.fechaVencimiento) {
      toast({ title: "Error", description: "Completa todos los campos obligatorios del lote", variant: "destructive" })
      return
    }
    setEditandoProducto((prev: any) => ({
      ...prev,
      stocks: [...(prev.stocks || []), { ...loteEnEdicion, codigoStock: loteEnEdicion.codigoStock || `L${(prev.stocks.length+1).toString().padStart(2, '0')}` }]
    }))
    setLoteEnEdicion({ codigoStock: "", cantidadUnidades: 0, fechaVencimiento: "", precioCompra: 0 })
    setEditLoteIndex(null)
  }

  const editarLoteDeEdicion = (idx: number) => {
    setLoteEnEdicion({ ...(editandoProducto.stocks[idx] || { codigoStock: "", cantidadUnidades: 0, fechaVencimiento: "", precioCompra: 0 }) })
    setEditLoteIndex(idx)
  }

  const guardarLoteEditado = () => {
    if (editLoteIndex === null || !loteEnEdicion) return
    setEditandoProducto((prev: any) => ({
      ...prev,
      stocks: prev.stocks.map((lote: StockLote, idx: number) =>
        idx === editLoteIndex ? { ...loteEnEdicion } : lote
      )
    }))
    setLoteEnEdicion({ codigoStock: "", cantidadUnidades: 0, fechaVencimiento: "", precioCompra: 0 })
    setEditLoteIndex(null)
  }

  const eliminarLoteDeEdicion = (index: number) => {
    setEditandoProducto((prev: any) => ({
      ...prev,
      stocks: prev.stocks.filter((_: any, i: number) => i !== index)
    }))
  }

  const guardarEdicion = async () => {
    if (!editandoProducto.codigo_barras || !editandoProducto.nombre || !editandoProducto.precio_venta_und) {
      toast({
        title: "Error",
        description: "Completa los campos obligatorios",
        variant: "destructive",
      })
      return
    }
    
    const stocks = (editandoProducto.stocks || []).map((lote: StockLote, idx: number) => ({
      codigoStock: lote.codigoStock || generarCodigoLote(editandoProducto as Producto, idx),
      cantidadUnidades: Number(lote.cantidadUnidades) || 0,
      fechaVencimiento: lote.fechaVencimiento,
      precioCompra: Number(lote.precioCompra) || 0,
    }))
    
    const precioConDescuento = Number(editandoProducto.descuento) || 0
    
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/productos/${editandoProducto.codigo_barras}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigoBarras: editandoProducto.codigo_barras,
          nombre: editandoProducto.nombre,
          concentracion: editandoProducto.concentracion,
          cantidadGeneral: stocks.reduce((sum: number, lote: StockLote) => sum + Number(lote.cantidadUnidades), 0),
          cantidadMinima: Number(editandoProducto.cantidad_minima) || 0,
          precioVentaUnd: Number(editandoProducto.precio_venta_und),
          descuento: precioConDescuento,
          laboratorio: editandoProducto.laboratorio,
          categoria: editandoProducto.categoria,
          cantidadUnidadesBlister: Number(editandoProducto.cantidad_unidades_blister) || 0,
          precioVentaBlister: Number(editandoProducto.cantidad_unidades_blister) || 0,
          stocks,
        }),
      })
      
      if (res) {
        toast({ title: "Producto actualizado", description: "Los cambios se han guardado correctamente" })
        setProductos(prev => prev.map(p => 
          p.codigoBarras === editandoProducto.codigo_barras 
            ? {
                ...res,
                id: p.id,
                fechaCreacion: p.fechaCreacion,
              }
            : p
        ))
        setEditandoProducto(null)
        setLoteEnEdicion(null)
        setEditLoteIndex(null)
      } else {
        toast({ title: "Error", description: "No se pudo actualizar el producto", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Error de conexión", variant: "destructive" })
    }
  }

  const eliminarProducto = async (codigoBarras: string) => {
    try {
      await fetchWithAuth(`${BACKEND_URL}/productos/${codigoBarras}`, { method: "DELETE" });
      toast({ title: "Producto eliminado", description: "El producto se ha eliminado correctamente" });
      await cargarProductos();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "No se pudo eliminar el producto", variant: "destructive" });
    }
  }

  function calcularDescuentoPorcentaje(precio: number, precioConDescuento: number) {
    if (!precio || !precioConDescuento || precioConDescuento >= precio) return 0
    return Math.round((100 * (precio - precioConDescuento)) / precio)
  }

  // Visual helpers para cantidad mínima
  function stockMinBadge(producto: Producto) {
    if (producto.cantidadMinima === undefined) return null
    const esCritico = producto.cantidadGeneral <= (producto.cantidadMinima ?? 0)
    return (
      <span className="block text-xs mt-0.5">
        Min: <span className="font-semibold">{producto.cantidadMinima}</span>
        {esCritico && (
          <Badge variant="destructive" className="ml-2 inline-flex items-center gap-1 px-2 py-0.5">
            <AlertCircle className="w-3 h-3" /> Crítico
          </Badge>
        )}
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Gestión de Productos</h1>
          <p className="text-muted-foreground text-base">Administra el catálogo de productos de la farmacia</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nuevo Producto</DialogTitle>
                <DialogDescription>Agrega un nuevo producto al catálogo</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 overflow-y-auto max-h-[70vh]">
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="codigo_barras">Código de barras *</Label>
                      <Input
                        id="codigo_barras"
                        placeholder="P001"
                        value={nuevoProducto.codigo_barras}
                        onChange={(e) => setNuevoProducto({ ...nuevoProducto, codigo_barras: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre *</Label>
                      <Input
                        id="nombre"
                        placeholder="Nombre del producto"
                        value={nuevoProducto.nombre}
                        onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="concentracion">Concentración</Label>
                      <Input
                        id="concentracion"
                        placeholder="500mg, 10mg, etc"
                        value={nuevoProducto.concentracion}
                        onChange={(e) => setNuevoProducto({ ...nuevoProducto, concentracion: e.target.value })}
                      />
                    </div>
                    <ComboBoxCategoria
                      value={nuevoProducto.categoria}
                      onChange={categoria => setNuevoProducto({ ...nuevoProducto, categoria })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="laboratorio">Laboratorio</Label>
                      <Input
                        id="laboratorio"
                        placeholder="Nombre del laboratorio"
                        value={nuevoProducto.laboratorio}
                        onChange={(e) => setNuevoProducto({ ...nuevoProducto, laboratorio: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cantidad_general">Stock inicial</Label>
                      <Input
                        id="cantidad_general"
                        type="number"
                        placeholder="0"
                        value={nuevoProducto.stocks.reduce((sum, lote) => sum + Number(lote.cantidadUnidades), 0)}
                        disabled
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cantidad_minima">Cantidad mínima (stock mínimo)</Label>
                      <Input
                        id="cantidad_minima"
                        type="number"
                        min="0"
                        placeholder="Ej: 10"
                        value={nuevoProducto.cantidad_minima}
                        onChange={e => setNuevoProducto({ ...nuevoProducto, cantidad_minima: e.target.value })}
                      />
                    </div>
                    <div />
                  </div>
                  {/* Nuevos campos de blister */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cantidad_unidades_blister">
                        <Layers className="inline h-4 w-4 mr-1 text-primary" /> Unidades por blister
                      </Label>
                      <Input
                        id="cantidad_unidades_blister"
                        type="number"
                        min="1"
                        placeholder="Ej: 10"
                        value={nuevoProducto.cantidad_unidades_blister}
                        onChange={e => setNuevoProducto({ ...nuevoProducto, cantidad_unidades_blister: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="precio_venta_blister">
                        <Box className="inline h-4 w-4 mr-1 text-primary" /> Precio venta blister
                      </Label>
                      <Input
                        id="precio_venta_blister"
                        type="number"
                        step="0.01"
                        placeholder="Ej: 5.00"
                        value={nuevoProducto.precio_venta_blister}
                        onChange={e => setNuevoProducto({ ...nuevoProducto, precio_venta_blister: e.target.value })}
                      />
                    </div>
                  </div>
                  {/* Lotes */}
                  <div className="space-y-2">
                    <Label>Lotes (stocks)</Label>
                    <div className="grid grid-cols-4 gap-4 mb-2">
                      <Input
                        placeholder="Código lote"
                        value={nuevoLote.codigoStock || ""}
                        onChange={e => setNuevoLote({ ...nuevoLote, codigoStock: e.target.value })}
                      />
                      <Input
                        type="number"
                        placeholder="Unidades"
                        value={nuevoLote.cantidadUnidades || ""}
                        min={1}
                        onChange={e => setNuevoLote({ ...nuevoLote, cantidadUnidades: Number(e.target.value) })}
                      />
                      <Input
                        type="date"
                        placeholder="Vencimiento"
                        value={nuevoLote.fechaVencimiento}
                        onChange={e => setNuevoLote({ ...nuevoLote, fechaVencimiento: e.target.value })}
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Precio compra"
                        value={nuevoLote.precioCompra || ""}
                        min={0}
                        onChange={e => setNuevoLote({ ...nuevoLote, precioCompra: Number(e.target.value) })}
                      />
                    </div>
                    <Button type="button" variant="outline" onClick={agregarLoteANuevo}>Agregar Lote</Button>
                    <div className="mt-2">
                      {nuevoProducto.stocks.length === 0 && <div className="text-sm text-muted-foreground">Sin lotes agregados</div>}
                      {nuevoProducto.stocks.length > 0 &&
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Código Lote</TableHead>
                              <TableHead>Unidades</TableHead>
                              <TableHead>Vencimiento</TableHead>
                              <TableHead>Precio Compra</TableHead>
                              <TableHead>Acción</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {nuevoProducto.stocks.map((lote, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{lote.codigoStock}</TableCell>
                                <TableCell>{lote.cantidadUnidades}</TableCell>
                                <TableCell>{lote.fechaVencimiento}</TableCell>
                                <TableCell>S/ {Number(lote.precioCompra).toFixed(2)}</TableCell>
                                <TableCell>
                                  <Button type="button" variant="ghost" size="icon" onClick={() => eliminarLoteDeNuevo(idx)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      }
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="precio_venta_und">Precio de venta *</Label>
                      <Input
                        id="precio_venta_und"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={nuevoProducto.precio_venta_und}
                        onChange={(e) => setNuevoProducto({ ...nuevoProducto, precio_venta_und: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descuento">Precio con descuento</Label>
                      <Input
                        id="descuento"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={nuevoProducto.descuento}
                        onChange={(e) => setNuevoProducto({ ...nuevoProducto, descuento: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={agregarProducto}>Agregar Producto</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Catálogo de Productos</CardTitle>
          <CardDescription>Lista completa de productos disponibles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar productos..."
                className="pl-8"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código Barras</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Concentración</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Laboratorio</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Stock Total</TableHead>
                  <TableHead>Stock Mínimo</TableHead>
                  <TableHead>Unidades/Blister</TableHead>
                  <TableHead>Precio Blister</TableHead>
                  <TableHead>Descuento</TableHead>
                  <TableHead>Lotes</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productosFiltrados.map((producto) => (
                  <TableRow key={`${producto.id}-${producto.codigoBarras}`}>
                    <TableCell className="font-medium">{producto.codigoBarras}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{producto.nombre}</div>
                      </div>
                    </TableCell>
                    <TableCell>{producto.concentracion || <span className="text-muted-foreground">--</span>}</TableCell>
                    <TableCell>{producto.categoria}</TableCell>
                    <TableCell>{producto.laboratorio}</TableCell>
                    <TableCell>
                      S/ {Number(producto.precioVentaUnd).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          producto.cantidadGeneral <= (producto.cantidadMinima ?? 10)
                            ? "destructive"
                            : producto.cantidadGeneral <= (producto.cantidadMinima ?? 10) * 2
                              ? "secondary"
                              : "default"
                        }
                      >
                        {producto.cantidadGeneral} unidades
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {producto.cantidadMinima !== undefined ? (
                        <>
                          <span>{producto.cantidadMinima}</span>
                          {stockMinBadge(producto)}
                        </>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {producto.cantidadUnidadesBlister ? (
                        <Badge variant="outline" className="text-xs">{producto.cantidadUnidadesBlister} u.</Badge>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {producto.precioVentaBlister ? (
                        <Badge variant="outline" className="text-xs">
                          S/ {Number(producto.precioVentaBlister).toFixed(2)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {producto.descuento > 0 && producto.descuento < producto.precioVentaUnd ? (
                        <Badge variant="outline">
                          {calcularDescuentoPorcentaje(Number(producto.precioVentaUnd), Number(producto.descuento))}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {(producto.stocks?.length ?? 0) > 0 ? (
                        <div className="space-y-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-pointer">
                                  <div className="flex items-center gap-1 mb-1">
                                    <Badge variant="outline" className="text-xs px-2 py-1">
                                      <Package className="w-3 h-3 mr-1" />
                                      <span className="font-semibold text-blue-600">
                                        {producto.stocks?.[0]?.cantidadUnidades}u
                                      </span>
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs px-2 py-1">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {new Date(producto.stocks?.[0]?.fechaVencimiento || '').toLocaleDateString('es-PE', {
                                        day: '2-digit',
                                        month: '2-digit'
                                      })}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <span>{producto.stocks?.length} lote{producto.stocks?.length !== 1 ? 's' : ''}</span>
                                    {(producto.stocks?.length ?? 0) > 1 && (
                                      <span className="text-blue-500">+{(producto.stocks?.length ?? 0) - 1} más</span>
                                    )}
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-sm p-3" align="start">
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                                    <Package className="w-4 h-4" />
                                    Lotes disponibles:
                                  </h4>
                                  {producto.stocks?.map((lote, idx) => {
                                    const estadoLote = obtenerEstadoLote(lote.fechaVencimiento)
                                    return (
                                      <div key={idx} className="flex justify-between items-center text-xs border-b pb-1 last:border-b-0">
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="text-xs">
                                            {lote.cantidadUnidades}u
                                          </Badge>
                                          <div className="flex flex-col">
                                            <span>Vence: {new Date(lote.fechaVencimiento).toLocaleDateString('es-PE')}</span>
                                            <Badge variant={estadoLote.color as any} className="text-xs w-fit">
                                              {estadoLote.texto}
                                            </Badge>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <DollarSign className="w-3 h-3" />
                                          <span className="text-green-600 font-medium">
                                            {Number(lote.precioCompra).toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                    )
                                  })}
                                  <div className="border-t pt-2 mt-2 text-xs">
                                    <div className="flex justify-between">
                                      <span className="font-medium">Total:</span>
                                      <span className="text-blue-600 font-semibold">
                                        {producto.stocks?.reduce((sum, lote) => sum + lote.cantidadUnidades, 0)} unidades
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="font-medium">Valor:</span>
                                      <span className="text-green-600 font-semibold">
                                        S/ {producto.stocks?.reduce((sum, lote) =>
                                          sum + (lote.cantidadUnidades * lote.precioCompra), 0
                                        ).toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          {(producto.stocks?.length ?? 0) > 2 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs w-full"
                              onClick={() => setLotesModalProducto(producto)}
                            >
                              Ver todos los lotes
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">Sin lotes</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => editarProducto(producto)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => eliminarProducto(producto.codigoBarras)}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>


      

      {/* Modal detallado de lotes */}
      <Dialog open={!!lotesModalProducto} onOpenChange={() => setLotesModalProducto(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Lotes de {lotesModalProducto?.nombre}
            </DialogTitle>
            <DialogDescription>
              Código: {lotesModalProducto?.codigoBarras} • Total: {lotesModalProducto?.stocks?.length ?? 0} lotes
            </DialogDescription>
          </DialogHeader>
          {lotesModalProducto && (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código Lote</TableHead> {/* NUEVO */}
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Fecha Vencimiento</TableHead>
                    <TableHead>Precio Compra</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Días para vencer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lotesModalProducto.stocks?.map((lote, idx) => {
                    const diasParaVencer = calcularDiasParaVencer(lote.fechaVencimiento)
                    const estadoLote = obtenerEstadoLote(lote.fechaVencimiento)
                    return (
                      <TableRow key={idx}>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1">
                            {/* NUEVO */}
                            {lote.codigoStock || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            {lote.cantidadUnidades} unidades
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {new Date(lote.fechaVencimiento).toLocaleDateString('es-PE')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            S/ {Number(lote.precioCompra).toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={estadoLote.color as any}>
                            {estadoLote.texto}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={diasParaVencer < 0 ? "text-red-600" : diasParaVencer <= 30 ? "text-yellow-600" : "text-green-600"}>
                            {diasParaVencer < 0 ? `Vencido hace ${Math.abs(diasParaVencer)} días` : `${diasParaVencer} días`}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              <div className="bg-muted p-4 rounded-lg">
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <span className="font-medium block">Total unidades</span>
                    <div className="text-2xl font-bold text-blue-600">
                      {lotesModalProducto.stocks?.reduce((sum, lote) => sum + lote.cantidadUnidades, 0)}
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="font-medium block">Total lotes</span>
                    <div className="text-2xl font-bold text-green-600">
                      {lotesModalProducto.stocks?.length ?? 0}
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="font-medium block">Valor inventario</span>
                    <div className="text-2xl font-bold text-purple-600">
                      S/ {lotesModalProducto.stocks?.reduce((sum, lote) => 
                        sum + (lote.cantidadUnidades * lote.precioCompra), 0
                      ).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="font-medium block">Próximo vencimiento</span>
                    <div className="text-lg font-bold text-orange-600">
                      {lotesModalProducto.stocks && lotesModalProducto.stocks.length > 0 
                        ? Math.min(...lotesModalProducto.stocks.map(lote => calcularDiasParaVencer(lote.fechaVencimiento)))
                        : 0} días
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para editar producto igual al anterior, solo incluye los campos de stock mínimo */}
      <Dialog open={!!editandoProducto} onOpenChange={() => { setEditandoProducto(null); setLoteEnEdicion(null); setEditLoteIndex(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
            <DialogDescription>Modifica la información del producto</DialogDescription>
          </DialogHeader>
           <div className="grid gap-4 py-4 overflow-y-auto max-h-[70vh]">
            {editandoProducto && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-codigo_barras">Código de barras *</Label>
                    <Input
                      id="edit-codigo_barras"
                      value={editandoProducto.codigo_barras}
                      onChange={(e) => setEditandoProducto({ ...editandoProducto, codigo_barras: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-nombre">Nombre *</Label>
                    <Input
                      id="edit-nombre"
                      value={editandoProducto.nombre}
                      onChange={(e) => setEditandoProducto({ ...editandoProducto, nombre: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-concentracion">Concentración</Label>
                    <Input
                      id="edit-concentracion"
                      value={editandoProducto.concentracion}
                      onChange={(e) => setEditandoProducto({ ...editandoProducto, concentracion: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-categoria"></Label>
                    <ComboBoxCategoria
                      value={editandoProducto.categoria}
                      onChange={categoria => setEditandoProducto({ ...editandoProducto, categoria })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-laboratorio">Laboratorio</Label>
                    <Input
                      id="edit-laboratorio"
                      value={editandoProducto.laboratorio}
                      onChange={(e) => setEditandoProducto({ ...editandoProducto, laboratorio: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-cantidad_general">Stock</Label>
                    <Input
                      id="edit-cantidad_general"
                      type="number"
                      value={Array.isArray(editandoProducto.stocks) ? editandoProducto.stocks.reduce((sum: number, lote: StockLote) => sum + Number(lote.cantidadUnidades), 0) : editandoProducto.cantidad_general}
                      disabled
                    />
                  </div>
                </div>
                {/* Campo stock mínimo (edición) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-cantidad_minima">Cantidad mínima (stock mínimo)</Label>
                    <Input
                      id="edit-cantidad_minima"
                      type="number"
                      min="0"
                      value={editandoProducto.cantidad_minima}
                      onChange={e => setEditandoProducto({ ...editandoProducto, cantidad_minima: e.target.value })}
                    />
                  </div>
                  <div />
                </div>
                {/* Campos blister (edición) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-cantidad_unidades_blister">
                      <Layers className="inline h-4 w-4 mr-1 text-primary" /> Unidades por blister
                    </Label>
                    <Input
                      id="edit-cantidad_unidades_blister"
                      type="number"
                      min="1"
                      value={editandoProducto.cantidad_unidades_blister}
                      onChange={e => setEditandoProducto({ ...editandoProducto, cantidad_unidades_blister: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-precio_venta_blister">
                      <Box className="inline h-4 w-4 mr-1 text-primary" /> Precio venta blister
                    </Label>
                    <Input
                      id="edit-precio_venta_blister"
                      type="number"
                      step="0.01"
                      value={editandoProducto.precio_venta_blister}
                      onChange={e => setEditandoProducto({ ...editandoProducto, precio_venta_blister: e.target.value })}
                    />
                  </div>
                </div>
                {/* Lotes */}
                <div className="space-y-2">
                  <Label>Lotes (stocks)</Label>
                  <div className="grid grid-cols-4 gap-4 mb-2">
                    <Input
                      placeholder="Código lote"
                      value={loteEnEdicion?.codigoStock ?? ""}
                      onChange={e => setLoteEnEdicion(old => ({ ...old, codigoStock: e.target.value } as StockLote))}
                    />
                    <Input
                      type="number"
                      placeholder="Unidades"
                      value={loteEnEdicion?.cantidadUnidades ?? ""}
                      min={1}
                      onChange={e => setLoteEnEdicion(old => ({ ...old, cantidadUnidades: Number(e.target.value) } as StockLote))}
                    />
                    <Input
                      type="date"
                      placeholder="Vencimiento"
                      value={loteEnEdicion?.fechaVencimiento ?? ""}
                      onChange={e => setLoteEnEdicion(old => ({ ...old, fechaVencimiento: e.target.value } as StockLote))}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Precio compra"
                      value={loteEnEdicion?.precioCompra !== undefined ? String(loteEnEdicion.precioCompra) : ""}
                      min={0}
                      onChange={e =>
                        setLoteEnEdicion(old =>
                          ({ ...old, precioCompra: Number(e.target.value) } as StockLote)
                        )
                      }
                    />
                  </div>
                  <div className="flex gap-2 mb-2">
                    {editLoteIndex === null ? (
                      <Button type="button" variant="outline" onClick={agregarLoteAEdicion}>Agregar Lote</Button>
                    ) : (
                      <Button type="button" variant="outline" onClick={guardarLoteEditado}>Guardar Edición de Lote</Button>
                    )}
                    {editLoteIndex !== null && (
                      <Button type="button" variant="ghost" onClick={() => { setEditLoteIndex(null); setLoteEnEdicion(null); }}>
                        Cancelar edición
                      </Button>
                    )}
                  </div>
                  <div className="mt-2">
                    {(!editandoProducto.stocks || editandoProducto.stocks.length === 0) && <div className="text-sm text-muted-foreground">Sin lotes</div>}
                    {editandoProducto.stocks && editandoProducto.stocks.length > 0 &&
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Código Lote</TableHead>
                            <TableHead>Unidades</TableHead>
                            <TableHead>Vencimiento</TableHead>
                            <TableHead>Precio Compra</TableHead>
                            <TableHead>Acción</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {editandoProducto.stocks.map((lote: StockLote, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell>{lote.codigoStock}</TableCell>
                              <TableCell>{lote.cantidadUnidades}</TableCell>
                              <TableCell>{lote.fechaVencimiento}</TableCell>
                              <TableCell>S/ {Number(lote.precioCompra).toFixed(2)}</TableCell>
                              <TableCell className="flex gap-2">
                                <Button type="button" variant="ghost" size="icon" onClick={() => editarLoteDeEdicion(idx)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" onClick={() => eliminarLoteDeEdicion(idx)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    }
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-precio_venta_und">Precio de venta *</Label>
                    <Input
                      id="edit-precio_venta_und"
                      type="number"
                      step="0.01"
                      value={editandoProducto.precio_venta_und}
                      onChange={(e) => setEditandoProducto({ ...editandoProducto, precio_venta_und: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-descuento">Precio con descuento</Label>
                    <Input
                      id="edit-descuento"
                      type="number"
                      step="0.01"
                      value={editandoProducto.descuento}
                      onChange={(e) => setEditandoProducto({ ...editandoProducto, descuento: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditandoProducto(null); setLoteEnEdicion(null); setEditLoteIndex(null); }}>
              Cancelar
            </Button>
            <Button onClick={guardarEdicion}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}