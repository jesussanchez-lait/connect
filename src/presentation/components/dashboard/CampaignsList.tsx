"use client";

import { useState, useEffect } from "react";
import { ApiClient } from "@/src/infrastructure/api/ApiClient";

interface Campaign {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: string;
  participants: number;
  createdAt: Date;
}

export function CampaignsList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const apiClient = new ApiClient();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const data = await apiClient.get<Campaign[]>("/dashboard/campaigns");
      // Convert date strings to Date objects
      const campaignsWithDates = data.map((campaign) => ({
        ...campaign,
        startDate: new Date(campaign.startDate),
        endDate: new Date(campaign.endDate),
        createdAt: new Date(campaign.createdAt),
      }));
      setCampaigns(campaignsWithDates);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      completed: "bg-blue-100 text-blue-800",
    };

    const statusLabels = {
      active: "Activa",
      inactive: "Inactiva",
      completed: "Completada",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${
          statusClasses[status as keyof typeof statusClasses] ||
          statusClasses.inactive
        }`}
      >
        {statusLabels[status as keyof typeof statusLabels] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Mis Campañas Activas
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-500">No tienes campañas activas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Mis Campañas Activas
      </h3>
      <div className="space-y-4">
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h4 className="text-md font-semibold text-gray-900 mb-1">
                  {campaign.name}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  {campaign.description}
                </p>
              </div>
              {getStatusBadge(campaign.status)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
              <div>
                <span className="text-gray-500">Fecha inicio:</span>
                <p className="text-gray-900 font-medium">
                  {formatDate(campaign.startDate)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Fecha fin:</span>
                <p className="text-gray-900 font-medium">
                  {formatDate(campaign.endDate)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Participantes:</span>
                <p className="text-gray-900 font-medium">
                  {campaign.participants}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
