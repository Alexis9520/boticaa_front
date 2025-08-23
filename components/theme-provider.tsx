"use client"

import * as React from "react"
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps
} from "next-themes"

export function ThemeProvider(props: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute={props.attribute ?? "class"}
      defaultTheme={props.defaultTheme ?? "system"}
      enableSystem={props.enableSystem ?? true}
      disableTransitionOnChange={props.disableTransitionOnChange ?? true}
      {...props}
    />
  )
}