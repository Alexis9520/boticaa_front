"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FuturisticVariant } from "@/lib/use-toast"

/* =========================================================
   PROVIDER
   ========================================================= */
export const ToastProvider = ToastPrimitives.Provider

/* =========================================================
   VIEWPORT (Bottom Right, Futuristic Layout)
   ========================================================= */
export const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      // Base positioning
      "pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-[380px] flex-col gap-4",
      // Padding & stacking
      "p-2 sm:p-4",
      // Mobile safe-area
      "pb-[calc(env(safe-area-inset-bottom)+1rem)] pr-[calc(env(safe-area-inset-right)+1rem)]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

/* =========================================================
   VARIANT STYLES
   Each variant gets:
     - Layered glass gradient
     - Neon aura (using ::after mask)
     - Inner subtle panel (using ::before)
   ========================================================= */
const basePanel =
  "group relative flex w-full overflow-hidden rounded-2xl px-5 py-4 sm:px-6 sm:py-5 backdrop-blur-xl border border-white/10 shadow-[0_8px_28px_-6px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.05)]"

const animationClasses = [
  "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-6 data-[state=open]:duration-300",
  "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-bottom-4 data-[state=closed]:duration-250",
  // Swipe gestures (vertical)
  "data-[swipe=move]:translate-y-[var(--radix-toast-swipe-move-y)] data-[swipe=cancel]:translate-y-0 data-[swipe=cancel]:duration-200 data-[swipe=end]:animate-out data-[swipe=end]:slide-out-to-bottom-20 data-[swipe=end]:duration-200"
].join(" ")

const layeredEffect =
  // before: inner sheen / panel
  "before:absolute before:inset-0 before:rounded-[inherit] before:[background:linear-gradient(160deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.05)_32%,rgba(255,255,255,0)_100%)] before:opacity-60 before:pointer-events-none" +
  // after: rotating holographic ring (masked)
  " after:pointer-events-none after:absolute after:-inset-px after:-z-10 after:rounded-[inherit] after:opacity-0 after:transition-opacity after:duration-700 after:[background:conic-gradient(from_0deg,rgba(255,255,255,0.35)_0deg,rgba(255,255,255,0)_130deg,rgba(255,255,255,0.35)_300deg,rgba(255,255,255,0)_360deg)] after:[mask:radial-gradient(circle_at_center,black_55%,transparent_61%)] group-hover:after:opacity-60"

const variantBackgrounds = {
  default:
    "bg-[linear-gradient(135deg,rgba(24,27,38,0.85)_0%,rgba(30,35,48,0.72)_55%,rgba(18,20,28,0.9)_100%)] data-[state=open]:after:via-indigo-400/40",
  success:
    "bg-[linear-gradient(135deg,rgba(6,52,36,0.88)_0%,rgba(4,82,50,0.68)_55%,rgba(5,36,25,0.9)_100%)]",
  info:
    "bg-[linear-gradient(135deg,rgba(7,46,62,0.88)_0%,rgba(6,74,92,0.68)_55%,rgba(5,38,52,0.9)_100%)]",
  warning:
    "bg-[linear-gradient(135deg,rgba(59,38,4,0.9)_0%,rgba(98,66,6,0.68)_55%,rgba(48,31,3,0.9)_100%)]",
  destructive:
    "bg-[linear-gradient(135deg,rgba(70,10,24,0.9)_0%,rgba(115,22,42,0.65)_55%,rgba(55,6,16,0.9)_100%)]"
}

const accentBars: Record<string, string> = {
  default:
    "after:bg-[linear-gradient(90deg,#6366F1,#8B5CF6,#0EA5E9,#06B6D4,#6366F1)]",
  success:
    "after:bg-[linear-gradient(90deg,#059669,#10B981,#34D399,#10B981,#059669)]",
  info:
    "after:bg-[linear-gradient(90deg,#0284C7,#0EA5E9,#06B6D4,#0EA5E9,#0284C7)]",
  warning:
    "after:bg-[linear-gradient(90deg,#D97706,#FBBF24,#F59E0B,#FBBF24,#D97706)]",
  destructive:
    "after:bg-[linear-gradient(90deg,#DC2626,#EF4444,#F87171,#EF4444,#DC2626)]"
}

