"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Minus, Plus, Search, Trash2, X, Layers, Package, ChevronsUpDown, ArrowUpAZ, ArrowDownAZ } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { apiUrl } from "@/components/config"
import { buildTicketHTML, VentaPreview } from "@/lib/print-utils"

interface Producto {
  codigoBarras: string
  nombre: string
  precioVentaUnd: number
  precioVentaBlister?: number
  cantidadUnidadesBlister?: number
  cantidadGeneral: number
  descuento: number
  // NUEVOS CAMPOS
  concentracion?: string
  laboratorio?: string
  tipoMedicamento?: "GENÉRICO" | "MARCA" | string
  presentacion?: string
}

interface ProductoCarrito {
  codigoBarras: string
  nombre: string
  precioVentaUnd: number
  precioVentaBlister?: number
  cantidadUnidadesBlister?: number
  descuento: number
  cantidadBlister: number
  cantidadUnidad: number
  subtotal: number
}

interface UsuarioSesion {
  dni: string
  nombreCompleto: string
  rol: string
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  if (!token) {
    window.location.href = "/login"
    throw new Error("No token")
  }
  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
  const res = await fetch(url, { ...options, headers })
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    const errorText = await res.text()
    throw new Error(errorText || `Error en la petición: ${res.status}`)
  }
  const contentLength = res.headers.get("content-length")
  if (res.status === 204 || contentLength === "0") return null
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function generarNumeroBoleta(serie = "B") {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, "0")
  const dd = String(now.getDate()).padStart(2, "0")
  const rand = Math.floor(Math.random() * 90000) + 10000
  return `${serie}-${yyyy}${mm}${dd}-${rand}`
}

function buildVentaPreviewFromState(params: {
  numero: string
  fecha: string
  carrito: ProductoCarrito[]
  total: number
  metodoPago: "efectivo" | "yape" | "mixto"
  montoEfectivo: number
  montoYape: number
  nombreCliente: string
  dniCliente: string
  nombreVendedor?: string
}): VentaPreview {
  const {
    numero,
    fecha,
    carrito,
    total,
    metodoPago,
    montoEfectivo,
    montoYape,
    nombreCliente,
    dniCliente,
    nombreVendedor,
  } = params
  const items: VentaPreview["items"] = []
  carrito.forEach(p => {
    const pu = Math.max(0, p.precioVentaUnd - (p.descuento ?? 0))
    if (p.cantidadBlister > 0 && p.precioVentaBlister) {
      const nombre = p.cantidadUnidadesBlister
        ? `${p.nombre} [Blister x${p.cantidadUnidadesBlister}]`
        : `${p.nombre} [Blister]`
      items.push({
        nombre,
        cantidad: p.cantidadBlister,
        precio: p.precioVentaBlister,
        subtotal: p.precioVentaBlister * p.cantidadBlister,
      })
    }
    if (p.cantidadUnidad > 0) {
      items.push({
        nombre: `${p.nombre} [Unidad]`,
        cantidad: p.cantidadUnidad,
        precio: pu,
        subtotal: pu * p.cantidadUnidad,
      })
    }
  })

  let nombreMetodo = "EFECTIVO"
  if (metodoPago === "yape") nombreMetodo = "YAPE"
  if (metodoPago === "mixto") nombreMetodo = "MIXTO"

  const pagado =
    (metodoPago === "efectivo" ? montoEfectivo : 0) +
    (metodoPago === "yape" ? montoYape : 0) +
    (metodoPago === "mixto" ? montoEfectivo + montoYape : 0)
  const vuelto = Math.max(0, pagado - total)

  return {
    numero,
    fecha,
    cliente: nombreCliente,
    dni: dniCliente || undefined,
    vendedor: nombreVendedor || "",
    items,
    total,
    metodo: {
      nombre: nombreMetodo,
      efectivo:
        metodoPago === "efectivo" || metodoPago === "mixto"
          ? (montoEfectivo || undefined)
          : undefined,
      digital:
        metodoPago === "yape" || metodoPago === "mixto"
          ? (montoYape || undefined)
          : undefined,
      vuelto: vuelto || undefined,
    },
  }
}

type SortField =
  | "nombre"
  | "precio"
  | "stock"
  | "laboratorio"
  | "tipo"
  | "concentracion"

