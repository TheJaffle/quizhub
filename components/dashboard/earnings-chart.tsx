"use client"

import type { DashboardMonthlyActivity } from "@/lib/auth"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface EarningsChartProps {
  monthlyActivity: DashboardMonthlyActivity[]
}

export function EarningsChart({ monthlyActivity }: EarningsChartProps) {
  const chartColor = "#6366f1"

  return (
    <div className="h-[260px] min-h-[260px] min-w-0 w-full max-w-full overflow-hidden sm:h-[300px] sm:min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <LineChart data={monthlyActivity} margin={{ top: 16, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="monthLabel" tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
          <Tooltip />
          <Line
            type="linear"
            dataKey="completedQuizzes"
            name="Quiz terminés"
            stroke={chartColor}
            strokeWidth={2}
            dot={{ r: 4, fill: chartColor, stroke: chartColor }}
            activeDot={{ r: 6, fill: chartColor, stroke: chartColor }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
