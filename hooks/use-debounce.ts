"use client"

/**
 * Hook mínimo: useDebounceValue
 * Devuelve directamente el valor “debounced”.
 */
import * as React from "react"

export function useDebounceValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = React.useState(value)

  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}

/**
 * Versión avanzada (opcional) con control leading / maxWait y helpers.
 * Devuelve un objeto { value, flush, cancel }.
 */
export interface UseDebounceOptions {
  leading?: boolean
  maxWait?: number
}

export function useDebounce<T>(
  value: T,
  delay: number,
  options: UseDebounceOptions = {}
) {
  const { leading = false, maxWait } = options
  const [debounced, setDebounced] = React.useState<T>(value)

  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const maxTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const leadingFiredRef = React.useRef(false)

  const clearTimers = React.useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current)
    timerRef.current = null
    maxTimerRef.current = null
  }, [])

  const flush = React.useCallback(() => {
    clearTimers()
    setDebounced(value)
    leadingFiredRef.current = true
  }, [value, clearTimers])

  const cancel = React.useCallback(() => {
    clearTimers()
    leadingFiredRef.current = false
  }, [clearTimers])

  React.useEffect(() => {
    if (leading && !leadingFiredRef.current) {
      setDebounced(value)
      leadingFiredRef.current = true
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setDebounced(value)
      leadingFiredRef.current = true
    }, delay)

    if (maxWait && !maxTimerRef.current) {
      maxTimerRef.current = setTimeout(() => {
        flush()
      }, maxWait)
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [value, delay, leading, maxWait, flush])

  React.useEffect(() => () => clearTimers(), [clearTimers])

  return { value: debounced, flush, cancel }
}

/**
 * Si quieres un callback debounced (similar a lodash.debounce)
 */
export function useDebouncedCallback<Args extends any[]>(
  fn: (...args: Args) => void,
  delay: number
) {
  const fnRef = React.useRef(fn)
  fnRef.current = fn

  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const run = React.useCallback((...args: Args) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      fnRef.current(...args)
    }, delay)
  }, [delay])

  const cancel = React.useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
  }, [])

  const flush = React.useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
      // No tenemos args almacenados aquí (versión simple),
      // podrías extender para guardarlos si lo necesitas.
    }
  }, [])

  React.useEffect(() => () => cancel(), [cancel])

  return { run, cancel, flush }
}