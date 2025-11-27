"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ApiClient } from "@/src/infrastructure/api/ApiClient";
import { useCampaign } from "@/src/presentation/contexts/CampaignContext";

interface Leader {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  photo?: string;
  teamSize: number; // Cantidad de personas bajo su código QR en esta campaña
}

export function MyLeader() {
  const [leader, setLeader] = useState<Leader | null>(null);
  const [loading, setLoading] = useState(true);
  const apiClientRef = useRef(new ApiClient());
  const { selectedCampaign } = useCampaign();

  const fetchLeader = useCallback(async () => {
    if (!selectedCampaign) {
      setLeader(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await apiClientRef.current.get<Leader>(
        `/dashboard/my-leader?campaignId=${selectedCampaign.id}`
      );
      setLeader(data);
    } catch (error) {
      console.error("Error fetching leader:", error);
      setLeader(null);
    } finally {
      setLoading(false);
    }
  }, [selectedCampaign]);

  useEffect(() => {
    fetchLeader();
  }, [fetchLeader]);

  if (!selectedCampaign) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Mi Multiplicador
        </h3>
        <p className="text-gray-500">
          Selecciona una campaña para ver tu multiplicador
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!leader) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Mi Multiplicador - {selectedCampaign.name}
        </h3>
        <p className="text-gray-500">
          No tienes multiplicador asignado para esta campaña
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Mi Multiplicador - {selectedCampaign.name}
      </h3>
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          {leader.photo ? (
            <img
              src={leader.photo}
              alt={leader.name}
              className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold text-lg">
              {leader.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{leader.name}</h4>
          <p className="text-sm text-gray-600 mt-1">{leader.phoneNumber}</p>
          {leader.email && (
            <p className="text-sm text-gray-500 mt-1">{leader.email}</p>
          )}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Equipo:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {leader.teamSize}{" "}
                {leader.teamSize === 1 ? "persona" : "personas"}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Registradas bajo su código QR en esta campaña
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
