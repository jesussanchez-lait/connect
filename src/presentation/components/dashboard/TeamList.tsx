"use client";

import { useState, useEffect } from "react";
import { ApiClient } from "@/src/infrastructure/api/ApiClient";
import { useCampaign } from "@/src/presentation/contexts/CampaignContext";

interface TeamMember {
  id: string;
  name: string;
  phoneNumber: string;
  city: string;
  department: string;
  neighborhood: string;
  latitude?: number;
  longitude?: number;
  createdAt: Date;
}

export function TeamList() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const apiClient = new ApiClient();
  const { selectedCampaign } = useCampaign();

  useEffect(() => {
    if (selectedCampaign) {
      fetchTeam();
    } else {
      setTeam([]);
      setLoading(false);
    }
  }, [selectedCampaign]);

  const fetchTeam = async () => {
    if (!selectedCampaign) return;

    setLoading(true);
    try {
      const data = await apiClient.get<TeamMember[]>(
        `/dashboard/my-team?campaignId=${selectedCampaign.id}`
      );
      setTeam(data);
    } catch (error) {
      console.error("Error fetching team:", error);
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mi Equipo</h3>
        <p className="text-gray-500 text-center py-8">
          Selecciona una campaña para ver tu equipo
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Mi Equipo - {selectedCampaign.name} ({team.length})
      </h3>
      {team.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          Aún no tienes personas registradas bajo tu código
        </p>
      ) : (
        <div className="space-y-3">
          {team.map((member) => (
            <div
              key={member.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{member.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {member.phoneNumber}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {member.city}, {member.department}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {member.neighborhood}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">
                    {new Date(member.createdAt).toLocaleDateString("es-CO", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
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
