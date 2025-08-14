"use client"

import * as React from "react"
import {
  Bar,
  ComposedChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
  Area,
} from "recharts"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

/**
 * Tipos
 */
export type VentasPorHora = {
  hora: string
  total: number
}

interface SalesChartProps {
  data: VentasPorHora[]
  height?: number
  currencySymbol?: string
  showAverageLine?: boolean
  showTrendArea?: boolean
  showGrid?: boolean
  animate?: boolean
  barRadius?: number
  maxBarSize?: number
  className?: string
  tooltipLabel?: string
  gradientStopsLight?: [string, string]
  gradientStopsDark?: [string, string]
  accentLineColorLight?: string
  accentLineColorDark?: string
  emptyMessage?: string
  /**
   * Formatea el valor que aparece en tooltip y eje Y (si no se provee, se usa formato por defecto S/ n.nn)
   */
  valueFormatter?: (value: number) => string
}

/**
 * Componente futurista de gráfico de ventas por hora.
 * - Gradiente dinámico según tema
 * - Línea de tendencia + área suave (opcional)
 * - Línea de promedio (opcional)
 * - Tooltip custom con glassmorphism
 * - Placeholder elegante sin datos
 */
export default function SalesChart(props: SalesChartProps) {
  const {
    data,
    height = 300,
    currencySymbol = "S/",
    showAverageLine = true,
    showTrendArea = true,
    showGrid = true,
    animate = true,
    barRadius = 6,
    maxBarSize = 48,
    className,
    tooltipLabel = "Ventas",
    gradientStopsLight = ["#22c55e", "#059669"], // verde
    gradientStopsDark = ["#34d399", "#10b981"],
    accentLineColorLight = "#6366f1",
    accentLineColorDark = "#818cf8",
    emptyMessage = "No hay datos de ventas por hora.",
    valueFormatter,
  } = props

  const { theme } = useTheme()
  const isDark = theme === "dark"

  if (!data || data.length === 0) {
    return <EmptyState message={emptyMessage} className={className} />
  }

  const totals = data.map(d => d.total)
  const max = totals.length ? Math.max(...totals) : 0
  const avg = totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : 0

  // Eje Y tick formatter
  const fmt = (v: number) => (valueFormatter ? valueFormatter(v) : `${currencySymbol} ${v.toLocaleString("es-PE")}`)

  const gradientId = React.useId()
  const lineGradientId = React.useId()
  const areaGradientId = React.useId()
  const barG1 = isDark ? gradientStopsDark[0] : gradientStopsLight[0]
  const barG2 = isDark ? gradientStopsDark[1] : gradientStopsLight[1]
  const accentLine = isDark ? accentLineColorDark : accentLineColorLight

  return (
    <div
      className={cn(
        "relative rounded-xl border border-border/40 bg-gradient-to-br from-background/80 via-background/60 to-background/40 backdrop-blur-md p-3",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_4px_24px_-6px_rgba(0,0,0,0.35)]",
        className
      )}
    >
      <ChartBackgroundFX />
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={data}
          margin={{ top: 10, right: 14, left: 0, bottom: 4 }}
        >
          {/* Definiciones de gradientes / patterns */}
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={barG1} stopOpacity={0.95} />
                <stop offset="85%" stopColor={barG2} stopOpacity={0.4} />
                <stop offset="100%" stopColor={barG2} stopOpacity={0.1} />
              </linearGradient>

              <linearGradient id={lineGradientId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={accentLine} stopOpacity={0.1} />
                <stop offset="20%" stopColor={accentLine} stopOpacity={0.55} />
                <stop offset="80%" stopColor={accentLine} stopOpacity={0.55} />
                <stop offset="100%" stopColor={accentLine} stopOpacity={0.1} />
              </linearGradient>

              <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accentLine} stopOpacity={0.35} />
                <stop offset="60%" stopColor={accentLine} stopOpacity={0.08} />
                <stop offset="100%" stopColor={accentLine} stopOpacity={0} />
              </linearGradient>
            </defs>

          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 4"
              stroke={isDark ? "rgba(148,163,184,0.15)" : "rgba(100,116,139,0.18)"}
              vertical={false}
            />
          )}

          <XAxis
            dataKey="hora"
            stroke={isDark ? "#8b9fb4" : "#64748b"}
            tickLine={false}
            axisLine={false}
            fontSize={12}
            dy={2}
          />
          <YAxis
            stroke={isDark ? "#91a6bc" : "#64748b"}
            tickLine={false}
            axisLine={false}
            fontSize={11}
            width={70}
            tickFormatter={v => fmt(v)}
          />
          <Tooltip
            cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}
            content={({ active, payload, label }) => (
              <CustomTooltip
                active={active}
                payload={payload}
                label={label}
                currencySymbol={currencySymbol}
                labelKey="Hora"
                valueFormatter={valueFormatter}
                tooltipLabel={tooltipLabel}
                avg={avg}
              />
            )}
          />

          {showAverageLine && avg > 0 && (
            <ReferenceLine
              y={avg}
              stroke={accentLine}
              strokeDasharray="4 4"
              strokeWidth={1.2}
              label={{
                value: `Prom: ${fmt(avg)}`,
                fill: accentLine,
                fontSize: 11,
                position: "right"
              }}
            />
          )}

          {showTrendArea && (
            <Area
              type="monotone"
              dataKey="total"
              stroke={`url(#${lineGradientId})`}
              strokeWidth={2.2}
              fill={`url(#${areaGradientId})`}
              dot={false}
              isAnimationActive={animate}
            />
          )}

          <Bar
            dataKey="total"
            fill={`url(#${gradientId})`}
            radius={[barRadius, barRadius, 0, 0]}
            maxBarSize={maxBarSize}
            isAnimationActive={animate}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Footer info (resumen) */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
        <span>
          Máx:{" "}
          <strong className="text-foreground">
            {fmt(max)}
          </strong>
        </span>
        <span>
          Promedio:{" "}
          <strong className="text-foreground">
            {fmt(avg)}
          </strong>
        </span>
        <span className="hidden sm:inline">
          Horas: <strong className="text-foreground">{data.length}</strong>
        </span>
      </div>
    </div>
  )
}

