"use client"

import React, { useEffect, useMemo, useState, useCallback } from "react"
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
  Maximize2,
  Sparkles,
  Filter
} from "lucide-react"
import clsx from "clsx"

import { apiUrl } from "@/components/config"
import { fetchWithAuth } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ComboBoxCategoria } from "@/components/ComboBoxCategoria"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"

/* -------------------- TIPOS -------------------- */
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

/* -------------------- HELPERS -------------------- */
function generarCodigoLote(producto: Producto, index: number) {
  return `${producto.codigoBarras}-${index + 1}`
}

const today = () => new Date()

function calcularDiasParaVencer(fecha: string) {
  if (!fecha) return 0
  const f = new Date(fecha)
  const h = today()
  h.setHours(0,0,0,0)
  f.setHours(0,0,0,0)
  return Math.ceil((f.getTime() - h.getTime()) / 86400000)
}

function obtenerEstadoLote(fechaVencimiento: string) {
  const dias = calcularDiasParaVencer(fechaVencimiento)
  if (dias < 0) return { estado: "vencido", color: "destructive", texto: "Vencido", dias }
  if (dias <= 30) return { estado: "vence-pronto", color: "secondary", texto: "Pronto", dias }
  return { estado: "vigente", color: "outline", texto: "Vigente", dias }
}

