"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"
import { BarChart3, Box, ClipboardList, CreditCard, Home, Package, Pill, Settings, Users, X, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  adminOnly?: boolean
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
    title: "Desarrolladores",
    href: "/dashboard/desarrolladores",
    icon: <Users className="h-5 w-5" />,
    adminOnly: true,
  },
  
]

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { user } = useAuth()

  const isAdmin = user?.rol === "administrador"

  const filteredNavItems = navItems.filter((item) => !item.adminOnly || (item.adminOnly && isAdmin))

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 border-r bg-white dark:bg-slate-950">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Pill className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold text-lg">Boticas Said</span>
          </Link>
        </div>
        <ScrollArea className="flex-1">
          <nav className="grid gap-1 px-2 py-4">
            {filteredNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors",
                  pathname === item.href
                    ? "bg-gray-100 text-emerald-600 dark:bg-slate-800 dark:text-emerald-400"
                    : "text-gray-600 dark:text-gray-400",
                )}
              >
                {item.icon}
                {item.title}
              </Link>
            ))}
          </nav>
        </ScrollArea>
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden fixed left-4 top-3 z-40">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <div className="flex h-14 items-center border-b px-4">
            <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setOpen(false)}>
              <Pill className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold text-lg">Boticas Said</span>
            </Link>
            <Button variant="ghost" size="icon" className="ml-auto" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <ScrollArea className="h-[calc(100vh-3.5rem)]">
            <nav className="grid gap-1 px-2 py-4">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors",
                    pathname === item.href
                      ? "bg-gray-100 text-emerald-600 dark:bg-slate-800 dark:text-emerald-400"
                      : "text-gray-600 dark:text-gray-400",
                  )}
                  onClick={() => setOpen(false)}
                >
                  {item.icon}
                  {item.title}
                </Link>
              ))}
            </nav>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  )
}
