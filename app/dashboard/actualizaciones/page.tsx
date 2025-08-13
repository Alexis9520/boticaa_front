"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/components/auth-provider"
import Spinner from "@/components/ui/Spinner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { CalendarDays, ChevronDown, Link2, Layers, ArrowUp, Sparkles, Users } from "lucide-react"

/* ================= Tipos ================= */
type ChangeType = "added" | "changed" | "fixed" | "removed" | "security" | "internal"
interface ChangeEntry {
  type: ChangeType
  title: string
  description?: string
  issueRef?: string | number
  breaking?: boolean
}
interface VersionLog {
  version: string
  date: string      // YYYY-MM-DD
  tag?: string
  entries: ChangeEntry[]
}

/* ============================================================
   CHANGELOG
   Agregada versión 1.4.2 (2025-08-13) con las mejoras solicitadas:
   - Visualización de movimientos por usuario (ventas / caja)
   - Reordenamiento de tablas de cajas (orden por fecha descendente, multi-sort)
   - Más características visibles en detalle de venta
   SemVer: se usa incremento PATCH porque son mejoras incrementales
   sin cambios incompatibles en API pública.
   ============================================================ */
const CHANGELOG: VersionLog[] = [
  {
    version: "1.4.2",
    date: "2025-08-13",
    tag: "stable",
    entries: [
      
      {
        type: "changed",
        title: "Orden de tablas de cajas",
        description: "Listados ahora se ordenan por fecha de apertura descendente y soportan ordenamiento secundario estable."
      },
      {
        type: "added",
        title: "Más características visibles en detalle de venta",
        description: "Se muestran columnas y etiquetas adicionales (método de pago combinado, totales segmentados, usuario de registro)."
      },
      {
        type: "fixed",
        title: "Consistencia de totales tras filtrar por usuario",
        description: "Los subtotales ya no se recalculan con desajustes al alternar usuarios rápidamente."
      },
      {
        type: "internal",
        title: "Refactor de consultas de historial de caja",
        description: "Se consolidó la lógica para reducir consultas N+1 y preparar soporte de paginación."
      }
    ]
  },
  {
    version: "1.4.1",
    date: "2025-08-11",
    tag: "stable",
    entries: [
      {
        type: "fixed",
        title: "Corrección de zona horaria",
        description: "Validaciones y controles ahora usan America/Lima y no la hora del servidor."
      },
      {
        type: "fixed",
        title: "Acceso post-horario",
        description: "Los trabajadores no quedan bloqueados injustamente por desfase horario del servidor."
      }
    ]
  },
  {
    version: "1.4.0",
    date: "2025-08-10",
    entries: [
      {
        type: "added",
        title: "Principio activo en productos",
        description: "Campo para registrar el componente farmacológico principal."
      },
      {
        type: "added",
        title: "Tipo de medicamento (genérico / marca)",
        description: "Clasificación que permite mejores filtros y reportes."
      },
      {
        type: "added",
        title: "Código de lote",
        description: "Soporte de lote por producto para trazabilidad y control de vencimientos."
      },
      {
        type: "fixed",
        title: "Actualización de productos",
        description: "Errores al editar se corrigieron (validaciones y persistencia)."
      }
    ]
  },
  {
    version: "1.3.9",
    date: "2025-08-08",
    tag: "security",
    entries: [
      {
        type: "security",
        title: "Cambio de contraseña (solo administradores)",
        description: "Funcionalidad para que administradores gestionen credenciales de usuarios."
      },
      {
        type: "security",
        title: "Restricción de acceso fuera del horario",
        description: "Trabajadores no pueden iniciar sesión después de su hora de salida."
      },
      {
        type: "security",
        title: "Ingreso exclusivo para cierre de caja",
        description: "Si no cerraron caja a tiempo, solo se les permite entrar para cerrarla."
      }
    ]
  },
  {
    version: "1.3.8",
    date: "2025-08-06",
    entries: [
      {
        type: "added",
        title: "Más estadísticas en el Dashboard",
        description: "Nuevas métricas para mayor visibilidad del rendimiento."
      },
      {
        type: "fixed",
        title: "Movimientos de caja",
        description: "Corrección de inconsistencias en registro y visualización."
      }
    ]
  },
  {
    version: "1.3.7",
    date: "2025-08-05",
    entries: [
      {
        type: "fixed",
        title: "Orden de boletas",
        description: "Listado organizado y consistente."
      },
      {
        type: "added",
        title: "Personalización de boleta",
        description: "Formato y aspectos visuales configurables."
      }
    ]
  },
  {
    version: "1.3.6",
    date: "2025-08-04",
    entries: [
      {
        type: "fixed",
        title: "Visual del Dashboard",
        description: "Corrección de desalineaciones y componentes que no cargaban."
      }
    ]
  },
]

const LATEST_VERSION = CHANGELOG[0]?.version
function isRecent(dateStr: string) {
  const diffDays = (Date.now() - new Date(dateStr + "T00:00:00").getTime()) / 86400000
  return diffDays <= 7
}

/* ================= Utilidades UI ================= */
const TYPE_LABEL: Record<ChangeType,string> = {
  added:"Añadido", changed:"Cambiado", fixed:"Corregido",
  removed:"Eliminado", security:"Seguridad", internal:"Interno"
}
const TYPE_STYLE: Record<ChangeType,string> = {
  added:"", changed:"bg-secondary text-secondary-foreground",
  fixed:"border border-emerald-500 text-emerald-600",
  removed:"bg-destructive text-destructive-foreground",
  security:"border border-amber-500 text-amber-600",
  internal:"border border-muted-foreground text-muted-foreground"
}