/* -------------------- Tooltip personalizado -------------------- */
interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
  currencySymbol: string
  labelKey: string
  tooltipLabel: string
  valueFormatter?: (value: number) => string
  avg: number
}

function CustomTooltip({
  active,
  payload,
  label,
  currencySymbol,
  labelKey,
  tooltipLabel,
  valueFormatter,
  avg
}: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null
  const val = payload[0].value as number
  const fmtd = valueFormatter ? valueFormatter(val) : `${currencySymbol} ${val.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`
  const diffPct = avg > 0 ? ((val - avg) / avg) * 100 : 0
  const diffSign = diffPct >= 0 ? "+" : ""
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 shadow-lg backdrop-blur-md",
        "bg-background/70 border-border/60 min-w-[160px]"
      )}
    >
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
        {labelKey}: <span className="text-foreground">{label}</span>
      </p>
      <div className="flex items-center justify-between text-sm font-medium">
        <span>{tooltipLabel}</span>
        <span className="tabular-nums">{fmtd}</span>
      </div>
      <div className="mt-1 text-[11px] flex justify-between">
        <span className="text-muted-foreground">vs prom</span>
        <span
          className={diffPct >= 0 ? "text-emerald-500 tabular-nums" : "text-red-500 tabular-nums"}
        >
          {diffSign}{diffPct.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

/* -------------------- Placeholder sin datos -------------------- */
function EmptyState({ message, className }: { message: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center h-[300px] rounded-xl border border-dashed border-border/50",
        "text-sm text-muted-foreground gap-2 bg-gradient-to-br from-background/70 via-background/40 to-background/30 backdrop-blur-sm",
        className
      )}
    >
      <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center ring-1 ring-border/50">
        <span className="text-xs font-medium">—</span>
      </div>
      <p>{message}</p>
      <p className="text-[11px] text-muted-foreground/70">
        Se mostrará el gráfico cuando existan registros
      </p>
    </div>
  )
}

/* -------------------- Decoración sutil de fondo interno -------------------- */
function ChartBackgroundFX() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.35] mix-blend-overlay bg-[radial-gradient(circle_at_25%_30%,hsl(var(--primary)/0.25),transparent_60%),radial-gradient(circle_at_80%_70%,hsl(var(--secondary)/0.25),transparent_55%)]" />
      <div className="absolute -top-10 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-primary/20 blur-2xl" />
    </div>
  )
}
