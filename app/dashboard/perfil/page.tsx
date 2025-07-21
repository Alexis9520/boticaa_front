"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Calendar, Shield } from "lucide-react"
import { fetchWithAuth } from "@/lib/api" // <-- Usa tu función aquí

export default function PerfilPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [editando, setEditando] = useState(false)
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
      try {
        const data = await fetchWithAuth("http://localhost:8080/usuarios/me")
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
      }
    }
    fetchUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.dni])

  // Guardar cambios usando el backend protegido
  const guardarCambios = async () => {
    try {
      await fetchWithAuth("http://localhost:8080/usuarios/me", {
        method: "PUT",
        body: JSON.stringify({
          nombreCompleto: datosPersonales.nombre_completo,
          horarioEntrada: datosPersonales.horario_entrada,
          horarioSalida: datosPersonales.horario_salida,
          turno: datosPersonales.turno,
          rol: datosPersonales.rol,
        }),
        headers: { "Content-Type": "application/json" },
      })
      setEditando(false)
      toast({ title: "Perfil actualizado", description: "Los cambios se han guardado correctamente" })
    } catch (error: any) {
      if (error.message.includes("401")) {
        toast({ title: "Sesión expirada", description: "Debes volver a iniciar sesión", variant: "destructive" });
      } else {
        toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" })
      }
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mi Perfil</h1>
          <p className="text-muted-foreground">Gestiona tu información personal y configuración de cuenta</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-2xl">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle>
                {datosPersonales.nombre_completo}
              </CardTitle>
              <CardDescription>
                <Badge variant={datosPersonales.rol === "ADMINISTRADOR" ? "default" : "secondary"}>
                  {datosPersonales.rol === "ADMINISTRADOR" ? "Administrador" : "Trabajador"}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>DNI: {user?.dni}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  Turno: {datosPersonales.turno || "--"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span>Rol: {datosPersonales.rol || "--"}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Información Personal</CardTitle>
                  <CardDescription>Actualiza tu información personal</CardDescription>
                </div>
                {!editando && (
                  <Button variant="outline" onClick={() => setEditando(true)}>
                    Editar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre_completo">Nombre completo</Label>
                  {editando ? (
                    <Input
                      id="nombre_completo"
                      value={datosPersonales.nombre_completo}
                      onChange={(e) => setDatosPersonales({ ...datosPersonales, nombre_completo: e.target.value })}
                    />
                  ) : (
                    <div className="p-2 border rounded-md bg-muted/40">{datosPersonales.nombre_completo}</div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="horario_entrada">Horario de entrada</Label>
                    {editando ? (
                      <Input
                        id="horario_entrada"
                        type="time"
                        value={datosPersonales.horario_entrada || ""}
                        onChange={(e) =>
                          setDatosPersonales({ ...datosPersonales, horario_entrada: e.target.value })
                        }
                      />
                    ) : (
                      <div className="p-2 border rounded-md bg-muted/40">
                        {datosPersonales.horario_entrada || "--"}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="horario_salida">Horario de salida</Label>
                    {editando ? (
                      <Input
                        id="horario_salida"
                        type="time"
                        value={datosPersonales.horario_salida || ""}
                        onChange={(e) =>
                          setDatosPersonales({ ...datosPersonales, horario_salida: e.target.value })}
                      />
                    ) : (
                      <div className="p-2 border rounded-md bg-muted/40">
                        {datosPersonales.horario_salida || "--"}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="turno">Turno</Label>
                  {editando ? (
                    <Input
                      id="turno"
                      value={datosPersonales.turno}
                      onChange={(e) =>
                        setDatosPersonales({ ...datosPersonales, turno: e.target.value })
                      }
                    />
                  ) : (
                    <div className="p-2 border rounded-md bg-muted/40">{datosPersonales.turno || "--"}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rol">Rol</Label>
                  {editando ? (
                    <Input
                      id="rol"
                      value={datosPersonales.rol}
                      onChange={(e) =>
                        setDatosPersonales({ ...datosPersonales, rol: e.target.value })
                      }
                    />
                  ) : (
                    <div className="p-2 border rounded-md bg-muted/40">{datosPersonales.rol || "--"}</div>
                  )}
                </div>
                {editando && (
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setEditando(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={guardarCambios}>Guardar cambios</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}