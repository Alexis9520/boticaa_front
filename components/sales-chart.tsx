"use client"

import { useTheme } from "next-themes"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  { hora: "8:00", ventas: 450 },
  { hora: "9:00", ventas: 680 },
  { hora: "10:00", ventas: 1200 },
  { hora: "11:00", ventas: 1500 },
  { hora: "12:00", ventas: 950 },
  { hora: "13:00", ventas: 750 },
  { hora: "14:00", ventas: 820 },
  { hora: "15:00", ventas: 1100 },
  { hora: "16:00", ventas: 1300 },
  { hora: "17:00", ventas: 1450 },
  { hora: "18:00", ventas: 1200 },
  { hora: "19:00", ventas: 850 },
]

export default function SalesChart() {
  const { theme } = useTheme()
  const isDark = theme === "dark"

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
        <Bar dataKey="ventas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
      </BarChart>
    </ResponsiveContainer>
  )
}
