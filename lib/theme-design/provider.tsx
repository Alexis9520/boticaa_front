"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback
} from "react"
import { tokensToCssVars, applyThemeVars } from "./apply-vars"
import type { UserDesignTokens, ThemeDesignContextValue } from "./types"

const STORAGE_KEY = "ui:design:v1"

const DEFAULT_TOKENS: UserDesignTokens = {
  accent: "#6366F1",
  accentAlt: "#06B6D4",
  gradientStyle: "soft",
  radiusScale: 1,
  density: "normal",
  glass: 0.55,
  noise: true,
  fontFamily: "",
  fontMono: "",
  shadowIntensity: 0.55,
  glow: true,
  cornerStyle: "rounded"
}

const ThemeDesignContext = createContext<ThemeDesignContextValue | null>(null)

export function ThemeDesignProvider({ children }: { children: React.ReactNode }) {
  const [tokens, setTokensState] = useState<UserDesignTokens>(DEFAULT_TOKENS)

  // Cargar desde localStorage una sola vez
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        setTokensState(prev => ({ ...prev, ...parsed }))
      }
    } catch {}
  }, [])

  // Aplicar variables cada vez que tokens cambie
  useEffect(() => {
    const vars = tokensToCssVars(tokens)
    applyThemeVars(vars)
    // Puedes reflejar densidad en body si quieres:
    try {
      document.body.dataset.density = tokens.density
    } catch {}
  }, [tokens])

  const setTokens = useCallback((patch: Partial<UserDesignTokens>) => {
    setTokensState(prev => {
      const merged = { ...prev, ...patch }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)) } catch {}
      return merged
    })
  }, [])

  const reset = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
    setTokensState(DEFAULT_TOKENS)
  }, [])

  const apply = useCallback(() => {
    const vars = tokensToCssVars(tokens)
    applyThemeVars(vars)
  }, [tokens])

  const value: ThemeDesignContextValue = {
    tokens,
    setTokens,
    reset,
    apply
  }

  return (
    <ThemeDesignContext.Provider value={value}>
      {children}
    </ThemeDesignContext.Provider>
  )
}

export function useThemeDesign() {
  const ctx = useContext(ThemeDesignContext)
  if (!ctx) {
    throw new Error("useThemeDesign debe usarse dentro de <ThemeDesignProvider>")
  }
  return ctx
}