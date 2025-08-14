"use client"

import * as React from "react"
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  format
} from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Sparkles, X, Clock } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DateRangePickerProps {
  value: DateRange | undefined
  onChange: (value: DateRange | undefined) => void
  className?: string
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
}

/**
 * DateRangePicker (versión simplificada SOLO con presets, sin calendario).
 * Presets:
 *  - Hoy
 *  - Últimos 7
 *  - Últimos 30
 *  - Este mes
 *  - Mes anterior
 *  - Limpiar
 */
export function DateRangePicker({
  value,
  onChange,
  className,
  side = "bottom",
  align = "start"
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  const label = value?.from
    ? value.to
      ? `${format(value.from, "dd/MM/yyyy", { locale: es })} – ${format(
          value.to,
          "dd/MM/yyyy",
          { locale: es }
        )}`
      : format(value.from, "dd/MM/yyyy", { locale: es })
    : "Seleccionar rango"

  const hasRange = !!(value?.from && value?.to)

  const apply = (dr: DateRange) => {
    onChange(dr)
    setOpen(false)
  }

  const today = startOfDay(new Date())

  const presets: { key: string; label: string; range: DateRange }[] = [
    {
      key: "hoy",
      label: "Hoy",
      range: { from: today, to: endOfDay(today) }
    },
    {
      key: "7",
      label: "Últimos 7",
      range: {
        from: startOfDay(subDays(today, 6)),
        to: endOfDay(today)
      }
    },
    {
      key: "30",
      label: "Últimos 30",
      range: {
        from: startOfDay(subDays(today, 29)),
        to: endOfDay(today)
      }
    },
    {
      key: "mes",
      label: "Este mes",
      range: {
        from: startOfMonth(today),
        to: endOfMonth(today)
      }
    },
    {
      key: "mesPrev",
      label: "Mes anterior",
      range: (() => {
        const prev = subMonths(today, 1)
        return { from: startOfMonth(prev), to: endOfMonth(prev) }
      })()
    }
  ]

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date-range-trigger"
            className={cn(
              "w-full justify-between font-normal relative group",
              "border-border/60 bg-background/70 backdrop-blur",
              hasRange && "border-primary/50"
            )}
            aria-label="Selector rápido de rango de fechas"
          >
            <span className="flex items-center gap-2 truncate">
              <CalendarIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className={cn(!hasRange && "text-muted-foreground")}>{label}</span>
            </span>
            <span className="flex items-center gap-1">
              {hasRange && (
                <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_0_3px_rgba(0,0,0,0.2)]" />
              )}
              <Sparkles className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary/70 transition" />
            </span>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-md bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side={side}
            align={align}
          sideOffset={8}
          className="w-[260px] md:w-[280px] p-0 overflow-hidden border-border/60 backdrop-blur-xl bg-gradient-to-br from-background/90 via-background/70 to-background/60"
        >
          <div className="p-3 space-y-4">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground">
                Rápidos
              </p>
              <div className="grid gap-2">
                {presets.map(p => (
                  <PresetButton
                    key={p.key}
                    label={p.label}
                    active={
                      !!value?.from &&
                      !!value?.to &&
                      !!p.range.from &&
                      !!p.range.to &&
                      value.from.getTime() === p.range.from.getTime() &&
                      value.to.getTime() === p.range.to.getTime()
                    }
                    onClick={() => apply(p.range)}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {hasRange
                  ? `Rango: ${format(value!.from!, "dd/MM")} → ${format(
                      value!.to!,
                      "dd/MM"
                    )}`
                  : "Sin rango seleccionado"}
              </div>
              {hasRange && (
                <div>
                  Días:{" "}
                  <span className="font-medium text-foreground">
                    {Math.max(
                      1,
                      Math.ceil(
                        (endOfDay(value!.to!).getTime() -
                          startOfDay(value!.from!).getTime()) /
                          86400000
                      )
                    )}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  onChange(undefined)
                }}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Limpiar
              </Button>
              <Button
                size="sm"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                Listo
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function PresetButton({
  label,
  onClick,
  active
}: {
  label: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left text-xs px-3 py-2 rounded-md border transition-colors font-medium",
        "bg-muted/40 hover:bg-primary/15 hover:text-primary",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/60",
        active &&
          "border-primary/50 bg-primary/20 text-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.25)]"
      )}
    >
      {label}
    </button>
  )
}