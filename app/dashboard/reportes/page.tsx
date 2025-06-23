"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/date-range-picker"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { RoleGuard } from "@/components/RoleGuard"
import { useToast } from "@/hooks/use-toast"

import type { DateRange } from "react-day-picker"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { useTheme } from "next-themes"
import { BarChart3, Download, FileText, TrendingUp } from "lucide-react"

type ProductoMasVendido = { producto: string; cantidad: number; ingresos: number }
type VentaPorUsuario = { usuario: string; ventas: number; total: number }
type VentaPorDia = { fecha: string; ventas: number; cantidad: number }
type VentaPorMetodo = { metodo: string; valor: number; color: string }
type VentaDetallada = {
  fecha: string
  boleta: string
  cliente: string
  usuario: string
  metodo_pago: string
  items: number
  total: number
}

export default function ReportesPage() {
  // Estados para los reportes
  const [tipoReporte, setTipoReporte] = useState("ventas")
  const [periodoReporte, setPeriodoReporte] = useState("semana")

  const [rangoPersonalizado, setRangoPersonalizado] = useState<DateRange | undefined>(undefined)
  const [ventasPorDia, setVentasPorDia] = useState<VentaPorDia[]>([])
  const [ventasPorMetodo, setVentasPorMetodo] = useState<VentaPorMetodo[]>([])
  const [productosMasVendidos, setProductosMasVendidos] = useState<ProductoMasVendido[]>([])
  const [ventasPorUsuario, setVentasPorUsuario] = useState<VentaPorUsuario[]>([])
  const [ventasResumen, setVentasResumen] = useState({
    totalVentas: 0,
    variacionVentas: 0,
    totalTransacciones: 0,
    variacionTransacciones: 0,
    ticketPromedio: 0,
    variacionTicket: 0,
    productosVendidos: 0,
    variacionProductos: 0,
  })
  const [ventasDetallado, setVentasDetallado] = useState<VentaDetallada[]>([])

  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Fetch de datos al cambiar tipo o periodo de reporte
  useEffect(() => {
    // Construir parámetros de fecha según periodoReporte
    let params: any = {}
    if (
      periodoReporte === "personalizado" &&
      rangoPersonalizado &&
      rangoPersonalizado.from &&
      rangoPersonalizado.to
    ) {
      params.from = rangoPersonalizado.from.toISOString().slice(0, 10)
      params.to = rangoPersonalizado.to.toISOString().slice(0, 10)
    } else {
      params.periodo = periodoReporte
    }

    // Reporte de ventas
    if (tipoReporte === "ventas") {
      fetch(`/api/reportes/ventas?${new URLSearchParams(params)}`)
        .then(res => res.json()).then(data => {
          setVentasPorDia(data.ventasPorDia)
          setVentasPorMetodo(data.ventasPorMetodo)
          setProductosMasVendidos(data.productosMasVendidos)
          setVentasPorUsuario(data.ventasPorUsuario)
          setVentasResumen(data.resumen)
          setVentasDetallado(data.detallado)
        })
    }
    // Otros tipos de reporte pueden tener su propio fetch
    // ...
  }, [tipoReporte, periodoReporte, rangoPersonalizado])

  // Exportar (puedes expandir esto para descargar el reporte desde el backend)
  const exportarReporte = (formato: string) => {
    // Podrías hacer: window.open(`/api/reportes/exportar?tipo=${tipoReporte}&periodo=${periodoReporte}&formato=${formato}`)
    fetch(`/api/reportes/exportar?tipo=${tipoReporte}&periodo=${periodoReporte}&formato=${formato}`, { method: "GET" })
      .then(async res => {
        if (res.ok) {
          const blob = await res.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `reporte_${tipoReporte}_${periodoReporte}.${formato === "pdf" ? "pdf" : "xlsx"}`
          document.body.appendChild(a)
          a.click()
          a.remove()
        }
      })
  }

  return (
    <RoleGuard allowedRoles={["administrador"]}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
            <p className="text-muted-foreground">Analiza el rendimiento del negocio con reportes detallados</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => exportarReporte("pdf")}>
              <FileText className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
            <Button variant="outline" onClick={() => exportarReporte("excel")}>
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={tipoReporte} onValueChange={setTipoReporte}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Tipo de reporte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ventas">Reporte de Ventas</SelectItem>
              <SelectItem value="productos">Reporte de Productos</SelectItem>
              <SelectItem value="usuarios">Reporte de Usuarios</SelectItem>
              <SelectItem value="inventario">Reporte de Inventario</SelectItem>
            </SelectContent>
          </Select>

          <Select value={periodoReporte} onValueChange={setPeriodoReporte}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hoy">Hoy</SelectItem>
              <SelectItem value="semana">Esta semana</SelectItem>
              <SelectItem value="mes">Este mes</SelectItem>
              <SelectItem value="trimestre">Este trimestre</SelectItem>
              <SelectItem value="año">Este año</SelectItem>
              <SelectItem value="personalizado">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {periodoReporte === "personalizado" && (
            <DateRangePicker
              value={rangoPersonalizado}
              onChange={setRangoPersonalizado}
              // Asegúrate que DateRangePicker entregue { from, to }
            />
          )}
        </div>

        <Tabs defaultValue="resumen" className="space-y-4">
          <TabsList>
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="graficos">Gráficos</TabsTrigger>
            <TabsTrigger value="detallado">Detallado</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ventas totales</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">S/ {ventasResumen.totalVentas.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</div>
                  <p className="text-xs text-muted-foreground">{ventasResumen.variacionVentas >= 0 ? "+" : ""}{ventasResumen.variacionVentas}% vs período anterior</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Transacciones</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{ventasResumen.totalTransacciones}</div>
                  <p className="text-xs text-muted-foreground">{ventasResumen.variacionTransacciones >= 0 ? "+" : ""}{ventasResumen.variacionTransacciones}% vs período anterior</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ticket promedio</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">S/ {ventasResumen.ticketPromedio.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</div>
                  <p className="text-xs text-muted-foreground">{ventasResumen.variacionTicket >= 0 ? "+" : ""}{ventasResumen.variacionTicket}% vs período anterior</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Productos vendidos</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{ventasResumen.productosVendidos}</div>
                  <p className="text-xs text-muted-foreground">{ventasResumen.variacionProductos >= 0 ? "+" : ""}{ventasResumen.variacionProductos}% vs período anterior</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Productos más vendidos</CardTitle>
                  <CardDescription>Top 5 productos por cantidad vendida</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Ingresos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productosMasVendidos.map((producto, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{producto.producto}</TableCell>
                          <TableCell>{producto.cantidad}</TableCell>
                          <TableCell>S/ {producto.ingresos.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rendimiento por usuario</CardTitle>
                  <CardDescription>Ventas realizadas por cada usuario</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Ventas</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ventasPorUsuario.map((usuario, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{usuario.usuario}</TableCell>
                          <TableCell>{usuario.ventas}</TableCell>
                          <TableCell>S/ {usuario.total.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="graficos" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Ventas por día</CardTitle>
                  <CardDescription>Evolución de ventas en el período seleccionado</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ventasPorDia}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} />
                      <XAxis dataKey="fecha" stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={12} />
                      <YAxis stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? "#1e293b" : "#ffffff",
                          border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                          borderRadius: "6px",
                        }}
                      />
                      <Bar dataKey="ventas" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Métodos de pago</CardTitle>
                  <CardDescription>Distribución de ventas por método de pago</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={ventasPorMetodo}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="valor"
                        label={({ metodo, valor }) => `${metodo}: ${valor}%`}
                      >
                        {ventasPorMetodo.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Tendencia de ventas</CardTitle>
                <CardDescription>Evolución de ventas y cantidad de transacciones</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={ventasPorDia}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} />
                    <XAxis dataKey="fecha" stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={12} />
                    <YAxis stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#1e293b" : "#ffffff",
                        border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                        borderRadius: "6px",
                      }}
                    />
                    <Line type="monotone" dataKey="ventas" stroke="#10b981" strokeWidth={2} name="Ventas (S/)" />
                    <Line type="monotone" dataKey="cantidad" stroke="#3b82f6" strokeWidth={2} name="Transacciones" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detallado" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reporte detallado de ventas</CardTitle>
                <CardDescription>Listado completo de todas las transacciones del período</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Boleta</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Método Pago</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ventasDetallado.map((venta, index) => (
                      <TableRow key={index}>
                        <TableCell>{venta.fecha}</TableCell>
                        <TableCell className="font-medium">{venta.boleta}</TableCell>
                        <TableCell>{venta.cliente}</TableCell>
                        <TableCell>{venta.usuario}</TableCell>
                        <TableCell>
                          <Badge>{venta.metodo_pago}</Badge>
                        </TableCell>
                        <TableCell>{venta.items}</TableCell>
                        <TableCell>S/ {venta.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  )
}