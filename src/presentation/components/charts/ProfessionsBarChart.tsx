"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ProfessionsBarChartProps {
  data: Array<{
    profession: string;
    count: number;
    percentage: number;
  }>;
}

export function ProfessionsBarChart({ data }: ProfessionsBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No hay datos disponibles
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis
          dataKey="profession"
          type="category"
          width={90}
          tick={{ fontSize: 12 }}
        />
        <Tooltip />
        <Legend />
        <Bar dataKey="count" fill="#6366f1" name="Cantidad" />
      </BarChart>
    </ResponsiveContainer>
  );
}

