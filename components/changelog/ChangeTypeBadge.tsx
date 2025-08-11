"use client"

import { Badge } from "@/components/ui/badge"
import { ChangeType } from "@/lib/changelog"
import { cn } from "@/lib/utils"

const config: Record<ChangeType, { label: string; className?: string; variant?: "default" | "secondary" | "outline" | "destructive" }> = {
  added:    { label: "Añadido",  variant: "default" },
  changed:  { label: "Cambiado", variant: "secondary" },
  fixed:    { label: "Corregido", variant: "outline", className: "border-emerald-500 text-emerald-600" },
  removed:  { label: "Eliminado", variant: "destructive" },
  security: { label: "Seguridad", variant: "outline", className: "border-amber-500 text-amber-600" },
  internal: { label: "Interno", variant: "outline", className: "border-muted-foreground text-muted-foreground" }
}

export function ChangeTypeBadge({ type }: { type: ChangeType }) {
  const c = config[type]
  return (
    <Badge variant={c.variant} className={cn("capitalize text-xs", c.className)}>
      {c.label}
    </Badge>
  )
}

export function BreakingBadge() {
  return (
    <Badge variant="destructive" className="uppercase text-[10px] tracking-wide">
      Breaking
    </Badge>
  )
}