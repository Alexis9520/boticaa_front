"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "next-themes"
import { AlertCircle, Check, Moon, Printer, Save, Settings, Sun } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RoleGuard } from "@/components/RoleGuard"
import { useToast } from "@/hooks/use-toast"

export default function ConfiguracionPage() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  // 1. Cargar configuración desde localStorage al montar (para editar lo último guardado)
  const [configuracionGeneral, setConfiguracionGeneral] = useState({
    nombreNegocio: "Boticas Said",
    direccion: "Av. Principal 123, Lima",
    telefono: "+51 999 888 777",
    email: "contacto@boticassaid.com",
    ruc: "20123456789",
    moneda: "S/",
  })
  const [configuracionBoleta, setConfiguracionBoleta] = useState({
    serieBoleta: "B",
    mensajePie: "¡Gracias por su compra!",
    mostrarLogo: true,
    imprimirAutomatico: true,
    formatoImpresion: "80mm",
  })
  const [configuracionNotificaciones, setConfiguracionNotificaciones] = useState({
    stockBajo: true,
    proximosVencer: true,
    ventasAltas: true,
    cierreCaja: true,
    nuevosUsuarios: true,
  })

  useEffect(() => {
    // Cargar config general
    const confGen = localStorage.getItem("configuracionGeneral")
    if (confGen) setConfiguracionGeneral(JSON.parse(confGen))
    // Cargar config boleta
    const confBol = localStorage.getItem("configuracionBoleta")
    if (confBol) setConfiguracionBoleta(JSON.parse(confBol))
  }, [])

  // 2. Guardar en localStorage cuando el usuario pulsa "Guardar cambios"
  const guardarConfiguracionGeneral = () => {
    localStorage.setItem("configuracionGeneral", JSON.stringify(configuracionGeneral));
    toast({
      title: "Configuración guardada",
      description: "La configuración general se ha actualizado correctamente",
    })
  }

  const guardarConfiguracionBoleta = () => {
    localStorage.setItem("configuracionBoleta", JSON.stringify(configuracionBoleta));
    toast({
      title: "Configuración guardada",
      description: "La configuración de boletas se ha actualizado correctamente",
    })
  }

  const guardarConfiguracionNotificaciones = () => {
    toast({
      title: "Configuración guardada",
      description: "La configuración de notificaciones se ha actualizado correctamente",
    })
  }

  const resetearConfiguracion = () => {
    setConfiguracionGeneral({
      nombreNegocio: "Boticas Said",
      direccion: "Av. Principal 123, Lima",
      telefono: "+51 999 888 777",
      email: "contacto@boticassaid.com",
      ruc: "20123456789",
      moneda: "S/",
    });
    setConfiguracionBoleta({
      serieBoleta: "B",
      mensajePie: "¡Gracias por su compra!",
      mostrarLogo: true,
      imprimirAutomatico: true,
      formatoImpresion: "80mm",
    });
    toast({
      title: "Configuración restablecida",
      description: "Se ha restablecido la configuración a los valores predeterminados",
    })
  }

  return (
    <RoleGuard allowedRoles={["administrador"]}>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
            <p className="text-muted-foreground">Personaliza el sistema según tus necesidades</p>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="boletas">Boletas</TabsTrigger>
            <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
            <TabsTrigger value="apariencia">Apariencia</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuración General</CardTitle>
                <CardDescription>Información básica del negocio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre-negocio">Nombre del negocio</Label>
                  <Input
                    id="nombre-negocio"
                    value={configuracionGeneral.nombreNegocio}
                    onChange={(e) => setConfiguracionGeneral({ ...configuracionGeneral, nombreNegocio: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    value={configuracionGeneral.direccion}
                    onChange={(e) => setConfiguracionGeneral({ ...configuracionGeneral, direccion: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={configuracionGeneral.telefono}
                      onChange={(e) => setConfiguracionGeneral({ ...configuracionGeneral, telefono: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={configuracionGeneral.email}
                      onChange={(e) => setConfiguracionGeneral({ ...configuracionGeneral, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ruc">RUC</Label>
                    <Input
                      id="ruc"
                      value={configuracionGeneral.ruc}
                      onChange={(e) => setConfiguracionGeneral({ ...configuracionGeneral, ruc: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="moneda">Moneda</Label>
                    <Input
                      id="moneda"
                      value={configuracionGeneral.moneda}
                      onChange={(e) => setConfiguracionGeneral({ ...configuracionGeneral, moneda: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={resetearConfiguracion}>
                    Restablecer
                  </Button>
                  <Button onClick={guardarConfiguracionGeneral}>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar cambios
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="boletas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Boletas</CardTitle>
                <CardDescription>Personaliza el formato y contenido de las boletas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serie-boleta">Serie de boleta</Label>
                    <Input
                      id="serie-boleta"
                      value={configuracionBoleta.serieBoleta}
                      onChange={(e) => setConfiguracionBoleta({ ...configuracionBoleta, serieBoleta: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="formato-impresion">Formato de impresión</Label>
                    <Select
                      value={configuracionBoleta.formatoImpresion}
                      onValueChange={(value) =>
                        setConfiguracionBoleta({ ...configuracionBoleta, formatoImpresion: value as "58mm" | "80mm" | "a4" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="80mm">Ticket 80mm</SelectItem>
                        <SelectItem value="58mm">Ticket 58mm</SelectItem>
                        <SelectItem value="a4">Hoja A4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mensaje-pie">Mensaje de pie de boleta</Label>
                  <Textarea
                    id="mensaje-pie"
                    value={configuracionBoleta.mensajePie}
                    onChange={(e) => setConfiguracionBoleta({ ...configuracionBoleta, mensajePie: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="mostrar-logo"
                    checked={configuracionBoleta.mostrarLogo}
                    onCheckedChange={(checked) =>
                      setConfiguracionBoleta({ ...configuracionBoleta, mostrarLogo: checked })
                    }
                  />
                  <Label htmlFor="mostrar-logo">Mostrar logo en boleta</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="imprimir-automatico"
                    checked={configuracionBoleta.imprimirAutomatico}
                    onCheckedChange={(checked) =>
                      setConfiguracionBoleta({ ...configuracionBoleta, imprimirAutomatico: checked })
                    }
                  />
                  <Label htmlFor="imprimir-automatico">Imprimir automáticamente al finalizar venta</Label>
                </div>
                <Separator className="my-4" />
                <div className="flex items-center gap-4">
                  <Button variant="outline">
                    <Printer className="mr-2 h-4 w-4" />
                    Vista previa
                  </Button>
                  <Button onClick={guardarConfiguracionBoleta}>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar cambios
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notificaciones" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Notificaciones</CardTitle>
                <CardDescription>Personaliza las alertas y notificaciones del sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Información</AlertTitle>
                  <AlertDescription>
                    Las notificaciones se mostrarán en el sistema y pueden enviarse por correo electrónico si se
                    configura.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="stock-bajo">Alertas de stock bajo</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificar cuando un producto alcance su nivel mínimo de stock
                      </p>
                    </div>
                    <Switch
                      id="stock-bajo"
                      checked={configuracionNotificaciones.stockBajo}
                      onCheckedChange={(checked) =>
                        setConfiguracionNotificaciones({ ...configuracionNotificaciones, stockBajo: checked })
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="proximos-vencer">Productos próximos a vencer</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificar cuando un producto esté próximo a su fecha de vencimiento
                      </p>
                    </div>
                    <Switch
                      id="proximos-vencer"
                      checked={configuracionNotificaciones.proximosVencer}
                      onCheckedChange={(checked) =>
                        setConfiguracionNotificaciones({ ...configuracionNotificaciones, proximosVencer: checked })
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="ventas-altas">Ventas altas</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificar cuando se detecte un incremento significativo en las ventas
                      </p>
                    </div>
                    <Switch
                      id="ventas-altas"
                      checked={configuracionNotificaciones.ventasAltas}
                      onCheckedChange={(checked) =>
                        setConfiguracionNotificaciones({ ...configuracionNotificaciones, ventasAltas: checked })
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="cierre-caja">Cierre de caja</Label>
                      <p className="text-sm text-muted-foreground">Notificar cuando se realice un cierre de caja</p>
                    </div>
                    <Switch
                      id="cierre-caja"
                      checked={configuracionNotificaciones.cierreCaja}
                      onCheckedChange={(checked) =>
                        setConfiguracionNotificaciones({ ...configuracionNotificaciones, cierreCaja: checked })
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="nuevos-usuarios">Nuevos usuarios</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificar cuando se registre un nuevo usuario en el sistema
                      </p>
                    </div>
                    <Switch
                      id="nuevos-usuarios"
                      checked={configuracionNotificaciones.nuevosUsuarios}
                      onCheckedChange={(checked) =>
                        setConfiguracionNotificaciones({ ...configuracionNotificaciones, nuevosUsuarios: checked })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={resetearConfiguracion}>
                    Restablecer
                  </Button>
                  <Button onClick={guardarConfiguracionNotificaciones}>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar cambios
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="apariencia" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Apariencia</CardTitle>
                <CardDescription>Personaliza la apariencia del sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Tema</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      className="flex flex-col items-center justify-center gap-2 h-24"
                      onClick={() => setTheme("light")}
                    >
                      <Sun className="h-6 w-6" />
                      <span>Claro</span>
                      {theme === "light" && <Check className="absolute top-2 right-2 h-4 w-4" />}
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      className="flex flex-col items-center justify-center gap-2 h-24"
                      onClick={() => setTheme("dark")}
                    >
                      <Moon className="h-6 w-6" />
                      <span>Oscuro</span>
                      {theme === "dark" && <Check className="absolute top-2 right-2 h-4 w-4" />}
                    </Button>
                    <Button
                      variant={theme === "system" ? "default" : "outline"}
                      className="flex flex-col items-center justify-center gap-2 h-24"
                      onClick={() => setTheme("system")}
                    >
                      <Settings className="h-6 w-6" />
                      <span>Sistema</span>
                      {theme === "system" && <Check className="absolute top-2 right-2 h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                

                
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  )
}