export default function NuevaVentaPage() {
  const router = useRouter()
  const { toast } = useToast()

  // PRODUCTOS / BUSQUEDA
  const [busqueda, setBusqueda] = useState("")
  const [productos, setProductos] = useState<Producto[]>([])
  const [mostrarResultados, setMostrarResultados] = useState(false)

  // ORDENAMIENTO
  const [sortField, setSortField] = useState<SortField>("nombre")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  // SELECCIÓN (para agregar al carrito)
  const [blisterUnidadSeleccion, setBlisterUnidadSeleccion] = useState<Record<string, { blisters: number; unidades: number }>>({})

  // CARRITO / PAGO
  const [carrito, setCarrito] = useState<ProductoCarrito[]>([])
  const [metodoPago, setMetodoPago] = useState<"efectivo" | "yape" | "mixto">("efectivo")
  const [montoEfectivo, setMontoEfectivo] = useState("")
  const [montoYape, setMontoYape] = useState("")

  // CLIENTE / SESION
  const [dniCliente, setDniCliente] = useState("")
  const [nombreCliente, setNombreCliente] = useState("")
  const [usuarioSesion, setUsuarioSesion] = useState<UsuarioSesion | null>(null)

  // CAJA
  const [cajaAbierta, setCajaAbierta] = useState<boolean | null>(null)
  const [cargandoCaja, setCargandoCaja] = useState(false)

  // CONFIG
  const [configuracionGeneral] = useState(() => {
    if (typeof window !== "undefined") {
      const data = localStorage.getItem("configuracionGeneral")
      return (
        data
          ? JSON.parse(data)
          : {
              nombreNegocio: "Boticas Said",
              direccion: "Av. Principal 123, Lima",
              telefono: "+51 999 888 777",
              ruc: "20123456789",
              moneda: "S/",
            }
      )
    }
    return {
      nombreNegocio: "Boticas Said",
      direccion: "Av. Principal 123, Lima",
      telefono: "+51 999 888 777",
      ruc: "20123456789",
      moneda: "S/",
    }
  })

  const [configuracionBoleta] = useState(() => {
    if (typeof window !== "undefined") {
      const data = localStorage.getItem("configuracionBoleta")
      return (
        data
          ? JSON.parse(data)
          : {
              serieBoleta: "B",
              mensajePie: "",
              mostrarLogo: true,
              imprimirAutomatico: true,
              formatoImpresion: "80mm",
            }
      )
    }
    return {
      serieBoleta: "B",
      mensajePie: "",
      mostrarLogo: true,
      imprimirAutomatico: true,
      formatoImpresion: "80mm",
    }
  })

  const checkCajaAbierta = useCallback(
    async (showMessage = false): Promise<boolean> => {
      if (!usuarioSesion?.dni) {
        setCajaAbierta(false)
        return false
      }
      try {
        setCargandoCaja(true)
        const url = apiUrl(`/api/cajas/actual?dniUsuario=${encodeURIComponent(usuarioSesion.dni)}`)
        const resp = await fetchWithAuth(url)

        if (!resp) {
          setCajaAbierta(false)
          if (showMessage) {
            toast({
              title: "No hay caja abierta",
              description: "Debes abrir una caja antes de realizar la venta.",
              variant: "destructive",
            })
          }
          return false
        }
        const abierta =
          (resp.estado && resp.estado.toUpperCase() === "ABIERTA") ||
          (!resp.estado && !resp.fechaCierre)
        setCajaAbierta(abierta)
        if (showMessage && !abierta) {
          toast({
            title: "Caja no disponible",
            description: "La caja actual está cerrada.",
            variant: "destructive",
          })
        }
        return abierta
      } catch {
        setCajaAbierta(false)
        if (showMessage) {
          toast({
            title: "Error verificando caja",
            description: "No se pudo consultar el estado de la caja.",
            variant: "destructive",
          })
        }
        return false
      } finally {
        setCargandoCaja(false)
      }
    },
    [usuarioSesion?.dni, toast]
  )

  // Cargar productos
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const data = await fetchWithAuth(apiUrl("/productos"))
        setProductos(data || [])
      } catch {
        toast({
          title: "Error",
            description: "No se pudo cargar productos",
            variant: "destructive",
        })
      }
    }
    fetchProductos()
  }, [toast])

  // Cargar usuario
  useEffect(() => {
    const usuarioStr = typeof window !== "undefined" ? localStorage.getItem("usuario") : null
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (usuarioStr && token) {
      try {
        const usuario = JSON.parse(usuarioStr)
        setUsuarioSesion(usuario)
      } catch {
        setUsuarioSesion(null)
        localStorage.removeItem("usuario")
        localStorage.removeItem("token")
        toast({
          title: "Error",
          description: "No has iniciado sesión",
          variant: "destructive",
        })
        router.push("/login")
      }
    } else {
      setUsuarioSesion(null)
      toast({
        title: "Error",
        description: "No has iniciado sesión",
        variant: "destructive",
      })
      router.push("/login")
    }
  }, [toast, router])

  // Verificar caja al tener usuario
  useEffect(() => {
    if (usuarioSesion?.dni) checkCajaAbierta()
  }, [usuarioSesion?.dni, checkCajaAbierta])

  // FILTRAR + ORDENAR RESULTADOS
  const resultados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    let base = q
      ? productos.filter(p =>
          (p.nombre?.toLowerCase().includes(q)) ||
          p.codigoBarras.toLowerCase().includes(q) ||
          (p.laboratorio || "").toLowerCase().includes(q) ||
          (p.concentracion || "").toLowerCase().includes(q) ||
          (p.tipoMedicamento || "").toLowerCase().includes(q)
        )
      : []

    // Ordenamiento
    base.sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1
      switch (sortField) {
        case "nombre":
          return a.nombre.localeCompare(b.nombre) * mul
        case "precio": {
          const pa = (a.precioVentaUnd - (a.descuento || 0))
          const pb = (b.precioVentaUnd - (b.descuento || 0))
          return (pa - pb) * mul
        }
        case "stock":
          return (a.cantidadGeneral - b.cantidadGeneral) * mul
        case "laboratorio":
          return (a.laboratorio || "").localeCompare(b.laboratorio || "") * mul
        case "tipo":
          return (a.tipoMedicamento || "").localeCompare(b.tipoMedicamento || "") * mul
        case "concentracion":
          return (a.concentracion || "").localeCompare(b.concentracion || "") * mul
        default:
          return 0
      }
    })
    return base
  }, [productos, busqueda, sortField, sortDir])

  // Totales
  const total = carrito.reduce(
    (sum, item) =>
      sum +
      ((item.precioVentaBlister ?? 0) * item.cantidadBlister) +
      ((item.precioVentaUnd - (item.descuento ?? 0)) * item.cantidadUnidad),
    0
  )

  let vuelto = 0
  let faltante = 0
  if (metodoPago === "efectivo") {
    const efectivo = Number.parseFloat(montoEfectivo) || 0
    vuelto = efectivo > total ? efectivo - total : 0
    faltante = efectivo < total ? total - efectivo : 0
  } else if (metodoPago === "yape") {
    const yape = Number.parseFloat(montoYape) || 0
    vuelto = yape > total ? yape - total : 0
    faltante = yape < total ? total - yape : 0
  } else {
    const efectivo = Number.parseFloat(montoEfectivo) || 0
    const yape = Number.parseFloat(montoYape) || 0
    const pagado = efectivo + yape
    vuelto = pagado > total ? pagado - total : 0
    faltante = pagado < total ? total - pagado : 0
  }

  // Handlers
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  const agregarAlCarrito = (producto: Producto) => {
    const sel = blisterUnidadSeleccion[producto.codigoBarras] || { blisters: 0, unidades: 0 }
    const unidadesPorBlister = producto.cantidadUnidadesBlister || 0
    const cantidadTotal = unidadesPorBlister * sel.blisters + sel.unidades

    if (cantidadTotal <= 0) {
      toast({
        title: "Cantidad inválida",
        description: "Agrega al menos 1 unidad o blister",
        variant: "destructive",
      })
      return
    }
    if (cantidadTotal > producto.cantidadGeneral) {
      toast({
        title: "Stock insuficiente",
        description: `Stock insuficiente: máximo ${producto.cantidadGeneral} unidades`,
        variant: "destructive",
      })
      return
    }

    setCarrito(prev => {
      const existing = prev.find(p => p.codigoBarras === producto.codigoBarras)
      const precioBlister = producto.precioVentaBlister ?? 0
      const precioUnidadFinal = producto.precioVentaUnd - (producto.descuento ?? 0)

      if (existing) {
        const newB = existing.cantidadBlister + sel.blisters
        const newU = existing.cantidadUnidad + sel.unidades
        const nuevoTotalUnidades = unidadesPorBlister * newB + newU
        if (nuevoTotalUnidades > producto.cantidadGeneral) {
          toast({
            title: "Stock insuficiente",
            description: `Stock insuficiente: máximo ${producto.cantidadGeneral} unidades`,
            variant: "destructive",
          })
          return prev
        }
        return prev.map(p =>
          p.codigoBarras === existing.codigoBarras
            ? {
                ...p,
                cantidadBlister: newB,
                cantidadUnidad: newU,
                subtotal: precioBlister * newB + precioUnidadFinal * newU,
              }
            : p
        )
      }

      return [
        ...prev,
        {
          codigoBarras: producto.codigoBarras,
          nombre: producto.nombre,
          precioVentaUnd: producto.precioVentaUnd,
          precioVentaBlister: producto.precioVentaBlister,
            cantidadUnidadesBlister: producto.cantidadUnidadesBlister,
          descuento: producto.descuento,
          cantidadBlister: sel.blisters,
          cantidadUnidad: sel.unidades,
          subtotal: precioBlister * sel.blisters + precioUnidadFinal * sel.unidades,
        },
      ]
    })
  }

  const cambiarCantidadCarrito = (codigoBarras: string, tipo: "blister" | "unidad", delta: number) => {
    setCarrito(prev =>
      prev
        .map(item => {
          if (item.codigoBarras !== codigoBarras) return item
          const producto = productos.find(p => p.codigoBarras === codigoBarras)
          if (!producto) return item
          let nb = item.cantidadBlister
          let nu = item.cantidadUnidad
          if (tipo === "blister") nb = Math.max(0, nb + delta)
          else nu = Math.max(0, nu + delta)

          const unidadesPorBlister = item.cantidadUnidadesBlister || 0
          const totalTemp = unidadesPorBlister * nb + nu
          if (totalTemp > producto.cantidadGeneral) {
            toast({
              title: "Stock insuficiente",
              description: `Stock insuficiente: máximo ${producto.cantidadGeneral} unidades`,
              variant: "destructive",
            })
            return item
          }
          const precioBlister = item.precioVentaBlister ?? 0
          const precioUnidadFinal = item.precioVentaUnd - (item.descuento ?? 0)
          return {
            ...item,
            cantidadBlister: nb,
            cantidadUnidad: nu,
            subtotal: precioBlister * nb + precioUnidadFinal * nu,
          }
        })
        .filter(i => i.cantidadBlister > 0 || i.cantidadUnidad > 0)
    )
  }

  const eliminarDelCarrito = (codigoBarras: string) => {
    const eliminado = carrito.find(c => c.codigoBarras === codigoBarras)
    setCarrito(prev => prev.filter(c => c.codigoBarras !== codigoBarras))
    if (eliminado) {
      toast({
        title: "Producto eliminado",
        description: `"${eliminado.nombre}" fue removido del carrito`,
      })
    }
  }

  const procesarVenta = async () => {
    if (carrito.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Agrega productos",
        variant: "destructive",
      })
      return
    }
    const abierta = await checkCajaAbierta(true)
    if (!abierta) return

    // Validaciones de pago
    if (metodoPago === "efectivo") {
      const efectivo = Number(montoEfectivo) || 0
      if (efectivo < total) {
        toast({
          title: "Monto insuficiente",
          description: "El efectivo no cubre el total",
          variant: "destructive",
        })
        return
      }
    } else if (metodoPago === "yape") {
      const yape = Number(montoYape) || 0
      if (yape < total) {
        toast({
          title: "Monto insuficiente",
          description: "El monto Yape no cubre el total",
          variant: "destructive",
        })
        return
      }
    } else {
      const ef = Number(montoEfectivo) || 0
      const yp = Number(montoYape) || 0
      if (ef <= 0 || yp <= 0) {
        toast({
          title: "Montos inválidos",
          description: "Ambos montos deben ser > 0",
          variant: "destructive",
        })
        return
      }
      if (ef + yp < total) {
        toast({
          title: "Suma insuficiente",
          description: "La suma no cubre el total",
          variant: "destructive",
        })
        return
      }
    }

    if (!nombreCliente || !usuarioSesion?.nombreCompleto) {
      toast({
        title: "Faltan datos",
        description: "Completa los datos del cliente",
        variant: "destructive",
      })
      return
    }

    const numeroBoleta = generarNumeroBoleta(configuracionBoleta.serieBoleta)
    const ventaDTO = {
      numero: numeroBoleta,
      dniCliente: dniCliente.trim() || "",
      nombreCliente,
      dniVendedor: usuarioSesion?.dni || "",
      productos: carrito.map(item => ({
        codBarras: item.codigoBarras,
        cantidad:
          (item.cantidadUnidadesBlister ?? 0) * item.cantidadBlister +
          item.cantidadUnidad,
      })),
      metodoPago: {
        nombre: metodoPago.toUpperCase(),
        efectivo:
          metodoPago === "efectivo" || metodoPago === "mixto" ? Number(montoEfectivo) : 0,
        digital:
          metodoPago === "yape" || metodoPago === "mixto" ? Number(montoYape) : 0,
      },
    }

    try {
      await fetchWithAuth(apiUrl("/api/ventas"), {
        method: "POST",
        body: JSON.stringify(ventaDTO),
      })
      toast({ title: "Venta realizada", description: "Venta registrada correctamente" })

      const ventaPreview: VentaPreview = buildVentaPreviewFromState({
        numero: numeroBoleta,
        fecha: new Date().toLocaleString(),
        carrito,
        total,
        metodoPago,
        montoEfectivo: Number(montoEfectivo) || 0,
        montoYape: Number(montoYape) || 0,
        nombreCliente,
        dniCliente: dniCliente.trim(),
        nombreVendedor: usuarioSesion?.nombreCompleto,
      })

      const html = buildTicketHTML(
        ventaPreview,
        {
          nombreNegocio: configuracionGeneral.nombreNegocio,
          direccion: configuracionGeneral.direccion,
          telefono: configuracionGeneral.telefono,
          email: configuracionGeneral.email,
          ruc: configuracionGeneral.ruc,
          moneda: configuracionGeneral.moneda,
        },
        {
          mensajePie: configuracionBoleta.mensajePie,
          mostrarLogo: configuracionBoleta.mostrarLogo,
          formatoImpresion: configuracionBoleta.formatoImpresion as any,
        }
      )

      const previewWin = window.open("/print", "ticketPreview", "width=800,height=900")
      if (!previewWin) {
        toast({
          title: "Pop-up bloqueado",
          description: "Permite ventanas emergentes para imprimir.",
          variant: "destructive",
        })
      }
      try {
        localStorage.setItem(
          "ticket_preview_job",
          JSON.stringify({
            html,
            formato: configuracionBoleta.formatoImpresion,
            auto: !!configuracionBoleta.imprimirAutomatico,
          })
        )
      } catch {}

      // Refrescar productos
      try {
        const productosRes = await fetchWithAuth(apiUrl("/productos"))
        setProductos(productosRes || [])
      } catch {}
      // Reset
      setCarrito([])
      setMontoEfectivo("")
      setMontoYape("")
      setMostrarResultados(false)
      setDniCliente("")
      setNombreCliente("")
    } catch (e: any) {
      const msg =
        typeof e === "string" ? e : e?.message || "No se pudo registrar la venta"
      if (msg.includes("No hay una caja abierta")) {
        setCajaAbierta(false)
        toast({
          title: "Caja cerrada",
          description: "Abre una caja antes de vender.",
          variant: "destructive",
        })
      } else {
        toast({ title: "Error", description: msg, variant: "destructive" })
      }
    }
  }

  const procesarVentaDisabled = carrito.length === 0 || !cajaAbierta || cargandoCaja

  // UI Helpers
  function SortButton({ field, children }: { field: SortField; children: React.ReactNode }) {
    const active = sortField === field
    const dirIcon =
      active && sortDir === "asc" ? (
        <ArrowUpAZ className="h-3 w-3" />
      ) : active && sortDir === "desc" ? (
        <ArrowDownAZ className="h-3 w-3" />
      ) : (
        <ChevronsUpDown className="h-3 w-3 opacity-60" />
      )
    return (
      <button
        type="button"
        onClick={() => toggleSort(field)}
        className={`inline-flex items-center gap-1 text-xs font-medium transition ${
          active ? "text-primary" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {children}
        {dirIcon}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Nueva Venta</h1>
        </div>
        <div>
          {cajaAbierta === null && <Badge variant="outline">Verificando caja...</Badge>}
          {cajaAbierta === false && <Badge variant="destructive">No hay caja abierta</Badge>}
          {cajaAbierta === true && <Badge>Caja abierta</Badge>}
        </div>
      </div>

      {/* Cliente */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Datos del Cliente</CardTitle>
          <CardDescription>El DNI es opcional</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="dni-cliente">DNI Cliente</Label>
              <Input
                id="dni-cliente"
                value={dniCliente}
                onChange={e =>
                  setDniCliente(e.target.value.replace(/[^0-9]/g, ""))
                }
                maxLength={8}
                placeholder="Opcional"
                inputMode="numeric"
              />
            </div>
            <div>
              <Label htmlFor="nombre-cliente">
                Nombre Cliente <span className="text-rose-600">*</span>
              </Label>
              <Input
                id="nombre-cliente"
                value={nombreCliente}
                onChange={e => setNombreCliente(e.target.value)}
                placeholder="Nombre completo"
                required
              />
            </div>
            <div>
              <Label htmlFor="vendedor">Vendedor</Label>
              <Input
                id="vendedor"
                value={usuarioSesion?.nombreCompleto || ""}
                readOnly
                disabled
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna izquierda (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Buscar Productos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Buscar Productos</CardTitle>
              <CardDescription>
                Busca por nombre, código, laboratorio, concentración o tipo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar..."
                    className="pl-8"
                    value={busqueda}
                    onChange={e => {
                      setBusqueda(e.target.value)
                      if (e.target.value.trim() === "") {
                        setMostrarResultados(false)
                      } else {
                        setMostrarResultados(true)
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === "Escape") {
                        setBusqueda("")
                        setMostrarResultados(false)
                      }
                    }}
                  />
                </div>
                <Button
                  variant={mostrarResultados ? "secondary" : "default"}
                  onClick={() => {
                    if (busqueda.trim() === "") {
                      toast({
                        title: "Ingresa un término",
                        variant: "destructive",
                      })
                      return
                    }
                    setMostrarResultados(true)
                  }}
                >
                  Buscar
                </Button>
              </div>

              {mostrarResultados && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm">
                      Resultados ({resultados.length})
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="hidden sm:flex items-center gap-3 pr-2 border-r">
                        <SortButton field="nombre">Nombre</SortButton>
                        <SortButton field="precio">Precio</SortButton>
                        <SortButton field="stock">Stock</SortButton>
                        <SortButton field="laboratorio">Lab</SortButton>
                        <SortButton field="tipo">Tipo</SortButton>
                        <SortButton field="concentracion">Concentración</SortButton>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setMostrarResultados(false)
                          setBusqueda("")
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="border rounded-md max-h-80 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="text-xs">
                          <TableHead className="min-w-[110px]">
                            <SortButton field="nombre">Producto</SortButton>
                          </TableHead>
                          <TableHead className="w-[110px]">
                            <SortButton field="concentracion">Concent.</SortButton>
                          </TableHead>
                          <TableHead className="w-[120px]">
                            <SortButton field="laboratorio">Laboratorio</SortButton>
                          </TableHead>
                          <TableHead className="w-[90px]">
                            <SortButton field="tipo">Tipo</SortButton>
                          </TableHead>
                          <TableHead className="w-[110px]">Presentación</TableHead>
                          <TableHead className="w-[130px]">
                            <SortButton field="precio">Precio</SortButton>
                          </TableHead>
                          <TableHead className="w-[90px]">
                            <SortButton field="stock">Stock</SortButton>
                          </TableHead>
                          <TableHead className="w-[150px] text-center">
                            Venta
                          </TableHead>
                          <TableHead className="text-right w-[100px]">
                            Acción
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resultados.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={9}
                              className="text-center text-sm text-muted-foreground py-6"
                            >
                              No hay resultados
                            </TableCell>
                          </TableRow>
                        )}
                        {resultados.map(prod => {
                          const precioUnidadFinal =
                            prod.precioVentaUnd - (prod.descuento ?? 0)
                          const descuentoPct =
                            prod.precioVentaUnd > 0 && prod.descuento > 0
                              ? (prod.descuento / prod.precioVentaUnd) * 100
                              : 0
                          const sel =
                            blisterUnidadSeleccion[prod.codigoBarras] || {
                              blisters: 0,
                              unidades: 0,
                            }
                          const tipoBadgeVariant =
                            prod.tipoMedicamento === "MARCA"
                              ? "destructive"
                              : "outline"
                          return (
                            <TableRow key={prod.codigoBarras} className="text-[13px]">
                              <TableCell className="align-top">
                                <div className="font-medium leading-tight">
                                  {prod.nombre}
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  {prod.codigoBarras}
                                </div>
                              </TableCell>
                              <TableCell className="align-top">
                                <span className="text-xs">
                                  {prod.concentracion || "—"}
                                </span>
                              </TableCell>
                              <TableCell className="align-top">
                                <span className="text-xs">
                                  {prod.laboratorio || "—"}
                                </span>
                              </TableCell>
                              <TableCell className="align-top">
                                <Badge
                                  variant={tipoBadgeVariant}
                                  className="px-1.5 py-0 text-[10px]"
                                >
                                  {prod.tipoMedicamento || "—"}
                                </Badge>
                              </TableCell>
                              <TableCell className="align-top">
                                {prod.presentacion ? (
                                  <span className="text-xs line-clamp-2">
                                    {prod.presentacion}
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    —
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="align-top">
                                <div className="flex flex-col gap-0.5">
                                  {prod.precioVentaBlister &&
                                  prod.cantidadUnidadesBlister ? (
                                    <div className="text-xs">
                                      <span className="font-semibold text-primary">
                                        S/ {prod.precioVentaBlister.toFixed(2)}
                                      </span>{" "}
                                      <span className="text-muted-foreground">
                                        / blister
                                      </span>
                                    </div>
                                  ) : null}
                                  <div className="text-xs flex flex-col">
                                    {descuentoPct > 0 && (
                                      <span className="line-through text-[10px] text-muted-foreground">
                                        S/ {prod.precioVentaUnd.toFixed(2)}
                                      </span>
                                    )}
                                    <span
                                      className={
                                        descuentoPct > 0
                                          ? "font-semibold text-emerald-600"
                                          : "font-semibold"
                                      }
                                    >
                                      S/ {precioUnidadFinal.toFixed(2)}
                                      <span className="text-muted-foreground">
                                        {" "}
                                        / und
                                      </span>
                                    </span>
                                  </div>
                                  {descuentoPct > 0 && (
                                    <Badge
                                      variant="outline"
                                      className="bg-yellow-100 text-yellow-800 border-yellow-300 w-fit px-1 py-0 text-[10px]"
                                    >
                                      -{descuentoPct.toFixed(1)}%
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="align-top">
                                <Badge
                                  variant={
                                    prod.cantidadGeneral <= 0
                                      ? "destructive"
                                      : prod.cantidadGeneral <= 10
                                      ? "secondary"
                                      : "default"
                                  }
                                  className="px-1.5 py-0 text-[10px]"
                                >
                                  {prod.cantidadGeneral} u
                                </Badge>
                              </TableCell>
                              <TableCell className="align-top">
                                <div className="flex flex-col gap-1">
                                  {prod.cantidadUnidadesBlister &&
                                  prod.precioVentaBlister ? (
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-1">
                                        <span className="text-[10px]">
                                          Blisters
                                        </span>
                                        <Input
                                          type="number"
                                          min={0}
                                          max={Math.floor(
                                            prod.cantidadGeneral /
                                              (prod.cantidadUnidadesBlister || 1)
                                          )}
                                          className="w-16 h-7 text-xs"
                                          value={sel.blisters || ""}
                                          onChange={e => {
                                            const v = Math.max(
                                              0,
                                              Number(e.target.value)
                                            )
                                            setBlisterUnidadSeleccion(prev => ({
                                              ...prev,
                                              [prod.codigoBarras]: {
                                                blisters: v,
                                                unidades:
                                                  prev[prod.codigoBarras]
                                                    ?.unidades ?? 0,
                                              },
                                            }))
                                          }}
                                        />
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className="text-[10px]">
                                          Unidades
                                        </span>
                                        <Input
                                          type="number"
                                          min={0}
                                          max={
                                            (prod.cantidadUnidadesBlister || 1) -
                                            1
                                          }
                                          className="w-16 h-7 text-xs"
                                          value={sel.unidades || ""}
                                          onChange={e => {
                                            let v = Math.max(
                                              0,
                                              Number(e.target.value)
                                            )
                                            const maxU =
                                              (prod.cantidadUnidadesBlister ||
                                                1) - 1
                                            if (v > maxU) v = maxU
                                            setBlisterUnidadSeleccion(prev => ({
                                              ...prev,
                                              [prod.codigoBarras]: {
                                                blisters:
                                                  prev[prod.codigoBarras]
                                                    ?.blisters ?? 0,
                                                unidades: v,
                                              },
                                            }))
                                          }}
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px]">
                                        Unidades
                                      </span>
                                      <Input
                                        type="number"
                                        min={0}
                                        max={prod.cantidadGeneral}
                                        className="w-20 h-7 text-xs"
                                        value={sel.unidades || ""}
                                        onChange={e => {
                                          const v = Math.max(
                                            0,
                                            Number(e.target.value)
                                          )
                                          setBlisterUnidadSeleccion(prev => ({
                                            ...prev,
                                            [prod.codigoBarras]: {
                                              blisters: 0,
                                              unidades: v,
                                            },
                                          }))
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="align-top text-right">
                                <Button
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => agregarAlCarrito(prod)}
                                  disabled={prod.cantidadGeneral === 0}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Agregar
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Carrito */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Carrito de Venta</CardTitle>
              <CardDescription>Productos que serán incluidos</CardDescription>
            </CardHeader>
            <CardContent>
              {carrito.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No hay productos en el carrito
                </div>
              ) : (
                <div className="border rounded-md overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="text-xs">
                        <TableHead>Producto</TableHead>
                        <TableHead>Blisters</TableHead>
                        <TableHead>Unidades</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {carrito.map(item => (
                        <TableRow key={item.codigoBarras} className="text-[13px]">
                          <TableCell>
                            <div className="font-medium flex items-center gap-2">
                              {item.nombre}
                              {(item.descuento ?? 0) > 0 && (
                                <Badge
                                  variant="outline"
                                  className="bg-yellow-100 text-yellow-800 border-yellow-300 px-1 py-0 text-[10px]"
                                >
                                  Desc
                                </Badge>
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {item.codigoBarras}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() =>
                                  cambiarCantidadCarrito(item.codigoBarras, "blister", -1)
                                }
                                disabled={item.cantidadBlister === 0}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-6 text-center text-sm">
                                {item.cantidadBlister}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() =>
                                  cambiarCantidadCarrito(item.codigoBarras, "blister", 1)
                                }
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              {item.cantidadUnidadesBlister ? (
                                <span className="text-[10px] text-muted-foreground ml-1">
                                  {item.cantidadUnidadesBlister}u/blister
                                </span>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() =>
                                  cambiarCantidadCarrito(item.codigoBarras, "unidad", -1)
                                }
                                disabled={item.cantidadUnidad === 0}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-6 text-center text-sm">
                                {item.cantidadUnidad}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() =>
                                  cambiarCantidadCarrito(item.codigoBarras, "unidad", 1)
                                }
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">
                            S/ {item.subtotal.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => eliminarDelCarrito(item.codigoBarras)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-medium">
                          Total
                        </TableCell>
                        <TableCell className="font-bold">
                          S/ {total.toFixed(2)}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha (Resumen / Pago) */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Método de Pago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={metodoPago}
                onValueChange={v => {
                  setMetodoPago(v as any)
                  setMontoEfectivo("")
                  setMontoYape("")
                }}
                className="grid gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="efectivo" id="efectivo" />
                  <Label htmlFor="efectivo">Efectivo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yape" id="yape" />
                  <Label htmlFor="yape">Yape</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mixto" id="mixto" />
                  <Label htmlFor="mixto">Mixto (Efectivo + Yape)</Label>
                </div>
              </RadioGroup>

              {metodoPago === "efectivo" && (
                <div className="space-y-2">
                  <Label htmlFor="monto-efectivo">Monto efectivo</Label>
                  <Input
                    id="monto-efectivo"
                    type="number"
                    step="0.01"
                    value={montoEfectivo}
                    onChange={e => setMontoEfectivo(e.target.value)}
                    placeholder="0.00"
                  />
                  {faltante > 0 && (
                    <div className="text-xs text-red-600">
                      Faltan S/ {faltante.toFixed(2)}
                    </div>
                  )}
                </div>
              )}
              {metodoPago === "yape" && (
                <div className="space-y-2">
                  <Label htmlFor="monto-yape">Monto Yape</Label>
                  <Input
                    id="monto-yape"
                    type="number"
                    step="0.01"
                    value={montoYape}
                    onChange={e => setMontoYape(e.target.value)}
                    placeholder="0.00"
                  />
                  {faltante > 0 && (
                    <div className="text-xs text-red-600">
                      Faltan S/ {faltante.toFixed(2)}
                    </div>
                  )}
                </div>
              )}
              {metodoPago === "mixto" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="monto-efectivo-mixto">Efectivo</Label>
                    <Input
                      id="monto-efectivo-mixto"
                      type="number"
                      step="0.01"
                      value={montoEfectivo}
                      onChange={e => setMontoEfectivo(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monto-yape-mixto">Yape</Label>
                    <Input
                      id="monto-yape-mixto"
                      type="number"
                      step="0.01"
                      value={montoYape}
                      onChange={e => setMontoYape(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  {faltante > 0 && (
                    <div className="text-xs text-red-600">
                      Faltan S/ {faltante.toFixed(2)}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>S/ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>S/ {total.toFixed(2)}</span>
                </div>
                {vuelto > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Vuelto</span>
                    <span>S/ {vuelto.toFixed(2)}</span>
                  </div>
                )}
              </div>
              <Separator />
              <Button
                className="w-full"
                size="lg"
                onClick={procesarVenta}
                disabled={procesarVentaDisabled}
              >
                {cargandoCaja
                  ? "Verificando caja..."
                  : cajaAbierta
                  ? "Procesar Venta"
                  : "Abrir caja para vender"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}