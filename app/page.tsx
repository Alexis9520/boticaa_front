"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { checkSession } from "@/lib/auth"
import LoginForm from "@/components/login-form"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    async function validateSession() {
      if (typeof window !== "undefined" && localStorage.getItem("token")) {
        try {
          const session = await checkSession()
          if (session) {
            router.replace("/dashboard")
          }
        } catch (e) {
          // Si el token no es válido, puedes limpiar el localStorage aquí si quieres
          // localStorage.removeItem("token")
        }
      }
    }
    validateSession()
  }, [router])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-emerald-50 to-white dark:from-slate-950 dark:to-slate-900">
      <LoginForm />
    </main>
  )
}