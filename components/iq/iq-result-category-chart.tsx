"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useEffect, useState } from "react";

type IqResultSectionBreakdown = {
  key: string;
  label: string;
  score: number;
  maxScore: number;
  percentage: number;
};

type IqResultCategoryChartProps = {
  sections: IqResultSectionBreakdown[];
};

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe"];

export function IqResultCategoryChart({ sections }: IqResultCategoryChartProps) {
  const [isMobile, setIsMobile] = useState(false);
  const chartData = sections.map((section) => ({
    name: section.label,
    value: section.percentage,
  }));

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const updateIsMobile = () => setIsMobile(mediaQuery.matches);

    updateIsMobile();
    mediaQuery.addEventListener("change", updateIsMobile);

    return () => mediaQuery.removeEventListener("change", updateIsMobile);
  }, []);

  return (
    <Card className="mb-6 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Répartition des bonnes réponses</CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4">
        <div className="h-[245px] w-full overflow-hidden sm:h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy={isMobile ? "44%" : "50%"}
                labelLine={false}
                label={isMobile ? false : ({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={isMobile ? 68 : 84}
                fill="#8884d8"
                dataKey="value"
                isAnimationActive
                animationBegin={150}
                animationDuration={900}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}%`, "Bonnes réponses"]} />
              <Legend wrapperStyle={isMobile ? { fontSize: 12, lineHeight: "18px", paddingTop: 8 } : undefined} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">Pourcentage de bonnes réponses par catégorie du test de logique</p>
      </CardContent>
    </Card>
  );
}
