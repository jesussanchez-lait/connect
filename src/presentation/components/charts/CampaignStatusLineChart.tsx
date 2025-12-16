"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface CampaignStatusLineChartProps {
  data: {
    inProgress: number;
    completed: number;
    notStarted: number;
  };
}

export function CampaignStatusLineChart({
  data,
}: CampaignStatusLineChartProps) {
  const chartData = [
    {
      name: "En Progreso",
      value: data.inProgress,
    },
    {
      name: "Completadas",
      value: data.completed,
    },
    {
      name: "No Iniciadas",
      value: data.notStarted,
    },
  ];

  const total = data.inProgress + data.completed + data.notStarted;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No hay datos disponibles
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#6366f1"
          strokeWidth={2}
          name="Cantidad"
          dot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

