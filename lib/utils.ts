import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function formatSoles(valor: number | string | null | undefined): string {
  let num = Number(
    typeof valor === "string"
      ? valor.replace(",", ".")
      : valor ?? 0
  );
  if (isNaN(num) || !isFinite(num)) {
    num = 0;
  }
  return `S/ ${num.toFixed(2)}`;
}