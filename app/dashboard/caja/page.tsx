"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Calculator,
  DollarSign,
  Plus,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  RefreshCcw,
  Eye
} from "lucide-react"

type Usuario = {
  id?: number
  nombreCompleto: string
  dni: string
  rol?: string
}

type Movimiento = {
  id: number
  fecha: string
  tipo: string
  descripcion: string
  monto: number
  usuario: string
}

type CajaResumen = {
  id?: number
  idCaja?: number      // por si el backend usa otra propiedad
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

type HistorialCaja = {
  id: number
  fechaApertura: string
  fechaCierre: string | null
  efectivoInicial: number
  efectivoFinal: number | null
  diferencia: number | null
  totalYape: number
  usuarioResponsable: string
  _key?: string
}

type UltimaCajaCerrada = {
  id: number
  fechaApertura: string
  fechaCierre: string
  movimientos: Movimiento[]
}

async function fetchWithToken(url: string, options: RequestInit = {}): Promise<any> {
  const token = localStorage.getItem("token")
  const headers: HeadersInit = {
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  }
  const res = await fetch(url, { ...options, headers, credentials: "include" })
  if (res.status === 204) return null
  const contentType = res.headers.get("content-type")
  if (contentType && contentType.includes("application/json")) return await res.json()
  const text = await res.text()
  if (text) return text
  return null
}

// Cache localStorage de movimientos por caja
function storeMovimientosCaja(cajaId: number, movimientos: Movimiento[]) {
  try {
    localStorage.setItem(`caja_movs_${cajaId}`, JSON.stringify({ movimientos, ts: Date.now() }))
  } catch {}
}
function loadMovimientosCajaCache(cajaId: number): Movimiento[] | null {
  try {
    const raw = localStorage.getItem(`caja_movs_${cajaId}`)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed.movimientos)) return null
    return parsed.movimientos
  } catch {
    return null
  }
}

