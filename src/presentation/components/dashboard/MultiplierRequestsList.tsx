"use client";

import { useState, useEffect } from "react";
import { useCampaign } from "@/src/presentation/contexts/CampaignContext";
import { ApiClient } from "@/src/infrastructure/api/ApiClient";

interface MultiplierRequest {
  id: string;
  userId: string;
  userName: string;
  userPhoneNumber: string;
  campaignId: string;
  campaignName?: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewerName?: string;
  rejectionReason?: string;
}

export function MultiplierRequestsList() {
  const { selectedCampaign } = useCampaign();
  const [requests, setRequests] = useState<MultiplierRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const apiClient = new ApiClient();

  const fetchRequests = async () => {
    if (!selectedCampaign) {
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await apiClient.get<MultiplierRequest[]>(
        `/dashboard/multiplier-requests?campaignId=${selectedCampaign.id}`
      );
      setRequests(data);
    } catch (error) {
      console.error("Error fetching multiplier requests:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [selectedCampaign]);

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await apiClient.post(
        `/dashboard/multiplier-requests/${requestId}/approve`
      );
      await fetchRequests(); // Refrescar lista
    } catch (error: any) {
      alert(error.message || "Error al aprobar solicitud");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    const reason = prompt("Ingresa el motivo del rechazo (opcional):");

    setProcessingId(requestId);
    try {
      await apiClient.post(
        `/dashboard/multiplier-requests/${requestId}/reject`,
        {
          rejectionReason: reason || undefined,
        }
      );
      await fetchRequests(); // Refrescar lista
    } catch (error: any) {
      alert(error.message || "Error al rechazar solicitud");
    } finally {
      setProcessingId(null);
    }
  };

  if (!selectedCampaign) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          Selecciona una campaña para ver las solicitudes de multiplicador
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Solicitudes de Multiplicador ({requests.length})
        </h3>
        <button
          onClick={fetchRequests}
          disabled={loading}
          className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          {loading ? "Cargando..." : "Actualizar"}
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-8">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500">
            No hay solicitudes pendientes
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                      {request.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {request.userName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {request.userPhoneNumber}
                      </p>
                    </div>
                  </div>
                  <div className="ml-13 space-y-1">
                    <p className="text-xs text-gray-500">
                      Solicitado:{" "}
                      {new Date(request.requestedAt).toLocaleString("es-CO")}
                    </p>
                    {request.campaignName && (
                      <p className="text-xs text-gray-500">
                        Campaña: {request.campaignName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleApprove(request.id)}
                    disabled={processingId === request.id}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {processingId === request.id ? "Procesando..." : "Aprobar"}
                  </button>
                  <button
                    onClick={() => handleReject(request.id)}
                    disabled={processingId === request.id}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {processingId === request.id ? "Procesando..." : "Rechazar"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
