"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { RefreshCw, Wand2 } from "lucide-react"

import { useThemeDesign } from "@/lib/theme-design/provider"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

const GRADIENT_STYLES = [
  { value: "soft", label: "Suave" },
  { value: "vibrant", label: "Vibrante" },
  { value: "radial", label: "Radial" },
  { value: "aurora", label: "Aurora" },
  { value: "mesh", label: "Mesh" }
]

const DENSITY = [
  { value: "compact", label: "Compacto" },
  { value: "normal", label: "Normal" },
  { value: "comfortable", label: "Cómodo" }
]

const CORNERS = [
  { value: "rounded", label: "Redondeado" },
  { value: "mixed", label: "Mixto" },
  { value: "sharp", label: "Cuadrado" }
]

export function AppearanceAdvancedSection() {
  const { theme, setTheme } = useTheme()
  const { tokens, setTokens, reset, apply } = useThemeDesign()
  const [previewKey, setPreviewKey] = useState(0)

  const update = (p: any) => setTokens(p)

  return (
    <div className="space-y-10">
      {/* Colores */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Colores
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <ColorField
              label="Color Principal"
              value={tokens.accent}
              onChange={(v) => update({ accent: v })}
            />
            <ColorField
              label="Color Secundario"
              value={tokens.accentAlt || "#06B6D4"}
              onChange={(v) => update({ accentAlt: v })}
              allowEmpty
            />
          </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Tipo de gradiente</Label>
              <Select
                value={tokens.gradientStyle}
                onValueChange={(v) => update({ gradientStyle: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRADIENT_STYLES.map(g => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          <SliderField
            label="Intensidad Vidrio"
            value={tokens.glass}
            min={0}
            max={1}
            step={0.01}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => update({ glass: v })}
          />
          <SliderField
            label="Sombras"
            value={tokens.shadowIntensity}
            min={0}
            max={1}
            step={0.01}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => update({ shadowIntensity: v })}
          />

          <ToggleRow
            label="Ruido"
            checked={tokens.noise}
            onChange={(c) => update({ noise: c })}
          />
          <ToggleRow
            label="Glow"
            checked={tokens.glow}
            onChange={(c) => update({ glow: c })}
          />
        </div>

        {/* Forma & Layout */}
        <div className="space-y-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Forma & Layout
          </h3>

          <SliderField
            label="Radio / Escala"
            value={tokens.radiusScale}
            min={0.6}
            max={1.6}
            step={0.02}
            format={(v) => `${v.toFixed(2)}x`}
            onChange={(v) => update({ radiusScale: v })}
          />

          <div className="space-y-2">
            <Label className="text-xs font-medium">Esquinas</Label>
            <Select
              value={tokens.cornerStyle}
              onValueChange={(v) => update({ cornerStyle: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CORNERS.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Densidad</Label>
            <Select
              value={tokens.density}
              onValueChange={(v) => update({ density: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DENSITY.map(d => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Fuente Base (opcional)</Label>
            <Input
              placeholder="Ej: 'Inter', system-ui"
              value={tokens.fontFamily || ""}
              onChange={(e) => update({ fontFamily: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium">Fuente Monospace (opcional)</Label>
            <Input
              placeholder="Ej: 'JetBrains Mono', ui-monospace"
              value={tokens.fontMono || ""}
              onChange={(e) => update({ fontMono: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Modo Claro/Oscuro</Label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={theme === "light" ? "default" : "outline"}
                onClick={() => setTheme("light")}
              >
                Claro
              </Button>
              <Button
                size="sm"
                variant={theme === "dark" ? "default" : "outline"}
                onClick={() => setTheme("dark")}
              >
                Oscuro
              </Button>
              <Button
                size="sm"
                variant={theme === "system" ? "default" : "outline"}
                onClick={() => setTheme("system")}
              >
                Sistema
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => { apply(); setPreviewKey(k => k + 1) }}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Aplicar / Refrescar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => reset()}
        >
          <Wand2 className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>

      {/* Previews */}
      <div className="grid gap-4 md:grid-cols-3">
        <PreviewCard key={previewKey} title="Panel" />
        <PreviewCard key={previewKey + 100} title="Botón Primario" variant="primary" />
        <PreviewCard key={previewKey + 200} title="Elemento Lista" variant="list" />
      </div>
    </div>
  )
}

/* ---------------- Sub‑componentes internos ---------------- */

function ColorField({ label, value, onChange, allowEmpty = false }: {
  label: string
  value: string
  onChange: (v: string) => void
  allowEmpty?: boolean
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">{label}</Label>
      <Input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value || (allowEmpty ? "" : value))}
        className="h-11 cursor-pointer"
      />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs"
      />
    </div>
  )
}

function SliderField({ label, value, min, max, step, onChange, format }: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  format?: (v: number) => string
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <Label className="text-xs font-medium">{label}</Label>
        <span>{format ? format(value) : value}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  )
}

function ToggleRow({ label, checked, onChange }: {
  label: string
  checked: boolean
  onChange: (c: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-xs">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

function PreviewCard({ title, variant = "panel" }:{
  title: string
  variant?: "panel" | "primary" | "list"
}) {
  return (
    <div
      className="relative rounded-2xl border border-[var(--surface-border)] p-4 bg-[var(--surface-glass)] backdrop-blur-xl overflow-hidden"
      style={{
        boxShadow: "0 6px 22px -8px rgba(0 0 0 / 0.35), 0 0 0 1px rgba(255 255 255 / 0.04)",
        borderRadius: "var(--radius-base)"
      }}
    >
      <div className="absolute inset-0 pointer-events-none opacity-[var(--noise-opacity)] mix-blend-overlay noise-overlay" />
      <h4 className="mb-2 text-sm font-semibold">{title}</h4>
      {variant === "panel" && (
        <div className="text-xs text-[var(--text-secondary)] space-y-1">
          <p>Superficie vidrio.</p>
          <p>Accent: <span className="inline-block w-3 h-3 rounded-full align-middle" style={{ background: "var(--accent)" }} /></p>
        </div>
      )}
      {variant === "primary" && (
        <button
          className="mt-1 w-full rounded-lg py-2 text-xs font-medium tracking-wide text-white"
          style={{
            background: "var(--gradient-accent)",
            boxShadow: "0 0 0 1px rgba(255 255 255 / 0.25),0 6px 18px -6px var(--accent)"
          }}
        >
          Acción
        </button>
      )}
      {variant === "list" && (
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between rounded-lg px-2 py-1.5 bg-white/40 dark:bg-white/5">
            <span>Item A</span><Badge variant="outline">12</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg px-2 py-1.5 bg-white/30 dark:bg-white/5/50">
            <span>Item B</span><Badge variant="outline">2</Badge>
          </div>
        </div>
      )}
    </div>
  )
}