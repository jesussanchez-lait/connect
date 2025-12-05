"use client";

import { useState, useEffect } from "react";
import { useCampaign } from "@/src/presentation/contexts/CampaignContext";
import { CampaignSelector } from "./CampaignSelector";
import { useAuth } from "@/src/presentation/hooks/useAuth";
import { ApiClient } from "@/src/infrastructure/api/ApiClient";

interface FraudAlert {
  id: string;
  type: string;
  userId: string;
  userName: string;
  documentNumber?: string;
  phoneNumber?: string;
  description: string;
  severity: "low" | "medium" | "high";
  status: "pending" | "resolved" | "dismissed";
  createdAt: string;
}

interface DivorceRequest {
  id: string;
  userId: string;
  userName: string;
  currentLeaderId: string;
  currentLeaderName: string;
  requestedLeaderId: string;
  requestedLeaderName: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".user-menu-container")) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative user-menu-container">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium text-gray-900">
            {user?.name || "Usuario"}
          </span>
          {user?.phoneNumber && (
            <span className="text-xs text-gray-500">{user.phoneNumber}</span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-900">
                {user?.name || "Usuario"}
              </p>
              {user?.phoneNumber && (
                <p className="text-xs text-gray-500">{user.phoneNumber}</p>
              )}
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 focus:outline-none focus:bg-red-50 transition-colors flex items-center space-x-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CoordinatorDashboard() {
  const { user } = useAuth();
  const { selectedCampaign } = useCampaign();
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [divorceRequests, setDivorceRequests] = useState<DivorceRequest[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [loadingDivorces, setLoadingDivorces] = useState(true);
  const apiClient = new ApiClient();

  useEffect(() => {
    fetchFraudAlerts();
    fetchDivorceRequests();
  }, []);

  const fetchFraudAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const data = await apiClient.get<FraudAlert[]>("/dashboard/fraud-alerts");
      setFraudAlerts(data);
    } catch (error) {
      console.error("Error fetching fraud alerts:", error);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const fetchDivorceRequests = async () => {
    setLoadingDivorces(true);
    try {
      const data = await apiClient.get<DivorceRequest[]>(
        "/dashboard/divorce-requests"
      );
      setDivorceRequests(data);
    } catch (error) {
      console.error("Error fetching divorce requests:", error);
    } finally {
      setLoadingDivorces(false);
    }
  };

  const handleApproveDivorce = async (divorceId: string) => {
    try {
      await apiClient.post(`/dashboard/divorce-requests/${divorceId}`, {});
      fetchDivorceRequests();
      alert("Divorcio aprobado exitosamente");
    } catch (error) {
      console.error("Error approving divorce:", error);
      alert("Error al aprobar el divorcio");
    }
  };

  return (
    <>
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Connect</h1>
              <span className="ml-3 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                Coordinador - &quot;El Auditor&quot;
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Información para Coordinador */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-purple-600 mt-0.5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-purple-800">
                  Rol: Coordinador - &quot;El Auditor&quot;
                </h3>
                <p className="text-sm text-purple-700 mt-1">
                  Tu función es garantizar la integridad de los datos, resolver
                  conflictos, aprobar divorcios y validar alertas de fraude.
                </p>
              </div>
            </div>
          </div>

          {/* Selector de Campaña */}
          <div className="mb-6">
            <CampaignSelector />
          </div>

          {/* Alertas de Fraude */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Alertas de Fraude
              </h3>
              {fraudAlerts.filter((a) => a.status === "pending").length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {fraudAlerts.filter((a) => a.status === "pending").length}{" "}
                  pendientes
                </span>
              )}
            </div>
            {loadingAlerts ? (
              <div className="animate-pulse space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : fraudAlerts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No hay alertas de fraude pendientes
              </p>
            ) : (
              <div className="space-y-3">
                {fraudAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`border-l-4 ${
                      alert.severity === "high"
                        ? "border-red-500 bg-red-50"
                        : alert.severity === "medium"
                        ? "border-yellow-500 bg-yellow-50"
                        : "border-blue-500 bg-blue-50"
                    } p-4 rounded`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">
                            {alert.userName}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              alert.severity === "high"
                                ? "bg-red-100 text-red-800"
                                : alert.severity === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {alert.severity === "high"
                              ? "Alta"
                              : alert.severity === "medium"
                              ? "Media"
                              : "Baja"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {alert.description}
                        </p>
                        {alert.documentNumber && (
                          <p className="text-xs text-gray-500 mt-1">
                            Documento: {alert.documentNumber}
                          </p>
                        )}
                        {alert.phoneNumber && (
                          <p className="text-xs text-gray-500 mt-1">
                            Teléfono: {alert.phoneNumber}
                          </p>
                        )}
                      </div>
                      <div className="ml-4">
                        <button
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                          onClick={() => {
                            // Marcar como resuelto
                            setFraudAlerts(
                              fraudAlerts.map((a) =>
                                a.id === alert.id
                                  ? { ...a, status: "resolved" as const }
                                  : a
                              )
                            );
                          }}
                        >
                          Resolver
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Solicitudes de Divorcio */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Solicitudes de Divorcio (Reasignación)
              </h3>
              {divorceRequests.filter((d) => d.status === "pending").length >
                0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {divorceRequests.filter((d) => d.status === "pending").length}{" "}
                  pendientes
                </span>
              )}
            </div>
            {loadingDivorces ? (
              <div className="animate-pulse space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : divorceRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No hay solicitudes de divorcio pendientes
              </p>
            ) : (
              <div className="space-y-3">
                {divorceRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {request.userName}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">De:</span>{" "}
                          {request.currentLeaderName}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">A:</span>{" "}
                          {request.requestedLeaderName}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          <span className="font-medium">Razón:</span>{" "}
                          {request.reason}
                        </p>
                      </div>
                      {request.status === "pending" && (
                        <div className="ml-4 flex space-x-2">
                          <button
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                            onClick={() => handleApproveDivorce(request.id)}
                          >
                            Aprobar
                          </button>
                          <button
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                            onClick={() => {
                              setDivorceRequests(
                                divorceRequests.map((d) =>
                                  d.id === request.id
                                    ? { ...d, status: "rejected" as const }
                                    : d
                                )
                              );
                            }}
                          >
                            Rechazar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
