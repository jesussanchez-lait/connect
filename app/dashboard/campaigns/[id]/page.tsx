"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { AuthGuard } from "@/src/presentation/components/layout/AuthGuard";
import {
  RoleProvider,
  useRole,
  ROLES,
} from "@/src/presentation/contexts/RoleContext";
import { useAuth } from "@/src/presentation/hooks/useAuth";
import { ApiClient } from "@/src/infrastructure/api/ApiClient";

interface CampaignDetail {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  participants: number;
  createdAt: string;
  // Datos adicionales para SUPER_ADMIN/ADMIN
  totalMultipliers?: number;
  totalFollowers?: number;
  totalCoordinators?: number;
  totalLinks?: number;
  growthRate?: number;
  activeZones?: number;
  budget?: {
    allocated: number;
    spent: number;
    remaining: number;
  };
  metrics?: {
    registrationsToday: number;
    registrationsThisWeek: number;
    registrationsThisMonth: number;
  };
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

function CampaignDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { role, loading: roleLoading } = useRole();
  const campaignId = params.id as string;
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiClientRef = useRef(new ApiClient());

  // Mostrar skeleton mientras se verifica el rol
  const isLoadingRole = roleLoading;

  const fetchCampaignDetail = useCallback(async () => {
    if (!campaignId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await apiClientRef.current.get<CampaignDetail>(
        `/dashboard/campaigns/${campaignId}`
      );
      setCampaign(data);
    } catch (err) {
      console.error("Error fetching campaign detail:", err);
      setError(
        err instanceof Error ? err.message : "Error al cargar la campaña"
      );
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    if (campaignId) {
      fetchCampaignDetail();
    }
  }, [campaignId, fetchCampaignDetail]);

  // Renderizar siempre la navegación para transición suave
  const renderNav = () => (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Volver"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            {isLoadingRole || loading ? (
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
            ) : campaign ? (
              <>
                <h1 className="text-xl font-semibold text-gray-900">
                  {campaign.name}
                </h1>
                {role && (
                  <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded">
                    {role === ROLES.SUPER_ADMIN
                      ? "Soporte Técnico"
                      : "Dirección"}
                  </span>
                )}
              </>
            ) : (
              <h1 className="text-xl font-semibold text-gray-900">Connect</h1>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  );

  // Verificar permisos solo cuando el rol esté cargado
  if (
    !isLoadingRole &&
    role &&
    role !== ROLES.ADMIN &&
    role !== ROLES.SUPER_ADMIN
  ) {
    return (
      <>
        {renderNav()}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Acceso Denegado
              </h2>
              <p className="text-gray-600 mb-4">
                Solo los administradores pueden ver los detalles de las
                campañas.
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Volver al Dashboard
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Mostrar skeleton mientras carga
  if (isLoadingRole || loading) {
    return (
      <>
        {renderNav()}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="animate-pulse space-y-6">
              {/* Información General Skeleton */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              </div>
              {/* Métricas Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-6">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
              {/* Presupuesto Skeleton */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i}>
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (error || !campaign) {
    return (
      <>
        {renderNav()}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Error al cargar la campaña
              </h2>
              <p className="text-gray-600 mb-4">
                {error || "Campaña no encontrada"}
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Volver al Dashboard
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      {renderNav()}

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Información General */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Información General
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Descripción
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  {campaign.description}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Estado
                </label>
                <span
                  className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${
                    campaign.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {campaign.status === "active" ? "Activa" : "Inactiva"}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Fecha de Inicio
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(campaign.startDate).toLocaleDateString("es-CO", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Fecha de Fin
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(campaign.endDate).toLocaleDateString("es-CO", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Métricas Principales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Total Participantes
              </h3>
              <p className="text-3xl font-bold text-gray-900">
                {campaign.participants.toLocaleString()}
              </p>
            </div>
            {campaign.totalMultipliers !== undefined && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Multiplicadores
                </h3>
                <p className="text-3xl font-bold text-blue-600">
                  {campaign.totalMultipliers.toLocaleString()}
                </p>
              </div>
            )}
            {campaign.totalFollowers !== undefined && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Seguidores
                </h3>
                <p className="text-3xl font-bold text-green-600">
                  {campaign.totalFollowers.toLocaleString()}
                </p>
              </div>
            )}
            {campaign.activeZones !== undefined && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Zonas Activas
                </h3>
                <p className="text-3xl font-bold text-purple-600">
                  {campaign.activeZones.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Métricas de Crecimiento */}
          {campaign.metrics && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Métricas de Crecimiento
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Registros Hoy
                  </label>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {campaign.metrics.registrationsToday}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Registros Esta Semana
                  </label>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {campaign.metrics.registrationsThisWeek}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Registros Este Mes
                  </label>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {campaign.metrics.registrationsThisMonth}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Presupuesto */}
          {campaign.budget && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Presupuesto
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Asignado
                  </label>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ${campaign.budget.allocated.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Gastado
                  </label>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    ${campaign.budget.spent.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Restante
                  </label>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    ${campaign.budget.remaining.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${
                        (campaign.budget.spent / campaign.budget.allocated) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {(
                    (campaign.budget.spent / campaign.budget.allocated) *
                    100
                  ).toFixed(1)}
                  % del presupuesto utilizado
                </p>
              </div>
            </div>
          )}

          {/* Desglose por Roles */}
          {(campaign.totalCoordinators !== undefined ||
            campaign.totalLinks !== undefined) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Desglose por Roles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {campaign.totalCoordinators !== undefined && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Coordinadores
                    </label>
                    <p className="text-2xl font-bold text-purple-600 mt-1">
                      {campaign.totalCoordinators}
                    </p>
                  </div>
                )}
                {campaign.totalLinks !== undefined && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Enlaces Municipales
                    </label>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {campaign.totalLinks}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function CampaignDetailPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AuthGuard requireAuth={true}>
        <RoleProvider>
          <CampaignDetailContent />
        </RoleProvider>
      </AuthGuard>
    </div>
  );
}