const glowRing: Record<string, string> = {
  default:
    "before:[box-shadow:0_0_0_1px_rgba(130,145,255,0.25),0_0_40px_-6px_rgba(124,90,255,0.45)]",
  success:
    "before:[box-shadow:0_0_0_1px_rgba(16,185,129,0.25),0_0_40px_-6px_rgba(16,185,129,0.45)]",
  info:
    "before:[box-shadow:0_0_0_1px_rgba(56,189,248,0.28),0_0_46px_-8px_rgba(56,189,248,0.45)]",
  warning:
    "before:[box-shadow:0_0_0_1px_rgba(251,191,36,0.30),0_0_44px_-8px_rgba(245,158,11,0.45)]",
  destructive:
    "before:[box-shadow:0_0_0_1px_rgba(244,63,94,0.30),0_0_44px_-8px_rgba(244,63,94,0.5)]"
}

const toastVariants = cva(
  [
    basePanel,
    layeredEffect,
    animationClasses,
    // Accent glow ring (separate dynamic class appended at runtime)
    "transition-all duration-300 will-change-transform",
    // Hover / active transforms
    "hover:-translate-y-0.5 hover:shadow-[0_10px_34px_-8px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.06)] active:translate-y-0 active:scale-[0.985]",
    // Global pseudo for animated border sweep
    "after:animate-[spin_14s_linear_infinite]"
  ].join(" "),
  {
    variants: {
      variant: {
        default: variantBackgrounds.default,
        success: variantBackgrounds.success,
        info: variantBackgrounds.info,
        warning: variantBackgrounds.warning,
        destructive: variantBackgrounds.destructive
      },
      dense: {
        true: "py-3 px-4 text-sm",
        false: ""
      }
    },
    defaultVariants: {
      variant: "default",
      dense: false
    }
  }
)

/* =========================================================
   PROPS
   ========================================================= */
export interface ToastProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root>,
    VariantProps<typeof toastVariants> {
  icon?: React.ReactNode
  description?: React.ReactNode
  disableProgress?: boolean
  duration?: number | typeof Infinity
  variant?: FuturisticVariant
  withGlow?: boolean
  withAccent?: boolean
  accentPosition?: "left" | "top" | "bottom" | "right"
}

/* =========================================================
   ROOT
   ========================================================= */
