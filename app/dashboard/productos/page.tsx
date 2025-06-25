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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { Edit, Plus, Search, Trash2 } from "lucide-react"
import { fetchWithAuth } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type StockLote = {
  cantidadUnidades: number
  fechaVencimiento: string
  precioCompra: number
}

type Producto = {
  id: number
  codigo_barras: string
  nombre: string
  concentracion: string
  cantidad_general: number
  precio_venta_und: number
  descuento: number // ahora será el "precio con descuento"
  laboratorio: string
  categoria: string
  fecha_creacion?: string
  stocks?: StockLote[]
}

const BACKEND_URL = "http://51.161.10.179:8080"

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [nuevoProducto, setNuevoProducto] = useState({
    codigo_barras: "",
    nombre: "",
    concentracion: "",
    cantidad_general: "",
    precio_venta_und: "",
    descuento: "", // aquí el precio con descuento
    laboratorio: "",
    categoria: "",
    stocks: [] as StockLote[],
  })
  const [nuevoLote, setNuevoLote] = useState<StockLote>({
    cantidadUnidades: 0,
    fechaVencimiento: "",
    precioCompra: 0,
  })
  const [editandoProducto, setEditandoProducto] = useState<any>(null)
  const [editLoteIndex, setEditLoteIndex] = useState<number | null>(null)
  const [loteEnEdicion, setLoteEnEdicion] = useState<StockLote | null>(null)
  const { toast } = useToast()

  // Cargar productos al iniciar
  const cargarProductos = () => {
  fetchWithAuth(BACKEND_URL + "/productos")
    .then(data => {
      
      const productosAdaptados = data.map((prod: any) => ({
        id: prod.id,
        codigo_barras: prod.codigoBarras,
        nombre: prod.nombre,
        concentracion: prod.concentracion,
        cantidad_general: prod.cantidadGeneral,
        precio_venta_und: prod.precioVentaUnd,
        descuento: prod.descuento,
        laboratorio: prod.laboratorio,
        categoria: prod.categoria,
        fecha_creacion: prod.fechaCreacion,
        fecha_actualizacion: prod.fechaActualizacion,
        stocks: prod.stocks || [],
      }));
      setProductos(productosAdaptados);
    })
    .catch((err) => {
      console.error("Error al cargar productos:", err);
      toast({ title: "Error", description: "No se pudo cargar productos", variant: "destructive" });
    });
};

  useEffect(() => {
    cargarProductos()
  }, [])

  const productosFiltrados = productos.filter(
    (producto) =>
      producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      producto.codigo_barras.toLowerCase().includes(busqueda.toLowerCase()) ||
      (producto.categoria || "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (producto.laboratorio || "").toLowerCase().includes(busqueda.toLowerCase()),
  )
  const agregarProducto = async () => {
    const stocks = (nuevoProducto.stocks || []).map(lote => ({
      cantidadUnidades: Number(lote.cantidadUnidades) || 0,
      fechaVencimiento: lote.fechaVencimiento,
      precioCompra: Number(lote.precioCompra) || 0,
    }));

    const precioConDescuento = Number(nuevoProducto.descuento) || 0;

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
        precioVentaUnd: Number(nuevoProducto.precio_venta_und),
        descuento: precioConDescuento,
        laboratorio: nuevoProducto.laboratorio,
        categoria: nuevoProducto.categoria,
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
        precio_venta_und: "",
        descuento: "",
        laboratorio: "",
        categoria: "",
        stocks: [],
      });
      setNuevoLote({
        cantidadUnidades: 0,
        fechaVencimiento: "",
        precioCompra: 0,
      });
      cargarProductos();
    } else {
      toast({
        title: "Error",
        description: "No se pudo agregar el producto",
        variant: "destructive"
      });
    }
  };

  // GESTIÓN DE LOTES - NUEVO PRODUCTO
  const agregarLoteANuevo = () => {
    if (!nuevoLote.cantidadUnidades || !nuevoLote.fechaVencimiento || !nuevoLote.precioCompra) {
      toast({ title: "Error", description: "Completa todos los campos del lote", variant: "destructive" })
      return
    }
    setNuevoProducto({
      ...nuevoProducto,
      stocks: [...(nuevoProducto.stocks || []), { ...nuevoLote }]
    })
    setNuevoLote({ cantidadUnidades: 0, fechaVencimiento: "", precioCompra: 0 })
  }

  const eliminarLoteDeNuevo = (index: number) => {
    setNuevoProducto({
      ...nuevoProducto,
      stocks: nuevoProducto.stocks.filter((_, i) => i !== index)
    })
  }

  // EDITAR PRODUCTO
  const editarProducto = (producto: Producto) => {
    setEditandoProducto({
      ...producto,
      cantidad_general: producto.cantidad_general.toString(),
      precio_venta_und: producto.precio_venta_und.toString(),
      descuento: producto.descuento?.toString() || "",
      stocks: (producto.stocks || []).map(lote => ({
        cantidadUnidades: lote.cantidadUnidades,
        fechaVencimiento: lote.fechaVencimiento,
        precioCompra: lote.precioCompra,
      }))
    })
  }

  // GESTIÓN DE LOTES - EDICIÓN DE PRODUCTO
  const agregarLoteAEdicion = () => {
    if (!loteEnEdicion?.cantidadUnidades || !loteEnEdicion.fechaVencimiento || !loteEnEdicion.precioCompra) {
      toast({ title: "Error", description: "Completa todos los campos del lote", variant: "destructive" })
      return
    }
    setEditandoProducto((prev: any) => ({
      ...prev,
      stocks: [...(prev.stocks || []), { ...loteEnEdicion }]
    }))
    setLoteEnEdicion({ cantidadUnidades: 0, fechaVencimiento: "", precioCompra: 0 })
    setEditLoteIndex(null)
  }

  const editarLoteDeEdicion = (idx: number) => {
    setLoteEnEdicion({ ...(editandoProducto.stocks[idx] || { cantidadUnidades: 0, fechaVencimiento: "", precioCompra: 0 }) })
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
    setLoteEnEdicion({ cantidadUnidades: 0, fechaVencimiento: "", precioCompra: 0 })
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
    const stocks = (editandoProducto.stocks || []).map((lote: StockLote) => ({
      cantidadUnidades: Number(lote.cantidadUnidades) || 0,
      fechaVencimiento: lote.fechaVencimiento,
      precioCompra: Number(lote.precioCompra) || 0,
    }))
    const precioConDescuento = Number(editandoProducto.descuento) || 0
    const res = await fetchWithAuth(`${BACKEND_URL}/productos/${editandoProducto.codigo_barras}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codigoBarras: editandoProducto.codigo_barras,
        nombre: editandoProducto.nombre,
        concentracion: editandoProducto.concentracion,
        cantidadGeneral: stocks.reduce((sum: number, lote: StockLote) => sum + Number(lote.cantidadUnidades), 0),
        precioVentaUnd: Number(editandoProducto.precio_venta_und),
        descuento: precioConDescuento,
        laboratorio: editandoProducto.laboratorio,
        categoria: editandoProducto.categoria,
        stocks,
      }),
    })
    if (res) {
      toast({ title: "Producto actualizado", description: "Los cambios se han guardado correctamente" })
      setEditandoProducto(null)
      setLoteEnEdicion(null)
      setEditLoteIndex(null)
      cargarProductos()
    } else {
      toast({ title: "Error", description: "No se pudo actualizar el producto", variant: "destructive" })
    }
  }

  // ELIMINAR PRODUCTO (borrado lógico)
  const eliminarProducto = async (codigo_barras: string) => {
    try {
      await fetchWithAuth(`${BACKEND_URL}/productos/${codigo_barras}`, { method: "DELETE" });
      toast({ title: "Producto eliminado", description: "El producto se ha eliminado correctamente" });
      cargarProductos();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "No se pudo eliminar el producto", variant: "destructive" });
    }
  }

  // Calcula el descuento en % solo para mostrar
  function calcularDescuentoPorcentaje(precio: number, precioConDescuento: number) {
    if (!precio || !precioConDescuento || precioConDescuento >= precio) return 0
    return Math.round((100 * (precio - precioConDescuento)) / precio)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Productos</h1>
          <p className="text-muted-foreground">Administra el catálogo de productos de la farmacia</p>
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
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoría</Label>
                    <Select
                      value={nuevoProducto.categoria}
                      onValueChange={(value) => setNuevoProducto({ ...nuevoProducto, categoria: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Analgésicos">Analgésicos</SelectItem>
                        <SelectItem value="Antibióticos">Antibióticos</SelectItem>
                        <SelectItem value="Antiinflamatorios">Antiinflamatorios</SelectItem>
                        <SelectItem value="Antihistamínicos">Antihistamínicos</SelectItem>
                        <SelectItem value="Antiácidos">Antiácidos</SelectItem>
                        <SelectItem value="Vitaminas">Vitaminas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                <div className="space-y-2">
                  <Label>Lotes (stocks)</Label>
                  <div className="grid grid-cols-3 gap-4 mb-2">
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
                            <TableHead>Unidades</TableHead>
                            <TableHead>Vencimiento</TableHead>
                            <TableHead>Precio Compra</TableHead>
                            <TableHead>Acción</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {nuevoProducto.stocks.map((lote, idx) => (
                            <TableRow key={idx}>
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

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código Barras</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Concentración</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Laboratorio</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Stock Total</TableHead>
                  <TableHead>Descuento</TableHead>
                  <TableHead>Lotes</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productosFiltrados.map((producto) => (
                  <TableRow key={`${producto.id}-${producto.codigo_barras}`}>
                    <TableCell className="font-medium">{producto.codigo_barras}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{producto.nombre}</div>
                      </div>
                    </TableCell>
                    <TableCell>{producto.concentracion || "--"}</TableCell>
                    <TableCell>{producto.categoria}</TableCell>
                    <TableCell>{producto.laboratorio}</TableCell>
                    <TableCell>S/ {Number(producto.precio_venta_und).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          producto.cantidad_general <= 10
                            ? "destructive"
                            : producto.cantidad_general <= 20
                              ? "secondary"
                              : "default"
                        }
                      >
                        {producto.cantidad_general} unidades
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {/* Mostrar porcentaje calculado */}
                      {producto.descuento > 0 && producto.descuento < producto.precio_venta_und ? (
                        <Badge variant="outline">
                          {calcularDescuentoPorcentaje(Number(producto.precio_venta_und), Number(producto.descuento))}%
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {(producto.stocks?.length ?? 0) > 0 ? (
                        <div className="space-y-1">
                          {producto.stocks?.map((lote, idx) => (
                            <div key={idx} className="text-xs">
                              <span className="font-medium">{lote.cantidadUnidades}u</span> | Vence: {lote.fechaVencimiento} | Compra: S/{Number(lote.precioCompra).toFixed(2)}
                            </div>
                          ))}
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
                        <Button variant="ghost" size="icon" onClick={() => eliminarProducto(producto.codigo_barras)}>
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

      {/* Dialog para editar producto */}
      <Dialog open={!!editandoProducto} onOpenChange={() => { setEditandoProducto(null); setLoteEnEdicion(null); setEditLoteIndex(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
            <DialogDescription>Modifica la información del producto</DialogDescription>
          </DialogHeader>
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
                  <Label htmlFor="edit-categoria">Categoría</Label>
                  <Select
                    value={editandoProducto.categoria}
                    onValueChange={(value) => setEditandoProducto({ ...editandoProducto, categoria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Analgésicos">Analgésicos</SelectItem>
                      <SelectItem value="Antibióticos">Antibióticos</SelectItem>
                      <SelectItem value="Antiinflamatorios">Antiinflamatorios</SelectItem>
                      <SelectItem value="Antihistamínicos">Antihistamínicos</SelectItem>
                      <SelectItem value="Antiácidos">Antiácidos</SelectItem>
                      <SelectItem value="Vitaminas">Vitaminas</SelectItem>
                    </SelectContent>
                  </Select>
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
              <div className="space-y-2">
                <Label>Lotes (stocks)</Label>
                <div className="grid grid-cols-3 gap-4 mb-2">
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
                    value={loteEnEdicion?.precioCompra ?? ""}
                    min={0}
                    onChange={e => setLoteEnEdicion(old => ({ ...old, precioCompra: Number(e.target.value) } as StockLote))}
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
                          <TableHead>Unidades</TableHead>
                          <TableHead>Vencimiento</TableHead>
                          <TableHead>Precio Compra</TableHead>
                          <TableHead>Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {editandoProducto.stocks.map((lote: StockLote, idx: number) => (
                          <TableRow key={idx}>
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