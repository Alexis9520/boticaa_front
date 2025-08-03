"use client"

import { useTheme } from "next-themes"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type VentasPorHora = { hora: string, total: number }

interface SalesChartProps {
  data: VentasPorHora[]
}

export default function SalesChart({ data }: SalesChartProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Diagnóstico
  console.log("Ventas por hora recibidas:", data)

  if (!data || data.length === 0) {
    return <div className="text-center text-muted-foreground">No hay datos de ventas por hora.</div>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} />
        <XAxis dataKey="hora" stroke={isDark ? "#94a3b8" : "#64748b"} tickLine={false} axisLine={false} fontSize={12} />
        <YAxis
          stroke={isDark ? "#94a3b8" : "#64748b"}
          tickLine={false}
          axisLine={false}
          fontSize={12}
          tickFormatter={(value) => `S/ ${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: isDark ? "#1e293b" : "#ffffff",
            border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
            borderRadius: "6px",
            color: isDark ? "#e2e8f0" : "#1e293b",
          }}
          formatter={(value) => [`S/ ${value}`, "Ventas"]}
          labelFormatter={(label) => `Hora: ${label}`}
        />
        <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
      </BarChart>
    </ResponsiveContainer>
  )
}