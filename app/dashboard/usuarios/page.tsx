"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { RoleGuard } from "@/components/RoleGuard"
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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { Edit, Plus, Search, Trash2, User, Users } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type Usuario = {
  id: number
  nombre_completo: string
  dni: string
  rol: string
  turno: string
  horario_entrada: string
  horario_salida: string
}

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null
}

async function fetchConAuth(input: RequestInfo, init: RequestInit = {}) {
  const token = getToken()
  if (!token) throw new Error("Sesión expirada o no autenticada")
  const headers = {
    ...(init.headers || {}),
    Authorization: `Bearer ${token}`,
  }
  return fetch(input, { ...init, headers })
}

export default function UsuariosPage() {
  const { toast } = useToast()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre_completo: "",
    dni: "",
    rol: "",
    turno: "",
    horario_entrada: "",
    horario_salida: "",
    password: "",
    confirmPassword: "",
  })
  const [isEnviando, setIsEnviando] = useState(false)
  const [editandoUsuario, setEditandoUsuario] = useState<Usuario | null>(null)
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<Usuario | null>(null)
  const nombreCompletoRef = useRef<HTMLInputElement>(null)
  const dniRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  const usuariosFiltrados = usuarios.filter(
    (usuario) =>
      usuario.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
      usuario.dni.includes(busqueda) ||
      usuario.rol.toLowerCase().includes(busqueda.toLowerCase()),
  )

  // Agregar usuario
  const agregarUsuario = async () => {
    if (
      !nuevoUsuario.nombre_completo ||
      !nuevoUsuario.dni ||
      !nuevoUsuario.rol ||
      !nuevoUsuario.turno ||
      !nuevoUsuario.horario_entrada ||
      !nuevoUsuario.horario_salida ||
      !nuevoUsuario.password ||
      !nuevoUsuario.confirmPassword
    ) {
      toast({ title: "Error", description: "Completa todos los campos obligatorios", variant: "destructive" })
      nombreCompletoRef.current?.focus()
      return
    }

    if (nuevoUsuario.dni.length !== 8) {
      toast({ title: "Error", description: "El DNI debe tener 8 dígitos", variant: "destructive" })
      dniRef.current?.focus()
      return
    }

    if (usuarios.some((u) => u.dni === nuevoUsuario.dni)) {
      toast({ title: "Error", description: "Ya existe un usuario con este DNI", variant: "destructive" })
      dniRef.current?.focus()
      return
    }

    if (nuevoUsuario.password !== nuevoUsuario.confirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden", variant: "destructive" })
      passwordRef.current?.focus()
      return
    }

    if (nuevoUsuario.password.length < 6) {
      toast({ title: "Error", description: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" })
      passwordRef.current?.focus()
      return
    }

    setIsEnviando(true)
    try {
      const res = await fetchConAuth("http://51.161.10.179:8080/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dni: nuevoUsuario.dni,
          nombreCompleto: nuevoUsuario.nombre_completo,
          contrasena: nuevoUsuario.password,
          rol: nuevoUsuario.rol,
          turno: nuevoUsuario.turno,
          horarioEntrada: nuevoUsuario.horario_entrada,
          horarioSalida: nuevoUsuario.horario_salida,
        }),
      })

      if (res.ok) {
        toast({ title: "Usuario agregado con éxito", description: "El usuario se ha creado correctamente" })
        setNuevoUsuario({
          nombre_completo: "",
          dni: "",
          rol: "",
          turno: "",
          horario_entrada: "",
          horario_salida: "",
          password: "",
          confirmPassword: "",
        })
        cargarUsuarios()
      } else {
        const error = await res.json()
        toast({ title: "Error", description: error.message || "No se pudo agregar el usuario", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message || "Error de conexión con el servidor", variant: "destructive" })
    } finally {
      setIsEnviando(false)
    }
  }

  // Editar usuario
  const guardarEdicionUsuario = async () => {
    if (!editandoUsuario) return
    if (
      !editandoUsuario.nombre_completo ||
      !editandoUsuario.dni ||
      !editandoUsuario.rol ||
      !editandoUsuario.turno ||
      !editandoUsuario.horario_entrada ||
      !editandoUsuario.horario_salida
    ) {
      toast({ title: "Error", description: "Completa todos los campos obligatorios", variant: "destructive" })
      return
    }

    try {
      const res = await fetchConAuth(`/api/usuarios/${editandoUsuario.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreCompleto: editandoUsuario.nombre_completo,
          dni: editandoUsuario.dni,
          rol: editandoUsuario.rol.toUpperCase(),
          turno: editandoUsuario.turno,
          horarioEntrada: editandoUsuario.horario_entrada,
          horarioSalida: editandoUsuario.horario_salida,
        }),
      })
      if (res.ok) {
        toast({ title: "Usuario editado con éxito" })
        setEditandoUsuario(null)
        cargarUsuarios()
      } else {
        const error = await res.json()
        toast({ title: "Error", description: error.message || "No se pudo editar el usuario", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message || "No se pudo editar el usuario", variant: "destructive" })
    }
  }

  // Eliminar usuario
  const eliminarUsuario = async () => {
    if (!usuarioAEliminar) return
    try {
      const res = await fetchConAuth(`/api/usuarios/${usuarioAEliminar.id}`, {
        method: "DELETE"
      })
      if (res.ok) {
        toast({ title: "Usuario eliminado" })
        setUsuarioAEliminar(null)
        cargarUsuarios()
      } else {
        toast({ title: "Error", description: "No se pudo eliminar el usuario", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message || "No se pudo eliminar el usuario", variant: "destructive" })
    }
  }

  const cargarUsuarios = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    toast({ title: "Sesión expirada", description: "Por favor, inicia sesión de nuevo", variant: "destructive" });
    // Aquí podrías redirigir al login si quieres
    return;
  }
  fetch("http://51.161.10.179:8080/usuarios", {
    headers: {
      "Authorization": `Bearer ${token}`,
    }
  })
    .then(res => {
      if (!res.ok) throw new Error("Error de sesión o autorización");
      return res.json();
    })
    .then(data => {
      const usuariosAdaptados = data.map((u: any) => ({
        id: u.id,
        nombre_completo: u.nombreCompleto,
        dni: u.dni,
        rol: (u.rol || "").toLowerCase(),
        turno: u.turno,
        horario_entrada: u.horarioEntrada,
        horario_salida: u.horarioSalida,
      }))
      setUsuarios(usuariosAdaptados)
    })
    .catch((err) => {
      toast({ title: "Sesión expirada", description: "Por favor, inicia sesión de nuevo", variant: "destructive" });
      // Opcional: redirigir al login
    })
}


  useEffect(() => { cargarUsuarios() }, [])


  return (
    <RoleGuard allowedRoles={["administrador"]}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">Administra los usuarios del sistema</p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Usuario
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuevo Usuario</DialogTitle>
                  <DialogDescription>Crea un nuevo usuario para el sistema</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre_completo">Nombre completo *</Label>
                    <Input
                      id="nombre_completo"
                      placeholder="Ej: Juan Pérez"
                      value={nuevoUsuario.nombre_completo}
                      onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre_completo: e.target.value })}
                      ref={nombreCompletoRef}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dni">DNI *</Label>
                    <Input
                      id="dni"
                      placeholder="12345678"
                      maxLength={8}
                      value={nuevoUsuario.dni}
                      onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, dni: e.target.value })}
                      ref={dniRef}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rol">Rol *</Label>
                      <Select
                        value={nuevoUsuario.rol}
                        onValueChange={(value) => setNuevoUsuario({ ...nuevoUsuario, rol: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="administrador">Administrador</SelectItem>
                          <SelectItem value="trabajador">Trabajador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="turno">Turno *</Label>
                      <Select
                        value={nuevoUsuario.turno}
                        onValueChange={(value) => setNuevoUsuario({ ...nuevoUsuario, turno: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona turno" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mañana">Mañana</SelectItem>
                          <SelectItem value="tarde">Tarde</SelectItem>
                          <SelectItem value="noche">Noche</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="horario_entrada">Horario entrada *</Label>
                      <Input
                        id="horario_entrada"
                        type="time"
                        value={nuevoUsuario.horario_entrada}
                        onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, horario_entrada: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="horario_salida">Horario salida *</Label>
                      <Input
                        id="horario_salida"
                        type="time"
                        value={nuevoUsuario.horario_salida}
                        onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, horario_salida: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={nuevoUsuario.password}
                      onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })}
                      ref={passwordRef}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Repite la contraseña"
                      value={nuevoUsuario.confirmPassword}
                      onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={agregarUsuario} disabled={isEnviando}>Crear Usuario</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usuarios.length}</div>
              <p className="text-xs text-muted-foreground">Usuarios registrados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usuarios.filter((u) => u.rol === "administrador").length}</div>
              <p className="text-xs text-muted-foreground">Con permisos completos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trabajadores</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usuarios.filter((u) => u.rol === "trabajador").length}</div>
              <p className="text-xs text-muted-foreground">Personal de ventas</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Lista de Usuarios</CardTitle>
            <CardDescription>Gestiona los usuarios del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar usuarios..."
                  className="pl-8"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>DNI</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead>Horario entrada</TableHead>
                    <TableHead>Horario salida</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuariosFiltrados.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{usuario.nombre_completo}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{usuario.dni}</TableCell>
                      <TableCell>
                        <Badge variant={usuario.rol === "administrador" ? "default" : "secondary"}>
                          {usuario.rol === "administrador" ? "Administrador" : "Trabajador"}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{usuario.turno}</TableCell>
                      <TableCell>{usuario.horario_entrada}</TableCell>
                      <TableCell>{usuario.horario_salida}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditandoUsuario(usuario)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <AlertDialog open={usuarioAEliminar?.id === usuario.id} onOpenChange={(open) => setUsuarioAEliminar(open ? usuario : null)}>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Se eliminará permanentemente el usuario {usuario.nombre_completo}.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={eliminarUsuario}>
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Dialog para editar usuario */}
        <Dialog open={!!editandoUsuario} onOpenChange={() => setEditandoUsuario(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
              <DialogDescription>Modifica la información del usuario</DialogDescription>
            </DialogHeader>
            {editandoUsuario && (
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-nombre_completo">Nombre completo *</Label>
                  <Input
                    id="edit-nombre_completo"
                    value={editandoUsuario.nombre_completo}
                    onChange={(e) => setEditandoUsuario({ ...editandoUsuario, nombre_completo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-dni">DNI *</Label>
                  <Input
                    id="edit-dni"
                    maxLength={8}
                    value={editandoUsuario.dni}
                    onChange={(e) => setEditandoUsuario({ ...editandoUsuario, dni: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-rol">Rol *</Label>
                    <Select
                      value={editandoUsuario.rol}
                      onValueChange={(value) => setEditandoUsuario({ ...editandoUsuario, rol: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="administrador">Administrador</SelectItem>
                        <SelectItem value="trabajador">Trabajador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-turno">Turno *</Label>
                    <Select
                      value={editandoUsuario.turno}
                      onValueChange={(value) => setEditandoUsuario({ ...editandoUsuario, turno: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mañana">Mañana</SelectItem>
                        <SelectItem value="tarde">Tarde</SelectItem>
                        <SelectItem value="noche">Noche</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-horario_entrada">Horario entrada *</Label>
                    <Input
                      id="edit-horario_entrada"
                      type="time"
                      value={editandoUsuario.horario_entrada}
                      onChange={(e) => setEditandoUsuario({ ...editandoUsuario, horario_entrada: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-horario_salida">Horario salida *</Label>
                    <Input
                      id="edit-horario_salida"
                      type="time"
                      value={editandoUsuario.horario_salida}
                      onChange={(e) => setEditandoUsuario({ ...editandoUsuario, horario_salida: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditandoUsuario(null)}>
                Cancelar
              </Button>
              <Button onClick={guardarEdicionUsuario}>Guardar Cambios</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  )
}