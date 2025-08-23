"use client"

import { useState, useEffect, useRef } from "react"

export function useLocalStorageState<T>(
  key: string,
  initial: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initial)
  const loaded = useRef(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw) setValue(JSON.parse(raw))
    } catch {}
    loaded.current = true
  }, [key])

  useEffect(() => {
    if (!loaded.current) return
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {}
  }, [key, value])

  return [value, setValue]
}