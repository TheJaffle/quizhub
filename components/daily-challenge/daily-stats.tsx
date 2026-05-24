"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Mock data for the stats
const performanceData = [
  { day: "Lun", score: 80, avgScore: 65 },
  { day: "Mar", score: 60, avgScore: 68 },
  { day: "Mer", score: 90, avgScore: 70 },
  { day: "Jeu", score: 70, avgScore: 67 },
  { day: "Ven", score: 85, avgScore: 72 },
  { day: "Sam", score: 75, avgScore: 69 },
  { day: "Dim", score: 95, avgScore: 71 },
];

const categoryData = [
  { name: "Sciences", value: 35 },
  { name: "Histoire", value: 25 },
  { name: "Géographie", value: 20 },
  { name: "Divertissement", value: 15 },
  { name: "Sport", value: 5 },
];

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe"];

export function DailyStats() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Vos statistiques de défi</CardTitle>
      </CardHeader>

      <Tabs defaultValue="performance">
        <div className="px-6">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="categories">Catégories</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="performance" className="m-0">
          <CardContent className="p-4">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, "Score"]} labelFormatter={(label) => `${label}`} />
                  <Legend />
                  <Bar name="Votre score" dataKey="score" fill="#8884d8" />
                  <Bar name="Score moyen" dataKey="avgScore" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">Votre performance au défi du jour comparée à la moyenne</p>
          </CardContent>
        </TabsContent>

        <TabsContent value="categories" className="m-0">
          <CardContent className="p-4">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, "Pourcentage"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">Répartition de vos bonnes réponses par catégorie</p>
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
