import { UserDesignTokens } from "./types"
import { hexToHsl, buildGradient, normalizeHex } from "./color-utils"

function deriveAlt(hex: string) {
  const { h, s, l } = hexToHsl(hex)
  const newHue = (h + 40) % 360
  return hslToHex(newHue, s, l)
}

function hslToHex(h: number, s: number, l: number) {
  s /= 100; l /= 100
  const k = (n:number)=>(n + h/30)%12
  const a = s * Math.min(l,1-l)
  const f=(n:number)=>{
    const color = l - a * Math.max(-1, Math.min(k(n)-3, Math.min(9-k(n),1)))
    return Math.round(255*color).toString(16).padStart(2,"0")
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

export function tokensToCssVars(tokens: UserDesignTokens) {
  const accent = normalizeHex(tokens.accent)
  const accentAlt = normalizeHex(tokens.accentAlt || deriveAlt(accent))
  const hsl = hexToHsl(accent)
  const altHsl = hexToHsl(accentAlt)
  const gradient = buildGradient(tokens.gradientStyle, accent, accentAlt)

  const radiusBase = 10
  const scale = tokens.radiusScale
  let radius: string
  switch (tokens.cornerStyle) {
    case "sharp": radius = "2px"; break
    case "mixed": radius = `${Math.round(radiusBase*scale)}px ${Math.round(radiusBase*scale/2)}px ${Math.round(radiusBase*scale)}px ${Math.round(radiusBase*scale/2)}px`; break
    default: radius = `${Math.round(radiusBase*scale)}px`
  }

  const densityMap: Record<string,string> = {
    compact: "0.75",
    normal: "1",
    comfortable: "1.25"
  }

  return {
    "--accent-h": `${hsl.h}`,
    "--accent-s": `${hsl.s}%`,
    "--accent-l": `${hsl.l}%`,
    "--accent": `hsl(${hsl.h} ${hsl.s}% ${hsl.l}%)`,
    "--accent-alt": `hsl(${altHsl.h} ${altHsl.s}% ${altHsl.l}%)`,
    "--gradient-accent": gradient,
    "--radius-base": radius,
    "--density-scale": densityMap[tokens.density] || "1",
    "--glass-alpha": `${Math.min(Math.max(tokens.glass,0),1)}`,
    "--noise-opacity": tokens.noise ? "0.15" : "0",
    "--shadow-strength": `${tokens.shadowIntensity}`,
    "--glow-enabled": tokens.glow ? "1" : "0",
    "--font-user": tokens.fontFamily || "var(--font-sans, system-ui)",
    "--font-mono-user": tokens.fontMono || "var(--font-mono, ui-monospace)"
  }
}

export function applyThemeVars(vars: Record<string,string>, target: HTMLElement = document.documentElement) {
  Object.entries(vars).forEach(([k,v]) => target.style.setProperty(k, v))
}