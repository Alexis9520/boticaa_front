import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/lib/use-toast"
import { apiUrl } from "@/components/config"

type Props = {
  userId: number
  onClose: () => void
  isAdmin?: boolean
}

const ChangePasswordDialog = ({ userId, onClose, isAdmin = false }: Props) => {
  const { toast } = useToast()
  const [contrasenaActual, setContrasenaActual] = useState("")
  const [nuevaContrasena, setNuevaContrasena] = useState("")
  const [confirmarContrasena, setConfirmarContrasena] = useState("")
  const [isSending, setIsSending] = useState(false)
  

  const handleChangePassword = async () => {
    if (!nuevaContrasena || !confirmarContrasena) {
      toast({ title: "Error", description: "Completa todos los campos", variant: "destructive" })
      return
    }
    if (nuevaContrasena.length < 6) {
      toast({ title: "Error", description: "La nueva contraseña debe tener al menos 6 caracteres", variant: "destructive" })
      return
    }
    if (nuevaContrasena !== confirmarContrasena) {
      toast({ title: "Error", description: "Las contraseñas no coinciden", variant: "destructive" })
      return
    }

    setIsSending(true)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      const res = await fetch(apiUrl(`/usuarios/${userId}/cambiar-contrasena`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(
          isAdmin
            ? { nuevaContrasena }
            : { contrasenaActual, nuevaContrasena }
        ),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: "Éxito", description: data.message || "Contraseña cambiada correctamente" })
        setContrasenaActual("")
        setNuevaContrasena("")
        setConfirmarContrasena("")
        onClose()
      } else {
        toast({ title: "Error", description: data.message || "No se pudo cambiar la contraseña", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error", description: "Error de conexión con el servidor", variant: "destructive" })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div>
      <h2 className="font-bold mb-2">Cambiar contraseña</h2>
      <div className="space-y-2">
        {!isAdmin && (
          <Input
            type="password"
            placeholder="Contraseña actual"
            value={contrasenaActual}
            onChange={e => setContrasenaActual(e.target.value)}
            autoComplete="current-password"
          />
        )}
        <Input
          type="password"
          placeholder="Nueva contraseña"
          value={nuevaContrasena}
          onChange={e => setNuevaContrasena(e.target.value)}
          autoComplete="new-password"
        />
        <Input
          type="password"
          placeholder="Confirmar nueva contraseña"
          value={confirmarContrasena}
          onChange={e => setConfirmarContrasena(e.target.value)}
          autoComplete="new-password"
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSending}>Cancelar</Button>
          <Button onClick={handleChangePassword} disabled={isSending}>Cambiar</Button>
        </div>
      </div>
    </div>
  )
}

export default ChangePasswordDialog