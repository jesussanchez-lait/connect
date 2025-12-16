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

interface CityBarChartProps {
  data: Array<{
    city: string;
    count: number;
    percentage: number;
  }>;
}

export function CityBarChart({ data }: CityBarChartProps) {
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
        margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="city"
          angle={-45}
          textAnchor="end"
          height={100}
          tick={{ fontSize: 11 }}
        />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="count" fill="#10b981" name="Participantes" />
      </BarChart>
    </ResponsiveContainer>
  );
}

