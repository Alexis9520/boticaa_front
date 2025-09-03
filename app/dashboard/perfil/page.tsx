"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Calendar, Shield, Sparkles } from "lucide-react"
import { fetchWithAuth } from "@/lib/api"
import { apiUrl } from "@/components/config"

function BgAura() {
  return (
    <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
      {/* Light mode: sutil, colorido; Dark mode: más transparente y suave */}
      <div className="absolute -top-40 -left-40 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-blue-300/15 to-fuchsia-400/10 blur-3xl animate-pulse dark:from-transparent dark:to-transparent" />
      <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-gradient-to-tr from-fuchsia-400/10 to-blue-300/10 blur-2xl opacity-40 animate-pulse dark:from-transparent dark:to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_60%,#a5b4fc09,transparent_60%),radial-gradient(circle_at_80%_10%,#f472b609,transparent_55%)] dark:bg-none" />
    </div>
  )
}

export default function PerfilPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [datosPersonales, setDatosPersonales] = useState(() => ({
    nombre_completo: user?.nombreCompleto || "",
    horario_entrada: "",
    horario_salida: "",
    turno: "",
    rol: user?.rol || "",
  }))

  // Iniciales del usuario
  const userInitials = user?.nombreCompleto
    ? (() => {
        const [first, ...rest] = user.nombreCompleto.split(" ");
        return `${first?.charAt(0) ?? ""}${rest[0]?.charAt(0) ?? ""}`;
      })()
    : "US";

  // Cargar datos reales desde el backend (protegido, con token)
  useEffect(() => {
    async function fetchUser() {
      setLoading(true)
      try {
        const data = await fetchWithAuth(apiUrl("/usuarios/me"))
        setDatosPersonales({
          nombre_completo: data.nombreCompleto ?? "",
          horario_entrada: data.horarioEntrada ?? "",
          horario_salida: data.horarioSalida ?? "",
          turno: data.turno ?? "",
          rol: data.rol ?? "",
        })
      } catch (error: any) {
        if (error.message.includes("401")) {
          toast({ title: "Sesión expirada", description: "Debes volver a iniciar sesión", variant: "destructive" });
        } else {
          toast({ title: "Error", description: "No se pudo cargar el perfil", variant: "destructive" });
        }
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.dni])

  return (
    <div className="relative flex flex-col gap-6 py-6 min-h-[80vh]">
      <BgAura />

      {/* Header */}
      <div className="flex items-center justify-between z-10">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-fuchsia-400 to-emerald-400 bg-clip-text text-transparent flex items-center gap-2">
            
            Mi Perfil
          </h1>
          <p className="text-sm text-muted-foreground">
            Consulta tu información de usuario y configuración del sistema.
          </p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3 z-10">
        {/* Card Perfil */}
        <div className="md:col-span-1">
          <Card className="relative overflow-hidden bg-gradient-to-br from-background/80 via-blue-100/20 to-fuchsia-100/10 border border-blue-400/10 backdrop-blur-md shadow-xl dark:bg-background/80">
            <div className="absolute -top-8 -left-8 h-20 w-20 bg-gradient-to-br from-blue-400/20 to-fuchsia-400/10 rounded-full blur-2xl opacity-50 dark:from-transparent dark:to-transparent" />
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24 ring-4 ring-blue-200/30 shadow-lg">
                  <AvatarFallback className="bg-gradient-to-tr from-blue-100 via-fuchsia-100 to-emerald-100 text-fuchsia-500 text-2xl">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="flex flex-col items-center gap-1">
                <span className="text-xl font-bold text-foreground">{datosPersonales.nombre_completo}</span>
                <Badge
                  variant={
                    datosPersonales.rol?.toUpperCase() === "ADMINISTRADOR" ? "default" : "secondary"
                  }
                  className="uppercase px-3 py-1 tracking-wider rounded-md"
                >
                  {datosPersonales.rol?.toUpperCase() === "ADMINISTRADOR"
                    ? "Administrador"
                    : "Trabajador"}
                </Badge>
              </CardTitle>
              <CardDescription>
                <span className="text-xs text-muted-foreground">
                  Última actualización: {new Date().toLocaleDateString("es-PE")}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                <User className="h-4 w-4 text-blue-400" />
                <span>DNI: {user?.dni}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 text-fuchsia-400" />
                <span>Turno: <span className="font-semibold">{datosPersonales.turno || "--"}</span></span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-emerald-400" />
                <span>Rol: <span className="font-semibold">{datosPersonales.rol || "--"}</span></span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card datos personales */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-gradient-to-br from-background/80 via-blue-100/10 to-fuchsia-100/5 border border-blue-400/5 shadow-lg relative overflow-hidden backdrop-blur dark:bg-background/80">
            <div className="absolute -top-8 -right-8 h-20 w-20 bg-gradient-to-br from-fuchsia-500/10 to-blue-200/10 rounded-full blur-2xl opacity-30 dark:from-transparent dark:to-transparent" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-fuchsia-400">
                Información personal
              </CardTitle>
              <CardDescription>
                Estos son tus datos personales registrados en el sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-10 text-center text-muted-foreground animate-pulse">
                  Cargando perfil...
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="block text-blue-500 font-semibold text-xs">Nombre completo</span>
                    <div className="p-2 border rounded-md bg-muted/40">{datosPersonales.nombre_completo}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="block text-blue-500 font-semibold text-xs">Horario de entrada</span>
                      <div className="p-2 border rounded-md bg-muted/40">
                        {datosPersonales.horario_entrada || "--"}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="block text-blue-500 font-semibold text-xs">Horario de salida</span>
                      <div className="p-2 border rounded-md bg-muted/40">
                        {datosPersonales.horario_salida || "--"}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="block text-blue-500 font-semibold text-xs">Turno</span>
                    <div className="p-2 border rounded-md bg-muted/40">{datosPersonales.turno || "--"}</div>
                  </div>
                  <div className="space-y-2">
                    <span className="block text-blue-500 font-semibold text-xs">Rol</span>
                    <div className="p-2 border rounded-md bg-muted/40">{datosPersonales.rol || "--"}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}