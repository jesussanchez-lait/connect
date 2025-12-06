"use client";

import { useState, useEffect } from "react";
import { useCampaign } from "@/src/presentation/contexts/CampaignContext";
import { CampaignSelector } from "./CampaignSelector";
import { MultiplierRequestsList } from "./MultiplierRequestsList";
import { useAuth } from "@/src/presentation/hooks/useAuth";
import { ApiClient } from "@/src/infrastructure/api/ApiClient";

interface Multiplier {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  photo?: string;
  teamSize: number;
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

  const userInitials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <div className="relative user-menu-container">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        {/* Avatar en móvil, nombre completo en desktop */}
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
            {user?.name || "Usuario"}
          </span>
          {user?.phoneNumber && (
            <span className="text-xs text-gray-500 hidden md:block">
              {user.phoneNumber}
            </span>
          )}
        </div>
        <div className="sm:hidden h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-medium">
          {userInitials}
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${
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

export function LinkDashboard() {
  const { user } = useAuth();
  const { selectedCampaign } = useCampaign();
  const [multipliers, setMultipliers] = useState<Multiplier[]>([]);
  const [loading, setLoading] = useState(true);
  const apiClient = new ApiClient();

  useEffect(() => {
    if (selectedCampaign) {
      fetchMultipliers();
    } else {
      setMultipliers([]);
      setLoading(false);
    }
  }, [selectedCampaign]);

  const fetchMultipliers = async () => {
    if (!selectedCampaign) return;

    setLoading(true);
    try {
      const data = await apiClient.get<Multiplier[]>(
        `/dashboard/my-team?campaignId=${selectedCampaign.id}`
      );
      setMultipliers(data);
    } catch (error) {
      console.error("Error fetching multipliers:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-2">
            <div className="flex items-center min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                Connect
              </h1>
              <span className="ml-2 sm:ml-3 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded whitespace-nowrap flex-shrink-0">
                Enlace Municipal
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 flex-shrink-0">
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Información para Enlace */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-green-800">
                  Rol: Enlace Municipal - &quot;El Activador&quot;
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  Tu función es gestionar zonas, validar líderes, entregar
                  material impreso (QRs) y capacitar nuevos multiplicadores.
                </p>
              </div>
            </div>
          </div>

          {/* Selector de Campaña */}
          <div className="mb-6">
            <CampaignSelector />
          </div>

          {/* Solicitudes de Multiplicador */}
          {selectedCampaign && (
            <div className="mb-6">
              <MultiplierRequestsList />
            </div>
          )}

          {/* Multiplicadores bajo gestión */}
          {selectedCampaign && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Multiplicadores bajo mi Gestión ({multipliers.length})
              </h3>
              {loading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : multipliers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No hay multiplicadores asignados
                </p>
              ) : (
                <div className="space-y-3">
                  {multipliers.map((multiplier) => (
                    <div
                      key={multiplier.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                            {multiplier.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {multiplier.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {multiplier.phoneNumber}
                            </p>
                            {multiplier.email && (
                              <p className="text-xs text-gray-500">
                                {multiplier.email}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {multiplier.teamSize}{" "}
                            {multiplier.teamSize === 1
                              ? "seguidor"
                              : "seguidores"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
