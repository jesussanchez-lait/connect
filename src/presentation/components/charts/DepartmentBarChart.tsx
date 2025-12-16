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

interface DepartmentBarChartProps {
  data: Array<{
    department: string;
    count: number;
    percentage: number;
  }>;
}

export function DepartmentBarChart({ data }: DepartmentBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No hay datos disponibles
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 5, right: 20, left: 20, bottom: 50 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="department"
          angle={-45}
          textAnchor="end"
          height={80}
          tick={{ fontSize: 10 }}
        />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="count" fill="#8b5cf6" name="Participantes" />
      </BarChart>
    </ResponsiveContainer>
  );
}

