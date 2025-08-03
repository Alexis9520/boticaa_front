"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-provider"
import Spinner from "@/components/ui/Spinner"
import {
  AlertCircle,
  ArrowDownIcon,
  ArrowUpIcon,
  Calendar,
  CreditCard,
  DollarSign,
  Package,
  ShoppingBag,
  Users,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import SalesChart from "@/components/sales-chart"
import { fetchWithAuth } from "@/lib/api" // Ajusta al path real de tu utilidad

type VentasDia = { monto: number, variacion: number }
type VentasMes = { monto: number, variacion: number }
type SaldoCaja = { total: number, efectivo: number, yape: number }
type ClientesAtendidos = { cantidad: number, variacion: number }
type VentaReciente = { boleta: string, cliente: string, monto: number }
type ProductoMasVendido = { nombre: string, unidades: number, porcentaje: number }
type ProductoCritico = { nombre: string, stock: number }
type ProductoVencimiento = { nombre: string, dias: number }
type VentasPorHora = { hora: string, total: number }

export default function Dashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [ventasDia, setVentasDia] = useState<VentasDia>({ monto: 0, variacion: 0 })
  const [ventasMes, setVentasMes] = useState<VentasMes>({ monto: 0, variacion: 0 })
  const [saldoCaja, setSaldoCaja] = useState<SaldoCaja>({ total: 0, efectivo: 0, yape: 0 })
  const [clientesAtendidos, setClientesAtendidos] = useState<ClientesAtendidos>({ cantidad: 0, variacion: 0 })
  const [ultimasVentas, setUltimasVentas] = useState<VentaReciente[]>([])
  const [productosMasVendidos, setProductosMasVendidos] = useState<ProductoMasVendido[]>([])
  const [productosCriticos, setProductosCriticos] = useState<ProductoCritico[]>([])
  const [productosVencimiento, setProductosVencimiento] = useState<ProductoVencimiento[]>([])
  const [ventasPorHora, setVentasPorHora] = useState<VentasPorHora[]>([])

  useEffect(() => {
    if (!loading && user && user.rol === "trabajador") {
      router.replace("/dashboard/ventas")
    }
  }, [user, loading, router])

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }
    fetch("http://51.161.10.179:8080/api/dashboard/resumen", {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    })
      .then(async (res) => {
        if (res.status === 401) {
          localStorage.removeItem("token");
          router.replace("/login");
          return;
        }
        if (res.status === 403) {
          alert("No tienes permisos para ver este dashboard (Error 403: Forbidden)");
          router.replace("/");
          return;
        }
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || `Error en la petición: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setVentasDia(data.ventasDia);
        setVentasMes(data.ventasMes);
        setSaldoCaja(data.saldoCaja);
        setClientesAtendidos(data.clientesAtendidos);
        setUltimasVentas(data.ultimasVentas);
        setProductosMasVendidos(data.productosMasVendidos);
        setProductosCriticos(data.productosCriticos);
        setProductosVencimiento(data.productosVencimiento);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [router]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }
    fetch("http://51.161.10.179:8080/api/dashboard/ventas-por-hora", {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    })
      .then(async (res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((data) => setVentasPorHora(data))
      .catch(() => setVentasPorHora([]));
  }, [router]);

  if (loading || !user) {
    return <Spinner />
  }

  if (user.rol !== "administrador") {
    return (
      <Spinner warning="" />
    )
  }
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Hoy
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas del día</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              S/ {ventasDia.monto.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUpIcon className={`mr-1 h-4 w-4 ${ventasDia.variacion >= 0 ? "text-emerald-500" : "text-red-500"}`} />
              <span className={ventasDia.variacion >= 0 ? "text-emerald-500" : "text-red-500"}>
                {ventasDia.variacion >= 0 ? "+" : ""}{ventasDia.variacion.toFixed(2)}%
              </span> desde ayer
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas del mes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              S/ {ventasMes.monto.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUpIcon className={`mr-1 h-4 w-4 ${ventasMes.variacion >= 0 ? "text-emerald-500" : "text-red-500"}`} />
              <span className={ventasMes.variacion >= 0 ? "text-emerald-500" : "text-red-500"}>
                {ventasMes.variacion >= 0 ? "+" : ""}{ventasMes.variacion.toFixed(2)}%
              </span> desde el mes pasado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo en caja</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              S/ {saldoCaja.total.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div>Efectivo: S/ {saldoCaja.efectivo?.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</div>
              <div>Yape/Plin: S/ {saldoCaja.yape?.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes atendidos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientesAtendidos.cantidad}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              {clientesAtendidos.variacion >= 0 ? (
                <ArrowUpIcon className="mr-1 h-4 w-4 text-emerald-500" />
              ) : (
                <ArrowDownIcon className="mr-1 h-4 w-4 text-red-500" />
              )}
              <span className={clientesAtendidos.variacion >= 0 ? "text-emerald-500" : "text-red-500"}>
                {clientesAtendidos.variacion >= 0 ? "+" : ""}{clientesAtendidos.variacion.toFixed(2)}%
              </span> desde ayer
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ventas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ventas">Análisis de ventas</TabsTrigger>
          <TabsTrigger value="productos">Productos</TabsTrigger>
        </TabsList>
        <TabsContent value="ventas" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Ventas recientes</CardTitle>
                <CardDescription>Ventas realizadas en las últimas 24 horas</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <SalesChart data={ventasPorHora} />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Ventas recientes</CardTitle>
                <CardDescription>Últimas transacciones realizadas</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Boleta</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ultimasVentas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          Sin ventas recientes.
                        </TableCell>
                      </TableRow>
                    ) : ultimasVentas.map((venta, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{venta.boleta}</TableCell>
                        <TableCell>{venta.cliente}</TableCell>
                        <TableCell>S/ {venta.monto?.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="productos" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Productos más vendidos</CardTitle>
                <CardDescription>Top 5 productos con mayor volumen de ventas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(productosMasVendidos ?? []).map((p, i) => (
                    <div className="space-y-2" key={i}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>{p.nombre}</span>
                        </div>
                        <span className="text-sm font-medium">{p.unidades} unidades</span>
                      </div>
                      <Progress value={p.porcentaje} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <div className="col-span-3 grid gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Stock crítico</CardTitle>
                  <CardDescription>Productos con bajo nivel de stock</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {productosCriticos.map((p, i) => (
                      <div className="flex items-center justify-between" key={i}>
                        <span className="font-medium">{p.nombre}</span>
                        <Badge variant="destructive">{p.stock} unidades</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Próximos a vencer</CardTitle>
                  <CardDescription>Productos con fecha de vencimiento cercana</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {productosVencimiento.map((p, i) => (
                      <Alert variant="destructive" className="py-2" key={i}>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{p.nombre}</AlertTitle>
                        <AlertDescription>Vence en {p.dias} días</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}