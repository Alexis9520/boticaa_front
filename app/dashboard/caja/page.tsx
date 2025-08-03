"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowDownIcon, ArrowUpIcon, Calculator, DollarSign, Plus,
  TrendingDown, TrendingUp, AlertTriangle, RefreshCcw, Search
} from "lucide-react"

type Usuario = {
  id?: number
  nombreCompleto: string
  dni: string
  rol?: string
}

type CajaResumen = {
  efectivo: number
  totalYape: number
  ingresos: number
  egresos: number
  efectivoInicial: number
  efectivoFinal: number
  cajaAbierta: boolean
  ventasEfectivo: number
  ventasYape: number
  ventasMixto: number
  totalVentas: number
  movimientos?: Movimiento[]
  diferencia?: number
  fechaApertura?: string
  fechaCierre?: string
  usuarioResponsable?: string
}

type Movimiento = {
  id: number
  fecha: string
  tipo: string
  descripcion: string
  monto: number
  usuario: string
}

type HistorialCaja = {
  id: number
  fechaApertura: string
  fechaCierre: string | null
  efectivoInicial: number
  efectivoFinal: number | null
  diferencia: number | null
  totalYape: number
  usuarioResponsable: string
}

// Útil para fetchs autenticados
async function fetchWithToken(url: string, options: RequestInit = {}): Promise<any> {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = {
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };
  const res = await fetch(url, { ...options, headers, credentials: "include" });
  if (res.status === 204) return null;
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) return await res.json();
  const text = await res.text();
  if (text) return text;
  return null;
}

