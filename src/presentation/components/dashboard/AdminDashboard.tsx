"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCampaign } from "@/src/presentation/contexts/CampaignContext";
import { CampaignSelector } from "./CampaignSelector";
import { CreateCampaignModal } from "./CreateCampaignModal";
import { useAuth } from "@/src/presentation/hooks/useAuth";
import { useRole } from "@/src/presentation/hooks/useRole";
import { useCampaignKPIs } from "@/src/presentation/hooks/useCampaignKPIs";
import { ROLES } from "@/src/presentation/contexts/RoleContext";

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
        <div className="sm:hidden h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-medium">
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

function CreateCampaignButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors text-sm font-medium"
        aria-label="Crear Campaña"
      >
        <svg
          className="w-4 h-4 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span className="hidden sm:inline">Crear Campaña</span>
      </button>
      <CreateCampaignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

export function AdminDashboard() {
  const { user } = useAuth();
  const { role } = useRole();
  const router = useRouter();
  const { campaigns, selectedCampaigns } = useCampaign();
  const kpis = useCampaignKPIs();

  const handleExportData = () => {
    // TODO: Implementar exportación con máscaras DLP
    alert("Funcionalidad de exportación en desarrollo");
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
              <span className="ml-2 sm:ml-3 px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded whitespace-nowrap flex-shrink-0">
                Dirección
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 flex-shrink-0">
              <button
                onClick={handleExportData}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors text-sm font-medium"
                aria-label="Exportar Datos"
              >
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="hidden sm:inline">Exportar Datos</span>
              </button>
              <CreateCampaignButton />
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Información para Admin */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-indigo-600 mt-0.5 mr-3"
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
                <h3 className="text-sm font-medium text-indigo-800">
                  Rol: Dirección - Administrador de Campaña
                </h3>
                <p className="text-sm text-indigo-700 mt-1">
                  Tienes acceso completo a todas las campañas, puedes exportar
                  datos con máscaras DLP y gestionar la configuración de las
                  campañas.
                </p>
              </div>
            </div>
          </div>

          {/* Selector de Campaña */}
          <div className="mb-6">
            <CampaignSelector />
          </div>

          {/* Métricas Globales - Calculadas basadas en campañas seleccionadas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Campañas Seleccionadas
              </h3>
              <p className="text-3xl font-bold text-gray-900">
                {kpis.totalCampaigns}
              </p>
              {kpis.totalCampaigns > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {kpis.activeCampaigns} activas, {kpis.inactiveCampaigns}{" "}
                  inactivas
                </p>
              )}
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Total de Participantes
              </h3>
              <p className="text-3xl font-bold text-gray-900">
                {kpis.totalParticipants.toLocaleString()}
              </p>
              {kpis.totalCampaigns > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Promedio:{" "}
                  {kpis.averageParticipantsPerCampaign.toLocaleString()} por
                  campaña
                </p>
              )}
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Participantes Activos
              </h3>
              <p className="text-3xl font-bold text-indigo-600">
                {kpis.totalActiveParticipants.toLocaleString()}
              </p>
              {kpis.totalCampaigns > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  En campañas activas
                </p>
              )}
            </div>
          </div>

          {/* KPIs Adicionales */}
          {kpis.totalCampaigns > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  En Progreso
                </h3>
                <p className="text-2xl font-bold text-blue-600">
                  {kpis.campaignsInProgress}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Completadas
                </h3>
                <p className="text-2xl font-bold text-green-600">
                  {kpis.campaignsCompleted}
                </p>
                {kpis.participantsByStatus.completed > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {kpis.participantsByStatus.completed.toLocaleString()}{" "}
                    participantes
                  </p>
                )}
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  No Iniciadas
                </h3>
                <p className="text-2xl font-bold text-gray-600">
                  {kpis.campaignsNotStarted}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Inactivas
                </h3>
                <p className="text-2xl font-bold text-orange-600">
                  {kpis.inactiveCampaigns}
                </p>
                {kpis.participantsByStatus.inactive > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {kpis.participantsByStatus.inactive.toLocaleString()}{" "}
                    participantes
                  </p>
                )}
              </div>
            </div>
          )}

          {/* KPIs de Distribución Geográfica */}
          {kpis.totalCampaigns > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Distribución Urbano/Rural */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-4">
                  Distribución Urbano/Rural
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                      <span className="text-sm text-gray-700">Urbano</span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {kpis.areaTypeDistribution.urban.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {kpis.areaTypePercentages.urban}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm text-gray-700">Rural</span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {kpis.areaTypeDistribution.rural.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {kpis.areaTypePercentages.rural}%
                      </p>
                    </div>
                  </div>
                  {kpis.areaTypeDistribution.unknown > 0 && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-500">
                        Sin clasificar
                      </span>
                      <p className="text-sm font-medium text-gray-600">
                        {kpis.areaTypeDistribution.unknown.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Distribución Capital/No Capital */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-4">
                  Distribución Capital/No Capital
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                      <span className="text-sm text-gray-700">
                        Desde Capital
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {kpis.capitalCityDistribution.fromCapital.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {kpis.capitalCityPercentages.fromCapital}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                      <span className="text-sm text-gray-700">
                        Fuera de Capital
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {kpis.capitalCityDistribution.notFromCapital.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {kpis.capitalCityPercentages.notFromCapital}%
                      </p>
                    </div>
                  </div>
                  {kpis.capitalCityDistribution.unknown > 0 && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-500">
                        Sin clasificar
                      </span>
                      <p className="text-sm font-medium text-gray-600">
                        {kpis.capitalCityDistribution.unknown.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Mensaje cuando no hay campañas seleccionadas */}
          {kpis.totalCampaigns === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-yellow-600 mt-0.5 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    No hay campañas seleccionadas
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Selecciona una o más campañas arriba para ver los KPIs y
                    métricas agregadas.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
