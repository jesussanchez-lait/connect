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
import { Campaign } from "@/src/domain/entities/Campaign";
import { CampaignBrochureManager } from "./CampaignBrochureManager";
import { useToast } from "@/src/presentation/contexts/ToastContext";

function CampaignRegistrationLink({
  campaign,
  showCampaignName = false,
}: {
  campaign: Campaign;
  showCampaignName?: boolean;
}) {
  const { showSuccess, showError } = useToast();
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "";
  const registrationUrl = `${baseUrl}/register?campaignId=${campaign.id}`;

  const handleCopyLink = () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = registrationUrl;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        showSuccess("Link copiado al portapapeles");
      } catch (err) {
        showError("No se pudo copiar el link. Por favor, cópialo manualmente.");
      }
      document.body.removeChild(textArea);
      return;
    }

    navigator.clipboard.writeText(registrationUrl).then(
      () => {
        showSuccess("Link copiado al portapapeles");
      },
      () => {
        // Fallback si falla la API
        const textArea = document.createElement("textarea");
        textArea.value = registrationUrl;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand("copy");
          showSuccess("Link copiado al portapapeles");
        } catch (err) {
          showError(
            "No se pudo copiar el link. Por favor, cópialo manualmente."
          );
        }
        document.body.removeChild(textArea);
      }
    );
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `¡Únete como multiplicador a la campaña ${campaign.name}!\n\nRegístrate aquí: ${registrationUrl}`
    );
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="space-y-2">
      {showCampaignName && (
        <p className="text-xs font-medium text-indigo-700 mb-1">
          {campaign.name}
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex items-center bg-white rounded border border-indigo-200 px-2 sm:px-3 py-2 min-w-0">
          <input
            type="text"
            readOnly
            value={registrationUrl}
            className="flex-1 text-xs sm:text-sm text-gray-700 bg-transparent border-none outline-none min-w-0 truncate"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            onClick={handleCopyLink}
            className="ml-2 p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded transition-colors flex-shrink-0"
            aria-label="Copiar link"
            title="Copiar link"
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
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>
        </div>
        <button
          onClick={handleShareWhatsApp}
          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors text-sm font-medium whitespace-nowrap"
          aria-label="Compartir en WhatsApp"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          <span className="hidden sm:inline">Compartir en WhatsApp</span>
          <span className="sm:hidden">WhatsApp</span>
        </button>
      </div>
    </div>
  );
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
  const { showError, showWarning } = useToast();

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
      "professions-bar": getWidgetVisibility("professions-bar"),
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
      showWarning("Por favor selecciona al menos una campaña para exportar");
      return;
    }

    if (loadingUsers) {
      showWarning("Por favor espera a que se carguen los datos");
      return;
    }

    if (users.length === 0) {
      showWarning("No hay participantes en las campañas seleccionadas");
      return;
    }

    // Filtrar solo multiplicadores y excluir al administrador actual
    const multipliers = users.filter(
      (u) => u.role === "MULTIPLIER" && u.id !== user?.id
    );

    if (multipliers.length === 0) {
      showWarning("No hay multiplicadores en las campañas seleccionadas");
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
      showError("Error al exportar los datos. Por favor intenta nuevamente.");
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
              {/* Link de Registro para Multiplicadores */}
              {selectedCampaigns.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 sm:p-4 mb-3">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-indigo-600 mt-0.5 mr-3 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-indigo-800 mb-2">
                        Link de Registro para Multiplicadores
                      </h3>
                      {selectedCampaigns.length === 1 ? (
                        <CampaignRegistrationLink
                          campaign={selectedCampaigns[0]}
                          showCampaignName={false}
                        />
                      ) : (
                        <div className="space-y-3">
                          {selectedCampaigns.map((campaign) => (
                            <CampaignRegistrationLink
                              key={campaign.id}
                              campaign={campaign}
                              showCampaignName={true}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Selector de Campaña */}
              <div className="mb-3">
                <CampaignSelector />
              </div>

              {/* Gestor de PDF de Propuestas */}
              {selectedCampaigns.length > 0 && (
                <div className="mb-3">
                  <CampaignBrochureManager />
                </div>
              )}

              {/* KPIs con Gráficas agrupadas por categorías */}
              {kpis.totalCampaigns > 0 && (
                <div className="space-y-4 mb-3">
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

                    // Para Geografía: si hay número impar de widgets, el último ocupa ancho completo
                    const isGeography = category === "Geografía";
                    const isOddCount = widgets.length % 2 !== 0;
                    const shouldSpanFullWidth =
                      isGeography && isOddCount && widgets.length > 1;

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
                          {widgets.map((widget, index) => {
                            const isLast = index === widgets.length - 1;
                            const spanFullWidth = shouldSpanFullWidth && isLast;
                            return (
                              <div
                                key={widget.id}
                                className={`min-w-0 ${
                                  spanFullWidth ? "lg:col-span-2" : ""
                                }`}
                              >
                                {renderWidget(widget.id, widgets.length > 1)}
                              </div>
                            );
                          })}
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
