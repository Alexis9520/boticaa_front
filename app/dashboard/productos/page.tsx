"use client"

import React from "react" // CHANGE: para usar <React.Fragment key=...>
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ComboBoxCategoria } from "@/components/ComboBoxCategoria"
import { apiUrl } from "@/components/config"
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
import {
  Edit,
  Plus,
  Search,
  Trash2,
  Package,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  LayoutList,
  Layers,
  Box,
  Minimize2,
  Maximize2
} from "lucide-react"
import { fetchWithAuth } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import clsx from "clsx"

type StockLote = {
  codigoStock?: string
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
  principioActivo?: string
  tipoMedicamento?: string
  presentacion?: string
  fechaCreacion?: string
  stocks?: StockLote[]
}

function generarCodigoLote(producto: Producto, index: number) {
  return `${producto.codigoBarras}-${index + 1}`
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [lotesModalProducto, setLotesModalProducto] = useState<Producto | null>(null)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [densityCompact, setDensityCompact] = useState<boolean>(false)

  // Paginación (front)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

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
    principioActivo: "",
    tipoMedicamento: "GENÉRICO",
    presentacion: "",
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

  // --- Helpers ---
  const calcularDiasParaVencer = (fechaVencimiento: string) => {
    if (!fechaVencimiento) return 0
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
      const data = await fetchWithAuth(apiUrl("/productos"))
      setProductos(data)
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo cargar productos",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    cargarProductos()
  }, [])

  const productosFiltrados = useMemo(
    () =>
      productos.filter(
        (producto) =>
          producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          producto.codigoBarras.toLowerCase().includes(busqueda.toLowerCase()) ||
          (producto.categoria || "").toLowerCase().includes(busqueda.toLowerCase()) ||
          (producto.laboratorio || "").toLowerCase().includes(busqueda.toLowerCase())
      ),
    [productos, busqueda]
  )

  // Resetear página cuando cambie el filtro
  useEffect(() => {
    setPage(1)
  }, [busqueda, productosFiltrados.length])

  const totalPages = Math.max(1, Math.ceil(productosFiltrados.length / pageSize))
  const pageItems = useMemo(
    () => productosFiltrados.slice((page - 1) * pageSize, page * pageSize),
    [productosFiltrados, page, pageSize]
  )

  // --- CRUD ---
  const agregarProducto = async () => {
    const stocks = (nuevoProducto.stocks || []).map((lote, idx) => ({
      codigoStock:
        lote.codigoStock ||
        generarCodigoLote(
          {
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
            principioActivo: nuevoProducto.principioActivo,
            tipoMedicamento: nuevoProducto.tipoMedicamento,
            presentacion: nuevoProducto.presentacion,
            stocks: [],
          },
          idx
        ),
      cantidadUnidades: Number(lote.cantidadUnidades) || 0,
      fechaVencimiento: lote.fechaVencimiento,
      precioCompra: Number(lote.precioCompra) || 0,
    }))

    const precioConDescuento = Number(nuevoProducto.descuento) || 0
    try {
      const data = await fetchWithAuth(apiUrl("/productos/nuevo"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigoBarras: nuevoProducto.codigo_barras,
          nombre: nuevoProducto.nombre,
          concentracion: nuevoProducto.concentracion,
          cantidadGeneral: stocks.reduce((sum: number, lote: StockLote) => sum + Number(lote.cantidadUnidades), 0),
          cantidadMinima: Number(nuevoProducto.cantidad_minima) || 0,
          precioVentaUnd: Number(nuevoProducto.precio_venta_und),
          descuento: precioConDescuento,
          laboratorio: nuevoProducto.laboratorio,
          categoria: nuevoProducto.categoria,
          cantidadUnidadesBlister: Number(nuevoProducto.cantidad_unidades_blister) || 0,
          precioVentaBlister: Number(nuevoProducto.precio_venta_blister) || 0,
          principioActivo: nuevoProducto.principioActivo,
          tipoMedicamento: nuevoProducto.tipoMedicamento,
          presentacion: nuevoProducto.presentacion,
          stocks,
        }),
      })

      if (data) {
        toast({
          title: data.reactivado ? "Producto restaurado" : "Producto agregado",
          description: data.reactivado
            ? "El producto fue reactivado y actualizado."
            : "El producto se ha agregado correctamente",
        })
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
          principioActivo: "",
          tipoMedicamento: "GENÉRICO",
          presentacion: "",
          stocks: [],
        })
        setNuevoLote({
          codigoStock: "",
          cantidadUnidades: 0,
          fechaVencimiento: "",
          precioCompra: 0,
        })
        await cargarProductos()
      }
    } catch {
      toast({
        title: "Error",
        description: "No se pudo agregar el producto",
        variant: "destructive",
      })
    }
  }

  const agregarLoteANuevo = () => {
    if (!nuevoLote.cantidadUnidades || !nuevoLote.fechaVencimiento) {
      toast({
        title: "Error",
        description: "Completa todos los campos del lote",
        variant: "destructive",
      })
      return
    }
    setNuevoProducto({
      ...nuevoProducto,
      stocks: [
        ...(nuevoProducto.stocks || []),
        {
          ...nuevoLote,
          codigoStock: nuevoLote.codigoStock || `L${(nuevoProducto.stocks.length + 1).toString().padStart(2, "0")}`,
        },
      ],
    })
    setNuevoLote({
      codigoStock: "",
      cantidadUnidades: 0,
      fechaVencimiento: "",
      precioCompra: 0,
    })
  }

  const eliminarLoteDeNuevo = (index: number) => {
    setNuevoProducto({
      ...nuevoProducto,
      stocks: nuevoProducto.stocks.filter((_, i) => i !== index),
    })
  }

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
      principioActivo: producto.principioActivo || "",
      tipoMedicamento: producto.tipoMedicamento || "GENÉRICO",
      presentacion: producto.presentacion || "",
      stocks: (producto.stocks || []).map((lote, idx) => ({
        codigoStock: lote.codigoStock || generarCodigoLote(producto, idx),
        cantidadUnidades: lote.cantidadUnidades,
        fechaVencimiento: lote.fechaVencimiento,
        precioCompra: lote.precioCompra,
      })),
    })
  }

  const agregarLoteAEdicion = () => {
    if (!loteEnEdicion?.cantidadUnidades || !loteEnEdicion.fechaVencimiento) {
      toast({
        title: "Error",
        description: "Completa todos los campos obligatorios del lote",
        variant: "destructive",
      })
      return
    }
    setEditandoProducto((prev: any) => ({
      ...prev,
      stocks: [
        ...(prev.stocks || []),
        {
          ...loteEnEdicion,
          codigoStock:
            loteEnEdicion.codigoStock || `L${(prev.stocks.length + 1).toString().padStart(2, "0")}`,
        },
      ],
    }))
    setLoteEnEdicion({
      codigoStock: "",
      cantidadUnidades: 0,
      fechaVencimiento: "",
      precioCompra: 0,
    })
    setEditLoteIndex(null)
  }

  const editarLoteDeEdicion = (idx: number) => {
    setLoteEnEdicion({ ...(editandoProducto.stocks[idx]) })
    setEditLoteIndex(idx)
  }

  const guardarLoteEditado = () => {
    if (editLoteIndex === null || !loteEnEdicion) return
    setEditandoProducto((prev: any) => ({
      ...prev,
      stocks: prev.stocks.map((lote: StockLote, idx: number) =>
        idx === editLoteIndex ? { ...loteEnEdicion } : lote
      ),
    }))
    setLoteEnEdicion({
      codigoStock: "",
      cantidadUnidades: 0,
      fechaVencimiento: "",
      precioCompra: 0,
    })
    setEditLoteIndex(null)
  }

  const eliminarLoteDeEdicion = (index: number) => {
    setEditandoProducto((prev: any) => ({
      ...prev,
      stocks: prev.stocks.filter((_: any, i: number) => i !== index),
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

    const stocks = (editandoProducto.stocks || []).map(
      (lote: StockLote, idx: number) => ({
        codigoStock: lote.codigoStock || generarCodigoLote(editandoProducto as Producto, idx),
        cantidadUnidades: Number(lote.cantidadUnidades) || 0,
        fechaVencimiento: lote.fechaVencimiento,
        precioCompra: Number(lote.precioCompra) || 0,
      })
    )

    const precioConDescuento = Number(editandoProducto.descuento) || 0
    try {
      const res = await fetchWithAuth(
        apiUrl(`/productos/${editandoProducto.codigo_barras}`),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            codigoBarras: editandoProducto.codigo_barras,
            nombre: editandoProducto.nombre,
            concentracion: editandoProducto.concentracion,
            cantidadGeneral: stocks.reduce(
              (sum: number, lote: StockLote) => sum + Number(lote.cantidadUnidades),
              0
            ),
            cantidadMinima: Number(editandoProducto.cantidad_minima) || 0,
            precioVentaUnd: Number(editandoProducto.precio_venta_und),
            descuento: precioConDescuento,
            laboratorio: editandoProducto.laboratorio,
            categoria: editandoProducto.categoria,
            cantidadUnidadesBlister: Number(editandoProducto.cantidad_unidades_blister) || 0,
            precioVentaBlister: Number(editandoProducto.precio_venta_blister) || 0,
            principioActivo: editandoProducto.principioActivo,
            tipoMedicamento: editandoProducto.tipoMedicamento,
            presentacion: editandoProducto.presentacion,
            stocks,
          }),
        }
      )

      if (res) {
        toast({
          title: "Producto actualizado",
          description: "Los cambios se han guardado correctamente",
        })
        setProductos(prev =>
          prev.map(p => p.codigoBarras === editandoProducto.codigo_barras
            ? { ...res, id: p.id, fechaCreacion: p.fechaCreacion }
            : p
          )
        )
        setEditandoProducto(null)
        setLoteEnEdicion(null)
        setEditLoteIndex(null)
      } else {
        toast({
          title: "Error",
          description: "No se pudo actualizar el producto",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    }
  }

  const eliminarProducto = async (codigoBarras: string) => {
    try {
      await fetchWithAuth(apiUrl(`/productos/${codigoBarras}`), {
        method: "DELETE",
      })
      toast({
        title: "Producto eliminado",
        description: "El producto se ha eliminado correctamente",
      })
      await cargarProductos()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "No se pudo eliminar el producto",
        variant: "destructive",
      })
    }
  }

  // --- UI helpers ---
  function stockMinBadge(producto: Producto) {
    if (producto.cantidadMinima === undefined) return null
    const esCritico = producto.cantidadGeneral <= (producto.cantidadMinima ?? 0)
    return (
      <span className="block text-[10px] mt-0.5">
        Min: <span className="font-semibold">{producto.cantidadMinima}</span>
        {esCritico && (
          <Badge
            variant="destructive"
            className="ml-1 inline-flex items-center gap-1 px-1.5 py-0"
          >
            <AlertCircle className="w-3 h-3" /> Crítico
          </Badge>
        )}
      </span>
    )
  }

  function toggleExpand(codigo: string) {
    setExpandedRows(prev => ({ ...prev, [codigo]: !prev[codigo] }))
  }

  function stockBar(producto: Producto) {
    const min = producto.cantidadMinima ?? 0
    const current = producto.cantidadGeneral
    const pct = min === 0 ? 100 : Math.min(100, Math.round((current / (min * 2 || current || 1)) * 100))
    const color =
      current <= min
        ? "bg-destructive"
        : current <= min * 2
          ? "bg-yellow-500"
          : "bg-emerald-500"
    return (
      <div className="space-y-1">
        <div className="h-1.5 w-full rounded bg-muted overflow-hidden">
          <div
            className={clsx("h-full transition-all", color)}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="text-[11px] flex justify-between text-muted-foreground">
          <span>{current} u</span>
          {min > 0 && <span>Min {min}</span>}
        </div>
      </div>
    )
  }

  function resumenLotes(producto: Producto) {
    const lotes = producto.stocks || []
    if (!lotes.length) return <span className="text-xs text-muted-foreground">Sin lotes</span>
    const totalUnidades = lotes.reduce((s,l)=>s+l.cantidadUnidades,0)
    const masProximo = lotes
      .map(l => calcularDiasParaVencer(l.fechaVencimiento))
      .sort((a,b)=>a-b)[0]
    const critico = masProximo < 0
    const pronto = masProximo >= 0 && masProximo <= 30
    return (
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1 flex-wrap">
          <Badge variant="outline" className="px-1.5 py-0 h-5 text-[11px]">
            {lotes.length} lote{lotes.length !== 1 && "s"}
          </Badge>
          <Badge variant="secondary" className="px-1.5 py-0 h-5 text-[11px]">
            {totalUnidades} u
          </Badge>
        </div>
        <div className={clsx("text-[11px]",
          critico ? "text-red-500" : pronto ? "text-yellow-500" : "text-muted-foreground"
        )}>
          {critico
            ? "Vencido"
            : pronto
              ? `Vence en ${masProximo} d`
              : `> ${masProximo} d`}
        </div>
      </div>
    )
  }

  // --- RENDER ---
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            Gestión de Productos
          </h1>
          <p className="text-muted-foreground text-base">
            Administra el catálogo de productos de la farmacia
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={densityCompact ? "outline" : "secondary"}
            onClick={() => setDensityCompact(d => !d)}
            title={densityCompact ? "Vista normal" : "Vista compacta"}
          >
            {densityCompact ? <Maximize2 className="h-4 w-4 mr-1" /> : <Minimize2 className="h-4 w-4 mr-1" />}
            {densityCompact ? "Normal" : "Compacto"}
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Producto
              </Button>
            </DialogTrigger>
            {/* --- DIALOG NUEVO PRODUCTO --- */}
            <DialogContent className="max-w-7xl w-full">
              <DialogHeader>
                <DialogTitle>Nuevo Producto</DialogTitle>
                <DialogDescription>
                  Agrega un nuevo producto al catálogo
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col md:flex-row gap-12 py-4 overflow-y-auto max-h-[70vh] w-full">
                {/* Izquierda */}
                <div className="flex-1 min-w-0 md:pl-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="codigo_barras">Código de barras *</Label>
                      <Input
                        id="codigo_barras"
                        value={nuevoProducto.codigo_barras}
                        onChange={(e) => setNuevoProducto({ ...nuevoProducto, codigo_barras: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre *</Label>
                      <Input
                        id="nombre"
                        value={nuevoProducto.nombre}
                        onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="concentracion">Concentración</Label>
                      <Input
                        id="concentracion"
                        value={nuevoProducto.concentracion}
                        onChange={(e) => setNuevoProducto({ ...nuevoProducto, concentracion: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="categoria"></Label>
                      <ComboBoxCategoria
                        value={nuevoProducto.categoria}
                        onChange={(categoria) => setNuevoProducto({ ...nuevoProducto, categoria })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="principio_activo">Principio Activo</Label>
                      <Input
                        id="principio_activo"
                        value={nuevoProducto.principioActivo}
                        onChange={(e) => setNuevoProducto({ ...nuevoProducto, principioActivo: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tipo_medicamento">Tipo</Label>
                      <Select
                        value={nuevoProducto.tipoMedicamento}
                        onValueChange={(value) => setNuevoProducto({ ...nuevoProducto, tipoMedicamento: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GENÉRICO">Genérico</SelectItem>
                          <SelectItem value="MARCA">Marca</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="presentacion">Presentación</Label>
                      <Input
                        id="presentacion"
                        value={nuevoProducto.presentacion}
                        onChange={e => setNuevoProducto({ ...nuevoProducto, presentacion: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="laboratorio">Laboratorio</Label>
                      <Input
                        id="laboratorio"
                        value={nuevoProducto.laboratorio}
                        onChange={(e) => setNuevoProducto({ ...nuevoProducto, laboratorio: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cantidad_minima">Cantidad mínima (stock mínimo)</Label>
                      <Input
                        id="cantidad_minima"
                        type="number"
                        min="0"
                        value={nuevoProducto.cantidad_minima}
                        onChange={(e) => setNuevoProducto({ ...nuevoProducto, cantidad_minima: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                {/* Derecha */}
                <div className="flex-1 md:pl-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Stock inicial</Label>
                      <Input
                        disabled
                        value={nuevoProducto.stocks.reduce((sum, l) => sum + Number(l.cantidadUnidades), 0)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cantidad_unidades_blister">
                          <Layers className="inline h-4 w-4 mr-1 text-primary" /> Unidades / blister
                        </Label>
                        <Input
                          id="cantidad_unidades_blister"
                          type="number"
                          min="1"
                          value={nuevoProducto.cantidad_unidades_blister}
                          onChange={(e) => setNuevoProducto({ ...nuevoProducto, cantidad_unidades_blister: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="precio_venta_blister">
                          <Box className="inline h-4 w-4 mr-1 text-primary" /> Precio blister
                        </Label>
                        <Input
                          id="precio_venta_blister"
                          type="number"
                          step="0.01"
                          value={nuevoProducto.precio_venta_blister}
                          onChange={(e) => setNuevoProducto({ ...nuevoProducto, precio_venta_blister: e.target.value })}
                        />
                      </div>
                    </div>
                    {/* Lotes nuevo */}
                    <div className="space-y-2">
                      <Label>Lotes (stocks)</Label>
                      <div className="grid grid-cols-4 gap-4 mb-2">
                        <Input
                          placeholder="Código lote"
                          className="col-span-2"
                          value={nuevoLote.codigoStock || ""}
                          onChange={(e) => setNuevoLote({ ...nuevoLote, codigoStock: e.target.value })}
                        />
                        <Input
                          type="number"
                          placeholder="Unidades"
                          className="col-span-2"
                          value={nuevoLote.cantidadUnidades || ""}
                          min={1}
                          onChange={(e) => setNuevoLote({ ...nuevoLote, cantidadUnidades: Number(e.target.value) })}
                        />
                        <Input
                          type="date"
                          className="col-span-2"
                          value={nuevoLote.fechaVencimiento}
                          onChange={e => setNuevoLote({ ...nuevoLote, fechaVencimiento: e.target.value })}
                        />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Precio compra"
                          className="col-span-2"
                          value={nuevoLote.precioCompra || ""}
                          min={0}
                          onChange={(e) => setNuevoLote({ ...nuevoLote, precioCompra: Number(e.target.value) })}
                        />
                      </div>
                      <Button type="button" variant="destructive" onClick={agregarLoteANuevo}>
                        Agregar Lote
                      </Button>
                      <div className="mt-2">
                        {nuevoProducto.stocks.length === 0 && (
                          <div className="text-sm text-muted-foreground">Sin lotes agregados</div>
                        )}
                        {nuevoProducto.stocks.length > 0 && (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Código Lote</TableHead>
                                <TableHead>Unidades</TableHead>
                                <TableHead>Vencimiento</TableHead>
                                <TableHead>Precio Compra</TableHead>
                                <TableHead />
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {nuevoProducto.stocks.map((lote) => (
                                <TableRow key={lote.codigoStock || `${lote.fechaVencimiento}-${lote.cantidadUnidades}`}>
                                  <TableCell>{lote.codigoStock}</TableCell>
                                  <TableCell>{lote.cantidadUnidades}</TableCell>
                                  <TableCell>{lote.fechaVencimiento}</TableCell>
                                  <TableCell>S/ {Number(lote.precioCompra).toFixed(2)}</TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => eliminarLoteDeNuevo(
                                        nuevoProducto.stocks.findIndex(l => l === lote)
                                      )}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="precio_venta_und">Precio de venta *</Label>
                        <Input
                          id="precio_venta_und"
                          type="number"
                          step="0.01"
                          value={nuevoProducto.precio_venta_und}
                          onChange={(e) => setNuevoProducto({ ...nuevoProducto, precio_venta_und: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="descuento">Precio con descuento (opcional)</Label>
                        <Input
                          id="descuento"
                          type="number"
                          step="0.01"
                          value={nuevoProducto.descuento}
                          onChange={(e) => setNuevoProducto({ ...nuevoProducto, descuento: e.target.value })}
                        />
                      </div>
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

      {/* Tabla */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Catálogo de Productos</CardTitle>
          <CardDescription>Vista resumida. Expande filas para detalles y lotes.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Controles superiores */}
          <div className="flex flex-col md:flex-row gap-4 mb-4 md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por código, nombre, categoría, laboratorio..."
                className="pl-8"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(1) }}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5,10,25,50,100].map(s => (
                    <SelectItem key={s} value={String(s)}>{s} / página</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-sm text-muted-foreground whitespace-nowrap">
                Mostrando {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, productosFiltrados.length)} de {productosFiltrados.length}
              </div>
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table className={clsx(densityCompact && "[&_td]:py-1 [&_th]:py-2 text-sm")}>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Clasificación</TableHead>
                  <TableHead>Presentación</TableHead>
                  <TableHead className="min-w-[120px]">Stock</TableHead>
                  <TableHead>Blister</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Lotes</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map(producto => {
                  const expanded = !!expandedRows[producto.codigoBarras]
                  return (
                    <React.Fragment key={producto.codigoBarras}> {/* CHANGE: key ahora en el Fragment */}
                      <TableRow
                        className={clsx("transition cursor-pointer", expanded && "bg-muted/40")}
                        onDoubleClick={() => toggleExpand(producto.codigoBarras)}
                      >
                        <TableCell className="p-0 pl-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => toggleExpand(producto.codigoBarras)}
                          >
                            {expanded
                              ? <ChevronDown className="h-4 w-4" />
                              : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">{producto.codigoBarras}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium leading-tight">
                              {producto.nombre}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{producto.concentracion || "--"}</span>
                              <Badge
                                variant={producto.tipoMedicamento === "GENÉRICO" ? "outline" : "destructive"}
                                className="text-[10px] px-1.5 py-0"
                              >
                                {producto.tipoMedicamento === "GENÉRICO" ? "Genérico" : "Marca"}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs leading-tight">
                            <span className="font-medium">{producto.categoria || "--"}</span>
                            <div className="text-muted-foreground">{producto.laboratorio || "--"}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip delayDuration={300}>
                              <TooltipTrigger asChild>
                                <div className="text-xs max-w-[160px] truncate">
                                  {producto.presentacion || "--"}
                                  {producto.principioActivo && (
                                    <span className="text-muted-foreground ml-1">
                                      · {producto.principioActivo}
                                    </span>
                                  )}
                                </div>
                              </TooltipTrigger>
                              {producto.principioActivo && (
                                <TooltipContent className="max-w-xs">
                                  <p className="text-xs">
                                    Principio activo: <strong>{producto.principioActivo}</strong>
                                  </p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="align-top">
                          {stockBar(producto)}
                          {stockMinBadge(producto)}
                        </TableCell>
                        <TableCell>
                          {producto.cantidadUnidadesBlister ? (
                            <div className="flex flex-col gap-0.5 text-xs">
                              <Badge variant="outline" className="px-1.5 py-0 h-5">
                                {producto.cantidadUnidadesBlister} u
                              </Badge>
                              {producto.precioVentaBlister && (
                                <span className="text-muted-foreground">
                                  S/ {Number(producto.precioVentaBlister).toFixed(2)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">--</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            S/ {Number(producto.precioVentaUnd).toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>{resumenLotes(producto)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => editarProducto(producto)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => eliminarProducto(producto.codigoBarras)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expanded && (
                        <TableRow className="bg-muted/30">
                          <TableCell />
                          <TableCell colSpan={9} className="py-4">
                            <div className="grid md:grid-cols-5 gap-6 text-sm">
                              <div className="space-y-1">
                                <h4 className="font-semibold flex items-center gap-1">
                                  <LayoutList className="h-4 w-4" /> Detalles
                                </h4>
                                <p><span className="font-medium">Principio activo:</span> {producto.principioActivo || "--"}</p>
                                <p><span className="font-medium">Presentación:</span> {producto.presentacion || "--"}</p>
                                <p><span className="font-medium">Tipo:</span> {producto.tipoMedicamento || "--"}</p>
                                <p><span className="font-medium">Laboratorio:</span> {producto.laboratorio || "--"}</p>
                              </div>
                              <div className="space-y-2 md:col-span-2">
                                <h4 className="font-semibold flex items-center gap-1">
                                  <Package className="h-4 w-4" /> Lotes
                                </h4>
                                {(producto.stocks?.length ?? 0) === 0 && (
                                  <div className="text-xs text-muted-foreground">Sin lotes</div>
                                )}
                                {(producto.stocks?.length ?? 0) > 0 && (
                                  <div className="max-h-52 overflow-auto border rounded">
                                    <Table className="text-xs">
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead className="py-1">Lote</TableHead>
                                          <TableHead className="py-1">Unid</TableHead>
                                          <TableHead className="py-1">Venc.</TableHead>
                                          <TableHead className="py-1">Compra</TableHead>
                                          <TableHead className="py-1">Estado</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {producto.stocks?.map((l) => {
                                          const estado = obtenerEstadoLote(l.fechaVencimiento)
                                          const dias = calcularDiasParaVencer(l.fechaVencimiento)
                                          return (
                                            <TableRow key={l.codigoStock || `${l.fechaVencimiento}-${l.cantidadUnidades}`}>
                                              <TableCell className="py-1">{l.codigoStock}</TableCell>
                                              <TableCell className="py-1">{l.cantidadUnidades}</TableCell>
                                              <TableCell className="py-1">
                                                {new Date(l.fechaVencimiento).toLocaleDateString("es-PE")}
                                              </TableCell>
                                              <TableCell className="py-1">
                                                S/ {Number(l.precioCompra).toFixed(2)}
                                              </TableCell>
                                              <TableCell className="py-1">
                                                <Badge variant={estado.color as any} className="text-[10px]">
                                                  {estado.texto} {dias >= 0 && `(${dias}d)`}
                                                </Badge>
                                              </TableCell>
                                            </TableRow>
                                          )
                                        })}
                                      </TableBody>
                                    </Table>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-2 md:col-span-2">
                                <h4 className="font-semibold">Resumen Inventario</h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="p-2 rounded bg-background border">
                                    <span className="block text-muted-foreground">Unidades totales</span>
                                    <span className="text-lg font-semibold">
                                      {producto.cantidadGeneral}
                                    </span>
                                  </div>
                                  <div className="p-2 rounded bg-background border">
                                    <span className="block text-muted-foreground">Stock mínimo</span>
                                    <span className="text-lg font-semibold">
                                      {producto.cantidadMinima ?? 0}
                                    </span>
                                  </div>
                                  <div className="p-2 rounded bg-background border">
                                    <span className="block text-muted-foreground">Valor compra</span>
                                    <span className="text-lg font-semibold">
                                      S/ {(producto.stocks || []).reduce(
                                        (s, l) => s + l.cantidadUnidades * l.precioCompra,
                                        0
                                      ).toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="p-2 rounded bg-background border">
                                    <span className="block text-muted-foreground">Lotes</span>
                                    <span className="text-lg font-semibold">
                                      {producto.stocks?.length || 0}
                                    </span>
                                  </div>
                                </div>
                                <div className="pt-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs"
                                    onClick={() => setLotesModalProducto(producto)}
                                  >
                                    Ver en modal
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })}
                {pageItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                      No se encontraron productos
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginación inferior */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
            <div className="text-xs text-muted-foreground">
              Página {page} de {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <div className="flex items-center gap-1">
                <Input
                  className="w-16 h-8"
                  type="number"
                  min={1}
                  max={totalPages}
                  value={page}
                  onChange={e => {
                    const val = Number(e.target.value)
                    if (!Number.isNaN(val)) setPage(Math.min(Math.max(1, val), totalPages))
                  }}
                />
                <span className="text-xs text-muted-foreground">/ {totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Siguiente
              </Button>
            </div>
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
                    <TableHead>Código Lote</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Fecha Vencimiento</TableHead>
                    <TableHead>Precio Compra</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Días</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lotesModalProducto.stocks?.map((lote) => {
                    const diasParaVencer = calcularDiasParaVencer(lote.fechaVencimiento)
                    const estadoLote = obtenerEstadoLote(lote.fechaVencimiento)
                    return (
                      <TableRow key={lote.codigoStock || `${lote.fechaVencimiento}-${lote.cantidadUnidades}`}>
                        <TableCell>
                          <Badge variant="outline">{lote.codigoStock || "—"}</Badge>
                        </TableCell>
                        <TableCell>{lote.cantidadUnidades}</TableCell>
                        <TableCell>
                          {new Date(lote.fechaVencimiento).toLocaleDateString("es-PE")}
                        </TableCell>
                        <TableCell>S/ {Number(lote.precioCompra).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={estadoLote.color as any}>{estadoLote.texto}</Badge>
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              diasParaVencer < 0
                                ? "text-red-600"
                                : diasParaVencer <= 30
                                  ? "text-yellow-600"
                                  : "text-green-600"
                            }
                          >
                            {diasParaVencer < 0
                              ? `Vencido hace ${Math.abs(diasParaVencer)} días`
                              : `${diasParaVencer} días`}
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
                      {lotesModalProducto.stocks?.reduce(
                        (sum, lote) => sum + lote.cantidadUnidades,
                        0
                      )}
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
                      S/{" "}
                      {lotesModalProducto.stocks
                        ?.reduce(
                          (sum, lote) =>
                            sum + lote.cantidadUnidades * lote.precioCompra,
                          0
                        )
                        .toFixed(2)}
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="font-medium block">Próximo vencimiento</span>
                    <div className="text-lg font-bold text-orange-600">
                      {lotesModalProducto.stocks &&
                      lotesModalProducto.stocks.length > 0
                        ? Math.min(
                            ...lotesModalProducto.stocks.map((lote) =>
                              calcularDiasParaVencer(lote.fechaVencimiento)
                            )
                          )
                        : 0}{" "}
                      días
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog editar */}
      <Dialog
        open={!!editandoProducto}
        onOpenChange={() => {
          setEditandoProducto(null)
          setLoteEnEdicion(null)
          setEditLoteIndex(null)
        }}
      >
        <DialogContent className="max-w-7xl w-full">
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
            <DialogDescription>
              Modifica la información del producto
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col md:flex-row gap-12 py-4 overflow-y-auto max-h-[70vh] w-full">
            <div className="flex-1 min-w-0 md:border-r md:pr-8">
              {editandoProducto && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Código de barras *</Label>
                    <Input
                      value={editandoProducto.codigo_barras}
                      onChange={(e) =>
                        setEditandoProducto({ ...editandoProducto, codigo_barras: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nombre *</Label>
                    <Input
                      value={editandoProducto.nombre}
                      onChange={(e) =>
                        setEditandoProducto({ ...editandoProducto, nombre: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Concentración</Label>
                    <Input
                      value={editandoProducto.concentracion}
                      onChange={(e) =>
                        setEditandoProducto({ ...editandoProducto, concentracion: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label></Label>
                    <ComboBoxCategoria
                      value={editandoProducto.categoria}
                      onChange={(categoria) =>
                        setEditandoProducto({ ...editandoProducto, categoria })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Principio Activo</Label>
                    <Input
                      value={editandoProducto.principioActivo}
                      onChange={(e) =>
                        setEditandoProducto({ ...editandoProducto, principioActivo: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={editandoProducto.tipoMedicamento}
                      onValueChange={(value) =>
                        setEditandoProducto({ ...editandoProducto, tipoMedicamento: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GENÉRICO">Genérico</SelectItem>
                        <SelectItem value="MARCA">Marca</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Presentación</Label>
                    <Input
                      value={editandoProducto.presentacion}
                      onChange={e =>
                        setEditandoProducto({ ...editandoProducto, presentacion: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Laboratorio</Label>
                    <Input
                      value={editandoProducto.laboratorio}
                      onChange={(e) =>
                        setEditandoProducto({ ...editandoProducto, laboratorio: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stock mínimo</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editandoProducto.cantidad_minima}
                      onChange={(e) =>
                        setEditandoProducto({ ...editandoProducto, cantidad_minima: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
            {/* Derecha: lotes y precios */}
            <div className="flex-1 min-w-0 md:pl-8">
              {editandoProducto && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Stock</Label>
                    <Input
                      disabled
                      value={Array.isArray(editandoProducto.stocks)
                        ? editandoProducto.stocks.reduce(
                            (sum: number, lote: StockLote) => sum + Number(lote.cantidadUnidades),
                            0
                          )
                        : editandoProducto.cantidad_general}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        <Layers className="inline h-4 w-4 mr-1 text-primary" /> Unidades/blister
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        value={editandoProducto.cantidad_unidades_blister}
                        onChange={(e) =>
                          setEditandoProducto({ ...editandoProducto, cantidad_unidades_blister: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        <Box className="inline h-4 w-4 mr-1 text-primary" /> Precio blister
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editandoProducto.precio_venta_blister}
                        onChange={(e) =>
                          setEditandoProducto({ ...editandoProducto, precio_venta_blister: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Lotes (stocks)</Label>
                    <div className="grid grid-cols-4 gap-4 mb-2">
                      <Input
                        placeholder="Código lote"
                        className="col-span-2"
                        value={loteEnEdicion?.codigoStock ?? ""}
                        onChange={(e) =>
                          setLoteEnEdicion(old => ({ ...old, codigoStock: e.target.value } as StockLote))
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Unidades"
                        className="col-span-2"
                        value={loteEnEdicion?.cantidadUnidades ?? ""}
                        min={1}
                        onChange={(e) =>
                          setLoteEnEdicion(old => ({ ...old, cantidadUnidades: Number(e.target.value) } as StockLote))
                        }
                      />
                      <Input
                        type="date"
                        className="col-span-2"
                        value={loteEnEdicion?.fechaVencimiento ?? ""}
                        onChange={(e) =>
                          setLoteEnEdicion(old => ({ ...old, fechaVencimiento: e.target.value } as StockLote))
                        }
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Precio compra"
                        className="col-span-2"
                        value={
                          loteEnEdicion?.precioCompra !== undefined
                            ? String(loteEnEdicion.precioCompra)
                            : ""
                        }
                        min={0}
                        onChange={(e) =>
                          setLoteEnEdicion(old => ({ ...old, precioCompra: Number(e.target.value) } as StockLote))
                        }
                      />
                    </div>
                    <div className="flex gap-2 mb-2">
                      {editLoteIndex === null ? (
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={agregarLoteAEdicion}
                        >
                          Agregar Lote
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={guardarLoteEditado}
                        >
                          Guardar Edición de Lote
                        </Button>
                      )}
                      {editLoteIndex !== null && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setEditLoteIndex(null)
                            setLoteEnEdicion(null)
                          }}
                        >
                          Cancelar edición
                        </Button>
                      )}
                    </div>
                    <div className="mt-2">
                      {(!editandoProducto.stocks || editandoProducto.stocks.length === 0) && (
                        <div className="text-sm text-muted-foreground">Sin lotes</div>
                      )}
                      {editandoProducto.stocks && editandoProducto.stocks.length > 0 && (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Lote</TableHead>
                              <TableHead>Unidades</TableHead>
                              <TableHead>Vencimiento</TableHead>
                              <TableHead>Precio Compra</TableHead>
                              <TableHead />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {editandoProducto.stocks.map((lote: StockLote, idx: number) => (
                              <TableRow key={lote.codigoStock || `${lote.fechaVencimiento}-${idx}`}>
                                <TableCell>{lote.codigoStock}</TableCell>
                                <TableCell>{lote.cantidadUnidades}</TableCell>
                                <TableCell>{lote.fechaVencimiento}</TableCell>
                                <TableCell>S/ {Number(lote.precioCompra).toFixed(2)}</TableCell>
                                <TableCell className="flex gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => editarLoteDeEdicion(idx)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => eliminarLoteDeEdicion(idx)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Precio de venta *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editandoProducto.precio_venta_und}
                        onChange={(e) =>
                          setEditandoProducto({ ...editandoProducto, precio_venta_und: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Precio con descuento</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editandoProducto.descuento}
                        onChange={(e) =>
                          setEditandoProducto({ ...editandoProducto, descuento: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditandoProducto(null)
                setLoteEnEdicion(null)
                setEditLoteIndex(null)
              }}
            >
              Cancelar
            </Button>
            <Button onClick={guardarEdicion}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}