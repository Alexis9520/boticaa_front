"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Calendar,
  DollarSign,
  CreditCard,
  ShoppingBag,
  Users,
  Package,
  Sparkles,
  Timer,
  Activity,
  TrendingUp,
  TrendingDown,
  Leaf,
  RefreshCcw,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { fetchWithAuth } from "@/lib/api"
import { apiUrl } from "@/components/config"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import SalesChart from "@/components/sales-chart"
import Spinner from "@/components/ui/Spinner"

/* -------------------- Tipos -------------------- */
type VentasDia = { monto: number; variacion: number }
type VentasMes = { monto: number; variacion: number }
type SaldoCaja = { total: number; efectivo: number; yape: number }
type ClientesAtendidos = { cantidad: number; variacion: number }
type VentaReciente = { boleta: string; cliente: string; monto: number }
type ProductoMasVendido = { nombre: string; unidades: number; porcentaje: number }
type ProductoCritico = { nombre: string; stock: number }
type ProductoVencimiento = { nombre: string; dias: number }
type VentasPorHora = { hora: string; total: number }

/* -------------------- Dashboard Futurista -------------------- */
export default function Dashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [ventasDia, setVentasDia] = useState<VentasDia>({ monto: 0, variacion: 0 })
  const [ventasMes, setVentasMes] = useState<VentasMes>({ monto: 0, variacion: 0 })
  const [saldoCaja, setSaldoCaja] = useState<SaldoCaja>({ total: 0, efectivo: 0, yape: 0 })
  const [clientesAtendidos, setClientesAtendidos] = useState<ClientesAtendidos>({ cantidad: 0, variacion: 0 })
  const [ultimasVentas, setUltimasVentas] = useState<VentaReciente[]>([])
  const [productosMasVendidos, setProductosMasVendidos] = useState<ProductoMasVendido[]>([])
  const [productosCriticos, setProductosCriticos] = useState<ProductoCritico[]>([])
  const [productosVencimiento, setProductosVencimiento] = useState<ProductoVencimiento[]>([])
  const [ventasPorHora, setVentasPorHora] = useState<VentasPorHora[]>([])
  const [tab, setTab] = useState<"ventas" | "productos">("ventas")
  const [refreshing, setRefreshing] = useState(false)

  // Paginaciones nuevas
  const PAGE_SIZE_CRIT = 6
  const PAGE_SIZE_VENC = 5
  const [critPage, setCritPage] = useState(1)
  const [vencPage, setVencPage] = useState(1)

  // Ajustar página al cambiar datasets
  useEffect(() => { setCritPage(1) }, [productosCriticos])
  useEffect(() => { setVencPage(1) }, [productosVencimiento])

  const critTotalPages = Math.max(1, Math.ceil(productosCriticos.length / PAGE_SIZE_CRIT))
  const vencTotalPages = Math.max(1, Math.ceil(productosVencimiento.length / PAGE_SIZE_VENC))
  const criticosPageItems = useMemo(
    () => productosCriticos.slice((critPage - 1) * PAGE_SIZE_CRIT, critPage * PAGE_SIZE_CRIT),
    [productosCriticos, critPage]
  )
  const vencimientoPageItems = useMemo(
    () => productosVencimiento.slice((vencPage - 1) * PAGE_SIZE_VENC, vencPage * PAGE_SIZE_VENC),
    [productosVencimiento, vencPage]
  )

  // Redirección de rol
  useEffect(() => {
    if (!loading && user && user.rol === "trabajador") {
      router.replace("/dashboard/ventas")
    }
  }, [user, loading, router])

  // Carga principal
  const fetchResumen = () => {
    setRefreshing(true)
    fetchWithAuth(apiUrl("/api/dashboard/resumen"), {}, toast)
      .then((data) => {
        if (!data) return
        setVentasDia(data.ventasDia)
        setVentasMes(data.ventasMes)
        setSaldoCaja(data.saldoCaja)
        setClientesAtendidos(data.clientesAtendidos)
        setUltimasVentas(data.ultimasVentas)
        setProductosMasVendidos(data.productosMasVendidos)
        setProductosCriticos(data.productosCriticos)
        setProductosVencimiento(data.productosVencimiento)
      })
      .finally(() => setRefreshing(false))
  }
  useEffect(fetchResumen, [toast])

  // Carga ventas por hora
  useEffect(() => {
    fetchWithAuth(apiUrl("/api/dashboard/ventas-por-hora"), {}, toast)
      .then((data) => setVentasPorHora(data ?? []))
      .catch(() => setVentasPorHora([]))
  }, [toast])

  // Derivados
  const mediosCaja = useMemo(() => {
    const total = saldoCaja.total || 1
    const efectivoPct = (saldoCaja.efectivo / total) * 100
    const yapePct = (saldoCaja.yape / total) * 100
    return { efectivoPct, yapePct }
  }, [saldoCaja])

  if (loading || !user) return <Spinner />
  if (user.rol !== "administrador") return <Spinner warning="" />

  return (
    <div className="relative flex flex-col gap-6">
      <BackgroundFX />

      {/* Header */}
      <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-2">
            Dashboard 
            
          </h1>
          <p className="text-sm text-muted-foreground">
            Vista general en tiempo real del rendimiento de la botica
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Hoy
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchResumen}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </header>

      {/* KPIs */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 relative z-10">
        <MetricCard
          title="Ventas del día"
          icon={<ShoppingBag className="h-4 w-4" />}
          value={`S/ ${formatMoney(ventasDia.monto)}`}
          variation={ventasDia.variacion}
          subtitle="vs. ayer"
          accent="from-emerald-500/20 to-emerald-500/5"
        />
        <MetricCard
          title="Ventas del mes"
          icon={<DollarSign className="h-4 w-4" />}
          value={`S/ ${formatMoney(ventasMes.monto)}`}
          variation={ventasMes.variacion}
          subtitle="vs. mes anterior"
          accent="from-blue-500/20 to-blue-500/5"
        />
        <CajaCard saldo={saldoCaja} medios={mediosCaja} />
        <MetricCard
          title="Clientes atendidos"
          icon={<Users className="h-4 w-4" />}
          value={clientesAtendidos.cantidad.toString()}
          variation={clientesAtendidos.variacion}
          subtitle="vs. ayer"
          accent="from-purple-500/20 to-purple-500/5"
        />
      </section>

      {/* Tabs */}
      <Tabs
        defaultValue="ventas"
        value={tab}
        onValueChange={(v) => setTab(v as any)}
        className="space-y-6 relative z-10"
      >
        <TabsList className="w-full justify-start gap-2 bg-muted/40 backdrop-blur">
          <TabsTrigger
            value="ventas"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-primary/5"
          >
            Análisis de Ventas
          </TabsTrigger>
            <TabsTrigger
            value="productos"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-primary/5"
          >
            Productos
          </TabsTrigger>
        </TabsList>

        {/* Ventas */}
        <TabsContent value="ventas" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-7">
            {/* Gráfico */}
            <Card className="col-span-4 border-border/60 bg-gradient-to-br from-background/70 via-background/40 to-background/30 backdrop-blur-xl relative overflow-hidden group">
              <GlowLines />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Ritmo de Ventas (24h)
                </CardTitle>
                <CardDescription>Suma total por franja horaria</CardDescription>
              </CardHeader>
              <CardContent className="pl-1 relative z-10">
                {ventasPorHora.length === 0 ? (
                  <EmptyState
                    icon={<Timer className="h-6 w-6" />}
                    title="Sin datos"
                    description="Aún no hay ventas registradas en este rango."
                  />
                ) : (
                  <SalesChart data={ventasPorHora} />
                )}
              </CardContent>
            </Card>

            {/* Últimas ventas */}
            <Card className="col-span-3 bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-xl border-border/60 relative overflow-hidden">
              <DotsPattern />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Ventas recientes
                </CardTitle>
                <CardDescription>Últimas transacciones</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="rounded-md border bg-background/60 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Boleta</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ultimasVentas.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            No hay ventas
                          </TableCell>
                        </TableRow>
                      )}
                      {ultimasVentas.map((v, i) => (
                        <TableRow key={i} className="hover:bg-muted/40 transition">
                          <TableCell className="font-medium">{v.boleta}</TableCell>
                          <TableCell>{v.cliente || "-"}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            S/ {v.monto?.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Productos */}
        <TabsContent value="productos" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-7">
            {/* Más vendidos */}
            <Card className="col-span-4 bg-gradient-to-br from-background/80 via-background/50 to-background/30 backdrop-blur-xl border-border/60 relative overflow-hidden">
              <GlowLines />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Productos más vendidos
                </CardTitle>
                <CardDescription>Top por unidades vendidas</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                {productosMasVendidos.length === 0 && (
                  <EmptyState
                    icon={<Leaf className="h-6 w-6" />}
                    title="Sin registros"
                    description="No hay productos vendidos aún."
                  />
                )}
                <ul className="space-y-5">
                  {productosMasVendidos.map((p, i) => (
                    <li key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            {i + 1}
                          </span>
                          <span className="font-medium">{p.nombre}</span>
                        </div>
                        <span className="text-sm tabular-nums font-semibold">
                          {p.unidades} u
                        </span>
                      </div>
                      <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden relative">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-primary/60 animate-[pulse_6s_ease-in-out_infinite]"
                          style={{ width: `${Math.min(100, p.porcentaje)}%` }}
                        />
                        <span className="absolute inset-0 text-[10px] flex items-center justify-center text-primary/90 font-medium">
                          {p.porcentaje.toFixed(1)}%
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Column right */}
            <div className="col-span-3 grid gap-6">
              {/* Stock crítico + paginación */}
              <Card className="bg-gradient-to-br from-red-500/10 to-red-500/0 backdrop-blur-xl border-red-500/30 relative overflow-hidden">
                <CardHeader className="pb-2 relative z-10">
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    Stock Crítico
                  </CardTitle>
                  <CardDescription>Productos por debajo del mínimo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 relative z-10">
                  {productosCriticos.length === 0 && <EmptyMini message="Sin productos críticos" />}
                  {criticosPageItems.map((p, i) => (
                    <div
                      key={`${p.nombre}-${i}`}
                      className="flex items-center justify-between text-sm rounded-md border bg-background/40 px-3 py-2 backdrop-blur hover:bg-background/60 transition"
                    >
                      <span className="truncate pr-2">{p.nombre}</span>
                      <Badge variant="destructive" className="tabular-nums">{p.stock} u</Badge>
                    </div>
                  ))}
                  <PaginationMini
                    page={critPage}
                    totalPages={critTotalPages}
                    onChange={setCritPage}
                    totalItems={productosCriticos.length}
                    pageSize={PAGE_SIZE_CRIT}
                  />
                </CardContent>
                <CornerGradient color="red" />
              </Card>

              {/* Próximos a vencer + paginación */}
              <Card className="bg-gradient-to-br from-amber-500/15 to-amber-500/0 backdrop-blur-xl border-amber-500/30 relative overflow-hidden">
                <CardHeader className="pb-2 relative z-10">
                  <CardTitle className="flex items-center gap-2">
                    <Timer className="h-5 w-5 text-amber-500" />
                    Próximos a vencer
                  </CardTitle>
                  <CardDescription>Lotes en ventana de riesgo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 relative z-10">
                  {productosVencimiento.length === 0 && <EmptyMini message="Sin vencimientos cercanos" />}
                  {vencimientoPageItems.map((p, i) => {
                    const severity =
                      p.dias <= 0
                        ? "destructive"
                        : p.dias <= 7
                        ? "destructive"
                        : p.dias <= 15
                        ? "secondary"
                        : "outline"
                    return (
                      <Alert
                        key={`${p.nombre}-${i}`}
                        variant={severity as any}
                        className="py-2 px-3 flex items-start gap-2 rounded-lg bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/40"
                      >
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                        <div className="space-y-0.5">
                          <AlertTitle className="text-xs font-medium">
                            {p.nombre}
                          </AlertTitle>
                          <AlertDescription className="text-[11px]">
                            {p.dias <= 0
                              ? "Vencido"
                              : `Vence en ${p.dias} día${p.dias === 1 ? "" : "s"}`}
                          </AlertDescription>
                        </div>
                      </Alert>
                    )
                  })}
                  <PaginationMini
                    page={vencPage}
                    totalPages={vencTotalPages}
                    onChange={setVencPage}
                    totalItems={productosVencimiento.length}
                    pageSize={PAGE_SIZE_VENC}
                  />
                </CardContent>
                <CornerGradient color="amber" />
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* -------------------- Componentes Auxiliares -------------------- */
interface MetricCardProps {
  title: string
  value: string
  variation: number
  subtitle?: string
  icon: React.ReactNode
  accent?: string
}
function MetricCard({ title, value, variation, subtitle, icon, accent }: MetricCardProps) {
  const positive = variation >= 0
  return (
    <Card className={cnGlass(accent)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 relative z-10">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-1.5 rounded-md bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="relative z-10 space-y-3">
        <div className="text-2xl font-bold tracking-tight tabular-nums">{value}</div>
        <div className="flex items-center gap-2 text-xs">
          <span
            className={positive ? "text-emerald-500 flex items-center gap-1" : "text-red-500 flex items-center gap-1"}
          >
            {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {positive ? "+" : ""}
            {variation.toFixed(2)}%
          </span>
          {subtitle && <span className="text-muted-foreground">{subtitle}</span>}
        </div>
        <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
          <div
            className={positive ? "h-full bg-gradient-to-r from-emerald-500 to-emerald-400" : "h-full bg-gradient-to-r from-red-500 to-red-400"}
            style={{ width: `${Math.min(100, Math.abs(variation))}%` }}
          />
        </div>
      </CardContent>
      <CardAura />
    </Card>
  )
}

function CajaCard({ saldo, medios }: { saldo: SaldoCaja; medios: { efectivoPct: number; yapePct: number } }) {
  const efectivoPct = isFinite(medios.efectivoPct) ? medios.efectivoPct : 0
  const yapePct = isFinite(medios.yapePct) ? medios.yapePct : 0
  return (
    <Card className={cnGlass("from-cyan-500/20 to-cyan-500/5")}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 relative z-10">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Saldo en caja
        </CardTitle>
        <div className="p-1.5 rounded-md bg-gradient-to-br from-cyan-400/30 to-cyan-400/10 text-cyan-500">
          <CreditCard className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10 space-y-4">
        <div className="text-2xl font-bold tabular-nums">S/ {formatMoney(saldo.total)}</div>
        <div className="flex items-center gap-4">
          <div
            className="relative h-16 w-16 rounded-full"
            style={{
              background: `conic-gradient(var(--emerald) ${efectivoPct}%, var(--cyan) ${efectivoPct}% ${efectivoPct + yapePct}%, hsl(var(--muted)/0.4) ${efectivoPct + yapePct}%)`
            }}
          >
            <div className="absolute inset-1 rounded-full bg-background/80 backdrop-blur flex items-center justify-center">
              <span className="text-[10px] font-semibold">Caja</span>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-3 text-[11px]">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Efectivo</span>
              </div>
              <p className="font-medium tabular-nums">S/ {formatMoney(saldo.efectivo)}</p>
              <p className="text-muted-foreground">{efectivoPct.toFixed(1)}%</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-cyan-500" />
                <span className="text-muted-foreground">Yape / Plin</span>
              </div>
              <p className="font-medium tabular-nums">S/ {formatMoney(saldo.yape)}</p>
              <p className="text-muted-foreground">{yapePct.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardAura />
    </Card>
  )
}

function PaginationMini({
  page,
  totalPages,
  onChange,
  totalItems,
  pageSize
}: {
  page: number
  totalPages: number
  onChange: (p: number) => void
  totalItems: number
  pageSize: number
}) {
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)
  return (
    <div className="flex items-center justify-between pt-1 border-t mt-2">
      <span className="text-[11px] text-muted-foreground tabular-nums">
        {totalItems === 0 ? "0" : `${start}-${end}`} / {totalItems}
      </span>
      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          disabled={page === 1}
          onClick={() => onChange(Math.max(1, page - 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {page}/{totalPages}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          disabled={page === totalPages}
          onClick={() => onChange(Math.min(totalPages, page + 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function EmptyState({
  icon,
  title,
  description
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center gap-3 text-muted-foreground">
      <div className="p-4 rounded-full bg-muted/50">{icon}</div>
      <h4 className="text-sm font-medium">{title}</h4>
      <p className="text-xs max-w-[240px]">{description}</p>
    </div>
  )
}

function EmptyMini({ message }: { message: string }) {
  return <p className="text-xs text-muted-foreground italic">{message}</p>
}

/* -------------------- FX / Decoración -------------------- */
function BackgroundFX() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,hsl(var(--primary)/0.08),transparent_60%),radial-gradient(circle_at_80%_70%,hsl(var(--secondary)/0.08),transparent_55%)]" />
      <div className="absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-primary/15 to-transparent blur-3xl opacity-50 animate-pulse" />
      <div className="absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full bg-gradient-to-tr from-secondary/20 to-transparent blur-3xl opacity-40 animate-pulse" />
    </div>
  )
}

function CardAura() {
  return (
    <div className="pointer-events-none absolute inset-0 rounded-xl border border-white/5 [mask-image:linear-gradient(to_bottom,rgba(0,0,0,.4),rgba(0,0,0,.9))]">
      <div className="absolute -inset-px rounded-xl bg-gradient-to-br from-white/5 via-white/0 to-white/5 opacity-60" />
    </div>
  )
}

function GlowLines() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent animate-[pulse_5s_linear_infinite]" />
      <div className="absolute -left-10 top-0 h-[140%] w-[140%] animate-[spin_30s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,hsl(var(--primary)/0.10),transparent_55%)]" />
    </div>
  )
}

function DotsPattern() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--foreground)/0.07)_1px,transparent_0)] [background-size:18px_18px]" />
    </div>
  )
}

function CornerGradient({ color }: { color: "red" | "amber" }) {
  const map: Record<string, string> = {
    red: "from-red-500/30 to-transparent",
    amber: "from-amber-400/40 to-transparent"
  }
  return (
    <div
      className={`pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-gradient-to-tl ${map[color]} blur-2xl`}
    />
  )
}

/* -------------------- Utilidades -------------------- */
function formatMoney(v: number) {
  return v.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function cnGlass(accent?: string) {
  return [
    "relative overflow-hidden rounded-xl border border-border/50 bg-background/60 backdrop-blur-xl",
    "before:absolute before:inset-0 before:bg-gradient-to-br before:opacity-90",
    accent ? `before:${accent}` : "before:from-primary/15 before:to-primary/5",
    "hover:shadow-[0_0_0_1px_hsl(var(--primary)/0.25),0_4px_30px_-5px_hsl(var(--primary)/0.25)] transition-shadow"
  ].join(" ")
}