function TypeBadge({ type }: { type: ChangeType }) {
  const base = "rounded px-2 py-0.5 text-[10px] font-medium whitespace-nowrap"
  return <span className={`${base} ${TYPE_STYLE[type]}`}>{TYPE_LABEL[type]}</span>
}

/* ================= Bloque de Versión ================= */
function VersionBlock({ version, index, expandAll }: { version: VersionLog; index: number; expandAll: boolean }) {
  const [open, setOpen] = useState(index === 0 || expandAll)

  useEffect(() => {
    setOpen(expandAll || index === 0)
  }, [expandAll, index])

  const anchorId = `v-${version.version.replace(/\./g,"-")}`
  const recent = isRecent(version.date)

  const copyLink = (e: any) => {
    e.stopPropagation()
    const url = window.location.href.split("#")[0] + "#" + anchorId
    navigator.clipboard.writeText(url)
  }

  return (
    <Card id={anchorId} className={`transition-all ${index===0 ? "border-primary/70 shadow-md" : ""}`}>
      <CardHeader
        className="cursor-pointer pb-3"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center flex-wrap gap-3">
            <h2 className="font-semibold text-lg">v{version.version}</h2>
            {version.tag && <Badge variant="outline" className="uppercase text-[10px]">{version.tag}</Badge>}
            {index===0 && <Badge className="text-[10px]">Última</Badge>}
            {recent && <Badge variant="secondary" className="text-[10px]">Nuevo</Badge>}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              {version.date}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={copyLink}>
              <Link2 className="h-3.5 w-3.5 mr-1" /> Link
            </Button>
            <Button size="sm" variant="ghost" className={`h-7 text-xs gap-1 ${open ? "" : "opacity-70"}`}>
              {open ? "Ocultar" : "Ver"}
              <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      {open && (
        <CardContent className="pt-0">
          <div className="relative mt-2 pl-5">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
            <ul className="space-y-4">
              {version.entries.map((e, i) => (
                <li key={i} className="relative pl-4">
                  <span className="absolute left-[-9px] top-2 h-2 w-2 rounded-full bg-primary ring-4 ring-background" />
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <TypeBadge type={e.type} />
                    {e.breaking && (
                      <span className="rounded bg-destructive text-destructive-foreground px-2 py-0.5 text-[10px] uppercase tracking-wide">
                        Breaking
                      </span>
                    )}
                    {e.issueRef && (
                      <span className="rounded border px-2 py-0.5 text-[10px]">
                        Ref: {e.issueRef}
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium text-sm leading-snug">{e.title}</h3>
                  {e.description && (
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {e.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

/* ================= Página ================= */
export default function ActualizacionesPage() {
  const { user, loading } = useAuth()

  const [q, setQ] = useState("")
  const [types, setTypes] = useState<ChangeType[]>([])
  const [expandAll, setExpandAll] = useState(false)
  const [showTop, setShowTop] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return CHANGELOG
      .map(v => ({
        ...v,
        entries: v.entries.filter(e => {
          const matchText =
            !query ||
            e.title.toLowerCase().includes(query) ||
            (e.description?.toLowerCase().includes(query))
          const matchType = types.length === 0 || types.includes(e.type)
            return matchText && matchType
        })
      }))
      .filter(v => v.entries.length > 0)
  }, [q, types])

  if (loading || !user) return <Spinner />

  const toggleType = (t: ChangeType) => {
    setTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }
  const resetFilters = () => { setQ(""); setTypes([]) }

  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Historial de cambios
        </h1>
        <p className="text-sm text-muted-foreground">
          Novedades, mejoras y correcciones. Última versión: v{LATEST_VERSION}
        </p>
      </header>

      {/* Filtros */}
      <div className="grid gap-5 md:grid-cols-3 items-start">
        <div className="space-y-2 md:col-span-1">
            <label className="text-xs font-medium text-muted-foreground">Buscar</label>
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Filtrar por texto..." />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">Tipos</label>
          <div className="flex flex-wrap gap-2">
            {(["added","changed","fixed","removed","security","internal"] as ChangeType[]).map(t => {
              const active = types.includes(t)
              return (
                <button
                  key={t}
                  onClick={() => toggleType(t)}
                  className={`text-xs rounded px-2 py-1 border transition select-none ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-muted"
                  }`}
                  type="button"
                >
                  {TYPE_LABEL[t]}
                </button>
              )
            })}
            {types.length > 0 && (
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={resetFilters}>
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Acciones globales */}
      <div className="flex flex-wrap gap-3">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setExpandAll(e => !e)}
          className="h-8 text-xs"
        >
          <Layers className="h-3.5 w-3.5 mr-1" />
          {expandAll ? "Colapsar todo" : "Expandir todo"}
        </Button>
      </div>

      {/* Lista de versiones */}
      <div className="space-y-6">
        {filtered.length === 0 && (
          <div className="text-sm text-muted-foreground py-12 text-center border rounded-md">
            No hay resultados con los filtros actuales.
          </div>
        )}
        {filtered.map((v, i) => (
          <VersionBlock
            key={v.version}
            version={v}
            index={i}
            expandAll={expandAll}
          />
        ))}
      </div>

      {/* Botón volver arriba */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}