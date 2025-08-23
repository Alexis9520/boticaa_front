"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { logout } from "@/lib/auth"
import { LogOut, Moon, Sun, Settings, User, Loader2, Clock } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

export default function Header() {
  const { user } = useAuth()
  const { theme, setTheme, systemTheme } = useTheme()
  const resolvedTheme = theme === "system" ? systemTheme : theme
  const router = useRouter()
  const { toast } = useToast()

  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [mounted, setMounted] = useState(false)
  // MOD: ahora es Date | null para evitar hidrate con valor variable
  const [now, setNow] = useState<Date | null>(null)

  /* Mount */
  useEffect(() => {
    setMounted(true)
  }, [])

  /* Interval para reloj (sólo corre después de montar) */
  useEffect(() => {
    if (!mounted) return
    setNow(new Date()) // primer valor estable sólo en cliente
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [mounted])

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await logout()
      router.push("/")
      router.refresh()
    } catch {
      toast({
        variant: "destructive",
        title: "Error al cerrar sesión",
        description: "Intenta nuevamente en unos segundos.",
      })
    } finally {
      setIsLoggingOut(false)
    }
  }, [isLoggingOut, router, toast])

  /* Iniciales */
  const userInitials =
    user?.nombreCompleto
      ?.split(" ")
      .filter(Boolean)
      .map(n => n[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "US"

  /* Nombre corto */
  const displayName = useMemo(() => {
    if (!user?.nombreCompleto) return "Usuario"
    const parts = user.nombreCompleto.trim().split(/\s+/)
    if (parts.length === 1) return parts[0]
    return `${parts[0]} ${parts[1][0].toUpperCase()}.`
  }, [user?.nombreCompleto])

  const rolLabel =
    user?.rol === "administrador"
      ? "Administrador"
      : user?.rol
      ? user.rol.charAt(0).toUpperCase() + user.rol.slice(1)
      : "Trabajador"

  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark")

  /* Formatos (sólo si now existe) */
  const timeString = useMemo(
    () => (now
      ? now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : ""),
    [now]
  )

  const dateLong = useMemo(
    () =>
      now
        ? now.toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "2-digit",
          })
        : "",
    [now]
  )

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b",
        "supports-[backdrop-filter]:bg-white/70 supports-[backdrop-filter]:backdrop-blur-xl",
        "dark:supports-[backdrop-filter]:bg-slate-950/70",
        "bg-white/90 dark:bg-slate-950/90"
      )}
      role="banner"
    >
      <div className="flex h-14 items-center gap-3 px-3 md:px-6">
        {/* RELOJ (sólo cuando mounted & now; evitamos mismatch) */}
        {mounted && now && (
          <div
            className={cn(
              "relative ml-2 hidden sm:flex items-center rounded-md px-3 py-1.5 text-xs font-mono",
              "border bg-muted/40 dark:bg-muted/20",
              "shadow-inner"
            )}
            title={dateLong}
            aria-label={`Hora actual ${timeString}`}
            suppressHydrationWarning
          >
            <Clock className="mr-2 h-3.5 w-3.5 text-emerald-500" />
            <span
              className={cn(
                "tabular-nums tracking-tight",
                "font-semibold text-foreground"
              )}
              suppressHydrationWarning
            >
              {timeString}
            </span>
            <span className="absolute inset-x-2 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
          </div>
        )}

        {/* Placeholder mientras se monta (opcional) */}
        {!mounted && (
          <div
            className="relative ml-2 hidden sm:flex items-center rounded-md px-3 py-1.5 text-xs font-mono border bg-muted/20 animate-pulse"
            aria-label="Cargando hora"
          >
            <Clock className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">--:--:--</span>
          </div>
        )}

        {/* Nombre del usuario */}
        <div
          className="hidden md:flex flex-col justify-center ml-4 min-w-[120px] max-w-[200px]"
          title={user?.nombreCompleto || "Usuario"}
        >
          <span className="text-sm font-medium truncate leading-tight">
            {displayName}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          {/* Botón tema */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-full border border-transparent hover:border-emerald-400/40 hover:bg-emerald-50 dark:hover:bg-slate-800/60 transition"
            onClick={toggleTheme}
            aria-label="Cambiar tema"
          >
            {mounted && (
              <>
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-slate-200" />
              </>
            )}
            <span className="sr-only">Cambiar tema</span>
          </Button>

            {/* Menú Usuario */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "group relative flex h-9 w-9 items-center justify-center rounded-full ring-offset-background transition",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2",
                    "border border-emerald-400/30 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/40 dark:from-emerald-900/40 dark:via-slate-900 dark:to-emerald-950/60",
                    "hover:shadow-sm"
                  )}
                  aria-label="Menú de usuario"
                >
                  <Avatar className="h-9 w-9 border border-emerald-300/40 dark:border-emerald-700/40">
                    <AvatarFallback
                      className={cn(
                        "text-[11px] font-semibold uppercase tracking-wide",
                        "bg-gradient-to-br from-emerald-500 to-teal-600 text-white dark:from-emerald-600 dark:to-teal-700"
                      )}
                    >
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-950 shadow" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64 overflow-hidden rounded-xl border border-emerald-100/60 dark:border-emerald-900/40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-lg"
                sideOffset={8}
              >
                <DropdownMenuLabel className="p-0">
                  <div className="flex items-center gap-3 p-3 pb-2">
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-xs font-semibold text-white ring-2 ring-emerald-300/40 dark:ring-emerald-700/50">
                        {userInitials}
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-950" />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium truncate max-w-[140px]">
                        {user?.nombreCompleto || "Usuario"}
                      </span>
                      <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                        {rolLabel}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/dashboard/perfil" className="gap-2" prefetch>
                      <User className="h-4 w-4 text-emerald-500" />
                      <span>Mi perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/dashboard/configuracion" className="gap-2" prefetch>
                      <Settings className="h-4 w-4 text-emerald-500" />
                      <span>Configuración</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className={cn(
                    "gap-2 text-rose-600 dark:text-rose-400 focus:text-rose-600 dark:focus:text-rose-400 cursor-pointer",
                    isLoggingOut && "pointer-events-none opacity-70"
                  )}
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  <span>
                    {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
    </header>
  )
}