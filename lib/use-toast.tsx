"use client"

import * as React from "react"

import type {
  ToastActionElement,
  ToastProps as UIToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 4
const DEFAULT_DURATION = 4500

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()
const toastDurations = new Map<string, number>()

export type FuturisticVariant =
  | "default"
  | "success"
  | "info"
  | "warning"
  | "destructive"

type InternalToastExtra = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  duration?: number
  variant?: FuturisticVariant
  icon?: React.ReactNode
  disableProgress?: boolean
}

export type ToasterToast = UIToastProps & InternalToastExtra

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes
type Action =
  | { type: ActionType["ADD_TOAST"]; toast: ToasterToast }
  | { type: ActionType["UPDATE_TOAST"]; toast: Partial<ToasterToast> & { id: string } }
  | { type: ActionType["DISMISS_TOAST"]; toastId?: ToasterToast["id"] }
  | { type: ActionType["REMOVE_TOAST"]; toastId?: ToasterToast["id"] }

interface State {
  toasts: ToasterToast[]
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return { ...state, toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) }
    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      }
    case "DISMISS_TOAST": {
      const { toastId } = action
      if (toastId) queueRemoval(toastId)
      else state.toasts.forEach((t) => queueRemoval(t.id))
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          !toastId || t.id === toastId ? { ...t, open: false } : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (!action.toastId) {
        return { ...state, toasts: [] }
      }
      toastTimeouts.delete(action.toastId)
      toastDurations.delete(action.toastId)
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.toastId) }
  }
}

const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((l) => l(memoryState))
}

function queueRemoval(toastId: string) {
  if (toastTimeouts.has(toastId)) return
  const dur = toastDurations.get(toastId)
  if (dur === Infinity) return
  const timeout = setTimeout(() => {
    dispatch({ type: "REMOVE_TOAST", toastId })
  }, 420) // tiempo para animación de salida
  toastTimeouts.set(toastId, timeout)
}

export type CreateToastOptions = Omit<ToasterToast, "id" | "open" | "onOpenChange">

function inferDefaultIcon(variant?: FuturisticVariant): React.ReactNode {
  switch (variant) {
    case "success":
      return (
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/50 shadow-[0_0_8px_-2px_rgba(16,185,129,0.6)]">
          ✓
        </span>
      )
    case "info":
      return (
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/50 shadow-[0_0_8px_-2px_rgba(6,182,212,0.6)]">
          i
        </span>
      )
    case "warning":
      return (
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/50 shadow-[0_0_8px_-2px_rgba(245,158,11,0.6)]">
          !
        </span>
      )
    case "destructive":
      return (
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/50 shadow-[0_0_8px_-2px_rgba(244,63,94,0.6)]">
          ×
        </span>
      )
    default:
      return (
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/50 shadow-[0_0_8px_-2px_rgba(99,102,241,0.6)]">
          •
        </span>
      )
  }
}

export function toast(opts: CreateToastOptions) {
  const id = genId()
  const {
    duration = DEFAULT_DURATION,
    variant = "default",
    icon = inferDefaultIcon(variant),
    ...rest
  } = opts

  if (duration !== Infinity) {
    toastDurations.set(id, duration)
    setTimeout(() => {
      dispatch({ type: "DISMISS_TOAST", toastId: id })
    }, duration)
  } else {
    toastDurations.set(id, Infinity)
  }

  dispatch({
    type: "ADD_TOAST",
    toast: {
      id,
      variant,
      icon,
      open: true,
      duration,
      ...rest,
      onOpenChange: (open) => {
        if (!open) dispatch({ type: "DISMISS_TOAST", toastId: id })
      },
    },
  })

  return {
    id,
    dismiss: () => dispatch({ type: "DISMISS_TOAST", toastId: id }),
    update: (patch: Partial<ToasterToast>) =>
      dispatch({ type: "UPDATE_TOAST", toast: { id, ...patch } }),
  }
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const i = listeners.indexOf(setState)
      if (i > -1) listeners.splice(i, 1)
    }
  }, [])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) =>
      dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

