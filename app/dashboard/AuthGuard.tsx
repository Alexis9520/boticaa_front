"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { checkSession } from "@/lib/auth"

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    async function validateSession() {
      try {
        await checkSession() // Llama a tu función, lanza error si no hay sesión
      } catch (e) {
        router.replace("/") // Redirecciona si no hay sesión
      }
    }
    validateSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}