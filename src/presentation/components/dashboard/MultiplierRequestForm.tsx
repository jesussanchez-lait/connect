"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/src/presentation/hooks/useAuth";
import { useCampaign } from "@/src/presentation/contexts/CampaignContext";
import { ApiClient } from "@/src/infrastructure/api/ApiClient";

interface MultiplierRequestFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function MultiplierRequestForm({
  onSuccess,
  onError,
}: MultiplierRequestFormProps) {
  const { user } = useAuth();
  const { selectedCampaign } = useCampaign();
  const [loading, setLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState<{
    status: "idle" | "pending" | "approved" | "rejected";
    message?: string;
  }>({ status: "idle" });
  const apiClient = new ApiClient();

  const checkExistingRequest = async () => {
    if (!user || !selectedCampaign) return;

    try {
      const request = await apiClient.get<any>(
        `/dashboard/multiplier-request?userId=${user.id}&campaignId=${selectedCampaign.id}`
      );
      if (request) {
        setRequestStatus({
          status: request.status,
          message:
            request.status === "pending"
              ? "Tienes una solicitud pendiente de revisión"
              : request.status === "approved"
              ? "Tu solicitud fue aprobada. Ya eres multiplicador."
              : `Tu solicitud fue rechazada${
                  request.rejectionReason ? `: ${request.rejectionReason}` : ""
                }`,
        });
      }
    } catch (error: any) {
      // Si no existe solicitud, está bien
      if (
        error.message?.includes("404") ||
        error.message?.includes("no encontrada")
      ) {
        setRequestStatus({ status: "idle" });
      }
    }
  };

  useEffect(() => {
    if (user && selectedCampaign) {
      checkExistingRequest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedCampaign]);

  const handleRequest = async () => {
    if (!user || !selectedCampaign) {
      onError?.("Debes seleccionar una campaña");
      return;
    }

    setLoading(true);
    try {
      const result = await apiClient.post("/dashboard/multiplier-request", {
        campaignId: selectedCampaign.id,
        campaignName: selectedCampaign.name,
      });

      setRequestStatus({
        status: "pending",
        message:
          "Solicitud enviada exitosamente. Serás notificado cuando sea revisada.",
      });
      onSuccess?.();
    } catch (error: any) {
      const errorMessage =
        error.message || "Error al enviar solicitud. Intenta nuevamente.";
      setRequestStatus({ status: "idle", message: errorMessage });
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedCampaign) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          Selecciona una campaña para solicitar ser multiplicador
        </p>
      </div>
    );
  }

  if (requestStatus.status === "pending") {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-800">
              Solicitud Pendiente
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              {requestStatus.message ||
                "Tu solicitud está siendo revisada por el enlace municipal."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (requestStatus.status === "approved") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-green-600 mt-0.5 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-green-800">
              Solicitud Aprobada
            </h3>
            <p className="text-sm text-green-700 mt-1">
              {requestStatus.message ||
                "Tu solicitud fue aprobada. Ya eres multiplicador en esta campaña."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (requestStatus.status === "rejected") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-red-600 mt-0.5 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-red-800">
              Solicitud Rechazada
            </h3>
            <p className="text-sm text-red-700 mt-1">
              {requestStatus.message ||
                "Tu solicitud fue rechazada. Puedes intentar nuevamente más tarde."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Solicitar ser Multiplicador
        </h3>
        <p className="text-sm text-gray-600">
          Como multiplicador podrás reclutar nuevos seguidores y tener tu propio
          código QR para compartir.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Tu solicitud será revisada por el enlace
              municipal. Serás notificado cuando sea aceptada.
            </p>
          </div>
        </div>
      </div>

      {requestStatus.message && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">{requestStatus.message}</p>
        </div>
      )}

      <button
        onClick={handleRequest}
        disabled={loading}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Enviando..." : "Solicitar ser Multiplicador"}
      </button>
    </div>
  );
}
