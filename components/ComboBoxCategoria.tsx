"use client"

import * as React from "react"
import { Check, Plus, Tag, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandInput,
  CommandSeparator
} from "@/components/ui/command"
import { cn } from "@/lib/utils"

const CATEGORIAS_BASE = [
  "Analgésicos","Antibióticos","Antiinflamatorios","Antihistamínicos","Antiácidos",
  "Vitaminas","Antipiréticos","Antisépticos","Anticonceptivos","Antimicóticos",
  "Antiparasitarios","Antivirales","Broncodilatadores","Descongestionantes","Expectorantes",
  "Laxantes","Antidiarreicos","Antieméticos","Antitusivos","Corticoides","Cardiotónicos",
  "Hipoglucemiantes","Insulinas","Suplementos Minerales","Colirios","Soluciones Oftálmicas",
  "Cremas y Pomadas","Jarabes","Inyectables","Productos Naturistas","Productos para Bebés",
  "Productos para Adultos Mayores","Material Médico","Curitas y Vendas","Otros"
]

export interface ComboBoxCategoriaProps {
  value?: string
  onChange: (value: string) => void
  onCreateNew?: (value: string) => void
  label?: string
  placeholder?: string
  allowCreate?: boolean
  allowEmpty?: boolean
  disabled?: boolean
  className?: string
  categories?: string[]
  clearable?: boolean
  size?: "sm" | "md"
  showPreviewBadge?: boolean
  listMaxHeight?: number
}

export function ComboBoxCategoria({
  value,
  onChange,
  onCreateNew,
  label = "",
  placeholder = "Buscar o crear categoría...",
  allowCreate = true,
  allowEmpty = true,
  disabled,
  className,
  categories,
  clearable = true,
  size = "md",
  showPreviewBadge = true,
  listMaxHeight = 260
}: ComboBoxCategoriaProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [data, setData] = React.useState<string[]>(
    () => (categories?.length ? categories : CATEGORIAS_BASE).slice()
  )

  React.useEffect(() => {
    if (categories?.length) setData(categories.slice())
  }, [categories])

  // Debounce ligero manual
  const [debounced, setDebounced] = React.useState(query)
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 110)
    return () => clearTimeout(id)
  }, [query])

  const normalized = debounced.trim().toLowerCase()
  const filtered = React.useMemo(
    () => (normalized ? data.filter(c => c.toLowerCase().includes(normalized)) : data),
    [data, normalized]
  )

  const current = value ?? ""
  const alreadyExists = !!data.find(c => c.toLowerCase() === query.trim().toLowerCase())
  const canCreate = allowCreate && query.trim().length > 1 && !alreadyExists

  function titleCase(str: string) {
    return str
      .toLowerCase()
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  }

  function handleSelect(cat: string) {
    onChange(cat)
    setQuery("")
    setOpen(false)
  }

  function handleCreate() {
    const newCat = titleCase(query.trim())
    if (!newCat) return
    setData(prev => [newCat, ...prev])
    onChange(newCat)
    onCreateNew?.(newCat)
    setQuery("")
    setOpen(false)
  }

  function handleClear(e?: React.MouseEvent | React.KeyboardEvent) {
    e?.stopPropagation()
    onChange("")
    setQuery("")
  }

  function highlight(cat: string) {
    if (!normalized) return cat
    const idx = cat.toLowerCase().indexOf(normalized)
    if (idx === -1) return cat
    return (
      <span>
        {cat.slice(0, idx)}
        <span className="bg-primary/15 rounded px-[2px] py-[1px] font-medium">
          {cat.slice(idx, idx + normalized.length)}
        </span>
        {cat.slice(idx + normalized.length)}
      </span>
    )
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <Label className="text-sm font-medium select-none">{label}</Label>}
      <Popover open={open} onOpenChange={o => !disabled && setOpen(o)}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "justify-between font-normal relative group w-full",
              size === "sm" ? "h-9" : "h-10",
              !current && "text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-2 truncate">
              <Tag className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              {current ? (
                <span className="truncate">{current}</span>
              ) : (
                <span>{placeholder}</span>
              )}
              {showPreviewBadge && current && (
                <Badge variant="secondary" className="ml-1 rounded-full px-2 py-0 h-5 text-[10px]">
                  Seleccionado
                </Badge>
              )}
              {!current && allowEmpty && (
                <Badge variant="outline" className="ml-1 rounded-full px-2 py-0 h-5 text-[10px]">
                  Vacío
                </Badge>
              )}
            </div>
            <div className="absolute right-2 flex items-center gap-1">
              {clearable && !!current && (
                <X
                  onClick={handleClear}
                  className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Limpiar categoría"
                />
              )}
              <ChevronIcon open={open} />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
            className="p-0 w-[--radix-popover-trigger-width] min-w-[260px] shadow-lg border-border/60"
            align="start"
            sideOffset={6}
        >
          <Command shouldFilter={false} className="flex flex-col w-full">
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Buscar..."
              autoFocus
              className="rounded-none"
            />
            {/* Área scroll controlada */}
            <div
              className="overflow-y-auto"
              style={{
                maxHeight: listMaxHeight,
                WebkitOverflowScrolling: "touch",
                overscrollBehavior: "contain"
              }}
            >
              {allowEmpty && (
                <CommandGroup heading="Opciones">
                  <CommandItem
                    value="__none__"
                    onSelect={() => handleSelect("")}
                    className="flex items-center gap-2"
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 text-primary transition-opacity",
                        current === "" ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="text-sm italic text-muted-foreground">
                      Sin categoría
                    </span>
                  </CommandItem>
                </CommandGroup>
              )}

              <CommandGroup heading="Categorías">
                {filtered.map(cat => {
                  const selected = cat === current
                  return (
                    <CommandItem
                      key={cat}
                      value={cat}
                      onSelect={() => handleSelect(cat)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 text-primary transition-opacity",
                          selected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="truncate text-sm">{highlight(cat)}</span>
                    </CommandItem>
                  )
                })}
                {filtered.length === 0 && (
                  <CommandEmpty className="py-6 text-xs text-muted-foreground">
                    Sin coincidencias
                  </CommandEmpty>
                )}
              </CommandGroup>

              {canCreate && (
                <>
                  <CommandSeparator className="my-2" />
                  <CommandGroup heading="Crear nueva">
                    <CommandItem
                      value={`__crear_${query}`}
                      onSelect={handleCreate}
                      className="flex items-center gap-2 text-primary cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>
                        Añadir "<strong>{titleCase(query.trim())}</strong>"
                      </span>
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </div>

            <div className="px-3 py-2 border-t bg-muted/40 text-[11px] text-muted-foreground flex justify-between">
              <span>{current ? "Enter selecciona · Esc cierra" : "Escribe para filtrar"}</span>
              {allowCreate && <span>Selecciona o añade una categoría</span>}
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        d="M5.25 7.75L10 12.25L14.75 7.75"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}