export const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  ToastProps
>(
  (
    {
      className,
      variant = "default",
      dense,
      children,
      icon,
      description,
      duration = 4000,
      disableProgress,
      withGlow = true,
      withAccent = true,
      accentPosition = "left",
      ...props
    },
    ref
  ) => {
    const showBar = !disableProgress && duration !== Infinity && typeof duration === "number"
    const ariaLive =
      variant === "destructive" || variant === "warning" ? "assertive" : "polite"

    const accentDirClass =
      accentPosition === "left"
        ? "after:left-0 after:top-0 after:h-full after:w-[3px]"
        : accentPosition === "right"
          ? "after:right-0 after:top-0 after:h-full after:w-[3px]"
          : accentPosition === "top"
            ? "after:top-0 after:left-0 after:w-full after:h-[3px]"
            : "after:bottom-0 after:left-0 after:w-full after:h-[3px]"

    return (
      <ToastPrimitives.Root
        ref={ref}
        className={cn(
          toastVariants({ variant, dense }),
            withGlow && glowRing[variant],
          withAccent &&
            cn(
              "after:absolute after:rounded-full after:opacity-90 after:blur-[0.3px] after:content-['']",
              accentBars[variant],
              accentDirClass
            ),
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60",
          "data-[state=open]:focus-visible:ring-offset-0",
          className
        )}
        style={
          {
            "--progress-duration": `${duration}ms`
          } as React.CSSProperties
        }
        aria-live={ariaLive}
        {...props}
      >
        <div className="flex w-full items-start gap-4">
          {icon && (
            <div className="relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center">
              <div className={cn(
                "absolute inset-0 rounded-xl opacity-60 blur-sm",
                {
                  default: "bg-gradient-to-br from-indigo-500/40 via-fuchsia-500/30 to-cyan-400/30",
                  success: "bg-gradient-to-br from-emerald-400/40 via-emerald-500/30 to-teal-400/30",
                  info: "bg-gradient-to-br from-sky-400/40 via-cyan-500/30 to-teal-400/30",
                  warning: "bg-gradient-to-br from-amber-400/40 via-amber-500/30 to-yellow-400/30",
                  destructive: "bg-gradient-to-br from-rose-500/40 via-rose-500/30 to-pink-500/30"
                }[variant]
              )} />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 backdrop-blur-md shadow-inner">
                <div className="animate-[pulse_4s_ease-in-out_infinite]">
                  {icon}
                </div>
              </div>
            </div>
          )}
          <div className="min-w-0 flex-1">
            {children}
            {description && (
              <div className="mt-1 text-[13px] leading-snug text-slate-300/80 selection:bg-indigo-500/30 selection:text-slate-100">
                {description}
              </div>
            )}
          </div>
          <ToastClose />
        </div>

        {/* Progress Bar */}
        {showBar && (
          <div
            className="pointer-events-none absolute inset-x-3 bottom-2 h-[5px] overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10"
            data-progress=""
          >
            <div
              className={cn(
                "h-full w-full origin-left animate-[toast-bar_var(--progress-duration)_linear_forwards]",
                variant === "success" &&
                  "bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500",
                variant === "info" &&
                  "bg-gradient-to-r from-cyan-400 via-sky-300 to-cyan-500",
                variant === "warning" &&
                  "bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500",
                variant === "destructive" &&
                  "bg-gradient-to-r from-rose-500 via-rose-400 to-rose-600",
                (!variant || variant === "default") &&
                  "bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-cyan-400"
              )}
            />
          </div>
        )}

        {/* Local style definitions (animations) */}
        <style jsx>{`
          @keyframes toast-bar {
            from { transform: scaleX(1); }
            to { transform: scaleX(0); }
          }
        `}</style>
      </ToastPrimitives.Root>
    )
  }
)
Toast.displayName = ToastPrimitives.Root.displayName

/* =========================================================
   ACTION
   ========================================================= */
export const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md px-3 text-xs font-semibold tracking-wide",
      "bg-white/10 text-slate-100 ring-1 ring-white/15 backdrop-blur-sm",
      "transition-all hover:scale-[1.04] hover:bg-white/15 hover:ring-white/25 active:scale-[0.97]",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60",
      "group-[.destructive]:hover:bg-rose-500/20 group-[.warning]:hover:bg-amber-500/20",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

/* =========================================================
   CLOSE
   ========================================================= */
export const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "relative -m-1 ml-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-300/60 transition",
      "hover:text-slate-100 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60",
      "active:scale-95",
      "opacity-0 group-hover:opacity-100 focus:opacity-100",
      "group-[.destructive]:hover:text-rose-50",
      className
    )}
    aria-label="Cerrar notificación"
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" strokeWidth={2} />
    <span className="sr-only">Cerrar</span>
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

/* =========================================================
   TITLE
   ========================================================= */
export const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn(
      "text-[13.5px] sm:text-sm font-semibold tracking-wide leading-snug",
      "bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent",
      "drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] select-text",
      className
    )}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

/* =========================================================
   DESCRIPTION
   ========================================================= */
export const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn(
      "text-[12.5px] sm:text-[13px] leading-snug text-slate-300/80",
      "selection:bg-indigo-500/30 selection:text-slate-100",
      className
    )}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

/* =========================================================
   TYPES
   ========================================================= */
export type ToastActionElement = React.ReactElement<typeof ToastAction>