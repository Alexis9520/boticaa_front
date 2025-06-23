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
import { ArrowLeft, Minus, Plus, Search, Trash2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import TicketPrint from "@/components/TicketPrint"

interface Producto {
  codigoBarras: string
  nombre: string
  precioVentaUnd: number
  cantidadGeneral: number
  descuento?: number
}

interface ProductoCarrito {
  codigoBarras: string
  nombre: string
  precioVentaUnd: number
  descuento?: number
  cantidad: number
  subtotal: number
}

interface UsuarioSesion {
  dni: string
  nombreCompleto: string
  rol: string
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

  // CONFIGURACIÓN GENERAL Y BOLETA
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

  // Ticket print states
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

  // Cargar productos desde el backend
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const res = await fetch("/api/productos")
        if (!res.ok) throw new Error("Error al obtener productos")
        const data = await res.json()
        setProductos(data)
      } catch (e) {
        toast({ title: "Error", description: "No se pudo cargar productos", variant: "destructive" })
      }
    }
    fetchProductos()
  }, [toast])

  // Cargar usuario de sesión
  useEffect(() => {
    const fetchSesion = async () => {
      try {
        const res = await fetch("/api/sesion")
        if (!res.ok) throw new Error("No autenticado")
        const data = await res.json()
        setUsuarioSesion(data.user)
      } catch (e) {
        toast({ title: "Error", description: "No has iniciado sesión", variant: "destructive" })
        router.push("/login")
      }
    }
    fetchSesion()
  }, [toast, router])

  // Calcular totales
  const total = carrito.reduce((sum, item) => sum + item.subtotal, 0)
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

  // Buscar productos por nombre/código de barras
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

  // Usar codigoBarras como ID único y aplicar descuento
  const agregarAlCarrito = (producto: Producto) => {
    let toastInfo: { title: string; description: string; variant: "default" | "destructive" } | null = null;
    const tieneDescuento = !!producto.descuento && producto.descuento > 0
    const precioFinal = tieneDescuento
      ? producto.precioVentaUnd * (1 - (Number(producto.descuento) / 100))
      : producto.precioVentaUnd

    setCarrito((prev) => {
      const existente = prev.find((item) => item.codigoBarras === producto.codigoBarras)
      if (existente) {
        const nuevaCantidad = existente.cantidad + 1
        if (nuevaCantidad <= producto.cantidadGeneral) {
          toastInfo = {
            title: "Producto añadido",
            description: `Se agregó otra unidad de "${producto.nombre}" al carrito${tieneDescuento ? ` (Descuento: ${producto.descuento}%)` : ""}`,
            variant: "default"
          }
          return prev.map((item) =>
            item.codigoBarras === producto.codigoBarras
              ? { ...item, cantidad: nuevaCantidad, subtotal: nuevaCantidad * precioFinal }
              : item,
          )
        } else {
          toastInfo = {
            title: "Stock insuficiente",
            description: `Solo hay ${producto.cantidadGeneral} unidades disponibles`,
            variant: "destructive"
          }
          return prev
        }
      } else {
        toastInfo = {
          title: "Producto añadido",
          description: `Se agregó "${producto.nombre}" al carrito${tieneDescuento ? ` (Descuento: ${producto.descuento}%)` : ""}`,
          variant: "default"
        }
        return [
          ...prev,
          {
            codigoBarras: producto.codigoBarras,
            nombre: producto.nombre,
            precioVentaUnd: producto.precioVentaUnd,
            descuento: producto.descuento ?? 0,
            cantidad: 1,
            subtotal: precioFinal,
          },
        ]
      }
    })

    setBusqueda("")
    setResultados([])
    setMostrarResultados(false)

    if (toastInfo) toast(toastInfo)
  }

  const cambiarCantidad = (codigoBarras: string, incremento: number) => {
    let toastInfo: { title: string; description: string; variant: "default" | "destructive" } | null = null;

    setCarrito((prev) => {
      const producto = prev.find((item) => item.codigoBarras === codigoBarras)
      if (!producto) return prev
      const productoOriginal = productos.find((p) => p.codigoBarras === codigoBarras)
      if (!productoOriginal) return prev
      const tieneDescuento = !!productoOriginal.descuento && productoOriginal.descuento > 0
      const precioFinal = tieneDescuento
        ? productoOriginal.precioVentaUnd * (1 - (Number(productoOriginal.descuento) / 100))
        : productoOriginal.precioVentaUnd
      const nuevaCantidad = producto.cantidad + incremento

      if (nuevaCantidad <= 0) {
        toastInfo = {
          title: "Producto eliminado",
          description: `Se eliminó "${producto.nombre}" del carrito`,
          variant: "default",
        }
        return prev.filter((item) => item.codigoBarras !== codigoBarras)
      }

      if (nuevaCantidad > productoOriginal.cantidadGeneral) {
        toastInfo = {
          title: "Stock insuficiente",
          description: `Solo hay ${productoOriginal.cantidadGeneral} unidades disponibles`,
          variant: "destructive",
        }
        return prev
      }

      toastInfo = {
        title: "Cantidad actualizada",
        description: `Cantidad de "${producto.nombre}" actualizada a ${nuevaCantidad}`,
        variant: "default",
      }
      return prev.map((item) =>
        item.codigoBarras === codigoBarras
          ? { ...item, cantidad: nuevaCantidad, subtotal: nuevaCantidad * precioFinal }
          : item,
      )
    })

    if (toastInfo) toast(toastInfo)
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

    const ventaDTO = {
      dniCliente: dniClienteEnviar,
      nombreCliente,
      dniVendedor: usuarioSesion.dni,
      productos: carrito.map((item) => ({
        codBarras: item.codigoBarras,
        cantidad: item.cantidad,
      })),
      metodoPago: {
        nombre: metodoPago.toUpperCase(),
        efectivo: (metodoPago === "efectivo" || metodoPago === "mixto") ? Number(montoEfectivo) : 0,
        digital: (metodoPago === "yape" || metodoPago === "mixto") ? Number(montoYape) : 0, // <--- CORREGIDO
      },
    }

    try {
      const res = await fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ventaDTO),
      })

      if (res.ok) {
        toast({
          title: "Venta realizada",
          description: "La venta se ha registrado correctamente",
          variant: "default",
        })
        const productosRes = await fetch("/api/productos")
        if (productosRes.ok) {
          setProductos(await productosRes.json())
        }
        setVentaGenerada({
          fecha: new Date().toLocaleString(),
          nombreCliente,
          dniCliente: dniClienteEnviar,
          nombreVendedor: usuarioSesion?.nombreCompleto, 
          productos: carrito,
          total,
          metodoPago: ventaDTO.metodoPago
        })
        setShowTicket(true)
        setCarrito([])
        setMontoEfectivo("")
        setMontoYape("")
        setMostrarResultados(false)
      } else {
        const errorText = await res.text()
        if (errorText.includes("No hay una caja abierta")) {
          toast({
            title: "No hay caja abierta",
            description: "Primero debes abrir una caja antes de realizar una venta.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Error",
            description: errorText || "No se pudo registrar la venta",
            variant: "destructive",
          })
        }
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "No se pudo conectar con el servidor",
        variant: "destructive",
      })
    }
  }
 
  return (
    <div className="flex flex-col gap-5">
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
                  <div className="border rounded-md max-h-60 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resultados.map((producto) => (
                          <TableRow key={producto.codigoBarras}>
                            <TableCell className="font-medium">{producto.codigoBarras}</TableCell>
                            <TableCell>{producto.nombre}</TableCell>
                            <TableCell>
                              {producto.descuento && producto.descuento > 0 ? (
                                <span>
                                  <span className="line-through mr-1 text-xs text-muted-foreground">
                                    S/ {producto.precioVentaUnd.toFixed(2)}
                                  </span>
                                  <span className="text-emerald-600 font-semibold">
                                    S/ {(producto.precioVentaUnd * (1 - Number(producto.descuento) / 100)).toFixed(2)}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="bg-yellow-100 text-yellow-800 border-yellow-300 ml-2"
                                  >
                                    -{producto.descuento}% desc.
                                  </Badge>
                                </span>
                              ) : (
                                <span>S/ {producto.precioVentaUnd.toFixed(2)}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={producto.cantidadGeneral > 10 ? "default" : "destructive"}>
                                {producto.cantidadGeneral} unidades
                              </Badge>
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
                        ))}
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
                        <TableHead>Precio</TableHead>
                        <TableHead>Cantidad</TableHead>
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
                                {item.descuento && item.descuento > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="bg-yellow-100 text-yellow-800 border-yellow-300 ml-2"
                                  >
                                    -{item.descuento}% desc.
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">{item.codigoBarras}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.descuento && item.descuento > 0 ? (
                              <span>
                                <span className="line-through mr-1 text-xs text-muted-foreground">
                                  S/ {item.precioVentaUnd.toFixed(2)}
                                </span>
                                <span className="text-emerald-600 font-semibold">
                                  S/ {(item.precioVentaUnd * (1 - item.descuento / 100)).toFixed(2)}
                                </span>
                              </span>
                            ) : (
                              <span>S/ {item.precioVentaUnd.toFixed(2)}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => cambiarCantidad(item.codigoBarras, -1)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center">{item.cantidad}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => cambiarCantidad(item.codigoBarras, 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>S/ {item.subtotal.toFixed(2)}</TableCell>
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
      {/* Ticket para imprimir */}
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