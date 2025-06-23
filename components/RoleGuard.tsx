"use client"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, ReactNode, useState } from "react"
import Spinner from "@/components/ui/Spinner"

interface RoleGuardProps {
  allowedRoles: string[]
  redirectTo?: string
  children: ReactNode
}

export function RoleGuard({ allowedRoles, redirectTo = "/dashboard/ventas", children }: RoleGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    if (!loading && (!user || !allowedRoles.includes(user.rol))) {
      setShowWarning(true)
      const timeout = setTimeout(() => {
        router.replace(redirectTo)
      }, 2000) // Espera 2 segundos mostrando la advertencia antes de redirigir

      return () => clearTimeout(timeout)
    }
    // eslint-disable-next-line
  }, [user, loading, allowedRoles, redirectTo, router])

  if (loading) {
    return <Spinner />
  }

  if (!user || !allowedRoles.includes(user.rol)) {
    return (
      <Spinner warning="⚠️ Esta sección es solo para administradores. Serás redirigido al inicio." />
    )
  }

  return <>{children}</>
}