"use client"

import { useCallback, useRef } from "react"

export function useDebouncedCallback(fn: () => void, delay: number, deps: any[] = []) {
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  return useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => fn(), delay)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay, fn, ...deps])
}