export default function CajaPage() {
  const { toast } = useToast()

  const [usuario, setUsuario] = useState<Usuario | null>(null)

  // Estados generales
  const [cajaAbierta, setCajaAbierta] = useState(false)
  const [resumen, setResumen] = useState<CajaResumen | null>(null)
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [efectivoInicial, setEfectivoInicial] = useState("")
  const [efectivoFinalDeclarado, setEfectivoFinalDeclarado] = useState("")
  const [nuevoMovimiento, setNuevoMovimiento] = useState({ tipo: "", monto: "", descripcion: "" })
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

  // NUEVOS estados para persistencia y consulta histórica
  const [ultimaCajaCerrada, setUltimaCajaCerrada] = useState<UltimaCajaCerrada | null>(null)
  const [dialogHistMovsOpen, setDialogHistMovsOpen] = useState(false)
  const [cajaSeleccionada, setCajaSeleccionada] = useState<HistorialCaja | null>(null)
  const [movimientosCajaSeleccionada, setMovimientosCajaSeleccionada] = useState<Movimiento[] | null>(null)
  const [loadingMovsCajaSeleccionada, setLoadingMovsCajaSeleccionada] = useState(false)

  // Paginación historial
  const [histPage, setHistPage] = useState(1)
  const [histPageSize, setHistPageSize] = useState(10)

  // Cargar usuario
  useEffect(() => {
    if (typeof window === "undefined") return
    const storedUsuario = localStorage.getItem("usuario")
    if (storedUsuario) {
      try {
        setUsuario(JSON.parse(storedUsuario) as Usuario)
      } catch {
        setUsuario(null)
      }
    }
  }, [])

  function parseDateSafe(d: string | null): number {
    if (!d) return 0
    const t = Date.parse(d)
    return isNaN(t) ? 0 : t
  }

  const historialOrdenado = useMemo(
    () =>
      [...historial].sort((a, b) => {
        const da = parseDateSafe(a.fechaApertura)
        const db = parseDateSafe(b.fechaApertura)
        return db - da
      }),
    [historial]
  )

  const totalHistorial = historialOrdenado.length
  const totalHistPages = Math.max(1, Math.ceil(totalHistorial / histPageSize))
  useEffect(() => {
    setHistPage(p => Math.min(p, totalHistPages))
  }, [histPageSize, totalHistPages])

  const historialPageItems = useMemo(
    () =>
      historialOrdenado.slice(
        (histPage - 1) * histPageSize,
        histPage * histPageSize
      ),
    [historialOrdenado, histPage, histPageSize]
  )

  // Cargar todo
  const refreshAll = async () => {
    if (!usuario) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchWithToken(apiUrl(`/api/cajas/actual?dniUsuario=${usuario.dni}`))
      if (data) {
        const idCaja = data.id ?? data.idCaja
        setResumen({
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
          usuarioResponsable: data.usuarioResponsable,
          id: idCaja,
          idCaja
        })
        setMovimientos(data.movimientos ?? [])
        setCajaAbierta(!data.fechaCierre)
        setEfectivoInicial((data.efectivoInicial ?? 0).toFixed(2))
        setEfectivoFinalDeclarado("")
      } else {
        // No hay caja actual (cerrada). Intentar rehidratar última cerrada desde localStorage si no la tenemos
        setResumen(null)
        setCajaAbierta(false)
        // NO limpiamos movimientos si tenemos snapshot de la última
        if (ultimaCajaCerrada) {
          setMovimientos(ultimaCajaCerrada.movimientos)
        } else {
          setMovimientos([])
        }
      }

      const hist = await fetchWithToken(apiUrl("/api/cajas/historial"))
      const histConKey: HistorialCaja[] = (Array.isArray(hist) ? hist : []).map(h => ({
        ...h,
        _key:
          h.id != null
            ? `caja-${h.id}`
            : `caja-${h.fechaApertura}-${h.fechaCierre ?? "abierta"}-${h.usuarioResponsable}`,
      }))
      setHistorial(histConKey)

      const cajasAbiertas = await fetchWithToken(apiUrl("/api/cajas/abiertas"))
      setAlertaCajaAbierta(Array.isArray(cajasAbiertas) && cajasAbiertas.length > 0)
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

  useEffect(() => { refreshAll() }, [usuario])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => { refreshAll() }, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, usuario, ultimaCajaCerrada])

  // Rehidratación de última caja cerrada (si se guardó antes)
  useEffect(() => {
    if (cajaAbierta) return
    if (ultimaCajaCerrada) return
    try {
      const raw = localStorage.getItem("ultima_caja_cerrada")
      if (raw) {
        const parsed: UltimaCajaCerrada = JSON.parse(raw)
        if (parsed && parsed.id && Array.isArray(parsed.movimientos)) {
          setUltimaCajaCerrada(parsed)
          // Solo si no hay movimientos cargados
          if (movimientos.length === 0) setMovimientos(parsed.movimientos)
        }
      }
    } catch {}
  }, [cajaAbierta, movimientos.length, ultimaCajaCerrada])

  // Cierre de caja
  const handleCerrarCaja = () => setConfirmCerrar(true)
  const confirmarCerrarCaja = async () => {
    setConfirmCerrar(false)
    await cerrarCaja()
  }

  // Confirmación de movimiento alto
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

  const abrirCaja = async () => {
    if (!isValidEfectivo(efectivoInicial)) {
      toast({ title: "Error", description: "Ingresa un monto válido y no negativo para abrir la caja", variant: "destructive" })
      return
    }
    if (!usuario?.dni) {
      toast({ title: "Error", description: "No se encontró el usuario en sesión", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      await fetchWithToken(apiUrl("/api/cajas/abrir"), {
        method: "POST",
        body: JSON.stringify({ dniUsuario: usuario.dni, efectivoInicial: Number.parseFloat(efectivoInicial) }),
      })
      await refreshAll()
      toast({ title: "Caja abierta", description: `Caja abierta con S/ ${efectivoInicial}` })
    } catch {
      toast({ title: "Error al abrir caja", description: "Error inesperado en la petición", variant: "destructive" })
    } finally { setLoading(false) }
  }

  const cerrarCaja = async () => {
    if (!usuario?.dni) {
      toast({ title: "Error", description: "No se encontró el usuario en sesión", variant: "destructive" })
      return
    }
    if (!isValidEfectivo(efectivoFinalDeclarado)) {
      toast({ title: "Error", description: "Debes ingresar el efectivo contado (valor no negativo)", variant: "destructive" })
      return
    }

    // Snapshot ANTES de cerrar (para conservar movimientos de la caja que se cerrará)
    const idCajaActual = resumen?.id ?? resumen?.idCaja
    if (idCajaActual && movimientos.length > 0 && resumen?.fechaApertura) {
      // Guardar snapshot provisional (fechaCierre vendrá luego, la completaremos tras refrescar)
      setUltimaCajaCerrada(prev => prev ?? {
        id: idCajaActual,
        fechaApertura: resumen.fechaApertura!,
        fechaCierre: new Date().toISOString(), // temporal
        movimientos: [...movimientos]
      })
    }

    setLoading(true)
    try {
      await fetchWithToken(apiUrl("/api/cajas/cerrar"), {
        method: "POST",
        body: JSON.stringify({
          dniUsuario: usuario.dni,
          efectivoFinalDeclarado: Number.parseFloat(efectivoFinalDeclarado)
        }),
      })
      toast({ title: "Caja cerrada", description: "La caja ha sido cerrada correctamente" })
      await refreshAll()
      // Completar snapshot (si la caja ya tiene fechaCierre en historial)
      if (idCajaActual) {
        const histItem = historial.find(h => h.id === idCajaActual)
        if (histItem) {
          setUltimaCajaCerrada({
            id: idCajaActual,
            fechaApertura: histItem.fechaApertura,
            fechaCierre: histItem.fechaCierre || new Date().toISOString(),
            movimientos: [...movimientos],
          })
          // Persistir local
          storeMovimientosCaja(idCajaActual, movimientos)
          localStorage.setItem("ultima_caja_cerrada", JSON.stringify({
            id: idCajaActual,
            fechaApertura: histItem.fechaApertura,
            fechaCierre: histItem.fechaCierre || new Date().toISOString(),
            movimientos: [...movimientos],
          }))
        }
      }
    } catch {
      toast({ title: "Error al cerrar caja", description: "Error inesperado en la petición", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const agregarMovimiento = async (movParam?: { tipo: string; monto: string; descripcion: string }) => {
    const mov = movParam || nuevoMovimiento
    if (!mov.tipo || !mov.monto || !mov.descripcion) {
      toast({ title: "Error", description: "Completa todos los campos del movimiento", variant: "destructive" }); return;
    }
    if (!isValidMonto(mov.monto)) {
      toast({ title: "Error", description: "El monto debe ser mayor a 0", variant: "destructive" }); return;
    }
    if (!usuario?.dni) {
      toast({ title: "Error", description: "No se encontró el usuario en sesión", variant: "destructive" }); return;
    }
    setLoading(true)
    try {
      await fetchWithToken(apiUrl("/api/cajas/movimiento"), {
        method: "POST",
        body: JSON.stringify({ ...mov, monto: Number.parseFloat(mov.monto), dniUsuario: usuario.dni }),
      })
      await refreshAll()
      setNuevoMovimiento({ tipo: "", monto: "", descripcion: "" })
      toast({ title: "Movimiento agregado", description: "Registrado correctamente" })
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Error inesperado", variant: "destructive" })
    } finally { setLoading(false) }
  }

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
                  ? `Faltan S/ ${Math.abs(diferencia).toFixed(2)} respecto al esperado.`
                  : `Sobran S/ ${Math.abs(diferencia).toFixed(2)} respecto al esperado.`}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    )
  }

  const calcularEfectivoEsperado = () => {
    if (!resumen) return "--"
    return (
      resumen.efectivoInicial +
      resumen.ingresos +
      resumen.ventasEfectivo -
      resumen.egresos
    ).toFixed(2)
  }

  const movimientosFiltrados = movimientos.filter(mov =>
    (!movimientoSearch ||
      mov.descripcion.toLowerCase().includes(movimientoSearch.toLowerCase()) ||
      mov.usuario.toLowerCase().includes(movimientoSearch.toLowerCase())) &&
    (movimientoFiltroTipo === "" ||
      movimientoFiltroTipo === "todos" ||
      mov.tipo.toLowerCase() === movimientoFiltroTipo.toLowerCase())
  )

  // Cargar movimientos de una caja histórica seleccionada
  const cargarMovimientosCajaHist = async (caja: HistorialCaja) => {
    setCajaSeleccionada(caja)
    setDialogHistMovsOpen(true)
    setLoadingMovsCajaSeleccionada(true)
    const cache = loadMovimientosCajaCache(caja.id)
    if (cache) {
      setMovimientosCajaSeleccionada(cache)
      setLoadingMovsCajaSeleccionada(false)
      return
    }
    try {
      // Endpoint recomendado: /api/cajas/{id}/movimientos
      const movs = await fetchWithToken(apiUrl(`/api/cajas/${caja.id}/movimientos`))
      if (Array.isArray(movs)) {
        setMovimientosCajaSeleccionada(movs)
        storeMovimientosCaja(caja.id, movs)
      } else {
        setMovimientosCajaSeleccionada([])
      }
    } catch (e: any) {
      setMovimientosCajaSeleccionada([])
      toast({
        title: "No se pudieron cargar los movimientos",
        description: e?.message || "Verifica que exista el endpoint /api/cajas/{id}/movimientos",
        variant: "destructive",
      })
    } finally {
      setLoadingMovsCajaSeleccionada(false)
    }
  }

  const etiquetaOrigenMovimientos = (() => {
    if (cajaAbierta) return "Caja actual (abierta)"
    if (!cajaAbierta && movimientos.length > 0 && ultimaCajaCerrada) {
      return `Caja cerrada (${new Date(ultimaCajaCerrada.fechaCierre).toLocaleString()})`
    }
    return "Sin caja activa"
  })()

  return (
    <div className="flex flex-col gap-5">
      {/* Alerta global */}
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
              <span>¡Atención! Hay caja(s) abiertas pendientes de cierre.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Caja</h1>
          <p className="text-muted-foreground">
            Administra la apertura, cierre y movimientos de caja
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={refreshAll}
            disabled={loading}
            title="Refrescar datos"
          >
            <RefreshCcw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              style={{ animationPlayState: loading ? "running" : "paused" }}
            />
            Refrescar
          </Button>
          <div className="flex items-center gap-1">
            <input
              type="checkbox"
              id="auto-refresh"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
            />
            <Label htmlFor="auto-refresh" className="cursor-pointer text-xs">
              Auto-refresh
            </Label>
          </div>
          <Badge
            variant={cajaAbierta ? "default" : "secondary"}
            className={cajaAbierta ? "bg-emerald-600" : "bg-red-600 text-white"}
          >
            {cajaAbierta ? "Caja Abierta" : "Caja Cerrada"}
          </Badge>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-3 rounded-md">
          {error}
        </div>
      )}

      {/* Cards resumen */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Efectivo en caja</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              S/ {resumen ? resumen.efectivo.toFixed(2) : "--"}
            </div>
            <p className="text-xs text-muted-foreground">Efectivo disponible</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Yape</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              S/ {resumen ? resumen.totalYape.toFixed(2) : "--"}
            </div>
            <p className="text-xs text-muted-foreground">Pagos Yape</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del día</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              S/ {resumen ? resumen.ingresos.toFixed(2) : "--"}
            </div>
            <p className="text-xs text-muted-foreground">Total de ingresos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Egresos del día</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              S/ {resumen ? resumen.egresos.toFixed(2) : "--"}
            </div>
            <p className="text-xs text-muted-foreground">Total de egresos</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="movimientos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="estado">Estado de Caja</TabsTrigger>
          <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
          <TabsTrigger value="resumen">Resumen Diario</TabsTrigger>
        </TabsList>

        {/* Estado */}
        <TabsContent value="estado" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Apertura de Caja</CardTitle>
                <CardDescription>Registra el efectivo inicial</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Efectivo inicial</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={efectivoInicial}
                    onChange={e => setEfectivoInicial(e.target.value)}
                    disabled={cajaAbierta || loading}
                  />
                </div>
                <Button onClick={abrirCaja} disabled={cajaAbierta || loading} className="w-full">
                  {cajaAbierta ? "Caja ya abierta" : loading ? "Abriendo..." : "Abrir Caja"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cierre de Caja</CardTitle>
                <CardDescription>Finaliza la caja actual</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Ef. inicial:</span>
                    <span>S/ {resumen ? resumen.efectivoInicial.toFixed(2) : "--"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ingresos man.:</span>
                    <span>+S/ {resumen ? resumen.ingresos.toFixed(2) : "--"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ventas efec.:</span>
                    <span>+S/ {resumen ? resumen.ventasEfectivo.toFixed(2) : "--"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Egresos:</span>
                    <span className="text-red-600">-S/ {resumen ? resumen.egresos.toFixed(2) : "--"}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Ef. esperado:</span>
                    <span>S/ {calcularEfectivoEsperado()}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Efectivo contado</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={efectivoFinalDeclarado}
                    onChange={e => setEfectivoFinalDeclarado(e.target.value)}
                    disabled={!cajaAbierta || loading}
                  />
                </div>
                <Button
                  variant="destructive"
                  disabled={!cajaAbierta || loading}
                  onClick={handleCerrarCaja}
                  className="w-full"
                >
                  {!cajaAbierta ? "Caja cerrada" : loading ? "Cerrando..." : "Cerrar Caja"}
                </Button>
                <DiferenciaCierreCard diferencia={resumen?.diferencia} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Movimientos */}
        <TabsContent value="movimientos" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <CardTitle>Movimientos de Efectivo</CardTitle>
                  <CardDescription>
                    {etiquetaOrigenMovimientos}
                  </CardDescription>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-2">
                  <Input
                    type="text"
                    placeholder="Buscar usuario / descripción..."
                    className="w-52"
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
                      <Button disabled={!cajaAbierta}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Movimiento
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nuevo Movimiento</DialogTitle>
                        <DialogDescription>Registra un nuevo movimiento</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Tipo</Label>
                          <Select
                            value={nuevoMovimiento.tipo}
                            onValueChange={value => setNuevoMovimiento({ ...nuevoMovimiento, tipo: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="INGRESO">Ingreso</SelectItem>
                              <SelectItem value="EGRESO">Egreso</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Monto</Label>
                          <Input
                            type="number"
                            min={0.01}
                            step="0.01"
                            value={nuevoMovimiento.monto}
                            onChange={e => setNuevoMovimiento({ ...nuevoMovimiento, monto: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Descripción</Label>
                          <Textarea
                            value={nuevoMovimiento.descripcion}
                            onChange={e => setNuevoMovimiento({ ...nuevoMovimiento, descripcion: e.target.value })}
                            placeholder="Motivo"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleAgregarMovimiento}>Registrar</Button>
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
                    ) : movimientosFiltrados.map(mov => (
                      <TableRow key={mov.id}>
                        <TableCell>{mov.fecha}</TableCell>
                        <TableCell>
                          <Badge className={mov.tipo.toLowerCase() === "ingreso" ? "bg-emerald-500" : "bg-red-500"}>
                            {mov.tipo.toLowerCase() === "ingreso" ? (
                              <ArrowUpIcon className="mr-1 h-3 w-3" />
                            ) : (
                              <ArrowDownIcon className="mr-1 h-3 w-3" />
                            )}
                            {mov.tipo.charAt(0).toUpperCase() + mov.tipo.slice(1).toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{mov.descripcion}</TableCell>
                        <TableCell>S/ {mov.monto.toFixed(2)}</TableCell>
                        <TableCell>
                          {typeof mov.usuario === "string"
                            ? mov.usuario
                            : (mov.usuario as any)?.nombreCompleto || ""}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historial */}
        <TabsContent value="historial" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <CardTitle>Historial de Cajas</CardTitle>
                  <CardDescription>Ver aperturas y cierres (más recientes primero)</CardDescription>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Tamaño</Label>
                    <Select
                      value={String(histPageSize)}
                      onValueChange={v => {
                        setHistPageSize(Number(v))
                        setHistPage(1)
                      }}
                    >
                      <SelectTrigger className="h-8 w-[90px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 10, 25, 50].map(n => (
                          <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Mostrando{" "}
                    {totalHistorial === 0
                      ? "0"
                      : `${(histPage - 1) * histPageSize + 1}–${Math.min(histPage * histPageSize, totalHistorial)}`}{" "}
                    de {totalHistorial}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-[1050px]">
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
                      <TableHead>Movs</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historialPageItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground">
                          Sin registros
                        </TableCell>
                      </TableRow>
                    ) : historialPageItems.map(caja => (
                      <TableRow key={caja._key}>
                        <TableCell>{new Date(caja.fechaApertura).toLocaleString()}</TableCell>
                        <TableCell>
                          {caja.fechaCierre
                            ? new Date(caja.fechaCierre).toLocaleString()
                            : <span className="text-yellow-600">Abierta</span>}
                        </TableCell>
                        <TableCell>{caja.usuarioResponsable}</TableCell>
                        <TableCell>S/ {caja.efectivoInicial.toFixed(2)}</TableCell>
                        <TableCell>
                          {caja.efectivoFinal != null ? `S/ ${caja.efectivoFinal.toFixed(2)}` : "--"}
                        </TableCell>
                        <TableCell className={
                          caja.diferencia && caja.diferencia < 0
                            ? "text-red-600"
                            : caja.diferencia && caja.diferencia > 0
                              ? "text-emerald-600"
                              : ""
                        }>
                          {caja.diferencia != null ? `S/ ${caja.diferencia.toFixed(2)}` : "--"}
                        </TableCell>
                        <TableCell>
                          S/ {caja.totalYape != null ? caja.totalYape.toFixed(2) : "--"}
                        </TableCell>
                        <TableCell>
                          {caja.fechaCierre
                            ? <Badge className="bg-red-600 text-white">Cerrada</Badge>
                            : <Badge className="bg-emerald-600">Abierta</Badge>}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cargarMovimientosCajaHist(caja)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                <div className="text-xs text-muted-foreground">
                  Página {histPage} de {totalHistPages}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={histPage === 1}
                    onClick={() => setHistPage(1)}
                  >
                    « Primero
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={histPage === 1}
                    onClick={() => setHistPage(p => Math.max(1, p - 1))}
                  >
                    Anterior
                  </Button>
                  <div className="flex items-center gap-1">
                    <Input
                      className="w-16 h-8"
                      type="number"
                      min={1}
                      max={totalHistPages}
                      value={histPage}
                      onChange={e => {
                        const val = Number(e.target.value)
                        if (!Number.isNaN(val)) {
                          setHistPage(Math.min(Math.max(1, val), totalHistPages))
                        }
                      }}
                    />
                    <span className="text-xs text-muted-foreground">/ {totalHistPages}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={histPage === totalHistPages}
                    onClick={() => setHistPage(p => Math.min(totalHistPages, p + 1))}
                  >
                    Siguiente
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={histPage === totalHistPages}
                    onClick={() => setHistPage(totalHistPages)}
                  >
                    Último »
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resumen diario */}
        <TabsContent value="resumen" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumen Diario de Caja</CardTitle>
              <CardDescription>Operaciones del día</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="font-semibold">Movimientos de Efectivo</h3>
                  <div className="space-y-2 text-sm">
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
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Ef. final esperado:</span>
                      <span>S/ {calcularEfectivoEsperado()}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">Ventas por Método</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Efectivo:</span>
                      <span>S/ {resumen ? resumen.ventasEfectivo.toFixed(2) : "--"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Yape:</span>
                      <span>S/ {resumen ? resumen.totalYape.toFixed(2) : "--"}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Total ventas:</span>
                      <span>S/ {resumen ? resumen.totalVentas.toFixed(2) : "--"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmar cierre */}
      <Dialog open={confirmCerrar} onOpenChange={setConfirmCerrar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Cerrar caja?</DialogTitle>
            <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmCerrar(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmarCerrarCaja}>Sí, cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar movimiento grande */}
      <Dialog open={confirmMovimiento} onOpenChange={setConfirmMovimiento}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar movimiento grande</DialogTitle>
            <DialogDescription>El monto es elevado. ¿Continuar?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmMovimiento(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmarAgregarMovimiento}>Sí, registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog movimientos de caja histórica */}
      <Dialog open={dialogHistMovsOpen} onOpenChange={o => { setDialogHistMovsOpen(o); if (!o) { setCajaSeleccionada(null); setMovimientosCajaSeleccionada(null) } }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Movimientos de Caja #{cajaSeleccionada?.id}
            </DialogTitle>
            <DialogDescription>
              {cajaSeleccionada
                ? `Apertura: ${new Date(cajaSeleccionada.fechaApertura).toLocaleString()} ${
                    cajaSeleccionada.fechaCierre ? " | Cierre: " + new Date(cajaSeleccionada.fechaCierre).toLocaleString() : ""
                  }`
                : "Selecciona una caja del historial"}
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-md max-h-[55vh] overflow-auto">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha/Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Usuario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingMovsCajaSeleccionada ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Cargando movimientos...
                    </TableCell>
                  </TableRow>
                ) : movimientosCajaSeleccionada == null ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Selecciona una caja.
                    </TableCell>
                  </TableRow>
                ) : movimientosCajaSeleccionada.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Sin movimientos registrados en esta caja.
                    </TableCell>
                  </TableRow>
                ) : (
                  movimientosCajaSeleccionada.map(m => (
                    <TableRow key={m.id}>
                      <TableCell>{m.fecha}</TableCell>
                      <TableCell>
                        <Badge className={m.tipo.toLowerCase() === "ingreso" ? "bg-emerald-500" : "bg-red-500"}>
                          {m.tipo.toLowerCase() === "ingreso" ? (
                            <ArrowUpIcon className="mr-1 h-3 w-3" />
                          ) : (
                            <ArrowDownIcon className="mr-1 h-3 w-3" />
                          )}
                          {m.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>{m.descripcion}</TableCell>
                      <TableCell>S/ {m.monto.toFixed(2)}</TableCell>
                      <TableCell>{m.usuario}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogHistMovsOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}