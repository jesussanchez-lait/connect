"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCampaign } from "@/src/presentation/contexts/CampaignContext";
import { CampaignSelector } from "./CampaignSelector";
import { CreateCampaignModal } from "./CreateCampaignModal";
import { useAuth } from "@/src/presentation/hooks/useAuth";
import { useRole } from "@/src/presentation/hooks/useRole";
import { useCampaignKPIs } from "@/src/presentation/hooks/useCampaignKPIs";
import { ROLES } from "@/src/presentation/contexts/RoleContext";
import { CampaignsMap } from "./CampaignsMap";
import { TeamTreeCanvas } from "./TeamTreeCanvas";
import { useCampaignUsers } from "@/src/presentation/hooks/useCampaignUsers";
import { usersToCSV, downloadCSV } from "@/src/shared/utils/csvExport";
import { AreaTypePieChart } from "@/src/presentation/components/charts/AreaTypePieChart";
import { GenderPieChart } from "@/src/presentation/components/charts/GenderPieChart";
import { ProfessionsBarChart } from "@/src/presentation/components/charts/ProfessionsBarChart";
import { DepartmentBarChart } from "@/src/presentation/components/charts/DepartmentBarChart";
import { CityBarChart } from "@/src/presentation/components/charts/CityBarChart";
import { RoleBarChart } from "@/src/presentation/components/charts/RoleBarChart";
import { CampaignStatusLineChart } from "@/src/presentation/components/charts/CampaignStatusLineChart";
import { DashboardSidebar } from "./DashboardSidebar";
import {
  useDashboardConfig,
  DASHBOARD_WIDGETS,
} from "@/src/presentation/contexts/DashboardConfigContext";

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
  const { users, loading: loadingUsers } = useCampaignUsers(selectedCampaigns);
  const { isWidgetVisible, config } = useDashboardConfig(); // Ahora viene del contexto compartido
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Calcular widgets visibles para optimizar el layout - usar useMemo para reaccionar a cambios
  const visibleWidgets = useMemo(() => {
    // Usar config directamente para que React detecte los cambios inmediatamente
    const getWidgetVisibility = (widgetId: string) => {
      return config[widgetId] ?? true;
    };

    return {
      "area-type-pie": getWidgetVisibility("area-type-pie"),
      "gender-pie": getWidgetVisibility("gender-pie"),
      "campaign-status-line": getWidgetVisibility("campaign-status-line"),
      "professions-bar":
        getWidgetVisibility("professions-bar") &&
        kpis.topProfessions.length > 0,
      "department-bar":
        getWidgetVisibility("department-bar") &&
        kpis.departmentDistribution.length > 0,
      "city-bar":
        getWidgetVisibility("city-bar") && kpis.cityDistribution.length > 0,
      "role-bar":
        getWidgetVisibility("role-bar") && kpis.roleDistribution.length > 0,
      "team-tree": getWidgetVisibility("team-tree"),
      "campaigns-map": getWidgetVisibility("campaigns-map"),
    };
  }, [
    config,
    kpis.topProfessions.length,
    kpis.departmentDistribution.length,
    kpis.cityDistribution.length,
    kpis.roleDistribution.length,
  ]);

  // Agrupar widgets por categoría
  const widgetsByCategory = useMemo(() => {
    const grouped: Record<
      string,
      Array<{ id: string; label: string; visible: boolean }>
    > = {};

    DASHBOARD_WIDGETS.forEach((widget) => {
      if (!grouped[widget.category]) {
        grouped[widget.category] = [];
      }
      const isVisible =
        (visibleWidgets as Record<string, boolean>)[widget.id] ?? false;
      grouped[widget.category].push({
        id: widget.id,
        label: widget.label,
        visible: isVisible,
      });
    });

    return grouped;
  }, [visibleWidgets]);

  // Orden de categorías para mostrar
  const categoryOrder = [
    "Estructura",
    "Geografía",
    "Demografía",
    "Estado",
    "Roles",
  ];

  const handleExportData = async () => {
    if (selectedCampaigns.length === 0) {
      alert("Por favor selecciona al menos una campaña para exportar");
      return;
    }

    if (loadingUsers) {
      alert("Por favor espera a que se carguen los datos");
      return;
    }

    if (users.length === 0) {
      alert("No hay participantes en las campañas seleccionadas");
      return;
    }

    // Filtrar solo multiplicadores
    const multipliers = users.filter((user) => user.role === "MULTIPLIER");

    if (multipliers.length === 0) {
      alert("No hay multiplicadores en las campañas seleccionadas");
      return;
    }

    try {
      // Generar nombre de archivo con fecha y campañas
      const dateStr = new Date().toISOString().split("T")[0];
      const campaignNames = selectedCampaigns
        .map((c) => c.name.replace(/[^a-z0-9]/gi, "-"))
        .join("_");
      const filename = `multiplicadores_${campaignNames}_${dateStr}.csv`;

      // Convertir multiplicadores a CSV
      const csvContent = usersToCSV(multipliers);

      // Descargar archivo
      downloadCSV(csvContent, filename);
    } catch (error) {
      console.error("Error al exportar datos:", error);
      alert("Error al exportar los datos. Por favor intenta nuevamente.");
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
              <span className="ml-2 sm:ml-3 px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded whitespace-nowrap flex-shrink-0">
                Dirección
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 flex-shrink-0">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-sm font-medium ${
                  sidebarOpen
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                aria-label="Configurar Dashboard"
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
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
                <span className="hidden sm:inline">Configurar</span>
              </button>
              <button
                onClick={handleExportData}
                disabled={loadingUsers || selectedCampaigns.length === 0}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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

      <main className="max-w-7xl mx-auto py-3 sm:px-4 lg:px-6">
        <div className="flex gap-3">
          {/* Sidebar - Visible en desktop, oculto en móvil a menos que esté abierto */}
          <div className="hidden lg:block lg:flex-shrink-0">
            <DashboardSidebar
              isOpen={true}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
          {/* Sidebar móvil */}
          <div className="lg:hidden">
            <DashboardSidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
          {/* Contenido principal */}
          <div className="flex-1 min-w-0">
            <div className="px-3 py-3 sm:px-0">
              {/* Información para Admin */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-3">
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
                      Tienes acceso completo a todas las campañas, puedes
                      exportar datos con máscaras DLP y gestionar la
                      configuración de las campañas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Selector de Campaña */}
              <div className="mb-3">
                <CampaignSelector />
              </div>

              {/* KPIs con Gráficas agrupadas por categorías */}
              {kpis.totalCampaigns > 0 && (
                <div className="space-y-6 mb-3">
                  {/* Mapa de Participantes - Antes de Geografía */}
                  {visibleWidgets["campaigns-map"] && (
                    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                        <h2 className="text-lg font-semibold text-gray-800">
                          Mapa de Participantes
                        </h2>
                      </div>
                      <div className="p-4">
                        <CampaignsMap />
                      </div>
                    </div>
                  )}

                  {categoryOrder.map((category) => {
                    // Filtrar widgets visibles, excluyendo el mapa que se renderiza por separado
                    const widgets =
                      widgetsByCategory[category]?.filter(
                        (w) => w.visible && w.id !== "campaigns-map"
                      ) || [];

                    if (widgets.length === 0) return null;

                    // Renderizar cada widget según su ID (sin título si hay un solo widget)
                    const renderWidget = (
                      widgetId: string,
                      showTitle: boolean
                    ) => {
                      switch (widgetId) {
                        case "area-type-pie":
                          return (
                            <>
                              {showTitle && (
                                <h3 className="text-base font-semibold text-gray-900 mb-2">
                                  Distribución Urbano/Rural
                                </h3>
                              )}
                              <AreaTypePieChart
                                data={kpis.areaTypeDistribution}
                              />
                              <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                                <div>
                                  <p className="text-xl font-bold text-blue-600">
                                    {kpis.areaTypeDistribution.urban.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    Urbano
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {kpis.areaTypePercentages.urban}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xl font-bold text-green-600">
                                    {kpis.areaTypeDistribution.rural.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-gray-600">Rural</p>
                                  <p className="text-xs text-gray-500">
                                    {kpis.areaTypePercentages.rural}%
                                  </p>
                                </div>
                              </div>
                            </>
                          );

                        case "gender-pie":
                          return (
                            <>
                              {showTitle && (
                                <h3 className="text-base font-semibold text-gray-900 mb-2">
                                  Distribución por Sexo
                                </h3>
                              )}
                              <GenderPieChart data={kpis.genderDistribution} />
                              <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                                <div>
                                  <p className="text-xl font-bold text-blue-600">
                                    {kpis.genderDistribution.male.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    Masculino
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {kpis.genderPercentages.male}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xl font-bold text-pink-600">
                                    {kpis.genderDistribution.female.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    Femenino
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {kpis.genderPercentages.female}%
                                  </p>
                                </div>
                              </div>
                            </>
                          );

                        case "campaign-status-line":
                          return (
                            <>
                              {showTitle && (
                                <h3 className="text-base font-semibold text-gray-900 mb-2">
                                  Estado de Campañas
                                </h3>
                              )}
                              <CampaignStatusLineChart
                                data={{
                                  inProgress: kpis.campaignsInProgress,
                                  completed: kpis.campaignsCompleted,
                                  notStarted: kpis.campaignsNotStarted,
                                }}
                              />
                            </>
                          );

                        case "professions-bar":
                          return (
                            <>
                              {showTitle && (
                                <h3 className="text-base font-semibold text-gray-900 mb-2">
                                  Top Profesiones
                                </h3>
                              )}
                              <ProfessionsBarChart data={kpis.topProfessions} />
                            </>
                          );

                        case "department-bar":
                          return (
                            <>
                              {showTitle && (
                                <h3 className="text-base font-semibold text-gray-900 mb-2">
                                  Distribución por Departamento
                                </h3>
                              )}
                              <DepartmentBarChart
                                data={kpis.departmentDistribution}
                              />
                            </>
                          );

                        case "city-bar":
                          return (
                            <>
                              {showTitle && (
                                <h3 className="text-base font-semibold text-gray-900 mb-2">
                                  Distribución por Ciudad
                                </h3>
                              )}
                              <CityBarChart data={kpis.cityDistribution} />
                            </>
                          );

                        case "role-bar":
                          return (
                            <>
                              {showTitle && (
                                <h3 className="text-base font-semibold text-gray-900 mb-2">
                                  Distribución por Rol
                                </h3>
                              )}
                              <RoleBarChart data={kpis.roleDistribution} />
                            </>
                          );

                        case "team-tree":
                          return <TeamTreeCanvas />;

                        default:
                          return null;
                      }
                    };

                    // Determinar layout según cantidad de widgets
                    const colsClass =
                      widgets.length === 1
                        ? "grid-cols-1"
                        : widgets.length === 2
                        ? "grid-cols-1 lg:grid-cols-2"
                        : "grid-cols-1 lg:grid-cols-2";

                    return (
                      <div
                        key={category}
                        className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
                      >
                        {/* Header de la tarjeta de categoría */}
                        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                          <h2 className="text-lg font-semibold text-gray-800">
                            {category}
                          </h2>
                        </div>
                        {/* Contenido de la tarjeta - Grid de widgets */}
                        <div className={`p-4 grid ${colsClass} gap-4`}>
                          {widgets.map((widget) => (
                            <div key={widget.id} className="min-w-0">
                              {renderWidget(widget.id, widgets.length > 1)}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Mensaje cuando no hay campañas seleccionadas */}
              {kpis.totalCampaigns === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
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
          </div>
        </div>
      </main>
    </>
  );
}
