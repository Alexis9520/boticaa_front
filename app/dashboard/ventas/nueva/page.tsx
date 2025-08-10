"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Minus, Plus, Search, Trash2, X, Layers, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import TicketPrint from "@/components/TicketPrint"
import { apiUrl } from "@/components/config"

interface Producto {
  codigoBarras: string
  nombre: string
  precioVentaUnd: number
  precioVentaBlister?: number
  cantidadUnidadesBlister?: number
  cantidadGeneral: number
  descuento: number
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

// Generador de número único de boleta (local, para ejemplo)
function generarNumeroBoleta(serie = "B") {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const rand = Math.floor(Math.random() * 90000) + 10000 // 5 dígitos aleatorios
  return `${serie}-${yyyy}${mm}${dd}-${rand}`
}

export default function NuevaVentaPage() {
  const [busqueda, setBusqueda] = useState("")
  const [productos, setProductos] = useState<Producto[]>([])
  const [resultados, setResultados] = useState<Producto[]>([])
  const [carrito, setCarrito] = useState<ProductoCarrito[]>([])
  const [metodoPago, setMetodoPago] = useState("efectivo")
  const [montoEfectivo, setMontoEfectivo] = useState("")
  const [montoYape, setMontoYape] = useState("")
  const [mostrarResultados, setMostrarResultados] = useState(false)
  const [dniCliente, setDniCliente] = useState("")
  const [nombreCliente, setNombreCliente] = useState("")
  const [usuarioSesion, setUsuarioSesion] = useState<UsuarioSesion | null>(null)
  const [configuracionGeneral, setConfiguracionGeneral] = useState(() => {
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
  const [configuracionBoleta, setConfiguracionBoleta] = useState(() => {
    if (typeof window !== "undefined") {
      const data = localStorage.getItem("configuracionBoleta")
      return (
        data
          ? JSON.parse(data)
          : {
              serieBoleta: "B",
              mensajePie: "¡Gracias por su compra!",
              mostrarLogo: true,
              imprimirAutomatico: true,
              formatoImpresion: "80mm",
            }
      )
    }
    return {
      serieBoleta: "B",
      mensajePie: "¡Gracias por su compra!",
      mostrarLogo: true,
      imprimirAutomatico: true,
      formatoImpresion: "80mm",
    }
  })

  const { toast } = useToast()
  const router = useRouter()
  const [showTicket, setShowTicket] = useState(false)
  const [ventaGenerada, setVentaGenerada] = useState<any>(null)
  const [printSize, setPrintSize] = useState<"58mm" | "80mm">("58mm")

  useEffect(() => {
    const size = localStorage.getItem("ticketPrintSize") as "58mm" | "80mm"
    if (size) setPrintSize(size)
  }, [])

  useEffect(() => {
    if (showTicket && ventaGenerada) {
      setTimeout(() => {
        window.print()
        setShowTicket(false)
        setVentaGenerada(null)
        router.push("/dashboard/ventas/nueva")
      }, 300)
    }
  }, [showTicket, ventaGenerada, router])

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const data = await fetchWithAuth(apiUrl("/productos"))
        setProductos(data)
      } catch (e) {
        toast({ title: "Error", description: "No se pudo cargar productos", variant: "destructive" })
      }
    }
    fetchProductos()
  }, [toast])

  useEffect(() => {
    const usuarioStr = typeof window !== "undefined" ? localStorage.getItem("usuario") : null;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (usuarioStr && token) {
      try {
        const usuario = JSON.parse(usuarioStr);
        setUsuarioSesion(usuario);
      } catch (e) {
        setUsuarioSesion(null);
        localStorage.removeItem("usuario");
        localStorage.removeItem("token");
        toast({ title: "Error", description: "No has iniciado sesión", variant: "destructive" });
        router.push("/login");
      }
    } else {
      setUsuarioSesion(null);
      toast({ title: "Error", description: "No has iniciado sesión", variant: "destructive" });
      router.push("/login");
    }
  }, [toast, router]);

  // Calcular total de toda la venta:
  const total = carrito.reduce((sum, item) =>
    sum +
    ((item.precioVentaBlister ?? 0) * item.cantidadBlister) +
    ((item.precioVentaUnd - (item.descuento ?? 0)) * item.cantidadUnidad)
  , 0)
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
  } else if (metodoPago === "mixto") {
    const efectivo = Number.parseFloat(montoEfectivo) || 0
    const yape = Number.parseFloat(montoYape) || 0
    const pagado = efectivo + yape
    vuelto = pagado > total ? pagado - total : 0
    faltante = pagado < total ? total - pagado : 0
  }

  // Formulario blister/unidad en resultados
  const [blisterUnidadSeleccion, setBlisterUnidadSeleccion] = useState<{ [codigo: string]: { blisters: number, unidades: number } }>({})

  const buscarProductos = () => {
    if (busqueda.trim() === "") {
      setResultados([])
      setMostrarResultados(false)
      return
    }
    const filtrados = productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.codigoBarras.toLowerCase().includes(busqueda.toLowerCase()),
    )
    setResultados(filtrados)
    setMostrarResultados(true)
    if (filtrados.length === 0) {
      toast({ title: "Sin resultados", description: "No se encontraron productos", variant: "destructive" })
    }
  }

  // Agregar al carrito considerando blisters y unidades
  const agregarAlCarrito = (producto: Producto) => {
    const seleccion = blisterUnidadSeleccion[producto.codigoBarras] || { blisters: 0, unidades: 0 }
    const cantidadTotal = (producto.cantidadUnidadesBlister ?? 0) * seleccion.blisters + seleccion.unidades
    if (cantidadTotal <= 0) {
      toast({ title: "Cantidad inválida", description: "Agrega al menos 1 unidad o blister", variant: "destructive" })
      return
    }
    if (cantidadTotal > producto.cantidadGeneral) {
      toast({ title: "Stock insuficiente", description: `Stock insuficiente: máximo ${producto.cantidadGeneral} unidades`, variant: "destructive" })
      return
    }
    setCarrito(prev => {
      const existente = prev.find(item => item.codigoBarras === producto.codigoBarras)
      if (existente) {
        const nuevoBlisters = existente.cantidadBlister + seleccion.blisters
        const nuevoUnidades = existente.cantidadUnidad + seleccion.unidades
        const nuevoTotal = (producto.cantidadUnidadesBlister ?? 0) * nuevoBlisters + nuevoUnidades
        if (nuevoTotal > producto.cantidadGeneral) {
          toast({ title: "Stock insuficiente", description: `Stock insuficiente: máximo ${producto.cantidadGeneral} unidades`, variant: "destructive" })
          return prev
        }
        return prev.map(item =>
          item.codigoBarras === producto.codigoBarras
            ? {
                ...item,
                cantidadBlister: nuevoBlisters,
                cantidadUnidad: nuevoUnidades,
                subtotal:
                  (producto.precioVentaBlister ?? 0) * nuevoBlisters +
                  (producto.precioVentaUnd - (producto.descuento ?? 0)) * nuevoUnidades,
              }
            : item
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
          cantidadBlister: seleccion.blisters,
          cantidadUnidad: seleccion.unidades,
          subtotal:
            (producto.precioVentaBlister ?? 0) * seleccion.blisters +
            (producto.precioVentaUnd - (producto.descuento ?? 0)) * seleccion.unidades,
        },
      ]
    })
    setBlisterUnidadSeleccion(prev => ({ ...prev, [producto.codigoBarras]: { blisters: 0, unidades: 0 } }))
    setBusqueda("")
    setResultados([])
    setMostrarResultados(false)
    toast({ title: "Producto añadido", description: `Se agregó "${producto.nombre}" al carrito`, variant: "default" })
  }

  // Cambiar cantidad de blisters/unidades en carrito
  const cambiarCantidadCarrito = (codigoBarras: string, tipo: "blister" | "unidad", incremento: number) => {
    setCarrito(prev => {
      return prev.map(item => {
        if (item.codigoBarras !== codigoBarras) return item
        const producto = productos.find(p => p.codigoBarras === codigoBarras)
        if (!producto) return item
        let nuevaBlisters = item.cantidadBlister
        let nuevaUnidades = item.cantidadUnidad
        if (tipo === "blister") {
          nuevaBlisters = Math.max(0, item.cantidadBlister + incremento)
        } else {
          nuevaUnidades = Math.max(0, item.cantidadUnidad + incremento)
        }
        const total = (producto.cantidadUnidadesBlister ?? 0) * nuevaBlisters + nuevaUnidades
        if (total > producto.cantidadGeneral) {
          toast({ title: "Stock insuficiente", description: `Stock insuficiente: máximo ${producto.cantidadGeneral} unidades`, variant: "destructive" })
          return item
        }
        return {
          ...item,
          cantidadBlister: nuevaBlisters,
          cantidadUnidad: nuevaUnidades,
          subtotal:
            (producto.precioVentaBlister ?? 0) * nuevaBlisters +
            (producto.precioVentaUnd - (producto.descuento ?? 0)) * nuevaUnidades,
        }
      }).filter(i => i.cantidadBlister > 0 || i.cantidadUnidad > 0)
    })
  }

  const eliminarDelCarrito = (codigoBarras: string) => {
    const eliminado = carrito.find((item) => item.codigoBarras === codigoBarras)
    setCarrito((prev) => prev.filter((item) => item.codigoBarras !== codigoBarras))
    if (eliminado) {
      toast({
        title: "Producto eliminado",
        description: `Se eliminó "${eliminado.nombre}" del carrito`,
        variant: "default",
      })
    }
  }

  const procesarVenta = async () => {
    if (carrito.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Agrega productos al carrito para realizar una venta",
        variant: "destructive",
      })
      return
    }

    if (metodoPago === "efectivo") {
      const efectivo = Number.parseFloat(montoEfectivo) || 0
      if (efectivo < total) {
        toast({
          title: "Monto insuficiente",
          description: "El monto en efectivo debe ser mayor o igual al total",
          variant: "destructive",
        })
        return
      }
    }
    if (metodoPago === "yape") {
      const yape = Number.parseFloat(montoYape) || 0
      if (yape < total) {
        toast({
          title: "Monto insuficiente",
          description: "El monto en Yape debe ser mayor o igual al total",
          variant: "destructive",
        })
        return
      }
    }
    if (metodoPago === "mixto") {
      const efectivo = Number.parseFloat(montoEfectivo) || 0
      const yape = Number.parseFloat(montoYape) || 0
      if (efectivo <= 0 || yape <= 0) {
        toast({
          title: "Montos incorrectos",
          description: "Los montos de efectivo y Yape deben ser mayores a cero",
          variant: "destructive",
        })
        return
      }
      if (efectivo + yape < total) {
        toast({
          title: "Montos insuficientes",
          description: "La suma de los montos debe ser igual o mayor al total",
          variant: "destructive",
        })
        return
      }
    }

    if (!nombreCliente || !usuarioSesion?.dni) {
      toast({
        title: "Faltan datos",
        description: "Completa los datos del cliente",
        variant: "destructive",
      })
      return
    }

    const dniClienteEnviar = dniCliente && dniCliente.trim() !== "" ? dniCliente.trim() : "99999999"
    const numeroBoleta = generarNumeroBoleta(configuracionBoleta.serieBoleta)

    // Adaptar payload para backend (envía el número)
    const ventaDTO = {
      numero: numeroBoleta,
      dniCliente: dniClienteEnviar,
      nombreCliente,
      dniVendedor: usuarioSesion.dni,
      productos: carrito.map((item) => ({
        codBarras: item.codigoBarras,
        cantidad:
          (item.cantidadUnidadesBlister ?? 0) * item.cantidadBlister +
          item.cantidadUnidad,
      })),
      metodoPago: {
        nombre: metodoPago.toUpperCase(),
        efectivo: (metodoPago === "efectivo" || metodoPago === "mixto") ? Number(montoEfectivo) : 0,
        digital: (metodoPago === "yape" || metodoPago === "mixto") ? Number(montoYape) : 0,
      },
    }

    try {
      await fetchWithAuth(apiUrl("/api/ventas"), {
        method: "POST",
        body: JSON.stringify(ventaDTO),
      })

      toast({
        title: "Venta realizada",
        description: "La venta se ha registrado correctamente",
        variant: "default",
      })
      try {
         const productosRes = await fetchWithAuth(apiUrl("/productos"))
        setProductos(productosRes)
      } catch (e) {}
      setVentaGenerada({
        fecha: new Date().toLocaleString(),
        nombreCliente,
        dniCliente: dniClienteEnviar,
        nombreVendedor: usuarioSesion?.nombreCompleto,
        productos: carrito,
        total,
        metodoPago: ventaDTO.metodoPago,
        numero: numeroBoleta,
      })
      setShowTicket(true)
      setCarrito([])
      setMontoEfectivo("")
      setMontoYape("")
      setMostrarResultados(false)
    } catch (e: any) {
      const msg = typeof e === "string" ? e : (e?.message || "No se pudo registrar la venta")
      if (msg.includes("No hay una caja abierta")) {
        toast({
          title: "No hay caja abierta",
          description: "Primero debes abrir una caja antes de realizar una venta.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: msg || "No se pudo registrar la venta",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Nueva Venta</h1>
        </div>
      </div>
      {/* Datos cliente */}
      <Card className="mb-2">
        <CardHeader>
          <CardTitle>Datos del Cliente</CardTitle>
          <CardDescription>El DNI no es obligatorio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="font-medium" htmlFor="dni-cliente">DNI Cliente</Label>
              <Input
                id="dni-cliente"
                value={dniCliente}
                onChange={e => setDniCliente(e.target.value.replace(/[^0-9]/g, ""))}
                maxLength={8}
                placeholder="Opcional: 8 dígitos"
                className="border-2 border-gray-200 focus:border-emerald-500"
                inputMode="numeric"
              />
            </div>
            <div>
              <Label className="font-medium" htmlFor="nombre-cliente">Nombre Cliente <span className="text-rose-600">*</span></Label>
              <Input
                id="nombre-cliente"
                value={nombreCliente}
                onChange={e => setNombreCliente(e.target.value)}
                placeholder="Nombre completo"
                className="border-2 border-gray-200 focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <Label className="font-medium" htmlFor="dni-vendedor">DNI Vendedor</Label>
              <Input
                id="dni-vendedor"
                value={usuarioSesion?.dni || ""}
                readOnly
                disabled
              />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Buscar Productos</CardTitle>
              <CardDescription>Busca productos por nombre o código de barras</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar por nombre o código..."
                    className="pl-8"
                    value={busqueda}
                    onChange={(e) => {
                      setBusqueda(e.target.value)
                      const valor = e.target.value
                      if (valor.trim() === "") {
                        setResultados([])
                        setMostrarResultados(false)
                        return
                      }
                      const filtrados = productos.filter(
                        (p) =>
                          p.nombre.toLowerCase().includes(valor.toLowerCase()) ||
                          p.codigoBarras.toLowerCase().includes(valor.toLowerCase()),
                      )
                      setResultados(filtrados)
                      setMostrarResultados(true)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        buscarProductos()
                      }
                    }}
                  />
                </div>
                <Button onClick={buscarProductos}>Buscar</Button>
              </div>
              {mostrarResultados && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Resultados de búsqueda</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setMostrarResultados(false)
                        setResultados([])
                        setBusqueda("")
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="border rounded-md max-h-72 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead>Presentación</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead className="text-center">Venta</TableHead>
                          <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resultados.map((producto) => {
                          const precioFinal = producto.precioVentaUnd - (producto.descuento ?? 0)
                          const descuentoPorcentaje =
                            producto.precioVentaUnd > 0
                              ? ((producto.descuento / producto.precioVentaUnd) * 100)
                              : 0
                          return (
                            <TableRow key={producto.codigoBarras}>
                              <TableCell className="font-medium">{producto.codigoBarras}</TableCell>
                              <TableCell>{producto.nombre}</TableCell>
                              <TableCell>
                                {producto.cantidadUnidadesBlister && producto.precioVentaBlister ? (
                                  <span>
                                    <Badge variant="outline" className="flex items-center gap-1 mb-1">
                                      <Layers className="w-3 h-3 mr-1 text-primary" />
                                      Blister: {producto.cantidadUnidadesBlister}u
                                    </Badge>
                                    <br />
                                    <Badge variant="outline" className="flex items-center gap-1">
                                      <Package className="w-3 h-3 mr-1" />
                                      Suelto
                                    </Badge>
                                  </span>
                                ) : (
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <Package className="w-3 h-3 mr-1" />
                                    Suelto
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div>
                                  {producto.cantidadUnidadesBlister && producto.precioVentaBlister ? (
                                    <div>
                                      <span className="mr-1 font-semibold text-primary">
                                        S/ {producto.precioVentaBlister.toFixed(2)}
                                      </span>
                                      <span className="text-xs text-muted-foreground">/ blister</span>
                                      <br />
                                      <span className="font-semibold text-emerald-600">
                                        S/ {precioFinal.toFixed(2)}
                                      </span>
                                      <span className="text-xs text-muted-foreground">/ unidad</span>
                                    </div>
                                  ) : (
                                    <span>
                                      <span className="font-semibold text-emerald-600">
                                        S/ {precioFinal.toFixed(2)}
                                      </span>
                                      <span className="text-xs text-muted-foreground">/ unidad</span>
                                    </span>
                                  )}
                                  {(producto.descuento ?? 0) > 0 && (
                                    <Badge
                                      variant="outline"
                                      className="bg-yellow-100 text-yellow-800 border-yellow-300 ml-2"
                                    >
                                      -{descuentoPorcentaje.toFixed(2)}%
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={producto.cantidadGeneral > 10 ? "default" : "destructive"}>
                                  {producto.cantidadGeneral} unidades
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  {producto.cantidadUnidadesBlister && producto.precioVentaBlister ? (
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs">Blisters</span>
                                        <Input
                                          type="number"
                                          min={0}
                                          max={Math.floor(producto.cantidadGeneral / producto.cantidadUnidadesBlister)}
                                          className="w-16 h-8"
                                          value={blisterUnidadSeleccion[producto.codigoBarras]?.blisters ?? ""}
                                          onChange={e => {
                                            const v = Math.max(0, Number(e.target.value))
                                            setBlisterUnidadSeleccion(prev => ({
                                              ...prev,
                                              [producto.codigoBarras]: {
                                                ...prev[producto.codigoBarras],
                                                blisters: v,
                                                unidades: prev[producto.codigoBarras]?.unidades ?? 0,
                                              }
                                            }))
                                          }}
                                        />
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs">Unidades</span>
                                        <Input
                                          type="number"
                                          min={0}
                                          max={producto.cantidadUnidadesBlister - 1}
                                          className="w-16 h-8"
                                          value={blisterUnidadSeleccion[producto.codigoBarras]?.unidades ?? ""}
                                          onChange={e => {
                                            let v = Math.max(0, Number(e.target.value))
                                            if (producto.cantidadUnidadesBlister && v >= producto.cantidadUnidadesBlister) v = producto.cantidadUnidadesBlister - 1
                                            setBlisterUnidadSeleccion(prev => ({
                                              ...prev,
                                              [producto.codigoBarras]: {
                                                ...prev[producto.codigoBarras],
                                                blisters: prev[producto.codigoBarras]?.blisters ?? 0,
                                                unidades: v,
                                              }
                                            }))
                                          }}
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs">Unidades</span>
                                      <Input
                                        type="number"
                                        min={0}
                                        max={producto.cantidadGeneral}
                                        className="w-16 h-8"
                                        value={blisterUnidadSeleccion[producto.codigoBarras]?.unidades ?? ""}
                                        onChange={e => {
                                          const v = Math.max(0, Number(e.target.value))
                                          setBlisterUnidadSeleccion(prev => ({
                                            ...prev,
                                            [producto.codigoBarras]: {
                                              blisters: 0,
                                              unidades: v,
                                            }
                                          }))
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  onClick={() => agregarAlCarrito(producto)}
                                  disabled={producto.cantidadGeneral === 0}
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
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Carrito de Compras</CardTitle>
              <CardDescription>Productos seleccionados para la venta</CardDescription>
            </CardHeader>
            <CardContent>
              {carrito.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No hay productos en el carrito</div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Blisters</TableHead>
                        <TableHead>Unidades</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {carrito.map((item) => (
                        <TableRow key={item.codigoBarras}>
                          <TableCell>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {item.nombre}
                                {(item.descuento ?? 0) > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="bg-yellow-100 text-yellow-800 border-yellow-300 ml-2"
                                  >
                                    Descuento
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">{item.codigoBarras}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => cambiarCantidadCarrito(item.codigoBarras, "blister", -1)}
                                disabled={item.cantidadBlister === 0}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center">{item.cantidadBlister}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => cambiarCantidadCarrito(item.codigoBarras, "blister", 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <span className="text-xs text-muted-foreground ml-2">
                                {item.cantidadUnidadesBlister ? `${item.cantidadUnidadesBlister}u/blister` : ""}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => cambiarCantidadCarrito(item.codigoBarras, "unidad", -1)}
                                disabled={item.cantidadUnidad === 0}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center">{item.cantidadUnidad}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => cambiarCantidadCarrito(item.codigoBarras, "unidad", 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
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
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Método de Pago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={metodoPago} onValueChange={v => {
                setMetodoPago(v)
                setMontoEfectivo("")
                setMontoYape("")
              }}>
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
                  <Label htmlFor="monto-efectivo">Monto recibido</Label>
                  <Input
                    id="monto-efectivo"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={montoEfectivo}
                    onChange={(e) => setMontoEfectivo(e.target.value)}
                  />
                  {faltante > 0 && (
                    <div className="text-sm text-red-600">Faltan S/ {faltante.toFixed(2)} para completar el pago.</div>
                  )}
                </div>
              )}
              {metodoPago === "yape" && (
                <div className="space-y-2">
                  <Label htmlFor="monto-yape">Monto recibido (Yape)</Label>
                  <Input
                    id="monto-yape"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={montoYape}
                    onChange={(e) => setMontoYape(e.target.value)}
                  />
                  {faltante > 0 && (
                    <div className="text-sm text-red-600">Faltan S/ {faltante.toFixed(2)} para completar el pago.</div>
                  )}
                </div>
              )}
              {metodoPago === "mixto" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="monto-efectivo-mixto">Monto en efectivo</Label>
                    <Input
                      id="monto-efectivo-mixto"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={montoEfectivo}
                      onChange={(e) => setMontoEfectivo(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monto-yape-mixto">Monto Yape</Label>
                    <Input
                      id="monto-yape-mixto"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={montoYape}
                      onChange={(e) => setMontoYape(e.target.value)}
                    />
                  </div>
                  {faltante > 0 && (
                    <div className="text-sm text-red-600">Faltan S/ {faltante.toFixed(2)} para completar el pago.</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Resumen de Venta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>S/ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>S/ {total.toFixed(2)}</span>
                </div>
                {(vuelto > 0) && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Vuelto:</span>
                    <span>S/ {vuelto.toFixed(2)}</span>
                  </div>
                )}
              </div>
              <Separator />
              <Button className="w-full" size="lg" onClick={procesarVenta} disabled={carrito.length === 0}>
                Procesar Venta
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      {showTicket && ventaGenerada && (
        <div className="ticket-print">
          <TicketPrint
            venta={ventaGenerada}
            configuracionGeneral={configuracionGeneral}
            configuracionBoleta={configuracionBoleta}
          />
        </div>
      )}
    </div>
  )
}