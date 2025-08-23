export type GradientStyle =
  | "soft"
  | "vibrant"
  | "radial"
  | "aurora"
  | "mesh"

export interface UserDesignTokens {
  accent: string
  accentAlt?: string
  gradientStyle: GradientStyle
  radiusScale: number
  density: "compact" | "normal" | "comfortable"
  glass: number
  noise: boolean
  fontFamily?: string
  fontMono?: string
  shadowIntensity: number
  glow: boolean
  cornerStyle: "rounded" | "mixed" | "sharp"
}

export interface ThemeDesignContextValue {
  tokens: UserDesignTokens
  setTokens: (p: Partial<UserDesignTokens>) => void
  reset: () => void
  apply: () => void
}