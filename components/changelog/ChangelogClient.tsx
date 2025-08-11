"use client"

import { useMemo, useState, useEffect } from "react"
import { CHANGELOG, ChangeType, LATEST_VERSION } from "@/lib/changelog"
import { VersionBlock } from "./VersionBlock"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUp, FilterX, Layers } from "lucide-react"

const TYPE_ORDER: ChangeType[] = ["added", "changed", "fixed", "removed", "security", "internal"]

export function ChangelogClient() {
  const [query, setQuery] = useState("")
  const [types, setTypes] = useState<ChangeType[]>([])
  const [expandAll, setExpandAll] = useState(false)
  const [showGoTop, setShowGoTop] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setShowGoTop(window.scrollY > 300)
    }
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const toggleType = (t: ChangeType) => {
    setTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  const resetFilters = () => {
    setQuery("")
    setTypes([])
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CHANGELOG
      .map(v => ({
        ...v,
        entries: v.entries.filter(e => {
          const textMatches =
            !q ||
            e.title.toLowerCase().includes(q) ||
            (e.description?.toLowerCase().includes(q))
          const typeMatches =
            types.length === 0 || types.includes(e.type)
          return textMatches && typeMatches
        })
      }))
      .filter(v => v.entries.length > 0)
  }, [query, types])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight">
          Historial de cambios
        </h1>
        <p className="text-sm text-muted-foreground">
          Aquí encontrarás las mejoras, correcciones y novedades del sistema. Versión más reciente: v{LATEST_VERSION}
        </p>
      </div>

      {/* Filtros */}
      <div className="grid gap-5 md:grid-cols-3 items-start">
        <div className="space-y-2 md:col-span-1">
            <label className="text-xs font-medium text-muted-foreground">Buscar</label>
            <Input
              placeholder="Filtrar por texto..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">Tipos</label>
          <div className="flex flex-wrap gap-2">
            {TYPE_ORDER.map(t => {
              const active = types.includes(t)
              const labelMap: Record<ChangeType,string> = {
                added:"Añadido", changed:"Cambiado", fixed:"Corregido",
                removed:"Eliminado", security:"Seguridad", internal:"Interno"
              }
              return (
                <Badge
                  key={t}
                  onClick={() => toggleType(t)}
                  variant={active ? "default" : "outline"}
                  className={`cursor-pointer select-none text-xs ${active ? "" : "opacity-70 hover:opacity-100"}`}
                >
                  {labelMap[t]}
                </Badge>
              )
            })}
            {types.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={resetFilters}
              >
                <FilterX className="h-3.5 w-3.5 mr-1" />
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

      {/* Lista */}
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
            defaultOpen={expandAll || i === 0}
          />
        ))}
      </div>

      {/* Botón flotante ir arriba */}
      {showGoTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition"
          aria-label="Ir arriba"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}