"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { checkSession } from "@/lib/auth"

type User = {
  dni: string
  nombreCompleto: string
  rol: "administrador" | "trabajador"
}

type AuthContextType = {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const validateSession = async () => {
      try {
        const userData = await checkSession()
        if (userData && userData.rol) {
          const normalizedUser: User = {
            ...userData,
            rol: userData.rol.toLowerCase() as "administrador" | "trabajador"
          }
          setUser(normalizedUser)
        } else {
          setUser(null)
        }
      } catch (error) {
        setUser(null)
        if (pathname !== "/" && !pathname.includes("/login")) {
          router.push("/")
        }
      } finally {
        setLoading(false)
      }
    }

    validateSession()
  }, [pathname, router])

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)