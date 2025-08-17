"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"
import {
  Home,
  ShoppingCart,
  Plus,
  Receipt,
  History,
  Wallet,
  Pill,
  Box,
  BarChart3,
  Users,
  Settings,
  Sparkles,
  Code2,
  Menu,
  X
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

// Changelog data
import { CHANGELOG, isRecent } from "@/lib/changelog"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  adminOnly?: boolean
  id?: string // for special cases like changelog
}

/* -------------------------------------------------------
   Icon set (composites para darle más semántica visual)
-------------------------------------------------------- */
const Icons = {
  dashboard: <Home className="h-5 w-5" />,
  nuevaVenta: (
    <span className="relative inline-flex">
      <ShoppingCart className="h-5 w-5" />
      <Plus className="h-3 w-3 absolute -right-1 -top-1 rounded-full bg-primary text-primary-foreground p-[1px]" />
    </span>
  ),
  historialVentas: (
    <span className="relative inline-flex">
      <Receipt className="h-5 w-5" />
      <History className="h-3 w-3 absolute -right-1 -bottom-1 opacity-80" />
    </span>
  ),
  caja: <Wallet className="h-5 w-5" />,
  productos: <Pill className="h-5 w-5" />,
  stock: <Box className="h-5 w-5" />,
  reportes: <BarChart3 className="h-5 w-5" />,
  usuarios: <Users className="h-5 w-5" />,
  configuracion: <Settings className="h-5 w-5" />,
  changelog: <Sparkles className="h-5 w-5" />,
  desarrolladores: <Code2 className="h-5 w-5" />
}

/* -------------------------------------------------------
   Navigation Items
-------------------------------------------------------- */
const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Icons.dashboard,
    adminOnly: true
  },
  {
    title: "Vender",
    href: "/dashboard/nueva",
    icon: Icons.nuevaVenta,
  },
  {
    title: "Historial ventas",
    href: "/dashboard/ventas",
    icon: Icons.historialVentas
  },
  {
    title: "Caja",
    href: "/dashboard/caja",
    icon: Icons.caja
  },
  {
    title: "Productos",
    href: "/dashboard/productos",
    icon: Icons.productos
  },
  {
    title: "Stock",
    href: "/dashboard/stock",
    icon: Icons.stock
  },
  {
    title: "Reportes",
    href: "/dashboard/reportes",
    icon: Icons.reportes,
    adminOnly: true
  },
  {
    title: "Usuarios",
    href: "/dashboard/usuarios",
    icon: Icons.usuarios,
    adminOnly: true
  },
  {
    title: "Configuración",
    href: "/dashboard/configuracion",
    icon: Icons.configuracion,
    adminOnly: true
  },
  {
    title: "Actualizaciones",
    href: "/dashboard/actualizaciones",
    icon: Icons.changelog,
    id: "changelog"
  },
  {
    title: "Desarrolladores",
    href: "/dashboard/desarrolladores",
    icon: Icons.desarrolladores,
    adminOnly: true
  }
]

const CHANGELOG_STORAGE_KEY = "changelog:lastSeenVersion"

/* -------------------------------------------------------
   Sidebar Component
-------------------------------------------------------- */
export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { user } = useAuth()

  const isAdmin = user?.rol?.toLowerCase() === "administrador"
  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || (item.adminOnly && isAdmin)
  )

  // Changelog meta
  const latest = CHANGELOG[0]
  const isLatestRecent = latest ? isRecent(latest.date) : false // (por si luego quieres usarlo)
  const [lastSeen, setLastSeen] = useState<string | null>(null)
  const unread = latest && lastSeen !== latest.version

  // Leer localStorage al montar
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(CHANGELOG_STORAGE_KEY)
      setLastSeen(stored)
    }
  }, [])

  // Marcar como leído al entrar a la ruta de actualizaciones
  useEffect(() => {
    if (pathname.startsWith("/dashboard/actualizaciones") && latest) {
      localStorage.setItem(CHANGELOG_STORAGE_KEY, latest.version)
      setLastSeen(latest.version)
    }
  }, [pathname, latest])

  const renderNavLink = (item: NavItem) => {
    const active =
      pathname === item.href ||
      (item.href !== "/dashboard" && pathname.startsWith(item.href))

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition relative outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          active
            ? "bg-primary/10 text-primary dark:bg-primary/15"
            : "text-muted-foreground hover:bg-muted/60 dark:hover:bg-muted/30"
        )}
        onClick={() => setOpen(false)}
      >
        <span className="relative">
          {item.icon}
          {item.id === "changelog" && unread && !active && (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary ring-2 ring-background animate-pulse" />
          )}
        </span>
        <span className="flex-1 truncate">{item.title}</span>
      </Link>
    )
  }

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-background">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Pill className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg tracking-tight">
              Boticas Said
            </span>
          </Link>
        </div>
        <ScrollArea className="flex-1">
          <nav className="grid gap-1 px-2 py-4">
            {filteredNavItems.map(renderNavLink)}
          </nav>
        </ScrollArea>
      </aside>

      {/* Mobile */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="md:hidden fixed left-4 top-3 z-40 bg-background"
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
              <Pill className="h-6 w-6 text-primary" />
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