/* -------------------- COMPONENTE PRINCIPAL -------------------- */
export default function ProductosPage() {
  const { toast } = useToast()

  const [productos, setProductos] = useState<Producto[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [densityCompact, setDensityCompact] = useState(false)

  // Paginación
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Nuevo producto
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
    stocks: [] as StockLote[]
  })
  const [nuevoLote, setNuevoLote] = useState<StockLote>({
    codigoStock: "",
    cantidadUnidades: 0,
    fechaVencimiento: "",
    precioCompra: 0
  })

  // Editar producto
  const [editandoProducto, setEditandoProducto] = useState<any>(null)
  const [editLoteIndex, setEditLoteIndex] = useState<number | null>(null)
  const [loteEnEdicion, setLoteEnEdicion] = useState<StockLote | null>(null)

  // Modal lotes
  const [lotesModalProducto, setLotesModalProducto] = useState<Producto | null>(null)

  /* ------------ CARGA ------------- */
  const cargarProductos = useCallback(async () => {
    try {
      const data = await fetchWithAuth(apiUrl("/productos"))
      setProductos(data || [])
    } catch {
      toast({
        title: "Error",
        description: "No se pudo cargar productos",
        variant: "destructive"
      })
    }
  }, [toast])

  useEffect(() => { cargarProductos() }, [cargarProductos])

  /* ------------ FILTRO ------------- */
  const productosFiltrados = useMemo(
    () => productos.filter(p =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigoBarras.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.categoria || "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.laboratorio || "").toLowerCase().includes(busqueda.toLowerCase())
    ),
    [productos, busqueda]
  )

  useEffect(() => { setPage(1) }, [busqueda, productosFiltrados.length])

  const totalPages = Math.max(1, Math.ceil(productosFiltrados.length / pageSize))
  const pageItems = useMemo(
    () => productosFiltrados.slice((page - 1) * pageSize, page * pageSize),
    [productosFiltrados, page, pageSize]
  )

  /* ------------ CRUD NUEVO ------------- */
  function agregarLoteANuevo() {
    if (!nuevoLote.cantidadUnidades || !nuevoLote.fechaVencimiento) {
      toast({ title: "Completa lote", description: "Unidades y fecha son obligatorios", variant: "destructive" })
      return
    }
    setNuevoProducto(p => ({
      ...p,
      stocks: [
        ...p.stocks,
        {
          ...nuevoLote,
          codigoStock: nuevoLote.codigoStock || `L${(p.stocks.length + 1).toString().padStart(2, "0")}`
        }
      ]
    }))
    setNuevoLote({ codigoStock: "", cantidadUnidades: 0, fechaVencimiento: "", precioCompra: 0 })
  }

  function eliminarLoteDeNuevo(idx: number) {
    setNuevoProducto(p => ({ ...p, stocks: p.stocks.filter((_, i) => i !== idx) }))
  }

  async function agregarProducto() {
    if (!nuevoProducto.codigo_barras || !nuevoProducto.nombre || !nuevoProducto.precio_venta_und) {
      toast({ title: "Campos obligatorios", description: "Código, nombre y precio", variant: "destructive" })
      return
    }
    const stocks = nuevoProducto.stocks.map((l, idx) => ({
      codigoStock: l.codigoStock || generarCodigoLote({
        id: 0,
        codigoBarras: nuevoProducto.codigo_barras,
        nombre: nuevoProducto.nombre,
        concentracion: nuevoProducto.concentracion,
        cantidadGeneral: 0,
        precioVentaUnd: Number(nuevoProducto.precio_venta_und) || 0,
        descuento: Number(nuevoProducto.descuento) || 0,
        laboratorio: nuevoProducto.laboratorio,
        categoria: nuevoProducto.categoria
      } as Producto, idx),
      cantidadUnidades: Number(l.cantidadUnidades) || 0,
      fechaVencimiento: l.fechaVencimiento,
      precioCompra: Number(l.precioCompra) || 0
    }))
    const body = {
      codigoBarras: nuevoProducto.codigo_barras,
      nombre: nuevoProducto.nombre,
      concentracion: nuevoProducto.concentracion,
      cantidadGeneral: stocks.reduce((s, l) => s + l.cantidadUnidades, 0),
      cantidadMinima: Number(nuevoProducto.cantidad_minima) || 0,
      precioVentaUnd: Number(nuevoProducto.precio_venta_und),
      descuento: Number(nuevoProducto.descuento) || 0,
      laboratorio: nuevoProducto.laboratorio,
      categoria: nuevoProducto.categoria,
      cantidadUnidadesBlister: Number(nuevoProducto.cantidad_unidades_blister) || 0,
      precioVentaBlister: Number(nuevoProducto.precio_venta_blister) || 0,
      principioActivo: nuevoProducto.principioActivo,
      tipoMedicamento: nuevoProducto.tipoMedicamento,
      presentacion: nuevoProducto.presentacion,
      stocks
    }
    try {
      const data = await fetchWithAuth(apiUrl("/productos/nuevo"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
      toast({
        title: data?.reactivado ? "Producto restaurado" : "Producto agregado",
        description: data?.reactivado ? "Se reactivó y actualizó" : "Creado correctamente"
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
        stocks: []
      })
      setNuevoLote({ codigoStock: "", cantidadUnidades: 0, fechaVencimiento: "", precioCompra: 0 })
      cargarProductos()
    } catch {
      toast({ title: "Error", description: "No se pudo agregar", variant: "destructive" })
    }
  }

  /* ------------ CRUD EDITAR ------------- */
  function editarProducto(p: Producto) {
    setEditandoProducto({
      codigo_barras: p.codigoBarras,
      nombre: p.nombre,
      concentracion: p.concentracion,
      cantidad_general: p.cantidadGeneral.toString(),
      cantidad_minima: p.cantidadMinima?.toString() || "",
      precio_venta_und: p.precioVentaUnd.toString(),
      descuento: p.descuento?.toString() || "",
      laboratorio: p.laboratorio,
      categoria: p.categoria,
      cantidad_unidades_blister: p.cantidadUnidadesBlister?.toString() || "",
      precio_venta_blister: p.precioVentaBlister?.toString() || "",
      principioActivo: p.principioActivo || "",
      tipoMedicamento: p.tipoMedicamento || "GENÉRICO",
      presentacion: p.presentacion || "",
      stocks: (p.stocks || []).map((l, idx) => ({
        codigoStock: l.codigoStock || generarCodigoLote(p, idx),
        cantidadUnidades: l.cantidadUnidades,
        fechaVencimiento: l.fechaVencimiento,
        precioCompra: l.precioCompra
      }))
    })
  }

  function agregarLoteAEdicion() {
    if (!loteEnEdicion?.cantidadUnidades || !loteEnEdicion.fechaVencimiento) {
      toast({ title: "Campos obligatorios", description: "Unidades y fecha", variant: "destructive" })
      return
    }
    setEditandoProducto((prev: any) => ({
      ...prev,
      stocks: [
        ...(prev.stocks || []),
        {
          ...loteEnEdicion,
          codigoStock:
            loteEnEdicion.codigoStock ||
            `L${(prev.stocks.length + 1).toString().padStart(2, "0")}`
        }
      ]
    }))
    setLoteEnEdicion({ codigoStock: "", cantidadUnidades: 0, fechaVencimiento: "", precioCompra: 0 })
    setEditLoteIndex(null)
  }

  function editarLoteDeEdicion(idx: number) {
    setLoteEnEdicion({ ...(editandoProducto.stocks[idx]) })
    setEditLoteIndex(idx)
  }

  function guardarLoteEditado() {
    if (editLoteIndex === null || !loteEnEdicion) return
    setEditandoProducto((prev: any) => ({
      ...prev,
      stocks: prev.stocks.map((l: StockLote, i: number) => (i === editLoteIndex ? { ...loteEnEdicion } : l))
    }))
    setLoteEnEdicion({ codigoStock: "", cantidadUnidades: 0, fechaVencimiento: "", precioCompra: 0 })
    setEditLoteIndex(null)
  }

  function eliminarLoteDeEdicion(idx: number) {
    setEditandoProducto((prev: any) => ({
      ...prev,
      stocks: prev.stocks.filter((_: any, i: number) => i !== idx)
    }))
  }

  async function guardarEdicion() {
    if (!editandoProducto.codigo_barras || !editandoProducto.nombre || !editandoProducto.precio_venta_und) {
      toast({ title: "Campos obligatorios", description: "Código, nombre y precio", variant: "destructive" })
      return
    }
    const stocks = (editandoProducto.stocks || []).map((l: StockLote, idx: number) => ({
      codigoStock: l.codigoStock || generarCodigoLote(editandoProducto as Producto, idx),
      cantidadUnidades: Number(l.cantidadUnidades) || 0,
      fechaVencimiento: l.fechaVencimiento,
      precioCompra: Number(l.precioCompra) || 0
    }))
    try {
      const res = await fetchWithAuth(apiUrl(`/productos/${editandoProducto.codigo_barras}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigoBarras: editandoProducto.codigo_barras,
          nombre: editandoProducto.nombre,
          concentracion: editandoProducto.concentracion,
          cantidadGeneral: stocks.reduce((s: number, l: StockLote) => s + l.cantidadUnidades, 0),
          cantidadMinima: Number(editandoProducto.cantidad_minima) || 0,
          precioVentaUnd: Number(editandoProducto.precio_venta_und),
          descuento: Number(editandoProducto.descuento) || 0,
          laboratorio: editandoProducto.laboratorio,
          categoria: editandoProducto.categoria,
          cantidadUnidadesBlister: Number(editandoProducto.cantidad_unidades_blister) || 0,
          precioVentaBlister: Number(editandoProducto.precio_venta_blister) || 0,
          principioActivo: editandoProducto.principioActivo,
          tipoMedicamento: editandoProducto.tipoMedicamento,
          presentacion: editandoProducto.presentacion,
          stocks
        })
      })
      if (res) {
        toast({ title: "Producto actualizado", description: "Cambios guardados" })
        setProductos(prev =>
          prev.map(p =>
            p.codigoBarras === editandoProducto.codigo_barras
              ? { ...res, id: p.id, fechaCreacion: p.fechaCreacion }
              : p
          )
        )
        cerrarEdicion()
      } else {
        toast({ title: "Error", description: "No se guardó", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Error de conexión", variant: "destructive" })
    }
  }

  async function eliminarProducto(codigoBarras: string) {
    try {
      await fetchWithAuth(apiUrl(`/productos/${codigoBarras}`), { method: "DELETE" })
      toast({ title: "Producto eliminado" })
      cargarProductos()
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "No se pudo eliminar", variant: "destructive" })
    }
  }

  function cerrarEdicion() {
    setEditandoProducto(null)
    setLoteEnEdicion(null)
    setEditLoteIndex(null)
  }

  /* ------------ UI HELPERS ------------- */
  function toggleExpand(codigo: string) {
    setExpandedRows(prev => ({ ...prev, [codigo]: !prev[codigo] }))
  }

  function stockMinBadge(producto: Producto) {
    if (producto.cantidadMinima === undefined) return null
    const esCritico = producto.cantidadGeneral <= (producto.cantidadMinima ?? 0)
    return (
      <div className="flex items-center gap-1 flex-wrap text-[10px] mt-1">
        <span className="text-muted-foreground">Min:</span>
        <span className="font-medium">{producto.cantidadMinima}</span>
        {esCritico && (
          <Badge variant="destructive" className="h-4 px-1.5 text-[9px] rounded-full flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Crítico
          </Badge>
        )}
      </div>
    )
  }

  function stockBar(p: Producto) {
    const min = p.cantidadMinima ?? 0
    const current = p.cantidadGeneral
    const pct = min === 0 ? 100 : Math.min(100, Math.round((current / (min * 2 || 1)) * 100))
    const color =
      current <= min
        ? "bg-red-500"
        : current <= min * 2
          ? "bg-amber-500"
          : "bg-emerald-500"

    return (
      <div className="space-y-1 w-32">
        <div className="h-1.5 rounded bg-gradient-to-r from-zinc-200/50 to-zinc-300/40 dark:from-zinc-700 dark:to-zinc-600 overflow-hidden">
          <div
            className={clsx("h-full transition-all duration-500 ease-out", color)}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="text-[10px] flex justify-between text-muted-foreground">
          <span>{current} u</span>
          {min > 0 && <span>Min {min}</span>}
        </div>
      </div>
    )
  }

  function resumenLotes(producto: Producto) {
    const lotes = producto.stocks || []
    if (!lotes.length) return <span className="text-[11px] text-muted-foreground">Sin lotes</span>
    const total = lotes.reduce((s, l) => s + l.cantidadUnidades, 0)
    const proximos = lotes.map(l => calcularDiasParaVencer(l.fechaVencimiento)).sort((a,b)=>a-b)
    const d = proximos[0]
    const estado =
      d < 0 ? { label: "Vencido", cls: "text-red-600" }
        : d <= 30 ? { label: `${d} d`, cls: "text-amber-500" }
          : { label: `> ${d} d`, cls: "text-muted-foreground" }

    return (
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1 flex-wrap">
          <Badge variant="outline" className="px-1.5 h-5 text-[10px] rounded-full">{lotes.length} lote{lotes.length!==1 && "s"}</Badge>
          <Badge variant="secondary" className="px-1.5 h-5 text-[10px] rounded-full">{total} u</Badge>
        </div>
        <span className={clsx("text-[10px] font-medium", estado.cls)}>{estado.label}</span>
      </div>
    )
  }

  /* ------------ RENDER ------------- */
  return (
    <div className="flex flex-col gap-6 relative">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,hsl(var(--primary)/0.08),transparent_55%),radial-gradient(circle_at_85%_70%,hsl(var(--secondary)/0.10),transparent_60%)]" />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60 flex items-center gap-2">
            Gestión de Productos
            <Sparkles className="h-5 w-5 text-primary/70" />
          </h1>
          <p className="text-sm text-muted-foreground">
            Administra el catálogo y lotes de inventario
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DensityToggle compact={densityCompact} onChange={()=> setDensityCompact(d=>!d)} />
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Nuevo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl w-full">
              <DialogHeader>
                <DialogTitle>Nuevo Producto</DialogTitle>
                <DialogDescription>Registra un producto y sus lotes iniciales</DialogDescription>
              </DialogHeader>

              <div className="grid md:grid-cols-2 gap-10 max-h-[70vh] overflow-y-auto pr-2">
                {/* Columna 1 */}
                <section className="space-y-6">
                  <SectionTitle title="Datos Generales" />
                  <Field label="Código de barras *" placeholder="Ej: 7750112345678" value={nuevoProducto.codigo_barras} onChange={v=>setNuevoProducto(p=>({...p, codigo_barras:v}))} />
                  <Field label="Nombre *" placeholder="Ej: Amoxicilina 500" value={nuevoProducto.nombre} onChange={v=>setNuevoProducto(p=>({...p, nombre:v}))} />
                  <Field label="Concentración" placeholder="Ej: 500mg / 5ml" value={nuevoProducto.concentracion} onChange={v=>setNuevoProducto(p=>({...p, concentracion:v}))} />
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Categoría</Label>
                    <ComboBoxCategoria
                      value={nuevoProducto.categoria}
                      onChange={categoria => setNuevoProducto(p=>({...p, categoria}))}
                    />
                  </div>
                  <Field label="Principio activo" placeholder="Ej: Amoxicilina" value={nuevoProducto.principioActivo} onChange={v=>setNuevoProducto(p=>({...p, principioActivo:v}))} />
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Tipo</Label>
                    <Select
                      value={nuevoProducto.tipoMedicamento}
                      onValueChange={value => setNuevoProducto(p=>({...p, tipoMedicamento:value}))}
                    >
                      <SelectTrigger><SelectValue placeholder="Elige tipo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GENÉRICO">Genérico</SelectItem>
                        <SelectItem value="MARCA">Marca</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Field label="Presentación" placeholder="Ej: Caja x 10 cápsulas" value={nuevoProducto.presentacion} onChange={v=>setNuevoProducto(p=>({...p, presentacion:v}))} />
                  <Field label="Laboratorio" placeholder="Ej: ACME Labs" value={nuevoProducto.laboratorio} onChange={v=>setNuevoProducto(p=>({...p, laboratorio:v}))} />
                  <Field label="Stock mínimo" placeholder="Ej: 20" type="number" value={nuevoProducto.cantidad_minima} onChange={v=>setNuevoProducto(p=>({...p, cantidad_minima:v}))} />
                </section>

                {/* Columna 2 */}
                <section className="space-y-6">
                  <SectionTitle title="Unidad / Precios" />
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Unidades/blister" placeholder="Ej: 10" type="number" value={nuevoProducto.cantidad_unidades_blister} onChange={v=>setNuevoProducto(p=>({...p, cantidad_unidades_blister:v}))} />
                    <Field label="Precio blister" placeholder="Ej: 12.50" type="number" step="0.01" value={nuevoProducto.precio_venta_blister} onChange={v=>setNuevoProducto(p=>({...p, precio_venta_blister:v}))} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Precio venta *" placeholder="Precio unitario (S/)" type="number" step="0.01" value={nuevoProducto.precio_venta_und} onChange={v=>setNuevoProducto(p=>({...p, precio_venta_und:v}))} />
                    <Field label="Precio descuento" placeholder="Opcional (S/)" type="number" step="0.01" value={nuevoProducto.descuento} onChange={v=>setNuevoProducto(p=>({...p, descuento:v}))} />
                  </div>

                  <div className="space-y-3 pt-2">
                    <SectionTitle title="Lotes iniciales" small />
                    <div className="grid grid-cols-4 gap-3">
                      <Input placeholder="Código lote (opcional)" className="col-span-2" value={nuevoLote.codigoStock || ""} onChange={e=>setNuevoLote(l=>({...l, codigoStock:e.target.value}))} />
                      <Input placeholder="Unidades" type="number" min={1} className="col-span-2" value={nuevoLote.cantidadUnidades || ""} onChange={e=>setNuevoLote(l=>({...l, cantidadUnidades:Number(e.target.value)}))} />
                      <Input type="date" className="col-span-2" value={nuevoLote.fechaVencimiento} onChange={e=>setNuevoLote(l=>({...l, fechaVencimiento:e.target.value}))} />
                      <Input placeholder="Precio compra (S/)" type="number" step="0.01" min={0} className="col-span-2" value={nuevoLote.precioCompra || ""} onChange={e=>setNuevoLote(l=>({...l, precioCompra:Number(e.target.value)}))} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="secondary" size="sm" onClick={agregarLoteANuevo}>Agregar lote</Button>
                      <span className="text-xs text-muted-foreground">
                        Stock total: {nuevoProducto.stocks.reduce((s,l)=>s+l.cantidadUnidades,0)} u
                      </span>
                    </div>
                    <div className="rounded border bg-muted/40 backdrop-blur-sm max-h-48 overflow-auto">
                      {nuevoProducto.stocks.length === 0 && (
                        <div className="text-xs p-4 text-muted-foreground">Sin lotes agregados</div>
                      )}
                      {nuevoProducto.stocks.length > 0 && (
                        <Table className="text-xs">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="py-1">Lote</TableHead>
                              <TableHead className="py-1">Unid</TableHead>
                              <TableHead className="py-1">Vence</TableHead>
                              <TableHead className="py-1">Compra (S/)</TableHead>
                              <TableHead className="py-1 text-right">Quitar</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {nuevoProducto.stocks.map((l, idx)=>(
                              <TableRow key={l.codigoStock || `${l.fechaVencimiento}-${idx}`}>
                                <TableCell className="py-1">{l.codigoStock}</TableCell>
                                <TableCell className="py-1">{l.cantidadUnidades}</TableCell>
                                <TableCell className="py-1">{l.fechaVencimiento}</TableCell>
                                <TableCell className="py-1">S/ {Number(l.precioCompra).toFixed(2)}</TableCell>
                                <TableCell className="py-1 text-right">
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={()=>eliminarLoteDeNuevo(idx)}>
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
                </section>
              </div>

              <DialogFooter className="pt-4">
                <Button onClick={agregarProducto}>Guardar Producto</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* TABLA */}
      <Card className="border-border/60 shadow-sm relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/40 to-transparent" />
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Catálogo de Productos</CardTitle>
          <CardDescription>Vista consolidada. Expande para ver detalles y lotes.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-5 md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar código, nombre, categoría, laboratorio..."
                className="pl-8"
                value={busqueda}
                onChange={e=>setBusqueda(e.target.value)}
              />
              <div className="absolute right-2 top-2 text-[10px] text-muted-foreground">
                {productosFiltrados.length}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filas / página</span>
              </div>
              <Select value={String(pageSize)} onValueChange={v=>{ setPageSize(Number(v)); setPage(1) }}>
                <SelectTrigger className="w-[120px]"><SelectValue placeholder="Tamaño" /></SelectTrigger>
                <SelectContent>
                  {[5,10,25,50,100].map(s=>(
                    <SelectItem key={s} value={String(s)}>{s} / pág</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, productosFiltrados.length)} de {productosFiltrados.length}
              </span>
            </div>
          </div>

          <div className="rounded-xl border bg-card/70 backdrop-blur-sm overflow-x-auto">
            <Table className={clsx(densityCompact && "[&_td]:py-1 [&_th]:py-2 text-sm")}>
              <TableHeader className="bg-muted/40 backdrop-blur-sm">
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Código</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Clasificación</TableHead>
                  <TableHead>Presentación</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Blister</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Lotes</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map(p => {
                  const expanded = !!expandedRows[p.codigoBarras]
                  return (
                    <React.Fragment key={p.codigoBarras}>
                      <TableRow
                        className={clsx(
                          "group cursor-pointer transition-colors",
                          expanded && "bg-muted/30",
                          "hover:bg-muted/25"
                        )}
                        onDoubleClick={()=>toggleExpand(p.codigoBarras)}
                      >
                        <TableCell className="p-0 pl-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={()=>toggleExpand(p.codigoBarras)}
                            aria-label={expanded ? "Contraer" : "Expandir"}
                          >
                            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium tabular-nums">{p.codigoBarras}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium leading-tight">{p.nombre}</span>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span>{p.concentracion || "—"}</span>
                              <Badge
                                variant={p.tipoMedicamento === "GENÉRICO" ? "outline" : "secondary"}
                                className="px-1.5 h-4 text-[10px] rounded-full"
                              >
                                {p.tipoMedicamento === "GENÉRICO" ? "Genérico" : "Marca"}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-[11px]">
                            <span className="font-medium">{p.categoria || "—"}</span>
                            <div className="text-muted-foreground">{p.laboratorio || "—"}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-[11px] max-w-[160px] truncate">
                                  {p.presentacion || "—"}
                                  {p.principioActivo && <span className="text-muted-foreground ml-1">· {p.principioActivo}</span>}
                                </div>
                              </TooltipTrigger>
                              {p.principioActivo && (
                                <TooltipContent>
                                  <p className="text-xs">Principio activo: <strong>{p.principioActivo}</strong></p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="align-top">
                          {stockBar(p)}
                          {stockMinBadge(p)}
                        </TableCell>
                        <TableCell>
                          {p.cantidadUnidadesBlister ? (
                            <div className="flex flex-col gap-0.5 text-[11px]">
                              <Badge variant="outline" className="px-1.5 h-5 rounded-full">{p.cantidadUnidadesBlister} u</Badge>
                              {p.precioVentaBlister && (
                                <span className="text-muted-foreground tabular-nums">
                                  S/ {Number(p.precioVentaBlister).toFixed(2)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-semibold tabular-nums">
                            S/ {Number(p.precioVentaUnd).toFixed(2)}
                          </div>
                          {p.descuento > 0 && (
                            <div className="text-[11px] text-emerald-600 font-medium">
                              Desc: S/ {p.descuento.toFixed(2)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{resumenLotes(p)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=>editarProducto(p)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=>eliminarProducto(p.codigoBarras)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {expanded && (
                        <TableRow className="bg-muted/20">
                          <TableCell />
                          <TableCell colSpan={9} className="py-5">
                            <div className="grid lg:grid-cols-5 gap-6 text-sm">
                              {/* Detalles */}
                              <div className="space-y-3 lg:col-span-1">
                                <h4 className="font-semibold flex items-center gap-1 text-[13px]">
                                  <LayoutList className="h-4 w-4" /> Detalles
                                </h4>
                                <Detail label="Principio activo" value={p.principioActivo || "—"} />
                                <Detail label="Presentación" value={p.presentacion || "—"} />
                                <Detail label="Tipo" value={p.tipoMedicamento || "—"} />
                                <Detail label="Laboratorio" value={p.laboratorio || "—"} />
                              </div>

                              {/* Lotes */}
                              <div className="space-y-3 lg:col-span-2">
                                <h4 className="font-semibold flex items-center gap-1 text-[13px]">
                                  <Package className="h-4 w-4" /> Lotes
                                </h4>
                                {(p.stocks?.length ?? 0) === 0 && (
                                  <div className="text-xs text-muted-foreground">Sin lotes</div>
                                )}
                                {(p.stocks?.length ?? 0) > 0 && (
                                  <div className="max-h-52 overflow-auto rounded-lg border bg-background/60 backdrop-blur-sm">
                                    <Table className="text-[11px]">
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead className="py-1">Lote</TableHead>
                                          <TableHead className="py-1">Unid</TableHead>
                                          <TableHead className="py-1">Venc</TableHead>
                                          <TableHead className="py-1">Compra</TableHead>
                                          <TableHead className="py-1">Estado</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {p.stocks?.map(l => {
                                          const est = obtenerEstadoLote(l.fechaVencimiento)
                                          return (
                                            <TableRow key={l.codigoStock || `${l.fechaVencimiento}-${l.cantidadUnidades}`}>
                                              <TableCell className="py-1">{l.codigoStock}</TableCell>
                                              <TableCell className="py-1 tabular-nums">{l.cantidadUnidades}</TableCell>
                                              <TableCell className="py-1">
                                                {new Date(l.fechaVencimiento).toLocaleDateString("es-PE")}
                                              </TableCell>
                                              <TableCell className="py-1 tabular-nums">
                                                S/ {Number(l.precioCompra).toFixed(2)}
                                              </TableCell>
                                              <TableCell className="py-1">
                                                <Badge variant={est.color as any} className="h-5 px-1.5 text-[10px] rounded-full">
                                                  {est.texto} {est.dias >= 0 && `(${est.dias}d)`}
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

                              {/* Resumen */}
                              <div className="space-y-3 lg:col-span-2">
                                <h4 className="font-semibold flex items-center gap-1 text-[13px]">
                                  <Layers className="h-4 w-4" /> Resumen Inventario
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                  <InfoBox label="Unidades totales" value={p.cantidadGeneral} />
                                  <InfoBox label="Stock mínimo" value={p.cantidadMinima ?? 0} />
                                  <InfoBox
                                    label="Valor compra"
                                    value={`S/ ${(p.stocks || []).reduce((s,l)=>s + l.cantidadUnidades*l.precioCompra,0).toFixed(2)}`}
                                    wide
                                  />
                                  <InfoBox label="Lotes" value={p.stocks?.length || 0} />
                                  <InfoBox
                                    label="Próx. Venc."
                                    value={
                                      p.stocks?.length
                                        ? Math.min(...p.stocks.map(l=>calcularDiasParaVencer(l.fechaVencimiento))) + " d"
                                        : "—"
                                    }
                                  />
                                  <div className="col-span-2 pt-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-[11px]"
                                      onClick={()=>setLotesModalProducto(p)}
                                    >
                                      Ver en modal
                                    </Button>
                                  </div>
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
                    <TableCell colSpan={10} className="py-10 text-center text-muted-foreground">
                      No se encontraron productos
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="text-xs text-muted-foreground">
              Página {page} de {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={()=> setPage(p => Math.max(1, p-1))}
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
                  placeholder="Página"
                  onChange={e=>{
                    const val = Number(e.target.value)
                    if (!Number.isNaN(val)) setPage(Math.min(Math.max(1,val), totalPages))
                  }}
                />
                <span className="text-xs text-muted-foreground">/ {totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={()=> setPage(p=> Math.min(totalPages, p+1))}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MODAL LOTES */}
      <Dialog open={!!lotesModalProducto} onOpenChange={()=> setLotesModalProducto(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" /> Lotes de {lotesModalProducto?.nombre}
            </DialogTitle>
            <DialogDescription>
              Código: {lotesModalProducto?.codigoBarras} • {lotesModalProducto?.stocks?.length || 0} lotes
            </DialogDescription>
          </DialogHeader>
          {lotesModalProducto && (
            <div className="space-y-5">
              <div className="rounded-xl border bg-muted/40 backdrop-blur-sm overflow-auto">
                <Table className="text-sm">
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Unidades</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead>Compra (S/)</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Días</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lotesModalProducto.stocks?.map(l => {
                      const dias = calcularDiasParaVencer(l.fechaVencimiento)
                      const est = obtenerEstadoLote(l.fechaVencimiento)
                      return (
                        <TableRow key={l.codigoStock || `${l.fechaVencimiento}-${l.cantidadUnidades}`}>
                          <TableCell>
                            <Badge variant="outline" className="rounded-full">{l.codigoStock || "—"}</Badge>
                          </TableCell>
                          <TableCell className="tabular-nums">{l.cantidadUnidades}</TableCell>
                          <TableCell>{new Date(l.fechaVencimiento).toLocaleDateString("es-PE")}</TableCell>
                          <TableCell className="tabular-nums">S/ {l.precioCompra.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={est.color as any} className="rounded-full">
                              {est.texto}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={clsx(
                              dias < 0 ? "text-red-600" :
                              dias <= 30 ? "text-amber-500" : "text-emerald-600",
                              "tabular-nums text-xs font-medium"
                            )}>
                              {dias < 0 ? `-${Math.abs(dias)} d` : `${dias} d`}
                            </span>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="grid sm:grid-cols-4 gap-4">
                <StatTile label="Total unidades" value={lotesModalProducto.stocks?.reduce((s,l)=>s+l.cantidadUnidades,0) ?? 0} accent="text-blue-600" />
                <StatTile label="Total lotes" value={lotesModalProducto.stocks?.length ?? 0} accent="text-green-600" />
                <StatTile
                  label="Valor inventario"
                  value={`S/ ${(lotesModalProducto.stocks?.reduce((s,l)=>s + l.cantidadUnidades*l.precioCompra,0) || 0).toFixed(2)}`}
                  accent="text-purple-600"
                />
                <StatTile
                  label="Próx. vencimiento"
                  value={
                    (lotesModalProducto.stocks?.length ?? 0) > 0
                      ? Math.min(...(lotesModalProducto.stocks || []).map(l=>calcularDiasParaVencer(l.fechaVencimiento))) + " d"
                      : "—"
                  }
                  accent="text-orange-600"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG EDITAR */}
      <Dialog open={!!editandoProducto} onOpenChange={cerrarEdicion}>
        <DialogContent className="max-w-6xl w-full">
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
            <DialogDescription>Actualiza datos del producto y sus lotes</DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-10 max-h-[70vh] overflow-y-auto pr-2">
            <section className="space-y-6">
              <SectionTitle title="Datos Generales" />
              {editandoProducto && (
                <>
                  <Field label="Código de barras *" placeholder="Ej: 7750112345678" value={editandoProducto.codigo_barras} onChange={v=>setEditandoProducto((p:any)=>({...p, codigo_barras:v}))} />
                  <Field label="Nombre *" placeholder="Nombre comercial" value={editandoProducto.nombre} onChange={v=>setEditandoProducto((p:any)=>({...p, nombre:v}))} />
                  <Field label="Concentración" placeholder="Ej: 500mg" value={editandoProducto.concentracion} onChange={v=>setEditandoProducto((p:any)=>({...p, concentracion:v}))} />
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Categoría</Label>
                    <ComboBoxCategoria
                      value={editandoProducto.categoria}
                      onChange={categoria => setEditandoProducto((p:any)=>({...p, categoria}))}
                    />
                  </div>
                  <Field label="Principio activo" placeholder="Sustancia activa" value={editandoProducto.principioActivo} onChange={v=>setEditandoProducto((p:any)=>({...p, principioActivo:v}))} />
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Tipo</Label>
                    <Select
                      value={editandoProducto.tipoMedicamento}
                      onValueChange={value=>setEditandoProducto((p:any)=>({...p, tipoMedicamento:value}))}
                    >
                      <SelectTrigger><SelectValue placeholder="Elige tipo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GENÉRICO">Genérico</SelectItem>
                        <SelectItem value="MARCA">Marca</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Field label="Presentación" placeholder="Forma farmacéutica" value={editandoProducto.presentacion} onChange={v=>setEditandoProducto((p:any)=>({...p, presentacion:v}))} />
                  <Field label="Laboratorio" placeholder="Fabricante" value={editandoProducto.laboratorio} onChange={v=>setEditandoProducto((p:any)=>({...p, laboratorio:v}))} />
                  <Field label="Stock mínimo" placeholder="Ej: 15" type="number" value={editandoProducto.cantidad_minima} onChange={v=>setEditandoProducto((p:any)=>({...p, cantidad_minima:v}))} />
                </>
              )}
            </section>

            <section className="space-y-6">
              <SectionTitle title="Unidades / Lotes" />
              {editandoProducto && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Unidades/blister" placeholder="Ej: 10" type="number" value={editandoProducto.cantidad_unidades_blister} onChange={v=>setEditandoProducto((p:any)=>({...p, cantidad_unidades_blister:v}))} />
                    <Field label="Precio blister" placeholder="Ej: 12.50" type="number" step="0.01" value={editandoProducto.precio_venta_blister} onChange={v=>setEditandoProducto((p:any)=>({...p, precio_venta_blister:v}))} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Precio venta *" placeholder="Unitario S/" type="number" step="0.01" value={editandoProducto.precio_venta_und} onChange={v=>setEditandoProducto((p:any)=>({...p, precio_venta_und:v}))} />
                    <Field label="Precio descuento" placeholder="Descuento S/" type="number" step="0.01" value={editandoProducto.descuento} onChange={v=>setEditandoProducto((p:any)=>({...p, descuento:v}))} />
                  </div>

                  <div className="space-y-2 pt-2">
                    <SectionTitle title="Lotes" small />
                    <div className="grid grid-cols-4 gap-3">
                      <Input placeholder="Código lote (opcional)" className="col-span-2" value={loteEnEdicion?.codigoStock || ""} onChange={e=>setLoteEnEdicion(o=>({...o, codigoStock:e.target.value} as StockLote))} />
                      <Input placeholder="Unidades" type="number" min={1} className="col-span-2" value={loteEnEdicion?.cantidadUnidades || ""} onChange={e=>setLoteEnEdicion(o=>({...o, cantidadUnidades:Number(e.target.value)} as StockLote))} />
                      <Input type="date" className="col-span-2" value={loteEnEdicion?.fechaVencimiento || ""} onChange={e=>setLoteEnEdicion(o=>({...o, fechaVencimiento:e.target.value} as StockLote))} />
                      <Input placeholder="Precio compra (S/)" type="number" step="0.01" className="col-span-2" value={loteEnEdicion?.precioCompra ?? ""} onChange={e=>setLoteEnEdicion(o=>({...o, precioCompra:Number(e.target.value)} as StockLote))} />
                    </div>
                    <div className="flex gap-2">
                      {editLoteIndex === null ? (
                        <Button size="sm" variant="secondary" onClick={agregarLoteAEdicion}>Agregar lote</Button>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={guardarLoteEditado}>Guardar edición</Button>
                      )}
                      {editLoteIndex !== null && (
                        <Button size="sm" variant="ghost" onClick={()=>{ setEditLoteIndex(null); setLoteEnEdicion(null) }}>
                          Cancelar
                        </Button>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        Stock total: {editandoProducto.stocks.reduce((s:number,l:StockLote)=>s+l.cantidadUnidades,0)} u
                      </span>
                    </div>
                    <div className="rounded-lg border bg-background/50 backdrop-blur-sm max-h-48 overflow-auto">
                      {(!editandoProducto.stocks || editandoProducto.stocks.length === 0) && (
                        <div className="text-xs p-4 text-muted-foreground">Sin lotes</div>
                      )}
                      {editandoProducto.stocks && editandoProducto.stocks.length > 0 && (
                        <Table className="text-[11px]">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="py-1">Lote</TableHead>
                              <TableHead className="py-1">Unid</TableHead>
                              <TableHead className="py-1">Venc</TableHead>
                              <TableHead className="py-1">Compra</TableHead>
                              <TableHead className="py-1 text-right">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {editandoProducto.stocks.map((l:StockLote, idx:number)=>(
                              <TableRow key={l.codigoStock || `${l.fechaVencimiento}-${idx}`}>
                                <TableCell className="py-1">{l.codigoStock}</TableCell>
                                <TableCell className="py-1 tabular-nums">{l.cantidadUnidades}</TableCell>
                                <TableCell className="py-1">{l.fechaVencimiento}</TableCell>
                                <TableCell className="py-1 tabular-nums">S/ {Number(l.precioCompra).toFixed(2)}</TableCell>
                                <TableCell className="py-1 text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={()=>editarLoteDeEdicion(idx)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={()=>eliminarLoteDeEdicion(idx)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={cerrarEdicion}>Cancelar</Button>
            <Button onClick={guardarEdicion}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* -------------------- SUBCOMPONENTES -------------------- */

function DensityToggle({ compact, onChange }: { compact: boolean; onChange: ()=>void }) {
  return (
    <div className="flex items-center rounded-full border bg-background/70 backdrop-blur px-1">
      <Button
        size="icon"
        variant={!compact ? "secondary" : "ghost"}
        className="h-8 w-8 rounded-full"
        onClick={()=> compact && onChange()}
        aria-label="Vista normal"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant={compact ? "secondary" : "ghost"}
        className="h-8 w-8 rounded-full"
        onClick={()=> !compact && onChange()}
        aria-label="Vista compacta"
      >
        <Minimize2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

function SectionTitle({ title, small=false }: { title: string; small?: boolean }) {
  return (
    <h3
      className={clsx(
        "font-semibold tracking-tight flex items-center gap-2",
        small ? "text-xs uppercase text-muted-foreground" : "text-sm"
      )}
    >
      {title}
    </h3>
  )
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  step,
  placeholder
}: {
  label: string
  value: any
  onChange: (v: string) => void
  type?: string
  step?: string
  placeholder?: string
}) {
  const auto = placeholder || `Ingresa ${label.replace("*","").toLowerCase()}`.trim()
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">{label}</Label>
      <Input
        value={value}
        type={type}
        step={step}
        placeholder={auto}
        onChange={e => onChange(e.target.value)}
        className="focus-visible:ring-1"
      />
    </div>
  )
}

function InfoBox({ label, value, wide, accent }: { label: string; value: any; wide?: boolean; accent?: string }) {
  return (
    <div className={clsx(
      "p-2 rounded-lg border bg-background/50 backdrop-blur-sm flex flex-col gap-0.5 hover:shadow-sm transition-shadow",
      wide && "col-span-2"
    )}>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={clsx("text-xs font-semibold tabular-nums", accent)}>{value}</span>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: any }) {
  return (
    <p className="text-[12px] leading-snug">
      <span className="text-muted-foreground">{label}:</span>{" "}
      <span className="font-medium">{value}</span>
    </p>
  )
}

function StatTile({ label, value, accent }: { label: string; value: any; accent?: string }) {
  return (
    <div className="rounded-lg border bg-background/60 backdrop-blur-sm p-4 text-center">
      <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={clsx("mt-1 block font-bold text-lg tabular-nums", accent)}>{value}</span>
    </div>
  )
}