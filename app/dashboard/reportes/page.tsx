"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar, FileBarChart2, Users, ShoppingBag, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function ReportesPage() {
  const [tab, setTab] = useState("ventas")

  return (
    <div className="flex flex-col gap-8 py-6 max-w-6xl mx-auto relative min-h-[65vh]">
      {/* Header futurista */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-fuchsia-500 to-emerald-400 bg-clip-text text-transparent flex items-center gap-2">
            <FileBarChart2 className="w-7 h-7 text-fuchsia-400 animate-pulse" />
            Reportes y Análisis
          </h1>
          <p className="text-muted-foreground mt-1">
            Explora, filtra y descarga información clave de tu farmacia.
          </p>
        </div>
        <Button variant="secondary" className="gap-2">
          <Calendar className="w-4 h-4" />
          Filtrar por fecha
        </Button>
      </div>

      {/* Tabs de tipos de reporte */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/50 backdrop-blur flex-wrap p-1 rounded-lg gap-2">
          <TabsTrigger value="ventas" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-400/30 data-[state=active]:to-fuchsia-400/15">
            <ShoppingBag className="w-4 h-4 mr-1" /> Ventas
          </TabsTrigger>
          <TabsTrigger value="productos" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-400/25 data-[state=active]:to-blue-400/15">
            <CreditCard className="w-4 h-4 mr-1" /> Productos
          </TabsTrigger>
          <TabsTrigger value="clientes" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-fuchsia-400/30 data-[state=active]:to-blue-400/15">
            <Users className="w-4 h-4 mr-1" /> Clientes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ventas">
          <Card className="mt-6 shadow-lg border border-blue-400/20 bg-gradient-to-br from-blue-50/40 to-fuchsia-50/10 backdrop-blur-xl relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-400" />
                Reporte de Ventas
              </CardTitle>
              <CardDescription>
                Descarga y analiza todas las ventas por rango de fecha, métodos de pago y más.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState message="Selecciona un rango de fechas para ver el reporte de ventas." />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="productos">
          <Card className="mt-6 shadow-lg border border-emerald-400/20 bg-gradient-to-br from-emerald-50/40 to-blue-50/10 backdrop-blur-xl relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                Reporte de Productos
              </CardTitle>
              <CardDescription>
                Consulta inventario, productos más vendidos y rotación.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState message="Elige filtros para ver el reporte de productos." />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clientes">
          <Card className="mt-6 shadow-lg border border-fuchsia-400/20 bg-gradient-to-br from-fuchsia-50/40 to-blue-50/10 backdrop-blur-xl relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-fuchsia-400" />
                Reporte de Clientes
              </CardTitle>
              <CardDescription>
                Analiza clientes frecuentes, nuevos y su comportamiento de compra.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState message="Filtra para obtener datos de clientes atendidos." />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* --- Placeholder elegante --- */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[120px] gap-2 text-muted-foreground">
      <span className="inline-block w-12 h-12 rounded-full bg-gradient-to-tr from-blue-400 to-fuchsia-400 text-white flex items-center justify-center shadow-md mb-2 text-2xl animate-pulse">
        📝
      </span>
      <span className="font-medium">{message}</span>
      <span className="text-xs text-muted-foreground/80">Próximamente podrás exportar los reportes.</span>
    </div>
  )
}