export default function CajaPage() {
  // Estado principal
  const [cajaAbierta, setCajaAbierta] = useState(false)
  const [efectivoInicial, setEfectivoInicial] = useState("")
  const [efectivoFinalDeclarado, setEfectivoFinalDeclarado] = useState("")
  const [nuevoMovimiento, setNuevoMovimiento] = useState({
    tipo: "",
    monto: "",
    descripcion: "",
  })
  const [resumen, setResumen] = useState<CajaResumen | null>(null)
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [historial, setHistorial] = useState<HistorialCaja[]>([])
  const [alertaCajaAbierta, setAlertaCajaAbierta] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [movimientoSearch, setMovimientoSearch] = useState("")
  const [movimientoFiltroTipo, setMovimientoFiltroTipo] = useState("")
  const [confirmCerrar, setConfirmCerrar] = useState(false)
  const [confirmMovimiento, setConfirmMovimiento] = useState(false)
  const movimientoPendiente = useRef<{ tipo: string; monto: string; descripcion: string } | null>(null)
  const { toast } = useToast()

  // Cargar usuario desde sesión
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedUsuario = localStorage.getItem("usuario")
    if (storedUsuario) {
      try {
        setUsuario(JSON.parse(storedUsuario) as Usuario)
      } catch {
        setUsuario(null)
      }
    } else setUsuario(null)
  }, [])

  // Función reutilizable para refrescar TODO
  const refreshAll = async () => {
    if (!usuario) return
    setLoading(true)
    setError(null)
    try {
      // Resumen y movimientos
      const data = await fetchWithToken(`http://51.161.10.179/api/cajas/actual?dniUsuario=${usuario.dni}`)
      setResumen(data ? {
        efectivo: data.efectivo ?? 0,
        totalYape: data.totalYape ?? 0,
        ingresos: data.ingresos ?? 0,
        egresos: data.egresos ?? 0,
        efectivoInicial: data.efectivoInicial ?? 0,
        efectivoFinal: data.efectivoFinal ?? 0,
        cajaAbierta: !data.fechaCierre,
        ventasEfectivo: data.ventasEfectivo ?? 0,
        ventasYape: data.ventasYape ?? 0,
        ventasMixto: data.ventasMixto ?? 0,
        totalVentas: data.totalVentas ?? 0,
        movimientos: data.movimientos ?? [],
        diferencia: data.diferencia ?? 0,
        fechaApertura: data.fechaApertura,
        fechaCierre: data.fechaCierre,
        usuarioResponsable: data.usuarioResponsable
      } : null)
      setMovimientos(data?.movimientos ?? [])
      setCajaAbierta(Boolean(data) && !data.fechaCierre)
      setEfectivoInicial((data?.efectivoInicial ?? 0).toFixed(2))
      setEfectivoFinalDeclarado("")
      // Historial
      const hist = await fetchWithToken("http://51.161.10.179:8080/api/cajas/historial")
      setHistorial(hist ?? [])
      // Alerta cajas abiertas
      const cajas = await fetchWithToken("http://51.161.10.179:8080/api/cajas/abiertas")
      setAlertaCajaAbierta(Array.isArray(cajas) && cajas.length > 0)
    } catch (e: any) {
      setError("Error al refrescar datos: " + (e?.message || "desconocido"))
      toast({
        title: "Error",
        description: e?.message || "No se pudo refrescar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Cargar al iniciar y con usuario
  useEffect(() => { refreshAll() }, [usuario])

  // Auto-refresh cada 30s si activado
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => { refreshAll() }, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, usuario])

  // Confirmación de cierre de caja
  const handleCerrarCaja = () => {
    setConfirmCerrar(true)
  }
  const confirmarCerrarCaja = async () => {
    setConfirmCerrar(false)
    await cerrarCaja()
  }

  // Confirmación de movimiento grande
  const handleAgregarMovimiento = () => {
    const monto = parseFloat(nuevoMovimiento.monto)
    if (monto >= 1000) {
      movimientoPendiente.current = { ...nuevoMovimiento }
      setConfirmMovimiento(true)
    } else {
      agregarMovimiento()
    }
  }
  const confirmarAgregarMovimiento = async () => {
    setConfirmMovimiento(false)
    if (movimientoPendiente.current) {
      await agregarMovimiento(movimientoPendiente.current)
      movimientoPendiente.current = null
    }
  }

  // Validaciones
  const isValidMonto = (monto: string) => {
    if (!monto) return false
    const val = Number(monto)
    return !isNaN(val) && val > 0
  }
  const isValidEfectivo = (valor: string) => {
    if (!valor) return false
    const val = Number(valor)
    return !isNaN(val) && val >= 0
  }

  // Abrir caja
  const abrirCaja = async () => {
    if (!isValidEfectivo(efectivoInicial)) {
      toast({ title: "Error", description: "Ingresa un monto válido y no negativo para abrir la caja", variant: "destructive" })
      return
    }
    if (!usuario || !usuario.dni) {
      toast({ title: "Error", description: "No se encontró el usuario en sesión", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      await fetchWithToken("http://51.161.10.179:8080/api/cajas/abrir", {
        method: "POST",
        body: JSON.stringify({ dniUsuario: usuario.dni, efectivoInicial: Number.parseFloat(efectivoInicial) }),
      })
      await refreshAll()
      toast({ title: "Caja abierta", description: `Caja abierta con S/ ${efectivoInicial} en efectivo inicial` })
    } catch (e) {
      toast({ title: "Error al abrir caja", description: "Error inesperado en la petición", variant: "destructive" })
    } finally { setLoading(false) }
  }

  // Cerrar caja
  const cerrarCaja = async () => {
    if (!usuario || !usuario.dni) {
      toast({ title: "Error", description: "No se encontró el usuario en sesión", variant: "destructive" })
      return
    }
    if (!isValidEfectivo(efectivoFinalDeclarado)) {
      toast({ title: "Error", description: "Debes ingresar el efectivo contado (valor no negativo)", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      await fetchWithToken("http://51.161.10.179:8080/api/cajas/cerrar", {
        method: "POST",
        body: JSON.stringify({ dniUsuario: usuario.dni, efectivoFinalDeclarado: Number.parseFloat(efectivoFinalDeclarado) }),
      })
      await refreshAll()
      toast({ title: "Caja cerrada", description: "La caja ha sido cerrada correctamente" })
    } catch (e) {
      toast({ title: "Error al cerrar caja", description: "Error inesperado en la petición", variant: "destructive" })
    } finally { setLoading(false) }
  }

  // Agregar movimiento (puede recibir params para la confirmación)
  const agregarMovimiento = async (movParam?: { tipo: string; monto: string; descripcion: string }) => {
    const mov = movParam || nuevoMovimiento
    if (!mov.tipo || !mov.monto || !mov.descripcion) {
      toast({ title: "Error", description: "Completa todos los campos del movimiento", variant: "destructive" }); return;
    }
    if (!isValidMonto(mov.monto)) {
      toast({ title: "Error", description: "El monto debe ser mayor a 0", variant: "destructive" }); return;
    }
    if (!usuario || !usuario.dni) {
      toast({ title: "Error", description: "No se encontró el usuario en sesión", variant: "destructive" }); return;
    }
    setLoading(true)
    try {
      await fetchWithToken("http://51.161.10.179:8080/api/cajas/movimiento", {
        method: "POST",
        body: JSON.stringify({ ...mov, monto: Number.parseFloat(mov.monto), dniUsuario: usuario.dni }),
      })
      await refreshAll()
      setNuevoMovimiento({ tipo: "", monto: "", descripcion: "" })
      toast({ title: "Movimiento agregado", description: "El movimiento se ha registrado correctamente" })
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Error inesperado en la petición", variant: "destructive" })
    } finally { setLoading(false) }
  }

  // Diferencia en cierre
  function DiferenciaCierreCard({ diferencia }: { diferencia: number | undefined }) {
    if (typeof diferencia !== "number" || diferencia === 0) return null
    const esFaltante = diferencia < 0
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.4 }}
        >
          <Card className={esFaltante ? "border-red-600" : "border-emerald-600"}>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <AlertTriangle className={esFaltante ? "text-red-600" : "text-emerald-600"} />
              <CardTitle className={esFaltante ? "text-red-600" : "text-emerald-600"}>
                {esFaltante ? "Faltante en cierre" : "Sobrante en cierre"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                {esFaltante
                  ? `Hay un faltante de S/ ${Math.abs(diferencia).toFixed(2)} al cerrar la caja.`
                  : `Hay un sobrante de S/ ${Math.abs(diferencia).toFixed(2)} al cerrar la caja.`}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    )
  }

  // Efectivo esperado igual que backend
  const calcularEfectivoEsperado = () => {
    if (!resumen) return "--"
    return (
      resumen.efectivoInicial +
      resumen.ingresos +
      resumen.ventasEfectivo -
      resumen.egresos
    ).toFixed(2)
  }

  // Movimientos filtrados
  const movimientosFiltrados = movimientos
    .filter(mov =>
      (!movimientoSearch || mov.descripcion.toLowerCase().includes(movimientoSearch.toLowerCase()) || mov.usuario.toLowerCase().includes(movimientoSearch.toLowerCase()))
      && (movimientoFiltroTipo === "" || movimientoFiltroTipo === "todos" || mov.tipo.toLowerCase() === movimientoFiltroTipo.toLowerCase())
    )

  return (
    <div className="flex flex-col gap-5">
      {/* Alerta global por caja(s) abiertas */}
      <AnimatePresence>
        {alertaCajaAbierta && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="mb-2"
          >
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-3 rounded-md flex items-center gap-2">
              <AlertTriangle className="text-yellow-600" />
              <span>¡Atención! Hay caja(s) abiertas pendientes de cierre. Por favor, regulariza antes de continuar.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Caja</h1>
          <p className="text-muted-foreground">Administra la apertura, cierre y movimientos de caja</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={refreshAll}
            disabled={loading}
            title="Refrescar datos"
          >
            <RefreshCcw className="h-4 w-4 animate-spin" style={{ animationPlayState: loading ? "running" : "paused" }} />
            Refrescar
          </Button>
          <div className="flex items-center gap-1">
            <input type="checkbox" id="auto-refresh" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
            <Label htmlFor="auto-refresh" className="cursor-pointer text-xs">Auto-refresh</Label>
          </div>
          <Badge variant={cajaAbierta ? "default" : "secondary"} className={cajaAbierta ? "bg-emerald-600" : "bg-red-600 text-white"}>
            {cajaAbierta ? "Caja Abierta" : "Caja Cerrada"}
          </Badge>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-3 rounded-md">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efectivo en caja</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {resumen ? resumen.efectivo.toFixed(2) : "--"}</div>
            <p className="text-xs text-muted-foreground">Efectivo disponible</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yape</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {resumen ? resumen.totalYape.toFixed(2) : "--"}</div>
            <p className="text-xs text-muted-foreground">Pagos Yape</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del día</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">S/ {resumen ? resumen.ingresos.toFixed(2) : "--"}</div>
            <p className="text-xs text-muted-foreground">Total de ingresos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Egresos del día</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">S/ {resumen ? resumen.egresos.toFixed(2) : "--"}</div>
            <p className="text-xs text-muted-foreground">Total de egresos</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="estado" className="space-y-4">
        <TabsList>
          <TabsTrigger value="estado">Estado de Caja</TabsTrigger>
          <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
          <TabsTrigger value="resumen">Resumen Diario</TabsTrigger>
        </TabsList>

        <TabsContent value="estado" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Apertura de Caja</CardTitle>
                <CardDescription>Registra el efectivo inicial para abrir la caja</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="efectivo-inicial">Efectivo inicial</Label>
                  <Input
                    id="efectivo-inicial"
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder=""
                    value={efectivoInicial}
                    onChange={(e) => setEfectivoInicial(e.target.value)}
                    disabled={cajaAbierta || loading}
                  />
                </div>
                <Button onClick={abrirCaja} disabled={cajaAbierta || loading} className="w-full">
                  {cajaAbierta ? "Caja ya está abierta" : loading ? "Abriendo..." : "Abrir Caja"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cierre de Caja</CardTitle>
                <CardDescription>Cierra la caja y genera el resumen del día</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Efectivo inicial:</span>
                    <span>S/ {resumen ? resumen.efectivoInicial.toFixed(2) : "--"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ingresos manuales:</span>
                    <span>+S/ {resumen ? resumen.ingresos.toFixed(2) : "--"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ventas en efectivo:</span>
                    <span>+S/ {resumen ? resumen.ventasEfectivo.toFixed(2) : "--"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Egresos:</span>
                    <span className="text-red-600">-S/ {resumen ? resumen.egresos.toFixed(2) : "--"}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Efectivo esperado:</span>
                    <span>S/ {calcularEfectivoEsperado()}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="efectivo-final-declarado">Efectivo contado (para cierre)</Label>
                  <Input
                    id="efectivo-final-declarado"
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="0.00"
                    value={efectivoFinalDeclarado}
                    onChange={(e) => setEfectivoFinalDeclarado(e.target.value)}
                    disabled={!cajaAbierta || loading}
                  />
                </div>
                <Button
                  onClick={handleCerrarCaja}
                  disabled={!cajaAbierta || loading}
                  variant="destructive"
                  className="w-full"
                >
                  {!cajaAbierta ? "Caja ya está cerrada" : loading ? "Cerrando..." : "Cerrar Caja"}
                </Button>
                <DiferenciaCierreCard diferencia={resumen?.diferencia} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="movimientos" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <CardTitle>Movimientos de Efectivo</CardTitle>
                  <CardDescription>Registra ingresos y egresos de efectivo</CardDescription>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-2">
                  <Input
                    type="text"
                    placeholder="Buscar por usuario/descripción..."
                    className="w-48"
                    value={movimientoSearch}
                    onChange={e => setMovimientoSearch(e.target.value)}
                  />
                  <Select
                    value={movimientoFiltroTipo || "todos"}
                    onValueChange={v => setMovimientoFiltroTipo(v === "todos" ? "" : v)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="ingreso">Ingreso</SelectItem>
                      <SelectItem value="egreso">Egreso</SelectItem>
                    </SelectContent>
                  </Select>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Movimiento
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nuevo Movimiento</DialogTitle>
                        <DialogDescription>Registra un nuevo movimiento de efectivo</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="tipo-movimiento">Tipo de movimiento</Label>
                          <Select
                            value={nuevoMovimiento.tipo}
                            onValueChange={(value) => setNuevoMovimiento({ ...nuevoMovimiento, tipo: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona el tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="INGRESO">Ingreso</SelectItem>
                              <SelectItem value="EGRESO">Egreso</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="monto-movimiento">Monto</Label>
                          <Input
                            id="monto-movimiento"
                            type="number"
                            step="0.01"
                            min={0.01}
                            placeholder="0.00"
                            value={nuevoMovimiento.monto}
                            onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, monto: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="descripcion-movimiento">Descripción</Label>
                          <Textarea
                            id="descripcion-movimiento"
                            placeholder="Describe el motivo del movimiento"
                            value={nuevoMovimiento.descripcion}
                            onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, descripcion: e.target.value })}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleAgregarMovimiento}>Registrar Movimiento</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-[740px]">
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Fecha/Hora</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Usuario</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimientosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No hay movimientos registrados.
                        </TableCell>
                      </TableRow>
                    ) : movimientosFiltrados.map((mov) => (
                      <TableRow key={mov.id}>
                        <TableCell>{mov.fecha}</TableCell>
                        <TableCell>
                          <Badge className={mov.tipo === "ingreso" ? "bg-emerald-500" : "bg-red-500"}>
                            {mov.tipo === "ingreso" ? (
                              <ArrowUpIcon className="mr-1 h-3 w-3" />
                            ) : (
                              <ArrowDownIcon className="mr-1 h-3 w-3" />
                            )}
                            {mov.tipo.charAt(0).toUpperCase() + mov.tipo.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{mov.descripcion}</TableCell>
                        <TableCell>S/ {mov.monto.toFixed(2)}</TableCell>
                        <TableCell>
                          {typeof mov.usuario === "string"
                            ? mov.usuario
                            : (mov.usuario as { nombreCompleto?: string })?.nombreCompleto || ""}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historial de aperturas/cierres */}
        <TabsContent value="historial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Cajas</CardTitle>
              <CardDescription>Últimas aperturas y cierres de caja</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-[950px]">
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Fecha Apertura</TableHead>
                      <TableHead>Fecha Cierre</TableHead>
                      <TableHead>Responsable</TableHead>
                      <TableHead>Efectivo Inicial</TableHead>
                      <TableHead>Efectivo Final</TableHead>
                      <TableHead>Diferencia</TableHead>
                      <TableHead>Yape</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {historial.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        Sin aperturas/cierres registrados.
                      </TableCell>
                    </TableRow>
                  ) : historial.map((caja, idx) => (
                    <TableRow key={caja.id ?? idx}>
                      <TableCell>{new Date(caja.fechaApertura).toLocaleString()}</TableCell>
                      <TableCell>
                        {caja.fechaCierre
                          ? new Date(caja.fechaCierre).toLocaleString()
                          : <span className="text-yellow-600">Abierta</span>}
                      </TableCell>
                      <TableCell>{caja.usuarioResponsable}</TableCell>
                      <TableCell>S/ {Number(caja.efectivoInicial).toFixed(2)}</TableCell>
                      <TableCell>
                        {caja.efectivoFinal !== null
                          ? `S/ ${Number(caja.efectivoFinal).toFixed(2)}`
                          : "--"}
                      </TableCell>
                      <TableCell className={caja.diferencia && caja.diferencia < 0 ? "text-red-600" : caja.diferencia && caja.diferencia > 0 ? "text-emerald-600" : ""}>
                        {caja.diferencia !== null ? `S/ ${caja.diferencia.toFixed(2)}` : "--"}
                      </TableCell>
                      <TableCell>
                        S/ {caja.totalYape != null ? caja.totalYape.toFixed(2) : "--"}
                      </TableCell>
                      <TableCell>
                        {caja.fechaCierre
                          ? <Badge className="bg-red-600 text-white">Cerrada</Badge>
                          : <Badge className="bg-emerald-600">Abierta</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resumen" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumen Diario de Caja</CardTitle>
              <CardDescription>Resumen completo de las operaciones del día</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="font-semibold">Movimientos de Efectivo</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Efectivo inicial:</span>
                      <span>S/ {resumen ? resumen.efectivoInicial.toFixed(2) : "--"}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>Total ingresos manuales:</span>
                      <span>+S/ {resumen ? resumen.ingresos.toFixed(2) : "--"}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>Ventas en efectivo:</span>
                      <span>+S/ {resumen ? resumen.ventasEfectivo.toFixed(2) : "--"}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Total egresos:</span>
                      <span>-S/ {resumen ? resumen.egresos.toFixed(2) : "--"}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-bold">
                        <span>Efectivo final esperado:</span>
                        <span>S/ {calcularEfectivoEsperado()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Ventas por Método de Pago</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Efectivo:</span>
                      <span>S/ {resumen ? resumen.ventasEfectivo.toFixed(2) : "--"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Yape:</span>
                      <span>S/ {resumen ? resumen.totalYape.toFixed(2) : "--"}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-bold">
                        <span>Total ventas:</span>
                        <span>S/ {resumen ? resumen.totalVentas.toFixed(2) : "--"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Confirm dialogs */}
      <Dialog open={confirmCerrar} onOpenChange={setConfirmCerrar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Cerrar caja?</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de cerrar la caja? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmCerrar(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmarCerrarCaja}>Sí, cerrar caja</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={confirmMovimiento} onOpenChange={setConfirmMovimiento}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar movimiento grande</DialogTitle>
            <DialogDescription>
              El monto de este movimiento es elevado. ¿Deseas continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmMovimiento(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmarAgregarMovimiento}>Sí, registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}