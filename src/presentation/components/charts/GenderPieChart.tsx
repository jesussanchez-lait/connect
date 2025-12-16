"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface GenderPieChartProps {
  data: {
    male: number;
    female: number;
    other: number;
    preferNotToSay: number;
  };
}

const COLORS = ["#2563eb", "#ec4899", "#8b5cf6", "#9ca3af"]; // Blue, Pink, Purple, Gray

export function GenderPieChart({ data }: GenderPieChartProps) {
  const chartData = [
    { name: "Masculino", value: data.male },
    { name: "Femenino", value: data.female },
    { name: "Otro", value: data.other },
    { name: "Prefiero no decir", value: data.preferNotToSay },
  ].filter((item) => item.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No hay datos disponibles
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) =>
            `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`
          }
          outerRadius={65}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
