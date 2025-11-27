"use client";

import { useState, useEffect } from "react";
import { ApiClient } from "@/src/infrastructure/api/ApiClient";
import { useCampaign } from "@/src/presentation/contexts/CampaignContext";

interface Activity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  city: string;
  department: string;
  createdAt: Date;
}

export function ActivityHistory() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const apiClient = new ApiClient();
  const { selectedCampaign } = useCampaign();

  useEffect(() => {
    if (selectedCampaign) {
      fetchActivities();
    } else {
      setActivities([]);
      setLoading(false);
    }
  }, [selectedCampaign]);

  const fetchActivities = async () => {
    if (!selectedCampaign) return;

    setLoading(true);
    try {
      const data = await apiClient.get<Activity[]>(
        `/dashboard/activities?campaignId=${selectedCampaign.id}`
      );
      setActivities(data);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedCampaign) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Historial de Actividades
        </h3>
        <p className="text-gray-500 text-center py-8">
          Selecciona una campaña para ver el historial
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Historial de Actividades - {selectedCampaign.name}
      </h3>
      {activities.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No hay actividades registradas
        </p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {activity.userName}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {activity.action}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {activity.city}, {activity.department}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">
                    {new Date(activity.createdAt).toLocaleDateString("es-CO", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(activity.createdAt).toLocaleTimeString("es-CO", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
