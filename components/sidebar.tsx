"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"
import {
  BarChart3,
  Box,
  ClipboardList,
  CreditCard,
  Home,
  Package,
  Pill,
  Settings,
  Users,
  X,
  Menu,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

// IMPORTA tu changelog estático
import { CHANGELOG, isRecent } from "@/lib/changelog"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  adminOnly?: boolean
  id?: string
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <Home className="h-5 w-5" />,
    adminOnly: true,
  },
  
  {
    title: "Ventas",
    href: "/dashboard/ventas",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    title: "Caja",
    href: "/dashboard/caja",
    icon: <ClipboardList className="h-5 w-5" />,
  },
  {
    title: "Productos",
    href: "/dashboard/productos",
    icon: <Package className="h-5 w-5" />,
  },
  {
    title: "Stock",
    href: "/dashboard/stock",
    icon: <Box className="h-5 w-5" />,
  },
  {
    title: "Reportes",
    href: "/dashboard/reportes",
    icon: <BarChart3 className="h-5 w-5" />,
    adminOnly: true,
  },
  {
    title: "Usuarios",
    href: "/dashboard/usuarios",
    icon: <Users className="h-5 w-5" />,
    adminOnly: true,
  },
  {
    title: "Configuración",
    href: "/dashboard/configuracion",
    icon: <Settings className="h-5 w-5" />,
    adminOnly: true,
  },
  {
    title: "Actualizaciones",
    href: "/dashboard/actualizaciones",
    icon: <Sparkles className="h-5 w-5" />,
    id: "changelog",
  },
  {
    title: "Desarrolladores",
    href: "/dashboard/desarrolladores",
    icon: <Users className="h-5 w-5" />,
    adminOnly: true,
  },
]

const CHANGELOG_STORAGE_KEY = "changelog:lastSeenVersion"

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { user } = useAuth()

  const isAdmin = user?.rol === "administrador"
  const filteredNavItems = navItems.filter((item) => !item.adminOnly || (item.adminOnly && isAdmin))

  // Datos del changelog (primer elemento es la versión más reciente)
  const latest = CHANGELOG[0]
  const isLatestRecent = latest ? isRecent(latest.date) : false

  const [lastSeen, setLastSeen] = useState<string | null>(null)
  const unread = latest && lastSeen !== latest.version // no ha visitado aún la versión nueva

  // Al montar: leer localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(CHANGELOG_STORAGE_KEY)
      setLastSeen(stored)
    }
  }, [])

  // Cuando el usuario navega a la página de actualizaciones se marca como visto
  useEffect(() => {
    if (pathname.startsWith("/dashboard/actualizaciones") && latest) {
      localStorage.setItem(CHANGELOG_STORAGE_KEY, latest.version)
      setLastSeen(latest.version)
    }
  }, [pathname, latest])

  const renderNavLink = (item: NavItem) => {
    const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors relative",
          active
            ? "bg-gray-100 text-emerald-600 dark:bg-slate-800 dark:text-emerald-400"
            : "text-gray-600 dark:text-gray-400",
        )}
        onClick={() => setOpen(false)}
      >
        <span className="relative">
          {item.icon}
          {/* Indicador pequeño (dot) si hay cambios no leídos y no estamos dentro de la página */}
          {item.id === "changelog" && unread && !active && (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-950 animate-pulse" />
          )}
        </span>
        <span className="flex-1 truncate">{item.title}</span>
        {/* Badge “Nuevo” (solo cuando es reciente y aún no visto o siempre que sea reciente según prefieras) */}
        {item.id === "changelog" && isLatestRecent && (
          <span
            className={cn(
              "ml-auto text-[10px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5",
              active
                ? "bg-emerald-600 text-white"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
            )}
          >
            Nuevo
          </span>
        )}
      </Link>
    )
  }

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-white dark:bg-slate-950">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Pill className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold text-lg">Boticas Said</span>
          </Link>
        </div>
        <ScrollArea className="flex-1">
          <nav className="grid gap-1 px-2 py-4">
            {filteredNavItems.map(renderNavLink)}
          </nav>
        </ScrollArea>
      </aside>

      {/* Mobile (Sheet) */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="md:hidden fixed left-4 top-3 z-40 bg-white dark:bg-slate-950"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
            <div className="flex h-14 items-center border-b px-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2"
                onClick={() => setOpen(false)}
              >
                <Pill className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold text-lg">Boticas Said</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Cerrar</span>
              </Button>
            </div>
            <ScrollArea className="h-[calc(100vh-3.5rem)]">
              <nav className="grid gap-1 px-2 py-4">
                {filteredNavItems.map(renderNavLink)}
              </nav>
            </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  )
}