export function hexToHsl(hex: string) {
  let h = hex.replace("#", "").trim()
  if (h.length === 3) h = h.split("").map(c => c + c).join("")
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return { h: 210, s: 60, l: 50 }
  const r = parseInt(h.slice(0,2),16)/255
  const g = parseInt(h.slice(2,4),16)/255
  const b = parseInt(h.slice(4,6),16)/255
  const max = Math.max(r,g,b)
  const min = Math.min(r,g,b)
  let hue = 0
  let sat = 0
  const lum = (max+min)/2
  const d = max - min
  if (d !== 0) {
    sat = lum > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: hue = (g - b)/d + (g < b ? 6 : 0); break
      case g: hue = (b - r)/d + 2; break
      case b: hue = (r - g)/d + 4; break
    }
    hue /= 6
  }
  return { h: Math.round(hue*360), s: Math.round(sat*100), l: Math.round(lum*100) }
}

export function normalizeHex(val: string): string {
  let x = val.trim()
  if (!x.startsWith("#")) x = "#"+x
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(x) ? x : "#6366F1"
}

export function buildGradient(style: string, a: string, b: string) {
  switch (style) {
    case "vibrant":
      return `linear-gradient(135deg, ${a} 0%, ${b} 50%, ${a} 100%)`
    case "radial":
      return `radial-gradient(circle at 30% 30%, ${a} 0%, ${b} 70%, transparent 100%)`
    case "aurora":
      return `linear-gradient(120deg, ${a} 0%, ${a}66 30%, ${b}cc 60%, ${b} 100%)`
    case "mesh":
      return `radial-gradient(circle at 20% 30%, ${a} 0%, transparent 60%), radial-gradient(circle at 80% 70%, ${b} 0%, transparent 55%), linear-gradient(135deg, ${a}20, ${b}10)`
    case "soft":
    default:
      return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`
  }
}