"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface StatusAreaChartProps {
  data: {
    active: number;
    inactive: number;
    completed: number;
  };
}

export function StatusAreaChart({ data }: StatusAreaChartProps) {
  const chartData = [
    {
      name: "Activos",
      Activos: data.active,
      Inactivos: data.inactive,
      Completados: data.completed,
    },
  ];

  const total = data.active + data.inactive + data.completed;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No hay datos disponibles
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorInactive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Area
          type="monotone"
          dataKey="Activos"
          stackId="1"
          stroke="#10b981"
          fill="url(#colorActive)"
          name="Activos"
        />
        <Area
          type="monotone"
          dataKey="Inactivos"
          stackId="1"
          stroke="#f59e0b"
          fill="url(#colorInactive)"
          name="Inactivos"
        />
        <Area
          type="monotone"
          dataKey="Completados"
          stackId="1"
          stroke="#6366f1"
          fill="url(#colorCompleted)"
          name="Completados"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

